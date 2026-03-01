// ==================== MODAL DE LISTAGEM DE PEÇAS ====================

async function mostrarModalListagemPecas(lpId = null) {
  const isEdicao = lpId !== null;
  let lpData = null;
  let itensLP = [];

  if (isEdicao) {
    const res = await window.api.obterListagemPecas(lpId);
    if (res.success) {
      lpData = res.listagem;
      itensLP = res.itens || [];
    } else {
      return alert('Erro ao carregar listagem');
    }
  }

  const clientes = AppState.data.clientes || [];

  const modalHTML = `
    <div class="modal-overlay" id="modal-lp" style="z-index: 9999; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center;">
      <div class="modal-container" style="max-width: 850px; width: 95%; max-height: 95vh; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl); overflow: hidden; display: flex; flex-direction: column;">
        
        <div class="modal-header" style="background: var(--bg-secondary); padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border);">
          <h2 class="modal-title" style="margin: 0; font-size: 1.3rem; display: flex; align-items: center; gap: 0.5rem; color: var(--text-primary);">
            <span>📝</span>
            ${isEdicao ? `Listagem ${lpData.numero_lista}` : 'Nova Listagem de Peças'}
          </h2>
          <button class="modal-close" onclick="fecharModalLP()" style="font-size: 1.5rem; background: none; border: none; color: var(--text-muted); cursor: pointer;">&times;</button>
        </div>

        <div class="modal-body" style="flex: 1; overflow-y: auto; padding: 2rem; background: var(--bg-primary);">
          
          <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 2rem; margin-bottom: 2rem;">
            <div class="form-group">
              <label class="form-label">Cliente (Opcional)</label>
              <select class="form-input" id="lp-cliente">
                <option value="">Selecione um cliente</option>
                ${clientes.map(c => `<option value="${c.id}" ${lpData && lpData.cliente_id === c.id ? 'selected' : ''}>${c.nome}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
               <label class="form-label">Máquina (Modelo/Ref)</label>
               <input type="text" class="form-input" id="lp-maquina" value="${lpData ? (lpData.maquina_modelo || '') : ''}" placeholder="Ex: Trator JD 5075">
            </div>
          </div>

          ${!isEdicao ? `
            <div style="text-align: center; padding: 2rem; background: var(--bg-secondary); border-radius: var(--radius); border: 1px dashed var(--border);">
               <p style="color: var(--text-muted);">Primeiro, crie o registro da listagem para poder adicionar os itens.</p>
               <button class="btn btn-primary" onclick="salvarCabecalhoLP()">Criar Listagem</button>
            </div>
          ` : `
            <div class="card" style="background: var(--bg-secondary); border: 1px solid var(--border); margin-bottom: 1.5rem;">
               <h4 style="margin: 0 0 1rem 0; font-size: 0.9rem; color: var(--primary);">Adicionar Peça / Item</h4>
               <div style="display: grid; grid-template-columns: 2fr 0.8fr 0.8fr 1fr auto; gap: 0.75rem; align-items: flex-end;">
                  <div class="form-group" style="margin:0;">
                     <label class="form-label" style="font-size: 0.75rem;">Peça (Selecione ou Digite)</label>
                     <input list="lp-pecas-datalist" class="form-input" id="lp-peca-input" placeholder="Nome da peça ou descrição..." style="font-size: 0.85rem;">
                     <datalist id="lp-pecas-datalist">
                        ${(AppState.data.pecas || []).map(p => `
                           <option value="${p.nome}" data-id="${p.id}" data-codigo="${p.codigo}" data-preco="${p.preco_venda}">${p.codigo ? `[Cód: ${p.codigo}]` : ''} ${p.descricao ? `- ${p.descricao}` : ''}</option>
                        `).join('')}
                     </datalist>
                  </div>
                  <div class="form-group" style="margin:0;">
                     <label class="form-label" style="font-size: 0.75rem;">Código</label>
                     <input type="text" class="form-input" id="lp-peca-codigo" placeholder="Opcional" style="font-size: 0.85rem;">
                  </div>
                  <div class="form-group" style="margin:0;">
                     <label class="form-label" style="font-size: 0.75rem;">Qtd</label>
                     <input type="number" class="form-input" id="lp-peca-qtd" value="1" min="1" step="0.1" style="font-size: 0.85rem;">
                  </div>
                  <div class="form-group" style="margin:0;">
                     <label class="form-label" style="font-size: 0.75rem;">Vlr Unit. (R$)</label>
                     <input type="number" class="form-input" id="lp-peca-vlr" step="0.01" style="font-size: 0.85rem;">
                  </div>
                  <button type="button" class="btn btn-primary" onclick="adicionarItemLP(${lpId})" style="height: 38px; padding: 0 1rem;">+</button>
               </div>
            </div>

            <div class="table-container" style="max-height: 350px; overflow-y: auto; border: 1px solid var(--border); border-top: none;">
               <table>
                  <thead style="position: sticky; top:0; background: var(--bg-secondary); z-index: 10;">
                    <tr>
                      <th>Cód / Peça</th>
                      <th>Vlr Unit.</th>
                      <th>Qtd</th>
                      <th>Total</th>
                      <th style="width: 50px;"></th>
                    </tr>
                  </thead>
                  <tbody id="lp-itens-list">
                    ${itensLP.length === 0 ? '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">Nenhum item na lista</td></tr>' :
      itensLP.map(item => `
                        <tr>
                          <td><strong>${item.peca_codigo || ''}</strong><br><small>${item.peca_nome}</small></td>
                          <td>R$ ${formatMoney(item.preco_unitario)}</td>
                          <td>${item.quantidade}</td>
                          <td><strong>R$ ${formatMoney(item.preco_total)}</strong></td>
                          <td style="text-align: right;">
                             <button class="btn btn-danger btn-sm" onclick="removerItemLP(${lpId}, ${item.id})">&times;</button>
                          </td>
                        </tr>
                      `).join('')}
                  </tbody>
               </table>
            </div>

            <div style="margin-top: 1.5rem; display: flex; justify-content: flex-end;">
               <div style="background: var(--bg-tertiary); padding: 1.5rem 2.5rem; border-radius: var(--radius-lg); text-align: right; border: 1px solid var(--border);">
                  <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">Valor Total da Listagem</div>
                  <div style="font-size: 2rem; font-weight: 800; color: var(--success);" id="lp-total-display">R$ ${formatMoney(lpData.valor_total)}</div>
               </div>
            </div>
          `}
        </div>

        <div class="modal-footer" style="padding: 1.5rem; background: var(--bg-secondary); border-top: 1px solid var(--border); display: flex; justify-content: space-between;">
           <button class="btn btn-secondary" onclick="fecharModalLP()">Voltar / Fechar</button>
           ${isEdicao ? `<button class="btn btn-success" onclick="salvarCabecalhoLP(${lpId})">Salvar Alterações</button>` : ''}
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Listener para preencher preço e código automaticamente
  if (isEdicao) {
    const pecaInput = document.getElementById('lp-peca-input');
    pecaInput.addEventListener('input', () => {
      const datalist = document.getElementById('lp-pecas-datalist');
      const option = Array.from(datalist.options).find(opt => opt.value === pecaInput.value);
      if (option) {
        document.getElementById('lp-peca-vlr').value = option.getAttribute('data-preco') || '';
        document.getElementById('lp-peca-codigo').value = option.getAttribute('data-codigo') || '';
      }
    });
  }
}

async function salvarCabecalhoLP(lpId = null) {
  const dados = {
    cliente_id: document.getElementById('lp-cliente').value || null,
    maquina_modelo: document.getElementById('lp-maquina').value || ''
  };

  let res;
  if (lpId) {
    // Se já existe, atualizamos o cabeçalho (precisamos garantir que a API tenha essa rota ou usar a de criação se ela for inteligente)
    // Como o backend atual não tem PUT /api/listagens-pecas/:id para o cabeçalho, vamos criar ou ajustar.
    res = await window.api.atualizarListagemPecas(lpId, dados);
  } else {
    res = await window.api.criarListagemPecas(dados);
  }

  if (res.success) {
    fecharModalLP();
    await loadListagensPecas();
    // Abrir o modal novamente com o ID da listagem (nova ou existente) para permitir adicionar itens
    mostrarModalListagemPecas(lpId || res.listagem.id);
    render();
  } else {
    alert('Erro ao salvar: ' + (res.message || 'Erro desconhecido'));
  }
}

async function adicionarItemLP(lpId) {
  const pecaNome = document.getElementById('lp-peca-input').value;
  const codigo = document.getElementById('lp-peca-codigo').value;
  const qtd = parseFloat(document.getElementById('lp-peca-qtd').value);
  const vlr = parseFloat(document.getElementById('lp-peca-vlr').value);

  if (!pecaNome || isNaN(qtd) || isNaN(vlr)) return alert('Preencha os campos da peça corretamente');

  // Tentar pegar ID se existir no datalist
  const datalist = document.getElementById('lp-pecas-datalist');
  const option = Array.from(datalist.options).find(opt => opt.value === pecaNome);
  const pecaId = option ? option.getAttribute('data-id') : null;

  const res = await window.api.adicionarItemListagem(lpId, {
    peca_id: pecaId,
    peca_nome: pecaNome,
    peca_codigo: codigo,
    quantidade: qtd,
    preco_unitario: vlr
  });

  if (res.success) {
    // Recarregar modal
    fecharModalLP();
    mostrarModalListagemPecas(lpId);
    await loadPecas(); // Atualizar estoque global se necessário
    await loadListagensPecas();
    render();
  } else {
    alert('Erro: ' + res.message);
  }
}

async function removerItemLP(lpId, itemId) {
  if (!confirm('Remover item?')) return;
  const res = await window.api.removerItemListagem(lpId, itemId);
  if (res.success) {
    fecharModalLP();
    mostrarModalListagemPecas(lpId);
    await loadListagensPecas();
    render();
  }
}

function fecharModalLP() {
  const modal = document.getElementById('modal-lp');
  if (modal) modal.remove();
}

async function gerarPDFListagem(id) {
  const res = await window.api.obterListagemPecas(id);
  if (!res.success) return;
  const lp = res.listagem;
  const itens = res.itens;

  const html = `
        <div style="font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="resources/logonova2.png" alt="SAMAPE" style="max-height: 80px; width: auto; margin-bottom: 10px;" onerror="this.style.display='none'">
              <h1 style="color: #2563eb; margin: 0;">LISTAGEM DE PEÇAS</h1>
              <h2 style="margin: 5px 0;">${lp.numero_lista}</h2>
            </div>
            <hr style="border: none; border-top: 2px solid #2563eb; margin-bottom: 20px;">
            <p><strong>Cliente:</strong> ${lp.cliente_nome || '-'}</p>
            <p><strong>Máquina:</strong> ${lp.maquina_modelo || '-'}</p>
            <p><strong>Data:</strong> ${new Date(lp.created_at).toLocaleDateString()}</p>
            <hr style="margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; border: 1px solid #e5e7eb;">
                <thead>
                    <tr style="background: #2563eb; color: white;">
                        <th style="padding: 10px; text-align: left; border-right: 1px solid #3b82f6;">Cód</th>
                        <th style="padding: 10px; text-align: left; border-right: 1px solid #3b82f6;">Peça / Descrição</th>
                        <th style="padding: 10px; text-align: right; border-right: 1px solid #3b82f6;">Vlr Unit</th>
                        <th style="padding: 10px; text-align: center; border-right: 1px solid #3b82f6;">Qtd</th>
                        <th style="padding: 10px; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itens.map(i => `
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 10px; border-right: 1px solid #e5e7eb; font-size: 0.9em;">${i.peca_codigo || ''}</td>
                            <td style="padding: 10px; border-right: 1px solid #e5e7eb; font-weight: 500;">${i.peca_nome}</td>
                            <td style="padding: 10px; border-right: 1px solid #e5e7eb; text-align: right; font-size: 0.9em;">R$ ${formatMoney(i.preco_unitario)}</td>
                            <td style="padding: 10px; border-right: 1px solid #e5e7eb; text-align: center; font-weight: bold;">${i.quantidade}</td>
                            <td style="padding: 10px; text-align: right; font-weight: bold; color: #1e293b;">R$ ${formatMoney(i.preco_total)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div style="margin-top: 20px; text-align: right; font-size: 1.5rem; color: #166534; background: #f0fdf4; padding: 15px; border-radius: 8px;">
                <strong>TOTAL DA LISTAGEM: R$ ${formatMoney(lp.valor_total)}</strong>
            </div>
            
            <div style="margin-top: 60px; text-align: center; color: #6b7280; font-size: 0.8rem;">
               SAMAPE Sistema de Gerenciamento de Manutenção
            </div>
        </div>
    `;

  const overlay = document.createElement('div');
  overlay.id = 'print-overlay';
  overlay.style.cssText = 'position:absolute; top:0; left:0; width:100%; min-height:100vh; background:#f1f5f9; z-index:20000; overflow-y:auto; padding: 20px 0; display: flex; flex-direction: column; align-items: center;';
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
          ${html}
        </div>
        <div class="no-print" style="position:fixed; bottom:20px; right:20px; display: flex; gap: 10px;">
            <button onclick="document.body.removeChild(this.parentNode.parentNode);" style="padding:10px 20px; background:#64748b; color:white; border:none; border-radius:8px; cursor: pointer; font-weight: bold;">Cancelar e Fechar</button>
            <button onclick="window.print()" style="padding:10px 20px; background:#2563eb; color:white; border:none; border-radius:8px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 12px rgba(37,99,235,0.3);">🖨️ Imprimir Listagem</button>
        </div>
    `;
  document.body.appendChild(overlay);
}

window.mostrarModalListagemPecas = mostrarModalListagemPecas;
window.gerarPDFListagem = gerarPDFListagem;
