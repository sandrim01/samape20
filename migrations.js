const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runMigrations() {
    try {
        await client.connect();
        console.log('✅ Conectado ao PostgreSQL na Railway');

        // 1. Criar tabela de usuários
        console.log('\n📋 Criando tabela: usuarios');
        await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        cargo VARCHAR(50) NOT NULL CHECK (cargo IN ('ADMIN', 'DIRETOR', 'FINANCEIRO', 'VENDAS', 'MECANICO')),
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Tabela usuarios criada');

        // 2. Criar tabela de clientes
        console.log('\n📋 Criando tabela: clientes');
        await client.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        cnpj VARCHAR(18) UNIQUE,
        cpf VARCHAR(14) UNIQUE,
        telefone VARCHAR(20),
        email VARCHAR(255),
        endereco TEXT,
        cidade VARCHAR(100),
        estado VARCHAR(2),
        cep VARCHAR(10),
        observacoes TEXT,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Tabela clientes criada');

        // 3. Criar tabela de máquinas
        console.log('\n📋 Criando tabela: maquinas');
        await client.query(`
      CREATE TABLE IF NOT EXISTS maquinas (
        id SERIAL PRIMARY KEY,
        cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
        tipo VARCHAR(100) NOT NULL,
        modelo VARCHAR(255) NOT NULL,
        numero_serie VARCHAR(255) UNIQUE NOT NULL,
        ano_fabricacao INTEGER,
        horas_uso DECIMAL(10, 2),
        observacoes TEXT,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Tabela maquinas criada');

        // 4. Criar tabela de ordens de serviço
        console.log('\n📋 Criando tabela: ordens_servico');
        await client.query(`
      CREATE TABLE IF NOT EXISTS ordens_servico (
        id SERIAL PRIMARY KEY,
        numero_os VARCHAR(50) UNIQUE NOT NULL,
        cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
        maquina_id INTEGER REFERENCES maquinas(id) ON DELETE CASCADE,
        mecanico_id INTEGER REFERENCES usuarios(id),
        data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_fechamento TIMESTAMP,
        status VARCHAR(50) NOT NULL CHECK (status IN ('ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_PECAS', 'FECHADA', 'CANCELADA')),
        prioridade VARCHAR(50) CHECK (prioridade IN ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE')),
        descricao_problema TEXT NOT NULL,
        diagnostico TEXT,
        servicos_realizados TEXT,
        valor_mao_obra DECIMAL(10, 2) DEFAULT 0,
        valor_pecas DECIMAL(10, 2) DEFAULT 0,
        valor_total DECIMAL(10, 2) DEFAULT 0,
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Tabela ordens_servico criada');

        // 5. Criar tabela de peças
        console.log('\n📋 Criando tabela: pecas');
        await client.query(`
      CREATE TABLE IF NOT EXISTS pecas (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(100) UNIQUE NOT NULL,
        nome VARCHAR(255) NOT NULL,
        descricao TEXT,
        categoria VARCHAR(100),
        fabricante VARCHAR(255),
        quantidade_estoque INTEGER DEFAULT 0,
        estoque_minimo INTEGER DEFAULT 0,
        preco_custo DECIMAL(10, 2),
        preco_venda DECIMAL(10, 2),
        localizacao VARCHAR(255),
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Tabela pecas criada');

        // 6. Criar tabela de peças usadas nas OS
        console.log('\n📋 Criando tabela: os_pecas');
        await client.query(`
      CREATE TABLE IF NOT EXISTS os_pecas (
        id SERIAL PRIMARY KEY,
        os_id INTEGER REFERENCES ordens_servico(id) ON DELETE CASCADE,
        peca_id INTEGER REFERENCES pecas(id),
        quantidade INTEGER NOT NULL,
        preco_unitario DECIMAL(10, 2) NOT NULL,
        preco_total DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Tabela os_pecas criada');

        // 7. Criar tabela de vendas de peças
        console.log('\n📋 Criando tabela: vendas');
        await client.query(`
      CREATE TABLE IF NOT EXISTS vendas (
        id SERIAL PRIMARY KEY,
        numero_venda VARCHAR(50) UNIQUE NOT NULL,
        cliente_id INTEGER REFERENCES clientes(id),
        vendedor_id INTEGER REFERENCES usuarios(id),
        data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        valor_total DECIMAL(10, 2) NOT NULL,
        desconto DECIMAL(10, 2) DEFAULT 0,
        valor_final DECIMAL(10, 2) NOT NULL,
        forma_pagamento VARCHAR(50),
        status VARCHAR(50) CHECK (status IN ('PENDENTE', 'PAGO', 'CANCELADO')),
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Tabela vendas criada');

        // 8. Criar tabela de itens de venda
        console.log('\n📋 Criando tabela: venda_itens');
        await client.query(`
      CREATE TABLE IF NOT EXISTS venda_itens (
        id SERIAL PRIMARY KEY,
        venda_id INTEGER REFERENCES vendas(id) ON DELETE CASCADE,
        peca_id INTEGER REFERENCES pecas(id),
        quantidade INTEGER NOT NULL,
        preco_unitario DECIMAL(10, 2) NOT NULL,
        preco_total DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Tabela venda_itens criada');

        // 9. Criar tabela de contas a receber
        console.log('\n📋 Criando tabela: contas_receber');
        await client.query(`
      CREATE TABLE IF NOT EXISTS contas_receber (
        id SERIAL PRIMARY KEY,
        cliente_id INTEGER REFERENCES clientes(id),
        os_id INTEGER REFERENCES ordens_servico(id),
        venda_id INTEGER REFERENCES vendas(id),
        descricao VARCHAR(255) NOT NULL,
        valor DECIMAL(10, 2) NOT NULL,
        data_vencimento DATE NOT NULL,
        data_pagamento DATE,
        status VARCHAR(50) CHECK (status IN ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO')),
        forma_pagamento VARCHAR(50),
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Tabela contas_receber criada');

        // 10. Criar tabela de contas a pagar
        console.log('\n📋 Criando tabela: contas_pagar');
        await client.query(`
      CREATE TABLE IF NOT EXISTS contas_pagar (
        id SERIAL PRIMARY KEY,
        fornecedor VARCHAR(255) NOT NULL,
        descricao VARCHAR(255) NOT NULL,
        categoria VARCHAR(100),
        valor DECIMAL(10, 2) NOT NULL,
        data_vencimento DATE NOT NULL,
        data_pagamento DATE,
        status VARCHAR(50) CHECK (status IN ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO')),
        forma_pagamento VARCHAR(50),
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Tabela contas_pagar criada');

        // 11. Criar índices para melhor performance
        console.log('\n📋 Criando índices...');
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_clientes_cnpj ON clientes(cnpj);
      CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf);
      CREATE INDEX IF NOT EXISTS idx_maquinas_cliente ON maquinas(cliente_id);
      CREATE INDEX IF NOT EXISTS idx_os_cliente ON ordens_servico(cliente_id);
      CREATE INDEX IF NOT EXISTS idx_os_maquina ON ordens_servico(maquina_id);
      CREATE INDEX IF NOT EXISTS idx_os_status ON ordens_servico(status);
      CREATE INDEX IF NOT EXISTS idx_os_data ON ordens_servico(data_abertura);
      CREATE INDEX IF NOT EXISTS idx_pecas_codigo ON pecas(codigo);
      CREATE INDEX IF NOT EXISTS idx_vendas_cliente ON vendas(cliente_id);
      CREATE INDEX IF NOT EXISTS idx_contas_receber_status ON contas_receber(status);
      CREATE INDEX IF NOT EXISTS idx_contas_pagar_status ON contas_pagar(status);
    `);
        console.log('✅ Índices criados');

        // 12. Inserir usuário admin padrão
        console.log('\n📋 Inserindo usuário admin...');
        const bcrypt = require('bcryptjs');
        const senhaHash = await bcrypt.hash('admin123', 10);

        await client.query(`
      INSERT INTO usuarios (nome, email, senha, cargo)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING;
    `, ['Administrador', 'admin@samapeop.com', senhaHash, 'ADMIN']);
        console.log('✅ Usuário admin criado');

        console.log('\n🎉 MIGRATIONS CONCLUÍDAS COM SUCESSO!');
        console.log('\n📊 Tabelas criadas:');
        console.log('  ✅ usuarios');
        console.log('  ✅ clientes');
        console.log('  ✅ maquinas');
        console.log('  ✅ ordens_servico');
        console.log('  ✅ pecas');
        console.log('  ✅ os_pecas');
        console.log('  ✅ vendas');
        console.log('  ✅ venda_itens');
        console.log('  ✅ contas_receber');
        console.log('  ✅ contas_pagar');
        console.log('\n👤 Usuário padrão:');
        console.log('  Email: admin@samapeop.com');
        console.log('  Senha: admin123');

    } catch (error) {
        console.error('❌ Erro ao executar migrations:', error);
        throw error;
    } finally {
        await client.end();
        console.log('\n✅ Conexão fechada');
    }
}

// Executar migrations
runMigrations()
    .then(() => {
        console.log('\n✅ Processo concluído!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erro fatal:', error);
        process.exit(1);
    });
