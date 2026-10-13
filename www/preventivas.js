// ==========================================================================
// MÓDULO DE MANUTENÇÃO PREVENTIVA PREDITIVA — SAMAPE 20
// Monitoramento estatístico de horímetros, semáforos e disparos de comunicados
// ==========================================================================

// Estado local do módulo
const PreventivasState = {
  carregando: false,
  maquinas: [],
  stats: { total: 0, em_dia: 0, atencao: 0, vencida: 0 },
  filtros: {
    busca: '',
    status: ''
  }
};

// Inicialização e carregamento de dados
async function carregarPreventivas(forcar = false) {
  if (PreventivasState.carregando && !forcar) return;
  PreventivasState.carregando = true;

  try {
    const res = await window.api.listarPreventivas();
    if (res && res.success) {
      PreventivasState.maquinas = res.maquinas || [];
      PreventivasState.stats = res.stats || { total: 0, em_dia: 0, atencao: 0, vencida: 0 };
    } else {
      console.warn('Falha ao carregar preventivas:', res?.message);
    }
  } catch (error) {
    console.error('Erro ao buscar dados de preventivas:', error);
  } finally {
    PreventivasState.carregando = false;
  }
}

// Renderização principal da página
function renderPreventivas() {
  if (!PreventivasState.maquinas || PreventivasState.maquinas.length === 0) {
    if (!PreventivasState.carregando) {
      carregarPreventivas().then(() => render());
    }
  }

  const { total, em_dia, atencao, vencida } = PreventivasState.stats;
  const busca = (PreventivasState.filtros.busca || '').toLowerCase().trim();
  const filtroStatus = PreventivasState.filtros.status || '';

  const maquinasFiltradas = PreventivasState.maquinas.filter(m => {
    const matchBusca = !busca ||
      (m.modelo && m.modelo.toLowerCase().includes(busca)) ||
      (m.id_frota && m.id_frota.toLowerCase().includes(busca)) ||
      (m.cliente_nome && m.cliente_nome.toLowerCase().includes(busca)) ||
      (m.numero_serie && m.numero_serie.toLowerCase().includes(busca));

    const matchStatus = !filtroStatus || (m.preditivo && m.preditivo.status === filtroStatus);
    return matchBusca && matchStatus;
  });

  return `
    <div class="preventivas-container" style="display: flex; flex-direction: column; gap: 1.5rem;">
      
      <!-- Cabeçalho com Título e Ações Rápidas -->
      <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h1 class="page-title" style="display: flex; align-items: center; gap: 0.6rem; margin: 0; font-size: 1.6rem; color: var(--text-primary);">
            <span>📅</span>
            <span>Manutenção Preventiva Preditiva</span>
          </h1>
          <p class="page-subtitle" style="margin: 0.35rem 0 0 0; color: var(--text-secondary); font-size: 0.9rem;">
            Monitoramento de horímetros e projeção inteligente de paradas para pedreiras
          </p>
        </div>

        <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
          <button class="btn btn-outline" onclick="abrirModalEmailMecanicos()" style="display: flex; align-items: center; gap: 0.4rem;" title="Disparar boletim informativo aos mecânicos">
            <span>📧</span>
            <span>Informativo aos Mecânicos</span>
          </button>
          <button class="btn btn-primary" onclick="abrirModalApontamento()" style="display: flex; align-items: center; gap: 0.4rem;" title="Registrar leitura rápida de horímetro">
            <span>⏱️</span>
            <span>Apontar Horímetro</span>
          </button>
          <button class="btn btn-icon" onclick="recarregarPreventivas()" title="Atualizar dados" style="background: var(--bg-card); border: 1px solid var(--border);">
            <span>🔄</span>
          </button>
        </div>
      </div>

      <!-- Cards de Métricas / Semáforo Geral -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        
        <div class="card" style="padding: 1.25rem; display: flex; align-items: center; gap: 1rem; cursor: pointer; border-left: 4px solid var(--primary);" onclick="filtrarStatusPreventiva('')">
          <div style="font-size: 2rem;">🚜</div>
          <div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Frota Monitorada</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary);">${total || 0}</div>
          </div>
        </div>

        <div class="card" style="padding: 1.25rem; display: flex; align-items: center; gap: 1rem; cursor: pointer; border-left: 4px solid #10b981; ${filtroStatus === 'EM_DIA' ? 'box-shadow: 0 0 0 2px #10b981;' : ''}" onclick="filtrarStatusPreventiva('EM_DIA')">
          <div style="font-size: 2rem;">🟢</div>
          <div>
            <div style="font-size: 0.8rem; color: #10b981; text-transform: uppercase; font-weight: 700;">Em Dia (&gt; 40h)</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #10b981;">${em_dia || 0}</div>
          </div>
        </div>

        <div class="card" style="padding: 1.25rem; display: flex; align-items: center; gap: 1rem; cursor: pointer; border-left: 4px solid #f59e0b; ${filtroStatus === 'ATENCAO' ? 'box-shadow: 0 0 0 2px #f59e0b;' : ''}" onclick="filtrarStatusPreventiva('ATENCAO')">
          <div style="font-size: 2rem;">🟡</div>
          <div>
            <div style="font-size: 0.8rem; color: #f59e0b; text-transform: uppercase; font-weight: 700;">Atenção (&le; 40h)</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #f59e0b;">${atencao || 0}</div>
          </div>
        </div>

        <div class="card" style="padding: 1.25rem; display: flex; align-items: center; gap: 1rem; cursor: pointer; border-left: 4px solid #ef4444; ${filtroStatus === 'VENCIDA' ? 'box-shadow: 0 0 0 2px #ef4444;' : ''}" onclick="filtrarStatusPreventiva('VENCIDA')">
          <div style="font-size: 2rem;">🔴</div>
          <div>
            <div style="font-size: 0.8rem; color: #ef4444; text-transform: uppercase; font-weight: 700;">Vencidas (&le; 0h)</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #ef4444;">${vencida || 0}</div>
          </div>
        </div>

      </div>

      <!-- Barra de Filtros e Busca -->
      <div class="card" style="padding: 1rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; justify-content: space-between;">
        <div style="display: flex; gap: 0.75rem; flex: 1; min-width: 280px; align-items: center;">
          <input 
            type="text" 
            class="form-input" 
            placeholder="🔍 Buscar por modelo, ID Frota, série ou cliente..." 
            value="${PreventivasState.filtros.busca || ''}" 
            oninput="filtrarBuscaPreventiva(this.value)"
            style="margin: 0;"
          />
        </div>

        <div style="display: flex; gap: 0.75rem; align-items: center;">
          <select class="form-input" onchange="filtrarStatusPreventiva(this.value)" style="margin: 0; min-width: 170px;">
            <option value="" ${!filtroStatus ? 'selected' : ''}>Todos os Status</option>
            <option value="VENCIDA" ${filtroStatus === 'VENCIDA' ? 'selected' : ''}>🔴 Apenas Vencidas</option>
            <option value="ATENCAO" ${filtroStatus === 'ATENCAO' ? 'selected' : ''}>🟡 Apenas em Atenção</option>
            <option value="EM_DIA" ${filtroStatus === 'EM_DIA' ? 'selected' : ''}>🟢 Apenas em Dia</option>
          </select>
        </div>
      </div>

      <!-- Tabela de Equipamentos e Preventivas -->
      ${maquinasFiltradas.length === 0 ? `
        <div class="card" style="text-align: center; padding: 3rem 1rem;">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">🚜</div>
          <h3 style="margin: 0; color: var(--text-primary);">Nenhum equipamento encontrado</h3>
          <p style="color: var(--text-secondary); margin-top: 0.5rem;">Nenhuma máquina corresponde aos filtros selecionados.</p>
        </div>
      ` : `
        <div class="table-container card" style="padding: 0; overflow-x: auto; border: 1px solid var(--border); border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background: var(--bg-secondary); border-bottom: 1px solid var(--border);">
                <th style="padding: 0.85rem 1rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 700;">Status</th>
                <th style="padding: 0.85rem 1rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 700;">Equipamento / Frota</th>
                <th style="padding: 0.85rem 1rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 700;">Cliente / Pedreira</th>
                <th style="padding: 0.85rem 1rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 700;">Horímetro Estimado</th>
                <th style="padding: 0.85rem 1rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 700;">Próxima Revisão</th>
                <th style="padding: 0.85rem 1rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 700;">Previsão</th>
                <th style="padding: 0.85rem 1rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 700; text-align: center;">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${maquinasFiltradas.map(m => renderLinhaTabelaPreventiva(m)).join('')}
            </tbody>
          </table>
        </div>
      `}

    </div>
  `;
}

// Renderiza a linha de cada máquina na tabela
function renderLinhaTabelaPreventiva(m) {
  const p = m.preditivo || {};
  const statusColors = {
    EM_DIA: { bg: 'rgba(16, 185, 129, 0.12)', border: '#10b981', text: '#10b981', label: '🟢 Em dia' },
    ATENCAO: { bg: 'rgba(245, 158, 11, 0.12)', border: '#f59e0b', text: '#f59e0b', label: '🟡 Atenção' },
    VENCIDA: { bg: 'rgba(239, 68, 68, 0.12)', border: '#ef4444', text: '#ef4444', label: '🔴 Vencida' }
  };

  const st = statusColors[p.status] || statusColors.EM_DIA;
  const dataPrevistaFormatada = p.dataPrevista ? new Date(p.dataPrevista).toLocaleDateString('pt-BR') : 'A definir';

  // Mensagem da previsão
  let textoPrevisao = '';
  if (p.horasRestantes <= 0) {
    textoPrevisao = `<span style="color: #ef4444; font-weight: 700;">Venceu há ${Math.abs(p.horasRestantes)} h!</span>`;
  } else {
    textoPrevisao = `<span style="font-weight: 600; color: var(--text-primary);">~ ${p.diasRestantes} dias úteis</span> <span style="font-size: 0.75rem; color: var(--text-muted);">(${dataPrevistaFormatada})</span>`;
  }

  return `
    <tr 
      onclick="abrirModalDetalhesMaquina(${m.id})" 
      style="cursor: pointer; border-bottom: 1px solid var(--border); transition: background 0.15s ease;"
      onmouseover="this.style.background='var(--bg-secondary)'" 
      onmouseout="this.style.background='transparent'"
      title="Clique para abrir detalhes e ações da preventiva"
    >
      <!-- Status Semáforo -->
      <td style="padding: 0.85rem 1rem; white-space: nowrap;">
        <span style="font-size: 0.75rem; font-weight: 700; padding: 4px 9px; border-radius: 12px; background: ${st.bg}; color: ${st.text}; border: 1px solid ${st.border};">
          ${st.label}
        </span>
      </td>

      <!-- Equipamento & Frota -->
      <td style="padding: 0.85rem 1rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          ${m.id_frota ? `
            <span style="font-size: 0.75rem; font-weight: 700; color: var(--primary); background: var(--bg-secondary); border: 1px solid var(--border); padding: 2px 6px; border-radius: 4px;">
              ${m.id_frota}
            </span>
          ` : ''}
          <div>
            <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">
              ${m.modelo || 'Máquina'}
            </div>
            ${m.numero_serie ? `<div style="font-size: 0.75rem; color: var(--text-muted);">S/N: ${m.numero_serie}</div>` : ''}
          </div>
        </div>
      </td>

      <!-- Cliente / Pedreira -->
      <td style="padding: 0.85rem 1rem; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        <span style="color: var(--text-primary); font-weight: 500;">
          🏢 ${m.cliente_nome || 'Não vinculado'}
        </span>
      </td>

      <!-- Horímetro Estimado & Progresso -->
      <td style="padding: 0.85rem 1rem; min-width: 170px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 3px;">
          <span style="font-family: monospace; font-size: 1.05rem; font-weight: 800; color: var(--primary);">
            ~ ${p.horimetroEstimado} h
          </span>
          <span style="font-size: 0.75rem; color: var(--text-secondary);">
            ${p.horasDia}h/dia
          </span>
        </div>
        <div style="width: 100%; height: 5px; background: var(--border); border-radius: 3px; overflow: hidden;" title="${p.progressoPercentual}% até Revisão ${p.proximaRevisaoHoras}h">
          <div style="width: ${p.progressoPercentual}%; height: 100%; background: ${st.border}; border-radius: 3px;"></div>
        </div>
      </td>

      <!-- Próxima Revisão -->
      <td style="padding: 0.85rem 1rem; white-space: nowrap;">
        <div style="font-weight: 700; color: ${st.text};">
          Revisão ${p.proximaRevisaoHoras} h
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">
          ${p.horasRestantes > 0 ? `Faltam ${p.horasRestantes} h` : `Excedido em ${Math.abs(p.horasRestantes)} h`}
        </div>
      </td>

      <!-- Previsão -->
      <td style="padding: 0.85rem 1rem; white-space: nowrap;">
        ${textoPrevisao}
      </td>

      <!-- Ações -->
      <td style="padding: 0.85rem 1rem; text-align: center; white-space: nowrap;">
        <button 
          class="btn btn-sm btn-outline" 
          onclick="event.stopPropagation(); abrirModalDetalhesMaquina(${m.id})" 
          style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; font-size: 0.8rem; font-weight: 600;"
          title="Ver todos os detalhes e ações desta máquina"
        >
          <span>📋</span> <span>Detalhes</span>
        </button>
      </td>
    </tr>
  `;
}

// Modal de Detalhes da Preventiva da Máquina Selecionada
function abrirModalDetalhesMaquina(maquinaId) {
  const m = PreventivasState.maquinas.find(x => x.id === maquinaId);
  if (!m) return alert('Máquina não encontrada');

  const p = m.preditivo || {};
  const statusColors = {
    EM_DIA: { bg: 'rgba(16, 185, 129, 0.12)', border: '#10b981', text: '#10b981', label: '🟢 Em dia' },
    ATENCAO: { bg: 'rgba(245, 158, 11, 0.12)', border: '#f59e0b', text: '#f59e0b', label: '🟡 Atenção' },
    VENCIDA: { bg: 'rgba(239, 68, 68, 0.12)', border: '#ef4444', text: '#ef4444', label: '🔴 Vencida' }
  };

  const st = statusColors[p.status] || statusColors.EM_DIA;
  const dataPrevistaFormatada = p.dataPrevista ? new Date(p.dataPrevista).toLocaleDateString('pt-BR') : 'A definir';
  const dataAncoraFormatada = p.dataAncora ? new Date(p.dataAncora).toLocaleDateString('pt-BR') : '-';

  let textoPrazo = '';
  if (p.horasRestantes <= 0) {
    textoPrazo = `<span style="color: #ef4444; font-weight: 800;">🚨 REVISÃO VENCIDA HÁ ${Math.abs(p.horasRestantes)} HORAS!</span>`;
  } else {
    textoPrazo = `<span style="color: var(--text-primary); font-weight: 700;">Previsão da Próxima Parada: ~ ${p.diasRestantes} dias úteis (${dataPrevistaFormatada})</span>`;
  }

  const escalaNome = p.diasTrabalho === 'SEG_SAB' ? 'Segunda a Sábado (6 dias/sem)' : 'Segunda a Sexta (5 dias/sem)';

  const html = `
    <div class="modal-overlay" id="modal-detalhes-maq" style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem;">
      <div class="modal-container" style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; width: 100%; max-width: 780px; max-height: 92vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
        
        <!-- Header do Modal -->
        <div class="modal-header" style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary);">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="font-size: 1.8rem;">🚜</div>
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                ${m.id_frota ? `
                  <span style="font-size: 0.75rem; font-weight: 700; color: var(--primary); background: var(--bg-card); border: 1px solid var(--border); padding: 2px 6px; border-radius: 4px;">
                    ${m.id_frota}
                  </span>
                ` : ''}
                <h3 style="margin: 0; font-size: 1.25rem; color: var(--text-primary); font-weight: 700;">
                  ${m.modelo || 'Máquina'}
                </h3>
              </div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">
                🏢 ${m.cliente_nome || 'Cliente não vinculado'} ${m.numero_serie ? ` • S/N: ${m.numero_serie}` : ''}
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 0.85rem; font-weight: 700; padding: 5px 12px; border-radius: 14px; background: ${st.bg}; color: ${st.text}; border: 1px solid ${st.border};">
              ${st.label}
            </span>
            <button onclick="fecharModalDetalhesMaquina()" style="background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; padding: 0 4px;">&times;</button>
          </div>
        </div>

        <!-- Corpo do Modal -->
        <div class="modal-body" style="padding: 1.5rem; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 1.25rem;">
          
          <!-- Bloco 1: Destaque do Horímetro Estimado e Progresso do Ciclo -->
          <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-left: 5px solid ${st.border}; border-radius: 8px; padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.75rem;">
              <div>
                <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Horímetro Estimado Hoje</span>
                <div style="display: flex; align-items: baseline; gap: 0.4rem; margin-top: 2px;">
                  <span style="font-size: 2.2rem; font-weight: 800; color: var(--primary); font-family: monospace;">~ ${p.horimetroEstimado}</span>
                  <span style="font-size: 1.1rem; font-weight: 600; color: var(--text-secondary);">horas</span>
                </div>
              </div>

              <div style="text-align: right;">
                <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Próxima Meta</span>
                <div style="font-size: 1.3rem; font-weight: 800; color: ${st.text};">
                  Revisão ${p.proximaRevisaoHoras} h
                </div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">
                  ${p.horasRestantes > 0 ? `Faltam ${p.horasRestantes} h` : `Venceu há ${Math.abs(p.horasRestantes)} h`}
                </div>
              </div>
            </div>

            <!-- Barra de Progresso com Percentual -->
            <div style="margin-top: 0.5rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;">
                <span>Progresso do Ciclo (${p.intervaloRevisao}h)</span>
                <span><strong>${p.progressoPercentual}%</strong> atingido</span>
              </div>
              <div style="width: 100%; height: 9px; background: var(--border); border-radius: 5px; overflow: hidden;">
                <div style="width: ${p.progressoPercentual}%; height: 100%; background: ${st.border}; border-radius: 5px; transition: width 0.3s ease;"></div>
              </div>
            </div>

            <!-- Prazo / Previsão -->
            <div style="margin-top: 0.85rem; padding-top: 0.75rem; border-top: 1px dashed var(--border); font-size: 0.9rem;">
              ${textoPrazo}
            </div>
          </div>

          <!-- Bloco 2: Detalhes Técnicos & Histórico de Medição -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
            
            <!-- Coluna A: Parâmetros de Uso da Pedreira -->
            <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 1rem;">
              <h4 style="margin: 0 0 0.75rem 0; font-size: 0.9rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.4rem;">
                <span>⚙️</span> <span>Parâmetros de Operação</span>
              </h4>
              <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.85rem;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-secondary);">Regime Diário:</span>
                  <strong style="color: var(--text-primary);">${p.horasDia} horas / dia útil</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-secondary);">Escala Semanal:</span>
                  <span style="color: var(--text-primary); font-weight: 500;">${escalaNome}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-secondary);">Intervalo Padrão:</span>
                  <span style="color: var(--text-primary); font-weight: 500;">A cada ${p.intervaloRevisao} horas</span>
                </div>
              </div>
            </div>

            <!-- Coluna B: Histórico da Medição Âncora -->
            <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 1rem;">
              <h4 style="margin: 0 0 0.75rem 0; font-size: 0.9rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.4rem;">
                <span>⏱️</span> <span>Última Medição Real (Âncora)</span>
              </h4>
              <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.85rem;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-secondary);">Horímetro Registrado:</span>
                  <strong style="color: var(--text-primary); font-family: monospace;">${p.horimetroAncora} h</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-secondary);">Data da Medição:</span>
                  <span style="color: var(--text-primary); font-weight: 500;">${dataAncoraFormatada}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-secondary);">Dias Úteis Corridos:</span>
                  <span style="color: var(--text-primary); font-weight: 500;">${p.diasUteisCorridos} dias (+ ${p.horasAcumuladasEstimadas} h)</span>
                </div>
              </div>
            </div>

          </div>

          <!-- Bloco 3: Dados de Contato do Cliente -->
          <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 1rem;">
            <h4 style="margin: 0 0 0.75rem 0; font-size: 0.9rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.4rem;">
              <span>🏢</span> <span>Cliente & Contato da Pedreira</span>
            </h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; font-size: 0.85rem;">
              <div>
                <span style="color: var(--text-secondary); display: block; font-size: 0.75rem;">Razão Social / Nome</span>
                <strong style="color: var(--text-primary);">${m.cliente_nome || 'Não informado'}</strong>
              </div>
              <div>
                <span style="color: var(--text-secondary); display: block; font-size: 0.75rem;">Telefone / WhatsApp</span>
                <span style="color: var(--text-primary); font-weight: 500;">${m.cliente_telefone || 'Não informado'}</span>
              </div>
              <div>
                <span style="color: var(--text-secondary); display: block; font-size: 0.75rem;">E-mail</span>
                <span style="color: var(--text-primary); font-weight: 500;">${m.cliente_email || 'Não informado'}</span>
              </div>
            </div>
          </div>

          <!-- Bloco 4: Ações Específicas da Máquina -->
          <div>
            <h4 style="margin: 0 0 0.75rem 0; font-size: 0.95rem; color: var(--text-primary); font-weight: 700; display: flex; align-items: center; gap: 0.4rem;">
              <span>⚡</span> <span>Ações Específicas para este Equipamento</span>
            </h4>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem;">
              
              <!-- 1. Gerar OS Preventiva -->
              <button 
                class="btn btn-primary" 
                onclick="fecharModalDetalhesMaquina(); gerarOSPreventiva(${m.id})"
                style="padding: 0.85rem; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; text-align: left;"
              >
                <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 700; font-size: 0.95rem;">
                  <span>🛠️</span> <span>Gerar OS Preventiva</span>
                </div>
                <div style="font-size: 0.75rem; opacity: 0.9;">
                  Abre formulário de OS com horímetro ~${p.horimetroEstimado}h preenchido
                </div>
              </button>

              <!-- 2. Apontar Horímetro -->
              <button 
                class="btn btn-outline" 
                onclick="fecharModalDetalhesMaquina(); abrirModalApontamento(${m.id})"
                style="padding: 0.85rem; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; text-align: left;"
              >
                <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 700; font-size: 0.95rem; color: var(--primary);">
                  <span>⏱️</span> <span>Apontar Horímetro</span>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">
                  Registrar medição real aferida pelo mecânico na pedreira
                </div>
              </button>

              <!-- 3. Configurar Horas/Dia -->
              <button 
                class="btn btn-outline" 
                onclick="fecharModalDetalhesMaquina(); abrirModalConfigurarMaquina(${m.id})"
                style="padding: 0.85rem; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; text-align: left;"
              >
                <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">
                  <span>⚙️</span> <span>Configurar Regime</span>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">
                  Alterar média de horas/dia e escala de trabalho
                </div>
              </button>

              <!-- 4. E-mail Cliente -->
              <button 
                class="btn btn-outline" 
                onclick="fecharModalDetalhesMaquina(); abrirModalAlertaCliente(${m.id})"
                style="padding: 0.85rem; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; text-align: left;"
              >
                <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">
                  <span>✉️</span> <span>Alerta via E-mail</span>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">
                  Conscientizar o cliente sobre a proximidade da revisão
                </div>
              </button>

              <!-- 5. WhatsApp Cliente -->
              <button 
                class="btn btn-outline" 
                onclick="enviarWhatsAppCliente(${m.id})"
                style="padding: 0.85rem; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; text-align: left; border-color: #25D366; color: #25D366;"
              >
                <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 700; font-size: 0.95rem;">
                  <span>💬</span> <span>Alerta via WhatsApp</span>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">
                  Abrir WhatsApp com informativo formatado para o cliente
                </div>
              </button>

            </div>
          </div>

        </div>

        <!-- Footer do Modal -->
        <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid var(--border); background: var(--bg-secondary); display: flex; justify-content: flex-end;">
          <button type="button" class="btn btn-outline" onclick="fecharModalDetalhesMaquina()">Fechar</button>
        </div>

      </div>
    </div>
  `;

  const div = document.createElement('div');
  div.id = 'container-modal-detalhes-maquina';
  div.innerHTML = html;
  document.body.appendChild(div);
}

function fecharModalDetalhesMaquina() {
  const el = document.getElementById('container-modal-detalhes-maquina');
  if (el) el.remove();
}

window.abrirModalDetalhesMaquina = abrirModalDetalhesMaquina;
window.fecharModalDetalhesMaquina = fecharModalDetalhesMaquina;

// Filtros
function filtrarBuscaPreventiva(valor) {
  PreventivasState.filtros.busca = valor;
  const container = document.getElementById('content-area');
  if (container) container.innerHTML = renderPreventivas();
}

function filtrarStatusPreventiva(status) {
  PreventivasState.filtros.status = status;
  const container = document.getElementById('content-area');
  if (container) container.innerHTML = renderPreventivas();
}

function recarregarPreventivas() {
  carregarPreventivas(true).then(() => render());
}

// ==================== MODAL 1: APONTAMENTO RÁPIDO DE HORÍMETRO ====================

function abrirModalApontamento(maquinaId = null) {
  const maquinas = PreventivasState.maquinas || [];
  const maquinaSelecionada = maquinaId ? maquinas.find(m => m.id === maquinaId) : null;

  const html = `
    <div class="modal-overlay" id="modal-apontamento" style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 1rem;">
      <div class="modal-container" style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; width: 100%; max-width: 480px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
        
        <div class="modal-header" style="padding: 1.25rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary);">
          <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
            <span>⏱️</span>
            <span>Apontamento Rápido de Horímetro</span>
          </h3>
          <button onclick="fecharModalApontamento()" style="background: none; border: none; font-size: 1.4rem; color: var(--text-muted); cursor: pointer;">&times;</button>
        </div>

        <form id="form-apontamento-horimetro" onsubmit="salvarApontamentoHorimetroSubmit(event)" style="padding: 1.25rem;">
          
          <div class="form-group">
            <label class="form-label">Equipamento / Máquina *</label>
            <select class="form-input" id="apontamento-maquina-id" required ${maquinaId ? 'disabled' : ''}>
              <option value="">Selecione a máquina...</option>
              ${maquinas.map(m => `
                <option value="${m.id}" ${maquinaId === m.id ? 'selected' : ''}>
                  ${m.modelo} ${m.id_frota ? `(${m.id_frota})` : ''} — ${m.cliente_nome || 'Sem cliente'}
                </option>
              `).join('')}
            </select>
            ${maquinaId ? `<input type="hidden" id="apontamento-maquina-hidden" value="${maquinaId}" />` : ''}
          </div>

          <div class="form-group">
            <label class="form-label">Horímetro Visto no Painel (horas) *</label>
            <input 
              type="text" 
              class="form-input" 
              id="apontamento-horimetro" 
              placeholder="Ex: 1250 ou 1250,5" 
              value="${maquinaSelecionada ? (maquinaSelecionada.preditivo?.horimetroEstimado || maquinaSelecionada.horas_uso || '') : ''}"
              required 
              style="font-size: 1.2rem; font-weight: 700; color: var(--primary);"
            />
            <small style="color: var(--text-muted); font-size: 0.75rem;">Esse dado atualiza a âncora de verdade e recalibra as previsões.</small>
          </div>

          <div class="form-group">
            <label class="form-label">Observações (Opcional)</label>
            <textarea 
              class="form-input" 
              id="apontamento-observacoes" 
              rows="2" 
              placeholder="Ex: Leitura feita na lavra durante abastecimento..."></textarea>
          </div>

          <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-outline" onclick="fecharModalApontamento()">Cancelar</button>
            <button type="submit" class="btn btn-primary" id="btn-salvar-apontamento">
              <span>Salvar Leitura</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  `;

  const div = document.createElement('div');
  div.id = 'container-modal-apontamento';
  div.innerHTML = html;
  document.body.appendChild(div);

  setTimeout(() => {
    const inputH = document.getElementById('apontamento-horimetro');
    if (inputH) inputH.focus();
  }, 100);
}

function fecharModalApontamento() {
  const el = document.getElementById('container-modal-apontamento');
  if (el) el.remove();
}

async function salvarApontamentoHorimetroSubmit(e) {
  e.preventDefault();
  const selectM = document.getElementById('apontamento-maquina-id');
  const hiddenM = document.getElementById('apontamento-maquina-hidden');
  const maquina_id = hiddenM ? hiddenM.value : (selectM ? selectM.value : null);
  const horimetro = document.getElementById('apontamento-horimetro').value;
  const observacoes = document.getElementById('apontamento-observacoes').value;

  if (!maquina_id || !horimetro) {
    return alert('Por favor, informe a máquina e o horímetro.');
  }

  const btn = document.getElementById('btn-salvar-apontamento');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = 'Salvando...';
  }

  try {
    const res = await window.api.salvarApontamentoHorimetro({
      maquina_id: parseInt(maquina_id),
      horimetro,
      observacoes
    });

    if (res && res.success) {
      fecharModalApontamento();
      await carregarPreventivas(true);
      render();
    } else {
      alert('Erro ao salvar apontamento: ' + (res?.message || 'Erro desconhecido'));
    }
  } catch (err) {
    alert('Erro de conexão: ' + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Salvar Leitura';
    }
  }
}

// ==================== MODAL 2: CONFIGURAR PARÂMETROS DA MÁQUINA ====================

function abrirModalConfigurarMaquina(maquinaId) {
  const m = PreventivasState.maquinas.find(x => x.id === maquinaId);
  if (!m) return alert('Máquina não encontrada');

  const p = m.preditivo || {};

  const html = `
    <div class="modal-overlay" id="modal-config-maq" style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 1rem;">
      <div class="modal-container" style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; width: 100%; max-width: 500px; overflow: hidden;">
        
        <div class="modal-header" style="padding: 1.25rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary);">
          <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
            <span>⚙️</span>
            <span>Parâmetros Preditivos — ${m.modelo}</span>
          </h3>
          <button onclick="fecharModalConfigMaquina()" style="background: none; border: none; font-size: 1.4rem; color: var(--text-muted); cursor: pointer;">&times;</button>
        </div>

        <form id="form-config-maquina" onsubmit="salvarConfigMaquinaSubmit(event, ${m.id})" style="padding: 1.25rem;">
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label">Horas Estimadas / Dia *</label>
              <input type="number" step="0.5" min="1" max="24" class="form-input" id="cfg-horas-dia" value="${m.horas_dia_estimadas || p.horasDia || 7.0}" required />
              <small style="color: var(--text-muted); font-size: 0.7rem;">Média diária na pedreira (ex: 7h ou 8h)</small>
            </div>

            <div class="form-group">
              <label class="form-label">Escala Semanal *</label>
              <select class="form-input" id="cfg-dias-semana">
                <option value="5" ${(m.dias_semana_trabalho || p.diasSemana) == 5 ? 'selected' : ''}>Segunda a Sexta (5 dias)</option>
                <option value="6" ${(m.dias_semana_trabalho || p.diasSemana) == 6 ? 'selected' : ''}>Segunda a Sábado (6 dias)</option>
              </select>
              <small style="color: var(--text-muted); font-size: 0.7rem;">Dias úteis de motor operando</small>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label">Próxima Revisão Alvo (h)</label>
              <input type="number" step="10" class="form-input" id="cfg-proxima-revisao" value="${m.proxima_revisao_horas || p.proximaRevisaoHoras || 250}" />
              <small style="color: var(--text-muted); font-size: 0.7rem;">Ex: 250, 500, 1000...</small>
            </div>

            <div class="form-group">
              <label class="form-label">Última Revisão Feita (h)</label>
              <input type="number" step="10" class="form-input" id="cfg-ultima-revisao" value="${m.ultima_revisao_horas || p.ultimaRevisaoHoras || ''}" placeholder="Ex: 1000" />
              <small style="color: var(--text-muted); font-size: 0.7rem;">Horímetro da última troca</small>
            </div>
          </div>

          <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-outline" onclick="fecharModalConfigMaquina()">Cancelar</button>
            <button type="submit" class="btn btn-primary" id="btn-salvar-cfg">Salvar Parâmetros</button>
          </div>

        </form>

      </div>
    </div>
  `;

  const div = document.createElement('div');
  div.id = 'container-modal-config-maq';
  div.innerHTML = html;
  document.body.appendChild(div);
}

function fecharModalConfigMaquina() {
  const el = document.getElementById('container-modal-config-maq');
  if (el) el.remove();
}

async function salvarConfigMaquinaSubmit(e, maquinaId) {
  e.preventDefault();
  const horas_dia_estimadas = document.getElementById('cfg-horas-dia').value;
  const dias_semana_trabalho = document.getElementById('cfg-dias-semana').value;
  const proxima_revisao_horas = document.getElementById('cfg-proxima-revisao').value;
  const ultima_revisao_horas = document.getElementById('cfg-ultima-revisao').value;

  const btn = document.getElementById('btn-salvar-cfg');
  if (btn) { btn.disabled = true; btn.innerHTML = 'Salvando...'; }

  try {
    const res = await window.api.configurarMaquinaPreventiva(maquinaId, {
      horas_dia_estimadas,
      dias_semana_trabalho,
      proxima_revisao_horas,
      ultima_revisao_horas
    });

    if (res && res.success) {
      fecharModalConfigMaquina();
      await carregarPreventivas(true);
      render();
    } else {
      alert('Erro ao atualizar configurações: ' + (res?.message || 'Erro desconhecido'));
    }
  } catch (err) {
    alert('Erro de conexão: ' + err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = 'Salvar Parâmetros'; }
  }
}

// ==================== MODAL 3: INFORMATIVO AOS MECÂNICOS ====================

async function abrirModalEmailMecanicos() {
  try {
    const res = await window.api.obterPreviewEmailMecanicos();
    if (!res || !res.success) {
      return alert('Erro ao carregar preview do informativo');
    }

    window._ultimoTextoWhatsAppMecanico = res.whatsappTexto || '';

    const html = `
      <div class="modal-overlay" id="modal-email-mec" style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 1rem;">
        <div class="modal-container" style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; width: 100%; max-width: 720px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden;">
          
          <div class="modal-header" style="padding: 1.25rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary);">
            <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
              <span>📢</span>
              <span>Informativo aos Mecânicos (E-mail & WhatsApp)</span>
            </h3>
            <button onclick="fecharModalEmailMecanicos()" style="background: none; border: none; font-size: 1.4rem; color: var(--text-muted); cursor: pointer;">&times;</button>
          </div>

          <div class="modal-body" style="padding: 1.25rem; overflow-y: auto; flex: 1;">
            
            <!-- Bloco WhatsApp Mecânicos -->
            <div class="form-group" style="margin-bottom: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <label class="form-label" style="margin: 0; font-weight: 700; color: #10b981; display: flex; align-items: center; gap: 0.4rem;">
                  <span>📲</span> <span>Envio Direto via WhatsApp aos Mecânicos (${(res.mecanicos || []).length})</span>
                </label>
                <button type="button" class="btn btn-outline" style="padding: 3px 10px; font-size: 0.75rem; border-color: #10b981; color: #10b981;" onclick="copiarTextoWhatsAppMecanico()">
                  📋 Copiar Texto do WhatsApp
                </button>
              </div>

              <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem; max-height: 180px; overflow-y: auto;">
                ${(res.mecanicos && res.mecanicos.length > 0) ? `
                  <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${res.mecanicos.map(mec => {
                      const telLimpo = (mec.whatsapp || '').replace(/\D/g, '');
                      const telFormatado = telLimpo ? (telLimpo.startsWith('55') ? telLimpo : '55' + telLimpo) : null;
                      return `
                        <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-card); padding: 0.6rem 0.85rem; border-radius: 6px; border: 1px solid var(--border);">
                          <div>
                            <strong style="color: var(--text-primary); font-size: 0.9rem;">${mec.nome}</strong>
                            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">
                              ${mec.whatsapp ? `<span style="color: #10b981; font-weight: 600;">📱 ${mec.whatsapp}</span>` : '<span style="color: #f59e0b;">⚠️ Sem WhatsApp cadastrado</span>'}
                              ${mec.email ? ` • <span>✉️ ${mec.email}</span>` : ''}
                            </div>
                          </div>
                          <div>
                            ${telFormatado ? `
                              <a href="https://api.whatsapp.com/send?phone=${telFormatado}&text=${encodeURIComponent(mec.whatsappTexto || res.whatsappTexto || '')}" target="_blank" class="btn btn-primary" style="padding: 4px 12px; font-size: 0.75rem; background: #25D366; border-color: #25D366; color: #fff; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                                <span>💬</span> <span>Abrir WhatsApp</span>
                              </a>
                            ` : `
                              <button type="button" class="btn btn-outline" style="padding: 4px 10px; font-size: 0.75rem; color: var(--text-muted);" onclick="alert('Cadastre o WhatsApp deste mecânico na aba Usuários para habilitar o envio direto.')">
                                <span>Sem WhatsApp</span>
                              </button>
                            `}
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                ` : `
                  <div style="font-size: 0.85rem; color: var(--text-secondary); text-align: center; padding: 0.75rem;">
                    Nenhum mecânico (cargo MECÂNICO) cadastrado no sistema.
                  </div>
                `}
              </div>
            </div>

            <!-- Bloco E-mail -->
            <hr style="border: 0; border-top: 1px solid var(--border); margin: 1.25rem 0;" />
            
            <p style="margin: 0 0 1rem 0; font-size: 0.85rem; color: var(--text-secondary);">
              Você também pode disparar este comunicado para os e-mails de todos os mecânicos com um único clique:
            </p>

            <div class="form-group">
              <label class="form-label">Assunto do E-mail</label>
              <input type="text" class="form-input" id="email-mec-assunto" value="${res.assunto || ''}" />
            </div>

            <div class="form-group">
              <label class="form-label">Pré-visualização do Conteúdo (E-mail)</label>
              <div style="border: 1px solid var(--border); border-radius: 6px; padding: 1rem; background: #ffffff; color: #333; max-height: 220px; overflow-y: auto;">
                ${res.html}
              </div>
            </div>
          </div>

          <div class="modal-footer" style="padding: 1rem 1.25rem; border-top: 1px solid var(--border); background: var(--bg-secondary); display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button type="button" class="btn btn-outline" onclick="fecharModalEmailMecanicos()">Fechar</button>
            <button type="button" class="btn btn-primary" id="btn-enviar-email-mec" onclick="confirmarDisparoEmailMecanicos()">
              <span>✉️ Disparar E-mail para Todos</span>
            </button>
          </div>

        </div>
      </div>
    `;

    const div = document.createElement('div');
    div.id = 'container-modal-email-mec';
    div.innerHTML = html;
    document.body.appendChild(div);

  } catch (err) {
    alert('Erro ao abrir preview: ' + err.message);
  }
}

function fecharModalEmailMecanicos() {
  const el = document.getElementById('container-modal-email-mec');
  if (el) el.remove();
}

function copiarTextoWhatsAppMecanico() {
  const texto = window._ultimoTextoWhatsAppMecanico || '';
  if (!texto) return alert('Texto não disponível');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texto)
      .then(() => alert('Texto do informativo copiado com sucesso! Você pode colar no WhatsApp.'))
      .catch(() => fallbackCopiar(texto));
  } else {
    fallbackCopiar(texto);
  }
}

function fallbackCopiar(texto) {
  const ta = document.createElement('textarea');
  ta.value = texto;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  ta.remove();
  alert('Texto do informativo copiado com sucesso!');
}

window.copiarTextoWhatsAppMecanico = copiarTextoWhatsAppMecanico;

async function confirmarDisparoEmailMecanicos() {
  const assunto = document.getElementById('email-mec-assunto').value;
  const btn = document.getElementById('btn-enviar-email-mec');

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = 'Enviando e-mails...';
  }

  try {
    const res = await window.api.dispararEmailMecanicos({ assunto });
    if (res && res.success) {
      alert(res.message || 'Informativo enviado com sucesso!');
      fecharModalEmailMecanicos();
    } else {
      alert('Aviso: ' + (res?.message || 'Falha no disparo'));
    }
  } catch (err) {
    alert('Erro de envio: ' + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '🚀 Enviar aos Mecânicos Agora';
    }
  }
}

// ==================== MODAL 4: ALERTA PREVENTIVO AO CLIENTE ====================

async function abrirModalAlertaCliente(maquinaId) {
  try {
    const res = await window.api.obterPreviewAlertaCliente(maquinaId);
    if (!res || !res.success) {
      return alert('Erro ao carregar preview do alerta: ' + (res?.message || 'Erro desconhecido'));
    }

    const html = `
      <div class="modal-overlay" id="modal-alerta-cli" style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 1rem;">
        <div class="modal-container" style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; width: 100%; max-width: 680px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden;">
          
          <div class="modal-header" style="padding: 1.25rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary);">
            <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
              <span>✉️</span>
              <span>Alerta Preventivo ao Cliente</span>
            </h3>
            <button onclick="fecharModalAlertaCliente()" style="background: none; border: none; font-size: 1.4rem; color: var(--text-muted); cursor: pointer;">&times;</button>
          </div>

          <div class="modal-body" style="padding: 1.25rem; overflow-y: auto; flex: 1;">
            
            <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 1rem; margin-bottom: 1rem;">
              <div class="form-group" style="margin: 0;">
                <label class="form-label">E-mail do Destinatário *</label>
                <input type="email" class="form-input" id="alerta-cli-email" value="${res.destinatarioEmail || ''}" placeholder="cliente@pedreira.com" required />
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label">Telefone / WhatsApp</label>
                <input type="text" class="form-input" id="alerta-cli-telefone" value="${res.destinatarioTelefone || ''}" placeholder="(28) 99999-9999" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Assunto</label>
              <input type="text" class="form-input" id="alerta-cli-assunto" value="${res.assunto || ''}" />
            </div>

            <div class="form-group">
              <label class="form-label">Pré-visualização do E-mail</label>
              <div style="border: 1px solid var(--border); border-radius: 6px; padding: 1rem; background: #ffffff; color: #333; max-height: 260px; overflow-y: auto;">
                ${res.html}
              </div>
            </div>

          </div>

          <div class="modal-footer" style="padding: 1rem 1.25rem; border-top: 1px solid var(--border); background: var(--bg-secondary); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
            <button type="button" class="btn btn-outline" style="color: #10b981; border-color: rgba(16, 185, 129, 0.4);" onclick="enviarWhatsAppCliente(${maquinaId})">
              <span>📲 Enviar via WhatsApp</span>
            </button>

            <div style="display: flex; gap: 0.6rem;">
              <button type="button" class="btn btn-outline" onclick="fecharModalAlertaCliente()">Cancelar</button>
              <button type="button" class="btn btn-primary" id="btn-enviar-alerta-cli" onclick="confirmarDisparoAlertaCliente(${maquinaId})">
                <span>🚀 Disparar E-mail</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    `;

    const div = document.createElement('div');
    div.id = 'container-modal-alerta-cli';
    div.innerHTML = html;
    document.body.appendChild(div);

  } catch (err) {
    alert('Erro ao abrir preview: ' + err.message);
  }
}

function fecharModalAlertaCliente() {
  const el = document.getElementById('container-modal-alerta-cli');
  if (el) el.remove();
}

async function confirmarDisparoAlertaCliente(maquinaId) {
  const email_destinatario = document.getElementById('alerta-cli-email').value;
  const assunto = document.getElementById('alerta-cli-assunto').value;
  const btn = document.getElementById('btn-enviar-alerta-cli');

  if (!email_destinatario) {
    return alert('Por favor, informe o e-mail do destinatário.');
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = 'Enviando...';
  }

  try {
    const res = await window.api.dispararAlertaCliente(maquinaId, {
      email_destinatario,
      assunto
    });

    if (res && res.success) {
      alert(res.message || 'Alerta preventivo enviado com sucesso!');
      fecharModalAlertaCliente();
    } else {
      alert('Aviso: ' + (res?.message || 'Falha no envio'));
    }
  } catch (err) {
    alert('Erro no envio: ' + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '🚀 Disparar E-mail';
    }
  }
}

// Enviar mensagem direta via WhatsApp
function enviarWhatsAppCliente(maquinaId) {
  const m = PreventivasState.maquinas.find(x => x.id === maquinaId);
  if (!m) return alert('Máquina não encontrada');

  const texto = m.whatsappTexto || '';
  let tel = (m.cliente_telefone || '').replace(/\D/g, '');
  if (tel && !tel.startsWith('55')) {
    tel = '55' + tel;
  }

  const url = tel 
    ? `https://api.whatsapp.com/send?phone=${tel}&text=${encodeURIComponent(texto)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;

  window.open(url, '_blank');
}

// Ação de 1 clique: Gerar OS Preventiva
function gerarOSPreventiva(maquinaId) {
  const m = PreventivasState.maquinas.find(x => x.id === maquinaId);
  if (!m) return alert('Máquina não encontrada');

  const p = m.preditivo || {};

  const prefill = {
    cliente_id: m.cliente_id,
    maquina_id: m.id,
    tipo: 'PREVENTIVA',
    horimetro: `${p.horimetroEstimado} h`,
    descricao_problema: `REVISÃO PREVENTIVA PROGRAMADA (${p.proximaRevisaoHoras} HORAS).\nSUBSTITUIÇÃO DE ELEMENTOS FILTRANTES E ÓLEOS LUBRIFICANTES CONFORME PLANO PREDITIVO DE PEDREIRA.`,
    diagnostico: `INTERVENÇÃO PREVENTIVA BASEADA EM HORÍMETRO ESTIMADO (~${p.horimetroEstimado} h). REVISÃO DO CICLO DE ${p.proximaRevisaoHoras} HORAS.`
  };

  if (typeof mostrarModalOS === 'function') {
    mostrarModalOS(null, prefill);
  } else {
    alert('Abrindo modal de OS...');
  }
}
