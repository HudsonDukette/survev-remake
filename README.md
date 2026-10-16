# Island Royale — endless island survival

Island Royale is an original browser-based top-down island survival game built with PixiJS. It uses its own world layout and keeps attribution and GPL-3.0 notices for the selected Suroi environment art in public/assets/suroi/.

## Play

- **WASD / arrow keys:** move
- **Hold Space:** send a short-range pulse that pushes back and damages nearby zombies
- **E:** collect the nearby medkit, shield supply, or speed boost

## Current gameplay

- An island with a **7,000-unit radius**, ocean and sand shoreline, a winding river, and a procedurally detailed ground.
- More than 2,000 trees, rocks, bushes, barrels, crates, and cabins distributed across the island, with clustered settlements to explore.
- A closer, smoothly following camera and a minimap with the player's location, supply drops, and zombies.
- 26 roaming zombies that pursue the player, deal non-graphic contact damage, and respawn over time. Defeating them can drop supplies.
- Hundreds of supply points. Medkits restore health, shield supplies absorb damage, and boosts briefly raise movement speed. Collected supplies respawn at their original locations.
- An endless run: the player automatically revives after being overrun, while kills and run time continue. Every survival wave strengthens newly respawned zombies.
- Health/shield meters, kill/revive/supply counters, and an in-game controls guide.

## Development status

This is a playable **single-player survival loop**, not a full online Surviv.io clone yet. Online multiplayer, matchmaking, network-authoritative simulation, and account-based persistence are not implemented.

## Run locally

    npm install
    npm run dev

## Checks

    npm test
    npm run build

The GitHub Actions CI workflow runs tests and the production build on pushes to main and pull requests.
