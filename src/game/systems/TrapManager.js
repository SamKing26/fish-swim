import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, TRAP_SPAWN_MAX, TRAP_SPAWN_MIN } from "../constants.js";

const SIZE_VARIANTS = {
  compact: { scale: 0.88, bodyScale: 0.9 },
  standard: { scale: 1, bodyScale: 1 },
  large: { scale: 1.16, bodyScale: 1.04 },
};

const BOTTOM_TRAPS = [
  {
    key: "trap-stone-bot",
    body: { type: "rect", width: 188, height: 308, offsetX: 12, offsetY: 54 },
    motion: 0,
    scale: 0.48,
    anchor: "bottom",
    visualInset: 4,
  },
  {
    key: "trap-stone-1bot",
    body: { type: "rect", width: 168, height: 404, offsetX: 42, offsetY: 70 },
    motion: 0,
    scale: 0.4,
    anchor: "bottom",
    visualInset: 4,
  },
  {
    key: "trap-steering-wheel-bot",
    body: { type: "rect", width: 214, height: 186, offsetX: 38, offsetY: 78 },
    motion: 0,
    scale: 0.34,
    anchor: "bottom",
    visualInset: 4,
  },
];

const TOP_TRAPS = [
  {
    key: "trap-chain-top",
    body: { type: "rect", width: 14, height: 292, offsetX: 10, offsetY: 10 },
    motion: 0,
    scale: 0.74,
    anchor: "top",
    visualInset: 0,
  },
  {
    key: "trap-stone-top",
    body: { type: "rect", width: 60, height: 286, offsetX: 44, offsetY: 12 },
    motion: 0,
    scale: 0.46,
    anchor: "top",
    visualInset: 0,
  },
];

const FLOATING_TRAPS = [
  {
    key: "trap-barrel-2",
    body: { type: "rect", width: 154, height: 84, offsetX: 54, offsetY: 64 },
    motion: 8,
    scale: 0.36,
    anchor: "center",
  },
  {
    key: "trap-bomb",
    body: { type: "circle", radius: 72, offsetX: 48, offsetY: 42 },
    motion: 14,
    scale: 0.38,
    anchor: "center",
  },
  {
    key: "trap-mini-bomb",
    body: { type: "circle", radius: 42, offsetX: 26, offsetY: 34 },
    motion: 18,
    scale: 0.46,
    anchor: "center",
  },
  {
    key: "trap-anchor",
    body: { type: "rect", width: 86, height: 146, offsetX: 66, offsetY: 64 },
    motion: 16,
    scale: 0.38,
    anchor: "center",
  },
];

const STAGE_RULES = {
  easy: { min: TRAP_SPAWN_MIN + 180, max: TRAP_SPAWN_MAX + 180, floatingChance: 72, topOnlyChance: 10, bottomOnlyChance: 18, bothChance: 0, extraChance: 0, gapSize: 175 },
  normal: { min: 900, max: 1320, floatingChance: 34, topOnlyChance: 18, bottomOnlyChance: 24, bothChance: 24, extraChance: 0, gapSize: 160 },
  hard: { min: 760, max: 1080, floatingChance: 20, topOnlyChance: 18, bottomOnlyChance: 18, bothChance: 44, extraChance: 38, gapSize: 145 },
  intense: { min: 620, max: 900, floatingChance: 14, topOnlyChance: 16, bottomOnlyChance: 16, bothChance: 54, extraChance: 54, gapSize: 126 },
};

const LANES = {
  top: 150,
  middle: 270,
  bottom: 390,
};

export class TrapManager {
  constructor(scene) {
    this.scene = scene;
    this.group = this.scene.physics.add.group({
      allowGravity: false,
      immovable: true,
      maxSize: 40,
      classType: Phaser.Physics.Arcade.Image,
    });
  }

  reset() {
    this.group.children.each((trap) => this.recycleTrap(trap));
  }

  update(scroll, delta) {
    this.group.children.each((trap) => {
      if (!trap.active) {
        return;
      }

      trap.x -= scroll;
      if (trap.patternMotion) {
        trap.y += trap.patternMotion * (delta / 1000);
        if (trap.y < 90 || trap.y > GAME_HEIGHT - 90) {
          trap.patternMotion *= -1;
          trap.y = Phaser.Math.Clamp(trap.y, 90, GAME_HEIGHT - 90);
        }
      }

      if (trap.x < -260) {
        this.recycleTrap(trap);
      }
    });
  }

  scheduleNext(now, stage) {
    const rule = STAGE_RULES[stage] ?? STAGE_RULES.easy;
    return now + Phaser.Math.Between(rule.min, rule.max);
  }

  spawnPattern(stage, playerY) {
    const spawnX = GAME_WIDTH + 120;
    const rule = STAGE_RULES[stage] ?? STAGE_RULES.easy;
    const lane = this.getLane(playerY);

    const roll = Phaser.Math.Between(0, 99);
    if (roll < rule.floatingChance) {
      this.spawnLanePressure(spawnX, lane, stage);
      return;
    }

    if (roll < rule.floatingChance + rule.topOnlyChance) {
      this.spawnTopLanePressure(spawnX, lane, stage);
      return;
    }

    if (roll < rule.floatingChance + rule.topOnlyChance + rule.bottomOnlyChance) {
      this.spawnBottomLanePressure(spawnX, lane, stage);
      return;
    }

    if (roll < rule.floatingChance + rule.topOnlyChance + rule.bottomOnlyChance + rule.bothChance) {
      const gapCenter = this.getGapCenterForLane(lane, stage);
      this.spawnVerticalWall(spawnX, gapCenter, rule.gapSize);
      if (Phaser.Math.Between(0, 100) < rule.extraChance) {
        this.spawnLanePressure(spawnX + 210, lane, stage, gapCenter);
      }
      return;
    }

    this.spawnLanePressure(spawnX, lane, stage);
  }

  overlapsArea(x, y, paddingX = 180, paddingY = 140) {
    return this.group.getChildren().some(
      (trap) => trap.active && Math.abs(trap.x - x) < paddingX && Math.abs(trap.y - y) < paddingY,
    );
  }

  recycleTrap(trap) {
    trap.disableBody(true, true);
    trap.patternMotion = 0;
    trap.setAngle(0);
    trap.setScale(1);
    trap.setOrigin(0.5, 0.5);
  }

  spawnVerticalWall(x, gapCenter, gapSize) {
    this.spawnTopTrap(x, Phaser.Math.Clamp(gapCenter - gapSize, 80, GAME_HEIGHT - 240), "compact");
    this.spawnBottomTrap(x + 50, Phaser.Math.Clamp(gapCenter + gapSize, 220, GAME_HEIGHT - 70), "compact");
  }

  spawnBottomTrap(x, y, sizeVariant = "standard") {
    const definition = Phaser.Utils.Array.GetRandom(BOTTOM_TRAPS);
    this.spawnTrapByDefinition(definition, x, y, sizeVariant);
  }

  spawnTopTrap(x, y, sizeVariant = "standard") {
    const definition = Phaser.Utils.Array.GetRandom(TOP_TRAPS);
    this.spawnTrapByDefinition(definition, x, y, sizeVariant);
  }

  spawnFloatingTrap(x, y) {
    const definition = Phaser.Utils.Array.GetRandom(FLOATING_TRAPS);
    this.spawnTrapByDefinition(definition, x, y);
  }

  spawnLanePressure(x, lane, stage, gapCenter = null) {
    if (lane === "top") {
      if (stage === "easy" || stage === "normal") {
        this.spawnFloatingTrap(x, LANES.top);
      } else {
        this.spawnTopTrap(x, 0, this.getSingleSideSizeVariant(stage));
      }
      return;
    }

    if (lane === "bottom") {
      if (stage === "easy" || stage === "normal") {
        this.spawnFloatingTrap(x, LANES.bottom);
      } else {
        this.spawnBottomTrap(x, GAME_HEIGHT, this.getSingleSideSizeVariant(stage));
      }
      return;
    }

    const y = gapCenter
      ? (gapCenter < LANES.middle ? LANES.bottom : LANES.top)
      : Phaser.Math.Between(0, 1) === 0 ? LANES.top : LANES.bottom;
    this.spawnFloatingTrap(x, y);
  }

  spawnTopLanePressure(x, lane, stage) {
    if (lane === "top" && stage !== "easy") {
      this.spawnTopTrap(x, 0, this.getSingleSideSizeVariant(stage));
      return;
    }

    if (lane === "middle") {
      this.spawnTopTrap(x, 0, this.getSingleSideSizeVariant(stage));
      return;
    }

    this.spawnFloatingTrap(x, Phaser.Math.Between(LANES.top - 20, LANES.middle - 30));
  }

  spawnBottomLanePressure(x, lane, stage) {
    if (lane === "bottom" && stage !== "easy") {
      this.spawnBottomTrap(x, GAME_HEIGHT, this.getSingleSideSizeVariant(stage));
      return;
    }

    if (lane === "middle") {
      this.spawnBottomTrap(x, GAME_HEIGHT, this.getSingleSideSizeVariant(stage));
      return;
    }

    this.spawnFloatingTrap(x, Phaser.Math.Between(LANES.middle + 30, LANES.bottom + 10));
  }

  getGapCenterForLane(lane, stage) {
    if (lane === "top") {
      return stage === "intense" ? 315 : 330;
    }
    if (lane === "bottom") {
      return stage === "intense" ? 225 : 210;
    }
    return Phaser.Math.Between(210, 330);
  }

  getLane(y) {
    if (y < 190) {
      return "top";
    }
    if (y > 350) {
      return "bottom";
    }
    return "middle";
  }

  getSingleSideSizeVariant(stage) {
    if (stage === "easy") {
      return "standard";
    }
    if (stage === "normal") {
      return Phaser.Math.Between(0, 99) < 65 ? "large" : "standard";
    }
    return Phaser.Math.Between(0, 99) < 45 ? "large" : "standard";
  }

  spawnTrapByDefinition(definition, x, y, sizeVariant = "standard") {
    const trap = this.group.get(x, y, definition.key);
    if (!trap) {
      return;
    }

    const variant = SIZE_VARIANTS[sizeVariant] ?? SIZE_VARIANTS.standard;
    trap.enableBody(true, x, y, true, true);
    trap.setTexture(definition.key);
    trap.setScale(definition.scale * variant.scale);
    trap.setDepth(8);
    trap.body.setAllowGravity(false);
    trap.body.setImmovable(true);
    this.applyBodyShape(trap, definition.body, variant.bodyScale);
    trap.patternMotion = definition.motion ? Phaser.Math.Between(-definition.motion, definition.motion) : 0;

    if (definition.anchor === "bottom") {
      trap.setOrigin(0.5, 1);
      trap.y = GAME_HEIGHT + (definition.visualInset ?? 0);
    } else if (definition.anchor === "top") {
      trap.setOrigin(0.5, 0);
      trap.y = -(definition.visualInset ?? 0);
    } else {
      trap.setOrigin(0.5, 0.5);
      trap.y = y;
    }
  }

  applyBodyShape(trap, body, bodyScale) {
    if (body.type === "circle") {
      trap.body.setCircle(body.radius * bodyScale, body.offsetX, body.offsetY);
      return;
    }

    trap.body.setSize(body.width * bodyScale, body.height * bodyScale);
    trap.body.setOffset(body.offsetX, body.offsetY);
  }
}
