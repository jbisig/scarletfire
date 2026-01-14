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

// Top 50 Classic/Famous Grateful Dead shows
export const CLASSIC_SHOW_DATES = [
  // 1960s - Psychedelic Era
  '1968-02-14', // Carousel Ballroom Valentine's Day
  '1968-08-23', // Fillmore West - Primal Dead
  '1969-01-26', // Avalon Ballroom
  '1969-02-27', // Fillmore West - Live/Dead era
  '1969-04-06', // Avalon Ballroom

  // 1970-71 - Pigpen Era
  '1970-02-14', // Fillmore East Valentine's Day
  '1970-05-02', // Harpur College
  '1970-09-19', // Fillmore East
  '1971-04-29', // Fillmore East - Closing Night
  '1971-08-06', // Hollywood Palladium

  // 1972 - Europe '72 & Peak Year
  '1972-04-08', // Wembley Empire Pool
  '1972-05-03', // Olympia Theatre, Paris
  '1972-05-04', // Olympia Theatre, Paris
  '1972-05-08', // Bickershaw Festival
  '1972-05-11', // Rotterdam
  '1972-05-26', // Lyceum Theatre, London
  '1972-08-27', // Veneta, Oregon (Sunshine Daydream)
  '1972-12-31', // Winterland NYE

  // 1973 - Wall of Sound Era
  '1973-02-09', // Maples Pavilion
  '1973-02-15', // Danish Radio Concert Hall
  '1973-03-24', // Philadelphia Spectrum
  '1973-05-08', // Kezar Stadium
  '1973-06-10', // RFK Stadium
  '1973-09-08', // Nassau Coliseum
  '1973-11-10', // Winterland
  '1973-12-02', // Boston Music Hall

  // 1974 - Final Pre-Hiatus Year
  '1974-02-24', // Winterland
  '1974-03-23', // Cow Palace
  '1974-05-19', // Portland Memorial Coliseum
  '1974-06-18', // Freedom Hall, Louisville
  '1974-06-23', // Jai-Alai Fronton
  '1974-07-31', // Dillon Stadium

  // 1976-78 - Post-Hiatus/Donna Era
  '1976-06-09', // Boston Music Hall - Return from Hiatus
  '1976-06-14', // Beacon Theatre
  '1977-02-26', // Swing Auditorium
  '1977-05-05', // New Haven
  '1977-05-08', // Cornell '77 (Barton Hall)
  '1977-05-09', // Buffalo Memorial Auditorium
  '1977-05-17', // Tuscaloosa, Alabama
  '1977-05-19', // Fox Theatre, Atlanta
  '1977-05-22', // Pembroke Pines
  '1977-05-25', // The Mosque, Richmond
  '1977-11-06', // Broome County Arena
  '1978-05-07', // Field House, Cornell

  // 1979-90 - Brent Mydland Era
  '1979-11-01', // Nassau Coliseum
  '1980-05-16', // Barton Hall
  '1983-09-11', // Santa Fe Downs
  '1989-07-17', // Alpine Valley
  '1990-03-29', // Nassau Coliseum (Branford Marsalis)
];

export function isClassicShow(date: string): boolean {
  // Extract just the date part (YYYY-MM-DD) from ISO timestamp if present
  const dateOnly = date.split('T')[0];
  return CLASSIC_SHOW_DATES.includes(dateOnly);
}

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
