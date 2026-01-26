/**
 * Community-Sourced Song Performance Ratings
 *
 * Scraped from Reddit, Dead.net forums, HeadyVersion discussions,
 * Archive.org forums, Quora, Rolling Stone, and Guitar World.
 * Generated: 2026-01-25
 *
 * These ratings supplement the HeadyVersion vote-based ratings with
 * performances frequently cited as "best ever" or "must-hear" by fans.
 *
 * Tier 1 (3 stars): Cited as "best ever" or "definitive" version
 * Tier 2 (2 stars): Top-tier, frequently recommended
 * Tier 3 (1 star): Notable, worth hearing
 */

// Types defined inline to avoid circular dependency
type PerformanceRatingTier = 1 | 2 | 3;

interface CommunityRatedPerformance {
  songTitle: string;
  showDate: string;
  showIdentifier: string;
  tier: PerformanceRatingTier;
  votes?: number;
  notes?: string;
}

// Helper to create entries without show identifiers (matched by date)
function communityRating(
  songTitle: string,
  showDate: string,
  tier: PerformanceRatingTier,
  notes: string
): CommunityRatedPerformance {
  return {
    songTitle: `Grateful Dead - ${songTitle}`,
    showDate,
    showIdentifier: '', // Will be resolved at runtime if needed
    tier,
    notes: `Community: ${notes}`,
  };
}

export const COMMUNITY_RATINGS: CommunityRatedPerformance[] = [
  // ===== DARK STAR =====
  communityRating('Dark Star', '1972-08-27', 1, 'Most cited in fan surveys, Jerry letting it rip in 90+ degree heat - Veneta'),
  communityRating('Dark Star', '1970-02-13', 1, "Deadbase readers poll #1, famous 'Feelin' Groovy Jam' - Fillmore East"),
  communityRating('Dark Star', '1969-02-27', 1, 'Live/Dead album version, established Dead mystique - Fillmore West'),
  communityRating('Dark Star', '1973-11-11', 1, "The 'Thinking Man's Dark Star', Mind Left Body Jam > Eyes - Winterland"),
  communityRating('Dark Star', '1972-04-08', 2, "30-minute masterpiece, Steppin' Out release - Wembley"),
  communityRating('Dark Star', '1970-09-19', 2, 'Epic version, day after Hendrix died - Fillmore East'),
  communityRating('Dark Star', '1974-02-24', 2, 'Saddest, deepest, most introvert Dark Star - Winterland'),
  communityRating('Dark Star', '1989-10-26', 2, 'Last epic Dark Star, best post-1974 version - Miami'),
  communityRating('Dark Star', '1973-12-06', 3, 'Longest Dark Star ever performed - Cleveland'),

  // ===== SCARLET BEGONIAS > FIRE ON THE MOUNTAIN =====
  communityRating('Scarlet Begonias > Fire On The Mountain', '1977-05-08', 1, 'Most famous two-song segment of all time - Cornell'),
  communityRating('Scarlet Begonias > Fire On The Mountain', '1980-11-30', 1, 'Silky smooth, magnificent playing during transition - Fox Theatre'),
  communityRating('Scarlet Begonias -> Fire On The Mountain', '1977-05-08', 1, 'Most famous two-song segment of all time - Cornell'),
  communityRating('Scarlet Begonias -> Fire On The Mountain', '1980-11-30', 1, 'Silky smooth, magnificent playing during transition - Fox Theatre'),
  communityRating('Scarlet Begonias > Fire On The Mountain', '1978-02-05', 2, 'Dripping with creativity - Cedar Falls'),
  communityRating('Scarlet Begonias > Fire On The Mountain', '1988-06-28', 2, 'Frequently cited top performance - SPAC'),
  communityRating('Scarlet Begonias > Fire On The Mountain', '1991-10-31', 2, 'Bruce Hornsby on piano, trippy flute MIDI - Oakland'),
  communityRating('Scarlet Begonias > Fire On The Mountain', '1990-03-22', 2, 'Made one fan a Deadhead, flawless transition - Hamilton'),
  communityRating('Scarlet Begonias > Fire On The Mountain', '1981-03-10', 3, 'Mighty version - MSG'),
  communityRating('Scarlet Begonias > Fire On The Mountain', '1979-11-01', 3, 'Longest version at 34 minutes - Nassau'),
  communityRating('Scarlet Begonias -> Fire On The Mountain', '1978-02-05', 2, 'Dripping with creativity - Cedar Falls'),
  communityRating('Scarlet Begonias -> Fire On The Mountain', '1988-06-28', 2, 'Frequently cited top performance - SPAC'),
  communityRating('Scarlet Begonias -> Fire On The Mountain', '1991-10-31', 2, 'Bruce Hornsby on piano, trippy flute MIDI - Oakland'),
  communityRating('Scarlet Begonias -> Fire On The Mountain', '1990-03-22', 2, 'Made one fan a Deadhead, flawless transition - Hamilton'),
  communityRating('Scarlet Begonias -> Fire On The Mountain', '1981-03-10', 3, 'Mighty version - MSG'),
  communityRating('Scarlet Begonias -> Fire On The Mountain', '1979-11-01', 3, 'Longest version at 34 minutes - Nassau'),

  // ===== EYES OF THE WORLD =====
  communityRating('Eyes Of The World', '1974-08-06', 1, 'Beautiful, fast, inspired - best of 73-74 - Roosevelt Stadium'),
  communityRating('Eyes Of The World', '1974-10-19', 1, 'Grateful Dead Movie, breathtaking Garcia/Godchaux interplay - Winterland'),
  communityRating('Eyes Of The World', '1977-09-03', 1, '100,000+ crowd, Estimated>Eyes best pairing ever - Englishtown'),
  communityRating('Eyes Of The World', '1973-02-09', 2, 'First ever version, knocked it out of the park - Stanford'),
  communityRating('Eyes Of The World', '1974-06-16', 2, 'Unique grasshopper cadence, segue into Big River - Des Moines'),
  communityRating('Eyes Of The World', '1990-03-29', 2, 'Branford Marsalis on saxophone, jazzy and tight - Nassau'),
  communityRating('Eyes Of The World', '1977-10-29', 3, 'Jazzy, explorative, blasts into stratosphere - DeKalb'),

  // ===== PLAYING IN THE BAND =====
  communityRating('Playing In The Band', '1972-08-27', 1, 'Most intense, in-sync jam of all time - Veneta'),
  communityRating('Playing In The Band', '1972-11-18', 1, '226 HeadyVersion votes - Houston'),
  communityRating('Playing In The Band', '1973-12-02', 1, '151 HeadyVersion votes - Boston'),
  communityRating('Playing In The Band', '1974-06-26', 2, 'Peak 1974 jamming - Providence'),
  communityRating("Playin' In The Band", '1972-08-27', 1, 'Most intense, in-sync jam of all time - Veneta'),
  communityRating("Playin' In The Band", '1972-11-18', 1, '226 HeadyVersion votes - Houston'),
  communityRating("Playin' In The Band", '1973-12-02', 1, '151 HeadyVersion votes - Boston'),
  communityRating("Playin' In The Band", '1974-06-26', 2, 'Peak 1974 jamming - Providence'),

  // ===== THE OTHER ONE =====
  communityRating('The Other One', '1970-05-02', 1, '195 HeadyVersion votes, definitive version - Harpur College'),
  communityRating('The Other One', '1970-02-13', 1, '119 votes, legendary show - Fillmore East'),
  communityRating('The Other One', '1974-06-18', 1, '116 votes - Freedom Hall'),
  communityRating('The Other One', '1972-05-26', 2, 'Best Other One of all time per some fans - Lyceum'),

  // ===== MORNING DEW =====
  communityRating('Morning Dew', '1977-05-08', 1, "Quite possibly one of Dead's best-ever performances - Lemieux - Cornell"),
  communityRating('Morning Dew', '1972-05-26', 1, "Europe '72 version, legendary - Lyceum"),
  communityRating('Morning Dew', '1972-05-23', 2, 'Following exploratory Dark Star - Lyceum'),
  communityRating('Morning Dew', '1974-10-18', 2, 'Dark Star>Dew, WOW best ever, must be loud - Winterland'),
  communityRating('Morning Dew', '1984-10-12', 2, 'Most intense 80-95 version - Augusta'),
  communityRating('Morning Dew', '1970-05-06', 2, 'Powerful version 2 days after Kent State - MIT'),
  communityRating('Morning Dew', '1983-06-18', 3, "Called 'Best Morning Dew ever' in notes - SPAC"),
  communityRating('Morning Dew', '1980-09-02', 3, 'Best Brent era Morning Dew, top 5 Deadbase - Rochester'),

  // ===== SUGAREE =====
  communityRating('Sugaree', '1977-05-22', 1, "Not just best Sugaree, finest single song performance of late 70s - Dick's Picks 3"),
  communityRating('Sugaree', '1977-05-28', 1, 'Record 21:30 length, solo after scorching solo - Hartford'),
  communityRating('Sugaree', '1977-10-16', 1, 'Nearly 18 minutes, one of the most creative - Baton Rouge'),
  communityRating('Sugaree', '1977-05-19', 2, "Some say blows away 5/22 - Dick's Picks 29 - Atlanta"),
  communityRating('Sugaree', '1983-10-17', 2, "Called 'the best' first set opening Sugaree - Lake Placid"),
  communityRating('Sugaree', '1980-09-02', 3, 'So much energy, close to DP3 - Rochester'),
  communityRating('Sugaree', '1977-05-21', 3, 'Another great May 77 Sugaree - Lakeland'),

  // ===== ESTIMATED PROPHET =====
  communityRating('Estimated Prophet', '1978-02-03', 1, 'Frequently cited top version - Madison'),
  communityRating('Estimated Prophet', '1977-10-29', 1, 'Spacey-jazzy-gooey-Wah-Wah-chunk-fest - DeKalb'),
  communityRating('Estimated Prophet', '1979-12-26', 1, 'One of the most frequently mentioned - Oakland'),
  communityRating('Estimated Prophet', '1977-09-03', 2, 'Showed the light for possibilities - Englishtown'),
  communityRating('Estimated Prophet', '1977-11-02', 2, 'Commercial release, hypnotic end section - Toronto'),
  communityRating('Estimated Prophet', '1977-10-16', 3, 'Strong fall 77 version - Baton Rouge'),
  communityRating('Estimated Prophet', '1977-05-28', 3, 'Part of epic second set - Hartford'),

  // ===== SHAKEDOWN STREET =====
  communityRating('Shakedown Street', '1979-10-25', 1, 'Phil drives, universe of funk, 51 HeadyVersion comments - New Haven'),
  communityRating('Shakedown Street', '1978-09-16', 1, 'In the pocket start to finish, Rocking The Cradle - Egypt'),
  communityRating('Shakedown Street', '1984-12-31', 2, '17-min show opener on NYE, never heard better - SF Civic'),
  communityRating('Shakedown Street', '1979-01-15', 2, 'Miracle>Shakedown...wait for it - Springfield'),
  communityRating('Shakedown Street', '1979-12-26', 2, "Brent's creativity during jam - Oakland"),
  communityRating('Shakedown Street', '1985-06-30', 3, 'Climactic and funky, impossibly good - Merriweather'),
  communityRating('Shakedown Street', '1984-04-16', 3, 'Great vocal back and forth Jerry/Bob'),
  communityRating('Shakedown Street', '1982-04-06', 3, 'Jerry and Brent exchange fantastic - Spectrum'),

  // ===== HELP ON THE WAY > SLIPKNOT! > FRANKLIN'S TOWER =====
  communityRating("Help On The Way > Slipknot! > Franklin's Tower", '1975-08-13', 1, 'Gold Standard, One From The Vault - GAMH'),
  communityRating("Help On The Way > Slipknot! > Franklin's Tower", '1977-05-09', 1, "THE Help>Slip>Franklin's sequence, pure vocals - Buffalo"),
  communityRating("Help On The Way > Slipknot! > Franklin's Tower", '1976-10-09', 2, 'One of best second sets ever - Oakland'),
  communityRating("Help On The Way > Slipknot! > Franklin's Tower", '1977-05-22', 2, "Dick's Picks 3, beautiful - Pembroke Pines"),
  communityRating("Help On The Way > Slipknot! > Franklin's Tower", '1976-09-24', 2, "Return to Slipknot>Franklin's, heady moment - Williamsburg"),
  communityRating("Help On The Way > Slipknot! > Franklin's Tower", '1991-09-10', 3, '30 Trips Bradford version - MSG'),
  communityRating("Help On The Way > Slipknot! > Franklin's Tower", '1991-06-14', 3, 'One of best late-era returns - Lemieux - RFK'),
  // Alternative title formats
  communityRating("Help On The Way -> Slipknot! -> Franklin's Tower", '1975-08-13', 1, 'Gold Standard, One From The Vault - GAMH'),
  communityRating("Help On The Way -> Slipknot! -> Franklin's Tower", '1977-05-09', 1, "THE Help>Slip>Franklin's sequence, pure vocals - Buffalo"),
  communityRating("Help > Slipknot > Franklin's Tower", '1975-08-13', 1, 'Gold Standard, One From The Vault - GAMH'),
  communityRating("Help > Slipknot > Franklin's Tower", '1977-05-09', 1, "THE Help>Slip>Franklin's sequence - Buffalo"),

  // ===== TERRAPIN STATION =====
  communityRating('Terrapin Station', '1977-03-18', 1, "Most complete version, includes rare 'Alhambra' section - Winterland"),
  communityRating('Terrapin Station', '1977-02-26', 1, 'Debut performance, great version - San Bernardino'),
  communityRating('Terrapin Station', '1977-09-03', 2, 'Latter part Does Not Miss - Englishtown'),
  communityRating('Terrapin Station', '1977-05-07', 2, 'Very good early version - Boston Garden'),
  communityRating('Terrapin Station', '1979-01-15', 2, "One fan's favorite live version - Springfield"),
  communityRating('Terrapin Station', '1981-09-13', 3, 'Only version with triple instrumental section - Greek'),
  communityRating('Terrapin Station', '1987-03-24', 3, 'Best post-terrapin jam - Hampton'),

  // ===== WHARF RAT =====
  communityRating('Wharf Rat', '1978-04-22', 1, 'Maybe the best Wharf Rat, huge climactic jams'),
  communityRating('Wharf Rat', '1971-02-18', 1, 'First ever, sandwiched between Dark Star - Port Chester'),
  communityRating('Wharf Rat', '1979-11-09', 2, 'Fantastic rendition right out of drums - Buffalo'),
  communityRating('Wharf Rat', '1981-02-27', 2, 'Space>NFA>Wharf Rat exquisite, heart-rending'),
  communityRating('Wharf Rat', '1973-07-24', 2, 'Soundcheck, sweet jam preceding - Watkins Glen'),
  communityRating('Wharf Rat', '1973-12-18', 2, 'Out of great Eyes, beautiful - Tampa'),
  communityRating('Wharf Rat', '1984-04-21', 3, 'A MONSTER'),
  communityRating('Wharf Rat', '1985-06-16', 3, 'The best wharf rat...period - Greek'),
  communityRating('Wharf Rat', '1989-07-07', 3, 'Jerry poured himself into song - JFK Stadium'),
  communityRating('Wharf Rat', '1993-09-22', 3, 'With David Murray on sax, insane - MSG'),

  // ===== ST. STEPHEN =====
  communityRating('St. Stephen', '1969-02-27', 1, 'Live/Dead canonical recording - Fillmore West'),
  communityRating('St. Stephen', '1978-01-22', 1, 'Epitome of Grateful Dead joy, best ever solo - Eugene'),
  communityRating('St. Stephen', '1977-10-29', 1, 'Bluesy, rockin, just exactly perfect, best version - DeKalb'),
  communityRating('St. Stephen', '1977-05-08', 2, 'Famous St. Stephen>NFA>St. Stephen>Morning Dew - Cornell'),
  communityRating('St. Stephen', '1971-08-06', 2, 'Favorite, so slow and under control but powerful - Hollywood'),
  communityRating('St. Stephen', '1976-10-09', 2, 'Hot opener, flawless, best reprise ever - Oakland'),
  communityRating('St. Stephen', '1976-06-09', 3, 'Transition into Eyes of the World stunning - Boston'),
  communityRating('Saint Stephen', '1969-02-27', 1, 'Live/Dead canonical recording - Fillmore West'),
  communityRating('Saint Stephen', '1978-01-22', 1, 'Epitome of Grateful Dead joy, best ever solo - Eugene'),
  communityRating('Saint Stephen', '1977-10-29', 1, 'Bluesy, rockin, just exactly perfect, best version - DeKalb'),

  // ===== BERTHA =====
  communityRating('Bertha', '1972-08-27', 1, 'Consensus best, never heard Jerry play this fast - Veneta'),
  communityRating('Bertha', '1971-08-06', 1, 'Raw unrefined power, a ripper - Hollywood Palladium'),
  communityRating('Bertha', '1977-05-09', 2, 'High-energy, exceptional musicianship - Buffalo'),
  communityRating('Bertha', '1972-04-26', 2, "Tight execution, dynamic energy, Europe '72 - Frankfurt"),
  communityRating('Bertha', '1987-12-31', 3, 'Band comes out firing, great solo - Oakland'),
  communityRating('Bertha', '1994-03-21', 3, 'Top pick by some fans'),

  // ===== NOT FADE AWAY =====
  communityRating('Not Fade Away', '1971-11-15', 1, 'Play for non-Deadheads, magical jam, China Cat quotes - Austin'),
  communityRating('Not Fade Away', '1977-09-03', 1, "Dave's Picks 15, 102,000+ tickets sold - Englishtown"),
  communityRating('Not Fade Away', '1970-09-19', 2, 'NFA>Darkness Jam>China Cat Jam>NFA>Lovelight - Fillmore East'),
  communityRating('Not Fade Away', '1970-02-14', 2, 'Heavy jam, stunning Bid You Goodnight theme - Fillmore East'),
  communityRating('Not Fade Away', '1971-10-31', 2, 'Legendary must-hear version - Columbus'),
  communityRating('Not Fade Away', '1977-05-28', 3, "Part of epic Playin' sandwich - Hartford"),

  // ===== TRUCKIN' =====
  communityRating("Truckin'", '1977-11-06', 1, 'Blistering 30-minute jam - Binghamton'),
  communityRating("Truckin'", '1977-09-03', 1, "Very strong standalone, hard Truckin' - Englishtown"),
  communityRating("Truckin'", '1974-05-19', 1, 'Flat-out awesome, gorgeous MLB/NFA jam - Portland'),
  communityRating("Truckin'", '1977-11-02', 2, 'Balls out version - Toronto'),
  communityRating("Truckin'", '1974-05-25', 2, 'Band at height of powers tearing it apart - Santa Barbara'),
  communityRating("Truckin'", '1972-04-08', 2, "Jerry's guitar work crazy, Hundred Years Hall - Wembley"),
  communityRating("Truckin'", '1970-09-20', 3, "Incredible acoustic set, last acoustic Truckin' - Fillmore East"),
  communityRating('Truckin', '1977-11-06', 1, 'Blistering 30-minute jam - Binghamton'),
  communityRating('Truckin', '1977-09-03', 1, "Very strong standalone, hard Truckin' - Englishtown"),
  communityRating('Truckin', '1974-05-19', 1, 'Flat-out awesome, gorgeous MLB/NFA jam - Portland'),
  communityRating('Truckin', '1977-11-02', 2, 'Balls out version - Toronto'),
  communityRating('Truckin', '1974-05-25', 2, 'Band at height of powers tearing it apart - Santa Barbara'),
  communityRating('Truckin', '1972-04-08', 2, "Jerry's guitar work crazy, Hundred Years Hall - Wembley"),
  communityRating('Truckin', '1970-09-20', 3, "Incredible acoustic set, last acoustic Truckin' - Fillmore East"),

  // ===== JACK STRAW =====
  communityRating('Jack Straw', '1979-01-11', 1, 'LEGENDARY!! - Nassau'),
  communityRating('Jack Straw', '1977-10-29', 1, 'The gold standard - DeKalb'),
  communityRating('Jack Straw', '1984-10-20', 1, 'Crazy hard driving insanity, builds and KABOOMS - Syracuse'),
  communityRating('Jack Straw', '1977-12-29', 2, "Best Jack Straw ever heard - Dick's Picks 10 - Winterland"),
  communityRating('Jack Straw', '1972-05-26', 2, 'Great buildup, cooks like no other - Lyceum'),
  communityRating('Jack Straw', '1978-01-22', 3, 'Very strong, one of the longest - Eugene'),
  communityRating('Jack Straw', '1987-03-31', 3, 'Great one, multiple votes - Spectrum'),

  // ===== BIRD SONG =====
  communityRating('Bird Song', '1972-08-27', 1, 'Greatest Bird Song, best 10 minutes of GD history - Veneta'),
  communityRating('Bird Song', '1973-06-22', 1, 'Unique dream-like voyaging, stupefyingly beautiful - Vancouver'),
  communityRating('Bird Song', '1989-10-08', 2, 'Shoots straight into cosmos, very spacey - Hampton'),
  communityRating('Bird Song', '1980-11-30', 2, 'Featured on Spring 1990 compilation - Fox Theatre'),
  communityRating('Bird Song', '1984-07-15', 3, 'Dancin>Bird Song wonderful version, nice peak jam - Greek'),
  communityRating('Bird Song', '1990-03-29', 3, 'Branford Marsalis version - Nassau'),

  // ===== CASSIDY =====
  communityRating('Cassidy', '1983-10-12', 1, 'Favorite all-time, intense build-up, Weir nails it - MSG'),
  communityRating('Cassidy', '1977-11-04', 1, 'Smoker, was cooking - Colgate'),
  communityRating('Cassidy', '1982-08-03', 2, 'Best one you will ever hear - Kansas City'),
  communityRating('Cassidy', '1978-01-22', 2, 'Stellar version - Eugene'),
  communityRating('Cassidy', '1989-10-19', 3, 'Great later day version - Spectrum'),

  // ===== UNCLE JOHN'S BAND =====
  communityRating("Uncle John's Band", '1972-09-27', 1, 'Ladies and Gentlemen, fantastic version - Jersey City'),
  communityRating("Uncle John's Band", '1974-08-06', 1, 'Greatest Setlist debates, top-notch performance - Roosevelt Stadium'),
  communityRating("Uncle John's Band", '1994-10-05', 2, 'Latter day gem'),
  communityRating("Uncle John's Band", '1991-06-17', 2, 'Jaw-dropping experience, heart of pre-drumz'),

  // ===== LOOSE LUCY =====
  communityRating('Loose Lucy', '1973-11-11', 1, 'Jazzy sound, great tempo, Bill so tight - Winterland'),
  communityRating('Loose Lucy', '1974-05-19', 1, 'Favorite early version, cooks - Portland'),
  communityRating('Loose Lucy', '1974-05-17', 2, 'Faster than most, mad funky - Vancouver'),
  communityRating('Loose Lucy', '1990-03-14', 2, "First one since '74, crowd goes nuts"),
  communityRating('Loose Lucy', '1990-12-12', 2, 'Far and away best post-1974 version'),
  communityRating('Loose Lucy', '1992-12-16', 3, 'Favorite modern era version - Oakland'),

  // ===== ROW JIMMY =====
  communityRating('Row Jimmy', '1977-05-08', 1, 'Favorite version on Dead.net forums - Cornell'),
  communityRating('Row Jimmy', '1978-01-22', 1, 'Dueling power, uplifting slide guitar, one of a kind - Eugene'),
  communityRating('Row Jimmy', '1977-03-20', 1, 'On fire, probably best version ever played - Winterland'),
  communityRating('Row Jimmy', '1973-11-17', 2, 'Ethereal second set opener, EPIC show, heart-wrenching - UCLA'),
  communityRating('Row Jimmy', '1973-02-28', 2, 'All around beautiful, tender and emotional - Salt Lake City'),

  // ===== MISSISSIPPI HALF-STEP UPTOWN TOODELOO =====
  communityRating('Mississippi Half-Step Uptown Toodeloo', '1977-09-03', 1, 'Great year for Half-Step - Englishtown'),
  communityRating('Mississippi Half-Step Uptown Toodeloo', '1977-11-05', 2, 'Great 1977 version - Rochester'),
  communityRating('Mississippi Half-Step Uptown Toodeloo', '1973-12-02', 2, 'Just exactly right - Boston'),
  communityRating('Mississippi Half-Step Uptown Toodeloo', '1973-10-19', 2, "Dick's Picks 19 - Oklahoma City"),
  communityRating('Mississippi Half-Step Uptown Toodeloo', '1972-09-17', 3, 'Sharp vocals, tight band - Baltimore'),
  communityRating('Mississippi Halfstep Uptown Toodeloo', '1977-09-03', 1, 'Great year for Half-Step - Englishtown'),
  communityRating('Mississippi Halfstep Uptown Toodeloo', '1977-11-05', 2, 'Great 1977 version - Rochester'),
  communityRating('Mississippi Halfstep Uptown Toodeloo', '1973-12-02', 2, 'Just exactly right - Boston'),

  // ===== THE ELEVEN =====
  communityRating('The Eleven', '1969-01-26', 1, 'Live/Dead, Garcia on fire, all-timer - Avalon Ballroom'),
  communityRating('The Eleven', '1968-08-24', 1, 'Even more exciting than Live/Dead - Guitar World - Shrine'),
  communityRating('The Eleven', '1968-10-12', 2, 'Frequently cited as the best - Avalon Ballroom'),
  communityRating('The Eleven', '1969-03-01', 2, 'Mentioned as favorite on Dead.net'),
  communityRating('The Eleven', '1969-02-22', 3, "Pure '69 bliss - Dream Bowl"),

  // ===== GOOD LOVIN' =====
  communityRating("Good Lovin'", '1971-04-17', 1, 'Famous Brooklyn Bridge rap, top version - Princeton'),
  communityRating("Good Lovin'", '1972-01-02', 1, "Guitar World #15, smokin' and varied, China Cat at 18 min - Winterland"),
  communityRating("Good Lovin'", '1972-04-14', 2, 'One of best ever, jam way out there - Copenhagen'),
  communityRating("Good Lovin'", '1972-04-24', 2, "Rockin' the Rhein - Dusseldorf"),
  communityRating("Good Lovin'", '1972-05-07', 2, "Steppin' Out - Bickershaw"),
  communityRating("Good Lovin'", '1987-09-18', 3, 'Stop everything and listen to this now - MSG'),
  communityRating('Good Lovin', '1971-04-17', 1, 'Famous Brooklyn Bridge rap, top version - Princeton'),
  communityRating('Good Lovin', '1972-01-02', 1, "Guitar World #15, smokin' and varied - Winterland"),

  // ===== FIRE ON THE MOUNTAIN (Standalone) =====
  communityRating('Fire On The Mountain', '1980-10-31', 1, 'Rare standalone, Dead Set, barn-burner from Space - Radio City'),
  communityRating('Fire On The Mountain', '1978-09-16', 1, 'Just exactly perfect, priceless version - Egypt'),
  communityRating('Fire On The Mountain', '1978-02-05', 2, 'Crazy unique intro jam unlike any other - Cedar Falls'),

  // ===== CHINA CAT SUNFLOWER > I KNOW YOU RIDER =====
  communityRating('China Cat Sunflower > I Know You Rider', '1974-06-26', 1, '316 HeadyVersion votes - Providence'),
  communityRating('China Cat Sunflower > I Know You Rider', '1972-08-27', 1, '246 HeadyVersion votes - Veneta'),
  communityRating('China Cat Sunflower > I Know You Rider', '1972-05-03', 1, '188 HeadyVersion votes - Paris'),
  communityRating('China Cat Sunflower > I Know You Rider', '1970-05-02', 2, 'Best I Know You Rider per Dead.net forum - Harpur'),
  communityRating('China Cat Sunflower -> I Know You Rider', '1974-06-26', 1, '316 HeadyVersion votes - Providence'),
  communityRating('China Cat Sunflower -> I Know You Rider', '1972-08-27', 1, '246 HeadyVersion votes - Veneta'),
  communityRating('China Cat Sunflower -> I Know You Rider', '1972-05-03', 1, '188 HeadyVersion votes - Paris'),
  communityRating('China Cat Sunflower -> I Know You Rider', '1970-05-02', 2, 'Best I Know You Rider per Dead.net forum - Harpur'),

  // ===== SUGAR MAGNOLIA =====
  communityRating('Sugar Magnolia', '1972-08-27', 1, 'Top HeadyVersion rated - Veneta'),
  communityRating('Sugar Magnolia', '1977-05-08', 2, 'Part of legendary show - Cornell'),

  // ===== DEAL =====
  communityRating('Deal', '1978-12-16', 1, "Smokin - Dick's Picks 18 - Nashville"),
  communityRating('Deal', '1978-01-07', 1, "Extended solo 2-3 verses longer - Dick's Picks 25 - New Haven"),
  communityRating('Deal', '1989-07-19', 2, 'Great late 80s version, recommended starter - Alpine Valley'),
];

/**
 * Get all community ratings
 */
export function getCommunityRatings(): CommunityRatedPerformance[] {
  return COMMUNITY_RATINGS;
}
