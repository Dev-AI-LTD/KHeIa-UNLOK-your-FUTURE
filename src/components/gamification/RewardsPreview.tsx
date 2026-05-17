import { Text, View, Pressable } from 'react-native';
import type { Reward } from '@/services/gamification.service';
import { GlassCard } from '@/components/ui/GlassCard';
import { gamificationStyles as styles } from '@/components/gamification/gamification.styles';

type RewardsPreviewProps = {
  rewards: Reward[];
  onViewAll: () => void;
};

export const RewardsPreview = ({ rewards, onViewAll }: RewardsPreviewProps) => {
  const topRewards = rewards.slice(0, 2);

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Premii disponibile</Text>
        <Pressable
          onPress={onViewAll}
          style={({ pressed }) => [styles.sectionLink, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Schimbă premii"
        >
          <Text style={styles.sectionLinkText}>Schimbă premii →</Text>
        </Pressable>
      </View>

      {topRewards.length === 0 ? (
        <Text style={styles.emptyText}>Nicio premiu disponibil momentan</Text>
      ) : (
        <View style={styles.list}>
          {topRewards.map((r) => (
            <GlassCard key={r.id} dark intensity={14}>
              <View style={styles.rewardCardRow}>
                <Text style={styles.rewardName} numberOfLines={2}>
                  {r.name}
                </Text>
                <Text style={styles.rewardCost}>{r.coins_cost} monede</Text>
              </View>
            </GlassCard>
          ))}
        </View>
      )}
    </View>
  );
};
