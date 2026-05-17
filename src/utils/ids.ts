export function shortId(id: string, length = 6): string {
  return id.replace(/-/g, '').slice(0, length);
}
