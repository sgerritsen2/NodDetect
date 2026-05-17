export class AlertSystem {
  constructor() {
    this.overlay = document.getElementById('alert-overlay');
    this.titleEl = document.getElementById('alert-title');
    this.messageEl = document.getElementById('alert-message');
    this.lastBeepAt = 0;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = AudioContext ? new AudioContext() : null;
  }

  update(level, eye) {
    if (level.label === 'red' || eye.isMicrosleep) {
      this.show('Critical fatigue risk', level.copy);
      this.playBeep();
      return;
    }

    if (level.label === 'orange') {
      this.show('Strong fatigue warning', level.copy);
      return;
    }

    this.clear();
  }

  show(title, message) {
    this.titleEl.textContent = title;
    this.messageEl.textContent = message;
    this.overlay.classList.remove('hidden');
  }

  clear() {
    this.overlay.classList.add('hidden');
  }

  playBeep() {
    if (!this.audioCtx || performance.now() - this.lastBeepAt < 1200) {
      return;
    }

    this.lastBeepAt = performance.now();
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(880, this.audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.11, this.audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.45);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    oscillator.start();
    oscillator.stop(this.audioCtx.currentTime + 0.45);
  }
}
