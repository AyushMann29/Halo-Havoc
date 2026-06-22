class NetworkManager {
  /**
   * Packs the room's high-frequency tick state into a minimal flat array payload.
   * Compares the current player states against what was last broadcasted to implement delta compression.
   * Applies precision truncation to floating-point coordinates.
   */
  packStateUpdate(room) {
    if (!room.lastSentPlayers) {
      room.lastSentPlayers = {};
    }
    if (!room.sentPlayerIds) {
      room.sentPlayerIds = new Set();
    }

    // 1. Delta Compression for Players
    const packedPlayers = [];
    const currentKeys = Object.keys(room.players);
    
    // Find players who disconnected
    const removedPlayers = [];
    for (const oldId of room.sentPlayerIds) {
      if (!room.players[oldId]) {
        removedPlayers.push(oldId);
        delete room.lastSentPlayers[oldId];
      }
    }
    room.sentPlayerIds = new Set(currentKeys);

    for (const id of currentKeys) {
      const playerObj = room.players[id];
      const serialized = playerObj.serialize();
      const lastSerialized = room.lastSentPlayers[id];

      let changed = !lastSerialized;
      if (lastSerialized) {
        // Compare all attributes to check for updates (skipping socket ID itself)
        for (let i = 1; i < serialized.length; i++) {
          if (serialized[i] !== lastSerialized[i]) {
            changed = true;
            break;
          }
        }
      }

      if (changed) {
        packedPlayers.push(serialized);
        room.lastSentPlayers[id] = serialized;
      }
    }

    // 2. Pack Player Bullets
    // Format: [x, y, specialType, vx, vy, targetX, shooterId, lifespan]
    // where specialType: 0 (normal), 1 (slash), 2 (laser)
    const packedBullets = [];
    for (let i = 0; i < room.bullets.length; i++) {
      const b = room.bullets[i];
      if (!b.active) continue;

      let specialType = 0;
      if (b.special === "slash") specialType = 1;
      else if (b.special === "laser") specialType = 2;

      packedBullets.push([
        Math.round(b.x * 10) / 10,
        Math.round(b.y * 10) / 10,
        specialType,
        Math.round(b.vx * 10) / 10,
        Math.round(b.vy * 10) / 10,
        b.targetX ? Math.round(b.targetX * 10) / 10 : 0,
        b.id,
        b.lifespan
      ]);
    }

    // 3. Pack Enemy Bullets (only visually relevant data)
    // Format: [x, y, size]
    const packedEnemyBullets = [];
    for (let i = 0; i < room.enemyBullets.length; i++) {
      const eb = room.enemyBullets[i];
      if (!eb.active) continue;

      packedEnemyBullets.push([
        Math.round(eb.x * 10) / 10,
        Math.round(eb.y * 10) / 10,
        eb.size || 7
      ]);
    }

    // 4. Pack Boss State (using serialized format)
    const packedBoss = room.boss ? room.boss.serialize() : null;

    // 5. Pack Shield State
    // Format: [x, y, radius, expires]
    const packedShield = room.shield ? [
      Math.round(room.shield.x * 10) / 10,
      Math.round(room.shield.y * 10) / 10,
      room.shield.radius,
      room.shield.expires
    ] : null;

    // 6. Pack Fairies/Minions
    const packedFairies = room.fairiesPool
      ? room.fairiesPool.filter(f => f.active).map(f => f.serialize())
      : [];

    // 7. Pack Skill Effects
    // Format: [typeType (1 = laser, 2 = slash), x, y, targetX, playerId, startTime, duration]
    const packedSkillEffects = room.skillEffects.map(e => {
      const typeNum = e.type === "laser" ? 1 : (e.type === "slash" ? 2 : 0);
      return [
        typeNum,
        Math.round(e.x * 10) / 10,
        Math.round(e.y * 10) / 10,
        e.targetX ? Math.round(e.targetX * 10) / 10 : 0,
        e.playerId,
        e.startTime,
        e.duration
      ];
    });

    return [
      packedPlayers,       // 0
      packedBullets,       // 1
      packedEnemyBullets,   // 2
      packedBoss,          // 3
      room.sharedCharge,   // 4
      packedShield,        // 5
      packedFairies,       // 6
      packedSkillEffects,  // 7
      removedPlayers       // 8
    ];
  }
}

module.exports = new NetworkManager();
