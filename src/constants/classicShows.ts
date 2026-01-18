import { getClassicTier, isClassicShow, ALL_CLASSIC_SHOWS } from '../data/classicShowsTiers';

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

// Top Classic/Famous Grateful Dead shows - now sourced from tiered structure
export const CLASSIC_SHOW_DATES = ALL_CLASSIC_SHOWS.map(show => show.date);

export function getEraForYear(year: number): Era | null {
  return ERAS.find(era => year >= era.startYear && year <= era.endYear) || null;
}

export function getClassicShowsByEra(era: Era, allShows: any[]): any[] {
  return allShows.filter(show => {
    const showYear = parseInt(show.year);
    return showYear >= era.startYear &&
           showYear <= era.endYear &&
           isClassicShow(show.date);
  });
}

// Grateful Dead 101 - Essential shows for first-time listeners
export const GRATEFUL_DEAD_101_DATES = [
  '1970-02-13', // Fillmore East
  '1972-04-14', // Tivolis Koncertsal, Copenhagen
  '1975-08-13', // Great American Music Hall
  '1977-05-08', // Barton Hall, Cornell University
  '1968-10-12', // Avalon Ballroom, San Francisco
  '1978-07-08', // Red Rocks Amphitheatre
  '1990-03-09', // Madison Square Garden
  '1989-10-16', // Winterland
  '1973-07-28', // Watkins Glen Summer Jam (July 28, 1973 - soundcheck was July 27)
  '1990-09-21', // Auditorio Nacional, Mexico City
];
