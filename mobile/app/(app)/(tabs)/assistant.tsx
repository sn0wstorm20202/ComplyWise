/**
 * ComplyWise AI Assistant Screen (AI Tab)
 *
 * Structure directly adapted from Figma `ui layers/ComplyWise AI - Assistant.png`,
 * beautifully translated into an Executive Light Theme.
 */

import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../../src/components/common/Header';
import { Badge } from '../../../src/components/common/Badge';
import { useBusiness } from '../../../src/features/business';
import { assistantApi } from '../../../src/features/assistant/api';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  hasBlocker?: boolean;
}

export default function AssistantScreen() {
  const router = useRouter();
  const { currentBusiness } = useBusiness();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'user',
      text: 'Can I submit my Factory Licence renewal now?',
    },
    {
      id: '2',
      sender: 'assistant',
      text: "You're missing one required document before submission.",
      hasBlocker: true,
    },
  ]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input.trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await assistantApi.chat(textToSend, currentBusiness?.id);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.answer || "I've reviewed your statutory filings against verified state guidelines.",
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: 'Unable to reach Copilot engine right now. Please verify your network connection.',
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header />

      {/* Assistant Title & Context Tags Bar */}
      <View style={styles.assistantHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.headerTitleRow}>
            <View style={styles.sparkleWrap}>
              <Ionicons name="sparkles" size={16} color="#0284C7" />
            </View>
            <View>
              <Text style={styles.title}>ComplyWise AI</Text>
              <Text style={styles.subtitle}>Ask about your compliance</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.historyBtn} activeOpacity={0.7}>
          <Ionicons name="time-outline" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Business Context Pill Bar */}
      <View style={styles.contextBar}>
        <View style={styles.contextDotRow}>
          <View style={styles.contextDot} />
          <Text style={styles.contextLabel}>Using your business profile and compliance data</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScroll}>
          <View style={styles.contextTag}>
            <Text style={styles.contextTagText}>{currentBusiness?.name || 'Apex Manufacturing'}</Text>
          </View>
          <View style={styles.contextTag}>
            <Text style={styles.contextTagText}>{currentBusiness?.state || 'West Bengal'}</Text>
          </View>
          <View style={styles.contextTag}>
            <Text style={styles.contextTagText}>12 requirements</Text>
          </View>
        </ScrollView>
      </View>

      {/* Messages Scroll Area */}
      <ScrollView
        contentContainerStyle={styles.messagesContainer}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((m) => {
          if (m.sender === 'user') {
            return (
              <View key={m.id} style={styles.userBubbleWrapper}>
                <View style={styles.userBubble}>
                  <Text style={styles.userBubbleText}>{m.text}</Text>
                </View>
              </View>
            );
          }

          return (
            <View key={m.id} style={styles.assistantCard}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Ionicons name="sparkles" size={14} color="#0284C7" />
                  <Text style={styles.cardHeaderLabel}>COMPLYWISE ANSWER</Text>
                </View>
                <Badge label="Not yet" variant="WARNING" />
              </View>

              {/* Main Answer Text */}
              <Text style={styles.answerText}>{m.text}</Text>

              {/* Document Blocker Detail Card */}
              {m.hasBlocker && (
                <View style={styles.blockerCard}>
                  <View style={styles.blockerTop}>
                    <View style={styles.docIconWrap}>
                      <Ionicons name="document-text-outline" size={18} color="#DC2626" />
                    </View>
                    <View style={styles.blockerInfo}>
                      <Text style={styles.blockerTitle}>Updated Site Plan</Text>
                      <Text style={styles.blockerMeta}>2 of 3 documents ready</Text>
                    </View>
                    <Badge label="Missing" variant="CRITICAL" />
                  </View>

                  <Text style={styles.nextStepHeader}>NEXT STEP</Text>
                  <Text style={styles.nextStepTitle}>Upload Updated Site Plan</Text>
                  <Text style={styles.nextStepSub}>Complete this to unblock your renewal.</Text>

                  <TouchableOpacity
                    style={styles.uploadCtaBtn}
                    onPress={() => router.push('/(app)/(tabs)/work')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.uploadCtaText}>Upload document →</Text>
                  </TouchableOpacity>

                  <View style={styles.deadlineBox}>
                    <Ionicons name="calendar-outline" size={15} color="#0284C7" />
                    <View style={styles.deadlineInfo}>
                      <Text style={styles.deadlineMain}>Submit by Sep 18</Text>
                      <Text style={styles.deadlineSub}>Renewal deadline: Sep 24</Text>
                    </View>
                    <View style={styles.bufferBadge}>
                      <Text style={styles.bufferText}>6-day buffer</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Collapsible Explanation Row */}
              <View style={styles.explanationRow}>
                <View style={styles.explanationLeft}>
                  <Text style={styles.explanationTitle}>Why is this needed?</Text>
                  <Text style={styles.explanationSub}>Required for your Factory Licence renewal.</Text>
                </View>
                <TouchableOpacity style={styles.explanationLink}>
                  <Text style={styles.explanationLinkText}>View explanation ›</Text>
                </TouchableOpacity>
              </View>

              {/* Verified Statutory Source Card */}
              <View style={styles.sourceBox}>
                <View style={styles.sourceTop}>
                  <Ionicons name="shield-checkmark" size={14} color="#059669" />
                  <Text style={styles.sourceTag}>VERIFIED SOURCE</Text>
                </View>
                <Text style={styles.sourceTitle}>Directorate of Industrial Safety & Health</Text>
                <View style={styles.sourceBottom}>
                  <Text style={styles.sourceSub}>Factory Licensing & Renewal Guidance</Text>
                  <TouchableOpacity>
                    <Text style={styles.viewSourceLink}>View source →</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Dual Action Buttons */}
              <View style={styles.dualActionRow}>
                <TouchableOpacity
                  style={styles.outlineBtn}
                  onPress={() => router.push('/(app)/(tabs)/compliance')}
                >
                  <Text style={styles.outlineBtnText}>View requirement →</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.outlineBtn}
                  onPress={() => router.push('/(app)/(tabs)/work')}
                >
                  <Text style={styles.outlineBtnText}>Open workflow →</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {loading ? (
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color="#0284C7" />
            <Text style={styles.loadingText}>Synthesizing regulatory guidelines...</Text>
          </View>
        ) : null}

        {/* Suggested Follow-up Chip */}
        <View style={styles.followUpSection}>
          <Text style={styles.followUpHeader}>ASK A FOLLOW-UP</Text>
          <TouchableOpacity
            style={styles.followUpChip}
            onPress={() => handleSend('What documents are accepted?')}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={15} color="#475569" />
            <Text style={styles.followUpChipText}>What documents are accepted?</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Bottom Floating Prompt Dock */}
      <View style={styles.inputDock}>
        <TouchableOpacity style={styles.attachBtn}>
          <Ionicons name="add" size={22} color="#64748B" />
        </TouchableOpacity>

        <TextInput
          style={styles.promptInput}
          placeholder="Ask ComplyWise..."
          placeholderTextColor="#94A3B8"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => handleSend()}
        />

        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!input.trim() || loading}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  assistantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {},
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sparkleWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  historyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contextBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  contextDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  contextDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  contextLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  tagsScroll: {
    gap: 8,
  },
  contextTag: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  contextTagText: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: '500',
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 150,
  },
  userBubbleWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  userBubble: {
    backgroundColor: '#0284C7',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '85%',
  },
  userBubbleText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  assistantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardHeaderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  answerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 22,
    marginBottom: 14,
  },
  blockerCard: {
    backgroundColor: '#FFF1F2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 14,
    marginBottom: 14,
  },
  blockerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  docIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockerInfo: {
    flex: 1,
  },
  blockerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  blockerMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  nextStepHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: 0.8,
  },
  nextStepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  nextStepSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },
  uploadCtaBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 10,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deadlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  deadlineInfo: {
    flex: 1,
  },
  deadlineMain: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  deadlineSub: {
    fontSize: 10,
    color: '#64748B',
  },
  bufferBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  bufferText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B45309',
  },
  explanationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  explanationLeft: {
    flex: 1,
  },
  explanationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  explanationSub: {
    fontSize: 11,
    color: '#64748B',
  },
  explanationLink: {
    paddingLeft: 8,
  },
  explanationLinkText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  sourceBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  sourceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sourceTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 0.8,
  },
  sourceTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  sourceBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sourceSub: {
    fontSize: 11,
    color: '#64748B',
  },
  viewSourceLink: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  dualActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  outlineBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  outlineBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
  },
  followUpSection: {
    marginTop: 10,
  },
  followUpHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  followUpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  followUpChipText: {
    fontSize: 12,
    color: '#0F172A',
  },
  inputDock: {
    position: 'absolute',
    bottom: 78,
    left: 16,
    right: 16,
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  attachBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingHorizontal: 8,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#E2E8F0',
    opacity: 0.6,
  },
});
