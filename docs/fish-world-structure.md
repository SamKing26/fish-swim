# Fish World Structure

This document defines the initial repo structure for the future 3D mode.

## Goal

Keep `Arcade Mode` stable while preparing a clean place for `Fish World`.

## Repo Direction

- `Arcade Mode`
  stays in `src/game/`
- `Fish World`
  starts separately in `src/fish-world/`

## Initial Folder Plan

```text
src/
  game/
    ...
  fish-world/
    README.md
    core/
    world/
    player/
    systems/
    ui/
    assets/
```

## Why Separate It

- avoids mixing Phaser and Three.js runtime code
- keeps build changes smaller
- makes ownership of each mode clearer
- reduces regression risk in the shipped Arcade Mode

## Next Step

When Fish World starts implementation, first add:
- a dedicated entry module
- a separate bootstrapping path
- shared routing from the landing page only when the mode is ready
