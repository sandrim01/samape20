const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🎨 Convertendo SVG para ICO...');

const svgPath = path.join(__dirname, 'resources', 'icon.svg');
const icoPath = path.join(__dirname, 'resources', 'icon.ico');

// Verificar se o ImageMagick está instalado
exec('magick -version', (error) => {
    if (error) {
        console.log('⚠️  ImageMagick não encontrado.');
        console.log('📝 Para criar o .ico, você pode:');
        console.log('   1. Usar um conversor online: https://convertio.co/svg-ico/');
        console.log('   2. Instalar ImageMagick: https://imagemagick.org/');
        console.log('   3. Usar o icon.svg diretamente (funciona na maioria dos casos)');
        console.log('');
        console.log('✅ O icon.svg foi atualizado com a logo da empresa!');
    } else {
        // Converter SVG para ICO
        const command = `magick "${svgPath}" -define icon:auto-resize=256,128,64,48,32,16 "${icoPath}"`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Erro ao converter:', error.message);
                return;
            }
            console.log('✅ Ícone .ico criado com sucesso!');
            console.log(`📁 Localização: ${icoPath}`);
        });
    }
});
