/**
 * ComplyWise Controlled Demo Profiles
 *
 * Authority: Milestone Step 03 Specification (§35, §36); Step 04 Master Implementation Prompt.
 *
 * Exactly mirrors the five foundational testing & demonstration profiles:
 * 1. VoltPro Power Technologies Pvt Ltd (GaN Chargers & Power Adapters — Pune, MH)
 * 2. Ambuja Heritage Cement Ltd (Portland Cement & Clinker — Chandrapur, MH)
 * 3. Sahyadri Agro Fruits Processing Ltd (Fruit Pulp & Concentrates — Nashik, MH)
 * 4. Ichalkaranji Dyeing & Weaving Mills (Yarn & Textile Dyeing — Kolhapur, MH)
 * 5. NexGen Electronics Import Hub (IT Hardware Import & Distribution — Mumbai, MH)
 */

import type { BusinessProfile } from "./business-profile.ts";

export interface DemoPresetDefinition extends BusinessProfile {
  presetKey: string;
  tagline: string;
  badge: string;
  presetAnswers: Record<string, any>;
}

export const CONTROLLED_DEMO_PROFILES: DemoPresetDefinition[] = [
  {
    presetKey: "charger",
    id: "demo-voltpro-charger",
    businessName: "VoltPro Power Technologies Pvt Ltd",
    businessType: "Private Limited Company",
    pan: "AABCV7812E",
    state: "Maharashtra",
    district: "Pune",
    location: "Phase II, Chakan MIDC Industrial Area, Pune, Maharashtra - 410501",
    activities: [
      "GaN Fast Charger Assembly (IS 13252 / CRS)",
      "USB-C Power Adapter Manufacturing",
      "High-Efficiency Switch-Mode Power Supplies (SMPS)",
      "Finished Goods Export to Middle East & EU",
    ],
    employeeCount: 45,
    manufacturing: true,
    exports: true,
    hazardousMaterials: false,
    bisRegistration: "CRS-2024-9182 (IS 13252: Part 1)",
    sector: "Power Electronics & Consumer Hardware Assembly",
    scale: "Small Enterprise (MSME: UDYAM-MH-26-0048291)",
    officer: "Rajesh K. Kulkarni",
    role: "Head of Statutory Quality & Regulatory Affairs",
    lastSync: "Today, 11:20 AM IST",
    annualTurnoverLakhs: 3200,
    plantInvestmentLakhs: 850,
    industrialZoneStatus: "Approved MIDC Industrial Estate",
    lifecycleStage: "Operational",
    connectedPowerLoad: "75 kW",
    productDescription:
      "65W USB-C GaN fast laptop chargers and power adapters manufacturing plant in Pune, exporting to Dubai",
    tagline: "GaN Fast Laptop Chargers & Adapters (Export to Dubai)",
    badge: "Electronics & Export",
    presetAnswers: {
      Q01: true, // electronic assembly
      Q02: 45,   // workers
      Q03: 75,   // power load in kW
      Q04: true, // export operations
      Q05: false,// boiler installation
      Q06: true, // BIS CRS standard
      Q07: false,// heavy hazardous chemical effluent
      Q08: true, // factory license applicable
      Q09: true, // e-waste handling compliance
      Q10: false,// food safety / FSSAI
      Q11: true, // import export code (IEC)
      Q12: false,// mining / quarrying
      Q13: true, // fire safety NOC
      Q14: true, // GST multi-state / export LUT
      Q15: true, // EPR battery / packaging
    },
  },
  {
    presetKey: "cement",
    id: "demo-ambuja-cement",
    businessName: "Ambuja Heritage Cement Ltd",
    businessType: "Public Limited Company",
    pan: "AAACA4510K",
    state: "Maharashtra",
    district: "Chandrapur",
    location: "Plot 101, MIDC Ghugus, Chandrapur, Maharashtra - 442505",
    activities: [
      "Ordinary Portland Cement (IS 269 Mandatory ISI Mark)",
      "Portland Pozzolana Cement (IS 1489)",
      "Clinker Burning & Heavy Rotary Kiln Operations",
      "Fly Ash Blending & Bulk Bagging Operations",
    ],
    employeeCount: 350,
    manufacturing: true,
    exports: false,
    hazardousMaterials: true,
    bisRegistration: "CM/L-8219401 (IS 269:2015 Mandatory ISI Mark)",
    sector: "Heavy Minerals, Cement & Building Materials",
    scale: "Large Enterprise (Industrial Undertaking)",
    officer: "Sanjay Deshmukh",
    role: "VP Regulatory Affairs & Environmental Compliance",
    lastSync: "Today, 10:15 AM IST",
    annualTurnoverLakhs: 24500,
    plantInvestmentLakhs: 12000,
    industrialZoneStatus: "Heavy Industrial Zone (MIDC Ghugus)",
    lifecycleStage: "Operational",
    connectedPowerLoad: "2500 kW",
    productDescription:
      "Integrated Portland cement and clinker manufacturing plant",
    tagline: "Integrated Portland Cement & Clinker (Red Category)",
    badge: "Heavy Minerals & Red Category",
    presetAnswers: {
      Q01: false,// consumer electronic assembly
      Q02: 350,  // workers
      Q03: 2500, // power load in kW
      Q04: false,// direct export operations
      Q05: true, // industrial captive boiler / kilns
      Q06: true, // mandatory BIS Scheme-I ISI mark
      Q07: true, // heavy dust / emissions / particulate matter
      Q08: true, // factory license (hazardous process)
      Q09: false,// IT hardware e-waste
      Q10: false,// food safety / FSSAI (NEVER applicable to cement)
      Q11: false,// DGFT export IEC
      Q12: true, // captive limestone mining lease
      Q13: true, // central fire & explosive safety clearance
      Q14: true, // continuous ambient air quality monitoring (CAAQMS)
      Q15: true, // hazardous waste management authorization
    },
  },
  {
    presetKey: "food",
    id: "demo-sahyadri-agro",
    businessName: "Sahyadri Agro Fruits Processing Ltd",
    businessType: "Private Limited Company",
    pan: "AAACS9823M",
    state: "Maharashtra",
    district: "Nashik",
    location: "Agro Processing SEZ, Dindori Road, Nashik, Maharashtra - 422004",
    activities: [
      "Aseptic Mango Fruit Pulp & Puree Processing",
      "Citrus & Pomegranate Juice Concentrate Extraction",
      "Cold Chain Storage, Aseptic Canning & Bulk Bottling",
      "APEDA Certified Agro Exports to EU & Gulf",
    ],
    employeeCount: 60,
    manufacturing: true,
    exports: true,
    hazardousMaterials: false,
    bisRegistration: "FSSAI Central Lic 10023022001842 / APEDA Reg",
    sector: "Food & Agro Processing (Orange Category)",
    scale: "Small Enterprise (MSME: UDYAM-MH-23-0091823)",
    officer: "Pooja Patil",
    role: "Director of Food Safety & Statutory Compliance",
    lastSync: "Today, 09:45 AM IST",
    annualTurnoverLakhs: 1800,
    plantInvestmentLakhs: 620,
    industrialZoneStatus: "Approved MIDC Agro Food Park",
    lifecycleStage: "Operational",
    connectedPowerLoad: "120 kW",
    productDescription:
      "Aseptic mango fruit pulp and citrus juice concentrate processing and packaging",
    tagline: "Mango Pulp & Citrus Juice Processing (FSSAI Central)",
    badge: "Food & Agro Processing",
    presetAnswers: {
      Q01: false,// consumer electronics
      Q02: 60,   // workers
      Q03: 120,  // power load in kW
      Q04: true, // exports to EU & Gulf
      Q05: true, // food processing steam boiler
      Q06: false,// BIS CRS electronic standard
      Q07: true, // organic washing effluent / BOD/COD treatment
      Q08: true, // factories act registration
      Q09: false,// IT e-waste
      Q10: true, // mandatory FSSAI Central Manufacturing License
      Q11: true, // DGFT IEC code & APEDA RCMC
      Q12: false,// mining
      Q13: true, // factory fire safety NOC
      Q14: true, // groundwater extraction CGWA NOC
      Q15: true, // food safety supervisor & periodic lab testing
    },
  },
  {
    presetKey: "textile",
    id: "demo-ichalkaranji-textile",
    businessName: "Ichalkaranji Dyeing & Weaving Mills",
    businessType: "Partnership Firm",
    pan: "AAAFI3490R",
    state: "Maharashtra",
    district: "Kolhapur",
    location: "Industrial Textile Area, Ichalkaranji, Kolhapur, Maharashtra - 416115",
    activities: [
      "Cotton Yarn Spinning & Cone Winding",
      "Powerloom Denim & Shirting Fabric Weaving",
      "Industrial Wet Textile Dyeing & Bleaching Operations",
      "Effluent Neutralization & CETP Discharge",
    ],
    employeeCount: 180,
    manufacturing: true,
    exports: false,
    hazardousMaterials: true,
    bisRegistration: "MPCB Red Category Consent / CETP Member 409",
    sector: "Textiles, Dyeing & Wet Processing (Red Category)",
    scale: "Medium Enterprise (MSME: UDYAM-MH-19-0034182)",
    officer: "Babasaheb Shinde",
    role: "Factory Manager & Environmental In-Charge",
    lastSync: "Today, 08:30 AM IST",
    annualTurnoverLakhs: 4100,
    plantInvestmentLakhs: 1450,
    industrialZoneStatus: "Cooperative Industrial Textile Estate",
    lifecycleStage: "Operational",
    connectedPowerLoad: "450 kW",
    productDescription:
      "Cotton yarn spinning, denim fabric weaving and industrial wet textile dyeing facility",
    tagline: "Yarn Spinning, Denim Weaving & Wet Dyeing (Red Category)",
    badge: "Textiles & Effluent",
    presetAnswers: {
      Q01: false,// consumer electronics
      Q02: 180,  // workers
      Q03: 450,  // power load in kW
      Q04: false,// domestic domestic market
      Q05: true, // process steam thermic fluid heater / boiler
      Q06: false,// BIS CRS electronic standard
      Q07: true, // heavy textile chemical effluent (Red Category)
      Q08: true, // factories act manufacturing license
      Q09: false,// electronic e-waste
      Q10: false,// food safety / FSSAI (never applicable to textiles)
      Q11: false,// direct export operations
      Q12: false,// mining
      Q13: true, // textile fire NOC & sprinkler system
      Q14: true, // Common Effluent Treatment Plant (CETP) membership
      Q15: true, // hazardous chemical storage authorization
    },
  },
  {
    presetKey: "importer",
    id: "demo-nexgen-importer",
    businessName: "NexGen Electronics Import Hub",
    businessType: "Private Limited Company",
    pan: "AAACN6734L",
    state: "Maharashtra",
    district: "Mumbai",
    location: "Logistics Park, Andheri East, Mumbai, Maharashtra - 400069",
    activities: [
      "Commercial IT Hardware & Electronic Component Import",
      "Customs Bonded Warehousing & Batch Serialization",
      "Pan-India B2B Electronics Distribution",
      "Post-Consumer E-Waste Reverse Logistics Collection",
    ],
    employeeCount: 15,
    manufacturing: false,
    exports: false,
    hazardousMaterials: false,
    bisRegistration: "E-Waste EPR Reg CPCB / DGFT IEC 03248109",
    sector: "IT Hardware & Commercial Distribution (Non-Manufacturing)",
    scale: "Micro Enterprise (MSME: UDYAM-MH-18-0012849)",
    officer: "Vikram Merchant",
    role: "Head of Supply Chain & Trade Compliance",
    lastSync: "Today, 12:00 PM IST",
    annualTurnoverLakhs: 2600,
    plantInvestmentLakhs: 120,
    industrialZoneStatus: "Commercial Warehousing Zone",
    lifecycleStage: "Operational",
    connectedPowerLoad: "15 kW",
    productDescription:
      "Commercial import, warehousing, and distribution of consumer IT components and microcontrollers",
    tagline: "IT Hardware Import, Warehousing & Distribution (Non-Mfg)",
    badge: "Commercial Trade & EPR",
    presetAnswers: {
      Q01: true, // handling electronic components & hardware
      Q02: 15,   // warehouse staff
      Q03: 15,   // commercial low power load
      Q04: true, // cross-border imports
      Q05: false,// no boilers / non-manufacturing
      Q06: true, // BIS CRS import registration verification
      Q07: false,// no manufacturing effluent
      Q08: false,// non-manufacturing commercial shop/establishment
      Q09: true, // mandatory Extended Producer Responsibility (EPR) e-waste
      Q10: false,// no food products
      Q11: true, // DGFT Import Export Code (IEC) & ICEGATE registration
      Q12: false,// no mining
      Q13: true, // commercial warehouse fire compliance
      Q14: true, // Legal Metrology packaged commodity importer registration
      Q15: true, // multi-state GST distribution registration
    },
  },
];
