export function setupUI(
  onStartWave,
  onBuildWall,
  onBuildGate,
  onBuildTower,
  onDelete,
  onOpenGate,
  onCloseGate,
  onSpawnSquad,
  onShowTech,
) {
    const btn = document.getElementById('startBtn');
    btn.addEventListener('click', onStartWave);

    const spawnBtn = document.getElementById('spawnSquadBtn');
    if (spawnBtn) spawnBtn.addEventListener('click', onSpawnSquad);

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
    const techBtn = document.getElementById('techBtn');
    if (techBtn) techBtn.addEventListener('click', onShowTech);

  const sheetToggle = document.getElementById('sheetToggle');
  if (sheetToggle) {
      sheetToggle.addEventListener('click', () => {
          const sheet = document.getElementById('bottomSheet');
          if (sheet?.classList.contains('is-open')) {
              closeSheet();
          } else {
              openSheet();
          }
      });

      const toggle = (id) => {
          document.querySelectorAll('.submenu').forEach(el => el.classList.remove('is-shown'));
          const el = document.getElementById(id);
          if (el) el.classList.add('is-shown');
      };

      const groupWalls = document.getElementById('groupWalls');
      const groupTowers = document.getElementById('groupTowers');
      const groupArmy = document.getElementById('groupArmy');
      groupWalls?.addEventListener('click', () => toggle('submenuWalls'));
      groupTowers?.addEventListener('click', () => toggle('submenuTowers'));
      groupArmy?.addEventListener('click', () => toggle('submenuArmy'));
  }

    const menuBtn = document.getElementById('menuBtn');
    menuBtn.addEventListener('click', () => {
        const menu = document.getElementById('sideMenu');
        menu.classList.toggle('is-shown');
    });

  const analyticsBtn = document.getElementById('analyticsBtn');
  analyticsBtn.addEventListener('click', () => {
      showStatsPanel('<p>Heatmap</p>');
  });

}

export function showModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('is-hidden');
    el.classList.add('is-shown');
  }
}

export function hideModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('is-hidden');
    el.classList.remove('is-shown');
  }
  document.getElementById('gameCanvas')?.focus();
}

export function openSheet() {
  document.getElementById('bottomSheet')?.classList.add('is-open');
}

export function closeSheet() {
  document.getElementById('bottomSheet')?.classList.remove('is-open');
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
  showStatsPanel(`<p id="summaryText">${text}</p>`, onContinue);
}


export function showStatsPanel(html, onContinue) {
  const container = document.getElementById('statsContent');
  const btn = document.getElementById('statsContinue');
  const close = document.getElementById('modalCloseBtn');
  container.innerHTML = html;
  const handler = () => {
    hideModal('modalOverlay');
    btn.removeEventListener('click', handler);
    close.removeEventListener('click', handler);
    if (onContinue) onContinue();
  };
  btn.addEventListener('click', handler);
  close.addEventListener('click', handler);
  showModal('modalOverlay');
}

export function showTechTree() {
  const html = `
    <h3>Tech Tree</h3>
    <div class="tech-tree">
      <div class="tech-node">Walls</div>
      <div class="tech-node">Gates</div>
      <div class="tech-node">Towers</div>
    </div>
  `;
  showStatsPanel(html);
}
