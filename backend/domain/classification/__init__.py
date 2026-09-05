"""Derived and lookup services (TRD_v2.0 §28).

Product/activity classification, standards candidates, trade lookup and
location context. Implemented in Task 3.

These services produce values with `origin = DERIVED` or `LOOKUP` and an
explicit confidence. They are inputs to evaluation, never the final authority,
and they must never overwrite a `USER_PROVIDED` value.
"""
