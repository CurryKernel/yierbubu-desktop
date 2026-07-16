// 手动构建便携版 exe — 不依赖 electron-builder 下载任何东西
// 直接使用 node_modules/electron 中的已安装二进制文件
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist', 'yierbubu-desktop');
const ELECTRON_DIR = path.join(ROOT, 'node_modules', 'electron', 'dist');

console.log('=== 构建一二布布桌面宠物 (便携版) ===\n');

// 1. 清理
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

// 2. 复制 Electron 运行文件
console.log('复制 Electron 运行文件...');
const electronExe = path.join(ELECTRON_DIR, 'electron.exe');
fs.copyFileSync(electronExe, path.join(DIST_DIR, '一二布布桌面宠物.exe'));

// 复制必要的 DLL 和资源文件
const copyFiles = [
  'chrome_100_percent.pak', 'chrome_200_percent.pak',
  'icudtl.dat', 'resources.pak', 'snapshot_blob.bin',
  'v8_context_snapshot.bin', 'vk_swiftshader_icd.json',
  'vulkan-1.dll', 'libEGL.dll', 'libGLESv2.dll',
];
copyFiles.forEach(f => {
  const src = path.join(ELECTRON_DIR, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(DIST_DIR, f));
  }
});

// 复制 locales (可选，减小体积)
const localesDir = path.join(DIST_DIR, 'locales');
fs.mkdirSync(localesDir, { recursive: true });
const localesSrc = path.join(ELECTRON_DIR, 'locales');
if (fs.existsSync(localesSrc)) {
  const zhFiles = fs.readdirSync(localesSrc).filter(f => f.startsWith('zh') || f === 'en-US.pak');
  zhFiles.forEach(f => {
    fs.copyFileSync(path.join(localesSrc, f), path.join(localesDir, f));
  });
}

// 3. 创建 app 资源目录 (ASAR 替代 — 直接复制)
console.log('复制应用文件...');
const resourcesDir = path.join(DIST_DIR, 'resources');
fs.mkdirSync(resourcesDir, { recursive: true });
const appDir = path.join(resourcesDir, 'app');
fs.mkdirSync(appDir, { recursive: true });

// 复制所有应用文件
const appFiles = [
  'main.js', 'preload.js', 'index.html', 'settings.html',
  'package.json', 'electron-builder.yml',
];
appFiles.forEach(f => {
  const src = path.join(ROOT, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(appDir, f));
  }
});

// 复制目录
const copyDirs = ['src', 'styles', 'assets'];
copyDirs.forEach(dir => {
  const src = path.join(ROOT, dir);
  const dest = path.join(appDir, dir);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
  }
});

// 4. 创建 package.json 告诉 Electron 入口点
const appPackageJson = {
  name: 'yierbubu-desktop',
  version: '1.0.0',
  main: 'main.js',
};
fs.writeFileSync(path.join(appDir, 'package.json'), JSON.stringify(appPackageJson, null, 2));

// 5. 复制 node_modules (最小化 — 只需要 electron)
console.log('设置 node_modules...');
const nodeModulesDir = path.join(appDir, 'node_modules');
fs.mkdirSync(nodeModulesDir, { recursive: true });
// 不需要复制 electron npm 包，因为它在 resources 外面

// 6. 统计大小
console.log('\n=== 构建完成 ===');
const distPath = path.join(ROOT, 'dist', 'yierbubu-desktop');
const exePath = path.join(distPath, '一二布布桌面宠物.exe');
console.log(`输出: ${distPath}`);
console.log(`可执行文件: ${exePath}`);

// 计算大小
function getDirSize(dir) {
  let size = 0;
  const files = fs.readdirSync(dir, { withFileTypes: true });
  files.forEach(f => {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) size += getDirSize(p);
    else size += fs.statSync(p).size;
  });
  return size;
}
const totalSize = getDirSize(DIST_DIR);
console.log(`总大小: ${(totalSize / 1024 / 1024).toFixed(0)} MB`);

// 7. 创建启动批处理（可选）
const batContent = `@echo off
start "" "%~dp0一二布布桌面宠物.exe" "%~dp0resources/app"
`;
fs.writeFileSync(path.join(DIST_DIR, '启动宠物.bat'), batContent);

console.log('\n双击 "一二布布桌面宠物.exe" 或运行 "启动宠物.bat" 来启动宠物！');
