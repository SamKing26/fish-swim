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
- `D`: toggle collision debug bodies in local development only

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

- Open the game with `?debugBodies=1` to start with collision overlays visible in local development
- Press `D` any time to toggle fish, trap, and boost hitboxes in local development

## Global Leaderboard On Vercel

The repo now includes a Vercel Function at [api/leaderboard.js](/c:/Users/user/FISH%20SWIM/api/leaderboard.js) and a browser client at [leaderboardClient.js](/c:/Users/user/FISH%20SWIM/src/game/services/leaderboardClient.js).

It is designed for anonymous username + score submissions and falls back to local browser leaderboard data when the backend is not configured.

To make the leaderboard shared for all players on Vercel:

1. Create an Upstash Redis database from the Vercel Marketplace
2. Add these project environment variables in Vercel:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Redeploy the project

Notes:
- No login is required
- Scores are public and anonymous, so basic validation is included but this is not anti-cheat secure
- Production builds ignore `?debugBodies=1` and the `D` hotkey starts disabled
