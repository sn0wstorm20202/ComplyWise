"""Reuse pure read projections within one response, never between requests."""
from contextvars import ContextVar
from copy import deepcopy
from functools import wraps
from inspect import signature

_reads = ContextVar("workspace_reads", default=None)


def read_scope(function):
    @wraps(function)
    def wrapped(*args, **kwargs):
        if _reads.get() is not None:
            return function(*args, **kwargs)
        token = _reads.set({})
        try:
            return function(*args, **kwargs)
        finally:
            _reads.reset(token)
    return wrapped


def scoped_projection(function):
    parameters = signature(function)

    @wraps(function)
    def wrapped(*args, **kwargs):
        reads = _reads.get()
        if reads is None:
            return function(*args, **kwargs)
        bound = parameters.bind(*args, **kwargs)
        bound.apply_defaults()
        key = (function, tuple((name, str(value.pk) if hasattr(value, "pk") else str(value))
                               for name, value in bound.arguments.items()))
        if key not in reads:
            reads[key] = deepcopy(function(*args, **kwargs))
        # Callers may enrich their projections without changing another section.
        return deepcopy(reads[key])
    return wrapped


@scoped_projection
def read_assessment(business, assessment_id=None):
    """One tenant-scoped snapshot lookup shared by dashboard sections."""
    assessments = business.assessments.select_related("profile_version", "decision_run")
    if assessment_id:
        return assessments.filter(pk=assessment_id).first()
    return assessments.order_by("-assessment_number").first()
