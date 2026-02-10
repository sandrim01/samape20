// Launcher para garantir que o Electron carregue corretamente
const { spawn } = require('child_process');
const path = require('path');

// Caminho para o executável do Electron
const electronPath = require('electron');

console.log('Iniciando SAMAPEOP...');
console.log('Electron path:', electronPath);

// Executar o Electron com o main.js
const child = spawn(electronPath, [path.join(__dirname, 'main-app.js')], {
    stdio: 'inherit',
    windowsHide: false
});

child.on('close', (code) => {
    process.exit(code);
});
