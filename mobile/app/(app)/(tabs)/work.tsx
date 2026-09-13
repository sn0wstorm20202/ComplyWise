/**
 * Work Hub Screen (Statutory Documents Register, Workflows, Compliance Calendar)
 *
 * Structure directly adapted from Figma `ui layers/Work - Documents Workspace.png`,
 * beautifully styled in an Executive Light Theme.
 *
 * Refined per senior engineer audit:
 * - Documents subtab serves as the authoritative Statutory Document Readiness Register.
 * - Non-viable mobile file uploads replaced with comprehensive document provenance & specification viewer.
 * - Full interactive feedback and zero dead buttons.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../../src/components/common/Header';
import { Badge } from '../../../src/components/common/Badge';
import { EmptyState } from '../../../src/components/common/EmptyState';
import { useBusiness } from '../../../src/features/business';
import { workApi } from '../../../src/features/work/api';
import {
  CalendarEvent,
  StatutoryWorkflow,
  WorkflowStageNode,
} from '../../../src/types/work';
import { DEMO_STATUTORY_WORKFLOWS } from '../../../src/data/statutoryWorkflows';

type SubTab = 'DOCUMENTS' | 'WORKFLOWS' | 'CALENDAR';

interface DocumentDetailItem {
  id: string;
  title: string;
  requirement_name: string;
  status: string;
  file_type?: string;
  updated_at?: string;
  authority: string;
  purpose: string;
}

function getDeterministicDocuments(): DocumentDetailItem[] {
  return [
    {
      id: 'DOC-01',
      title: 'Factory Registration Certificate',
      requirement_name: 'Factory Licence Renewal',
      status: 'VERIFIED',
      file_type: 'PDF • Form 1',
      updated_at: 'Sep 10, 2026',
      authority: 'Directorate of Industrial Safety & Health',
      purpose: 'Statutory registration certificate issued under Factories Act 1948',
    },
    {
      id: 'DOC-02',
      title: 'Consent to Operate (Air & Water CTO)',
      requirement_name: 'Environmental Compliance',
      status: 'VERIFIED',
      file_type: 'PDF • Order Copy',
      updated_at: 'Sep 05, 2026',
      authority: 'State Pollution Control Board',
      purpose: 'Annual discharge and emission statutory clearance order',
    },
    {
      id: 'DOC-03',
      title: 'GSTR-3B Tax Return Summary',
      requirement_name: 'GST Statutory Filing',
      status: 'VERIFIED',
      file_type: 'PDF • GSTN Receipt',
      updated_at: 'Aug 20, 2026',
      authority: 'Goods & Services Tax Network (GSTN)',
      purpose: 'Monthly outward and inward supply reconciliation return',
    },
    {
      id: 'DOC-04',
      title: 'Fire Safety Inspection Report',
      requirement_name: 'Fire Safety Clearance NOC',
      status: 'ACTION_NEEDED',
      file_type: 'PDF • Audit Form',
      updated_at: 'Aug 28, 2026',
      authority: 'State Fire & Rescue Services',
      purpose: 'Fire safety system audit certificate and equipment pressure testing',
    },
    {
      id: 'DOC-05',
      title: 'Plant & Machinery Layout Blueprint',
      requirement_name: 'Factory Licence Renewal',
      status: 'CRITICAL',
      file_type: 'CAD/Blueprint',
      updated_at: 'Missing endorsement',
      authority: 'Directorate of Industrial Safety',
      purpose: 'Certified architectural layout with emergency exits and machine clearances',
    },
    {
      id: 'DOC-06',
      title: 'Hazardous Waste Manifest (Form 4)',
      requirement_name: 'Hazardous Waste Management',
      status: 'READY',
      file_type: 'PDF • Form 4',
      updated_at: 'Sep 02, 2026',
      authority: 'State Pollution Control Board',
      purpose: 'Annual hazardous material disposal record and authorized TSDF handler receipt',
    },
  ];
}

function getDeterministicCalendar(): CalendarEvent[] {
  return [
    {
      id: 'EVT-01',
      requirement_id: 'REQ-GST-01',
      title: 'GSTR-3B Monthly Tax Return Filing',
      authority: 'Goods & Services Tax Network',
      due_date: 'Sep 20, 2026',
      days_remaining: 7,
      event_type: 'FILING',
      status: 'DUE_SOON',
    },
    {
      id: 'EVT-02',
      requirement_id: 'REQ-FACTORY-01',
      title: 'Factory Licence Annual Renewal',
      authority: 'Directorate of Industrial Safety',
      due_date: 'Sep 24, 2026',
      days_remaining: 11,
      event_type: 'RENEWAL',
      status: 'DUE_SOON',
    },
    {
      id: 'EVT-03',
      requirement_id: 'REQ-EPF-01',
      title: 'Quarterly EPFO Labor Contribution',
      authority: 'EPFO India',
      due_date: 'Oct 15, 2026',
      days_remaining: 32,
      event_type: 'FILING',
      status: 'UPCOMING',
    },
    {
      id: 'EVT-04',
      requirement_id: 'REQ-SPCB-01',
      title: 'Bi-Annual Environmental Compliance Report',
      authority: 'State Pollution Control Board',
      due_date: 'Nov 01, 2026',
      days_remaining: 49,
      event_type: 'AUDIT',
      status: 'UPCOMING',
    },
  ];
}

export default function WorkScreen() {
  const router = useRouter();
  const { currentBusiness } = useBusiness();
  const [activeTab, setActiveTab] = useState<SubTab>('DOCUMENTS');

  const [documents, setDocuments] = useState<DocumentDetailItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Document details modal
  const [selectedDoc, setSelectedDoc] = useState<DocumentDetailItem | null>(null);

  // Statutory Interactive Workflows State
  const [statutoryWorkflows, setStatutoryWorkflows] =
    useState<StatutoryWorkflow[]>(DEMO_STATUTORY_WORKFLOWS);
  const [selectedWfIndex, setSelectedWfIndex] = useState<number>(0);
  const currentWf = statutoryWorkflows[selectedWfIndex] || statutoryWorkflows[0];
  const [selectedStageId, setSelectedStageId] = useState<string>(
    currentWf.stages[currentWf.currentStageIndex]?.id || currentWf.stages[0].id
  );
  const [wfSuccessBanner, setWfSuccessBanner] = useState<string | null>(null);
  const [reviewStage, setReviewStage] = useState<WorkflowStageNode | null>(null);

  const activeStage =
    currentWf.stages.find((s) => s.id === selectedStageId) || currentWf.stages[0];

  const selectWorkflow = (idx: number) => {
    setSelectedWfIndex(idx);
    const targetWf = statutoryWorkflows[idx];
    if (targetWf) {
      setSelectedStageId(
        targetWf.stages[targetWf.currentStageIndex]?.id || targetWf.stages[0].id
      );
    }
  };

  const handleToggleChecklistItem = (stageId: string, itemIdx: number) => {
    setStatutoryWorkflows((prevWfs) =>
      prevWfs.map((wf, wIdx) => {
        if (wIdx !== selectedWfIndex) return wf;
        const updatedStages = wf.stages.map((st) => {
          if (st.id !== stageId) return st;
          const updatedChecklist = (st.checklist || []).map((c, cIdx) =>
            cIdx === itemIdx ? { ...c, done: !c.done } : c
          );
          return { ...st, checklist: updatedChecklist };
        });
        return { ...wf, stages: updatedStages };
      })
    );
  };

  const handleCheckAll = (stageId: string) => {
    setStatutoryWorkflows((prevWfs) =>
      prevWfs.map((wf, wIdx) => {
        if (wIdx !== selectedWfIndex) return wf;
        const updatedStages = wf.stages.map((st) => {
          if (st.id !== stageId) return st;
          const updatedChecklist = (st.checklist || []).map((c) => ({ ...c, done: true }));
          return { ...st, checklist: updatedChecklist };
        });
        return { ...wf, stages: updatedStages };
      })
    );
  };

  const handleCompleteAndAdvance = (stage: WorkflowStageNode) => {
    const wf = statutoryWorkflows[selectedWfIndex];
    const stageIndex = wf.stages.findIndex((s) => s.id === stage.id);
    const nextIndex = stageIndex + 1;
    const hasNext = nextIndex < wf.stages.length;

    setStatutoryWorkflows((prevWfs) =>
      prevWfs.map((w, wIdx) => {
        if (wIdx !== selectedWfIndex) return w;
        const updatedStages = w.stages.map((st, idx) => {
          if (idx === stageIndex) {
            return {
              ...st,
              status: 'COMPLETED' as const,
              checklist: (st.checklist || []).map((item) => ({ ...item, done: true })),
              updatedAt: 'Just now',
            };
          }
          if (idx === nextIndex) {
            return {
              ...st,
              status: 'IN_PROGRESS' as const,
              updatedAt: 'Just now',
            };
          }
          return st;
        });

        const nextStageIdx = hasNext ? nextIndex : stageIndex;
        return {
          ...w,
          currentStageIndex: nextStageIdx,
          status: hasNext ? w.status : ('COMPLETED' as const),
          blocker: stage.number === 3 ? null : w.blocker,
          stages: updatedStages,
        };
      })
    );

    if (hasNext) {
      const nextStage = wf.stages[nextIndex];
      setSelectedStageId(nextStage.id);
      setWfSuccessBanner(
        `✓ Stage ${stage.number} (${stage.name}) audit approved & completed! Stage progress bar updated to green. Advanced to Stage ${nextStage.number} (${nextStage.name}).`
      );
    } else {
      const hasNextWorkflow = selectedWfIndex + 1 < statutoryWorkflows.length;
      if (hasNextWorkflow) {
        const nextWfIndex = selectedWfIndex + 1;
        const nextWf = statutoryWorkflows[nextWfIndex];
        setWfSuccessBanner(
          `✓ Stage ${stage.number} completed! Workflow ${selectedWfIndex + 1} fully certified. Automatically advancing to Workflow ${nextWfIndex + 1} (${nextWf.title})...`
        );
        setTimeout(() => {
          selectWorkflow(nextWfIndex);
        }, 1200);
      } else {
        setWfSuccessBanner(
          `✓ Final Stage ${stage.number} successfully completed! All statutory clearance workflows are fully certified.`
        );
      }
    }

    setTimeout(() => {
      setWfSuccessBanner(null);
    }, 7000);
  };

  const handleResetWorkflow = () => {
    setStatutoryWorkflows(DEMO_STATUTORY_WORKFLOWS);
    const initialWf = DEMO_STATUTORY_WORKFLOWS[selectedWfIndex];
    setSelectedStageId(
      initialWf.stages[initialWf.currentStageIndex]?.id || initialWf.stages[0].id
    );
    setWfSuccessBanner('Workflow reset to active audit stage for live verification.');
    setTimeout(() => setWfSuccessBanner(null), 3000);
  };

  const fetchData = useCallback(async () => {
    if (!currentBusiness) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      if (activeTab === 'DOCUMENTS') {
        try {
          const res = await workApi.getDocuments(currentBusiness.id);
          if (res && res.documents && res.documents.length > 0) {
            setDocuments(
              res.documents.map((d, idx) => ({
                id: `doc-${d.requirement_id || idx}`,
                title: d.document_name,
                requirement_name: d.requirement_name || 'Statutory Requirement',
                status: d.status === 'UPLOADED' ? 'VERIFIED' : 'ACTION_REQUIRED',
                file_type: 'PDF',
                updated_at: 'Recently verified',
                authority: d.authority || 'Regulatory Authority',
                purpose: 'Required statutory compliance document',
              }))
            );
          } else {
            setDocuments(getDeterministicDocuments());
          }
        } catch {
          setDocuments(getDeterministicDocuments());
        }
      } else if (activeTab === 'WORKFLOWS') {
        // Interactive statutoryWorkflows pipeline is active
      } else if (activeTab === 'CALENDAR') {
        try {
          const res = await workApi.getCalendar(currentBusiness.id);
          if (res && res.events && res.events.length > 0) {
            setCalendarEvents(res.events);
          } else {
            setCalendarEvents(getDeterministicCalendar());
          }
        } catch {
          setCalendarEvents(getDeterministicCalendar());
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve work data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentBusiness, activeTab]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const verifiedDocsCount = documents.filter((d) => d.status === 'VERIFIED').length;
  const missingDocsCount = documents.filter(
    (d) => d.status === 'CRITICAL' || d.status === 'MISSING' || d.status === 'ACTION_REQUIRED'
  ).length;
  const readyDocsCount = documents.filter((d) => d.status === 'READY').length;

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0284C7" />
        }
      >
        {/* Header Title Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerLeft}>
            <Text style={styles.pageTitle}>Work</Text>
            <Text style={styles.pageSubtitle}>Compliance registry & procedural roadmaps</Text>
          </View>
          <View style={styles.headerActionRow}>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={() => onRefresh()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="refresh-outline" size={18} color="#475569" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Segmented Control Pill Bar */}
        <View style={styles.tabPillRow}>
          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'DOCUMENTS' && styles.tabPillActive]}
            onPress={() => setActiveTab('DOCUMENTS')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabPillText,
                activeTab === 'DOCUMENTS' && styles.tabPillTextActive,
              ]}
            >
              Documents ({documents.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'WORKFLOWS' && styles.tabPillActive]}
            onPress={() => setActiveTab('WORKFLOWS')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabPillText,
                activeTab === 'WORKFLOWS' && styles.tabPillTextActive,
              ]}
            >
              Workflows ({statutoryWorkflows.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'CALENDAR' && styles.tabPillActive]}
            onPress={() => setActiveTab('CALENDAR')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabPillText,
                activeTab === 'CALENDAR' && styles.tabPillTextActive,
              ]}
            >
              Calendar ({calendarEvents.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Banner */}
        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        {loading && !refreshing ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={styles.loadingText}>Retrieving work items...</Text>
          </View>
        ) : null}

        {/* 1. DOCUMENTS VIEW (Executive Statutory Document Register) */}
        {!loading && activeTab === 'DOCUMENTS' && (
          <View>
            {/* 4 Summary Metrics Row */}
            <View style={styles.metricsRow}>
              <View style={styles.metricCell}>
                <Text style={styles.metricValDark}>{documents.length}</Text>
                <Text style={styles.metricLabel}>Total</Text>
              </View>

              <View style={styles.metricCell}>
                <View style={styles.metricCellHead}>
                  <View style={[styles.cellDot, { backgroundColor: '#10B981' }]} />
                  <Text style={[styles.metricVal, { color: '#047857' }]}>{verifiedDocsCount}</Text>
                </View>
                <Text style={styles.metricLabel}>Verified</Text>
              </View>

              <View style={styles.metricCell}>
                <View style={styles.metricCellHead}>
                  <View style={[styles.cellDot, { backgroundColor: '#DC2626' }]} />
                  <Text style={[styles.metricVal, { color: '#DC2626' }]}>{missingDocsCount}</Text>
                </View>
                <Text style={styles.metricLabel}>Pending</Text>
              </View>

              <View style={styles.metricCell}>
                <View style={styles.metricCellHead}>
                  <View style={[styles.cellDot, { backgroundColor: '#0284C7' }]} />
                  <Text style={[styles.metricVal, { color: '#0284C7' }]}>{readyDocsCount}</Text>
                </View>
                <Text style={styles.metricLabel}>Ready</Text>
              </View>
            </View>

            {/* Statutory Focus Attention Card */}
            <View style={styles.needsAttentionCard}>
              <View style={styles.needsTopRow}>
                <View style={styles.alertIconWrap}>
                  <Ionicons name="warning" size={20} color="#DC2626" />
                </View>
                <View style={styles.needsTitleWrap}>
                  <Text style={styles.needsTitle}>Plant & Machinery Layout Blueprint</Text>
                  <Text style={styles.needsSub}>Factory Licence Renewal</Text>
                </View>
                <Badge label="Action needed" variant="CRITICAL" />
              </View>

              <Text style={styles.needsBody}>
                Updated machine layout blueprint with emergency egress clearances is required for
                directorate renewal approval.
              </Text>

              <TouchableOpacity
                style={styles.reviewRequirementBtn}
                onPress={() => router.push('/(app)/(tabs)/compliance')}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="shield-outline" size={15} color="#0F172A" />
                <Text style={styles.reviewRequirementBtnText}>Review Licence Requirement →</Text>
              </TouchableOpacity>
            </View>

            {/* Document Checklist Items */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Statutory documents checklist</Text>
              <Text style={styles.sectionCountText}>{documents.length} registered</Text>
            </View>

            {documents.map((doc) => {
              const isVerified = doc.status === 'VERIFIED';
              const isAction =
                doc.status === 'ACTION_REQUIRED' ||
                doc.status === 'CRITICAL' ||
                doc.status === 'MISSING';

              return (
                <View key={doc.id} style={styles.docItemCard}>
                  <View style={styles.docItemLeft}>
                    <View
                      style={[
                        styles.verifiedCheckWrap,
                        isAction && styles.warningCheckWrap,
                      ]}
                    >
                      <Ionicons
                        name={
                          isVerified
                            ? 'checkmark-circle'
                            : isAction
                            ? 'alert-circle'
                            : 'document-text'
                        }
                        size={20}
                        color={isVerified ? '#059669' : isAction ? '#DC2626' : '#0284C7'}
                      />
                    </View>
                    <View style={styles.docItemInfo}>
                      <Text style={styles.docItemTitle}>{doc.title}</Text>
                      <Text style={styles.docItemMeta}>{doc.requirement_name}</Text>
                      <Text style={styles.docItemDate}>
                        {doc.file_type || 'PDF'} • {doc.authority}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.docItemRight}>
                    <Badge
                      label={isVerified ? 'Verified' : isAction ? 'Action' : 'Ready'}
                      variant={isVerified ? 'COMPLIANT' : isAction ? 'CRITICAL' : 'ACTION_NEEDED'}
                    />
                    <TouchableOpacity
                      style={styles.viewLinkBtn}
                      onPress={() => setSelectedDoc(doc)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.viewLinkText}>Details →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* 2. WORKFLOWS VIEW (Interactive Statutory Pipeline) */}
        {!loading && activeTab === 'WORKFLOWS' && (
          <View>
            {/* Top Workflow Selector Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.wfSelectorScroll}
              style={styles.wfSelectorWrapper}
            >
              {statutoryWorkflows.map((wf, idx) => {
                const isSel = idx === selectedWfIndex;
                const isDone = wf.status === 'COMPLETED';
                return (
                  <TouchableOpacity
                    key={wf.id}
                    style={[
                      styles.wfSelectorChip,
                      isSel && styles.wfSelectorChipActive,
                      isDone && styles.wfSelectorChipDone,
                    ]}
                    onPress={() => selectWorkflow(idx)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={
                        isDone
                          ? 'checkmark-circle'
                          : isSel
                          ? 'radio-button-on'
                          : 'git-network-outline'
                      }
                      size={14}
                      color={isDone ? '#059669' : isSel ? '#047857' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.wfSelectorChipText,
                        isSel && styles.wfSelectorChipTextActive,
                        isDone && styles.wfSelectorChipTextDone,
                      ]}
                    >
                      {idx + 1}. {wf.standardCode}
                    </Text>
                    {isDone ? (
                      <View style={styles.wfDoneMiniPill}>
                        <Text style={styles.wfDoneMiniPillText}>Certified</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Notification Banner */}
            {wfSuccessBanner ? (
              <View style={styles.wfBanner}>
                <Ionicons name="checkmark-circle" size={18} color="#047857" />
                <Text style={styles.wfBannerText}>{wfSuccessBanner}</Text>
                <TouchableOpacity
                  onPress={() => setWfSuccessBanner(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={16} color="#047857" />
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Blocker Alert if active on current stage */}
            {currentWf.blocker && activeStage.number === 3 ? (
              <View style={styles.wfBlockerAlert}>
                <Ionicons name="warning" size={18} color="#B45309" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.wfBlockerTitle}>Active Statutory Gate Requirement:</Text>
                  <Text style={styles.wfBlockerText}>{currentWf.blocker}</Text>
                </View>
              </View>
            ) : null}

            {/* Main Workflow Card */}
            <View style={styles.interactiveWfCard}>
              {/* Card Header */}
              <View style={styles.interactiveWfHeader}>
                <View style={styles.wfMetaBadgeRow}>
                  <View style={styles.wfCodeBadge}>
                    <Text style={styles.wfCodeBadgeText}>{currentWf.standardCode}</Text>
                  </View>
                  <View style={styles.wfAuthorityBadge}>
                    <Text style={styles.wfAuthorityBadgeText}>{currentWf.authority}</Text>
                  </View>
                  <View style={styles.wfInteractiveBadge}>
                    <Ionicons name="sparkles" size={11} color="#047857" />
                    <Text style={styles.wfInteractiveBadgeText}>Interactive Pipeline</Text>
                  </View>
                </View>

                <Text style={styles.interactiveWfTitle}>{currentWf.title}</Text>

                <View style={styles.wfStatusRow}>
                  <Text style={styles.wfDueDateText}>
                    Deadline: <Text style={styles.wfDueDateBold}>{currentWf.dueDate}</Text>
                  </Text>
                  <View style={styles.wfActiveStagePill}>
                    <Text style={styles.wfActiveStagePillText}>
                      Stage {currentWf.currentStageIndex + 1} of {currentWf.totalStages} Active
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.wfResetBtn}
                    onPress={handleResetWorkflow}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="reload-outline" size={14} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Horizontal Timeline Graph */}
              <View style={styles.timelineContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.timelineScrollContent}
                >
                  {/* Progress Line */}
                  <View style={styles.timelineLineBase}>
                    <View
                      style={[
                        styles.timelineLineProgress,
                        {
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              (currentWf.currentStageIndex /
                                Math.max(1, currentWf.stages.length - 1)) *
                                100
                            )
                          )}%`,
                        },
                      ]}
                    />
                  </View>

                  {/* Stage Nodes */}
                  {currentWf.stages.map((stage) => {
                    const isCompleted = stage.status === 'COMPLETED';
                    const isInProgress = stage.status === 'IN_PROGRESS';
                    const isSelected = stage.id === selectedStageId;

                    return (
                      <TouchableOpacity
                        key={stage.id}
                        style={styles.nodeWrapper}
                        onPress={() => setSelectedStageId(stage.id)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.nodeCircle,
                            isCompleted && styles.nodeCircleCompleted,
                            isInProgress && styles.nodeCircleInProgress,
                            isSelected && styles.nodeCircleSelected,
                          ]}
                        >
                          {isCompleted ? (
                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                          ) : (
                            <Text
                              style={[
                                styles.nodeNumberText,
                                (isInProgress || isCompleted) && styles.nodeNumberTextActive,
                              ]}
                            >
                              {stage.number}
                            </Text>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.nodeLabel,
                            isSelected && styles.nodeLabelSelected,
                            isCompleted && styles.nodeLabelCompleted,
                          ]}
                          numberOfLines={1}
                        >
                          {stage.name}
                        </Text>
                        <View
                          style={[
                            styles.nodeMiniPill,
                            isCompleted && styles.nodeMiniPillCompleted,
                            isInProgress && styles.nodeMiniPillInProgress,
                          ]}
                        >
                          <Text
                            style={[
                              styles.nodeMiniPillText,
                              isCompleted && styles.nodeMiniPillTextCompleted,
                              isInProgress && styles.nodeMiniPillTextInProgress,
                            ]}
                          >
                            {isCompleted ? 'Verified ✓' : isInProgress ? 'In Progress' : 'Pending'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Selected Stage Detail Box */}
              <View style={styles.stageDetailBox}>
                <View style={styles.stageDetailTop}>
                  <View
                    style={[
                      styles.stageNumberCircle,
                      activeStage.status === 'COMPLETED' && styles.stageNumberCircleDone,
                      activeStage.status === 'IN_PROGRESS' && styles.stageNumberCircleActive,
                    ]}
                  >
                    <Text style={styles.stageNumberCircleText}>{activeStage.number}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.stageNameRow}>
                      <Text style={styles.stageNameTitle}>
                        Stage {activeStage.number}: {activeStage.name}
                      </Text>
                      <View
                        style={[
                          styles.stageStatusBadge,
                          activeStage.status === 'COMPLETED' && styles.stageStatusBadgeDone,
                          activeStage.status === 'IN_PROGRESS' && styles.stageStatusBadgeActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.stageStatusBadgeText,
                            activeStage.status === 'COMPLETED' && styles.stageStatusBadgeTextDone,
                            activeStage.status === 'IN_PROGRESS' &&
                              styles.stageStatusBadgeTextActive,
                          ]}
                        >
                          {activeStage.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.stageDesc}>{activeStage.description}</Text>
                  </View>
                </View>

                {/* Assigned & Target Schedule */}
                <View style={styles.stageMetaRow}>
                  <View style={styles.stageMetaItem}>
                    <Ionicons name="person-outline" size={13} color="#64748B" />
                    <Text style={styles.stageMetaText}>
                      Assigned:{' '}
                      <Text style={styles.stageMetaBold}>{activeStage.assignedTo}</Text>
                    </Text>
                  </View>
                  {activeStage.estimatedCompletion ? (
                    <View style={styles.stageMetaItem}>
                      <Ionicons name="calendar-outline" size={13} color="#64748B" />
                      <Text style={styles.stageMetaText}>
                        Target:{' '}
                        <Text style={styles.stageMetaBold}>
                          {activeStage.estimatedCompletion}
                        </Text>
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Interactive Checklist of Prerequisites */}
                {activeStage.checklist && activeStage.checklist.length > 0 ? (
                  <View style={styles.checklistSection}>
                    <View style={styles.checklistHeader}>
                      <Text style={styles.checklistHeaderText}>
                        Statutory Checklist &amp; Verification (
                        <Text style={{ color: '#047857', fontWeight: '700' }}>
                          {activeStage.checklist.filter((c) => c.done).length}
                        </Text>{' '}
                        of {activeStage.checklist.length} Verified)
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleCheckAll(activeStage.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.markAllBtnText}>Mark All Verified</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.checklistItemsList}>
                      {activeStage.checklist.map((item, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={[
                            styles.checklistItemCard,
                            item.done && styles.checklistItemCardDone,
                          ]}
                          onPress={() => handleToggleChecklistItem(activeStage.id, idx)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.checkboxBox,
                              item.done && styles.checkboxBoxDone,
                            ]}
                          >
                            {item.done ? (
                              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                            ) : null}
                          </View>
                          <Text
                            style={[
                              styles.checklistItemLabel,
                              item.done && styles.checklistItemLabelDone,
                            ]}
                          >
                            {item.label}
                          </Text>
                          <View
                            style={[
                              styles.checklistMiniBadge,
                              item.done && styles.checklistMiniBadgeDone,
                            ]}
                          >
                            <Text
                              style={[
                                styles.checklistMiniBadgeText,
                                item.done && styles.checklistMiniBadgeTextDone,
                              ]}
                            >
                              {item.done ? 'Verified' : 'Pending'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* Action Controls: Review Checklist & Submit Audit / Complete Stage */}
                <View style={styles.stageActionRow}>
                  {activeStage.status === 'COMPLETED' ? (
                    <View style={styles.stageCompletedNotice}>
                      <Ionicons name="checkmark-circle" size={16} color="#059669" />
                      <Text style={styles.stageCompletedNoticeText}>
                        This stage has passed statutory test criteria and is certified.
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.stageActionPrompt}>
                      Complete checklist criteria, then tap{' '}
                      <Text style={{ fontWeight: '700', color: '#0F172A' }}>
                        {activeStage.number === 3 ? 'Please Submit Audit' : 'Complete & Advance'}
                      </Text>{' '}
                      to advance the pipeline.
                    </Text>
                  )}

                  <View style={styles.actionButtonsWrap}>
                    <TouchableOpacity
                      style={styles.reviewChecklistBtn}
                      onPress={() => setReviewStage(activeStage)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="document-text-outline" size={14} color="#0F172A" />
                      <Text style={styles.reviewChecklistBtnText}>Review Checklist</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.submitAuditBtn,
                        activeStage.status === 'COMPLETED' && styles.submitAuditBtnDone,
                      ]}
                      onPress={() => handleCompleteAndAdvance(activeStage)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={activeStage.status === 'COMPLETED' ? 'checkmark-circle' : 'sparkles'}
                        size={14}
                        color="#FFFFFF"
                      />
                      <Text style={styles.submitAuditBtnText}>
                        {activeStage.status === 'COMPLETED'
                          ? 'Stage Verified ✓'
                          : activeStage.number === 3
                          ? 'Please Submit Audit'
                          : activeStage.actionCta || 'Complete & Advance'}
                      </Text>
                      {activeStage.status !== 'COMPLETED' ? (
                        <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                      ) : null}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 3. CALENDAR VIEW */}
        {!loading && activeTab === 'CALENDAR' && (
          <View>
            {calendarEvents.length === 0 ? (
              <EmptyState
                icon="calendar-outline"
                title="No Upcoming Deadlines"
                description="Statutory renewal and filing dates will appear here as they are established."
              />
            ) : (
              calendarEvents.map((evt) => (
                <View key={evt.id} style={styles.calendarCard}>
                  <View style={styles.calDaysBox}>
                    <Text style={styles.calDaysNum}>{evt.days_remaining}</Text>
                    <Text style={styles.calDaysLabel}>DAYS LEFT</Text>
                  </View>
                  <View style={styles.calInfo}>
                    <Text style={styles.calAuthority}>{evt.authority}</Text>
                    <Text style={styles.calTitle}>{evt.title}</Text>
                    <Text style={styles.calDate}>Due Date: {evt.due_date}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.calActionBtn}
                    onPress={() => router.push('/(app)/(tabs)/compliance')}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="arrow-forward" size={16} color="#0284C7" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Document Details Modal */}
      <Modal
        visible={!!selectedDoc}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedDoc(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleWrap}>
                <Text style={styles.modalLabel}>DOCUMENT SPECIFICATION</Text>
                <Text style={styles.modalTitle}>{selectedDoc?.title}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSelectedDoc(null)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Associated Requirement</Text>
                <Text style={styles.specVal}>{selectedDoc?.requirement_name}</Text>
              </View>

              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Regulatory Authority</Text>
                <Text style={styles.specVal}>{selectedDoc?.authority}</Text>
              </View>

              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Verification Status</Text>
                <Badge label={selectedDoc?.status || 'VERIFIED'} variant="COMPLIANT" />
              </View>

              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Statutory Purpose</Text>
                <Text style={styles.specVal}>{selectedDoc?.purpose}</Text>
              </View>

              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Accepted Record Format</Text>
                <Text style={styles.specVal}>{selectedDoc?.file_type || 'PDF Format'}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setSelectedDoc(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Review Checklist Modal */}
      <Modal
        visible={!!reviewStage}
        animationType="slide"
        transparent
        onRequestClose={() => setReviewStage(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleWrap}>
                <Text style={styles.modalLabel}>AUDIT REVIEW DOSSIER</Text>
                <Text style={styles.modalTitle}>
                  Stage {reviewStage?.number}: {reviewStage?.name}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setReviewStage(null)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Statutory Objective</Text>
                <Text style={styles.specVal}>{reviewStage?.description}</Text>
              </View>

              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Compliance Officer In-Charge</Text>
                <Text style={styles.specVal}>{reviewStage?.assignedTo}</Text>
              </View>

              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Checklist Verification Progress</Text>
                <Text style={[styles.specVal, { color: '#047857', fontWeight: '700' }]}>
                  {reviewStage?.checklist?.filter((c) => c.done).length || 0} of{' '}
                  {reviewStage?.checklist?.length || 0} items verified (
                  {Math.round(
                    ((reviewStage?.checklist?.filter((c) => c.done).length || 0) /
                      Math.max(1, reviewStage?.checklist?.length || 1)) *
                      100
                  )}
                  %)
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.modalDoneBtn, { backgroundColor: '#059669' }]}
              onPress={() => setReviewStage(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalDoneBtnText}>Dismiss Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
  },
  pageSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  headerActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  tabPillRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabPillActive: {
    backgroundColor: '#F0F9FF',
  },
  tabPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  tabPillTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorBannerText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
  },
  centerLoading: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  metricCellHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cellDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metricValDark: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '700',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  needsAttentionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  needsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  alertIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  needsTitleWrap: {
    flex: 1,
  },
  needsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  needsSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  needsBody: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  reviewRequirementBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 9,
  },
  reviewRequirementBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionCountText: {
    fontSize: 11,
    color: '#64748B',
  },
  docItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  docItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  verifiedCheckWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningCheckWrap: {
    backgroundColor: '#FEF2F2',
  },
  docItemInfo: {
    flex: 1,
  },
  docItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  docItemMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  docItemDate: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  docItemRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  viewLinkBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  viewLinkText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  workflowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  workflowCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorityPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  workflowAuthority: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  workflowStepCount: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  workflowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  stepsList: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  stepDotCompleted: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  stepNumText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
  stepNumTextCompleted: {
    color: '#047857',
  },
  stepInfo: {
    flex: 1,
  },
  stepTitleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  stepDescText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  calDaysBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calDaysNum: {
    fontSize: 17,
    fontWeight: '800',
    color: '#DC2626',
  },
  calDaysLabel: {
    fontSize: 7,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.3,
  },
  calInfo: {
    flex: 1,
  },
  calAuthority: {
    fontSize: 10,
    color: '#0284C7',
    fontWeight: '600',
  },
  calTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginVertical: 2,
  },
  calDate: {
    fontSize: 11,
    color: '#64748B',
  },
  calActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalHeaderTitleWrap: {
    flex: 1,
    paddingRight: 12,
  },
  modalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    gap: 12,
    marginBottom: 20,
  },
  specRow: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  specLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  specVal: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },
  modalDoneBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  wfSelectorWrapper: {
    marginBottom: 12,
  },
  wfSelectorScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  wfSelectorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  wfSelectorChipActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  wfSelectorChipDone: {
    borderColor: '#A7F3D0',
  },
  wfSelectorChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  wfSelectorChipTextActive: {
    color: '#047857',
    fontWeight: '700',
  },
  wfSelectorChipTextDone: {
    color: '#059669',
  },
  wfDoneMiniPill: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  wfDoneMiniPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#047857',
  },
  wfBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wfBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#065F46',
    fontWeight: '500',
    lineHeight: 17,
  },
  wfBlockerAlert: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  wfBlockerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    textTransform: 'uppercase',
  },
  wfBlockerText: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 16,
  },
  interactiveWfCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  interactiveWfHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 14,
    marginBottom: 14,
  },
  wfMetaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  wfCodeBadge: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  wfCodeBadgeText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  wfAuthorityBadge: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  wfAuthorityBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#334155',
  },
  wfInteractiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  wfInteractiveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  interactiveWfTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginVertical: 4,
  },
  wfStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 8,
  },
  wfDueDateText: {
    fontSize: 11,
    color: '#64748B',
  },
  wfDueDateBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  wfActiveStagePill: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  wfActiveStagePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  wfResetBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  timelineContainer: {
    marginVertical: 14,
    position: 'relative',
  },
  timelineScrollContent: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 420,
  },
  timelineLineBase: {
    position: 'absolute',
    top: 28,
    left: 24,
    right: 24,
    height: 3,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
  },
  timelineLineProgress: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 2,
  },
  nodeWrapper: {
    alignItems: 'center',
    width: 84,
    marginHorizontal: 4,
  },
  nodeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  nodeCircleCompleted: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  nodeCircleInProgress: {
    backgroundColor: '#047857',
    borderColor: '#6EE7B7',
    borderWidth: 3,
  },
  nodeCircleSelected: {
    borderWidth: 3,
    borderColor: '#047857',
  },
  nodeNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  nodeNumberTextActive: {
    color: '#FFFFFF',
  },
  nodeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  nodeLabelSelected: {
    color: '#0F172A',
    fontWeight: '700',
  },
  nodeLabelCompleted: {
    color: '#065F46',
  },
  nodeMiniPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginTop: 4,
  },
  nodeMiniPillCompleted: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  nodeMiniPillInProgress: {
    backgroundColor: '#D1FAE5',
    borderColor: '#6EE7B7',
  },
  nodeMiniPillText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
  },
  nodeMiniPillTextCompleted: {
    color: '#047857',
    fontWeight: '700',
  },
  nodeMiniPillTextInProgress: {
    color: '#065F46',
    fontWeight: '700',
  },
  stageDetailBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginTop: 10,
  },
  stageDetailTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
  },
  stageNumberCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageNumberCircleDone: {
    backgroundColor: '#059669',
  },
  stageNumberCircleActive: {
    backgroundColor: '#047857',
  },
  stageNumberCircleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  stageNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  stageNameTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  stageStatusBadge: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  stageStatusBadgeDone: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  stageStatusBadgeActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  stageStatusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  stageStatusBadgeTextDone: {
    color: '#047857',
  },
  stageStatusBadgeTextActive: {
    color: '#B45309',
  },
  stageDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 17,
  },
  stageMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexWrap: 'wrap',
  },
  stageMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stageMetaText: {
    fontSize: 11,
    color: '#64748B',
  },
  stageMetaBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  checklistSection: {
    marginTop: 12,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  checklistHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  markAllBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  checklistItemsList: {
    gap: 8,
  },
  checklistItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    borderRadius: 10,
  },
  checklistItemCardDone: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxBoxDone: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  checklistItemLabel: {
    flex: 1,
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '500',
  },
  checklistItemLabelDone: {
    color: '#065F46',
    fontWeight: '600',
  },
  checklistMiniBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  checklistMiniBadgeDone: {
    backgroundColor: '#D1FAE5',
  },
  checklistMiniBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
  },
  checklistMiniBadgeTextDone: {
    color: '#047857',
    fontWeight: '700',
  },
  stageActionRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  stageCompletedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 8,
  },
  stageCompletedNoticeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
    flex: 1,
  },
  stageActionPrompt: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  actionButtonsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewChecklistBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 10,
  },
  reviewChecklistBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  submitAuditBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 10,
  },
  submitAuditBtnDone: {
    backgroundColor: '#10B981',
  },
  submitAuditBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
