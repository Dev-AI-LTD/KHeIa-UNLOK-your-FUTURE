import { View, Text } from 'react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { gamificationStyles as styles } from '@/components/gamification/gamification.styles';

export type ExamType = 'EN' | 'BAC';

const EXAM_DATES_2026: Record<ExamType, Date> = {
  EN: new Date(2026, 5, 22),
  BAC: new Date(2026, 5, 29),
};

const EXAM_LABELS: Record<ExamType, string> = {
  EN: 'Evaluare Națională 2026',
  BAC: 'Bacalaureat 2026',
};

function getDaysRemaining(target: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const t = new Date(target);
  t.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((t.getTime() - now.getTime()) / 86400000));
}

type ExamCountdownProps = {
  examType: ExamType;
  compact?: boolean;
};

export function ExamCountdown({ examType, compact = false }: ExamCountdownProps) {
  const target = EXAM_DATES_2026[examType];
  const days = getDaysRemaining(target);
  const label = EXAM_LABELS[examType];

  if (compact) {
    return (
      <View style={styles.countdownCompact}>
        <Text style={styles.countdownCompactLabel}>{label}</Text>
        <Text style={styles.countdownCompactDays}>{days} zile</Text>
      </View>
    );
  }

  return (
    <GlassCard dark intensity={18} style={styles.countdownCard}>
      <Text style={styles.countdownLabel}>{label}</Text>
      <Text style={styles.countdownNumber}>{days}</Text>
      <Text style={styles.countdownSuffix}>{days === 1 ? 'zi rămasă' : 'zile rămase'}</Text>
    </GlassCard>
  );
}

export function ExamCountdownDual() {
  const enDays = getDaysRemaining(EXAM_DATES_2026.EN);
  const bacDays = getDaysRemaining(EXAM_DATES_2026.BAC);

  return (
    <View style={styles.countdownDual}>
      <GlassCard dark intensity={18} style={styles.countdownDualCard}>
        <Text style={styles.countdownDualLabel}>Evaluare Națională</Text>
        <Text style={styles.countdownDualNumber}>{enDays}</Text>
        <Text style={styles.countdownDualSuffix}>zile</Text>
      </GlassCard>
      <GlassCard dark intensity={18} style={styles.countdownDualCard}>
        <Text style={styles.countdownDualLabel}>Bacalaureat</Text>
        <Text style={styles.countdownDualNumber}>{bacDays}</Text>
        <Text style={styles.countdownDualSuffix}>zile</Text>
      </GlassCard>
    </View>
  );
}
