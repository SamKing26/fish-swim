export class AudioManager {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.backgroundLoop = null;
    this.backgroundFadeHandle = null;
    this.boostPickupSound = null;
    this.boostTimerSound = null;
    this.movementClickBase = null;
  }

  ensureContext() {
    if (this.context) {
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    this.context = new AudioContextClass();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.09;
    this.masterGain.connect(this.context.destination);
  }

  resume() {
    this.ensureContext();
    if (this.context?.state === "suspended") {
      this.context.resume();
    }

    if (this.backgroundLoop?.paused) {
      this.backgroundLoop.play().catch(() => {});
    }

    if (this.boostTimerSound && this.boostTimerSound.paused) {
      this.boostTimerSound.play().catch(() => {});
    }
  }

  playOneShot(path, volume) {
    const sound = new Audio(path);
    sound.volume = volume;
    sound.play().catch(() => {});
    return sound;
  }

  pulse({ frequency, type = "sine", duration = 0.14, volume = 0.5, when = 0 }) {
    if (!this.context || !this.masterGain) {
      return;
    }

    const startAt = this.context.currentTime + when;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.05);
  }

  playCluster(notes) {
    notes.forEach((note) => this.pulse(note));
  }

  playSwim() {
    if (!this.movementClickBase) {
      this.movementClickBase = new Audio("/audio/movement-click.wav");
      this.movementClickBase.preload = "auto";
    }

    const click = this.movementClickBase.cloneNode();
    click.volume = 0.18;
    click.play().catch(() => {
      this.playCluster([
        { frequency: 210, type: "triangle", duration: 0.05, volume: 0.04 },
        { frequency: 280, type: "sine", duration: 0.08, volume: 0.022, when: 0.01 },
      ]);
    });
  }

  playBoostPickup() {
    if (!this.boostPickupSound) {
      this.boostPickupSound = new Audio("/audio/boost-pickup.wav");
      this.boostPickupSound.volume = 0.5;
    }

    this.boostPickupSound.currentTime = 0;
    this.boostPickupSound.play().catch(() => {
      this.playCluster([
        { frequency: 520, type: "sine", duration: 0.18, volume: 0.12 },
        { frequency: 740, type: "triangle", duration: 0.2, volume: 0.08, when: 0.04 },
      ]);
    });
  }

  playBoostActive() {
    this.playCluster([
      { frequency: 380, type: "sine", duration: 0.1, volume: 0.032 },
      { frequency: 480, type: "triangle", duration: 0.12, volume: 0.024, when: 0.02 },
    ]);
  }

  startBoostTimer(boostType) {
    const isShortBoost = boostType === "acceleration" || boostType === "shield";
    const clipPath = isShortBoost ? "/audio/boost-timer-4s.wav" : "/audio/boost-timer-7s.wav";

    this.stopBoostTimer();
    this.boostTimerSound = new Audio(clipPath);
    this.boostTimerSound.loop = true;
    this.boostTimerSound.volume = 0.4;
    this.boostTimerSound.play().catch(() => {
      this.playBoostActive();
    });
  }

  stopBoostTimer() {
    if (!this.boostTimerSound) {
      return;
    }

    this.boostTimerSound.pause();
    this.boostTimerSound.currentTime = 0;
    this.boostTimerSound = null;
  }

  playCollision() {
    this.playCluster([
      { frequency: 172, type: "triangle", duration: 0.18, volume: 0.13 },
      { frequency: 118, type: "sine", duration: 0.26, volume: 0.1, when: 0.03 },
    ]);
  }

  playGameOver() {
    this.playCluster([
      { frequency: 240, type: "triangle", duration: 0.16, volume: 0.08 },
      { frequency: 182, type: "sine", duration: 0.24, volume: 0.07, when: 0.05 },
      { frequency: 136, type: "triangle", duration: 0.32, volume: 0.065, when: 0.1 },
    ]);
  }

  playMilestone() {
    this.playCluster([
      { frequency: 620, type: "sine", duration: 0.1, volume: 0.08 },
      { frequency: 820, type: "triangle", duration: 0.14, volume: 0.055, when: 0.05 },
      { frequency: 980, type: "sine", duration: 0.12, volume: 0.038, when: 0.09 },
    ]);
  }

  playButton() {
    this.playCluster([
      { frequency: 410, type: "triangle", duration: 0.06, volume: 0.06 },
      { frequency: 520, type: "sine", duration: 0.05, volume: 0.034, when: 0.015 },
    ]);
  }

  startMusicLoop() {
    if (!this.backgroundLoop) {
      this.backgroundLoop = new Audio("/audio/sea-waves-loop.wav");
      this.backgroundLoop.loop = true;
      this.backgroundLoop.volume = 0;
      this.backgroundLoop.preload = "auto";
    }

    if (this.backgroundFadeHandle) {
      window.clearInterval(this.backgroundFadeHandle);
      this.backgroundFadeHandle = null;
    }

    if (this.backgroundLoop.paused || this.backgroundLoop.ended) {
      this.backgroundLoop.currentTime = 0;
      this.backgroundLoop.play().catch(() => {});
    }

    this.fadeBackgroundLoop(0.17, 1200);
  }

  stopMusicLoop() {
    if (!this.backgroundLoop) {
      return;
    }

    this.fadeBackgroundLoop(0, 700, () => {
      if (!this.backgroundLoop) {
        return;
      }
      this.backgroundLoop.pause();
      this.backgroundLoop.currentTime = 0;
    });
  }

  fadeBackgroundLoop(targetVolume, durationMs, onComplete = null) {
    if (!this.backgroundLoop) {
      return;
    }

    if (this.backgroundFadeHandle) {
      window.clearInterval(this.backgroundFadeHandle);
      this.backgroundFadeHandle = null;
    }

    const startVolume = this.backgroundLoop.volume;
    const startAt = performance.now();
    this.backgroundFadeHandle = window.setInterval(() => {
      if (!this.backgroundLoop) {
        window.clearInterval(this.backgroundFadeHandle);
        this.backgroundFadeHandle = null;
        return;
      }

      const elapsed = performance.now() - startAt;
      const progress = Math.min(1, elapsed / durationMs);
      this.backgroundLoop.volume = startVolume + (targetVolume - startVolume) * progress;

      if (progress >= 1) {
        window.clearInterval(this.backgroundFadeHandle);
        this.backgroundFadeHandle = null;
        this.backgroundLoop.volume = targetVolume;
        onComplete?.();
      }
    }, 50);
  }
}
