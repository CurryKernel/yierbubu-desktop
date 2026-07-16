const PetController = (() => {
  const STATES = ['stand', 'sit', 'lie', 'cute'];
  const CHARACTERS = ['yier', 'bubu'];

  let currentState = 'stand';
  let currentCharacter = 'yier';
  let stateTimer = null;
  let characterTimer = null;
  let isAutoCharacter = true;

  const petGif = document.getElementById('pet-gif');
  let lastGifPath = '';

  // 时间间隔（毫秒）
  function getStateInterval() {
    // 3-8 分钟
    return (3 + Math.random() * 5) * 60 * 1000;
  }

  function getCharacterInterval() {
    // 30-60 分钟
    return (30 + Math.random() * 30) * 60 * 1000;
  }

  function getRandomState() {
    const rand = Math.random();
    if (rand < 0.15) return 'cute';
    const otherStates = ['stand', 'sit', 'lie'];
    return otherStates[Math.floor(Math.random() * otherStates.length)];
  }

  function getGifPath(character, state) {
    const files = GIFManifest[character] && GIFManifest[character][state];
    if (!files || files.length === 0) return null;

    let idx = Math.floor(Math.random() * files.length);
    let gifPath = `assets/${character}/${state}/${files[idx]}`;

    if (gifPath === lastGifPath && files.length > 1) {
      idx = (idx + 1) % files.length;
      gifPath = `assets/${character}/${state}/${files[idx]}`;
    }

    return gifPath;
  }

  function updatePetImage(character, state, animate = true) {
    const gifPath = getGifPath(character, state);
    if (!gifPath) return;

    lastGifPath = gifPath;

    function apply() {
      petGif.src = gifPath;
    }

    if (animate) {
      petGif.style.opacity = '0.3';
      petGif.style.transform = 'scale(0.85)';
      setTimeout(() => {
        apply();
        petGif.style.opacity = '1';
        petGif.style.transform = 'scale(1)';
      }, 200);
    } else {
      apply();
    }

    petGif.onerror = () => {
      // GIF 加载失败 → 用角色特征图作为后备
      petGif.src = `assets/${currentCharacter}/character.png`;
      petGif.onerror = null; // 防止死循环
    };
  }

  function scheduleNextState() {
    clearTimeout(stateTimer);
    stateTimer = setTimeout(switchState, getStateInterval());
  }

  function switchState() {
    const newState = getRandomState();
    if (newState !== currentState) {
      currentState = newState;
      updatePetImage(currentCharacter, currentState);
    }
    scheduleNextState();
  }

  function scheduleNextCharacter() {
    clearTimeout(characterTimer);
    if (isAutoCharacter) {
      characterTimer = setTimeout(switchCharacter, getCharacterInterval());
    }
  }

  function switchCharacter() {
    if (!isAutoCharacter) return;
    const idx = CHARACTERS.indexOf(currentCharacter);
    const nextChar = CHARACTERS[(idx + 1) % CHARACTERS.length];
    setCharacterInternal(nextChar);
    scheduleNextCharacter();
  }

  function setCharacterInternal(char) {
    if (char !== currentCharacter) {
      currentCharacter = char;
      currentState = getRandomState();
      updatePetImage(currentCharacter, currentState);
    }
  }

  function setCharacter(char) {
    if (char === 'auto') {
      isAutoCharacter = true;
      switchCharacter();
      return;
    }
    isAutoCharacter = false;
    clearTimeout(characterTimer);
    setCharacterInternal(char);
  }

  function init() {
    const settings = SettingsManager.load();

    if (settings.character === 'auto') {
      isAutoCharacter = true;
      currentCharacter = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
    } else {
      isAutoCharacter = false;
      currentCharacter = settings.character;
    }

    currentState = getRandomState();
    updatePetImage(currentCharacter, currentState, false);

    const petWrapper = document.getElementById('pet-wrapper');
    if (settings.petSize) {
      petWrapper.classList.add(`pet-size-${settings.petSize}`);
    }

    scheduleNextState();
    scheduleNextCharacter();

    console.log(`Pet ready: ${currentCharacter} / ${currentState}`);
  }

  function getCurrentCharacter() { return currentCharacter; }
  function getCurrentState() { return currentState; }
  function getIsAutoCharacter() { return isAutoCharacter; }

  // 手动强制切换状态（右键菜单用）
  function forceState(state) {
    if (state === 'random') {
      currentState = getRandomState();
    } else if (STATES.includes(state)) {
      currentState = state;
    }
    updatePetImage(currentCharacter, currentState);
    // 重置定时器
    scheduleNextState();
  }

  return { init, setCharacter, forceState, getCurrentCharacter, getCurrentState, getIsAutoCharacter };
})();
