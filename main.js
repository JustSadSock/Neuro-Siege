import { drawGrid } from './map.js';
import { AIController } from './ai.js';
import { setupUI, updateWave, updateCastleHp } from './ui.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 10;
const castle = { x: 32, y: 32, hp: 100 };

let wave = 0;
let ai = new AIController();
let running = false;

function drawCastle() {
    ctx.fillStyle = 'blue';
    ctx.fillRect(castle.x * TILE_SIZE, castle.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx);
    drawCastle();

    if (running) {
        ai.update(castle);
        ai.draw(ctx, TILE_SIZE);
    }

    updateCastleHp(castle.hp);
    if (castle.hp > 0) {
        requestAnimationFrame(gameLoop);
    } else {
        ctx.fillStyle = 'white';
        ctx.fillText('Game Over', canvas.width / 2 - 40, canvas.height / 2);
    }
}

function startWave() {
    wave += 1;
    updateWave(wave);
    ai.spawnEnemy();
    running = true;
}

setupUI(startWave);
requestAnimationFrame(gameLoop);
