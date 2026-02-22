const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const https = require('https');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const fetch = require('node-fetch');

// Tenta carregar .env de múltiplos locais possíveis
const dotenv = require('dotenv');
const envPath = path.join(process.cwd(), '.env');
const appPath = app.isPackaged ? path.join(path.dirname(process.execPath), '.env') : envPath;

if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else if (fs.existsSync(appPath)) dotenv.config({ path: appPath });
else dotenv.config(); // Fallback para o padrão

let mainWindow;

// Configurar PostgreSQL
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('AVISO: DATABASE_URL não encontrada. O sistema tentará usar o padrão local (pode falhar).');
}

const pool = new Pool({
  connectionString: dbUrl || 'postgresql://postgres:kbrfMrFmPcFTAFpoZGxNHYbHWiWOaSUQ@shinkansen.proxy.rlwy.net:47179/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

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
    icon: path.join(__dirname, 'resources', 'icon.png'),
    title: 'SAMAPEOP - Sistema de Gerenciamento de Manutenção'
  });

  mainWindow.loadFile('www/index.html');

  // Abrir DevTools em desenvolvimento
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Quando o Electron estiver pronto
app.whenReady().then(() => {
  createWindow();

  // Configurar menu básico
  const template = [
    {
      label: 'Arquivo',
      submenu: [
        { label: 'Sair', role: 'quit' }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { label: 'Recarregar', role: 'reload' },
        { label: 'Forçar Recarregar', role: 'forcereload' },
        { label: 'Ferramentas do Desenvolvedor', role: 'toggledevtools' },
        { type: 'separator' },
        { label: 'Resetar Zoom', role: 'resetzoom' },
        { label: 'Zoom In', role: 'zoomin' },
        { label: 'Zoom Out', role: 'zoomout' },
        { type: 'separator' },
        { label: 'Tela Cheia', role: 'togglefullscreen' }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

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

// ==================== IPC HANDLERS (PostgreSQL) ====================

// Login
ipcMain.handle('login', async (event, { email, senha }) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1 AND ativo = true', [email]);
    if (result.rows.length === 0) {
      return { success: false, message: 'Usuário não encontrado ou inativo' };
    }

    const usuario = result.rows[0];
    const senhaValida = bcrypt.compareSync(senha, usuario.senha);
    if (!senhaValida) {
      return { success: false, message: 'Senha incorreta' };
    }

    const { senha: _, ...usuarioSemSenha } = usuario;
    return { success: true, usuario: usuarioSemSenha };
  } catch (error) {
    console.error('Erro no login:', error);
    return { success: false, message: 'Erro no banco de dados: ' + error.message };
  }
});

// Usuários
ipcMain.handle('criar-usuario', async (event, dados) => {
  try {
    const hashedPassword = bcrypt.hashSync(dados.senha, 10);
    const result = await pool.query(
      'INSERT INTO usuarios (nome, email, senha, cargo, ativo) VALUES ($1, $2, $3, $4, true) RETURNING id',
      [dados.nome, dados.email, hashedPassword, dados.cargo]
    );
    return { success: true, id: result.rows[0].id };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('listar-usuarios', async () => {
  try {
    const result = await pool.query('SELECT id, nome, email, cargo, ativo, created_at FROM usuarios ORDER BY nome');
    return { success: true, usuarios: result.rows };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('obter-usuario', async (event, id) => {
  try {
    const result = await pool.query('SELECT id, nome, email, cargo, ativo FROM usuarios WHERE id = $1', [id]);
    return { success: true, usuario: result.rows[0] };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('listar-logs', async () => {
  try {
    const result = await pool.query('SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 50');
    return { success: true, logs: result.rows };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Verificação de atualização real no Desktop
ipcMain.handle('verificar-atualizacao', async () => {
  try {
    const response = await fetch('https://samape20-estudioio.up.railway.app/api/check-updates');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao verificar atualização no main process:', error);
    return { success: false, message: error.message };
  }
});

// Download Interno com Progresso
ipcMain.handle('baixar-arquivo', async (event, { url, nomeArquivo }) => {
  const downloadPath = path.join(app.getPath('downloads'), nomeArquivo);

  const downloadProgressive = (targetUrl, targetPath) => {
    return new Promise((resolve, reject) => {
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      };

      https.get(targetUrl, options, (response) => {
        // Seguir redirecionamentos (301/302)
        if (response.statusCode === 301 || response.statusCode === 302) {
          return downloadProgressive(response.headers.location, targetPath).then(resolve).catch(reject);
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Erro ao baixar: ${response.statusCode}`));
          return;
        }

        const file = fs.createWriteStream(targetPath);
        const totalBytes = parseInt(response.headers['content-length'], 10);
        let downloadedBytes = 0;

        response.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          file.write(chunk);

          // Enviar progresso para o frontend (apenas se tivermos o total)
          if (totalBytes) {
            const progress = (downloadedBytes / totalBytes) * 100;
            event.sender.send('download-progress', { progress, downloadedBytes, totalBytes });
          }
        });

        response.on('end', () => {
          file.end();
          resolve({ success: true, path: targetPath });
        });

        response.on('error', (err) => {
          fs.unlink(targetPath, () => { });
          reject(err);
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
  };

  return downloadProgressive(url, downloadPath);
});

ipcMain.handle('executar-arquivo', async (event, filePath) => {
  shell.openPath(filePath);
  setTimeout(() => app.quit(), 2000); // Fecha o app atual para abrir o novo
  return { success: true };
});

ipcMain.handle('atualizar-usuario', async (event, { id, dados }) => {
  try {
    let query, params;
    if (dados.senha) {
      const hashedPassword = bcrypt.hashSync(dados.senha, 10);
      query = 'UPDATE usuarios SET nome = $1, email = $2, cargo = $3, ativo = $4, senha = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6';
      params = [dados.nome, dados.email, dados.cargo, dados.ativo, hashedPassword, id];
    } else {
      query = 'UPDATE usuarios SET nome = $1, email = $2, cargo = $3, ativo = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5';
      params = [dados.nome, dados.email, dados.cargo, dados.ativo, id];
    }
    await pool.query(query, params);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Clientes
ipcMain.handle('criar-cliente', async (event, dados) => {
  try {
    const result = await pool.query(
      'INSERT INTO clientes (nome, cnpj, telefone, email, endereco, ativo) VALUES ($1, $2, $3, $4, $5, true) RETURNING id',
      [dados.nome, dados.cnpj, dados.telefone, dados.email, dados.endereco]
    );
    return { success: true, id: result.rows[0].id };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('listar-clientes', async () => {
  try {
    const result = await pool.query('SELECT * FROM clientes WHERE ativo = true ORDER BY nome');
    return { success: true, clientes: result.rows };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('obter-cliente', async (event, id) => {
  try {
    const result = await pool.query('SELECT * FROM clientes WHERE id = $1', [id]);
    return { success: true, cliente: result.rows[0] };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('atualizar-cliente', async (event, id, dados) => {
  try {
    await pool.query(
      'UPDATE clientes SET nome = $1, cnpj = $2, telefone = $3, email = $4, endereco = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6',
      [dados.nome, dados.cnpj, dados.telefone, dados.email, dados.endereco, id]
    );
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('excluir-cliente', async (event, id) => {
  try {
    await pool.query('UPDATE clientes SET ativo = false WHERE id = $1', [id]);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Máquinas
ipcMain.handle('criar-maquina', async (event, dados) => {
  try {
    const clienteId = parseInt(dados.cliente_id);
    const ano = parseInt(dados.ano) || null;
    const tipo = dados.tipo || 'Geral';

    const result = await pool.query(
      'INSERT INTO maquinas (cliente_id, modelo, numero_serie, ano_fabricacao, observacoes, tipo, ativo) VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id',
      [clienteId, dados.modelo, dados.numero_serie, ano, dados.observacoes, tipo]
    );
    return { success: true, id: result.rows[0].id };
  } catch (error) {
    console.error('Erro ao criar máquina:', error);
    return { success: false, message: 'Erro no servidor: ' + error.message };
  }
});

ipcMain.handle('listar-maquinas', async (event, cliente_id) => {
  try {
    let query = `
      SELECT m.*, c.nome as cliente_nome 
      FROM maquinas m
      JOIN clientes c ON m.cliente_id = c.id
      WHERE m.ativo = true
    `;
    const params = [];
    if (cliente_id) {
      query += ' AND m.cliente_id = $1';
      params.push(cliente_id);
    }
    query += ' ORDER BY m.modelo';
    const result = await pool.query(query, params);
    return { success: true, maquinas: result.rows };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('obter-maquina', async (event, id) => {
  try {
    const result = await pool.query('SELECT * FROM maquinas WHERE id = $1', [id]);
    return { success: true, maquina: result.rows[0] };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('atualizar-maquina', async (event, id, dados) => {
  try {
    const clienteId = parseInt(dados.cliente_id);
    const ano = parseInt(dados.ano) || null;
    const tipo = dados.tipo || 'Geral';

    await pool.query(
      'UPDATE maquinas SET cliente_id = $1, modelo = $2, numero_serie = $3, ano_fabricacao = $4, observacoes = $5, tipo = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7',
      [clienteId, dados.modelo, dados.numero_serie, ano, dados.observacoes, tipo, id]
    );
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar máquina:', error);
    return { success: false, message: 'Erro no servidor: ' + error.message };
  }
});

ipcMain.handle('excluir-maquina', async (event, id) => {
  try {
    await pool.query('UPDATE maquinas SET ativo = false WHERE id = $1', [id]);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Ordens de Serviço
ipcMain.handle('criar-os', async (event, dados) => {
  try {
    const resCount = await pool.query('SELECT COUNT(*) FROM ordens_servico');
    const count = parseInt(resCount.rows[0].count) + 1;
    const ano = new Date().getFullYear();
    const numero_os = `OS-${ano}-${count.toString().padStart(5, '0')}`;

    // Cálculo do valor total: prioriza o valor do frontend ou calcula pela diferença de odômetros
    const valor_recebido = parseFloat(dados.valor_total);
    const km_ida = parseFloat(dados.km_ida) || 0;
    const km_volta = parseFloat(dados.km_volta) || 0;
    const valor_por_km = parseFloat(dados.valor_por_km) || 0;
    const km_percorrido = km_volta > km_ida ? (km_volta - km_ida) : 0;
    const valor_total = !isNaN(valor_recebido) ? valor_recebido :
      ((parseFloat(dados.valor_mao_obra) || 0) + (parseFloat(dados.valor_pecas) || 0) + (km_percorrido * valor_por_km));

    const result = await pool.query(
      `INSERT INTO ordens_servico 
      (numero_os, cliente_id, maquina_id, mecanico_id, status, prioridade, descricao_problema, diagnostico, km_ida, km_volta, valor_por_km, valor_mao_obra, valor_pecas, valor_total, observacoes)
      VALUES ($1, $2, $3, $4, 'ABERTA', 'MEDIA', $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
      [numero_os, parseInt(dados.cliente_id), parseInt(dados.maquina_id), parseInt(dados.mecanico_id), dados.descricao_problema, dados.diagnostico, parseFloat(dados.km_ida), parseFloat(dados.km_volta), parseFloat(dados.valor_por_km), parseFloat(dados.valor_mao_obra), parseFloat(dados.valor_pecas), valor_total, dados.observacoes]
    );
    return { success: true, id: result.rows[0].id, numero_os };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('listar-os', async (event, filtros = {}) => {
  try {
    let query = `
      SELECT os.*, c.nome as cliente_nome, m.modelo as maquina_modelo, u.nome as mecanico_nome
      FROM ordens_servico os
      JOIN clientes c ON os.cliente_id = c.id
      JOIN maquinas m ON os.maquina_id = m.id
      JOIN usuarios u ON os.mecanico_id = u.id
    `;
    const params = [];
    if (filtros.status) {
      query += ' WHERE os.status = $1';
      params.push(filtros.status);
    }
    query += ' ORDER BY os.data_abertura DESC';
    const result = await pool.query(query, params);
    return { success: true, ordens: result.rows };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('obter-os', async (event, id) => {
  try {
    const query = `
      SELECT os.*, 
             c.nome as cliente_nome, c.cnpj as cliente_cnpj, c.telefone as cliente_telefone, c.endereco as cliente_endereco,
             m.modelo as maquina_modelo, m.numero_serie as maquina_serie, m.ano_fabricacao as maquina_ano,
             u.nome as mecanico_nome, u.email as mecanico_email
      FROM ordens_servico os
      JOIN clientes c ON os.cliente_id = c.id
      JOIN maquinas m ON os.maquina_id = m.id
      JOIN usuarios u ON os.mecanico_id = u.id
      WHERE os.id = $1
    `;
    const result = await pool.query(query, [id]);
    return { success: true, os: result.rows[0] };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('excluir-os', async (event, id) => {
  try {
    await pool.query('DELETE FROM ordens_servico WHERE id = $1', [id]);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('atualizar-os', async (event, { id, dados }) => {
  try {
    // Cálculo do valor total: prioriza o valor do frontend ou calcula pela diferença de odômetros
    const valor_recebido = parseFloat(dados.valor_total);
    const km_ida = parseFloat(dados.km_ida) || 0;
    const km_volta = parseFloat(dados.km_volta) || 0;
    const valor_por_km = parseFloat(dados.valor_por_km) || 0;
    const km_percorrido = km_volta > km_ida ? (km_volta - km_ida) : 0;
    const valor_total = !isNaN(valor_recebido) ? valor_recebido :
      ((parseFloat(dados.valor_mao_obra) || 0) + (parseFloat(dados.valor_pecas) || 0) + (km_percorrido * valor_por_km));

    // Se o status for FECHADA e não houver data_fechamento, define como agora
    let dataFechamento = dados.data_fechamento;
    if (dados.status === 'FECHADA' && !dataFechamento) {
      dataFechamento = new Date();
    }

    await pool.query(
      `UPDATE ordens_servico 
       SET cliente_id = $1, maquina_id = $2, mecanico_id = $3, status = $4, 
           descricao_problema = $5, diagnostico = $6, km_ida = $7, km_volta = $8, 
           valor_por_km = $9, valor_mao_obra = $10, valor_pecas = $11, 
           valor_total = $12, observacoes = $13, data_fechamento = $14,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $15`,
      [
        parseInt(dados.cliente_id),
        parseInt(dados.maquina_id),
        parseInt(dados.mecanico_id),
        dados.status,
        dados.descricao_problema,
        dados.diagnostico,
        parseFloat(dados.km_ida) || 0,
        parseFloat(dados.km_volta) || 0,
        parseFloat(dados.valor_por_km) || 0,
        parseFloat(dados.valor_mao_obra) || 0,
        parseFloat(dados.valor_pecas) || 0,
        valor_total,
        dados.observacoes,
        dataFechamento,
        id
      ]
    );
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar OS:', error);
    return { success: false, message: error.message };
  }
});

// Peças
ipcMain.handle('criar-peca', async (event, dados) => {
  try {
    const result = await pool.query(
      'INSERT INTO pecas (codigo, nome, preco_custo, preco_venda, quantidade_estoque, estoque_minimo, ativo) VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id',
      [dados.codigo, dados.descricao, parseFloat(dados.preco_custo), parseFloat(dados.preco_venda), parseInt(dados.estoque_atual), parseInt(dados.estoque_minimo)]
    );
    return { success: true, id: result.rows[0].id };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('listar-pecas', async () => {
  try {
    const result = await pool.query('SELECT * FROM pecas WHERE ativo = true ORDER BY nome');
    return { success: true, pecas: result.rows };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('obter-peca', async (event, id) => {
  try {
    const result = await pool.query('SELECT * FROM pecas WHERE id = $1', [id]);
    return { success: true, peca: result.rows[0] };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('atualizar-peca', async (event, id, dados) => {
  try {
    await pool.query(
      'UPDATE pecas SET codigo = $1, nome = $2, preco_custo = $3, preco_venda = $4, quantidade_estoque = $5, estoque_minimo = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7',
      [dados.codigo, dados.descricao, parseFloat(dados.preco_custo), parseFloat(dados.preco_venda), parseInt(dados.estoque_atual), parseInt(dados.estoque_minimo), id]
    );
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('excluir-peca', async (event, id) => {
  try {
    await pool.query('UPDATE pecas SET ativo = false WHERE id = $1', [id]);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Vendas e Financeiro
ipcMain.handle('listar-vendas', async () => {
  try {
    const result = await pool.query(`
      SELECT v.*, c.nome as cliente_nome, u.nome as vendedor_nome
      FROM vendas v
      JOIN clientes c ON v.cliente_id = c.id
      JOIN usuarios u ON v.vendedor_id = u.id
      ORDER BY v.data_venda DESC
    `);
    return { success: true, vendas: result.rows };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('listar-contas-receber', async (event, filtros = {}) => {
  try {
    let query = 'SELECT cr.*, c.nome as cliente_nome FROM contas_receber cr JOIN clientes c ON cr.cliente_id = c.id';
    const params = [];
    if (filtros.status) {
      query += ' WHERE cr.status = $1';
      params.push(filtros.status);
    }
    query += ' ORDER BY cr.data_vencimento';
    const result = await pool.query(query, params);
    return { success: true, contas: result.rows };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('listar-contas-pagar', async (event, filtros = {}) => {
  try {
    let query = 'SELECT * FROM contas_pagar';
    const params = [];
    if (filtros.status) {
      query += ' WHERE status = $1';
      params.push(filtros.status);
    }
    query += ' ORDER BY data_vencimento';
    const result = await pool.query(query, params);
    return { success: true, contas: result.rows };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Estatísticas para o Dashboard
ipcMain.handle('obter-estatisticas', async () => {
  try {
    const osAbertas = await pool.query("SELECT COUNT(*) FROM ordens_servico WHERE status = 'ABERTA'");
    const osAndamento = await pool.query("SELECT COUNT(*) FROM ordens_servico WHERE status = 'EM_ANDAMENTO'");
    const pecasBaixas = await pool.query("SELECT COUNT(*) FROM pecas WHERE quantidade_estoque <= estoque_minimo AND ativo = true");

    const hoje = new Date();
    const mes = hoje.getMonth() + 1;
    const ano = hoje.getFullYear();
    const vendasMes = await pool.query("SELECT COUNT(*), SUM(valor_final) FROM vendas WHERE EXTRACT(MONTH FROM data_venda) = $1 AND EXTRACT(YEAR FROM data_venda) = $2", [mes, ano]);

    return {
      success: true,
      stats: {
        os_abertas: parseInt(osAbertas.rows[0].count),
        os_em_andamento: parseInt(osAndamento.rows[0].count),
        pecas_estoque_baixo: parseInt(pecasBaixas.rows[0].count),
        vendas_mes: {
          count: parseInt(vendasMes.rows[0].count),
          total: parseFloat(vendasMes.rows[0].sum) || 0
        }
      }
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('criar-venda', async (event, dados) => {
  try {
    const resCount = await pool.query('SELECT COUNT(*) FROM vendas');
    const count = parseInt(resCount.rows[0].count) + 1;
    const numero_venda = `VEN-${new Date().getFullYear()}-${count.toString().padStart(5, '0')}`;
    const result = await pool.query(
      `INSERT INTO vendas (numero_venda, cliente_id, vendedor_id, valor_total, valor_final, status, data_venda) 
       VALUES ($1, $2, $3, $4, $4, 'PENDENTE', CURRENT_TIMESTAMP) RETURNING id`,
      [numero_venda, parseInt(dados.cliente_id), parseInt(dados.vendedor_id), parseFloat(dados.valor_total)]
    );
    return { success: true, id: result.rows[0].id };
  } catch (error) {
    return { success: false, message: error.message };
  }
});
