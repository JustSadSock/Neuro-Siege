class Enemy {
    constructor(x, y, type = 'normal', size = 1) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = size;
        // base movement speed (slower for realism)
        this.baseSpeed = type === 'elite' ? 0.04 : 0.05;
        this.speed = this.baseSpeed; // current speed
        this.slowTimer = 0;
        this.alive = true;
        this.maxHp = type === 'elite' ? 30 : 10;
        this.hp = this.maxHp;
        this.score = 0;
        this.attackCooldown = 0;
        this.atCastle = false;
    }

    takeDamage(dmg) {
        this.hp -= dmg;
        this.score += 10;
        if (this.hp <= 0) {
            this.alive = false;
        }
    }

    update(castle, walls, gates, rocks, water) {
        if (!this.alive) return;
        this.score += 1 / 60;
        if (this.slowTimer > 0) {
            this.slowTimer -= 1;
            this.speed = this.baseSpeed * 0.5;
        } else {
            this.speed = this.baseSpeed;
        }
        if (this.atCastle) {
            if (this.attackCooldown <= 0) {
                castle.hp -= 1;
                this.attackCooldown = 60;
            } else {
                this.attackCooldown -= 1;
            }
            return;
        }

        const startX = Math.floor(this.x);
        const startY = Math.floor(this.y);
        const next = findNextStep(startX, startY, castle, walls, gates, rocks);

        const tx = next.x + 0.5;
        const ty = next.y + 0.5;
        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 0.01 && next.x === castle.x && next.y === castle.y) {
            this.atCastle = true;
            return;
        }
        if (dist > 0) {
            let speed = this.speed;
            if (water && water.some(w => w.x === Math.floor(this.x) && w.y === Math.floor(this.y))) speed *= 0.5;
            const step = Math.min(speed, dist);
            this.x += (dx / dist) * step;
            this.y += (dy / dist) * step;
        }
    }

    draw(ctx, tileSize) {
        const sizePx = tileSize * this.size;
        const px = this.x * tileSize * 0.75;
        const py = this.y * tileSize + (Math.floor(this.x) % 2) * (tileSize / 2);
        const cx = px + sizePx / 2;
        const cy = py + sizePx / 2;
        ctx.fillStyle = this.type === 'elite' ? 'orange' : 'red';
        ctx.beginPath();
        ctx.arc(cx, cy, sizePx / 2, 0, Math.PI * 2);
        ctx.fill();

        // inner health bar
        const barWidth = sizePx * 0.8;
        const barHeight = 2;
        const hpRatio = this.hp / this.maxHp;
        ctx.fillStyle = 'black';
        ctx.fillRect(cx - barWidth / 2, cy - barHeight / 2, barWidth, barHeight);
        ctx.fillStyle = 'lime';
        ctx.fillRect(cx - barWidth / 2, cy - barHeight / 2, barWidth * hpRatio, barHeight);
    }
}

function isBlockedCell(x, y, walls, gates) {
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    if (walls.some(w => w.x === tx && w.y === ty)) return true;
    if (gates.some(g => !g.open && g.x === tx && g.y === ty)) return true;
    return false;
}

function findNextStep(sx, sy, castle, walls, gates, rocks) {
    const targetX = castle.x;
    const targetY = castle.y;
    const startKey = `${sx},${sy}`;
    const blocked = new Set();
    walls.forEach(w => blocked.add(`${w.x},${w.y}`));
    gates.filter(g => !g.open).forEach(g => blocked.add(`${g.x},${g.y}`));
    rocks.forEach(r => blocked.add(`${r.x},${r.y}`));
    const queue = [[sx, sy]];
    const visited = new Set([startKey]);
    const parent = {};
    let found = false;
    while (queue.length && !found) {
        const [cx, cy] = queue.shift();
        if (cx === targetX && cy === targetY) {
            found = true;
            break;
        }
        const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]];
        for (const [dx, dy] of dirs) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= 64 || ny >= 64) continue;
            const key = `${nx},${ny}`;
            if (blocked.has(key) || visited.has(key)) continue;
            visited.add(key);
            parent[key] = `${cx},${cy}`;
            queue.push([nx, ny]);
        }
    }
    let key = `${targetX},${targetY}`;
    if (!parent[key]) return { x: sx, y: sy };
    while (parent[key] && parent[key] !== startKey) {
        key = parent[key];
    }
    const [nx, ny] = key.split(',').map(Number);
    return { x: nx, y: ny };
}

export class AIController {
    constructor() {
        this.enemies = [];
    }

    spawnEnemy(type = 'normal') {
        // spawn a single enemy at a random edge position
        const edge = Math.floor(Math.random() * 4);
        let x, y;
        if (edge === 0) {
            x = Math.random() * 64;
            y = 0;
        } else if (edge === 1) {
            x = Math.random() * 64;
            y = 63;
        } else if (edge === 2) {
            x = 0;
            y = Math.random() * 64;
        } else {
            x = 63;
            y = Math.random() * 64;
        }
        this.enemies.push(new Enemy(x, y, type, 0.5));
    }

    update(castle, walls, gates, rocks, water) {
        const killed = [];
        this.enemies.forEach((e) => {
            const prev = e.alive;
            e.update(castle, walls, gates, rocks, water);
            if (prev && !e.alive) {
                e.score += 100;
                killed.push(e);
            }
        });
        this.enemies = this.enemies.filter(e => e.alive);
        return killed;
    }

    draw(ctx, tileSize) {
        this.enemies.forEach(e => e.draw(ctx, tileSize));
    }
}
