/**
 * Curated multi-act festival appearances by the Grateful Dead.
 * Source: docs/superpowers/research/2026-08-20-part3-curated-tags.md,
 * section "## 5. Festival" (23 rows transcribed verbatim).
 *
 * 1969-12-06 (Altamont Free Concert) is intentionally OMITTED: the research
 * documents it as a non-performance — the Dead were billed but left after
 * the violence and never played. See "Cross-section notes" in the source
 * doc, which flags it explicitly as a non-playable row.
 */

export interface CuratedShowEntry {
  date: string;
  note: string;
  source: string;
  confidence: 'high' | 'medium';
}

export const FESTIVAL_DATES: readonly CuratedShowEntry[] = [
  {
    date: '1966-01-22',
    note: "Trips Festival night 2 (Sat), Longshoremen's Hall, SF — Kesey/Pranksters Acid Test segment",
    source: 'http://deadsources.blogspot.com/2013/02/january-1966-san-francisco-acid-tests.html',
    confidence: 'medium',
  },
  {
    date: '1966-01-23',
    note: 'Trips Festival night 3 (Sun), Longshoremen\'s Hall, SF — Dead listed on the Sunday handbill',
    source: 'http://deadsources.blogspot.com/2013/02/january-1966-san-francisco-acid-tests.html',
    confidence: 'medium',
  },
  {
    date: '1967-01-14',
    note: 'Human Be-In ("Gathering of the Tribes"), Polo Field, Golden Gate Park',
    source: 'http://deadessays.blogspot.com/2018/06/1967-show-list.html',
    confidence: 'high',
  },
  {
    date: '1967-06-18',
    note: 'Monterey International Pop Festival, Monterey County Fairgrounds, CA',
    source: 'https://www.dead.net/show/june-18-1967 ; https://www.setlist.fm/setlist/grateful-dead/1967/monterey-county-fairgrounds-monterey-ca-6bd0c2fe.html',
    confidence: 'high',
  },
  {
    date: '1968-05-18',
    note: 'Northern California Folk-Rock Festival, Santa Clara County Fairgrounds, San Jose (afternoon)',
    source: 'http://deadessays.blogspot.com/2018/10/1968-show-list.html ; https://en.wikipedia.org/wiki/Northern_California_Folk-Rock_Festival_(1968)',
    confidence: 'high',
  },
  {
    date: '1968-08-04',
    note: 'Newport Pop Festival, Orange County Fairgrounds, Costa Mesa CA — Dead played Sunday only',
    source: 'http://deadessays.blogspot.com/2018/10/1968-show-list.html ; https://www.setlist.fm/festival/1968/newport-pop-festival-1968-23d68cd7.html',
    confidence: 'high',
  },
  {
    date: '1968-09-02',
    note: "Sky River Rock Festival & Lighter Than Air Fair, Betty Nelson's Farm, Sultan WA — unbilled",
    source: 'http://deadsources.blogspot.com/2013/06/september-2-1968-sky-river-rock-festival.html',
    confidence: 'high',
  },
  {
    date: '1968-12-29',
    note: 'Miami Pop Festival, Gulfstream Park Racetrack, Hallandale FL',
    source: 'https://www.dead.net/show/december-29-1968 ; https://en.wikipedia.org/wiki/Miami_Pop_Festival_(December_1968)',
    confidence: 'high',
  },
  {
    date: '1969-05-23',
    note: 'Big Rock Pow-Wow, Hollywood Seminole Indian Reservation FL (3-day festival, day 1)',
    source: 'https://www.setlist.fm/setlist/grateful-dead/1969/hollywood-seminole-indian-reservation-hollywood-fl-3dca52b.html ; Road Trips Vol. 4 No. 1',
    confidence: 'high',
  },
  {
    date: '1969-05-24',
    note: 'Big Rock Pow-Wow, day 2 — Timothy Leary spoke from the stage after the set',
    source: 'http://deadessays.blogspot.com/2019/11/1969-show-list.html',
    confidence: 'high',
  },
  {
    date: '1969-08-16',
    note: "Woodstock Music & Art Fair, Max Yasgur's Farm, Bethel NY — late Saturday-night set",
    source: 'https://www.setlist.fm/setlist/grateful-dead/1969/max-yasgurs-farm-bethel-ny-bd6b52a.html',
    confidence: 'high',
  },
  {
    date: '1969-09-01',
    note: 'New Orleans Pop Festival, Baton Rouge International Speedway, Prairieville LA (last day)',
    source: 'https://www.setlist.fm/setlist/grateful-dead/1969/international-speedway-prairieville-la-5bdca754.html ; https://en.wikipedia.org/wiki/New_Orleans_Pop_Festival',
    confidence: 'high',
  },
  // 1969-12-06 Altamont Free Concert — SKIPPED. Billed but did not perform;
  // documented non-performance, see file header.
  {
    date: '1970-05-24',
    note: "Hollywood Music Festival, Lower Finney Green Farm, Leycett, Newcastle-under-Lyme England — Dead's first UK show",
    source: 'https://www.dead.net/show/may-24-1970 ; https://en.wikipedia.org/wiki/Hollywood_Music_Festival',
    confidence: 'high',
  },
  {
    date: '1970-06-27',
    note: 'Festival Express, Toronto — free acoustic set at Coronation Park plus electric set at CNE Stadium',
    source: 'http://deadessays.blogspot.com/2013/07/the-festival-express-guide.html',
    confidence: 'high',
  },
  {
    date: '1970-06-28',
    note: 'Festival Express, Toronto — electric set at the free Coronation Park show',
    source: 'http://deadessays.blogspot.com/2013/07/the-festival-express-guide.html',
    confidence: 'high',
  },
  {
    date: '1970-07-01',
    note: 'Festival Express, Winnipeg Stadium / Winnipeg Fairgrounds, MB',
    source: 'http://deadessays.blogspot.com/2013/07/the-festival-express-guide.html',
    confidence: 'high',
  },
  {
    date: '1970-07-04',
    note: 'Festival Express, McMahon Stadium, Calgary AB — festival ran 7/4–7/5; Dead played day 1',
    source: 'http://deadsources.blogspot.com/2018/07/july-4-5-1970-mcmahon-stadium-calgary.html',
    confidence: 'high',
  },
  {
    date: '1972-05-07',
    note: 'Bickershaw Festival, Wigan England — final day of the 3-day "Wigan Woodstock"',
    source: 'https://www.dead.net/show/may-7-1972 ; https://en.wikipedia.org/wiki/Bickershaw_Festival',
    confidence: 'high',
  },
  {
    date: '1973-07-27',
    note: 'Summer Jam at Watkins Glen — pre-festival "soundcheck" set at the Grand Prix Raceway (~100k on site)',
    source: 'https://dailydoseofdead.wordpress.com/2017/07/27/today-in-grateful-dead-history-july-27-1973-grand-prix-racecourse-watkins-glen-ny-the-watkins-glen-soundcheck/',
    confidence: 'medium',
  },
  {
    date: '1973-07-28',
    note: 'Summer Jam at Watkins Glen NY — Dead / Allman Brothers / The Band, ~600,000',
    source: 'https://en.wikipedia.org/wiki/Summer_Jam_at_Watkins_Glen',
    confidence: 'high',
  },
  {
    date: '1975-03-23',
    note: 'SNACK Benefit, Kezar Stadium SF — multi-act benefit; Dead billed as "Jerry Garcia and Friends"',
    source: 'https://en.wikipedia.org/wiki/SNACK_Benefit_Concert ; https://www.dead.net/show/march-23-1975',
    confidence: 'medium',
  },
  {
    date: '1982-09-05',
    note: 'US Festival, Glen Helen Regional Park, Devore/San Bernardino CA — Dead opened the Sunday bill',
    source: 'https://www.setlist.fm/setlist/grateful-dead/1982/glen-helen-regional-park-san-bernardino-ca-43d60777.html ; https://www.dead.net/show/september-5-1982',
    confidence: 'high',
  },
];

/** No low-confidence Festival rows were found in the research table. */
export const UNVERIFIED_FESTIVAL_DATES: readonly (Omit<CuratedShowEntry, 'confidence'> & {
  confidence: 'low';
})[] = [];
