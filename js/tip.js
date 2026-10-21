// The tip shown when Machiki trips: the fact worked out step by step in big numbers, with a berry
// picture that changes as each step appears (berries join a ten-frame, or get crossed out).
const Tip = (() => {
  const CELL = 54, PAD = 10, GAP = 28, MARGIN = 8; // picture layout, in stage pixels
  const START = 0.7, POP = 0.09;                   // seconds: before the first step, between berries
  const BERRY = { a: 'blueberry', b: 'strawberry' };
  const easeBack = p => 1 + 2.7 * (p - 1) ** 3 + 1.7 * (p - 1) ** 2;

  // Where each cell goes, and the boxes to draw behind them.
  function layout(ex) {
    const fw = 5 * CELL + 2 * PAD, fh = 2 * CELL + 2 * PAD;
    if (ex.layout === 'rows') {
      const cols = Math.max(...ex.cells.map(c => c.col)) + 1;
      const split = cols > 5 ? GAP / 2 : 0; // a gap after five, so 7 reads as 5 and 2
      const w = cols * CELL + split + 2 * PAD;
      return {
        w: w + 2 * MARGIN, h: fh + 2 * MARGIN, boxes: [[MARGIN, MARGIN, w, fh]],
        at: c => [MARGIN + PAD + c.col * CELL + (c.col >= 5 ? split : 0) + CELL / 2, MARGIN + PAD + c.row * CELL + CELL / 2],
      };
    }
    const frames = Math.max(1, Math.ceil(ex.cells.length / 10));
    return {
      w: frames * fw + (frames - 1) * GAP + 2 * MARGIN, h: fh + 2 * MARGIN,
      boxes: Array.from({ length: frames }, (_, f) => [MARGIN + f * (fw + GAP), MARGIN, fw, fh, true]),
      at: (c, i) => [
        MARGIN + Math.floor(i / 10) * (fw + GAP) + PAD + (i % 5) * CELL + CELL / 2,
        MARGIN + PAD + Math.floor((i % 10) / 5) * CELL + CELL / 2,
      ],
    };
  }

  // When each step starts: long enough to watch its berries come and go, and to read it.
  function timeline(ex) {
    const starts = [];
    let t = START;
    ex.steps.forEach((_, i) => {
      starts.push(t);
      const busy = ex.cells.filter(c => c.at === i || c.cross === i).length;
      t += Math.max(1.5, busy * POP + 1.1);
    });
    return { starts, end: t - 0.4 };
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
  }

  function drawPicture(ctx, ex, lay, starts, t) {
    ctx.clearRect(0, 0, lay.w, lay.h);
    for (const [x, y, w, h, grid] of lay.boxes) {
      roundRect(ctx, x, y, w, h, 18);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#c79a6c';
      ctx.stroke();
      if (!grid) continue;
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ead7bd';
      ctx.beginPath();
      for (let c = 1; c < 5; c++) { ctx.moveTo(x + PAD + c * CELL, y + PAD); ctx.lineTo(x + PAD + c * CELL, y + h - PAD); }
      ctx.moveTo(x + PAD, y + PAD + CELL); ctx.lineTo(x + w - PAD, y + PAD + CELL);
      ctx.stroke();
    }

    const order = {};
    ex.cells.forEach((c, i) => {
      const n = (order[c.at] = (order[c.at] ?? -1) + 1);
      const shown = c.at < 0 ? n * 0.02 : starts[c.at] + n * POP;
      if (t < shown) return;
      const [x, y] = lay.at(c, i);
      const grow = easeBack(Math.min(1, (t - shown) / 0.25));
      const gone = c.cross === undefined ? 0 : Math.max(0, Math.min(1, (t - starts[c.cross] - c.crossN * POP) / 0.3));
      ctx.save();
      ctx.globalAlpha = 1 - 0.7 * gone;
      Art.berry(ctx, BERRY[c.type], x, y + 2, CELL * 0.34 * grow);
      ctx.restore();
      if (gone > 0) {
        const r = CELL * 0.36 * gone;
        ctx.lineCap = 'round';
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#e0533a';
        ctx.beginPath();
        ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r);
        ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r);
        ctx.stroke();
      }
    });
  }

  // Fills the tip's elements for `fact` and plays it. onStep(i) runs as each step appears and
  // onDone() once the answer is shown. Returns a function that stops it.
  function play({ fact, els, k, onStep, onDone }) {
    const ex = Hints.explain(fact);
    const lay = layout(ex);
    const { starts, end } = timeline(ex);

    els.eq.innerHTML = `${fact.a} ${fact.op === '+' ? '+' : '−'} ${fact.b} = <span class="tip-answer">?</span>`;
    els.title.textContent = `💡 ${ex.title}`;
    els.steps.replaceChildren(...ex.steps.map(text => {
      const el = document.createElement('div');
      el.className = 'tip-step';
      el.textContent = text;
      return el;
    }));

    const canvas = els.picture;
    canvas.style.width = `${lay.w}px`;
    canvas.style.height = `${lay.h}px`;
    canvas.width = Math.round(lay.w * k);
    canvas.height = Math.round(lay.h * k);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(k, 0, 0, k, 0, 0);

    const began = performance.now();
    let shownSteps = 0, done = false, raf = 0;
    const tick = now => {
      const t = (now - began) / 1000;
      while (shownSteps < starts.length && t >= starts[shownSteps]) {
        els.steps.children[shownSteps].classList.add('on');
        onStep(shownSteps++);
      }
      if (!done && t >= end) {
        done = true;
        const ans = els.eq.querySelector('.tip-answer');
        ans.textContent = fact.answer;
        ans.classList.add('on');
        onDone();
      }
      drawPicture(ctx, ex, lay, starts, t);
      if (!done || t < end + 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }

  return { play };
})();
