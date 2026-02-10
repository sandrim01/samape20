const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'samapeop-secret-key-2026';
// Version: 2026-02-10 12:40 (Fixed Deploy)

// Configurar PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir arquivos estáticos (Front-end)
app.use(express.static(path.join(__dirname, 'www')));

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token não fornecido' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

// ==================== ROTAS DE AUTENTICAÇÃO ====================

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        const result = await pool.query(
            'SELECT * FROM usuarios WHERE email = $1 AND ativo = true',
            [email]
        );

        if (result.rows.length === 0) {
            return res.json({ success: false, message: 'Usuário não encontrado' });
        }

        const user = result.rows[0];
        const senhaValida = await bcrypt.compare(senha, user.senha);

        if (!senhaValida) {
            return res.json({ success: false, message: 'Senha incorreta' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, cargo: user.cargo },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                cargo: user.cargo
            },
            token
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// ==================== ROTAS DE USUÁRIOS ====================

// Listar usuários
app.get('/api/usuarios', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, nome, email, cargo, ativo, created_at FROM usuarios WHERE ativo = true ORDER BY nome'
        );
        res.json({ success: true, users: result.rows });
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// Criar usuário
app.post('/api/usuarios', authenticateToken, async (req, res) => {
    try {
        const { nome, email, senha, cargo } = req.body;

        // Verificar se usuário já existe
        const exists = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (exists.rows.length > 0) {
            return res.json({ success: false, message: 'Este e-mail já está cadastrado' });
        }

        const hashedPassword = await bcrypt.hash(senha, 10);
        const result = await pool.query(
            `INSERT INTO usuarios (nome, email, senha, cargo, ativo)
             VALUES ($1, $2, $3, $4, true)
             RETURNING id, nome, email, cargo`,
            [nome, email, hashedPassword, cargo]
        );

        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// Atualizar usuário
app.put('/api/usuarios/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, senha, cargo, ativo } = req.body;

        let query = 'UPDATE usuarios SET nome = $1, email = $2, cargo = $3, ativo = $4';
        let params = [nome, email, cargo, ativo];

        if (senha) {
            const hashedPassword = await bcrypt.hash(senha, 10);
            query += ', senha = $5 WHERE id = $6';
            params.push(hashedPassword, id);
        } else {
            query += ' WHERE id = $5';
            params.push(id);
        }

        const result = await pool.query(query + ' RETURNING id, nome, email, cargo, ativo', params);
        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// ==================== ROTAS DE CLIENTES ====================

// Listar clientes
app.get('/api/clientes', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM clientes WHERE ativo = true ORDER BY nome'
        );
        res.json({ success: true, clientes: result.rows });
    } catch (error) {
        console.error('Erro ao listar clientes:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// Criar cliente
app.post('/api/clientes', authenticateToken, async (req, res) => {
    try {
        const { nome, cnpj, cpf, telefone, email, endereco, cidade, estado, cep, observacoes } = req.body;

        const result = await pool.query(
            `INSERT INTO clientes (nome, cnpj, cpf, telefone, email, endereco, cidade, estado, cep, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
            [nome, cnpj, cpf, telefone, email, endereco, cidade, estado, cep, observacoes]
        );

        res.json({ success: true, cliente: result.rows[0] });
    } catch (error) {
        console.error('Erro ao criar cliente:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// Atualizar cliente
app.put('/api/clientes/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, cnpj, cpf, telefone, email, endereco, cidade, estado, cep, observacoes } = req.body;

        const result = await pool.query(
            `UPDATE clientes 
       SET nome = $1, cnpj = $2, cpf = $3, telefone = $4, email = $5,
           endereco = $6, cidade = $7, estado = $8, cep = $9, observacoes = $10,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
            [nome, cnpj, cpf, telefone, email, endereco, cidade, estado, cep, observacoes, id]
        );

        res.json({ success: true, cliente: result.rows[0] });
    } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// Deletar cliente
app.delete('/api/clientes/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE clientes SET ativo = false WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao deletar cliente:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// ==================== ROTAS DE MÁQUINAS ====================

// Listar máquinas
app.get('/api/maquinas', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT m.*, c.nome as cliente_nome 
       FROM maquinas m
       LEFT JOIN clientes c ON m.cliente_id = c.id
       WHERE m.ativo = true
       ORDER BY m.modelo`
        );
        res.json({ success: true, maquinas: result.rows });
    } catch (error) {
        console.error('Erro ao listar máquinas:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// Criar máquina
app.post('/api/maquinas', authenticateToken, async (req, res) => {
    try {
        const { cliente_id, modelo, numero_serie, observacoes } = req.body;

        // Mapeamento de campos do Front-end para o Banco
        const tipo = req.body.tipo || 'Geral';
        const ano_fabricacao = req.body.ano_fabricacao || req.body.ano || null;
        const horas_uso = req.body.horas_uso || 0;

        const result = await pool.query(
            `INSERT INTO maquinas (cliente_id, tipo, modelo, numero_serie, ano_fabricacao, horas_uso, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [cliente_id, tipo, modelo, numero_serie, ano_fabricacao, horas_uso, observacoes]
        );

        res.json({ success: true, maquina: result.rows[0] });
    } catch (error) {
        console.error('Erro ao criar máquina:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor: ' + error.message });
    }
});

// Atualizar máquina
app.put('/api/maquinas/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { cliente_id, tipo, modelo, numero_serie, ano_fabricacao, horas_uso, observacoes } = req.body;

        const result = await pool.query(
            `UPDATE maquinas 
       SET cliente_id = $1, tipo = $2, modelo = $3, numero_serie = $4, 
           ano_fabricacao = $5, horas_uso = $6, observacoes = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
            [cliente_id, tipo, modelo, numero_serie, ano_fabricacao, horas_uso, observacoes, id]
        );

        res.json({ success: true, maquina: result.rows[0] });
    } catch (error) {
        console.error('Erro ao atualizar máquina:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// ==================== ROTAS DE ORDENS DE SERVIÇO ====================

// Listar ordens de serviço
app.get('/api/ordens', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT os.*, 
              c.nome as cliente_nome,
              m.modelo as maquina_modelo,
              u.nome as mecanico_nome
       FROM ordens_servico os
       LEFT JOIN clientes c ON os.cliente_id = c.id
       LEFT JOIN maquinas m ON os.maquina_id = m.id
       LEFT JOIN usuarios u ON os.mecanico_id = u.id
       ORDER BY os.data_abertura DESC`
        );
        res.json({ success: true, ordens: result.rows });
    } catch (error) {
        console.error('Erro ao listar ordens:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// Obter OS específica (para PDF)
app.get('/api/ordens/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT os.*,
              c.nome as cliente_nome, c.cnpj as cliente_cnpj, c.telefone as cliente_telefone,
              c.email as cliente_email, c.endereco as cliente_endereco,
              m.modelo as maquina_modelo, m.numero_serie as maquina_serie,
              m.ano_fabricacao as maquina_ano, m.tipo as maquina_tipo,
              u.nome as mecanico_nome
       FROM ordens_servico os
       LEFT JOIN clientes c ON os.cliente_id = c.id
       LEFT JOIN maquinas m ON os.maquina_id = m.id
       LEFT JOIN usuarios u ON os.mecanico_id = u.id
       WHERE os.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.json({ success: false, message: 'OS não encontrada' });
        }

        res.json({ success: true, os: result.rows[0] });
    } catch (error) {
        console.error('Erro ao obter OS:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// Criar ordem de serviço
app.post('/api/ordens', authenticateToken, async (req, res) => {
    try {
        const {
            cliente_id, maquina_id, mecanico_id, status, prioridade,
            descricao_problema, diagnostico, observacoes
        } = req.body;

        // Mapeamento de campos do front-end
        const servicos_realizados = req.body.servicos_realizados || req.body.solucao || '';
        const valor_mao_obra = parseFloat(req.body.valor_mao_obra) || 0;
        const valor_pecas = parseFloat(req.body.valor_pecas) || 0;

        // Cálculo de valor total se necessário
        const km_ida = parseFloat(req.body.km_ida) || 0;
        const km_volta = parseFloat(req.body.km_volta) || 0;
        const valor_por_km = parseFloat(req.body.valor_por_km) || 0;
        const valor_total = req.body.valor_total || (valor_mao_obra + valor_pecas + ((km_ida + km_volta) * valor_por_km));

        // Gerar número da OS se não fornecido
        let numero_os = req.body.numero_os;
        if (!numero_os) {
            const ano = new Date().getFullYear();
            const countResult = await pool.query(
                "SELECT COUNT(*) FROM ordens_servico WHERE numero_os LIKE $1",
                [`OS-${ano}-%`]
            );
            const proximo = parseInt(countResult.rows[0].count) + 1;
            numero_os = `OS-${ano}-${proximo.toString().padStart(5, '0')}`;
        }

        const result = await pool.query(
            `INSERT INTO ordens_servico 
       (numero_os, cliente_id, maquina_id, mecanico_id, status, prioridade,
        descricao_problema, diagnostico, servicos_realizados,
        valor_mao_obra, valor_pecas, valor_total, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
            [numero_os, cliente_id, maquina_id, mecanico_id, status || 'ABERTA', prioridade || 'MEDIA',
                descricao_problema, diagnostico, servicos_realizados,
                valor_mao_obra, valor_pecas, valor_total, observacoes]
        );

        res.json({ success: true, ordem: result.rows[0], numero_os });
    } catch (error) {
        console.error('Erro ao criar ordem:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor: ' + error.message });
    }
});

// Atualizar ordem de serviço
app.put('/api/ordens/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            status, prioridade, descricao_problema, diagnostico,
            servicos_realizados, valor_mao_obra, valor_pecas, valor_total,
            observacoes, data_fechamento
        } = req.body;

        const result = await pool.query(
            `UPDATE ordens_servico 
       SET status = $1, prioridade = $2, descricao_problema = $3, 
           diagnostico = $4, servicos_realizados = $5, valor_mao_obra = $6, 
           valor_pecas = $7, valor_total = $8, observacoes = $9, 
           data_fechamento = $10, updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
            [status, prioridade, descricao_problema, diagnostico,
                servicos_realizados, valor_mao_obra, valor_pecas, valor_total,
                observacoes, data_fechamento, id]
        );

        res.json({ success: true, ordem: result.rows[0] });
    } catch (error) {
        console.error('Erro ao atualizar ordem:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// ==================== ROTAS DE PEÇAS ====================

// Listar peças
app.get('/api/pecas', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM pecas WHERE ativo = true ORDER BY nome'
        );
        res.json({ success: true, pecas: result.rows });
    } catch (error) {
        console.error('Erro ao listar peças:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// Criar peça
app.post('/api/pecas', authenticateToken, async (req, res) => {
    try {
        const { codigo, nome, descricao, categoria, fabricante, quantidade_estoque, estoque_minimo, preco_custo, preco_venda } = req.body;
        const result = await pool.query(
            `INSERT INTO pecas (codigo, nome, descricao, categoria, fabricante, quantidade_estoque, estoque_minimo, preco_custo, preco_venda)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [codigo, nome, descricao, categoria, fabricante, quantidade_estoque, estoque_minimo, preco_custo, preco_venda]
        );
        res.json({ success: true, peca: result.rows[0] });
    } catch (error) {
        console.error('Erro ao criar peça:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// Atualizar estoque
app.patch('/api/pecas/:id/estoque', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { quantidade } = req.body;
        const result = await pool.query(
            'UPDATE pecas SET quantidade_estoque = quantidade_estoque + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [quantidade, id]
        );
        res.json({ success: true, peca: result.rows[0] });
    } catch (error) {
        console.error('Erro ao atualizar estoque:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// ==================== ROTAS DE VENDAS ====================

// Listar vendas
app.get('/api/vendas', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT v.*, c.nome as cliente_nome, u.nome as vendedor_nome
       FROM vendas v
       LEFT JOIN clientes c ON v.cliente_id = c.id
       LEFT JOIN usuarios u ON v.vendedor_id = u.id
       ORDER BY v.data_venda DESC`
        );
        res.json({ success: true, vendas: result.rows });
    } catch (error) {
        console.error('Erro ao listar vendas:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// Criar venda
app.post('/api/vendas', authenticateToken, async (req, res) => {
    try {
        const { cliente_id, vendedor_id, valor_total, desconto, valor_final, forma_pagamento, observacoes, itens } = req.body;

        const numero_venda = 'VEN-' + Date.now();

        const result = await pool.query(
            `INSERT INTO vendas (numero_venda, cliente_id, vendedor_id, valor_total, desconto, valor_final, forma_pagamento, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'PAGO') RETURNING *`,
            [numero_venda, cliente_id, vendedor_id, valor_total, desconto, valor_final, forma_pagamento]
        );

        res.json({ success: true, venda: result.rows[0] });
    } catch (error) {
        console.error('Erro ao criar venda:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// ==================== ROTAS DE CONTAS ====================

// Listar contas a receber
app.get('/api/contas-receber', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT cr.*, c.nome as cliente_nome
       FROM contas_receber cr
       LEFT JOIN clientes c ON cr.cliente_id = c.id
       ORDER BY cr.data_vencimento`
        );
        res.json({ success: true, contas: result.rows });
    } catch (error) {
        console.error('Erro ao listar contas a receber:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// Registrar pagamento a receber
app.post('/api/contas-receber/:id/pagar', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { data_pagamento } = req.body;
        const result = await pool.query(
            "UPDATE contas_receber SET status = 'PAGO', data_pagamento = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
            [data_pagamento || new Date(), id]
        );
        res.json({ success: true, conta: result.rows[0] });
    } catch (error) {
        console.error('Erro ao pagar conta a receber:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// Listar contas a pagar
app.get('/api/contas-pagar', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM contas_pagar ORDER BY data_vencimento'
        );
        res.json({ success: true, contas: result.rows });
    } catch (error) {
        console.error('Erro ao listar contas a pagar:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// Criar conta a pagar
app.post('/api/contas-pagar', authenticateToken, async (req, res) => {
    try {
        const { fornecedor, descricao, categoria, valor, data_vencimento, observacoes } = req.body;
        const result = await pool.query(
            `INSERT INTO contas_pagar (fornecedor, descricao, categoria, valor, data_vencimento, status)
             VALUES ($1, $2, $3, $4, $5, 'PENDENTE') RETURNING *`,
            [fornecedor, descricao, categoria, valor, data_vencimento]
        );
        res.json({ success: true, conta: result.rows[0] });
    } catch (error) {
        console.error('Erro ao criar conta a pagar:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// Registrar pagamento a pagar
app.post('/api/contas-pagar/:id/pagar', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { data_pagamento } = req.body;
        const result = await pool.query(
            "UPDATE contas_pagar SET status = 'PAGO', data_pagamento = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
            [data_pagamento || new Date(), id]
        );
        res.json({ success: true, conta: result.rows[0] });
    } catch (error) {
        console.error('Erro ao pagar conta a pagar:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// ==================== ROTA DE ESTATÍSTICAS ====================

app.get('/api/stats', authenticateToken, async (req, res) => {
    try {
        const stats = {};

        // Total de clientes
        const clientesResult = await pool.query('SELECT COUNT(*) FROM clientes WHERE ativo = true');
        stats.totalClientes = parseInt(clientesResult.rows[0].count);

        // Total de máquinas
        const maquinasResult = await pool.query('SELECT COUNT(*) FROM maquinas WHERE ativo = true');
        stats.totalMaquinas = parseInt(maquinasResult.rows[0].count);

        // Total de OS
        const osResult = await pool.query('SELECT COUNT(*) FROM ordens_servico');
        stats.totalOrdens = parseInt(osResult.rows[0].count);

        // OS abertas
        const osAbertasResult = await pool.query("SELECT COUNT(*) FROM ordens_servico WHERE status IN ('ABERTA', 'EM_ANDAMENTO')");
        stats.ordensAbertas = parseInt(osAbertasResult.rows[0].count);

        // Receita total
        const receitaResult = await pool.query('SELECT COALESCE(SUM(valor_total), 0) as total FROM ordens_servico WHERE status = $1', ['FECHADA']);
        stats.receitaTotal = parseFloat(receitaResult.rows[0].total);

        res.json({ success: true, stats });
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// ==================== ROTA DE TESTE ====================

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'API SAMAPEOP funcionando!',
        version: 'v1.0.1-hotfix-deploy',
        timestamp: new Date()
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`\n🚀 API SAMAPEOP rodando na porta ${PORT}`);
    console.log(`📡 http://localhost:${PORT}`);
    console.log(`🔗 Database: ${process.env.DATABASE_URL ? 'PostgreSQL (Railway)' : 'Não configurado'}`);
    console.log(`\n✅ Rotas disponíveis:`);
    console.log(`   POST   /api/login`);
    console.log(`   GET    /api/usuarios`);
    console.log(`   POST   /api/usuarios`);
    console.log(`   PUT    /api/usuarios/:id`);
    console.log(`   GET    /api/clientes`);
    console.log(`   POST   /api/clientes`);
    console.log(`   PUT    /api/clientes/:id`);
    console.log(`   GET    /api/maquinas`);
    console.log(`   POST   /api/maquinas`);
    console.log(`   GET    /api/ordens`);
    console.log(`   POST   /api/ordens`);
    console.log(`   GET    /api/ordens/:id`);
    console.log(`   GET    /api/pecas`);
    console.log(`   GET    /api/vendas`);
    console.log(`   GET    /api/contas-receber`);
    console.log(`   GET    /api/contas-pagar`);
    console.log(`   GET    /api/stats`);
    console.log(`   GET    /api/health`);
});

module.exports = app;
