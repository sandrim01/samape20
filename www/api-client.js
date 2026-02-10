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

    // Peças
    async criarPeca(dados) {
        return await apiFetch('/pecas', { method: 'POST', body: JSON.stringify(dados) });
    },

    async listarPecas() {
        const data = await apiFetch('/pecas');
        return data || { success: true, pecas: [] };
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
                    os_em_andamento: 0, // A API unificou, mas o app espera separado
                    contas_receber_pendentes: { total: data.stats.receitaTotal || 0, count: 0 },
                    contas_pagar_pendentes: { total: 0, count: 0 },
                    pecas_estoque_baixo: 0,
                    vendas_mes: { total: 0, count: 0 }
                }
            };
        }
        return data || { success: true, stats: {} };
    }
};

// Expõe a API como global para o app.js
if (!window.api) {
    window.api = WebAPI;
    console.log('✅ WebAPI robusta carregada. Servidor:', API_CONFIG.BASE_URL);
} else {
    // Se já existir (Electron), podemos complementar se faltar algo, 
    // mas aqui deixamos como está para não quebrar o Electron Bridge
    console.log('✅ Utilizando API nativa (Electron Bridge)');
}
