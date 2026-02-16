const { Client } = require('pg');

const oldDbUrl = 'postgresql://postgres:qUngJAyBvLWQdkmSkZEjjEoMoDVzOBnx@trolley.proxy.rlwy.net:22285/railway';
const newDbUrl = 'postgresql://postgres:kbrfMrFmPcFTAFpoZGxNHYbHWiWOaSUQ@shinkansen.proxy.rlwy.net:47179/railway';

async function investigate(url, name) {
    console.log(`--- Investigating ${name} ---`);
    const client = new Client({ connectionString: url });
    try {
        await client.connect();

        // List tables
        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        console.log(`Tables in ${name}:`);
        for (const row of tablesRes.rows) {
            console.log(`- ${row.table_name}`);

            // For each table, list columns
            const columnsRes = await client.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = $1
                ORDER BY ordinal_position;
            `, [row.table_name]);

            for (const col of columnsRes.rows) {
                console.log(`  |-- ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'null' : 'not null'})`);
            }
        }
    } catch (err) {
        console.error(`Error investigating ${name}:`, err.message);
    } finally {
        await client.end();
    }
}

async function main() {
    await investigate(oldDbUrl, 'Old Database');
    console.log('\n');
    await investigate(newDbUrl, 'New Database');
}

main();
