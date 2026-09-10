/**
 * ComplyWise — Demo BIS Standards Repository
 */

export interface StandardClause {
  clauseNumber: string;
  clauseTitle: string;
  isMandatory: boolean;
  testMethod: string;
  acceptanceCriteria: string;
}

export interface StandardItem {
  id: string;
  code: string;
  year: string;
  title: string;
  authority: string;
  isMandatory: boolean;
  qcoOrder?: string;
  scheme: string;
  totalClauses: number;
  applicableClauses: number;
  testingParameters: string[];
  lastAmendment: string;
  status: "APPLICABLE" | "COMPLIANT" | "RENEWAL_DUE";
  description: string;
  clauses: StandardClause[];
}

export const DEMO_STANDARDS: StandardItem[] = [
  {
    id: "IS-1293",
    code: "IS 1293",
    year: "2019",
    title: "Plugs and Socket-Outlets of Rated Voltage up to 250V and Rated Current up to 16A",
    authority: "Bureau of Indian Standards",
    isMandatory: true,
    qcoOrder: "Electrical Accessories (Quality Control) Order, 2020",
    scheme: "Scheme-I (ISI Mark)",
    totalClauses: 32,
    applicableClauses: 28,
    testingParameters: [
      "Clause 13.2: Endurance under normal condition (10,000 operations at rated current)",
      "Clause 18: Temperature rise (max 45K rise on terminals)",
      "Clause 19: Making and breaking capacity",
      "Clause 24: Mechanical strength (tumbling barrel 1000 falls)",
      "Clause 28: Resistance to heat, fire, and tracking (glow wire 850°C)",
    ],
    lastAmendment: "Amendment No. 3 (Nov 2023)",
    status: "RENEWAL_DUE",
    description:
      "Covers requirements for 2-pin and 3-pin plugs, fixed and portable sockets for AC supply. Mandatory for all domestic manufacturing and foreign imports under DPIIT QCO.",
    clauses: [
      {
        clauseNumber: "13.2",
        clauseTitle: "Endurance Testing",
        isMandatory: true,
        testMethod: "Specimen subjected to 10,000 stroke cycles at rated voltage and cos φ = 0.6.",
        acceptanceCriteria: "No electrical or mechanical breakdown; no sustained arcing; contact resistance unchanged.",
      },
      {
        clauseNumber: "18",
        clauseTitle: "Temperature Rise",
        isMandatory: true,
        testMethod: "Current passed continuously until thermal equilibrium is achieved.",
        acceptanceCriteria: "Temperature rise on terminal connections must not exceed 45 Kelvin above ambient.",
      },
      {
        clauseNumber: "28.1",
        clauseTitle: "Glow-Wire Test",
        isMandatory: true,
        testMethod: "Applied at 850°C for insulating parts holding live contacts in position.",
        acceptanceCriteria: "Flames or glowing extinguish within 30 seconds after removal of the glow-wire tip.",
      },
    ],
  },
  {
    id: "IS-3055",
    code: "IS 3055",
    year: "Part 1: 1994",
    title: "Clinical Thermometers — Solid-Stem Liquid-in-Glass Type",
    authority: "Bureau of Indian Standards",
    isMandatory: true,
    qcoOrder: "Medical Devices & Diagnostic Instruments QCO, 2021",
    scheme: "Scheme-I (ISI Mark)",
    totalClauses: 16,
    applicableClauses: 14,
    testingParameters: [
      "Scale error tolerance (±0.1°C)",
      "Thermal shock endurance",
      "Aging stability of constriction chamber",
      "Stem graduation legibility & etching depth",
    ],
    lastAmendment: "Reaffirmed 2021",
    status: "COMPLIANT",
    description:
      "Prescribes constructional details, dimensions, scale intervals, and testing of clinical liquid-in-glass thermometers.",
    clauses: [
      {
        clauseNumber: "6.1",
        clauseTitle: "Scale Interval & Accuracy",
        isMandatory: true,
        testMethod: "Comparison against NPL primary standard in controlled temperature oil/water bath.",
        acceptanceCriteria: "Scale error must not exceed ±0.05°C across range 35°C to 42°C.",
      },
    ],
  },
  {
    id: "IS-14543",
    code: "IS 14543",
    year: "2024",
    title: "Packaged Drinking Water (Other than Natural Mineral Water)",
    authority: "Bureau of Indian Standards / FSSAI",
    isMandatory: true,
    qcoOrder: "Mandatory Quality Control Order SO 338(E)",
    scheme: "Scheme-I (ISI Mark) Dual License",
    totalClauses: 44,
    applicableClauses: 39,
    testingParameters: [
      "Total Dissolved Solids (TDS) 75 - 500 mg/l",
      "Microbiological limits: E. coli, Coliforms, Faecal Streptococci (Absent/250ml)",
      "Pesticide residue testing (Individual <0.0001 mg/l)",
      "Heavy metals: Lead (<0.01 mg/l), Arsenic (<0.01 mg/l)",
    ],
    lastAmendment: "Revised 6th Edition (Jan 2024)",
    status: "APPLICABLE",
    description:
      "Mandatory standard governing physical, chemical, and microbiological purity of packaged drinking water containers.",
    clauses: [
      {
        clauseNumber: "7.2",
        clauseTitle: "Microbiological Requirements",
        isMandatory: true,
        testMethod: "Membrane filtration and incubation on selective media.",
        acceptanceCriteria: "Zero coliform bacteria, Pseudomonas aeruginosa, and yeast/mould per 250ml sample.",
      },
    ],
  },
  {
    id: "IS-14286",
    code: "IS 14286",
    year: "Part 1: 2019",
    title: "Terrestrial Photovoltaic (PV) Modules — Design Qualification and Type Approval",
    authority: "Ministry of New and Renewable Energy (MNRE) / BIS",
    isMandatory: true,
    qcoOrder: "Solar Photovoltaics, Systems, Devices and Components Goods (QCO), 2017",
    scheme: "Compulsory Registration Scheme (CRS)",
    totalClauses: 24,
    applicableClauses: 20,
    testingParameters: [
      "Thermal cycling 200 cycles (-40°C to +85°C)",
      "Damp heat test (1000 hrs at 85°C / 85% RH)",
      "Mechanical load test (2400 Pa front and back)",
      "Hail impact test (25mm ice sphere at 23 m/s)",
    ],
    lastAmendment: "Amendment 2 (Oct 2022)",
    status: "COMPLIANT",
    description:
      "Type qualification requirements for terrestrial crystalline silicon and thin-film solar PV panels under MNRE ALMM mandate.",
    clauses: [
      {
        clauseNumber: "10.11",
        clauseTitle: "Thermal Cycling Test",
        isMandatory: true,
        testMethod: "Module subjected to 200 cycles between -40°C and +85°C while carrying test current.",
        acceptanceCriteria: "Power degradation less than 5% of pre-test output; insulation resistance maintained.",
      },
    ],
  },
];
