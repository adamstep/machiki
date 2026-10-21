# Machiki's Berry Run 🐻🫐

A cartoony side-scroller that practises addition and subtraction up to 20. Machiki the bear runs
through the forest; each berry bush or obstacle that scrolls in comes with a sum. Answer before
Machiki reaches it to pick the berries (or hop over the log), and the berries go into his knapsack.

## Playing

Open `index.html` in a browser (double-clicking it works, no server or install needed).

- Type the answer and press **Enter** (or use the on-screen number buttons), or say it out loud
  if speaking answers is turned on (see below).
- **P** or **Esc** pauses. The game also pauses itself if you switch tabs.
- A wrong answer makes Machiki stumble, and the game points out the likely slip, but you can keep
  trying until he reaches the item.
- If time runs out he trips and drops a few berries, and a tip shows how to work the fact out.
  Press **Got it!** (or **Enter**) to carry on with a similar question (see below).
- Each level has 10 questions. At the end, the berries in Machiki's knapsack fly into the total,
  which is saved between sessions.
- Getting every question in a level right on the first try earns a **+20 perfect-streak bonus**:
  golden berries fly from the streak badge into the total.

## Phones and tablets

The game adapts to the screen's shape:

- **Landscape** (phones, tablets, computers): the forest fills the whole screen, with the number
  pad on the grass. The keys are bigger on phones.
- **Portrait**: the forest is on top, and the problem and a big 3×4 number pad sit below it.
- **Squarish screens**: the number pad gets its own strip under the forest.

On Android phones and iPads, starting a level switches to full screen. On iPhone, use Safari's
**Share → Add to Home Screen** to play full screen like an app.

### App icon

The Home Screen icon, Android app icons and browser-tab icon in [icons/](icons/) are drawn from
the game's own artwork by [tools/icon.html](tools/icon.html). To regenerate one after changing the
drawing, serve the folder and screenshot the page at the size you need, for example:

```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=180,180 --screenshot=icons/apple-touch-icon.png \
  "http://localhost:8000/tools/icon.html?size=180"
```

## Berry Shop

From the home screen or the end of a level, **🏡 Berry Shop** lets the player spend berries on 60 hand-drawn items. The
run starts out bare (sky, sun, hills, grass and the path), and everything bought appears in
Machiki's forest, both on the home screen and during runs:

- **🌼 Plants:** flowers, toadstools, ferns, pumpkins, a fence, a signpost, a lily pond… These grow
  along the path and in the foreground.
- **🌳 Trees & places:** oak, pine, birch, apple, autumn and cherry-blossom trees, a mushroom
  house, snowy mountains, and landmarks like a log cabin, windmill, treehouse and castle.
- **☁️ Sky:** clouds, birds, butterflies, bees, a kite, a hot-air balloon, an airplane with a
  "GO MACHIKI!" banner, a rainbow, a flying saucer and a friendly dragon.
- **🐰 Critters:** snails, frogs, turtles, hedgehogs, bunnies, squirrels, a duck family, owls,
  foxes, deer and a unicorn.
- **🛤️ Path:** new berry bushes (raspberries, blackberries, cherries, grapes and rare golden
  berries worth 10) and new obstacles (stumps, thorny bushes, mud puddles, hay bales, giant
  pinecones, beehives) that show up in Machiki's way.

Prices run from 20 berries (grass tufts) to 1,000 (the castle and the dragon), about 14,000 for
everything, so the forest fills in slowly over many levels. Each item shows up only about once
per screen (critters and landmarks less often), so a single purchase stays special. A part of the
scene gets busier only as more different things are bought for it, and the same item never sits
twice in a row. Buying takes two taps so berries aren't spent by accident.
The catalog and drawings are in [js/decor.js](js/decor.js).

## Grown-ups panel

From the title screen, **⚙️ Grown-ups** lets you change:

- the time per question (Relaxed 14s, Normal 10s, Quick 7s)
- addition and/or subtraction
- numbers up to 10 or 20
- on-screen buttons, sound and music

It also shows how many facts have been practised and mastered, which ones are tricky, and what
kinds of mistakes come up most (see below).

## Help with mistakes

A wrong answer gets a message about what probably went wrong, without giving the answer away:

- **Mixed up + and −** (13 for 8 − 5): "Look at the sign: it's minus, so take away!"
- **Swapped digits** (31 for 13): "Almost! Check which digit comes first."
- **Off by ten** (3 for 8 + 5): "Close! Check the tens."
- **Off by one**: "So close! Count again carefully."
- Anything else says whether the answer was too big or too small.

When time runs out, the game stops for a 💡 tip. It works the fact out in big numbers, one step
at a time, with a berry picture: blueberries for the first number and strawberries for the
second, in ten-frames (two rows of five). Berries join the frame, or get crossed out, as each step
appears, and the answer is filled in at the end:

| Kind of fact | Tip |
| --- | --- |
| Crossing ten | Make 10 first: 8 + 5 → **8 + 2 = 10, 10 + 3 = 13**; get to 10 first: 13 − 5 → **13 − 3 = 10, 10 − 2 = 8** |
| Doubles and near doubles | Two rows of berries: 7 + 7 → **5 + 5, 2 + 2**; 6 + 7 → **6 + 6 = 12, 12 + 1 = 13** |
| Teens | Work with the ones, keep the ten: 12 + 5 → **2 + 5 = 7, 10 + 7 = 17**; 17 − 4 → **7 − 4 = 3** |
| Subtraction within 10 | Think addition: 9 − 4 → **4 + ? = 9** |
| Small steps | Count on or back (7 → 8 → 9), or count up when the numbers are close (15 − 13) |

The question after a tip uses the same strategy with slightly different numbers (after 8 + 5,
maybe 8 + 6 or 9 + 4), so the tip gets tried straight away. It takes the place of a later question,
so the level stays 10 long. The missed fact itself still comes back a few questions later.

The Grown-ups panel counts each kind of mistake. The logic is in [js/hints.js](js/hints.js), and
the tip's picture and animation are in [js/tip.js](js/tip.js).

## Speaking answers

Turn on **Answer by speaking** in the Grown-ups panel. The browser asks for the microphone, and
the panel shows what it hears so you can test it. During a level, a 🎤 badge on the problem
pulses while it's listening. Say the number ("twelve", or "seven plus five is twelve") and it's
checked straight away. Typing still works too.

- It uses the browser's built-in speech recognition (English): **Chrome** or **Safari** work.
  Firefox doesn't support it, and the in-app browser of some tools may not either.
- Chrome may send the audio to Google to turn it into text, and Safari uses Apple's service. When
  Chrome offers on-device recognition, the game uses it so the audio stays on the computer.
  The game itself never records or keeps any audio.
- To feel instant, a number is accepted as soon as it's heard, unless it could be the start of a
  longer one ("six…" → "sixteen"). Then it waits for the end of the word or a short pause.
- If the browser keeps asking for microphone permission when you open `index.html` directly,
  serve the folder instead (`python3 -m http.server`) and open http://localhost:8000.

## How the practice is chosen (spaced repetition)

Every fact (`8+5`, `13-5`, …) sits in a Leitner box from 0 to 6, saved in the browser's localStorage:

- **A miss** (a wrong try, or tripping) sends the fact back to box 0. It's asked again a couple of
  questions later in the same level, and again at the start of the next level.
- **A quick, first-try answer** moves the fact up a box. Each box waits longer before asking again:
  now, 10 minutes, 1 day, 3 days, 1 week, 16 days, 35 days.
- **A correct but slow answer** keeps the fact where it is.
- Each level is up to 60% due reviews (weakest first). The rest are new facts, split evenly
  between three kinds of problem: within 10 (6+3, 9−4), teens that don't cross ten (12+5, 17−4),
  and ones that cross ten (8+7, 13−5). With "up to 20", about three in four problems use a
  number above 10. Facts like 5+0 or 7−7 come up only rarely.

The logic is in [js/srs.js](js/srs.js).

## Assets and licensing

Nothing is downloaded or bundled. All graphics are drawn in code with the Canvas API
([js/art.js](js/art.js), [js/decor.js](js/decor.js)), and all sound effects and the background music (an original music-box
tune) are synthesized with the Web Audio API ([js/audio.js](js/audio.js)). The one outside asset is
the [Fredoka](https://fonts.google.com/specimen/Fredoka) font from Google Fonts (SIL Open Font
License). Offline, the game falls back to a system font.

For personal, non-commercial use.
