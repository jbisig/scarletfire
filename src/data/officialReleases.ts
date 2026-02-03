// Official Releases Data
// Maps show dates to official releases (Dick's Picks, Dave's Picks, etc.)

export interface StreamingLinks {
  spotify?: string;
  appleMusic?: string;
}

export interface OfficialRelease {
  name: string;           // Display name (e.g., "Dick's Picks Vol. 3")
  series: string;         // Series name for grouping
  showDates: string[];    // Array of dates in YYYY-MM-DD format (multi-disc releases)
  streaming?: StreamingLinks;
  artwork?: string;       // Album artwork URL
}

// All official releases indexed by their show dates
export const OFFICIAL_RELEASES: OfficialRelease[] = [
  // ============================================
  // DICK'S PICKS (36 volumes)
  // ============================================
  {
    name: "Dick's Picks Vol. 1",
    series: "Dick's Picks",
    showDates: ['1973-12-19'],
    streaming: {
      spotify: 'https://open.spotify.com/album/7kllcqzsmi744saUQQ7DiB',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-1-12-19-73-curtis-hixon-hall-tampa-fl/307798686',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/3b/bd/c7/mzi.nlcsefhm.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 2",
    series: "Dick's Picks",
    showDates: ['1971-10-31'],
    streaming: {
      spotify: 'https://open.spotify.com/album/45uNoDchZ61dBfOWGqeG0l',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-2-10-31-71-ohio-theater-columbus-oh/307797167',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/d5/1b/6c/mzi.wjieglfa.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 3",
    series: "Dick's Picks",
    showDates: ['1977-05-22'],
    streaming: {
      spotify: 'https://open.spotify.com/album/3KxT9J6KTuKeXox9BUikZ4',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-3-5-22-77-hollywood-sportatorium-pembroke/307797745',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/ff/35/3f/ff353ff5-6204-fc69-bb49-1d49665e9310/mzi.zbpalsrv.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 4",
    series: "Dick's Picks",
    showDates: ['1970-02-13', '1970-02-14'],
    streaming: {
      spotify: 'https://open.spotify.com/album/518Uq6B4Y3X1EnNr8SsGQ7',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-4-2-13-70-2-14-70-fillmore-east-new-york-ny/307936171',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/2d/1f/0c/mzi.xkkvpjov.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 5",
    series: "Dick's Picks",
    showDates: ['1979-12-26'],
    streaming: {
      spotify: 'https://open.spotify.com/album/5HS80DlI8zRtS34wyS6iaR',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-5-12-26-79-oakland-auditorium-arena-oakland-ca/308716656',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/20/bc/d4/mzi.vwxxnmky.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 6",
    series: "Dick's Picks",
    showDates: ['1983-10-14'],
    streaming: {
      spotify: 'https://open.spotify.com/album/0MUCSAd1FNHH0MQBEKVxm2',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-6-10-14-83-hartford-civic-center-hartford-ct/308743191',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/42/c5/4d/mzi.otnikhzu.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 7",
    series: "Dick's Picks",
    showDates: ['1974-09-09', '1974-09-10', '1974-09-11'],
    streaming: {
      spotify: 'https://open.spotify.com/album/2tDQBnR5OrbHg8mfGbetxf',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-7-9-9-74-9-11-74-alexandra-palace-london/307800679',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/f8/69/78/mzi.ftvibfnh.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 8",
    series: "Dick's Picks",
    showDates: ['1970-05-02'],
    streaming: {
      spotify: 'https://open.spotify.com/album/4NldodakYXDeK7OoEe2oBW',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-8-5-2-70-harpur-college-binghamton-ny/307801530',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/af/48/6a/af486a1b-4d9c-587f-d5cf-243d269ef482/mzi.uxkksefp.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 9",
    series: "Dick's Picks",
    showDates: ['1990-09-16'],
    streaming: {
      spotify: 'https://open.spotify.com/album/2Ki3onvS212d1YPeduDkCk',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-9-9-16-90-madison-square-garden-new-york-ny/307801296',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/a8/fd/f9/mzi.cqiejtrd.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 10",
    series: "Dick's Picks",
    showDates: ['1977-12-29'],
    streaming: {
      spotify: 'https://open.spotify.com/album/1ZMr1r6Lxv79dhy4qHZHkK',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-10-12-29-77-winterland-arena-san-francisco-ca/307801079',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/4f/c7/a1/mzi.ferffxoo.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 11",
    series: "Dick's Picks",
    showDates: ['1972-09-27'],
    streaming: {
      spotify: 'https://open.spotify.com/album/2pPrEb0IJFk3W6NoQSMnZM',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-11-9-27-72-stanley-theater-jersey-city-nj/307800865',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/79/91/7e/mzi.cgyuicjy.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 12",
    series: "Dick's Picks",
    showDates: ['1974-06-26', '1974-06-28'],
    streaming: {
      spotify: 'https://open.spotify.com/album/0B87pzzLQzyevvMvdcJqHZ',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-12-6-26-74-providence-civic-center/307800748',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/4b/c7/1f/mzi.zqchxaae.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 13",
    series: "Dick's Picks",
    showDates: ['1981-05-06'],
    streaming: {
      spotify: 'https://open.spotify.com/album/5KhX09Ik4LFkLGgwz6DxJa',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-13-5-6-81-nassau-coliseum-uniondale-ny/307800320',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/ac/75/f3/mzi.chyyprmr.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 14",
    series: "Dick's Picks",
    showDates: ['1973-11-30', '1973-12-02'],
    streaming: {
      spotify: 'https://open.spotify.com/album/69UIkpF0CA8RJQqCsrGgLo',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-14-11-30-73-12-2-73-boston-music-hall-boston-ma/307936212',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/53/71/40/mzi.qibniygh.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 15",
    series: "Dick's Picks",
    showDates: ['1977-09-03'],
    streaming: {
      spotify: 'https://open.spotify.com/album/5uzn9YQ9XS2OoAt65U8Drg',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-15-9-3-77-raceway-park-englishtown-nj/308714960',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/2b/79/67/mzi.jngvjijp.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 16",
    series: "Dick's Picks",
    showDates: ['1969-11-08'],
    streaming: {
      spotify: 'https://open.spotify.com/album/1GbnL43DSgDRIIvKTVDSjP',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-16-11-8-69-fillmore-auditorium-san/308006119',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/6a/bf/ab/mzi.yxctqatd.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 17",
    series: "Dick's Picks",
    showDates: ['1991-09-25'],
    streaming: {
      spotify: 'https://open.spotify.com/album/1rZjJhRyYT3MAQrCSxoF6D',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-17-9-25-91-boston-garden-boston-ma/308732495',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/a8/ba/bb/mzi.wplenrnw.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 18",
    series: "Dick's Picks",
    showDates: ['1978-02-03', '1978-02-05'],
    streaming: {
      spotify: 'https://open.spotify.com/album/1eXlwGtPpBs59cULO5gb4i',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-18-2-3-78-dane-county-coliseum-madison/307802500',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/07/f7/ad/mzi.llzjrtag.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 19",
    series: "Dick's Picks",
    showDates: ['1973-10-19'],
    streaming: {
      spotify: 'https://open.spotify.com/album/1GU8dYooagGR6jBwbdsGCr',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-19-10-19-73-fairgrounds-arena-oklahoma/307936174',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/33/55/07/mzi.izpfcogx.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 20",
    series: "Dick's Picks",
    showDates: ['1976-09-25'],
    streaming: {
      spotify: 'https://open.spotify.com/album/34KjKiNyuggM0g2No4ZnTv',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-20-9-25-76-capital-centre-landover-md/308726301',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/04/90/ca/mzi.kvvisajm.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 21",
    series: "Dick's Picks",
    showDates: ['1985-11-01'],
    streaming: {
      spotify: 'https://open.spotify.com/album/4QLlTAC9pOzbZo7qQ63dXm',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-21-11-1-85-richmond-coliseum-richmond-va/307796629',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/2b/86/b4/mzi.mimgwzfm.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 22",
    series: "Dick's Picks",
    showDates: ['1968-02-23', '1968-02-24'],
    streaming: {
      spotify: 'https://open.spotify.com/album/2aipUPHU0KrGAq2QaAvlOz',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-22-2-23-68-2-24-68-kings-beach-bowl/307796648',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/11/8c/ae/mzi.mswayqbn.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 23",
    series: "Dick's Picks",
    showDates: ['1972-09-17'],
    streaming: {
      spotify: 'https://open.spotify.com/album/7gyyunPy7dVsDB4cp7ZReW',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-23-9-17-72-baltimore-civic-center-baltimore/307797076',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/41/22/af/mzi.crxhsagf.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 24",
    series: "Dick's Picks",
    showDates: ['1974-03-23'],
    streaming: {
      spotify: 'https://open.spotify.com/album/4jiBYEFx7rv6C6UTYywZZO',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-24-3-23-74-cow-palace-daly-city-ca/307796986',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/3d/b1/71/mzi.vdeovdac.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 25",
    series: "Dick's Picks",
    showDates: ['1978-05-10'],
    streaming: {
      spotify: 'https://open.spotify.com/album/1C1qBy9KA5ddXkl6Ya82gr',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-25-5-10-78-veterans-memorial-coliseum-new-haven-ct/307799899',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/91/a1/b7/mzi.fscpxfcm.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 26",
    series: "Dick's Picks",
    showDates: ['1969-04-26'],
    streaming: {
      spotify: 'https://open.spotify.com/album/50rpHqRFD3K7bCTRBtraGH',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-26-4-26-69-electric-theater-chicago/307799435',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/59/af/c6/mzi.zpcglexg.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 27",
    series: "Dick's Picks",
    showDates: ['1992-12-16'],
    streaming: {
      spotify: 'https://open.spotify.com/album/1ao7jrAGQ6xf6ywjbKM8vU',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-27-12-16-92-oakland-coliseum-arena-oakland-ca/307799423',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/dc/1b/1d/mzi.wuhcslum.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 28",
    series: "Dick's Picks",
    showDates: ['1973-02-26', '1973-02-28'],
    streaming: {
      spotify: 'https://open.spotify.com/album/0xp6JpT8jrnK0FV4Xf4MG0',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-28-2-26-73-pershing-municipal-auditorium/308709683',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/8c/f6/f4/mzi.sypvxthm.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 29",
    series: "Dick's Picks",
    showDates: ['1977-05-19', '1977-05-21'],
    streaming: {
      spotify: 'https://open.spotify.com/album/4nuyKoY91WKwR6HLq7Gzkl',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-29-5-19-77-fox-theater-atlanta-ga-5/307796620',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/f3/08/3d/f3083d07-d4a9-3213-db10-05f600129896/mzi.iacdsyuv.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 30",
    series: "Dick's Picks",
    showDates: ['1972-03-25', '1972-03-28'],
    streaming: {
      spotify: 'https://open.spotify.com/album/1cnArqU8gDNK2pPksZsQZw',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-30-3-25-72-3-28-72-academy-of-music-new-york-ny/307799408',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/be/06/93/mzi.sofzjdfl.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 31",
    series: "Dick's Picks",
    showDates: ['1974-08-04', '1974-08-05'],
    streaming: {
      spotify: 'https://open.spotify.com/album/0EgV8QqWBeSt1U6MBK6NnC',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-31-8-4-74-8-5-74-philadelphia-civic/307798975',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/1f/f1/dc/mzi.uuvzscuo.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 32",
    series: "Dick's Picks",
    showDates: ['1982-08-07'],
    streaming: {
      spotify: 'https://open.spotify.com/album/3Nru2SaW3yVSxqHbWNXcwc',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-32-8-7-82-alpine-valley-music-theater/307798335',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/be/c6/7e/mzi.kqshrfcu.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 33",
    series: "Dick's Picks",
    showDates: ['1976-10-09', '1976-10-10'],
    streaming: {
      spotify: 'https://open.spotify.com/album/4sY292VqKmwyj1RYlhBFoA',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-33-10-9-76-10-10-76-oakland-coliseum/307823468',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/e5/77/53/mzi.skfzqtjl.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 34",
    series: "Dick's Picks",
    showDates: ['1977-11-05'],
    streaming: {
      spotify: 'https://open.spotify.com/album/24rc4HaQfvOOSnq32PkOC1',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-34-11-5-77-community-war-memorial-rochester/307802158',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/03/58/cd/mzi.ttukavzt.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 35",
    series: "Dick's Picks",
    showDates: ['1971-08-07', '1971-08-24'],
    streaming: {
      spotify: 'https://open.spotify.com/album/3jzf0bKlIMjSQNk5wibVHT',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-35-8-7-71-golden-hall-san-diego-ca/308720571',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/91/30/f5/mzi.dorwxpcn.jpg/600x600bb.jpg',
  },
  {
    name: "Dick's Picks Vol. 36",
    series: "Dick's Picks",
    showDates: ['1972-09-21'],
    streaming: {
      spotify: 'https://open.spotify.com/album/1lNa8R1EuIfJz9zhZ0H1vx',
      appleMusic: 'https://music.apple.com/us/album/dicks-picks-vol-36-9-21-72-the-spectrum-philadelphia-pa/307801946',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/08/ee/9a/mzi.aqucefzc.jpg/600x600bb.jpg',
  },

  // ============================================
  // DOWNLOAD SERIES (12 volumes)
  // ============================================
  {
    name: 'Download Series Vol. 1',
    series: 'Download Series',
    showDates: ['1977-04-30'],
    streaming: {
      spotify: 'https://open.spotify.com/album/3PT8V8Rok86NvRgdP92yj9',
      appleMusic: 'https://music.apple.com/us/album/download-series-vol-1-4-30-77-palladium-new-york-ny/312422017',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/0d/29/19/mzi.bdqntufs.jpg/600x600bb.jpg',
  },
  {
    name: 'Download Series Vol. 2',
    series: 'Download Series',
    showDates: ['1970-01-18'],
    streaming: {
      spotify: 'https://open.spotify.com/album/34ZSMxipFp6GVTLUVmc009',
      appleMusic: 'https://music.apple.com/us/album/download-series-vol-2-1-18-70-springers-inn-portland-or/312354174',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/75/df/09/mzi.oagztxnp.jpg/600x600bb.jpg',
  },
  {
    name: 'Download Series Vol. 3',
    series: 'Download Series',
    showDates: ['1971-10-26'],
    streaming: {
      spotify: 'https://open.spotify.com/album/0lyrgO8Pmo87VJqP6ej4Ax',
      appleMusic: 'https://music.apple.com/us/album/download-series-vol-3-10-26-71-the-palestra-rochester-ny/312353957',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/e9/dc/99/mzi.kjivjvzx.jpg/600x600bb.jpg',
  },
  {
    name: 'Download Series Vol. 4',
    series: 'Download Series',
    showDates: ['1976-06-18', '1976-06-21'],
    streaming: {
      spotify: 'https://open.spotify.com/album/5h5Wx6ltrPyzb7yRFPzEyX',
      appleMusic: 'https://music.apple.com/us/album/download-series-vol-4-6-18-76-capitol-theatre-passaic/312422180',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/5b/cd/36/mzi.dddcxngj.jpg/600x600bb.jpg',
  },
  {
    name: 'Download Series Vol. 5',
    series: 'Download Series',
    showDates: ['1988-03-27'],
    streaming: {
      spotify: 'https://open.spotify.com/album/3LzNGrAGOmLbdQRSRcJzxf',
      appleMusic: 'https://music.apple.com/us/album/download-series-vol-5-3-27-88-hampton-coliseum-hampton-va/312353504',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/1c/b6/f3/mzi.svgjjijn.jpg/600x600bb.jpg',
  },
  {
    name: 'Download Series Vol. 6',
    series: 'Download Series',
    showDates: ['1968-03-17'],
    streaming: {
      spotify: 'https://open.spotify.com/album/04BKBau3lJBVp0xY5wzmPW',
      appleMusic: 'https://music.apple.com/us/album/download-series-vol-6-3-17-68-carousel-ballroom-san/312352898',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/44/2c/30/mzi.lmijyoay.jpg/600x600bb.jpg',
  },
  {
    name: 'Download Series Vol. 7',
    series: 'Download Series',
    showDates: ['1980-09-03', '1980-09-04'],
    streaming: {
      spotify: 'https://open.spotify.com/album/0e0DiVVupxN4D9xOspyKRU',
      appleMusic: 'https://music.apple.com/us/album/download-series-vol-7-9-30-80-springfield-civic-center/312352905',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/e5/23/f4/mzi.fammezwc.jpg/600x600bb.jpg',
  },
  {
    name: 'Download Series Vol. 8',
    series: 'Download Series',
    showDates: ['1973-12-10'],
    streaming: {
      spotify: 'https://open.spotify.com/album/700QCCumNYFQgg22mArrAw',
      appleMusic: 'https://music.apple.com/us/album/download-series-vol-8-12-10-73-charlotte-coliseum/312352277',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/db/47/89/mzi.yclmgtic.jpg/600x600bb.jpg',
  },
  {
    name: 'Download Series Vol. 9',
    series: 'Download Series',
    showDates: ['1989-04-02', '1989-04-03'],
    streaming: {
      spotify: 'https://open.spotify.com/album/7CuPAAL41j1vEjYTjNh2OA',
      appleMusic: 'https://music.apple.com/us/album/download-series-vol-9-4-2-89-4-3-89-civic-arena-pittsburgh-pa/312354579',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/92/91/b1/mzi.eddkhdpt.jpg/600x600bb.jpg',
  },
  {
    name: 'Download Series Vol. 10',
    series: 'Download Series',
    showDates: ['1972-07-21', '1972-07-22'],
    streaming: {
      spotify: 'https://open.spotify.com/album/0nMKTUPdDm7Zk5WbIfjTKg',
      appleMusic: 'https://music.apple.com/us/album/download-series-vol-10-7-21-72-paramount-northwest/312354380',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/b2/d9/eb/mzi.ggleymln.jpg/600x600bb.jpg',
  },
  {
    name: 'Download Series Vol. 11',
    series: 'Download Series',
    showDates: ['1991-06-20'],
    streaming: {
      spotify: 'https://open.spotify.com/album/67fPMapwwewntR68xRwqfM',
      appleMusic: 'https://music.apple.com/us/album/download-series-vol-11-6-20-91-pine-knob-music-theater/312354625',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/17/0e/ec/mzi.pbhypgwl.jpg/600x600bb.jpg',
  },
  {
    name: 'Download Series Vol. 12',
    series: 'Download Series',
    showDates: ['1969-04-17'],
    streaming: {
      spotify: 'https://open.spotify.com/album/5qtj5KMkzFx1270VxODSkD',
      appleMusic: 'https://music.apple.com/us/album/download-series-vol-12-4-17-69-washington-u-st-louis/312351827',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/1f/d6/dd/mzi.njukkckp.jpg/600x600bb.jpg',
  },

  // ============================================
  // STANDALONE / BOX SET RELEASES
  // ============================================
  {
    name: 'Sunshine Daydream',
    series: 'Box Set',
    showDates: ['1972-08-27'],
    streaming: {
      spotify: 'https://open.spotify.com/album/1E4MXxSYoAMN5qpy1y6aBm',
      appleMusic: 'https://music.apple.com/us/album/the-complete-sunshine-daydream-concert-veneta-or-8-27/680077190',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Features/v4/e9/99/d0/e999d0a2-8061-b0d3-1e89-4e35cb0ca9cf/dj.namgtyjn.jpg/600x600bb.jpg',
  },
  {
    name: "Cornell 5/8/77",
    series: 'Box Set',
    showDates: ['1977-05-08'],
    streaming: {
      spotify: 'https://open.spotify.com/album/3T9UKU0jMIyrRD0PtKXqPJ',
      appleMusic: 'https://music.apple.com/us/album/cornell-5-8-77-live/1204914175',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/39/f3/ae/39f3aef8-f226-b196-7f75-35c9d23cc8ab/603497872121.jpg/600x600bb.jpg',
  },
  {
    name: 'One From The Vault',
    series: 'From The Vault',
    showDates: ['1975-08-13'],
    streaming: {
      spotify: 'https://open.spotify.com/album/7K5jvjbQB05gnFxsgwPvmt',
      appleMusic: 'https://music.apple.com/us/album/one-from-the-vault-live/307794359',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/b7/dd/93/mzi.pzlcafik.jpg/600x600bb.jpg',
  },
  {
    name: 'Two From The Vault',
    series: 'From The Vault',
    showDates: ['1968-08-24'],
    streaming: {
      spotify: 'https://open.spotify.com/album/1bKxygqnMcS7twRhGMK36U',
      appleMusic: 'https://music.apple.com/us/album/two-from-the-vault/307794876',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/f6/82/ab/mzi.aabywbqf.jpg/600x600bb.jpg',
  },
  {
    name: 'The Closing of Winterland',
    series: 'Box Set',
    showDates: ['1978-12-31'],
    streaming: {
      spotify: 'https://open.spotify.com/album/3RtA7CxOnsJvfipdg4A3U8',
      appleMusic: 'https://music.apple.com/us/album/the-closing-of-winterland-december-31-1978-live/308704342',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/3e/52/69/mzi.icahwtdf.jpg/600x600bb.jpg',
  },
  {
    name: 'Live/Dead',
    series: 'Studio Album',
    showDates: ['1969-01-26', '1969-02-27', '1969-02-28', '1969-03-01', '1969-03-02'],
    streaming: {
      spotify: 'https://open.spotify.com/album/6E7JCQINTT4vwRF4wBcsYk',
      appleMusic: 'https://music.apple.com/us/album/live-dead-remastered/20885553',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/e6/91/90/e6919048-e52a-2d4a-9fbc-53e7d502dcd3/081227003968.jpg/600x600bb.jpg',
  },
  {
    name: 'Reckoning',
    series: 'Studio Album',
    showDates: ['1980-09-25', '1980-09-26', '1980-09-27', '1980-10-01', '1980-10-02', '1980-10-03',
                '1980-10-06', '1980-10-08', '1980-10-09', '1980-10-10'],
    streaming: {
      spotify: 'https://open.spotify.com/album/1T7YIthjEvwsxbUHZ7NdBD',
      appleMusic: 'https://music.apple.com/us/album/reckoning-live/291317412',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/a5/ff/6c/a5ff6cca-559d-126c-cf3a-7c88bb2e4d1d/603497977512.jpg/600x600bb.jpg',
  },
  // ============================================
  // EUROPE '72 COMPLETE RECORDINGS (22 volumes)
  // ============================================
  {
    name: "Europe '72 Vol. 1",
    series: "Europe '72",
    showDates: ['1972-04-07'],
    streaming: {
      spotify: 'https://open.spotify.com/album/6j3vuVPhMRB0H5CgPZ8wTd',
      appleMusic: 'https://music.apple.com/us/album/europe-72-vol-1-4-7-72-live-at-wembley-empire-pool/780189659',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/6b/00/d0/6b00d057-107d-652e-dc21-61d41f3d8b17/603497906567.jpg/600x600bb.jpg',
  },
  {
    name: "Europe '72 Vol. 2",
    series: "Europe '72",
    showDates: ['1972-04-08'],
    streaming: {
      spotify: 'https://open.spotify.com/album/75u5l9TfTohni1xWrAUfxe',
      appleMusic: 'https://music.apple.com/us/album/europe-72-vol-2-4-8-72-live-at-wembley-empire-pool/780191275',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/e8/20/50/e82050b6-9b11-1ac7-c9da-5ebad2df076c/603497906550.jpg/600x600bb.jpg',
  },
  {
    name: "Europe '72 Vol. 3",
    series: "Europe '72",
    showDates: ['1972-04-11'],
    streaming: {
      spotify: 'https://open.spotify.com/album/65WlVRyo45LwtRg8QJfya3',
      appleMusic: 'https://music.apple.com/us/album/europe-72-vol-3-4-11-72-live-at-city-hall-newcastle-england/780184752',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/9b/01/74/9b0174d9-7213-8ea7-70f5-b7f197d742d1/603497906543.jpg/600x600bb.jpg',
  },
  {
    name: "Europe '72 Vol. 4",
    series: "Europe '72",
    showDates: ['1972-04-14'],
    streaming: {
      spotify: 'https://open.spotify.com/album/7l9AfB3E5teHyZ0g7WDlx1',
      appleMusic: 'https://music.apple.com/us/album/europe-72-vol-4-4-14-72-tivoli-concert-hall-copenhagen/780183678',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/27/b4/f7/27b4f730-dd73-037c-5781-4809eb18168c/603497906536.jpg/600x600bb.jpg',
  },
  {
    name: "Europe '72 Vol. 5",
    series: "Europe '72",
    showDates: ['1972-04-16'],
    streaming: {
      spotify: 'https://open.spotify.com/album/3eeKCzpqxZ68pBvyjKPvn9',
      appleMusic: 'https://music.apple.com/us/album/europe-72-vol-5-4-16-72-stakladen-aarhus-university/780178680',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/71/bb/4b/71bb4b63-a71a-7f05-2d5e-28f6127e8271/603497906529.jpg/600x600bb.jpg',
  },
  {
    name: "Europe '72 Vol. 6",
    series: "Europe '72",
    showDates: ['1972-04-17'],
    streaming: {
      spotify: 'https://open.spotify.com/album/6Yw0qA9xNfFpkSwzwIOwOW',
      appleMusic: 'https://music.apple.com/us/album/europe-72-vol-6-4-17-72-live-at-tivoli-concert-hall/878029600',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/09/5d/77/095d77e5-a9e4-d19a-5e49-cd32f67523e2/603497903191.jpg/600x600bb.jpg',
  },
  {
    name: "Europe '72 Vol. 7",
    series: "Europe '72",
    showDates: ['1972-04-21'],
    streaming: {
      spotify: 'https://open.spotify.com/album/32h6hF1i79qgFGwVh0qTJk',
      appleMusic: 'https://music.apple.com/us/album/europe-72-vol-7-4-21-72-beat-club-bremen-west-germany/878028049',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/31/59/c4/3159c408-fa83-d4c1-4f60-22f18f1bf7e6/603497903184.jpg/600x600bb.jpg',
  },
  {
    name: "Europe '72 Vol. 8",
    series: "Europe '72",
    showDates: ['1972-04-24'],
    streaming: {
      spotify: 'https://open.spotify.com/album/3FmkdOqxKwpol7so3sdIUg',
      appleMusic: 'https://music.apple.com/us/album/europe-72-vol-8-4-24-72-rheinhalle-dusseldorf-west-germany/878030106',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/69/9f/08/699f08b4-e48f-962c-8844-c0ca924afe39/603497903177.jpg/600x600bb.jpg',
  },
  {
    name: "Europe '72 Vol. 9",
    series: "Europe '72",
    showDates: ['1972-04-26'],
    streaming: {
      spotify: 'https://open.spotify.com/album/2IjyW9HhEre9dSNCOOzHhS',
      appleMusic: 'https://music.apple.com/us/album/europe-72-vol-9-4-26-72-jahrhundert-halle-frankfurt/878028485',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/09/15/b1/0915b16f-35fb-2dd1-2b2f-510929f69700/603497903160.jpg/600x600bb.jpg',
  },
  {
    name: "Europe '72 Vol. 10",
    series: "Europe '72",
    showDates: ['1972-04-29'],
    streaming: {
      spotify: 'https://open.spotify.com/album/1WBPhea5H2NnDaNuAFI0Fr',
      appleMusic: 'https://music.apple.com/us/album/europe-72-vol-10-4-29-72-musikhalle-hamburg-west-germany/878022743',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/a0/42/07/a0420746-9fb2-098e-473e-2387995d981a/603497903153.jpg/600x600bb.jpg',
  },
  {
    name: "Europe '72 Vol. 11",
    series: "Europe '72",
    showDates: ['1972-05-03'],
    streaming: {
      spotify: 'https://open.spotify.com/album/4avLivYQqNDnkxfMDTSIsJ',
      appleMusic: 'https://music.apple.com/us/album/europe-72-vol-11-5-3-72-lolympia-paris-france/944786977',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/27/49/dc/2749dc4a-f4c9-6a9b-4d14-e65e374e1536/603497895144.jpg/600x600bb.jpg',
  },
  {
    name: "Europe '72 Vol. 12",
    series: "Europe '72",
    showDates: ['1972-05-04'],
    streaming: {
      spotify: 'https://open.spotify.com/album/3S1abYMND9BSJzbMcpJhj8',
      appleMusic: 'https://music.apple.com/us/album/europe-72-vol-12-5-4-72-lolympia-paris-france/944811077',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/56/0b/4a/560b4a6c-0a4b-5317-5a64-18e5d472d86f/603497895137.jpg/600x600bb.jpg',
  },
  {
    name: "Europe '72 Vol. 13",
    series: "Europe '72",
    showDates: ['1972-05-07'],
    streaming: {
      spotify: 'https://open.spotify.com/album/2dey7kGDFAByEACexapiV6',
      appleMusic: 'https://music.apple.com/us/album/europe-72-vol-13-5-7-72-bickershaw-festival-wigan-england/945575608',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/4b/68/d7/4b68d754-a39b-8e1d-d10a-122e6872841b/603497895120.jpg/600x600bb.jpg',
  },
  {
    name: "Europe '72 Vol. 14",
    series: "Europe '72",
    showDates: ['1972-05-10'],
    streaming: {
      spotify: 'https://open.spotify.com/album/5T7RvMATOxVnCM4Q32S7vH',
      appleMusic: 'https://music.apple.com/us/album/europe-72-vol-14-5-10-72-concertgebouw-amsterdam-holland/947175867',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/e9/c4/5a/e9c45a12-6a75-4ecf-d6ac-3b575b77261a/603497895113.jpg/600x600bb.jpg',
  },
  {
    name: "Europe '72 Vol. 15",
    series: "Europe '72",
    showDates: ['1972-05-11'],
    streaming: {
      spotify: 'https://open.spotify.com/album/2GVmIIvRpvCwQbvBNUM2K4',
      appleMusic: 'https://music.apple.com/us/album/europe-72-vol-15-5-11-72-grote-zaal-doelen-rotterdam/945571633',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/65/15/48/65154889-7a16-24dd-f66e-a7b81a2e39a8/603497895106.jpg/600x600bb.jpg',
  },
  {
    name: "Europe '72 Vol. 16",
    series: "Europe '72",
    showDates: ['1972-05-13'],
    streaming: {
      spotify: 'https://open.spotify.com/album/6CMuGqQsNf5TRxFBSGY2JT',
      appleMusic: 'https://music.apple.com/us/album/europe-72-vol-16-5-13-72-lille/990359720',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/bd/a3/6d/bda36d3d-6030-d3d2-cfd4-3ac53921ca0a/603497891382.jpg/600x600bb.jpg',
  },
  {
    name: "Europe '72 Vol. 17",
    series: "Europe '72",
    showDates: ['1972-05-16'],
    streaming: {
      spotify: 'https://open.spotify.com/album/7d3bghzAeP1NN27apW1YTI',
      appleMusic: 'https://music.apple.com/us/album/europe-72-vol-17-5-16-72-la-grande-salle-du-grand-theatre/990039754',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/5b/2e/d0/5b2ed09b-9846-76d8-857d-f0845331fabf/603497891375.jpg/600x600bb.jpg',
  },
  {
    name: "Europe '72 Vol. 18",
    series: "Europe '72",
    showDates: ['1972-05-18'],
    streaming: {
      spotify: 'https://open.spotify.com/album/0M7PIylsjtbgDxZCf1tef4',
      appleMusic: 'https://music.apple.com/us/album/europe-72-vol-18-5-18-72-kongressaal-munich-west-germany/990904451',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/e7/a4/9b/e7a49b0b-f0ef-9595-3145-33a141e61054/603497891368.jpg/600x600bb.jpg',
  },
  {
    name: "Europe '72 Vol. 19",
    series: "Europe '72",
    showDates: ['1972-05-23'],
    streaming: {
      spotify: 'https://open.spotify.com/album/1K4AvpTllYaNUNcRYw9Pyn',
      appleMusic: 'https://music.apple.com/us/album/europe-72-vol-19-5-23-72-lyceum-theatre-london-england/990355457',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/7a/04/43/7a0443dc-686a-ecdb-a7e9-48db2c5caa50/603497891351.jpg/600x600bb.jpg',
  },
  {
    name: "Europe '72 Vol. 20",
    series: "Europe '72",
    showDates: ['1972-05-24'],
    streaming: {
      spotify: 'https://open.spotify.com/album/3EZpSEJ1k1BovW6Tp2Klz1',
      appleMusic: 'https://music.apple.com/us/album/europe-72-vol-20-5-24-72-lyceum-theatre-london-england/998054817',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/22/db/59/22db59c1-abe5-4207-4863-fb660027eae9/603497891344.jpg/600x600bb.jpg',
  },
  {
    name: "Europe '72 Vol. 21",
    series: "Europe '72",
    showDates: ['1972-05-25'],
    streaming: {
      spotify: 'https://open.spotify.com/album/29pkQOWIBGGFD1EncVkILn',
      appleMusic: 'https://music.apple.com/us/album/europe-72-vol-21-5-25-72-lyceum-theatre-london-england/1001282949',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/9a/85/3f/9a853fc6-a629-74e0-a4d3-2ca39c7fa832/603497891337.jpg/600x600bb.jpg',
  },
  {
    name: "Europe '72 Vol. 22",
    series: "Europe '72",
    showDates: ['1972-05-26'],
    streaming: {
      spotify: 'https://open.spotify.com/album/6tgzqy3Keqge7DAPRw2asB',
      appleMusic: 'https://music.apple.com/us/album/europe-72-vol-22-5-26-72-lyceum-theatre-london-england/1001272416',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/47/b2/c2/47b2c2bf-bd73-0894-130c-74dd0c8bec5b/603497891320.jpg/600x600bb.jpg',
  },

  // ============================================
  // ROAD TRIPS SERIES (17 volumes)
  // ============================================
  {
    name: 'Road Trips Vol. 1 No. 1',
    series: 'Road Trips',
    showDates: ['1979-10-25', '1979-11-06', '1979-11-08', '1979-11-09', '1979-11-10'],
    streaming: {
      spotify: 'https://open.spotify.com/album/50ZGquEDNvdyMWPejqZ3sK',
      appleMusic: 'https://music.apple.com/us/album/road-trips-vol-1-no-1-10-25-79-new-haven-coliseum-new/781298791',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/ed/ab/19/edab19c9-e83b-99d3-641c-b8cc5cb690f7/603497935840.jpg/600x600bb.jpg',
  },
  {
    name: 'Road Trips Vol. 1 No. 2',
    series: 'Road Trips',
    showDates: ['1977-10-11', '1977-10-14', '1977-10-16'],
    streaming: {
      spotify: 'https://open.spotify.com/album/1tyaHUMSKGFgBGAjBzLhHQ',
      appleMusic: 'https://music.apple.com/us/album/road-trips-vol-1-no-2-10-11-77-university-of/781265843',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music4/v4/99/b4/0d/99b40db9-a281-0c68-0daa-4d8d91c5f4d3/603497935833.jpg/600x600bb.jpg',
  },
  {
    name: 'Road Trips Vol. 1 No. 3',
    series: 'Road Trips',
    showDates: ['1971-07-31', '1971-08-23'],
    streaming: {
      spotify: 'https://open.spotify.com/album/1YaNuOYt6ixUJvqZWOv89Z',
      appleMusic: 'https://music.apple.com/us/album/road-trips-vol-1-no-3-7-31-71-yale-bowl-new-haven-ct/781267395',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music4/v4/5f/e5/ea/5fe5ea1a-c9a4-41cc-407a-b25c08b4a641/603497935826.jpg/600x600bb.jpg',
  },
  {
    name: 'Road Trips Vol. 1 No. 4',
    series: 'Road Trips',
    showDates: ['1978-10-21', '1978-10-22'],
    streaming: {
      spotify: 'https://open.spotify.com/album/5SuDKo7ABbijzVStz3tye6',
      appleMusic: 'https://music.apple.com/us/album/road-trips-vol-1-no-4-10-21-78-winterland-arena/781262792',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music6/v4/b6/0e/30/b60e30db-eee4-899f-66a5-522f60346ddd/603497935819.jpg/600x600bb.jpg',
  },
  {
    name: 'Road Trips Vol. 2 No. 1',
    series: 'Road Trips',
    showDates: ['1990-09-18', '1990-09-19', '1990-09-20'],
    streaming: {
      spotify: 'https://open.spotify.com/album/4anixywSOtI1fT8xZmt0T0',
      appleMusic: 'https://music.apple.com/us/album/road-trips-vol-2-no-1-9/781235512',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music4/v4/fe/d7/93/fed793f9-6610-029d-7f6b-6f5d99615db7/603497934799.jpg/600x600bb.jpg',
  },
  {
    name: 'Road Trips Vol. 2 No. 2',
    series: 'Road Trips',
    showDates: ['1968-02-14'],
    streaming: {
      spotify: 'https://open.spotify.com/album/2AFvuXk9bE6VubjATxejPM',
      appleMusic: 'https://music.apple.com/us/album/road-trips-vol-2-no-2-2-14-68-carousel-ballroom-san/781260750',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/v4/62/fb/01/62fb014a-d125-5046-0c75-f28dc33f9612/603497935802.jpg/600x600bb.jpg',
  },
  {
    name: 'Road Trips Vol. 2 No. 3',
    series: 'Road Trips',
    showDates: ['1974-06-16', '1974-06-18'],
    streaming: {
      spotify: 'https://open.spotify.com/album/6NRF4T70aSx66ZqD8PBzum',
      appleMusic: 'https://music.apple.com/us/album/road-trips-vol-2-no-3-6-16-74-state-fairgrounds-des/781262885',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/v4/e0/ff/bb/e0ffbb24-0dd3-0a1a-4b0f-50e638b23db5/603497935796.jpg/600x600bb.jpg',
  },
  {
    name: 'Road Trips Vol. 2 No. 4',
    series: 'Road Trips',
    showDates: ['1993-05-26', '1993-05-27'],
    streaming: {
      spotify: 'https://open.spotify.com/album/3YX1Hy95qmEB129MhfYynb',
      appleMusic: 'https://music.apple.com/us/album/road-trips-vol-2-no-4-5-26-93-5-27-93-cal-expo-sacramento-ca/781259996',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music4/v4/50/b6/b0/50b6b0d9-ed10-6c8d-15ee-df97e8587f58/603497934911.jpg/600x600bb.jpg',
  },
  {
    name: 'Road Trips Vol. 3 No. 1',
    series: 'Road Trips',
    showDates: ['1979-12-28'],
    streaming: {
      spotify: 'https://open.spotify.com/album/6KiDJOqOVs44Xm4QWuBMuD',
      appleMusic: 'https://music.apple.com/us/album/road-trips-vol-3-no-1-12-28-79-oakland-auditorium-arena/781258204',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music6/v4/93/c2/79/93c27901-d079-b8fe-8271-897fe7114540/603497934904.jpg/600x600bb.jpg',
  },
  {
    name: 'Road Trips Vol. 3 No. 2',
    series: 'Road Trips',
    showDates: ['1971-11-15'],
    streaming: {
      spotify: 'https://open.spotify.com/album/034RQfqJs6FKPW4Kwt5xFJ',
      // Apple Music link not available for this release
    },
  },
  {
    name: 'Road Trips Vol. 3 No. 3',
    series: 'Road Trips',
    showDates: ['1970-05-15'],
    streaming: {
      spotify: 'https://open.spotify.com/album/2qkOT57tPNvbuxKIaN3unj',
      appleMusic: 'https://music.apple.com/us/album/road-trips-vol-3-no-3-5-15-70-fillmore-east-new-york-ny/781254025',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/2f/61/5e/2f615e30-e135-f8ca-b2ec-cfb544279ef3/603497934874.jpg/600x600bb.jpg',
  },
  {
    name: 'Road Trips Vol. 3 No. 4',
    series: 'Road Trips',
    showDates: ['1980-05-06', '1980-05-07'],
    streaming: {
      spotify: 'https://open.spotify.com/album/0kJA5If1JkmPQBKOXJKLdN',
      appleMusic: 'https://music.apple.com/us/album/road-trips-vol-3-no-4-5-6-80-penn-state-university/781249616',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/v4/82/8d/dd/828dddc1-8199-69ca-d65a-ab8832b71007/603497934867.jpg/600x600bb.jpg',
  },
  {
    name: 'Road Trips Vol. 4 No. 1',
    series: 'Road Trips',
    showDates: ['1969-05-23', '1969-05-24'],
    streaming: {
      spotify: 'https://open.spotify.com/album/2N95jKNW9F4onIZSdDaxmH',
      appleMusic: 'https://music.apple.com/us/album/road-trips-vol-4-no-1-5-23-69-5-24-69-seminole-reservation/781247925',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music6/v4/e5/18/c7/e518c77b-a646-c720-0d1a-927c2270a12a/603497934850.jpg/600x600bb.jpg',
  },
  {
    name: 'Road Trips Vol. 4 No. 2',
    series: 'Road Trips',
    showDates: ['1988-03-31', '1988-04-01'],
    streaming: {
      spotify: 'https://open.spotify.com/album/4hLemSKEV5nBJGcN1mgfUT',
      appleMusic: 'https://music.apple.com/us/album/road-trip-s-vol-4-no-2-3-31-88-4-1-88-brendan-byrne/781245239',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music6/v4/b5/1d/7b/b51d7b7b-d247-cd47-b324-b3ab3fc640de/603497934843.jpg/600x600bb.jpg',
  },
  {
    name: 'Road Trips Vol. 4 No. 3',
    series: 'Road Trips',
    showDates: ['1973-11-20', '1973-11-21'],
    streaming: {
      spotify: 'https://open.spotify.com/album/1h6xLiUeUhtOyqAOgLwl0g',
      appleMusic: 'https://music.apple.com/us/album/road-trips-vol-4-no-3-11-20-73-11-21-73-denver-coliseum-denver-co/781242420',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/v4/97/45/b2/9745b236-52f6-070e-507e-2b46327a8c94/603497934836.jpg/600x600bb.jpg',
  },
  {
    name: 'Road Trips Vol. 4 No. 4',
    series: 'Road Trips',
    showDates: ['1982-04-05', '1982-04-06'],
    streaming: {
      spotify: 'https://open.spotify.com/album/4jLvFauKahZwzGrxh2WKyj',
      appleMusic: 'https://music.apple.com/us/album/road-trips-vol-4-no-4-4-5-82-4-6-82-spectrum-philadelphia-pa/781238683',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music4/v4/51/fe/61/51fe61a4-47c2-0282-b295-aefc3264ea05/603497934829.jpg/600x600bb.jpg',
  },
  {
    name: 'Road Trips Vol. 4 No. 5',
    series: 'Road Trips',
    showDates: ['1976-06-09', '1976-06-12'],
    streaming: {
      spotify: 'https://open.spotify.com/album/5AgGAN9s4VxbwQNv8hOpM9',
      appleMusic: 'https://music.apple.com/us/album/road-trips-vol-4-no-5-6-9-76-6-12-76-boston-music-hall-boston-ma/781239970',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/v4/d0/40/ca/d040ca77-a0a5-05e6-57a7-ca8bd30b210a/603497934805.jpg/600x600bb.jpg',
  },

  // ============================================
  // 50TH ANNIVERSARY DELUXE EDITIONS (with live bonus content)
  // ============================================
  {
    name: 'The Grateful Dead (50th Anniversary)',
    series: '50th Anniversary',
    showDates: ['1966-07-29', '1966-07-30'],
    streaming: {
      spotify: 'https://open.spotify.com/album/3LjWksbSoyMWY9uG5glYKe',
      appleMusic: 'https://music.apple.com/us/album/grateful-dead-50th-anniversary-deluxe-edition/1178259490',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/5a/fb/f3/5afbf38c-a7f7-cb85-dcaa-4a35f2ed48e0/603497870189.jpg/600x600bb.jpg',
  },
  {
    name: 'Anthem of the Sun (50th Anniversary)',
    series: '50th Anniversary',
    showDates: ['1967-10-22'],
    streaming: {
      spotify: 'https://open.spotify.com/album/7oA5LaCIn1BE0kNYbKbTgI',
      appleMusic: 'https://music.apple.com/us/album/anthem-of-the-sun-50th-anniversary-deluxe-edition/1374273019',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/0b/0b/85/0b0b85df-af04-e3b1-2b0b-42a7b3ca3c6c/603497864867.jpg/600x600bb.jpg',
  },
  {
    name: 'Aoxomoxoa (50th Anniversary)',
    series: '50th Anniversary',
    showDates: ['1969-01-24', '1969-01-25', '1969-01-26'],
    streaming: {
      spotify: 'https://open.spotify.com/album/05RQvmOFKMA6YMZByVZN0Z',
      appleMusic: 'https://music.apple.com/us/album/aoxomoxoa-50th-anniversary-deluxe-edition/1457545325',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/9e/d0/06/9ed006e8-8e80-3679-7ada-264d2cd46c9b/603497856107.jpg/600x600bb.jpg',
  },
  {
    name: "Workingman's Dead (50th Anniversary)",
    series: '50th Anniversary',
    showDates: ['1971-02-21'],
    streaming: {
      spotify: 'https://open.spotify.com/album/4m3LKjFymPkRQeST1KEbT0',
      appleMusic: 'https://music.apple.com/us/album/workingmans-dead-50th-anniversary-deluxe-edition/1510748182',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/e1/59/48/e159484c-73d9-8743-a46d-96e772afb2a8/603497848522.jpg/600x600bb.jpg',
  },
  {
    name: 'American Beauty (50th Anniversary)',
    series: '50th Anniversary',
    showDates: ['1971-02-18'],
    streaming: {
      spotify: 'https://open.spotify.com/album/2iR2R1AJPBqRQEMZ5TnG0y',
      appleMusic: 'https://music.apple.com/us/album/american-beauty-50th-anniversary-deluxe-edition/1529676260',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/f6/8f/2e/f68f2e16-1429-b943-a2f8-5b56a2b69f14/603497848508.jpg/600x600bb.jpg',
  },
  {
    name: 'Skull & Roses (50th Anniversary Expanded)',
    series: '50th Anniversary',
    showDates: ['1971-03-24', '1971-04-05', '1971-04-06', '1971-04-26', '1971-04-27', '1971-04-28', '1971-04-29'],
    streaming: {
      spotify: 'https://open.spotify.com/album/3kMxm04sEdG5qzVA3ZOGmH',
      appleMusic: 'https://music.apple.com/us/album/grateful-dead-skull-roses-50th-anniversary-expanded/1558949246',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/20/57/b5/2057b5ff-94ee-916a-caad-9bf004fa676e/603497843718.jpg/600x600bb.jpg',
  },
  {
    name: 'Wake of the Flood (50th Anniversary)',
    series: '50th Anniversary',
    showDates: ['1973-11-01'],
    streaming: {
      spotify: 'https://open.spotify.com/album/3vYL9bhIM2S1wpH5v7iOPJ',
      appleMusic: 'https://music.apple.com/us/album/wake-of-the-flood-50th-anniversary-deluxe-edition/1698127917',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/1d/88/43/1d88432b-5b68-fa53-15df-2a6620b8fc08/603497833863.jpg/600x600bb.jpg',
  },
  {
    name: 'From the Mars Hotel (50th Anniversary)',
    series: '50th Anniversary',
    showDates: ['1974-05-12'],
    streaming: {
      spotify: 'https://open.spotify.com/album/17Em1ShnwvguCSeyNExYjX',
      appleMusic: 'https://music.apple.com/us/album/from-the-mars-hotel-50th-anniversary-deluxe-edition/1736839667',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/87/06/4f/87064fca-f45f-195d-c4d8-5fdc3462437a/603497828005.jpg/600x600bb.jpg',
  },

  // ============================================
  // ADDITIONAL STANDALONE RELEASES
  // ============================================
  {
    name: "To Terrapin: Hartford '77",
    series: 'Box Set',
    showDates: ['1977-05-28'],
    streaming: {
      spotify: 'https://open.spotify.com/album/6aODZ83mana5oClW6sXEkx',
      appleMusic: 'https://music.apple.com/us/album/to-terrapin-may-28-1977-hartford-ct-live/311069507',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Features4/v4/07/f6/e1/07f6e170-cfab-96e5-4828-474c2e9e210f/dj.lbmfqzza.jpg/600x600bb.jpg',
  },
  {
    name: "Duke '78",
    series: 'Box Set',
    showDates: ['1978-04-12'],
    streaming: {
      spotify: 'https://open.spotify.com/album/5RINFTXQxiWNgoRT0Glwva',
      appleMusic: 'https://music.apple.com/us/album/duke-78-live/1758759190',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/71/8a/3a/718a3a75-6317-d4f3-c010-8ea6b4e447d7/603497826148.jpg/600x600bb.jpg',
  },
  {
    name: 'RFK Stadium, Washington, DC 6/10/73',
    series: 'Box Set',
    showDates: ['1973-06-10'],
    streaming: {
      spotify: 'https://open.spotify.com/album/2Lxt0taVNc2Bv20rt0d21w',
      appleMusic: 'https://music.apple.com/us/album/rfk-stadium-washington-dc-6-10-73-live/1684860222',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/d3/01/69/d301696e-c1ec-ed9a-0d7b-d2adb0692a46/603497835539.jpg/600x600bb.jpg',
  },
  {
    name: 'R.F.K. Stadium Washington D.C. 1989',
    series: 'Box Set',
    showDates: ['1989-07-12', '1989-07-13'],
    streaming: {
      spotify: 'https://open.spotify.com/album/5xFcQa8U8P5Kdz87u8eOWm',
    },
  },
  {
    name: 'Madison Square Garden, New York, NY 3/9/81',
    series: 'Box Set',
    showDates: ['1981-03-09'],
    streaming: {
      spotify: 'https://open.spotify.com/album/50ER5uOSuN39s05PcrRgcm',
      appleMusic: 'https://music.apple.com/us/album/madison-square-garden-new-york-ny-3-9-81-live/1634056104',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/41/22/d1/4122d152-ea78-cf43-2407-632a4b49353c/603497840298.jpg/600x600bb.jpg',
  },
  {
    name: 'Saint of Circumstance: Giants Stadium 6/17/91',
    series: 'Box Set',
    showDates: ['1991-06-17'],
    streaming: {
      spotify: 'https://open.spotify.com/album/1f0whW4QE9bFNLpeyaPQiV',
      appleMusic: 'https://music.apple.com/us/album/saint-of-circumstance-giants-stadium-east-rutherford-nj-6-17-91-live/1475144001',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/4a/b7/aa/4ab7aaac-d522-3e76-5359-140ca103b65f/603497852352.jpg/600x600bb.jpg',
  },
  {
    name: "Pacific Northwest '73-'74: Believe It If You Need It",
    series: 'Box Set',
    showDates: ['1973-06-22', '1973-06-24', '1973-06-26', '1974-05-17', '1974-05-19', '1974-05-21'],
    streaming: {
      spotify: 'https://open.spotify.com/album/3EUx54No5UpMca8zIyTpbd',
      appleMusic: 'https://music.apple.com/us/album/pacific-northwest-73-74-believe-it-if-you-need-it-live/1396306432',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/c4/80/23/c48023a9-66cf-0cac-6a33-b065e89f5114/603497857227.jpg/600x600bb.jpg',
  },
  {
    name: 'Red Rocks Amphitheatre, Morrison, CO 7/8/78',
    series: 'Box Set',
    showDates: ['1978-07-08'],
    streaming: {
      spotify: 'https://open.spotify.com/album/6q4mDbsYJsixRai11qc2Vx',
      appleMusic: 'https://music.apple.com/us/album/red-rocks-amphitheatre-morrison-co-7-8-78-live/1101954664',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/87/fb/38/87fb38da-4333-38f2-a57e-d48e66a1d3be/603497878192.jpg/600x600bb.jpg',
  },
  {
    name: 'Wake Up to Find Out: Nassau Coliseum 3/29/90',
    series: 'Box Set',
    showDates: ['1990-03-29'],
    streaming: {
      spotify: 'https://open.spotify.com/album/7xWKImlu9fzB1ApqoLLMiL',
      appleMusic: 'https://music.apple.com/us/album/wake-up-to-find-out-nassau-coliseum-uniondale-ny-3-29-90/899347170',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music3/v4/93/70/38/93703896-c7a1-e34d-0440-de987fb791b4/603497898268.jpg/600x600bb.jpg',
  },
  {
    name: 'Crimson, White & Indigo: JFK Stadium 7/7/89',
    series: 'Box Set',
    showDates: ['1989-07-07'],
    streaming: {
      spotify: 'https://open.spotify.com/album/1ILNO0v1Natm87x5UPedHh',
      appleMusic: 'https://music.apple.com/us/album/crimson-white-indigo-july-7-1989-jfk-stadium-philadelphia-live/366394085',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/bc/9f/b5/mzi.llrwrtyi.jpg/600x600bb.jpg',
  },
  {
    name: 'Rocking the Cradle: Egypt 1978',
    series: 'Box Set',
    showDates: ['1978-09-15', '1978-09-16'],
    streaming: {
      spotify: 'https://open.spotify.com/album/1T3gjxFeNGxmbP697kIQ69',
      appleMusic: 'https://music.apple.com/us/album/rocking-the-cradle-egypt-1978/291939491',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/7e/14/35/mzi.zzwsfdgc.jpg/600x600bb.jpg',
  },
  {
    name: 'Spring 1990: So Glad You Made It',
    series: 'Box Set',
    showDates: ['1990-03-16', '1990-03-19', '1990-03-22'],
    streaming: {
      spotify: 'https://open.spotify.com/album/6qO4txEK5NKSHz3L4GAD5x',
      appleMusic: 'https://music.apple.com/us/album/spring-1990-so-glad-you-made-it-live/558274264',
    },
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/v4/84/78/fd/8478fd10-6d86-9e69-7959-0436276a337d/603497928590.jpg/600x600bb.jpg',
  },

  // ============================================
  // DAVE'S PICKS (56 volumes) - Not on streaming
  // ============================================
  {
    name: "Dave's Picks Vol. 1",
    series: "Dave's Picks",
    showDates: ['1977-05-25'],
    artwork: 'https://coverartarchive.org/release/9c5f09d9-a44a-4f6e-ac49-39f7ce0670bf/front',
  },
  {
    name: "Dave's Picks Vol. 2",
    series: "Dave's Picks",
    showDates: ['1974-07-31'],
    artwork: 'https://store.dead.net/cdn/shop/files/Daves_Vol2_Box_20_281_29.png',
  },
  {
    name: "Dave's Picks Vol. 3",
    series: "Dave's Picks",
    showDates: ['1971-10-22'],
    artwork: 'https://coverartarchive.org/release/0a29f2b1-ef47-41da-af44-fcaab5674965/front',
  },
  {
    name: "Dave's Picks Vol. 4",
    series: "Dave's Picks",
    showDates: ['1976-09-24'],
    artwork: 'https://coverartarchive.org/release/bfda0309-ee53-4f68-af8a-ad8b0019765d/front',
  },
  {
    name: "Dave's Picks Vol. 5",
    series: "Dave's Picks",
    showDates: ['1973-11-17'],
    artwork: 'https://store.dead.net/cdn/shop/files/gratefuldeaddavespicksvol5vinyl5lpcopy.png',
  },
  {
    name: "Dave's Picks Vol. 6",
    series: "Dave's Picks",
    showDates: ['1969-12-20', '1970-02-02'],
    artwork: 'https://coverartarchive.org/release/696ac822-78e6-4e28-a004-ca9c57e20eb3/front',
  },
  {
    name: "Dave's Picks Vol. 7",
    series: "Dave's Picks",
    showDates: ['1978-04-24'],
    artwork: 'https://coverartarchive.org/release/d2524ac7-9132-40e3-9304-f1ef4f32df1c/front',
  },
  {
    name: "Dave's Picks Vol. 8",
    series: "Dave's Picks",
    showDates: ['1980-11-30'],
    artwork: 'https://coverartarchive.org/release/1f5d362b-c14f-4795-9088-d63aa3f742fd/front',
  },
  {
    name: "Dave's Picks Vol. 9",
    series: "Dave's Picks",
    showDates: ['1974-05-14'],
    artwork: 'https://coverartarchive.org/release/6e9705e8-ebd9-46bf-aabd-a89490975bb1/front',
  },
  {
    name: "Dave's Picks Vol. 10",
    series: "Dave's Picks",
    showDates: ['1969-12-12'],
    artwork: 'https://coverartarchive.org/release/7c8e22f0-9e78-4fc5-81ed-c7ad9b26cba2/front',
  },
  {
    name: "Dave's Picks Vol. 11",
    series: "Dave's Picks",
    showDates: ['1972-11-17'],
    artwork: 'https://coverartarchive.org/release/5a7dd420-f6aa-47a2-9bbc-8cbee5e4764c/front',
  },
  {
    name: "Dave's Picks Vol. 12",
    series: "Dave's Picks",
    showDates: ['1977-11-04'],
    artwork: 'https://coverartarchive.org/release/6540218c-ee00-4e0f-ab7e-e2199f4cbffb/front',
  },
  {
    name: "Dave's Picks Vol. 13",
    series: "Dave's Picks",
    showDates: ['1974-02-24'],
    artwork: 'https://coverartarchive.org/release/dc8c7703-b44e-4d43-bd9d-05f12acc0b04/front',
  },
  {
    name: "Dave's Picks Vol. 14",
    series: "Dave's Picks",
    showDates: ['1972-03-26'],
    artwork: 'https://coverartarchive.org/release/7d7e7d97-2060-4e9a-968a-1cb429edfe89/front',
  },
  {
    name: "Dave's Picks Vol. 15",
    series: "Dave's Picks",
    showDates: ['1978-04-22'],
    artwork: 'https://coverartarchive.org/release/9e65f719-8430-4a9e-adf7-2c6ff283e627/front',
  },
  {
    name: "Dave's Picks Vol. 16",
    series: "Dave's Picks",
    showDates: ['1973-03-28'],
    artwork: 'https://coverartarchive.org/release/16d9cdbb-b511-4804-bd0a-5f84037406e9/front',
  },
  {
    name: "Dave's Picks Vol. 17",
    series: "Dave's Picks",
    showDates: ['1974-07-19'],
    artwork: 'https://coverartarchive.org/release/adb89dd9-34b1-4239-93ee-0e47e3565f89/front',
  },
  {
    name: "Dave's Picks Vol. 18",
    series: "Dave's Picks",
    showDates: ['1976-07-17'],
    artwork: 'https://coverartarchive.org/release/79c0bff3-f967-47b8-8936-479722c50cd7/front',
  },
  {
    name: "Dave's Picks Vol. 19",
    series: "Dave's Picks",
    showDates: ['1970-01-23'],
    artwork: 'https://coverartarchive.org/release/bd69179c-f040-4eca-8f03-99440e078ed8/front',
  },
  {
    name: "Dave's Picks Vol. 20",
    series: "Dave's Picks",
    showDates: ['1981-12-09'],
    artwork: 'https://coverartarchive.org/release/7aa9757e-e1fe-4ba3-a6fc-ede307a755a0/front',
  },
  {
    name: "Dave's Picks Vol. 21",
    series: "Dave's Picks",
    showDates: ['1973-04-02'],
    artwork: 'https://coverartarchive.org/release/d8709a7a-e747-4791-96f0-f49ea278327f/front',
  },
  {
    name: "Dave's Picks Vol. 22",
    series: "Dave's Picks",
    showDates: ['1971-12-07'],
    artwork: 'https://coverartarchive.org/release/0a6efac4-7351-4156-a3b1-f1dc8f2dc5b3/front',
  },
  {
    name: "Dave's Picks Vol. 23",
    series: "Dave's Picks",
    showDates: ['1978-01-22'],
    artwork: 'https://store.dead.net/cdn/shop/files/GD_DPVol23_LP_ProductShot.png',
  },
  {
    name: "Dave's Picks Vol. 24",
    series: "Dave's Picks",
    showDates: ['1972-08-25'],
    artwork: 'https://coverartarchive.org/release/7fb486e4-e1ab-4839-b94c-de95d1f32016/front',
  },
  {
    name: "Dave's Picks Vol. 25",
    series: "Dave's Picks",
    showDates: ['1977-11-06'],
    artwork: 'https://coverartarchive.org/release/4369d643-4491-469c-b9ee-a18d033b96e6/front',
  },
  {
    name: "Dave's Picks Vol. 26",
    series: "Dave's Picks",
    showDates: ['1971-11-17'],
    artwork: 'https://coverartarchive.org/release/07657aef-c4df-4edf-afbb-303225939134/front',
  },
  {
    name: "Dave's Picks Vol. 27",
    series: "Dave's Picks",
    showDates: ['1983-09-02'],
    artwork: 'https://coverartarchive.org/release/0611b7f2-08b2-4a17-9783-121e7296611b/front',
  },
  {
    name: "Dave's Picks Vol. 28",
    series: "Dave's Picks",
    showDates: ['1976-06-17'],
    artwork: 'https://coverartarchive.org/release/70a1adba-1c59-4e20-b2e8-7bd7dfafbfe1/front',
  },
  {
    name: "Dave's Picks Vol. 29",
    series: "Dave's Picks",
    showDates: ['1977-02-26'],
    artwork: 'https://coverartarchive.org/release/e061a0ca-12f9-4d08-b443-2c3f20af3e25/front',
  },
  {
    name: "Dave's Picks Vol. 30",
    series: "Dave's Picks",
    showDates: ['1970-01-02'],
    artwork: 'https://coverartarchive.org/release/58729adf-a698-4461-8770-cc972a88c909/front',
  },
  {
    name: "Dave's Picks Vol. 31",
    series: "Dave's Picks",
    showDates: ['1979-12-03'],
    artwork: 'https://coverartarchive.org/release/87c8b5bd-592d-48a5-beed-5dcc7bd9c5c8/front',
  },
  {
    name: "Dave's Picks Vol. 32",
    series: "Dave's Picks",
    showDates: ['1973-03-24'],
    artwork: 'https://coverartarchive.org/release/c067b1ae-6b6c-461a-a534-dacd861fc78d/front',
  },
  {
    name: "Dave's Picks Vol. 33",
    series: "Dave's Picks",
    showDates: ['1977-10-29'],
    artwork: 'https://coverartarchive.org/release/92841771-6c1a-4259-ad0c-7caea1e77117/front',
  },
  {
    name: "Dave's Picks Vol. 34",
    series: "Dave's Picks",
    showDates: ['1974-06-23'],
    artwork: 'https://coverartarchive.org/release/6658e498-d607-40e2-bb66-57e97a0cd01b/front',
  },
  {
    name: "Dave's Picks Vol. 35",
    series: "Dave's Picks",
    showDates: ['1984-04-20'],
    artwork: 'https://coverartarchive.org/release/b781f66f-2e9b-450b-a673-69efb7c3757d/front',
  },
  {
    name: "Dave's Picks Vol. 36",
    series: "Dave's Picks",
    showDates: ['1987-03-26', '1987-03-27'],
    artwork: 'https://coverartarchive.org/release/399f5ed3-fb18-4953-9ce0-1bc9b986dfc5/front',
  },
  {
    name: "Dave's Picks Vol. 37",
    series: "Dave's Picks",
    showDates: ['1978-04-15'],
    artwork: 'https://coverartarchive.org/release/625193e7-1f5b-46c1-81f3-f7a8b4384e02/front',
  },
  {
    name: "Dave's Picks Vol. 38",
    series: "Dave's Picks",
    showDates: ['1973-09-08'],
    artwork: 'https://coverartarchive.org/release/a9be28c5-d7f0-4427-a18c-e2260f7783fa/front',
  },
  {
    name: "Dave's Picks Vol. 39",
    series: "Dave's Picks",
    showDates: ['1983-04-26'],
    artwork: 'https://coverartarchive.org/release/d8b8a958-2b39-4d86-857c-95911f3c39f8/front',
  },
  {
    name: "Dave's Picks Vol. 40",
    series: "Dave's Picks",
    showDates: ['1990-07-18', '1990-07-19'],
    artwork: 'https://coverartarchive.org/release/9b8fed29-cbda-47be-818d-7bca4d02e314/front',
  },
  {
    name: "Dave's Picks Vol. 41",
    series: "Dave's Picks",
    showDates: ['1977-05-26'],
    artwork: 'https://coverartarchive.org/release/c139d3f9-6249-4be8-977b-8a33c2b07417/front',
  },
  {
    name: "Dave's Picks Vol. 42",
    series: "Dave's Picks",
    showDates: ['1974-02-23'],
    artwork: 'https://coverartarchive.org/release/cc8f23f7-6716-4f21-8b43-6d2a5e67e814/front',
  },
  {
    name: "Dave's Picks Vol. 43",
    series: "Dave's Picks",
    showDates: ['1969-11-02', '1969-12-26'],
    artwork: 'https://coverartarchive.org/release/4400a209-12d1-4600-b6cf-821c9a3975bb/front',
  },
  {
    name: "Dave's Picks Vol. 44",
    series: "Dave's Picks",
    showDates: ['1990-06-23'],
    artwork: 'https://coverartarchive.org/release/1515771c-fbfd-4760-9eda-84c551f6257f/front',
  },
  {
    name: "Dave's Picks Vol. 45",
    series: "Dave's Picks",
    showDates: ['1977-10-01', '1977-10-02'],
    artwork: 'https://store.dead.net/cdn/shop/files/DP45_cover_4K.jpg',
  },
  {
    name: "Dave's Picks Vol. 46",
    series: "Dave's Picks",
    showDates: ['1972-09-09'],
    artwork: 'https://store.dead.net/cdn/shop/files/daves_picks_vol_46_product_shot_1000x1000_7c0e5f90-5e61-4c6b-9ba0-a1b642b7cae5.png',
  },
  {
    name: "Dave's Picks Vol. 47",
    series: "Dave's Picks",
    showDates: ['1979-12-09'],
    artwork: 'https://coverartarchive.org/release/8071720d-b0ba-4344-ac51-6eb96e3fad2c/front',
  },
  {
    name: "Dave's Picks Vol. 48",
    series: "Dave's Picks",
    showDates: ['1971-11-20'],
    artwork: 'https://store.dead.net/cdn/shop/files/daves_picks_vol_48_product_shot_1000x1000_3ea52251-0192-404a-927a-46d8b1a49915.png',
  },
  {
    name: "Dave's Picks Vol. 49",
    series: "Dave's Picks",
    showDates: ['1985-04-27', '1985-04-28'],
    artwork: 'https://coverartarchive.org/release/b0a0232f-c7d4-4fdd-90f2-145580eaa107/front',
  },
  {
    name: "Dave's Picks Vol. 50",
    series: "Dave's Picks",
    showDates: ['1977-05-03'],
    artwork: 'https://coverartarchive.org/release/f8a96a7a-1413-491f-9cde-9ac30bf348e9/front',
  },
  {
    name: "Dave's Picks Vol. 51",
    series: "Dave's Picks",
    showDates: ['1971-04-13'],
    artwork: 'https://store.dead.net/cdn/shop/files/daves_picks_vol_51_product_shot_4000x4000_5ec1cb55-8000-4783-85c7-a3609e93970d.png',
  },
  {
    name: "Dave's Picks Vol. 52",
    series: "Dave's Picks",
    showDates: ['1983-09-11'],
    artwork: 'https://store.dead.net/cdn/shop/files/daves_picks_vol_52.png',
  },
  {
    name: "Dave's Picks Vol. 53",
    series: "Dave's Picks",
    showDates: ['1976-10-02'],
    artwork: 'https://store.dead.net/cdn/shop/files/daves_picks_vol_53_product_shot_1000x1000_b58203fd-ca10-4044-b9e6-94051cb17998.webp',
  },
  {
    name: "Dave's Picks Vol. 54",
    series: "Dave's Picks",
    showDates: ['1973-03-26'],
    artwork: 'https://store.dead.net/cdn/shop/files/DavesPicks54_cover1K.webp',
  },
  {
    name: "Dave's Picks Vol. 55",
    series: "Dave's Picks",
    showDates: ['1990-10-28'],
    artwork: 'https://store.dead.net/cdn/shop/files/daves_picks_vol_55_product_shot_discsv2.png',
  },
  {
    name: "Dave's Picks Vol. 56",
    series: "Dave's Picks",
    showDates: ['1981-03-20', '1981-03-21'],
    artwork: 'https://store.dead.net/cdn/shop/files/daves_picks_vol_56_product_shot_discs_transparent.png',
  },
  {
    name: "Dave's Picks Vol. 57",
    series: "Dave's Picks",
    showDates: ['1978-02-01'],
    artwork: 'https://store.dead.net/cdn/shop/files/daves_picks_vol_57_product_shot_1000x1000_1.png',
  },
];

// Create a map for fast lookups by date
const releasesByDateMap = new Map<string, OfficialRelease[]>();

OFFICIAL_RELEASES.forEach(release => {
  release.showDates.forEach(date => {
    const existing = releasesByDateMap.get(date) || [];
    existing.push(release);
    releasesByDateMap.set(date, existing);
  });
});

/**
 * Get all official releases for a given show date
 * @param date - Date in YYYY-MM-DD format
 * @returns Array of releases, or empty array if none
 */
export function getOfficialReleasesForDate(date: string): OfficialRelease[] {
  // Handle ISO timestamps by extracting just the date
  const dateOnly = date.split('T')[0];
  return releasesByDateMap.get(dateOnly) || [];
}

/**
 * Check if a show has any official release
 * @param date - Date in YYYY-MM-DD format
 * @returns true if the show has at least one official release
 */
export function hasOfficialRelease(date: string): boolean {
  return getOfficialReleasesForDate(date).length > 0;
}

/**
 * Get the primary (first/most notable) release for a show
 * @param date - Date in YYYY-MM-DD format
 * @returns The first release found, or null
 */
export function getPrimaryRelease(date: string): OfficialRelease | null {
  const releases = getOfficialReleasesForDate(date);
  return releases.length > 0 ? releases[0] : null;
}

// ============================================
// FILTER TRAY UTILITIES
// ============================================

// Series grouped under "Others" in the filter UI
export const OTHER_SERIES = ['Box Set', '50th Anniversary', 'Studio Album', 'From The Vault'];

// Display series for the filter tray (6 pills)
export const DISPLAY_SERIES = ["Dave's Picks", "Dick's Picks", "Europe '72", "Download Series", "Road Trips", "Others"];

// Pre-compute years by series map for efficient filtering
const yearsBySeriesMap = new Map<string, Set<string>>();
OFFICIAL_RELEASES.forEach(release => {
  const years = release.showDates.map(d => d.substring(0, 4));
  const existing = yearsBySeriesMap.get(release.series) || new Set<string>();
  years.forEach(y => existing.add(y));
  yearsBySeriesMap.set(release.series, existing);
});

/**
 * Get all unique series names from official releases
 */
export function getAllSeries(): string[] {
  return Array.from(new Set(OFFICIAL_RELEASES.map(r => r.series))).sort();
}

/**
 * Get all years that have releases for a specific series
 */
export function getYearsForSeries(series: string): string[] {
  return Array.from(yearsBySeriesMap.get(series) || []).sort();
}

/**
 * Expand display series name to actual series names
 * "Others" expands to all OTHER_SERIES, other names pass through
 */
export function expandDisplaySeries(displaySeries: string[]): string[] {
  const expanded: string[] = [];
  displaySeries.forEach(s => {
    if (s === 'Others') {
      expanded.push(...OTHER_SERIES);
    } else {
      expanded.push(s);
    }
  });
  return expanded;
}

/**
 * Get all years that have releases for any of the specified series
 */
export function getYearsForAnySeries(seriesList: string[]): string[] {
  // Expand "Others" if present
  const expandedSeries = expandDisplaySeries(seriesList);

  const years = new Set<string>();
  expandedSeries.forEach(series => {
    yearsBySeriesMap.get(series)?.forEach(y => years.add(y));
  });
  return Array.from(years).sort();
}

/**
 * Check if a series has any releases in the specified years
 */
export function seriesHasYears(series: string, years: string[]): boolean {
  const seriesYears = yearsBySeriesMap.get(series);
  if (!seriesYears) return false;
  return years.some(y => seriesYears.has(y));
}
