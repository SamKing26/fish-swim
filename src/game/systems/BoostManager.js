import Phaser from "phaser";
import { BOOST_SPAWN_MAX, BOOST_SPAWN_MIN, GAME_HEIGHT, GAME_WIDTH } from "../constants.js";

const BOOST_TYPES = {
  acceleration: {
    texture: "boost-acceleration",
    spawnWeight: 0.5,
    body: { type: "rect", width: 52, height: 88, offsetX: 26, offsetY: 36 },
    glowColor: 0xffd76a,
    bobSpeed: 0.006,
    bobAmplitude: 10,
    pulseSpeed: 0.01,
    rotationSpeed: 0.02,
    scaleOffset: 0.12,
    scale: 0.5,
    speedMultiplier: 1.54,
    durationMs: 4000,
  },
  pearl: {
    texture: "boost-pearl-real",
    spawnWeight: 0.2,
    body: { type: "circle", radius: 40, offsetX: 30, offsetY: 18 },
    glowColor: 0xfbeab8,
    bobSpeed: 0.0048,
    bobAmplitude: 8,
    pulseSpeed: 0.008,
    rotationSpeed: 0.012,
    scaleOffset: 0.08,
    scale: 0.46,
    durationMs: 7000,
    scoreMultiplier: 2,
  },
  shield: {
    texture: "boost-shield",
    spawnWeight: 0.2,
    body: { type: "rect", width: 54, height: 76, offsetX: 22, offsetY: 24 },
    glowColor: 0x71f0ff,
    bobSpeed: 0.0054,
    bobAmplitude: 9,
    pulseSpeed: 0.011,
    rotationSpeed: -0.018,
    scaleOffset: 0.1,
    scale: 0.52,
    durationMs: 4000,
    immune: true,
  },
  crown: {
    texture: "boost-crown",
    spawnWeight: 0.2,
    body: { type: "rect", width: 78, height: 52, offsetX: 24, offsetY: 42 },
    glowColor: 0xfff08b,
    bobSpeed: 0.005,
    bobAmplitude: 8,
    pulseSpeed: 0.009,
    rotationSpeed: 0.01,
    scaleOffset: 0.09,
    scale: 0.5,
    speedMultiplier: 1.42,
    durationMs: 7000,
    immune: true,
  },
};

export class BoostManager {
  constructor(scene) {
    this.scene = scene;
    this.group = this.scene.physics.add.group({
      allowGravity: false,
      immovable: true,
      maxSize: 5,
      classType: Phaser.Physics.Arcade.Image,
    });
    this.effects = this.scene.add.group();
  }

  reset() {
    this.group.children.each((boost) => this.recycleBoost(boost));
    this.effects.clear(true, true);
  }

  update(scroll, delta, timeNow) {
    this.group.children.each((boost) => {
      if (!boost.active) {
        return;
      }

      const config = BOOST_TYPES[boost.boostType];
      boost.x -= scroll;
      boost.y = Phaser.Math.Clamp(
        boost.homeY + Math.sin((timeNow + boost.phase) * config.bobSpeed) * config.bobAmplitude,
        90,
        GAME_HEIGHT - 90,
      );
      boost.rotation += config.rotationSpeed;
      const scalePulse = 1 + Math.sin((timeNow + boost.phase) * config.pulseSpeed) * config.scaleOffset;
      boost.setScale(boost.baseScale * scalePulse);

      if (boost.x < -120) {
        this.recycleBoost(boost);
      }
    });

    this.effects.getChildren().forEach((effect) => {
      effect.x -= scroll * 0.8;
      effect.scale += effect.growSpeed ?? 0.014;
      effect.alpha -= effect.fadeSpeed ?? 0.014;
      if (effect.alpha <= 0) {
        effect.destroy();
      }
    });
  }

  scheduleNext(now, stage) {
    let min = (BOOST_SPAWN_MIN + 3200) * 2;
    let max = (BOOST_SPAWN_MAX + 4200) * 2;

    if (stage === "hard") {
      min = 18000;
      max = 27600;
    } else if (stage === "intense") {
      min = 19600;
      max = 29600;
    }

    return now + Phaser.Math.Between(min, max);
  }

  trySpawn(playerY, trapManager, stage) {
    if (this.group.countActive(true) > 0) {
      return false;
    }

    const spawnX = GAME_WIDTH + 120;
    const attemptCount = stage === "intense" ? 12 : stage === "hard" ? 10 : 7;
    const clearanceX = stage === "intense" ? 250 : stage === "hard" ? 230 : 210;
    const clearanceY = stage === "intense" ? 170 : stage === "hard" ? 155 : 145;
    const candidateBands = this.getSpawnBands(playerY, stage);
    let targetY = null;
    let targetX = spawnX;
    for (let attempt = 0; attempt < attemptCount; attempt += 1) {
      const band = Phaser.Utils.Array.GetRandom(candidateBands);
      const candidateY = Phaser.Math.Between(band.minY, band.maxY);
      const candidateX = spawnX + Phaser.Math.Between(-54, 48);
      if (!trapManager.overlapsArea(candidateX, candidateY, clearanceX, clearanceY)) {
        targetY = candidateY;
        targetX = candidateX;
        break;
      }
    }

    if (targetY === null) {
      return false;
    }

    const boostType = this.pickBoostType();
    const config = BOOST_TYPES[boostType];
    const boost = this.group.get(targetX, targetY, config.texture);
    if (!boost) {
      return false;
    }

    boost.enableBody(true, targetX, targetY, true, true);
    boost.setTexture(config.texture);
    boost.body.setAllowGravity(false);
    boost.body.setImmovable(true);
    this.applyBodyShape(boost, config.body);
    boost.setDepth(7);
    boost.phase = Phaser.Math.Between(0, 1000);
    boost.rotation = 0;
    boost.boostType = boostType;
    boost.homeY = targetY;
    boost.baseScale = config.scale;
    boost.setScale(boost.baseScale);
    return true;
  }

  collect(boost, player) {
    const boostType = boost.boostType;
    const config = BOOST_TYPES[boostType];
    this.recycleBoost(boost);
    const flash = this.scene.add.circle(player.x, player.y, 24, config.glowColor, 0.45);
    flash.setDepth(11);
    flash.scale = 1;
    flash.growSpeed = 0.02;
    flash.fadeSpeed = 0.018;
    this.effects.add(flash);
    return { until: this.scene.time.now + config.durationMs, type: boostType };
  }

  spawnTrail(player, boostType) {
    const config = BOOST_TYPES[boostType] ?? BOOST_TYPES.acceleration;
    const effect = this.scene.add.circle(player.x - 18, player.y, 18, config.glowColor, 0.18);
    effect.setDepth(4);
    effect.scale = 1;
    effect.alpha = 0.25;
    effect.growSpeed = 0.016;
    effect.fadeSpeed = 0.013;
    this.effects.add(effect);
  }

  recycleBoost(boost) {
    boost.disableBody(true, true);
    boost.phase = 0;
    boost.rotation = 0;
    boost.boostType = null;
    boost.homeY = 0;
    boost.baseScale = 1;
  }

  applyBodyShape(boost, body) {
    if (body.type === "circle") {
      boost.body.setCircle(body.radius, body.offsetX, body.offsetY);
      return;
    }

    boost.body.setSize(body.width, body.height);
    boost.body.setOffset(body.offsetX, body.offsetY);
  }

  getSpawnBands(playerY, stage) {
    const clampedPlayerY = Phaser.Math.Clamp(playerY, 118, GAME_HEIGHT - 118);
    const nearReach = stage === "intense" ? 105 : stage === "hard" ? 118 : 130;
    const mediumReach = stage === "intense" ? 150 : stage === "hard" ? 165 : 180;

    return [
      {
        minY: Phaser.Math.Clamp(clampedPlayerY - nearReach, 118, GAME_HEIGHT - 118),
        maxY: Phaser.Math.Clamp(clampedPlayerY + nearReach, 118, GAME_HEIGHT - 118),
      },
      {
        minY: Phaser.Math.Clamp(clampedPlayerY - mediumReach, 118, GAME_HEIGHT - 118),
        maxY: Phaser.Math.Clamp(clampedPlayerY - 36, 118, GAME_HEIGHT - 118),
      },
      {
        minY: Phaser.Math.Clamp(clampedPlayerY + 36, 118, GAME_HEIGHT - 118),
        maxY: Phaser.Math.Clamp(clampedPlayerY + mediumReach, 118, GAME_HEIGHT - 118),
      },
    ].filter((band) => band.maxY > band.minY);
  }

  pickBoostType() {
    const entries = Object.entries(BOOST_TYPES);
    const totalWeight = entries.reduce((sum, [, config]) => sum + (config.spawnWeight ?? 1), 0);
    let roll = Math.random() * totalWeight;

    for (const [boostType, config] of entries) {
      roll -= config.spawnWeight ?? 1;
      if (roll <= 0) {
        return boostType;
      }
    }

    return entries[0][0];
  }
}

export function getBoostConfig(boostType) {
  return BOOST_TYPES[boostType] ?? BOOST_TYPES.acceleration;
}
