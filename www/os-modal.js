// ==================== MODAL DE ORDEM DE SERVIÇO DETALHADA (WIZARD) ====================

async function mostrarModalOS(osId = null) {
  const isEdicao = osId !== null;
  let osData = null;
  let currentStepOS = 1;

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
      <div class="modal-container" style="max-width: 800px; width: 95%; max-height: 95vh; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl); overflow: hidden; display: flex; flex-direction: column; position: relative;">
        
        <!-- HEADER COM INDICADOR DE ETAPAS -->
        <div class="modal-header" style="background: var(--bg-secondary); border-bottom: 1px solid var(--border); padding: 1.5rem; display: block;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h2 class="modal-title" style="margin: 0; font-size: 1.3rem; display: flex; align-items: center; gap: 0.5rem; color: var(--text-primary);">
              <span>📋</span>
              ${isEdicao ? `Editar OS ${osData.numero_os}` : 'Nova Ordem de Serviço'}
            </h2>
            <button class="modal-close" onclick="fecharModal('modal-os')" style="font-size: 1.5rem; background: none; border: none; color: var(--text-muted); cursor: pointer;">&times;</button>
          </div>

          <!-- STEP INDICATOR -->
          <div style="display: flex; justify-content: space-between; position: relative; padding: 0 1.5rem;">
             <div style="position: absolute; top: 15px; left: 3rem; right: 3rem; height: 3px; background: var(--border); z-index: 1;"></div>
             <div id="step-line-progress" style="position: absolute; top: 15px; left: 3rem; width: 0%; height: 3px; background: var(--primary); z-index: 2; transition: var(--transition);"></div>
             
             <div class="os-step-item" id="step-dot-1" style="z-index: 3; position: relative; text-align: center;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; margin: 0 auto 0.5rem; border: 3px solid var(--bg-secondary); transition: var(--transition);">1</div>
                <span style="font-size: 0.7rem; font-weight: 600; color: var(--text-primary);">Identificação</span>
             </div>
             
             <div class="os-step-item" id="step-dot-2" style="z-index: 3; position: relative; text-align: center;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--bg-tertiary); color: var(--text-muted); display: flex; align-items: center; justify-content: center; font-weight: bold; margin: 0 auto 0.5rem; border: 3px solid var(--bg-secondary); transition: var(--transition);">2</div>
                <span style="font-size: 0.7rem; font-weight: 500; color: var(--text-muted);">Descrição</span>
             </div>
             
             <div class="os-step-item" id="step-dot-3" style="z-index: 3; position: relative; text-align: center;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--bg-tertiary); color: var(--text-muted); display: flex; align-items: center; justify-content: center; font-weight: bold; margin: 0 auto 0.5rem; border: 3px solid var(--bg-secondary); transition: var(--transition);">3</div>
                <span style="font-size: 0.7rem; font-weight: 500; color: var(--text-muted);">Valores</span>
             </div>
          </div>
        </div>
        
        <form id="form-os" class="modal-body" style="flex: 1; overflow-y: auto; padding: 2rem; background: var(--bg-primary);">
          
          <!-- ETAPA 1: IDENTIFICAÇÃO -->
          <div id="os-step-1" class="os-form-step">
            <div style="display: grid; gap: 1.5rem;">
              <div class="card" style="border-left: 4px solid var(--primary); background: var(--bg-secondary);">
                <div style="margin-bottom: 1rem; font-weight: 700; color: var(--primary); display: flex; align-items: center; gap: 0.5rem;">
                  <span>👤</span> Dados do Cliente
                </div>
                <div class="form-group">
                  <label class="form-label">Cliente *</label>
                  <select class="form-input" id="os-cliente" required ${isEdicao && osData.status !== 'ABERTA' ? 'disabled' : ''}>
                    <option value="">Selecione um cliente</option>
                    ${clientes.map(c => `
                      <option value="${c.id}" ${osData && osData.cliente_id === c.id ? 'selected' : ''}>
                        ${c.nome}${c.cnpj ? ` - ${c.cnpj}` : ''}
                      </option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <div class="card" style="border-left: 4px solid var(--info); background: var(--bg-secondary);">
                <div style="margin-bottom: 1rem; font-weight: 700; color: var(--info); display: flex; align-items: center; gap: 0.5rem;">
                  <span>🚜</span> Maquinário
                </div>
                <div class="form-group">
                  <label class="form-label">Máquina *</label>
                  <select class="form-input" id="os-maquina" required ${isEdicao && osData.status !== 'ABERTA' ? 'disabled' : ''}>
                    <option value="">Selecione uma máquina</option>
                  </select>
                </div>
              </div>

              <div class="card" style="border-left: 4px solid var(--secondary); background: var(--bg-secondary);">
                <div style="margin-bottom: 1rem; font-weight: 700; color: var(--secondary); display: flex; align-items: center; gap: 0.5rem;">
                  <span>👨‍🔧</span> Responsável
                </div>
                <div class="form-group">
                  <label class="form-label">Mecânico *</label>
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

          <!-- ETAPA 2: DESCRIÇÃO DO SERVIÇO -->
          <div id="os-step-2" class="os-form-step" style="display: none;">
            <div style="display: grid; gap: 1.5rem;">
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Problema Reportado *</label>
                <textarea class="form-input" id="os-problema" rows="5" required 
                  placeholder="Descreva o problema reportado pelo cliente...">${osData ? osData.descricao_problema : ''}</textarea>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Diagnóstico Técnico</label>
                <textarea class="form-input" id="os-diagnostico" rows="5" 
                  placeholder="Diagnóstico técnico do problema...">${osData && osData.diagnostico ? osData.diagnostico : ''}</textarea>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600;">Solução / Serviços Realizados</label>
                <textarea class="form-input" id="os-solucao" rows="5" 
                  placeholder="Descreva detalhadamente o serviço realizado...">${osData && osData.solucao ? osData.solucao : ''}</textarea>
              </div>
            </div>
          </div>

          <!-- ETAPA 3: VALORES E STATUS -->
          <div id="os-step-3" class="os-form-step" style="display: none;">
            <div style="display: grid; gap: 1.5rem;">
              
              <!-- DESLOCAMENTO -->
              <div class="card" style="border-left: 4px solid var(--warning); background: var(--bg-secondary);">
                <div style="margin-bottom: 1rem; font-weight: 700; color: var(--warning);">🚗 Deslocamento</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div class="form-group">
                    <label class="form-label">KM Ida</label>
                    <input type="number" class="form-input" id="os-km-ida" step="0.1" value="${osData ? osData.km_ida : 0}" onchange="calcularValoresOS()">
                  </div>
                  <div class="form-group">
                    <label class="form-label">KM Volta</label>
                    <input type="number" class="form-input" id="os-km-volta" step="0.1" value="${osData ? osData.km_volta : 0}" onchange="calcularValoresOS()">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Valor por KM</label>
                    <input type="number" class="form-input" id="os-valor-km" step="0.01" value="${osData ? osData.valor_por_km : 0}" onchange="calcularValoresOS()">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Total Deslocamento</label>
                    <input type="text" class="form-input" id="os-deslocamento-total" readonly style="background: var(--bg-tertiary); color: var(--warning); font-weight: bold;">
                  </div>
                </div>
              </div>

              <!-- FINANCEIRO -->
              <div class="card" style="border-left: 4px solid var(--success); background: var(--bg-secondary);">
                <div style="margin-bottom: 1rem; font-weight: 700; color: var(--success);">💰 Financeiro</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div class="form-group">
                    <label class="form-label">Mão de Obra (R$)</label>
                    <input type="number" class="form-input" id="os-valor-mao-obra" step="0.01" value="${osData ? osData.valor_mao_obra : 0}" onchange="calcularValoresOS()">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Peças (R$)</label>
                    <input type="number" class="form-input" id="os-valor-pecas" step="0.01" value="${osData ? osData.valor_pecas : 0}" onchange="calcularValoresOS()">
                  </div>
                </div>
                <div style="margin-top: 1rem; padding: 1.5rem; background: var(--primary); border-radius: var(--radius-lg); text-align: center;">
                  <div style="font-size: 0.8rem; opacity: 0.9; margin-bottom: 0.4rem; letter-spacing: 1px;">VALOR TOTAL DA OS</div>
                  <div style="font-size: 2.2rem; font-weight: 800;" id="os-valor-total-display">R$ 0,00</div>
                </div>
              </div>

              <!-- STATUS E OBS -->
              <div class="form-group">
                <label class="form-label">Status da OS</label>
                <select class="form-input" id="os-status" ${isEdicao && osData.status === 'FECHADA' ? 'disabled' : ''}>
                  <option value="ABERTA" ${osData?.status === 'ABERTA' ? 'selected' : ''}>🔵 Aberta</option>
                  <option value="EM_ANDAMENTO" ${osData?.status === 'EM_ANDAMENTO' ? 'selected' : ''}>🟡 Em Andamento</option>
                  <option value="FECHADA" ${osData?.status === 'FECHADA' ? 'selected' : ''}>🟢 Fechada</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Observações Internas</label>
                <textarea class="form-input" id="os-observacoes" rows="3" placeholder="Anotações para controle interno...">${osData && osData.observacoes ? osData.observacoes : ''}</textarea>
              </div>
            </div>
          </div>
        </form>
        
        <div class="modal-footer" style="background: var(--bg-secondary); border-top: 1px solid var(--border); padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <button type="button" class="btn btn-secondary" id="btn-prev-os" style="display: none; height: 45px; padding: 0 1.5rem;">
              ⬅ Anterior
            </button>
          </div>
          <div style="display: flex; gap: 0.75rem;">
            <button type="button" class="btn btn-secondary" onclick="fecharModal('modal-os')" style="height: 45px; padding: 0 1.25rem;">
              Cancelar
            </button>
            <button type="button" class="btn btn-primary" id="btn-next-os" style="height: 45px; padding: 0 2rem;">
              Próximo ➡
            </button>
            <button type="submit" form="form-os" class="btn btn-success" id="btn-save-os" style="display: none; height: 45px; padding: 0 2rem;">
              ${isEdicao ? '💾 Salvar OS' : '✓ Concluir'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // LOGICA DO WIZARD
  const updateWizard = () => {
    // Esconder todos os passos
    document.querySelectorAll('.os-form-step').forEach(step => step.style.display = 'none');
    // Mostrar passo atual
    document.getElementById(`os-step-${currentStepOS}`).style.display = 'block';

    // Atualizar indicadores (bolinhas)
    for (let i = 1; i <= 3; i++) {
      const dot = document.getElementById(`step-dot-${i}`);
      const line = document.getElementById('step-line-progress');
      const circle = dot.querySelector('div');
      const text = dot.querySelector('span');

      if (i < currentStepOS) {
        circle.style.background = 'var(--success)';
        circle.style.color = 'white';
        circle.innerText = '✓';
        text.style.color = 'var(--success)';
        text.style.opacity = '1';
      } else if (i === currentStepOS) {
        circle.style.background = 'var(--primary)';
        circle.style.color = 'white';
        circle.innerText = i;
        text.style.color = 'var(--primary)';
        text.style.opacity = '1';
        text.style.fontWeight = '700';
      } else {
        circle.style.background = 'var(--bg-tertiary)';
        circle.style.color = 'var(--text-muted)';
        circle.innerText = i;
        text.style.color = 'var(--text-muted)';
        text.style.opacity = '0.6';
        text.style.fontWeight = '500';
      }

      // Linha de progresso
      line.style.width = currentStepOS === 1 ? '0%' : (currentStepOS === 2 ? '50%' : '100%');
    }

    // Gerenciar botões do footer
    document.getElementById('btn-prev-os').style.display = currentStepOS === 1 ? 'none' : 'block';
    if (currentStepOS === 3) {
      document.getElementById('btn-next-os').style.display = 'none';
      document.getElementById('btn-save-os').style.display = 'block';
    } else {
      document.getElementById('btn-next-os').style.display = 'block';
      document.getElementById('btn-save-os').style.display = 'none';
    }

    // Scroll para o topo do modal ao mudar de etapa
    document.querySelector('#form-os').scrollTop = 0;
  };

  // Listeners de navegação
  document.getElementById('btn-next-os').addEventListener('click', () => {
    if (currentStepOS === 1) {
      const client = document.getElementById('os-cliente').value;
      const machine = document.getElementById('os-maquina').value;
      const mech = document.getElementById('os-mecanico').value;
      if (!client || !machine || !mech) return alert('Selecione Cliente, Máquina e Mecânico antes de avançar.');
    }
    if (currentStepOS === 2) {
      const prob = document.getElementById('os-problema').value;
      if (!prob) return alert('Descreva o problema reportado antes de avançar.');
    }
    currentStepOS++;
    updateWizard();
  });

  document.getElementById('btn-prev-os').addEventListener('click', () => {
    currentStepOS--;
    updateWizard();
  });

  // Event listeners normais
  document.getElementById('os-cliente').addEventListener('change', carregarMaquinasCliente);
  document.getElementById('form-os').addEventListener('submit', (e) => {
    e.preventDefault();
    salvarOS(osId);
  });

  // Carregar máquinas se for edição
  if (isEdicao && osData.cliente_id) {
    await carregarMaquinasCliente();
    const maquinaSelect = document.getElementById('os-maquina');
    maquinaSelect.value = osData.maquina_id;
  }

  // Calcular valores iniciais
  calcularValoresOS();
  updateWizard();
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

  const totalKMInput = document.getElementById('os-deslocamento-total');
  if (totalKMInput) {
    totalKMInput.value = 'R$ ' + formatMoney(valorDeslocamento);
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
    observacoes: document.getElementById('os-observacoes').value,
    status: document.getElementById('os-status').value
  };

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
        render();
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
    status: 'FECHADA'
  };

  try {
    const result = await window.api.atualizarOS(osId, dados);

    if (result.success) {
      showAlert('OS fechada com sucesso!', 'success');
      fecharModal('modal-os');

      if (confirm('Deseja gerar o PDF da OS agora?')) {
        await gerarPDFOS(osId);
      }

      await loadOrdens();
      if (AppState.currentPage === 'ordens-servico') {
        render();
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

    // Normalizar valores
    const normalizedOS = { ...os };
    normalizedOS.km_ida = parseFloat(os.km_ida) || 0;
    normalizedOS.km_volta = parseFloat(os.km_volta) || 0;
    normalizedOS.km_total = normalizedOS.km_ida + normalizedOS.km_volta;
    normalizedOS.valor_por_km = parseFloat(os.valor_por_km) || 0;
    normalizedOS.valor_deslocamento = (normalizedOS.km_total * normalizedOS.valor_por_km);
    normalizedOS.valor_mao_obra = parseFloat(os.valor_mao_obra) || 0;
    normalizedOS.valor_pecas = parseFloat(os.valor_pecas) || 0;
    normalizedOS.valor_total = parseFloat(os.valor_total) || (normalizedOS.valor_mao_obra + normalizedOS.valor_pecas + normalizedOS.valor_deslocamento);

    // Criar conteúdo HTML para impressão
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>OS ${normalizedOS.numero_os} - SAMAPEOP</title>
        <style>
          body { font-family: sans-serif; padding: 20px; color: #333; line-height: 1.5; }
          .header { text-align: center; border-bottom: 2px solid #2563eb; margin-bottom: 20px; padding-bottom: 10px; }
          .os-number { font-size: 24px; font-weight: bold; color: #2563eb; }
          .section { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
          .section-header { background: #f3f4f6; padding: 10px; font-weight: bold; border-bottom: 1px solid #ddd; }
          .section-body { padding: 15px; }
          .info-row { display: flex; margin-bottom: 5px; }
          .info-label { font-weight: bold; width: 150px; }
          .total-box { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; margin-top: 20px; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="resources/logonova2.png" alt="SAMAPE" style="width: 150px;">
          <h1>ORDEM DE SERVIÇO</h1>
          <div class="os-number">${normalizedOS.numero_os}</div>
        </div>

        <div class="section">
          <div class="section-header">INFORMAÇÕES GERAIS</div>
          <div class="section-body">
            <div class="info-row"><div class="info-label">Cliente:</div><div>${normalizedOS.cliente_nome}</div></div>
            <div class="info-row"><div class="info-label">Máquina:</div><div>${normalizedOS.maquina_modelo}</div></div>
            <div class="info-row"><div class="info-label">Técnico:</div><div>${normalizedOS.mecanico_nome}</div></div>
            <div class="info-row"><div class="info-label">Data:</div><div>${formatDate(normalizedOS.data_abertura)}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">DESCRIÇÃO DOS SERVIÇOS</div>
          <div class="section-body">
            <p><strong>Problema:</strong> ${normalizedOS.descricao_problema}</p>
            <p><strong>Diagnóstico:</strong> ${normalizedOS.diagnostico || '-'}</p>
            <p><strong>Solução:</strong> ${normalizedOS.solucao || '-'}</p>
          </div>
        </div>

        <div class="section">
          <div class="section-header">VALORES</div>
          <div class="section-body">
            <div class="info-row"><div class="info-label">Mão de Obra:</div><div>R$ ${formatMoney(normalizedOS.valor_mao_obra)}</div></div>
            <div class="info-row"><div class="info-label">Peças:</div><div>R$ ${formatMoney(normalizedOS.valor_pecas)}</div></div>
            <div class="info-row"><div class="info-label">Deslocamento:</div><div>R$ ${formatMoney(normalizedOS.valor_deslocamento)}</div></div>
          </div>
        </div>

        <div class="total-box">TOTAL: R$ ${formatMoney(normalizedOS.valor_total)}</div>

        <div class="footer">
          <p>SAMAPE ÍNDIO - Sistema de Gerenciamento de Manutenção</p>
          <p>Impressão realizada em ${new Date().toLocaleString('pt-BR')}</p>
          <div class="no-print" style="margin-top: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; cursor: pointer;">Imprimir documento</button>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
  }
}

function fecharModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.remove();
}

function showAlert(message, type) {
  const alertDiv = document.createElement('div');
  alertDiv.style.cssText = `position: fixed; top: 20px; right: 20px; padding: 15px 25px; border-radius: 8px; color: white; font-weight: 600; z-index: 9999; background: ${type === 'success' ? 'var(--success)' : 'var(--danger)'}; box-shadow: var(--shadow-lg);`;
  alertDiv.textContent = message;
  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 3000);
}

async function loadOrdens() {
  if (typeof loadOrdensServico === 'function') {
    await loadOrdensServico();
  }
}
