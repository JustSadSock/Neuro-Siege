export function setupUI(onStartWave, onToggleBuild) {
    const btn = document.getElementById('startBtn');
    btn.addEventListener('click', onStartWave);

    const buildBtn = document.getElementById('buildWallBtn');
    buildBtn.addEventListener('click', onToggleBuild);
}

export function updateWave(wave) {
    document.getElementById('waveCounter').textContent = `Wave: ${wave}`;
}

export function updateCastleHp(hp) {
    document.getElementById('castleHp').textContent = `Castle HP: ${hp}`;
}

export function updateResources(stone, wood, gold) {
    document.getElementById('stone').textContent = `Stone: ${stone}`;
    document.getElementById('wood').textContent = `Wood: ${wood}`;
    document.getElementById('gold').textContent = `Gold: ${gold}`;
}
