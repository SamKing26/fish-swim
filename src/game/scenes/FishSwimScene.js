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
  width: 140,
  height: 88,
  offsetX: 240,
  offsetY: 260,
};

const PLAYER_MOVEMENT = {
  acceleration: 2360,
  maxSpeed: 425,
  deceleration: 3450,
  boostSpeedBonus: 50,
  tiltLerp: 0.3,
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
    this.physics.add.overlap(this.player, this.trapManager.group, () => {
      if (this.isPlaying) {
        this.triggerGameOver();
      }
    });

    this.physics.add.overlap(this.player, this.boostManager.group, (_, boost) => {
      if (!boost.active) {
        return;
      }
      const boostState = this.boostManager.collect(boost, this.player);
      this.boostUntil = boostState.until;
      this.activeBoostType = boostState.type;
      this.audioManager.playBoostPickup();
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
    this.activeBoostType = null;
    this.touchDirection = 0;
    this.player.setPosition(PLAYER_X, GAME_HEIGHT / 2);
    this.player.setVelocity(0, 0);
    this.player.setAcceleration(0, 0);
    this.player.setAngle(0);
    this.player.setAlpha(1);
    this.player.clearTint();
    this.player.setScale(PLAYER_SCALE);
    this.player.play("fish-swim-loop", true);
    this.tweens.killTweensOf(this.player);
    this.trapManager.reset();
    this.boostManager.reset();
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

    this.score += (delta / 16.6667) * SCORE_RATE * (this.currentSpeed / BASE_SCROLL_SPEED);
    this.handleMilestones();
    this.updateFishAnimationSpeed();
    this.updateHud();

    if (this.time.now >= this.nextTrapAt) {
      this.trapManager.spawnPattern(stage, this.player.y);
      this.nextTrapAt = this.trapManager.scheduleNext(this.time.now, stage);
    }

    if (this.time.now >= this.nextBoostAt) {
      this.boostManager.trySpawn(this.player.y, this.trapManager, stage);
      this.nextBoostAt = this.boostManager.scheduleNext(this.time.now, stage);
    }

    this.renderDebugBodies();
  }

  updateDifficulty(stage = this.getDifficultyStage()) {
    const speedFromScore = this.getSpeedForScore(stage, this.score);
    const boostMultiplier = this.boostUntil > this.time.now
      ? getBoostConfig(this.activeBoostType).speedMultiplier ?? BOOST_MULTIPLIER
      : 1;
    this.currentSpeed = speedFromScore * boostMultiplier;
  }

  getSpeedForScore(stage, score) {
    if (stage === "easy") {
      return BASE_SCROLL_SPEED + Math.min(70, score * 0.065);
    }
    if (stage === "normal") {
      return 305 + Math.min(82, (score - STAGE_SCORE_THRESHOLDS.normal) * 0.02);
    }
    if (stage === "hard") {
      return 382 + Math.min(96, (score - STAGE_SCORE_THRESHOLDS.hard) * 0.018);
    }
    if (score < 25000) {
      return 468 + Math.min(118, (score - STAGE_SCORE_THRESHOLDS.intense) * 0.0085);
    }
    return 586 + Math.min(134, (score - 25000) * 0.0055);
  }

  updatePlayer(delta) {
    const direction = this.getVerticalIntent();
    const dt = delta / 1000;
    const speedBonus = Math.min(118, this.currentSpeed * 0.098);
    const maxSpeed = PLAYER_MOVEMENT.maxSpeed + speedBonus + (this.boostUntil > this.time.now ? PLAYER_MOVEMENT.boostSpeedBonus : 0);
    const responsiveness = Phaser.Math.Clamp(0.2 + (this.currentSpeed / 1800), 0.2, 0.34);
    const acceleration = PLAYER_MOVEMENT.acceleration + speedBonus * 1.85;
    const deceleration = PLAYER_MOVEMENT.deceleration + speedBonus * 1.6;
    const velocityY = this.player.body.velocity.y;
    const targetVelocity = direction * maxSpeed;

    if (direction !== 0) {
      const acceleratedVelocity = Phaser.Math.Clamp(
        velocityY + direction * acceleration * dt,
        -maxSpeed,
        maxSpeed,
      );
      this.player.body.velocity.y = Phaser.Math.Linear(acceleratedVelocity, targetVelocity, responsiveness);
    } else if (velocityY !== 0) {
      const decelStep = deceleration * dt;
      if (Math.abs(velocityY) <= decelStep) {
        this.player.body.velocity.y = 0;
      } else {
        this.player.body.velocity.y -= Math.sign(velocityY) * decelStep;
      }
    }

    const nextY = Phaser.Math.Clamp(this.player.y + this.player.body.velocity.y * dt, PLAYER_MIN_Y, PLAYER_MAX_Y);
    this.player.setY(nextY);

    if ((nextY <= PLAYER_MIN_Y && this.player.body.velocity.y < 0) || (nextY >= PLAYER_MAX_Y && this.player.body.velocity.y > 0)) {
      this.player.body.velocity.y = 0;
    }

    const swimWave = Math.sin(this.time.now * 0.012);
    this.player.x = PLAYER_X + swimWave * 3;
    this.player.angle = Phaser.Math.Linear(
      this.player.angle,
      Phaser.Math.Clamp((this.player.body.velocity.y / maxSpeed) * PLAYER_MOVEMENT.maxTilt + swimWave * 1.2, -PLAYER_MOVEMENT.maxTilt, PLAYER_MOVEMENT.maxTilt),
      PLAYER_MOVEMENT.tiltLerp,
    );
    const velocityStretch = Phaser.Math.Clamp(Math.abs(this.player.body.velocity.y) / maxSpeed, 0, 1);
    this.player.setScale(
      PLAYER_SCALE + velocityStretch * 0.004,
      PLAYER_SCALE - velocityStretch * 0.005,
    );

    if (direction !== 0 && this.time.now - this.lastSwimSoundAt > 220) {
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

  updateBoostState() {
    const active = this.boostUntil > this.time.now;

    if (active) {
      this.player.setTint(0xb6ffff);
      if (!this.lastBoostPulseAt || this.time.now - this.lastBoostPulseAt > 420) {
        this.boostManager.spawnTrail(this.player, this.activeBoostType);
        this.audioManager.playBoostActive();
        this.lastBoostPulseAt = this.time.now;
      }
      return;
    }

    this.activeBoostType = null;
    this.player.clearTint();
  }

  updateFishAnimationSpeed() {
    const stage = this.getDifficultyStage();
    let targetFps = 8;
    if (stage === "normal") {
      targetFps = 10.5;
    } else if (stage === "hard") {
      targetFps = 12.5;
    } else if (stage === "intense") {
      targetFps = this.score >= 25000 ? 16 : 14.5;
    }

    if (this.boostUntil > this.time.now) {
      targetFps += 2;
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

  updateHud() {
    const score = Math.floor(this.score);
    const boostLeft = Math.max(0, this.boostUntil - this.time.now);
    this.hud.update({
      score,
      bestScore: Math.max(this.bestScore, score),
      speedLabel: `${(this.currentSpeed / BASE_SCROLL_SPEED).toFixed(2)}x`,
      boostLabel: boostLeft > 0 ? `${(boostLeft / 1000).toFixed(1)}s` : "Ready",
    });
  }

  triggerGameOver() {
    this.isPlaying = false;
    this.isGameOver = true;
    this.player.setTint(0xff9aa2);
    this.audioManager.playCollision();

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
