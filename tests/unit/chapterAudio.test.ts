import {
  buildTheorySections,
  isReadableTheoryText,
} from '../../src/services/chapterAudio.utils';

describe('chapterAudio helpers', () => {
  describe('isReadableTheoryText', () => {
    it('rejects empty and placeholder content', () => {
      expect(isReadableTheoryText('')).toBe(false);
      expect(isReadableTheoryText('Conținut în pregătire.')).toBe(false);
      expect(
        isReadableTheoryText(
          'Materialul detaliat pentru această secțiune va fi adăugat în curând.',
        ),
      ).toBe(false);
    });

    it('accepts real theory paragraphs', () => {
      expect(isReadableTheoryText('Fotosinteza transformă lumina în energie.')).toBe(true);
    });
  });

  describe('buildTheorySections', () => {
    it('skips placeholders and prefixes section titles', () => {
      const sections = buildTheorySections(
        [
          'Fotosinteza este esențială.',
          'Materialul detaliat pentru această secțiune va fi adăugat în curând.',
          'Clorofila absoarbe lumină.',
        ],
        ['Introducere', 'Secțiune goală', 'Detalii'],
      );
      expect(sections).toHaveLength(2);
      expect(sections[0].text).toContain('Introducere');
      expect(sections[0].text).toContain('Fotosinteza');
      expect(sections[1].text).toContain('Detalii');
    });

    it('returns empty when all sections are placeholders', () => {
      const sections = buildTheorySections(['Conținut în pregătire.'], ['S1']);
      expect(sections).toHaveLength(0);
    });
  });
});
