// GIF 素材智能分配器 — 按文件名区分一二和布布
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'assets', 'downloaded');
const ASSETS_DIR = path.join(ROOT, 'assets');
const STATES = ['stand', 'sit', 'lie', 'cute'];

// 根据文件名判断所属角色
function guessCharacter(filename) {
  const n = filename.toLowerCase();
  // 明确是布布的
  if (/^布布|布布[^一二]|bubu/.test(n) && !/一二/.test(n)) return 'bubu';
  // 明确是一二的
  if (/^一二|一二[^布布]|yier/.test(n) && !/布布/.test(n) && !/bubu/.test(n)) return 'yier';
  // 两者都提到 → 两个角色都分配
  if (/一二.*布布|布布.*一二|yier.*bubu|bubu.*yier/.test(n)) return 'both';
  // 白/熊猫特征 → 一二
  if (/panda|white|白/.test(n)) return 'yier';
  // 棕/熊特征 → 布布
  if (/brown|棕|bear/.test(n)) return 'bubu';
  // 默认两者都分配
  return 'both';
}

// 根据文件名判断状态
function guessState(filename) {
  const n = filename.toLowerCase().replace(/[0-9]/g, '');
  if (/咬|cry|angry|shock|生气|白眼|委屈|哭/.test(n)) return 'cute';
  if (/趴|躺|睡|坐|lie|sit|sleep/.test(n)) return 'lie';
  if (/走|跑|跳|舞|dance|walk|run|摇|扭|遛/.test(n)) return 'stand';
  if (/爱|heart|hug|抱|贴|亲|kiss|比心|牵手|最好|开心|笑|乐/.test(n)) return 'cute';
  if (/想|think|思考|看|发呆/.test(n)) return 'sit';
  if (/举|化妆|吃|咬/.test(n)) return 'stand';
  return null;
}

// 清理并准备目录
console.log('清理旧素材...');
['yier', 'bubu'].forEach(char => {
  STATES.forEach(state => {
    const dir = path.join(ASSETS_DIR, char, state);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.readdirSync(dir).forEach(f => {
      if (f.endsWith('.gif') && f !== '.gitkeep') fs.unlinkSync(path.join(dir, f));
    });
  });
});

const allGifs = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.gif') || f.endsWith('.GIF'));
console.log(`原始GIF: ${allGifs.length} 个\n`);

// 按角色+状态分类
const pools = {};
['yier', 'bubu'].forEach(char => {
  pools[char] = { stand: [], sit: [], lie: [], cute: [] };
});

allGifs.forEach(gif => {
  const owner = guessCharacter(gif);
  const state = guessState(gif) || STATES[Math.floor(Math.random() * 4)];

  if (owner === 'yier' || owner === 'both') pools['yier'][state].push(gif);
  if (owner === 'bubu' || owner === 'both') pools['bubu'][state].push(gif);
});

// 输出分类统计
['yier', 'bubu'].forEach(char => {
  console.log(`${char} 分类:`);
  STATES.forEach(s => console.log(`  ${s}: ${pools[char][s].length} 个`));
});

// 分配 GIF（目标是每个目录至少16个）
let total = 0;
['yier', 'bubu'].forEach(char => {
  STATES.forEach(state => {
    const outDir = path.join(ASSETS_DIR, char, state);
    const pool = pools[char][state];
    const target = Math.max(16, Math.ceil(pool.length * 3));

    // 从自己的pool中取出GIF来填充
    const expandedPool = pool.length > 0 ? pool : allGifs; // fallback到全部GIF

    for (let i = 0; i < target; i++) {
      const srcGif = expandedPool[i % expandedPool.length];
      const baseName = path.basename(srcGif, path.extname(srcGif));
      const destName = `${baseName}_${i.toString(36)}.gif`;
      const srcPath = path.join(SRC_DIR, srcGif);
      const destPath = path.join(outDir, destName);

      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
        total++;
      }
    }
  });
});

console.log(`\n✅ 生成 ${total} 个GIF素材`);
['yier', 'bubu'].forEach(char => {
  STATES.forEach(state => {
    const dir = path.join(ASSETS_DIR, char, state);
    const count = fs.readdirSync(dir).filter(f => f.endsWith('.gif')).length;
    console.log(`  ${char}/${state}: ${count} GIFs`);
  });
});
