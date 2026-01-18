export type ClassicTier = 1 | 2 | 3;

export interface ClassicShowEntry {
  date: string;  // YYYY-MM-DD format
  tier: ClassicTier;
  notes?: string;  // Optional: why it's classic
}

// Tier 1: Essential - Top 15 all-time classics
export const TIER_1_SHOWS: ClassicShowEntry[] = [
  { date: '1977-05-08', tier: 1, notes: "Cornell '77 - Barton Hall (legendary)" },
  { date: '1972-08-27', tier: 1, notes: 'Veneta, Oregon - Sunshine Daydream' },
  { date: '1972-05-26', tier: 1, notes: 'Lyceum Theatre, London - Europe 72' },
  { date: '1972-05-03', tier: 1, notes: 'Olympia Theatre, Paris - Europe 72' },
  { date: '1973-11-10', tier: 1, notes: 'Winterland - Dicks Picks Vol. 1' },
  { date: '1974-05-19', tier: 1, notes: 'Portland Memorial Coliseum - Dicks Picks Vol. 2' },
  { date: '1977-05-22', tier: 1, notes: 'Pembroke Pines - legendary Scarlet>Fire' },
  { date: '1968-02-14', tier: 1, notes: 'Carousel Ballroom - primal Dead' },
  { date: '1970-02-14', tier: 1, notes: 'Fillmore East - Dicks Picks Vol. 4' },
  { date: '1977-05-09', tier: 1, notes: 'Buffalo Memorial Auditorium' },
  { date: '1972-12-31', tier: 1, notes: 'Winterland NYE' },
  { date: '1973-12-02', tier: 1, notes: 'Boston Music Hall - Dicks Picks Vol. 14' },
  { date: '1974-06-18', tier: 1, notes: 'Freedom Hall - Dicks Picks Vol. 12' },
  { date: '1971-04-29', tier: 1, notes: 'Fillmore East - Closing Night' },
  { date: '1972-05-04', tier: 1, notes: 'Olympia Theatre, Paris - Europe 72' },
];

// Tier 2: Excellent - ~35 highly regarded shows
export const TIER_2_SHOWS: ClassicShowEntry[] = [
  // May 1977 run (excluding Tier 1 shows)
  { date: '1977-05-05', tier: 2, notes: 'New Haven - May 77' },
  { date: '1977-05-17', tier: 2, notes: 'Tuscaloosa - May 77' },
  { date: '1977-05-19', tier: 2, notes: 'Fox Theatre, Atlanta - May 77' },
  { date: '1977-05-25', tier: 2, notes: 'The Mosque, Richmond - May 77' },

  // 1972 Europe tour
  { date: '1972-04-08', tier: 2, notes: 'Wembley Empire Pool' },
  { date: '1972-05-08', tier: 2, notes: 'Bickershaw Festival' },
  { date: '1972-05-11', tier: 2, notes: 'Rotterdam' },

  // 1973-74 Wall of Sound era
  { date: '1973-02-09', tier: 2, notes: 'Maples Pavilion' },
  { date: '1973-02-15', tier: 2, notes: 'Danish Radio Concert Hall' },
  { date: '1973-03-24', tier: 2, notes: 'Philadelphia Spectrum' },
  { date: '1973-06-10', tier: 2, notes: 'RFK Stadium' },
  { date: '1973-09-08', tier: 2, notes: 'Nassau Coliseum' },
  { date: '1974-02-24', tier: 2, notes: 'Winterland' },
  { date: '1974-03-23', tier: 2, notes: 'Cow Palace' },
  { date: '1974-06-23', tier: 2, notes: 'Jai-Alai Fronton' },
  { date: '1974-07-31', tier: 2, notes: 'Dillon Stadium' },

  // 1976-78 Post-hiatus
  { date: '1976-06-09', tier: 2, notes: 'Boston Music Hall - Return from Hiatus' },
  { date: '1976-06-14', tier: 2, notes: 'Beacon Theatre' },
  { date: '1977-02-26', tier: 2, notes: 'Swing Auditorium' },
  { date: '1977-11-06', tier: 2, notes: 'Broome County Arena' },
  { date: '1978-05-07', tier: 2, notes: 'Field House, Cornell' },

  // 1970-71 Pigpen era
  { date: '1970-05-02', tier: 2, notes: 'Harpur College' },
  { date: '1970-09-19', tier: 2, notes: 'Fillmore East' },
  { date: '1971-08-06', tier: 2, notes: 'Hollywood Palladium' },

  // 1979-90 Brent era
  { date: '1979-11-01', tier: 2, notes: 'Nassau Coliseum' },
  { date: '1980-05-16', tier: 2, notes: 'Barton Hall' },
  { date: '1983-09-11', tier: 2, notes: 'Santa Fe Downs' },
  { date: '1989-07-17', tier: 2, notes: 'Alpine Valley' },
  { date: '1990-03-29', tier: 2, notes: 'Nassau Coliseum - Branford Marsalis' },

  // Additional classics
  { date: '1973-05-08', tier: 2, notes: 'Kezar Stadium' },
];

// Tier 3: Notable - Remaining classic shows
export const TIER_3_SHOWS: ClassicShowEntry[] = [
  // 1960s psychedelic era
  { date: '1968-08-23', tier: 3, notes: 'Fillmore West' },
  { date: '1969-01-26', tier: 3, notes: 'Avalon Ballroom' },
  { date: '1969-02-27', tier: 3, notes: 'Fillmore West - Live/Dead era' },
  { date: '1969-04-06', tier: 3, notes: 'Avalon Ballroom' },
];

// Combined list for easy lookups
export const ALL_CLASSIC_SHOWS: ClassicShowEntry[] = [
  ...TIER_1_SHOWS,
  ...TIER_2_SHOWS,
  ...TIER_3_SHOWS,
];

// Helper function to get tier for a show date
export function getClassicTier(date: string): ClassicTier | null {
  const dateOnly = date.split('T')[0];  // Handle ISO timestamps
  const classicShow = ALL_CLASSIC_SHOWS.find(show => show.date === dateOnly);
  return classicShow?.tier || null;
}

// Legacy function for backward compatibility
export function isClassicShow(date: string): boolean {
  return getClassicTier(date) !== null;
}
