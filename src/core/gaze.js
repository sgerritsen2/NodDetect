export class GazeCalculator {
    constructor(dashboard) {
        this.dashboard = dashboard;
    }

    calculateGazeDrift(landmarks) {
        // Mock implementation of Gaze drift using Iris positions
        // In a real scenario, compare the left/right iris centers to eye corners
        // For now, we simulate a drift value based on arbitrary landmarks to keep it simple
        
        // MediaPipe Iris centers: Left 468, Right 473
        const leftIris = landmarks[468];
        const rightIris = landmarks[473];
        
        if (!leftIris || !rightIris) return 0;
        
        // Calculate a pseudo-drift based on the x position relative to the face center (nose tip: 1)
        const nose = landmarks[1];
        const avgIrisX = (leftIris.x + rightIris.x) / 2;
        const drift = Math.abs(avgIrisX - nose.x) * 10; // Scaled mock drift
        
        this.dashboard.updateGazeDrift(drift.toFixed(2));
        return drift;
    }
}