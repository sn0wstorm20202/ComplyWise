"""Pagination that stays inside the `{data, meta}` envelope — TRD_v2.0 §30."""

from __future__ import annotations

from collections import OrderedDict
from typing import Any

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class EnvelopePageNumberPagination(PageNumberPagination):
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data: Any) -> Response:
        return Response(
            OrderedDict(
                [
                    ("data", data),
                    (
                        "meta",
                        OrderedDict(
                            [
                                ("count", self.page.paginator.count),
                                ("page", self.page.number),
                                ("page_size", self.get_page_size(self.request)),
                                ("total_pages", self.page.paginator.num_pages),
                                ("next", self.get_next_link()),
                                ("previous", self.get_previous_link()),
                            ]
                        ),
                    ),
                ]
            )
        )
