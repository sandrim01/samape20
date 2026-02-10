const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, 'resources', 'logonova2.png');
const logoBuffer = fs.readFileSync(logoPath);
const logoBase64 = logoBuffer.toString('base64');

console.log('📸 Logo convertida para Base64!');
console.log('📏 Tamanho:', logoBuffer.length, 'bytes');
console.log('\n🔗 Use este código no HTML:');
console.log(`<img src="data:image/png;base64,${logoBase64.substring(0, 100)}..." class="logo" />`);
console.log('\n✅ String Base64 completa salva em logo-base64.txt');

fs.writeFileSync('logo-base64.txt', `data:image/png;base64,${logoBase64}`);
