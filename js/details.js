// js/details.js - Component Details Modal & Symbol Rendering

document.addEventListener("DOMContentLoaded", () => {
  const modalOverlay = document.getElementById("modal-overlay");
  const modalClose = document.getElementById("modal-close");
  const modalTitle = document.getElementById("modal-title");
  const modalBadge = document.getElementById("modal-badge");
  const modalDesc = document.getElementById("modal-desc");
  const modalSpecsTable = document.getElementById("modal-specs-table");
  const modalPinoutLayout = document.getElementById("modal-pinout-layout");
  const modalSchematicLayout = document.getElementById("modal-schematic-layout");
  const modalDatasheetLink = document.getElementById("modal-datasheet-link");

  // Shared Open Modal Function
  window.openComponentModal = function(comp) {
    if (!modalTitle || !modalOverlay) return;

    modalTitle.textContent = comp.name;
    modalBadge.textContent = comp.category || comp.type;
    modalBadge.className = `component-badge ${comp.type.toLowerCase()}`;
    modalDesc.textContent = comp.description;

    // Build specs table
    if (modalSpecsTable) {
      modalSpecsTable.innerHTML = "";
      Object.entries(comp.specs).forEach(([label, value]) => {
        const row = document.createElement("div");
        row.className = "modal-spec-row";
        row.innerHTML = `
          <span class="modal-spec-label">${label}</span>
          <span class="modal-spec-value">${value}</span>
        `;
        modalSpecsTable.appendChild(row);
      });
    }

    // Build Pinout visual representation
    renderPinoutVisual(comp);

    // Build Schematic Symbol & Ideal Circuit
    renderSchematicVisual(comp);

    // Setup datasheet button links
    if (modalDatasheetLink) {
      modalDatasheetLink.onclick = () => {
        window.open(`https://www.alldatasheet.com/view.jsp?Searchword=${encodeURIComponent(comp.datasheetQuery)}`, "_blank");
      };
    }

    modalOverlay.classList.add("active");
  };

  function renderPinoutVisual(comp) {
    if (!modalPinoutLayout) return;
    modalPinoutLayout.innerHTML = "";
    const pinout = comp.pinout;
    if (!pinout) {
      modalPinoutLayout.innerHTML = "<p style='color:var(--text-muted); font-size:0.9rem;'>No pinout layout available.</p>";
      return;
    }

    if (pinout.type === "axial") {
      modalPinoutLayout.innerHTML = `
        <div class="pinout-layout-text">Standard Axial Lead Package (${comp.package})</div>
        <div style="display:flex; flex-direction:column; align-items:center; width:100%; margin: 1rem 0;">
          <!-- Diode Body visual -->
          <svg width="220" height="60" viewBox="0 0 220 60">
            <!-- Leads -->
            <line x1="0" y1="30" x2="60" y2="30" stroke="#a1a1aa" stroke-width="4" stroke-linecap="round" />
            <line x1="160" y1="30" x2="220" y2="30" stroke="#a1a1aa" stroke-width="4" stroke-linecap="round" />
            <!-- Silicon Body -->
            <rect x="60" y="15" width="100" height="30" rx="3" fill="#18181b" stroke="#3f3f46" stroke-width="2" />
            <!-- Cathode Band (Silver/Gray) -->
            <rect x="140" y="15" width="12" height="30" fill="#a1a1aa" />
          </svg>
          <div style="display:flex; justify-content:space-between; width:160px; font-size:0.8rem; margin-top:0.75rem; font-family:var(--font-mono)">
            <span style="color:var(--text-primary)">${pinout.pins[0].name}<br><span style="color:var(--text-muted)">${pinout.pins[0].label}</span></span>
            <span style="color:var(--text-primary); text-align:right;">${pinout.pins[1].name}<br><span style="color:var(--text-muted)">${pinout.pins[1].label}</span></span>
          </div>
        </div>
      `;
    } 
    else if (pinout.type === "3-pin") {
      let pinsHtml = "";
      pinout.pins.forEach(p => {
        pinsHtml += `
          <div class="transistor-lead-leg">
            <div class="lead-desc-popover">${p.name}: ${p.num}</div>
          </div>
        `;
      });

      let pinLabelsHtml = "";
      pinout.pins.forEach(p => {
        pinLabelsHtml += `
          <div style="flex:1; text-align:center; font-size:0.75rem;">
            <div style="font-weight:700; color:var(--text-primary)">Pin ${p.num}</div>
            <div style="color:var(--accent-cyan); font-weight:600;">${p.name}</div>
          </div>
        `;
      });

      modalPinoutLayout.innerHTML = `
        <div class="pinout-layout-text">${pinout.layout}</div>
        <div class="transistor-renderer">
          <div class="transistor-pkg-outline">
            <span class="transistor-pkg-label">${comp.package.split(" ")[0]}</span>
            <div class="transistor-pkg-flat"></div>
          </div>
          <div class="transistor-leads">
            ${pinsHtml}
          </div>
          <div style="display:flex; width:220px; justify-content:space-between; margin-top:2.5rem; background:rgba(255,255,255,0.02); padding:0.5rem; border-radius:8px; border:1px solid var(--card-border);">
            ${pinLabelsHtml}
          </div>
        </div>
      `;
    }
    else if (pinout.type === "ic-8") {
      let leftPinsHtml = "";
      let rightPinsHtml = "";

      pinout.pins.forEach(p => {
        const pinMarkup = `
          <div class="ic-pin-row ic-pin-${p.side} pin-pos-${p.pin}">
            <div class="ic-pin-num">${p.pin}</div>
            <div class="ic-pin-leg"></div>
            <div class="ic-pin-label">${p.name}</div>
          </div>
        `;

        if (p.side === "left") {
          leftPinsHtml += pinMarkup;
        } else {
          rightPinsHtml += pinMarkup;
        }
      });

      modalPinoutLayout.innerHTML = `
        <div class="pinout-layout-text">DIP-8 Top View (Pin 1 marked with dot)</div>
        <div class="ic-renderer">
          <div class="ic-body">
            <div class="ic-dot"></div>
            <div class="ic-part-number">${comp.name}</div>
          </div>
          ${leftPinsHtml}
          ${rightPinsHtml}
        </div>
        <div style="width:100%; margin-top:1.5rem; font-size:0.75rem; max-height:120px; overflow-y:auto; padding-right:5px;">
          <div style="font-weight:600; color:var(--text-secondary); margin-bottom:0.5rem;">PIN FUNCTIONS:</div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.25rem 1rem; font-family:var(--font-mono)">
            ${pinout.pins.sort((a,b)=>a.pin-b.pin).map(p => `
              <div style="padding:2px 0; border-bottom:1px solid rgba(255,255,255,0.02)">
                <span style="color:var(--accent-cyan); font-weight:600;">Pin ${p.pin} (${p.name}):</span> 
                <span style="color:var(--text-secondary); font-size:0.7rem">${p.desc}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    else if (pinout.type === "board-30") {
      let leftColumnHtml = "";
      let rightColumnHtml = "";

      pinout.pins.forEach(p => {
        const pinMarkup = `
          <div class="board-pin-item ${p.side}-side" title="${p.desc}">
            <span class="board-pin-num">${p.pin}</span>
            <span class="board-pin-name">${p.name}</span>
          </div>
        `;

        if (p.side === "left") {
          leftColumnHtml += pinMarkup;
        } else {
          rightColumnHtml += pinMarkup;
        }
      });

      modalPinoutLayout.innerHTML = `
        <div class="pinout-layout-text">${pinout.layout}</div>
        <div class="board-pinout-grid">
          <div style="display:flex; flex-direction:column; gap:4px;">
            <div style="text-align:center; font-weight:700; color:var(--accent-cyan); font-size:0.7rem; margin-bottom:4px; text-transform:uppercase;">Left Side Pins</div>
            ${leftColumnHtml}
          </div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            <div style="text-align:center; font-weight:700; color:var(--accent-purple); font-size:0.7rem; margin-bottom:4px; text-transform:uppercase;">Right Side Pins</div>
            ${rightColumnHtml}
          </div>
        </div>
      `;
    }
  }

  function renderSchematicVisual(comp) {
    if (!modalSchematicLayout) return;
    modalSchematicLayout.innerHTML = "";
    
    let symbolSvg = "";
    let connectionSvg = "";
    let labelText = "";

    const typeLower = comp.type.toLowerCase();
    const catLower = (comp.category || "").toLowerCase();

    if (typeLower === "diode") {
      if (catLower.includes("zener")) {
        symbolSvg = `
          <svg width="80" height="80" viewBox="0 0 100 100">
            <line x1="10" y1="50" x2="40" y2="50" stroke="#f8fafc" stroke-width="2.5" />
            <polygon points="40,30 70,50 40,70" fill="none" stroke="#8b5cf6" stroke-width="3" />
            <path d="M 70 24 L 70 30 L 70 70 L 64 76" fill="none" stroke="#8b5cf6" stroke-width="3" stroke-linecap="round" />
            <line x1="70" y1="50" x2="90" y2="50" stroke="#f8fafc" stroke-width="2.5" />
            <text x="20" y="38" fill="var(--accent-purple)" font-size="12" font-family="var(--font-sans)" font-weight="bold">A</text>
            <text x="78" y="38" fill="var(--accent-purple)" font-size="12" font-family="var(--font-sans)" font-weight="bold">K</text>
          </svg>
        `;
        connectionSvg = `
          <svg width="220" height="100" viewBox="0 0 220 100">
            <text x="25" y="25" fill="#94a3b8" font-size="8" text-anchor="middle">Input Vin</text>
            <line x1="25" y1="35" x2="25" y2="50" stroke="#64748b" stroke-width="2" />
            <line x1="25" y1="50" x2="50" y2="50" stroke="#64748b" stroke-width="2" />
            <rect x="50" y="45" width="25" height="10" fill="none" stroke="#ea580c" stroke-width="2" />
            <text x="62" y="38" fill="#ea580c" font-size="8" text-anchor="middle">Rs</text>
            <line x1="75" y1="50" x2="130" y2="50" stroke="#64748b" stroke-width="2" />
            <circle cx="100" cy="50" r="3" fill="#64748b" />
            <line x1="100" y1="50" x2="100" y2="60" stroke="#64748b" stroke-width="2" />
            <polygon points="90,72 110,72 100,60" fill="none" stroke="#8b5cf6" stroke-width="2" />
            <path d="M 90 72 L 110 72 M 90 72 L 90 76 M 110 72 L 110 68" fill="none" stroke="#8b5cf6" stroke-width="2" />
            <line x1="100" y1="72" x2="100" y2="85" stroke="#64748b" stroke-width="2" />
            <line x1="130" y1="50" x2="160" y2="50" stroke="#64748b" stroke-width="2" />
            <text x="175" y="53" fill="#94a3b8" font-size="8">Vout</text>
            <line x1="25" y1="85" x2="160" y2="85" stroke="#64748b" stroke-width="2" />
            <line x1="100" y1="85" x2="100" y2="85" stroke="#64748b" stroke-width="3" />
            <line x1="90" y1="90" x2="110" y2="90" stroke="#64748b" stroke-width="2" />
          </svg>
        `;
        labelText = "Zener Regulator: Limits output voltage to Zener breakdown rating (5.1V).";
      } else {
        symbolSvg = `
          <svg width="80" height="80" viewBox="0 0 100 100">
            <line x1="10" y1="50" x2="40" y2="50" stroke="#f8fafc" stroke-width="2.5" />
            <polygon points="40,30 70,50 40,70" fill="none" stroke="#10b981" stroke-width="3" />
            <line x1="70" y1="30" x2="70" y2="70" stroke="#10b981" stroke-width="3" />
            <line x1="70" y1="50" x2="90" y2="50" stroke="#f8fafc" stroke-width="2.5" />
            <text x="20" y="38" fill="var(--accent-green)" font-size="12" font-family="var(--font-sans)" font-weight="bold">A</text>
            <text x="78" y="38" fill="var(--accent-green)" font-size="12" font-family="var(--font-sans)" font-weight="bold">K</text>
          </svg>
        `;
        connectionSvg = `
          <svg width="220" height="100" viewBox="0 0 220 100">
            <text x="30" y="25" fill="#94a3b8" font-size="8" text-anchor="middle">Power Input</text>
            <line x1="30" y1="35" x2="30" y2="50" stroke="#64748b" stroke-width="2" />
            <line x1="30" y1="50" x2="60" y2="50" stroke="#64748b" stroke-width="2" />
            <polygon points="60,40 75,50 60,60" fill="none" stroke="#10b981" stroke-width="2" />
            <line x1="75" y1="40" x2="75" y2="60" stroke="#10b981" stroke-width="2" />
            <line x1="75" y1="50" x2="120" y2="50" stroke="#64748b" stroke-width="2" />
            <rect x="120" y="35" width="30" height="30" rx="3" fill="none" stroke="#3882f6" stroke-width="2" />
            <text x="135" y="52" fill="#3882f6" font-size="7" text-anchor="middle">Circuit Load</text>
            <line x1="150" y1="50" x2="170" y2="50" stroke="#64748b" stroke-width="2" />
            <line x1="30" y1="80" x2="170" y2="80" stroke="#64748b" stroke-width="2" />
            <line x1="135" y1="65" x2="135" y2="80" stroke="#64748b" stroke-width="2" />
            <line x1="95" y1="80" x2="95" y2="86" stroke="#64748b" stroke-width="2" />
            <line x1="88" y1="86" x2="102" y2="86" stroke="#64748b" stroke-width="2" />
          </svg>
        `;
        labelText = "Reverse Protection: Block negative input signals from damaging load circuits.";
      }
    } 
    else if (typeLower === "transistor") {
      if (catLower.includes("npn")) {
        symbolSvg = `
          <svg width="80" height="80" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="30" fill="none" stroke="#f8fafc" stroke-width="2" />
            <line x1="35" y1="35" x2="35" y2="65" stroke="#f8fafc" stroke-width="3" />
            <line x1="15" y1="50" x2="35" y2="50" stroke="#f8fafc" stroke-width="2" />
            <line x1="35" y1="42" x2="60" y2="25" stroke="#f8fafc" stroke-width="2" />
            <line x1="35" y1="58" x2="60" y2="75" stroke="#f8fafc" stroke-width="2" />
            <polygon points="56,72 52,64 48,68" fill="#f59e0b" />
            <text x="20" y="42" fill="var(--accent-amber)" font-size="12" font-family="var(--font-sans)" font-weight="bold">B</text>
            <text x="65" y="28" fill="var(--accent-amber)" font-size="12" font-family="var(--font-sans)" font-weight="bold">C</text>
            <text x="65" y="78" fill="var(--accent-amber)" font-size="12" font-family="var(--font-sans)" font-weight="bold">E</text>
          </svg>
        `;
        connectionSvg = `
          <svg width="220" height="100" viewBox="0 0 220 100">
            <text x="20" y="53" fill="#94a3b8" font-size="7" text-anchor="middle">Input Ctrl</text>
            <line x1="35" y1="50" x2="55" y2="50" stroke="#64748b" stroke-width="2" />
            <rect x="55" y="45" width="20" height="10" fill="none" stroke="#ea580c" stroke-width="2" />
            <line x1="75" y1="50" x2="95" y2="50" stroke="#64748b" stroke-width="2" />
            <circle cx="110" cy="50" r="15" fill="none" stroke="#f8fafc" stroke-width="1.5" />
            <line x1="102" y1="40" x2="102" y2="60" stroke="#f8fafc" stroke-width="2" />
            <line x1="90" y1="50" x2="102" y2="50" stroke="#64748b" stroke-width="2" />
            <line x1="102" y1="45" x2="114" y2="35" stroke="#64748b" stroke-width="2" />
            <line x1="114" y1="35" x2="114" y2="25" stroke="#64748b" stroke-width="2" />
            <line x1="102" y1="55" x2="114" y2="65" stroke="#64748b" stroke-width="2" />
            <line x1="114" y1="65" x2="114" y2="75" stroke="#64748b" stroke-width="2" />
            <polygon points="113,63 109,58 107,61" fill="#f59e0b" />
            <rect x="135" y="15" width="25" height="15" rx="2" fill="none" stroke="#3b82f6" stroke-width="2" />
            <text x="147" y="25" fill="#3b82f6" font-size="6" text-anchor="middle">LOAD</text>
            <line x1="114" y1="25" x2="135" y2="25" stroke="#64748b" stroke-width="2" />
            <line x1="160" y1="25" x2="185" y2="25" stroke="#64748b" stroke-width="2" />
            <text x="195" y="28" fill="#94a3b8" font-size="7">VCC</text>
            <line x1="114" y1="75" x2="114" y2="82" stroke="#64748b" stroke-width="2" />
            <line x1="104" y1="82" x2="124" y2="82" stroke="#64748b" stroke-width="2" />
            <line x1="109" y1="86" x2="119" y2="86" stroke="#64748b" stroke-width="2" />
          </svg>
        `;
        labelText = "NPN Low-Side Switch: Apply voltage at Base to pull the load pin to ground.";
      } 
      else if (catLower.includes("pnp")) {
        symbolSvg = `
          <svg width="80" height="80" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="30" fill="none" stroke="#f8fafc" stroke-width="2" />
            <line x1="35" y1="35" x2="35" y2="65" stroke="#f8fafc" stroke-width="3" />
            <line x1="15" y1="50" x2="35" y2="50" stroke="#f8fafc" stroke-width="2" />
            <line x1="35" y1="42" x2="60" y2="25" stroke="#f8fafc" stroke-width="2" />
            <line x1="35" y1="58" x2="60" y2="75" stroke="#f8fafc" stroke-width="2" />
            <polygon points="41,61 46,67 50,62" fill="#f59e0b" />
            <text x="20" y="42" fill="var(--accent-amber)" font-size="12" font-family="var(--font-sans)" font-weight="bold">B</text>
            <text x="65" y="28" fill="var(--accent-amber)" font-size="12" font-family="var(--font-sans)" font-weight="bold">C</text>
            <text x="65" y="78" fill="var(--accent-amber)" font-size="12" font-family="var(--font-sans)" font-weight="bold">E</text>
          </svg>
        `;
        connectionSvg = `
          <svg width="220" height="100" viewBox="0 0 220 100">
            <circle cx="110" cy="50" r="15" fill="none" stroke="#f8fafc" stroke-width="1.5" />
            <line x1="102" y1="40" x2="102" y2="60" stroke="#f8fafc" stroke-width="2" />
            <line x1="102" y1="45" x2="114" y2="35" stroke="#64748b" stroke-width="2" />
            <line x1="114" y1="35" x2="114" y2="20" stroke="#64748b" stroke-width="2" />
            <text x="114" y="15" fill="#94a3b8" font-size="7" text-anchor="middle">VCC</text>
            <polygon points="107,39 111,43 113,38" fill="#f59e0b" />
            <line x1="102" y1="55" x2="114" y2="65" stroke="#64748b" stroke-width="2" />
            <line x1="114" y1="65" x2="114" y2="75" stroke="#64748b" stroke-width="2" />
            <rect x="135" y="65" width="25" height="15" rx="2" fill="none" stroke="#3b82f6" stroke-width="2" />
            <text x="147" y="75" fill="#3b82f6" font-size="6" text-anchor="middle">LOAD</text>
            <line x1="114" y1="75" x2="135" y2="75" stroke="#64748b" stroke-width="2" />
            <line x1="82" y1="50" x2="102" y2="50" stroke="#64748b" stroke-width="2" />
            <rect x="62" y="45" width="20" height="10" fill="none" stroke="#ea580c" stroke-width="2" />
            <line x1="30" y1="50" x2="62" y2="50" stroke="#64748b" stroke-width="2" />
            <text x="25" y="43" fill="#94a3b8" font-size="7">Input Ctrl</text>
            <line x1="147" y1="80" x2="147" y2="90" stroke="#64748b" stroke-width="2" />
            <line x1="137" y1="90" x2="157" y2="90" stroke="#64748b" stroke-width="2" />
          </svg>
        `;
        labelText = "PNP High-Side Switch: Ground the Base terminal to connect VCC power to the load.";
      } 
      else if (catLower.includes("mosfet")) {
        symbolSvg = `
          <svg width="80" height="80" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="30" fill="none" stroke="#f8fafc" stroke-width="2" />
            <line x1="32" y1="35" x2="32" y2="65" stroke="#f8fafc" stroke-width="3" />
            <line x1="15" y1="50" x2="32" y2="50" stroke="#f8fafc" stroke-width="2" />
            <line x1="42" y1="35" x2="42" y2="42" stroke="#f8fafc" stroke-width="2" />
            <line x1="42" y1="46" x2="42" y2="54" stroke="#f8fafc" stroke-width="2" />
            <line x1="42" y1="58" x2="42" y2="65" stroke="#f8fafc" stroke-width="2" />
            <line x1="42" y1="38" x2="60" y2="38" stroke="#f8fafc" stroke-width="2" />
            <line x1="60" y1="38" x2="60" y2="20" stroke="#f8fafc" stroke-width="2" />
            <line x1="42" y1="62" x2="60" y2="62" stroke="#f8fafc" stroke-width="2" />
            <line x1="60" y1="62" x2="60" y2="80" stroke="#f8fafc" stroke-width="2" />
            <line x1="42" y1="50" x2="60" y2="50" stroke="#f8fafc" stroke-width="2" />
            <line x1="60" y1="50" x2="60" y2="62" stroke="#f8fafc" stroke-width="2" />
            <polygon points="44,50 52,46 52,54" fill="#06b6d4" />
            <text x="20" y="42" fill="var(--accent-cyan)" font-size="12" font-family="var(--font-sans)" font-weight="bold">G</text>
            <text x="68" y="28" fill="var(--accent-cyan)" font-size="12" font-family="var(--font-sans)" font-weight="bold">D</text>
            <text x="68" y="78" fill="var(--accent-cyan)" font-size="12" font-family="var(--font-sans)" font-weight="bold">S</text>
          </svg>
        `;
        connectionSvg = `
          <svg width="220" height="100" viewBox="0 0 220 100">
            <text x="20" y="53" fill="#94a3b8" font-size="7" text-anchor="middle">Gate Sig</text>
            <line x1="35" y1="50" x2="55" y2="50" stroke="#64748b" stroke-width="2" />
            <rect x="55" y="45" width="20" height="10" fill="none" stroke="#ea580c" stroke-width="2" />
            <line x1="75" y1="50" x2="95" y2="50" stroke="#64748b" stroke-width="2" />
            <circle cx="110" cy="50" r="15" fill="none" stroke="#f8fafc" stroke-width="1.5" />
            <line x1="110" y1="35" x2="110" y2="25" stroke="#64748b" stroke-width="2" />
            <line x1="110" y1="65" x2="110" y2="75" stroke="#64748b" stroke-width="2" />
            <line x1="95" y1="50" x2="105" y2="50" stroke="#64748b" stroke-width="2" />
            <rect x="125" y="15" width="25" height="15" rx="2" fill="none" stroke="#3b82f6" stroke-width="2" />
            <text x="137" y="25" fill="#3b82f6" font-size="6" text-anchor="middle">LOAD</text>
            <line x1="110" y1="25" x2="125" y2="25" stroke="#64748b" stroke-width="2" />
            <line x1="150" y1="25" x2="175" y2="25" stroke="#64748b" stroke-width="2" />
            <text x="185" y="28" fill="#94a3b8" font-size="7">VCC</text>
            <line x1="110" y1="75" x2="110" y2="82" stroke="#64748b" stroke-width="2" />
            <line x1="100" y1="82" x2="120" y2="82" stroke="#64748b" stroke-width="2" />
            <line x1="105" y1="86" x2="115" y2="86" stroke="#64748b" stroke-width="2" />
          </svg>
        `;
        labelText = "N-Channel MOSFET Driver: High speed, low-loss switching for high-current loads.";
      }
    }
    else if (typeLower === "regulator") {
      const isAdj = comp.id === "lm317";
      symbolSvg = `
        <svg width="80" height="80" viewBox="0 0 100 100">
          <rect x="25" y="25" width="50" height="40" rx="3" fill="none" stroke="#f59e0b" stroke-width="2.5" />
          <text x="50" y="48" fill="#f8fafc" font-size="8" text-anchor="middle" font-weight="bold">REG</text>
          <line x1="10" y1="45" x2="25" y2="45" stroke="#f8fafc" stroke-width="2" />
          <line x1="75" y1="45" x2="90" y2="45" stroke="#f8fafc" stroke-width="2" />
          <line x1="50" y1="65" x2="50" y2="80" stroke="#f8fafc" stroke-width="2" />
          <text x="8" y="38" fill="var(--accent-amber)" font-size="10" font-family="var(--font-sans)" font-weight="bold">IN</text>
          <text x="75" y="38" fill="var(--accent-amber)" font-size="10" font-family="var(--font-sans)" font-weight="bold">OUT</text>
          <text x="58" y="78" fill="var(--accent-amber)" font-size="10" font-family="var(--font-sans)" font-weight="bold">${isAdj ? "ADJ" : "GND"}</text>
        </svg>
      `;
      connectionSvg = `
        <svg width="220" height="100" viewBox="0 0 220 100">
          <text x="20" y="43" fill="#94a3b8" font-size="7">Vin</text>
          <line x1="15" y1="50" x2="50" y2="50" stroke="#64748b" stroke-width="2" />
          <circle cx="35" cy="50" r="2" fill="#64748b" />
          <line x1="35" y1="50" x2="35" y2="60" stroke="#64748b" stroke-width="2" />
          <line x1="30" y1="60" x2="40" y2="60" stroke="#8b5cf6" stroke-width="2" />
          <line x1="30" y1="64" x2="40" y2="64" stroke="#8b5cf6" stroke-width="2" />
          <line x1="35" y1="64" x2="35" y2="75" stroke="#64748b" stroke-width="2" />
          <rect x="50" y="35" width="40" height="30" rx="2" fill="none" stroke="#f59e0b" stroke-width="2" />
          <text x="70" y="53" fill="#f8fafc" font-size="7" text-anchor="middle" font-weight="bold">LM78XX</text>
          <line x1="70" y1="65" x2="70" y2="75" stroke="#64748b" stroke-width="2" />
          <line x1="90" y1="50" x2="135" y2="50" stroke="#64748b" stroke-width="2" />
          <text x="145" y="43" fill="#94a3b8" font-size="7">Vout</text>
          <circle cx="115" cy="50" r="2" fill="#64748b" />
          <line x1="115" y1="50" x2="115" y2="60" stroke="#64748b" stroke-width="2" />
          <line x1="110" y1="60" x2="120" y2="60" stroke="#8b5cf6" stroke-width="2" />
          <line x1="110" y1="64" x2="120" y2="64" stroke="#8b5cf6" stroke-width="2" />
          <line x1="115" y1="64" x2="115" y2="75" stroke="#64748b" stroke-width="2" />
          <line x1="15" y1="75" x2="155" y2="75" stroke="#64748b" stroke-width="2" />
          <line x1="85" y1="75" x2="85" y2="81" stroke="#64748b" stroke-width="2" />
          <line x1="78" y1="81" x2="92" y2="81" stroke="#64748b" stroke-width="2" />
        </svg>
      `;
      labelText = "Regulated Output: Use filtering capacitors (C1, C2) to stabilize Vin and suppress ripple.";
    }
    else if (typeLower === "ic") {
      if (comp.name.includes("555")) {
        symbolSvg = `
          <svg width="80" height="80" viewBox="0 0 100 100">
            <rect x="25" y="20" width="50" height="60" rx="3" fill="none" stroke="#8b5cf6" stroke-width="2.5" />
            <text x="50" y="53" fill="#f8fafc" font-size="8" text-anchor="middle" font-weight="bold">NE555</text>
          </svg>
        `;
        connectionSvg = `
          <svg width="220" height="100" viewBox="0 0 220 100">
            <rect x="75" y="20" width="60" height="55" fill="none" stroke="#8b5cf6" stroke-width="2" />
            <text x="105" y="52" fill="#8b5cf6" font-size="7" font-weight="bold" text-anchor="middle">555 Timer</text>
            <line x1="105" y1="20" x2="105" y2="10" stroke="#64748b" stroke-width="1.5" />
            <text x="112" y="14" fill="#94a3b8" font-size="6">VCC (8,4)</text>
            <line x1="105" y1="75" x2="105" y2="85" stroke="#64748b" stroke-width="1.5" />
            <line x1="97" y1="85" x2="113" y2="85" stroke="#64748b" stroke-width="2" />
            <text x="119" y="88" fill="#94a3b8" font-size="6">GND (1)</text>
            <line x1="135" y1="50" x2="160" y2="50" stroke="#64748b" stroke-width="1.5" />
            <text x="145" y="44" fill="#94a3b8" font-size="6">OUT (3)</text>
            <polygon points="160,45 170,50 160,55" fill="none" stroke="#10b981" stroke-width="1.5" />
            <line x1="170" y1="45" x2="170" y2="55" stroke="#10b981" stroke-width="1.5" />
            <rect x="178" y="47" width="15" height="6" fill="none" stroke="#ea580c" stroke-width="1.5" />
            <line x1="170" y1="50" x2="178" y2="50" stroke="#64748b" stroke-width="1.5" />
            <line x1="193" y1="50" x2="200" y2="50" stroke="#64748b" stroke-width="1.5" />
            <line x1="200" y1="50" x2="200" y2="85" stroke="#64748b" stroke-width="1.5" />
            <line x1="105" y1="85" x2="200" y2="85" stroke="#64748b" stroke-width="1.5" />
          </svg>
        `;
        labelText = "Astable Blinker: Pulses the output (pin 3) high and low to flash an indicator LED.";
      } 
      else if (comp.name.includes("358")) {
        symbolSvg = `
          <svg width="80" height="80" viewBox="0 0 100 100">
            <polygon points="30,20 80,50 30,80" fill="none" stroke="#3b82f6" stroke-width="2.5" />
            <text x="40" y="40" fill="#f8fafc" font-size="12" font-weight="bold">-</text>
            <text x="40" y="66" fill="#f8fafc" font-size="10" font-weight="bold">+</text>
            <line x1="10" y1="36" x2="30" y2="36" stroke="#64748b" stroke-width="2" />
            <line x1="10" y1="62" x2="30" y2="62" stroke="#64748b" stroke-width="2" />
            <line x1="80" y1="50" x2="95" y2="50" stroke="#64748b" stroke-width="2" />
          </svg>
        `;
        connectionSvg = `
          <svg width="220" height="100" viewBox="0 0 220 100">
            <polygon points="75,25 125,50 75,75" fill="none" stroke="#3b82f6" stroke-width="2" />
            <text x="85" y="40" fill="#94a3b8" font-size="10">-</text>
            <text x="85" y="67" fill="#94a3b8" font-size="8">+</text>
            <line x1="45" y1="62" x2="75" y2="62" stroke="#64748b" stroke-width="2" />
            <text x="25" y="65" fill="#f8fafc" font-size="7">Vin (+)</text>
            <line x1="125" y1="50" x2="165" y2="50" stroke="#64748b" stroke-width="2" />
            <text x="175" y="53" fill="#f8fafc" font-size="7">Vout</text>
            <circle cx="145" cy="50" r="2.5" fill="#64748b" />
            <line x1="145" y1="50" x2="145" y2="15" stroke="#64748b" stroke-width="2" />
            <line x1="145" y1="15" x2="60" y2="15" stroke="#64748b" stroke-width="2" />
            <line x1="60" y1="15" x2="60" y2="37" stroke="#64748b" stroke-width="2" />
            <line x1="60" y1="37" x2="75" y2="37" stroke="#64748b" stroke-width="2" />
            <rect x="85" y="10" width="20" height="10" fill="none" stroke="#ea580c" stroke-width="2" />
            <text x="95" y="8" fill="#ea580c" font-size="6" text-anchor="middle">Rf</text>
            <line x1="60" y1="37" x2="45" y2="37" stroke="#64748b" stroke-width="2" />
            <rect x="25" y="32" width="20" height="10" fill="none" stroke="#ea580c" stroke-width="2" />
            <line x1="25" y1="37" x2="15" y2="37" stroke="#64748b" stroke-width="2" />
            <line x1="15" y1="37" x2="15" y2="80" stroke="#64748b" stroke-width="2" />
            <line x1="8" y1="80" x2="22" y2="80" stroke="#64748b" stroke-width="2" />
            <line x1="12" y1="84" x2="18" y2="84" stroke="#64748b" stroke-width="2" />
          </svg>
        `;
        labelText = "Non-Inverting Amplifier: Voltage gain ($Av$) is calculated as $1 + (Rf / Rin)$.";
      }
      else {
        symbolSvg = `
          <svg width="80" height="80" viewBox="0 0 100 100">
            <rect x="20" y="20" width="60" height="60" rx="3" fill="none" stroke="#8b5cf6" stroke-width="2.5" />
            <text x="50" y="53" fill="#f8fafc" font-size="8" text-anchor="middle" font-weight="bold">${comp.name}</text>
          </svg>
        `;
        connectionSvg = `
          <svg width="220" height="100" viewBox="0 0 220 100">
            <rect x="65" y="25" width="70" height="50" fill="none" stroke="#8b5cf6" stroke-width="2" />
            <text x="100" y="53" fill="#8b5cf6" font-size="7" font-weight="bold" text-anchor="middle">${comp.name}</text>
            <line x1="25" y1="40" x2="65" y2="40" stroke="#64748b" stroke-width="1.5" />
            <text x="15" y="43" fill="#94a3b8" font-size="7">Input</text>
            <circle cx="45" cy="40" r="2.5" fill="#64748b" />
            <line x1="45" y1="40" x2="45" y2="60" stroke="#64748b" stroke-width="1.5" />
            <line x1="40" y1="60" x2="50" y2="60" stroke="#8b5cf6" stroke-width="2" />
            <line x1="40" y1="64" x2="50" y2="64" stroke="#8b5cf6" stroke-width="2" />
            <line x1="45" y1="64" x2="45" y2="75" stroke="#64748b" stroke-width="1.5" />
            <line x1="135" y1="50" x2="165" y2="50" stroke="#64748b" stroke-width="1.5" />
            <line x1="165" y1="45" x2="165" y2="55" stroke="#8b5cf6" stroke-width="2" />
            <line x1="169" y1="45" x2="169" y2="55" stroke="#8b5cf6" stroke-width="2" />
            <line x1="169" y1="50" x2="190" y2="50" stroke="#64748b" stroke-width="1.5" />
            <polygon points="190,45 198,35 198,65 190,55" fill="none" stroke="#10b981" stroke-width="1.5" />
            <rect x="184" y="47" width="6" height="6" fill="none" stroke="#10b981" stroke-width="1.5" />
            <line x1="45" y1="75" x2="198" y2="75" stroke="#64748b" stroke-width="1.5" />
            <line x1="120" y1="75" x2="120" y2="82" stroke="#64748b" stroke-width="1.5" />
            <line x1="112" y1="82" x2="128" y2="82" stroke="#64748b" stroke-width="2" />
          </svg>
        `;
        labelText = "Audio Driver: Filter input DC using series coupling capacitor to block noise.";
      }
    }
    else if (typeLower === "microcontroller") {
      symbolSvg = `
        <svg width="80" height="80" viewBox="0 0 100 100">
          <rect x="20" y="15" width="60" height="70" rx="3" fill="none" stroke="#06b6d4" stroke-width="2.5" />
          <text x="50" y="52" fill="#f8fafc" font-size="8" text-anchor="middle" font-weight="bold">ESP32</text>
        </svg>
      `;
      connectionSvg = `
        <svg width="220" height="100" viewBox="0 0 220 100">
          <rect x="35" y="20" width="70" height="60" rx="2" fill="none" stroke="#06b6d4" stroke-width="2" />
          <text x="70" y="53" fill="#06b6d4" font-size="7" font-weight="bold" text-anchor="middle">ESP32 MCU</text>
          <line x1="105" y1="40" x2="130" y2="40" stroke="#64748b" stroke-width="1.5" />
          <text x="114" y="35" fill="#f8fafc" font-size="5.5">GPIO2</text>
          <rect x="130" y="37" width="18" height="6" fill="none" stroke="#ea580c" stroke-width="1.5" />
          <line x1="148" y1="40" x2="165" y2="40" stroke="#64748b" stroke-width="1.5" />
          <polygon points="165,35 175,40 165,45" fill="none" stroke="#10b981" stroke-width="1.5" />
          <line x1="175" y1="35" x2="175" y2="45" stroke="#10b981" stroke-width="1.5" />
          <line x1="175" y1="40" x2="190" y2="40" stroke="#64748b" stroke-width="1.5" />
          <line x1="70" y1="80" x2="70" y2="90" stroke="#64748b" stroke-width="1.5" />
          <line x1="190" y1="40" x2="190" y2="90" stroke="#64748b" stroke-width="1.5" />
          <line x1="70" y1="90" x2="190" y2="90" stroke="#64748b" stroke-width="1.5" />
          <circle cx="70" cy="80" r="2" fill="#64748b" />
        </svg>
      `;
      labelText = "MCU IO Hookup: Always use a series current-limiting resistor to protect GPIO pins.";
    }
    else {
      symbolSvg = `
        <svg width="80" height="80" viewBox="0 0 100 100">
          <rect x="30" y="30" width="40" height="40" rx="2" fill="none" stroke="#a1a1aa" stroke-width="2" />
          <line x1="10" y1="50" x2="30" y2="50" stroke="#a1a1aa" stroke-width="2" />
          <line x1="70" y1="50" x2="90" y2="50" stroke="#a1a1aa" stroke-width="2" />
        </svg>
      `;
      connectionSvg = `
        <svg width="220" height="100" viewBox="0 0 220 100">
          <rect x="80" y="30" width="60" height="40" rx="3" fill="none" stroke="#64748b" stroke-width="2" />
          <text x="110" y="53" fill="#94a3b8" font-size="8" text-anchor="middle">DEVICE</text>
          <line x1="40" y1="50" x2="80" y2="50" stroke="#64748b" stroke-width="2" />
          <line x1="140" y1="50" x2="180" y2="50" stroke="#64748b" stroke-width="2" />
        </svg>
      `;
      labelText = "Generic Component: Refer to datasheet spec sheets to ensure correct pin connections.";
    }

    modalSchematicLayout.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center;">
        <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:5px;">Schematic Symbol</div>
        <div style="background:rgba(255,255,255,0.02); padding:0.5rem; border-radius:10px; border:1px solid var(--card-border);">${symbolSvg}</div>
      </div>
      <div style="display:flex; flex-direction:column; align-items:center; flex:1; min-width:200px;">
        <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:5px;">Typical Application Circuit</div>
        <div style="background:rgba(255,255,255,0.02); padding:0.5rem; border-radius:10px; border:1px solid var(--card-border); width:100%; display:flex; justify-content:center;">${connectionSvg}</div>
      </div>
      <div style="width:100%; font-size:0.8rem; color:var(--text-secondary); text-align:center; border-top:1px solid rgba(255,255,255,0.03); padding-top:0.75rem; margin-top:0.25rem;">
        ${labelText}
      </div>
    `;
  }

  function closeModal() {
    if (modalOverlay) {
      modalOverlay.classList.remove("active");
    }
  }

  if (modalClose) {
    modalClose.addEventListener("click", closeModal);
  }
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }
});
