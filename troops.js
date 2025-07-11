export const squads = [];

export function spawnSquad(type, x, y) {
  const size = 3 + Math.floor(Math.random() * 4); // 3-6
  squads.push({ type, x, y, size, behavior: 'HOLD' });
}

export function updateSquads() {
  // placeholder for squad behavior
}
