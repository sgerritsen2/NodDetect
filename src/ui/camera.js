export class CameraManager {
  constructor(videoElement, canvasElement, onFrameCb) {
    this.video = videoElement;
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.onFrameCb = onFrameCb;
    this.stream = null;
    this.animationId = null;
    this.lastTime = 0;
    this.isProcessing = false;
  }

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 960 },
        height: { ideal: 720 },
        frameRate: { ideal: 30, max: 30 },
        facingMode: 'user',
      },
      audio: false,
    });

    this.video.srcObject = this.stream;

    await new Promise((resolve) => {
      this.video.onloadedmetadata = () => {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        resolve();
      };
    });

    await this.video.play();
    this.processLoop();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.video.srcObject = null;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  async processLoop(currentTime = 0) {
    if (currentTime - this.lastTime >= 1000 / 24 && !this.isProcessing) {
      if (this.video.readyState >= this.video.HAVE_CURRENT_DATA) {
        this.isProcessing = true;
        await this.onFrameCb(this.video);
        this.isProcessing = false;
      }
      this.lastTime = currentTime;
    }

    this.animationId = requestAnimationFrame(this.processLoop.bind(this));
  }
}
