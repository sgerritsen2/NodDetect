const LEFT_IRIS = [468, 469, 470, 471, 472];
const RIGHT_IRIS = [473, 474, 475, 476, 477];

function averagePoint(points) {
  return points.reduce(
    (sum, point) => ({ x: sum.x + point.x / points.length, y: sum.y + point.y / points.length }),
    { x: 0, y: 0 },
  );
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export class GazeCalculator {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.calibrationMs = 3000;
    this.reset();
  }

  reset() {
    this.startedAt = 0;
    this.samples = [];
    this.baseline = { x: 0.5, y: 0.5 };
    this.isCalibrated = false;
    this.lastDrift = 0;
  }

  startCalibration() {
    this.reset();
    this.startedAt = performance.now();
  }

  calculateGazeDrift(landmarks, now = performance.now()) {
    if (!this.startedAt) {
      this.startCalibration();
    }

    if (!landmarks[LEFT_IRIS[0]] || !landmarks[RIGHT_IRIS[0]]) {
      this.dashboard.updateGazeDrift(0);
      return { gazeDrift: 0, confidence: 0, available: false };
    }

    const left = this.normalizedIrisPosition(landmarks, LEFT_IRIS, 33, 133, 159, 145);
    const right = this.normalizedIrisPosition(landmarks, RIGHT_IRIS, 362, 263, 386, 374);
    const gaze = {
      x: (left.x + right.x) / 2,
      y: (left.y + right.y) / 2,
    };

    if (!this.isCalibrated) {
      this.samples.push(gaze);
      if (now - this.startedAt >= this.calibrationMs && this.samples.length > 8) {
        this.baseline = averagePoint(this.samples);
        this.isCalibrated = true;
      }
    }

    const dx = gaze.x - this.baseline.x;
    const dy = gaze.y - this.baseline.y;
    this.lastDrift = clamp(Math.hypot(dx, dy), 0, 1);
    this.dashboard.updateGazeDrift(this.lastDrift);

    return {
      gazeDrift: this.lastDrift,
      confidence: this.isCalibrated ? 1 : clamp((now - this.startedAt) / this.calibrationMs),
      available: true,
    };
  }

  normalizedIrisPosition(landmarks, irisIds, outerId, innerId, topId, bottomId) {
    const irisCenter = averagePoint(irisIds.map((id) => landmarks[id]));
    const outer = landmarks[outerId];
    const inner = landmarks[innerId];
    const top = landmarks[topId];
    const bottom = landmarks[bottomId];
    const eyeWidth = Math.max(0.0001, Math.abs(inner.x - outer.x));
    const eyeHeight = Math.max(0.0001, Math.abs(bottom.y - top.y));

    return {
      x: clamp((irisCenter.x - Math.min(outer.x, inner.x)) / eyeWidth),
      y: clamp((irisCenter.y - Math.min(top.y, bottom.y)) / eyeHeight),
    };
  }
}
