"""ComplyWise Demo Mode Subsystem.

Provides isolated, deterministic demo scenario evaluation for high-stakes demos.
Controlled exclusively through DemoScenarioResolver.
Does not touch or modify the core BIS engine, tenant perimeter, or production models.
"""

from .resolver import DemoScenarioResolver

__all__ = ["DemoScenarioResolver"]
