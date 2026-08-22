import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { ActivityRow, describeActivity, formatRelative } from '../../components/feed/ActivityRow';
import type { ActivityEvent } from '../../services/activityService';

jest.mock('../../components/ProfileImage', () => ({ ProfileImage: () => null }));

function event(overrides: Partial<ActivityEvent>): ActivityEvent {
  return {
    id: 'e1',
    actor_id: 'u1',
    event_type: 'listened_show',
    target_type: 'show',
    target_id: 'gd77-05-08.sbd.hicks.4982.sbeok.shnf',
    metadata: null,
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    source: 'following',
    actor_username: 'jesse',
    actor_display_name: 'Jesse',
    actor_avatar_url: null,
    ...overrides,
  };
}

describe('describeActivity', () => {
  it('names a listened show by venue and formatted date, from the date alone', () => {
    const d = describeActivity(event({ metadata: { date: '1977-05-08' } }));
    expect(d.verb).toBe('listened to');
    expect(d.target).toBe('Barton Hall, Cornell University · 05/08/1977');
  });

  it('falls back to the recorded venue when the catalog has no show for the date', () => {
    const d = describeActivity(event({
      event_type: 'favorited_show',
      metadata: { date: '1999-01-01', venue: 'Somewhere' },
    }));
    expect(d.target).toBe('Somewhere · 01/01/1999');
  });

  it('distinguishes playlists from show collections', () => {
    expect(describeActivity(event({
      event_type: 'created_collection', target_type: 'collection',
      metadata: { name: 'Road Trips', type: 'playlist' },
    }))).toEqual({ verb: 'created the playlist', target: 'Road Trips' });
    expect(describeActivity(event({
      event_type: 'saved_collection', target_type: 'collection',
      metadata: { name: 'Europe 72', type: 'show_collection', creator_username: 'bob' },
    }))).toEqual({ verb: "saved @bob's collection", target: 'Europe 72' });
  });

  it('describes follows by display name, falling back to the handle', () => {
    expect(describeActivity(event({
      event_type: 'followed_user', target_type: 'user',
      metadata: { username: 'phil', display_name: 'Phil' },
    })).target).toBe('Phil');
    expect(describeActivity(event({
      event_type: 'followed_user', target_type: 'user', metadata: { username: 'phil' },
    })).target).toBe('@phil');
  });
});

describe('formatRelative', () => {
  it('uses compact units', () => {
    const now = Date.parse('2026-08-21T12:00:00Z');
    expect(formatRelative('2026-08-21T11:59:30Z', now)).toBe('30s');
    expect(formatRelative('2026-08-21T10:00:00Z', now)).toBe('2h');
    expect(formatRelative('2026-08-18T12:00:00Z', now)).toBe('3d');
  });
});

describe('ActivityRow', () => {
  it('renders one sentence, and routes the card tap and actor tap separately', () => {
    const onPressActor = jest.fn();
    const onPressTarget = jest.fn();
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <ActivityRow
          event={event({ metadata: { date: '1977-05-08' } })}
          actorDisplayName="Jesse"
          actorUsername="jesse"
          actorAvatarUrl={null}
          onPressActor={onPressActor}
          onPressTarget={onPressTarget}
        />,
      );
    });
    const text = tree.root.findAllByType(Text).map(t => React.Children.toArray(t.props.children).join('')).join(' | ');
    expect(text).toContain('Jesse');
    expect(text).toContain('listened to');
    expect(text).toContain('Barton Hall, Cornell University · 05/08/1977');
    expect(text).not.toContain('1977-05-08');

    const card = tree.root.findByProps({ accessibilityHint: 'Opens the show' });
    expect(card.props.accessibilityLabel).toBe(
      'Jesse listened to Barton Hall, Cornell University · 05/08/1977, 2h ago',
    );
    act(() => { card.props.onPress(); });
    expect(onPressTarget).toHaveBeenCalledTimes(1);

    const avatar = tree.root.findByProps({ accessibilityLabel: "Jesse's profile" });
    act(() => { avatar.props.onPress({ stopPropagation: jest.fn() }); });
    expect(onPressActor).toHaveBeenCalledTimes(1);
    expect(onPressTarget).toHaveBeenCalledTimes(1);
  });
});
