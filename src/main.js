import { CameraManager } from './ui/camera.js';
import { FaceMeshManager } from './core/facemesh.js';
import { EARCalculator } from './core/ear.js';
import { GazeCalculator } from './core/gaze.js';
import { FatigueClassifier } from './core/classifier.js';
import { Dashboard } from './ui/dashboard.js';
import { AlertSystem } from './ui/alerts.js';

let cameraManager = null;
let faceMeshManager = null;
let dashboard = null;
let alertSystem = null;
let isRunning = false;

const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const statusIndicator = document.getElementById('status-indicator');

async function initialize() {
  try {
    statusIndicator.textContent = 'Initializing...';
    
    dashboard = new Dashboard();
    alertSystem = new AlertSystem();
    
    const earCalc = new EARCalculator(dashboard, alertSystem);
    const gazeCalc = new GazeCalculator(dashboard);
    const classifier = new FatigueClassifier(dashboard, alertSystem);
    await classifier.loadModel();
    
    faceMeshManager = new FaceMeshManager(earCalc, gazeCalc, classifier);
    await faceMeshManager.initialize();
    
    cameraManager = new CameraManager(
        document.getElementById('webcam'),
        document.getElementById('overlay'),
        (video) => faceMeshManager.sendFrame(video)
    );

    statusIndicator.textContent = 'Ready';
    statusIndicator.className = 'px-4 py-2 rounded-full font-bold bg-green-600';
    
    startBtn.addEventListener('click', startMonitor);
    stopBtn.addEventListener('click', stopMonitor);

  } catch (error) {
    console.error('Initialization failed:', error);
    statusIndicator.textContent = 'Error loading model';
    statusIndicator.className = 'px-4 py-2 rounded-full font-bold bg-red-600';
  }
}

async function startMonitor() {
  if (isRunning) return;
  isRunning = true;
  
  startBtn.disabled = true;
  stopBtn.disabled = false;
  statusIndicator.textContent = 'Monitoring...';
  
  await cameraManager.start();
}

function stopMonitor() {
  if (!isRunning) return;
  isRunning = false;
  
  startBtn.disabled = false;
  stopBtn.disabled = true;
  statusIndicator.textContent = 'Ready';
  
  cameraManager.stop();
  dashboard.reset();
}

window.addEventListener('DOMContentLoaded', initialize);