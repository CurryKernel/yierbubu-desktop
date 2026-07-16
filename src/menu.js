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
    const charLabel = isAuto ? '自动切换' : (PetController.getCurrentCharacter() === 'yier' ? '一二 🐼' : '布布 🐻');

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
          { label: '单宠模式', action: () => setPetMode('single') },
          { label: '双宠模式', action: () => setPetMode('dual') },
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
        label: '⚙️ 设置...',
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

  function renderSubMenu(subItems, parentRow) {
    if (subMenuEl) subMenuEl.remove();

    subMenuEl = document.createElement('div');
    subMenuEl.className = 'sub-menu';

    subItems.forEach(item => {
      const row = document.createElement('div');
      row.className = 'menu-item';
      row.textContent = item.label;
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        item.action();
        hide();
      });
      subMenuEl.appendChild(row);
    });

    const menu = getMenuEl();
    const menuRect = menu.getBoundingClientRect();
    const parentRect = parentRow.getBoundingClientRect();

    // 计算子菜单位置
    let left = menuRect.width;
    let top = parentRect.top - menuRect.top - 6;

    // 防止溢出屏幕右侧
    if (menuRect.right + 150 > window.innerWidth) {
      left = -150;
    }

    subMenuEl.style.left = left + 'px';
    subMenuEl.style.top = top + 'px';

    menu.appendChild(subMenuEl);

    // 鼠标离开菜单或子菜单时移除子菜单
    const removeSub = (e) => {
      if (!subMenuEl) return;
      const rel = e.relatedTarget;
      if (!subMenuEl.contains(rel) && rel !== parentRow) {
        subMenuEl.remove();
        subMenuEl = null;
        menu.removeEventListener('mouseleave', removeSub);
      }
    };
    menu.addEventListener('mouseleave', removeSub);
  }

  function renderMenu(items, x, y) {
    const menu = getMenuEl();
    // 清除旧内容
    menu.innerHTML = '';
    if (subMenuEl) { subMenuEl.remove(); subMenuEl = null; }

    items.forEach(item => {
      if (item.separator) {
        const sep = document.createElement('div');
        sep.className = 'menu-separator';
        menu.appendChild(sep);
        return;
      }

      const row = document.createElement('div');
      row.className = 'menu-item';
      row.textContent = item.label;

      if (item.sub) {
        row.textContent = item.label + '  ▸';
        row.addEventListener('mouseenter', () => {
          renderSubMenu(item.sub, row);
        });
      }

      row.addEventListener('click', (e) => {
        e.stopPropagation();
        if (item.action) item.action();
        if (!item.sub) hide();
      });

      menu.appendChild(row);
    });

    // 调整位置防止溢出屏幕
    const maxX = window.innerWidth - 180;
    const maxY = window.innerHeight - 50;
    menu.style.left = Math.min(x, maxX) + 'px';
    menu.style.top = Math.min(y, maxY) + 'px';
    menu.style.display = 'block';
  }

  function show(e) {
    e.preventDefault();
    e.stopPropagation();
    renderMenu(buildMenuItems(), e.clientX, e.clientY);
  }

  function hide() {
    const menu = getMenuEl();
    if (menu) {
      menu.style.display = 'none';
    }
    if (subMenuEl) {
      subMenuEl.remove();
      subMenuEl = null;
    }
  }

  function init() {
    const petContainer = document.getElementById('pet-container');
    petContainer.addEventListener('contextmenu', show);
    // 点击页面任何地方隐藏菜单
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#context-menu')) {
        hide();
      }
    });
  }

  return { init, show, hide };
})();

// ===== 初始化所有系统 =====
document.addEventListener('DOMContentLoaded', () => {
  SettingsManager.load();
  PetController.init();
  BubbleSystem.init();

  // 点击宠物 — 如果没拖动就打招呼
  const petContainer = document.getElementById('pet-container');
  petContainer.addEventListener('click', (e) => {
    if (DragSystem.didDrag()) return;
    if (e.button !== 0) return;
    BubbleSystem.show(QuotesDB.getRandomTip(), 3000);
  });

  DragSystem.init();
  ContextMenu.init();
});
