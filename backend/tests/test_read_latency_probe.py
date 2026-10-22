import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location("probe_read_latency", Path(__file__).resolve().parents[2] / "ops/probe_read_latency.py")
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)


def test_read_budget_does_not_ignore_failed_reads_or_slow_tail():
    budget = {"p95_seconds": 10, "max_seconds": 15}
    samples = [{"seconds": 5, "status": 200} for _ in range(20)]
    assert probe.summarize(samples, budget)["passed"] is True
    samples[0] = {"seconds": .1, "status": 504}
    assert probe.summarize(samples, budget)["passed"] is False
    samples[0] = {"seconds": 16, "status": 200}
    assert probe.summarize(samples, budget)["passed"] is False
