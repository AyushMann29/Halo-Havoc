# Project Update: Space Parallax Background & Boss Phase Transitions

## 1. Environment: Parallax Space Background
Implement a continuous vertical scrolling background on the canvas to simulate forward movement through space.
* **Parallax Layering:** Create at least three distinct layers moving at different velocities (e.g., slow distant stars, mid-speed nebulae, fast foreground debris) to create depth.
* **Optimization:** Ensure the rendering is efficient by wrapping the Y-coordinates (using the modulo operator based on screen height) to recycle visual elements and prevent coordinate overflow.

## 2. Entity State: Boss Phase Transitions
Add dynamic visual and mechanical transitions when the new boss enters and make boss look like a touhou character like a green fan also (e.g., crossing specific HP thresholds).
* **State Machine Update:** Introduce a temporary `TRANSITION` state for the boss where standard movement and attack routines are paused.
* **Visual & Mechanical Flair:**
  * Trigger a screen-wide bullet clear (EMP/bomb effect) to reset the board.
  * Render particle bursts, screen shake, or a color-tint shift on the boss sprite.
  * Provide the boss with temporary i-frames (invulnerability) during the transition animation.
* **UI Feedback:** Display a high-contrast warning or "PHASE 2" text overlay on the canvas.

## 3. Workflow Requirement: Mandatory Changelog
Moving forward, every time you generate or modify code, you must append a structured **Changelog** at the bottom of your response. 
* List the exact filenames modified.
* Detail the specific functions added, modified, or state variables introduced (e.g., `bossState.transitioning`).

## 4. Production Deployment Architecture (Render + Vercel)
Configure a production-ready, persistent pipeline splitting the frontend and backend layers to accommodate the new lobby state synchronization:

* **Backend (Render Web Services):** 
  * Deploy the persistent server instance on a paid **Render Web Service** tier (do not use Background Workers or Cron Jobs) to guarantee the CPU is always allocated and the in-memory lobby states do not flush.
  * Configure the service instance to prevent scale-to-zero sleeping, ensuring long-lived WebSocket handshake persistence.
  * Set up explicit environment variables (`ALLOWED_ORIGINS`) to handle Cross-Origin Resource Sharing (CORS) securely between the Vercel domain and Render.
* **Frontend (Vercel Static Hosting):** 
  * Configure Next.js for a purely static output (`output: 'export'` in `next.config.js`) so that Vercel serves the asset bundle completely via CDN edge networks.
  * Inject the production Render WebSocket URL via environment variables (`NEXT_PUBLIC_WS_SERVER_URL`) at build time, ensuring client connections upgrade cleanly from `https://` to secure `wss://`.