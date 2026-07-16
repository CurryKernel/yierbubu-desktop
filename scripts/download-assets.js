// 一二布布表情包素材下载辅助
//
// 素材来源：爱给网 https://www.aigei.com/set/yierbububiaoqing.html
//
// 使用说明：
// 1. 访问爱给网下载一二布布表情包（843张免费）
// 2. 按角色和状态分类后放入 assets/ 对应目录
// 3. 命名规范: {state}_{index}.gif (如 stand_1.gif, stand_2.gif)
//
// 运行: node scripts/download-assets.js（列出当前素材状态）

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const CHARACTERS = ['yier', 'bubu'];
const STATES = ['stand', 'sit', 'lie', 'cute'];

console.log('=== 一二布布素材状态检查 ===\n');

let totalGifs = 0;
let missingDirs = [];

CHARACTERS.forEach(char => {
  STATES.forEach(state => {
    const dir = path.join(ASSETS_DIR, char, state);
    if (!fs.existsSync(dir)) {
      missingDirs.push(dir);
      console.log(`❌ 缺失: assets/${char}/${state}/`);
      return;
    }
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.gif'));
    totalGifs += files.length;
    const status = files.length >= 3 ? '✅' : files.length > 0 ? '⚠️' : '❌';
    console.log(`${status} assets/${char}/${state}/ — ${files.length} 个GIF`);
  });
});

console.log(`\n总计: ${totalGifs} 个GIF素材`);

if (totalGifs === 0) {
  console.log('\n⚠️  暂无素材！应用将使用纯色占位图运行。');
  console.log('请从爱给网下载素材: https://www.aigei.com/set/yierbububiaoqing.html');
  console.log('下载后将GIF按角色和状态分类放入 assets/ 目录。');
} else {
  console.log(`\n素材就绪，共 ${totalGifs} 个GIF ✅`);
}

if (missingDirs.length > 0) {
  console.log('\n创建缺失目录...');
  missingDirs.forEach(dir => {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`  创建: ${path.relative(__dirname, dir)}`);
  });
}
