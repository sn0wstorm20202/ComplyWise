# 02 — RAG REPOSITORY AUDIT
## COMPLETE COMPLIANCERAG SYSTEM & PIPELINE FORENSIC ANALYSIS

**Repository Path:** `E:\complience\ComplianceRag`  
**Git Branch:** `main`  
**HEAD SHA:** `738dc8354203ea73311077e1b3b9ee6e324d3fbb`  
**Remote URL:** `https://github.com/Sadhitra-coder/ComplianceRag.git`  
**Working Tree Status:** Clean  
**Languages:** Python 3.13 / 3.14  
**Frameworks:** Pydantic v2, ChromaDB, Google GenAI SDK (`google.genai`), rank_bm25, BeautifulSoup4, httpx  
**Databases / Stores:** ChromaDB SQLite (`complywise_store/chroma.sqlite3`), Pickled Indices (`cache/bm25_index.pkl`, `cache/metadata_store.pkl`), Flat JSON (`kb/master_kb.json`)  
**Package Managers:** Python pip / virtualenv  
**Deployment Configuration:** NONE (Local CLI execution script `python main.py user_profile.json`)  
**APIs / Web Endpoints:** NONE (Zero FastAPI, Flask, or Django endpoints)  
**Background Workers:** NONE  
**Authentication:** NONE  
**Test Frameworks:** NONE (Only 1 manual probe script `test_encode.py`)  

---

### 1. Repository Architecture & Layout

`ComplianceRag` is designed as a standalone command-line pipeline. It reads a local `user_profile.json`, passes it through a 7-step sequential workflow, and generates static JSON and Markdown reports in an `output/` directory.

```
ComplianceRag/
├── main.py                          # Main CLI pipeline orchestrator (Steps 1–7)
├── complywise/
│   ├── config/
│   │   ├── models.py                # Pydantic data contracts for all stages
│   │   └── settings.py              # Hardcoded paths, model names, API keys
│   ├── normalization/
│   │   ├── gemini_normalizer.py     # Stage 1: Gemini semantic profile expander
│   │   └── deterministic_normalizer.py # Pure rule-based normalizer fallback
│   ├── retrieval/
│   │   ├── indexer.py               # ChromaDB + BM25 indexing engine
│   │   └── hybrid.py                # Hybrid dense+sparse retriever with RRF
│   ├── web/
│   │   └── serp_client.py           # SerpApi Google search & web evidence client
│   ├── analysis/
│   │   ├── evidence_fusion.py       # Deduplication and ranking of KB + Web items
│   │   └── gemini_analyzer.py       # Stage 2: Gemini compliance applicability engine
│   ├── reporting/
│   │   └── report_generator.py      # Markdown & JSON report serialisation
│   └── knowledge_base/
│       ├── taxonomy.yaml            # Sector, activity, and jurisdiction mappings
│       └── taxonomy_loader.py       # Taxonomy resolver & alias expander
├── kb/                              # Raw knowledge assets
│   ├── master_kb.json               # Monolithic 315 KB JSON database of compliances
│   ├── central_laws/                # Markdown files (IGNORED BY INDEXER)
│   ├── cross_reference/             # Form/Penalty matrices (IGNORED BY INDEXER)
│   └── states/                      # State compliance markdown (IGNORED BY INDEXER)
├── cache/                           # Pickled BM25 index & metadata stores
├── complywise_store/                # ChromaDB vector store directory
├── output/                          # Pipeline execution output bundles
└── test_encode.py                   # 19-line manual SentenceTransformer test
```

---

### 2. Systematic Audit of the 24 RAG Components

| # | Component | File | Class / Function | Input | Output | Storage | Dependencies | Current Role |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Ingestion** | `retrieval/indexer.py` | `KBIndexer.build_indices()` | `master_kb.json` path | Populated Chroma & BM25 indices | Disk (`complywise_store/`, `cache/`) | `chromadb`, `pickle` | Batched vector & inverted index builder |
| **2** | **Loaders** | `retrieval/indexer.py` | `flatten_kb()` | `master_kb.json` file | `(documents, metadatas, ids)` | Memory | `json` | Flattens state/sector JSON hierarchy |
| **3** | **Crawlers** | `web/serp_client.py` | `SERPClient._fetch_page()` | Web URL | Clean HTML text | Memory / Cache | `httpx`, `BeautifulSoup` | Single-page HTTP fetcher (NOT a crawler) |
| **4** | **Parsers** | `web/serp_client.py` | `_clean_html()` | Raw HTML string | Plain text & title | Memory | `bs4.BeautifulSoup` | DOM boilerplate removal & text extraction |
| **5** | **Normalization** | `normalization/gemini_normalizer.py` | `GeminiNormalizer.normalize()` | `BusinessProfile` | `NormalizedContext` | Memory | `google.genai` | Expands free-text to canonical sectors |
| **6** | **Chunking** | `retrieval/indexer.py` | `_enrich_chunk()` | Raw compliance JSON dict | Enriched text chunk | Memory | String formatting | 1 compliance item = 1 chunk (no text splitting) |
| **7** | **Metadata Extraction** | `retrieval/indexer.py` | `flatten_kb()` | Compliance dict fields | Metadata dict | Pickled Dict | `json` | Extracts state, sector, category, authority |
| **8** | **Embeddings** | `retrieval/indexer.py` | `_make_embedding_fn()` | Text chunks | Dense vectors | ChromaDB HNSW | `sentence-transformers` (BGE-M3 / MiniLM) | Dense representation generator |
| **9** | **Vector Database** | `retrieval/indexer.py` | `chromadb.PersistentClient` | Embeddings + Metadata | Query results | Disk SQLite / bin | `chromadb` | Cosine similarity HNSW collection |
| **10** | **Keyword / BM25** | `retrieval/hybrid.py` | `BM25Okapi` | Tokenized query | Candidate IDs + scores | Disk (`bm25_index.pkl`) | `rank_bm25` | Sparse exact-match legal retrieval |
| **11** | **Hybrid Retrieval** | `retrieval/hybrid.py` | `HybridRetriever.retrieve()` | `NormalizedContext` | `List[KBEvidenceItem]` | Memory | ChromaDB, BM25 | Dense(50) + Sparse(50) retrieval |
| **12** | **Reranking** | `retrieval/hybrid.py` | `HybridRetriever._rrf_fuse()` | Dense & BM25 rankings | Ranked document list | Memory | Math (`1 / (60 + rank)`) | Reciprocal Rank Fusion (NO cross-encoder) |
| **13** | **Query Rewriting** | `normalization/gemini_normalizer.py` | `GeminiNormalizer` prompt | Business Profile | `retrieval_terms`, `serp_queries` | Memory | `google.genai` | Generates synonyms & search queries |
| **14** | **LLM Usage** | `analysis/gemini_analyzer.py` | `GeminiAnalyzer.analyze()` | Context + EvidenceBundle | `ComplianceAnalysis` | Memory | `google.genai` (`gemini-2.5-flash`) | **Determines legal applicability** |
| **15** | **Answer Generation** | `reporting/report_generator.py` | `ReportGenerator.generate()` | Context, Evidence, Analysis | `FinalReport` (MD/JSON) | Disk (`output/`) | `json`, markdown templates | Renders compliance audit report |
| **16** | **Citation Generation** | `analysis/gemini_analyzer.py` | `_ANALYZER_PROMPT` | Prompt instruction | Evidence citation tags | Markdown | Prompt engineering | Appends `[KB-n]` and `[WEB-n]` to text |
| **17** | **Source Validation** | `web/serp_client.py` | `_domain_authority_score()` | URL domain | Score (0.1–1.0) | Memory | Regex | Scores `.gov.in` = 1.0; blocks reddit/quora |
| **18** | **Caching** | `web/serp_client.py` | `SERPClient` cache | Query hash | Cached SERP JSON | Disk (`cache/serp_cache/`) | `hashlib`, `json` | File-based cache preventing repeat SERP hits |
| **19** | **Persistence** | `reporting/report_generator.py` | `ReportGenerator.save_all()` | All stage artifacts | 7 output files | Disk (`output/<biz>_<ts>/`) | `pathlib.Path` | Saves JSON and Markdown run snapshots |
| **20** | **APIs** | N/A | NONE | N/A | N/A | N/A | None | **ZERO web/HTTP endpoints exist** |
| **21** | **Background Workers** | N/A | NONE | N/A | N/A | N/A | None | **Synchronous execution only** |
| **22** | **Authentication** | N/A | NONE | N/A | N/A | N/A | None | **Zero authentication or multi-tenancy** |
| **23** | **Observability** | `main.py` | `logging.getLogger` | Log statements | Console stdout | Stdout | Python `logging` | Basic console logging with ANSI colors |
| **24** | **Tests** | `test_encode.py` | `test_encode.py` | Sample string array | Vector shape | None | `sentence-transformers` | 19-line manual import probe (no assertions) |

---

### 3. Determination of RAG's Architectural Role

Is ComplianceRag:
- Retrieval only? **NO.**
- Retrieval + synthesis? **NO.**
- Retrieval + legal reasoning? **NO.**
- Retrieval + applicability? **YES.**
- Mixed responsibilities? **YES.**

#### Forensic Proof from Source Code:
In `complywise/analysis/gemini_analyzer.py`:
- Lines 56–58:
  ```python
  _ANALYZER_PROMPT = f"""
  YOUR TASK: Determine which Indian regulatory COMPLIANCES (not schemes) apply to THIS SPECIFIC business.
  """
  ```
- Lines 61–69:
  ```python
  RULE 1 — PROFILE-FIRST FILTERING (most important):
    Before marking anything APPLICABLE, you MUST verify the threshold condition is actually met
    by the numbers/facts in the business profile. If the threshold is NOT clearly met → NEEDS_INFORMATION.
    Examples:
    - EPF: only if employees >= 20 → check actual employee count
    - Factories Act: only if power_hp >= 10 AND physical manufacturing → check both
    - NBFC: only if entity lends its OWN funds OR has 50-50 test met
  ```
- Lines 93–97:
  ```python
  RULE 4 — PRIMARY SOURCES:
    3. You MAY apply professional legal knowledge of well-established Indian statutes
       even without a specific KB chunk — but ONLY if the threshold is clearly met.
  ```

This proves conclusively that **ComplianceRag has assumed the role of the Legal Applicability Engine.** It does not merely retrieve evidence; it delegates the final judicial decision of statutory applicability to the Gemini LLM.

This directly violates the core architectural mandate:
```
RAG RETRIEVES.
RULES DECIDE.
LLM EXPLAINS.
```

---

### 4. Critical Implementation Flaws in ComplianceRag

1. **Complete Absence of Server/API Layer:** ComplianceRag is a CLI script. It cannot be called over HTTP, gRPC, or message queues by ComplyWise.
2. **Markdown Knowledge Assets Ignored:** The repository contains rich legal summaries in `kb/central_laws/` (`fssai_framework.md`, `gst_framework.md`, `labour_codes_2020.md`) and `kb/states/` (`delhi.md`, `gujarat.md`, etc.). However, `KBIndexer.build_indices()` ONLY reads `master_kb.json`. The entire markdown knowledge base is dead code.
3. **No Cross-Encoder Reranker:** While `settings.py` defines `RERANK_TOP_N = 15` and `rag.md` §14 specifies a cross-encoder reranking step, `hybrid.py` simply slices the top-15 items from the RRF list. No cross-encoder model is loaded or executed.
4. **No Automated Testing:** There is zero test coverage. The sole file `test_encode.py` merely verifies that `sentence_transformers` can be imported and encode a test string on Windows without crashing OpenBLAS.
5. **Lack of Tenant / Business Identity:** The data models (`BusinessProfile`, `NormalizedContext`, `FinalReport`) have no concept of `user_id`, `business_id`, `assessment_id`, or `profile_version_id`.
