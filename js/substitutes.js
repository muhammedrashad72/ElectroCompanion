// js/substitutes.js - Alternative Components Substitutions

document.addEventListener("DOMContentLoaded", () => {
  const substituteSearchSelect = document.getElementById("substitute-search-select");
  const substitutesResults = document.getElementById("substitutes-results");
  const subOriginalName = document.getElementById("sub-original-name");
  const subOriginalBadge = document.getElementById("sub-original-badge");
  const subOriginalPkg = document.getElementById("sub-original-pkg");
  const substituteTableBody = document.getElementById("substitute-table-body");
  const substituteTableHead = document.querySelector(".substitute-table thead");

  function populateSubstitutesDropdown() {
    if (!substituteSearchSelect) return;
    substituteSearchSelect.innerHTML = '<option value="none" disabled selected>-- Select a component to check equivalents --</option>';

    EQUIVALENTS_DB.forEach(comp => {
      const opt = document.createElement("option");
      opt.value = comp.id;
      opt.textContent = `${comp.name} (${comp.category})`;
      substituteSearchSelect.appendChild(opt);
    });
  }

  function showSubstitutesForSelected() {
    if (!substituteSearchSelect || !substitutesResults) return;
    const selectedId = substituteSearchSelect.value;
    if (selectedId === "none") return;

    const comp = EQUIVALENTS_DB.find(c => c.id === selectedId);
    if (!comp) return;

    if (subOriginalName) subOriginalName.textContent = comp.name;
    if (window.currentView === "substitutes-view" && typeof window.updateDmmLcd === "function") {
      window.updateDmmLcd(comp.name, "ALT", "COMP SUBSTITUTES");
    }
    if (subOriginalBadge) {
      subOriginalBadge.textContent = comp.category;
      subOriginalBadge.className = `component-badge ${comp.type.toLowerCase()}`;
    }
    if (subOriginalPkg) subOriginalPkg.textContent = comp.package;

    // Generate comparison table headers
    const specLabels = Object.keys(comp.specs);
    
    if (substituteTableHead) {
      let headHtml = `
        <tr>
          <th style="width: 15%">Part Model</th>
          <th style="width: 15%">Match Grade</th>
          <th style="width: 20%">Package</th>
      `;
      
      specLabels.forEach(label => {
        headHtml += `<th>${label}</th>`;
      });
      
      headHtml += `
          <th style="width: 30%">Compatibility Note</th>
        </tr>
      `;
      substituteTableHead.innerHTML = headHtml;
    }

    // Generate comparison table body rows
    if (substituteTableBody) {
      let bodyHtml = "";

      // Original part row first for reference
      let origRowHtml = `
        <tr style="background: rgba(255,255,255,0.03); font-weight: 600;">
          <td style="color:var(--text-primary);">${comp.name}</td>
          <td><span class="sub-match-badge direct" style="background:rgba(255,255,255,0.05); color:#fff; border-color:#555;">Original</span></td>
          <td style="font-family:var(--font-mono);">${comp.package}</td>
      `;
      specLabels.forEach(label => {
        origRowHtml += `<td style="color: var(--text-primary);">${comp.specs[label]}</td>`;
      });
      origRowHtml += `
          <td style="color: var(--text-muted); font-size:0.8rem; font-style:italic;">Target component to replace.</td>
        </tr>
      `;
      bodyHtml += origRowHtml;

      // Alternative rows
      comp.alternatives.forEach(alt => {
        const matchLower = alt.match.toLowerCase();
        let matchClass = "direct";
        if (matchLower === "direct") matchClass = "direct";
        else if (matchLower === "excellent") matchClass = "excellent";
        else if (matchLower === "good") matchClass = "good";
        else if (matchLower === "fair") matchClass = "fair";

        let rowHtml = `
          <tr>
            <td style="color:var(--accent-green); font-weight:700;">${alt.name}</td>
            <td><span class="sub-match-badge ${matchClass}">${alt.match}</span></td>
            <td style="font-family:var(--font-mono);">${alt.package}</td>
        `;

        specLabels.forEach(label => {
          const val = alt.specs[label] || "N/A";
          rowHtml += `<td>${val}</td>`;
        });

        rowHtml += `
            <td style="font-size: 0.8rem; line-height: 1.4; color: var(--text-secondary);">${alt.note}</td>
          </tr>
        `;
        bodyHtml += rowHtml;
      });

      substituteTableBody.innerHTML = bodyHtml;
    }
    
    substitutesResults.style.display = "block";
  }

  if (substituteSearchSelect) {
    substituteSearchSelect.addEventListener("change", showSubstitutesForSelected);
  }

  // Initialize substitutes UI
  populateSubstitutesDropdown();
});
