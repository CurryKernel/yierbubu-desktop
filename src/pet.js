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

  function getRandomInterval(minSec, maxSec) {
    return Math.floor((minSec + Math.random() * (maxSec - minSec)) * 1000);
  }

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

  // 获取角色的基础形象（character.png — 一二白色熊猫 / 布布棕色熊）
  function getCharacterBase(character) {
    return `assets/${character}/character.png`;
  }

  // 随机选GIF
  function getRandomGif(character) {
    // 从所有状态中随机选一张GIF
    const allGifs = [];
    STATES.forEach(state => {
      const files = GIFManifest[character] && GIFManifest[character][state];
      if (files) files.forEach(f => allGifs.push({ state, file: f }));
    });
    if (allGifs.length === 0) return null;

    let idx = Math.floor(Math.random() * allGifs.length);
    let gifPath = `assets/${character}/${allGifs[idx].state}/${allGifs[idx].file}`;

    if (gifPath === lastGifPath && allGifs.length > 1) {
      idx = (idx + 1) % allGifs.length;
      gifPath = `assets/${character}/${allGifs[idx].state}/${allGifs[idx].file}`;
    }
    return { path: gifPath, state: allGifs[idx].state };
  }

  function updatePetImage(character, state, animate = true) {
    // 先显示角色基础形象确保视觉区分
    const baseImg = getCharacterBase(character);

    // 尝试加载GIF
    const files = GIFManifest[character] && GIFManifest[character][state];
    let useGif = null;
    if (files && files.length > 0) {
      const idx = Math.floor(Math.random() * files.length);
      let gifPath = `assets/${character}/${state}/${files[idx]}`;
      if (gifPath === lastGifPath && files.length > 1) {
        const idx2 = (idx + 1) % files.length;
        gifPath = `assets/${character}/${state}/${files[idx2]}`;
      }
      useGif = gifPath;
    }

    // 先显示基础形象
    if (animate) {
      petGif.style.opacity = '0.3';
      petGif.style.transform = 'scale(0.9)';
    }

    // 设置GIF（如果加载失败，自动回退到 character.png）
    const targetSrc = useGif || baseImg;
    lastGifPath = targetSrc;

    petGif.onerror = () => {
      if (petGif.src !== baseImg) {
        petGif.src = baseImg;
        petGif.onerror = null;
      }
    };

    petGif.onload = () => {
      if (animate) {
        petGif.style.opacity = '1';
        petGif.style.transform = 'scale(1)';
      }
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
    const idx = CHARACTERS.indexOf(currentCharacter);
    const nextChar = CHARACTERS[(idx + 1) % CHARACTERS.length];
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

  // 换一个图案（从所有状态中随机选）
  function nextImage() {
    const gif = getRandomGif(currentCharacter);
    if (gif) {
      updatePetImage(currentCharacter, gif.state);
    }
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

    // 首次加载：显示角色基础形象，然后尝试GIF
    const baseImg = getCharacterBase(currentCharacter);
    petGif.src = baseImg;
    petGif.onerror = null;

    // 延迟加载GIF以替换基础形象
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
