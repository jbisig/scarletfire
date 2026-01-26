const https = require('https');

const identifier = 'gd66-02-25.sbd.unknown.1593.sbefail.shnf';
const url = `https://archive.org/metadata/${identifier}`;

console.log(`Fetching: ${url}\n`);

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Title:', json.metadata?.title);
      console.log('Date:', json.metadata?.date);
      console.log('Venue:', json.metadata?.venue);
      console.log('\nTracks:');

      const files = json.files || [];
      const trackFiles = Object.entries(files)
        .filter(([name, file]) =>
          file.format === 'VBR MP3' ||
          file.format === 'Ogg Vorbis' ||
          name.endsWith('.mp3') ||
          name.endsWith('.ogg')
        )
        .map(([name, file]) => ({
          name,
          title: file.title || name,
          track: file.track
        }))
        .sort((a, b) => (a.track || 0) - (b.track || 0));

      trackFiles.forEach((track, i) => {
        console.log(`  ${i+1}. ${track.title}`);
      });

    } catch (err) {
      console.error('Error parsing JSON:', err.message);
    }
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
