// js/continuity.js - Simplified Audio Jack Continuity Tester Controller

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const contPowerToggle = document.getElementById("cont-power-toggle");
  const contStatusIndicator = document.getElementById("cont-status-indicator");
  const contStatusText = document.getElementById("cont-status-text");
  const contSubText = document.getElementById("cont-sub-text");
  const contVolume = document.getElementById("cont-volume");
  const contVolumeVal = document.getElementById("cont-volume-val");

  // Web Audio Context
  let audioCtx = null;
  let micStream = null;
  let buzzerOsc = null;
  let buzzerGain = null;
  
  // Background Silent Audio for MediaSession takeover
  let silentAudio = null;

  // State Variables
  let isProbeActive = false;
  let isKeyTouch = false;
  let currentVolume = 0.5; // Default 50%

  // DMM LCD reference
  const dmmLcd = document.getElementById("dmm-lcd");

  // ==================== KEY INTERCEPTION & BLOCKING ====================
  // Intercept volume and media buttons globally to block default OS actions
  const blockKeys = (e) => {
    if (window.currentView !== "continuity-view" || !isProbeActive) return;

    const keysToBlock = [
      'VolumeUp', 'VolumeDown', 
      'AudioVolumeUp', 'AudioVolumeDown',
      'MediaPlayPause', 'MediaPlay', 'MediaPause', 'MediaStop',
      'HeadsetHook'
    ];

    if (keysToBlock.includes(e.key) || [24, 25, 179, 174, 175].includes(e.keyCode)) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      if (e.type === 'keydown') {
        isKeyTouch = true;
        updateContinuityState();
      } else if (e.type === 'keyup') {
        isKeyTouch = false;
        updateContinuityState();
      }
    }
  };

  window.addEventListener('keydown', blockKeys, { capture: true, passive: false });
  window.addEventListener('keyup', blockKeys, { capture: true, passive: false });
  window.addEventListener('keypress', blockKeys, { capture: true, passive: false });

  // ==================== AUDIO SETUP ====================
  
  function initAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  }

  function startBuzzer() {
    initAudioContext();
    if (!audioCtx) return;

    if (!buzzerOsc) {
      buzzerOsc = audioCtx.createOscillator();
      buzzerGain = audioCtx.createGain();

      buzzerOsc.type = "sine";
      buzzerOsc.frequency.setValueAtTime(2500, audioCtx.currentTime); // High pitch continuity beep
      buzzerGain.gain.setValueAtTime(0, audioCtx.currentTime); // Start silent

      buzzerOsc.connect(buzzerGain);
      buzzerGain.connect(audioCtx.destination);
      buzzerOsc.start();
    }
  }

  function setBuzzerVolume(volume) {
    if (buzzerGain && audioCtx) {
      buzzerGain.gain.setTargetAtTime(volume, audioCtx.currentTime, 0.01);
    }
  }

  function stopBuzzer() {
    if (buzzerOsc) {
      try {
        buzzerOsc.stop();
        buzzerOsc.disconnect();
      } catch (e) {}
      buzzerOsc = null;
      buzzerGain = null;
    }
  }

  // ==================== GOOGLE ASSISTANT PREVENTER ====================
  // Play silent WAV loop & register MediaSession to prevent Google Assistant launching
  function startSilentAudio() {
    if (!silentAudio) {
      silentAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==");
      silentAudio.loop = true;
    }
    silentAudio.play().catch(() => {});

    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing';
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Continuity Probe Active',
        artist: 'ElectroCompanion',
        album: 'Buzzer Hook'
      });

      try {
        navigator.mediaSession.setActionHandler('play', () => {
          isKeyTouch = true;
          updateContinuityState();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          isKeyTouch = false;
          updateContinuityState();
        });
        navigator.mediaSession.setActionHandler('stop', () => {
          isKeyTouch = false;
          updateContinuityState();
        });
      } catch (e) {}
    }
  }

  function stopSilentAudio() {
    if (silentAudio) {
      silentAudio.pause();
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none';
    }
  }

  // ==================== STATE MANAGEMENT ====================

  function updateContinuityState() {
    // Continuity is detected only if the tester is active (ON) and the hook button is shorted/pressed
    const isContinuityDetected = isProbeActive && isKeyTouch;

    // Update Buzzer Sound
    if (isContinuityDetected) {
      setBuzzerVolume(currentVolume);
    } else {
      setBuzzerVolume(0);
    }

    // Update UI Panel
    if (contStatusIndicator && contStatusText && contSubText) {
      if (isContinuityDetected) {
        contStatusIndicator.style.backgroundColor = "var(--accent-green)";
        contStatusIndicator.style.boxShadow = "0 0 12px var(--accent-green-glow)";
        contStatusText.textContent = "CONTINUITY DETECTED (SHORT)";
        contStatusText.style.color = "var(--accent-green)";
        contSubText.textContent = "Probes connected (resistance < 30Ω)";
      } else if (isProbeActive) {
        contStatusIndicator.style.backgroundColor = "var(--accent-blue)";
        contStatusIndicator.style.boxShadow = "0 0 12px var(--accent-blue-glow)";
        contStatusText.textContent = "READY (OPEN)";
        contStatusText.style.color = "var(--accent-blue)";
        contSubText.textContent = "Probes open. Touch them together to test.";
      } else {
        contStatusIndicator.style.backgroundColor = "#64748b";
        contStatusIndicator.style.boxShadow = "none";
        contStatusText.textContent = "TESTER OFF";
        contStatusText.style.color = "var(--text-secondary)";
        contSubText.textContent = "Turn on the switch to begin";
      }
    }

    // Update Skeuomorphic Multimeter LCD
    if (window.currentView === "continuity-view") {
      if (isContinuityDetected) {
        window.updateDmmLcd("0.0", "Ω", "CONTINUITY");
        if (dmmLcd) {
          dmmLcd.classList.remove("backlight-cyan", "backlight-orange", "backlight-green");
          dmmLcd.classList.add("backlight-green");
        }
      } else if (isProbeActive) {
        window.updateDmmLcd("OL", "", "OPEN CIRCUIT");
        if (dmmLcd) {
          dmmLcd.classList.remove("backlight-cyan", "backlight-orange", "backlight-green");
          dmmLcd.classList.add("backlight-cyan");
        }
      } else {
        window.updateDmmLcd("OFF", "", "OFF MODE");
        if (dmmLcd) {
          dmmLcd.classList.remove("backlight-cyan", "backlight-orange", "backlight-green");
        }
      }
    }
  }

  // ==================== PROBE CONTROLLER (START / STOP) ====================

  function startProbe() {
    // Request microphone permission to hold open active audio channel and block system key actions
    navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      micStream = stream;
      isProbeActive = true;
      
      startBuzzer();
      startSilentAudio(); // Media Session hijack
      updateContinuityState();
    })
    .catch(err => {
      console.error("Microphone access denied: ", err);
      alert("Microphone permission is required to initialize the hardware audio session for the continuity tester.");
      if (contPowerToggle) {
        contPowerToggle.checked = false;
      }
      stopProbe();
    });
  }

  function stopProbe() {
    isProbeActive = false;
    isKeyTouch = false;

    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
      micStream = null;
    }

    stopBuzzer();
    stopSilentAudio();
    updateContinuityState();
  }

  // ==================== PUBLIC API ====================

  window.initContinuityTester = function() {
    updateContinuityState();
  };

  window.stopContinuityTester = function() {
    if (contPowerToggle) {
      contPowerToggle.checked = false;
    }
    stopProbe();
  };

  // ==================== INTERACTION HANDLERS ====================

  if (contPowerToggle) {
    contPowerToggle.addEventListener("change", (e) => {
      if (e.target.checked) {
        startProbe();
      } else {
        stopProbe();
      }
    });
  }

  if (contVolume) {
    contVolume.addEventListener("input", (e) => {
      const volPercent = parseInt(e.target.value);
      currentVolume = volPercent / 100;
      if (contVolumeVal) contVolumeVal.textContent = `${volPercent}%`;
      if (isProbeActive) {
        updateContinuityState();
      }
    });
  }
});
