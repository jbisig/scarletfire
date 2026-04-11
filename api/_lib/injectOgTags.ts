/**
 * Pure HTML mutation — given an HTML string and a bag of OG tag values,
 * returns a new HTML string with the <title> replaced and og:* / twitter:*
 * meta tags injected just before </head>.
 *
 * Used by the /show/:identifier and /show/:identifier/:trackTitle Vercel
 * Functions to add unfurl metadata to a copy of dist/index.html so chat
 * apps (WhatsApp, iMessage, Slack, etc.) render a rich preview when a user
 * pastes a share URL.
 *
 * Attribute values are HTML-escaped to prevent injection from user-
 * controlled show titles, track titles, or venue names.
 */
export interface OgTags {
  title: string;
  description: string;
  imageUrl: string;
  url: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function injectOgTags(html: string, tags: OgTags): string {
  const title = escapeHtml(tags.title);
  const description = escapeHtml(tags.description);
  const imageUrl = escapeHtml(tags.imageUrl);
  const url = escapeHtml(tags.url);

  const metaBlock = [
    `<meta property="og:type" content="music.song">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:image" content="${imageUrl}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="1200">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${imageUrl}">`,
  ].join('\n  ');

  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace('</head>', `  ${metaBlock}\n</head>`);
}
