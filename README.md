# Spotify

A music discovery and player app built with vanilla HTML, CSS, and JavaScript. Uses the iTunes Search API to pull real tracks with 30-second previews.

## What it does

- Browse music by genre (Pop, Rock, Hip Hop, Jazz, Electronic, Classical, R&B, Indie)
- Search any artist, song, or album
- Play 30-second previews directly in the browser
- Queue management — add tracks, reorder, remove
- Shuffle and repeat modes
- Volume control and mute
- Progress bar with seek support

## Tech

- Vanilla HTML, CSS, JS — no frameworks, no build tools
- iTunes Search API (free, no API key needed)
- CSS Grid and Flexbox for layout
- Web Audio via native `<audio>` element

## Run locally

Just open `index.html` in a browser. No server needed.

```
open index.html
```

Or use a local server if you prefer:

```
npx serve .
```

>[!IMPORTANT]
> iTunes previews are 30 seconds by design — that's an API limitation, not a bug. The app is intentionally built around that constraint.
