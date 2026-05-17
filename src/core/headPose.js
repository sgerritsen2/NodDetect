function angleBetween(a, b) {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export class HeadPoseCalculator {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.calibrationMs = 3000;
    this.reset();
  }

  reset() {
    this.startedAt = 0;
    this.samples = [];
    this.baseline = { yaw: 0, pitch: 0, roll: 0 };
    this.isCalibrated = false;
  }

  startCalibration() {
    this.reset();
    this.startedAt = performance.now();
  }

  calculateHeadPose(landmarks, now = performance.now()) {
    if (!this.startedAt) {
      this.startCalibration();
    }

    const pose = this.estimatePose(landmarks);

    if (!this.isCalibrated) {
      this.samples.push(pose);
      if (now - this.startedAt >= this.calibrationMs && this.samples.length > 8) {
        this.baseline = {
          yaw: average(this.samples.map((sample) => sample.yaw)),
          pitch: average(this.samples.map((sample) => sample.pitch)),
          roll: average(this.samples.map((sample) => sample.roll)),
        };
        this.isCalibrated = true;
      }
    }

    const drift = Math.max(
      Math.abs(pose.yaw - this.baseline.yaw),
      Math.abs(pose.pitch - this.baseline.pitch),
      Math.abs(pose.roll - this.baseline.roll),
    );

    this.dashboard.updateHeadPose(drift);

    return {
      ...pose,
      headPoseDrift: drift,
      confidence: this.isCalibrated ? 1 : clamp((now - this.startedAt) / this.calibrationMs),
    };
  }

  estimatePose(landmarks) {
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const nose = landmarks[1];
    const chin = landmarks[152];
    const forehead = landmarks[10];
    const faceLeft = landmarks[234];
    const faceRight = landmarks[454];

    const faceWidth = Math.max(0.0001, Math.hypot(faceRight.x - faceLeft.x, faceRight.y - faceLeft.y));
    const faceHeight = Math.max(0.0001, Math.hypot(chin.x - forehead.x, chin.y - forehead.y));
    const centerX = (faceLeft.x + faceRight.x) / 2;
    const centerY = (forehead.y + chin.y) / 2;

    return {
      yaw: ((nose.x - centerX) / faceWidth) * 70,
      pitch: ((nose.y - centerY) / faceHeight) * 70,
      roll: angleBetween(leftEye, rightEye),
    };
  }
}
