"""Read-only runtime, Precision Workshop provenance, and secret-exposure audit."""
import json
import os
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / "backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django
django.setup()
from django.conf import settings
from django.db import connection
from dotenv import dotenv_values
from rest_framework.test import APIClient
from apps.businesses.models import Business
from apps.knowledge.models import RequirementDefinition, RuleVersion

report = {"kind": "READ_ONLY_RUNTIME_PROVENANCE_SECURITY"}
with connection.cursor() as cursor:
    cursor.execute("SELECT 1")
    report["database"] = {"engine": connection.vendor, "query_ok": cursor.fetchone()[0] == 1}
    if connection.vendor == "postgresql":
        cursor.execute("SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname='vector')")
        report["database"]["pgvector_installed"] = cursor.fetchone()[0]
report["published_knowledge"] = {
    "requirements": RequirementDefinition.objects.filter(status="PUBLISHED").count(),
    "rules": RuleVersion.objects.filter(status="PUBLISHED").count(),
}
names = ["GEMINI_API_KEY", "OPENAI_API_KEY", "SERPAPI_API_KEY", "COMPLIANCERAG_URL",
         "GOOGLE_AUTH_CLIENT_ID", "GOOGLE_AUTH_CLIENT_SECRET", "GOOGLE_CALENDAR_REFRESH_TOKEN",
         "AZURE_STORAGE_CONNECTION_STRING"]
report["environment"] = {name: "configured" if getattr(settings, name, "") else "missing" for name in names}
report["environment"]["LLM_PROVIDER"] = settings.LLM_PROVIDER
from domain.providers.gemini_provider import _api_keys
report["environment"]["gemini_slot_count"] = len(_api_keys())

business = Business.objects.get(pk="09f5d702-f83a-4b1d-bd5e-2c7b31b7a2fa")
client = APIClient()
client.force_authenticate(business.owner)
assessment_id = "8b0883ed-63f8-47a6-8e08-84874d71eae8"
response = client.get("/api/v1/standards/search", {"business_id": str(business.id), "assessment_id": assessment_id})
data = response.data.get("data", response.data)
report["precision_workshop"] = {
    "business_id": str(business.id), "assessment_id": assessment_id, "http_status": response.status_code,
    **{key: data.get(key) for key in ("count", "scope_status", "scope_note", "reviewed_match_count")},
    "standards": [{key: item.get(key) for key in ("title", "standard_code", "authority", "nature", "result_origin",
          "source_reference", "source_url", "is_mandatory", "why_it_matters", "citations", "rule_version_id")}
          for item in data.get("standards", [])],
}

# Match configured secret values without ever reporting the values or excerpts.
env = dotenv_values(root / ".env")
secrets = {name: value for name, value in env.items() if value and len(value) >= 12
           and not name.startswith("NEXT_PUBLIC_")
           and (any(term in name.upper() for term in ("KEY", "SECRET", "TOKEN", "PASSWORD", "DATABASE_URL", "CONNECTION_STRING"))
                or name == "SERP_API" or (name.startswith("GEMINI_API") and name[len("GEMINI_API"):].isdigit()))}
files = subprocess.check_output(["git", "ls-files", "--cached", "--others", "--exclude-standard"], cwd=root, text=True).splitlines()
source_paths = [root / file for file in files if Path(file).suffix.lower() in {".py", ".ts", ".tsx", ".js", ".cjs", ".json", ".md", ".txt", ".mmd", ".toml", ".yaml", ".yml", ".css", ".lock"}]
bundle_paths = list((root / "frontend/.next/static").rglob("*.js"))
hits = []
for category, paths in (("repository_text", source_paths), ("frontend_bundle", bundle_paths)):
    for path in paths:
        if not path.is_file():
            continue
        content = path.read_text(encoding="utf-8", errors="replace")
        for name, value in secrets.items():
            if value in content:
                hits.append({"category": category, "variable": name, "path": str(path.relative_to(root))})
diff = subprocess.check_output(["git", "diff", "--no-ext-diff"], cwd=root, stderr=subprocess.DEVNULL)
report["secret_scan"] = {"configured_sensitive_values_checked": len(secrets), "repository_text_files": len(source_paths),
    "frontend_js_files": len(bundle_paths), "matches": hits,
    "diff_matching_variable_names": [name for name, value in secrets.items() if value.encode() in diff]}
(root / "docs/hardening-runtime-security-final.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps(report, indent=2))
