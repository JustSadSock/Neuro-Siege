export function setupUI(onStartWave, onBuildWall, onBuildGate, onBuildTower, onOpenGate, onCloseGate) {
    const btn = document.getElementById('startBtn');
    btn.addEventListener('click', onStartWave);

    const buildBtn = document.getElementById('buildWallBtn');
    buildBtn.addEventListener('click', onBuildWall);

    const gateBtn = document.getElementById('buildGateBtn');
    gateBtn.addEventListener('click', onBuildGate);

    const towerBtn = document.getElementById('buildTowerBtn');
    towerBtn.addEventListener('click', onBuildTower);

    document.getElementById('openGateBtn').addEventListener('click', onOpenGate);
    document.getElementById('closeGateBtn').addEventListener('click', onCloseGate);
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
