// Estado global da aplicação
const AppState = {
  version: '1.2.1', // Versão Oficial 1.2.1
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
    listagens: [],
    logs: [],
    stats: {}
  },
  filters: {
    ordens: { search: '', status: '' },
    maquinas: { search: '' },
    pecas: { search: '' },
    clientes: { search: '' },
    vendas: { search: '' },
    listagens: { search: '' }
  }
};

// Definição de permissões por cargo
const PERMISSIONS = {
  ADMIN: ['*'], // Acesso total
  DIRETOR: ['dashboard', 'relatorios', 'financeiro', 'operacional', 'vendas', 'clientes', 'preventivas'],
  FINANCEIRO: ['dashboard', 'financeiro', 'clientes', 'relatorios-financeiros'],
  VENDAS: ['dashboard', 'vendas', 'pecas', 'clientes', 'estoque', 'listagens-pecas'],
  MECANICO: ['dashboard', 'operacional', 'ordens-servico', 'maquinas', 'listagens-pecas', 'preventivas']
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
      ${renderMobileSidebar()}
      <div class="main-content">
        ${renderTopbar()}
        <div class="content-area" id="content-area">
          ${renderPage()}
        </div>
      </div>
    </div>
  `;
}

window.toggleMobileSidebar = function (open) {
  const sidebar = document.getElementById('mobile-sidebar');
  const overlay = document.getElementById('mobile-sidebar-overlay');
  if (!sidebar || !overlay) return;

  const shouldOpen = open !== undefined ? open : !sidebar.classList.contains('open');
  if (shouldOpen) {
    sidebar.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  } else {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
};

function renderMobileSidebar() {
  const userName = AppState.currentUser ? (AppState.currentUser.nome || 'Usuário') : 'Usuário';
  const roleLabels = {
    ADMIN: 'Administrador',
    DIRETOR: 'Diretor',
    FINANCEIRO: 'Financeiro',
    VENDAS: 'Vendas',
    MECANICO: 'Mecânico'
  };
  const userRole = AppState.currentUser ? (roleLabels[AppState.currentUser.perfil] || AppState.currentUser.perfil || 'Usuário') : 'Usuário';
  const initials = userName.split(' ').filter(n => n).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

  return `
    <div id="mobile-sidebar-overlay" class="mobile-sidebar-overlay" onclick="toggleMobileSidebar(false)"></div>
    <aside id="mobile-sidebar" class="mobile-sidebar">
      <div class="mobile-sidebar-header">
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <img src="resources/logonova2.png" alt="SAMAPE" style="height: 32px; width: auto;" />
          <div style="display: flex; flex-direction: column; line-height: 1.1;">
            <span style="font-weight: 800; font-size: 0.95rem; color: white;">SAMAPE</span>
            <span style="font-size: 0.7rem; color: var(--primary-light); font-weight: 600;">Operacional</span>
          </div>
        </div>
        <button id="close-mobile-sidebar" class="mobile-sidebar-close" onclick="toggleMobileSidebar(false)" title="Fechar Menu">✕</button>
      </div>

      <div class="mobile-sidebar-user">
        <div class="user-avatar-sm" style="width: 40px; height: 40px; font-size: 0.95rem; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: 700; flex-shrink: 0;">
          ${initials}
        </div>
        <div class="mobile-user-info">
          <strong style="color: var(--text-primary); font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${userName}</strong>
          <span style="color: var(--text-muted); font-size: 0.75rem;">${userRole}</span>
        </div>
      </div>

      <nav class="mobile-sidebar-nav">
        <div class="mobile-nav-title">MÓDULO OPERACIONAL</div>

        <button class="mobile-nav-item nav-item ${AppState.currentPage === 'dashboard' ? 'active' : ''}" data-page="dashboard" onclick="toggleMobileSidebar(false)">
          <span class="mobile-nav-icon">🏠</span>
          <div class="mobile-nav-text">
            <span class="mobile-nav-label">Início Operacional</span>
            <span class="mobile-nav-desc">Acesso rápido e ações principais</span>
          </div>
        </button>

        <button class="mobile-nav-item nav-item ${AppState.currentPage === 'ordens-servico' ? 'active' : ''}" data-page="ordens-servico" onclick="toggleMobileSidebar(false)">
          <span class="mobile-nav-icon">🔧</span>
          <div class="mobile-nav-text">
            <span class="mobile-nav-label">Ordens de Serviço</span>
            <span class="mobile-nav-desc">Consultar e gerenciar OS</span>
          </div>
        </button>

        ${hasPermission('listagens-pecas') ? `
          <button class="mobile-nav-item nav-item ${AppState.currentPage === 'listagens-pecas' ? 'active' : ''}" data-page="listagens-pecas" onclick="toggleMobileSidebar(false)">
            <span class="mobile-nav-icon">📝</span>
            <div class="mobile-nav-text">
              <span class="mobile-nav-label">Listagem de Peças</span>
              <span class="mobile-nav-desc">Requisições e relatórios</span>
            </div>
          </button>
        ` : ''}

        <button class="mobile-nav-item nav-item ${AppState.currentPage === 'maquinas' ? 'active' : ''}" data-page="maquinas" onclick="toggleMobileSidebar(false)">
          <span class="mobile-nav-icon">🚜</span>
          <div class="mobile-nav-text">
            <span class="mobile-nav-label">Máquinas & Frota</span>
            <span class="mobile-nav-desc">Cadastro e horímetros</span>
          </div>
        </button>

        <button class="mobile-nav-item nav-item ${AppState.currentPage === 'preventivas' ? 'active' : ''}" data-page="preventivas" onclick="toggleMobileSidebar(false)">
          <span class="mobile-nav-icon">📅</span>
          <div class="mobile-nav-text">
            <span class="mobile-nav-label">Preventivas Preditivas</span>
            <span class="mobile-nav-desc">Previsões, alertas e revisões</span>
          </div>
        </button>
      </nav>

      <div class="mobile-sidebar-footer">
        <button class="mobile-btn-logout" id="logout-btn-mobile">
          <span>🚪</span>
          <span>Sair do Sistema</span>
        </button>
      </div>
    </aside>
  `;
}

function renderSidebar() {
  return '';
}

function toggleSection(section) {
  // Mantido para compatibilidade
}

function renderTopbar() {
  const userName = AppState.currentUser ? (AppState.currentUser.nome || 'Usuário') : 'Usuário';
  const roleLabels = {
    ADMIN: 'Administrador',
    DIRETOR: 'Diretor',
    FINANCEIRO: 'Financeiro',
    VENDAS: 'Vendas',
    MECANICO: 'Mecânico'
  };
  const userRole = AppState.currentUser ? (roleLabels[AppState.currentUser.perfil] || AppState.currentUser.perfil || 'Usuário') : 'Usuário';
  const initials = userName.split(' ').filter(n => n).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

  const isOpActive = ['ordens-servico', 'listagens-pecas', 'maquinas', 'preventivas'].includes(AppState.currentPage);
  const isVendasActive = ['vendas', 'pecas'].includes(AppState.currentPage);
  const isCadastrosActive = ['clientes'].includes(AppState.currentPage);
  const isSistemaActive = ['usuarios'].includes(AppState.currentPage);

  return `
    <div class="topbar">
      <div class="topbar-left">
        <!-- Botão hambúrguer exclusivo de mobile/tablet -->
        <button id="mobile-menu-trigger" class="mobile-menu-btn" onclick="toggleMobileSidebar(true)" title="Menu Operacional">
          <span>☰</span>
        </button>

        <div class="logo-container-small" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;" onclick="AppState.currentPage = 'dashboard'; render();" title="Ir para o Dashboard">
          <img src="resources/logonova2.png" alt="SAMAPE" style="height: 38px; width: auto;" />
        </div>

        <nav class="top-nav-bar" id="top-nav-bar">
          <!-- Dashboard -->
          ${hasPermission('dashboard') ? `
            <button class="top-nav-item nav-item ${AppState.currentPage === 'dashboard' ? 'active' : ''}" data-page="dashboard">
              <span>📊</span>
              <span>Dashboard</span>
            </button>
          ` : ''}

          <!-- Operacional -->
          ${(hasPermission('operacional') || hasPermission('listagens-pecas')) ? `
            <div class="top-nav-dropdown ${isOpActive ? 'active' : ''}">
              <button class="top-nav-btn" type="button">
                <span>🔧</span>
                <span>Operacional</span>
                <span class="top-nav-arrow">▼</span>
              </button>
              <div class="top-nav-menu">
                ${hasPermission('operacional') ? `
                  <div class="top-nav-subitem nav-item ${AppState.currentPage === 'ordens-servico' ? 'active' : ''}" data-page="ordens-servico">
                    <span>🔧</span>
                    <span>Ordens de Serviço</span>
                  </div>
                ` : ''}
                ${hasPermission('listagens-pecas') ? `
                  <div class="top-nav-subitem nav-item ${AppState.currentPage === 'listagens-pecas' ? 'active' : ''}" data-page="listagens-pecas">
                    <span>📝</span>
                    <span>Listagem de Peças</span>
                  </div>
                ` : ''}
                ${hasPermission('operacional') ? `
                  <div class="top-nav-subitem nav-item ${AppState.currentPage === 'maquinas' ? 'active' : ''}" data-page="maquinas">
                    <span>🚜</span>
                    <span>Máquinas</span>
                  </div>
                  <div class="top-nav-subitem nav-item ${AppState.currentPage === 'preventivas' ? 'active' : ''}" data-page="preventivas">
                    <span>📅</span>
                    <span>Preventivas</span>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Vendas e Estoque -->
          ${(hasPermission('vendas') || hasPermission('pecas')) ? `
            <div class="top-nav-dropdown ${isVendasActive ? 'active' : ''}">
              <button class="top-nav-btn" type="button">
                <span>🛒</span>
                <span>Vendas e Estoque</span>
                <span class="top-nav-arrow">▼</span>
              </button>
              <div class="top-nav-menu">
                ${hasPermission('vendas') ? `
                  <div class="top-nav-subitem nav-item ${AppState.currentPage === 'vendas' ? 'active' : ''}" data-page="vendas">
                    <span>🛒</span>
                    <span>Vendas de Peças</span>
                  </div>
                ` : ''}
                ${hasPermission('pecas') ? `
                  <div class="top-nav-subitem nav-item ${AppState.currentPage === 'pecas' ? 'active' : ''}" data-page="pecas">
                    <span>📦</span>
                    <span>Estoque de Peças</span>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Cadastros -->
          ${hasPermission('clientes') ? `
            <div class="top-nav-dropdown ${isCadastrosActive ? 'active' : ''}">
              <button class="top-nav-btn" type="button">
                <span>👥</span>
                <span>Cadastros</span>
                <span class="top-nav-arrow">▼</span>
              </button>
              <div class="top-nav-menu">
                <div class="top-nav-subitem nav-item ${AppState.currentPage === 'clientes' ? 'active' : ''}" data-page="clientes">
                  <span>👥</span>
                  <span>Clientes</span>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Sistema -->
          ${(hasPermission('*') || hasPermission('financeiro')) ? `
            <div class="top-nav-dropdown ${isSistemaActive ? 'active' : ''}">
              <button class="top-nav-btn" type="button">
                <span>⚙️</span>
                <span>Sistema</span>
                <span class="top-nav-arrow">▼</span>
              </button>
              <div class="top-nav-menu">
                ${hasPermission('*') ? `
                  <div class="top-nav-subitem nav-item ${AppState.currentPage === 'usuarios' ? 'active' : ''}" data-page="usuarios">
                    <span>👤</span>
                    <span>Usuários</span>
                  </div>
                ` : ''}
                <a href="https://finansamape-samape20.up.railway.app" target="_blank" rel="noopener noreferrer" class="top-nav-subitem" style="text-decoration: none; color: inherit;" onclick="document.querySelectorAll('.top-nav-dropdown.open').forEach(d => d.classList.remove('open'));" title="Abrir Sistema Financeiro">
                  <span>💰</span>
                  <span>Financeiro</span>
                  <span style="font-size: 0.75rem; margin-left: auto; opacity: 0.7;">↗</span>
                </a>
              </div>
            </div>
          ` : ''}
        </nav>
      </div>

      <div class="topbar-right">
        <!-- Botão Rápido Nova OS no topo para Mobile/Tablet -->
        <button class="btn btn-sm btn-primary mobile-topbar-nova-os" onclick="showNovaOSModal()" title="Criar Nova OS" style="display: none;">
          <span>+ Nova OS</span>
        </button>

        <div class="topbar-user-badge" onclick="if (window.innerWidth <= 1024) toggleMobileSidebar(true);" style="cursor: pointer;">
          <div class="user-avatar-sm" style="width: 32px; height: 32px; font-size: 0.8rem; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: 700;">
            ${initials}
          </div>
          <div class="topbar-user-info">
            <span class="topbar-user-name">${userName}</span>
            <span class="topbar-user-role">${userRole}</span>
          </div>
        </div>

        <button class="btn btn-sm btn-outline-danger" id="logout-btn" title="Sair do sistema" style="display: flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.8rem; border-radius: var(--radius); font-weight: 600; cursor: pointer;">
          <span>Sair</span>
          <span>🚪</span>
        </button>

        <span class="desktop-only" style="font-size: 0.7rem; color: var(--text-muted); padding: 0.25rem 0.5rem; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 4px;">
          v${AppState.version}
        </span>
      </div>
    </div>
  `;
}

function renderPage() {
  const isMobile = window.innerWidth <= 1024;
  if (isMobile && !['dashboard', 'ordens-servico', 'listagens-pecas', 'maquinas', 'preventivas'].includes(AppState.currentPage)) {
    AppState.currentPage = 'dashboard';
  }

  switch (AppState.currentPage) {
    case 'dashboard': return renderDashboard();
    case 'ordens-servico': return renderOrdensServico();
    case 'listagens-pecas': return renderListagensPecas();
    case 'maquinas': return renderMaquinas();
    case 'preventivas': return renderPreventivas();
    case 'vendas': return renderVendas();
    case 'pecas': return renderPecas();
    case 'contas-receber': return renderContasReceber();
    case 'contas-pagar': return renderContasPagar();
    case 'clientes': return renderClientes();
    case 'usuarios': return renderUsuarios();
    default: return '<div class="card"><p>Página não encontrada</p></div>';
  }
}

// ==================== LISTAGEM DE PEÇAS (MÓDULO OPERACIONAL) ====================
function renderListagensPecas() {
  const listagens = AppState.data.listagens || [];
  const search = AppState.filters.listagens.search.toLowerCase();

  const filtered = listagens.filter(l =>
    l.numero_lista.toLowerCase().includes(search) ||
    (l.cliente_nome && l.cliente_nome.toLowerCase().includes(search))
  );

  return `
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">📝 Listagens de Peças</h2>
        <p class="page-description">Gerencie listagens e orçamentos de peças independentes ou vinculados a OS.</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" onclick="mostrarModalListagemPecas()">+ Nova Listagem</button>
      </div>
    </div>

    <div class="card">
      <div class="filters-bar">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input type="text" class="form-input search-input" placeholder="Buscar por número ou cliente..." 
            value="${AppState.filters.listagens.search}" 
            oninput="AppState.filters.listagens.search = this.value; render();">
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Número</th>
              <th>Data</th>
              <th>Cliente</th>
              <th>Máquina</th>
              <th>Valor Total</th>
              <th>Status</th>
              <th style="width: 80px;">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length === 0 ? '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">Nenhuma listagem encontrada</td></tr>' :
      filtered.map(l => `
                <tr>
                  <td><strong style="color: var(--primary);">${l.numero_lista}</strong></td>
                  <td><div style="font-size: 0.85rem;">${formatDate(l.created_at)}</div></td>
                  <td><div>${l.cliente_nome || '-'}</div></td>
                  <td><div>${l.maquina_modelo || '-'}</div></td>
                  <td><div style="font-weight: 700; color: var(--success);">R$ ${formatMoney(l.valor_total)}</div></td>
                  <td><span class="badge ${l.status === 'ABERTA' ? 'badge-primary' : (l.status === 'VINCULADA' ? 'badge-info' : 'badge-secondary')}">${l.status}</span></td>
                  <td>
                    ${renderActionMenu(`lp-${l.id}`, [
        { label: 'Editar / Itens', icon: '✏️', onclick: `mostrarModalListagemPecas(${l.id})` },
        { label: 'Imprimir', icon: '🖨️', onclick: `gerarPDFListagem(${l.id})` },
        { label: 'Excluir', icon: '🗑️', onclick: `confirmarExcluirListagem(${l.id}, '${l.numero_lista}')`, class: 'danger', show: AppState.currentUser.cargo === 'ADMIN' || AppState.currentUser.cargo === 'DIRETOR' }
      ], '⋮')}
                  </td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function confirmarExcluirListagem(id, numero) {
  if (AppState.currentUser.cargo !== 'ADMIN' && AppState.currentUser.cargo !== 'DIRETOR') return alert('Acesso negado');
  if (confirm(`Excluir listagem ${numero}?`)) {
    const res = await window.api.excluirListagemPecas(id);
    if (res.success) {
      await loadListagensPecas();
      render();
    }
  }
}
// ==================== DASHBOARD & RANKINGS ====================
window._horimetroFilter = window._horimetroFilter || 'TODAS';

window.abrirOSPreventivaParaMaquina = (maquinaId, clienteId, proximaRevisao, horimetroAtual) => {
  showNovaOSModal({
    cliente_id: clienteId,
    maquina_id: maquinaId,
    horimetro: horimetroAtual ? `${horimetroAtual} h` : '',
    descricao_problema: `Revisão Preventiva de ${proximaRevisao}h`,
    diagnostico: `Manutenção preventiva programada de ${proximaRevisao} horas (troca de filtros, óleos lubrificantes e checagem de sistemas).`
  });
};

window.showAtualizarHorimetroRapidoModal = (maquinaId, modelo, horimetroAtual) => {
  showModal(`Atualizar Horímetro: ${modelo}`, `
    <div class="form-group">
      <label class="form-label">Horímetro Atual (Horas de Trabalho)</label>
      <input type="number" step="0.1" class="form-input" id="quick-horimetro-input" value="${horimetroAtual || ''}" placeholder="Ex: 1520" autofocus />
      <small style="color: var(--text-muted); display: block; margin-top: 0.35rem;">
        Insira a leitura atual do horímetro da máquina para recalcular as revisões preventivas da frota.
      </small>
    </div>
  `, async () => {
    const val = parseFloat(document.getElementById('quick-horimetro-input')?.value);
    if (isNaN(val) || val < 0) {
      alert('Por favor, informe um valor de horímetro válido.');
      return;
    }
    const res = await window.api.atualizarHorimetroMaquina(maquinaId, val);
    if (res.success) {
      await loadMaquinas();
      closeModal();
      render();
    } else {
      alert('Erro ao atualizar horímetro: ' + (res.message || 'Erro desconhecido'));
    }
  });
};

function renderRankingMecanicosCard() {
  const ordens = AppState.data.ordens || [];
  const usuarios = AppState.data.usuarios || [];

  const mecanicosMap = {};

  // Incluir mecânicos do sistema
  usuarios.forEach(u => {
    if (u.cargo === 'MECANICO' || u.cargo === 'ADMIN') {
      mecanicosMap[u.id] = {
        id: u.id,
        nome: u.nome,
        total: 0,
        fechadas: 0,
        em_andamento: 0
      };
    }
  });

  ordens.forEach(os => {
    if (os.status === 'CANCELADA') return;
    const mecId = os.mecanico_id;
    if (mecId) {
      if (!mecanicosMap[mecId]) {
        mecanicosMap[mecId] = {
          id: mecId,
          nome: os.mecanico_nome || 'Mecânico #' + mecId,
          total: 0,
          fechadas: 0,
          em_andamento: 0
        };
      }
      mecanicosMap[mecId].total++;
      if (os.status === 'FECHADA') mecanicosMap[mecId].fechadas++;
      else mecanicosMap[mecId].em_andamento++;
    }
  });

  const list = Object.values(mecanicosMap).sort((a, b) => b.total - a.total);
  const maxTotal = list.length > 0 && list[0].total > 0 ? list[0].total : 1;
  const podium = ['🥇', '🥈', '🥉'];
  const avatarColors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#6366f1'];

  return `
    <div class="card" style="height: 100%; display: flex; flex-direction: column;">
      <div class="card-header">
        <h2 class="card-title" style="display: flex; align-items: center; gap: 0.5rem;">
          <span>👨‍🔧</span> Ranking de Manutenção por Mecânico
        </h2>
        <span class="badge badge-primary" style="font-size: 0.75rem;">${list.filter(m => m.total > 0).length} Com OS</span>
      </div>

      <div class="ranking-list" style="flex: 1; overflow-y: auto; max-height: 380px;">
        ${list.length === 0 || list.every(m => m.total === 0) ? `
          <div class="empty-state" style="padding: 2.5rem 1rem;">
            <div class="empty-state-icon">👨‍🔧</div>
            <div class="empty-state-title">Nenhum serviço registrado</div>
            <div class="empty-state-description">Atribua mecânicos às Ordens de Serviço para gerar o ranking.</div>
          </div>
        ` : list.map((mec, index) => {
          const initials = mec.nome.split(' ').filter(n => n).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'M';
          const pct = Math.round((mec.total / maxTotal) * 100);
          const icon = podium[index] || `<span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 700;">#${index + 1}</span>`;
          const avatarColor = avatarColors[index % avatarColors.length];

          return `
            <div class="ranking-item">
              <div class="podium-icon">${icon}</div>
              <div class="ranking-avatar" style="background: ${avatarColor};">
                ${initials}
              </div>
              <div class="ranking-details">
                <div class="ranking-name" title="${mec.nome}">${mec.nome}</div>
                <div class="ranking-sub">
                  <span style="color: var(--success); font-weight: 600;">✓ ${mec.fechadas} finalizadas</span>
                  <span>•</span>
                  <span style="color: var(--warning); font-weight: 600;">⚡ ${mec.em_andamento} em aberto</span>
                </div>
                <div class="ranking-bar-bg">
                  <div class="ranking-bar-fill" style="width: ${pct}%; background: ${avatarColor};"></div>
                </div>
              </div>
              <div class="ranking-count-badge">
                <div style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">${mec.total}</div>
                <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500;">OS Total</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderRankingEmpresasCard() {
  const ordens = AppState.data.ordens || [];
  const clientes = AppState.data.clientes || [];

  const empresasMap = {};
  clientes.forEach(c => {
    empresasMap[c.id] = {
      id: c.id,
      nome: c.nome,
      total_os: 0,
      abertas: 0,
      fechadas: 0,
      valor_total: 0
    };
  });

  ordens.forEach(os => {
    if (os.status === 'CANCELADA') return;
    const cId = os.cliente_id;
    if (!cId) return;

    if (!empresasMap[cId]) {
      empresasMap[cId] = {
        id: cId,
        nome: os.cliente_nome || 'Cliente #' + cId,
        total_os: 0,
        abertas: 0,
        fechadas: 0,
        valor_total: 0
      };
    }

    empresasMap[cId].total_os++;
    if (os.status === 'FECHADA') empresasMap[cId].fechadas++;
    else empresasMap[cId].abertas++;
    empresasMap[cId].valor_total += parseFloat(os.valor_total || 0);
  });

  const list = Object.values(empresasMap)
    .filter(e => e.total_os > 0)
    .sort((a, b) => b.total_os - a.total_os);

  const top5 = list.slice(0, 5);
  const maxTotal = top5.length > 0 ? top5[0].total_os : 1;
  const podium = ['🥇', '🥈', '🥉'];
  const avatarColors = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777'];

  return `
    <div class="card" style="height: 100%; display: flex; flex-direction: column;">
      <div class="card-header">
        <h2 class="card-title" style="display: flex; align-items: center; gap: 0.5rem;">
          <span>🏢</span> Ranking de Empresas com Maior Fluxo de Manutenção (Top 5)
        </h2>
        <span class="badge badge-secondary" style="font-size: 0.75rem;">Top 5 Empresas</span>
      </div>

      <div class="ranking-list" style="flex: 1; overflow-y: auto; max-height: 400px;">
        ${top5.length === 0 ? `
          <div class="empty-state" style="padding: 2.5rem 1rem;">
            <div class="empty-state-icon">🏢</div>
            <div class="empty-state-title">Nenhum fluxo registrado</div>
            <div class="empty-state-description">Abra ordens de serviço vinculadas a clientes para gerar o ranking.</div>
          </div>
        ` : top5.map((emp, index) => {
          const initials = emp.nome.split(' ').filter(n => n).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'E';
          const pct = Math.round((emp.total_os / maxTotal) * 100);
          const icon = podium[index] || `<span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 700;">#${index + 1}</span>`;
          const avatarColor = avatarColors[index % avatarColors.length];

          return `
            <div class="ranking-item" style="cursor: pointer;" onclick="AppState.filters.ordens.search = '${emp.nome.replace(/'/g, "\\'")}'; AppState.currentPage = 'ordens-servico'; render();" title="Clique para filtrar as OS desta empresa">
              <div class="podium-icon">${icon}</div>
              <div class="ranking-avatar" style="background: ${avatarColor};">
                ${initials}
              </div>
              <div class="ranking-details">
                <div class="ranking-name" title="${emp.nome}">${emp.nome}</div>
                <div class="ranking-sub">
                  <span style="color: var(--success); font-weight: 600;">${emp.fechadas} finalizadas</span>
                  <span>•</span>
                  <span style="color: var(--warning); font-weight: 600;">${emp.abertas} ativas</span>
                  ${emp.valor_total > 0 ? `<span>•</span><span style="font-weight: 600; color: var(--text-primary);">R$ ${formatMoney(emp.valor_total)}</span>` : ''}
                </div>
                <div class="ranking-bar-bg">
                  <div class="ranking-bar-fill" style="width: ${pct}%; background: ${avatarColor};"></div>
                </div>
              </div>
              <div class="ranking-count-badge">
                <div style="font-size: 1.15rem; font-weight: 700; color: var(--primary-light);">${emp.total_os}</div>
                <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500;">Manutenções</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderControleHorimetrosCard() {
  const maquinas = AppState.data.maquinas || [];
  const intervaloPadrao = 250; // Revisão preventiva a cada 250h

  // Calcular métricas de horímetro e revisão preventiva por máquina
  const maquinasCalculadas = maquinas.map(m => {
    const horimetroAtual = parseFloat(m.horas_uso || 0);
    const proximaRevisao = horimetroAtual <= 0 ? 250 : Math.ceil((horimetroAtual + 0.1) / intervaloPadrao) * intervaloPadrao;
    const horasRestantes = proximaRevisao - horimetroAtual;
    const progressoIntervalo = Math.min(100, Math.max(0, Math.round(((intervaloPadrao - horasRestantes) / intervaloPadrao) * 100)));

    let status = 'EM_DIA';
    let statusLabel = 'Em dia';
    let statusBadge = 'badge-success';
    let barColor = 'var(--success)';

    if (horasRestantes <= 0) {
      status = 'VENCIDA';
      statusLabel = 'Revisão Vencida!';
      statusBadge = 'badge-danger';
      barColor = 'var(--danger)';
    } else if (horasRestantes <= 40) {
      status = 'PROXIMA';
      statusLabel = 'Próxima da Revisão';
      statusBadge = 'badge-warning';
      barColor = 'var(--warning)';
    }

    return {
      ...m,
      horimetroAtual,
      proximaRevisao,
      horasRestantes,
      progressoIntervalo,
      status,
      statusLabel,
      statusBadge,
      barColor
    };
  });

  // Ordenar priorizando as que mais necessitam de revisão preventiva
  maquinasCalculadas.sort((a, b) => a.horasRestantes - b.horasRestantes);

  const totalVencidas = maquinasCalculadas.filter(m => m.status === 'VENCIDA').length;
  const totalProximas = maquinasCalculadas.filter(m => m.status === 'PROXIMA').length;
  const totalEmDia = maquinasCalculadas.filter(m => m.status === 'EM_DIA').length;

  const currentFilter = window._horimetroFilter;
  const filtradas = maquinasCalculadas.filter(m => {
    if (currentFilter === 'ATENCAO') return m.status === 'VENCIDA' || m.status === 'PROXIMA';
    if (currentFilter === 'EM_DIA') return m.status === 'EM_DIA';
    return true; // TODAS
  });

  return `
    <div class="card" style="margin-top: 1.5rem;">
      <div class="card-header" style="flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <h2 class="card-title" style="display: flex; align-items: center; gap: 0.5rem;">
            <span>⏱️</span> Controle de Horímetros & Previsão de Manutenções Futuras
          </h2>
          <small style="color: var(--text-muted); font-size: 0.8rem;">
            Gestão de horímetro por máquina com ciclos preventivos a cada 250 horas
          </small>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <span class="badge ${totalVencidas > 0 ? 'badge-danger' : 'badge-secondary'}" style="font-weight: 600;">
            🔴 ${totalVencidas} Vencidas
          </span>
          <span class="badge ${totalProximas > 0 ? 'badge-warning' : 'badge-secondary'}" style="font-weight: 600;">
            🟡 ${totalProximas} Próximas (&le;40h)
          </span>
          <span class="badge badge-success" style="font-weight: 600;">
            🟢 ${totalEmDia} Em Dia
          </span>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
        <div class="horimetro-filter-bar" style="margin-bottom: 0;">
          <button class="horimetro-filter-btn ${currentFilter === 'TODAS' ? 'active' : ''}" onclick="window._horimetroFilter = 'TODAS'; render();">
            Todas as Máquinas (${maquinasCalculadas.length})
          </button>
          <button class="horimetro-filter-btn ${currentFilter === 'ATENCAO' ? 'active' : ''}" onclick="window._horimetroFilter = 'ATENCAO'; render();">
            ⚠️ Requerem Atenção (${totalVencidas + totalProximas})
          </button>
          <button class="horimetro-filter-btn ${currentFilter === 'EM_DIA' ? 'active' : ''}" onclick="window._horimetroFilter = 'EM_DIA'; render();">
            ✅ Em Dia (${totalEmDia})
          </button>
        </div>

        <button class="btn btn-secondary btn-sm" onclick="AppState.currentPage = 'maquinas'; render();" style="font-size: 0.8rem;">
          Ir para Máquinas →
        </button>
      </div>

      <div class="table-container horimetro-table-container">
        <table>
          <thead>
            <tr>
              <th>Frota / Máquina</th>
              <th>Cliente</th>
              <th>Horímetro Atual</th>
              <th>Meta Próx. Revisão</th>
              <th>Previsão / Faltam</th>
              <th>Status Preventivo</th>
              <th style="text-align: right;">Ações Rápidas</th>
            </tr>
          </thead>
          <tbody>
            ${filtradas.length === 0 ? `
              <tr>
                <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                  Nenhuma máquina encontrada neste filtro de manutenção.
                </td>
              </tr>
            ` : filtradas.map(m => `
              <tr>
                <td>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    ${m.id_frota ? `<span style="font-weight: 700; color: var(--primary-light); background: rgba(37,99,235,0.15); padding: 0.15rem 0.45rem; border-radius: 4px; font-size: 0.75rem;">${m.id_frota}</span>` : ''}
                    <div>
                      <div style="font-weight: 600; color: var(--text-primary);">${m.modelo}</div>
                      <span class="badge badge-info" style="font-size: 0.65rem; padding: 0.1rem 0.35rem;">${m.tipo || 'Geral'}</span>
                    </div>
                  </div>
                </td>
                <td title="${m.cliente_nome || '-'}">
                  <strong>${m.cliente_nome ? (m.cliente_nome.length > 22 ? m.cliente_nome.substring(0, 22) + '...' : m.cliente_nome) : '-'}</strong>
                </td>
                <td>
                  <div style="display: inline-flex; align-items: center; gap: 0.4rem;">
                    <span style="font-family: monospace; font-size: 0.92rem; font-weight: 700; color: var(--text-primary);">
                      ⏱️ ${m.horimetroAtual.toLocaleString('pt-BR')} h
                    </span>
                    <button class="btn btn-secondary btn-sm" onclick="showAtualizarHorimetroRapidoModal(${m.id}, '${m.modelo.replace(/'/g, "\\'")}', ${m.horimetroAtual})" title="Atualizar leitura do horímetro" style="padding: 0.15rem 0.4rem; font-size: 0.75rem;">
                      ✏️
                    </button>
                  </div>
                </td>
                <td>
                  <span style="font-weight: 600; color: var(--text-secondary);">${m.proximaRevisao.toLocaleString('pt-BR')} h</span>
                </td>
                <td>
                  <div class="horimetro-progress-container">
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 600;">
                      <span style="color: ${m.barColor};">
                        ${m.horasRestantes <= 0 ? `Venceu há ${Math.abs(m.horasRestantes)}h` : `Faltam ${m.horasRestantes}h`}
                      </span>
                      <span style="color: var(--text-muted);">${m.progressoIntervalo}%</span>
                    </div>
                    <div class="horimetro-progress-bar">
                      <div class="horimetro-progress-fill" style="width: ${m.progressoIntervalo}%; background: ${m.barColor};"></div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="badge ${m.statusBadge}" style="font-size: 0.72rem; padding: 0.25rem 0.6rem; font-weight: 600;">
                    ${m.statusLabel}
                  </span>
                </td>
                <td style="text-align: right; white-space: nowrap;">
                  <button class="btn btn-primary btn-sm" onclick="abrirOSPreventivaParaMaquina(${m.id}, ${m.cliente_id || 'null'}, ${m.proximaRevisao}, ${m.horimetroAtual})" style="font-size: 0.75rem; padding: 0.3rem 0.6rem;">
                    + Abrir OS Preventiva
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderMobileDashboard() {
  const stats = AppState.data.stats || {};
  const firstName = AppState.currentUser?.nome ? AppState.currentUser.nome.split(' ')[0] : 'Usuário';

  return `
    <div class="mobile-hero-card">
      <div class="mobile-hero-badge">🔧 SAMAPE OPERACIONAL</div>
      <h2 class="mobile-hero-title">Olá, ${firstName}!</h2>
      <p class="mobile-hero-subtitle">Selecione uma opção rápida para iniciar:</p>
    </div>

    <div class="mobile-giant-actions">
      <!-- Botão Bem Grande 1: Nova OS -->
      <button class="btn-giant-mobile btn-giant-primary" onclick="showNovaOSModal()">
        <div class="btn-giant-icon-box">
          <span class="btn-giant-icon">➕</span>
        </div>
        <div class="btn-giant-content">
          <span class="btn-giant-title">NOVA ORDEM DE SERVIÇO</span>
          <span class="btn-giant-subtitle">Abrir chamado, dados da máquina e ditado por voz 🎙️</span>
        </div>
        <div class="btn-giant-arrow">➔</div>
      </button>

      <!-- Botão Bem Grande 2: Nova Listagem de Peças -->
      <button class="btn-giant-mobile btn-giant-listagem" onclick="mostrarModalListagemPecas()">
        <div class="btn-giant-icon-box">
          <span class="btn-giant-icon">📝</span>
        </div>
        <div class="btn-giant-content">
          <span class="btn-giant-title">NOVA LISTAGEM DE PEÇAS</span>
          <span class="btn-giant-subtitle">Requisitar peças, cotação e orçamento</span>
        </div>
        <div class="btn-giant-arrow">➔</div>
      </button>

      <!-- Botão Bem Grande 3: Listar OS's -->
      <button class="btn-giant-mobile btn-giant-secondary" onclick="AppState.currentPage = 'ordens-servico'; render();">
        <div class="btn-giant-icon-box">
          <span class="btn-giant-icon">📋</span>
        </div>
        <div class="btn-giant-content">
          <span class="btn-giant-title">LISTAR ORDENS DE SERVIÇO</span>
          <span class="btn-giant-subtitle">Consultar todas as OS, filtrar status e ver detalhes</span>
        </div>
        <div class="btn-giant-arrow">➔</div>
      </button>
    </div>

    <!-- Indicadores Operacionais Rápidos -->
    <div class="mobile-op-summary">
      <div class="mobile-op-chip" onclick="AppState.currentPage = 'ordens-servico'; AppState.filters.ordens.status = 'ABERTA'; render();">
        <span class="mobile-op-chip-num warning">${stats.os_abertas || 0}</span>
        <span class="mobile-op-chip-label">OS Abertas</span>
      </div>
      <div class="mobile-op-chip" onclick="AppState.currentPage = 'ordens-servico'; AppState.filters.ordens.status = 'EM_ANDAMENTO'; render();">
        <span class="mobile-op-chip-num info">${stats.os_em_andamento || 0}</span>
        <span class="mobile-op-chip-label">Em Andamento</span>
      </div>
      <div class="mobile-op-chip" onclick="AppState.currentPage = 'maquinas'; render();">
        <span class="mobile-op-chip-num success">${AppState.data.maquinas?.length || 0}</span>
        <span class="mobile-op-chip-label">Máquinas</span>
      </div>
    </div>

    <!-- Acessos Rápidos Secundários -->
    <div class="mobile-secondary-grid">
      ${hasPermission('listagens-pecas') ? `
        <button class="btn-mobile-shortcut" onclick="AppState.currentPage = 'listagens-pecas'; render();">
          <span style="font-size: 1.4rem;">📦</span>
          <span>Ver Listagens de Peças</span>
        </button>
      ` : ''}
      <button class="btn-mobile-shortcut" onclick="AppState.currentPage = 'maquinas'; render();">
        <span style="font-size: 1.4rem;">🚜</span>
        <span>Máquinas & Frota</span>
      </button>
    </div>
  `;
}

function renderDashboard() {
  const stats = AppState.data.stats;

  return `
    <!-- Visão Mobile / Tablet: Botões Grandes Operacionais -->
    <div class="mobile-dashboard-view">
      ${renderMobileDashboard()}
    </div>

    <!-- Visão Desktop Completa -->
    <div class="desktop-dashboard-view">
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
        <div class="stat-card premium clickable" onclick="AppState.currentPage = 'ordens-servico'; render();">
          <div class="stat-header">
            <span class="stat-label">Ordens Abertas</span>
            <div class="stat-icon-bg primary">📋</div>
          </div>
          <div class="stat-value-large">${stats.os_abertas || 0}</div>
          <div class="stat-footer">${stats.os_em_andamento || 0} em andamento</div>
        </div>

        <div class="stat-card premium clickable" onclick="AppState.currentPage = 'pecas'; render();">
          <div class="stat-header">
            <span class="stat-label">Estoque Crítico</span>
            <div class="stat-icon-bg warning">📦</div>
          </div>
          <div class="stat-value-large">${stats.pecas_estoque_baixo || 0}</div>
          <div class="stat-footer">Peças abaixo do mínimo</div>
        </div>

        ${hasPermission('vendas') ? `
          <div class="stat-card premium clickable" onclick="AppState.currentPage = 'vendas'; render();">
            <div class="stat-header">
              <span class="stat-label">Vendas do Mês</span>
              <div class="stat-icon-bg info">🛒</div>
            </div>
            <div class="stat-value-large">R$ ${formatMoney(stats.vendas_mes?.total || 0)}</div>
            <div class="stat-footer">${stats.vendas_mes?.count || 0} pedidos</div>
          </div>
        ` : ''}

        <div class="stat-card premium clickable" onclick="AppState.currentPage = 'ordens-servico'; render();">
          <div class="stat-header">
            <span class="stat-label">Tempo Médio</span>
            <div class="stat-icon-bg" style="background: ${getHealthColor(stats.tempo_medio_os)}22; color: ${getHealthColor(stats.tempo_medio_os)};">⚡</div>
          </div>
          <div class="stat-value-large" style="color: ${getHealthColor(stats.tempo_medio_os)};">${formatAverageTime(stats.tempo_medio_os)}</div>
          <div class="stat-footer">Tempo de conclusão</div>
        </div>
      </div>

      <!-- Grid: Ordens Recentes e Rankings -->
      <div class="dashboard-grid-two" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.5rem;">
        <div class="card" style="height: 100%; display: flex; flex-direction: column;">
          <div class="card-header">
            <h2 class="card-title">Ordens Recentes</h2>
            <span class="card-link" onclick="AppState.currentPage = 'ordens-servico'; render();" style="cursor: pointer; color: var(--primary-light); font-size: 0.9rem;">Ver todas →</span>
          </div>
          <div style="flex: 1; overflow-y: auto; max-height: 380px;">
            ${renderOrdensTable(AppState.data.ordens.slice(0, 5), true)}
          </div>
        </div>

        ${renderRankingMecanicosCard()}

        ${renderRankingEmpresasCard()}
      </div>
    </div>
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

function renderOrdensTable(ordens, isDashboard = false) {
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
      <table style="${isDashboard ? 'font-size: 0.85rem;' : ''}">
        <thead>
          <tr>
            <th>Nº</th>
            <th>Cliente</th>
            <th class="desktop-only">Máquina</th>
            <th class="desktop-only">Mecânico</th>
            <th class="desktop-only">Abertura</th>
            <th>Status</th>
            <th class="${isDashboard ? 'desktop-only' : ''}">Valor</th>
            <th style="width: 80px;">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${ordens.map(os => `
            <tr>
              <td><strong>${os.numero_os}</strong></td>
              <td style="${isDashboard ? 'max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;' : ''}" title="${os.cliente_nome}">${os.cliente_nome || '-'}</td>
              <td class="desktop-only">${os.maquina_modelo || '-'}</td>
              <td class="desktop-only">${os.mecanico_nome || '-'}</td>
              <td class="desktop-only">${formatDate(os.data_abertura)}</td>
              <td><span class="badge badge-${statusBadges[os.status]}" style="font-size: 0.65rem; padding: 0.2rem 0.5rem;">${os.status === 'EM_ANDAMENTO' ? 'ANDAM.' : os.status}</span></td>
              <td class="${isDashboard ? 'desktop-only' : ''}">R$ ${formatMoney(os.valor_total)}</td>
              <td>
                ${renderActionMenu(`os-${os.id}`, [
    { label: 'Editar', icon: '📝', onclick: `editarOS(${os.id})` },
    { label: 'Imprimir', icon: '🖨️', onclick: `window.gerarPDFOS(${os.id})`, show: !isDashboard },
    { label: 'Excluir', icon: '🗑️', onclick: `confirmarExcluirOS(${os.id}, '${os.numero_os}')`, class: 'danger', show: AppState.currentUser.cargo === 'ADMIN' && !isDashboard }
  ], isDashboard ? '⋮' : 'Ações')}
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
      (maq.id_frota && maq.id_frota.toLowerCase().includes(search.toLowerCase())) ||
      (maq.tipo && maq.tipo.toLowerCase().includes(search.toLowerCase())) ||
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
          placeholder="Buscar por frota, modelo, cliente ou série..." 
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
            <th class="desktop-only">Tipo</th>
            <th>ID Frota</th>
            <th>Modelo</th>
            <th>Horímetro</th>
            <th class="desktop-only">Série</th>
            <th class="desktop-only">Ano</th>
            <th class="desktop-only">OBS</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${maquinas.map(maq => `
            <tr>
              <td title="${maq.cliente_nome}">${maq.cliente_nome ? (maq.cliente_nome.split(' ')[0] + '...') : '-'}</td>
              <td class="desktop-only"><span class="badge badge-info" style="font-size: 0.7rem;">${maq.tipo || 'Geral'}</span></td>
              <td>${maq.id_frota ? `<span style="font-weight: 600; color: var(--primary);">${maq.id_frota}</span>` : '<span style="color: var(--text-muted);">-</span>'}</td>
              <td><strong>${maq.modelo}</strong></td>
              <td><span class="badge badge-secondary" style="font-weight: 600; font-size: 0.8rem;">⏱️ ${parseFloat(maq.horas_uso || 0).toLocaleString('pt-BR')} h</span></td>
              <td class="desktop-only">${maq.numero_serie || '-'}</td>
              <td class="desktop-only">${maq.ano_fabricacao || maq.ano || '-'}</td>
              <td class="desktop-only">${maq.observacoes || '-'}</td>
              <td>
                ${renderActionMenu(`maq-${maq.id}`, [
    { label: 'Editar', icon: '📝', onclick: `showNovaMaquinaModal(${maq.id})` },
    { label: 'Histórico', icon: '📜', onclick: `showHistoricoMaquina(${maq.id})` }
  ], '⋮')}
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
            <th class="desktop-only">Custo</th>
            <th>Venda</th>
            <th>Estoque</th>
            <th class="desktop-only">Mín.</th>
            <th class="desktop-only">Status</th>
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
                <td class="desktop-only">R$ ${formatMoney(peca.preco_custo)}</td>
                <td>R$ ${formatMoney(peca.preco_venda)}</td>
                <td>${peca.quantidade_estoque || peca.estoque_atual || 0}</td>
                <td class="desktop-only">${peca.estoque_minimo || 0}</td>
                <td class="desktop-only">
                  ${estoqueBaixo
        ? '<span class="badge badge-danger">Baixo</span>'
        : '<span class="badge badge-success">OK</span>'}
                </td>
                <td>
                  ${renderActionMenu(`pec-${peca.id}`, [
          { label: 'Editar', icon: '📝', onclick: `showNovaPecaModal(${peca.id})` }
        ], '⋮')}
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
            <th>Nº</th>
            <th>Cliente</th>
            <th class="desktop-only">Vendedor</th>
            <th class="desktop-only">Data</th>
            <th>Total</th>
            <th class="desktop-only">Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${vendas.map(venda => `
            <tr>
              <td><strong>${venda.numero_venda}</strong></td>
              <td title="${venda.cliente_nome}">${venda.cliente_nome ? (venda.cliente_nome.split(' ')[0] + '...') : '-'}</td>
              <td class="desktop-only">${venda.vendedor_nome || '-'}</td>
              <td class="desktop-only">${formatDate(venda.data_venda)}</td>
              <td>R$ ${formatMoney(venda.valor_total)}</td>
              <td class="desktop-only"><span class="badge badge-${venda.status === 'PAGO' ? 'success' : 'warning'}">${venda.status}</span></td>
              <td>
                ${renderActionMenu(`ven-${venda.id}`, [
    { label: 'Visualizar', icon: '👁️', onclick: `showVendaDetalhes(${venda.id})` },
    { label: 'Concretizar', icon: '✅', onclick: `concretizarVenda(${venda.id})`, show: venda.status === 'PENDENTE' },
    { label: 'Excluir', icon: '🗑️', onclick: `confirmarExcluirVenda(${venda.id}, '${venda.numero_venda}')`, class: 'danger', show: AppState.currentUser.cargo === 'ADMIN' }
  ], '⋮')}
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
            <th class="desktop-only">CNPJ</th>
            <th>Telefone</th>
            <th class="desktop-only">E-mail</th>
            <th class="desktop-only">Endereço</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${clientes.map(cliente => `
            <tr>
              <td><strong>${cliente.nome}</strong></td>
              <td class="desktop-only">${cliente.cnpj || '-'}</td>
              <td>${cliente.telefone || '-'}</td>
              <td class="desktop-only">${cliente.email || '-'}</td>
              <td class="desktop-only">${cliente.endereco || '-'}</td>
              <td>
                ${renderActionMenu(`cli-${cliente.id}`, [
    { label: 'Editar', icon: '📝', onclick: `showNovoClienteModal(${cliente.id})` }
  ], '⋮')}
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
            <th class="desktop-only">E-mail</th>
            <th>Cargo</th>
            <th class="desktop-only">Status</th>
            <th class="desktop-only">Cadastrado em</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${usuarios.map(usuario => `
            <tr>
              <td><strong>${usuario.nome}</strong></td>
              <td class="desktop-only">${usuario.email}</td>
              <td>${roleLabels[usuario.cargo] || usuario.cargo}</td>
              <td class="desktop-only">
                <span class="badge badge-${usuario.ativo ? 'success' : 'danger'}">
                  ${usuario.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td class="desktop-only">${formatDate(usuario.criado_em)}</td>
              <td>
                ${renderActionMenu(`usu-${usuario.id}`, [
    { label: 'Editar', icon: '📝', onclick: `showNovoUsuarioModal(${usuario.id})` }
  ], '⋮')}
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
// Listener global para fechar dropdowns abertos ao clicar fora
if (!window._topNavClickOutsideBound) {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.top-nav-dropdown')) {
      document.querySelectorAll('.top-nav-dropdown.open').forEach(d => {
        d.classList.remove('open');
      });
    }
  });
  window._topNavClickOutsideBound = true;
}

// Listener global para fechar mobile sidebar ao pressionar Escape
if (!window._mobileSidebarEscBound) {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && typeof toggleMobileSidebar === 'function') {
      toggleMobileSidebar(false);
    }
  });
  window._mobileSidebarEscBound = true;
}

function attachEventListeners() {
  // Navegação
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      AppState.currentPage = item.dataset.page;
      document.querySelectorAll('.top-nav-dropdown.open').forEach(d => {
        d.classList.remove('open');
      });
      if (typeof toggleMobileSidebar === 'function') {
        toggleMobileSidebar(false);
      }
      render();
    });
  });

  // Toggle dropdowns ao clicar no botão do topo
  document.querySelectorAll('.top-nav-dropdown').forEach(dropdown => {
    const btn = dropdown.querySelector('.top-nav-btn');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasOpen = dropdown.classList.contains('open');
        document.querySelectorAll('.top-nav-dropdown.open').forEach(d => {
          if (d !== dropdown) d.classList.remove('open');
        });
        dropdown.classList.toggle('open', !wasOpen);
      });
    }
  });

  // Logout Desktop
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await window.api.logout();
      AppState.currentUser = null;
      render();
    });
  }

  // Logout Mobile
  const logoutBtnMobile = document.getElementById('logout-btn-mobile');
  if (logoutBtnMobile) {
    logoutBtnMobile.addEventListener('click', async () => {
      if (typeof toggleMobileSidebar === 'function') toggleMobileSidebar(false);
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
window.concretizarVenda = concretizarVenda;
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

// Função global para alternar menus de ação
window.toggleActionMenu = (id, event) => {
  if (event) event.stopPropagation();
  const menu = document.getElementById(id);
  const isOpen = menu.classList.contains('open');

  // Fechar todos os outros menus primeiro
  document.querySelectorAll('.action-dropdown').forEach(d => d.classList.remove('open'));

  if (!isOpen) {
    menu.classList.add('open');
  }
};

// Fechar menus ao clicar fora
document.addEventListener('click', () => {
  document.querySelectorAll('.action-dropdown').forEach(d => d.classList.remove('open'));
});

function renderActionMenu(id, items, buttonLabel = 'Ações') {
  const filteredItems = items.filter(item => item.show !== false);
  if (filteredItems.length === 0) return '-';

  return `
    <div class="action-dropdown" id="action-menu-${id}">
      <button class="action-btn" onclick="toggleActionMenu('action-menu-${id}', event)">
        ${buttonLabel}${buttonLabel === 'Ações' ? ' ▾' : ''}
      </button>
      <div class="action-menu">
        ${filteredItems.map(item => `
          <button class="action-item ${item.class || ''}" onclick="${item.onclick}">
            <span>${item.icon || ''}</span> ${item.label}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

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
        <label class="form-label">ID Frota</label>
        <input type="text" class="form-input" id="modal-maquina-id-frota" placeholder="Ex: FR-01" value="${maquinaData?.id_frota || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Tipo *</label>
        <select class="form-input" id="modal-maquina-tipo" required>
          <option value="Geral" ${maquinaData?.tipo === 'Geral' ? 'selected' : ''}>Geral</option>
          <option value="Trator" ${maquinaData?.tipo === 'Trator' ? 'selected' : ''}>Trator</option>
          <option value="Colheitadeira" ${maquinaData?.tipo === 'Colheitadeira' ? 'selected' : ''}>Colheitadeira</option>
          <option value="Escavadeira" ${maquinaData?.tipo === 'Escavadeira' ? 'selected' : ''}>Escavadeira</option>
          <option value="Carregadeira" ${maquinaData?.tipo === 'Carregadeira' ? 'selected' : ''}>Carregadeira</option>
          <option value="Compressor" ${maquinaData?.tipo === 'Compressor' ? 'selected' : ''}>Compressor</option>
          <option value="Gerador" ${maquinaData?.tipo === 'Gerador' ? 'selected' : ''}>Gerador</option>
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
      <div class="form-group">
        <label class="form-label">Horímetro Atual (Horas)</label>
        <input type="number" step="0.1" class="form-input" id="modal-maquina-horas" placeholder="Ex: 1500" value="${maquinaData?.horas_uso || ''}" />
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
      id_frota: document.getElementById('modal-maquina-id-frota')?.value || '',
      tipo: document.getElementById('modal-maquina-tipo').value,
      numero_serie: document.getElementById('modal-maquina-serie').value,
      ano: document.getElementById('modal-maquina-ano').value,
      horas_uso: parseFloat(document.getElementById('modal-maquina-horas')?.value) || 0,
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

function showNovaOSModal(prefill = null) {
  if (prefill instanceof Event) prefill = null;
  AppState.modalAberto = true;
  mostrarModalOS(prefill);
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
  }, 'Concretizar Venda');

  // Exportar funções necessárias para o escopo global do modal
  window.adicionarItemLista = adicionarItemLista;
}

async function concretizarVenda(id) {
  if (confirm('Deseja concretizar esta venda (marcar como PAGO)?')) {
    const result = await window.api.finalizarVenda(id);
    if (result.success) {
      alert('Venda concretizada com sucesso!');
      await loadVendas();
      render();
    } else {
      alert('Erro ao concretizar venda: ' + result.message);
    }
  }
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

function showModal(title, bodyHTML, onSave, saveLabel = null) {
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
        ${onSave ? `<button class="btn btn-primary" id="modal-save-btn">${saveLabel || 'Salvar'}</button>` : ''}
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
    loadListagensPecas(),
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
      const apiEndpoint = (typeof API_CONFIG !== 'undefined' && API_CONFIG.BASE_URL)
        ? `${API_CONFIG.BASE_URL}/check-updates`
        : 'https://samape20-estudioio.up.railway.app/api/check-updates';
      const response = await fetch(apiEndpoint);
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

async function loadListagensPecas() {
  const result = await window.api.listarListagensPecas();
  if (result.success) AppState.data.listagens = result.listagens;
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
