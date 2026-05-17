export class EARCalculator {
    constructor(dashboard, alertSystem) {
        this.dashboard = dashboard;
        this.alertSystem = alertSystem;
        
        // EAR Thresholds
        this.EAR_THRESHOLD = 0.25; 
        
        // State tracking
        this.isEyesClosed = false;
        this.eyeClosureStartTime = 0;
        this.blinkCount = 0;
        
        // History for moving average/rates
        this.blinkHistory = [];
    }

    calculateDistance(p1, p2) {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    }

    calculateEAR(eye) {
        // MediaPipe eye landmarks (approximate indices)
        // eye[0] = left, eye[8] = right
        // Verticals: [2]-[6], [4]-[4] approx
        const v1 = this.calculateDistance(eye[1], eye[5]);
        const v2 = this.calculateDistance(eye[2], eye[4]);
        const h = this.calculateDistance(eye[0], eye[3]);
        
        return (v1 + v2) / (2.0 * h);
    }

    getEyeIndices(landmarks, left) {
        // Left eye indices in MediaPipe
        const LEFT_EYE = [33, 160, 158, 133, 153, 144];
        // Right eye indices
        const RIGHT_EYE = [362, 385, 387, 263, 373, 380];
        
        const indices = left ? LEFT_EYE : RIGHT_EYE;
        return indices.map(idx => landmarks[idx]);
    }

    processLandmarks(landmarks) {
        const leftEye = this.getEyeIndices(landmarks, true);
        const rightEye = this.getEyeIndices(landmarks, false);
        
        const leftEar = this.calculateEAR(leftEye);
        const rightEar = this.calculateEAR(rightEye);
        
        // Average EAR
        const ear = (leftEar + rightEar) / 2.0;
        
        this.detectBlinks(ear);
        
        // Update UI
        this.dashboard.updateEAR(ear);
        this.dashboard.updateBlinkRate(this.getBPM());
        return ear;
    }

    detectBlinks(ear) {
        const now = Date.now();
        
        if (ear < this.EAR_THRESHOLD) {
            if (!this.isEyesClosed) {
                this.isEyesClosed = true;
                this.eyeClosureStartTime = now;
            } else {
                // Check for microsleep (>500ms closure)
                if (now - this.eyeClosureStartTime > 500) {
                    this.dashboard.updateMicrosleep(true);
                    this.alertSystem.triggerMicrosleep();
                }
            }
        } else {
            if (this.isEyesClosed) {
                this.isEyesClosed = false;
                const closureDuration = now - this.eyeClosureStartTime;
                
                // Count as a normal blink if short enough
                if (closureDuration < 500) {
                    this.registerBlink(now);
                }
                
                this.dashboard.updateMicrosleep(false);
            }
        }
    }

    registerBlink(timestamp) {
        this.blinkHistory.push(timestamp);
        // Clean old blinks (> 60s)
        const oneMinAgo = timestamp - 60000;
        this.blinkHistory = this.blinkHistory.filter(t => t > oneMinAgo);
        this.blinkCount = this.blinkHistory.length;
    }

    getBPM() {
        return this.blinkHistory.length;
    }

    reset() {
        this.isEyesClosed = false;
        this.eyeClosureStartTime = 0;
        this.dashboard.updateEAR(0);
        this.dashboard.updateMicrosleep(false);
    }
}