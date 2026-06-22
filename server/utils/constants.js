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

const FAIRY_HP = 20;
const FAIRY_SPEED = 2;
const FAIRY_STOP_DISTANCE = 120;
const FAIRY_SHOOT_INTERVAL = 1500;
const FAIRY_LIFETIME = 15000;
const FAIRY_CHARGE_REWARD = 5;
const FAIRY_WAVE_INTERVAL = 20000;
const FIRST_FAIRY_WAVE_DELAY = 5000;

const SKILL_COOLDOWNS = {
  Reimu: 30000,
  Eirin: 30000,
  Marisa: 10000,
  Youmu: 0
};

const SKILL_COSTS = {
  Reimu: 10,
  Eirin: 10,
  Marisa: 5,
  Youmu: 5
};

const playerStats = {
  Reimu: { hp: 10 },
  Marisa: { hp: 5 },
  Eirin: { hp: 4 },
  Youmu: { hp: 3 }
};

module.exports = {
  ARENA_W,
  ARENA_H,
  BOSS_Y,
  BOSS_RADIUS,
  PLAYER_HURTBOX,
  GRAZE_MARGIN,
  BOMB_COST,
  BOSS_BASE_HP,
  BOSS_SCALE_PER_PLAYER,
  BOSS_FRACTIONS,
  BOSS_COLORS,
  BOSS_NAMES,
  BOSS_TITLES,
  FAIRY_HP,
  FAIRY_SPEED,
  FAIRY_STOP_DISTANCE,
  FAIRY_SHOOT_INTERVAL,
  FAIRY_LIFETIME,
  FAIRY_CHARGE_REWARD,
  FAIRY_WAVE_INTERVAL,
  FIRST_FAIRY_WAVE_DELAY,
  SKILL_COOLDOWNS,
  SKILL_COSTS,
  playerStats
};
