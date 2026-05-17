/** MP3: ID3 tag or MPEG frame sync (0xFF 0xE0+). */
export function isLikelyMp3Buffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 16) return false;
  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    return true;
  }
  return bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
}

export function parseTtsErrorFromBuffer(buffer: ArrayBuffer): string | null {
  if (buffer.byteLength > 4096) return null;
  try {
    const text = new TextDecoder().decode(buffer).trim();
    if (!text.startsWith('{')) return null;
    const body = JSON.parse(text) as { error?: string };
    return body.error ?? null;
  } catch {
    return null;
  }
}
