# Fish World 3D PRD Summary

## Mode

- Engine: `Three.js`
- Genre: `3D Open World Survival / Evolution`
- Platform: `Web Browser`
- Fantasy: start as a weak fish, survive, hunt, grow, evolve, dominate

## Core Product Goals

- wide and living underwater world
- fair survival loop from weak to apex predator
- smooth movement and stable camera
- browser-friendly performance

## MVP Systems

- third-person follow camera
- smooth fish movement
- size progression:
  - Tiny
  - Small
  - Medium
  - Large
  - Giant
  - Apex / Evolved
- HP and bite combat
- prey and predator ecosystem
- corpse / meat reward loop
- growth points and evolution points
- circular radar in top-right
- natural world boundaries

## Technical Direction For This Repo

- `Arcade Mode` stays under `src/game/`
- `Fish World` grows under `src/fish-world/`
- UI remains DOM-first
- renderer/runtime stays separate from simulation state

## Current Prototype Scope

Implemented in this repo now:
- landing page routing to a Fish World prototype
- Three.js scene bootstrap
- player fish placeholder
- basic world shell
- basic follow camera
- radar UI shell
- progression HUD shell

Still missing:
- real GLB assets
- combat system
- AI ecosystem
- corpse/meat loop
- growth and evolution gameplay rules
- region streaming
- performance systems such as culling/LOD
