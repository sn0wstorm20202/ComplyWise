import type { DemoPresetDefinition } from "./demo/controlledPresets";

const startingProfile = {
  businessType: "Proprietorship", pan: "", state: "Karnataka", district: "Bengaluru",
  location: "Bengaluru, Karnataka", exports: false, hazardousMaterials: false,
  bisRegistration: "", scale: "", officer: "", role: "", lastSync: "",
  industrialZoneStatus: "OUTSIDE_NOTIFIED_INDUSTRIAL_AREA", lifecycleStage: "OPERATIONAL",
  presetAnswers: {},
};

export const BUSINESS_STARTERS: DemoPresetDefinition[] = [
  { presetKey: "restaurant", businessName: "Neighbourhood Kitchen", badge: "Restaurant",
    description: "A neighbourhood restaurant preparing and serving meals on-site, with takeaway service.",
    employeeCount: 8, annualTurnoverLakhs: 60, plantInvestmentLakhs: 12, manufacturing: false },
  { presetKey: "manufacturing", businessName: "Precision Workshop", badge: "Manufacturing Unit",
    description: "A small workshop manufacturing metal components using powered machinery, with 18 workers.",
    employeeCount: 18, annualTurnoverLakhs: 180, plantInvestmentLakhs: 45, manufacturing: true },
  { presetKey: "retail", businessName: "Everyday Retail", badge: "Retail / Trading",
    description: "A local shop buying packaged household goods from domestic suppliers and selling to consumers.",
    employeeCount: 4, annualTurnoverLakhs: 40, plantInvestmentLakhs: 5, manufacturing: false },
  { presetKey: "it", businessName: "Clearpath Digital", badge: "IT Services",
    description: "A software consultancy building web applications for Indian businesses, with an office-based team.",
    employeeCount: 12, annualTurnoverLakhs: 120, plantInvestmentLakhs: 10, manufacturing: false },
  { presetKey: "warehouse", businessName: "City Storage", badge: "Warehouse / Logistics",
    description: "A warehouse storing non-hazardous packaged goods and coordinating local deliveries for retailers.",
    employeeCount: 15, annualTurnoverLakhs: 150, plantInvestmentLakhs: 30, manufacturing: false },
  { presetKey: "healthcare", businessName: "Community Clinic", badge: "Healthcare",
    description: "An outpatient clinic providing consultations and minor procedures, without overnight beds.",
    employeeCount: 6, annualTurnoverLakhs: 70, plantInvestmentLakhs: 20, manufacturing: false },
  { presetKey: "renewable", businessName: "Sunpath Energy", badge: "Renewable Energy",
    description: "A rooftop solar installation and maintenance business serving local commercial premises, sourcing equipment from domestic suppliers without manufacturing it.",
    employeeCount: 9, annualTurnoverLakhs: 90, plantInvestmentLakhs: 15, manufacturing: false },
].map(({ description, ...sample }) => ({ ...startingProfile, ...sample,
  id: `starter-${sample.presetKey}`, sector: sample.badge, tagline: description,
  activities: [description], productDescription: description,
}));

// Suggestions remain outside canonical facts until the user explicitly saves an answer.
export const STARTER_SUGGESTIONS: Record<string, Record<string, string | boolean>> = {
  restaurant: { dynamic_food_prepared_on_site: true, dynamic_operating_model: "DINE_IN_TAKEAWAY" },
  manufacturing: { dynamic_on_site_operation: "MANUFACTURING" },
  it: { dynamic_operation_model: "SOFTWARE_SERVICES" },
  warehouse: { hazardous_goods_handling: false },
  healthcare: { dynamic_healthcare_activity: "OUTPATIENT" },
};
