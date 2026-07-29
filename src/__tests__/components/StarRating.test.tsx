import React from 'react';
import TestRenderer from 'react-test-renderer';
import { Ionicons } from '@expo/vector-icons';
import { StarRating } from '../../components/StarRating';
import { COLORS } from '../../constants/theme';

const icons = (tree: TestRenderer.ReactTestRenderer) =>
  tree.root.findAllByType(Ionicons).map((i: TestRenderer.ReactTestInstance) => ({ name: i.props.name, color: i.props.color }));

describe('legacy tier path', () => {
  it('tier 1 renders 3 red filled stars', () => {
    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(<StarRating tier={1} />);
    });
    expect(icons(tree!)).toEqual(Array(3).fill({ name: 'star', color: COLORS.accent }));
  });
});

describe('resolved rating path', () => {
  it('system rating renders red filled stars', () => {
    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(<StarRating rating={{ stars: 2, isUserRating: false }} />);
    });
    expect(icons(tree!)).toEqual(Array(2).fill({ name: 'star', color: COLORS.accent }));
  });

  it('user rating renders gold filled stars', () => {
    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(<StarRating rating={{ stars: 3, isUserRating: true }} />);
    });
    expect(icons(tree!)).toEqual(Array(3).fill({ name: 'star', color: COLORS.userRating }));
  });

  it('0-star user rating renders one gold outline star', () => {
    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(<StarRating rating={{ stars: 0, isUserRating: true }} />);
    });
    expect(icons(tree!)).toEqual([{ name: 'star-outline', color: COLORS.userRating }]);
  });

  it('null rating renders nothing by default', () => {
    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(<StarRating rating={null} />);
    });
    expect(tree!.root.findAllByType(Ionicons)).toHaveLength(0);
  });

  it('null rating with placeholder renders 3 dim outline stars', () => {
    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(<StarRating rating={null} showPlaceholder />);
    });
    expect(icons(tree!)).toEqual(Array(3).fill({ name: 'star-outline', color: COLORS.textMuted }));
  });

  it('labels user ratings for accessibility', () => {
    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(<StarRating rating={{ stars: 2, isUserRating: true }} />);
    });
    const view = tree!.root.findByProps({ accessibilityRole: 'text' });
    expect(view.props.accessibilityLabel).toBe('Your rating: 2 stars');
  });
});
