/**
 * Test scraper on a single song (Dark Star)
 */

// Import the functions from the main scraper
const https = require('https');

const CONFIG = {
  BASE_URL: 'https://headyversion.com',
  DELAY_MS: 300,
};

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { resolve(data); });
    }).on('error', (err) => { reject(err); });
  });
}

function followRedirect(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { method: 'HEAD' }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(res.headers.location);
      } else {
        resolve(url);
      }
    }).on('error', (err) => { reject(err); });
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeSongTitle(title) {
  return title
    .trim()
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/Playin'/gi, 'Playing')
    .replace(/Truckin'/gi, 'Truckin')
    .replace(/Lovin'/gi, 'Loving');
}

function parseDate(dateStr) {
  const months = {
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
    'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
    'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
  };

  const match = dateStr.match(/([a-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})/i);
  if (!match) return null;

  const [, month, day, year] = match;
  const monthNum = months[month.toLowerCase().substring(0, 3)];
  if (!monthNum) return null;

  const paddedDay = day.padStart(2, '0');
  return `${year}-${monthNum}-${paddedDay}`;
}

function extractIdentifier(url) {
  if (!url) return null;
  const match = url.match(/archive\.org\/details\/([^\/\?#]+)/);
  return match ? match[1] : null;
}

function parsePerformances(html, songTitle) {
  const performances = [];
  const blockPattern = /<div class="arrows">[\s\S]*?<div class="score"[^>]*>\s*(\d+)\s*<\/div>[\s\S]*?(?=<div class="arrows">|<div class="pagination">|$)/g;
  let match;

  while ((match = blockPattern.exec(html)) !== null) {
    const block = match[0];
    const votes = parseInt(match[1], 10);

    const dateMatch = block.match(/<div class="show_date">[\s\S]*?([a-z]+\.?\s+\d{1,2},?\s+\d{4})\s*[-–]\s*([^<]+)<\/a>/i);
    if (!dateMatch) continue;

    const dateStr = dateMatch[1];
    const venueStr = dateMatch[2].trim();
    const showDate = parseDate(dateStr);
    if (!showDate) continue;

    const showIdMatch = block.match(/href="\/show\/(\d+)\/archive\//);
    if (!showIdMatch) {
      console.warn(`  ⚠️  Could not find show ID for ${dateStr}`);
      continue;
    }

    const showId = showIdMatch[1];

    performances.push({
      songTitle,
      showDate,
      showId,
      venue: venueStr,
      votes
    });
  }

  return performances;
}

async function resolveShowIdentifier(showId) {
  try {
    const archiveUrl = `${CONFIG.BASE_URL}/show/${showId}/archive/`;
    const redirectUrl = await followRedirect(archiveUrl);
    const identifier = extractIdentifier(redirectUrl);

    if (!identifier) {
      console.warn(`    ⚠️  Could not extract identifier from: ${redirectUrl}`);
    }

    return identifier;
  } catch (error) {
    console.error(`    ❌ Failed to resolve show ${showId}:`, error.message);
    return null;
  }
}

async function testDarkStar() {
  console.log('🎸 Testing Dark Star scraping...\n');

  try {
    const url = 'https://headyversion.com/song/66/grateful-dead/dark-star/';
    console.log('📡 Fetching Dark Star page...');
    const html = await fetchUrl(url);

    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const songTitle = titleMatch ? normalizeSongTitle(titleMatch[1]) : 'Dark Star';
    console.log(`🎵 Song: ${songTitle}\n`);

    const performances = parsePerformances(html, songTitle);
    console.log(`📊 Found ${performances.length} total performances\n`);

    if (performances.length > 0) {
      console.log('Top 5 performances:');
      const top5 = performances.slice(0, 5);

      for (let i = 0; i < top5.length; i++) {
        const perf = top5[i];
        console.log(`\n${i + 1}. ${perf.showDate} - ${perf.venue}`);
        console.log(`   Votes: ${perf.votes}`);
        console.log(`   Show ID: ${perf.showId}`);
        console.log(`   Resolving identifier...`);

        const identifier = await resolveShowIdentifier(perf.showId);
        if (identifier) {
          console.log(`   ✅ Identifier: ${identifier}`);
        } else {
          console.log(`   ❌ Failed to resolve identifier`);
        }

        await delay(CONFIG.DELAY_MS);
      }
    }

    console.log('\n✅ Test complete!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDarkStar();
