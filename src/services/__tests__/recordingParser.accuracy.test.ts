import { parseFormat } from '../recordingParser';
import fixture from './fixtures/recordingFormats.json';

interface LabeledRecording { identifier: string; source: string; expected: string }

const REQUIRED_ACCURACY = 0.85;

describe('parseFormat accuracy against hand-labeled recordings', () => {
  const items = fixture as LabeledRecording[];

  it('has a meaningful sample', () => {
    expect(items.length).toBeGreaterThanOrEqual(50);
  });

  it(`classifies at least ${REQUIRED_ACCURACY * 100}% correctly`, () => {
    const misses = items.filter(
      item => parseFormat(item.source || undefined, item.identifier) !== item.expected,
    );
    const accuracy = (items.length - misses.length) / items.length;
    // Print misses so a regression is diagnosable from the test output.
    if (misses.length > 0) {
      // eslint-disable-next-line no-console
      console.log(
        'parseFormat misses:\n' +
          misses
            .map(m => `  ${m.identifier}  expected=${m.expected} got=${parseFormat(m.source || undefined, m.identifier)}`)
            .join('\n'),
      );
    }
    expect(accuracy).toBeGreaterThanOrEqual(REQUIRED_ACCURACY);
  });
});
