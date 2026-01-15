const fs = require('fs');
const path = require('path');

/**
 * Fetch all Grateful Dead shows from Archive.org and save to JSON
 */

const ARCHIVE_SEARCH_URL = 'https://archive.org/advancedsearch.php';
const OUTPUT_PATH = path.join(__dirname, '../reference_files/archive-shows.json');

async function fetchAllShows() {
  console.log('🌐 Fetching all Grateful Dead shows from Archive.org...');
  console.log('⏰ This may take a few minutes...\n');

  const query = 'collection:GratefulDead AND mediatype:etree';
  const fields = ['identifier', 'title', 'date', 'venue', 'coverage', 'year', 'downloads'];

  const params = new URLSearchParams({
    q: query,
    'fl[]': fields,
    sort: 'date asc',
    rows: 50000, // Get all shows
    page: 0,
    output: 'json'
  });

  const url = `${ARCHIVE_SEARCH_URL}?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const docs = data.response.docs;

    console.log(`✅ Found ${docs.length} recordings`);

    // Group by date to get unique shows
    const showsByDate = new Map();

    docs.forEach(doc => {
      if (!doc.date) return;

      const existing = showsByDate.get(doc.date);
      const downloads = doc.downloads || 0;

      // Keep the version with most downloads for each date
      if (!existing || downloads > existing.downloads) {
        showsByDate.set(doc.date, {
          date: doc.date,
          identifier: doc.identifier,
          title: doc.title,
          venue: doc.venue,
          location: doc.coverage,
          year: doc.year || doc.date.split('-')[0],
          downloads: downloads
        });
      }
    });

    const shows = Array.from(showsByDate.values());
    console.log(`📅 ${shows.length} unique show dates`);

    // Save to JSON
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(shows, null, 2), 'utf-8');

    console.log(`\n✅ Saved to: ${OUTPUT_PATH}`);
    console.log(`📊 File size: ${(fs.statSync(OUTPUT_PATH).size / 1024).toFixed(2)} KB`);

    return shows;
  } catch (error) {
    console.error('❌ Error fetching shows:', error);
    throw error;
  }
}

// Main execution
(async () => {
  try {
    await fetchAllShows();
  } catch (error) {
    process.exit(1);
  }
})();
