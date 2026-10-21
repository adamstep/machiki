// Help with a fact the player got wrong.
//
// slip() looks at a wrong answer for a common mistake: doing the other operation (13 for 8−5),
// writing the digits the wrong way round (31 for 13), being off by ten (3 for 8+5) or by one. Its
// message points at the mistake without saying the answer.
//
// explain() works a fact out with a strategy that suits it (make ten, near doubles, think
// addition, …), as big-number steps plus a berry picture, for the tip shown when Machiki trips.
//
// similar() finds a fact that uses the same strategy with slightly different numbers, to ask next.
const Hints = (() => {
  function slip(fact, given) {
    const { a, b, op, answer } = fact;
    const other = op === '+' ? a - b : a + b;
    const swapped = given >= 10 && Number(String(given).split('').reverse().join('')) === answer;
    if (given === other && other !== answer) {
      return { type: 'op', text: op === '+' ? "Look at the sign: it's plus, so add!" : "Look at the sign: it's minus, so take away!" };
    }
    if (swapped) return { type: 'swap', text: 'Almost! Check which digit comes first.' };
    if (Math.abs(given - answer) === 10) return { type: 'ten', text: 'Close! Check the tens.' };
    if (Math.abs(given - answer) === 1) return { type: 'off1', text: 'So close! Count again carefully.' };
    return { type: 'other', text: given > answer ? "Not quite, that's too big!" : "Not quite, that's too small!" };
  }

  // The berry picture is a list of cells. 'frames' pictures fill ten-frames in order (two rows of
  // five, so 13 is a full frame and 3 more); 'rows' pictures put each cell at a row and column.
  // A cell's type picks the berry ('a' for the first number, 'b' for the second). `at` is the step
  // that adds it (-1: there from the start) and `cross` the step that takes it away.
  const cells = (n, type, at = -1, extra = {}) => Array.from({ length: n }, () => ({ type, at, ...extra }));
  const row = (n, r, type, at) => Array.from({ length: n }, (_, col) => ({ type, row: r, col, at: at(col) }));
  function crossOut(list, indexes, step) {
    indexes.forEach((i, n) => Object.assign(list[i], { cross: step, crossN: n })); // crossN: order within the step
    return list;
  }
  const range = (from, to) => Array.from({ length: Math.abs(to - from) + 1 }, (_, i) => from + (to >= from ? i : -i));
  const counting = (from, to) => range(from, to).join(' → ');

  // { kind, title, steps, layout, cells }
  function explain(fact) {
    const ex = fact.op === '+' ? addition(fact.a, fact.b) : subtraction(fact.a, fact.b);
    return { layout: 'frames', ...ex };
  }

  // Pictures start with the bigger number, so 5 + 8 is shown (and worked out) as 8 + 5.
  function addition(a, b) {
    const big = Math.max(a, b), small = Math.min(a, b), sum = a + b;
    const plain = (kind, title, steps) => ({ kind, title, steps, cells: [...cells(big, 'a'), ...cells(small, 'b', 0)] });
    if (small === 0) return plain('zero', 'Adding 0 changes nothing!', [`${a} + ${b} = ${sum}`]);
    if (small === 1) return plain('plus1', 'Plus 1 is the next number!', [counting(big, sum)]);
    if (a === b) {
      const half = a > 5 && a < 10;
      return {
        kind: 'double', layout: 'rows',
        title: a === 10 ? 'Two tens!' : half ? 'A double! Split each one at 5.' : 'A double!',
        steps: half ? ['5 + 5 = 10', `${a - 5} + ${a - 5} = ${2 * (a - 5)}`, `10 + ${2 * (a - 5)} = ${sum}`] : [`${a} + ${a} = ${sum}`],
        cells: [...row(a, 0, 'a', () => -1), ...row(a, 1, 'b', col => (half && col >= 5 ? 1 : 0))],
      };
    }
    if (big === 10) return plain('ten', `A ten and ${small} ones!`, [`10 + ${small} = ${sum}`]);
    if (big - small === 1) {
      return {
        kind: 'neardouble', layout: 'rows', title: 'Use a double, then add 1!',
        steps: [`${small} + ${small} = ${2 * small}`, `${2 * small} + 1 = ${sum}`],
        cells: [...row(small, 0, 'a', () => -1), ...row(big, 1, 'b', col => (col < small ? 0 : 1))],
      };
    }
    if (big > 10) {
      const ones = big - 10;
      return plain('teen+', 'Add the ones, keep the ten!', [`${ones} + ${small} = ${ones + small}`, `10 + ${ones + small} = ${sum}`]);
    }
    if (sum > 10) {
      const need = 10 - big;
      return {
        kind: 'make10', title: 'Make 10 first!',
        steps: [`${big} + ${need} = 10`, `10 + ${small - need} = ${sum}`],
        cells: [...cells(big, 'a'), ...cells(need, 'b', 0), ...cells(small - need, 'b', 1)],
      };
    }
    return plain('counton', a < b ? `Start at ${big} and count on!` : 'Count on!', [counting(big, sum)]);
  }

  function subtraction(a, b) {
    const answer = a - b, ones = a % 10;
    const all = () => cells(a, 'a');
    const fromEnd = n => range(a - 1, a - n);
    const take = (kind, title, steps, ...crossings) => {
      const list = all();
      crossings.forEach((idx, step) => crossOut(list, idx, step));
      return { kind, title, steps, cells: list };
    };
    // Think addition: the berries for b, then the missing ones join them.
    const addUp = (kind, title, steps, at) => ({ kind, title, steps, cells: [...cells(b, 'a'), ...cells(answer, 'b', at)] });

    if (b === 0) return take('zero', 'Taking away 0 changes nothing!', [`${a} − 0 = ${a}`]);
    if (answer === 0) return take('all', "Take them all away and there's none left!", [`${a} − ${a} = 0`], fromEnd(a));
    if (b === 1) return take('minus1', 'Minus 1 is the number before!', [counting(a, answer)], fromEnd(1));
    if (b === 10) return take('ten', 'Take away the ten, the ones are left!', [`${a} − 10 = ${answer}`], range(0, 9));
    if (answer <= 3) return addUp('countup', `Count up from ${b} to ${a}!`, [counting(b, a), `${b} + ${answer} = ${a}`], 0);
    if (b === 2) return take('countback', 'Count back 2!', [counting(a, answer)], fromEnd(2));
    if (b > 10) {
      return take('tens-', 'Take away 10 first!', [`${a} − 10 = ${a - 10}`, `${a - 10} − ${b - 10} = ${answer}`], range(0, 9), fromEnd(b - 10));
    }
    if (a <= 10) return addUp('thinkadd', 'Think addition!', [`${b} + ? = ${a}`, `${b} + ${answer} = ${a}`], 1);
    if (a === 20) return take('twenty', '20 is two tens. Take from one of them!', [`10 − ${b} = ${10 - b}`, `10 + ${10 - b} = ${answer}`], fromEnd(b));
    if (ones === b) return take('ones', 'Take away the ones, the ten is left!', [`${ones} − ${b} = 0`, `10 + 0 = 10`], fromEnd(b));
    if (ones > b) {
      return take('teen-', 'Take from the ones, keep the ten!', [`${ones} − ${b} = ${ones - b}`, `10 + ${ones - b} = ${answer}`], fromEnd(b));
    }
    return take('down10', 'Get to 10 first!', [`${a} − ${ones} = 10`, `10 − ${b - ones} = ${answer}`], fromEnd(ones), range(9, 10 - (b - ones)));
  }

  // A fact from `pool` that is worked out the same way with slightly different numbers: after
  // 8 + 5, maybe 8 + 6 or 9 + 4, but not 5 + 8. Facts in `avoid` (keys) are skipped.
  function similar(fact, pool, avoid = new Set(), rng = Math.random) {
    const kind = explain(fact).kind;
    const nums = f => (f.op === '+' ? [Math.max(f.a, f.b), Math.min(f.a, f.b)] : [f.a, f.b]);
    const [x, y] = nums(fact);
    const options = [];
    for (const f of pool) {
      if (f.op !== fact.op || avoid.has(f.key)) continue;
      const [p, q] = nums(f), d = Math.abs(p - x) + Math.abs(q - y);
      if (d > 0 && explain(f).kind === kind) options.push({ f, d });
    }
    if (!options.length) return null;
    const best = Math.min(...options.map(o => o.d));
    const close = options.filter(o => o.d <= best + 1);
    return close[Math.floor(rng() * close.length)].f;
  }

  // Names for the grown-ups panel.
  const SLIP_NAMES = { op: 'Mixed up + and −', ten: 'Off by ten', off1: 'Off by one', swap: 'Swapped digits', other: 'Other' };

  return { slip, explain, similar, SLIP_NAMES };
})();

if (typeof module !== 'undefined') module.exports = Hints;
