export const MAP_SIZE = 64; // 64x64 grid
export const TILE_SIZE = 10; // pixels
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

    const base = Array.from({ length: MAP_SIZE }, () =>
        Array.from({ length: MAP_SIZE }, () => Math.random())
    );

    for (let y = 1; y < MAP_SIZE - 1; y++) {
        for (let x = 1; x < MAP_SIZE - 1; x++) {
            let sum = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    sum += base[y + dy][x + dx];
                }
            }
            base[y][x] = sum / 9;
        }
    }

    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            if (inBuildZone(x, y)) continue;
            const v = base[y][x];
            if (v < 0.2) {
                water.push({ x, y });
            } else if (v < 0.35) {
                rocks.push({ x, y });
            } else if (v < 0.6) {
                trees.push({ x, y });
            } else if (v < 0.75) {
                hills.push({ x, y });
            }
        }
    }
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

export function isWater(x, y) {
    return water.some((w) => w.x === x && w.y === y);
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
        buildZoneStart = Math.max(12, buildZoneStart - 5);
        buildZoneEnd = Math.min(MAP_SIZE - 12, buildZoneEnd + 5);
    }
}

export function getBuildZone() {
    return { start: buildZoneStart, end: buildZoneEnd };
}
