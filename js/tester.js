// js/tester.js - Multimeter Simulation & Component Checker

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements - Checking View Inputs
  const checkingCompSelect = document.getElementById("checking-comp-select");
  const checkingCompName = document.getElementById("checking-comp-name");
  const checkingCompDesc = document.getElementById("checking-comp-desc");

  // DOM Elements - Simulation Controls
  const btnRunSim = document.getElementById("btn-run-simulation");
  const btnPauseSim = document.getElementById("btn-pause-simulation");
  const simStatusLog = document.getElementById("simulation-status-log");
  const modalMultimeterTest = document.getElementById("modal-multimeter-test");

  // Simulation State
  let simulationActive = false;
  let simStates = [];
  let currentSimStateIdx = 0;
  let simIntervalId = null;
  let wireAnimFrameId = null;
  let currentCompInModal = null;

  // Easing coordinates for probes to prevent matrix parsing bugs
  let redProbePos = { x: 80, y: 150 };
  let blackProbePos = { x: 50, y: 150 };
  let redProbeTarget = { x: 80, y: 150 };
  let blackProbeTarget = { x: 50, y: 150 };

  // Shared Simulation API
  window.initSimulation = function(comp) {
    currentCompInModal = comp;
    window.stopSimulation();
    
    // Reset positions immediately on new component load
    redProbePos = { x: 80, y: 150 };
    blackProbePos = { x: 50, y: 150 };
    redProbeTarget = { x: 80, y: 150 };
    blackProbeTarget = { x: 50, y: 150 };
    
    if (btnRunSim) {
      btnRunSim.textContent = "Run Test Simulation";
      btnRunSim.style.color = "var(--accent-green)";
      btnRunSim.style.borderColor = "var(--accent-green-glow)";
    }
    if (btnPauseSim) btnPauseSim.style.display = "none";
    if (simStatusLog) simStatusLog.textContent = 'Ready to test. Click "Run Test Simulation".';
    
    if (modalMultimeterTest) {
      modalMultimeterTest.innerHTML = `
        <svg width="100%" height="100%" viewBox="0 0 400 200" id="probe-sim-svg" style="background:#0f172a; width:100%; height:100%;">
          <defs>
            <pattern id="sim-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.02)" stroke-width="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sim-grid)" />

          <g id="sim-dmm">
            <rect x="15" y="15" width="90" height="155" rx="10" fill="#1e293b" stroke="#eab308" stroke-width="3" />
            <rect x="23" y="23" width="74" height="42" rx="4" fill="#0891b2" id="sim-lcd-screen" style="transition: background 0.3s ease;" />
            <text id="sim-dmm-lcd" x="60" y="52" fill="#020617" font-family="monospace" font-size="18" font-weight="bold" text-anchor="middle">OL</text>
            <text x="60" y="34" fill="#020617" font-family="monospace" font-size="7" font-weight="bold" text-anchor="middle">AUTO DC</text>
            <circle cx="60" cy="100" r="16" fill="#111827" stroke="#4b5563" stroke-width="1.5" />
            <line id="sim-dmm-dial" x1="60" y1="100" x2="60" y2="88" stroke="#ef4444" stroke-width="3" stroke-linecap="round" />
            <circle cx="42" cy="148" r="6" fill="#111827" stroke="#334155" stroke-width="1.5" />
            <circle cx="78" cy="148" r="6" fill="#111827" stroke="#ef4444" stroke-width="1.5" />
          </g>

          <g id="sim-component"></g>

          <path id="sim-black-wire" fill="none" stroke="#111827" stroke-width="3" stroke-linecap="round" />
          <path id="sim-red-wire" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round" />

          <g id="sim-black-probe" transform="translate(50, 150)">
            <path d="M 0 0 L -15 -35" stroke="#374151" stroke-width="6" stroke-linecap="round" />
            <path d="M -15 -35 L -20 -45" stroke="#111827" stroke-width="4" />
            <path d="M 0 0 L 4 10" stroke="#d1d5db" stroke-width="2" stroke-linecap="round" />
            <circle cx="0" cy="0" r="2" fill="#d1d5db" />
          </g>
          
          <g id="sim-red-probe" transform="translate(80, 150)">
            <path d="M 0 0 L -15 -35" stroke="#ef4444" stroke-width="6" stroke-linecap="round" />
            <path d="M -15 -35 L -20 -45" stroke="#b91c1c" stroke-width="4" />
            <path d="M 0 0 L 4 10" stroke="#d1d5db" stroke-width="2" stroke-linecap="round" />
            <circle cx="0" cy="0" r="2" fill="#d1d5db" />
          </g>
        </svg>
      `;
      drawComponentInSim(comp);
      startWireAnimationTick();
    }
  };

  window.stopSimulation = function() {
    simulationActive = false;
    if (simIntervalId) clearInterval(simIntervalId);
    simIntervalId = null;
    
    if (btnRunSim) {
      btnRunSim.textContent = "Run Test Simulation";
      btnRunSim.style.color = "var(--accent-green)";
      btnRunSim.style.borderColor = "var(--accent-green-glow)";
    }
    if (btnPauseSim) btnPauseSim.style.display = "none";
    if (simStatusLog) simStatusLog.textContent = "Simulation stopped.";
    
    // Smooth reset by setting target to default starting positions
    blackProbeTarget = { x: 50, y: 150 };
    redProbeTarget = { x: 80, y: 150 };
  };

  // Shared Checking View initialization API
  let isCheckingViewInitialized = false;
  window.initCheckingView = function() {
    if (isCheckingViewInitialized) return;
    isCheckingViewInitialized = true;

    // Populate dropdown selector with COMPONENT_DB items
    if (checkingCompSelect) {
      checkingCompSelect.innerHTML = COMPONENT_DB.map(comp => 
        `<option value="${comp.name}">${comp.name} - ${comp.category || comp.type}</option>`
      ).join("");

      // Handler when dropdown item changes
      checkingCompSelect.addEventListener("change", (e) => {
        const compName = e.target.value;
        const comp = COMPONENT_DB.find(c => c.name === compName);
        if (comp) {
          window.updateSelectedCheckingComponent(comp);
        }
      });
      
      // Select the first component initially
      if (COMPONENT_DB.length > 0) {
        window.updateSelectedCheckingComponent(COMPONENT_DB[0]);
      }
    }
  };

  window.updateSelectedCheckingComponent = function(comp) {
    if (checkingCompName) checkingCompName.textContent = comp.name;
    if (checkingCompDesc) checkingCompDesc.textContent = comp.description;
    
    // Initialize simulation for the new component
    window.initSimulation(comp);
  };

  function updateWires(rx, ry, bx, by) {
    const redWire = document.getElementById("sim-red-wire");
    const blackWire = document.getElementById("sim-black-wire");
    if (redWire) {
      const sx = 78, sy = 148;
      const ex = rx - 15, ey = ry - 35;
      const cx = (sx + ex) / 2;
      const cy = Math.max(sy, ey) + 50;
      redWire.setAttribute("d", `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`);
    }
    if (blackWire) {
      const sx = 42, sy = 148;
      const ex = bx - 15, ey = by - 35;
      const cx = (sx + ex) / 2;
      const cy = Math.max(sy, ey) + 60;
      blackWire.setAttribute("d", `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`);
    }
  }

  function drawComponentInSim(comp) {
    const container = document.getElementById("sim-component");
    if (!container) return;
    
    const typeLower = comp.type.toLowerCase();
    
    if (typeLower === "diode") {
      container.innerHTML = `
        <line x1="190" y1="100" x2="370" y2="100" stroke="#64748b" stroke-width="3" stroke-linecap="round" />
        <rect x="235" y="85" width="90" height="30" rx="3" fill="#1e293b" stroke="#334155" stroke-width="2" />
        <rect x="305" y="85" width="10" height="30" fill="#94a3b8" />
        <text x="215" y="90" fill="#94a3b8" font-family="monospace" font-size="10" font-weight="bold">A</text>
        <text x="345" y="90" fill="#94a3b8" font-family="monospace" font-size="10" font-weight="bold">K</text>
      `;
    }
    else if (typeLower === "transistor" || typeLower === "regulator") {
      container.innerHTML = `
        ${comp.package.includes("TO-220") ? `<rect x="255" y="45" width="50" height="20" fill="#94a3b8" rx="2" stroke="#64748b" />` : ""}
        <rect x="245" y="65" width="70" height="50" rx="5" fill="#1e293b" stroke="#334155" stroke-width="2" />
        <line x1="255" y1="115" x2="255" y2="155" stroke="#94a3b8" stroke-width="3" stroke-linecap="round" />
        <line x1="280" y1="115" x2="280" y2="155" stroke="#94a3b8" stroke-width="3" stroke-linecap="round" />
        <line x1="305" y1="115" x2="305" y2="155" stroke="#94a3b8" stroke-width="3" stroke-linecap="round" />
        <text x="255" y="167" fill="#64748b" font-family="monospace" font-size="9" font-weight="bold" text-anchor="middle">
          ${comp.pinout.pins[0].name[0]}
        </text>
        <text x="280" y="167" fill="#64748b" font-family="monospace" font-size="9" font-weight="bold" text-anchor="middle">
          ${comp.pinout.pins[1].name[0]}
        </text>
        <text x="305" y="167" fill="#64748b" font-family="monospace" font-size="9" font-weight="bold" text-anchor="middle">
          ${comp.pinout.pins[2].name[0]}
        </text>
      `;
    }
    else if (typeLower === "ic") {
      container.innerHTML = `
        <rect x="240" y="55" width="80" height="90" rx="4" fill="#1e293b" stroke="#334155" stroke-width="2" />
        <circle cx="280" cy="62" r="6" fill="#0f172a" />
        <line x1="220" y1="75" x2="240" y2="75" stroke="#94a3b8" stroke-width="3" />
        <line x1="220" y1="95" x2="240" y2="95" stroke="#94a3b8" stroke-width="3" />
        <line x1="220" y1="115" x2="240" y2="115" stroke="#94a3b8" stroke-width="3" />
        <line x1="220" y1="135" x2="240" y2="135" stroke="#94a3b8" stroke-width="3" />
        <line x1="300" y1="75" x2="320" y2="75" stroke="#94a3b8" stroke-width="3" />
        <line x1="300" y1="95" x2="320" y2="95" stroke="#94a3b8" stroke-width="3" />
        <line x1="300" y1="115" x2="320" y2="115" stroke="#94a3b8" stroke-width="3" />
        <line x1="300" y1="135" x2="320" y2="135" stroke="#94a3b8" stroke-width="3" />
        <text x="210" y="78" fill="#64748b" font-family="monospace" font-size="8" font-weight="bold">1</text>
        <text x="210" y="138" fill="#64748b" font-family="monospace" font-size="8" font-weight="bold">4</text>
        <text x="325" y="78" fill="#64748b" font-family="monospace" font-size="8" font-weight="bold">8</text>
        <text x="325" y="138" fill="#64748b" font-family="monospace" font-size="8" font-weight="bold">5</text>
      `;
    }
    else {
      container.innerHTML = `
        <rect x="230" y="50" width="100" height="100" rx="8" fill="#0d9488" stroke="#115e59" stroke-width="2" />
        <line x1="210" y1="75" x2="230" y2="75" stroke="#f59e0b" stroke-width="3" />
        <line x1="210" y1="115" x2="230" y2="115" stroke="#f59e0b" stroke-width="3" />
        <line x1="330" y1="75" x2="350" y2="75" stroke="#f59e0b" stroke-width="3" />
        <line x1="330" y1="115" x2="350" y2="115" stroke="#f59e0b" stroke-width="3" />
      `;
    }
  }

  function startWireAnimationTick() {
    if (wireAnimFrameId) cancelAnimationFrame(wireAnimFrameId);
    
    const blackProbe = document.getElementById("sim-black-probe");
    const redProbe = document.getElementById("sim-red-probe");
    
    function tick() {
      if (blackProbe && redProbe) {
        const ease = 0.12; // Smooth easing speed
        
        blackProbePos.x += (blackProbeTarget.x - blackProbePos.x) * ease;
        blackProbePos.y += (blackProbeTarget.y - blackProbePos.y) * ease;
        
        redProbePos.x += (redProbeTarget.x - redProbePos.x) * ease;
        redProbePos.y += (redProbeTarget.y - redProbePos.y) * ease;
        
        blackProbe.setAttribute("transform", `translate(${blackProbePos.x}, ${blackProbePos.y})`);
        redProbe.setAttribute("transform", `translate(${redProbePos.x}, ${redProbePos.y})`);
        
        updateWires(redProbePos.x, redProbePos.y, blackProbePos.x, blackProbePos.y);
      }
      wireAnimFrameId = requestAnimationFrame(tick);
    }
    tick();
  }

  function setSimDialAngle(angle) {
    const dial = document.getElementById("sim-dmm-dial");
    if (dial) {
      dial.setAttribute("transform", `rotate(${angle} 60 100)`);
    }
  }

  function buildSimStatesArray(comp) {
    const typeLower = comp.type.toLowerCase();
    const catLower = (comp.category || "").toLowerCase();
    const states = [];
    
    if (typeLower === "diode") {
      const isZener = catLower.includes("zener");
      const isSchottky = catLower.includes("schottky");
      const vf = isSchottky ? "0.224 V" : (isZener ? "0.710 V" : "0.584 V");
      
      states.push({
        rx: 210, ry: 100,
        bx: 350, by: 100,
        lcd: vf,
        dialAngle: 40,
        log: `Forward bias: Red (+) on Anode, Black (-) on Cathode. Diode conducts. Measured Vf: ${vf}`,
        beep: false,
        backlight: "#0891b2"
      });
      states.push({
        rx: 350, ry: 100,
        bx: 210, by: 100,
        lcd: "OL",
        dialAngle: 40,
        log: "Reverse bias: Red (+) on Cathode, Black (-) on Anode. Diode blocks current. Display: OL",
        beep: false,
        backlight: "#0891b2"
      });
    }
    else if (typeLower === "transistor") {
      const isNpn = catLower.includes("npn");
      if (isNpn) {
        states.push({
          rx: 280, ry: 155,
          bx: 255, by: 155,
          lcd: "0.704 V",
          dialAngle: 40,
          log: `Testing NPN (${comp.name}): Base (+) to Emitter (-). Forward junction detected. Vf: 0.704 V`,
          beep: false
        });
        states.push({
          rx: 280, ry: 155,
          bx: 305, by: 155,
          lcd: "0.696 V",
          dialAngle: 40,
          log: `Testing NPN (${comp.name}): Base (+) to Collector (-). Forward junction detected. Vf: 0.696 V`,
          beep: false
        });
        states.push({
          rx: 305, ry: 155,
          bx: 255, by: 155,
          lcd: "OL",
          dialAngle: 40,
          log: `Testing NPN (${comp.name}): Collector (+) to Emitter (-). No Base current. Junction blocks. Display: OL`,
          beep: false
        });
      } else {
        states.push({
          bx: 280, by: 155,
          rx: 255, ry: 155,
          lcd: "0.702 V",
          dialAngle: 40,
          log: `Testing PNP (${comp.name}): Emitter (+) to Base (-). Forward junction detected. Vf: 0.702 V`,
          beep: false
        });
        states.push({
          bx: 280, by: 155,
          rx: 305, ry: 155,
          lcd: "0.694 V",
          dialAngle: 40,
          log: `Testing PNP (${comp.name}): Collector (+) to Base (-). Forward junction detected. Vf: 0.694 V`,
          beep: false
        });
        states.push({
          rx: 305, ry: 155,
          bx: 255, by: 155,
          lcd: "OL",
          dialAngle: 40,
          log: `Testing PNP (${comp.name}): Collector to Emitter. No bias. Junction blocks. Display: OL`,
          beep: false
        });
      }
    }
    else if (typeLower === "regulator") {
      states.push({
        rx: 280, ry: 155,
        bx: 280, by: 155,
        lcd: "0.1 Ω",
        dialAngle: -80,
        log: "Continuity check: Both probes on GND terminal. Short circuit detected (normal GND continuity). Display: 0.1 Ω (Beep!)",
        beep: true,
        backlight: "#10b981"
      });
      states.push({
        rx: 305, ry: 155,
        bx: 280, by: 155,
        lcd: "0.648 V",
        dialAngle: 40,
        log: "Junction check: Red (+) on OUT, Black (-) on GND. Internal protection diode Vf: 0.648 V",
        beep: false,
        backlight: "#0891b2"
      });
    }
    else if (typeLower === "ic") {
      states.push({
        rx: 320, ry: 75,
        bx: 220, by: 135,
        lcd: "OL",
        dialAngle: -80,
        log: `Power rails check: Red on Vcc (Pin 8), Black on GND (Pin 4). High impedance. No short circuit. Display: OL`,
        beep: false
      });
      states.push({
        rx: 220, ry: 115,
        bx: 220, by: 135,
        lcd: "14.8 MΩ",
        dialAngle: -80,
        log: "Output pin check: Red on Pin 3 (OUT), Black on Pin 4 (GND). Output impedance: 14.8 MΩ",
        beep: false
      });
    }
    else {
      let val = "100.0 Ω";
      let dAngle = -80;
      if (typeLower.includes("capacitor")) {
        val = "100.0 nF";
        dAngle = -40;
      } else if (typeLower.includes("inductor")) {
        val = "100.0 µH";
        dAngle = 0;
      }
      states.push({
        rx: 210, ry: 75,
        bx: 330, by: 75,
        lcd: val,
        dialAngle: dAngle,
        log: `Component measurement: Probes connected across active terminals. Value: ${val}`,
        beep: false
      });
    }
    return states;
  }

  function runSimulationStep() {
    if (simStates.length === 0) return;
    const state = simStates[currentSimStateIdx];
    
    blackProbeTarget = { x: state.bx, y: state.by };
    redProbeTarget = { x: state.rx, y: state.ry };
    
    setSimDialAngle(state.dialAngle);
    
    if (state.beep) {
      if (typeof window.playBeepSound === "function") window.playBeepSound();
    } else {
      if (typeof window.playDmmClickSound === "function") window.playDmmClickSound();
    }
    
    const lcdText = document.getElementById("sim-dmm-lcd");
    const lcdScreen = document.getElementById("sim-lcd-screen");
    
    if (lcdText) lcdText.textContent = state.lcd;
    if (lcdScreen) lcdScreen.style.fill = state.backlight || "#0891b2";
    if (simStatusLog) simStatusLog.textContent = state.log;
    
    currentSimStateIdx = (currentSimStateIdx + 1) % simStates.length;
  }

  function startSimulation() {
    if (!currentCompInModal) return;
    simulationActive = true;
    simStates = buildSimStatesArray(currentCompInModal);
    currentSimStateIdx = 0;
    
    if (btnRunSim) {
      btnRunSim.textContent = "Stop Simulation";
      btnRunSim.style.color = "var(--accent-rose)";
      btnRunSim.style.borderColor = "var(--accent-rose-glow)";
    }
    if (btnPauseSim) {
      btnPauseSim.style.display = "inline-block";
      btnPauseSim.textContent = "Pause";
    }
    runSimulationStep();
    simIntervalId = setInterval(runSimulationStep, 2500);
  }

  function pauseSimulation() {
    if (simIntervalId) {
      clearInterval(simIntervalId);
      simIntervalId = null;
      if (btnPauseSim) btnPauseSim.textContent = "Resume";
      if (simStatusLog) simStatusLog.textContent = "Simulation paused.";
    } else {
      if (btnPauseSim) btnPauseSim.textContent = "Pause";
      runSimulationStep();
      simIntervalId = setInterval(runSimulationStep, 2500);
    }
  }

  if (btnRunSim) {
    btnRunSim.addEventListener("click", () => {
      if (typeof window.playDmmClickSound === "function") window.playDmmClickSound();
      if (simulationActive) {
        window.stopSimulation();
      } else {
        startSimulation();
      }
    });
  }

  if (btnPauseSim) {
    btnPauseSim.addEventListener("click", () => {
      if (typeof window.playDmmClickSound === "function") window.playDmmClickSound();
      pauseSimulation();
    });
  }
});
