"""Opt-in real HTTP contract check against the sibling retrieval working copy."""
import os
import sys
import threading
from pathlib import Path

import pytest


@pytest.mark.django_db
def test_core_calls_signed_retrieval_and_preserves_unverified_status(settings, monkeypatch):
    source = os.environ.get("COMPLIANCERAG_SOURCE_DIR")
    if not source:
        pytest.skip("Set COMPLIANCERAG_SOURCE_DIR to run the real HTTP contract check.")
    sys.path.insert(0, str(Path(source).resolve()))
    import importlib.util
    monkeypatch.setenv("COMPLYWISE_DEMO_MODE", "false")
    spec = importlib.util.spec_from_file_location("architecture_rag_contract", Path(source) / "server.py")
    service_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(service_module)
    create_rag_server = service_module.create_rag_server
    from apps.evidence.services.rag_service import ComplianceRagClient, EvidenceSearchQuery
    server = create_rag_server(port=0, api_secret="synthetic-http-integration-key")
    thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
    try:
        service = ComplianceRagClient(base_url=f"http://127.0.0.1:{server.server_address[1]}/v1", api_key="synthetic-http-integration-key")
        hits = service.search_evidence(EvidenceSearchQuery(query="factory", state_code="MAHARASHTRA"))
        assert hits, "The Core must actually call the HTTP service: no local evidence is seeded."
        assert all(hit.verification_status == "UNVERIFIED" for hit in hits)
        assert all(hit.chunk_id.startswith("KB-MH-") for hit in hits)
    finally:
        server.shutdown(); server.server_close(); thread.join()
        sys.path.remove(str(Path(source).resolve()))
