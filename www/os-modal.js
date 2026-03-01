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

  // Carregar dados necessários (Clientes, Mecânicos e Listagens de Peças)
  const [clientesRes, mecanicosRes, listagensRes] = await Promise.all([
    window.api.listarClientes(),
    window.api.listarUsuarios(),
    window.api.listarListagensPecas()
  ]);

  const clientes = clientesRes.clientes || [];
  const mecanicos = (mecanicosRes.usuarios || []).filter(u => u.cargo === 'MECANICO' || u.cargo === 'ADMIN');
  const listagens = listagensRes.listagens || [];

  const modalHTML = `
    <div class="modal-overlay" id="modal-os" style="z-index: 9999; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center;">
      <div class="modal-container" style="max-width: 800px; width: 95%; max-height: 95vh; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl); overflow: hidden; display: flex; flex-direction: column; position: relative; z-index: 10000; pointer-events: all;">
        
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
        
        <form id="form-os" class="modal-body" style="flex: 1; overflow-y: auto; padding: 2rem; background: var(--bg-primary);" novalidate>
          
          <!-- ETAPA 1: IDENTIFICAÇÃO -->
          <div id="os-step-1" class="os-form-step">
            <div style="display: grid; gap: 1.5rem;">
              <div class="card" style="border-left: 4px solid var(--primary); background: var(--bg-secondary);">
                <div style="margin-bottom: 1rem; font-weight: 700; color: var(--primary); display: flex; align-items: center; gap: 0.5rem;">
                   <span>👤</span> Dados do Cliente
                </div>
                <div class="form-group">
                  <label class="form-label">Cliente *</label>
                  <select class="form-input" id="os-cliente" required>
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
                  <select class="form-input" id="os-maquina" required>
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
                  <select class="form-input" id="os-mecanico" required>
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
              
              <!-- PEÇAS (VINCULAR LISTAGEM) -->
              <div class="card" style="border-left: 4px solid var(--primary); background: var(--bg-secondary);">
                <div style="margin-bottom: 1rem; font-weight: 700; color: var(--primary);">📦 Listagem de Peças</div>
                <div class="form-group">
                  <label class="form-label">Vincular Listagem Numerada</label>
                  <select class="form-input" id="os-listagem-pecas">
                    <option value="">Nenhuma listagem vinculada</option>
                    ${listagens.map(l => `
                      <option value="${l.id}" data-valor="${l.valor_total}" ${osData && osData.listagem_pecas_id === l.id ? 'selected' : ''}>
                         ${l.numero_lista} - R$ ${formatMoney(l.valor_total)} (${l.cliente_nome})
                      </option>
                    `).join('')}
                  </select>
                  <small style="color: var(--text-muted);">O valor total desta listagem será somado ao total da OS.</small>
                </div>
              </div>

              <!-- DESLOCAMENTO -->
              <div class="card" style="border-left: 4px solid var(--warning); background: var(--bg-secondary);">
                <div style="margin-bottom: 1rem; font-weight: 700; color: var(--warning);">🚗 Deslocamento</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div class="form-group">
                    <label class="form-label">Odômetro Saída (KM)</label>
                    <input type="number" class="form-input" id="os-km-ida" step="0.1" value="${osData ? osData.km_ida : 0}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Odômetro Chegada (KM)</label>
                    <input type="number" class="form-input" id="os-km-volta" step="0.1" value="${osData ? osData.km_volta : 0}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Valor por KM</label>
                    <input type="number" class="form-input" id="os-valor-km" step="0.01" value="${osData ? osData.valor_por_km : 0}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Distância Percorrida</label>
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
                    <input type="number" class="form-input" id="os-valor-mao-obra" step="0.01" value="${osData ? osData.valor_mao_obra : 0}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Peças (R$)</label>
                    <input type="number" class="form-input" id="os-valor-pecas" step="0.01" value="${osData ? osData.valor_pecas : 0}" readonly style="background: var(--bg-tertiary);">
                  </div>
                </div>
                <div style="margin-top: 1rem; padding: 1.5rem; background: var(--primary); border-radius: var(--radius-lg); text-align: center;">
                  <div style="font-size: 0.8rem; opacity: 0.9; margin-bottom: 0.4rem; letter-spacing: 1px;">VALOR TOTAL DA OS</div>
                  <div style="font-size: 2.2rem; font-weight: 800;" id="os-valor-total-display">R$ 0,00</div>
                </div>
              </div>

              <!-- STATUS E OBS -->
              <div class="card" style="background: var(--bg-secondary);">
                <div class="form-group">
                  <label class="form-label">Status da OS</label>
                  <select class="form-input" id="os-status">
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

  // Função para carregar valor da listagem selecionada
  const updateValorPecasFromLP = () => {
    const lpSelect = document.getElementById('os-listagem-pecas');
    const selectedOption = lpSelect.options[lpSelect.selectedIndex];
    const valor = parseFloat(selectedOption.getAttribute('data-valor')) || 0;
    document.getElementById('os-valor-pecas').value = valor;
    calcularValoresOS();
  };

  // Listeners para recalcular valores
  const camposCalculo = ['os-km-ida', 'os-km-volta', 'os-valor-km', 'os-valor-mao-obra', 'os-valor-pecas'];
  camposCalculo.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calcularValoresOS);
  });

  document.getElementById('os-listagem-pecas').addEventListener('change', updateValorPecasFromLP);

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

  document.getElementById('os-cliente').addEventListener('change', carregarMaquinasCliente);
  document.getElementById('form-os').addEventListener('submit', (e) => {
    e.preventDefault();
    salvarOS(osId);
  });

  // Carregar máquinas e valores iniciais
  if (isEdicao && osData.cliente_id) {
    await carregarMaquinasCliente();
    document.getElementById('os-maquina').value = osData.maquina_id;
  }

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
  const odoSaida = parseFloat(document.getElementById('os-km-ida').value) || 0;
  const odoChegada = parseFloat(document.getElementById('os-km-volta').value) || 0;
  const valorPorKm = parseFloat(document.getElementById('os-valor-km').value) || 0;
  const valorMaoObra = parseFloat(document.getElementById('os-valor-mao-obra').value) || 0;
  const valorPecas = parseFloat(document.getElementById('os-valor-pecas').value) || 0;

  const kmPercorrido = odoChegada > odoSaida ? (odoChegada - odoSaida) : 0;
  const valorDeslocamento = kmPercorrido * valorPorKm;
  const valorTotal = valorMaoObra + valorPecas + valorDeslocamento;

  const totalKMInput = document.getElementById('os-deslocamento-total');
  if (totalKMInput) {
    totalKMInput.value = `${kmPercorrido.toFixed(1)} KM (R$ ${formatMoney(valorDeslocamento)})`;
  }

  document.getElementById('os-valor-total-display').textContent = 'R$ ' + formatMoney(valorTotal);
}

async function salvarOS(osId) {
  const odoSaida = parseFloat(document.getElementById('os-km-ida').value) || 0;
  const odoChegada = parseFloat(document.getElementById('os-km-volta').value) || 0;
  const valorPorKm = parseFloat(document.getElementById('os-valor-km').value) || 0;
  const valorMaoObra = parseFloat(document.getElementById('os-valor-mao-obra').value) || 0;
  const valorPecas = parseFloat(document.getElementById('os-valor-pecas').value) || 0;
  const kmPercorrido = odoChegada > odoSaida ? (odoChegada - odoSaida) : 0;
  const valorDeslocamento = kmPercorrido * valorPorKm;
  const valorTotal = valorMaoObra + valorPecas + valorDeslocamento;

  const dados = {
    cliente_id: document.getElementById('os-cliente').value,
    maquina_id: document.getElementById('os-maquina').value,
    mecanico_id: document.getElementById('os-mecanico').value,
    descricao_problema: document.getElementById('os-problema').value,
    diagnostico: document.getElementById('os-diagnostico').value,
    solucao: document.getElementById('os-solucao').value,
    km_ida: odoSaida,
    km_volta: odoChegada,
    valor_por_km: valorPorKm,
    valor_mao_obra: valorMaoObra,
    valor_pecas: valorPecas,
    valor_total: valorTotal,
    listagem_pecas_id: document.getElementById('os-listagem-pecas').value || null,
    observacoes: document.getElementById('os-observacoes').value,
    status: document.getElementById('os-status').value
  };

  try {
    const result = osId ? await window.api.atualizarOS(osId, dados) : await window.api.criarOS(dados);

    if (result.success) {
      showAlert(osId ? 'OS atualizada!' : `OS ${result.numero_os} criada!`, 'success');
      fecharModal('modal-os');
      await loadOrdens();
      if (AppState.currentPage === 'ordens-servico') render();
    } else {
      showAlert(result.message || 'Erro ao salvar', 'danger');
    }
  } catch (error) {
    showAlert('Erro ao salvar', 'danger');
  }
}

async function fecharOS(osId) {
  if (!confirm('Deseja fechar esta OS?')) return;
  try {
    const result = await window.api.atualizarOS(osId, { status: 'FECHADA' });
    if (result.success) {
      showAlert('OS fechada!', 'success');
      if (confirm('Gerar PDF?')) await gerarPDFOS(osId);
      await loadOrdens();
      if (AppState.currentPage === 'ordens-servico') render();
    }
  } catch (error) {
    showAlert('Erro ao fechar', 'danger');
  }
}

async function gerarPDFOS(osId) {
  try {
    const result = await window.api.obterOS(osId);
    if (!result.success) return;
    const os = result.os;

    const km_total = (os.km_volta > os.km_ida) ? (os.km_volta - os.km_ida) : 0;
    const valor_deslocamento = km_total * (os.valor_por_km || 0);

    const printContent = `
      <div id="print-os-content" style="
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #333;
        line-height: 1.4;
        background: white;
        font-size: 11px;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      ">
        <!-- HEADER COM LOGO -->
        <div style="text-align: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #2563eb;">
          <div style="margin-bottom: 8px;">
            <img src="resources/logonova2.png" alt="SAMAPE" style="width: 150px; height: auto;" onerror="this.style.display='none'" />
          </div>
          <div style="font-size: 0.75em; color: #64748b; font-weight: 500; margin-bottom: 8px;">Sistema de Gerenciamento de Manutenção</div>
          <div style="font-size: 1.3em; font-weight: 700; color: #1e293b; margin: 8px 0 5px 0;">ORDEM DE SERVIÇO</div>
          <div style="font-size: 1.5em; font-weight: 800; color: #2563eb; margin: 5px 0;">${os.numero_os}</div>
          <div style="display: flex; justify-content: center; gap: 20px; margin-top: 8px; font-size: 0.85em; color: #475569;">
            <span><strong style="color: #1e293b;">Data de Abertura:</strong> ${new Date(os.data_abertura).toLocaleDateString()}</span>
            ${os.data_fechamento ? `<span><strong style="color: #1e293b;">Fechamento:</strong> ${new Date(os.data_fechamento).toLocaleDateString()}</span>` : ''}
          </div>
        </div>

        <!-- CLIENTE -->
        <div style="margin: 12px 0;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 6px 12px; border-radius: 4px 4px 0 0; font-size: 0.95em; font-weight: 700;">
            👤 Informações do Cliente
          </div>
          <div style="border: 1px solid #e2e8f0; border-top: none; padding: 10px; border-radius: 0 0 4px 4px; background: #f8fafc;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
              <div><strong style="font-size: 0.75em; color: #475569;">NOME / RAZÃO SOCIAL</strong><br><span style="font-size: 0.9em;">${os.cliente_nome}</span></div>
              <div><strong style="font-size: 0.75em; color: #475569;">CNPJ</strong><br><span style="font-size: 0.9em;">${os.cliente_cnpj || '-'}</span></div>
              <div><strong style="font-size: 0.75em; color: #475569;">TELEFONE</strong><br><span style="font-size: 0.9em;">${os.cliente_telefone || '-'}</span></div>
              <div><strong style="font-size: 0.75em; color: #475569;">ENDEREÇO</strong><br><span style="font-size: 0.9em;">${os.cliente_endereco || '-'}</span></div>
            </div>
          </div>
        </div>

        <!-- MAQUINÁRIO E RESPONSÁVEL -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 12px 0;">
          <div>
            <div style="background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 6px 12px; border-radius: 4px 4px 0 0; font-size: 0.95em; font-weight: 700;">🚜 Máquina</div>
            <div style="border: 1px solid #e2e8f0; border-top: none; padding: 10px; border-radius: 0 0 4px 4px; background: #f8fafc;">
              <strong style="font-size: 0.75em; color: #475569;">MODELO</strong><br><span style="font-size: 0.9em;">${os.maquina_modelo}</span>
            </div>
          </div>
          <div>
            <div style="background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 6px 12px; border-radius: 4px 4px 0 0; font-size: 0.95em; font-weight: 700;">👨‍🔧 Responsável</div>
            <div style="border: 1px solid #e2e8f0; border-top: none; padding: 10px; border-radius: 0 0 4px 4px; background: #f8fafc;">
              <strong style="font-size: 0.75em; color: #475569;">TÉCNICO</strong><br><span style="font-size: 0.9em;">${os.mecanico_nome}</span>
            </div>
          </div>
        </div>

        <!-- SERVIÇOS -->
        <div style="margin: 12px 0;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 6px 12px; border-radius: 4px 4px 0 0; font-size: 0.95em; font-weight: 700;">
            📝 Descrição do Serviço
          </div>
          <div style="border: 1px solid #e2e8f0; border-top: none; padding: 10px; border-radius: 0 0 4px 4px; background: #f8fafc;">
            <div style="margin-bottom: 10px;">
              <strong style="font-size: 0.75em; color: #475569;">PROBLEMA REPORTADO</strong><br>
              <div style="font-size: 0.9em; padding: 8px; background: white; border: 1px solid #cbd5e1; border-radius: 4px; margin-top: 4px;">${os.descricao_problema.replace(/\\n/g, '<br>')}</div>
            </div>
            ${os.diagnostico ? `
            <div style="margin-bottom: 10px;">
              <strong style="font-size: 0.75em; color: #475569;">DIAGNÓSTICO TÉCNICO</strong><br>
              <div style="font-size: 0.9em; padding: 8px; background: white; border: 1px solid #cbd5e1; border-radius: 4px; margin-top: 4px;">${os.diagnostico.replace(/\\n/g, '<br>')}</div>
            </div>` : ''}
            ${os.solucao ? `
            <div>
              <strong style="font-size: 0.75em; color: #475569;">SOLUÇÃO APLICADA</strong><br>
              <div style="font-size: 0.9em; padding: 8px; background: white; border: 1px solid #cbd5e1; border-radius: 4px; margin-top: 4px;">${os.solucao.replace(/\\n/g, '<br>')}</div>
            </div>` : ''}
          </div>
        </div>

        <!-- VALORES -->
        <div style="margin: 12px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <!-- Deslocamento -->
          <div>
            <div style="background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 6px 12px; border-radius: 4px 4px 0 0; font-size: 0.95em; font-weight: 700;">🛣️ Deslocamento</div>
            <div style="border: 1px solid #e2e8f0; border-top: none; padding: 10px; border-radius: 0 0 4px 4px; background: #f8fafc;">
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding: 4px 0;">
                <span style="font-size: 0.85em; color: #475569; font-weight: 600;">Distância (${os.km_volta} - ${os.km_ida})</span>
                <span style="font-size: 0.85em; font-weight: 700;">${km_total.toFixed(1)} km</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                <span style="font-size: 0.85em; color: #475569; font-weight: 600;">Custo</span>
                <span style="font-size: 0.85em; font-weight: 700;">R$ ${formatMoney(valor_deslocamento)}</span>
              </div>
            </div>
          </div>
          <!-- Financeiro -->
          <div>
            <div style="background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 6px 12px; border-radius: 4px 4px 0 0; font-size: 0.95em; font-weight: 700;">💰 Financeiro</div>
            <div style="border: 1px solid #e2e8f0; border-top: none; padding: 10px; border-radius: 0 0 4px 4px; background: #f8fafc;">
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding: 4px 0;">
                <span style="font-size: 0.85em; color: #475569; font-weight: 600;">Mão de Obra</span>
                <span style="font-size: 0.85em; font-weight: 700;">R$ ${formatMoney(os.valor_mao_obra || 0)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                <span style="font-size: 0.85em; color: #475569; font-weight: 600;">Peças / Materiais</span>
                <span style="font-size: 0.85em; font-weight: 700;">R$ ${formatMoney(os.valor_pecas || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- TOTAL -->
        <div style="background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 15px; text-align: center; border-radius: 6px; margin: 15px 0;">
          <div style="font-size: 0.85em; font-weight: 600; letter-spacing: 1.5px; margin-bottom: 6px;">VALOR TOTAL DO SERVIÇO</div>
          <div style="font-size: 2em; font-weight: 900; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">R$ ${formatMoney(os.valor_total || 0)}</div>
        </div>

        <!-- ASSINATURAS -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 50px 0 20px 0; text-align: center;">
          <div>
            <div style="border-top: 1px solid #1e293b; margin: 0 15px 6px 15px;"></div>
            <div style="font-weight: 600; color: #475569; font-size: 0.85em;">Assinatura do Cliente</div>
          </div>
          <div>
            <div style="border-top: 1px solid #1e293b; margin: 0 15px 6px 15px;"></div>
            <div style="font-weight: 600; color: #475569; font-size: 0.85em;">Assinatura do Técnico</div>
          </div>
        </div>
      </div>
    `;

    const overlay = document.createElement('div');
    overlay.id = 'print-overlay';
    overlay.style.cssText = 'position: absolute; top:0; left:0; width:100%; min-height:100vh; background:#f1f5f9; z-index:20000; overflow-y:auto; padding: 20px 0; display: flex; flex-direction: column; align-items: center;';

    overlay.innerHTML = `
      <style>
        @media print {
          body > :not(#print-overlay) { display: none !important; }
          #print-overlay {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 0 !important;
          }
          .no-print { display: none !important; }
        }
      </style>
      <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); width: 100%; max-width: 850px; margin-bottom: 80px;">
        ${printContent}
      </div>
      <div class="no-print" style="position:fixed; bottom:20px; right:20px; display: flex; gap: 10px;">
        <button onclick="document.body.removeChild(this.parentNode.parentNode);" style="padding:10px 20px; background:#64748b; color:white; border:none; border-radius:8px; cursor: pointer; font-weight: bold;">Cancelar e Fechar</button>
        <button onclick="window.print()" style="padding:10px 20px; background:#2563eb; color:white; border:none; border-radius:8px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 12px rgba(37,99,235,0.3);">🖨️ Imprimir OS</button>
      </div>
    `;
    document.body.appendChild(overlay);
  } catch (e) {
    console.error('Erro ao gerar PDF', e);
  }
}

function fecharModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.remove();
}

function showAlert(message, type) {
  const alertDiv = document.createElement('div');
  alertDiv.style.cssText = `position: fixed; top: 20px; right: 20px; padding: 15px 25px; border - radius: 8px; color: white; font - weight: 600; z - index: 9999; background: ${type === 'success' ? 'var(--success)' : 'var(--danger)'}; `;
  alertDiv.textContent = message;
  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 3000);
}

async function loadOrdens() {
  if (typeof loadOrdensServico === 'function') await loadOrdensServico();
}

window.gerarPDFOS = gerarPDFOS;
