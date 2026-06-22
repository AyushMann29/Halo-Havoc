const {
  FAIRY_HP,
  FAIRY_SPEED,
  FAIRY_STOP_DISTANCE,
  FAIRY_SHOOT_INTERVAL
} = require("../utils/constants");

class Minion {
  constructor() {
    this.active = false;
    this.id = null;
    this.x = 0;
    this.y = 0;
    this.hp = 0;
    this.targetId = null;
    this.spawnTime = 0;
    this.lastShot = 0;
    this.vx = 0;
    this.vy = 0;
  }

  activate(id, x, y, targetId, spawnTime) {
    this.active = true;
    this.id = id;
    this.x = x;
    this.y = y;
    this.hp = FAIRY_HP;
    this.targetId = targetId;
    this.spawnTime = spawnTime;
    this.lastShot = spawnTime; // start shoot delay from spawn
    this.vx = 0;
    this.vy = 0;
  }

  deactivate() {
    this.active = false;
  }

  update(roomPlayers, now, spawnEnemyBulletFn) {
    if (!this.active) return;

    // Retarget if current target is dead/disconnected
    let target = roomPlayers[this.targetId];
    if (!target || target.health <= 0) {
      const alivePlayers = Object.entries(roomPlayers).filter(([, p]) => p.health > 0);
      if (alivePlayers.length > 0) {
        this.targetId = alivePlayers[Math.floor(Math.random() * alivePlayers.length)][0];
        target = roomPlayers[this.targetId];
      } else {
        return; // No target
      }
    }

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > FAIRY_STOP_DISTANCE) {
      this.x += (dx / dist) * FAIRY_SPEED;
      this.y += (dy / dist) * FAIRY_SPEED;
    }

    // Shoot pattern
    if (now - this.lastShot > FAIRY_SHOOT_INTERVAL) {
      const angle = Math.atan2(dy, dx);
      for (let i = -1; i <= 1; i++) {
        spawnEnemyBulletFn(
          this.x,
          this.y,
          Math.cos(angle + i * 0.2) * 2.5,
          Math.sin(angle + i * 0.2) * 2.5,
          200,
          5,
          true // fromFairy
        );
      }
      this.lastShot = now;
    }
  }

  // Prepares standard JSON state for setup/fallback
  toJSONObject() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      hp: this.hp,
      targetId: this.targetId,
      spawnTime: this.spawnTime,
      lastShot: this.lastShot,
      vx: this.vx,
      vy: this.vy
    };
  }

  // Packs minion state: [id, x, y, hp]
  // Coordinates are rounded to 1 decimal place.
  serialize() {
    return [
      this.id,
      Math.round(this.x * 10) / 10,
      Math.round(this.y * 10) / 10,
      this.hp
    ];
  }
}

module.exports = Minion;
