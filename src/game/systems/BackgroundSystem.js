import { BACKGROUND_THEME_SCORE_STEP, GAME_HEIGHT, GAME_WIDTH } from "../constants.js";

const THEME_CONFIGS = [
  { id: 1, base: "bg1-base", layers: ["bg1-layer-1", "bg1-layer-2", "bg1-layer-3", "bg1-layer-4", "bg1-layer-5", "bg1-layer-6"] },
  { id: 2, base: "bg2-base", layers: ["bg2-layer-1", "bg2-layer-2", "bg2-layer-3", "bg2-layer-4", "bg2-layer-5", "bg2-layer-6", "bg2-layer-7", "bg2-layer-8"] },
  { id: 3, base: "bg3-base", layers: ["bg3-layer-1", "bg3-layer-2", "bg3-layer-3", "bg3-layer-4", "bg3-layer-5", "bg3-layer-6"] },
  { id: 4, base: "bg4-base", layers: ["bg4-layer-1", "bg4-layer-2", "bg4-layer-3", "bg4-layer-4", "bg4-layer-5", "bg4-layer-6"] },
];

export class BackgroundSystem {
  constructor(scene) {
    this.scene = scene;
    this.themes = [];
    this.activeThemeIndex = 0;
  }

  create() {
    this.root = this.scene.add.container(0, 0);
    this.root.setDepth(-20);

    this.themes = THEME_CONFIGS.map((config, themeIndex) => this.createTheme(config, themeIndex === 0));
  }

  createTheme(config, isActive) {
    const container = this.scene.add.container(0, 0);
    container.alpha = isActive ? 1 : 0;
    this.root.add(container);

    const base = this.scene.add.image(0, 0, config.base)
      .setOrigin(0)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    container.add(base);

    const layers = config.layers
      .filter((key) => this.scene.textures.exists(key))
      .map((key, index, all) => this.createLayerSprites(container, key, index, all.length));

    return {
      config,
      container,
      base,
      layers,
    };
  }

  createLayerSprites(container, key, index, layerCount) {
    const speed = 8 + index * 9;
    const left = this.scene.add.image(0, 0, key)
      .setOrigin(0)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    const right = this.scene.add.image(GAME_WIDTH, 0, key)
      .setOrigin(0)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    const alpha = 0.35 + (index / Math.max(1, layerCount - 1)) * 0.65;
    left.setAlpha(alpha);
    right.setAlpha(alpha);
    container.add([left, right]);

    return { sprites: [left, right], speed };
  }

  update(delta, score) {
    const driftScale = delta / 1000;
    const themeIndex = Math.floor(score / BACKGROUND_THEME_SCORE_STEP) % this.themes.length;
    if (themeIndex !== this.activeThemeIndex) {
      this.transitionTo(themeIndex);
    }

    this.themes.forEach((theme) => {
      theme.layers.forEach((layer) => {
        layer.sprites.forEach((sprite) => {
          sprite.x -= layer.speed * driftScale;
          if (sprite.x <= -GAME_WIDTH) {
            sprite.x += GAME_WIDTH * 2;
          }
        });
      });
    });
  }

  transitionTo(nextThemeIndex) {
    const previous = this.themes[this.activeThemeIndex];
    const next = this.themes[nextThemeIndex];
    if (!next || next === previous) {
      return;
    }

    this.activeThemeIndex = nextThemeIndex;
    this.scene.tweens.add({
      targets: previous.container,
      alpha: 0,
      duration: 900,
      ease: "Sine.easeInOut",
    });
    this.scene.tweens.add({
      targets: next.container,
      alpha: 1,
      duration: 900,
      ease: "Sine.easeInOut",
    });
  }
}
