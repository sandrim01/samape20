const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Autenticação
    login: (dados) => ipcRenderer.invoke('login', dados),

    // Usuários
    criarUsuario: (dados) => ipcRenderer.invoke('criar-usuario', dados),
    listarUsuarios: () => ipcRenderer.invoke('listar-usuarios'),
    atualizarUsuario: (id, dados) => ipcRenderer.invoke('atualizar-usuario', { id, dados }),

    // Clientes
    criarCliente: (dados) => ipcRenderer.invoke('criar-cliente', dados),
    listarClientes: () => ipcRenderer.invoke('listar-clientes'),

    // Máquinas
    criarMaquina: (dados) => ipcRenderer.invoke('criar-maquina', dados),
    listarMaquinas: (cliente_id) => ipcRenderer.invoke('listar-maquinas', cliente_id),

    // Ordens de Serviço
    criarOS: (dados) => ipcRenderer.invoke('criar-os', dados),
    listarOS: (filtros) => ipcRenderer.invoke('listar-os', filtros),
    obterOS: (id) => ipcRenderer.invoke('obter-os', id),
    atualizarOS: (id, dados) => ipcRenderer.invoke('atualizar-os', { id, dados }),

    // Peças
    criarPeca: (dados) => ipcRenderer.invoke('criar-peca', dados),
    listarPecas: () => ipcRenderer.invoke('listar-pecas'),
    atualizarEstoque: (id, quantidade) => ipcRenderer.invoke('atualizar-estoque', { id, quantidade }),

    // Vendas
    criarVenda: (dados) => ipcRenderer.invoke('criar-venda', dados),
    adicionarItemVenda: (dados) => ipcRenderer.invoke('adicionar-item-venda', dados),
    listarVendas: () => ipcRenderer.invoke('listar-vendas'),

    // Financeiro
    criarContaReceber: (dados) => ipcRenderer.invoke('criar-conta-receber', dados),
    listarContasReceber: (filtros) => ipcRenderer.invoke('listar-contas-receber', filtros),
    registrarPagamentoReceber: (id, data) => ipcRenderer.invoke('registrar-pagamento-receber', { id, data_pagamento: data }),

    criarContaPagar: (dados) => ipcRenderer.invoke('criar-conta-pagar', dados),
    listarContasPagar: (filtros) => ipcRenderer.invoke('listar-contas-pagar', filtros),
    registrarPagamentoPagar: (id, data) => ipcRenderer.invoke('registrar-pagamento-pagar', { id, data_pagamento: data }),

    // Dashboard
    obterEstatisticas: () => ipcRenderer.invoke('obter-estatisticas'),

    // Sessão (LocalStorage via Bridge)
    getUser: () => {
        try {
            const user = localStorage.getItem('user_info');
            return user ? JSON.parse(user) : null;
        } catch (e) { return null; }
    },
    setUser: (user) => {
        if (user) localStorage.setItem('user_info', JSON.stringify(user));
    },
    clearUser: () => localStorage.removeItem('user_info'),
    logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
    }
});
