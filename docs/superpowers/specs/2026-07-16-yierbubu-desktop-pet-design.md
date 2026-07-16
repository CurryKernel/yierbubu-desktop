# 一二布布桌面悬浮宠物 — 设计文档

**日期**: 2026-07-16  
**仓库**: CurryKernel/yierbubu-desktop  
**状态**: 已确认

---

## 1. 项目概述

一个基于 Electron 的桌面悬浮宠物应用，宠物形象为「一二布布」角色。支持透明窗口悬浮于桌面、随机状态切换、对话气泡、喝水提醒、名人名言等功能。

### 角色设定

| 角色 | 品种 | 特征 | 性格 |
|------|------|------|------|
| 一二 (Yier) | 🐼 熊猫（白色） | 黑色耳朵、黑色蝴蝶领结、黑色小脚 | 乐观、单纯、傻乎乎 |
| 布布 (Bubu) | 🐻 棕熊 | 棕色毛发、淡棕色腮红、体型稍大 | 温和、憨厚、大智若愚 |

> 作者：黄小B | 非商用 | 素材来源：爱给网免费素材

---

## 2. 技术栈

| 层面 | 技术 |
|------|------|
| 框架 | Electron |
| 渲染 | HTML5 + CSS3 + Vanilla JS |
| 素材格式 | GIF（透明背景） |
| 打包 | electron-builder |
| 交付格式 | Windows `.exe` (NSIS) / macOS `.dmg` |

---

## 3. 架构设计

```
yierbubu-desktop/
├── main.js              # Electron 主进程
├── preload.js           # 预加载脚本 (IPC)
├── src/
│   ├── pet.js           # 宠物核心：状态机、定时器
│   ├── bubble.js        # 对话气泡管理
│   ├── menu.js          # 右键菜单
│   ├── settings.js      # 设置持久化
│   └── quotes.js        # 名言库 + 提示语
├── assets/
│   ├── yier/
│   │   ├── stand/       # 站立 GIF（多张随机选）
│   │   ├── sit/         # 坐 GIF
│   │   ├── lie/         # 趴下 GIF
│   │   └── cute/        # 撒娇 GIF
│   └── bubu/
│       ├── stand/
│       ├── sit/
│       ├── lie/
│       └── cute/
├── index.html           # 宠物窗口（透明）
├── settings.html        # 设置面板
├── styles/
│   ├── pet.css
│   └── settings.css
├── package.json
└── electron-builder.yml
```

### 主进程 (main.js) 职责
- 创建透明无边框悬浮窗口
- 双宠模式管理（创建/销毁第二个窗口）
- 系统托盘图标
- IPC 通信：接收渲染进程的退出/设置请求

### 渲染进程 (index.html + src/*.js) 职责
- 宠物 GIF 渲染与切换
- 状态机驱动
- 对话气泡显示
- 拖动与点击交互
- 右键菜单

---

## 4. 核心功能设计

### 4.1 透明悬浮窗口

```js
// main.js 窗口配置
{
  transparent: true,
  alwaysOnTop: true,
  frame: false,
  resizable: false,
  width: 250,
  height: 280,
  skipTaskbar: true,
  type: 'toolwindow',  // Windows 下不抢焦点
}
```

- 拖动：`-webkit-app-region: drag` + mousemove
- 宠物本体约 200x200px，上方留空间给气泡

### 4.2 状态机

```
         ┌──────────┐
         │   站立   │
         └───┬──┬───┘
            │  │
     ┌──────┘  └──────┐
     ▼                ▼
┌─────────┐      ┌─────────┐
│   坐    │◄────►│  趴下   │
└────┬────┘      └────┬────┘
     │                │
     └───────┬────────┘
             ▼
      ┌──────────┐
      │   撒娇   │
      └──────────┘
```

- 状态切换间隔：随机 3-8 分钟
- 切换时有短暂过渡动画（缩放/淡入淡出 300ms）
- 角色切换（一二 ↔ 布布）：随机 30-60 分钟
- 撒娇状态权重稍低（约 15% 概率），保持新鲜感

### 4.3 对话气泡

气泡在宠物上方以 `fadeInUp` 动画弹出，3-5 秒后自动消失。

**提示语类型：**

| 类型 | 频率 | 示例 |
|------|------|------|
| 日常提示 | 每 10-15 分钟 | "上班辛苦啦~" "下班啦！" "摸鱼中..." "今天也要加油呀" "一二在呢~" "布布想你啦" |
| 喝水提醒 | 每 45 分钟 | "一二说：该喝水啦！💧" "布布说：多喝水皮肤好哦~" |
| 名人名言 | 每天 4-5 句 | "一二说：人生不如意之事十有八九，常想一二。" "布布说：世界上最遥远的距离，不是生与死..." |

**名人名言库设计：**
- 内置约 50-80 条中外名言
- 渲染格式：随机给一二或布布，用 `XX说：` 格式
- 每天 4-5 句，均匀分布在 9:00-22:00 时间段
- 当日已播出的不重复，次日重置

### 4.4 双宠模式

- 默认单宠，用户通过右键菜单开启双宠
- 双宠 = 主进程创建第二个透明窗口
- 两个窗口各自独立运行状态机
- 设置同步：选择记录在 localStorage，下次启动保持

### 4.5 右键菜单

```
┌─────────────────────┐
│ 🐼 切换角色    ►    │ → 一二 / 布布 / 自动
│ 👥 显示模式    ►    │ → 单宠 / 双宠
│ 💬 提示语开关       │ → 勾选
│ 💧 喝水提醒    ►    │ → 开启/关闭/间隔
│ ⚙️ 设置...          │ → 打开设置面板
│ ───────────────     │
│ 🚪 退出             │
└─────────────────────┘
```

### 4.6 设置面板 (settings.html)

- 喝水提醒间隔（默认 45 分钟，可调 30/45/60）
- 提示语频率（低/中/高）
- 宠物大小（小/中/大）
- 开机自启（勾选）
- 名人名言每天数量（1-10）

设置存储在 `localStorage`，渲染进程读取。

---

## 5. 素材规范

从爱给网 (aigei.com) 下载 843 张一二布布免费表情包素材，按以下规范整理：

```
assets/yier/stand/   → 站立姿态 GIF，5-8 张
assets/yier/sit/     → 坐姿 GIF，5-8 张
assets/yier/lie/     → 趴下/躺 GIF，5-8 张
assets/yier/cute/    → 撒娇/可爱 GIF，5-8 张
assets/bubu/stand/   → （同上）
assets/bubu/sit/
assets/bubu/lie/
assets/bubu/cute/
```

每个状态目录至少 3-5 张不同 GIF，切换时随机选取，避免重复单调。

---

## 6. 打包配置

**electron-builder.yml:**
```yaml
appId: com.yierbubu.desktop-pet
productName: 一二布布桌面宠物
directories:
  output: dist
win:
  target: nsis
  icon: assets/icon.ico
mac:
  target: dmg
  icon: assets/icon.icns
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
```

**构建命令：**
- `npm run build:win` → `dist/一二布布桌面宠物 Setup.exe`
- `npm run build:mac` → `dist/一二布布桌面宠物.dmg`

---

## 7. 文件清单

| 文件 | 说明 |
|------|------|
| `package.json` | 项目配置、脚本、依赖 |
| `main.js` | Electron 主进程入口 |
| `preload.js` | IPC 桥接 |
| `index.html` | 宠物透明窗口 |
| `settings.html` | 设置面板 |
| `src/pet.js` | 宠物状态机核心 |
| `src/bubble.js` | 对话气泡 |
| `src/menu.js` | 右键菜单 |
| `src/settings.js` | 设置读写 |
| `src/quotes.js` | 名言库 + 提示语 |
| `styles/pet.css` | 宠物/气泡样式 |
| `styles/settings.css` | 设置面板样式 |
| `assets/` | 素材目录（GIF） |
| `electron-builder.yml` | 打包配置 |
