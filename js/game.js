// Machiki's Berry Run — game loop, rules and screens.
(() => {
  const BEAR_X = 240;
  const REACH = 70;            // an item "touches" Machiki when its front edge is this far ahead of him
  const LEVEL_SIZE = 10;
  const SECONDS = { relaxed: 14, normal: 10, quick: 7 }; // time from an item appearing to reaching Machiki
  const BOOST = 640;           // run speed after a correct answer
  const JUMP_TIME = 0.8, JUMP_HEIGHT = 175;
  const TRIP_TIME = 2.4, TRIP_LOSS = 3;
  const PACK_TARGET = { x: 62, y: 50 };
  const PRAISE = ['Great job!', 'Awesome!', 'You got it!', 'Super!', 'Berry good!', 'Yum yum!', 'Brilliant!', 'Way to go!'];
  const CONFETTI = ['#ff5c8a', '#ffd84a', '#4cc35a', '#3fa9f5', '#b388ff', '#ff9f2e'];

  const $ = id => document.getElementById(id);
  const show = (el, on = true) => el.classList.toggle('hidden', !on);
  const pick = list => list[Math.floor(Math.random() * list.length)];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const opSign = op => (op === '+' ? '+' : '−');
  const factText = f => `${f.a} ${opSign(f.op)} ${f.b}`;

  const stage = $('stage'), canvas = $('game'), ctx = canvas.getContext('2d');
  const ui = {
    hud: $('hud'), problem: $('problem'), numpad: $('numpad'), countdown: $('countdown'),
    title: $('title'), pause: $('pause'), end: $('end'), grownups: $('grownups'), shop: $('shop'),
    answer: $('answer'), feedback: $('feedback'), meter: $('meter-fill'), mic: $('mic'),
  };

  const data = Store.load();
  const persist = () => Store.save(data);
  let owned = new Set(data.owned); // shop items bought so far
  Sound.setMusic(data.settings.music);
  Sound.setSfx(data.settings.sfx);

  const g = {
    mode: 'title', paused: false, t: 0, k: 1,
    worldX: 0, speed: 90, targetSpeed: 90, baseSpeed: 90,
    bear: null, items: [], particles: [], floaters: [],
    queue: [], qIndex: 0, q: null, item: null, phase: 'idle', gapT: 0, input: '',
    levelBerries: 0, shownBerries: 0, streak: 0, bestStreak: 0, firstTry: 0, correct: 0,
    reasked: new Set(), lastKinds: [], countT: 0, countStep: -1, endReady: false,
  };
  const newBear = () => ({ phase: 0, jumpT: -1, stumbleT: 0, tripT: 0, happyT: 0 });
  g.bear = newBear();

  // ---------------------------------------------------------------- layout

  function fit() {
    const s = Math.min(innerWidth / W, innerHeight / H);
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
    g.k = s * (window.devicePixelRatio || 1);
    canvas.width = Math.round(W * g.k);
    canvas.height = Math.round(H * g.k);
  }
  addEventListener('resize', fit);
  fit();

  // ---------------------------------------------------------------- level flow

  function startLevel() {
    Sound.init();
    Object.assign(g, {
      mode: 'countdown', paused: false, countT: 0, countStep: -1,
      queue: SRS.buildLevel(data.srs, data.settings, LEVEL_SIZE), qIndex: 0, q: null, item: null,
      phase: 'idle', input: '', levelBerries: 0, shownBerries: 0, streak: 0, bestStreak: 0,
      firstTry: 0, correct: 0, reasked: new Set(), lastKinds: [], items: [], particles: [], floaters: [],
    });
    g.bear = newBear();
    g.baseSpeed = 1040 / SECONDS[data.settings.speed];
    g.targetSpeed = g.baseSpeed;
    show(ui.title, false); show(ui.end, false); show(ui.pause, false);
    show(ui.hud); show(ui.problem, false); show(ui.numpad, data.settings.pad);
    $('q-total').textContent = LEVEL_SIZE;
    updateHud();
    syncVoice();
  }

  function updateCountdown(dt) {
    g.targetSpeed = g.baseSpeed;
    g.countT += dt;
    const step = Math.floor(g.countT / 0.75);
    if (step === g.countStep) return;
    g.countStep = step;
    if (step < 4) {
      ui.countdown.textContent = ['3', '2', '1', 'Go!'][step];
      ui.countdown.classList.remove('tick');
      void ui.countdown.offsetWidth; // restart the CSS animation
      ui.countdown.classList.add('tick');
      show(ui.countdown);
      step < 3 ? Sound.sfx.tick() : Sound.sfx.go();
    } else {
      show(ui.countdown, false);
      g.mode = 'play';
      nextQuestion();
    }
  }

  function makeItem() {
    const recent = g.lastKinds.slice(-2);
    let kind = Math.random() < 0.6 ? 'bush' : 'obstacle';
    if (recent.length === 2 && recent[0] === recent[1]) kind = recent[0] === 'bush' ? 'obstacle' : 'bush';
    g.lastKinds.push(kind);
    const berry = pickBerry();
    const it = kind === 'bush'
      ? { kind, type: 'bush', berryType: berry.id, w: 140, value: berry.value, spots: Art.bushSpots() }
      : (ob => ({ kind, type: ob.id, berryType: berry.id, w: ob.w, value: 3 }))(pick(Decor.pathTypes(owned, 'obstacle')));
    Object.assign(it, { picked: false, jumped: false, shake: 0, reward: 0 });
    it.x = W + it.w / 2 + 30;
    it.dist = gapOf(it);
    return it;
  }

  // A berry type the player has unlocked. Golden berries are worth a lot, so they're rarer.
  function pickBerry() {
    const berries = Decor.pathTypes(owned, 'berry');
    const berry = pick(berries);
    return berry.rare && Math.random() < 0.6 ? pick(berries.filter(b => !b.rare)) : berry;
  }

  const gapOf = it => it.x - it.w / 2 - (BEAR_X + REACH);

  function hintFor(it) {
    const verb = voiceOn() ? 'Say' : 'Solve';
    return it.kind === 'bush'
      ? `${verb} it to pick the ${Decor.byId[it.berryType].label}!`
      : `${verb} it to jump over the ${Decor.byId[it.type].label}!`;
  }

  function nextQuestion() {
    if (g.qIndex >= g.queue.length) return endLevel();
    const fact = g.queue[g.qIndex++];
    g.q = { fact, wrongs: 0 };
    g.input = '';
    g.item = makeItem();
    g.items.push(g.item);
    g.baseSpeed = g.item.dist / SECONDS[data.settings.speed];
    g.phase = 'approach';

    $('q-num').textContent = g.qIndex;
    $('eq-text').textContent = `${factText(fact)} =`;
    ui.problem.classList.remove('solved', 'missed', 'pop');
    void ui.problem.offsetWidth;
    ui.problem.classList.add('pop');
    setFeedback(hintFor(g.item), 'hint');
    renderAnswer();
    show(ui.problem);
  }

  function updatePlay(dt) {
    const it = g.item;
    if (!it) return;
    if (g.phase === 'approach') {
      g.targetSpeed = g.baseSpeed;
      const frac = clamp(gapOf(it) / it.dist, 0, 1);
      ui.meter.style.width = `${frac * 100}%`;
      ui.meter.style.backgroundColor = frac > 0.5 ? '#4cc35a' : frac > 0.25 ? '#ffc93a' : '#ff6b4a';
      if (gapOf(it) <= 0) trip();
    } else if (g.phase === 'success') {
      g.targetSpeed = BOOST;
      const dx = it.x - BEAR_X;
      if (it.kind === 'obstacle') {
        if (!it.jumped && dx <= Math.max(g.speed, BOOST * 0.8) * JUMP_TIME / 2 + 10) {
          it.jumped = true;
          g.bear.jumpT = 0;
          g.speed = Math.max(g.speed, BOOST);
          Sound.sfx.jump();
        }
        if (!it.picked && dx <= 0) collect(it);
      } else if (!it.picked && dx <= REACH + 20) {
        collect(it);
      }
      if (it.picked && dx < -it.w / 2 - 40 && g.bear.jumpT < 0) { g.phase = 'gap'; g.gapT = 0.7; }
    } else if (g.phase === 'trip') {
      g.targetSpeed = 0;
      if (g.bear.tripT <= 0) { g.phase = 'gap'; g.gapT = 1.4; }
    } else if (g.phase === 'gap') {
      g.targetSpeed = g.baseSpeed;
      g.gapT -= dt;
      if (g.gapT <= 0) nextQuestion();
    }
  }

  // ---------------------------------------------------------------- answers

  function typeDigit(d) {
    if (g.mode !== 'play' || g.paused || g.phase !== 'approach' || g.input.length >= 2) return;
    g.input = g.input === '0' ? d : g.input + d;
    Sound.sfx.key();
    renderAnswer();
  }

  function backspace() {
    if (g.phase !== 'approach' || !g.input) return;
    g.input = g.input.slice(0, -1);
    Sound.sfx.key();
    renderAnswer();
  }

  function submit() {
    if (g.mode !== 'play' || g.paused || g.phase !== 'approach' || !g.input) return;
    if (Number(g.input) === g.q.fact.answer) onCorrect();
    else onWrong();
  }

  function onCorrect() {
    const it = g.item, q = g.q;
    const firstTry = q.wrongs === 0;
    const fast = firstTry && gapOf(it) / it.dist > 0.4;
    SRS.record(data.srs, q.fact.key, { missed: !firstTry, fast });
    g.correct++;
    if (firstTry) {
      g.firstTry++;
      g.streak++;
      g.bestStreak = Math.max(g.bestStreak, g.streak);
    }
    it.reward = firstTry
      ? it.value + (fast ? 1 : 0) + Math.min(3, Math.floor(g.streak / 3))
      : Math.max(1, Math.floor(it.value / 2));
    g.phase = 'success';
    g.bear.happyT = 0.6;
    Sound.sfx.correct();
    renderAnswer();
    ui.problem.classList.add('solved');
    setFeedback(pick(PRAISE), 'good');
    if (firstTry && [3, 5, 10].includes(g.streak)) {
      floater(`${g.streak} in a row!`, BEAR_X + 60, GROUND_Y - 250, '#ff9f2e', 44, 1.6);
    }
    updateHud();
    persist();
  }

  function onWrong() {
    g.q.wrongs++;
    g.streak = 0;
    g.bear.stumbleT = 0.6;
    Sound.sfx.wrong();
    setFeedback('Not quite — try again!', 'bad');
    ui.answer.classList.remove('shake');
    void ui.answer.offsetWidth;
    ui.answer.classList.add('shake');
    g.input = '';
    renderAnswer();
    scheduleReask(g.q.fact);
    updateHud();
  }

  function trip() {
    const it = g.item, q = g.q;
    SRS.record(data.srs, q.fact.key, { missed: true, fast: false });
    scheduleReask(q.fact);
    g.streak = 0;
    g.phase = 'trip';
    Object.assign(g.bear, { tripT: TRIP_TIME, jumpT: -1, stumbleT: 0 });
    g.speed *= 0.2;
    it.shake = 0.6;

    const loss = Math.min(TRIP_LOSS, g.levelBerries);
    g.levelBerries -= loss;
    for (let i = 0; i < loss; i++) {
      g.particles.push({
        berryType: pickBerry().id, x: BEAR_X - 50, y: GROUND_Y - 120,
        vx: -60 - Math.random() * 120, vy: -320 - Math.random() * 120, life: 1.4, gravity: 900,
      });
    }
    Sound.sfx.trip();
    if (loss) setTimeout(() => Sound.sfx.lose(), 350);
    floater(loss ? `−${loss}` : 'Oof!', BEAR_X - 40, GROUND_Y - 200, '#ff6b4a', 42);

    g.input = String(q.fact.answer);
    renderAnswer();
    ui.problem.classList.add('missed');
    setFeedback(`Oops! ${factText(q.fact)} = ${q.fact.answer}`, 'bad');
    ui.meter.style.width = '0%';
    updateHud();
    persist();
  }

  // A missed fact comes back a couple of questions later in the same level.
  function scheduleReask(fact) {
    if (g.reasked.has(fact.key) || g.qIndex >= g.queue.length) return;
    let drop = -1;
    for (let i = g.queue.length - 1; i >= g.qIndex; i--) if (!g.queue[i].reask) { drop = i; break; }
    if (drop < 0) return;
    g.queue.splice(drop, 1);
    g.queue.splice(Math.min(g.qIndex + 2, g.queue.length), 0, { ...fact, reask: true });
    g.reasked.add(fact.key);
  }

  function collect(it) {
    it.picked = true;
    g.levelBerries += it.reward;
    Sound.sfx.collect(it.kind === 'bush');
    const sy = it.kind === 'bush' ? GROUND_Y - 60 : GROUND_Y - 205;
    const n = Math.min(it.reward, 12);
    for (let i = 0; i < n; i++) {
      const sx = it.x + (Math.random() - 0.5) * 80, y0 = sy + (Math.random() - 0.5) * 40;
      g.particles.push({
        kind: 'fly', berryType: it.berryType, i, t: -i * 0.06, dur: 0.75,
        sx, sy: y0, cx: (sx + PACK_TARGET.x) / 2 + 120, cy: Math.min(y0, PACK_TARGET.y) - 160, x: sx, y: y0,
      });
    }
    if (it.kind === 'bush') {
      it.shake = 0.5;
      for (let i = 0; i < 6; i++) {
        g.particles.push({ kind: 'leaf', x: it.x + (Math.random() - 0.5) * 100, y: GROUND_Y - 70, vx: (Math.random() - 0.5) * 200, vy: -150 - Math.random() * 150, gravity: 400, rot: Math.random() * 6, vr: 6, life: 1 });
      }
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.particles.push({ kind: 'spark', x: it.x, y: sy, vx: Math.cos(a) * 220, vy: Math.sin(a) * 220, life: 0.5 });
    }
    floater(`+${it.reward}`, it.x, sy - 50, '#ffd84a', 48);
    g.bear.happyT = 0.8;
  }

  function endLevel() {
    g.mode = 'end';
    g.phase = 'idle';
    g.item = null;
    g.endReady = false;
    show(ui.problem, false); show(ui.numpad, false); show(ui.hud, false);

    const before = data.totalBerries;
    data.totalBerries += g.levelBerries;
    data.levelsPlayed++;
    data.level++;
    data.bestStreak = Math.max(data.bestStreak, g.bestStreak);
    persist();

    const stars = g.firstTry >= 9 ? 3 : g.firstTry >= 6 ? 2 : 1;
    $('end-title').textContent = ['Nice try!', 'Well done!', 'Fantastic!'][stars - 1];
    $('end-sub').textContent = `Level ${data.level - 1} complete`;
    $('end-stars').innerHTML = [0, 1, 2].map(i => `<span class="${i < stars ? 'on' : 'off'}" style="animation-delay:${0.3 + i * 0.25}s">★</span>`).join('');
    $('end-correct').textContent = `${g.correct} / ${LEVEL_SIZE}`;
    $('end-berries').textContent = g.levelBerries;
    $('end-streak').textContent = g.bestStreak;
    $('end-total').textContent = before;
    countUp($('end-total'), before, data.totalBerries);
    show(ui.end);

    Sound.sfx.fanfare();
    for (let i = 0; i < 120; i++) {
      g.particles.push({
        kind: 'confetti', color: pick(CONFETTI), x: Math.random() * W, y: -20 - Math.random() * 300,
        vx: (Math.random() - 0.5) * 120, vy: 80 + Math.random() * 160, gravity: 60, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10, life: 5,
      });
    }
    setTimeout(() => { g.endReady = true; }, 1200);
    refreshTitle();
    syncVoice();
  }

  function countUp(el, from, to) {
    const start = performance.now(), ms = 1400;
    const step = now => {
      const p = Math.min(1, (now - start) / ms);
      el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    setTimeout(() => requestAnimationFrame(step), 900);
  }

  function goHome() {
    if (g.mode === 'play' || g.mode === 'countdown') {
      data.totalBerries += g.levelBerries; // keep what's in the knapsack
      persist();
    }
    Object.assign(g, { mode: 'title', paused: false, item: null, phase: 'idle', items: [], levelBerries: 0 });
    g.bear = newBear();
    Sound.duck(false);
    for (const el of [ui.hud, ui.problem, ui.numpad, ui.countdown, ui.pause, ui.end]) show(el, false);
    refreshTitle();
    show(ui.title);
    syncVoice();
  }

  function setPaused(p) {
    if (g.mode !== 'play' && g.mode !== 'countdown') return;
    g.paused = p;
    show(ui.pause, p);
    Sound.duck(p);
    Sound.sfx.pause();
    refreshToggles();
    syncVoice();
  }

  // ---------------------------------------------------------------- answering out loud

  let grownupsOpen = false, micFlash = null, micState = 'off';
  const voiceOn = () => data.settings.voice && Voice.supported;
  const MIC_PROBLEMS = {
    blocked: 'The microphone is blocked — type the answer instead.',
    nomic: 'No microphone found — type the answer instead.',
    network: 'Can\'t reach speech recognition — type the answer instead.',
    error: 'Speech recognition stopped — type the answer instead.',
  };

  // Listen while a level is running (or while the Grown-ups panel is testing the microphone).
  function syncVoice() {
    show(ui.mic, voiceOn());
    const playing = (g.mode === 'play' || g.mode === 'countdown') && !g.paused;
    if (voiceOn() && grownupsOpen) Voice.listen(testHandlers);
    else if (voiceOn() && playing) Voice.listen(gameHandlers);
    else Voice.stop();
  }

  function setMicState(state) {
    micState = state;
    ui.mic.classList.toggle('listening', state === 'listening');
    ui.mic.classList.toggle('blocked', state in MIC_PROBLEMS);
    if (MIC_PROBLEMS[state] && g.mode === 'play') setFeedback(MIC_PROBLEMS[state], 'bad');
    const test = $('voice-test');
    if (test && (MIC_PROBLEMS[state] || state === 'listening')) test.textContent = MIC_PROBLEMS[state] || '🎤 Listening… say a number to test it.';
  }

  const gameHandlers = {
    // Show what's being heard right away, before it's been confirmed.
    onHear(text, value) {
      if (g.phase !== 'approach' || g.paused || value === null) return;
      ui.answer.textContent = value;
      ui.answer.classList.add('heard');
      ui.mic.classList.add('heard');
      clearTimeout(micFlash);
      micFlash = setTimeout(() => ui.mic.classList.remove('heard'), 400);
    },
    onNumber(value) {
      if (g.mode !== 'play' || g.paused || g.phase !== 'approach') return;
      g.input = String(value);
      submit();
    },
    onState: setMicState,
  };

  const testHandlers = {
    onHear(text, value) {
      const test = $('voice-test');
      if (test) test.textContent = `🎤 Heard “${text.trim()}”${value === null ? ' — no number' : ` → ${value}`}`;
    },
    onNumber() {},
    onState: setMicState,
  };

  // ---------------------------------------------------------------- per-frame update

  function update(dt) {
    g.t += dt;
    if (g.mode === 'title') g.targetSpeed = 90;
    if (g.mode === 'end') g.targetSpeed = 0;
    g.speed += (g.targetSpeed - g.speed) * Math.min(1, dt * 3);
    g.worldX += g.speed * dt;
    for (const it of g.items) {
      it.x -= g.speed * dt;
      it.shake = Math.max(0, it.shake - dt);
    }
    g.items = g.items.filter(it => it.x > -200);

    const b = g.bear;
    b.phase += dt * (g.speed > 5 ? 4 + g.speed / 28 : 0);
    if (b.jumpT >= 0 && (b.jumpT += dt) >= JUMP_TIME) b.jumpT = -1;
    b.stumbleT = Math.max(0, b.stumbleT - dt);
    b.happyT = Math.max(0, b.happyT - dt);
    b.tripT = Math.max(0, b.tripT - dt);

    if (g.mode === 'countdown') updateCountdown(dt);
    else if (g.mode === 'play') updatePlay(dt);

    updateEffects(dt);

    const diff = g.levelBerries - g.shownBerries;
    if (diff) {
      g.shownBerries += Math.sign(diff) * Math.min(Math.abs(diff), dt * 20);
      $('hud-berries').textContent = Math.round(g.shownBerries);
    }
  }

  function updateEffects(dt) {
    for (const q of g.particles) {
      if (q.kind === 'fly') {
        q.t += dt;
        const p = clamp(q.t / q.dur, 0, 1), e = p * p * (3 - 2 * p), u = 1 - e;
        q.x = u * u * q.sx + 2 * u * e * q.cx + e * e * PACK_TARGET.x;
        q.y = u * u * q.sy + 2 * u * e * q.cy + e * e * PACK_TARGET.y;
        q.r = 11 * (1 - p * 0.4);
        if (p >= 1) {
          q.done = true;
          Sound.sfx.pop(q.i);
          bump($('pack-pill'));
        }
        continue;
      }
      q.vy += (q.gravity || 0) * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      if (q.vr) q.rot += q.vr * dt;
      q.life -= dt;
      if (q.life <= 0) q.done = true;
    }
    g.particles = g.particles.filter(q => !q.done);
    for (const f of g.floaters) { f.y -= 50 * dt; f.life -= dt; }
    g.floaters = g.floaters.filter(f => f.life > 0);
  }

  function bearPose() {
    const b = g.bear;
    const p = {
      phase: b.phase, t: g.t, rot: 0, lift: 0, legs: g.speed > 5 ? 'run' : 'stand', arms: 'run',
      face: b.happyT > 0 ? 'happy' : 'normal', stars: false, pack: Math.min(10, Math.ceil(g.shownBerries / 3)),
    };
    if (b.jumpT >= 0) {
      const q = b.jumpT / JUMP_TIME;
      Object.assign(p, { lift: JUMP_HEIGHT * 4 * q * (1 - q), legs: 'tuck', arms: 'up', face: 'happy' });
    }
    if (b.stumbleT > 0) {
      Object.assign(p, { rot: Math.sin(b.stumbleT * 30) * 0.2 * (b.stumbleT / 0.6), face: 'oops', arms: 'flail' });
    }
    if (b.tripT > 0) {
      const elapsed = TRIP_TIME - b.tripT;
      const fall = Math.min(1, elapsed / 0.25), rise = Math.min(1, b.tripT / 0.35);
      Object.assign(p, {
        rot: 1.0 * (1 - Math.pow(1 - fall, 3)) * rise, lift: 10 * fall * rise + (1 - rise) * 30 * rise * 4,
        legs: 'stand', arms: 'flail', face: 'dizzy', stars: elapsed > 0.3 && b.tripT > 0.35,
      });
    }
    if (g.mode === 'end') Object.assign(p, { legs: 'stand', arms: 'wave', face: 'happy', lift: Math.abs(Math.sin(g.t * 5)) * 16 });
    return p;
  }

  function draw() {
    ctx.setTransform(g.k, 0, 0, g.k, 0, 0);
    Art.background(ctx, g.worldX, g.t, owned);
    for (const it of g.items) Art.item(ctx, it, g.t);
    Art.bear(ctx, BEAR_X, GROUND_Y, bearPose());
    for (const q of g.particles) Art.particle(ctx, q);
    for (const f of g.floaters) Art.floater(ctx, f);
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!g.paused) update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------- UI helpers

  function floater(text, x, y, color, size = 40, life = 1.1) {
    g.floaters.push({ text, x, y, color, size, life });
  }

  function bump(el) {
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }

  function setFeedback(text, cls) {
    ui.feedback.textContent = text;
    ui.feedback.className = cls;
  }

  function renderAnswer() {
    ui.answer.textContent = g.input;
    ui.answer.classList.remove('heard');
    ui.answer.classList.toggle('cursor', g.phase === 'approach');
  }

  function updateHud() {
    $('hud-berries').textContent = Math.round(g.shownBerries);
    $('hud-streak').textContent = g.streak;
    $('streak-pill').classList.toggle('hot', g.streak >= 3);
    $('hud-total').textContent = data.totalBerries;
  }

  function refreshTitle() {
    $('title-total').textContent = data.totalBerries;
    $('btn-play').textContent = `▶ Play Level ${data.level}`;
    $('howto').innerHTML = voiceOn()
      ? 'Say the answer out loud, or type it · <kbd>P</kbd> pauses'
      : 'Type the answer and press <kbd>Enter</kbd> · <kbd>P</kbd> pauses';
    refreshToggles();
  }

  function refreshToggles() {
    const m = `🎵 Music: ${data.settings.music ? 'On' : 'Off'}`;
    $('btn-music-title').textContent = m;
    $('btn-music-pause').textContent = m;
    $('btn-sfx-pause').textContent = `${data.settings.sfx ? '🔊' : '🔈'} Sounds: ${data.settings.sfx ? 'On' : 'Off'}`;
  }

  function toggleMusic() {
    data.settings.music = !data.settings.music;
    Sound.setMusic(data.settings.music);
    persist();
    refreshToggles();
  }

  function toggleSfx() {
    data.settings.sfx = !data.settings.sfx;
    Sound.setSfx(data.settings.sfx);
    persist();
    refreshToggles();
  }

  // ---------------------------------------------------------------- grown-ups panel

  const SETTINGS_UI = [
    { key: 'speed', label: 'Time to answer each question', options: [['relaxed', 'Relaxed (14s)'], ['normal', 'Normal (10s)'], ['quick', 'Quick (7s)']] },
    { key: 'ops', label: 'Problems', options: [['both', '+ and −'], ['add', '+ only'], ['sub', '− only']] },
    { key: 'max', label: 'Numbers up to', options: [[10, '10'], [20, '20']] },
    { key: 'voice', label: 'Answer by speaking (microphone)', options: [[false, 'Off'], [true, 'On']] },
    { key: 'pad', label: 'On-screen number buttons', options: [[true, 'Show'], [false, 'Hide']] },
    { key: 'sfx', label: 'Sound effects', options: [[true, 'On'], [false, 'Off']] },
    { key: 'music', label: 'Music', options: [[true, 'On'], [false, 'Off']] },
  ];

  function voiceNote() {
    if (!Voice.supported) return '<p class="voice-note">This browser can\'t recognize speech. Try Chrome or Safari.</p>';
    const where = Voice.isOnDevice()
      ? 'Speech is recognized right here on this computer.'
      : 'Chrome may send the audio to Google to turn it into text; Safari uses Apple\'s speech service.';
    return `<p class="voice-note">Uses the browser's speech recognition. ${where} The game itself never records or keeps any audio.</p>
      ${data.settings.voice ? `<div id="voice-test" class="voice-test">${MIC_PROBLEMS[micState] || (micState === 'listening' ? '🎤 Listening… say a number to test it.' : '🎤 Starting the microphone…')}</div>` : ''}`;
  }

  function renderGrownups() {
    const setting = s => `
      <div class="setting"><div class="name">${s.label}</div><div class="seg">
        ${s.options.map(([v, l]) => `<button data-key="${s.key}" data-val='${JSON.stringify(v)}' class="${data.settings[s.key] === v ? 'on' : ''}"${s.key === 'voice' && !Voice.supported ? ' disabled' : ''}>${l}</button>`).join('')}
      </div>${s.key === 'voice' ? voiceNote() : ''}</div>`;
    const byKey = key => SETTINGS_UI.find(s => s.key === key);
    $('settings').innerHTML = ['speed', 'ops', 'max', 'pad'].map(k => setting(byKey(k))).join('')
      + `<div class="setting-pair">${setting(byKey('sfx'))}${setting(byKey('music'))}</div>`;
    $('voice-settings').innerHTML = setting(byKey('voice'));

    const st = SRS.stats(data.srs, data.settings);
    $('progress').innerHTML = `
      Levels finished: <b>${data.levelsPlayed}</b><br>
      Total berries: <b>${data.totalBerries}</b> · Best streak: <b>${data.bestStreak}</b><br>
      Facts practised: <b>${st.practiced}</b> of ${st.total}<br>
      Facts mastered: <b>${st.mastered}</b> <span class="muted">(answered quickly several times, spaced out over days)</span>`;
    $('tricky').innerHTML = st.tricky.length
      ? st.tricky.map(f => `<span class="chip">${factText(f)} = ${f.answer} <small>×${f.wrong}</small></span>`).join('')
      : '<span class="muted">None yet — great!</span>';
  }

  ui.grownups.addEventListener('click', e => {
    const btn = e.target.closest('button[data-key]');
    if (!btn) return;
    const key = btn.dataset.key, val = JSON.parse(btn.dataset.val);
    data.settings[key] = val;
    Sound.setMusic(data.settings.music);
    Sound.setSfx(data.settings.sfx);
    // Turning voice on is a click, so the browser lets us fetch the on-device speech model now.
    if (key === 'voice' && val) Voice.preferOnDevice().then(on => { if (on && grownupsOpen) renderGrownups(); });
    persist();
    renderGrownups();
    refreshTitle();
    syncVoice();
  });

  const resetBtn = $('btn-reset');
  resetBtn.addEventListener('click', () => {
    if (!resetBtn.classList.contains('confirm')) {
      resetBtn.classList.add('confirm');
      resetBtn.textContent = 'Really erase everything? Click again';
      return;
    }
    const fresh = Store.defaults();
    Object.assign(data, fresh, { settings: data.settings });
    owned = new Set(data.owned);
    persist();
    resetGrownupsButton();
    renderGrownups();
    refreshTitle();
  });
  const resetGrownupsButton = () => { resetBtn.classList.remove('confirm'); resetBtn.textContent = 'Reset all progress'; };

  function openGrownups(open) {
    if (open) renderGrownups(); else resetGrownupsButton();
    show(ui.grownups, open);
    grownupsOpen = open;
    syncVoice();
  }

  // ---------------------------------------------------------------- Berry Shop

  let shopTab = 'plants', confirmId = null, confirmTimer = null, toastTimer = null;
  const shopOpen = () => !ui.shop.classList.contains('hidden');

  function openShop(open) {
    confirmId = null;
    show(ui.shop, open);
    show(ui.title, !open);
    if (open) renderShop();
    else refreshTitle();
  }

  function renderShop(justBought) {
    $('shop-berries').textContent = data.totalBerries;
    $('shop-tabs').innerHTML = Decor.CATS.map(cat => {
      const items = Decor.ITEMS.filter(i => i.cat === cat.id);
      const have = items.filter(i => owned.has(i.id)).length;
      return `<button data-tab="${cat.id}" class="${cat.id === shopTab ? 'on' : ''}">${cat.label} <small>${have}/${items.length}</small></button>`;
    }).join('');

    const items = Decor.ITEMS.filter(i => i.cat === shopTab).sort((a, b) => a.price - b.price);
    const grid = $('shop-grid');
    grid.innerHTML = items.map(i => {
      const button = owned.has(i.id)
        ? '<div class="owned-tag">✓ In your forest</div>'
        : confirmId === i.id
          ? `<button class="buy confirm" data-buy="${i.id}">Tap again to buy!</button>`
          : `<button class="buy${data.totalBerries < i.price ? ' cant' : ''}" data-buy="${i.id}">🫐 ${i.price}</button>`;
      return `<div class="card${owned.has(i.id) ? ' owned' : ''}${i.id === justBought ? ' bought' : ''}" data-id="${i.id}">
        <canvas></canvas><div class="name">${i.name}</div>${button}</div>`;
    }).join('');

    for (const card of grid.querySelectorAll('.card')) {
      const cv = card.querySelector('canvas'), k = 2;
      cv.width = 196 * k;
      cv.height = 128 * k;
      const c = cv.getContext('2d');
      c.scale(k, k);
      Decor.preview(c, Decor.byId[card.dataset.id], 196, 128);
    }
  }

  function toast(text) {
    const el = $('shop-toast');
    el.textContent = text;
    show(el, false);
    void el.offsetWidth;
    show(el);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => show(el, false), 2600);
  }

  function buy(id, btn) {
    const item = Decor.byId[id];
    if (owned.has(id)) return;
    if (data.totalBerries < item.price) {
      Sound.sfx.nope();
      btn.classList.remove('shake');
      void btn.offsetWidth;
      btn.classList.add('shake');
      toast(`You need ${item.price - data.totalBerries} more berries for that one!`);
      return;
    }
    // Two taps to buy, so berries aren't spent by accident.
    clearTimeout(confirmTimer);
    if (confirmId !== id) {
      confirmId = id;
      confirmTimer = setTimeout(() => { confirmId = null; renderShop(); }, 3000);
      renderShop();
      return;
    }
    confirmId = null;
    const before = data.totalBerries;
    data.totalBerries -= item.price;
    data.owned.push(id);
    owned = new Set(data.owned);
    persist();
    Sound.sfx.buy();
    btn.textContent = '✨';
    btn.disabled = true;
    shopBusy = true;
    flyBerries(btn.closest('.card'), before, item.price, () => {
      shopBusy = false;
      toast(item.path ? `${item.name} will show up on Machiki's path!` : `${item.name} will appear in Machiki's forest!`);
      renderShop(id);
    });
  }

  // Berries fly in an arc from the berry total into the item's picture, so it's clear where they went.
  let shopBusy = false;
  function flyBerries(card, before, price, done) {
    const panel = ui.shop.querySelector('.shop-panel'), box = panel.getBoundingClientRect();
    const scale = box.width / panel.offsetWidth; // the whole stage is scaled to fit the window
    const centre = el => {
      const r = el.getBoundingClientRect();
      return { x: (r.left + r.width / 2 - box.left) / scale, y: (r.top + r.height / 2 - box.top) / scale };
    };
    const from = centre($('shop-pill').querySelector('.ico')), to = centre(card.querySelector('canvas'));
    const count = Math.min(14, 5 + Math.round(price / 100));
    const counter = $('shop-berries');
    bump($('shop-pill'));
    let landed = 0;
    for (let i = 0; i < count; i++) {
      const berry = document.createElement('div');
      berry.className = 'flying-berry';
      berry.textContent = '🫐';
      panel.appendChild(berry);
      const via = { x: (from.x + to.x) / 2 + (Math.random() - 0.5) * 180, y: Math.min(from.y, to.y) - 60 - Math.random() * 90 };
      const frames = [];
      for (let k = 0; k <= 12; k++) {
        const t = k / 12, u = 1 - t;
        const x = u * u * from.x + 2 * u * t * via.x + t * t * to.x;
        const y = u * u * from.y + 2 * u * t * via.y + t * t * to.y;
        frames.push({ transform: `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${1.25 - 0.55 * t}) rotate(${t * 300}deg)` });
      }
      const delay = i * 75;
      // The total ticks down as each berry leaves...
      setTimeout(() => { counter.textContent = Math.round(before - price * (i + 1) / count); }, delay);
      // ...and each one pops into the picture when it lands.
      berry.animate(frames, { duration: 700, delay, easing: 'cubic-bezier(.4, 0, .7, 1)', fill: 'backwards' }).onfinish = () => {
        berry.remove();
        Sound.sfx.pop(i);
        card.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 160 });
        if (++landed === count) done();
      };
    }
  }

  $('shop-tabs').addEventListener('click', e => {
    const tab = e.target.closest('button')?.dataset.tab;
    if (!tab || shopBusy) return;
    shopTab = tab;
    confirmId = null;
    renderShop();
  });
  $('shop-grid').addEventListener('click', e => {
    const btn = e.target.closest('button[data-buy]');
    if (btn && !shopBusy) buy(btn.dataset.buy, btn);
  });

  // ---------------------------------------------------------------- input

  // Every button click plays a little pop (number pad keys have their own sound).
  document.addEventListener('click', e => {
    Sound.init();
    const btn = e.target.closest('button');
    if (btn && !btn.closest('#numpad') && !btn.dataset.buy) Sound.sfx.click();
    if (btn) btn.blur(); // so Enter types answers instead of re-pressing the button
  });
  addEventListener('pointerdown', () => Sound.init(), { once: true });

  $('btn-play').addEventListener('click', startLevel);
  $('btn-next').addEventListener('click', startLevel);
  $('btn-home').addEventListener('click', goHome);
  $('btn-quit').addEventListener('click', goHome);
  $('btn-pause').addEventListener('click', () => setPaused(true));
  $('btn-resume').addEventListener('click', () => setPaused(false));
  $('btn-music-title').addEventListener('click', toggleMusic);
  $('btn-music-pause').addEventListener('click', toggleMusic);
  $('btn-sfx-pause').addEventListener('click', toggleSfx);
  $('btn-grownups').addEventListener('click', () => openGrownups(true));
  $('btn-shop').addEventListener('click', () => openShop(true));
  // From the level-complete screen: go home first, so closing the shop lands on the title screen.
  $('btn-end-shop').addEventListener('click', () => { goHome(); openShop(true); });
  $('btn-shop-close').addEventListener('click', () => openShop(false));
  $('btn-close-grownups').addEventListener('click', () => openGrownups(false));

  ui.numpad.addEventListener('click', e => {
    const k = e.target.closest('button')?.dataset.k;
    if (!k) return;
    if (k === 'back') backspace();
    else if (k === 'enter') submit();
    else typeDigit(k);
  });

  addEventListener('keydown', e => {
    Sound.init();
    const key = e.key;
    if (!ui.grownups.classList.contains('hidden')) {
      if (key === 'Escape') openGrownups(false);
      return;
    }
    if (shopOpen()) {
      if (key === 'Escape') openShop(false);
      return;
    }
    if (key === 'p' || key === 'P' || key === 'Escape') {
      if (g.mode === 'play' || g.mode === 'countdown') { setPaused(!g.paused); e.preventDefault(); }
      return;
    }
    if (g.paused) {
      if (key === 'Enter' || key === ' ') { setPaused(false); e.preventDefault(); }
      return;
    }
    if (g.mode === 'play') {
      if (/^[0-9]$/.test(key)) typeDigit(key);
      else if (key === 'Backspace' || key === 'Delete') backspace();
      else if (key === 'Enter') submit();
      else return;
      e.preventDefault();
    } else if (key === 'Enter' && (g.mode === 'title' || (g.mode === 'end' && g.endReady))) {
      e.preventDefault();
      Sound.sfx.click();
      startLevel();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !g.paused && (g.mode === 'play' || g.mode === 'countdown')) setPaused(true);
  });

  refreshTitle();
  if (voiceOn()) Voice.preferOnDevice(); // uses the on-device model if it's already installed
  if (document.fonts) document.fonts.load('700 40px Fredoka');
  requestAnimationFrame(frame);
})();
