// Spaced repetition for math facts, using a Leitner box system.
//
// Every fact (like "8+5") lives in a box from 0 to 6. A miss sends it back to box 0, so it shows
// up again later in the same level and at the start of the next one. A quick correct answer moves
// it up a box, and each box waits longer before asking again (minutes → days → weeks). Facts
// she has never seen are mixed in, spread evenly across the kinds of problem (small sums, teens,
// crossing ten) so the whole number range shows up.
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

  // The kind of problem, used to keep new facts balanced across the number range:
  // small (within 10), teens without crossing ten (12+5, 17-4), and crossing ten (8+7, 13-5).
  function group({ a, b, op, answer }) {
    if (op === '+') return answer <= 10 ? '+small' : (a >= 10 || b >= 10) ? '+teen' : '+cross';
    if (a <= 10) return '-small';
    return (answer >= 10 || b >= 10) ? '-teen' : '-cross';
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
    // Each group gets an equal share no matter how many facts it holds; ±0 and x−x are rare.
    while (picked.length < size && fresh.length) {
      const counts = {};
      for (const f of fresh) counts[group(f)] = (counts[group(f)] || 0) + 1;
      picked.push(takeWeighted(fresh, f => (isTrivial(f) ? 0.15 : 1) / counts[group(f)], rng));
    }
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

  return { allFacts, group, record, buildLevel, stats, INTERVALS };
})();

if (typeof module !== 'undefined') module.exports = SRS;
