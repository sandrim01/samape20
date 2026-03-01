// ==================== MODAL DE ORDEM DE SERVIÇO DETALHADA (WIZARD) ====================

async function mostrarModalOS(osId = null) {
  const isEdicao = osId !== null;
  let osData = null;
  let currentStepOS = 1;
  let pecasOS = []; // Lista de peças vinculadas a esta OS

  if (isEdicao) {
    const [osRes, pecasOSRes] = await Promise.all([
      window.api.obterOS(osId),
      window.api.listarPecasOS(osId)
    ]);

    if (osRes.success) {
      osData = osRes.os;
      pecasOS = pecasOSRes.pecas || [];
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
                <span style="font-size: 0.6rem; font-weight: 600; color: var(--text-primary);">Identificação</span>
             </div>
             
             <div class="os-step-item" id="step-dot-2" style="z-index: 3; position: relative; text-align: center;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--bg-tertiary); color: var(--text-muted); display: flex; align-items: center; justify-content: center; font-weight: bold; margin: 0 auto 0.5rem; border: 3px solid var(--bg-secondary); transition: var(--transition);">2</div>
                <span style="font-size: 0.6rem; font-weight: 500; color: var(--text-muted);">Serviços</span>
             </div>

             <div class="os-step-item" id="step-dot-3" style="z-index: 3; position: relative; text-align: center;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--bg-tertiary); color: var(--text-muted); display: flex; align-items: center; justify-content: center; font-weight: bold; margin: 0 auto 0.5rem; border: 3px solid var(--bg-secondary); transition: var(--transition);">3</div>
                <span style="font-size: 0.6rem; font-weight: 500; color: var(--text-muted);">Peças</span>
             </div>
             
             <div class="os-step-item" id="step-dot-4" style="z-index: 3; position: relative; text-align: center;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--bg-tertiary); color: var(--text-muted); display: flex; align-items: center; justify-content: center; font-weight: bold; margin: 0 auto 0.5rem; border: 3px solid var(--bg-secondary); transition: var(--transition);">4</div>
                <span style="font-size: 0.6rem; font-weight: 500; color: var(--text-muted);">Financ.</span>
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

          </div>

          <!-- ETAPA 3: PEÇAS (EXCLUSIVO EDIÇÃO OU APÓS SALVAR INICIAL) -->
          <div id="os-step-3" class="os-form-step" style="display: none;">
             ${!isEdicao ? `
                <div class="alert alert-info" style="margin-bottom: 0;">
                  Para adicionar peças, primeiro salve as informações básicas da OS no final do assistente (Etapa 4).
                </div>
             ` : `
                <div style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: var(--radius); border: 1px solid var(--border); margin-bottom: 1.5rem;">
                   <h4 style="margin: 0 0 1rem 0; font-size: 0.9rem; color: var(--primary);">Adicionar Peça do Estoque</h4>
                   <div style="display: grid; grid-template-columns: 2fr 0.8fr 0.8fr 1fr auto; gap: 0.75rem; align-items: flex-end;">
                      <div class="form-group" style="margin:0;">
                         <label class="form-label" style="font-size: 0.75rem;">Peça (Selecione ou Digite)</label>
                         <input list="os-pecas-datalist" class="form-input" id="os-peca-input" placeholder="Nome da peça..." style="font-size: 0.85rem;">
                         <datalist id="os-pecas-datalist">
                            ${(AppState.data.pecas || []).map(p => `
                               <option value="${p.nome}" data-id="${p.id}" data-codigo="${p.codigo}" data-preco="${p.preco_venda}">${p.codigo ? `[${p.codigo}] ` : ''}${p.nome} (Sald: ${p.quantidade_estoque})</option>
                            `).join('')}
                         </datalist>
                      </div>
                      <div class="form-group" style="margin:0;">
                         <label class="form-label" style="font-size: 0.75rem;">Código</label>
                         <input type="text" class="form-input" id="os-peca-codigo-input" placeholder="Opcional" style="font-size: 0.85rem;">
                      </div>
                      <div class="form-group" style="margin:0;">
                         <label class="form-label" style="font-size: 0.75rem;">Qtd</label>
                         <input type="number" class="form-input" id="os-peca-qtd" value="1" min="1" step="1" style="font-size: 0.85rem;">
                      </div>
                      <div class="form-group" style="margin:0;">
                         <label class="form-label" style="font-size: 0.75rem;">Preço Unit. (R$)</label>
                         <input type="number" class="form-input" id="os-peca-preco" step="0.01" style="font-size: 0.85rem;">
                      </div>
                      <button type="button" class="btn btn-primary" onclick="window.adicionarPecaOSFunc()" style="height: 38px; padding: 0 1rem;">+</button>
                   </div>
                </div>

                <div class="table-container" style="max-height: 250px; overflow-y: auto;">
                   <table style="font-size: 0.85rem;">
                      <thead style="position: sticky; top: 0; background: var(--bg-tertiary); z-index: 2;">
                         <tr>
                            <th>Código/Peça</th>
                            <th>Valor Unit.</th>
                            <th>Qtd</th>
                            <th>Total</th>
                            <th style="width: 50px;"></th>
                         </tr>
                      </thead>
                      <tbody id="os-pecas-list">
                         ${pecasOS.length === 0 ? '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">Nenhuma peça adicionada</td></tr>' :
      pecasOS.map(p => `
                             <tr>
                               <td><strong>${p.peca_codigo}</strong><br><small>${p.peca_nome}</small></td>
                               <td>R$ ${formatMoney(p.preco_unitario)}</td>
                               <td>${p.quantidade}</td>
                               <td>R$ ${formatMoney(p.preco_total)}</td>
                               <td style="text-align: right;">
                                  <button type="button" class="btn btn-danger btn-sm" onclick="window.removerPecaOSFunc(${p.id})">&times;</button>
                               </td>
                             </tr>
                           `).join('')}
                      </tbody>
                   </table>
                </div>
             `}
          </div>

          <!-- ETAPA 4: VALORES E STATUS -->
          <div id="os-step-4" class="os-form-step" style="display: none;">
            <div style="display: grid; gap: 1.5rem;">
              
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
                    <input type="number" class="form-input" id="os-valor-pecas" step="0.01" value="${osData ? osData.valor_pecas : 0}" readonly style="background: var(--bg-tertiary); cursor: not-allowed;">
                    <small style="font-size: 0.7rem; color: var(--text-muted);">Gerado pela lista de peças (Etapa 3)</small>
                  </div>
                </div>
                <div style="margin-top: 1rem; padding: 1.5rem; background: var(--primary); border-radius: var(--radius-lg); text-align: center;">
                  <div style="font-size: 0.8rem; opacity: 0.9; margin-bottom: 0.4rem; letter-spacing: 1px;">VALOR TOTAL DA OS</div>
                  <div style="font-size: 2.2rem; font-weight: 800;" id="os-valor-total-display">R$ 0,00</div>
                </div>
              </div>

                </div>

                <div class="form-group" style="margin-top: 1rem;">
                  <label class="form-label">Status da OS</label>
                  <select class="form-input" id="os-status">
                    <option value="ABERTA" ${osData?.status === 'ABERTA' ? 'selected' : ''}>🔵 Aberta</option>
                    <option value="EM_ANDAMENTO" ${osData?.status === 'EM_ANDAMENTO' ? 'selected' : ''}>🟡 Em Andamento</option>
                    <option value="FECHADA" ${osData?.status === 'FECHADA' ? 'selected' : ''}>🟢 Fechada</option>
                  </select>
                </div>

                ${isEdicao && osData.status === 'FECHADA' && osData.data_fechamento ? `
                  <div style="padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: var(--radius); border-left: 3px solid var(--success); margin-bottom: 1rem;">
                    <strong style="color: var(--success); font-size: 0.85rem;">✓ Concluída em:</strong> 
                    <span style="color: var(--text-primary); font-weight: 600; font-size: 0.85rem;">${formatDate(osData.data_fechamento)}</span>
                  </div>
                ` : ''}

                <div class="form-group">
                  <label class="form-label">Observações Internas</label>
                  <textarea class="form-input" id="os-observacoes" rows="2" placeholder="Anotações para controle interno...">${osData && osData.observacoes ? osData.observacoes : ''}</textarea>
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
    for (let i = 1; i <= 4; i++) {
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
      line.style.width = currentStepOS === 1 ? '0%' : (currentStepOS === 2 ? '33%' : (currentStepOS === 3 ? '66%' : '100%'));
    }

    // Gerenciar botões do footer
    document.getElementById('btn-prev-os').style.display = currentStepOS === 1 ? 'none' : 'block';
    if (currentStepOS === 4) {
      document.getElementById('btn-next-os').style.display = 'none';
      document.getElementById('btn-save-os').style.display = 'block';
    } else {
      document.getElementById('btn-next-os').style.display = 'block';
      document.getElementById('btn-save-os').style.display = 'none';
    }

    // Scroll para o topo do modal ao mudar de etapa
    document.querySelector('#form-os').scrollTop = 0;
  };

  // Adicionar listeners de input para recalcular valores em tempo real
  const camposCalculo = ['os-km-ida', 'os-km-volta', 'os-valor-km', 'os-valor-mao-obra', 'os-valor-pecas'];
  camposCalculo.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calcularValoresOS);
  });

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

  // --- FUNÇÕES DE PEÇAS DENTRO DO MODAL ---
  window.adicionarPecaOSFunc = async () => {
    const pecaInput = document.getElementById('os-peca-input');
    const pecaNome = pecaInput.value;
    const pecaCodigo = document.getElementById('os-peca-codigo-input').value;
    const qtd = parseFloat(document.getElementById('os-peca-qtd').value) || 0;
    const preco = parseFloat(document.getElementById('os-peca-preco').value) || 0;

    if (!pecaNome || qtd <= 0 || preco <= 0) return alert('Preencha os dados da peça corretamente.');

    // Tentar encontrar se o que foi digitado corresponde a uma peça existente no datalist
    const datalist = document.getElementById('os-pecas-datalist');
    const option = Array.from(datalist.options).find(opt => opt.value === pecaNome);
    const pecaId = option ? option.getAttribute('data-id') : null;

    const result = await window.api.adicionarPecaOS(osId, {
      peca_id: pecaId,
      peca_nome: pecaNome,
      peca_codigo: pecaCodigo,
      quantidade: qtd,
      preco_unitario: preco
    });

    if (result.success) {
      // Recarregar dados do AppState e atualizar lista
      await loadPecas();
      const pecasRes = await window.api.listarPecasOS(osId);
      const osNewRes = await window.api.obterOS(osId);

      const pecas = pecasRes.pecas || [];
      const tbody = document.getElementById('os-pecas-list');
      tbody.innerHTML = pecas.map(p => `
        <tr>
          <td><strong>${p.peca_codigo}</strong><br><small>${p.peca_nome}</small></td>
          <td>R$ ${formatMoney(p.preco_unitario)}</td>
          <td>${p.quantidade}</td>
          <td>R$ ${formatMoney(p.preco_total)}</td>
          <td style="text-align: right;">
             <button type="button" class="btn btn-danger btn-sm" onclick="window.removerPecaOSFunc(${p.id})">&times;</button>
          </td>
        </tr>
      `).join('');

      // Atualizar input de valor_pecas no Passo 4
      if (osNewRes.success) {
        document.getElementById('os-valor-pecas').value = osNewRes.os.valor_pecas;
        calcularValoresOS();
      }

      // Limpar campos
      pecaInput.value = '';
      document.getElementById('os-peca-codigo-input').value = '';
      document.getElementById('os-peca-preco').value = '';
      document.getElementById('os-peca-qtd').value = '1';

      // Atualizar datalist para inclusões futuras (peça nova agora existe)
      const pecasGlobais = AppState.data.pecas || [];
      datalist.innerHTML = pecasGlobais.map(p => `
        <option value="${p.nome}" data-id="${p.id}" data-codigo="${p.codigo}" data-preco="${p.preco_venda}">${p.codigo ? `[${p.codigo}] ` : ''}${p.nome} (Sald: ${p.quantidade_estoque})</option>
      `).join('');
    } else {
      alert('Erro ao adicionar peça: ' + result.message);
    }
  };

  window.removerPecaOSFunc = async (itemId) => {
    if (!confirm('Deseja remover esta peça da OS?')) return;

    const result = await window.api.removerPecaOS(osId, itemId);
    if (result.success) {
      const pecasRes = await window.api.listarPecasOS(osId);
      const osNewRes = await window.api.obterOS(osId);

      const pecas = pecasRes.pecas || [];
      const tbody = document.getElementById('os-pecas-list');
      if (pecas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">Nenhuma peça adicionada</td></tr>';
      } else {
        tbody.innerHTML = pecas.map(p => `
            <tr>
              <td><strong>${p.peca_codigo}</strong><br><small>${p.peca_nome}</small></td>
              <td>R$ ${formatMoney(p.preco_unitario)}</td>
              <td>${p.quantidade}</td>
              <td>R$ ${formatMoney(p.preco_total)}</td>
              <td style="text-align: right;">
                 <button type="button" class="btn btn-danger btn-sm" onclick="window.removerPecaOSFunc(${p.id})">&times;</button>
              </td>
            </tr>
          `).join('');
      }

      if (osNewRes.success) {
        document.getElementById('os-valor-pecas').value = osNewRes.os.valor_pecas;
        calcularValoresOS();
      }
    }
  };

  // Listener para carregar preço automático ao digitar/selecionar
  const pecaInput = document.getElementById('os-peca-input');
  if (pecaInput) {
    pecaInput.addEventListener('input', () => {
      const datalist = document.getElementById('os-pecas-datalist');
      const option = Array.from(datalist.options).find(opt => opt.value === pecaInput.value);
      if (option) {
        const preco = option.getAttribute('data-preco');
        const codigo = option.getAttribute('data-codigo');
        if (preco) document.getElementById('os-peca-preco').value = preco;
        if (codigo) document.getElementById('os-peca-codigo-input').value = codigo;
      }
    });
  }
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

  // Distância é a diferença entre os odômetros. Se chegada < saída, assumimos 0
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
  // Ler valores dos campos
  const odoSaida = parseFloat(document.getElementById('os-km-ida').value) || 0;
  const odoChegada = parseFloat(document.getElementById('os-km-volta').value) || 0;
  const valorPorKm = parseFloat(document.getElementById('os-valor-km').value) || 0;
  const valorMaoObra = parseFloat(document.getElementById('os-valor-mao-obra').value) || 0;
  const valorPecas = parseFloat(document.getElementById('os-valor-pecas').value) || 0;

  // Calcular distância e total no frontend (fonte de verdade)
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
    valor_total: valorTotal,       // ← envia calculado corretamente
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
    const odoSaida = parseFloat(os.km_ida) || 0;
    const odoChegada = parseFloat(os.km_volta) || 0;
    normalizedOS.km_total = odoChegada > odoSaida ? (odoChegada - odoSaida) : 0;
    normalizedOS.valor_por_km = parseFloat(os.valor_por_km) || 0;
    normalizedOS.valor_deslocamento = (normalizedOS.km_total * normalizedOS.valor_por_km);
    normalizedOS.valor_mao_obra = parseFloat(os.valor_mao_obra) || 0;
    normalizedOS.valor_pecas = parseFloat(os.valor_pecas) || 0;
    normalizedOS.valor_total = parseFloat(os.valor_total) || (normalizedOS.valor_mao_obra + normalizedOS.valor_pecas + normalizedOS.valor_deslocamento);

    // Criar conteúdo HTML para impressão
    const printContent = `
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
            <div class="info-row"><div class="info-label">Odôm. Saída/Chegada:</div><div>${parseFloat(os.km_ida) || 0} / ${parseFloat(os.km_volta) || 0}</div></div>
            <div class="info-row"><div class="info-label">Distância Percorrida:</div><div>${normalizedOS.km_total.toFixed(1)} KM</div></div>
            <div class="info-row"><div class="info-label">Deslocamento:</div><div>R$ ${formatMoney(normalizedOS.valor_deslocamento)}</div></div>
            <div class="info-row"><div class="info-label">Mão de Obra:</div><div>R$ ${formatMoney(normalizedOS.valor_mao_obra)}</div></div>
            <div class="info-row"><div class="info-label">Peças:</div><div>R$ ${formatMoney(normalizedOS.valor_pecas)}</div></div>
          </div>
        </div>

        <div class="total-box">TOTAL: R$ ${formatMoney(normalizedOS.valor_total)}</div>

        <div class="footer">
          <p>SAMAPE ÍNDIO - Sistema de Gerenciamento de Manutenção</p>
          <p>Impressão realizada em ${new Date().toLocaleString('pt-BR')}</p>
        </div>
    `;

    // Criar overlay para visualização
    const overlay = document.createElement('div');
    overlay.id = 'print-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: white; z-index: 20000; overflow-y: auto; color: #333;
        font-family: sans-serif;
    `;

    overlay.innerHTML = `
        <style>
          .print-container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #2563eb; margin-bottom: 20px; padding-bottom: 10px; }
          .os-number { font-size: 24px; font-weight: bold; color: #2563eb; }
          .section { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
          .section-header { background: #f3f4f6; padding: 10px; font-weight: bold; border-bottom: 1px solid #ddd; }
          .section-body { padding: 15px; }
          .info-row { display: flex; margin-bottom: 5px; }
          .info-label { font-weight: bold; width: 150px; }
          .total-box { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; margin-top: 20px; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          
          .print-controls {
            position: fixed; bottom: 20px; right: 20px; display: flex; gap: 10px; z-index: 20001;
            background: white; padding: 10px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          }
          .btn-print { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; }
          .btn-close { background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; }
          
          @media print { 
            .print-controls { display: none; }
            .print-container { width: 100%; max-width: none; padding: 0; }
          }
          @media (max-width: 600px) {
            .info-row { flex-direction: column; }
            .info-label { width: 100%; margin-bottom: 2px; color: #666; font-size: 0.9em; }
          }
        </style>
        <div class="print-container">
            ${printContent}
        </div>
        <div class="print-controls">
            <button class="btn-close" onclick="document.getElementById('print-overlay').remove()">Fechar</button>
            <button class="btn-print" onclick="window.print()">🖨️ Imprimir / PDF</button>
        </div>
    `;

    document.body.appendChild(overlay);

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

window.gerarPDFOS = gerarPDFOS;
