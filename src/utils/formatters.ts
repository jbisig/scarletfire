import { format } from 'date-fns';

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
