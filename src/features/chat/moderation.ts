import { supabase } from '@/lib/supabase';

export type ChatReportReason = 'spam' | 'harassment' | 'inappropriate' | 'other';

const REPORT_LABELS: Record<ChatReportReason, string> = {
  spam: 'Spam',
  harassment: 'Hărțuire',
  inappropriate: 'Conținut nepotrivit',
  other: 'Alt motiv',
};

export function chatReportReasonLabel(reason: ChatReportReason): string {
  return REPORT_LABELS[reason];
}

export const CHAT_COMMUNITY_GUIDELINES = `Reguli comunitate KHEYA

• Fii respectuos cu ceilalți elevi.
• Fără ură, hărțuire, conținut sexual sau date personale ale altora.
• Fără spam sau reclame.

Poți raporta mesajele și bloca utilizatori din meniul mesajului.
Pentru încălcări grave: contact@kheya.ro`;

export async function fetchBlockedUserIds(blockerId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('chat_user_blocks')
    .select('blocked_user_id')
    .eq('blocker_id', blockerId);

  if (error) throw error;
  return new Set((data ?? []).map((r) => r.blocked_user_id as string));
}

export async function blockUser(blockerId: string, blockedUserId: string): Promise<void> {
  if (blockerId === blockedUserId) {
    throw new Error('Nu poți bloca propriul cont.');
  }

  const { error } = await supabase.from('chat_user_blocks').insert({
    blocker_id: blockerId,
    blocked_user_id: blockedUserId,
  });

  if (error && !error.message.includes('duplicate')) {
    throw error;
  }
}

export async function unblockUser(blockerId: string, blockedUserId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_user_blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_user_id', blockedUserId);

  if (error) throw error;
}

export async function reportMessage(params: {
  messageId: string;
  reporterId: string;
  reason: ChatReportReason;
  details?: string;
}): Promise<void> {
  const { error } = await supabase.from('chat_message_reports').insert({
    message_id: params.messageId,
    reporter_id: params.reporterId,
    reason: params.reason,
    details: params.details?.trim().slice(0, 500) ?? null,
  });

  if (error) {
    if (error.message.includes('duplicate') || error.code === '23505') {
      throw new Error('Ai raportat deja acest mesaj.');
    }
    throw error;
  }
}
