import { Text, View } from 'react-native';
import { gamificationStyles as styles } from '@/components/gamification/gamification.styles';

type StreakCounterProps = {
  streak: number;
};

export const StreakCounter = ({ streak }: StreakCounterProps) => {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statIcon}>{streak > 0 ? '🔥' : '❄️'}</Text>
      <Text style={styles.statText}>
        {streak} {streak === 1 ? 'zi' : 'zile'} la rând
      </Text>
    </View>
  );
};
