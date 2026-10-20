// Answering out loud, using the browser's built-in speech recognition (Web Speech API).
//
// Listens continuously while a level is running and reports each number it hears. Results come in
// as "interim" guesses that get refined, then a "final" one. To feel instant, a number is accepted
// from an interim guess straight away — unless it could be the start of a longer number ("six" →
// "sixteen"), in which case it waits for the final result or a short pause.
const Voice = (() => {
  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const LANG = 'en-US';
  const STABLE_MS = 700;
  const AMBIGUOUS = new Set([2, 3, 4, 5, 6, 7, 8, 9]); // two→twenty, four→fourteen, six→sixteen, …

  const WORDS = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
    eighteen: 18, nineteen: 19, twenty: 20,
  };
  // Words the recognizer often hears instead of a number. Only used if no real number was heard.
  const SOUNDALIKES = { won: 1, to: 2, too: 2, tu: 2, for: 4, fore: 4, ate: 8, tin: 10, sicks: 6, nein: 9 };

  // Returns the last number (0–99) in a transcript, or null. "seven plus five is twelve" → 12.
  function parseNumber(text) {
    const tokens = String(text).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ');
    let strong = null, weak = null;
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (/^\d+$/.test(t)) strong = Number(t);
      else if (t in WORDS) {
        strong = WORDS[t];
        const next = WORDS[tokens[i + 1]];
        if (strong === 20 && next >= 1 && next <= 9) { strong += next; i++; } // twenty one
      } else if (t in SOUNDALIKES) weak = SOUNDALIKES[t];
    }
    return strong ?? weak;
  }

  // Picks the first alternative transcript that contains a number.
  function bestGuess(result) {
    let fallback = null;
    for (let k = 0; k < result.length; k++) {
      const text = result[k].transcript, value = parseNumber(text);
      if (value !== null) return { text, value };
      if (fallback === null) fallback = text;
    }
    return { text: fallback || '', value: null };
  }

  let rec = null, wanted = false, onDevice = false, handlers = {}, state = 'off';
  let committed = new Map(), stableTimer = null, lastStart = 0, restartTimer = null;

  const emit = (name, ...args) => handlers[name] && handlers[name](...args);
  const setState = s => { state = s; emit('onState', s); };

  function commit(index, value) {
    clearTimeout(stableTimer);
    committed.set(index, value);
    emit('onNumber', value);
  }

  function onResult(e) {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      const { text, value } = bestGuess(res);
      emit('onHear', text, value, res.isFinal);
      if (value === null) continue;
      const prev = committed.get(i);
      if (res.isFinal) {
        if (prev !== value) commit(i, value);
      } else if (prev === undefined) {
        clearTimeout(stableTimer);
        if (!AMBIGUOUS.has(value)) commit(i, value);
        else stableTimer = setTimeout(() => { if (!committed.has(i)) commit(i, value); }, STABLE_MS);
      }
    }
  }

  function onError(e) {
    if (e.error === 'no-speech' || e.error === 'aborted') return; // onend restarts us
    if (onDevice && (e.error === 'language-not-supported' || e.error === 'service-not-allowed')) {
      onDevice = false; // on-device model missing: fall back to the browser's regular recognition
      rec = null;
      return;
    }
    // Real problems stop listening (no retry loop); the next listen() call tries again.
    wanted = false;
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setState('blocked');
    else if (e.error === 'audio-capture') setState('nomic');
    else if (e.error === 'network') setState('network');
    else setState('error');
  }

  function create() {
    rec = new SR();
    rec.lang = LANG;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    if (onDevice && 'processLocally' in rec) rec.processLocally = true;
    rec.onresult = onResult;
    rec.onerror = onError;
    rec.onstart = () => setState('listening');
    rec.onend = () => {
      if (!wanted) {
        if (state === 'listening') setState('off'); // keep showing a problem like "blocked"
        return;
      }
      // The browser stops listening after a while; start again, but not in a tight loop.
      clearTimeout(restartTimer);
      restartTimer = setTimeout(begin, Math.max(0, 1000 - (Date.now() - lastStart)));
    };
  }

  function begin() {
    if (!wanted) return;
    if (!rec) create();
    committed = new Map(); // result numbering starts over with each listening session
    lastStart = Date.now();
    try { rec.start(); } catch { /* already listening */ }
  }

  // Start listening (or keep listening) and send results to these handlers:
  // onNumber(value), onHear(text, value, isFinal), onState('listening'|'off'|'blocked'|'nomic'|'network'|'error').
  function listen(newHandlers) {
    handlers = newHandlers;
    if (!SR || wanted) return;
    wanted = true;
    begin();
  }

  function stop() {
    wanted = false;
    clearTimeout(stableTimer);
    clearTimeout(restartTimer);
    if (rec) try { rec.abort(); } catch { /* not listening */ }
  }

  // Prefer recognizing speech on this computer (Chrome can download a language pack) so the
  // audio isn't sent to a server. Call from a click so the browser allows the download.
  async function preferOnDevice() {
    if (!SR || typeof SR.available !== 'function') return false;
    const opts = { langs: [LANG], processLocally: true };
    try {
      let status = await SR.available(opts);
      if ((status === 'downloadable' || status === 'downloading') && typeof SR.install === 'function') {
        status = (await SR.install(opts)) ? 'available' : status;
      }
      if (status === 'available' && !onDevice) {
        onDevice = true;
        if (wanted) { stop(); rec = null; wanted = true; begin(); } else rec = null;
      }
    } catch { /* keep using the regular recognizer */ }
    return onDevice;
  }

  return { supported: !!SR, listen, stop, parseNumber, preferOnDevice, isOnDevice: () => onDevice };
})();

if (typeof module !== 'undefined') module.exports = Voice;
