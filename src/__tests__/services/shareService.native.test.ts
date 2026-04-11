import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import {
  shareToCopyLink,
  shareToWhatsApp,
  shareToMessages,
  shareToInstagramStory,
} from '../../services/shareService.native';
import type { ShareItem } from '../../services/shareService';

jest.mock('expo-linking', () => ({
  canOpenURL: jest.fn(),
  openURL: jest.fn(),
}));
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));
// haptics is already stubbed in setup.ts via the hapticService module,
// but we also stub it here for isolation.
jest.mock('../../services/hapticService', () => ({
  haptics: {
    light: jest.fn(),
    medium: jest.fn(),
    heavy: jest.fn(),
    selection: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
  },
}));

const mockedLinking = Linking as jest.Mocked<typeof Linking>;
const mockedClipboard = Clipboard as jest.Mocked<typeof Clipboard>;

const songItem: ShareItem = {
  kind: 'song',
  showId: 'gd1982',
  trackId: 't1',
  trackTitle: "Franklin's Tower",
  trackSlug: 'franklins-tower',
  date: '1982-08-06',
  venue: 'Sound City',
  rating: 1,
};

const showItem: ShareItem = {
  kind: 'show',
  showId: 'gd1982',
  date: '1982-08-06',
  venue: 'Sound City',
  tier: 2,
};

describe('shareToCopyLink', () => {
  beforeEach(() => {
    (mockedClipboard.setStringAsync as jest.Mock).mockResolvedValue(true);
  });

  it('writes the song share URL to the clipboard', async () => {
    await shareToCopyLink({ item: songItem, bgIndex: 3 });
    expect(mockedClipboard.setStringAsync).toHaveBeenCalledTimes(1);
    const urlArg = (mockedClipboard.setStringAsync as jest.Mock).mock.calls[0][0];
    expect(urlArg).toBe('https://www.scarletfire.app/show/1982-08-06/franklins-tower?bg=3');
  });

  it('writes the show share URL to the clipboard', async () => {
    await shareToCopyLink({ item: showItem, bgIndex: 5 });
    const urlArg = (mockedClipboard.setStringAsync as jest.Mock).mock.calls[0][0];
    expect(urlArg).toBe('https://www.scarletfire.app/show/1982-08-06?bg=5');
  });
});

describe('shareToWhatsApp', () => {
  beforeEach(() => {
    (mockedLinking.openURL as jest.Mock).mockResolvedValue(undefined);
  });

  it('uses the whatsapp:// scheme when canOpenURL returns true', async () => {
    (mockedLinking.canOpenURL as jest.Mock).mockResolvedValue(true);
    await shareToWhatsApp({ item: songItem, bgIndex: 2 });
    const url = (mockedLinking.openURL as jest.Mock).mock.calls[0][0] as string;
    expect(url.startsWith('whatsapp://send')).toBe(true);
    // The share URL is URL-encoded inside the "text" query — check that
    // both the share URL and the bg param are present after decoding.
    const text = decodeURIComponent(url.slice('whatsapp://send?text='.length));
    expect(text).toContain('https://www.scarletfire.app/show/1982-08-06/franklins-tower?bg=2');
    expect(text).toContain("Franklin's Tower");
  });

  it('falls back to https://wa.me/ when canOpenURL returns false', async () => {
    (mockedLinking.canOpenURL as jest.Mock).mockResolvedValue(false);
    await shareToWhatsApp({ item: songItem, bgIndex: 1 });
    const url = (mockedLinking.openURL as jest.Mock).mock.calls[0][0] as string;
    expect(url.startsWith('https://wa.me/')).toBe(true);
  });
});

describe('shareToMessages', () => {
  const originalOS = Platform.OS;
  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Platform as any).OS = originalOS;
  });

  beforeEach(() => {
    (mockedLinking.openURL as jest.Mock).mockResolvedValue(undefined);
  });

  it('uses sms:&body= on iOS', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Platform as any).OS = 'ios';
    await shareToMessages({ item: songItem, bgIndex: 4 });
    const url = (mockedLinking.openURL as jest.Mock).mock.calls[0][0] as string;
    expect(url.startsWith('sms:&body=')).toBe(true);
    expect(decodeURIComponent(url)).toContain("Franklin's Tower");
  });

  it('uses smsto:?body= on Android', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Platform as any).OS = 'android';
    await shareToMessages({ item: songItem, bgIndex: 4 });
    const url = (mockedLinking.openURL as jest.Mock).mock.calls[0][0] as string;
    expect(url.startsWith('smsto:?body=')).toBe(true);
  });
});

describe('shareToInstagramStory (deferred — minimal fallback)', () => {
  it('opens the Instagram website as a temporary fallback', async () => {
    (mockedLinking.openURL as jest.Mock).mockResolvedValue(undefined);
    await shareToInstagramStory({ item: songItem, bgIndex: 1 });
    const url = (mockedLinking.openURL as jest.Mock).mock.calls[0][0] as string;
    expect(url).toBe('https://www.instagram.com/');
  });
});
