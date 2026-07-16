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
          if (window.electronAPI) window.electronAPI.openSettings();
          hide();
        },
      },
      {
        label: '🚪 退出',
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
        const existingSub = menu.querySelector('.sub-menu');
        if (existingSub) existingSub.remove();
        if (item.sub) {
          renderSubMenu(item.sub, row, menu);
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

    const maxX = window.innerWidth - 180;
    const maxY = window.innerHeight - menu.scrollHeight;
    menu.style.left = Math.min(x, maxX) + 'px';
    menu.style.top = Math.min(y, maxY) + 'px';
    menu.style.display = 'block';
  }

  function renderSubMenu(subItems, parentRow, menu) {
    const sub = document.createElement('div');
    sub.className = 'sub-menu';
    sub.style.cssText = `
      position: absolute;
      left: 100%;
      top: ${parentRow.offsetTop - 6}px;
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
    document.addEventListener('click', hide);
  }

  return { init, show, hide };
})();

// === 启动所有系统 ===
document.addEventListener('DOMContentLoaded', () => {
  SettingsManager.load();
  PetController.init();
  BubbleSystem.init();
  ContextMenu.init();
});
