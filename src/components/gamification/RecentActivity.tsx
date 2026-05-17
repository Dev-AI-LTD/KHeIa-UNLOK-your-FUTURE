import { Text, View } from 'react-native';
import type { CoinTransaction } from '@/services/gamification.service';
import { gamificationStyles as styles } from '@/components/gamification/gamification.styles';

type RecentActivityProps = {
  transactions: CoinTransaction[];
};

const sourceLabels: Record<string, string> = {
  quiz: 'Quiz',
  test: 'Test',
  chapter: 'Capitol citit',
  daily: 'Login zilnic',
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return 'Azi';
  if (diff < 172800000) return 'Ieri';
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
};

const getSourceLabel = (tx: CoinTransaction) => {
  if (tx.type === 'redeem') return 'Răscumpărare premiu';
  return sourceLabels[tx.source] ?? tx.source;
};

export const RecentActivity = ({ transactions }: RecentActivityProps) => {
  if (transactions.length === 0) {
    return <Text style={styles.emptyText}>Nicio activitate recentă</Text>;
  }

  return (
    <View style={styles.list}>
      {transactions.map((tx) => (
        <View key={tx.id} style={styles.listRow}>
          <Text style={styles.listRowLabel} numberOfLines={1}>
            {getSourceLabel(tx)}
          </Text>
          <Text
            style={[
              styles.listRowAmount,
              tx.amount >= 0 ? styles.amountEarn : styles.amountRedeem,
            ]}
          >
            {tx.amount >= 0 ? '+' : ''}
            {tx.amount}
          </Text>
          <Text style={styles.listRowDate}>{formatDate(tx.created_at)}</Text>
        </View>
      ))}
    </View>
  );
};
