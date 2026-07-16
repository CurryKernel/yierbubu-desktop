// 构建便携版 exe — 从 node_modules/electron 直接复制
const fs = require('fs');
const path = require('path');

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

// 必要的 Electron 资源文件
const requiredFiles = [
  'chrome_100_percent.pak',
  'chrome_200_percent.pak',
  'icudtl.dat',
  'resources.pak',
  'snapshot_blob.bin',
  'v8_context_snapshot.bin',
  'vk_swiftshader_icd.json',
  'vulkan-1.dll',
  'libEGL.dll',
  'libGLESv2.dll',
  'ffmpeg.dll',
];
requiredFiles.forEach(f => {
  const src = path.join(ELECTRON_DIR, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(DIST_DIR, f));
  } else {
    console.log('  警告: 未找到 ' + f);
  }
});

// 复制 locales (中文+英文)
const localesDir = path.join(DIST_DIR, 'locales');
fs.mkdirSync(localesDir, { recursive: true });
const localesSrc = path.join(ELECTRON_DIR, 'locales');
if (fs.existsSync(localesSrc)) {
  const zhFiles = fs.readdirSync(localesSrc).filter(f =>
    f.startsWith('zh') || f === 'en-US.pak'
  );
  zhFiles.forEach(f => {
    fs.copyFileSync(path.join(localesSrc, f), path.join(localesDir, f));
  });
}

// 3. 复制 resources 目录（含 default_app.asar）
const resourcesSrc = path.join(ELECTRON_DIR, 'resources');
const resourcesDest = path.join(DIST_DIR, 'resources');
fs.mkdirSync(resourcesDest, { recursive: true });

// 复制 default_app.asar
const defaultAppAsar = path.join(resourcesSrc, 'default_app.asar');
if (fs.existsSync(defaultAppAsar)) {
  fs.copyFileSync(defaultAppAsar, path.join(resourcesDest, 'default_app.asar'));
  console.log('复制 default_app.asar');
}

// 4. 创建 app 资源目录
console.log('复制应用文件...');
const appDir = path.join(resourcesDest, 'app');
fs.mkdirSync(appDir, { recursive: true });

// 复制所有应用文件
const appFiles = ['main.js', 'preload.js', 'index.html', 'settings.html'];
appFiles.forEach(f => {
  const src = path.join(ROOT, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(appDir, f));
  }
});

// 复制目录
['src', 'styles', 'assets'].forEach(dir => {
  const src = path.join(ROOT, dir);
  const dest = path.join(appDir, dir);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
    console.log(`  复制 ${dir}/`);
  }
});

// 5. 创建 package.json
fs.writeFileSync(path.join(appDir, 'package.json'), JSON.stringify({
  name: 'yierbubu-desktop',
  version: '1.0.0',
  main: 'main.js',
}, null, 2));

// 6. 创建空的 node_modules（确保 electron 从内置加载）
fs.mkdirSync(path.join(appDir, 'node_modules'), { recursive: true });

// 7. 创建启动批处理
fs.writeFileSync(path.join(DIST_DIR, '启动宠物.bat'),
  '@echo off\r\nstart "" "%~dp0一二布布桌面宠物.exe"');

// 8. 统计
console.log('\n=== 构建完成 ===');
console.log(`输出: ${DIST_DIR}`);
console.log(`可执行文件: ${path.join(DIST_DIR, '一二布布桌面宠物.exe')}`);

function getDirSize(dir) {
  let size = 0;
  if (!fs.existsSync(dir)) return 0;
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
console.log('\n双击 exe 或运行 启动宠物.bat 启动！');
