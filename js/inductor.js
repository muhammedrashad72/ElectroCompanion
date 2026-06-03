// js/inductor.js - Inductor Color Code Calculator

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements - Inductor
  const inductorBandSelectionContainer = document.getElementById("inductor-band-selection-container");
  const inductorResultVal = document.getElementById("inductor-result-val");
  const inductorResultSub = document.getElementById("inductor-result-sub");
  const indValToColorInput = document.getElementById("ind-val-to-color-input");
  const indValToColorTolerance = document.getElementById("ind-val-to-color-tolerance");
  const indValToColorBtn = document.getElementById("ind-val-to-color-btn");
  const indValToColorError = document.getElementById("ind-val-to-color-error");

  // Inductor State
  let activeInductorColors = {
    band1: "brown",
    band2: "black",
    band3: "brown",
    band4: "silver"
  };

  window.buildInductorBandSelectors = function() {
    if (!inductorBandSelectionContainer) return;
    inductorBandSelectionContainer.innerHTML = "";

    const bandConfigs = [
      { id: "band1", label: "1st Digit", options: getInductorColorsByRole("digit") },
      { id: "band2", label: "2nd Digit", options: getInductorColorsByRole("digit") },
      { id: "band3", label: "Multiplier", options: getInductorColorsByRole("multiplier") },
      { id: "band4", label: "Tolerance", options: getInductorColorsByRole("tolerance") }
    ];

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

        if (activeInductorColors[cfg.id] === color) {
          dot.classList.add("active");
        }

        dot.addEventListener("click", () => {
          activeInductorColors[cfg.id] = color;
          dotsContainer.querySelectorAll(".color-dot").forEach(d => d.classList.remove("active"));
          dot.classList.add("active");
          window.calculateInductanceFromColors();
          window.updateInductorSvg();
        });

        dotsContainer.appendChild(dot);
      });

      row.appendChild(label);
      row.appendChild(dotsContainer);
      inductorBandSelectionContainer.appendChild(row);
    });
  };

  function getInductorColorsByRole(role) {
    return Object.keys(INDUCTOR_COLORS).filter(color => {
      const details = INDUCTOR_COLORS[color];
      if (role === "digit") return details.value !== -1 && color !== "gold" && color !== "silver";
      if (role === "multiplier") return details.multiplier !== null;
      if (role === "tolerance") return details.tolerance !== null;
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

  window.updateInductorSvg = function() {
    const svgBands = {
      b1: document.getElementById("ind-band-1"),
      b2: document.getElementById("ind-band-2"),
      b3: document.getElementById("ind-band-3"),
      b4: document.getElementById("ind-band-4")
    };
    if (!svgBands.b1) return;

    svgBands.b1.setAttribute("fill", getHexForColor(activeInductorColors.band1));
    svgBands.b2.setAttribute("fill", getHexForColor(activeInductorColors.band2));
    svgBands.b3.setAttribute("fill", getHexForColor(activeInductorColors.band3));
    svgBands.b4.setAttribute("fill", getHexForColor(activeInductorColors.band4));
  };

  window.calculateInductanceFromColors = function() {
    if (!inductorResultVal) return;
    const d1 = INDUCTOR_COLORS[activeInductorColors.band1].value;
    const d2 = INDUCTOR_COLORS[activeInductorColors.band2].value;
    const mult = INDUCTOR_COLORS[activeInductorColors.band3].multiplier;
    const tol = INDUCTOR_COLORS[activeInductorColors.band4].tolerance;

    const valueUh = (d1 * 10 + d2) * mult;

    let formattedValue = "";
    if (valueUh >= 1000) {
      formattedValue = (valueUh / 1000).toFixed(2).replace(/\.00$/, "") + " mH";
    } else {
      formattedValue = valueUh.toFixed(2).replace(/\.00$/, "") + " µH";
    }

    inductorResultVal.textContent = formattedValue;
    inductorResultSub.textContent = `Tolerance: ±${tol}% | Value in µH: ${valueUh.toLocaleString()} µH`;
    if (window.currentView === "inductor-view" && typeof window.updateDmmLcd === "function") {
      const parts = formattedValue.split(" ");
      window.updateDmmLcd(parts[0], parts[1], "INDUCTOR VALUE");
    }
  };

  function parseInductanceInput(inputStr) {
    let cleaned = inputStr.toLowerCase().trim().replace(/h[e]?nry[s]?|h/g, "").trim();
    if (!cleaned) return null;

    let multiplier = 1;
    let baseValStr = cleaned;

    if (cleaned.includes('u') || cleaned.includes('µ')) {
      multiplier = 1;
      baseValStr = cleaned.replace(/u|µ/g, "");
    } else if (cleaned.includes('m')) {
      multiplier = 1000;
      baseValStr = cleaned.replace('m', "");
    } else if (cleaned.includes('n')) {
      multiplier = 0.001;
      baseValStr = cleaned.replace('n', "");
    }

    const numeric = parseFloat(baseValStr) * multiplier;
    if (isNaN(numeric) || numeric <= 0) return null;
    return numeric;
  }

  function convertInductanceToColors() {
    if (!indValToColorError) return;
    indValToColorError.style.display = "none";
    const rawInput = indValToColorInput.value;
    const targetTolerance = indValToColorTolerance.value;
    const valueUh = parseInductanceInput(rawInput);

    if (valueUh === null) {
      indValToColorError.textContent = "Invalid inductance input! Use formats like: 10u, 100uH, 1m, 2.2mH, 0.47.";
      indValToColorError.style.display = "block";
      return;
    }

    const multipliers = [0.01, 0.1, 1, 10, 100, 1000, 10000];
    let bestMult = null;
    let bestDigits = null;
    let minDiff = Infinity;

    for (let m of multipliers) {
      let d = Math.round(valueUh / m);
      if (d >= 10 && d <= 99) {
        let diff = Math.abs(valueUh - d * m);
        if (diff < minDiff) {
          minDiff = diff;
          bestMult = m;
          bestDigits = d;
        }
      }
    }

    if (bestMult === null) {
      indValToColorError.textContent = "Inductance value out of standard 4-band range (0.1µH to 990mH).";
      indValToColorError.style.display = "block";
      return;
    }

    const d1 = Math.floor(bestDigits / 10);
    const d2 = bestDigits % 10;

    const c1 = getInductorColorNameByValue(d1, "digit");
    const c2 = getInductorColorNameByValue(d2, "digit");
    const c3 = getInductorColorNameByMultiplier(bestMult);

    if (!c1 || !c2 || !c3) {
      indValToColorError.textContent = "Error matching standard colors.";
      indValToColorError.style.display = "block";
      return;
    }

    activeInductorColors = {
      band1: c1,
      band2: c2,
      band3: c3,
      band4: targetTolerance
    };

    window.buildInductorBandSelectors();
    window.calculateInductanceFromColors();
    window.updateInductorSvg();
  }

  function getInductorColorNameByValue(val, role) {
    return Object.keys(INDUCTOR_COLORS).find(color => {
      const details = INDUCTOR_COLORS[color];
      return details.value === val && (role === "digit" ? color !== "gold" && color !== "silver" : true);
    });
  }

  function getInductorColorNameByMultiplier(mult) {
    return Object.keys(INDUCTOR_COLORS).find(color => {
      const details = INDUCTOR_COLORS[color];
      if (details.multiplier === null) return false;
      return Math.abs(details.multiplier - mult) < (mult * 0.01);
    });
  }

  if (indValToColorBtn) {
    indValToColorBtn.addEventListener("click", convertInductanceToColors);
  }
  if (indValToColorInput) {
    indValToColorInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") convertInductanceToColors();
    });
  }

  // Initialize UI on startup
  window.buildInductorBandSelectors();
  window.calculateInductanceFromColors();
  window.updateInductorSvg();
});
