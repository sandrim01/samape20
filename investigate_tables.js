const { Client } = require('pg');

const oldDbUrl = 'postgresql://postgres:qUngJAyBvLWQdkmSkZEjjEoMoDVzOBnx@trolley.proxy.rlwy.net:22285/railway';

async function investigate() {
    const client = new Client({ connectionString: oldDbUrl });
    try {
        await client.connect();

        const tables = ['client', 'equipment', 'service_order', 'user', 'part'];

        for (const table of tables) {
            console.log(`\n--- Columns for ${table} ---`);
            const res = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1
                ORDER BY ordinal_position
            `, [table]);
            console.table(res.rows);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

investigate();
