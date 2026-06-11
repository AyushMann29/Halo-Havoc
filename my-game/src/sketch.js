export const sketch = (socket, playerClass, roomCode) => (p) => {
  let players = {};
  let myId = null;
  let bullets = [];
  let enemyBullets = [];
  let boss = { x: 0, y: 0, radius: 50, currentHealth: 0, maxHealth: 0 };
  let sharedCharge = 0;
  let shield = null;
  let gameOver = false;
  let outcome = "";
  let usedAbility = false;
  let fairies = [];
  let skillEffects = [];
  let skillCooldownUntil = 0;

  // Cheat states
  let godMode = false;
  let infiniteCharges = false;
  let megaDamage = false;

  const ARENA_W = 800;
  const ARENA_H = 600;
  const BOSS_Y = 30;
  const PLAYER_SPEED = 4;
  const PLAYER_HURTBOX = 4;

  let myX = ARENA_W / 2;
  let myY = ARENA_H * 0.8;
  let sx = 1, sy = 1;

  let focusMode = false;
  let keys = {};

  const backButton = { x: 15, y: 15, w: 80, h: 35, r: 5 };
  const goBack = () => { window.location.href = "/"; };

  const playerStats = {
    Reimu: { hp: 10, cooldown: 400 },
    Marisa: { hp: 5, cooldown: 250 },
    Eirin: { hp: 4, cooldown: 350 },
    Youmu: { hp: 3, cooldown: 500 },
  };
  const myStats = playerStats[playerClass] || playerStats.Marisa;
  const SHOOT_COOLDOWN = myStats.cooldown;
  let lastShotTime = 0;
  let bombCooldown = 0;

  // Parallax layer 1: distant stars
  const distantStars = Array.from({ length: 300 }, () => ({
    x: Math.random() * ARENA_W,
    y: Math.random() * ARENA_H,
    size: Math.random() * 1.5 + 0.3,
    brightness: Math.random() * 155 + 100,
  }));
  let scrollY1 = 0;
  const SCROLL_SPEED_1 = 0.3;

  // Parallax layer 2: nebula clouds
  const nebulaBlobs = Array.from({ length: 4 }, () => ({
    x: Math.random() * ARENA_W,
    y: Math.random() * ARENA_H,
    w: 200 + Math.random() * 300,
    h: 100 + Math.random() * 150,
    r: Math.floor(Math.random() * 80 + 60),
    g: Math.floor(Math.random() * 60 + 30),
    b: Math.floor(Math.random() * 120 + 80),
    alpha: Math.random() * 12 + 6,
  }));
  let scrollY2 = 0;
  const SCROLL_SPEED_2 = 0.8;

  // Parallax layer 3: foreground debris
  const foregroundDebris = Array.from({ length: 40 }, () => ({
    x: Math.random() * ARENA_W,
    y: Math.random() * ARENA_H,
    size: Math.random() * 3 + 1,
    speed: 1.2 + Math.random() * 1.2,
    alpha: Math.random() * 120 + 60,
  }));
  let scrollY3 = 0;
  const SCROLL_SPEED_3 = 1.8;

  let transitioning = false;
  let transitionStartTime = 0;
  let transitionBossIndex = 0;
  let shakeAmount = 0;
  let shakeTime = 0;

  const bossVisuals = [
    { name: "Suzume Kazehana", title: "Fan Dancer of the Spring Wind", color: [80, 220, 80] },
    { name: "Kōri Shizuka", title: "Ice Sorceress of the Frozen Lake", color: [60, 140, 255] },
    { name: "Enma Gōen", title: "Oni Lord of the Crimson Abyss", color: [240, 50, 50] },
  ];

  const SPELL_NAMES = [
    '符の壱 「青嵐の扇舞」',
    '符の弐 「氷晶の牢獄」',
    '符の参 「紅蓮の業火」',
  ];
  const SPELL_NAMES_EN = [
    'Green Storm Fan Dance',
    'Crystal Prison of Ice',
    'Crimson Lotus of Hellfire',
  ];

  // Touch drag state
  let touchAnchor = null;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    sx = p.width / ARENA_W;
    sy = p.height / ARENA_H;
    if (socket.connected) myId = socket.id;

    socket.on("connect", () => { myId = socket.id; });

    socket.on("gameStarted", (state) => {
      players = state.players;
      boss = state.boss || boss;
      if (state.bossIndex !== undefined) boss.bossIndex = state.bossIndex;
      if (players[myId]) {
        myX = players[myId].x;
        myY = players[myId].y;
      }
    });

    socket.on("bossDefeated", ({ bossIndex, transitioning: isTransitioning }) => {
      boss = { x: 0, y: 0, radius: 50, currentHealth: 0, maxHealth: 0 };
      if (isTransitioning) {
        transitioning = true;
        transitionStartTime = Date.now();
        transitionBossIndex = bossIndex || 1;
      }
    });

    socket.on("bossSpawned", ({ boss: newBoss, bossIndex }) => {
      boss = newBoss || boss;
      if (bossIndex !== undefined) boss.bossIndex = bossIndex;
      transitioning = false;
      transitionStartTime = 0;
    });

    socket.on("stateUpdate", (state) => {
      players = state.players;
      bullets = state.bullets || [];
      enemyBullets = state.enemyBullets || [];
      boss = state.boss || boss;
      if (state.bossIndex !== undefined) boss.bossIndex = state.bossIndex;
      sharedCharge = state.sharedCharge || 0;
      shield = state.shield || null;
      fairies = state.fairies || [];
      skillEffects = state.skillEffects || [];

      if (players[myId] && players[myId].skillCooldownUntil) {
        skillCooldownUntil = players[myId].skillCooldownUntil;
      }

      if (!gameOver) {
        const me = players[myId];
        if (!me || me.health <= 0) { gameOver = true; outcome = "defeat"; }
      }
    });

    socket.on("bombDetonated", () => { });

    p.canvas.tabIndex = -1;
    p.canvas.style.outline = 'none';
    p.canvas.addEventListener('click', () => p.canvas.focus());

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
  };

  p.draw = () => {
    p.background(0);
    sx = p.width / ARENA_W;
    sy = p.height / ARENA_H;

    if (!myId || !players[myId]) return;

    const me = players[myId];
    const now = Date.now();

    // --- Movement (free 2D) ---
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy = -1;
    if (keys['s'] || keys['arrowdown']) dy = 1;
    if (keys['a'] || keys['arrowleft']) dx = -1;
    if (keys['d'] || keys['arrowright']) dx = 1;

    // Normalize diagonal
    if (dx !== 0 && dy !== 0) {
      const inv = 1 / Math.SQRT2;
      dx *= inv; dy *= inv;
    }

    const speed = focusMode ? PLAYER_SPEED * 0.35 : PLAYER_SPEED;
    myX += dx * speed;
    myY += dy * speed;
    myX = Math.max(20, Math.min(ARENA_W - 20, myX));
    myY = Math.max(20, Math.min(ARENA_H - 20, myY));

    socket.emit("move", { x: myX, y: myY, roomCode });

    // --- Focus mode key ---
    if (keys['shift']) focusMode = true;
    else focusMode = false;

    // --- Auto-shoot straight up ---
    if (now - lastShotTime > SHOOT_COOLDOWN) {
      socket.emit("shoot", { x: myX, y: myY, vx: 0, vy: -12, roomCode });
      lastShotTime = now;
    }

    // --- Abilities ---
    if (keys['x'] && !usedAbility) {
      socket.emit("useAbility", { className: playerClass, roomCode });
      usedAbility = true;
    }
    if (!keys['x']) usedAbility = false;
    // --- Screen shake offset ---
    let shakeX = 0, shakeY = 0;
    if (shakeAmount > 0 && now < shakeTime) {
      shakeX = (Math.random() - 0.5) * shakeAmount * 2;
      shakeY = (Math.random() - 0.5) * shakeAmount * 2;
    } else {
      shakeAmount = 0;
    }
    p.push();
    if (shakeAmount > 0) p.translate(shakeX, shakeY);

    // --- Parallax Background ---
    const sc = Math.min(sx, sy);
    scrollY1 = (scrollY1 + SCROLL_SPEED_1 + ARENA_H) % ARENA_H;
    scrollY2 = (scrollY2 + SCROLL_SPEED_2 + ARENA_H) % ARENA_H;
    scrollY3 = (scrollY3 + SCROLL_SPEED_3 + ARENA_H) % ARENA_H;

    // Layer 1: distant stars
    p.noStroke();
    for (let star of distantStars) {
      const twinkle = 155 + 100 * Math.sin(p.frameCount * 0.02 + star.x);
      p.fill(255, 255, 255, twinkle);
      const syy = ((star.y + scrollY1) % ARENA_H) * sy;
      p.circle(star.x * sx, syy, star.size * sc);
    }

    // Layer 2: nebula clouds (full screen, slow scroll)
    for (let blob of nebulaBlobs) {
      const by = ((blob.y + scrollY2) % ARENA_H) * sy;
      p.fill(blob.r, blob.g, blob.b, blob.alpha);
      p.noStroke();
      p.ellipse(blob.x * sx, by, blob.w * sc, blob.h * sc);
    }

    // Layer 3: foreground debris
    for (let d of foregroundDebris) {
      const dy = ((d.y + scrollY3 * d.speed) % ARENA_H) * sy;
      p.fill(200, 220, 255, d.alpha);
      p.noStroke();
      p.circle(d.x * sx, dy, d.size * sc);
    }

    // --- Draw boss (if alive) ---
    if (boss.currentHealth > 0) {
      if (boss.isMultiBoss) {
        for (const mb of boss.bosses) {
          if (mb.hp <= 0) continue;
          const bscx = mb.x * sx;
          const bscy = mb.y * sy;
          drawMiniBoss(bscx, bscy, now, mb);
        }
        drawMultiBossHP();
      } else {
        const bscx = boss.x * sx;
        const bscy = boss.y * sy;
        drawBoss(bscx, bscy, now);
      }
    }

    // Shield
    if (shield) {
      const shx = shield.x * sx;
      const shy = shield.y * sy;
      p.noFill();
      p.stroke("cyan");
      p.strokeWeight(3);
      p.ellipse(shx, shy, shield.radius * 2 * Math.min(sx, sy));
    }

    // --- Draw players (Touhou characters) ---
    for (const id in players) {
      const pdata = players[id];
      const isMe = id === myId;
      const px = isMe ? myX * sx : pdata.x * sx;
      const py = isMe ? myY * sy : pdata.y * sy;
      const invincible = isMe && now < (me.invincibleUntil || 0);
      const blink = invincible && Math.floor(now / 100) % 2 === 0;
      if (!blink) {
        drawTouhouCharacter(p, px, py, pdata.className, pdata.health, isMe);
      }
      // Focus hitbox dot (actual hurtbox size)
      if (isMe && focusMode) {
        p.fill(255, 50, 50, 220);
        p.noStroke();
        p.circle(px, py, PLAYER_HURTBOX * 2);
        p.fill(255, 100, 100, 100);
        p.circle(px, py, PLAYER_HURTBOX * 4);
      }
    }

    // --- Enemy bullets (varying sizes) ---
    p.noStroke();
    for (let eb of enemyBullets) {
      const ebx = eb.x * sx;
      const eby = eb.y * sy;
      const size = (eb.size || 7) * Math.min(sx, sy);
      p.fill(255, 80, 80, 220);
      p.circle(ebx, eby, size);
      p.fill(255, 150, 150, 120);
      p.circle(ebx, eby, size * 1.5);
    }

    // --- Player bullets ---
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      const bx = b.x * sx;
      const by = b.y * sy;
      if (b.special === "slash") {
        const angle = Math.atan2(b.vy, b.vx);
        p.push();
        p.translate(bx, by);
        p.rotate(angle + p.HALF_PI);
        p.stroke(200, 255, 200, 200);
        p.strokeWeight(3 * Math.min(sx, sy));
        p.line(0, -15 * Math.min(sx, sy), 0, 15 * Math.min(sx, sy));
        p.stroke(255, 255, 255, 100);
        p.strokeWeight(6 * Math.min(sx, sy));
        p.line(0, -10 * Math.min(sx, sy), 0, 10 * Math.min(sx, sy));
        p.pop();
      } else if (b.special === "laser") {
        p.fill(255, 200, 50, 220);
        p.noStroke();
        p.ellipse(bx, by, 20 * Math.min(sx, sy), 12 * Math.min(sx, sy));
        p.fill(255, 255, 200, 150);
        p.ellipse(bx, by, 30 * Math.min(sx, sy), 18 * Math.min(sx, sy));
      } else if (b.special === "sniper") {
        p.fill(255, 255, 100, 220);
        p.noStroke();
        p.ellipse(bx, by, 14 * Math.min(sx, sy), 6 * Math.min(sx, sy));
        p.fill(255, 255, 200, 100);
        p.ellipse(bx, by, 22 * Math.min(sx, sy), 10 * Math.min(sx, sy));
      } else if (b.special === "assault") {
        p.fill(255, 160, 40, 220);
        p.noStroke();
        p.circle(bx, by, 6 * Math.min(sx, sy));
        p.fill(255, 200, 100, 80);
        p.circle(bx, by, 10 * Math.min(sx, sy));
      } else {
        p.fill(180, 220, 255, 220);
        p.noStroke();
        p.circle(bx, by, 8 * Math.min(sx, sy));
        p.fill(200, 240, 255, 80);
        p.circle(bx, by, 13 * Math.min(sx, sy));
      }
    }

    // --- Fairies ---
    for (const fairy of fairies) {
      const fx = fairy.x * sx;
      const fy = fairy.y * sy;
      const fsc = Math.min(sx, sy);
      p.push();
      p.translate(fx, fy);
      p.fill(180, 220, 255, 180);
      p.noStroke();
      p.ellipse(0, 0, 12 * fsc, 14 * fsc);
      p.fill(255, 255, 255, 150);
      p.ellipse(-8 * fsc, -2 * fsc, 8 * fsc, 12 * fsc);
      p.ellipse(8 * fsc, -2 * fsc, 8 * fsc, 12 * fsc);
      p.fill(255, 220, 180, 200);
      p.circle(0, -4 * fsc, 6 * fsc);
      p.fill(100, 150, 200, 180);
      p.arc(0, -4 * fsc, 8 * fsc, 6 * fsc, p.PI, 0);
      const hpRatio = fairy.hp / 20;
      p.fill(60, 20, 20, 150);
      p.rect(-8 * fsc, -12 * fsc, 16 * fsc, 2 * fsc, 1);
      p.fill(100, 200, 100, 200);
      p.rect(-8 * fsc, -12 * fsc, 16 * fsc * hpRatio, 2 * fsc, 1);
      p.pop();
    }

    // --- Skill Effects ---
    const now2 = Date.now();
    for (const effect of skillEffects) {
      const elapsed = now2 - effect.startTime;
      const progress = elapsed / effect.duration;
      if (progress > 1) continue;

      const ex = effect.x * sx;
      const ey = effect.y * sy;
      const esc = Math.min(sx, sy);
      const alpha = (1 - progress) * 200;

      if (effect.type === "laser") {
        const laserWidth = (40 - progress * 20) * esc;
        p.fill(255, 200, 50, alpha * 0.3);
        p.noStroke();
        p.rect(ex - laserWidth / 2, 0, laserWidth, ey);
        p.fill(255, 255, 200, alpha * 0.6);
        p.rect(ex - laserWidth / 4, 0, laserWidth / 2, ey);
        p.fill(255, 255, 255, alpha * 0.8);
        p.rect(ex - laserWidth / 8, 0, laserWidth / 4, ey);
      } else if (effect.type === "slash") {
        p.push();
        p.translate(ex, ey);
        const slashProgress = Math.min(1, progress * 3);
        for (let i = 0; i < 4; i++) {
          const angle = -0.6 + i * 0.4;
          const slashAlpha = alpha * (1 - i * 0.2);
          const slashLen = 60 * esc * slashProgress;
          p.stroke(200, 255, 200, slashAlpha);
          p.strokeWeight(4 * esc);
          p.line(
            Math.cos(angle) * 10 * esc, Math.sin(angle) * 10 * esc - 20 * esc,
            Math.cos(angle) * slashLen, Math.sin(angle) * slashLen - 40 * esc
          );
          p.stroke(255, 255, 255, slashAlpha * 0.5);
          p.strokeWeight(8 * esc);
          p.line(
            Math.cos(angle) * 15 * esc, Math.sin(angle) * 15 * esc - 20 * esc,
            Math.cos(angle) * (slashLen - 10 * esc), Math.sin(angle) * (slashLen - 10 * esc) - 40 * esc
          );
        }
        p.pop();
      }
    }

    // --- HUD Box (semi-transparent, left corner) ---
    drawHUDBox();

    // Back button
    p.fill(220, 220, 220, 200);
    p.stroke(255);
    p.strokeWeight(1.5);
    p.rect(backButton.x, backButton.y, backButton.w, backButton.h, backButton.r);
    p.fill(0);
    p.noStroke();
    p.textSize(16);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("Back", backButton.x + backButton.w / 2, backButton.y + backButton.h / 2);

    p.pop(); // end shake translate

    // --- Transition animation overlay ---
    if (transitioning) {
      const elapsed = now - transitionStartTime;

      // Phase 1 (0-600ms): white flash x3
      if (elapsed < 600) {
        const flashPhase = (elapsed % 200) / 200;
        const flashAlpha = Math.sin(flashPhase * Math.PI) * 200;
        p.fill(255, 255, 255, flashAlpha);
        p.noStroke();
        p.rect(0, 0, p.width, p.height);
      }

      // Phase 2 (600-1200ms): expanding EMP ring
      if (elapsed >= 600 && elapsed < 1200) {
        const empProgress = (elapsed - 600) / 600;
        const empRadius = empProgress * Math.max(p.width, p.height) * 0.8;
        p.noFill();
        p.stroke(255, 255, 255, 200 * (1 - empProgress));
        p.strokeWeight(4);
        p.circle(p.width / 2, p.height / 2, empRadius);
        p.stroke(180, 220, 255, 100 * (1 - empProgress));
        p.strokeWeight(8);
        p.circle(p.width / 2, p.height / 2, empRadius * 0.7);

        // Screen shake during EMP
        shakeAmount = 6;
        shakeTime = now + 400;
      }

      // Phase 3 (1200-1800ms): dark flash + screen shake
      if (elapsed >= 1200 && elapsed < 1800) {
        const darkAlpha = ((elapsed - 1200) / 600) * 180;
        p.fill(0, 0, 0, darkAlpha);
        p.noStroke();
        p.rect(0, 0, p.width, p.height);
      }

      // Phase 4 (1800-3000ms): banner fade in
      if (elapsed >= 1800) {
        const bannerAlpha = Math.min(1, (elapsed - 1800) / 500);
        const bi = transitionBossIndex;
        const bv = bossVisuals[bi] || bossVisuals[0];
        const [cr, cg, cb] = bv.color;

        // Semi-transparent dark bar
        p.fill(0, 0, 0, 140 * bannerAlpha);
        p.noStroke();
        p.rect(p.width * 0.15, p.height * 0.3, p.width * 0.7, p.height * 0.25, 10);

        // Phase number
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(48);
        p.fill(cr, cg, cb, 255 * bannerAlpha);
        p.textFont('monospace');
        p.text(`PHASE ${bi + 1}`, p.width / 2, p.height * 0.38);

        // Spell card name (kanji)
        p.textSize(22);
        p.fill(255, 220, 100, 220 * bannerAlpha);
        p.text(SPELL_NAMES[bi] || '', p.width / 2, p.height * 0.44);

        // English subtitle
        p.textSize(14);
        p.fill(255, 255, 255, 180 * bannerAlpha);
        p.text(SPELL_NAMES_EN[bi] || '', p.width / 2, p.height * 0.50);

        // Boss name
        p.textSize(12);
        p.fill(200, 200, 200, 150 * bannerAlpha);
        p.text(`— ${bv.name} —`, p.width / 2, p.height * 0.55);
      }

      // Phase 5 (2800ms+): brief flash on new boss spawn
      if (elapsed >= 2800 && elapsed < 3000) {
        const spawnFlash = ((elapsed - 2800) / 200) * 150;
        p.fill(255, 255, 255, spawnFlash);
        p.noStroke();
        p.rect(0, 0, p.width, p.height);
      }
    }

    // Game over overlay
    if (gameOver) {
      p.fill(0, 0, 0, 150);
      p.rect(0, 0, p.width, p.height);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(64);
      p.fill(outcome === "victory" ? "lime" : "red");
      p.text(outcome === "victory" ? "VICTORY!" : "DEFEAT", p.width / 2, p.height / 2);
    }
  };

  function drawBoss(bx, by, now) {
    const bi = boss.bossIndex || 0;
    if (bi === 0) drawBossFan(bx, by, now);
    else if (bi === 1) drawBossIce(bx, by, now);
    else drawBossOni(bx, by, now);
  }

  function drawMiniBoss(bx, by, now, mb) {
    const sc = Math.min(sx, sy);
    const r = mb.radius * sc;
    const [cr, cg, cb] = mb.color;
    const pulse = 1 + 0.1 * Math.sin(now * 0.0001 + mb.id);

    p.noFill();
    p.strokeWeight(2);
    p.stroke(cr, cg, cb, 100 + 50 * Math.sin(now * 0.00008 + mb.id));
    p.ellipse(bx, by, r * 4 * pulse);

    p.noStroke();
    p.fill(cr, cg, cb, 200);
    p.ellipse(bx, by, r * 1.8, r * 2);

    p.push();
    p.translate(bx, by);
    p.rotate(p.frameCount * 0.02 + mb.id);
    p.fill(cr + 40, cg + 40, cb + 40, 60);
    p.noStroke();
    for (let i = 0; i < 6; i++) {
      p.rotate(p.TWO_PI / 6);
      p.ellipse(10 * sc, 0, 8 * sc, 12 * sc);
    }
    p.pop();

    const corePulse = 1 + 0.08 * Math.sin(now * 0.00012 + mb.id);
    p.fill(255, 200, 100, 220);
    p.ellipse(bx, by, 14 * sc * corePulse);
    p.fill(cr, cg, cb);
    p.ellipse(bx, by, 8 * sc * corePulse);
    p.fill(255, 255, 200);
    p.ellipse(bx - 2 * sc, by - 2 * sc, 4 * sc);

    p.noFill();
    p.stroke(255, 255, 100, 180);
    p.strokeWeight(1);
    p.circle(bx, by, 8 * sc);
  }

  function drawMultiBossHP() {
    const sc = Math.min(sx, sy);
    const barW = 300 * sc;
    const barH = 14 * sc;
    const barX = p.width / 2 - barW / 2;
    const barY = 40 * sc;

    p.fill(0, 0, 0, 180);
    p.noStroke();
    p.rect(barX - 10 * sc, barY - 20 * sc, barW + 20 * sc, barH + 35 * sc, 6);

    p.fill(255, 200, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(11 * sc);
    p.textFont('monospace');
    p.text("TRINITY OF DESTRUCTION", p.width / 2, barY - 10 * sc);

    p.fill(60, 20, 20);
    p.rect(barX, barY, barW, barH, 4 * sc);

    const hpRatio = boss.currentHealth / boss.maxHealth;
    const gradient = p.lerpColor(p.color(240, 50, 50), p.color(200, 50, 200), 1 - hpRatio);
    p.fill(gradient);
    p.rect(barX, barY, barW * hpRatio, barH, 4 * sc);

    p.fill(255, 255, 255, 40);
    p.rect(barX, barY, barW * hpRatio, barH / 2, 4 * sc);

    p.noFill();
    p.stroke(255, 255, 255, 50);
    p.strokeWeight(1);
    p.rect(barX, barY, barW, barH, 4 * sc);

    let segmentX = barX;
    for (const mb of boss.bosses) {
      const segW = (mb.hp / (boss.maxHealth / 3)) * (barW / 3);
      const [cr, cg, cb] = mb.color;
      if (mb.hp > 0) {
        p.fill(cr, cg, cb, 180);
        p.noStroke();
        p.rect(segmentX, barY + barH + 3 * sc, segW, 4 * sc, 2);
      } else {
        p.fill(80, 80, 80, 100);
        p.noStroke();
        p.rect(segmentX, barY + barH + 3 * sc, barW / 3, 4 * sc, 2);
      }
      segmentX += barW / 3;
    }

    p.noStroke();
    p.fill(255, 255, 255, 200);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10 * sc);
    p.text(`${boss.currentHealth} / ${boss.maxHealth}`, p.width / 2, barY + barH / 2);
  }

  function drawBossFan(bx, by, now) {
    const sc = Math.min(sx, sy);
    const r = boss.radius * sc;
    const color = [80, 220, 80];
    const [cr, cg, cb] = color;
    const pulse = 1 + 0.08 * Math.sin(now * 0.00008);

    // Pulsing green aura
    p.noFill(); p.strokeWeight(3);
    p.stroke(cr, cg, cb, 80 + 40 * Math.sin(now * 0.00006));
    p.ellipse(bx, by, r * 5 * pulse);

    // Body (elegant oval)
    p.fill(cr, cg, cb, 200);
    p.ellipse(bx, by, r * 2, r * 2.4);

    // Fan wings (folding fan array)
    p.noStroke();
    for (let i = -3; i <= 3; i++) {
      const alpha = 180 - Math.abs(i) * 25;
      const fw = 60 - Math.abs(i) * 8;
      p.fill(cr, cg, cb, alpha);
      p.arc(bx, by, fw * sc, 80 * sc, p.PI - i * 0.1 - 0.3, p.PI - i * 0.1 + 0.3);
      p.arc(bx, by, fw * sc, 80 * sc, -i * 0.1 - 0.3, -i * 0.1 + 0.3);
    }

    // Inner rotating petal pattern
    p.push(); p.translate(bx, by); p.rotate(p.frameCount * 0.015);
    p.fill(100, 255, 100, 50); p.noStroke();
    for (let i = 0; i < 8; i++) {
      p.rotate(p.TWO_PI / 8);
      p.ellipse(14 * sc, 0, 10 * sc, 18 * sc);
    }
    p.pop();

    // Core (flower bud)
    const corePulse = 1 + 0.05 * Math.sin(now * 0.0001);
    p.fill(180, 255, 180, 220); p.ellipse(bx, by, 20 * sc * corePulse);
    p.fill(cr, cg, cb);          p.ellipse(bx, by, 12 * sc * corePulse);
    p.fill(255, 255, 200);       p.ellipse(bx - 2 * sc, by - 2 * sc, 5 * sc);

    drawBossUI(bx, by, now, color);
  }

  function drawBossIce(bx, by, now) {
    const sc = Math.min(sx, sy);
    const r = boss.radius * sc;
    const color = [60, 140, 255];
    const [cr, cg, cb] = color;
    const pulse = 1 + 0.08 * Math.sin(now * 0.00008);

    // Pulsing blue aura
    p.noFill(); p.strokeWeight(3);
    p.stroke(cr, cg, cb, 80 + 40 * Math.sin(now * 0.00006));
    p.ellipse(bx, by, r * 5 * pulse);

    // Body (crystal diamond)
    p.fill(cr, cg, cb, 200);
    p.push(); p.translate(bx, by); p.rotate(p.PI / 4);
    p.rect(0, 0, r * 1.6, r * 1.6);
    p.pop();

    // Hexagonal crystal outer ring
    p.push(); p.translate(bx, by); p.rotate(now * 0.0002);
    p.noFill(); p.stroke(cr, cg + 40, cb, 180); p.strokeWeight(2);
    for (let i = 0; i < 6; i++) {
      const a = i * p.TWO_PI / 6 - p.PI / 6;
      const ax = Math.cos(a) * r * 1.5;
      const ay = Math.sin(a) * r * 1.5;
      const a2 = ((i + 1) % 6) * p.TWO_PI / 6 - p.PI / 6;
      const bx2 = Math.cos(a2) * r * 1.5;
      const by2 = Math.sin(a2) * r * 1.5;
      p.line(ax, ay, bx2, by2);
    }
    p.pop();

    // Ice shard wings
    p.noStroke();
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 4; i++) {
        const shardH = (40 - i * 6) * sc;
        const shardW = (8 + i * 3) * sc;
        const sy = by - 5 * sc + i * 8 * sc;
        p.fill(cr + i * 20, cg + i * 15, cb, 150 - i * 20);
        p.triangle(
          bx + side * (12 + i * 3) * sc, sy - shardH / 2,
          bx + side * (12 + i * 3 - shardW / 2) * sc, sy + shardH / 2,
          bx + side * (12 + i * 3 + shardW / 2) * sc, sy + shardH / 2
        );
      }
    }

    // Inner rotating diamond field
    p.push(); p.translate(bx, by); p.rotate(p.frameCount * 0.02);
    p.fill(120, 200, 255, 40); p.noStroke();
    for (let i = 0; i < 6; i++) {
      p.rotate(p.TWO_PI / 6);
      p.rect(16 * sc, -3 * sc, 10 * sc, 6 * sc);
    }
    p.pop();

    // Core (ice crystal)
    const corePulse = 1 + 0.05 * Math.sin(now * 0.0001);
    p.fill(180, 220, 255, 220); p.ellipse(bx, by, 18 * sc * corePulse);
    p.fill(cr, cg, cb);          p.ellipse(bx, by, 10 * sc * corePulse);
    p.fill(200, 240, 255);       p.ellipse(bx - 2 * sc, by - 2 * sc, 4 * sc);

    drawBossUI(bx, by, now, color);
  }

  function drawBossOni(bx, by, now) {
    const sc = Math.min(sx, sy);
    const r = boss.radius * sc;
    const color = [240, 50, 50];
    const [cr, cg, cb] = color;
    const pulse = 1 + 0.08 * Math.sin(now * 0.00008);

    // Red chaotic aura
    p.noFill(); p.strokeWeight(3);
    p.stroke(cr, cg, cb, 80 + 40 * Math.sin(now * 0.0001));
    p.ellipse(bx, by, r * 5.5 * pulse);

    // Body (brutal circle)
    p.fill(cr, cg * 0.5, cb * 0.5, 200);
    p.ellipse(bx, by, r * 2.4, r * 2.2);

    // Jagged outer ring (fire ring)
    p.noFill(); p.strokeWeight(2);
    for (let i = 0; i < 12; i++) {
      const a = i * p.TWO_PI / 12 + now * 0.0003;
      const outerR = r * 1.8 + 10 * sc * Math.sin(now * 0.003 + i);
      p.stroke(cr + 15 * (i % 3), cg * 0.5, cb * 0.5, 160);
      p.point(bx + Math.cos(a) * outerR, by + Math.sin(a) * outerR);
    }

    // Demon wings (jagged)
    p.noStroke();
    for (let side = -1; side <= 1; side += 2) {
      p.fill(cr, cg * 0.6, cb * 0.6, 180);
      p.beginShape();
      p.vertex(bx - side * 5 * sc, by - 15 * sc);
      p.vertex(bx + side * 30 * sc, by - 40 * sc);
      p.vertex(bx + side * 45 * sc, by - 25 * sc);
      p.vertex(bx + side * 55 * sc, by - 35 * sc);
      p.vertex(bx + side * 40 * sc, by - 15 * sc);
      p.vertex(bx + side * 60 * sc, by - 5 * sc);
      p.vertex(bx + side * 40 * sc, by + 5 * sc);
      p.vertex(bx + side * 50 * sc, by + 20 * sc);
      p.vertex(bx + side * 30 * sc, by + 10 * sc);
      p.vertex(bx + side * 10 * sc, by - 5 * sc);
      p.endShape(p.CLOSE);
    }

    // Inner spinning fire ring
    p.push(); p.translate(bx, by); p.rotate(p.frameCount * 0.025);
    p.fill(255, 150, 50, 40); p.noStroke();
    for (let i = 0; i < 8; i++) {
      p.rotate(p.TWO_PI / 8);
      p.ellipse(20 * sc, 0, 8 * sc, 16 * sc);
    }
    p.pop();

    // Horns on top
    p.fill(cr, cg * 0.3, cb * 0.3);
    p.triangle(bx - 10 * sc, by - r * 0.7, bx - 5 * sc, by - r * 1.3, bx + 2 * sc, by - r * 0.7);
    p.triangle(bx + 10 * sc, by - r * 0.7, bx + 5 * sc, by - r * 1.3, bx - 2 * sc, by - r * 0.7);

    // Core (blazing eye)
    const corePulse = 1 + 0.06 * Math.sin(now * 0.00015);
    p.fill(255, 200, 100, 220); p.ellipse(bx, by, 24 * sc * corePulse);
    p.fill(cr, cg * 0.8, cb * 0.8); p.ellipse(bx, by, 16 * sc * corePulse);
    p.fill(255, 255, 200);        p.ellipse(bx - 3 * sc, by - 2 * sc, 6 * sc);

    drawBossUI(bx, by, now, color);
  }

  function drawBossUI(bx, by, now, bossColor) {
    const sc = Math.min(sx, sy);
    const r = boss.radius * sc;
    const bi = boss.bossIndex || 0;
    const [cr, cg, cb] = bossColor;

    // Hitbox indicator
    p.noFill(); p.stroke(255, 255, 100, 200); p.strokeWeight(1);
    p.circle(bx, by, 10 * sc);
    p.stroke(255, 255, 100, 100); p.circle(bx, by, 16 * sc);

    // Spell card banner
    const spellY = by - r - 60 * sc;
    p.fill(0, 0, 0, 160); p.noStroke();
    p.rect(bx - 110 * sc, spellY - 12 * sc, 220 * sc, 30 * sc, 4 * sc);
    p.fill(255, 220, 100); p.textAlign(p.CENTER); p.textSize(12 * sc); p.textFont('monospace');
    p.text(SPELL_NAMES[bi], bx, spellY + 2 * sc);
    p.fill(200, 200, 200, 180); p.textSize(9 * sc);
    p.text(SPELL_NAMES_EN[bi], bx, spellY + 14 * sc);

    // HP bar
    const barW = 160 * sc;
    const barH = 12 * sc;
    const barX = bx - barW / 2;
    const barY = by + r + 30 * sc;
    p.fill(60, 20, 20); p.rect(barX, barY, barW, barH, 4 * sc);
    const hpW = p.map(boss.currentHealth, 0, boss.maxHealth, 0, barW);
    p.fill(cr, cg, cb); p.rect(barX, barY, hpW, barH, 4 * sc);
    p.fill(255, 255, 255, 30); p.rect(barX, barY, hpW, barH / 2, 4 * sc);
    p.noFill(); p.stroke(255, 255, 255, 40); p.strokeWeight(1);
    p.rect(barX, barY, barW, barH, 4 * sc);
    // Phase markers (now spacing for 3 phases within the form)
    const marker1 = barX + barW * 0.33;
    const marker2 = barX + barW * 0.66;
    p.stroke(255, 255, 200, 100); p.strokeWeight(2);
    p.line(marker1, barY - 2 * sc, marker1, barY + barH + 2 * sc);
    p.line(marker2, barY - 2 * sc, marker2, barY + barH + 2 * sc);
    // HP text
    p.noStroke(); p.fill(255, 220);
    p.textAlign(p.CENTER, p.CENTER); p.textSize(10 * sc);
    p.text(`${boss.currentHealth} / ${boss.maxHealth}`, bx, barY + barH / 2);
  }

  function drawTouhouCharacter(sk, x, y, className, health, isMe) {
    const sc = Math.min(sx, sy);
    sk.push();
    sk.translate(x, y);

    const alpha = isMe ? 255 : 180;

    if (className === "Reimu") {
      // Red dress body
      sk.fill(200, 40, 40, alpha);
      sk.noStroke();
      sk.ellipse(0, 6 * sc, 18 * sc, 20 * sc);
      // White top
      sk.fill(255, 255, 255, alpha);
      sk.rect(-6 * sc, -10 * sc, 12 * sc, 12 * sc, 3 * sc);
      // Head
      sk.fill(255, 220, 180, alpha);
      sk.circle(0, -10 * sc, 10 * sc);
      // Hair ribbon (red)
      sk.fill(220, 30, 30, alpha);
      sk.triangle(8 * sc, -14 * sc, 14 * sc, -18 * sc, 6 * sc, -10 * sc);
      sk.triangle(-8 * sc, -14 * sc, -14 * sc, -18 * sc, -6 * sc, -10 * sc);
      // Gohei (paper wand) — a line on the right
      sk.stroke(255, 255, 200, alpha);
      sk.strokeWeight(2 * sc);
      sk.line(10 * sc, -4 * sc, 16 * sc, -12 * sc);
      sk.noStroke();
      sk.fill(255, 255, 200, alpha);
      sk.rect(15 * sc, -14 * sc, 2 * sc, 4 * sc);
      // Floating orbs
      sk.fill(255, 200, 50, alpha * 0.6);
      sk.circle(-14 * sc, -2 * sc, 4 * sc);
      sk.circle(14 * sc, 4 * sc, 3 * sc);
    } else if (className === "Marisa") {
      // Black dress
      sk.fill(30, 30, 30, alpha);
      sk.noStroke();
      sk.ellipse(0, 6 * sc, 16 * sc, 20 * sc);
      // White apron
      sk.fill(240, 240, 240, alpha);
      sk.rect(-5 * sc, 0, 10 * sc, 12 * sc, 2 * sc);
      // Head
      sk.fill(255, 220, 180, alpha);
      sk.circle(0, -10 * sc, 10 * sc);
      // Witch hat
      sk.fill(30, 30, 30, alpha);
      sk.triangle(-10 * sc, -12 * sc, 10 * sc, -12 * sc, 0, -22 * sc);
      sk.ellipse(0, -12 * sc, 14 * sc, 5 * sc);
      // Hat band (yellow)
      sk.fill(255, 200, 50, alpha);
      sk.rect(-8 * sc, -14 * sc, 16 * sc, 2 * sc, 1 * sc);
      // Broom — angled line
      sk.stroke(139, 90, 43, alpha);
      sk.strokeWeight(2 * sc);
      sk.line(-6 * sc, 14 * sc, -14 * sc, 22 * sc);
      sk.noStroke();
      sk.fill(139, 90, 43, alpha);
      sk.rect(-15 * sc, 21 * sc, 3 * sc, 8 * sc);
    } else if (className === "Eirin") {
      // Blue/white dress
      sk.fill(60, 120, 200, alpha);
      sk.noStroke();
      sk.ellipse(0, 6 * sc, 18 * sc, 20 * sc);
      // White top
      sk.fill(255, 255, 255, alpha);
      sk.rect(-6 * sc, -8 * sc, 12 * sc, 10 * sc, 3 * sc);
      // Head
      sk.fill(255, 220, 180, alpha);
      sk.circle(0, -10 * sc, 10 * sc);
      // Long silver hair (flowing down sides)
      sk.fill(200, 210, 220, alpha);
      sk.rect(-8 * sc, -10 * sc, 3 * sc, 14 * sc, 1 * sc);
      sk.rect(5 * sc, -10 * sc, 3 * sc, 14 * sc, 1 * sc);
      // Bow at back
      sk.fill(60, 80, 160, alpha);
      sk.ellipse(10 * sc, -8 * sc, 6 * sc, 3 * sc);
      sk.ellipse(-10 * sc, -8 * sc, 6 * sc, 3 * sc);
    } else if (className === "Youmu") {
      // Green hakama (skirt)
      sk.fill(40, 160, 80, alpha);
      sk.noStroke();
      sk.ellipse(0, 8 * sc, 16 * sc, 18 * sc);
      // White shirt
      sk.fill(255, 255, 255, alpha);
      sk.rect(-5 * sc, -6 * sc, 10 * sc, 10 * sc, 3 * sc);
      // Head
      sk.fill(255, 220, 180, alpha);
      sk.circle(0, -10 * sc, 10 * sc);
      // Short hair
      sk.fill(60, 60, 60, alpha);
      sk.arc(0, -10 * sc, 12 * sc, 10 * sc, p.PI, 0);
      // Ghost half — floating orb beside her
      sk.fill(200, 200, 255, alpha * 0.7);
      sk.circle(-14 * sc, -4 * sc, 8 * sc);
      sk.fill(255, 255, 255, alpha * 0.5);
      sk.circle(-14 * sc, -4 * sc, 5 * sc);
      // Sword — extending upward
      sk.stroke(200, 200, 200, alpha);
      sk.strokeWeight(2 * sc);
      sk.line(8 * sc, 4 * sc, 12 * sc, -10 * sc);
      sk.noStroke();
      sk.fill(255, 220, 100, alpha);
      sk.rect(8 * sc, 4 * sc, 4 * sc, 3 * sc);
    }

    // Health indicator (small bar above character)
    if (isMe || health > 0) {
      const hw = 16 * sc;
      const hh = 2 * sc;
      const hx = -hw / 2;
      const hy = -18 * sc;
      const hpColor = health > 5 ? [60, 200, 60] : health > 2 ? [255, 200, 50] : [255, 60, 60];
      sk.fill(60, 20, 20, alpha * 0.8);
      sk.rect(hx, hy, hw, hh, 1);
      const hpW = (health / playerStats[className]?.hp || 1) * hw;
      sk.fill(hpColor[0], hpColor[1], hpColor[2], alpha * 0.9);
      sk.rect(hx, hy, hpW, hh, 1);
    }

    // Selection ring for self
    if (isMe) {
      sk.noFill();
      sk.stroke(255, 255, 255, 60);
      sk.strokeWeight(1);
      sk.circle(0, 0, 22 * sc);
    }

    sk.pop();
  }

  function drawHUDBox() {
    const pad = 10;
    const bx = backButton.x;
    const by = backButton.y + backButton.h + 10;
    const bw = 160;
    const bh = 180;

    // Semi-transparent background
    p.fill(0, 0, 0, 160);
    p.noStroke();
    p.rect(bx, by, bw, bh, 6);

    p.textAlign(p.LEFT, p.TOP);
    p.textSize(13);
    p.textFont('monospace');

    // Character name
    p.fill(255, 220, 100);
    p.text(playerClass, bx + pad, by + pad);

    // HP bar
    const me = players[myId];
    if (me) {
      const hpY = by + pad + 18;
      p.fill(255, 255, 255, 180);
      p.text(`HP ${me.health}/${me.maxHealth}`, bx + pad, hpY);

      const barX = bx + pad;
      const barY = hpY + 14;
      const barW = bw - pad * 2;
      const barH = 6;
      p.fill(60, 20, 20);
      p.rect(barX, barY, barW, barH, 2);
      const hpRatio2 = me.health / me.maxHealth;
      const hpColor2 = hpRatio2 > 0.6 ? [60, 200, 60] : hpRatio2 > 0.3 ? [255, 200, 50] : [255, 60, 60];
      p.fill(hpColor2[0], hpColor2[1], hpColor2[2]);
      p.rect(barX, barY, barW * hpRatio2, barH, 2);
    }

    // Charge counter
    const chargeY = by + pad + 50;
    p.fill(255, 255, 255, 180);
    p.text(`Charge: ${sharedCharge}`, bx + pad, chargeY);

    // Skill panel
    const skillPanelY = chargeY + 18;
    const skillNames = {
      Reimu: "Shield Barrier",
      Eirin: "Team Heal",
      Marisa: "Master Spark",
      Youmu: "Phantom Slash"
    };
    const skillCosts = { Reimu: 10, Eirin: 10, Marisa: 5, Youmu: 5 };
    const skillCooldowns = { Reimu: 30000, Eirin: 30000, Marisa: 10000, Youmu: 0 };

    const skillName = skillNames[playerClass] || "Skill";
    const skillCost = skillCosts[playerClass] || 5;
    const maxCooldown = skillCooldowns[playerClass] || 0;
    const now3 = Date.now();
    const remainingCD = Math.max(0, skillCooldownUntil - now3);
    const cdRatio = maxCooldown > 0 ? remainingCD / maxCooldown : 0;

    p.fill(40, 40, 60, 180);
    p.rect(bx + pad, skillPanelY, bw - pad * 2, 32, 4);

    if (cdRatio > 0) {
      p.fill(100, 100, 150, 150);
      p.rect(bx + pad, skillPanelY, (bw - pad * 2) * cdRatio, 32, 4);
    }

    p.fill(255, 255, 255, 200);
    p.textSize(10);
    p.textAlign(p.LEFT, p.TOP);
    p.text(skillName, bx + pad + 4, skillPanelY + 4);

    p.fill(200, 200, 100, 180);
    p.textSize(9);
    p.text(`${skillCost} charges`, bx + pad + 4, skillPanelY + 16);

    if (cdRatio > 0) {
      p.fill(255, 100, 100, 200);
      p.textAlign(p.RIGHT, p.TOP);
      p.text(`${Math.ceil(remainingCD / 1000)}s`, bx + bw - pad - 4, skillPanelY + 4);
    } else {
      p.fill(100, 255, 100, 200);
      p.textAlign(p.RIGHT, p.TOP);
      p.text("READY", bx + bw - pad - 4, skillPanelY + 4);
    }

    // Action buttons (touch zones)
    const btnY = skillPanelY + 38;
    const btnH = 18;
    const gap = 2;

    // Bomb button (red)
    p.fill(180, 40, 40, 180);
    p.rect(bx + pad, btnY, bw - pad * 2, btnH, 3);
    p.fill(255, 200, 200);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(11);
    p.text(`[Z] BOMB`, bx + bw / 2, btnY + btnH / 2);

    // Skill button (green)
    const skillY2 = btnY + btnH + gap;
    const skillReady = cdRatio === 0 && sharedCharge >= skillCost;
    p.fill(skillReady ? 40 : 80, skillReady ? 140 : 80, skillReady ? 60 : 80, 180);
    p.rect(bx + pad, skillY2, bw - pad * 2, btnH, 3);
    p.fill(skillReady ? 200 : 100, skillReady ? 255 : 100, skillReady ? 200 : 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(11);
    p.text(`[X] ${!skillReady ? (cdRatio > 0 ? 'COOLDOWN' : 'NO CHARGE') : 'SKILL'}`, bx + bw / 2, skillY2 + btnH / 2);

    // Focus toggle (blue)
    const focusY2 = skillY2 + btnH + gap;
    p.fill(40, 80, 160, 180);
    p.rect(bx + pad, focusY2, bw - pad * 2, btnH, 3);
    p.fill(focusMode ? 150 : 100, focusMode ? 200 : 150, 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(11);
    p.text(`[Shift] Focus ${focusMode ? 'ON' : 'OFF'}`, bx + bw / 2, focusY2 + btnH / 2);

    // Cheat indicators
    const cheatY = focusY2 + btnH + gap + 4;
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(9);
    if (godMode) {
      p.fill(255, 215, 0);
      p.text("F1 GOD MODE", bx + pad, cheatY);
    }
    if (infiniteCharges) {
      p.fill(0, 255, 255);
      p.text("F2 INF CHARGES", bx + pad, cheatY + 12);
    }
    if (megaDamage) {
      p.fill(255, 50, 50);
      p.text("F3 100x DMG", bx + pad, cheatY + (infiniteCharges ? 24 : 12));
    }
  }

  // --- Desktop keyboard (native listeners, robust against blur) ---
  function handleKeyDown(e) {
    keys[e.key.toLowerCase()] = true;
    const now = Date.now();
    if ((e.key === 'z' || e.key === ' ') && now > bombCooldown) {
      socket.emit("bomb");
      bombCooldown = now + 500;
    }
    if (e.key === 'F1') {
      godMode = !godMode;
      socket.emit("cheat", { type: "godMode", enabled: godMode, roomCode });
    }
    if (e.key === 'F2') {
      infiniteCharges = !infiniteCharges;
      socket.emit("cheat", { type: "infiniteCharges", enabled: infiniteCharges, roomCode });
    }
    if (e.key === 'F3') {
      megaDamage = !megaDamage;
      socket.emit("cheat", { type: "megaDamage", enabled: megaDamage, roomCode });
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
  }

  function handleKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
  }

  function handleBlur() {
    keys = {};
    focusMode = false;
  }

  // --- Mobile touch (drag to move) ---
  const HUD_BOX_X = backButton.x;
  const HUD_BOX_Y = backButton.y + backButton.h + 10;
  const HUD_BOX_W = 160;
  const HUD_BOX_H = 180;

  p.touchStarted = () => {
    const touch = p.touches[0];
    if (!touch) return false;
    if (
      touch.x > backButton.x && touch.x < backButton.x + backButton.w &&
      touch.y > backButton.y && touch.y < backButton.y + backButton.h
    ) {
      goBack();
      return false;
    }
    if (touch.x >= HUD_BOX_X && touch.x <= HUD_BOX_X + HUD_BOX_W &&
        touch.y >= HUD_BOX_Y && touch.y <= HUD_BOX_Y + HUD_BOX_H) {
      const relY = touch.y - HUD_BOX_Y;
      if (relY > 156) {
        focusMode = !focusMode;
      } else if (relY > 136) {
        socket.emit("useAbility", { className: playerClass, roomCode });
      } else if (relY > 116) {
        socket.emit("bomb");
      }
      return false;
    }
    touchAnchor = { x: touch.x, y: touch.y };
    return false;
  };

  p.touchMoved = () => {
    const touch = p.touches[0];
    if (!touch || !touchAnchor) return false;
    const dx2 = (touch.x - touchAnchor.x) * 0.3;
    const dy2 = (touch.y - touchAnchor.y) * 0.3;
    const moveSpeed = focusMode ? 1.5 : 4;
    const len = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    if (len > 0) {
      const normX = dx2 / len;
      const normY = dy2 / len;
      const mag = Math.min(len, 5);
      myX += normX * mag * moveSpeed;
      myY += normY * mag * moveSpeed;
      myX = Math.max(20, Math.min(ARENA_W - 20, myX));
      myY = Math.max(20, Math.min(ARENA_H - 20, myY));
    }
    return false;
  };

  p.touchEnded = () => {
    touchAnchor = null;
    return false;
  };

  p.mousePressed = () => {
    if (
      p.mouseX > backButton.x && p.mouseX < backButton.x + backButton.w &&
      p.mouseY > backButton.y && p.mouseY < backButton.y + backButton.h
    ) {
      goBack();
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
};
