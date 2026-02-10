
async function testAPI() {
    console.log('--- Testando API Railway ---');
    const baseUrl = 'https://samape20-estudioio.up.railway.app/api';

    try {
        console.log('1. Testando login...');
        const loginRes = await fetch(`${baseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@samapeop.com', senha: 'admin123' })
        });

        const loginData = await loginRes.json();
        if (!loginData.success) {
            console.error('❌ Falha no login:', loginData.message);
            return;
        }
        console.log('✅ Login realizado com sucesso!');
        const token = loginData.token;

        console.log('2. Testando listar clientes...');
        const clientesRes = await fetch(`${baseUrl}/clientes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const clientesData = await clientesRes.json();
        console.log(`✅ Listar clientes: ${clientesData.success ? 'Sucesso' : 'Falha'}`);
        if (clientesData.success) console.log(`   Total: ${clientesData.clientes?.length || 0}`);

        console.log('3. Testando criar cliente (teste)...');
        const novoCliente = await fetch(`${baseUrl}/clientes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                nome: 'TESTE ANDROID ' + new Date().getTime(),
                email: 'teste@exemplo.com'
            })
        });
        const novoData = await novoCliente.json();
        console.log(`✅ Criar cliente: ${novoData.success ? 'Sucesso' : 'Falha'}`);
        if (!novoData.success) console.log('   Mensagem:', novoData.message);

    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
    }
}

testAPI();
