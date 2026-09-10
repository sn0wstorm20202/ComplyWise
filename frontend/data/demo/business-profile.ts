/**
 * ComplyWise — Demo Business Profiles
 *
 * Grounded in realistic Indian industrial standards, MSME registration,
 * and Bureau of Indian Standards (BIS) statutory filings.
 */

export interface BusinessProfile {
  id: string;
  businessName: string;
  businessType: string;
  pan: string;
  state: string;
  district: string;
  location: string;
  activities: string[];
  employeeCount: number;
  manufacturing: boolean;
  exports: boolean;
  hazardousMaterials: boolean;
  bisRegistration: string;
  sector: string;
  scale: string;
  officer: string;
  role: string;
  lastSync: string;
  annualTurnoverLakhs: number;
  plantInvestmentLakhs: number;
  industrialZoneStatus: string;
  lifecycleStage: string;
}

export const DEMO_PROFILES: BusinessProfile[] = [
  {
    id: "biz-food-processing-01",
    businessName: "Gujarat Agro & Food Processing Unit",
    businessType: "Private Limited Company",
    pan: "AAACG1234F",
    state: "Gujarat",
    district: "Ahmedabad",
    location: "Plot 18, Phase II, GIDC Sanand, Ahmedabad, Gujarat - 382110",
    activities: [
      "Edible Oil Refining & Packaging",
      "Fortified Rice Processing",
      "Packaged Drinking Water Bottling",
      "Spices & Condiments Grinding",
    ],
    employeeCount: 145,
    manufacturing: true,
    exports: true,
    hazardousMaterials: false,
    bisRegistration: "CM/L-9182345",
    sector: "Food Products & Agrochemical Processing",
    scale: "Medium Enterprise (MSME: UDYAM-GJ-01-0084721)",
    officer: "Rajeshbhai K. Patel",
    role: "Director of Regulatory Affairs & Quality",
    lastSync: "Today, 11:15 AM IST",
    annualTurnoverLakhs: 4850,
    plantInvestmentLakhs: 1850,
    industrialZoneStatus: "Approved GIDC Industrial Estate",
    lifecycleStage: "Operational / Expansion",
  },
  {
    id: "biz-electro-mech-02",
    businessName: "Apex Industrial Electro-Mechanicals Ltd.",
    businessType: "Public Limited Company",
    pan: "AABCA5678K",
    state: "Haryana",
    district: "Gurugram",
    location: "Plot 42, Sector 8, IMT Manesar, Gurugram, Haryana - 122050",
    activities: [
      "Low-Voltage Switchgear & Controlgear Assembly",
      "Domestic & Industrial Plugs & Sockets (IS 1293)",
      "Molded Case Circuit Breakers (MCCB)",
      "Flameproof Enclosures & Cable Glands",
    ],
    employeeCount: 280,
    manufacturing: true,
    exports: true,
    hazardousMaterials: true,
    bisRegistration: "CM/L-8492019",
    sector: "Electrical Accessories & Industrial Power Components",
    scale: "Medium Enterprise (MSME: UDYAM-HR-05-0029182)",
    officer: "Dr. Vikramaditya Sharma",
    role: "Head of Regulatory & Quality Assurance",
    lastSync: "Today, 10:45 AM IST",
    annualTurnoverLakhs: 8200,
    plantInvestmentLakhs: 3400,
    industrialZoneStatus: "HSIDC Notified Industrial Area",
    lifecycleStage: "Mature Operational",
  },
  {
    id: "biz-renewable-energy-03",
    businessName: "Deccan CleanTech Solar & Storage Systems",
    businessType: "Private Limited Company",
    pan: "AACCD9012M",
    state: "Karnataka",
    district: "Bengaluru Rural",
    location: "Plot 104, KIADB Aerospace Park, Devanahalli, Bengaluru, Karnataka - 562149",
    activities: [
      "Solar PV Module Assembly (IS 14286 / CRS)",
      "Lithium-ion Battery Pack Manufacturing",
      "Grid-tied Inverter Production",
    ],
    employeeCount: 92,
    manufacturing: true,
    exports: false,
    hazardousMaterials: true,
    bisRegistration: "CRS-2023-8841",
    sector: "Renewable Energy & Power Electronics",
    scale: "Small Enterprise (MSME: UDYAM-KR-03-0012948)",
    officer: "Ananya R. Rao",
    role: "VP Quality & Statutory Compliance",
    lastSync: "Today, 09:30 AM IST",
    annualTurnoverLakhs: 2900,
    plantInvestmentLakhs: 1200,
    industrialZoneStatus: "KIADB Special Technology Zone",
    lifecycleStage: "High Growth",
  },
];

export const DEFAULT_BUSINESS_PROFILE = DEMO_PROFILES[0];
