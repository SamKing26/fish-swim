export class HudController {
  constructor() {
    this.scoreNode = document.getElementById("score");
    this.bestScoreNode = document.getElementById("best-score");
    this.speedNode = document.getElementById("speed");
    this.boostStatusNode = document.getElementById("boost-status");
    this.startOverlay = document.getElementById("start-overlay");
    this.gameOverOverlay = document.getElementById("game-over-overlay");
    this.finalScoreNode = document.getElementById("final-score");
    this.finalBestScoreNode = document.getElementById("final-best-score");
    this.startButton = document.getElementById("start-button");
    this.restartButton = document.getElementById("restart-button");
    this.rotateOverlay = document.getElementById("rotate-overlay");
  }

  bindStart(handler) {
    this.startButton.addEventListener("click", handler);
  }

  bindRestart(handler) {
    this.restartButton.addEventListener("click", handler);
  }

  showStart() {
    this.startOverlay.classList.add("visible");
    this.gameOverOverlay.classList.remove("visible");
  }

  hideStart() {
    this.startOverlay.classList.remove("visible");
  }

  showGameOver(score, bestScore) {
    this.finalScoreNode.textContent = String(score);
    this.finalBestScoreNode.textContent = String(bestScore);
    this.gameOverOverlay.classList.add("visible");
  }

  hideGameOver() {
    this.gameOverOverlay.classList.remove("visible");
  }

  update({ score, bestScore, speedLabel, boostLabel }) {
    this.scoreNode.textContent = String(score);
    this.bestScoreNode.textContent = String(bestScore);
    this.speedNode.textContent = speedLabel;
    this.boostStatusNode.textContent = boostLabel;
  }

  async enterImmersiveMode() {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Fullscreen is best-effort and browser-dependent.
    }

    try {
      if (window.screen?.orientation?.lock) {
        await window.screen.orientation.lock("landscape");
      }
    } catch {
      // Orientation lock usually requires fullscreen and may not be supported.
    }
  }
}
