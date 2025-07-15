import { drawHex } from './map.js';

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

export function drawHeatmap(ctx) {
  const max = Math.max(...heatmap.flat());
  if (max === 0) return;
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const val = heatmap[y][x];
      if (val > 0) {
        const intensity = val / max;
        drawHex(ctx, x, y, `rgba(255,0,0,${intensity * 0.6})`);
      }
    }
  }
}

export function getHotspot() {
  const flat = heatmap.flat();
  const max = Math.max(...flat);
  const total = flat.reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  if (max / total > 0.6) {
    const idx = flat.indexOf(max);
    const y = Math.floor(idx / 64);
    const x = idx % 64;
    return { x, y };
  }
  return null;
}
