const { ARENA_W, ARENA_H } = require("../utils/constants");

class Player {
  constructor(id, className, x, y, hp) {
    this.id = id;
    this.className = className;
    this.x = x;
    this.y = y;
    this.health = hp;
    this.maxHealth = hp;
    this.invincibleUntil = 0;
    this.grazeCooldown = 0;
    this.skillCooldownUntil = 0;
    this.cheats = {
      godMode: false,
      infiniteCharges: false,
      megaDamage: false
    };
  }

  move(newX, newY) {
    if (typeof newX === "number" && typeof newY === "number") {
      this.x = Math.max(20, Math.min(ARENA_W - 20, newX));
      this.y = Math.max(20, Math.min(ARENA_H - 20, newY));
    }
  }

  // Prepares the player data for JSON/broadcast
  toJSONObject() {
    return {
      x: this.x,
      y: this.y,
      className: this.className,
      health: this.health,
      maxHealth: this.maxHealth,
      invincibleUntil: this.invincibleUntil,
      grazeCooldown: this.grazeCooldown,
      skillCooldownUntil: this.skillCooldownUntil,
      cheats: this.cheats
    };
  }

  // Pack player into a flat array: [id, x, y, className, health, maxHealth, invincibleUntil, grazeCooldown, skillCooldownUntil]
  // Coordinates are rounded to 1 decimal place
  serialize() {
    return [
      this.id,
      Math.round(this.x * 10) / 10,
      Math.round(this.y * 10) / 10,
      this.className,
      this.health,
      this.maxHealth,
      this.invincibleUntil,
      this.grazeCooldown,
      this.skillCooldownUntil
    ];
  }
}

module.exports = Player;
