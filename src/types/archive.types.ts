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
  collection?: string[];
  downloads?: number; // All-time download count
}

export interface ArchiveMetadataResponse {
  created: number;
  d1: string;
  d2: string;
  dir: string;
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
