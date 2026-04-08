# FISH SWIM

FISH SWIM is an underwater browser game project with two planned game modes:

- `Arcade Mode`
  Current shipped mode. A fast 2D endless runner built with Phaser, Vite, and Arcade Physics.
- `Fish World`
  Planned 3D exploration mode. Not implemented yet.

## Current Status

Implemented now:
- Landing page with username input and mode selection
- `Arcade Mode` gameplay
- Local and global leaderboard support
- Pause menu and game over flow
- Responsive browser layout with mobile landscape support
- Production-safe build with debug hitboxes disabled outside local development

Planned next:
- `Fish World` mode
- More content, systems, and progression

## Stack

- `Phaser 3` for `Arcade Mode`
- `Three.js` planned for `Fish World`
- `Vite`
- `Arcade Physics`
- `Vercel Functions`
- `Upstash Redis` for anonymous global leaderboard storage

## Important Technical Note

`Arcade Mode` is a 2D Phaser game and fits the current stack well.

`Fish World` is planned as a true 3D mode and should be built with `Three.js`, while `Arcade Mode` remains in Phaser.

The intended architecture is:
- keep `Arcade Mode` in Phaser
- build `Fish World` as a separate Three.js runtime inside the same repo later

## Run Locally

1. Install dependencies:
   - `npm install`
2. Start local dev server:
   - `npm run dev`
3. Build for production:
   - `npm run build`

## Controls

Desktop:
- `W` or `Up Arrow`: move up
- `S` or `Down Arrow`: move down
- `Space`: restart after game over

Mobile:
- touch upper half: move up
- touch lower half: move down

Debug:
- `?debugBodies=1` only works in local development
- `D` toggles collision bodies only in local development

## Project Structure

- [index.html](/c:/Users/user/FISH%20SWIM/index.html)
  App shell and DOM overlays
- [src/main.js](/c:/Users/user/FISH%20SWIM/src/main.js)
  Frontend entry
- [src/styles.css](/c:/Users/user/FISH%20SWIM/src/styles.css)
  UI, overlays, landing page, HUD styling
- [src/game/createGame.js](/c:/Users/user/FISH%20SWIM/src/game/createGame.js)
  Phaser bootstrapping
- [src/game/scenes/FishSwimScene.js](/c:/Users/user/FISH%20SWIM/src/game/scenes/FishSwimScene.js)
  Main gameplay scene
- [src/game/systems](/c:/Users/user/FISH%20SWIM/src/game/systems)
  Background, traps, boosts, textures, audio
- [src/game/ui/HudController.js](/c:/Users/user/FISH%20SWIM/src/game/ui/HudController.js)
  DOM HUD and overlay controller
- [src/game/assetManifest.js](/c:/Users/user/FISH%20SWIM/src/game/assetManifest.js)
  Runtime asset paths
- [api/leaderboard.js](/c:/Users/user/FISH%20SWIM/api/leaderboard.js)
  Vercel Function for global leaderboard
- [src/game/services/leaderboardClient.js](/c:/Users/user/FISH%20SWIM/src/game/services/leaderboardClient.js)
  Browser-side leaderboard API client
- [docs/roadmap.md](/c:/Users/user/FISH%20SWIM/docs/roadmap.md)
  Mode plan and next technical milestones

## Assets

Active runtime assets are organized by function under `public/game-assets/FISH SWIM ASSET`:

- `background-assets`
- `fish-assets`
- `trap-assets`
- `boost-assets`

The current runtime manifest is in:
- [src/game/assetManifest.js](/c:/Users/user/FISH%20SWIM/src/game/assetManifest.js)

## Leaderboard

The project supports two leaderboard layers:

- local fallback leaderboard in browser storage
- global leaderboard through Vercel + Upstash Redis

Global leaderboard flow:
1. frontend submits anonymous `username + score`
2. Vercel Function validates and stores score
3. top scores are read back from Redis

Current behavior:
- no login required
- username is optional and capped for display
- fallback to local leaderboard if backend is unavailable

## Vercel Setup

Deploy frontend to Vercel, then connect `Upstash Redis` in the Vercel Marketplace.

This project supports these environment variable names:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `UPSTASH_REDIS_REST_KV_REST_API_URL`
- `UPSTASH_REDIS_REST_KV_REST_API_TOKEN`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

Once connected, test:
- `/api/leaderboard`

Healthy response:

```json
{"entries":[],"configured":true}
```

## Notes

- Production builds do not expose debug hitboxes.
- The global leaderboard is anonymous, so it is suitable for casual ranking but not secure against determined cheating.
- `Fish World` is roadmap-only for now, but its target stack is `Three.js`.
