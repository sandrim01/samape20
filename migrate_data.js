const { Client } = require('pg');

const oldDbUrl = 'postgresql://postgres:qUngJAyBvLWQdkmSkZEjjEoMoDVzOBnx@trolley.proxy.rlwy.net:22285/railway';
const newDbUrl = 'postgresql://postgres:kbrfMrFmPcFTAFpoZGxNHYbHWiWOaSUQ@shinkansen.proxy.rlwy.net:47179/railway';

async function migrate() {
    const oldClient = new Client({ connectionString: oldDbUrl });
    const newClient = new Client({ connectionString: newDbUrl });

    try {
        await oldClient.connect();
        await newClient.connect();

        console.log('--- Iniciando Migração (Simulação) ---');

        // 1. Mapeamento de Usuários
        console.log('Migrando Usuários...');
        const usersRes = await oldClient.query('SELECT * FROM "user"');
        const userMap = new Map(); // old_id -> new_id

        for (const user of usersRes.rows) {
            // Verificar se já existe (por email)
            const check = await newClient.query('SELECT id FROM usuarios WHERE email = $1', [user.email]);
            if (check.rows.length > 0) {
                userMap.set(user.id, check.rows[0].id);
                console.log(`- Usuário ${user.email} já existe.`);
            } else {
                const cargo = user.role === 'admin' ? 'ADMIN' : 'MECANICO';
                const inserted = await newClient.query(
                    'INSERT INTO usuarios (nome, email, senha, cargo, ativo, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
                    [user.name, user.email, user.password_hash, cargo, user.active, user.created_at]
                );
                userMap.set(user.id, inserted.rows[0].id);
                console.log(`- Usuário ${user.email} inserido.`);
            }
        }

        // 2. Mapeamento de Clientes
        console.log('\nMigrando Clientes...');
        const clientsRes = await oldClient.query('SELECT * FROM client');
        const clientMap = new Map();

        for (const client of clientsRes.rows) {
            const doc = (client.document || '').replace(/\D/g, '');
            let cpf = null, cnpj = null;
            if (doc.length <= 11) cpf = client.document;
            else cnpj = client.document;

            const inserted = await newClient.query(
                'INSERT INTO clientes (nome, cnpj, cpf, telefone, email, endereco, ativo, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
                [client.name, cnpj, cpf, client.phone, client.email, client.address, true, client.created_at]
            );
            clientMap.set(client.id, inserted.rows[0].id);
            console.log(`- Cliente ${client.name} inserido.`);
        }

        // 3. Mapeamento de Máquinas (Equipment)
        console.log('\nMigrando Máquinas...');
        const equipRes = await oldClient.query('SELECT * FROM equipment');
        const machineMap = new Map();

        for (const eq of equipRes.rows) {
            const newClientId = clientMap.get(eq.client_id);
            if (!newClientId) continue;

            const inserted = await newClient.query(
                'INSERT INTO maquinas (cliente_id, tipo, modelo, numero_serie, ano_fabricacao, ativo, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
                [newClientId, eq.type, eq.model || eq.brand, eq.serial_number, eq.year, true, eq.created_at]
            );
            machineMap.set(eq.id, inserted.rows[0].id);
            console.log(`- Máquina ${eq.model || eq.type} inserida.`);
        }

        // 4. Ordens de Serviço
        console.log('\nMigrando Ordens de Serviço...');
        const osRes = await oldClient.query('SELECT * FROM service_order');

        for (const os of osRes.rows) {
            const newClientId = clientMap.get(os.client_id);
            const newMecanicoId = userMap.get(os.responsible_id);

            // Buscar maquina_id na tabela de ligação antiga
            const linkRes = await oldClient.query('SELECT equipment_id FROM equipment_service_orders WHERE service_order_id = $1 LIMIT 1', [os.id]);
            const oldEquipId = linkRes.rows[0]?.equipment_id;
            const newMaquinaId = machineMap.get(oldEquipId);

            // Mapeamento de Status
            let status = 'ABERTA';
            const oldStatus = (os.status || '').toUpperCase();
            if (oldStatus === 'CLOSED' || oldStatus === 'FECHADA' || oldStatus === 'CONCLUIDA') status = 'FECHADA';
            else if (oldStatus === 'CANCELLED' || oldStatus === 'CANCELADA') status = 'CANCELADA';
            else if (oldStatus === 'IN_PROGRESS' || oldStatus === 'EM_ANDAMENTO') status = 'EM_ANDAMENTO';

            await newClient.query(
                `INSERT INTO ordens_servico 
                (numero_os, cliente_id, maquina_id, mecanico_id, data_abertura, data_fechamento, status, prioridade, descricao_problema, servicos_realizados, valor_mao_obra, valor_pecas, valor_total, km_ida, km_volta, valor_por_km, created_at) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
                [
                    `OS-${os.id}`,
                    newClientId,
                    newMaquinaId || null,
                    newMecanicoId || null,
                    os.created_at,
                    os.closed_at,
                    status,
                    'MEDIA',
                    os.description || 'Sem descrição',
                    os.service_details,
                    os.labor_value,
                    os.parts_value,
                    os.total_value,
                    os.km_inicial,
                    os.km_final,
                    os.km_rate,
                    os.created_at
                ]
            );
            console.log(`- OS-${os.id} inserida.`);
        }

        // 5. Peças (Parts)
        console.log('\nMigrando Peças...');
        const partsRes = await oldClient.query('SELECT * FROM part');

        for (const part of partsRes.rows) {
            // Verificar se já existe pelo código
            const check = await newClient.query('SELECT id FROM pecas WHERE codigo = $1', [part.part_number]);
            if (check.rows.length > 0) {
                console.log(`- Peça ${part.part_number} (${part.name}) já existe.`);
            } else {
                await newClient.query(
                    'INSERT INTO pecas (codigo, nome, descricao, categoria, quantidade_estoque, estoque_minimo, preco_custo, preco_venda, ativo, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                    [part.part_number || `PK-${part.id}`, part.name, part.description, part.category, part.stock_quantity, part.minimum_stock, part.cost_price, part.selling_price, true, part.created_at]
                );
                console.log(`- Peça ${part.name} inserida.`);
            }
        }

        console.log('\n--- Migração Concluída com Sucesso! ---');

    } catch (err) {
        console.error('Erro durante a migração:', err);
    } finally {
        await oldClient.end();
        await newClient.end();
    }
}

migrate();
