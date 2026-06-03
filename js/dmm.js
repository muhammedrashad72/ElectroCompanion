// js/dmm.js - Core Multimeter and View Controller

document.addEventListener("DOMContentLoaded", () => {
  // Navigation State
  window.currentView = "search-view";

  // DOM Elements - DMM LCD and Sockets
  const dmmMainVal = document.getElementById("dmm-main-val");
  const dmmUnitVal = document.getElementById("dmm-unit-val");
  const dmmSubText = document.getElementById("dmm-sub-text");
  
  // DOM Elements - Sockets
  const socketCom = document.querySelector(".jack-com");
  const socketV = document.querySelector(".jack-v");

  // Shared LCD Update Function
  window.updateDmmLcd = function(mainVal, unitVal, subText) {
    if (dmmMainVal) dmmMainVal.textContent = mainVal || "OL";
    if (dmmUnitVal) dmmUnitVal.textContent = unitVal || "";
    if (dmmSubText) dmmSubText.textContent = subText || "";
  };

  // Shared View Switching Function
  window.switchView = function(viewId) {
    if (window.currentView === "checking-view" && viewId !== "checking-view") {
      if (typeof window.stopSimulation === "function") {
        window.stopSimulation();
      }
    }
    if (window.currentView === "continuity-view" && viewId !== "continuity-view") {
      if (typeof window.stopContinuityTester === "function") {
        window.stopContinuityTester();
      }
    }
    const views = document.querySelectorAll(".view-section");
    views.forEach(view => {
      view.classList.remove("active");
      if (view.id === viewId) {
        view.classList.add("active");
      }
    });
    window.currentView = viewId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // DIAL MODES DEFINITION
  const DIAL_MODES = [
    { angle: -162, view: "rccb-view", name: "RCCB TRIP GUIDE" },
    { angle: -126, view: "welcome-view", name: "OFF MODE" },
    { angle: -90, view: "resistor-view", name: "RESISTOR OHM" },
    { angle: -54, view: "capacitor-view", name: "CAPACITOR FARAD" },
    { angle: -18, view: "inductor-view", name: "INDUCTOR HENRY" },
    { angle: 18, view: "led-view", name: "LED TEST" },
    { angle: 54, view: "laws-view", name: "PHYSICS LAW" },
    { angle: 90, view: "substitutes-view", name: "ALT DIODE/TR" },
    { angle: 126, view: "checking-view", name: "COMP CHECKING" },
    { angle: 162, view: "continuity-view", name: "AUDIO CONT" }
  ];

  // Sound and Haptics
  let audioCtx = null;
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  }

  window.playDmmClickSound = function() {
    try {
      initAudio();
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(1500, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) {
      console.warn("Audio click failed: ", e);
    }
  };

  window.playBeepSound = function() {
    try {
      initAudio();
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(2700, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.16);
    } catch (e) {
      console.warn("Beep failed: ", e);
    }
  };

  window.triggerHapticVibration = function() {
    if (navigator.vibrate) {
      navigator.vibrate(12);
    }
  };

  function switchDmmMode(mode) {
    window.switchView(mode.view);
    
    if (mode.view === "welcome-view") {
      window.updateDmmLcd("OFF", "", "OFF MODE");
    } else if (mode.view === "resistor-view") {
      const activeTab = document.querySelector("#resistor-tools-tabs .tab-btn.active");
      const tool = activeTab ? activeTab.getAttribute("data-tool") : "color-code";
      if (tool === "color-code" && typeof window.calculateResistorFromColors === "function") {
        window.calculateResistorFromColors();
      } else if (tool === "smd-code" && typeof window.decodeSmdCode === "function") {
        window.decodeSmdCode();
      } else if (tool === "combinations" && typeof window.calculateCombinations === "function") {
        window.calculateCombinations();
      }
    } else if (mode.view === "capacitor-view") {
      if (typeof window.decodeCapacitor === "function") {
        window.decodeCapacitor();
      }
    } else if (mode.view === "inductor-view") {
      if (typeof window.calculateInductanceFromColors === "function") {
        window.calculateInductanceFromColors();
      }
    } else if (mode.view === "led-view") {
      if (typeof window.calculateLedResistor === "function") {
        window.calculateLedResistor();
      }
    } else if (mode.view === "laws-view") {
      window.updateDmmLcd("LAw", "", "PHYSICS SOLVER");
    } else if (mode.view === "substitutes-view") {
      window.updateDmmLcd("Sub", "", "COMP SUBSTITUTES");
    } else if (mode.view === "checking-view") {
      window.updateDmmLcd("tESt", "", "COMPONENT CHECK");
      if (typeof window.initCheckingView === "function") {
        window.initCheckingView();
      }
      const checkingCompSelect = document.getElementById("checking-comp-select");
      if (checkingCompSelect) {
        const compName = checkingCompSelect.value;
        const comp = COMPONENT_DB.find(c => c.name === compName);
        if (comp && typeof window.updateSelectedCheckingComponent === "function") {
          window.updateSelectedCheckingComponent(comp);
        }
      }
    } else if (mode.view === "rccb-view") {
      window.updateDmmLcd("trIP", "", "RCCB TRIP GUIDE");
      if (typeof window.initRccbGuide === "function") {
        window.initRccbGuide();
      }
    } else if (mode.view === "continuity-view") {
      window.updateDmmLcd("CoNt", "", "AUDIO CONTINUITY");
      if (typeof window.initContinuityTester === "function") {
        window.initContinuityTester();
      }
    }
  }

  // DIAL SELECTOR INTERACTION
  let isDraggingKnob = false;
  let currentKnobAngle = -120; // Starts at OFF
  const dmmKnob = document.getElementById("dmm-knob");

  function getAngle(x, y, cx, cy) {
    const dx = x - cx;
    const dy = y - cy;
    let angleRad = Math.atan2(dy, dx);
    let angleDeg = angleRad * (180 / Math.PI) + 90; // offset so 12 o'clock is 0
    
    if (angleDeg > 180) angleDeg -= 360;
    if (angleDeg < -180) angleDeg += 360;
    return angleDeg;
  }

  function rotateDial(angle) {
    if (dmmKnob) {
      dmmKnob.style.transform = `rotate(${angle}deg)`;
    }
    
    // Update active labels
    document.querySelectorAll(".dial-label").forEach(lbl => {
      const lblAngle = parseInt(lbl.getAttribute("data-angle"));
      if (lblAngle === angle) {
        lbl.classList.add("active");
      } else {
        lbl.classList.remove("active");
      }
    });
  }

  function handleDialDrag(clientX, clientY) {
    if (!dmmKnob) return;
    const rect = dmmKnob.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    
    let angle = getAngle(clientX, clientY, cx, cy);
    
    // The dial ranges symmetrically from -162 to 162 degrees.
    // The "forbidden zone" at the bottom is from -180 to -162 and 162 to 180.
    if (Math.abs(angle) > 162) {
      angle = angle > 0 ? 162 : -162;
    }
    
    let closestMode = DIAL_MODES[0];
    let minDiff = Infinity;
    
    DIAL_MODES.forEach(mode => {
      let diff = Math.abs(angle - mode.angle);
      if (diff > 180) diff = 360 - diff; // circular difference
      if (diff < minDiff) {
        minDiff = diff;
        closestMode = mode;
      }
    });
    
    if (currentKnobAngle !== closestMode.angle) {
      currentKnobAngle = closestMode.angle;
      rotateDial(closestMode.angle);
      switchDmmMode(closestMode);
      window.playDmmClickSound();
      window.triggerHapticVibration();
    }
  }

  if (dmmKnob) {
    dmmKnob.addEventListener("contextmenu", (e) => e.preventDefault());

    const onStartDrag = (e) => {
      isDraggingKnob = true;
      initAudio();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      handleDialDrag(clientX, clientY);
      e.preventDefault();
    };

    const onDragMove = (e) => {
      if (!isDraggingKnob) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      handleDialDrag(clientX, clientY);
    };

    const onEndDrag = () => {
      isDraggingKnob = false;
    };

    dmmKnob.addEventListener("mousedown", onStartDrag);
    dmmKnob.addEventListener("touchstart", onStartDrag, { passive: false });

    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("touchmove", onDragMove, { passive: false });

    window.addEventListener("mouseup", onEndDrag);
    window.addEventListener("touchend", onEndDrag);
  }

  // Click labels directly
  document.querySelectorAll(".dial-label").forEach(lbl => {
    lbl.addEventListener("click", () => {
      initAudio();
      const angle = parseInt(lbl.getAttribute("data-angle"));
      const mode = DIAL_MODES.find(m => m.angle === angle);
      if (mode) {
        currentKnobAngle = angle;
        rotateDial(angle);
        switchDmmMode(mode);
        window.playDmmClickSound();
        window.triggerHapticVibration();
      }
    });
  });

  // Physical press buttons
  const btnDbSearch = document.getElementById("btn-db-search");
  if (btnDbSearch) {
    btnDbSearch.addEventListener("click", () => {
      initAudio();
      window.playDmmClickSound();
      window.triggerHapticVibration();
      window.switchView("search-view");
      window.updateDmmLcd("LooK", "Up", "DB SEARCH MODE");
    });
  }

  const btnBacklight = document.getElementById("btn-backlight");
  const dmmLcd = document.getElementById("dmm-lcd");
  const backlightClasses = ["backlight-cyan", "backlight-orange", "backlight-green"];
  let activeBacklightIdx = 0;

  if (btnBacklight && dmmLcd) {
    btnBacklight.addEventListener("click", () => {
      initAudio();
      window.playDmmClickSound();
      window.triggerHapticVibration();
      dmmLcd.classList.remove(...backlightClasses);
      activeBacklightIdx = (activeBacklightIdx + 1) % backlightClasses.length;
      dmmLcd.classList.add(backlightClasses[activeBacklightIdx]);
    });
  }

  // Set initial state
  setTimeout(() => {
    rotateDial(-126);
    window.updateDmmLcd("OFF", "", "OFF MODE");
  }, 10);
});
