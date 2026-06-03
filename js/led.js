// js/led.js - LED Current Limiting Resistor Calculator

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements - LED Calculator
  const ledTypeSelect = document.getElementById("led-type-select");
  const ledVsourceInput = document.getElementById("led-vsource");
  const ledVledInput = document.getElementById("led-vled");
  const ledIledInput = document.getElementById("led-iled");
  const ledResultResist = document.getElementById("led-result-resist");
  const ledResultPower = document.getElementById("led-result-power");
  const ledResultWarning = document.getElementById("led-result-warning");

  window.calculateLedResistor = function() {
    if (!ledResultResist || !ledResultPower) return;
    const vsource = parseFloat(ledVsourceInput.value);
    const vled = parseFloat(ledVledInput.value);
    const iledMa = parseFloat(ledIledInput.value);
    
    if (ledResultWarning) ledResultWarning.style.display = "none";

    if (isNaN(vsource) || isNaN(vled) || isNaN(iledMa) || vsource <= 0 || vled <= 0 || iledMa <= 0) {
      ledResultResist.textContent = "--- Ω";
      ledResultPower.textContent = "--- W";
      if (window.currentView === "led-view" && typeof window.updateDmmLcd === "function") {
        window.updateDmmLcd("---", "", "LED READY");
      }
      return;
    }

    if (vled >= vsource) {
      ledResultResist.textContent = "Error";
      ledResultPower.textContent = "--- W";
      if (ledResultWarning) {
        ledResultWarning.textContent = "LED Voltage drop (Vf) must be LESS than the source voltage (Vs)!";
        ledResultWarning.style.display = "block";
      }
      if (window.currentView === "led-view" && typeof window.updateDmmLcd === "function") {
        window.updateDmmLcd("Error", "", "LED VS LIMIT");
      }
      return;
    }

    const iledA = iledMa / 1000;
    const resistance = (vsource - vled) / iledA;
    const power = Math.pow(iledA, 2) * resistance;

    const recommendedPower = power * 2;
    let powerRatingString = "";
    
    if (recommendedPower <= 0.125) {
      powerRatingString = "1/8 W (0.125W)";
    } else if (recommendedPower <= 0.25) {
      powerRatingString = "1/4 W (0.25W) [Standard]";
    } else if (recommendedPower <= 0.5) {
      powerRatingString = "1/2 W (0.5W)";
    } else if (recommendedPower <= 1) {
      powerRatingString = "1 W";
    } else if (recommendedPower <= 2) {
      powerRatingString = "2 W";
    } else {
      powerRatingString = `${Math.ceil(recommendedPower)} W (High Power)`;
    }

    let resistStr = "";
    if (resistance >= 1000) {
      resistStr = `${(resistance / 1000).toFixed(2).replace(/\.00$/, "")} kΩ`;
    } else {
      resistStr = `${resistance.toFixed(1).replace(/\.0$/, "")} Ω`;
    }

    ledResultResist.textContent = resistStr;
    ledResultPower.textContent = `${power.toFixed(3)} W (Rec. Rating: ${powerRatingString})`;
    
    if (window.currentView === "led-view" && typeof window.updateDmmLcd === "function") {
      const parts = resistStr.split(" ");
      window.updateDmmLcd(parts[0], parts[1], "LED REQ RESIST");
    }
    
    if (resistance < 5 && ledResultWarning) {
      ledResultWarning.textContent = "Warning: Calculated resistance is very low. Small voltage fluctuations may damage the LED.";
      ledResultWarning.style.display = "block";
    }
  };

  if (ledTypeSelect) {
    ledTypeSelect.addEventListener("change", () => {
      const selectedIdx = parseInt(ledTypeSelect.value);
      if (!isNaN(selectedIdx) && LED_TYPES[selectedIdx]) {
        const template = LED_TYPES[selectedIdx];
        if (ledVledInput) ledVledInput.value = template.voltage;
        if (ledIledInput) ledIledInput.value = template.current;
        window.calculateLedResistor();
      }
    });

    // Populate drop-down options
    ledTypeSelect.innerHTML = "";
    LED_TYPES.forEach((led, idx) => {
      const opt = document.createElement("option");
      opt.value = idx;
      opt.textContent = `${led.name} (${led.voltage}V, ${led.current}mA)`;
      ledTypeSelect.appendChild(opt);
    });
  }

  [ledVsourceInput, ledVledInput, ledIledInput].forEach(inp => {
    if (inp) {
      inp.addEventListener("input", window.calculateLedResistor);
    }
  });

  // Setup initial template
  if (ledTypeSelect) ledTypeSelect.value = "0";
  if (ledVsourceInput) ledVsourceInput.value = "5";
  if (ledVledInput) ledVledInput.value = "1.8";
  if (ledIledInput) ledIledInput.value = "20";
  
  window.calculateLedResistor();
});
