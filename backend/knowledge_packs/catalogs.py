"""Authoritative regulatory and industrial catalogs.

Authority: TRD_v2.0 §30; PRD_v2.0 §21, §22; Allowed regulatory data directory.
"""

from typing import Any

GOVERNMENT_SCHEME_CATALOG: list[dict[str, Any]] = [
    # --- CENTRAL MSME GENERAL ---
    {
        "id": "SCHEME-CGTMSE",
        "name": "Credit Guarantee Fund Trust for Micro and Small Enterprises (CGTMSE)",
        "authority": "Ministry of MSME & SIDBI",
        "jurisdiction": "CENTRAL",
        "sectors": ["ALL"],
        "scale_match": ["MICRO", "SMALL"],
        "benefit": "Collateral-free credit facility up to ₹5 Crore with 75% to 85% credit guarantee cover.",
        "eligibility": "New and existing Micro and Small enterprises engaged in manufacturing or service activities.",
        "application_route": "Apply directly through scheduled commercial banks, NBFCs, or regional rural banks.",
        "portal_url": "https://www.cgtmse.in",
    },
    {
        "id": "SCHEME-ZED-CERTIFICATION",
        "name": "MSME Champions Scheme (Zero Defect Zero Effect - ZED)",
        "authority": "Ministry of MSME",
        "jurisdiction": "CENTRAL",
        "sectors": ["MANUFACTURING"],
        "scale_match": ["MICRO", "SMALL", "MEDIUM"],
        "benefit": "Financial assistance up to 80% (Micro), 60% (Small), and 50% (Medium) subsidy on certification cost.",
        "eligibility": "Manufacturing MSMEs with valid Udyam Registration aiming to upgrade product quality and environmental performance.",
        "application_route": "Apply online through the MSME Champions portal.",
        "portal_url": "https://zed.msme.gov.in",
    },
    {
        "id": "SCHEME-PMEGP",
        "name": "Prime Minister's Employment Generation Programme (PMEGP)",
        "authority": "KVIC & Ministry of MSME",
        "jurisdiction": "CENTRAL",
        "sectors": ["MANUFACTURING", "PROCESSING"],
        "scale_match": ["MICRO"],
        "benefit": "Margin money capital subsidy ranging from 15% to 35% of project cost (up to ₹50 Lakhs for manufacturing).",
        "eligibility": "Any individual above 18 years setting up a new micro-manufacturing unit.",
        "application_route": "Apply online through KVIC PMEGP e-Portal.",
        "portal_url": "https://www.kviconline.gov.in/pmegpeportal",
    },
    {
        "id": "SCHEME-SIDBI-SMILE",
        "name": "SIDBI Make in India Soft Loan Fund for MSMEs (SMILE)",
        "authority": "Small Industries Development Bank of India (SIDBI)",
        "jurisdiction": "CENTRAL",
        "sectors": ["ALL", "MANUFACTURING", "PROCESSING"],
        "scale_match": ["MICRO", "SMALL", "MEDIUM"],
        "benefit": "Soft loan in the form of quasi-equity and competitive term debt with attractive moratorium up to 36 months for machinery expansion.",
        "eligibility": "MSMEs in manufacturing and processing sectors establishing new facilities or undertaking technology modernization.",
        "application_route": "Apply directly through SIDBI branch offices or online portal.",
        "portal_url": "https://www.sidbi.in",
    },

    # --- FOOD PROCESSING SECTOR ---
    {
        "id": "SCHEME-PMFME",
        "name": "PM Formalisation of Micro Food Processing Enterprises (PMFME)",
        "authority": "Ministry of Food Processing Industries (MoFPI)",
        "jurisdiction": "CENTRAL",
        "sectors": ["FOOD", "AGRO", "PROCESSING"],
        "scale_match": ["MICRO"],
        "benefit": "Credit-linked capital subsidy of 35% of eligible project cost with a maximum ceiling of ₹10 Lakhs per unit.",
        "eligibility": "Existing or new micro food processing enterprises adopting One District One Product (ODOP) or non-ODOP lines.",
        "application_route": "Apply through PMFME MIS portal supported by District Resource Persons (DRP).",
        "portal_url": "https://pmfme.mofpi.gov.in",
    },
    {
        "id": "SCHEME-PM-KISAN-SAMPADA",
        "name": "Pradhan Mantri Kisan SAMPADA Yojana (Creation of Agro-Processing Clusters)",
        "authority": "Ministry of Food Processing Industries (MoFPI)",
        "jurisdiction": "CENTRAL",
        "sectors": ["FOOD", "PROCESSING"],
        "scale_match": ["SMALL", "MEDIUM", "LARGE"],
        "benefit": "Capital grant of 35% to 50% of eligible project cost up to ₹10 Crore for modern food processing infrastructure.",
        "eligibility": "Agro-processing units and clusters investing in modern preservation, cold chain, and primary processing.",
        "application_route": "Online application against MoFPI Expression of Interest (EoI).",
        "portal_url": "https://mofpi.gov.in/pmksy",
    },
    {
        "id": "SCHEME-PLISFPI-MILLETS",
        "name": "PLI Scheme for Food Processing Industry - Millet-based Products (PLISFPI)",
        "authority": "Ministry of Food Processing Industries (MoFPI)",
        "jurisdiction": "CENTRAL",
        "sectors": ["FOOD", "PROCESSING", "MANUFACTURING"],
        "scale_match": ["MICRO", "SMALL", "MEDIUM", "LARGE"],
        "benefit": "Sales-linked financial incentive of 8% to 10% on incremental sales of value-added millet products over 5 years.",
        "eligibility": "Food manufacturing enterprises producing Ready-to-Eat (RTE) or Ready-to-Cook (RTC) millet products with processing facilities.",
        "application_route": "Apply online via the MoFPI PLISFPI portal.",
        "portal_url": "https://plimofpi.ifciltd.com",
    },
    {
        "id": "SCHEME-AIF",
        "name": "Agriculture Infrastructure Fund (AIF)",
        "authority": "Ministry of Agriculture and Farmers Welfare",
        "jurisdiction": "CENTRAL",
        "sectors": ["FOOD", "AGRO", "PROCESSING"],
        "scale_match": ["MICRO", "SMALL", "MEDIUM"],
        "benefit": "3% interest subvention per annum on term loans up to ₹2 Crore for up to 7 years and CGTMSE fee coverage.",
        "eligibility": "Agri-entrepreneurs, food processors, and startups setting up post-harvest management and primary processing infrastructure.",
        "application_route": "Submit project proposal on the National AIF Portal.",
        "portal_url": "https://agriinfra.dac.gov.in",
    },
    {
        "id": "SCHEME-OPERATION-GREENS",
        "name": "Operation Greens — Long Term Value Chain Development",
        "authority": "Ministry of Food Processing Industries (MoFPI)",
        "jurisdiction": "CENTRAL",
        "sectors": ["FOOD", "PROCESSING"],
        "scale_match": ["MICRO", "SMALL", "MEDIUM", "LARGE"],
        "benefit": "Capital grant-in-aid of 35% to 50% of eligible project cost up to ₹15 Crore for integrated food value chain infrastructure.",
        "eligibility": "Food processors and post-harvest aggregators establishing integrated primary/secondary processing facilities.",
        "application_route": "Online application against MoFPI EoI notifications.",
        "portal_url": "https://mofpi.gov.in/operation-greens",
    },
    {
        "id": "SCHEME-FSSAI-FOSTAC-SUBSIDY",
        "name": "Food Safety Training & Certification (FoSTaC) & Compliance Subsidy",
        "authority": "Food Safety and Standards Authority of India (FSSAI)",
        "jurisdiction": "CENTRAL",
        "sectors": ["FOOD", "PROCESSING"],
        "scale_match": ["MICRO", "SMALL", "MEDIUM"],
        "benefit": "100% capacity-building subsidy for training certified Food Safety Supervisors (FSS) and compliance audit fee subsidies for MSME FBOs.",
        "eligibility": "Registered and licensed food business operators with manufacturing/processing facilities in India.",
        "application_route": "Register personnel via the FSSAI FoSTaC portal.",
        "portal_url": "https://fostac.fssai.gov.in",
    },

    # --- AUTOMOTIVE & PRECISION ENGINEERING ---
    {
        "id": "SCHEME-PLI-AUTO-COMPONENTS",
        "name": "Production Linked Incentive (PLI) for Automobile and Auto Components",
        "authority": "Ministry of Heavy Industries",
        "jurisdiction": "CENTRAL",
        "sectors": ["AUTOMOTIVE", "ENGINEERING", "MACHINING"],
        "scale_match": ["SMALL", "MEDIUM", "LARGE"],
        "benefit": "Incentive of 8% to 18% on incremental sales of Advanced Automotive Technology components over 5 years.",
        "eligibility": "Automotive component manufacturers meeting minimum cumulative domestic investment thresholds.",
        "application_route": "Online submission via Ministry of Heavy Industries PLI portal.",
        "portal_url": "https://heavyindustries.gov.in",
    },
    {
        "id": "SCHEME-TECHNOLOGY-UPGRADATION",
        "name": "Credit Linked Capital Subsidy for Technology Upgradation (CLCSS)",
        "authority": "Ministry of MSME",
        "jurisdiction": "CENTRAL",
        "sectors": ["ENGINEERING", "MACHINING", "MANUFACTURING"],
        "scale_match": ["MICRO", "SMALL"],
        "benefit": "15% upfront capital subsidy (up to ₹15 Lakhs) for induction of proven modern machinery and CNC tech.",
        "eligibility": "Micro and Small manufacturing units upgrading from conventional tooling to advanced precision machinery.",
        "application_route": "Apply through designated primary lending institutions / nodal banks.",
        "portal_url": "https://clcss.dcmsme.gov.in",
    },

    # --- ELECTRONICS & ESDM ---
    {
        "id": "SCHEME-SPECS-ESDM",
        "name": "Scheme for Promotion of Manufacturing of Electronic Components and Semiconductors (SPECS)",
        "authority": "Ministry of Electronics and Information Technology (MeitY)",
        "jurisdiction": "CENTRAL",
        "sectors": ["ELECTRONICS", "ESDM", "HARDWARE"],
        "scale_match": ["SMALL", "MEDIUM", "LARGE"],
        "benefit": "Financial incentive of 25% on capital expenditure for plant, machinery, equipment, and technology.",
        "eligibility": "Manufacturing units producing electronic components, semiconductor packaging, or specialized hardware.",
        "application_route": "Submit application on MeitY electronic single-window portal.",
        "portal_url": "https://www.meity.gov.in/esdm/specs",
    },

    # --- STATE INCENTIVES: MAHARASHTRA ---
    {
        "id": "SCHEME-MAHA-PSI-2019",
        "name": "Maharashtra Package Scheme of Incentives (PSI 2019)",
        "authority": "Industries Department, Government of Maharashtra",
        "jurisdiction": "MAHARASHTRA",
        "sectors": ["ALL", "FOOD", "MANUFACTURING"],
        "scale_match": ["MICRO", "SMALL", "MEDIUM", "LARGE"],
        "benefit": "Industrial Promotion Subsidy (IPS) up to 100% of eligible capital investment, 100% electricity duty exemption for up to 10 years, and 5% interest subsidy.",
        "eligibility": "New and expanding manufacturing units set up in developing areas of Maharashtra (e.g. Nashik, Vidarbha, Marathwada).",
        "application_route": "Apply online via Maharashtra Maitri Single Window Portal.",
        "portal_url": "https://maitri.mahaonline.gov.in",
    },
    {
        "id": "SCHEME-MAHA-CMEGP",
        "name": "Chief Minister Employment Generation Programme (CMEGP Maharashtra)",
        "authority": "Directorate of Industries, Maharashtra",
        "jurisdiction": "MAHARASHTRA",
        "sectors": ["ALL", "PROCESSING"],
        "scale_match": ["MICRO"],
        "benefit": "Financial capital subsidy up to 35% for project costs up to ₹50 Lakhs for rural and urban entrepreneurs.",
        "eligibility": "Permanent residents of Maharashtra setting up new manufacturing or agro-processing ventures.",
        "application_route": "Apply through the CMEGP Maharashtra online portal.",
        "portal_url": "https://maha-cmegp.gov.in",
    },

    # --- STATE INCENTIVES: ODISHA ---
    {
        "id": "SCHEME-ODISHA-IPR-2022",
        "name": "Odisha Industrial Policy Resolution (IPR 2022) Capital Subsidy",
        "authority": "Industries Department, Government of Odisha & IPICOL",
        "jurisdiction": "ODISHA",
        "sectors": ["ALL", "ENGINEERING", "AUTOMOTIVE", "MANUFACTURING"],
        "scale_match": ["MICRO", "SMALL", "MEDIUM", "LARGE"],
        "benefit": "Capital Investment Subsidy of up to 30% of fixed capital investment, electricity duty exemption for 10 years, and land allotment at concessional IDCO rates.",
        "eligibility": "Industrial enterprises establishing manufacturing units in priority and thrust sectors in Odisha.",
        "application_route": "Apply through the GO-SWIFT (Government of Odisha - Single Window Portal).",
        "portal_url": "https://goswift.odisha.gov.in",
    },
    {
        "id": "SCHEME-ODISHA-MSME-DEVELOPMENT",
        "name": "Odisha MSME Development Policy Incentives",
        "authority": "MSME Department, Government of Odisha",
        "jurisdiction": "ODISHA",
        "sectors": ["ALL", "MANUFACTURING"],
        "scale_match": ["MICRO", "SMALL", "MEDIUM"],
        "benefit": "Interest subsidy of 5% per annum on term loans, 100% reimbursement of stamp duty, and reimbursement of ISO/quality certification fees.",
        "eligibility": "MSMEs holding valid Udyam Registration located within industrial estates or industrial corridors in Odisha.",
        "application_route": "Apply through District Industries Centre (DIC) / GO-SWIFT portal.",
        "portal_url": "https://msme.odisha.gov.in",
    },

    # --- STATE INCENTIVES: WEST BENGAL ---
    {
        "id": "SCHEME-WB-BANGLASHREE",
        "name": "Banglashree Scheme for Micro, Small and Medium Enterprises (West Bengal)",
        "authority": "Department of MSME & Textiles, Government of West Bengal",
        "jurisdiction": "WEST_BENGAL",
        "sectors": ["ALL", "MANUFACTURING", "FOOD", "PROCESSING"],
        "scale_match": ["MICRO", "SMALL", "MEDIUM"],
        "benefit": "Capital investment subsidy up to 25% of fixed capital investment (up to ₹1 Crore for Small enterprises), 100% waiver of electricity duty for 5 years, and reimbursement of stamp duty & registration fees.",
        "eligibility": "New and expanding micro, small, and medium manufacturing enterprises set up in West Bengal with valid Udyam Registration.",
        "application_route": "Apply online through Silpa Sathi (West Bengal Single Window System).",
        "portal_url": "https://silpasathi.wb.gov.in",
    },
    {
        "id": "SCHEME-WB-AGRO-FOOD",
        "name": "West Bengal Agro-Food Processing Incentive Scheme",
        "authority": "Directorate of Food Processing Industries & Horticulture, Govt of West Bengal",
        "jurisdiction": "WEST_BENGAL",
        "sectors": ["FOOD", "PROCESSING", "AGRO"],
        "scale_match": ["MICRO", "SMALL", "MEDIUM"],
        "benefit": "Term loan interest subvention of 6% up to ₹50 Lakhs over 5 years, plus 50% subsidy for FSSAI/NABL food testing and food-grade packaging upgrades.",
        "eligibility": "Food processing units engaged in processing cereals, pulses, millets, fruits, vegetables, and packaged snacks in West Bengal.",
        "application_route": "Apply via Department of Food Processing Industries, Government of West Bengal.",
        "portal_url": "https://wbfpih.gov.in",
    },

    # --- EXPORT SUPPORT ---
    {
        "id": "SCHEME-EXPORT-RODTEP",
        "name": "Remission of Duties and Taxes on Exported Products (RoDTEP)",
        "authority": "Directorate General of Foreign Trade (DGFT)",
        "jurisdiction": "CENTRAL",
        "sectors": ["EXPORT"],
        "scale_match": ["MICRO", "SMALL", "MEDIUM", "LARGE"],
        "benefit": "Rebate on embedded central, state, and local duties/taxes incurred in the manufacturing and distribution of exported goods (0.5% to 4.3% of FOB value).",
        "eligibility": "All manufacturer exporters and merchant exporters shipping goods under eligible tariff lines.",
        "application_route": "Claimed electronically via shipping bills on ICEGATE customs portal.",
        "portal_url": "https://www.icegate.gov.in",
    },
    {
        "id": "SCHEME-INTEREST-EQUALISATION",
        "name": "Interest Equalisation Scheme on Pre & Post Shipment Rupee Export Credit",
        "authority": "Reserve Bank of India & DGFT",
        "jurisdiction": "CENTRAL",
        "sectors": ["EXPORT"],
        "scale_match": ["MICRO", "SMALL", "MEDIUM"],
        "benefit": "Interest subvention of 3% on pre-shipment and post-shipment export credit extended by commercial banks.",
        "eligibility": "Manufacturer MSME exporters holding valid IEC and Udyam Registration.",
        "application_route": "Avail through participating authorized foreign exchange dealer banks.",
        "portal_url": "https://www.dgft.gov.in",
    },
]



STANDARDS_CATALOG: list[dict[str, Any]] = [
    # --- FOOD PROCESSING STANDARDS ---
    {
        "standard_code": "FSSAI-STD-REG-2011",
        "title": "FSS (Food Products Standards and Food Additives) Regulations",
        "authority": "Food Safety and Standards Authority of India (FSSAI)",
        "nature": "MANDATORY_STATUTORY",
        "sectors": ["FOOD", "PROCESSING", "AGRO"],
        "why_it_matters": "Sets microbiological safety limits, permissible food additive concentrations, and maximum residue limits (MRLs) for all commercial food processing in India.",
        "testing_requirements": "Periodic batch testing in FSSAI-notified and NABL-accredited laboratory for moisture, microbiological count, and preservative levels.",
        "next_step": "Implement recipe compliance and retain batch test reports in technical compliance dossier.",
        "source_url": "https://fssai.gov.in",
    },
    {
        "standard_code": "IS 2491:2013",
        "title": "Food Hygiene — General Principles — Code of Practice",
        "authority": "Bureau of Indian Standards (BIS)",
        "nature": "STATUTORY_CODE_OF_PRACTICE",
        "sectors": ["FOOD", "PROCESSING"],
        "why_it_matters": "Defines fundamental hygiene and sanitation controls across processing facilities, including pest exclusion, surface sanitization, and clean air filtration.",
        "testing_requirements": "Internal hygiene audit and verification of personal cleanliness facilities for food handling staff.",
        "next_step": "Align factory processing room floor plan, washable wall tiling, and drainage slopes to IS 2491 specifications.",
        "source_url": "https://www.bis.gov.in",
    },
    {
        "standard_code": "ISO 22000 / HACCP",
        "title": "Food Safety Management Systems (FSMS)",
        "authority": "International Organization for Standardization (ISO)",
        "nature": "EXPORT_AND_RETAIL_BENCHMARK",
        "sectors": ["FOOD", "PROCESSING", "EXPORT"],
        "why_it_matters": "Global benchmark for hazard analysis and critical control points (HACCP). Crucial for institutional B2B supply contracts and international food export clearances.",
        "testing_requirements": "Third-party certification audit by an accredited certification body reviewing hazard analysis, CCP monitoring, and product traceability.",
        "next_step": "Draft documented Standard Operating Procedures (SOPs) and engage an accredited registrar for initial certification audit.",
        "source_url": "https://www.iso.org/iso-22000-food-safety-management.html",
    },
    {
        "standard_code": "IS 10146 / IS 9845",
        "title": "Polyethylene for Safe Use in Contact with Foodstuffs & Migration Testing",
        "authority": "Bureau of Indian Standards (BIS)",
        "nature": "MANDATORY_PACKAGING_STANDARD",
        "sectors": ["FOOD", "PACKAGING"],
        "why_it_matters": "Ensures flexible plastic pouches, heat-sealed bags, and containers do not leach harmful organic chemicals into packaged food items.",
        "testing_requirements": "Overall migration and specific migration testing using food simulants at accredited lab.",
        "next_step": "Obtain Food Grade Migration Test Certificate from your packaging film suppliers.",
        "source_url": "https://www.bis.gov.in",
    },

    # --- AUTOMOTIVE & PRECISION ENGINEERING ---
    {
        "standard_code": "IATF 16949:2016",
        "title": "Quality Management System for Automotive Production & Component Machining",
        "authority": "International Automotive Task Force (IATF)",
        "nature": "MANDATORY_OEM_BENCHMARK",
        "sectors": ["AUTOMOTIVE", "ENGINEERING", "MACHINING"],
        "why_it_matters": "Primary global quality specification for tier-1 and tier-2 automotive component suppliers, emphasizing defect prevention and reduction of variation.",
        "testing_requirements": "Rigorous stage 1 & stage 2 quality management audits including PPAP (Production Part Approval Process) and FMEA reviews.",
        "next_step": "Establish Advanced Product Quality Planning (APQP) protocols and prepare for baseline ISO 9001 -> IATF certification ladder.",
        "source_url": "https://www.iatfglobaloversight.org",
    },
    {
        "standard_code": "IS 1367 / IS 1363",
        "title": "Technical Supply Conditions for Threaded Steel Fasteners and Precision Turned Parts",
        "authority": "Bureau of Indian Standards (BIS)",
        "nature": "MANDATORY_QCO",
        "sectors": ["ENGINEERING", "MACHINING", "AUTOMOTIVE"],
        "why_it_matters": "Covered under Ministry of Commerce Quality Control Order (QCO). Fasteners and precision turned components must conform to tensile strength, hardness, and dimensional tolerances.",
        "testing_requirements": "Proof load testing, core hardness testing, and salt-spray corrosion resistance tests.",
        "next_step": "Procure BIS certification or verify raw material test certificates (MTC) from primary steel manufacturers.",
        "source_url": "https://www.bis.gov.in",
    },
    {
        "standard_code": "ISO 9001:2015",
        "title": "Quality Management Systems — Requirements for Precision Machining",
        "authority": "Bureau of Indian Standards / ISO",
        "nature": "INDUSTRY_STANDARD",
        "sectors": ["ENGINEERING", "MACHINING", "MANUFACTURING"],
        "why_it_matters": "Validates process control, calibration management, and systematic traceability across CNC turning, milling, and grinding operations.",
        "testing_requirements": "Quality manual implementation and third-party registrar audit.",
        "next_step": "Calibrate all vernier calipers, micrometers, and coordinate measuring machines (CMM) with traceable calibration certificates.",
        "source_url": "https://www.iso.org",
    },

    # --- ELECTRONICS & ESDM ---
    {
        "standard_code": "IS 13252 (Part 1):2010",
        "title": "Information Technology Equipment — Safety (General Requirements)",
        "authority": "Bureau of Indian Standards (BIS)",
        "nature": "MANDATORY_CRS_QCO",
        "sectors": ["ELECTRONICS", "ESDM", "HARDWARE"],
        "why_it_matters": "Mandatory under Ministry of Electronics & IT (MeitY) Compulsory Registration Scheme (CRS). Electronic products cannot be imported or sold without registration.",
        "testing_requirements": "Comprehensive electric shock hazard, heating, abnormal operation, and fire resistance testing in BIS-recognized lab.",
        "next_step": "Submit production samples to accredited test laboratory and upload test report to Manakonline portal.",
        "source_url": "https://www.crsbis.in",
    },
    {
        "standard_code": "IS 15885 (Part 2/Sec 13)",
        "title": "Safety of Lamp Controlgear / LED Drivers and Power Supplies",
        "authority": "Bureau of Indian Standards (BIS)",
        "nature": "MANDATORY_CRS_QCO",
        "sectors": ["ELECTRONICS", "ESDM"],
        "why_it_matters": "Mandatory safety registration for switch-mode power supplies (SMPS) and auxiliary electronic driver circuits.",
        "testing_requirements": "Dielectric strength, creepage distance, and temperature rise testing under extreme operating conditions.",
        "next_step": "Obtain BIS R-number prior to commercial product distribution.",
        "source_url": "https://www.crsbis.in",
    },

    # --- ENVIRONMENTAL GENERAL ---
    {
        "standard_code": "IS 10500:2012",
        "title": "Drinking Water — Specification",
        "authority": "Bureau of Indian Standards (BIS)",
        "nature": "STATUTORY_WORKPLACE_SAFETY",
        "sectors": ["ALL", "MANUFACTURING"],
        "why_it_matters": "Factories Act mandates that cool, clean drinking water conforming to IS 10500 must be made available to all industrial workers.",
        "testing_requirements": "Quarterly physical, chemical, and microbiological water analysis test from accredited laboratory.",
        "next_step": "Install commercial RO / UV filtration and maintain quarterly laboratory potability test certificate at factory office.",
        "source_url": "https://www.bis.gov.in",
    },
]



# Procedural workflows keyed by authority or domain
STATUTORY_WORKFLOW_TEMPLATES: dict[str, dict[str, Any]] = {
    "FOOD": {
        "portal_name": "FoSCoS (Food Safety Compliance System)",
        "portal_url": "https://foscos.fssai.gov.in",
        "estimated_days": "30-45 Days",
        "steps": [
            {
                "step_number": 1,
                "title": "Compile FSMS & Premises Documentation",
                "description": "Prepare Food Safety Management System plan, facility layout blueprint, water test report from NABL lab, and list of food handling machinery.",
                "duration": "7-10 Days",
                "status": "READY_TO_START",
            },
            {
                "step_number": 2,
                "title": "Online Application Submission via FoSCoS",
                "description": "Submit Form B on the FoSCoS portal with designated Food Business Operator details and pay prescribed statutory fee.",
                "duration": "1-2 Days",
                "status": "UPCOMING",
            },
            {
                "step_number": 3,
                "title": "Departmental Scrutiny & Query Response",
                "description": "FSSAI Designated Officer scrutinizes application. Address any clarifications or document requisitions within 30 days.",
                "duration": "10-15 Days",
                "status": "UPCOMING",
            },
            {
                "step_number": 4,
                "title": "Pre-Licensing Site Inspection",
                "description": "Food Safety Officer conducts on-site inspection of processing facility to verify sanitary and hygienic requirements.",
                "duration": "7-14 Days",
                "status": "UPCOMING",
            },
            {
                "step_number": 5,
                "title": "Grant & Download of FSSAI License",
                "description": "Upon approval, digitally signed 14-digit FSSAI License is issued for immediate display at processing premises.",
                "duration": "2-3 Days",
                "status": "UPCOMING",
            },
        ],
    },
    "ENVIRONMENT": {
        "portal_name": "State Pollution Control Board OCMMS / XGN Portal",
        "portal_url": "https://ocmms.nic.in",
        "estimated_days": "45-60 Days",
        "steps": [
            {
                "step_number": 1,
                "title": "Environmental Baseline & ETP Scheme Preparation",
                "description": "Finalize Detailed Project Report (DPR), industrial water balance diagram, and Effluent Treatment Plant (ETP) / APCM design.",
                "duration": "10-14 Days",
                "status": "READY_TO_START",
            },
            {
                "step_number": 2,
                "title": "Consent to Establish (CTE) Application Submission",
                "description": "File CTE application online through the state SPCB single-window portal with capital investment declarations and fee payment.",
                "duration": "1-2 Days",
                "status": "UPCOMING",
            },
            {
                "step_number": 3,
                "title": "Regional Officer Siting & Technical Scrutiny",
                "description": "PCB Regional Officer inspects proposed industrial site to confirm buffer distance from residential areas and water bodies.",
                "duration": "15-20 Days",
                "status": "UPCOMING",
            },
            {
                "step_number": 4,
                "title": "Issuance of Consent to Establish (CTE)",
                "description": "Board issues CTE containing pollution control conditions to be installed during facility construction.",
                "duration": "7-10 Days",
                "status": "UPCOMING",
            },
            {
                "step_number": 5,
                "title": "Post-Construction Consent to Operate (CTO) Filing",
                "description": "After ETP erection and trial run notification, apply for CTO prior to beginning commercial production.",
                "duration": "20-30 Days",
                "status": "UPCOMING",
            },
        ],
    },
    "LABOR": {
        "portal_name": "Directorate of Industrial Safety & Health (DISH) Single Window",
        "portal_url": "https://dish.gov.in",
        "estimated_days": "30-40 Days",
        "steps": [
            {
                "step_number": 1,
                "title": "Factory Building Plan & Machinery Layout Submission",
                "description": "Submit architectural drawings and electric motor HP distribution to the Chief Inspector of Factories for plan approval.",
                "duration": "10-14 Days",
                "status": "READY_TO_START",
            },
            {
                "step_number": 2,
                "title": "Structural Stability & Fire Safety Certification",
                "description": "Obtain structural stability endorsement from chartered engineer and Fire Department provisional NOC.",
                "duration": "7-10 Days",
                "status": "UPCOMING",
            },
            {
                "step_number": 3,
                "title": "Notice of Occupation Filing (Form 1 / Form 2)",
                "description": "Submit statutory Notice of Occupation and Factory License registration application at least 15 days before factory operation.",
                "duration": "1-2 Days",
                "status": "UPCOMING",
            },
            {
                "step_number": 4,
                "title": "Factory Inspector Joint Safety Verification",
                "description": "Factory Inspector conducts shop-floor safety audit checking ventilation, machine guarding, and worker welfare amenities.",
                "duration": "10-15 Days",
                "status": "UPCOMING",
            },
            {
                "step_number": 5,
                "title": "Grant of Factory License",
                "description": "Issuance of renewable Factory License under Section 6 of the Factories Act.",
                "duration": "3-5 Days",
                "status": "UPCOMING",
            },
        ],
    },
    "TRADE": {
        "portal_name": "DGFT Directorate General of Foreign Trade Portal",
        "portal_url": "https://www.dgft.gov.in",
        "estimated_days": "1-3 Days",
        "steps": [
            {
                "step_number": 1,
                "title": "Digital Signature (DSC) & Entity PAN Validation",
                "description": "Validate company PAN and registered authorized signatory credentials on the DGFT system.",
                "duration": "1 Day",
                "status": "READY_TO_START",
            },
            {
                "step_number": 2,
                "title": "Online Importer-Exporter Code (IEC) Application",
                "description": "Complete electronic IEC application form, link bank account verification, and remit statutory processing fee.",
                "duration": "1 Day",
                "status": "UPCOMING",
            },
            {
                "step_number": 3,
                "title": "Instant Automatic Allotment of 10-Digit IEC",
                "description": "System issues electronic IEC certificate automatically transmitted to ICEGATE for customs clearance.",
                "duration": "Instant",
                "status": "UPCOMING",
            },
        ],
    },
    "STANDARD": {
        "portal_name": "BIS Manakonline Portal",
        "portal_url": "https://www.manakonline.in",
        "estimated_days": "30-60 Days",
        "steps": [
            {
                "step_number": 1,
                "title": "Product Sample Testing at BIS-Recognized Laboratory",
                "description": "Submit production samples to NABL-accredited BIS test laboratory for full parameter testing against applicable Indian Standard.",
                "duration": "15-25 Days",
                "status": "READY_TO_START",
            },
            {
                "step_number": 2,
                "title": "Online Registration Filing on Manakonline",
                "description": "Upload test reports, factory profile, and authorized Indian representative undertaking via the BIS portal.",
                "duration": "2-3 Days",
                "status": "UPCOMING",
            },
            {
                "step_number": 3,
                "title": "BIS Technical Scrutiny & Clarification",
                "description": "BIS technical committee reviews test data and manufacturing quality manual.",
                "duration": "10-15 Days",
                "status": "UPCOMING",
            },
            {
                "step_number": 4,
                "title": "Grant of BIS Registration & Standard Mark Use",
                "description": "Receive unique R-number granting authority to affix the BIS Standard Mark prior to commercial dispatch.",
                "duration": "3-5 Days",
                "status": "UPCOMING",
            },
        ],
    },
    "DEFAULT": {
        "portal_name": "State Single Window Clearance Portal",
        "portal_url": "https://investindia.gov.in",
        "estimated_days": "15-30 Days",
        "steps": [
            {
                "step_number": 1,
                "title": "Statutory Documentation Preparation",
                "description": "Assemble corporate incorporation records, address proofs, and technical specifications.",
                "duration": "5-7 Days",
                "status": "READY_TO_START",
            },
            {
                "step_number": 2,
                "title": "Online Application Submission",
                "description": "Submit application through official department portal and obtain acknowledgement receipt.",
                "duration": "1-2 Days",
                "status": "UPCOMING",
            },
            {
                "step_number": 3,
                "title": "Departmental Scrutiny & Query Resolution",
                "description": "Track application status and promptly respond to any departmental requisitions.",
                "duration": "7-14 Days",
                "status": "UPCOMING",
            },
            {
                "step_number": 4,
                "title": "Approval & Certificate Issuance",
                "description": "Download digitally authenticated approval certificate.",
                "duration": "2-3 Days",
                "status": "UPCOMING",
            },
        ],
    },
}


import re

STATUTORY_PORTAL_REGISTRY: dict[str, dict[str, str]] = {
    # Telecom, Wireless, Electronics
    "WPC": {
        "name": "Saral Sanchar (WPC Portal)",
        "url": "https://saralsanchar.gov.in/",
        "description": "Equipment Type Approval (ETA) & Wireless Licensing Portal",
    },
    "WPC_DOT": {
        "name": "Saral Sanchar (WPC Portal)",
        "url": "https://saralsanchar.gov.in/",
        "description": "Equipment Type Approval (ETA) & Wireless Licensing Portal",
    },
    "SARAL_SANCHAR": {
        "name": "Saral Sanchar (WPC Portal)",
        "url": "https://saralsanchar.gov.in/",
        "description": "Equipment Type Approval (ETA) & Wireless Licensing Portal",
    },
    "BIS_CRS": {
        "name": "BIS Compulsory Registration Scheme (CRS) Portal",
        "url": "https://www.crsbis.in/BIS/",
        "description": "MeitY Notified Electronics Compulsory Registration",
    },
    "BIS": {
        "name": "BIS Compulsory Registration Scheme (CRS) Portal",
        "url": "https://www.crsbis.in/BIS/",
        "description": "Bureau of Indian Standards Conformity Assessment",
    },

    # Standards, Packaging, Metrology
    "LEGAL_METROLOGY": {
        "name": "National Single Window System / Legal Metrology Portal (LMPC)",
        "url": "https://lm.doca.gov.in/",
        "description": "Packaged Commodities Rule 27 Pre-Packer Registration",
    },
    "DOCA": {
        "name": "Legal Metrology Portal (LMPC)",
        "url": "https://lm.doca.gov.in/",
        "description": "Department of Consumer Affairs Legal Metrology Division",
    },
    "NSWS": {
        "name": "National Single Window System (NSWS)",
        "url": "https://www.nsws.gov.in/",
        "description": "Government of India Integrated Business Approvals Portal",
    },

    # Food & Agriculture
    "FSSAI_CENTRAL": {
        "name": "FoSCoS Central Licensing Portal",
        "url": "https://foscos.fssai.gov.in/",
        "description": "Food Safety Compliance System for Central Licenses (>20 Cr)",
    },
    "FSSAI_STATE": {
        "name": "FoSCoS State Licensing Portal",
        "url": "https://foscos.fssai.gov.in/",
        "description": "Food Safety Compliance System for State Licenses",
    },
    "FSSAI": {
        "name": "FoSCoS Food Safety Compliance System",
        "url": "https://foscos.fssai.gov.in/",
        "description": "Statutory FSSAI Food Business Licensing & Registration",
    },
    "JAIVIK_BHARAT": {
        "name": "Jaivik Bharat / FoSCoS Organic Food Portal",
        "url": "https://jaivikbharat.fssai.gov.in/",
        "description": "Organic Food Certification & Logo Endorsement",
    },
    "APEDA": {
        "name": "APEDA TraceNet / Organic Portal",
        "url": "https://apeda.gov.in/",
        "description": "National Programme for Organic Production (NPOP)",
    },

    # Environmental / Extended Producer Responsibility (CPCB)
    "CPCB_PLASTIC": {
        "name": "CPCB Centralized EPR Portal for Plastic Packaging",
        "url": "https://eprplastic.cpcb.gov.in/",
        "description": "Plastic Packaging Waste Management EPR Registration",
    },
    "CPCB_EWASTE": {
        "name": "CPCB Centralized EPR Portal for E-Waste",
        "url": "https://eprewastecpcb.in/",
        "description": "Electrical & Electronic Equipment Producer EPR",
    },
    "CPCB_BATTERY": {
        "name": "CPCB Centralized EPR Portal for Battery Waste",
        "url": "https://eprbattery.cpcb.gov.in/",
        "description": "Battery Waste Management Rules Producer & Recycler Portal",
    },
    "CPCB": {
        "name": "CPCB Central Pollution Control Board Portal",
        "url": "https://cpcb.nic.in/",
        "description": "Central Environmental Regulation & EPR Frameworks",
    },

    # State Pollution Control Boards (SPCBs - Consent to Establish & Operate)
    "KSPCB": {
        "name": "KSPCB KCMMS Online Consent Management Portal",
        "url": "https://kcmms.karnataka.gov.in/",
        "description": "Karnataka State Pollution Control Board Consent Portal",
    },
    "GPCB": {
        "name": "GPCB XGN Gujarat e-Governance Consent Portal",
        "url": "https://xgn.gpcb.gov.in/",
        "description": "Gujarat Pollution Control Board Extended Green Node (XGN)",
    },
    "MPCB": {
        "name": "MPCB Electronic Consent Management System (e-CMP)",
        "url": "https://ecmpcb.in/",
        "description": "Maharashtra Pollution Control Board Consent Portal",
    },
    "TNPCB": {
        "name": "TNPCB OCMMS Online Consent Management Portal",
        "url": "https://tnocmms.nic.in/",
        "description": "Tamil Nadu Pollution Control Board Online Consent System",
    },
    "TSPCB": {
        "name": "TSPCB OCMMS Online Consent Management Portal",
        "url": "https://tgocmms.nic.in/",
        "description": "Telangana State Pollution Control Board Consent System",
    },
    "WBPCB": {
        "name": "Silpa Sathi - West Bengal Single Window Portal",
        "url": "https://silpasathi.wb.gov.in/",
        "description": "West Bengal Single Window System for Environmental Clearance",
    },
    "DPCC": {
        "name": "DPCC OCMMS Online Consent Management Portal",
        "url": "https://dpccocmms.nic.in/",
        "description": "Delhi Pollution Control Committee Consent System",
    },

    # Foreign Trade
    "DGFT": {
        "name": "DGFT Online Services (IEC Application)",
        "url": "https://www.dgft.gov.in/CP/?opt=iec-service",
        "description": "Directorate General of Foreign Trade Importer-Exporter Code",
    },

    # Labor, Factories & Safety (DISH)
    "DISH_GUJARAT": {
        "name": "DISH Gujarat Online Factory Licensing Portal",
        "url": "https://dish.gujarat.gov.in/",
        "description": "Directorate of Industrial Safety & Health Factory Licensing",
    },
    "DISH_TN": {
        "name": "DISH Tamil Nadu Factory Licensing Portal",
        "url": "https://dish.tn.gov.in/",
        "description": "Directorate of Industrial Safety & Health Factory Licensing",
    },
    "DISH_WB": {
        "name": "Silpa Sathi - West Bengal Single Window (Factory License)",
        "url": "https://silpasathi.wb.gov.in/",
        "description": "West Bengal Directorate of Factories Single Window Portal",
    },
    "SHRAM_SUVIDHA": {
        "name": "Shram Suvidha Central Labor Portal",
        "url": "https://shramsuvidha.gov.in/",
        "description": "Ministry of Labour & Employment Unified Compliance Portal",
    },

    # Medical Devices & Drugs
    "CDSCO": {
        "name": "CDSCO Medical Device Online Portal (Sugam)",
        "url": "https://cdscomdonline.gov.in/",
        "description": "Central Drugs Standard Control Organization Licensing",
    },

    # Petroleum & Explosives
    "PESO": {
        "name": "PESO Online Licensing Portal",
        "url": "https://peso.gov.in/",
        "description": "Petroleum and Explosives Safety Organization",
    },

    # Corporate & MSME
    "MCA": {
        "name": "Ministry of Corporate Affairs (MCA V3)",
        "url": "https://www.mca.gov.in/content/mca/global/en/home.html",
        "description": "Company Incorporation & Annual Filing Portal",
    },
    "UDYAM": {
        "name": "Udyam MSME Registration Portal",
        "url": "https://udyamregistration.gov.in/",
        "description": "Official Ministry of MSME Registration Portal",
    },
}


def extract_url(text: str) -> str | None:
    """Extract first http or https URL from a text string."""
    if not text:
        return None
    match = re.search(r"https?://[^\s\)\"\'\,>]+", str(text))
    if match:
        return match.group(0).rstrip(".,;)")
    return None


def resolve_statutory_portal(
    authority: str = "",
    requirement_name: str = "",
    requirement_id: str = "",
    raw_portal: str = "",
) -> dict[str, str]:
    """Resolve an authoritative, validated statutory application portal URL and name.

    Guarantees:
    - Never returns bare text as a URL (e.g. 'XGN Gujarat' or 'DISH Portal').
    - Never returns text containing parentheses like 'Portal (https://...)'.
    - Routes directly to the specific compliance application service rather than a generic ministry homepage.
    """
    auth_upper = (authority or "").strip().upper()
    req_upper = f"{requirement_id} {requirement_name}".upper()
    raw_str = (raw_portal or "").strip()

    # Specific requirement keyword matching
    if "ETA" in req_upper or "WPC" in req_upper or "WIRELESS" in req_upper:
        return STATUTORY_PORTAL_REGISTRY["WPC"]

    if (
        "LEGAL_METROLOGY" in auth_upper
        or "METROLOGY" in req_upper
        or "RULE 27" in req_upper
        or "PRE-PACKER" in req_upper
        or "PACKAGED COMMODIT" in req_upper
    ):
        return STATUTORY_PORTAL_REGISTRY["LEGAL_METROLOGY"]

    if "PLASTIC" in req_upper and ("EPR" in req_upper or "EPR-PLASTIC" in req_upper):
        return STATUTORY_PORTAL_REGISTRY["CPCB_PLASTIC"]

    if "E-WASTE" in req_upper or "EWASTE" in req_upper or "EPR-EWASTE" in req_upper:
        return STATUTORY_PORTAL_REGISTRY["CPCB_EWASTE"]

    if "BATTERY" in req_upper:
        return STATUTORY_PORTAL_REGISTRY["CPCB_BATTERY"]

    if "ORGANIC" in req_upper or "JAIVIK" in req_upper or "NPOP" in req_upper:
        return STATUTORY_PORTAL_REGISTRY["JAIVIK_BHARAT"]

    if "FSSAI" in auth_upper or "FOOD" in req_upper:
        if "CENTRAL" in req_upper:
            return STATUTORY_PORTAL_REGISTRY["FSSAI_CENTRAL"]
        return STATUTORY_PORTAL_REGISTRY["FSSAI"]

    if "BIS" in auth_upper or "CRS" in req_upper:
        return STATUTORY_PORTAL_REGISTRY["BIS_CRS"]

    if "DGFT" in auth_upper or "IEC" in req_upper or "IMPORT" in req_upper:
        return STATUTORY_PORTAL_REGISTRY["DGFT"]

    if "KSPCB" in auth_upper or ("KARNATAKA" in req_upper and "CONSENT" in req_upper):
        return STATUTORY_PORTAL_REGISTRY["KSPCB"]

    if "GPCB" in auth_upper or ("GUJARAT" in req_upper and "CONSENT" in req_upper):
        return STATUTORY_PORTAL_REGISTRY["GPCB"]

    if "MPCB" in auth_upper or ("MAHARASHTRA" in req_upper and "CONSENT" in req_upper):
        return STATUTORY_PORTAL_REGISTRY["MPCB"]

    if "TNPCB" in auth_upper or ("TAMIL" in req_upper and "CONSENT" in req_upper):
        return STATUTORY_PORTAL_REGISTRY["TNPCB"]

    if "TSPCB" in auth_upper or ("TELANGANA" in req_upper and "CONSENT" in req_upper):
        return STATUTORY_PORTAL_REGISTRY["TSPCB"]

    if "WBPCB" in auth_upper or ("WEST BENGAL" in req_upper and "CTE" in req_upper):
        return STATUTORY_PORTAL_REGISTRY["WBPCB"]

    if "DISH_GUJARAT" in auth_upper or ("GUJARAT" in req_upper and "FACTORY" in req_upper):
        return STATUTORY_PORTAL_REGISTRY["DISH_GUJARAT"]

    if "DISH_TN" in auth_upper or ("TAMIL" in req_upper and "FACTORY" in req_upper):
        return STATUTORY_PORTAL_REGISTRY["DISH_TN"]

    if "DISH_WB" in auth_upper or ("WEST BENGAL" in req_upper and "FACTORY" in req_upper):
        return STATUTORY_PORTAL_REGISTRY["DISH_WB"]

    if "CDSCO" in auth_upper or "MEDICAL DEVICE" in req_upper:
        return STATUTORY_PORTAL_REGISTRY["CDSCO"]

    if "PESO" in auth_upper:
        return STATUTORY_PORTAL_REGISTRY["PESO"]

    # If raw_portal already contains a valid URL, extract it
    extracted = extract_url(raw_str)
    if extracted:
        clean_name = re.sub(r"\(https?://[^\)]+\)", "", raw_str).strip() or "Official Statutory Portal"
        return {
            "name": clean_name,
            "url": extracted,
            "description": "Official statutory portal submission route",
        }

    # Authority prefix fallback
    for k, info in STATUTORY_PORTAL_REGISTRY.items():
        if k in auth_upper:
            return info

    return STATUTORY_PORTAL_REGISTRY["NSWS"]


STATUTORY_PORTALS: dict[str, str] = {k: v["url"] for k, v in STATUTORY_PORTAL_REGISTRY.items()}
STATUTORY_PORTALS["CONSUMER_AFFAIRS"] = "https://lm.doca.gov.in/"
STATUTORY_PORTALS["FOSCOS"] = "https://foscos.fssai.gov.in/"
STATUTORY_PORTALS["EPR_PLASTIC"] = "https://eprplastic.cpcb.gov.in/"
STATUTORY_PORTALS["JAIVIK_BHARAT"] = "https://jaivikbharat.fssai.gov.in/"
STATUTORY_PORTALS["SILPASATHI_WB"] = "https://silpasathi.wb.gov.in/"
STATUTORY_PORTALS["DISH_CENTRAL"] = "https://shramsuvidha.gov.in/"
STATUTORY_PORTALS["WBPCB"] = "https://silpasathi.wb.gov.in/"
STATUTORY_PORTALS["CPCB"] = "https://cpcb.nic.in/"
STATUTORY_PORTALS["MEITY_DPDP"] = "https://www.meity.gov.in/"
STATUTORY_PORTALS["INDIA_GOV"] = "https://www.nsws.gov.in/"


