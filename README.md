# 🌌 Halo Havoc

[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![p5.js](https://img.shields.io/badge/p5.js-ED225D?style=for-the-badge&logo=p5dotjs&logoColor=white)](https://p5js.org/)

**Halo Havoc** is a real-time multiplayer cooperative bullet hell (danmaku) game built for the web. Players join rooms together via a room code, select from unique classes, and coordinate their skills to survive three intense boss phases.

---

## 📊 Live Metrics & Validation
This project was put to the test in production:
* **Active Players:** 13 concurrent players online dodging bullets together.
* **Survival Rate:** Highly challenging gameplay! Only **2 players** successfully survived all bullet phases to reach the final boss.

---

## 🛠️ Tech Stack & Architecture
The project is divided into a client-server architecture:
* **Frontend (`my-game/`):** React + Vite dashboard for lobbies/class selection, rendering a high-performance **p5.js** canvas for bullet/player drawing.
* **Backend (`server/`):** Node.js server using **Express** and **Socket.io** to manage real-time tickrate synchronization, room management, and state logic.

```mermaid
graph TD
    Client1[React Client - Player 1] <-->|Socket.io events| Server(Node.js Server)
    Client2[React Client - Player 2] <-->|Socket.io events| Server
    Server -->|Sync state / ticks| Client1
    Server -->|Sync state / ticks| Client2
    subgraph Frontend (React + p5.js)
    Client1 --> Canvas1(p5.js Canvas Game Loop)
    end
    subgraph Backend (Express + Socket.io)
    Server --> RoomManager(Room Code & Lobby Manager)
    Server --> ObjectPools(Object Pooling: Bullets/Minions)
    Server --> CollisionEngine(Collision & Graze Detection)
    end
```

---

## 🚀 Key Engineering & Design Highlights

### 1. Object Pooling Optimization
Spawning, tracking, and destroying thousands of enemy bullets and minion waves in real-time can choke the JavaScript garbage collector, leading to gameplay stutters.
To prevent this, the Node.js server maintains pre-allocated arrays (`fairiesPool` and `enemyBulletsPool`). Bullet and minion slots are flagged as active or inactive and recycled, achieving a flat memory footprint under high bullet load.

### 2. Bullet Grazing & Global Charge Co-op
Unlike single-player bullet hells, players share a room-wide **Charge** pool:
* **Graze mechanic:** Passing extremely close to an enemy bullet without colliding awards +1 charge.
* **Shared Abilities:** Charge is spent on powerful class abilities (Shield Barriers, Team Heals, Phantom Slashes) or screen-clearing bombs that clear all bullets and grant room-wide invincibility.

### 3. Class-Based Synergy
Players choose from 4 playable characters with distinct stats and tactical utility:
* **Reimu (Shrine Maiden):** high HP (10), drops bullet-blocking shield barriers.
* **Marisa (Witch):** glass cannon (5 HP), fires a massive Master Spark Laser beam.
* **Eirin (Lunar Sage):** support (4 HP), restores health to all players in the room.
* **Youmu (Swordswoman):** agile (3 HP), unleashes rapid close-combat Phantom Slashes.

---

## ⚙️ Local Development Setup

To run the game locally, you will need to start both the server and the frontend client.

### 1. Backend Server Setup
1. Open a terminal and navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and configure your ports:
   ```bash
   cp .env.example .env
   ```
4. Start the server:
   ```bash
   npm start
   ```
   *The server runs by default on port `3001`.*

### 2. Frontend Client Setup
1. Open a new terminal and navigate to the `my-game/` directory:
   ```bash
   cd my-game
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend runs by default on port `5173`.*

---

## 🎮 Cheats & Testing Codes
To make testing and game recording easy, the following testing shortcuts are available inside the game canvas:
* **`F1` - God Mode:** Toggles invincibility (gold indicator in HUD).
* **`F2` - Infinite Charges:** Sets shared charges to `999` (cyan indicator in HUD).
* **`F3` - 100x Damage:** Multiplies player bullet damage by 100 (red indicator in HUD).
