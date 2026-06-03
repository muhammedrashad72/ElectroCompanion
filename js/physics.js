// js/physics.js - Physics Laws Solver

document.addEventListener("DOMContentLoaded", () => {
  const physicsLawSelect = document.getElementById("physics-law-select");
  const physicsFieldsTitle = document.getElementById("physics-fields-title");
  const physicsInputsContainer = document.getElementById("physics-inputs-container");
  const physicsCalcError = document.getElementById("physics-calc-error");
  const physicsExplanationText = document.getElementById("physics-explanation-text");

  let physicsState = {
    activeLaw: "ohms-law",
    lastEdited: []
  };

  const LAW_CONFIGS = {
    "ohms-law": {
      title: "Ohm's Law Solver (V = I × R)",
      explanation: "Ohm's law states that the current through a conductor between two points is directly proportional to the voltage across the two points. V is Voltage in Volts (V), I is Current in Amperes (A), and R is Resistance in Ohms (Ω).",
      params: [
        { id: "V", label: "Voltage (V)", units: [{ name: "V", val: 1 }, { name: "mV", val: 1e-3 }, { name: "kV", val: 1e3 }] },
        { id: "I", label: "Current (I)", units: [{ name: "mA", val: 1e-3 }, { name: "A", val: 1 }, { name: "µA", val: 1e-6 }] },
        { id: "R", label: "Resistance (R)", units: [{ name: "Ω", val: 1 }, { name: "kΩ", val: 1e3 }, { name: "MΩ", val: 1e6 }] }
      ]
    },
    "power-law": {
      title: "Electrical Power Law (P = V × I)",
      explanation: "Joule's law of heating / Power law states that electrical power is the product of voltage and current. P is Power in Watts (W), V is Voltage in Volts (V), and I is Current in Amperes (A).",
      params: [
        { id: "P", label: "Power (P)", units: [{ name: "W", val: 1 }, { name: "mW", val: 1e-3 }, { name: "kW", val: 1e3 }] },
        { id: "V", label: "Voltage (V)", units: [{ name: "V", val: 1 }, { name: "mV", val: 1e-3 }] },
        { id: "I", label: "Current (I)", units: [{ name: "mA", val: 1e-3 }, { name: "A", val: 1 }, { name: "µA", val: 1e-6 }] }
      ]
    },
    "lc-resonance": {
      title: "LC Resonance Frequency Solver",
      explanation: "The resonant frequency of an LC circuit is the frequency at which the inductive reactance equals the capacitive reactance. f is Frequency in Hertz (Hz), L is Inductance in Henries (H), and C is Capacitance in Farads (F).",
      params: [
        { id: "f", label: "Frequency (f)", units: [{ name: "kHz", val: 1e3 }, { name: "Hz", val: 1 }, { name: "MHz", val: 1e6 }] },
        { id: "L", label: "Inductance (L)", units: [{ name: "µH", val: 1e-6 }, { name: "mH", val: 1e-3 }, { name: "H", val: 1 }] },
        { id: "C", label: "Capacitance (C)", units: [{ name: "nF", val: 1e-9 }, { name: "pF", val: 1e-12 }, { name: "µF", val: 1e-6 }, { name: "F", val: 1 }] }
      ]
    },
    "voltage-divider": {
      title: "Voltage Divider Solver (Vout = Vin × R2 / (R1 + R2))",
      explanation: "A voltage divider is a simple passive linear circuit that produces an output voltage (Vout) that is a fraction of its input voltage (Vin). R1 is the top resistor, and R2 is the bottom resistor connected to ground.",
      params: [
        { id: "Vin", label: "Input Voltage (Vin)", units: [{ name: "V", val: 1 }, { name: "mV", val: 1e-3 }, { name: "kV", val: 1e3 }] },
        { id: "R1", label: "Resistor R1 (Top)", units: [{ name: "Ω", val: 1 }, { name: "kΩ", val: 1e3 }, { name: "MΩ", val: 1e6 }] },
        { id: "R2", label: "Resistor R2 (Bottom)", units: [{ name: "Ω", val: 1 }, { name: "kΩ", val: 1e3 }, { name: "MΩ", val: 1e6 }] },
        { id: "Vout", label: "Output Voltage (Vout)", units: [{ name: "V", val: 1 }, { name: "mV", val: 1e-3 }, { name: "kV", val: 1e3 }] }
      ]
    }
  };

  window.renderPhysicsInputs = function() {
    if (!physicsInputsContainer || !physicsLawSelect) return;
    const lawId = physicsLawSelect.value;
    const config = LAW_CONFIGS[lawId];

    physicsState.activeLaw = lawId;
    physicsState.lastEdited = [];

    if (physicsFieldsTitle) physicsFieldsTitle.textContent = config.title;
    if (physicsExplanationText) physicsExplanationText.textContent = config.explanation;
    physicsInputsContainer.innerHTML = "";
    if (physicsCalcError) physicsCalcError.style.display = "none";

    const dividerCircuit = document.getElementById("physics-divider-circuit");
    if (dividerCircuit) {
      if (lawId === "voltage-divider") {
        dividerCircuit.style.display = "flex";
        drawVoltageDividerSvg();
      } else {
        dividerCircuit.style.display = "none";
      }
    }

    config.params.forEach(param => {
      const row = document.createElement("div");
      row.className = "physics-input-row";
      row.style.marginBottom = "1.25rem";

      const label = document.createElement("label");
      label.setAttribute("for", `phy-${param.id}`);
      label.style.fontWeight = "600";
      label.style.color = "var(--text-secondary)";
      label.textContent = param.label;

      const inputWrapper = document.createElement("div");
      inputWrapper.style.position = "relative";
      inputWrapper.style.display = "flex";
      inputWrapper.style.alignItems = "center";
      inputWrapper.style.flex = "1";

      const input = document.createElement("input");
      input.type = "text";
      input.id = `phy-${param.id}`;
      input.className = "form-input";
      input.style.width = "100%";
      input.placeholder = "Enter value";

      inputWrapper.appendChild(input);

      const select = document.createElement("select");
      select.id = `phy-unit-${param.id}`;
      select.className = "form-select";
      select.style.width = "90px";
      select.style.borderLeft = "none";
      select.style.borderTopLeftRadius = "0";
      select.style.borderBottomLeftRadius = "0";

      input.style.borderTopRightRadius = "0";
      input.style.borderBottomRightRadius = "0";

      param.units.forEach(u => {
        const opt = document.createElement("option");
        opt.value = u.val;
        opt.textContent = u.name;
        select.appendChild(opt);
      });

      row.appendChild(label);
      row.appendChild(inputWrapper);
      row.appendChild(select);

      physicsInputsContainer.appendChild(row);

      input.addEventListener("input", () => {
        handlePhysicsInputEvent(param.id);
      });
      select.addEventListener("change", () => {
        handlePhysicsInputEvent(param.id);
      });
    });
  };

  function handlePhysicsInputEvent(paramId) {
    if (physicsCalcError) physicsCalcError.style.display = "none";
    
    const inputEl = document.getElementById(`phy-${paramId}`);
    const valStr = inputEl ? inputEl.value.trim() : "";

    const maxParams = (physicsState.activeLaw === "voltage-divider") ? 3 : 2;

    if (valStr !== "") {
      physicsState.lastEdited = physicsState.lastEdited.filter(p => p !== paramId);
      physicsState.lastEdited.push(paramId);

      if (physicsState.lastEdited.length > maxParams) {
        physicsState.lastEdited.shift();
      }
    } else {
      physicsState.lastEdited = physicsState.lastEdited.filter(p => p !== paramId);
    }

    const config = LAW_CONFIGS[physicsState.activeLaw];
    config.params.forEach(p => {
      const el = document.getElementById(`phy-${p.id}`);
      if (el) {
        el.style.borderColor = "";
        el.style.background = "";
      }
    });

    if (physicsState.lastEdited.length === maxParams) {
      const targetParam = config.params.find(p => !physicsState.lastEdited.includes(p.id));
      if (targetParam) {
        calculatePhysicsValue(targetParam.id);
      }
    }

    if (physicsState.activeLaw === "voltage-divider") {
      drawVoltageDividerSvg();
    }
  }

  function calculatePhysicsValue(targetId) {
    const lawId = physicsState.activeLaw;
    
    function getBaseValue(id) {
      const input = document.getElementById(`phy-${id}`);
      const select = document.getElementById(`phy-unit-${id}`);
      if (!input || !select) return NaN;
      
      let rawVal = parseFloat(input.value);
      let multiplier = parseFloat(select.value);

      const valStr = input.value.trim().toLowerCase();
      let matchedMult = 1;
      let matchedVal = rawVal;
      
      const match = valStr.match(/^([0-9.]+)\s*([a-zµnΩkM]?)$/i);
      if (match) {
        matchedVal = parseFloat(match[1]);
        const prefix = match[2];
        if (prefix === 'k') matchedMult = 1e3;
        else if (prefix === 'm' && id === 'R') matchedMult = 1e6;
        else if (prefix === 'm') matchedMult = 1e-3;
        else if (prefix === 'u' || prefix === 'µ') matchedMult = 1e-6;
        else if (prefix === 'n') matchedMult = 1e-9;
        else if (prefix === 'p') matchedMult = 1e-12;
      }
      
      if (!isNaN(matchedVal)) {
        return matchedVal * matchedMult;
      }
      return rawVal * multiplier;
    }

    if (lawId === "ohms-law") {
      let V = getBaseValue("V");
      let I = getBaseValue("I");
      let R = getBaseValue("R");

      if (targetId === "V") {
        if (!isNaN(I) && !isNaN(R)) {
          V = I * R;
          setPhysicsOutput("V", V);
        }
      } else if (targetId === "I") {
        if (!isNaN(V) && !isNaN(R) && R !== 0) {
          I = V / R;
          setPhysicsOutput("I", I);
        } else if (R === 0) {
          showPhysicsError("Resistance cannot be zero when solving for current.");
        }
      } else if (targetId === "R") {
        if (!isNaN(V) && !isNaN(I) && I !== 0) {
          R = V / I;
          setPhysicsOutput("R", R);
        } else if (I === 0) {
          showPhysicsError("Current cannot be zero when solving for resistance.");
        }
      }
    } 
    else if (lawId === "power-law") {
      let P = getBaseValue("P");
      let V = getBaseValue("V");
      let I = getBaseValue("I");

      if (targetId === "P") {
        if (!isNaN(V) && !isNaN(I)) {
          P = V * I;
          setPhysicsOutput("P", P);
        }
      } else if (targetId === "V") {
        if (!isNaN(P) && !isNaN(I) && I !== 0) {
          V = P / I;
          setPhysicsOutput("V", V);
        } else if (I === 0) {
          showPhysicsError("Current cannot be zero when solving for voltage.");
        }
      } else if (targetId === "I") {
        if (!isNaN(P) && !isNaN(V) && V !== 0) {
          I = P / V;
          setPhysicsOutput("I", I);
        } else if (V === 0) {
          showPhysicsError("Voltage cannot be zero when solving for current.");
        }
      }
    }
    else if (lawId === "lc-resonance") {
      let f = getBaseValue("f");
      let L = getBaseValue("L");
      let C = getBaseValue("C");

      if (targetId === "f") {
        if (!isNaN(L) && !isNaN(C) && L > 0 && C > 0) {
          f = 1 / (2 * Math.PI * Math.sqrt(L * C));
          setPhysicsOutput("f", f);
        }
      } else if (targetId === "L") {
        if (!isNaN(f) && !isNaN(C) && f > 0 && C > 0) {
          L = 1 / (4 * Math.PI * Math.PI * f * f * C);
          setPhysicsOutput("L", L);
        }
      } else if (targetId === "C") {
        if (!isNaN(f) && !isNaN(L) && f > 0 && L > 0) {
          C = 1 / (4 * Math.PI * Math.PI * f * f * L);
          setPhysicsOutput("C", C);
        }
      }
    }
    else if (lawId === "voltage-divider") {
      let Vin = getBaseValue("Vin");
      let R1 = getBaseValue("R1");
      let R2 = getBaseValue("R2");
      let Vout = getBaseValue("Vout");

      if (targetId === "Vout") {
        if (!isNaN(Vin) && !isNaN(R1) && !isNaN(R2) && (R1 + R2) !== 0) {
          Vout = Vin * (R2 / (R1 + R2));
          setPhysicsOutput("Vout", Vout);
        }
      } else if (targetId === "Vin") {
        if (!isNaN(Vout) && !isNaN(R1) && !isNaN(R2) && R2 !== 0) {
          Vin = Vout * ((R1 + R2) / R2);
          setPhysicsOutput("Vin", Vin);
        } else if (R2 === 0) {
          showPhysicsError("R2 cannot be zero when solving for Vin.");
        }
      } else if (targetId === "R1") {
        if (!isNaN(Vin) && !isNaN(Vout) && !isNaN(R2) && Vout !== 0) {
          if (Vin < Vout) {
            showPhysicsError("Vin must be greater than or equal to Vout.");
          } else {
            R1 = R2 * ((Vin - Vout) / Vout);
            setPhysicsOutput("R1", R1);
          }
        } else if (Vout === 0) {
          showPhysicsError("Vout cannot be zero when solving for R1.");
        }
      } else if (targetId === "R2") {
        if (!isNaN(Vin) && !isNaN(Vout) && !isNaN(R1) && (Vin - Vout) !== 0) {
          if (Vin < Vout) {
            showPhysicsError("Vin must be greater than or equal to Vout.");
          } else {
            R2 = R1 * (Vout / (Vin - Vout));
            setPhysicsOutput("R2", R2);
          }
        } else if (Vin === Vout) {
          showPhysicsError("Vin cannot equal Vout when solving for R2.");
        }
      }
    }
  }

  function setPhysicsOutput(id, value) {
    const input = document.getElementById(`phy-${id}`);
    const select = document.getElementById(`phy-unit-${id}`);
    if (!input || !select) return;

    const scale = parseFloat(select.value);
    const displayVal = value / scale;

    let formatted = displayVal;
    if (displayVal >= 1000) {
      formatted = displayVal.toFixed(3);
    } else if (displayVal < 0.001) {
      formatted = displayVal.toExponential(4);
    } else {
      formatted = displayVal.toFixed(4);
    }
    
    formatted = formatted.toString().replace(/(\.\d*?[1-9])0+$/g, "$1").replace(/\.0+$/, "");

    input.value = formatted;
    input.style.borderColor = "var(--accent-purple)";
    input.style.background = "rgba(139, 92, 246, 0.05)";

    if (window.currentView === "laws-view" && typeof window.updateDmmLcd === "function") {
      const option = select.options[select.selectedIndex];
      const unitName = option ? option.textContent : "";
      window.updateDmmLcd(formatted, unitName, `SOLVED ${id}`);
    }
  }

  function showPhysicsError(msg) {
    if (!physicsCalcError) return;
    physicsCalcError.textContent = msg;
    physicsCalcError.style.display = "block";
  }

  function drawVoltageDividerSvg() {
    const dividerCircuit = document.getElementById("physics-divider-circuit");
    if (!dividerCircuit) return;

    function getDisplayVal(id, fallback) {
      const input = document.getElementById(`phy-${id}`);
      const select = document.getElementById(`phy-unit-${id}`);
      if (input && input.value.trim() !== "") {
        const unit = select ? select.options[select.selectedIndex].textContent : "";
        return `${input.value.trim()} ${unit}`;
      }
      return fallback;
    }

    const vinDisp = getDisplayVal("Vin", "Vin");
    const voutDisp = getDisplayVal("Vout", "Vout");
    const r1Disp = getDisplayVal("R1", "R1");
    const r2Disp = getDisplayVal("R2", "R2");

    dividerCircuit.innerHTML = `
      <svg width="240" height="200" viewBox="0 0 240 200" style="display:block; margin:0 auto;">
        <!-- Vin Terminal and wire -->
        <circle cx="40" cy="30" r="4" fill="var(--accent-purple)" />
        <text x="35" y="20" fill="var(--text-secondary)" font-family="sans-serif" font-size="10" font-weight="600" text-anchor="middle">Input</text>
        <text x="35" y="44" fill="var(--accent-purple)" font-family="monospace" font-size="9" font-weight="bold" text-anchor="middle">${vinDisp}</text>
        <line x1="40" y1="30" x2="100" y2="30" stroke="#64748b" stroke-width="2" />
        <line x1="100" y1="30" x2="100" y2="45" stroke="#64748b" stroke-width="2" />

        <!-- Resistor R1 -->
        <g>
          <rect x="92" y="45" width="16" height="40" rx="2" fill="#111827" stroke="var(--accent-purple)" stroke-width="2" />
          <text x="80" y="65" fill="var(--text-secondary)" font-family="sans-serif" font-size="9" font-weight="bold" text-anchor="end">R1</text>
          <text x="80" y="77" fill="var(--accent-purple)" font-family="monospace" font-size="8.5" font-weight="bold" text-anchor="end">${r1Disp}</text>
        </g>
        <line x1="100" y1="85" x2="100" y2="125" stroke="#64748b" stroke-width="2" />

        <!-- Node & Vout Terminal -->
        <circle cx="100" cy="105" r="3" fill="#64748b" />
        <line x1="100" y1="105" x2="180" y2="105" stroke="#64748b" stroke-width="2" />
        <circle cx="180" cy="105" r="4" fill="var(--accent-purple)" />
        <text x="185" y="95" fill="var(--text-secondary)" font-family="sans-serif" font-size="10" font-weight="600">Output</text>
        <text x="185" y="119" fill="var(--accent-purple)" font-family="monospace" font-size="9" font-weight="bold">${voutDisp}</text>

        <!-- Resistor R2 -->
        <g>
          <rect x="92" y="125" width="16" height="40" rx="2" fill="#111827" stroke="var(--accent-purple)" stroke-width="2" />
          <text x="80" y="145" fill="var(--text-secondary)" font-family="sans-serif" font-size="9" font-weight="bold" text-anchor="end">R2</text>
          <text x="80" y="157" fill="var(--accent-purple)" font-family="monospace" font-size="8.5" font-weight="bold" text-anchor="end">${r2Disp}</text>
        </g>
        <line x1="100" y1="165" x2="100" y2="185" stroke="#64748b" stroke-width="2" />

        <!-- Ground connection -->
        <line x1="88" y1="185" x2="112" y2="185" stroke="#64748b" stroke-width="2" />
        <line x1="92" y1="189" x2="108" y2="189" stroke="#64748b" stroke-width="1.5" />
        <line x1="96" y1="193" x2="104" y2="193" stroke="#64748b" stroke-width="1" />
      </svg>
    `;
  }

  if (physicsLawSelect) {
    physicsLawSelect.addEventListener("change", window.renderPhysicsInputs);
  }

  // Initialize UI on startup
  window.renderPhysicsInputs();
});
