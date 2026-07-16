const BubbleSystem = (() => {
  const bubbleEl = document.getElementById('bubble');
  const bubbleText = document.getElementById('bubble-text');

  let tipsTimer = null;
  let waterTimer = null;
  let quoteTimers = [];
  let hideTimeout = null;

  function show(text, duration = 4000) {
    if (!text) return;
    if (hideTimeout) clearTimeout(hideTimeout);

    bubbleText.textContent = text;
    bubbleEl.classList.remove('bubble-hidden');
    bubbleEl.classList.add('bubble-show');

    hideTimeout = setTimeout(hide, duration);
  }

  function hide() {
    bubbleEl.classList.remove('bubble-show');
    bubbleEl.classList.add('bubble-hidden');
  }

  function randMinutes(min, max) {
    return (min + Math.random() * (max - min)) * 60 * 1000;
  }

  function scheduleTips() {
    clearTimeout(tipsTimer);
    if (!SettingsManager.get('tipsEnabled')) return;

    const freq = SettingsManager.get('tipsFrequency') || 'medium';
    let interval;
    if (freq === 'low') interval = randMinutes(20, 30);
    else if (freq === 'high') interval = randMinutes(5, 10);
    else interval = randMinutes(10, 15);

    tipsTimer = setTimeout(() => {
      show(QuotesDB.getRandomTip(), 4000);
      scheduleTips();
    }, interval);
  }

  function scheduleWaterReminder() {
    clearTimeout(waterTimer);
    if (!SettingsManager.get('waterReminderEnabled')) return;

    const minutes = SettingsManager.get('waterInterval') || 45;
    waterTimer = setTimeout(() => {
      show(QuotesDB.getWaterReminder(), 5000);
      scheduleWaterReminder();
    }, minutes * 60 * 1000);
  }

  function scheduleDailyQuotes() {
    // 清除旧定时器
    quoteTimers.forEach(t => clearTimeout(t));
    quoteTimers = [];

    if (!SettingsManager.get('tipsEnabled')) return;

    const count = SettingsManager.get('dailyQuotesCount') || 5;
    const quotes = QuotesDB.getDailyQuotes(count);

    if (quotes.length === 0) return;

    const now = new Date();
    const today9am = new Date(now);
    today9am.setHours(9, 0, 0, 0);
    const today10pm = new Date(now);
    today10pm.setHours(22, 0, 0, 0);

    const totalMs = today10pm - today9am;
    const intervalMs = totalMs / (quotes.length + 1);

    quotes.forEach((quote, i) => {
      const fireTime = new Date(today9am.getTime() + intervalMs * (i + 1));
      const delay = fireTime - now;

      // 只设置未来的定时器
      if (delay > 1000) {
        const timer = setTimeout(() => {
          show(quote.text, 6000);
        }, delay);
        quoteTimers.push(timer);
      }
    });
  }

  function init() {
    const hour = new Date().getHours();
    let greeting;
    if (hour < 9) greeting = '一二布布，早上好！☀️';
    else if (hour < 12) greeting = '上午好！一二布布来陪你啦~';
    else if (hour < 14) greeting = '中午好！记得吃午饭哦~';
    else if (hour < 18) greeting = '下午好！';
    else if (hour < 22) greeting = '晚上好！';
    else greeting = '夜深了，一二布布还在哦~';

    setTimeout(() => show(greeting, 4000), 1500);

    scheduleTips();
    scheduleWaterReminder();
    scheduleDailyQuotes();

    // 每小时刷新名言调度
    setInterval(() => {
      const today = new Date().toDateString();
      const stored = localStorage.getItem('yierbubu-quote-date');
      if (today !== stored) {
        localStorage.setItem('yierbubu-quote-date', today);
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
