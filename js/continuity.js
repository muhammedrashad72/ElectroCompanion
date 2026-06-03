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

  // State Variables
  let isProbeActive = false;
  let isSimTouch = false;
  let isKeyTouch = false;
  let isCalibrating = false;
  let currentVolume = 0.5; // Default 50%
  let silenceThreshold = 0.003; // Default threshold

  // DMM LCD reference
  const dmmLcd = document.getElementById("dmm-lcd");

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

  // ==================== WIRING GUIDE ANIMATION ====================

  function animateProbes(touch) {
    if (!guideBlackProbe || !guideRedProbe) return;

    if (touch) {
      // Shift probe tips together
      guideBlackProbe.setAttribute("transform", "translate(210, 130) rotate(-15)");
      guideRedProbe.setAttribute("transform", "translate(210, 135) rotate(15)");
    } else {
      // Reset position
      guideBlackProbe.setAttribute("transform", "translate(230, 115)");
      guideRedProbe.setAttribute("transform", "translate(230, 150)");
    }
  }

  // ==================== STATE MANAGEMENT ====================

  function updateContinuityState() {
    const isContinuityDetected = isSimTouch || isKeyTouch || (isProbeActive && currentMicLevel() < silenceThreshold);

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
        contStatusText.textContent = "CONTINUITY DETECTED";
        contStatusText.style.color = "var(--accent-green)";
        contSubText.textContent = "Probes connected (resistance < 30Ω)";
      } else if (isProbeActive) {
        contStatusIndicator.style.backgroundColor = "var(--accent-blue)";
        contStatusIndicator.style.boxShadow = "0 0 12px var(--accent-blue-glow)";
        contStatusText.textContent = "PROBE LISTENING";
        contStatusText.style.color = "var(--accent-blue)";
        contSubText.textContent = "Touch probes to verify continuity";
      } else {
        contStatusIndicator.style.backgroundColor = "#64748b";
        contStatusIndicator.style.boxShadow = "none";
        contStatusText.textContent = "TESTER INACTIVE";
        contStatusText.style.color = "var(--text-secondary)";
        contSubText.textContent = "Enable microphone probe or simulate touch";
      }
    }

    // Update Skeuomorphic Multimeter LCD (if currently viewing the tester)
    if (window.currentView === "continuity-view") {
      if (isContinuityDetected) {
        window.updateDmmLcd("0.0", "Ω", "CONTINUITY");
        if (dmmLcd) {
          dmmLcd.classList.remove("backlight-cyan", "backlight-orange", "backlight-green");
          dmmLcd.classList.add("backlight-green");
        }
      } else {
        window.updateDmmLcd("OL", "", "OPEN CIRCUIT");
        if (dmmLcd) {
          dmmLcd.classList.remove("backlight-cyan", "backlight-orange", "backlight-green");
          dmmLcd.classList.add("backlight-cyan");
        }
      }
    }

    // Animate the wiring guide SVG probes
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
    
    // Fast analysis
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

      // Draw Oscilloscope
      if (canvas && canvasCtx) {
        const width = canvas.width;
        const height = canvas.height;
        canvasCtx.fillStyle = "#0f172a"; // Match slate-900 background
        canvasCtx.fillRect(0, 0, width, height);

        // Grid lines
        canvasCtx.strokeStyle = "rgba(255, 255, 255, 0.03)";
        canvasCtx.lineWidth = 1;
        canvasCtx.beginPath();
        canvasCtx.moveTo(0, height / 2);
        canvasCtx.lineTo(width, height / 2);
        canvasCtx.moveTo(width / 2, 0);
        canvasCtx.lineTo(width / 2, height);
        canvasCtx.stroke();

        // Waveform
        canvasCtx.strokeStyle = isProbeActive ? "var(--accent-cyan)" : "#64748b";
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

      // Update Visual Meter (Normalize so low signals fill nicely)
      const percent = Math.min(100, Math.round(rms * 800));
      if (contLevelBar) contLevelBar.style.width = `${percent}%`;
      if (contLevelPercent) contLevelPercent.textContent = `${percent}%`;

      // Update Beep Trigger based on noise level
      updateContinuityState();
    }

    drawWave();
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

    // Collect data for 1 second
    setTimeout(() => {
      clearInterval(intervalId);
      
      const averageNoise = readings.reduce((a, b) => a + b, 0) / readings.length;
      // Set threshold to 35% of the average noise floor
      silenceThreshold = Math.max(0.001, averageNoise * 0.35);

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
    
    // Stop microphone processing
    if (isProbeActive) {
      stopMicProbe();
    }
    
    stopBuzzer();
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
        calibrateNoiseFloor(); // Auto calibrate on start
      })
      .catch(err => {
        console.error("Microphone access denied: ", err);
        alert("Microphone permission denied! You can still test the buzzer using the physical Headset Hook (Media Button) or the 'Simulate Touch' button.");
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

  // ==================== HEADSET BUTTON EVENT CAPTURE ====================

  window.addEventListener("keydown", (e) => {
    if (window.currentView === "continuity-view") {
      // Key codes for MediaPlayPause / HeadsetHook (common is 179)
      if (e.key === "MediaPlayPause" || e.key === "HeadsetHook" || e.keyCode === 179) {
        e.preventDefault();
        isKeyTouch = true;
        updateContinuityState();
      }
    }
  });

  window.addEventListener("keyup", (e) => {
    if (window.currentView === "continuity-view") {
      if (e.key === "MediaPlayPause" || e.key === "HeadsetHook" || e.keyCode === 179) {
        e.preventDefault();
        isKeyTouch = false;
        updateContinuityState();
      }
    }
  });

  // MediaSession Action Handlers for background/headset event trapping
  if ("mediaSession" in navigator) {
    try {
      navigator.mediaSession.setActionHandler("play", () => {
        if (window.currentView === "continuity-view") {
          isKeyTouch = true;
          updateContinuityState();
        }
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        if (window.currentView === "continuity-view") {
          isKeyTouch = false;
          updateContinuityState();
        }
      });
    } catch (e) {}
  }
});
