// ============================================================================
// SAMAPE 2.0 - WHATSAPP HELPER (FERRAMENTA 4: ENVIO DE OS VIA WHATSAPP COM 1 TOQUE)
// ============================================================================

const WhatsAppHelper = {
  // Limpa e padroniza o telefone para o formato internacional aceito pelo WhatsApp
  formatarNumero(telefone) {
    if (!telefone) return '';
    let digits = String(telefone).replace(/\D/g, '');
    if (!digits) return '';

    // Se começar com 0 (ex: 031...), remove o 0
    if (digits.startsWith('0')) {
      digits = digits.substring(1);
    }

    // Se tiver 10 ou 11 dígitos (DDD + número), adiciona o DDI 55 do Brasil
    if (digits.length === 10 || digits.length === 11) {
      digits = '55' + digits;
    }

    return digits;
  },

  // Formatar número amigável para exibição visual
  formatarExibicao(telefone) {
    if (!telefone) return '';
    const digits = String(telefone).replace(/\D/g, '');
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return telefone;
  },

  // Obtém dados completos e consolidados de uma OS
  async obterDadosCompletosOS(osId) {
    let os = null;
    let pecas = [];

    // 1. Tentar obter do AppState primeiro (rápido / offline)
    if (typeof AppState !== 'undefined' && AppState.data && AppState.data.ordens) {
      os = AppState.data.ordens.find(o => String(o.id) === String(osId));
    }

    // 2. Se não achou ou faltam dados, buscar pela API
    if (!os && typeof window.api !== 'undefined' && typeof window.api.obterOS === 'function') {
      try {
        const res = await window.api.obterOS(osId);
        if (res && res.success) {
          os = res.ordem || res.os;
        }
      } catch (e) {
        console.warn('Erro ao obter OS via API:', e);
      }
    }

    // 3. Fallback no snapshot do OfflineManager
    if (!os && typeof OfflineManager !== 'undefined') {
      const ordens = OfflineManager.obterSnapshot('ordens') || [];
      os = ordens.find(o => String(o.id) === String(osId));
    }

    if (!os) {
      throw new Error(`Ordem de Serviço #${osId} não encontrada.`);
    }

    // Buscar peças associadas
    try {
      if (typeof window.api !== 'undefined' && typeof window.api.listarPecasOS === 'function') {
        const resPecas = await window.api.listarPecasOS(osId);
        if (resPecas && resPecas.success && resPecas.pecas) {
          pecas = resPecas.pecas;
        }
      }
    } catch (e) {
      console.warn('Não foi possível carregar peças específicas da OS:', e);
    }

    // Resolver Cliente
    let cliente = null;
    if (typeof AppState !== 'undefined' && AppState.data && AppState.data.clientes) {
      cliente = AppState.data.clientes.find(c => String(c.id) === String(os.cliente_id));
    }
    if (!cliente && typeof OfflineManager !== 'undefined') {
      const clientes = OfflineManager.obterSnapshot('clientes') || [];
      cliente = clientes.find(c => String(c.id) === String(os.cliente_id));
    }

    // Resolver Máquina
    let maquina = null;
    if (typeof AppState !== 'undefined' && AppState.data && AppState.data.maquinas) {
      maquina = AppState.data.maquinas.find(m => String(m.id) === String(os.maquina_id));
    }
    if (!maquina && typeof OfflineManager !== 'undefined') {
      const maquinas = OfflineManager.obterSnapshot('maquinas') || [];
      maquina = maquinas.find(m => String(m.id) === String(os.maquina_id));
    }

    // Resolver Mecânico
    let mecanico = null;
    if (typeof AppState !== 'undefined' && AppState.data && AppState.data.usuarios) {
      mecanico = AppState.data.usuarios.find(u => String(u.id) === String(os.mecanico_id));
    }

    return { os, cliente, maquina, mecanico, pecas };
  },

  // Monta a mensagem profissional do WhatsApp
  gerarTextoMensagem(dados, opcoes = {}) {
    const { os, cliente, maquina, mecanico, pecas } = dados;
    const incluirValores = opcoes.incluirValores !== false;
    const incluirPecas = opcoes.incluirPecas !== false;

    const formatMoney = (val) => {
      const n = parseFloat(val) || 0;
      return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return 'Hoje';
      try {
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('pt-BR');
      } catch (e) {
        return dateStr;
      }
    };

    const clienteNome = cliente ? cliente.nome : (os.cliente_nome || 'Cliente');
    const maquinaNome = maquina ? `${maquina.modelo} (${maquina.tipo || 'Máquina'})` : (os.maquina_modelo || 'Equipamento');
    const serie = maquina ? (maquina.numero_serie || maquina.id_frota || '') : '';
    const horimetro = os.horimetro || (maquina && maquina.horas_uso ? `${maquina.horas_uso} h` : 'Não apontado');
    const mecanicoNome = mecanico ? mecanico.nome : (os.mecanico_nome || 'Técnico Especialista');
    const statusMap = {
      'ABERTA': '🟡 Aberta',
      'EM_ANDAMENTO': '🔵 Em Andamento',
      'FECHADA': '🟢 Concluída / Finalizada',
      'CONCLUIDA': '🟢 Concluída / Finalizada'
    };
    const statusTxt = statusMap[os.status] || os.status || 'Atendimento';

    let txt = `🚜 *SAMAPE MANUTENÇÃO - ORDEM DE SERVIÇO Nº ${os.numero_os}*\n`;
    txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    txt += `👤 *Cliente:* ${clienteNome}\n`;
    txt += `⚙️ *Máquina:* ${maquinaNome}${serie ? `\n🏷️ *Série/Frota:* ${serie}` : ''}\n`;
    txt += `⏱️ *Horímetro:* ${horimetro}\n`;
    txt += `👨‍🔧 *Técnico Responsável:* ${mecanicoNome}\n`;
    txt += `📅 *Data:* ${formatDate(os.data_abertura || os.created_at)}\n`;
    txt += `📊 *Status:* ${statusTxt}\n`;
    txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    if (os.descricao_problema) {
      txt += `⚠️ *Problema Constatado:*\n${os.descricao_problema.trim()}\n\n`;
    }

    const solucao = os.servicos_realizados || os.solucao || os.diagnostico || '';
    if (solucao) {
      txt += `🔧 *Serviços Executados:*\n${solucao.trim()}\n\n`;
    }

    if (incluirPecas && pecas && pecas.length > 0) {
      txt += `🔩 *Peças Utilizadas:*\n`;
      pecas.forEach(p => {
        const qtd = p.quantidade || 1;
        const val = incluirValores && p.valor_unitario ? ` - R$ ${formatMoney(p.valor_unitario * qtd)}` : '';
        txt += `• ${qtd}x ${p.nome || p.peca_nome || 'Item'}${val}\n`;
      });
      txt += `\n`;
    }

    if (incluirValores) {
      txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      txt += `💰 *Resumo Financeiro:*\n`;
      if (os.valor_mao_obra) txt += `• Mão de Obra: R$ ${formatMoney(os.valor_mao_obra)}\n`;
      if (os.valor_pecas) txt += `• Peças/Materiais: R$ ${formatMoney(os.valor_pecas)}\n`;
      if (os.valor_por_km && (os.km_volta > os.km_ida)) {
        const kmTotal = os.km_volta - os.km_ida;
        txt += `• Deslocamento (${kmTotal.toFixed(1)} km): R$ ${formatMoney(kmTotal * os.valor_por_km)}\n`;
      }
      txt += `*VALOR TOTAL: R$ ${formatMoney(os.valor_total || 0)}*\n`;
    }

    txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    txt += `_SAMAPE - Especialistas em Maquinário Pesado e Agrícola_\n`;
    txt += `_Mensagem gerada automaticamente pelo Sistema SAMAPEOP._`;

    return txt;
  },

  // Abre a interface modal para visualização e envio
  async abrirModalEnvio(osId) {
    try {
      // Remove modal anterior se houver
      const modalAntigo = document.getElementById('modal-whatsapp-os');
      if (modalAntigo) modalAntigo.remove();

      // Carregar dados
      const dados = await this.obterDadosCompletosOS(osId);
      const clienteTelefone = dados.cliente ? (dados.cliente.telefone || dados.cliente.celular || '') : '';
      const telefoneFormatado = this.formatarExibicao(clienteTelefone);

      const modalHTML = `
        <div class="modal-overlay" id="modal-whatsapp-os" style="display: flex; align-items: center; justify-content: center; z-index: 10050;">
          <div class="modal" style="max-width: 580px; width: 95%; max-height: 90vh; display: flex; flex-direction: column; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); overflow: hidden; background: var(--bg-primary);">
            
            <!-- HEADER -->
            <div style="background: linear-gradient(135deg, #128C7E, #25D366); color: white; padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="background: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
                  💬
                </div>
                <div>
                  <h3 style="margin: 0; font-size: 1.2rem; font-weight: 700; color: white;">Enviar OS via WhatsApp</h3>
                  <div style="font-size: 0.85rem; opacity: 0.9; margin-top: 2px;">
                    Ordem de Serviço Nº <strong>${dados.os.numero_os}</strong>
                  </div>
                </div>
              </div>
              <button onclick="document.getElementById('modal-whatsapp-os').remove()" style="background: none; border: none; color: white; font-size: 1.75rem; cursor: pointer; line-height: 1; padding: 0;">&times;</button>
            </div>

            <!-- CORPO -->
            <div style="padding: 1.5rem; overflow-y: auto; flex: 1;">
              
              <!-- DESTINATÁRIO -->
              <div class="form-group" style="margin-bottom: 1.25rem;">
                <label class="form-label" style="font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
                  <span>📱 Número do WhatsApp (Cliente ou Encarregado)</span>
                  ${dados.cliente ? `<span style="font-size: 0.8rem; color: var(--text-muted); font-weight: normal;">${dados.cliente.nome}</span>` : ''}
                </label>
                <div style="display: flex; gap: 0.5rem;">
                  <input type="tel" class="form-input" id="wa-input-telefone" 
                    placeholder="Ex: (31) 98765-4321 ou 31987654321" 
                    value="${telefoneFormatado}" 
                    style="font-size: 1rem; font-weight: 600; letter-spacing: 0.5px;" />
                </div>
                <small style="color: var(--text-muted); display: block; margin-top: 0.25rem;">
                  ${clienteTelefone ? '✓ Telefone puxado automaticamente do cadastro do cliente.' : '⚠️ Cliente sem telefone cadastrado. Digite o número acima com DDD.'}
                </small>
              </div>

              <!-- OPÇÕES -->
              <div style="background: var(--bg-secondary); padding: 0.85rem 1rem; border-radius: 8px; margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; border: 1px solid var(--border);">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer; user-select: none;">
                  <input type="checkbox" id="wa-check-valores" checked style="width: 17px; height: 17px; cursor: pointer;" />
                  <span>Incluir valores financeiros (Mão de Obra, Peças e Total)</span>
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer; user-select: none;">
                  <input type="checkbox" id="wa-check-pecas" checked style="width: 17px; height: 17px; cursor: pointer;" />
                  <span>Incluir detalhamento de peças aplicadas</span>
                </label>
              </div>

              <!-- PREVIEW -->
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
                  <span>👁️ Pré-visualização da Mensagem</span>
                  <span id="wa-char-count" style="font-size: 0.75rem; color: var(--text-muted);"></span>
                </label>
                <textarea id="wa-preview-text" class="form-input" rows="8" readonly 
                  style="font-family: inherit; font-size: 0.85rem; line-height: 1.45; background: #f0fdf4; border-color: #86efac; color: #166534; white-space: pre-wrap; resize: none; cursor: default; border-radius: 8px;"></textarea>
              </div>

            </div>

            <!-- FOOTER -->
            <div style="padding: 1.25rem 1.5rem; background: var(--bg-secondary); border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button type="button" class="btn btn-secondary btn-sm" id="wa-btn-copiar" style="display: flex; align-items: center; gap: 0.4rem; height: 42px; padding: 0 1rem;">
                  📋 Copiar Texto
                </button>
                ${navigator.share ? `
                  <button type="button" class="btn btn-secondary btn-sm" id="wa-btn-share" style="display: flex; align-items: center; gap: 0.4rem; height: 42px; padding: 0 1rem;">
                    📤 Compartilhar
                  </button>
                ` : ''}
              </div>
              <div style="display: flex; gap: 0.5rem;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-whatsapp-os').remove()" style="height: 42px;">
                  Cancelar
                </button>
                <button type="button" class="btn btn-success" id="wa-btn-disparar" style="background: #25D366; border-color: #25D366; color: white; font-weight: 700; height: 42px; padding: 0 1.5rem; display: flex; align-items: center; gap: 0.5rem; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);">
                  <span>💬 Abrir WhatsApp</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);

      // Função de atualização do preview
      const atualizarPreview = () => {
        const incluirValores = document.getElementById('wa-check-valores').checked;
        const incluirPecas = document.getElementById('wa-check-pecas').checked;
        const texto = this.gerarTextoMensagem(dados, { incluirValores, incluirPecas });
        const previewEl = document.getElementById('wa-preview-text');
        if (previewEl) {
          previewEl.value = texto;
          document.getElementById('wa-char-count').innerText = `${texto.length} caracteres`;
        }
        return texto;
      };

      atualizarPreview();

      // Listeners dos checkboxes
      document.getElementById('wa-check-valores').addEventListener('change', atualizarPreview);
      document.getElementById('wa-check-pecas').addEventListener('change', atualizarPreview);

      // Botão Disparar / Abrir no WhatsApp
      document.getElementById('wa-btn-disparar').addEventListener('click', () => {
        const telInput = document.getElementById('wa-input-telefone').value;
        const texto = atualizarPreview();
        const numFormatado = this.formatarNumero(telInput);

        if (!numFormatado) {
          if (!confirm('Nenhum número de telefone válido informado. Deseja abrir o WhatsApp para escolher o contato manualmente?')) {
            document.getElementById('wa-input-telefone').focus();
            return;
          }
          // Abre wa.me apenas com o texto para selecionar na lista do WhatsApp
          const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
          window.open(url, '_blank');
          document.getElementById('modal-whatsapp-os').remove();
          return;
        }

        // Abre wa.me direcionado ao contato com texto pronto
        const url = `https://wa.me/${numFormatado}?text=${encodeURIComponent(texto)}`;
        window.open(url, '_blank');
        document.getElementById('modal-whatsapp-os').remove();
      });

      // Botão Copiar Texto
      document.getElementById('wa-btn-copiar').addEventListener('click', async () => {
        const texto = atualizarPreview();
        try {
          await navigator.clipboard.writeText(texto);
          const btn = document.getElementById('wa-btn-copiar');
          const original = btn.innerHTML;
          btn.innerHTML = '✅ Copiado!';
          btn.style.color = '#15803d';
          setTimeout(() => {
            btn.innerHTML = original;
            btn.style.color = '';
          }, 2000);
        } catch (err) {
          alert('Texto pronto para envio copiado para a área de transferência.');
        }
      });

      // Botão Compartilhar (Web Share API)
      const btnShare = document.getElementById('wa-btn-share');
      if (btnShare && navigator.share) {
        btnShare.addEventListener('click', async () => {
          const texto = atualizarPreview();
          try {
            await navigator.share({
              title: `Ordem de Serviço Nº ${dados.os.numero_os} - SAMAPE`,
              text: texto
            });
            document.getElementById('modal-whatsapp-os').remove();
          } catch (e) {
            // Compartilhamento cancelado pelo usuário
          }
        });
      }

    } catch (err) {
      console.error('Erro ao abrir envio de WhatsApp:', err);
      alert('Não foi possível carregar os dados da OS para o WhatsApp: ' + err.message);
    }
  }
};

window.WhatsAppHelper = WhatsAppHelper;
