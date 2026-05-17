import { Text, View } from 'react-native';
import { gamificationStyles as styles } from '@/components/gamification/gamification.styles';

type BadgeChipProps = {
  label: string;
};

export const BadgeChip = ({ label }: BadgeChipProps) => {
  return (
    <View style={styles.badgeChip}>
      <Text style={styles.badgeChipText}>{label}</Text>
    </View>
  );
};
