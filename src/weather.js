// 天气 + 时间 + 位置 信息模块
const WeatherSystem = (() => {
  let weatherData = { temp: '', desc: '', icon: '' };
  let locationName = '加载中...';

  // 整点报时标记
  let lastHourAnnounced = -1;

  // 天气图标映射
  const weatherIcons = {
    '晴': '☀️', '少云': '🌤️', '多云': '⛅', '阴': '☁️',
    '雨': '🌧️', '雪': '❄️', '雾': '🌫️', '风': '💨',
    '雷': '⛈️', '雹': '🌨️',
    'Sunny': '☀️', 'Clear': '☀️', 'Cloudy': '☁️', 'Overcast': '☁️',
    'Rain': '🌧️', 'Snow': '❄️', 'Fog': '🌫️', 'Mist': '🌫️',
  };

  function getWeatherIcon(desc) {
    if (!desc) return '🌈';
    for (const [key, icon] of Object.entries(weatherIcons)) {
      if (desc.includes(key)) return icon;
    }
    return '🌤️';
  }

  async function fetchWeather() {
    try {
      // 使用 wttr.in 免费天气 API
      const resp = await fetch('https://wttr.in/?format=%C|%t|%l', {
        signal: AbortSignal.timeout(8000),
      });
      if (resp.ok) {
        const text = await resp.text();
        const parts = text.trim().split('|');
        if (parts.length >= 3) {
          weatherData.desc = parts[0].trim();
          weatherData.temp = parts[1].trim();
          locationName = parts[2].trim();
          weatherData.icon = getWeatherIcon(weatherData.desc);
        }
      }
    } catch (e) {
      // 网络不通就用默认值
      weatherData = { temp: '--°C', desc: '未知', icon: '🌈' };
      locationName = '一二布布在陪你';
    }
    updateDisplay();
  }

  function updateTime() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('info-time').textContent = `🕐 ${hh}:${mm}`;

    // 整点报时
    const hour = now.getHours();
    const minute = now.getMinutes();
    if (minute === 0 && hour !== lastHourAnnounced) {
      lastHourAnnounced = hour;
      let timeMsg;
      if (hour === 8) timeMsg = '一二说：早上八点啦，开始新的一天吧！☀️';
      else if (hour === 9) timeMsg = '布布说：九点了，该上班/上课咯~';
      else if (hour === 12) timeMsg = '一二说：中午十二点！记得吃午饭呀 🍚';
      else if (hour === 14) timeMsg = '布布说：下午两点，打起精神来！💪';
      else if (hour === 18) timeMsg = '一二说：下午六点，下班/放学啦！🎉';
      else if (hour === 21) timeMsg = '布布说：晚上九点，准备洗漱休息吧~';
      else if (hour === 22) timeMsg = '一二说：十点了，该睡觉啦 🌙';
      else if (hour === 0) timeMsg = '布布说：午夜了！怎么还不睡？😴';
      else timeMsg = `一二布布报时：现在是 ${hour} 点整~`;

      if (typeof BubbleSystem !== 'undefined') {
        setTimeout(() => BubbleSystem.show(timeMsg, 5000), 500);
      }
    }
  }

  function updateDisplay() {
    document.getElementById('info-weather').textContent =
      `${weatherData.icon} ${weatherData.desc} ${weatherData.temp}`;
    document.getElementById('info-location').textContent = `📍 ${locationName}`;
  }

  function init() {
    updateTime();
    updateDisplay();
    // 每分钟更新一次时间
    setInterval(updateTime, 60000);
    // 每30分钟刷新一次天气
    fetchWeather();
    setInterval(fetchWeather, 30 * 60 * 1000);
  }

  return { init, getWeather: () => weatherData, getLocation: () => locationName };
})();
