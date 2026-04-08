export class HudController {
  constructor() {
    this.scoreNode = document.getElementById("score");
    this.boostStatusNode = document.getElementById("boost-status");
    this.menuButton = document.getElementById("menu-button");
    this.startOverlay = document.getElementById("start-overlay");
    this.usernameInput = document.getElementById("username-input");
    this.gameOverOverlay = document.getElementById("game-over-overlay");
    this.pauseOverlay = document.getElementById("pause-overlay");
    this.finalScoreNode = document.getElementById("final-score");
    this.startButton = document.getElementById("start-button");
    this.restartButton = document.getElementById("restart-button");
    this.lobbyButton = document.getElementById("lobby-button");
    this.resumeButton = document.getElementById("resume-button");
    this.pauseLobbyButton = document.getElementById("pause-lobby-button");
    this.leaderboardListNode = document.getElementById("leaderboard-list");
    this.rotateOverlay = document.getElementById("rotate-overlay");
    this.displayedScore = 0;
    this.displayedBestScore = 0;
  }

  bindStart(handler) {
    this.startButton.addEventListener("click", () => handler(this.getUsername()));
  }

  bindRestart(handler) {
    this.restartButton.addEventListener("click", handler);
  }

  bindLobby(handler) {
    this.lobbyButton.addEventListener("click", handler);
  }

  bindMenu(handler) {
    this.menuButton.addEventListener("click", handler);
  }

  bindResume(handler) {
    this.resumeButton.addEventListener("click", handler);
  }

  bindPauseLobby(handler) {
    this.pauseLobbyButton.addEventListener("click", handler);
  }

  showStart() {
    this.displayedScore = 0;
    this.startOverlay.classList.add("visible");
    this.gameOverOverlay.classList.remove("visible");
    this.pauseOverlay.classList.remove("visible");
    this.menuButton.classList.add("hidden");
    this.usernameInput?.focus();
  }

  hideStart() {
    this.startOverlay.classList.remove("visible");
    this.menuButton.classList.remove("hidden");
  }

  showGameOver(score, leaderboardEntries = []) {
    this.displayedScore = score;
    this.finalScoreNode.textContent = String(score);
    this.renderLeaderboard(leaderboardEntries);
    this.pauseOverlay.classList.remove("visible");
    this.menuButton.classList.add("hidden");
    this.gameOverOverlay.classList.add("visible");
  }

  hideGameOver() {
    this.gameOverOverlay.classList.remove("visible");
  }

  showPause() {
    this.pauseOverlay.classList.add("visible");
    this.menuButton.classList.add("hidden");
  }

  hidePause() {
    this.pauseOverlay.classList.remove("visible");
    this.menuButton.classList.remove("hidden");
  }

  renderLeaderboard(entries) {
    if (!entries.length) {
      this.leaderboardListNode.innerHTML = '<div class="leaderboard-empty">No scores yet</div>';
      return;
    }

    this.leaderboardListNode.innerHTML = entries
      .map(
        (entry, index) => `
          <div class="leaderboard-row">
            <span class="leaderboard-rank">#${index + 1}</span>
            <span class="leaderboard-name">${entry.name}</span>
            <span class="leaderboard-score">${entry.score}</span>
          </div>
        `,
      )
      .join("");
  }

  getUsername() {
    return this.usernameInput?.value?.trim() || "Player";
  }

  setUsername(value) {
    if (!this.usernameInput) {
      return;
    }
    this.usernameInput.value = value;
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

    if (boostLabel) {
      this.boostStatusNode.textContent = boostLabel;
      this.boostStatusNode.classList.remove("hidden");
    } else {
      this.boostStatusNode.textContent = "";
      this.boostStatusNode.classList.add("hidden");
    }
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
