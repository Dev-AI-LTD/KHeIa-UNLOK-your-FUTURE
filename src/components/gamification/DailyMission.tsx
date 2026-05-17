import { Text } from 'react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { gamificationStyles as styles } from '@/components/gamification/gamification.styles';

type DailyMissionProps = {
  text: string;
};

export const DailyMission = ({ text }: DailyMissionProps) => {
  return (
    <GlassCard dark intensity={14}>
      <Text style={styles.missionText}>{text}</Text>
    </GlassCard>
  );
};
