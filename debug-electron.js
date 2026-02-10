const electron = require('electron');

console.log('=== DEBUG ELECTRON ===');
console.log('Tipo de electron:', typeof electron);
console.log('É string?:', typeof electron === 'string');
console.log('Conteúdo:', electron);
console.log('electron.app:', electron.app);
console.log('electron.BrowserWindow:', electron.BrowserWindow);
console.log('======================');

if (typeof electron === 'string') {
    console.error('ERRO: Electron retornou um caminho de arquivo em vez do módulo!');
    console.error('Caminho:', electron);
    process.exit(1);
}
