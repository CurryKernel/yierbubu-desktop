// ===== 拖动系统 =====
const DragSystem = (() => {
  let isDragging = false;
  let startX = 0, startY = 0;
  let hasMoved = false;

  function init() {
    const petContainer = document.getElementById('pet-container');
    petContainer.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isDragging = true;
      hasMoved = false;
      startX = e.screenX;
      startY = e.screenY;
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.screenX - startX;
      const dy = e.screenY - startY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        hasMoved = true;
        window.electronAPI && window.electronAPI.moveWindow(dx, dy);
        startX = e.screenX;
        startY = e.screenY;
      }
    });
    document.addEventListener('mouseup', () => { isDragging = false; });
  }

  function didDrag() { return hasMoved; }
  function resetDrag() { hasMoved = false; }
  return { init, didDrag, resetDrag };
})();

// ===== 右键菜单系统 =====
const ContextMenu = (() => {
  let menuEl = null;
  let subMenuEl = null;

  function getMenuEl() {
    if (!menuEl) menuEl = document.getElementById('context-menu');
    return menuEl;
  }

  function buildMenuItems() {
    const settings = SettingsManager.load();
    const isAuto = PetController.getIsAutoCharacter();
    const charName = PetController.getCurrentCharacter() === 'yier' ? '一二 🐼' : '布布 🐻';
    const charLabel = isAuto ? `自动切换 (${charName})` : charName;
    const curState = PetController.getCurrentState();
    const stateNames = { stand: '站立', sit: '坐', lie: '趴下', cute: '撒娇' };

    return [
      {
        label: `🖼️ 切换状态 (当前:${stateNames[curState]})`,
        sub: [
          { label: '🧍 站立',  action: () => PetController.forceState('stand') },
          { label: '🪑 坐',    action: () => PetController.forceState('sit') },
          { label: '😴 趴下',  action: () => PetController.forceState('lie') },
          { label: '💕 撒娇',  action: () => PetController.forceState('cute') },
          { label: '🎲 随机',  action: () => PetController.forceState('random') },
        ],
      },
      {
        label: `🐼 角色：${charLabel}`,
        sub: [
          { label: '一二 🐼', action: () => { PetController.setCharacter('yier'); hide(); } },
          { label: '布布 🐻', action: () => { PetController.setCharacter('bubu'); hide(); } },
          { label: '自动切换 🔄', action: () => { PetController.setCharacter('auto'); hide(); } },
        ],
      },
      {
        label: `👥 模式：${settings.petMode === 'dual' ? '双宠' : '单宠'}`,
        sub: [
          { label: '单宠模式 🐾', action: () => setPetMode('single') },
          { label: '双宠模式 💕', action: () => setPetMode('dual') },
        ],
      },
      {
        label: `💬 提示语：${settings.tipsEnabled ? '开 ✓' : '关 ✗'}`,
        action: () => {
          SettingsManager.save({ tipsEnabled: !SettingsManager.get('tipsEnabled') });
          BubbleSystem.refresh();
          hide();
        },
      },
      {
        label: `💧 喝水提醒：${settings.waterReminderEnabled ? '开 ✓' : '关 ✗'}`,
        action: () => {
          SettingsManager.save({ waterReminderEnabled: !SettingsManager.get('waterReminderEnabled') });
          BubbleSystem.refresh();
          hide();
        },
      },
      { separator: true },
      {
        label: '⚙️ 设置面板...',
        action: () => {
          if (window.electronAPI) window.electronAPI.openSettings();
          hide();
        },
      },
      {
        label: '🚪 退出软件',
        action: () => {
          if (window.electronAPI) window.electronAPI.closeApp();
        },
      },
    ];
  }

  function setPetMode(mode) {
    SettingsManager.save({ petMode: mode });
    if (window.electronAPI) window.electronAPI.toggleSecondPet(mode === 'dual');
    hide();
  }

  function clearSubMenu() {
    if (subMenuEl) { subMenuEl.remove(); subMenuEl = null; }
  }

  function renderSubMenu(subItems, parentRow) {
    clearSubMenu();
    subMenuEl = document.createElement('div');
    subMenuEl.style.cssText = `
      position: fixed;
      background: rgba(255,255,255,0.97);
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      padding: 4px 0;
      min-width: 140px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      backdrop-filter: blur(10px);
      z-index: 10000;
      font-family: 'Microsoft YaHei', sans-serif;
      font-size: 13px;
    `;

    subItems.forEach(item => {
      const row = document.createElement('div');
      row.textContent = item.label;
      row.style.cssText = 'padding:9px 16px;cursor:pointer;white-space:nowrap;color:#333;';
      row.addEventListener('mouseenter', () => { row.style.background = '#fef0f3'; });
      row.addEventListener('mouseleave', () => { row.style.background = 'transparent'; });
      row.addEventListener('click', (e) => { e.stopPropagation(); item.action(); });
      subMenuEl.appendChild(row);
    });

    const menuRect = getMenuEl().getBoundingClientRect();
    const parentRect = parentRow.getBoundingClientRect();
    let left = menuRect.right;
    let top = parentRect.top;
    if (left + 150 > window.innerWidth) left = menuRect.left - 150;
    const subH = subItems.length * 36 + 8;
    if (top + subH > window.innerHeight) top = window.innerHeight - subH - 10;

    subMenuEl.style.left = left + 'px';
    subMenuEl.style.top = top + 'px';
    document.body.appendChild(subMenuEl);
  }

  function renderMenu(items, x, y) {
    const menu = getMenuEl();
    menu.innerHTML = '';
    clearSubMenu();

    items.forEach(item => {
      if (item.separator) {
        const sep = document.createElement('div');
        sep.style.cssText = 'height:1px;background:#eee;margin:4px 0;';
        menu.appendChild(sep);
        return;
      }

      const row = document.createElement('div');
      row.style.cssText = 'padding:9px 16px;cursor:pointer;white-space:nowrap;color:#333;font-size:13px;position:relative;';

      if (item.sub) {
        row.textContent = item.label + '  ▸';
        row.addEventListener('mouseenter', () => {
          row.style.background = '#fef0f3';
          renderSubMenu(item.sub, row);
        });
      } else {
        row.textContent = item.label;
        row.addEventListener('mouseenter', () => {
          row.style.background = '#fef0f3';
          clearSubMenu();
        });
        row.addEventListener('click', (e) => {
          e.stopPropagation();
          if (item.action) item.action();
          hide();
        });
      }

      row.addEventListener('mouseleave', () => { row.style.background = 'transparent'; });
      menu.appendChild(row);
    });

    const menuH = items.filter(i => !i.separator).length * 36 + 8;
    menu.style.left = Math.min(Math.max(0, x), window.innerWidth - 180) + 'px';
    menu.style.top = Math.min(Math.max(0, y), window.innerHeight - menuH) + 'px';
    menu.style.display = 'block';
  }

  function show(e) {
    e.preventDefault(); e.stopPropagation();
    renderMenu(buildMenuItems(), e.clientX, e.clientY);
  }

  function hide() {
    const menu = getMenuEl();
    if (menu) menu.style.display = 'none';
    clearSubMenu();
  }

  function init() {
    document.getElementById('pet-container').addEventListener('contextmenu', show);
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#context-menu') && !e.target.closest('div[style*="fixed"]')) {
        hide();
      }
    });
  }

  return { init, show, hide };
})();

// ===== 双宠互动 =====
const PetInteraction = (() => {
  let cleanupPartnerListener = null;
  const exchanges = [
    { say: '一二：你在干嘛呀~', reply: '布布：在想你呀！' },
    { say: '一二：今天天气真好！', reply: '布布：那我们出去散步吧~' },
    { say: '一二：我饿啦！', reply: '布布：我去给你做好吃的！' },
    { say: '一二：好无聊哦...', reply: '布布：那我陪你聊天呀~' },
    { say: '布布：累不累呀？', reply: '一二：看到你就不累啦！' },
    { say: '布布：该休息一下了哦~', reply: '一二：好哒，听你的！' },
    { say: '一二：今天工作好辛苦', reply: '布布：辛苦啦，抱抱~' },
    { say: '布布：喝点水吧~', reply: '一二：谢谢布布提醒！💧' },
    { say: '一二：布布最好了！', reply: '布布：一二也是最棒的！' },
    { say: '布布：开心吗今天？', reply: '一二：有布布在就很开心呀！' },
  ];

  function getExchange() { return exchanges[Math.floor(Math.random() * exchanges.length)]; }

  function startInteraction() {
    const settings = SettingsManager.load();
    if (settings.petMode !== 'dual') return;

    if (window.electronAPI && window.electronAPI.onPartnerSpeak) {
      cleanupPartnerListener = window.electronAPI.onPartnerSpeak((text) => {
        setTimeout(() => BubbleSystem.show(text, 4000), 1500 + Math.random() * 3000);
      });
    }

    function schedule() {
      if (SettingsManager.load().petMode !== 'dual') return;
      setTimeout(() => {
        const ex = getExchange();
        if (PetController.getCurrentCharacter() === 'yier') {
          BubbleSystem.show(ex.say, 4000);
          if (window.electronAPI) window.electronAPI.petSpeak(ex.reply);
        }
        schedule();
      }, (5 + Math.random() * 10) * 60 * 1000);
    }
    setTimeout(schedule, 30000);
  }

  function init() { setTimeout(startInteraction, 5000); }
  return { init, getExchange };
})();

// ===== 时间显示 =====
const TimeDisplay = (() => {
  let lastHourAnnounced = -1;

  function update() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const el = document.getElementById('info-time');
    if (el) el.textContent = `${hh}:${mm}`;

    // 整点报时
    const hour = now.getHours();
    if (now.getMinutes() === 0 && hour !== lastHourAnnounced) {
      lastHourAnnounced = hour;
      const msgs = {
        8: '一二说：早上八点啦！☀️', 9: '布布说：九点，开工咯~',
        12: '一二说：十二点！吃午饭 🍚', 14: '布布说：下午两点💪',
        18: '一二说：六点，下班啦🎉', 21: '布布说：九点，准备休息~',
        22: '一二说：十点，该睡了🌙', 0: '布布说：午夜了😴',
      };
      const msg = msgs[hour] || `一二布布报时：${hour}点整~`;
      setTimeout(() => BubbleSystem.show(msg, 5000), 500);
    }
  }

  function init() {
    update();
    setInterval(update, 60000);
  }
  return { init };
})();

// ===== 启动 =====
document.addEventListener('DOMContentLoaded', () => {
  SettingsManager.load();
  TimeDisplay.init();
  PetController.init();
  BubbleSystem.init();

  const petContainer = document.getElementById('pet-container');
  let clickTimer = null;

  petContainer.addEventListener('click', (e) => {
    if (DragSystem.didDrag()) { DragSystem.resetDrag(); return; }
    if (e.button !== 0) return;

    if (clickTimer) {
      // 双击 → 切换角色
      clearTimeout(clickTimer);
      clickTimer = null;
      const curChar = PetController.getCurrentCharacter();
      const nextChar = curChar === 'yier' ? 'bubu' : 'yier';
      PetController.setCharacter(nextChar);
      BubbleSystem.show(nextChar === 'yier' ? '一二来啦！🐼' : '布布来啦！🐻', 2500);
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
