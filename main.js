import {
  drawGrid,
  drawTerrain,
  drawBuildZone,
  inBuildZone,
  expandBuildZone,
  generateMap,
  isBlocked,
  getHills,
  getRocks,
  getWater,
  removeTree,
  MAP_SIZE,
  TILE_SIZE as TILE,
} from './map.js';
import { AIController } from './ai.js';
import {
  setupUI,
  updateWave,
  updateCastleHp,
  updateResources,
  showSummary,
  showStatsPanel,
} from './ui.js';
import { drawHeatmap, recordEnemyPosition, resetHeatmap, getHotspot } from './stats.js';
import {
  walls,
  gates,
  towers,
  addWall,
  addGate,
  addTower,
  removeBuilding,
  openGates as openAllGates,
  closeGates as closeAllGates,
  tickCooldown,
} from './buildings.js';
import { applyWaveRewards } from './economy.js';
import { squads, updateSquads } from './troops.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = TILE;
const castle = { x: 32, y: 32, hp: 100 };

const resources = { stone: 100, wood: 150, gold: 200, essence: 0 };

let bullets = [];
let hills = [];
let water = [];
let rocks = [];
let deleteMode = false;

generateMap();
hills = getHills();
rocks = getRocks();
water = getWater();
let essenceGainThisWave = 0;

let wave = 0;
let ai = new AIController();
let running = false;
let killsThisWave = 0;

function drawCastle() {
    ctx.fillStyle = 'blue';
    ctx.fillRect(castle.x * TILE_SIZE, castle.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

function drawWalls() {
    ctx.fillStyle = 'gray';
    walls.forEach(w => {
        ctx.fillRect(w.x * TILE_SIZE, w.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    });
}

function drawGates() {
    gates.forEach(g => {
        ctx.fillStyle = g.open ? 'lightgreen' : 'brown';
        ctx.fillRect(g.x * TILE_SIZE, g.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    });
}

function drawTowers() {
    ctx.fillStyle = 'purple';
    towers.forEach(t => {
        ctx.fillRect(t.x * TILE_SIZE, t.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    });
}

function drawBullets() {
    ctx.fillStyle = 'yellow';
    bullets.forEach(b => {
        ctx.fillRect(b.x * TILE_SIZE, b.y * TILE_SIZE, 2, 2);
    });
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx);
    drawBuildZone(ctx);
    drawTerrain(ctx);
    drawCastle();
    drawWalls();
    drawGates();
    drawTowers();
    drawBullets();
    if (!running) drawHeatmap(ctx, TILE_SIZE);
    updateSquads();
        tickCooldown();
        const killed = ai.update(castle, walls, gates, rocks, water);
        killed.forEach(e => {
            if (e.type === 'elite') essenceGainThisWave += 1;
        });
        ai.enemies.forEach(e => {
            recordEnemyPosition(e.x, e.y);
            // tower attacks
            towers.forEach(t => {
                const dx = e.x - t.x;
                const dy = e.y - t.y;
                const dist = Math.hypot(dx, dy);
                if (dist <= t.range && t.cooldown <= 0) {
                    const normx = dx / dist;
                    const normy = dy / dist;
                    bullets.push({ x: t.x + 0.5, y: t.y + 0.5, dx: normx, dy: normy, speed: 1, target: e });
                    t.cooldown = t.rate;
                }
            });
        });

        bullets.forEach(b => {
            b.x += b.dx * b.speed;
            b.y += b.dy * b.speed;
        });

        bullets.forEach((b, idx) => {
            const e = b.target;
            if (!e.alive) {
                bullets.splice(idx,1);
                return;
            }
            const dist = Math.hypot(b.x - e.x, b.y - e.y);
            if (dist < 0.4) {
                e.takeDamage(5);
                if (!e.alive) {
                    killsThisWave++;
                    if (e.type === 'elite') essenceGainThisWave += 1;
                }
                bullets.splice(idx,1);
            }
        });

        towers.forEach(t => { if (t.cooldown > 0) t.cooldown -= 1; });

        ai.draw(ctx, TILE_SIZE);
        if (running && ai.enemies.length === 0) {
            endWave();
        }

    updateCastleHp(castle.hp);
    updateResources(resources.stone, resources.wood, resources.gold, resources.essence);
    if (castle.hp > 0) {
        requestAnimationFrame(gameLoop);
    } else {
        ctx.fillStyle = 'white';
        ctx.fillText('Game Over', canvas.width / 2 - 40, canvas.height / 2);
    }
}

function setBuildMode(mode, button) {
    if (buildMode === mode) {
        buildMode = null;
    } else {
        buildMode = mode;
    }
    deleteMode = false;
    document.getElementById('buildWallBtn').textContent = buildMode === 'wall' ? 'Cancel' : 'Build Wall';
    document.getElementById('buildGateBtn').textContent = buildMode === 'gate' ? 'Cancel' : 'Build Gate';
    document.getElementById('buildTowerBtn').textContent = buildMode === 'tower' ? 'Cancel' : 'Build Tower';
    document.getElementById('deleteBtn').textContent = 'Delete';
}

function toggleDeleteMode() {
    buildMode = null;
    deleteMode = !deleteMode;
    document.getElementById('buildWallBtn').textContent = 'Build Wall';
    document.getElementById('buildGateBtn').textContent = 'Build Gate';
    document.getElementById('buildTowerBtn').textContent = 'Build Tower';
    document.getElementById('deleteBtn').textContent = deleteMode ? 'Cancel' : 'Delete';
}

canvas.addEventListener('click', (e) => {
    if (running) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
    const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);
    if (deleteMode) {
        if (removeBuilding(x, y, resources)) {
            updateResources(resources.stone, resources.wood, resources.gold, resources.essence);
        }
        return;
    }

    if (!buildMode) return;
    if (!inBuildZone(x, y) || isBlocked(x,y)) return;
    if (buildMode === 'wall') {
        if (removeTree(x, y)) resources.wood += 5;
        addWall(x, y, resources, wave);
    } else if (buildMode === 'gate') {
        if (removeTree(x, y)) resources.wood += 5;
        addGate(x, y, resources);
    } else if (buildMode === 'tower') {
        if (removeTree(x, y)) resources.wood += 5;
        addTower(x, y, resources, wave);
    }
    updateResources(resources.stone, resources.wood, resources.gold, resources.essence);

});

function startWave() {
    buildMode = null;
    wave += 1;
    updateWave(wave);
    if (wave % 5 === 0) expandBuildZone();
    for (let i = 0; i < wave; i++) {
        ai.spawnEnemy();
    }
    if (wave % 5 === 0) {
        ai.spawnEnemy('elite');
    }
    running = true;
    killsThisWave = 0;
    essenceGainThisWave = 0;
}

function openGates() {
    openAllGates();
}

function closeGates() {
    closeAllGates();
}

function endWave() {
    running = false;
    const state = {
        kills: killsThisWave,
        wallsIntact: walls.length,
        wallsTotal: walls.length,
        wallDamagePercent: 0,
        eliteKills: essenceGainThisWave,
        squads: squads.length,
        resources,
    };
    applyWaveRewards(state);
    const hotspot = getHotspot();
    let html = `<p>Kills: ${killsThisWave}</p>`;
    if (hotspot) {
        html += `<p>\u0443\u044f\u0437\u0432\u0438\u043c\u0430\u044F \u0437\u043e\u043d\u0430 (${hotspot.x},${hotspot.y})</p>`;
    }
    showStatsPanel(html, () => {
        updateResources(resources.stone, resources.wood, resources.gold, resources.essence);
        resetHeatmap();
    });
}

setupUI(startWave,
    () => setBuildMode('wall'),
    () => setBuildMode('gate'),
    () => setBuildMode('tower'),
    toggleDeleteMode,
    openGates,
closeGates);
updateResources(resources.stone, resources.wood, resources.gold, resources.essence);
requestAnimationFrame(gameLoop);
