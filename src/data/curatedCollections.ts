/**
 * Curated "Legendary Runs" collections for the Discover page.
 *
 * Each collection is a hand-picked list of show dates (same style as
 * GRATEFUL_DEAD_101_DATES in constants/classicShows.ts). Every date must
 * exist in data/shows.json — enforced by __tests__/curatedCollections.test.ts.
 * Dates are kept unique and sorted ascending within each collection (also
 * enforced by the test) so carousels read chronologically.
 */

export interface CuratedCollection {
  id: string;
  title: string;
  /** One-line subtitle rendered under the carousel title. */
  description: string;
  dates: readonly string[];
}

/**
 * Subtitle for the existing Classic Shows carousel, which shares the same
 * carousel rendering path but resolves its shows dynamically (rated classics
 * merged with Grateful Dead 101) rather than from a static date list.
 */
export const CLASSIC_SHOWS_DESCRIPTION =
  'The consensus essentials — the shows every Deadhead should hear';

export const CURATED_COLLECTIONS: readonly CuratedCollection[] = [
  {
    id: 'may-77',
    title: "May '77",
    description: 'The legend-making month — Cornell, Buffalo, and a band at full power',
    dates: [
      '1977-05-01', // The Palladium, NYC — tour opener stretch
      '1977-05-03', // The Palladium, NYC
      '1977-05-04', // The Palladium, NYC
      '1977-05-05', // New Haven Coliseum
      '1977-05-07', // Boston Garden
      '1977-05-08', // Barton Hall, Cornell — THE show
      '1977-05-09', // Buffalo Memorial Auditorium
      '1977-05-11', // St. Paul Civic Center
      '1977-05-12', // Chicago Auditorium Theatre
      '1977-05-13', // Chicago Auditorium Theatre
      '1977-05-15', // St. Louis Arena
      '1977-05-17', // Memphis — Dick's Picks 29 territory
      '1977-05-18', // Fox Theatre, Atlanta
      '1977-05-19', // Fox Theatre, Atlanta
      '1977-05-21', // Lakeland Civic Center
      '1977-05-22', // Sportatorium, Pembroke Pines
      '1977-05-25', // The Mosque, Richmond
      '1977-05-26', // Baltimore Civic Center
      '1977-05-28', // Hartford Civic Center — To Terrapin release
    ],
  },
  {
    id: 'europe-72',
    title: "Europe '72",
    description: 'The canonical tour — Wembley to the Lyceum, Pigpen’s last stand',
    dates: [
      '1972-04-07', // Wembley Empire Pool, London
      '1972-04-08', // Wembley Empire Pool, London
      '1972-04-11', // Newcastle City Hall
      '1972-04-14', // Tivoli Concert Hall, Copenhagen
      '1972-04-16', // Aarhus University
      '1972-04-17', // Tivoli Concert Hall, Copenhagen
      '1972-04-21', // Beat Club, Bremen
      '1972-04-24', // Rheinhalle, Düsseldorf
      '1972-04-26', // Jahrhunderthalle, Frankfurt
      '1972-04-29', // Musikhalle, Hamburg
      '1972-05-03', // Olympia Theatre, Paris
      '1972-05-04', // Olympia Theatre, Paris
      '1972-05-07', // Bickershaw Festival
      '1972-05-10', // Concertgebouw, Amsterdam
      '1972-05-11', // Rotterdam Civic Hall — 40-min Dark Star
      '1972-05-13', // Lille Fairgrounds
      '1972-05-16', // Radio Luxembourg broadcast
      '1972-05-18', // Kongressaal, Munich
      '1972-05-23', // Lyceum Theatre, London
      '1972-05-24', // Lyceum Theatre, London
      '1972-05-25', // Lyceum Theatre, London
      '1972-05-26', // Lyceum Theatre, London — tour finale
    ],
  },
  {
    id: 'fall-72',
    title: "Fall '72",
    description: 'Peak improvisation — many heads’ pick for the band’s deepest jamming',
    dates: [
      '1972-08-27', // Veneta, OR — Sunshine Daydream (the gateway show)
      '1972-09-03', // Folsom Field, Boulder
      '1972-09-09', // Hollywood Palladium
      '1972-09-10', // Hollywood Palladium
      '1972-09-15', // Boston Music Hall
      '1972-09-16', // Boston Music Hall
      '1972-09-17', // Baltimore Civic Center
      '1972-09-21', // The Spectrum, Philadelphia — legendary Dark Star
      '1972-09-24', // Palace Theater, Waterbury
      '1972-09-27', // Stanley Theater, Jersey City
      '1972-09-28', // Stanley Theater, Jersey City
      '1972-10-18', // Fox Theatre, St. Louis
      '1972-11-13', // Soldiers and Sailors Memorial Hall, Kansas City
      '1972-11-14', // Oklahoma City Music Hall
      '1972-11-15', // Civic Center Music Hall, Oklahoma City
      '1972-11-17', // Century II, Wichita
      '1972-11-19', // Hofheinz Pavilion, Houston
    ],
  },
  {
    id: 'fall-73',
    title: "Fall '73",
    description: 'The jazzy zenith — Winterland runs and marathon second sets',
    dates: [
      '1973-10-19', // Oklahoma City — Dick's Picks 19
      '1973-10-23', // Metropolitan Sports Center, Bloomington
      '1973-10-25', // Dane County Coliseum, Madison
      '1973-10-29', // Kiel Auditorium, St. Louis
      '1973-10-30', // Kiel Auditorium, St. Louis
      '1973-11-09', // Winterland, San Francisco
      '1973-11-10', // Winterland, San Francisco
      '1973-11-11', // Winterland, San Francisco — Winterland '73 box
      '1973-11-14', // San Diego Sports Arena
      '1973-11-17', // Pauley Pavilion, UCLA
      '1973-11-20', // Denver Coliseum
      '1973-11-21', // Denver Coliseum
      '1973-11-23', // County Coliseum, El Paso
      '1973-11-25', // Feyline Field, Tempe
      '1973-11-30', // Boston Music Hall — Dick's Picks 14
      '1973-12-02', // Boston Music Hall — Dick's Picks 14
      '1973-12-06', // Public Hall, Cleveland
      '1973-12-18', // Curtis Hixon Hall, Tampa
      '1973-12-19', // Curtis Hixon Hall, Tampa — Dick's Picks 1
    ],
  },
  {
    id: 'wall-of-sound-74',
    title: "Wall of Sound '74",
    description: 'The giant PA year — ending with the Winterland “farewell” run',
    dates: [
      '1974-05-14', // Adams Field House, Missoula
      '1974-05-19', // Portland Memorial Coliseum
      '1974-05-21', // Hec Edmundson Pavilion, Seattle — legendary Dark Star
      '1974-06-16', // Des Moines State Fair Grandstand
      '1974-06-18', // Freedom Hall, Louisville
      '1974-06-23', // Jai-Alai Fronton, Miami — Dick's Picks 24-adjacent
      '1974-06-26', // Providence Civic Center — Dick's Picks 12
      '1974-06-28', // Boston Garden — Dick's Picks 12
      '1974-07-31', // Dillon Stadium, Hartford
      '1974-08-04', // Philadelphia Civic Convention Hall
      '1974-08-05', // Philadelphia Civic Convention Hall
      '1974-08-06', // Roosevelt Stadium, Jersey City
      '1974-09-10', // Alexandra Palace, London
      '1974-09-11', // Alexandra Palace, London
      '1974-09-18', // Parc des Expositions, Dijon
      '1974-10-16', // Winterland — the "retirement" run
      '1974-10-17', // Winterland
      '1974-10-18', // Winterland
      '1974-10-19', // Winterland
      '1974-10-20', // Winterland — The Grateful Dead Movie
    ],
  },
  {
    id: 'acoustic-70',
    title: 'Acoustic Dead 1970',
    description: 'Workingman’s-era magic — acoustic sets, Harpur College, Fillmore East',
    dates: [
      '1970-02-11', // Fillmore East — with the Allmans
      '1970-02-13', // Fillmore East — Dick's Picks 4
      '1970-02-14', // Fillmore East — Dick's Picks 4
      '1970-04-24', // Mammoth Gardens, Denver
      '1970-05-02', // Harpur College — #2 in the '93 Tapers Poll
      '1970-05-15', // Fillmore East
      '1970-06-24', // Capitol Theatre, Port Chester
      '1970-09-17', // Fillmore East
      '1970-09-18', // Fillmore East
      '1970-09-19', // Fillmore East
      '1970-09-20', // Fillmore East
    ],
  },
  {
    id: 'primal-68-69',
    title: "Primal Dead '68–'69",
    description: 'Live/Dead-era fire — raw, loud, and fearless psychedelia',
    dates: [
      '1968-02-14', // Carousel Ballroom — Anthem-era
      '1968-03-16', // Carousel Ballroom
      '1968-08-21', // Fillmore West
      '1968-08-23', // Shrine Auditorium — Two from the Vault
      '1968-10-12', // Avalon Ballroom
      '1968-10-13', // Avalon Ballroom
      '1969-01-26', // Avalon Ballroom
      '1969-02-12', // Fillmore East
      '1969-02-19', // Fillmore West
      '1969-02-22', // Dream Bowl, Vallejo
      '1969-02-27', // Fillmore West — Live/Dead
      '1969-02-28', // Fillmore West — Live/Dead
      '1969-03-01', // Fillmore West — Live/Dead
      '1969-03-02', // Fillmore West — Live/Dead
      '1969-04-22', // The Ark, Boston
      '1969-04-26', // Electric Theater, Chicago
      '1969-06-14', // Monterey Performing Arts Center
      '1969-11-08', // Fillmore Auditorium
      '1969-12-26', // McFarlin Auditorium, Dallas
    ],
  },
  {
    id: 'june-76',
    title: "June '76 Comeback",
    description: 'Back from hiatus — small theaters, new songs, total reinvention',
    dates: [
      '1976-06-03', // Paramount Theatre, Portland — return show
      '1976-06-04', // Paramount Theatre, Portland
      '1976-06-09', // Boston Music Hall
      '1976-06-10', // Boston Music Hall
      '1976-06-11', // Boston Music Hall
      '1976-06-12', // Boston Music Hall
      '1976-06-14', // Beacon Theatre, NYC
      '1976-06-15', // Beacon Theatre, NYC
      '1976-06-17', // Capitol Theatre, Passaic
      '1976-06-18', // Capitol Theatre, Passaic
      '1976-06-19', // Capitol Theatre, Passaic
      '1976-06-21', // Tower Theatre, Philadelphia
      '1976-06-22', // Tower Theatre, Philadelphia
      '1976-06-23', // Tower Theatre, Philadelphia
      '1976-06-24', // Tower Theatre, Philadelphia
      '1976-06-26', // Auditorium Theatre, Chicago
      '1976-06-27', // Auditorium Theatre, Chicago
      '1976-06-28', // Auditorium Theatre, Chicago
      '1976-06-29', // Auditorium Theatre, Chicago
    ],
  },
  {
    id: 'egypt-return-78',
    title: "Egypt & the Return '78",
    description: 'Pyramids by moonlight, then the triumphant Winterland homecoming',
    dates: [
      '1978-09-14', // Gizah Sound & Light Theater, Egypt
      '1978-09-15', // Gizah Sound & Light Theater, Egypt
      '1978-09-16', // Gizah — total lunar eclipse show
      '1978-10-17', // Winterland — "From Egypt with Love" run
      '1978-10-18', // Winterland
      '1978-10-20', // Winterland
      '1978-10-21', // Winterland
      '1978-10-22', // Winterland
    ],
  },
  {
    id: 'summer-89',
    title: "Summer '89",
    description: 'Brent’s peak — Alpine, JFK, Deer Creek, and a band reborn',
    dates: [
      '1989-07-02', // Foxboro Stadium
      '1989-07-04', // Rich Stadium, Buffalo — Truckin' Up to Buffalo
      '1989-07-07', // JFK Stadium — Crimson White & Indigo
      '1989-07-09', // Giants Stadium
      '1989-07-10', // Giants Stadium
      '1989-07-12', // RFK Stadium
      '1989-07-13', // RFK Stadium
      '1989-07-15', // Deer Creek — Downhill from Here
      '1989-07-17', // Alpine Valley
      '1989-07-18', // Alpine Valley
      '1989-07-19', // Alpine Valley
    ],
  },
  {
    id: 'spring-90',
    title: "Spring '90",
    description: '“The last great tour” — Branford sits in, the band soars',
    dates: [
      '1990-03-14', // Capital Centre, Landover
      '1990-03-15', // Capital Centre, Landover
      '1990-03-16', // Capital Centre, Landover — Spring 1990 box
      '1990-03-18', // Civic Center, Hartford
      '1990-03-19', // Civic Center, Hartford
      '1990-03-21', // Copps Coliseum, Hamilton
      '1990-03-22', // Copps Coliseum, Hamilton
      '1990-03-24', // Knickerbocker Arena, Albany
      '1990-03-25', // Knickerbocker Arena, Albany
      '1990-03-26', // Knickerbocker Arena, Albany
      '1990-03-28', // Nassau Coliseum
      '1990-03-29', // Nassau Coliseum — Branford Marsalis Dark Star
      '1990-03-30', // Nassau Coliseum
      '1990-04-01', // The Omni, Atlanta
      '1990-04-02', // The Omni, Atlanta
      '1990-04-03', // The Omni, Atlanta
    ],
  },
  {
    id: 'pacific-northwest-73-74',
    title: "Pacific Northwest '73–'74",
    description: 'Vancouver, Portland, Seattle — the Believe It If You Need It box runs',
    dates: [
      '1973-06-22', // P.N.E. Coliseum, Vancouver
      '1973-06-24', // Memorial Coliseum, Portland
      '1973-06-26', // Seattle Center Arena
      '1974-05-14', // Adams Field House, Missoula
      '1974-05-19', // Portland Memorial Coliseum
      '1974-05-21', // Hec Edmundson Pavilion, Seattle — legendary Dark Star
    ],
  },
  {
    id: 'skull-and-roses-71',
    title: '1971: Skull & Roses',
    description: 'Port Chester debuts, the Fillmore East farewell, and Keith’s arrival',
    dates: [
      '1971-02-18', // Capitol Theater, Port Chester — Bertha/Loser/Wharf Rat debuts
      '1971-02-19', // Capitol Theater, Port Chester
      '1971-02-20', // Capitol Theater, Port Chester
      '1971-02-21', // Capitol Theater, Port Chester
      '1971-02-23', // Capitol Theater, Port Chester
      '1971-02-24', // Capitol Theater, Port Chester
      '1971-04-05', // Manhattan Center — Skull & Roses source
      '1971-04-06', // Manhattan Center
      '1971-04-25', // Fillmore East — closing-month run
      '1971-04-26', // Fillmore East
      '1971-04-27', // Fillmore East
      '1971-04-28', // Fillmore East
      '1971-04-29', // Fillmore East — Three from the Vault
      '1971-10-19', // Northrop Auditorium, Minneapolis — Keith Godchaux's debut
      '1971-10-21', // Auditorium Theatre, Chicago
      '1971-10-22', // Auditorium Theatre, Chicago
      '1971-12-04', // Felt Forum, MSG
      '1971-12-05', // Felt Forum, MSG — Dave's Picks 22
    ],
  },
  {
    id: 'summer-73',
    title: "Summer '73",
    description: 'RFK with the Allmans and the 600,000-strong Watkins Glen weekend',
    dates: [
      '1973-06-09', // RFK Stadium, Washington DC
      '1973-06-10', // RFK Stadium — with the Allman Brothers
      '1973-07-27', // Watkins Glen — soundcheck jam
      '1973-07-28', // Watkins Glen Summer Jam
      '1973-07-31', // Roosevelt Stadium, Jersey City
    ],
  },
  {
    id: 'fall-79',
    title: "Fall '79",
    description: 'Brent settles in — Cape Cod to the Uptown, capped by Dick’s Picks 5',
    dates: [
      '1979-10-27', // Cape Cod Coliseum
      '1979-10-28', // Cape Cod Coliseum
      '1979-10-31', // Nassau Coliseum
      '1979-11-01', // Nassau Coliseum
      '1979-11-02', // Nassau Coliseum
      '1979-11-05', // The Spectrum, Philadelphia
      '1979-11-06', // The Spectrum, Philadelphia
      '1979-11-08', // Capital Centre, Landover
      '1979-12-03', // Uptown Theater, Chicago
      '1979-12-04', // Uptown Theater, Chicago
      '1979-12-05', // Uptown Theater, Chicago
      '1979-12-26', // Oakland Auditorium — Dick's Picks 5
    ],
  },
  {
    id: 'fall-80-acoustic',
    title: "Fall '80 Acoustic Revival",
    description: 'Acoustic sets return — the Warfield and Radio City residencies behind Reckoning',
    dates: [
      '1980-09-25', // Warfield Theater, San Francisco — residency opener
      '1980-09-26', // Warfield Theater
      '1980-09-27', // Warfield Theater
      '1980-09-29', // Warfield Theater
      '1980-09-30', // Warfield Theater
      '1980-10-02', // Warfield Theater
      '1980-10-03', // Warfield Theater
      '1980-10-04', // Warfield Theater
      '1980-10-06', // Warfield Theater
      '1980-10-07', // Warfield Theater
      '1980-10-09', // Warfield Theater
      '1980-10-10', // Warfield Theater
      '1980-10-11', // Warfield Theater
      '1980-10-13', // Warfield Theater
      '1980-10-14', // Warfield Theater — residency closer
      '1980-10-22', // Radio City Music Hall, NYC
      '1980-10-23', // Radio City Music Hall
      '1980-10-25', // Radio City Music Hall
      '1980-10-26', // Radio City Music Hall
      '1980-10-27', // Radio City Music Hall
      '1980-10-29', // Radio City Music Hall
      '1980-10-30', // Radio City Music Hall
      '1980-10-31', // Radio City Music Hall — Halloween, Dead Set / Reckoning sources
    ],
  },
  {
    id: 'fall-89',
    title: "Fall '89",
    description: 'The Warlocks return to Hampton — bust-outs, then Nightfall of Diamonds',
    dates: [
      '1989-10-08', // Hampton Coliseum — billed as "Formerly the Warlocks"
      '1989-10-09', // Hampton Coliseum — Dark Star & Attics bust-outs
      '1989-10-11', // Meadowlands Arena
      '1989-10-12', // Meadowlands Arena
      '1989-10-14', // Meadowlands Arena
      '1989-10-15', // Meadowlands Arena
      '1989-10-16', // Meadowlands Arena
      '1989-10-18', // The Spectrum, Philadelphia
      '1989-10-19', // The Spectrum, Philadelphia
      '1989-10-20', // The Spectrum, Philadelphia
      '1989-10-22', // Charlotte Coliseum
      '1989-10-23', // Charlotte Coliseum
      '1989-10-25', // Miami Arena
      '1989-10-26', // Miami Arena — Nightfall of Diamonds
    ],
  },
  {
    id: 'msg-sept-90',
    title: "September '90 MSG",
    description: 'First steps after Brent — Hornsby and Welnick light up the Garden',
    dates: [
      '1990-09-14', // Madison Square Garden
      '1990-09-15', // Madison Square Garden — Bruce Hornsby joins
      '1990-09-16', // Madison Square Garden
      '1990-09-18', // Madison Square Garden
      '1990-09-19', // Madison Square Garden
      '1990-09-20', // Madison Square Garden — revered Dark Star show
    ],
  },
];
