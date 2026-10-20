// Spaced repetition for math facts, using a Leitner box system.
//
// Every fact (like "8+5") lives in a box from 0 to 6. A miss sends it back to box 0, so it shows
// up again later in the same level and at the start of the next one. A quick correct answer moves
// it up a box, and each box waits longer before asking again (minutes → days → weeks). Facts
// she has never seen are mixed in, easiest first, so new material arrives gradually.
const SRS = (() => {
  const MIN = 60e3, DAY = 864e5;
  const INTERVALS = [0, 10 * MIN, 1 * DAY, 3 * DAY, 7 * DAY, 16 * DAY, 35 * DAY];
  const MAX_BOX = INTERVALS.length - 1;
  const MASTERED_BOX = 3;

  function fact(a, b, op) {
    return { key: `${a}${op}${b}`, a, b, op, answer: op === '+' ? a + b : a - b };
  }

  function allFacts({ ops = 'both', max = 20 } = {}) {
    const out = [];
    for (let a = 0; a <= max; a++) {
      for (let b = 0; b <= max; b++) {
        if (ops !== 'sub' && a + b <= max) out.push(fact(a, b, '+'));
        if (ops !== 'add' && b <= a) out.push(fact(a, b, '-'));
      }
    }
    return out;
  }

  const isTrivial = f => f.b === 0 || (f.op === '+' && f.a === 0) || (f.op === '-' && f.a === f.b);

  // Rough difficulty, used to introduce new facts in a sensible order.
  function difficulty({ a, b, op }) {
    if (op === '+') {
      const sum = a + b;
      let d = sum <= 5 ? 1 : sum <= 10 ? 2 : (a >= 10 || b >= 10) ? 3 : 4; // 4 = crossing ten, e.g. 7+6
      if (a === b) d -= 0.5; // doubles are easier to remember
      return d;
    }
    if (a <= 5) return 1;
    if (a <= 10) return 2;
    if (b === 10 || a - b >= 10) return 3; // 15-10, 17-4
    return 4.5; // crossing ten, e.g. 13-5
  }

  function record(srs, key, { missed, fast }, now = Date.now()) {
    const r = srs.facts[key] || (srs.facts[key] = { box: 0, due: 0, seen: 0, right: 0, wrong: 0, last: 0 });
    const isNew = r.seen === 0;
    r.seen++;
    r.last = now;
    if (missed) {
      r.wrong++;
      r.box = 0;
    } else {
      r.right++;
      if (isNew && fast) r.box = 2;                       // already knew it: skip the short steps
      else if (fast) r.box = Math.min(MAX_BOX, r.box + 1);
      else r.box = Math.max(1, r.box);                     // right but slow: don't promote yet
    }
    r.due = now + INTERVALS[r.box];
    return r;
  }

  // Removes and returns one item from list, chosen with probability proportional to weight(item).
  function takeWeighted(list, weight, rng) {
    const ws = list.map(weight);
    let roll = rng() * ws.reduce((s, w) => s + w, 0);
    let i = 0;
    while (i < list.length - 1 && (roll -= ws[i]) > 0) i++;
    return list.splice(i, 1)[0];
  }

  function buildLevel(srs, settings, size = 10, now = Date.now(), rng = Math.random) {
    const due = [], fresh = [], rest = [];
    for (const f of allFacts(settings)) {
      const r = srs.facts[f.key];
      if (!r) fresh.push(f);
      else if (r.due <= now) due.push(f);
      else rest.push(f);
    }
    const rec = f => srs.facts[f.key];
    due.sort((x, y) => rec(x).box - rec(y).box || rec(x).due - rec(y).due);

    // Up to 60% reviews, then new facts, then any extra reviews, then older facts to fill.
    const picked = due.splice(0, Math.ceil(size * 0.6));
    const minD = Math.min(...fresh.map(difficulty));
    const freshWeight = f => Math.exp(-2.5 * (difficulty(f) - minD)) * (isTrivial(f) ? 0.25 : 1);
    while (picked.length < size && fresh.length) picked.push(takeWeighted(fresh, freshWeight, rng));
    while (picked.length < size && due.length) picked.push(due.shift());
    const restWeight = f => (MAX_BOX + 1 - rec(f).box) ** 2 * (1 + (now - rec(f).last) / DAY);
    while (picked.length < size && rest.length) picked.push(takeWeighted(rest, restWeight, rng));

    // Shuffle, then nudge apart any back-to-back pair that uses the same numbers (7+5 then 5+7).
    for (let i = picked.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [picked[i], picked[j]] = [picked[j], picked[i]];
    }
    const sameNumbers = (x, y) => x && y && new Set([x.a, x.b, x.answer, y.a, y.b, y.answer]).size <= 3;
    for (let i = 1; i < picked.length; i++) {
      if (!sameNumbers(picked[i - 1], picked[i])) continue;
      const j = picked.findIndex((f, k) => k > i && !sameNumbers(picked[i - 1], f) && !sameNumbers(f, picked[i + 1]));
      if (j > 0) [picked[i], picked[j]] = [picked[j], picked[i]];
    }
    return picked;
  }

  function stats(srs, settings) {
    const pool = allFacts(settings);
    let practiced = 0, mastered = 0;
    const tricky = [];
    for (const f of pool) {
      const r = srs.facts[f.key];
      if (!r) continue;
      practiced++;
      if (r.box >= MASTERED_BOX) mastered++;
      if (r.wrong > 0 && r.box < MASTERED_BOX) tricky.push({ ...f, wrong: r.wrong, box: r.box });
    }
    tricky.sort((x, y) => x.box - y.box || y.wrong - x.wrong);
    return { total: pool.length, practiced, mastered, tricky: tricky.slice(0, 16) };
  }

  return { allFacts, difficulty, record, buildLevel, stats, INTERVALS };
})();

if (typeof module !== 'undefined') module.exports = SRS;
