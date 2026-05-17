export type TheorySection = {
  title?: string;
  text: string;
};

export function isReadableTheoryText(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (t === 'Conținut în pregătire.') return false;
  if (t.includes('Materialul detaliat') && t.includes('va fi adăugat')) return false;
  return true;
}

export function buildTheorySections(
  sectionContents: string[],
  sectionTitles: string[] = [],
): TheorySection[] {
  const sections: TheorySection[] = [];
  sectionContents.forEach((raw, i) => {
    if (!isReadableTheoryText(raw)) return;
    const title = sectionTitles[i]?.trim();
    const prefix = title ? `${title}. ` : '';
    sections.push({
      title: title || undefined,
      text: `${prefix}${raw.trim()}`,
    });
  });
  return sections;
}
