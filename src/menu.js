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

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
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
    if (!menuEl) {
      menuEl = document.getElementById('context-menu');
    }
    return menuEl;
  }

  function buildMenuItems() {
    const settings = SettingsManager.load();
    const isAuto = PetController.getIsAutoCharacter();
    const charName = PetController.getCurrentCharacter() === 'yier' ? '一二 🐼' : '布布 🐻';
    const charLabel = isAuto ? `自动 (当前:${charName})` : charName;

    return [
      {
        label: `🐼 角色：${charLabel}`,
        sub: [
          { label: '一二 🐼', action: () => PetController.setCharacter('yier') },
          { label: '布布 🐻', action: () => PetController.setCharacter('bubu') },
          { label: '自动切换 🔄', action: () => PetController.setCharacter('auto') },
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
        label: '🚪 退出宠物',
        action: () => {
          if (window.electronAPI) window.electronAPI.closeApp();
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

  function clearSubMenu() {
    if (subMenuEl) {
      subMenuEl.remove();
      subMenuEl = null;
    }
  }

  function renderSubMenu(subItems, parentRow) {
    clearSubMenu();

    subMenuEl = document.createElement('div');
    subMenuEl.className = 'sub-menu';
    subMenuEl.style.cssText = `
      position: fixed;
      background: rgba(255,255,255,0.96);
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      padding: 6px 0;
      min-width: 150px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      backdrop-filter: blur(10px);
      z-index: 10000;
      font-family: 'Microsoft YaHei', sans-serif;
    `;

    subItems.forEach(item => {
      const row = document.createElement('div');
      row.textContent = item.label;
      row.style.cssText = `
        padding: 10px 18px;
        cursor: pointer;
        white-space: nowrap;
        color: #333;
        font-size: 14px;
      `;
      row.addEventListener('mouseenter', () => { row.style.background = '#f5f5f5'; });
      row.addEventListener('mouseleave', () => { row.style.background = 'transparent'; });
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        item.action();
      });
      subMenuEl.appendChild(row);
    });

    // 计算位置 — 父菜单右侧
    const menuRect = getMenuEl().getBoundingClientRect();
    const parentRect = parentRow.getBoundingClientRect();

    let left = menuRect.right;
    let top = parentRect.top;

    // 防止溢出右侧
    if (left + 160 > window.innerWidth) {
      left = menuRect.left - 160;
    }
    // 防止溢出底部
    const subHeight = subItems.length * 40 + 12;
    if (top + subHeight > window.innerHeight) {
      top = window.innerHeight - subHeight - 10;
    }

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
      row.style.cssText = `
        padding: 10px 18px;
        cursor: pointer;
        white-space: nowrap;
        color: #333;
        font-size: 14px;
        position: relative;
      `;

      if (item.sub) {
        row.textContent = item.label + '  ▸';
        row.addEventListener('mouseenter', () => {
          row.style.background = '#f5f5f5';
          renderSubMenu(item.sub, row);
        });
      } else {
        row.textContent = item.label;
        row.addEventListener('mouseenter', () => {
          row.style.background = '#f5f5f5';
          clearSubMenu();
        });
        row.addEventListener('click', (e) => {
          e.stopPropagation();
          if (item.action) item.action();
          if (!item.sub) hide();
        });
      }

      row.addEventListener('mouseleave', () => {
        row.style.background = 'transparent';
      });

      menu.appendChild(row);
    });

    // 防止菜单溢出屏幕
    const menuHeight = items.filter(i => !i.separator).length * 40 + 12;
    const maxX = Math.max(0, window.innerWidth - 200);
    const maxY = Math.max(0, window.innerHeight - menuHeight);
    menu.style.left = Math.min(Math.max(0, x), maxX) + 'px';
    menu.style.top = Math.min(Math.max(0, y), maxY) + 'px';
    menu.style.display = 'block';
  }

  function show(e) {
    e.preventDefault();
    e.stopPropagation();
    renderMenu(buildMenuItems(), e.clientX, e.clientY);
  }

  function hide() {
    const menu = getMenuEl();
    if (menu) menu.style.display = 'none';
    clearSubMenu();
  }

  function init() {
    const petContainer = document.getElementById('pet-container');
    petContainer.addEventListener('contextmenu', show);
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#context-menu') && !e.target.closest('.sub-menu')) {
        hide();
      }
    });
  }

  return { init, show, hide };
})();

// ===== 双宠互动 =====
const PetInteraction = (() => {
  let cleanupPartnerListener = null;

  // 互动对话库
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

  function getExchange() {
    return exchanges[Math.floor(Math.random() * exchanges.length)];
  }

  function startInteraction() {
    const settings = SettingsManager.load();
    if (settings.petMode !== 'dual') return;

    if (window.electronAPI && window.electronAPI.onPartnerSpeak) {
      cleanupPartnerListener = window.electronAPI.onPartnerSpeak((text) => {
        const delay = 1500 + Math.random() * 3000;
        setTimeout(() => {
          BubbleSystem.show(text, 4000);
        }, delay);
      });
    }

    function scheduleExchange() {
      const settings = SettingsManager.load();
      if (settings.petMode !== 'dual') return;

      const delay = (5 + Math.random() * 10) * 60 * 1000;
      setTimeout(() => {
        const ex = getExchange();
        const isFirstPet = PetController.getCurrentCharacter() === 'yier';

        if (isFirstPet) {
          BubbleSystem.show(ex.say, 4000);
          if (window.electronAPI) window.electronAPI.petSpeak(ex.reply);
        }
        scheduleExchange();
      }, delay);
    }

    setTimeout(scheduleExchange, 30000);
  }

  function init() {
    setTimeout(startInteraction, 5000);
  }

  return { init, getExchange };
})();

// ===== 初始化所有系统 =====
document.addEventListener('DOMContentLoaded', () => {
  SettingsManager.load();
  PetController.init();
  BubbleSystem.init();

  const petContainer = document.getElementById('pet-container');
  let clickTimer = null;

  // 单击/双击判断
  petContainer.addEventListener('click', (e) => {
    if (DragSystem.didDrag()) {
      DragSystem.resetDrag();
      return;
    }
    if (e.button !== 0) return;

    if (clickTimer) {
      // 双击 — 打开快捷操作
      clearTimeout(clickTimer);
      clickTimer = null;
      showQuickActions(e);
    } else {
      // 等待判断是单击还是双击
      clickTimer = setTimeout(() => {
        clickTimer = null;
        // 单击 — 随机冒泡
        BubbleSystem.show(QuotesDB.getRandomTip(), 3000);
      }, 300);
    }
  });

  // 快捷操作面板
  function showQuickActions(e) {
    const settings = SettingsManager.load();
    const actions = [
      {
        label: settings.petMode === 'dual' ? '👥 切换单宠' : '💕 开启双宠',
        action: () => {
          const newMode = settings.petMode === 'dual' ? 'single' : 'dual';
          SettingsManager.save({ petMode: newMode });
          if (window.electronAPI) window.electronAPI.toggleSecondPet(newMode === 'dual');
          BubbleSystem.show(newMode === 'dual' ? '一二布布一起来啦！💕' : '切换为单宠模式~', 3000);
        },
      },
      {
        label: PetController.getCurrentCharacter() === 'yier' ? '🐻 切成布布' : '🐼 切成一二',
        action: () => {
          const newChar = PetController.getCurrentCharacter() === 'yier' ? 'bubu' : 'yier';
          PetController.setCharacter(newChar);
          BubbleSystem.show(newChar === 'yier' ? '一二来啦！🐼' : '布布来啦！🐻', 3000);
        },
      },
      {
        label: '⚙️ 设置面板',
        action: () => {
          if (window.electronAPI) window.electronAPI.openSettings();
        },
      },
    ];

    // 创建快捷操作浮层
    const existing = document.querySelector('.quick-actions-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.className = 'quick-actions-panel';
    panel.style.cssText = `
      position: fixed;
      background: rgba(255,255,255,0.95);
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      padding: 4px 0;
      min-width: 160px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 9998;
      font-size: 14px;
      font-family: 'Microsoft YaHei', sans-serif;
      backdrop-filter: blur(10px);
    `;

    actions.forEach((a, i) => {
      const row = document.createElement('div');
      row.textContent = a.label;
      row.style.cssText = `
        padding: 10px 16px;
        cursor: pointer;
        white-space: nowrap;
        color: #333;
        transition: background 0.15s;
      `;
      row.addEventListener('mouseenter', () => { row.style.background = '#fef0f3'; });
      row.addEventListener('mouseleave', () => { row.style.background = 'transparent'; });
      row.addEventListener('click', (ev) => {
        ev.stopPropagation();
        a.action();
        panel.remove();
      });
      panel.appendChild(row);
    });

    // 位置计算
    const maxX = window.innerWidth - 170;
    const maxY = window.innerHeight - (actions.length * 40 + 20);
    panel.style.left = Math.min(e.clientX, maxX) + 'px';
    panel.style.top = Math.min(e.clientY, maxY) + 'px';

    document.body.appendChild(panel);

    // 点击其他地方关闭
    const closePanel = (ev) => {
      if (!panel.contains(ev.target)) {
        panel.remove();
        document.removeEventListener('click', closePanel);
      }
    };
    setTimeout(() => document.addEventListener('click', closePanel), 100);
  }

  DragSystem.init();
  ContextMenu.init();
  PetInteraction.init();
});
