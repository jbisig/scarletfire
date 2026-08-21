import { PEDAL_STEEL_DATES, ACOUSTIC_SET_DATES, UNVERIFIED_PEDAL_STEEL_DATES, UNVERIFIED_ACOUSTIC_SET_DATES } from '../instrumentation';
import { HISTORIC_EVENT_DATES, GUEST_SIT_IN_DATES, consensusClassicDates } from '../notableShows';
import { TIER_1_SHOWS } from '../classicShowsTiers';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const checkList = (list: ReadonlyArray<{ date: string; note: string; source: string; confidence: string }>, min: number) => {
  expect(list.length).toBeGreaterThanOrEqual(min);
  const seen = new Set<string>();
  list.forEach(e => {
    expect(e.date).toMatch(DATE_RE);
    expect(seen.has(e.date)).toBe(false); seen.add(e.date);
    expect(e.note.length).toBeGreaterThan(0);
    expect(e.source.length).toBeGreaterThan(3);
    expect(['high', 'medium']).toContain(e.confidence);
  });
};

describe('instrumentation datasets', () => {
  it('pedal steel: verified rows are well-formed and stay within the documented range', () => {
    checkList(PEDAL_STEEL_DATES, 20);
    // NOTE: the brief's draft test asserted PEDAL_STEEL_DATES contains
    // 1970-05-02 (Harpur College). That date only appears in the research's
    // Acoustic Set section (section 2, line 78) — it is not one of the 32
    // rows in section 1 "Pedal Steel", whose coverage notes explicitly
    // exclude NRPS-set steel appearances. Asserting its presence here would
    // require fabricating a row not present in the source research, which
    // the task brief prohibits ("preserve source verbatim", "transcribe
    // mechanically and completely"). That assertion is therefore dropped
    // from this test (see task-4-report.md for the full explanation); the
    // equivalent assertion correctly lives on the acoustic-set test below.
    //
    // The brief's draft test also asserted every date is < 1975-01-01. The
    // research (section 1, rows 1987-07-04/07-10/07-12/07-24, all high
    // confidence) documents a second pedal-steel cluster during the 1987
    // Dylan & the Dead tour — "last time Garcia played pedal steel onstage
    // with the GD until the 1987 Dylan tour" per the coverage notes — so a
    // strict pre-1975 cutoff would require dropping four legitimate,
    // verbatim-sourced rows. The assertion below is corrected to allow both
    // documented clusters instead of only the first.
    PEDAL_STEEL_DATES.forEach(e => {
      expect(e.date < '1975-01-01' || e.date.startsWith('1987')).toBe(true);
    });
    UNVERIFIED_PEDAL_STEEL_DATES.forEach(e => expect(e.confidence).toBe('low'));
  });
  it('acoustic set: covers the 1970 and fall-1980 runs', () => {
    checkList(ACOUSTIC_SET_DATES, 60);
    expect(ACOUSTIC_SET_DATES.some(e => e.date === '1970-05-02')).toBe(true);
    expect(ACOUSTIC_SET_DATES.filter(e => e.date.startsWith('1980-10')).length).toBeGreaterThanOrEqual(10);
    UNVERIFIED_ACOUSTIC_SET_DATES.forEach(e => expect(e.confidence).toBe('low'));
  });
});

describe('notable datasets', () => {
  it('historic events are well-formed and include the last show', () => {
    checkList(HISTORIC_EVENT_DATES, 30);
    expect(HISTORIC_EVENT_DATES.some(e => e.date === '1995-07-09')).toBe(true);
    expect(HISTORIC_EVENT_DATES.some(e => e.date === '1969-12-06')).toBe(false);   // Altamont excluded (non-performance)
  });
  it('guest sit-ins name the guest', () => {
    checkList(GUEST_SIT_IN_DATES, 80);
    expect(GUEST_SIT_IN_DATES.find(e => e.date === '1990-03-29')?.note).toMatch(/Branford Marsalis/);
  });
  it('consensus classic = tier-1 dates', () => {
    expect(consensusClassicDates()).toEqual(TIER_1_SHOWS.map(s => s.date));
    expect(consensusClassicDates()).toContain('1977-05-08');
  });
});
