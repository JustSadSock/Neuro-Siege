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
  showTechTree,
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
import { squads, updateSquads, spawnSquad } from './troops.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  const size = Math.min(window.innerWidth, window.innerHeight);
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let scale = 1;
let offsetX = 0;
let offsetY = 0;
let pointers = [];
let isPanning = false;
let lastPan = null;

function updatePinch(e) {
  for (let i = 0; i < pointers.length; i++) {
    if (pointers[i].pointerId === e.pointerId) {
      pointers[i] = e;
      break;
    }
  }
  if (pointers.length === 2) {
    const [p1, p2] = pointers;
    const dx = p2.clientX - p1.clientX;
    const dy = p2.clientY - p1.clientY;
    const dist = Math.hypot(dx, dy);
    const cx = (p1.clientX + p2.clientX) / 2;
    const cy = (p1.clientY + p2.clientY) / 2;
    if (pointers.lastCenter) {
      const dxC = cx - pointers.lastCenter.x;
      const dyC = cy - pointers.lastCenter.y;
      offsetX -= dxC / (TILE_SIZE * scale);
      offsetY -= dyC / (TILE_SIZE * scale);
    }
    if (pointers.lastDist) {
      let s = scale * (dist / pointers.lastDist);
      s = Math.max(0.5, Math.min(2, s));
      scale = s;
    }
    pointers.lastDist = dist;
    pointers.lastCenter = { x: cx, y: cy };
  }
}

canvas.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse' && e.button === 1) {
    isPanning = true;
    lastPan = { x: e.clientX, y: e.clientY };
    return;
  }
  pointers.push(e);
});
canvas.addEventListener('pointermove', (e) => {
  if (isPanning) {
    const dx = e.clientX - lastPan.x;
    const dy = e.clientY - lastPan.y;
    offsetX -= dx / (TILE_SIZE * scale);
    offsetY -= dy / (TILE_SIZE * scale);
    lastPan = { x: e.clientX, y: e.clientY };
    return;
  }
  updatePinch(e);
});
canvas.addEventListener('pointerup', (e) => {
  if (isPanning && e.pointerType === 'mouse' && e.button === 1) {
    isPanning = false;
    return;
  }
  pointers = pointers.filter((p) => p.pointerId !== e.pointerId);
  if (pointers.length < 2) {
    delete pointers.lastDist;
    delete pointers.lastCenter;
  }
});
canvas.addEventListener('pointercancel', (e) => {
  pointers = pointers.filter((p) => p.pointerId !== e.pointerId);
  if (pointers.length < 2) {
    delete pointers.lastDist;
    delete pointers.lastCenter;
  }
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const delta = Math.sign(e.deltaY);
  scale -= delta * 0.1;
  scale = Math.max(0.5, Math.min(2, scale));
}, { passive: false });

const TILE_SIZE = TILE;
const castle = { x: 32, y: 32, hp: 100, range: 6, rate: 48, cooldown: 0, damage: 10 };

const resources = { stone: 100, wood: 150, gold: 200, essence: 0 };

let bullets = [];
let hills = [];
let water = [];
let rocks = [];
let deleteMode = false;
let buildMode = null;

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
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(-offsetX * TILE_SIZE, -offsetY * TILE_SIZE);
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
                    bullets.push({ x: t.x + 0.5, y: t.y + 0.5, dx: normx, dy: normy, speed: 1, target: e, dmg: 5 });
                    t.cooldown = t.rate;
                }
            });
            const cdx = e.x - castle.x;
            const cdy = e.y - castle.y;
            const cdist = Math.hypot(cdx, cdy);
            if (cdist <= castle.range && castle.cooldown <= 0) {
                const nx = cdx / cdist;
                const ny = cdy / cdist;
                bullets.push({ x: castle.x + 0.5, y: castle.y + 0.5, dx: nx, dy: ny, speed: 1, target: e, dmg: castle.damage });
                castle.cooldown = castle.rate;
            }
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
                e.takeDamage(b.dmg || 5);
                if (!e.alive) {
                    killsThisWave++;
                    if (e.type === 'elite') essenceGainThisWave += 1;
                }
                bullets.splice(idx,1);
            }
        });

        towers.forEach(t => { if (t.cooldown > 0) t.cooldown -= 1; });
        if (castle.cooldown > 0) castle.cooldown -= 1;

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
    ctx.restore();
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
    const x = Math.floor((e.clientX - rect.left) / (TILE_SIZE * scale) + offsetX);
    const y = Math.floor((e.clientY - rect.top) / (TILE_SIZE * scale) + offsetY);
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

function spawnSquadHandler() {
    spawnSquad('infantry', castle.x + 1, castle.y + 1);
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
    closeGates,
    spawnSquadHandler,
    showTechTree);
updateResources(resources.stone, resources.wood, resources.gold, resources.essence);
requestAnimationFrame(gameLoop);
