type LogLevel = 'log' | 'warn' | 'error';

function shouldLog(): boolean {
  // Keep logs in dev; silence in release unless explicitly enabled.
  if (typeof __DEV__ !== 'undefined' && __DEV__) return true;
  return false;
}

function safeStringify(value: unknown): string {
  try {
    if (value instanceof Error) return value.message;
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function redact(s: string): string {
  // Best-effort redaction for common token patterns.
  return s
    .replace(/sb_secret_[A-Za-z0-9_-]+/g, 'sb_secret_***')
    .replace(/sk-proj-[A-Za-z0-9_-]+/g, 'sk-proj_***')
    .replace(/sk-[A-Za-z0-9_-]+/g, 'sk_***')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, 'jwt_***');
}

function emit(level: LogLevel, tag: string, args: unknown[]) {
  if (!shouldLog()) return;
  const msg = redact(args.map(safeStringify).join(' '));
  // eslint-disable-next-line no-console
  console[level](`[${tag}] ${msg}`);
}

export const logger = {
  log: (tag: string, ...args: unknown[]) => emit('log', tag, args),
  warn: (tag: string, ...args: unknown[]) => emit('warn', tag, args),
  error: (tag: string, ...args: unknown[]) => emit('error', tag, args),
};

