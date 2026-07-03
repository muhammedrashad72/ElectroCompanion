// js/continuity.js - Simplified Audio Jack Continuity Tester Controller (Button-Based Toggle)

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const contPowerToggle = document.getElementById("cont-power-toggle");
  const contStatusIndicator = document.getElementById("cont-status-indicator");
  const contStatusText = document.getElementById("cont-status-text");
  const contSubText = document.getElementById("cont-sub-text");
  const contVolume = document.getElementById("cont-volume");
  const contVolumeVal = document.getElementById("cont-volume-val");

  // Hardware Audio Sessions (HTML5 elements, no Web Audio API)
  let micStream = null;
  let buzzerAudio = null;
  let silentAudio = null;

  // State Variables
  let isProbeActive = false;
  let isShort = false; // Latching toggle state
  let currentVolume = 0.5; // Default 50%

  // DMM LCD reference
  const dmmLcd = document.getElementById("dmm-lcd");

  // ==================== PCM WAV GENERATOR (NO WEB AUDIO) ====================
  // Generates a pure sine wave WAV file in memory and returns a Blob URL
  function generateBeepWavUrl(frequency, duration) {
    const sampleRate = 8000;
    const numSamples = sampleRate * duration;
    const buffer = new Uint8Array(44 + numSamples);
    
    // Write RIFF WAV Header
    buffer[0] = 0x52; buffer[1] = 0x49; buffer[2] = 0x46; buffer[3] = 0x46; // "RIFF"
    const fileSize = 36 + numSamples;
    buffer[4] = fileSize & 0xff;
    buffer[5] = (fileSize >> 8) & 0xff;
    buffer[6] = (fileSize >> 16) & 0xff;
    buffer[7] = (fileSize >> 24) & 0xff;
    buffer[8] = 0x57; buffer[9] = 0x41; buffer[10] = 0x56; buffer[11] = 0x45; // "WAVE"
    buffer[12] = 0x66; buffer[13] = 0x6d; buffer[14] = 0x74; buffer[15] = 0x20; // "fmt "
    buffer[16] = 16; buffer[17] = 0; buffer[18] = 0; buffer[19] = 0; // Chunk size (16)
    buffer[20] = 1; buffer[21] = 0; // PCM format
    buffer[22] = 1; buffer[23] = 0; // Mono channel
    buffer[24] = sampleRate & 0xff;
    buffer[25] = (sampleRate >> 8) & 0xff;
    buffer[26] = (sampleRate >> 16) & 0xff;
    buffer[27] = (sampleRate >> 24) & 0xff; // Sample rate
    buffer[28] = sampleRate & 0xff;
    buffer[29] = (sampleRate >> 8) & 0xff;
    buffer[30] = (sampleRate >> 16) & 0xff;
    buffer[31] = (sampleRate >> 24) & 0xff; // Byte rate
    buffer[32] = 1; buffer[33] = 0; // Block align
    buffer[34] = 8; buffer[35] = 0; // 8-bit depth
    buffer[36] = 0x64; buffer[37] = 0x61; buffer[38] = 0x74; buffer[39] = 0x61; // "data"
    buffer[40] = numSamples & 0xff;
    buffer[41] = (numSamples >> 8) & 0xff;
    buffer[42] = (numSamples >> 16) & 0xff;
    buffer[43] = (numSamples >> 24) & 0xff; // Data size
    
    // Fill sine wave samples
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const sample = Math.round(128 + 127 * Math.sin(2 * Math.PI * frequency * t));
      buffer[44 + i] = sample;
    }
    
    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }

  function initBuzzerAudio() {
    if (!buzzerAudio) {
      const wavUrl = generateBeepWavUrl(2500, 1.0); // 2500Hz, 1 second loop length
      buzzerAudio = new Audio(wavUrl);
      buzzerAudio.loop = true;
    }
  }

  // ==================== SPEAKER AUDIO ROUTING ====================
  // Routes HTML5 Audio output to the built-in speaker, bypassing the physical headphone plug output
  function routeAudioToSpeaker() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;

    navigator.mediaDevices.enumerateDevices().then(devices => {
      const outputs = devices.filter(d => d.kind === 'audiooutput');
      const speaker = outputs.find(d => {
        const label = d.label.toLowerCase();
        return label.includes('speaker') || 
               label.includes('loudspeaker') || 
               label.includes('built-in speaker') || 
               label.includes('speakerphone') || 
               label.includes('internal');
      });

      const targetDeviceId = speaker ? speaker.deviceId : (outputs[0] ? outputs[0].deviceId : null);

      if (targetDeviceId) {
        if (buzzerAudio && typeof buzzerAudio.setSinkId === 'function') {
          buzzerAudio.setSinkId(targetDeviceId).catch(() => {});
        }
        if (silentAudio && typeof silentAudio.setSinkId === 'function') {
          silentAudio.setSinkId(targetDeviceId).catch(() => {});
        }
      }
    });
  }

  // ==================== LATCHING STATE TOGGLE ====================
  // Toggles the short circuit state and buzzer on hardware tap events
  function handleHardwareTrigger() {
    if (!isProbeActive) return;
    
    isShort = !isShort;
    updateContinuityState();
  }

  // ==================== KEY INTERCEPTION & BLOCKING ====================
  // Intercept volume, assistant, and media buttons globally to block default OS actions
  const blockKeys = (e) => {
    if (window.currentView !== "continuity-view" || !isProbeActive) return;

    const keysToBlock = [
      'VolumeUp', 'VolumeDown', 
      'AudioVolumeUp', 'AudioVolumeDown',
      'MediaPlayPause', 'MediaPlay', 'MediaPause', 'MediaStop',
      'HeadsetHook', 'Search', 'VoiceCommand', 'VoiceAssist'
    ];
    const keyCodesToBlock = [24, 25, 79, 84, 174, 175, 179, 220, 221, 231];

    if (keysToBlock.includes(e.key) || keyCodesToBlock.includes(e.keyCode)) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      // Trigger toggle ONLY on keydown
      if (e.type === 'keydown') {
        handleHardwareTrigger();
      }
    }
  };

  window.addEventListener('keydown', blockKeys, { capture: true, passive: false });
  window.addEventListener('keyup', blockKeys, { capture: true, passive: false });
  window.addEventListener('keypress', blockKeys, { capture: true, passive: false });

  // Re-route audio on device insertion/removal
  if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
    navigator.mediaDevices.addEventListener("devicechange", () => {
      if (isProbeActive) {
        setTimeout(routeAudioToSpeaker, 300);
      }
    });
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
        // Toggle on play/pause actions (headset prongs touch)
        navigator.mediaSession.setActionHandler('play', () => {
          handleHardwareTrigger();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          handleHardwareTrigger();
        });
        navigator.mediaSession.setActionHandler('stop', () => {
          isShort = false;
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
    // Update Buzzer Sound
    if (isProbeActive && isShort) {
      initBuzzerAudio();
      if (buzzerAudio) {
        buzzerAudio.volume = currentVolume;
        buzzerAudio.play().catch(() => {});
      }
    } else {
      if (buzzerAudio) {
        buzzerAudio.pause();
        buzzerAudio.currentTime = 0;
      }
    }

    // Update UI Panel
    if (contStatusIndicator && contStatusText && contSubText) {
      if (isProbeActive && isShort) {
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
      if (isProbeActive && isShort) {
        window.updateDmmLcd("PASS", "", "CONTINUITY");
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
      isShort = false;
      
      initBuzzerAudio();
      startSilentAudio(); // Media Session hijack
      
      // Delay speaker routing slightly to ensure outputs are populated
      setTimeout(routeAudioToSpeaker, 200);
      
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
    isShort = false;

    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
      micStream = null;
    }

    if (buzzerAudio) {
      buzzerAudio.pause();
      buzzerAudio.currentTime = 0;
    }
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
      setBuzzerVolume(currentVolume);
    });
  }
});
