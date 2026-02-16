const { Client } = require('pg');

const oldDbUrl = 'postgresql://postgres:qUngJAyBvLWQdkmSkZEjjEoMoDVzOBnx@trolley.proxy.rlwy.net:22285/railway';

async function sampleData() {
    console.log(`--- Sampling Old DB Data ---`);
    const client = new Client({ connectionString: oldDbUrl });
    try {
        await client.connect();

        console.log('\n--- Client Sample ---');
        const clients = await client.query('SELECT * FROM client LIMIT 3');
        console.table(clients.rows);

        console.log('\n--- Equipment Sample ---');
        const equipment = await client.query('SELECT * FROM equipment LIMIT 3');
        console.table(equipment.rows);

        console.log('\n--- Service Order Sample ---');
        const os = await client.query('SELECT * FROM service_order LIMIT 3');
        console.table(os.rows);

        console.log('\n--- User Sample (Technicians) ---');
        const users = await client.query('SELECT id, name, username, role FROM "user" LIMIT 3');
        console.table(users.rows);

        console.log('\n--- Enums/Status Check ---');
        const osMeta = await client.query(`
            SELECT DISTINCT status, priority FROM service_order;
        `);
        console.log('OS Status/Priority values:');
        console.table(osMeta.rows);

    } catch (err) {
        console.error(`Error sampling data:`, err.message);
    } finally {
        await client.end();
    }
}

sampleData();
