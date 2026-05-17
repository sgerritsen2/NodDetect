export class Dashboard {
    constructor() {
        this.earEl = document.getElementById('ear-text');
        this.blinkEl = document.getElementById('blink-text');
        this.microsleepEl = document.getElementById('microsleep-text');
        this.scoreEl = document.getElementById('score-text');
        this.scoreBarEl = document.getElementById('score-bar');
    }

    updateEAR(value) {
        this.earEl.textContent = value.toFixed(2);
    }

    updateBlinkRate(bpm) {
        this.blinkEl.textContent = bpm;
    }

    updateMicrosleep(isMicrosleep) {
        if (isMicrosleep) {
            this.microsleepEl.textContent = 'MICROSLEEP';
            this.microsleepEl.className = 'text-lg font-bold mt-1 text-red-500';
        } else {
            this.microsleepEl.textContent = 'AWAKE';
            this.microsleepEl.className = 'text-lg font-bold mt-1 text-green-400';
        }
    }

    updateGazeDrift(drift) {
        document.getElementById('gaze-text').textContent = drift;
    }

    updateScore(score) {
        // Score from 0 to 100
        this.scoreEl.textContent = `${Math.round(score)}%`;
        this.scoreBarEl.style.width = `${score}%`;
        
        // Update bar color based on tier
        if (score < 60) {
            this.scoreBarEl.className = 'absolute top-0 left-0 h-full bg-green-500 transition-all duration-300';
        } else if (score < 80) {
            this.scoreBarEl.className = 'absolute top-0 left-0 h-full bg-yellow-500 transition-all duration-300';
        } else {
            this.scoreBarEl.className = 'absolute top-0 left-0 h-full bg-red-600 transition-all duration-300';
        }
    }

    reset() {
        this.updateEAR(0);
        this.updateBlinkRate(0);
        this.updateMicrosleep(false);
        this.updateScore(0);
    }
}