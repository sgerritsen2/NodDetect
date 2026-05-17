import { FaceMesh } from '@mediapipe/face_mesh';
import { FACEMESH_TESSELATION, FACEMESH_RIGHT_EYE, FACEMESH_LEFT_EYE, FACEMESH_RIGHT_IRIS, FACEMESH_LEFT_IRIS } from '@mediapipe/face_mesh';
import { drawConnectors } from '@mediapipe/drawing_utils';

export class FaceMeshManager {
    constructor(earCalc, gazeCalc, classifier) {
        this.earCalc = earCalc;
        this.gazeCalc = gazeCalc;
        this.classifier = classifier;
        this.faceMesh = null;
    }

    async initialize() {
        this.faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });

        this.faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true, // Needed for iris tracking
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.faceMesh.onResults(this.onResults.bind(this));
    }

    async sendFrame(videoElement) {
        if (this.faceMesh) {
            await this.faceMesh.send({image: videoElement});
        }
    }

    onResults(results) {
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];
            
            // Render basic mesh for debug (optional)
            this.drawMesh(landmarks, results.image);
            
            // Process signals
            const ear = this.earCalc.processLandmarks(landmarks);
            const gaze = this.gazeCalc.calculateGazeDrift(landmarks);
            
            // Run Classifier Fusion
            this.classifier.predict(
                ear, 
                this.earCalc.getBPM(), 
                gaze, 
                this.earCalc.isEyesClosed && (Date.now() - this.earCalc.eyeClosureStartTime > 500)
            );
        } else {
            // No face detected
            this.earCalc.reset();
        }
    }

    drawMesh(landmarks, image) {
        const canvas = document.getElementById('overlay');
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawConnectors(ctx, landmarks, FACEMESH_RIGHT_EYE, {color: '#FF3030'});
        drawConnectors(ctx, landmarks, FACEMESH_LEFT_EYE, {color: '#30FF30'});
        drawConnectors(ctx, landmarks, FACEMESH_RIGHT_IRIS, {color: '#FF3030'});
        drawConnectors(ctx, landmarks, FACEMESH_LEFT_IRIS, {color: '#30FF30'});
    }
}