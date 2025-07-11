class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 0.5; // tiles per tick
        this.alive = true;
    }

    update(castle) {
        const dx = castle.x - this.x;
        const dy = castle.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 0.1) {
            castle.hp -= 1;
            this.alive = false;
            return;
        }
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
    }

    draw(ctx, tileSize) {
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);
    }
}

export class AIController {
    constructor() {
        this.enemies = [];
    }

    spawnEnemy() {
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
        this.enemies.push(new Enemy(x, y));
    }

    update(castle) {
        this.enemies.forEach(e => e.update(castle));
        this.enemies = this.enemies.filter(e => e.alive);
    }

    draw(ctx, tileSize) {
        this.enemies.forEach(e => e.draw(ctx, tileSize));
    }
}
