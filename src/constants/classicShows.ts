import { getClassicTier, isClassicShow } from '../data/classicShowsTiers';

// Re-export for backward compatibility
export { getClassicTier, isClassicShow };

export interface Era {
  name: string;
  startYear: number;
  endYear: number;
  description: string;
}

export const ERAS: Era[] = [
  {
    name: 'Acid Test',
    startYear: 1965,
    endYear: 1967,
    description: '1965-1967',
  },
  {
    name: 'Psychedelic',
    startYear: 1967,
    endYear: 1969,
    description: '1967-1969',
  },
  {
    name: 'Pigpen',
    startYear: 1969,
    endYear: 1971,
    description: '1969-1971',
  },
  {
    name: 'Keith & Donna',
    startYear: 1971,
    endYear: 1974,
    description: '1971-1974',
  },
  {
    name: 'Post-hiatus',
    startYear: 1976,
    endYear: 1978,
    description: '1976-1978',
  },
  {
    name: 'Brent Mydland',
    startYear: 1979,
    endYear: 1990,
    description: '1979-1990',
  },
  {
    name: '1990s Final',
    startYear: 1990,
    endYear: 1995,
    description: '1990-1995',
  },
];

// Grateful Dead 101 - Essential shows for first-time listeners
// Curated based on community consensus from Reddit, Archive.org forums, and music publications
export const GRATEFUL_DEAD_101_DATES = [
  '1977-05-08', // Cornell '77 - THE essential show, consensus #1
  '1972-08-27', // Veneta, Oregon - Sunshine Daydream, many rate above Cornell
  '1970-02-13', // Fillmore East - Dick's Picks Vol. 4
  '1972-05-26', // Lyceum Theatre, London - Europe 72 finale
  '1978-12-31', // Winterland Farewell - legendary closing show
  '1970-05-02', // Harpur College - #2 in 1993 Tapers Poll, great acoustic set
  '1977-05-09', // Buffalo Memorial Auditorium - tight and accessible
  '1975-08-13', // Great American Music Hall - One From The Vault
  '1989-07-07', // JFK Stadium - peak Brent era introduction to 80s Dead
  '1990-03-29', // Nassau Coliseum - Branford Marsalis debut, 90s intro
];
