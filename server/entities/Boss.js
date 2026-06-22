const {
  ARENA_W,
  BOSS_Y,
  BOSS_RADIUS,
  BOSS_BASE_HP,
  BOSS_SCALE_PER_PLAYER,
  BOSS_FRACTIONS
} = require("../utils/constants");

class Boss {
  constructor(bossIndex, playerCount) {
    this.bossIndex = bossIndex;
    const totalHP = BOSS_BASE_HP + BOSS_SCALE_PER_PLAYER * playerCount;
    const hp = Math.floor(totalHP * BOSS_FRACTIONS[bossIndex]);

    this.maxHealth = hp;
    this.currentHealth = hp;

    if (bossIndex === 2) {
      const perBossHP = Math.floor(hp / 3);
      this.isMultiBoss = true;
      this.bosses = [
        {
          id: 0,
          x: ARENA_W * 0.25,
          y: BOSS_Y + 30,
          radius: 35,
          targetX: ARENA_W * 0.25,
          pauseTimer: 0,
          vx: 0,
          color: [240, 50, 50],
          hp: perBossHP
        },
        {
          id: 1,
          x: ARENA_W * 0.5,
          y: BOSS_Y,
          radius: 35,
          targetX: ARENA_W * 0.5,
          pauseTimer: 0,
          vx: 0,
          color: [240, 150, 50],
          hp: perBossHP
        },
        {
          id: 2,
          x: ARENA_W * 0.75,
          y: BOSS_Y + 30,
          radius: 35,
          targetX: ARENA_W * 0.75,
          pauseTimer: 0,
          vx: 0,
          color: [200, 50, 200],
          hp: perBossHP
        }
      ];
    } else {
      this.isMultiBoss = false;
      this.x = ARENA_W / 2;
      this.y = BOSS_Y;
      this.radius = BOSS_RADIUS;
      this.targetX = ARENA_W / 2;
      this.pauseTimer = 0;
      this.vx = 0;
    }
  }

  update(bossIndex) {
    const bossMul = 1 + bossIndex * 0.3;

    if (this.isMultiBoss) {
      for (const mb of this.bosses) {
        if (mb.hp <= 0) continue;
        if (mb.pauseTimer > 0) {
          mb.pauseTimer--;
        } else {
          const dx = mb.targetX - mb.x;
          if (Math.abs(dx) < 2) {
            mb.targetX = Math.random() * (ARENA_W - 100) + 50;
            mb.pauseTimer = Math.floor(Math.random() * 30) + 10;
            mb.vx = 0;
          } else {
            const speedMul = 1.5;
            const speed = (1.2 + Math.random() * 0.8) * bossMul * speedMul;
            mb.vx = Math.sign(dx) * Math.min(speed, Math.abs(dx) * 0.12);
            mb.x += mb.vx;
          }
        }
      }
    } else {
      if (this.pauseTimer > 0) {
        this.pauseTimer--;
      } else {
        const dx = this.targetX - this.x;
        if (Math.abs(dx) < 2) {
          this.targetX = Math.random() * (ARENA_W - 100) + 50;
          this.pauseTimer = Math.floor(Math.random() * 30) + 10;
          this.vx = 0;
        } else {
          const speedMul = 1 + bossIndex * 0.4;
          const speed = (0.8 + Math.random() * 0.5) * bossMul * speedMul;
          this.vx = Math.sign(dx) * Math.min(speed, Math.abs(dx) * 0.1);
          this.x += this.vx;
        }
      }
    }
  }

  shoot(players, now, spawnEnemyBulletFn) {
    if (this.isMultiBoss) {
      for (const mb of this.bosses) {
        if (mb.hp <= 0) continue;
        if (Math.random() < 0.08) {
          const targets = Object.values(players).filter(pl => pl.health > 0);
          if (targets.length > 0) {
            const t = targets[Math.floor(Math.random() * targets.length)];
            const a = Math.atan2(t.y - mb.y, t.x - mb.x);
            for (let i = -2; i <= 2; i++) {
              const s = 3.5 + Math.random() * 3;
              spawnEnemyBulletFn(
                mb.x, mb.y,
                Math.cos(a + i * 0.15) * s,
                Math.sin(a + i * 0.15) * s,
                250,
                5 + Math.random() * 3,
                false, // fromFairy
                false  // bounce
              );
            }
          }
          if (Math.random() < 0.4) {
            const spiralAngle = now * 0.004 + mb.id * 2;
            for (let arm = 0; arm < 4; arm++) {
              const angle = spiralAngle + arm * Math.PI / 2;
              const speed = 3 + Math.random() * 2;
              spawnEnemyBulletFn(
                mb.x, mb.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                300,
                6,
                false,
                false
              );
            }
          }
        }
      }
    } else if (Math.random() < 0.06) {
      if (this.bossIndex === 0) {
        // Fan Spread: sweeping arc that rotates
        const fanDir = Math.sin(now * 0.002);
        const baseAngle = Math.PI / 2 + fanDir * 0.6;
        const spread = Math.PI / 4;
        const numBullets = 6 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numBullets; i++) {
          const angle = baseAngle + (i / (numBullets - 1) - 0.5) * spread;
          const speed = 2.5 + Math.random() * 2.5;
          spawnEnemyBulletFn(
            this.x, this.y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            300,
            4 + Math.random() * 3,
            false,
            false
          );
        }
        if (Math.random() < 0.3) {
          const targets = Object.values(players).filter(pl => pl.health > 0);
          if (targets.length > 0) {
            const t = targets[Math.floor(Math.random() * targets.length)];
            const a = Math.atan2(t.y - this.y, t.x - this.x);
            for (let i = -2; i <= 2; i++) {
              const s = 3.5 + Math.random() * 2.5;
              spawnEnemyBulletFn(
                this.x, this.y,
                Math.cos(a + i * 0.12) * s,
                Math.sin(a + i * 0.12) * s,
                250,
                5,
                false,
                false
              );
            }
          }
        }
      } else if (this.bossIndex === 1) {
        // Crystal Prison: hexagonal bursts + tracking shards
        const numRings = 2;
        for (let r = 0; r < numRings; r++) {
          const baseAngle = now * 0.001 + r * Math.PI / 6;
          for (let i = 0; i < 6; i++) {
            const angle = baseAngle + i * Math.PI / 3;
            const speed = 2.5 + r * 1.5;
            spawnEnemyBulletFn(
              this.x, this.y,
              Math.cos(angle) * speed,
              Math.sin(angle) * speed,
              300,
              6 + Math.random() * 2,
              false,
              false
            );
          }
        }
        if (Math.random() < 0.25) {
          const targets = Object.values(players).filter(pl => pl.health > 0);
          if (targets.length > 0) {
            const t = targets[Math.floor(Math.random() * targets.length)];
            const a = Math.atan2(t.y - this.y, t.x - this.x);
            for (let i = -1; i <= 1; i++) {
              const s = 4.5;
              spawnEnemyBulletFn(
                this.x, this.y,
                Math.cos(a + i * 0.1) * s,
                Math.sin(a + i * 0.1) * s,
                200,
                8,
                false,
                false
              );
            }
          }
        }
      }
    }
  }

  // Prepares the boss data for standard JSON representation
  toJSONObject() {
    if (this.isMultiBoss) {
      return {
        isMultiBoss: true,
        maxHealth: this.maxHealth,
        currentHealth: this.currentHealth,
        bosses: this.bosses
      };
    }
    return {
      isMultiBoss: false,
      x: this.x,
      y: this.y,
      radius: this.radius,
      maxHealth: this.maxHealth,
      currentHealth: this.currentHealth,
      targetX: this.targetX,
      pauseTimer: this.pauseTimer,
      vx: this.vx
    };
  }

  // Packs boss state:
  // Single: [0, x, y, radius, currentHealth, maxHealth, bossIndex]
  // Multi:  [1, [[id, x, y, radius, color, hp], ...], currentHealth, maxHealth, bossIndex]
  // Coordinates are rounded to 1 decimal place.
  serialize() {
    if (this.isMultiBoss) {
      const packedBosses = this.bosses.map(mb => [
        mb.id,
        Math.round(mb.x * 10) / 10,
        Math.round(mb.y * 10) / 10,
        mb.radius,
        mb.color,
        mb.hp
      ]);
      return [
        1,
        packedBosses,
        this.currentHealth,
        this.maxHealth,
        this.bossIndex
      ];
    } else {
      return [
        0,
        Math.round(this.x * 10) / 10,
        Math.round(this.y * 10) / 10,
        this.radius,
        this.currentHealth,
        this.maxHealth,
        this.bossIndex
      ];
    }
  }
}

module.exports = Boss;
