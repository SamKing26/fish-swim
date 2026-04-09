export class AppController {
  constructor() {
    this.arcadeGame = null;
    this.arcadeScene = null;
    this.fishWorldApp = null;

    this.startButton = document.getElementById("start-button");
    this.fishWorldButton = document.getElementById("fish-world-button");
    this.startOverlay = document.getElementById("start-overlay");

    this.setModeClass("landing");
    this.bindLanding();
    this.handleInitialRoute();
  }

  bindLanding() {
    this.startButton?.addEventListener("click", async () => {
      const username = document.getElementById("username-input")?.value?.trim() || "Player";
      await this.startArcadeMode(username);
    });

    this.fishWorldButton?.addEventListener("click", async () => {
      const username = document.getElementById("username-input")?.value?.trim() || "Player";
      await this.startFishWorldModeAsync(username);
    });
  }

  handleInitialRoute() {
    const mode = new URLSearchParams(window.location.search).get("mode");
    if (mode === "fish-world") {
      const username = document.getElementById("username-input")?.value?.trim() || "Player";
      this.startFishWorldModeAsync(username, false);
    }
  }

  async startArcadeMode(username) {
    this.destroyFishWorld();
    this.updateRoute(null);
    this.setModeClass("arcade");
    const scene = await this.ensureArcadeScene();
    await scene.startArcadeMode(username);
  }

  startFishWorldMode(username, pushRoute = true) {
    return this.startFishWorldModeAsync(username, pushRoute);
  }

  async startFishWorldModeAsync(username, pushRoute = true) {
    this.destroyArcadeGame();
    this.startOverlay?.classList.remove("visible");
    this.setModeClass("fish-world");
    if (pushRoute) {
      this.updateRoute("fish-world");
    }
    const { FishWorldApp } = await import("../fish-world/FishWorldApp.js");
    this.fishWorldApp = new FishWorldApp({
      container: document.getElementById("fish-world-root"),
      uiRoot: document.getElementById("fish-world-ui"),
      radarScope: document.getElementById("fish-world-radar-scope"),
      phaseNode: document.getElementById("fish-world-phase"),
      hpNode: document.getElementById("fish-world-hp"),
      growthNode: document.getElementById("fish-world-growth"),
      evolutionNode: document.getElementById("fish-world-evolution"),
      regionNode: document.getElementById("fish-world-region"),
      lobbyButton: document.getElementById("fish-world-lobby-button"),
      username,
      onBackToLobby: () => {
        this.destroyFishWorld();
        this.updateRoute(null);
        this.setModeClass("landing");
        this.startOverlay?.classList.add("visible");
      },
    });
    await this.fishWorldApp.start();
  }

  async ensureArcadeScene() {
    if (this.arcadeScene) {
      return this.arcadeScene;
    }

    const { createGame } = await import("../game/createGame.js");
    this.arcadeGame = createGame();
    this.arcadeScene = await new Promise((resolve) => {
      const resolveScene = () => {
        const scene = this.arcadeGame?.scene?.keys?.["fish-swim"];
        if (scene) {
          resolve(scene);
          return;
        }
        window.requestAnimationFrame(resolveScene);
      };
      resolveScene();
    });

    return this.arcadeScene;
  }

  destroyArcadeGame() {
    if (!this.arcadeGame) {
      return;
    }

    this.arcadeGame.destroy(true);
    this.arcadeGame = null;
    this.arcadeScene = null;
  }

  destroyFishWorld() {
    if (!this.fishWorldApp) {
      return;
    }

    this.fishWorldApp.destroy();
    this.fishWorldApp = null;
  }

  updateRoute(mode) {
    const url = new URL(window.location.href);
    if (mode) {
      url.searchParams.set("mode", mode);
    } else {
      url.searchParams.delete("mode");
    }
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }

  setModeClass(mode) {
    document.body.classList.remove("mode-landing", "mode-arcade", "mode-fish-world");
    document.body.classList.add(`mode-${mode}`);
  }
}
