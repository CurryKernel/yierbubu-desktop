# 一二布布 GIF 素材获取指南

## 方法 1（推荐）：下载 52pojie 桌面宠物工具提取素材

1. 浏览器打开: https://wwbim.lanzoub.com/b01bjbwe2h
2. 输入密码: `fguf`
3. 下载最新版本的 zip 文件
4. 解压后，找到程序目录中的 `assets/` 或 `resources/` 文件夹
5. 将所有 GIF 复制到本项目的以下目录：
   - 一二（熊猫/白色）的 GIF → `assets/yier/`
   - 布布（棕熊）的 GIF → `assets/bubu/`
6. 运行 `node scripts/generate-manifest.js` 更新素材索引

## 方法 2：爱给网免费下载

1. 打开: https://www.aigei.com/set/yierbububiaoqing.html
2. 逐个下载 843 张免费 GIF
3. 按角色和状态分类放入 `assets/` 对应目录

## 方法 3：微信表情包

1. 微信搜索 "一二布布表情包"
2. 关注相关公众号
3. 长按保存 GIF → 发到 "文件传输助手"
4. 在电脑微信中保存到本地
5. 复制到 `assets/` 目录

## 分类建议

将积极/开心的 GIF 优先放入：
- `stand/` — 站立、挥手、打招呼
- `sit/` — 坐着、看书、喝茶
- `lie/` — 趴着休息、放松
- `cute/` — 比心、撒娇、wink、开心转圈

## 更新素材清单

下载完成后运行：
```bash
node scripts/generate-manifest.js
```

这会自动扫描所有 GIF 文件并更新 `src/gif-manifest.js`。
