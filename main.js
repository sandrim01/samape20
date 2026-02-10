const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

let mainWindow;
let dbPath;
let db;

// Inicializar caminhos
function initializePaths() {
  if (!dbPath) {
    dbPath = path.join(app.getPath('userData'), 'samapeop-data.json');
  }
}

// Estrutura inicial do banco de dados
const initialDB = {
  usuarios: [],
  clientes: [],
  maquinas: [],
  ordens_servico: [],
  pecas: [],
  vendas_pecas: [],
  itens_venda: [],
  itens_os: [],
  contas_receber: [],
  contas_pagar: [],
  counters: {
    usuarios: 0,
    clientes: 0,
    maquinas: 0,
    ordens_servico: 0,
    pecas: 0,
    vendas_pecas: 0,
    itens_venda: 0,
    itens_os: 0,
    contas_receber: 0,
    contas_pagar: 0
  }
};

// Carregar banco de dados
function loadDatabase() {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      db = JSON.parse(data);
      console.log('Banco de dados carregado');
    } else {
      db = JSON.parse(JSON.stringify(initialDB));
      // Criar usuário admin padrão
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      db.usuarios.push({
        id: 1,
        nome: 'Administrador',
        email: 'admin@samapeop.com',
        senha: hashedPassword,
        cargo: 'ADMIN',
        ativo: 1,
        criado_em: new Date().toISOString()
      });
      db.counters.usuarios = 1;
      saveDatabase();
      console.log('Banco de dados criado com usuário admin');
    }
  } catch (error) {
    console.error('Erro ao carregar banco:', error);
    db = JSON.parse(JSON.stringify(initialDB));
  }
}

// Salvar banco de dados
function saveDatabase() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  } catch (error) {
    console.error('Erro ao salvar banco de dados:', error);
  }
}

// Criar janela principal
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'resources', 'favicon.ico'),
    title: 'SAMAPEOP - Sistema de Gerenciamento de Manutenção'
  });

  mainWindow.loadFile('index.html');

  // Abrir DevTools em desenvolvimento
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Quando o Electron estiver pronto
app.whenReady().then(() => {
  initializePaths();
  loadDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Fechar quando todas as janelas forem fechadas
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ==================== IPC HANDLERS ====================

// Login
ipcMain.handle('login', async (event, { email, senha }) => {
  const usuario = db.usuarios.find(u => u.email === email && u.ativo === 1);
  if (!usuario) {
    return { success: false, message: 'Usuário não encontrado ou inativo' };
  }

  const senhaValida = bcrypt.compareSync(senha, usuario.senha);
  if (!senhaValida) {
    return { success: false, message: 'Senha incorreta' };
  }

  const { senha: _, ...usuarioSemSenha } = usuario;
  return { success: true, usuario: usuarioSemSenha };
});

// Criar usuário
ipcMain.handle('criar-usuario', async (event, dados) => {
  const hashedPassword = bcrypt.hashSync(dados.senha, 10);
  const novoUsuario = {
    id: ++db.counters.usuarios,
    nome: dados.nome,
    email: dados.email,
    senha: hashedPassword,
    cargo: dados.cargo,
    ativo: 1,
    criado_em: new Date().toISOString()
  };

  db.usuarios.push(novoUsuario);
  saveDatabase();
  return { success: true, id: novoUsuario.id };
});

// Listar usuários
ipcMain.handle('listar-usuarios', async () => {
  const usuarios = db.usuarios.map(({ senha, ...u }) => u);
  return { success: true, usuarios };
});

// Criar cliente
ipcMain.handle('criar-cliente', async (event, dados) => {
  const novoCliente = {
    id: ++db.counters.clientes,
    nome: dados.nome,
    cnpj: dados.cnpj,
    telefone: dados.telefone,
    email: dados.email,
    endereco: dados.endereco,
    criado_em: new Date().toISOString()
  };

  db.clientes.push(novoCliente);
  saveDatabase();
  return { success: true, id: novoCliente.id };
});

// Listar clientes
ipcMain.handle('listar-clientes', async () => {
  const clientes = [...db.clientes].sort((a, b) => a.nome.localeCompare(b.nome));
  return { success: true, clientes };
});

// Criar máquina
ipcMain.handle('criar-maquina', async (event, dados) => {
  const novaMaquina = {
    id: ++db.counters.maquinas,
    cliente_id: parseInt(dados.cliente_id),
    modelo: dados.modelo,
    numero_serie: dados.numero_serie,
    ano: dados.ano ? parseInt(dados.ano) : null,
    observacoes: dados.observacoes,
    criado_em: new Date().toISOString()
  };

  db.maquinas.push(novaMaquina);
  saveDatabase();
  return { success: true, id: novaMaquina.id };
});

// Listar máquinas
ipcMain.handle('listar-maquinas', async (event, cliente_id) => {
  let maquinas = db.maquinas.map(m => {
    const cliente = db.clientes.find(c => c.id === m.cliente_id);
    return {
      ...m,
      cliente_nome: cliente ? cliente.nome : null
    };
  });

  if (cliente_id) {
    maquinas = maquinas.filter(m => m.cliente_id === cliente_id);
  }

  return { success: true, maquinas };
});

// Criar OS
ipcMain.handle('criar-os', async (event, dados) => {
  const ano = new Date().getFullYear();
  const ordensDoAno = db.ordens_servico.filter(os =>
    os.numero_os.startsWith(`OS-${ano}-`)
  );
  const numeroSequencial = ordensDoAno.length + 1;
  const numero_os = `OS-${ano}-${numeroSequencial.toString().padStart(5, '0')}`;

  const novaOS = {
    id: ++db.counters.ordens_servico,
    numero_os,
    // Informações do cliente
    cliente_id: parseInt(dados.cliente_id),
    // Informações da máquina
    maquina_id: parseInt(dados.maquina_id),
    // Informações do mecânico
    mecanico_id: parseInt(dados.mecanico_id),
    // Descrição do problema
    descricao_problema: dados.descricao_problema || '',
    diagnostico: dados.diagnostico || null,
    solucao: dados.solucao || null,
    // Controle de deslocamento
    km_ida: parseFloat(dados.km_ida) || 0,
    km_volta: parseFloat(dados.km_volta) || 0,
    km_total: 0, // Calculado automaticamente
    valor_por_km: parseFloat(dados.valor_por_km) || 0,
    valor_deslocamento: 0, // Calculado automaticamente
    // Valores do serviço
    valor_mao_obra: parseFloat(dados.valor_mao_obra) || 0,
    valor_pecas: parseFloat(dados.valor_pecas) || 0,
    valor_total: 0, // Calculado automaticamente
    // Controle de status
    status: 'ABERTA',
    data_abertura: new Date().toISOString(),
    data_fechamento: null,
    observacoes: dados.observacoes || ''
  };

  // Calcular valores automaticamente
  novaOS.km_total = novaOS.km_ida + novaOS.km_volta;
  novaOS.valor_deslocamento = novaOS.km_total * novaOS.valor_por_km;
  novaOS.valor_total = novaOS.valor_mao_obra + novaOS.valor_pecas + novaOS.valor_deslocamento;

  db.ordens_servico.push(novaOS);
  saveDatabase();
  return { success: true, id: novaOS.id, numero_os };
});

// Atualizar OS
ipcMain.handle('atualizar-os', async (event, { id, dados }) => {
  const index = db.ordens_servico.findIndex(os => os.id === id);
  if (index === -1) {
    return { success: false, message: 'Ordem de serviço não encontrada' };
  }

  const os = db.ordens_servico[index];

  // Atualizar campos
  if (dados.descricao_problema !== undefined) os.descricao_problema = dados.descricao_problema;
  if (dados.diagnostico !== undefined) os.diagnostico = dados.diagnostico;
  if (dados.solucao !== undefined) os.solucao = dados.solucao;
  if (dados.km_ida !== undefined) os.km_ida = parseFloat(dados.km_ida) || 0;
  if (dados.km_volta !== undefined) os.km_volta = parseFloat(dados.km_volta) || 0;
  if (dados.valor_por_km !== undefined) os.valor_por_km = parseFloat(dados.valor_por_km) || 0;
  if (dados.valor_mao_obra !== undefined) os.valor_mao_obra = parseFloat(dados.valor_mao_obra) || 0;
  if (dados.valor_pecas !== undefined) os.valor_pecas = parseFloat(dados.valor_pecas) || 0;
  if (dados.observacoes !== undefined) os.observacoes = dados.observacoes;
  if (dados.status !== undefined) os.status = dados.status;

  // Recalcular valores
  os.km_total = os.km_ida + os.km_volta;
  os.valor_deslocamento = os.km_total * os.valor_por_km;
  os.valor_total = os.valor_mao_obra + os.valor_pecas + os.valor_deslocamento;

  // Se estiver fechando a OS
  if (dados.status === 'FECHADA' && os.status !== 'FECHADA') {
    os.data_fechamento = new Date().toISOString();
  }

  saveDatabase();
  return { success: true, os };
});

// Listar OS
ipcMain.handle('listar-os', async (event, filtros = {}) => {
  let ordens = db.ordens_servico.map(os => {
    const cliente = db.clientes.find(c => c.id === os.cliente_id);
    const maquina = db.maquinas.find(m => m.id === os.maquina_id);
    const mecanico = db.usuarios.find(u => u.id === os.mecanico_id);

    return {
      ...os,
      cliente_nome: cliente ? cliente.nome : null,
      maquina_modelo: maquina ? maquina.modelo : null,
      mecanico_nome: mecanico ? mecanico.nome : null
    };
  });

  if (filtros.status) {
    ordens = ordens.filter(os => os.status === filtros.status);
  }

  ordens.sort((a, b) => new Date(b.data_abertura) - new Date(a.data_abertura));
  return { success: true, ordens };
});

// Obter OS específica
ipcMain.handle('obter-os', async (event, id) => {
  const os = db.ordens_servico.find(o => o.id === id);
  if (!os) {
    return { success: false, message: 'Ordem de serviço não encontrada' };
  }

  const cliente = db.clientes.find(c => c.id === os.cliente_id);
  const maquina = db.maquinas.find(m => m.id === os.maquina_id);
  const mecanico = db.usuarios.find(u => u.id === os.mecanico_id);

  return {
    success: true,
    os: {
      ...os,
      cliente_nome: cliente ? cliente.nome : null,
      cliente_cnpj: cliente ? cliente.cnpj : null,
      cliente_telefone: cliente ? cliente.telefone : null,
      cliente_endereco: cliente ? cliente.endereco : null,
      maquina_modelo: maquina ? maquina.modelo : null,
      maquina_serie: maquina ? maquina.numero_serie : null,
      maquina_ano: maquina ? maquina.ano : null,
      mecanico_nome: mecanico ? mecanico.nome : null,
      mecanico_email: mecanico ? mecanico.email : null
    }
  };
});

// Criar peça
ipcMain.handle('criar-peca', async (event, dados) => {
  const novaPeca = {
    id: ++db.counters.pecas,
    codigo: dados.codigo,
    descricao: dados.descricao,
    preco_custo: parseFloat(dados.preco_custo) || 0,
    preco_venda: parseFloat(dados.preco_venda) || 0,
    estoque_atual: parseInt(dados.estoque_atual) || 0,
    estoque_minimo: parseInt(dados.estoque_minimo) || 0,
    criado_em: new Date().toISOString()
  };

  db.pecas.push(novaPeca);
  saveDatabase();
  return { success: true, id: novaPeca.id };
});

// Listar peças
ipcMain.handle('listar-pecas', async () => {
  const pecas = [...db.pecas].sort((a, b) => a.descricao.localeCompare(b.descricao));
  return { success: true, pecas };
});

// Criar conta a pagar
ipcMain.handle('criar-conta-pagar', async (event, dados) => {
  const novaConta = {
    id: ++db.counters.contas_pagar,
    fornecedor: dados.fornecedor,
    descricao: dados.descricao,
    valor: parseFloat(dados.valor),
    data_vencimento: dados.data_vencimento,
    data_pagamento: null,
    status: 'PENDENTE',
    categoria: dados.categoria,
    observacoes: dados.observacoes
  };

  db.contas_pagar.push(novaConta);
  saveDatabase();
  return { success: true, id: novaConta.id };
});

// Listar contas a pagar
ipcMain.handle('listar-contas-pagar', async (event, filtros = {}) => {
  let contas = [...db.contas_pagar];

  if (filtros.status) {
    contas = contas.filter(c => c.status === filtros.status);
  }

  contas.sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento));
  return { success: true, contas };
});

// Listar contas a receber
ipcMain.handle('listar-contas-receber', async (event, filtros = {}) => {
  let contas = db.contas_receber.map(c => {
    const cliente = db.clientes.find(cl => cl.id === c.cliente_id);
    return {
      ...c,
      cliente_nome: cliente ? cliente.nome : null
    };
  });

  if (filtros.status) {
    contas = contas.filter(c => c.status === filtros.status);
  }

  contas.sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento));
  return { success: true, contas };
});

// Registrar pagamento (pagar)
ipcMain.handle('registrar-pagamento-pagar', async (event, { id, data_pagamento }) => {
  const index = db.contas_pagar.findIndex(c => c.id === id);
  if (index === -1) {
    return { success: false, message: 'Conta não encontrada' };
  }

  db.contas_pagar[index].status = 'PAGO';
  db.contas_pagar[index].data_pagamento = data_pagamento;
  saveDatabase();
  return { success: true };
});

// Registrar pagamento (receber)
ipcMain.handle('registrar-pagamento-receber', async (event, { id, data_pagamento }) => {
  const index = db.contas_receber.findIndex(c => c.id === id);
  if (index === -1) {
    return { success: false, message: 'Conta não encontrada' };
  }

  db.contas_receber[index].status = 'PAGO';
  db.contas_receber[index].data_pagamento = data_pagamento;
  saveDatabase();
  return { success: true };
});

// Listar vendas
ipcMain.handle('listar-vendas', async () => {
  const vendas = db.vendas_pecas.map(v => {
    const cliente = db.clientes.find(c => c.id === v.cliente_id);
    const vendedor = db.usuarios.find(u => u.id === v.vendedor_id);

    return {
      ...v,
      cliente_nome: cliente ? cliente.nome : null,
      vendedor_nome: vendedor ? vendedor.nome : null
    };
  }).sort((a, b) => new Date(b.data_venda) - new Date(a.data_venda));

  return { success: true, vendas };
});

// Obter estatísticas
ipcMain.handle('obter-estatisticas', async () => {
  const stats = {
    os_abertas: db.ordens_servico.filter(os => os.status === 'ABERTA').length,
    os_em_andamento: db.ordens_servico.filter(os => os.status === 'EM_ANDAMENTO').length,
    contas_receber_pendentes: {
      count: db.contas_receber.filter(c => c.status === 'PENDENTE').length,
      total: db.contas_receber.filter(c => c.status === 'PENDENTE').reduce((sum, c) => sum + c.valor, 0)
    },
    contas_pagar_pendentes: {
      count: db.contas_pagar.filter(c => c.status === 'PENDENTE').length,
      total: db.contas_pagar.filter(c => c.status === 'PENDENTE').reduce((sum, c) => sum + c.valor, 0)
    },
    pecas_estoque_baixo: db.pecas.filter(p => p.estoque_atual <= p.estoque_minimo).length,
    vendas_mes: (() => {
      const hoje = new Date();
      const mesAtual = hoje.getMonth();
      const anoAtual = hoje.getFullYear();
      const vendasMes = db.vendas_pecas.filter(v => {
        const dataVenda = new Date(v.data_venda);
        return dataVenda.getMonth() === mesAtual && dataVenda.getFullYear() === anoAtual;
      });
      return {
        count: vendasMes.length,
        total: vendasMes.reduce((sum, v) => sum + v.valor_total, 0)
      };
    })()
  };

  return { success: true, stats };
});
