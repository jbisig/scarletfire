/**
 * Pure parsing of Internet Archive per-recording metadata into the app's
 * format / lineage tags. Shared by the catalog build script
 * (scripts/buildCatalog.ts) and the runtime archiveApi so there is exactly
 * one copy of these rules. No I/O, no React.
 */
import type { ArchiveDoc } from '../types/archive.types';
import type { LineageTag, RecordingFormat, RecordingVersion } from '../types/show.types';

export interface RawRecordingFields {
  source?: string;
  lineage?: string;
  taper?: string;
  transferer?: string;
}

/** Archive fields are usually strings but can be arrays; collapse to one trimmed string. */
export function fieldText(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const s = value.trim();
    return s.length > 0 ? s : undefined;
  }
  if (Array.isArray(value)) {
    const s = value.filter((v): v is string => typeof v === 'string').map(v => v.trim()).filter(Boolean).join('; ');
    return s.length > 0 ? s : undefined;
  }
  return undefined;
}

// Order matters: matrix descriptions typically mention both board and
// audience sources, so matrix must be tested first. `aud` is word-bounded so
// "Audition"/"audio" don't read as audience; the mic-brand terms catch
// audience tapes described only by their gear.
const FORMAT_LADDER: ReadonlyArray<readonly [RecordingFormat, RegExp]> = [
  ['matrix', /matrix|mtx/i],
  ['sbd', /sbd|soundboard/i],
  ['fm', /pre-?fm|fm[ -]?broadcast|simulcast|\bfm\b/i],
  ['aud', /\baud\b|audience|nak|schoeps|akg|\becm\b|ecm-?\d|sennheiser|neumann|shure/i],
];

function runLadder(text: string): RecordingFormat {
  for (const [format, re] of FORMAT_LADDER) {
    if (re.test(text)) return format;
  }
  return 'unknown';
}

export function parseFormat(source: string | undefined, identifier: string): RecordingFormat {
  if (source) {
    const fromSource = runLadder(source);
    if (fromSource !== 'unknown') return fromSource;
  }
  return runLadder(identifier);
}

const BETTY_RE = /betty/i;
const MILLER_RE = /miller/i;
const SIXTEEN_TRACK_RE = /16[- ]?(track|tk)\b/i;
const LOW_GEN_RE = /\b(master|mr|msr|msc|1st gen(eration)?|first gen(eration)?|0 gen)\b/i;

export function parseLineage(raw: RawRecordingFields): LineageTag[] {
  const source = raw.source ?? '';
  const lineage = raw.lineage ?? '';
  const tags: LineageTag[] = [];
  if (BETTY_RE.test(`${raw.taper ?? ''} ${source} ${lineage}`)) tags.push('betty');
  if (MILLER_RE.test(raw.transferer ?? '')) tags.push('miller');
  if (SIXTEEN_TRACK_RE.test(source)) tags.push('16track');
  if (LOW_GEN_RE.test(`${source} ${lineage}`)) tags.push('lowgen');
  return tags;
}

const PROVENANCE_MAX = 60;

export function shortProvenance(source: string | undefined): string | undefined {
  if (!source) return undefined;
  const s = source
    .replace(/\s*(->|>+|→)\s*/g, ' → ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return undefined;
  if (s.length <= PROVENANCE_MAX) return s;
  return `${s.slice(0, PROVENANCE_MAX - 1).trimEnd()}…`;
}

/** Map one Archive advancedsearch doc to the app's RecordingVersion shape. */
export function recordingFromDoc(doc: ArchiveDoc): RecordingVersion {
  const source = fieldText(doc.source);
  const lineage = fieldText(doc.lineage);
  const taper = fieldText(doc.taper);
  const transferer = fieldText(doc.transferer);
  const provenance = shortProvenance(source);

  const version: RecordingVersion = {
    identifier: doc.identifier,
    title: doc.title,
    downloads: doc.downloads || 0,
    format: parseFormat(source, doc.identifier),
    lineage: parseLineage({ source, lineage, taper, transferer }),
  };
  if (typeof doc.avg_rating === 'number') version.avgRating = doc.avg_rating;
  if (typeof doc.num_reviews === 'number') version.numReviews = doc.num_reviews;
  if (provenance) version.provenance = provenance;
  if (taper) version.taper = taper;
  if (transferer) version.transferrer = transferer;
  return version;
}
