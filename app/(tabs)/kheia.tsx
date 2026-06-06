import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/services/supabase';
import { spacing, radius, sizes, iosText } from '@/theme';
import { GlassCard } from '@/components/ui/GlassCard';

type Message = { role: 'user' | 'assistant'; content: string };

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const TUTORIAL_STEPS = [
  'Scrie întrebarea ta aici',
  'Ex: Cum se structurează un eseu la BAC?',
  'Ex: Care este formula derivatei pentru x^n?',
  'Ex: Ce sunt genurile literare și speciile?',
  'Ex: Cum se rezolvă ecuații de gradul II?',
  'Ex: Ce este funcția referențială în comunicare?',
  'Ex: Cum se calculează probabilitatea unui eveniment?',
  'Apasă → pentru a trimite',
];

export default function KheiaScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [tutorialDismissed, setTutorialDismissed] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const stepOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const scrollToEnd = useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages, scrollToEnd]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      setTimeout(scrollToEnd, 80);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollToEnd]);

  useEffect(() => {
    if (messages.length > 0) {
      setTutorialDismissed(true);
      return;
    }
    let cancelled = false;
    const runStep = (index: number) => {
      if (cancelled) return;
      if (index >= TUTORIAL_STEPS.length) {
        setCurrentStepIndex(0);
        stepOpacity.setValue(0.5);
        return;
      }
      setCurrentStepIndex(index);
      stepOpacity.setValue(0);
      Animated.sequence([
        Animated.timing(stepOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(2500),
        Animated.timing(stepOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.delay(300),
      ]).start(() => {
        if (!cancelled) runStep(index + 1);
      });
    };
    runStep(0);
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => {
      cancelled = true;
      pulse.stop();
    };
  }, [messages.length]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Sesiune expirată. Reconectează-te din Profil și încearcă din nou.',
          },
        ]);
        return;
      }

      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const { data, error } = await supabase.functions.invoke('generate-chat', {
        body: { messages: history },
      });

      if (error) {
        const isUnauthorized =
          error.message?.includes('401') ||
          error.message?.toLowerCase().includes('unauthorized');
        const errMsg = isUnauthorized
          ? 'Sesiune expirată. Reconectează-te și încearcă din nou.'
          : error.message?.includes('Failed to send') || error.message?.includes('FunctionsFetchError')
            ? 'Serviciul KHEYA nu este disponibil momentan. Verifică conexiunea și încearcă din nou.'
            : error.message || 'Eroare server. Încearcă din nou.';
        setMessages((prev) => [...prev, { role: 'assistant', content: errMsg }]);
      } else {
        const payload = data as { content?: string; error?: string } | null;
        if (payload?.error === 'Unauthorized') {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: 'Sesiune expirată. Reconectează-te și încearcă din nou.',
            },
          ]);
          return;
        }
        const content =
          payload?.content?.trim() ||
          (typeof payload?.error === 'string' ? payload.error : '') ||
          'Nu am putut primi răspuns.';
        setMessages((prev) => [...prev, { role: 'assistant', content }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Eroare de conexiune. Verifică internetul și încearcă din nou.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const showFullScreenPrompt = messages.length === 0 && !loading;
  const dismissKeyboard = () => Keyboard.dismiss();
  const inputBottomPad =
    keyboardHeight > 0
      ? keyboardHeight - insets.bottom + spacing.sm
      : spacing.contentBottom + insets.bottom;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <View style={styles.touchableContent}>
        <View style={[styles.header, styles.headerRow, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>KHEYA</Text>
            <Text style={styles.subtitle}>Chatbot EN & Bacalaureat</Text>
          </View>
          {showFullScreenPrompt ? (
            <Pressable
              onPress={dismissKeyboard}
              style={({ pressed }) => [styles.dismissBtn, pressed && styles.dismissBtnPressed]}
              accessibilityLabel="Închide tastatura"
            >
              <Text style={styles.dismissBtnText}>Închide</Text>
            </Pressable>
          ) : null}
        </View>

        {showFullScreenPrompt ? (
          <View style={[styles.fullScreenPromptArea, { paddingBottom: inputBottomPad }]}>
            <Animated.View style={[styles.tutorialWrapper, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.tutorialPrompt}>
                <TextInput
                  style={styles.fullScreenInput}
                  placeholder=""
                  placeholderTextColor="transparent"
                  value={input}
                  onChangeText={setInput}
                  multiline
                  maxLength={2000}
                  editable={!loading}
                  onFocus={scrollToEnd}
                />
                {!tutorialDismissed && !input.trim() ? (
                  <View style={styles.tutorialSteps} pointerEvents="none">
                    <Animated.Text style={[styles.tutorialStepText, { opacity: stepOpacity }]}>
                      {TUTORIAL_STEPS[currentStepIndex]}
                    </Animated.Text>
                  </View>
                ) : null}
              </View>
            </Animated.View>
            <View style={styles.sendRow}>
              <Pressable
                onPress={sendMessage}
                disabled={!input.trim() || loading}
                style={({ pressed }) => [styles.sendBtn, pressed && styles.sendBtnPressed]}
              >
                <GlassCard dark intensity={14} style={styles.sendBtnInnerFull}>
                  <Text style={styles.sendBtnText}>→ Trimite</Text>
                </GlassCard>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <ScrollView
              ref={scrollRef}
              style={styles.messages}
              contentContainerStyle={[
                styles.messagesContent,
                { paddingBottom: keyboardHeight > 0 ? spacing.md : spacing.lg },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={scrollToEnd}
            >
              {messages.map((msg, i) => (
                <View
                  key={i}
                  style={[styles.msgRow, msg.role === 'user' ? styles.msgRowUser : styles.msgRowBot]}
                >
                  <GlassCard
                    dark
                    intensity={msg.role === 'user' ? 12 : 16}
                    style={[
                      styles.msgBubble,
                      msg.role === 'user' ? styles.msgBubbleUser : styles.msgBubbleBot,
                    ]}
                  >
                    <Text style={styles.msgText}>{msg.content}</Text>
                  </GlassCard>
                </View>
              ))}
              {loading ? (
                <View style={[styles.msgRow, styles.msgRowBot]}>
                  <GlassCard dark intensity={16} style={[styles.msgBubble, styles.msgBubbleBot]}>
                    <ActivityIndicator size="small" color="#60a5fa" />
                  </GlassCard>
                </View>
              ) : null}
            </ScrollView>
            <View style={[styles.inputRow, { paddingBottom: inputBottomPad }]}>
              <TextInput
                style={styles.input}
                placeholder="Întreabă despre EN sau BAC..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={2000}
                editable={!loading}
                onFocus={scrollToEnd}
              />
              <Pressable
                onPress={sendMessage}
                disabled={!input.trim() || loading}
                style={({ pressed }) => [styles.sendBtn, pressed && styles.sendBtnPressed]}
              >
                <GlassCard dark intensity={14} style={styles.sendBtnInner}>
                  <Text style={styles.sendBtnText}>→</Text>
                </GlassCard>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  touchableContent: { flex: 1 },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.fieldGap,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextWrap: { flex: 1 },
  dismissBtn: {
    minHeight: sizes.touchTarget,
    minWidth: sizes.touchTarget,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  dismissBtnPressed: { opacity: 0.8 },
  dismissBtnText: {
    ...iosText('subhead'),
    fontWeight: '600',
    color: '#ffffff',
  },
  title: {
    ...iosText('title2'),
    color: '#ffffff',
    textAlign: 'left',
  },
  subtitle: {
    marginTop: spacing.xs,
    ...iosText('subhead'),
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'left',
  },
  messages: { flex: 1 },
  messagesContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.fieldGap,
  },
  msgRow: { marginBottom: spacing.sm },
  msgRowUser: { alignItems: 'flex-end' },
  msgRowBot: { alignItems: 'flex-start' },
  msgBubble: {
    maxWidth: '85%',
    padding: spacing.cardPadding,
    borderRadius: radius.lg,
  },
  msgBubbleUser: {
    backgroundColor: 'rgba(59, 130, 246, 0.35)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
    borderWidth: 1,
  },
  msgBubbleBot: {
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
    borderColor: 'rgba(148, 163, 184, 0.25)',
    borderWidth: 1,
  },
  msgText: {
    ...iosText('body'),
    color: '#ffffff',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.fieldGap,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: sizes.inputMinHeight,
    maxHeight: spacing.xxlSpace * 5,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
    borderColor: 'rgba(148, 163, 184, 0.3)',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    ...iosText('body'),
    color: '#ffffff',
  },
  sendBtn: {},
  sendBtnPressed: { opacity: 0.9 },
  sendBtnInner: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.4)',
    borderColor: 'rgba(59, 130, 246, 0.6)',
    borderWidth: 1,
  },
  sendBtnText: { ...iosText('title3'), fontWeight: '700', color: '#60a5fa' },
  sendBtnInnerFull: {
    minHeight: sizes.buttonHeight,
    paddingHorizontal: spacing.sectionGap,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.4)',
    borderColor: 'rgba(59, 130, 246, 0.6)',
    borderWidth: 1,
  },
  fullScreenPromptArea: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  tutorialWrapper: {
    flex: 1,
  },
  tutorialPrompt: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
    borderColor: 'rgba(148, 163, 184, 0.25)',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.cardPadding,
    minHeight: SCREEN_HEIGHT * 0.5,
  },
  fullScreenInput: {
    flex: 1,
    ...iosText('body'),
    color: '#ffffff',
    padding: 0,
    minHeight: spacing.xxlSpace * 5,
    textAlignVertical: 'top',
  },
  tutorialSteps: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
  },
  tutorialStepText: {
    ...iosText('body'),
    color: 'rgba(255,255,255,0.65)',
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  sendRow: {
    marginTop: spacing.md,
    alignItems: 'flex-end',
  },
});
