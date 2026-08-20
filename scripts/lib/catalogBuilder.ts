/**
 * Pure helpers for scripts/buildCatalog.ts. No I/O here so they can be unit
 * tested with a saved search response. The CLI wrapper does the fetching and
 * file writes.
 */
import type { ArchiveDoc } from '../../src/types/archive.types';
import type { GratefulDeadShow, LineageTag, RecordingFormat, RecordingVersion, ShowsByYear } from '../../src/types/show.types';
import { fieldText, recordingFromDoc } from '../../src/services/recordingParser';
import { FORMAT_LABELS, LINEAGE_LABELS } from '../../src/constants/tags';

function yearOf(doc: ArchiveDoc): string {
  return String(doc.year || doc.date.slice(0, 4));
}

export function groupDocsIntoShows(docs: ArchiveDoc[]): ShowsByYear {
  const byDate = new Map<string, { docs: ArchiveDoc[]; versions: RecordingVersion[] }>();

  for (const doc of docs) {
    if (!doc.identifier || !doc.date) continue;
    const version = recordingFromDoc(doc);
    const existing = byDate.get(doc.date);
    if (existing) {
      existing.docs.push(doc);
      existing.versions.push(version);
    } else {
      byDate.set(doc.date, { docs: [doc], versions: [version] });
    }
  }

  const showsByYear: ShowsByYear = {};
  const dates = Array.from(byDate.keys()).sort();
  for (const date of dates) {
    const { docs: dateDocs, versions } = byDate.get(date)!;
    versions.sort((a, b) => (b.downloads || 0) - (a.downloads || 0) || a.identifier.localeCompare(b.identifier));
    const primaryDoc = dateDocs.find(d => d.identifier === versions[0].identifier)!;
    const show: GratefulDeadShow = {
      date,
      year: yearOf(primaryDoc),
      venue: fieldText(primaryDoc.venue),
      location: fieldText(primaryDoc.coverage),
      versions,
      primaryIdentifier: versions[0].identifier,
      title: primaryDoc.title,
    };
    const year = String(show.year);
    (showsByYear[year] ??= []).push(show);
  }
  return showsByYear;
}

/**
 * Valid JSON with one show per line (years on their own lines). No 2-space
 * indent — that alone was ~30% of the file — but still line-diffable in git.
 */
export function serializeCatalog(showsByYear: ShowsByYear): string {
  const years = Object.keys(showsByYear).sort();
  const body = years
    .map(year => `${JSON.stringify(year)}:[\n${showsByYear[year].map(show => JSON.stringify(show)).join(',\n')}\n]`)
    .join(',\n');
  return `{\n${body}\n}\n`;
}

export type RawDump = Record<string, { source?: string; lineage?: string; taper?: string; transferer?: string }>;

export function buildRawDump(docs: ArchiveDoc[]): RawDump {
  const dump: RawDump = {};
  for (const doc of docs) {
    const entry: RawDump[string] = {};
    const source = fieldText(doc.source);
    const lineage = fieldText(doc.lineage);
    const taper = fieldText(doc.taper);
    const transferer = fieldText(doc.transferer);
    if (source) entry.source = source;
    if (lineage) entry.lineage = lineage;
    if (taper) entry.taper = taper;
    if (transferer) entry.transferer = transferer;
    dump[doc.identifier] = entry;
  }
  return dump;
}

function pct(n: number, total: number): string {
  return total === 0 ? '0%' : `${Math.round((n / total) * 100)}%`;
}

export function buildReport(showsByYear: ShowsByYear, docCount: number): string {
  const shows = Object.values(showsByYear).flat();
  const versions = shows.flatMap(s => s.versions);

  const formatCounts: Record<RecordingFormat, number> = { sbd: 0, aud: 0, matrix: 0, fm: 0, unknown: 0 };
  const lineageCounts: Record<LineageTag, number> = { betty: 0, miller: 0, '16track': 0, lowgen: 0 };
  const unknownIds: string[] = [];
  for (const v of versions) {
    formatCounts[v.format ?? 'unknown'] += 1;
    if ((v.format ?? 'unknown') === 'unknown') unknownIds.push(v.identifier);
    for (const tag of v.lineage ?? []) lineageCounts[tag] += 1;
  }

  // Show-level coverage: a show carries a tag if ANY of its recordings does.
  const showFormatCoverage: Record<RecordingFormat, number> = { sbd: 0, aud: 0, matrix: 0, fm: 0, unknown: 0 };
  const showLineageCoverage: Record<LineageTag, number> = { betty: 0, miller: 0, '16track': 0, lowgen: 0 };
  for (const s of shows) {
    const formats = new Set(s.versions.map(v => v.format ?? 'unknown'));
    const lineages = new Set(s.versions.flatMap(v => v.lineage ?? []));
    formats.forEach(f => { showFormatCoverage[f] += 1; });
    lineages.forEach(l => { showLineageCoverage[l] += 1; });
  }

  const lines: string[] = [];
  lines.push('# Catalog build report', '');
  lines.push(`Recordings: ${versions.length} (from ${docCount} search docs)`);
  lines.push(`Shows: ${shows.length}`);
  lines.push(`Years: ${Object.keys(showsByYear).sort().join(', ')}`, '');

  lines.push('## Format distribution (recording-level)', '', '| format | count | share |', '|---|---|---|');
  (Object.keys(formatCounts) as RecordingFormat[]).forEach(f => {
    lines.push(`| ${f} | ${formatCounts[f]} | ${pct(formatCounts[f], versions.length)} |`);
  });
  lines.push('');

  lines.push('## Lineage tags (recording-level)', '', '| tag | count |', '|---|---|');
  (Object.keys(lineageCounts) as LineageTag[]).forEach(l => {
    lines.push(`| ${l} | ${lineageCounts[l]} |`);
  });
  lines.push('');

  lines.push('## Show-level coverage (union over recordings)', '', '| tag | shows | coverage |', '|---|---|---|');
  (['sbd', 'aud', 'matrix', 'fm'] as RecordingFormat[]).forEach(f => {
    lines.push(`| ${FORMAT_LABELS[f]} | ${showFormatCoverage[f]} | ${pct(showFormatCoverage[f], shows.length)} |`);
  });
  (Object.keys(lineageCounts) as LineageTag[]).forEach(l => {
    lines.push(`| ${LINEAGE_LABELS[l]} | ${showLineageCoverage[l]} | ${pct(showLineageCoverage[l], shows.length)} |`);
  });
  lines.push('');

  lines.push(`## Unknown format (${unknownIds.length})`, '');
  unknownIds.sort().forEach(id => lines.push(`- ${id}`));
  lines.push('');

  return lines.join('\n');
}
