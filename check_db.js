const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:kbrfMrFmPcFTAFpoZGxNHYbHWiWOaSUQ@shinkansen.proxy.rlwy.net:47179/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkCols() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'ordens_servico'");
        console.log("Colunas OS:", res.rows.map(r => r.column_name).join(', '));
    } catch (e) { console.error(e) }
    pool.end();
}
checkCols();
