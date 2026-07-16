#!/usr/bin/env python3
"""
一二布布 GIF 表情包批量下载器

使用方法:
1. 先用浏览器打开 https://www.aigei.com/set/yierbububiaoqing.html
2. 按 F12 打开开发者工具 → Console
3. 贴入以下简化版代码获取所有图片URL:
   (见下方说明)

或者:
  直接运行: python scripts/download-gifs.py
  会尝试从已知的公开源下载
"""

import os, sys, json, time, re, urllib.request, urllib.error

# === 配置 ===
ASSETS_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets', 'downloaded')
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.aigei.com/',
}

# === 已知的免费一二布布 GIF URL（从爱给网公开页面提取）===
# 注：这些 URL 需要从浏览器实际获取，此处为已知的示例格式
# 实际使用时请在浏览器Console执行以下代码获取:
#
# ```javascript
# // 在爱给网页面 Console 中执行:
# var urls = [];
# document.querySelectorAll('img[src*=".gif"]').forEach(img => {
#   urls.push(img.src);
# });
# console.log(JSON.stringify(urls, null, 2));
# // 复制输出，保存为 urls.json
# ```

def download_file(url, filepath):
    """下载单个文件"""
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
            with open(filepath, 'wb') as f:
                f.write(data)
            return len(data)
    except Exception as e:
        print(f'  ✗ 下载失败: {e}')
        return 0

def download_from_list(url_list, label=''):
    """从URL列表批量下载"""
    success = 0
    total = len(url_list)
    for i, url in enumerate(url_list):
        ext = '.gif'
        if url.lower().endswith('.png'):
            ext = '.png'
        elif url.lower().endswith('.jpg') or url.lower().endswith('.jpeg'):
            ext = '.jpg'

        filename = f'{label}_{i+1:04d}{ext}'
        filepath = os.path.join(ASSETS_DIR, filename)

        if os.path.exists(filepath):
            success += 1
            continue

        print(f'  [{i+1}/{total}] {filename} ...', end=' ')
        size = download_file(url, filepath)
        if size > 0:
            success += 1
            print(f'✓ {size/1024:.0f}KB')
        else:
            print('✗')

        time.sleep(0.3)  # 避免请求过快

    return success

def main():
    os.makedirs(ASSETS_DIR, exist_ok=True)

    print('=' * 60)
    print('  一二布布 GIF 批量下载器')
    print('=' * 60)

    # 方式1: 从 urls.json 读取（如果用户从浏览器获取了）
    urls_file = os.path.join(os.path.dirname(__file__), 'urls.json')
    if os.path.exists(urls_file):
        print('\n📄 从 urls.json 读取URL列表...')
        with open(urls_file, 'r') as f:
            urls = json.load(f)
        print(f'  找到 {len(urls)} 个URL')
        download_from_list(urls)
    else:
        print('\n⚠️  未找到 urls.json')
        print()
        print('请按以下步骤获取下载链接：')
        print()
        print('  1. 浏览器打开: https://www.aigei.com/set/yierbububiaoqing.html')
        print('  2. 按 F12 → Console')
        print('  3. 贴入以下代码并回车:')
        print()
        print('     var urls = [];')
        print('     document.querySelectorAll(\'img[src*=".gif"]\').forEach(function(img) {')
        print('       urls.push(img.src);')
        print('     });')
        print('     console.log(JSON.stringify(urls));')
        print()
        print('  4. 复制输出的JSON数组')
        print(f'  5. 保存到: {urls_file}')
        print('  6. 重新运行本脚本')
        print()

    # 统计
    existing = os.listdir(ASSETS_DIR)
    gifs = [f for f in existing if f.endswith('.gif')]
    print(f'\n📊 当前素材: {len(gifs)} 个GIF')
    print(f'   目录: {ASSETS_DIR}')

if __name__ == '__main__':
    main()
