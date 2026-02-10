const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function verificarBanco() {
    try {
        // Verificar tabelas
        const tabelas = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

        console.log('\n✅ MIGRAÇÃO DO BANCO - STATUS:\n');
        console.log('📊 TABELAS CRIADAS:');
        tabelas.rows.forEach((t, i) => {
            console.log(`   ${i + 1}. ${t.table_name}`);
        });

        // Verificar usuários
        const usuarios = await pool.query('SELECT COUNT(*) FROM usuarios');
        console.log(`\n👤 USUÁRIOS: ${usuarios.rows[0].count}`);

        // Verificar admin
        const admin = await pool.query("SELECT nome, email, cargo FROM usuarios WHERE email = 'admin@samapeop.com'");
        if (admin.rows.length > 0) {
            console.log(`   ✅ Admin: ${admin.rows[0].nome} (${admin.rows[0].cargo})`);
        }

        console.log('\n✅ BANCO DE DADOS: 100% OPERACIONAL\n');

    } catch (error) {
        console.error('\n❌ ERRO:', error.message);
    } finally {
        await pool.end();
    }
}

verificarBanco();
