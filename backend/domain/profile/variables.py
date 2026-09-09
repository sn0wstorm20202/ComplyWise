"""Canonical business-profile variable registry.

Authority: PRD_v2.0 §11.1, TRD_v2.0 §8.

This module is a **schema**, not knowledge. It declares which variables exist,
their stable machine keys, their data types and the option taxonomies the UI
can render. It deliberately contains:

- no thresholds,
- no applicability conditions,
- no fees, deadlines or validity periods,
- no statement about which variable matters for which regulation.

Which variables are actually decision-relevant for a given business is decided
at runtime by the knowledge dependency matrix (Task 3), not here.
`default_relevance` only seeds the first onboarding step.

The `key` of each variable is a published contract: rule ASTs reference it as
``{"var": "annual_turnover"}``. Renaming a key is a breaking knowledge change.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
from enum import StrEnum


class VariableDataType(StrEnum):
    BOOLEAN = "BOOLEAN"
    TEXT = "TEXT"
    LONG_TEXT = "LONG_TEXT"
    INTEGER = "INTEGER"
    DECIMAL = "DECIMAL"
    CURRENCY_INR = "CURRENCY_INR"
    SINGLE_CHOICE = "SINGLE_CHOICE"
    MULTI_CHOICE = "MULTI_CHOICE"
    DATE = "DATE"
    JURISDICTION = "JURISDICTION"


class Relevance(StrEnum):
    CORE = "CORE"
    CONDITIONAL = "CONDITIONAL"
    OPTIONAL = "OPTIONAL"
    NOT_NEEDED = "NOT_NEEDED"


@dataclass(frozen=True, slots=True)
class Option:
    value: str
    label: str


@dataclass(frozen=True, slots=True)
class ProfileVariable:
    code: str
    key: str
    label: str
    data_type: VariableDataType
    #: Shown to the user when they may reasonably ask "why do you need this?"
    why_it_matters: str = ""
    unit: str | None = None
    options: tuple[Option, ...] = field(default_factory=tuple)
    #: Name of a runtime registry that supplies this variable's option set.
    #: Used when the valid values are knowledge (e.g. the jurisdictions the
    #: knowledge base can actually normalise) rather than a fixed taxonomy.
    #: Left None when `options` above is the complete answer.
    options_source: str | None = None
    default_relevance: Relevance = Relevance.CONDITIONAL
    #: True for values that are only ever supplied by the user, never derived.
    user_input_only: bool = True

    @property
    def is_choice(self) -> bool:
        return self.data_type in {
            VariableDataType.SINGLE_CHOICE,
            VariableDataType.MULTI_CHOICE,
        }

    @property
    def option_values(self) -> frozenset[str]:
        return frozenset(option.value for option in self.options)


#: `options_source` value meaning "ask the jurisdiction registry at runtime".
OPTIONS_SOURCE_JURISDICTIONS = "JURISDICTION_REGISTRY"


def _options(*pairs: tuple[str, str]) -> tuple[Option, ...]:
    return tuple(Option(value=value, label=label) for value, label in pairs)


LEGAL_CONSTITUTION_OPTIONS = _options(
    ("PROPRIETORSHIP", "Proprietorship"),
    ("PARTNERSHIP", "Partnership firm"),
    ("LLP", "Limited liability partnership"),
    ("PRIVATE_LIMITED", "Private limited company"),
    ("PUBLIC_LIMITED", "Public limited company"),
    ("ONE_PERSON_COMPANY", "One person company"),
    ("COOPERATIVE", "Co-operative society"),
    ("TRUST_OR_SOCIETY", "Trust or society"),
    ("HUF", "Hindu undivided family"),
    ("OTHER", "Other"),
)

LIFECYCLE_STAGE_OPTIONS = _options(
    ("PLANNED", "Planned — not yet set up"),
    ("UNDER_SETUP", "Under setup"),
    ("OPERATIONAL", "Operational"),
    ("EXPANDING", "Expanding"),
    ("DORMANT", "Dormant or closing"),
)

INDUSTRIAL_ZONE_OPTIONS = _options(
    ("INSIDE_NOTIFIED_INDUSTRIAL_AREA", "Inside a notified industrial area or estate"),
    ("OUTSIDE_NOTIFIED_INDUSTRIAL_AREA", "Outside a notified industrial area"),
    ("SPECIAL_ECONOMIC_ZONE", "Special economic zone"),
    ("NOT_KNOWN", "Not known"),
)

SOCIAL_CATEGORY_OPTIONS = _options(
    ("GENERAL", "General"),
    ("SC", "Scheduled caste"),
    ("ST", "Scheduled tribe"),
    ("OBC", "Other backward class"),
    ("PREFER_NOT_TO_SAY", "Prefer not to say"),
)

OWNERSHIP_GENDER_OPTIONS = _options(
    ("WOMAN_OWNED", "Woman owned"),
    ("MAN_OWNED", "Man owned"),
    ("MIXED", "Mixed ownership"),
    ("PREFER_NOT_TO_SAY", "Prefer not to say"),
)

TRADE_INTENT_OPTIONS = _options(
    ("NONE", "No import or export"),
    ("IMPORT_ONLY", "Import only"),
    ("EXPORT_ONLY", "Export only"),
    ("IMPORT_AND_EXPORT", "Both import and export"),
    ("PLANNED", "Planned, not started"),
)

CDSCO_DEVICE_RISK_OPTIONS = _options(
    ("CLASS_A_LOW", "Class A — Low Risk"),
    ("CLASS_B_LOW_MODERATE", "Class B — Low to Moderate Risk"),
    ("CLASS_C_MODERATE_HIGH", "Class C — Moderate to High Risk"),
    ("CLASS_D_HIGH", "Class D — High Risk"),
)

CLEANROOM_ISO_OPTIONS = _options(
    ("ISO_CLASS_FIVE", "ISO Class 5"),
    ("ISO_CLASS_SEVEN", "ISO Class 7"),
    ("ISO_CLASS_EIGHT", "ISO Class 8"),
    ("UNCLASSIFIED_CONTROLLED", "Unclassified Controlled"),
    ("NONE", "No Cleanroom"),
)

ACTIVE_IMPLANTABLE_OPTIONS = _options(
    ("IMPLANTABLE", "Implantable Device"),
    ("ACTIVE_ELECTROMEDICAL", "Active Electromedical"),
    ("INVITRO_DIAGNOSTIC", "In-Vitro Diagnostic"),
    ("SURGICAL_INSTRUMENT", "Surgical Instrument"),
    ("OTHER", "Other Medical Device"),
)

CLOUD_HOSTING_OPTIONS = _options(
    ("INDIA_DOMESTIC", "India Domestic Data Center"),
    ("MULTI_REGION_GLOBAL", "Multi-Region Global Cloud"),
    ("CROSS_BORDER", "Cross-Border Exclusively"),
)

WAREHOUSE_STORAGE_OPTIONS = _options(
    ("GENERAL_MERCHANDISE", "General Merchandise"),
    ("TEMPERATURE_CONTROLLED", "Temperature Controlled Cold Storage"),
    ("HAZARDOUS_MATERIALS", "Hazardous Materials"),
    ("BONDED_CUSTOMS", "Bonded Customs"),
    ("MIXED", "Mixed Storage"),
)

SURFACE_TREATMENT_OPTIONS = _options(
    ("ELECTROPLATING_GALVANIZING", "Electroplating or Galvanizing"),
    ("POWDER_COATING_PAINTING", "Powder Coating or Industrial Painting"),
    ("HEAT_TREATMENT_ONLY", "Heat Treatment Only"),
    ("MACHINING_ONLY", "Machining Only without Coating"),
)


PROFILE_VARIABLES: tuple[ProfileVariable, ...] = (
    ProfileVariable(
        code="V01",
        key="legal_constitution",
        label="Legal constitution",
        data_type=VariableDataType.SINGLE_CHOICE,
        options=LEGAL_CONSTITUTION_OPTIONS,
        why_it_matters="The form of your entity affects which registrations are relevant.",
        default_relevance=Relevance.CORE,
    ),
    ProfileVariable(
        code="V02",
        key="lifecycle_stage",
        label="Lifecycle stage",
        data_type=VariableDataType.SINGLE_CHOICE,
        options=LIFECYCLE_STAGE_OPTIONS,
        why_it_matters="Some requirements apply before operations begin and others after.",
        default_relevance=Relevance.CORE,
    ),
    ProfileVariable(
        code="V03",
        key="state",
        label="Registered state or union territory",
        data_type=VariableDataType.JURISDICTION,
        options_source=OPTIONS_SOURCE_JURISDICTIONS,
        why_it_matters="State authorities set their own approvals and incentives.",
        default_relevance=Relevance.CORE,
    ),
    ProfileVariable(
        code="V04",
        key="district",
        label="District",
        data_type=VariableDataType.JURISDICTION,
        why_it_matters="District and zone context can change local approvals and scheme benefits.",
    ),
    ProfileVariable(
        code="V05",
        key="industrial_zone_status",
        label="Industrial zone status",
        data_type=VariableDataType.SINGLE_CHOICE,
        options=INDUSTRIAL_ZONE_OPTIONS,
        why_it_matters="Location inside or outside a notified area can change what is required.",
    ),
    ProfileVariable(
        code="V06",
        key="product_description",
        label="What you make or do",
        data_type=VariableDataType.LONG_TEXT,
        why_it_matters=(
            "Your own description drives product and activity classification. "
            "You do not need to know any code or standard number."
        ),
        default_relevance=Relevance.CORE,
    ),
    ProfileVariable(
        code="V07",
        key="annual_turnover",
        label="Annual turnover",
        data_type=VariableDataType.CURRENCY_INR,
        unit="INR",
        why_it_matters="Several regimes are scaled by turnover.",
    ),
    ProfileVariable(
        code="V08",
        key="plant_machinery_investment",
        label="Investment in plant and machinery",
        data_type=VariableDataType.CURRENCY_INR,
        unit="INR",
        why_it_matters="Investment is an input to classification and to several incentive schemes.",
    ),
    ProfileVariable(
        code="V09",
        key="ownership_social_category",
        label="Ownership social category",
        data_type=VariableDataType.SINGLE_CHOICE,
        options=SOCIAL_CATEGORY_OPTIONS,
        why_it_matters="Some schemes offer category-specific benefits. You may decline to answer.",
        default_relevance=Relevance.OPTIONAL,
    ),
    ProfileVariable(
        code="V10",
        key="ownership_gender",
        label="Ownership gender profile",
        data_type=VariableDataType.SINGLE_CHOICE,
        options=OWNERSHIP_GENDER_OPTIONS,
        why_it_matters="Some schemes offer benefits for woman-owned enterprises. You may decline to answer.",
        default_relevance=Relevance.OPTIONAL,
    ),
    ProfileVariable(
        code="V11",
        key="import_export_intent",
        label="Import or export intent",
        data_type=VariableDataType.SINGLE_CHOICE,
        options=TRADE_INTENT_OPTIONS,
        why_it_matters="Cross-border trade introduces a separate set of registrations.",
    ),
    ProfileVariable(
        code="V12",
        key="export_destination",
        label="Export destinations",
        data_type=VariableDataType.MULTI_CHOICE,
        why_it_matters="Destination markets can add product certification and testing requirements.",
    ),
    ProfileVariable(
        code="V13",
        key="total_worker_count",
        label="Total workers",
        data_type=VariableDataType.INTEGER,
        unit="people",
        why_it_matters="Workforce size is an input to labour and safety requirements.",
    ),
    ProfileVariable(
        code="V14",
        key="contract_worker_count",
        label="Contract workers",
        data_type=VariableDataType.INTEGER,
        unit="people",
        why_it_matters="Contract labour is counted separately from directly employed workers.",
    ),
    ProfileVariable(
        code="V15",
        key="connected_power_load",
        label="Connected power load",
        data_type=VariableDataType.DECIMAL,
        unit="HP",
        why_it_matters="Connected load is an input to factory and electrical approvals.",
    ),
    ProfileVariable(
        code="V16",
        key="effluent_emission_generation",
        label="Generates effluent or air emissions",
        data_type=VariableDataType.BOOLEAN,
        why_it_matters="Discharges and emissions determine whether environmental consents are relevant.",
    ),
    ProfileVariable(
        code="V17",
        key="hazardous_waste_generation",
        label="Generates hazardous waste",
        data_type=VariableDataType.BOOLEAN,
        why_it_matters="Hazardous waste introduces additional environmental obligations.",
    ),
    ProfileVariable(
        code="V18",
        key="ecommerce_operations",
        label="Sells through e-commerce",
        data_type=VariableDataType.BOOLEAN,
        why_it_matters="Selling online can add its own registration and labelling obligations.",
    ),
    ProfileVariable(
        code="V19",
        key="multi_state_operations",
        label="Operates in more than one state",
        data_type=VariableDataType.BOOLEAN,
        why_it_matters="Operating across states can change which authority has jurisdiction.",
    ),
    # -- Domain: Food & Agro Processing (V20-V24) -----------------------------
    ProfileVariable(
        code="V20",
        key="daily_processing_capacity",
        label="Daily manufacturing or processing capacity",
        data_type=VariableDataType.DECIMAL,
        unit="MT/day",
        why_it_matters="Production volume affects whether central or state authority governs registration.",
    ),
    ProfileVariable(
        code="V21",
        key="boiler_installed",
        label="Industrial steam boiler operated",
        data_type=VariableDataType.BOOLEAN,
        why_it_matters="Boiler equipment triggers inspection certifications under boiler safety acts.",
    ),
    ProfileVariable(
        code="V22",
        key="food_contact_packaging",
        label="Direct food contact packaging used",
        data_type=VariableDataType.BOOLEAN,
        why_it_matters="Packaging materials touching food products must meet migration testing standards.",
    ),
    ProfileVariable(
        code="V23",
        key="cold_chain_storage",
        label="Cold chain or refrigerated storage operated",
        data_type=VariableDataType.BOOLEAN,
        why_it_matters="Temperature-controlled storage introduces temperature monitoring requirements.",
    ),
    ProfileVariable(
        code="V24",
        key="organic_claim",
        label="Certified organic claims on products",
        data_type=VariableDataType.BOOLEAN,
        why_it_matters="Organic labeling requires accreditation under national organic production programs.",
    ),
    # -- Domain: Medical Devices & Diagnostics (V25-V29) ----------------------
    ProfileVariable(
        code="V25",
        key="cdsco_device_risk_class",
        label="Medical device risk classification",
        data_type=VariableDataType.SINGLE_CHOICE,
        options=CDSCO_DEVICE_RISK_OPTIONS,
        why_it_matters="Risk classification determines whether central or state licensing authorities oversee manufacturing.",
    ),
    ProfileVariable(
        code="V26",
        key="is_sterile_at_supply",
        label="Device supplied in sterile condition",
        data_type=VariableDataType.BOOLEAN,
        why_it_matters="Sterility status determines sterilization validation and environmental microbial monitoring.",
    ),
    ProfileVariable(
        code="V27",
        key="cleanroom_iso_class",
        label="Cleanroom facility classification",
        data_type=VariableDataType.SINGLE_CHOICE,
        options=CLEANROOM_ISO_OPTIONS,
        why_it_matters="Cleanroom validation is an input to quality audits for sensitive device manufacturing.",
    ),
    ProfileVariable(
        code="V28",
        key="biocompatibility_tested",
        label="Biocompatibility testing per international standards",
        data_type=VariableDataType.BOOLEAN,
        why_it_matters="Device materials contacting human tissue require biological safety evaluation dossiers.",
    ),
    ProfileVariable(
        code="V29",
        key="active_or_implantable",
        label="Medical device operational type",
        data_type=VariableDataType.SINGLE_CHOICE,
        options=ACTIVE_IMPLANTABLE_OPTIONS,
        why_it_matters="Active and implantable devices require electrical safety and clinical surveillance.",
    ),
    # -- Domain: Digital, Software & SaaS (V30-V34) ----------------------------
    ProfileVariable(
        code="V30",
        key="processes_personal_data",
        label="Processes digital personal data of Indian users",
        data_type=VariableDataType.BOOLEAN,
        why_it_matters="Handling personal data introduces data fiduciary obligations under privacy laws.",
    ),
    ProfileVariable(
        code="V31",
        key="cloud_hosting_location",
        label="Primary cloud infrastructure hosting region",
        data_type=VariableDataType.SINGLE_CHOICE,
        options=CLOUD_HOSTING_OPTIONS,
        why_it_matters="Infrastructure location affects data residency and cross-border transfer requirements.",
    ),
    ProfileVariable(
        code="V32",
        key="cross_border_data_transfer",
        label="Transfers personal data across international borders",
        data_type=VariableDataType.BOOLEAN,
        why_it_matters="Cross-border data movement is subject to country transfer restrictions and safeguards.",
    ),
    ProfileVariable(
        code="V33",
        key="critical_cyber_services",
        label="Provides cloud hosting, VPN, or network infrastructure",
        data_type=VariableDataType.BOOLEAN,
        why_it_matters="Critical digital service providers face mandatory security incident reporting timelines.",
    ),
    ProfileVariable(
        code="V34",
        key="export_of_software_services",
        label="Exports software or digital services internationally",
        data_type=VariableDataType.BOOLEAN,
        why_it_matters="Cross-border digital services involve software technology park and foreign exchange declarations.",
    ),
    # -- Domain: Electronics & Hardware (V35-V38) -----------------------------
    ProfileVariable(
        code="V35",
        key="wireless_rf_features",
        label="Wireless RF transmitting capabilities",
        data_type=VariableDataType.BOOLEAN,
        why_it_matters="Radio transmission components require equipment type approvals from telecommunication authorities.",
    ),
    ProfileVariable(
        code="V36",
        key="bis_crs_product_category",
        label="Product falls under compulsory registration orders",
        data_type=VariableDataType.BOOLEAN,
        why_it_matters="Covered electronic items require safety testing at recognized laboratories before sale.",
    ),
    ProfileVariable(
        code="V37",
        key="battery_included",
        label="Includes integrated lithium-ion or secondary battery",
        data_type=VariableDataType.BOOLEAN,
        why_it_matters="Batteries introduce waste management and transport safety testing standards.",
    ),
    ProfileVariable(
        code="V38",
        key="epr_target_obligation",
        label="Places electrical or electronic equipment on the market",
        data_type=VariableDataType.BOOLEAN,
        why_it_matters="Producers face extended producer responsibility recycling targets under waste rules.",
    ),
    # -- Domain: Logistics & Warehousing (V39-V41) ----------------------------
    ProfileVariable(
        code="V39",
        key="warehouse_storage_type",
        label="Warehouse storage facility type",
        data_type=VariableDataType.SINGLE_CHOICE,
        options=WAREHOUSE_STORAGE_OPTIONS,
        why_it_matters="Storage characteristics determine commercial zoning and safety clearance requirements.",
    ),
    ProfileVariable(
        code="V40",
        key="hazardous_goods_handling",
        label="Handles or stores dangerous or flammable substances",
        data_type=VariableDataType.BOOLEAN,
        why_it_matters="Flammable and toxic materials require dedicated storage safety permits.",
    ),
    ProfileVariable(
        code="V41",
        key="fleet_commercial_vehicles",
        label="Owns or operates commercial transport fleet",
        data_type=VariableDataType.BOOLEAN,
        why_it_matters="Fleet operations introduce transport vehicle permits and tracking standards.",
    ),
    # -- Domain: Precision Engineering & Automotive (V42-V43) -----------------
    ProfileVariable(
        code="V42",
        key="surface_treatment_type",
        label="Metal surface finishing or treatment processes",
        data_type=VariableDataType.SINGLE_CHOICE,
        options=SURFACE_TREATMENT_OPTIONS,
        why_it_matters="Chemical treatment processes determine pollution control categorization and discharge norms.",
    ),
    ProfileVariable(
        code="V43",
        key="compressed_gas_storage",
        label="Bulk storage of compressed or liquefied industrial gases",
        data_type=VariableDataType.BOOLEAN,
        why_it_matters="Pressurized gas storage triggers industrial safety container approvals.",
    ),
)

VARIABLES_BY_KEY: dict[str, ProfileVariable] = {v.key: v for v in PROFILE_VARIABLES}
VARIABLES_BY_CODE: dict[str, ProfileVariable] = {v.code: v for v in PROFILE_VARIABLES}

CORE_VARIABLE_KEYS: tuple[str, ...] = tuple(
    v.key for v in PROFILE_VARIABLES if v.default_relevance is Relevance.CORE
)

#: Numeric types that must be compared with Decimal, never float (TRD_v2.0 §67).
DECIMAL_DATA_TYPES = frozenset(
    {VariableDataType.DECIMAL, VariableDataType.CURRENCY_INR}
)


def get_variable(key_or_code: str) -> ProfileVariable | None:
    return VARIABLES_BY_KEY.get(key_or_code) or VARIABLES_BY_CODE.get(key_or_code.upper())


def resolve_variable_options(variable: ProfileVariable) -> list[dict[str, str]]:
    """The selectable options for a variable, including runtime-sourced ones.

    Every surface that renders a choice must go through this function so the
    profile form and the smart-question form cannot offer different values for
    the same variable.
    """
    if variable.options_source == OPTIONS_SOURCE_JURISDICTIONS:
        # Imported here: the jurisdiction registry reads knowledge-pack data and
        # depends on Django settings, while this module must stay import-light.
        from domain.jurisdictions.resolver import JurisdictionRegistry

        return [
            {"value": item["code"], "label": item["name"]}
            for item in JurisdictionRegistry.all_jurisdictions()
        ]
    return [{"value": o.value, "label": o.label} for o in variable.options]


def coerce_value(variable: ProfileVariable, value: object) -> object:
    """Normalise a raw submitted value to the variable's declared type.

    Raises `ValueError` with a user-facing message when the value cannot be
    represented. Returning a wrong-but-plausible value would be worse than
    failing: an unusable number must not silently become a decision input.
    """
    if value is None or (isinstance(value, str) and not value.strip()):
        return None

    dt = variable.data_type

    if dt is VariableDataType.BOOLEAN:
        if isinstance(value, bool):
            return value
        if isinstance(value, (int, float)):
            return bool(value)
        if isinstance(value, str):
            s = value.strip().lower()
            if s in {"true", "false", "yes", "no", "1", "0"}:
                return s in {"true", "yes", "1"}
        raise ValueError(f"{variable.label} must be true or false.")

    if dt is VariableDataType.INTEGER:
        try:
            return int(value)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"{variable.label} must be a whole number.") from exc

    if dt in DECIMAL_DATA_TYPES:
        try:
            return Decimal(str(value))
        except Exception as exc:  # noqa: BLE001 - Decimal raises InvalidOperation
            raise ValueError(f"{variable.label} must be a number.") from exc

    if dt is VariableDataType.SINGLE_CHOICE:
        text = str(value).strip()
        if variable.options and text not in variable.option_values:
            raise ValueError(f"{text!r} is not a recognised option for {variable.label}.")
        return text

    if dt is VariableDataType.MULTI_CHOICE:
        if isinstance(value, str):
            text = value.strip()
            if text.startswith("[") and text.endswith("]"):
                import json
                try:
                    parsed = json.loads(text)
                    if isinstance(parsed, list):
                        value = parsed
                except Exception:
                    pass
            if isinstance(value, str):
                value = [item.strip() for item in text.split(",") if item.strip()]
        elif not isinstance(value, (list, tuple, set)):
            raise ValueError(f"{variable.label} must be a list.")
        items = [str(item).strip() for item in value]
        if variable.options:
            unknown = sorted(set(items) - variable.option_values)
            if unknown:
                raise ValueError(
                    f"{', '.join(unknown)} is not a recognised option for {variable.label}."
                )
        return items

    return str(value).strip()
