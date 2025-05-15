// --- sketch.js ---

export const sketch = (socket, playerClass) => (p) => {
  let players = {};
  let myId = null;
  let bullets = [];
  let enemyBullets = [];
  let boss = { x: 0, y: 0, radius: 50, currentHealth: 0, maxHealth: 0 };
  let sharedCharge = 0;
  let shield = null;
  let usedAbility = false;
  let gameOver = false;
  let outcome = ""; // "victory" or "defeat"
  const ORBIT_RADIUS = 400;

  const playerStats = {
    Tank:    { hp: 10, cooldown: 800, speed: 0.015 },
    Assault: { hp: 5,  cooldown: 500, speed: 0.03 },
    Healer:  { hp: 4,  cooldown: 700, speed: 0.035 },
    Sniper:  { hp: 3,  cooldown: 1000, speed: 0.05 }
  };

  const myStats = playerStats[playerClass] || playerStats.Assault;
  const ROTATION_SPEED = myStats.speed;
  const SHOOT_COOLDOWN = myStats.cooldown;

  let lastShotTime = 0;
  let myAngle = 0;

  const stars = Array.from({ length: 300 }, () => ({
    x: Math.random() * 5000 - 2500,
    y: Math.random() * 5000 - 2500,
  }));

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);

    if (socket.connected) myId = socket.id;

    socket.on("connect", () => {
      myId = socket.id;
    });

    socket.on("init", (state) => {
      players = state.players;
      if (players[myId]) {
        myAngle = players[myId].angle ?? 0;
      }
    });

    socket.on("stateUpdate", (state) => {
      players = state.players;
      bullets = state.bullets || [];
      enemyBullets = state.enemyBullets || [];
      boss = state.boss || boss;
      sharedCharge = state.sharedCharge || 0;
      shield = state.shield || null;

    if (!gameOver) {
      const me = players[myId];
      if (boss.currentHealth <= 0) {
        gameOver = true;
        outcome = "victory";
      } else if (!me || me.health <= 0) {
        gameOver = true;
        outcome = "defeat";
      }
    }
    });

    p.canvas.tabIndex = -1;
    p.canvas.style.outline = 'none';
    p.canvas.addEventListener('click', () => p.canvas.focus());
  };

  p.draw = () => {
    p.background(0);
    if (!myId || !players[myId]) return;

    const me = players[myId];

    // Rotate
    if (p.keyIsDown(p.LEFT_ARROW))  myAngle -= ROTATION_SPEED;
    if (p.keyIsDown(p.RIGHT_ARROW)) myAngle += ROTATION_SPEED;

    // Predict position
    const predictedX = ORBIT_RADIUS * Math.cos(myAngle);
    const predictedY = ORBIT_RADIUS * Math.sin(myAngle);
    socket.emit("move", { angle: myAngle });

    // Auto shoot toward boss
    const dx = boss.x - predictedX;
    const dy = boss.y - predictedY;
    const angleToBoss = Math.atan2(dy, dx);
    const shootVx = Math.cos(angleToBoss) * 6;
    const shootVy = Math.sin(angleToBoss) * 6;

    const now = Date.now();
    if (now - lastShotTime > SHOOT_COOLDOWN) {
      const bullet = {
        x: predictedX,
        y: predictedY,
        vx: shootVx,
        vy: shootVy
      };
      socket.emit("shoot", bullet);
      lastShotTime = now;
    }

    // Use ability (UP_ARROW)
    if (p.keyIsDown(p.UP_ARROW) && !usedAbility) {
      socket.emit("useAbility", { className: playerClass });
      usedAbility = true;
    }
    if (!p.keyIsDown(p.UP_ARROW)) {
      usedAbility = false;
    }

    // Camera
    p.translate(p.width / 2 - predictedX, p.height / 2 - predictedY);

    // Orbit path
    p.noFill();
    p.stroke(100);
    p.strokeWeight(1);
    p.ellipse(0, 0, ORBIT_RADIUS * 2, ORBIT_RADIUS * 2);

    // Stars
    p.fill(255);
    p.noStroke();
    for (let star of stars) p.circle(star.x, star.y, 2);

    // Boss
    p.fill("red");
    p.ellipse(boss.x, boss.y, boss.radius * 2, boss.radius * 2);
    p.fill("white");
    p.rect(boss.x - 50, boss.y - boss.radius - 40, 100, 10);
    const hpWidth = p.map(boss.currentHealth, 0, boss.maxHealth, 0, 100);
    p.fill("lime");
    p.rect(boss.x - 50, boss.y - boss.radius - 40, hpWidth, 10);
        // Draw boss aura
    p.noFill();
    p.strokeWeight(4);
    p.stroke(255, 0, 0, 100 + 50 * Math.sin(p.frameCount * 0.1)); // pulsing glow
    p.ellipse(boss.x, boss.y, boss.radius * 2.5);
    // Change color based on health
    let healthRatio = boss.currentHealth / boss.maxHealth;
    if (healthRatio > 0.6) p.fill("red");
    else if (healthRatio > 0.3) p.fill("orange");
    else p.fill("purple");

    p.noStroke();
    p.ellipse(boss.x, boss.y, boss.radius * 2, boss.radius * 2);
    // Boss "eye" or core
    p.fill(255);
    p.ellipse(boss.x, boss.y, boss.radius * 0.4);


    // Shield
    if (shield) {
      p.noFill();
      p.stroke("cyan");
      p.strokeWeight(3);
      p.ellipse(shield.x, shield.y, shield.radius * 2);
    }

    // Charge UI
    p.fill("white");
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`⚡ Charge: ${sharedCharge}`, predictedX - p.width / 2 + 20, predictedY - p.height / 2 + 20);

    // Players
    for (const id in players) {
      const { x, y, health } = players[id];
      if (id === myId) {
        p.fill("deepskyblue");
        p.ellipse(predictedX, predictedY, 30, 30);
        p.fill("white");
        p.textAlign(p.CENTER);
        p.textSize(12);
        p.text(`❤️ ${health}/${myStats.hp}`, predictedX, predictedY - 35);
      } else {
        p.fill("white");
        p.ellipse(x, y, 30, 30);
      }
    }

    // Enemy Bullets
    p.fill("red");
    for (let eb of enemyBullets) {
      p.circle(eb.x, eb.y, 6);
    }

    // Player Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (Math.abs(b.x) > 2000 || Math.abs(b.y) > 2000) {
        bullets.splice(i, 1);
        continue;
      }

      if (b.special === "sniper") {
        p.fill("yellow");
        p.circle(b.x, b.y, 10);
      } else if (b.special === "assault") {
        p.fill("orange");
        p.circle(b.x, b.y, 5);
      } else {
        p.fill("white");
        p.circle(b.x, b.y, 5);
      }
    }
    if (gameOver) {
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.fill(outcome === "victory" ? "lime" : "red");
  p.text(outcome === "victory" ? "VICTORY!" : "DEFEAT", p.width / 2 - p.width / 2 + predictedX, p.height / 2 - p.height / 2 + predictedY);
  p.pop();
}

  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
};
