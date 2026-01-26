/**
 * Song Performance Ratings
 *
 * Fan-voted rankings scraped from Headyversion.com
 * Generated: 2026-01-18
 *
 * Tier 1 (3 stars): Top 1-3 performances per song
 * Tier 2 (2 stars): Ranks 4-10 performances
 * Tier 3 (1 star): Notable performances (50+ votes)
 *
 * Also includes community-sourced ratings from Reddit, Dead.net forums,
 * and music publications (see communityRatings.ts)
 */

import { COMMUNITY_RATINGS } from './communityRatings';

export type PerformanceRatingTier = 1 | 2 | 3;

export interface RatedSongPerformance {
  songTitle: string;
  showDate: string;
  showIdentifier: string;
  tier: PerformanceRatingTier;
  votes?: number;
  notes?: string;
}

// Tier 1: Legendary performances (3 stars) - 987 performances
export const TIER_1_SONG_PERFORMANCES: RatedSongPerformance[] = [
  {
    songTitle: "Grateful Dead - Playing In The Band",
    showDate: "1972-08-27",
    showIdentifier: "gd72-08-27.sbd.braverman.16582.sbefail.shnf",
    tier: 1,
    votes: 371,
    notes: "371 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Playing In The Band",
    showDate: "1972-11-18",
    showIdentifier: "gd72-11-18.set2-sbd.cotsman.9002.sbeok.shnf",
    tier: 1,
    votes: 226,
    notes: "226 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Playing In The Band",
    showDate: "1973-12-02",
    showIdentifier: "gd73-12-02.aud.vernon.17278.sbeok.shnf",
    tier: 1,
    votes: 151,
    notes: "151 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Other One",
    showDate: "1970-05-02",
    showIdentifier: "gd1970-05-02.sbd.remaster.dp8outtake.100007.sbeok.flac16",
    tier: 1,
    votes: 195,
    notes: "195 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Other One",
    showDate: "1970-02-13",
    showIdentifier: "gd70-02-13.early-late.sbd.cotsman.18114.sbeok.shnf",
    tier: 1,
    votes: 119,
    notes: "119 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Other One",
    showDate: "1974-06-18",
    showIdentifier: "gd74-06-18.sbd.sacks.209.sbefail.shnf",
    tier: 1,
    votes: 116,
    notes: "116 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Cat Sunflower -&gt; I Know You Rider",
    showDate: "1974-06-26",
    showIdentifier: "gd74-06-26.moore.weiner.gdADT17.16037.sbeok.shnf",
    tier: 1,
    votes: 316,
    notes: "316 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Cat Sunflower -&gt; I Know You Rider",
    showDate: "1972-08-27",
    showIdentifier: "gd72-08-27.sbd.braverman.16582.sbefail.shnf",
    tier: 1,
    votes: 246,
    notes: "246 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Cat Sunflower -&gt; I Know You Rider",
    showDate: "1972-05-03",
    showIdentifier: "gd72-05-03.sbd.masse.142.sbeok.shnf",
    tier: 1,
    votes: 188,
    notes: "188 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sugar Magnolia",
    showDate: "1972-08-27",
    showIdentifier: "gd72-08-27.sbd.braverman.16582.sbefail.shnf",
    tier: 1,
    votes: 110,
    notes: "110 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sugar Magnolia",
    showDate: "1972-04-24",
    showIdentifier: "gd72-04-24.sbd-aud.cotsman.16332.sbeok.shnf",
    tier: 1,
    votes: 82,
    notes: "82 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sugar Magnolia",
    showDate: "1972-05-04",
    showIdentifier: "gd1972-05-04.sbd.miller.77294.sbeok.flac16",
    tier: 1,
    votes: 78,
    notes: "78 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Jack Straw",
    showDate: "1979-01-11",
    showIdentifier: "gd79-01-11.gatto.kempka.308.sbeok.shnf",
    tier: 1,
    votes: 162,
    notes: "162 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Jack Straw",
    showDate: "1972-08-27",
    showIdentifier: "gd72-08-27.sbd.braverman.16582.sbefail.shnf",
    tier: 1,
    votes: 118,
    notes: "118 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Jack Straw",
    showDate: "1978-01-22",
    showIdentifier: "gd78-01-22.sbd.popi.4974.sbeok.shnf",
    tier: 1,
    votes: 109,
    notes: "109 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Truckin",
    showDate: "1974-05-19",
    showIdentifier: "gd74-05-19.sbd.clugston.6957.sbeok.shnf",
    tier: 1,
    votes: 158,
    notes: "158 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Truckin",
    showDate: "1972-05-26",
    showIdentifier: "gd72-05-26.sbd.hollister.12758.sbeok.shnf",
    tier: 1,
    votes: 108,
    notes: "108 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Truckin",
    showDate: "1977-11-06",
    showIdentifier: "gd77-11-06.sbd.nawrocki.283.sbeok.shnf",
    tier: 1,
    votes: 97,
    notes: "97 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Drums -&gt; Space",
    showDate: "1982-04-19",
    showIdentifier: "gd82-04-19.aud-martin.warner.19420.sbeok.shnf",
    tier: 1,
    votes: 32,
    notes: "32 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Drums -&gt; Space",
    showDate: "1990-03-29",
    showIdentifier: "gd90-03-29.aud-fob.set2.unknown.1317.sbeok.shnf",
    tier: 1,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Drums -&gt; Space",
    showDate: "1978-07-08",
    showIdentifier: "gd78-07-08.sbd.unknown.294.sbeok.shnf",
    tier: 1,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Not Fade Away",
    showDate: "1977-09-03",
    showIdentifier: "gd77-09-03.sbd.unk.276.sbefixed.shnf",
    tier: 1,
    votes: 172,
    notes: "172 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Not Fade Away",
    showDate: "1977-05-08",
    showIdentifier: "gd77-05-08.sbd.hicks.4982.sbeok.shnf",
    tier: 1,
    votes: 99,
    notes: "99 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Not Fade Away",
    showDate: "1971-11-15",
    showIdentifier: "gd71-11-15.sbd.cotsman.12438.sbeok.shnf",
    tier: 1,
    votes: 82,
    notes: "82 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Eyes Of The World",
    showDate: "1974-08-06",
    showIdentifier: "gd74-08-06.merin.weiner.gdADT.5914.sbefail.shnf",
    tier: 1,
    votes: 434,
    notes: "434 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Eyes Of The World",
    showDate: "1990-03-29",
    showIdentifier: "gd90-03-29.aud-fob.set2.unknown.1317.sbeok.shnf",
    tier: 1,
    votes: 420,
    notes: "420 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Eyes Of The World",
    showDate: "1977-09-03",
    showIdentifier: "gd77-09-03.sbd.unk.276.sbefixed.shnf",
    tier: 1,
    votes: 270,
    notes: "270 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Estimated Prophet",
    showDate: "1978-02-03",
    showIdentifier: "gd78-02-03.aud.warner.19465.sbeok.shnf",
    tier: 1,
    votes: 153,
    notes: "153 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Estimated Prophet",
    showDate: "1978-07-08",
    showIdentifier: "gd78-07-08.sbd.unknown.294.sbeok.shnf",
    tier: 1,
    votes: 134,
    notes: "134 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Estimated Prophet",
    showDate: "1979-12-26",
    showIdentifier: "gd1979-12-26.sonyECM250.walker-scotton.miller.89187.sbeok.flac16",
    tier: 1,
    votes: 125,
    notes: "125 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wharf Rat",
    showDate: "1977-10-07",
    showIdentifier: "gd77-10-07.pset2-sbd.kiefe-fiske.1191.sbefixed.shnf",
    tier: 1,
    votes: 130,
    notes: "130 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wharf Rat",
    showDate: "1971-02-18",
    showIdentifier: "gd71-02-18.sbd.orf.107.sbeok.shnf",
    tier: 1,
    votes: 129,
    notes: "129 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wharf Rat",
    showDate: "1978-07-08",
    showIdentifier: "gd78-07-08.sbd.unknown.294.sbeok.shnf",
    tier: 1,
    votes: 112,
    notes: "112 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bertha",
    showDate: "1972-08-27",
    showIdentifier: "gd72-08-27.sbd.braverman.16582.sbefail.shnf",
    tier: 1,
    votes: 125,
    notes: "125 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bertha",
    showDate: "1972-04-26",
    showIdentifier: "gd1972-04-26.sbd.vernon.9197.sbeok.shnf",
    tier: 1,
    votes: 86,
    notes: "86 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bertha",
    showDate: "1971-08-06",
    showIdentifier: "gd71-08-06.aud.bertrando.yerys.129.sbeok.shnf",
    tier: 1,
    votes: 77,
    notes: "77 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Me and My Uncle",
    showDate: "1978-04-24",
    showIdentifier: "gd78-04-24.sbd.mattman.20605.sbeok.shnf",
    tier: 1,
    votes: 65,
    notes: "65 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Me and My Uncle",
    showDate: "1971-08-06",
    showIdentifier: "gd71-08-06.aud.bertrando.yerys.129.sbeok.shnf",
    tier: 1,
    votes: 52,
    notes: "52 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Me and My Uncle",
    showDate: "1972-04-26",
    showIdentifier: "gd1972-04-26.sbd.vernon.9197.sbeok.shnf",
    tier: 1,
    votes: 47,
    notes: "47 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Deal",
    showDate: "1989-07-19",
    showIdentifier: "gd89-07-19.sbd.437.sbeok.shnf",
    tier: 1,
    votes: 131,
    notes: "131 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Deal",
    showDate: "1989-07-04",
    showIdentifier: "gd89-07-04.aud.wiley.9045.sbeok.shnf",
    tier: 1,
    votes: 90,
    notes: "90 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Deal",
    showDate: "1977-05-08",
    showIdentifier: "gd77-05-08.sbd.hicks.4982.sbeok.shnf",
    tier: 1,
    votes: 82,
    notes: "82 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Looks Like Rain",
    showDate: "1972-04-08",
    showIdentifier: "gd72-04-08.sbd.giles-jeffm.2534.sbeok.shnf",
    tier: 1,
    votes: 102,
    notes: "102 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Looks Like Rain",
    showDate: "1982-10-10",
    showIdentifier: "gd82-10-10.sbd.sacks.338.sbefail.shnf",
    tier: 1,
    votes: 85,
    notes: "85 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Looks Like Rain",
    showDate: "1976-06-09",
    showIdentifier: "gd76-06-09.set2-sbd.gardner.5426.sbeok.shnf",
    tier: 1,
    votes: 56,
    notes: "56 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sugaree",
    showDate: "1977-05-22",
    showIdentifier: "gd77-05-22.sbd.dp-leftovers.18803.sbefail.shnf",
    tier: 1,
    votes: 243,
    notes: "243 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sugaree",
    showDate: "1977-05-28",
    showIdentifier: "gd77-05-28.sbd.sacks.4983.sbefail.shnf",
    tier: 1,
    votes: 222,
    notes: "222 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sugaree",
    showDate: "1977-05-19",
    showIdentifier: "gd77-05-19.sbd.direwolf.3120.sbeok.shnf",
    tier: 1,
    votes: 127,
    notes: "127 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Tennessee Jed",
    showDate: "1972-05-03",
    showIdentifier: "gd72-05-03.sbd.masse.142.sbeok.shnf",
    tier: 1,
    votes: 76,
    notes: "76 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Tennessee Jed",
    showDate: "1978-01-22",
    showIdentifier: "gd78-01-22.sbd.popi.4974.sbeok.shnf",
    tier: 1,
    votes: 55,
    notes: "55 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Tennessee Jed",
    showDate: "1977-05-21",
    showIdentifier: "gd77-05-21.sbd.boyle.271.sbeok.shnf",
    tier: 1,
    votes: 53,
    notes: "53 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Terrapin Station",
    showDate: "1977-02-26",
    showIdentifier: "gd77-02-26.sbd.alphadog.9752.sbeok.shnf",
    tier: 1,
    votes: 203,
    notes: "203 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Terrapin Station",
    showDate: "1977-05-17",
    showIdentifier: "gd77-05-17.sbd.weiner.18554.sbeok.shnf",
    tier: 1,
    votes: 100,
    notes: "100 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Terrapin Station",
    showDate: "1978-01-22",
    showIdentifier: "gd78-01-22.sbd.popi.4974.sbeok.shnf",
    tier: 1,
    votes: 83,
    notes: "83 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Loser",
    showDate: "1990-03-24",
    showIdentifier: "gd90-03-24.schoeps.wiley.11806.sbeok.shnf",
    tier: 1,
    votes: 133,
    notes: "133 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Loser",
    showDate: "1977-09-03",
    showIdentifier: "gd77-09-03.sbd.unk.276.sbefixed.shnf",
    tier: 1,
    votes: 98,
    notes: "98 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Loser",
    showDate: "1977-05-08",
    showIdentifier: "gd77-05-08.sbd.hicks.4982.sbeok.shnf",
    tier: 1,
    votes: 96,
    notes: "96 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bird Song",
    showDate: "1972-08-27",
    showIdentifier: "gd72-08-27.sbd.braverman.16582.sbefail.shnf",
    tier: 1,
    votes: 260,
    notes: "260 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bird Song",
    showDate: "1973-06-22",
    showIdentifier: "gd73-06-22.sbd.cribbs.17270.sbeok.shnf",
    tier: 1,
    votes: 192,
    notes: "192 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bird Song",
    showDate: "1972-09-21",
    showIdentifier: "gd72-09-21.sbd.masse.7296.sbeok.shnf",
    tier: 1,
    votes: 144,
    notes: "144 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Morning Dew",
    showDate: "1977-05-08",
    showIdentifier: "gd77-05-08.sbd.hicks.4982.sbeok.shnf",
    tier: 1,
    votes: 248,
    notes: "248 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Morning Dew",
    showDate: "1972-05-26",
    showIdentifier: "gd72-05-26.sbd.hollister.12758.sbeok.shnf",
    tier: 1,
    votes: 210,
    notes: "210 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Morning Dew",
    showDate: "1987-09-18",
    showIdentifier: "gd87-09-18.sbd.samaritano.20025.sbeok.shnf",
    tier: 1,
    votes: 191,
    notes: "191 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brown Eyed Women",
    showDate: "1977-05-08",
    showIdentifier: "gd77-05-08.sbd.hicks.4982.sbeok.shnf",
    tier: 1,
    votes: 170,
    notes: "170 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brown Eyed Women",
    showDate: "1977-11-04",
    showIdentifier: "gd77-11-04.sbd.unknown.2595.sbeok.shnf",
    tier: 1,
    votes: 95,
    notes: "95 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brown Eyed Women",
    showDate: "1978-02-03",
    showIdentifier: "gd78-02-03.aud.warner.19465.sbeok.shnf",
    tier: 1,
    votes: 83,
    notes: "83 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - He's Gone",
    showDate: "1972-08-27",
    showIdentifier: "gd72-08-27.sbd.braverman.16582.sbefail.shnf",
    tier: 1,
    votes: 112,
    notes: "112 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - He's Gone",
    showDate: "1981-05-06",
    showIdentifier: "gd81-05-06.glassberg.vernon.17697.sbeok.shnf",
    tier: 1,
    votes: 100,
    notes: "100 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - He's Gone",
    showDate: "1977-09-03",
    showIdentifier: "gd77-09-03.sbd.unk.276.sbefixed.shnf",
    tier: 1,
    votes: 90,
    notes: "90 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Uncle John's Band",
    showDate: "1979-12-26",
    showIdentifier: "gd1979-12-26.sonyECM250.walker-scotton.miller.89187.sbeok.flac16",
    tier: 1,
    votes: 104,
    notes: "104 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Uncle John's Band",
    showDate: "1974-09-18",
    showIdentifier: "gd74-09-18.sbd.miller.20732.sbeok.shnf",
    tier: 1,
    votes: 103,
    notes: "103 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Uncle John's Band",
    showDate: "1970-05-02",
    showIdentifier: "gd1970-05-02.sbd.remaster.dp8outtake.100007.sbeok.flac16",
    tier: 1,
    votes: 89,
    notes: "89 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Scarlet Begonias -&gt; Fire On The Mountain",
    showDate: "1977-05-08",
    showIdentifier: "gd77-05-08.sbd.hicks.4982.sbeok.shnf",
    tier: 1,
    votes: 656,
    notes: "656 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Scarlet Begonias -&gt; Fire On The Mountain",
    showDate: "1978-02-05",
    showIdentifier: "gd78-02-05.aud.set2.warner.19466.sbeok.shnf",
    tier: 1,
    votes: 336,
    notes: "336 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Scarlet Begonias -&gt; Fire On The Mountain",
    showDate: "1990-03-22",
    showIdentifier: "gd90-03-22.sbd.bertha-ashley.21433.sbeok.shnf",
    tier: 1,
    votes: 237,
    notes: "237 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big River",
    showDate: "1977-05-09",
    showIdentifier: "gd77-05-09.sbd.connor.8304.sbeok.shnf",
    tier: 1,
    votes: 75,
    notes: "75 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big River",
    showDate: "1973-12-19",
    showIdentifier: "gd73-12-19.sbd.finney.outtakes.197.sbeok.shnf",
    tier: 1,
    votes: 63,
    notes: "63 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big River",
    showDate: "1975-08-13",
    showIdentifier: "gd75-08-13.fm.vernon.23661.sbeok.shnf",
    tier: 1,
    votes: 60,
    notes: "60 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cassidy",
    showDate: "1977-05-09",
    showIdentifier: "gd77-05-09.sbd.connor.8304.sbeok.shnf",
    tier: 1,
    votes: 60,
    notes: "60 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cassidy",
    showDate: "1982-10-10",
    showIdentifier: "gd82-10-10.sbd.sacks.338.sbefail.shnf",
    tier: 1,
    votes: 56,
    notes: "56 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cassidy",
    showDate: "1978-04-24",
    showIdentifier: "gd78-04-24.sbd.mattman.20605.sbeok.shnf",
    tier: 1,
    votes: 53,
    notes: "53 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Peter",
    showDate: "1977-10-29",
    showIdentifier: "gd77-10-29.maizner.vernon.8035.sbeok.shnf",
    tier: 1,
    votes: 108,
    notes: "108 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Peter",
    showDate: "1970-05-02",
    showIdentifier: "gd1970-05-02.sbd.remaster.dp8outtake.100007.sbeok.flac16",
    tier: 1,
    votes: 89,
    notes: "89 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Peter",
    showDate: "1978-04-14",
    showIdentifier: "gd1978-04-14.sbd.miller.83717.sbeok.flac16",
    tier: 1,
    votes: 48,
    notes: "48 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stella Blue",
    showDate: "1978-10-21",
    showIdentifier: "gd78-10-21.sbd.popi.6100.sbeok.shnf",
    tier: 1,
    votes: 146,
    notes: "146 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stella Blue",
    showDate: "1974-06-18",
    showIdentifier: "gd74-06-18.sbd.sacks.209.sbefail.shnf",
    tier: 1,
    votes: 90,
    notes: "90 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stella Blue",
    showDate: "1994-03-21",
    showIdentifier: "gd94-03-21.sbd.ladner.6258.sbeok.shnf",
    tier: 1,
    votes: 76,
    notes: "76 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dark Star",
    showDate: "1972-08-27",
    showIdentifier: "gd72-08-27.sbd.braverman.16582.sbefail.shnf",
    tier: 1,
    votes: 500,
    notes: "500 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dark Star",
    showDate: "1970-02-13",
    showIdentifier: "gd70-02-13.early-late.sbd.cotsman.18114.sbeok.shnf",
    tier: 1,
    votes: 351,
    notes: "351 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dark Star",
    showDate: "1969-02-27",
    showIdentifier: "gd69-02-27.sbd.16track.kaplan.6315.sbeok.shnf",
    tier: 1,
    votes: 291,
    notes: "291 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Minglewood Blues",
    showDate: "1971-04-29",
    showIdentifier: "gd71-04-29.sbd.frisco.16782.sbeok.shnf",
    tier: 1,
    votes: 62,
    notes: "62 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Minglewood Blues",
    showDate: "1977-05-08",
    showIdentifier: "gd77-05-08.sbd.hicks.4982.sbeok.shnf",
    tier: 1,
    votes: 60,
    notes: "60 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Minglewood Blues",
    showDate: "1977-02-26",
    showIdentifier: "gd77-02-26.sbd.alphadog.9752.sbeok.shnf",
    tier: 1,
    votes: 46,
    notes: "46 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Good Loving",
    showDate: "1970-05-02",
    showIdentifier: "gd1970-05-02.sbd.remaster.dp8outtake.100007.sbeok.flac16",
    tier: 1,
    votes: 75,
    notes: "75 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Good Loving",
    showDate: "1971-04-17",
    showIdentifier: "gd71-04-17.sbd.nayfield.121.122.sbeok.shnf",
    tier: 1,
    votes: 50,
    notes: "50 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Good Loving",
    showDate: "1971-04-25",
    showIdentifier: "gd71-04-25.sbd.grote.8761.sbeok.shnf",
    tier: 1,
    votes: 42,
    notes: "42 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mexicali Blues",
    showDate: "1972-08-27",
    showIdentifier: "gd72-08-27.sbd.braverman.16582.sbefail.shnf",
    tier: 1,
    votes: 46,
    notes: "46 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mexicali Blues",
    showDate: "1977-11-06",
    showIdentifier: "gd77-11-06.sbd.nawrocki.283.sbeok.shnf",
    tier: 1,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mexicali Blues",
    showDate: "1979-12-28",
    showIdentifier: "gd79-12-28.sbd.lai.4145.sbefail.shnf",
    tier: 1,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Samson and Delilah",
    showDate: "1978-02-05",
    showIdentifier: "gd78-02-05.aud.set2.warner.19466.sbeok.shnf",
    tier: 1,
    votes: 98,
    notes: "98 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Samson and Delilah",
    showDate: "1976-12-31",
    showIdentifier: "gd76-12-31.preFM.warner.18524.20760.sbeok.shnf",
    tier: 1,
    votes: 48,
    notes: "48 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Samson and Delilah",
    showDate: "1977-05-28",
    showIdentifier: "gd77-05-28.sbd.sacks.4983.sbefail.shnf",
    tier: 1,
    votes: 44,
    notes: "44 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Goin' Down The Road Feelin' Bad",
    showDate: "1972-04-26",
    showIdentifier: "gd1972-04-26.sbd.vernon.9197.sbeok.shnf",
    tier: 1,
    votes: 106,
    notes: "106 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Goin' Down The Road Feelin' Bad",
    showDate: "1971-10-31",
    showIdentifier: "gd1971-10-31.sbd.miller.79011.sbeok.flac16",
    tier: 1,
    votes: 66,
    notes: "66 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Goin' Down The Road Feelin' Bad",
    showDate: "1971-11-15",
    showIdentifier: "gd71-11-15.sbd.cotsman.12438.sbeok.shnf",
    tier: 1,
    votes: 56,
    notes: "56 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Promised Land",
    showDate: "1972-08-27",
    showIdentifier: "gd72-08-27.sbd.braverman.16582.sbefail.shnf",
    tier: 1,
    votes: 51,
    notes: "51 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Promised Land",
    showDate: "1990-09-18",
    showIdentifier: "gd90-09-18.sbd.miller.12885.sbeok.shnf",
    tier: 1,
    votes: 37,
    notes: "37 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Promised Land",
    showDate: "1977-09-03",
    showIdentifier: "gd77-09-03.sbd.unk.276.sbefixed.shnf",
    tier: 1,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ramble On Rose",
    showDate: "1989-07-07",
    showIdentifier: "gd89-07-07.aud.wiley.7855.sbeok.shnf",
    tier: 1,
    votes: 87,
    notes: "87 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ramble On Rose",
    showDate: "1978-12-31",
    showIdentifier: "gd78-12-31.sbd.ashley.1667.sbeok.shnf",
    tier: 1,
    votes: 64,
    notes: "64 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ramble On Rose",
    showDate: "1978-04-24",
    showIdentifier: "gd78-04-24.sbd.mattman.20605.sbeok.shnf",
    tier: 1,
    votes: 60,
    notes: "60 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let It Grow",
    showDate: "1977-10-29",
    showIdentifier: "gd77-10-29.maizner.vernon.8035.sbeok.shnf",
    tier: 1,
    votes: 82,
    notes: "82 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let It Grow",
    showDate: "1981-05-01",
    showIdentifier: "gd81-05-01.wise.clugston.2218.sbeok.shnf",
    tier: 1,
    votes: 71,
    notes: "71 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let It Grow",
    showDate: "1977-10-11",
    showIdentifier: "gd77-10-11.sbd.cotsman.19290.sbeok.shnf",
    tier: 1,
    votes: 69,
    notes: "69 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Friend of the Devil",
    showDate: "1970-05-02",
    showIdentifier: "gd1970-05-02.sbd.remaster.dp8outtake.100007.sbeok.flac16",
    tier: 1,
    votes: 66,
    notes: "66 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Friend of the Devil",
    showDate: "1977-05-07",
    showIdentifier: "gd77-05-07.sbd.eaton.wizard.26085.sbeok.shnf",
    tier: 1,
    votes: 56,
    notes: "56 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Friend of the Devil",
    showDate: "1974-09-18",
    showIdentifier: "gd74-09-18.sbd.miller.20732.sbeok.shnf",
    tier: 1,
    votes: 48,
    notes: "48 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Row Jimmy",
    showDate: "1977-03-20",
    showIdentifier: "gd77-03-20.sbd.kempa.257.sbefixed.shnf",
    tier: 1,
    votes: 134,
    notes: "134 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Row Jimmy",
    showDate: "1977-05-08",
    showIdentifier: "gd77-05-08.sbd.hicks.4982.sbeok.shnf",
    tier: 1,
    votes: 106,
    notes: "106 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Row Jimmy",
    showDate: "1978-04-12",
    showIdentifier: "gd78-04-12.sbd.ashley-bertha.14085.sbeok.shnf",
    tier: 1,
    votes: 73,
    notes: "73 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - El Paso",
    showDate: "1972-08-27",
    showIdentifier: "gd72-08-27.sbd.braverman.16582.sbefail.shnf",
    tier: 1,
    votes: 49,
    notes: "49 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - El Paso",
    showDate: "1973-11-11",
    showIdentifier: "gd73-11-11.sbd.schlissel.14105.sbeok.shnf",
    tier: 1,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - El Paso",
    showDate: "1973-11-21",
    showIdentifier: "gd73-11-21.sbd.barrick.192.sbeok.shnf",
    tier: 1,
    votes: 35,
    notes: "35 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Althea",
    showDate: "1981-03-14",
    showIdentifier: "gd1981-03-14.nak700.glassberg.motb.84826.sbeok.flac16",
    tier: 1,
    votes: 164,
    notes: "164 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Althea",
    showDate: "1980-05-16",
    showIdentifier: "gd80-05-16.sbd.clugston.7472.sbeok.shnf",
    tier: 1,
    votes: 140,
    notes: "140 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Althea",
    showDate: "1990-03-15",
    showIdentifier: "gd1990-03-15.28293.sbeok.shnf",
    tier: 1,
    votes: 80,
    notes: "80 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Turn On Your Love Light",
    showDate: "1972-04-26",
    showIdentifier: "gd1972-04-26.sbd.vernon.9197.sbeok.shnf",
    tier: 1,
    votes: 94,
    notes: "94 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Turn On Your Love Light",
    showDate: "1969-02-28",
    showIdentifier: "gd69-02-28.sbd.16track.kaplan.3397.sbeok.shnf",
    tier: 1,
    votes: 84,
    notes: "84 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Turn On Your Love Light",
    showDate: "1971-08-06",
    showIdentifier: "gd71-08-06.aud.bertrando.yerys.129.sbeok.shnf",
    tier: 1,
    votes: 74,
    notes: "74 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Casey Jones",
    showDate: "1977-10-02",
    showIdentifier: "gd77-10-02.sbd.unknown.278.sbeok.shnf",
    tier: 1,
    votes: 81,
    notes: "81 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Casey Jones",
    showDate: "1971-08-06",
    showIdentifier: "gd71-08-06.aud.bertrando.yerys.129.sbeok.shnf",
    tier: 1,
    votes: 55,
    notes: "55 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Casey Jones",
    showDate: "1970-02-14",
    showIdentifier: "gd70-02-14.early-late.sbd.cotsman.18115.sbeok.shnf",
    tier: 1,
    votes: 45,
    notes: "45 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Candyman",
    showDate: "1974-02-24",
    showIdentifier: "gd74-02-24.sbd.windsor.199.sbefail.shnf",
    tier: 1,
    votes: 74,
    notes: "74 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Candyman",
    showDate: "1977-05-28",
    showIdentifier: "gd77-05-28.sbd.sacks.4983.sbefail.shnf",
    tier: 1,
    votes: 55,
    notes: "55 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Candyman",
    showDate: "1978-04-15",
    showIdentifier: "gd78-04-15.sbd.cotsman.7047.sbefail.shnf",
    tier: 1,
    votes: 32,
    notes: "32 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mississippi Halfstep Uptown Toodeloo",
    showDate: "1977-09-03",
    showIdentifier: "gd77-09-03.sbd.unk.276.sbefixed.shnf",
    tier: 1,
    votes: 235,
    notes: "235 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mississippi Halfstep Uptown Toodeloo",
    showDate: "1977-05-07",
    showIdentifier: "gd77-05-07.sbd.eaton.wizard.26085.sbeok.shnf",
    tier: 1,
    votes: 138,
    notes: "138 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mississippi Halfstep Uptown Toodeloo",
    showDate: "1977-11-06",
    showIdentifier: "gd77-11-06.sbd.nawrocki.283.sbeok.shnf",
    tier: 1,
    votes: 108,
    notes: "108 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Pretty Peggy O",
    showDate: "1978-04-16",
    showIdentifier: "gd78-04-16.sbd.lai.292.sbeok.shnf",
    tier: 1,
    votes: 132,
    notes: "132 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Pretty Peggy O",
    showDate: "1977-09-03",
    showIdentifier: "gd77-09-03.sbd.unk.276.sbefixed.shnf",
    tier: 1,
    votes: 129,
    notes: "129 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Pretty Peggy O",
    showDate: "1977-05-05",
    showIdentifier: "gd77-05-05.sbd.stephens.8832.sbeok.shnf",
    tier: 1,
    votes: 112,
    notes: "112 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Music Never Stopped",
    showDate: "1978-04-24",
    showIdentifier: "gd78-04-24.sbd.mattman.20605.sbeok.shnf",
    tier: 1,
    votes: 155,
    notes: "155 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Music Never Stopped",
    showDate: "1977-05-09",
    showIdentifier: "gd77-05-09.sbd.connor.8304.sbeok.shnf",
    tier: 1,
    votes: 134,
    notes: "134 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Music Never Stopped",
    showDate: "1978-02-03",
    showIdentifier: "gd78-02-03.aud.warner.19465.sbeok.shnf",
    tier: 1,
    votes: 116,
    notes: "116 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Beat it on Down The Line",
    showDate: "1977-03-20",
    showIdentifier: "gd77-03-20.sbd.kempa.257.sbefixed.shnf",
    tier: 1,
    votes: 37,
    notes: "37 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Beat it on Down The Line",
    showDate: "1973-02-28",
    showIdentifier: "gd73-02-28.sbd.weiner.15386.sbeok.shnf",
    tier: 1,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Beat it on Down The Line",
    showDate: "1972-04-07",
    showIdentifier: "gd72-04-07.aud.hanno.6161.sbeok.shnf",
    tier: 1,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cumberland Blues",
    showDate: "1972-04-08",
    showIdentifier: "gd72-04-08.sbd.giles-jeffm.2534.sbeok.shnf",
    tier: 1,
    votes: 119,
    notes: "119 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cumberland Blues",
    showDate: "1972-09-21",
    showIdentifier: "gd72-09-21.sbd.masse.7296.sbeok.shnf",
    tier: 1,
    votes: 77,
    notes: "77 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cumberland Blues",
    showDate: "1972-09-27",
    showIdentifier: "gd72-09-27.sbd.vernon.18106.sbeok.shnf",
    tier: 1,
    votes: 70,
    notes: "70 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Around and Around",
    showDate: "1972-09-27",
    showIdentifier: "gd72-09-27.sbd.vernon.18106.sbeok.shnf",
    tier: 1,
    votes: 37,
    notes: "37 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Around and Around",
    showDate: "1978-01-22",
    showIdentifier: "gd78-01-22.sbd.popi.4974.sbeok.shnf",
    tier: 1,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Around and Around",
    showDate: "1977-03-18",
    showIdentifier: "gd77-03-18.sbd.unknown.254.sbeok.shnf",
    tier: 1,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - They Love Each Other",
    showDate: "1977-02-26",
    showIdentifier: "gd77-02-26.sbd.alphadog.9752.sbeok.shnf",
    tier: 1,
    votes: 77,
    notes: "77 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - They Love Each Other",
    showDate: "1977-05-08",
    showIdentifier: "gd77-05-08.sbd.hicks.4982.sbeok.shnf",
    tier: 1,
    votes: 71,
    notes: "71 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - They Love Each Other",
    showDate: "1973-02-09",
    showIdentifier: "gd73-02-09.sbd.allred.9888.sbeok.shnf",
    tier: 1,
    votes: 66,
    notes: "66 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - One More Saturday Night",
    showDate: "1972-04-08",
    showIdentifier: "gd72-04-08.sbd.giles-jeffm.2534.sbeok.shnf",
    tier: 1,
    votes: 54,
    notes: "54 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - One More Saturday Night",
    showDate: "1972-04-26",
    showIdentifier: "gd1972-04-26.sbd.vernon.9197.sbeok.shnf",
    tier: 1,
    votes: 33,
    notes: "33 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - One More Saturday Night",
    showDate: "1977-05-08",
    showIdentifier: "gd77-05-08.sbd.hicks.4982.sbeok.shnf",
    tier: 1,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cold Rain and Snow",
    showDate: "1978-02-03",
    showIdentifier: "gd78-02-03.aud.warner.19465.sbeok.shnf",
    tier: 1,
    votes: 62,
    notes: "62 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cold Rain and Snow",
    showDate: "1979-12-26",
    showIdentifier: "gd1979-12-26.sonyECM250.walker-scotton.miller.89187.sbeok.flac16",
    tier: 1,
    votes: 54,
    notes: "54 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cold Rain and Snow",
    showDate: "1973-12-02",
    showIdentifier: "gd73-12-02.aud.vernon.17278.sbeok.shnf",
    tier: 1,
    votes: 52,
    notes: "52 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Greatest Story Ever Told",
    showDate: "1972-08-27",
    showIdentifier: "gd72-08-27.sbd.braverman.16582.sbefail.shnf",
    tier: 1,
    votes: 116,
    notes: "116 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Greatest Story Ever Told",
    showDate: "1972-09-28",
    showIdentifier: "gd72-09-28.sbd.bill.12657.sbeok.shnf",
    tier: 1,
    votes: 80,
    notes: "80 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Greatest Story Ever Told",
    showDate: "1972-05-07",
    showIdentifier: "gd72-05-07.sbd-aud.clugston.9193.sbeok.shnf",
    tier: 1,
    votes: 60,
    notes: "60 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feel Like A Stranger",
    showDate: "1989-10-09",
    showIdentifier: "gd89-10-09.sbd.serafin.7721.sbeok.shnf",
    tier: 1,
    votes: 88,
    notes: "88 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feel Like A Stranger",
    showDate: "1984-10-12",
    showIdentifier: "gd84-10-12-oade.sacks.8795.sbefail.shnf",
    tier: 1,
    votes: 69,
    notes: "69 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feel Like A Stranger",
    showDate: "1980-11-30",
    showIdentifier: "gd80-11-30.sbd-aud.sacks.2416.sbeok.shnf",
    tier: 1,
    votes: 65,
    notes: "65 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dire Wolf",
    showDate: "1970-05-02",
    showIdentifier: "gd1970-05-02.sbd.remaster.dp8outtake.100007.sbeok.flac16",
    tier: 1,
    votes: 61,
    notes: "61 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dire Wolf",
    showDate: "1978-07-08",
    showIdentifier: "gd78-07-08.sbd.unknown.294.sbeok.shnf",
    tier: 1,
    votes: 56,
    notes: "56 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dire Wolf",
    showDate: "1978-04-16",
    showIdentifier: "gd78-04-16.sbd.lai.292.sbeok.shnf",
    tier: 1,
    votes: 52,
    notes: "52 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Drums",
    showDate: "1978-01-22",
    showIdentifier: "gd78-01-22.sbd.popi.4974.sbeok.shnf",
    tier: 1,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Drums",
    showDate: "1978-12-31",
    showIdentifier: "gd78-12-31.sbd.ashley.1667.sbeok.shnf",
    tier: 1,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Drums",
    showDate: "1990-07-18",
    showIdentifier: "gd90-07-18.sbd.wilson.12760.sbeok.shnf",
    tier: 1,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brokedown Palace",
    showDate: "1972-09-27",
    showIdentifier: "gd72-09-27.sbd.vernon.18106.sbeok.shnf",
    tier: 1,
    votes: 123,
    notes: "123 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brokedown Palace",
    showDate: "1980-10-03",
    showIdentifier: "gd1980-10-03.nak700.ellner.koucky.89128.sbeok.flac16",
    tier: 1,
    votes: 115,
    notes: "115 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brokedown Palace",
    showDate: "1972-04-11",
    showIdentifier: "gd72-04-11.sbd.giles.12186.sbeok.shnf",
    tier: 1,
    votes: 71,
    notes: "71 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Space",
    showDate: "1982-04-19",
    showIdentifier: "gd82-04-19.aud-martin.warner.19420.sbeok.shnf",
    tier: 1,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Space",
    showDate: "1980-11-30",
    showIdentifier: "gd80-11-30.sbd-aud.sacks.2416.sbeok.shnf",
    tier: 1,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Space",
    showDate: "1978-01-22",
    showIdentifier: "gd78-01-22.sbd.popi.4974.sbeok.shnf",
    tier: 1,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Shakedown Street",
    showDate: "1985-06-30",
    showIdentifier: "gd85-06-30.sbd.georges.366.sbeok.shnf",
    tier: 1,
    votes: 177,
    notes: "177 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Shakedown Street",
    showDate: "1979-10-25",
    showIdentifier: "gd79-10-25.sbd.set2.fishman.21271.sbefail.shnf",
    tier: 1,
    votes: 163,
    notes: "163 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Shakedown Street",
    showDate: "1982-04-06",
    showIdentifier: "gd82-04-06.sbd-patched.wiley.16785.sbeok.shnf",
    tier: 1,
    votes: 85,
    notes: "85 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Johnny B. Goode",
    showDate: "1971-07-02",
    showIdentifier: "gd71-07-02.sbd.backus.11798.sbeok.shnf",
    tier: 1,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Johnny B. Goode",
    showDate: "1980-11-30",
    showIdentifier: "gd80-11-30.sbd-aud.sacks.2416.sbeok.shnf",
    tier: 1,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Johnny B. Goode",
    showDate: "1977-06-08",
    showIdentifier: "gd77-06-08.sbd.clugston.15421.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Box of Rain",
    showDate: "1989-07-07",
    showIdentifier: "gd89-07-07.aud.wiley.7855.sbeok.shnf",
    tier: 1,
    votes: 68,
    notes: "68 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Box of Rain",
    showDate: "1973-03-24",
    showIdentifier: "gd73-03-24.sbd.bertha-ashley.25508.sbeok.shnf",
    tier: 1,
    votes: 55,
    notes: "55 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Box of Rain",
    showDate: "1973-02-28",
    showIdentifier: "gd73-02-28.sbd.weiner.15386.sbeok.shnf",
    tier: 1,
    votes: 48,
    notes: "48 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ship of Fools",
    showDate: "1974-06-23",
    showIdentifier: "gd74-06-23.sbd.cribbs.16780.sbeok.shnf",
    tier: 1,
    votes: 100,
    notes: "100 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ship of Fools",
    showDate: "1977-05-09",
    showIdentifier: "gd77-05-09.sbd.connor.8304.sbeok.shnf",
    tier: 1,
    votes: 64,
    notes: "64 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ship of Fools",
    showDate: "1978-07-08",
    showIdentifier: "gd78-07-08.sbd.unknown.294.sbeok.shnf",
    tier: 1,
    votes: 55,
    notes: "55 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Throwing Stones",
    showDate: "1989-10-09",
    showIdentifier: "gd89-10-09.sbd.serafin.7721.sbeok.shnf",
    tier: 1,
    votes: 49,
    notes: "49 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Throwing Stones",
    showDate: "1982-10-10",
    showIdentifier: "gd82-10-10.sbd.sacks.338.sbefail.shnf",
    tier: 1,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Throwing Stones",
    showDate: "1990-03-29",
    showIdentifier: "gd90-03-29.aud-fob.set2.unknown.1317.sbeok.shnf",
    tier: 1,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - U.S. Blues (Wave That Flag)",
    showDate: "1978-04-12",
    showIdentifier: "gd78-04-12.sbd.ashley-bertha.14085.sbeok.shnf",
    tier: 1,
    votes: 94,
    notes: "94 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - U.S. Blues (Wave That Flag)",
    showDate: "1974-06-23",
    showIdentifier: "gd74-06-23.sbd.cribbs.16780.sbeok.shnf",
    tier: 1,
    votes: 86,
    notes: "86 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - U.S. Blues (Wave That Flag)",
    showDate: "1974-06-28",
    showIdentifier: "gd74-06-28.moore.weiner.gdADT18.16038.sbeok.shnf",
    tier: 1,
    votes: 63,
    notes: "63 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Throated Wind",
    showDate: "1972-08-27",
    showIdentifier: "gd72-08-27.sbd.braverman.16582.sbefail.shnf",
    tier: 1,
    votes: 62,
    notes: "62 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Throated Wind",
    showDate: "1974-05-19",
    showIdentifier: "gd74-05-19.sbd.clugston.6957.sbeok.shnf",
    tier: 1,
    votes: 60,
    notes: "60 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Throated Wind",
    showDate: "1972-09-17",
    showIdentifier: "gd1972-09-17.aud-wolfson.minches.28165.shnf",
    tier: 1,
    votes: 54,
    notes: "54 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - St. Stephen",
    showDate: "1978-01-22",
    showIdentifier: "gd78-01-22.sbd.popi.4974.sbeok.shnf",
    tier: 1,
    votes: 129,
    notes: "129 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - St. Stephen",
    showDate: "1969-02-27",
    showIdentifier: "gd69-02-27.sbd.16track.kaplan.6315.sbeok.shnf",
    tier: 1,
    votes: 114,
    notes: "114 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - St. Stephen",
    showDate: "1977-05-08",
    showIdentifier: "gd77-05-08.sbd.hicks.4982.sbeok.shnf",
    tier: 1,
    votes: 66,
    notes: "66 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Franklin's Tower",
    showDate: "1976-10-09",
    showIdentifier: "gd76-10-09.set2-sbd.miller.12519.sbeok.shnf",
    tier: 1,
    votes: 96,
    notes: "96 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Franklin's Tower",
    showDate: "1975-09-28",
    showIdentifier: "gd75-09-28.sbd.fink.9392.sbeok.shnf",
    tier: 1,
    votes: 62,
    notes: "62 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Franklin's Tower",
    showDate: "1977-05-22",
    showIdentifier: "gd77-05-22.sbd.dp-leftovers.18803.sbefail.shnf",
    tier: 1,
    votes: 56,
    notes: "56 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Touch of Grey",
    showDate: "1987-03-27",
    showIdentifier: "gd87-03-27.nak.braverman.7343.sbefixed.shnf",
    tier: 1,
    votes: 57,
    notes: "57 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Touch of Grey",
    showDate: "1989-07-04",
    showIdentifier: "gd89-07-04.aud.wiley.9045.sbeok.shnf",
    tier: 1,
    votes: 39,
    notes: "39 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Touch of Grey",
    showDate: "1986-12-15",
    showIdentifier: "gd86-12-15.nakcm101-dwonk.25263.sbeok.flacf",
    tier: 1,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Wheel",
    showDate: "1977-02-26",
    showIdentifier: "gd77-02-26.sbd.alphadog.9752.sbeok.shnf",
    tier: 1,
    votes: 79,
    notes: "79 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Wheel",
    showDate: "1978-02-03",
    showIdentifier: "gd78-02-03.aud.warner.19465.sbeok.shnf",
    tier: 1,
    votes: 70,
    notes: "70 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Wheel",
    showDate: "1977-05-07",
    showIdentifier: "gd77-05-07.sbd.eaton.wizard.26085.sbeok.shnf",
    tier: 1,
    votes: 66,
    notes: "66 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Railroad Blues",
    showDate: "1972-04-17",
    showIdentifier: "gd72-04-17.sbd.vernon.9390.sbeok.shnf",
    tier: 1,
    votes: 56,
    notes: "56 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Railroad Blues",
    showDate: "1983-09-02",
    showIdentifier: "gd83-09-02.beyer_senn.unk.23854.sbefail.shnf",
    tier: 1,
    votes: 56,
    notes: "56 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Railroad Blues",
    showDate: "1973-02-26",
    showIdentifier: "gd73-02-26.sbd.kaplan.1208.sbeok.shnf",
    tier: 1,
    votes: 42,
    notes: "42 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Aiko Aiko",
    showDate: "1989-07-07",
    showIdentifier: "gd89-07-07.aud.wiley.7855.sbeok.shnf",
    tier: 1,
    votes: 75,
    notes: "75 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Aiko Aiko",
    showDate: "1995-03-18",
    showIdentifier: "gd95-03-18.sbd.1362.sbeok.shnf",
    tier: 1,
    votes: 44,
    notes: "44 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Aiko Aiko",
    showDate: "1978-04-16",
    showIdentifier: "gd78-04-16.sbd.lai.292.sbeok.shnf",
    tier: 1,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dancin' in the Streets",
    showDate: "1977-05-08",
    showIdentifier: "gd77-05-08.sbd.hicks.4982.sbeok.shnf",
    tier: 1,
    votes: 153,
    notes: "153 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dancin' in the Streets",
    showDate: "1977-05-22",
    showIdentifier: "gd77-05-22.sbd.dp-leftovers.18803.sbefail.shnf",
    tier: 1,
    votes: 118,
    notes: "118 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dancin' in the Streets",
    showDate: "1970-05-02",
    showIdentifier: "gd1970-05-02.sbd.remaster.dp8outtake.100007.sbeok.flac16",
    tier: 1,
    votes: 105,
    notes: "105 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lost Sailor -&gt; Saint of Circumstance",
    showDate: "1982-10-10",
    showIdentifier: "gd82-10-10.sbd.sacks.338.sbefail.shnf",
    tier: 1,
    votes: 78,
    notes: "78 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lost Sailor -&gt; Saint of Circumstance",
    showDate: "1984-10-12",
    showIdentifier: "gd84-10-12-oade.sacks.8795.sbefail.shnf",
    tier: 1,
    votes: 48,
    notes: "48 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lost Sailor -&gt; Saint of Circumstance",
    showDate: "1982-04-06",
    showIdentifier: "gd82-04-06.sbd-patched.wiley.16785.sbeok.shnf",
    tier: 1,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mama Tried",
    showDate: "1977-05-08",
    showIdentifier: "gd77-05-08.sbd.hicks.4982.sbeok.shnf",
    tier: 1,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mama Tried",
    showDate: "1977-02-26",
    showIdentifier: "gd77-02-26.sbd.alphadog.9752.sbeok.shnf",
    tier: 1,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mama Tried",
    showDate: "1977-11-05",
    showIdentifier: "gd77-11-05.sbd.clugston.6934.sbeok.shnf",
    tier: 1,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It Must Have Been The Roses",
    showDate: "1978-07-08",
    showIdentifier: "gd78-07-08.sbd.unknown.294.sbeok.shnf",
    tier: 1,
    votes: 70,
    notes: "70 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It Must Have Been The Roses",
    showDate: "1975-08-13",
    showIdentifier: "gd75-08-13.fm.vernon.23661.sbeok.shnf",
    tier: 1,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It Must Have Been The Roses",
    showDate: "1975-09-28",
    showIdentifier: "gd75-09-28.sbd.fink.9392.sbeok.shnf",
    tier: 1,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Little Red Rooster",
    showDate: "1989-07-07",
    showIdentifier: "gd89-07-07.aud.wiley.7855.sbeok.shnf",
    tier: 1,
    votes: 57,
    notes: "57 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Little Red Rooster",
    showDate: "1980-11-30",
    showIdentifier: "gd80-11-30.sbd-aud.sacks.2416.sbeok.shnf",
    tier: 1,
    votes: 33,
    notes: "33 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Little Red Rooster",
    showDate: "1984-04-20",
    showIdentifier: "gd84-04-20.senn.fishman.7854.sbeok.shnf",
    tier: 1,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hell in a Bucket",
    showDate: "1990-03-26",
    showIdentifier: "gd90-03-26.sbd.gorinsky.8508.sbeok.shnf",
    tier: 1,
    votes: 45,
    notes: "45 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hell in a Bucket",
    showDate: "1989-07-07",
    showIdentifier: "gd89-07-07.aud.wiley.7855.sbeok.shnf",
    tier: 1,
    votes: 35,
    notes: "35 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hell in a Bucket",
    showDate: "1987-09-24",
    showIdentifier: "gd87-09-24.sbd.fishman.21782.sbeok.shnf",
    tier: 1,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Don't Ease Me In",
    showDate: "1970-05-02",
    showIdentifier: "gd1970-05-02.sbd.remaster.dp8outtake.100007.sbeok.flac16",
    tier: 1,
    votes: 44,
    notes: "44 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Don't Ease Me In",
    showDate: "1973-10-19",
    showIdentifier: "gd73-10-19.sbd.nayfield.187.sbeok.shnf",
    tier: 1,
    votes: 33,
    notes: "33 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Don't Ease Me In",
    showDate: "1970-05-15",
    showIdentifier: "gd70-05-15.early-late.sbd.97.sbeok.shnf",
    tier: 1,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Doll",
    showDate: "1977-05-19",
    showIdentifier: "gd77-05-19.sbd.direwolf.3120.sbeok.shnf",
    tier: 1,
    votes: 76,
    notes: "76 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Doll",
    showDate: "1977-12-29",
    showIdentifier: "gd1977-12-29.aud.92374.flac16",
    tier: 1,
    votes: 52,
    notes: "52 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Doll",
    showDate: "1974-06-20",
    showIdentifier: "gd74-06-20.sbd.clugston.2179.sbeok.shnf",
    tier: 1,
    votes: 50,
    notes: "50 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Help On The Way &gt; Slipknot &gt; Franklin's Tower",
    showDate: "1975-08-13",
    showIdentifier: "gd75-08-13.fm.vernon.23661.sbeok.shnf",
    tier: 1,
    votes: 231,
    notes: "231 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Help On The Way &gt; Slipknot &gt; Franklin's Tower",
    showDate: "1977-05-09",
    showIdentifier: "gd77-05-09.sbd.connor.8304.sbeok.shnf",
    tier: 1,
    votes: 165,
    notes: "165 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Help On The Way &gt; Slipknot &gt; Franklin's Tower",
    showDate: "1977-06-09",
    showIdentifier: "gd1977-06-09.28614.sbeok.flac16",
    tier: 1,
    votes: 157,
    notes: "157 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Crazy Fingers",
    showDate: "1976-06-09",
    showIdentifier: "gd76-06-09.set2-sbd.gardner.5426.sbeok.shnf",
    tier: 1,
    votes: 89,
    notes: "89 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Crazy Fingers",
    showDate: "1975-08-13",
    showIdentifier: "gd75-08-13.fm.vernon.23661.sbeok.shnf",
    tier: 1,
    votes: 76,
    notes: "76 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Crazy Fingers",
    showDate: "1976-06-14",
    showIdentifier: "gd76-06-14.sbd.hollister.22804.sbeok.shnf",
    tier: 1,
    votes: 74,
    notes: "74 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lazy Lightnin' -&gt; Supplication",
    showDate: "1977-05-22",
    showIdentifier: "gd77-05-22.sbd.dp-leftovers.18803.sbefail.shnf",
    tier: 1,
    votes: 83,
    notes: "83 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lazy Lightnin' -&gt; Supplication",
    showDate: "1977-11-02",
    showIdentifier: "gd1977-11-02.mtx.sirmick.86546.sbeok.flac16",
    tier: 1,
    votes: 62,
    notes: "62 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lazy Lightnin' -&gt; Supplication",
    showDate: "1977-05-25",
    showIdentifier: "gd77-05-25.sbd.shannon.13399.sbefail.shnf",
    tier: 1,
    votes: 46,
    notes: "46 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Need A Miracle",
    showDate: "1978-12-31",
    showIdentifier: "gd78-12-31.sbd.ashley.1667.sbeok.shnf",
    tier: 1,
    votes: 44,
    notes: "44 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Need A Miracle",
    showDate: "1978-09-16",
    showIdentifier: "gd78-09-16.sbd.orf.2319.sbeok.shnf",
    tier: 1,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Need A Miracle",
    showDate: "1979-01-15",
    showIdentifier: "gd79-01-15.rolfe.wise-cohen.310.sbeok.shnf",
    tier: 1,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - High Time",
    showDate: "1977-05-17",
    showIdentifier: "gd77-05-17.sbd.weiner.18554.sbeok.shnf",
    tier: 1,
    votes: 60,
    notes: "60 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - High Time",
    showDate: "1976-06-14",
    showIdentifier: "gd76-06-14.sbd.hollister.22804.sbeok.shnf",
    tier: 1,
    votes: 39,
    notes: "39 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - High Time",
    showDate: "1985-11-01",
    showIdentifier: "gd85-11-01.oade.connor.9217.sbeok.shnf",
    tier: 1,
    votes: 37,
    notes: "37 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cryptical Envelopment",
    showDate: "1970-05-02",
    showIdentifier: "gd1970-05-02.sbd.remaster.dp8outtake.100007.sbeok.flac16",
    tier: 1,
    votes: 55,
    notes: "55 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cryptical Envelopment",
    showDate: "1970-02-13",
    showIdentifier: "gd70-02-13.early-late.sbd.cotsman.18114.sbeok.shnf",
    tier: 1,
    votes: 32,
    notes: "32 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cryptical Envelopment",
    showDate: "1969-02-28",
    showIdentifier: "gd69-02-28.sbd.16track.kaplan.3397.sbeok.shnf",
    tier: 1,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It's All Over Now Baby Blue",
    showDate: "1982-10-10",
    showIdentifier: "gd82-10-10.sbd.sacks.338.sbefail.shnf",
    tier: 1,
    votes: 45,
    notes: "45 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It's All Over Now Baby Blue",
    showDate: "1982-04-06",
    showIdentifier: "gd82-04-06.sbd-patched.wiley.16785.sbeok.shnf",
    tier: 1,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It's All Over Now Baby Blue",
    showDate: "1974-02-24",
    showIdentifier: "gd74-02-24.sbd.windsor.199.sbefail.shnf",
    tier: 1,
    votes: 35,
    notes: "35 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hard to Handle",
    showDate: "1971-08-06",
    showIdentifier: "gd71-08-06.aud.bertrando.yerys.129.sbeok.shnf",
    tier: 1,
    votes: 228,
    notes: "228 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hard to Handle",
    showDate: "1971-04-29",
    showIdentifier: "gd71-04-29.sbd.frisco.16782.sbeok.shnf",
    tier: 1,
    votes: 75,
    notes: "75 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hard to Handle",
    showDate: "1971-07-31",
    showIdentifier: "gd71-07-31.winberg.weiner.5678.gdADT05.sbefail.shnf",
    tier: 1,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Man Smart, Woman Smarter",
    showDate: "1989-07-04",
    showIdentifier: "gd89-07-04.aud.wiley.9045.sbeok.shnf",
    tier: 1,
    votes: 53,
    notes: "53 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Man Smart, Woman Smarter",
    showDate: "1982-08-07",
    showIdentifier: "gd82-08-07.sbd-streeter-wise.unknown.7689.sbeok.shnf",
    tier: 1,
    votes: 32,
    notes: "32 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Man Smart, Woman Smarter",
    showDate: "1989-07-12",
    showIdentifier: "gd89-07-12.aud-fob.gardner.2554.sbeok.shnf",
    tier: 1,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Eleven",
    showDate: "1968-10-12",
    showIdentifier: "gd68-10-12.sbd.eD.10909.sbeok.shnf",
    tier: 1,
    votes: 92,
    notes: "92 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Eleven",
    showDate: "1969-02-28",
    showIdentifier: "gd69-02-28.sbd.16track.kaplan.3397.sbeok.shnf",
    tier: 1,
    votes: 69,
    notes: "69 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Eleven",
    showDate: "1968-08-23",
    showIdentifier: "gd68-08-23.sbd.sacks.52.sbefail.shnf",
    tier: 1,
    votes: 51,
    notes: "51 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stagger Lee",
    showDate: "1978-12-31",
    showIdentifier: "gd78-12-31.sbd.ashley.1667.sbeok.shnf",
    tier: 1,
    votes: 52,
    notes: "52 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stagger Lee",
    showDate: "1978-12-16",
    showIdentifier: "gd1978-12-16.sonyecm250-no-dolby.walker-scotton.miller.82212.sbeok.flac16",
    tier: 1,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stagger Lee",
    showDate: "1989-07-04",
    showIdentifier: "gd89-07-04.aud.wiley.9045.sbeok.shnf",
    tier: 1,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - West L.A. Fadeaway",
    showDate: "1989-07-19",
    showIdentifier: "gd89-07-19.sbd.437.sbeok.shnf",
    tier: 1,
    votes: 68,
    notes: "68 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - West L.A. Fadeaway",
    showDate: "1990-03-22",
    showIdentifier: "gd90-03-22.sbd.bertha-ashley.21433.sbeok.shnf",
    tier: 1,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - West L.A. Fadeaway",
    showDate: "1983-04-26",
    showIdentifier: "gd83-04-26.sbd.parrillo.2606.sbeok.shnf",
    tier: 1,
    votes: 33,
    notes: "33 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Alabama Getaway",
    showDate: "1979-12-26",
    showIdentifier: "gd1979-12-26.sonyECM250.walker-scotton.miller.89187.sbeok.flac16",
    tier: 1,
    votes: 66,
    notes: "66 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Alabama Getaway",
    showDate: "1981-05-06",
    showIdentifier: "gd81-05-06.glassberg.vernon.17697.sbeok.shnf",
    tier: 1,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Alabama Getaway",
    showDate: "1983-10-14",
    showIdentifier: "gd83-10-14.beyer-ficca-brennan.ficca.20023.sbeok.shnf",
    tier: 1,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Me and Bobby McGee",
    showDate: "1973-11-11",
    showIdentifier: "gd73-11-11.sbd.schlissel.14105.sbeok.shnf",
    tier: 1,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Me and Bobby McGee",
    showDate: "1974-07-19",
    showIdentifier: "gd74-07-19.sbd.symons.12381.sbeok.shnf",
    tier: 1,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Me and Bobby McGee",
    showDate: "1972-05-03",
    showIdentifier: "gd72-05-03.sbd.masse.142.sbeok.shnf",
    tier: 1,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - All Along the Watchtower",
    showDate: "1989-07-04",
    showIdentifier: "gd89-07-04.aud.wiley.9045.sbeok.shnf",
    tier: 1,
    votes: 49,
    notes: "49 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - All Along the Watchtower",
    showDate: "1990-03-24",
    showIdentifier: "gd90-03-24.schoeps.wiley.11806.sbeok.shnf",
    tier: 1,
    votes: 42,
    notes: "42 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - All Along the Watchtower",
    showDate: "1987-09-18",
    showIdentifier: "gd87-09-18.sbd.samaritano.20025.sbeok.shnf",
    tier: 1,
    votes: 34,
    notes: "34 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Scarlet Begonias",
    showDate: "1976-10-09",
    showIdentifier: "gd76-10-09.set2-sbd.miller.12519.sbeok.shnf",
    tier: 1,
    votes: 74,
    notes: "74 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Scarlet Begonias",
    showDate: "1974-07-19",
    showIdentifier: "gd74-07-19.sbd.symons.12381.sbeok.shnf",
    tier: 1,
    votes: 60,
    notes: "60 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Scarlet Begonias",
    showDate: "1974-05-14",
    showIdentifier: "gd74-05-14.sbd.murphy.1823.sbeok.shnf",
    tier: 1,
    votes: 52,
    notes: "52 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Jack A Roe",
    showDate: "1977-05-17",
    showIdentifier: "gd77-05-17.sbd.weiner.18554.sbeok.shnf",
    tier: 1,
    votes: 101,
    notes: "101 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Jack A Roe",
    showDate: "1977-05-21",
    showIdentifier: "gd77-05-21.sbd.boyle.271.sbeok.shnf",
    tier: 1,
    votes: 57,
    notes: "57 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Jack A Roe",
    showDate: "1977-05-18",
    showIdentifier: "gd77-05-18.sbd.murphy.5596.sbeok.shnf",
    tier: 1,
    votes: 32,
    notes: "32 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - When I Paint My Masterpiece",
    showDate: "1990-03-29",
    showIdentifier: "gd90-03-29.aud-fob.set2.unknown.1317.sbeok.shnf",
    tier: 1,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - When I Paint My Masterpiece",
    showDate: "1989-07-04",
    showIdentifier: "gd89-07-04.aud.wiley.9045.sbeok.shnf",
    tier: 1,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - When I Paint My Masterpiece",
    showDate: "1987-09-18",
    showIdentifier: "gd87-09-18.sbd.samaritano.20025.sbeok.shnf",
    tier: 1,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Passenger",
    showDate: "1978-04-24",
    showIdentifier: "gd78-04-24.sbd.mattman.20605.sbeok.shnf",
    tier: 1,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Passenger",
    showDate: "1979-10-25",
    showIdentifier: "gd79-10-25.sbd.set2.fishman.21271.sbefail.shnf",
    tier: 1,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Passenger",
    showDate: "1977-05-28",
    showIdentifier: "gd77-05-28.sbd.sacks.4983.sbefail.shnf",
    tier: 1,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Its All Over Now",
    showDate: "1979-12-28",
    showIdentifier: "gd79-12-28.sbd.lai.4145.sbefail.shnf",
    tier: 1,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Its All Over Now",
    showDate: "1978-12-31",
    showIdentifier: "gd78-12-31.sbd.ashley.1667.sbeok.shnf",
    tier: 1,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Its All Over Now",
    showDate: "1977-04-30",
    showIdentifier: "gd77-04-30.moore.minches.17952.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Foolish Heart",
    showDate: "1990-03-19",
    showIdentifier: "gd90-03-19.prefm-sbd.sacks.1526.sbeok.shnf",
    tier: 1,
    votes: 67,
    notes: "67 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Foolish Heart",
    showDate: "1989-07-19",
    showIdentifier: "gd89-07-19.sbd.437.sbeok.shnf",
    tier: 1,
    votes: 65,
    notes: "65 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Foolish Heart",
    showDate: "1990-07-12",
    showIdentifier: "gd90-07-12.sbd.mcatee.2582.sbeok.shnf",
    tier: 1,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Victim Or The Crime",
    showDate: "1990-07-19",
    showIdentifier: "gd90-07-19.dsbd.garcia420.2177.sbeok.shnf",
    tier: 1,
    votes: 37,
    notes: "37 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Victim Or The Crime",
    showDate: "1990-07-12",
    showIdentifier: "gd90-07-12.sbd.mcatee.2582.sbeok.shnf",
    tier: 1,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Victim Or The Crime",
    showDate: "1991-08-16",
    showIdentifier: "gd91-08-16.sbd.braverman.6676.sbeok.shnf",
    tier: 1,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brother Esau",
    showDate: "1987-07-24",
    showIdentifier: "gd1987-07-24.pzm.russjcan.92568.sbeok.flac16",
    tier: 1,
    votes: 32,
    notes: "32 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brother Esau",
    showDate: "1984-04-20",
    showIdentifier: "gd84-04-20.senn.fishman.7854.sbeok.shnf",
    tier: 1,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brother Esau",
    showDate: "1985-04-27",
    showIdentifier: "gd85-04-27.sbd.jerugim.359.sbeok.shnf",
    tier: 1,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Standing On The Moon",
    showDate: "1993-08-21",
    showIdentifier: "gd93-08-21.sbd.nawrocki.15035.sbeok.shnf",
    tier: 1,
    votes: 73,
    notes: "73 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Standing On The Moon",
    showDate: "1989-07-07",
    showIdentifier: "gd89-07-07.aud.wiley.7855.sbeok.shnf",
    tier: 1,
    votes: 55,
    notes: "55 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Standing On The Moon",
    showDate: "1993-09-26",
    showIdentifier: "gd93-09-26.dsbd.miller.28788.sbeok.flacf",
    tier: 1,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - C. C. Rider",
    showDate: "1991-09-10",
    showIdentifier: "gd91-09-10.sbd.sacks.511.sbeok.shnf",
    tier: 1,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - C. C. Rider",
    showDate: "1979-12-26",
    showIdentifier: "gd1979-12-26.sonyECM250.walker-scotton.miller.89187.sbeok.flac16",
    tier: 1,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - C. C. Rider",
    showDate: "1982-08-07",
    showIdentifier: "gd82-08-07.sbd-streeter-wise.unknown.7689.sbeok.shnf",
    tier: 1,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Queen Jane Approximately",
    showDate: "1989-10-08",
    showIdentifier: "gd89-10-08.sbd.unknown.8365.sbeok.shnf",
    tier: 1,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Queen Jane Approximately",
    showDate: "1989-07-02",
    showIdentifier: "gd89-07-02.nak.8243.sbefail.shnf",
    tier: 1,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Queen Jane Approximately",
    showDate: "1993-03-27",
    showIdentifier: "gd93-03-27.sbd.nawrocki.31956.sbeok.shnf",
    tier: 1,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Comes A Time",
    showDate: "1977-05-09",
    showIdentifier: "gd77-05-09.sbd.connor.8304.sbeok.shnf",
    tier: 1,
    votes: 134,
    notes: "134 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Comes A Time",
    showDate: "1976-07-17",
    showIdentifier: "gd76-07-17.sbd.unknown.243.sbeok.shnf",
    tier: 1,
    votes: 91,
    notes: "91 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Comes A Time",
    showDate: "1977-05-21",
    showIdentifier: "gd77-05-21.sbd.boyle.271.sbeok.shnf",
    tier: 1,
    votes: 66,
    notes: "66 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Next Time You See Me",
    showDate: "1972-04-26",
    showIdentifier: "gd1972-04-26.sbd.vernon.9197.sbeok.shnf",
    tier: 1,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Next Time You See Me",
    showDate: "1972-05-26",
    showIdentifier: "gd72-05-26.sbd.hollister.12758.sbeok.shnf",
    tier: 1,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Next Time You See Me",
    showDate: "1972-04-29",
    showIdentifier: "gd72-04-29.aud.vernon.5250.sbeok.shnf",
    tier: 1,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Saint of Circumstance",
    showDate: "1991-06-17",
    showIdentifier: "gd91-06-17.sbd.gardner.3591.sbeok.shnf",
    tier: 1,
    votes: 37,
    notes: "37 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Saint of Circumstance",
    showDate: "1993-06-16",
    showIdentifier: "gd93-06-16.sbd.eliason.13330.sbeok.shnf",
    tier: 1,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Saint of Circumstance",
    showDate: "1990-10-27",
    showIdentifier: "gd90-10-27.sbd.braverman.9373.sbefail.shnf",
    tier: 1,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Might As Well",
    showDate: "1977-10-29",
    showIdentifier: "gd77-10-29.maizner.vernon.8035.sbeok.shnf",
    tier: 1,
    votes: 84,
    notes: "84 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Might As Well",
    showDate: "1991-06-17",
    showIdentifier: "gd91-06-17.sbd.gardner.3591.sbeok.shnf",
    tier: 1,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Might As Well",
    showDate: "1977-11-02",
    showIdentifier: "gd1977-11-02.mtx.sirmick.86546.sbeok.flac16",
    tier: 1,
    votes: 35,
    notes: "35 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Loose Lucy",
    showDate: "1973-11-11",
    showIdentifier: "gd73-11-11.sbd.schlissel.14105.sbeok.shnf",
    tier: 1,
    votes: 53,
    notes: "53 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Loose Lucy",
    showDate: "1990-03-14",
    showIdentifier: "gd90-03-14.sbd.ladner.8466.sbeok.shnf",
    tier: 1,
    votes: 51,
    notes: "51 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Loose Lucy",
    showDate: "1973-02-26",
    showIdentifier: "gd73-02-26.sbd.kaplan.1208.sbeok.shnf",
    tier: 1,
    votes: 37,
    notes: "37 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - To Lay Me Down",
    showDate: "1974-06-23",
    showIdentifier: "gd74-06-23.sbd.cribbs.16780.sbeok.shnf",
    tier: 1,
    votes: 62,
    notes: "62 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - To Lay Me Down",
    showDate: "1980-09-26",
    showIdentifier: "gd80-09-26.acoustic-sbd.hinko.18741.sbeok.shnf",
    tier: 1,
    votes: 54,
    notes: "54 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - To Lay Me Down",
    showDate: "1990-09-18",
    showIdentifier: "gd90-09-18.sbd.miller.12885.sbeok.shnf",
    tier: 1,
    votes: 50,
    notes: "50 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Caution",
    showDate: "1972-04-08",
    showIdentifier: "gd72-04-08.sbd.giles-jeffm.2534.sbeok.shnf",
    tier: 1,
    votes: 85,
    notes: "85 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Caution",
    showDate: "1970-02-14",
    showIdentifier: "gd70-02-14.early-late.sbd.cotsman.18115.sbeok.shnf",
    tier: 1,
    votes: 42,
    notes: "42 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Caution",
    showDate: "1968-06-14",
    showIdentifier: "gd68-06-14.aud.cotsman.16532.sbeok.shnf",
    tier: 1,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Boss Man",
    showDate: "1972-04-14",
    showIdentifier: "gd72-04-14.sbd.hurwitt.8828.sbeok.shnf",
    tier: 1,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Boss Man",
    showDate: "1972-05-07",
    showIdentifier: "gd72-05-07.sbd-aud.clugston.9193.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Boss Man",
    showDate: "1972-05-04",
    showIdentifier: "gd1972-05-04.sbd.miller.77294.sbeok.flac16",
    tier: 1,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dupree's Diamond Blues",
    showDate: "1969-03-01",
    showIdentifier: "gd69-03-01.sbd.16track.kaplan.4030.sbeok.shnf",
    tier: 1,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dupree's Diamond Blues",
    showDate: "1977-11-06",
    showIdentifier: "gd77-11-06.sbd.nawrocki.283.sbeok.shnf",
    tier: 1,
    votes: 35,
    notes: "35 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dupree's Diamond Blues",
    showDate: "1969-02-22",
    showIdentifier: "gd69-02-22.sbd.owen.7860.sbeok.shnf",
    tier: 1,
    votes: 33,
    notes: "33 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Weather Report Suite",
    showDate: "1974-06-18",
    showIdentifier: "gd74-06-18.sbd.sacks.209.sbefail.shnf",
    tier: 1,
    votes: 133,
    notes: "133 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Weather Report Suite",
    showDate: "1974-06-28",
    showIdentifier: "gd74-06-28.moore.weiner.gdADT18.16038.sbeok.shnf",
    tier: 1,
    votes: 108,
    notes: "108 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Weather Report Suite",
    showDate: "1974-07-19",
    showIdentifier: "gd74-07-19.sbd.symons.12381.sbeok.shnf",
    tier: 1,
    votes: 71,
    notes: "71 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Good Morning Little Schoolgirl",
    showDate: "1969-02-28",
    showIdentifier: "gd69-02-28.sbd.16track.kaplan.3397.sbeok.shnf",
    tier: 1,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Good Morning Little Schoolgirl",
    showDate: "1968-02-14",
    showIdentifier: "gd68-02-14.sbd.kaplan.15640.sbeok.shnf",
    tier: 1,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wang Dang Doodle",
    showDate: "1983-09-02",
    showIdentifier: "gd83-09-02.beyer_senn.unk.23854.sbefail.shnf",
    tier: 1,
    votes: 42,
    notes: "42 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wang Dang Doodle",
    showDate: "1989-07-02",
    showIdentifier: "gd89-07-02.nak.8243.sbefail.shnf",
    tier: 1,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wang Dang Doodle",
    showDate: "1990-07-08",
    showIdentifier: "gd90-07-08.sbd.brame.16157.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - So Many Roads",
    showDate: "1995-07-09",
    showIdentifier: "gd95-07-09.sbd.7233.sbeok.shnf",
    tier: 1,
    votes: 113,
    notes: "113 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - So Many Roads",
    showDate: "1994-10-01",
    showIdentifier: "gd94-10-01.sbd.ashley-bertha.14869.sbeok.shnf",
    tier: 1,
    votes: 107,
    notes: "107 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - So Many Roads",
    showDate: "1992-06-23",
    showIdentifier: "gd92-06-23.sbd.barbella.6024.sbeok.shnf",
    tier: 1,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Spanish Jam",
    showDate: "1974-06-26",
    showIdentifier: "gd74-06-26.moore.weiner.gdADT17.16037.sbeok.shnf",
    tier: 1,
    votes: 65,
    notes: "65 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Spanish Jam",
    showDate: "1974-06-23",
    showIdentifier: "gd74-06-23.sbd.cribbs.16780.sbeok.shnf",
    tier: 1,
    votes: 57,
    notes: "57 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Spanish Jam",
    showDate: "1974-07-19",
    showIdentifier: "gd74-07-19.sbd.symons.12381.sbeok.shnf",
    tier: 1,
    votes: 45,
    notes: "45 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stuck Inside of Mobile with the Memphis Blues Again",
    showDate: "1989-07-07",
    showIdentifier: "gd89-07-07.aud.wiley.7855.sbeok.shnf",
    tier: 1,
    votes: 51,
    notes: "51 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stuck Inside of Mobile with the Memphis Blues Again",
    showDate: "1989-10-16",
    showIdentifier: "gd89-10-16.dsbd.barrick.446.sbeok.shnf",
    tier: 1,
    votes: 33,
    notes: "33 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stuck Inside of Mobile with the Memphis Blues Again",
    showDate: "1989-10-09",
    showIdentifier: "gd89-10-09.sbd.serafin.7721.sbeok.shnf",
    tier: 1,
    votes: 32,
    notes: "32 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Here Comes Sunshine",
    showDate: "1973-12-19",
    showIdentifier: "gd73-12-19.sbd.finney.outtakes.197.sbeok.shnf",
    tier: 1,
    votes: 177,
    notes: "177 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Here Comes Sunshine",
    showDate: "1974-02-23",
    showIdentifier: "gd74-02-23.sbd.bertha-ashley.26362.sbeok.shnf",
    tier: 1,
    votes: 104,
    notes: "104 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Here Comes Sunshine",
    showDate: "1973-11-17",
    showIdentifier: "gd73-11-17.sbd.gardner.4749.sbeok.shnf",
    tier: 1,
    votes: 91,
    notes: "91 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hurts Me Too",
    showDate: "1972-04-14",
    showIdentifier: "gd72-04-14.sbd.hurwitt.8828.sbeok.shnf",
    tier: 1,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hurts Me Too",
    showDate: "1972-04-08",
    showIdentifier: "gd72-04-08.sbd.giles-jeffm.2534.sbeok.shnf",
    tier: 1,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hurts Me Too",
    showDate: "1972-04-24",
    showIdentifier: "gd72-04-24.sbd-aud.cotsman.16332.sbeok.shnf",
    tier: 1,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Alligator",
    showDate: "1968-08-23",
    showIdentifier: "gd68-08-23.sbd.sacks.52.sbefail.shnf",
    tier: 1,
    votes: 58,
    notes: "58 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Alligator",
    showDate: "1971-04-29",
    showIdentifier: "gd71-04-29.sbd.frisco.16782.sbeok.shnf",
    tier: 1,
    votes: 51,
    notes: "51 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Alligator",
    showDate: "1968-02-14",
    showIdentifier: "gd68-02-14.sbd.kaplan.15640.sbeok.shnf",
    tier: 1,
    votes: 39,
    notes: "39 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - And We Bid You Goodnight",
    showDate: "1971-04-29",
    showIdentifier: "gd71-04-29.sbd.frisco.16782.sbeok.shnf",
    tier: 1,
    votes: 46,
    notes: "46 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - And We Bid You Goodnight",
    showDate: "1976-12-31",
    showIdentifier: "gd76-12-31.preFM.warner.18524.20760.sbeok.shnf",
    tier: 1,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - And We Bid You Goodnight",
    showDate: "1970-05-02",
    showIdentifier: "gd1970-05-02.sbd.remaster.dp8outtake.100007.sbeok.flac16",
    tier: 1,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Speedway Boogie",
    showDate: "1991-06-17",
    showIdentifier: "gd91-06-17.sbd.gardner.3591.sbeok.shnf",
    tier: 1,
    votes: 54,
    notes: "54 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Speedway Boogie",
    showDate: "1970-09-20",
    showIdentifier: "gd70-09-20.aud.remaster.sirmick.27583.sbeok.shnf",
    tier: 1,
    votes: 50,
    notes: "50 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Speedway Boogie",
    showDate: "1970-05-14",
    showIdentifier: "gd70-05-14.sbd.cotsman.12439.sbeok.shnf",
    tier: 1,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Desolation Row",
    showDate: "1990-07-19",
    showIdentifier: "gd90-07-19.dsbd.garcia420.2177.sbeok.shnf",
    tier: 1,
    votes: 44,
    notes: "44 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Desolation Row",
    showDate: "1989-07-19",
    showIdentifier: "gd89-07-19.sbd.437.sbeok.shnf",
    tier: 1,
    votes: 43,
    notes: "43 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Desolation Row",
    showDate: "1990-03-24",
    showIdentifier: "gd90-03-24.schoeps.wiley.11806.sbeok.shnf",
    tier: 1,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Knockin' On Heaven's Door",
    showDate: "1989-07-07",
    showIdentifier: "gd89-07-07.aud.wiley.7855.sbeok.shnf",
    tier: 1,
    votes: 42,
    notes: "42 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Knockin' On Heaven's Door",
    showDate: "1987-09-18",
    showIdentifier: "gd87-09-18.sbd.samaritano.20025.sbeok.shnf",
    tier: 1,
    votes: 35,
    notes: "35 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Knockin' On Heaven's Door",
    showDate: "1978-11-17",
    showIdentifier: "gd78-11-17.acoustic.sbd.dodd.7687.sbeok.shnf",
    tier: 1,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Just Like Tom Thumb's Blues",
    showDate: "1994-10-01",
    showIdentifier: "gd94-10-01.sbd.ashley-bertha.14869.sbeok.shnf",
    tier: 1,
    votes: 42,
    notes: "42 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Just Like Tom Thumb's Blues",
    showDate: "1985-06-28",
    showIdentifier: "gd85-06-28.sbd.lemon2.5822.sbeok.shnf",
    tier: 1,
    votes: 35,
    notes: "35 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Just Like Tom Thumb's Blues",
    showDate: "1990-03-15",
    showIdentifier: "gd1990-03-15.28293.sbeok.shnf",
    tier: 1,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Walking Blues",
    showDate: "1990-03-24",
    showIdentifier: "gd90-03-24.schoeps.wiley.11806.sbeok.shnf",
    tier: 1,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Walking Blues",
    showDate: "1989-07-04",
    showIdentifier: "gd89-07-04.aud.wiley.9045.sbeok.shnf",
    tier: 1,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Walking Blues",
    showDate: "1990-03-15",
    showIdentifier: "gd1990-03-15.28293.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dear Mr. Fantasy",
    showDate: "1989-07-02",
    showIdentifier: "gd89-07-02.nak.8243.sbefail.shnf",
    tier: 1,
    votes: 47,
    notes: "47 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dear Mr. Fantasy",
    showDate: "1989-10-09",
    showIdentifier: "gd89-10-09.sbd.serafin.7721.sbeok.shnf",
    tier: 1,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dear Mr. Fantasy",
    showDate: "1988-03-31",
    showIdentifier: "gd88-03-31.sbd.unknown.8137.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Death Don't Have No Mercy",
    showDate: "1969-03-02",
    showIdentifier: "gd69-03-02.sbd.16track.kaplan.3344.sbeok.shnf",
    tier: 1,
    votes: 75,
    notes: "75 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Death Don't Have No Mercy",
    showDate: "1989-10-09",
    showIdentifier: "gd89-10-09.sbd.serafin.7721.sbeok.shnf",
    tier: 1,
    votes: 58,
    notes: "58 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Death Don't Have No Mercy",
    showDate: "1968-10-12",
    showIdentifier: "gd68-10-12.sbd.eD.10909.sbeok.shnf",
    tier: 1,
    votes: 54,
    notes: "54 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Race Is On",
    showDate: "1973-11-17",
    showIdentifier: "gd73-11-17.sbd.gardner.4749.sbeok.shnf",
    tier: 1,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Race Is On",
    showDate: "1973-06-22",
    showIdentifier: "gd73-06-22.sbd.cribbs.17270.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Race Is On",
    showDate: "1973-05-26",
    showIdentifier: "gd73-05-26.sbd.cribbs.17076.sbeok.shnf",
    tier: 1,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Picasso Moon",
    showDate: "1989-10-16",
    showIdentifier: "gd89-10-16.dsbd.barrick.446.sbeok.shnf",
    tier: 1,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Picasso Moon",
    showDate: "1990-03-22",
    showIdentifier: "gd90-03-22.sbd.bertha-ashley.21433.sbeok.shnf",
    tier: 1,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Picasso Moon",
    showDate: "1990-07-19",
    showIdentifier: "gd90-07-19.dsbd.garcia420.2177.sbeok.shnf",
    tier: 1,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - All New Minglewood Blues",
    showDate: "1977-02-26",
    showIdentifier: "gd77-02-26.sbd.alphadog.9752.sbeok.shnf",
    tier: 1,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - All New Minglewood Blues",
    showDate: "1982-10-10",
    showIdentifier: "gd82-10-10.sbd.sacks.338.sbefail.shnf",
    tier: 1,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - All New Minglewood Blues",
    showDate: "1970-05-15",
    showIdentifier: "gd70-05-15.early-late.sbd.97.sbeok.shnf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Attics of My Life",
    showDate: "1972-09-27",
    showIdentifier: "gd72-09-27.sbd.vernon.18106.sbeok.shnf",
    tier: 1,
    votes: 51,
    notes: "51 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Attics of My Life",
    showDate: "1989-10-09",
    showIdentifier: "gd89-10-09.sbd.serafin.7721.sbeok.shnf",
    tier: 1,
    votes: 34,
    notes: "34 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Attics of My Life",
    showDate: "1970-06-24",
    showIdentifier: "gd_nrps70-06-24.aud.pcrp5.23062.sbeok.flacf",
    tier: 1,
    votes: 32,
    notes: "32 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Know You Rider",
    showDate: "1970-05-02",
    showIdentifier: "gd1970-05-02.sbd.remaster.dp8outtake.100007.sbeok.flac16",
    tier: 1,
    votes: 69,
    notes: "69 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Know You Rider",
    showDate: "1989-07-17",
    showIdentifier: "gd89-07-17.sbd.unknown.17702.sbeok.shnf",
    tier: 1,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Know You Rider",
    showDate: "1970-05-01",
    showIdentifier: "gd70-05-01.sbd.clugston.5465.sbeok.shnf",
    tier: 1,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mister Charlie",
    showDate: "1971-08-06",
    showIdentifier: "gd71-08-06.aud.bertrando.yerys.129.sbeok.shnf",
    tier: 1,
    votes: 58,
    notes: "58 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mister Charlie",
    showDate: "1972-05-07",
    showIdentifier: "gd72-05-07.sbd-aud.clugston.9193.sbeok.shnf",
    tier: 1,
    votes: 43,
    notes: "43 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mister Charlie",
    showDate: "1972-05-03",
    showIdentifier: "gd72-05-03.sbd.masse.142.sbeok.shnf",
    tier: 1,
    votes: 37,
    notes: "37 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Muddy River",
    showDate: "1995-07-09",
    showIdentifier: "gd95-07-09.sbd.7233.sbeok.shnf",
    tier: 1,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Muddy River",
    showDate: "1990-04-02",
    showIdentifier: "gd90-04-02.sbd.dodd.17731.sbeok.shnf",
    tier: 1,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Muddy River",
    showDate: "1988-03-30",
    showIdentifier: "gd88-03-30.sbd.lai.408.sbefail.shnf",
    tier: 1,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Deep Elem Blues",
    showDate: "1970-05-02",
    showIdentifier: "gd1970-05-02.sbd.remaster.dp8outtake.100007.sbeok.flac16",
    tier: 1,
    votes: 46,
    notes: "46 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Deep Elem Blues",
    showDate: "1981-03-09",
    showIdentifier: "gd81-03-09.glassberg.wise.7473.sbeok.shnf",
    tier: 1,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Deep Elem Blues",
    showDate: "1982-04-05",
    showIdentifier: "gd82-04-05.sennheiser.willy.13612.sbeok.shnf",
    tier: 1,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Smokestack Lightnin'",
    showDate: "1970-02-13",
    showIdentifier: "gd70-02-13.early-late.sbd.cotsman.18114.sbeok.shnf",
    tier: 1,
    votes: 54,
    notes: "54 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Smokestack Lightnin'",
    showDate: "1971-12-07",
    showIdentifier: "gd71-12-07.sbd.miller.3375.sbeok.shnf",
    tier: 1,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Smokestack Lightnin'",
    showDate: "1985-06-24",
    showIdentifier: "gd85-06-24.sbd.miller.25315.sbeok.shnf",
    tier: 1,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lazy River Road",
    showDate: "1993-03-25",
    showIdentifier: "gd93-03-25.sbd.nawrocki.16433.sbeok.shnf",
    tier: 1,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lazy River Road",
    showDate: "1993-09-22",
    showIdentifier: "gd93-09-22.sbd.yubah.565.sbeok.shnf",
    tier: 1,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lazy River Road",
    showDate: "1995-04-01",
    showIdentifier: "gd95-04-01.sbd.5287.sbeok.shnf",
    tier: 1,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feelin' Groovy Jam",
    showDate: "1970-02-13",
    showIdentifier: "gd70-02-13.early-late.sbd.cotsman.18114.sbeok.shnf",
    tier: 1,
    votes: 33,
    notes: "33 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feelin' Groovy Jam",
    showDate: "1974-02-24",
    showIdentifier: "gd74-02-24.sbd.windsor.199.sbefail.shnf",
    tier: 1,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feelin' Groovy Jam",
    showDate: "1974-06-26",
    showIdentifier: "gd74-06-26.moore.weiner.gdADT17.16037.sbeok.shnf",
    tier: 1,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Corrina",
    showDate: "1993-03-10",
    showIdentifier: "gd93-03-10.sbd.ladner.2024.sbeok.shnf",
    tier: 1,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Corrina",
    showDate: "1994-10-14",
    showIdentifier: "gd94-10-14.sbd.perkins.9054.sbeok.shnf",
    tier: 1,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Corrina",
    showDate: "1993-05-26",
    showIdentifier: "gd93-05-26.sbd.georges.1958.sbeok.shnf",
    tier: 1,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Gimme Some Loving",
    showDate: "1989-10-08",
    showIdentifier: "gd89-10-08.sbd.unknown.8365.sbeok.shnf",
    tier: 1,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Gimme Some Loving",
    showDate: "1985-11-01",
    showIdentifier: "gd85-11-01.oade.connor.9217.sbeok.shnf",
    tier: 1,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Gimme Some Loving",
    showDate: "1989-07-17",
    showIdentifier: "gd89-07-17.sbd.unknown.17702.sbeok.shnf",
    tier: 1,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Fire On The Mountain",
    showDate: "1980-10-31",
    showIdentifier: "gd80-10-31.sbd-preFM.cousinit.20377.sbeok.shnf",
    tier: 1,
    votes: 50,
    notes: "50 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Fire On The Mountain",
    showDate: "1978-09-16",
    showIdentifier: "gd78-09-16.sbd.orf.2319.sbeok.shnf",
    tier: 1,
    votes: 48,
    notes: "48 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Fire On The Mountain",
    showDate: "1985-07-13",
    showIdentifier: "gd85-07-13.sbd.georges.372.sbefail.shnf",
    tier: 1,
    votes: 46,
    notes: "46 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ripple",
    showDate: "1970-09-20",
    showIdentifier: "gd70-09-20.aud.remaster.sirmick.27583.sbeok.shnf",
    tier: 1,
    votes: 56,
    notes: "56 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ripple",
    showDate: "1980-09-26",
    showIdentifier: "gd80-09-26.acoustic-sbd.hinko.18741.sbeok.shnf",
    tier: 1,
    votes: 54,
    notes: "54 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ripple",
    showDate: "1971-04-29",
    showIdentifier: "gd71-04-29.sbd.frisco.16782.sbeok.shnf",
    tier: 1,
    votes: 46,
    notes: "46 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Days Between",
    showDate: "1994-12-11",
    showIdentifier: "gd94-12-11.sbd.unknown.12525.sbeok.shnf",
    tier: 1,
    votes: 54,
    notes: "54 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Days Between",
    showDate: "1994-12-19",
    showIdentifier: "gd94-12-19.sbd.vernon.20712.sbeok.shnf",
    tier: 1,
    votes: 37,
    notes: "37 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Days Between",
    showDate: "1995-05-29",
    showIdentifier: "gd95-05-29.schoeps.10070.sbeok.shnf",
    tier: 1,
    votes: 34,
    notes: "34 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sing Me Back Home",
    showDate: "1972-08-27",
    showIdentifier: "gd72-08-27.sbd.braverman.16582.sbefail.shnf",
    tier: 1,
    votes: 97,
    notes: "97 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sing Me Back Home",
    showDate: "1972-05-26",
    showIdentifier: "gd72-05-26.sbd.hollister.12758.sbeok.shnf",
    tier: 1,
    votes: 78,
    notes: "78 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sing Me Back Home",
    showDate: "1972-09-17",
    showIdentifier: "gd1972-09-17.aud-wolfson.minches.28165.shnf",
    tier: 1,
    votes: 35,
    notes: "35 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Weight",
    showDate: "1990-04-02",
    showIdentifier: "gd90-04-02.sbd.dodd.17731.sbeok.shnf",
    tier: 1,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Weight",
    showDate: "1990-07-23",
    showIdentifier: "gd90-07-23.sbd.oconner.7612.sbeok.shnf",
    tier: 1,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Weight",
    showDate: "1990-07-18",
    showIdentifier: "gd90-07-18.sbd.wilson.12760.sbeok.shnf",
    tier: 1,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Viola Lee Blues",
    showDate: "1970-05-02",
    showIdentifier: "gd1970-05-02.sbd.remaster.dp8outtake.100007.sbeok.flac16",
    tier: 1,
    votes: 109,
    notes: "109 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Viola Lee Blues",
    showDate: "1967-11-10",
    showIdentifier: "gd67-11-10.sbd.sacks.1612.sbeok.shnf",
    tier: 1,
    votes: 74,
    notes: "74 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Viola Lee Blues",
    showDate: "1967-09-03",
    showIdentifier: "gd67-09-03.sbd.backus.17272.sbeok.shnf",
    tier: 1,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Fought The Law",
    showDate: "1993-03-27",
    showIdentifier: "gd93-03-27.sbd.nawrocki.31956.sbeok.shnf",
    tier: 1,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Fought The Law",
    showDate: "1993-08-21",
    showIdentifier: "gd93-08-21.sbd.nawrocki.15035.sbeok.shnf",
    tier: 1,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Fought The Law",
    showDate: "1994-09-29",
    showIdentifier: "gd94-09-29.sbd.larson.12100.sbeok.shnf",
    tier: 1,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Cat Sunflower",
    showDate: "1969-04-26",
    showIdentifier: "gd69-04-26.sbd.yerys.71.sbeok.shnf",
    tier: 1,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Cat Sunflower",
    showDate: "1968-02-24",
    showIdentifier: "gd1968-02-24.167922.2nd.set.fm.smith.miller.clugston.flac1648",
    tier: 1,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Cat Sunflower",
    showDate: "1968-02-14",
    showIdentifier: "gd68-02-14.sbd.kaplan.15640.sbeok.shnf",
    tier: 1,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Doin' That Rag",
    showDate: "1969-02-28",
    showIdentifier: "gd69-02-28.sbd.16track.kaplan.3397.sbeok.shnf",
    tier: 1,
    votes: 39,
    notes: "39 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Doin' That Rag",
    showDate: "1969-02-22",
    showIdentifier: "gd69-02-22.sbd.owen.7860.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Doin' That Rag",
    showDate: "1969-04-23",
    showIdentifier: "gd69-04-23.sbd.wise.70.sbeok.shnf",
    tier: 1,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy Wind",
    showDate: "1970-06-24",
    showIdentifier: "gd_nrps70-06-24.aud.pcrp5.23062.sbeok.flacf",
    tier: 1,
    votes: 57,
    notes: "57 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy Wind",
    showDate: "1970-09-20",
    showIdentifier: "gd70-09-20.aud.remaster.sirmick.27583.sbeok.shnf",
    tier: 1,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy Wind",
    showDate: "1970-05-15",
    showIdentifier: "gd70-05-15.early-late.sbd.97.sbeok.shnf",
    tier: 1,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cosmic Charlie",
    showDate: "1970-05-02",
    showIdentifier: "gd1970-05-02.sbd.remaster.dp8outtake.100007.sbeok.flac16",
    tier: 1,
    votes: 65,
    notes: "65 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cosmic Charlie",
    showDate: "1976-06-14",
    showIdentifier: "gd76-06-14.sbd.hollister.22804.sbeok.shnf",
    tier: 1,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cosmic Charlie",
    showDate: "1976-06-19",
    showIdentifier: "gd76-06-19.prefm.unknown.12077.sbeok.shnf",
    tier: 1,
    votes: 32,
    notes: "32 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sitting on Top of the World",
    showDate: "1971-10-21",
    showIdentifier: "gd71-10-21.sbd.cotsman.5071.sbeok.shnf",
    tier: 1,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sitting on Top of the World",
    showDate: "1972-05-23",
    showIdentifier: "gd72-05-23.sbd.cribbs.17700.sbeok.shnf",
    tier: 1,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sitting on Top of the World",
    showDate: "1969-04-26",
    showIdentifier: "gd69-04-26.sbd.yerys.71.sbeok.shnf",
    tier: 1,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Mighty Quinn (Quinn The Eskimo)",
    showDate: "1985-12-30",
    showIdentifier: "gd85-12-30.sbd.georges.1223.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Mighty Quinn (Quinn The Eskimo)",
    showDate: "1989-07-02",
    showIdentifier: "gd89-07-02.nak.8243.sbefail.shnf",
    tier: 1,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Mighty Quinn (Quinn The Eskimo)",
    showDate: "1987-03-26",
    showIdentifier: "gd87-03-26.mixed.braverman.10923.sbeok.shnf",
    tier: 1,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Liberty",
    showDate: "1994-03-30",
    showIdentifier: "gd94-03-30.sbd.miller.14832.sbeok.shnf",
    tier: 1,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Liberty",
    showDate: "1994-10-14",
    showIdentifier: "gd94-10-14.sbd.perkins.9054.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Liberty",
    showDate: "1993-03-25",
    showIdentifier: "gd93-03-25.sbd.nawrocki.16433.sbeok.shnf",
    tier: 1,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - When Push Comes to Shove",
    showDate: "1987-03-26",
    showIdentifier: "gd87-03-26.mixed.braverman.10923.sbeok.shnf",
    tier: 1,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - When Push Comes to Shove",
    showDate: "1989-07-17",
    showIdentifier: "gd89-07-17.sbd.unknown.17702.sbeok.shnf",
    tier: 1,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - When Push Comes to Shove",
    showDate: "1987-07-12",
    showIdentifier: "gd87-07-12.sbd.agan.3860.sbefail.shnf",
    tier: 1,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Far From Me",
    showDate: "1989-07-12",
    showIdentifier: "gd89-07-12.aud-fob.gardner.2554.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Far From Me",
    showDate: "1982-10-10",
    showIdentifier: "gd82-10-10.sbd.sacks.338.sbefail.shnf",
    tier: 1,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Far From Me",
    showDate: "1980-05-15",
    showIdentifier: "gd80-05-15.aud.schlissel.12790.sbeok.shnf",
    tier: 1,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Midnight Hour",
    showDate: "1967-09-03",
    showIdentifier: "gd67-09-03.sbd.backus.17272.sbeok.shnf",
    tier: 1,
    votes: 43,
    notes: "43 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Midnight Hour",
    showDate: "1971-04-29",
    showIdentifier: "gd71-04-29.sbd.frisco.16782.sbeok.shnf",
    tier: 1,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Midnight Hour",
    showDate: "1987-03-26",
    showIdentifier: "gd87-03-26.mixed.braverman.10923.sbeok.shnf",
    tier: 1,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Last Time",
    showDate: "1990-03-22",
    showIdentifier: "gd90-03-22.sbd.bertha-ashley.21433.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Last Time",
    showDate: "1991-10-31",
    showIdentifier: "gd91-10-31.sbd.gardner.2897.sbeok.shnf",
    tier: 1,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Last Time",
    showDate: "1993-12-08",
    showIdentifier: "gd93-12-08.sbd.larson-ladner.10281.sbeok.shnf",
    tier: 1,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Monkey and the Engineer",
    showDate: "1980-10-27",
    showIdentifier: "gd80-10-27.senn441.lai.324.sbefail.shnf",
    tier: 1,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Monkey and the Engineer",
    showDate: "1970-05-01",
    showIdentifier: "gd70-05-01.sbd.clugston.5465.sbeok.shnf",
    tier: 1,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Monkey and the Engineer",
    showDate: "1989-02-12",
    showIdentifier: "gd89-02-12.sbd.presley.4680.sbeok.shnf",
    tier: 1,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Broken Arrow",
    showDate: "1993-02-23",
    showIdentifier: "gd93-02-23.sbd.hall.1611.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Broken Arrow",
    showDate: "1993-03-27",
    showIdentifier: "gd93-03-27.sbd.nawrocki.31956.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Broken Arrow",
    showDate: "1995-02-21",
    showIdentifier: "gd95-02-21.dsbd.stephens.8840.sbeok.shnf",
    tier: 1,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - King Bee",
    showDate: "1969-02-28",
    showIdentifier: "gd69-02-28.sbd.16track.kaplan.3397.sbeok.shnf",
    tier: 1,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - King Bee",
    showDate: "1971-04-28",
    showIdentifier: "gd71-04-28.sbd.murphy.2248.sbeok.shnf",
    tier: 1,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - King Bee",
    showDate: "1969-12-12",
    showIdentifier: "gd69-12-12.sbd.gerland.10988.sbeok.shnf",
    tier: 1,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Potato Caboose",
    showDate: "1968-02-14",
    showIdentifier: "gd68-02-14.sbd.kaplan.15640.sbeok.shnf",
    tier: 1,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Potato Caboose",
    showDate: "1969-03-01",
    showIdentifier: "gd69-03-01.sbd.16track.kaplan.4030.sbeok.shnf",
    tier: 1,
    votes: 35,
    notes: "35 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Nobody's Fault But Mine",
    showDate: "1973-12-19",
    showIdentifier: "gd73-12-19.sbd.finney.outtakes.197.sbeok.shnf",
    tier: 1,
    votes: 39,
    notes: "39 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Nobody's Fault But Mine",
    showDate: "1973-06-22",
    showIdentifier: "gd73-06-22.sbd.cribbs.17270.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Nobody's Fault But Mine",
    showDate: "1974-05-17",
    showIdentifier: "gd74-05-17.sbd.gustin.202.sbeok.shnf",
    tier: 1,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mind Left Body Jam",
    showDate: "1974-06-28",
    showIdentifier: "gd74-06-28.moore.weiner.gdADT18.16038.sbeok.shnf",
    tier: 1,
    votes: 88,
    notes: "88 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mind Left Body Jam",
    showDate: "1974-05-19",
    showIdentifier: "gd74-05-19.sbd.clugston.6957.sbeok.shnf",
    tier: 1,
    votes: 65,
    notes: "65 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mind Left Body Jam",
    showDate: "1973-11-11",
    showIdentifier: "gd73-11-11.sbd.schlissel.14105.sbeok.shnf",
    tier: 1,
    votes: 59,
    notes: "59 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Way To Go Home",
    showDate: "1992-06-28",
    showIdentifier: "gd92-06-28.sbd.braverman.8601.sbeok.shnf",
    tier: 1,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Way To Go Home",
    showDate: "1993-06-23",
    showIdentifier: "gd93-06-23.sbd.braverman.14123.sbeok.shnf",
    tier: 1,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Way To Go Home",
    showDate: "1994-07-31",
    showIdentifier: "gd94-07-31.sbd.runyon.2593.sbefail.shnf",
    tier: 1,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let The Good Times Roll",
    showDate: "1989-07-17",
    showIdentifier: "gd89-07-17.sbd.unknown.17702.sbeok.shnf",
    tier: 1,
    votes: 47,
    notes: "47 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let The Good Times Roll",
    showDate: "1990-03-24",
    showIdentifier: "gd90-03-24.schoeps.wiley.11806.sbeok.shnf",
    tier: 1,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let The Good Times Roll",
    showDate: "1990-03-16",
    showIdentifier: "gd90-03-16.sbd.willy.5227.sbeok.shnf",
    tier: 1,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Maggie's Farm",
    showDate: "1987-10-03",
    showIdentifier: "gd87-10-03.sbd.bertha-ashley.7368.sbeok.shnf",
    tier: 1,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Maggie's Farm",
    showDate: "1991-06-14",
    showIdentifier: "gd91-06-14.sbd.braverman.16816.sbeok.shnf",
    tier: 1,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Maggie's Farm",
    showDate: "1991-06-20",
    showIdentifier: "gd91-06-20.aud.ladner.2187.sbeok.shnf",
    tier: 1,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Spoonful",
    showDate: "1985-11-01",
    showIdentifier: "gd85-11-01.oade.connor.9217.sbeok.shnf",
    tier: 1,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Spoonful",
    showDate: "1991-10-31",
    showIdentifier: "gd91-10-31.sbd.gardner.2897.sbeok.shnf",
    tier: 1,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Spoonful",
    showDate: "1992-05-31",
    showIdentifier: "gd92-05-31.sbd.paino.544.sbefail.shnf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - On The Road Again",
    showDate: "1982-08-07",
    showIdentifier: "gd82-08-07.sbd-streeter-wise.unknown.7689.sbeok.shnf",
    tier: 1,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - On The Road Again",
    showDate: "1984-10-12",
    showIdentifier: "gd84-10-12-oade.sacks.8795.sbefail.shnf",
    tier: 1,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - On The Road Again",
    showDate: "1982-08-10",
    showIdentifier: "gd82-08-10.sbd.miller.12453.sbeok.shnf",
    tier: 1,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dark Hollow",
    showDate: "1971-04-29",
    showIdentifier: "gd71-04-29.sbd.frisco.16782.sbeok.shnf",
    tier: 1,
    votes: 35,
    notes: "35 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dark Hollow",
    showDate: "1970-09-20",
    showIdentifier: "gd70-09-20.aud.remaster.sirmick.27583.sbeok.shnf",
    tier: 1,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dark Hollow",
    showDate: "1970-02-13",
    showIdentifier: "gd70-02-13.early-late.sbd.cotsman.18114.sbeok.shnf",
    tier: 1,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Eternity",
    showDate: "1995-04-02",
    showIdentifier: "gd95-04-02.sbd.11622.sbeok.shnf",
    tier: 1,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Eternity",
    showDate: "1993-03-17",
    showIdentifier: "gd93-03-17.sbd.ladner.4979.sbeok.shnf",
    tier: 1,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Eternity",
    showDate: "1993-06-16",
    showIdentifier: "gd93-06-16.sbd.eliason.13330.sbeok.shnf",
    tier: 1,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Day Job",
    showDate: "1985-11-01",
    showIdentifier: "gd85-11-01.oade.connor.9217.sbeok.shnf",
    tier: 1,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Day Job",
    showDate: "1982-09-20",
    showIdentifier: "gd82-09-20.cohen.minches.19145.sbeok.shnf",
    tier: 1,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Day Job",
    showDate: "1985-02-18",
    showIdentifier: "gd85-02-18.sbd.willy.7588.sbeok.shnf",
    tier: 1,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Chinatown Shuffle",
    showDate: "1972-04-14",
    showIdentifier: "gd72-04-14.sbd.hurwitt.8828.sbeok.shnf",
    tier: 1,
    votes: 34,
    notes: "34 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Chinatown Shuffle",
    showDate: "1972-05-03",
    showIdentifier: "gd72-05-03.sbd.masse.142.sbeok.shnf",
    tier: 1,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Chinatown Shuffle",
    showDate: "1972-04-26",
    showIdentifier: "gd1972-04-26.sbd.vernon.9197.sbeok.shnf",
    tier: 1,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Same Thing",
    showDate: "1967-03-18",
    showIdentifier: "gd67-03-18.sbd.fink.10282.sbeok.shnf",
    tier: 1,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Same Thing",
    showDate: "1991-12-28",
    showIdentifier: "gd91-12-28.sbd.miller.21615.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Same Thing",
    showDate: "1966-11-19",
    showIdentifier: "gd66-11-19.sbd.seff.41.sbeok.shnf",
    tier: 1,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sunrise",
    showDate: "1977-05-22",
    showIdentifier: "gd77-05-22.sbd.dp-leftovers.18803.sbefail.shnf",
    tier: 1,
    votes: 48,
    notes: "48 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sunrise",
    showDate: "1977-05-09",
    showIdentifier: "gd77-05-09.sbd.connor.8304.sbeok.shnf",
    tier: 1,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sunrise",
    showDate: "1977-06-09",
    showIdentifier: "gd1977-06-09.28614.sbeok.flac16",
    tier: 1,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Never Trust A Woman",
    showDate: "1989-10-16",
    showIdentifier: "gd89-10-16.dsbd.barrick.446.sbeok.shnf",
    tier: 1,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Never Trust A Woman",
    showDate: "1990-03-25",
    showIdentifier: "gd90-03-25.fob-schoeps-mattes.miller.28389.sbeok.shnf",
    tier: 1,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Never Trust A Woman",
    showDate: "1981-08-28",
    showIdentifier: "gd81-08-28.sbd-patched.painoman.9572.sbeok.shnf",
    tier: 1,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Satisfaction",
    showDate: "1986-07-07",
    showIdentifier: "gd86-07-07.schoeps.conner.7001.sbeok.shnf",
    tier: 1,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Satisfaction",
    showDate: "1982-10-10",
    showIdentifier: "gd82-10-10.sbd.sacks.338.sbefail.shnf",
    tier: 1,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Satisfaction",
    showDate: "1981-12-09",
    showIdentifier: "gd81-12-09.sbd.clugston.13061.sbeok.shnf",
    tier: 1,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Take A Step Back",
    showDate: "1977-05-08",
    showIdentifier: "gd77-05-08.sbd.hicks.4982.sbeok.shnf",
    tier: 1,
    votes: 44,
    notes: "44 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Take A Step Back",
    showDate: "1977-11-06",
    showIdentifier: "gd77-11-06.sbd.nawrocki.283.sbeok.shnf",
    tier: 1,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Take A Step Back",
    showDate: "1987-07-12",
    showIdentifier: "gd87-07-12.sbd.agan.3860.sbefail.shnf",
    tier: 1,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Pocky Way",
    showDate: "1987-10-03",
    showIdentifier: "gd87-10-03.sbd.bertha-ashley.7368.sbeok.shnf",
    tier: 1,
    votes: 34,
    notes: "34 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Pocky Way",
    showDate: "1989-03-31",
    showIdentifier: "gd89-03-31.sbd.eD.16666.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Pocky Way",
    showDate: "1988-07-03",
    showIdentifier: "gd88-07-03.sbd.ststephen.3908.sbeok.shnf",
    tier: 1,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feedback",
    showDate: "1970-02-14",
    showIdentifier: "gd70-02-14.early-late.sbd.cotsman.18115.sbeok.shnf",
    tier: 1,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feedback",
    showDate: "1969-02-28",
    showIdentifier: "gd69-02-28.sbd.16track.kaplan.3397.sbeok.shnf",
    tier: 1,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feedback",
    showDate: "1968-10-12",
    showIdentifier: "gd68-10-12.sbd.eD.10909.sbeok.shnf",
    tier: 1,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Supplication",
    showDate: "1976-09-24",
    showIdentifier: "gd76-09-24.aud.unknown.16901.sbeok.shnf",
    tier: 1,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Supplication",
    showDate: "1977-05-22",
    showIdentifier: "gd77-05-22.sbd.dp-leftovers.18803.sbefail.shnf",
    tier: 1,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Supplication",
    showDate: "1985-06-27",
    showIdentifier: "gd85-06-27.sbd.miller.27863.sbeok.flacf",
    tier: 1,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Win Again",
    showDate: "1972-04-14",
    showIdentifier: "gd72-04-14.sbd.hurwitt.8828.sbeok.shnf",
    tier: 1,
    votes: 32,
    notes: "32 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Win Again",
    showDate: "1972-04-26",
    showIdentifier: "gd1972-04-26.sbd.vernon.9197.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Win Again",
    showDate: "1972-03-26",
    showIdentifier: "gd72-03-26.aud.hanno.15413.sbeok.shnf",
    tier: 1,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - He Was A Friend of Mine",
    showDate: "1969-05-24",
    showIdentifier: "gd69-05-24.sbd.kpfa.16177.sbeok.shnf",
    tier: 1,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - He Was A Friend of Mine",
    showDate: "1969-04-23",
    showIdentifier: "gd69-04-23.sbd.wise.70.sbeok.shnf",
    tier: 1,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - He Was A Friend of Mine",
    showDate: "1969-06-08",
    showIdentifier: "gd69-06-08.sbd.cotsman.19285.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Blow Away",
    showDate: "1989-07-07",
    showIdentifier: "gd89-07-07.aud.wiley.7855.sbeok.shnf",
    tier: 1,
    votes: 114,
    notes: "114 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Blow Away",
    showDate: "1990-03-26",
    showIdentifier: "gd90-03-26.sbd.gorinsky.8508.sbeok.shnf",
    tier: 1,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Blow Away",
    showDate: "1972-08-27",
    showIdentifier: "gd72-08-27.sbd.braverman.16582.sbefail.shnf",
    tier: 1,
    votes: 34,
    notes: "34 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy Answers",
    showDate: "1993-09-13",
    showIdentifier: "gd93-09-13.sbd.miller-wiley.12096.sbeok.shnf",
    tier: 1,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy Answers",
    showDate: "1994-03-16",
    showIdentifier: "gd94-03-16.sbd.ladner.7778.sbeok.shnf",
    tier: 1,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy Answers",
    showDate: "1994-10-15",
    showIdentifier: "gd94-10-15.sbd.miller.27249.sbeok.flacf",
    tier: 1,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - 100000 Tons of Steel",
    showDate: "1985-04-08",
    showIdentifier: "gd85-04-08.sbd.wiley.8755.sbeok.shnf",
    tier: 1,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - 100000 Tons of Steel",
    showDate: "1987-07-26",
    showIdentifier: "gd1987-07-26.nak700.yamaguchi-poris.russjcan.98214.flac16",
    tier: 1,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - 100000 Tons of Steel",
    showDate: "1987-08-11",
    showIdentifier: "gd87-08-11.sbd.4951.5247.sbeok.shnf",
    tier: 1,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mason's Children",
    showDate: "1970-01-24",
    showIdentifier: "gd70-01-24.sbd.kaplan.7890.sbeok.shnf",
    tier: 1,
    votes: 39,
    notes: "39 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mason's Children",
    showDate: "1969-12-28",
    showIdentifier: "gd69-12-28.sbd.cotsman.8999.sbeok.shnf",
    tier: 1,
    votes: 33,
    notes: "33 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mason's Children",
    showDate: "1970-01-02",
    showIdentifier: "gd70-01-02.early-late.sbd.cotsman.18120.sbeok.shnf",
    tier: 1,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Jude Finale",
    showDate: "1989-07-02",
    showIdentifier: "gd89-07-02.nak.8243.sbefail.shnf",
    tier: 1,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Jude Finale",
    showDate: "1990-03-22",
    showIdentifier: "gd90-03-22.sbd.bertha-ashley.21433.sbeok.shnf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Jude Finale",
    showDate: "1969-03-01",
    showIdentifier: "gd69-03-01.sbd.16track.kaplan.4030.sbeok.shnf",
    tier: 1,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Just A Little Light",
    showDate: "1990-03-26",
    showIdentifier: "gd90-03-26.sbd.gorinsky.8508.sbeok.shnf",
    tier: 1,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Just A Little Light",
    showDate: "1990-03-18",
    showIdentifier: "gd90-03-18.sbd.huck.9364.sbeok.shnf",
    tier: 1,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Just A Little Light",
    showDate: "1989-07-10",
    showIdentifier: "gd89-07-10.sbd.16071.sbeok.shnf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Keep Your Day Job",
    showDate: "1983-10-15",
    showIdentifier: "gd83-10-15.beyer-ficca-brennan.ficca.20024.sbeok.shnf",
    tier: 1,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Keep Your Day Job",
    showDate: "1983-10-14",
    showIdentifier: "gd83-10-14.beyer-ficca-brennan.ficca.20023.sbeok.shnf",
    tier: 1,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Keep Your Day Job",
    showDate: "1985-11-01",
    showIdentifier: "gd85-11-01.oade.connor.9217.sbeok.shnf",
    tier: 1,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Built to Last",
    showDate: "1989-07-17",
    showIdentifier: "gd89-07-17.sbd.unknown.17702.sbeok.shnf",
    tier: 1,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Built to Last",
    showDate: "1989-10-09",
    showIdentifier: "gd89-10-09.sbd.serafin.7721.sbeok.shnf",
    tier: 1,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Built to Last",
    showDate: "1989-10-16",
    showIdentifier: "gd89-10-16.dsbd.barrick.446.sbeok.shnf",
    tier: 1,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Samba In The Rain",
    showDate: "1994-10-14",
    showIdentifier: "gd94-10-14.sbd.perkins.9054.sbeok.shnf",
    tier: 1,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Samba In The Rain",
    showDate: "1994-12-16",
    showIdentifier: "gd94-12-16.nak300.wankelswurth.10543.sbeok.shnf",
    tier: 1,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Samba In The Rain",
    showDate: "1995-07-09",
    showIdentifier: "gd95-07-09.sbd.7233.sbeok.shnf",
    tier: 1,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Gloria",
    showDate: "1985-11-01",
    showIdentifier: "gd85-11-01.oade.connor.9217.sbeok.shnf",
    tier: 1,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Gloria",
    showDate: "1981-10-16",
    showIdentifier: "gd81-10-16.sbd.vinson.1217.sbeok.shnf",
    tier: 1,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Gloria",
    showDate: "1992-06-25",
    showIdentifier: "gd92-06-25.sbd.serrafin.8959.sbefail.shnf",
    tier: 1,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Heaven Help The Fool",
    showDate: "1980-10-31",
    showIdentifier: "gd80-10-31.sbd-preFM.cousinit.20377.sbeok.shnf",
    tier: 1,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Heaven Help The Fool",
    showDate: "1980-10-10",
    showIdentifier: "gd80-10-10.sbd.cousinit.24710.sbefail.shnf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Heaven Help The Fool",
    showDate: "1994-09-24",
    showIdentifier: "Search%20engine%20returned%20invalid%20information%20or%20was%20unresponsive",
    tier: 1,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rain",
    showDate: "1994-03-28",
    showIdentifier: "gd94-03-28.aud-sbd.unknown.17263.sbeok.shnf",
    tier: 1,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rain",
    showDate: "1995-06-30",
    showIdentifier: "gd95-06-30.schoeps.3376.sbeok.shnf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rain",
    showDate: "1994-07-29",
    showIdentifier: "gd94-07-29.schoeps.dipietro.4078.sbeok.shnf",
    tier: 1,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - That Would Be Something",
    showDate: "1991-09-25",
    showIdentifier: "gd91-09-25.nak.dodd.16667.sbeok.shnf",
    tier: 1,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - That Would Be Something",
    showDate: "1995-02-21",
    showIdentifier: "gd95-02-21.dsbd.stephens.8840.sbeok.shnf",
    tier: 1,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - That Would Be Something",
    showDate: "1994-03-28",
    showIdentifier: "gd94-03-28.aud-sbd.unknown.17263.sbeok.shnf",
    tier: 1,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - We Can Run",
    showDate: "1990-03-29",
    showIdentifier: "gd90-03-29.aud-fob.set2.unknown.1317.sbeok.shnf",
    tier: 1,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - We Can Run",
    showDate: "1989-09-29",
    showIdentifier: "gd89-09-29.ultramatrix.braverman.7282.sbeok.shnf",
    tier: 1,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - We Can Run",
    showDate: "1989-10-09",
    showIdentifier: "gd89-10-09.sbd.serafin.7721.sbeok.shnf",
    tier: 1,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Don't Need Love",
    showDate: "1984-10-12",
    showIdentifier: "gd84-10-12-oade.sacks.8795.sbefail.shnf",
    tier: 1,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Don't Need Love",
    showDate: "1985-11-05",
    showIdentifier: "gd85-11-05.sbd.lai.1188.sbefail.shnf",
    tier: 1,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Don't Need Love",
    showDate: "1984-07-15",
    showIdentifier: "gd84-07-15.pcm-sbd.miller.30641.sbeok.flacf",
    tier: 1,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - From the Heart of Me",
    showDate: "1978-12-31",
    showIdentifier: "gd78-12-31.sbd.ashley.1667.sbeok.shnf",
    tier: 1,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - From the Heart of Me",
    showDate: "1978-10-22",
    showIdentifier: "gd78-10-22.sbd.kempa.299.sbeok.shnf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - From the Heart of Me",
    showDate: "1978-11-14",
    showIdentifier: "gd1978-11-14.nak300.rolfe.miller.100205.sbeok.flac16",
    tier: 1,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lost Sailor",
    showDate: "1985-11-01",
    showIdentifier: "gd85-11-01.oade.connor.9217.sbeok.shnf",
    tier: 1,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lost Sailor",
    showDate: "1979-08-13",
    showIdentifier: "gd79-08-13.sbd.clugston.9289.sbeok.shnf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lost Sailor",
    showDate: "1982-08-10",
    showIdentifier: "gd82-08-10.sbd.miller.12453.sbeok.shnf",
    tier: 1,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Ain't Woman Enough To Take My Man",
    showDate: "1973-03-28",
    showIdentifier: "gd1973-03-28.beyer.backstrom.miller.74682.sbeok.flac16",
    tier: 1,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Ain't Woman Enough To Take My Man",
    showDate: "1973-02-15",
    showIdentifier: "gd1973-02-15.sbd.hall.1580.shnf",
    tier: 1,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Ain't Woman Enough To Take My Man",
    showDate: "1973-05-26",
    showIdentifier: "gd73-05-26.sbd.cribbs.17076.sbeok.shnf",
    tier: 1,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy To Love You",
    showDate: "1990-03-22",
    showIdentifier: "gd90-03-22.sbd.bertha-ashley.21433.sbeok.shnf",
    tier: 1,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy To Love You",
    showDate: "1990-03-15",
    showIdentifier: "gd1990-03-15.28293.sbeok.shnf",
    tier: 1,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy To Love You",
    showDate: "1990-03-28",
    showIdentifier: "gd90-03-28.sbd.gorinsky.8510.sbeok.shnf",
    tier: 1,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mountains of the Moon",
    showDate: "1969-02-22",
    showIdentifier: "gd69-02-22.sbd.owen.7860.sbeok.shnf",
    tier: 1,
    votes: 47,
    notes: "47 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mountains of the Moon",
    showDate: "1969-03-01",
    showIdentifier: "gd69-03-01.sbd.16track.kaplan.4030.sbeok.shnf",
    tier: 1,
    votes: 39,
    notes: "39 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mountains of the Moon",
    showDate: "1969-04-26",
    showIdentifier: "gd69-04-26.sbd.yerys.71.sbeok.shnf",
    tier: 1,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Silver Threads and Golden Needles",
    showDate: "1970-05-15",
    showIdentifier: "gd70-05-15.early-late.sbd.97.sbeok.shnf",
    tier: 1,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Silver Threads and Golden Needles",
    showDate: "1969-07-11",
    showIdentifier: "gd69-07-11.sbd.hanno.4644.sbeok.shnf",
    tier: 1,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Silver Threads and Golden Needles",
    showDate: "1969-04-26",
    showIdentifier: "gd69-04-26.sbd.yerys.71.sbeok.shnf",
    tier: 1,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rosalie McFall",
    showDate: "1970-09-20",
    showIdentifier: "gd70-09-20.aud.remaster.sirmick.27583.sbeok.shnf",
    tier: 1,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rosalie McFall",
    showDate: "1970-11-08",
    showIdentifier: "gd1970-11-08.aud.weiner.28609.sbeok.shnf",
    tier: 1,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rosalie McFall",
    showDate: "1980-09-26",
    showIdentifier: "gd80-09-26.acoustic-sbd.hinko.18741.sbeok.shnf",
    tier: 1,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Two Souls in Communion",
    showDate: "1972-04-26",
    showIdentifier: "gd1972-04-26.sbd.vernon.9197.sbeok.shnf",
    tier: 1,
    votes: 47,
    notes: "47 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Two Souls in Communion",
    showDate: "1972-05-11",
    showIdentifier: "gd72-05-11.sbd.ashley-bertha.7364.sbefail.shnf",
    tier: 1,
    votes: 34,
    notes: "34 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Two Souls in Communion",
    showDate: "1972-05-10",
    showIdentifier: "gd72-05-10.sbd.kaplan.1582.sbeok.shnf",
    tier: 1,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Help on the Way",
    showDate: "1975-08-13",
    showIdentifier: "gd75-08-13.fm.vernon.23661.sbeok.shnf",
    tier: 1,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Help on the Way",
    showDate: "1976-12-31",
    showIdentifier: "gd76-12-31.preFM.warner.18524.20760.sbeok.shnf",
    tier: 1,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Help on the Way",
    showDate: "1976-10-09",
    showIdentifier: "gd76-10-09.set2-sbd.miller.12519.sbeok.shnf",
    tier: 1,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Unbroken Chain",
    showDate: "1995-03-23",
    showIdentifier: "gd95-03-23.sbd.miller.25273.sbeok.flacf",
    tier: 1,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Unbroken Chain",
    showDate: "1995-03-19",
    showIdentifier: "gd95-03-19.schoeps.15097.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Werewolves of London",
    showDate: "1978-07-08",
    showIdentifier: "gd78-07-08.sbd.unknown.294.sbeok.shnf",
    tier: 1,
    votes: 67,
    notes: "67 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Werewolves of London",
    showDate: "1978-04-24",
    showIdentifier: "gd78-04-24.sbd.mattman.20605.sbeok.shnf",
    tier: 1,
    votes: 33,
    notes: "33 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Werewolves of London",
    showDate: "1978-05-11",
    showIdentifier: "gd78-05-11.aud.vernon.6317.sbeok.shnf",
    tier: 1,
    votes: 32,
    notes: "32 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wave to the Wind",
    showDate: "1993-05-27",
    showIdentifier: "gd93-05-27.sbd.georges.1932.sbeok.shnf",
    tier: 1,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wave to the Wind",
    showDate: "1993-05-23",
    showIdentifier: "gd93-05-23.sbd.wiley.8707.sbeok.shnf",
    tier: 1,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wave to the Wind",
    showDate: "1993-06-09",
    showIdentifier: "gd93-06-09.sbd.miller.13601.sbeok.shnf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lucy In The Sky With Diamonds",
    showDate: "1993-03-24",
    showIdentifier: "gd93-03-24.sbd.keyser.25664.sbeok.flacf",
    tier: 1,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lucy In The Sky With Diamonds",
    showDate: "1993-03-17",
    showIdentifier: "gd93-03-17.sbd.ladner.4979.sbeok.shnf",
    tier: 1,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lucy In The Sky With Diamonds",
    showDate: "1994-12-16",
    showIdentifier: "gd94-12-16.nak300.wankelswurth.10543.sbeok.shnf",
    tier: 1,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Baba O'Riley &gt; Tomorrow Never Knows",
    showDate: "1994-11-29",
    showIdentifier: "gd94-11-29.schoeps.ladner.10541.sbeok.shnf",
    tier: 1,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Baba O'Riley &gt; Tomorrow Never Knows",
    showDate: "1992-05-31",
    showIdentifier: "gd92-05-31.sbd.paino.544.sbefail.shnf",
    tier: 1,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Baba O'Riley &gt; Tomorrow Never Knows",
    showDate: "1992-06-20",
    showIdentifier: "gd92-06-20.dsbd.gardner.2207.sbefail.shnf",
    tier: 1,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ain't It Crazy (The Rub)",
    showDate: "1971-03-18",
    showIdentifier: "gd71-03-18.sbd.yerys.1663.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ain't It Crazy (The Rub)",
    showDate: "1970-05-15",
    showIdentifier: "gd70-05-15.early-late.sbd.97.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ain't It Crazy (The Rub)",
    showDate: "1971-04-28",
    showIdentifier: "gd71-04-28.sbd.murphy.2248.sbeok.shnf",
    tier: 1,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cream Puff War",
    showDate: "1966-11-19",
    showIdentifier: "gd66-11-19.sbd.seff.41.sbeok.shnf",
    tier: 1,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cream Puff War",
    showDate: "1966-07-03",
    showIdentifier: "gd66-07-03.sbd.unknown.40.sbeok.shnf",
    tier: 1,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cream Puff War",
    showDate: "1966-12-01",
    showIdentifier: "gd66-12-01.sbd.ladner.8575.sbeok.shnf",
    tier: 1,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I've Been All Around This World",
    showDate: "1970-02-14",
    showIdentifier: "gd70-02-14.early-late.sbd.cotsman.18115.sbeok.shnf",
    tier: 1,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I've Been All Around This World",
    showDate: "1980-12-06",
    showIdentifier: "gd80-12-06.cantor.clugston.5478.sbeok.shnf",
    tier: 1,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I've Been All Around This World",
    showDate: "1969-12-26",
    showIdentifier: "gd69-12-26.sbd.murphy.1821.sbeok.shnf",
    tier: 1,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It's A Man's World",
    showDate: "1970-05-02",
    showIdentifier: "gd1970-05-02.sbd.remaster.dp8outtake.100007.sbeok.flac16",
    tier: 1,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It's A Man's World",
    showDate: "1970-04-15",
    showIdentifier: "gd70-04-15.sbd.kaplan.14354.sbeok.shnf",
    tier: 1,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It's A Man's World",
    showDate: "1970-06-04",
    showIdentifier: "gd70-06-04.sbd.miller.12135.sbeok.shnf",
    tier: 1,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Revolution",
    showDate: "1983-10-12",
    showIdentifier: "gd83-10-12.sbd.harrell.8112.sbeok.shnf",
    tier: 1,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Revolution",
    showDate: "1990-03-15",
    showIdentifier: "gd1990-03-15.28293.sbeok.shnf",
    tier: 1,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Revolution",
    showDate: "1985-11-08",
    showIdentifier: "gd85-11-08.sbd.clugston.5301.sbeok.shnf",
    tier: 1,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ollin Arageed",
    showDate: "1978-09-16",
    showIdentifier: "gd78-09-16.sbd.orf.2319.sbeok.shnf",
    tier: 1,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ollin Arageed",
    showDate: "1978-10-21",
    showIdentifier: "gd78-10-21.sbd.popi.6100.sbeok.shnf",
    tier: 1,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ollin Arageed",
    showDate: "1978-11-24",
    showIdentifier: "gd78-11-24.sbd.prefm.13948.sbefail.shnf",
    tier: 1,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Katie Mae",
    showDate: "1970-02-13",
    showIdentifier: "gd70-02-13.early-late.sbd.cotsman.18114.sbeok.shnf",
    tier: 1,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Katie Mae",
    showDate: "1970-05-15",
    showIdentifier: "gd70-05-15.early-late.sbd.97.sbeok.shnf",
    tier: 1,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Katie Mae",
    showDate: "1970-03-21",
    showIdentifier: "gd70-03-21.early.lee.pcrp.20184.sbeok.shnf",
    tier: 1,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - She Belongs To Me",
    showDate: "1985-09-15",
    showIdentifier: "gd85-09-15.aud.zelner.13600.sbeok.shnf",
    tier: 1,
    votes: 48,
    notes: "48 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - She Belongs To Me",
    showDate: "1985-11-01",
    showIdentifier: "gd85-11-01.oade.connor.9217.sbeok.shnf",
    tier: 1,
    votes: 47,
    notes: "47 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - She Belongs To Me",
    showDate: "1985-06-15",
    showIdentifier: "gd85-06-15.sbd.griesman.5682.sbeok.shnf",
    tier: 1,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mountain Jam",
    showDate: "1973-07-28",
    showIdentifier: "gd73-07-28.sbd.weiner.14196.sbeok.shnf",
    tier: 1,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mountain Jam",
    showDate: "1968-08-21",
    showIdentifier: "gd68-08-21.sbd.cotsman.17355.sbeok.shnf",
    tier: 1,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mountain Jam",
    showDate: "1969-02-07",
    showIdentifier: "gd69-02-07.early.sbd.wiley.14472.sbeok.shnf",
    tier: 1,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Childhood's End",
    showDate: "1994-07-20",
    showIdentifier: "gd94-07-20.sbd.darkstar.12596.sbeok.shnf",
    tier: 1,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Childhood's End",
    showDate: "1994-09-24",
    showIdentifier: "Search%20engine%20returned%20invalid%20information%20or%20was%20unresponsive",
    tier: 1,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Childhood's End",
    showDate: "1995-07-09",
    showIdentifier: "gd95-07-09.sbd.7233.sbeok.shnf",
    tier: 1,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Oh Babe It Ain't No Lie",
    showDate: "1980-10-30",
    showIdentifier: "gd80-10-30.wise.larson.1954.sbeok.shnf",
    tier: 1,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Oh Babe It Ain't No Lie",
    showDate: "1981-10-16",
    showIdentifier: "gd81-10-16.sbd.vinson.1217.sbeok.shnf",
    tier: 1,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Oh Babe It Ain't No Lie",
    showDate: "1980-10-11",
    showIdentifier: "gd80-10-11.acoustic-sbd.windsor.323.sbefail.shnf",
    tier: 1,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Tomorrow Is Forever",
    showDate: "1974-10-19",
    showIdentifier: "gd74-10-19.sbd.miller.21927.sbeok.shnf",
    tier: 1,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Tomorrow Is Forever",
    showDate: "1972-09-24",
    showIdentifier: "gd72-09-24.sbd.jeffm.2202.sbeok.shnf",
    tier: 1,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Tomorrow Is Forever",
    showDate: "1972-11-19",
    showIdentifier: "gd72-11-19.sbd.winters.17705.sbeok.shnf",
    tier: 1,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - If The Shoe Fits",
    showDate: "1994-06-25",
    showIdentifier: "gd94-06-25.sbd.walker.16471.sbeok.shnf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - If The Shoe Fits",
    showDate: "1994-06-09",
    showIdentifier: "gd94-06-09.schoeps.ladner.10066.sbeok.shnf",
    tier: 1,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - If The Shoe Fits",
    showDate: "1994-08-03",
    showIdentifier: "gd94-08-03.aud.unknown.8728.sbeok.shnf",
    tier: 1,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Catfish John",
    showDate: "1976-02-14",
    showIdentifier: "INTERNAL_ERROR:%20invalid%20or%20no%20response%20from%20Elasticsearch",
    tier: 1,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cold Jordan",
    showDate: "1970-05-02",
    showIdentifier: "gd1970-05-02.sbd.remaster.dp8outtake.100007.sbeok.flac16",
    tier: 1,
    votes: 34,
    notes: "34 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cold Jordan",
    showDate: "1970-05-15",
    showIdentifier: "gd70-05-15.early-late.sbd.97.sbeok.shnf",
    tier: 1,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cold Jordan",
    showDate: "1970-05-01",
    showIdentifier: "gd70-05-01.sbd.clugston.5465.sbeok.shnf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Second That Emotion",
    showDate: "1971-04-25",
    showIdentifier: "gd71-04-25.sbd.grote.8761.sbeok.shnf",
    tier: 1,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Second That Emotion",
    showDate: "1971-04-29",
    showIdentifier: "gd71-04-29.sbd.frisco.16782.sbeok.shnf",
    tier: 1,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Second That Emotion",
    showDate: "1971-04-18",
    showIdentifier: "gd71-04-18.sbd.fink.7112.sbeok.shnf",
    tier: 1,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stealin'",
    showDate: "1966-07-29",
    showIdentifier: "gd66-07-29.sbd.vernon.9051.sbeok.shnf",
    tier: 1,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stealin'",
    showDate: "1966-07-30",
    showIdentifier: "gd1966-07-30.sbd.GEMS.94631.flac16",
    tier: 1,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stealin'",
    showDate: "1966-09-16",
    showIdentifier: "gd66-09-16.sbd.vernon.9127.sbeok.shnf",
    tier: 1,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wake Up Little Susie",
    showDate: "1970-02-13",
    showIdentifier: "gd70-02-13.early-late.sbd.cotsman.18114.sbeok.shnf",
    tier: 1,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wake Up Little Susie",
    showDate: "1970-06-04",
    showIdentifier: "gd70-06-04.sbd.miller.12135.sbeok.shnf",
    tier: 1,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wake Up Little Susie",
    showDate: "1970-11-08",
    showIdentifier: "gd1970-11-08.aud.weiner.28609.sbeok.shnf",
    tier: 1,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Darkness Jam",
    showDate: "1970-09-19",
    showIdentifier: "gd70-09-19.sbd.kaplan.5217.sbeok.shnf",
    tier: 1,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Darkness Jam",
    showDate: "1971-07-31",
    showIdentifier: "gd71-07-31.winberg.weiner.5678.gdADT05.sbefail.shnf",
    tier: 1,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Darkness Jam",
    showDate: "1970-06-06",
    showIdentifier: "gd70-06-06.sbd.ashley.2172.sbeok.shnf",
    tier: 1,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Believe It Or Not",
    showDate: "1990-03-22",
    showIdentifier: "gd90-03-22.sbd.bertha-ashley.21433.sbeok.shnf",
    tier: 1,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Believe It Or Not",
    showDate: "1988-06-23",
    showIdentifier: "gd88-06-23.dsbd.terrapin-flyer.13051.sbeok.shnf",
    tier: 1,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Believe It Or Not",
    showDate: "1988-07-29",
    showIdentifier: "gd88-07-29.sbd.hayum.5395.sbeok.shnf",
    tier: 1,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Boy Pete",
    showDate: "1970-09-20",
    showIdentifier: "gd70-09-20.aud.remaster.sirmick.27583.sbeok.shnf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Boy Pete",
    showDate: "1985-11-21",
    showIdentifier: "gd85-11-21.sbd.lai.3351.sbefail.shnf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Boy Pete",
    showDate: "1978-11-17",
    showIdentifier: "gd78-11-17.acoustic.sbd.dodd.7687.sbeok.shnf",
    tier: 1,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Born Cross Eyed",
    showDate: "1968-02-14",
    showIdentifier: "gd68-02-14.sbd.kaplan.15640.sbeok.shnf",
    tier: 1,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Born Cross Eyed",
    showDate: "1968-01-20",
    showIdentifier: "gd68-01-20.sbd.jools.19470.sbe-fixed.shnf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Born Cross Eyed",
    showDate: "1968-02-03",
    showIdentifier: "gd68-02-03.sbd.jools.14987.sbeok.shnf",
    tier: 1,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mission in the Rain",
    showDate: "1976-06-12",
    showIdentifier: "gd76-06-12.fm.wren.5556.sbeok.shnf",
    tier: 1,
    votes: 68,
    notes: "68 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mission in the Rain",
    showDate: "1976-06-10",
    showIdentifier: "gd76-06-10.sbd.bertha-ashley.23370.sbeok.shnf",
    tier: 1,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mission in the Rain",
    showDate: "1976-06-18",
    showIdentifier: "gd76-06-18.warburton.vernon.14449.sbeok.shnf",
    tier: 1,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rubin and Cherise",
    showDate: "1991-03-17",
    showIdentifier: "gd91-03-17.sbd.miller.28295.sbeok.flacf",
    tier: 1,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rubin and Cherise",
    showDate: "1991-06-09",
    showIdentifier: "gd91-06-09.sbd.unknown.12756.sbeok.shnf",
    tier: 1,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rubin and Cherise",
    showDate: "1977-09-03",
    showIdentifier: "gd77-09-03.sbd.unk.276.sbefixed.shnf",
    tier: 1,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Swing Low Sweet Chariot",
    showDate: "1970-06-24",
    showIdentifier: "gd_nrps70-06-24.aud.pcrp5.23062.sbeok.flacf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Swing Low Sweet Chariot",
    showDate: "1970-08-05",
    showIdentifier: "gd70-08-05.sbd.jupile.17271.sbeok.shnf",
    tier: 1,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Swing Low Sweet Chariot",
    showDate: "1970-06-04",
    showIdentifier: "gd70-06-04.sbd.miller.12135.sbeok.shnf",
    tier: 1,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Visions of Johanna",
    showDate: "1995-03-18",
    showIdentifier: "gd95-03-18.sbd.1362.sbeok.shnf",
    tier: 1,
    votes: 52,
    notes: "52 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Visions of Johanna",
    showDate: "1995-02-21",
    showIdentifier: "gd95-02-21.dsbd.stephens.8840.sbeok.shnf",
    tier: 1,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Visions of Johanna",
    showDate: "1995-07-08",
    showIdentifier: "gd95-07-08.sbd.10071.sbeok.shnf",
    tier: 1,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Close Encounters Jam",
    showDate: "1978-01-22",
    showIdentifier: "gd78-01-22.sbd.popi.4974.sbeok.shnf",
    tier: 1,
    votes: 39,
    notes: "39 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Close Encounters Jam",
    showDate: "1989-07-15",
    showIdentifier: "gd89-07-15.sbd.11266.sbeok.shnf",
    tier: 1,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Close Encounters Jam",
    showDate: "1977-12-29",
    showIdentifier: "gd1977-12-29.aud.92374.flac16",
    tier: 1,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bo Diddley",
    showDate: "1972-05-23",
    showIdentifier: "gd72-05-23.sbd.cribbs.17700.sbeok.shnf",
    tier: 1,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bo Diddley",
    showDate: "1972-03-25",
    showIdentifier: "gd72-03-25.aud.hanno.8838.sbeok.shnf",
    tier: 1,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bo Diddley",
    showDate: "1972-07-16",
    showIdentifier: "gd72-07-16.sbd-aud.cotsman.11258.sbeok.shnf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It Takes A Lot To Laugh, It Takes A Train To Cry",
    showDate: "1973-06-10",
    showIdentifier: "gd73-06-10.sbd.hollister.174.sbeok.shnf",
    tier: 1,
    votes: 34,
    notes: "34 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It Takes A Lot To Laugh, It Takes A Train To Cry",
    showDate: "1991-09-10",
    showIdentifier: "gd91-09-10.sbd.sacks.511.sbeok.shnf",
    tier: 1,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It Takes A Lot To Laugh, It Takes A Train To Cry",
    showDate: "1991-05-12",
    showIdentifier: "gd91-05-12.sbd.clugston.7362.sbeok.shnf",
    tier: 1,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Little Sadie",
    showDate: "1970-02-13",
    showIdentifier: "gd70-02-13.early-late.sbd.cotsman.18114.sbeok.shnf",
    tier: 1,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Little Sadie",
    showDate: "1969-12-26",
    showIdentifier: "gd69-12-26.sbd.murphy.1821.sbeok.shnf",
    tier: 1,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Little Sadie",
    showDate: "1970-02-23",
    showIdentifier: "gd70-02-23.sbd.vernon.10375.sbeok.shnf",
    tier: 1,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Louie",
    showDate: "1988-04-15",
    showIdentifier: "gd88-04-15.sbd.zei.2020.sbeok.shnf",
    tier: 1,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Louie",
    showDate: "1989-04-09",
    showIdentifier: "gd89-04-09.nak.7858.sbeok.shnf",
    tier: 1,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Louie",
    showDate: "1988-05-01",
    showIdentifier: "gd88-05-01.sbd.jerugim.2206.sbefail.shnf",
    tier: 1,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Run Run Rudolph",
    showDate: "1971-12-14",
    showIdentifier: "gd71-12-14.sbd.deibert.12763.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Run Run Rudolph",
    showDate: "1971-12-09",
    showIdentifier: "gd71-12-09.sbd.kaplan.3345.sbeok.shnf",
    tier: 1,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Run Run Rudolph",
    showDate: "1971-12-07",
    showIdentifier: "gd71-12-07.sbd.miller.3375.sbeok.shnf",
    tier: 1,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Walking the Dog",
    showDate: "1985-04-08",
    showIdentifier: "gd85-04-08.sbd.wiley.8755.sbeok.shnf",
    tier: 1,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Walking the Dog",
    showDate: "1970-03-21",
    showIdentifier: "gd70-03-21.early.lee.pcrp.20184.sbeok.shnf",
    tier: 1,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Walking the Dog",
    showDate: "1985-11-11",
    showIdentifier: "gd1985-11-11.mtx.seamons.95966.sbeok.flac16",
    tier: 1,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Jude",
    showDate: "1969-03-01",
    showIdentifier: "gd69-03-01.sbd.16track.kaplan.4030.sbeok.shnf",
    tier: 1,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Jude",
    showDate: "1990-03-22",
    showIdentifier: "gd90-03-22.sbd.bertha-ashley.21433.sbeok.shnf",
    tier: 1,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Blues For Allah",
    showDate: "1975-08-13",
    showIdentifier: "gd75-08-13.fm.vernon.23661.sbeok.shnf",
    tier: 1,
    votes: 42,
    notes: "42 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Blues For Allah",
    showDate: "1975-03-23",
    showIdentifier: "gd1975-03-23.fm.lee-smith.94026.sbeok.flac16",
    tier: 1,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Blues For Allah",
    showDate: "1975-06-17",
    showIdentifier: "gd1975-06-17.aud.unknown.87560.flac16",
    tier: 1,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let Me Sing Your Blues Away",
    showDate: "1973-09-08",
    showIdentifier: "gd73-09-08.sbd.wulf.183.sbefail.shnf",
    tier: 1,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let Me Sing Your Blues Away",
    showDate: "1973-09-11",
    showIdentifier: "gd73-09-11.sbd.lanum.184.sbeok.shnf",
    tier: 1,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let Me Sing Your Blues Away",
    showDate: "1973-09-15",
    showIdentifier: "gd73-09-15.aud-sbd.cotsman.16174.sbeok.shnf",
    tier: 1,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Maybe You Know",
    showDate: "1986-04-21",
    showIdentifier: "gd86-04-21.sbd.jeffm.1857.sbeok.shnf",
    tier: 1,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Maybe You Know",
    showDate: "1983-04-26",
    showIdentifier: "gd83-04-26.sbd.parrillo.2606.sbeok.shnf",
    tier: 1,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Maybe You Know",
    showDate: "1983-04-20",
    showIdentifier: "gd83-04-20.sbd.miller.27860.sbeok.flacf",
    tier: 1,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Quin The Eskimo",
    showDate: "1985-12-30",
    showIdentifier: "gd85-12-30.sbd.georges.1223.sbeok.shnf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Quin The Eskimo",
    showDate: "1986-12-27",
    showIdentifier: "gd86-12-27.sbd.candyman.9152.sbeok.shnf",
    tier: 1,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Quin The Eskimo",
    showDate: "1991-09-25",
    showIdentifier: "gd91-09-25.nak.dodd.16667.sbeok.shnf",
    tier: 1,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rockin' Pneumonia",
    showDate: "1972-05-23",
    showIdentifier: "gd72-05-23.sbd.cribbs.17700.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rockin' Pneumonia",
    showDate: "1972-05-24",
    showIdentifier: "gd72-05-24.jones.macdonald.5920.sbeok.shnf",
    tier: 1,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rockin' Pneumonia",
    showDate: "1972-09-03",
    showIdentifier: "gd72-09-03.sbd.new.hanno.20168.sbeok.shnf",
    tier: 1,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Simple Twist Of Fate",
    showDate: "1987-07-10",
    showIdentifier: "gd87-07-10.senn.lai.3859.sbeok.shnf",
    tier: 1,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Simple Twist Of Fate",
    showDate: "1987-07-26",
    showIdentifier: "gd1987-07-26.nak700.yamaguchi-poris.russjcan.98214.flac16",
    tier: 1,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Simple Twist Of Fate",
    showDate: "1987-07-19",
    showIdentifier: "gd87-07-19.sbd.fishman.13023.sbeok.shnf",
    tier: 1,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Willie and the Hand Jive",
    showDate: "1987-04-04",
    showIdentifier: "gd87-04-04.schoeps.ladner.9362.sbeok.shnf",
    tier: 1,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Willie and the Hand Jive",
    showDate: "1986-02-12",
    showIdentifier: "gd86-02-12.beyer.connor.3302.sbeok.shnf",
    tier: 1,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Willie and the Hand Jive",
    showDate: "1986-03-23",
    showIdentifier: "gd86-03-23.senn.unknown.15203.sbeok.shnf",
    tier: 1,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Don't Have To Ask",
    showDate: "1966-07-16",
    showIdentifier: "gd1966-07-16.sbd.miller.89555.sbeok.flac16",
    tier: 1,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Don't Have To Ask",
    showDate: "1966-07-03",
    showIdentifier: "gd66-07-03.sbd.unknown.40.sbeok.shnf",
    tier: 1,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Don't Have To Ask",
    showDate: "1966-03-25",
    showIdentifier: "gd66-03-25.sbd.unknown.38.sbeok.shnf",
    tier: 1,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - King Solomon's Marbles",
    showDate: "1975-08-13",
    showIdentifier: "gd75-08-13.fm.vernon.23661.sbeok.shnf",
    tier: 1,
    votes: 33,
    notes: "33 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - King Solomon's Marbles",
    showDate: "1975-03-23",
    showIdentifier: "gd1975-03-23.fm.lee-smith.94026.sbeok.flac16",
    tier: 1,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - King Solomon's Marbles",
    showDate: "1975-09-28",
    showIdentifier: "gd75-09-28.sbd.fink.9392.sbeok.shnf",
    tier: 1,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Valley Road",
    showDate: "1990-10-30",
    showIdentifier: "gd90-10-30.dsbd.barbella.6678.sbeok.shnf",
    tier: 1,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Valley Road",
    showDate: "1990-12-04",
    showIdentifier: "gd90-12-04.sbd.ladner.9365.sbeok.shnf",
    tier: 1,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Valley Road",
    showDate: "1990-12-13",
    showIdentifier: "gd90-12-13.sbd.unknown.4988.sbeok.shnf",
    tier: 1,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Frozen Logger",
    showDate: "1985-09-07",
    showIdentifier: "gd85-09-07.sbd.miller.18102.sbeok.shnf",
    tier: 1,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Frozen Logger",
    showDate: "1971-10-22",
    showIdentifier: "gd1971-10-22.set2.sbd.miller.86728.sbeok.flac16",
    tier: 1,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Frozen Logger",
    showDate: "1971-10-21",
    showIdentifier: "gd71-10-21.sbd.cotsman.5071.sbeok.shnf",
    tier: 1,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Want To Tell You",
    showDate: "1994-10-15",
    showIdentifier: "gd94-10-15.sbd.miller.27249.sbeok.flacf",
    tier: 1,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Want To Tell You",
    showDate: "1994-07-13",
    showIdentifier: "gd94-07-13.sbd.georges.17029.sbeok.shnf",
    tier: 1,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Want To Tell You",
    showDate: "1995-03-22",
    showIdentifier: "gd95-03-22.akg.12179.sbeok.shnf",
    tier: 1,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Day Tripper",
    showDate: "1985-06-25",
    showIdentifier: "gd85-06-25.sbd.miller.18663.sbeok.shnf",
    tier: 1,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Day Tripper",
    showDate: "1985-03-31",
    showIdentifier: "gd85-03-31.oade.connor.8244.sbeok.shnf",
    tier: 1,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Day Tripper",
    showDate: "1984-12-28",
    showIdentifier: "gd84-12-28.aud.unknown.16584.sbeok.shnf",
    tier: 1,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - How Long Blues",
    showDate: "1970-07-14",
    showIdentifier: "gd1970-07-14.sbd.unknown.96628.sbeok.shnf",
    tier: 1,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - How Long Blues",
    showDate: "1989-02-12",
    showIdentifier: "gd89-02-12.sbd.presley.4680.sbeok.shnf",
    tier: 1,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - How Long Blues",
    showDate: "1970-08-19",
    showIdentifier: "gd1970-08-19.aud.taback.cdjones.81775.sbeok.flac16",
    tier: 1,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let It Rock",
    showDate: "1974-06-23",
    showIdentifier: "gd74-06-23.sbd.cribbs.16780.sbeok.shnf",
    tier: 1,
    votes: 52,
    notes: "52 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Till The Morning Comes",
    showDate: "1970-10-04",
    showIdentifier: "gd70-10-04.sbd.cotsman.4942.sbeok.shnf",
    tier: 1,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Till The Morning Comes",
    showDate: "1970-12-26",
    showIdentifier: "gd70-12-26.sbd.miller.22369.sbeok.shnf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Till The Morning Comes",
    showDate: "1970-09-18",
    showIdentifier: "gd70-09-18.sbd-aud.cotsman.17893.sbeok.shnf",
    tier: 1,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Why Don't We Do It In The Road",
    showDate: "1985-04-07",
    showIdentifier: "gd85-04-07.sbd.keith.14614.sbeok.shnf",
    tier: 1,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Why Don't We Do It In The Road",
    showDate: "1984-07-15",
    showIdentifier: "gd84-07-15.pcm-sbd.miller.30641.sbeok.flacf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Why Don't We Do It In The Road",
    showDate: "1984-11-03",
    showIdentifier: "gd84-11-03.aud.willy-vernon.18111.sbeok.shnf",
    tier: 1,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Got My Mojo Working",
    showDate: "1978-10-21",
    showIdentifier: "gd78-10-21.sbd.popi.6100.sbeok.shnf",
    tier: 1,
    votes: 33,
    notes: "33 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Got My Mojo Working",
    showDate: "1978-10-22",
    showIdentifier: "gd78-10-22.sbd.kempa.299.sbeok.shnf",
    tier: 1,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Got My Mojo Working",
    showDate: "1978-10-18",
    showIdentifier: "gd78-10-18.sbd.shakedown.298.sbeok.shnf",
    tier: 1,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - La Bamba",
    showDate: "1987-09-18",
    showIdentifier: "gd87-09-18.sbd.samaritano.20025.sbeok.shnf",
    tier: 1,
    votes: 32,
    notes: "32 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - La Bamba",
    showDate: "1987-09-07",
    showIdentifier: "gd87-09-07.aud-sonyecm220t.unknown.8596.sbeok.shnf",
    tier: 1,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - La Bamba",
    showDate: "1987-09-23",
    showIdentifier: "gd87-09-23.sbd.willy.15207.sbeok.shnf",
    tier: 1,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ballad of a Thin Man",
    showDate: "1988-03-27",
    showIdentifier: "gd88-03-27.matrix.braverman.17262.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ballad of a Thin Man",
    showDate: "1988-04-01",
    showIdentifier: "gd88-04-01.sbd-matrix.braverman.11264.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ballad of a Thin Man",
    showDate: "1987-07-26",
    showIdentifier: "gd1987-07-26.nak700.yamaguchi-poris.russjcan.98214.flac16",
    tier: 1,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Baby",
    showDate: "1985-11-08",
    showIdentifier: "gd85-11-08.sbd.clugston.5301.sbeok.shnf",
    tier: 1,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Baby",
    showDate: "1982-12-31",
    showIdentifier: "gd82-12-31.sbd.bode.5958.sbeok.shnf",
    tier: 1,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Baby",
    showDate: "1985-02-18",
    showIdentifier: "gd85-02-18.sbd.willy.7588.sbeok.shnf",
    tier: 1,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Little One",
    showDate: "1966-03-12",
    showIdentifier: "gd66-acid-test-supplement.sbd.unknown.9514.shnf",
    tier: 1,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Little One",
    showDate: "1966-02-25",
    showIdentifier: "gd66-02-25.sbd.unknown.1593.sbefail.shnf",
    tier: 1,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Little One",
    showDate: "1966-03-25",
    showIdentifier: "gd66-03-25.sbd.unknown.38.sbeok.shnf",
    tier: 1,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - High Heeled Sneakers",
    showDate: "1966-11-19",
    showIdentifier: "gd66-11-19.sbd.seff.41.sbeok.shnf",
    tier: 1,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - High Heeled Sneakers",
    showDate: "1969-08-03",
    showIdentifier: "gd1969-08-03.sbd.miller.30652.sbeok.flac16",
    tier: 1,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - High Heeled Sneakers",
    showDate: "1969-08-28",
    showIdentifier: "gd69-08-28.sbd.lepley.4234.sbeok.shnf",
    tier: 1,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Hear A Voice Calling",
    showDate: "1970-05-15",
    showIdentifier: "gd70-05-15.early-late.sbd.97.sbeok.shnf",
    tier: 1,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Hear A Voice Calling",
    showDate: "1970-08-05",
    showIdentifier: "gd70-08-05.sbd.jupile.17271.sbeok.shnf",
    tier: 1,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Hear A Voice Calling",
    showDate: "1970-07-11",
    showIdentifier: "gd70-07-11.aud.cotsman.9379.sbefail.shnf",
    tier: 1,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Just Wanna Make Love To You",
    showDate: "1984-07-22",
    showIdentifier: "gd84-07-22.pcm-sbd.miller.30650.sbeok.flacf",
    tier: 1,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Just Wanna Make Love To You",
    showDate: "1984-10-08",
    showIdentifier: "gd84-10-08.sbd.wiley.14450.sbeok.shnf",
    tier: 1,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Just Wanna Make Love To You",
    showDate: "1995-02-21",
    showIdentifier: "gd95-02-21.dsbd.stephens.8840.sbeok.shnf",
    tier: 1,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - If I Had The World To Give",
    showDate: "1978-11-20",
    showIdentifier: "gd78-11-20.sbdpatched.knott.21727.sbeok.shnf",
    tier: 1,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - If I Had The World To Give",
    showDate: "1978-10-17",
    showIdentifier: "gd78-10-17.sbd.unknown.1078.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - If I Had The World To Give",
    showDate: "1978-08-30",
    showIdentifier: "gd78-08-30.set2-sbd.barbella.8038.sbeok.shnf",
    tier: 1,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Keep On Growing",
    showDate: "1985-06-30",
    showIdentifier: "gd85-06-30.sbd.georges.366.sbeok.shnf",
    tier: 1,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Keep On Growing",
    showDate: "1985-06-22",
    showIdentifier: "gd1985-06-22.sbd.hillwig.13478.sbeok.shnf",
    tier: 1,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Keep On Growing",
    showDate: "1986-02-14",
    showIdentifier: "gd86-02-14.sbd.miller.11625.sbeok.shnf",
    tier: 1,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lindy",
    showDate: "1966-09-16",
    showIdentifier: "gd66-09-16.sbd.vernon.9127.sbeok.shnf",
    tier: 1,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lindy",
    showDate: "1966-12-01",
    showIdentifier: "gd66-12-01.sbd.ladner.8575.sbeok.shnf",
    tier: 1,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lindy",
    showDate: "1966-11-29",
    showIdentifier: "gd66-11-29.sbd.ret.20448.sbeok.shnf",
    tier: 1,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Long Black Limousine",
    showDate: "1970-05-15",
    showIdentifier: "gd70-05-15.early-late.sbd.97.sbeok.shnf",
    tier: 1,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Long Black Limousine",
    showDate: "1969-12-26",
    showIdentifier: "gd69-12-26.sbd.murphy.1821.sbeok.shnf",
    tier: 1,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Long Black Limousine",
    showDate: "1970-01-31",
    showIdentifier: "gd70-01-31.sbd.cotsman.7045.sbefail.shnf",
    tier: 1,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Orleans",
    showDate: "1970-11-08",
    showIdentifier: "gd1970-11-08.aud.weiner.28609.sbeok.shnf",
    tier: 1,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Orleans",
    showDate: "1970-06-06",
    showIdentifier: "gd70-06-06.sbd.ashley.2172.sbeok.shnf",
    tier: 1,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Orleans",
    showDate: "1984-06-21",
    showIdentifier: "gd84-06-21.sbe.tbrame.15405.sbeok.shnf",
    tier: 1,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Oh Boy",
    showDate: "1971-04-06",
    showIdentifier: "gd71-04-06.sbd.stephens.18735.sbeok.shnf",
    tier: 1,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Oh Boy",
    showDate: "1981-05-22",
    showIdentifier: "gd1981-05-22.nak300.walker.scotton.miller.95938.sbeok.flac16",
    tier: 1,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Oh Boy",
    showDate: "1978-11-17",
    showIdentifier: "gd78-11-17.acoustic.sbd.dodd.7687.sbeok.shnf",
    tier: 1,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Operator",
    showDate: "1970-09-18",
    showIdentifier: "gd70-09-18.sbd-aud.cotsman.17893.sbeok.shnf",
    tier: 1,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Operator",
    showDate: "1970-11-08",
    showIdentifier: "gd1970-11-08.aud.weiner.28609.sbeok.shnf",
    tier: 1,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Operator",
    showDate: "1970-08-18",
    showIdentifier: "gd70-08-18.aud.yerys.1346.sbeok.shnf",
    tier: 1,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Tangled Up In Blue",
    showDate: "1987-07-10",
    showIdentifier: "gd87-07-10.senn.lai.3859.sbeok.shnf",
    tier: 1,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Tangled Up In Blue",
    showDate: "1987-07-19",
    showIdentifier: "gd87-07-19.sbd.fishman.13023.sbeok.shnf",
    tier: 1,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Who Do You Love",
    showDate: "1972-04-14",
    showIdentifier: "gd72-04-14.sbd.hurwitt.8828.sbeok.shnf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Who Do You Love",
    showDate: "1972-05-11",
    showIdentifier: "gd72-05-11.sbd.ashley-bertha.7364.sbefail.shnf",
    tier: 1,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Who Do You Love",
    showDate: "1966-03-09",
    showIdentifier: "gd1966-03-09.136654.practise.sbd.mr.dat48k.sirmick.flac16",
    tier: 1,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Take Me To The River",
    showDate: "1995-04-01",
    showIdentifier: "gd95-04-01.sbd.5287.sbeok.shnf",
    tier: 1,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Take Me To The River",
    showDate: "1995-06-30",
    showIdentifier: "gd95-06-30.schoeps.3376.sbeok.shnf",
    tier: 1,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Take Me To The River",
    showDate: "1995-06-21",
    showIdentifier: "gd95-06-21.naks.5971.sbeok.shnf",
    tier: 1,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - A Voice From On High",
    showDate: "1970-05-15",
    showIdentifier: "gd70-05-15.early-late.sbd.97.sbeok.shnf",
    tier: 1,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - A Voice From On High",
    showDate: "1970-07-11",
    showIdentifier: "gd70-07-11.aud.cotsman.9379.sbefail.shnf",
    tier: 1,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - A Voice From On High",
    showDate: "1970-08-05",
    showIdentifier: "gd70-08-05.sbd.jupile.17271.sbeok.shnf",
    tier: 1,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stir It Up",
    showDate: "1991-03-21",
    showIdentifier: "gd91-03-21.sbd.king.474.sbeok.shnf",
    tier: 1,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stir It Up",
    showDate: "1991-04-05",
    showIdentifier: "gd91-04-05.sbd.gardner.4162.sbeok.shnf",
    tier: 1,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stir It Up",
    showDate: "1988-03-26",
    showIdentifier: "gd88-03-26.sbd.braverman.7164.sbefail.shnf",
    tier: 1,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ain't Superstitious (Meet Me on the Bottom)",
    showDate: "1985-06-28",
    showIdentifier: "gd85-06-28.sbd.lemon2.5822.sbeok.shnf",
    tier: 1,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ain't Superstitious (Meet Me on the Bottom)",
    showDate: "1985-04-08",
    showIdentifier: "gd85-04-08.sbd.wiley.8755.sbeok.shnf",
    tier: 1,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ain't Superstitious (Meet Me on the Bottom)",
    showDate: "1985-03-29",
    showIdentifier: "gd85-03-29.oade-schoeps.sacks.23475.sbeok.flacf",
    tier: 1,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cocaine Habit Blues",
    showDate: "1970-07-12",
    showIdentifier: "gd1970-07-12.aud.unknown.sirmick.24663.sbefail.shnf",
    tier: 1,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cocaine Habit Blues",
    showDate: "1970-08-05",
    showIdentifier: "gd70-08-05.sbd.jupile.17271.sbeok.shnf",
    tier: 1,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cocaine Habit Blues",
    showDate: "1970-08-19",
    showIdentifier: "gd1970-08-19.aud.taback.cdjones.81775.sbeok.flac16",
    tier: 1,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Confusion Prince",
    showDate: "1965-11-03",
    showIdentifier: "gd65-11-03.sbd.vernon.9044.sbeok.shnf",
    tier: 1,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Confusion Prince",
    showDate: "1966-11-29",
    showIdentifier: "gd66-11-29.sbd.ret.20448.sbeok.shnf",
    tier: 1,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Confusion Prince",
    showDate: "1966-05-19",
    showIdentifier: "gd66-05-19.sbd.lestatkat.6516.sbeok.shnf",
    tier: 1,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I'm A Hog For You",
    showDate: "1971-04-06",
    showIdentifier: "gd71-04-06.sbd.stephens.18735.sbeok.shnf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I'm A Hog For You",
    showDate: "1966-03-25",
    showIdentifier: "gd66-03-25.sbd.unknown.38.sbeok.shnf",
    tier: 1,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I'm A Hog For You",
    showDate: "1966-01-08",
    showIdentifier: "gd65-acid-tests.sbd.bershaw.5406.sbeok.shnf",
    tier: 1,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lazy Lightnin'",
    showDate: "1977-05-05",
    showIdentifier: "gd77-05-05.sbd.stephens.8832.sbeok.shnf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lazy Lightnin'",
    showDate: "1984-10-31",
    showIdentifier: "gd84-10-31.senn.14947.sbeok.shnf",
    tier: 1,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lazy Lightnin'",
    showDate: "1977-05-25",
    showIdentifier: "gd77-05-25.sbd.shannon.13399.sbefail.shnf",
    tier: 1,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Money",
    showDate: "1974-05-17",
    showIdentifier: "gd74-05-17.sbd.gustin.202.sbeok.shnf",
    tier: 1,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Money",
    showDate: "1974-05-19",
    showIdentifier: "gd74-05-19.sbd.clugston.6957.sbeok.shnf",
    tier: 1,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Money",
    showDate: "1974-05-21",
    showIdentifier: "gd74-05-21.sbd.belkin.2597.sbefail.shnf",
    tier: 1,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Pride of Cucamonga",
    showDate: "1977-02-17",
    showIdentifier: "gd77-02-17.sbd.outtakes.16745.sbeok.shnf",
    tier: 1,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Pride of Cucamonga",
    showDate: "1973-08-04",
    showIdentifier: "gd1973-08-04.165907.sbd.miller.flac1648",
    tier: 1,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Road Runner",
    showDate: "1986-03-21",
    showIdentifier: "gd1986-03-21.nak300.damico.87638.flac16",
    tier: 1,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Road Runner",
    showDate: "1986-03-31",
    showIdentifier: "gd86-03-31.aud.eD.13463.sbeok.shnf",
    tier: 1,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sawmill",
    showDate: "1970-02-07",
    showIdentifier: "gd70-02-07.sbd.hanno.10527.sbefail.shnf",
    tier: 1,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sawmill",
    showDate: "1970-01-31",
    showIdentifier: "gd70-01-31.sbd.cotsman.7045.sbefail.shnf",
    tier: 1,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sawmill",
    showDate: "1970-05-07",
    showIdentifier: "gd70-05-07.aud.weiner-gdADT04.5439.sbefail.shnf",
    tier: 1,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Searchin'",
    showDate: "1970-11-08",
    showIdentifier: "gd1970-11-08.aud.weiner.28609.sbeok.shnf",
    tier: 1,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Searchin'",
    showDate: "1971-04-27",
    showIdentifier: "gd71-04-27.sbd.murphy.2221.sbeok.shnf",
    tier: 1,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Searchin'",
    showDate: "1969-08-29",
    showIdentifier: "gd69-08-29.sbd.cotsman.8996.sbeok.shnf",
    tier: 1,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - That's All Right",
    showDate: "1973-06-10",
    showIdentifier: "gd73-06-10.sbd.hollister.174.sbeok.shnf",
    tier: 1,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - That's All Right",
    showDate: "1986-04-18",
    showIdentifier: "gd1986-04-18.Senn421.Darby.119488.Flac1644",
    tier: 1,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Don't Love Me",
    showDate: "1966-02-25",
    showIdentifier: "gd66-02-25.sbd.unknown.1593.sbefail.shnf",
    tier: 1,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Don't Love Me",
    showDate: "1966-12-01",
    showIdentifier: "gd66-12-01.sbd.ladner.8575.sbeok.shnf",
    tier: 1,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Don't Love Me",
    showDate: "1966-08-01",
    showIdentifier: "gd66-xx-xx.sbd.jools.19514.19529.sbeok.shnf",
    tier: 1,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Seven",
    showDate: "1969-09-29",
    showIdentifier: "gd69-09-29.aud.early.hollister.79.sbeok.shnf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Seven",
    showDate: "1970-03-21",
    showIdentifier: "gd70-03-21.early.lee.pcrp.20184.sbeok.shnf",
    tier: 1,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Seven",
    showDate: "1968-10-08",
    showIdentifier: "gd68-10-08.sbd.belaff.17691.sbeok.shnf",
    tier: 1,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stander On The Mountain",
    showDate: "1990-11-01",
    showIdentifier: "gd90-11-01.sbd.ladner.8068.sbeok.shnf",
    tier: 1,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stander On The Mountain",
    showDate: "1990-10-28",
    showIdentifier: "gd90-10-28.sbd.jamphan.3264.sbeok.shnf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stander On The Mountain",
    showDate: "1990-12-03",
    showIdentifier: "gd90-12-03.nak.wiley.13992.sbeok.shnf",
    tier: 1,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ballad of Casey Jones",
    showDate: "1970-05-15",
    showIdentifier: "gd70-05-15.early-late.sbd.97.sbeok.shnf",
    tier: 1,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ballad of Casey Jones",
    showDate: "1970-08-05",
    showIdentifier: "gd70-08-05.sbd.jupile.17271.sbeok.shnf",
    tier: 1,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bring Me My Shotgun",
    showDate: "1970-07-12",
    showIdentifier: "gd1970-07-12.aud.unknown.sirmick.24663.sbefail.shnf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dear Prudence",
    showDate: "1991-12-30",
    showIdentifier: "gd91-12-30.b_ks.georges.6812.sbeok.shnf",
    tier: 1,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dear Prudence",
    showDate: "1982-03-13",
    showIdentifier: "gd82-03-13.set2-neumann.vernon.18983.sbeok.shnf",
    tier: 1,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Early Morning Rain",
    showDate: "1965-11-03",
    showIdentifier: "gd65-11-03.sbd.vernon.9044.sbeok.shnf",
    tier: 1,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Early Morning Rain",
    showDate: "1966-11-29",
    showIdentifier: "gd66-11-29.sbd.ret.20448.sbeok.shnf",
    tier: 1,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Empty Pages",
    showDate: "1971-08-26",
    showIdentifier: "gd71-08-26.sbd.dopey.1559.sbeok.shnf",
    tier: 1,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Golden Road (to unlimited devotion)",
    showDate: "1967-05-05",
    showIdentifier: "gd67-05-05.sbs.yerys.1595.sbeok.shnf",
    tier: 1,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Golden Road (to unlimited devotion)",
    showDate: "1967-03-18",
    showIdentifier: "gd67-03-18.sbd.fink.10282.sbeok.shnf",
    tier: 1,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Henry",
    showDate: "1970-05-14",
    showIdentifier: "gd70-05-14.sbd.cotsman.12439.sbeok.shnf",
    tier: 1,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Henry",
    showDate: "1970-06-24",
    showIdentifier: "gd_nrps70-06-24.aud.pcrp5.23062.sbeok.flacf",
    tier: 1,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Kansas City",
    showDate: "1985-10-28",
    showIdentifier: "gd85-10-28.nak300.dobb.8566.sbeok.shnf",
    tier: 1,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Kansas City",
    showDate: "1985-11-05",
    showIdentifier: "gd85-11-05.sbd.lai.1188.sbefail.shnf",
    tier: 1,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let Me In",
    showDate: "1970-06-24",
    showIdentifier: "gd_nrps70-06-24.aud.pcrp5.23062.sbeok.flacf",
    tier: 1,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let Me In",
    showDate: "1969-07-04",
    showIdentifier: "gd69-07-04.sbd.sirmick.remaster.29294.shnf",
    tier: 1,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Logger Song",
    showDate: "1985-09-07",
    showIdentifier: "gd85-09-07.sbd.miller.18102.sbeok.shnf",
    tier: 1,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Logger Song",
    showDate: "1970-06-06",
    showIdentifier: "gd70-06-06.sbd.ashley.2172.sbeok.shnf",
    tier: 1,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mystery Train",
    showDate: "1970-11-08",
    showIdentifier: "gd1970-11-08.aud.weiner.28609.sbeok.shnf",
    tier: 1,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mystery Train",
    showDate: "1975-07-07",
    showIdentifier: "gd75-07-07.sbd.backus.14293.sbeok.shnf",
    tier: 1,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - She's Mine",
    showDate: "1970-05-15",
    showIdentifier: "gd70-05-15.early-late.sbd.97.sbeok.shnf",
    tier: 1,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - She's Mine",
    showDate: "1970-07-12",
    showIdentifier: "gd1970-07-12.aud.unknown.sirmick.24663.sbefail.shnf",
    tier: 1,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - So Far From Me",
    showDate: "1982-08-08",
    showIdentifier: "gd82-08-08.sbd-wise.unknown.7690.sbeok.shnf",
    tier: 1,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - So Far From Me",
    showDate: "1982-08-28",
    showIdentifier: "gd82-08-28.sbd.lai.2333.sbefail.shnf",
    tier: 1,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Tell Mama",
    showDate: "1982-12-31",
    showIdentifier: "gd82-12-31.sbd.bode.5958.sbeok.shnf",
    tier: 1,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Tell Mama",
    showDate: "1982-12-30",
    showIdentifier: "gd82-12-30.sbd.gardner.8764.sbeok.shnf",
    tier: 1,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - What's Become of the Baby",
    showDate: "1969-04-26",
    showIdentifier: "gd69-04-26.sbd.yerys.71.sbeok.shnf",
    tier: 1,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Salt Lake City",
    showDate: "1995-02-21",
    showIdentifier: "gd95-02-21.dsbd.stephens.8840.sbeok.shnf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Salt Lake City",
    showDate: "1978-04-10",
    showIdentifier: "gd78-04-10.sbd.miller.18098.sbeok.shnf",
    tier: 1,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Devil With The Blue Dress On",
    showDate: "1987-09-09",
    showIdentifier: "gd87-09-09.sbd.miller.21014.sbeok.shnf",
    tier: 1,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Devil With The Blue Dress On",
    showDate: "1987-09-16",
    showIdentifier: "gd87-09-16.sbd.hinko.22797.sbeok.shnf",
    tier: 1,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Good Golly Miss Molly",
    showDate: "1987-09-16",
    showIdentifier: "gd87-09-16.sbd.hinko.22797.sbeok.shnf",
    tier: 1,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Good Golly Miss Molly",
    showDate: "1987-09-09",
    showIdentifier: "gd87-09-09.sbd.miller.21014.sbeok.shnf",
    tier: 1,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mona",
    showDate: "1972-03-25",
    showIdentifier: "gd72-03-25.aud.hanno.8838.sbeok.shnf",
    tier: 1,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mona",
    showDate: "1991-10-27",
    showIdentifier: "gd91-10-27.sbd.martinson.537.sbeok.shnf",
    tier: 1,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Can't Come Down",
    showDate: "1965-11-03",
    showIdentifier: "gd65-11-03.sbd.vernon.9044.sbeok.shnf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Don't Think Twice",
    showDate: "1986-07-02",
    showIdentifier: "gd86-07-02.aud.eD.12934.sbeok.shnf",
    tier: 1,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Drink Up and Go Home",
    showDate: "1970-08-05",
    showIdentifier: "gd70-08-05.sbd.jupile.17271.sbeok.shnf",
    tier: 1,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Forever Young",
    showDate: "1991-11-03",
    showIdentifier: "gd1991-11-03.fm.kome.34912.sbefail.flac16",
    tier: 1,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - France",
    showDate: "1978-08-01",
    showIdentifier: "gd78-08-XX.sbd.wiley.11692.sbeok.shnf",
    tier: 1,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Get Back",
    showDate: "1987-01-28",
    showIdentifier: "gd87-01-28.sbd.leeds.17073.sbeok.shnf",
    tier: 1,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Goodnight Irene",
    showDate: "1983-12-31",
    showIdentifier: "gd83-12-31.sbd.miller.13963.sbeok.shnf",
    tier: 1,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Green Onions",
    showDate: "1988-06-30",
    showIdentifier: "gd88-06-30.schoeps-fob.gustin.414.sbeok.shnf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - How Sweet It Is",
    showDate: "1972-03-25",
    showIdentifier: "gd72-03-25.aud.hanno.8838.sbeok.shnf",
    tier: 1,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hully Gully",
    showDate: "1981-10-16",
    showIdentifier: "gd81-10-16.sbd.vinson.1217.sbeok.shnf",
    tier: 1,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Wash My Hands",
    showDate: "1971-12-05",
    showIdentifier: "gd71-12-05.prefm.miller.3391.sbeok.shnf",
    tier: 1,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Last Train to Jacksonville",
    showDate: "1972-03-25",
    showIdentifier: "gd72-03-25.aud.hanno.8838.sbeok.shnf",
    tier: 1,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - My Baby",
    showDate: "1970-11-08",
    showIdentifier: "gd1970-11-08.aud.weiner.28609.sbeok.shnf",
    tier: 1,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Oakie From Muskogee",
    showDate: "1971-04-27",
    showIdentifier: "gd71-04-27.sbd.murphy.2221.sbeok.shnf",
    tier: 1,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - One Thing To Try",
    showDate: "1973-11-25",
    showIdentifier: "gd73-11-25.sbd.sacks.2213.sbeok.shnf",
    tier: 1,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Revolutionary Hamstrung Blues",
    showDate: "1986-03-27",
    showIdentifier: "gd86-03-27.neumann-hogan.fixed.24029.sbeok.shnf",
    tier: 1,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rosemary",
    showDate: "1968-12-07",
    showIdentifier: "gd68-12-07.sbd.naines.16944.sbeok.shnf",
    tier: 1,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - This Time Forever",
    showDate: "1978-11-17",
    showIdentifier: "gd78-11-17.acoustic.sbd.dodd.7687.sbeok.shnf",
    tier: 1,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Tom Dooley",
    showDate: "1978-11-17",
    showIdentifier: "gd78-11-17.acoustic.sbd.dodd.7687.sbeok.shnf",
    tier: 1,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - What Will You Raise",
    showDate: "1980-04-28",
    showIdentifier: "gd80-04-28.fob-nak700.non-dank.3402.sbeok.shnf",
    tier: 1,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wining Boy Blues",
    showDate: "1978-11-17",
    showIdentifier: "gd78-11-17.acoustic.sbd.dodd.7687.sbeok.shnf",
    tier: 1,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Youngblood",
    showDate: "1980-12-31",
    showIdentifier: "gd80-12-31.sbd.gorinsky.6391.sbeok.shnf",
    tier: 1,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  }
];

// Tier 2: Excellent performances (2 stars) - 1773 performances
export const TIER_2_SONG_PERFORMANCES: RatedSongPerformance[] = [
  {
    songTitle: "Grateful Dead - Playing In The Band",
    showDate: "1974-08-06",
    showIdentifier: "gd74-08-06.merin.weiner.gdADT.5914.sbefail.shnf",
    tier: 2,
    votes: 120,
    notes: "120 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Playing In The Band",
    showDate: "1977-02-26",
    showIdentifier: "gd77-02-26.sbd.alphadog.9752.sbeok.shnf",
    tier: 2,
    votes: 116,
    notes: "116 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Playing In The Band",
    showDate: "1974-05-21",
    showIdentifier: "gd74-05-21.sbd.belkin.2597.sbefail.shnf",
    tier: 2,
    votes: 102,
    notes: "102 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Playing In The Band",
    showDate: "1973-11-17",
    showIdentifier: "gd73-11-17.sbd.gardner.4749.sbeok.shnf",
    tier: 2,
    votes: 95,
    notes: "95 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Playing In The Band",
    showDate: "1972-11-15",
    showIdentifier: "gd1972-11-15.sbd.miller.110631.flac16",
    tier: 2,
    votes: 88,
    notes: "88 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Playing In The Band",
    showDate: "1993-05-26",
    showIdentifier: "gd93-05-26.sbd.georges.1958.sbeok.shnf",
    tier: 2,
    votes: 74,
    notes: "74 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Playing In The Band",
    showDate: "1973-06-22",
    showIdentifier: "gd73-06-22.sbd.cribbs.17270.sbeok.shnf",
    tier: 2,
    votes: 74,
    notes: "74 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Other One",
    showDate: "1972-04-26",
    showIdentifier: "gd1972-04-26.sbd.vernon.9197.sbeok.shnf",
    tier: 2,
    votes: 105,
    notes: "105 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Other One",
    showDate: "1972-09-17",
    showIdentifier: "gd1972-09-17.aud-wolfson.minches.28165.shnf",
    tier: 2,
    votes: 100,
    notes: "100 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Other One",
    showDate: "1972-05-03",
    showIdentifier: "gd72-05-03.sbd.masse.142.sbeok.shnf",
    tier: 2,
    votes: 88,
    notes: "88 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Other One",
    showDate: "1978-01-22",
    showIdentifier: "gd78-01-22.sbd.popi.4974.sbeok.shnf",
    tier: 2,
    votes: 79,
    notes: "79 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Other One",
    showDate: "1978-02-05",
    showIdentifier: "gd78-02-05.aud.set2.warner.19466.sbeok.shnf",
    tier: 2,
    votes: 74,
    notes: "74 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Other One",
    showDate: "1972-05-07",
    showIdentifier: "gd72-05-07.sbd-aud.clugston.9193.sbeok.shnf",
    tier: 2,
    votes: 70,
    notes: "70 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Other One",
    showDate: "1972-09-03",
    showIdentifier: "gd72-09-03.sbd.new.hanno.20168.sbeok.shnf",
    tier: 2,
    votes: 64,
    notes: "64 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Cat Sunflower -&gt; I Know You Rider",
    showDate: "1974-06-16",
    showIdentifier: "gd74-06-16.sbd.fink.17701.sbeok.shnf",
    tier: 2,
    votes: 135,
    notes: "135 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Cat Sunflower -&gt; I Know You Rider",
    showDate: "1973-11-11",
    showIdentifier: "gd73-11-11.sbd.schlissel.14105.sbeok.shnf",
    tier: 2,
    votes: 117,
    notes: "117 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Cat Sunflower -&gt; I Know You Rider",
    showDate: "1974-05-19",
    showIdentifier: "gd74-05-19.sbd.clugston.6957.sbeok.shnf",
    tier: 2,
    votes: 107,
    notes: "107 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Cat Sunflower -&gt; I Know You Rider",
    showDate: "1989-07-17",
    showIdentifier: "gd89-07-17.sbd.unknown.17702.sbeok.shnf",
    tier: 2,
    votes: 102,
    notes: "102 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Cat Sunflower -&gt; I Know You Rider",
    showDate: "1977-12-29",
    showIdentifier: "gd1977-12-29.aud.92374.flac16",
    tier: 2,
    votes: 91,
    notes: "91 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Cat Sunflower -&gt; I Know You Rider",
    showDate: "1974-02-24",
    showIdentifier: "gd74-02-24.sbd.windsor.199.sbefail.shnf",
    tier: 2,
    votes: 88,
    notes: "88 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Cat Sunflower -&gt; I Know You Rider",
    showDate: "1981-03-09",
    showIdentifier: "gd81-03-09.glassberg.wise.7473.sbeok.shnf",
    tier: 2,
    votes: 79,
    notes: "79 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sugar Magnolia",
    showDate: "1983-06-20",
    showIdentifier: "gd83-06-20.fob-senn.sws.11931.sbeok.shnf",
    tier: 2,
    votes: 66,
    notes: "66 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sugar Magnolia",
    showDate: "1971-10-31",
    showIdentifier: "gd1971-10-31.sbd.miller.79011.sbeok.flac16",
    tier: 2,
    votes: 53,
    notes: "53 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sugar Magnolia",
    showDate: "1973-11-11",
    showIdentifier: "gd73-11-11.sbd.schlissel.14105.sbeok.shnf",
    tier: 2,
    votes: 53,
    notes: "53 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sugar Magnolia",
    showDate: "1977-10-29",
    showIdentifier: "gd77-10-29.maizner.vernon.8035.sbeok.shnf",
    tier: 2,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sugar Magnolia",
    showDate: "1981-10-19",
    showIdentifier: "gd81-10-19.sbd.macdonald.7914.sbeok.shnf",
    tier: 2,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sugar Magnolia",
    showDate: "1977-05-09",
    showIdentifier: "gd77-05-09.sbd.connor.8304.sbeok.shnf",
    tier: 2,
    votes: 39,
    notes: "39 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sugar Magnolia",
    showDate: "1978-12-31",
    showIdentifier: "gd78-12-31.sbd.ashley.1667.sbeok.shnf",
    tier: 2,
    votes: 39,
    notes: "39 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Jack Straw",
    showDate: "1977-05-08",
    showIdentifier: "gd77-05-08.sbd.hicks.4982.sbeok.shnf",
    tier: 2,
    votes: 105,
    notes: "105 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Jack Straw",
    showDate: "1984-10-20",
    showIdentifier: "gd84-10-20.sbd.mattman.15673.sbeok.shnf",
    tier: 2,
    votes: 80,
    notes: "80 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Jack Straw",
    showDate: "1972-05-03",
    showIdentifier: "gd72-05-03.sbd.masse.142.sbeok.shnf",
    tier: 2,
    votes: 76,
    notes: "76 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Jack Straw",
    showDate: "1980-05-15",
    showIdentifier: "gd80-05-15.aud.schlissel.12790.sbeok.shnf",
    tier: 2,
    votes: 68,
    notes: "68 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Jack Straw",
    showDate: "1977-12-29",
    showIdentifier: "gd1977-12-29.aud.92374.flac16",
    tier: 2,
    votes: 66,
    notes: "66 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Jack Straw",
    showDate: "1987-04-06",
    showIdentifier: "gd87-04-06.sbd-matrix.hinko.19848.sbeok.shnf",
    tier: 2,
    votes: 64,
    notes: "64 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Jack Straw",
    showDate: "1988-07-02",
    showIdentifier: "gd88-07-02.sbd-matrix.dan.21211.sbeok.shnf",
    tier: 2,
    votes: 61,
    notes: "61 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Truckin",
    showDate: "1974-06-26",
    showIdentifier: "gd74-06-26.moore.weiner.gdADT17.16037.sbeok.shnf",
    tier: 2,
    votes: 76,
    notes: "76 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Truckin",
    showDate: "1973-06-22",
    showIdentifier: "gd73-06-22.sbd.cribbs.17270.sbeok.shnf",
    tier: 2,
    votes: 63,
    notes: "63 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Truckin",
    showDate: "1977-09-03",
    showIdentifier: "gd77-09-03.sbd.unk.276.sbefixed.shnf",
    tier: 2,
    votes: 57,
    notes: "57 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Truckin",
    showDate: "1973-05-26",
    showIdentifier: "gd73-05-26.sbd.cribbs.17076.sbeok.shnf",
    tier: 2,
    votes: 48,
    notes: "48 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Truckin",
    showDate: "1972-04-26",
    showIdentifier: "gd1972-04-26.sbd.vernon.9197.sbeok.shnf",
    tier: 2,
    votes: 44,
    notes: "44 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Truckin",
    showDate: "1974-06-20",
    showIdentifier: "gd74-06-20.sbd.clugston.2179.sbeok.shnf",
    tier: 2,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Truckin",
    showDate: "1974-07-31",
    showIdentifier: "gd74-07-31.sbd.ziggy.1019.sbeok.shnf",
    tier: 2,
    votes: 37,
    notes: "37 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Drums -&gt; Space",
    showDate: "1989-07-07",
    showIdentifier: "gd89-07-07.aud.wiley.7855.sbeok.shnf",
    tier: 2,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Drums -&gt; Space",
    showDate: "1993-09-13",
    showIdentifier: "gd93-09-13.sbd.miller-wiley.12096.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Drums -&gt; Space",
    showDate: "1989-10-26",
    showIdentifier: "gd89-10-26.set2.dsbd.miller.18664.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Drums -&gt; Space",
    showDate: "1978-04-24",
    showIdentifier: "gd78-04-24.sbd.mattman.20605.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Drums -&gt; Space",
    showDate: "1982-04-18",
    showIdentifier: "gd82-04-18.sbd.miller.18116.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Drums -&gt; Space",
    showDate: "1989-07-17",
    showIdentifier: "gd89-07-17.sbd.unknown.17702.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Drums -&gt; Space",
    showDate: "1991-09-10",
    showIdentifier: "gd91-09-10.sbd.sacks.511.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Not Fade Away",
    showDate: "1970-09-19",
    showIdentifier: "gd70-09-19.sbd.kaplan.5217.sbeok.shnf",
    tier: 2,
    votes: 71,
    notes: "71 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Not Fade Away",
    showDate: "1970-02-14",
    showIdentifier: "gd70-02-14.early-late.sbd.cotsman.18115.sbeok.shnf",
    tier: 2,
    votes: 68,
    notes: "68 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Not Fade Away",
    showDate: "1971-10-31",
    showIdentifier: "gd1971-10-31.sbd.miller.79011.sbeok.flac16",
    tier: 2,
    votes: 64,
    notes: "64 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Not Fade Away",
    showDate: "1978-01-22",
    showIdentifier: "gd78-01-22.sbd.popi.4974.sbeok.shnf",
    tier: 2,
    votes: 60,
    notes: "60 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Not Fade Away",
    showDate: "1989-07-04",
    showIdentifier: "gd89-07-04.aud.wiley.9045.sbeok.shnf",
    tier: 2,
    votes: 59,
    notes: "59 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Not Fade Away",
    showDate: "1974-09-10",
    showIdentifier: "gd74-09-10.sbd.samaritano.18806.sbeok.shnf",
    tier: 2,
    votes: 47,
    notes: "47 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Not Fade Away",
    showDate: "1970-06-24",
    showIdentifier: "gd_nrps70-06-24.aud.pcrp5.23062.sbeok.flacf",
    tier: 2,
    votes: 47,
    notes: "47 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Eyes Of The World",
    showDate: "1974-10-19",
    showIdentifier: "gd74-10-19.sbd.miller.21927.sbeok.shnf",
    tier: 2,
    votes: 231,
    notes: "231 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Eyes Of The World",
    showDate: "1974-06-18",
    showIdentifier: "gd74-06-18.sbd.sacks.209.sbefail.shnf",
    tier: 2,
    votes: 209,
    notes: "209 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Eyes Of The World",
    showDate: "1975-08-13",
    showIdentifier: "gd75-08-13.fm.vernon.23661.sbeok.shnf",
    tier: 2,
    votes: 164,
    notes: "164 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Eyes Of The World",
    showDate: "1973-11-11",
    showIdentifier: "gd73-11-11.sbd.schlissel.14105.sbeok.shnf",
    tier: 2,
    votes: 128,
    notes: "128 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Eyes Of The World",
    showDate: "1974-06-16",
    showIdentifier: "gd74-06-16.sbd.fink.17701.sbeok.shnf",
    tier: 2,
    votes: 126,
    notes: "126 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Eyes Of The World",
    showDate: "1973-02-09",
    showIdentifier: "gd73-02-09.sbd.allred.9888.sbeok.shnf",
    tier: 2,
    votes: 104,
    notes: "104 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Eyes Of The World",
    showDate: "1977-05-22",
    showIdentifier: "gd77-05-22.sbd.dp-leftovers.18803.sbefail.shnf",
    tier: 2,
    votes: 103,
    notes: "103 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Estimated Prophet",
    showDate: "1977-05-22",
    showIdentifier: "gd77-05-22.sbd.dp-leftovers.18803.sbefail.shnf",
    tier: 2,
    votes: 104,
    notes: "104 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Estimated Prophet",
    showDate: "1977-05-25",
    showIdentifier: "gd77-05-25.sbd.shannon.13399.sbefail.shnf",
    tier: 2,
    votes: 85,
    notes: "85 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Estimated Prophet",
    showDate: "1977-05-08",
    showIdentifier: "gd77-05-08.sbd.hicks.4982.sbeok.shnf",
    tier: 2,
    votes: 57,
    notes: "57 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Estimated Prophet",
    showDate: "1990-03-29",
    showIdentifier: "gd90-03-29.aud-fob.set2.unknown.1317.sbeok.shnf",
    tier: 2,
    votes: 55,
    notes: "55 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Estimated Prophet",
    showDate: "1977-05-28",
    showIdentifier: "gd77-05-28.sbd.sacks.4983.sbefail.shnf",
    tier: 2,
    votes: 55,
    notes: "55 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Estimated Prophet",
    showDate: "1977-06-09",
    showIdentifier: "gd1977-06-09.28614.sbeok.flac16",
    tier: 2,
    votes: 48,
    notes: "48 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Estimated Prophet",
    showDate: "1977-10-29",
    showIdentifier: "gd77-10-29.maizner.vernon.8035.sbeok.shnf",
    tier: 2,
    votes: 44,
    notes: "44 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wharf Rat",
    showDate: "1977-05-22",
    showIdentifier: "gd77-05-22.sbd.dp-leftovers.18803.sbefail.shnf",
    tier: 2,
    votes: 104,
    notes: "104 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wharf Rat",
    showDate: "1973-12-02",
    showIdentifier: "gd73-12-02.aud.vernon.17278.sbeok.shnf",
    tier: 2,
    votes: 91,
    notes: "91 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wharf Rat",
    showDate: "1972-04-24",
    showIdentifier: "gd72-04-24.sbd-aud.cotsman.16332.sbeok.shnf",
    tier: 2,
    votes: 78,
    notes: "78 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wharf Rat",
    showDate: "1971-04-26",
    showIdentifier: "gd71-04-26.sbd.murphy.4991.sbefail.shnf",
    tier: 2,
    votes: 65,
    notes: "65 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wharf Rat",
    showDate: "1977-05-07",
    showIdentifier: "gd77-05-07.sbd.eaton.wizard.26085.sbeok.shnf",
    tier: 2,
    votes: 64,
    notes: "64 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wharf Rat",
    showDate: "1978-04-22",
    showIdentifier: "gd1978-04-22.sonyECM250.walker-scotton.miller.92808.flac16",
    tier: 2,
    votes: 59,
    notes: "59 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wharf Rat",
    showDate: "1983-06-20",
    showIdentifier: "gd83-06-20.fob-senn.sws.11931.sbeok.shnf",
    tier: 2,
    votes: 55,
    notes: "55 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bertha",
    showDate: "1977-05-09",
    showIdentifier: "gd77-05-09.sbd.connor.8304.sbeok.shnf",
    tier: 2,
    votes: 75,
    notes: "75 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bertha",
    showDate: "1978-07-08",
    showIdentifier: "gd78-07-08.sbd.unknown.294.sbeok.shnf",
    tier: 2,
    votes: 74,
    notes: "74 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bertha",
    showDate: "1978-02-05",
    showIdentifier: "gd78-02-05.aud.set2.warner.19466.sbeok.shnf",
    tier: 2,
    votes: 66,
    notes: "66 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bertha",
    showDate: "1989-07-04",
    showIdentifier: "gd89-07-04.aud.wiley.9045.sbeok.shnf",
    tier: 2,
    votes: 58,
    notes: "58 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bertha",
    showDate: "1971-04-27",
    showIdentifier: "gd71-04-27.sbd.murphy.2221.sbeok.shnf",
    tier: 2,
    votes: 55,
    notes: "55 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bertha",
    showDate: "1977-09-03",
    showIdentifier: "gd77-09-03.sbd.unk.276.sbefixed.shnf",
    tier: 2,
    votes: 52,
    notes: "52 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bertha",
    showDate: "1977-10-29",
    showIdentifier: "gd77-10-29.maizner.vernon.8035.sbeok.shnf",
    tier: 2,
    votes: 51,
    notes: "51 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Me and My Uncle",
    showDate: "1972-08-27",
    showIdentifier: "gd72-08-27.sbd.braverman.16582.sbefail.shnf",
    tier: 2,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Me and My Uncle",
    showDate: "1977-11-06",
    showIdentifier: "gd77-11-06.sbd.nawrocki.283.sbeok.shnf",
    tier: 2,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Me and My Uncle",
    showDate: "1972-04-24",
    showIdentifier: "gd72-04-24.sbd-aud.cotsman.16332.sbeok.shnf",
    tier: 2,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Me and My Uncle",
    showDate: "1971-02-18",
    showIdentifier: "gd71-02-18.sbd.orf.107.sbeok.shnf",
    tier: 2,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Me and My Uncle",
    showDate: "1972-11-17",
    showIdentifier: "gd72-11-17.sbd.warner.15982.sbeok.shnf",
    tier: 2,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Me and My Uncle",
    showDate: "1973-11-21",
    showIdentifier: "gd73-11-21.sbd.barrick.192.sbeok.shnf",
    tier: 2,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Me and My Uncle",
    showDate: "1977-09-03",
    showIdentifier: "gd77-09-03.sbd.unk.276.sbefixed.shnf",
    tier: 2,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Deal",
    showDate: "1980-11-30",
    showIdentifier: "gd80-11-30.sbd-aud.sacks.2416.sbeok.shnf",
    tier: 2,
    votes: 63,
    notes: "63 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Deal",
    showDate: "1972-08-27",
    showIdentifier: "gd72-08-27.sbd.braverman.16582.sbefail.shnf",
    tier: 2,
    votes: 63,
    notes: "63 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Deal",
    showDate: "1981-05-01",
    showIdentifier: "gd81-05-01.wise.clugston.2218.sbeok.shnf",
    tier: 2,
    votes: 51,
    notes: "51 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Deal",
    showDate: "1977-02-26",
    showIdentifier: "gd77-02-26.sbd.alphadog.9752.sbeok.shnf",
    tier: 2,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Deal",
    showDate: "1989-06-21",
    showIdentifier: "gd89-06-21.sbd.gorinsky.4603.sbeok.shnf",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Deal",
    showDate: "1972-09-27",
    showIdentifier: "gd72-09-27.sbd.vernon.18106.sbeok.shnf",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Deal",
    showDate: "1983-10-17",
    showIdentifier: "gd83-10-17.sennheiser.skank-levy.347.sbeok.shnf",
    tier: 2,
    votes: 37,
    notes: "37 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Looks Like Rain",
    showDate: "1977-09-03",
    showIdentifier: "gd77-09-03.sbd.unk.276.sbefixed.shnf",
    tier: 2,
    votes: 52,
    notes: "52 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Looks Like Rain",
    showDate: "1972-04-14",
    showIdentifier: "gd72-04-14.sbd.hurwitt.8828.sbeok.shnf",
    tier: 2,
    votes: 50,
    notes: "50 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Looks Like Rain",
    showDate: "1978-02-03",
    showIdentifier: "gd78-02-03.aud.warner.19465.sbeok.shnf",
    tier: 2,
    votes: 46,
    notes: "46 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Looks Like Rain",
    showDate: "1985-10-31",
    showIdentifier: "gd85-10-31.oade.connor.8793.sbeok.shnf",
    tier: 2,
    votes: 39,
    notes: "39 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Looks Like Rain",
    showDate: "1977-05-13",
    showIdentifier: "gd77-05-13.sbd.miller.9393.sbeok.shnf",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Looks Like Rain",
    showDate: "1977-05-17",
    showIdentifier: "gd77-05-17.sbd.weiner.18554.sbeok.shnf",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Looks Like Rain",
    showDate: "1982-04-06",
    showIdentifier: "gd82-04-06.sbd-patched.wiley.16785.sbeok.shnf",
    tier: 2,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sugaree",
    showDate: "1983-10-17",
    showIdentifier: "gd83-10-17.sennheiser.skank-levy.347.sbeok.shnf",
    tier: 2,
    votes: 112,
    notes: "112 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sugaree",
    showDate: "1977-10-16",
    showIdentifier: "gd77-10-16.sbd.lai.3350.sbefail.shnf",
    tier: 2,
    votes: 89,
    notes: "89 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sugaree",
    showDate: "1977-05-05",
    showIdentifier: "gd77-05-05.sbd.stephens.8832.sbeok.shnf",
    tier: 2,
    votes: 86,
    notes: "86 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sugaree",
    showDate: "1980-06-21",
    showIdentifier: "gd80-06-21.sbd.clugston.8639.sbeok.shnf",
    tier: 2,
    votes: 72,
    notes: "72 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sugaree",
    showDate: "1979-12-28",
    showIdentifier: "gd79-12-28.sbd.lai.4145.sbefail.shnf",
    tier: 2,
    votes: 60,
    notes: "60 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sugaree",
    showDate: "1977-05-11",
    showIdentifier: "gd77-05-11.sbd.barbella.8374.sbeok.shnf",
    tier: 2,
    votes: 56,
    notes: "56 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sugaree",
    showDate: "1972-08-27",
    showIdentifier: "gd72-08-27.sbd.braverman.16582.sbefail.shnf",
    tier: 2,
    votes: 51,
    notes: "51 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Tennessee Jed",
    showDate: "1982-10-10",
    showIdentifier: "gd82-10-10.sbd.sacks.338.sbefail.shnf",
    tier: 2,
    votes: 51,
    notes: "51 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Tennessee Jed",
    showDate: "1977-02-26",
    showIdentifier: "gd77-02-26.sbd.alphadog.9752.sbeok.shnf",
    tier: 2,
    votes: 37,
    notes: "37 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Tennessee Jed",
    showDate: "1978-12-16",
    showIdentifier: "gd1978-12-16.sonyecm250-no-dolby.walker-scotton.miller.82212.sbeok.flac16",
    tier: 2,
    votes: 34,
    notes: "34 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Tennessee Jed",
    showDate: "1974-10-20",
    showIdentifier: "gd74-10-20.sbd.finney.229.sbeok.shnf",
    tier: 2,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Tennessee Jed",
    showDate: "1978-04-22",
    showIdentifier: "gd1978-04-22.sonyECM250.walker-scotton.miller.92808.flac16",
    tier: 2,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Tennessee Jed",
    showDate: "1972-04-24",
    showIdentifier: "gd72-04-24.sbd-aud.cotsman.16332.sbeok.shnf",
    tier: 2,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Tennessee Jed",
    showDate: "1977-11-06",
    showIdentifier: "gd77-11-06.sbd.nawrocki.283.sbeok.shnf",
    tier: 2,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Terrapin Station",
    showDate: "1990-03-24",
    showIdentifier: "gd90-03-24.schoeps.wiley.11806.sbeok.shnf",
    tier: 2,
    votes: 80,
    notes: "80 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Terrapin Station",
    showDate: "1977-09-03",
    showIdentifier: "gd77-09-03.sbd.unk.276.sbefixed.shnf",
    tier: 2,
    votes: 76,
    notes: "76 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Terrapin Station",
    showDate: "1977-05-07",
    showIdentifier: "gd77-05-07.sbd.eaton.wizard.26085.sbeok.shnf",
    tier: 2,
    votes: 72,
    notes: "72 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Terrapin Station",
    showDate: "1990-03-15",
    showIdentifier: "gd1990-03-15.28293.sbeok.shnf",
    tier: 2,
    votes: 62,
    notes: "62 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Terrapin Station",
    showDate: "1977-05-19",
    showIdentifier: "gd77-05-19.sbd.direwolf.3120.sbeok.shnf",
    tier: 2,
    votes: 62,
    notes: "62 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Terrapin Station",
    showDate: "1977-05-28",
    showIdentifier: "gd77-05-28.sbd.sacks.4983.sbefail.shnf",
    tier: 2,
    votes: 60,
    notes: "60 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Terrapin Station",
    showDate: "1977-03-18",
    showIdentifier: "gd77-03-18.sbd.unknown.254.sbeok.shnf",
    tier: 2,
    votes: 57,
    notes: "57 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Loser",
    showDate: "1977-12-29",
    showIdentifier: "gd1977-12-29.aud.92374.flac16",
    tier: 2,
    votes: 79,
    notes: "79 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Loser",
    showDate: "1989-07-07",
    showIdentifier: "gd89-07-07.aud.wiley.7855.sbeok.shnf",
    tier: 2,
    votes: 72,
    notes: "72 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Loser",
    showDate: "1977-05-19",
    showIdentifier: "gd77-05-19.sbd.direwolf.3120.sbeok.shnf",
    tier: 2,
    votes: 69,
    notes: "69 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Loser",
    showDate: "1972-04-14",
    showIdentifier: "gd72-04-14.sbd.hurwitt.8828.sbeok.shnf",
    tier: 2,
    votes: 52,
    notes: "52 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Loser",
    showDate: "1978-04-12",
    showIdentifier: "gd78-04-12.sbd.ashley-bertha.14085.sbeok.shnf",
    tier: 2,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Loser",
    showDate: "1977-06-09",
    showIdentifier: "gd1977-06-09.28614.sbeok.flac16",
    tier: 2,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Loser",
    showDate: "1980-11-30",
    showIdentifier: "gd80-11-30.sbd-aud.sacks.2416.sbeok.shnf",
    tier: 2,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bird Song",
    showDate: "1990-03-29",
    showIdentifier: "gd90-03-29.aud-fob.set2.unknown.1317.sbeok.shnf",
    tier: 2,
    votes: 143,
    notes: "143 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bird Song",
    showDate: "1972-09-27",
    showIdentifier: "gd72-09-27.sbd.vernon.18106.sbeok.shnf",
    tier: 2,
    votes: 99,
    notes: "99 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bird Song",
    showDate: "1972-09-17",
    showIdentifier: "gd1972-09-17.aud-wolfson.minches.28165.shnf",
    tier: 2,
    votes: 89,
    notes: "89 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bird Song",
    showDate: "1972-11-17",
    showIdentifier: "gd72-11-17.sbd.warner.15982.sbeok.shnf",
    tier: 2,
    votes: 79,
    notes: "79 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bird Song",
    showDate: "1973-07-27",
    showIdentifier: "gd73-07-27.sbd.weiner.180.sbeok.shnf",
    tier: 2,
    votes: 65,
    notes: "65 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bird Song",
    showDate: "1989-12-09",
    showIdentifier: "gd89-12-09.sbd.ladner.29754.sbeok.shnf",
    tier: 2,
    votes: 53,
    notes: "53 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bird Song",
    showDate: "1989-10-08",
    showIdentifier: "gd89-10-08.sbd.unknown.8365.sbeok.shnf",
    tier: 2,
    votes: 52,
    notes: "52 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Morning Dew",
    showDate: "1974-10-18",
    showIdentifier: "gd74-10-18.sbd.bertha-ashley.22796.sbeok.shnf",
    tier: 2,
    votes: 160,
    notes: "160 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Morning Dew",
    showDate: "1977-05-22",
    showIdentifier: "gd77-05-22.sbd.dp-leftovers.18803.sbefail.shnf",
    tier: 2,
    votes: 156,
    notes: "156 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Morning Dew",
    showDate: "1984-10-12",
    showIdentifier: "gd84-10-12-oade.sacks.8795.sbefail.shnf",
    tier: 2,
    votes: 101,
    notes: "101 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Morning Dew",
    showDate: "1974-06-18",
    showIdentifier: "gd74-06-18.sbd.sacks.209.sbefail.shnf",
    tier: 2,
    votes: 81,
    notes: "81 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Morning Dew",
    showDate: "1973-10-19",
    showIdentifier: "gd73-10-19.sbd.nayfield.187.sbeok.shnf",
    tier: 2,
    votes: 80,
    notes: "80 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Morning Dew",
    showDate: "1969-02-28",
    showIdentifier: "gd69-02-28.sbd.16track.kaplan.3397.sbeok.shnf",
    tier: 2,
    votes: 74,
    notes: "74 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Morning Dew",
    showDate: "1973-11-17",
    showIdentifier: "gd73-11-17.sbd.gardner.4749.sbeok.shnf",
    tier: 2,
    votes: 71,
    notes: "71 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brown Eyed Women",
    showDate: "1977-05-28",
    showIdentifier: "gd77-05-28.sbd.sacks.4983.sbefail.shnf",
    tier: 2,
    votes: 82,
    notes: "82 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brown Eyed Women",
    showDate: "1972-04-14",
    showIdentifier: "gd72-04-14.sbd.hurwitt.8828.sbeok.shnf",
    tier: 2,
    votes: 68,
    notes: "68 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brown Eyed Women",
    showDate: "1978-04-24",
    showIdentifier: "gd78-04-24.sbd.mattman.20605.sbeok.shnf",
    tier: 2,
    votes: 63,
    notes: "63 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brown Eyed Women",
    showDate: "1977-05-09",
    showIdentifier: "gd77-05-09.sbd.connor.8304.sbeok.shnf",
    tier: 2,
    votes: 50,
    notes: "50 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brown Eyed Women",
    showDate: "1991-06-17",
    showIdentifier: "gd91-06-17.sbd.gardner.3591.sbeok.shnf",
    tier: 2,
    votes: 39,
    notes: "39 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brown Eyed Women",
    showDate: "1977-05-26",
    showIdentifier: "gd77-05-26.sbd.sacks.3224.sbeok.shnf",
    tier: 2,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brown Eyed Women",
    showDate: "1977-03-20",
    showIdentifier: "gd77-03-20.sbd.kempa.257.sbefixed.shnf",
    tier: 2,
    votes: 33,
    notes: "33 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - He's Gone",
    showDate: "1973-05-26",
    showIdentifier: "gd73-05-26.sbd.cribbs.17076.sbeok.shnf",
    tier: 2,
    votes: 76,
    notes: "76 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - He's Gone",
    showDate: "1972-05-10",
    showIdentifier: "gd72-05-10.sbd.kaplan.1582.sbeok.shnf",
    tier: 2,
    votes: 57,
    notes: "57 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - He's Gone",
    showDate: "1973-12-02",
    showIdentifier: "gd73-12-02.aud.vernon.17278.sbeok.shnf",
    tier: 2,
    votes: 53,
    notes: "53 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - He's Gone",
    showDate: "1972-11-18",
    showIdentifier: "gd72-11-18.set2-sbd.cotsman.9002.sbeok.shnf",
    tier: 2,
    votes: 53,
    notes: "53 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - He's Gone",
    showDate: "1973-12-19",
    showIdentifier: "gd73-12-19.sbd.finney.outtakes.197.sbeok.shnf",
    tier: 2,
    votes: 51,
    notes: "51 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - He's Gone",
    showDate: "1972-11-17",
    showIdentifier: "gd72-11-17.sbd.warner.15982.sbeok.shnf",
    tier: 2,
    votes: 48,
    notes: "48 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - He's Gone",
    showDate: "1989-07-02",
    showIdentifier: "gd89-07-02.nak.8243.sbefail.shnf",
    tier: 2,
    votes: 44,
    notes: "44 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Uncle John's Band",
    showDate: "1977-05-19",
    showIdentifier: "gd77-05-19.sbd.direwolf.3120.sbeok.shnf",
    tier: 2,
    votes: 86,
    notes: "86 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Uncle John's Band",
    showDate: "1984-10-12",
    showIdentifier: "gd84-10-12-oade.sacks.8795.sbefail.shnf",
    tier: 2,
    votes: 64,
    notes: "64 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Uncle John's Band",
    showDate: "1973-11-17",
    showIdentifier: "gd73-11-17.sbd.gardner.4749.sbeok.shnf",
    tier: 2,
    votes: 56,
    notes: "56 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Uncle John's Band",
    showDate: "1972-09-27",
    showIdentifier: "gd72-09-27.sbd.vernon.18106.sbeok.shnf",
    tier: 2,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Uncle John's Band",
    showDate: "1971-04-27",
    showIdentifier: "gd71-04-27.sbd.murphy.2221.sbeok.shnf",
    tier: 2,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Uncle John's Band",
    showDate: "1974-08-06",
    showIdentifier: "gd74-08-06.merin.weiner.gdADT.5914.sbefail.shnf",
    tier: 2,
    votes: 37,
    notes: "37 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Uncle John's Band",
    showDate: "1972-05-25",
    showIdentifier: "gd72-05-25.psbd.hamilton.147.sbeok.shnf",
    tier: 2,
    votes: 34,
    notes: "34 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Scarlet Begonias -&gt; Fire On The Mountain",
    showDate: "1978-04-24",
    showIdentifier: "gd78-04-24.sbd.mattman.20605.sbeok.shnf",
    tier: 2,
    votes: 224,
    notes: "224 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Scarlet Begonias -&gt; Fire On The Mountain",
    showDate: "1989-07-07",
    showIdentifier: "gd89-07-07.aud.wiley.7855.sbeok.shnf",
    tier: 2,
    votes: 197,
    notes: "197 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Scarlet Begonias -&gt; Fire On The Mountain",
    showDate: "1980-11-30",
    showIdentifier: "gd80-11-30.sbd-aud.sacks.2416.sbeok.shnf",
    tier: 2,
    votes: 178,
    notes: "178 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Scarlet Begonias -&gt; Fire On The Mountain",
    showDate: "1977-05-25",
    showIdentifier: "gd77-05-25.sbd.shannon.13399.sbefail.shnf",
    tier: 2,
    votes: 175,
    notes: "175 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Scarlet Begonias -&gt; Fire On The Mountain",
    showDate: "1977-05-17",
    showIdentifier: "gd77-05-17.sbd.weiner.18554.sbeok.shnf",
    tier: 2,
    votes: 167,
    notes: "167 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Scarlet Begonias -&gt; Fire On The Mountain",
    showDate: "1983-10-14",
    showIdentifier: "gd83-10-14.beyer-ficca-brennan.ficca.20023.sbeok.shnf",
    tier: 2,
    votes: 147,
    notes: "147 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Scarlet Begonias -&gt; Fire On The Mountain",
    showDate: "1979-11-01",
    showIdentifier: "gd1979-11-01.sbd.miller.23445.shnf",
    tier: 2,
    votes: 141,
    notes: "141 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big River",
    showDate: "1974-06-16",
    showIdentifier: "gd74-06-16.sbd.fink.17701.sbeok.shnf",
    tier: 2,
    votes: 59,
    notes: "59 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big River",
    showDate: "1978-04-24",
    showIdentifier: "gd78-04-24.sbd.mattman.20605.sbeok.shnf",
    tier: 2,
    votes: 52,
    notes: "52 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big River",
    showDate: "1977-05-07",
    showIdentifier: "gd77-05-07.sbd.eaton.wizard.26085.sbeok.shnf",
    tier: 2,
    votes: 45,
    notes: "45 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big River",
    showDate: "1977-05-17",
    showIdentifier: "gd77-05-17.sbd.weiner.18554.sbeok.shnf",
    tier: 2,
    votes: 33,
    notes: "33 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big River",
    showDate: "1972-09-17",
    showIdentifier: "gd1972-09-17.aud-wolfson.minches.28165.shnf",
    tier: 2,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big River",
    showDate: "1973-11-11",
    showIdentifier: "gd73-11-11.sbd.schlissel.14105.sbeok.shnf",
    tier: 2,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big River",
    showDate: "1973-02-26",
    showIdentifier: "gd73-02-26.sbd.kaplan.1208.sbeok.shnf",
    tier: 2,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cassidy",
    showDate: "1989-10-19",
    showIdentifier: "gd89-10-19.dsbd.eD.7640.sbeok.shnf",
    tier: 2,
    votes: 44,
    notes: "44 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cassidy",
    showDate: "1983-10-12",
    showIdentifier: "gd83-10-12.sbd.harrell.8112.sbeok.shnf",
    tier: 2,
    votes: 37,
    notes: "37 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cassidy",
    showDate: "1976-10-09",
    showIdentifier: "gd76-10-09.set2-sbd.miller.12519.sbeok.shnf",
    tier: 2,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cassidy",
    showDate: "1976-06-14",
    showIdentifier: "gd76-06-14.sbd.hollister.22804.sbeok.shnf",
    tier: 2,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cassidy",
    showDate: "1977-11-04",
    showIdentifier: "gd77-11-04.sbd.unknown.2595.sbeok.shnf",
    tier: 2,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cassidy",
    showDate: "1978-04-16",
    showIdentifier: "gd78-04-16.sbd.lai.292.sbeok.shnf",
    tier: 2,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cassidy",
    showDate: "1977-05-21",
    showIdentifier: "gd77-05-21.sbd.boyle.271.sbeok.shnf",
    tier: 2,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Peter",
    showDate: "1972-05-24",
    showIdentifier: "gd72-05-24.jones.macdonald.5920.sbeok.shnf",
    tier: 2,
    votes: 43,
    notes: "43 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Peter",
    showDate: "1972-09-21",
    showIdentifier: "gd72-09-21.sbd.masse.7296.sbeok.shnf",
    tier: 2,
    votes: 42,
    notes: "42 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Peter",
    showDate: "1970-02-13",
    showIdentifier: "gd70-02-13.early-late.sbd.cotsman.18114.sbeok.shnf",
    tier: 2,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Peter",
    showDate: "1974-06-23",
    showIdentifier: "gd74-06-23.sbd.cribbs.16780.sbeok.shnf",
    tier: 2,
    votes: 37,
    notes: "37 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Peter",
    showDate: "1973-06-22",
    showIdentifier: "gd73-06-22.sbd.cribbs.17270.sbeok.shnf",
    tier: 2,
    votes: 34,
    notes: "34 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Peter",
    showDate: "1977-10-16",
    showIdentifier: "gd77-10-16.sbd.lai.3350.sbefail.shnf",
    tier: 2,
    votes: 34,
    notes: "34 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Peter",
    showDate: "1990-03-25",
    showIdentifier: "gd90-03-25.fob-schoeps-mattes.miller.28389.sbeok.shnf",
    tier: 2,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stella Blue",
    showDate: "1973-10-19",
    showIdentifier: "gd73-10-19.sbd.nayfield.187.sbeok.shnf",
    tier: 2,
    votes: 66,
    notes: "66 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stella Blue",
    showDate: "1977-11-04",
    showIdentifier: "gd77-11-04.sbd.unknown.2595.sbeok.shnf",
    tier: 2,
    votes: 58,
    notes: "58 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stella Blue",
    showDate: "1990-03-24",
    showIdentifier: "gd90-03-24.schoeps.wiley.11806.sbeok.shnf",
    tier: 2,
    votes: 52,
    notes: "52 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stella Blue",
    showDate: "1978-04-21",
    showIdentifier: "gd78-04-21.sbd.cotsman.10149.sbeok.shnf",
    tier: 2,
    votes: 47,
    notes: "47 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stella Blue",
    showDate: "1983-10-14",
    showIdentifier: "gd83-10-14.beyer-ficca-brennan.ficca.20023.sbeok.shnf",
    tier: 2,
    votes: 45,
    notes: "45 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stella Blue",
    showDate: "1976-07-18",
    showIdentifier: "gd76-07-18.sbd.ferguson.244.sbeok.shnf",
    tier: 2,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stella Blue",
    showDate: "1973-12-19",
    showIdentifier: "gd73-12-19.sbd.finney.outtakes.197.sbeok.shnf",
    tier: 2,
    votes: 37,
    notes: "37 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dark Star",
    showDate: "1971-02-18",
    showIdentifier: "gd71-02-18.sbd.orf.107.sbeok.shnf",
    tier: 2,
    votes: 262,
    notes: "262 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dark Star",
    showDate: "1971-10-31",
    showIdentifier: "gd1971-10-31.sbd.miller.79011.sbeok.flac16",
    tier: 2,
    votes: 248,
    notes: "248 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dark Star",
    showDate: "1973-11-11",
    showIdentifier: "gd73-11-11.sbd.schlissel.14105.sbeok.shnf",
    tier: 2,
    votes: 234,
    notes: "234 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dark Star",
    showDate: "1972-09-21",
    showIdentifier: "gd72-09-21.sbd.masse.7296.sbeok.shnf",
    tier: 2,
    votes: 230,
    notes: "230 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dark Star",
    showDate: "1972-04-08",
    showIdentifier: "gd72-04-08.sbd.giles-jeffm.2534.sbeok.shnf",
    tier: 2,
    votes: 221,
    notes: "221 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dark Star",
    showDate: "1970-09-19",
    showIdentifier: "gd70-09-19.sbd.kaplan.5217.sbeok.shnf",
    tier: 2,
    votes: 157,
    notes: "157 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dark Star",
    showDate: "1972-05-11",
    showIdentifier: "gd72-05-11.sbd.ashley-bertha.7364.sbefail.shnf",
    tier: 2,
    votes: 146,
    notes: "146 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Minglewood Blues",
    showDate: "1981-03-09",
    showIdentifier: "gd81-03-09.glassberg.wise.7473.sbeok.shnf",
    tier: 2,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Minglewood Blues",
    showDate: "1977-05-07",
    showIdentifier: "gd77-05-07.sbd.eaton.wizard.26085.sbeok.shnf",
    tier: 2,
    votes: 39,
    notes: "39 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Minglewood Blues",
    showDate: "1977-12-29",
    showIdentifier: "gd1977-12-29.aud.92374.flac16",
    tier: 2,
    votes: 37,
    notes: "37 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Minglewood Blues",
    showDate: "1978-04-16",
    showIdentifier: "gd78-04-16.sbd.lai.292.sbeok.shnf",
    tier: 2,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Minglewood Blues",
    showDate: "1970-05-15",
    showIdentifier: "gd70-05-15.early-late.sbd.97.sbeok.shnf",
    tier: 2,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Minglewood Blues",
    showDate: "1978-04-22",
    showIdentifier: "gd1978-04-22.sonyECM250.walker-scotton.miller.92808.flac16",
    tier: 2,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Minglewood Blues",
    showDate: "1977-10-29",
    showIdentifier: "gd77-10-29.maizner.vernon.8035.sbeok.shnf",
    tier: 2,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Good Loving",
    showDate: "1972-05-07",
    showIdentifier: "gd72-05-07.sbd-aud.clugston.9193.sbeok.shnf",
    tier: 2,
    votes: 39,
    notes: "39 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Good Loving",
    showDate: "1987-09-18",
    showIdentifier: "gd87-09-18.sbd.samaritano.20025.sbeok.shnf",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Good Loving",
    showDate: "1972-04-08",
    showIdentifier: "gd72-04-08.sbd.giles-jeffm.2534.sbeok.shnf",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Good Loving",
    showDate: "1972-04-14",
    showIdentifier: "gd72-04-14.sbd.hurwitt.8828.sbeok.shnf",
    tier: 2,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Good Loving",
    showDate: "1972-04-26",
    showIdentifier: "gd1972-04-26.sbd.vernon.9197.sbeok.shnf",
    tier: 2,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Good Loving",
    showDate: "1972-05-04",
    showIdentifier: "gd1972-05-04.sbd.miller.77294.sbeok.flac16",
    tier: 2,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Good Loving",
    showDate: "1976-12-31",
    showIdentifier: "gd76-12-31.preFM.warner.18524.20760.sbeok.shnf",
    tier: 2,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mexicali Blues",
    showDate: "1977-05-25",
    showIdentifier: "gd77-05-25.sbd.shannon.13399.sbefail.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mexicali Blues",
    showDate: "1989-07-19",
    showIdentifier: "gd89-07-19.sbd.437.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mexicali Blues",
    showDate: "1973-06-22",
    showIdentifier: "gd73-06-22.sbd.cribbs.17270.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mexicali Blues",
    showDate: "1972-05-24",
    showIdentifier: "gd72-05-24.jones.macdonald.5920.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mexicali Blues",
    showDate: "1972-05-11",
    showIdentifier: "gd72-05-11.sbd.ashley-bertha.7364.sbefail.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mexicali Blues",
    showDate: "1992-03-20",
    showIdentifier: "gd92-03-20.sbd.gardner.9757.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mexicali Blues",
    showDate: "1977-06-08",
    showIdentifier: "gd77-06-08.sbd.clugston.15421.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Samson and Delilah",
    showDate: "1977-05-22",
    showIdentifier: "gd77-05-22.sbd.dp-leftovers.18803.sbefail.shnf",
    tier: 2,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Samson and Delilah",
    showDate: "1985-06-30",
    showIdentifier: "gd85-06-30.sbd.georges.366.sbeok.shnf",
    tier: 2,
    votes: 32,
    notes: "32 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Samson and Delilah",
    showDate: "1985-06-24",
    showIdentifier: "gd85-06-24.sbd.miller.25315.sbeok.shnf",
    tier: 2,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Samson and Delilah",
    showDate: "1980-11-30",
    showIdentifier: "gd80-11-30.sbd-aud.sacks.2416.sbeok.shnf",
    tier: 2,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Samson and Delilah",
    showDate: "1977-06-09",
    showIdentifier: "gd1977-06-09.28614.sbeok.flac16",
    tier: 2,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Samson and Delilah",
    showDate: "1981-03-09",
    showIdentifier: "gd81-03-09.glassberg.wise.7473.sbeok.shnf",
    tier: 2,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Samson and Delilah",
    showDate: "1978-12-31",
    showIdentifier: "gd78-12-31.sbd.ashley.1667.sbeok.shnf",
    tier: 2,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Goin' Down The Road Feelin' Bad",
    showDate: "1974-05-19",
    showIdentifier: "gd74-05-19.sbd.clugston.6957.sbeok.shnf",
    tier: 2,
    votes: 46,
    notes: "46 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Goin' Down The Road Feelin' Bad",
    showDate: "1972-09-21",
    showIdentifier: "gd72-09-21.sbd.masse.7296.sbeok.shnf",
    tier: 2,
    votes: 43,
    notes: "43 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Goin' Down The Road Feelin' Bad",
    showDate: "1974-05-14",
    showIdentifier: "gd74-05-14.sbd.murphy.1823.sbeok.shnf",
    tier: 2,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Goin' Down The Road Feelin' Bad",
    showDate: "1972-05-07",
    showIdentifier: "gd72-05-07.sbd-aud.clugston.9193.sbeok.shnf",
    tier: 2,
    votes: 34,
    notes: "34 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Goin' Down The Road Feelin' Bad",
    showDate: "1989-07-17",
    showIdentifier: "gd89-07-17.sbd.unknown.17702.sbeok.shnf",
    tier: 2,
    votes: 32,
    notes: "32 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Goin' Down The Road Feelin' Bad",
    showDate: "1971-04-29",
    showIdentifier: "gd71-04-29.sbd.frisco.16782.sbeok.shnf",
    tier: 2,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Goin' Down The Road Feelin' Bad",
    showDate: "1977-05-26",
    showIdentifier: "gd77-05-26.sbd.sacks.3224.sbeok.shnf",
    tier: 2,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Promised Land",
    showDate: "1978-04-24",
    showIdentifier: "gd78-04-24.sbd.mattman.20605.sbeok.shnf",
    tier: 2,
    votes: 35,
    notes: "35 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Promised Land",
    showDate: "1979-12-26",
    showIdentifier: "gd1979-12-26.sonyECM250.walker-scotton.miller.89187.sbeok.flac16",
    tier: 2,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Promised Land",
    showDate: "1974-02-23",
    showIdentifier: "gd74-02-23.sbd.bertha-ashley.26362.sbeok.shnf",
    tier: 2,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Promised Land",
    showDate: "1977-05-19",
    showIdentifier: "gd77-05-19.sbd.direwolf.3120.sbeok.shnf",
    tier: 2,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Promised Land",
    showDate: "1989-10-08",
    showIdentifier: "gd89-10-08.sbd.unknown.8365.sbeok.shnf",
    tier: 2,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Promised Land",
    showDate: "1990-07-19",
    showIdentifier: "gd90-07-19.dsbd.garcia420.2177.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Promised Land",
    showDate: "1973-11-11",
    showIdentifier: "gd73-11-11.sbd.schlissel.14105.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ramble On Rose",
    showDate: "1973-11-11",
    showIdentifier: "gd73-11-11.sbd.schlissel.14105.sbeok.shnf",
    tier: 2,
    votes: 58,
    notes: "58 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ramble On Rose",
    showDate: "1972-05-25",
    showIdentifier: "gd72-05-25.psbd.hamilton.147.sbeok.shnf",
    tier: 2,
    votes: 51,
    notes: "51 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ramble On Rose",
    showDate: "1980-11-30",
    showIdentifier: "gd80-11-30.sbd-aud.sacks.2416.sbeok.shnf",
    tier: 2,
    votes: 46,
    notes: "46 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ramble On Rose",
    showDate: "1977-05-19",
    showIdentifier: "gd77-05-19.sbd.direwolf.3120.sbeok.shnf",
    tier: 2,
    votes: 42,
    notes: "42 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ramble On Rose",
    showDate: "1972-05-26",
    showIdentifier: "gd72-05-26.sbd.hollister.12758.sbeok.shnf",
    tier: 2,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ramble On Rose",
    showDate: "1976-10-10",
    showIdentifier: "gd76-10-10.sbd.clugston.3381.sbeok.shnf",
    tier: 2,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ramble On Rose",
    showDate: "1972-09-21",
    showIdentifier: "gd72-09-21.sbd.masse.7296.sbeok.shnf",
    tier: 2,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let It Grow",
    showDate: "1978-05-14",
    showIdentifier: "gd78-05-14.sony.vernon.7639.sbeok.shnf",
    tier: 2,
    votes: 55,
    notes: "55 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let It Grow",
    showDate: "1990-03-14",
    showIdentifier: "gd90-03-14.sbd.ladner.8466.sbeok.shnf",
    tier: 2,
    votes: 53,
    notes: "53 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let It Grow",
    showDate: "1974-06-18",
    showIdentifier: "gd74-06-18.sbd.sacks.209.sbefail.shnf",
    tier: 2,
    votes: 44,
    notes: "44 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let It Grow",
    showDate: "1982-08-07",
    showIdentifier: "gd82-08-07.sbd-streeter-wise.unknown.7689.sbeok.shnf",
    tier: 2,
    votes: 43,
    notes: "43 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let It Grow",
    showDate: "1989-07-07",
    showIdentifier: "gd89-07-07.aud.wiley.7855.sbeok.shnf",
    tier: 2,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let It Grow",
    showDate: "1978-04-15",
    showIdentifier: "gd78-04-15.sbd.cotsman.7047.sbefail.shnf",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let It Grow",
    showDate: "1984-04-20",
    showIdentifier: "gd84-04-20.senn.fishman.7854.sbeok.shnf",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Friend of the Devil",
    showDate: "1980-10-27",
    showIdentifier: "gd80-10-27.senn441.lai.324.sbefail.shnf",
    tier: 2,
    votes: 47,
    notes: "47 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Friend of the Devil",
    showDate: "1970-09-20",
    showIdentifier: "gd70-09-20.aud.remaster.sirmick.27583.sbeok.shnf",
    tier: 2,
    votes: 45,
    notes: "45 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Friend of the Devil",
    showDate: "1977-09-03",
    showIdentifier: "gd77-09-03.sbd.unk.276.sbefixed.shnf",
    tier: 2,
    votes: 45,
    notes: "45 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Friend of the Devil",
    showDate: "1978-12-31",
    showIdentifier: "gd78-12-31.sbd.ashley.1667.sbeok.shnf",
    tier: 2,
    votes: 44,
    notes: "44 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Friend of the Devil",
    showDate: "1972-09-27",
    showIdentifier: "gd72-09-27.sbd.vernon.18106.sbeok.shnf",
    tier: 2,
    votes: 42,
    notes: "42 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Friend of the Devil",
    showDate: "1978-04-24",
    showIdentifier: "gd78-04-24.sbd.mattman.20605.sbeok.shnf",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Friend of the Devil",
    showDate: "1970-05-15",
    showIdentifier: "gd70-05-15.early-late.sbd.97.sbeok.shnf",
    tier: 2,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Row Jimmy",
    showDate: "1977-05-19",
    showIdentifier: "gd77-05-19.sbd.direwolf.3120.sbeok.shnf",
    tier: 2,
    votes: 54,
    notes: "54 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Row Jimmy",
    showDate: "1977-05-28",
    showIdentifier: "gd77-05-28.sbd.sacks.4983.sbefail.shnf",
    tier: 2,
    votes: 51,
    notes: "51 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Row Jimmy",
    showDate: "1973-11-17",
    showIdentifier: "gd73-11-17.sbd.gardner.4749.sbeok.shnf",
    tier: 2,
    votes: 47,
    notes: "47 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Row Jimmy",
    showDate: "1973-02-28",
    showIdentifier: "gd73-02-28.sbd.weiner.15386.sbeok.shnf",
    tier: 2,
    votes: 45,
    notes: "45 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Row Jimmy",
    showDate: "1976-06-14",
    showIdentifier: "gd76-06-14.sbd.hollister.22804.sbeok.shnf",
    tier: 2,
    votes: 44,
    notes: "44 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Row Jimmy",
    showDate: "1978-01-22",
    showIdentifier: "gd78-01-22.sbd.popi.4974.sbeok.shnf",
    tier: 2,
    votes: 43,
    notes: "43 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Row Jimmy",
    showDate: "1990-03-26",
    showIdentifier: "gd90-03-26.sbd.gorinsky.8508.sbeok.shnf",
    tier: 2,
    votes: 37,
    notes: "37 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - El Paso",
    showDate: "1973-05-26",
    showIdentifier: "gd73-05-26.sbd.cribbs.17076.sbeok.shnf",
    tier: 2,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - El Paso",
    showDate: "1978-07-08",
    showIdentifier: "gd78-07-08.sbd.unknown.294.sbeok.shnf",
    tier: 2,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - El Paso",
    showDate: "1974-06-23",
    showIdentifier: "gd74-06-23.sbd.cribbs.16780.sbeok.shnf",
    tier: 2,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - El Paso",
    showDate: "1973-02-09",
    showIdentifier: "gd73-02-09.sbd.allred.9888.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - El Paso",
    showDate: "1977-05-08",
    showIdentifier: "gd77-05-08.sbd.hicks.4982.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - El Paso",
    showDate: "1977-05-17",
    showIdentifier: "gd77-05-17.sbd.weiner.18554.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - El Paso",
    showDate: "1971-11-15",
    showIdentifier: "gd71-11-15.sbd.cotsman.12438.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Althea",
    showDate: "1989-07-19",
    showIdentifier: "gd89-07-19.sbd.437.sbeok.shnf",
    tier: 2,
    votes: 64,
    notes: "64 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Althea",
    showDate: "1981-03-28",
    showIdentifier: "gd81-03-28.fm.hanno.3306.sbefail.shnf",
    tier: 2,
    votes: 59,
    notes: "59 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Althea",
    showDate: "1990-07-19",
    showIdentifier: "gd90-07-19.dsbd.garcia420.2177.sbeok.shnf",
    tier: 2,
    votes: 47,
    notes: "47 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Althea",
    showDate: "1981-05-01",
    showIdentifier: "gd81-05-01.wise.clugston.2218.sbeok.shnf",
    tier: 2,
    votes: 43,
    notes: "43 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Althea",
    showDate: "1983-10-14",
    showIdentifier: "gd83-10-14.beyer-ficca-brennan.ficca.20023.sbeok.shnf",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Althea",
    showDate: "1981-03-09",
    showIdentifier: "gd81-03-09.glassberg.wise.7473.sbeok.shnf",
    tier: 2,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Althea",
    showDate: "1994-10-01",
    showIdentifier: "gd94-10-01.sbd.ashley-bertha.14869.sbeok.shnf",
    tier: 2,
    votes: 34,
    notes: "34 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Turn On Your Love Light",
    showDate: "1970-02-13",
    showIdentifier: "gd70-02-13.early-late.sbd.cotsman.18114.sbeok.shnf",
    tier: 2,
    votes: 53,
    notes: "53 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Turn On Your Love Light",
    showDate: "1970-09-19",
    showIdentifier: "gd70-09-19.sbd.kaplan.5217.sbeok.shnf",
    tier: 2,
    votes: 50,
    notes: "50 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Turn On Your Love Light",
    showDate: "1972-05-07",
    showIdentifier: "gd72-05-07.sbd-aud.clugston.9193.sbeok.shnf",
    tier: 2,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Turn On Your Love Light",
    showDate: "1969-01-26",
    showIdentifier: "gd69-01-26.sbd.kaplan.2246.sbeok.shnf",
    tier: 2,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Turn On Your Love Light",
    showDate: "1989-07-07",
    showIdentifier: "gd89-07-07.aud.wiley.7855.sbeok.shnf",
    tier: 2,
    votes: 34,
    notes: "34 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Turn On Your Love Light",
    showDate: "1971-04-27",
    showIdentifier: "gd71-04-27.sbd.murphy.2221.sbeok.shnf",
    tier: 2,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Turn On Your Love Light",
    showDate: "1990-03-29",
    showIdentifier: "gd90-03-29.aud-fob.set2.unknown.1317.sbeok.shnf",
    tier: 2,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Casey Jones",
    showDate: "1972-08-27",
    showIdentifier: "gd72-08-27.sbd.braverman.16582.sbefail.shnf",
    tier: 2,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Casey Jones",
    showDate: "1971-04-27",
    showIdentifier: "gd71-04-27.sbd.murphy.2221.sbeok.shnf",
    tier: 2,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Casey Jones",
    showDate: "1972-04-08",
    showIdentifier: "gd72-04-08.sbd.giles-jeffm.2534.sbeok.shnf",
    tier: 2,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Casey Jones",
    showDate: "1972-04-24",
    showIdentifier: "gd72-04-24.sbd-aud.cotsman.16332.sbeok.shnf",
    tier: 2,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Casey Jones",
    showDate: "1992-06-20",
    showIdentifier: "gd92-06-20.dsbd.gardner.2207.sbefail.shnf",
    tier: 2,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Casey Jones",
    showDate: "1977-10-28",
    showIdentifier: "gd77-10-28.sbd.munder.8520.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Casey Jones",
    showDate: "1973-05-26",
    showIdentifier: "gd73-05-26.sbd.cribbs.17076.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Candyman",
    showDate: "1980-10-29",
    showIdentifier: "gd80-10-29.wise.larson.1953.sbeok.shnf",
    tier: 2,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Candyman",
    showDate: "1986-12-15",
    showIdentifier: "gd86-12-15.nakcm101-dwonk.25263.sbeok.flacf",
    tier: 2,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Candyman",
    showDate: "1982-04-06",
    showIdentifier: "gd82-04-06.sbd-patched.wiley.16785.sbeok.shnf",
    tier: 2,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Candyman",
    showDate: "1977-11-05",
    showIdentifier: "gd77-11-05.sbd.clugston.6934.sbeok.shnf",
    tier: 2,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Candyman",
    showDate: "1987-10-03",
    showIdentifier: "gd87-10-03.sbd.bertha-ashley.7368.sbeok.shnf",
    tier: 2,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Candyman",
    showDate: "1977-06-07",
    showIdentifier: "gd77-06-07.sbd.hollister-bode.24291.sbeok.shnf",
    tier: 2,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Candyman",
    showDate: "1980-11-29",
    showIdentifier: "gd80-11-29.wise.sacks.2409.sbeok.shnf",
    tier: 2,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mississippi Halfstep Uptown Toodeloo",
    showDate: "1977-11-05",
    showIdentifier: "gd77-11-05.sbd.clugston.6934.sbeok.shnf",
    tier: 2,
    votes: 91,
    notes: "91 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mississippi Halfstep Uptown Toodeloo",
    showDate: "1977-05-25",
    showIdentifier: "gd77-05-25.sbd.shannon.13399.sbefail.shnf",
    tier: 2,
    votes: 79,
    notes: "79 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mississippi Halfstep Uptown Toodeloo",
    showDate: "1977-05-17",
    showIdentifier: "gd77-05-17.sbd.weiner.18554.sbeok.shnf",
    tier: 2,
    votes: 77,
    notes: "77 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mississippi Halfstep Uptown Toodeloo",
    showDate: "1978-04-15",
    showIdentifier: "gd78-04-15.sbd.cotsman.7047.sbefail.shnf",
    tier: 2,
    votes: 65,
    notes: "65 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mississippi Halfstep Uptown Toodeloo",
    showDate: "1977-04-30",
    showIdentifier: "gd77-04-30.moore.minches.17952.sbeok.shnf",
    tier: 2,
    votes: 62,
    notes: "62 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mississippi Halfstep Uptown Toodeloo",
    showDate: "1973-12-02",
    showIdentifier: "gd73-12-02.aud.vernon.17278.sbeok.shnf",
    tier: 2,
    votes: 55,
    notes: "55 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mississippi Halfstep Uptown Toodeloo",
    showDate: "1977-06-09",
    showIdentifier: "gd1977-06-09.28614.sbeok.flac16",
    tier: 2,
    votes: 51,
    notes: "51 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Pretty Peggy O",
    showDate: "1977-05-09",
    showIdentifier: "gd77-05-09.sbd.connor.8304.sbeok.shnf",
    tier: 2,
    votes: 86,
    notes: "86 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Pretty Peggy O",
    showDate: "1977-05-19",
    showIdentifier: "gd77-05-19.sbd.direwolf.3120.sbeok.shnf",
    tier: 2,
    votes: 67,
    notes: "67 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Pretty Peggy O",
    showDate: "1977-04-30",
    showIdentifier: "gd77-04-30.moore.minches.17952.sbeok.shnf",
    tier: 2,
    votes: 62,
    notes: "62 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Pretty Peggy O",
    showDate: "1977-05-07",
    showIdentifier: "gd77-05-07.sbd.eaton.wizard.26085.sbeok.shnf",
    tier: 2,
    votes: 51,
    notes: "51 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Pretty Peggy O",
    showDate: "1977-05-25",
    showIdentifier: "gd77-05-25.sbd.shannon.13399.sbefail.shnf",
    tier: 2,
    votes: 50,
    notes: "50 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Pretty Peggy O",
    showDate: "1978-04-12",
    showIdentifier: "gd78-04-12.sbd.ashley-bertha.14085.sbeok.shnf",
    tier: 2,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Pretty Peggy O",
    showDate: "1977-05-22",
    showIdentifier: "gd77-05-22.sbd.dp-leftovers.18803.sbefail.shnf",
    tier: 2,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Music Never Stopped",
    showDate: "1977-05-22",
    showIdentifier: "gd77-05-22.sbd.dp-leftovers.18803.sbefail.shnf",
    tier: 2,
    votes: 78,
    notes: "78 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Music Never Stopped",
    showDate: "1977-06-09",
    showIdentifier: "gd1977-06-09.28614.sbeok.flac16",
    tier: 2,
    votes: 77,
    notes: "77 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Music Never Stopped",
    showDate: "1977-05-07",
    showIdentifier: "gd77-05-07.sbd.eaton.wizard.26085.sbeok.shnf",
    tier: 2,
    votes: 69,
    notes: "69 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Music Never Stopped",
    showDate: "1977-11-06",
    showIdentifier: "gd77-11-06.sbd.nawrocki.283.sbeok.shnf",
    tier: 2,
    votes: 64,
    notes: "64 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Music Never Stopped",
    showDate: "1977-10-01",
    showIdentifier: "gd77-10-01.sbd.unknown.277.sbeok.shnf",
    tier: 2,
    votes: 58,
    notes: "58 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Music Never Stopped",
    showDate: "1977-09-03",
    showIdentifier: "gd77-09-03.sbd.unk.276.sbefixed.shnf",
    tier: 2,
    votes: 58,
    notes: "58 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Music Never Stopped",
    showDate: "1977-10-16",
    showIdentifier: "gd77-10-16.sbd.lai.3350.sbefail.shnf",
    tier: 2,
    votes: 55,
    notes: "55 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Beat it on Down The Line",
    showDate: "1970-05-02",
    showIdentifier: "gd1970-05-02.sbd.remaster.dp8outtake.100007.sbeok.flac16",
    tier: 2,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Beat it on Down The Line",
    showDate: "1972-04-24",
    showIdentifier: "gd72-04-24.sbd-aud.cotsman.16332.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Beat it on Down The Line",
    showDate: "1971-04-26",
    showIdentifier: "gd71-04-26.sbd.murphy.4991.sbefail.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Beat it on Down The Line",
    showDate: "1972-05-03",
    showIdentifier: "gd72-05-03.sbd.masse.142.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Beat it on Down The Line",
    showDate: "1973-11-30",
    showIdentifier: "gd73-11-30.aud.vernon.17277.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Beat it on Down The Line",
    showDate: "1972-05-11",
    showIdentifier: "gd72-05-11.sbd.ashley-bertha.7364.sbefail.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Beat it on Down The Line",
    showDate: "1974-05-19",
    showIdentifier: "gd74-05-19.sbd.clugston.6957.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cumberland Blues",
    showDate: "1970-05-02",
    showIdentifier: "gd1970-05-02.sbd.remaster.dp8outtake.100007.sbeok.flac16",
    tier: 2,
    votes: 67,
    notes: "67 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cumberland Blues",
    showDate: "1972-11-17",
    showIdentifier: "gd72-11-17.sbd.warner.15982.sbeok.shnf",
    tier: 2,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cumberland Blues",
    showDate: "1973-11-14",
    showIdentifier: "gd73-11-14.sbd.vernon.5612.sbeok.shnf",
    tier: 2,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cumberland Blues",
    showDate: "1974-02-24",
    showIdentifier: "gd74-02-24.sbd.windsor.199.sbefail.shnf",
    tier: 2,
    votes: 34,
    notes: "34 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cumberland Blues",
    showDate: "1973-03-28",
    showIdentifier: "gd1973-03-28.beyer.backstrom.miller.74682.sbeok.flac16",
    tier: 2,
    votes: 34,
    notes: "34 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cumberland Blues",
    showDate: "1974-06-23",
    showIdentifier: "gd74-06-23.sbd.cribbs.16780.sbeok.shnf",
    tier: 2,
    votes: 33,
    notes: "33 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cumberland Blues",
    showDate: "1989-07-17",
    showIdentifier: "gd89-07-17.sbd.unknown.17702.sbeok.shnf",
    tier: 2,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Around and Around",
    showDate: "1978-02-05",
    showIdentifier: "gd78-02-05.aud.set2.warner.19466.sbeok.shnf",
    tier: 2,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Around and Around",
    showDate: "1974-06-16",
    showIdentifier: "gd74-06-16.sbd.fink.17701.sbeok.shnf",
    tier: 2,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Around and Around",
    showDate: "1977-02-26",
    showIdentifier: "gd77-02-26.sbd.alphadog.9752.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Around and Around",
    showDate: "1975-08-13",
    showIdentifier: "gd75-08-13.fm.vernon.23661.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Around and Around",
    showDate: "1977-05-25",
    showIdentifier: "gd77-05-25.sbd.shannon.13399.sbefail.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Around and Around",
    showDate: "1978-12-31",
    showIdentifier: "gd78-12-31.sbd.ashley.1667.sbeok.shnf",
    tier: 2,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Around and Around",
    showDate: "1977-10-01",
    showIdentifier: "gd77-10-01.sbd.unknown.277.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - They Love Each Other",
    showDate: "1973-02-26",
    showIdentifier: "gd73-02-26.sbd.kaplan.1208.sbeok.shnf",
    tier: 2,
    votes: 58,
    notes: "58 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - They Love Each Other",
    showDate: "1975-09-28",
    showIdentifier: "gd75-09-28.sbd.fink.9392.sbeok.shnf",
    tier: 2,
    votes: 45,
    notes: "45 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - They Love Each Other",
    showDate: "1973-10-19",
    showIdentifier: "gd73-10-19.sbd.nayfield.187.sbeok.shnf",
    tier: 2,
    votes: 44,
    notes: "44 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - They Love Each Other",
    showDate: "1977-09-03",
    showIdentifier: "gd77-09-03.sbd.unk.276.sbefixed.shnf",
    tier: 2,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - They Love Each Other",
    showDate: "1977-06-09",
    showIdentifier: "gd1977-06-09.28614.sbeok.flac16",
    tier: 2,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - They Love Each Other",
    showDate: "1973-02-28",
    showIdentifier: "gd73-02-28.sbd.weiner.15386.sbeok.shnf",
    tier: 2,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - They Love Each Other",
    showDate: "1973-03-28",
    showIdentifier: "gd1973-03-28.beyer.backstrom.miller.74682.sbeok.flac16",
    tier: 2,
    votes: 34,
    notes: "34 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - One More Saturday Night",
    showDate: "1972-08-27",
    showIdentifier: "gd72-08-27.sbd.braverman.16582.sbefail.shnf",
    tier: 2,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - One More Saturday Night",
    showDate: "1972-04-07",
    showIdentifier: "gd72-04-07.aud.hanno.6161.sbeok.shnf",
    tier: 2,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - One More Saturday Night",
    showDate: "1972-05-26",
    showIdentifier: "gd72-05-26.sbd.hollister.12758.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - One More Saturday Night",
    showDate: "1971-12-10",
    showIdentifier: "gd71-12-10.sbd.yerys.1311.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - One More Saturday Night",
    showDate: "1974-10-19",
    showIdentifier: "gd74-10-19.sbd.miller.21927.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - One More Saturday Night",
    showDate: "1972-05-04",
    showIdentifier: "gd1972-05-04.sbd.miller.77294.sbeok.flac16",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - One More Saturday Night",
    showDate: "1972-04-24",
    showIdentifier: "gd72-04-24.sbd-aud.cotsman.16332.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cold Rain and Snow",
    showDate: "1971-04-29",
    showIdentifier: "gd71-04-29.sbd.frisco.16782.sbeok.shnf",
    tier: 2,
    votes: 51,
    notes: "51 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cold Rain and Snow",
    showDate: "1972-05-24",
    showIdentifier: "gd72-05-24.jones.macdonald.5920.sbeok.shnf",
    tier: 2,
    votes: 50,
    notes: "50 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cold Rain and Snow",
    showDate: "1984-10-12",
    showIdentifier: "gd84-10-12-oade.sacks.8795.sbefail.shnf",
    tier: 2,
    votes: 48,
    notes: "48 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cold Rain and Snow",
    showDate: "1989-07-04",
    showIdentifier: "gd89-07-04.aud.wiley.9045.sbeok.shnf",
    tier: 2,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cold Rain and Snow",
    showDate: "1984-04-20",
    showIdentifier: "gd84-04-20.senn.fishman.7854.sbeok.shnf",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cold Rain and Snow",
    showDate: "1983-10-12",
    showIdentifier: "gd83-10-12.sbd.harrell.8112.sbeok.shnf",
    tier: 2,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cold Rain and Snow",
    showDate: "1976-06-14",
    showIdentifier: "gd76-06-14.sbd.hollister.22804.sbeok.shnf",
    tier: 2,
    votes: 33,
    notes: "33 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Greatest Story Ever Told",
    showDate: "1972-05-03",
    showIdentifier: "gd72-05-03.sbd.masse.142.sbeok.shnf",
    tier: 2,
    votes: 59,
    notes: "59 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Greatest Story Ever Told",
    showDate: "1974-05-19",
    showIdentifier: "gd74-05-19.sbd.clugston.6957.sbeok.shnf",
    tier: 2,
    votes: 56,
    notes: "56 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Greatest Story Ever Told",
    showDate: "1972-04-07",
    showIdentifier: "gd72-04-07.aud.hanno.6161.sbeok.shnf",
    tier: 2,
    votes: 37,
    notes: "37 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Greatest Story Ever Told",
    showDate: "1973-02-26",
    showIdentifier: "gd73-02-26.sbd.kaplan.1208.sbeok.shnf",
    tier: 2,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Greatest Story Ever Told",
    showDate: "1974-06-16",
    showIdentifier: "gd74-06-16.sbd.fink.17701.sbeok.shnf",
    tier: 2,
    votes: 35,
    notes: "35 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Greatest Story Ever Told",
    showDate: "1972-09-27",
    showIdentifier: "gd72-09-27.sbd.vernon.18106.sbeok.shnf",
    tier: 2,
    votes: 35,
    notes: "35 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Greatest Story Ever Told",
    showDate: "1972-04-26",
    showIdentifier: "gd1972-04-26.sbd.vernon.9197.sbeok.shnf",
    tier: 2,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feel Like A Stranger",
    showDate: "1981-03-09",
    showIdentifier: "gd81-03-09.glassberg.wise.7473.sbeok.shnf",
    tier: 2,
    votes: 50,
    notes: "50 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feel Like A Stranger",
    showDate: "1989-07-17",
    showIdentifier: "gd89-07-17.sbd.unknown.17702.sbeok.shnf",
    tier: 2,
    votes: 45,
    notes: "45 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feel Like A Stranger",
    showDate: "1990-03-22",
    showIdentifier: "gd90-03-22.sbd.bertha-ashley.21433.sbeok.shnf",
    tier: 2,
    votes: 44,
    notes: "44 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feel Like A Stranger",
    showDate: "1984-04-20",
    showIdentifier: "gd84-04-20.senn.fishman.7854.sbeok.shnf",
    tier: 2,
    votes: 44,
    notes: "44 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feel Like A Stranger",
    showDate: "1981-05-01",
    showIdentifier: "gd81-05-01.wise.clugston.2218.sbeok.shnf",
    tier: 2,
    votes: 43,
    notes: "43 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feel Like A Stranger",
    showDate: "1982-08-10",
    showIdentifier: "gd82-08-10.sbd.miller.12453.sbeok.shnf",
    tier: 2,
    votes: 42,
    notes: "42 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feel Like A Stranger",
    showDate: "1980-05-16",
    showIdentifier: "gd80-05-16.sbd.clugston.7472.sbeok.shnf",
    tier: 2,
    votes: 39,
    notes: "39 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dire Wolf",
    showDate: "1978-01-22",
    showIdentifier: "gd78-01-22.sbd.popi.4974.sbeok.shnf",
    tier: 2,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dire Wolf",
    showDate: "1973-11-30",
    showIdentifier: "gd73-11-30.aud.vernon.17277.sbeok.shnf",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dire Wolf",
    showDate: "1977-11-05",
    showIdentifier: "gd77-11-05.sbd.clugston.6934.sbeok.shnf",
    tier: 2,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dire Wolf",
    showDate: "1969-06-27",
    showIdentifier: "gd69-06-27.sbd.samaritano.20547.sbeok.shnf",
    tier: 2,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dire Wolf",
    showDate: "1970-02-14",
    showIdentifier: "gd70-02-14.early-late.sbd.cotsman.18115.sbeok.shnf",
    tier: 2,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dire Wolf",
    showDate: "1977-11-06",
    showIdentifier: "gd77-11-06.sbd.nawrocki.283.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dire Wolf",
    showDate: "1991-09-25",
    showIdentifier: "gd91-09-25.nak.dodd.16667.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Drums",
    showDate: "1980-11-30",
    showIdentifier: "gd80-11-30.sbd-aud.sacks.2416.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Drums",
    showDate: "1972-05-04",
    showIdentifier: "gd1972-05-04.sbd.miller.77294.sbeok.flac16",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Drums",
    showDate: "1978-04-21",
    showIdentifier: "gd78-04-21.sbd.cotsman.10149.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Drums",
    showDate: "1984-10-12",
    showIdentifier: "gd84-10-12-oade.sacks.8795.sbefail.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Drums",
    showDate: "1977-05-17",
    showIdentifier: "gd77-05-17.sbd.weiner.18554.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Drums",
    showDate: "1970-04-15",
    showIdentifier: "gd70-04-15.sbd.kaplan.14354.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Drums",
    showDate: "1972-05-11",
    showIdentifier: "gd72-05-11.sbd.ashley-bertha.7364.sbefail.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brokedown Palace",
    showDate: "1977-06-08",
    showIdentifier: "gd77-06-08.sbd.clugston.15421.sbeok.shnf",
    tier: 2,
    votes: 56,
    notes: "56 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brokedown Palace",
    showDate: "1971-12-07",
    showIdentifier: "gd71-12-07.sbd.miller.3375.sbeok.shnf",
    tier: 2,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brokedown Palace",
    showDate: "1971-08-06",
    showIdentifier: "gd71-08-06.aud.bertrando.yerys.129.sbeok.shnf",
    tier: 2,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brokedown Palace",
    showDate: "1972-11-17",
    showIdentifier: "gd72-11-17.sbd.warner.15982.sbeok.shnf",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brokedown Palace",
    showDate: "1972-05-25",
    showIdentifier: "gd72-05-25.psbd.hamilton.147.sbeok.shnf",
    tier: 2,
    votes: 37,
    notes: "37 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brokedown Palace",
    showDate: "1977-05-11",
    showIdentifier: "gd77-05-11.sbd.barbella.8374.sbeok.shnf",
    tier: 2,
    votes: 35,
    notes: "35 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brokedown Palace",
    showDate: "1993-05-16",
    showIdentifier: "gd93-05-16.sbd.herman.11934.sbeok.shnf",
    tier: 2,
    votes: 32,
    notes: "32 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Space",
    showDate: "1974-09-11",
    showIdentifier: "gd74-09-11.sbd.powell.12183.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Space",
    showDate: "1993-03-11",
    showIdentifier: "gd93-03-11.sbd.wharfrat.10383.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Space",
    showDate: "1973-04-02",
    showIdentifier: "gd73-04-02.sbd.miller.17346.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Space",
    showDate: "1985-06-30",
    showIdentifier: "gd85-06-30.sbd.georges.366.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Space",
    showDate: "1978-07-08",
    showIdentifier: "gd78-07-08.sbd.unknown.294.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Space",
    showDate: "1973-06-22",
    showIdentifier: "gd73-06-22.sbd.cribbs.17270.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Space",
    showDate: "1977-05-11",
    showIdentifier: "gd77-05-11.sbd.barbella.8374.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Shakedown Street",
    showDate: "1984-12-31",
    showIdentifier: "gd84-12-31.sbd.gorinsky.6395.sbeok.shnf",
    tier: 2,
    votes: 71,
    notes: "71 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Shakedown Street",
    showDate: "1979-01-15",
    showIdentifier: "gd79-01-15.rolfe.wise-cohen.310.sbeok.shnf",
    tier: 2,
    votes: 70,
    notes: "70 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Shakedown Street",
    showDate: "1978-09-16",
    showIdentifier: "gd78-09-16.sbd.orf.2319.sbeok.shnf",
    tier: 2,
    votes: 56,
    notes: "56 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Shakedown Street",
    showDate: "1979-12-26",
    showIdentifier: "gd1979-12-26.sonyECM250.walker-scotton.miller.89187.sbeok.flac16",
    tier: 2,
    votes: 52,
    notes: "52 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Shakedown Street",
    showDate: "1991-09-10",
    showIdentifier: "gd91-09-10.sbd.sacks.511.sbeok.shnf",
    tier: 2,
    votes: 48,
    notes: "48 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Shakedown Street",
    showDate: "1983-04-26",
    showIdentifier: "gd83-04-26.sbd.parrillo.2606.sbeok.shnf",
    tier: 2,
    votes: 48,
    notes: "48 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Shakedown Street",
    showDate: "1978-11-24",
    showIdentifier: "gd78-11-24.sbd.prefm.13948.sbefail.shnf",
    tier: 2,
    votes: 45,
    notes: "45 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Johnny B. Goode",
    showDate: "1978-12-31",
    showIdentifier: "gd78-12-31.sbd.ashley.1667.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Johnny B. Goode",
    showDate: "1984-04-20",
    showIdentifier: "gd84-04-20.senn.fishman.7854.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Johnny B. Goode",
    showDate: "1977-11-04",
    showIdentifier: "gd77-11-04.sbd.unknown.2595.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Johnny B. Goode",
    showDate: "1978-02-03",
    showIdentifier: "gd78-02-03.aud.warner.19465.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Johnny B. Goode",
    showDate: "1972-11-17",
    showIdentifier: "gd72-11-17.sbd.warner.15982.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Johnny B. Goode",
    showDate: "1979-12-26",
    showIdentifier: "gd1979-12-26.sonyECM250.walker-scotton.miller.89187.sbeok.flac16",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Johnny B. Goode",
    showDate: "1975-03-23",
    showIdentifier: "gd1975-03-23.fm.lee-smith.94026.sbeok.flac16",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Box of Rain",
    showDate: "1970-09-17",
    showIdentifier: "gd70-09-17.aud.warner.16090.sbeok.shnf",
    tier: 2,
    votes: 44,
    notes: "44 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Box of Rain",
    showDate: "1972-11-17",
    showIdentifier: "gd72-11-17.sbd.warner.15982.sbeok.shnf",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Box of Rain",
    showDate: "1986-03-20",
    showIdentifier: "gd86-03-20.sbd-matrix.munder.8098.sbeok.shnf",
    tier: 2,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Box of Rain",
    showDate: "1995-07-09",
    showIdentifier: "gd95-07-09.sbd.7233.sbeok.shnf",
    tier: 2,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Box of Rain",
    showDate: "1973-05-26",
    showIdentifier: "gd73-05-26.sbd.cribbs.17076.sbeok.shnf",
    tier: 2,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Box of Rain",
    showDate: "1973-06-22",
    showIdentifier: "gd73-06-22.sbd.cribbs.17270.sbeok.shnf",
    tier: 2,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Box of Rain",
    showDate: "1973-03-28",
    showIdentifier: "gd1973-03-28.beyer.backstrom.miller.74682.sbeok.flac16",
    tier: 2,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ship of Fools",
    showDate: "1974-06-28",
    showIdentifier: "gd74-06-28.moore.weiner.gdADT18.16038.sbeok.shnf",
    tier: 2,
    votes: 39,
    notes: "39 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ship of Fools",
    showDate: "1974-09-18",
    showIdentifier: "gd74-09-18.sbd.miller.20732.sbeok.shnf",
    tier: 2,
    votes: 37,
    notes: "37 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ship of Fools",
    showDate: "1989-07-04",
    showIdentifier: "gd89-07-04.aud.wiley.9045.sbeok.shnf",
    tier: 2,
    votes: 34,
    notes: "34 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ship of Fools",
    showDate: "1974-02-24",
    showIdentifier: "gd74-02-24.sbd.windsor.199.sbefail.shnf",
    tier: 2,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ship of Fools",
    showDate: "1980-11-30",
    showIdentifier: "gd80-11-30.sbd-aud.sacks.2416.sbeok.shnf",
    tier: 2,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ship of Fools",
    showDate: "1976-06-09",
    showIdentifier: "gd76-06-09.set2-sbd.gardner.5426.sbeok.shnf",
    tier: 2,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ship of Fools",
    showDate: "1974-05-19",
    showIdentifier: "gd74-05-19.sbd.clugston.6957.sbeok.shnf",
    tier: 2,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Throwing Stones",
    showDate: "1991-06-20",
    showIdentifier: "gd91-06-20.aud.ladner.2187.sbeok.shnf",
    tier: 2,
    votes: 34,
    notes: "34 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Throwing Stones",
    showDate: "1987-07-26",
    showIdentifier: "gd1987-07-26.nak700.yamaguchi-poris.russjcan.98214.flac16",
    tier: 2,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Throwing Stones",
    showDate: "1989-07-18",
    showIdentifier: "gd89-07-18.sbd.9854.sbeok.shnf",
    tier: 2,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Throwing Stones",
    showDate: "1983-10-11",
    showIdentifier: "gd83-10-11.sbd.harrell.7339.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Throwing Stones",
    showDate: "1990-07-08",
    showIdentifier: "gd90-07-08.sbd.brame.16157.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Throwing Stones",
    showDate: "1990-09-20",
    showIdentifier: "gd90-09-20.sbd.ashley.14855.sbeok.shnf",
    tier: 2,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Throwing Stones",
    showDate: "1989-06-19",
    showIdentifier: "gd1989-06-19.sbd.walker-scotton.miller.83673.sbeok.flac16",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - U.S. Blues (Wave That Flag)",
    showDate: "1974-10-19",
    showIdentifier: "gd74-10-19.sbd.miller.21927.sbeok.shnf",
    tier: 2,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - U.S. Blues (Wave That Flag)",
    showDate: "1974-02-24",
    showIdentifier: "gd74-02-24.sbd.windsor.199.sbefail.shnf",
    tier: 2,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - U.S. Blues (Wave That Flag)",
    showDate: "1974-07-27",
    showIdentifier: "gd74-07-27.sbd.kaplan.2420.sbeok.shnf",
    tier: 2,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - U.S. Blues (Wave That Flag)",
    showDate: "1989-07-04",
    showIdentifier: "gd89-07-04.aud.wiley.9045.sbeok.shnf",
    tier: 2,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - U.S. Blues (Wave That Flag)",
    showDate: "1974-06-26",
    showIdentifier: "gd74-06-26.moore.weiner.gdADT17.16037.sbeok.shnf",
    tier: 2,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - U.S. Blues (Wave That Flag)",
    showDate: "1975-08-13",
    showIdentifier: "gd75-08-13.fm.vernon.23661.sbeok.shnf",
    tier: 2,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - U.S. Blues (Wave That Flag)",
    showDate: "1973-03-28",
    showIdentifier: "gd1973-03-28.beyer.backstrom.miller.74682.sbeok.flac16",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Throated Wind",
    showDate: "1972-09-21",
    showIdentifier: "gd72-09-21.sbd.masse.7296.sbeok.shnf",
    tier: 2,
    votes: 46,
    notes: "46 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Throated Wind",
    showDate: "1974-03-23",
    showIdentifier: "gd1974-03-23.sbd.clugston-orf.1995.sbeok.shnf",
    tier: 2,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Throated Wind",
    showDate: "1972-11-17",
    showIdentifier: "gd72-11-17.sbd.warner.15982.sbeok.shnf",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Throated Wind",
    showDate: "1972-04-08",
    showIdentifier: "gd72-04-08.sbd.giles-jeffm.2534.sbeok.shnf",
    tier: 2,
    votes: 37,
    notes: "37 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Throated Wind",
    showDate: "1972-04-26",
    showIdentifier: "gd1972-04-26.sbd.vernon.9197.sbeok.shnf",
    tier: 2,
    votes: 32,
    notes: "32 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Throated Wind",
    showDate: "1972-04-24",
    showIdentifier: "gd72-04-24.sbd-aud.cotsman.16332.sbeok.shnf",
    tier: 2,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Throated Wind",
    showDate: "1973-11-11",
    showIdentifier: "gd73-11-11.sbd.schlissel.14105.sbeok.shnf",
    tier: 2,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - St. Stephen",
    showDate: "1976-06-09",
    showIdentifier: "gd76-06-09.set2-sbd.gardner.5426.sbeok.shnf",
    tier: 2,
    votes: 55,
    notes: "55 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - St. Stephen",
    showDate: "1977-10-29",
    showIdentifier: "gd77-10-29.maizner.vernon.8035.sbeok.shnf",
    tier: 2,
    votes: 54,
    notes: "54 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - St. Stephen",
    showDate: "1970-06-24",
    showIdentifier: "gd_nrps70-06-24.aud.pcrp5.23062.sbeok.flacf",
    tier: 2,
    votes: 49,
    notes: "49 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - St. Stephen",
    showDate: "1970-09-19",
    showIdentifier: "gd70-09-19.sbd.kaplan.5217.sbeok.shnf",
    tier: 2,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - St. Stephen",
    showDate: "1976-10-09",
    showIdentifier: "gd76-10-09.set2-sbd.miller.12519.sbeok.shnf",
    tier: 2,
    votes: 39,
    notes: "39 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - St. Stephen",
    showDate: "1977-12-30",
    showIdentifier: "gd77-12-30.sbd.dp-leftovers.20009.sbeok.shnf",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Franklin's Tower",
    showDate: "1977-05-09",
    showIdentifier: "gd77-05-09.sbd.connor.8304.sbeok.shnf",
    tier: 2,
    votes: 44,
    notes: "44 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Franklin's Tower",
    showDate: "1975-08-13",
    showIdentifier: "gd75-08-13.fm.vernon.23661.sbeok.shnf",
    tier: 2,
    votes: 44,
    notes: "44 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Franklin's Tower",
    showDate: "1979-10-27",
    showIdentifier: "gd79-10-27.sbd.clugston.13980.sbeok.shnf",
    tier: 2,
    votes: 43,
    notes: "43 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Franklin's Tower",
    showDate: "1980-05-15",
    showIdentifier: "gd80-05-15.aud.schlissel.12790.sbeok.shnf",
    tier: 2,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Franklin's Tower",
    showDate: "1978-07-08",
    showIdentifier: "gd78-07-08.sbd.unknown.294.sbeok.shnf",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Franklin's Tower",
    showDate: "1977-03-19",
    showIdentifier: "gd77-03-19.sbd.chinacat.255.sbeok.shnf",
    tier: 2,
    votes: 33,
    notes: "33 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Franklin's Tower",
    showDate: "1979-11-09",
    showIdentifier: "gd79-11-09.sbd.stern.318.sbeok.shnf",
    tier: 2,
    votes: 32,
    notes: "32 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Touch of Grey",
    showDate: "1990-03-16",
    showIdentifier: "gd90-03-16.sbd.willy.5227.sbeok.shnf",
    tier: 2,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Touch of Grey",
    showDate: "1989-07-18",
    showIdentifier: "gd89-07-18.sbd.9854.sbeok.shnf",
    tier: 2,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Touch of Grey",
    showDate: "1982-10-10",
    showIdentifier: "gd82-10-10.sbd.sacks.338.sbefail.shnf",
    tier: 2,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Touch of Grey",
    showDate: "1982-09-21",
    showIdentifier: "gd82-09-21.sbd.perkins.13306.sbeok.shnf",
    tier: 2,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Touch of Grey",
    showDate: "1990-09-20",
    showIdentifier: "gd90-09-20.sbd.ashley.14855.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Touch of Grey",
    showDate: "1989-07-12",
    showIdentifier: "gd89-07-12.aud-fob.gardner.2554.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Touch of Grey",
    showDate: "1984-07-13",
    showIdentifier: "gd84-07-13.sbd.ferguson.353.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Wheel",
    showDate: "1977-05-19",
    showIdentifier: "gd77-05-19.sbd.direwolf.3120.sbeok.shnf",
    tier: 2,
    votes: 65,
    notes: "65 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Wheel",
    showDate: "1976-06-29",
    showIdentifier: "gd76-06-29.sbd.parrillo.1812.sbeok.shnf",
    tier: 2,
    votes: 45,
    notes: "45 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Wheel",
    showDate: "1977-10-07",
    showIdentifier: "gd77-10-07.pset2-sbd.kiefe-fiske.1191.sbefixed.shnf",
    tier: 2,
    votes: 44,
    notes: "44 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Wheel",
    showDate: "1981-12-05",
    showIdentifier: "gd81-12-05.sbd.clugston.5488.sbeok.shnf",
    tier: 2,
    votes: 43,
    notes: "43 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Wheel",
    showDate: "1980-11-30",
    showIdentifier: "gd80-11-30.sbd-aud.sacks.2416.sbeok.shnf",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Wheel",
    showDate: "1982-08-07",
    showIdentifier: "gd82-08-07.sbd-streeter-wise.unknown.7689.sbeok.shnf",
    tier: 2,
    votes: 34,
    notes: "34 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Wheel",
    showDate: "1981-08-28",
    showIdentifier: "gd81-08-28.sbd-patched.painoman.9572.sbeok.shnf",
    tier: 2,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Railroad Blues",
    showDate: "1972-04-08",
    showIdentifier: "gd72-04-08.sbd.giles-jeffm.2534.sbeok.shnf",
    tier: 2,
    votes: 32,
    notes: "32 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Railroad Blues",
    showDate: "1983-10-15",
    showIdentifier: "gd83-10-15.beyer-ficca-brennan.ficca.20024.sbeok.shnf",
    tier: 2,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Railroad Blues",
    showDate: "1972-04-26",
    showIdentifier: "gd1972-04-26.sbd.vernon.9197.sbeok.shnf",
    tier: 2,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Railroad Blues",
    showDate: "1972-09-21",
    showIdentifier: "gd72-09-21.sbd.masse.7296.sbeok.shnf",
    tier: 2,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Railroad Blues",
    showDate: "1991-06-06",
    showIdentifier: "gd91-06-06.dsbd.chastewk.478.sbeok.shnf",
    tier: 2,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Railroad Blues",
    showDate: "1973-12-19",
    showIdentifier: "gd73-12-19.sbd.finney.outtakes.197.sbeok.shnf",
    tier: 2,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Railroad Blues",
    showDate: "1973-11-21",
    showIdentifier: "gd73-11-21.sbd.barrick.192.sbeok.shnf",
    tier: 2,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Aiko Aiko",
    showDate: "1982-09-14",
    showIdentifier: "gd82-09-14.beyer-sbd.miller.20906.sbeok.shnf",
    tier: 2,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Aiko Aiko",
    showDate: "1991-06-20",
    showIdentifier: "gd91-06-20.aud.ladner.2187.sbeok.shnf",
    tier: 2,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Aiko Aiko",
    showDate: "1987-07-06",
    showIdentifier: "gd87-07-06.aud.gardner.3829.sbeok.shnf",
    tier: 2,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Aiko Aiko",
    showDate: "1987-03-23",
    showIdentifier: "gd87-03-23.schoeps.weber-small.dnk.3870.sbefail.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Aiko Aiko",
    showDate: "1990-09-16",
    showIdentifier: "gd90-09-16.schoeps-fob.sacks.9435.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Aiko Aiko",
    showDate: "1977-05-15",
    showIdentifier: "gd1977-05-15.28916.sbeok.flac16",
    tier: 2,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Aiko Aiko",
    showDate: "1985-06-24",
    showIdentifier: "gd85-06-24.sbd.miller.25315.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dancin' in the Streets",
    showDate: "1979-10-27",
    showIdentifier: "gd79-10-27.sbd.clugston.13980.sbeok.shnf",
    tier: 2,
    votes: 68,
    notes: "68 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dancin' in the Streets",
    showDate: "1978-05-11",
    showIdentifier: "gd78-05-11.aud.vernon.6317.sbeok.shnf",
    tier: 2,
    votes: 66,
    notes: "66 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dancin' in the Streets",
    showDate: "1977-02-26",
    showIdentifier: "gd77-02-26.sbd.alphadog.9752.sbeok.shnf",
    tier: 2,
    votes: 55,
    notes: "55 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dancin' in the Streets",
    showDate: "1977-05-19",
    showIdentifier: "gd77-05-19.sbd.direwolf.3120.sbeok.shnf",
    tier: 2,
    votes: 52,
    notes: "52 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dancin' in the Streets",
    showDate: "1977-05-15",
    showIdentifier: "gd1977-05-15.28916.sbeok.flac16",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dancin' in the Streets",
    showDate: "1976-10-10",
    showIdentifier: "gd76-10-10.sbd.clugston.3381.sbeok.shnf",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dancin' in the Streets",
    showDate: "1970-05-06",
    showIdentifier: "gd70-05-06.sbd.gans.94.sbefail.shnf",
    tier: 2,
    votes: 35,
    notes: "35 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lost Sailor -&gt; Saint of Circumstance",
    showDate: "1979-10-27",
    showIdentifier: "gd79-10-27.sbd.clugston.13980.sbeok.shnf",
    tier: 2,
    votes: 37,
    notes: "37 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lost Sailor -&gt; Saint of Circumstance",
    showDate: "1980-11-30",
    showIdentifier: "gd80-11-30.sbd-aud.sacks.2416.sbeok.shnf",
    tier: 2,
    votes: 33,
    notes: "33 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lost Sailor -&gt; Saint of Circumstance",
    showDate: "1980-05-16",
    showIdentifier: "gd80-05-16.sbd.clugston.7472.sbeok.shnf",
    tier: 2,
    votes: 33,
    notes: "33 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lost Sailor -&gt; Saint of Circumstance",
    showDate: "1985-06-15",
    showIdentifier: "gd85-06-15.sbd.griesman.5682.sbeok.shnf",
    tier: 2,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lost Sailor -&gt; Saint of Circumstance",
    showDate: "1982-04-17",
    showIdentifier: "gd82-04-17.sbd.bertha-ashley.23933.sbeok.shnf",
    tier: 2,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lost Sailor -&gt; Saint of Circumstance",
    showDate: "1981-05-06",
    showIdentifier: "gd81-05-06.glassberg.vernon.17697.sbeok.shnf",
    tier: 2,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lost Sailor -&gt; Saint of Circumstance",
    showDate: "1981-12-05",
    showIdentifier: "gd81-12-05.sbd.clugston.5488.sbeok.shnf",
    tier: 2,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mama Tried",
    showDate: "1978-04-12",
    showIdentifier: "gd78-04-12.sbd.ashley-bertha.14085.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mama Tried",
    showDate: "1978-04-16",
    showIdentifier: "gd78-04-16.sbd.lai.292.sbeok.shnf",
    tier: 2,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mama Tried",
    showDate: "1977-05-26",
    showIdentifier: "gd77-05-26.sbd.sacks.3224.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mama Tried",
    showDate: "1976-06-14",
    showIdentifier: "gd76-06-14.sbd.hollister.22804.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mama Tried",
    showDate: "1970-02-13",
    showIdentifier: "gd70-02-13.early-late.sbd.cotsman.18114.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mama Tried",
    showDate: "1976-10-10",
    showIdentifier: "gd76-10-10.sbd.clugston.3381.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mama Tried",
    showDate: "1971-04-26",
    showIdentifier: "gd71-04-26.sbd.murphy.4991.sbefail.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It Must Have Been The Roses",
    showDate: "1980-11-30",
    showIdentifier: "gd80-11-30.sbd-aud.sacks.2416.sbeok.shnf",
    tier: 2,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It Must Have Been The Roses",
    showDate: "1984-10-12",
    showIdentifier: "gd84-10-12-oade.sacks.8795.sbefail.shnf",
    tier: 2,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It Must Have Been The Roses",
    showDate: "1974-05-14",
    showIdentifier: "gd74-05-14.sbd.murphy.1823.sbeok.shnf",
    tier: 2,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It Must Have Been The Roses",
    showDate: "1978-04-24",
    showIdentifier: "gd78-04-24.sbd.mattman.20605.sbeok.shnf",
    tier: 2,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It Must Have Been The Roses",
    showDate: "1980-10-26",
    showIdentifier: "gd80-10-26.sbd.hinko.18862.sbeok.shnf",
    tier: 2,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It Must Have Been The Roses",
    showDate: "1978-04-22",
    showIdentifier: "gd1978-04-22.sonyECM250.walker-scotton.miller.92808.flac16",
    tier: 2,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It Must Have Been The Roses",
    showDate: "1977-11-04",
    showIdentifier: "gd77-11-04.sbd.unknown.2595.sbeok.shnf",
    tier: 2,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Little Red Rooster",
    showDate: "1989-10-09",
    showIdentifier: "gd89-10-09.sbd.serafin.7721.sbeok.shnf",
    tier: 2,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Little Red Rooster",
    showDate: "1981-05-01",
    showIdentifier: "gd81-05-01.wise.clugston.2218.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Little Red Rooster",
    showDate: "1981-12-09",
    showIdentifier: "gd81-12-09.sbd.clugston.13061.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Little Red Rooster",
    showDate: "1980-11-28",
    showIdentifier: "gd80-11-28.sbd.vernon.20049.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Little Red Rooster",
    showDate: "1981-05-06",
    showIdentifier: "gd81-05-06.glassberg.vernon.17697.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Little Red Rooster",
    showDate: "1985-11-01",
    showIdentifier: "gd85-11-01.oade.connor.9217.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Little Red Rooster",
    showDate: "1983-10-17",
    showIdentifier: "gd83-10-17.sennheiser.skank-levy.347.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hell in a Bucket",
    showDate: "1990-03-19",
    showIdentifier: "gd90-03-19.prefm-sbd.sacks.1526.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hell in a Bucket",
    showDate: "1987-09-18",
    showIdentifier: "gd87-09-18.sbd.samaritano.20025.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hell in a Bucket",
    showDate: "1985-06-27",
    showIdentifier: "gd85-06-27.sbd.miller.27863.sbeok.flacf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hell in a Bucket",
    showDate: "1989-07-19",
    showIdentifier: "gd89-07-19.sbd.437.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hell in a Bucket",
    showDate: "1989-07-13",
    showIdentifier: "gd89-07-13.schoeps.9046.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hell in a Bucket",
    showDate: "1983-10-14",
    showIdentifier: "gd83-10-14.beyer-ficca-brennan.ficca.20023.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hell in a Bucket",
    showDate: "1984-07-13",
    showIdentifier: "gd84-07-13.sbd.ferguson.353.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Don't Ease Me In",
    showDate: "1973-11-30",
    showIdentifier: "gd73-11-30.aud.vernon.17277.sbeok.shnf",
    tier: 2,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Don't Ease Me In",
    showDate: "1980-11-29",
    showIdentifier: "gd80-11-29.wise.sacks.2409.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Don't Ease Me In",
    showDate: "1972-11-17",
    showIdentifier: "gd72-11-17.sbd.warner.15982.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Don't Ease Me In",
    showDate: "1973-02-26",
    showIdentifier: "gd73-02-26.sbd.kaplan.1208.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Don't Ease Me In",
    showDate: "1973-11-09",
    showIdentifier: "gd73-11-09.sbd.kaplan.2657.sbefail.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Don't Ease Me In",
    showDate: "1972-10-17",
    showIdentifier: "gd72-10-17.sbd.sacks.2219.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Don't Ease Me In",
    showDate: "1970-03-24",
    showIdentifier: "gd70-03-24.sbd.miller.32054.sbeok.flacf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Doll",
    showDate: "1973-11-11",
    showIdentifier: "gd73-11-11.sbd.schlissel.14105.sbeok.shnf",
    tier: 2,
    votes: 48,
    notes: "48 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Doll",
    showDate: "1974-06-18",
    showIdentifier: "gd74-06-18.sbd.sacks.209.sbefail.shnf",
    tier: 2,
    votes: 43,
    notes: "43 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Doll",
    showDate: "1974-06-23",
    showIdentifier: "gd74-06-23.sbd.cribbs.16780.sbeok.shnf",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Doll",
    showDate: "1983-10-11",
    showIdentifier: "gd83-10-11.sbd.harrell.7339.sbeok.shnf",
    tier: 2,
    votes: 35,
    notes: "35 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Doll",
    showDate: "1974-05-21",
    showIdentifier: "gd74-05-21.sbd.belkin.2597.sbefail.shnf",
    tier: 2,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Doll",
    showDate: "1973-02-15",
    showIdentifier: "gd1973-02-15.sbd.hall.1580.shnf",
    tier: 2,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Doll",
    showDate: "1980-11-30",
    showIdentifier: "gd80-11-30.sbd-aud.sacks.2416.sbeok.shnf",
    tier: 2,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Help On The Way &gt; Slipknot &gt; Franklin's Tower",
    showDate: "1977-05-22",
    showIdentifier: "gd77-05-22.sbd.dp-leftovers.18803.sbefail.shnf",
    tier: 2,
    votes: 142,
    notes: "142 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Help On The Way &gt; Slipknot &gt; Franklin's Tower",
    showDate: "1977-02-26",
    showIdentifier: "gd77-02-26.sbd.alphadog.9752.sbeok.shnf",
    tier: 2,
    votes: 104,
    notes: "104 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Help On The Way &gt; Slipknot &gt; Franklin's Tower",
    showDate: "1976-10-09",
    showIdentifier: "gd76-10-09.set2-sbd.miller.12519.sbeok.shnf",
    tier: 2,
    votes: 89,
    notes: "89 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Help On The Way &gt; Slipknot &gt; Franklin's Tower",
    showDate: "1990-03-30",
    showIdentifier: "gd90-03-30.sbd.gorinsky.8511.sbeok.shnf",
    tier: 2,
    votes: 65,
    notes: "65 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Help On The Way &gt; Slipknot &gt; Franklin's Tower",
    showDate: "1976-06-14",
    showIdentifier: "gd76-06-14.sbd.hollister.22804.sbeok.shnf",
    tier: 2,
    votes: 56,
    notes: "56 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Help On The Way &gt; Slipknot &gt; Franklin's Tower",
    showDate: "1990-07-18",
    showIdentifier: "gd90-07-18.sbd.wilson.12760.sbeok.shnf",
    tier: 2,
    votes: 53,
    notes: "53 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Help On The Way &gt; Slipknot &gt; Franklin's Tower",
    showDate: "1977-10-11",
    showIdentifier: "gd77-10-11.sbd.cotsman.19290.sbeok.shnf",
    tier: 2,
    votes: 48,
    notes: "48 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Crazy Fingers",
    showDate: "1982-10-10",
    showIdentifier: "gd82-10-10.sbd.sacks.338.sbefail.shnf",
    tier: 2,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Crazy Fingers",
    showDate: "1976-07-13",
    showIdentifier: "gd76-07-13.sbd.ashley-bertha.9978.sbeok.shnf",
    tier: 2,
    votes: 37,
    notes: "37 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Crazy Fingers",
    showDate: "1975-06-17",
    showIdentifier: "gd1975-06-17.aud.unknown.87560.flac16",
    tier: 2,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Crazy Fingers",
    showDate: "1991-09-25",
    showIdentifier: "gd91-09-25.nak.dodd.16667.sbeok.shnf",
    tier: 2,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Crazy Fingers",
    showDate: "1976-06-03",
    showIdentifier: "gd76-06-03.sbd.bertha-ashley.20004.sbeok.shnf",
    tier: 2,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Crazy Fingers",
    showDate: "1976-06-22",
    showIdentifier: "gd76-06-22.aud.vernon.6680.sbeok.shnf",
    tier: 2,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Crazy Fingers",
    showDate: "1989-07-02",
    showIdentifier: "gd89-07-02.nak.8243.sbefail.shnf",
    tier: 2,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lazy Lightnin' -&gt; Supplication",
    showDate: "1977-05-08",
    showIdentifier: "gd77-05-08.sbd.hicks.4982.sbeok.shnf",
    tier: 2,
    votes: 43,
    notes: "43 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lazy Lightnin' -&gt; Supplication",
    showDate: "1978-05-11",
    showIdentifier: "gd78-05-11.aud.vernon.6317.sbeok.shnf",
    tier: 2,
    votes: 42,
    notes: "42 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lazy Lightnin' -&gt; Supplication",
    showDate: "1980-05-15",
    showIdentifier: "gd80-05-15.aud.schlissel.12790.sbeok.shnf",
    tier: 2,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lazy Lightnin' -&gt; Supplication",
    showDate: "1977-05-05",
    showIdentifier: "gd77-05-05.sbd.stephens.8832.sbeok.shnf",
    tier: 2,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lazy Lightnin' -&gt; Supplication",
    showDate: "1978-04-22",
    showIdentifier: "gd1978-04-22.sonyECM250.walker-scotton.miller.92808.flac16",
    tier: 2,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lazy Lightnin' -&gt; Supplication",
    showDate: "1977-06-08",
    showIdentifier: "gd77-06-08.sbd.clugston.15421.sbeok.shnf",
    tier: 2,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lazy Lightnin' -&gt; Supplication",
    showDate: "1978-04-12",
    showIdentifier: "gd78-04-12.sbd.ashley-bertha.14085.sbeok.shnf",
    tier: 2,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Need A Miracle",
    showDate: "1978-10-18",
    showIdentifier: "gd78-10-18.sbd.shakedown.298.sbeok.shnf",
    tier: 2,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Need A Miracle",
    showDate: "1987-09-12",
    showIdentifier: "gd87-09-12.sbd.unk.4702.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Need A Miracle",
    showDate: "1982-08-10",
    showIdentifier: "gd82-08-10.sbd.miller.12453.sbeok.shnf",
    tier: 2,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Need A Miracle",
    showDate: "1978-10-21",
    showIdentifier: "gd78-10-21.sbd.popi.6100.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Need A Miracle",
    showDate: "1983-10-11",
    showIdentifier: "gd83-10-11.sbd.harrell.7339.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Need A Miracle",
    showDate: "1979-01-11",
    showIdentifier: "gd79-01-11.gatto.kempka.308.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Need A Miracle",
    showDate: "1991-09-10",
    showIdentifier: "gd91-09-10.sbd.sacks.511.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - High Time",
    showDate: "1970-02-14",
    showIdentifier: "gd70-02-14.early-late.sbd.cotsman.18115.sbeok.shnf",
    tier: 2,
    votes: 32,
    notes: "32 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - High Time",
    showDate: "1976-06-09",
    showIdentifier: "gd76-06-09.set2-sbd.gardner.5426.sbeok.shnf",
    tier: 2,
    votes: 32,
    notes: "32 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - High Time",
    showDate: "1991-09-10",
    showIdentifier: "gd91-09-10.sbd.sacks.511.sbeok.shnf",
    tier: 2,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - High Time",
    showDate: "1977-05-26",
    showIdentifier: "gd77-05-26.sbd.sacks.3224.sbeok.shnf",
    tier: 2,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - High Time",
    showDate: "1976-06-19",
    showIdentifier: "gd76-06-19.prefm.unknown.12077.sbeok.shnf",
    tier: 2,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - High Time",
    showDate: "1981-05-06",
    showIdentifier: "gd81-05-06.glassberg.vernon.17697.sbeok.shnf",
    tier: 2,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - High Time",
    showDate: "1969-12-12",
    showIdentifier: "gd69-12-12.sbd.gerland.10988.sbeok.shnf",
    tier: 2,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cryptical Envelopment",
    showDate: "1969-02-22",
    showIdentifier: "gd69-02-22.sbd.owen.7860.sbeok.shnf",
    tier: 2,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cryptical Envelopment",
    showDate: "1969-03-02",
    showIdentifier: "gd69-03-02.sbd.16track.kaplan.3344.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cryptical Envelopment",
    showDate: "1968-10-12",
    showIdentifier: "gd68-10-12.sbd.eD.10909.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cryptical Envelopment",
    showDate: "1970-04-15",
    showIdentifier: "gd70-04-15.sbd.kaplan.14354.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cryptical Envelopment",
    showDate: "1968-08-23",
    showIdentifier: "gd68-08-23.sbd.sacks.52.sbefail.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cryptical Envelopment",
    showDate: "1969-02-27",
    showIdentifier: "gd69-02-27.sbd.16track.kaplan.6315.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It's All Over Now Baby Blue",
    showDate: "1982-08-10",
    showIdentifier: "gd82-08-10.sbd.miller.12453.sbeok.shnf",
    tier: 2,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It's All Over Now Baby Blue",
    showDate: "1994-10-13",
    showIdentifier: "gd94-10-13.sbd.wiley.7800.sbefail.shnf",
    tier: 2,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It's All Over Now Baby Blue",
    showDate: "1966-07-16",
    showIdentifier: "gd1966-07-16.sbd.miller.89555.sbeok.flac16",
    tier: 2,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It's All Over Now Baby Blue",
    showDate: "1970-11-08",
    showIdentifier: "gd1970-11-08.aud.weiner.28609.sbeok.shnf",
    tier: 2,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It's All Over Now Baby Blue",
    showDate: "1983-09-02",
    showIdentifier: "gd83-09-02.beyer_senn.unk.23854.sbefail.shnf",
    tier: 2,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It's All Over Now Baby Blue",
    showDate: "1981-12-03",
    showIdentifier: "gd81-12-03.nak300.munder.6143.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It's All Over Now Baby Blue",
    showDate: "1972-09-26",
    showIdentifier: "gd72-09-26.sbd.unknown.156.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hard to Handle",
    showDate: "1971-04-28",
    showIdentifier: "gd71-04-28.sbd.murphy.2248.sbeok.shnf",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hard to Handle",
    showDate: "1971-06-21",
    showIdentifier: "gd1971-06-21.sbd.miller.94356.flac16",
    tier: 2,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hard to Handle",
    showDate: "1970-02-14",
    showIdentifier: "gd70-02-14.early-late.sbd.cotsman.18115.sbeok.shnf",
    tier: 2,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hard to Handle",
    showDate: "1971-03-24",
    showIdentifier: "gd71-03-24.sbd.cotsman.9501.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hard to Handle",
    showDate: "1971-04-27",
    showIdentifier: "gd71-04-27.sbd.murphy.2221.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hard to Handle",
    showDate: "1971-04-13",
    showIdentifier: "gd71-04-13.sbd.unknown.32015.sbeok.flacf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Man Smart, Woman Smarter",
    showDate: "1987-09-18",
    showIdentifier: "gd87-09-18.sbd.samaritano.20025.sbeok.shnf",
    tier: 2,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Man Smart, Woman Smarter",
    showDate: "1990-03-16",
    showIdentifier: "gd90-03-16.sbd.willy.5227.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Man Smart, Woman Smarter",
    showDate: "1982-04-05",
    showIdentifier: "gd82-04-05.sennheiser.willy.13612.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Man Smart, Woman Smarter",
    showDate: "1983-04-26",
    showIdentifier: "gd83-04-26.sbd.parrillo.2606.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Man Smart, Woman Smarter",
    showDate: "1989-04-02",
    showIdentifier: "gd89-04-02.sbd-matrix.mattman.17177.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Man Smart, Woman Smarter",
    showDate: "1990-07-16",
    showIdentifier: "gd90-07-16.sbd.knapp.1316.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Man Smart, Woman Smarter",
    showDate: "1992-03-20",
    showIdentifier: "gd92-03-20.sbd.gardner.9757.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Eleven",
    showDate: "1969-02-22",
    showIdentifier: "gd69-02-22.sbd.owen.7860.sbeok.shnf",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Eleven",
    showDate: "1969-01-26",
    showIdentifier: "gd69-01-26.sbd.kaplan.2246.sbeok.shnf",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Eleven",
    showDate: "1969-06-14",
    showIdentifier: "gd69-06-14.sbd.skinner.5182.sbeok.shnf",
    tier: 2,
    votes: 32,
    notes: "32 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Eleven",
    showDate: "1968-10-20",
    showIdentifier: "gd68-10-20.sbd.miller.21441.sbeok.shnf",
    tier: 2,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Eleven",
    showDate: "1969-11-08",
    showIdentifier: "gd69-11-08.weinberg.warner.26331.sbeok.flacf",
    tier: 2,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Eleven",
    showDate: "1969-03-01",
    showIdentifier: "gd69-03-01.sbd.16track.kaplan.4030.sbeok.shnf",
    tier: 2,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stagger Lee",
    showDate: "1993-03-24",
    showIdentifier: "gd93-03-24.sbd.keyser.25664.sbeok.flacf",
    tier: 2,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stagger Lee",
    showDate: "1982-08-10",
    showIdentifier: "gd82-08-10.sbd.miller.12453.sbeok.shnf",
    tier: 2,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stagger Lee",
    showDate: "1989-10-08",
    showIdentifier: "gd89-10-08.sbd.unknown.8365.sbeok.shnf",
    tier: 2,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stagger Lee",
    showDate: "1978-10-21",
    showIdentifier: "gd78-10-21.sbd.popi.6100.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stagger Lee",
    showDate: "1989-10-26",
    showIdentifier: "gd89-10-26.set2.dsbd.miller.18664.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stagger Lee",
    showDate: "1990-09-16",
    showIdentifier: "gd90-09-16.schoeps-fob.sacks.9435.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stagger Lee",
    showDate: "1985-06-27",
    showIdentifier: "gd85-06-27.sbd.miller.27863.sbeok.flacf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - West L.A. Fadeaway",
    showDate: "1987-07-26",
    showIdentifier: "gd1987-07-26.nak700.yamaguchi-poris.russjcan.98214.flac16",
    tier: 2,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - West L.A. Fadeaway",
    showDate: "1985-10-31",
    showIdentifier: "gd85-10-31.oade.connor.8793.sbeok.shnf",
    tier: 2,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - West L.A. Fadeaway",
    showDate: "1989-07-09",
    showIdentifier: "gd89-07-09.bertha.6943.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - West L.A. Fadeaway",
    showDate: "1982-10-09",
    showIdentifier: "gd82-10-09.sbd-patched.wiley.15800.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - West L.A. Fadeaway",
    showDate: "1982-09-21",
    showIdentifier: "gd82-09-21.sbd.perkins.13306.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - West L.A. Fadeaway",
    showDate: "1990-06-23",
    showIdentifier: "gd90-06-23.sbd.ladner.28690.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - West L.A. Fadeaway",
    showDate: "1987-03-27",
    showIdentifier: "gd87-03-27.nak.braverman.7343.sbefixed.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Alabama Getaway",
    showDate: "1980-05-15",
    showIdentifier: "gd80-05-15.aud.schlissel.12790.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Alabama Getaway",
    showDate: "1979-11-10",
    showIdentifier: "gd79-11-10.sbd.clugston.14108.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Alabama Getaway",
    showDate: "1979-12-28",
    showIdentifier: "gd79-12-28.sbd.lai.4145.sbefail.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Alabama Getaway",
    showDate: "1985-06-24",
    showIdentifier: "gd85-06-24.sbd.miller.25315.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Alabama Getaway",
    showDate: "1979-12-03",
    showIdentifier: "gd79-12-03.sbd.miller.29434.sbeok.flacf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Alabama Getaway",
    showDate: "1981-05-01",
    showIdentifier: "gd81-05-01.wise.clugston.2218.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Alabama Getaway",
    showDate: "1987-03-27",
    showIdentifier: "gd87-03-27.nak.braverman.7343.sbefixed.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Me and Bobby McGee",
    showDate: "1973-04-02",
    showIdentifier: "gd73-04-02.sbd.miller.17346.sbeok.shnf",
    tier: 2,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Me and Bobby McGee",
    showDate: "1971-11-15",
    showIdentifier: "gd71-11-15.sbd.cotsman.12438.sbeok.shnf",
    tier: 2,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Me and Bobby McGee",
    showDate: "1972-05-10",
    showIdentifier: "gd72-05-10.sbd.kaplan.1582.sbeok.shnf",
    tier: 2,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Me and Bobby McGee",
    showDate: "1972-04-17",
    showIdentifier: "gd72-04-17.sbd.vernon.9390.sbeok.shnf",
    tier: 2,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Me and Bobby McGee",
    showDate: "1974-05-19",
    showIdentifier: "gd74-05-19.sbd.clugston.6957.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Me and Bobby McGee",
    showDate: "1971-10-21",
    showIdentifier: "gd71-10-21.sbd.cotsman.5071.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Me and Bobby McGee",
    showDate: "1973-06-26",
    showIdentifier: "gd73-06-26.sbd.cotsman.12076.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - All Along the Watchtower",
    showDate: "1989-06-19",
    showIdentifier: "gd1989-06-19.sbd.walker-scotton.miller.83673.sbeok.flac16",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - All Along the Watchtower",
    showDate: "1987-08-23",
    showIdentifier: "gd87-08-23.sbd.gardner.4233.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - All Along the Watchtower",
    showDate: "1993-03-27",
    showIdentifier: "gd93-03-27.sbd.nawrocki.31956.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - All Along the Watchtower",
    showDate: "1987-06-20",
    showIdentifier: "gd87-06-20.sbd.clugston.11943.sbefail.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - All Along the Watchtower",
    showDate: "1990-07-19",
    showIdentifier: "gd90-07-19.dsbd.garcia420.2177.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - All Along the Watchtower",
    showDate: "1992-12-16",
    showIdentifier: "gd92-12-16.sbd-2track.stonebear.5551.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - All Along the Watchtower",
    showDate: "1991-06-06",
    showIdentifier: "gd91-06-06.dsbd.chastewk.478.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Scarlet Begonias",
    showDate: "1977-03-20",
    showIdentifier: "gd77-03-20.sbd.kempa.257.sbefixed.shnf",
    tier: 2,
    votes: 49,
    notes: "49 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Scarlet Begonias",
    showDate: "1974-10-19",
    showIdentifier: "gd74-10-19.sbd.miller.21927.sbeok.shnf",
    tier: 2,
    votes: 36,
    notes: "36 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Scarlet Begonias",
    showDate: "1976-12-31",
    showIdentifier: "gd76-12-31.preFM.warner.18524.20760.sbeok.shnf",
    tier: 2,
    votes: 34,
    notes: "34 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Scarlet Begonias",
    showDate: "1990-03-16",
    showIdentifier: "gd90-03-16.sbd.willy.5227.sbeok.shnf",
    tier: 2,
    votes: 34,
    notes: "34 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Scarlet Begonias",
    showDate: "1974-08-06",
    showIdentifier: "gd74-08-06.merin.weiner.gdADT.5914.sbefail.shnf",
    tier: 2,
    votes: 32,
    notes: "32 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Scarlet Begonias",
    showDate: "1974-08-04",
    showIdentifier: "gd74-08-04.aud-moore.weiner.20369.sbeok.shnf",
    tier: 2,
    votes: 32,
    notes: "32 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Scarlet Begonias",
    showDate: "1974-06-28",
    showIdentifier: "gd74-06-28.moore.weiner.gdADT18.16038.sbeok.shnf",
    tier: 2,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Jack A Roe",
    showDate: "1982-04-06",
    showIdentifier: "gd82-04-06.sbd-patched.wiley.16785.sbeok.shnf",
    tier: 2,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Jack A Roe",
    showDate: "1977-06-08",
    showIdentifier: "gd77-06-08.sbd.clugston.15421.sbeok.shnf",
    tier: 2,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Jack A Roe",
    showDate: "1977-05-13",
    showIdentifier: "gd77-05-13.sbd.miller.9393.sbeok.shnf",
    tier: 2,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Jack A Roe",
    showDate: "1981-05-06",
    showIdentifier: "gd81-05-06.glassberg.vernon.17697.sbeok.shnf",
    tier: 2,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Jack A Roe",
    showDate: "1977-05-26",
    showIdentifier: "gd77-05-26.sbd.sacks.3224.sbeok.shnf",
    tier: 2,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Jack A Roe",
    showDate: "1978-11-20",
    showIdentifier: "gd78-11-20.sbdpatched.knott.21727.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Jack A Roe",
    showDate: "1989-10-09",
    showIdentifier: "gd89-10-09.sbd.serafin.7721.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - When I Paint My Masterpiece",
    showDate: "1990-03-25",
    showIdentifier: "gd90-03-25.fob-schoeps-mattes.miller.28389.sbeok.shnf",
    tier: 2,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - When I Paint My Masterpiece",
    showDate: "1991-06-17",
    showIdentifier: "gd91-06-17.sbd.gardner.3591.sbeok.shnf",
    tier: 2,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - When I Paint My Masterpiece",
    showDate: "1990-07-18",
    showIdentifier: "gd90-07-18.sbd.wilson.12760.sbeok.shnf",
    tier: 2,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - When I Paint My Masterpiece",
    showDate: "1987-10-03",
    showIdentifier: "gd87-10-03.sbd.bertha-ashley.7368.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - When I Paint My Masterpiece",
    showDate: "1989-10-11",
    showIdentifier: "gd89-10-11.sbd.clugston.6668.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - When I Paint My Masterpiece",
    showDate: "1990-07-10",
    showIdentifier: "gd90-07-10.sbd.unknown.8256.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - When I Paint My Masterpiece",
    showDate: "1988-03-31",
    showIdentifier: "gd88-03-31.sbd.unknown.8137.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Passenger",
    showDate: "1981-12-05",
    showIdentifier: "gd81-12-05.sbd.clugston.5488.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Passenger",
    showDate: "1977-11-06",
    showIdentifier: "gd77-11-06.sbd.nawrocki.283.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Passenger",
    showDate: "1977-05-26",
    showIdentifier: "gd77-05-26.sbd.sacks.3224.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Passenger",
    showDate: "1979-11-10",
    showIdentifier: "gd79-11-10.sbd.clugston.14108.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Passenger",
    showDate: "1981-05-16",
    showIdentifier: "gd81-05-16.nak300-dmow.28007.sbeok.flacf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Passenger",
    showDate: "1980-11-28",
    showIdentifier: "gd80-11-28.sbd.vernon.20049.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Passenger",
    showDate: "1977-05-17",
    showIdentifier: "gd77-05-17.sbd.weiner.18554.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Its All Over Now",
    showDate: "1990-03-19",
    showIdentifier: "gd90-03-19.prefm-sbd.sacks.1526.sbeok.shnf",
    tier: 2,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Its All Over Now",
    showDate: "1979-12-03",
    showIdentifier: "gd79-12-03.sbd.miller.29434.sbeok.flacf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Its All Over Now",
    showDate: "1978-02-04",
    showIdentifier: "gd78-02-04.aud.vernon.12199.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Its All Over Now",
    showDate: "1989-07-17",
    showIdentifier: "gd89-07-17.sbd.unknown.17702.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Its All Over Now",
    showDate: "1982-07-31",
    showIdentifier: "gd82-07-31.sbd.martinson.3419.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Its All Over Now",
    showDate: "1984-10-12",
    showIdentifier: "gd84-10-12-oade.sacks.8795.sbefail.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Its All Over Now",
    showDate: "1990-09-20",
    showIdentifier: "gd90-09-20.sbd.ashley.14855.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Foolish Heart",
    showDate: "1990-07-19",
    showIdentifier: "gd90-07-19.dsbd.garcia420.2177.sbeok.shnf",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Foolish Heart",
    showDate: "1990-12-28",
    showIdentifier: "gd90-12-28.sbd-matrix.wiley.11498.sbeok.shnf",
    tier: 2,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Foolish Heart",
    showDate: "1993-06-11",
    showIdentifier: "gd93-06-11.sbd.gans.19217.sbeok.shnf",
    tier: 2,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Foolish Heart",
    showDate: "1990-09-18",
    showIdentifier: "gd90-09-18.sbd.miller.12885.sbeok.shnf",
    tier: 2,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Foolish Heart",
    showDate: "1990-04-02",
    showIdentifier: "gd90-04-02.sbd.dodd.17731.sbeok.shnf",
    tier: 2,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Foolish Heart",
    showDate: "1989-10-08",
    showIdentifier: "gd89-10-08.sbd.unknown.8365.sbeok.shnf",
    tier: 2,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Foolish Heart",
    showDate: "1995-02-21",
    showIdentifier: "gd95-02-21.dsbd.stephens.8840.sbeok.shnf",
    tier: 2,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Victim Or The Crime",
    showDate: "1989-10-08",
    showIdentifier: "gd89-10-08.sbd.unknown.8365.sbeok.shnf",
    tier: 2,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Victim Or The Crime",
    showDate: "1989-10-26",
    showIdentifier: "gd89-10-26.set2.dsbd.miller.18664.shnf",
    tier: 2,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Victim Or The Crime",
    showDate: "1993-05-26",
    showIdentifier: "gd93-05-26.sbd.georges.1958.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Victim Or The Crime",
    showDate: "1991-06-19",
    showIdentifier: "gd91-06-19.sbd.aj.2786.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Victim Or The Crime",
    showDate: "1991-09-25",
    showIdentifier: "gd91-09-25.nak.dodd.16667.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Victim Or The Crime",
    showDate: "1990-03-21",
    showIdentifier: "gd90-03-21.sbd.heath.5307.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Victim Or The Crime",
    showDate: "1995-06-27",
    showIdentifier: "gd95-06-27.schoeps.10180.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brother Esau",
    showDate: "1985-06-24",
    showIdentifier: "gd85-06-24.sbd.miller.25315.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brother Esau",
    showDate: "1987-03-26",
    showIdentifier: "gd87-03-26.mixed.braverman.10923.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brother Esau",
    showDate: "1984-04-14",
    showIdentifier: "gd1984-04-14.neumann-u87.eaton.miller.90595.sbeok.flac16",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brother Esau",
    showDate: "1983-10-21",
    showIdentifier: "gd83-10-21.sbd.bertha-ashley.24998.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brother Esau",
    showDate: "1985-10-28",
    showIdentifier: "gd85-10-28.nak300.dobb.8566.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brother Esau",
    showDate: "1984-07-15",
    showIdentifier: "gd84-07-15.pcm-sbd.miller.30641.sbeok.flacf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Brother Esau",
    showDate: "1983-10-17",
    showIdentifier: "gd83-10-17.sennheiser.skank-levy.347.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Standing On The Moon",
    showDate: "1991-09-10",
    showIdentifier: "gd91-09-10.sbd.sacks.511.sbeok.shnf",
    tier: 2,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Standing On The Moon",
    showDate: "1989-07-17",
    showIdentifier: "gd89-07-17.sbd.unknown.17702.sbeok.shnf",
    tier: 2,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Standing On The Moon",
    showDate: "1990-07-06",
    showIdentifier: "gd90-07-06.sbd.miller.12770.sbeok.shnf",
    tier: 2,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Standing On The Moon",
    showDate: "1990-09-16",
    showIdentifier: "gd90-09-16.schoeps-fob.sacks.9435.sbeok.shnf",
    tier: 2,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Standing On The Moon",
    showDate: "1992-03-20",
    showIdentifier: "gd92-03-20.sbd.gardner.9757.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Standing On The Moon",
    showDate: "1990-03-30",
    showIdentifier: "gd90-03-30.sbd.gorinsky.8511.sbeok.shnf",
    tier: 2,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Standing On The Moon",
    showDate: "1994-10-05",
    showIdentifier: "gd94-10-05.sbd.unknown.8030.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - C. C. Rider",
    showDate: "1981-12-05",
    showIdentifier: "gd81-12-05.sbd.clugston.5488.sbeok.shnf",
    tier: 2,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - C. C. Rider",
    showDate: "1983-10-14",
    showIdentifier: "gd83-10-14.beyer-ficca-brennan.ficca.20023.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - C. C. Rider",
    showDate: "1981-03-09",
    showIdentifier: "gd81-03-09.glassberg.wise.7473.sbeok.shnf",
    tier: 2,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - C. C. Rider",
    showDate: "1982-04-06",
    showIdentifier: "gd82-04-06.sbd-patched.wiley.16785.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - C. C. Rider",
    showDate: "1987-03-26",
    showIdentifier: "gd87-03-26.mixed.braverman.10923.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - C. C. Rider",
    showDate: "1984-07-13",
    showIdentifier: "gd84-07-13.sbd.ferguson.353.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - C. C. Rider",
    showDate: "1981-03-14",
    showIdentifier: "gd1981-03-14.nak700.glassberg.motb.84826.sbeok.flac16",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Queen Jane Approximately",
    showDate: "1990-03-16",
    showIdentifier: "gd90-03-16.sbd.willy.5227.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Queen Jane Approximately",
    showDate: "1990-09-16",
    showIdentifier: "gd90-09-16.schoeps-fob.sacks.9435.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Queen Jane Approximately",
    showDate: "1989-08-04",
    showIdentifier: "gd89-08-04.sbd.11267.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Queen Jane Approximately",
    showDate: "1994-10-14",
    showIdentifier: "gd94-10-14.sbd.perkins.9054.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Queen Jane Approximately",
    showDate: "1988-07-15",
    showIdentifier: "gd88-07-15.schoeps-weber-small.gardner.9244.sbefail.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Queen Jane Approximately",
    showDate: "1988-03-16",
    showIdentifier: "gd88-03-16.sbd.willy.8864.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Queen Jane Approximately",
    showDate: "1990-07-12",
    showIdentifier: "gd90-07-12.sbd.mcatee.2582.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Comes A Time",
    showDate: "1972-04-26",
    showIdentifier: "gd1972-04-26.sbd.vernon.9197.sbeok.shnf",
    tier: 2,
    votes: 58,
    notes: "58 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Comes A Time",
    showDate: "1985-11-01",
    showIdentifier: "gd85-11-01.oade.connor.9217.sbeok.shnf",
    tier: 2,
    votes: 46,
    notes: "46 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Comes A Time",
    showDate: "1986-05-03",
    showIdentifier: "gd86-05-03.sbd.hinko.18375.sbeok.shnf",
    tier: 2,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Comes A Time",
    showDate: "1976-06-12",
    showIdentifier: "gd76-06-12.fm.wren.5556.sbeok.shnf",
    tier: 2,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Comes A Time",
    showDate: "1977-05-12",
    showIdentifier: "gd77-05-12.aud.clugston.6484.sbeok.shnf",
    tier: 2,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Comes A Time",
    showDate: "1977-05-01",
    showIdentifier: "gd77-05-01.set2-sbd.unknown.4763.sbeok.shnf",
    tier: 2,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Comes A Time",
    showDate: "1977-05-04",
    showIdentifier: "gd77-05-04.sbd.mccarthy.1321.sbefixed.shnf",
    tier: 2,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Next Time You See Me",
    showDate: "1972-05-07",
    showIdentifier: "gd72-05-07.sbd-aud.clugston.9193.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Next Time You See Me",
    showDate: "1972-05-04",
    showIdentifier: "gd1972-05-04.sbd.miller.77294.sbeok.flac16",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Next Time You See Me",
    showDate: "1969-12-12",
    showIdentifier: "gd69-12-12.sbd.gerland.10988.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Next Time You See Me",
    showDate: "1972-04-08",
    showIdentifier: "gd72-04-08.sbd.giles-jeffm.2534.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Next Time You See Me",
    showDate: "1972-04-17",
    showIdentifier: "gd72-04-17.sbd.vernon.9390.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Next Time You See Me",
    showDate: "1972-04-11",
    showIdentifier: "gd72-04-11.sbd.giles.12186.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Next Time You See Me",
    showDate: "1966-07-03",
    showIdentifier: "gd66-07-03.sbd.unknown.40.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Saint of Circumstance",
    showDate: "1980-10-25",
    showIdentifier: "gd80-10-25.aud.wiley.8726.sbefail.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Saint of Circumstance",
    showDate: "1992-05-31",
    showIdentifier: "gd92-05-31.sbd.paino.544.sbefail.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Saint of Circumstance",
    showDate: "1991-09-26",
    showIdentifier: "gd91-09-26.sbd.fishman.21242.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Saint of Circumstance",
    showDate: "1994-10-01",
    showIdentifier: "gd94-10-01.sbd.ashley-bertha.14869.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Saint of Circumstance",
    showDate: "1990-12-13",
    showIdentifier: "gd90-12-13.sbd.unknown.4988.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Saint of Circumstance",
    showDate: "1987-03-30",
    showIdentifier: "gd87-03-30.matrix.18255.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Saint of Circumstance",
    showDate: "1991-12-30",
    showIdentifier: "gd91-12-30.b_ks.georges.6812.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Might As Well",
    showDate: "1976-06-14",
    showIdentifier: "gd76-06-14.sbd.hollister.22804.sbeok.shnf",
    tier: 2,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Might As Well",
    showDate: "1976-10-10",
    showIdentifier: "gd76-10-10.sbd.clugston.3381.sbeok.shnf",
    tier: 2,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Might As Well",
    showDate: "1976-06-19",
    showIdentifier: "gd76-06-19.prefm.unknown.12077.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Might As Well",
    showDate: "1991-06-06",
    showIdentifier: "gd91-06-06.dsbd.chastewk.478.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Might As Well",
    showDate: "1982-04-06",
    showIdentifier: "gd82-04-06.sbd-patched.wiley.16785.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Might As Well",
    showDate: "1976-09-24",
    showIdentifier: "gd76-09-24.aud.unknown.16901.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Might As Well",
    showDate: "1976-06-15",
    showIdentifier: "gd76-06-15.sbd.kempa.241.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Loose Lucy",
    showDate: "1974-06-18",
    showIdentifier: "gd74-06-18.sbd.sacks.209.sbefail.shnf",
    tier: 2,
    votes: 33,
    notes: "33 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Loose Lucy",
    showDate: "1973-02-09",
    showIdentifier: "gd73-02-09.sbd.allred.9888.sbeok.shnf",
    tier: 2,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Loose Lucy",
    showDate: "1991-06-17",
    showIdentifier: "gd91-06-17.sbd.gardner.3591.sbeok.shnf",
    tier: 2,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Loose Lucy",
    showDate: "1973-04-02",
    showIdentifier: "gd73-04-02.sbd.miller.17346.sbeok.shnf",
    tier: 2,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Loose Lucy",
    showDate: "1973-06-09",
    showIdentifier: "gd73-06-09.sbd.hollister.172.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Loose Lucy",
    showDate: "1974-05-19",
    showIdentifier: "gd74-05-19.sbd.clugston.6957.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Loose Lucy",
    showDate: "1974-08-06",
    showIdentifier: "gd74-08-06.merin.weiner.gdADT.5914.sbefail.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - To Lay Me Down",
    showDate: "1974-06-28",
    showIdentifier: "gd74-06-28.moore.weiner.gdADT18.16038.sbeok.shnf",
    tier: 2,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - To Lay Me Down",
    showDate: "1970-09-20",
    showIdentifier: "gd70-09-20.aud.remaster.sirmick.27583.sbeok.shnf",
    tier: 2,
    votes: 39,
    notes: "39 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - To Lay Me Down",
    showDate: "1973-11-11",
    showIdentifier: "gd73-11-11.sbd.schlissel.14105.sbeok.shnf",
    tier: 2,
    votes: 39,
    notes: "39 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - To Lay Me Down",
    showDate: "1974-09-18",
    showIdentifier: "gd74-09-18.sbd.miller.20732.sbeok.shnf",
    tier: 2,
    votes: 32,
    notes: "32 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - To Lay Me Down",
    showDate: "1974-07-31",
    showIdentifier: "gd74-07-31.sbd.ziggy.1019.sbeok.shnf",
    tier: 2,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - To Lay Me Down",
    showDate: "1989-07-13",
    showIdentifier: "gd89-07-13.schoeps.9046.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - To Lay Me Down",
    showDate: "1988-03-27",
    showIdentifier: "gd88-03-27.matrix.braverman.17262.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Caution",
    showDate: "1967-11-10",
    showIdentifier: "gd67-11-10.sbd.sacks.1612.sbeok.shnf",
    tier: 2,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Caution",
    showDate: "1972-04-17",
    showIdentifier: "gd72-04-17.sbd.vernon.9390.sbeok.shnf",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Caution",
    showDate: "1968-08-23",
    showIdentifier: "gd68-08-23.sbd.sacks.52.sbefail.shnf",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Caution",
    showDate: "1972-05-11",
    showIdentifier: "gd72-05-11.sbd.ashley-bertha.7364.sbefail.shnf",
    tier: 2,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Caution",
    showDate: "1969-12-12",
    showIdentifier: "gd69-12-12.sbd.gerland.10988.sbeok.shnf",
    tier: 2,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Caution",
    showDate: "1969-02-28",
    showIdentifier: "gd69-02-28.sbd.16track.kaplan.3397.sbeok.shnf",
    tier: 2,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Caution",
    showDate: "1968-10-20",
    showIdentifier: "gd68-10-20.sbd.miller.21441.sbeok.shnf",
    tier: 2,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Boss Man",
    showDate: "1972-04-11",
    showIdentifier: "gd72-04-11.sbd.giles.12186.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Boss Man",
    showDate: "1972-05-10",
    showIdentifier: "gd72-05-10.sbd.kaplan.1582.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Boss Man",
    showDate: "1972-04-29",
    showIdentifier: "gd72-04-29.aud.vernon.5250.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Boss Man",
    showDate: "1972-03-26",
    showIdentifier: "gd72-03-26.aud.hanno.15413.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Boss Man",
    showDate: "1981-12-31",
    showIdentifier: "gd81-12-31.sbd.bertha-ashley.12784.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Boss Man",
    showDate: "1971-12-07",
    showIdentifier: "gd71-12-07.sbd.miller.3375.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Boss Man",
    showDate: "1971-02-18",
    showIdentifier: "gd71-02-18.sbd.orf.107.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dupree's Diamond Blues",
    showDate: "1990-03-26",
    showIdentifier: "gd90-03-26.sbd.gorinsky.8508.sbeok.shnf",
    tier: 2,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dupree's Diamond Blues",
    showDate: "1977-11-04",
    showIdentifier: "gd77-11-04.sbd.unknown.2595.sbeok.shnf",
    tier: 2,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dupree's Diamond Blues",
    showDate: "1978-02-04",
    showIdentifier: "gd78-02-04.aud.vernon.12199.sbeok.shnf",
    tier: 2,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dupree's Diamond Blues",
    showDate: "1977-10-02",
    showIdentifier: "gd77-10-02.sbd.unknown.278.sbeok.shnf",
    tier: 2,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dupree's Diamond Blues",
    showDate: "1985-11-02",
    showIdentifier: "gd85-11-02.sbd.jim.14604.sbeok.shnf",
    tier: 2,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dupree's Diamond Blues",
    showDate: "1994-10-13",
    showIdentifier: "gd94-10-13.sbd.wiley.7800.sbefail.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dupree's Diamond Blues",
    showDate: "1982-09-11",
    showIdentifier: "gd82-09-11.sbd.clugston.2192.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Weather Report Suite",
    showDate: "1973-12-18",
    showIdentifier: "gd1973-12-18.sbd.miller.97511.sbeok.flac16",
    tier: 2,
    votes: 61,
    notes: "61 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Weather Report Suite",
    showDate: "1974-09-10",
    showIdentifier: "gd74-09-10.sbd.samaritano.18806.sbeok.shnf",
    tier: 2,
    votes: 51,
    notes: "51 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Weather Report Suite",
    showDate: "1974-02-24",
    showIdentifier: "gd74-02-24.sbd.windsor.199.sbefail.shnf",
    tier: 2,
    votes: 43,
    notes: "43 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Weather Report Suite",
    showDate: "1974-07-29",
    showIdentifier: "gd74-07-29.sbd.goodbear.2277.sbefail.shnf",
    tier: 2,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Weather Report Suite",
    showDate: "1974-06-23",
    showIdentifier: "gd74-06-23.sbd.cribbs.16780.sbeok.shnf",
    tier: 2,
    votes: 40,
    notes: "40 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Weather Report Suite",
    showDate: "1973-11-30",
    showIdentifier: "gd73-11-30.aud.vernon.17277.sbeok.shnf",
    tier: 2,
    votes: 37,
    notes: "37 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Weather Report Suite",
    showDate: "1974-05-14",
    showIdentifier: "gd74-05-14.sbd.murphy.1823.sbeok.shnf",
    tier: 2,
    votes: 37,
    notes: "37 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Good Morning Little Schoolgirl",
    showDate: "1968-02-24",
    showIdentifier: "gd1968-02-24.167922.2nd.set.fm.smith.miller.clugston.flac1648",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Good Morning Little Schoolgirl",
    showDate: "1969-11-08",
    showIdentifier: "gd69-11-08.weinberg.warner.26331.sbeok.flacf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Good Morning Little Schoolgirl",
    showDate: "1968-10-20",
    showIdentifier: "gd68-10-20.sbd.miller.21441.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Good Morning Little Schoolgirl",
    showDate: "1967-11-10",
    showIdentifier: "gd67-11-10.sbd.sacks.1612.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Good Morning Little Schoolgirl",
    showDate: "1969-02-27",
    showIdentifier: "gd69-02-27.sbd.16track.kaplan.6315.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Good Morning Little Schoolgirl",
    showDate: "1992-06-25",
    showIdentifier: "gd92-06-25.sbd.serrafin.8959.sbefail.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wang Dang Doodle",
    showDate: "1983-10-11",
    showIdentifier: "gd83-10-11.sbd.harrell.7339.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wang Dang Doodle",
    showDate: "1991-06-14",
    showIdentifier: "gd91-06-14.sbd.braverman.16816.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wang Dang Doodle",
    showDate: "1983-10-31",
    showIdentifier: "gd83-10-31.horvath-nak.ladner.19894.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wang Dang Doodle",
    showDate: "1983-09-11",
    showIdentifier: "gd83-09-11.sbd.dankseed.4995.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wang Dang Doodle",
    showDate: "1991-11-03",
    showIdentifier: "gd1991-11-03.fm.kome.34912.sbefail.flac16",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wang Dang Doodle",
    showDate: "1993-03-24",
    showIdentifier: "gd93-03-24.sbd.keyser.25664.sbeok.flacf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wang Dang Doodle",
    showDate: "1991-06-22",
    showIdentifier: "gd1991-06-22.sbd.unknown.29057.sbe-fix.flac16",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - So Many Roads",
    showDate: "1994-09-18",
    showIdentifier: "gd94-09-18.nak300.ladner.10069.sbeok.shnf",
    tier: 2,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - So Many Roads",
    showDate: "1993-08-25",
    showIdentifier: "gd93-08-25.sbd.wiley.11812.sbeok.shnf",
    tier: 2,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - So Many Roads",
    showDate: "1995-03-19",
    showIdentifier: "gd95-03-19.schoeps.15097.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - So Many Roads",
    showDate: "1992-06-08",
    showIdentifier: "gd92-06-08.sbd.stevens.12561.sbeok.flacf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - So Many Roads",
    showDate: "1993-03-28",
    showIdentifier: "gd93-03-28.sbd.nawrocki.16747.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - So Many Roads",
    showDate: "1993-06-11",
    showIdentifier: "gd93-06-11.sbd.gans.19217.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - So Many Roads",
    showDate: "1995-03-23",
    showIdentifier: "gd95-03-23.sbd.miller.25273.sbeok.flacf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Spanish Jam",
    showDate: "1968-02-14",
    showIdentifier: "gd68-02-14.sbd.kaplan.15640.sbeok.shnf",
    tier: 2,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Spanish Jam",
    showDate: "1970-02-11",
    showIdentifier: "gd70-02-11.early-late.sbd.sacks.90.sbefail.shnf",
    tier: 2,
    votes: 37,
    notes: "37 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Spanish Jam",
    showDate: "1973-03-24",
    showIdentifier: "gd73-03-24.sbd.bertha-ashley.25508.sbeok.shnf",
    tier: 2,
    votes: 32,
    notes: "32 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Spanish Jam",
    showDate: "1983-10-14",
    showIdentifier: "gd83-10-14.beyer-ficca-brennan.ficca.20023.sbeok.shnf",
    tier: 2,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Spanish Jam",
    showDate: "1974-07-31",
    showIdentifier: "gd74-07-31.sbd.ziggy.1019.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Spanish Jam",
    showDate: "1974-07-29",
    showIdentifier: "gd74-07-29.sbd.goodbear.2277.sbefail.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Spanish Jam",
    showDate: "1976-07-16",
    showIdentifier: "gd76-07-16.menke.cribbs.16943.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stuck Inside of Mobile with the Memphis Blues Again",
    showDate: "1989-07-13",
    showIdentifier: "gd89-07-13.schoeps.9046.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stuck Inside of Mobile with the Memphis Blues Again",
    showDate: "1992-12-16",
    showIdentifier: "gd92-12-16.sbd-2track.stonebear.5551.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stuck Inside of Mobile with the Memphis Blues Again",
    showDate: "1995-04-02",
    showIdentifier: "gd95-04-02.sbd.11622.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stuck Inside of Mobile with the Memphis Blues Again",
    showDate: "1993-05-26",
    showIdentifier: "gd93-05-26.sbd.georges.1958.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stuck Inside of Mobile with the Memphis Blues Again",
    showDate: "1988-07-02",
    showIdentifier: "gd88-07-02.sbd-matrix.dan.21211.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stuck Inside of Mobile with the Memphis Blues Again",
    showDate: "1989-08-19",
    showIdentifier: "gd89-08-19.sbd.5213.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stuck Inside of Mobile with the Memphis Blues Again",
    showDate: "1987-07-10",
    showIdentifier: "gd87-07-10.senn.lai.3859.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Here Comes Sunshine",
    showDate: "1973-12-06",
    showIdentifier: "gd73-12-06.sbd.kaplan-fink-hamilton.4452.sbeok.shnf",
    tier: 2,
    votes: 71,
    notes: "71 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Here Comes Sunshine",
    showDate: "1973-06-22",
    showIdentifier: "gd73-06-22.sbd.cribbs.17270.sbeok.shnf",
    tier: 2,
    votes: 66,
    notes: "66 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Here Comes Sunshine",
    showDate: "1973-04-02",
    showIdentifier: "gd73-04-02.sbd.miller.17346.sbeok.shnf",
    tier: 2,
    votes: 61,
    notes: "61 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Here Comes Sunshine",
    showDate: "1973-11-30",
    showIdentifier: "gd73-11-30.aud.vernon.17277.sbeok.shnf",
    tier: 2,
    votes: 59,
    notes: "59 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Here Comes Sunshine",
    showDate: "1973-11-14",
    showIdentifier: "gd73-11-14.sbd.vernon.5612.sbeok.shnf",
    tier: 2,
    votes: 55,
    notes: "55 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Here Comes Sunshine",
    showDate: "1973-11-21",
    showIdentifier: "gd73-11-21.sbd.barrick.192.sbeok.shnf",
    tier: 2,
    votes: 51,
    notes: "51 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Here Comes Sunshine",
    showDate: "1973-06-10",
    showIdentifier: "gd73-06-10.sbd.hollister.174.sbeok.shnf",
    tier: 2,
    votes: 49,
    notes: "49 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hurts Me Too",
    showDate: "1972-05-24",
    showIdentifier: "gd72-05-24.jones.macdonald.5920.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hurts Me Too",
    showDate: "1971-04-26",
    showIdentifier: "gd71-04-26.sbd.murphy.4991.sbefail.shnf",
    tier: 2,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hurts Me Too",
    showDate: "1972-04-17",
    showIdentifier: "gd72-04-17.sbd.vernon.9390.sbeok.shnf",
    tier: 2,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hurts Me Too",
    showDate: "1972-05-03",
    showIdentifier: "gd72-05-03.sbd.masse.142.sbeok.shnf",
    tier: 2,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hurts Me Too",
    showDate: "1967-10-22",
    showIdentifier: "gd67-10-22.sbd.miller.18101.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hurts Me Too",
    showDate: "1971-04-29",
    showIdentifier: "gd71-04-29.sbd.frisco.16782.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hurts Me Too",
    showDate: "1972-05-04",
    showIdentifier: "gd1972-05-04.sbd.miller.77294.sbeok.flac16",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Alligator",
    showDate: "1969-02-28",
    showIdentifier: "gd69-02-28.sbd.16track.kaplan.3397.sbeok.shnf",
    tier: 2,
    votes: 35,
    notes: "35 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Alligator",
    showDate: "1969-12-12",
    showIdentifier: "gd69-12-12.sbd.gerland.10988.sbeok.shnf",
    tier: 2,
    votes: 33,
    notes: "33 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Alligator",
    showDate: "1967-11-10",
    showIdentifier: "gd67-11-10.sbd.sacks.1612.sbeok.shnf",
    tier: 2,
    votes: 32,
    notes: "32 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Alligator",
    showDate: "1968-02-24",
    showIdentifier: "gd1968-02-24.167922.2nd.set.fm.smith.miller.clugston.flac1648",
    tier: 2,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Alligator",
    showDate: "1970-02-14",
    showIdentifier: "gd70-02-14.early-late.sbd.cotsman.18115.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Alligator",
    showDate: "1968-08-21",
    showIdentifier: "gd68-08-21.sbd.cotsman.17355.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Alligator",
    showDate: "1969-03-02",
    showIdentifier: "gd69-03-02.sbd.16track.kaplan.3344.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - And We Bid You Goodnight",
    showDate: "1989-10-16",
    showIdentifier: "gd89-10-16.dsbd.barrick.446.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - And We Bid You Goodnight",
    showDate: "1969-05-24",
    showIdentifier: "gd69-05-24.sbd.kpfa.16177.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - And We Bid You Goodnight",
    showDate: "1989-10-08",
    showIdentifier: "gd89-10-08.sbd.unknown.8365.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - And We Bid You Goodnight",
    showDate: "1989-07-17",
    showIdentifier: "gd89-07-17.sbd.unknown.17702.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - And We Bid You Goodnight",
    showDate: "1990-03-24",
    showIdentifier: "gd90-03-24.schoeps.wiley.11806.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - And We Bid You Goodnight",
    showDate: "1969-04-26",
    showIdentifier: "gd69-04-26.sbd.yerys.71.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - And We Bid You Goodnight",
    showDate: "1973-11-11",
    showIdentifier: "gd73-11-11.sbd.schlissel.14105.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Speedway Boogie",
    showDate: "1970-05-01",
    showIdentifier: "gd70-05-01.sbd.clugston.5465.sbeok.shnf",
    tier: 2,
    votes: 35,
    notes: "35 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Speedway Boogie",
    showDate: "1970-05-15",
    showIdentifier: "gd70-05-15.early-late.sbd.97.sbeok.shnf",
    tier: 2,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Speedway Boogie",
    showDate: "1992-06-28",
    showIdentifier: "gd92-06-28.sbd.braverman.8601.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Speedway Boogie",
    showDate: "1969-12-20",
    showIdentifier: "gd69-12-20.sbd.cotsman.6301.sbefail.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Speedway Boogie",
    showDate: "1995-07-02",
    showIdentifier: "gd95-07-02.aud.ball.587.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Speedway Boogie",
    showDate: "1970-07-14",
    showIdentifier: "gd1970-07-14.sbd.unknown.96628.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Speedway Boogie",
    showDate: "1995-06-24",
    showIdentifier: "gd95-06-24.naks.12271.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Desolation Row",
    showDate: "1987-03-26",
    showIdentifier: "gd87-03-26.mixed.braverman.10923.sbeok.shnf",
    tier: 2,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Desolation Row",
    showDate: "1988-02-17",
    showIdentifier: "gd1988-02-17.sbd.miller.88399.sbeok.flac16",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Desolation Row",
    showDate: "1987-05-10",
    showIdentifier: "gd87-05-10.sbd.schneiderman.2256.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Desolation Row",
    showDate: "1987-08-15",
    showIdentifier: "gd87-08-15.prefm.leeds.17010.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Desolation Row",
    showDate: "1987-03-31",
    showIdentifier: "gd87-03-31.fm.miller.21267.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Desolation Row",
    showDate: "1989-07-17",
    showIdentifier: "gd89-07-17.sbd.unknown.17702.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Desolation Row",
    showDate: "1990-07-06",
    showIdentifier: "gd90-07-06.sbd.miller.12770.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Knockin' On Heaven's Door",
    showDate: "1990-03-29",
    showIdentifier: "gd90-03-29.aud-fob.set2.unknown.1317.sbeok.shnf",
    tier: 2,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Knockin' On Heaven's Door",
    showDate: "1990-09-18",
    showIdentifier: "gd90-09-18.sbd.miller.12885.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Knockin' On Heaven's Door",
    showDate: "1988-03-31",
    showIdentifier: "gd88-03-31.sbd.unknown.8137.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Knockin' On Heaven's Door",
    showDate: "1990-02-25",
    showIdentifier: "gd1990-02-25.sbd.walker-scotton.miller.87786.sbeok.flac16",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Knockin' On Heaven's Door",
    showDate: "1987-07-06",
    showIdentifier: "gd87-07-06.aud.gardner.3829.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Knockin' On Heaven's Door",
    showDate: "1989-06-19",
    showIdentifier: "gd1989-06-19.sbd.walker-scotton.miller.83673.sbeok.flac16",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Knockin' On Heaven's Door",
    showDate: "1994-06-19",
    showIdentifier: "gd94-06-19.sbd.larson.12524.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Just Like Tom Thumb's Blues",
    showDate: "1994-10-15",
    showIdentifier: "gd94-10-15.sbd.miller.27249.sbeok.flacf",
    tier: 2,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Just Like Tom Thumb's Blues",
    showDate: "1989-07-12",
    showIdentifier: "gd89-07-12.aud-fob.gardner.2554.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Just Like Tom Thumb's Blues",
    showDate: "1990-03-30",
    showIdentifier: "gd90-03-30.sbd.gorinsky.8511.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Just Like Tom Thumb's Blues",
    showDate: "1985-04-27",
    showIdentifier: "gd85-04-27.sbd.jerugim.359.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Just Like Tom Thumb's Blues",
    showDate: "1993-06-11",
    showIdentifier: "gd93-06-11.sbd.gans.19217.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Just Like Tom Thumb's Blues",
    showDate: "1985-11-05",
    showIdentifier: "gd85-11-05.sbd.lai.1188.sbefail.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Just Like Tom Thumb's Blues",
    showDate: "1990-07-08",
    showIdentifier: "gd90-07-08.sbd.brame.16157.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Walking Blues",
    showDate: "1991-06-17",
    showIdentifier: "gd91-06-17.sbd.gardner.3591.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Walking Blues",
    showDate: "1993-05-26",
    showIdentifier: "gd93-05-26.sbd.georges.1958.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Walking Blues",
    showDate: "1989-10-08",
    showIdentifier: "gd89-10-08.sbd.unknown.8365.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Walking Blues",
    showDate: "1987-09-18",
    showIdentifier: "gd87-09-18.sbd.samaritano.20025.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Walking Blues",
    showDate: "1985-07-01",
    showIdentifier: "gd85-07-01.composite.torbjorn.17350.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Walking Blues",
    showDate: "1994-10-01",
    showIdentifier: "gd94-10-01.sbd.ashley-bertha.14869.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Walking Blues",
    showDate: "1985-07-13",
    showIdentifier: "gd85-07-13.sbd.georges.372.sbefail.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dear Mr. Fantasy",
    showDate: "1989-07-12",
    showIdentifier: "gd89-07-12.aud-fob.gardner.2554.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dear Mr. Fantasy",
    showDate: "1990-03-22",
    showIdentifier: "gd90-03-22.sbd.bertha-ashley.21433.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dear Mr. Fantasy",
    showDate: "1984-07-06",
    showIdentifier: "gd84-07-06.senn441.dodd.13898.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dear Mr. Fantasy",
    showDate: "1990-04-01",
    showIdentifier: "gd90-04-01.sbd.gorinsky.8512.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dear Mr. Fantasy",
    showDate: "1988-07-03",
    showIdentifier: "gd88-07-03.sbd.ststephen.3908.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dear Mr. Fantasy",
    showDate: "1987-07-24",
    showIdentifier: "gd1987-07-24.pzm.russjcan.92568.sbeok.flac16",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dear Mr. Fantasy",
    showDate: "1989-07-18",
    showIdentifier: "gd89-07-18.sbd.9854.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Death Don't Have No Mercy",
    showDate: "1969-02-28",
    showIdentifier: "gd69-02-28.sbd.16track.kaplan.3397.sbeok.shnf",
    tier: 2,
    votes: 44,
    notes: "44 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Death Don't Have No Mercy",
    showDate: "1989-09-29",
    showIdentifier: "gd89-09-29.ultramatrix.braverman.7282.sbeok.shnf",
    tier: 2,
    votes: 41,
    notes: "41 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Death Don't Have No Mercy",
    showDate: "1969-11-02",
    showIdentifier: "gd69-11-02.sbd.goodbear.1125.sbefail.shnf",
    tier: 2,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Death Don't Have No Mercy",
    showDate: "1969-02-22",
    showIdentifier: "gd69-02-22.sbd.owen.7860.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Death Don't Have No Mercy",
    showDate: "1969-01-26",
    showIdentifier: "gd69-01-26.sbd.kaplan.2246.sbeok.shnf",
    tier: 2,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Death Don't Have No Mercy",
    showDate: "1969-04-20",
    showIdentifier: "gd69-04-20.sbd.lutch.4992.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Race Is On",
    showDate: "1980-10-13",
    showIdentifier: "gd80-10-13.acoustic-sbd.munder.13064.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Race Is On",
    showDate: "1974-06-16",
    showIdentifier: "gd74-06-16.sbd.fink.17701.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Race Is On",
    showDate: "1986-05-03",
    showIdentifier: "gd86-05-03.sbd.hinko.18375.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Race Is On",
    showDate: "1973-11-14",
    showIdentifier: "gd73-11-14.sbd.vernon.5612.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Race Is On",
    showDate: "1974-09-18",
    showIdentifier: "gd74-09-18.sbd.miller.20732.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Race Is On",
    showDate: "1973-03-28",
    showIdentifier: "gd1973-03-28.beyer.backstrom.miller.74682.sbeok.flac16",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Race Is On",
    showDate: "1973-03-24",
    showIdentifier: "gd73-03-24.sbd.bertha-ashley.25508.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Picasso Moon",
    showDate: "1993-03-17",
    showIdentifier: "gd93-03-17.sbd.ladner.4979.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Picasso Moon",
    showDate: "1991-05-12",
    showIdentifier: "gd91-05-12.sbd.clugston.7362.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Picasso Moon",
    showDate: "1993-04-02",
    showIdentifier: "gd93-04-02.sbd.carr.13500.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Picasso Moon",
    showDate: "1990-03-19",
    showIdentifier: "gd90-03-19.prefm-sbd.sacks.1526.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Picasso Moon",
    showDate: "1990-09-18",
    showIdentifier: "gd90-09-18.sbd.miller.12885.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Picasso Moon",
    showDate: "1990-03-26",
    showIdentifier: "gd90-03-26.sbd.gorinsky.8508.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Picasso Moon",
    showDate: "1991-06-09",
    showIdentifier: "gd91-06-09.sbd.unknown.12756.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - All New Minglewood Blues",
    showDate: "1987-07-26",
    showIdentifier: "gd1987-07-26.nak700.yamaguchi-poris.russjcan.98214.flac16",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - All New Minglewood Blues",
    showDate: "1977-05-08",
    showIdentifier: "gd77-05-08.sbd.hicks.4982.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - All New Minglewood Blues",
    showDate: "1977-11-04",
    showIdentifier: "gd77-11-04.sbd.unknown.2595.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - All New Minglewood Blues",
    showDate: "1977-05-13",
    showIdentifier: "gd77-05-13.sbd.miller.9393.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - All New Minglewood Blues",
    showDate: "1971-04-29",
    showIdentifier: "gd71-04-29.sbd.frisco.16782.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - All New Minglewood Blues",
    showDate: "1971-02-24",
    showIdentifier: "gd71-02-24.sbd.orf.114.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - All New Minglewood Blues",
    showDate: "1987-10-03",
    showIdentifier: "gd87-10-03.sbd.bertha-ashley.7368.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Attics of My Life",
    showDate: "1989-10-16",
    showIdentifier: "gd89-10-16.dsbd.barrick.446.sbeok.shnf",
    tier: 2,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Attics of My Life",
    showDate: "1970-06-06",
    showIdentifier: "gd70-06-06.sbd.ashley.2172.sbeok.shnf",
    tier: 2,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Attics of My Life",
    showDate: "1970-05-15",
    showIdentifier: "gd70-05-15.early-late.sbd.97.sbeok.shnf",
    tier: 2,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Attics of My Life",
    showDate: "1970-09-20",
    showIdentifier: "gd70-09-20.aud.remaster.sirmick.27583.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Attics of My Life",
    showDate: "1990-03-30",
    showIdentifier: "gd90-03-30.sbd.gorinsky.8511.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Attics of My Life",
    showDate: "1970-05-14",
    showIdentifier: "gd70-05-14.sbd.cotsman.12439.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Attics of My Life",
    showDate: "1994-10-14",
    showIdentifier: "gd94-10-14.sbd.perkins.9054.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Know You Rider",
    showDate: "1973-03-31",
    showIdentifier: "gd73-03-31.sbd.yerys.2237.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Know You Rider",
    showDate: "1970-05-15",
    showIdentifier: "gd70-05-15.early-late.sbd.97.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Know You Rider",
    showDate: "1989-08-05",
    showIdentifier: "gd89-08-05.sbd.18256.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Know You Rider",
    showDate: "1966-07-03",
    showIdentifier: "gd66-07-03.sbd.unknown.40.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Know You Rider",
    showDate: "1985-11-10",
    showIdentifier: "gd85-11-10.sbd.barbella.12264.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Know You Rider",
    showDate: "1974-05-19",
    showIdentifier: "gd74-05-19.sbd.clugston.6957.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Know You Rider",
    showDate: "1988-07-29",
    showIdentifier: "gd88-07-29.sbd.hayum.5395.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mister Charlie",
    showDate: "1972-04-14",
    showIdentifier: "gd72-04-14.sbd.hurwitt.8828.sbeok.shnf",
    tier: 2,
    votes: 33,
    notes: "33 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mister Charlie",
    showDate: "1972-04-26",
    showIdentifier: "gd1972-04-26.sbd.vernon.9197.sbeok.shnf",
    tier: 2,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mister Charlie",
    showDate: "1972-04-08",
    showIdentifier: "gd72-04-08.sbd.giles-jeffm.2534.sbeok.shnf",
    tier: 2,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mister Charlie",
    showDate: "1972-05-04",
    showIdentifier: "gd1972-05-04.sbd.miller.77294.sbeok.flac16",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mister Charlie",
    showDate: "1972-05-16",
    showIdentifier: "gd72-05-16.sbd.unknown.10353.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mister Charlie",
    showDate: "1971-12-02",
    showIdentifier: "gd71-12-02.sbd.lai.6255.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mister Charlie",
    showDate: "1972-04-21",
    showIdentifier: "gd72-04-21.fm.vernon.9380.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Muddy River",
    showDate: "1989-04-03",
    showIdentifier: "gd89-04-03.sbd.harrel.7507.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Muddy River",
    showDate: "1990-03-14",
    showIdentifier: "gd90-03-14.sbd.ladner.8466.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Muddy River",
    showDate: "1986-12-15",
    showIdentifier: "gd86-12-15.nakcm101-dwonk.25263.sbeok.flacf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Muddy River",
    showDate: "1987-05-10",
    showIdentifier: "gd87-05-10.sbd.schneiderman.2256.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Muddy River",
    showDate: "1988-07-29",
    showIdentifier: "gd88-07-29.sbd.hayum.5395.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Muddy River",
    showDate: "1986-12-27",
    showIdentifier: "gd86-12-27.sbd.candyman.9152.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Black Muddy River",
    showDate: "1987-04-11",
    showIdentifier: "gd87-04-11.prefm.unknown.22934.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Deep Elem Blues",
    showDate: "1970-09-20",
    showIdentifier: "gd70-09-20.aud.remaster.sirmick.27583.sbeok.shnf",
    tier: 2,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Deep Elem Blues",
    showDate: "1980-10-11",
    showIdentifier: "gd80-10-11.acoustic-sbd.windsor.323.sbefail.shnf",
    tier: 2,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Deep Elem Blues",
    showDate: "1980-11-28",
    showIdentifier: "gd80-11-28.sbd.vernon.20049.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Deep Elem Blues",
    showDate: "1983-09-24",
    showIdentifier: "gd83-09-24.neumann.wiley.9200.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Deep Elem Blues",
    showDate: "1970-05-01",
    showIdentifier: "gd70-05-01.sbd.clugston.5465.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Deep Elem Blues",
    showDate: "1970-05-15",
    showIdentifier: "gd70-05-15.early-late.sbd.97.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Deep Elem Blues",
    showDate: "1970-08-05",
    showIdentifier: "gd70-08-05.sbd.jupile.17271.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Smokestack Lightnin'",
    showDate: "1972-03-25",
    showIdentifier: "gd72-03-25.aud.hanno.8838.sbeok.shnf",
    tier: 2,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Smokestack Lightnin'",
    showDate: "1970-02-08",
    showIdentifier: "gd70-02-08.sbd-aud.cotsman.19152.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Smokestack Lightnin'",
    showDate: "1971-02-19",
    showIdentifier: "gd71-02-19.sbd.orf.1029.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Smokestack Lightnin'",
    showDate: "1984-10-20",
    showIdentifier: "gd84-10-20.sbd.mattman.15673.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Smokestack Lightnin'",
    showDate: "1986-12-27",
    showIdentifier: "gd86-12-27.sbd.candyman.9152.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Smokestack Lightnin'",
    showDate: "1969-12-21",
    showIdentifier: "gd69-12-21.sbd.vernon.12927.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Smokestack Lightnin'",
    showDate: "1989-07-15",
    showIdentifier: "gd89-07-15.sbd.11266.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lazy River Road",
    showDate: "1994-10-14",
    showIdentifier: "gd94-10-14.sbd.perkins.9054.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lazy River Road",
    showDate: "1993-03-17",
    showIdentifier: "gd93-03-17.sbd.ladner.4979.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lazy River Road",
    showDate: "1993-08-21",
    showIdentifier: "gd93-08-21.sbd.nawrocki.15035.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lazy River Road",
    showDate: "1994-07-31",
    showIdentifier: "gd94-07-31.sbd.runyon.2593.sbefail.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lazy River Road",
    showDate: "1993-06-23",
    showIdentifier: "gd93-06-23.sbd.braverman.14123.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lazy River Road",
    showDate: "1993-06-26",
    showIdentifier: "gd93-06-26.sbd.peich.7742.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lazy River Road",
    showDate: "1994-10-05",
    showIdentifier: "gd94-10-05.sbd.unknown.8030.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feelin' Groovy Jam",
    showDate: "1972-04-14",
    showIdentifier: "gd72-04-14.sbd.hurwitt.8828.sbeok.shnf",
    tier: 2,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feelin' Groovy Jam",
    showDate: "1970-09-19",
    showIdentifier: "gd70-09-19.sbd.kaplan.5217.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feelin' Groovy Jam",
    showDate: "1970-06-24",
    showIdentifier: "gd_nrps70-06-24.aud.pcrp5.23062.sbeok.flacf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feelin' Groovy Jam",
    showDate: "1972-05-25",
    showIdentifier: "gd72-05-25.psbd.hamilton.147.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feelin' Groovy Jam",
    showDate: "1969-11-02",
    showIdentifier: "gd69-11-02.sbd.goodbear.1125.sbefail.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feelin' Groovy Jam",
    showDate: "1969-10-25",
    showIdentifier: "gd69-10-25.sbd.jagla.81.sbefail.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feelin' Groovy Jam",
    showDate: "1971-07-31",
    showIdentifier: "gd71-07-31.winberg.weiner.5678.gdADT05.sbefail.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Corrina",
    showDate: "1995-03-23",
    showIdentifier: "gd95-03-23.sbd.miller.25273.sbeok.flacf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Corrina",
    showDate: "1993-06-11",
    showIdentifier: "gd93-06-11.sbd.gans.19217.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Corrina",
    showDate: "1992-06-20",
    showIdentifier: "gd92-06-20.dsbd.gardner.2207.sbefail.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Corrina",
    showDate: "1995-07-09",
    showIdentifier: "gd95-07-09.sbd.7233.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Corrina",
    showDate: "1993-03-27",
    showIdentifier: "gd93-03-27.sbd.nawrocki.31956.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Corrina",
    showDate: "1994-07-20",
    showIdentifier: "gd94-07-20.sbd.darkstar.12596.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Corrina",
    showDate: "1994-02-27",
    showIdentifier: "gd94-02-27.sbd.stephens.5972.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Gimme Some Loving",
    showDate: "1990-03-26",
    showIdentifier: "gd90-03-26.sbd.gorinsky.8508.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Gimme Some Loving",
    showDate: "1985-06-15",
    showIdentifier: "gd85-06-15.sbd.griesman.5682.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Gimme Some Loving",
    showDate: "1985-06-25",
    showIdentifier: "gd85-06-25.sbd.miller.18663.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Gimme Some Loving",
    showDate: "1985-11-16",
    showIdentifier: "gd85-11-16.sbd.18374.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Gimme Some Loving",
    showDate: "1986-07-04",
    showIdentifier: "gd86-07-04.senn-satellite.carman.13565.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Gimme Some Loving",
    showDate: "1984-11-02",
    showIdentifier: "gd84-11-02.sbd.connor.10172.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Gimme Some Loving",
    showDate: "1990-03-30",
    showIdentifier: "gd90-03-30.sbd.gorinsky.8511.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Fire On The Mountain",
    showDate: "1973-07-27",
    showIdentifier: "gd73-07-27.sbd.weiner.180.sbeok.shnf",
    tier: 2,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Fire On The Mountain",
    showDate: "1986-07-04",
    showIdentifier: "gd86-07-04.senn-satellite.carman.13565.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Fire On The Mountain",
    showDate: "1993-05-27",
    showIdentifier: "gd93-05-27.sbd.georges.1932.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Fire On The Mountain",
    showDate: "1991-09-20",
    showIdentifier: "gd91-09-20.sbd.ladner.21647.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Fire On The Mountain",
    showDate: "1978-11-24",
    showIdentifier: "gd78-11-24.sbd.prefm.13948.sbefail.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Fire On The Mountain",
    showDate: "1978-12-31",
    showIdentifier: "gd78-12-31.sbd.ashley.1667.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Fire On The Mountain",
    showDate: "1976-06-28",
    showIdentifier: "gd76-06-28.shure.minches.18388.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ripple",
    showDate: "1988-09-03",
    showIdentifier: "gd88-09-03.sbd.miller.27749.sbeok.flacf",
    tier: 2,
    votes: 39,
    notes: "39 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ripple",
    showDate: "1971-02-21",
    showIdentifier: "gd71-02-21.sbd.lunz.1980.sbeok.shnf",
    tier: 2,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ripple",
    showDate: "1970-11-08",
    showIdentifier: "gd1970-11-08.aud.weiner.28609.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ripple",
    showDate: "1971-02-20",
    showIdentifier: "gd71-02-20.sbd.orf.111.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ripple",
    showDate: "1980-12-06",
    showIdentifier: "gd80-12-06.cantor.clugston.5478.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ripple",
    showDate: "1980-10-09",
    showIdentifier: "gd80-10-09.sbd.unknown.11042.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ripple",
    showDate: "1971-04-28",
    showIdentifier: "gd71-04-28.sbd.murphy.2248.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Days Between",
    showDate: "1994-07-24",
    showIdentifier: "gd94-07-24.aud.candyman.10087.sbeok.shnf",
    tier: 2,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Days Between",
    showDate: "1995-06-24",
    showIdentifier: "gd95-06-24.naks.12271.sbeok.shnf",
    tier: 2,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Days Between",
    showDate: "1993-03-17",
    showIdentifier: "gd93-03-17.sbd.ladner.4979.sbeok.shnf",
    tier: 2,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Days Between",
    showDate: "1993-03-27",
    showIdentifier: "gd93-03-27.sbd.nawrocki.31956.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Days Between",
    showDate: "1993-08-22",
    showIdentifier: "gd93-08-22.sbd.nawrocki.562.sbefail.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Days Between",
    showDate: "1994-09-18",
    showIdentifier: "gd94-09-18.nak300.ladner.10069.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Days Between",
    showDate: "1993-09-13",
    showIdentifier: "gd93-09-13.sbd.miller-wiley.12096.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sing Me Back Home",
    showDate: "1973-03-24",
    showIdentifier: "gd73-03-24.sbd.bertha-ashley.25508.sbeok.shnf",
    tier: 2,
    votes: 33,
    notes: "33 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sing Me Back Home",
    showDate: "1972-05-04",
    showIdentifier: "gd1972-05-04.sbd.miller.77294.sbeok.flac16",
    tier: 2,
    votes: 30,
    notes: "30 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sing Me Back Home",
    showDate: "1972-05-07",
    showIdentifier: "gd72-05-07.sbd-aud.clugston.9193.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sing Me Back Home",
    showDate: "1971-04-25",
    showIdentifier: "gd71-04-25.sbd.grote.8761.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sing Me Back Home",
    showDate: "1972-05-18",
    showIdentifier: "gd72-05-18.sbd.unicorn.2266.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sing Me Back Home",
    showDate: "1972-05-10",
    showIdentifier: "gd72-05-10.sbd.kaplan.1582.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sing Me Back Home",
    showDate: "1972-05-03",
    showIdentifier: "gd72-05-03.sbd.masse.142.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Weight",
    showDate: "1991-06-17",
    showIdentifier: "gd91-06-17.sbd.gardner.3591.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Weight",
    showDate: "1990-03-28",
    showIdentifier: "gd90-03-28.sbd.gorinsky.8510.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Weight",
    showDate: "1990-07-12",
    showIdentifier: "gd90-07-12.sbd.mcatee.2582.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Weight",
    showDate: "1993-03-25",
    showIdentifier: "gd93-03-25.sbd.nawrocki.16433.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Weight",
    showDate: "1994-03-25",
    showIdentifier: "gd94-03-25.naks.ladner.14189.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Weight",
    showDate: "1991-06-22",
    showIdentifier: "gd1991-06-22.sbd.unknown.29057.sbe-fix.flac16",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Weight",
    showDate: "1990-09-15",
    showIdentifier: "gd90-09-15.sbd.barbella.7770.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Viola Lee Blues",
    showDate: "1969-04-26",
    showIdentifier: "gd69-04-26.sbd.yerys.71.sbeok.shnf",
    tier: 2,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Viola Lee Blues",
    showDate: "1968-02-02",
    showIdentifier: "gd68-02-02.sbd.jools.15801.sbeok.shnf",
    tier: 2,
    votes: 27,
    notes: "27 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Viola Lee Blues",
    showDate: "1967-03-18",
    showIdentifier: "gd67-03-18.sbd.fink.10282.sbeok.shnf",
    tier: 2,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Viola Lee Blues",
    showDate: "1970-03-21",
    showIdentifier: "gd70-03-21.early.lee.pcrp.20184.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Viola Lee Blues",
    showDate: "1966-12-01",
    showIdentifier: "gd66-12-01.sbd.ladner.8575.sbeok.shnf",
    tier: 2,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Viola Lee Blues",
    showDate: "1967-01-14",
    showIdentifier: "gd67-01-14.sbd.vernon.9108.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Viola Lee Blues",
    showDate: "1968-01-20",
    showIdentifier: "gd68-01-20.sbd.jools.19470.sbe-fixed.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Fought The Law",
    showDate: "1993-06-08",
    showIdentifier: "gd93-06-08.sbd.stephens.6673.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Fought The Law",
    showDate: "1993-06-21",
    showIdentifier: "gd93-06-21.sbd.braverman.14121.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Fought The Law",
    showDate: "1993-03-18",
    showIdentifier: "gd93-03-18.ST250.ladner.16814.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Fought The Law",
    showDate: "1993-04-05",
    showIdentifier: "gd93-04-05.sbd.gardner.12095.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Fought The Law",
    showDate: "1993-05-14",
    showIdentifier: "gd93-05-14.aud.fink.17812.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Fought The Law",
    showDate: "1993-05-22",
    showIdentifier: "gd93-05-22.sbd.gardner.9401.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Fought The Law",
    showDate: "1993-09-17",
    showIdentifier: "gd93-09-17.ams.georges.5704.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Cat Sunflower",
    showDate: "1969-05-24",
    showIdentifier: "gd69-05-24.sbd.kpfa.16177.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Cat Sunflower",
    showDate: "1974-06-26",
    showIdentifier: "gd74-06-26.moore.weiner.gdADT17.16037.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Cat Sunflower",
    showDate: "1969-06-08",
    showIdentifier: "gd69-06-08.sbd.cotsman.19285.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Cat Sunflower",
    showDate: "1968-01-17",
    showIdentifier: "gd1968-01-17.sbd.cotsman.11795.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Cat Sunflower",
    showDate: "1968-03-16",
    showIdentifier: "gd68-03-16.sbd.vernon.9388.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Cat Sunflower",
    showDate: "1988-07-29",
    showIdentifier: "gd88-07-29.sbd.hayum.5395.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Cat Sunflower",
    showDate: "1968-02-03",
    showIdentifier: "gd68-02-03.sbd.jools.14987.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Doin' That Rag",
    showDate: "1969-03-01",
    showIdentifier: "gd69-03-01.sbd.16track.kaplan.4030.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Doin' That Rag",
    showDate: "1969-04-26",
    showIdentifier: "gd69-04-26.sbd.yerys.71.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Doin' That Rag",
    showDate: "1969-03-02",
    showIdentifier: "gd69-03-02.sbd.16track.kaplan.3344.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Doin' That Rag",
    showDate: "1969-05-24",
    showIdentifier: "gd69-05-24.sbd.kpfa.16177.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Doin' That Rag",
    showDate: "1969-04-25",
    showIdentifier: "gd1969-04-25.sbd.miller.97392.sbeok.flac16",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Doin' That Rag",
    showDate: "1969-02-27",
    showIdentifier: "gd69-02-27.sbd.16track.kaplan.6315.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Doin' That Rag",
    showDate: "1969-04-20",
    showIdentifier: "gd69-04-20.sbd.lutch.4992.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy Wind",
    showDate: "1969-12-12",
    showIdentifier: "gd69-12-12.sbd.gerland.10988.sbeok.shnf",
    tier: 2,
    votes: 26,
    notes: "26 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy Wind",
    showDate: "1970-12-26",
    showIdentifier: "gd70-12-26.sbd.miller.22369.sbeok.shnf",
    tier: 2,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy Wind",
    showDate: "1969-11-08",
    showIdentifier: "gd69-11-08.weinberg.warner.26331.sbeok.flacf",
    tier: 2,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy Wind",
    showDate: "1971-02-19",
    showIdentifier: "gd71-02-19.sbd.orf.1029.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy Wind",
    showDate: "1970-01-16",
    showIdentifier: "gd70-01-16.sbd.popi.7111.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy Wind",
    showDate: "1970-05-07",
    showIdentifier: "gd70-05-07.aud.weiner-gdADT04.5439.sbefail.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy Wind",
    showDate: "1971-04-04",
    showIdentifier: "gd71-04-04.aud.cotsman.10358.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cosmic Charlie",
    showDate: "1969-03-01",
    showIdentifier: "gd69-03-01.sbd.16track.kaplan.4030.sbeok.shnf",
    tier: 2,
    votes: 31,
    notes: "31 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cosmic Charlie",
    showDate: "1970-05-15",
    showIdentifier: "gd70-05-15.early-late.sbd.97.sbeok.shnf",
    tier: 2,
    votes: 24,
    notes: "24 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cosmic Charlie",
    showDate: "1969-02-27",
    showIdentifier: "gd69-02-27.sbd.16track.kaplan.6315.sbeok.shnf",
    tier: 2,
    votes: 23,
    notes: "23 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cosmic Charlie",
    showDate: "1976-07-16",
    showIdentifier: "gd76-07-16.menke.cribbs.16943.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cosmic Charlie",
    showDate: "1976-09-25",
    showIdentifier: "gd76-09-25.sbd.aj.246.sbefail.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cosmic Charlie",
    showDate: "1969-01-25",
    showIdentifier: "gd69-01-25.sbd.kaplan.7923.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cosmic Charlie",
    showDate: "1976-06-04",
    showIdentifier: "gd76-06-04.sbd.cotsman.9797.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sitting on Top of the World",
    showDate: "1971-12-10",
    showIdentifier: "gd71-12-10.sbd.yerys.1311.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sitting on Top of the World",
    showDate: "1972-05-18",
    showIdentifier: "gd72-05-18.sbd.unicorn.2266.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sitting on Top of the World",
    showDate: "1970-02-08",
    showIdentifier: "gd70-02-08.sbd-aud.cotsman.19152.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sitting on Top of the World",
    showDate: "1972-05-25",
    showIdentifier: "gd72-05-25.psbd.hamilton.147.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sitting on Top of the World",
    showDate: "1969-06-07",
    showIdentifier: "gd69-06-07.sbd.kaplan.9074.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sitting on Top of the World",
    showDate: "1966-07-03",
    showIdentifier: "gd66-07-03.sbd.unknown.40.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sitting on Top of the World",
    showDate: "1970-09-20",
    showIdentifier: "gd70-09-20.aud.remaster.sirmick.27583.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Mighty Quinn (Quinn The Eskimo)",
    showDate: "1991-09-25",
    showIdentifier: "gd91-09-25.nak.dodd.16667.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Mighty Quinn (Quinn The Eskimo)",
    showDate: "1990-09-19",
    showIdentifier: "gd1990-09-19.bk4011.tdarian.french.88969.sbeok.flac16",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Mighty Quinn (Quinn The Eskimo)",
    showDate: "1986-12-27",
    showIdentifier: "gd86-12-27.sbd.candyman.9152.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Mighty Quinn (Quinn The Eskimo)",
    showDate: "1987-10-03",
    showIdentifier: "gd87-10-03.sbd.bertha-ashley.7368.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Mighty Quinn (Quinn The Eskimo)",
    showDate: "1994-10-05",
    showIdentifier: "gd94-10-05.sbd.unknown.8030.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Mighty Quinn (Quinn The Eskimo)",
    showDate: "1988-07-02",
    showIdentifier: "gd88-07-02.sbd-matrix.dan.21211.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Mighty Quinn (Quinn The Eskimo)",
    showDate: "1990-03-25",
    showIdentifier: "gd90-03-25.fob-schoeps-mattes.miller.28389.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Liberty",
    showDate: "1993-05-26",
    showIdentifier: "gd93-05-26.sbd.georges.1958.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Liberty",
    showDate: "1995-05-29",
    showIdentifier: "gd95-05-29.schoeps.10070.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Liberty",
    showDate: "1995-02-21",
    showIdentifier: "gd95-02-21.dsbd.stephens.8840.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Liberty",
    showDate: "1994-10-01",
    showIdentifier: "gd94-10-01.sbd.ashley-bertha.14869.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Liberty",
    showDate: "1993-03-29",
    showIdentifier: "gd93-03-29.sbd.wiley.13512.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Liberty",
    showDate: "1993-03-11",
    showIdentifier: "gd93-03-11.sbd.wharfrat.10383.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Liberty",
    showDate: "1993-08-22",
    showIdentifier: "gd93-08-22.sbd.nawrocki.562.sbefail.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - When Push Comes to Shove",
    showDate: "1987-07-24",
    showIdentifier: "gd1987-07-24.pzm.russjcan.92568.sbeok.flac16",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - When Push Comes to Shove",
    showDate: "1987-07-10",
    showIdentifier: "gd87-07-10.senn.lai.3859.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - When Push Comes to Shove",
    showDate: "1988-03-18",
    showIdentifier: "gd88-03-18.sbd.samaritano.21298.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - When Push Comes to Shove",
    showDate: "1987-08-11",
    showIdentifier: "gd87-08-11.sbd.4951.5247.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - When Push Comes to Shove",
    showDate: "1987-06-26",
    showIdentifier: "gd87-06-26.bille.kerbel.8138.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - When Push Comes to Shove",
    showDate: "1988-04-01",
    showIdentifier: "gd88-04-01.sbd-matrix.braverman.11264.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - When Push Comes to Shove",
    showDate: "1989-06-19",
    showIdentifier: "gd1989-06-19.sbd.walker-scotton.miller.83673.sbeok.flac16",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Far From Me",
    showDate: "1990-06-23",
    showIdentifier: "gd90-06-23.sbd.ladner.28690.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Far From Me",
    showDate: "1990-03-21",
    showIdentifier: "gd90-03-21.sbd.heath.5307.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Far From Me",
    showDate: "1990-07-14",
    showIdentifier: "gd90-07-14.sbd.georges.463.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Far From Me",
    showDate: "1987-07-24",
    showIdentifier: "gd1987-07-24.pzm.russjcan.92568.sbeok.flac16",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Far From Me",
    showDate: "1987-10-02",
    showIdentifier: "gd87-10-02.sbd.bertha-ashley.7367.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Far From Me",
    showDate: "1983-04-13",
    showIdentifier: "gd83-04-13.horvath-sennheiser.ladner.21921.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Far From Me",
    showDate: "1982-09-24",
    showIdentifier: "gd82-09-24.sbd.lutch-dankseed.4994.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Midnight Hour",
    showDate: "1966-09-16",
    showIdentifier: "gd66-09-16.sbd.vernon.9127.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Midnight Hour",
    showDate: "1985-04-08",
    showIdentifier: "gd85-04-08.sbd.wiley.8755.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Midnight Hour",
    showDate: "1970-06-04",
    showIdentifier: "gd70-06-04.sbd.miller.12135.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Midnight Hour",
    showDate: "1968-02-14",
    showIdentifier: "gd68-02-14.sbd.kaplan.15640.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Midnight Hour",
    showDate: "1969-11-02",
    showIdentifier: "gd69-11-02.sbd.goodbear.1125.sbefail.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Midnight Hour",
    showDate: "1966-07-03",
    showIdentifier: "gd66-07-03.sbd.unknown.40.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Midnight Hour",
    showDate: "1985-06-27",
    showIdentifier: "gd85-06-27.sbd.miller.27863.sbeok.flacf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Last Time",
    showDate: "1993-06-26",
    showIdentifier: "gd93-06-26.sbd.peich.7742.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Last Time",
    showDate: "1991-12-30",
    showIdentifier: "gd91-12-30.b_ks.georges.6812.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Last Time",
    showDate: "1990-04-02",
    showIdentifier: "gd90-04-02.sbd.dodd.17731.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Last Time",
    showDate: "1994-10-07",
    showIdentifier: "gd94-10-07.aud.wiley.7993.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Last Time",
    showDate: "1994-10-01",
    showIdentifier: "gd94-10-01.sbd.ashley-bertha.14869.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Last Time",
    showDate: "1993-08-21",
    showIdentifier: "gd93-08-21.sbd.nawrocki.15035.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Last Time",
    showDate: "1992-06-28",
    showIdentifier: "gd92-06-28.sbd.braverman.8601.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Monkey and the Engineer",
    showDate: "1970-01-02",
    showIdentifier: "gd70-01-02.early-late.sbd.cotsman.18120.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Monkey and the Engineer",
    showDate: "1969-12-26",
    showIdentifier: "gd69-12-26.sbd.murphy.1821.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Monkey and the Engineer",
    showDate: "1970-12-31",
    showIdentifier: "gd70-12-31.aftershow.sbd.cole.6171.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Monkey and the Engineer",
    showDate: "1980-10-11",
    showIdentifier: "gd80-10-11.acoustic-sbd.windsor.323.sbefail.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Monkey and the Engineer",
    showDate: "1981-10-16",
    showIdentifier: "gd81-10-16.sbd.vinson.1217.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Monkey and the Engineer",
    showDate: "1970-02-04",
    showIdentifier: "gd70-02-04.sbd.kaplan.14188.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Monkey and the Engineer",
    showDate: "1980-10-06",
    showIdentifier: "gd80-10-06.acoustic-sbd.8779.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Broken Arrow",
    showDate: "1993-05-26",
    showIdentifier: "gd93-05-26.sbd.georges.1958.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Broken Arrow",
    showDate: "1993-08-22",
    showIdentifier: "gd93-08-22.sbd.nawrocki.562.sbefail.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Broken Arrow",
    showDate: "1995-06-03",
    showIdentifier: "gd95-06-03.naks.10153.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Broken Arrow",
    showDate: "1995-07-02",
    showIdentifier: "gd95-07-02.aud.ball.587.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Broken Arrow",
    showDate: "1993-06-06",
    showIdentifier: "gd93-06-06.sbd.wiley.8329.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Broken Arrow",
    showDate: "1993-06-23",
    showIdentifier: "gd93-06-23.sbd.braverman.14123.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Broken Arrow",
    showDate: "1994-07-19",
    showIdentifier: "gd94-07-19.sbd.carr.8476.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - King Bee",
    showDate: "1971-02-21",
    showIdentifier: "gd71-02-21.sbd.lunz.1980.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - King Bee",
    showDate: "1970-01-24",
    showIdentifier: "gd70-01-24.sbd.kaplan.7890.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - King Bee",
    showDate: "1971-04-17",
    showIdentifier: "gd71-04-17.sbd.nayfield.121.122.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - King Bee",
    showDate: "1993-12-08",
    showIdentifier: "gd93-12-08.sbd.larson-ladner.10281.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - King Bee",
    showDate: "1966-02-25",
    showIdentifier: "gd66-02-25.sbd.unknown.1593.sbefail.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - King Bee",
    showDate: "1969-04-06",
    showIdentifier: "gd69-04-06.sbd.fm.cotsman.9492.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Potato Caboose",
    showDate: "1968-10-12",
    showIdentifier: "gd68-10-12.sbd.eD.10909.sbeok.shnf",
    tier: 2,
    votes: 33,
    notes: "33 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Potato Caboose",
    showDate: "1967-10-22",
    showIdentifier: "gd67-10-22.sbd.miller.18101.sbeok.shnf",
    tier: 2,
    votes: 29,
    notes: "29 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Potato Caboose",
    showDate: "1969-06-08",
    showIdentifier: "gd69-06-08.sbd.cotsman.19285.sbeok.shnf",
    tier: 2,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Potato Caboose",
    showDate: "1967-11-10",
    showIdentifier: "gd67-11-10.sbd.sacks.1612.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Potato Caboose",
    showDate: "1968-01-20",
    showIdentifier: "gd68-01-20.sbd.jools.19470.sbe-fixed.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Potato Caboose",
    showDate: "1969-01-24",
    showIdentifier: "gd69-01-24.sbd.kaplan.7922.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Potato Caboose",
    showDate: "1968-02-24",
    showIdentifier: "gd1968-02-24.167922.2nd.set.fm.smith.miller.clugston.flac1648",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Nobody's Fault But Mine",
    showDate: "1974-06-16",
    showIdentifier: "gd74-06-16.sbd.fink.17701.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Nobody's Fault But Mine",
    showDate: "1973-11-21",
    showIdentifier: "gd73-11-21.sbd.barrick.192.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Nobody's Fault But Mine",
    showDate: "1974-07-29",
    showIdentifier: "gd74-07-29.sbd.goodbear.2277.sbefail.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Nobody's Fault But Mine",
    showDate: "1973-12-10",
    showIdentifier: "gd73-12-10pt.sbd.elliot.11800.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Nobody's Fault But Mine",
    showDate: "1973-12-08",
    showIdentifier: "gd73-12-08.sbd.gustin.1811.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Nobody's Fault But Mine",
    showDate: "1974-02-22",
    showIdentifier: "gd74-02-22.sbd.patched.sirmick.21539.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Nobody's Fault But Mine",
    showDate: "1973-05-20",
    showIdentifier: "gd73-05-20.sbd.weiner-warner.19564.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mind Left Body Jam",
    showDate: "1973-10-19",
    showIdentifier: "gd73-10-19.sbd.nayfield.187.sbeok.shnf",
    tier: 2,
    votes: 58,
    notes: "58 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mind Left Body Jam",
    showDate: "1973-12-02",
    showIdentifier: "gd73-12-02.aud.vernon.17278.sbeok.shnf",
    tier: 2,
    votes: 56,
    notes: "56 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mind Left Body Jam",
    showDate: "1990-03-24",
    showIdentifier: "gd90-03-24.schoeps.wiley.11806.sbeok.shnf",
    tier: 2,
    votes: 38,
    notes: "38 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mind Left Body Jam",
    showDate: "1974-07-31",
    showIdentifier: "gd74-07-31.sbd.ziggy.1019.sbeok.shnf",
    tier: 2,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mind Left Body Jam",
    showDate: "1972-09-21",
    showIdentifier: "gd72-09-21.sbd.masse.7296.sbeok.shnf",
    tier: 2,
    votes: 25,
    notes: "25 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mind Left Body Jam",
    showDate: "1972-04-08",
    showIdentifier: "gd72-04-08.sbd.giles-jeffm.2534.sbeok.shnf",
    tier: 2,
    votes: 20,
    notes: "20 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mind Left Body Jam",
    showDate: "1974-06-16",
    showIdentifier: "gd74-06-16.sbd.fink.17701.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Way To Go Home",
    showDate: "1992-05-30",
    showIdentifier: "gd92-05-30.schoeps.ladner.10063.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Way To Go Home",
    showDate: "1992-03-01",
    showIdentifier: "gd92-03-01.schoeps.gardner.4736.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Way To Go Home",
    showDate: "1994-10-01",
    showIdentifier: "gd94-10-01.sbd.ashley-bertha.14869.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Way To Go Home",
    showDate: "1994-10-06",
    showIdentifier: "gd94-10-06.nak300.ericb.7743.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Way To Go Home",
    showDate: "1992-12-02",
    showIdentifier: "gd92-12-02.aud.ststephen.12228.sbefail.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Way To Go Home",
    showDate: "1994-06-14",
    showIdentifier: "gd94-06-14.sbd.larson.12523.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Way To Go Home",
    showDate: "1995-06-28",
    showIdentifier: "gd95-06-28.schoeps.10154.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let The Good Times Roll",
    showDate: "1989-03-28",
    showIdentifier: "gd1989-03-28.sbd.walker-scotton.miller.81529.sbeok.flac16",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let The Good Times Roll",
    showDate: "1988-12-31",
    showIdentifier: "gd88-12-31.matrix.ashley-bertha.9396.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let The Good Times Roll",
    showDate: "1989-08-19",
    showIdentifier: "gd89-08-19.sbd.5213.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let The Good Times Roll",
    showDate: "1990-06-16",
    showIdentifier: "gd90-06-16.sbd.ladner.8571.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let The Good Times Roll",
    showDate: "1994-07-13",
    showIdentifier: "gd94-07-13.sbd.georges.17029.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let The Good Times Roll",
    showDate: "1989-08-06",
    showIdentifier: "gd89-08-06.sbd.12831.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let The Good Times Roll",
    showDate: "1989-10-11",
    showIdentifier: "gd89-10-11.sbd.clugston.6668.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Maggie's Farm",
    showDate: "1992-03-20",
    showIdentifier: "gd92-03-20.sbd.gardner.9757.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Maggie's Farm",
    showDate: "1991-09-22",
    showIdentifier: "gd91-09-22.sbd.fishman.17180.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Maggie's Farm",
    showDate: "1987-09-19",
    showIdentifier: "gd87-09-19.sbd.mccarthy.396.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Maggie's Farm",
    showDate: "1992-06-20",
    showIdentifier: "gd92-06-20.dsbd.gardner.2207.sbefail.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Maggie's Farm",
    showDate: "1992-06-26",
    showIdentifier: "gd92-06-26.aud.harlan.9118.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Maggie's Farm",
    showDate: "1991-12-30",
    showIdentifier: "gd91-12-30.b_ks.georges.6812.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Maggie's Farm",
    showDate: "1987-11-14",
    showIdentifier: "gd87-11-14.aud.willy.15823.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Spoonful",
    showDate: "1990-09-11",
    showIdentifier: "gd90-09-11.sbd-matrix.wiley.11809.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Spoonful",
    showDate: "1985-03-13",
    showIdentifier: "gd85-03-13.sbd.barbella.9961.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Spoonful",
    showDate: "1991-09-22",
    showIdentifier: "gd91-09-22.sbd.fishman.17180.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Spoonful",
    showDate: "1984-12-28",
    showIdentifier: "gd84-12-28.aud.unknown.16584.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Spoonful",
    showDate: "1990-03-18",
    showIdentifier: "gd90-03-18.sbd.huck.9364.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Spoonful",
    showDate: "1991-09-14",
    showIdentifier: "gd91-09-14.sbd.kowalski.522.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Spoonful",
    showDate: "1993-03-11",
    showIdentifier: "gd93-03-11.sbd.wharfrat.10383.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - On The Road Again",
    showDate: "1980-10-30",
    showIdentifier: "gd80-10-30.wise.larson.1954.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - On The Road Again",
    showDate: "1966-02-25",
    showIdentifier: "gd66-02-25.sbd.unknown.1593.sbefail.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - On The Road Again",
    showDate: "1980-11-26",
    showIdentifier: "gd1980-11-26.beyerm160.wise.miller.101699.flac16",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - On The Road Again",
    showDate: "1980-12-06",
    showIdentifier: "gd80-12-06.cantor.clugston.5478.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - On The Road Again",
    showDate: "1982-04-19",
    showIdentifier: "gd82-04-19.aud-martin.warner.19420.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - On The Road Again",
    showDate: "1980-10-10",
    showIdentifier: "gd80-10-10.sbd.cousinit.24710.sbefail.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - On The Road Again",
    showDate: "1980-09-30",
    showIdentifier: "gd80-09-30.menke.vernon.12882.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dark Hollow",
    showDate: "1970-02-14",
    showIdentifier: "gd70-02-14.early-late.sbd.cotsman.18115.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dark Hollow",
    showDate: "1971-02-19",
    showIdentifier: "gd71-02-19.sbd.orf.1029.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dark Hollow",
    showDate: "1980-10-30",
    showIdentifier: "gd80-10-30.wise.larson.1954.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dark Hollow",
    showDate: "1980-10-10",
    showIdentifier: "gd80-10-10.sbd.cousinit.24710.sbefail.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dark Hollow",
    showDate: "1978-11-17",
    showIdentifier: "gd78-11-17.acoustic.sbd.dodd.7687.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dark Hollow",
    showDate: "1980-10-07",
    showIdentifier: "gd80-10-07.menke.vernon.14046.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dark Hollow",
    showDate: "1980-10-09",
    showIdentifier: "gd80-10-09.sbd.unknown.11042.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Eternity",
    showDate: "1994-12-16",
    showIdentifier: "gd94-12-16.nak300.wankelswurth.10543.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Eternity",
    showDate: "1993-06-21",
    showIdentifier: "gd93-06-21.sbd.braverman.14121.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Eternity",
    showDate: "1994-10-17",
    showIdentifier: "gd94-10-17.sbd.carr.14615.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Eternity",
    showDate: "1993-02-21",
    showIdentifier: "gd93-02-21.aud.seff.1055.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Eternity",
    showDate: "1994-10-05",
    showIdentifier: "gd94-10-05.sbd.unknown.8030.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Eternity",
    showDate: "1993-12-10",
    showIdentifier: "gd93-12-10.sbd.georges.1599.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Eternity",
    showDate: "1993-03-25",
    showIdentifier: "gd93-03-25.sbd.nawrocki.16433.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Day Job",
    showDate: "1986-04-04",
    showIdentifier: "gd86-04-04.aud.eD.13464.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Day Job",
    showDate: "1982-09-15",
    showIdentifier: "gd82-09-15.sbd-patched.clugston.11881.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Day Job",
    showDate: "1982-12-26",
    showIdentifier: "gd82-12-26.sbd.clugston.6665.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Day Job",
    showDate: "1983-10-11",
    showIdentifier: "gd83-10-11.sbd.harrell.7339.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Day Job",
    showDate: "1983-09-24",
    showIdentifier: "gd83-09-24.neumann.wiley.9200.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Day Job",
    showDate: "1982-08-28",
    showIdentifier: "gd82-08-28.sbd.lai.2333.sbefail.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Day Job",
    showDate: "1985-09-02",
    showIdentifier: "gd85-09-02.sbd.hinko.19475.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Chinatown Shuffle",
    showDate: "1972-05-26",
    showIdentifier: "gd72-05-26.sbd.hollister.12758.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Chinatown Shuffle",
    showDate: "1972-04-24",
    showIdentifier: "gd72-04-24.sbd-aud.cotsman.16332.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Chinatown Shuffle",
    showDate: "1972-03-26",
    showIdentifier: "gd72-03-26.aud.hanno.15413.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Chinatown Shuffle",
    showDate: "1972-04-07",
    showIdentifier: "gd72-04-07.aud.hanno.6161.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Chinatown Shuffle",
    showDate: "1972-05-11",
    showIdentifier: "gd72-05-11.sbd.ashley-bertha.7364.sbefail.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Chinatown Shuffle",
    showDate: "1972-04-29",
    showIdentifier: "gd72-04-29.aud.vernon.5250.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Chinatown Shuffle",
    showDate: "1972-04-16",
    showIdentifier: "gd72-04-16.sbd.miller.18103.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Same Thing",
    showDate: "1992-03-20",
    showIdentifier: "gd92-03-20.sbd.gardner.9757.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Same Thing",
    showDate: "1971-12-31",
    showIdentifier: "gd71-12-31.fm.lanum.135.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Same Thing",
    showDate: "1992-12-16",
    showIdentifier: "gd92-12-16.sbd-2track.stonebear.5551.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Same Thing",
    showDate: "1993-05-27",
    showIdentifier: "gd93-05-27.sbd.georges.1932.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Same Thing",
    showDate: "1992-06-06",
    showIdentifier: "gd92-06-06.set2.sbd.herman.16815.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Same Thing",
    showDate: "1993-06-11",
    showIdentifier: "gd93-06-11.sbd.gans.19217.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Same Thing",
    showDate: "1993-03-10",
    showIdentifier: "gd93-03-10.sbd.ladner.2024.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sunrise",
    showDate: "1978-04-15",
    showIdentifier: "gd78-04-15.sbd.cotsman.7047.sbefail.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sunrise",
    showDate: "1977-05-26",
    showIdentifier: "gd77-05-26.sbd.sacks.3224.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sunrise",
    showDate: "1977-11-04",
    showIdentifier: "gd77-11-04.sbd.unknown.2595.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sunrise",
    showDate: "1977-05-17",
    showIdentifier: "gd77-05-17.sbd.weiner.18554.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sunrise",
    showDate: "1977-05-12",
    showIdentifier: "gd77-05-12.aud.clugston.6484.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sunrise",
    showDate: "1977-06-08",
    showIdentifier: "gd77-06-08.sbd.clugston.15421.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sunrise",
    showDate: "1977-10-02",
    showIdentifier: "gd77-10-02.sbd.unknown.278.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Never Trust A Woman",
    showDate: "1990-03-14",
    showIdentifier: "gd90-03-14.sbd.ladner.8466.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Never Trust A Woman",
    showDate: "1982-05-22",
    showIdentifier: "gd82-05-22.sbd.gorinsky.5215.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Never Trust A Woman",
    showDate: "1986-05-11",
    showIdentifier: "gd1986-05-11.sbd.walker-scotton.miller.81626.flac16",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Never Trust A Woman",
    showDate: "1982-04-03",
    showIdentifier: "gd82-04-03.sennheiser.fishman.23824.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Never Trust A Woman",
    showDate: "1981-08-31",
    showIdentifier: "gd81-08-31.aud.munder.9619.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Never Trust A Woman",
    showDate: "1990-07-23",
    showIdentifier: "gd90-07-23.sbd.oconner.7612.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Never Trust A Woman",
    showDate: "1982-09-20",
    showIdentifier: "gd82-09-20.cohen.minches.19145.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Satisfaction",
    showDate: "1982-08-08",
    showIdentifier: "gd82-08-08.sbd-wise.unknown.7690.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Satisfaction",
    showDate: "1981-03-10",
    showIdentifier: "gd81-03-10.glassberg.wise.7630.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Satisfaction",
    showDate: "1985-11-08",
    showIdentifier: "gd85-11-08.sbd.clugston.5301.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Satisfaction",
    showDate: "1983-04-25",
    showIdentifier: "gd83-04-25.sennheiser.dodd.9763.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Satisfaction",
    showDate: "1982-02-17",
    showIdentifier: "gd82-02-17.sbd-patched.warner.23221.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Satisfaction",
    showDate: "1985-09-15",
    showIdentifier: "gd85-09-15.aud.zelner.13600.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Satisfaction",
    showDate: "1982-04-09",
    showIdentifier: "gd82-04-09.fobsenn441-eaton.sacks.28204.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Take A Step Back",
    showDate: "1977-11-05",
    showIdentifier: "gd77-11-05.sbd.clugston.6934.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Take A Step Back",
    showDate: "1984-10-20",
    showIdentifier: "gd84-10-20.sbd.mattman.15673.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Take A Step Back",
    showDate: "1990-07-14",
    showIdentifier: "gd90-07-14.sbd.georges.463.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Take A Step Back",
    showDate: "1992-06-06",
    showIdentifier: "gd92-06-06.set2.sbd.herman.16815.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Take A Step Back",
    showDate: "1979-10-31",
    showIdentifier: "gd79-10-31.sbd-aud.shephard.9372.sbefail.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Take A Step Back",
    showDate: "1973-12-08",
    showIdentifier: "gd73-12-08.sbd.gustin.1811.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Take A Step Back",
    showDate: "1972-10-02",
    showIdentifier: "gd72-10-02.sbd.lai.158.sbefail.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Pocky Way",
    showDate: "1990-03-28",
    showIdentifier: "gd90-03-28.sbd.gorinsky.8510.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Pocky Way",
    showDate: "1990-03-21",
    showIdentifier: "gd90-03-21.sbd.heath.5307.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Pocky Way",
    showDate: "1989-10-20",
    showIdentifier: "gd89-10-20.dsbd.eD.7641.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Pocky Way",
    showDate: "1989-08-05",
    showIdentifier: "gd89-08-05.sbd.18256.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Pocky Way",
    showDate: "1989-05-06",
    showIdentifier: "gd89-05-06.dsbd.serifin.5423.sbefail.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Pocky Way",
    showDate: "1989-06-18",
    showIdentifier: "gd89-06-18.sbd.wiley.9053.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Pocky Way",
    showDate: "1988-09-16",
    showIdentifier: "gd88-09-16.sbd.miller.5289.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feedback",
    showDate: "1969-11-08",
    showIdentifier: "gd69-11-08.weinberg.warner.26331.sbeok.flacf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feedback",
    showDate: "1969-12-12",
    showIdentifier: "gd69-12-12.sbd.gerland.10988.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feedback",
    showDate: "1968-10-13",
    showIdentifier: "gd68-10-13.sbd.eD.10910.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feedback",
    showDate: "1970-05-02",
    showIdentifier: "gd1970-05-02.sbd.remaster.dp8outtake.100007.sbeok.flac16",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feedback",
    showDate: "1969-01-25",
    showIdentifier: "gd69-01-25.sbd.kaplan.7923.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Feedback",
    showDate: "1969-03-02",
    showIdentifier: "gd69-03-02.sbd.16track.kaplan.3344.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Supplication",
    showDate: "1993-05-22",
    showIdentifier: "gd93-05-22.sbd.gardner.9401.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Supplication",
    showDate: "1980-09-04",
    showIdentifier: "gd80-09-04.aud.munder.12270.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Supplication",
    showDate: "1985-11-05",
    showIdentifier: "gd85-11-05.sbd.lai.1188.sbefail.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Supplication",
    showDate: "1985-04-08",
    showIdentifier: "gd85-04-08.sbd.wiley.8755.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Supplication",
    showDate: "1986-04-03",
    showIdentifier: "gd86-04-03.sbd.samaritano.18509.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Supplication",
    showDate: "1991-06-24",
    showIdentifier: "gd91-06-24.sbd.jeff_m.2533.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Supplication",
    showDate: "1986-04-13",
    showIdentifier: "gd86-04-13.schoeps.eD.13513.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Win Again",
    showDate: "1971-11-17",
    showIdentifier: "gd71-11-17.fm.cotsman.10285.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Win Again",
    showDate: "1972-05-04",
    showIdentifier: "gd1972-05-04.sbd.miller.77294.sbeok.flac16",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Win Again",
    showDate: "1971-11-15",
    showIdentifier: "gd71-11-15.sbd.cotsman.12438.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Win Again",
    showDate: "1972-05-24",
    showIdentifier: "gd72-05-24.jones.macdonald.5920.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Win Again",
    showDate: "1972-05-18",
    showIdentifier: "gd72-05-18.sbd.unicorn.2266.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Win Again",
    showDate: "1971-12-07",
    showIdentifier: "gd71-12-07.sbd.miller.3375.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Win Again",
    showDate: "1972-09-26",
    showIdentifier: "gd72-09-26.sbd.unknown.156.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - He Was A Friend of Mine",
    showDate: "1969-05-31",
    showIdentifier: "gd69-05-31.sbd.oleynick.76.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - He Was A Friend of Mine",
    showDate: "1969-12-12",
    showIdentifier: "gd69-12-12.sbd.gerland.10988.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - He Was A Friend of Mine",
    showDate: "1969-06-14",
    showIdentifier: "gd69-06-14.sbd.skinner.5182.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - He Was A Friend of Mine",
    showDate: "1970-03-21",
    showIdentifier: "gd70-03-21.early.lee.pcrp.20184.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - He Was A Friend of Mine",
    showDate: "1969-07-03",
    showIdentifier: "gd1969-07-03.sbd.miller.92771.sbeok.flac16",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - He Was A Friend of Mine",
    showDate: "1967-05-05",
    showIdentifier: "gd67-05-05.sbs.yerys.1595.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - He Was A Friend of Mine",
    showDate: "1969-05-03",
    showIdentifier: "gd69-05-03.aud.phunk1.73.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Blow Away",
    showDate: "1989-10-26",
    showIdentifier: "gd89-10-26.set2.dsbd.miller.18664.shnf",
    tier: 2,
    votes: 33,
    notes: "33 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Blow Away",
    showDate: "1990-03-16",
    showIdentifier: "gd90-03-16.sbd.willy.5227.sbeok.shnf",
    tier: 2,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Blow Away",
    showDate: "1989-04-15",
    showIdentifier: "gd89-04-15.dsbd.jerugim.430.sbefail.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Blow Away",
    showDate: "1989-05-27",
    showIdentifier: "gd89-05-27.sbd.clugston.6667.sbefail.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Blow Away",
    showDate: "1988-07-29",
    showIdentifier: "gd88-07-29.sbd.hayum.5395.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Blow Away",
    showDate: "1989-04-29",
    showIdentifier: "gd1989-04-29.sbd.miller.88124.sbeok.flac16",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Blow Away",
    showDate: "1990-07-16",
    showIdentifier: "gd90-07-16.sbd.knapp.1316.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy Answers",
    showDate: "1993-06-05",
    showIdentifier: "gd93-06-05.sbd.wiley.8328.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy Answers",
    showDate: "1993-06-23",
    showIdentifier: "gd93-06-23.sbd.braverman.14123.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy Answers",
    showDate: "1993-06-26",
    showIdentifier: "gd93-06-26.sbd.peich.7742.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy Answers",
    showDate: "1995-06-02",
    showIdentifier: "gd95-06-02.sbd.583.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy Answers",
    showDate: "1995-03-23",
    showIdentifier: "gd95-03-23.sbd.miller.25273.sbeok.flacf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy Answers",
    showDate: "1993-09-22",
    showIdentifier: "gd93-09-22.sbd.yubah.565.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy Answers",
    showDate: "1995-03-19",
    showIdentifier: "gd95-03-19.schoeps.15097.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - 100000 Tons of Steel",
    showDate: "1987-07-12",
    showIdentifier: "gd87-07-12.sbd.agan.3860.sbefail.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - 100000 Tons of Steel",
    showDate: "1985-04-28",
    showIdentifier: "gd85-04-28.sbd.new.miller.28439.sbeok.flacf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - 100000 Tons of Steel",
    showDate: "1985-12-31",
    showIdentifier: "gd85-12-31.sbd.prefm.ashley-bertha.20006.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - 100000 Tons of Steel",
    showDate: "1987-04-06",
    showIdentifier: "gd87-04-06.sbd-matrix.hinko.19848.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - 100000 Tons of Steel",
    showDate: "1987-03-23",
    showIdentifier: "gd87-03-23.schoeps.weber-small.dnk.3870.sbefail.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - 100000 Tons of Steel",
    showDate: "1985-04-14",
    showIdentifier: "gd85-04-14.sbd.jeffm.3667.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - 100000 Tons of Steel",
    showDate: "1986-03-25",
    showIdentifier: "gd86-03-25.beyer.connor.3188.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mason's Children",
    showDate: "1970-02-14",
    showIdentifier: "gd70-02-14.early-late.sbd.cotsman.18115.sbeok.shnf",
    tier: 2,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mason's Children",
    showDate: "1970-02-02",
    showIdentifier: "gd70-02-02.sbd.cotsman.17809.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mason's Children",
    showDate: "1970-01-03",
    showIdentifier: "gd70-01-03.sbd.ret.19440.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mason's Children",
    showDate: "1969-12-20",
    showIdentifier: "gd69-12-20.sbd.cotsman.6301.sbefail.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mason's Children",
    showDate: "1969-12-31",
    showIdentifier: "gd69-xx-xx.sbd.dodd.16760.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mason's Children",
    showDate: "1970-01-17",
    showIdentifier: "gd70-01-17.sbd.clugston.2220.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Jude Finale",
    showDate: "1990-04-01",
    showIdentifier: "gd90-04-01.sbd.gorinsky.8512.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Jude Finale",
    showDate: "1990-07-12",
    showIdentifier: "gd90-07-12.sbd.mcatee.2582.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Jude Finale",
    showDate: "1988-07-03",
    showIdentifier: "gd88-07-03.sbd.ststephen.3908.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Jude Finale",
    showDate: "1990-06-09",
    showIdentifier: "gd90-06-09.bk4011.nickspicks.23532.sbeok.flac",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Jude Finale",
    showDate: "1989-07-18",
    showIdentifier: "gd89-07-18.sbd.9854.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Jude Finale",
    showDate: "1985-09-07",
    showIdentifier: "gd85-09-07.sbd.miller.18102.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Jude Finale",
    showDate: "1989-10-19",
    showIdentifier: "gd89-10-19.dsbd.eD.7640.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Just A Little Light",
    showDate: "1990-07-21",
    showIdentifier: "gd90-07-21.sbd.conner.7832.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Just A Little Light",
    showDate: "1990-07-12",
    showIdentifier: "gd90-07-12.sbd.mcatee.2582.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Just A Little Light",
    showDate: "1989-10-20",
    showIdentifier: "gd89-10-20.dsbd.eD.7641.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Just A Little Light",
    showDate: "1990-04-01",
    showIdentifier: "gd90-04-01.sbd.gorinsky.8512.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Just A Little Light",
    showDate: "1989-12-28",
    showIdentifier: "gd1989-12-28.sbd.miller.32254.sbeok.flac16",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Just A Little Light",
    showDate: "1989-10-15",
    showIdentifier: "gd89-10-15.sbd.chaser.3159.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Just A Little Light",
    showDate: "1989-10-25",
    showIdentifier: "gd89-10-25.sbd.sacks.1828.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Keep Your Day Job",
    showDate: "1982-08-28",
    showIdentifier: "gd82-08-28.sbd.lai.2333.sbefail.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Keep Your Day Job",
    showDate: "1984-04-20",
    showIdentifier: "gd84-04-20.senn.fishman.7854.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Keep Your Day Job",
    showDate: "1983-10-11",
    showIdentifier: "gd83-10-11.sbd.harrell.7339.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Keep Your Day Job",
    showDate: "1985-03-28",
    showIdentifier: "gd85-03-28.sbd.griesman.5313.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Keep Your Day Job",
    showDate: "1984-07-22",
    showIdentifier: "gd84-07-22.pcm-sbd.miller.30650.sbeok.flacf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Keep Your Day Job",
    showDate: "1982-08-29",
    showIdentifier: "gd82-08-29.fob-nak300.miller.17957.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Keep Your Day Job",
    showDate: "1983-10-22",
    showIdentifier: "gd83-10-22.sbd.drgseeds.17274.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Built to Last",
    showDate: "1990-03-26",
    showIdentifier: "gd90-03-26.sbd.gorinsky.8508.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Built to Last",
    showDate: "1989-04-06",
    showIdentifier: "gd89-04-06.sbd-matrix.kowalski.1092.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Built to Last",
    showDate: "1989-08-18",
    showIdentifier: "gd89-08-18.sbd.4796.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Built to Last",
    showDate: "1989-07-09",
    showIdentifier: "gd89-07-09.bertha.6943.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Built to Last",
    showDate: "1989-04-03",
    showIdentifier: "gd89-04-03.sbd.harrel.7507.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Built to Last",
    showDate: "1989-04-29",
    showIdentifier: "gd1989-04-29.sbd.miller.88124.sbeok.flac16",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Built to Last",
    showDate: "1989-10-19",
    showIdentifier: "gd89-10-19.dsbd.eD.7640.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Samba In The Rain",
    showDate: "1995-02-21",
    showIdentifier: "gd95-02-21.dsbd.stephens.8840.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Samba In The Rain",
    showDate: "1994-10-07",
    showIdentifier: "gd94-10-07.aud.wiley.7993.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Samba In The Rain",
    showDate: "1994-10-02",
    showIdentifier: "gd94-10-02.pmb.pujol.15111.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Samba In The Rain",
    showDate: "1994-10-18",
    showIdentifier: "gd94-10-18.schoeps.ladner.10086.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Samba In The Rain",
    showDate: "1994-06-08",
    showIdentifier: "gd94-06-08.neumann.ladner.10065.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Samba In The Rain",
    showDate: "1995-07-06",
    showIdentifier: "gd95-07-06.schoeps.5452.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Samba In The Rain",
    showDate: "1994-07-29",
    showIdentifier: "gd94-07-29.schoeps.dipietro.4078.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Gloria",
    showDate: "1979-11-09",
    showIdentifier: "gd79-11-09.sbd.stern.318.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Gloria",
    showDate: "1993-05-27",
    showIdentifier: "gd93-05-27.sbd.georges.1932.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Gloria",
    showDate: "1979-12-01",
    showIdentifier: "gd79-12-01.sbd.set2.clugston.319.sbefail.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Gloria",
    showDate: "1985-04-14",
    showIdentifier: "gd85-04-14.sbd.jeffm.3667.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Gloria",
    showDate: "1984-11-03",
    showIdentifier: "gd84-11-03.aud.willy-vernon.18111.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Gloria",
    showDate: "1995-06-30",
    showIdentifier: "gd95-06-30.schoeps.3376.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Gloria",
    showDate: "1993-01-26",
    showIdentifier: "gd93-01-26.sbd.miller.26346.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Heaven Help The Fool",
    showDate: "1980-10-14",
    showIdentifier: "gd80-10-14.sbd-aud.gardner.3828.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Heaven Help The Fool",
    showDate: "1980-10-11",
    showIdentifier: "gd80-10-11.acoustic-sbd.windsor.323.sbefail.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Heaven Help The Fool",
    showDate: "1980-10-30",
    showIdentifier: "gd80-10-30.wise.larson.1954.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Heaven Help The Fool",
    showDate: "1980-10-29",
    showIdentifier: "gd80-10-29.wise.larson.1953.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Heaven Help The Fool",
    showDate: "1980-10-27",
    showIdentifier: "gd80-10-27.senn441.lai.324.sbefail.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Heaven Help The Fool",
    showDate: "1980-10-03",
    showIdentifier: "gd1980-10-03.nak700.ellner.koucky.89128.sbeok.flac16",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Heaven Help The Fool",
    showDate: "1980-09-30",
    showIdentifier: "gd80-09-30.menke.vernon.12882.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rain",
    showDate: "1994-02-27",
    showIdentifier: "gd94-02-27.sbd.stephens.5972.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rain",
    showDate: "1993-09-16",
    showIdentifier: "gd1993-09-16.sbd.miller.94226.sbeok.flac16",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rain",
    showDate: "1995-06-25",
    showIdentifier: "gd95-06-25.sbd.2236.sbefail.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rain",
    showDate: "1994-06-17",
    showIdentifier: "gd94-06-17.nak700.ladner.9774.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rain",
    showDate: "1994-03-17",
    showIdentifier: "gd94-03-17.sbd.ladner.8023.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rain",
    showDate: "1995-03-18",
    showIdentifier: "gd95-03-18.sbd.1362.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rain",
    showDate: "1993-09-26",
    showIdentifier: "gd93-09-26.dsbd.miller.28788.sbeok.flacf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - That Would Be Something",
    showDate: "1993-06-08",
    showIdentifier: "gd93-06-08.sbd.stephens.6673.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - That Would Be Something",
    showDate: "1995-04-05",
    showIdentifier: "gd95-04-05.schoeps.10385.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - That Would Be Something",
    showDate: "1994-10-02",
    showIdentifier: "gd94-10-02.pmb.pujol.15111.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - That Would Be Something",
    showDate: "1995-06-02",
    showIdentifier: "gd95-06-02.sbd.583.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - That Would Be Something",
    showDate: "1994-04-01",
    showIdentifier: "gd94-04-01.sbd.miller.14834.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - That Would Be Something",
    showDate: "1994-10-07",
    showIdentifier: "gd94-10-07.aud.wiley.7993.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - That Would Be Something",
    showDate: "1995-06-24",
    showIdentifier: "gd95-06-24.naks.12271.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - We Can Run",
    showDate: "1990-03-19",
    showIdentifier: "gd90-03-19.prefm-sbd.sacks.1526.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - We Can Run",
    showDate: "1989-07-02",
    showIdentifier: "gd89-07-02.nak.8243.sbefail.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - We Can Run",
    showDate: "1990-06-16",
    showIdentifier: "gd90-06-16.sbd.ladner.8571.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - We Can Run",
    showDate: "1990-04-03",
    showIdentifier: "gd90-04-03.sbd.hinko.17811.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - We Can Run",
    showDate: "1989-04-02",
    showIdentifier: "gd89-04-02.sbd-matrix.mattman.17177.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - We Can Run",
    showDate: "1990-07-10",
    showIdentifier: "gd90-07-10.sbd.unknown.8256.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - We Can Run",
    showDate: "1989-08-19",
    showIdentifier: "gd89-08-19.sbd.5213.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Don't Need Love",
    showDate: "1986-04-13",
    showIdentifier: "gd86-04-13.schoeps.eD.13513.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Don't Need Love",
    showDate: "1984-06-10",
    showIdentifier: "gd84-06-10.sbd.willy.10163.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Don't Need Love",
    showDate: "1985-09-03",
    showIdentifier: "gd85-09-03.sbd.keith.7229.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Don't Need Love",
    showDate: "1984-07-03",
    showIdentifier: "gd84-07-03.aud.willy.14909.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Don't Need Love",
    showDate: "1984-03-28",
    showIdentifier: "gd84-03-28.fob-faintych.miller.27303.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Don't Need Love",
    showDate: "1984-04-14",
    showIdentifier: "gd1984-04-14.neumann-u87.eaton.miller.90595.sbeok.flac16",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Don't Need Love",
    showDate: "1984-04-29",
    showIdentifier: "gd84-04-29.beyer.miller.15390.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - From the Heart of Me",
    showDate: "1978-11-24",
    showIdentifier: "gd78-11-24.sbd.prefm.13948.sbefail.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - From the Heart of Me",
    showDate: "1979-01-15",
    showIdentifier: "gd79-01-15.rolfe.wise-cohen.310.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - From the Heart of Me",
    showDate: "1978-11-18",
    showIdentifier: "gd78-11-18.sbd.cotsman.12080.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - From the Heart of Me",
    showDate: "1978-10-18",
    showIdentifier: "gd78-10-18.sbd.shakedown.298.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - From the Heart of Me",
    showDate: "1979-02-03",
    showIdentifier: "gd79-02-03.set2-nak.clugston.7116.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - From the Heart of Me",
    showDate: "1978-12-16",
    showIdentifier: "gd1978-12-16.sonyecm250-no-dolby.walker-scotton.miller.82212.sbeok.flac16",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - From the Heart of Me",
    showDate: "1979-02-17",
    showIdentifier: "gd79-02-17.sbd.kempka.313.sbefail.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lost Sailor",
    showDate: "1979-08-12",
    showIdentifier: "gd79-08-12.sbd.clugston.9288.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lost Sailor",
    showDate: "1979-08-04",
    showIdentifier: "gd79-08-04.sbd.munder.9578.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lost Sailor",
    showDate: "1979-08-05",
    showIdentifier: "gd79-08-05.sbd.munder.9579.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lost Sailor",
    showDate: "1982-05-22",
    showIdentifier: "gd82-05-22.sbd.gorinsky.5215.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lost Sailor",
    showDate: "1979-10-27",
    showIdentifier: "gd79-10-27.sbd.clugston.13980.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lost Sailor",
    showDate: "1981-05-06",
    showIdentifier: "gd81-05-06.glassberg.vernon.17697.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lost Sailor",
    showDate: "1979-12-11",
    showIdentifier: "gd79-12-11.sbd.miller.28890.sbeok.flacf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Ain't Woman Enough To Take My Man",
    showDate: "1973-06-26",
    showIdentifier: "gd73-06-26.sbd.cotsman.12076.sbeok.shnf",
    tier: 2,
    votes: 17,
    notes: "17 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Ain't Woman Enough To Take My Man",
    showDate: "1973-04-02",
    showIdentifier: "gd73-04-02.sbd.miller.17346.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Ain't Woman Enough To Take My Man",
    showDate: "1973-06-24",
    showIdentifier: "gd1973-06-24.sbd.miller.99852.sbeok.flac16",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Ain't Woman Enough To Take My Man",
    showDate: "1973-02-17",
    showIdentifier: "gd73-02-17.sbd.carman.11771.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Ain't Woman Enough To Take My Man",
    showDate: "1973-02-21",
    showIdentifier: "gd73-02-21.sbd.hamilton.165.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Ain't Woman Enough To Take My Man",
    showDate: "1973-09-17",
    showIdentifier: "gd73-09-17.sbd.cotsman.14473.d3fixed.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Ain't Woman Enough To Take My Man",
    showDate: "1973-10-21",
    showIdentifier: "gd73-10-21.sbd.miller.17413.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy To Love You",
    showDate: "1990-07-18",
    showIdentifier: "gd90-07-18.sbd.wilson.12760.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy To Love You",
    showDate: "1979-10-27",
    showIdentifier: "gd79-10-27.sbd.clugston.13980.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy To Love You",
    showDate: "1990-04-02",
    showIdentifier: "gd90-04-02.sbd.dodd.17731.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy To Love You",
    showDate: "1980-09-03",
    showIdentifier: "gd80-09-03.aud.bass.16925.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy To Love You",
    showDate: "1979-11-06",
    showIdentifier: "gd79-11-06.sbd.clugston.2417.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy To Love You",
    showDate: "1980-06-20",
    showIdentifier: "gd80-06-20.akg-claridge-healy.vernon.20205.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Easy To Love You",
    showDate: "1979-11-09",
    showIdentifier: "gd79-11-09.sbd.stern.318.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mountains of the Moon",
    showDate: "1969-02-27",
    showIdentifier: "gd69-02-27.sbd.16track.kaplan.6315.sbeok.shnf",
    tier: 2,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mountains of the Moon",
    showDate: "1969-04-05",
    showIdentifier: "gd69-04-05.sbd.miller.18701.sbesok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mountains of the Moon",
    showDate: "1969-04-22",
    showIdentifier: "gd69-04-22.sbd.clugston.68.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mountains of the Moon",
    showDate: "1969-04-20",
    showIdentifier: "gd69-04-20.sbd.lutch.4992.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mountains of the Moon",
    showDate: "1969-06-07",
    showIdentifier: "gd69-06-07.sbd.kaplan.9074.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mountains of the Moon",
    showDate: "1969-01-18",
    showIdentifier: "gd1969-01-18.tv.ukmutt.33931.flac16",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Silver Threads and Golden Needles",
    showDate: "1966-05-19",
    showIdentifier: "gd66-05-19.sbd.lestatkat.6516.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Silver Threads and Golden Needles",
    showDate: "1969-06-28",
    showIdentifier: "gd69-06-28.sbd.samaritano.20548.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Silver Threads and Golden Needles",
    showDate: "1969-07-04",
    showIdentifier: "gd69-07-04.sbd.sirmick.remaster.29294.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Silver Threads and Golden Needles",
    showDate: "1970-06-05",
    showIdentifier: "gd70-06-05.sbd.hanno.7589.sbefail.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Silver Threads and Golden Needles",
    showDate: "1970-06-04",
    showIdentifier: "gd70-06-04.sbd.miller.12135.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rosalie McFall",
    showDate: "1970-08-05",
    showIdentifier: "gd70-08-05.sbd.jupile.17271.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rosalie McFall",
    showDate: "1970-07-12",
    showIdentifier: "gd1970-07-12.aud.unknown.sirmick.24663.sbefail.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rosalie McFall",
    showDate: "1980-10-11",
    showIdentifier: "gd80-10-11.acoustic-sbd.windsor.323.sbefail.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rosalie McFall",
    showDate: "1980-09-30",
    showIdentifier: "gd80-09-30.menke.vernon.12882.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rosalie McFall",
    showDate: "1980-09-25",
    showIdentifier: "gd80-09-25.acoustic-sbd.hinko.18740.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rosalie McFall",
    showDate: "1970-07-30",
    showIdentifier: "gd70-07-30.sbd.cotsman.17077.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rosalie McFall",
    showDate: "1970-08-19",
    showIdentifier: "gd1970-08-19.aud.taback.cdjones.81775.sbeok.flac16",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Two Souls in Communion",
    showDate: "1972-05-26",
    showIdentifier: "gd72-05-26.sbd.hollister.12758.sbeok.shnf",
    tier: 2,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Two Souls in Communion",
    showDate: "1972-05-24",
    showIdentifier: "gd72-05-24.jones.macdonald.5920.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Two Souls in Communion",
    showDate: "1972-05-04",
    showIdentifier: "gd1972-05-04.sbd.miller.77294.sbeok.flac16",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Two Souls in Communion",
    showDate: "1972-03-28",
    showIdentifier: "gd72-03-28.aud.hanno.15414.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Two Souls in Communion",
    showDate: "1972-03-26",
    showIdentifier: "gd72-03-26.aud.hanno.15413.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Two Souls in Communion",
    showDate: "1972-05-23",
    showIdentifier: "gd72-05-23.sbd.cribbs.17700.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Two Souls in Communion",
    showDate: "1972-03-27",
    showIdentifier: "gd72-03-27.aud.hanno.15816.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Help on the Way",
    showDate: "1975-09-28",
    showIdentifier: "gd75-09-28.sbd.fink.9392.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Help on the Way",
    showDate: "1991-09-20",
    showIdentifier: "gd91-09-20.sbd.ladner.21647.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Help on the Way",
    showDate: "1976-09-27",
    showIdentifier: "gd1976-09-27.sbd.miller.87664.sbeok.flac16",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Help on the Way",
    showDate: "1976-09-24",
    showIdentifier: "gd76-09-24.aud.unknown.16901.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Help on the Way",
    showDate: "1983-04-26",
    showIdentifier: "gd83-04-26.sbd.parrillo.2606.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Help on the Way",
    showDate: "1990-07-18",
    showIdentifier: "gd90-07-18.sbd.wilson.12760.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Help on the Way",
    showDate: "1977-05-09",
    showIdentifier: "gd77-05-09.sbd.connor.8304.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Unbroken Chain",
    showDate: "1995-04-07",
    showIdentifier: "gd95-04-07.sbd.7688.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Unbroken Chain",
    showDate: "1995-05-21",
    showIdentifier: "gd95-05-21.sbd.ladner.19419.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Unbroken Chain",
    showDate: "1995-07-09",
    showIdentifier: "gd95-07-09.sbd.7233.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Unbroken Chain",
    showDate: "1995-04-02",
    showIdentifier: "gd95-04-02.sbd.11622.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Unbroken Chain",
    showDate: "1995-06-04",
    showIdentifier: "gd95-06-04.sbd.13929.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Unbroken Chain",
    showDate: "1995-07-06",
    showIdentifier: "gd95-07-06.schoeps.5452.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Unbroken Chain",
    showDate: "1995-06-19",
    showIdentifier: "gd95-06-19.naks.10934.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Werewolves of London",
    showDate: "1985-10-31",
    showIdentifier: "gd85-10-31.oade.connor.8793.sbeok.shnf",
    tier: 2,
    votes: 21,
    notes: "21 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Werewolves of London",
    showDate: "1978-04-19",
    showIdentifier: "gd1978-04-19.sbd.gans.miller.9121.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Werewolves of London",
    showDate: "1991-10-31",
    showIdentifier: "gd91-10-31.sbd.gardner.2897.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Werewolves of London",
    showDate: "1978-04-21",
    showIdentifier: "gd78-04-21.sbd.cotsman.10149.sbeok.shnf",
    tier: 2,
    votes: 12,
    notes: "12 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Werewolves of London",
    showDate: "1978-07-03",
    showIdentifier: "gd78-07-03.wagner.7356.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Werewolves of London",
    showDate: "1978-05-17",
    showIdentifier: "gd78-05-17.akg.weiner.8334.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Werewolves of London",
    showDate: "1990-10-31",
    showIdentifier: "gd90-10-31.sbd.ladner.8070.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wave to the Wind",
    showDate: "1993-03-25",
    showIdentifier: "gd93-03-25.sbd.nawrocki.16433.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wave to the Wind",
    showDate: "1993-09-30",
    showIdentifier: "gd93-09-30.sbd.ladner.10064.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wave to the Wind",
    showDate: "1992-02-24",
    showIdentifier: "gd92-02-24.bk.pettus.17680.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wave to the Wind",
    showDate: "1993-12-09",
    showIdentifier: "gd93-12-09.sbd.vernon.7312.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wave to the Wind",
    showDate: "1993-06-23",
    showIdentifier: "gd93-06-23.sbd.braverman.14123.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wave to the Wind",
    showDate: "1992-02-22",
    showIdentifier: "gd92-02-22.sbd.gardner.9981.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wave to the Wind",
    showDate: "1992-03-03",
    showIdentifier: "gd92-03-03.schoeps.gardner.9471.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lucy In The Sky With Diamonds",
    showDate: "1993-06-23",
    showIdentifier: "gd93-06-23.sbd.braverman.14123.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lucy In The Sky With Diamonds",
    showDate: "1995-03-17",
    showIdentifier: "gd95-03-17.sbd.16057.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lucy In The Sky With Diamonds",
    showDate: "1994-12-08",
    showIdentifier: "gd94-12-08.neumann.seff.5611.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lucy In The Sky With Diamonds",
    showDate: "1993-05-23",
    showIdentifier: "gd93-05-23.sbd.wiley.8707.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lucy In The Sky With Diamonds",
    showDate: "1994-10-11",
    showIdentifier: "gd94-10-11.set2-sbd.braverman.17959.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lucy In The Sky With Diamonds",
    showDate: "1995-06-28",
    showIdentifier: "gd95-06-28.schoeps.10154.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Lucy In The Sky With Diamonds",
    showDate: "1995-06-02",
    showIdentifier: "gd95-06-02.sbd.583.sbeok.shnf",
    tier: 2,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Baba O'Riley &gt; Tomorrow Never Knows",
    showDate: "1992-12-17",
    showIdentifier: "gd92-12-17.sbd-2track.stonebear.5552.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Baba O'Riley &gt; Tomorrow Never Knows",
    showDate: "1992-07-01",
    showIdentifier: "gd92-07-01.prefm.ladner.5701.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Baba O'Riley &gt; Tomorrow Never Knows",
    showDate: "1992-06-06",
    showIdentifier: "gd92-06-06.set2.sbd.herman.16815.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Baba O'Riley &gt; Tomorrow Never Knows",
    showDate: "1993-09-20",
    showIdentifier: "gd93-09-20.sbd.wiley.8766.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Baba O'Riley &gt; Tomorrow Never Knows",
    showDate: "1992-05-19",
    showIdentifier: "gd92-05-19.sbd.wiley.7856.sbefail.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Baba O'Riley &gt; Tomorrow Never Knows",
    showDate: "1993-05-21",
    showIdentifier: "gd93-05-21.schoeps.gardner.9400.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Baba O'Riley &gt; Tomorrow Never Knows",
    showDate: "1992-06-14",
    showIdentifier: "gd92-06-14.kowalski.1035.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ain't It Crazy (The Rub)",
    showDate: "1971-04-25",
    showIdentifier: "gd71-04-25.sbd.grote.8761.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ain't It Crazy (The Rub)",
    showDate: "1971-07-02",
    showIdentifier: "gd71-07-02.sbd.backus.11798.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ain't It Crazy (The Rub)",
    showDate: "1971-05-30",
    showIdentifier: "gd1971-05-30.sbd.miller.94119.flac16",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ain't It Crazy (The Rub)",
    showDate: "1970-07-12",
    showIdentifier: "gd1970-07-12.aud.unknown.sirmick.24663.sbefail.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ain't It Crazy (The Rub)",
    showDate: "1971-04-05",
    showIdentifier: "gd71-04-05.sbd.stephens.16606.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ain't It Crazy (The Rub)",
    showDate: "1968-10-10",
    showIdentifier: "gd68-10-10.sbd.miller-ladner.4513.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ain't It Crazy (The Rub)",
    showDate: "1971-12-01",
    showIdentifier: "gd71-12-01.aud.minches-vernon.24765.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cream Puff War",
    showDate: "1966-07-29",
    showIdentifier: "gd66-07-29.sbd.vernon.9051.sbeok.shnf",
    tier: 2,
    votes: 18,
    notes: "18 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cream Puff War",
    showDate: "1967-03-18",
    showIdentifier: "gd67-03-18.sbd.fink.10282.sbeok.shnf",
    tier: 2,
    votes: 13,
    notes: "13 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cream Puff War",
    showDate: "1966-07-16",
    showIdentifier: "gd1966-07-16.sbd.miller.89555.sbeok.flac16",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cream Puff War",
    showDate: "1966-05-19",
    showIdentifier: "gd66-05-19.sbd.lestatkat.6516.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cream Puff War",
    showDate: "1966-07-30",
    showIdentifier: "gd1966-07-30.sbd.GEMS.94631.flac16",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cream Puff War",
    showDate: "1966-12-04",
    showIdentifier: "gd1966-12-01.sbd.32800.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cream Puff War",
    showDate: "1966-11-29",
    showIdentifier: "gd66-11-29.sbd.ret.20448.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I've Been All Around This World",
    showDate: "1970-01-31",
    showIdentifier: "gd70-01-31.sbd.cotsman.7045.sbefail.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I've Been All Around This World",
    showDate: "1980-09-25",
    showIdentifier: "gd80-09-25.acoustic-sbd.hinko.18740.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I've Been All Around This World",
    showDate: "1970-03-08",
    showIdentifier: "gd70-03-08.sbd.9195.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I've Been All Around This World",
    showDate: "1980-10-09",
    showIdentifier: "gd80-10-09.sbd.unknown.11042.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I've Been All Around This World",
    showDate: "1980-10-27",
    showIdentifier: "gd80-10-27.senn441.lai.324.sbefail.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I've Been All Around This World",
    showDate: "1969-12-19",
    showIdentifier: "gd69-12-19.sbd.hanno.9183.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I've Been All Around This World",
    showDate: "1980-10-18",
    showIdentifier: "gd80-10-18.neumann.vernon.13596.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It's A Man's World",
    showDate: "1970-09-18",
    showIdentifier: "gd70-09-18.sbd-aud.cotsman.17893.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It's A Man's World",
    showDate: "1970-06-05",
    showIdentifier: "gd70-06-05.sbd.hanno.7589.sbefail.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It's A Man's World",
    showDate: "1970-05-15",
    showIdentifier: "gd70-05-15.early-late.sbd.97.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It's A Man's World",
    showDate: "1970-04-09",
    showIdentifier: "gd70-04-09.sbd.hanno.6157.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It's A Man's World",
    showDate: "1970-06-07",
    showIdentifier: "gd70-06-07.sbd.hollister.98.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It's A Man's World",
    showDate: "1970-04-12",
    showIdentifier: "gd70-04-12.sbd.kaplan.3820.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It's A Man's World",
    showDate: "1970-07-12",
    showIdentifier: "gd1970-07-12.aud.unknown.sirmick.24663.sbefail.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Revolution",
    showDate: "1990-03-28",
    showIdentifier: "gd90-03-28.sbd.gorinsky.8510.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Revolution",
    showDate: "1985-07-02",
    showIdentifier: "gd85-07-02.sbd.bubba420.18249.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Revolution",
    showDate: "1983-10-17",
    showIdentifier: "gd83-10-17.sennheiser.skank-levy.347.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Revolution",
    showDate: "1983-10-22",
    showIdentifier: "gd83-10-22.sbd.drgseeds.17274.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Revolution",
    showDate: "1985-04-08",
    showIdentifier: "gd85-04-08.sbd.wiley.8755.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Revolution",
    showDate: "1984-10-20",
    showIdentifier: "gd84-10-20.sbd.mattman.15673.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ollin Arageed",
    showDate: "1978-10-22",
    showIdentifier: "gd78-10-22.sbd.kempa.299.sbeok.shnf",
    tier: 2,
    votes: 11,
    notes: "11 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ollin Arageed",
    showDate: "1978-12-30",
    showIdentifier: "gd78-12-30.sbd.miller.18092.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ollin Arageed",
    showDate: "1985-03-13",
    showIdentifier: "gd85-03-13.sbd.barbella.9961.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ollin Arageed",
    showDate: "1978-09-14",
    showIdentifier: "gd78-09-14.aud.dauria.6032.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ollin Arageed",
    showDate: "1979-08-05",
    showIdentifier: "gd79-08-05.sbd.munder.9579.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ollin Arageed",
    showDate: "1978-11-18",
    showIdentifier: "gd78-11-18.sbd.cotsman.12080.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ollin Arageed",
    showDate: "1978-11-23",
    showIdentifier: "gd78-11-23.sbd.cotsman.19155.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Katie Mae",
    showDate: "1970-04-03",
    showIdentifier: "gd70-04-03.sbd.cotsman.4283.sbefail.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Katie Mae",
    showDate: "1970-01-31",
    showIdentifier: "gd70-01-31.sbd.cotsman.7045.sbefail.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Katie Mae",
    showDate: "1970-02-14",
    showIdentifier: "gd70-02-14.early-late.sbd.cotsman.18115.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Katie Mae",
    showDate: "1970-03-20",
    showIdentifier: "gd70-03-20.sbd.yerys.1315.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Katie Mae",
    showDate: "1970-07-12",
    showIdentifier: "gd1970-07-12.aud.unknown.sirmick.24663.sbefail.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Katie Mae",
    showDate: "1970-03-08",
    showIdentifier: "gd70-03-08.sbd.9195.sbeok.shnf",
    tier: 2,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - She Belongs To Me",
    showDate: "1985-04-28",
    showIdentifier: "gd85-04-28.sbd.new.miller.28439.sbeok.flacf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - She Belongs To Me",
    showDate: "1985-11-08",
    showIdentifier: "gd85-11-08.sbd.clugston.5301.sbeok.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - She Belongs To Me",
    showDate: "1985-04-07",
    showIdentifier: "gd85-04-07.sbd.keith.14614.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - She Belongs To Me",
    showDate: "1985-04-04",
    showIdentifier: "gd85-04-04.oade-schoeps.sacks.23848.sbeok.flacf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - She Belongs To Me",
    showDate: "1985-11-21",
    showIdentifier: "gd85-11-21.sbd.lai.3351.sbefail.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - She Belongs To Me",
    showDate: "1985-06-14",
    showIdentifier: "gd85-06-14.sbd.carman.13747.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - She Belongs To Me",
    showDate: "1985-08-31",
    showIdentifier: "gd85-08-31.oade.connor.8237.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mountain Jam",
    showDate: "1970-11-06",
    showIdentifier: "gd70-11-06.aud.warner.17183.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mountain Jam",
    showDate: "1980-12-12",
    showIdentifier: "gd80-12-12.sbd.miller.31509.sbeok.flacf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mountain Jam",
    showDate: "1969-04-23",
    showIdentifier: "gd69-04-23.sbd.wise.70.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mountain Jam",
    showDate: "1970-06-24",
    showIdentifier: "gd_nrps70-06-24.aud.pcrp5.23062.sbeok.flacf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mountain Jam",
    showDate: "1973-12-31",
    showIdentifier: "INTERNAL_ERROR:%20invalid%20or%20no%20response%20from%20Elasticsearch",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mountain Jam",
    showDate: "1973-07-27",
    showIdentifier: "gd73-07-27.sbd.weiner.180.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Childhood's End",
    showDate: "1995-04-01",
    showIdentifier: "gd95-04-01.sbd.5287.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Childhood's End",
    showDate: "1994-10-18",
    showIdentifier: "gd94-10-18.schoeps.ladner.10086.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Childhood's End",
    showDate: "1994-08-04",
    showIdentifier: "gd94-08-04.akg.wiley.8729.sbefail.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Childhood's End",
    showDate: "1994-12-16",
    showIdentifier: "gd94-12-16.nak300.wankelswurth.10543.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Childhood's End",
    showDate: "1994-08-01",
    showIdentifier: "%3Cdiv%20style=margin-left:20px;%20margin-right:20px;%20text-align:center;%20font:%20bold%209pt%20Arial,%20Helvetica,%20sans-serif;%3Eerror%3C",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Childhood's End",
    showDate: "1994-12-12",
    showIdentifier: "gd94-12-12.schoeps.ladner.10933.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Childhood's End",
    showDate: "1995-07-05",
    showIdentifier: "gd95-07-05.sbd.9370.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Oh Babe It Ain't No Lie",
    showDate: "1980-09-25",
    showIdentifier: "gd80-09-25.acoustic-sbd.hinko.18740.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Oh Babe It Ain't No Lie",
    showDate: "1980-09-30",
    showIdentifier: "gd80-09-30.menke.vernon.12882.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Oh Babe It Ain't No Lie",
    showDate: "1980-10-09",
    showIdentifier: "gd80-10-09.sbd.unknown.11042.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Oh Babe It Ain't No Lie",
    showDate: "1984-03-28",
    showIdentifier: "gd84-03-28.fob-faintych.miller.27303.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Oh Babe It Ain't No Lie",
    showDate: "1980-12-06",
    showIdentifier: "gd80-12-06.cantor.clugston.5478.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Oh Babe It Ain't No Lie",
    showDate: "1980-10-23",
    showIdentifier: "gd80-10-23.cohen.vernon.13140.sbeok.shnf",
    tier: 2,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Oh Babe It Ain't No Lie",
    showDate: "1981-04-25",
    showIdentifier: "gd1981-04-25.sbd.gems.103640.flac16",
    tier: 2,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Tomorrow Is Forever",
    showDate: "1972-12-11",
    showIdentifier: "gd1972-12-11.108946.aud.menke.motb.flac16",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Tomorrow Is Forever",
    showDate: "1972-09-26",
    showIdentifier: "gd72-09-26.sbd.unknown.156.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Tomorrow Is Forever",
    showDate: "1972-10-02",
    showIdentifier: "gd72-10-02.sbd.lai.158.sbefail.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Tomorrow Is Forever",
    showDate: "1972-11-13",
    showIdentifier: "gd72-11-13.aud.hanno.10089.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Tomorrow Is Forever",
    showDate: "1972-10-30",
    showIdentifier: "gd72-10-30.aud.cotsman.10915.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Tomorrow Is Forever",
    showDate: "1972-10-23",
    showIdentifier: "gd1972-10-23.sonyecm250.unknown.miller.98958.sbeok.flac16",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Tomorrow Is Forever",
    showDate: "1972-10-27",
    showIdentifier: "gd72-10-27.sbd-aud.cousinit.19630.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - If The Shoe Fits",
    showDate: "1994-10-06",
    showIdentifier: "gd94-10-06.nak300.ericb.7743.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - If The Shoe Fits",
    showDate: "1994-06-19",
    showIdentifier: "gd94-06-19.sbd.larson.12524.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - If The Shoe Fits",
    showDate: "1994-12-11",
    showIdentifier: "gd94-12-11.sbd.unknown.12525.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - If The Shoe Fits",
    showDate: "1994-10-19",
    showIdentifier: "gd94-10-19.bk4011.wiley.7744.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - If The Shoe Fits",
    showDate: "1994-10-02",
    showIdentifier: "gd94-10-02.pmb.pujol.15111.sbeok.shnf",
    tier: 2,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - If The Shoe Fits",
    showDate: "1995-03-24",
    showIdentifier: "gd95-03-24.akg.5668.sbeok.shnf",
    tier: 2,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - If The Shoe Fits",
    showDate: "1994-07-02",
    showIdentifier: "gd94-07-02.sbd.stevens.10980.sbeok.shnf",
    tier: 2,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cold Jordan",
    showDate: "1970-08-05",
    showIdentifier: "gd70-08-05.sbd.jupile.17271.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cold Jordan",
    showDate: "1970-06-07",
    showIdentifier: "gd70-06-07.sbd.hollister.98.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cold Jordan",
    showDate: "1970-09-17",
    showIdentifier: "gd70-09-17.aud.warner.16090.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cold Jordan",
    showDate: "1970-07-11",
    showIdentifier: "gd70-07-11.aud.cotsman.9379.sbefail.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cold Jordan",
    showDate: "1970-08-18",
    showIdentifier: "gd70-08-18.aud.yerys.1346.sbeok.shnf",
    tier: 2,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Cold Jordan",
    showDate: "1970-08-19",
    showIdentifier: "gd1970-08-19.aud.taback.cdjones.81775.sbeok.flac16",
    tier: 2,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Second That Emotion",
    showDate: "1971-04-13",
    showIdentifier: "gd71-04-13.sbd.unknown.32015.sbeok.flacf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Second That Emotion",
    showDate: "1971-04-15",
    showIdentifier: "gd71-04-15.sbd.eD.11652.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Second That Emotion",
    showDate: "1971-04-08",
    showIdentifier: "gd1971-04-08.sbd.deibert.83756.sbeok.flac16",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Second That Emotion",
    showDate: "1989-10-13",
    showIdentifier: "INTERNAL_ERROR:%20invalid%20or%20no%20response%20from%20Elasticsearch",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Second That Emotion",
    showDate: "1971-04-14",
    showIdentifier: "gd71-04-14.sbd.lai.6250.sbefail.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stealin'",
    showDate: "1966-07-03",
    showIdentifier: "gd66-07-03.sbd.unknown.40.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stealin'",
    showDate: "1966-03-25",
    showIdentifier: "gd66-03-25.sbd.unknown.38.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stealin'",
    showDate: "1966-03-12",
    showIdentifier: "gd66-acid-test-supplement.sbd.unknown.9514.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stealin'",
    showDate: "1966-11-29",
    showIdentifier: "gd66-11-29.sbd.ret.20448.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Stealin'",
    showDate: "1966-02-25",
    showIdentifier: "gd66-02-25.sbd.unknown.1593.sbefail.shnf",
    tier: 2,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wake Up Little Susie",
    showDate: "1970-02-14",
    showIdentifier: "gd70-02-14.early-late.sbd.cotsman.18115.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wake Up Little Susie",
    showDate: "1970-05-01",
    showIdentifier: "gd70-05-01.sbd.clugston.5465.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wake Up Little Susie",
    showDate: "1970-07-12",
    showIdentifier: "gd1970-07-12.aud.unknown.sirmick.24663.sbefail.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wake Up Little Susie",
    showDate: "1970-03-21",
    showIdentifier: "gd70-03-21.early.lee.pcrp.20184.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wake Up Little Susie",
    showDate: "1970-08-19",
    showIdentifier: "gd1970-08-19.aud.taback.cdjones.81775.sbeok.flac16",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Wake Up Little Susie",
    showDate: "1970-04-03",
    showIdentifier: "gd70-04-03.sbd.cotsman.4283.sbefail.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Darkness Jam",
    showDate: "1970-12-12",
    showIdentifier: "gd70-12-12.sbd.clugston.5985.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Darkness Jam",
    showDate: "1973-11-21",
    showIdentifier: "gd73-11-21.sbd.barrick.192.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Darkness Jam",
    showDate: "1979-11-02",
    showIdentifier: "gd79-11-02.sbd.macdonald.7920.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Darkness Jam",
    showDate: "1970-05-07",
    showIdentifier: "gd70-05-07.aud.weiner-gdADT04.5439.sbefail.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Darkness Jam",
    showDate: "1971-04-13",
    showIdentifier: "gd71-04-13.sbd.unknown.32015.sbeok.flacf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Darkness Jam",
    showDate: "1973-03-26",
    showIdentifier: "gd73-03-26.sbd.miller-ashley.1373.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Believe It Or Not",
    showDate: "1988-06-30",
    showIdentifier: "gd88-06-30.schoeps-fob.gustin.414.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Believe It Or Not",
    showDate: "1988-07-17",
    showIdentifier: "gd88-07-17.sbd-matrix.braverman.10081.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Believe It Or Not",
    showDate: "1988-10-21",
    showIdentifier: "gd88-10-21.dsbd.miller.30814.sbeok.flacf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Believe It Or Not",
    showDate: "1988-06-01",
    showIdentifier: "gd88-06-01.sbd.munder.20606.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Believe It Or Not",
    showDate: "1988-07-02",
    showIdentifier: "gd88-07-02.sbd-matrix.dan.21211.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Believe It Or Not",
    showDate: "1988-09-09",
    showIdentifier: "gd88-09-09.sbd.unknown.14840.sbeok.shnf",
    tier: 2,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Boy Pete",
    showDate: "1970-03-01",
    showIdentifier: "gd70-03-01.sbd.hanno.4641.sbefail.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Boy Pete",
    showDate: "1969-06-09",
    showIdentifier: "Search%20engine%20returned%20invalid%20information%20or%20was%20unresponsive",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Boy Pete",
    showDate: "1966-11-29",
    showIdentifier: "gd66-11-29.sbd.ret.20448.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Boy Pete",
    showDate: "1966-12-01",
    showIdentifier: "gd66-12-01.sbd.ladner.8575.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Big Boy Pete",
    showDate: "1969-12-31",
    showIdentifier: "gd69-xx-xx.sbd.dodd.16760.sbeok.shnf",
    tier: 2,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Born Cross Eyed",
    showDate: "1968-03-30",
    showIdentifier: "gd68-03-30.aud.cotsman.14912.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Born Cross Eyed",
    showDate: "1968-01-17",
    showIdentifier: "gd1968-01-17.sbd.cotsman.11795.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Born Cross Eyed",
    showDate: "1968-03-29",
    showIdentifier: "gd68-03-29.aud.vernon.9473.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Born Cross Eyed",
    showDate: "1968-01-23",
    showIdentifier: "gd68-01-23.sbd.jools.20347.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mission in the Rain",
    showDate: "1976-06-29",
    showIdentifier: "gd76-06-29.sbd.parrillo.1812.sbeok.shnf",
    tier: 2,
    votes: 39,
    notes: "39 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Mission in the Rain",
    showDate: "1976-06-04",
    showIdentifier: "gd76-06-04.sbd.cotsman.9797.sbeok.shnf",
    tier: 2,
    votes: 28,
    notes: "28 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rubin and Cherise",
    showDate: "1991-04-07",
    showIdentifier: "gd91-04-07.sbd.neo_levo-ferguson.476.sbeok.shnf",
    tier: 2,
    votes: 19,
    notes: "19 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rubin and Cherise",
    showDate: "1991-03-27",
    showIdentifier: "gd91-03-27.sbd.miller.14486.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Swing Low Sweet Chariot",
    showDate: "1970-06-07",
    showIdentifier: "gd70-06-07.sbd.hollister.98.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Swing Low Sweet Chariot",
    showDate: "1970-07-11",
    showIdentifier: "gd70-07-11.aud.cotsman.9379.sbefail.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Swing Low Sweet Chariot",
    showDate: "1970-07-30",
    showIdentifier: "gd70-07-30.sbd.cotsman.17077.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Swing Low Sweet Chariot",
    showDate: "1970-08-18",
    showIdentifier: "gd70-08-18.aud.yerys.1346.sbeok.shnf",
    tier: 2,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Swing Low Sweet Chariot",
    showDate: "1970-08-19",
    showIdentifier: "gd1970-08-19.aud.taback.cdjones.81775.sbeok.flac16",
    tier: 2,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Visions of Johanna",
    showDate: "1986-04-22",
    showIdentifier: "gd86-04-22.aud.eD.13583.sbeok.shnf",
    tier: 2,
    votes: 22,
    notes: "22 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Visions of Johanna",
    showDate: "1995-04-07",
    showIdentifier: "gd95-04-07.sbd.7688.sbeok.shnf",
    tier: 2,
    votes: 16,
    notes: "16 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Visions of Johanna",
    showDate: "1986-03-19",
    showIdentifier: "gd86-03-19.sony.lai.3905.sbefail.shnf",
    tier: 2,
    votes: 14,
    notes: "14 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Visions of Johanna",
    showDate: "1995-03-30",
    showIdentifier: "gd95-03-30.sbd.4161.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Visions of Johanna",
    showDate: "1995-02-24",
    showIdentifier: "gd95-02-24.AT.5493.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Close Encounters Jam",
    showDate: "1989-07-17",
    showIdentifier: "gd89-07-17.sbd.unknown.17702.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Close Encounters Jam",
    showDate: "1978-04-24",
    showIdentifier: "gd78-04-24.sbd.mattman.20605.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Close Encounters Jam",
    showDate: "1982-09-20",
    showIdentifier: "gd82-09-20.cohen.minches.19145.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Close Encounters Jam",
    showDate: "1978-04-08",
    showIdentifier: "gd78-04-08.sbd.lai.4144.sbefail.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Close Encounters Jam",
    showDate: "1978-01-13",
    showIdentifier: "gd78-01-13.sbd.clugston.4629.sbeok.shnf",
    tier: 2,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bo Diddley",
    showDate: "1972-08-22",
    showIdentifier: "gd1972-08-22.sbd.miller.27780.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bo Diddley",
    showDate: "1986-02-11",
    showIdentifier: "gd86-02-11.sbd.munder.11716.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bo Diddley",
    showDate: "1970-11-11",
    showIdentifier: "gd70-11-11.aud.cotsman.17081.sbeok.shnf",
    tier: 2,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It Takes A Lot To Laugh, It Takes A Train To Cry",
    showDate: "1991-09-22",
    showIdentifier: "gd91-09-22.sbd.fishman.17180.sbeok.shnf",
    tier: 2,
    votes: 7,
    notes: "7 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It Takes A Lot To Laugh, It Takes A Train To Cry",
    showDate: "1992-03-16",
    showIdentifier: "gd92-03-16.sbd.13571.sbefail.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It Takes A Lot To Laugh, It Takes A Train To Cry",
    showDate: "1991-08-18",
    showIdentifier: "gd91-08-18.sbd.nawrocki.21349.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - It Takes A Lot To Laugh, It Takes A Train To Cry",
    showDate: "1991-06-24",
    showIdentifier: "gd91-06-24.sbd.jeff_m.2533.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Little Sadie",
    showDate: "1970-02-28",
    showIdentifier: "gd70-02-28.sbd.cotsman.9377.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Little Sadie",
    showDate: "1970-01-31",
    showIdentifier: "gd70-01-31.sbd.cotsman.7045.sbefail.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Little Sadie",
    showDate: "1969-12-19",
    showIdentifier: "gd69-12-19.sbd.hanno.9183.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Little Sadie",
    showDate: "1980-10-31",
    showIdentifier: "gd80-10-31.sbd-preFM.cousinit.20377.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Louie",
    showDate: "1988-04-05",
    showIdentifier: "gd1988-04-05.sbd.miller.91234.sbeok.flac16",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Louie",
    showDate: "1969-09-07",
    showIdentifier: "gd69-09-07.sbd.dfinney.5808.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Louie",
    showDate: "1988-04-22",
    showIdentifier: "gd88-04-22.aud.wiley.16070.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Louie",
    showDate: "1988-09-20",
    showIdentifier: "gd88-09-20.sbd.jeff.2422.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Run Run Rudolph",
    showDate: "1971-12-10",
    showIdentifier: "gd71-12-10.sbd.yerys.1311.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Run Run Rudolph",
    showDate: "1971-12-15",
    showIdentifier: "gd1971-12-15.sbd.miller.97718.sbeok.flac16",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Run Run Rudolph",
    showDate: "1971-12-04",
    showIdentifier: "gd71-12-04.sbd.lai.6256.sbefail.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Run Run Rudolph",
    showDate: "1971-12-06",
    showIdentifier: "gd71-12-06.sbd.kaplan.2418.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Walking the Dog",
    showDate: "1984-03-29",
    showIdentifier: "gd1984-03-29.sbd.walker-scotton.miller.32515.sbeok.flac16",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Walking the Dog",
    showDate: "1985-11-21",
    showIdentifier: "gd85-11-21.sbd.lai.3351.sbefail.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Walking the Dog",
    showDate: "1970-11-09",
    showIdentifier: "gd70-11-09.aud.hanno.7591.sbeok.shnf",
    tier: 2,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Jude",
    showDate: "1989-10-09",
    showIdentifier: "gd89-10-09.sbd.serafin.7721.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Jude",
    showDate: "1989-07-02",
    showIdentifier: "gd89-07-02.nak.8243.sbefail.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Jude",
    showDate: "1985-09-07",
    showIdentifier: "gd85-09-07.sbd.miller.18102.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Jude",
    showDate: "1988-07-03",
    showIdentifier: "gd88-07-03.sbd.ststephen.3908.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Blues For Allah",
    showDate: "1981-10-06",
    showIdentifier: "gd81-10-06.sbd.polgar.3303.sbefail.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Blues For Allah",
    showDate: "1984-03-31",
    showIdentifier: "gd84-03-31.sbd.nawrocki.14078.sbeok.shnf",
    tier: 2,
    votes: 9,
    notes: "9 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Blues For Allah",
    showDate: "1975-03-21",
    showIdentifier: "gd75-03-21.sbd.backus.14288.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let Me Sing Your Blues Away",
    showDate: "1973-09-17",
    showIdentifier: "gd73-09-17.sbd.cotsman.14473.d3fixed.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let Me Sing Your Blues Away",
    showDate: "1973-09-12",
    showIdentifier: "gd73-09-12.sbd.sly.14010.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Let Me Sing Your Blues Away",
    showDate: "1973-09-21",
    showIdentifier: "gd73-09-21.sbd.miller.17410.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Maybe You Know",
    showDate: "1983-04-16",
    showIdentifier: "gd83-04-16.sbd.fink.14940.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Maybe You Know",
    showDate: "1983-04-13",
    showIdentifier: "gd83-04-13.horvath-sennheiser.ladner.21921.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Maybe You Know",
    showDate: "1983-04-15",
    showIdentifier: "gd83-04-15s2.sbd.dodd.9975.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Quin The Eskimo",
    showDate: "1994-07-29",
    showIdentifier: "gd94-07-29.schoeps.dipietro.4078.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Quin The Eskimo",
    showDate: "1988-07-02",
    showIdentifier: "gd88-07-02.sbd-matrix.dan.21211.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Quin The Eskimo",
    showDate: "1991-06-19",
    showIdentifier: "gd91-06-19.sbd.aj.2786.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rockin' Pneumonia",
    showDate: "1972-10-23",
    showIdentifier: "gd1972-10-23.sonyecm250.unknown.miller.98958.sbeok.flac16",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Rockin' Pneumonia",
    showDate: "1972-06-17",
    showIdentifier: "gd72-06-17.aud.hanno.16470.sbeok.shnf",
    tier: 2,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Willie and the Hand Jive",
    showDate: "1986-04-12",
    showIdentifier: "gd86-04-12.schoeps.eD.13465.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Willie and the Hand Jive",
    showDate: "1986-03-31",
    showIdentifier: "gd86-03-31.aud.eD.13463.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Willie and the Hand Jive",
    showDate: "1986-12-16",
    showIdentifier: "gd1986-12-16.sbd.miller.77409.flac16",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Don't Have To Ask",
    showDate: "1966-07-29",
    showIdentifier: "gd66-07-29.sbd.vernon.9051.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Don't Have To Ask",
    showDate: "1966-05-19",
    showIdentifier: "gd66-05-19.sbd.lestatkat.6516.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - You Don't Have To Ask",
    showDate: "1966-07-30",
    showIdentifier: "gd1966-07-30.sbd.GEMS.94631.flac16",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - King Solomon's Marbles",
    showDate: "1976-07-16",
    showIdentifier: "gd76-07-16.menke.cribbs.16943.sbeok.shnf",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - King Solomon's Marbles",
    showDate: "1975-06-17",
    showIdentifier: "gd1975-06-17.aud.unknown.87560.flac16",
    tier: 2,
    votes: 15,
    notes: "15 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - King Solomon's Marbles",
    showDate: "1975-03-21",
    showIdentifier: "gd75-03-21.sbd.backus.14288.sbeok.shnf",
    tier: 2,
    votes: 8,
    notes: "8 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Valley Road",
    showDate: "1990-12-09",
    showIdentifier: "gd90-12-09.sbd.ladner.5155.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Valley Road",
    showDate: "1990-12-30",
    showIdentifier: "gd90-12-30.sbd.miller.22025.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Valley Road",
    showDate: "1990-10-22",
    showIdentifier: "gd90-10-22.sbd.gardner.8722.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Frozen Logger",
    showDate: "1970-11-16",
    showIdentifier: "gd70-11-16.sbd.winters.17361.sbeok.shnf",
    tier: 2,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Frozen Logger",
    showDate: "1970-12-26",
    showIdentifier: "gd70-12-26.sbd.miller.22369.sbeok.shnf",
    tier: 2,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Frozen Logger",
    showDate: "1972-08-21",
    showIdentifier: "gd72-08-21.sbd.hamilton.150.sbeok.shnf",
    tier: 2,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Want To Tell You",
    showDate: "1995-05-24",
    showIdentifier: "gd95-05-24.neumann.18800.sbeok.shnf",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Want To Tell You",
    showDate: "1994-07-01",
    showIdentifier: "gd94-07-01.sbd.ladner.9369.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Want To Tell You",
    showDate: "1994-07-19",
    showIdentifier: "gd94-07-19.sbd.carr.8476.sbeok.shnf",
    tier: 2,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Day Tripper",
    showDate: "1985-08-24",
    showIdentifier: "gd85-08-24.sbd.vernon.13991.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Day Tripper",
    showDate: "1985-02-20",
    showIdentifier: "gd85-02-20.sbd.miller.21917.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - How Long Blues",
    showDate: "1970-07-12",
    showIdentifier: "gd1970-07-12.aud.unknown.sirmick.24663.sbefail.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - How Long Blues",
    showDate: "1970-11-07",
    showIdentifier: "gd70-11-07.aud.warner.10306.sbeok.shnf",
    tier: 2,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Till The Morning Comes",
    showDate: "1970-10-31",
    showIdentifier: "gd70-10-31.early.sbd.fischer.6517.sbeok.shnf",
    tier: 2,
    votes: 6,
    notes: "6 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Till The Morning Comes",
    showDate: "1970-10-11",
    showIdentifier: "gd70-10-11.aud.cotsman.9500.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Why Don't We Do It In The Road",
    showDate: "1986-03-30",
    showIdentifier: "gd86-03-30.fob-schoeps.miller.25526.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Why Don't We Do It In The Road",
    showDate: "1985-04-13",
    showIdentifier: "gd85-04-13.sbd.popi.6146.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Got My Mojo Working",
    showDate: "1977-04-22",
    showIdentifier: "gd77-04-22.sbd.miller.27747.sbeok.flacf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Got My Mojo Working",
    showDate: "1985-04-04",
    showIdentifier: "gd85-04-04.oade-schoeps.sacks.23848.sbeok.flacf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - La Bamba",
    showDate: "1987-09-13",
    showIdentifier: "gd87-09-13.schoeps.dipietro.8908.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - La Bamba",
    showDate: "1970-11-11",
    showIdentifier: "gd70-11-11.aud.cotsman.17081.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Ballad of a Thin Man",
    showDate: "1987-07-19",
    showIdentifier: "gd87-07-19.sbd.fishman.13023.sbeok.shnf",
    tier: 2,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Baby",
    showDate: "1985-03-29",
    showIdentifier: "gd85-03-29.oade-schoeps.sacks.23475.sbeok.flacf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Hey Little One",
    showDate: "1966-07-30",
    showIdentifier: "gd1966-07-30.sbd.GEMS.94631.flac16",
    tier: 2,
    votes: 4,
    notes: "4 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - High Heeled Sneakers",
    showDate: "1966-06-01",
    showIdentifier: "gd66-06-xx.sbd.vernon.9513.sbeok.shnf",
    tier: 2,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Hear A Voice Calling",
    showDate: "1970-07-30",
    showIdentifier: "gd70-07-30.sbd.cotsman.17077.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - I Just Wanna Make Love To You",
    showDate: "1966-11-29",
    showIdentifier: "gd66-11-29.sbd.ret.20448.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - If I Had The World To Give",
    showDate: "1978-08-01",
    showIdentifier: "gd78-08-XX.sbd.wiley.11692.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Keep On Growing",
    showDate: "1985-06-14",
    showIdentifier: "gd85-06-14.sbd.carman.13747.sbeok.shnf",
    tier: 2,
    votes: 10,
    notes: "10 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Long Black Limousine",
    showDate: "1969-12-19",
    showIdentifier: "gd69-12-19.sbd.hanno.9183.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - New Orleans",
    showDate: "1969-08-29",
    showIdentifier: "gd69-08-29.sbd.cotsman.8996.sbeok.shnf",
    tier: 2,
    votes: 3,
    notes: "3 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Oh Boy",
    showDate: "1981-04-25",
    showIdentifier: "gd1981-04-25.sbd.gems.103640.flac16",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Operator",
    showDate: "1970-11-07",
    showIdentifier: "gd70-11-07.aud.warner.10306.sbeok.shnf",
    tier: 2,
    votes: 5,
    notes: "5 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Who Do You Love",
    showDate: "1972-04-29",
    showIdentifier: "gd72-04-29.aud.vernon.5250.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Take Me To The River",
    showDate: "1995-07-06",
    showIdentifier: "gd95-07-06.schoeps.5452.sbeok.shnf",
    tier: 2,
    votes: 2,
    notes: "2 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - A Voice From On High",
    showDate: "1970-07-30",
    showIdentifier: "gd70-07-30.sbd.cotsman.17077.sbeok.shnf",
    tier: 2,
    votes: 1,
    notes: "1 votes on HeadyVersion"
  }
];

// Tier 3: Notable performances (1 star) - 47 performances
export const TIER_3_SONG_PERFORMANCES: RatedSongPerformance[] = [
  {
    songTitle: "Grateful Dead - Playing In The Band",
    showDate: "1974-06-16",
    showIdentifier: "gd74-06-16.sbd.fink.17701.sbeok.shnf",
    tier: 3,
    votes: 73,
    notes: "73 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Playing In The Band",
    showDate: "1972-09-21",
    showIdentifier: "gd72-09-21.sbd.masse.7296.sbeok.shnf",
    tier: 3,
    votes: 73,
    notes: "73 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Playing In The Band",
    showDate: "1973-11-21",
    showIdentifier: "gd73-11-21.sbd.barrick.192.sbeok.shnf",
    tier: 3,
    votes: 70,
    notes: "70 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Playing In The Band",
    showDate: "1973-10-19",
    showIdentifier: "gd73-10-19.sbd.nayfield.187.sbeok.shnf",
    tier: 3,
    votes: 69,
    notes: "69 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Playing In The Band",
    showDate: "1974-10-16",
    showIdentifier: "gd74-10-16.sbd.fishman.12577.sbeok.shnf",
    tier: 3,
    votes: 66,
    notes: "66 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Other One",
    showDate: "1973-02-28",
    showIdentifier: "gd73-02-28.sbd.weiner.15386.sbeok.shnf",
    tier: 3,
    votes: 63,
    notes: "63 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Other One",
    showDate: "1972-09-28",
    showIdentifier: "gd72-09-28.sbd.bill.12657.sbeok.shnf",
    tier: 3,
    votes: 58,
    notes: "58 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Other One",
    showDate: "1972-11-17",
    showIdentifier: "gd72-11-17.sbd.warner.15982.sbeok.shnf",
    tier: 3,
    votes: 57,
    notes: "57 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Other One",
    showDate: "1978-10-21",
    showIdentifier: "gd78-10-21.sbd.popi.6100.sbeok.shnf",
    tier: 3,
    votes: 54,
    notes: "54 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Other One",
    showDate: "1969-03-01",
    showIdentifier: "gd69-03-01.sbd.16track.kaplan.4030.sbeok.shnf",
    tier: 3,
    votes: 51,
    notes: "51 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Cat Sunflower -&gt; I Know You Rider",
    showDate: "1974-08-05",
    showIdentifier: "gd74-08-05.aud.weiner.21294.sbeok.shnf",
    tier: 3,
    votes: 66,
    notes: "66 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Cat Sunflower -&gt; I Know You Rider",
    showDate: "1974-05-17",
    showIdentifier: "gd74-05-17.sbd.gustin.202.sbeok.shnf",
    tier: 3,
    votes: 64,
    notes: "64 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Cat Sunflower -&gt; I Know You Rider",
    showDate: "1973-11-17",
    showIdentifier: "gd73-11-17.sbd.gardner.4749.sbeok.shnf",
    tier: 3,
    votes: 63,
    notes: "63 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Cat Sunflower -&gt; I Know You Rider",
    showDate: "1972-09-21",
    showIdentifier: "gd72-09-21.sbd.masse.7296.sbeok.shnf",
    tier: 3,
    votes: 62,
    notes: "62 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - China Cat Sunflower -&gt; I Know You Rider",
    showDate: "1982-08-07",
    showIdentifier: "gd82-08-07.sbd-streeter-wise.unknown.7689.sbeok.shnf",
    tier: 3,
    votes: 60,
    notes: "60 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Jack Straw",
    showDate: "1977-05-17",
    showIdentifier: "gd77-05-17.sbd.weiner.18554.sbeok.shnf",
    tier: 3,
    votes: 57,
    notes: "57 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Jack Straw",
    showDate: "1978-06-04",
    showIdentifier: "gd78-06-04.sbd.cotsman.10530.sbeok.shnf",
    tier: 3,
    votes: 54,
    notes: "54 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Eyes Of The World",
    showDate: "1973-11-30",
    showIdentifier: "gd73-11-30.aud.vernon.17277.sbeok.shnf",
    tier: 3,
    votes: 102,
    notes: "102 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Eyes Of The World",
    showDate: "1977-10-29",
    showIdentifier: "gd77-10-29.maizner.vernon.8035.sbeok.shnf",
    tier: 3,
    votes: 94,
    notes: "94 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Eyes Of The World",
    showDate: "1977-11-04",
    showIdentifier: "gd77-11-04.sbd.unknown.2595.sbeok.shnf",
    tier: 3,
    votes: 88,
    notes: "88 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Eyes Of The World",
    showDate: "1974-06-20",
    showIdentifier: "gd74-06-20.sbd.clugston.2179.sbeok.shnf",
    tier: 3,
    votes: 84,
    notes: "84 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Eyes Of The World",
    showDate: "1973-02-15",
    showIdentifier: "gd1973-02-15.sbd.hall.1580.shnf",
    tier: 3,
    votes: 84,
    notes: "84 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bertha",
    showDate: "1977-12-29",
    showIdentifier: "gd1977-12-29.aud.92374.flac16",
    tier: 3,
    votes: 51,
    notes: "51 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sugaree",
    showDate: "1977-03-18",
    showIdentifier: "gd77-03-18.sbd.unknown.254.sbeok.shnf",
    tier: 3,
    votes: 50,
    notes: "50 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sugaree",
    showDate: "1977-05-26",
    showIdentifier: "gd77-05-26.sbd.sacks.3224.sbeok.shnf",
    tier: 3,
    votes: 50,
    notes: "50 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Sugaree",
    showDate: "1977-06-08",
    showIdentifier: "gd77-06-08.sbd.clugston.15421.sbeok.shnf",
    tier: 3,
    votes: 50,
    notes: "50 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Terrapin Station",
    showDate: "1993-06-23",
    showIdentifier: "gd93-06-23.sbd.braverman.14123.sbeok.shnf",
    tier: 3,
    votes: 55,
    notes: "55 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Terrapin Station",
    showDate: "1977-06-09",
    showIdentifier: "gd1977-06-09.28614.sbeok.flac16",
    tier: 3,
    votes: 51,
    notes: "51 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bird Song",
    showDate: "1980-11-30",
    showIdentifier: "gd80-11-30.sbd-aud.sacks.2416.sbeok.shnf",
    tier: 3,
    votes: 51,
    notes: "51 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Bird Song",
    showDate: "1981-03-07",
    showIdentifier: "gd81-03-07complete.aud-wise.senn421.22933.sbeok.shnf",
    tier: 3,
    votes: 51,
    notes: "51 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Morning Dew",
    showDate: "1973-11-30",
    showIdentifier: "gd73-11-30.aud.vernon.17277.sbeok.shnf",
    tier: 3,
    votes: 69,
    notes: "69 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Morning Dew",
    showDate: "1974-02-24",
    showIdentifier: "gd74-02-24.sbd.windsor.199.sbefail.shnf",
    tier: 3,
    votes: 66,
    notes: "66 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Morning Dew",
    showDate: "1983-06-18",
    showIdentifier: "gd83-06-18.set2.aud-silberman.miller.21741.sbeok.shnf",
    tier: 3,
    votes: 65,
    notes: "65 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Morning Dew",
    showDate: "1978-04-15",
    showIdentifier: "gd78-04-15.sbd.cotsman.7047.sbefail.shnf",
    tier: 3,
    votes: 57,
    notes: "57 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Morning Dew",
    showDate: "1972-09-27",
    showIdentifier: "gd72-09-27.sbd.vernon.18106.sbeok.shnf",
    tier: 3,
    votes: 57,
    notes: "57 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Scarlet Begonias -&gt; Fire On The Mountain",
    showDate: "1977-05-21",
    showIdentifier: "gd77-05-21.sbd.boyle.271.sbeok.shnf",
    tier: 3,
    votes: 127,
    notes: "127 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Scarlet Begonias -&gt; Fire On The Mountain",
    showDate: "1994-10-14",
    showIdentifier: "gd94-10-14.sbd.perkins.9054.sbeok.shnf",
    tier: 3,
    votes: 125,
    notes: "125 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Scarlet Begonias -&gt; Fire On The Mountain",
    showDate: "1984-04-20",
    showIdentifier: "gd84-04-20.senn.fishman.7854.sbeok.shnf",
    tier: 3,
    votes: 121,
    notes: "121 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Scarlet Begonias -&gt; Fire On The Mountain",
    showDate: "1995-05-26",
    showIdentifier: "gd95-05-26.sbd.2663.sbeok.shnf",
    tier: 3,
    votes: 97,
    notes: "97 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Scarlet Begonias -&gt; Fire On The Mountain",
    showDate: "1978-09-02",
    showIdentifier: "gd78-09-02.sbd.jools.7925.sbeok.shnf",
    tier: 3,
    votes: 92,
    notes: "92 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dark Star",
    showDate: "1973-12-06",
    showIdentifier: "gd73-12-06.sbd.kaplan-fink-hamilton.4452.sbeok.shnf",
    tier: 3,
    votes: 145,
    notes: "145 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dark Star",
    showDate: "1989-10-26",
    showIdentifier: "gd89-10-26.set2.dsbd.miller.18664.shnf",
    tier: 3,
    votes: 139,
    notes: "139 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dark Star",
    showDate: "1972-09-27",
    showIdentifier: "gd72-09-27.sbd.vernon.18106.sbeok.shnf",
    tier: 3,
    votes: 126,
    notes: "126 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dark Star",
    showDate: "1974-10-18",
    showIdentifier: "gd74-10-18.sbd.bertha-ashley.22796.sbeok.shnf",
    tier: 3,
    votes: 124,
    notes: "124 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - Dark Star",
    showDate: "1972-04-24",
    showIdentifier: "gd72-04-24.sbd-aud.cotsman.16332.sbeok.shnf",
    tier: 3,
    votes: 119,
    notes: "119 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Music Never Stopped",
    showDate: "1975-08-13",
    showIdentifier: "gd75-08-13.fm.vernon.23661.sbeok.shnf",
    tier: 3,
    votes: 52,
    notes: "52 votes on HeadyVersion"
  },
  {
    songTitle: "Grateful Dead - The Music Never Stopped",
    showDate: "1989-07-17",
    showIdentifier: "gd89-07-17.sbd.unknown.17702.sbeok.shnf",
    tier: 3,
    votes: 50,
    notes: "50 votes on HeadyVersion"
  }
];

// Combined list for easy lookup (includes HeadyVersion + Community ratings)
export const ALL_RATED_SONG_PERFORMANCES: RatedSongPerformance[] = [
  ...TIER_1_SONG_PERFORMANCES,
  ...TIER_2_SONG_PERFORMANCES,
  ...TIER_3_SONG_PERFORMANCES,
  ...COMMUNITY_RATINGS,
];

/**
 * Get performance rating for a song + show combination
 */
export function getSongPerformanceRating(
  songTitle: string,
  showDate: string
): PerformanceRatingTier | null {
  const normalizedSongTitle = normalizeSongTitleForLookup(songTitle);
  const dateOnly = showDate.split('T')[0];

  const rating = ALL_RATED_SONG_PERFORMANCES.find(
    perf =>
      normalizeSongTitleForLookup(perf.songTitle) === normalizedSongTitle &&
      perf.showDate === dateOnly
  );

  return rating?.tier || null;
}

/**
 * Normalize song titles for consistent lookups
 */
function normalizeSongTitleForLookup(title: string): string {
  return title
    .toLowerCase()
    .trim()
    // Remove "Grateful Dead - " prefix from stored titles
    .replace(/^grateful\s+dead\s*[-–]\s*/i, '')
    // Decode HTML entities
    .replace(/&gt;/gi, '>')
    .replace(/&lt;/gi, '<')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    // Normalize arrow symbols (>, ->, →) to a standard format
    .replace(/\s*[-–]?\s*[>→]\s*/g, ' > ')
    // Remove track numbers and annotations
    .replace(/^\d+[\s.-]*/, '')
    .replace(/^Track\s+\d+[\s:]*/, '')
    .replace(/\s*[-–]\s*(aborted|partial|incomplete|rehearsal|soundcheck).*$/i, '')
    .replace(/\s*[#]\d+.*$/i, '')
    .replace(/\s*\(.*?\)\s*$/, '')
    .replace(/\s*\[.*?\]\s*$/, '')
    // Normalize common variations
    .replace(/playin'/gi, 'playing')
    .replace(/truckin'/gi, 'truckin')
    .replace(/lovin'/gi, 'loving')
    .replace(/&/g, 'and')
    .replace(/'/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Get all rated performances for a specific song
 */
export function getRatedPerformancesForSong(
  songTitle: string
): RatedSongPerformance[] {
  const normalized = normalizeSongTitleForLookup(songTitle);
  return ALL_RATED_SONG_PERFORMANCES
    .filter(perf => normalizeSongTitleForLookup(perf.songTitle) === normalized)
    .sort((a, b) => a.tier - b.tier);
}
