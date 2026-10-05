"""Fact identity and presentation guards for the existing adaptive planner."""
import re

ALIASES = {
    "total_workforce":"total_worker_count", "worker_count":"total_worker_count",
    "employee_count":"total_worker_count", "number_of_workers":"total_worker_count",
    "workers":"total_worker_count", "connected_power":"connected_power_load",
    "power_load":"connected_power_load", "annual_revenue":"annual_turnover",
    "turnover":"annual_turnover", "jurisdiction_state":"state",
    "hazardous_waste":"hazardous_waste_generation", "trade_intent":"import_export_intent",
}
TYPE_MAP = {"SINGLE_CHOICE":"SINGLE_SELECT", "MULTI_CHOICE":"MULTI_SELECT",
            "INTEGER":"NUMBER", "DECIMAL":"NUMBER", "CURRENCY_INR":"CURRENCY"}

def fact_identity(key, wording=""):
    original = str(key).lower()
    key = re.sub(r"^dynamic_", "", original)
    if key in ALIASES:
        return ALIASES[key]
    text = wording.lower()
    if re.search(r"(?:how many|number|total|size|count).*(?:workers|employees|workforce)", text) and not re.search(r"contract|shift|female|temporary|category",text):
        return "total_worker_count"
    if re.search(r"connected.*(?:power|load)|(?:power|electrical).*connected load",text):
        return "connected_power_load"
    if re.search(r"annual.*(?:turnover|revenue)",text):
        return "annual_turnover"
    if "primary activity" in text or "main activity carried out" in text:
        return "primary_activity"
    if "hazardous waste" in text and not re.search(r"effluent|emission|cutting oil|sludge|quantity|dispos|category|type",text):
        return "hazardous_waste_generation"
    return original

def normalize_candidate(item, known, rule_refs=None, suggestions=None):
    item = dict(item)
    from domain.intelligence.output_safety import validate_question_wording
    # Remove a legacy legal preamble without changing the operational question
    # or its fact identity. Remaining unsupported wording/options are rejected.
    item["question_text"] = re.sub(
        r"^Under\s+[^,?]+\b(?:Act|Rules|Regulations|Order)\b(?:\s*,?\s*\d{4})?\s*,\s*",
        "", item.get("question_text", ""), flags=re.I,
    )
    try:
        validate_question_wording(item["question_text"])
        for choice in item.get("options") or item.get("allowed_values") or []:
            for wording in choice.values() if isinstance(choice, dict) else [choice]:
                if isinstance(wording, str):
                    validate_question_wording(wording)
    except ValueError:
        return None
    for field in ("reason", "why_it_matters", "expected_discovery_impact"):
        try:
            validate_question_wording(item.get(field, ""))
        except ValueError:
            item[field] = "This detail helps focus relevant source searches. Applicability will be checked against supporting evidence."
    key = item.get("variable_key") or item.get("target_variable_id", "")
    identity = fact_identity(key,item.get("question_text",""))
    wording = item.get("question_text", "").lower()
    # A model-assigned canonical key must match the fact actually being asked.
    # Ordinary cooking oil disposal is not a confirmed hazardous-waste finding.
    if identity == "hazardous_waste_generation" and not re.search(r"hazardous|toxic|chemical sludge|biomedical|bio-medical", wording):
        identity = "dynamic_waste_handling"
    if identity in known and known[identity] not in (None, ""):
        return None
    item["variable_key"] = identity
    item["target_variable_id"] = identity
    item["fact_key"] = identity
    item["already_known"] = False
    refs = (rule_refs or {}).get(identity, [])
    item["source_decision_refs"] = refs
    item["reason_code"] = "MISSING_RULE_FACT" if refs else "SOURCE_DISCOVERY_GAP"
    item["answer_type"] = TYPE_MAP.get(item.get("answer_type"),item.get("answer_type","TEXT"))
    item["data_type"] = item.get("data_type",item["answer_type"])
    from domain.profile.variables import get_variable
    variable = get_variable(identity)
    if variable and variable.unit:
        item["unit"] = variable.unit
    if identity == "connected_power_load":
        item["question_text"] = "What is the total connected power load at this business, in HP?"
        item["why_it_matters"] = (item.get("why_it_matters") or item.get("reason") or "Connected load helps identify relevant electrical requirements.") + " Use the value recorded in HP for this field."
    if identity == "primary_activity":
        item["question_text"] = "What is the main activity carried out at this business?"
        item["why_it_matters"] = "Choose the activity that best describes what the business actually does day-to-day. This helps ComplyWise identify the regulations most relevant to your operations."
    suggestion = (suggestions or {}).get(identity)
    choices = item.get("options") or item.get("allowed_values") or []
    values = [option.get("value", option.get("label")) if isinstance(option,dict) else option for option in choices]
    if item["answer_type"] in {"SINGLE_SELECT", "MULTI_SELECT"} and suggestion not in values:
        suggestion = None
    if item["answer_type"] == "BOOLEAN" and not isinstance(suggestion, bool):
        suggestion = None
    item["suggested_answer"] = suggestion
    item["suggested_answer_origin"] = "STARTER_PROFILE" if suggestion is not None else "NONE"
    return item
