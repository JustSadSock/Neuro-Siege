import { drawGrid, inBuildZone } from './map.js';
import { AIController } from './ai.js';
import { setupUI, updateWave, updateCastleHp, updateResources } from './ui.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 10;
const castle = { x: 32, y: 32, hp: 100 };

const resources = { stone: 100, wood: 150, gold: 200 };

let walls = [];
let buildMode = false;

let wave = 0;
let ai = new AIController();
let running = false;

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

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx);
    drawCastle();
    drawWalls();

    if (running) {
        ai.update(castle, walls);
        ai.draw(ctx, TILE_SIZE);
    }

    updateCastleHp(castle.hp);
    updateResources(resources.stone, resources.wood, resources.gold);
    if (castle.hp > 0) {
        requestAnimationFrame(gameLoop);
    } else {
        ctx.fillStyle = 'white';
        ctx.fillText('Game Over', canvas.width / 2 - 40, canvas.height / 2);
    }
}

function toggleBuildMode() {
    buildMode = !buildMode;
    document.getElementById('buildWallBtn').textContent = buildMode ? 'Cancel Build' : 'Build Wall';
}

canvas.addEventListener('click', (e) => {
    if (!buildMode || running) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
    const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);
    if (!inBuildZone(x, y)) return;
    if (resources.stone >= 10 && !walls.some(w => w.x === x && w.y === y)) {
        walls.push({ x, y, hp: 150 });
        resources.stone -= 10;
        updateResources(resources.stone, resources.wood, resources.gold);
    }
});

function startWave() {
    buildMode = false;
    wave += 1;
    updateWave(wave);
    for (let i = 0; i < wave; i++) {
        ai.spawnEnemy();
    }
    running = true;
}

setupUI(startWave, toggleBuildMode);
updateResources(resources.stone, resources.wood, resources.gold);
requestAnimationFrame(gameLoop);
