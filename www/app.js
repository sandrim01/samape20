// Estado global da aplicação
const AppState = {
  currentUser: null,
  currentPage: 'dashboard',
  data: {
    clientes: [],
    maquinas: [],
    ordens: [],
    pecas: [],
    vendas: [],
    usuarios: [],
    contasReceber: [],
    contasPagar: [],
    stats: {}
  }
};

// Definição de permissões por cargo
const PERMISSIONS = {
  ADMIN: ['*'], // Acesso total
  DIRETOR: ['dashboard', 'relatorios', 'financeiro', 'operacional', 'vendas', 'clientes'],
  FINANCEIRO: ['dashboard', 'financeiro', 'clientes', 'relatorios-financeiros'],
  VENDAS: ['dashboard', 'vendas', 'pecas', 'clientes', 'estoque'],
  MECANICO: ['dashboard', 'operacional', 'ordens-servico', 'maquinas']
};

// Verificar se usuário tem permissão
function hasPermission(permission) {
  if (!AppState.currentUser) return false;
  const userPermissions = PERMISSIONS[AppState.currentUser.cargo] || [];
  return userPermissions.includes('*') || userPermissions.includes(permission);
}

// Renderizar aplicação
function render() {
  const app = document.getElementById('app');

  if (!AppState.currentUser) {
    app.innerHTML = renderLogin();
  } else {
    app.innerHTML = renderMainApp();
    attachEventListeners();
  }
}

// ==================== TELA DE LOGIN ====================
function renderLogin() {
  return `
    <div class="login-container">
      <div class="login-box">
        <div class="login-header">
          <img src="resources/logonova2.png" alt="SAMAPE ÍNDIO" style="width: 200px; height: auto; margin-bottom: 1rem;" />
        </div>
        
        <div id="login-alert"></div>
        
        <form id="login-form">
          <div class="form-group">
            <label class="form-label">E-mail</label>
            <input 
              type="email" 
              class="form-input" 
              id="login-email" 
              placeholder="seu@email.com"
              required
            />
          </div>
          
          <div class="form-group">
            <label class="form-label">Senha</label>
            <input 
              type="password" 
              class="form-input" 
              id="login-password" 
              placeholder="••••••••"
              required
            />
          </div>
          
          <button type="submit" class="btn btn-primary">
            <span id="login-btn-text">Entrar</span>
          </button>
        </form>
        
        <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border); text-align: center; color: var(--text-muted); font-size: 0.85rem;">
          <p><strong>Usuário padrão:</strong> admin@samapeop.com</p>
          <p><strong>Senha:</strong> admin123</p>
        </div>
      </div>
    </div>
  `;
}

// ==================== APLICAÇÃO PRINCIPAL ====================
function renderMainApp() {
  return `
    <div class="app-container">
      ${renderSidebar()}
      <div class="main-content">
        ${renderTopbar()}
        <div class="content-area" id="content-area">
          ${renderPage()}
        </div>
      </div>
    </div>
  `;
}

function renderSidebar() {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', permission: 'dashboard' },
    { section: 'Operacional' },
    { id: 'ordens-servico', label: 'Ordens de Serviço', icon: '🔧', permission: 'operacional' },
    { id: 'maquinas', label: 'Máquinas', icon: '🚜', permission: 'operacional' },
    { section: 'Vendas' },
    { id: 'vendas', label: 'Vendas de Peças', icon: '🛒', permission: 'vendas' },
    { id: 'pecas', label: 'Estoque de Peças', icon: '📦', permission: 'pecas' },
    { section: 'Financeiro' },
    { id: 'contas-receber', label: 'Contas a Receber', icon: '💰', permission: 'financeiro' },
    { id: 'contas-pagar', label: 'Contas a Pagar', icon: '💸', permission: 'financeiro' },
    { section: 'Cadastros' },
    { id: 'clientes', label: 'Clientes', icon: '👥', permission: 'clientes' },
    { section: 'Administração' },
    { id: 'usuarios', label: 'Usuários', icon: '👤', permission: '*' }
  ];

  let navHTML = '';
  let currentSection = '';

  navItems.forEach(item => {
    if (item.section) {
      if (currentSection) navHTML += '</div>';
      navHTML += `
        <div class="nav-section">
          <div class="nav-section-title">${item.section}</div>
      `;
      currentSection = item.section;
    } else if (hasPermission(item.permission)) {
      const active = AppState.currentPage === item.id ? 'active' : '';
      navHTML += `
        <div class="nav-item ${active}" data-page="${item.id}">
          <span class="nav-icon">${item.icon}</span>
          <span>${item.label}</span>
        </div>
      `;
    }
  });

  if (currentSection) navHTML += '</div>';

  const initials = AppState.currentUser.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const roleLabels = {
    ADMIN: 'Administrador',
    DIRETOR: 'Diretor',
    FINANCEIRO: 'Financeiro',
    VENDAS: 'Vendas',
    MECANICO: 'Mecânico'
  };

  return `
    <div class="sidebar">
      <div class="sidebar-header" style="padding: 1.5rem 1rem; text-align: center;">
        <img src="resources/logonova2.png" alt="SAMAPE ÍNDIO" style="width: 100%; max-width: 180px; height: auto;" />
      </div>
      
      <div class="sidebar-nav">
        ${navHTML}
      </div>
      
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">${initials}</div>
          <div class="user-details">
            <div class="user-name">${AppState.currentUser.nome}</div>
            <div class="user-role">${roleLabels[AppState.currentUser.cargo] || AppState.currentUser.cargo}</div>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" id="logout-btn" style="width: 100%;">
          Sair
        </button>
      </div>
    </div>
  `;
}

function renderTopbar() {
  const pageTitles = {
    'dashboard': 'Dashboard',
    'ordens-servico': 'Ordens de Serviço',
    'maquinas': 'Máquinas',
    'vendas': 'Vendas de Peças',
    'pecas': 'Estoque de Peças',
    'contas-receber': 'Contas a Receber',
    'contas-pagar': 'Contas a Pagar',
    'clientes': 'Clientes',
    'usuarios': 'Usuários'
  };

  return `
    <div class="topbar">
      <h1 class="page-title">${pageTitles[AppState.currentPage] || 'SAMAPEOP'}</h1>
      <div style="color: var(--text-muted); font-size: 0.9rem;">
        ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  `;
}

function renderPage() {
  switch (AppState.currentPage) {
    case 'dashboard': return renderDashboard();
    case 'ordens-servico': return renderOrdensServico();
    case 'maquinas': return renderMaquinas();
    case 'vendas': return renderVendas();
    case 'pecas': return renderPecas();
    case 'contas-receber': return renderContasReceber();
    case 'contas-pagar': return renderContasPagar();
    case 'clientes': return renderClientes();
    case 'usuarios': return renderUsuarios();
    default: return '<div class="card"><p>Página não encontrada</p></div>';
  }
}

// ==================== DASHBOARD ====================
function renderDashboard() {
  const stats = AppState.data.stats;

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">OS Abertas</span>
          <div class="stat-icon warning">🔧</div>
        </div>
        <div class="stat-value">${stats.os_abertas || 0}</div>
        <div class="stat-description">Aguardando atendimento</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">OS em Andamento</span>
          <div class="stat-icon primary">⚙️</div>
        </div>
        <div class="stat-value">${stats.os_em_andamento || 0}</div>
        <div class="stat-description">Sendo executadas</div>
      </div>
      
      ${hasPermission('financeiro') ? `
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">A Receber</span>
            <div class="stat-icon success">💰</div>
          </div>
          <div class="stat-value">R$ ${formatMoney(stats.contas_receber_pendentes?.total || 0)}</div>
          <div class="stat-description">${stats.contas_receber_pendentes?.count || 0} contas pendentes</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">A Pagar</span>
            <div class="stat-icon danger">💸</div>
          </div>
          <div class="stat-value">R$ ${formatMoney(stats.contas_pagar_pendentes?.total || 0)}</div>
          <div class="stat-description">${stats.contas_pagar_pendentes?.count || 0} contas pendentes</div>
        </div>
      ` : ''}
      
      ${hasPermission('pecas') ? `
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Estoque Baixo</span>
            <div class="stat-icon warning">📦</div>
          </div>
          <div class="stat-value">${stats.pecas_estoque_baixo || 0}</div>
          <div class="stat-description">Peças abaixo do mínimo</div>
        </div>
      ` : ''}
      
      ${hasPermission('vendas') ? `
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Vendas do Mês</span>
            <div class="stat-icon success">🛒</div>
          </div>
          <div class="stat-value">R$ ${formatMoney(stats.vendas_mes?.total || 0)}</div>
          <div class="stat-description">${stats.vendas_mes?.count || 0} vendas realizadas</div>
        </div>
      ` : ''}
    </div>
    
    ${hasPermission('operacional') ? `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Ordens de Serviço Recentes</h2>
        </div>
        ${renderOrdensTable(AppState.data.ordens.slice(0, 5))}
      </div>
    ` : ''}
  `;
}

// ==================== ORDENS DE SERVIÇO ====================
function renderOrdensServico() {
  return `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Ordens de Serviço</h2>
        <button class="btn btn-primary btn-sm" id="nova-os-btn">
          + Nova OS
        </button>
      </div>
      
      <div style="margin-bottom: 1.5rem; display: flex; gap: 1rem;">
        <select class="form-input" id="filtro-status-os" style="max-width: 200px;">
          <option value="">Todos os Status</option>
          <option value="ABERTA">Abertas</option>
          <option value="EM_ANDAMENTO">Em Andamento</option>
          <option value="FECHADA">Fechadas</option>
        </select>
      </div>
      
      ${renderOrdensTable(AppState.data.ordens)}
    </div>
  `;
}

function renderOrdensTable(ordens) {
  if (!ordens || ordens.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">🔧</div>
        <div class="empty-state-title">Nenhuma ordem de serviço encontrada</div>
        <div class="empty-state-description">Crie uma nova ordem de serviço para começar</div>
      </div>
    `;
  }

  const statusBadges = {
    'ABERTA': 'warning',
    'EM_ANDAMENTO': 'info',
    'FECHADA': 'success'
  };

  return `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Número</th>
            <th>Cliente</th>
            <th>Máquina</th>
            <th>Mecânico</th>
            <th>Data Abertura</th>
            <th>Status</th>
            <th>Valor Total</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${ordens.map(os => `
            <tr>
              <td><strong>${os.numero_os}</strong></td>
              <td>${os.cliente_nome || '-'}</td>
              <td>${os.maquina_modelo || '-'}</td>
              <td>${os.mecanico_nome || '-'}</td>
              <td>${formatDate(os.data_abertura)}</td>
              <td><span class="badge badge-${statusBadges[os.status]}">${os.status.replace('_', ' ')}</span></td>
              <td>R$ ${formatMoney(os.valor_total)}</td>
              <td>
                <button class="btn btn-secondary btn-sm" onclick="editarOS(${os.id})">
                  Editar
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ==================== MÁQUINAS ====================
function renderMaquinas() {
  return `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Máquinas Cadastradas</h2>
        <button class="btn btn-primary btn-sm" id="nova-maquina-btn">
          + Nova Máquina
        </button>
      </div>
      ${renderMaquinasTable(AppState.data.maquinas)}
    </div>
  `;
}

function renderMaquinasTable(maquinas) {
  if (!maquinas || maquinas.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">🚜</div>
        <div class="empty-state-title">Nenhuma máquina cadastrada</div>
        <div class="empty-state-description">Cadastre uma nova máquina para começar</div>
      </div>
    `;
  }

  return `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Modelo</th>
            <th>Número de Série</th>
            <th>Ano</th>
            <th>Observações</th>
          </tr>
        </thead>
        <tbody>
          ${maquinas.map(maq => `
            <tr>
              <td>${maq.cliente_nome || '-'}</td>
              <td><strong>${maq.modelo}</strong></td>
              <td>${maq.numero_serie || '-'}</td>
              <td>${maq.ano || '-'}</td>
              <td>${maq.observacoes || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ==================== PEÇAS ====================
function renderPecas() {
  return `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Estoque de Peças</h2>
        <button class="btn btn-primary btn-sm" id="nova-peca-btn">
          + Nova Peça
        </button>
      </div>
      ${renderPecasTable(AppState.data.pecas)}
    </div>
  `;
}

function renderPecasTable(pecas) {
  if (!pecas || pecas.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📦</div>
        <div class="empty-state-title">Nenhuma peça cadastrada</div>
        <div class="empty-state-description">Cadastre uma nova peça para começar</div>
      </div>
    `;
  }

  return `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Descrição</th>
            <th>Preço Custo</th>
            <th>Preço Venda</th>
            <th>Estoque Atual</th>
            <th>Estoque Mínimo</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${pecas.map(peca => {
    const estoqueBaixo = peca.estoque_atual <= peca.estoque_minimo;
    return `
              <tr>
                <td><strong>${peca.codigo}</strong></td>
                <td>${peca.descricao}</td>
                <td>R$ ${formatMoney(peca.preco_custo)}</td>
                <td>R$ ${formatMoney(peca.preco_venda)}</td>
                <td>${peca.estoque_atual}</td>
                <td>${peca.estoque_minimo}</td>
                <td>
                  ${estoqueBaixo
        ? '<span class="badge badge-danger">Baixo</span>'
        : '<span class="badge badge-success">OK</span>'}
                </td>
              </tr>
            `;
  }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ==================== VENDAS ====================
function renderVendas() {
  return `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Vendas de Peças</h2>
        <button class="btn btn-primary btn-sm" id="nova-venda-btn">
          + Nova Venda
        </button>
      </div>
      ${renderVendasTable(AppState.data.vendas)}
    </div>
  `;
}

function renderVendasTable(vendas) {
  if (!vendas || vendas.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">🛒</div>
        <div class="empty-state-title">Nenhuma venda registrada</div>
        <div class="empty-state-description">Registre uma nova venda para começar</div>
      </div>
    `;
  }

  return `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Número</th>
            <th>Cliente</th>
            <th>Vendedor</th>
            <th>Data</th>
            <th>Valor Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${vendas.map(venda => `
            <tr>
              <td><strong>${venda.numero_venda}</strong></td>
              <td>${venda.cliente_nome || '-'}</td>
              <td>${venda.vendedor_nome || '-'}</td>
              <td>${formatDate(venda.data_venda)}</td>
              <td>R$ ${formatMoney(venda.valor_total)}</td>
              <td><span class="badge badge-${venda.status === 'PAGO' ? 'success' : 'warning'}">${venda.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ==================== CONTAS A RECEBER ====================
function renderContasReceber() {
  return `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Contas a Receber</h2>
        <button class="btn btn-primary btn-sm" id="nova-conta-receber-btn">
          + Nova Conta
        </button>
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <select class="form-input" id="filtro-status-receber" style="max-width: 200px;">
          <option value="">Todos os Status</option>
          <option value="PENDENTE">Pendentes</option>
          <option value="PAGO">Pagas</option>
        </select>
      </div>
      
      ${renderContasReceberTable(AppState.data.contasReceber)}
    </div>
  `;
}

function renderContasReceberTable(contas) {
  if (!contas || contas.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">💰</div>
        <div class="empty-state-title">Nenhuma conta a receber</div>
      </div>
    `;
  }

  return `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Valor</th>
            <th>Vencimento</th>
            <th>Pagamento</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${contas.map(conta => `
            <tr>
              <td>${conta.cliente_nome || '-'}</td>
              <td>R$ ${formatMoney(conta.valor)}</td>
              <td>${formatDate(conta.data_vencimento)}</td>
              <td>${conta.data_pagamento ? formatDate(conta.data_pagamento) : '-'}</td>
              <td><span class="badge badge-${conta.status === 'PAGO' ? 'success' : 'warning'}">${conta.status}</span></td>
              <td>
                ${conta.status === 'PENDENTE' ? `
                  <button class="btn btn-success btn-sm" onclick="registrarPagamentoReceber(${conta.id})">
                    Registrar Pagamento
                  </button>
                ` : '-'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ==================== CONTAS A PAGAR ====================
function renderContasPagar() {
  return `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Contas a Pagar</h2>
        <button class="btn btn-primary btn-sm" id="nova-conta-pagar-btn">
          + Nova Conta
        </button>
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <select class="form-input" id="filtro-status-pagar" style="max-width: 200px;">
          <option value="">Todos os Status</option>
          <option value="PENDENTE">Pendentes</option>
          <option value="PAGO">Pagas</option>
        </select>
      </div>
      
      ${renderContasPagarTable(AppState.data.contasPagar)}
    </div>
  `;
}

function renderContasPagarTable(contas) {
  if (!contas || contas.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">💸</div>
        <div class="empty-state-title">Nenhuma conta a pagar</div>
      </div>
    `;
  }

  return `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Fornecedor</th>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Vencimento</th>
            <th>Pagamento</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${contas.map(conta => `
            <tr>
              <td>${conta.fornecedor}</td>
              <td>${conta.descricao || '-'}</td>
              <td>R$ ${formatMoney(conta.valor)}</td>
              <td>${formatDate(conta.data_vencimento)}</td>
              <td>${conta.data_pagamento ? formatDate(conta.data_pagamento) : '-'}</td>
              <td><span class="badge badge-${conta.status === 'PAGO' ? 'success' : 'warning'}">${conta.status}</span></td>
              <td>
                ${conta.status === 'PENDENTE' ? `
                  <button class="btn btn-success btn-sm" onclick="registrarPagamentoPagar(${conta.id})">
                    Registrar Pagamento
                  </button>
                ` : '-'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ==================== CLIENTES ====================
function renderClientes() {
  return `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Clientes</h2>
        <button class="btn btn-primary btn-sm" id="novo-cliente-btn">
          + Novo Cliente
        </button>
      </div>
      ${renderClientesTable(AppState.data.clientes)}
    </div>
  `;
}

function renderClientesTable(clientes) {
  if (!clientes || clientes.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">👥</div>
        <div class="empty-state-title">Nenhum cliente cadastrado</div>
        <div class="empty-state-description">Cadastre um novo cliente para começar</div>
      </div>
    `;
  }

  return `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>CNPJ</th>
            <th>Telefone</th>
            <th>E-mail</th>
            <th>Endereço</th>
          </tr>
        </thead>
        <tbody>
          ${clientes.map(cliente => `
            <tr>
              <td><strong>${cliente.nome}</strong></td>
              <td>${cliente.cnpj || '-'}</td>
              <td>${cliente.telefone || '-'}</td>
              <td>${cliente.email || '-'}</td>
              <td>${cliente.endereco || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ==================== USUÁRIOS ====================
function renderUsuarios() {
  return `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Usuários do Sistema</h2>
        <button class="btn btn-primary btn-sm" id="novo-usuario-btn">
          + Novo Usuário
        </button>
      </div>
      ${renderUsuariosTable(AppState.data.usuarios)}
    </div>
  `;
}

function renderUsuariosTable(usuarios) {
  if (!usuarios || usuarios.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">👤</div>
        <div class="empty-state-title">Nenhum usuário cadastrado</div>
      </div>
    `;
  }

  const roleLabels = {
    ADMIN: 'Administrador',
    DIRETOR: 'Diretor',
    FINANCEIRO: 'Financeiro',
    VENDAS: 'Vendas',
    MECANICO: 'Mecânico'
  };

  return `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Cargo</th>
            <th>Status</th>
            <th>Cadastrado em</th>
          </tr>
        </thead>
        <tbody>
          ${usuarios.map(usuario => `
            <tr>
              <td><strong>${usuario.nome}</strong></td>
              <td>${usuario.email}</td>
              <td>${roleLabels[usuario.cargo] || usuario.cargo}</td>
              <td>
                <span class="badge badge-${usuario.ativo ? 'success' : 'danger'}">
                  ${usuario.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td>${formatDate(usuario.criado_em)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ==================== FUNÇÕES AUXILIARES ====================
function formatMoney(value) {
  return parseFloat(value || 0).toFixed(2).replace('.', ',');
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

// ==================== EVENT LISTENERS ====================
function attachEventListeners() {
  // Navegação
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      AppState.currentPage = item.dataset.page;
      render();
    });
  });

  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      AppState.currentUser = null;
      render();
    });
  }

  // Botões de nova entidade
  attachButtonListener('novo-cliente-btn', showNovoClienteModal);
  attachButtonListener('nova-maquina-btn', showNovaMaquinaModal);
  attachButtonListener('nova-os-btn', showNovaOSModal);
  attachButtonListener('nova-peca-btn', showNovaPecaModal);
  attachButtonListener('nova-venda-btn', showNovaVendaModal);
  attachButtonListener('nova-conta-receber-btn', showNovaContaReceberModal);
  attachButtonListener('nova-conta-pagar-btn', showNovaContaPagarModal);
  attachButtonListener('novo-usuario-btn', showNovoUsuarioModal);

  // Filtros
  attachSelectListener('filtro-status-os', async (value) => {
    await loadOrdensServico(value ? { status: value } : {});
    render();
  });

  attachSelectListener('filtro-status-receber', async (value) => {
    await loadContasReceber(value ? { status: value } : {});
    render();
  });

  attachSelectListener('filtro-status-pagar', async (value) => {
    await loadContasPagar(value ? { status: value } : {});
    render();
  });
}

function attachButtonListener(id, handler) {
  const btn = document.getElementById(id);
  if (btn) btn.addEventListener('click', handler);
}

function attachSelectListener(id, handler) {
  const select = document.getElementById(id);
  if (select) select.addEventListener('change', (e) => handler(e.target.value));
}

// ==================== MODAIS (Simplificados - implementação completa seria muito extensa) ====================
function showNovoClienteModal() {
  showModal('Novo Cliente', `
    <div class="form-group">
      <label class="form-label">Nome *</label>
      <input type="text" class="form-input" id="modal-cliente-nome" required />
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">CNPJ</label>
        <input type="text" class="form-input" id="modal-cliente-cnpj" />
      </div>
      <div class="form-group">
        <label class="form-label">Telefone</label>
        <input type="text" class="form-input" id="modal-cliente-telefone" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">E-mail</label>
      <input type="email" class="form-input" id="modal-cliente-email" />
    </div>
    <div class="form-group">
      <label class="form-label">Endereço</label>
      <textarea class="form-input" id="modal-cliente-endereco"></textarea>
    </div>
  `, async () => {
    const dados = {
      nome: document.getElementById('modal-cliente-nome').value,
      cnpj: document.getElementById('modal-cliente-cnpj').value,
      telefone: document.getElementById('modal-cliente-telefone').value,
      email: document.getElementById('modal-cliente-email').value,
      endereco: document.getElementById('modal-cliente-endereco').value
    };

    const result = await window.api.criarCliente(dados);
    if (result.success) {
      await loadClientes();
      closeModal();
      render();
    } else {
      alert('Erro ao criar cliente: ' + result.message);
    }
  });
}

function showNovaMaquinaModal() {
  const clientesOptions = AppState.data.clientes.map(c =>
    `<option value="${c.id}">${c.nome}</option>`
  ).join('');

  showModal('Nova Máquina', `
    <div class="form-group">
      <label class="form-label">Cliente *</label>
      <select class="form-input" id="modal-maquina-cliente" required>
        <option value="">Selecione...</option>
        ${clientesOptions}
      </select>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Modelo *</label>
        <input type="text" class="form-input" id="modal-maquina-modelo" required />
      </div>
      <div class="form-group">
        <label class="form-label">Número de Série</label>
        <input type="text" class="form-input" id="modal-maquina-serie" />
      </div>
      <div class="form-group">
        <label class="form-label">Ano</label>
        <input type="number" class="form-input" id="modal-maquina-ano" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Observações</label>
      <textarea class="form-input" id="modal-maquina-obs"></textarea>
    </div>
  `, async () => {
    const dados = {
      cliente_id: document.getElementById('modal-maquina-cliente').value,
      modelo: document.getElementById('modal-maquina-modelo').value,
      numero_serie: document.getElementById('modal-maquina-serie').value,
      ano: document.getElementById('modal-maquina-ano').value,
      observacoes: document.getElementById('modal-maquina-obs').value
    };

    const result = await window.api.criarMaquina(dados);
    if (result.success) {
      await loadMaquinas();
      closeModal();
      render();
    } else {
      alert('Erro ao criar máquina: ' + result.message);
    }
  });
}

function showNovaOSModal() {
  mostrarModalOS();
}

function showNovaPecaModal() {
  showModal('Nova Peça', `
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Código *</label>
        <input type="text" class="form-input" id="modal-peca-codigo" required />
      </div>
      <div class="form-group form-group-full">
        <label class="form-label">Descrição *</label>
        <input type="text" class="form-input" id="modal-peca-descricao" required />
      </div>
      <div class="form-group">
        <label class="form-label">Preço Custo</label>
        <input type="number" step="0.01" class="form-input" id="modal-peca-custo" />
      </div>
      <div class="form-group">
        <label class="form-label">Preço Venda</label>
        <input type="number" step="0.01" class="form-input" id="modal-peca-venda" />
      </div>
      <div class="form-group">
        <label class="form-label">Estoque Atual</label>
        <input type="number" class="form-input" id="modal-peca-estoque" value="0" />
      </div>
      <div class="form-group">
        <label class="form-label">Estoque Mínimo</label>
        <input type="number" class="form-input" id="modal-peca-minimo" value="0" />
      </div>
    </div>
  `, async () => {
    const dados = {
      codigo: document.getElementById('modal-peca-codigo').value,
      descricao: document.getElementById('modal-peca-descricao').value,
      preco_custo: parseFloat(document.getElementById('modal-peca-custo').value) || 0,
      preco_venda: parseFloat(document.getElementById('modal-peca-venda').value) || 0,
      estoque_atual: parseInt(document.getElementById('modal-peca-estoque').value) || 0,
      estoque_minimo: parseInt(document.getElementById('modal-peca-minimo').value) || 0
    };

    const result = await window.api.criarPeca(dados);
    if (result.success) {
      await loadPecas();
      closeModal();
      render();
    } else {
      alert('Erro ao criar peça: ' + result.message);
    }
  });
}

function showNovaVendaModal() {
  alert('Funcionalidade de venda em desenvolvimento. Use o backend para criar vendas.');
}

function showNovaContaReceberModal() {
  alert('Funcionalidade em desenvolvimento. Use o backend para criar contas.');
}

function showNovaContaPagarModal() {
  const categorias = ['Fornecedores', 'Salários', 'Aluguel', 'Energia', 'Água', 'Internet', 'Impostos', 'Outros'];

  showModal('Nova Conta a Pagar', `
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Fornecedor *</label>
        <input type="text" class="form-input" id="modal-pagar-fornecedor" required />
      </div>
      <div class="form-group">
        <label class="form-label">Categoria</label>
        <select class="form-input" id="modal-pagar-categoria">
          ${categorias.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group form-group-full">
        <label class="form-label">Descrição</label>
        <input type="text" class="form-input" id="modal-pagar-descricao" />
      </div>
      <div class="form-group">
        <label class="form-label">Valor *</label>
        <input type="number" step="0.01" class="form-input" id="modal-pagar-valor" required />
      </div>
      <div class="form-group">
        <label class="form-label">Data Vencimento *</label>
        <input type="date" class="form-input" id="modal-pagar-vencimento" required />
      </div>
      <div class="form-group form-group-full">
        <label class="form-label">Observações</label>
        <textarea class="form-input" id="modal-pagar-obs"></textarea>
      </div>
    </div>
  `, async () => {
    const dados = {
      fornecedor: document.getElementById('modal-pagar-fornecedor').value,
      categoria: document.getElementById('modal-pagar-categoria').value,
      descricao: document.getElementById('modal-pagar-descricao').value,
      valor: parseFloat(document.getElementById('modal-pagar-valor').value),
      data_vencimento: document.getElementById('modal-pagar-vencimento').value,
      observacoes: document.getElementById('modal-pagar-obs').value
    };

    const result = await window.api.criarContaPagar(dados);
    if (result.success) {
      await loadContasPagar();
      closeModal();
      render();
    } else {
      alert('Erro ao criar conta: ' + result.message);
    }
  });
}

function showNovoUsuarioModal() {
  showModal('Novo Usuário', `
    <div class="form-group">
      <label class="form-label">Nome *</label>
      <input type="text" class="form-input" id="modal-usuario-nome" required />
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">E-mail *</label>
        <input type="email" class="form-input" id="modal-usuario-email" required />
      </div>
      <div class="form-group">
        <label class="form-label">Cargo *</label>
        <select class="form-input" id="modal-usuario-cargo" required>
          <option value="">Selecione...</option>
          <option value="ADMIN">Administrador</option>
          <option value="DIRETOR">Diretor</option>
          <option value="FINANCEIRO">Financeiro</option>
          <option value="VENDAS">Vendas</option>
          <option value="MECANICO">Mecânico</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Senha *</label>
        <input type="password" class="form-input" id="modal-usuario-senha" required />
      </div>
    </div>
  `, async () => {
    const dados = {
      nome: document.getElementById('modal-usuario-nome').value,
      email: document.getElementById('modal-usuario-email').value,
      cargo: document.getElementById('modal-usuario-cargo').value,
      senha: document.getElementById('modal-usuario-senha').value
    };

    const result = await window.api.criarUsuario(dados);
    if (result.success) {
      await loadUsuarios();
      closeModal();
      render();
    } else {
      alert('Erro ao criar usuário: ' + result.message);
    }
  });
}

function showModal(title, bodyHTML, onSave) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close" id="modal-close-btn">&times;</button>
      </div>
      <div class="modal-body">
        ${bodyHTML}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="modal-cancel-btn">Cancelar</button>
        <button class="btn btn-primary" id="modal-save-btn">Salvar</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('modal-close-btn').addEventListener('click', () => closeModal());
  document.getElementById('modal-cancel-btn').addEventListener('click', () => closeModal());
  document.getElementById('modal-save-btn').addEventListener('click', onSave);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

function closeModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) modal.remove();
}

// Funções globais para ações de tabela
window.editarOS = async (id) => {
  mostrarModalOS(id);
};

window.registrarPagamentoReceber = async (id) => {
  const data = new Date().toISOString().split('T')[0];
  const result = await window.api.registrarPagamentoReceber(id, data);
  if (result.success) {
    await loadContasReceber();
    await loadStats();
    render();
  } else {
    alert('Erro ao registrar pagamento: ' + result.message);
  }
};

window.registrarPagamentoPagar = async (id) => {
  const data = new Date().toISOString().split('T')[0];
  const result = await window.api.registrarPagamentoPagar(id, data);
  if (result.success) {
    await loadContasPagar();
    await loadStats();
    render();
  } else {
    alert('Erro ao registrar pagamento: ' + result.message);
  }
};

// ==================== CARREGAMENTO DE DADOS ====================
async function loadAllData() {
  await Promise.all([
    loadClientes(),
    loadMaquinas(),
    loadOrdensServico(),
    loadPecas(),
    loadVendas(),
    loadUsuarios(),
    loadContasReceber(),
    loadContasPagar(),
    loadStats()
  ]);
}

async function loadClientes() {
  const result = await window.api.listarClientes();
  if (result.success) AppState.data.clientes = result.clientes;
}

async function loadMaquinas() {
  const result = await window.api.listarMaquinas();
  if (result.success) AppState.data.maquinas = result.maquinas;
}

async function loadOrdensServico(filtros = {}) {
  const result = await window.api.listarOS(filtros);
  if (result.success) AppState.data.ordens = result.ordens;
}

async function loadPecas() {
  const result = await window.api.listarPecas();
  if (result.success) AppState.data.pecas = result.pecas;
}

async function loadVendas() {
  const result = await window.api.listarVendas();
  if (result.success) AppState.data.vendas = result.vendas;
}

async function loadUsuarios() {
  const result = await window.api.listarUsuarios();
  if (result.success) AppState.data.usuarios = result.usuarios;
}

async function loadContasReceber(filtros = {}) {
  const result = await window.api.listarContasReceber(filtros);
  if (result.success) AppState.data.contasReceber = result.contas;
}

async function loadContasPagar(filtros = {}) {
  const result = await window.api.listarContasPagar(filtros);
  if (result.success) AppState.data.contasPagar = result.contas;
}

async function loadStats() {
  const result = await window.api.obterEstatisticas();
  if (result.success) AppState.data.stats = result.stats;
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
  render();

  // Event listener para login
  document.addEventListener('submit', async (e) => {
    if (e.target.id === 'login-form') {
      e.preventDefault();

      const email = document.getElementById('login-email').value;
      const senha = document.getElementById('login-password').value;
      const alertDiv = document.getElementById('login-alert');
      const btnText = document.getElementById('login-btn-text');

      btnText.innerHTML = '<span class="loading"></span>';

      const result = await window.api.login({ email, senha });

      if (result.success) {
        AppState.currentUser = result.usuario;
        await loadAllData();
        render();
      } else {
        alertDiv.innerHTML = `<div class="alert alert-error">${result.message}</div>`;
        btnText.textContent = 'Entrar';
      }
    }
  });
});
