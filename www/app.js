// Estado global da aplicação
const AppState = {
  version: '1.0.2', // Versão Oficial 1.0.2
  currentUser: null,
  currentPage: 'dashboard',
  menuOpen: false, // Controle do menu cascata
  expandedSections: ['Operacional'], // Seções expandidas por padrão
  modalAberto: false, // Impede que render() destrua modais abertos
  data: {
    clientes: [],
    maquinas: [],
    ordens: [],
    pecas: [],
    vendas: [],
    usuarios: [],
    logs: [],
    stats: {}
  },
  filters: {
    ordens: { search: '', status: '' },
    maquinas: { search: '' },
    pecas: { search: '' },
    clientes: { search: '' },
    vendas: { search: '' }
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
    const activeId = document.activeElement ? document.activeElement.id : null;
    const selection = document.activeElement && document.activeElement.tagName === 'INPUT'
      ? { start: document.activeElement.selectionStart, end: document.activeElement.selectionEnd }
      : null;

    if (!AppState.currentUser) {
      app.innerHTML = renderLogin();
    } else {
      app.innerHTML = renderMainApp();
      attachEventListeners();

      // Restaurar foco e seleção
      if (activeId) {
        const el = document.getElementById(activeId);
        if (el) {
          el.focus();
          if (selection && el.setSelectionRange) {
            el.setSelectionRange(selection.start, selection.end);
          }
        }
      }
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

          <div class="form-group" style="display: flex; align-items: center; gap: 0.5rem; margin-top: -0.5rem; margin-bottom: 1.5rem; cursor: pointer;">
            <input type="checkbox" id="login-remember" style="width: 18px; height: 18px; cursor: pointer;" checked />
            <label for="login-remember" style="font-size: 0.9rem; color: var(--text-secondary); cursor: pointer; user-select: none;">Mantenha-me logado</label>
          </div>

          <button type="submit" class="btn btn-primary">
            <span id="login-btn-text">Entrar</span>
          </button>
        </form>
      </div>
      <div style="position: fixed; bottom: 15px; right: 20px; font-size: 0.75rem; color: var(--text-muted); opacity: 0.7; pointer-events: none;">
        Versão ${AppState.version}
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
        <span style="font-size: 0.7rem; color: var(--text-muted); padding: 0.25rem 0.5rem; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 4px; margin-left: 0.75rem;">
          v${AppState.version}
        </span>
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
      <div class="stat-card premium" onclick="this.classList.toggle('expanded')">
        <div class="stat-header">
          <span class="stat-label">Ordens Abertas</span>
          <div class="stat-icon-bg primary">📋</div>
        </div>
        <div class="stat-value-large">${stats.os_abertas || 0}</div>
        <div class="stat-footer">${stats.os_em_andamento || 0} em andamento</div>
      </div>

      <div class="stat-card premium" onclick="this.classList.toggle('expanded')">
        <div class="stat-header">
          <span class="stat-label">Estoque Crítico</span>
          <div class="stat-icon-bg warning">📦</div>
        </div>
        <div class="stat-value-large">${stats.pecas_estoque_baixo || 0}</div>
        <div class="stat-footer">Peças abaixo do mínimo</div>
      </div>

      ${hasPermission('financeiro') ? `
        <div class="stat-card premium" onclick="this.classList.toggle('expanded')">
          <div class="stat-header">
            <span class="stat-label">Contas a Receber</span>
            <div class="stat-icon-bg success">💰</div>
          </div>
          <div class="stat-value-large">R$ ${formatMoney(stats.contas_receber_pendentes?.total || 0)}</div>
          <div class="stat-footer">${stats.contas_receber_pendentes?.count || 0} faturas pendentes</div>
        </div>
      ` : ''}

      ${hasPermission('vendas') ? `
        <div class="stat-card premium" onclick="this.classList.toggle('expanded')">
          <div class="stat-header">
            <span class="stat-label">Vendas do Mês</span>
            <div class="stat-icon-bg info">🛒</div>
          </div>
          <div class="stat-value-large">R$ ${formatMoney(stats.vendas_mes?.total || 0)}</div>
          <div class="stat-footer">${stats.vendas_mes?.count || 0} pedidos realizados</div>
        </div>
      ` : ''}

      <div class="stat-card premium" onclick="this.classList.toggle('expanded')">
        <div class="stat-header">
          <span class="stat-label">Saúde do Serviço (Méd.)</span>
          <div class="stat-icon-bg" style="background: ${getHealthColor(stats.tempo_medio_os)}22; color: ${getHealthColor(stats.tempo_medio_os)};">⚡</div>
        </div>
        <div class="stat-value-large" style="color: ${getHealthColor(stats.tempo_medio_os)};">${formatAverageTime(stats.tempo_medio_os)}</div>
        <div class="stat-footer">Tempo médio de conclusão</div>
      </div>
    </div>

    <div class="dashboard-grid-two" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Ordens Recentes</h2>
          <span class="card-link" onclick="AppState.currentPage = 'ordens-servico'; render();" style="cursor: pointer; color: var(--primary-light); font-size: 0.9rem;">Ver todas →</span>
        </div>
        ${renderOrdensTable(AppState.data.ordens.slice(0, 2))}
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Resumo de Atividades</h2>
        </div>
        <div class="activity-list">
          <div class="activity-item" style="display: flex; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid var(--border);">
            <div class="activity-icon info" style="font-size: 1.5rem;">📝</div>
            <div class="activity-body">
              <div class="activity-title" style="font-weight: 600;">Sistema Operacional</div>
              <div class="activity-time" style="font-size: 0.85rem; color: var(--text-muted);">Conectado ao PostgreSQL Railway</div>
            </div>
          </div>
          <div class="activity-item" style="display: flex; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid var(--border);">
            <div class="activity-icon success" style="font-size: 1.5rem;">🏢</div>
            <div class="activity-body">
              <div class="activity-title" style="font-weight: 600;">${AppState.data.clientes.length} Clientes Ativos</div>
              <div class="activity-time" style="font-size: 0.85rem; color: var(--text-muted);">Base de dados sincronizada</div>
            </div>
          </div>
          <div class="activity-item" style="display: flex; gap: 1rem; padding: 1rem 0;">
            <div class="activity-icon primary" style="font-size: 1.5rem;">🚜</div>
            <div class="activity-body">
              <div class="activity-title" style="font-weight: 600;">${AppState.data.maquinas.length} Máquinas Registradas</div>
              <div class="activity-time" style="font-size: 0.85rem; color: var(--text-muted);">Frota completa sob gestão</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    ${AppState.currentUser.cargo === 'ADMIN' ? `
      <div class="card" style="margin-top: 1.5rem;">
        <div class="card-header" style="justify-content: space-between; align-items: center;">
          <h2 class="card-title">Atividades do Sistema (Admin)</h2>
          <button class="btn btn-secondary btn-sm" onclick="loadLogs().then(render)" style="padding: 0.25rem 0.75rem;">🔄 Atualizar Logs</button>
        </div>
        <div class="table-container" style="max-height: 400px; overflow-y: auto;">
          <table style="font-size: 0.85rem; width: 100%; border-collapse: collapse;">
            <thead style="position: sticky; top: 0; z-index: 10; background: var(--bg-tertiary);">
              <tr>
                <th style="padding: 0.75rem; text-align: left;">Data/Hora</th>
                <th style="padding: 0.75rem; text-align: left;">Usuário</th>
                <th style="padding: 0.75rem; text-align: left;">Ação</th>
                <th style="padding: 0.75rem; text-align: left;">Detalhes</th>
                <th style="padding: 0.75rem; text-align: left;">IP</th>
              </tr>
            </thead>
            <tbody>
              ${AppState.data.logs.length === 0 ? '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">Nenhuma atividade recente registrada</td></tr>' :
        AppState.data.logs.map((log, index) => `
                <tr style="border-bottom: 1px solid var(--border); ${index % 2 === 0 ? 'background: rgba(255,255,255,0.02);' : ''}">
                  <td style="white-space: nowrap; padding: 0.75rem;">${new Date(log.created_at).toLocaleString('pt-BR')}</td>
                  <td style="padding: 0.75rem;"><strong>${log.usuario_nome}</strong></td>
                  <td style="padding: 0.75rem;"><span class="badge ${log.acao.includes('FALHA') ? 'badge-danger' : 'badge-info'}" style="font-size: 0.65rem; padding: 0.2rem 0.5rem; border-radius: 4px;">${log.acao}</span></td>
                  <td style="padding: 0.75rem; font-size: 0.8rem;">${log.detalhes}</td>
                  <td style="color: var(--text-muted); font-family: monospace; font-size: 0.75rem; padding: 0.75rem;">${log.ip}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}
  `;
}

// ==================== ORDENS DE SERVIÇO ====================
function renderOrdensServico() {
  const filters = AppState.filters.ordens;
  const filteredOrdens = AppState.data.ordens.filter(os => {
    const searchMatch = !filters.search ||
      (os.numero_os && os.numero_os.toString().toLowerCase().includes(filters.search.toLowerCase())) ||
      (os.cliente_nome && os.cliente_nome.toLowerCase().includes(filters.search.toLowerCase())) ||
      (os.maquina_modelo && os.maquina_modelo.toLowerCase().includes(filters.search.toLowerCase())) ||
      (os.mecanico_nome && os.mecanico_nome.toLowerCase().includes(filters.search.toLowerCase()));

    const statusMatch = !filters.status || os.status === filters.status;

    return searchMatch && statusMatch;
  });

  return `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Ordens de Serviço</h2>
        <button class="btn btn-primary btn-sm" id="nova-os-btn">
          + Nova OS
        </button>
      </div>

      <div class="filter-bar" style="margin-bottom: 1.5rem; display: flex; gap: 1rem; flex-wrap: wrap;">
        <div class="search-box" style="flex: 1; min-width: 250px;">
          <input 
            type="text" 
            class="form-input" 
            id="filtro-busca-os" 
            placeholder="Buscar por número, cliente, máquina..." 
            value="${filters.search}"
          />
        </div>
        <select class="form-input" id="filtro-status-os" style="max-width: 200px;">
          <option value="">Todos os Status</option>
          <option value="ABERTA" ${filters.status === 'ABERTA' ? 'selected' : ''}>Abertas</option>
          <option value="EM_ANDAMENTO" ${filters.status === 'EM_ANDAMENTO' ? 'selected' : ''}>Em Andamento</option>
          <option value="FECHADA" ${filters.status === 'FECHADA' ? 'selected' : ''}>Fechadas</option>
        </select>
      </div>

      ${renderOrdensTable(filteredOrdens)}
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
                <div style="display: flex; gap: 0.5rem;">
                  <button class="btn btn-secondary btn-sm" onclick="editarOS(${os.id})">
                    Editar
                  </button>
                  <button class="btn btn-secondary btn-sm" onclick="window.gerarPDFOS(${os.id})" title="Imprimir">
                    🖨️
                  </button>
                  <button class="btn btn-info btn-sm" onclick="window.gerarPDFOS(${os.id})" title="Gerar PDF">
                    📄
                  </button>
                  ${AppState.currentUser.cargo === 'ADMIN' ? `
                    <button class="btn btn-danger btn-sm" onclick="confirmarExcluirOS(${os.id}, '${os.numero_os}')">
                      Excluir
                    </button>
                  ` : ''}
                </div>
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
  const search = AppState.filters.maquinas.search;
  const filteredMaquinas = AppState.data.maquinas.filter(maq => {
    return !search ||
      (maq.modelo && maq.modelo.toLowerCase().includes(search.toLowerCase())) ||
      (maq.cliente_nome && maq.cliente_nome.toLowerCase().includes(search.toLowerCase())) ||
      (maq.numero_serie && maq.numero_serie.toLowerCase().includes(search.toLowerCase()));
  });

  return `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Máquinas Cadastradas</h2>
        <button class="btn btn-primary btn-sm" id="nova-maquina-btn">
          + Nova Máquina
        </button>
      </div>

      <div class="filter-bar" style="margin-bottom: 1.5rem;">
        <input 
          type="text" 
          class="form-input" 
          id="filtro-busca-maquinas" 
          placeholder="Buscar por modelo, cliente ou série..." 
          value="${search}"
        />
      </div>

      ${renderMaquinasTable(filteredMaquinas)}
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
            <th>Tipo</th>
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
              <td><span class="badge badge-info" style="font-size: 0.7rem;">${maq.tipo || 'Geral'}</span></td>
              <td><strong>${maq.modelo}</strong></td>
              <td>${maq.numero_serie || '-'}</td>
              <td>${maq.ano_fabricacao || maq.ano || '-'}</td>
              <td>${maq.observacoes || '-'}</td>
              <td>
                <div style="display: flex; gap: 0.5rem;">
                  <button class="btn btn-secondary btn-sm" onclick="showNovaMaquinaModal(${maq.id})">
                    Editar
                  </button>
                  <button class="btn btn-info btn-sm" onclick="showHistoricoMaquina(${maq.id})">
                    Histórico
                  </button>
                </div>
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
  const search = AppState.filters.pecas.search;
  const filteredPecas = AppState.data.pecas.filter(peca => {
    return !search ||
      (peca.codigo && peca.codigo.toLowerCase().includes(search.toLowerCase())) ||
      (peca.nome && peca.nome.toLowerCase().includes(search.toLowerCase())) ||
      (peca.descricao && peca.descricao.toLowerCase().includes(search.toLowerCase()));
  });

  return `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Estoque de Peças</h2>
        <button class="btn btn-primary btn-sm" id="nova-peca-btn">
          + Nova Peça
        </button>
      </div>

      <div class="filter-bar" style="margin-bottom: 1.5rem;">
        <input 
          type="text" 
          class="form-input" 
          id="filtro-busca-pecas" 
          placeholder="Buscar por código ou descrição..." 
          value="${search}"
        />
      </div>

      ${renderPecasTable(filteredPecas)}
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
  const search = AppState.filters.vendas.search;
  const filteredVendas = AppState.data.vendas.filter(v => {
    return !search ||
      (v.numero_venda && v.numero_venda.toString().toLowerCase().includes(search.toLowerCase())) ||
      (v.cliente_nome && v.cliente_nome.toLowerCase().includes(search.toLowerCase())) ||
      (v.vendedor_nome && v.vendedor_nome.toLowerCase().includes(search.toLowerCase()));
  });

  return `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Vendas de Peças</h2>
        <button class="btn btn-primary btn-sm" id="nova-venda-btn">
          + Nova Venda
        </button>
      </div>

      <div class="filter-bar" style="margin-bottom: 1.5rem;">
        <input 
          type="text" 
          class="form-input" 
          id="filtro-busca-vendas" 
          placeholder="Buscar por número, cliente ou vendedor..." 
          value="${search}"
        />
      </div>

      ${renderVendasTable(filteredVendas)}
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
            <th>Ações</th>
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
              <td>
                <div style="display: flex; gap: 0.5rem;">
                  <button class="btn btn-secondary btn-sm" onclick="showVendaDetalhes(${venda.id})">Visualizar</button>
                  ${AppState.currentUser.cargo === 'ADMIN' ? `<button class="btn btn-danger btn-sm" onclick="confirmarExcluirVenda(${venda.id}, '${venda.numero_venda}')">Excluir</button>` : ''}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    `;
}

// ==================== USUÁRIOS ====================
function renderClientes() {
  const search = AppState.filters.clientes.search;
  const filteredClientes = AppState.data.clientes.filter(c => {
    return !search ||
      (c.nome && c.nome.toLowerCase().includes(search.toLowerCase())) ||
      (c.cnpj && c.cnpj.toLowerCase().includes(search.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));
  });

  return `
    <div class="card" >
      <div class="card-header">
        <h2 class="card-title">Clientes</h2>
        <button class="btn btn-primary btn-sm" id="novo-cliente-btn">
          + Novo Cliente
        </button>
      </div>

      <div class="filter-bar" style="margin-bottom: 1.5rem;">
        <input 
          type="text" 
          class="form-input" 
          id="filtro-busca-clientes" 
          placeholder="Buscar por nome, CNPJ ou e-mail..." 
          value="${search}"
        />
      </div>

      ${renderClientesTable(filteredClientes)}
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

function formatAverageTime(hours) {
  if (!hours || hours === 0) return 'N/A';
  if (hours < 1) return '< 1 hora';
  if (hours < 24) return `${Math.round(hours)} horas`;
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return `${days}d ${remainingHours}h`;
}

function getHealthColor(hours) {
  if (!hours || hours === 0) return 'var(--text-muted)';
  if (hours <= 24) return 'var(--success)'; // Até 1 dia
  if (hours <= 72) return 'var(--warning)'; // Até 3 dias
  return 'var(--danger)'; // Mais de 3 dias
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
  attachInputListener('filtro-busca-os', (value) => {
    AppState.filters.ordens.search = value;
    render();
  });

  attachSelectListener('filtro-status-os', (value) => {
    AppState.filters.ordens.status = value;
    render();
  });

  attachInputListener('filtro-busca-maquinas', (value) => {
    AppState.filters.maquinas.search = value;
    render();
  });

  attachInputListener('filtro-busca-pecas', (value) => {
    AppState.filters.pecas.search = value;
    render();
  });

  attachInputListener('filtro-busca-clientes', (value) => {
    AppState.filters.clientes.search = value;
    render();
  });

  attachInputListener('filtro-busca-vendas', (value) => {
    AppState.filters.vendas.search = value;
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
window.loadOrdensServico = loadOrdensServico;
window.showHistoricoMaquina = showHistoricoMaquina;
window.showVendaDetalhes = showVendaDetalhes;
window.confirmarExcluirVenda = confirmarExcluirVenda;
window.imprimirVenda = imprimirVenda;
window.fecharModal = (id) => {
  AppState.modalAberto = false;
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

function attachInputListener(id, handler) {
  const input = document.getElementById(id);
  if (input) {
    input.addEventListener('input', (e) => {
      // Não chamar render() se um modal estiver aberto
      if (AppState.modalAberto) return;
      handler(e.target.value);
    });
  }
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
        <label class="form-label">Tipo *</label>
        <select class="form-input" id="modal-maquina-tipo" required>
          <option value="Geral" ${maquinaData?.tipo === 'Geral' ? 'selected' : ''}>Geral</option>
          <option value="Trator" ${maquinaData?.tipo === 'Trator' ? 'selected' : ''}>Trator</option>
          <option value="Colheitadeira" ${maquinaData?.tipo === 'Colheitadeira' ? 'selected' : ''}>Colheitadeira</option>
          <option value="Escavadeira" ${maquinaData?.tipo === 'Escavadeira' ? 'selected' : ''}>Escavadeira</option>
          <option value="Caminhão" ${maquinaData?.tipo === 'Caminhão' ? 'selected' : ''}>Caminhão</option>
          <option value="Outro" ${maquinaData?.tipo === 'Outro' ? 'selected' : ''}>Outro</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Número de Série</label>
        <input type="text" class="form-input" id="modal-maquina-serie" value="${maquinaData?.numero_serie || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Ano de Fabricação</label>
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
      tipo: document.getElementById('modal-maquina-tipo').value,
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

async function showHistoricoMaquina(maquinaId) {
  const maquina = AppState.data.maquinas.find(m => m.id == maquinaId);
  const result = await window.api.listarOS({ maquina_id: maquinaId });

  if (!result.success) {
    alert('Erro ao carregar histórico: ' + result.message);
    return;
  }

  const ordens = result.ordens;
  const historicoHTML = ordens.length === 0
    ? '<div class="empty-state"><p>Nenhuma manutenção registrada para esta máquina.</p></div>'
    : `
    <div class="table-container">
      <table style="font-size: 0.85rem;">
        <thead>
          <tr>
            <th>OS</th>
            <th>Data</th>
            <th>Mecânico</th>
            <th>Serviço</th>
            <th>Status</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          ${ordens.map(os => `
            <tr>
              <td><strong>${os.numero_os}</strong></td>
              <td>${formatDate(os.data_abertura)}</td>
              <td>${os.mecanico_nome || '-'}</td>
              <td title="${os.descricao_problema}">${os.descricao_problema ? (os.descricao_problema.substring(0, 30) + '...') : '-'}</td>
              <td><span class="badge badge-${os.status === 'FECHADA' ? 'success' : 'warning'}">${os.status}</span></td>
              <td>R$ ${formatMoney(os.valor_total)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    `;

  showModal(`Histórico: ${maquina ? maquina.modelo : 'Máquina'} (Série: ${maquina ? maquina.numero_serie : '-'})`, `
    <div class="historico-modal-content">
      ${historicoHTML}
    </div>
  `, null); // null pois não há botão de salvar, apenas mostrar
}

function showNovaOSModal() {
  AppState.modalAberto = true;
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
  await loadPecas(); // Garantir que o estoque está atualizado
  const clientesOptions = AppState.data.clientes.map(c =>
    `<option value="${c.id}">${c.nome}</option>`
  ).join('');

  const pecasDisponiveis = AppState.data.pecas.filter(p => p.quantidade_estoque > 0);

  let itensVenda = [];

  const atualizarTabelaItens = () => {
    const tbody = document.getElementById('venda-itens-body');
    if (!tbody) return;

    if (itensVenda.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem; color: var(--text-secondary);">Nenhum item adicionado</td></tr>';
    } else {
      tbody.innerHTML = itensVenda.map((item, index) => {
        const peca = AppState.data.pecas.find(p => p.id == item.peca_id);
        return `
          <tr>
            <td>${peca ? peca.nome : 'Peça não encontrada'}</td>
            <td>R$ ${formatMoney(item.preco_unitario)}</td>
            <td>${item.quantidade}</td>
            <td>R$ ${formatMoney(item.quantidade * item.preco_unitario)}</td>
            <td style="text-align: right;">
              <button class="btn btn-danger btn-sm" onclick="window.removerItemVenda(${index})">&times;</button>
            </td>
          </tr>
        `;
      }).join('');
    }

    // Calcular total
    const total = itensVenda.reduce((sum, item) => sum + (item.quantidade * item.preco_unitario), 0);
    const totalInput = document.getElementById('modal-venda-valor');
    if (totalInput) totalInput.value = total.toFixed(2);

    const totalDisplay = document.getElementById('venda-total-display');
    if (totalDisplay) totalDisplay.textContent = `Total: R$ ${formatMoney(total)}`;
  };

  window.removerItemVenda = (index) => {
    itensVenda.splice(index, 1);
    atualizarTabelaItens();
  };

  window.adicionarItemLista = () => {
    const pecaId = document.getElementById('venda-peca-select').value;
    const qtd = parseInt(document.getElementById('venda-peca-qtd').value);
    const preco = parseFloat(document.getElementById('venda-peca-preco').value);

    if (!pecaId || isNaN(qtd) || qtd <= 0 || isNaN(preco)) {
      alert('Por favor, preencha todos os campos do item corretamente.');
      return;
    }

    const peca = AppState.data.pecas.find(p => p.id == pecaId);
    if (qtd > peca.quantidade_estoque) {
      alert(`Quantidade em estoque insuficiente. Disponível: ${peca.quantidade_estoque}`);
      return;
    }

    itensVenda.push({
      peca_id: parseInt(pecaId),
      quantidade: qtd,
      preco_unitario: preco
    });

    // Limpar campos
    document.getElementById('venda-peca-select').value = '';
    document.getElementById('venda-peca-qtd').value = '1';
    document.getElementById('venda-peca-preco').value = '';

    atualizarTabelaItens();
  };

  showModal('Nova Venda de Peças', `
    <div class="form-group">
      <label class="form-label">Cliente *</label>
      <select class="form-input" id="modal-venda-cliente" required>
        <option value="">Selecione o Cliente...</option>
        ${clientesOptions}
      </select>
    </div>

    <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 0.5rem; border: 1px solid var(--border); margin-bottom: 1rem;">
      <h4 style="margin-bottom: 0.5rem; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">Adicionar Itens</h4>
      <div class="form-grid" style="grid-template-columns: 2fr 1fr 1.5fr auto; align-items: flex-end; gap: 0.5rem;">
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Peça</label>
          <select class="form-input" id="venda-peca-select" onchange="const p = AppState.data.pecas.find(x => x.id == this.value); if(p) document.getElementById('venda-peca-preco').value = p.preco_venda;">
            <option value="">Selecionar peça...</option>
            ${pecasDisponiveis.map(p => `<option value="${p.id}">${p.nome} (Estoque: ${p.quantidade_estoque})</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Qtd</label>
          <input type="number" class="form-input" id="venda-peca-qtd" value="1" min="1" />
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Preço Unit.</label>
          <input type="number" step="0.01" class="form-input" id="venda-peca-preco" />
        </div>
        <button type="button" class="btn btn-secondary" onclick="adicionarItemLista()" style="padding: 0.5rem 1rem;">+</button>
      </div>
    </div>

    <div class="table-container" style="max-height: 200px; overflow-y: auto; margin-bottom: 1rem; border: 1px solid var(--border);">
      <table style="font-size: 0.85rem;">
        <thead>
          <tr>
            <th>Peça</th>
            <th>Unit.</th>
            <th>Qtd</th>
            <th>Total</th>
            <th style="width: 40px;"></th>
          </tr>
        </thead>
        <tbody id="venda-itens-body">
          <tr><td colspan="5" style="text-align:center; padding: 2rem; color: var(--text-secondary);">Nenhum item adicionado</td></tr>
        </tbody>
      </table>
    </div>

    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Total da Venda (R$)</label>
        <input type="number" step="0.01" class="form-input" id="modal-venda-valor" readonly style="font-weight: bold; font-size: 1.2rem; background: transparent; border: none; padding: 0;" />
        <div id="venda-total-display" style="font-size: 1.2rem; font-weight: bold; color: var(--primary);">Total: R$ 0,00</div>
      </div>
      <div class="form-group">
        <label class="form-label">Forma de Pagamento</label>
        <select class="form-input" id="modal-venda-pagamento">
          <option value="DINHEIRO">Dinheiro</option>
          <option value="PIX">PIX</option>
          <option value="CARTAO_DEBITO">Cartão de Débito</option>
          <option value="CARTAO_CREDITO">Cartão de Crédito</option>
          <option value="BOLETO">Boleto</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Observações</label>
      <textarea class="form-input" id="modal-venda-obs" placeholder="Detalhes adicionais..."></textarea>
    </div>
  `, async () => {
    const cliente_id = document.getElementById('modal-venda-cliente').value;
    if (!cliente_id) {
      alert('Selecione um cliente.');
      return;
    }

    if (itensVenda.length === 0) {
      alert('Adicione pelo menos um item à venda.');
      return;
    }

    const valor_total = itensVenda.reduce((sum, item) => sum + (item.quantidade * item.preco_unitario), 0);

    const dados = {
      cliente_id,
      vendedor_id: AppState.currentUser.id,
      valor_total: valor_total,
      valor_final: valor_total,
      forma_pagamento: document.getElementById('modal-venda-pagamento').value,
      observacoes: document.getElementById('modal-venda-obs').value,
      itens: itensVenda
    };

    const result = await window.api.criarVenda(dados);
    if (result.success) {
      await loadVendas();
      await loadPecas(); // Recarregar peças para atualizar o estoque na lista
      await loadStats();
      closeModal();
      render();
    } else {
      alert('Erro ao registrar venda: ' + result.message);
    }
  });

  // Exportar funções necessárias para o escopo global do modal
  window.adicionarItemLista = adicionarItemLista;
}

async function showVendaDetalhes(vendaId) {
  const result = await window.api.obterVenda(vendaId);
  if (!result.success) return alert('Erro ao carregar venda: ' + result.message);

  const venda = result.venda;
  const itensHTML = venda.itens.map(item => `
    <tr>
      <td>${item.peca_nome} (${item.peca_codigo})</td>
      <td>${item.quantidade}</td>
      <td>R$ ${formatMoney(item.preco_unitario)}</td>
      <td>R$ ${formatMoney(item.preco_total)}</td>
    </tr>
  `).join('');

  showModal(`Venda: ${venda.numero_venda}`, `
    <div style="display: grid; gap: 1rem;">
      <div class="card" style="background: var(--bg-secondary); margin-bottom: 0;">
        <p><strong>Cliente:</strong> ${venda.cliente_nome}</p>
        <p><strong>Vendedor:</strong> ${venda.vendedor_nome}</p>
        <p><strong>Data:</strong> ${formatDate(venda.data_venda)}</p>
        <p><strong>Forma Pagamento:</strong> ${venda.forma_pagamento}</p>
        <p><strong>Status:</strong> <span class="badge badge-${venda.status === 'PAGO' ? 'success' : 'warning'}">${venda.status}</span></p>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qtd</th>
              <th>Unit.</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itensHTML}
          </tbody>
        </table>
      </div>
      <div style="text-align: right; padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius);">
         <h3 style="margin: 0;">Total: R$ ${formatMoney(venda.valor_total)}</h3>
      </div>
    </div>
  `, null);

  // Adicionar botão de imprimir no footer (o showModal por padrão cria o footer com Cancelar/Fechar)
  // Como showModal agora é sheet-friendly, vamos injetar o botão no footer do modal existente
  const modalFooter = document.querySelector('.modal-footer');
  if (modalFooter) {
    const printBtn = document.createElement('button');
    printBtn.className = 'btn btn-primary';
    printBtn.innerHTML = '🖨️ Imprimir';
    printBtn.style.marginRight = 'auto';
    printBtn.onclick = () => imprimirVenda(venda);
    modalFooter.insertBefore(printBtn, modalFooter.firstChild);
  }
}

async function confirmarExcluirVenda(id, numero) {
  if (confirm(`Deseja realmente excluir a venda ${numero}?\nO estoque das peças será devolvido.`)) {
    const result = await window.api.excluirVenda(id);
    if (result.success) {
      alert('Venda excluída com sucesso.');
      await loadVendas();
      await loadPecas();
      render();
    } else {
      alert('Erro ao excluir: ' + result.message);
    }
  }
}

function imprimirVenda(venda) {
  const printContent = `
    <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 800px; margin: 0 auto; background: white;">
      <div style="text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px;">
        <h1 style="color: #2563eb; margin: 0;">SAMAPE ÍNDIO</h1>
        <p style="margin: 5px 0;">Comprovante de Venda</p>
        <h2 style="margin: 10px 0;">${venda.numero_venda}</h2>
      </div>

      <div style="margin-bottom: 20px;">
        <p><strong>Cliente:</strong> ${venda.cliente_nome}</p>
        <p><strong>Vendedor:</strong> ${venda.vendedor_nome}</p>
        <p><strong>Data:</strong> ${formatDate(venda.data_venda)}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #f3f4f6; text-align: left;">
            <th style="padding: 10px; border: 1px solid #ddd;">Item</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Qtd</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Unit.</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${venda.itens.map(item => `
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">${item.peca_nome}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${item.quantidade}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">R$ ${formatMoney(item.preco_unitario)}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">R$ ${formatMoney(item.preco_total)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="text-align: right; font-size: 1.5rem; font-weight: bold; padding: 20px; background: #f3f4f6; border-radius: 8px;">
        TOTAL: R$ ${formatMoney(venda.valor_total)}
      </div>

      <div style="margin-top: 50px; text-align: center; border-top: 1px solid #ddd; padding-top: 20px; font-size: 0.8rem; color: #666;">
        <p>Obrigado pela preferência!</p>
        <p>SAMAPE Sistema de Gerenciamento de Manutenção</p>
      </div>
    </div>

    <!-- Controles de Impressão -->
    <div id="print-controls" style="position: fixed; bottom: 20px; right: 20px; display: flex; gap: 10px;">
      <button onclick="document.body.removeChild(this.parentNode.parentNode); window.location.reload();" style="padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">Fechar</button>
      <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">🖨️ Imprimir / Salvar PDF</button>
    </div>

    <style>
      @media print {
        #print-controls { display: none; }
        body { background: white !important; }
      }
    </style>
  `;

  // Abrir em uma nova janela ou overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position: fixed; top:0; left:0; width:100%; height:100%; background:white; z-index: 30000; overflow-y: auto;';
  overlay.innerHTML = printContent;
  document.body.appendChild(overlay);
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
        <button class="btn btn-secondary" id="modal-cancel-btn">${onSave ? 'Cancelar' : 'Fechar'}</button>
        ${onSave ? '<button class="btn btn-primary" id="modal-save-btn">Salvar</button>' : ''}
      </div>
    </div>
    `;

  document.body.appendChild(modal);

  document.getElementById('modal-close-btn').addEventListener('click', () => closeModal());
  document.getElementById('modal-cancel-btn').addEventListener('click', () => closeModal());
  if (onSave) {
    document.getElementById('modal-save-btn').addEventListener('click', onSave);
  }

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
  AppState.modalAberto = true;
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
    loadStats(),
    AppState.currentUser.cargo === 'ADMIN' ? loadLogs() : Promise.resolve()
  ]);
}

async function checkUpdates() {
  // Evitar verificar múmultiplas vezes na mesma sessão
  if (sessionStorage.getItem('update_checked')) return;
  sessionStorage.setItem('update_checked', '1');

  try {
    let result;

    // No Android (WebAPI), chama o servidor REST diretamente
    const isElectron = window.api && typeof window.api.baixarArquivo === 'function';
    if (!isElectron) {
      // Mobile / Web: fetch direto à API
      const response = await fetch('https://samape20-estudioio.up.railway.app/api/check-updates');
      result = await response.json();
    } else {
      // Desktop: usa o canal IPC do Electron
      result = await window.api.verificarAtualizacao();
    }

    console.log('🔍 Verificação de atualização:', result);

    if (result && result.success && result.version && result.version !== AppState.version) {
      console.log(`🆕 Nova versão disponível: ${result.version}`);
      showUpdateModal(result);
    } else {
      console.log('✅ Aplicativo atualizado. Versão:', AppState.version);
    }
  } catch (error) {
    console.warn('⚠️ Erro ao verificar atualizações:', error.message);
  }
}

function showUpdateModal(updateInfo) {
  // Evitar múltiplos modais de atualização
  if (document.getElementById('modal-atualizacao')) return;

  const isAndroid = /Android/i.test(navigator.userAgent);
  const isDesktop = !isAndroid && window.api && typeof window.api.baixarArquivo === 'function';

  // URL de download: garante que usa o CDN direto do GitHub (raw.githubusercontent.com)
  let downloadUrl = isAndroid ? updateInfo.downloads.android : updateInfo.downloads.windows;
  // Converter github.com/raw/... → raw.githubusercontent.com/...
  if (downloadUrl && downloadUrl.includes('github.com')) {
    downloadUrl = downloadUrl
      .replace('https://github.com/', 'https://raw.githubusercontent.com/')
      .replace('/raw/', '/');
  }

  const modal = document.createElement('div');
  modal.id = 'modal-atualizacao';
  modal.className = 'modal-overlay';
  modal.style.zIndex = '9999';

  if (isAndroid) {
    // ========== MODAL ANDROID ==========
    // Usa <a href> diretamente — o Android reconhece APK e dispara download nativo
    modal.innerHTML = `
      <div class="modal" style="max-width: 400px; text-align: center; border: 2px solid var(--primary);">
        <div class="modal-header">
          <h2 class="modal-title">🚀 Atualização Disponível!</h2>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: 1rem;">Uma nova versão do <strong>SAMAPEOP</strong> está disponível.</p>
          <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: left;">
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.25rem;">Versão Atual: ${AppState.version}</div>
            <div style="font-size: 1rem; font-weight: bold; color: var(--success);">Nova Versão: ${updateInfo.version}</div>
            <div style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--text-secondary); font-style: italic;">"${updateInfo.notes}"</div>
          </div>

          <div style="background: rgba(37,99,235,0.1); border: 1px solid var(--primary); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; font-size: 0.85rem; color: var(--text-secondary); text-align: left;">
            📲 <strong>Como instalar:</strong><br>
            1. Toque em "Baixar APK"<br>
            2. Aguarde o download terminar<br>
            3. Abra o arquivo baixado<br>
            4. Permita a instalação se solicitado
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <a href="${downloadUrl}" download="SAMAPE_${updateInfo.version}.apk"
               style="display: block; padding: 1rem; background: var(--primary); color: white; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 1rem;">
              ⬇️ Baixar APK (v${updateInfo.version})
            </a>
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('modal-atualizacao').remove()">
              Lembrar mais tarde
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

  } else if (isDesktop) {
    // ========== MODAL DESKTOP ==========
    modal.innerHTML = `
      <div class="modal" style="max-width: 400px; text-align: center; border: 2px solid var(--primary);">
        <div class="modal-header">
          <h2 class="modal-title">🚀 Atualização Disponível!</h2>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: 1rem;">Uma nova versão do <strong>SAMAPEOP</strong> está disponível.</p>
          <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: left;">
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.25rem;">Versão Atual: ${AppState.version}</div>
            <div style="font-size: 1rem; font-weight: bold; color: var(--success);">Nova Versão: ${updateInfo.version}</div>
            <div style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--text-secondary); font-style: italic;">"${updateInfo.notes}"</div>
          </div>

          <div id="download-progress-container" style="display: none; margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.3rem;">
              <span id="download-status-text">Baixando...</span>
              <span id="download-percent">0%</span>
            </div>
            <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
              <div id="download-bar" style="width: 0%; height: 100%; background: var(--primary); transition: width 0.3s ease;"></div>
            </div>
          </div>

          <div id="update-actions" style="display: flex; flex-direction: column; gap: 0.75rem;">
            <button class="btn btn-primary" id="btn-iniciar-download">
              ⬇️ Baixar e Instalar Agora
            </button>
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('modal-atualizacao').remove()">
              Lembrar mais tarde
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const btnDownload = modal.querySelector('#btn-iniciar-download');
    const progressContainer = modal.querySelector('#download-progress-container');
    const updateActions = modal.querySelector('#update-actions');
    const bar = modal.querySelector('#download-bar');
    const percent = modal.querySelector('#download-percent');
    const statusText = modal.querySelector('#download-status-text');

    btnDownload.addEventListener('click', async () => {
      progressContainer.style.display = 'block';
      updateActions.style.display = 'none';
      try {
        window.api.onDownloadProgress((data) => {
          const p = Math.floor(data.progress || 0);
          bar.style.width = `${p}%`;
          percent.innerText = `${p}%`;
          statusText.innerText = `Baixando: ${(data.downloadedBytes / 1024 / 1024).toFixed(1)}MB / ${(data.totalBytes / 1024 / 1024).toFixed(1)}MB`;
        });

        const fileName = `SAMAPEOP_Update_${updateInfo.version}.exe`;
        const result = await window.api.baixarArquivo(downloadUrl, fileName);

        if (result.success) {
          statusText.innerText = 'Download Concluído!';
          statusText.style.color = 'var(--success)';
          bar.style.width = '100%';
          percent.innerText = '100%';
          const installBtn = document.createElement('button');
          installBtn.className = 'btn btn-success';
          installBtn.innerText = '▶️ Instalar e Reiniciar';
          installBtn.style.marginTop = '1rem';
          installBtn.onclick = () => window.api.executarArquivo(result.path);
          progressContainer.appendChild(installBtn);
        }
      } catch (error) {
        console.error('Erro no download:', error);
        statusText.innerText = 'Erro ao baixar. Tente novamente.';
        statusText.style.color = 'var(--danger)';
        setTimeout(() => {
          progressContainer.style.display = 'none';
          updateActions.style.display = 'flex';
        }, 2000);
      }
    });
  }
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

async function loadLogs() {
  if (AppState.currentUser.cargo !== 'ADMIN') return;
  const result = await window.api.listarLogs();
  if (result.success) AppState.data.logs = result.logs;
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

      // Verificar atualizações imediatamente ao abrir o app
      checkUpdates();

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
        const remember = document.getElementById('login-remember')?.checked;
        const result = await window.api.login({ email, senha }, remember);

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

// Função para excluir OS
async function confirmarExcluirOS(id, numero) {
  if (AppState.currentUser.cargo !== 'ADMIN') return alert('Acesso negado');

  if (confirm(`Tem certeza que deseja excluir a Ordem de Serviço ${numero}? Esta ação não pode ser desfeita.`)) {
    try {
      const result = await window.api.excluirOS(id);
      if (result.success) {
        alert('Ordem de serviço excluída com sucesso!');
        await loadOrdens(); // Recarregar dados
        render(); // Re-renderizar interface
      } else {
        alert('Erro ao excluir: ' + result.message);
      }
    } catch (error) {
      console.error('Erro na exclusão:', error);
      alert('Erro de conexão ao excluir ordem');
    }
  }
}
