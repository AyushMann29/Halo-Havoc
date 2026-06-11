const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',').map(s => s.replace(/\/+$/, ''));

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"] }
});

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

const ARENA_W = 800;
const ARENA_H = 600;
const BOSS_Y = 30;
const BOSS_RADIUS = 50;
const PLAYER_HURTBOX = 4;
const GRAZE_MARGIN = 8;
const BOMB_COST = 30;
const BOSS_BASE_HP = 15000;
const BOSS_SCALE_PER_PLAYER = 8000;
const BOSS_FRACTIONS = [0.2, 0.25, 0.5];
const BOSS_COLORS = [
  [220, 40, 40],
  [240, 130, 30],
  [170, 50, 210]
];

const BOSS_NAMES = [
  "Suzume Kazehana",
  "Kōri Shizuka",
  "Enma Gōen"
];

const BOSS_TITLES = [
  "Fan Dancer of the Spring Wind",
  "Ice Sorceress of the Frozen Lake",
  "Oni Lord of the Crimson Abyss"
];

const FAIRY_HP = 20;
const FAIRY_SPEED = 2;
const FAIRY_STOP_DISTANCE = 120;
const FAIRY_SHOOT_INTERVAL = 1500;
const FAIRY_LIFETIME = 15000;
const FAIRY_CHARGE_REWARD = 5;
const FAIRY_WAVE_INTERVAL = 20000;
const FIRST_FAIRY_WAVE_DELAY = 5000;

const SKILL_COOLDOWNS = {
  Reimu: 30000,
  Eirin: 30000,
  Marisa: 10000,
  Youmu: 0
};

const SKILL_COSTS = {
  Reimu: 10,
  Eirin: 10,
  Marisa: 5,
  Youmu: 5
};

const rooms = {};

const playerStats = {
  Reimu: { hp: 10 },
  Marisa: { hp: 5 },
  Eirin: { hp: 4 },
  Youmu: { hp: 3 }
};

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  } while (rooms[code]);
  return code;
}

function getBossHP(playerCount) {
  return BOSS_BASE_HP + BOSS_SCALE_PER_PLAYER * playerCount;
}

function createBossState(bossIndex, playerCount) {
  const totalHP = getBossHP(playerCount);
  const hp = Math.floor(totalHP * BOSS_FRACTIONS[bossIndex]);
  
  if (bossIndex === 2) {
    // Boss 3: Three mini-bosses with combined HP
    const perBossHP = Math.floor(hp / 3);
    return {
      bosses: [
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
      ],
      maxHealth: hp,
      currentHealth: hp,
      isMultiBoss: true
    };
  }
  
  return {
    x: ARENA_W / 2,
    y: BOSS_Y,
    radius: BOSS_RADIUS,
    maxHealth: hp,
    currentHealth: hp,
    targetX: ARENA_W / 2,
    pauseTimer: 0,
    vx: 0,
    isMultiBoss: false
  };
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
    room.fairies.push({
      id: `fairy_${now}_${i}`,
      x, y,
      hp: FAIRY_HP,
      targetId: Object.keys(room.players)[players.indexOf(target)],
      spawnTime: now,
      lastShot: now,
      vx: 0, vy: 0
    });
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
      bullets: [],
      enemyBullets: [],
      boss: null,
      bossIndex: 0,
      sharedCharge: 0,
      shield: null,
      gameEnded: false,
      transitionEndTime: 0,
      nextBossIndex: 0,
      fairies: [],
      fairyWaveTimer: 0,
      skillEffects: [],
      skillCooldowns: {}
    };

    const room = rooms[roomCode];
    room.players[socket.id] = {
      x, y,
      className,
      health: stats.hp,
      maxHealth: stats.hp,
      invincibleUntil: 0,
      grazeCooldown: 0,
      skillCooldownUntil: 0
    };

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

    room.players[socket.id] = {
      x, y,
      className,
      health: stats.hp,
      maxHealth: stats.hp,
      invincibleUntil: 0,
      grazeCooldown: 0,
      skillCooldownUntil: 0
    };

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
    room.boss = createBossState(0, playerCount);
    room.fairyWaveTimer = Date.now() + FIRST_FAIRY_WAVE_DELAY;

    io.to(socket.data.roomCode).emit("gameStarted", {
      boss: room.boss,
      bossIndex: 0,
      bossName: BOSS_NAMES[0],
      bossTitle: BOSS_TITLES[0],
      players: room.players,
      bullets: room.bullets,
      enemyBullets: room.enemyBullets,
      sharedCharge: room.sharedCharge,
      shield: room.shield
    });
  });

  socket.on("move", ({ x, y }) => {
    const room = rooms[socket.data.roomCode];
    const player = room?.players[socket.id];
    if (player && typeof x === "number" && typeof y === "number") {
      player.x = Math.max(20, Math.min(ARENA_W - 20, x));
      player.y = Math.max(20, Math.min(ARENA_H - 20, y));
    }
  });

  socket.on("shoot", (bullet) => {
    const room = rooms[socket.data.roomCode];
    bullet.id = socket.id;
    bullet.lifespan = 200;
    room?.bullets.push(bullet);
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
        room.bullets.push({
          x: player.x, y: player.y,
          vx: Math.sin(angle) * 8, vy: -10,
          lifespan: 30, id: socket.id, special: "slash"
        });
      }
      room.skillEffects.push({
        type: "slash",
        x: player.x, y: player.y,
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
      room.bullets.push({
        x: player.x, y: player.y,
        vx: 0, vy: -20,
        lifespan: 60, id: socket.id, special: "laser",
        damage: 100, targetX: targetX
      });
      room.skillEffects.push({
        type: "laser",
        x: player.x, y: player.y,
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
    room.enemyBullets = [];
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
      player.cheats = player.cheats || {};
      player.cheats.godMode = enabled;
    }
    if (type === "infiniteCharges") {
      player.cheats = player.cheats || {};
      player.cheats.infiniteCharges = enabled;
    }
    if (type === "megaDamage") {
      player.cheats = player.cheats || {};
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
        room.boss = createBossState(room.bossIndex, playerCount);
        room.transitionEndTime = 0;
        room.nextBossIndex = 0;
        for (const id in room.players) {
          room.players[id].invincibleUntil = now + 2000;
        }
        io.to(roomCode).emit("bossSpawned", {
          boss: room.boss,
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
      room.enemyBullets = [];
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

    const bossMul = 1 + room.bossIndex * 0.3;

    // Boss horizontal patrol (faster per index)
    if (boss.isMultiBoss) {
      for (const mb of boss.bosses) {
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
      if (boss.pauseTimer > 0) {
        boss.pauseTimer--;
      } else {
        const dx = boss.targetX - boss.x;
        if (Math.abs(dx) < 2) {
          boss.targetX = Math.random() * (ARENA_W - 100) + 50;
          boss.pauseTimer = Math.floor(Math.random() * 30) + 10;
          boss.vx = 0;
        } else {
          const speedMul = 1 + room.bossIndex * 0.4;
          const speed = (0.8 + Math.random() * 0.5) * bossMul * speedMul;
          boss.vx = Math.sign(dx) * Math.min(speed, Math.abs(dx) * 0.1);
          boss.x += boss.vx;
        }
      }
    }

    // Move player bullets + fairy/boss collision
    room.bullets.forEach(b => { b.x += b.vx; b.y += b.vy; b.lifespan--; });
    room.bullets = room.bullets.filter(b => {
      if (b.special === "laser") {
        for (let i = room.fairies.length - 1; i >= 0; i--) {
          const fairy = room.fairies[i];
          const dx = b.x - fairy.x;
          const dy = b.y - fairy.y;
          if (Math.abs(dx) < 30 && dy < 0 && dy > -ARENA_H) {
            fairy.hp -= b.damage || 100;
            if (fairy.hp <= 0) {
              room.sharedCharge += FAIRY_CHARGE_REWARD;
              room.fairies.splice(i, 1);
            }
          }
        }
      } else {
        for (let i = room.fairies.length - 1; i >= 0; i--) {
          const fairy = room.fairies[i];
          const dx = b.x - fairy.x;
          const dy = b.y - fairy.y;
          if (Math.sqrt(dx * dx + dy * dy) < 20) {
            const shooter = room.players[b.id];
            const damage = (shooter && shooter.cheats && shooter.cheats.megaDamage) ? 1000 : 10;
            fairy.hp -= damage;
            if (fairy.hp <= 0) {
              room.sharedCharge += FAIRY_CHARGE_REWARD;
              room.fairies.splice(i, 1);
            }
            return false;
          }
        }
      }

      const shooter = room.players[b.id];
      const damage = (shooter && shooter.cheats && shooter.cheats.megaDamage) ? 1000 : 10;

      if (boss.isMultiBoss) {
        for (const mb of boss.bosses) {
          if (mb.hp <= 0) continue;
          const dxB = b.x - mb.x;
          const dyB = b.y - mb.y;
          if (Math.sqrt(dxB * dxB + dyB * dyB) < mb.radius) {
            mb.hp = Math.max(0, mb.hp - damage);
            boss.currentHealth = boss.bosses.reduce((sum, m) => sum + (m.hp > 0 ? m.hp : 0), 0);
            return false;
          }
        }
      } else {
        const dxB = b.x - boss.x;
        const dyB = b.y - boss.y;
        if (Math.sqrt(dxB * dxB + dyB * dyB) < boss.radius) {
          boss.currentHealth = Math.max(0, boss.currentHealth - damage);
          return false;
        }
      }
      return b.lifespan > 0 && b.x > -200 && b.x < ARENA_W + 200 && b.y > -200 && b.y < ARENA_H + 200;
    });

    // Spawn enemy bullets (unique patterns per boss)
    if (boss.isMultiBoss) {
      for (const mb of boss.bosses) {
        if (mb.hp <= 0) continue;
        if (Math.random() < 0.08) {
          const targets = Object.values(room.players).filter(pl => pl.health > 0);
          if (targets.length > 0) {
            const t = targets[Math.floor(Math.random() * targets.length)];
            const a = Math.atan2(t.y - mb.y, t.x - mb.x);
            for (let i = -2; i <= 2; i++) {
              const s = 3.5 + Math.random() * 3;
              room.enemyBullets.push({
                x: mb.x, y: mb.y,
                vx: Math.cos(a + i * 0.15) * s,
                vy: Math.sin(a + i * 0.15) * s,
                lifespan: 250,
                size: 5 + Math.random() * 3
              });
            }
          }
          if (Math.random() < 0.4) {
            const spiralAngle = now * 0.004 + mb.id * 2;
            for (let arm = 0; arm < 4; arm++) {
              const angle = spiralAngle + arm * Math.PI / 2;
              const speed = 3 + Math.random() * 2;
              room.enemyBullets.push({
                x: mb.x, y: mb.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                lifespan: 300,
                size: 6
              });
            }
          }
        }
      }
    } else if (Math.random() < 0.06) {
      const bossIdx = room.bossIndex;
      if (bossIdx === 0) {
        // Fan Spread: sweeping arc that rotates
        const fanDir = Math.sin(now * 0.002);
        const baseAngle = Math.PI / 2 + fanDir * 0.6;
        const spread = Math.PI / 4;
        const numBullets = 6 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numBullets; i++) {
          const angle = baseAngle + (i / (numBullets - 1) - 0.5) * spread;
          const speed = 2.5 + Math.random() * 2.5;
          room.enemyBullets.push({
            x: boss.x, y: boss.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            lifespan: 300,
            size: 4 + Math.random() * 3
          });
        }
        if (Math.random() < 0.3) {
          const targets = Object.values(room.players);
          if (targets.length > 0) {
            const t = targets[Math.floor(Math.random() * targets.length)];
            const a = Math.atan2(t.y - boss.y, t.x - boss.x);
            for (let i = -2; i <= 2; i++) {
              const s = 3.5 + Math.random() * 2.5;
              room.enemyBullets.push({
                x: boss.x, y: boss.y,
                vx: Math.cos(a + i * 0.12) * s,
                vy: Math.sin(a + i * 0.12) * s,
                lifespan: 250,
                size: 5
              });
            }
          }
        }
      } else if (bossIdx === 1) {
        // Crystal Prison: hexagonal bursts + tracking shards
        const numRings = 2;
        for (let r = 0; r < numRings; r++) {
          const baseAngle = now * 0.001 + r * Math.PI / 6;
          for (let i = 0; i < 6; i++) {
            const angle = baseAngle + i * Math.PI / 3;
            const speed = 2.5 + r * 1.5;
            room.enemyBullets.push({
              x: boss.x, y: boss.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              lifespan: 300,
              size: 6 + Math.random() * 2
            });
          }
        }
        if (Math.random() < 0.25) {
          const targets = Object.values(room.players);
          if (targets.length > 0) {
            const t = targets[Math.floor(Math.random() * targets.length)];
            const a = Math.atan2(t.y - boss.y, t.x - boss.x);
            for (let i = -1; i <= 1; i++) {
              const s = 4.5;
              room.enemyBullets.push({
                x: boss.x, y: boss.y,
                vx: Math.cos(a + i * 0.1) * s,
                vy: Math.sin(a + i * 0.1) * s,
                lifespan: 200,
                size: 8
              });
            }
          }
        }
      }
    }

    // Move enemy bullets + player collision + graze
    room.enemyBullets.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;
      b.lifespan--;
      if (b.bounce) {
        if (b.x < 0 || b.x > ARENA_W) b.vx *= -1;
        if (b.y < 0 || b.y > ARENA_H) b.vy *= -1;
      }

      const bHitRadius = Math.max(2, (b.size || 7) * 0.35);
      const hitDist = PLAYER_HURTBOX + bHitRadius;
      const grazeDist = hitDist + GRAZE_MARGIN;

      for (const id in room.players) {
        const p = room.players[id];
        const dx = b.x - p.x;
        const dy = b.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const insideShield = room.shield && dist < room.shield.radius;

        if (dist >= hitDist && dist < grazeDist && now > p.grazeCooldown) {
          p.grazeCooldown = now + 100;
          room.sharedCharge++;
        }

        if (dist < hitDist && now > p.invincibleUntil && !insideShield && p.health > 0 && !(p.cheats && p.cheats.godMode)) {
          p.health--;
          p.invincibleUntil = now + 2000;
        }
      }
    });
    room.enemyBullets = room.enemyBullets.filter(b => b.lifespan > 0);

    // Fairy wave spawning
    if (room.fairyWaveTimer > 0 && now >= room.fairyWaveTimer) {
      spawnFairyWave(room);
      room.fairyWaveTimer = now + FAIRY_WAVE_INTERVAL;
    }

    // Fairy logic: movement, shooting, collision
    for (const fairy of room.fairies) {
      const target = room.players[fairy.targetId];
      if (!target || target.health <= 0) {
        const alivePlayers = Object.entries(room.players).filter(([, p]) => p.health > 0);
        if (alivePlayers.length > 0) {
          fairy.targetId = alivePlayers[Math.floor(Math.random() * alivePlayers.length)][0];
        }
        continue;
      }

      const dx = target.x - fairy.x;
      const dy = target.y - fairy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > FAIRY_STOP_DISTANCE) {
        fairy.x += (dx / dist) * FAIRY_SPEED;
        fairy.y += (dy / dist) * FAIRY_SPEED;
      }

      if (now - fairy.lastShot > FAIRY_SHOOT_INTERVAL) {
        const angle = Math.atan2(dy, dx);
        for (let i = -1; i <= 1; i++) {
          room.enemyBullets.push({
            x: fairy.x, y: fairy.y,
            vx: Math.cos(angle + i * 0.2) * 2.5,
            vy: Math.sin(angle + i * 0.2) * 2.5,
            lifespan: 200,
            size: 5,
            fromFairy: true
          });
        }
        fairy.lastShot = now;
      }
    }

    // Remove expired fairies
    room.fairies = room.fairies.filter(f => now - f.spawnTime < FAIRY_LIFETIME);

    // Clean up expired skill effects
    room.skillEffects = room.skillEffects.filter(e => now - e.startTime < e.duration);

    io.to(roomCode).emit("stateUpdate", {
      players: room.players,
      bullets: room.bullets,
      enemyBullets: room.enemyBullets,
      boss: room.boss,
      bossIndex: room.bossIndex,
      bossName: BOSS_NAMES[room.bossIndex],
      bossTitle: BOSS_TITLES[room.bossIndex],
      sharedCharge: room.sharedCharge,
      shield: room.shield,
      fairies: room.fairies,
      skillEffects: room.skillEffects
    });
  }
}, 50);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
