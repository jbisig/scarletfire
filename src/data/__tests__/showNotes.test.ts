import { SHOW_NOTES, SHOW_NOTES_CITATION } from '../showNotes';
import { getShowNotes } from '../../utils/showNotes';

const entries = Object.entries(SHOW_NOTES);

/**
 * showNotes.ts is generated from the Taper's Compendium PDFs by
 * scripts/parse_compendium_pdf.py. The failure modes are structural — one
 * show's note picking up another entry's text, or page furniture surviving the
 * clean — so these guard the shape of the generated data, not its wording.
 */
describe('SHOW_NOTES', () => {
  it('spans the three volumes, 1965 to 1995', () => {
    expect(entries.length).toBeGreaterThan(900);
    const years = new Set(entries.map(([date]) => date.slice(0, 4)));
    // One year sampled per volume.
    expect(years.has('1970')).toBe(true);   // vol 1
    expect(years.has('1977')).toBe(true);   // vol 2
    expect(years.has('1990')).toBe(true);   // vol 3
  });

  it('keys on sorted ISO dates inside the range the Compendium covers', () => {
    const dates = entries.map(([date]) => date);
    expect(dates).toEqual([...dates].sort());
    for (const date of dates) {
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const year = Number(date.slice(0, 4));
      expect(year).toBeGreaterThanOrEqual(1959);
      expect(year).toBeLessThanOrEqual(1995);
    }
  });

  it('carries no tape metadata from the entry heading', () => {
    const metadata = /(^|\n)\s*(?:\d+\s*\.+\s*)?(Source|Highlights|Genealogy|Personnel|Taper|Comments):/;
    for (const [date, text] of entries) {
      expect([date, metadata.test(text)]).toEqual([date, false]);
    }
  });

  it('carries no text belonging to another entry', () => {
    // A reviewer's name in caps closes a review. One in the middle of a note
    // means a second entry was glued on.
    const bylineMidText = /\n[A-Z][A-Z .'&-]{4,40}\n/;
    // Running heads and footnotes belong to the page, not to the review.
    const runningHead = /Reviews:\s*(?:January|February|March|April|May|June|July|August|September|October|November|December)?\s*(?:19\d{2}|The Acid Tests)/;
    const footnote = /(^|\n)\d{1,2}\.\s+[A-Z][^\n]{20,}?(?:\bp{1,2}\.\s*\d|interviewed by|quoted in|\(New York)/;

    for (const [date, text] of entries) {
      expect([date, bylineMidText.test(text)]).toEqual([date, false]);
      expect([date, runningHead.test(text)]).toEqual([date, false]);
      expect([date, footnote.test(text)]).toEqual([date, false]);
    }
  });

  it('is reflowed into paragraphs rather than the printed line breaks', () => {
    for (const [date, text] of entries) {
      expect([date, /\n{3,}/.test(text)]).toEqual([date, false]);
      expect([date, text.trim()]).toEqual([date, text]);

      const lines = text.split('\n').filter((line) => line.trim() !== '');
      if (lines.length <= 3) continue;
      // The printed column ran to about 55 characters; a reflowed paragraph is
      // far longer than that.
      const average = lines.reduce((total, line) => total + line.length, 0) / lines.length;
      expect([date, average > 90]).toEqual([date, true]);
    }
  });

  it('credits the book', () => {
    expect(SHOW_NOTES_CITATION).toContain("Deadhead's Taping Compendium");
  });
});

describe('getShowNotes', () => {
  it('returns the note for a known date', () => {
    const [date, text] = entries[0];
    expect(getShowNotes(date)).toBe(text);
  });

  it('returns null for a date the book does not cover', () => {
    // The Compendium reviews tapes, not the calendar: it stops at the band's
    // last show, and skips nights no tape is known for.
    expect(getShowNotes('1996-07-04')).toBeNull();
    expect(getShowNotes('1964-03-07')).toBeNull();
  });
});
