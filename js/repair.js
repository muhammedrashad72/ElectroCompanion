// js/repair.js - Mobile Repair Notes and Solutions Controller

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const filterPills = document.querySelectorAll("#repair-view .filter-pill[data-category]");
  const repCatCharging = document.getElementById("rep-cat-charging");
  const repCatPlaceholder = document.getElementById("rep-cat-placeholder");
  const placeholderTitle = document.getElementById("placeholder-title");
  const placeholderDesc = document.getElementById("placeholder-desc");

  // Lightbox Elements
  const repairLightbox = document.getElementById("repair-lightbox");
  const repairLightboxImg = document.getElementById("repair-lightbox-img");
  const repairLightboxCaption = document.getElementById("repair-lightbox-caption");
  const repairLightboxClose = document.getElementById("repair-lightbox-close");

  // Samsung A13 Carousel Images Data
  const samsungImages = [
    {
      src: "images/samsung_charging_ic.png?v=2",
      caption: "Fig 1: Samsung A13 U5001 Charging IC layout showing DP/DM and battery NTC lines."
    },
    {
      src: "images/samsung_pd_ic_1.png?v=2",
      caption: "Fig 2: Samsung A13 U5003 PD control IC CPU communication traces."
    },
    {
      src: "images/samsung_pd_ic_2.png?v=2",
      caption: "Fig 3: Samsung A13 U5003 Channel Configuration (CC1/CC2) logic lines from USB-C port."
    }
  ];

  // ==================== CATEGORY FILTER PILOT ====================
  filterPills.forEach(pill => {
    pill.addEventListener("click", () => {
      // Toggle active states of category buttons
      filterPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");

      const category = pill.getAttribute("data-category");
      const targetContent = document.getElementById(`rep-cat-${category}`);
      const allContents = document.querySelectorAll(".repair-category-content");

      // Hide all panels
      allContents.forEach(content => {
        content.style.display = "none";
      });

      if (targetContent) {
        targetContent.style.display = "flex";
      } else {
        repCatPlaceholder.style.display = "flex";

        // Update placeholder texts for empty categories
        let title = "";
        let desc = "";

        switch (category) {
          case "camera":
            title = "📷 Camera Problems Notes";
            desc = "You haven't prepared any diagnostic notes for Camera Problems yet. Click 'Charging Issues' or 'Dead Motherboard' to see your active notes, or draft new entries.";
            break;


          case "dead":
            title = "💀 Dead Motherboard Notes";
            desc = "You haven't prepared any diagnostic notes for Dead Motherboard yet. Click 'Charging Issues' to see your active notes, or draft new entries.";
            break;
        }

        placeholderTitle.textContent = title;
        placeholderDesc.textContent = desc;
      }
    });
  });

  // ==================== SAMSUNG CAROUSEL INTERACTION ====================
  window.switchSamsungImage = function(index, button) {
    const carouselImg = document.getElementById("samsung-carousel-img");
    const captionText = document.getElementById("samsung-caption-text");

    if (carouselImg && captionText && samsungImages[index]) {
      carouselImg.src = samsungImages[index].src;
      captionText.textContent = samsungImages[index].caption;

      // Update button highlights inside the selector row
      const parent = button.parentElement;
      if (parent) {
        parent.querySelectorAll("button").forEach(btn => btn.classList.remove("active"));
      }
      button.classList.add("active");
    }
  };

  // ==================== IMAGE LIGHTBOX ZOOM ====================
  // Bind zoom on any zoomable-image or repair-img-card
  const bindLightbox = () => {
    const images = document.querySelectorAll("#repair-view .zoomable-image, #repair-view .repair-img-card img");
    images.forEach(img => {
      img.addEventListener("click", (e) => {
        e.stopPropagation();
        repairLightboxImg.src = img.src;
        repairLightboxCaption.textContent = img.alt || "Mobile Schematic Diagram";
        repairLightbox.style.display = "flex";
      });
    });
  };

  // Close Lightbox
  if (repairLightboxClose) {
    repairLightboxClose.addEventListener("click", () => {
      repairLightbox.style.display = "none";
    });
  }

  if (repairLightbox) {
    repairLightbox.addEventListener("click", (e) => {
      if (e.target === repairLightbox || e.target.id === "repair-lightbox-img") {
        repairLightbox.style.display = "none";
      }
    });
  }

  // Initialize Lightbox bindings
  bindLightbox();

  // ==================== PLATFORM TOGGLE INTERACTION ====================
  const platformTabs = document.querySelectorAll(".platform-tab");
  const androidSection = document.getElementById("platform-android-section");
  const iphoneSection = document.getElementById("platform-iphone-section");

  platformTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      platformTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const platform = tab.getAttribute("data-platform");
      if (platform === "android") {
        if (androidSection) androidSection.style.display = "flex";
        if (iphoneSection) iphoneSection.style.display = "none";
        
        // Trigger click on currently active android category button to show its panel
        const activePill = androidSection ? androidSection.querySelector(".filter-pill.active") : null;
        if (activePill) {
          activePill.click();
        }
      } else {
        if (androidSection) androidSection.style.display = "none";
        if (iphoneSection) iphoneSection.style.display = "flex";
        
        // Show iPhone placeholder
        document.querySelectorAll(".repair-category-content").forEach(content => {
          content.style.display = "none";
        });
        if (repCatPlaceholder) {
          repCatPlaceholder.style.display = "flex";
          placeholderTitle.textContent = "🍎 iPhone Repair Notes";
          placeholderDesc.textContent = "No diagnostic notes for iPhone are currently available. iPhone schematic and common issue databases are under preparation.";
        }
      }
    });
  });
});
