import {
  shareToCopyLink,
  shareToWhatsApp,
  shareToMessages,
  shareToInstagramStory,
} from '../../services/shareService.web';
import type { ShareItem } from '../../services/shareService';

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

describe('shareService.web', () => {
  describe('shareToCopyLink', () => {
    it('writes the share URL via navigator.clipboard', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).navigator = { clipboard: { writeText } };

      await shareToCopyLink({ item: songItem, bgIndex: 3 });

      expect(writeText).toHaveBeenCalledTimes(1);
      expect(writeText.mock.calls[0][0]).toBe(
        'https://www.scarletfire.app/show/1982-08-06/franklins-tower?bg=3'
      );
    });
  });

  describe('shareToWhatsApp', () => {
    it('opens wa.me/?text= with the encoded body', async () => {
      const open = jest.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).window = { open };

      await shareToWhatsApp({ item: songItem, bgIndex: 2 });

      expect(open).toHaveBeenCalledTimes(1);
      const url = open.mock.calls[0][0] as string;
      expect(url.startsWith('https://wa.me/?text=')).toBe(true);
      const text = decodeURIComponent(url.slice('https://wa.me/?text='.length));
      expect(text).toContain("Franklin's Tower");
      expect(text).toContain('https://www.scarletfire.app/show/1982-08-06/franklins-tower?bg=2');
    });
  });

  describe('shareToMessages', () => {
    it('assigns sms:?body= to window.location.href', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockWindow: any = { location: { href: '' } };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).window = mockWindow;

      await shareToMessages({ item: songItem, bgIndex: 4 });

      expect(mockWindow.location.href.startsWith('sms:?body=')).toBe(true);
      expect(decodeURIComponent(mockWindow.location.href)).toContain("Franklin's Tower");
    });
  });

  describe('shareToInstagramStory', () => {
    it('is a no-op (hidden by ShareTray.web on web)', async () => {
      // Should not throw or try to touch the DOM.
      await expect(shareToInstagramStory({ item: songItem, bgIndex: 1 })).resolves.toBeUndefined();
    });
  });
});
