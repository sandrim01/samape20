// Detectar se está no mobile (Capacitor) ou desktop (Electron)
const isMobile = !window.api;

// Wrapper para usar API REST ou Electron
const AppAPI = {
    async login(data) {
        if (isMobile && window.API) {
            return await window.API.login(data.email, data.senha);
        }
        return await window.api.login(data);
    },

    async listarClientes() {
        if (isMobile && window.API) {
            return await window.API.getClientes();
        }
        return await window.api.listarClientes();
    },

    async listarMaquinas() {
        if (isMobile && window.API) {
            return await window.API.getMaquinas();
        }
        return await window.api.listarMaquinas();
    },

    async listarOS(filtros) {
        if (isMobile && window.API) {
            return await window.API.getOrdens();
        }
        return await window.api.listarOS(filtros);
    },

    async listarPecas() {
        if (isMobile && window.API) {
            return await window.API.getPecas();
        }
        return await window.api.listarPecas();
    },

    async listarVendas() {
        if (isMobile && window.API) {
            return await window.API.getVendas();
        }
        return await window.api.listarVendas();
    },

    async listarUsuarios() {
        if (isMobile) {
            return { success: true, usuarios: [] };
        }
        return await window.api.listarUsuarios();
    },

    async listarContasReceber(filtros) {
        if (isMobile && window.API) {
            return await window.API.getContasReceber();
        }
        return await window.api.listarContasReceber(filtros);
    },

    async listarContasPagar(filtros) {
        if (isMobile && window.API) {
            return await window.API.getContasPagar();
        }
        return await window.api.listarContasPagar(filtros);
    },

    async obterEstatisticas() {
        if (isMobile && window.API) {
            return await window.API.getStats();
        }
        return await window.api.obterEstatisticas();
    },

    async obterOS(id) {
        if (isMobile && window.API) {
            return await window.API.getOrdem(id);
        }
        return await window.api.obterOS(id);
    }
};

// Substituir window.api por AppAPI
if (isMobile) {
    console.log('🔄 Modo Mobile - Usando API REST');
    console.log('📡 API URL:', window.API_CONFIG?.BASE_URL);
}
