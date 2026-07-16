# 一二布布 GIF 素材获取指南（500-1000张）

## 🚀 最快方式：从 52pojie 桌面宠物工具提取（推荐）

这个工具内置了大量已分类的一二布布 GIF：

1. 浏览器打开: **https://wwbim.lanzoub.com/b01bjbwe2h**
2. 输入密码: **fguf**
3. 下载最新版本 zip（标题类似 "一二布布桌面宠物vX.X.zip"）
4. 解压后，找到程序里的 `assets/`、`gifs/` 或 `resources/` 文件夹
5. 将里面的 GIF 按角色复制到本项目：

```
yierbubu-desktop/assets/
├── yier/
│   ├── stand/    ← 一二站立的GIF
│   ├── sit/      ← 一二坐着的GIF
│   ├── lie/      ← 一二趴着的GIF
│   └── cute/     ← 一二撒娇/开心的GIF
└── bubu/
    ├── stand/    ← 布布站立的GIF
    ├── sit/      ← 布布坐着的GIF
    ├── lie/      ← 布布趴着的GIF
    └── cute/     ← 布布撒娇/开心的GIF
```

6. 运行更新索引:
```bash
cd yierbubu-desktop
node scripts/generate-manifest.js
```

## 📦 其他获取渠道

| 渠道 | 数量 | 方式 |
|------|------|------|
| 爱给网 aigei.com | 843张 | 逐个下载或VIP批量 |
| 小红书 商品贴 | 1400-2000张 | 购买后百度网盘 |
| 微信表情包 | 不定 | 搜索"一二布布"→ 保存到电脑 |

## 🎯 GIF 筛选建议

优先选**积极、开心、正能量**的表情：
- 比心 ❤️、wink 😉、转圈圈、蹦跳、挥手
- 微笑、大笑、幸福、满足
- 加油、点赞、OK手势

避开负面情绪的表情（哭、生气、委屈等），它们不适合做桌面宠物。

## 📊 更新素材清单

下载完成后运行：
```bash
node scripts/generate-manifest.js
npx electron .  # 验证效果
```

然后运行：
```bash
node scripts/build-portable.js  # 重新打包exe
```
