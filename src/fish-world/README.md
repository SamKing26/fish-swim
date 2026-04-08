# Fish World

This folder is reserved for the future `Fish World` mode.

Current status:
- not implemented
- not connected to runtime
- safe to evolve without affecting `Arcade Mode`

## Intended Stack

- `Three.js`
- `Vite`

## Planned Structure

- `core/`
  Three.js app bootstrap, renderer, scene loop
- `world/`
  Environment, terrain, water, lighting
- `player/`
  Fish controller, camera follow, movement systems
- `systems/`
  Progression, pickups, encounters, save/state
- `ui/`
  Fish World HUD, menus, overlays
- `assets/`
  Mode-specific models, textures, audio

## Rule

Do not import this folder into the current Phaser runtime until the Fish World entrypoint is intentionally added.
