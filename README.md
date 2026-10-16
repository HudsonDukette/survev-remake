# Island Royale — top-down island exploration prototype

Island Royale is an original browser game inspired by the readable map style and pacing of classic top-down .io survival games. It keeps its own name, code, and generated world layout.

## Run locally

Requires Node.js 20.19+ or 22.12+.

    npm install
    npm run dev

Use WASD or the arrow keys to move. The camera follows smoothly, movement is collision-aware, and the minimap shows the island, river, cabins, environmental props, and your current position.

## Current features

- A seeded island with grass detail, a sandy coast, ocean, and a winding river.
- Cabins with visible interiors, segmented wall collisions, and open doorways.
- Environment art for trees, rocks, bushes, barrels, and crates, with attribution and GPL-3.0 notices in public/assets/suroi/.
- Depth-sorted environmental props, tree canopy fade, island-edge collision, and a live minimap.
- Solo exploration menu and controls guide.

## Still in development

This remains an exploration prototype rather than a complete online battle royale. Matchmaking, network play, full match flow, and inventory systems have not been implemented.

## Checks

    npm test
    npm run build

The CI workflow runs the unit tests and production build on pushes to main and pull requests.
