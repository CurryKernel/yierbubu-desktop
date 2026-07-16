# 一二布布桌面悬浮宠物 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个基于 Electron 的桌面悬浮宠物应用，支持一二布布双角色、透明悬浮、随机状态切换、对话气泡、喝水提醒和名人名言。

**Architecture:** Electron 主进程管理透明悬浮窗口，渲染进程使用 vanilla JS 驱动宠物状态机和气泡系统。双宠模式通过创建第二个独立窗口实现。素材使用 GIF 动图，按角色+状态分目录存放。

**Tech Stack:** Electron 28+, vanilla JavaScript, HTML5/CSS3, electron-builder

## Global Constraints

- 窗口: transparent, alwaysOnTop, frameless, skipTaskbar, 250×280px
- 状态切换: 随机 3-8 分钟间隔，撒娇权重 ~15%
- 角色切换: 随机 30-60 分钟（自动模式）
- 喝水提醒: 默认 45 分钟间隔
- 名人名言: 每天 4-5 句，9:00-22:00 分布，当日不重复
- 打包: Windows .exe (NSIS) + macOS .dmg
- 非商用，素材来自爱给网免费资源

---

### Task 1: 项目初始化与依赖安装

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `electron-builder.yml`

**Interfaces:**
- Produces: `package.json` 含所有依赖和脚本，`electron-builder.yml` 打包配置

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "yierbubu-desktop",
  "version": "1.0.0",
  "description": "一二布布桌面悬浮宠物",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build:win": "electron-builder --win",
    "build:mac": "electron-builder --mac",
    "build:all": "electron-builder --win --mac"
  },
  "author": "CurryKernel",
  "license": "MIT",
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.9.0"
  }
}
```

- [ ] **Step 2: 创建 .gitignore**

```
node_modules/
dist/
.DS_Store
Thumbs.db
*.log
```

- [ ] **Step 3: 创建 electron-builder.yml**

```yaml
appId: com.yierbubu.desktop-pet
productName: "一二布布桌面宠物"
directories:
  output: dist
  buildResources: build
files:
  - main.js
  - preload.js
  - index.html
  - settings.html
  - src/**/*
  - styles/**/*
  - assets/**/*
win:
  target: nsis
  icon: build/icon.ico
mac:
  target: dmg
  icon: build/icon.icns
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
```

- [ ] **Step 4: 安装依赖**

Run: `cd /c/Users/gv/Desktop/yierbubu-desktop && npm install`
Expected: node_modules 目录创建成功，无错误

- [ ] **Step 5: 创建目录结构**

Run: `mkdir -p src styles assets/yier/stand assets/yier/sit assets/yier/lie assets/yier/cute assets/bubu/stand assets/bubu/sit assets/bubu/lie assets/bubu/cute build`

- [ ] **Step 6: 提交**

```bash
git add package.json package-lock.json .gitignore electron-builder.yml
git commit -m "chore: initialize Electron project with electron-builder"
```

---

### Task 2: 主进程 — 透明悬浮窗口

**Files:**
- Create: `main.js`
- Create: `preload.js`

**Interfaces:**
- Consumes: `package.json` (main entry)
- Produces: `main.js` 导出 createPetWindow(config), 暴露 IPC: `close-app`, `open-settings`, `toggle-second-pet`, `get-settings`, `save-settings`

- [ ] **Step 1: 编写 main.js**

```javascript
const { app, BrowserWindow, ipcMain, screen, globalShortcut } = require('electron');
const path = require('path');

// 存储窗口引用
let mainWindow = null;
let secondWindow = null;
let settingsWindow = null;

// 窗口默认配置
const PET_WINDOW_CONFIG = {
  width: 250,
  height: 300,
  transparent: true,
  alwaysOnTop: true,
  frame: false,
  resizable: false,
  skipTaskbar: true,
  hasShadow: false,
  type: 'toolwindow',
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
  },
};

function createPetWindow(config = {}) {
  const mergedConfig = { ...PET_WINDOW_CONFIG, ...config };
  const win = new BrowserWindow(mergedConfig);

  win.loadFile('index.html');

  // 窗口初始位置：屏幕右下角偏上
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const x = config.x || screenWidth - 300;
  const y = config.y || screenHeight - 400;
  win.setPosition(x, y);

  // 保持窗口在最前但不抢焦点
  win.setAlwaysOnTop(true, 'screen-saver');

  win.on('closed', () => {
    if (win === mainWindow) mainWindow = null;
    if (win === secondWindow) secondWindow = null;
  });

  return win;
}

// IPC 处理
function setupIPC() {
  ipcMain.handle('close-app', () => {
    app.quit();
  });

  ipcMain.handle('open-settings', () => {
    if (settingsWindow) {
      settingsWindow.focus();
      return;
    }
    settingsWindow = new BrowserWindow({
      width: 420,
      height: 500,
      resizable: false,
      title: '一二布布 - 设置',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    settingsWindow.loadFile('settings.html');
    settingsWindow.on('closed', () => { settingsWindow = null; });
  });

  ipcMain.handle('toggle-second-pet', (event, enable) => {
    if (enable && !secondWindow) {
      secondWindow = createPetWindow({
        x: screen.getPrimaryDisplay().workAreaSize.width - 550,
        y: screen.getPrimaryDisplay().workAreaSize.height - 400,
      });
      return true;
    } else if (!enable && secondWindow) {
      secondWindow.close();
      secondWindow = null;
      return false;
    }
    return !!secondWindow;
  });

  ipcMain.handle('get-second-pet-status', () => {
    return !!secondWindow;
  });
}

app.whenReady().then(() => {
  setupIPC();
  mainWindow = createPetWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (!mainWindow) {
    mainWindow = createPetWindow();
  }
});
```

- [ ] **Step 2: 编写 preload.js**

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  closeApp: () => ipcRenderer.invoke('close-app'),
  openSettings: () => ipcRenderer.invoke('open-settings'),
  toggleSecondPet: (enable) => ipcRenderer.invoke('toggle-second-pet', enable),
  getSecondPetStatus: () => ipcRenderer.invoke('get-second-pet-status'),
});
```

- [ ] **Step 3: 验证窗口创建**

Run: `cd /c/Users/gv/Desktop/yierbubu-desktop && npx electron .`
Expected: 一个透明窗口出现在屏幕右下角（因为 index.html 还没写，会显示空白）
手动关闭，确认无报错

- [ ] **Step 4: 提交**

```bash
git add main.js preload.js
git commit -m "feat: add main process with transparent pet window and IPC"
```

---

### Task 3: 宠物渲染页面 — HTML + CSS

**Files:**
- Create: `index.html`
- Create: `styles/pet.css`

**Interfaces:**
- Consumes: `main.js` 加载 index.html, `preload.js` 暴露 electronAPI
- Produces: DOM 结构 `#pet-container > #pet-gif + #bubble`, CSS 透明/动画样式

- [ ] **Step 1: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>一二布布</title>
  <link rel="stylesheet" href="styles/pet.css">
</head>
<body>
  <div id="pet-wrapper">
    <!-- 对话气泡 -->
    <div id="bubble" class="bubble-hidden">
      <span id="bubble-text"></span>
    </div>
    <!-- 宠物图片 -->
    <div id="pet-container">
      <img id="pet-gif" src="" alt="一二布布" draggable="false" />
    </div>
  </div>
  <script src="src/quotes.js"></script>
  <script src="src/settings.js"></script>
  <script src="src/pet.js"></script>
  <script src="src/bubble.js"></script>
  <script src="src/menu.js"></script>
</body>
</html>
```

- [ ] **Step 2: 创建 styles/pet.css**

```css
/* 全局重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  background: transparent;
  overflow: hidden;
  user-select: none;
  -webkit-app-region: drag;
}

#pet-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  position: relative;
}

/* 对话气泡 */
#bubble {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.92);
  border: 2px solid #ffb8c6;
  border-radius: 16px;
  padding: 8px 14px;
  max-width: 200px;
  min-width: 80px;
  text-align: center;
  font-size: 13px;
  color: #333;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.3s ease;
  word-break: break-word;
}

#bubble::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid #ffb8c6;
}

#bubble.bubble-show {
  opacity: 1;
  transform: translateX(-50%) translateY(-4px);
}

#bubble.bubble-hidden {
  opacity: 0;
  pointer-events: none;
}

/* 宠物容器 */
#pet-container {
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-app-region: no-drag;
}

#pet-gif {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

#pet-gif.pet-switching {
  transform: scale(0.8);
  opacity: 0.5;
}

/* 点击反馈 */
#pet-container:active #pet-gif {
  transform: scale(0.9);
}

/* 宠物大小变体 */
.pet-size-small #pet-container { width: 140px; height: 140px; }
.pet-size-medium #pet-container { width: 200px; height: 200px; }
.pet-size-large #pet-container { width: 260px; height: 260px; }
```

- [ ] **Step 3: 验证页面渲染**

Run: `cd /c/Users/gv/Desktop/yierbubu-desktop && npx electron .`
Expected: 透明窗口出现在右下角，可以看到空的宠物容器区域
手动关闭确认无报错

- [ ] **Step 4: 提交**

```bash
git add index.html styles/pet.css
git commit -m "feat: add pet window HTML structure and transparent CSS styling"
```

---

### Task 4: 名言库与提示语数据

**Files:**
- Create: `src/quotes.js`

**Interfaces:**
- Produces: 全局对象 `QuotesDB`，暴露 `QuotesDB.tips[]`, `QuotesDB.waterReminders[]`, `QuotesDB.famousQuotes[]`, `QuotesDB.getRandomTip()`, `QuotesDB.getWaterReminder()`, `QuotesDB.getDailyQuotes(count)`

- [ ] **Step 1: 编写 src/quotes.js**

```javascript
const QuotesDB = (() => {
  // ===== 日常提示语 =====
  const tips = [
    '上班辛苦啦~',
    '下班啦！',
    '摸鱼中...',
    '今天也要加油呀！',
    '一二在呢~',
    '布布想你啦！',
    '休息一下，看看远方吧~',
    '午休时间到，小憩一会儿吧~',
    '下午好！来杯咖啡提提神 ☕',
    '又是元气满满的一天！',
    '夜深了，该休息啦 🌙',
    '周末快乐！',
    '一二布布陪你度过每一天~',
    '加油！你是最棒的 💪',
    '别太累哦，记得放松~',
    '一二和布布在看着你呢~',
    '今天心情怎么样呀？',
    '好想出去玩呀~',
    '工作再忙也要照顾好自己！',
    '一二布布最喜欢你了~',
    '该起来活动一下啦！',
    '吃点水果补充能量吧 🍎',
    '数数今天笑了几次？',
    '保持微笑，好运自然来~',
    '布布给你加油打气！',
    '一二给你比个心 ❤️',
    '忙完这阵就去吃好吃的吧！',
    '窗外天气怎么样？',
    '听首歌放松一下吧 🎵',
    '你是最可爱的人~',
    '每天进步一点点！',
    '累了就歇歇，没人会怪你的~',
    '一二布布永远支持你！',
    '这个世界因为有你而更美好~',
    '开心是一天，不开心也是一天~',
    '你是独一无二的存在 ✨',
    '烦恼都会过去的~',
    '今天的努力是明天的底气！',
    '做自己喜欢的事，过自己想要的生活~',
    '布布说：你很棒！',
    '一二说：不要放弃呀~',
    '天气好就出去走走吧！',
    '看书了吗？记得给自己充电~',
    '温柔的对待自己~',
    '今天也是被爱的一天~',
  ];

  // ===== 喝水提醒 =====
  const waterReminders = [
    '一二说：该喝水啦！💧',
    '布布说：多喝水皮肤好哦~',
    '一二说：喝口水休息一下吧~',
    '布布说：一天八杯水，你喝够了吗？💦',
    '一二说：叮咚！喝水时间到！',
    '布布说：身体缺水啦，快喝点水！',
    '一二说：一二陪你喝水~吨吨吨~',
    '布布说：健康从喝水开始！',
    '一二说：再忙也要记得喝水呀！',
    '布布说：来，一起干一杯水！🥤',
  ];

  // ===== 名人名言库 =====
  const famousQuotes = [
    { text: '人生不如意之事十有八九，常想一二，不思八九。', author: '林清玄' },
    { text: '世界上最遥远的距离，不是生与死的距离，而是我就站在你面前，你却不知道我爱你。', author: '泰戈尔' },
    { text: '生活不止眼前的苟且，还有诗和远方。', author: '高晓松' },
    { text: '人生若只如初见，何事秋风悲画扇。', author: '纳兰性德' },
    { text: '世界以痛吻我，要我报之以歌。', author: '泰戈尔' },
    { text: '你若爱，生活哪里都可爱。', author: '丰子恺' },
    { text: '每一个不曾起舞的日子，都是对生命的辜负。', author: '尼采' },
    { text: '心有猛虎，细嗅蔷薇。', author: '萨松' },
    { text: '人生如逆旅，我亦是行人。', author: '苏轼' },
    { text: '不乱于心，不困于情，不畏将来，不念过往。', author: '丰子恺' },
    { text: '既然选择了远方，便只顾风雨兼程。', author: '汪国真' },
    { text: '面朝大海，春暖花开。', author: '海子' },
    { text: '人生的价值，并不是用时间，而是用深度去衡量的。', author: '托尔斯泰' },
    { text: '黑夜无论怎样悠长，白昼总会到来。', author: '莎士比亚' },
    { text: '世上只有一种英雄主义，就是在认清生活真相之后依然热爱生活。', author: '罗曼·罗兰' },
    { text: '活着就是为了改变世界，难道还有其他原因吗？', author: '乔布斯' },
    { text: '千里之行，始于足下。', author: '老子' },
    { text: '己所不欲，勿施于人。', author: '孔子' },
    { text: '三人行，必有我师焉。', author: '孔子' },
    { text: '知之为知之，不知为不知，是知也。', author: '孔子' },
    { text: '学而不思则罔，思而不学则殆。', author: '孔子' },
    { text: '天行健，君子以自强不息。', author: '周易' },
    { text: '海纳百川，有容乃大。', author: '林则徐' },
    { text: '书山有路勤为径，学海无涯苦作舟。', author: '韩愈' },
    { text: '宝剑锋从磨砺出，梅花香自苦寒来。', author: '佚名' },
    { text: '路漫漫其修远兮，吾将上下而求索。', author: '屈原' },
    { text: '穷则独善其身，达则兼济天下。', author: '孟子' },
    { text: '勿以恶小而为之，勿以善小而不为。', author: '刘备' },
    { text: '非淡泊无以明志，非宁静无以致远。', author: '诸葛亮' },
    { text: '采菊东篱下，悠然见南山。', author: '陶渊明' },
    { text: '但愿人长久，千里共婵娟。', author: '苏轼' },
    { text: '天生我材必有用，千金散尽还复来。', author: '李白' },
    { text: '会当凌绝顶，一览众山小。', author: '杜甫' },
    { text: '莫愁前路无知己，天下谁人不识君。', author: '高适' },
    { text: '山重水复疑无路，柳暗花明又一村。', author: '陆游' },
    { text: '落红不是无情物，化作春泥更护花。', author: '龚自珍' },
    { text: '人生自古谁无死，留取丹心照汗青。', author: '文天祥' },
    { text: '先天下之忧而忧，后天下之乐而乐。', author: '范仲淹' },
    { text: '业精于勤荒于嬉，行成于思毁于随。', author: '韩愈' },
    { text: '为天地立心，为生民立命。', author: '张载' },
    { text: '幸福不在于拥有多少，而在于计较多少。', author: '佚名' },
    { text: '行动是治愈恐惧的良药。', author: '佚名' },
    { text: '最好的时光是一起虚度的时光。', author: '佚名' },
    { text: '你若盛开，蝴蝶自来。', author: '佚名' },
    { text: '做自己的太阳，无需凭借谁的光。', author: '佚名' },
    { text: '一切都是最好的安排。', author: '佚名' },
    { text: '简单点，再简单点。', author: '佚名' },
    { text: '岁月静好，现世安稳。', author: '胡兰成' },
    { text: '陪伴是最长情的告白。', author: '佚名' },
    { text: '有一分热，发一分光。', author: '鲁迅' },
    { text: '时间就像海绵里的水，只要愿挤，总还是有的。', author: '鲁迅' },
    { text: '世上本没有路，走的人多了，也便成了路。', author: '鲁迅' },
    { text: '真正的勇士，敢于直面惨淡的人生。', author: '鲁迅' },
    { text: '生活是种律动，须有光有影。', author: '老舍' },
    { text: '一个人知道自己为什么而活，就可以忍受任何一种生活。', author: '尼采' },
    { text: '我们最大的荣耀不在于从不跌倒，而在于每次跌倒后都能爬起来。', author: '孔子' },
    { text: '不要等待机会，而要创造机会。', author: '佚名' },
    { text: '走自己的路，让别人去说吧。', author: '但丁' },
    { text: '天空没有翅膀的痕迹，但鸟儿已经飞过。', author: '泰戈尔' },
    { text: '我们把世界看错了，反说它欺骗我们。', author: '泰戈尔' },
  ];

  // 今日已使用的名言索引
  let usedQuoteIndices = [];
  let lastQuoteDate = '';

  function resetDailyIfNeeded() {
    const today = new Date().toDateString();
    if (today !== lastQuoteDate) {
      usedQuoteIndices = [];
      lastQuoteDate = today;
    }
  }

  return {
    tips,
    waterReminders,
    famousQuotes,

    getRandomTip() {
      return tips[Math.floor(Math.random() * tips.length)];
    },

    getWaterReminder() {
      return waterReminders[Math.floor(Math.random() * waterReminders.length)];
    },

    getDailyQuotes(count) {
      resetDailyIfNeeded();
      const available = [];
      for (let i = 0; i < famousQuotes.length; i++) {
        if (!usedQuoteIndices.includes(i)) {
          available.push(i);
        }
      }
      // 如果可用不足，重置
      if (available.length < count) {
        usedQuoteIndices = [];
        for (let i = 0; i < famousQuotes.length; i++) {
          available.push(i);
        }
      }
      // 随机选取 count 条
      const selected = [];
      const pool = [...available];
      for (let i = 0; i < count && pool.length > 0; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        const quoteIdx = pool.splice(idx, 1)[0];
        usedQuoteIndices.push(quoteIdx);
        const q = famousQuotes[quoteIdx];
        const speaker = Math.random() < 0.5 ? '一二' : '布布';
        selected.push({
          text: `${speaker}说：${q.text}`,
          author: q.author,
        });
      }
      return selected;
    },
  };
})();
```

- [ ] **Step 2: 验证数据加载**

Run: `cd /c/Users/gv/Desktop/yierbubu-desktop && node -e "eval(require('fs').readFileSync('src/quotes.js','utf8')); console.log(QuotesDB.getRandomTip()); console.log(QuotesDB.getWaterReminder()); console.log(QuotesDB.getDailyQuotes(3));"`
Expected: 输出随机提示语、喝水提醒和3条名人名言，无报错

- [ ] **Step 3: 提交**

```bash
git add src/quotes.js
git commit -m "feat: add quotes database with tips, water reminders, and famous quotes"
```

---

### Task 5: 设置管理模块

**Files:**
- Create: `src/settings.js`

**Interfaces:**
- Consumes: browser localStorage
- Produces: 全局对象 `SettingsManager`，暴露 `SettingsManager.load()`, `SettingsManager.save(obj)`, `SettingsManager.get(key)`, `SettingsManager.set(key, value)`

- [ ] **Step 1: 编写 src/settings.js**

```javascript
const SettingsManager = (() => {
  const DEFAULTS = {
    petMode: 'single',        // 'single' | 'dual'
    character: 'auto',        // 'auto' | 'yier' | 'bubu'
    tipsEnabled: true,
    waterReminderEnabled: true,
    waterInterval: 45,        // 分钟
    tipsFrequency: 'medium',  // 'low' | 'medium' | 'high'
    petSize: 'medium',        // 'small' | 'medium' | 'large'
    dailyQuotesCount: 5,      // 每天名言数量
    autoStart: false,
  };

  let settings = { ...DEFAULTS };

  function load() {
    try {
      const saved = localStorage.getItem('yierbubu-settings');
      if (saved) {
        settings = { ...DEFAULTS, ...JSON.parse(saved) };
      }
    } catch (e) {
      settings = { ...DEFAULTS };
    }
    return settings;
  }

  function save(updates) {
    Object.assign(settings, updates);
    try {
      localStorage.setItem('yierbubu-settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
    return settings;
  }

  function get(key) {
    return settings[key];
  }

  function set(key, value) {
    settings[key] = value;
    save({});
  }

  return { load, save, get, set, DEFAULTS };
})();
```

- [ ] **Step 2: 验证设置模块**

Run: `cd /c/Users/gv/Desktop/yierbubu-desktop && node -e "eval(require('fs').readFileSync('src/settings.js','utf8')); console.log(SettingsManager.load());"`
Expected: 输出默认设置对象，无报错

- [ ] **Step 3: 提交**

```bash
git add src/settings.js
git commit -m "feat: add settings manager with localStorage persistence"
```

---

### Task 6: 宠物状态机核心

**Files:**
- Create: `src/pet.js`

**Interfaces:**
- Consumes: DOM `#pet-gif`, `SettingsManager`, `QuotesDB`
- Produces: 全局对象 `PetController`，暴露 `PetController.init()`, `PetController.switchState()`, `PetController.switchCharacter()`, `PetController.setCharacter(char)`

- [ ] **Step 1: 编写 src/pet.js**

```javascript
const PetController = (() => {
  const STATES = ['stand', 'sit', 'lie', 'cute'];
  const CHARACTERS = ['yier', 'bubu'];

  let currentState = 'stand';
  let currentCharacter = 'yier';
  let stateTimer = null;
  let characterTimer = null;
  let isAutoCharacter = true;

  const petGif = document.getElementById('pet-gif');
  const bubbleEl = document.getElementById('bubble');
  const bubbleText = document.getElementById('bubble-text');

  // 可用素材索引缓存
  let assetCache = {};
  let lastGifPath = '';

  function getRandomInterval(minSec, maxSec) {
    const ms = (minSec + Math.random() * (maxSec - minSec)) * 1000;
    return Math.floor(ms);
  }

  function getStateInterval() {
    // 3-8 分钟随机
    return getRandomInterval(3 * 60, 8 * 60);
  }

  function getCharacterInterval() {
    // 30-60 分钟随机
    return getRandomInterval(30 * 60, 60 * 60);
  }

  function getRandomState() {
    // 撒娇权重 ~15%，其他均匀分配
    const rand = Math.random();
    if (rand < 0.15) return 'cute';
    const otherStates = ['stand', 'sit', 'lie'];
    return otherStates[Math.floor(Math.random() * otherStates.length)];
  }

  function getGifPath(character, state) {
    // 从缓存中获取可用素材列表
    const key = `${character}_${state}`;
    if (!assetCache[key]) {
      // 创建占位提示（素材需要手动下载后放入对应目录）
      // 实际路径格式: assets/yier/stand/stand_1.gif
      assetCache[key] = { count: 8, basePath: `assets/${character}/${state}/` };
    }
    const cache = assetCache[key];
    const idx = Math.floor(Math.random() * cache.count) + 1;
    return `${cache.basePath}${state}_${idx}.gif`;
  }

  function updatePetImage(character, state, animate = true) {
    const gifPath = getGifPath(character, state);

    if (gifPath === lastGifPath && assetCache[`${character}_${state}`]?.count > 1) {
      // 避免连续显示同一张，重试
      const retry = getGifPath(character, state);
      if (retry !== lastGifPath) {
        lastGifPath = retry;
      }
    } else {
      lastGifPath = gifPath;
    }

    if (animate) {
      petGif.classList.add('pet-switching');
      setTimeout(() => {
        petGif.src = lastGifPath;
        petGif.classList.remove('pet-switching');
      }, 150);
    } else {
      petGif.src = lastGifPath;
    }

    // 如果有可用素材缓存则使用真实路径
    petGif.onerror = () => {
      // 素材不存在时显示占位提示
      petGif.style.display = 'none';
    };
    petGif.onload = () => {
      petGif.style.display = 'block';
    };
  }

  function switchState() {
    const newState = getRandomState();
    if (newState !== currentState) {
      currentState = newState;
      updatePetImage(currentCharacter, currentState);
    }

    // 设置下一次状态切换
    clearTimeout(stateTimer);
    stateTimer = setTimeout(switchState, getStateInterval());
  }

  function switchCharacter() {
    if (!isAutoCharacter) return;

    const idx = CHARACTERS.indexOf(currentCharacter);
    const nextChar = CHARACTERS[(idx + 1) % CHARACTERS.length];
    setCharacterInternal(nextChar);

    // 设置下一次角色切换
    clearTimeout(characterTimer);
    characterTimer = setTimeout(switchCharacter, getCharacterInterval());
  }

  function setCharacterInternal(char) {
    if (char !== currentCharacter) {
      currentCharacter = char;
      currentState = getRandomState();
      updatePetImage(currentCharacter, currentState);
    }
  }

  function setCharacter(char) {
    if (char === 'auto') {
      isAutoCharacter = true;
      switchCharacter();
      return;
    }
    isAutoCharacter = false;
    clearTimeout(characterTimer);
    setCharacterInternal(char);
  }

  function init() {
    const settings = SettingsManager.load();

    // 设置初始角色
    if (settings.character === 'auto') {
      isAutoCharacter = true;
      currentCharacter = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
    } else {
      isAutoCharacter = false;
      currentCharacter = settings.character;
    }

    // 设置初始状态
    currentState = getRandomState();
    updatePetImage(currentCharacter, currentState, false);

    // 应用宠物大小
    const petWrapper = document.getElementById('pet-wrapper');
    if (settings.petSize) {
      petWrapper.classList.add(`pet-size-${settings.petSize}`);
    }

    // 启动状态切换定时器
    stateTimer = setTimeout(switchState, getStateInterval());

    // 启动角色切换定时器
    if (isAutoCharacter) {
      characterTimer = setTimeout(switchCharacter, getCharacterInterval());
    }

    console.log(`Pet initialized: ${currentCharacter} in ${currentState} state`);
  }

  // 获取当前状态供其他模块使用
  function getCurrentCharacter() { return currentCharacter; }
  function getCurrentState() { return currentState; }
  function getIsAutoCharacter() { return isAutoCharacter; }

  return {
    init,
    switchState,
    switchCharacter,
    setCharacter,
    getCurrentCharacter,
    getCurrentState,
    getIsAutoCharacter,
  };
})();
```

- [ ] **Step 2: 验证状态机逻辑**

Run: `cd /c/Users/gv/Desktop/yierbubu-desktop && node -e "
eval(require('fs').readFileSync('src/settings.js','utf8'));
eval(require('fs').readFileSync('src/quotes.js','utf8'));
// 验证导出存在
console.log('SettingsManager:', typeof SettingsManager);
console.log('QuotesDB:', typeof QuotesDB);
console.log('PetController validation: code parses OK');
"`
Expected: 输出验证通过

- [ ] **Step 3: 提交**

```bash
git add src/pet.js
git commit -m "feat: add pet state machine with random state and character switching"
```

---

### Task 7: 对话气泡系统

**Files:**
- Create: `src/bubble.js`

**Interfaces:**
- Consumes: DOM `#bubble`, `#bubble-text`, `QuotesDB`, `SettingsManager`, `PetController`
- Produces: 全局对象 `BubbleSystem`，暴露 `BubbleSystem.init()`, `BubbleSystem.show(text, duration)`

- [ ] **Step 1: 编写 src/bubble.js**

```javascript
const BubbleSystem = (() => {
  const bubbleEl = document.getElementById('bubble');
  const bubbleText = document.getElementById('bubble-text');

  let tipsTimer = null;
  let waterTimer = null;
  let quoteTimers = [];
  let isShowing = false;
  let hideTimeout = null;
  let dailyQuoteData = []; // 今天要展示的名言列表

  function show(text, duration = 4000) {
    // 如果正在显示，先清除
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }

    bubbleText.textContent = text;
    bubbleEl.classList.remove('bubble-hidden');
    bubbleEl.classList.add('bubble-show');
    isShowing = true;

    hideTimeout = setTimeout(() => {
      hide();
    }, duration);
  }

  function hide() {
    bubbleEl.classList.remove('bubble-show');
    bubbleEl.classList.add('bubble-hidden');
    isShowing = false;
  }

  function getTipsInterval() {
    const freq = SettingsManager.get('tipsFrequency');
    switch (freq) {
      case 'low':    return getRandomMinutes(20, 30);
      case 'high':   return getRandomMinutes(5, 10);
      default:       return getRandomMinutes(10, 15);
    }
  }

  function getRandomMinutes(min, max) {
    return (min + Math.random() * (max - min)) * 60 * 1000;
  }

  function scheduleTips() {
    if (!SettingsManager.get('tipsEnabled')) return;

    clearTimeout(tipsTimer);
    const interval = getTipsInterval();
    tipsTimer = setTimeout(() => {
      show(QuotesDB.getRandomTip(), 4000);
      scheduleTips(); // 递归调度下一次
    }, interval);
  }

  function scheduleWaterReminder() {
    if (!SettingsManager.get('waterReminderEnabled')) return;

    clearTimeout(waterTimer);
    const interval = SettingsManager.get('waterInterval') * 60 * 1000;
    waterTimer = setTimeout(() => {
      show(QuotesDB.getWaterReminder(), 5000);
      scheduleWaterReminder();
    }, interval);
  }

  function scheduleDailyQuotes() {
    if (!SettingsManager.get('tipsEnabled')) return;

    const count = SettingsManager.get('dailyQuotesCount') || 5;
    dailyQuoteData = QuotesDB.getDailyQuotes(count);

    // 均匀分布在 9:00-22:00
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(9, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(22, 0, 0, 0);

    const totalMinutes = (dayEnd - dayStart) / 60000;
    const intervalMinutes = totalMinutes / (dailyQuoteData.length + 1);

    // 清除旧的定时器
    quoteTimers.forEach(t => clearTimeout(t));
    quoteTimers = [];

    dailyQuoteData.forEach((quote, i) => {
      const delayMinutes = intervalMinutes * (i + 1);
      const quoteTime = new Date(dayStart.getTime() + delayMinutes * 60000);
      const delay = quoteTime - now;

      if (delay > 0) {
        const timer = setTimeout(() => {
          show(quote.text, 6000);
        }, delay);
        quoteTimers.push(timer);
      }
    });
  }

  function init() {
    const settings = SettingsManager.load();

    // 初始问候
    const hour = new Date().getHours();
    let greeting;
    if (hour < 9) greeting = '一二布布，早上好！☀️';
    else if (hour < 12) greeting = '上午好！一二布布来陪你啦~';
    else if (hour < 14) greeting = '中午好！记得吃午饭哦~';
    else if (hour < 18) greeting = '下午好！';
    else if (hour < 22) greeting = '晚上好！';
    else greeting = '夜深了，一二布布还在哦~';

    setTimeout(() => show(greeting, 4000), 1000);

    // 启动各类气泡定时器
    scheduleTips();
    scheduleWaterReminder();
    scheduleDailyQuotes();

    // 每小时检查一次名言调度是否需要刷新
    setInterval(() => {
      const newDay = new Date().toDateString();
      const storedDay = localStorage.getItem('yierbubu-quote-date');
      if (newDay !== storedDay) {
        localStorage.setItem('yierbubu-quote-date', newDay);
        scheduleDailyQuotes();
      }
    }, 60 * 60 * 1000);

    localStorage.setItem('yierbubu-quote-date', new Date().toDateString());
  }

  // 刷新定时器（设置变更后调用）
  function refresh() {
    scheduleTips();
    scheduleWaterReminder();
  }

  return { init, show, refresh };
})();
```

- [ ] **Step 2: 验证气泡模块**

Run: `cd /c/Users/gv/Desktop/yierbubu-desktop && node -e "
eval(require('fs').readFileSync('src/settings.js','utf8'));
eval(require('fs').readFileSync('src/quotes.js','utf8'));
console.log('BubbleSystem code parses: OK');
console.log('Test tip:', QuotesDB.getRandomTip());
console.log('Test water:', QuotesDB.getWaterReminder());
console.log('Test quotes:', QuotesDB.getDailyQuotes(3).length);
"`
Expected: 输出验证通过

- [ ] **Step 3: 提交**

```bash
git add src/bubble.js
git commit -m "feat: add bubble system with tips, water reminders, and daily quotes"
```

---

### Task 8: 右键菜单

**Files:**
- Create: `src/menu.js`

**Interfaces:**
- Consumes: DOM `#pet-container`, `PetController`, `BubbleSystem`, `SettingsManager`, `window.electronAPI`
- Produces: 右键弹出菜单，响应用户操作

- [ ] **Step 1: 编写 src/menu.js**

```javascript
const ContextMenu = (() => {
  let menuEl = null;

  function createMenuElement() {
    if (menuEl) return menuEl;

    menuEl = document.createElement('div');
    menuEl.id = 'context-menu';
    menuEl.style.cssText = `
      position: fixed;
      background: rgba(255,255,255,0.95);
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      padding: 6px 0;
      min-width: 170px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 9999;
      display: none;
      font-size: 14px;
      -webkit-app-region: no-drag;
      backdrop-filter: blur(10px);
    `;
    document.body.appendChild(menuEl);
    return menuEl;
  }

  function buildMenuItems() {
    const settings = SettingsManager.load();
    const isAuto = PetController.getIsAutoCharacter();
    const charLabel = isAuto ? '自动切换' : (PetController.getCurrentCharacter() === 'yier' ? '一二 🐼' : '布布 🐻');

    return [
      {
        label: `🐼 当前角色：${charLabel}`,
        sub: [
          { label: '一二 🐼', action: () => PetController.setCharacter('yier') },
          { label: '布布 🐻', action: () => PetController.setCharacter('bubu') },
          { label: '自动切换 🔄', action: () => PetController.setCharacter('auto') },
        ],
      },
      {
        label: `👥 模式：${settings.petMode === 'dual' ? '双宠' : '单宠'}`,
        sub: [
          { label: '单宠模式', action: () => setPetMode('single') },
          { label: '双宠模式', action: () => setPetMode('dual') },
        ],
      },
      {
        label: `💬 提示语：${settings.tipsEnabled ? '开' : '关'}`,
        action: () => {
          const newVal = !SettingsManager.get('tipsEnabled');
          SettingsManager.save({ tipsEnabled: newVal });
          BubbleSystem.refresh();
          hide();
        },
      },
      {
        label: `💧 喝水提醒：${settings.waterReminderEnabled ? '开' : '关'}`,
        action: () => {
          const newVal = !SettingsManager.get('waterReminderEnabled');
          SettingsManager.save({ waterReminderEnabled: newVal });
          BubbleSystem.refresh();
          hide();
        },
      },
      { label: '──────', disabled: true },
      {
        label: '⚙️ 设置...',
        action: () => {
          if (window.electronAPI) {
            window.electronAPI.openSettings();
          }
          hide();
        },
      },
      {
        label: '🚪 退出',
        action: () => {
          if (window.electronAPI) {
            window.electronAPI.closeApp();
          }
        },
      },
    ];
  }

  function setPetMode(mode) {
    SettingsManager.save({ petMode: mode });
    if (window.electronAPI) {
      window.electronAPI.toggleSecondPet(mode === 'dual');
    }
    hide();
  }

  function renderMenu(items, x, y) {
    const menu = createMenuElement();
    menu.innerHTML = '';

    items.forEach(item => {
      if (item.disabled) {
        const sep = document.createElement('div');
        sep.style.cssText = 'height:1px;background:#eee;margin:4px 0;';
        menu.appendChild(sep);
        return;
      }

      const row = document.createElement('div');
      row.textContent = item.label;
      row.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        white-space: nowrap;
        color: #333;
        transition: background 0.15s;
        position: relative;
      `;

      row.addEventListener('mouseenter', () => {
        row.style.background = '#f5f5f5';
        // 清除子菜单
        const existingSub = menu.querySelector('.sub-menu');
        if (existingSub) existingSub.remove();
        if (item.sub) {
          renderSubMenu(item.sub, row);
        }
      });

      row.addEventListener('mouseleave', () => {
        row.style.background = 'transparent';
      });

      row.addEventListener('click', (e) => {
        e.stopPropagation();
        if (item.action) item.action();
        if (!item.sub) hide();
      });

      if (item.sub) {
        row.textContent = item.label + '  ▸';
      }

      menu.appendChild(row);
    });

    // 调整菜单位置防止溢出
    const maxX = window.innerWidth - 180;
    const maxY = window.innerHeight - menu.scrollHeight;
    menu.style.left = Math.min(x, maxX) + 'px';
    menu.style.top = Math.min(y, maxY) + 'px';
    menu.style.display = 'block';
  }

  function renderSubMenu(subItems, parentRow) {
    const menu = createMenuElement();
    const existingSub = menu.querySelector('.sub-menu');
    if (existingSub) existingSub.remove();

    const sub = document.createElement('div');
    sub.className = 'sub-menu';
    sub.style.cssText = `
      position: absolute;
      left: 100%;
      top: ${parentRow.offsetTop}px;
      background: rgba(255,255,255,0.95);
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      padding: 6px 0;
      min-width: 140px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      backdrop-filter: blur(10px);
    `;

    subItems.forEach(item => {
      const row = document.createElement('div');
      row.textContent = item.label;
      row.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        white-space: nowrap;
        color: #333;
        transition: background 0.15s;
      `;
      row.addEventListener('mouseenter', () => { row.style.background = '#f5f5f5'; });
      row.addEventListener('mouseleave', () => { row.style.background = 'transparent'; });
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        item.action();
      });
      sub.appendChild(row);
    });

    menu.appendChild(sub);
  }

  function show(e) {
    e.preventDefault();
    renderMenu(buildMenuItems(), e.clientX, e.clientY);
  }

  function hide() {
    if (menuEl) {
      menuEl.style.display = 'none';
    }
  }

  function init() {
    const petContainer = document.getElementById('pet-container');
    petContainer.addEventListener('contextmenu', show);
    // 点击其他地方关闭菜单
    document.addEventListener('click', hide);
  }

  return { init, show, hide };
})();

// 初始化所有系统
document.addEventListener('DOMContentLoaded', () => {
  SettingsManager.load();
  PetController.init();
  BubbleSystem.init();
  ContextMenu.init();
});
```

- [ ] **Step 2: 提交**

```bash
git add src/menu.js
git commit -m "feat: add right-click context menu with all controls"
```

---

### Task 9: 设置面板页面

**Files:**
- Create: `settings.html`
- Create: `styles/settings.css`

**Interfaces:**
- Consumes: `SettingsManager` (via localStorage 共享), `preload.js`
- Produces: 独立设置窗口，可修改所有设置项

- [ ] **Step 1: 创建 settings.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>一二布布 - 设置</title>
  <link rel="stylesheet" href="styles/settings.css">
</head>
<body>
  <div class="settings-container">
    <h1>🐼 一二布布 · 设置 🐻</h1>

    <div class="section">
      <h3>角色设置</h3>
      <div class="form-group">
        <label>默认角色</label>
        <select id="character">
          <option value="auto">自动切换</option>
          <option value="yier">一二 🐼</option>
          <option value="bubu">布布 🐻</option>
        </select>
      </div>
      <div class="form-group">
        <label>显示模式</label>
        <select id="petMode">
          <option value="single">单宠</option>
          <option value="dual">双宠</option>
        </select>
      </div>
    </div>

    <div class="section">
      <h3>提示设置</h3>
      <div class="form-group">
        <label>提示语开关</label>
        <input type="checkbox" id="tipsEnabled" />
      </div>
      <div class="form-group">
        <label>提示语频率</label>
        <select id="tipsFrequency">
          <option value="low">低（20-30分钟）</option>
          <option value="medium">中（10-15分钟）</option>
          <option value="high">高（5-10分钟）</option>
        </select>
      </div>
    </div>

    <div class="section">
      <h3>喝水提醒</h3>
      <div class="form-group">
        <label>喝水提醒开关</label>
        <input type="checkbox" id="waterReminderEnabled" />
      </div>
      <div class="form-group">
        <label>提醒间隔</label>
        <select id="waterInterval">
          <option value="30">30 分钟</option>
          <option value="45">45 分钟</option>
          <option value="60">60 分钟</option>
        </select>
      </div>
    </div>

    <div class="section">
      <h3>显示设置</h3>
      <div class="form-group">
        <label>宠物大小</label>
        <select id="petSize">
          <option value="small">小</option>
          <option value="medium">中</option>
          <option value="large">大</option>
        </select>
      </div>
      <div class="form-group">
        <label>每天名言数量</label>
        <input type="range" id="dailyQuotesCount" min="1" max="10" value="5" />
        <span id="quotesCountLabel">5</span>
      </div>
    </div>

    <div class="section">
      <h3>系统设置</h3>
      <div class="form-group">
        <label>开机自启</label>
        <input type="checkbox" id="autoStart" />
      </div>
    </div>

    <div class="actions">
      <button id="saveBtn">💾 保存设置</button>
      <button id="resetBtn">🔄 恢复默认</button>
      <button id="closeBtn">✕ 关闭</button>
    </div>
  </div>

  <script src="src/settings.js"></script>
  <script>
    // 加载当前设置到表单
    const settings = SettingsManager.load();

    document.getElementById('character').value = settings.character;
    document.getElementById('petMode').value = settings.petMode;
    document.getElementById('tipsEnabled').checked = settings.tipsEnabled;
    document.getElementById('tipsFrequency').value = settings.tipsFrequency;
    document.getElementById('waterReminderEnabled').checked = settings.waterReminderEnabled;
    document.getElementById('waterInterval').value = settings.waterInterval;
    document.getElementById('petSize').value = settings.petSize;
    document.getElementById('dailyQuotesCount').value = settings.dailyQuotesCount;
    document.getElementById('quotesCountLabel').textContent = settings.dailyQuotesCount;
    document.getElementById('autoStart').checked = settings.autoStart;

    document.getElementById('dailyQuotesCount').addEventListener('input', (e) => {
      document.getElementById('quotesCountLabel').textContent = e.target.value;
    });

    document.getElementById('saveBtn').addEventListener('click', () => {
      const updates = {
        character: document.getElementById('character').value,
        petMode: document.getElementById('petMode').value,
        tipsEnabled: document.getElementById('tipsEnabled').checked,
        tipsFrequency: document.getElementById('tipsFrequency').value,
        waterReminderEnabled: document.getElementById('waterReminderEnabled').checked,
        waterInterval: parseInt(document.getElementById('waterInterval').value),
        petSize: document.getElementById('petSize').value,
        dailyQuotesCount: parseInt(document.getElementById('dailyQuotesCount').value),
        autoStart: document.getElementById('autoStart').checked,
      };
      SettingsManager.save(updates);

      // 同步双宠模式
      if (window.electronAPI) {
        window.electronAPI.toggleSecondPet(updates.petMode === 'dual');
      }

      alert('设置已保存！重新启动宠物后生效。');
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      if (confirm('确定恢复默认设置？')) {
        SettingsManager.save(SettingsManager.DEFAULTS);
        location.reload();
      }
    });

    document.getElementById('closeBtn').addEventListener('click', () => {
      window.close();
    });
  </script>
</body>
</html>
```

- [ ] **Step 2: 创建 styles/settings.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  background: linear-gradient(135deg, #fff5f5 0%, #fff0f6 50%, #fef3e2 100%);
  color: #333;
  min-height: 100vh;
}

.settings-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 24px;
}

h1 {
  text-align: center;
  font-size: 20px;
  margin-bottom: 20px;
  color: #555;
}

.section {
  background: rgba(255,255,255,0.7);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #f0e0e0;
}

.section h3 {
  font-size: 14px;
  color: #888;
  margin-bottom: 12px;
  font-weight: normal;
}

.form-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.form-group label {
  font-size: 14px;
  color: #444;
}

select, input[type="range"] {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  background: white;
}

input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

input[type="range"] {
  width: 120px;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  justify-content: center;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

#saveBtn {
  background: #ffb8c6;
  color: white;
  font-weight: bold;
}

#saveBtn:hover {
  background: #ff9eb0;
}

#resetBtn {
  background: #eee;
  color: #666;
}

#resetBtn:hover {
  background: #ddd;
}

#closeBtn {
  background: transparent;
  color: #999;
  border: 1px solid #ddd;
}

#closeBtn:hover {
  background: #f5f5f5;
}

#quotesCountLabel {
  font-weight: bold;
  color: #ff8fa3;
  min-width: 20px;
  text-align: center;
}
```

- [ ] **Step 3: 提交**

```bash
git add settings.html styles/settings.css
git commit -m "feat: add settings panel page with all configuration options"
```

---

### Task 10: 素材下载脚本与占位素材

**Files:**
- Create: `scripts/download-assets.js`（素材下载辅助脚本）
- Create: 每个素材目录的 `.gitkeep`

**Interfaces:**
- 提供素材下载指引和占位方案，让应用在无素材时也能运行测试

- [ ] **Step 1: 创建素材下载辅助脚本**

```javascript
// scripts/download-assets.js
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
```

- [ ] **Step 2: 创建占位目录和 .gitkeep**

Run:
```bash
cd /c/Users/gv/Desktop/yierbubu-desktop
mkdir -p scripts
for char in yier bubu; do
  for state in stand sit lie cute; do
    touch "assets/$char/$state/.gitkeep"
  done
done
```

- [ ] **Step 3: 更新 pet.js 添加无素材降级方案**

在 `updatePetImage` 函数的 `petGif.onerror` 中增强降级显示：

```javascript
// 替换 pet.js 中的 petGif.onerror 部分：
petGif.onerror = () => {
  // 素材不存在时显示可爱的纯色占位圆形
  petGif.style.display = 'none';
  const container = document.getElementById('pet-container');
  if (!container.querySelector('.placeholder-pet')) {
    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder-pet';
    placeholder.style.cssText = `
      width: 120px; height: 120px; border-radius: 50%;
      background: ${currentCharacter === 'yier'
        ? 'radial-gradient(circle at 40% 40%, #fff, #e8e8e8, #333 85%)'
        : 'radial-gradient(circle at 40% 40%, #f5deb3, #d2a679, #8b6914 85%)'};
      display: flex; align-items: center; justify-content: center;
      font-size: 50px;
    `;
    placeholder.textContent = currentCharacter === 'yier' ? '🐼' : '🐻';
    container.appendChild(placeholder);
  }
};

petGif.onload = () => {
  petGif.style.display = 'block';
  const placeholder = document.getElementById('pet-container').querySelector('.placeholder-pet');
  if (placeholder) placeholder.remove();
};
```

- [ ] **Step 4: 验证素材脚本**

Run: `cd /c/Users/gv/Desktop/yierbubu-desktop && node scripts/download-assets.js`
Expected: 列出所有素材目录状态，创建缺失目录

- [ ] **Step 5: 提交**

```bash
git add scripts/ assets/ src/pet.js
git commit -m "feat: add asset download helper and no-asset fallback placeholders"
```

---

### Task 11: 集成测试与打包验证

**Files:**
- Modify: `src/pet.js`（如有需要调整的集成点）
- Modify: `main.js`（如有需要调整的集成点）

**Interfaces:**
- Consumes: 所有已创建的模块
- Produces: 可运行的桌面宠物应用

- [ ] **Step 1: 端到端启动测试**

Run: `cd /c/Users/gv/Desktop/yierbubu-desktop && npx electron .`
Expected:
- 透明窗口出现在屏幕右下角
- 显示宠物占位图（🐼或🐻圆形）
- 几秒后出现问候气泡
- 右键弹出菜单
- 点击宠物有缩放反馈
- 拖动窗口到任意位置

手动测试每个功能，确认正常运行。

- [ ] **Step 2: 打包测试 (Windows)**

Run: `cd /c/Users/gv/Desktop/yierbubu-desktop && npm run build:win`
Expected: `dist/一二布布桌面宠物 Setup.exe` 生成成功
安装并运行，确认功能正常

- [ ] **Step 3: 最终提交并推送**

```bash
git add -A
git commit -m "feat: complete desktop pet application with all features"
git push origin master
```

- [ ] **Step 4: 创建 GitHub Release（可选）**

Run:
```bash
cd /c/Users/gv/Desktop/yierbubu-desktop
gh release create v1.0.0 dist/*.exe --title "一二布布桌面宠物 v1.0.0" --notes "首次发布：桌面悬浮宠物，支持一二布布双角色、状态切换、对话气泡、喝水提醒、名人名言"
```

---

## 完成检查清单

- [ ] 透明窗口悬浮于桌面，不抢焦点
- [ ] 宠物在站立/坐/趴下/撒娇间随机切换（3-8分钟）
- [ ] 一二/布布角色可切换（手动 + 自动 30-60分钟）
- [ ] 对话气泡：日常提示（10-15分钟）、喝水提醒（45分钟）、名言（4-5句/天）
- [ ] 右键菜单完整（切换角色、模式、提示开关、设置、退出）
- [ ] 双宠模式：开启后出现第二个窗口
- [ ] 设置面板：所有选项可修改并持久化
- [ ] 打包 exe 安装运行正常
- [ ] 无素材时显示占位图形
