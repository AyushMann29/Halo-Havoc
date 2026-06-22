const {
  PLAYER_HURTBOX,
  GRAZE_MARGIN
} = require("../utils/constants");

class CollisionManager {
  constructor(cellSize = 50) {
    this.cellSize = cellSize;
  }

  /**
   * Run spatial hashing collision detection for enemy bullets against players.
   * Maps players to cells and checks bullets against players in adjacent cells.
   */
  checkEnemyBulletCollisions(enemyBullets, players, shield, now, stateContext) {
    const grid = {};
    const cellSize = this.cellSize;

    // 1. Populate players in grid
    for (const id in players) {
      const p = players[id];
      if (p.health <= 0) continue;

      const cellX = Math.floor(p.x / cellSize);
      const cellY = Math.floor(p.y / cellSize);
      const key = `${cellX},${cellY}`;

      if (!grid[key]) {
        grid[key] = [];
      }
      grid[key].push({ id, p });
    }

    // 2. Iterate and update each active bullet
    for (let i = 0; i < enemyBullets.length; i++) {
      const b = enemyBullets[i];
      if (!b.active) continue;

      // Update position (physics)
      b.x += b.vx;
      b.y += b.vy;
      b.lifespan--;

      if (b.bounce) {
        const ARENA_W = 800;
        const ARENA_H = 600;
        if (b.x < 0 || b.x > ARENA_W) b.vx *= -1;
        if (b.y < 0 || b.y > ARENA_H) b.vy *= -1;
      }

      // Check lifespan expiration
      if (b.lifespan <= 0) {
        b.active = false;
        continue;
      }

      // 3. Collision calculations using spatial hashing
      const bHitRadius = Math.max(2, (b.size || 7) * 0.35);
      const hitDist = PLAYER_HURTBOX + bHitRadius;
      const grazeDist = hitDist + GRAZE_MARGIN;

      const bCellX = Math.floor(b.x / cellSize);
      const bCellY = Math.floor(b.y / cellSize);

      // Check 9 neighboring cells
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const key = `${bCellX + dx},${bCellY + dy}`;
          const cellPlayers = grid[key];
          if (!cellPlayers) continue;

          for (const { id, p } of cellPlayers) {
            const diffX = b.x - p.x;
            const diffY = b.y - p.y;
            const dist = Math.sqrt(diffX * diffX + diffY * diffY);
            const insideShield = shield && dist < shield.radius;

            // Graze check
            if (dist >= hitDist && dist < grazeDist && now > p.grazeCooldown) {
              p.grazeCooldown = now + 100;
              stateContext.sharedCharge++;
            }

            // Hit check
            if (dist < hitDist && now > p.invincibleUntil && !insideShield && p.health > 0 && !(p.cheats && p.cheats.godMode)) {
              p.health--;
              p.invincibleUntil = now + 2000;
            }
          }
        }
      }
    }
  }
}

module.exports = new CollisionManager();
