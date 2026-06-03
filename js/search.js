// js/search.js - Component Search & Datasheet Lookup

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search-input");
  const filterPills = document.querySelectorAll(".filter-pill");
  const resultsGrid = document.getElementById("results-grid");
  const webSearchBtn = document.getElementById("web-search-btn");

  let activeFilter = "all";

  function renderComponentCards(results) {
    if (!resultsGrid) return;
    resultsGrid.innerHTML = "";
    
    if (results.length === 0) {
      resultsGrid.innerHTML = `
        <div class="glass-card" style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
          <svg style="width:48px; height:48px; stroke:var(--text-muted); stroke-width:1.5; fill:none; margin-bottom:1rem;" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <p style="font-size:1.1rem; font-weight:500;">No components found matching your search.</p>
          <p style="font-size:0.9rem; color:var(--text-muted); margin-top:0.25rem;">Try checking spelling or click "Search Web Datasheet" to search online.</p>
        </div>
      `;
      return;
    }

    results.forEach(comp => {
      const card = document.createElement("div");
      card.className = "glass-card component-card";
      
      // Get preview specs (first 2 specs)
      let specsHtml = "";
      const keys = Object.keys(comp.specs);
      for (let i = 0; i < Math.min(2, keys.length); i++) {
        specsHtml += `
          <div class="spec-preview-row">
            <span class="spec-preview-label">${keys[i]}</span>
            <span class="spec-preview-val">${comp.specs[keys[i]]}</span>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="component-card-header">
          <div>
            <h3 class="component-name">${comp.name}</h3>
            <span class="component-pkg">${comp.package}</span>
          </div>
          <span class="component-badge ${comp.type.toLowerCase()}">${comp.category || comp.type}</span>
        </div>
        <p class="component-desc">${comp.description.length > 95 ? comp.description.substring(0, 92) + "..." : comp.description}</p>
        <div class="card-specs-preview">
          ${specsHtml}
        </div>
      `;

      card.addEventListener("click", () => {
        if (typeof window.openComponentModal === "function") {
          window.openComponentModal(comp);
        }
      });
      resultsGrid.appendChild(card);
    });
  }

  function performSearch() {
    if (!searchInput) return;
    const query = searchInput.value.toLowerCase().trim();
    
    const filtered = COMPONENT_DB.filter(comp => {
      const matchesQuery = comp.name.toLowerCase().includes(query) ||
                           comp.type.toLowerCase().includes(query) ||
                           comp.description.toLowerCase().includes(query) ||
                           (comp.category && comp.category.toLowerCase().includes(query));
                           
      const matchesFilter = activeFilter === "all" || comp.type.toLowerCase() === activeFilter.toLowerCase();
      
      return matchesQuery && matchesFilter;
    });

    renderComponentCards(filtered);
  }

  if (searchInput) {
    searchInput.addEventListener("input", performSearch);
  }

  filterPills.forEach(pill => {
    pill.addEventListener("click", () => {
      filterPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      activeFilter = pill.getAttribute("data-filter");
      performSearch();
    });
  });

  if (webSearchBtn) {
    webSearchBtn.addEventListener("click", () => {
      const query = searchInput ? searchInput.value.trim() : "";
      if (query) {
        window.open(`https://www.alldatasheet.com/view.jsp?Searchword=${encodeURIComponent(query)}`, "_blank");
      } else {
        alert("Please enter a component code or identification number in the search bar first!");
      }
    });
  }

  // Render initial components
  renderComponentCards(COMPONENT_DB);
});
