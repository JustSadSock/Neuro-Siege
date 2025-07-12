export function setupUI(
  onStartWave,
  onBuildWall,
  onBuildGate,
  onBuildTower,
  onDelete,
  onOpenGate,
  onCloseGate,
) {
    const btn = document.getElementById('startBtn');
    btn.addEventListener('click', onStartWave);

    const buildBtn = document.getElementById('buildWallBtn');
    buildBtn.addEventListener('click', onBuildWall);

    const gateBtn = document.getElementById('buildGateBtn');
    gateBtn.addEventListener('click', onBuildGate);

    const towerBtn = document.getElementById('buildTowerBtn');
    towerBtn.addEventListener('click', onBuildTower);

    const deleteBtn = document.getElementById('deleteBtn');
    deleteBtn.addEventListener('click', onDelete);

    document.getElementById('openGateBtn').addEventListener('click', onOpenGate);
    document.getElementById('closeGateBtn').addEventListener('click', onCloseGate);
}

export function updateWave(wave) {
    document.getElementById('waveCounter').textContent = `Wave: ${wave}`;
}

export function updateCastleHp(hp) {
    document.getElementById('castleHp').textContent = `Castle HP: ${hp}`;
}

export function updateResources(stone, wood, gold, essence) {
    document.getElementById('stone').textContent = `Stone: ${stone}`;
    document.getElementById('wood').textContent = `Wood: ${wood}`;
    document.getElementById('gold').textContent = `Gold: ${gold}`;
    document.getElementById('essence').textContent = `Essence: ${essence}`;
}

export function showSummary(text, onContinue) {
    const overlay = document.getElementById('summary');
    const p = document.getElementById('summaryText');
    const btn = document.getElementById('continueBtn');
    p.textContent = text;
    overlay.classList.remove('hidden');
    btn.onclick = () => {
        overlay.classList.add('hidden');
        if (onContinue) onContinue();
    };
}


export function showStatsPanel(html, onContinue) {
  const panel = document.getElementById('statsPanel');
  const container = document.getElementById('statsContent');
  const btn = document.getElementById('statsContinue');
  container.innerHTML = html;
  panel.classList.remove('hidden');
  btn.onclick = () => {
    panel.classList.add('hidden');
    if (onContinue) onContinue();
  };
}
