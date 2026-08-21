// Public/Private toggle: flips optimistically so the header pill responds
// instantly, reconciles with the server row, and reverts (rethrowing) when
// the request fails so the screen can toast.
import React from 'react';
import { Text } from 'react-native';
import { render, waitFor, act } from '@testing-library/react-native';
import { CollectionsProvider, useCollections } from '../CollectionsContext';
import { collectionsService } from '../../services/collectionsService';
import type { Collection } from '../../types/collection.types';

jest.mock('../../services/collectionsService', () => ({
  collectionsService: {
    fetchCollections: jest.fn(),
    fetchItemCountsByIdentifier: jest.fn().mockResolvedValue({}),
    fetchSavedCollections: jest.fn().mockResolvedValue({ saved: [], liveCollections: new Map() }),
    setCollectionPublic: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: { api: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } },
}));

// Stable identity matters: the provider's refresh effect is keyed on `user`,
// so a fresh object per render would loop it forever.
const AUTH = { state: { user: { id: 'me' }, isAuthenticated: true } };
jest.mock('../AuthContext', () => ({
  useAuth: () => AUTH,
}));

const base: Collection = {
  id: 'c1',
  userId: 'me',
  name: 'Road Trips',
  type: 'playlist',
  slug: 'road-trips',
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
  isShared: false,
  isPublic: false,
};

let api: ReturnType<typeof useCollections> | null = null;
function Probe() {
  api = useCollections();
  const c = api.collections[0];
  return <Text testID="state">{c ? `${c.isPublic}/${c.isShared}` : 'none'}</Text>;
}

describe('CollectionsContext.setCollectionPublic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api = null;
    (collectionsService.fetchCollections as jest.Mock).mockResolvedValue([base]);
  });

  it('flips Public (and shared) optimistically, then takes the server row', async () => {
    let resolve!: (c: Collection) => void;
    (collectionsService.setCollectionPublic as jest.Mock).mockReturnValue(
      new Promise<Collection>((r) => { resolve = r; }),
    );
    const { getByTestId } = render(<CollectionsProvider><Probe /></CollectionsProvider>);
    await waitFor(() => expect(getByTestId('state').props.children).toBe('false/false'));

    let pending!: Promise<void>;
    act(() => { pending = api!.setCollectionPublic('c1', true); });
    // Optimistic: public, and the link enabled, before the server answers.
    expect(getByTestId('state').props.children).toBe('true/true');

    await act(async () => {
      resolve({ ...base, isPublic: true, isShared: true, updatedAt: '2026-08-21T00:00:00Z' });
      await pending;
    });
    expect(getByTestId('state').props.children).toBe('true/true');
    expect(api!.collections[0].updatedAt).toBe('2026-08-21T00:00:00Z');
  });

  it('reverts to the previous row and rethrows when the server fails', async () => {
    (collectionsService.setCollectionPublic as jest.Mock).mockRejectedValue(new Error('nope'));
    const { getByTestId } = render(<CollectionsProvider><Probe /></CollectionsProvider>);
    await waitFor(() => expect(getByTestId('state').props.children).toBe('false/false'));

    await act(async () => {
      await expect(api!.setCollectionPublic('c1', true)).rejects.toThrow('nope');
    });
    expect(getByTestId('state').props.children).toBe('false/false');
  });

  it('going Private leaves an existing share link enabled', async () => {
    (collectionsService.fetchCollections as jest.Mock).mockResolvedValue([{ ...base, isPublic: true, isShared: true }]);
    (collectionsService.setCollectionPublic as jest.Mock).mockResolvedValue({ ...base, isPublic: false, isShared: true });
    const { getByTestId } = render(<CollectionsProvider><Probe /></CollectionsProvider>);
    await waitFor(() => expect(getByTestId('state').props.children).toBe('true/true'));

    await act(async () => { await api!.setCollectionPublic('c1', false); });
    expect(getByTestId('state').props.children).toBe('false/true');
  });
});
