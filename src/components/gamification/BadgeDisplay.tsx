import { Text, View } from 'react-native';
import { gamificationStyles as styles } from '@/components/gamification/gamification.styles';

type BadgeDisplayProps = {
  label: string;
};

export const BadgeDisplay = ({ label }: BadgeDisplayProps) => {
  return (
    <View style={styles.badgeChip}>
      <Text style={styles.badgeChipText}>{label}</Text>
    </View>
  );
};
