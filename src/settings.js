const SettingsManager = (() => {
  const DEFAULTS = {
    petMode: 'single',
    character: 'auto',
    tipsEnabled: true,
    waterReminderEnabled: true,
    waterInterval: 45,
    tipsFrequency: 'medium',
    petSize: 'small',
    dailyQuotesCount: 5,
    autoStart: false,
  };

  let settings = { ...DEFAULTS };

  function load() {
    try {
      const saved = localStorage.getItem('yierbubu-settings');
      if (saved) {
        settings = { ...DEFAULTS, ...JSON.parse(saved) };
      }
    } catch (e) {
      settings = { ...DEFAULTS };
    }
    return settings;
  }

  function save(updates) {
    Object.assign(settings, updates);
    try {
      localStorage.setItem('yierbubu-settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
    return settings;
  }

  function get(key) {
    return settings[key];
  }

  function set(key, value) {
    settings[key] = value;
    save({});
  }

  return { load, save, get, set, DEFAULTS };
})();
