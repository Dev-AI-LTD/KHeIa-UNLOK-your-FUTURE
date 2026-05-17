import { Text, View } from 'react-native';
import { gamificationStyles as styles } from '@/components/gamification/gamification.styles';

type CoinsDisplayProps = {
  coins: number;
};

export const CoinsDisplay = ({ coins }: CoinsDisplayProps) => {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statIcon}>🪙</Text>
      <Text style={styles.statText}>Ai {coins} monede</Text>
    </View>
  );
};
