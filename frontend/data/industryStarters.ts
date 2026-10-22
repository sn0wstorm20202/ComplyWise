import type { DemoPresetDefinition } from "./demo/controlledPresets";

// Fictional, editable business facts. No licence numbers or legal answers are prefilled.
function example(input: {
  presetKey: string; businessName: string; badge: string; state: string; district: string;
  description: string; focus: string; employeeCount: number; annualTurnoverLakhs: number;
  plantInvestmentLakhs: number; manufacturing: boolean; exports?: boolean;
  businessType?: string;
  tradeIntent?: DemoPresetDefinition["tradeIntent"];
}): DemoPresetDefinition {
  const { description, ...facts } = input;
  return { businessType: "Private Limited Company", exports: false,
    tradeIntent: input.exports ? "EXPORT_ONLY" : "NONE", ...facts,
    id: `starter-${input.presetKey}`, pan: "", bisRegistration: "", hazardousMaterials: false,
    location: `${input.district}, ${input.state}`, activities: [description],
    productDescription: description, tagline: description, sector: input.badge,
    scale: "", officer: "", role: "", lastSync: "", presetAnswers: {},
    industrialZoneStatus: "OUTSIDE_NOTIFIED_INDUSTRIAL_AREA", lifecycleStage: "OPERATIONAL" };
}

export const INDUSTRY_STARTERS: DemoPresetDefinition[] = [
  example({ presetKey: "meridian-pharma", businessName: "Meridian Pharma Formulations Pvt. Ltd.",
    badge: "Pharmaceutical manufacturing", state: "Telangana", district: "Hyderabad",
    description: "Manufacturing finished tablets and capsules in cleanrooms, with diesel backup generators and contract workers. Supplies domestic and export markets.",
    focus: "Manufacturing, environmental controls and exports", employeeCount: 164,
    annualTurnoverLakhs: 4200, plantInvestmentLakhs: 900, manufacturing: true, exports: true }),
  example({ presetKey: "voltgrid-mobility", businessName: "VoltGrid Mobility Services Pvt. Ltd.",
    badge: "EV charging network", state: "Maharashtra", district: "Mumbai",
    description: "Operating public AC and DC fast-charging stations with utility power connections and a cloud charging-management platform. Does not manufacture vehicles or batteries.",
    focus: "Infrastructure operator, not a vehicle manufacturer", employeeCount: 64,
    annualTurnoverLakhs: 1800, plantInvestmentLakhs: 450, manufacturing: false }),
  example({ presetKey: "apexbuild-infrastructure", businessName: "ApexBuild Infrastructure Pvt. Ltd.",
    badge: "Construction and infrastructure", state: "Rajasthan", district: "Jaipur",
    description: "Civil engineering contractor building commercial premises, highways and earthworks across project sites, using construction equipment and contract labour.",
    focus: "Project sites, workforce and contractor responsibilities", employeeCount: 220,
    annualTurnoverLakhs: 6500, plantInvestmentLakhs: 800, manufacturing: false }),
  example({ presetKey: "silkroute-exports", businessName: "SilkRoute Exports Pvt. Ltd.",
    badge: "Apparel merchant exporter", state: "Tamil Nadu", district: "Tiruppur",
    description: "Purchasing finished garments from independent manufacturers and exporting them overseas. No weaving, dyeing, garment production or industrial processing takes place on site.",
    focus: "Exporting finished goods without manufacturing", employeeCount: 48,
    annualTurnoverLakhs: 2800, plantInvestmentLakhs: 80, manufacturing: false, exports: true }),
  example({ presetKey: "cloudaxis-data-centres", businessName: "CloudAxis Data Centres India Pvt. Ltd.",
    badge: "Data centre and colocation", state: "Telangana", district: "Hyderabad",
    description: "Operating a commercial server colocation data centre with dedicated electrical substations, diesel backup generators, battery storage and cooling systems.",
    focus: "Digital services with physical power and safety needs", employeeCount: 85,
    annualTurnoverLakhs: 12000, plantInvestmentLakhs: 3500, manufacturing: false }),
  example({ presetKey: "sahaya-microfinance", businessName: "Sahaya Microfinance Services Ltd.",
    badge: "Microfinance services", state: "Uttar Pradesh", district: "Lucknow",
    description: "Providing collateral-free microloans to joint-liability groups and rural entrepreneurs, with branch-based lending operations and customer information handling.",
    focus: "Financial services, customer information and governance", employeeCount: 110,
    annualTurnoverLakhs: 8500, plantInvestmentLakhs: 150, manufacturing: false,
    businessType: "Public Limited Company" }),
  example({ presetKey: "harvestlink-food", businessName: "HarvestLink Foods & Cold Chain Pvt. Ltd.",
    badge: "Food processing and cold chain", state: "Maharashtra", district: "Nashik",
    description: "Washing, pulping, pasteurising and packing fruit products for domestic sale, with refrigerated storage and temperature-controlled distribution. No imports or exports.",
    focus: "Food production, storage and distribution in one business", employeeCount: 36,
    annualTurnoverLakhs: 650, plantInvestmentLakhs: 180, manufacturing: true }),
  example({ presetKey: "medibridge-imports", businessName: "MediBridge Devices India Pvt. Ltd.",
    badge: "Medical-device import and distribution", state: "Karnataka", district: "Bengaluru",
    description: "Importing finished patient-monitoring devices from overseas manufacturers and distributing them to Indian hospitals. No device manufacturing, assembly, patient treatment or exports.",
    focus: "Importer responsibilities without manufacturing or patient care", employeeCount: 22,
    annualTurnoverLakhs: 900, plantInvestmentLakhs: 60, manufacturing: false, tradeIntent: "IMPORT_ONLY" }),
];

// Used for research traceability, never as a substitute for assessment evidence.
export const ADDITIONAL_PROFILE_REFERENCES = {
  "harvestlink-food": ["https://foscos.fssai.gov.in/", "https://fssai.gov.in/business/licensing"],
  "medibridge-imports": ["https://cdscomdonline.gov.in/NewMedDev/resources/app_srv/NMD/global/pdf/MD-FAQ.pdf"],
};
