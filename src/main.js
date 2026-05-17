import { CameraManager } from './ui/camera.js';
import { FaceMeshManager } from './core/facemesh.js';
import { EARCalculator } from './core/ear.js';
import { GazeCalculator } from './core/gaze.js';
import { HeadPoseCalculator } from './core/headPose.js';
import { FatigueClassifier } from './core/classifier.js';
import { Dashboard } from './ui/dashboard.js';
import { AlertSystem } from './ui/alerts.js';

let cameraManager = null;
let faceMeshManager = null;
let classifier = null;
let dashboard = null;
let isRunning = false;

const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const statusIndicator = document.getElementById('status-indicator');

function setStatus(label, state) {
  statusIndicator.textContent = label;
  statusIndicator.className = `status-pill ${state}`;
}

async function initialize() {
  try {
    setStatus('Initializing', 'idle');

    dashboard = new Dashboard();
    const alertSystem = new AlertSystem();
    const earCalc = new EARCalculator(dashboard);
    const gazeCalc = new GazeCalculator(dashboard);
    const headPoseCalc = new HeadPoseCalculator(dashboard);
    classifier = new FatigueClassifier(dashboard, alertSystem);
    await classifier.loadModel();

    faceMeshManager = new FaceMeshManager(earCalc, gazeCalc, headPoseCalc, classifier, dashboard);
    await faceMeshManager.initialize();

    cameraManager = new CameraManager(
      document.getElementById('webcam'),
      document.getElementById('overlay'),
      (video) => faceMeshManager.sendFrame(video),
    );

    startBtn.addEventListener('click', startMonitor);
    stopBtn.addEventListener('click', stopMonitor);
    setStatus('Ready', 'ready');
    dashboard.reset();
  } catch (error) {
    console.error('Initialization failed:', error);
    setStatus('Load error', 'error');
    dashboard?.updateCalibration?.('MediaPipe assets unavailable');
  }
}

async function startMonitor() {
  if (isRunning) {
    return;
  }

  try {
    isRunning = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    setStatus('Monitoring', 'monitoring');
    dashboard.updateCalibration('Starting camera');
    faceMeshManager.reset();
    faceMeshManager.startCalibration();
    await cameraManager.start();
  } catch (error) {
    console.error('Webcam error:', error);
    isRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    setStatus('Camera error', 'error');
    dashboard.updateCalibration('Camera permission needed');
  }
}

function stopMonitor() {
  if (!isRunning) {
    return;
  }

  isRunning = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  setStatus('Ready', 'ready');
  cameraManager.stop();
  faceMeshManager.reset();
  dashboard.reset();
}

window.addEventListener('DOMContentLoaded', initialize);
