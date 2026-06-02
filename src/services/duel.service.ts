import * as Linking from 'expo-linking';
import { supabase } from './supabase';

export type DuelSession = {
  id: string;
  creator_id: string;
  opponent_id: string | null;
  subject_id: string | null;
  chapter_id: string | null;
  status: 'pending' | 'active' | 'completed' | 'expired';
  invite_code: string | null;
  creator_score: number;
  opponent_score: number;
  created_at: string;
  expires_at: string | null;
};

const INVITE_CODE_REGEX = /^[A-Z0-9]{4,12}$/;

function normalizeInviteCode(code: string): string {
  return code.toUpperCase().trim();
}

export function isValidInviteCode(inviteCode: string): boolean {
  return INVITE_CODE_REGEX.test(normalizeInviteCode(inviteCode));
}

/**
 * Creates a duel session and returns the session ID plus invitation link.
 */
export async function createDuelSession(
  creatorId: string,
  options?: { subjectId?: string; chapterId?: string }
): Promise<{ sessionId: string; inviteCode: string; inviteLink: string } | null> {
  const { data, error } = await supabase
    .from('duel_sessions')
    .insert({
      creator_id: creatorId,
      subject_id: options?.subjectId ?? null,
      chapter_id: options?.chapterId ?? null,
      status: 'pending',
    })
    .select('id, invite_code')
    .single();

  if (error || !data) return null;

  const inviteCode = (data.invite_code as string) ?? '';
  const inviteLink = buildDuelInviteLink(inviteCode);

  return {
    sessionId: data.id as string,
    inviteCode,
    inviteLink,
  };
}

/**
 * Builds deep link for joining a duel via invite code.
 */
export function buildDuelInviteLink(inviteCode: string): string {
  return Linking.createURL(`duel/${inviteCode}`);
}

/**
 * Builds share message for duel invitation.
 */
export function buildDuelShareMessage(inviteCode: string, inviteLink: string): string {
  return `Provocare duel pe KHEYA! Introdu codul ${inviteCode} sau deschide: ${inviteLink}`;
}

/**
 * Joins a duel session by invite code.
 */
export async function joinDuelByCode(
  opponentId: string,
  inviteCode: string
): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  if (!isValidInviteCode(inviteCode)) {
    return { success: false, error: 'Cod invalid.' };
  }
  const { data: session, error: findErr } = await supabase
    .from('duel_sessions')
    .select('id, creator_id, status, expires_at')
    .eq('invite_code', normalizeInviteCode(inviteCode))
    .maybeSingle();

  if (findErr || !session) {
    return { success: false, error: 'Cod invalid.' };
  }

  if (session.status !== 'pending') {
    return { success: false, error: 'Duelul a expirat sau s-a încheiat.' };
  }

  if (session.creator_id === opponentId) {
    return { success: false, error: 'Nu poți intra în propriul duel.' };
  }

  const expiresAt = session.expires_at as string | null;
  if (expiresAt && new Date(expiresAt) < new Date()) {
    await supabase
      .from('duel_sessions')
      .update({ status: 'expired' })
      .eq('id', session.id);
    return { success: false, error: 'Invitația a expirat.' };
  }

  const { error: updErr } = await supabase
    .from('duel_sessions')
    .update({
      opponent_id: opponentId,
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.id);

  if (updErr) return { success: false, error: 'Eroare la conectare.' };

  return { success: true, sessionId: session.id as string };
}
