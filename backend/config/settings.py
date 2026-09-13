"""Django settings for the ComplyWise modular monolith.

Authority: TRD_v2.0 §3 (architecture), §4 (stack), §60 (security), §66 (database).

Everything environment-specific is read from the environment. No secrets in this file.
See `.env.example` at the repository root for the full variable list.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BASE_DIR.parent

# `.env` at the repository root is shared by backend and frontend tooling.
load_dotenv(REPO_ROOT / ".env")
load_dotenv(BASE_DIR / ".env", override=True)

# Domain packages live directly under backend/ (domain/, common/, apps/).
sys.path.insert(0, str(BASE_DIR))


def env_bool(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def env_list(name: str, default: str = "") -> list[str]:
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


# ---------------------------------------------------------------------------
# Core
# ---------------------------------------------------------------------------

DEBUG = env_bool("DJANGO_DEBUG", default=False)
RUNNING_TESTS = "pytest" in sys.modules or "test" in sys.argv
IS_PRODUCTION = not DEBUG and not RUNNING_TESTS
IS_VERCEL = bool(os.getenv("VERCEL") or os.getenv("VERCEL_ENV"))

#: Reported by /health so a deployed instance can be identified unambiguously.
COMPLYWISE_VERSION = os.getenv("COMPLYWISE_VERSION", "0.1.0-foundation")

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "")
if not SECRET_KEY:
    if DEBUG or RUNNING_TESTS or IS_VERCEL:
        # Local convenience and serverless fallback
        SECRET_KEY = "django-insecure-complywise-production-key-v1"
    else:
        raise RuntimeError(
            "DJANGO_SECRET_KEY must be set when DJANGO_DEBUG is false. "
            "See .env.example."
        )

ALLOWED_HOSTS = env_list(
    "DJANGO_ALLOWED_HOSTS",
    "*" if (IS_VERCEL or DEBUG) else "localhost,127.0.0.1,[::1],.vercel.app",
)
if IS_VERCEL or DEBUG or "*" in ALLOWED_HOSTS:
    for host in ["*", ".vercel.app", "now.sh", "localhost", "127.0.0.1"]:
        if host not in ALLOWED_HOSTS:
            ALLOWED_HOSTS.append(host)
else:
    for host in [".vercel.app", "localhost", "127.0.0.1", "[::1]"]:
        if host not in ALLOWED_HOSTS:
            ALLOWED_HOSTS.append(host)

#: The Django admin is an internal knowledge-curation tool (TRD_v2.0 §21), not a
#: public surface. Always on in DEBUG; opt-in elsewhere.
ENABLE_DJANGO_ADMIN = env_bool("ENABLE_DJANGO_ADMIN", default=False)

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "accounts.User"
SILENCED_SYSTEM_CHECKS = ["urls.W005"]

# ---------------------------------------------------------------------------
# Applications — one Django app per TRD_v2.0 §6 domain boundary
# ---------------------------------------------------------------------------

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
]

# Order mirrors the dependency direction: identity -> business -> knowledge ->
# engine -> operational modules -> intelligence -> read aggregation.
COMPLYWISE_APPS = [
    "apps.accounts",
    "apps.businesses",
    "apps.onboarding",
    "apps.knowledge",
    "apps.evidence",
    "apps.applicability",
    "apps.requirements",
    "apps.documents",
    "apps.workflows",
    "apps.calendar",
    "apps.schemes",
    "apps.standards",
    "apps.regulatory_updates",
    "apps.assistant",
    "apps.ingestion",
    "apps.dashboard",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + COMPLYWISE_APPS

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
# Target of record is PostgreSQL (Supabase) with pgvector — TRD_v2.0 §4/§66.
# DATABASE_URL is the single switch. Supabase example:
#   postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
#
# When DATABASE_URL is absent we fall back to a local SQLite file so that a
# developer can run migrations, the test suite and the API without credentials.
# That fallback is explicitly NOT the TRD target: pgvector, vector search and
# Postgres-only constraints are unavailable there and are skipped, not faked.

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

if DATABASE_URL and not (RUNNING_TESTS and not env_bool("FORCE_POSTGRES_TESTS", default=False)):
    is_pooler = ":6543" in DATABASE_URL or "pooler.supabase.com" in DATABASE_URL.lower()
    default_conn_max_age = "0" if is_pooler else "600"
    db_config = dj_database_url.parse(
        DATABASE_URL,
        conn_max_age=int(os.getenv("DATABASE_CONN_MAX_AGE", default_conn_max_age)),
        conn_health_checks=True,
        ssl_require=env_bool("DATABASE_SSL_REQUIRE", default=True),
    )
    options = db_config.setdefault("OPTIONS", {})
    if "supabase" in DATABASE_URL.lower() or is_pooler:
        options.setdefault("sslmode", "require")
    DATABASES = {"default": db_config}
else:
    db_path = BASE_DIR / ".local.sqlite3"
    if os.getenv("VERCEL"):
        import shutil
        tmp_db = Path("/tmp/.local.sqlite3")
        if not tmp_db.exists() and db_path.exists():
            shutil.copy2(db_path, tmp_db)
        if tmp_db.exists():
            db_path = tmp_db

    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": db_path,
        }
    }

DATABASE_IS_POSTGRES = DATABASES["default"]["ENGINE"].endswith(
    ("postgresql", "postgresql_psycopg2")
)

# pgvector is required for the RAG/standards retrieval work in later tasks.
# It can only be enabled on PostgreSQL.
ENABLE_PGVECTOR = DATABASE_IS_POSTGRES and env_bool("ENABLE_PGVECTOR", default=True)

# ---------------------------------------------------------------------------
# Auth / passwords
# ---------------------------------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ---------------------------------------------------------------------------
# REST framework — TRD_v2.0 §30 API standards
# ---------------------------------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "common.authentication.SafeTokenAuthentication",
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "common.envelope.EnvelopeJSONRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.MultiPartParser",
        "rest_framework.parsers.FormParser",
    ],
    "DEFAULT_PAGINATION_CLASS": "common.pagination.EnvelopePageNumberPagination",
    "PAGE_SIZE": 25,
    "EXCEPTION_HANDLER": "common.envelope.envelope_exception_handler",
    "TEST_REQUEST_DEFAULT_FORMAT": "json",
    "UNAUTHENTICATED_USER": "django.contrib.auth.models.AnonymousUser",
}

# ---------------------------------------------------------------------------
# CORS & CSRF — environment-driven frontend allowlist (Authority: Milestone CORS Task)
# ---------------------------------------------------------------------------
from config.cors import (
    CORS_ALLOW_HEADERS,
    CORS_ALLOW_METHODS,
    CORS_EXPOSE_HEADERS,
    get_cors_allowed_origins,
    get_csrf_trusted_origins,
)
CORS_ALLOW_ALL_ORIGINS = bool(DEBUG or IS_VERCEL)
CORS_ALLOWED_ORIGINS = get_cors_allowed_origins(
    is_production=IS_PRODUCTION,
    allow_localhost_in_prod=env_bool("CORS_ALLOW_LOCALHOST_IN_PRODUCTION", default=False),
)
# Ensure extra Vercel domains and staging domains are preserved
for extra_origin in env_list("CORS_ALLOWED_ORIGINS", ""):
    if extra_origin and extra_origin not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(extra_origin)

if "https://frontend-woad-eight-18.vercel.app" not in CORS_ALLOWED_ORIGINS:
    CORS_ALLOWED_ORIGINS.append("https://frontend-woad-eight-18.vercel.app")

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = CORS_ALLOW_METHODS
CORS_ALLOW_HEADERS = CORS_ALLOW_HEADERS
CORS_EXPOSE_HEADERS = CORS_EXPOSE_HEADERS
CORS_PREFLIGHT_MAX_AGE = 86400

CSRF_TRUSTED_ORIGINS = get_csrf_trusted_origins(
    cors_origins=CORS_ALLOWED_ORIGINS,
    is_production=IS_PRODUCTION,
    allow_localhost_in_prod=env_bool("CORS_ALLOW_LOCALHOST_IN_PRODUCTION", default=False),
)
for vercel_csrf in [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://*.vercel.app",
    "https://*.now.sh",
    "https://frontend-woad-eight-18.vercel.app",
]:
    if vercel_csrf not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(vercel_csrf)

# ---------------------------------------------------------------------------
# i18n / static
# ---------------------------------------------------------------------------

LANGUAGE_CODE = "en-in"
TIME_ZONE = "UTC"  # TRD_v2.0 §67: store UTC, present in business timezone.
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# ---------------------------------------------------------------------------
# Document storage — TRD_v2.0 §35. Private object storage only.
# ---------------------------------------------------------------------------

AZURE_STORAGE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "")
AZURE_STORAGE_CONTAINER = os.getenv("AZURE_STORAGE_CONTAINER", "complywise-documents")
DOCUMENT_MAX_UPLOAD_BYTES = int(os.getenv("DOCUMENT_MAX_UPLOAD_BYTES", str(20 * 1024 * 1024)))

# ---------------------------------------------------------------------------
# AI providers — accessed only through the provider interfaces in TRD_v2.0 §4
# (`domain.providers`). Model names are configuration, never hardcoded in domain
# code, and no provider participates in an applicability decision.
#
# Keys are all optional and independent: a deployment configures the provider it
# selects and leaves the others unset. `domain.providers.registry` reports an
# unconfigured provider as "not_configured" rather than failing at import.
# ---------------------------------------------------------------------------

#: Active provider for text generation: gemini | openai | grok.
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai")
#: Active provider for embeddings: gemini | openai. (xAI has no embeddings API.)
EMBEDDING_PROVIDER = os.getenv("EMBEDDING_PROVIDER", "openai")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
# Defaults must be models a freshly-issued AI Studio key can actually call
# (verified live 2026-03: gemini-2.5-pro/gemini-2.5-flash answer HTTP 404 for new
# accounts and text-embedding-004 is retired; gemini-3.1-flash-lite and
# gemini-embedding-001 respond). Any available model name may be set in .env.
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
GEMINI_EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")

GROK_API_KEY = os.getenv("GROK_API_KEY", "")
GROK_MODEL = os.getenv("GROK_MODEL", "grok-4")

# Server-side only. Never sent to the frontend and never included in an API
# response: this key is billable and grants crawling on our account (§13).
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY", "")

# Discovery orchestration bounds (apps/ingestion). Discovery is OPTIONAL: without
# a key the app runs in knowledge-only mode and reports discovery as unavailable.
# Query contents come from the business's own profile variables; the trusted-host
# suffix list is a retrieval policy (which domains are acceptable to crawl), not
# regulatory content.
DISCOVERY_MAX_QUERIES = int(os.getenv("DISCOVERY_MAX_QUERIES", "4"))
DISCOVERY_MAX_SOURCES_PER_RUN = int(os.getenv("DISCOVERY_MAX_SOURCES_PER_RUN", "6"))
DISCOVERY_TRUSTED_HOST_SUFFIXES = env_list(
    "DISCOVERY_TRUSTED_HOST_SUFFIXES", default=".gov.in,.nic.in,.gov"
)

# ---------------------------------------------------------------------------
# Knowledge layer
# ---------------------------------------------------------------------------

KNOWLEDGE_PACKS_DIR = Path(os.getenv("KNOWLEDGE_PACKS_DIR", BASE_DIR / "knowledge_packs"))

# Window used by "upcoming deadlines" counters so that the dashboard and the
# initial results screen cannot disagree (PRD_v2.0 §13).
UPCOMING_DEADLINE_WINDOW_DAYS = int(os.getenv("UPCOMING_DEADLINE_WINDOW_DAYS", "30"))

# ---------------------------------------------------------------------------
# Compliance Deadline Notifications (Google Calendar & Email)
# ---------------------------------------------------------------------------
GOOGLE_CALENDAR_CLIENT_ID = os.getenv("GOOGLE_CALENDAR_CLIENT_ID", "").strip()
GOOGLE_CALENDAR_CLIENT_SECRET = os.getenv("GOOGLE_CALENDAR_CLIENT_SECRET", "").strip()
GOOGLE_CALENDAR_REFRESH_TOKEN = os.getenv("GOOGLE_CALENDAR_REFRESH_TOKEN", "").strip()
GOOGLE_CALENDAR_ACCESS_TOKEN = os.getenv("GOOGLE_CALENDAR_ACCESS_TOKEN", "").strip()

_email_backend_env = os.getenv("DJANGO_EMAIL_BACKEND", "").strip()
if _email_backend_env:
    # Always respect an explicitly configured backend (e.g. SMTP even in dev/debug).
    EMAIL_BACKEND = _email_backend_env
elif DEBUG or RUNNING_TESTS:
    # No explicit override: default to console in dev so emails don't silently vanish.
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
else:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"

EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", default=True)
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "compliance-alerts@complywise.in")


# ---------------------------------------------------------------------------
# Security hardening (active whenever DEBUG is off)
# ---------------------------------------------------------------------------

if not DEBUG and not RUNNING_TESTS:
    SECURE_SSL_REDIRECT = env_bool("DJANGO_SECURE_SSL_REDIRECT", default=True)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = int(os.getenv("DJANGO_SECURE_HSTS_SECONDS", "31536000"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

X_FRAME_OPTIONS = "DENY"

# ---------------------------------------------------------------------------
# Logging — TRD_v2.0 §62: never log secrets or raw document contents.
# ---------------------------------------------------------------------------

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {"format": "%(asctime)s %(levelname)s %(name)s %(message)s"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "standard"},
    },
    "root": {"handlers": ["console"], "level": os.getenv("LOG_LEVEL", "INFO")},
    "loggers": {
        "django.db.backends": {"level": "WARNING", "handlers": ["console"], "propagate": False},
        "complywise": {"level": os.getenv("LOG_LEVEL", "INFO"), "handlers": ["console"], "propagate": False},
    },
}
