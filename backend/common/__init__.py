"""Shared plumbing for the ComplyWise modular monolith.

`common` is deliberately not a Django app. It holds cross-cutting concerns that
every domain app may import: the status vocabulary, abstract model bases, the
API envelope and pagination. It must never contain regulatory knowledge or
domain decisions.
"""
