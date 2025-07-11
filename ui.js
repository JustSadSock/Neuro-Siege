export function setupUI(onStartWave) {
    const btn = document.getElementById('startBtn');
    btn.addEventListener('click', onStartWave);
}

export function updateWave(wave) {
    document.getElementById('waveCounter').textContent = `Wave: ${wave}`;
}

export function updateCastleHp(hp) {
    document.getElementById('castleHp').textContent = `Castle HP: ${hp}`;
}
