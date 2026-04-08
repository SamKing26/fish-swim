# FISH SWIM Roadmap

## Product Modes

### 1. Arcade Mode

Status:
- Active
- Playable
- Built in Phaser 3

Current scope:
- Endless survival runner
- Trap avoidance
- Boost pickups
- Score-based speed scaling
- Pause, restart, lobby flow
- Global leaderboard support

Next likely improvements:
- More obstacle patterns
- Better FX and feedback
- More balancing for late-game runs
- More polished reward loops

### 2. Fish World

Status:
- Coming soon
- Not implemented

Product idea:
- Larger underwater game space
- Exploration and progression
- Different routes, events, and content pacing from Arcade Mode
- Built as a 3D mode with `Three.js`

## Technical Direction

### Arcade Mode

Keep current architecture:
- Phaser 3
- Arcade Physics
- DOM-based overlays
- Vercel + Upstash leaderboard

### Fish World

Target direction:
- Build true 3D mode with `Three.js`
- Keep it as a separate runtime inside the same repo
- Do not force true 3D into Phaser

## Recommended Direction

For now:
1. keep shipping `Arcade Mode` in Phaser
2. treat `Fish World` as design/product roadmap
3. implement `Fish World` later with `Three.js`
