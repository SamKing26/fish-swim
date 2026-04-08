import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "./constants.js";
import { FishSwimScene } from "./scenes/FishSwimScene.js";

export function createGame() {
  const debugBodies = import.meta.env.DEV
    && new URLSearchParams(window.location.search).get("debugBodies") === "1";
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: "game",
    backgroundColor: "#041522",
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [FishSwimScene],
  });

  game.registry.set("debugBodies", debugBodies);

  window.addEventListener("resize", () => {
    game.scale.refresh();
  });

  return game;
}
