const MAP_SIZE = 64; // 64x64 grid
const TILE_SIZE = 10; // pixels
const BUILD_ZONE_START = 22; // 20x20 center area -> start index 22 to 42 for 64 grid
const BUILD_ZONE_END = 42;

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
        x >= BUILD_ZONE_START &&
        x < BUILD_ZONE_END &&
        y >= BUILD_ZONE_START &&
        y < BUILD_ZONE_END
    );
}
