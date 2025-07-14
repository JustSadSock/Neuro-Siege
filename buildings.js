import {
  COSTS,
  canAfford,
  spendResources,
  refundResources,
} from './economy.js';

export const walls = [];
export const gates = [];
export const towers = [];
export const traps = [];

export const gateCooldown = { value: 0 };

export function hasBuilding(x, y) {
  return (
    walls.some((w) => w.x === x && w.y === y) ||
    gates.some((g) => g.x === x && g.y === y) ||
    towers.some((t) => t.x === x && t.y === y) ||
    traps.some((t) => t.x === x && t.y === y)
  );
}

export function canPlaceWall(wave) {
  return walls.length < 40 + 10 * wave;
}

export function canPlaceTower(wave) {
  return towers.length < 5 + wave;
}

export function addWall(x, y, resources, wave) {
  if (!canPlaceWall(wave) || !canAfford(resources, COSTS.wall)) return false;
  walls.push({ x, y, hp: 150 });
  spendResources(resources, COSTS.wall);
  return true;
}

export function addGate(x, y, resources) {
  if (!canAfford(resources, COSTS.gate)) return false;
  gates.push({ x, y, hp: 100, open: false });
  spendResources(resources, COSTS.gate);
  return true;
}

export function addTower(x, y, resources, wave) {
  if (!canPlaceTower(wave) || !canAfford(resources, COSTS.tower)) return false;
  towers.push({
    x,
    y,
    level: 1,
    range: 4,
    rate: 72,
    cooldown: 0,
    type: 'crossbow',
  });
  spendResources(resources, COSTS.tower);
  return true;
}

export function addTrap(x, y, resources) {
  if (!canAfford(resources, COSTS.trap)) return false;
  traps.push({ x, y });
  spendResources(resources, COSTS.trap);
  return true;
}

export function removeBuilding(x, y, resources) {
  let idx = walls.findIndex((w) => w.x === x && w.y === y);
  if (idx !== -1) {
    walls.splice(idx, 1);
    refundResources(resources, COSTS.wall);
    return true;
  }
  idx = gates.findIndex((g) => g.x === x && g.y === y);
  if (idx !== -1) {
    gates.splice(idx, 1);
    refundResources(resources, COSTS.gate);
    return true;
  }
  idx = towers.findIndex((t) => t.x === x && t.y === y);
  if (idx !== -1) {
    towers.splice(idx, 1);
    refundResources(resources, COSTS.tower);
    return true;
  }
  idx = traps.findIndex((t) => t.x === x && t.y === y);
  if (idx !== -1) {
    traps.splice(idx, 1);
    refundResources(resources, COSTS.trap);
    return true;
  }
  return false;
}

export function openGates() {
  if (gateCooldown.value > 0) return false;
  gates.forEach((g) => (g.open = true));
  gateCooldown.value = 600;
  return true;
}

export function closeGates() {
  if (gateCooldown.value > 0) return false;
  gates.forEach((g) => (g.open = false));
  gateCooldown.value = 600;
  return true;
}

export function tickCooldown() {
  if (gateCooldown.value > 0) gateCooldown.value -= 1;
}
