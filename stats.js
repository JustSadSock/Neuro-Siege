export let heatmap = Array.from({ length: 64 }, () => Array(64).fill(0));

export function recordEnemyPosition(x, y) {
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  if (cx >= 0 && cy >= 0 && cx < 64 && cy < 64) {
    heatmap[cy][cx] += 1;
  }
}

export function resetHeatmap() {
  heatmap = Array.from({ length: 64 }, () => Array(64).fill(0));
}

export function drawHeatmap(ctx, tileSize) {
  const max = Math.max(...heatmap.flat());
  if (max === 0) return;
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const val = heatmap[y][x];
      if (val > 0) {
        const intensity = val / max;
        ctx.fillStyle = `rgba(255,0,0,${intensity * 0.6})`;
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
  }
}
