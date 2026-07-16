// 扫描 assets 目录，生成 GIF 清单文件
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'gif-manifest.js');

const CHARACTERS = ['yier', 'bubu'];
const STATES = ['stand', 'sit', 'lie', 'cute'];

const manifest = {};

CHARACTERS.forEach(char => {
  manifest[char] = {};
  STATES.forEach(state => {
    const dir = path.join(ASSETS_DIR, char, state);
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.gif'));
      manifest[char][state] = files;
    } else {
      manifest[char][state] = [];
    }
  });
});

// 生成 JS 文件
const output = `// Auto-generated GIF manifest — do not edit manually
// Generated: ${new Date().toISOString()}
const GIFManifest = ${JSON.stringify(manifest, null, 2)};
`;

fs.writeFileSync(OUTPUT_FILE, output);
console.log(`Manifest generated: ${OUTPUT_FILE}`);

// 输出统计
let total = 0;
CHARACTERS.forEach(char => {
  STATES.forEach(state => {
    const count = manifest[char][state].length;
    total += count;
    console.log(`  ${char}/${state}: ${count} GIFs`);
  });
});
console.log(`Total: ${total} GIFs`);
