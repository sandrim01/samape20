// Estado global da aplicação
const AppState = {
  currentUser: null,
  currentPage: 'dashboard',
  menuOpen: false, // Controle do menu cascata
  expandedSections: ['Operacional'], // Seções expandidas por padrão
  data: {
    clientes: [],
    maquinas: [],
    ordens: [],
    pecas: [],
    vendas: [],
    usuarios: [],
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
  try {
    const app = document.getElementById('app');

    if (!AppState.currentUser) {
      app.innerHTML = renderLogin();
    } else {
      app.innerHTML = renderMainApp();
      attachEventListeners();
    }
  } catch (error) {
    console.error('Erro na renderização:', error);
    document.getElementById('app').innerHTML = `
      <div style="padding: 2rem; color: #ef4444; background: #fee2e2; border: 1px solid #fca5a5; border-radius: 0.5rem; margin: 1rem;">
        <h3>Erro de Inicialização</h3>
        <p>Ocorreu um erro ao carregar a interface. Por favor, tente reiniciar o aplicativo.</p>
        <pre style="font-size: 0.8rem; margin-top: 1rem; overflow: auto;">${error.stack}</pre>
      </div>
    `;
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
      </div>
    </div>
  `;
}

// ==================== APLICAÇÃO PRINCIPAL ====================
function renderMainApp() {
  return `
    <div class="app-container">
      <div class="sidebar-overlay" id="menu-overlay"></div>
      <div class="main-content">
        ${renderTopbar()}
        ${renderSidebar()}
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
    { section: 'Vendas e Estoque' },
    { id: 'vendas', label: 'Vendas de Peças', icon: '🛒', permission: 'vendas' },
    { id: 'pecas', label: 'Estoque de Peças', icon: '📦', permission: 'pecas' },
    { section: 'Cadastros' },
    { id: 'clientes', label: 'Clientes', icon: '👥', permission: 'clientes' },
    { section: 'Sistema' },
    { id: 'usuarios', label: 'Usuários', icon: '👤', permission: '*' }
  ];

  let navHTML = '';
  let currentSection = '';

  navItems.forEach(item => {
    if (item.section) {
      if (currentSection) navHTML += '</div></div>';
      const isExpanded = AppState.expandedSections.includes(item.section);
      navHTML += `
        <div class="cascade-section">
          <div class="cascade-section-header" onclick="toggleSection('${item.section}')">
            <span>${item.section}</span>
            <span class="chevron">${isExpanded ? '▼' : '▶'}</span>
          </div>
          <div class="cascade-section-content ${isExpanded ? 'expanded' : ''}">
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

  if (currentSection) navHTML += '</div></div>';

  const userName = AppState.currentUser ? (AppState.currentUser.nome || 'Usuário') : 'Usuário';
  const initials = userName.split(' ').filter(n => n).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

  const roleLabels = {
    ADMIN: 'Administrador',
    DIRETOR: 'Diretor',
    FINANCEIRO: 'Financeiro',
    VENDAS: 'Vendas',
    MECANICO: 'Mecânico'
  };

  return `
    <div class="cascade-menu ${AppState.menuOpen ? 'open' : ''}" id="cascade-menu">
      <div class="menu-content">
        ${navHTML}

        <div class="menu-footer">
          <div class="user-info-brief">
            <div class="user-avatar-sm">${initials}</div>
            <div class="user-details-sm">
              <div class="user-name-sm">${userName}</div>
            </div>
          </div>
          <button class="btn btn-danger btn-sm" id="logout-btn" style="width: 100%; margin-top: 0.5rem;">
            Sair
          </button>
        </div>
      </div>
    </div>
  `;
}

function toggleSection(section) {
  const index = AppState.expandedSections.indexOf(section);
  if (index > -1) {
    AppState.expandedSections.splice(index, 1);
  } else {
    AppState.expandedSections.push(section);
  }
  render();
}

function renderTopbar() {
  const pageTitles = {
    'dashboard': 'Dashboard',
    'ordens-servico': 'Ordens de Serviço',
    'maquinas': 'Máquinas',
    'clientes': 'Clientes',
    'usuarios': 'Usuários'
  };

  return `
    <div class="topbar">
      <div class="topbar-left">
        <div id="logo-trigger" class="logo-container-small">
          <img src="resources/logonova2.png" alt="S" style="height: 35px; width: auto; cursor: pointer;" />
        </div>
        <h1 class="page-title">${pageTitles[AppState.currentPage] || 'SAMAPEOP'}</h1>
      </div>
      <div class="topbar-right">
        <span class="topbar-date-text">${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</span>
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
    <div class="dashboard-welcome">
      <div class="welcome-text">
        <h2 style="margin: 0; color: var(--primary);">Olá, ${AppState.currentUser.nome.split(' ')[0]}!</h2>
        <p style="margin: 0; color: var(--text-muted);">Bem-vindo ao painel de controle do SAMAPEOP.</p>
      </div>
      <div class="quick-actions-bar">
        <button class="btn btn-primary btn-sm" onclick="showNovaOSModal()">+ Nova OS</button>
        <button class="btn btn-secondary btn-sm" onclick="showNovaVendaModal()">+ Venda</button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card premium">
        <div class="stat-header">
          <span class="stat-label">Ordens Abertas</span>
          <div class="stat-icon-bg warning">🔧</div>
        </div>
        <div class="stat-value-large">${stats.os_abertas || 0}</div>
        <div class="stat-progress-bar">
          <div class="progress" style="width: ${(stats.os_abertas / (stats.os_abertas + stats.os_em_andamento + 1) * 100)}%; background: var(--warning);"></div>
        </div>
        <div class="stat-footer">Aguardando início</div>
      </div>

      <div class="stat-card premium">
        <div class="stat-header">
          <span class="stat-label">Em Execução</span>
          <div class="stat-icon-bg primary">⚙️</div>
        </div>
        <div class="stat-value-large">${stats.os_em_andamento || 0}</div>
         <div class="stat-progress-bar">
          <div class="progress" style="width: ${(stats.os_em_andamento / (stats.os_abertas + stats.os_em_andamento + 1) * 100)}%; background: var(--primary);"></div>
        </div>
        <div class="stat-footer">Serviços ativos</div>
      </div>

      ${hasPermission('pecas') ? `
        <div class="stat-card premium">
          <div class="stat-header">
            <span class="stat-label">Crítico de Estoque</span>
            <div class="stat-icon-bg warning">📦</div>
          </div>
          <div class="stat-value-large">${stats.pecas_estoque_baixo || 0}</div>
          <div class="stat-footer">Peças abaixo do comum</div>
        </div>
      ` : ''}

      ${hasPermission('vendas') ? `
        <div class="stat-card premium">
          <div class="stat-header">
            <span class="stat-label">Vendas do Mês</span>
            <div class="stat-icon-bg info">🛒</div>
          </div>
          <div class="stat-value-large">R$ ${formatMoney(stats.vendas_mes?.total || 0)}</div>
          <div class="stat-footer">${stats.vendas_mes?.count || 0} pedidos realizados</div>
        </div>
      ` : ''}
    </div>

    <div class="dashboard-grid-two">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Ordens Recentes</h2>
          <span class="card-link" onclick="AppState.currentPage = 'ordens-servico'; render();">Ver todas →</span>
        </div>
        ${renderOrdensTable(AppState.data.ordens.slice(0, 5))}
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Resumo de Atividades</h2>
        </div>
        <div class="activity-list">
          <div class="activity-item">
            <div class="activity-icon info">📝</div>
            <div class="activity-body">
              <div class="activity-title">Sistema Operacional</div>
              <div class="activity-time">Conectado ao PostgreSQL Railway</div>
            </div>
          </div>
          <div class="activity-item">
            <div class="activity-icon success">🏢</div>
            <div class="activity-body">
              <div class="activity-title">${AppState.data.clientes.length} Clientes Ativos</div>
              <div class="activity-time">Base de dados sincronizada</div>
            </div>
          </div>
          <div class="activity-item">
            <div class="activity-icon primary">🚜</div>
            <div class="activity-body">
              <div class="activity-title">${AppState.data.maquinas.length} Máquinas Registradas</div>
              <div class="activity-time">Frota completa sob gestão</div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${maquinas.map(maq => `
            <tr>
              <td>${maq.cliente_nome || '-'}</td>
              <td><strong>${maq.modelo}</strong></td>
              <td>${maq.numero_serie || '-'}</td>
              <td>${maq.ano_fabricacao || maq.ano || '-'}</td>
              <td>${maq.observacoes || '-'}</td>
              <td>
                <button class="btn btn-secondary btn-sm" onclick="showNovaMaquinaModal(${maq.id})">
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
            <th>Estoque</th>
            <th>Mínimo</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${pecas.map(peca => {
    const estoqueBaixo = (peca.quantidade_estoque || peca.estoque_atual || 0) <= (peca.estoque_minimo || 0);
    return `
              <tr>
                <td><strong>${peca.codigo}</strong></td>
                <td>${peca.nome || peca.descricao}</td>
                <td>R$ ${formatMoney(peca.preco_custo)}</td>
                <td>R$ ${formatMoney(peca.preco_venda)}</td>
                <td>${peca.quantidade_estoque || peca.estoque_atual || 0}</td>
                <td>${peca.estoque_minimo || 0}</td>
                <td>
                  ${estoqueBaixo
        ? '<span class="badge badge-danger">Baixo</span>'
        : '<span class="badge badge-success">OK</span>'}
                </td>
                <td>
                  <button class="btn btn-secondary btn-sm" onclick="showNovaPecaModal(${peca.id})">
                    Editar
                  </button>
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

// ==================== USUÁRIOS ====================
function renderClientes() {
  return `
    <div class="card" >
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
    <div class="empty-state" >
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
            <th>Ações</th>
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
              <td>
                <button class="btn btn-secondary btn-sm" onclick="showNovoClienteModal(${cliente.id})">
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

// ==================== USUÁRIOS ====================
// ==================== USUÁRIOS ====================
function renderUsuarios() {
  return `
    <div class="card" >
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
    <div class="empty-state" >
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
            <th>Ações</th>
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
              <td>
                <button class="btn btn-secondary btn-sm" onclick="showNovoUsuarioModal(${usuario.id})">Editar</button>
              </td>
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
// Funções de menu globais
window.toggleSection = (section) => {
  const index = AppState.expandedSections.indexOf(section);
  if (index > -1) {
    AppState.expandedSections.splice(index, 1);
  } else {
    AppState.expandedSections.push(section);
  }
  render();
};

function attachEventListeners() {
  // Navegação
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      AppState.currentPage = item.dataset.page;
      AppState.menuOpen = false; // Fecha ao navegar
      render();
    });
  });

  // Toggle Menu Cascata (Logo)
  const logoTrigger = document.getElementById('logo-trigger');
  if (logoTrigger) {
    logoTrigger.addEventListener('click', () => {
      AppState.menuOpen = !AppState.menuOpen;
      render();
    });
  }

  // Overlay para fechar menu
  const overlay = document.getElementById('menu-overlay');
  if (overlay) {
    if (AppState.menuOpen) overlay.classList.add('visible');
    overlay.addEventListener('click', () => {
      AppState.menuOpen = false;
      render();
    });
  }

  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await window.api.logout();
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

// Expor funções para serem usadas no HTML (onclick)
window.showNovoClienteModal = showNovoClienteModal;
window.showNovaMaquinaModal = showNovaMaquinaModal;
window.showNovaPecaModal = showNovaPecaModal;
window.showNovaOSModal = showNovaOSModal;
window.showNovaVendaModal = showNovaVendaModal;
window.showNovaContaReceberModal = showNovaContaReceberModal;
window.showNovaContaPagarModal = showNovaContaPagarModal;
window.showNovoUsuarioModal = showNovoUsuarioModal;
window.closeModal = closeModal;
window.render = render;

window.loadOrdens = loadOrdensServico;
window.fecharModal = (id) => {
  const modal = document.getElementById(id);
  if (modal) modal.remove();
  else closeModal();
};
window.formatMoney = formatMoney;
window.formatDate = formatDate;
window.showAlert = (msg, type) => alert(msg);
window.refreshPage = () => render();
window.loadClientes = loadClientes;
window.loadMaquinas = loadMaquinas;
window.loadPecas = loadPecas;

function attachButtonListener(id, handler) {
  const btn = document.getElementById(id);
  if (btn) btn.addEventListener('click', handler);
}

function attachSelectListener(id, handler) {
  const select = document.getElementById(id);
  if (select) select.addEventListener('change', (e) => handler(e.target.value));
}

// ==================== MODAIS ====================
async function showNovoClienteModal(clienteId = null) {
  if (clienteId instanceof Event) clienteId = null;
  const isEdicao = clienteId !== null;
  let clienteData = null;

  if (isEdicao) {
    const result = await window.api.obterCliente(clienteId);
    if (result.success) clienteData = result.cliente;
  }

  showModal(isEdicao ? 'Editar Cliente' : 'Novo Cliente', `
    <div class="form-group">
      <label class="form-label">Nome *</label>
      <input type="text" class="form-input" id="modal-cliente-nome" value="${clienteData?.nome || ''}" required />
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">CNPJ</label>
        <input type="text" class="form-input" id="modal-cliente-cnpj" value="${clienteData?.cnpj || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Telefone</label>
        <input type="text" class="form-input" id="modal-cliente-telefone" value="${clienteData?.telefone || ''}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">E-mail</label>
      <input type="email" class="form-input" id="modal-cliente-email" value="${clienteData?.email || ''}" />
    </div>
    <div class="form-group">
      <label class="form-label">Endereço</label>
      <textarea class="form-input" id="modal-cliente-endereco">${clienteData?.endereco || ''}</textarea>
    </div>
    ${isEdicao ? `
    <div style="margin-top: 1rem; border-top: 1px solid var(--border); padding-top: 1rem;">
      <button class="btn btn-danger btn-sm" onclick="excluirCliente(${clienteId})">Excluir Cliente</button>
    </div>
    ` : ''}
  `, async () => {
    const dados = {
      nome: document.getElementById('modal-cliente-nome').value,
      cnpj: document.getElementById('modal-cliente-cnpj').value,
      telefone: document.getElementById('modal-cliente-telefone').value,
      email: document.getElementById('modal-cliente-email').value,
      endereco: document.getElementById('modal-cliente-endereco').value
    };

    const result = isEdicao
      ? await window.api.atualizarCliente(clienteId, dados)
      : await window.api.criarCliente(dados);

    if (result.success) {
      await loadClientes();
      closeModal();
      render();
    } else {
      alert('Erro ao salvar cliente: ' + result.message);
    }
  });
}

window.excluirCliente = async (id) => {
  if (confirm('Tem certeza que deseja excluir este cliente?')) {
    const result = await window.api.excluirCliente(id);
    if (result.success) {
      await loadClientes();
      render();
    } else {
      alert('Erro ao excluir cliente: ' + result.message);
    }
  }
};

async function showNovaMaquinaModal(maquinaId = null) {
  if (maquinaId instanceof Event) maquinaId = null;
  const isEdicao = maquinaId !== null;
  let maquinaData = null;

  if (isEdicao) {
    const result = await window.api.obterMaquina(maquinaId);
    if (result.success) maquinaData = result.maquina;
  }
  const clientesOptions = AppState.data.clientes.map(c =>
    `<option value="${c.id}" ${maquinaData?.cliente_id == c.id ? 'selected' : ''}>${c.nome}</option>`
  ).join('');

  showModal(isEdicao ? 'Editar Máquina' : 'Nova Máquina', `
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
        <input type="text" class="form-input" id="modal-maquina-modelo" value="${maquinaData?.modelo || ''}" required />
      </div>
      <div class="form-group">
        <label class="form-label">Número de Série</label>
        <input type="text" class="form-input" id="modal-maquina-serie" value="${maquinaData?.numero_serie || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Ano</label>
        <input type="number" class="form-input" id="modal-maquina-ano" value="${maquinaData?.ano_fabricacao || maquinaData?.ano || ''}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Observações</label>
      <textarea class="form-input" id="modal-maquina-obs">${maquinaData?.observacoes || ''}</textarea>
    </div>
    ${isEdicao ? `
    <div style="margin-top: 1rem; border-top: 1px solid var(--border); padding-top: 1rem;">
      <button class="btn btn-danger btn-sm" onclick="excluirMaquina(${maquinaId})">Excluir Máquina</button>
    </div>
    ` : ''}
  `, async () => {
    const dados = {
      cliente_id: document.getElementById('modal-maquina-cliente').value,
      modelo: document.getElementById('modal-maquina-modelo').value,
      numero_serie: document.getElementById('modal-maquina-serie').value,
      ano: document.getElementById('modal-maquina-ano').value,
      observacoes: document.getElementById('modal-maquina-obs').value
    };

    const result = isEdicao
      ? await window.api.atualizarMaquina(maquinaId, dados)
      : await window.api.criarMaquina(dados);
    if (result.success) {
      await loadMaquinas();
      closeModal();
      render();
    } else {
      alert('Erro ao salvar máquina: ' + result.message);
    }
  });
}

window.excluirMaquina = async (id) => {
  if (confirm('Tem certeza que deseja excluir esta máquina?')) {
    const result = await window.api.excluirMaquina(id);
    if (result.success) {
      await loadMaquinas();
      closeModal();
      render();
    } else {
      alert('Erro ao excluir máquina: ' + result.message);
    }
  }
};

function showNovaOSModal() {
  mostrarModalOS();
}

async function showNovaPecaModal(pecaId = null) {
  if (pecaId instanceof Event) pecaId = null;
  const isEdicao = pecaId !== null;
  let pecaData = null;

  if (isEdicao) {
    const result = await window.api.obterPeca(pecaId);
    if (result.success) pecaData = result.peca;
  }

  showModal(isEdicao ? 'Editar Peça' : 'Nova Peça', `
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Código *</label>
        <input type="text" class="form-input" id="modal-peca-codigo" value="${pecaData?.codigo || ''}" required />
      </div>
      <div class="form-group form-group-full">
        <label class="form-label">Nome / Descrição *</label>
        <input type="text" class="form-input" id="modal-peca-descricao" value="${pecaData?.nome || pecaData?.descricao || ''}" required />
      </div>
      <div class="form-group">
        <label class="form-label">Preço Custo</label>
        <input type="number" step="0.01" class="form-input" id="modal-peca-custo" value="${pecaData?.preco_custo || 0}" />
      </div>
      <div class="form-group">
        <label class="form-label">Preço Venda</label>
        <input type="number" step="0.01" class="form-input" id="modal-peca-venda" value="${pecaData?.preco_venda || 0}" />
      </div>
      <div class="form-group">
        <label class="form-label">Estoque Atual</label>
        <input type="number" class="form-input" id="modal-peca-estoque" value="${pecaData?.quantidade_estoque || pecaData?.estoque_atual || 0}" />
      </div>
      <div class="form-group">
        <label class="form-label">Estoque Mínimo</label>
        <input type="number" class="form-input" id="modal-peca-minimo" value="${pecaData?.estoque_minimo || 0}" />
      </div>
    </div>
    ${isEdicao ? `
    <div style="margin-top: 1rem; border-top: 1px solid var(--border); padding-top: 1rem;">
      <button class="btn btn-danger btn-sm" onclick="excluirPeca(${pecaId})">Excluir Peça</button>
    </div>
    ` : ''}
    `, async () => {
    const dados = {
      codigo: document.getElementById('modal-peca-codigo').value,
      descricao: document.getElementById('modal-peca-descricao').value,
      preco_custo: parseFloat(document.getElementById('modal-peca-custo').value) || 0,
      preco_venda: parseFloat(document.getElementById('modal-peca-venda').value) || 0,
      estoque_atual: parseInt(document.getElementById('modal-peca-estoque').value) || 0,
      estoque_minimo: parseInt(document.getElementById('modal-peca-minimo').value) || 0
    };

    const result = isEdicao
      ? await window.api.atualizarPeca(pecaId, dados)
      : await window.api.criarPeca(dados);
    if (result.success) {
      await loadPecas();
      closeModal();
      render();
    } else {
      alert('Erro ao salvar peça: ' + result.message);
    }
  });
}

window.excluirPeca = async (id) => {
  if (confirm('Tem certeza que deseja excluir esta peça?')) {
    const result = await window.api.excluirPeca(id);
    if (result.success) {
      await loadPecas();
      closeModal();
      render();
    } else {
      alert('Erro ao excluir peça: ' + result.message);
    }
  }
};

async function showNovaVendaModal() {
  const clientesOptions = AppState.data.clientes.map(c =>
    `<option value="${c.id}">${c.nome}</option>`
  ).join('');

  showModal('Nova Venda de Peças', `
    <div class="form-group">
      <label class="form-label">Cliente *</label>
      <select class="form-input" id="modal-venda-cliente" required>
        <option value="">Selecione...</option>
        ${clientesOptions}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Valor Total (R$) *</label>
      <input type="number" step="0.01" class="form-input" id="modal-venda-valor" required />
    </div>
    <div class="form-group">
      <label class="form-label">Observações</label>
      <textarea class="form-input" id="modal-venda-obs" placeholder="Peças vendidas, forma de pagamento..."></textarea>
    </div>
  `, async () => {
    const dados = {
      cliente_id: document.getElementById('modal-venda-cliente').value,
      vendedor_id: AppState.currentUser.id,
      valor_total: parseFloat(document.getElementById('modal-venda-valor').value)
    };

    const result = await window.api.criarVenda(dados);
    if (result.success) {
      await loadVendas();
      await loadStats();
      closeModal();
      render();
    } else {
      alert('Erro ao registrar venda: ' + result.message);
    }
  });
}

function showNovaContaReceberModal() {
  const clientesOptions = AppState.data.clientes.map(c =>
    `<option value="${c.id}">${c.nome}</option>`
  ).join('');

  showModal('Nova Conta a Receber', `
    <div class="form-group">
      <label class="form-label">Cliente *</label>
      <select class="form-input" id="modal-receber-cliente" required>
        <option value="">Selecione...</option>
        ${clientesOptions}
      </select>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Valor *</label>
        <input type="number" step="0.01" class="form-input" id="modal-receber-valor" required />
      </div>
      <div class="form-group">
        <label class="form-label">Data Vencimento *</label>
        <input type="date" class="form-input" id="modal-receber-vencimento" required />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Descrição</label>
      <input type="text" class="form-input" id="modal-receber-descricao" />
    </div>
  `, async () => {
    // Implementar criarContaReceber na API se necessário, por enquanto usamos os dados locais
    alert('Esta funcionalidade requer integração adicional com o endpoint de contas a receber.');
  });
}

function showNovaContaPagarModal() {
  const categorias = ['Fornecedores', 'Salários', 'Aluguel', 'Energia', 'Água', 'Internet', 'Impostos', 'Outros'];

  showModal('Nova Conta a Pagar', `
    <div class="form-grid" >
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

async function showNovoUsuarioModal(usuarioId = null) {
  if (usuarioId instanceof Event) usuarioId = null;
  const isEdicao = usuarioId !== null;
  let usuarioData = null;

  if (isEdicao) {
    const result = await window.api.obterUsuario(usuarioId);
    if (result.success) usuarioData = result.usuario;
  }

  showModal(isEdicao ? 'Editar Usuário' : 'Novo Usuário', `
    <div class="form-group" >
      <label class="form-label">Nome *</label>
      <input type="text" class="form-input" id="modal-usuario-nome" value="${usuarioData?.nome || ''}" required />
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">E-mail *</label>
        <input type="email" class="form-input" id="modal-usuario-email" value="${usuarioData?.email || ''}" required />
      </div>
      <div class="form-group">
        <label class="form-label">Cargo *</label>
        <select class="form-input" id="modal-usuario-cargo" required>
          <option value="">Selecione...</option>
          <option value="ADMIN" ${usuarioData?.cargo === 'ADMIN' ? 'selected' : ''}>Administrador</option>
          <option value="DIRETOR" ${usuarioData?.cargo === 'DIRETOR' ? 'selected' : ''}>Diretor</option>
          <option value="FINANCEIRO" ${usuarioData?.cargo === 'FINANCEIRO' ? 'selected' : ''}>Financeiro</option>
          <option value="VENDAS" ${usuarioData?.cargo === 'VENDAS' ? 'selected' : ''}>Vendas</option>
          <option value="MECANICO" ${usuarioData?.cargo === 'MECANICO' ? 'selected' : ''}>Mecânico</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">${isEdicao ? 'Nova Senha (deixe em branco para manter)' : 'Senha *'}</label>
        <input type="password" class="form-input" id="modal-usuario-senha" ${isEdicao ? '' : 'required'} />
      </div>
      ${isEdicao ? `
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-input" id="modal-usuario-ativo">
          <option value="true" ${usuarioData?.ativo ? 'selected' : ''}>Ativo</option>
          <option value="false" ${!usuarioData?.ativo ? 'selected' : ''}>Inativo</option>
        </select>
      </div>
      ` : ''}
    </div>
  `, async () => {
    const dados = {
      nome: document.getElementById('modal-usuario-nome').value,
      email: document.getElementById('modal-usuario-email').value,
      cargo: document.getElementById('modal-usuario-cargo').value,
      senha: document.getElementById('modal-usuario-senha').value,
      ativo: isEdicao ? document.getElementById('modal-usuario-ativo').value === 'true' : true
    };

    const result = isEdicao
      ? await window.api.atualizarUsuario(usuarioId, dados)
      : await window.api.criarUsuario(dados);

    if (result.success) {
      await loadUsuarios();
      closeModal();
      render();
    } else {
      alert('Erro ao salvar usuário: ' + result.message);
    }
  });
}

function showModal(title, bodyHTML, onSave) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal" >
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

// ==================== CARREGAMENTO DE DADOS ====================
async function loadAllData() {
  await Promise.all([
    loadClientes(),
    loadMaquinas(),
    loadOrdensServico(),
    loadPecas(),
    loadVendas(),
    loadUsuarios(),
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

async function loadStats() {
  const result = await window.api.obterEstatisticas();
  if (result.success) AppState.data.stats = result.stats;
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 DOM Carregado. Iniciando SAMAPEOP...');

  // Função de inicialização assíncrona separada para maior compatibilidade
  const init = async () => {
    try {
      if (!window.api) {
        throw new Error('API não carregada. Verifique o arquivo api-client.js');
      }

      // Verificar se há uma sessão salva
      const savedUser = window.api.getUser();
      if (savedUser) {
        console.log('📦 Sessão recuperada:', savedUser.nome);
        AppState.currentUser = savedUser;
        render(); // Renderiza interface inicial

        try {
          await loadAllData();
          render(); // Atualiza com dados carregados
        } catch (dataError) {
          console.warn('⚠️ Erro ao carregar dados iniciais:', dataError);
          // Mesmo com erro nos dados, já renderizamos a estrutura
        }
      } else {
        render(); // Renderiza tela de login
      }
    } catch (err) {
      console.error('❌ Erro crítico na inicialização:', err);
      const app = document.getElementById('app');
      if (app) {
        app.innerHTML = `
    <div style="padding: 2rem; color: #ef4444; background: #fee2e2; border: 1px solid #fca5a5; border-radius: 0.5rem; margin: 1rem;">
            <h3>Erro de Inicialização</h3>
            <p>${err.message}</p>
            <button onclick="window.location.reload()" class="btn btn-primary" style="margin-top: 1rem;">Tentar Novamente</button>
          </div>
    `;
      }
    }
  };

  init();

  // Event listener para login usando delegação de evento no documento
  document.addEventListener('submit', async (e) => {
    if (e.target.id === 'login-form') {
      e.preventDefault();

      const email = document.getElementById('login-email').value;
      const senha = document.getElementById('login-password').value;
      const alertDiv = document.getElementById('login-alert');
      const btnText = document.getElementById('login-btn-text');

      if (btnText) btnText.innerHTML = '<span class="loading"></span>';

      try {
        const result = await window.api.login({ email, senha });

        if (result.success) {
          AppState.currentUser = result.usuario;
          await loadAllData();
          render();
        } else {
          if (alertDiv) alertDiv.innerHTML = `<div class="alert alert-error">${result.message}</div> `;
          if (btnText) btnText.textContent = 'Entrar';
        }
      } catch (loginError) {
        console.error('Erro no login:', loginError);
        if (alertDiv) alertDiv.innerHTML = `<div class="alert alert-error">Erro de conexão: ${loginError.message}</div> `;
        if (btnText) btnText.textContent = 'Entrar';
      }
    }
  });
});
