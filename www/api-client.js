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
window.API_CONFIG = API_CONFIG;

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

        if (typeof OfflineManager !== 'undefined' && typeof OfflineManager.testarConexaoReal === 'function') {
            OfflineManager.testarConexaoReal();
        }

        return { success: false, message: msg, isNetworkError: true };
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
        if (typeof OfflineManager !== 'undefined' && !OfflineManager.isOnline()) {
            const cached = OfflineManager.obterSnapshot('usuarios');
            if (cached && cached.length) return { success: true, usuarios: cached, _isOffline: true };
        }
        const data = await apiFetch('/usuarios');
        if (data && data.success && data.users) {
            data.usuarios = data.users;
            if (typeof OfflineManager !== 'undefined') OfflineManager.salvarSnapshot('usuarios', data.users);
            return data;
        }
        if (typeof OfflineManager !== 'undefined') {
            const cached = OfflineManager.obterSnapshot('usuarios');
            if (cached && cached.length) return { success: true, usuarios: cached, _isOffline: true };
        }
        const curUser = (typeof AppState !== 'undefined' && AppState.currentUser) ? AppState.currentUser : this.getUser();
        if (curUser) {
            return { success: true, usuarios: [curUser], _isOffline: true };
        }
        return data || { success: true, usuarios: [] };
    },

    async listarMecanicos() {
        if (typeof OfflineManager !== 'undefined' && !OfflineManager.isOnline()) {
            const cached = OfflineManager.obterSnapshot('mecanicos');
            if (cached && cached.length) return { success: true, mecanicos: cached, _isOffline: true };
        }
        const data = await apiFetch('/mecanicos');
        if (data && data.success && data.mecanicos) {
            if (typeof OfflineManager !== 'undefined') OfflineManager.salvarSnapshot('mecanicos', data.mecanicos);
            return data;
        }
        if (typeof OfflineManager !== 'undefined') {
            const cached = OfflineManager.obterSnapshot('mecanicos');
            if (cached && cached.length) return { success: true, mecanicos: cached, _isOffline: true };
        }
        const curUser = (typeof AppState !== 'undefined' && AppState.currentUser) ? AppState.currentUser : this.getUser();
        if (curUser) {
            return { success: true, mecanicos: [curUser], _isOffline: true };
        }
        return { success: true, mecanicos: [] };
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
        if (typeof OfflineManager !== 'undefined' && !OfflineManager.isOnline()) {
            const cached = OfflineManager.obterSnapshot('clientes');
            if (cached) return { success: true, clientes: cached, _isOffline: true };
        }
        const data = await apiFetch('/clientes');
        if (data && data.success && data.clientes) {
            if (typeof OfflineManager !== 'undefined') OfflineManager.salvarSnapshot('clientes', data.clientes);
            return data;
        }
        if (typeof OfflineManager !== 'undefined') {
            const cached = OfflineManager.obterSnapshot('clientes');
            if (cached) return { success: true, clientes: cached, _isOffline: true };
        }
        return data || { success: true, clientes: [] };
    },

    async atualizarCliente(id, dados) {
        return await apiFetch(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
    },

    async obterCliente(id) {
        if (typeof OfflineManager !== 'undefined' && !OfflineManager.isOnline()) {
            const cached = OfflineManager.obterSnapshot('clientes') || [];
            const c = cached.find(item => String(item.id) === String(id));
            if (c) return { success: true, cliente: c, _isOffline: true };
        }
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
        if (typeof OfflineManager !== 'undefined' && !OfflineManager.isOnline()) {
            let cached = OfflineManager.obterSnapshot('maquinas') || [];
            if (cliente_id) cached = cached.filter(m => String(m.cliente_id) === String(cliente_id));
            return { success: true, maquinas: cached, _isOffline: true };
        }
        let url = '/maquinas';
        if (cliente_id) url += `?cliente_id=${cliente_id}`;
        const data = await apiFetch(url);
        if (data && data.success && data.maquinas) {
            let resMaquinas = data.maquinas;
            if (cliente_id) {
                resMaquinas = resMaquinas.filter(m => String(m.cliente_id) === String(cliente_id));
            } else if (typeof OfflineManager !== 'undefined') {
                OfflineManager.salvarSnapshot('maquinas', data.maquinas);
            }
            return { success: true, maquinas: resMaquinas };
        }
        if (typeof OfflineManager !== 'undefined') {
            let cached = OfflineManager.obterSnapshot('maquinas') || [];
            if (cliente_id) cached = cached.filter(m => String(m.cliente_id) === String(cliente_id));
            return { success: true, maquinas: cached, _isOffline: true };
        }
        return data || { success: true, maquinas: [] };
    },

    async obterMaquina(id) {
        if (typeof OfflineManager !== 'undefined' && !OfflineManager.isOnline()) {
            const cached = OfflineManager.obterSnapshot('maquinas') || [];
            const maq = cached.find(m => String(m.id) === String(id));
            if (maq) return { success: true, maquina: maq, _isOffline: true };
        }
        const data = await apiFetch(`/maquinas/${id}`);
        if (data && data.success) return data;
        if (typeof OfflineManager !== 'undefined') {
            const cached = OfflineManager.obterSnapshot('maquinas') || [];
            const maq = cached.find(m => String(m.id) === String(id));
            if (maq) return { success: true, maquina: maq, _isOffline: true };
        }
        return data;
    },

    async obterQRCodeMaquina(id) {
        return await apiFetch(`/maquinas/${id}/qrcode`);
    },

    async atualizarMaquina(id, dados) {
        return await apiFetch(`/maquinas/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
    },

    async excluirMaquina(id) {
        return await apiFetch(`/maquinas/${id}`, { method: 'DELETE' });
    },

    async atualizarHorimetroMaquina(id, horas_uso) {
        if (typeof OfflineManager !== 'undefined' && !OfflineManager.isOnline()) {
            OfflineManager.enfileirarAcao({
                tipo: 'APONTAR_HORIMETRO',
                targetId: id,
                payload: { maquina_id: id, horimetro: horas_uso },
                descricao: `Apontamento de horímetro ${horas_uso}h para máquina ${id}`
            });
            return { success: true, _isOffline: true };
        }
        return await apiFetch(`/maquinas/${id}/horimetro`, { method: 'PATCH', body: JSON.stringify({ horas_uso }) });
    },

    // Ordens de Serviço (com suporte transparente a Modo Offline)
    async criarOS(dados) {
        if (typeof OfflineManager !== 'undefined' && !OfflineManager.isOnline()) {
            const tempId = OfflineManager.gerarIdProvisorio('os');
            const tempNumero = OfflineManager.gerarNumeroOSProvisorio();
            const ordemOffline = {
                id: tempId,
                numero_os: tempNumero,
                ...dados,
                data_abertura: new Date().toISOString(),
                status: dados.status || 'ABERTA',
                prioridade: dados.prioridade || 'MEDIA',
                valor_total: dados.valor_total || 0,
                _isOffline: true
            };

            OfflineManager.enfileirarAcao({
                tipo: 'CRIAR_OS',
                tempId: tempId,
                endpoint: '/ordens',
                metodo: 'POST',
                payload: dados,
                descricao: `Abertura de OS Provisória ${tempNumero}`
            });

            // Atualiza snapshot de ordens localmente
            const ordens = (typeof AppState !== 'undefined' && AppState.data && AppState.data.ordens) ? AppState.data.ordens : [];
            ordens.unshift(ordemOffline);
            if (typeof OfflineManager !== 'undefined') OfflineManager.salvarSnapshot('ordens', ordens);

            return {
                success: true,
                ordem: ordemOffline,
                numero_os: tempNumero,
                _isOffline: true,
                message: 'OS criada localmente no aparelho (Modo Offline).'
            };
        }

        const data = await apiFetch('/ordens', { method: 'POST', body: JSON.stringify(dados) });
        if (!data || !data.success) {
            if (data && data.isNetworkError && typeof OfflineManager !== 'undefined') {
                const tempId = OfflineManager.gerarIdProvisorio('os');
                const tempNumero = OfflineManager.gerarNumeroOSProvisorio();
                const ordemOffline = {
                    id: tempId,
                    numero_os: tempNumero,
                    ...dados,
                    data_abertura: new Date().toISOString(),
                    status: dados.status || 'ABERTA',
                    prioridade: dados.prioridade || 'MEDIA',
                    valor_total: dados.valor_total || 0,
                    _isOffline: true
                };

                OfflineManager.enfileirarAcao({
                    tipo: 'CRIAR_OS',
                    tempId: tempId,
                    endpoint: '/ordens',
                    metodo: 'POST',
                    payload: dados,
                    descricao: `Abertura de OS Provisória ${tempNumero}`
                });

                return {
                    success: true,
                    ordem: ordemOffline,
                    numero_os: tempNumero,
                    _isOffline: true,
                    message: 'Rede instável: OS criada no aparelho com segurança.'
                };
            }
        }
        return data;
    },

    async atualizarOS(id, dados) {
        if (typeof OfflineManager !== 'undefined' && (!OfflineManager.isOnline() || String(id).startsWith('temp_'))) {
            OfflineManager.enfileirarAcao({
                tipo: 'ATUALIZAR_OS',
                targetId: id,
                endpoint: `/ordens/${id}`,
                metodo: 'PUT',
                payload: dados,
                descricao: `Atualização de OS ${id}`
            });

            if (typeof AppState !== 'undefined' && AppState.data && AppState.data.ordens) {
                const idx = AppState.data.ordens.findIndex(o => String(o.id) === String(id));
                if (idx !== -1) {
                    AppState.data.ordens[idx] = { ...AppState.data.ordens[idx], ...dados };
                }
            }
            return { success: true, _isOffline: true, message: 'Alterações da OS salvas no aparelho.' };
        }

        const data = await apiFetch(`/ordens/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
        if (!data || !data.success) {
            if (data && data.isNetworkError && typeof OfflineManager !== 'undefined') {
                OfflineManager.enfileirarAcao({
                    tipo: 'ATUALIZAR_OS',
                    targetId: id,
                    endpoint: `/ordens/${id}`,
                    metodo: 'PUT',
                    payload: dados,
                    descricao: `Atualização de OS ${id}`
                });
                return { success: true, _isOffline: true };
            }
        }
        return data;
    },

    async listarOrdens(filtros = {}) {
        if (typeof OfflineManager !== 'undefined' && !OfflineManager.isOnline()) {
            const cached = OfflineManager.obterSnapshot('ordens') || [];
            return { success: true, ordens: cached, _isOffline: true };
        }
        let url = '/ordens';
        const params = new URLSearchParams(filtros);
        if (params.toString()) url += `?${params.toString()}`;
        const data = await apiFetch(url);
        if (data && data.success && data.ordens) {
            if (typeof OfflineManager !== 'undefined') OfflineManager.salvarSnapshot('ordens', data.ordens);
            return data;
        }
        if (typeof OfflineManager !== 'undefined') {
            const cached = OfflineManager.obterSnapshot('ordens') || [];
            return { success: true, ordens: cached, _isOffline: true };
        }
        return { success: true, ordens: data ? (data.ordens || []) : [] };
    },

    async listarOS(filtros = {}) { return this.listarOrdens(filtros); },

    async obterOS(id) {
        // 1. Se for OS provisória/offline ou estiver sem rede, busca localmente
        if (String(id).startsWith('temp_') || (typeof OfflineManager !== 'undefined' && !OfflineManager.isOnline())) {
            const ordens = (typeof AppState !== 'undefined' && AppState.data && AppState.data.ordens)
                ? AppState.data.ordens
                : (typeof OfflineManager !== 'undefined' ? (OfflineManager.obterSnapshot('ordens') || []) : []);
            
            const encontrada = ordens.find(o => String(o.id) === String(id));
            if (encontrada) {
                return { success: true, os: encontrada, _isOffline: true };
            }
        }

        // 2. Se estiver online, tenta buscar do servidor
        const data = await apiFetch(`/ordens/${id}`);
        if (data && data.success && data.os) {
            return data;
        }

        // 3. Fallback para memória local ou snapshot
        const ordens = (typeof AppState !== 'undefined' && AppState.data && AppState.data.ordens)
            ? AppState.data.ordens
            : (typeof OfflineManager !== 'undefined' ? (OfflineManager.obterSnapshot('ordens') || []) : []);
        
        const encontrada = ordens.find(o => String(o.id) === String(id));
        if (encontrada) {
            return { success: true, os: encontrada, _isOffline: true };
        }

        return data || { success: false, message: 'OS não encontrada' };
    },

    async excluirOS(id) {
        if (String(id).startsWith('temp_') || (typeof OfflineManager !== 'undefined' && !OfflineManager.isOnline())) {
            if (typeof AppState !== 'undefined' && AppState.data && AppState.data.ordens) {
                AppState.data.ordens = AppState.data.ordens.filter(o => String(o.id) !== String(id));
            }
            if (typeof OfflineManager !== 'undefined') {
                const fila = OfflineManager.obterFila();
                const novaFila = fila.filter(a => !(a.tempId === id || a.targetId === id));
                localStorage.setItem('samape_offline_sync_queue', JSON.stringify(novaFila));
                OfflineManager.atualizarUIConexao();
            }
            return { success: true, _isOffline: true };
        }
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

    async listarPecasOS(id) {
        if (String(id).startsWith('temp_') || (typeof OfflineManager !== 'undefined' && !OfflineManager.isOnline())) {
            if (typeof OfflineManager !== 'undefined') {
                const fila = OfflineManager.obterFila();
                const pecasOffline = fila
                    .filter(a => a.tipo === 'ADICIONAR_PECA_OS' && String(a.targetId) === String(id))
                    .map(a => a.payload);
                return { success: true, pecas: pecasOffline, _isOffline: true };
            }
            return { success: true, pecas: [], _isOffline: true };
        }
        return await apiFetch(`/ordens/${id}/pecas`);
    },

    async adicionarPecaOS(id, dados) {
        if (typeof OfflineManager !== 'undefined' && (!OfflineManager.isOnline() || String(id).startsWith('temp_'))) {
            OfflineManager.enfileirarAcao({
                tipo: 'ADICIONAR_PECA_OS',
                targetId: id,
                payload: dados,
                descricao: `Adicionar peça na OS ${id}`
            });
            return {
                success: true,
                _isOffline: true,
                item: {
                    id: typeof OfflineManager.gerarIdProvisorio === 'function' ? OfflineManager.gerarIdProvisorio('peca') : Date.now(),
                    ordem_id: id,
                    ...dados
                }
            };
        }
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
        if (typeof OfflineManager !== 'undefined' && !OfflineManager.isOnline()) {
            const cached = OfflineManager.obterSnapshot('pecas');
            if (cached) return { success: true, pecas: cached, _isOffline: true };
        }
        const data = await apiFetch('/pecas');
        if (data && data.success && data.pecas) {
            if (typeof OfflineManager !== 'undefined') OfflineManager.salvarSnapshot('pecas', data.pecas);
            return data;
        }
        if (typeof OfflineManager !== 'undefined') {
            const cached = OfflineManager.obterSnapshot('pecas');
            if (cached) return { success: true, pecas: cached, _isOffline: true };
        }
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
    },

    // Manutenção Preventiva Preditiva
    async listarPreventivas() {
        return await apiFetch('/preventivas');
    },

    async salvarApontamentoHorimetro(dados) {
        return await apiFetch('/preventivas/apontamento', {
            method: 'POST',
            body: JSON.stringify(dados)
        });
    },

    async configurarMaquinaPreventiva(id, dados) {
        return await apiFetch(`/preventivas/maquinas/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dados)
        });
    },

    async obterPreviewEmailMecanicos() {
        return await apiFetch('/preventivas/preview-email-mecanicos');
    },

    async dispararEmailMecanicos(dados) {
        return await apiFetch('/preventivas/disparar-email-mecanicos', {
            method: 'POST',
            body: JSON.stringify(dados || {})
        });
    },

    async obterPreviewAlertaCliente(maquinaId) {
        return await apiFetch(`/preventivas/preview-alerta-cliente/${maquinaId}`);
    },

    async dispararAlertaCliente(maquinaId, dados) {
        return await apiFetch(`/preventivas/disparar-alerta-cliente/${maquinaId}`, {
            method: 'POST',
            body: JSON.stringify(dados || {})
        });
    }
};

// Expõe a API como global para o app.js
// No Electron, o window.api já vem do preload.js e é imutável.
// Em outros ambientes (Web/Mobile), usamos o WebAPI.
window.WebAPI = WebAPI;
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
