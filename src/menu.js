// ===== 拖动系统 =====
const DragSystem = (() => {
  let isDragging = false, startX = 0, startY = 0, hasMoved = false;

  function init() {
    const c = document.getElementById('pet-container');
    c.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isDragging = true; hasMoved = false;
      startX = e.screenX; startY = e.screenY;
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.screenX - startX, dy = e.screenY - startY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        hasMoved = true;
        window.electronAPI && window.electronAPI.moveWindow(dx, dy);
        startX = e.screenX; startY = e.screenY;
      }
    });
    document.addEventListener('mouseup', () => { isDragging = false; });
  }
  function didDrag() { return hasMoved; }
  function resetDrag() { hasMoved = false; }
  return { init, didDrag, resetDrag };
})();

// ===== 右键菜单（全扁平，无子菜单）=====
const ContextMenu = (() => {
  function getMenuEl() { return document.getElementById('context-menu'); }

  function buildItems() {
    const s = SettingsManager.load();
    return [
      { label: '🖼️ 换一个图案', action: () => { PetController.nextImage(); } },
      { label: s.petMode === 'dual' ? '👤 切换为单宠' : '👥 切换为双宠',
        action: () => {
          const mode = s.petMode === 'dual' ? 'single' : 'dual';
          SettingsManager.save({ petMode: mode });
          window.electronAPI && window.electronAPI.toggleSecondPet(mode === 'dual');
        }},
      { label: s.tipsEnabled ? '💬 提示语：开 ✓' : '💬 提示语：关 ✗',
        action: () => {
          SettingsManager.save({ tipsEnabled: !s.tipsEnabled });
          BubbleSystem.refresh();
        }},
      { label: s.waterReminderEnabled ? '💧 喝水提醒：开 ✓' : '💧 喝水提醒：关 ✗',
        action: () => {
          SettingsManager.save({ waterReminderEnabled: !s.waterReminderEnabled });
          BubbleSystem.refresh();
        }},
      { sep: true },
      { label: '⚙️ 设置面板', action: () => { window.electronAPI && window.electronAPI.openSettings(); } },
      { label: '🚪 退出软件', action: () => { window.electronAPI && window.electronAPI.closeApp(); } },
    ];
  }

  function show(e) {
    e.preventDefault(); e.stopPropagation();
    const menu = getMenuEl();
    // 如果菜单已打开，右键再次点击关闭菜单
    if (menu.style.display === 'block') {
      hide();
      return;
    }
    // 右键时自动关闭已打开的设置窗口
    window.electronAPI && window.electronAPI.closeSettings && window.electronAPI.closeSettings();
    const items = buildItems();
    menu.innerHTML = '';

    items.forEach(item => {
      if (item.sep) {
        const d = document.createElement('div');
        d.style.cssText = 'height:1px;background:#eee;margin:4px 0;';
        menu.appendChild(d);
        return;
      }
      const row = document.createElement('div');
      row.textContent = item.label;
      row.style.cssText = 'padding:10px 16px;cursor:pointer;white-space:nowrap;color:#333;font-size:13px;';
      row.addEventListener('mouseenter', () => row.style.background = '#fef0f3');
      row.addEventListener('mouseleave', () => row.style.background = 'transparent');
      row.addEventListener('click', (ev) => { ev.stopPropagation(); item.action(); hide(); });
      menu.appendChild(row);
    });

    // 防止溢出屏幕
    const menuH = items.filter(i => !i.sep).length * 38 + 8;
    menu.style.left = Math.min(Math.max(0, e.clientX), window.innerWidth - 180) + 'px';
    menu.style.top = Math.min(Math.max(0, e.clientY), window.innerHeight - menuH) + 'px';
    menu.style.display = 'block';
  }

  function hide() { const m = getMenuEl(); if (m) m.style.display = 'none'; }

  function init() {
    document.getElementById('pet-container').addEventListener('contextmenu', show);
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#context-menu')) hide();
    });
  }
  return { init, show, hide };
})();

// ===== 时间显示 =====
const TimeDisplay = (() => {
  let lastHour = -1;
  function update() {
    const now = new Date();
    const el = document.getElementById('info-time');
    if (el) el.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const h = now.getHours();
    if (now.getMinutes() === 0 && h !== lastHour) {
      lastHour = h;
      const msgs = { 8:'一二说：早上八点啦☀️', 9:'布布说：九点开工~', 12:'一二说：午饭时间🍚', 14:'布布说：下午加油💪', 18:'一二说：下班啦🎉', 21:'布布说：准备休息~', 22:'一二说：该睡了🌙', 0:'布布说：午夜了😴' };
      setTimeout(() => BubbleSystem.show(msgs[h] || `一二布布报时：${h}点整~`, 5000), 500);
    }
  }
  function init() { update(); setInterval(update, 1000); }
  return { init };
})();

// ===== 双宠互动 =====
const PetInteraction = (() => {
  const exchanges = [
    { say:'一二：在干嘛呀~', reply:'布布：在想你呀！' },
    { say:'布布：累不累呀？', reply:'一二：看到你就不累啦！' },
    { say:'一二：饿啦！', reply:'布布：我去给你做好吃的！' },
    { say:'布布：休息一下哦~', reply:'一二：好哒，听你的！' },
    { say:'一二：今天天气真好！', reply:'布布：那我们出去散步吧~' },
    { say:'布布：喝点水吧~', reply:'一二：谢谢布布提醒！💧' },
    { say:'一二：工作好辛苦~', reply:'布布：辛苦啦，抱抱！' },
    { say:'布布：开心吗今天？', reply:'一二：有布布在就很开心呀！' },
    { say:'一二：布布最好了！', reply:'布布：一二也是最棒的！' },
    { say:'布布：好无聊哦...', reply:'一二：那我陪你聊天呀~' },
  ];

  let partnerListenerCleanup = null;

  function start() {
    const s = SettingsManager.load();
    if (s.petMode !== 'dual') return;

    // 监听伙伴消息
    if (window.electronAPI && window.electronAPI.onPartnerSpeak) {
      if (partnerListenerCleanup) partnerListenerCleanup();
      partnerListenerCleanup = window.electronAPI.onPartnerSpeak((text) => {
        setTimeout(() => BubbleSystem.show(text, 4000), 1500 + Math.random() * 3000);
      });
    }

    function schedule() {
      if (SettingsManager.load().petMode !== 'dual') return;
      const delay = (2 + Math.random() * 4) * 60 * 1000; // 2-6分钟
      setTimeout(() => {
        const ex = exchanges[Math.floor(Math.random() * exchanges.length)];
        BubbleSystem.show(ex.say, 4000);
        window.electronAPI && window.electronAPI.petSpeak(ex.reply);
        schedule();
      }, delay);
    }
    // 首次对话：10秒后
    setTimeout(schedule, 10000);
  }

  function init() { setTimeout(start, 5000); }
  return { init };
})();

// ===== 启动 =====
document.addEventListener('DOMContentLoaded', () => {
  SettingsManager.load();
  TimeDisplay.init();
  PetController.init();
  BubbleSystem.init();

  const c = document.getElementById('pet-container');

  let clickTimer = null;

  // 单击/双击判断
  c.addEventListener('click', (e) => {
    if (DragSystem.didDrag()) { DragSystem.resetDrag(); return; }
    if (e.button !== 0) return;

    if (clickTimer) {
      // 双击 → 换一个图案
      clearTimeout(clickTimer);
      clickTimer = null;
      PetController.nextImage();
      BubbleSystem.show('换个造型~', 2000);
    } else {
      clickTimer = setTimeout(() => {
        clickTimer = null;
        // 单击 → 随机冒泡
        BubbleSystem.show(QuotesDB.getRandomTip(), 3000);
      }, 300);
    }
  });

  DragSystem.init();
  ContextMenu.init();
  PetInteraction.init();
});
