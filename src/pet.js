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
    // 路径格式: assets/yier/stand/stand_1.gif 等
    // 随机选择1-8的索引
    const idx = Math.floor(Math.random() * 8) + 1;
    return `assets/${character}/${state}/${state}_${idx}.gif`;
  }

  function updatePetImage(character, state, animate = true) {
    let gifPath = getGifPath(character, state);

    // 避免连续显示同一张
    if (gifPath === lastGifPath) {
      gifPath = getGifPath(character, state);
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
      petGif.style.display = 'none';
      const container = document.getElementById('pet-container');
      if (!container.querySelector('.placeholder-pet')) {
        const placeholder = document.createElement('div');
        placeholder.className = 'placeholder-pet';
        placeholder.style.cssText = `
          width: 120px; height: 120px; border-radius: 50%;
          background: ${currentCharacter === 'yier'
            ? 'radial-gradient(circle at 40% 40%, #fff, #e8e8e8, #333 85%)'
            : 'radial-gradient(circle at 40% 40%, #f5deb3, #d2a679, #8b6914 85%)'};
          display: flex; align-items: center; justify-content: center;
          font-size: 50px;
        `;
        placeholder.textContent = currentCharacter === 'yier' ? '🐼' : '🐻';
        container.appendChild(placeholder);
      }
    };

    petGif.onload = () => {
      petGif.style.display = 'block';
      const placeholder = document.getElementById('pet-container').querySelector('.placeholder-pet');
      if (placeholder) placeholder.remove();
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
