console.log('Testando importação do Electron...');
try {
    const electron = require('electron');
    console.log('Electron importado com sucesso!');
    console.log('Propriedades disponíveis:', Object.keys(electron));

    const { app, BrowserWindow } = electron;
    console.log('app:', typeof app);
    console.log('BrowserWindow:', typeof BrowserWindow);
} catch (error) {
    console.error('Erro ao importar Electron:', error);
}
