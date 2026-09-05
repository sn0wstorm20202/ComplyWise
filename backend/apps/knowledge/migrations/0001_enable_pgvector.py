"""Enable the pgvector extension when running on PostgreSQL.

Authority: TRD_v2.0 §4, §66 — semantic retrieval over regulatory text requires
`vector` columns.

Guarded rather than unconditional: the local SQLite fallback cannot provide the
extension, and a migration that hard-fails there would block the whole test suite.
On SQLite this migration is a documented no-op and vector search is genuinely
unavailable — it is not emulated.
"""

from __future__ import annotations

from django.db import migrations


def enable_vector(apps, schema_editor) -> None:  # noqa: ANN001, ARG001
    if schema_editor.connection.vendor != "postgresql":
        return
    # Requires the extension to be available on the server. Supabase ships it.
    schema_editor.execute("CREATE EXTENSION IF NOT EXISTS vector")


def noop_reverse(apps, schema_editor) -> None:  # noqa: ANN001, ARG001
    # Deliberately not dropping the extension: other schemas may depend on it,
    # and a reverse migration must not destroy shared database state.
    return


class Migration(migrations.Migration):
    initial = True

    dependencies: list = []

    operations = [
        migrations.RunPython(enable_vector, noop_reverse),
    ]
