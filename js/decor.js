// The Berry Shop catalog: scenery that fills Machiki's forest, plus new berries and obstacles for
// the path. Each item knows which layer(s) of the scene it lives in and how to draw itself with
// its base at (0, 0) — flying things are drawn around their centre.
const Decor = (() => {
  const { circle, ellipse, paint, puffs, star, rnd, pine, cloud, mushroom, tuft, bee, LINE } = Art.util;
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------------- drawing helpers

  function line(c, color, width, path) {
    c.beginPath();
    path();
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.stroke();
  }
  function rect(c, x, y, w, h, r, fill, stroke = LINE, lw = 3) { c.beginPath(); c.roundRect(x, y, w, h, r); paint(c, fill, stroke, lw); }
  function poly(c, pts, fill, stroke = LINE, lw = 3) {
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    paint(c, fill, stroke, lw);
  }
  const pickColor = (list, r) => list[Math.floor(r * list.length) % list.length];
  const lighter = list => list.map(([x, y, r]) => [x - r * 0.2, y - r * 0.22, r * 0.6]);

  // ---------------------------------------------------------------- plants

  function bloom(c, x, h, petal, center, n, pr, lean = 0) {
    line(c, '#3a8a3a', 3, () => { c.moveTo(x, 0); c.quadraticCurveTo(x + lean * 0.3, -h * 0.5, x + lean, -h); });
    ellipse(c, x + 5, -h * 0.4, 6, 2.5, -0.5); paint(c, '#4fae4a');
    for (let k = 0; k < n; k++) {
      const a = k * TAU / n;
      ellipse(c, x + lean + Math.cos(a) * pr * 1.1, -h + Math.sin(a) * pr * 1.1, pr, pr * 0.6, a);
      paint(c, petal, 'rgba(74,42,23,0.35)', 1);
    }
    circle(c, x + lean, -h, pr * 0.7); paint(c, center);
  }

  function tulip(c, x, h, color) {
    line(c, '#3a8a3a', 3, () => { c.moveTo(x, 0); c.lineTo(x, -h); });
    ellipse(c, x - 5, -h * 0.35, 3, 9, -0.4); paint(c, '#4fae4a');
    c.beginPath();
    c.moveTo(x - 8, -h - 14); c.lineTo(x - 4, -h - 8); c.lineTo(x, -h - 16); c.lineTo(x + 4, -h - 8); c.lineTo(x + 8, -h - 14);
    c.quadraticCurveTo(x + 9, -h + 2, x, -h + 1); c.quadraticCurveTo(x - 9, -h + 2, x - 8, -h - 14);
    paint(c, color, LINE, 2);
  }

  function cloverLeaf(c, x, y, s) {
    line(c, '#3a8a3a', 2, () => { c.moveTo(x, 0); c.lineTo(x, y); });
    for (let k = 0; k < 3; k++) {
      const a = -Math.PI / 2 + k * TAU / 3;
      circle(c, x + Math.cos(a) * 5 * s, y + Math.sin(a) * 5 * s, 5 * s); paint(c, '#4fb84a', '#2f7a2a', 1.2);
    }
  }

  function ladybug(c, x, y) {
    circle(c, x + 4.5, y, 2.6); paint(c, '#222');
    ellipse(c, x, y, 5.5, 4.2); paint(c, '#e8322c', '#222', 1.2);
    line(c, '#222', 1, () => { c.moveTo(x + 0.5, y - 4); c.lineTo(x + 0.5, y + 4); });
    c.fillStyle = '#222';
    for (const [dx, dy] of [[-2.5, -1.5], [2.5, 1.5], [-2, 2]]) { circle(c, x + dx, y + dy, 1); c.fill(); }
  }

  function sunflower(c, x, h) {
    line(c, '#4a9a3a', 4, () => { c.moveTo(x, 0); c.lineTo(x, -h); });
    ellipse(c, x - 9, -h * 0.45, 10, 4.5, 0.5); paint(c, '#5cb84a', '#2f7a2a', 1.5);
    ellipse(c, x + 9, -h * 0.65, 10, 4.5, -0.5); paint(c, '#5cb84a', '#2f7a2a', 1.5);
    for (let k = 0; k < 12; k++) {
      const a = k * TAU / 12;
      ellipse(c, x + Math.cos(a) * 14, -h + Math.sin(a) * 14, 8, 4, a); paint(c, '#ffd23a', '#d99a1a', 1.5);
    }
    circle(c, x, -h, 10); paint(c, '#7a4a1a', LINE, 2);
    c.fillStyle = '#5a3410';
    for (let k = 0; k < 6; k++) { circle(c, x + Math.cos(k) * 5, -h + Math.sin(k * 2) * 5, 1.4); c.fill(); }
  }

  function toadstool(c, x, w, h, color) {
    rect(c, x - w * 0.22, -h * 0.75, w * 0.44, h * 0.75, 4, '#f6e7c8', LINE, 2);
    c.beginPath(); c.ellipse(x, -h * 0.72, w / 2, h * 0.55, 0, Math.PI, TAU); c.closePath(); paint(c, color, LINE, 2);
    ellipse(c, x - w * 0.15, -h * 0.98, w * 0.12, h * 0.08); paint(c, 'rgba(255,255,255,0.45)');
  }

  function pumpkin(c, x, s) {
    c.save(); c.translate(x, 0); c.scale(s, s);
    line(c, '#4a8a2a', 2.5, () => { c.moveTo(0, -26); c.bezierCurveTo(10, -38, 18, -24, 28, -32); });
    ellipse(c, 30, -32, 7, 4, 0.3); paint(c, '#5cb84a', '#2f7a2a', 1.5);
    for (const dx of [-11, 11, 0]) { ellipse(c, dx, -14, 11, 14); paint(c, '#ff9a2e', '#b85a12', 2.5); }
    rect(c, -2.5, -35, 5, 9, 2, '#7a5a2a', LINE, 2);
    c.restore();
  }

  // ---------------------------------------------------------------- trees and places

  const CANOPY = [[0, -130, 52], [-42, -100, 38], [42, -100, 38], [-20, -160, 34], [24, -158, 36]];

  function leafy(c, dark, light, trunk, r, fruit) {
    rect(c, -12, -90, 24, 90, 6, trunk, LINE, 3.5);
    puffs(c, CANOPY, dark, LINE, 3.5);
    puffs(c, lighter(CANOPY), light);
    if (!fruit) return;
    for (let k = 0; k < 6; k++) {
      const fx = (rnd(r * 97 + k) - 0.5) * 100, fy = -95 - rnd(r * 31 + k * 3) * 75;
      fruit(fx, fy);
    }
  }

  function mountains(c, wx) {
    const off = wx * 0.03, sp = 240, base = 425;
    for (let i = Math.floor(off / sp) - 1; i <= Math.floor((off + W) / sp) + 1; i++) {
      const x = i * sp - off + rnd(i * 3.7) * 70, h = 150 + rnd(i * 1.9) * 120, half = 150 + rnd(i) * 60, f = 0.3;
      poly(c, [[x - half, base], [x, base - h], [x + half, base]], i % 2 ? '#a9bfdc' : '#98b1d2', null);
      poly(c, [[x, base - h], [x + half * f, base - h * (1 - f)], [x + half * f * 0.35, base - h * (1 - f * 0.7)],
        [x, base - h * (1 - f)], [x - half * f * 0.35, base - h * (1 - f * 0.7)], [x - half * f, base - h * (1 - f)]], '#ffffff', null);
    }
  }

  function rainbow(c, cx = 420, cy = 450, r0 = 300) {
    c.save();
    c.globalAlpha = 0.55;
    ['#ff6b6b', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#9775fa'].forEach((col, k) => {
      c.beginPath(); c.arc(cx, cy, r0 - k * r0 * 0.055, Math.PI, TAU);
      c.strokeStyle = col; c.lineWidth = r0 * 0.056; c.stroke();
    });
    c.restore();
  }

  // ---------------------------------------------------------------- sky

  function wing(c, x, y, open, col) {
    c.save(); c.translate(x, y); c.scale(1, 0.35 + 0.65 * open);
    poly(c, [[0, 0], [-6, -52], [10, -40], [22, -50], [32, -32], [44, -36], [34, 0]], col, LINE, 2.5);
    c.restore();
  }

  // ---------------------------------------------------------------- critters

  function duck(c, x, s, body, phase, t) {
    c.save(); c.translate(x, 0); c.scale(s, s); c.rotate(Math.sin(t * 6 + phase) * 0.06);
    ellipse(c, -4, -1, 4, 2); paint(c, '#ff9f2e'); ellipse(c, 6, -1, 4, 2); paint(c, '#ff9f2e');
    poly(c, [[-12, -14], [-24, -24], [-14, -22]], body, LINE, 2);
    ellipse(c, 0, -13, 16, 11); paint(c, body, LINE, 2.5);
    ellipse(c, -3, -13, 8, 5, -0.2); paint(c, body, 'rgba(74,42,23,0.5)', 1.5);
    circle(c, 11, -27, 8); paint(c, body, LINE, 2.5);
    ellipse(c, 21, -25, 6, 3); paint(c, '#ff9f2e', LINE, 1.5);
    circle(c, 13, -29, 1.6); paint(c, LINE);
    c.restore();
  }

  function legs(c, xs, top, color) { for (const x of xs) rect(c, x - 3, top, 6, -top, 3, color, LINE, 2); }

  // ---------------------------------------------------------------- the catalog

  // Placement for each scene layer: how far apart the slots are, how fast the layer scrolls compared
  // to the path (parallax), and the band items sit in. `per` is how many of one item show up per
  // screen-width by default (items can override it), so a single purchase stays rare and the layer
  // only gets busy as more different things are bought. `max` caps how full a layer can get.
  const LAYERS = {
    sky: { parallax: 0.06, drift: 8, spacing: 300, y: [80, 220], per: 2, max: 0.7 },
    far: { parallax: 0.22, spacing: 64, y: [478, 488], per: 7, max: 0.6 },
    landmark: { parallax: 0.3, spacing: 650, y: [543, 543], per: 0.35, max: 0.6 },
    mid: { parallax: 0.45, spacing: 200, y: [548, 548], per: 0.9, max: 0.75 },
    path: { parallax: 1, spacing: 140, y: [575, 606], per: 0.8, max: 0.5 },
    near: { parallax: 1, spacing: 58, y: [546, 553], per: 0.9, max: 0.65 },
    front: { parallax: 1, spacing: 52, y: [642, 708], per: 0.9, max: 0.6, scale: 1.12 },
    air: { parallax: 1, spacing: 320, y: [430, 510], per: 0.6, max: 0.5 },
  };

  const CATS = [
    { id: 'plants', label: '🌼 Plants' },
    { id: 'trees', label: '🌳 Trees & places' },
    { id: 'sky', label: '☁️ Sky' },
    { id: 'critters', label: '🐰 Critters' },
    { id: 'path', label: '🛤️ Path' },
  ];

  // box: [left, top, right, bottom] around the item's origin, used to fit it into a shop card.
  const ITEMS = [
    // ---- plants
    { id: 'tufts', cat: 'plants', name: 'Grass tufts', price: 20, layers: ['near', 'front'], per: 1.5, box: [-16, -22, 16, 2],
      draw: c => { tuft(c, -6, 0); tuft(c, 8, 1); } },
    { id: 'pebbles', cat: 'plants', name: 'Path pebbles', price: 20, layers: ['path'], box: [-26, -10, 24, 6],
      draw: c => { for (const [x, y, rx, ry, col] of [[-16, 0, 8, 5, '#c4bcae'], [2, -4, 6, 4, '#a89f91'], [16, 2, 5, 3.5, '#b9a58c']]) { ellipse(c, x, y, rx, ry); paint(c, col, '#7d7466', 1.5); } } },
    { id: 'daisies', cat: 'plants', name: 'Daisies', price: 30, layers: ['near', 'front'], box: [-20, -32, 20, 2],
      draw: c => { bloom(c, -9, 22, '#ffffff', '#ffc93a', 8, 5, -2); bloom(c, 9, 15, '#ffffff', '#ffc93a', 8, 4.5, 2); } },
    { id: 'toadstools', cat: 'plants', name: 'Red toadstools', price: 35, layers: ['near', 'front'], box: [-26, -32, 26, 2],
      draw: c => { mushroom(c, -8, 0); c.save(); c.translate(14, 1); c.scale(0.65, 0.65); mushroom(c, 0, 0); c.restore(); } },
    { id: 'tulips', cat: 'plants', name: 'Tulips', price: 35, layers: ['near', 'front'], box: [-20, -48, 22, 2],
      draw: (c, t, r) => {
        const cols = ['#ef4b4b', '#ff7eb6', '#ffd84a', '#b388ff', '#ff8a3d'];
        tulip(c, -10, 22, pickColor(cols, r)); tulip(c, 2, 30, pickColor(cols, (r * 7) % 1)); tulip(c, 13, 20, pickColor(cols, (r * 13) % 1));
      } },
    { id: 'clover', cat: 'plants', name: 'Clover & ladybugs', price: 45, layers: ['front'], box: [-22, -30, 22, 2],
      draw: (c, t, r) => { cloverLeaf(c, -12, -10, 1); cloverLeaf(c, 0, -16, 1.1); cloverLeaf(c, 12, -9, 0.9); if (r > 0.25) ladybug(c, 1, -22); } },
    { id: 'ferns', cat: 'plants', name: 'Ferns', price: 45, layers: ['near'], box: [-36, -44, 36, 2],
      draw: c => {
        for (const a of [-0.75, -0.25, 0.25, 0.75]) {
          c.save(); c.rotate(a);
          line(c, '#2f7a3a', 2.5, () => { c.moveTo(0, 0); c.quadraticCurveTo(4, -22, 0, -40); });
          for (let j = 1; j < 8; j++) {
            const y = -j * 5, L = 11 - j;
            ellipse(c, -L * 0.55, y, L * 0.6, 2.4, 0.4); paint(c, '#3f9a4a');
            ellipse(c, L * 0.55 + 1, y, L * 0.6, 2.4, -0.4); paint(c, '#3f9a4a');
          }
          c.restore();
        }
      } },
    { id: 'mossyrock', cat: 'plants', name: 'Mossy rocks', price: 45, layers: ['near', 'front'], box: [-30, -42, 30, 2],
      draw: c => {
        c.beginPath(); c.moveTo(-26, 0); c.bezierCurveTo(-30, -22, -12, -34, 4, -32); c.bezierCurveTo(22, -30, 30, -16, 26, 0); c.closePath();
        paint(c, '#a3acb6', LINE, 3);
        ellipse(c, -8, -22, 8, 4, -0.4); paint(c, '#c7cfd7');
        puffs(c, [[-6, -30, 7], [6, -32, 8], [16, -26, 6]], '#6cbf4a');
      } },
    { id: 'lavender', cat: 'plants', name: 'Lavender', price: 55, layers: ['near', 'front'], box: [-16, -40, 22, 2],
      draw: c => {
        for (const [dx, h, lean] of [[-10, 30, -5], [-3, 36, -1], [4, 33, 3], [11, 27, 6]]) {
          line(c, '#5a9a4a', 2, () => { c.moveTo(dx, 0); c.lineTo(dx + lean, -h); });
          for (let j = 0; j < 5; j++) { ellipse(c, dx + lean + (j % 2 ? 2 : -2), -h + j * 3.2, 2.8, 2.2); paint(c, j % 2 ? '#9b7bd8' : '#8460c8'); }
        }
      } },
    { id: 'mushfam', cat: 'plants', name: 'Mushroom family', price: 65, layers: ['front'], box: [-30, -34, 34, 2],
      draw: c => { toadstool(c, -12, 30, 30, '#b9773f'); toadstool(c, 10, 22, 22, '#c98a4f'); toadstool(c, 24, 14, 14, '#a8682f'); } },
    { id: 'sunflowers', cat: 'plants', name: 'Sunflowers', price: 75, layers: ['near'], box: [-30, -96, 32, 2],
      draw: c => { sunflower(c, -12, 64); sunflower(c, 12, 80); } },
    { id: 'signpost', cat: 'plants', name: 'Signpost', price: 80, layers: ['near'], per: 0.4, box: [-40, -74, 38, 2],
      draw: c => {
        rect(c, -4, -70, 8, 70, 2, '#a8683a', LINE, 2.5);
        poly(c, [[-30, -66], [22, -66], [34, -56], [22, -46], [-30, -46]], '#e8b878', LINE, 2.5);
        poly(c, [[-22, -40], [18, -40], [18, -26], [-22, -26], [-32, -33]], '#d9a464', LINE, 2.5);
        c.font = '700 11px Fredoka, sans-serif'; c.fillStyle = LINE; c.textAlign = 'center';
        c.fillText('BERRIES', -3, -52);
        c.font = '700 10px Fredoka, sans-serif'; c.fillText('HOME', -4, -29);
      } },
    { id: 'pumpkins', cat: 'plants', name: 'Pumpkins', price: 100, layers: ['near', 'front'], per: 0.6, box: [-28, -40, 40, 2],
      draw: c => { pumpkin(c, -12, 1); pumpkin(c, 18, 0.7); } },
    { id: 'fence', cat: 'plants', name: 'Wooden fence', price: 90, layers: ['near'], per: 0.4, box: [-56, -54, 56, 2],
      draw: c => {
        rect(c, -54, -38, 108, 7, 3, '#c8925a', LINE, 2.5);
        rect(c, -54, -20, 108, 7, 3, '#c8925a', LINE, 2.5);
        for (const x of [-46, 0, 46]) poly(c, [[x - 6, 0], [x - 6, -44], [x, -52], [x + 6, -44], [x + 6, 0]], '#d9a464', LINE, 2.5);
      } },
    { id: 'pond', cat: 'plants', name: 'Lily pond', price: 140, layers: ['front'], per: 0.35, box: [-54, -42, 54, 10],
      draw: c => {
        ellipse(c, 0, -5, 50, 13); paint(c, '#62bde8', '#3a87b8', 3);
        ellipse(c, -14, -8, 16, 3); paint(c, 'rgba(255,255,255,0.5)');
        for (const [x, y, r] of [[12, -6, 8], [30, -3, 6]]) {
          c.beginPath(); c.moveTo(x, y); c.arc(x, y, r, 0.3, TAU - 0.2); c.closePath(); paint(c, '#4fae4a', '#2f7a2a', 1.5);
        }
        for (let k = 0; k < 5; k++) { const a = k * TAU / 5; circle(c, 12 + Math.cos(a) * 3, -9 + Math.sin(a) * 3, 2.6); paint(c, '#ff9ec7'); }
        circle(c, 12, -9, 1.8); paint(c, '#ffd84a');
        for (const [x, h] of [[-46, 30], [-40, 38], [-33, 26]]) {
          line(c, '#4a8a3a', 2.5, () => { c.moveTo(x, -4); c.lineTo(x, -h); });
          ellipse(c, x, -h + 4, 3, 7); paint(c, '#8a5a2a');
        }
      } },

    // ---- trees and places
    { id: 'farpines', cat: 'trees', name: 'Distant pine forest', price: 60, layers: ['far'], scale: [0.6, 0.9], box: [-50, -150, 50, 2],
      draw: c => pine(c, 0, 0, 1, '#7fc48c') },
    { id: 'oak', cat: 'trees', name: 'Oak trees', price: 90, layers: ['mid'], scale: [0.8, 1.1], box: [-86, -196, 86, 2],
      draw: (c, t, r) => leafy(c, '#3f9a4f', '#5cbd62', '#8b5a35') },
    { id: 'pine', cat: 'trees', name: 'Tall pines', price: 100, layers: ['mid'], scale: [1.05, 1.35], box: [-50, -150, 50, 2],
      draw: c => pine(c, 0, 0, 1, '#3f9654', LINE) },
    { id: 'birch', cat: 'trees', name: 'Birch trees', price: 120, layers: ['mid'], scale: [0.85, 1.1], box: [-56, -210, 56, 2],
      draw: c => {
        rect(c, -9, -120, 18, 120, 5, '#f4f1ea', LINE, 3);
        c.fillStyle = '#3a3a3a';
        for (const [y, w, side] of [[-30, 8, -1], [-55, 6, 1], [-80, 9, -1], [-100, 5, 1], [-14, 5, 1]]) c.fillRect(side < 0 ? -9 : 9 - w, y, w, 3);
        const list = [[0, -150, 32], [-20, -126, 27], [20, -128, 27], [0, -182, 25], [-12, -104, 20], [14, -106, 20]];
        puffs(c, list, '#8cc63f', LINE, 3);
        puffs(c, lighter(list), '#b5df6a');
      } },
    { id: 'apple', cat: 'trees', name: 'Apple trees', price: 150, layers: ['mid'], scale: [0.8, 1.05], box: [-86, -196, 86, 2],
      draw: (c, t, r) => leafy(c, '#3a8f4a', '#56b45e', '#8b5a35', r, (x, y) => {
        circle(c, x, y, 7); paint(c, '#ef3b3b', LINE, 2);
        ellipse(c, x + 3, y - 7, 3, 1.6, -0.5); paint(c, '#5cc04a');
      }) },
    { id: 'autumn', cat: 'trees', name: 'Autumn maples', price: 150, layers: ['mid'], scale: [0.8, 1.05], box: [-86, -196, 86, 2],
      draw: (c, t, r) => (r > 0.5 ? leafy(c, '#e8742c', '#ffa94d', '#7a4a2a') : leafy(c, '#d9452b', '#f0713f', '#7a4a2a')) },
    { id: 'blossom', cat: 'trees', name: 'Cherry blossoms', price: 200, layers: ['mid'], scale: [0.8, 1.05], box: [-86, -196, 86, 2],
      draw: (c, t, r) => leafy(c, '#f49ac1', '#ffc6de', '#6e4234', r, (x, y) => {
        for (let k = 0; k < 5; k++) { const a = k * TAU / 5; circle(c, x + Math.cos(a) * 3.5, y + Math.sin(a) * 3.5, 3); paint(c, '#fff'); }
        circle(c, x, y, 2); paint(c, '#ff7eb6');
      }) },
    { id: 'mountains', cat: 'trees', name: 'Snowy mountains', price: 350, layers: ['backdrop'], box: [-110, -130, 110, 2],
      scene: (c, wx) => mountains(c, wx),
      draw: c => {
        poly(c, [[-110, 0], [-40, -110], [30, 0]], '#98b1d2', null);
        poly(c, [[-40, -110], [-19, -77], [-32, -85], [-40, -77], [-48, -85], [-61, -77]], '#fff', null);
        poly(c, [[-20, 0], [50, -130], [110, 0]], '#a9bfdc', null);
        poly(c, [[50, -130], [68, -91], [56, -101], [50, -91], [44, -101], [32, -91]], '#fff', null);
      } },
    { id: 'mushhouse', cat: 'trees', name: 'Mushroom house', price: 400, layers: ['mid'], per: 0.3, box: [-70, -126, 70, 2],
      draw: c => {
        rect(c, -28, -72, 56, 72, 16, '#f6e7c8', LINE, 3);
        rect(c, -11, -40, 22, 40, [11, 11, 0, 0], '#9a6236', LINE, 2.5);
        circle(c, 6, -20, 2); paint(c, '#ffd84a');
        circle(c, 15, -55, 7); paint(c, '#bfe9ff', LINE, 2.5);
        c.beginPath(); c.ellipse(0, -70, 66, 52, 0, Math.PI, TAU); c.closePath(); paint(c, '#e8453c', LINE, 3.5);
        for (const [x, y, r] of [[-34, -92, 9], [0, -108, 11], [32, -90, 8], [-12, -80, 6], [48, -77, 5], [-50, -77, 5]]) { circle(c, x, y, r); paint(c, '#fff'); }
      } },
    { id: 'cabin', cat: 'trees', name: 'Log cabin', price: 500, layers: ['landmark'], scale: [0.8, 0.8], box: [-106, -200, 106, 2],
      draw: (c, t) => {
        rect(c, 38, -150, 18, 44, 2, '#b0a69a', LINE, 3);
        for (let k = 0; k < 6; k++) rect(c, -86, -84 + k * 14, 172, 14, 7, k % 2 ? '#a8683a' : '#b97a46', LINE, 2);
        poly(c, [[-104, -80], [0, -146], [104, -80]], '#8b3a2a', LINE, 3.5);
        rect(c, -16, -50, 32, 50, [6, 6, 0, 0], '#7a4524', LINE, 3);
        circle(c, 8, -24, 2.5); paint(c, '#ffd84a');
        for (const x of [-56, 56]) {
          rect(c, x - 16, -64, 32, 26, 3, '#ffe08a', LINE, 3);
          line(c, LINE, 2, () => { c.moveTo(x, -64); c.lineTo(x, -38); c.moveTo(x - 16, -51); c.lineTo(x + 16, -51); });
          rect(c, x - 19, -38, 38, 8, 3, '#8b5a35', LINE, 2);
          for (let k = 0; k < 3; k++) { circle(c, x - 10 + k * 10, -41, 4); paint(c, ['#ff7eb6', '#ffd84a', '#ef4b4b'][k]); }
        }
        for (let k = 0; k < 3; k++) {
          const p = (t * 0.35 + k / 3) % 1;
          circle(c, 47 + p * 24, -160 - p * 46, 7 + p * 9); paint(c, `rgba(255,255,255,${0.75 * (1 - p)})`);
        }
      } },
    { id: 'windmill', cat: 'trees', name: 'Windmill', price: 600, layers: ['landmark'], scale: [0.85, 0.85], box: [-104, -256, 104, 2],
      draw: (c, t) => {
        poly(c, [[-36, 0], [36, 0], [22, -150], [-22, -150]], '#f2e2c4', LINE, 3);
        poly(c, [[-30, -148], [0, -188], [30, -148]], '#c0503a', LINE, 3);
        rect(c, -11, -36, 22, 36, [11, 11, 0, 0], '#8b5a35', LINE, 2.5);
        circle(c, 0, -100, 8); paint(c, '#bfe9ff', LINE, 2.5);
        c.save(); c.translate(0, -152); c.rotate(t * 0.9);
        for (let k = 0; k < 4; k++) {
          c.rotate(Math.PI / 2);
          rect(c, -9, -100, 18, 86, 3, 'rgba(255,255,255,0.92)', '#8b5a35', 3);
          line(c, '#8b5a35', 1.5, () => { for (let j = 1; j < 5; j++) { c.moveTo(-9, -14 - j * 17); c.lineTo(9, -14 - j * 17); } c.moveTo(0, -14); c.lineTo(0, -100); });
        }
        circle(c, 0, 0, 8); paint(c, '#8b5a35', LINE, 2.5);
        c.restore();
      } },
    { id: 'treehouse', cat: 'trees', name: 'Treehouse', price: 750, layers: ['landmark'], scale: [0.8, 0.8], box: [-110, -326, 110, 2],
      draw: c => {
        rect(c, -18, -210, 36, 210, 8, '#8b5a35', LINE, 3.5);
        const list = [[0, -250, 62], [-58, -214, 44], [58, -214, 44], [-30, -290, 42], [34, -286, 44]];
        puffs(c, list, '#3f9a4f', LINE, 3.5);
        puffs(c, lighter(list), '#5cbd62');
        rect(c, -64, -142, 128, 10, 3, '#a8683a', LINE, 3);
        rect(c, -44, -196, 88, 54, 4, '#e8b878', LINE, 3);
        poly(c, [[-56, -192], [0, -230], [56, -192]], '#c0503a', LINE, 3);
        rect(c, -12, -184, 24, 22, 3, '#ffe08a', LINE, 2.5);
        line(c, '#c8a060', 2.5, () => {
          c.moveTo(30, -132); c.lineTo(30, -8); c.moveTo(46, -132); c.lineTo(46, -8);
          for (let y = -120; y < -8; y += 16) { c.moveTo(30, y); c.lineTo(46, y); }
        });
      } },
    { id: 'castle', cat: 'trees', name: 'Castle', price: 1000, layers: ['landmark'], scale: [0.75, 0.75], box: [-130, -236, 130, 2],
      draw: (c, t) => {
        const wall = '#d9d2e8', dark = '#5a5470';
        for (let x = -80; x < 76; x += 16) rect(c, x, -110, 10, 14, 1, wall, dark, 2.5);
        rect(c, -82, -98, 164, 98, 2, wall, dark, 3);
        rect(c, -20, -58, 40, 58, [20, 20, 0, 0], '#8b5a35', dark, 3);
        line(c, '#5a3a20', 2, () => { for (const x of [-8, 4]) { c.moveTo(x, -50); c.lineTo(x, 0); } });
        for (const x of [-50, 50]) rect(c, x - 7, -78, 14, 20, [7, 7, 0, 0], '#4a4466', null);
        for (const x of [-100, 100]) {
          rect(c, x - 24, -160, 48, 160, 2, wall, dark, 3);
          poly(c, [[x - 30, -158], [x, -212], [x + 30, -158]], x < 0 ? '#7e6ad6' : '#ef6b8a', dark, 3);
          line(c, dark, 2, () => { c.moveTo(x, -212); c.lineTo(x, -236); });
          const wave = Math.sin(t * 4 + x) * 3;
          poly(c, [[x, -236], [x + 22, -230 + wave], [x, -222]], '#ffd84a', dark, 1.5);
          rect(c, x - 7, -122, 14, 22, [7, 7, 0, 0], '#4a4466', null);
        }
      } },

    // ---- sky
    { id: 'clouds', cat: 'sky', name: 'Fluffy clouds', price: 25, layers: ['sky'], per: 2, scale: [0.7, 1.3], box: [-80, -60, 90, 40],
      draw: c => cloud(c, -45, 0, 1) },
    { id: 'butterflies', cat: 'sky', name: 'Butterflies', price: 60, layers: ['air'], box: [-30, -24, 30, 20],
      draw: (c, t, r) => {
        const x = Math.sin(t * 1.3 + r * 9) * 22, y = Math.sin(t * 2.1 + r * 5) * 14;
        const flap = 0.25 + Math.abs(Math.sin(t * 11 + r * 20)) * 0.75;
        const col = pickColor(['#ff7eb6', '#ffd84a', '#7ec8ff', '#b388ff', '#ff9f43'], r);
        c.save(); c.translate(x, y); c.scale(flap, 1);
        for (const s of [-1, 1]) {
          ellipse(c, s * 8, -6, 9, 7, s * 0.4); paint(c, col, LINE, 1.5);
          ellipse(c, s * 6, 5, 6, 5, -s * 0.4); paint(c, col, LINE, 1.5);
        }
        c.restore();
        ellipse(c, x, y, 2.2, 9); paint(c, LINE);
        line(c, LINE, 1.2, () => { c.moveTo(x, y - 8); c.lineTo(x - 4, y - 14); c.moveTo(x, y - 8); c.lineTo(x + 4, y - 14); });
      } },
    { id: 'bees', cat: 'sky', name: 'Bumblebees', price: 70, layers: ['air'], box: [-34, -30, 50, 14],
      draw: (c, t, r) => { for (let k = 0; k < 2; k++) bee(c, Math.sin(t * 3 + r * 7 + k * 2) * 26 + k * 20, Math.sin(t * 7 + k) * 6 - k * 14, t); } },
    { id: 'birds', cat: 'sky', name: 'Birds', price: 70, fly: { speed: 80, y: 110, gap: 25, bob: 8 }, box: [-16, -34, 76, 20],
      draw: (c, t) => {
        for (const [dx, dy] of [[0, 0], [30, -14], [30, 14], [60, -26]]) {
          const f = Math.sin(t * 9 + dx) * 6;
          line(c, '#3b3b5a', 3, () => { c.moveTo(dx - 12, dy); c.quadraticCurveTo(dx - 6, dy - 8 + f, dx, dy); c.quadraticCurveTo(dx + 6, dy - 8 + f, dx + 12, dy); });
        }
      } },
    { id: 'kite', cat: 'sky', name: 'Kite', price: 150, fly: { speed: 40, y: 170, gap: 45, bob: 12 }, box: [-34, -44, 50, 120],
      draw: (c, t) => {
        line(c, 'rgba(74,42,23,0.45)', 1.5, () => { c.moveTo(0, 34); c.quadraticCurveTo(-120, 200, -260, 430); });
        const tail = k => [Math.sin(t * 4 + k) * 10 + k * 3, 34 + k * 14];
        line(c, LINE, 2, () => { c.moveTo(0, 34); for (let k = 1; k <= 6; k++) c.lineTo(...tail(k)); });
        for (let k = 2; k <= 6; k += 2) {
          const [bx, by] = tail(k);
          poly(c, [[bx - 7, by - 4], [bx, by], [bx - 7, by + 4]], '#ffd84a', LINE, 1.5);
          poly(c, [[bx + 7, by - 4], [bx, by], [bx + 7, by + 4]], '#ffd84a', LINE, 1.5);
        }
        poly(c, [[0, -40], [28, 0], [0, 36], [-28, 0]], '#ef4b4b', LINE, 3);
        poly(c, [[0, -40], [28, 0], [0, 0]], '#ffd84a', null);
        poly(c, [[0, 36], [-28, 0], [0, 0]], '#ffd84a', null);
        line(c, LINE, 2, () => { c.moveTo(0, -40); c.lineTo(0, 36); c.moveTo(-28, 0); c.lineTo(28, 0); });
        poly(c, [[0, -40], [28, 0], [0, 36], [-28, 0]], null, LINE, 3);
      } },
    { id: 'balloon', cat: 'sky', name: 'Hot-air balloon', price: 250, fly: { speed: 28, y: 150, gap: 50, bob: 8 }, box: [-62, -66, 62, 84],
      draw: c => {
        line(c, LINE, 1.5, () => { c.moveTo(-26, 30); c.lineTo(-12, 62); c.moveTo(26, 30); c.lineTo(12, 62); });
        rect(c, -14, 60, 28, 20, 4, '#b97a46', LINE, 2.5);
        const lobe = (w, col, lw) => { c.beginPath(); c.moveTo(0, 46); c.bezierCurveTo(-w, 10, -w * 0.95, -62, 0, -62); c.bezierCurveTo(w * 0.95, -62, w, 10, 0, 46); paint(c, col, LINE, lw); };
        lobe(60, '#ef4b4b', 3); lobe(30, '#ffd84a', 2); lobe(8, '#3fa9f5', 2);
        ellipse(c, -30, -26, 6, 12, 0.3); paint(c, 'rgba(255,255,255,0.4)');
      } },
    { id: 'airplane', cat: 'sky', name: 'Airplane', price: 350, fly: { speed: 120, y: 95, gap: 45, bob: 4 }, box: [-54, -26, 230, 20],
      draw: (c, t) => {
        const wave = k => Math.sin(t * 6 + k) * 3;
        line(c, LINE, 1.5, () => { c.moveTo(46, 0); c.lineTo(80, 0); });
        c.beginPath(); c.moveTo(80, -14 + wave(0));
        for (let k = 1; k <= 4; k++) c.lineTo(80 + k * 36, -14 + wave(k));
        for (let k = 4; k >= 0; k--) c.lineTo(80 + k * 36, 14 + wave(k));
        c.closePath(); paint(c, '#fff8e0', LINE, 2.5);
        c.font = '700 15px Fredoka, sans-serif'; c.fillStyle = '#e8453c'; c.textAlign = 'center';
        c.fillText('GO MACHIKI!', 152, 5 + wave(2));
        poly(c, [[28, -6], [44, -24], [50, -24], [46, 2]], '#ef4b4b', LINE, 2.5);
        rect(c, -44, -12, 92, 22, 11, '#ffffff', LINE, 3);
        ellipse(c, 4, 4, 26, 6); paint(c, '#ef4b4b', LINE, 2.5);
        for (const x of [-24, -10, 4, 18]) { circle(c, x, -3, 3.5); paint(c, '#bfe9ff', LINE, 1.5); }
        ellipse(c, -49, -1, 3, 16 * Math.abs(Math.sin(t * 30)) + 2); paint(c, 'rgba(74,42,23,0.55)');
        circle(c, -46, -1, 3.5); paint(c, '#ffd84a', LINE, 1.5);
      } },
    { id: 'rainbow', cat: 'sky', name: 'Rainbow', price: 600, layers: ['backdrop'], box: [-80, -84, 80, 2],
      scene: c => rainbow(c),
      draw: c => rainbow(c, 0, 0, 80) },
    { id: 'ufo', cat: 'sky', name: 'Flying saucer', price: 700, fly: { speed: 90, y: 120, gap: 60, bob: 12 }, box: [-60, -40, 60, 20],
      draw: (c, t) => {
        c.save(); c.rotate(Math.sin(t * 2) * 0.08);
        circle(c, 0, -14, 9); paint(c, '#7ed957', LINE, 2);
        line(c, LINE, 1.5, () => { c.moveTo(-4, -22); c.lineTo(-7, -30); c.moveTo(4, -22); c.lineTo(7, -30); });
        circle(c, -7, -31, 2); paint(c, '#ffd84a'); circle(c, 7, -31, 2); paint(c, '#ffd84a');
        ellipse(c, -3, -15, 2, 3); paint(c, LINE); ellipse(c, 3, -15, 2, 3); paint(c, LINE);
        c.beginPath(); c.ellipse(0, -6, 24, 26, 0, Math.PI, TAU); c.closePath(); paint(c, 'rgba(190, 235, 255, 0.55)', LINE, 2.5);
        ellipse(c, 0, -2, 56, 14); paint(c, '#b8c2cc', LINE, 3);
        ellipse(c, 0, -6, 40, 5); paint(c, '#dde4ea');
        for (let k = 0; k < 5; k++) { circle(c, -36 + k * 18, 3, 4); paint(c, Math.floor(t * 4 + k) % 2 ? '#ffd84a' : '#ff7eb6', LINE, 1.5); }
        c.restore();
      } },
    { id: 'dragon', cat: 'sky', name: 'Friendly dragon', price: 1000, fly: { speed: 100, y: 165, gap: 60, bob: 14 }, box: [-80, -76, 110, 30],
      draw: (c, t) => {
        const open = Math.sin(t * 5) * 0.5 + 0.5;
        wing(c, 6, -12, open, '#3f9a4f');
        const tx = 96, ty = -6 + Math.sin(t * 3 + 1) * 10;
        line(c, LINE, 15, () => { c.moveTo(30, 0); c.quadraticCurveTo(70, 12 + Math.sin(t * 3) * 8, tx, ty); });
        line(c, '#5cc06a', 10, () => { c.moveTo(30, 0); c.quadraticCurveTo(70, 12 + Math.sin(t * 3) * 8, tx, ty); });
        poly(c, [[tx - 2, ty], [tx + 12, ty - 10], [tx + 10, ty + 2], [tx + 12, ty + 12]], '#ff9f2e', LINE, 2);
        for (let k = 0; k < 4; k++) poly(c, [[-14 + k * 12, -18], [-8 + k * 12, -30], [-2 + k * 12, -18]], '#ff9f2e', LINE, 2);
        ellipse(c, 10, 0, 40, 20, -0.1); paint(c, '#5cc06a', LINE, 3);
        ellipse(c, 4, 8, 26, 8, -0.1); paint(c, '#d9f2a0');
        for (const x of [-10, 18]) rect(c, x - 4, 12, 8, 14, 4, '#5cc06a', LINE, 2);
        ellipse(c, -32, -16, 14, 12, -0.4); paint(c, '#5cc06a', LINE, 3);
        poly(c, [[-56, -44], [-60, -58], [-50, -46]], '#fff3dc', LINE, 2);
        poly(c, [[-44, -44], [-44, -58], [-38, -45]], '#fff3dc', LINE, 2);
        ellipse(c, -52, -30, 20, 15); paint(c, '#5cc06a', LINE, 3);
        ellipse(c, -70, -25, 12, 9); paint(c, '#7ed48a', LINE, 2.5);
        circle(c, -76, -28, 1.6); paint(c, LINE);
        circle(c, -52, -35, 5); paint(c, '#fff', LINE, 2); circle(c, -54, -35, 2.6); paint(c, LINE);
        line(c, LINE, 2, () => c.arc(-66, -24, 6, 0.3 * Math.PI, 0.8 * Math.PI));
        circle(c, -46, -24, 4); paint(c, 'rgba(255,140,160,0.5)');
        wing(c, -2, -14, open, '#6fd07c');
      } },

    // ---- critters
    { id: 'snail', cat: 'critters', name: 'Snails', price: 50, layers: ['front'], per: 0.5, flip: true, box: [-24, -30, 28, 2],
      draw: (c, t, r) => {
        rect(c, -20, -8, 40, 8, 4, '#f2d39a', LINE, 2);
        circle(c, 16, -10, 6); paint(c, '#f2d39a', LINE, 2);
        const wig = Math.sin(t * 2 + r * 10) * 2;
        line(c, LINE, 1.5, () => { c.moveTo(15, -15); c.lineTo(13 + wig, -24); c.moveTo(19, -15); c.lineTo(21 + wig, -24); });
        circle(c, 13 + wig, -24, 1.8); paint(c, LINE); circle(c, 21 + wig, -24, 1.8); paint(c, LINE);
        circle(c, -4, -16, 12); paint(c, '#e8a04a', LINE, 2.5);
        line(c, '#b86a1a', 2, () => { for (let a = 0; a < TAU * 2; a += 0.3) { const rr = 10 - a * 0.75; c.lineTo(-4 + Math.cos(a) * rr, -16 + Math.sin(a) * rr); } });
      } },
    { id: 'frog', cat: 'critters', name: 'Frogs', price: 90, layers: ['front'], per: 0.4, box: [-22, -36, 22, 2],
      draw: (c, t, r) => {
        c.translate(0, -Math.pow(Math.max(0, Math.sin(t * 2.2 + r * 30)), 12) * 16);
        ellipse(c, -12, -2, 9, 5); paint(c, '#5ab03a', LINE, 2);
        ellipse(c, 12, -2, 9, 5); paint(c, '#5ab03a', LINE, 2);
        ellipse(c, 0, -12, 18, 13); paint(c, '#6cc24a', LINE, 2.5);
        ellipse(c, 0, -8, 11, 7); paint(c, '#d9f2a0');
        for (const ex of [-8, 8]) {
          circle(c, ex, -25, 6.5); paint(c, '#6cc24a', LINE, 2.5);
          circle(c, ex, -25, 4); paint(c, '#fff');
          circle(c, ex + 1, -25, 2.2); paint(c, LINE);
        }
        line(c, LINE, 2, () => c.arc(0, -17, 6, 0.2 * Math.PI, 0.8 * Math.PI));
      } },
    { id: 'turtle', cat: 'critters', name: 'Turtles', price: 100, layers: ['front'], per: 0.4, flip: true, box: [-24, -24, 30, 2],
      draw: (c, t, r) => {
        const peek = Math.sin(t * 1.2 + r * 10) > -0.4 ? 0 : 6;
        for (const x of [-12, 10]) { ellipse(c, x, -2, 6, 4); paint(c, '#8fcf6a', LINE, 2); }
        circle(c, 22 - peek, -8, 6.5); paint(c, '#8fcf6a', LINE, 2);
        circle(c, 24 - peek, -10, 1.5); paint(c, LINE);
        c.beginPath(); c.ellipse(0, -4, 20, 17, 0, Math.PI, TAU); c.closePath(); paint(c, '#5a9a4a', LINE, 2.5);
        poly(c, [[-6, -16], [6, -16], [10, -9], [-10, -9]], '#7ab865', '#3f7a35', 1.5);
        line(c, '#3f7a35', 1.5, () => { c.moveTo(-10, -9); c.lineTo(-16, -5); c.moveTo(10, -9); c.lineTo(16, -5); c.moveTo(-6, -16); c.lineTo(-10, -19); c.moveTo(6, -16); c.lineTo(10, -19); });
        rect(c, -21, -6, 42, 5, 2, '#3f7a35', LINE, 2);
      } },
    { id: 'hedgehog', cat: 'critters', name: 'Hedgehogs', price: 100, layers: ['near'], per: 0.4, flip: true, box: [-32, -36, 32, 2],
      draw: c => {
        c.fillStyle = '#5a3c22';
        for (let k = 0; k <= 12; k++) {
          const a = Math.PI + k * Math.PI / 12, cx = -4 + Math.cos(a) * 20, cy = -12 + Math.sin(a) * 15;
          c.beginPath();
          c.moveTo(cx + Math.cos(a - 1.2) * 5, cy + Math.sin(a - 1.2) * 5);
          c.lineTo(-4 + Math.cos(a) * 30, -12 + Math.sin(a) * 23);
          c.lineTo(cx + Math.cos(a + 1.2) * 5, cy + Math.sin(a + 1.2) * 5);
          c.fill();
        }
        ellipse(c, -4, -12, 22, 15); paint(c, '#8a6240', LINE, 2.5);
        ellipse(c, -10, -1, 4, 2.5); paint(c, '#3a2a20'); ellipse(c, 8, -1, 4, 2.5); paint(c, '#3a2a20');
        ellipse(c, 15, -9, 11, 8, 0.2); paint(c, '#e8c9a0', LINE, 2);
        circle(c, 26, -7, 2.6); paint(c, '#2a1810');
        circle(c, 16, -12, 2); paint(c, '#2a1810');
      } },
    { id: 'bunny', cat: 'critters', name: 'Bunnies', price: 120, layers: ['near'], per: 0.4, flip: true, box: [-24, -56, 28, 2],
      draw: (c, t, r) => {
        const fur = r > 0.5 ? '#f4f1ea' : '#c9a27a';
        const hop = Math.abs(Math.sin(t * 3 + r * 10));
        c.translate(0, -(hop > 0.75 ? (hop - 0.75) * 56 : 0));
        circle(c, -17, -12, 6); paint(c, '#fff', LINE, 2);
        ellipse(c, -2, -13, 17, 13); paint(c, fur, LINE, 2.5);
        ellipse(c, 8, -1, 8, 4); paint(c, fur, LINE, 2);
        for (const [ex, a] of [[9, -0.3], [16, 0.15]]) {
          ellipse(c, ex, -40, 5, 14, a); paint(c, fur, LINE, 2.5);
          ellipse(c, ex, -40, 2.5, 9, a); paint(c, '#f7a8b8');
        }
        circle(c, 14, -24, 10); paint(c, fur, LINE, 2.5);
        circle(c, 17, -26, 2); paint(c, LINE);
        circle(c, 23.5, -22, 2); paint(c, '#ff8fa8');
        circle(c, 12, -20, 3); paint(c, 'rgba(255,140,160,0.4)');
      } },
    { id: 'squirrel', cat: 'critters', name: 'Squirrels', price: 120, layers: ['near'], per: 0.4, flip: true, box: [-34, -60, 24, 2],
      draw: (c, t, r) => {
        c.save(); c.translate(-12, -10); c.rotate(Math.sin(t * 2 + r * 10) * 0.08);
        const tail = [[0, 0, 11], [-5, -16, 13], [1, -32, 12], [10, -40, 9]];
        puffs(c, tail, '#c8692a', LINE, 2.5);
        puffs(c, lighter(tail), '#e08a4a');
        c.restore();
        ellipse(c, 2, -14, 11, 14); paint(c, '#c8692a', LINE, 2.5);
        ellipse(c, 6, -11, 6, 9); paint(c, '#f2c991');
        poly(c, [[3, -37], [5, -47], [10, -38]], '#c8692a', LINE, 2);
        circle(c, 8, -30, 9); paint(c, '#c8692a', LINE, 2.5);
        circle(c, 11, -32, 1.8); paint(c, LINE);
        circle(c, 16.5, -29, 1.8); paint(c, LINE);
        ellipse(c, 13, -16, 4, 5); paint(c, '#b0753a', LINE, 1.5);
        ellipse(c, 13, -20.5, 5, 2.5); paint(c, '#6e4224', LINE, 1.5);
      } },
    { id: 'ducks', cat: 'critters', name: 'Duck family', price: 150, layers: ['front'], per: 0.35, flip: true, box: [-44, -36, 34, 2],
      draw: (c, t) => { duck(c, -36, 0.55, '#ffe066', 2, t); duck(c, -16, 0.55, '#ffe066', 1, t); duck(c, 12, 1, '#ffffff', 0, t); } },
    { id: 'owl', cat: 'critters', name: 'Owls', price: 180, layers: ['near'], per: 0.3, box: [-20, -76, 20, 2],
      draw: (c, t, r) => {
        rect(c, -16, -22, 32, 22, 4, '#8b5a35', LINE, 2.5);
        ellipse(c, 0, -22, 16, 5); paint(c, '#ecc58e', LINE, 2);
        poly(c, [[-13, -60], [-11, -74], [-4, -64]], '#9a7250', LINE, 2);
        poly(c, [[13, -60], [11, -74], [4, -64]], '#9a7250', LINE, 2);
        ellipse(c, -14, -42, 5, 12, 0.2); paint(c, '#7a5a3a', LINE, 2);
        ellipse(c, 14, -42, 5, 12, -0.2); paint(c, '#7a5a3a', LINE, 2);
        ellipse(c, 0, -46, 16, 22); paint(c, '#9a7250', LINE, 2.5);
        ellipse(c, 0, -38, 10, 13); paint(c, '#e8d4b0');
        const blink = (t * 0.7 + r * 5) % 4 < 0.15;
        for (const ex of [-7, 7]) {
          circle(c, ex, -54, 7); paint(c, '#fff', LINE, 2);
          if (blink) line(c, LINE, 2, () => { c.moveTo(ex - 5, -54); c.lineTo(ex + 5, -54); });
          else { circle(c, ex, -54, 4); paint(c, '#ffb020'); circle(c, ex, -54, 2.2); paint(c, LINE); }
        }
        poly(c, [[-3, -48], [3, -48], [0, -42]], '#ffb020', LINE, 1.5);
      } },
    { id: 'fox', cat: 'critters', name: 'Foxes', price: 220, layers: ['near'], per: 0.3, flip: true, box: [-54, -64, 34, 2],
      draw: (c, t, r) => {
        c.save(); c.translate(-12, -6); c.rotate(Math.sin(t * 1.8 + r * 9) * 0.15);
        ellipse(c, -18, -6, 21, 9, -0.3); paint(c, '#ff8a3d', LINE, 2.5);
        ellipse(c, -34, -1, 6, 5.5, -0.3); paint(c, '#fff');
        c.restore();
        ellipse(c, 0, -20, 15, 20); paint(c, '#ff8a3d', LINE, 2.5);
        ellipse(c, 6, -21, 7, 13); paint(c, '#fff');
        rect(c, 2, -12, 6, 12, 3, '#3a2a20', LINE, 1.5);
        rect(c, 10, -12, 6, 12, 3, '#3a2a20', LINE, 1.5);
        poly(c, [[3, -48], [5, -62], [13, -50]], '#ff8a3d', LINE, 2);
        poly(c, [[12, -50], [19, -61], [21, -46]], '#ff8a3d', LINE, 2);
        circle(c, 12, -42, 11); paint(c, '#ff8a3d', LINE, 2.5);
        poly(c, [[18, -45], [32, -38], [18, -34]], '#fff', LINE, 2);
        circle(c, 31, -38, 2.4); paint(c, LINE);
        line(c, LINE, 2, () => c.arc(14, -44, 3.5, Math.PI * 1.15, Math.PI * 1.85));
      } },
    { id: 'deer', cat: 'critters', name: 'Deer', price: 300, layers: ['mid'], per: 0.3, scale: [0.85, 1], flip: true, box: [-42, -112, 60, 2],
      draw: c => {
        legs(c, [-24, -14, 16, 26], -42, '#9a6236');
        ellipse(c, -34, -58, 5, 8, 0.4); paint(c, '#fff', LINE, 2);
        ellipse(c, 0, -52, 34, 17); paint(c, '#b97a46', LINE, 2.5);
        ellipse(c, 2, -44, 22, 7); paint(c, '#f2d39a');
        for (const [x, y] of [[-14, -60], [-2, -63], [10, -60], [-8, -55]]) { circle(c, x, y, 2.5); paint(c, '#fff3dc'); }
        poly(c, [[16, -60], [30, -94], [42, -88], [32, -54]], '#b97a46', LINE, 2.5);
        ellipse(c, 33, -104, 4, 9, -0.6); paint(c, '#b97a46', LINE, 2);
        ellipse(c, 44, -96, 14, 9, 0.3); paint(c, '#b97a46', LINE, 2.5);
        circle(c, 56, -91, 2.5); paint(c, LINE);
        circle(c, 43, -99, 2); paint(c, LINE);
      } },
    { id: 'unicorn', cat: 'critters', name: 'Unicorn', price: 900, layers: ['mid'], per: 0.2, scale: [0.9, 0.9], flip: true, box: [-60, -140, 60, 2],
      draw: (c, t) => {
        const RAINBOW = ['#ff6b6b', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#9775fa'];
        RAINBOW.forEach((col, k) => line(c, col, 4, () => { c.moveTo(-34, -58); c.quadraticCurveTo(-52, -46 + k * 3, -48 + k * 2, -18 + k * 3 + Math.sin(t * 2 + k) * 2); }));
        legs(c, [-24, -14, 16, 26], -42, '#ffffff');
        for (const x of [-24, -14, 16, 26]) rect(c, x - 3.5, -6, 7, 6, 2, '#ffd84a', LINE, 1.5);
        ellipse(c, 0, -52, 36, 18); paint(c, '#ffffff', LINE, 2.5);
        poly(c, [[16, -60], [28, -96], [42, -92], [34, -54]], '#ffffff', LINE, 2.5);
        RAINBOW.forEach((col, k) => line(c, col, 4, () => { c.moveTo(26 - k * 0.5, -100 + k * 7); c.quadraticCurveTo(16 - k, -92 + k * 7, 14 - k * 1.5, -78 + k * 7); }));
        poly(c, [[38, -104], [47, -138], [49, -104]], '#ffd84a', LINE, 2);
        line(c, '#d9a82a', 1.5, () => { for (const y of [-112, -120, -128]) { c.moveTo(40, y); c.lineTo(48, y - 3); } });
        ellipse(c, 33, -104, 4, 8, -0.6); paint(c, '#ffffff', LINE, 2);
        ellipse(c, 44, -95, 15, 10, 0.35); paint(c, '#ffffff', LINE, 2.5);
        line(c, LINE, 2, () => c.arc(44, -98, 3.5, Math.PI * 1.15, Math.PI * 1.85));
        circle(c, 46, -90, 3.5); paint(c, 'rgba(255,140,160,0.5)');
        circle(c, 56, -91, 1.6); paint(c, LINE);
        for (let k = 0; k < 3; k++) {
          const a = (t * 1.5 + k / 3) % 1;
          c.globalAlpha = Math.sin(a * Math.PI);
          star(c, 30 + k * 18, -126 + k * 10 - a * 12, 5, '#fff3a0');
          c.globalAlpha = 1;
        }
      } },

    // ---- path: new berries and obstacles that show up in Machiki's way
    { id: 'stump', cat: 'path', name: 'Tree stumps', price: 120, path: 'obstacle', w: 110, label: 'tree stump' },
    { id: 'raspberry', cat: 'path', name: 'Raspberry bushes', price: 150, path: 'berry', value: 4, label: 'raspberries' },
    { id: 'thorns', cat: 'path', name: 'Thorny bushes', price: 170, path: 'obstacle', w: 140, label: 'thorny bush' },
    { id: 'blackberry', cat: 'path', name: 'Blackberry bushes', price: 200, path: 'berry', value: 5, label: 'blackberries' },
    { id: 'puddle', cat: 'path', name: 'Mud puddles', price: 220, path: 'obstacle', w: 150, label: 'mud puddle' },
    { id: 'cherry', cat: 'path', name: 'Cherry bushes', price: 250, path: 'berry', value: 5, label: 'cherries' },
    { id: 'haybale', cat: 'path', name: 'Hay bales', price: 300, path: 'obstacle', w: 125, label: 'hay bale' },
    { id: 'pinecone', cat: 'path', name: 'Giant pinecones', price: 350, path: 'obstacle', w: 95, label: 'giant pinecone' },
    { id: 'grapes', cat: 'path', name: 'Grape vines', price: 380, path: 'berry', value: 6, label: 'grapes' },
    { id: 'beehive', cat: 'path', name: 'Beehives', price: 450, path: 'obstacle', w: 110, label: 'beehive' },
    { id: 'golden', cat: 'path', name: 'Golden berries', price: 750, path: 'berry', value: 10, label: 'golden berries', rare: true },
  ];

  // What's on the path before anything is bought.
  const STARTER_PATH = [
    { id: 'blueberry', path: 'berry', value: 3, label: 'blueberries' },
    { id: 'strawberry', path: 'berry', value: 4, label: 'strawberries' },
    { id: 'log', path: 'obstacle', w: 150, label: 'log' },
    { id: 'rock', path: 'obstacle', w: 125, label: 'rock' },
  ];

  const byId = Object.fromEntries([...STARTER_PATH, ...ITEMS].map(i => [i.id, i]));
  const PATH_BOXES = { stump: [-64, -100, 64, 6], thorns: [-80, -92, 80, 6], puddle: [-84, -32, 84, 6], haybale: [-64, -88, 64, 6], pinecone: [-44, -106, 44, 6], beehive: [-80, -132, 80, 6] };
  for (const it of ITEMS.filter(i => i.path)) {
    it.box = it.path === 'berry' ? [-80, -112, 80, 8] : PATH_BOXES[it.id];
    const spots = Art.bushSpots();
    const fake = it.path === 'berry'
      ? { kind: 'bush', berryType: it.id, spots, w: 140 }
      : { kind: 'obstacle', type: it.id, w: it.w };
    it.draw = (c, t) => { c.translate(0, -GROUND_Y); Art.item(c, { ...fake, x: 0, picked: it.path === 'obstacle', shake: 0 }, t); };
  }

  // ---------------------------------------------------------------- drawing the scene

  // Owned items per layer, cached per owned-set so this is cheap to call every frame.
  const cache = new WeakMap();
  function ownedIn(owned, layerName) {
    let byLayer = cache.get(owned);
    if (!byLayer) { byLayer = {}; cache.set(owned, byLayer); }
    if (!byLayer[layerName]) byLayer[layerName] = ITEMS.filter(i => owned.has(i.id) && (i.layers || []).includes(layerName));
    return byLayer[layerName];
  }

  function place(ctx, item, x, y, s, flip, t, seed) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flip ? -s : s, s);
    item.draw(ctx, t, seed);
    ctx.restore();
  }

  function layer(ctx, name, wx, t, owned) {
    const list = ownedIn(owned, name);
    if (!list.length) return;
    if (name === 'backdrop') { for (const it of list) it.scene(ctx, wx, t); return; }
    const L = LAYERS[name], key = name.length * 31.7;
    const per = it => it.per ?? L.per;
    const total = list.reduce((s, it) => s + per(it), 0);
    const fill = Math.min(L.max, total * L.spacing / W);
    // Which item a slot would hold, chosen in proportion to each item's frequency.
    const pickFor = (i, salt = 0) => {
      let roll = rnd(i * 7.13 + key + salt) * total;
      for (const it of list) if ((roll -= per(it)) <= 0) return it;
      return list[list.length - 1];
    };
    const off = wx * L.parallax + t * (L.drift || 0);
    const first = Math.floor(off / L.spacing) - 1, last = Math.floor((off + W) / L.spacing) + 1;
    for (let i = first; i <= last; i++) {
      if (rnd(i * 1.37 + key) > fill) continue;
      let item = pickFor(i);
      // Mix things up: don't put the same item in two neighbouring slots.
      if (list.length > 1 && rnd((i - 1) * 1.37 + key) <= fill && pickFor(i - 1) === item) {
        item = pickFor(i, 0.5);
        if (item === pickFor(i - 1)) item = list[(list.indexOf(item) + 1) % list.length];
      } else if (list.length === 1 && rnd((i - 1) * 1.37 + key) <= fill) {
        continue; // a lone item never sits right next to itself
      }
      const seed = rnd(i * 3.71 + key);
      const [s0, s1] = item.scale || [0.85, 1.1];
      const x = i * L.spacing - off + rnd(i * 5.3 + key) * L.spacing * 0.4;
      const y = L.y[0] + rnd(i * 2.9 + key) * (L.y[1] - L.y[0]);
      place(ctx, item, x, y, (s0 + seed * (s1 - s0)) * (L.scale || 1), item.flip && seed > 0.5, t, seed);
    }
  }

  // Flying things cross the sky from right to left every so often.
  function flyers(ctx, t, owned) {
    ITEMS.forEach((item, k) => {
      if (!item.fly || !owned.has(item.id)) return;
      const { speed, y, gap, bob } = item.fly;
      const loop = W + 600 + gap * speed, phase = rnd(k * 9.1) * loop;
      const x = W + 300 - ((t * speed + phase) % loop);
      if (x < -320 || x > W + 320) return;
      place(ctx, item, x, y + Math.sin(t * 0.9 + k) * bob, 1, false, t, rnd(k));
    });
  }

  // Draws an item to fit a w×h shop card.
  function preview(ctx, item, w, h, t = 1) {
    const [x0, y0, x1, y1] = item.box;
    const s = Math.min(1.6, (w - 14) / (x1 - x0), (h - 14) / (y1 - y0));
    ctx.save();
    ctx.translate(w / 2 - s * (x0 + x1) / 2, h / 2 - s * (y0 + y1) / 2);
    ctx.scale(s, s);
    item.draw(ctx, t, 0.3);
    ctx.restore();
  }

  // Berry or obstacle types that can show up on the path, given what's been bought.
  const pathTypes = (owned, kind) => [...STARTER_PATH, ...ITEMS]
    .filter(i => i.path === kind && (!i.price || owned.has(i.id)));

  return { ITEMS, CATS, byId, layer, flyers, preview, pathTypes };
})();
