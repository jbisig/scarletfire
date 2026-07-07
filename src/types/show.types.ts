export interface RecordingVersion {
  identifier: string;
  title: string;
  source?: string; // e.g., "sbd" (soundboard), "aud" (audience), "matrix"
  downloads?: number; // All-time download count
  taper?: string; // Who recorded it
  transferrer?: string; // Who did the digital transfer
}

export interface GratefulDeadShow {
  date: string;
  year: string | number;
  venue?: string;
  location?: string;
  versions: RecordingVersion[]; // All recording versions of this show
  primaryIdentifier: string; // The main/default version to display
  title: string;
  savedAt?: number; // Unix timestamp when the show was saved
  classicTier?: 1 | 2 | 3; // Star rating tier (1=3 stars, 2=2 stars, 3=1 star)
}

export interface ShowDetail {
  identifier: string;
  title: string;
  date: string;
  year: string | number;
  venue?: string;
  location?: string;
  description?: string;
  tracks: Track[];
  allVersions?: RecordingVersion[]; // All available versions for this show
}

export interface Track {
  id: string; // filename
  title: string;
  duration?: number; // seconds
  format: string;
  streamUrl: string;
  /**
   * Durable archive.org/download URL used if `streamUrl` (a direct datanode
   * URL that skips the /download 302 hop) fails — datanode assignments can
   * be rebalanced over time. Absent when streamUrl already IS the /download URL.
   */
  fallbackStreamUrl?: string;
  trackNumber?: number;
}

export interface ShowsByYear {
  [year: string]: GratefulDeadShow[];
}
