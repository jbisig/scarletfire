#!/usr/bin/env node

/**
 * Script to fetch album artwork URLs from iTunes API
 * Uses the Apple Music album IDs already in officialReleases.ts
 */

const fs = require('fs');
const path = require('path');

// Read the officialReleases.ts file
const releasesPath = path.join(__dirname, '../src/data/officialReleases.ts');
const content = fs.readFileSync(releasesPath, 'utf8');

// Extract Apple Music album IDs from the file
const appleMusicRegex = /appleMusic:\s*'https:\/\/music\.apple\.com\/us\/album\/[^\/]+\/(\d+)'/g;
const albumIds = [];
let match;

while ((match = appleMusicRegex.exec(content)) !== null) {
  albumIds.push(match[1]);
}

console.log(`Found ${albumIds.length} Apple Music album IDs`);

// Fetch artwork for each album
async function fetchArtwork(albumId) {
  try {
    const response = await fetch(`https://itunes.apple.com/lookup?id=${albumId}&entity=album`);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const artwork = data.results[0].artworkUrl100;
      if (artwork) {
        // Replace 100x100 with 600x600 for higher resolution
        const highResArtwork = artwork.replace('100x100bb', '600x600bb');
        return { albumId, artwork: highResArtwork };
      }
    }
    return { albumId, artwork: null };
  } catch (error) {
    console.error(`Error fetching artwork for ${albumId}:`, error.message);
    return { albumId, artwork: null };
  }
}

async function main() {
  const results = {};

  // Process in batches to avoid rate limiting
  const batchSize = 10;
  for (let i = 0; i < albumIds.length; i += batchSize) {
    const batch = albumIds.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(albumIds.length / batchSize)}`);

    const batchResults = await Promise.all(batch.map(fetchArtwork));

    for (const result of batchResults) {
      if (result.artwork) {
        results[result.albumId] = result.artwork;
      }
    }

    // Small delay between batches
    if (i + batchSize < albumIds.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`\nSuccessfully fetched ${Object.keys(results).length} artwork URLs\n`);

  // Output as JSON for easy copying
  console.log('// Artwork URLs by album ID:');
  console.log(JSON.stringify(results, null, 2));

  // Save to a file
  const outputPath = path.join(__dirname, 'artworkUrls.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nSaved to ${outputPath}`);
}

main();
