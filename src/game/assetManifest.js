const ASSET_BASE = "/game-assets/FISH SWIM ASSET";

export const FISH_ASSET = {
  key: "fish-swim",
  path: `${ASSET_BASE}/fish-assets/Fish1_sprite.png`,
  frameWidth: 640,
  frameHeight: 640,
  sourceSize: { width: 7680, height: 640 },
};

export const BACKGROUND_MANIFEST = {
  1: {
    base: `${ASSET_BASE}/background-assets/background1/1_game_background.png`,
    layers: [
      `${ASSET_BASE}/background-assets/background1/1.png`,
      `${ASSET_BASE}/background-assets/background1/2.png`,
      `${ASSET_BASE}/background-assets/background1/3.png`,
      `${ASSET_BASE}/background-assets/background1/4.png`,
      `${ASSET_BASE}/background-assets/background1/5.png`,
      `${ASSET_BASE}/background-assets/background1/6.png`,
    ],
  },
  2: {
    base: `${ASSET_BASE}/background-assets/background2/2_game_background.png`,
    layers: [
      `${ASSET_BASE}/background-assets/background2/1.png`,
      `${ASSET_BASE}/background-assets/background2/2.png`,
      `${ASSET_BASE}/background-assets/background2/3.png`,
      `${ASSET_BASE}/background-assets/background2/4.png`,
      `${ASSET_BASE}/background-assets/background2/5.png`,
      `${ASSET_BASE}/background-assets/background2/6.png`,
      `${ASSET_BASE}/background-assets/background2/7.png`,
      `${ASSET_BASE}/background-assets/background2/8.png`,
    ],
  },
  3: {
    base: `${ASSET_BASE}/background-assets/background3/3_game_background.png`,
    layers: [
      `${ASSET_BASE}/background-assets/background3/1.png`,
      `${ASSET_BASE}/background-assets/background3/2.png`,
      `${ASSET_BASE}/background-assets/background3/3.png`,
      `${ASSET_BASE}/background-assets/background3/4.png`,
      `${ASSET_BASE}/background-assets/background3/5.png`,
      `${ASSET_BASE}/background-assets/background3/6.png`,
    ],
  },
  4: {
    base: `${ASSET_BASE}/background-assets/background4/4_game_background.png`,
    layers: [
      `${ASSET_BASE}/background-assets/background4/1.png`,
      `${ASSET_BASE}/background-assets/background4/2.png`,
      `${ASSET_BASE}/background-assets/background4/3.png`,
      `${ASSET_BASE}/background-assets/background4/4.png`,
      `${ASSET_BASE}/background-assets/background4/5.png`,
      `${ASSET_BASE}/background-assets/background4/6.png`,
    ],
  },
};

export const TRAP_ASSETS = {
  "trap-bomb": {
    path: `${ASSET_BASE}/trap-assets/Bomb.png`,
    sourceSize: { width: 239, height: 227 },
  },
  "trap-anchor": {
    path: `${ASSET_BASE}/trap-assets/Anchor.png`,
    sourceSize: { width: 219, height: 277 },
  },
  "trap-stone-bot": {
    path: `${ASSET_BASE}/trap-assets/Stone_bot.png`,
    sourceSize: { width: 280, height: 375 },
  },
  "trap-stone-1bot": {
    path: `${ASSET_BASE}/trap-assets/Stone_1bot.png`,
    sourceSize: { width: 313, height: 527 },
  },
  "trap-steering-wheel-bot": {
    path: `${ASSET_BASE}/trap-assets/Steering-wheel_bot.png`,
    sourceSize: { width: 296, height: 278 },
  },
  "trap-chain-top": {
    path: `${ASSET_BASE}/trap-assets/Chain_top.png`,
    sourceSize: { width: 34, height: 343 },
  },
  "trap-stone-top": {
    path: `${ASSET_BASE}/trap-assets/Stone_top.png`,
    sourceSize: { width: 144, height: 324 },
  },
  "trap-barrel-2": {
    path: `${ASSET_BASE}/trap-assets/Barrel_2.png`,
    sourceSize: { width: 264, height: 212 },
  },
  "trap-mini-bomb": {
    path: `${ASSET_BASE}/boost-assets/Small-bomb.png`,
    sourceSize: { width: 138, height: 153 },
  },
};

export const BOOST_ASSETS = {
  "boost-acceleration": {
    path: `${ASSET_BASE}/boost-assets/Acceleration.png`,
    sourceSize: { width: 106, height: 161 },
  },
  "boost-pearl-real": {
    path: `${ASSET_BASE}/boost-assets/Pearl.png`,
    sourceSize: { width: 140, height: 119 },
  },
  "boost-shield": {
    path: `${ASSET_BASE}/boost-assets/Shield.png`,
    sourceSize: { width: 98, height: 124 },
  },
  "boost-crown": {
    path: `${ASSET_BASE}/boost-assets/Crown.png`,
    sourceSize: { width: 126, height: 133 },
  },
};
