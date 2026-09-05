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
        if not isinstance(value, (list, tuple, set)):
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
