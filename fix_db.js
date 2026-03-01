const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:kbrfMrFmPcFTAFpoZGxNHYbHWiWOaSUQ@shinkansen.proxy.rlwy.net:47179/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

async function fixDb() {
    try {
        console.log('Adicionando coluna maquina_modelo...');
        await pool.query('ALTER TABLE listagens_pecas ADD COLUMN IF NOT EXISTS maquina_modelo VARCHAR(255)');
        console.log('✅ Coluna maquina_modelo adicionada com sucesso.');

        // Aproveitar para garantir que a tabela listagem_pecas_itens foi criada corretamente
        await pool.query(`
      CREATE TABLE IF NOT EXISTS listagem_pecas_itens (
          id SERIAL PRIMARY KEY,
          listagem_id INTEGER REFERENCES listagens_pecas(id) ON DELETE CASCADE,
          peca_id INTEGER REFERENCES pecas(id),
          quantidade DECIMAL(10,2) NOT NULL,
          preco_unitario DECIMAL(10,2) NOT NULL,
          preco_total DECIMAL(10,2) NOT NULL
      )
    `);
        console.log('✅ Tabela listagem_pecas_itens verificada.');

    } catch (err) {
        console.error('Erro:', err);
    } finally {
        pool.end();
    }
}

fixDb();
