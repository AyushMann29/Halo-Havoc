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
let sharedCharge = 0;
let shield = null;
let bossPhase = 1;
let gameEnded = false;

let gameState = {
  players: {},
  bullets: [],
  enemyBullets: [],
  boss: {
    x: 0,
    y: 0,
    radius: 50,
    maxHealth: 5000,
    currentHealth: 5000
  }
};

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

function resetGame() {
  gameState = {
    players: {},
    bullets: [],
    enemyBullets: [],
    boss: {
      x: 0,
      y: 0,
      radius: 50,
      maxHealth: 5000,
      currentHealth: 5000
    }
  };
  sharedCharge = 0;
  shield = null;
  bossPhase = 1;
  gameEnded = false;
  usedAngles.clear();
  console.log("🔄 Game state reset.");
}

io.on("connection", (socket) => {
  console.log("✅ Player connected:", socket.id);

  socket.on("ready", (className) => {
    const stats = playerStats[className] || playerStats.Assault;
    const angle = generateUniqueAngle();
    const x = ORBIT_RADIUS * Math.cos(angle);
    const y = ORBIT_RADIUS * Math.sin(angle);

    gameState.players[socket.id] = {
      angle,
      x,
      y,
      className,
      health: stats.hp,
      maxHealth: stats.hp,
      invincibleUntil: 0
    };

    socket.emit("init", {
      players: gameState.players,
      bullets: [],
      enemyBullets: [],
      boss: gameState.boss,
      sharedCharge,
      shield
    });
  });

  socket.on("move", (data) => {
    const player = gameState.players[socket.id];
    if (player && typeof data.angle === "number") {
      player.angle = data.angle;
      player.x = ORBIT_RADIUS * Math.cos(data.angle);
      player.y = ORBIT_RADIUS * Math.sin(data.angle);
    }
  });

  socket.on("shoot", (bullet) => {
    bullet.id = socket.id;
    bullet.lifespan = 200;
    const maxSpeed = 10;
    const speed = Math.hypot(bullet.vx, bullet.vy);
    if (speed > maxSpeed) {
      bullet.vx *= maxSpeed / speed;
      bullet.vy *= maxSpeed / speed;
    }
    gameState.bullets.push(bullet);
  });

  socket.on("useAbility", ({ className }) => {
    const player = gameState.players[socket.id];
    if (!player) return;

    if (className === "Healer" && sharedCharge >= 5) {
      for (const id in gameState.players) {
        const p = gameState.players[id];
        if (p.health < p.maxHealth) p.health++;
      }
      sharedCharge -= 5;
    }

    if (className === "Tank" && sharedCharge >= 3) {
      shield = {
        x: player.x,
        y: player.y,
        radius: 80,
        expires: Date.now() + 5000
      };
      sharedCharge -= 3;
    }

    if (className === "Sniper" && sharedCharge >= 4) {
      const angle = Math.atan2(-player.y, -player.x);
      const vx = Math.cos(angle) * 12;
      const vy = Math.sin(angle) * 12;
      gameState.bullets.push({
        x: player.x,
        y: player.y,
        vx,
        vy,
        lifespan: 200,
        id: socket.id,
        special: "sniper"
      });
      sharedCharge -= 4;
    }

    if (className === "Assault" && sharedCharge >= 4) {
      const angle = Math.atan2(-player.y, -player.x);
      for (let i = -1; i <= 1; i++) {
        const spread = angle + i * 0.1;
        gameState.bullets.push({
          x: player.x,
          y: player.y,
          vx: Math.cos(spread) * 6,
          vy: Math.sin(spread) * 6,
          lifespan: 200,
          id: socket.id,
          special: "assault"
        });
      }
      sharedCharge -= 4;
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Player disconnected:", socket.id);
    const player = gameState.players[socket.id];
    if (player && player.angle) {
      usedAngles.delete(player.angle);
    }
    delete gameState.players[socket.id];
  });
});

// Game Loop
setInterval(() => {
  if (gameEnded) return;

  const now = Date.now();
  const boss = gameState.boss;

  // Boss phases
  const hpRatio = boss.currentHealth / boss.maxHealth;
  if (hpRatio < 0.3) bossPhase = 3;
  else if (hpRatio < 0.6) bossPhase = 2;

  // Victory
  if (boss.currentHealth <= 0 && !gameEnded) {
    io.emit("gameOver", { outcome: "victory" });
    gameEnded = true;
    setTimeout(resetGame, 5000);
    return;
  }

  // Defeat
  const allDead = Object.values(gameState.players).every(p => p.health <= 0);
  if (allDead && Object.keys(gameState.players).length > 0 && !gameEnded) {
    io.emit("gameOver", { outcome: "defeat" });
    gameEnded = true;
    setTimeout(resetGame, 5000);
    return;
  }

  // Shield expiry
  if (shield && now > shield.expires) shield = null;

  // Update player bullets
  gameState.bullets.forEach(b => {
    b.x += b.vx;
    b.y += b.vy;
    b.lifespan--;
  });

  gameState.bullets = gameState.bullets.filter(b => {
    const dx = b.x - boss.x;
    const dy = b.y - boss.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < boss.radius) {
      boss.currentHealth = Math.max(0, boss.currentHealth - 10);
      return false;
    }
    return b.lifespan > 0;
  });

  // Boss attacks
  if (Math.random() < 0.05) {
    const numBullets = bossPhase === 3 ? 24 : bossPhase === 2 ? 18 : 10;
    const speed = bossPhase === 3 ? 5 : bossPhase === 2 ? 4 : 3;

    for (let i = 0; i < numBullets; i++) {
      const angle = Math.random() * Math.PI * 2;
      gameState.enemyBullets.push({
        x: boss.x,
        y: boss.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        lifespan: 250
      });
    }
  }

  gameState.enemyBullets.forEach(b => {
    b.x += b.vx;
    b.y += b.vy;
    b.lifespan--;

    for (const id in gameState.players) {
      const p = gameState.players[id];
      const dx = b.x - p.x;
      const dy = b.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const insideShield = shield && dist < shield.radius;

      if (dist < 20 && now > p.invincibleUntil && !insideShield && p.health > 0) {
        p.health--;
        p.invincibleUntil = now + 2000;
        sharedCharge++;
      }
    }
  });

  gameState.enemyBullets = gameState.enemyBullets.filter(b => b.lifespan > 0);

  io.emit("stateUpdate", {
    players: gameState.players,
    bullets: gameState.bullets,
    enemyBullets: gameState.enemyBullets,
    boss: gameState.boss,
    sharedCharge,
    shield
  });
}, 50);

server.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
