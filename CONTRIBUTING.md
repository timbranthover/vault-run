# Contributing to Vault Run

Thanks for wanting to help. The game is small on purpose; these rules keep it that way.

## The rules

1. **Light first.** It must stay smooth on a slow office laptop and an old phone.
   No libraries, no images for sprites, no audio files. `npm test` enforces a size budget.
2. **Pixel art lives in the code.** Sprites are rows of letters, one letter per colour from
   the palette (`PAL` in `game.js`); the outline is added by code. Keep the art style:
   chunky, readable from a distance, a few colours per object.
3. **Same feel for everyone.** Don't change hitboxes, speeds or scoring in a pull request
   that's about looks; propose gameplay changes separately.
4. **Plain words.** On-screen text is short, upper case, and says what happens.
5. **No real brands or firms** anywhere in the game or its pages.
6. **No `\uXXXX` escapes** in `game.js` (write the character, or `\u{...}`).
7. **Never commit keys.** The board's storage credentials live only in Vercel's settings.

## Making a change

```sh
npm install
npm run serve      # play at http://localhost:8787/run
npm test           # must pass
```

Open a pull request with a sentence on what changed and, for anything visual,
a screenshot or short clip. Checks run automatically on every pull request.
