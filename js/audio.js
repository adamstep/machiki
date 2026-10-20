// Sound effects and background music, synthesized live with the Web Audio API (no audio files).
const Sound = (() => {
  let ac = null, sfxBus, musicBus, musicIn, noiseBuf;
  let sfxOn = true, musicOn = true, ducked = false, musicTimer = null;
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);

  // Browsers only allow audio after a click or key press, so this is called from input handlers.
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 4;
    comp.connect(ac.destination);
    sfxBus = ac.createGain();
    sfxBus.gain.value = 0.8;
    sfxBus.connect(comp);
    musicBus = ac.createGain();
    musicBus.gain.value = 0;
    musicBus.connect(comp);
    // A soft echo makes the music-box melody sound dreamier.
    musicIn = ac.createGain();
    const delay = ac.createDelay(), feedback = ac.createGain(), wet = ac.createGain();
    delay.delayTime.value = 0.36;
    feedback.gain.value = 0.28;
    wet.gain.value = 0.35;
    musicIn.connect(musicBus);
    musicIn.connect(delay);
    delay.connect(feedback).connect(delay);
    delay.connect(wet).connect(musicBus);
    applyMusic();
  }

  function tone({ f, to, at = 0, dur = 0.2, type = 'sine', vol = 0.2, attack = 0.005, hold = 0, bus = sfxBus, when }) {
    const t0 = (when ?? ac.currentTime) + at;
    const osc = ac.createOscillator(), gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f, t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + attack + hold + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    if (hold) gain.gain.setValueAtTime(vol, t0 + attack + hold);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + hold + dur);
    osc.connect(gain).connect(bus);
    osc.start(t0);
    osc.stop(t0 + attack + hold + dur + 0.05);
    return osc;
  }

  function noise({ at = 0, dur = 0.2, vol = 0.3, freq = 600, filter: filterType = 'lowpass' }) {
    if (!noiseBuf) {
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t0 = ac.currentTime + at;
    const src = ac.createBufferSource(), filter = ac.createBiquadFilter(), gain = ac.createGain();
    src.buffer = noiseBuf;
    filter.type = filterType;
    filter.frequency.value = freq;
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(gain).connect(sfxBus);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  const notes = (list, opts) => list.forEach(([at, n, dur = 0.2, vol]) => tone({ ...opts, at, f: midi(n), dur, vol: vol ?? opts.vol }));

  const effects = {
    click() { tone({ f: 620, to: 940, dur: 0.07, vol: 0.18 }); },
    key() { tone({ f: 1046, dur: 0.06, type: 'triangle', vol: 0.12 }); },
    correct() {
      notes([[0, 72], [0.08, 76], [0.16, 79], [0.24, 84, 0.45]], { type: 'triangle', vol: 0.2 });
      notes([[0.24, 96, 0.4], [0.32, 91, 0.3]], { vol: 0.05 });
    },
    wrong() {
      tone({ f: midi(64), to: midi(60), dur: 0.16, type: 'triangle', vol: 0.22 });
      tone({ f: midi(59), to: midi(55), at: 0.17, dur: 0.3, type: 'triangle', vol: 0.22 });
    },
    jump() { tone({ f: 300, to: 760, dur: 0.22, vol: 0.18 }); },
    // Machiki grabs the berries: two juicy "bloops", a sparkly shimmer, and a leafy rustle from a bush.
    collect(rustle = false) {
      tone({ f: 480, to: 980, dur: 0.09, vol: 0.24 });
      tone({ f: 640, to: 1320, at: 0.08, dur: 0.1, vol: 0.22 });
      notes([[0.15, 100, 0.2], [0.185, 96, 0.2], [0.22, 103, 0.2], [0.255, 98, 0.3]], { vol: 0.07 });
      if (rustle) noise({ dur: 0.22, vol: 0.14, freq: 2500, filter: 'highpass' });
    },
    pop(i = 0) {
      const n = [79, 81, 84, 86, 88, 91, 93, 96][i % 8];
      tone({ f: midi(n), to: midi(n + 5), dur: 0.09, vol: 0.14 });
    },
    trip() {
      noise({ dur: 0.25, vol: 0.5, freq: 320 });
      tone({ f: 1000, to: 220, at: 0.05, dur: 0.5, vol: 0.13 });
      // a wobbly "boing"
      const osc = tone({ f: 160, to: 110, at: 0.55, dur: 0.45, type: 'triangle', vol: 0.25 });
      const lfo = ac.createOscillator(), depth = ac.createGain();
      lfo.frequency.value = 14;
      depth.gain.value = 18;
      lfo.connect(depth).connect(osc.frequency);
      lfo.start(ac.currentTime + 0.55);
      lfo.stop(ac.currentTime + 1.1);
    },
    lose() { notes([[0, 76, 0.1], [0.1, 72, 0.1], [0.2, 67, 0.18]], { type: 'triangle', vol: 0.12 }); },
    tick() { tone({ f: midi(72), dur: 0.18, type: 'triangle', vol: 0.22 }); },
    go() { notes([[0, 79, 0.35], [0, 84, 0.45]], { type: 'triangle', vol: 0.2 }); },
    pause() { tone({ f: 640, to: 420, dur: 0.14, vol: 0.15 }); },
    fanfare() {
      const melody = [[0, 67, 0.14], [0.15, 72, 0.14], [0.3, 76, 0.14], [0.45, 79, 0.3], [0.8, 76, 0.14], [0.95, 79, 0.7]];
      notes(melody, { type: 'triangle', vol: 0.2 });
      notes(melody.map(([at, n, d]) => [at, n - 12, d]), { type: 'sine', vol: 0.1 });
      notes([[0.95, 60, 0.9], [0.95, 64, 0.9], [0.95, 67, 0.9]], { type: 'sine', vol: 0.07 });
      notes([[1.6, 84, 0.3], [1.66, 88, 0.3], [1.72, 91, 0.3], [1.78, 96, 0.5]], { vol: 0.07 });
    },
  };

  const sfx = {};
  for (const [name, fn] of Object.entries(effects)) sfx[name] = (...args) => { if (ac && sfxOn) fn(...args); };

  // ---------------------------------------------------------------- music
  // An original, gentle music-box tune in C major. Section A plays the melody, section B is a
  // softer arpeggio over the same chords, and the two alternate forever.
  const BEAT = 60 / 84;
  const CHORDS = { C: [48, 52, 55], Am: [45, 48, 52], F: [41, 45, 48], G: [43, 47, 50] };
  const PROGRESSION = ['C', 'Am', 'F', 'G', 'C', 'Am', 'G', 'C'];
  const MELODY = [
    [[0, 76, 1], [1, 79, 1], [2, 76, 0.5], [2.5, 74, 0.5], [3, 72, 1]],
    [[0, 72, 0.5], [0.5, 74, 0.5], [1, 76, 1], [2, 72, 1], [3, 69, 1]],
    [[0, 69, 1], [1, 72, 1], [2, 77, 1], [3, 76, 0.5], [3.5, 74, 0.5]],
    [[0, 74, 2], [2, 71, 1], [3, 67, 1]],
    [[0, 76, 1], [1, 79, 1], [2, 81, 0.5], [2.5, 79, 0.5], [3, 76, 1]],
    [[0, 72, 1], [1, 76, 0.5], [1.5, 74, 0.5], [2, 72, 1], [3, 69, 1]],
    [[0, 71, 1], [1, 74, 1], [2, 79, 1], [3, 77, 0.5], [3.5, 74, 0.5]],
    [[0, 72, 3]],
  ];
  let nextBar = 0, barIndex = 0;

  function musicBox(n, when, beats, vol = 0.085) {
    tone({ f: midi(n), when, dur: Math.max(0.5, beats * BEAT * 1.3), vol, bus: musicIn });
    tone({ f: midi(n + 12), when, dur: 0.25, type: 'triangle', vol: vol * 0.25, bus: musicIn });
  }

  function scheduleBar(i, when) {
    const bar = i % 8, sectionB = Math.floor(i / 8) % 2 === 1;
    const chord = CHORDS[PROGRESSION[bar]];
    for (const n of chord) tone({ f: midi(n + 12), when, attack: 0.5, hold: BEAT * 4 - 0.9, dur: 0.9, vol: 0.026, bus: musicBus });
    tone({ f: midi(chord[0]), when, dur: BEAT * 1.6, vol: 0.09, bus: musicBus });
    tone({ f: midi(chord[0]), when: when + BEAT * 2, dur: BEAT * 1.6, vol: 0.07, bus: musicBus });
    if (!sectionB) {
      for (const [beat, n, len] of MELODY[bar]) musicBox(n, when + beat * BEAT, len);
    } else {
      const [r, third, fifth] = chord.map(n => n + 24);
      [r, third, fifth, r + 12, fifth, third, r, third].forEach((n, k) => musicBox(n, when + k * BEAT / 2, 0.5, 0.045));
    }
  }

  function scheduleMusic() {
    if (!ac || !musicOn) return;
    if (nextBar < ac.currentTime) nextBar = ac.currentTime + 0.1; // fell behind (tab was hidden)
    while (nextBar < ac.currentTime + 1) {
      scheduleBar(barIndex++, nextBar);
      nextBar += 4 * BEAT;
    }
  }

  function applyMusic() {
    if (!ac) return;
    const target = musicOn ? (ducked ? 0.25 : 0.6) : 0;
    musicBus.gain.setTargetAtTime(target, ac.currentTime, 0.25);
    if (musicOn && !musicTimer) {
      scheduleMusic();
      musicTimer = setInterval(scheduleMusic, 250);
    }
  }

  return {
    init,
    sfx,
    setSfx(on) { sfxOn = on; },
    setMusic(on) { musicOn = on; applyMusic(); },
    duck(on) { ducked = on; applyMusic(); },
  };
})();
