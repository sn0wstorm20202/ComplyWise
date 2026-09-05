"""Businesses

Business entity, membership, and the versioned business profile.

A `Business` is the tenant boundary for every other module: requirements,
documents, workflows, calendar events and assistant context are all scoped to
one business, and access is always resolved from the authenticated user.
"""
