"""Deploy the API release as a separate ingress-free Azure worker.

Uses the signed-in Azure CLI identity. Credentials are read and sent in memory,
never printed or written to parameter files. Does not enable API job submission.
"""
import argparse
import json
import subprocess
import shutil
from urllib.request import Request, urlopen
from urllib.error import HTTPError


def az_json(*args):
    executable = shutil.which("az")
    if not executable:
        raise RuntimeError("Install Azure CLI and sign in before deployment.")
    process = subprocess.run([executable, *args, "--output", "json"], capture_output=True, text=True, shell=False)
    if process.returncode:
        raise RuntimeError("Azure CLI prerequisite failed; inspect the named resource separately.")
    return json.loads(process.stdout)


def arm(method, url, token, body=None):
    request = Request(url, method=method, data=json.dumps(body).encode() if body is not None else None,
        headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"})
    try:
        with urlopen(request, timeout=90) as response:
            return json.load(response)
    except HTTPError as exc:
        # Azure errors can echo input properties. Surface only the stable code.
        try:
            code = json.load(exc).get("error", {}).get("code", "UNKNOWN")
        except Exception:
            code = "UNKNOWN"
        raise RuntimeError(f"Azure worker request failed: HTTP {exc.code}, {code}") from None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--resource-group", required=True)
    parser.add_argument("--api-name", default="complywise-backend")
    parser.add_argument("--worker-name", default="complywise-assessment-worker")
    parser.add_argument("--environment", required=True)
    parser.add_argument("--release", required=True)
    args = parser.parse_args()
    source = az_json("containerapp", "show", "-g", args.resource_group, "-n", args.api_name)
    environment = az_json("containerapp", "env", "show", "-g", args.resource_group, "-n", args.environment)
    if environment["properties"].get("environmentMode") != "WorkloadProfiles" or environment["properties"].get("provisioningState") != "Succeeded":
        raise RuntimeError("A ready WorkloadProfiles environment is required; Express is unsupported for this worker.")
    token = az_json("account", "get-access-token", "--resource", "https://management.azure.com/")["accessToken"]
    base = "https://management.azure.com"
    version = "?api-version=2026-07-01"
    secret_records = arm("POST", base + source["id"] + "/listSecrets" + version, token)["value"]
    secrets = {item["name"]: item.get("value") for item in secret_records}
    container = source["properties"]["template"]["containers"][0]
    image = container["image"]
    if image.rsplit(":", 1)[-1] not in {"architecture-" + args.release + suffix for suffix in ("", "-workers", "-sync")}:
        raise RuntimeError("Deploy this release to the API before provisioning its matching worker.")
    source_env = {item["name"]: item.get("value", secrets.get(item.get("secretRef"))) for item in container["env"]}
    allowed = {"DJANGO_SECRET_KEY", "DJANGO_DEBUG", "DJANGO_ALLOWED_HOSTS", "CORS_ALLOWED_ORIGINS", "CSRF_TRUSTED_ORIGINS",
               "DATABASE_URL", "DATABASE_CONN_MAX_AGE", "DATABASE_CONN_HEALTH_CHECKS",
               "COMPLYWISE_DEMO_MODE", "COMPLYWISE_VERSION", "ENABLE_PGVECTOR", "CIR_AUTHORITY_KEY", "CIR_SIGNING_KEY_ID",
               "CIR_VERIFICATION_KEYS", "LLM_PROVIDER", "SEARCH_PROVIDER", "LOG_LEVEL", "KNOWLEDGE_PACKS_DIR"}
    allowed.update({"EMBEDDING_PROVIDER", "ASSESSMENT_STRATEGY", "ENABLE_API_ORCHESTRATION",
        "ENABLE_USER_PATH_AUTO_INGEST", "MAX_LLM_CALLS_PER_ASSESSMENT", "MAX_TOTAL_TOKENS_PER_ASSESSMENT",
        "MAX_ESTIMATED_COST_PER_ASSESSMENT", "SEARCH_TIMEOUT_SECONDS", "ACQUISITION_TIMEOUT_SECONDS", "SERP_API"})
    prefixes = ("OPENAI_", "GEMINI_", "GROK_", "SERPAPI_", "FIRECRAWL_", "COMPLIANCERAG_", "DISCOVERY_")
    values = {k: str(v) for k, v in source_env.items() if v is not None and (k in allowed or k.startswith(prefixes))}
    values.update(AUTO_MIGRATE="false", ENABLE_ASSESSMENT_JOBS="true", COMPLYWISE_VERSION=args.release,
                  ASSESSMENT_WORKER_HEALTH_REQUIRED="true", DATABASE_CONN_MAX_AGE="60")
    env, worker_secrets = [], []
    for key, value in sorted(values.items()):
        if not value:
            env.append({"name": key, "value": ""})
            continue  # Azure rejects empty secret values; an unset optional key is not a secret.
        # Stable names avoid rebinding other settings when an optional key is
        # added during a rolling update.
        secret_name = "runtime-" + key.lower().replace("_", "-")
        worker_secrets.append({"name": secret_name, "value": value})
        env.append({"name": key, "secretRef": secret_name})
    registries = source["properties"]["configuration"].get("registries", [])
    for registry in registries:
        if registry.get("passwordSecretRef"):
            name = registry["passwordSecretRef"]
            if not secrets.get(name):
                raise RuntimeError("The existing registry credential could not be resolved.")
            worker_secrets.append({"name": name, "value": secrets[name]})
    body = {"location": environment["location"], "properties": {
        "environmentId": environment["id"], "workloadProfileName": "Consumption",
        "configuration": {"activeRevisionsMode": "Single", "ingress": None,
                          "secrets": worker_secrets, "registries": registries},
        "template": {"containers": [{"name": "assessment-worker", "image": image,
            "command": ["/app/entrypoint.sh"], "args": ["python", "manage.py", "process_assessment_jobs"],
            "env": env, "resources": {"cpu": 0.5, "memory": "1Gi"}}],
            "scale": {"minReplicas": 1, "maxReplicas": 1}, "terminationGracePeriodSeconds": 120}}}
    identifier = source["id"].rsplit("/", 1)[0] + "/" + args.worker_name
    response = arm("PUT", base + identifier + version, token, body)
    print(json.dumps({"worker": args.worker_name, "release": args.release,
        "state": response["properties"].get("provisioningState"), "ingress": False, "replicas": 1}))


if __name__ == "__main__":
    main()
