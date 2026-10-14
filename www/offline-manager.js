// ============================================================================
// SAMAPE 2.0 - GERENCIADOR DE MODO OFFLINE E FILA DE SINCRONIZAÇÃO (OUTBOX)
// Permite que mecânicos trabalhem 100% offline em lavouras e fazendas.
// ============================================================================

const OfflineManager = (() => {
  const QUEUE_KEY = 'samape_offline_sync_queue';
  const SNAPSHOT_PREFIX = 'samape_snap_';
  const ID_MAP_KEY = 'samape_offline_id_map';

  let _isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  let _isSyncing = false;
  let _listeners = [];
  let _heartbeatTimer = null;

  // --------------------------------------------------------------------------
  // 1. GERAÇÃO DE IDENTIFICADORES PROVISÓRIOS (Sem conflito com o PostgreSQL)
  // --------------------------------------------------------------------------
  function gerarIdProvisorio(prefixo = 'os') {
    const timestamp = Date.now();
    const aleatorio = Math.random().toString(36).substring(2, 7);
    return `temp_${prefixo}_${timestamp}_${aleatorio}`;
  }

  function gerarNumeroOSProvisorio() {
    // Número provisório visível para o mecânico (ex: OFF-4821)
    const sufixo = String(Date.now()).slice(-4);
    return `OFF-${sufixo}`;
  }

  // --------------------------------------------------------------------------
  // 2. CONTROLE DE ESTADO DE CONEXÃO & HEARTBEAT
  // --------------------------------------------------------------------------
  function setOnline(online) {
    if (_isOnline !== online) {
      _isOnline = online;
      console.log(`📶 Status da Conexão alterado: ${_isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}`);
      notificarOuvintes({ tipo: 'conexao', online: _isOnline });
      atualizarUIConexao();

      // Se acabou de voltar a ficar online, dispara auto-sincronização
      if (_isOnline) {
        setTimeout(() => {
          sincronizarFila();
        }, 1200);
      }
    }
  }

  // Testa conexão real contra o servidor (evita falsos positivos de Wi-Fi sem internet)
  async function testarConexaoReal() {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setOnline(false);
      return false;
    }

    try {
      const baseUrl = (typeof API_CONFIG !== 'undefined' && API_CONFIG.BASE_URL)
        ? API_CONFIG.BASE_URL
        : `${window.location.origin}/api`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const resp = await fetch(`${baseUrl}/check-updates`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        setOnline(true);
        return true;
      } else {
        setOnline(false);
        return false;
      }
    } catch (e) {
      setOnline(false);
      return false;
    }
  }

  function iniciarMonitoramento() {
    window.addEventListener('online', () => {
      console.log('🌐 Evento nativo: Online detectado. Validando servidor...');
      testarConexaoReal();
    });

    window.addEventListener('offline', () => {
      console.log('📡 Evento nativo: Offline detectado.');
      setOnline(false);
    });

    // Heartbeat a cada 25 segundos para garantir estado real
    if (_heartbeatTimer) clearInterval(_heartbeatTimer);
    _heartbeatTimer = setInterval(testarConexaoReal, 25000);

    // Teste inicial após carregar
    setTimeout(testarConexaoReal, 1500);
  }

  // --------------------------------------------------------------------------
  // 3. PERSISTÊNCIA DE SNAPSHOTS LOCAIS (Dados Mestres)
  // --------------------------------------------------------------------------
  function salvarSnapshot(chave, dados) {
    try {
      if (!dados) return;
      localStorage.setItem(`${SNAPSHOT_PREFIX}${chave}`, JSON.stringify({
        dados,
        atualizadoEm: new Date().toISOString()
      }));
    } catch (e) {
      console.warn(`⚠️ Não foi possível salvar snapshot de ${chave}:`, e);
    }
  }

  function obterSnapshot(chave) {
    try {
      const bruto = localStorage.getItem(`${SNAPSHOT_PREFIX}${chave}`);
      if (!bruto) return null;
      const parsed = JSON.parse(bruto);
      return parsed.dados || null;
    } catch (e) {
      console.error(`Erro ao obter snapshot de ${chave}:`, e);
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // 4. FILA DE SINCRONIZAÇÃO (OUTBOX)
  // --------------------------------------------------------------------------
  function obterFila() {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Erro ao ler fila offline:', e);
      return [];
    }
  }

  function salvarFila(fila) {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(fila));
      notificarOuvintes({ tipo: 'fila', total: fila.length });
      atualizarUIConexao();
    } catch (e) {
      console.error('Erro ao salvar fila offline:', e);
    }
  }

  function enfileirarAcao(acao) {
    const fila = obterFila();
    const item = {
      id: acao.id || `sync_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      tipo: acao.tipo, // 'CRIAR_OS', 'ATUALIZAR_OS', 'ADICIONAR_PECA', 'APONTAR_HORIMETRO'
      tempId: acao.tempId || null,
      targetId: acao.targetId || null,
      endpoint: acao.endpoint,
      metodo: acao.metodo || 'POST',
      payload: acao.payload || {},
      descricao: acao.descricao || 'Ação offline pendente',
      criadoEm: new Date().toISOString(),
      tentativas: 0
    };

    fila.push(item);
    salvarFila(fila);

    console.log(`📥 Ação enfileirada offline [${item.tipo}]:`, item);
    mostrarAvisoToast(`💾 Ação salva no aparelho (${fila.length} pendente${fila.length > 1 ? 's' : ''}).`);

    return item;
  }

  function removerAcao(id) {
    let fila = obterFila();
    fila = fila.filter(i => i.id !== id);
    salvarFila(fila);
  }

  function contarPendencias() {
    return obterFila().length;
  }

  // --------------------------------------------------------------------------
  // 5. MAPA DE IDs TEMPORÁRIOS -> IDs OFICIAIS DO POSTGRESQL
  // --------------------------------------------------------------------------
  function obterMapaIds() {
    try {
      const raw = localStorage.getItem(ID_MAP_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function salvarMapaId(tempId, idOficial, numeroOSOficial) {
    try {
      const mapa = obterMapaIds();
      mapa[tempId] = { id: idOficial, numero_os: numeroOSOficial };
      localStorage.setItem(ID_MAP_KEY, JSON.stringify(mapa));
    } catch (e) {}
  }

  // --------------------------------------------------------------------------
  // 6. MOTOR DE SINCRONIZAÇÃO AUTOMÁTICA
  // --------------------------------------------------------------------------
  async function sincronizarFila() {
    if (_isSyncing) {
      console.log('⏳ Sincronização já em andamento...');
      return;
    }

    const fila = obterFila();
    if (fila.length === 0) {
      console.log('✨ Nenhuma ação pendente na fila.');
      atualizarUIConexao();
      return;
    }

    const online = await testarConexaoReal();
    if (!online) {
      console.warn('⚠️ Não é possível sincronizar: Servidor offline.');
      mostrarAvisoToast('⚠️ Sem conexão com o servidor. A sincronização ocorrerá automaticamente quando o sinal voltar.', 'warning');
      return;
    }

    _isSyncing = true;
    atualizarUIConexao();
    notificarOuvintes({ tipo: 'sincronizando', status: true });

    let processadosComSucesso = 0;
    const mapaIds = obterMapaIds();

    console.log(`🚀 Iniciando sincronização de ${fila.length} ação(ões)...`);

    for (const item of [...fila]) {
      try {
        let sucesso = false;
        let resultado = null;

        // Se a ação depende de uma OS temporária que já foi criada, resolve o ID oficial
        let targetId = item.targetId;
        if (targetId && String(targetId).startsWith('temp_') && mapaIds[targetId]) {
          targetId = mapaIds[targetId].id;
        }

        // Executa a ação de acordo com o tipo
        if (item.tipo === 'CRIAR_OS') {
          // POST /api/ordens
          resultado = await window.api.criarOS(item.payload);
          if (resultado && resultado.success) {
            sucesso = true;
            const ordemCriada = resultado.ordem;
            const idOficial = ordemCriada.id;
            const numeroOficial = resultado.numero_os || ordemCriada.numero_os;

            // Salva no mapa de substituição
            if (item.tempId) {
              mapaIds[item.tempId] = { id: idOficial, numero_os: numeroOficial };
              salvarMapaId(item.tempId, idOficial, numeroOficial);

              // Atualiza na memória local (AppState) se existir
              if (typeof AppState !== 'undefined' && AppState && AppState.data && AppState.data.ordens) {
                const idx = AppState.data.ordens.findIndex(o => o.id === item.tempId);
                if (idx !== -1) {
                  AppState.data.ordens[idx] = {
                    ...AppState.data.ordens[idx],
                    id: idOficial,
                    numero_os: numeroOficial,
                    _isOffline: false
                  };
                }
              }
            }

            console.log(`✅ OS Criada no PostgreSQL: Oficial Nº ${numeroOficial} (ID ${idOficial})`);
          }

        } else if (item.tipo === 'ATUALIZAR_OS') {
          // PUT /api/ordens/:id
          const idParaAtualizar = targetId || (item.tempId && mapaIds[item.tempId] ? mapaIds[item.tempId].id : item.targetId);
          if (idParaAtualizar && !String(idParaAtualizar).startsWith('temp_')) {
            resultado = await window.api.atualizarOS(idParaAtualizar, item.payload);
            if (resultado && resultado.success) sucesso = true;
          } else {
            console.warn(`⏳ Aguardando criação da OS pai antes de atualizar ID ${item.targetId}`);
            continue; // Pula para a próxima ou espera próxima rodada
          }

        } else if (item.tipo === 'ADICIONAR_PECA_OS') {
          // POST /api/ordens/:id/pecas
          const idParaAdicionar = targetId || (item.tempId && mapaIds[item.tempId] ? mapaIds[item.tempId].id : item.targetId);
          if (idParaAdicionar && !String(idParaAdicionar).startsWith('temp_')) {
            resultado = await window.api.adicionarPecaOS(idParaAdicionar, item.payload);
            if (resultado && (resultado.success || resultado.item)) sucesso = true;
          } else {
            continue;
          }

        } else if (item.tipo === 'APONTAR_HORIMETRO') {
          resultado = await window.api.salvarApontamentoHorimetro(item.payload);
          if (resultado && resultado.success) sucesso = true;
        }

        if (sucesso) {
          removerAcao(item.id);
          processadosComSucesso++;
        } else {
          item.tentativas = (item.tentativas || 0) + 1;
          console.warn(`⚠️ Falha ao sincronizar item ${item.id}:`, resultado);
        }

      } catch (err) {
        console.error(`❌ Erro de requisição no item ${item.id}:`, err);
      }
    }

    _isSyncing = false;
    atualizarUIConexao();
    notificarOuvintes({ tipo: 'sincronizando', status: false });

    if (processadosComSucesso > 0) {
      mostrarAvisoToast(`✅ Sincronização concluída! ${processadosComSucesso} alteraç${processadosComSucesso > 1 ? 'ões enviadas' : 'ão enviada'} para o servidor.`);
      
      // Recarregar dados oficiais do servidor para atualizar a tela
      if (typeof loadAllData === 'function') {
        try {
          await loadAllData();
          if (typeof render === 'function') render();
        } catch (e) {}
      }
    }
  }

  // --------------------------------------------------------------------------
  // 7. COMPONENTES VISUAIS & FEEDBACK NA INTERFACE (BARRA & TOASTS)
  // --------------------------------------------------------------------------
  function registrarOuvinte(fn) {
    _listeners.push(fn);
  }

  function notificarOuvintes(evento) {
    _listeners.forEach(fn => {
      try { fn(evento); } catch (e) {}
    });
  }

  function atualizarUIConexao() {
    let barra = document.getElementById('samape-offline-status-bar');
    if (!barra) {
      barra = document.createElement('div');
      barra.id = 'samape-offline-status-bar';
      document.body.prepend(barra);
    }

    const pendencias = contarPendencias();

    if (!_isOnline) {
      // ESTADO OFFLINE
      barra.style.cssText = `
        position: sticky; top: 0; left: 0; width: 100%; z-index: 9999;
        background: linear-gradient(90deg, #b45309, #d97706);
        color: #ffffff; padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: 600;
        display: flex; align-items: center; justify-content: space-between;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3); font-family: inherit;
      `;
      barra.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <span style="font-size: 1.1rem; animation: pulse 1.5s infinite alternate;">📡</span>
          <span><strong>Modo Offline (Sem Internet):</strong> Os apontamentos serão gravados com segurança no aparelho.</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          ${pendencias > 0 ? `<span style="background: rgba(0,0,0,0.25); padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.78rem;">${pendencias} pendente${pendencias > 1 ? 's' : ''}</span>` : ''}
          <button onclick="OfflineManager.testarConexaoReal()" style="
            background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4);
            color: white; padding: 0.25rem 0.65rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem;
          ">🔄 Testar Sinal</button>
        </div>
      `;
    } else if (pendencias > 0) {
      // ESTADO ONLINE COM PENDÊNCIAS
      barra.style.cssText = `
        position: sticky; top: 0; left: 0; width: 100%; z-index: 9999;
        background: linear-gradient(90deg, #1d4ed8, #2563eb);
        color: #ffffff; padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: 600;
        display: flex; align-items: center; justify-content: space-between;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3); font-family: inherit;
      `;
      barra.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <span style="font-size: 1.1rem;">📶</span>
          <span>Sinal restabelecido! Existem <strong>${pendencias}</strong> alteraç${pendencias > 1 ? 'ões pendentes' : 'ão pendente'}.</span>
        </div>
        <div>
          <button onclick="OfflineManager.sincronizarFila()" ${_isSyncing ? 'disabled' : ''} style="
            background: #10b981; border: none; color: white; padding: 0.3rem 0.85rem;
            border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 700;
            display: flex; align-items: center; gap: 0.4rem;
          ">
            ${_isSyncing ? '⏳ Sincronizando...' : '🔄 Sincronizar Agora'}
          </button>
        </div>
      `;
    } else {
      // ESTADO ONLINE E TOTALMENTE SINCRONIZADO
      barra.style.display = 'none';
      barra.innerHTML = '';
    }
  }

  function mostrarAvisoToast(mensagem, tipo = 'info') {
    let container = document.getElementById('samape-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'samape-toast-container';
      container.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; z-index: 100000;
        display: flex; flex-direction: column; gap: 8px; pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const corBg = tipo === 'warning' ? '#b45309' : (tipo === 'success' ? '#059669' : '#1e293b');
    toast.style.cssText = `
      background: ${corBg}; color: white; padding: 0.75rem 1.25rem; border-radius: 10px;
      font-size: 0.88rem; font-weight: 600; box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      display: flex; align-items: center; gap: 0.6rem; pointer-events: auto;
      animation: fadeIn 0.3s ease; border: 1px solid rgba(255,255,255,0.15); font-family: inherit;
    `;
    toast.innerHTML = mensagem;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }

  // Inicializar automaticamente ao carregar
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
      iniciarMonitoramento();
      atualizarUIConexao();
    });
  }

  return {
    isOnline: () => _isOnline,
    testarConexaoReal,
    gerarIdProvisorio,
    gerarNumeroOSProvisorio,
    salvarSnapshot,
    obterSnapshot,
    enfileirarAcao,
    obterFila,
    contarPendencias,
    sincronizarFila,
    registrarOuvinte,
    atualizarUIConexao,
    mostrarAvisoToast
  };
})();

window.OfflineManager = OfflineManager;
