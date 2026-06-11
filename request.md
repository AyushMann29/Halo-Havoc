# Project Update: Critical Fixes, Touhou Aesthetics, and Character Skill Balancing

## 1. Critical Bug Fix
* **Fix Unplayable Phase Transition Glitch:** There is a critical bug where the boss transition completely breaks, locking the game loop and leaving the game in an unplayable state. Debug the state machine transition code. Ensure that when the boss hits a phase threshold, it successfully clears out old variables, executes the transition animation, and moves cleanly into the next state without freezing the game engine or blocking player input.

## 2. Character & Enemy Features (Touhou Theme)
* **Boss Visual Overhaul:** Replace the placeholder color shapes for the boss with a stylized female boss sprite/artwork to match the classic Touhou aesthetic.
* **Minion Spawning (Fairies):** Implement a wave system where small fairy minions are summoned from various sides of the screen during the boss fight. 
  * Fairies should have exactly `20 HP`.
  * They should fire simple, low-density bullet patterns toward the player before exiting or being destroyed.

## 3. Gameplay Mechanics & Skill Balancing
Implement static, unique skills for the characters and add explicit charge and cooldown restrictions:
* **Global Defensive Skills:**
  * **Healing Ability:** Costs `10 charges`, has a `30-second cooldown`.
  * **Shield Ability:** Costs `10 charges`, has a `30-second cooldown`.
* **Character Specific Offense Skills:**
  * **Marisa (Laser Skill):** Fires a straight, piercing master-spark style laser beam for exactly `3 seconds`. It has a `10-second cooldown` and deals `3x` the damage of a standard bullet.
  * **Youmu (Melee Slash Skill):** Slashes her sword directly in front of her. This acts as a melee attack with a large, wide hitbox. It has `0-second cooldown` (spammable but limited by range).

## 4. UI Layout & Tutorial Updates
* **In-Game Skill Panel:** Next to the player's Charge counter in the HUD, add a dedicated skill card display showing the name of the ability, a short descriptive text of what it does, and a visual cooldown overlay/timer for each skill.
* **"How to Play" Main Menu Overlay:** Add a button on the main menu that opens a modal explaining the basics in clear, medium-sized text. 
  * Use CSS-drawn diagrams/icons to visually illustrate concepts. 
  * **Example:** For "Charges", explain: *"You get charges from graze points by getting dangerously close to enemy bullets."* Include a small CSS visual next to it showing the exact icon used inside the gameplay canvas.

---

## 5. Required Deliverable: Changelog
As per project rules, you must append a structured Changelog at the bottom of your response listing all modified files, added components, and state updates.