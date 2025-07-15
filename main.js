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
  HEX_HEIGHT as HEX_H,
  drawHex,
  refreshStatic,
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
  showToast,
} from './ui.js';
import {
  drawHeatmap,
  recordEnemyPosition,
  resetHeatmap,
  getHotspot,
} from './stats.js';
import {
  walls,
  gates,
  towers,
  traps,
  hasBuilding,
  addWall,
  addGate,
  addTower,
  addTrap,
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
      offsetX -= dxC / (TILE_SIZE * 0.75 * scale);
      offsetY -= dyC / (HEX_HEIGHT * scale);
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
    offsetX -= dx / (TILE_SIZE * 0.75 * scale);
    offsetY -= dy / (HEX_HEIGHT * scale);
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

canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const worldX = cx / (TILE_SIZE * 0.75 * scale) + offsetX;
    const worldY = cy / (HEX_HEIGHT * scale) + offsetY;
    const delta = Math.sign(e.deltaY);
    let s = scale - delta * 0.1;
    s = Math.max(0.5, Math.min(2, s));
    offsetX = worldX - cx / (TILE_SIZE * 0.75 * s);
    offsetY = worldY - cy / (HEX_HEIGHT * s);
    scale = s;
  },
  { passive: false },
);

const TILE_SIZE = TILE;
const HEX_HEIGHT = HEX_H;
const COLORS = {
  castle: '#4466ff',
  wall: '#999',
  gateClosed: '#663300',
  gateOpen: '#00aa00',
  tower: '#cc00cc',
  trap: '#ffaa00',
  bullet: '#ffff00',
};
const castle = {
  x: 32,
  y: 32,
  hp: 100,
  range: 6,
  rate: 48,
  cooldown: 0,
  damage: 10,
};

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
  ctx.fillStyle = COLORS.castle;
  drawHex(ctx, castle.x, castle.y, COLORS.castle);
}

function drawWalls() {
  walls.forEach((w) => {
    drawHex(ctx, w.x, w.y, COLORS.wall);
  });
}

function drawGates() {
  gates.forEach((g) => {
    drawHex(ctx, g.x, g.y, g.open ? COLORS.gateOpen : COLORS.gateClosed);
  });
}

function drawTowers() {
  towers.forEach((t) => {
    drawHex(ctx, t.x, t.y, COLORS.tower);
  });
}

function drawTraps() {
  traps.forEach((t) => {
    drawHex(ctx, t.x, t.y, COLORS.trap);
  });
}

function drawBullets() {
  bullets.forEach((b) => {
    ctx.fillStyle = COLORS.bullet;
    ctx.beginPath();
    const px = b.x * TILE_SIZE * 0.75 + TILE_SIZE / 2;
    const py = b.y * HEX_HEIGHT + (Math.floor(b.x) % 2) * (HEX_HEIGHT / 2) + HEX_HEIGHT / 2;
    ctx.arc(px, py, 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(-offsetX * TILE_SIZE * 0.75, -offsetY * HEX_HEIGHT);
  drawGrid(ctx);
  drawBuildZone(ctx);
  drawTerrain(ctx);
  drawCastle();
  drawWalls();
  drawGates();
  drawTraps();
  drawTowers();
  drawBullets();
  if (!running) drawHeatmap(ctx);
  updateSquads();
  tickCooldown();
  const killed = ai.update(castle, walls, gates, rocks, water);
  killed.forEach((e) => {
    if (e.type === 'elite') essenceGainThisWave += 1;
  });
  ai.enemies.forEach((e) => {
    recordEnemyPosition(e.x, e.y);
    traps.forEach((t) => {
      if (Math.floor(e.x) === t.x && Math.floor(e.y) === t.y) {
        e.slowTimer = 120;
      }
    });
    // tower attacks
    towers.forEach((t) => {
      const dx = e.x + e.size / 2 - (t.x + 0.5);
      const dy = e.y + e.size / 2 - (t.y + 0.5);
      const dist = Math.hypot(dx, dy);
      if (dist <= t.range && t.cooldown <= 0) {
        const normx = dx / dist;
        const normy = dy / dist;
        bullets.push({
          x: t.x + 0.5,
          y: t.y + 0.5,
          dx: normx,
          dy: normy,
          speed: 1,
          target: e,
          dmg: 5,
        });
        t.cooldown = t.rate;
      }
    });
    const cdx = e.x + e.size / 2 - (castle.x + 0.5);
    const cdy = e.y + e.size / 2 - (castle.y + 0.5);
    const cdist = Math.hypot(cdx, cdy);
    if (cdist <= castle.range && castle.cooldown <= 0) {
      const nx = cdx / cdist;
      const ny = cdy / cdist;
      bullets.push({
        x: castle.x + 0.5,
        y: castle.y + 0.5,
        dx: nx,
        dy: ny,
        speed: 1,
        target: e,
        dmg: castle.damage,
      });
      castle.cooldown = castle.rate;
    }
  });

  bullets.forEach((b) => {
    b.x += b.dx * b.speed;
    b.y += b.dy * b.speed;
  });

  bullets.forEach((b, idx) => {
    const e = b.target;
    if (!e.alive) {
      bullets.splice(idx, 1);
      return;
    }
    const dist = Math.hypot(b.x - (e.x + e.size / 2), b.y - (e.y + e.size / 2));
    if (dist < e.size / 2 + 0.1) {
      e.takeDamage(b.dmg || 5);
      if (!e.alive) {
        killsThisWave++;
        if (e.type === 'elite') essenceGainThisWave += 1;
      }
      bullets.splice(idx, 1);
    }
  });

  towers.forEach((t) => {
    if (t.cooldown > 0) t.cooldown -= 1;
  });
  if (castle.cooldown > 0) castle.cooldown -= 1;

  ai.draw(ctx, TILE_SIZE);
  if (running && ai.enemies.length === 0) {
    endWave();
  }

  updateCastleHp(castle.hp);
  updateResources(
    resources.stone,
    resources.wood,
    resources.gold,
    resources.essence,
  );
  if (castle.hp > 0) {
    requestAnimationFrame(gameLoop);
  } else {
    ctx.fillStyle = 'white';
    ctx.fillText('Game Over', canvas.width / 2 - 40, canvas.height / 2);
  }
  ctx.restore();
}

function setBuildMode(mode) {
  const wallBtn = document.getElementById('buildWallBtn');
  const gateBtn = document.getElementById('buildGateBtn');
  const towerBtn = document.getElementById('buildTowerBtn');
  const trapBtn = document.getElementById('buildTrapBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  if (buildMode === mode) {
    buildMode = null;
  } else {
    buildMode = mode;
  }
  deleteMode = false;
  wallBtn.classList.toggle('active', buildMode === 'wall');
  gateBtn.classList.toggle('active', buildMode === 'gate');
  towerBtn.classList.toggle('active', buildMode === 'tower');
  trapBtn.classList.toggle('active', buildMode === 'trap');
  deleteBtn.classList.remove('active');
}

function toggleDeleteMode() {
  const wallBtn = document.getElementById('buildWallBtn');
  const gateBtn = document.getElementById('buildGateBtn');
  const towerBtn = document.getElementById('buildTowerBtn');
  const trapBtn = document.getElementById('buildTrapBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  buildMode = null;
  deleteMode = !deleteMode;
  wallBtn.classList.remove('active');
  gateBtn.classList.remove('active');
  towerBtn.classList.remove('active');
  trapBtn.classList.remove('active');
  deleteBtn.classList.toggle('active', deleteMode);
}

function handleBuildEvent(e) {
  if (running) return;
  const rect = canvas.getBoundingClientRect();
  const clientX =
    e.touches && e.touches[0]
      ? e.touches[0].clientX - rect.left
      : e.clientX - rect.left;
  const clientY =
    e.touches && e.touches[0]
      ? e.touches[0].clientY - rect.top
      : e.clientY - rect.top;
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const rawX = clientX * scaleX / (TILE_SIZE * 0.75 * scale) + offsetX;
  const x = Math.floor(rawX);
  const rawY = clientY * scaleY / (HEX_HEIGHT * scale) + offsetY - (x % 2) * 0.5;
  const y = Math.floor(rawY);
  if (deleteMode) {
    if (removeBuilding(x, y, resources)) {
      updateResources(
        resources.stone,
        resources.wood,
        resources.gold,
        resources.essence,
      );
    }
    return;
  }

  if (!buildMode) return;
  if (
    !inBuildZone(x, y) ||
    isBlocked(x, y) ||
    hasBuilding(x, y) ||
    (x === castle.x && y === castle.y)
  )
  {
    showToast('Cannot build here');
    return;
  }
  if (buildMode === 'wall') {
    if (removeTree(x, y)) resources.wood += 5;
    if (!addWall(x, y, resources, wave)) {
      showToast('Cannot build wall');
      return;
    }
  } else if (buildMode === 'gate') {
    if (removeTree(x, y)) resources.wood += 5;
    if (!addGate(x, y, resources)) {
      showToast('Cannot build gate');
      return;
    }
  } else if (buildMode === 'tower') {
    if (removeTree(x, y)) resources.wood += 5;
    if (!addTower(x, y, resources, wave)) {
      showToast('Cannot build tower');
      return;
    }
  } else if (buildMode === 'trap') {
    if (removeTree(x, y)) resources.wood += 5;
    if (!addTrap(x, y, resources)) {
      showToast('Cannot build trap');
      return;
    }
  }
  updateResources(
    resources.stone,
    resources.wood,
    resources.gold,
    resources.essence,
  );
}

canvas.addEventListener('click', handleBuildEvent);
canvas.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse' || e.button === 0) {
    handleBuildEvent(e);
  }
});

function startWave() {
  if (running) return;
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
    updateResources(
      resources.stone,
      resources.wood,
      resources.gold,
      resources.essence,
    );
    resetHeatmap();
  });
}

setupUI(
  startWave,
  () => setBuildMode('wall'),
  () => setBuildMode('gate'),
  () => setBuildMode('tower'),
  () => setBuildMode('trap'),
  toggleDeleteMode,
  openGates,
  closeGates,
  spawnSquadHandler,
  showTechTree,
);
updateResources(
  resources.stone,
  resources.wood,
  resources.gold,
  resources.essence,
);
requestAnimationFrame(gameLoop);
