export const storage = {
  stone: 500,
  wood: 500,
  gold: 500,
  essence: 100
};

export function applyWaveRewards(state) {
  const { kills, wallsIntact, wallsTotal, wallDamagePercent, eliteKills, squads } = state;
  const gold = 10 * kills + 5 * squads;
  const wood = Math.floor((wallsIntact / wallsTotal) * 80);
  const stone = Math.floor((1 - wallDamagePercent) * 100);
  const essence = eliteKills;
  state.resources.gold = Math.min(state.resources.gold + gold, storage.gold);
  state.resources.wood = Math.min(state.resources.wood + wood, storage.wood);
  state.resources.stone = Math.min(state.resources.stone + stone, storage.stone);
  state.resources.essence += essence;
}
