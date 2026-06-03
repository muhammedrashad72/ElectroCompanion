// js/rccb.js - RCCB Tripping Diagnostic Guide & Route Map

document.addEventListener("DOMContentLoaded", () => {
  // DOM Panel Elements
  const setupPanel = document.getElementById("rccb-setup-panel");
  const wizardPanel = document.getElementById("rccb-wizard-panel");
  
  // DOM Questionnaire Selects
  const phaseSelect = document.getElementById("rccb-phase-select");
  const solarSelect = document.getElementById("rccb-solar-select");
  const inverterSelect = document.getElementById("rccb-inverter-select");
  const tripSelect = document.getElementById("rccb-trip-select");
  
  // DOM Wizard Actions
  const btnStart = document.getElementById("rccb-btn-start");
  const btnBack = document.getElementById("rccb-btn-back");
  const btnRestart = document.getElementById("rccb-btn-restart");
  const stepTitle = document.getElementById("rccb-step-title");
  const stepBadge = document.getElementById("rccb-step-badge");
  const stepBody = document.getElementById("rccb-step-body");
  const wizardChoices = document.getElementById("rccb-wizard-choices");
  const visualContainer = document.getElementById("rccb-visual-container");

  // State
  let config = { phase: "single", solar: false, inverter: false, tripPattern: "immediate" };
  let currentStepIndex = 0;
  let wizardFlow = []; // Array of step IDs
  let selectedFaultyMcb = "Kitchen Sockets";
  
  // Simulated breaker states
  let breakers = {
    rccb: true,
    mcbSolar: true,
    mcbInverter: true,
    mcbL1: true,
    mcbL2: true,
    mcbL3: true,
    mcbL4: true
  };

  // Step definitions
  const STEPS = {
    "solar-isolate": {
      title: "Solar Isolation Check",
      badge: "External Solar",
      getInstructions: () => {
        let solarText = config.phase === "three"
          ? "For a Three-Phase solar setup, the inverter is typically grid-tied across L1, L2, L3. High frequency DC leakages or faulty filter capacitors can inject currents into ground, blinding or tripping the main 4-pole RCCB."
          : "Grid-tied solar inverters create natural capacitance-to-earth leakage. Class AC RCCBs can saturate (\"blind\") under DC leakages, causing erratic tripping.";
        return `
          <h3 style="color:var(--accent-amber); font-size:1.15rem; font-weight:600; margin-bottom:0.75rem;">Step: Isolate Solar Inverter</h3>
          <p style="font-size:0.9rem; line-height:1.6; color:var(--text-secondary); margin-bottom:1rem;">
            ${solarText}
          </p>
          <p style="font-size:0.9rem; line-height:1.6; color:var(--text-secondary); margin-bottom:1rem;">
            Go to the **Solar AC DB** box. Switch **OFF** the Solar AC MCB / Isolator. Try to reset your main RCCB.
          </p>
        `;
      },
      getChoices: () => [
        { text: "RCCB Holds (Tripping Stopped)", nextStep: "fault-solar" },
        { text: "RCCB Still Trips Immediately", nextStep: config.inverter ? "inverter-isolate" : "all-mcb-off" }
      ],
      setupVisual: () => {
        setAllBreakers(true);
        breakers.mcbSolar = false;
        drawDistributionBoard();
      }
    },
    "inverter-isolate": {
      title: "Inverter Isolation Check",
      badge: "Inverter/UPS",
      getInstructions: () => `
        <h3 style="color:var(--accent-amber); font-size:1.15rem; font-weight:600; margin-bottom:0.75rem;">Step: Isolate Inverter/UPS</h3>
        <p style="font-size:0.9rem; line-height:1.6; color:var(--text-secondary); margin-bottom:1rem;">
          Inverters/UPS systems keep a local Neutral-to-Earth loop active. A fault on the inverter's output can backfeed through the neutral line and trip the main RCCB even if the inverter's input mains MCB is off.
        </p>
        <p style="font-size:0.9rem; line-height:1.6; color:var(--text-secondary); margin-bottom:1rem;">
          Switch the Inverter to **Manual Bypass Mode** or disconnect its output wires entirely. Try to reset the RCCB.
        </p>
      `,
      getChoices: () => [
        { text: "RCCB Holds (Tripping Stopped)", nextStep: "fault-inverter" },
        { text: "RCCB Still Trips", nextStep: "all-mcb-off" }
      ],
      setupVisual: () => {
        setAllBreakers(true);
        breakers.mcbInverter = false;
        drawDistributionBoard();
      }
    },
    "all-mcb-off": {
      title: "Master Isolation Check",
      badge: "MCB Check",
      getInstructions: () => {
        let phaseNote = config.phase === "three"
          ? "⚠️ **Three-Phase Note:** In a 3-Phase board, the main RCCB is a 4-Pole device monitoring all three phases (Red, Yellow, Blue) and Neutral. Switching off all individual breakers isolates all phases downstream, allowing us to see if the leakage is in the core board or outer routes."
          : "We will check if the leak is on the main buses or in the downstream room loops.";
        let tripNote = "";
        if (config.tripPattern === "intermittent") {
          tripNote = "Since your tripping is intermittent, if the RCCB still trips with all MCBs off, the fault is likely on the main busbar, a neutral-earth short inside the panel, or a faulty RCCB coil.";
        }
        return `
          <h3 style="color:var(--accent-amber); font-size:1.15rem; font-weight:600; margin-bottom:0.75rem;">Step: Isolate All Loads</h3>
          <p style="font-size:0.9rem; line-height:1.6; color:var(--text-secondary); margin-bottom:1rem;">
            Switch **OFF** all individual MCBs on the DB panel. Keep only the **Main RCCB ON**. Try resetting it now.
          </p>
          <p style="font-size:0.9rem; line-height:1.6; color:var(--text-secondary); margin-bottom:1rem;">
            ${phaseNote}
          </p>
          ${tripNote ? `<p style="font-size:0.9rem; line-height:1.6; color:var(--accent-amber); margin-bottom:1rem;">${tripNote}</p>` : ""}
        `;
      },
      getChoices: () => [
        { text: "RCCB Still Trips Immediately", nextStep: "fault-neutral-main" },
        { text: "RCCB Holds (No Tripping)", nextStep: "mcb-sequencing" }
      ],
      setupVisual: () => {
        setAllBreakers(false);
        breakers.rccb = true;
        drawDistributionBoard();
      }
    },
    "mcb-sequencing": {
      title: "Fault Zone Identification",
      badge: "MCB Sequencing",
      getInstructions: () => {
        let phaseText = config.phase === "three"
          ? "Switch the MCBs back ON slowly. Since this is a Three-Phase system, MCBs are balanced across L1/Red (Kitchen), L2/Yellow (Bedroom), and L3/Blue (Geyser/Lighting). Turning ON the breaker that corresponds to the leaking phase will trip the RCCB."
          : "Switch the MCBs back **ON** slowly, one after the other.";
        let tripText = "";
        if (config.tripPattern === "heavy-load") {
          tripText = "💡 **Heavy-Load Tripping:** Since it only trips under load, you may need to switch on appliances (like a heater or kettle) in each room after turning on its MCB to trigger the trip.";
        } else if (config.tripPattern === "intermittent") {
          tripText = "💡 **Intermittent Tripping:** If it doesn't trip immediately, you might need to wait for a cycling load to turn on, or click the MCB that corresponds to the room where intermittent trips are most frequent.";
        }
        return `
          <h3 style="color:var(--accent-amber); font-size:1.15rem; font-weight:600; margin-bottom:0.75rem;">Step: Flip MCBs ON One-by-One</h3>
          <p style="font-size:0.9rem; line-height:1.6; color:var(--text-secondary); margin-bottom:1rem;">
            ${phaseText}
          </p>
          <p style="font-size:0.9rem; line-height:1.6; color:var(--text-secondary); margin-bottom:1rem;">
            **Click on any simulated MCB in the schematic panel to the right** to select which circuit causes the RCCB to trip.
          </p>
          ${tripText ? `<p style="font-size:0.9rem; line-height:1.6; color:var(--accent-cyan); margin-bottom:1rem;">${tripText}</p>` : ""}
        `;
      },
      getChoices: () => [
        { 
          text: config.phase === "three" ? "MCB 1: Kitchen Sockets Tripped (Phase L1)" : "MCB 1: Kitchen Sockets Tripped", 
          nextStep: "room-isolation", 
          onChoice: () => selectedFaultyMcb = "Kitchen Sockets" 
        },
        { 
          text: config.phase === "three" ? "MCB 2: Bedroom Outlets Tripped (Phase L2)" : "MCB 2: Bedroom Outlets Tripped", 
          nextStep: "room-isolation", 
          onChoice: () => selectedFaultyMcb = "Bedroom Outlets" 
        },
        { 
          text: config.phase === "three" ? "MCB 3: Geyser / AC Tripped (Phase L3)" : "MCB 3: Geyser / AC Tripped", 
          nextStep: "room-isolation", 
          onChoice: () => selectedFaultyMcb = "Bathroom Geyser" 
        },
        { 
          text: config.phase === "three" ? "MCB 4: Lighting Loop Tripped (Phase L3)" : "MCB 4: Lighting Loop Tripped", 
          nextStep: "room-isolation", 
          onChoice: () => selectedFaultyMcb = "Lighting Circuits" 
        }
      ],
      setupVisual: () => {
        // Start sequencing with all MCBs OFF, RCCB ON
        setAllBreakers(false);
        breakers.rccb = true;
        drawDistributionBoard();
      }
    },
    "room-isolation": {
      title: "Room Loop Isolation",
      badge: "Room Check",
      getInstructions: () => {
        let tripInfo = "";
        if (config.tripPattern === "intermittent") {
          tripInfo = "⚠️ **Intermittent Fault Info:** Unplug all devices, including those with automatic timers (Fridges, ACs, automatic pumps, outdoor lights). A fridge defroster cycle or pump float switch can cause random tripping hours apart.";
        } else if (config.tripPattern === "heavy-load") {
          tripInfo = "⚠️ **Heavy-Load Fault Info:** Pay close attention to appliances with high-power heating elements or motors (Geysers, Microwaves, Electric Kettles, ACs). Their heating coils expand when drawing current, causing insulation breakdown to earth.";
        } else {
          tripInfo = "⚠️ **CRITICAL:** You must **unplug** appliances from sockets (e.g. Fridge, Micro, Heater). Simply switching OFF wall switches only breaks the phase wire, but a Neutral-to-Earth fault will keep tripping the RCCB!";
        }
        return `
          <h3 style="color:var(--accent-amber); font-size:1.15rem; font-weight:600; margin-bottom:0.75rem;">Step: Unplug Loads in ${selectedFaultyMcb}</h3>
          <p style="font-size:0.9rem; line-height:1.6; color:var(--text-secondary); margin-bottom:1rem;">
            Go to the room zone connected to **${selectedFaultyMcb}**. 
          </p>
          <p style="font-size:0.9rem; line-height:1.6; color:var(--text-secondary); margin-bottom:1rem; background:rgba(244,63,94,0.06); padding:0.75rem; border-radius:8px; border:1px solid rgba(244,63,94,0.15)">
            ${tripInfo}
          </p>
          <p style="font-size:0.9rem; line-height:1.6; color:var(--text-secondary); margin-bottom:1rem;">
            Once all devices are unplugged, flip the **${selectedFaultyMcb} MCB** back **ON**.
          </p>
        `;
      },
      getChoices: () => [
        { text: "RCCB Holds (Tripping Stopped)", nextStep: "fault-appliance" },
        { text: "RCCB Still Trips (Appliance isolated)", nextStep: "neutral-disconnect" }
      ],
      setupVisual: () => {
        setAllBreakers(true);
        drawDistributionBoard();
      }
    },
    "neutral-disconnect": {
      title: "Neutral Conductor Isolation",
      badge: "Wiring Check",
      getInstructions: () => {
        let neutralText = config.phase === "three"
          ? "In Three-Phase DBs, the neutrals of different circuits are sometimes accidentally shared/crossed at junction boxes, which is a major cause of RCCB tripping. Disconnecting this neutral isolates the circuit's loop completely."
          : "Since the RCCB still trips with all appliances unplugged, the fault is inside the wall wires. It is most commonly a Neutral wire touching an Earth conduit or water pipe.";
        return `
          <h3 style="color:var(--accent-amber); font-size:1.15rem; font-weight:600; margin-bottom:0.75rem;">Step: Disconnect Neutral at DB</h3>
          <p style="font-size:0.9rem; line-height:1.6; color:var(--text-secondary); margin-bottom:1rem;">
            ${neutralText}
          </p>
          <p style="font-size:0.9rem; line-height:1.6; color:var(--text-secondary); margin-bottom:1rem;">
            **Switch OFF mains.** Open the panel cover. Locate and **disconnect the Neutral wire** of the **${selectedFaultyMcb}** circuit from the Neutral Bus Bar. Switch mains back ON and reset.
          </p>
        `;
      },
      getChoices: () => [
        { text: "RCCB Holds (No Tripping)", nextStep: "fault-neutral-wire" },
        { text: "RCCB Still Trips", nextStep: "fault-phase-wire" }
      ],
      setupVisual: () => {
        setAllBreakers(true);
        drawDistributionBoard(true); // highlight neutral disconnected
      }
    },
    
    // FAULT IDENTIFIED STAGES
    "fault-solar": {
      title: "Solar Earth Leakage Detected",
      badge: "Fault Solved",
      getInstructions: () => `
        <h3 style="color:var(--accent-green); font-size:1.15rem; font-weight:600; margin-bottom:0.75rem;">Diagnostic: Solar Leakage Fault</h3>
        <p style="font-size:0.9rem; line-height:1.6; color:var(--text-secondary); margin-bottom:1rem;">
          Your solar grid inverter's AC filter has a leakage current exceeding the RCCB's threshold (typically 30mA), or the inverter requires a **Class B RCCB** due to DC residual current components blinding your current breaker.
        </p>
        <p style="font-size:0.9rem; line-height:1.6; color:var(--accent-green); font-weight:500;">
          **Action Plan:** Hire your solar installer to test inverter insulation resistance and swap the RCCB to a Class B or Type A model rated for solar grid feedback.
        </p>
      `,
      getChoices: () => [],
      setupVisual: () => {
        setAllBreakers(true);
        breakers.mcbSolar = false;
        drawDistributionBoard();
      }
    },
    "fault-inverter": {
      title: "Inverter Leakage Detected",
      badge: "Fault Solved",
      getInstructions: () => `
        <h3 style="color:var(--accent-green); font-size:1.15rem; font-weight:600; margin-bottom:0.75rem;">Diagnostic: Inverter Feedback Fault</h3>
        <p style="font-size:0.9rem; line-height:1.6; color:var(--text-secondary); margin-bottom:1rem;">
          The inverter contains a neutral-to-ground relay that bonds neutral and earth during battery operations. If there is a neutral leakage in the UPS circuits, it creates a tripping loop.
        </p>
        <p style="font-size:0.9rem; line-height:1.6; color:var(--accent-green); font-weight:500;">
          **Action Plan:** Check the neutral wiring coming out of the inverter. Ensure the inverter neutral does not cross-connect back to the main mains neutral bar downstream of the RCCB.
        </p>
      `,
      getChoices: () => [],
      setupVisual: () => {
        setAllBreakers(true);
        breakers.mcbInverter = false;
        drawDistributionBoard();
      }
    },
    "fault-neutral-main": {
      title: "Main Busbar Neutral Short",
      badge: "Fault Solved",
      getInstructions: () => `
        <h3 style="color:var(--accent-rose); font-size:1.15rem; font-weight:600; margin-bottom:0.75rem;">Diagnostic: Main Neutral/RCCB Fault</h3>
        <p style="font-size:0.9rem; line-height:1.6; color:var(--text-secondary); margin-bottom:1rem;">
          Because the RCCB trips even with all individual phase MCBs off, the leakage is either in the neutral busbar itself, a neutral cross-connection before the breakers, or the RCCB internal sensing coil has burnt out.
        </p>
        <p style="font-size:0.9rem; line-height:1.6; color:var(--accent-rose); font-weight:500;">
          **Action Plan:** Check for carbon deposits behind the busbar. Measure resistance between the neutral bar and earth. If it reads 0 ohms, disconnect neutral feeds one-by-one to trace the shorted bar.
        </p>
      `,
      getChoices: () => [],
      setupVisual: () => {
        setAllBreakers(false);
        breakers.rccb = false;
        drawDistributionBoard();
      }
    },
    "fault-appliance": {
      title: "Appliance Ground Leakage",
      badge: "Fault Solved",
      getInstructions: () => `
        <h3 style="color:var(--accent-green); font-size:1.15rem; font-weight:600; margin-bottom:0.75rem;">Diagnostic: Appliance Fault</h3>
        <p style="font-size:0.9rem; line-height:1.6; color:var(--text-secondary); margin-bottom:1rem;">
          One of the appliances connected to **${selectedFaultyMcb}** has a damaged heating element, failing compressor, or internal moisture causing current leak to its metal chassis.
        </p>
        <p style="font-size:0.9rem; line-height:1.6; color:var(--accent-green); font-weight:500;">
          **Action Plan:** Plug your devices back into the sockets one by one. The one that causes the RCCB to trip the moment it is plugged in or turned on is the faulty device.
        </p>
      `,
      getChoices: () => [],
      setupVisual: () => {
        setAllBreakers(true);
        drawDistributionBoard();
      }
    },
    "fault-neutral-wire": {
      title: "Neutral-to-Earth Wall Fault",
      badge: "Fault Solved",
      getInstructions: () => `
        <h3 style="color:var(--accent-green); font-size:1.15rem; font-weight:600; margin-bottom:0.75rem;">Diagnostic: Conduit Neutral Fault</h3>
        <p style="font-size:0.9rem; line-height:1.6; color:var(--text-secondary); margin-bottom:1rem;">
          The Neutral cable running through the switchboards of the **${selectedFaultyMcb}** zone is touching the metal box or Earth wire inside a conduit. This is common if screws are drilled into walls, cutting into cables.
        </p>
        <p style="font-size:0.9rem; line-height:1.6; color:var(--accent-green); font-weight:500;">
          **Action Plan:** Open switchboards in the rooms. Disconnect the neutral loop wires to split the room routing into segments, testing continuity to ground at each point to find the broken wire segment.
        </p>
      `,
      getChoices: () => [],
      setupVisual: () => {
        setAllBreakers(true);
        drawDistributionBoard(true); // neutral wire isolated
      }
    },
    "fault-phase-wire": {
      title: "Phase-to-Earth Wall Fault",
      badge: "Fault Solved",
      getInstructions: () => `
        <h3 style="color:var(--accent-rose); font-size:1.15rem; font-weight:600; margin-bottom:0.75rem;">Diagnostic: Phase Conduit Leakage</h3>
        <p style="font-size:0.9rem; line-height:1.6; color:var(--text-secondary); margin-bottom:1rem;">
          The phase wire inside the wall conduit has direct leakage to ground. This usually results from rodent bites, moisture build-up inside pipes, or cable insulation overheating and melting.
        </p>
        <p style="font-size:0.9rem; line-height:1.6; color:var(--accent-rose); font-weight:500;">
          **Action Plan:** Turn off power. Split the phase wire junctions in switchboards. Check insulation resistance of the phases to ground using a Megger to isolate the faulty wire loop.
        </p>
      `,
      getChoices: () => [],
      setupVisual: () => {
        setAllBreakers(true);
        drawDistributionBoard();
      }
    }
  };

  // Helper to set all breaker toggles
  function setAllBreakers(state) {
    for (let key in breakers) {
      breakers[key] = state;
    }
  }

  // Draw Distribution Board SVG Visualizer
  function drawDistributionBoard(neutralDisconnected = false) {
    if (!visualContainer) return;
    visualContainer.innerHTML = "";

    const width = 400;
    const height = 290;

    let svg = `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" style="background:#0f172a; border-radius:12px;">`;

    const isThreePhase = config.phase === "three";

    // 1. Draw Neutral Bus Bar (Top)
    svg += `<rect x="20" y="20" width="360" height="8" fill="#1e3a8a" rx="2" />`;
    svg += `<text x="200" y="14" fill="var(--text-muted)" font-family="sans-serif" font-weight="bold" font-size="8" text-anchor="middle">NEUTRAL BUS BAR</text>`;

    // 2. Draw Phase Bus Bars (Bottom)
    if (isThreePhase) {
      // Three Phase Busbars: L1 (Red), L2 (Yellow), L3 (Blue)
      svg += `<rect x="20" y="225" width="360" height="6" fill="#991b1b" rx="1.5" />`; // L1 Red
      svg += `<text x="35" y="230" fill="#f87171" font-family="monospace" font-weight="bold" font-size="6">L1 (RED)</text>`;

      svg += `<rect x="20" y="240" width="360" height="6" fill="#9a3412" rx="1.5" />`; // L2 Yellow
      svg += `<text x="35" y="245" fill="#fbbf24" font-family="monospace" font-weight="bold" font-size="6">L2 (YELLOW)</text>`;

      svg += `<rect x="20" y="255" width="360" height="6" fill="#1e3a8a" rx="1.5" />`; // L3 Blue
      svg += `<text x="35" y="260" fill="#60a5fa" font-family="monospace" font-weight="bold" font-size="6">L3 (BLUE)</text>`;

      svg += `<text x="200" y="278" fill="var(--text-muted)" font-family="sans-serif" font-weight="bold" font-size="8" text-anchor="middle">THREE-PHASE BUS BARS</text>`;
    } else {
      // Single Phase Busbar
      svg += `<rect x="20" y="240" width="360" height="8" fill="#7c2d12" rx="2" />`;
      svg += `<text x="200" y="262" fill="var(--text-muted)" font-family="sans-serif" font-weight="bold" font-size="8" text-anchor="middle">PHASE BUS BAR (230V)</text>`;
    }

    // 3. Draw Main RCCB Breaker Block
    const rccbX = 15;
    const rccbY = 60;
    const rccbW = isThreePhase ? 80 : 55;
    const rccbH = 120;
    const rccbLeverY = breakers.rccb ? rccbY + 35 : rccbY + 75;
    const rccbColor = breakers.rccb ? "var(--accent-green)" : "var(--accent-rose)";

    // RCCB Body
    svg += `
      <g style="cursor:pointer;" onclick="toggleBreaker('rccb')">
        <rect x="${rccbX}" y="${rccbY}" width="${rccbW}" height="${rccbH}" rx="6" fill="#1e293b" stroke="#eab308" stroke-width="2.5" />
        <!-- Switch track -->
        <rect x="${rccbX + (rccbW - 30)/2}" y="${rccbY + 30}" width="30" height="55" fill="#0f172a" rx="3" />
        <!-- Switch handle -->
        <rect x="${rccbX + (rccbW - 22)/2}" y="${rccbLeverY}" width="22" height="15" fill="${rccbColor}" rx="2" />
        <text x="${rccbX + rccbW/2}" y="${rccbY + 20}" fill="#f8fafc" font-family="sans-serif" font-size="9" font-weight="bold" text-anchor="middle">${isThreePhase ? "4-POLE RCCB" : "RCCB"}</text>
        <text x="${rccbX + rccbW/2}" y="${rccbY + 110}" fill="var(--text-secondary)" font-family="monospace" font-size="8" text-anchor="middle">${breakers.rccb ? "ON" : "TRIP"}</text>
      </g>
    `;

    // 4. Draw Input Mains Wires to RCCB
    if (isThreePhase) {
      // L1, L2, L3 + Neutral Inputs (flowing from bottom-left or top-left)
      svg += `<line x1="0" y1="120" x2="15" y2="120" stroke="#ef4444" stroke-width="2" />`; // L1 Red
      svg += `<line x1="0" y1="130" x2="15" y2="130" stroke="#fbbf24" stroke-width="2" />`; // L2 Yellow
      svg += `<line x1="0" y1="140" x2="15" y2="140" stroke="#3b82f6" stroke-width="2" />`; // L3 Blue
      svg += `<line x1="0" y1="150" x2="15" y2="150" stroke="#60a5fa" stroke-width="2" />`; // Neutral Light Blue
      svg += `<text x="5" y="112" fill="var(--text-muted)" font-family="sans-serif" font-size="6">3~ IN</text>`;
    } else {
      // Single Phase Input
      svg += `<line x1="0" y1="120" x2="15" y2="120" stroke="#ef4444" stroke-width="3" />`; // Phase
      svg += `<line x1="0" y1="140" x2="15" y2="140" stroke="#3b82f6" stroke-width="3" />`; // Neutral
      svg += `<text x="5" y="112" fill="var(--text-muted)" font-family="sans-serif" font-size="6">L/N IN</text>`;
    }

    // Output Neutral wire from RCCB going to Neutral Bus bar
    const rccbActive = breakers.rccb;
    const neutralOutputColor = rccbActive ? "#3b82f6" : "#475569";
    const rccbNeutralOutX = rccbX + rccbW - 12;
    svg += `<path d="M ${rccbNeutralOutX} 60 L ${rccbNeutralOutX} 40 L 60 40 L 60 28" fill="none" stroke="${neutralOutputColor}" stroke-width="2.5" />`;

    // 5. Build active MCBs list
    const activeMcbs = [];
    if (config.solar) {
      activeMcbs.push({ id: "mcbSolar", label: "SOLAR", name: "Solar Circuit", phase: "L1", color: "#ef4444" });
    }
    if (config.inverter) {
      activeMcbs.push({ id: "mcbInverter", label: "INVT", name: "Inverter UPS", phase: "L2", color: "#fbbf24" });
    }
    activeMcbs.push({ id: "mcbL1", label: "KIT", name: "Kitchen Sockets", phase: "L1", color: "#ef4444" });
    activeMcbs.push({ id: "mcbL2", label: "BED", name: "Bedroom Outlets", phase: "L2", color: "#fbbf24" });
    activeMcbs.push({ id: "mcbL3", label: "GEYS", name: "Bathroom Geyser", phase: "L3", color: "#3b82f6" });
    activeMcbs.push({ id: "mcbL4", label: "LIGHT", name: "Lighting Circuits", phase: "L3", color: "#3b82f6" });

    // Distribute active MCBs dynamically
    const startX = isThreePhase ? 115 : 120;
    const spacing = (380 - startX) / (activeMcbs.length - 1 || 1);

    activeMcbs.forEach((mcb, idx) => {
      const mcbX = startX + idx * spacing;
      const mcbY = 70;
      const mcbW = 32;
      const mcbH = 100;
      const state = breakers[mcb.id];
      const mLeverY = state ? mcbY + 25 : mcbY + 55;
      const mcbColor = state ? "var(--accent-green)" : "#475569";

      // Draw MCB Block
      svg += `
        <g style="cursor:pointer;" onclick="toggleBreaker('${mcb.id}')">
          <rect x="${mcbX}" y="${mcbY}" width="${mcbW}" height="${mcbH}" rx="4" fill="#1e293b" stroke="#475569" stroke-width="1.5" />
          <rect x="${mcbX + 6}" y="${mcbY + 20}" width="20" height="45" fill="#0f172a" rx="2" />
          <!-- switch lever -->
          <rect x="${mcbX + 9}" y="${mLeverY}" width="14" height="12" fill="${mcbColor}" rx="1" />
          <text x="${mcbX + mcbW/2}" y="${mcbY + 14}" fill="var(--text-secondary)" font-family="sans-serif" font-weight="bold" font-size="7" text-anchor="middle">${mcb.label}</text>
          <text x="${mcbX + mcbW/2}" y="${mcbY + 90}" fill="var(--text-muted)" font-family="monospace" font-size="7" text-anchor="middle">${state ? "ON" : "OFF"}</text>
        </g>
      `;

      // Draw wire from MCB to respective Bus Bar
      let wireColor = "#475569";
      let targetY = 240;

      if (rccbActive) {
        if (isThreePhase) {
          if (mcb.phase === "L1") {
            wireColor = state ? "#ef4444" : "#7f1d1d";
            targetY = 225;
          } else if (mcb.phase === "L2") {
            wireColor = state ? "#fbbf24" : "#78350f";
            targetY = 240;
          } else if (mcb.phase === "L3") {
            wireColor = state ? "#3b82f6" : "#1e3a8a";
            targetY = 255;
          }
        } else {
          // Single Phase
          wireColor = state ? "#ea580c" : "#4b5563";
          targetY = 240;
        }
      }

      // Draw connection line
      svg += `<line x1="${mcbX + mcbW/2}" y1="${mcbY + mcbH}" x2="${mcbX + mcbW/2}" y2="${targetY}" stroke="${wireColor}" stroke-width="2" />`;

      // Highlight the phase connection point
      svg += `<circle cx="${mcbX + mcbW/2}" cy="${targetY}" r="2" fill="${rccbActive && state ? "#f8fafc" : "#1e293b"}" />`;

      // Draw Neutral Loop wire Disconnected simulation if needed
      if (neutralDisconnected && selectedFaultyMcb === mcb.name) {
        // Draw disconnected neutral wire floating above this specific MCB
        const wireX = mcbX + mcbW/2;
        svg += `
          <g>
            <path d="M ${wireX} 70 L ${wireX} 50" fill="none" stroke="var(--accent-rose)" stroke-dasharray="3,3" stroke-width="2" />
            <circle cx="${wireX}" cy="46" r="3.5" fill="none" stroke="var(--accent-rose)" stroke-width="2" />
            <line x1="${wireX}" y1="46" x2="${wireX}" y2="28" stroke="var(--accent-rose)" stroke-dasharray="3,3" stroke-width="2" />
            <text x="${wireX}" y="40" fill="var(--accent-rose)" font-family="sans-serif" font-weight="bold" font-size="6" text-anchor="middle">DISCONNECT</text>
          </g>
        `;
      }
    });

    svg += `</svg>`;
    visualContainer.innerHTML = svg;
  }

  // Handle Breaker Clicks in the SVG diagram
  window.toggleBreaker = function(breakerId) {
    if (breakers[breakerId] === undefined) return;
    
    // Toggle state
    breakers[breakerId] = !breakers[breakerId];
    
    // Play clicking sounds
    if (typeof window.playDmmClickSound === "function") window.playDmmClickSound();
    if (typeof window.triggerHapticVibration === "function") window.triggerHapticVibration();

    // Custom logic: if RCCB is turned OFF/tripped, all output lines drop
    if (breakerId === "rccb" && !breakers.rccb) {
      // Simulate RCCB trip visual flash
      if (visualContainer) {
        visualContainer.style.outline = "2px solid var(--accent-rose)";
        setTimeout(() => { visualContainer.style.outline = ""; }, 150);
      }
    }

    // Custom check: if user is on Step 4 (MCB sequencing) and flips up the faulty MCB
    const activeStepId = wizardFlow[currentStepIndex];
    if (activeStepId === "mcb-sequencing") {
      // Check which one they flipped ON
      if (breakerId === "mcbL1" && breakers.mcbL1) {
        triggerMcbTrip("Kitchen Sockets");
      } else if (breakerId === "mcbL2" && breakers.mcbL2) {
        triggerMcbTrip("Bedroom Outlets");
      } else if (breakerId === "mcbL3" && breakers.mcbL3) {
        triggerMcbTrip("Bathroom Geyser");
      } else if (breakerId === "mcbL4" && breakers.mcbL4) {
        triggerMcbTrip("Lighting Circuits");
      }
    } else {
      drawDistributionBoard();
    }
  };

  function triggerMcbTrip(mcbName) {
    selectedFaultyMcb = mcbName;
    breakers.rccb = false; // trip main RCCB
    
    // Flash visual panel red
    if (visualContainer) {
      visualContainer.style.outline = "4px solid var(--accent-rose)";
      setTimeout(() => { visualContainer.style.outline = ""; }, 300);
    }
    if (typeof window.playBeepSound === "function") window.playBeepSound();

    drawDistributionBoard();

    // Advance wizard to room isolation for this MCB
    setTimeout(() => {
      goToStep("room-isolation");
    }, 800);
  }

  // Setup wizard steps arrays based on configuration options
  function buildWizardFlow() {
    wizardFlow = [];
    
    // Step 1: Solar isolation (if present)
    if (config.solar) {
      wizardFlow.push("solar-isolate");
    }

    // Step 2: Inverter isolation (if present)
    if (config.inverter) {
      wizardFlow.push("inverter-isolate");
    }

    // Step 3: All MCBs OFF
    wizardFlow.push("all-mcb-off");

    // Step 4: MCB Sequencing
    wizardFlow.push("mcb-sequencing");

    // Step 5: Room Loop Isolation
    wizardFlow.push("room-isolation");

    // Step 6: Neutral Bar Wire Disconnect
    wizardFlow.push("neutral-disconnect");

    currentStepIndex = 0;
  }

  function renderActiveWizardStep() {
    const stepId = wizardFlow[currentStepIndex];
    const stepData = STEPS[stepId];
    if (!stepData) return;

    // Update title indices
    if (stepTitle) {
      stepTitle.textContent = `Step ${currentStepIndex + 1} of ${wizardFlow.length}`;
    }
    if (stepBadge) {
      stepBadge.textContent = stepData.badge;
    }
    
    // Render instructions HTML
    if (stepBody) {
      stepBody.innerHTML = stepData.getInstructions();
    }

    // Render choice action buttons
    if (wizardChoices) {
      wizardChoices.innerHTML = "";
      const choices = stepData.getChoices();
      
      if (choices.length === 0) {
        // We solved the fault! Show a completion success box
        const successBox = document.createElement("div");
        successBox.style.background = "rgba(16, 185, 129, 0.05)";
        successBox.style.border = "1px solid rgba(16, 185, 129, 0.2)";
        successBox.style.borderRadius = "8px";
        successBox.style.padding = "0.75rem";
        successBox.style.color = "var(--accent-green)";
        successBox.style.fontSize = "0.85rem";
        successBox.style.textAlign = "center";
        successBox.innerHTML = "<strong>✔️ Fault Loop Located!</strong> Troubleshooting completed.";
        wizardChoices.appendChild(successBox);
      } else {
        choices.forEach(ch => {
          const btn = document.createElement("button");
          btn.className = "datasheet-btn";
          btn.style.width = "100%";
          btn.style.justify = "center";
          btn.style.padding = "0.8rem";
          btn.textContent = ch.text;

          btn.addEventListener("click", () => {
            if (typeof window.playDmmClickSound === "function") window.playDmmClickSound();
            if (typeof window.triggerHapticVibration === "function") window.triggerHapticVibration();

            if (ch.onChoice) ch.onChoice();
            
            // Navigate to next step
            goToStep(ch.nextStep);
          });

          wizardChoices.appendChild(btn);
        });
      }
    }

    // Call SVG updates
    stepData.setupVisual();
  }

  function goToStep(nextStepId) {
    // If nextStepId matches a static fault node, append it to flow
    if (nextStepId.startsWith("fault-")) {
      // Append fault node to flow
      wizardFlow = wizardFlow.slice(0, currentStepIndex + 1);
      wizardFlow.push(nextStepId);
      currentStepIndex++;
    } else {
      // Normal flow index navigation
      const targetIndex = wizardFlow.indexOf(nextStepId);
      if (targetIndex !== -1) {
        currentStepIndex = targetIndex;
      } else {
        // Append dynamic branch target
        wizardFlow = wizardFlow.slice(0, currentStepIndex + 1);
        wizardFlow.push(nextStepId);
        currentStepIndex++;
      }
    }
    renderActiveWizardStep();
  }


  // Bind Start wizard button click
  if (btnStart) {
    btnStart.addEventListener("click", () => {
      config.phase = phaseSelect.value;
      config.solar = solarSelect.value === "yes";
      config.inverter = inverterSelect.value === "yes";
      config.tripPattern = tripSelect.value;

      buildWizardFlow();

      if (setupPanel) setupPanel.style.display = "none";
      if (wizardPanel) wizardPanel.style.display = "grid";

      if (typeof window.playDmmClickSound === "function") window.playDmmClickSound();
      renderActiveWizardStep();
    });
  }

  // Bind Back button click
  if (btnBack) {
    btnBack.addEventListener("click", () => {
      if (currentStepIndex > 0) {
        currentStepIndex--;
        renderActiveWizardStep();
      } else {
        // Go back to setup questionnaire
        if (setupPanel) setupPanel.style.display = "block";
        if (wizardPanel) wizardPanel.style.display = "none";
      }
      if (typeof window.playDmmClickSound === "function") window.playDmmClickSound();
    });
  }

  // Bind Restart setup button click
  if (btnRestart) {
    btnRestart.addEventListener("click", () => {
      if (setupPanel) setupPanel.style.display = "block";
      if (wizardPanel) wizardPanel.style.display = "none";
      if (typeof window.playDmmClickSound === "function") window.playDmmClickSound();
    });
  }

  // 1. Sub-tab Navigation
  const subTabs = document.querySelectorAll("#rccb-sub-tabs .tab-btn");
  const tabContents = document.querySelectorAll(".rccb-tab-content");

  subTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetTab = tab.getAttribute("data-rccb-tab");

      // Set active button class
      subTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      // Show active tab panel
      tabContents.forEach(content => {
        if (content.id === `rccb-tab-${targetTab}`) {
          content.style.display = "flex";
          if (targetTab === "cases") {
            loadHistoryLogs();
          }
        } else {
          content.style.display = "none";
        }
      });

      if (typeof window.playDmmClickSound === "function") window.playDmmClickSound();
      if (typeof window.triggerHapticVibration === "function") window.triggerHapticVibration();
    });
  });

  // 2. History Log Management
  const logForm = document.getElementById("rccb-log-form");
  const logTitleInput = document.getElementById("rccb-log-title");
  const logMcbSelect = document.getElementById("rccb-log-mcb");
  const logFindingsInput = document.getElementById("rccb-log-findings");
  const logResolutionInput = document.getElementById("rccb-log-resolution");
  const logsList = document.getElementById("rccb-logs-list");
  const logsEmptyMsg = document.getElementById("rccb-logs-empty");

  function getHistoryLogs() {
    try {
      const logs = localStorage.getItem("rccb_tripping_logs");
      return logs ? JSON.parse(logs) : [];
    } catch (e) {
      console.error("Failed to read local logs:", e);
      return [];
    }
  }

  function saveHistoryLog(log) {
    const logs = getHistoryLogs();
    logs.unshift(log); // newest first
    localStorage.setItem("rccb_tripping_logs", JSON.stringify(logs));
  }

  function deleteHistoryLog(id) {
    let logs = getHistoryLogs();
    logs = logs.filter(l => l.id !== id);
    localStorage.setItem("rccb_tripping_logs", JSON.stringify(logs));
    loadHistoryLogs();
  }

  function loadHistoryLogs() {
    if (!logsList) return;
    logsList.innerHTML = "";
    const logs = getHistoryLogs();

    if (logs.length === 0) {
      if (logsEmptyMsg) logsEmptyMsg.style.display = "block";
      logsList.appendChild(logsEmptyMsg);
      return;
    }

    if (logsEmptyMsg) logsEmptyMsg.style.display = "none";

    logs.forEach(log => {
      const card = document.createElement("div");
      card.className = "rccb-log-card";
      card.innerHTML = `
        <div class="rccb-log-header">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span class="rccb-log-title">${escapeHtml(log.title)}</span>
            <span class="rccb-log-mcb-badge">${escapeHtml(log.mcb)}</span>
          </div>
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <span style="font-size:0.75rem; color:var(--text-muted);">${log.date}</span>
            <button class="rccb-log-btn-delete" data-id="${log.id}">Delete</button>
          </div>
        </div>
        <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.5; margin:0;">
          <strong>Symptoms & Findings:</strong> ${escapeHtml(log.findings)}
        </p>
        <p style="font-size:0.85rem; color:var(--accent-green); font-weight:500; margin:0;">
          <strong>✔️ Resolution:</strong> ${escapeHtml(log.resolution)}
        </p>
      `;

      // Bind delete button
      card.querySelector(".rccb-log-btn-delete").addEventListener("click", (e) => {
        const logId = e.target.getAttribute("data-id");
        deleteHistoryLog(logId);
        if (typeof window.playBeepSound === "function") window.playBeepSound();
      });

      logsList.appendChild(card);
    });
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  if (logForm) {
    logForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const newLog = {
        id: "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
        title: logTitleInput.value.trim(),
        mcb: logMcbSelect.value,
        findings: logFindingsInput.value.trim(),
        resolution: logResolutionInput.value.trim(),
        date: new Date().toLocaleDateString()
      };

      saveHistoryLog(newLog);

      // Reset form
      logTitleInput.value = "";
      logFindingsInput.value = "";
      logResolutionInput.value = "";

      if (typeof window.playDmmClickSound === "function") window.playDmmClickSound();
      loadHistoryLogs();
    });
  }

  // 3. AI Chatbot
  const chatHistory = document.getElementById("rccb-chat-history");
  const chatInput = document.getElementById("rccb-chat-input");
  const chatSendBtn = document.getElementById("rccb-chat-send");
  const chatChips = document.querySelectorAll("#rccb-chat-chips .chat-chip");

  function appendChatMessage(sender, text) {
    if (!chatHistory) return;
    const msg = document.createElement("div");
    msg.className = `chat-msg ${sender}`;
    msg.innerHTML = text; // Allow rich text/html rendering
    chatHistory.appendChild(msg);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  function getChatResponse(query) {
    const q = query.toLowerCase();

    // Check for inverter flickering
    if (q.includes("flicker") || q.includes("invt") || q.includes("inverter")) {
      return `
        <strong>🤖 Inverter Feedback Analysis:</strong><br>
        Flickering lights or RCCB trips during inverter/backup power are usually caused by:
        <ul>
          <li><strong>Shared/Crossed Neutrals:</strong> If the inverter's output neutral is tied back to the utility neutral bar downstream of the RCCB, current will flow in a parallel loop.</li>
          <li><strong>Earth Bonding relay:</strong> Inverters bond neutral-to-ground internally during battery mode. If there is a minor neutral leakage in the lighting circuit, it will feed back and trip the upstream RCCB or trigger floating neutral voltage changes (causing flickering LEDs).</li>
        </ul>
        <strong>Isolation Step:</strong> Disconnect inverter outputs entirely or use a double-pole switch to isolate both Phase and Neutral from utility buses when running backup.
      `;
    }

    // Check for disconnected neutral arcing / ceiling light driver
    if (q.includes("driver") || q.includes("celling") || q.includes("disconnected") || q.includes("pop") || q.includes("blink") || q.includes("noise")) {
      return `
        <strong>🤖 "Backdoor" Neutral-Earth Arc Warning:</strong><br>
        If a driver or ceiling light blinks, makes a pop/noise, or trips the RCCB even when the Neutral is disconnected:
        <ul>
          <li><strong>Wall insulation breakdown:</strong> The Neutral wire of that circuit has a leakage to Earth inside the walls. Under a 9V DC multimeter test, it might show a high resistance (like 154kΩ).</li>
          <li><strong>230V AC arcing:</strong> When 230V AC mains is applied, the high voltage arced over this breakdown point, reducing resistance to almost 0 ohms. Current flows in from Phase, through the driver, and down the faulty Neutral wire directly into Earth, bypassing the DB Neutral Bar entirely!</li>
        </ul>
        <strong>Isolation Step:</strong> Inspect the junction box and wiring routing for carbon tracking, moisture, or rodent damage. Swapping the driver alone will not fix this; you must replace the damaged wire conductor.
      `;
    }

    // Check for multimeter resistance mismatch
    if (q.includes("multimeter") || q.includes("resistance") || q.includes("ohm") || q.includes("9v")) {
      return `
        <strong>🤖 Multimeter 9V DC vs 230V AC Breakdown:</strong><br>
        A multimeter checks resistance using a low voltage (typically 9V DC battery).
        <ul>
          <li>At 9V, a wet junction box or damaged wire might measure a safe-looking high resistance (e.g. 150 kΩ).</li>
          <li>At 230V AC, the peak voltage is ~325V. This electrical stress easily **arcs over** carbon tracks or moisture, breaking down insulation dynamically to near 0 ohms, drawing heavy currents and tripping the RCCB.</li>
        </ul>
        <strong>Advice:</strong> Always use an insulation tester (Megger) at 250V or 500V DC to inspect wall wires rather than relying solely on a standard multimeter ohm-meter.
      `;
    }

    // Check for rain / moisture
    if (q.includes("rain") || q.includes("moisture") || q.includes("wet") || q.includes("water") || q.includes("outdoor")) {
      return `
        <strong>🤖 Rain & Moisture Tripping:</strong><br>
        Tripping that happens only during rain or high humidity points directly to:
        <ul>
          <li>Outdoor garden lighting junction boxes.</li>
          <li>Wall socket boards mounted on exterior walls where moisture seep occurs.</li>
          <li>Water heater (Geyser) terminals leaking internally.</li>
        </ul>
        <strong>Advice:</strong> Disconnect outdoor MCBs during heavy rain to verify if the RCCB holds. Ensure all external boxes are IP65 weather-rated and use bottom conduit entries to prevent water tracking in.
      `;
    }

    // General response
    return `
      <strong>🤖 Offline Assistant analysis:</strong><br>
      I recognized your concern. If you are diagnosing a tripping issue, follow these standard practices:
      <ol>
        <li>Unplug all appliances from sockets to isolate Neutral-to-Earth appliance leaks.</li>
        <li>Switch off MCBs, reset RCCB, then switch MCBs ON one by one to find the faulty loop.</li>
        <li>If it still trips, disconnect the Neutral wire of the suspected circuit from the Neutral bus bar to confirm a wall wiring fault.</li>
      </ol>
      <em>Try asking specifically about 'inverters', 'flickering', 'disconnections', 'multimeters', or 'rain' for targeted breakdowns!</em>
    `;
  }

  function handleSendChatMessage(text) {
    const query = text.trim();
    if (!query) return;

    // Append user message
    appendChatMessage("user", escapeHtml(query));
    chatInput.value = "";

    if (typeof window.playDmmClickSound === "function") window.playDmmClickSound();

    // Show typing state
    setTimeout(() => {
      const reply = getChatResponse(query);
      appendChatMessage("assistant", reply);
      if (typeof window.playBeepSound === "function") window.playBeepSound();
    }, 600);
  }

  if (chatSendBtn && chatInput) {
    chatSendBtn.addEventListener("click", () => {
      handleSendChatMessage(chatInput.value);
    });

    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handleSendChatMessage(chatInput.value);
      }
    });
  }

  chatChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const query = chip.getAttribute("data-query");
      handleSendChatMessage(query);
    });
  });

  // Global DMM dial initializer hook
  window.initRccbGuide = function() {
    // Reset tabs to wizard
    subTabs.forEach(t => t.classList.remove("active"));
    const firstTab = document.querySelector('#rccb-sub-tabs .tab-btn[data-rccb-tab="wizard"]');
    if (firstTab) firstTab.classList.add("active");

    tabContents.forEach(content => {
      if (content.id === "rccb-tab-wizard") {
        content.style.display = "flex";
      } else {
        content.style.display = "none";
      }
    });

    // Reset view inside wizard tab to setup questionnaire
    if (setupPanel) setupPanel.style.display = "block";
    if (wizardPanel) wizardPanel.style.display = "none";
    drawDistributionBoard();
  };
});

