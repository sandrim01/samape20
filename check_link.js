const { Client } = require('pg');

const oldDbUrl = 'postgresql://postgres:qUngJAyBvLWQdkmSkZEjjEoMoDVzOBnx@trolley.proxy.rlwy.net:22285/railway';

async function checkLinkTable() {
    const client = new Client({ connectionString: oldDbUrl });
    try {
        await client.connect();

        console.log('--- equipment_service_orders schema ---');
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'equipment_service_orders'
            ORDER BY ordinal_position
        `);
        console.table(res.rows);

        console.log('--- Sample data ---');
        const samples = await client.query('SELECT * FROM equipment_service_orders LIMIT 5');
        console.table(samples.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkLinkTable();
