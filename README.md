# Island Royale — browser battle royale foundation

An original browser-based top-down battle royale prototype inspired by the *mechanics* of Survev.io. No Survev.io source code or ripped assets are included.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Use WASD or arrow keys to move. `npm test` runs unit tests and `npm run build` creates the production bundle.

## Current scope: M1

This is a technical foundation, not a complete game. It includes a PixiJS canvas, procedural ground, player movement, camera math, a capped 60 Hz fixed-step simulation, and unit tests. It does not yet include combat, loot, the safe zone, matchmaking, or online multiplayer.

## Planned milestones

- M1.1: browser smoke tests and CI.
- M2: mouse aiming, collision, seeded map, buildings, loot, inventory, weapons.
- M3: lobby, match flow, safe zone, minimap, win conditions.
- M4: Node.js authoritative multiplayer server and WebSocket protocol.
- M5: original or properly licensed art/audio and content tuning.
- M6: load tests, deployment operations, security and performance review.

## Architecture

- `src/core`: simulation primitives, camera, fixed-step loop.
- `src/input`: keyboard input collection.
- `src/render`: PixiJS renderer.
- `src/world`: world-to-tile coordinate conversion.
- `tests`: deterministic unit tests.

The future multiplayer server must own movement validation, hits, inventory, loot and zone damage. Never trust client-reported game outcomes.