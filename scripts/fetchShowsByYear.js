/**
 * Script to fetch Grateful Dead shows year by year to avoid pagination limits
 */

const fs = require('fs');
const path = require('path');

const ARCHIVE_SEARCH_URL = 'https://archive.org/advancedsearch.php';
const ROWS_PER_REQUEST = 1000;

async function buildQueryString(params) {
  const parts = [];
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
      });
    } else if (value !== undefined && value !== null) {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  });
  return parts.join('&');
}

function extractSource(identifier) {
  const lowerIdent = identifier.toLowerCase();
  if (lowerIdent.includes('sbd')) return 'soundboard';
  if (lowerIdent.includes('aud')) return 'audience';
  if (lowerIdent.includes('matrix')) return 'matrix';
  if (lowerIdent.includes('fm')) return 'fm-broadcast';
  return 'unknown';
}

async function fetchShowsForYear(year) {
  const query = `collection:GratefulDead AND mediatype:etree AND year:${year}`;
  const params = {
    q: query,
    'fl[]': ['identifier', 'title', 'date', 'venue', 'coverage', 'year', 'downloads'],
    sort: 'date asc',
    rows: ROWS_PER_REQUEST,
    output: 'json'
  };

  const queryString = await buildQueryString(params);
  const response = await fetch(`${ARCHIVE_SEARCH_URL}?${queryString}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.response.docs;
}

async function fetchAllShows() {
  try {
    console.log('Fetching Grateful Dead shows year by year...\n');

    const allDocs = [];
    const startYear = 1965;
    const endYear = 1995;

    for (let year = startYear; year <= endYear; year++) {
      process.stdout.write(`Fetching ${year}... `);
      const docs = await fetchShowsForYear(year);
      allDocs.push(...docs);
      console.log(`${docs.length} recordings`);

      // Small delay to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n Fetched ${allDocs.length} total recordings`);

    // Group by date to aggregate multiple recordings of the same show
    const showsByDate = new Map();

    allDocs.forEach(doc => {
      const existing = showsByDate.get(doc.date);
      const version = {
        identifier: doc.identifier,
        title: doc.title,
        source: extractSource(doc.identifier),
        downloads: doc.downloads || 0,
      };

      if (existing) {
        existing.versions.push(version);
      } else {
        showsByDate.set(doc.date, {
          date: doc.date,
          year: doc.year || doc.date.split('-')[0],
          venue: doc.venue,
          location: doc.coverage,
          versions: [version],
        });
      }
    });

    console.log(`Found ${showsByDate.size} unique shows`);

    // Convert to ShowsByYear format
    const showsByYear = {};
    showsByDate.forEach((showData) => {
      // Sort versions by downloads (descending) and take top 5
      const sortedVersions = showData.versions
        .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
        .slice(0, 5);

      const show = {
        date: showData.date,
        year: showData.year,
        venue: showData.venue,
        location: showData.location,
        versions: sortedVersions,
        primaryIdentifier: sortedVersions[0].identifier,
        title: sortedVersions[0].title,
      };

      if (!showsByYear[show.year]) {
        showsByYear[show.year] = [];
      }
      showsByYear[show.year].push(show);
    });

    // Save to file
    const outputPath = path.join(__dirname, '../src/data/shows.json');
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(showsByYear, null, 2));

    const years = Object.keys(showsByYear).sort();
    console.log(`\nSuccessfully saved shows to ${outputPath}`);
    console.log(`Years covered: ${years[0]} - ${years[years.length - 1]}`);
    console.log(`Total shows: ${showsByDate.size}`);

    // Print stats by year
    console.log('\nShows by decade:');
    const decades = {};
    years.forEach(year => {
      const decade = Math.floor(parseInt(year) / 10) * 10;
      decades[decade] = (decades[decade] || 0) + showsByYear[year].length;
    });
    Object.entries(decades).sort().forEach(([decade, count]) => {
      console.log(`  ${decade}s: ${count} shows`);
    });

    // Print file size
    const stats = fs.statSync(outputPath);
    console.log(`\nFile size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  } catch (error) {
    console.error('\nFailed to fetch shows:', error);
    process.exit(1);
  }
}

fetchAllShows();
