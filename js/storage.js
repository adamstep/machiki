// Saves progress (berries, level, settings, spaced-repetition data) in the browser's localStorage.
const Store = (() => {
  const KEY = 'machiki-berry-run-v1';

  const defaults = () => ({
    totalBerries: 0,
    level: 1,
    levelsPlayed: 0,
    bestStreak: 0,
    settings: { speed: 'relaxed', ops: 'both', max: 20, pad: true, music: true, sfx: true, voice: false },
    srs: { facts: {} },
    slips: {}, // how often each kind of wrong answer happened (see Hints.slip)
    owned: [], // ids of Berry Shop items
  });

  function load() {
    const base = defaults();
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      if (!saved) return base;
      return {
        ...base,
        ...saved,
        settings: { ...base.settings, ...saved.settings },
        srs: saved.srs && saved.srs.facts ? saved.srs : base.srs,
        owned: Array.isArray(saved.owned) ? saved.owned : base.owned,
      };
    } catch {
      return base;
    }
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      // Private mode or storage full: the game still works, it just won't remember.
    }
  }

  return { load, save, defaults };
})();
