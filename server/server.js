const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const {
  ARENA_W,
  ARENA_H,
  BOSS_Y,
  BOSS_RADIUS,
  FIRST_FAIRY_WAVE_DELAY,
  FAIRY_WAVE_INTERVAL,
  FAIRY_LIFETIME,
  FAIRY_CHARGE_REWARD,
  SKILL_COSTS,
  SKILL_COOLDOWNS,
  BOMB_COST,
  BOSS_NAMES,
  BOSS_TITLES,
  playerStats
} = require("./utils/constants");

const Player = require("./entities/Player");
const Boss = require("./entities/Boss");
const Minion = require("./entities/Minion");
const CollisionManager = require("./systems/CollisionManager");
const NetworkManager = require("./systems/NetworkManager");

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',').map(s => s.replace(/\/+$/, ''));

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"] }
});

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

const rooms = {};

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  } while (rooms[code]);
  return code;
}

function spawnFairyWave(room) {
  const playerCount = Object.keys(room.players).length;
  const numFairies = 2 * playerCount;
  const now = Date.now();
  const players = Object.values(room.players);
  if (players.length === 0) return;

  for (let i = 0; i < numFairies; i++) {
    const edge = Math.floor(Math.random() * 3);
    let x, y;
    if (edge === 0) {
      x = Math.random() * ARENA_W;
      y = -20;
    } else if (edge === 1) {
      x = -20;
      y = Math.random() * ARENA_H * 0.5;
    } else {
      x = ARENA_W + 20;
      y = Math.random() * ARENA_H * 0.5;
    }

    const target = players[Math.floor(Math.random() * players.length)];
    const targetId = Object.keys(room.players)[players.indexOf(target)];

    // Reuse from fairiesPool (Object Pooling)
    const fairy = room.fairiesPool.find(f => !f.active);
    if (fairy) {
      fairy.activate(`fairy_${now}_${i}`, x, y, targetId, now);
    }
  }
}

function getPlayerList(room) {
  return Object.entries(room.players).map(([id, p]) => ({
    id,
    className: p.className,
    isHost: id === room.hostId
  }));
}

function broadcastPlayerList(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  io.to(roomCode).emit("playerList", { players: getPlayerList(room) });
}

function spawnEnemyBullet(room, x, y, vx, vy, lifespan, size, fromFairy = false, bounce = false) {
  // Reuse from enemyBullets pool (Object Pooling)
  const bullet = room.enemyBullets.find(b => !b.active);
  if (bullet) {
    bullet.active = true;
    bullet.x = x;
    bullet.y = y;
    bullet.vx = vx;
    bullet.vy = vy;
    bullet.lifespan = lifespan;
    bullet.size = size;
    bullet.fromFairy = fromFairy;
    bullet.bounce = bounce;
  }
}

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("createRoom", ({ maxPlayers, password, className }) => {
    const roomCode = generateRoomCode();
    const stats = playerStats[className] || playerStats.Marisa;
    const x = Math.random() * (ARENA_W - 80) + 40;
    const y = Math.random() * (ARENA_H * 0.2) + ARENA_H * 0.6;

    rooms[roomCode] = {
      hostId: socket.id,
      password: password || null,
      maxPlayers: Math.min(Math.max(1, maxPlayers || 4), 8),
      isGameStarted: false,
      players: {},
      
      // Object pools (Bullets and Fairies)
      bullets: Array.from({ length: 2000 }, () => ({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        lifespan: 0,
        id: null,
        special: null,
        damage: 0,
        targetX: 0
      })),
      enemyBullets: Array.from({ length: 3000 }, () => ({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        lifespan: 0,
        size: 0,
        fromFairy: false,
        bounce: false
      })),
      fairiesPool: Array.from({ length: 100 }, () => new Minion()),
      
      boss: null,
      bossIndex: 0,
      sharedCharge: 0,
      shield: null,
      gameEnded: false,
      transitionEndTime: 0,
      nextBossIndex: 0,
      fairyWaveTimer: 0,
      skillEffects: [],
      skillCooldowns: {}
    };

    const room = rooms[roomCode];
    room.players[socket.id] = new Player(socket.id, className, x, y, stats.hp);

    socket.join(roomCode);
    socket.data.roomCode = roomCode;

    socket.emit("roomCreated", { roomCode, hostId: socket.id });
    broadcastPlayerList(roomCode);
  });

  socket.on("joinRoom", ({ roomCode, password, className }) => {
    const room = rooms[roomCode];
    if (!room) {
      socket.emit("joinError", { message: "Room not found." });
      return;
    }
    if (room.isGameStarted) {
      socket.emit("joinError", { message: "Game already in progress." });
      return;
    }
    if (Object.keys(room.players).length >= room.maxPlayers) {
      socket.emit("joinError", { message: "Room is full." });
      return;
    }
    if (room.password && room.password !== password) {
      socket.emit("joinError", { message: "Incorrect password." });
      return;
    }

    const stats = playerStats[className] || playerStats.Marisa;
    const x = Math.random() * (ARENA_W - 80) + 40;
    const y = Math.random() * (ARENA_H * 0.2) + ARENA_H * 0.6;

    room.players[socket.id] = new Player(socket.id, className, x, y, stats.hp);

    socket.join(roomCode);
    socket.data.roomCode = roomCode;

    socket.emit("joinSuccess", { hostId: room.hostId, players: getPlayerList(room) });
    broadcastPlayerList(roomCode);
  });

  socket.on("startGame", () => {
    const room = rooms[socket.data.roomCode];
    if (!room || room.hostId !== socket.id || room.isGameStarted) return;

    room.isGameStarted = true;
    room.bossIndex = 0;
    const playerCount = Object.keys(room.players).length;
    room.boss = new Boss(0, playerCount);
    room.fairyWaveTimer = Date.now() + FIRST_FAIRY_WAVE_DELAY;

    io.to(socket.data.roomCode).emit("gameStarted", {
      boss: room.boss ? room.boss.toJSONObject() : null,
      bossIndex: 0,
      bossName: BOSS_NAMES[0],
      bossTitle: BOSS_TITLES[0],
      players: Object.fromEntries(
        Object.entries(room.players).map(([id, p]) => [id, p.toJSONObject()])
      ),
      bullets: room.bullets.filter(b => b.active),
      enemyBullets: room.enemyBullets.filter(b => b.active),
      sharedCharge: room.sharedCharge,
      shield: room.shield
    });
  });

  socket.on("move", ({ x, y }) => {
    const room = rooms[socket.data.roomCode];
    const player = room?.players[socket.id];
    if (player) {
      player.move(x, y);
    }
  });

  socket.on("shoot", (bulletData) => {
    const room = rooms[socket.data.roomCode];
    if (!room) return;
    
    // Reuse from bullets pool (Object Pooling)
    const bullet = room.bullets.find(b => !b.active);
    if (bullet) {
      bullet.active = true;
      bullet.x = bulletData.x;
      bullet.y = bulletData.y;
      bullet.vx = bulletData.vx;
      bullet.vy = bulletData.vy;
      bullet.lifespan = 200;
      bullet.id = socket.id;
      bullet.special = bulletData.special || null;
      bullet.damage = bulletData.damage || 10;
      bullet.targetX = bulletData.targetX || 0;
    }
  });

  socket.on("useAbility", ({ className }) => {
    const room = rooms[socket.data.roomCode];
    const player = room?.players[socket.id];
    if (!player) return;

    const now = Date.now();
    const cost = SKILL_COSTS[className] || 5;
    const cooldown = SKILL_COOLDOWNS[className] || 0;

    if (room.sharedCharge < cost) return;
    if (now < player.skillCooldownUntil) return;

    room.sharedCharge -= cost;
    player.skillCooldownUntil = now + cooldown;

    if (className === "Eirin") {
      for (const id in room.players) {
        const p = room.players[id];
        if (p.health < p.maxHealth) p.health++;
      }
    }

    if (className === "Reimu") {
      room.shield = { x: player.x, y: player.y, radius: 80, expires: now + 5000 };
    }

    if (className === "Youmu") {
      const slashAngles = [-0.4, -0.15, 0.15, 0.4];
      for (const angle of slashAngles) {
        const b = room.bullets.find(bl => !bl.active);
        if (b) {
          b.active = true;
          b.x = player.x;
          b.y = player.y;
          b.vx = Math.sin(angle) * 8;
          b.vy = -10;
          b.lifespan = 30;
          b.id = socket.id;
          b.special = "slash";
          b.damage = 10;
          b.targetX = 0;
        }
      }
      room.skillEffects.push({
        type: "slash",
        x: player.x,
        y: player.y,
        playerId: socket.id,
        startTime: now,
        duration: 1500
      });
    }

    if (className === "Marisa") {
      const targets = Object.values(room.players);
      let targetX = player.x;
      if (targets.length > 0) {
        const t = targets[Math.floor(Math.random() * targets.length)];
        targetX = t.x;
      }
      
      const b = room.bullets.find(bl => !bl.active);
      if (b) {
        b.active = true;
        b.x = player.x;
        b.y = player.y;
        b.vx = 0;
        b.vy = -20;
        b.lifespan = 60;
        b.id = socket.id;
        b.special = "laser";
        b.damage = 100;
        b.targetX = targetX;
      }

      room.skillEffects.push({
        type: "laser",
        x: player.x,
        y: player.y,
        targetX: targetX,
        playerId: socket.id,
        startTime: now,
        duration: 1500
      });
    }
  });

  socket.on("bomb", () => {
    const room = rooms[socket.data.roomCode];
    if (!room || room.sharedCharge < BOMB_COST) return;
    
    room.sharedCharge -= BOMB_COST;
    // Clear enemy bullets in pool
    room.enemyBullets.forEach(b => b.active = false);

    const now = Date.now();
    for (const id in room.players) {
      room.players[id].invincibleUntil = now + 1000;
    }
    io.to(socket.data.roomCode).emit("bombDetonated");
  });

  socket.on("cheat", ({ type, enabled }) => {
    const room = rooms[socket.data.roomCode];
    if (!room) return;
    const player = room.players[socket.id];
    if (!player) return;

    if (type === "godMode") {
      player.cheats.godMode = enabled;
    }
    if (type === "infiniteCharges") {
      player.cheats.infiniteCharges = enabled;
    }
    if (type === "megaDamage") {
      player.cheats.megaDamage = enabled;
    }
  });

  socket.on("disconnect", () => {
    const roomCode = socket.data.roomCode;
    const room = rooms[roomCode];
    if (!room) return;

    delete room.players[socket.id];

    if (room.hostId === socket.id) {
      const remaining = Object.keys(room.players);
      if (remaining.length > 0) {
        room.hostId = remaining[0];
      } else {
        delete rooms[roomCode];
        return;
      }
    }

    if (Object.keys(room.players).length === 0) {
      delete rooms[roomCode];
      return;
    }

    broadcastPlayerList(roomCode);
    console.log("Player disconnected:", socket.id);
  });
});

setInterval(() => {
  for (const roomCode in rooms) {
    const room = rooms[roomCode];
    if (!room.isGameStarted || room.gameEnded) continue;

    const now = Date.now();
    const boss = room.boss;
    const playerCount = Object.keys(room.players).length;

    // Transition: pause all game logic, wait for timer
    if (room.transitionEndTime > 0) {
      if (now >= room.transitionEndTime) {
        room.bossIndex = room.nextBossIndex;
        room.boss = new Boss(room.bossIndex, playerCount);
        room.transitionEndTime = 0;
        room.nextBossIndex = 0;
        for (const id in room.players) {
          room.players[id].invincibleUntil = now + 2000;
        }
        io.to(roomCode).emit("bossSpawned", {
          boss: room.boss ? room.boss.toJSONObject() : null,
          bossIndex: room.bossIndex,
          bossName: BOSS_NAMES[room.bossIndex],
          bossTitle: BOSS_TITLES[room.bossIndex]
        });
      }
      continue;
    }

    if (boss.currentHealth <= 0) {
      const nextIndex = room.bossIndex + 1;
      if (nextIndex >= 3) {
        io.to(roomCode).emit("gameOver", { outcome: "victory" });
        room.gameEnded = true;
        setTimeout(() => delete rooms[roomCode], 5000);
        continue;
      }
      room.transitionEndTime = now + 3000;
      room.nextBossIndex = nextIndex;
      // Reset enemy bullet pool
      room.enemyBullets.forEach(b => b.active = false);
      io.to(roomCode).emit("bossDefeated", { bossIndex: nextIndex, transitioning: true });
      continue;
    }

    const allDead = Object.values(room.players).every(p => p.health <= 0);
    if (allDead && playerCount > 0) {
      io.to(roomCode).emit("gameOver", { outcome: "defeat" });
      room.gameEnded = true;
      setTimeout(() => delete rooms[roomCode], 5000);
      continue;
    }

    if (room.shield && now > room.shield.expires) room.shield = null;

    // Infinite charges cheat
    const hasInfiniteCharges = Object.values(room.players).some(p => p.cheats && p.cheats.infiniteCharges);
    if (hasInfiniteCharges) {
      room.sharedCharge = 999;
    }

    // Update Boss movement
    boss.update(room.bossIndex);

    // Move player bullets + fairy/boss collision (updates active statuses)
    for (let i = 0; i < room.bullets.length; i++) {
      const b = room.bullets[i];
      if (!b.active) continue;

      b.x += b.vx;
      b.y += b.vy;
      b.lifespan--;

      if (b.lifespan <= 0 || b.x < -200 || b.x > ARENA_W + 200 || b.y < -200 || b.y > ARENA_H + 200) {
        b.active = false;
        continue;
      }

      const shooter = room.players[b.id];
      const damage = (shooter && shooter.cheats && shooter.cheats.megaDamage) ? 1000 : 10;

      // Laser collision
      if (b.special === "laser") {
        for (let j = 0; j < room.fairiesPool.length; j++) {
          const fairy = room.fairiesPool[j];
          if (!fairy.active) continue;

          const dx = b.x - fairy.x;
          const dy = b.y - fairy.y;
          if (Math.abs(dx) < 30 && dy < 0 && dy > -ARENA_H) {
            fairy.hp -= b.damage || 100;
            if (fairy.hp <= 0) {
              room.sharedCharge += FAIRY_CHARGE_REWARD;
              fairy.deactivate();
            }
          }
        }

        if (boss.isMultiBoss) {
          for (const mb of boss.bosses) {
            if (mb.hp <= 0) continue;
            const dxB = b.x - mb.x;
            if (Math.abs(dxB) < 30) {
              mb.hp = Math.max(0, mb.hp - (b.damage || 100));
              boss.currentHealth = boss.bosses.reduce((sum, m) => sum + (m.hp > 0 ? m.hp : 0), 0);
            }
          }
        } else {
          const dxB = b.x - boss.x;
          if (Math.abs(dxB) < boss.radius) {
            boss.currentHealth = Math.max(0, boss.currentHealth - (b.damage || 100));
          }
        }
        continue;
      }

      // Normal bullet collision - Fairies
      let hitSomething = false;
      for (let j = 0; j < room.fairiesPool.length; j++) {
        const fairy = room.fairiesPool[j];
        if (!fairy.active) continue;

        const dx = b.x - fairy.x;
        const dy = b.y - fairy.y;
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
          fairy.hp -= damage;
          if (fairy.hp <= 0) {
            room.sharedCharge += FAIRY_CHARGE_REWARD;
            fairy.deactivate();
          }
          hitSomething = true;
          break;
        }
      }

      if (hitSomething) {
        b.active = false;
        continue;
      }

      // Normal bullet collision - Boss
      if (boss.isMultiBoss) {
        for (const mb of boss.bosses) {
          if (mb.hp <= 0) continue;
          const dxB = b.x - mb.x;
          const dyB = b.y - mb.y;
          if (Math.sqrt(dxB * dxB + dyB * dyB) < mb.radius) {
            mb.hp = Math.max(0, mb.hp - damage);
            boss.currentHealth = boss.bosses.reduce((sum, m) => sum + (m.hp > 0 ? m.hp : 0), 0);
            hitSomething = true;
            break;
          }
        }
      } else {
        const dxB = b.x - boss.x;
        const dyB = b.y - boss.y;
        if (Math.sqrt(dxB * dxB + dyB * dyB) < boss.radius) {
          boss.currentHealth = Math.max(0, boss.currentHealth - damage);
          hitSomething = true;
        }
      }

      if (hitSomething) {
        b.active = false;
      }
    }

    // Boss Shooting Patterns (populates enemyBullets pool)
    boss.shoot(room.players, now, (x, y, vx, vy, lifespan, size, fromFairy, bounce) => {
      spawnEnemyBullet(room, x, y, vx, vy, lifespan, size, fromFairy, bounce);
    });

    // Move enemy bullets + collision detection using SPATIAL HASHING
    CollisionManager.checkEnemyBulletCollisions(
      room.enemyBullets,
      room.players,
      room.shield,
      now,
      room
    );

    // Spawn Fairy Wave
    if (room.fairyWaveTimer > 0 && now >= room.fairyWaveTimer) {
      spawnFairyWave(room);
      room.fairyWaveTimer = now + FAIRY_WAVE_INTERVAL;
    }

    // Fairy Logic (updates coordinates & shoot patterns)
    for (let i = 0; i < room.fairiesPool.length; i++) {
      const fairy = room.fairiesPool[i];
      if (!fairy.active) continue;

      if (now - fairy.spawnTime >= FAIRY_LIFETIME) {
        fairy.deactivate();
        continue;
      }

      fairy.update(room.players, now, (x, y, vx, vy, lifespan, size, fromFairy) => {
        spawnEnemyBullet(room, x, y, vx, vy, lifespan, size, fromFairy, false);
      });
    }

    // Clean up expired skill effects
    room.skillEffects = room.skillEffects.filter(e => now - e.startTime < e.duration);

    // Broadcast packed and delta-compressed state update
    const packedState = NetworkManager.packStateUpdate(room);
    io.to(roomCode).emit("stateUpdate", packedState);
  }
}, 50);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
