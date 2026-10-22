"""Read-only acceptance probe. Tokens stay in memory; output contains timings only."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import json
import math
import os
from pathlib import Path
import time
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit


def measure(base, path, token, timeout):
    started = time.perf_counter()
    code = 0
    try:
        request = Request(base + path, headers={"Authorization": "Token " + token})
        with urlopen(request, timeout=timeout) as response:
            response.read()
            code = response.status
    except HTTPError as exc:
        code = exc.code
    except (URLError, TimeoutError, OSError):
        pass
    return {"seconds": round(time.perf_counter() - started, 3), "status": code}


def summarize(samples, budget):
    timings = sorted(s["seconds"] for s in samples)
    p95 = timings[max(0, math.ceil(.95 * len(timings)) - 1)]
    return {"samples": len(samples), "p95_seconds": p95, "max_seconds": max(timings),
            "successes": sum(s["status"] == 200 for s in samples),
            "passed": all(s["status"] == 200 for s in samples) and p95 <= budget["p95_seconds"]
                      and max(timings) <= budget["max_seconds"]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", required=True)
    parser.add_argument("--paths", required=True, help="JSON file mapping budget route names to authenticated read paths")
    parser.add_argument("--output", required=True)
    parser.add_argument("--samples", type=int, default=20)
    args = parser.parse_args()
    base = args.base.rstrip("/")
    parsed = urlsplit(base)
    if parsed.scheme != "https" or parsed.username or parsed.password or parsed.query or parsed.fragment:
        parser.error("Use an HTTPS origin without credentials or query parameters.")
    token = os.environ.get("COMPLYWISE_PROBE_TOKEN", "")
    if not token:
        parser.error("Set COMPLYWISE_PROBE_TOKEN in the environment.")
    config = json.loads(Path(__file__).with_name("read-latency-budget.json").read_text(encoding="utf-8"))
    if not config["minimum_warm_samples"] <= args.samples <= 100:
        parser.error("Use 20–100 samples per read route.")
    paths = json.loads(Path(args.paths).read_text(encoding="utf-8"))
    result = {"budgets": config, "results": {}, "capacity_certified": False}
    for name, path in paths.items():
        if name not in config["routes"] or not path.startswith("/api/v1/") or "//" in path:
            parser.error("Paths must be known read routes on this API origin.")
        cold = measure(base, path, token, config["timeout_seconds"])
        with ThreadPoolExecutor(max_workers=config["concurrency"]) as pool:
            samples = list(pool.map(lambda _: measure(base, path, token, config["timeout_seconds"]), range(args.samples)))
        result["results"][name] = {"first_read": cold, "warm": summarize(samples, config["routes"][name]), "measurements": samples}
    result["passed"] = bool(paths) and all(r["warm"]["passed"] and r["first_read"]["status"] == 200 for r in result["results"].values())
    Path(args.output).write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps({"passed": result["passed"], "routes": {k: v["warm"] for k, v in result["results"].items()}}))
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
