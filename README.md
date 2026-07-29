# Understory — playtest

A naturalist's tarot wrapped around a private daily journal. All 78 cards as
19th-century-style specimen plates; one card a day; write a few lines; the app
notices when a card returns. **Reflection, not fortune.**

This is the **browser playtest**, not the product: it validates the daily
ritual, the Echo moment, dual card names, and the plate system before native
iOS development starts. No accounts, no server, no analytics — everything
stays on your device, and after first load it works offline.

## Use it

Open the deployed URL on your iPhone in Safari → Share → **Add to Home
Screen**. It installs like an app. The same URL works in any desktop browser.

## Develop

```
npm install
npm run dev      # local dev server
npm run build    # typecheck (strict) + production build + PWA precache
```

See `CLAUDE.md` for conventions and `DECISIONS.md` for the choice log.
Placeholder card copy lives in `src/content/` and is marked for rewrite
before any public release.
