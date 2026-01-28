import { format } from 'date-fns';

/**
 * Extract venue name from show title (more accurate than venue field)
 * Title format: "Grateful Dead Live at {Venue} on {Date}"
 * Works with any object that has title and venue properties
 */
export function getVenueFromShow(show: { title?: string; venue?: string }): string {
  if (show.title) {
    const match = show.title.match(/Live at (.+?) on \d{4}-\d{2}-\d{2}/);
    if (match && match[1]) {
      return match[1];
    }
  }
  return show.venue || 'Unknown Venue';
}

export function formatDate(dateString: string): string {
  try {
    // Handle full ISO timestamps (e.g., "1966-01-01T00:00:00Z") by extracting date portion
    const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString;

    // Parse ISO date without timezone conversion to avoid off-by-one day errors
    const [year, month, day] = datePart.split('-').map(Number);
    // Create date in local timezone (month is 0-indexed in Date constructor)
    const date = new Date(year, month - 1, day);
    return format(date, 'MM/dd/yyyy');
  } catch {
    return dateString;
  }
}

export function formatDateShort(dateString: string): string {
  try {
    // Handle full ISO timestamps (e.g., "1966-01-01T00:00:00Z") by extracting date portion
    const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString;

    // Parse ISO date without timezone conversion to avoid off-by-one day errors
    const [year, month, day] = datePart.split('-').map(Number);
    // Create date in local timezone (month is 0-indexed in Date constructor)
    const date = new Date(year, month - 1, day);
    return format(date, 'MM/dd');
  } catch {
    return dateString;
  }
}

export function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0 || isNaN(seconds)) return '--:--';

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatDownloads(downloads?: number): string {
  if (!downloads) return '0';

  if (downloads >= 1000000) {
    return `${(downloads / 1000000).toFixed(1)}M`;
  } else if (downloads >= 1000) {
    return `${(downloads / 1000).toFixed(1)}K`;
  }
  return downloads.toString();
}

// Month name to number mapping
const MONTH_NAMES: { [key: string]: number } = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

interface ParsedDate {
  year?: number;
  month?: number;
  day?: number;
}

/**
 * Parse a fuzzy date query into components
 * Supports formats like: 5/8/77, 5-8-1977, May 8, 8 May 1977, 1977-05-08, etc.
 */
function parseFuzzyDate(query: string): ParsedDate | null {
  const cleaned = query.trim().toLowerCase();
  if (!cleaned) return null;

  // Check for text month (e.g., "May 8", "8 May", "May 8 1977", "May 8, 1977")
  const monthMatch = cleaned.match(/([a-z]+)/);
  if (monthMatch) {
    const monthNum = MONTH_NAMES[monthMatch[1]];
    if (monthNum) {
      // Extract numbers from the rest
      const numbers = cleaned.match(/\d+/g)?.map(Number) || [];

      if (numbers.length === 0) {
        // Just month name: "May" or "December"
        return { month: monthNum };
      } else if (numbers.length === 1) {
        // Month and day: "May 8" or "8 May"
        const num = numbers[0];
        if (num >= 1 && num <= 31) {
          return { month: monthNum, day: num };
        } else if (num >= 65 && num <= 95) {
          // Could be a 2-digit year: "May 77"
          return { month: monthNum, year: 1900 + num };
        } else if (num >= 1965 && num <= 1995) {
          // 4-digit year: "May 1977"
          return { month: monthNum, year: num };
        }
      } else if (numbers.length >= 2) {
        // Month, day, and possibly year: "May 8 1977" or "8 May 1977"
        let day: number | undefined;
        let year: number | undefined;

        for (const num of numbers) {
          if (num >= 1 && num <= 31 && !day) {
            day = num;
          } else if (num >= 65 && num <= 95) {
            year = 1900 + num;
          } else if (num >= 1965 && num <= 1995) {
            year = num;
          }
        }

        return { month: monthNum, day, year };
      }
    }
  }

  // Numeric date formats with various separators
  // Match patterns like: 5/8/77, 05-08-1977, 1977.05.08, etc.
  const parts = cleaned.split(/[\/\-\.\s,]+/).filter(p => /^\d+$/.test(p)).map(Number);

  if (parts.length === 0) return null;

  if (parts.length === 1) {
    const num = parts[0];
    // Single number could be year
    if (num >= 65 && num <= 95) {
      return { year: 1900 + num };
    } else if (num >= 1965 && num <= 1995) {
      return { year: num };
    }
    // Could be month
    if (num >= 1 && num <= 12) {
      return { month: num };
    }
    return null;
  }

  if (parts.length === 2) {
    const [first, second] = parts;
    // Likely month/day: "5/8" or "05/08"
    if (first >= 1 && first <= 12 && second >= 1 && second <= 31) {
      return { month: first, day: second };
    }
    // Could be year/month: "77/5" or "1977/05"
    if ((first >= 65 && first <= 95) || (first >= 1965 && first <= 1995)) {
      const year = first >= 1965 ? first : 1900 + first;
      if (second >= 1 && second <= 12) {
        return { year, month: second };
      }
    }
    return null;
  }

  if (parts.length >= 3) {
    const [first, second, third] = parts;

    // Check for year-first format: 1977-05-08 or 77-5-8
    if ((first >= 65 && first <= 95) || (first >= 1965 && first <= 1995)) {
      const year = first >= 1965 ? first : 1900 + first;
      if (second >= 1 && second <= 12 && third >= 1 && third <= 31) {
        return { year, month: second, day: third };
      }
    }

    // US format: month/day/year (5/8/77 or 05/08/1977)
    if (first >= 1 && first <= 12 && second >= 1 && second <= 31) {
      let year: number | undefined;
      if (third >= 65 && third <= 95) {
        year = 1900 + third;
      } else if (third >= 1965 && third <= 1995) {
        year = third;
      }
      return { month: first, day: second, year };
    }
  }

  return null;
}

/**
 * Check if an ISO date string (YYYY-MM-DD) matches a fuzzy date query
 */
export function matchesDateQuery(isoDate: string, query: string): boolean {
  // Extract date portion from ISO string
  const datePart = isoDate.includes('T') ? isoDate.split('T')[0] : isoDate;
  const [yearStr, monthStr, dayStr] = datePart.split('-');
  const showYear = parseInt(yearStr, 10);
  const showMonth = parseInt(monthStr, 10);
  const showDay = parseInt(dayStr, 10);

  const parsed = parseFuzzyDate(query);
  if (!parsed) return false;

  // Match based on what was parsed
  if (parsed.year !== undefined && parsed.year !== showYear) return false;
  if (parsed.month !== undefined && parsed.month !== showMonth) return false;
  if (parsed.day !== undefined && parsed.day !== showDay) return false;

  // At least one component must have been specified and matched
  return parsed.year !== undefined || parsed.month !== undefined || parsed.day !== undefined;
}
