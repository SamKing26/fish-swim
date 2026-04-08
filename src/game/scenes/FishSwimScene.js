import Phaser from "phaser";
import {
  BASE_SCROLL_SPEED,
  BEST_SCORE_KEY,
  BOOST_MULTIPLIER,
  BOOST_SPAWN_MAX,
  BOOST_SPAWN_MIN,
  GAME_HEIGHT,
  GAME_WIDTH,
  PLAYER_MAX_Y,
  PLAYER_MIN_Y,
  PLAYER_X,
  SCORE_RATE,
  STAGE_SCORE_THRESHOLDS,
} from "../constants.js";
import { HudController } from "../ui/HudController.js";
import { AudioManager } from "../systems/AudioManager.js";
import { BACKGROUND_MANIFEST, BOOST_ASSETS, FISH_ASSET, TRAP_ASSETS } from "../assetManifest.js";
import { BackgroundSystem } from "../systems/BackgroundSystem.js";
import { BoostManager } from "../systems/BoostManager.js";
import { getBoostConfig } from "../systems/BoostManager.js";
import { TrapManager } from "../systems/TrapManager.js";
import { createTextures } from "../systems/TextureFactory.js";

const PLAYER_SCALE = 0.25;
const PLAYER_HITBOX = {
  width: 154,
  height: 88,
  offsetX: 240,
  offsetY: 260,
};

const PLAYER_MOVEMENT = {
  acceleration: 2280,
  turnAcceleration: 3260,
  maxSpeed: 428,
  deceleration: 3300,
  boostSpeedBonus: 50,
  intentRise: 13.5,
  intentFall: 9.5,
  idleDrift: 18,
  tiltLerp: 0.27,
  maxTilt: 14,
};

export class FishSwimScene extends Phaser.Scene {
  constructor() {
    super("fish-swim");
    this.audioManager = new AudioManager();
    this.hud = new HudController();
    this.bestScore = Number(window.localStorage.getItem(BEST_SCORE_KEY) || 0);
    this.touchDirection = 0;
    this.lastSwimSoundAt = 0;
    this.lastMilestone = 0;
    this.lastBoostPulseAt = 0;
    this.lastWakeAt = 0;
    this.lastSwimBubbleAt = 0;
    this.playerIntentBlend = 0;
  }

  preload() {
    createTextures(this);
    this.load.spritesheet(FISH_ASSET.key, FISH_ASSET.path, {
      frameWidth: FISH_ASSET.frameWidth,
      frameHeight: FISH_ASSET.frameHeight,
    });

    Object.entries(BACKGROUND_MANIFEST).forEach(([themeId, config]) => {
      this.load.image(`bg${themeId}-base`, config.base);
      config.layers.forEach((layerPath, layerIndex) => {
        this.load.image(
          `bg${themeId}-layer-${layerIndex + 1}`,
          layerPath,
        );
      });
    });

    Object.entries(TRAP_ASSETS).forEach(([key, asset]) => {
      this.load.image(key, asset.path);
    });

    Object.entries(BOOST_ASSETS).forEach(([key, asset]) => {
      this.load.image(key, asset.path);
    });
  }

  create() {
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.setBackgroundColor("#05243a");
    this.createAnimations();
    this.debugBodiesEnabled = this.registry.get("debugBodies") === true;

    this.background = new BackgroundSystem(this);
    this.background.create();
    this.trapManager = new TrapManager(this);
    this.boostManager = new BoostManager(this);
    this.createPlayer();
    this.createInput();
    this.createDebugOverlay();
    this.bindUi();
    this.createCollisions();
    this.resetRunState();
    this.hud.update({ score: 0, bestScore: this.bestScore, speedLabel: "1.0x", boostLabel: "Ready" });
    this.hud.showStart();
  }

  createAnimations() {
    if (!this.anims.exists("fish-swim-loop")) {
      this.anims.create({
        key: "fish-swim-loop",
        frames: this.anims.generateFrameNumbers("fish-swim", { start: 0, end: 11 }),
        frameRate: 14,
        repeat: -1,
      });
    }
  }

  createPlayer() {
    this.player = this.physics.add.sprite(PLAYER_X, GAME_HEIGHT / 2, "fish-swim", 0);
    this.player.body.setAllowGravity(false);
    this.player.setScale(PLAYER_SCALE);
    this.player.body.setSize(PLAYER_HITBOX.width, PLAYER_HITBOX.height);
    this.player.body.setOffset(PLAYER_HITBOX.offsetX, PLAYER_HITBOX.offsetY);
    this.player.setCollideWorldBounds(false);
    this.player.setDepth(10);
    this.player.play("fish-swim-loop");

    this.playerAura = this.add.circle(this.player.x, this.player.y, 38, 0xffffff, 0);
    this.playerAura.setDepth(9);
    this.playerAura.setBlendMode(Phaser.BlendModes.ADD);
  }

  createInput() {
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      restart: Phaser.Input.Keyboard.KeyCodes.SPACE,
      debug: Phaser.Input.Keyboard.KeyCodes.D,
    });

    this.input.on("pointerdown", (pointer) => {
      this.audioManager.resume();
      this.touchDirection = pointer.y < this.scale.height * 0.5 ? -1 : 1;
      if (this.isGameOver) {
        this.restartRun();
      }
    });

    this.input.on("pointermove", (pointer) => {
      if (!pointer.isDown) {
        return;
      }
      this.touchDirection = pointer.y < this.scale.height * 0.5 ? -1 : 1;
    });

    this.input.on("pointerup", () => {
      this.touchDirection = 0;
    });
  }

  createDebugOverlay() {
    this.debugGraphics = this.add.graphics();
    this.debugGraphics.setDepth(200);
    this.debugGraphics.setVisible(this.debugBodiesEnabled);
  }

  bindUi() {
    this.hud.bindStart(async () => {
      this.audioManager.resume();
      await this.hud.enterImmersiveMode();
      this.audioManager.playButton();
      this.startRun();
    });

    this.hud.bindRestart(async () => {
      this.audioManager.resume();
      await this.hud.enterImmersiveMode();
      this.audioManager.playButton();
      this.restartRun();
    });
  }

  createCollisions() {
    this.physics.add.overlap(this.player, this.trapManager.group, (_, trap) => {
      if (!this.isPlaying || !trap.active) {
        return;
      }

      if (this.hasActiveImmunity()) {
        this.trapManager.recycleTrap(trap);
        this.spawnImmuneImpact(trap.x, trap.y);
        return;
      }

      this.triggerGameOver();
    });

    this.physics.add.overlap(this.player, this.boostManager.group, (_, boost) => {
      if (!boost.active) {
        return;
      }
      const boostState = this.boostManager.collect(boost, this.player);
      this.boostUntil = boostState.until;
      this.activeBoostType = boostState.type;
      this.audioManager.playBoostPickup();
      this.audioManager.startBoostTimer(boostState.type);
    });
  }

  resetRunState() {
    this.score = 0;
    this.currentSpeed = BASE_SCROLL_SPEED;
    this.isPlaying = false;
    this.isGameOver = false;
    this.boostUntil = 0;
    this.nextTrapAt = 0;
    this.nextBoostAt = 0;
    this.lastMilestone = 0;
    this.lastBoostPulseAt = 0;
    this.lastWakeAt = 0;
    this.lastSwimBubbleAt = 0;
    this.activeBoostType = null;
    this.touchDirection = 0;
    this.playerIntentBlend = 0;
    this.player.setPosition(PLAYER_X, GAME_HEIGHT / 2);
    this.player.setVelocity(0, 0);
    this.player.setAcceleration(0, 0);
    this.player.setAngle(0);
    this.player.setAlpha(1);
    this.player.clearTint();
    this.player.setScale(PLAYER_SCALE);
    this.player.play("fish-swim-loop", true);
    this.playerAura.setPosition(this.player.x, this.player.y);
    this.playerAura.setAlpha(0);
    this.playerAura.setScale(1);
    this.playerAura.setFillStyle(0xffffff, 0);
    this.tweens.killTweensOf(this.player);
    this.tweens.killTweensOf(this.playerAura);
    this.trapManager.reset();
    this.boostManager.reset();
    this.audioManager.stopBoostTimer();
    this.audioManager.startMusicLoop();
  }

  startRun() {
    if (this.isPlaying) {
      return;
    }

    this.hud.hideStart();
    this.hud.hideGameOver();
    this.resetRunState();
    this.isPlaying = true;
    this.nextTrapAt = this.time.now + 900;
    this.nextBoostAt = this.time.now + Phaser.Math.Between(BOOST_SPAWN_MIN, BOOST_SPAWN_MAX);
  }

  restartRun() {
    this.hud.hideStart();
    this.hud.hideGameOver();
    this.resetRunState();
    this.isPlaying = true;
    this.nextTrapAt = this.time.now + 650;
    this.nextBoostAt = this.time.now + Phaser.Math.Between(BOOST_SPAWN_MIN - 1500, BOOST_SPAWN_MAX - 1000);
  }

  update(_, delta) {
    this.background.update(delta, this.score);
    this.updateDebugToggle();
    const stage = this.getDifficultyStage();

    if (!this.isPlaying) {
      this.renderDebugBodies();
      if (this.isGameOver && Phaser.Input.Keyboard.JustDown(this.keys.restart)) {
        this.restartRun();
      }
      return;
    }

    this.updateDifficulty(stage);
    this.updatePlayer(delta);
    this.trapManager.update(this.currentSpeed * (delta / 1000), delta);
    this.boostManager.update(this.currentSpeed * (delta / 1000), delta, this.time.now);
    this.updateBoostState();

    this.score += (delta / 16.6667)
      * SCORE_RATE
      * this.getScoreRateMultiplier(this.score)
      * this.getScoreBoostMultiplier()
      * (this.currentSpeed / BASE_SCROLL_SPEED);
    this.handleMilestones();
    this.updateFishAnimationSpeed();
    this.updateHud();

    if (this.time.now >= this.nextTrapAt) {
      this.trapManager.spawnPattern(stage, this.player.y, this.player.body.velocity.y, this.score);
      this.nextTrapAt = this.trapManager.scheduleNext(this.time.now, stage, this.score);
    }

    if (this.time.now >= this.nextBoostAt) {
      this.boostManager.trySpawn(this.player.y, this.trapManager, stage);
      this.nextBoostAt = this.boostManager.scheduleNext(this.time.now, stage);
    }

    this.renderDebugBodies();
  }

  updateDifficulty(stage = this.getDifficultyStage()) {
    const speedFromScore = this.getSpeedForScore(stage, this.score);
    const boostMultiplier = this.hasActiveBoost()
      ? getBoostConfig(this.activeBoostType).speedMultiplier ?? BOOST_MULTIPLIER
      : 1;
    this.currentSpeed = speedFromScore * boostMultiplier;
  }

  getSpeedForScore(stage, score) {
    if (stage === "easy") {
      return BASE_SCROLL_SPEED + Math.min(140.8, score * 0.1152);
    }
    if (stage === "normal") {
      return 367.8 + Math.min(172.8, (score - STAGE_SCORE_THRESHOLDS.normal) * 0.0384);
    }
    if (stage === "hard") {
      return 508.8 + Math.min(211.2, (score - STAGE_SCORE_THRESHOLDS.hard) * 0.0336);
    }
    if (score < 25000) {
      return 715.6 + Math.min(275.2, (score - STAGE_SCORE_THRESHOLDS.intense) * 0.0176);
    }
    return 912 + Math.min(352, (score - 25000) * 0.012);
  }

  getScoreRateMultiplier(score) {
    if (score < STAGE_SCORE_THRESHOLDS.normal) {
      return 1.5;
    }
    if (score < STAGE_SCORE_THRESHOLDS.hard) {
      return 1.83 + Math.min(0.36, (score - STAGE_SCORE_THRESHOLDS.normal) / 3333.33);
    }
    if (score < STAGE_SCORE_THRESHOLDS.intense) {
      return 2.25 + Math.min(0.525, (score - STAGE_SCORE_THRESHOLDS.hard) / 4666.67);
    }
    if (score < 25000) {
      return 2.775 + Math.min(0.825, (score - STAGE_SCORE_THRESHOLDS.intense) / 6666.67);
    }
    return 3.675 + Math.min(1.05, (score - 25000) / 10000);
  }

  updatePlayer(delta) {
    const inputDirection = this.getVerticalIntent();
    const dt = delta / 1000;
    const speedBonus = Math.min(138, this.currentSpeed * 0.102);
    const maxSpeed = PLAYER_MOVEMENT.maxSpeed + speedBonus + (this.hasSpeedBoost() ? PLAYER_MOVEMENT.boostSpeedBonus : 0);
    const acceleration = PLAYER_MOVEMENT.acceleration + speedBonus * 1.45;
    const turnAcceleration = PLAYER_MOVEMENT.turnAcceleration + speedBonus * 1.8;
    const deceleration = PLAYER_MOVEMENT.deceleration + speedBonus * 1.4;
    const velocityY = this.player.body.velocity.y;
    const blendRate = inputDirection === 0
      ? PLAYER_MOVEMENT.intentFall
      : PLAYER_MOVEMENT.intentRise;
    this.playerIntentBlend = Phaser.Math.Linear(
      this.playerIntentBlend,
      inputDirection,
      Phaser.Math.Clamp(blendRate * dt, 0, 1),
    );

    const targetVelocity = this.playerIntentBlend * maxSpeed;
    const reversing = velocityY !== 0 && Math.sign(targetVelocity) !== 0 && Math.sign(velocityY) !== Math.sign(targetVelocity);
    const appliedAcceleration = reversing ? turnAcceleration : acceleration;

    if (Math.abs(targetVelocity) > 1) {
      const velocityStep = appliedAcceleration * dt;
      const deltaToTarget = Phaser.Math.Clamp(targetVelocity - velocityY, -velocityStep, velocityStep);
      this.player.body.velocity.y = Phaser.Math.Clamp(velocityY + deltaToTarget, -maxSpeed, maxSpeed);
    } else if (velocityY !== 0) {
      const decelStep = deceleration * dt;
      if (Math.abs(velocityY) <= decelStep) {
        this.player.body.velocity.y = 0;
      } else {
        this.player.body.velocity.y -= Math.sign(velocityY) * decelStep;
      }
    }

    if (Math.abs(targetVelocity) <= 1 && Math.abs(this.player.body.velocity.y) < 120) {
      this.player.body.velocity.y += Math.sin(this.time.now * 0.0024) * PLAYER_MOVEMENT.idleDrift * dt;
    }

    const nextY = Phaser.Math.Clamp(this.player.y + this.player.body.velocity.y * dt, PLAYER_MIN_Y, PLAYER_MAX_Y);
    this.player.setY(nextY);

    if ((nextY <= PLAYER_MIN_Y && this.player.body.velocity.y < 0) || (nextY >= PLAYER_MAX_Y && this.player.body.velocity.y > 0)) {
      this.player.body.velocity.y = 0;
    }

    const swimWave = Math.sin(this.time.now * 0.012);
    const speedRatio = Phaser.Math.Clamp(this.currentSpeed / BASE_SCROLL_SPEED, 1, 4.6);
    this.player.x = PLAYER_X + swimWave * 3;
    this.player.angle = Phaser.Math.Linear(
      this.player.angle,
      Phaser.Math.Clamp(
        (this.player.body.velocity.y / maxSpeed) * PLAYER_MOVEMENT.maxTilt
        + swimWave * (1.2 + speedRatio * 0.55),
        -PLAYER_MOVEMENT.maxTilt,
        PLAYER_MOVEMENT.maxTilt,
      ),
      PLAYER_MOVEMENT.tiltLerp,
    );
    const velocityStretch = Phaser.Math.Clamp(Math.abs(this.player.body.velocity.y) / maxSpeed, 0, 1);
    this.player.setScale(
      PLAYER_SCALE + velocityStretch * (0.004 + speedRatio * 0.0008),
      PLAYER_SCALE - velocityStretch * (0.005 + speedRatio * 0.001),
    );

    this.playerAura.setPosition(this.player.x, this.player.y);
    this.spawnWakeBubble(speedRatio);
    this.spawnSwimBubble(speedRatio, velocityStretch);

    if (Math.abs(this.playerIntentBlend) > 0.35 && this.time.now - this.lastSwimSoundAt > 220) {
      this.audioManager.playSwim();
      this.lastSwimSoundAt = this.time.now;
    }
  }

  getVerticalIntent() {
    const upward = this.keys.up.isDown || this.keys.w.isDown;
    const downward = this.keys.down.isDown || this.keys.s.isDown;

    if (upward && !downward) {
      return -1;
    }
    if (downward && !upward) {
      return 1;
    }
    return this.touchDirection;
  }

  hasActiveBoost() {
    return this.boostUntil > this.time.now && Boolean(this.activeBoostType);
  }

  hasSpeedBoost() {
    if (!this.hasActiveBoost()) {
      return false;
    }
    return Boolean(getBoostConfig(this.activeBoostType).speedMultiplier);
  }

  hasActiveImmunity() {
    if (!this.hasActiveBoost()) {
      return false;
    }
    return Boolean(getBoostConfig(this.activeBoostType).immune);
  }

  getScoreBoostMultiplier() {
    if (!this.hasActiveBoost()) {
      return 1;
    }
    return getBoostConfig(this.activeBoostType).scoreMultiplier ?? 1;
  }

  updateBoostState() {
    const active = this.hasActiveBoost();

    if (active) {
      const boostConfig = getBoostConfig(this.activeBoostType);
      this.player.setTint(boostConfig.immune ? 0xfff2a8 : 0xb6ffff);
      this.updatePlayerAura(boostConfig);
      if (!this.lastBoostPulseAt || this.time.now - this.lastBoostPulseAt > 420) {
        this.boostManager.spawnTrail(this.player, this.activeBoostType);
        this.audioManager.playBoostActive();
        this.lastBoostPulseAt = this.time.now;
      }
      return;
    }

    this.activeBoostType = null;
    this.player.clearTint();
    this.playerAura.setAlpha(0);
    this.audioManager.stopBoostTimer();
  }

  updateFishAnimationSpeed() {
    const stage = this.getDifficultyStage();
    let targetFps = 8;
    if (stage === "normal") {
      targetFps = 11;
    } else if (stage === "hard") {
      targetFps = 13.5;
    } else if (stage === "intense") {
      targetFps = this.score >= 25000 ? 19 : 16.5;
    }

    const speedRatio = Phaser.Math.Clamp(this.currentSpeed / BASE_SCROLL_SPEED, 1, 4.6);
    targetFps += (speedRatio - 1) * 2.8;

    if (this.hasActiveBoost()) {
      targetFps += 2.5;
    }

    this.player.anims.timeScale = targetFps / 14;
  }

  handleMilestones() {
    const milestone = Math.floor(this.score / 1000);
    if (milestone > this.lastMilestone) {
      this.lastMilestone = milestone;
      this.audioManager.playMilestone();
    }
  }

  spawnImmuneImpact(x, y) {
    const ring = this.add.circle(x, y, 24, 0xfff2a8, 0.32);
    ring.setDepth(12);
    this.tweens.add({
      targets: ring,
      alpha: 0,
      scale: 1.9,
      duration: 220,
      ease: "Sine.easeOut",
      onComplete: () => ring.destroy(),
    });
  }

  updatePlayerAura(boostConfig) {
    const pulse = 1 + Math.sin(this.time.now * 0.014) * 0.12;
    this.playerAura.setFillStyle(boostConfig.glowColor ?? 0xffffff, boostConfig.immune ? 0.18 : 0.14);
    this.playerAura.setScale(pulse);
    this.playerAura.setAlpha(boostConfig.immune ? 0.9 : 0.75);
  }

  spawnWakeBubble(speedRatio) {
    const interval = Phaser.Math.Linear(165, 52, Phaser.Math.Clamp((speedRatio - 1) / 3.6, 0, 1));
    if (this.time.now - this.lastWakeAt < interval) {
      return;
    }

    this.lastWakeAt = this.time.now;
    const bubble = this.add.image(
      this.player.x - Phaser.Math.Between(18, 34),
      this.player.y + Phaser.Math.Between(-14, 14),
      "bubble-particle",
    );
    bubble.setDepth(5);
    bubble.setAlpha(0.24);
    bubble.setScale(Phaser.Math.FloatBetween(0.45, 0.82));

    this.tweens.add({
      targets: bubble,
      x: bubble.x - Phaser.Math.Between(24, 42),
      y: bubble.y + Phaser.Math.Between(-18, 18),
      alpha: 0,
      scale: bubble.scaleX + 0.4 + speedRatio * 0.06,
      duration: Phaser.Math.Linear(360, 180, Phaser.Math.Clamp((speedRatio - 1) / 3.6, 0, 1)),
      ease: "Sine.easeOut",
      onComplete: () => bubble.destroy(),
    });
  }

  spawnSwimBubble(speedRatio, velocityStretch) {
    const interval = Phaser.Math.Linear(150, 58, Phaser.Math.Clamp((speedRatio - 1) / 3.6, 0, 1));
    if (this.time.now - this.lastSwimBubbleAt < interval) {
      return;
    }

    this.lastSwimBubbleAt = this.time.now;
    const bubble = this.add.image(
      this.player.x - Phaser.Math.Between(2, 10),
      this.player.y + Phaser.Math.Between(-8, 10),
      "bubble-particle",
    );
    bubble.setDepth(6);
    bubble.setAlpha(0.16 + velocityStretch * 0.08);
    bubble.setScale(Phaser.Math.FloatBetween(0.18, 0.38));

    this.tweens.add({
      targets: bubble,
      x: bubble.x - Phaser.Math.Between(8, 18),
      y: bubble.y - Phaser.Math.Between(16, 34),
      alpha: 0,
      scale: bubble.scaleX + 0.24 + speedRatio * 0.04,
      duration: Phaser.Math.Linear(540, 260, Phaser.Math.Clamp((speedRatio - 1) / 3.6, 0, 1)),
      ease: "Sine.easeOut",
      onComplete: () => bubble.destroy(),
    });
  }

  getBoostStatusLabel() {
    const boostLeft = Math.max(0, this.boostUntil - this.time.now);
    if (boostLeft <= 0 || !this.activeBoostType) {
      return "Ready";
    }

    const labelMap = {
      acceleration: "Speed",
      crown: "Crown",
      shield: "Shield",
      pearl: "Double",
    };

    return `${labelMap[this.activeBoostType] ?? "Boost"} ${(boostLeft / 1000).toFixed(1)}s`;
  }

  updateHud() {
    const score = Math.floor(this.score);
    this.hud.update({
      score,
      bestScore: Math.max(this.bestScore, score),
      speedLabel: `${(this.currentSpeed / BASE_SCROLL_SPEED).toFixed(2)}x`,
      boostLabel: this.getBoostStatusLabel(),
    });
  }

  triggerGameOver() {
    this.isPlaying = false;
    this.isGameOver = true;
    this.player.setTint(0xff9aa2);
    this.audioManager.stopBoostTimer();
    this.audioManager.stopMusicLoop();
    this.audioManager.playCollision();
    this.audioManager.playGameOver();

    const score = Math.floor(this.score);
    this.bestScore = Math.max(this.bestScore, score);
    window.localStorage.setItem(BEST_SCORE_KEY, String(this.bestScore));
    this.hud.update({
      score,
      bestScore: this.bestScore,
      speedLabel: `${(this.currentSpeed / BASE_SCROLL_SPEED).toFixed(2)}x`,
      boostLabel: "Ended",
    });
    this.hud.showGameOver(score, this.bestScore);

    this.tweens.add({
      targets: this.player,
      angle: 85,
      alpha: 0.45,
      duration: 650,
      ease: "Sine.easeIn",
    });
  }

  getDifficultyStage() {
    if (this.score < STAGE_SCORE_THRESHOLDS.normal) {
      return "easy";
    }
    if (this.score < STAGE_SCORE_THRESHOLDS.hard) {
      return "normal";
    }
    if (this.score < STAGE_SCORE_THRESHOLDS.intense) {
      return "hard";
    }
    return "intense";
  }

  updateDebugToggle() {
    if (!Phaser.Input.Keyboard.JustDown(this.keys.debug)) {
      return;
    }

    this.debugBodiesEnabled = !this.debugBodiesEnabled;
    this.debugGraphics.setVisible(this.debugBodiesEnabled);
    if (!this.debugBodiesEnabled) {
      this.debugGraphics.clear();
    }
  }

  renderDebugBodies() {
    if (!this.debugBodiesEnabled) {
      return;
    }

    this.debugGraphics.clear();
    this.drawBody(this.player.body, 0x4ef2ff);
    this.trapManager.group.children.each((trap) => {
      if (trap.active) {
        this.drawBody(trap.body, 0xff6b6b);
      }
    });
    this.boostManager.group.children.each((boost) => {
      if (boost.active) {
        this.drawBody(boost.body, 0x79ff96);
      }
    });
  }

  drawBody(body, color) {
    if (!body) {
      return;
    }

    this.debugGraphics.lineStyle(2, color, 0.95);
    if (body.isCircle) {
      this.debugGraphics.strokeCircle(body.x + body.halfWidth, body.y + body.halfHeight, body.halfWidth);
      return;
    }

    this.debugGraphics.strokeRect(body.x, body.y, body.width, body.height);
  }
}
