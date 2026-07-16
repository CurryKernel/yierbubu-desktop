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
    return getRandomInterval(3 * 60, 8 * 60);
  }

  function getCharacterInterval() {
    return getRandomInterval(30 * 60, 60 * 60);
  }

  function getRandomState() {
    const rand = Math.random();
    if (rand < 0.15) return 'cute';
    const otherStates = ['stand', 'sit', 'lie'];
    return otherStates[Math.floor(Math.random() * otherStates.length)];
  }

  function getGifPath(character, state) {
    // 从 manifest 获取该分类下所有可用 GIF
    const files = GIFManifest[character] && GIFManifest[character][state];
    if (!files || files.length === 0) return null;

    // 随机选择，避免重复
    let idx = Math.floor(Math.random() * files.length);
    let gifPath = `assets/${character}/${state}/${files[idx]}`;

    // 避免连续显示同一张
    if (gifPath === lastGifPath && files.length > 1) {
      idx = (idx + 1) % files.length;
      gifPath = `assets/${character}/${state}/${files[idx]}`;
    }

    return gifPath;
  }

  function updatePetImage(character, state, animate = true) {
    const gifPath = getGifPath(character, state);

    if (!gifPath) {
      console.warn(`No GIFs for ${character}/${state}`);
      return;
    }

    lastGifPath = gifPath;

    if (animate) {
      petGif.classList.add('pet-switching');
      setTimeout(() => {
        petGif.src = gifPath;
        petGif.classList.remove('pet-switching');
      }, 150);
    } else {
      petGif.src = gifPath;
    }

    petGif.onerror = () => {
      console.warn(`Failed to load: ${gifPath}`);
      petGif.style.display = 'none';
    };

    petGif.onload = () => {
      petGif.style.display = 'block';
    };
  }

  function switchState() {
    const newState = getRandomState();
    if (newState !== currentState) {
      currentState = newState;
      updatePetImage(currentCharacter, currentState);
    }
    clearTimeout(stateTimer);
    stateTimer = setTimeout(switchState, getStateInterval());
  }

  function switchCharacter() {
    if (!isAutoCharacter) return;
    const idx = CHARACTERS.indexOf(currentCharacter);
    const nextChar = CHARACTERS[(idx + 1) % CHARACTERS.length];
    setCharacterInternal(nextChar);
    clearTimeout(characterTimer);
    characterTimer = setTimeout(switchCharacter, getCharacterInterval());
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

    stateTimer = setTimeout(switchState, getStateInterval());

    if (isAutoCharacter) {
      characterTimer = setTimeout(switchCharacter, getCharacterInterval());
    }

    console.log(`Pet initialized: ${currentCharacter} in ${currentState} state`);
  }

  function getCurrentCharacter() { return currentCharacter; }
  function getCurrentState() { return currentState; }
  function getIsAutoCharacter() { return isAutoCharacter; }

  return {
    init,
    switchState,
    switchCharacter,
    setCharacter,
    getCurrentCharacter,
    getCurrentState,
    getIsAutoCharacter,
  };
})();
