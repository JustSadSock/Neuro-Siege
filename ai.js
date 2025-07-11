class Enemy {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.speed = type === 'elite' ? 0.4 : 0.5; // tiles per tick
        this.alive = true;
        this.hp = type === 'elite' ? 30 : 10;
    }

    takeDamage(dmg) {
        this.hp -= dmg;
        if (this.hp <= 0) {
            this.alive = false;
        }
    }

    update(castle, walls, gates, rocks) {
        if (!this.alive) return;
        const startX = Math.floor(this.x);
        const startY = Math.floor(this.y);
        const next = findNextStep(startX, startY, castle, walls, gates, rocks);

        const tx = next.x + 0.5;
        const ty = next.y + 0.5;
        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 0.01) {
            // reached center of cell
            if (next.x === castle.x && next.y === castle.y) {
                castle.hp -= 1;
                this.alive = false;
                return;
            }
        }
        if (dist > 0) {
            const step = Math.min(this.speed, dist);
            this.x += (dx / dist) * step;
            this.y += (dy / dist) * step;
        }
    }

    draw(ctx, tileSize) {
        ctx.fillStyle = this.type === 'elite' ? 'orange' : 'red';
        ctx.fillRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);
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
        const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
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
        // spawn at random edge
        const edge = Math.floor(Math.random() * 4);
        let x, y;
        if (edge === 0) { // top
            x = Math.random() * 64;
            y = 0;
        } else if (edge === 1) { // bottom
            x = Math.random() * 64;
            y = 63;
        } else if (edge === 2) { // left
            x = 0;
            y = Math.random() * 64;
        } else { // right
            x = 63;
            y = Math.random() * 64;
        }
        this.enemies.push(new Enemy(x, y, type));
    }

    update(castle, walls, gates, rocks) {
        const killed = [];
        this.enemies.forEach(e => {
            const prev = e.alive;
            e.update(castle, walls, gates, rocks);
            if (prev && !e.alive) killed.push(e);
        });
        this.enemies = this.enemies.filter(e => e.alive);
        return killed;
    }

    draw(ctx, tileSize) {
        this.enemies.forEach(e => e.draw(ctx, tileSize));
    }
}
