import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { DashboardOverview } from "../components/dashboard/DashboardOverview";
import type { DashboardSummary } from "../types/dashboard";

function fixture(): DashboardSummary {
  return {
    business_id: "synthetic-business", business_name: "Synthetic business", has_evaluation: true,
    profile_version: 1, compliance_readiness: 100,
    metrics: { applicable_count: 24, action_required_count: 27, due_soon_count: 0, benefits_count: null,
      needs_information_count: 2, conflict_review_count: 1, unverified_count: 0, not_applicable_count: 3, total_evaluated: 30 },
    // The API previews only six actions and three standards, even when totals are larger.
    priority_actions: Array.from({ length: 6 }, (_, index) => ({ requirement_id: `req-${index}`,
      requirement_name: "Synthetic requirement", authority: "Synthetic authority", status: "APPLICABLE",
      category: "LICENCE", action_type: "Review", evidence_count: 0 })),
    standards_preview: Array.from({ length: 3 }, () => ({ title: "Synthetic standard", authority: "Synthetic authority" })),
    total_standards_count: 9, total_documents_needed: 40,
    upcoming_deadlines: [], category_breakdown: {}, jurisdiction_breakdown: {}, recent_updates: [], recent_updates_available: false,
    widgets: {
      activity: { weeklyTasks: 5, growthPercentage: "Recorded events", maxTasks: 5,
        daily: [{ day: "Mon", tasks: 5, isHighlight: true, dateStr: "19 Oct" }] },
      documents: { totalCount: 2, onTrackCount: 1, changeThisWeek: "2 uploaded this week", verifiedPercentage: 50, underReviewPercentage: 50 },
      cases: { Overall: { category: "Overall", healthPercentage: 25, compliantCount: 1,
        inProgressCount: 3, overdueCount: 0, inProgressPercentage: 75, overduePercentage: 0 } },
      recent_activity: [],
    },
  };
}

function render(summary: DashboardSummary) {
  const noop = () => {};
  return renderToStaticMarkup(<DashboardOverview summary={summary} onOpenActivity={noop} onOpenDocuments={noop}
    onOpenRequirements={noop} onOpenStandards={noop} onOpenActions={noop} onOpenWorkflows={noop} />);
}

const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

test("all five dashboard cards use full assessment totals, not truncated previews or required-document counts", () => {
  const html = render(fixture());
  const content = text(html);
  for (const heading of ["Workspace activity", "Documents", "Applicable Requirements", "Compliance Actions", "Tracked case status"]) {
    assert.ok(content.includes(heading), `Missing original dashboard card: ${heading}`);
  }
  assert.match(content, /Applicable Requirements 24/);
  assert.match(content, /Standards to explore 9/);
  assert.match(content, /Actions to review: 27/);
  assert.match(content, /3 Needs review/);
  assert.match(content, /Uploaded documents 2 uploaded/);
  assert.match(html, /Recorded workflow events: Mon: 5/);
  assert.doesNotMatch(content, /Certificate:|NABL Verified|High Priority/);
});

test("an unevaluated account shows unknown assessment counts while keeping its operational widgets", () => {
  const summary = fixture();
  summary.has_evaluation = false;
  const content = text(render(summary));
  assert.match(content, /Applicable Requirements — Assessment needed/);
  assert.match(content, /Standards to explore —/);
  assert.match(content, /Actions to review: — Assessment needed/);
  assert.match(content, /Uploaded documents 2 uploaded/);
  assert.doesNotMatch(content, /Applicable Requirements 24|Actions to review: 27|Standards to explore 9/);
});

test("a completed evaluation with zero matches keeps real zeroes and does not borrow sample data", () => {
  const summary = fixture();
  summary.metrics.applicable_count = 0;
  summary.metrics.action_required_count = 0;
  summary.metrics.needs_information_count = 0;
  summary.metrics.conflict_review_count = 0;
  summary.total_standards_count = 0;
  const content = text(render(summary));
  assert.match(content, /Applicable Requirements 0/);
  assert.match(content, /Actions to review: 0/);
  assert.match(content, /Standards to explore 0/);
  assert.doesNotMatch(content, /Assessment needed/);
});
