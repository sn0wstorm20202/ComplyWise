"""Domain layer.

Pure business logic that does not depend on Django views or DRF. Split by
TRD_v2.0 §5:

- ``profile``        canonical business-profile variable registry
- ``rules``          rule / AST representation (Task 2)
- ``evaluation``     three-valued evaluation primitives and the evaluator (Task 2)
- ``classification`` product/activity classification and lookup services (Task 3)
- ``provenance``     source -> evidence -> rule -> decision trace helpers (Task 2)

Nothing in this package may contain a regulatory threshold, fee, deadline or
applicability condition. Those are knowledge data.
"""
