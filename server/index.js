const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',');

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
  return {
    x: ARENA_W / 2,
    y: BOSS_Y,
    radius: BOSS_RADIUS,
    maxHealth: hp,
    currentHealth: hp,
    targetX: ARENA_W / 2,
    pauseTimer: 0,
    vx: 0
  };
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
      nextBossIndex: 0
    };

    const room = rooms[roomCode];
    room.players[socket.id] = {
      x, y,
      className,
      health: stats.hp,
      maxHealth: stats.hp,
      invincibleUntil: 0,
      grazeCooldown: 0
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
      grazeCooldown: 0
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

    if (className === "Eirin" && room.sharedCharge >= 5) {
      for (const id in room.players) {
        const p = room.players[id];
        if (p.health < p.maxHealth) p.health++;
      }
      room.sharedCharge -= 5;
    }

    if (className === "Reimu" && room.sharedCharge >= 3) {
      room.shield = { x: player.x, y: player.y, radius: 80, expires: Date.now() + 5000 };
      room.sharedCharge -= 3;
    }

    if (className === "Youmu" && room.sharedCharge >= 4) {
      room.bullets.push({
        x: player.x, y: player.y, vx: 0, vy: -12,
        lifespan: 200, id: socket.id, special: "sniper"
      });
      room.sharedCharge -= 4;
    }

    if (className === "Marisa" && room.sharedCharge >= 4) {
      for (let i = -1; i <= 1; i++) {
        room.bullets.push({
          x: player.x, y: player.y, vx: i * 0.5, vy: -12,
          lifespan: 200, id: socket.id, special: "assault"
        });
      }
      room.sharedCharge -= 4;
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

    if (room.shield && now > room.shield.expires) room.shield = null;

    const bossMul = 1 + room.bossIndex * 0.3;

    // Boss horizontal patrol (faster per index)
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

    // Move player bullets + boss collision
    room.bullets.forEach(b => { b.x += b.vx; b.y += b.vy; b.lifespan--; });
    room.bullets = room.bullets.filter(b => {
      const dx = b.x - boss.x;
      const dy = b.y - boss.y;
      if (Math.sqrt(dx * dx + dy * dy) < boss.radius) {
        boss.currentHealth = Math.max(0, boss.currentHealth - 10);
        return false;
      }
      return b.lifespan > 0 && b.x > -200 && b.x < ARENA_W + 200 && b.y > -200 && b.y < ARENA_H + 200;
    });

    // Spawn enemy bullets (unique patterns per boss)
    if (Math.random() < 0.06) {
      const bossIdx = room.bossIndex;
      if (bossIdx === 0) {
        // Fan Spread: sweeping arc that rotates
        const fanDir = Math.sin(now * 0.002);
        const baseAngle = Math.PI / 2 + fanDir * 0.6;
        const spread = Math.PI / 4;
        const numBullets = 6 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numBullets; i++) {
          const angle = baseAngle + (i / (numBullets - 1) - 0.5) * spread;
          const speed = 1.5 + Math.random() * 1.5;
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
              const s = 2 + Math.random() * 1.5;
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
            const speed = 1.5 + r * 0.8;
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
              const s = 2.5;
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
      } else {
        // Hell Wheel: triple spiral + bouncing bullets
        const spiralAngle = now * 0.003;
        const arms = 3;
        for (let a = 0; a < arms; a++) {
          const angle = spiralAngle + a * Math.PI * 2 / arms;
          const speed = 2 + Math.random() * 2;
          room.enemyBullets.push({
            x: boss.x, y: boss.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            lifespan: 250,
            size: 6 + Math.random() * 3
          });
        }
        if (Math.random() < 0.3) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 3 + Math.random() * 2;
          room.enemyBullets.push({
            x: boss.x, y: boss.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            lifespan: 400,
            size: 5,
            bounce: true
          });
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

        if (dist < hitDist && now > p.invincibleUntil && !insideShield && p.health > 0) {
          p.health--;
          p.invincibleUntil = now + 2000;
        }
      }
    });
    room.enemyBullets = room.enemyBullets.filter(b => b.lifespan > 0);

    io.to(roomCode).emit("stateUpdate", {
      players: room.players,
      bullets: room.bullets,
      enemyBullets: room.enemyBullets,
      boss: room.boss,
      bossIndex: room.bossIndex,
      bossName: BOSS_NAMES[room.bossIndex],
      bossTitle: BOSS_TITLES[room.bossIndex],
      sharedCharge: room.sharedCharge,
      shield: room.shield
    });
  }
}, 50);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
