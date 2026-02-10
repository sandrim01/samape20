async function testarAPI() {
    console.log('\n🔍 TESTANDO API NA RAILWAY...\n');

    // 1. Testar Health
    console.log('1. Testando Health Check...');
    try {
        const healthRes = await fetch('https://samape20-estudioio.up.railway.app/api/health');
        const healthData = await healthRes.json();
        console.log('✅ Health:', healthData);
    } catch (error) {
        console.log('❌ Health Error:', error.message);
    }

    // 2. Testar Login
    console.log('\n2. Testando Login...');
    try {
        const loginRes = await fetch('https://samape20-estudioio.up.railway.app/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@samapeop.com',
                senha: 'admin123'
            })
        });
        const loginData = await loginRes.json();
        console.log('Status:', loginRes.status);
        console.log('Response:', loginData);

        if (loginData.success) {
            console.log('✅ Login funcionou!');
            console.log('Token:', loginData.token.substring(0, 50) + '...');
        } else {
            console.log('❌ Login falhou:', loginData.message);
        }
    } catch (error) {
        console.log('❌ Login Error:', error.message);
    }

    console.log('\n');
}

testarAPI();
