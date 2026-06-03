// Electronics Companion App Data Store
const COMPONENT_DB = [
  // DIODES
  {
    id: "1n4007",
    name: "1N4007",
    type: "Diode",
    category: "rectifier",
    package: "DO-41 (Axial)",
    description: "Standard silicon rectifier diode. Ideal for power supply rectification, freewheeling, and reverse polarity protection.",
    specs: {
      "Max Repetitive Reverse Voltage (Vrrm)": "1000 V",
      "Average Forward Rectified Current (Io)": "1.0 A",
      "Max Forward Voltage Drop (Vf)": "1.1 V @ 1A",
      "Max Reverse Current (Ir)": "5.0 µA",
      "Operating Temperature Range": "-55 to +175 °C"
    },
    pinout: {
      type: "axial",
      pins: [
        { name: "Anode", label: "A (No band)" },
        { name: "Cathode", label: "K (Band side)" }
      ]
    },
    datasheetQuery: "1N4007"
  },
  {
    id: "1n4148",
    name: "1N4148",
    type: "Diode",
    category: "signal",
    package: "DO-35 (Axial glass)",
    description: "High-speed switching signal diode. Extremely popular for general-purpose fast switching, wave shaping, and logic circuits.",
    specs: {
      "Max Repetitive Reverse Voltage (Vrrm)": "100 V",
      "Average Forward Current (Io)": "300 mA",
      "Max Forward Voltage (Vf)": "1.0 V @ 10mA",
      "Reverse Recovery Time (Trr)": "4.0 ns",
      "Power Dissipation": "500 mW"
    },
    pinout: {
      type: "axial",
      pins: [
        { name: "Anode", label: "A (No band)" },
        { name: "Cathode", label: "K (Black band side)" }
      ]
    },
    datasheetQuery: "1N4148"
  },
  {
    id: "1n5819",
    name: "1N5819",
    type: "Diode",
    category: "schottky",
    package: "DO-41 (Axial)",
    description: "Schottky barrier diode. Features ultra-low forward voltage drop and extremely fast switching. Perfect for high-frequency switch-mode power supplies (SMPS) and low-voltage inverter circuits.",
    specs: {
      "Max Repetitive Reverse Voltage (Vrrm)": "40 V",
      "Average Forward Current (Io)": "1.0 A",
      "Max Forward Voltage (Vf)": "0.6 V @ 1A",
      "Max Reverse Current (Ir)": "1.0 mA",
      "Junction Capacitance": "110 pF"
    },
    pinout: {
      type: "axial",
      pins: [
        { name: "Anode", label: "A (No band)" },
        { name: "Cathode", label: "K (Band side)" }
      ]
    },
    datasheetQuery: "1N5819"
  },
  {
    id: "1n5231b",
    name: "1N5231B",
    type: "Diode",
    category: "zener",
    package: "DO-35 (Axial glass)",
    description: "Silicon Zener diode for voltage regulation. Maintains a stable voltage across itself when reverse biased at or above its breakdown voltage.",
    specs: {
      "Nominal Zener Voltage (Vz)": "5.1 V",
      "Zener Impedance (Zzt)": "17 Ω",
      "Max Power Dissipation (Pd)": "500 mW",
      "Tolerance": "±5%"
    },
    pinout: {
      type: "axial",
      pins: [
        { name: "Anode", label: "A (No band)" },
        { name: "Cathode", label: "K (Band side)" }
      ]
    },
    datasheetQuery: "1N5231B"
  },

  // TRANSISTORS
  {
    id: "bc547",
    name: "BC547",
    type: "Transistor",
    category: "NPN BJT",
    package: "TO-92 (Plastic)",
    description: "Standard NPN bipolar junction transistor (BJT) designed for low-power switching and pre-amplifier circuits. Extremely common in hobby projects.",
    specs: {
      "Collector-Emitter Voltage (Vceo)": "45 V",
      "Collector-Base Voltage (Vcbo)": "50 V",
      "Collector Current (Ic max)": "100 mA",
      "DC Current Gain (hFE)": "110 to 800",
      "Transition Frequency (ft)": "300 MHz",
      "Max Power Dissipation (Ptot)": "500 mW"
    },
    pinout: {
      type: "3-pin",
      layout: "Flat side facing you, pins pointing down:",
      pins: [
        { num: 1, name: "Collector", desc: "C (Right pin)" },
        { num: 2, name: "Base", desc: "B (Middle pin)" },
        { num: 3, name: "Emitter", desc: "E (Left pin)" }
      ]
    },
    datasheetQuery: "BC547"
  },
  {
    id: "bc557",
    name: "BC557",
    type: "Transistor",
    category: "PNP BJT",
    package: "TO-92 (Plastic)",
    description: "Standard PNP bipolar junction transistor (BJT). The complementary partner to BC547, widely used for low-power switching and amplification.",
    specs: {
      "Collector-Emitter Voltage (Vceo)": "-45 V",
      "Collector-Base Voltage (Vcbo)": "-50 V",
      "Collector Current (Ic max)": "-100 mA",
      "DC Current Gain (hFE)": "110 to 800",
      "Max Power Dissipation (Ptot)": "500 mW"
    },
    pinout: {
      type: "3-pin",
      layout: "Flat side facing you, pins pointing down:",
      pins: [
        { num: 1, name: "Collector", desc: "C (Right pin)" },
        { num: 2, name: "Base", desc: "B (Middle pin)" },
        { num: 3, name: "Emitter", desc: "E (Left pin)" }
      ]
    },
    datasheetQuery: "BC557"
  },
  {
    id: "2n2222",
    name: "2N2222A",
    type: "Transistor",
    category: "NPN BJT",
    package: "TO-92 / TO-18 (Metal Can)",
    description: "High-speed NPN switching transistor. Features higher collector current (up to 800mA) than BC547, making it excellent for driving relays, small motors, and high-power LEDs.",
    specs: {
      "Collector-Emitter Voltage (Vceo)": "40 V",
      "Collector Current (Ic max)": "800 mA",
      "DC Current Gain (hFE)": "100 to 300",
      "Max Switching Frequency": "250 MHz",
      "Power Dissipation": "625 mW"
    },
    pinout: {
      type: "3-pin",
      layout: "TO-92 plastic package (Flat side facing you):",
      pins: [
        { num: 1, name: "Emitter", desc: "E (Left pin)" },
        { num: 2, name: "Base", desc: "B (Middle pin)" },
        { num: 3, name: "Collector", desc: "C (Right pin)" }
      ]
    },
    datasheetQuery: "2N2222A"
  },
  {
    id: "irf540n",
    name: "IRF540N",
    type: "Transistor",
    category: "N-Channel MOSFET",
    package: "TO-220AB",
    description: "Power MOSFET using advanced HEXFET technology. Features extremely low on-resistance and ultra-fast switching. Commonly used in DC-DC converters, motor control, and solenoid drivers.",
    specs: {
      "Drain-Source Voltage (Vdss)": "100 V",
      "Continuous Drain Current (Id)": "33 A @ 25°C",
      "Static Drain-Source On-Resistance Rds(on)": "0.044 Ω max",
      "Gate Threshold Voltage Vgs(th)": "2.0 V to 4.0 V",
      "Max Power Dissipation (Pd)": "130 W"
    },
    pinout: {
      type: "3-pin",
      layout: "Metal tab at top, printing facing you:",
      pins: [
        { num: 1, name: "Gate", desc: "G (Left pin)" },
        { num: 2, name: "Drain", desc: "D (Middle pin / Tab)" },
        { num: 3, name: "Source", desc: "S (Right pin)" }
      ]
    },
    datasheetQuery: "IRF540N"
  },

  // LINEAR REGULATORS
  {
    id: "lm7805",
    name: "LM7805",
    type: "Regulator",
    category: "Linear Voltage Regulator",
    package: "TO-220",
    description: "Three-terminal positive linear voltage regulator. Provides a stable +5V output. Features internal current limiting and thermal shutdown protection.",
    specs: {
      "Output Voltage": "5.0 V",
      "Input Voltage Range": "7.0 V to 25 V",
      "Max Output Current": "1.5 A (with adequate heatsink)",
      "Dropout Voltage": "2.0 V",
      "Quiescent Current": "5.0 mA"
    },
    pinout: {
      type: "3-pin",
      layout: "Metal tab at top, printing facing you:",
      pins: [
        { num: 1, name: "Input", desc: "IN (Left pin)" },
        { num: 2, name: "Ground", desc: "GND (Middle pin / Tab)" },
        { num: 3, name: "Output", desc: "OUT (Right pin)" }
      ]
    },
    datasheetQuery: "LM7805"
  },
  {
    id: "lm317",
    name: "LM317",
    type: "Regulator",
    category: "Adjustable Linear Regulator",
    package: "TO-220",
    description: "Adjustable 3-terminal positive voltage regulator. Capable of supplying in excess of 1.5 A over an output voltage range of 1.25 V to 37 V. Requires only two external resistors to set the output voltage.",
    specs: {
      "Output Voltage Range": "1.25 V to 37 V",
      "Input-Output Voltage Diff": "Up to 40 V",
      "Max Output Current": "1.5 A",
      "Reference Voltage (Vref)": "1.25 V",
      "Line Regulation": "0.01% / V"
    },
    pinout: {
      type: "3-pin",
      layout: "Metal tab at top, printing facing you:",
      pins: [
        { num: 1, name: "Adjustment", desc: "ADJ (Left pin)" },
        { num: 2, name: "Output", desc: "OUT (Middle pin / Tab)" },
        { num: 3, name: "Input", desc: "IN (Right pin)" }
      ]
    },
    datasheetQuery: "LM317"
  },

  // INTEGRATED CIRCUITS (ICs)
  {
    id: "ne555",
    name: "NE555",
    type: "IC",
    category: "Timer IC",
    package: "DIP-8 / SOIC-8",
    description: "Highly stable controller capable of producing accurate time delays or oscillation. Widely used for pulse-width modulation (PWM), astable multivibrators (blinkers), and monostable timers.",
    specs: {
      "Supply Voltage (Vcc)": "4.5 V to 16 V",
      "Max Output Current": "200 mA (Source or Sink)",
      "Timing Range": "Microseconds to Hours",
      "Max Frequency (Astable)": "~ 500 kHz",
      "Temperature Stability": "0.005% per °C"
    },
    pinout: {
      type: "ic-8",
      pins: [
        { pin: 1, name: "GND", side: "left", desc: "Ground (0V)" },
        { pin: 2, name: "TRIG", side: "left", desc: "Trigger (starts timer when < 1/3 Vcc)" },
        { pin: 3, name: "OUT", side: "left", desc: "Output (pulls up or down)" },
        { pin: 4, name: "RESET", side: "left", desc: "Reset (active low, disables timer)" },
        { pin: 8, name: "VCC", side: "right", desc: "Supply Voltage (+4.5V to +16V)" },
        { pin: 7, name: "DISCH", side: "right", desc: "Discharge (discharges timing capacitor)" },
        { pin: 6, name: "THR", side: "right", desc: "Threshold (ends timing when > 2/3 Vcc)" },
        { pin: 5, name: "CTRL", side: "right", desc: "Control Voltage (modifies internal divider)" }
      ]
    },
    datasheetQuery: "NE555"
  },
  {
    id: "lm358",
    name: "LM358",
    type: "IC",
    category: "Dual Operational Amplifier",
    package: "DIP-8 / SOIC-8",
    description: "Low-power dual operational amplifier. Designed to operate from a single power supply over a wide range of voltages. Commonly used for signal amplification, filtering, active rectifiers, and analog computation.",
    specs: {
      "Supply Voltage Range (Single)": "3.0 V to 32 V",
      "Supply Voltage Range (Dual)": "±1.5 V to ±16 V",
      "DC Voltage Gain": "100 dB",
      "Unity Gain Bandwidth": "1.0 MHz",
      "Input Offset Voltage": "2.0 mV"
    },
    pinout: {
      type: "ic-8",
      pins: [
        { pin: 1, name: "OUT1", side: "left", desc: "Output of Op-Amp 1" },
        { pin: 2, name: "IN1-", side: "left", desc: "Inverting Input of Op-Amp 1" },
        { pin: 3, name: "IN1+", side: "left", desc: "Non-inverting Input of Op-Amp 1" },
        { pin: 4, name: "GND/V-", side: "left", desc: "Ground or Negative Supply" },
        { pin: 8, name: "VCC/V+", side: "right", desc: "Positive Supply (+3V to +32V)" },
        { pin: 7, name: "OUT2", side: "right", desc: "Output of Op-Amp 2" },
        { pin: 6, name: "IN2-", side: "right", desc: "Inverting Input of Op-Amp 2" },
        { pin: 5, name: "IN2+", side: "right", desc: "Non-inverting Input of Op-Amp 2" }
      ]
    },
    datasheetQuery: "LM358"
  },
  {
    id: "lm386",
    name: "LM386",
    type: "IC",
    category: "Low Voltage Audio Power Amp",
    package: "DIP-8 / SOIC-8",
    description: "Audio power amplifier designed for use in low voltage consumer applications. The gain is internally set to 20, but adding an external resistor and capacitor between pins 1 and 8 increases gain up to 200.",
    specs: {
      "Supply Voltage Range": "4.0 V to 12 V (standard), 5.0 V to 18 V (LM386N-4)",
      "Output Power": "325 mW up to 1.0 W",
      "Quiescent Current Drain": "4.0 mA",
      "Voltage Gain Range": "20 to 200 (adjustable)",
      "Distortion (THD)": "0.2% typical"
    },
    pinout: {
      type: "ic-8",
      pins: [
        { pin: 1, name: "GAIN1", side: "left", desc: "Gain adjustment pin 1" },
        { pin: 2, name: "INPUT-", side: "left", desc: "Inverting Input" },
        { pin: 3, name: "INPUT+", side: "left", desc: "Non-inverting Input" },
        { pin: 4, name: "GND", side: "left", desc: "Ground" },
        { pin: 8, name: "GAIN2", side: "right", desc: "Gain adjustment pin 2" },
        { pin: 7, name: "BYPASS", side: "right", desc: "Bypass capacitor terminal" },
        { pin: 6, name: "VS", side: "right", desc: "Positive Supply Voltage" },
        { pin: 5, name: "VOUT", side: "right", desc: "Amplified Audio Output" }
      ]
    },
    datasheetQuery: "LM386"
  },

  // MICROCONTROLLER BOARDS / MODULES
  {
    id: "esp32",
    name: "ESP32 DevKit v1",
    type: "Microcontroller",
    category: "Wi-Fi & Bluetooth MCU",
    package: "30-pin Development Board",
    description: "Highly integrated system-on-a-chip (SoC) micro-controller with 2.4 GHz dual-mode Wi-Fi and Bluetooth. Dual-core Tensilica Xtensa LX6 microprocessor. Extremely popular for IoT (Internet of Things) designs.",
    specs: {
      "Processor Core": "Dual-Core 32-bit Xtensa LX6",
      "Operating Voltage": "3.3 V",
      "SRAM Size": "520 KB",
      "Flash Memory": "4.0 MB",
      "Clock Speed": "Up to 240 MHz",
      "ADC Channels": "18 (12-bit resolution)",
      "DAC Channels": "2 (8-bit resolution)"
    },
    pinout: {
      type: "board-30",
      layout: "USB connector at bottom, top view:",
      pins: [
        // Left side (15 pins)
        { pin: 1, name: "3V3", side: "left", desc: "3.3V Output Regulator" },
        { pin: 2, name: "GND", side: "left", desc: "Ground" },
        { pin: 3, name: "D15", side: "left", desc: "GPIO15 / ADC2_CH3 / Touch3 / HSPI_SS" },
        { pin: 4, name: "D2", side: "left", desc: "GPIO2 / ADC2_CH2 / Touch2 / LED" },
        { pin: 5, name: "D4", side: "left", desc: "GPIO4 / ADC2_CH0 / Touch0" },
        { pin: 6, name: "RX2", side: "left", desc: "GPIO16 / UART2 RX" },
        { pin: 7, name: "TX2", side: "left", desc: "GPIO17 / UART2 TX" },
        { pin: 8, name: "D5", side: "left", desc: "GPIO5 / VSPI_SS" },
        { pin: 9, name: "D18", side: "left", desc: "GPIO18 / VSPI_SCK" },
        { pin: 10, name: "D19", side: "left", desc: "GPIO19 / VSPI_MISO" },
        { pin: 11, name: "D21", side: "left", desc: "GPIO21 / I2C SDA" },
        { pin: 12, name: "RX0", side: "left", desc: "GPIO3 / UART0 RX (Console)" },
        { pin: 13, name: "TX0", side: "left", desc: "GPIO1 / UART0 TX (Console)" },
        { pin: 14, name: "D22", side: "left", desc: "GPIO22 / I2C SCL" },
        { pin: 15, name: "D23", side: "left", desc: "GPIO23 / VSPI_MOSI" },

        // Right side (15 pins)
        { pin: 30, name: "VIN", side: "right", desc: "External Input Power (5V to 9V)" },
        { pin: 29, name: "GND", side: "right", desc: "Ground" },
        { pin: 28, name: "D13", side: "right", desc: "GPIO13 / ADC2_CH4 / Touch4 / HSPI_MOSI" },
        { pin: 27, name: "D12", side: "right", desc: "GPIO12 / ADC2_CH5 / Touch5 / HSPI_MISO" },
        { pin: 26, name: "D14", side: "right", desc: "GPIO14 / ADC2_CH6 / Touch6 / HSPI_SCK" },
        { pin: 25, name: "D27", side: "right", desc: "GPIO27 / ADC2_CH7 / Touch7" },
        { pin: 24, name: "D26", side: "right", desc: "GPIO26 / ADC2_CH9 / DAC2" },
        { pin: 23, name: "D25", side: "right", desc: "GPIO25 / ADC2_CH8 / DAC1" },
        { pin: 22, name: "D33", side: "right", desc: "GPIO33 / ADC1_CH5 / Touch8" },
        { pin: 21, name: "D32", side: "right", desc: "GPIO32 / ADC1_CH4 / Touch9" },
        { pin: 20, name: "D35", side: "right", desc: "GPIO35 / ADC1_CH2 (Input Only)" },
        { pin: 19, name: "D34", side: "right", desc: "GPIO34 / ADC1_CH6 (Input Only)" },
        { pin: 18, name: "VN", side: "right", desc: "GPIO39 / SENSOR_VN (Input Only)" },
        { pin: 17, name: "VP", side: "right", desc: "GPIO36 / SENSOR_VP (Input Only)" },
        { pin: 16, name: "EN", side: "right", desc: "Enable / Reset Pin" }
      ]
    },
    datasheetQuery: "ESP32 DevKit"
  }
];

// RESISTOR TABLES
const RESISTOR_COLORS = {
  black:  { value: 0, multiplier: 1,          tolerance: null,    tempCoeff: null },
  brown:  { value: 1, multiplier: 10,         tolerance: 1,       tempCoeff: 100  },
  red:    { value: 2, multiplier: 100,        tolerance: 2,       tempCoeff: 50   },
  orange: { value: 3, multiplier: 1000,       tolerance: null,    tempCoeff: 15   },
  yellow: { value: 4, multiplier: 10000,      tolerance: null,    tempCoeff: 25   },
  green:  { value: 5, multiplier: 100000,     tolerance: 0.5,     tempCoeff: 10   },
  blue:   { value: 6, multiplier: 1000000,    tolerance: 0.25,    tempCoeff: 5    },
  violet: { value: 7, multiplier: 10000000,   tolerance: 0.1,     tempCoeff: 1    },
  grey:   { value: 8, multiplier: 100000000,  tolerance: 0.05,    tempCoeff: null },
  white:  { value: 9, multiplier: 1000000000, tolerance: null,    tempCoeff: null },
  gold:   { value: -1, multiplier: 0.1,        tolerance: 5,       tempCoeff: null },
  silver: { value: -1, multiplier: 0.01,       tolerance: 10,      tempCoeff: null }
};

// CAPACITOR TOLERANCE MAP
const CAPACITOR_TOLERANCES = {
  B: "±0.1 pF",
  C: "±0.25 pF",
  D: "±0.5 pF",
  F: "±1%",
  G: "±2%",
  H: "±3%",
  J: "±5%",
  K: "±10%",
  M: "±20%",
  Z: "+80%, -20%"
};

// Common LED parameters for LED calculator
const LED_TYPES = [
  { name: "Red Indicator (Standard)", voltage: 1.8, current: 20 },
  { name: "Green Indicator (Standard)", voltage: 2.1, current: 20 },
  { name: "Yellow Indicator (Standard)", voltage: 2.0, current: 20 },
  { name: "Blue (High Brightness)", voltage: 3.2, current: 20 },
  { name: "White (High Brightness)", voltage: 3.2, current: 20 },
  { name: "Low Power LED (any color)", voltage: 2.0, current: 2 }
];

// INDUCTOR COLOR TABLES (Base Unit is uH - Microhenries)
const INDUCTOR_COLORS = {
  black:  { value: 0, multiplier: 1,      tolerance: 20 },
  brown:  { value: 1, multiplier: 10,     tolerance: 1  },
  red:    { value: 2, multiplier: 100,    tolerance: 2  },
  orange: { value: 3, multiplier: 1000,   tolerance: 3  },
  yellow: { value: 4, multiplier: 10000,  tolerance: 4  },
  green:  { value: 5, multiplier: null,   tolerance: null },
  blue:   { value: 6, multiplier: null,   tolerance: null },
  violet: { value: 7, multiplier: null,   tolerance: null },
  grey:   { value: 8, multiplier: null,   tolerance: null },
  white:  { value: 9, multiplier: null,   tolerance: null },
  gold:   { value: -1, multiplier: 0.1,    tolerance: 5  },
  silver: { value: -1, multiplier: 0.01,   tolerance: 10 }
};

// Offline Equivalents and Substitutions Database
const EQUIVALENTS_DB = [
  {
    id: "bc547",
    name: "BC547",
    category: "NPN BJT",
    type: "Transistor",
    package: "TO-92",
    specs: { "Vceo": "45 V", "Ic max": "100 mA", "hFE": "110-800", "ft": "300 MHz" },
    alternatives: [
      { name: "2N3904", match: "Excellent", package: "TO-92 (Pinout reversed: E-B-C)", specs: { "Vceo": "40 V", "Ic max": "200 mA", "hFE": "100-300", "ft": "300 MHz" }, note: "Very common substitute. Note that the pinout is reversed (E-B-C instead of C-B-E). Double check orientation!" },
      { name: "BC548", match: "Direct", package: "TO-92 (C-B-E)", specs: { "Vceo": "30 V", "Ic max": "100 mA", "hFE": "110-800", "ft": "300 MHz" }, note: "Direct drop-in replacement. Slightly lower collector-emitter breakdown voltage (30V vs 45V). Perfect for low voltage (5V/12V) circuits." },
      { name: "2N2222A", match: "Good", package: "TO-92 (E-B-C)", specs: { "Vceo": "40 V", "Ic max": "800 mA", "hFE": "100-300", "ft": "250 MHz" }, note: "Higher current limit (800mA vs 100mA). Great if driving heavy loads like relays or motors. Reverse pinout applies." }
    ]
  },
  {
    id: "bc557",
    name: "BC557",
    category: "PNP BJT",
    type: "Transistor",
    package: "TO-92",
    specs: { "Vceo": "-45 V", "Ic max": "-100 mA", "hFE": "110-800" },
    alternatives: [
      { name: "2N3906", match: "Excellent", package: "TO-92 (E-B-C)", specs: { "Vceo": "-40 V", "Ic max": "-200 mA", "hFE": "100-300" }, note: "Standard PNP substitute. Reversed pinout compared to BC557 (E-B-C instead of C-B-E)." },
      { name: "BC558", match: "Direct", package: "TO-92 (C-B-E)", specs: { "Vceo": "-30 V", "Ic max": "-100 mA", "hFE": "110-800" }, note: "Direct drop-in replacement. Lower voltage rating (30V vs 45V), perfect for low voltage systems." },
      { name: "2N2907A", match: "Good", package: "TO-92 (E-B-C)", specs: { "Vceo": "-60 V", "Ic max": "-600 mA", "hFE": "100-300" }, note: "Higher voltage and current rating. Pinout is reversed (E-B-C)." }
    ]
  },
  {
    id: "2n2222a",
    name: "2N2222A",
    category: "NPN BJT",
    type: "Transistor",
    package: "TO-92 / TO-18",
    specs: { "Vceo": "40 V", "Ic max": "800 mA", "hFE": "100-300" },
    alternatives: [
      { name: "PN2222", match: "Direct", package: "TO-92 (E-B-C)", specs: { "Vceo": "40 V", "Ic max": "600 mA", "hFE": "100-300" }, note: "Plastic package equivalent. Direct electrical substitute." },
      { name: "2N3904", match: "Good", package: "TO-92 (E-B-C)", specs: { "Vceo": "40 V", "Ic max": "200 mA", "hFE": "100-300" }, note: "Lower current rating (200mA vs 800mA). Suitable only if load current is under 150mA." },
      { name: "BC547", match: "Fair", package: "TO-92 (C-B-E)", specs: { "Vceo": "45 V", "Ic max": "100 mA", "hFE": "110-800" }, note: "Much lower current limit (100mA). Pinout is reversed (C-B-E). Use with caution!" }
    ]
  },
  {
    id: "1n4007",
    name: "1N4007",
    category: "Rectifier Diode",
    type: "Diode",
    package: "DO-41",
    specs: { "Vrrm": "1000 V", "Io": "1.0 A", "Vf": "1.1 V", "Trr": "2.0 µs" },
    alternatives: [
      { name: "1N4004", match: "Direct", package: "DO-41", specs: { "Vrrm": "400 V", "Io": "1.0 A", "Vf": "1.1 V", "Trr": "2.0 µs" }, note: "Direct drop-in for low voltage supplies. Breakdown voltage is lower (400V vs 1000V) but identical current (1A)." },
      { name: "UF4007", match: "Excellent", package: "DO-41", specs: { "Vrrm": "1000 V", "Io": "1.0 A", "Vf": "1.7 V", "Trr": "75 ns" }, note: "Ultra-fast recovery diode. Direct replacement and performs better in high-frequency SMPS converters, but has slightly higher voltage drop (1.7V)." },
      { name: "1N5408", match: "Good", package: "DO-201 (Larger)", specs: { "Vrrm": "1000 V", "Io": "3.0 A", "Vf": "1.2 V", "Trr": "3.0 µs" }, note: "Upgrade replacement. Handles 3A instead of 1A. Physical size is larger, make sure it fits on the PCB." }
    ]
  },
  {
    id: "1n4148",
    name: "1N4148",
    category: "Signal Diode",
    type: "Diode",
    package: "DO-35",
    specs: { "Vrrm": "100 V", "Io": "300 mA", "Vf": "1.0 V", "Trr": "4.0 ns" },
    alternatives: [
      { name: "1N914", match: "Direct", package: "DO-35", specs: { "Vrrm": "100 V", "Io": "200 mA", "Vf": "1.0 V", "Trr": "4.0 ns" }, note: "Almost identical characteristics and historically used interchangeably." },
      { name: "BAT41", match: "Good", package: "DO-35 (Schottky)", specs: { "Vrrm": "100 V", "Io": "100 mA", "Vf": "0.45 V", "Trr": "1.0 ns" }, note: "Schottky signal diode. Lower forward voltage drop (0.45V vs 1.0V) and faster speed, but lower current limit (100mA)." }
    ]
  },
  {
    id: "1n5819",
    name: "1N5819",
    category: "Schottky Diode",
    type: "Diode",
    package: "DO-41",
    specs: { "Vrrm": "40 V", "Io": "1.0 A", "Vf": "0.6 V" },
    alternatives: [
      { name: "1N5817", match: "Direct", package: "DO-41", specs: { "Vrrm": "20 V", "Io": "1.0 A", "Vf": "0.45 V" }, note: "Direct replacement. Lower breakdown voltage (20V vs 40V) but lower forward voltage drop (better efficiency)." },
      { name: "1N5818", match: "Direct", package: "DO-41", specs: { "Vrrm": "30 V", "Io": "1.0 A", "Vf": "0.55 V" }, note: "Direct replacement. Breakdown voltage is 30V." },
      { name: "BAT42", match: "Fair", package: "DO-35 (Smaller)", specs: { "Vrrm": "30 V", "Io": "200 mA", "Vf": "0.4 V" }, note: "Much smaller current capacity (200mA). Use only for low-power signal rectifying." }
    ]
  },
  {
    id: "irf540n",
    name: "IRF540N",
    category: "N-Channel MOSFET",
    type: "Transistor",
    package: "TO-220",
    specs: { "Vdss": "100 V", "Id": "33 A", "Rds(on)": "0.044 Ω", "Vgs(th)": "2.0-4.0 V" },
    alternatives: [
      { name: "IRFZ44N", match: "Good", package: "TO-220 (G-D-S)", specs: { "Vdss": "55 V", "Id": "49 A", "Rds(on)": "0.017 Ω", "Vgs(th)": "2.0-4.0 V" }, note: "Lower breakdown voltage (55V vs 100V) but can handle higher current and has lower on-resistance. Ideal for 12V/24V systems." },
      { name: "STP55NF06", match: "Good", package: "TO-220 (G-D-S)", specs: { "Vdss": "60 V", "Id": "50 A", "Rds(on)": "0.018 Ω", "Vgs(th)": "2.0-4.0 V" }, note: "Similar to IRFZ44N, lower voltage, higher current rating." }
    ]
  },
  {
    id: "lm7805",
    name: "LM7805",
    category: "Linear Regulator",
    type: "Regulator",
    package: "TO-220",
    specs: { "Vout": "5.0 V", "Vin max": "35 V", "Io max": "1.5 A" },
    alternatives: [
      { name: "UA7805", match: "Direct", package: "TO-220 (IN-GND-OUT)", specs: { "Vout": "5.0 V", "Vin max": "25 V", "Io max": "1.5 A" }, note: "Direct drop-in. Identical pins and operation." },
      { name: "MC7805", match: "Direct", package: "TO-220 (IN-GND-OUT)", specs: { "Vout": "5.0 V", "Vin max": "35 V", "Io max": "1.5 A" }, note: "Direct drop-in from ON Semi. Identical pins." },
      { name: "LM340-5", match: "Direct", package: "TO-220 (IN-GND-OUT)", specs: { "Vout": "5.0 V", "Vin max": "35 V", "Io max": "1.5 A" }, note: "TI equivalent model. Direct drop-in." }
    ]
  },
  {
    id: "lm317",
    name: "LM317",
    category: "Adjustable Regulator",
    type: "Regulator",
    package: "TO-220",
    specs: { "Vout range": "1.2V-37V", "Vin diff": "40 V", "Io max": "1.5 A" },
    alternatives: [
      { name: "LM117", match: "Direct", package: "TO-220 (ADJ-OUT-IN)", specs: { "Vout range": "1.2V-37V", "Vin diff": "40 V", "Io max": "1.5 A" }, note: "Military/Industrial temperature grade version of LM317. Direct drop-in." },
      { name: "LM350", match: "Good", package: "TO-220 (ADJ-OUT-IN)", specs: { "Vout range": "1.2V-33V", "Vin diff": "35 V", "Io max": "3.0 A" }, note: "High current upgrade. Handles up to 3A instead of 1.5A. Pinout is identical." }
    ]
  }
];
