// Configuração da API para Web e Mobile
const API_CONFIG = {
    // URL da API - Railway
    BASE_URL: 'https://samape20-estudioio.up.railway.app/api',

    // Token de autenticação
    getToken: () => localStorage.getItem('auth_token'),
    setToken: (token) => localStorage.setItem('auth_token', token),
    clearToken: () => localStorage.removeItem('auth_token'),

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
    try {
        const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                ...API_CONFIG.getHeaders(),
                ...options.headers
            }
        });

        if (response.status === 401 || response.status === 403) {
            console.warn('Sessão expirada ou acesso negado');
            // Opcional: redirecionar para login ou limpar token
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Erro na requisição ${endpoint}:`, error);
        return { success: false, message: 'Erro de conexão com o servidor' };
    }
}

// Interface API que imita o bridge do Electron (preload.js)
const WebAPI = {
    // Autenticação
    async login(dados) {
        const data = await apiFetch('/login', {
            method: 'POST',
            body: JSON.stringify(dados)
        });

        if (data.success && data.token) {
            API_CONFIG.setToken(data.token);
            // Mapeamento importante: o app.js espera 'usuario', a API retorna 'user'
            data.usuario = data.user;
        }
        return data;
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

    // Clientes
    async criarCliente(dados) {
        return await apiFetch('/clientes', { method: 'POST', body: JSON.stringify(dados) });
    },

    async listarClientes() {
        const data = await apiFetch('/clientes');
        return data || { success: true, clientes: [] };
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

    // Ordens de Serviço
    async criarOS(dados) {
        return await apiFetch('/ordens', { method: 'POST', body: JSON.stringify(dados) });
    },

    async listarOS(filtros = {}) {
        let url = '/ordens';
        const params = new URLSearchParams(filtros);
        if (params.toString()) url += `?${params.toString()}`;
        const data = await apiFetch(url);
        return data || { success: true, ordens: [] };
    },

    async obterOS(id) {
        return await apiFetch(`/ordens/${id}`);
    },

    // Peças
    async criarPeca(dados) {
        return await apiFetch('/pecas', { method: 'POST', body: JSON.stringify(dados) });
    },

    async listarPecas() {
        const data = await apiFetch('/pecas');
        return data || { success: true, pecas: [] };
    },

    // Vendas
    async listarVendas() {
        const data = await apiFetch('/vendas');
        return data || { success: true, vendas: [] };
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
        return data || { success: true, stats: {} };
    }
};

// Expõe a API como global para o app.js
window.api = WebAPI;

console.log('✅ WebAPI robusta carregada. Servidor:', API_CONFIG.BASE_URL);
