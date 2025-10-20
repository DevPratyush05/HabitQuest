// path: /js/sounds.js

class SoundManager {
  constructor() {
    this.sounds = new Map();
    this.enabled = true;
    this.audioContext = null;
    this.init();
  }

  async init() {
    try {
      // Initialize Audio Context on user interaction
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();

      // Create simple, reliable sounds
      this.createSimpleSounds();
      console.log("SoundManager initialized successfully");
    } catch (error) {
      console.log("Web Audio API not supported, using fallback:", error);
      this.createFallbackSounds();
    }
  }

  createSimpleSounds() {
    // Complete sound - short positive beep
    this.sounds.set("complete", {
      play: () => this.playTone(800, 0.2, 0.3),
    });

    // Level up sound - ascending tones
    this.sounds.set("levelUp", {
      play: () => this.playLevelUpSound(),
    });

    // Achievement sound - celebratory tones
    this.sounds.set("achievement", {
      play: () => this.playAchievementSound(),
    });
  }

  createFallbackSounds() {
    // Create very simple beep using oscillator as fallback
    this.sounds.set("complete", {
      play: () => this.playFallbackBeep(800, 200),
    });

    this.sounds.set("levelUp", {
      play: () => {
        this.playFallbackBeep(523, 100);
        setTimeout(() => this.playFallbackBeep(659, 100), 120);
        setTimeout(() => this.playFallbackBeep(783, 200), 240);
      },
    });

    this.sounds.set("achievement", {
      play: () => {
        this.playFallbackBeep(659, 150);
        setTimeout(() => this.playFallbackBeep(783, 150), 180);
        setTimeout(() => this.playFallbackBeep(1046, 300), 360);
      },
    });
  }

  playFallbackBeep(frequency, duration) {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        0.3,
        this.audioContext.currentTime + 0.01
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        this.audioContext.currentTime + duration / 1000
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.log("Fallback sound failed:", error);
    }
  }

  playTone(frequency, duration, volume = 0.3) {
    if (!this.enabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        volume,
        this.audioContext.currentTime + 0.01
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        this.audioContext.currentTime + duration
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.log("Sound play error:", error);
    }
  }

  playLevelUpSound() {
    if (!this.enabled) return;

    this.playTone(523.25, 0.1, 0.3); // C5
    setTimeout(() => this.playTone(659.25, 0.1, 0.3), 100); // E5
    setTimeout(() => this.playTone(783.99, 0.3, 0.3), 200); // G5
  }

  playAchievementSound() {
    if (!this.enabled) return;

    this.playTone(659.25, 0.2, 0.3); // E5
    setTimeout(() => this.playTone(783.99, 0.2, 0.3), 200); // G5
    setTimeout(() => this.playTone(1046.5, 0.5, 0.4), 400); // C6
  }

  play(soundName) {
    if (!this.enabled) return;

    // Resume audio context if suspended (browser policy)
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume().catch(console.error);
    }

    const sound = this.sounds.get(soundName);
    if (sound && sound.play) {
      try {
        sound.play();
      } catch (error) {
        console.log(`Sound ${soundName} play failed:`, error);
      }
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    localStorage.setItem("soundEnabled", enabled);

    // Initialize audio context when enabling sounds
    if (enabled && !this.audioContext) {
      this.init();
    }
  }
}

// Global sound manager instance
const soundManager = new SoundManager();

// Global functions
function playSound(soundName) {
  soundManager.play(soundName);
}

function setSoundEnabled(enabled) {
  soundManager.setEnabled(enabled);
}

// Initialize audio context on first user interaction
document.addEventListener(
  "click",
  function initAudio() {
    if (
      soundManager.audioContext &&
      soundManager.audioContext.state === "suspended"
    ) {
      soundManager.audioContext.resume().then(() => {
        console.log("Audio context resumed");
      });
    }
    document.removeEventListener("click", initAudio);
  },
  { once: true }
);
