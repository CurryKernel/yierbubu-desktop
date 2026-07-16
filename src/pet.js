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

  function getStateInterval() {
    return (3 + Math.random() * 5) * 60 * 1000;
  }

  function getCharacterInterval() {
    return (30 + Math.random() * 30) * 60 * 1000;
  }

  function getRandomState() {
    const rand = Math.random();
    if (rand < 0.15) return 'cute';
    const otherStates = ['stand', 'sit', 'lie'];
    return otherStates[Math.floor(Math.random() * otherStates.length)];
  }

  function getCharacterBase(character) {
    return `assets/${character}/character.png`;
  }

  // 从所有状态中随机选一张GIF
  function getRandomGif(character) {
    const allGifs = [];
    STATES.forEach(state => {
      const files = GIFManifest[character] && GIFManifest[character][state];
      if (files) files.forEach(f => allGifs.push({ state, file: f }));
    });
    if (allGifs.length === 0) return null;

    let idx = Math.floor(Math.random() * allGifs.length);
    const gifPath = `assets/${character}/${allGifs[idx].state}/${allGifs[idx].file}`;
    if (gifPath === lastGifPath && allGifs.length > 1) {
      idx = (idx + 1) % allGifs.length;
      return { path: `assets/${character}/${allGifs[idx].state}/${allGifs[idx].file}`, state: allGifs[idx].state };
    }
    return { path: gifPath, state: allGifs[idx].state };
  }

  function updatePetImage(character, state, animate = true) {
    const baseImg = getCharacterBase(character);
    const files = GIFManifest[character] && GIFManifest[character][state];
    let useGif = null;
    if (files && files.length > 0) {
      const idx = Math.floor(Math.random() * files.length);
      const gifPath = `assets/${character}/${state}/${files[idx]}`;
      useGif = (gifPath === lastGifPath && files.length > 1)
        ? `assets/${character}/${state}/${files[(idx + 1) % files.length]}`
        : gifPath;
    }

    const targetSrc = useGif || baseImg;
    lastGifPath = targetSrc;
    let fallbackUsed = false;

    if (animate) {
      petGif.style.opacity = '0.3';
      petGif.style.transform = 'scale(0.85)';
    }

    petGif.onerror = () => {
      if (!fallbackUsed && targetSrc !== baseImg && petGif.src !== baseImg) {
        fallbackUsed = true;
        petGif.src = baseImg;
        // 关键修复：回退到基础图后也要恢复透明度
        petGif.style.opacity = '1';
        petGif.style.transform = 'scale(1)';
        petGif.onerror = null;
      }
    };

    petGif.onload = () => {
      petGif.style.opacity = '1';
      petGif.style.transform = 'scale(1)';
    };

    petGif.src = targetSrc;
    currentState = state;
  }

  function scheduleNextState() {
    clearTimeout(stateTimer);
    stateTimer = setTimeout(switchState, getStateInterval());
  }

  function switchState() {
    const newState = getRandomState();
    if (newState !== currentState) {
      updatePetImage(currentCharacter, newState);
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
    const nextChar = CHARACTERS[(CHARACTERS.indexOf(currentCharacter) + 1) % CHARACTERS.length];
    setCharacterInternal(nextChar);
    scheduleNextCharacter();
  }

  function setCharacterInternal(char) {
    if (char !== currentCharacter) {
      currentCharacter = char;
      updatePetImage(currentCharacter, getRandomState());
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

  function nextImage() {
    const gif = getRandomGif(currentCharacter);
    if (gif) {
      updatePetImage(currentCharacter, gif.state);
    }
  }

  function init() {
    const settings = SettingsManager.load();

    isAutoCharacter = settings.character === 'auto';
    currentCharacter = isAutoCharacter
      ? CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]
      : settings.character;

    // 先显示基础角色图，带 onerror 兜底
    const baseImg = getCharacterBase(currentCharacter);
    petGif.onerror = () => {
      // 基础图也加载失败，隐藏图片
      petGif.style.display = 'none';
    };
    petGif.onload = () => {
      petGif.style.display = 'block';
    };
    petGif.src = baseImg;

    // 500ms后尝试加载GIF
    setTimeout(() => {
      currentState = getRandomState();
      updatePetImage(currentCharacter, currentState, false);
    }, 500);

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

  return { init, setCharacter, nextImage, getCurrentCharacter, getCurrentState, getIsAutoCharacter };
})();
