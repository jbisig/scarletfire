import { getClassicTier, isClassicShow } from '../data/classicShowsTiers';

// Re-export for backward compatibility
export { getClassicTier, isClassicShow };

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
