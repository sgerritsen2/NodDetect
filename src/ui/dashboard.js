export class Dashboard {
  constructor() {
    this.earEl = document.getElementById('ear-text');
    this.eyeStateEl = document.getElementById('eye-state-text');
    this.blinkEl = document.getElementById('blink-text');
    this.closureEl = document.getElementById('closure-text');
    this.perclosEl = document.getElementById('perclos-text');
    this.microsleepEl = document.getElementById('microsleep-text');
    this.gazeEl = document.getElementById('gaze-text');
    this.headEl = document.getElementById('head-text');
    this.confidenceEl = document.getElementById('confidence-text');
    this.calibrationEl = document.getElementById('calibration-text');
    this.scoreEl = document.getElementById('score-text');
    this.scoreBarEl = document.getElementById('score-bar');
    this.alertCopyEl = document.getElementById('alert-copy');
  }

  updateEyeMetrics(metrics) {
    this.earEl.textContent = metrics.ear.toFixed(2);
    this.eyeStateEl.textContent = metrics.isEyesClosed ? 'Eyes closed' : 'Eyes open';
    this.blinkEl.textContent = metrics.blinkRate;
    this.closureEl.textContent = `Longest closure ${Math.round(metrics.longestClosureMs)} ms`;
    this.perclosEl.textContent = `${Math.round(metrics.perclos30s * 100)}%`;
    this.microsleepEl.textContent = `Microsleeps ${metrics.microsleeps30s}`;
    this.updateConfidence(metrics.confidence);
  }

  updateGazeDrift(drift) {
    this.gazeEl.textContent = drift.toFixed(2);
  }

  updateHeadPose(drift) {
    this.headEl.textContent = `${Math.round(drift)}°`;
  }

  updateConfidence(confidence) {
    this.confidenceEl.textContent = `${Math.round(confidence * 100)}%`;
  }

  updateCalibration(message) {
    this.calibrationEl.textContent = message;
  }

  updateScore(score, level = 'normal', copy = "You're alert and focused. Keep it up.") {
    this.scoreEl.textContent = `${Math.round(score)}%`;
    this.scoreBarEl.style.width = `${score}%`;
    this.scoreBarEl.className = `score-bar ${level}`;
    this.alertCopyEl.textContent = copy;
  }

  reset() {
    this.updateEyeMetrics({
      ear: 0,
      blinkRate: 0,
      perclos30s: 0,
      microsleeps30s: 0,
      longestClosureMs: 0,
      isEyesClosed: false,
      confidence: 0,
    });
    this.updateGazeDrift(0);
    this.updateHeadPose(0);
    this.updateCalibration('Waiting for camera');
    this.updateScore(0);
  }
}
