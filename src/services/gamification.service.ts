import { supabase } from './supabase';

export type UserGamification = {
  user_id: string;
  coins: number;
  total_xp: number;
  streak_days: number;
  consecutive_days_active: number;
  last_streak_at: string | null;
  updated_at: string;
};

export type CoinTransaction = {
  id: string;
  user_id: string;
  amount: number;
  type: 'earn' | 'redeem';
  source: string;
  source_id: string | null;
  created_at: string;
};

export type Reward = {
  id: string;
  name: string;
  description: string | null;
  coins_cost: number;
  partner_name: string | null;
  partner_location: string | null;
  reward_type: string;
  is_active: boolean;
  image_url: string | null;
};

/**
 * Computes level from XP total.
 */
export function getLevelFromXP(totalXp: number) {
  return Math.floor((totalXp ?? 0) / 100) + 1;
}

/**
 * Returns XP multiplier based on consecutive days active.
 * 0 days: 1.0x, 3 days: 1.25x, 7 days: 1.5x, 14 days: 1.75x, 21+ days: 2x
 */
export function getXPMultiplier(consecutiveDaysActive: number): number {
  if (consecutiveDaysActive >= 21) return 2;
  if (consecutiveDaysActive >= 14) return 1.75;
  if (consecutiveDaysActive >= 7) return 1.5;
  if (consecutiveDaysActive >= 3) return 1.25;
  return 1;
}

/**
 * XP needed for next level (from current XP).
 */
export function getXPForNextLevel(totalXp: number) {
  const currentLevel = getLevelFromXP(totalXp);
  const nextLevelBase = currentLevel * 100;
  return Math.max(0, nextLevelBase - (totalXp ?? 0));
}

/**
 * Fetches user gamification data from Supabase.
 * Creates row if not exists.
 */
export async function getUserGamification(userId: string): Promise<UserGamification | null> {
  const { data, error } = await supabase
    .from('user_gamification')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      const { data: inserted } = await supabase
        .from('user_gamification')
        .insert({ user_id: userId })
        .select()
        .single();
      return inserted as UserGamification;
    }
    return null;
  }
  return data as UserGamification;
}

export type CoinSource = 'quiz' | 'test' | 'chapter' | 'daily';

/**
 * Start of today (UTC) as ISO string for "once per day" checks.
 */
function startOfTodayISO(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}T00:00:00.000Z`;
}

/**
 * Awards coins to user and records transaction.
 * Skips if already awarded for this source+sourceId.
 * For 'test': allows once per day (same test can award again tomorrow).
 */
export async function awardCoins(
  userId: string,
  amount: number,
  source: CoinSource,
  sourceId?: string
): Promise<{ success: boolean; newCoins?: number }> {
  if (sourceId) {
    const todayStart = startOfTodayISO();
    const query = supabase
      .from('coin_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('source', source)
      .eq('source_id', sourceId)
      .eq('type', 'earn')
      .gte('created_at', todayStart)
      .limit(1)
      .maybeSingle();

    if (source === 'test') {
      const { data: existing } = await query;
      if (existing) return { success: true };
    } else {
      const { data: existing } = await supabase
        .from('coin_transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('source', source)
        .eq('source_id', sourceId)
        .eq('type', 'earn')
        .limit(1)
        .maybeSingle();
      if (existing) return { success: true };
    }
  }

  const { data: row } = await supabase
    .from('user_gamification')
    .select('coins')
    .eq('user_id', userId)
    .single();

  if (!row) {
    await supabase.from('user_gamification').insert({ user_id: userId, coins: 0 });
  }

  let { data: current } = await supabase
    .from('user_gamification')
    .select('coins')
    .eq('user_id', userId)
    .single();

  if (!current) {
    const { error: ins } = await supabase
      .from('user_gamification')
      .insert({ user_id: userId, coins: amount });
    if (ins) return { success: false };
  } else {
    const newCoins = (current.coins ?? 0) + amount;
    const { error: upd } = await supabase
      .from('user_gamification')
      .update({ coins: newCoins, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (upd) return { success: false };
  }

  await supabase.from('coin_transactions').insert({
    user_id: userId,
    amount,
    type: 'earn',
    source,
    source_id: sourceId ?? null,
  });

  const { data: updated } = await supabase
    .from('user_gamification')
    .select('coins')
    .eq('user_id', userId)
    .single();

  return { success: true, newCoins: updated?.coins ?? amount };
}

/**
 * Updates streak on daily login. Awards daily coins.
 * Returns { streakDays, coinsAwarded }.
 */
export async function updateStreak(userId: string): Promise<{
  streakDays: number;
  coinsAwarded: number;
}> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: row } = await supabase
    .from('user_gamification')
    .select('streak_days, last_streak_at')
    .eq('user_id', userId)
    .single();

  if (!row) {
    await supabase.from('user_gamification').insert({
      user_id: userId,
      streak_days: 1,
      consecutive_days_active: 1,
      last_streak_at: today,
    });
    const coins = 2 + 1;
    await awardCoins(userId, coins, 'daily');
    return { streakDays: 1, coinsAwarded: coins };
  }

  const lastStr = row.last_streak_at as string | null;
  let newStreak = 1;
  if (lastStr) {
    const last = new Date(lastStr);
    const diff = Math.floor((new Date(today).getTime() - last.getTime()) / 86400000);
    if (diff === 0) return { streakDays: row.streak_days ?? 1, coinsAwarded: 0 };
    if (diff === 1) newStreak = (row.streak_days ?? 0) + 1;
  }

  const bonus = Math.min(newStreak - 1, 5);
  const coins = 2 + bonus;

  await supabase
    .from('user_gamification')
    .update({
      streak_days: newStreak,
      consecutive_days_active: newStreak,
      last_streak_at: today,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  await awardCoins(userId, coins, 'daily');

  return { streakDays: newStreak, coinsAwarded: coins };
}

/**
 * Redeems a reward. Deducts coins and creates redemption.
 * Răscumpărarea premiilor va urma.
 */
export async function redeemReward(
  _userId: string,
  _rewardId: string
): Promise<{ success: boolean; voucherCode?: string; error?: string }> {
  return { success: false, error: 'Răscumpărarea premiilor va urma.' };
}


/**
 * Fetches recent coin transactions.
 */
export async function getRecentTransactions(
  userId: string,
  limit = 10
): Promise<CoinTransaction[]> {
  const { data } = await supabase
    .from('coin_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as CoinTransaction[];
}

/**
 * Adds XP to user. Applies streak-based multiplier.
 * Call from quiz/test completion – does not modify awardCoins or updateStreak.
 */
export async function addXP(
  userId: string,
  amount: number
): Promise<{ success: boolean; newTotalXp?: number; multiplier?: number }> {
  if (!userId || amount <= 0) return { success: false };

  const { data: row } = await supabase
    .from('user_gamification')
    .select('total_xp, streak_days, consecutive_days_active')
    .eq('user_id', userId)
    .single();

  const consecutiveDays = (row?.consecutive_days_active ?? row?.streak_days ?? 0) as number;
  const multiplier = getXPMultiplier(consecutiveDays);
  const finalAmount = Math.round(amount * multiplier);

  if (!row) {
    const { error } = await supabase
      .from('user_gamification')
      .insert({ user_id: userId, total_xp: finalAmount });
    if (error) return { success: false };
    return { success: true, newTotalXp: finalAmount, multiplier };
  }

  const newTotalXp = (row.total_xp ?? 0) + finalAmount;
  const { error } = await supabase
    .from('user_gamification')
    .update({ total_xp: newTotalXp, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (error) return { success: false };
  return { success: true, newTotalXp, multiplier };
}

/**
 * Helper – derives summary from UserGamification (read-only).
 */
export function getGamificationSummary(user: UserGamification) {
  const totalXP = user.total_xp ?? 0;
  const level = getLevelFromXP(totalXP);
  const xpForNextLevel = getXPForNextLevel(totalXP);

  const progressWithinLevel = totalXP % 100;
  const xpProgress = xpForNextLevel === 0 ? 1 : progressWithinLevel / 100;

  return {
    level,
    xpProgress,
    totalXP,
    coins: user.coins ?? 0,
    streak: user.streak_days ?? 0,
  };
}

export type SchoolLeaderboardEntry = {
  user_id: string;
  school: string;
  total_xp: number;
  coins: number;
  rank: number;
  display_name: string | null;
  avatar_url: string | null;
  study_year: string | null;
  city: string | null;
};

export type SchoolLeaderboard = {
  school: string;
  entries: SchoolLeaderboardEntry[];
};

/**
 * Returns leaderboard grouped by school.
 * Users are ranked by total_xp within each school.
 * Requires profiles.school to be set.
 */
export async function getSchoolLeaderboard(
  limitPerSchool = 10
): Promise<SchoolLeaderboard[]> {
  const { data: rows, error } = await supabase
    .from('profiles')
    .select('id, school, display_name, avatar_url, study_year, city')
    .not('school', 'is', null);

  if (error || !rows?.length) return [];

  type ProfileRow = {
    id: string;
    school: string;
    display_name: string | null;
    avatar_url: string | null;
    study_year: string | null;
    city: string | null;
  };

  const profileById = new Map<string, ProfileRow>();
  const schoolIds = new Map<string, string[]>();

  for (const r of rows as ProfileRow[]) {
    const school = (r.school ?? '').trim();
    if (!school) continue;
    profileById.set(r.id, r);
    const list = schoolIds.get(school) ?? [];
    list.push(r.id);
    schoolIds.set(school, list);
  }

  const result: SchoolLeaderboard[] = [];
  for (const [school, userIds] of schoolIds) {
    const { data: gam } = await supabase
      .from('user_gamification')
      .select('user_id, total_xp, coins')
      .in('user_id', userIds)
      .order('total_xp', { ascending: false })
      .limit(limitPerSchool);

    const entries: SchoolLeaderboardEntry[] = (gam ?? []).map((g, i) => {
      const profile = profileById.get(g.user_id);
      return {
        user_id: g.user_id,
        school,
        total_xp: g.total_xp ?? 0,
        coins: g.coins ?? 0,
        rank: i + 1,
        display_name: profile?.display_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
        study_year: profile?.study_year ?? null,
        city: profile?.city ?? null,
      };
    });

    if (entries.length > 0) {
      result.push({ school, entries });
    }
  }

  result.sort((a, b) => {
    const maxA = Math.max(...a.entries.map((e) => e.total_xp));
    const maxB = Math.max(...b.entries.map((e) => e.total_xp));
    return maxB - maxA;
  });

  return result;
}

/**
 * Builds shareable text for a "Progress Certificate" (quiz score).
 * Can be shared on Instagram/TikTok as caption or story text.
 */
export function buildProgressCertificateShareText(
  correctCount: number,
  totalQuestions: number,
  chapterTitle?: string
): string {
  const pct = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const chapter = chapterTitle ? ` la ${chapterTitle}` : '';
  return `Am obținut ${correctCount}/${totalQuestions} (${pct}%)${chapter} pe KHEYA! 📚 Pregătire Evaluare Națională 2026 și BAC. Încearcă și tu!`;
}

/**
 * Builds shareable text for a test result (score).
 */
export function buildTestResultShareText(
  correctCount: number,
  totalCount: number,
  subjectName?: string
): string {
  const pct = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const subject = subjectName ? ` la ${subjectName}` : '';
  return `Am obținut ${correctCount}/${totalCount} (${pct}%)${subject} pe KHEYA! 📚 Pregătire Evaluare Națională 2026 și BAC. Încearcă și tu!`;
}

/**
 * Fetches active rewards from catalog.
 */
export async function getRewardsCatalog(): Promise<Reward[]> {
  const { data, error } = await supabase
    .from('rewards_catalog')
    .select('*')
    .eq('is_active', true)
    .order('coins_cost', { ascending: true });
  if (error) return [];
  return (data ?? []) as Reward[];
}
