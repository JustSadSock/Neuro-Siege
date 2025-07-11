# Neuro-Siege v1 Specification

This document briefly describes the modules used in the first working prototype.

## Modules
- **index.html** – root page. Loads CSS and the JavaScript modules.
- **style.css** – minimal layout for the canvas and HUD.
- **main.js** – initializes the game, manages the build and battle loop.
- **map.js** – generates the terrain and manages build zones.
- **ai.js** – simple enemy logic with pathfinding.
- **ui.js** – DOM helpers for HUD updates.
- **economy.js** – applies wave rewards and tracks storage limits.
- **stats.js** – collects a heatmap of enemy movement.
- **troops.js** – placeholder for ally squads.

## API Overview
- `generateMap()` – create random map data.
- `expandBuildZone()` – increases the allowed construction area.
- `AIController.spawnEnemy(type)` – spawns a unit at map edge.
- `AIController.update(castle, walls, gates, rocks, water)` – updates all enemies and returns those killed.
- `setupUI(startCb, wallCb, gateCb, towerCb, deleteCb, openCb, closeCb)` – wires UI buttons.
- `applyWaveRewards(state)` – calculate resource gains after a wave.
- `recordEnemyPosition(x, y)` – add to heatmap.
- `drawHeatmap(ctx, tile)` – render heat overlay during build phase.

These APIs are used by `main.js` to compose basic gameplay with waves, simple building and resource rewards.
