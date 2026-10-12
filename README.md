# Vault Run

A tiny pixel-art endless runner. You're a courier sprinting down the halls of an old office building:
collect keys, dodge the paperwork, duck the hanging files, and see how far you get.
There's more to the building than it first lets on.

**Play it:** https://the-model-run.vercel.app/run

- Three lanes. Swipe (or use the arrow keys) to dodge, jump and slide.
- Four rooms that get faster and busier, four power-ups, keys that build a streak.
- An all-time high-score board, and challenge links you can drop in a group chat:
  the link unfurls into a card with your score, and opens the game as a race against your run.

## How it's built

No framework on the client and no build step for the game: it's one hand-written file,
`public/game.js` (about 110 KB), drawing into a small canvas that the browser scales up,
so it stays smooth on a slow laptop or an old phone. Every sprite is drawn as rows of text
in the source. The music and sound are synthesized live in `public/audio.js`.

| Path | What it is |
| --- | --- |
| `public/game.js` | The whole game: sprites, hallways, physics, the board, sharing |
| `public/audio.js` | Music and sound effects, made with Web Audio (no audio files) |
| `public/run.html` | The page the game lives on |
| `pages/api/scores.js` | The high-score board, one small JSON file in Vercel Blob |
| `pages/api/r.js` | Challenge links, `/r/<code>`: a page that unfurls into a picture of the run |
| `pages/api/card.js` | The picture itself, a PNG drawn with the game's pixel font |
| `lib/code.js` | The short, tamper-checked code a challenge link carries |
| `tests/` | A local server, quick checks, and a browser smoke test |

Hosted on Vercel (Hobby). The board is built to stay inside Blob's free allowance
however many people play: views come from memory and the edge cache, and a save that
can't get through waits on the player's device and is sent later, so no run is lost.

## Run it locally

```sh
npm install
npm run serve          # http://localhost:8787/run  (in-memory board, no keys needed)
npm test               # quick checks + a headless play-through of every room
```

Add `?fps` to the address to see the frame rate.

## Contributing

Ideas and fixes are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
