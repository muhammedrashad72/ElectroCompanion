// js/capacitor.js - Capacitor Markings Decoder

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements - Capacitor
  const capCodeInput = document.getElementById("cap-code-input");
  const capToleranceSelect = document.getElementById("cap-tolerance-select");
  const capResultVal = document.getElementById("cap-result-val");
  const capResultSub = document.getElementById("cap-result-sub");
  const capTextSvg = document.getElementById("cap-text-svg");
  const capValInput = document.getElementById("cap-val-input");
  const capValTolerance = document.getElementById("cap-val-tolerance");
  const capValBtn = document.getElementById("cap-val-btn");
  const capValError = document.getElementById("cap-val-error");

  window.decodeCapacitor = function() {
    if (!capResultVal || !capResultSub || !capTextSvg) return;
    const rawCode = capCodeInput ? capCodeInput.value.trim() : "";
    const toleranceKey = capToleranceSelect ? capToleranceSelect.value : "none";
    
    if (rawCode === "") {
      capResultVal.textContent = "0 pF";
      capResultSub.textContent = "Please enter a code (e.g., 104)";
      capTextSvg.textContent = "104";
      if (window.currentView === "capacitor-view" && typeof window.updateDmmLcd === "function") {
        window.updateDmmLcd("0.0", "pF", "CAPACITOR VALUE");
      }
      return;
    }

    // Update printed text on SVG cap
    capTextSvg.textContent = rawCode.toUpperCase() + (toleranceKey !== "none" ? toleranceKey : "");

    let valuePf = 0;
    let isValid = true;
    
    if (/^\d{1,2}$/.test(rawCode)) {
      valuePf = parseInt(rawCode);
    } 
    else if (/^\d{3}$/.test(rawCode)) {
      const d1 = parseInt(rawCode[0]);
      const d2 = parseInt(rawCode[1]);
      const multiplier = parseInt(rawCode[2]);
      
      if (multiplier <= 9) {
        if (multiplier === 9) {
          valuePf = (d1 * 10 + d2) * 0.1;
        } else {
          valuePf = (d1 * 10 + d2) * Math.pow(10, multiplier);
        }
      } else {
        isValid = false;
      }
    } 
    else {
      const match = rawCode.match(/^(\d{1,3})([A-Z])$/i);
      if (match) {
        const codeNum = match[1];
        const tolChar = match[2].toUpperCase();
        
        if (/^\d{1,2}$/.test(codeNum)) {
          valuePf = parseInt(codeNum);
        } else {
          const d1 = parseInt(codeNum[0]);
          const d2 = parseInt(codeNum[1]);
          const multiplier = parseInt(codeNum[2]);
          valuePf = (d1 * 10 + d2) * Math.pow(10, multiplier);
        }
        
        if (CAPACITOR_TOLERANCES[tolChar] && capToleranceSelect) {
          capToleranceSelect.value = tolChar;
        }
      } else {
        isValid = false;
      }
    }

    if (!isValid) {
      capResultVal.textContent = "Error";
      capResultSub.textContent = "Format error. Enter 1-3 digits (e.g., 104, 22, 4R7)";
      if (window.currentView === "capacitor-view" && typeof window.updateDmmLcd === "function") {
        window.updateDmmLcd("Error", "", "CAPACITOR ERROR");
      }
      return;
    }

    // Format units
    let formattedVal = "";
    let nF = valuePf / 1000;
    let uF = valuePf / 1000000;

    if (valuePf < 1000) {
      formattedVal = `${valuePf.toFixed(1).replace(/\.0$/, "")} pF`;
    } else if (valuePf < 1000000) {
      formattedVal = `${nF.toFixed(3).replace(/\.?0+$/, "")} nF`;
    } else {
      formattedVal = `${uF.toFixed(4).replace(/\.?0+$/, "")} µF`;
    }

    const toleranceVal = capToleranceSelect ? (CAPACITOR_TOLERANCES[capToleranceSelect.value] || "Not specified") : "Not specified";
    
    capResultVal.textContent = formattedVal;
    capResultSub.textContent = `Tolerance: ${toleranceVal} | Value in pF: ${valuePf.toLocaleString()} pF`;
    if (window.currentView === "capacitor-view" && typeof window.updateDmmLcd === "function") {
      const parts = formattedVal.split(" ");
      window.updateDmmLcd(parts[0], parts[1], "CAPACITOR VALUE");
    }
  };

  if (capCodeInput) {
    capCodeInput.addEventListener("input", window.decodeCapacitor);
  }
  if (capToleranceSelect) {
    capToleranceSelect.addEventListener("change", window.decodeCapacitor);
  }

  // VALUE TO CODE CONVERTER
  function convertCapValueToCode() {
    if (!capValError) return;
    capValError.style.display = "none";
    const rawVal = capValInput.value.trim().toLowerCase();
    
    if (rawVal === "") {
      capValError.textContent = "Please enter a value (e.g. 100n, 47p, 0.1uF).";
      capValError.style.display = "block";
      return;
    }

    const match = rawVal.match(/^([0-9.]+)\s*(pf|nf|uf|µf|mf|f|p|n|u|µ|m)?$/i);
    if (!match) {
      capValError.textContent = "Invalid capacitance format! Use formats like: 100n, 10nF, 0.1uF, 47p, 10u, 1000pF.";
      capValError.style.display = "block";
      return;
    }

    const value = parseFloat(match[1]);
    const unit = match[2];
    
    if (isNaN(value) || value <= 0) {
      capValError.textContent = "Please enter a positive numeric value.";
      capValError.style.display = "block";
      return;
    }

    let valuePf = 0;
    if (!unit) {
      if (rawVal.includes('.')) {
        valuePf = value * 1000000;
      } else {
        valuePf = value;
      }
    } else {
      if (unit.startsWith('p')) {
        valuePf = value;
      } else if (unit.startsWith('n')) {
        valuePf = value * 1000;
      } else if (unit.startsWith('u') || unit.startsWith('µ')) {
        valuePf = value * 1000000;
      } else if (unit.startsWith('m')) {
        valuePf = value * 1000000000;
      } else if (unit === 'f') {
        valuePf = value * 1000000000000;
      }
    }

    let code = "";
    if (valuePf < 10) {
      code = valuePf.toFixed(1).replace('.', 'R').replace(/R0$/, '');
    } else {
      let exp = Math.floor(Math.log10(valuePf)) - 1;
      let multiplier = Math.pow(10, exp);
      let digits = Math.round(valuePf / multiplier);
      
      if (digits >= 100) {
        exp += 1;
        digits = Math.round(digits / 10);
      }
      
      code = `${digits}${exp}`;
    }

    if (capCodeInput) {
      capCodeInput.value = code;
      const targetTolerance = capValTolerance ? capValTolerance.value : "K";
      if (capToleranceSelect) {
        capToleranceSelect.value = targetTolerance;
      }
      window.decodeCapacitor();
    }
  }

  if (capValBtn) {
    capValBtn.addEventListener("click", convertCapValueToCode);
  }
  if (capValInput) {
    capValInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") convertCapValueToCode();
    });
  }

  // Initialize Capacitor UI
  window.decodeCapacitor();
});
