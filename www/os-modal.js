// ==================== MODAL DE ORDEM DE SERVIÇO DETALHADA ====================

async function mostrarModalOS(osId = null) {
  const isEdicao = osId !== null;
  let osData = null;

  if (isEdicao) {
    const result = await window.api.obterOS(osId);
    if (result.success) {
      osData = result.os;
    } else {
      showAlert('Erro ao carregar OS', 'danger');
      return;
    }
  }

  // Carregar dados necessários
  const [clientesRes, mecanicosRes] = await Promise.all([
    window.api.listarClientes(),
    window.api.listarUsuarios()
  ]);

  const clientes = clientesRes.clientes || [];
  const mecanicos = (mecanicosRes.usuarios || []).filter(u => u.cargo === 'MECANICO' || u.cargo === 'ADMIN');

  const modalHTML = `
    <div class="modal-overlay" id="modal-os">
      <div class="modal-container" style="max-width: 1400px; max-height: 95vh; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl);">
        <div class="modal-header" style="background: var(--bg-secondary); border-bottom: 1px solid var(--border); padding: 1.5rem;">
          <h2 class="modal-title" style="margin: 0; font-size: 1.5rem; display: flex; align-items: center; gap: 0.5rem; color: var(--text-primary);">
            <span style="font-size: 1.8rem;">📋</span>
            ${isEdicao ? `Ordem de Serviço ${osData.numero_os}` : 'Nova Ordem de Serviço'}
          </h2>
          <button class="modal-close" onclick="fecharModal('modal-os')" style="font-size: 2rem;">&times;</button>
        </div>
        
        <form id="form-os" class="modal-body" style="max-height: calc(95vh - 180px); overflow-y: auto; padding: 2rem; background: var(--bg-primary);">
          
          <!-- GRID PRINCIPAL: 2 COLUNAS -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
            
            <!-- COLUNA ESQUERDA -->
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
              
              <!-- CLIENTE -->
              <div class="card" style="margin-bottom: 0; border-left: 3px solid var(--primary);">
                <div class="card-header" style="margin-bottom: 1rem; padding-bottom: 0.75rem;">
                  <h3 style="margin: 0; font-size: 1rem; color: var(--primary); font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.2rem;">👤</span> Cliente
                  </h3>
                </div>
                <div style="padding: 0 1.5rem 1.5rem 1.5rem;">
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="font-weight: 600; margin-bottom: 0.5rem;">Cliente *</label>
                    <select class="form-input" id="os-cliente" required ${isEdicao && osData.status !== 'ABERTA' ? 'disabled' : ''}>
                      <option value="">Selecione um cliente</option>
                      ${clientes.map(c => `
                        <option value="${c.id}" ${osData && osData.cliente_id === c.id ? 'selected' : ''}>
                          ${c.nome}${c.cnpj ? ` - ${c.cnpj}` : ''}
                        </option>
                      `).join('')}
                    </select>
                  </div>
                  ${osData ? `
                    <div style="margin-top: 1rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius); border-left: 3px solid var(--primary);">
                      <div style="display: grid; gap: 0.5rem; font-size: 0.9rem; color: var(--text-secondary);">
                        ${osData.cliente_cnpj ? `<div><strong style="color: var(--primary);">CNPJ:</strong> ${osData.cliente_cnpj}</div>` : ''}
                        ${osData.cliente_telefone ? `<div><strong style="color: var(--primary);">Tel:</strong> ${osData.cliente_telefone}</div>` : ''}
                        ${osData.cliente_endereco ? `<div><strong style="color: var(--primary);">End:</strong> ${osData.cliente_endereco}</div>` : ''}
                      </div>
                    </div>
                  ` : ''}
                </div>
              </div>

              <!-- MAQUINÁRIO -->
              <div class="card" style="margin-bottom: 0; border-left: 3px solid var(--info);">
                <div class="card-header" style="margin-bottom: 1rem; padding-bottom: 0.75rem;">
                  <h3 style="margin: 0; font-size: 1rem; color: var(--info); font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.2rem;">🚜</span> Maquinário
                  </h3>
                </div>
                <div style="padding: 0 1.5rem 1.5rem 1.5rem;">
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="font-weight: 600; margin-bottom: 0.5rem;">Máquina *</label>
                    <select class="form-input" id="os-maquina" required ${isEdicao && osData.status !== 'ABERTA' ? 'disabled' : ''}>
                      <option value="">Selecione uma máquina</option>
                    </select>
                  </div>
                  ${osData && osData.maquina_modelo ? `
                    <div style="margin-top: 1rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius); border-left: 3px solid var(--info);">
                      <div style="display: grid; gap: 0.5rem; font-size: 0.9rem; color: var(--text-secondary);">
                        <div><strong style="color: var(--info);">Modelo:</strong> ${osData.maquina_modelo}</div>
                        ${osData.maquina_serie ? `<div><strong style="color: var(--info);">Série:</strong> ${osData.maquina_serie}</div>` : ''}
                        ${osData.maquina_ano ? `<div><strong style="color: var(--info);">Ano:</strong> ${osData.maquina_ano}</div>` : ''}
                      </div>
                    </div>
                  ` : ''}
                </div>
              </div>

              <!-- MECÂNICO -->
              <div class="card" style="margin-bottom: 0; border-left: 3px solid var(--secondary);">
                <div class="card-header" style="margin-bottom: 1rem; padding-bottom: 0.75rem;">
                  <h3 style="margin: 0; font-size: 1rem; color: var(--secondary); font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.2rem;">👨‍🔧</span> Mecânico Responsável
                  </h3>
                </div>
                <div style="padding: 0 1.5rem 1.5rem 1.5rem;">
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="font-weight: 600; margin-bottom: 0.5rem;">Responsável *</label>
                    <select class="form-input" id="os-mecanico" required ${isEdicao && osData.status !== 'ABERTA' ? 'disabled' : ''}>
                      <option value="">Selecione um mecânico</option>
                      ${mecanicos.map(m => `
                        <option value="${m.id}" ${osData && osData.mecanico_id === m.id ? 'selected' : ''}>
                          ${m.nome}
                        </option>
                      `).join('')}
                    </select>
                  </div>
                </div>
              </div>

            </div>
            
            <!-- COLUNA DIREITA -->
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
              
              <!-- DESLOCAMENTO -->
              <div class="card" style="margin-bottom: 0; border-left: 3px solid var(--warning);">
                <div class="card-header" style="margin-bottom: 1rem; padding-bottom: 0.75rem;">
                  <h3 style="margin: 0; font-size: 1rem; color: var(--warning); font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.2rem;">🚗</span> Controle de Deslocamento
                  </h3>
                </div>
                <div style="padding: 0 1.5rem 1.5rem 1.5rem;">
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div class="form-group" style="margin: 0;">
                      <label class="form-label" style="font-weight: 600; font-size: 0.9rem;">KM Ida</label>
                      <input type="number" class="form-input" id="os-km-ida" step="0.1" min="0" 
                        value="${osData ? osData.km_ida : 0}" 
                        onchange="calcularValoresOS()">
                    </div>
                    <div class="form-group" style="margin: 0;">
                      <label class="form-label" style="font-weight: 600; font-size: 0.9rem;">KM Volta</label>
                      <input type="number" class="form-input" id="os-km-volta" step="0.1" min="0" 
                        value="${osData ? osData.km_volta : 0}"
                        onchange="calcularValoresOS()">
                    </div>
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group" style="margin: 0;">
                      <label class="form-label" style="font-weight: 600; font-size: 0.9rem;">Valor/KM (R$)</label>
                      <input type="number" class="form-input" id="os-valor-km" step="0.01" min="0" 
                        value="${osData ? osData.valor_por_km : 0}"
                        onchange="calcularValoresOS()">
                    </div>
                    <div class="form-group" style="margin: 0;">
                      <label class="form-label" style="font-weight: 600; font-size: 0.9rem;">KM Total</label>
                      <input type="number" class="form-input" id="os-km-total" readonly 
                        value="${osData ? osData.km_total : 0}"
                        style="background: rgba(245, 158, 11, 0.1); border-color: var(--warning); font-weight: 600; color: var(--warning); cursor: not-allowed;">
                    </div>
                  </div>
                  <div style="margin-top: 1rem; padding: 1rem; background: rgba(245, 158, 11, 0.15); border: 1px solid var(--warning); border-radius: var(--radius); text-align: center;">
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.3rem;">Valor Deslocamento</div>
                    <div style="font-size: 1.8rem; font-weight: bold; color: var(--warning);" id="os-valor-deslocamento-display">
                      R$ ${osData ? formatMoney(osData.valor_deslocamento) : '0,00'}
                    </div>
                  </div>
                </div>
              </div>

              <!-- VALORES -->
              <div class="card" style="margin-bottom: 0; border-left: 3px solid var(--success);">
                <div class="card-header" style="margin-bottom: 1rem; padding-bottom: 0.75rem;">
                  <h3 style="margin: 0; font-size: 1rem; color: var(--success); font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.2rem;">💰</span> Valores do Serviço
                  </h3>
                </div>
                <div style="padding: 0 1.5rem 1.5rem 1.5rem;">
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div class="form-group" style="margin: 0;">
                      <label class="form-label" style="font-weight: 600; font-size: 0.9rem;">Mão de Obra (R$)</label>
                      <input type="number" class="form-input" id="os-valor-mao-obra" step="0.01" min="0" 
                        value="${osData ? osData.valor_mao_obra : 0}"
                        onchange="calcularValoresOS()">
                    </div>
                    <div class="form-group" style="margin: 0;">
                      <label class="form-label" style="font-weight: 600; font-size: 0.9rem;">Peças (R$)</label>
                      <input type="number" class="form-input" id="os-valor-pecas" step="0.01" min="0" 
                        value="${osData ? osData.valor_pecas : 0}"
                        onchange="calcularValoresOS()">
                    </div>
                  </div>
                  <div style="margin-top: 1rem; padding: 1.5rem; background: linear-gradient(135deg, var(--primary), var(--primary-light)); border-radius: var(--radius-lg); text-align: center; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
                    <div style="font-size: 0.9rem; color: rgba(255,255,255,0.9); margin-bottom: 0.5rem; letter-spacing: 1px; font-weight: 600;">VALOR TOTAL</div>
                    <div style="font-size: 2.5rem; font-weight: 800; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.2);" id="os-valor-total-display">
                      R$ ${osData ? formatMoney(osData.valor_total) : '0,00'}
                    </div>
                    <div style="font-size: 0.8rem; color: rgba(255,255,255,0.8); margin-top: 0.5rem;">
                      Mão de Obra + Peças + Deslocamento
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- SEÇÃO COMPLETA: DESCRIÇÃO DO SERVIÇO -->
          <div class="card" style="margin-bottom: 1.5rem; border-left: 3px solid var(--info);">
            <div class="card-header" style="margin-bottom: 1rem; padding-bottom: 0.75rem;">
              <h3 style="margin: 0; font-size: 1rem; color: var(--info); font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 1.2rem;">📝</span> Descrição do Serviço
              </h3>
            </div>
            <div style="padding: 0 1.5rem 1.5rem 1.5rem;">
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                <div class="form-group" style="margin: 0;">
                  <label class="form-label" style="font-weight: 600; margin-bottom: 0.5rem;">Problema Reportado *</label>
                  <textarea class="form-input" id="os-problema" rows="4" required 
                    placeholder="Descreva o problema reportado pelo cliente...">${osData ? osData.descricao_problema : ''}</textarea>
                </div>
                <div class="form-group" style="margin: 0;">
                  <label class="form-label" style="font-weight: 600; margin-bottom: 0.5rem;">Diagnóstico</label>
                  <textarea class="form-input" id="os-diagnostico" rows="4" 
                    placeholder="Diagnóstico técnico do problema...">${osData && osData.diagnostico ? osData.diagnostico : ''}</textarea>
                </div>
                <div class="form-group" style="margin: 0;">
                  <label class="form-label" style="font-weight: 600; margin-bottom: 0.5rem;">Solução Aplicada</label>
                  <textarea class="form-input" id="os-solucao" rows="4" 
                    placeholder="Descreva a solução aplicada...">${osData && osData.solucao ? osData.solucao : ''}</textarea>
                </div>
              </div>
            </div>
          </div>

          <!-- OBSERVAÇÕES -->
          <div class="card" style="margin-bottom: 1.5rem; border-left: 3px solid var(--secondary);">
            <div class="card-header" style="margin-bottom: 1rem; padding-bottom: 0.75rem;">
              <h3 style="margin: 0; font-size: 1rem; color: var(--secondary); font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 1.2rem;">📌</span> Observações
              </h3>
            </div>
            <div style="padding: 0 1.5rem 1.5rem 1.5rem;">
              <textarea class="form-input" id="os-observacoes" rows="3" 
                placeholder="Observações adicionais sobre o serviço..."
                style="width: 100%;">${osData && osData.observacoes ? osData.observacoes : ''}</textarea>
            </div>
          </div>

          ${isEdicao ? `
            <div class="card" style="border: 2px solid ${osData.status === 'FECHADA' ? 'var(--success)' : 'var(--warning)'}; border-left-width: 3px;">
              <div class="card-header" style="margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom-color: ${osData.status === 'FECHADA' ? 'var(--success)' : 'var(--warning)'};">
                <h3 style="margin: 0; font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; color: ${osData.status === 'FECHADA' ? 'var(--success)' : 'var(--warning)'};">
                  <span style="font-size: 1.2rem;">${osData.status === 'FECHADA' ? '✓' : '⚙️'}</span> 
                  Status da Ordem de Serviço
                </h3>
              </div>
              <div style="padding: 0 1.5rem 1.5rem 1.5rem;">
                <div class="form-group" style="margin-bottom: ${osData.status === 'FECHADA' ? '1rem' : '0'};">
                  <label class="form-label" style="font-weight: 600; margin-bottom: 0.5rem;">Status Atual</label>
                  <select class="form-input" id="os-status" ${osData.status === 'FECHADA' ? 'disabled' : ''}>
                    <option value="ABERTA" ${osData.status === 'ABERTA' ? 'selected' : ''}>🔵 Aberta</option>
                    <option value="EM_ANDAMENTO" ${osData.status === 'EM_ANDAMENTO' ? 'selected' : ''}>🟡 Em Andamento</option>
                    <option value="FECHADA" ${osData.status === 'FECHADA' ? 'selected' : ''}>🟢 Fechada</option>
                  </select>
                </div>
                ${osData.status === 'FECHADA' ? `
                  <div style="padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: var(--radius); border-left: 3px solid var(--success);">
                    <strong style="color: var(--success);">✓ OS Fechada em:</strong> 
                    <span style="color: var(--text-primary); font-weight: 600;">${formatDate(osData.data_fechamento)}</span>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}
        </form>
        
        <div class="modal-footer" style="background: var(--bg-secondary); border-top: 1px solid var(--border);">
          <button type="button" class="btn btn-secondary" onclick="fecharModal('modal-os')">
            ✕ Cancelar
          </button>
          ${isEdicao && osData.status === 'FECHADA' ? `
            <button type="button" class="btn btn-primary" onclick="gerarPDFOS(${osId})">
              📄 Gerar PDF
            </button>
          ` : `
            <button type="submit" form="form-os" class="btn btn-primary">
              ${isEdicao ? '💾 Salvar Alterações' : '✓ Criar Ordem de Serviço'}
            </button>
            ${isEdicao && osData.status !== 'FECHADA' ? `
              <button type="button" class="btn btn-success" onclick="fecharOS(${osId})">
                🔒 Fechar OS
              </button>
            ` : ''}
          `}
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Event listeners
  document.getElementById('os-cliente').addEventListener('change', carregarMaquinasCliente);
  document.getElementById('form-os').addEventListener('submit', (e) => {
    e.preventDefault();
    salvarOS(osId);
  });

  // Carregar máquinas se for edição
  if (isEdicao && osData.cliente_id) {
    await carregarMaquinasCliente();
  }

  // Calcular valores iniciais
  calcularValoresOS();
}

async function carregarMaquinasCliente() {
  const clienteId = document.getElementById('os-cliente').value;
  const maquinaSelect = document.getElementById('os-maquina');

  if (!clienteId) {
    maquinaSelect.innerHTML = '<option value="">Selecione uma máquina</option>';
    return;
  }

  const result = await window.api.listarMaquinas(parseInt(clienteId));
  const maquinas = result.maquinas || [];

  const currentValue = maquinaSelect.value;

  maquinaSelect.innerHTML = '<option value="">Selecione uma máquina</option>' +
    maquinas.map(m => `
      <option value="${m.id}" ${m.id == currentValue ? 'selected' : ''}>
        ${m.modelo}${m.numero_serie ? ` - ${m.numero_serie}` : ''}
      </option>
    `).join('');
}

function calcularValoresOS() {
  const kmIda = parseFloat(document.getElementById('os-km-ida').value) || 0;
  const kmVolta = parseFloat(document.getElementById('os-km-volta').value) || 0;
  const valorPorKm = parseFloat(document.getElementById('os-valor-km').value) || 0;
  const valorMaoObra = parseFloat(document.getElementById('os-valor-mao-obra').value) || 0;
  const valorPecas = parseFloat(document.getElementById('os-valor-pecas').value) || 0;

  const kmTotal = kmIda + kmVolta;
  const valorDeslocamento = kmTotal * valorPorKm;
  const valorTotal = valorMaoObra + valorPecas + valorDeslocamento;

  document.getElementById('os-km-total').value = kmTotal.toFixed(1);

  // Atualizar display do valor de deslocamento
  const deslocamentoDisplay = document.getElementById('os-valor-deslocamento-display');
  if (deslocamentoDisplay) {
    deslocamentoDisplay.textContent = 'R$ ' + formatMoney(valorDeslocamento);
  }

  document.getElementById('os-valor-total-display').textContent = 'R$ ' + formatMoney(valorTotal);
}

async function salvarOS(osId) {
  const dados = {
    cliente_id: document.getElementById('os-cliente').value,
    maquina_id: document.getElementById('os-maquina').value,
    mecanico_id: document.getElementById('os-mecanico').value,
    descricao_problema: document.getElementById('os-problema').value,
    diagnostico: document.getElementById('os-diagnostico').value,
    solucao: document.getElementById('os-solucao').value,
    km_ida: document.getElementById('os-km-ida').value,
    km_volta: document.getElementById('os-km-volta').value,
    valor_por_km: document.getElementById('os-valor-km').value,
    valor_mao_obra: document.getElementById('os-valor-mao-obra').value,
    valor_pecas: document.getElementById('os-valor-pecas').value,
    observacoes: document.getElementById('os-observacoes').value
  };

  if (osId) {
    // Adicionar status se estiver editando
    const statusSelect = document.getElementById('os-status');
    if (statusSelect) {
      dados.status = statusSelect.value;
    }
  }

  try {
    let result;
    if (osId) {
      result = await window.api.atualizarOS(osId, dados);
    } else {
      result = await window.api.criarOS(dados);
    }

    if (result.success) {
      showAlert(osId ? 'OS atualizada com sucesso!' : `OS ${result.numero_os} criada com sucesso!`, 'success');
      fecharModal('modal-os');
      await loadOrdens();
      if (AppState.currentPage === 'ordens-servico') {
        refreshPage();
      }
    } else {
      showAlert(result.message || 'Erro ao salvar OS', 'danger');
    }
  } catch (error) {
    console.error('Erro ao salvar OS:', error);
    showAlert('Erro ao salvar OS', 'danger');
  }
}

async function fecharOS(osId) {
  if (!confirm('Tem certeza que deseja fechar esta OS? Esta ação não pode ser desfeita.')) {
    return;
  }

  const dados = {
    cliente_id: document.getElementById('os-cliente').value,
    maquina_id: document.getElementById('os-maquina').value,
    mecanico_id: document.getElementById('os-mecanico').value,
    descricao_problema: document.getElementById('os-problema').value,
    diagnostico: document.getElementById('os-diagnostico').value,
    solucao: document.getElementById('os-solucao').value,
    km_ida: document.getElementById('os-km-ida').value,
    km_volta: document.getElementById('os-km-volta').value,
    valor_por_km: document.getElementById('os-valor-km').value,
    valor_mao_obra: document.getElementById('os-valor-mao-obra').value,
    valor_pecas: document.getElementById('os-valor-pecas').value,
    observacoes: document.getElementById('os-observacoes').value,
    status: 'FECHADA'
  };

  try {
    const result = await window.api.atualizarOS(osId, dados);

    if (result.success) {
      showAlert('OS fechada com sucesso!', 'success');
      fecharModal('modal-os');

      // Perguntar se deseja gerar PDF
      if (confirm('Deseja gerar o PDF da OS agora?')) {
        await gerarPDFOS(osId);
      }

      await loadOrdens();
      if (AppState.currentPage === 'ordens-servico') {
        refreshPage();
      }
    } else {
      showAlert(result.message || 'Erro ao fechar OS', 'danger');
    }
  } catch (error) {
    console.error('Erro ao fechar OS:', error);
    showAlert('Erro ao fechar OS', 'danger');
  }
}

async function gerarPDFOS(osId) {
  try {
    const result = await window.api.obterOS(osId);
    if (!result.success) {
      showAlert('Erro ao carregar dados da OS', 'danger');
      return;
    }

    const os = result.os;
    if (!os) {
      showAlert('Dados da OS não encontrados', 'danger');
      return;
    }

    // Normalizar valores para evitar erros de toFixed em nulos
    const normalizedOS = { ...os };
    normalizedOS.km_ida = parseFloat(os.km_ida) || 0;
    normalizedOS.km_volta = parseFloat(os.km_volta) || 0;
    normalizedOS.km_total = normalizedOS.km_ida + normalizedOS.km_volta;
    normalizedOS.valor_por_km = parseFloat(os.valor_por_km) || 0;
    normalizedOS.valor_deslocamento = (normalizedOS.km_total * normalizedOS.valor_por_km);
    normalizedOS.valor_mao_obra = parseFloat(os.valor_mao_obra) || 0;
    normalizedOS.valor_pecas = parseFloat(os.valor_pecas) || 0;
    normalizedOS.valor_total = parseFloat(os.valor_total) || (normalizedOS.valor_mao_obra + normalizedOS.valor_pecas + normalizedOS.valor_deslocamento);
    normalizedOS.solucao = os.solucao || os.servicos_realizados || '';

    // Garantir que campos de texto não sejam null
    normalizedOS.descricao_problema = os.descricao_problema || '';
    normalizedOS.diagnostico = os.diagnostico || '';
    normalizedOS.observacoes = os.observacoes || '';
    normalizedOS.cliente_nome = os.cliente_nome || 'Não informado';
    normalizedOS.maquina_modelo = os.maquina_modelo || 'Não informado';
    normalizedOS.mecanico_nome = os.mecanico_nome || 'Não informado';

    // Criar conteúdo HTML profissional para impressão
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>OS ${normalizedOS.numero_os} - SAMAPEOP</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 15px;
            color: #333;
            line-height: 1.4;
            background: white;
            font-size: 11px;
          }
          
          /* HEADER COM LOGO */
          .document-header {
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #2563eb;
          }
          
          .logo-container {
            margin-bottom: 8px;
          }
          
          .logo {
            width: 120px;
            height: auto;
          }
          
          .company-tagline {
            font-size: 0.75em;
            color: #64748b;
            font-weight: 500;
            margin-bottom: 8px;
          }
          
          .os-title {
            font-size: 1.3em;
            font-weight: 700;
            color: #1e293b;
            margin: 8px 0 5px 0;
          }
          
          .os-number {
            font-size: 1.5em;
            font-weight: 800;
            color: #2563eb;
            margin: 5px 0;
          }
          
          .os-dates {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 8px;
            font-size: 0.85em;
            color: #475569;
          }
          
          .os-dates strong {
            color: #1e293b;
          }
          
          /* SEÇÕES */
          .section {
            margin: 12px 0;
            page-break-inside: avoid;
          }
          
          .section-header {
            background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
            color: white;
            padding: 6px 12px;
            border-radius: 4px 4px 0 0;
            font-size: 0.95em;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .section-icon {
            font-size: 1.1em;
          }
          
          .section-body {
            border: 1px solid #e2e8f0;
            border-top: none;
            padding: 10px;
            border-radius: 0 0 4px 4px;
            background: #f8fafc;
          }
          
          /* GRID DE INFORMAÇÕES */
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          
          .info-grid-full {
            grid-column: 1 / -1;
          }
          
          .info-item {
            display: flex;
            flex-direction: column;
            gap: 3px;
          }
          
          .info-label {
            font-weight: 700;
            color: #475569;
            font-size: 0.75em;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          
          .info-value {
            font-size: 0.9em;
            color: #1e293b;
            font-weight: 500;
            padding: 5px 8px;
            background: white;
            border-radius: 3px;
            border: 1px solid #e2e8f0;
          }
          
          /* TEXTAREA */
          .text-area {
            width: 100%;
            min-height: 60px;
            padding: 8px;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            font-family: inherit;
            font-size: 0.85em;
            line-height: 1.4;
            resize: none;
            background: white;
            color: #1e293b;
          }
          
          /* BOX DE VALORES */
          .values-summary {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 10px;
            margin: 8px 0;
          }
          
          .value-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .value-row:last-child {
            border-bottom: none;
          }
          
          .value-label {
            font-weight: 600;
            color: #475569;
            font-size: 0.9em;
          }
          
          .value-amount {
            font-weight: 700;
            color: #1e293b;
            font-size: 0.95em;
          }
          
          /* TOTAL BOX */
          .total-box {
            background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
            color: white;
            padding: 15px;
            text-align: center;
            border-radius: 6px;
            margin: 15px 0;
          }
          
          .total-label {
            font-size: 0.85em;
            font-weight: 600;
            letter-spacing: 1.5px;
            margin-bottom: 6px;
            opacity: 0.95;
          }
          
          .total-amount {
            font-size: 2em;
            font-weight: 900;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          
          /* FOOTER */
          .document-footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 0.75em;
          }
          
          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin: 20px 0 10px 0;
          }
          
          .signature-box {
            text-align: center;
          }
          
          .signature-line {
            border-top: 1px solid #1e293b;
            margin: 40px 15px 6px 15px;
          }
          
          .signature-label {
            font-weight: 600;
            color: #475569;
            margin-top: 3px;
            font-size: 0.85em;
          }
          
          /* BOTÕES */
          .action-buttons {
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            background: #f1f5f9;
            border-radius: 6px;
          }
          
          .btn {
            padding: 10px 25px;
            font-size: 0.9em;
            font-weight: 600;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s;
            margin: 0 5px;
          }
          
          .btn-primary {
            background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
          }
          
          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
          }
          
          .btn-secondary {
            background: #64748b;
            color: white;
          }
          
          .btn-secondary:hover {
            background: #475569;
          }
          
          /* PRINT STYLES */
          @media print {
            body { 
              padding: 10px;
              font-size: 10px;
            }
            
            .no-print { 
              display: none !important; 
            }
            
            .section {
              page-break-inside: avoid;
              margin: 8px 0;
            }
            
            .document-header {
              margin-bottom: 10px;
              padding-bottom: 8px;
            }
            
            .total-box {
              box-shadow: none;
              border: 2px solid #2563eb;
              padding: 12px;
              margin: 12px 0;
            }
            
            .signatures {
              margin: 15px 0 8px 0;
            }
            
            .signature-line {
              margin: 30px 10px 5px 10px;
            }
          }
          
          @page {
            margin: 1cm;
          }
        </style>
      </head>
      <body>
        <!-- HEADER COM LOGO -->
        <div class="document-header">
          <div class="logo-container">
            <img src="resources/logonova2.png" alt="SAMAPE ÍNDIO" class="logo" style="width: 150px; height: auto;" onerror="this.style.display='none'" />
          </div>
          <div class="company-tagline">Sistema de Gerenciamento de Manutenção</div>
          
          <div class="os-title">ORDEM DE SERVIÇO</div>
          <div class="os-number">${normalizedOS.numero_os}</div>
          
          <div class="os-dates">
            <span><strong>Abertura:</strong> ${formatDate(normalizedOS.data_abertura)}</span>
            ${normalizedOS.data_fechamento ? `<span><strong>Fechamento:</strong> ${formatDate(normalizedOS.data_fechamento)}</span>` : ''}
            <span><strong>Status:</strong> <span style="color: ${normalizedOS.status === 'FECHADA' ? '#10b981' : normalizedOS.status === 'EM_ANDAMENTO' ? '#f59e0b' : '#2563eb'}; font-weight: 700;">${(normalizedOS.status || '').replace('_', ' ')}</span></span>
          </div>
        </div>

        <!-- CLIENTE -->
        <div class="section">
          <div class="section-header">
            <span class="section-icon">👤</span>
            <span>Informações do Cliente</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Nome / Razão Social</div>
                <div class="info-value">${normalizedOS.cliente_nome}</div>
              </div>
              <div class="info-item">
                <div class="info-label">CNPJ</div>
                <div class="info-value">${normalizedOS.cliente_cnpj || 'Não informado'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Telefone</div>
                <div class="info-value">${normalizedOS.cliente_telefone || 'Não informado'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">E-mail</div>
                <div class="info-value">${normalizedOS.cliente_email || 'Não informado'}</div>
              </div>
              <div class="info-item info-grid-full">
                <div class="info-label">Endereço Completo</div>
                <div class="info-value">${normalizedOS.cliente_endereco || 'Não informado'}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- MAQUINÁRIO -->
        <div class="section">
          <div class="section-header">
            <span class="section-icon">🚜</span>
            <span>Informações do Maquinário</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Modelo</div>
                <div class="info-value">${normalizedOS.maquina_modelo}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Número de Série</div>
                <div class="info-value">${normalizedOS.maquina_serie || 'Não informado'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Ano de Fabricação</div>
                <div class="info-value">${normalizedOS.maquina_ano || 'Não informado'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Tipo</div>
                <div class="info-value">${normalizedOS.maquina_tipo || 'Não informado'}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- MECÂNICO -->
        <div class="section">
          <div class="section-header">
            <span class="section-icon">👨‍🔧</span>
            <span>Mecânico Responsável</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Nome do Mecânico</div>
                <div class="info-value">${normalizedOS.mecanico_nome}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- DESLOCAMENTO -->
        <div class="section">
          <div class="section-header">
            <span class="section-icon">🚗</span>
            <span>Controle de Deslocamento</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">KM Ida</div>
                <div class="info-value">${normalizedOS.km_ida.toFixed(1)} km</div>
              </div>
              <div class="info-item">
                <div class="info-label">KM Volta</div>
                <div class="info-value">${normalizedOS.km_volta.toFixed(1)} km</div>
              </div>
              <div class="info-item">
                <div class="info-label">KM Total</div>
                <div class="info-value">${normalizedOS.km_total.toFixed(1)} km</div>
              </div>
              <div class="info-item">
                <div class="info-label">Valor por KM</div>
                <div class="info-value">R$ ${formatMoney(normalizedOS.valor_por_km)}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- DESCRIÇÃO DO SERVIÇO -->
        <div class="section">
          <div class="section-header">
            <span class="section-icon">📝</span>
            <span>Descrição do Serviço</span>
          </div>
          <div class="section-body">
            <div class="info-item" style="margin-bottom: 15px;">
              <div class="info-label">Problema Reportado</div>
              <textarea class="text-area" readonly>${normalizedOS.descricao_problema}</textarea>
            </div>
            ${normalizedOS.diagnostico ? `
              <div class="info-item" style="margin-bottom: 15px;">
                <div class="info-label">Diagnóstico Técnico</div>
                <textarea class="text-area" readonly>${normalizedOS.diagnostico}</textarea>
              </div>
            ` : ''}
            ${normalizedOS.solucao ? `
              <div class="info-item">
                <div class="info-label">Solução Aplicada</div>
                <textarea class="text-area" readonly>${normalizedOS.solucao}</textarea>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- VALORES -->
        <div class="section">
          <div class="section-header">
            <span class="section-icon">💰</span>
            <span>Detalhamento de Valores</span>
          </div>
          <div class="section-body">
            <div class="values-summary">
              <div class="value-row">
                <span class="value-label">Mão de Obra</span>
                <span class="value-amount">R$ ${formatMoney(normalizedOS.valor_mao_obra)}</span>
              </div>
              <div class="value-row">
                <span class="value-label">Peças e Materiais</span>
                <span class="value-amount">R$ ${formatMoney(normalizedOS.valor_pecas)}</span>
              </div>
              <div class="value-row">
                <span class="value-label">Deslocamento (${normalizedOS.km_total.toFixed(1)} km × R$ ${formatMoney(normalizedOS.valor_por_km)})</span>
                <span class="value-amount">R$ ${formatMoney(normalizedOS.valor_deslocamento)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- TOTAL -->
        <div class="total-box">
          <div class="total-label">VALOR TOTAL DO SERVIÇO</div>
          <div class="total-amount">R$ ${formatMoney(normalizedOS.valor_total)}</div>
        </div>

        ${normalizedOS.observacoes ? `
          <!-- OBSERVAÇÕES -->
          <div class="section">
            <div class="section-header">
              <span class="section-icon">📌</span>
              <span>Observações</span>
            </div>
            <div class="section-body">
              <textarea class="text-area" readonly>${normalizedOS.observacoes}</textarea>
            </div>
          </div>
        ` : ''}

        <!-- ASSINATURAS -->
        <div class="signatures">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Assinatura do Cliente</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Assinatura do Mecânico</div>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="document-footer">
          <p><strong>SAMAPEOP</strong> - Sistema de Gerenciamento de Manutenção</p>
          <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>

        <!-- BOTÕES DE AÇÃO -->
        <div class="action-buttons no-print">
          <button class="btn btn-primary" onclick="window.print()">
            🖨️ Imprimir / Salvar como PDF
          </button>
          <button class="btn btn-secondary" onclick="window.close()">
            ✕ Fechar
          </button>
        </div>
      </body>
      </html>
    `;

    // Abrir em nova janela para impressão
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    } else {
      showAlert('Bloqueador de pop-ups detectado. Por favor, permita pop-ups para gerar o PDF.', 'warning');
    }

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    showAlert('Erro ao gerar PDF', 'danger');
  }
}

function fecharModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.remove();
  }
}

// Helper functions
function showAlert(message, type) {
  // Criar alerta temporário
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; min-width: 300px; animation: slideIn 0.3s ease-out;';
  alert.textContent = message;
  document.body.appendChild(alert);

  setTimeout(() => {
    alert.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => alert.remove(), 300);
  }, 3000);
}

async function loadOrdens() {
  if (typeof loadOrdensServico === 'function') {
    await loadOrdensServico();
  }
}

function refreshPage() {
  if (typeof render === 'function') {
    render();
  }
}

