const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const ORBIT_RADIUS = 400;
const usedAngles = new Set();
const rooms = {};

const playerStats = {
  Tank: { hp: 10 },
  Assault: { hp: 5 },
  Healer: { hp: 4 },
  Sniper: { hp: 3 }
};

function generateUniqueAngle() {
  let angle, tries = 0;
  do {
    angle = Math.random() * Math.PI * 2;
    tries++;
  } while ([...usedAngles].some(a => Math.abs(a - angle) < 0.2) && tries < 100);
  usedAngles.add(angle);
  return angle;
}

function createNewGameState() {
  return {
    players: {},
    bullets: [],
    enemyBullets: [],
    boss: {
      x: 0,
      y: 0,
      radius: 50,
      maxHealth: 5000,
      currentHealth: 5000
    },
    sharedCharge: 0,
    shield: null,
    bossPhase: 1,
    gameEnded: false
  };
}

io.on("connection", (socket) => {
  console.log("✅ Player connected:", socket.id);

  socket.on("joinRoom", ({ selectedClass, roomCode }) => {
    socket.join(roomCode);
    if (!rooms[roomCode]) {
      rooms[roomCode] = createNewGameState();
    }

    const room = rooms[roomCode];
    const stats = playerStats[selectedClass] || playerStats.Assault;
    const angle = generateUniqueAngle();
    const x = ORBIT_RADIUS * Math.cos(angle);
    const y = ORBIT_RADIUS * Math.sin(angle);

    room.players[socket.id] = {
      angle,
      x,
      y,
      className: selectedClass,
      health: stats.hp,
      maxHealth: stats.hp,
      invincibleUntil: 0
    };

    socket.data.roomCode = roomCode;

    socket.emit("init", {
      players: room.players,
      bullets: room.bullets,
      enemyBullets: room.enemyBullets,
      boss: room.boss,
      sharedCharge: room.sharedCharge,
      shield: room.shield
    });
  });

  socket.on("move", (data) => {
    const room = rooms[socket.data.roomCode];
    const player = room?.players[socket.id];
    if (player && typeof data.angle === "number") {
      player.angle = data.angle;
      player.x = ORBIT_RADIUS * Math.cos(data.angle);
      player.y = ORBIT_RADIUS * Math.sin(data.angle);
    }
  });

  socket.on("shoot", (bullet) => {
    const room = rooms[socket.data.roomCode];
    bullet.id = socket.id;
    bullet.lifespan = 200;
    const maxSpeed = 10;
    const speed = Math.hypot(bullet.vx, bullet.vy);
    if (speed > maxSpeed) {
      bullet.vx *= maxSpeed / speed;
      bullet.vy *= maxSpeed / speed;
    }
    room?.bullets.push(bullet);
  });

  socket.on("useAbility", ({ className }) => {
    const room = rooms[socket.data.roomCode];
    const player = room?.players[socket.id];
    if (!player) return;

    if (className === "Healer" && room.sharedCharge >= 5) {
      for (const id in room.players) {
        const p = room.players[id];
        if (p.health < p.maxHealth) p.health++;
      }
      room.sharedCharge -= 5;
    }

    if (className === "Tank" && room.sharedCharge >= 3) {
      room.shield = {
        x: player.x,
        y: player.y,
        radius: 80,
        expires: Date.now() + 5000
      };
      room.sharedCharge -= 3;
    }

    if (className === "Sniper" && room.sharedCharge >= 4) {
      const angle = Math.atan2(-player.y, -player.x);
      room.bullets.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 12,
        vy: Math.sin(angle) * 12,
        lifespan: 200,
        id: socket.id,
        special: "sniper"
      });
      room.sharedCharge -= 4;
    }

    if (className === "Assault" && room.sharedCharge >= 4) {
      const angle = Math.atan2(-player.y, -player.x);
      for (let i = -1; i <= 1; i++) {
        const spread = angle + i * 0.1;
        room.bullets.push({
          x: player.x,
          y: player.y,
          vx: Math.cos(spread) * 6,
          vy: Math.sin(spread) * 6,
          lifespan: 200,
          id: socket.id,
          special: "assault"
        });
      }
      room.sharedCharge -= 4;
    }
  });

  socket.on("disconnect", () => {
    const room = rooms[socket.data.roomCode];
    const player = room?.players[socket.id];
    if (player?.angle) usedAngles.delete(player.angle);
    delete room?.players[socket.id];
    console.log("❌ Player disconnected:", socket.id);
  });
});

setInterval(() => {
  for (const roomCode in rooms) {
    const room = rooms[roomCode];
    if (room.gameEnded) continue;

    const now = Date.now();
    const boss = room.boss;

    const hpRatio = boss.currentHealth / boss.maxHealth;
    room.bossPhase = hpRatio < 0.3 ? 3 : hpRatio < 0.6 ? 2 : 1;

    if (boss.currentHealth <= 0) {
      io.to(roomCode).emit("gameOver", { outcome: "victory" });
      room.gameEnded = true;
      setTimeout(() => rooms[roomCode] = createNewGameState(), 5000);
      continue;
    }

    const allDead = Object.values(room.players).every(p => p.health <= 0);
    if (allDead && Object.keys(room.players).length > 0) {
      io.to(roomCode).emit("gameOver", { outcome: "defeat" });
      room.gameEnded = true;
      setTimeout(() => rooms[roomCode] = createNewGameState(), 5000);
      continue;
    }

    if (room.shield && now > room.shield.expires) room.shield = null;

    room.bullets.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;
      b.lifespan--;
    });

    room.bullets = room.bullets.filter(b => {
      const dx = b.x - boss.x;
      const dy = b.y - boss.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < boss.radius) {
        boss.currentHealth = Math.max(0, boss.currentHealth - 10);
        return false;
      }
      return b.lifespan > 0;
    });

    if (Math.random() < 0.05) {
      const numBullets = room.bossPhase === 3 ? 24 : room.bossPhase === 2 ? 18 : 10;
      const speed = room.bossPhase === 3 ? 5 : room.bossPhase === 2 ? 4 : 3;
      for (let i = 0; i < numBullets; i++) {
        const angle = Math.random() * Math.PI * 2;
        room.enemyBullets.push({
          x: boss.x,
          y: boss.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          lifespan: 250
        });
      }
    }

    room.enemyBullets.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;
      b.lifespan--;

      for (const id in room.players) {
        const p = room.players[id];
        const dx = b.x - p.x;
        const dy = b.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const insideShield = room.shield && dist < room.shield.radius;

        if (dist < 20 && now > p.invincibleUntil && !insideShield && p.health > 0) {
          p.health--;
          p.invincibleUntil = now + 2000;
          room.sharedCharge++;
        }
      }
    });

    room.enemyBullets = room.enemyBullets.filter(b => b.lifespan > 0);

    io.to(roomCode).emit("stateUpdate", {
      players: room.players,
      bullets: room.bullets,
      enemyBullets: room.enemyBullets,
      boss: room.boss,
      sharedCharge: room.sharedCharge,
      shield: room.shield
    });
  }
}, 50);

server.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
