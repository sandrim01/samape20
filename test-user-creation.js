
async function testCriarUsuario() {
    console.log('--- Testando Criação de Usuário na API Railway ---');
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
        const token = loginData.token;

        console.log('2. Testando criar usuário...');
        const res = await fetch(`${baseUrl}/usuarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                nome: 'Teste de Conexao',
                email: 'conexao' + new Date().getTime() + '@teste.com',
                senha: 'senha123',
                cargo: 'MECANICO'
            })
        });

        const data = await res.json();
        console.log('✅ Resposta:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('❌ Erro crítico:', error.message);
    }
}

testCriarUsuario();
