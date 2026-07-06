import { injectOgTags } from '../_lib/injectOgTags';

const sampleHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Scarlet Fire</title>
  <meta charset="utf-8">
</head>
<body>
  <div id="root"></div>
  <script src="/bundle.js"></script>
</body>
</html>`;

describe('injectOgTags', () => {
  it('replaces the <title> with the provided title', () => {
    const out = injectOgTags(sampleHtml, {
      title: "Franklin's Tower",
      description: 'Sound City',
      imageUrl: 'https://example.com/img.png',
      url: 'https://example.com/show/1982-08-06/franklins-tower',
    });
    expect(out).toContain("<title>Franklin&#039;s Tower</title>");
    expect(out).not.toContain('<title>Scarlet Fire</title>');
  });

  it('adds og:image meta tag pointing at the image URL', () => {
    const out = injectOgTags(sampleHtml, {
      title: 't',
      description: 'd',
      imageUrl: 'https://example.com/img.png',
      url: 'https://example.com/show/1982-08-06',
    });
    expect(out).toContain('<meta property="og:image" content="https://example.com/img.png">');
  });

  it('adds og:url pointing at the share URL', () => {
    const out = injectOgTags(sampleHtml, {
      title: 't',
      description: 'd',
      imageUrl: 'https://example.com/img.png',
      url: 'https://example.com/show/1982-08-06',
    });
    expect(out).toContain('<meta property="og:url" content="https://example.com/show/1982-08-06">');
  });

  it('adds twitter:card=summary_large_image', () => {
    const out = injectOgTags(sampleHtml, {
      title: 't',
      description: 'd',
      imageUrl: 'https://example.com/img.png',
      url: 'https://example.com',
    });
    expect(out).toContain('<meta name="twitter:card" content="summary_large_image">');
  });

  it('preserves the original <body> and <div id="root">', () => {
    const out = injectOgTags(sampleHtml, {
      title: 't',
      description: 'd',
      imageUrl: 'https://example.com/img.png',
      url: 'https://example.com',
    });
    expect(out).toContain('<div id="root"></div>');
    expect(out).toContain('<script src="/bundle.js"></script>');
  });

  it('HTML-escapes attribute values to prevent injection', () => {
    const out = injectOgTags(sampleHtml, {
      title: 'Tower "quoted"',
      description: '<script>alert(1)</script>',
      imageUrl: 'https://example.com/img.png',
      url: 'https://example.com',
    });
    expect(out).not.toContain('<script>alert(1)</script>');
    expect(out).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(out).toContain('Tower &quot;quoted&quot;');
  });

  it('does not let `$`-replacement-pattern sequences in the title mangle the output', () => {
    // `$1` in a *replacement string* (not a function) means "capture group 1" to
    // String.replace — since the <title> regex has no capture groups, a naive
    // `.replace(regex, stringWithDollarSigns)` silently drops the `$1` text.
    const out = injectOgTags(sampleHtml, {
      title: 'Set$1Value$$Twice',
      description: 'd',
      imageUrl: 'https://example.com/img.png',
      url: 'https://example.com',
    });
    expect(out).toContain('<title>Set$1Value$$Twice</title>');
  });

  it('does not let `$&`/`$\\`` in user text corrupt the </head> injection', () => {
    // `$&` means "the whole match" and `` $` `` means "everything before the
    // match" to String.replace when the *replacement* is a plain string. A
    // collection/show name containing either must not leak matched or
    // preceding HTML back into the description text.
    const out = injectOgTags(sampleHtml, {
      title: 't',
      description: 'A $& B $` C',
      imageUrl: 'https://example.com/img.png',
      url: 'https://example.com',
    });
    // "&" in the description is HTML-escaped to "&amp;"; the literal "$"
    // characters must otherwise survive untouched.
    expect(out).toContain('content="A $&amp; B $` C">');
    // </head> must appear exactly once — a `$&`/`` $` `` expansion would
    // duplicate "</head>" or the entire preceding document into the output.
    expect(out.match(/<\/head>/g)).toHaveLength(1);
    expect(out).toContain('<div id="root"></div>');
  });

  it('does not break when the html has no existing <title>', () => {
    const noTitleHtml = `<!DOCTYPE html><html><head></head><body></body></html>`;
    const out = injectOgTags(noTitleHtml, {
      title: 'x',
      description: 'y',
      imageUrl: 'https://example.com/img.png',
      url: 'https://example.com',
    });
    // Meta tags still injected at </head>
    expect(out).toContain('og:title');
  });
});
