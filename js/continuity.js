// js/continuity.js - Audio Jack Continuity Tester Controller

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements - Controls
  const btnStartProbe = document.getElementById("btn-start-probe");
  const btnStopProbe = document.getElementById("btn-stop-probe");
  const btnSimTouch = document.getElementById("btn-sim-touch");
  const btnCalibrateProbe = document.getElementById("btn-calibrate-probe");

  const contStatusIndicator = document.getElementById("cont-status-indicator");
  const contStatusText = document.getElementById("cont-status-text");
  const contSubText = document.getElementById("cont-sub-text");
  const contCableStatus = document.getElementById("cont-cable-status");

  const contLevelBar = document.getElementById("cont-level-bar");
  const contLevelPercent = document.getElementById("cont-level-percent");
  const contOscilloscope = document.getElementById("cont-oscilloscope");

  const contThreshold = document.getElementById("cont-threshold");
  const contThresholdVal = document.getElementById("cont-threshold-val");
  const contVolume = document.getElementById("cont-volume");
  const contVolumeVal = document.getElementById("cont-volume-val");

  // SVG Probes for Animation
  const guideBlackProbe = document.getElementById("guide-black-probe");
  const guideRedProbe = document.getElementById("guide-red-probe");

  // Web Audio Variables
  let audioCtx = null;
  let micStream = null;
  let micSource = null;
  let analyser = null;
  let animationFrameId = null;

  // Buzzer Audio Variables
  let buzzerOsc = null;
  let buzzerGain = null;

  // Silent Background Audio for MediaSession takeover
  let silentAudio = null;

  // State Variables
  let isProbeActive = false;
  let isSimTouch = false;
  let isKeyTouch = false;
  let isCalibrating = false;
  let currentVolume = 0.5; // Default 50%
  let silenceThreshold = 0.0015; // Lower default threshold for wire shorting
  
  // Cable Connection Status
  let isCableInserted = false;
  let hasWiredHardware = false;
  
  // History for Acoustic Variance Analysis
  const rmsHistory = [];
  const HISTORY_SIZE = 20;

  // DMM LCD reference
  const dmmLcd = document.getElementById("dmm-lcd");

  // ==================== KEY INTERCEPTION & BLOCKING ====================
  // Intercept volume and media buttons globally when continuity screen is active
  const blockKeys = (e) => {
    if (window.currentView !== "continuity-view") return;

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

  // ==================== WIRING GUIDE ANIMATION ====================

  function animateProbes(touch) {
    if (!guideBlackProbe || !guideRedProbe) return;

    if (touch) {
      guideBlackProbe.setAttribute("transform", "translate(210, 130) rotate(-15)");
      guideRedProbe.setAttribute("transform", "translate(210, 135) rotate(15)");
    } else {
      guideBlackProbe.setAttribute("transform", "translate(230, 115)");
      guideRedProbe.setAttribute("transform", "translate(230, 150)");
    }
  }

  // ==================== CABLE DETECTION LOGIC ====================

  function addRmsToHistory(rms) {
    rmsHistory.push(rms);
    if (rmsHistory.length > HISTORY_SIZE) {
      rmsHistory.shift();
    }
  }

  function getRmsVariance() {
    if (rmsHistory.length < HISTORY_SIZE) return 1.0; // Assume built-in mic if not loaded
    const mean = rmsHistory.reduce((a, b) => a + b, 0) / rmsHistory.length;
    const sqDiffs = rmsHistory.map(v => (v - mean) ** 2);
    const variance = sqDiffs.reduce((a, b) => a + b, 0) / rmsHistory.length;
    return Math.sqrt(variance); // Standard Deviation
  }

  function updateCableStatus() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      evaluateCableInsertion();
      return;
    }

    navigator.mediaDevices.enumerateDevices().then(devices => {
      const inputs = devices.filter(d => d.kind === 'audioinput');
      hasWiredHardware = inputs.some(d => {
        const label = d.label.toLowerCase();
        return label.includes('headset') || 
               label.includes('wired') || 
               label.includes('external') || 
               label.includes('line') || 
               label.includes('jack');
      });

      if (micStream) {
        const activeTrack = micStream.getAudioTracks()[0];
        const trackLabel = activeTrack ? activeTrack.label.toLowerCase() : '';
        if (trackLabel.includes('headset') || 
            trackLabel.includes('wired') || 
            trackLabel.includes('external') || 
            trackLabel.includes('line') || 
            trackLabel.includes('jack')) {
          hasWiredHardware = true;
        }
      }

      evaluateCableInsertion();
    }).catch(err => {
      console.warn("Device enumeration failed, relying on acoustic check:", err);
      evaluateCableInsertion();
    });
  }

  function evaluateCableInsertion() {
    if (hasWiredHardware) {
      isCableInserted = true;
    } else if (isProbeActive && rmsHistory.length >= HISTORY_SIZE) {
      // Analyze standard deviation of RMS level (acoustic variance)
      const stdDev = getRmsVariance();
      const currentRms = currentMicLevel();
      
      // If the browser is in a test environment with a flat silent dummy microphone (currentRms == 0, stdDev == 0)
      // and hasWiredHardware is false, we treat it as disconnected.
      if (currentRms < 0.00001 && stdDev < 0.00001) {
        isCableInserted = false;
      } else {
        // An open wire cable or absolute short will have a flat signal level (stdDev < 0.00012)
        // A built-in microphone has active fluctuations from room noise (stdDev > 0.00012)
        isCableInserted = (stdDev < 0.00012);
      }
    } else {
      isCableInserted = false;
    }

    if (contCableStatus) {
      if (isCableInserted) {
        contCableStatus.textContent = "⚡ CABLE DETECTED (Wire Probe Active)";
        contCableStatus.style.color = "var(--accent-green)";
      } else {
        contCableStatus.textContent = "⚠️ CABLE DISCONNECTED (Internal Mic Active)";
        contCableStatus.style.color = "var(--accent-amber)";
      }
    }
  }

  // Listen to device change (cable plugged in / out)
  if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
    navigator.mediaDevices.addEventListener("devicechange", () => {
      updateCableStatus();
      // If mic is running, restart to pick up the new device automatically
      if (isProbeActive) {
        restartMicProbe();
      }
    });
  }

  // ==================== STATE MANAGEMENT ====================

  function updateContinuityState() {
    // Continuity is detected ONLY if:
    // 1. We are simulating a touch via button, OR
    // 2. We got a key event (headset hook / volume key short), OR
    // 3. Audio stream is active, cable is verified plugged in, AND the mic level is below the short threshold.
    const isContinuityDetected = isSimTouch || isKeyTouch || 
      (isProbeActive && isCableInserted && currentMicLevel() < silenceThreshold);

    // Update Buzzer
    if (isContinuityDetected) {
      setBuzzerVolume(currentVolume);
    } else {
      setBuzzerVolume(0);
    }

    // Update View Status
    if (contStatusIndicator && contStatusText && contSubText) {
      if (isContinuityDetected) {
        contStatusIndicator.style.backgroundColor = "var(--accent-green)";
        contStatusIndicator.style.boxShadow = "0 0 12px var(--accent-green-glow)";
        contStatusText.textContent = "CONTINUITY DETECTED (SHORT)";
        contStatusText.style.color = "var(--accent-green)";
        contSubText.textContent = "Probes connected (resistance < 30Ω)";
      } else if (isProbeActive) {
        if (isCableInserted) {
          contStatusIndicator.style.backgroundColor = "var(--accent-blue)";
          contStatusIndicator.style.boxShadow = "0 0 12px var(--accent-blue-glow)";
          contStatusText.textContent = "PROBE READY (OPEN)";
          contStatusText.style.color = "var(--accent-blue)";
          contSubText.textContent = "Touch probes to check continuity";
        } else {
          contStatusIndicator.style.backgroundColor = "var(--accent-amber)";
          contStatusIndicator.style.boxShadow = "0 0 12px var(--accent-amber-glow)";
          contStatusText.textContent = "CABLE UNPLUGGED";
          contStatusText.style.color = "var(--accent-amber)";
          contSubText.textContent = "Please plug in wire probe cable";
        }
      } else {
        contStatusIndicator.style.backgroundColor = "#64748b";
        contStatusIndicator.style.boxShadow = "none";
        contStatusText.textContent = "TESTER INACTIVE";
        contStatusText.style.color = "var(--text-secondary)";
        contSubText.textContent = "Enable microphone probe or simulate touch";
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
      } else if (isProbeActive && !isCableInserted) {
        window.updateDmmLcd("Plug", "In", "CABLE REQ");
        if (dmmLcd) {
          dmmLcd.classList.remove("backlight-cyan", "backlight-orange", "backlight-green");
          dmmLcd.classList.add("backlight-orange");
        }
      } else {
        window.updateDmmLcd("OL", "", "OPEN CIRCUIT");
        if (dmmLcd) {
          dmmLcd.classList.remove("backlight-cyan", "backlight-orange", "backlight-green");
          dmmLcd.classList.add("backlight-cyan");
        }
      }
    }

    animateProbes(isContinuityDetected);
  }

  let lastCalculatedRms = 1.0;
  function currentMicLevel() {
    return lastCalculatedRms;
  }

  // ==================== AUDIO PROCESSING ====================

  function startMicMonitoring(stream) {
    initAudioContext();
    if (!audioCtx) return;

    micStream = stream;
    micSource = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    micSource.connect(analyser);

    const canvas = contOscilloscope;
    const canvasCtx = canvas ? canvas.getContext("2d") : null;

    function drawWave() {
      if (!isProbeActive) return;

      animationFrameId = requestAnimationFrame(drawWave);
      analyser.getByteTimeDomainData(dataArray);

      // Draw Oscilloscope Wave
      if (canvas && canvasCtx) {
        const width = canvas.width;
        const height = canvas.height;
        canvasCtx.fillStyle = "#0f172a";
        canvasCtx.fillRect(0, 0, width, height);

        canvasCtx.strokeStyle = "rgba(255, 255, 255, 0.03)";
        canvasCtx.lineWidth = 1;
        canvasCtx.beginPath();
        canvasCtx.moveTo(0, height / 2);
        canvasCtx.lineTo(width, height / 2);
        canvasCtx.moveTo(width / 2, 0);
        canvasCtx.lineTo(width / 2, height);
        canvasCtx.stroke();

        canvasCtx.strokeStyle = isProbeActive ? (isCableInserted ? "var(--accent-cyan)" : "var(--accent-amber)") : "#64748b";
        canvasCtx.lineWidth = 2;
        canvasCtx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = v * (height / 2);

          if (i === 0) {
            canvasCtx.moveTo(x, y);
          } else {
            canvasCtx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        canvasCtx.lineTo(width, height / 2);
        canvasCtx.stroke();
      }

      // Calculate RMS Level
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const val = (dataArray[i] - 128) / 128;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / bufferLength);
      lastCalculatedRms = rms;
      
      addRmsToHistory(rms);

      // Dynamically re-evaluate insertion & check key touches
      evaluateCableInsertion();

      // Update Visual Meter (Normalized scale)
      const percent = Math.min(100, Math.round(rms * 900));
      if (contLevelBar) contLevelBar.style.width = `${percent}%`;
      if (contLevelPercent) contLevelPercent.textContent = `${percent}%`;

      updateContinuityState();
    }

    drawWave();
    updateCableStatus();
  }

  function restartMicProbe() {
    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
    }
    navigator.mediaDevices.getUserMedia({ 
      audio: { 
        echoCancellation: false, 
        noiseSuppression: false, 
        autoGainControl: false 
      } 
    })
    .then(stream => {
      startMicMonitoring(stream);
    })
    .catch(err => {
      console.warn("Microphone restart failed:", err);
    });
  }

  // ==================== CALIBRATION ====================

  function calibrateNoiseFloor() {
    if (!isProbeActive || !analyser || isCalibrating) return;

    isCalibrating = true;
    if (btnCalibrateProbe) {
      btnCalibrateProbe.textContent = "Calibrating...";
      btnCalibrateProbe.style.borderColor = "var(--accent-amber-glow)";
      btnCalibrateProbe.style.color = "var(--accent-amber)";
    }

    const readings = [];
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const intervalId = setInterval(() => {
      analyser.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const val = (dataArray[i] - 128) / 128;
        sum += val * val;
      }
      readings.push(Math.sqrt(sum / bufferLength));
    }, 50);

    setTimeout(() => {
      clearInterval(intervalId);
      
      const averageNoise = readings.reduce((a, b) => a + b, 0) / readings.length;
      // Set the shorting threshold to 25% of the calibrated open-circuit noise floor
      silenceThreshold = Math.max(0.0004, averageNoise * 0.25);

      if (contThreshold) {
        contThreshold.value = silenceThreshold;
        if (contThresholdVal) contThresholdVal.textContent = silenceThreshold.toFixed(4);
      }

      isCalibrating = false;
      if (btnCalibrateProbe) {
        btnCalibrateProbe.textContent = "⚙️ Recalibrate";
        btnCalibrateProbe.style.borderColor = "";
        btnCalibrateProbe.style.color = "";
      }
      updateContinuityState();
    }, 1000);
  }

  // ==================== PUBLIC API ====================

  window.initContinuityTester = function() {
    startBuzzer();
    updateContinuityState();
  };

  window.stopContinuityTester = function() {
    isSimTouch = false;
    isKeyTouch = false;
    if (btnSimTouch) {
      btnSimTouch.textContent = "⚡ Simulate Touch";
      btnSimTouch.style.background = "";
      btnSimTouch.style.borderColor = "";
      btnSimTouch.style.color = "";
    }
    
    if (isProbeActive) {
      stopMicProbe();
    }
    
    stopBuzzer();
    stopSilentAudio();
    updateContinuityState();
  };

  function stopMicProbe() {
    isProbeActive = false;
    
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
      micStream = null;
    }

    if (micSource) {
      micSource.disconnect();
      micSource = null;
    }

    stopSilentAudio();

    if (btnStartProbe) btnStartProbe.style.display = "inline-block";
    if (btnStopProbe) btnStopProbe.style.display = "none";
    if (btnCalibrateProbe) btnCalibrateProbe.disabled = true;

    if (contLevelBar) contLevelBar.style.width = "0%";
    if (contLevelPercent) contLevelPercent.textContent = "0%";

    // Clear oscilloscope canvas
    const canvas = contOscilloscope;
    if (canvas) {
      const canvasCtx = canvas.getContext("2d");
      canvasCtx.fillStyle = "#0f172a";
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    }

    isCableInserted = false;
    rmsHistory.length = 0;
    updateCableStatus();
    updateContinuityState();
  }

  // ==================== INTERACTION HANDLERS ====================

  if (btnStartProbe) {
    btnStartProbe.addEventListener("click", () => {
      navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: false, 
          noiseSuppression: false, 
          autoGainControl: false 
        } 
      })
      .then(stream => {
        isProbeActive = true;
        btnStartProbe.style.display = "none";
        if (btnStopProbe) btnStopProbe.style.display = "inline-block";
        if (btnCalibrateProbe) btnCalibrateProbe.disabled = false;
        
        startMicMonitoring(stream);
        startSilentAudio(); // Takeover MediaSession
        
        // Brief delay before calibration to populate RMS history
        setTimeout(() => {
          calibrateNoiseFloor();
        }, 300);
      })
      .catch(err => {
        console.error("Microphone access denied: ", err);
        alert("Microphone permission denied! You can still test using the physical Headset Volume/Hook Buttons or the 'Simulate Touch' button.");
      });
    });
  }

  if (btnStopProbe) {
    btnStopProbe.addEventListener("click", stopMicProbe);
  }

  if (btnSimTouch) {
    btnSimTouch.addEventListener("click", () => {
      isSimTouch = !isSimTouch;
      if (isSimTouch) {
        btnSimTouch.textContent = "⚡ Release Touch";
        btnSimTouch.style.background = "var(--accent-amber)";
        btnSimTouch.style.borderColor = "var(--accent-amber-glow)";
        btnSimTouch.style.color = "#000";
      } else {
        btnSimTouch.textContent = "⚡ Simulate Touch";
        btnSimTouch.style.background = "";
        btnSimTouch.style.borderColor = "";
        btnSimTouch.style.color = "";
      }
      updateContinuityState();
    });
  }

  if (btnCalibrateProbe) {
    btnCalibrateProbe.addEventListener("click", calibrateNoiseFloor);
  }

  if (contThreshold) {
    contThreshold.addEventListener("input", (e) => {
      silenceThreshold = parseFloat(e.target.value);
      if (contThresholdVal) contThresholdVal.textContent = silenceThreshold.toFixed(4);
      updateContinuityState();
    });
  }

  if (contVolume) {
    contVolume.addEventListener("input", (e) => {
      const volPercent = parseInt(e.target.value);
      currentVolume = volPercent / 100;
      if (contVolumeVal) contVolumeVal.textContent = `${volPercent}%`;
      updateContinuityState();
    });
  }
});
