/**
 * Emailuri pentru conturi Apple/Google review — Premium din Supabase, fără achiziție RC.
 * Setează EXPO_PUBLIC_REVIEW_ACCOUNT_EMAILS în .env / EAS (virgulă între adrese).
 */
const DEFAULT_REVIEW_EMAIL = 'contact@devaieood.com';

function parseReviewEmails(raw: string | undefined): string[] {
  const value = (raw ?? DEFAULT_REVIEW_EMAIL).trim();
  return value
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function getReviewAccountEmails(): string[] {
  return parseReviewEmails(process.env.EXPO_PUBLIC_REVIEW_ACCOUNT_EMAILS);
}

export function isReviewAccountEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getReviewAccountEmails().includes(email.trim().toLowerCase());
}
