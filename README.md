# FISH SWIM

Endless underwater Phaser runner based on the provided PRD.

## Run

1. Install dependencies: `npm install`
2. Start the dev server: `npm run dev`
3. Build for production: `npm run build`

This project now uses local `vite` and `phaser` dependencies.

## Active Assets

- The current runtime asset set is defined in [src/game/assetManifest.js](/c:/Users/user/FISH%20SWIM/src/game/assetManifest.js)
- That file includes the kept asset paths and source image sizes for:
  - fish
  - backgrounds
  - active traps
  - active boosts
- Runtime folders are now named by function:
  - `background-assets`
  - `fish-assets`
  - `trap-assets`
  - `boost-assets`
- Unused asset files from the imported pack have been removed from the repo

## Controls

- `W` or `Up Arrow`: move up
- `S` or `Down Arrow`: move down
- Touch upper half: move up
- Touch lower half: move down
- `Space`: restart after game over
- `D`: toggle collision debug bodies

## Included MVP Features

- Endless side-scrolling survival loop
- Smooth fish movement with tilt
- Score-based speed scaling
- Random trap patterns
- Random boost pickup with temporary speed surge
- HUD with score, best score, and boost timer
- Game over overlay with instant retry
- Generated underwater visuals and synthesized audio
- Pooled traps and boosts for lower-allocation spawning
- Vite-based local development and production build

## Collision Tuning

- Open the game with `?debugBodies=1` to start with collision overlays visible
- Press `D` any time to toggle fish, trap, and boost hitboxes
