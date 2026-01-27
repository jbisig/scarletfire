#!/usr/bin/env node

/**
 * Script to add artwork URLs to officialReleases.ts
 */

const fs = require('fs');
const path = require('path');

// Load the artwork URLs
const artworkPath = path.join(__dirname, 'artworkUrls.json');
const artworkUrls = JSON.parse(fs.readFileSync(artworkPath, 'utf8'));

// Read the officialReleases.ts file
const releasesPath = path.join(__dirname, '../src/data/officialReleases.ts');
let content = fs.readFileSync(releasesPath, 'utf8');

// For each artwork URL, find the corresponding Apple Music URL and add artwork after streaming
let updatedCount = 0;

for (const [albumId, artworkUrl] of Object.entries(artworkUrls)) {
  // Find the pattern: appleMusic URL with this album ID, followed by closing of streaming object
  // We need to add artwork: 'url', after the streaming closing brace

  // Pattern to find: streaming object containing this album ID
  const regex = new RegExp(
    `(streaming:\\s*\\{[^}]*\\/` + albumId + `'[^}]*\\},)`,
    'g'
  );

  if (regex.test(content)) {
    // Add artwork after the streaming block
    content = content.replace(regex, `$1\n    artwork: '${artworkUrl}',`);
    updatedCount++;
  }
}

// Write the updated file
fs.writeFileSync(releasesPath, content);
console.log(`Updated ${updatedCount} releases with artwork URLs`);
