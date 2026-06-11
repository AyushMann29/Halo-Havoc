# Halo Havoc - Domain Glossary

## Core Concepts

**Room** - A game session with a unique code. Contains players, boss state, bullets, and game logic.

**Boss Phase** - A boss encounter with unique visuals and attack patterns. Game has 3 phases, each with increasing difficulty. Phase 3 features three mini-bosses ("Trinity of Destruction") on screen simultaneously with combined HP.

**Transition** - The 3-second animation between boss phases. Server pauses game logic, client plays visual effects.

**Charge** - Resource earned by grazing enemy bullets. Spent on abilities and bombs. Shared across all players in a room.

**Graze** - Passing close to an enemy bullet without being hit. Awards +1 charge.

**Focus Mode** - Hold Shift to slow movement and reveal precise hurtbox (red dot). Used for tight dodging.

**Bomb** - Defensive ability (Z key). Costs 30 charges, clears all enemy bullets, grants invincibility.

## Characters

**Reimu** - Shrine maiden. 10 HP. Skill: Shield Barrier (10 charges, 30s CD) - blocks bullets in radius.

**Marisa** - Witch. 5 HP. Skill: Master Spark Laser (5 charges, 10s CD) - instant beam dealing 100 damage.

**Eirin** - Lunar sage. 4 HP. Skill: Team Heal (10 charges, 30s CD) - restores 1 HP to all allies.

**Youmu** - Swordswoman. 3 HP. Skill: Phantom Slash (5 charges, no CD) - 3-4 diagonal slashes dealing 10 damage.

## Enemies

**Fairy** - Minion spawned in waves during boss fight. 20 HP. Moves toward player, shoots 3-bullet spread, exits after 15s. Killing grants +5 charges.

## UI Elements

**Skill Panel** - HUD element below charge counter showing skill name, cost, and cooldown bar.

**How to Play Modal** - Main menu overlay explaining controls, charges, focus mode, and objective with CSS diagrams.

## Cheat Codes (Testing Only)

**F1 - God Mode** - Toggle invincibility. Player cannot take damage. Gold indicator in HUD.

**F2 - Infinite Charges** - Set shared charges to 999. Cyan indicator in HUD.

**F3 - 100x Damage** - All bullets deal 1000 damage instead of 10. Red indicator in HUD.
