export class AudioManager {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.musicTimer = null;
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
    this.masterGain.gain.value = 0.06;
    this.masterGain.connect(this.context.destination);
  }

  resume() {
    this.ensureContext();
    if (this.context?.state === "suspended") {
      this.context.resume();
    }
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

  playSwim() {
    this.pulse({ frequency: 310, type: "triangle", duration: 0.08, volume: 0.12 });
  }

  playBoostPickup() {
    this.pulse({ frequency: 520, type: "sine", duration: 0.2, volume: 0.18 });
    this.pulse({ frequency: 740, type: "triangle", duration: 0.22, volume: 0.12, when: 0.04 });
  }

  playBoostActive() {
    this.pulse({ frequency: 460, type: "sawtooth", duration: 0.16, volume: 0.1 });
  }

  playCollision() {
    this.pulse({ frequency: 160, type: "square", duration: 0.26, volume: 0.18 });
  }

  playMilestone() {
    this.pulse({ frequency: 660, type: "triangle", duration: 0.12, volume: 0.14 });
    this.pulse({ frequency: 820, type: "triangle", duration: 0.16, volume: 0.12, when: 0.06 });
  }

  playButton() {
    this.pulse({ frequency: 420, type: "triangle", duration: 0.08, volume: 0.12 });
  }

  startMusicLoop() {
    if (!this.context || this.musicTimer) {
      return;
    }

    const motif = [220, 277, 330, 392, 196, 247, 294, 349];
    let index = 0;

    this.musicTimer = window.setInterval(() => {
      this.pulse({ frequency: motif[index % motif.length], type: "sine", duration: 0.28, volume: 0.05 });
      index += 1;
    }, 430);
  }
}
