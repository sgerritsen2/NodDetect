export class FaceMeshManager {
  constructor(earCalc, gazeCalc, headPoseCalc, classifier, dashboard) {
    this.earCalc = earCalc;
    this.gazeCalc = gazeCalc;
    this.headPoseCalc = headPoseCalc;
    this.classifier = classifier;
    this.dashboard = dashboard;
    this.faceMesh = null;
  }

  async initialize() {
    this.faceMesh = new window.FaceMesh({
      locateFile: (file) => `/vendor/mediapipe/face_mesh/${file}`,
    });

    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.58,
      minTrackingConfidence: 0.58,
    });

    this.faceMesh.onResults(this.onResults.bind(this));
  }

  async sendFrame(videoElement) {
    if (this.faceMesh) {
      await this.faceMesh.send({ image: videoElement });
    }
  }

  reset() {
    this.earCalc.reset();
    this.gazeCalc.reset();
    this.headPoseCalc.reset();
    this.classifier.reset();
    this.clearCanvas();
  }

  startCalibration() {
    this.earCalc.startCalibration();
    this.gazeCalc.startCalibration();
    this.headPoseCalc.startCalibration();
  }

  onResults(results) {
    const landmarks = results.multiFaceLandmarks?.[0];

    if (!landmarks) {
      this.dashboard.updateCalibration('No face detected');
      this.clearCanvas();
      return;
    }

    this.drawMesh(landmarks);

    const now = performance.now();
    const eye = this.earCalc.processLandmarks(landmarks, now);
    const gaze = this.gazeCalc.calculateGazeDrift(landmarks, now);
    const head = this.headPoseCalc.calculateHeadPose(landmarks, now);
    const confidence = (eye.confidence + gaze.confidence + head.confidence) / 3;
    this.dashboard.updateConfidence(confidence);

    this.classifier.predict({ eye, gaze, head });
  }

  drawMesh(landmarks) {
    const canvas = document.getElementById('overlay');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    window.drawConnectors(ctx, landmarks, window.FACEMESH_FACE_OVAL, { color: 'rgba(255,255,255,0.34)', lineWidth: 1 });
    window.drawConnectors(ctx, landmarks, window.FACEMESH_LEFT_EYE, { color: '#35d889', lineWidth: 1.4 });
    window.drawConnectors(ctx, landmarks, window.FACEMESH_RIGHT_EYE, { color: '#35d889', lineWidth: 1.4 });
    window.drawConnectors(ctx, landmarks, window.FACEMESH_LEFT_IRIS, { color: '#f0b03a', lineWidth: 1.4 });
    window.drawConnectors(ctx, landmarks, window.FACEMESH_RIGHT_IRIS, { color: '#f0b03a', lineWidth: 1.4 });
  }

  clearCanvas() {
    const canvas = document.getElementById('overlay');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}
