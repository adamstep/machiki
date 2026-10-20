// All of the game's graphics are drawn with the Canvas API — no image files needed.
// The scene is always 720 tall; its width follows the screen's shape (set by fit() in game.js).
let W = 1280;
const H = 720, GROUND_Y = 588;

const Art = (() => {
  const TAU = Math.PI * 2;
  const LINE = '#4a2a17';

  // Deterministic pseudo-random number in [0, 1) for scenery index n.
  const rnd = n => { const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };

  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
  function ellipse(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); }
  function paint(ctx, fill, stroke, lw = 4) {
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
  }

  // Draws a group of circles as one blob with a single outline around the whole group.
  function puffs(ctx, list, fill, stroke, lw = 4) {
    if (stroke) {
      ctx.fillStyle = stroke;
      for (const [x, y, r] of list) { circle(ctx, x, y, r + lw); ctx.fill(); }
    }
    ctx.fillStyle = fill;
    for (const [x, y, r] of list) { circle(ctx, x, y, r); ctx.fill(); }
  }

  function star(ctx, x, y, r, fill, stroke) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    paint(ctx, fill, stroke, 2.5);
  }

  // ---------------------------------------------------------------- scenery

  let skyGrad;
  function sky(ctx, t) {
    if (!skyGrad) {
      skyGrad = ctx.createLinearGradient(0, 0, 0, 560);
      skyGrad.addColorStop(0, '#62bfff');
      skyGrad.addColorStop(0.7, '#bfe9ff');
      skyGrad.addColorStop(1, '#eafaff');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // A friendly sun
    const sx = W - 130, sy = 190;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(t * 0.12);
    ctx.fillStyle = 'rgba(255, 214, 80, 0.5)';
    for (let i = 0; i < 12; i++) {
      ctx.rotate(TAU / 12);
      ctx.beginPath(); ctx.moveTo(-11, -62); ctx.lineTo(0, -94); ctx.lineTo(11, -62); ctx.fill();
    }
    ctx.restore();
    circle(ctx, sx, sy, 68); paint(ctx, 'rgba(255, 240, 150, 0.35)');
    circle(ctx, sx, sy, 52); paint(ctx, '#ffd84a', '#f0a020', 4);
    ctx.lineWidth = 4; ctx.strokeStyle = LINE; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(sx - 17, sy - 6, 7, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    ctx.beginPath(); ctx.arc(sx + 17, sy - 6, 7, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    ctx.beginPath(); ctx.arc(sx, sy + 8, 16, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
    circle(ctx, sx - 30, sy + 10, 8); paint(ctx, 'rgba(255, 120, 100, 0.45)');
    circle(ctx, sx + 30, sy + 10, 8); paint(ctx, 'rgba(255, 120, 100, 0.45)');
  }

  function cloud(ctx, x, y, s) {
    const list = [[0, 0, 30], [34, -16, 38], [72, -4, 32], [104, 6, 24], [40, 10, 30], [-24, 10, 22]]
      .map(([cx, cy, r]) => [x + cx * s, y + cy * s, r * s]);
    puffs(ctx, list.map(([cx, cy, r]) => [cx, cy + 6 * s, r]), '#d6ecfa');
    puffs(ctx, list, '#ffffff');
  }

  function hills(ctx, off, base, amp, f1, f2, color) {
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W + 16; x += 16) {
      const X = x + off;
      ctx.lineTo(x, base - amp * (Math.sin(X * f1) * 0.6 + Math.sin(X * f2 + 1.7) * 0.4));
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  // Calls fn(screenX, index) for each repeating scenery slot of a parallax layer.
  function layer(off, spacing, fn) {
    const first = Math.floor(off / spacing) - 1, last = Math.floor((off + W) / spacing) + 1;
    for (let i = first; i <= last; i++) fn(i * spacing - off + rnd(i) * spacing * 0.6, i);
  }

  function pine(ctx, x, y, s, color, stroke) {
    ctx.beginPath(); ctx.rect(x - 6 * s, y - 20 * s, 12 * s, 20 * s); paint(ctx, '#7a4a2a', stroke, 3);
    for (let k = 0; k < 3; k++) {
      const top = y - 40 * s - k * 30 * s, half = (46 - k * 10) * s;
      ctx.beginPath();
      ctx.moveTo(x, top - 34 * s);
      ctx.lineTo(x + half, top + 22 * s);
      ctx.lineTo(x - half, top + 22 * s);
      ctx.closePath();
      paint(ctx, color, stroke, 3);
    }
  }

  function mushroom(ctx, x, y) {
    ctx.beginPath(); ctx.roundRect(x - 6, y - 16, 12, 16, 4); paint(ctx, '#fff3dc', LINE, 2.5);
    ctx.beginPath(); ctx.ellipse(x, y - 16, 17, 14, 0, Math.PI, TAU); ctx.closePath(); paint(ctx, '#ef4b4b', LINE, 2.5);
    circle(ctx, x - 7, y - 22, 3); paint(ctx, '#fff');
    circle(ctx, x + 6, y - 25, 3.5); paint(ctx, '#fff');
  }

  function tuft(ctx, x, y) {
    ctx.strokeStyle = '#3f9a3a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (const [dx, h] of [[-6, 12], [0, 18], [6, 13]]) {
      ctx.beginPath(); ctx.moveTo(x + dx * 0.4, y); ctx.quadraticCurveTo(x + dx, y - h * 0.6, x + dx * 1.5, y - h); ctx.stroke();
    }
  }

  // The bare field is sky, sun, hills, grass and the path. Everything else is bought in the shop
  // (see decor.js) and drawn into its layer, back to front.
  function background(ctx, wx, t, owned) {
    sky(ctx, t);
    Decor.layer(ctx, 'backdrop', wx, t, owned);
    Decor.layer(ctx, 'sky', wx, t, owned);
    Decor.flyers(ctx, t, owned);
    hills(ctx, wx * 0.1, 400, 55, 0.004, 0.0107, '#b7e4c3');
    Decor.layer(ctx, 'far', wx, t, owned);
    hills(ctx, wx * 0.22, 486, 10, 0.011, 0.02, '#86c98f');
    Decor.layer(ctx, 'landmark', wx, t, owned);
    Decor.layer(ctx, 'mid', wx, t, owned);

    ctx.fillStyle = '#79c94d';
    ctx.fillRect(0, 540, W, H - 540);
    ctx.fillStyle = '#69b843';
    layer(wx, 26, x => { ctx.beginPath(); ctx.arc(x, 542, 16, Math.PI, TAU); ctx.fill(); });
    ctx.fillStyle = '#e9c58e';
    ctx.fillRect(0, 560, W, 58);
    ctx.fillStyle = '#d5a86b';
    ctx.fillRect(0, 560, W, 5);
    ctx.fillRect(0, 613, W, 5);

    Decor.layer(ctx, 'path', wx, t, owned);
    Decor.layer(ctx, 'near', wx, t, owned);
    Decor.layer(ctx, 'front', wx, t, owned);
    Decor.layer(ctx, 'air', wx, t, owned);
  }

  // ---------------------------------------------------------------- berries

  function cluster(ctx, x, y, r, fill, stroke, shine) {
    const pts = [[0, 0], [-0.55, -0.3], [0.55, -0.3], [-0.55, 0.35], [0.55, 0.35], [0, -0.62], [0, 0.68]];
    for (const [dx, dy] of pts) { circle(ctx, x + dx * r, y + dy * r, r * 0.42); paint(ctx, fill, stroke, 1.8); }
    for (const [dx, dy] of pts) { circle(ctx, x + dx * r - r * 0.12, y + dy * r - r * 0.12, r * 0.1); paint(ctx, shine); }
  }

  function berry(ctx, type, x, y, r) {
    switch (type) {
      case 'blueberry': {
        circle(ctx, x, y, r); paint(ctx, '#4f6fe0', '#1f2d6e', 2.5);
        star(ctx, x, y - r * 0.55, r * 0.32, '#2a3a8a');
        ellipse(ctx, x - r * 0.38, y - r * 0.05, r * 0.2, r * 0.3, 0.4); paint(ctx, 'rgba(255,255,255,0.6)');
        break;
      }
      case 'strawberry': {
        ctx.beginPath();
        ctx.moveTo(x, y + r * 1.15);
        ctx.bezierCurveTo(x - r * 1.5, y + r * 0.2, x - r * 1.1, y - r * 0.95, x, y - r * 0.75);
        ctx.bezierCurveTo(x + r * 1.1, y - r * 0.95, x + r * 1.5, y + r * 0.2, x, y + r * 1.15);
        paint(ctx, '#ef3b3b', '#951c1c', 2.5);
        ctx.fillStyle = '#ffe27a';
        for (const [dx, dy] of [[-0.4, -0.1], [0.4, -0.1], [0, 0.15], [-0.25, 0.5], [0.25, 0.5], [0, -0.35]]) {
          ellipse(ctx, x + dx * r, y + dy * r, r * 0.07, r * 0.11); ctx.fill();
        }
        star(ctx, x, y - r * 0.8, r * 0.5, '#3fae3f', '#1f6b1f');
        break;
      }
      case 'raspberry': cluster(ctx, x, y, r, '#f0507f', '#a8264f', 'rgba(255,255,255,0.7)'); star(ctx, x, y - r * 0.85, r * 0.35, '#3fae3f'); break;
      case 'blackberry': cluster(ctx, x, y, r, '#5a2f80', '#24123a', 'rgba(255,255,255,0.55)'); star(ctx, x, y - r * 0.85, r * 0.35, '#3fae3f'); break;
      case 'cherry': {
        ctx.strokeStyle = '#4f8a2a'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - r * 0.5, y); ctx.quadraticCurveTo(x - r * 0.3, y - r, x + r * 0.2, y - r * 1.4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + r * 0.55, y + r * 0.1); ctx.quadraticCurveTo(x + r * 0.5, y - r * 0.8, x + r * 0.2, y - r * 1.4); ctx.stroke();
        ellipse(ctx, x + r * 0.55, y - r * 1.4, r * 0.45, r * 0.2, -0.4); paint(ctx, '#5cc04a');
        for (const [dx, dy] of [[-0.5, 0.25], [0.55, 0.35]]) {
          circle(ctx, x + dx * r, y + dy * r, r * 0.62); paint(ctx, '#e0263a', '#8a1020', 2.5);
          circle(ctx, x + dx * r - r * 0.2, y + dy * r - r * 0.2, r * 0.15); paint(ctx, 'rgba(255,255,255,0.7)');
        }
        break;
      }
      case 'grapes': {
        ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y - r * 0.8); ctx.lineTo(x + r * 0.3, y - r * 1.3); ctx.stroke();
        ellipse(ctx, x + r * 0.7, y - r * 1.15, r * 0.45, r * 0.25, -0.3); paint(ctx, '#5cc04a');
        for (const [dx, dy] of [[-0.6, -0.4], [0, -0.45], [0.6, -0.4], [-0.3, 0.12], [0.3, 0.12], [0, 0.65]]) {
          circle(ctx, x + dx * r, y + dy * r, r * 0.42); paint(ctx, '#8a5ad0', '#4a2a80', 1.8);
          circle(ctx, x + dx * r - r * 0.12, y + dy * r - r * 0.12, r * 0.1); paint(ctx, 'rgba(255,255,255,0.6)');
        }
        break;
      }
      case 'golden': {
        circle(ctx, x, y, r * 1.55); paint(ctx, 'rgba(255, 230, 120, 0.35)');
        circle(ctx, x, y, r); paint(ctx, '#ffd23a', '#b8800a', 2.5);
        ellipse(ctx, x - r * 0.35, y - r * 0.3, r * 0.22, r * 0.32, 0.5); paint(ctx, 'rgba(255,255,255,0.75)');
        star(ctx, x + r * 0.7, y - r * 0.7, r * 0.42, '#fffbe0');
        break;
      }
    }
  }

  // ---------------------------------------------------------------- items

  function bushSpots() {
    const spots = [];
    const base = [[-40, -50], [-8, -82], [28, -62], [52, -38], [-20, -28], [14, -34], [-52, -26]];
    for (const [x, y] of base) spots.push({ x: x + (Math.random() - 0.5) * 8, y: y + (Math.random() - 0.5) * 8 });
    return spots;
  }

  function bush(ctx, it) {
    const wobble = it.shake > 0 ? Math.sin(it.shake * 50) * it.shake * 10 : 0;
    ctx.save();
    ctx.translate(it.x, GROUND_Y);
    ellipse(ctx, 0, 4, 72, 11); paint(ctx, 'rgba(0,0,0,0.15)');
    ctx.rotate(wobble * 0.01);
    const list = [[-48, -30, 34], [-10, -58, 46], [36, -46, 40], [56, -20, 26], [-20, -18, 30], [16, -16, 30]];
    puffs(ctx, list, '#2f8a3e', LINE, 4);
    puffs(ctx, list.map(([x, y, r]) => [x - r * 0.2, y - r * 0.25, r * 0.6]), '#47ad55');
    if (!it.picked) for (const s of it.spots) berry(ctx, it.berryType, s.x, s.y, 12);
    ctx.restore();
  }

  function log(ctx, x, y) {
    ctx.beginPath(); ctx.roundRect(x - 75, y - 58, 140, 58, 28); paint(ctx, '#9a6236', LINE);
    ctx.strokeStyle = '#7a4524'; ctx.lineWidth = 3;
    for (const [lx, ly, len] of [[-50, -40, 40], [-20, -20, 50], [-55, -14, 22], [10, -44, 30]]) {
      ctx.beginPath(); ctx.moveTo(x + lx, y + ly); ctx.lineTo(x + lx + len, y + ly); ctx.stroke();
    }
    ellipse(ctx, x + 62, y - 29, 18, 29); paint(ctx, '#ecc58e', LINE);
    ellipse(ctx, x + 62, y - 29, 11, 19); paint(ctx, null, '#c69256', 3);
    ellipse(ctx, x + 62, y - 29, 4, 8); paint(ctx, null, '#c69256', 3);
    ctx.strokeStyle = '#3a8a3a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - 20, y - 58); ctx.quadraticCurveTo(x - 22, y - 74, x - 30, y - 80); ctx.stroke();
    ellipse(ctx, x - 34, y - 80, 9, 5, -0.4); paint(ctx, '#5cc04a', '#2f7a2a', 2);
    ellipse(ctx, x - 14, y - 76, 8, 4.5, 0.5); paint(ctx, '#5cc04a', '#2f7a2a', 2);
  }

  function rock(ctx, x, y) {
    ctx.beginPath();
    ctx.moveTo(x - 60, y);
    ctx.bezierCurveTo(x - 66, y - 46, x - 40, y - 86, x + 2, y - 84);
    ctx.bezierCurveTo(x + 44, y - 84, x + 66, y - 44, x + 60, y);
    ctx.closePath();
    paint(ctx, '#a3acb6', LINE);
    ellipse(ctx, x - 18, y - 58, 18, 10, -0.5); paint(ctx, '#c7cfd7');
    ctx.beginPath(); ctx.moveTo(x + 18, y - 30); ctx.lineTo(x + 32, y - 18); ctx.lineTo(x + 28, y - 4);
    paint(ctx, null, '#6b7580', 3);
    puffs(ctx, [[x - 10, y - 80, 12], [x + 8, y - 82, 14], [x + 24, y - 74, 10]], '#6cbf4a');
  }

  function stump(ctx, x, y) {
    ctx.beginPath();
    ctx.moveTo(x - 58, y);
    ctx.quadraticCurveTo(x - 40, y - 12, x - 40, y - 70);
    ctx.lineTo(x + 40, y - 70);
    ctx.quadraticCurveTo(x + 40, y - 12, x + 58, y);
    ctx.closePath();
    paint(ctx, '#8b5a35', LINE);
    ctx.strokeStyle = '#6e4224'; ctx.lineWidth = 3;
    for (const dx of [-18, 4, 22]) { ctx.beginPath(); ctx.moveTo(x + dx, y - 60); ctx.lineTo(x + dx + 2, y - 12); ctx.stroke(); }
    ellipse(ctx, x, y - 70, 40, 13); paint(ctx, '#ecc58e', LINE);
    ellipse(ctx, x, y - 70, 26, 8); paint(ctx, null, '#c69256', 2.5);
    ellipse(ctx, x, y - 70, 11, 3.5); paint(ctx, null, '#c69256', 2.5);
    mushroom(ctx, x + 46, y - 2);
  }

  function thorns(ctx, x, y) {
    const list = [[-46, -28, 28], [-12, -52, 38], [30, -40, 34], [52, -18, 22], [-14, -18, 28], [18, -14, 26]]
      .map(([cx, cy, r]) => [x + cx, y + cy, r]);
    // spikes around the edge
    ctx.fillStyle = '#7a4a2a';
    for (let k = 0; k < 22; k++) {
      const [cx, cy, r] = list[k % list.length];
      const a = Math.PI + (k / 22) * Math.PI * 1.1 + (k % 3) * 0.3;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a - 0.18) * r, cy + Math.sin(a - 0.18) * r);
      ctx.lineTo(cx + Math.cos(a) * (r + 16), cy + Math.sin(a) * (r + 16));
      ctx.lineTo(cx + Math.cos(a + 0.18) * r, cy + Math.sin(a + 0.18) * r);
      ctx.fill();
    }
    puffs(ctx, list, '#3d6b3a', LINE, 4);
    ctx.strokeStyle = '#2a4a28'; ctx.lineWidth = 3;
    for (let k = 0; k < 5; k++) {
      ctx.beginPath(); ctx.arc(x - 30 + k * 16, y - 30 - (k % 2) * 16, 12, 0.2, 2.6); ctx.stroke();
    }
    for (const [dx, dy] of [[-28, -44], [10, -60], [34, -30]]) {
      circle(ctx, x + dx, y + dy, 5); paint(ctx, '#b04ad8', '#4a1a60', 2);
    }
  }

  function puddle(ctx, x, y, t) {
    ellipse(ctx, x, y - 6, 76, 17); paint(ctx, '#8a5a35', LINE);
    ellipse(ctx, x - 4, y - 8, 60, 10); paint(ctx, '#a8764a');
    ellipse(ctx, x - 26, y - 11, 15, 3); paint(ctx, 'rgba(255,255,255,0.45)');
    for (let k = 0; k < 3; k++) {
      const p = (t * 0.8 + k / 3) % 1;
      circle(ctx, x + 10 + k * 14, y - 9, 2 + p * 3); paint(ctx, null, `rgba(230, 200, 160, ${1 - p})`, 2);
    }
    for (const [dx, dy, r] of [[-70, -20, 5], [-62, -28, 3.5], [68, -22, 4.5], [76, -14, 3]]) {
      circle(ctx, x + dx, y + dy, r); paint(ctx, '#8a5a35', LINE, 2);
    }
  }

  function haybale(ctx, x, y) {
    ctx.beginPath(); ctx.roundRect(x - 60, y - 74, 120, 74, 14); paint(ctx, '#f2c94c', '#8a5a12');
    ctx.strokeStyle = '#d9a82a'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (const [dx, dy] of [[-44, -56], [-10, -40], [20, -60], [36, -24], [-36, -18], [6, -14], [-20, -64], [44, -48]]) {
      ctx.beginPath(); ctx.moveTo(x + dx, y + dy); ctx.lineTo(x + dx + 10, y + dy - 4); ctx.stroke();
    }
    for (const dx of [-32, 28]) { ctx.beginPath(); ctx.rect(x + dx, y - 74, 6, 74); paint(ctx, '#b0442a', LINE, 2); }
    ctx.strokeStyle = '#e8b830'; ctx.lineWidth = 2.5;
    for (const dx of [-40, -8, 18, 44]) { ctx.beginPath(); ctx.moveTo(x + dx, y - 73); ctx.lineTo(x + dx - 4, y - 84); ctx.stroke(); }
  }

  function pinecone(ctx, x, y) {
    ctx.beginPath(); ctx.roundRect(x - 5, y - 104, 10, 14, 3); paint(ctx, '#6b4a2a', LINE, 2.5);
    ellipse(ctx, x, y - 48, 40, 48); paint(ctx, '#7a4520', LINE);
    for (let j = 0; j < 6; j++) {
      const sy = y - 12 - j * 15, half = 40 * Math.sqrt(Math.max(0, 1 - ((sy - (y - 48)) / 48) ** 2)) - 6;
      for (let sx = x - half + (j % 2) * 8; sx <= x + half; sx += 16) {
        ellipse(ctx, sx, sy, 9, 7); paint(ctx, '#b8743a', LINE, 1.8);
        ellipse(ctx, sx - 2, sy - 2, 4, 2.5); paint(ctx, '#d99a5a');
      }
    }
  }

  function beehive(ctx, x, y, t) {
    ctx.beginPath(); ctx.roundRect(x - 40, y - 26, 80, 26, 4); paint(ctx, '#8b5a35', LINE);
    ellipse(ctx, x, y - 26, 40, 8); paint(ctx, '#ecc58e', LINE, 3);
    for (let k = 4; k >= 0; k--) {
      const w = 44 - k * 7;
      ctx.beginPath(); ctx.roundRect(x - w, y - 44 - k * 15, w * 2, 19, 9); paint(ctx, k % 2 ? '#f0b43c' : '#e8a42c', '#8a5a12', 2.5);
    }
    ellipse(ctx, x, y - 112, 12, 9); paint(ctx, '#f0b43c', '#8a5a12', 2.5);
    ellipse(ctx, x, y - 38, 9, 6); paint(ctx, '#4a2a17');
    for (let k = 0; k < 2; k++) {
      const a = t * 3 + k * Math.PI;
      bee(ctx, x + Math.cos(a) * 58, y - 80 + Math.sin(a * 2) * 18, t);
    }
  }

  function bee(ctx, x, y, t) {
    ellipse(ctx, x - 1, y - 6, 4, 6, -0.4); paint(ctx, `rgba(255,255,255,${0.5 + 0.4 * Math.abs(Math.sin(t * 40))})`, LINE, 1);
    ctx.save();
    ellipse(ctx, x, y, 7, 5); paint(ctx, '#ffd23a', LINE, 1.5);
    ctx.clip();
    ctx.fillStyle = LINE;
    ctx.fillRect(x - 2.5, y - 6, 2.2, 12);
    ctx.fillRect(x + 1.5, y - 6, 2.2, 12);
    ctx.restore();
  }

  const OBSTACLE_DRAW = { log, rock, stump, thorns, puddle, haybale, pinecone, beehive };

  function item(ctx, it, t) {
    if (it.kind === 'bush') return bush(ctx, it);
    ellipse(ctx, it.x, GROUND_Y + 4, it.w * 0.5, 10); paint(ctx, 'rgba(0,0,0,0.15)');
    ctx.save();
    if (it.shake > 0) ctx.translate(Math.sin(it.shake * 50) * it.shake * 8, 0);
    OBSTACLE_DRAW[it.type](ctx, it.x, GROUND_Y, t);
    ctx.restore();
    if (!it.picked) {
      for (let k = 0; k < 3; k++) {
        const bx = it.x + (k - 1) * 34, by = GROUND_Y - 205 + Math.sin(t * 3 + k * 1.3) * 7 + (k === 1 ? -14 : 0);
        circle(ctx, bx, by, 22); paint(ctx, 'rgba(255, 245, 170, 0.55)');
        berry(ctx, it.berryType, bx, by, 13);
      }
    }
  }

  // ---------------------------------------------------------------- Machiki

  const FUR = '#a8683a', FUR_D = '#8a5129', FUR_L = '#f2c991', PACK = '#e84a3c', PACK_D = '#b8322a', SCARF = '#3fa9f5';

  function limb(ctx, px, py, ang, len, wid, color, paw) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(ang);
    ctx.beginPath(); ctx.roundRect(-wid / 2, -wid / 2, wid, len + wid / 2, wid / 2);
    paint(ctx, color, LINE, 3.5);
    if (paw) { ellipse(ctx, 0, len - wid * 0.32, wid * 0.36, wid * 0.24); paint(ctx, paw); }
    ctx.restore();
  }

  // pose: { phase, t, rot, lift, legs: run|tuck|stand, arms: run|up|wave|flail, face: normal|happy|oops|dizzy, pack, stars }
  function bear(ctx, x, y, p) {
    ellipse(ctx, x + 6, y + 3, 52 * Math.max(0.4, 1 - p.lift / 300), 9); paint(ctx, 'rgba(0,0,0,0.18)');

    ctx.save();
    ctx.translate(x, y - p.lift);
    ctx.rotate(p.rot);
    const s = Math.sin(p.phase);
    const bob = p.legs === 'run' ? -Math.abs(Math.cos(p.phase)) * 6 : 0;

    let legFar = 0.1, legNear = -0.1;
    if (p.legs === 'run') { legFar = s * 0.75; legNear = -s * 0.75; }
    else if (p.legs === 'tuck') { legFar = -1.1; legNear = -0.7; }

    let armFar = 0.3, armNear = -0.3;
    if (p.arms === 'run') { armFar = -s * 0.9; armNear = s * 0.9; }
    else if (p.arms === 'up') { armFar = 2.5; armNear = -1.45; }
    else if (p.arms === 'wave') { armFar = 2.5; armNear = -1.45 + Math.sin(p.t * 12) * 0.3; }
    else if (p.arms === 'flail') { armFar = 2.2 + Math.sin(p.t * 22) * 0.4; armNear = -1.8 + Math.sin(p.t * 22 + 1) * 0.4; }

    // far side
    limb(ctx, -16, -40 + bob, legFar, 38, 24, FUR_D, '#d9a670');
    limb(ctx, 10, -86 + bob, armFar, 32, 20, FUR_D, '#d9a670');

    // knapsack, with berries peeking out as it fills
    for (let k = 0; k < p.pack; k++) {
      const bx = -76 + (k % 5) * 9, by = -118 + bob - Math.floor(k / 5) * 9 - (k % 2) * 3;
      circle(ctx, bx, by, 6); paint(ctx, ['#4f6fe0', '#ef3b3b', '#f0507f', '#5a2f80', '#e0263a'][k % 5], LINE, 2);
    }
    ctx.beginPath(); ctx.roundRect(-84, -118 + bob, 50, 66, 16); paint(ctx, PACK, LINE);
    ctx.beginPath(); ctx.roundRect(-80, -88 + bob, 34, 26, 9); paint(ctx, PACK_D, LINE, 3);
    circle(ctx, -63, -80 + bob, 4); paint(ctx, '#ffd84a', LINE, 2);

    // body
    ellipse(ctx, 0, -66 + bob, 46, 40, -0.08); paint(ctx, FUR, LINE);
    ellipse(ctx, 18, -58 + bob, 24, 27, -0.1); paint(ctx, FUR_L);
    ctx.strokeStyle = PACK_D; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-36, -104 + bob); ctx.quadraticCurveTo(-6, -96 + bob, 4, -62 + bob); ctx.stroke();

    limb(ctx, 12, -38 + bob, legNear, 38, 25, FUR, '#d9a670');

    // scarf
    const flap = Math.sin(p.t * 14) * 5;
    ctx.beginPath();
    ctx.moveTo(-2, -96 + bob);
    ctx.quadraticCurveTo(-26, -100 + bob + flap, -50, -96 + bob - flap);
    ctx.lineTo(-48, -82 + bob - flap);
    ctx.quadraticCurveTo(-24, -86 + bob + flap, 0, -84 + bob);
    ctx.closePath();
    paint(ctx, SCARF, LINE, 3);
    ctx.beginPath(); ctx.roundRect(-4, -100 + bob, 50, 18, 9); paint(ctx, SCARF, LINE, 3);

    // head
    const hx = 40, hy = -116 + bob;
    circle(ctx, hx - 22, hy - 26, 13); paint(ctx, FUR_D, LINE, 3.5);
    circle(ctx, hx + 10, hy - 32, 13); paint(ctx, FUR, LINE, 3.5);
    circle(ctx, hx + 10, hy - 32, 6.5); paint(ctx, '#f7a8a8');
    circle(ctx, hx, hy, 35); paint(ctx, FUR, LINE);
    ellipse(ctx, hx + 28, hy + 12, 21, 15); paint(ctx, FUR_L, LINE, 3);
    ellipse(ctx, hx + 45, hy + 5, 8.5, 6.5); paint(ctx, '#2a1810');
    circle(ctx, hx + 43, hy + 3, 2.2); paint(ctx, 'rgba(255,255,255,0.8)');
    circle(ctx, hx + 2, hy + 14, 7.5); paint(ctx, 'rgba(255, 120, 140, 0.45)');

    const ex = hx + 15, ey = hy - 6;
    ctx.lineCap = 'round';
    if (p.face === 'happy') {
      ctx.strokeStyle = '#2a1810'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(ex, ey + 3, 6, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx + 18, hy + 22); ctx.quadraticCurveTo(hx + 30, hy + 36, hx + 40, hy + 20); ctx.closePath();
      paint(ctx, '#c0392b', '#2a1810', 3);
    } else if (p.face === 'oops') {
      circle(ctx, ex, ey, 8); paint(ctx, '#fff', '#2a1810', 2.5);
      circle(ctx, ex + 2, ey, 4); paint(ctx, '#2a1810');
      ctx.strokeStyle = '#2a1810'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(ex - 9, ey - 14); ctx.lineTo(ex + 7, ey - 17); ctx.stroke();
      circle(ctx, hx + 30, hy + 26, 5); paint(ctx, '#7a2a20', '#2a1810', 2.5);
    } else if (p.face === 'dizzy') {
      ctx.strokeStyle = '#2a1810'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(ex - 6, ey - 6); ctx.lineTo(ex + 6, ey + 6); ctx.moveTo(ex + 6, ey - 6); ctx.lineTo(ex - 6, ey + 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx + 18, hy + 26);
      for (let k = 1; k <= 4; k++) ctx.lineTo(hx + 18 + k * 5, hy + 26 + (k % 2 ? -4 : 0));
      ctx.stroke();
    } else {
      ellipse(ctx, ex, ey, 5, 6.5); paint(ctx, '#2a1810');
      circle(ctx, ex + 1.5, ey - 2.5, 2); paint(ctx, '#fff');
      ctx.strokeStyle = '#2a1810'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(hx + 30, hy + 18, 8, 0.25 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    }

    limb(ctx, 24, -82 + bob, armNear, 32, 21, FUR, '#d9a670');

    if (p.stars) {
      for (let k = 0; k < 3; k++) {
        const a = p.t * 5 + k * TAU / 3;
        star(ctx, hx + Math.cos(a) * 40, hy - 44 + Math.sin(a) * 11, 10, '#ffd84a', LINE);
      }
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- effects

  function particle(ctx, q) {
    const fade = q.life !== undefined ? Math.min(1, q.life / 0.4) : 1;
    ctx.globalAlpha = fade;
    if (q.berryType) berry(ctx, q.berryType, q.x, q.y, q.r || 11);
    else if (q.kind === 'confetti') {
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot);
      ctx.fillStyle = q.color; ctx.fillRect(-7, -4, 14, 8);
      ctx.restore();
    } else if (q.kind === 'leaf') {
      ellipse(ctx, q.x, q.y, 8, 4.5, q.rot); paint(ctx, '#47ad55', '#1d5a28', 1.5);
    } else if (q.kind === 'spark') {
      star(ctx, q.x, q.y, q.r || 9, '#fff3a0');
    }
    ctx.globalAlpha = 1;
  }

  function floater(ctx, f) {
    ctx.globalAlpha = Math.min(1, f.life / 0.4);
    ctx.font = `700 ${f.size || 40}px Fredoka, 'Chalkboard SE', sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 8;
    ctx.strokeStyle = LINE;
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
    ctx.globalAlpha = 1;
  }

  return {
    background, item, bear, berry, bushSpots, particle, floater,
    util: { circle, ellipse, paint, puffs, star, rnd, pine, cloud, mushroom, tuft, bee, LINE },
  };
})();
