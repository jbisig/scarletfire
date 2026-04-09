import { SHOW_NOTES } from '../data/showNotes';

/**
 * Look up show notes by date (YYYY-MM-DD format).
 * Returns the review text from The Deadhead's Taping Compendium, Vol. 1,
 * or null if no entry exists for that date.
 */
export function getShowNotes(date: string): string | null {
  return SHOW_NOTES[date] ?? null;
}
