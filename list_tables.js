const { Client } = require('pg');

const oldDbUrl = 'postgresql://postgres:qUngJAyBvLWQdkmSkZEjjEoMoDVzOBnx@trolley.proxy.rlwy.net:22285/railway';

async function listTables() {
    const client = new Client({ connectionString: oldDbUrl });
    try {
        await client.connect();
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
        console.log(res.rows.map(t => t.table_name).join(', '));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

listTables();
