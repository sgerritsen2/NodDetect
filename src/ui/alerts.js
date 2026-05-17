export class AlertSystem {
    constructor() {
        this.overlay = document.getElementById('alert-overlay');
        this.isAlerting = false;
        
        // Simple beep creation using Web Audio API
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
    }

    triggerMicrosleep() {
        this.triggerCriticalAlert('MICROSLEEP DETECTED!');
    }

    triggerCriticalAlert(message = 'WAKE UP!') {
        if (this.isAlerting) return;
        this.isAlerting = true;
        
        this.overlay.innerHTML = `
            <div class="text-4xl font-bold text-white px-8 py-4 rounded bg-red-600 shadow-2xl animate-pulse">
                ${message}
            </div>
        `;
        
        this.overlay.classList.remove('opacity-0');
        this.overlay.classList.add('opacity-100');
        
        this.playBeep();
        
        // Auto-dismiss after 2 seconds
        setTimeout(() => {
            this.clearAlert();
        }, 2000);
    }

    clearAlert() {
        this.overlay.classList.remove('opacity-100');
        this.overlay.classList.add('opacity-0');
        this.isAlerting = false;
    }

    playBeep() {
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(880, this.audioCtx.currentTime); // 880Hz
        
        gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(this.audioCtx.currentTime + 0.5);
    }
}