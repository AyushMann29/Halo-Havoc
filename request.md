# Project Update: Architecture Refactor, Network Efficiency, and Performance

## 1. Code Segmentation & Modularization
The codebase needs to be refactored out of monolithic files to improve maintainability and server performance. Please restructure the code into the following domain-specific modules:
* `server.js` / `app.js`: Entry point, WebSocket initialization, and global loop ticking.
* `entities/`: Directory containing `Player.js`, `Boss.js`, and `Minion.js` (handling movement and state).
* `systems/`: Directory containing:
  * `CollisionManager.js`: Handles all hitboxes and spatial math.
  * `NetworkManager.js`: Handles encoding/decoding payloads and WebSocket broadcasts.
* `utils/`: Constants, math helpers, and configuration files.

## 2. Network Payload Optimization (Bandwidth Reduction)
To reduce data usage across mobile and desktop devices, we must stop sending bloated JSON objects over WebSockets.
* **Array Packing:** Convert object payloads to flat arrays. 
  * *Bad:* `{"id": "p1", "x": 100, "y": 200, "hp": 50}` (Approx 45 bytes)
  * *Good:* `["p1", 100, 200, 50]` (Approx 15 bytes)
* **Delta Compression:** Only broadcast the *changes* in state. If a player hasn't moved or fired, do not include them in the current server tick payload.
* **Precision Truncation:** Round all floating-point coordinates (e.g., `x: 100.49281`) to one decimal place (`100.5`) or integers before sending them over the network.

## 3. Server CPU & Memory Efficiency
* **Object Pooling (Bullets & Enemies):** Do not use `new Bullet()` or `destroy()` during the gameplay loop. Pre-allocate an array of 2000 bullet objects when the lobby starts. When a bullet goes off-screen, flag it as `active: false` and reuse it for the next shot. This prevents the garbage collector from freezing the game.
* **Spatial Hashing (Collision Optimization):** Instead of checking every bullet against every player in an `O(N*M)` loop, divide the canvas into a grid. Only run collision math if a bullet and a player are in the same or adjacent grid cells.

---

## 4. Required Deliverable: Changelog
As per project rules, append a structured Changelog at the bottom of your response listing all new files created, files modified, and a brief description of the performance improvements made.