// js/combinations.js - Resistor Series & Parallel Combinations Solver

document.addEventListener("DOMContentLoaded", () => {
  const resistorsListContainer = document.getElementById("combination-resistors-list");
  const btnAddResistor = document.getElementById("btn-add-combo-resistor");
  const resultVal = document.getElementById("combo-result-val");
  const resultMath = document.getElementById("combo-result-math");
  const schematicContainer = document.getElementById("combo-schematic-container");

  // State
  let comboResistors = [
    { id: 1, val: 100, valStr: "100" },
    { id: 2, val: 220, valStr: "220" }
  ];
  let nextResistorId = 3;
  let comboMode = "series";

  // Parse suffix value (e.g. 1.2k -> 1200)
  function parseValueToOhms(str) {
    let cleaned = str.toLowerCase().trim().replace(/ohm[s]?|Ω/g, "").trim();
    if (!cleaned) return null;

    let multiplier = 1;
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
        res.val = parseValueToOhms(res.valStr);
        window.calculateCombinations();
      });

      row.appendChild(label);
      row.appendChild(input);

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

    const activeResistors = comboResistors.map((r, i) => ({
      name: `R${i + 1}`,
      displayVal: r.valStr ? (r.val !== null ? formatValue(r.val) : r.valStr) : "0 Ω",
      val: r.val || 0
    }));

    const N = activeResistors.length;
    if (N === 0) return;

    let svgHtml = "";
    if (comboMode === "series") {
      // --- Series Schematic Drawing (Horizontal Chain) ---
      const totalWidth = 360;
      const height = 180;
      const rWidth = 46;
      const rHeight = 22;

      svgHtml = `<svg width="100%" height="100%" viewBox="0 0 ${totalWidth} ${height}">`;
      
      // Wire leads connection ends
      svgHtml += `<circle cx="15" cy="90" r="4" fill="var(--accent-green)" />`;
      svgHtml += `<circle cx="345" cy="90" r="4" fill="var(--accent-green)" />`;
      svgHtml += `<line x1="15" x2="35" y1="90" y2="90" stroke="#64748b" stroke-width="2" />`;
      svgHtml += `<line x1="325" x2="345" y1="90" y2="90" stroke="#64748b" stroke-width="2" />`;

      // Draw horizontal ladder blocks
      const startX = 35;
      const endX = 325;
      const spaceTotal = (endX - startX) - (N * rWidth);
      const gap = spaceTotal / (N - 1 || 1);

      let currentX = startX;
      for (let i = 0; i < N; i++) {
        const res = activeResistors[i];
        
        // Draw Resistor Rectangle
        svgHtml += `
          <g>
            <rect x="${currentX}" y="79" width="${rWidth}" height="${rHeight}" rx="3" fill="#111827" stroke="var(--accent-green)" stroke-width="2" />
            <text x="${currentX + rWidth / 2}" y="70" fill="var(--text-secondary)" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">${res.name}</text>
            <text x="${currentX + rWidth / 2}" y="115" fill="var(--accent-green)" font-family="monospace" font-size="9" font-weight="bold" text-anchor="middle">${res.displayVal}</text>
          </g>
        `;

        // Connection wire to next resistor
        if (i < N - 1) {
          svgHtml += `<line x1="${currentX + rWidth}" x2="${currentX + rWidth + gap}" y1="90" y2="90" stroke="#64748b" stroke-width="2" />`;
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
      
      // Dynamic height based on number of resistors
      const spacingY = 36;
      const height = Math.max(180, (N + 1) * spacingY);
      const startY = (height - (N - 1) * spacingY) / 2;

      svgHtml = `<svg width="100%" height="100%" viewBox="0 0 ${totalWidth} ${height}">`;

      // Input terminals
      svgHtml += `<circle cx="20" cy="${height / 2}" r="4" fill="var(--accent-green)" />`;
      svgHtml += `<circle cx="340" cy="${height / 2}" r="4" fill="var(--accent-green)" />`;
      
      // Main input wires to the vertical buses
      svgHtml += `<line x1="20" x2="${leftBusX}" y1="${height / 2}" y2="${height / 2}" stroke="#64748b" stroke-width="2" />`;
      svgHtml += `<line x1="340" x2="${rightBusX}" y1="${height / 2}" y2="${height / 2}" stroke="#64748b" stroke-width="2" />`;

      // Draw Vertical Bus Bars
      svgHtml += `<line x1="${leftBusX}" x2="${leftBusX}" y1="${startY}" y2="${startY + (N - 1) * spacingY}" stroke="#64748b" stroke-width="2" stroke-linecap="round" />`;
      svgHtml += `<line x1="${rightBusX}" x2="${rightBusX}" y1="${startY}" y2="${startY + (N - 1) * spacingY}" stroke="#64748b" stroke-width="2" stroke-linecap="round" />`;

      // Draw branches
      for (let i = 0; i < N; i++) {
        const res = activeResistors[i];
        const y = startY + i * spacingY;

        // branch horizontal wires
        svgHtml += `<line x1="${leftBusX}" x2="${leftBusX + (rightBusX - leftBusX - rWidth) / 2}" y1="${y}" y2="${y}" stroke="#64748b" stroke-width="2" />`;
        svgHtml += `<line x1="${rightBusX - (rightBusX - leftBusX - rWidth) / 2}" x2="${rightBusX}" y1="${y}" y2="${y}" stroke="#64748b" stroke-width="2" />`;

        // Resistor body
        const rx = leftBusX + (rightBusX - leftBusX - rWidth) / 2;
        svgHtml += `
          <g>
            <rect x="${rx}" y="${y - rHeight / 2}" width="${rWidth}" height="${rHeight}" rx="3" fill="#111827" stroke="var(--accent-green)" stroke-width="2" />
            <text x="${rx + rWidth / 2}" y="${y - rHeight / 2 - 4}" fill="var(--text-secondary)" font-family="sans-serif" font-size="9" font-weight="bold" text-anchor="middle">${res.name}</text>
            <text x="${rx + rWidth / 2}" y="${y + 4}" fill="var(--accent-green)" font-family="monospace" font-size="8.5" font-weight="bold" text-anchor="middle">${res.displayVal}</text>
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

    if (activeResistors.length === 0) {
      resultVal.textContent = "0.00 Ω";
      resultMath.textContent = "Please enter positive resistor values.";
      if (window.currentView === "resistor-view" && typeof window.updateDmmLcd === "function") {
        window.updateDmmLcd("0.0", "Ω", "REQ COMBINATION");
      }
      drawComboSchematic();
      return;
    }

    if (mode === "series") {
      req = activeResistors.reduce((sum, val) => sum + val, 0);
      
      const valuesStr = activeResistors.map(v => formatValue(v)).join(" + ");
      mathStr = `Req = R1 + R2 + ... = ${valuesStr} = ${formatValue(req)}`;
    } 
    else {
      // Parallel calculation: Req = 1 / (1/R1 + 1/R2 + ...)
      const reciprocalSum = activeResistors.reduce((sum, val) => sum + (1 / val), 0);
      req = 1 / reciprocalSum;

      const reciprocalTerms = activeResistors.map(v => `1/${formatValue(v)}`).join(" + ");
      mathStr = `Req = 1 / (${reciprocalTerms}) = 1 / (${reciprocalSum.toExponential(4)}) = ${formatValue(req)}`;
    }

    const formatted = formatValue(req);
    resultVal.textContent = formatted;
    resultMath.textContent = mathStr;

    // Update Multimeter LCD screen
    if (window.currentView === "resistor-view" && typeof window.updateDmmLcd === "function") {
      const parts = formatted.split(" ");
      window.updateDmmLcd(parts[0], parts[1], "REQ COMBINATION");
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

  // Add resistor row trigger
  if (btnAddResistor) {
    btnAddResistor.addEventListener("click", () => {
      if (typeof window.playDmmClickSound === "function") window.playDmmClickSound();
      comboResistors.push({
        id: nextResistorId++,
        val: null,
        valStr: ""
      });
      renderResistorRows();
      window.calculateCombinations();
    });
  }

  // Startup Init
  renderResistorRows();
  window.calculateCombinations();
});
