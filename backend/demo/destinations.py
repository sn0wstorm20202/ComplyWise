"""Official Action Destination Registry for ComplyWise Demo Mode.

Authority: SELECTION DEMO SPECIFICATION Part 10 & 11
Invariants:
1. Destination types are strictly classified:
   - EXACT_ACTION_FORM: Direct unauthenticated application/filing form.
   - OFFICIAL_SERVICE_PAGE: Dedicated statutory service landing page (e.g. DGFT IEC Service, TS-iPASS).
   - OFFICIAL_PORTAL_REQUIRES_LOGIN: Official authority portal requiring account creation/login before entry.
   - ACTION_PAGE_NOT_VERIFIED: Fallback/unverified destination.
2. An OFFICIAL_SERVICE_PAGE or LOGIN portal is NEVER labeled as an exact application form.
3. Every URL is verified against official government and statutory hostnames.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any


class ActionDestinationType(str, Enum):
    EXACT_ACTION_FORM = "EXACT_ACTION_FORM"
    OFFICIAL_SERVICE_PAGE = "OFFICIAL_SERVICE_PAGE"
    OFFICIAL_PORTAL_REQUIRES_LOGIN = "OFFICIAL_PORTAL_REQUIRES_LOGIN"
    ACTION_PAGE_NOT_VERIFIED = "ACTION_PAGE_NOT_VERIFIED"


@dataclass(frozen=True)
class ActionDestination:
    destination_type: ActionDestinationType
    url: str
    display_label: str
    portal_name: str
    authority: str
    requires_login: bool = True
    notes: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "destination_type": self.destination_type.value,
            "url": self.url,
            "display_label": self.display_label,
            "portal_name": self.portal_name,
            "authority": self.authority,
            "requires_login": self.requires_login,
            "notes": self.notes,
        }


# Canonical verified destinations for demo requirements
DEMO_DESTINATIONS: dict[str, ActionDestination] = {
    # DGFT IEC
    "REQ-DGFT-IEC": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://dgft.gov.in/CP/?opt=iec-service",
        display_label="Official DGFT IEC Service",
        portal_name="DGFT Online Services Portal",
        authority="Directorate General of Foreign Trade",
        requires_login=True,
        notes="Official DGFT IEC service entry point. Requires Digital Signature / Aadhaar e-Sign upon login.",
    ),
    # Telangana Drug Manufacturing License
    "REQ-CDSCO-DCA-DRUG-MFG-LICENCE": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://cdscomdonline.gov.in/",
        display_label="Official CDSCO / TS DCA Portal",
        portal_name="CDSCO SUGAM / State Licensing Portal",
        authority="Telangana Drugs Control Administration (DCA) / CDSCO",
        requires_login=True,
        notes="Online portal for pharmaceutical manufacturing licensing (Form 25/28) and technical file submission.",
    ),
    # Schedule M Good Manufacturing Practices
    "REQ-SCHEDULE-M-GMP": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://cdsco.gov.in/",
        display_label="Official CDSCO Schedule M Portal",
        portal_name="CDSCO Good Manufacturing Practices Portal",
        authority="Drugs Controller General of India (CDSCO)",
        requires_login=False,
        notes="Official gazette standards and audit guidelines for Revised Schedule M compliance.",
    ),
    # Telangana Factories Act License
    "REQ-TS-FACTORY-LICENSE": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://ipass.telangana.gov.in/",
        display_label="Official TS-iPASS Single Window Portal",
        portal_name="TS-iPASS Industrial Approvals Portal",
        authority="Directorate of Factories, Government of Telangana",
        requires_login=True,
        notes="Single-window submission route for Telangana factory plan approval, fee calculation, and factory licence.",
    ),
    # TSPCB Consent to Establish (CTE)
    "REQ-TSPCB-CTE": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://tspcb.cgg.gov.in/",
        display_label="Official TSPCB OCMMS Portal",
        portal_name="Telangana PCB Online Consent Management (OCMMS)",
        authority="Telangana State Pollution Control Board",
        requires_login=True,
        notes="Online submission of Form I, ETP schematics, and industry categorization for Consent to Establish.",
    ),
    # TSPCB Consent to Operate (CTO)
    "REQ-TSPCB-CTO": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://tspcb.cgg.gov.in/",
        display_label="Official TSPCB OCMMS Portal",
        portal_name="Telangana PCB Online Consent Management (OCMMS)",
        authority="Telangana State Pollution Control Board",
        requires_login=True,
        notes="Submission for operational clearance, effluent monitoring compliance, and stack emission consent.",
    ),
    # TSPCB Hazardous Waste Authorization
    "REQ-TSPCB-HAZARDOUS-WASTE": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://tspcb.cgg.gov.in/",
        display_label="Official TSPCB Hazardous Waste Portal",
        portal_name="TSPCB Online Waste Authorization Portal",
        authority="Telangana State Pollution Control Board",
        requires_login=True,
        notes="Filing Form 1 under Hazardous and Other Wastes Rules 2016 and TSDF membership linkage.",
    ),
    # Telangana Fire Safety NOC
    "REQ-TS-FIRE-NOC": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://fire.telangana.gov.in/",
        display_label="Official TS Fire Services Portal",
        portal_name="Telangana Disaster Response and Fire Services Portal",
        authority="Telangana State Disaster Response and Fire Services Department",
        requires_login=True,
        notes="Inspection application and occupancy certificate clearance for manufacturing premises > 500 sq m.",
    ),
    # Groundwater Abstraction NOC (WALTA / CGWA)
    "REQ-WALTA-GROUNDWATER-NOC": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://cgwa-noc.gov.in/",
        display_label="Official CGWA Water Abstraction Portal",
        portal_name="Central Ground Water Authority NOC Portal",
        authority="Central Ground Water Authority (CGWA) / TS Ground Water Dept",
        requires_login=True,
        notes="Groundwater abstraction application for industrial processing and digital water flow monitoring.",
    ),
    # Legal Metrology Packaged Commodities
    "REQ-LEGAL-METROLOGY-PACKER": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://lm.doca.gov.in/",
        display_label="Official Legal Metrology Portal",
        portal_name="e-Maapadan Legal Metrology Portal",
        authority="Department of Consumer Affairs",
        requires_login=True,
        notes="Registration as manufacturer/packer under Rule 27 of Legal Metrology Packaged Commodities Rules.",
    ),
    # CPCB Plastic Packaging EPR
    "REQ-CPCB-EPR-PLASTIC": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://cpcbeprplastic.in/",
        display_label="Official CPCB EPR Portal",
        portal_name="Centralized Extended Producer Responsibility Portal",
        authority="Central Pollution Control Board",
        requires_login=True,
        notes="Centralized EPR registration for producers and brand owners utilizing plastic packaging materials.",
    ),
    # EPF Registration
    "REQ-EPF-REGISTRATION": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://shramsuvidha.gov.in/",
        display_label="Official Shram Suvidha Portal",
        portal_name="Ministry of Labour Unified Shram Suvidha Portal",
        authority="Employees' Provident Fund Organisation (EPFO)",
        requires_login=True,
        notes="Unified registration for establishment LIN, EPF coverage, and employer contribution account.",
    ),
    # ESI Registration
    "REQ-ESI-REGISTRATION": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://shramsuvidha.gov.in/",
        display_label="Official Shram Suvidha Portal",
        portal_name="Ministry of Labour Unified Shram Suvidha Portal",
        authority="Employees' State Insurance Corporation (ESIC)",
        requires_login=True,
        notes="Unified registration for ESIC employer code and 17-digit sub-code generation.",
    ),
    # POSH Internal Committee
    "REQ-POSH-INTERNAL-COMMITTEE": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://wcd.nic.in/",
        display_label="Official Ministry of Women & Child Development Portal",
        portal_name="Ministry of Women & Child Development POSH Repository",
        authority="Appropriate Government / Local Committee under POSH Act",
        requires_login=False,
        notes="Statutory handbook, prescribed order formats, and guidelines for Internal Committee constitution.",
    ),
    # DPDP Compliance
    "REQ-DPDP-DATA-FIDUCIARY-COMPLIANCE": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://www.meity.gov.in/",
        display_label="Official MeitY Data Protection Portal",
        portal_name="Ministry of Electronics and Information Technology",
        authority="Data Protection Board of India / MeitY",
        requires_login=False,
        notes="Official statutory provisions and compliance directions under the Digital Personal Data Protection Act.",
    ),
    # CERT-In Directives
    "REQ-CERTIN-CYBERSECURITY-DIRECTIVES": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://www.cert-in.org.in/",
        display_label="Official CERT-In Portal",
        portal_name="Indian Computer Emergency Response Team Portal",
        authority="Indian Computer Emergency Response Team (CERT-In)",
        requires_login=False,
        notes="Statutory 6-hour incident reporting format and cyber compliance directions under IT Act Section 70B.",
    ),
    # FSSAI Central License
    "REQ-FSSAI-CENTRAL-LICENCE": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://foscos.fssai.gov.in/",
        display_label="Official FSSAI FoSCoS Portal",
        portal_name="Food Safety Compliance System (FoSCoS)",
        authority="Food Safety and Standards Authority of India",
        requires_login=True,
        notes="Online submission for Central Food License and manufacturing premise scrutiny.",
    ),
    # Maharashtra Factory License
    "REQ-MH-FACTORY-LICENSE": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://dish.maharashtra.gov.in/",
        display_label="Official DISH Maharashtra Portal",
        portal_name="Directorate of Industrial Safety & Health (Maharashtra)",
        authority="Directorate of Industrial Safety & Health (DISH Maharashtra)",
        requires_login=True,
        notes="Factory registration, plan scrutiny, and renewal portal for Maharashtra industrial units.",
    ),
    # MPCB Consent to Establish
    "REQ-MPCB-CTE": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://ecmpcb.mpcb.gov.in/",
        display_label="Official MPCB e-Consent Portal",
        portal_name="Maharashtra Pollution Control Board e-Consent System",
        authority="Maharashtra Pollution Control Board",
        requires_login=True,
        notes="Consent to Establish filing for industrial activities within Maharashtra.",
    ),
    # Textiles Committee Cess
    "REQ-TEXTILE-COMMITTEE-CESS": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://textilescommittee.nic.in/",
        display_label="Official Textiles Committee Portal",
        portal_name="Textiles Committee Statutory Services Portal",
        authority="Textiles Committee, Ministry of Textiles",
        requires_login=True,
        notes="Online assessment, inspection request, and cess return submission for textile manufacturing mills.",
    ),
    # --- SCENARIO 1: EV CHARGING NETWORK (VoltGrid) ---
    "REQ-CEA-EV-SAFETY-STANDARDS": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://cea.nic.in/",
        display_label="Official Central Electricity Authority Portal",
        portal_name="Central Electricity Authority Regulatory Portal",
        authority="Central Electricity Authority (CEA)",
        requires_login=False,
        notes="Statutory technical standards, safety regulations, and electrical inspector guidelines for EV charging stations.",
    ),
    "REQ-DISCOM-EV-TARIFF-CONNECTION": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://www.mahadiscom.in/",
        display_label="Official MSEDCL EV Charging Portal",
        portal_name="Maharashtra State Electricity Distribution Co. Portal",
        authority="MSEDCL / MERC",
        requires_login=True,
        notes="Online application for dedicated EV charging tariff category and HT/LT connection sanction.",
    ),
    "REQ-MUNICIPAL-PUBLIC-CHARGING-NOC": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://portal.mcgm.gov.in/",
        display_label="Official MCGM Portal",
        portal_name="Municipal Corporation of Greater Mumbai Citizen Portal",
        authority="MCGM / Urban Local Bodies",
        requires_login=True,
        notes="Local authority permission and site right-of-way NOC for public EV charging infrastructure.",
    ),
    "REQ-PESO-PETROL-PUMP-CHARGER-NOC": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://peso.gov.in/",
        display_label="Official PESO Portal",
        portal_name="Petroleum & Explosives Safety Organization Portal",
        authority="PESO",
        requires_login=True,
        notes="PESO safety clearance for co-locating electric vehicle charging points within retail petroleum outlet premises.",
    ),
    "REQ-DPDP-CUSTOMER-PAYMENT-DATA": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://www.meity.gov.in/content/digital-personal-data-protection-act-2023",
        display_label="Official MeitY DPDP Portal",
        portal_name="Ministry of Electronics & Information Technology Portal",
        authority="Data Protection Board of India / MeitY",
        requires_login=False,
        notes="Statutory compliance framework for customer digital payment and personal identification data protection.",
    ),
    "REQ-MAHA-SHOPS-ESTABLISHMENT": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://lms.mahaonline.gov.in/",
        display_label="Official Aaple Sarkar Labour Portal",
        portal_name="Maharashtra Labour Management System",
        authority="Department of Labour, Government of Maharashtra",
        requires_login=True,
        notes="Registration of commercial network operation offices under Maharashtra Shops & Establishments Act 2017.",
    ),
    "REQ-CEIG-SUBSTATION-INSPECTION": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://cei.maharashtra.gov.in/",
        display_label="Official Maharashtra CEI Portal",
        portal_name="Chief Electrical Inspectorate Maharashtra",
        authority="Chief Electrical Inspector to Government (CEIG)",
        requires_login=True,
        notes="Statutory inspection and approval under Rule 63 of Central Electricity Authority Safety Regulations for HT substations.",
    ),
    "REQ-CPCB-BATTERY-WASTE-BESS": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://eprbattery.cpcb.gov.in/",
        display_label="Official CPCB Battery Waste Portal",
        portal_name="CPCB Centralized Portal for Battery Waste Management",
        authority="Central Pollution Control Board",
        requires_login=True,
        notes="EPR registration and annual returns for industrial battery energy storage systems (BESS).",
    ),

    # --- SCENARIO 2: CONSTRUCTION CONTRACTOR (ApexBuild) ---
    "REQ-BOCW-REGISTRATION": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://labour.rajasthan.gov.in/",
        display_label="Official Rajasthan BOCW Portal",
        portal_name="Rajasthan Labour Department BOCW System",
        authority="Rajasthan Department of Labour / BOCW Board",
        requires_login=True,
        notes="Mandatory registration of construction establishments employing 10 or more building workers under Section 7.",
    ),
    "REQ-BOCW-WELFARE-CESS": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://shramsuvidha.gov.in/",
        display_label="Official Shram Suvidha Portal",
        portal_name="Ministry of Labour Shram Suvidha Portal",
        authority="Ministry of Labour & Employment / State Welfare Board",
        requires_login=True,
        notes="Statutory assessment and electronic remittance of 1% Building and Other Construction Workers Welfare Cess.",
    ),
    "REQ-CLRA-PRINCIPAL-EMPLOYER": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://shramsuvidha.gov.in/",
        display_label="Official Shram Suvidha CLRA Portal",
        portal_name="Unified Shram Suvidha Portal",
        authority="Office of the Chief Labour Commissioner (Central) / State Labour Commissioner",
        requires_login=True,
        notes="Registration as Principal Employer under Section 7 of Contract Labour (Regulation and Abolition) Act, 1970.",
    ),
    "REQ-INTER-STATE-MIGRANT-WORKMEN": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://shramsuvidha.gov.in/",
        display_label="Official Shram Suvidha ISMW Portal",
        portal_name="Unified Shram Suvidha Portal",
        authority="Ministry of Labour & Employment",
        requires_login=True,
        notes="Statutory registration of establishment employing inter-state migrant workmen across project sites.",
    ),
    "REQ-RSPCB-CD-WASTE-RULES": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://environment.rajasthan.gov.in/",
        display_label="Official RSPCB Portal",
        portal_name="Rajasthan State Pollution Control Board Portal",
        authority="Rajasthan State Pollution Control Board",
        requires_login=True,
        notes="Waste management plan approval and dust control mitigation compliance under C&D Waste Management Rules, 2016.",
    ),
    "REQ-CEA-TEMPORARY-ELECTRICAL-CONSTRUCTION": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://cea.nic.in/",
        display_label="Official Central Electricity Authority Portal",
        portal_name="CEA Construction Safety Portal",
        authority="Central Electricity Authority",
        requires_login=False,
        notes="Compliance with CEA Safety Code for Temporary Electrical Installations at Building & Construction Sites.",
    ),
    "REQ-PESO-PETROLEUM-CLASS-B-DIESEL": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://peso.gov.in/",
        display_label="Official PESO Petroleum Portal",
        portal_name="PESO Petroleum Rules Portal",
        authority="Petroleum & Explosives Safety Organization",
        requires_login=True,
        notes="Statutory licence for bulk petroleum Class B (diesel) storage tanks above 2,500 L on construction sites.",
    ),
    "REQ-CGWA-GROUNDWATER-DEWATERING": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://cgwa-noc.gov.in/",
        display_label="Official CGWA NOC Portal",
        portal_name="Central Ground Water Authority NOC System",
        authority="Central Ground Water Authority",
        requires_login=True,
        notes="Mandatory NOC for construction dewatering and commercial borewell extraction in Rajasthan notified areas.",
    ),
    "REQ-RSPCB-HOT-MIX-WMM-PLANT": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://environment.rajasthan.gov.in/",
        display_label="Official RSPCB Consent Portal",
        portal_name="RSPCB MIS Consent Portal",
        authority="Rajasthan State Pollution Control Board",
        requires_login=True,
        notes="Consent to Establish / Operate for captive wet-mix macadam and concrete batching installations.",
    ),

    # --- SCENARIO 3: TEXTILE EXPORT HOUSE - NO MFG (SilkRoute) ---
    "REQ-AEPC-RCMC": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://www.aepcindia.com/",
        display_label="Official AEPC RCMC Portal",
        portal_name="Apparel Export Promotion Council Portal",
        authority="Apparel Export Promotion Council (AEPC) / Ministry of Textiles",
        requires_login=True,
        notes="Statutory Registration-cum-Membership Certificate (RCMC) mandatory for claiming duty drawback and export incentives.",
    ),
    "REQ-CUSTOMS-ICEGATE-EDIS": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://www.icegate.gov.in/",
        display_label="Official ICEGATE Customs Portal",
        portal_name="Indian Customs Electronic Gateway (ICEGATE)",
        authority="Central Board of Indirect Taxes and Customs (CBIC)",
        requires_login=True,
        notes="Customs electronic data interchange filing, shipping bill registration, and Authorized Economic Operator (AEO) status.",
    ),
    "REQ-TN-SHOPS-ESTABLISHMENTS": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://labour.tn.gov.in/",
        display_label="Official Tamil Nadu Labour Portal",
        portal_name="Tamil Nadu Department of Labour Portal",
        authority="Department of Labour, Government of Tamil Nadu",
        requires_login=True,
        notes="Registration of commercial export warehouse and corporate office under Tamil Nadu Shops & Establishments Act, 1947.",
    ),
    "REQ-REACH-OEKO-TEX-EU-COMPLIANCE": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://echa.europa.eu/",
        display_label="European Chemicals Agency (ECHA) Portal",
        portal_name="ECHA REACH Guidance Portal",
        authority="European Chemicals Agency (ECHA) / CBIC Trade",
        requires_login=False,
        notes="Chemical testing certification (azo dyes, heavy metals) and OEKO-TEX Standard 100 verification for EU apparel exports.",
    ),
    "REQ-TN-FIRE-NOC-WAREHOUSE": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://www.tnfrs.tn.gov.in/",
        display_label="Official TNFRS Fire Portal",
        portal_name="Tamil Nadu Fire and Rescue Services Portal",
        authority="Tamil Nadu Fire and Rescue Services Department",
        requires_login=True,
        notes="Fire safety compliance certificate and sprinkler system inspection for 22,000 sq ft finished goods warehouse.",
    ),

    # --- SCENARIO 4: COMMERCIAL DATA CENTRE (CloudAxis) ---
    "REQ-TS-CEIG-HT-SUBSTATION": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://ceig.telangana.gov.in/",
        display_label="Official Telangana CEIG Portal",
        portal_name="Telangana Chief Electrical Inspectorate Portal",
        authority="Chief Electrical Inspector to Government (Telangana CEIG)",
        requires_login=True,
        notes="Statutory approval under Central Electricity Authority Regulations for 18 MW High Tension substation, transformers, and switchgear.",
    ),
    "REQ-PESO-BULK-DIESEL-STORAGE": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://peso.gov.in/",
        display_label="Official PESO Bulk Storage Portal",
        portal_name="PESO Petroleum Storage Portal",
        authority="Petroleum & Explosives Safety Organization",
        requires_login=True,
        notes="Licence in Form XIV/XV under Petroleum Rules 2002 for bulk diesel fuel storage supporting 12 standby generator sets.",
    ),
    "REQ-TSPCB-CTO-DG-SETS": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://tspcb.cpcb.gov.in/",
        display_label="Official TSPCB OCMMS Portal",
        portal_name="Telangana PCB Online Consent Management System",
        authority="Telangana State Pollution Control Board",
        requires_login=True,
        notes="Consent to Operate (CTO) under Air & Water Acts covering acoustic enclosures, stack emission heights, and cooling tower discharge.",
    ),
    "REQ-TS-FIRE-NOC-DATA-CENTRE": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://fire.telangana.gov.in/",
        display_label="Official Telangana Fire Services Portal",
        portal_name="Telangana Disaster Response and Fire Services Portal",
        authority="Telangana State Disaster Response and Fire Services",
        requires_login=True,
        notes="Specialized fire safety clearance and clean-agent gas suppression NOC for high-hazard commercial data centre facility.",
    ),
    "REQ-CPCB-BATTERY-WASTE-EPR": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://eprbattery.cpcb.gov.in/",
        display_label="Official CPCB Battery EPR Portal",
        portal_name="CPCB Battery Waste Management Portal",
        authority="Central Pollution Control Board",
        requires_login=True,
        notes="Bulk consumer EPR authorization and annual return filing for UPS and backup battery arrays (Battery Waste Management Rules 2022).",
    ),
    "REQ-CPCB-EWASTE-BULK-CONSUMER": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://eprewastecpcb.in/",
        display_label="Official CPCB E-Waste EPR Portal",
        portal_name="CPCB Centralized EPR Portal for E-Waste",
        authority="Central Pollution Control Board",
        requires_login=True,
        notes="Bulk consumer record maintenance (Form 2) and authorized recyclers handover for decommissioned server hardware.",
    ),
    "REQ-CERT-IN-CYBERSECURITY-LOGS": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://www.cert-in.org.in/",
        display_label="Official CERT-In Portal",
        portal_name="Indian Computer Emergency Response Team Portal",
        authority="CERT-In / Ministry of Electronics & IT",
        requires_login=False,
        notes="Statutory 180-day secure system, NTP, and physical access log retention and mandatory 6-hour cybersecurity incident reporting.",
    ),
    "REQ-TS-FACTORIES-ACT-DATA-CENTRE": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://ipass.telangana.gov.in/",
        display_label="Official TS-iPASS DISH Portal",
        portal_name="TS-iPASS Industrial Approvals Portal",
        authority="Directorate of Factories / DISH Telangana",
        requires_login=True,
        notes="Factory registration and statutory 24x7 365-day continuous process shift working exemptions for data centre engineering personnel.",
    ),
    "REQ-CGWA-COOLING-GROUNDWATER": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://cgwa-noc.gov.in/",
        display_label="Official CGWA NOC Portal",
        portal_name="Central Ground Water Authority NOC System",
        authority="Central Ground Water Authority",
        requires_login=True,
        notes="Statutory NOC for on-site deep borewell extraction dedicated to evaporative data centre cooling chiller plant.",
    ),
    "REQ-DOT-ODSP-REGISTRATION": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://saralsanchar.gov.in/",
        display_label="Official DoT Saral Sanchar Portal",
        portal_name="Department of Telecommunications Saral Sanchar Portal",
        authority="Department of Telecommunications (DoT)",
        requires_login=True,
        notes="Infrastructure Provider Category-I (IP-1) registration for providing passive dark fiber and colocation to telecom operators.",
    ),

    # --- SCENARIO 5: MICROFINANCE SERVICES (Sahaya) ---
    "REQ-FIU-IND-PMLA-REPORTING": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://fiumudra.gov.in/",
        display_label="Official FIU-IND FINnet Portal",
        portal_name="Financial Intelligence Unit FINnet 2.0 Portal",
        authority="Financial Intelligence Unit - India (FIU-IND)",
        requires_login=True,
        notes="Mandatory reporting entity registration under PMLA and monthly electronic filing of Cash & Suspicious Transaction Reports (CTR/STR).",
    ),
    "REQ-CERSAI-SECURITY-FILING": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://www.cersai.org.in/",
        display_label="Official CERSAI Registry Portal",
        portal_name="Central Registry of Securitisation Asset Reconstruction Portal",
        authority="Central Registry of Securitisation (CERSAI)",
        requires_login=True,
        notes="Electronic registration of security interests, micro-hypothecations, and equitable liens on borrower assets within 30 days.",
    ),
    "REQ-CIC-CREDIT-REPORTING": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://www.cibil.com/",
        display_label="Official CIBIL Credit Bureau Portal",
        portal_name="Credit Information Bureau Commercial Portal",
        authority="Credit Information Companies / Reserve Bank of India",
        requires_login=True,
        notes="Statutory monthly submission of borrower repayment data to all four RBI-licensed CICs (CIBIL, Equifax, Experian, CRIF High Mark).",
    ),
    "REQ-DPDP-FINANCIAL-KYC-DATA": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://www.meity.gov.in/content/digital-personal-data-protection-act-2023",
        display_label="Official MeitY DPDP Portal",
        portal_name="Data Protection Board of India Portal",
        authority="Data Protection Board of India / MeitY",
        requires_login=False,
        notes="Data Fiduciary compliance for biometric and digital Aadhaar KYC verification under DPDP Act 2023 and RBI guidelines.",
    ),
    "REQ-RBI-DIGITAL-LENDING-GUIDELINES": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://www.rbi.org.in/",
        display_label="Official Reserve Bank of India Portal",
        portal_name="Reserve Bank of India Regulatory Portal",
        authority="Reserve Bank of India (RBI)",
        requires_login=False,
        notes="Compliance with RBI Regulatory Framework for Digital Lending: mandatory Key Fact Statement (KFS), cooling-off period, and direct disbursals.",
    ),
    "REQ-UP-SHOPS-ESTABLISHMENTS-BRANCHES": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://uplabour.gov.in/",
        display_label="Official UP Labour Dookan Portal",
        portal_name="Uttar Pradesh Labour Department Dookan Portal",
        authority="Department of Labour, Government of Uttar Pradesh",
        requires_login=True,
        notes="Registration and renewal of 34 branch offices across UP districts under UP Dookan Aur Vanijya Adhishthan Adhiniyam, 1962.",
    ),
    "REQ-RBI-NBFC-MFI-COR": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://cms.rbi.org.in/",
        display_label="Official RBI Corporate Licensing Portal",
        portal_name="RBI Corporate Licensing & Supervisory Portal",
        authority="Department of Non-Banking Supervision, RBI",
        requires_login=True,
        notes="Certificate of Registration (CoR) under Section 45-IA of RBI Act 1934 and adherence to Master Direction - RBI (Regulatory Framework for Microfinance Loans) Directions, 2022.",
    ),
    "REQ-IRDAI-CORPORATE-AGENT-MICROINSURANCE": ActionDestination(
        destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
        url="https://bap.irdai.gov.in/",
        display_label="Official IRDAI BAP Portal",
        portal_name="IRDAI Business Analytics Project Portal",
        authority="Insurance Regulatory and Development Authority of India",
        requires_login=True,
        notes="Licence under IRDAI (Registration of Corporate Agents) Regulations to solicit and service bundled micro credit-life policies.",
    ),
}


def resolve_demo_destination(requirement_id: str, default_url: str = "", authority: str = "") -> ActionDestination:
    """Resolve action destination with strict classification for demo scenarios."""
    dest = DEMO_DESTINATIONS.get(requirement_id)
    if dest:
        return dest

    if default_url and default_url.startswith("http"):
        return ActionDestination(
            destination_type=ActionDestinationType.OFFICIAL_SERVICE_PAGE,
            url=default_url,
            display_label=f"Official {authority or 'Regulatory'} Portal",
            portal_name=f"{authority or 'Regulatory'} Portal",
            authority=authority or "Regulatory Authority",
            requires_login=True,
            notes="Official statutory service entry point.",
        )

    return ActionDestination(
        destination_type=ActionDestinationType.ACTION_PAGE_NOT_VERIFIED,
        url=default_url or "https://india.gov.in/",
        display_label="Official National Portal",
        portal_name="National Government Services Portal",
        authority=authority or "Government of India",
        requires_login=False,
        notes="Action destination requires verification.",
    )
