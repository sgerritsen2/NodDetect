export class CameraManager {
    constructor(videoElement, canvasElement, onFrameCb) {
        this.video = videoElement;
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.onFrameCb = onFrameCb;
        this.stream = null;
        this.animationId = null;
        this.lastTime = 0;
    }

    async start() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, frameRate: 30 }
            });
            this.video.srcObject = this.stream;
            
            await new Promise(resolve => {
                this.video.onloadedmetadata = () => {
                    this.canvas.width = this.video.videoWidth;
                    this.canvas.height = this.video.videoHeight;
                    resolve();
                };
            });

            this.processLoop();
        } catch (error) {
            console.error('Webcam error:', error);
            alert('Could not access webcam. Please allow permissions.');
        }
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    async processLoop(currentTime = 0) {
        // Limit to approx 30fps
        if (currentTime - this.lastTime >= 1000 / 30) {
            if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
                // Clear previous drawings
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                await this.onFrameCb(this.video);
            }
            this.lastTime = currentTime;
        }
        this.animationId = requestAnimationFrame(this.processLoop.bind(this));
    }
}