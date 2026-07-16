const BubbleSystem = (() => {
  const bubbleEl = document.getElementById('bubble');
  const bubbleText = document.getElementById('bubble-text');

  let tipsTimer = null;
  let waterTimer = null;
  let quoteTimers = [];
  let hideTimeout = null;

  function show(text, duration = 4000) {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }
    bubbleText.textContent = text;
    bubbleEl.classList.remove('bubble-hidden');
    bubbleEl.classList.add('bubble-show');

    hideTimeout = setTimeout(() => {
      hide();
    }, duration);
  }

  function hide() {
    bubbleEl.classList.remove('bubble-show');
    bubbleEl.classList.add('bubble-hidden');
  }

  function getRandomMinutes(min, max) {
    return (min + Math.random() * (max - min)) * 60 * 1000;
  }

  function scheduleTips() {
    if (!SettingsManager.get('tipsEnabled')) return;
    clearTimeout(tipsTimer);

    const freq = SettingsManager.get('tipsFrequency');
    let interval;
    switch (freq) {
      case 'low': interval = getRandomMinutes(20, 30); break;
      case 'high': interval = getRandomMinutes(5, 10); break;
      default: interval = getRandomMinutes(10, 15); break;
    }

    tipsTimer = setTimeout(() => {
      show(QuotesDB.getRandomTip(), 4000);
      scheduleTips();
    }, interval);
  }

  function scheduleWaterReminder() {
    if (!SettingsManager.get('waterReminderEnabled')) return;
    clearTimeout(waterTimer);

    const interval = SettingsManager.get('waterInterval') * 60 * 1000;
    waterTimer = setTimeout(() => {
      show(QuotesDB.getWaterReminder(), 5000);
      scheduleWaterReminder();
    }, interval);
  }

  function scheduleDailyQuotes() {
    if (!SettingsManager.get('tipsEnabled')) return;
    quoteTimers.forEach(t => clearTimeout(t));
    quoteTimers = [];

    const count = SettingsManager.get('dailyQuotesCount') || 5;
    const dailyQuoteData = QuotesDB.getDailyQuotes(count);

    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(9, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(22, 0, 0, 0);

    const totalMinutes = (dayEnd - dayStart) / 60000;
    const intervalMinutes = totalMinutes / (dailyQuoteData.length + 1);

    dailyQuoteData.forEach((quote, i) => {
      const delayMinutes = intervalMinutes * (i + 1);
      const quoteTime = new Date(dayStart.getTime() + delayMinutes * 60000);
      const delay = quoteTime - now;

      if (delay > 0) {
        const timer = setTimeout(() => {
          show(quote.text, 6000);
        }, delay);
        quoteTimers.push(timer);
      }
    });
  }

  function init() {
    const settings = SettingsManager.load();

    // 初始问候
    const hour = new Date().getHours();
    let greeting;
    if (hour < 9) greeting = '一二布布，早上好！☀️';
    else if (hour < 12) greeting = '上午好！一二布布来陪你啦~';
    else if (hour < 14) greeting = '中午好！记得吃午饭哦~';
    else if (hour < 18) greeting = '下午好！';
    else if (hour < 22) greeting = '晚上好！';
    else greeting = '夜深了，一二布布还在哦~';

    setTimeout(() => show(greeting, 4000), 1000);

    scheduleTips();
    scheduleWaterReminder();
    scheduleDailyQuotes();

    // 每小时检查名言是否需要跨日刷新
    setInterval(() => {
      const newDay = new Date().toDateString();
      const storedDay = localStorage.getItem('yierbubu-quote-date');
      if (newDay !== storedDay) {
        localStorage.setItem('yierbubu-quote-date', newDay);
        scheduleDailyQuotes();
      }
    }, 60 * 60 * 1000);

    localStorage.setItem('yierbubu-quote-date', new Date().toDateString());
  }

  function refresh() {
    scheduleTips();
    scheduleWaterReminder();
  }

  return { init, show, refresh };
})();
