import {
  fieldText,
  parseFormat,
  parseLineage,
  shortProvenance,
  recordingFromDoc,
} from '../recordingParser';

describe('fieldText', () => {
  it('trims strings and joins arrays', () => {
    expect(fieldText('  SBD > DAT ')).toBe('SBD > DAT');
    expect(fieldText(['Sandy Troy', 'Matt Smith'])).toBe('Sandy Troy; Matt Smith');
  });
  it('returns undefined for empty, null, numbers', () => {
    expect(fieldText('')).toBeUndefined();
    expect(fieldText('   ')).toBeUndefined();
    expect(fieldText(undefined)).toBeUndefined();
    expect(fieldText(null)).toBeUndefined();
    expect(fieldText(42)).toBeUndefined();
  });
});

describe('parseFormat', () => {
  it.each([
    // matrix must win even when sbd/aud are also mentioned
    ['Matrix mix (SBD/AUD)', 'gd1977-04-23.mtx.seamons.97596.sbeok.flac16', 'matrix'],
    ['2 source matrix: Soundboard (shnid=18554) and Aud (shnid=88771)', 'gd1977-05-17.121485.x.flac16', 'matrix'],
    ['SBD -> Master Reel -> Dat', 'gd1977-10-14.sbd.miller.110400.flac16', 'sbd'],
    ['Soundboard patched with Audience', 'gd77-05-28.sbd.obv.31952.sbeok.shnf', 'sbd'],
    ['Barry Glassberg\'s Master FM Reel (Pioneer TX9500 tuner)', 'gd1977-04-27.167535.fm.x.flac2496', 'fm'],
    ['wnew simulcast > reel', 'gd1977-04-27.x.flac24', 'fm'],
    ['Pre-FM reel > DAT', 'gd1977-09-03.x.flac16', 'fm'],
    ['Audience Recording: Sony ECM-33Ps', 'gd77-04-30.moore.minches.17952.sbeok.shnf', 'aud'],
    ['Recorded with Nakamichi CM-300s', 'gd1977-05-25.x.flac16', 'aud'],
    ['Source: AKG D224s > Tandberg 10X', 'gd1977-06-07.x.flac2496', 'aud'],
    ['Schoeps CMC4 > Sony D5', 'gd1985-06-30.x.flac16', 'aud'],
    ['Kathy Sublette\'s Master Audience Cassettes; Shure SM57 mics', 'gd1977-05-04.x.flac1648', 'aud'],
  ])('source %p with identifier %p → %p', (source, identifier, expected) => {
    expect(parseFormat(source, identifier)).toBe(expected);
  });

  it('falls back to the identifier when the source field has no format keyword', () => {
    expect(parseFormat('master reels > dat', 'gd1977-05-05.sbd.cantor.7725.shnf')).toBe('sbd');
    expect(parseFormat('Partial Recording by Gene Taback, balcony', 'gd1977-03-20.132365.aud.taback.flac16')).toBe('aud');
    expect(parseFormat('See info file', 'gd1977-05-08.mtx.dan.29511.flac16')).toBe('matrix');
    expect(parseFormat(undefined, 'gd1977-02-26.sbd.steve.253.shnf')).toBe('sbd');
    expect(parseFormat(undefined, 'gd1977-10-06.fm.kbfh.77476.sbeok.flac16')).toBe('fm');
  });

  it('does not treat "audio"/"Audition" as audience', () => {
    expect(parseFormat('dBpoweramp (WAV) > Audition (Pitch Bender)', 'gd1977-02-17.145591.Goody-pitch-fix.flac1644')).toBe('unknown');
    expect(parseFormat('DTS-Audio-CD 5.1 Mix ; SBD > Master Reel', 'gd1977-10-28.101243.dts.tobin.flac16')).toBe('sbd');
  });

  it('returns unknown when nothing matches', () => {
    expect(parseFormat(undefined, 'gd1977-02-27.145196.bertrando.smith.flac2496')).toBe('unknown');
  });
});

describe('parseLineage', () => {
  it('detects Betty from taper, source, or lineage', () => {
    expect(parseLineage({ taper: 'Betty Cantor' })).toEqual(['betty']);
    expect(parseLineage({ source: 'Betty SBD > Reel Master' })).toContain('betty');
    expect(parseLineage({ lineage: 'Bettyboard 7 inch master reel' })).toContain('betty');
  });
  it('detects Charlie Miller only from the transferer field', () => {
    expect(parseLineage({ transferer: 'Scott Clugston, Charlie Miller' })).toContain('miller');
    expect(parseLineage({ source: 'provided by Charlie Miller' })).not.toContain('miller');
  });
  it('detects 16-track from the source field', () => {
    expect(parseLineage({ source: '16-track master reels > mixdown' })).toContain('16track');
    expect(parseLineage({ source: '16 Track Reel > DAT' })).toContain('16track');
    expect(parseLineage({ source: '16tk > DAT' })).toContain('16track');
    expect(parseLineage({ lineage: '16-track' })).not.toContain('16track');
  });
  it('detects low generation from master/MR/MSR/MSC/1st gen in source or lineage', () => {
    expect(parseLineage({ source: 'SBD > Master Reel > DAT' })).toContain('lowgen');
    expect(parseLineage({ lineage: 'SBD>MSR>DAT>SS>CD' })).toContain('lowgen');
    expect(parseLineage({ lineage: 'SBD>MR>C>D>CD' })).toContain('lowgen');
    expect(parseLineage({ source: '1st Generation Reel' })).toContain('lowgen');
    expect(parseLineage({ lineage: '3rd generation reel played back' })).not.toContain('lowgen');
    expect(parseLineage({ source: 'Remastered from CD' })).not.toContain('lowgen');
  });
  it('returns tags in a stable order and empty when nothing matches', () => {
    expect(parseLineage({ source: 'Betty SBD > Master Reel', transferer: 'Charlie Miller' })).toEqual(['betty', 'miller', 'lowgen']);
    expect(parseLineage({})).toEqual([]);
  });
});

describe('shortProvenance', () => {
  it('normalizes arrows and whitespace', () => {
    expect(shortProvenance('SBD -> Master Reel  ->Dat')).toBe('SBD → Master Reel → Dat');
    expect(shortProvenance('SBD>>MR>>DAT')).toBe('SBD → MR → DAT');
    expect(shortProvenance('A > B\n> C')).toBe('A → B → C');
  });
  it('truncates to 60 chars with an ellipsis', () => {
    const long = 'Recording Info: master recorded from the balcony on a Tandberg 10X reel to reel @ 7.5 ips';
    const out = shortProvenance(long)!;
    expect(out.length).toBeLessThanOrEqual(60);
    expect(out.endsWith('…')).toBe(true);
  });
  it('returns undefined for empty input', () => {
    expect(shortProvenance(undefined)).toBeUndefined();
    expect(shortProvenance('   ')).toBeUndefined();
  });
});

describe('recordingFromDoc', () => {
  it('maps an Archive search doc to a RecordingVersion', () => {
    const v = recordingFromDoc({
      identifier: 'gd1977-05-09.123480.sbd.miller.flac16',
      title: 'Grateful Dead Live at War Memorial Auditorium on 1977-05-09',
      date: '1977-05-09T00:00:00Z',
      downloads: 98069,
      source: 'SBD -> Master Reel (DBX-1 Encoded) -> Sony PCM501ES (44.055k)',
      lineage: 'Sony PCM501ES (Analog Out) -> DBX-1 Decoder> Sony PCM501ES',
      transferer: 'Charlie Miller',
      avg_rating: 4.89,
      num_reviews: 9,
    });
    expect(v).toEqual({
      identifier: 'gd1977-05-09.123480.sbd.miller.flac16',
      downloads: 98069,
      format: 'sbd',
      lineage: ['miller', 'lowgen'],
      avgRating: 4.89,
      numReviews: 9,
      provenance: 'SBD → Master Reel (DBX-1 Encoded) → Sony PCM501ES (44.055k)',
      transferrer: 'Charlie Miller',
    });
  });
  it('omits absent optional fields and defaults downloads to 0', () => {
    const v = recordingFromDoc({ identifier: 'gd1977-02-26.sbd.steve.253.shnf', title: 'x', date: '1977-02-26T00:00:00Z' });
    expect(v).toEqual({
      identifier: 'gd1977-02-26.sbd.steve.253.shnf',
      downloads: 0,
      format: 'sbd',
      lineage: [],
    });
    expect(Object.keys(v)).not.toContain('avgRating');
    expect(Object.keys(v)).not.toContain('taper');
  });
});
