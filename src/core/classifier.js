import * as ort from 'onnxruntime-web';

export class FatigueClassifier {
    constructor(dashboard, alertSystem) {
        this.dashboard = dashboard;
        this.alertSystem = alertSystem;
        this.session = null;
        this.dummyMode = true; // Use heuristic if no ONNX model is found
    }

    async loadModel() {
        try {
            // Attempt to load the ONNX model
            // this.session = await ort.InferenceSession.create('/src/model/fatigue.onnx');
            // this.dummyMode = false;
            console.log("No actual ONNX model provided, falling back to heuristic fusion rule.");
        } catch (e) {
            console.warn("Failed to load fatigue.onnx, using heuristic fallback.", e);
            this.dummyMode = true;
        }
    }

    predict(ear, blinkRate, gazeDrift, isMicrosleep) {
        let score = 0;

        if (this.dummyMode) {
            // Heuristic fallback
            // EAR: normally > 0.25. If lower, increase score.
            let earPenalty = Math.max(0, 0.25 - ear) * 200; // up to 50
            
            // Blink rate: normally ~15-20. Low blink rate = staring, high = struggling to stay awake
            let blinkPenalty = 0;
            if (blinkRate < 10) blinkPenalty = 10;
            else if (blinkRate > 30) blinkPenalty = 20;

            // Gaze drift: staring off
            let gazePenalty = Math.min(20, gazeDrift * 10);

            score = earPenalty + blinkPenalty + gazePenalty;

            if (isMicrosleep) {
                score += 50; 
            }
        }

        // Clamp to 0-100
        score = Math.max(0, Math.min(100, score));

        this.dashboard.updateScore(score);

        if (score >= 95) {
            this.alertSystem.triggerCriticalAlert('CRITICAL FATIGUE: STOP DRIVING!');
        } else if (score >= 80) {
            this.alertSystem.triggerCriticalAlert('WARNING: High Fatigue');
        }

        return score;
    }
}