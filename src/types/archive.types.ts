// Internet Archive API response types
export interface ArchiveSearchResponse {
  response: {
    numFound: number;
    start: number;
    docs: ArchiveDoc[];
  };
}

export interface ArchiveDoc {
  identifier: string;
  title: string;
  date: string; // ISO date string
  venue?: string;
  coverage?: string; // Location info
  year?: string;
  /** archive.org returns a bare string for single-collection items. */
  collection?: string | string[];
  downloads?: number; // All-time download count
  taper?: string; // Who recorded it
  transferer?: string; // Who did the digital transfer (Archive.org spelling)
  source?: string | string[]; // Free-text source description (taper-entered)
  lineage?: string | string[]; // Transfer chain
  avg_rating?: number; // 0–5
  num_reviews?: number;
}

export interface ArchiveMetadataResponse {
  created: number;
  d1: string;
  d2: string;
  dir: string;
  /** Primary datanode host currently serving this item (e.g. "ia600106.us.archive.org") */
  server?: string;
  files: ArchiveFile[];
  metadata: ArchiveMetadata;
}

export interface ArchiveFile {
  name: string;
  format: string; // "VBR MP3", "Flac", "Ogg Vorbis"
  size: string;
  length?: string; // Duration in seconds
  title?: string;
  track?: string;
  creator?: string;
}

export interface ArchiveMetadata {
  identifier: string;
  title: string;
  date: string;
  venue?: string;
  coverage?: string;
  description?: string;
  year?: string;
  collection?: string[];
  creator?: string;
}
