const MAP_SIZE = 64; // 64x64 grid
const TILE_SIZE = 10; // pixels
let buildZoneStart = 22; // 20x20 center area -> start index 22 to 42 for 64 grid
let buildZoneEnd = 42;

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

export function inBuildZone(x, y) {
    return (
        x >= buildZoneStart &&
        x < buildZoneEnd &&
        y >= buildZoneStart &&
        y < buildZoneEnd
    );
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
