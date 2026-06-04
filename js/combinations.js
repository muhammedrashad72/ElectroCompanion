// js/combinations.js - Resistor Series & Parallel Combinations Solver

document.addEventListener("DOMContentLoaded", () => {
  const resistorsListContainer = document.getElementById("combination-resistors-list");
  const btnAddResistor = document.getElementById("btn-add-combo-resistor");
  const resultVal = document.getElementById("combo-result-val");
  const resultMath = document.getElementById("combo-result-math");
  const schematicContainer = document.getElementById("combo-schematic-container");

  // State
  let comboResistors = [
    { id: 1, val: 100, valStr: "100", multiplier: 1 },
    { id: 2, val: 220, valStr: "220", multiplier: 1 }
  ];
  let nextResistorId = 3;
  let comboMode = "series";

  // Parse suffix value (e.g. 1.2k -> 1200)
  function parseValueToOhms(str, selectMultiplier = 1) {
    let cleaned = str.toLowerCase().trim().replace(/ohm[s]?|Ω/g, "").trim();
    if (!cleaned) return null;

    let multiplier = selectMultiplier;
    let base = cleaned;

    if (cleaned.includes('k')) {
      multiplier = 1000;
      base = cleaned.replace('k', '.');
    } else if (cleaned.includes('m')) {
      multiplier = 1000000;
      base = cleaned.replace('m', '.');
    } else if (cleaned.includes('r')) {
      multiplier = 1;
      base = cleaned.replace('r', '.');
    }

    if (base.endsWith('.')) base = base.slice(0, -1);
    if (base.startsWith('.')) base = '0' + base;

    const val = parseFloat(base) * multiplier;
    return isNaN(val) || val <= 0 ? null : val;
  }

  function formatValue(ohms) {
    if (ohms >= 1e6) {
      return `${(ohms / 1e6).toFixed(2).replace(/\.00$/, "")} MΩ`;
    } else if (ohms >= 1e3) {
      return `${(ohms / 1e3).toFixed(2).replace(/\.00$/, "")} kΩ`;
    } else {
      return `${ohms.toFixed(2).replace(/\.00$/, "")} Ω`;
    }
  }

  // Renders the list of resistor input rows
  function renderResistorRows() {
    if (!resistorsListContainer) return;
    resistorsListContainer.innerHTML = "";

    comboResistors.forEach((res, index) => {
      const row = document.createElement("div");
      row.className = "form-group";
      row.style.display = "flex";
      row.style.flexDirection = "row";
      row.style.gap = "0.5rem";
      row.style.alignItems = "center";
      row.setAttribute("data-id", res.id);

      const label = document.createElement("span");
      label.style.fontWeight = "600";
      label.style.color = "var(--text-secondary)";
      label.style.width = "30px";
      label.textContent = `R${index + 1}`;

      const input = document.createElement("input");
      input.type = "text";
      input.className = "form-input";
      input.placeholder = "e.g. 1k, 470, 2.2M";
      input.value = res.valStr;
      input.style.flex = "1";

      input.addEventListener("input", (e) => {
        res.valStr = e.target.value;
        res.val = parseValueToOhms(res.valStr, res.multiplier);
        window.calculateCombinations();
      });

      const select = document.createElement("select");
      select.className = "form-select";
      select.style.width = "75px";
      select.style.padding = "0.5rem";
      select.style.background = "rgba(15, 23, 42, 0.6)";
      select.style.border = "1px solid var(--card-border)";
      select.style.borderRadius = "10px";
      select.style.color = "var(--text-primary)";
      select.style.outline = "none";
      select.style.fontSize = "0.85rem";
      select.style.cursor = "pointer";

      const optOhms = document.createElement("option");
      optOhms.value = "1";
      optOhms.textContent = "Ω";
      if (res.multiplier === 1) optOhms.selected = true;

      const optK = document.createElement("option");
      optK.value = "1000";
      optK.textContent = "kΩ";
      if (res.multiplier === 1000) optK.selected = true;

      const optM = document.createElement("option");
      optM.value = "1000000";
      optM.textContent = "MΩ";
      if (res.multiplier === 1000000) optM.selected = true;

      select.appendChild(optOhms);
      select.appendChild(optK);
      select.appendChild(optM);

      select.addEventListener("change", (e) => {
        res.multiplier = parseFloat(e.target.value);
        res.val = parseValueToOhms(res.valStr, res.multiplier);
        window.calculateCombinations();
      });

      row.appendChild(label);
      row.appendChild(input);
      row.appendChild(select);

      // Show remove button only if there are more than 2 resistors
      if (comboResistors.length > 2) {
        const removeBtn = document.createElement("button");
        removeBtn.className = "datasheet-btn";
        removeBtn.style.padding = "0.7rem 0.8rem";
        removeBtn.style.borderColor = "var(--accent-rose-glow)";
        removeBtn.style.color = "var(--accent-rose)";
        removeBtn.style.background = "rgba(244, 63, 94, 0.05)";
        removeBtn.textContent = "✕";
        removeBtn.title = "Remove resistor input";
        
        removeBtn.addEventListener("click", () => {
          comboResistors = comboResistors.filter(r => r.id !== res.id);
          renderResistorRows();
          window.calculateCombinations();
        });
        row.appendChild(removeBtn);
      }

      resistorsListContainer.appendChild(row);
    });
  }

  // Draw Dynamic SVG schematic of the resistor configuration
  function drawComboSchematic() {
    if (!schematicContainer) return;
    schematicContainer.innerHTML = "";

    const vinInput = document.getElementById("combo-vin");
    const vinUnit = document.getElementById("combo-vin-unit");
    const iloadInput = document.getElementById("combo-iload");
    const iloadUnit = document.getElementById("combo-iload-unit");

    const Vin = parseFloat(vinInput ? vinInput.value : 0) * parseFloat(vinUnit ? vinUnit.value : 1);
    const Iload = parseFloat(iloadInput ? iloadInput.value : 0) * parseFloat(iloadUnit ? iloadUnit.value : 0.001);

    const activeResistors = comboResistors.map((r, i) => ({
      name: `R${i + 1}`,
      displayVal: r.valStr ? (r.val !== null ? formatValue(r.val) : r.valStr) : "0 Ω",
      val: r.val || 0
    }));

    const N = activeResistors.length;
    if (N === 0) return;

    let svgHtml = "";
    
    // Animation style
    const styleHtml = `
      <style>
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .combo-flow-line {
          stroke: #10b981;
          stroke-width: 2.5;
          stroke-dasharray: 4, 6;
          animation: dash 1.5s linear infinite;
          fill: none;
          stroke-linecap: round;
        }
      </style>
    `;

    if (comboMode === "series") {
      // --- Series Schematic Drawing (Horizontal Chain) ---
      const totalWidth = 360;
      const height = 180;
      const rWidth = 46;
      const rHeight = 22;

      svgHtml = `<svg width="100%" height="100%" viewBox="0 0 ${totalWidth} ${height}">`;
      svgHtml += styleHtml;

      const startX = 35;
      const endX = 325;
      const spaceTotal = (endX - startX) - (N * rWidth);
      const gap = spaceTotal / (N - 1 || 1);

      // Total series Req (EQ)
      const req = activeResistors.reduce((sum, r) => sum + r.val, 0);
      let voutVal = Vin - Iload * req;
      if (voutVal < 0) voutVal = 0;

      // Draw horizontal background wire lines and down to ground
      svgHtml += `<line x1="15" x2="345" y1="90" y2="90" stroke="#334155" stroke-width="2.5" />`;
      svgHtml += `<line x1="345" x2="345" y1="90" y2="145" stroke="#334155" stroke-width="2.5" />`;

      // Draw ground connection at bottom right
      svgHtml += `<line x1="337" x2="353" y1="145" y2="145" stroke="#64748b" stroke-width="2" />`;
      svgHtml += `<line x1="341" x2="349" y1="149" y2="149" stroke="#64748b" stroke-width="1.5" />`;
      svgHtml += `<line x1="344" x2="346" y1="153" y2="153" stroke="#64748b" stroke-width="1" />`;

      // Draw current flow line if Iload > 0
      if (Iload > 0 && Vin > 0) {
        const dur = Math.max(0.2, Math.min(3.0, 0.015 / Iload));
        svgHtml += `<path d="M 15 90 L 345 90 L 345 145" class="combo-flow-line" style="animation-duration: ${dur}s;" />`;
      }

      // Wire leads connection ends
      svgHtml += `<circle cx="15" cy="90" r="4.5" fill="var(--accent-green)" stroke="#064e3b" stroke-width="1" />`;
      svgHtml += `<circle cx="345" cy="90" r="4.5" fill="var(--accent-green)" stroke="#064e3b" stroke-width="1" />`;
      
      // Node voltage texts (Vin moved to left 5px, Vout and Load moved so they don't overlap dummy resistor)
      svgHtml += `<text x="5" y="112" fill="var(--text-secondary)" font-family="monospace" font-size="8" text-anchor="start">Vin: ${Vin.toFixed(1)}V</text>`;
      svgHtml += `<text x="325" y="82" fill="var(--accent-cyan)" font-family="monospace" font-size="8" text-anchor="end">Vout: ${voutVal.toFixed(1)}V</text>`;
      svgHtml += `<text x="325" y="123" fill="#ef4444" font-family="monospace" font-size="8" font-weight="bold" text-anchor="end">Load: ${Iload >= 0.001 ? (Iload * 1000).toFixed(1) + 'mA' : (Iload * 1e6).toFixed(0) + 'µA'}</text>`;

      // Draw Dummy Load Resistor
      svgHtml += `<rect x="337" y="105" width="16" height="30" rx="2" fill="#0f172a" stroke="#ef4444" stroke-width="2" />`;

      let currentX = startX;
      let currentV = Vin;

      for (let i = 0; i < N; i++) {
        const res = activeResistors[i];
        
        // Calculate voltage drop
        const drop = Iload * res.val;
        currentV -= drop;
        if (currentV < 0) currentV = 0;

        const dropStr = drop >= 0.001 ? `${drop.toFixed(2).replace(/\.00$/, "")}V` : `${(drop * 1000).toFixed(1)}mV`;
        const resCurrentStr = Iload >= 0.001 ? `${(Iload * 1000).toFixed(1)}mA` : `${(Iload * 1e6).toFixed(0)}µA`;

        // Draw Resistor Rectangle (this covers the background wire/current dashes!)
        svgHtml += `
          <g>
            <rect x="${currentX}" y="79" width="${rWidth}" height="${rHeight}" rx="3" fill="#0f172a" stroke="var(--accent-green)" stroke-width="2" />
            <text x="${currentX + rWidth / 2}" y="70" fill="var(--text-secondary)" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">${res.name}</text>
            <text x="${currentX + rWidth / 2}" y="115" fill="var(--accent-green)" font-family="monospace" font-size="9" font-weight="bold" text-anchor="middle">${res.displayVal}</text>
            ${Iload > 0 && res.val > 0 ? `
              <text x="${currentX + rWidth / 2}" y="130" fill="#a78bfa" font-family="monospace" font-size="8" font-weight="bold" text-anchor="middle">Vd: ${dropStr}</text>
              <text x="${currentX + rWidth / 2}" y="141" fill="var(--text-secondary)" font-family="monospace" font-size="7.5" font-weight="bold" text-anchor="middle">I: ${resCurrentStr}</text>
            ` : ""}
          </g>
        `;

        // Display intermediate voltage if there is a gap and not the last resistor
        if (i < N - 1) {
          const juncX = currentX + rWidth + gap / 2;
          svgHtml += `<text x="${juncX}" y="82" fill="var(--accent-cyan)" font-family="monospace" font-size="8.5" font-weight="bold" text-anchor="middle">${currentV.toFixed(1)}V</text>`;
        }

        currentX += rWidth + gap;
      }

      svgHtml += `</svg>`;
    } 
    else {
      // --- Parallel Schematic Drawing (Vertical Stack Ladder) ---
      const totalWidth = 360;
      const rWidth = 70;
      const rHeight = 22;
      const leftBusX = 90;
      const rightBusX = 270;
      
      const spacingY = 48;
      const height = Math.max(180, (N + 1) * spacingY);
      const startY = (height - (N - 1) * spacingY) / 2;

      svgHtml = `<svg width="100%" height="100%" viewBox="0 0 ${totalWidth} ${height}">`;
      svgHtml += styleHtml;

      // Req (EQ) calculation
      const reciprocalSum = activeResistors.reduce((sum, r) => sum + (r.val ? 1 / r.val : 0), 0);
      const req = reciprocalSum > 0 ? 1 / reciprocalSum : 0;
      let voutVal = Vin - Iload * req;
      if (voutVal < 0) voutVal = 0;

      // Draw background wires
      svgHtml += `<line x1="20" x2="${leftBusX}" y1="${height / 2}" y2="${height / 2}" stroke="#334155" stroke-width="2.5" />`;
      svgHtml += `<line x1="340" x2="${rightBusX}" y1="${height / 2}" y2="${height / 2}" stroke="#334155" stroke-width="2.5" />`;
      svgHtml += `<line x1="${leftBusX}" x2="${leftBusX}" y1="${startY}" y2="${startY + (N - 1) * spacingY}" stroke="#334155" stroke-width="2.5" stroke-linecap="round" />`;
      svgHtml += `<line x1="${rightBusX}" x2="${rightBusX}" y1="${startY}" y2="${startY + (N - 1) * spacingY}" stroke="#334155" stroke-width="2.5" stroke-linecap="round" />`;

      // Vertical wire down from right terminal to ground
      svgHtml += `<line x1="340" x2="340" y1="${height / 2}" y2="${height / 2 + 55}" stroke="#334155" stroke-width="2.5" />`;

      // Ground connection at bottom right
      svgHtml += `<line x1="332" x2="348" y1="${height / 2 + 55}" y2="${height / 2 + 55}" stroke="#64748b" stroke-width="2" />`;
      svgHtml += `<line x1="336" x2="344" y1="${height / 2 + 59}" y2="${height / 2 + 59}" stroke="#64748b" stroke-width="1.5" />`;
      svgHtml += `<line x1="339" x2="341" y1="${height / 2 + 63}" y2="${height / 2 + 63}" stroke="#64748b" stroke-width="1" />`;

      // Dummy Load Resistor in parallel view
      svgHtml += `<rect x="332" y="${height / 2 + 15}" width="16" height="30" rx="2" fill="#0f172a" stroke="#ef4444" stroke-width="2" />`;

      for (let i = 0; i < N; i++) {
        const y = startY + i * spacingY;
        svgHtml += `<line x1="${leftBusX}" x2="${rightBusX}" y1="${y}" y2="${y}" stroke="#334155" stroke-width="2" />`;
      }

      // Draw animations if Iload > 0
      if (Iload > 0 && Vin > 0) {
        const vDiff = Vin - voutVal;
        for (let i = 0; i < N; i++) {
          const res = activeResistors[i];
          const y = startY + i * spacingY;
          if (res.val > 0) {
            const iBranch = vDiff / res.val;
            if (iBranch > 1e-6) {
              const durBranch = Math.max(0.2, Math.min(3.0, 0.015 / iBranch));
              // Continuous flowing path for this parallel branch down to ground
              svgHtml += `<path d="M 20 ${height / 2} L ${leftBusX} ${height / 2} L ${leftBusX} ${y} L ${rightBusX} ${y} L ${rightBusX} ${height / 2} L 340 ${height / 2} L 340 ${height / 2 + 55}" class="combo-flow-line" style="animation-duration: ${durBranch}s; opacity: 0.65;" />`;
            }
          }
        }
      }

      // Terminals
      svgHtml += `<circle cx="20" cy="${height / 2}" r="4.5" fill="var(--accent-green)" stroke="#064e3b" stroke-width="1" />`;
      svgHtml += `<circle cx="340" cy="${height / 2}" r="4.5" fill="var(--accent-green)" stroke="#064e3b" stroke-width="1" />`;
      
      // Vin positioned on left side, text-anchor start
      svgHtml += `<text x="5" y="${height / 2 + 15}" fill="var(--text-secondary)" font-family="monospace" font-size="8" text-anchor="start">Vin: ${Vin.toFixed(1)}V</text>`;
      // Vout and Load positioned to the left of the dummy resistor
      svgHtml += `<text x="320" y="${height / 2 - 8}" fill="var(--accent-cyan)" font-family="monospace" font-size="8" text-anchor="end">Vout: ${voutVal.toFixed(1)}V</text>`;
      svgHtml += `<text x="320" y="${height / 2 + 33}" fill="#ef4444" font-family="monospace" font-size="8" font-weight="bold" text-anchor="end">Load: ${Iload >= 0.001 ? (Iload * 1000).toFixed(1) + 'mA' : (Iload * 1e6).toFixed(0) + 'µA'}</text>`;

      // Draw Resistors over flows
      for (let i = 0; i < N; i++) {
        const res = activeResistors[i];
        const y = startY + i * spacingY;
        const rx = leftBusX + (rightBusX - leftBusX - rWidth) / 2;

        const vDiff = Vin - voutVal;
        const vDiffStr = vDiff >= 0.001 ? `${vDiff.toFixed(2).replace(/\.00$/, "")}V` : `${(vDiff * 1000).toFixed(1)}mV`;
        const iBranch = res.val > 0 ? vDiff / res.val : 0;
        const iBranchStr = iBranch >= 0.001 ? `${(iBranch * 1000).toFixed(1)}mA` : `${(iBranch * 1e6).toFixed(0)}µA`;

        svgHtml += `
          <g>
            <rect x="${rx}" y="${y - rHeight / 2}" width="${rWidth}" height="${rHeight}" rx="3" fill="#0f172a" stroke="var(--accent-green)" stroke-width="2" />
            <text x="${rx + rWidth / 2}" y="${y - rHeight / 2 - 4}" fill="var(--text-secondary)" font-family="sans-serif" font-size="9" font-weight="bold" text-anchor="middle">${res.name}</text>
            <text x="${rx + rWidth / 2}" y="${y + 3}" fill="var(--accent-green)" font-family="monospace" font-size="8.5" font-weight="bold" text-anchor="middle">${res.displayVal}</text>
            ${Iload > 0 && res.val > 0 ? `
              <text x="${rx + rWidth / 2}" y="${y + 13}" fill="#a78bfa" font-family="monospace" font-size="7" font-weight="bold" text-anchor="middle">Vd: ${vDiffStr}</text>
              <text x="${rx + rWidth / 2}" y="${y + 22}" fill="var(--accent-cyan)" font-family="monospace" font-size="7" font-weight="bold" text-anchor="middle">I: ${iBranchStr}</text>
            ` : ""}
          </g>
        `;
      }

      svgHtml += `</svg>`;
    }

    schematicContainer.innerHTML = svgHtml;
  }

  // Main Equivalent Resistance Solver
  window.calculateCombinations = function() {
    if (!resultVal || !resultMath) return;

    const activeResistors = comboResistors.map(r => r.val).filter(val => val !== null && val > 0);
    const mode = document.querySelector('input[name="combo-mode"]:checked').value;
    comboMode = mode;

    let req = 0;
    let mathStr = "";

    const vinInput = document.getElementById("combo-vin");
    const vinUnit = document.getElementById("combo-vin-unit");
    const iloadInput = document.getElementById("combo-iload");
    const iloadUnit = document.getElementById("combo-iload-unit");
    const resultVout = document.getElementById("combo-result-vout");

    const Vin = parseFloat(vinInput ? vinInput.value : 0) * parseFloat(vinUnit ? vinUnit.value : 1);
    const Iload = parseFloat(iloadInput ? iloadInput.value : 0) * parseFloat(iloadUnit ? iloadUnit.value : 0.001);

    if (activeResistors.length === 0) {
      resultVal.textContent = "0.00 Ω";
      if (resultVout) resultVout.textContent = "0.00 V";
      resultMath.textContent = "Please enter positive resistor values.";
      if (window.currentView === "resistor-view" && typeof window.updateDmmLcd === "function") {
        window.updateDmmLcd("0.0", "Ω", "EQ COMB | VOUT: 0.00V");
      }
      drawComboSchematic();
      return;
    }

    if (mode === "series") {
      req = activeResistors.reduce((sum, val) => sum + val, 0);
      const valuesStr = activeResistors.map(v => formatValue(v)).join(" + ");
      mathStr = `EQ = R1 + R2 + ... = ${valuesStr} = ${formatValue(req)}`;
    } 
    else {
      const reciprocalSum = activeResistors.reduce((sum, val) => sum + (1 / val), 0);
      req = 1 / reciprocalSum;
      const reciprocalTerms = activeResistors.map(v => `1/${formatValue(v)}`).join(" + ");
      mathStr = `EQ = 1 / (${reciprocalTerms}) = 1 / (${reciprocalSum.toExponential(4)}) = ${formatValue(req)}`;
    }

    let vout = Vin - Iload * req;
    if (vout < 0) vout = 0;

    const formatted = formatValue(req);
    resultVal.textContent = formatted;
    if (resultVout) {
      resultVout.textContent = `${vout.toFixed(2)} V`;
    }
    
    // Add loaded info to math text, changing Iload to load and Req to EQ
    if (Iload > 0) {
      mathStr += ` | Loaded Vout = Vin - load * EQ = ${Vin}V - ${(Iload * 1000).toFixed(1)}mA * ${formatted} = ${vout.toFixed(2)}V`;
    }

    resultMath.textContent = mathStr;

    // Update Multimeter LCD screen (Show EQ equivalent resistance on main screen, and show Vout also in sub-text)
    if (window.currentView === "resistor-view" && typeof window.updateDmmLcd === "function") {
      const parts = formatted.split(" ");
      window.updateDmmLcd(parts[0], parts[1], `EQ COMB | VOUT: ${vout.toFixed(2)}V`);
    }

    drawComboSchematic();
  };

  // Event listener for connection mode toggle
  document.querySelectorAll('input[name="combo-mode"]').forEach(radio => {
    radio.addEventListener("change", (e) => {
      comboMode = e.target.value;
      if (typeof window.playDmmClickSound === "function") window.playDmmClickSound();
      window.calculateCombinations();
    });
  });

  // Event listeners for Vin and Iload
  const vinInput = document.getElementById("combo-vin");
  const vinUnit = document.getElementById("combo-vin-unit");
  const iloadInput = document.getElementById("combo-iload");
  const iloadUnit = document.getElementById("combo-iload-unit");

  if (vinInput) vinInput.addEventListener("input", window.calculateCombinations);
  if (vinUnit) vinUnit.addEventListener("change", window.calculateCombinations);
  if (iloadInput) iloadInput.addEventListener("input", window.calculateCombinations);
  if (iloadUnit) iloadUnit.addEventListener("change", window.calculateCombinations);

  // Add resistor row trigger
  if (btnAddResistor) {
    btnAddResistor.addEventListener("click", () => {
      if (typeof window.playDmmClickSound === "function") window.playDmmClickSound();
      comboResistors.push({
        id: nextResistorId++,
        val: null,
        valStr: "",
        multiplier: 1
      });
      renderResistorRows();
      window.calculateCombinations();
    });
  }

  // Startup Init
  renderResistorRows();
  window.calculateCombinations();
});
