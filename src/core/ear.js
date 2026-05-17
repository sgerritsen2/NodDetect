const LEFT_EYE = {
  outer: 33,
  inner: 133,
  top1: 159,
  bottom1: 145,
  top2: 158,
  bottom2: 153,
};

const RIGHT_EYE = {
  outer: 362,
  inner: 263,
  top1: 386,
  bottom1: 374,
  top2: 385,
  bottom2: 380,
};

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export class EARCalculator {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.calibrationMs = 3000;
    this.reset();
  }

  reset() {
    this.startedAt = 0;
    this.baselineSamples = [];
    this.baselineEAR = 0.3;
    this.closedThreshold = 0.2;
    this.isCalibrated = false;
    this.isEyesClosed = false;
    this.eyeClosureStartTime = 0;
    this.blinkHistory = [];
    this.closureFrames = [];
    this.microsleepHistory = [];
    this.longestClosureMs = 0;
    this.currentClosureMs = 0;
    this.dashboard?.updateEyeMetrics?.(this.getMetrics(0));
  }

  startCalibration() {
    this.reset();
    this.startedAt = performance.now();
  }

  calculateEAR(landmarks, ids) {
    const vertical1 = distance(landmarks[ids.top1], landmarks[ids.bottom1]);
    const vertical2 = distance(landmarks[ids.top2], landmarks[ids.bottom2]);
    const horizontal = distance(landmarks[ids.outer], landmarks[ids.inner]);
    return (vertical1 + vertical2) / (2 * horizontal);
  }

  processLandmarks(landmarks, now = performance.now()) {
    if (!this.startedAt) {
      this.startCalibration();
    }

    const leftEAR = this.calculateEAR(landmarks, LEFT_EYE);
    const rightEAR = this.calculateEAR(landmarks, RIGHT_EYE);
    const ear = (leftEAR + rightEAR) / 2;

    if (!this.isCalibrated) {
      this.calibrate(ear, now);
    }

    this.updateEyeState(ear, now);
    this.pruneHistory(now);

    const metrics = this.getMetrics(ear, now);
    this.dashboard.updateEyeMetrics(metrics);
    return metrics;
  }

  calibrate(ear, now) {
    if (ear > 0.12) {
      this.baselineSamples.push(ear);
    }

    const elapsed = now - this.startedAt;
    this.dashboard.updateCalibration(`Calibrating ${Math.max(0, Math.ceil((this.calibrationMs - elapsed) / 1000))}s`);

    if (elapsed >= this.calibrationMs && this.baselineSamples.length > 8) {
      const sorted = [...this.baselineSamples].sort((a, b) => a - b);
      const start = Math.floor(sorted.length * 0.2);
      const end = Math.ceil(sorted.length * 0.9);
      const stableSamples = sorted.slice(start, end);
      this.baselineEAR = stableSamples.reduce((sum, sample) => sum + sample, 0) / stableSamples.length;
      this.closedThreshold = this.baselineEAR * 0.65;
      this.isCalibrated = true;
      this.dashboard.updateCalibration('Calibrated');
    }
  }

  updateEyeState(ear, now) {
    const closed = ear < this.closedThreshold;
    this.closureFrames.push({ time: now, closed });

    if (closed && !this.isEyesClosed) {
      this.isEyesClosed = true;
      this.eyeClosureStartTime = now;
    }

    if (closed && this.isEyesClosed) {
      this.currentClosureMs = now - this.eyeClosureStartTime;
      if (this.currentClosureMs > 500 && this.lastMicrosleepStart !== this.eyeClosureStartTime) {
        this.lastMicrosleepStart = this.eyeClosureStartTime;
        this.microsleepHistory.push(now);
      }
    }

    if (!closed && this.isEyesClosed) {
      const closureDuration = now - this.eyeClosureStartTime;
      this.isEyesClosed = false;
      this.currentClosureMs = 0;
      this.longestClosureMs = Math.max(this.longestClosureMs, closureDuration);

      if (closureDuration >= 80 && closureDuration < 500) {
        this.blinkHistory.push(now);
      }
    }
  }

  pruneHistory(now) {
    const minuteAgo = now - 60000;
    const thirtySecondsAgo = now - 30000;
    this.blinkHistory = this.blinkHistory.filter((time) => time >= minuteAgo);
    this.closureFrames = this.closureFrames.filter((frame) => frame.time >= thirtySecondsAgo);
    this.microsleepHistory = this.microsleepHistory.filter((time) => time >= thirtySecondsAgo);
  }

  getMetrics(ear, now = performance.now()) {
    const closedFrames = this.closureFrames.filter((frame) => frame.closed).length;
    const perclos30s = this.closureFrames.length ? closedFrames / this.closureFrames.length : 0;
    const currentLongest = this.isEyesClosed ? Math.max(this.longestClosureMs, now - this.eyeClosureStartTime) : this.longestClosureMs;
    const confidence = this.isCalibrated ? clamp(this.closureFrames.length / 30) : clamp((now - this.startedAt) / this.calibrationMs);

    return {
      ear,
      baselineEAR: this.baselineEAR,
      blinkRate: this.blinkHistory.length,
      perclos30s,
      microsleeps30s: this.microsleepHistory.length,
      longestClosureMs: currentLongest,
      currentClosureMs: this.isEyesClosed ? now - this.eyeClosureStartTime : 0,
      isEyesClosed: this.isEyesClosed,
      isMicrosleep: this.isEyesClosed && now - this.eyeClosureStartTime > 500,
      isCalibrated: this.isCalibrated,
      confidence,
    };
  }
}
