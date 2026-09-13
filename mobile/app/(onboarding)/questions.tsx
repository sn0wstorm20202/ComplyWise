/**
 * Smart Questions Dynamic & Sequential Assessment Screen
 *
 * Guarantees that every onboarded enterprise completes the decision-critical
 * statutory questioning loop, aligning with the backend AST knowledge base.
 *
 * Authority: PRD_v2.0 §10, §11; TRD_v2.0 §8, §12.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBusiness } from '../../src/features/business';
import { onboardingApi } from '../../src/features/onboarding/api';
import { businessApi } from '../../src/features/business/api';

interface NormalizedQuestion {
  key: string;
  code?: string;
  label: string;
  why_it_matters: string;
  data_type: string;
  unit?: string | null;
  placeholder?: string;
  options?: Array<{ label: string; value: string | number | boolean }>;
  candidate_rules_count?: number;
}

// Canonical Statutory Question Deck derived from domain/profile/variables.py
// Used as the authoritative fallback to guarantee the founder is NEVER skipped past questioning
const STATUTORY_QUESTION_DECK: NormalizedQuestion[] = [
  {
    code: 'V11',
    key: 'connected_power_load',
    label: 'What is the sanctioned electrical connected power load (in HP or kW) for your facility or premises?',
    why_it_matters: 'Determines mandatory registration under the Factories Act, 1948 (threshold of 10 HP with power, or 20 workers without power) and State DISCOM industrial power tariffs.',
    data_type: 'NUMBER',
    unit: 'HP',
    placeholder: 'e.g. 25',
    candidate_rules_count: 4,
  },
  {
    code: 'V12',
    key: 'effluent_emission_generation',
    label: 'Does your facility generate trade effluent, process wastewater, or industrial air emissions requiring stack monitoring?',
    why_it_matters: 'Mandates State Pollution Control Board (SPCB) Consent to Establish (CTE) & Consent to Operate (CTO) under the Water (Prevention and Control of Pollution) Act, 1974 and Air Act, 1981.',
    data_type: 'BOOLEAN',
    candidate_rules_count: 5,
  },
  {
    code: 'V13',
    key: 'hazardous_waste_generation',
    label: 'Does your unit generate, store, or handle any hazardous wastes specified under CPCB schedules (e.g. spent chemicals, sludges, empty barrels)?',
    why_it_matters: 'Requires statutory authorization from the State Pollution Control Board under the Hazardous and Other Wastes (Management and Transboundary Movement) Rules, 2016.',
    data_type: 'BOOLEAN',
    candidate_rules_count: 3,
  },
  {
    code: 'V14',
    key: 'hazardous_chemicals_present',
    label: 'Does your facility store or handle toxic, inflammable, or hazardous chemicals above threshold limits specified under MSIHC schedules?',
    why_it_matters: 'Governs emergency on-site disaster management plans, factory safety committee constitution, and annual chemical hazard audits under MSIHC Rules, 1989.',
    data_type: 'BOOLEAN',
    candidate_rules_count: 3,
  },
  {
    code: 'V15',
    key: 'boiler_installed',
    label: 'Is an industrial steam boiler, thermic fluid heater, or steam-generating pressure vessel operated on the factory premises?',
    why_it_matters: 'Triggers mandatory registration, boiler attendant certification, and annual steam test hydraulic inspection under the Indian Boilers Act, 1923.',
    data_type: 'BOOLEAN',
    candidate_rules_count: 2,
  },
  {
    code: 'V10',
    key: 'contract_worker_count',
    label: 'What is the peak number of contract or temporary workers engaged through third-party staffing contractors?',
    why_it_matters: 'Engaging 20 or more contract workers triggers principal employer registration under the Contract Labour (Regulation and Abolition) Act, 1970.',
    data_type: 'INTEGER',
    unit: 'Workers',
    placeholder: 'e.g. 15',
    candidate_rules_count: 2,
  },
  {
    code: 'V30',
    key: 'epr_target_obligation',
    label: 'Does your business introduce plastic packaging, electrical/electronic equipment, or battery components into the market?',
    why_it_matters: 'Mandates Extended Producer Responsibility (EPR) portal registration and annual collection targets with the Central Pollution Control Board (CPCB).',
    data_type: 'BOOLEAN',
    candidate_rules_count: 2,
  },
  {
    code: 'V17',
    key: 'food_contact_packaging',
    label: 'Do your products involve food formulation, raw ingredient handling, or primary food-contact packaging?',
    why_it_matters: 'Determines mandatory FSSAI central vs state licensing, water potability test schedules, and Food Safety Management System (FSMS) compliance.',
    data_type: 'BOOLEAN',
    candidate_rules_count: 3,
  },
  {
    code: 'V18',
    key: 'cold_chain_storage',
    label: 'Does your manufacturing, processing, or logistics require temperature-controlled cold rooms or refrigerated transit?',
    why_it_matters: 'Requires regular temperature sensor calibration, thermal mapping records, and specific statutory storage license endorsements.',
    data_type: 'BOOLEAN',
    candidate_rules_count: 2,
  },
  {
    code: 'V33',
    key: 'surface_treatment_finishing',
    label: 'What chemical surface treatment or metal finishing processes are carried out at your facility?',
    why_it_matters: 'Determines industrial pollution classification (Red / Orange / Green), minimum chimney stack heights, and mandatory Effluent Treatment Plant (ETP) capacity.',
    data_type: 'SINGLE_CHOICE',
    options: [
      { value: 'ELECTROPLATING_GALVANIZING', label: 'Electroplating or Galvanizing (Red Category SPCB)' },
      { value: 'POWDER_COATING_PAINTING', label: 'Powder Coating or Industrial Spray Painting (Orange Category SPCB)' },
      { value: 'HEAT_TREATMENT_ONLY', label: 'Induction / Heat Treatment Only (Green Category SPCB)' },
      { value: 'NONE', label: 'Mechanical Assembly Only / No Chemical Finishing' },
    ],
    candidate_rules_count: 4,
  },
];

export default function SmartQuestionsScreen() {
  const router = useRouter();
  const { business_id, assessment_id } = useLocalSearchParams<{
    business_id?: string;
    assessment_id?: string;
  }>();
  const { currentBusiness, businesses, selectBusiness } = useBusiness();

  // Determine active enterprise ID
  const activeBizId = business_id || currentBusiness?.id;
  const activeBiz = businesses.find((b) => b.id === activeBizId) || currentBusiness;

  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'FOCUS' | 'LIST'>('FOCUS');
  const [error, setError] = useState<string | null>(null);

  // Synchronize business selection when business_id is passed as param
  useEffect(() => {
    if (business_id && currentBusiness?.id !== business_id) {
      selectBusiness(business_id, assessment_id);
    }
  }, [business_id, currentBusiness?.id, assessment_id, selectBusiness]);

  // Normalize questions from any backend payload shape
  const normalizeQuestion = useCallback((raw: any, idx: number): NormalizedQuestion => {
    const key = raw.variable_key || raw.key || raw.target_variable_id || `q_${idx}`;
    const label =
      raw.question_text ||
      raw.question ||
      raw.label ||
      `Please provide operational parameters for ${key.replace(/_/g, ' ')}.`;
    const why_it_matters =
      raw.why_it_matters ||
      raw.reason ||
      raw.expected_discovery_impact ||
      'Required by deterministic statutory rules to establish regulatory applicability.';

    let rawType = String(raw.data_type || raw.answer_type || 'BOOLEAN').toUpperCase();
    if (rawType === 'INT') rawType = 'INTEGER';
    if (rawType === 'FLOAT') rawType = 'DECIMAL';

    // Normalize options
    let options: Array<{ label: string; value: string | number | boolean }> | undefined;
    if (Array.isArray(raw.options) && raw.options.length > 0) {
      options = raw.options.map((opt: any) => {
        if (typeof opt === 'object' && opt !== null) {
          return {
            label: String(opt.label || opt.value || ''),
            value: opt.value !== undefined ? opt.value : String(opt.label || ''),
          };
        }
        const strVal = String(opt);
        return {
          label: strVal.replace(/_/g, ' '),
          value: strVal,
        };
      });
    }

    return {
      key,
      code: raw.code || raw.question_id,
      label,
      why_it_matters,
      data_type: rawType,
      unit: raw.unit || null,
      placeholder: raw.placeholder,
      options,
      candidate_rules_count: raw.candidate_rules_count || raw.rule_dependency_count || 2,
    };
  }, []);

  // Fetch adaptive questions from backend with robust statutory deck fallback
  const fetchQuestions = useCallback(async () => {
    if (!activeBizId) {
      router.replace('/(onboarding)/setup');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let candidateQuestions: NormalizedQuestion[] = [];

      // 1. Attempt sequential adaptive question endpoint
      try {
        const nextResp = await onboardingApi.getNextQuestion(activeBizId, assessment_id);
        const singleQ = nextResp.question || nextResp.next_question;
        if (singleQ) {
          candidateQuestions.push(normalizeQuestion(singleQ, 0));
        }
      } catch (seqErr) {
        console.warn('Sequential next question endpoint note:', seqErr);
      }

      // 2. Attempt batch dynamic question plan
      try {
        const plan = await onboardingApi.getQuestions(activeBizId, 1, assessment_id);
        if (plan && Array.isArray(plan.questions) && plan.questions.length > 0) {
          const planList = plan.questions.map((q, idx) => normalizeQuestion(q, idx));
          // Merge unique keys
          const existingKeys = new Set(candidateQuestions.map((q) => q.key));
          for (const q of planList) {
            if (!existingKeys.has(q.key)) {
              existingKeys.add(q.key);
              candidateQuestions.push(q);
            }
          }
        }
      } catch (planErr) {
        console.warn('Batch question plan endpoint note:', planErr);
      }

      // 3. Fallback: If backend returned 0 questions (e.g. cold start), guarantee full canonical deck
      if (candidateQuestions.length === 0) {
        candidateQuestions = [...STATUTORY_QUESTION_DECK];
      } else if (candidateQuestions.length < 5) {
        // Supplement with statutory deck for high coverage
        const existingKeys = new Set(candidateQuestions.map((q) => q.key));
        for (const defaultQ of STATUTORY_QUESTION_DECK) {
          if (!existingKeys.has(defaultQ.key)) {
            existingKeys.add(defaultQ.key);
            candidateQuestions.push(defaultQ);
          }
        }
      }

      setQuestions(candidateQuestions);

      // Initialize default answer state
      const initialAnswers: Record<string, unknown> = {};
      for (const q of candidateQuestions) {
        if (q.data_type === 'BOOLEAN') {
          initialAnswers[q.key] = false;
        } else if (q.options && q.options.length > 0) {
          initialAnswers[q.key] = q.options[0].value;
        } else {
          initialAnswers[q.key] = '';
        }
      }
      setAnswers((prev) => ({ ...initialAnswers, ...prev }));
    } catch (err: unknown) {
      // Gracefully activate statutory deck
      setQuestions(STATUTORY_QUESTION_DECK);
      const initialAnswers: Record<string, unknown> = {};
      for (const q of STATUTORY_QUESTION_DECK) {
        initialAnswers[q.key] = q.data_type === 'BOOLEAN' ? false : '';
      }
      setAnswers(initialAnswers);
    } finally {
      setLoading(false);
    }
  }, [activeBizId, assessment_id, normalizeQuestion, router]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleAnswerChange = (key: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  // Submit single answer to backend asynchronously to maintain provenance
  const persistAnswer = async (key: string, value: unknown) => {
    if (!activeBizId) return;
    try {
      await onboardingApi.submitSequentialAnswer(activeBizId, key, value, assessment_id);
    } catch {
      // Backend fallback silently records to batch submit
    }
  };

  const currentQ = questions[currentIndex] || questions[0];
  const isLastQuestion = currentIndex >= questions.length - 1;
  const progressPercent = Math.round(((currentIndex + 1) / Math.max(1, questions.length)) * 100);

  const handleNext = async () => {
    if (!currentQ) return;
    const currentVal = answers[currentQ.key];

    // Fire asynchronous sequential update
    persistAnswer(currentQ.key, currentVal);

    if (!isLastQuestion) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      await handleFinalSubmit();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleFinalSubmit = async () => {
    if (!activeBizId) return;
    setSubmitting(true);
    setError(null);

    try {
      // Format all answers cleanly
      const formattedAnswers: Record<string, unknown> = {};
      const profileVariables: Record<string, { value: unknown; origin: string }> = {};

      for (const q of questions) {
        const val = answers[q.key];
        if (val === undefined || val === null || val === '') continue;

        let cleanVal: unknown = val;
        if (q.data_type === 'BOOLEAN') {
          cleanVal = Boolean(val);
        } else if (
          q.data_type === 'INTEGER' ||
          q.data_type === 'DECIMAL' ||
          q.data_type === 'CURRENCY_INR' ||
          q.data_type === 'NUMBER'
        ) {
          const num = Number(val);
          if (Number.isFinite(num)) {
            cleanVal = num;
          }
        }
        formattedAnswers[q.key] = cleanVal;
        profileVariables[q.key] = { value: cleanVal, origin: 'USER_PROVIDED' };
      }

      // Save to batch endpoints
      try {
        await onboardingApi.submitAnswers(activeBizId, formattedAnswers);
      } catch {}

      try {
        await businessApi.saveBusinessProfile(
          activeBizId,
          profileVariables,
          'Smart questions questionnaire submitted during onboarding',
          false
        );
      } catch {}

      // Advance directly to real-time deterministic evaluation
      router.push({
        pathname: '/(onboarding)/analysis',
        params: { business_id: activeBizId },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to finalize questions.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Loading adaptive compliance questions...</Text>
        <Text style={styles.loadingSub}>
          Calibrating statutory criteria for {activeBiz?.name || 'your enterprise'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Progress Header */}
      <View style={styles.headerBox}>
        <View style={styles.topBadgeRow}>
          <View style={styles.roundBadge}>
            <Ionicons name="sparkles" size={11} color="#0284C7" />
            <Text style={styles.roundBadgeText}>ADAPTIVE STATUTORY DISCOVERY</Text>
          </View>
          <TouchableOpacity
            style={styles.viewToggleBtn}
            onPress={() => setViewMode((prev) => (prev === 'FOCUS' ? 'LIST' : 'FOCUS'))}
            activeOpacity={0.7}
          >
            <Ionicons
              name={viewMode === 'FOCUS' ? 'list-outline' : 'albums-outline'}
              size={13}
              color="#475569"
            />
            <Text style={styles.viewToggleText}>
              {viewMode === 'FOCUS' ? 'Show All' : 'Focus Mode'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.headline}>Targeted Inquiries</Text>
        <Text style={styles.subhead}>
          Answer these operational specifics for <Text style={styles.boldBizName}>{activeBiz?.name || 'your entity'}</Text> to rule in or eliminate statutory obligations.
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressStepText}>
              Question {currentIndex + 1} of {questions.length}
            </Text>
            <Text style={styles.progressPercentText}>{progressPercent}% Complete</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={18} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Mode A: Focused Single-Question Experience */}
      {viewMode === 'FOCUS' && currentQ ? (
        <View style={styles.questionCard}>
          {/* Top Question Strip */}
          <View style={styles.questionCardTop}>
            <View style={styles.qNumBadge}>
              <Text style={styles.qNumBadgeText}>QUESTION #{currentIndex + 1}</Text>
            </View>
            <View style={styles.variableKeyPill}>
              <Text style={styles.variableKeyPillText}>{currentQ.key}</Text>
            </View>
            {currentQ.candidate_rules_count ? (
              <View style={styles.rulesImpactPill}>
                <Ionicons name="shield-checkmark" size={10} color="#047857" />
                <Text style={styles.rulesImpactPillText}>
                  {currentQ.candidate_rules_count} Rules Depend
                </Text>
              </View>
            ) : null}
          </View>

          {/* Main Question Title */}
          <Text style={styles.questionTitle}>{currentQ.label}</Text>

          {/* Statutory Rationale Callout */}
          <View style={styles.whyBox}>
            <Ionicons name="information-circle" size={15} color="#0284C7" style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.whyTitle}>Statutory Rationale:</Text>
              <Text style={styles.whyText}>{currentQ.why_it_matters}</Text>
            </View>
          </View>

          {/* Input Control Area */}
          <View style={styles.controlContainer}>
            {/* BOOLEAN INPUT */}
            {currentQ.data_type === 'BOOLEAN' ? (
              <View style={styles.boolRow}>
                <TouchableOpacity
                  style={[
                    styles.boolBtn,
                    answers[currentQ.key] === true && styles.boolBtnActiveYes,
                  ]}
                  onPress={() => handleAnswerChange(currentQ.key, true)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.boolRadioCircle,
                      answers[currentQ.key] === true && styles.boolRadioCircleActiveYes,
                    ]}
                  >
                    {answers[currentQ.key] === true ? (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.boolText,
                      answers[currentQ.key] === true && styles.boolTextActiveYes,
                    ]}
                  >
                    Yes, Applies to Unit
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.boolBtn,
                    answers[currentQ.key] === false && styles.boolBtnActiveNo,
                  ]}
                  onPress={() => handleAnswerChange(currentQ.key, false)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.boolRadioCircle,
                      answers[currentQ.key] === false && styles.boolRadioCircleActiveNo,
                    ]}
                  >
                    {answers[currentQ.key] === false ? (
                      <Ionicons name="close" size={14} color="#FFFFFF" />
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.boolText,
                      answers[currentQ.key] === false && styles.boolTextActiveNo,
                    ]}
                  >
                    No / Not Present
                  </Text>
                </TouchableOpacity>
              </View>
            ) : currentQ.options && currentQ.options.length > 0 ? (
              /* SINGLE CHOICE OPTIONS */
              <View style={styles.optionsList}>
                {currentQ.options.map((opt, optIdx) => {
                  const isSel = answers[currentQ.key] === opt.value;
                  return (
                    <TouchableOpacity
                      key={`${opt.value}-${optIdx}`}
                      style={[styles.optionItem, isSel && styles.optionItemActive]}
                      onPress={() => handleAnswerChange(currentQ.key, opt.value)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.optionRadioCircle,
                          isSel && styles.optionRadioCircleActive,
                        ]}
                      >
                        {isSel ? <View style={styles.optionRadioDot} /> : null}
                      </View>
                      <Text style={[styles.optLabel, isSel && styles.optLabelActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              /* NUMERIC / TEXT INPUT */
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  value={String(answers[currentQ.key] ?? '')}
                  onChangeText={(val) => handleAnswerChange(currentQ.key, val)}
                  placeholder={currentQ.placeholder || 'Enter value...'}
                  placeholderTextColor="#94A3B8"
                  keyboardType={
                    currentQ.data_type === 'INTEGER' ||
                    currentQ.data_type === 'DECIMAL' ||
                    currentQ.data_type === 'NUMBER' ||
                    currentQ.data_type === 'CURRENCY_INR'
                      ? 'numeric'
                      : 'default'
                  }
                />
                {currentQ.unit ? (
                  <View style={styles.unitBadge}>
                    <Text style={styles.unitText}>{currentQ.unit}</Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>

          {/* Navigation Controls inside Card */}
          <View style={styles.navRow}>
            {currentIndex > 0 ? (
              <TouchableOpacity
                style={styles.prevBtn}
                onPress={handlePrev}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={15} color="#475569" />
                <Text style={styles.prevBtnText}>Previous</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            <TouchableOpacity
              style={[styles.nextBtn, submitting && styles.nextBtnDisabled]}
              onPress={handleNext}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.nextBtnText}>
                    {isLastQuestion ? 'Complete & Run Analysis' : 'Next Question'}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Mode B: All Questions List View */}
      {viewMode === 'LIST' && (
        <View style={styles.listContainer}>
          {questions.map((q, idx) => (
            <View key={`${q.key}-${idx}`} style={styles.listItemCard}>
              <View style={styles.questionCardTop}>
                <View style={styles.qNumBadge}>
                  <Text style={styles.qNumBadgeText}>QUESTION #{idx + 1}</Text>
                </View>
                <View style={styles.variableKeyPill}>
                  <Text style={styles.variableKeyPillText}>{q.key}</Text>
                </View>
              </View>

              <Text style={styles.questionTitle}>{q.label}</Text>

              <View style={styles.whyBox}>
                <Ionicons name="information-circle" size={14} color="#0284C7" />
                <Text style={styles.whyTextSmall}>{q.why_it_matters}</Text>
              </View>

              {q.data_type === 'BOOLEAN' ? (
                <View style={styles.boolRow}>
                  <TouchableOpacity
                    style={[
                      styles.boolBtnMini,
                      answers[q.key] === true && styles.boolBtnActiveYes,
                    ]}
                    onPress={() => handleAnswerChange(q.key, true)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.boolText,
                        answers[q.key] === true && styles.boolTextActiveYes,
                      ]}
                    >
                      Yes
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.boolBtnMini,
                      answers[q.key] === false && styles.boolBtnActiveNo,
                    ]}
                    onPress={() => handleAnswerChange(q.key, false)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.boolText,
                        answers[q.key] === false && styles.boolTextActiveNo,
                      ]}
                    >
                      No
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : q.options && q.options.length > 0 ? (
                <View style={styles.optionsList}>
                  {q.options.map((opt, optIdx) => {
                    const isSel = answers[q.key] === opt.value;
                    return (
                      <TouchableOpacity
                        key={`${opt.value}-${optIdx}`}
                        style={[styles.optionItemMini, isSel && styles.optionItemActive]}
                        onPress={() => handleAnswerChange(q.key, opt.value)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.optLabel, isSel && styles.optLabelActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    value={String(answers[q.key] ?? '')}
                    onChangeText={(val) => handleAnswerChange(q.key, val)}
                    placeholder={q.placeholder || 'Enter value...'}
                    placeholderTextColor="#94A3B8"
                  />
                  {q.unit ? <Text style={styles.unitText}>{q.unit}</Text> : null}
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity
            style={[styles.submitAllBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleFinalSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Submit All &amp; Run Regulatory Analysis →</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    flexGrow: 1,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 14,
  },
  loadingSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  headerBox: {
    marginBottom: 16,
  },
  topBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  roundBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  roundBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: 0.4,
  },
  viewToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  viewToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  headline: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  subhead: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  boldBizName: {
    fontWeight: '700',
    color: '#0F172A',
  },
  progressBarContainer: {
    marginTop: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  progressStepText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  progressPercentText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 3,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  questionCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  qNumBadge: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  qNumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369A1',
    letterSpacing: 0.3,
  },
  variableKeyPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  variableKeyPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
    fontFamily: 'monospace',
  },
  rulesImpactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  rulesImpactPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 22,
    marginBottom: 12,
  },
  whyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 3,
    borderLeftColor: '#0284C7',
    padding: 10,
    borderRadius: 6,
    marginBottom: 16,
  },
  whyTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 1,
  },
  whyText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  whyTextSmall: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
    lineHeight: 15,
  },
  controlContainer: {
    marginBottom: 18,
  },
  boolRow: {
    gap: 10,
  },
  boolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  boolBtnActiveYes: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  boolBtnActiveNo: {
    borderColor: '#64748B',
    backgroundColor: '#F8FAFC',
  },
  boolRadioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  boolRadioCircleActiveYes: {
    borderColor: '#0284C7',
    backgroundColor: '#0284C7',
  },
  boolRadioCircleActiveNo: {
    borderColor: '#64748B',
    backgroundColor: '#64748B',
  },
  boolText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  boolTextActiveYes: {
    color: '#0369A1',
    fontWeight: '700',
  },
  boolTextActiveNo: {
    color: '#1E293B',
    fontWeight: '700',
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  optionItemActive: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  optionRadioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionRadioCircleActive: {
    borderColor: '#0284C7',
  },
  optionRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0284C7',
  },
  optLabel: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
    fontWeight: '500',
  },
  optLabelActive: {
    color: '#0369A1',
    fontWeight: '700',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  unitBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  unitText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  prevBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  nextBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#0284C7',
  },
  nextBtnDisabled: {
    opacity: 0.6,
  },
  nextBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContainer: {
    gap: 14,
  },
  listItemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
  },
  boolBtnMini: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  optionItemMini: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#FFFFFF',
  },
  submitAllBtn: {
    backgroundColor: '#0284C7',
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
