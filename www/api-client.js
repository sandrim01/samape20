// Configuração da API para Web e Mobile
const isCapacitor = typeof window !== 'undefined' && (window.Capacitor !== undefined || window.location.protocol === 'capacitor:');
const isLocalBrowser = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && 
    !isCapacitor;

const API_CONFIG = {
    // URL da API - Local se estiver no navegador localhost, ou Railway em produção/mobile
    BASE_URL: isLocalBrowser 
        ? `${window.location.origin}/api` 
        : 'https://samape20-estudioio.up.railway.app/api',

    // Token de autenticação
    getToken: () => localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'),
    setToken: (token, persistent = true) => {
        if (persistent) {
            localStorage.setItem('auth_token', token);
        } else {
            sessionStorage.setItem('auth_token', token);
        }
    },
    clearToken: () => {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
    },

    // Dados do usuário
    getUser: () => {
        try {
            const user = localStorage.getItem('user_info') || sessionStorage.getItem('user_info');
            return user ? JSON.parse(user) : null;
        } catch (e) {
            console.error('⚠️ Erro ao processar dados do usuário salvos:', e);
            localStorage.removeItem('user_info');
            sessionStorage.removeItem('user_info');
            return null;
        }
    },
    setUser: (user, persistent = true) => {
        if (user) {
            if (persistent) {
                localStorage.setItem('user_info', JSON.stringify(user));
            } else {
                sessionStorage.setItem('user_info', JSON.stringify(user));
            }
        }
    },
    clearUser: () => {
        localStorage.removeItem('user_info');
        sessionStorage.removeItem('user_info');
    },

    // Logout completo
    logout: () => {
        try {
            API_CONFIG.clearToken();
            API_CONFIG.clearUser();
            console.log('🚪 Sessão encerrada e limpa.');
        } catch (e) {
            console.error('Erro ao limpar sessão:', e);
        }
    },

    // Headers padrão
    getHeaders: () => {
        const headers = {
            'Content-Type': 'application/json'
        };
        const token = API_CONFIG.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }
};

// Função auxiliar para fetch com tratamento de erro
async function apiFetch(endpoint, options = {}) {
    console.log(`🚀 Chamando API: ${endpoint}`, options.method || 'GET');

    try {
        const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`;

        // Timeout de 15 segundos
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const fetchOptions = {
            ...options,
            headers: {
                ...API_CONFIG.getHeaders(),
                ...options.headers
            },
            signal: controller.signal
        };

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        console.log(`📡 Resposta de ${endpoint}:`, response.status, response.statusText);

        if (response.status === 401 || response.status === 403) {
            console.warn('⚠️ Sessão expirada ou acesso negado');
            // Opcional: redirecionar para login
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await response.json();
            return data;
        } else {
            const text = await response.text();
            console.error('❌ Resposta não-JSON:', text);
            return { success: false, message: 'O servidor retornou um erro inesperado (não-JSON). Status: ' + response.status };
        }

    } catch (error) {
        console.error(`❌ Erro crítico na requisição ${endpoint}:`, error);

        let msg = 'Erro de conexão com o servidor';
        if (error.name === 'AbortError') {
            msg = 'A requisição demorou muito tempo (Timeout). Verifique sua internet.';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            msg = 'Impossível conectar ao servidor. Verifique sua conexão com a internet ou se o servidor está online.';
        } else {
            msg = 'Erro inesperado: ' + error.message;
        }

        return { success: false, message: msg };
    }
}

// Interface API que imita o bridge do Electron (preload.js)
const WebAPI = {
    // Autenticação
    async login(dados, manterLogado = true) {
        const data = await apiFetch('/login', {
            method: 'POST',
            body: JSON.stringify(dados)
        });

        if (data.success && data.token) {
            API_CONFIG.setToken(data.token, manterLogado);
            API_CONFIG.setUser(data.user, manterLogado);
            // Mapeamento importante: o app.js espera 'usuario', a API retorna 'user'
            data.usuario = data.user;
        }
        return data;
    },

    async logout() {
        API_CONFIG.logout();
    },

    // Persistência local
    getUser() {
        return API_CONFIG.getUser();
    },
    setUser(user) {
        API_CONFIG.setUser(user);
    },
    clearUser() {
        API_CONFIG.clearUser();
    },

    // Usuários
    async criarUsuario(dados) {
        return await apiFetch('/usuarios', {
            method: 'POST',
            body: JSON.stringify(dados)
        });
    },

    async listarUsuarios() {
        const data = await apiFetch('/usuarios');
        if (data.success && data.users) data.usuarios = data.users;
        return data || { success: true, usuarios: [] };
    },

    async obterUsuario(id) {
        return await apiFetch(`/usuarios/${id}`);
    },

    async atualizarUsuario(id, dados) {
        return await apiFetch(`/usuarios/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dados)
        });
    },

    // Clientes
    async criarCliente(dados) {
        return await apiFetch('/clientes', { method: 'POST', body: JSON.stringify(dados) });
    },

    async listarClientes() {
        const data = await apiFetch('/clientes');
        return data || { success: true, clientes: [] };
    },

    async atualizarCliente(id, dados) {
        return await apiFetch(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
    },

    async obterCliente(id) {
        return await apiFetch(`/clientes/${id}`);
    },

    async excluirCliente(id) {
        return await apiFetch(`/clientes/${id}`, { method: 'DELETE' });
    },

    // Máquinas
    async criarMaquina(dados) {
        return await apiFetch('/maquinas', { method: 'POST', body: JSON.stringify(dados) });
    },

    async listarMaquinas(cliente_id) {
        let url = '/maquinas';
        if (cliente_id) url += `?cliente_id=${cliente_id}`;
        const data = await apiFetch(url);
        return data || { success: true, maquinas: [] };
    },

    async obterMaquina(id) {
        return await apiFetch(`/maquinas/${id}`);
    },

    async atualizarMaquina(id, dados) {
        return await apiFetch(`/maquinas/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
    },

    async excluirMaquina(id) {
        return await apiFetch(`/maquinas/${id}`, { method: 'DELETE' });
    },

    async atualizarHorimetroMaquina(id, horas_uso) {
        return await apiFetch(`/maquinas/${id}/horimetro`, { method: 'PATCH', body: JSON.stringify({ horas_uso }) });
    },

    // Ordens de Serviço
    async criarOS(dados) {
        return await apiFetch('/ordens', { method: 'POST', body: JSON.stringify(dados) });
    },

    async atualizarOS(id, dados) {
        return await apiFetch(`/ordens/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
    },

    async listarOrdens(filtros = {}) {
        let url = '/ordens';
        const params = new URLSearchParams(filtros);
        if (params.toString()) url += `?${params.toString()}`;
        const data = await apiFetch(url);
        if (data.success && data.ordens) return data;
        return { success: true, ordens: data.ordens || [] };
    },

    async listarOS(filtros = {}) { return this.listarOrdens(filtros); },

    async obterOS(id) {
        return await apiFetch(`/ordens/${id}`);
    },

    async excluirOS(id) {
        return await apiFetch(`/ordens/${id}`, { method: 'DELETE' });
    },

    // Listagem de Peças (Novo Módulo)
    async listarListagensPecas(clienteId = '') {
        const url = clienteId ? `/listagens-pecas?cliente_id=${clienteId}` : '/listagens-pecas';
        return await apiFetch(url);
    },
    async criarListagemPecas(dados) {
        return await apiFetch('/listagens-pecas', {
            method: 'POST',
            body: JSON.stringify(dados)
        });
    },
    async obterListagemPecas(id) {
        return await apiFetch(`/listagens-pecas/${id}`);
    },
    async atualizarListagemPecas(id, dados) {
        return await apiFetch(`/listagens-pecas/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dados)
        });
    },
    async adicionarItemListagem(lpId, dados) {
        return await apiFetch(`/listagens-pecas/${lpId}/itens`, {
            method: 'POST',
            body: JSON.stringify(dados)
        });
    },
    async removerItemListagem(lpId, itemId) {
        return await apiFetch(`/listagens-pecas/${lpId}/itens/${itemId}`, {
            method: 'DELETE'
        });
    },
    async excluirListagemPecas(id) {
        return await apiFetch(`/listagens-pecas/${id}`, {
            method: 'DELETE'
        });
    },

    // Peças na OS
    async listarPecasOS(id) {
        return await apiFetch(`/ordens/${id}/pecas`);
    },

    async adicionarPecaOS(id, dados) {
        return await apiFetch(`/ordens/${id}/pecas`, {
            method: 'POST',
            body: JSON.stringify(dados)
        });
    },

    async removerPecaOS(ordemId, itemId) {
        return await apiFetch(`/ordens/${ordemId}/pecas/${itemId}`, {
            method: 'DELETE'
        });
    },

    // Peças
    async criarPeca(dados) {
        return await apiFetch('/pecas', { method: 'POST', body: JSON.stringify(dados) });
    },

    async listarPecas() {
        const data = await apiFetch('/pecas');
        return data || { success: true, pecas: [] };
    },

    async obterPeca(id) {
        return await apiFetch(`/pecas/${id}`);
    },

    async excluirPeca(id) {
        return await apiFetch(`/pecas/${id}`, { method: 'DELETE' });
    },

    async atualizarPeca(id, dados) {
        return await apiFetch(`/pecas/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
    },

    async atualizarEstoque(id, quantidade) {
        return await apiFetch(`/pecas/${id}/estoque`, {
            method: 'PATCH',
            body: JSON.stringify({ quantidade })
        });
    },

    // Vendas
    async listarVendas() {
        const data = await apiFetch('/vendas');
        return data || { success: true, vendas: [] };
    },

    async criarVenda(dados) {
        return await apiFetch('/vendas', { method: 'POST', body: JSON.stringify(dados) });
    },

    async obterVenda(id) {
        return await apiFetch(`/vendas/${id}`);
    },

    async excluirVenda(id) {
        return await apiFetch(`/vendas/${id}`, { method: 'DELETE' });
    },

    async finalizarVenda(id) {
        return await apiFetch(`/vendas/${id}/finalizar`, { method: 'POST' });
    },

    // Financeiro
    async listarContasReceber(filtros = {}) {
        let url = '/contas-receber';
        const params = new URLSearchParams(filtros);
        if (params.toString()) url += `?${params.toString()}`;
        const data = await apiFetch(url);
        if (data.success && data.contas) data.contasReceber = data.contas;
        return data || { success: true, contasReceber: [] };
    },

    async registrarPagamentoReceber(id, data_pagamento) {
        return await apiFetch(`/contas-receber/${id}/pagar`, {
            method: 'POST',
            body: JSON.stringify({ data_pagamento })
        });
    },

    async listarContasPagar(filtros = {}) {
        let url = '/contas-pagar';
        const params = new URLSearchParams(filtros);
        if (params.toString()) url += `?${params.toString()}`;
        const data = await apiFetch(url);
        if (data.success && data.contas) data.contasPagar = data.contas;
        return data || { success: true, contasPagar: [] };
    },

    async registrarPagamentoPagar(id, data_pagamento) {
        return await apiFetch(`/contas-pagar/${id}/pagar`, {
            method: 'POST',
            body: JSON.stringify({ data_pagamento })
        });
    },

    async criarContaPagar(dados) {
        return await apiFetch('/contas-pagar', { method: 'POST', body: JSON.stringify(dados) });
    },

    // Dashboard
    async obterEstatisticas() {
        const data = await apiFetch('/stats');
        // Normalização para o app.js
        if (data.success && data.stats) {
            return {
                success: true,
                stats: {
                    os_abertas: data.stats.ordensAbertas || 0,
                    os_em_andamento: data.stats.ordensEmAndamento || 0,
                    contas_receber_pendentes: data.stats.contasReceber || { total: 0, count: 0 },
                    contas_pagar_pendentes: data.stats.contasPagar || { total: 0, count: 0 },
                    pecas_estoque_baixo: data.stats.pecasEstoqueBaixo || 0,
                    vendas_mes: data.stats.vendasMes || { total: 0, count: 0 },
                    tempo_medio_os: data.stats.tempoMedioOS || 0
                }
            };
        }
        return data || { success: true, stats: {} };
    },

    async verificarAtualizacao() {
        return await apiFetch('/check-updates');
    },

    async listarLogs() {
        return await apiFetch('/logs');
    }
};

// Expõe a API como global para o app.js
// No Electron, o window.api já vem do preload.js e é imutável.
// Em outros ambientes (Web/Mobile), usamos o WebAPI.
if (typeof window.api === 'undefined') {
    window.api = WebAPI;
    console.log('🌐 WebAPI integrada (Modo Web/Mobile).');
} else {
    console.log('🖥️ Electron detectado. Usando interface nativa.');
    // Nota: Novos métodos devem ser adicionados ao preload.js para ambientes Electron.
}

console.log('✅ Sistema de API inicializado. Servidor:', API_CONFIG.BASE_URL);

// Monitor de cliques para depuração
document.addEventListener('click', (e) => {
    const target = e.target.closest('button, .nav-item');
    if (target) {
        console.log('🔘 Clique detectado em:', target.id || target.className || target.innerText);
    }
}, true);
