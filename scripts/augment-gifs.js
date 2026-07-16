// GIF 素材分配器 — 将收集到的 GIF 分配到所有状态目录
// 策略: 每个GIF按内容特征分配到最合适的状态，复制变体填充

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'assets', 'downloaded');
const ASSETS_DIR = path.join(ROOT, 'assets');
const CHARACTERS = ['yier', 'bubu'];
const STATES = ['stand', 'sit', 'lie', 'cute'];

// 内容关键词 → 状态映射
function guessState(filename) {
  const n = filename.toLowerCase().replace(/[0-9]/g, '');
  if (/咬|cry|angry|shock|生气|白眼|委屈|哭/.test(n)) return 'cute';
  if (/趴|躺|睡|坐|lie|sit|sleep/.test(n)) return 'lie';
  if (/走|跑|跳|舞|dance|walk|run|摇|扭/.test(n)) return 'stand';
  if (/爱|heart|hug|抱|贴|亲|kiss|比心|牵手/.test(n)) return 'cute';
  if (/想|think|思考|看|发呆/.test(n)) return 'sit';
  if (/举|化妆|遛|吃/.test(n)) return 'stand';
  if (/最好|开心|笑|乐/.test(n)) return 'cute';
  return null; // 无法判断
}

function getAllGifs(dir) {
  return fs.readdirSync(dir).filter(f => f.endsWith('.gif') || f.endsWith('.GIF'));
}

// 清理旧素材
console.log('清理旧素材...');
CHARACTERS.forEach(char => {
  STATES.forEach(state => {
    const dir = path.join(ASSETS_DIR, char, state);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.readdirSync(dir).forEach(f => {
      if (f.endsWith('.gif') || f.endsWith('.GIF')) {
        fs.unlinkSync(path.join(dir, f));
      }
    });
  });
});

const allGifs = getAllGifs(SRC_DIR);
console.log(`原始GIF: ${allGifs.length} 个`);

// 按状态分类
const byState = { stand: [], sit: [], lie: [], cute: [] };
const uncategorized = [];

allGifs.forEach(gif => {
  const state = guessState(gif);
  if (state && byState[state]) {
    byState[state].push(gif);
  } else {
    uncategorized.push(gif);
  }
});

// 未分类的均匀分配
uncategorized.forEach((gif, i) => {
  byState[STATES[i % 4]].push(gif);
});

console.log('分类结果:');
Object.entries(byState).forEach(([state, gifs]) => {
  console.log(`  ${state}: ${gifs.length} 个`);
});

// 分配到角色和状态目录
let total = 0;
CHARACTERS.forEach(char => {
  STATES.forEach(state => {
    const outDir = path.join(ASSETS_DIR, char, state);
    const pool = byState[state];
    const target = Math.max(64, Math.ceil(pool.length * 4));

    for (let i = 0; i < target; i++) {
      const srcGif = pool[i % pool.length];
      const baseName = path.basename(srcGif, path.extname(srcGif));
      const destName = `${baseName}_${i.toString(36)}.gif`;
      const srcPath = path.join(SRC_DIR, srcGif);
      const destPath = path.join(outDir, destName);

      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
      }
      total++;
    }
  });
});

console.log(`\n✅ 总计生成: ${total} 个GIF素材`);
console.log('分布:');
CHARACTERS.forEach(char => {
  STATES.forEach(state => {
    const dir = path.join(ASSETS_DIR, char, state);
    const count = fs.readdirSync(dir).filter(f => f.endsWith('.gif')).length;
    console.log(`  ${char}/${state}: ${count} GIFs`);
  });
});
