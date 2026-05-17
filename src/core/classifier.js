function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

const LEVELS = {
  normal: {
    label: 'normal',
    copy: "You're alert and focused. Keep it up.",
    threshold: 0,
  },
  amber: {
    label: 'amber',
    copy: 'Small signs of fatigue detected. Take a posture reset and blink break.',
    threshold: 60,
    holdMs: 3000,
    clearBelow: 50,
  },
  orange: {
    label: 'orange',
    copy: 'Strong fatigue pattern detected. Consider taking a short break.',
    threshold: 80,
    holdMs: 2000,
    clearBelow: 70,
  },
  red: {
    label: 'red',
    copy: 'Critical fatigue risk. Stop the task safely and rest.',
    threshold: 95,
    holdMs: 1000,
    clearBelow: 85,
  },
};

export class FatigueClassifier {
  constructor(dashboard, alertSystem) {
    this.dashboard = dashboard;
    this.alertSystem = alertSystem;
    this.smoothedScore = 0;
    this.level = LEVELS.normal;
    this.thresholdStart = {};
  }

  async loadModel() {
    console.info('NodDetect MVP is using a local heuristic model. ONNX/TFLite can replace this without changing the signal pipeline.');
  }

  predict({ eye, gaze, head }) {
    const score = this.computeFatigueScore({
      perclos30s: eye.perclos30s,
      microsleeps30s: eye.microsleeps30s,
      gazeDrift: gaze.gazeDrift,
      headPoseDrift: head.headPoseDrift,
    });

    this.smoothedScore = Math.round(0.82 * this.smoothedScore + 0.18 * score);
    const activeLevel = this.updateAlertLevel(this.smoothedScore, eye, performance.now());

    this.dashboard.updateScore(this.smoothedScore, activeLevel.label, activeLevel.copy);
    this.alertSystem.update(activeLevel, eye);

    return this.smoothedScore;
  }

  computeFatigueScore({ perclos30s, microsleeps30s, gazeDrift, headPoseDrift }) {
    const perclosRisk = clamp(perclos30s / 0.25);
    const microsleepRisk = clamp(microsleeps30s / 3);
    const gazeRisk = clamp(gazeDrift / 0.18);
    const headRisk = clamp(headPoseDrift / 25);
    const eyeRisk = 0.7 * perclosRisk + 0.3 * microsleepRisk;

    return Math.round(100 * (0.55 * eyeRisk + 0.25 * gazeRisk + 0.2 * headRisk));
  }

  updateAlertLevel(score, eye, now) {
    if (eye.currentClosureMs > 1500) {
      this.level = LEVELS.red;
      return this.level;
    }

    const candidates = [LEVELS.red, LEVELS.orange, LEVELS.amber];
    for (const level of candidates) {
      if (score >= level.threshold) {
        this.thresholdStart[level.label] ??= now;
        if (now - this.thresholdStart[level.label] >= level.holdMs) {
          this.level = level;
          return level;
        }
      } else {
        this.thresholdStart[level.label] = null;
      }
    }

    if (this.level.label !== 'normal' && score >= this.level.clearBelow) {
      return this.level;
    }

    this.level = LEVELS.normal;
    return this.level;
  }

  reset() {
    this.smoothedScore = 0;
    this.level = LEVELS.normal;
    this.thresholdStart = {};
    this.dashboard.updateScore(0, 'normal', LEVELS.normal.copy);
    this.alertSystem.clear();
  }
}
