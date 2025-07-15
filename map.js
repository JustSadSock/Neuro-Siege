export const MAP_SIZE = 64; // 64x64 grid
export const TILE_SIZE = 10; // width of a hexagon in pixels
export const HEX_HEIGHT = TILE_SIZE * Math.sqrt(3) / 2;
let buildZoneStart = 22; // 20x20 center area -> start index 22 to 42 for 64 grid
let buildZoneEnd = 42;

let rocks = [];
let trees = [];
let hills = [];

let water = [];
const staticCanvas = document.createElement('canvas');
const staticCtx = staticCanvas.getContext('2d');

function refreshStatic() {
    const width = MAP_SIZE * TILE_SIZE * 0.75 + TILE_SIZE;
    const height = MAP_SIZE * HEX_HEIGHT + HEX_HEIGHT;
    staticCanvas.width = width;
    staticCanvas.height = height;
    staticCtx.clearRect(0, 0, width, height);
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            drawHex(staticCtx, x, y, '#222');
        }
    }
    rocks.forEach(r => drawHex(staticCtx, r.x, r.y, '#555'));
    water.forEach(w => drawHex(staticCtx, w.x, w.y, '#03a9f4'));
    trees.forEach(t => drawHex(staticCtx, t.x, t.y, '#075604'));
    hills.forEach(h => drawHex(staticCtx, h.x, h.y, '#444'));
}
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

    refreshStatic();
}


function drawHex(ctx, x, y, fillStyle) {
    const px = x * TILE_SIZE * 0.75;
    const py = y * HEX_HEIGHT + (x % 2) * (HEX_HEIGHT / 2);
    ctx.beginPath();
    ctx.moveTo(px + TILE_SIZE * 0.25, py);
    ctx.lineTo(px + TILE_SIZE * 0.75, py);
    ctx.lineTo(px + TILE_SIZE, py + HEX_HEIGHT / 2);
    ctx.lineTo(px + TILE_SIZE * 0.75, py + HEX_HEIGHT);
    ctx.lineTo(px + TILE_SIZE * 0.25, py + HEX_HEIGHT);
    ctx.lineTo(px, py + HEX_HEIGHT / 2);
    ctx.closePath();
    if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }
}

export function drawGrid(ctx) {
    ctx.drawImage(staticCanvas, 0, 0);
}

export function drawBuildZone(ctx) {
    ctx.strokeStyle = 'rgba(0,255,0,0.5)';
    for (let y = buildZoneStart; y < buildZoneEnd; y++) {
        for (let x = buildZoneStart; x < buildZoneEnd; x++) {
            drawHex(ctx, x, y, 'rgba(0,128,0,0.1)');
        }
    }
}

export function drawTerrain() {
    /* terrain is pre-rendered to the static canvas */
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

export { drawHex, refreshStatic };
