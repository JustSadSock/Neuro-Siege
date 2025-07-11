const MAP_SIZE = 64; // 64x64 grid
const TILE_SIZE = 10; // pixels
let buildZoneStart = 22; // 20x20 center area -> start index 22 to 42 for 64 grid
let buildZoneEnd = 42;

let rocks = [];
let trees = [];
let hills = [];

let water = [];
export function generateMap() {
    water = [];
    rocks = [];
    trees = [];
    hills = [];
    for (let i = 0; i < 40; i++) {
        const cell = randomCell();
        if (!inBuildZone(cell.x, cell.y)) rocks.push(cell);
    }
    for (let i = 0; i < 30; i++) {
        const cell = randomCell();
        if (!inBuildZone(cell.x, cell.y)) trees.push(cell);
    }
    for (let i = 0; i < 15; i++) {
        const cell = randomCell();
        hills.push(cell);
    }
    const hy=Math.floor(Math.random()*MAP_SIZE);for(let x=0;x<MAP_SIZE;x++){water.push({x,y:hy});}
    const vx=Math.floor(Math.random()*MAP_SIZE);for(let y=0;y<MAP_SIZE;y++){water.push({x:vx,y});}
}

function randomCell() {
    const x = Math.floor(Math.random() * MAP_SIZE);
    const y = Math.floor(Math.random() * MAP_SIZE);
    return { x, y };
}

export function drawGrid(ctx) {
    ctx.strokeStyle = '#333';
    for (let x = 0; x <= MAP_SIZE; x++) {
        ctx.beginPath();
        ctx.moveTo(x * TILE_SIZE, 0);
        ctx.lineTo(x * TILE_SIZE, MAP_SIZE * TILE_SIZE);
        ctx.stroke();
    }
    for (let y = 0; y <= MAP_SIZE; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * TILE_SIZE);
        ctx.lineTo(MAP_SIZE * TILE_SIZE, y * TILE_SIZE);
        ctx.stroke();
    }
}

export function drawBuildZone(ctx) {
    const width = (buildZoneEnd - buildZoneStart) * TILE_SIZE;
    const height = width;
    ctx.fillStyle = 'rgba(0, 128, 0, 0.1)';
    ctx.fillRect(buildZoneStart * TILE_SIZE, buildZoneStart * TILE_SIZE, width, height);
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.strokeRect(buildZoneStart * TILE_SIZE, buildZoneStart * TILE_SIZE, width, height);
}

export function drawTerrain(ctx) {
    ctx.fillStyle = '#555';
    rocks.forEach(r => ctx.fillRect(r.x * TILE_SIZE, r.y * TILE_SIZE, TILE_SIZE, TILE_SIZE));
    ctx.fillStyle = "#03a9f4";
    water.forEach(w => ctx.fillRect(w.x * TILE_SIZE, w.y * TILE_SIZE, TILE_SIZE, TILE_SIZE));
    ctx.fillStyle = '#075604';
    trees.forEach(t => ctx.fillRect(t.x * TILE_SIZE, t.y * TILE_SIZE, TILE_SIZE, TILE_SIZE));
    ctx.fillStyle = '#444';
    hills.forEach(h => ctx.fillRect(h.x * TILE_SIZE, h.y * TILE_SIZE, TILE_SIZE, TILE_SIZE));
}

export function inBuildZone(x, y) {
    return (
        x >= buildZoneStart &&
        x < buildZoneEnd &&
        y >= buildZoneStart &&
        y < buildZoneEnd
    );
}

export function isBlocked(x, y) {
    return rocks.some(r => r.x === x && r.y === y);
}

export function getHills() {
    return hills.slice();
}

export function getRocks() {
    return rocks.slice();
}

export function getWater() {
    return water.slice();
}
export function removeTree(x, y) {
    const idx = trees.findIndex(t => t.x === x && t.y === y);
    if (idx !== -1) {
        trees.splice(idx, 1);
        return true;
    }
    return false;
}

export function expandBuildZone() {
    if (buildZoneStart > 12) {
        buildZoneStart -= 5;
        buildZoneEnd += 5;
    }
}

export function getBuildZone() {
    return { start: buildZoneStart, end: buildZoneEnd };
}
