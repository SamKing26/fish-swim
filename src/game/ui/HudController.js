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
    this.displayedScore = 0;
    this.displayedBestScore = 0;
  }

  bindStart(handler) {
    this.startButton.addEventListener("click", handler);
  }

  bindRestart(handler) {
    this.restartButton.addEventListener("click", handler);
  }

  showStart() {
    this.displayedScore = 0;
    this.startOverlay.classList.add("visible");
    this.gameOverOverlay.classList.remove("visible");
  }

  hideStart() {
    this.startOverlay.classList.remove("visible");
  }

  showGameOver(score, bestScore) {
    this.displayedScore = score;
    this.displayedBestScore = bestScore;
    this.finalScoreNode.textContent = String(score);
    this.finalBestScoreNode.textContent = String(bestScore);
    this.gameOverOverlay.classList.add("visible");
  }

  hideGameOver() {
    this.gameOverOverlay.classList.remove("visible");
  }

  update({ score, bestScore, speedLabel, boostLabel }) {
    this.displayedScore += Math.ceil((score - this.displayedScore) * 0.32);
    this.displayedBestScore += Math.ceil((bestScore - this.displayedBestScore) * 0.25);

    if (Math.abs(score - this.displayedScore) <= 2) {
      this.displayedScore = score;
    }
    if (Math.abs(bestScore - this.displayedBestScore) <= 2) {
      this.displayedBestScore = bestScore;
    }

    this.scoreNode.textContent = String(this.displayedScore);
    this.bestScoreNode.textContent = String(this.displayedBestScore);
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
