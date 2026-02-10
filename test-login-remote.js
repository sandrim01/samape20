
const fetch = require('node-fetch');

const API_URL = 'https://samape20-estudioio.up.railway.app/api';
const EMAIL = 'admin@samapeop.com';
const SENHA = 'admin123';

async function testLogin() {
    console.log('--- TESTE DE LOGIN REMOTO ---');
    console.log(`URL: ${API_URL}/login`);
    console.log(`Email: ${EMAIL}`);
    
    try {
        const start = Date.now();
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, senha: SENHA })
        });
        const duration = Date.now() - start;
        console.log(`Status: ${response.status} (${response.statusText})`);
        console.log(`Tempo: ${duration}ms`);

        const text = await response.text();
        console.log('Resposta:', text);

        if (response.ok) {
            console.log('✅ LOGIN SUCESSO!');
        } else {
            console.log('❌ FALHA NO LOGIN');
        }
    } catch (error) {
        console.error('❌ ERRO DE CONEXÃO:', error.message);
    }
}

testLogin();
