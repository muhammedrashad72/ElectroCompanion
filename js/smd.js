// js/smd.js - SMD Resistor Decoder & Encoder

document.addEventListener("DOMContentLoaded", () => {
  const smdCodeInput = document.getElementById("smd-code-input");
  const smdResultVal = document.getElementById("smd-result-val");
  const smdResultSub = document.getElementById("smd-result-sub");
  const smdTextSvg = document.getElementById("smd-text-svg");
  const smdValInput = document.getElementById("smd-val-input");
  const smdValError = document.getElementById("smd-val-error");
  const smdEncodedOutput = document.getElementById("smd-encoded-output");

  // EIA-96 lookup table: code (01-96) mapped to 3-digit base value
  const EIA96_TABLE = {
    "01": 100, "02": 102, "03": 105, "04": 107, "05": 110, "06": 113, "07": 115, "08": 118, "09": 121, "10": 124,
    "11": 127, "12": 130, "13": 133, "14": 137, "15": 140, "16": 143, "17": 147, "18": 150, "19": 154, "20": 158,
    "21": 162, "22": 165, "23": 169, "24": 174, "25": 178, "26": 182, "27": 187, "28": 191, "29": 196, "30": 200,
    "31": 205, "32": 210, "33": 215, "34": 221, "35": 226, "36": 232, "37": 237, "38": 243, "39": 249, "40": 255,
    "41": 261, "42": 267, "43": 274, "44": 280, "45": 287, "46": 294, "47": 301, "48": 309, "49": 316, "50": 324,
    "51": 332, "52": 340, "53": 348, "54": 357, "55": 365, "56": 374, "57": 383, "58": 392, "59": 402, "60": 412,
    "61": 422, "62": 432, "63": 442, "64": 453, "65": 464, "66": 475, "67": 487, "68": 499, "69": 511, "70": 523,
    "71": 536, "72": 549, "73": 562, "74": 576, "75": 590, "76": 604, "77": 619, "78": 634, "79": 649, "80": 665,
    "81": 681, "82": 698, "83": 715, "84": 732, "85": 750, "86": 768, "87": 787, "88": 806, "89": 825, "90": 845,
    "91": 866, "92": 887, "93": 909, "94": 931, "95": 953, "96": 976
  };

  // EIA-96 multipliers
  const EIA96_MULT = {
    "Z": 0.001,
    "Y": 0.01, "S": 0.01,
    "X": 0.1,  "R": 0.1,
    "A": 1,
    "B": 10,   "H": 10,
    "C": 100,
    "D": 1000,
    "E": 10000,
    "F": 100000
  };

  function formatValue(ohms) {
    if (ohms >= 1e6) {
      return `${(ohms / 1e6).toFixed(2).replace(/\.00$/, "")} MΩ`;
    } else if (ohms >= 1e3) {
      return `${(ohms / 1e3).toFixed(2).replace(/\.00$/, "")} kΩ`;
    } else {
      return `${ohms.toFixed(2).replace(/\.00$/, "")} Ω`;
    }
  }

  // Decodes SMD resistor markings code
  window.decodeSmdCode = function() {
    if (!smdCodeInput || !smdResultVal || !smdResultSub) return;

    let code = smdCodeInput.value.trim().toUpperCase();
    if (code === "") {
      smdResultVal.textContent = "--- Ω";
      smdResultSub.textContent = "Please enter an SMD resistor code.";
      if (smdTextSvg) smdTextSvg.textContent = "103";
      if (window.currentView === "resistor-view" && typeof window.updateDmmLcd === "function") {
        window.updateDmmLcd("---", "", "SMD READY");
      }
      return;
    }

    if (smdTextSvg) smdTextSvg.textContent = code;

    let ohms = null;
    let details = "";
    let codeType = "";

    // 1. Check 3-Digit Code (e.g. 103, 220)
    if (/^\d{3}$/.test(code)) {
      codeType = "3-Digit Code (5% Tolerance)";
      const d1 = parseInt(code[0]);
      const d2 = parseInt(code[1]);
      const exp = parseInt(code[2]);
      ohms = (d1 * 10 + d2) * Math.pow(10, exp);
      details = `Digits: ${d1}${d2} | Multiplier: 10^${exp}`;
    }
    // 2. Check 3-Digit with R decimal point (e.g. 4R7, R22)
    else if (/^(\d+)R(\d+)$/.test(code) && code.length === 3) {
      codeType = "3-Digit Code (5% Tolerance)";
      const match = code.match(/^(\d+)R(\d+)$/);
      ohms = parseFloat(match[1] + "." + match[2]);
      details = `Decimal point placement (R) | Value: ${ohms} Ω`;
    }
    else if (/^R(\d+)$/.test(code) && code.length === 3) {
      codeType = "3-Digit Code (5% Tolerance)";
      const match = code.match(/^R(\d+)$/);
      ohms = parseFloat("0." + match[1]);
      details = `Decimal point placement (R) | Value: ${ohms} Ω`;
    }
    else if (/^(\d+)R$/.test(code) && code.length === 3) {
      codeType = "3-Digit Code (5% Tolerance)";
      const match = code.match(/^(\d+)R$/);
      ohms = parseFloat(match[1]);
      details = `Decimal point placement (R) | Value: ${ohms} Ω`;
    }
    // 3. Check 4-Digit Code (e.g. 1002, 4701)
    else if (/^\d{4}$/.test(code)) {
      codeType = "4-Digit Code (1% Tolerance)";
      const d1 = parseInt(code[0]);
      const d2 = parseInt(code[1]);
      const d3 = parseInt(code[2]);
      const exp = parseInt(code[3]);
      ohms = (d1 * 100 + d2 * 10 + d3) * Math.pow(10, exp);
      details = `Digits: ${d1}${d2}${d3} | Multiplier: 10^${exp}`;
    }
    // 4. Check 4-Digit with R decimal point (e.g. 22R0, R220, 1R50)
    else if (code.includes("R") && code.length === 4) {
      codeType = "4-Digit Code (1% Tolerance)";
      if (/^(\d+)R(\d+)$/.test(code)) {
        const match = code.match(/^(\d+)R(\d+)$/);
        ohms = parseFloat(match[1] + "." + match[2]);
      } else if (/^R(\d+)$/.test(code)) {
        const match = code.match(/^R(\d+)$/);
        ohms = parseFloat("0." + match[1]);
      } else if (/^(\d+)R$/.test(code)) {
        const match = code.match(/^(\d+)R$/);
        ohms = parseFloat(match[1]);
      }
      details = `Decimal point placement (R) | Value: ${ohms} Ω`;
    }
    // 5. Check EIA-96 Code (e.g. 01C, 66B)
    else if (/^(\d{2})([A-Z])$/i.test(code)) {
      const match = code.match(/^(\d{2})([A-Z])$/i);
      const digitCode = match[1];
      const letterCode = match[2].toUpperCase();

      if (EIA96_TABLE[digitCode] !== undefined && EIA96_MULT[letterCode] !== undefined) {
        codeType = "EIA-96 Code (1% Precision)";
        const baseValue = EIA96_TABLE[digitCode];
        const mult = EIA96_MULT[letterCode];
        ohms = baseValue * mult;
        details = `Table Code: ${digitCode} (${baseValue}) | Multiplier ${letterCode}: ×${mult}`;
      }
    }

    // Output Result
    if (ohms !== null && !isNaN(ohms)) {
      const formatted = formatValue(ohms);
      smdResultVal.textContent = formatted;
      smdResultSub.textContent = `Type: ${codeType} | ${details}`;
      
      if (window.currentView === "resistor-view" && typeof window.updateDmmLcd === "function") {
        const parts = formatted.split(" ");
        window.updateDmmLcd(parts[0], parts[1], "SMD RESISTOR");
      }
    } else {
      smdResultVal.textContent = "Error";
      smdResultSub.textContent = "Invalid SMD Resistor code format.";
      if (window.currentView === "resistor-view" && typeof window.updateDmmLcd === "function") {
        window.updateDmmLcd("Error", "", "SMD CODE ERROR");
      }
    }
  };

  // Parses value string to raw ohms (e.g., 4.7k -> 4700)
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

    // Fix double dots or ending dots
    if (base.endsWith('.')) base = base.slice(0, -1);
    if (base.startsWith('.')) base = '0' + base;

    const val = parseFloat(base) * multiplier;
    return isNaN(val) || val <= 0 ? null : val;
  }

  // Encodes raw ohms into possible SMD markings codes
  function encodeOhmsToSmd() {
    if (!smdValInput || !smdEncodedOutput || !smdValError) return;
    
    smdValError.style.display = "none";
    smdEncodedOutput.innerHTML = "";

    const rawInput = smdValInput.value.trim();
    if (rawInput === "") return;

    const ohms = parseValueToOhms(rawInput);
    if (ohms === null) {
      smdValError.textContent = "Invalid resistance input! e.g., 10k, 220, 1.5M, 4.7";
      smdValError.style.display = "block";
      return;
    }

    const suggestions = [];

    // --- 1. Compute 3-Digit Code (5% Tolerance) ---
    let code3d = "";
    if (ohms < 0.1 || ohms >= 100e9) {
      code3d = "N/A (Out of range)";
    } else if (ohms < 10) {
      // E.g. 4.7 -> 4R7, 0.22 -> R22, 1.0 -> 1R0
      if (ohms % 1 === 0) {
        code3d = `${Math.floor(ohms)}R0`;
      } else {
        const str = ohms.toFixed(2).replace(/\.?0+$/, "");
        if (str.startsWith("0.")) {
          code3d = `R${str.slice(2)}`;
        } else {
          code3d = str.replace(".", "R");
        }
      }
    } else {
      let exp = Math.floor(Math.log10(ohms)) - 1;
      let mantissa = Math.round(ohms / Math.pow(10, exp));
      if (mantissa >= 100) {
        mantissa = Math.round(mantissa / 10);
        exp += 1;
      }
      if (exp <= 9) {
        code3d = `${mantissa}${exp}`;
      } else {
        code3d = "N/A";
      }
    }
    if (code3d.length > 4) code3d = "N/A";
    suggestions.push({ type: "3-Digit Code (5% tol)", code: code3d });

    // --- 2. Compute 4-Digit Code (1% Tolerance) ---
    let code4d = "";
    if (ohms < 0.1 || ohms >= 100e9) {
      code4d = "N/A (Out of range)";
    } else if (ohms < 100) {
      // E.g. 47.5 -> 47R5, 1.5 -> 1R50, 0.1 -> R100
      const formatted = ohms.toFixed(3).replace(/\.?0+$/, "");
      if (formatted.startsWith("0.")) {
        code4d = `R${(ohms * 1000).toFixed(0).padStart(3, "0")}`;
      } else {
        const parts = formatted.split(".");
        const whole = parts[0];
        const frac = parts[1] || "";
        const combined = whole + frac;
        if (combined.length <= 3) {
          code4d = whole + "R" + frac.padEnd(3 - whole.length, "0");
        } else {
          code4d = whole + "R" + frac.slice(0, 1);
        }
      }
    } else {
      let exp = Math.floor(Math.log10(ohms)) - 2;
      let mantissa = Math.round(ohms / Math.pow(10, exp));
      if (mantissa >= 1000) {
        mantissa = Math.round(mantissa / 10);
        exp += 1;
      }
      if (exp <= 9) {
        code4d = `${mantissa}${exp}`;
      } else {
        code4d = "N/A";
      }
    }
    if (code4d.length > 5) code4d = "N/A";
    suggestions.push({ type: "4-Digit Code (1% tol)", code: code4d });

    // --- 3. Compute EIA-96 Code (1% Precision) ---
    let codeEia = "N/A";
    // Find matching base value and multiplier in table
    // EIA-96 digits: base values 100 to 976. Let's find multiplier exp
    let eiaMultLetter = "";
    let eiaDigitCode = "";
    
    for (let key in EIA96_MULT) {
      const scale = EIA96_MULT[key];
      const base = ohms / scale;
      const roundedBase = Math.round(base);
      
      if (Math.abs(base - roundedBase) < (base * 0.005)) { // within 0.5% tolerance
        // Look up roundedBase in table values
        const tableCode = Object.keys(EIA96_TABLE).find(k => EIA96_TABLE[k] === roundedBase);
        if (tableCode) {
          eiaDigitCode = tableCode;
          eiaMultLetter = key;
          break;
        }
      }
    }

    if (eiaDigitCode && eiaMultLetter) {
      codeEia = `${eiaDigitCode}${eiaMultLetter}`;
    }
    suggestions.push({ type: "EIA-96 Code (1% precision)", code: codeEia });

    // Render codes table
    suggestions.forEach(item => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justify = "space-between";
      row.style.borderBottom = "1px solid rgba(255, 255, 255, 0.04)";
      row.style.padding = "4px 0";
      row.innerHTML = `
        <span style="color:var(--text-secondary);">${item.type}:</span>
        <span style="color:var(--accent-amber); font-weight:700;">${item.code}</span>
      `;
      smdEncodedOutput.appendChild(row);
    });
  }

  // Attach event listeners
  if (smdCodeInput) {
    smdCodeInput.addEventListener("input", window.decodeSmdCode);
  }

  if (smdValInput) {
    smdValInput.addEventListener("input", encodeOhmsToSmd);
  }

  // Pre-load code decode
  window.decodeSmdCode();
});
