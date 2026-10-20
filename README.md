# Machiki's Berry Run 🐻🫐

A cartoony side-scroller that practises addition and subtraction up to 20. Machiki the bear runs
through the forest; each berry bush or obstacle that scrolls in comes with a sum. Answer before
Machiki reaches it to pick the berries (or hop over the log), and the berries go into his knapsack.

## Playing

Open `index.html` in a browser (double-clicking it works, no server or install needed).

- Type the answer and press **Enter** (or use the on-screen number buttons).
- **P** or **Esc** pauses. The game also pauses itself if you switch tabs.
- A wrong answer makes Machiki stumble, but you can keep trying until he reaches the item.
- If time runs out he trips, drops a few berries, and the right answer is shown.
- Each level has 10 questions. Berries add up to a total that's saved between sessions.

## Grown-ups panel

From the title screen, **⚙️ Grown-ups** lets you change:

- the time per question (Relaxed 14s, Normal 10s, Quick 7s)
- addition and/or subtraction
- numbers up to 10 or 20
- on-screen buttons, sound and music

It also shows how many facts have been practised and mastered, and which ones are tricky.

## How the practice is chosen (spaced repetition)

Every fact (`8+5`, `13-5`, …) sits in a Leitner box from 0 to 6, saved in the browser's localStorage:

- **A miss** (a wrong try, or tripping) sends the fact back to box 0. It's asked again a couple of
  questions later in the same level, and again at the start of the next level.
- **A quick, first-try answer** moves the fact up a box. Each box waits longer before asking again:
  now, 10 minutes, 1 day, 3 days, 1 week, 16 days, 35 days.
- **A correct but slow answer** keeps the fact where it is.
- Each level is up to 60% due reviews (weakest first). The rest are new facts, introduced
  easiest-first (small sums, then up to 10, then teens, then crossing ten like 7+6 and 13−5).

The logic is in [js/srs.js](js/srs.js).

## Assets and licensing

Nothing is downloaded or bundled. All graphics are drawn in code with the Canvas API
([js/art.js](js/art.js)), and all sound effects and the background music (an original music-box
tune) are synthesized with the Web Audio API ([js/audio.js](js/audio.js)). The one outside asset is
the [Fredoka](https://fonts.google.com/specimen/Fredoka) font from Google Fonts (SIL Open Font
License). Offline, the game falls back to a system font.

For personal, non-commercial use.
