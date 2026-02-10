
async function testLiveMachineCreation() {
    console.log('--- Testando Criação de Máquina na API LIVE ---');
    const baseUrl = 'https://samape20-estudioio.up.railway.app/api';

    try {
        console.log('1. Login...');
        const loginRes = await fetch(`${baseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@samapeop.com', senha: 'admin123' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;

        console.log('2. Buscando clientes...');
        const clientesRes = await fetch(`${baseUrl}/clientes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const clientesData = await clientesRes.json();

        if (clientesData.clientes.length === 0) {
            console.log('⚠️ Nenhum cliente encontrado. Criando um...');
            const nc = await fetch(`${baseUrl}/clientes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ nome: 'Cliente Teste ' + Date.now() })
            });
            const cData = await nc.json();
            clientesData.clientes.push(cData.cliente);
        }

        const clienteId = clientesData.clientes[0].id;

        console.log('3. Criando máquina...');
        const machineRes = await fetch(`${baseUrl}/maquinas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                cliente_id: clienteId,
                modelo: 'Teste Live ' + Date.now(),
                ano: 2024
            })
        });

        const data = await machineRes.json();
        console.log('✅ Resposta:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

testLiveMachineCreation();
