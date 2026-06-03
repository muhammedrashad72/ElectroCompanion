// js/resistor.js - Resistor Color Code Calculator

document.addEventListener("DOMContentLoaded", () => {
  // Top level tools tabs switcher
  const toolsTabs = document.querySelectorAll("#resistor-tools-tabs .tab-btn");
  const secColorCode = document.getElementById("resistor-color-calculator-section");
  const secSmdCode = document.getElementById("resistor-smd-section");
  const secCombinations = document.getElementById("resistor-combinations-section");

  if (toolsTabs) {
    toolsTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        toolsTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        
        const tool = tab.getAttribute("data-tool");
        if (secColorCode) secColorCode.style.display = (tool === "color-code") ? "block" : "none";
        if (secSmdCode) secSmdCode.style.display = (tool === "smd-code") ? "block" : "none";
        if (secCombinations) secCombinations.style.display = (tool === "combinations") ? "block" : "none";

        // Play click sounds and trigger haptics
        if (typeof window.playDmmClickSound === "function") window.playDmmClickSound();
        if (typeof window.triggerHapticVibration === "function") window.triggerHapticVibration();

        // Update DMM LCD screen based on active sub-tool
        if (tool === "color-code") {
          window.calculateResistorFromColors();
        } else if (tool === "smd-code") {
          if (typeof window.decodeSmdCode === "function") {
            window.decodeSmdCode();
          }
        } else if (tool === "combinations") {
          if (typeof window.calculateCombinations === "function") {
            window.calculateCombinations();
          }
        }
      });
    });
  }

  // DOM Elements - Resistor
  const tabBands = document.querySelectorAll("#resistor-bands-tabs .tab-btn");
  const resistorResultVal = document.getElementById("resistor-result-val");
  const resistorResultSub = document.getElementById("resistor-result-sub");
  const valToColorInput = document.getElementById("val-to-color-input");
  const valToColorTolerance = document.getElementById("val-to-color-tolerance");
  const valToColorBtn = document.getElementById("val-to-color-btn");
  const valToColorError = document.getElementById("val-to-color-error");
  const bandSelectionContainer = document.getElementById("band-selection-container");

  // State
  let resistorBandsCount = 4;
  let activeResistorColors = {
    band1: "yellow",
    band2: "violet",
    band3: "red",      // used for 4, 5, 6 bands (3rd digit for 5/6 bands, multiplier for 4 band)
    band4: "gold",     // used for multiplier (5/6 bands) or tolerance (4 band)
    band5: "brown",    // used for tolerance (5/6 bands)
    band6: "brown"     // used for temp coeff (6 bands)
  };

  function updateResistorBandCount(bands) {
    resistorBandsCount = bands;
    
    // Toggle active band tab
    tabBands.forEach(tab => {
      if (parseInt(tab.getAttribute("data-bands")) === bands) {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
    });

    // Re-render color selection interface based on active band count
    buildBandColorSelectors();
    
    // Recalculate resistor
    window.calculateResistorFromColors();
    updateResistorSvg();
  }

  tabBands.forEach(tab => {
    tab.addEventListener("click", () => {
      const bands = parseInt(tab.getAttribute("data-bands"));
      updateResistorBandCount(bands);
    });
  });

  // Generate color palette dots for the bands dynamically
  function buildBandColorSelectors() {
    if (!bandSelectionContainer) return;
    bandSelectionContainer.innerHTML = "";
    
    const bandConfigs = [];
    if (resistorBandsCount === 4) {
      bandConfigs.push({ id: "band1", label: "1st Digit", options: getColorsByRole("digit") });
      bandConfigs.push({ id: "band2", label: "2nd Digit", options: getColorsByRole("digit") });
      bandConfigs.push({ id: "band3", label: "Multiplier", options: getColorsByRole("multiplier") });
      bandConfigs.push({ id: "band4", label: "Tolerance", options: getColorsByRole("tolerance") });
    } else if (resistorBandsCount === 5) {
      bandConfigs.push({ id: "band1", label: "1st Digit", options: getColorsByRole("digit") });
      bandConfigs.push({ id: "band2", label: "2nd Digit", options: getColorsByRole("digit") });
      bandConfigs.push({ id: "band3", label: "3rd Digit", options: getColorsByRole("digit") });
      bandConfigs.push({ id: "band4", label: "Multiplier", options: getColorsByRole("multiplier") });
      bandConfigs.push({ id: "band5", label: "Tolerance", options: getColorsByRole("tolerance") });
    } else if (resistorBandsCount === 6) {
      bandConfigs.push({ id: "band1", label: "1st Digit", options: getColorsByRole("digit") });
      bandConfigs.push({ id: "band2", label: "2nd Digit", options: getColorsByRole("digit") });
      bandConfigs.push({ id: "band3", label: "3rd Digit", options: getColorsByRole("digit") });
      bandConfigs.push({ id: "band4", label: "Multiplier", options: getColorsByRole("multiplier") });
      bandConfigs.push({ id: "band5", label: "Tolerance", options: getColorsByRole("tolerance") });
      bandConfigs.push({ id: "band6", label: "Temp. Coeff.", options: getColorsByRole("tempCoeff") });
    }

    bandConfigs.forEach(cfg => {
      const row = document.createElement("div");
      row.className = "band-row";
      
      const label = document.createElement("span");
      label.className = "band-label";
      label.textContent = cfg.label;
      
      const dotsContainer = document.createElement("div");
      dotsContainer.className = "color-option-container";
      
      cfg.options.forEach(color => {
        const dot = document.createElement("div");
        dot.className = `color-dot dot-${color}`;
        dot.title = color.charAt(0).toUpperCase() + color.slice(1);
        dot.style.color = getHexForColor(color);
        
        if (activeResistorColors[cfg.id] === color) {
          dot.classList.add("active");
        }

        dot.addEventListener("click", () => {
          activeResistorColors[cfg.id] = color;
          
          dotsContainer.querySelectorAll(".color-dot").forEach(d => d.classList.remove("active"));
          dot.classList.add("active");
          
          window.calculateResistorFromColors();
          updateResistorSvg();
        });

        dotsContainer.appendChild(dot);
      });

      row.appendChild(label);
      row.appendChild(dotsContainer);
      bandSelectionContainer.appendChild(row);
    });
  }

  function getColorsByRole(role) {
    return Object.keys(RESISTOR_COLORS).filter(color => {
      const details = RESISTOR_COLORS[color];
      if (role === "digit") return details.value !== -1 && color !== "gold" && color !== "silver";
      if (role === "multiplier") return details.multiplier !== null;
      if (role === "tolerance") return details.tolerance !== null;
      if (role === "tempCoeff") return details.tempCoeff !== null;
      return false;
    });
  }

  function getHexForColor(color) {
    const hexMap = {
      black: "#000000", brown: "#8B4513", red: "#FF0000", orange: "#FFA500",
      yellow: "#FFFF00", green: "#008000", blue: "#0000FF", violet: "#EE82EE",
      grey: "#808080", white: "#FFFFFF", gold: "#FFD700", silver: "#C0C0C0"
    };
    return hexMap[color] || "#ffffff";
  }

  function updateResistorSvg() {
    const svgBands = {
      b1: document.getElementById("res-band-1"),
      b2: document.getElementById("res-band-2"),
      b3: document.getElementById("res-band-3"),
      b4: document.getElementById("res-band-4"),
      b5: document.getElementById("res-band-5"),
      b6: document.getElementById("res-band-6")
    };

    const colorHex = {
      band1: getHexForColor(activeResistorColors.band1),
      band2: getHexForColor(activeResistorColors.band2),
      band3: getHexForColor(activeResistorColors.band3),
      band4: getHexForColor(activeResistorColors.band4),
      band5: getHexForColor(activeResistorColors.band5),
      band6: getHexForColor(activeResistorColors.band6)
    };

    if (!svgBands.b1) return;

    if (resistorBandsCount === 4) {
      svgBands.b1.setAttribute("fill", colorHex.band1);
      svgBands.b2.setAttribute("fill", colorHex.band2);
      svgBands.b3.setAttribute("fill", colorHex.band3); // multiplier
      svgBands.b4.setAttribute("fill", colorHex.band4); // tolerance
      svgBands.b5.setAttribute("fill", "transparent");
      svgBands.b6.setAttribute("fill", "transparent");
    } 
    else if (resistorBandsCount === 5) {
      svgBands.b1.setAttribute("fill", colorHex.band1);
      svgBands.b2.setAttribute("fill", colorHex.band2);
      svgBands.b3.setAttribute("fill", colorHex.band3); // digit 3
      svgBands.b4.setAttribute("fill", colorHex.band4); // multiplier
      svgBands.b5.setAttribute("fill", colorHex.band5); // tolerance
      svgBands.b6.setAttribute("fill", "transparent");
    } 
    else if (resistorBandsCount === 6) {
      svgBands.b1.setAttribute("fill", colorHex.band1);
      svgBands.b2.setAttribute("fill", colorHex.band2);
      svgBands.b3.setAttribute("fill", colorHex.band3); // digit 3
      svgBands.b4.setAttribute("fill", colorHex.band4); // multiplier
      svgBands.b5.setAttribute("fill", colorHex.band5); // tolerance
      svgBands.b6.setAttribute("fill", colorHex.band6); // tempCoeff
    }
  }

  // Shared calculation function
  window.calculateResistorFromColors = function() {
    if (!resistorResultVal || !resistorResultSub) return;

    let value = 0;
    let tolerance = "";
    let tempCoeff = "";
    let suffix = " Ω";

    const d1 = RESISTOR_COLORS[activeResistorColors.band1].value;
    const d2 = RESISTOR_COLORS[activeResistorColors.band2].value;

    if (resistorBandsCount === 4) {
      const mult = RESISTOR_COLORS[activeResistorColors.band3].multiplier;
      const tol = RESISTOR_COLORS[activeResistorColors.band4].tolerance;
      
      value = (d1 * 10 + d2) * mult;
      tolerance = `±${tol}%`;
    } 
    else if (resistorBandsCount === 5) {
      const d3 = RESISTOR_COLORS[activeResistorColors.band3].value;
      const mult = RESISTOR_COLORS[activeResistorColors.band4].multiplier;
      const tol = RESISTOR_COLORS[activeResistorColors.band5].tolerance;

      value = (d1 * 100 + d2 * 10 + d3) * mult;
      tolerance = `±${tol}%`;
    } 
    else if (resistorBandsCount === 6) {
      const d3 = RESISTOR_COLORS[activeResistorColors.band3].value;
      const mult = RESISTOR_COLORS[activeResistorColors.band4].multiplier;
      const tol = RESISTOR_COLORS[activeResistorColors.band5].tolerance;
      const tc = RESISTOR_COLORS[activeResistorColors.band6].tempCoeff;

      value = (d1 * 100 + d2 * 10 + d3) * mult;
      tolerance = `±${tol}%`;
      tempCoeff = ` | ${tc} ppm/K`;
    }

    // Format output
    let formattedValue = value;
    if (value >= 1e9) {
      formattedValue = (value / 1e9).toFixed(2).replace(/\.00$/, "") + " G";
    } else if (value >= 1e6) {
      formattedValue = (value / 1e6).toFixed(2).replace(/\.00$/, "") + " M";
    } else if (value >= 1e3) {
      formattedValue = (value / 1e3).toFixed(2).replace(/\.00$/, "") + " k";
    } else {
      formattedValue = value.toFixed(2).replace(/\.00$/, "");
    }

    resistorResultVal.textContent = `${formattedValue}${suffix}`;
    resistorResultSub.textContent = `Tolerance: ${tolerance}${tempCoeff}`;
    if (window.currentView === "resistor-view" && typeof window.updateDmmLcd === "function") {
      window.updateDmmLcd(formattedValue, "Ω", "RESISTOR VALUE");
    }
  };

  // VALUE TO COLOR DECODER
  function parseResistorInput(inputStr) {
    let cleaned = inputStr.toLowerCase().trim().replace(/ohm[s]?|Ω/g, "").trim();
    if (!cleaned) return null;

    let multiplier = 1;
    let baseValStr = cleaned;

    if (cleaned.includes('k')) {
      multiplier = 1000;
      baseValStr = cleaned.replace('k', '.');
      if (baseValStr.endsWith('.')) baseValStr = baseValStr.slice(0, -1);
      if (baseValStr.startsWith('.')) baseValStr = '0' + baseValStr;
    } else if (cleaned.includes('m')) {
      multiplier = 1000000;
      baseValStr = cleaned.replace('m', '.');
      if (baseValStr.endsWith('.')) baseValStr = baseValStr.slice(0, -1);
      if (baseValStr.startsWith('.')) baseValStr = '0' + baseValStr;
    } else if (cleaned.includes('g')) {
      multiplier = 1000000000;
      baseValStr = cleaned.replace('g', '.');
      if (baseValStr.endsWith('.')) baseValStr = baseValStr.slice(0, -1);
      if (baseValStr.startsWith('.')) baseValStr = '0' + baseValStr;
    } else if (cleaned.includes('r')) {
      multiplier = 1;
      baseValStr = cleaned.replace('r', '.');
      if (baseValStr.endsWith('.')) baseValStr = baseValStr.slice(0, -1);
      if (baseValStr.startsWith('.')) baseValStr = '0' + baseValStr;
    }

    const numeric = parseFloat(baseValStr) * multiplier;
    if (isNaN(numeric) || numeric <= 0) return null;
    return numeric;
  }

  function convertValueToColors() {
    if (!valToColorError) return;
    valToColorError.style.display = "none";
    const rawInput = valToColorInput.value;
    const targetTolerance = valToColorTolerance.value;
    const ohms = parseResistorInput(rawInput);

    if (ohms === null) {
      valToColorError.textContent = "Invalid resistance input! Use formats like: 4.7k, 4k7, 100R, 1M, 220.";
      valToColorError.style.display = "block";
      return;
    }

    let bandCountToUse = 4;
    
    const scientific = ohms.toExponential();
    const parts = scientific.split('e');
    const coeff = parseFloat(parts[0]);
    
    const coeff4 = Math.round(coeff * 10);
    const coeffDiff = Math.abs(coeff * 10 - coeff4);
    
    if (coeffDiff > 0.01 && (ohms % 1 !== 0 || ohms < 100)) {
      bandCountToUse = 5;
    }

    let colors = {};
    if (bandCountToUse === 4) {
      let scale = Math.floor(Math.log10(ohms)) - 1;
      let divisor = Math.pow(10, scale);
      let digits = Math.round(ohms / divisor);
      
      if (digits >= 100) {
        scale += 1;
        divisor = Math.pow(10, scale);
        digits = Math.round(ohms / divisor);
      }

      const d1 = Math.floor(digits / 10);
      const d2 = digits % 10;
      const mult = divisor;

      const c1 = getColorNameByValue(d1, "digit");
      const c2 = getColorNameByValue(d2, "digit");
      const c3 = getColorNameByMultiplier(mult);

      if (!c1 || !c2 || !c3) {
        valToColorError.textContent = "Resistance value out of standard 4-band range.";
        valToColorError.style.display = "block";
        return;
      }

      colors.band1 = c1;
      colors.band2 = c2;
      colors.band3 = c3;
      colors.band4 = targetTolerance;
    } 
    else {
      bandCountToUse = 5;
      let scale = Math.floor(Math.log10(ohms)) - 2;
      let divisor = Math.pow(10, scale);
      let digits = Math.round(ohms / divisor);

      if (digits >= 1000) {
        scale += 1;
        divisor = Math.pow(10, scale);
        digits = Math.round(ohms / divisor);
      }

      const d1 = Math.floor(digits / 100);
      const d2 = Math.floor((digits % 100) / 10);
      const d3 = digits % 10;
      const mult = divisor;

      const c1 = getColorNameByValue(d1, "digit");
      const c2 = getColorNameByValue(d2, "digit");
      const c3 = getColorNameByValue(d3, "digit");
      const c4 = getColorNameByMultiplier(mult);

      if (!c1 || !c2 || !c3 || !c4) {
        valToColorError.textContent = "Resistance value out of standard 5-band range.";
        valToColorError.style.display = "block";
        return;
      }

      colors.band1 = c1;
      colors.band2 = c2;
      colors.band3 = c3;
      colors.band4 = c4;
      colors.band5 = targetTolerance === "gold" ? "brown" : targetTolerance;
    }

    activeResistorColors = { ...activeResistorColors, ...colors };
    updateResistorBandCount(bandCountToUse);
  }

  function getColorNameByValue(val, role) {
    return Object.keys(RESISTOR_COLORS).find(color => {
      const details = RESISTOR_COLORS[color];
      return details.value === val && (role === "digit" ? color !== "gold" && color !== "silver" : true);
    });
  }

  function getColorNameByMultiplier(mult) {
    return Object.keys(RESISTOR_COLORS).find(color => {
      const details = RESISTOR_COLORS[color];
      if (details.multiplier === null) return false;
      return Math.abs(details.multiplier - mult) < (mult * 0.01);
    });
  }

  if (valToColorBtn) {
    valToColorBtn.addEventListener("click", convertValueToColors);
  }
  if (valToColorInput) {
    valToColorInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") convertValueToColors();
    });
  }

  // Initialize Resistor UI
  updateResistorBandCount(4);
});
