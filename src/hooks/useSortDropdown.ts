import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';

export interface SortDropdownPosition {
  top: number;
  left: number;
}

export interface UseSortDropdownResult {
  /** Attach to the trigger button's wrapping View (needs `collapsable={false}` on native). */
  buttonRef: React.RefObject<View | null>;
  /** Whether the <SortDropdown> modal should be visible. */
  visible: boolean;
  /** Computed position for the <SortDropdown>, directly below the button. */
  position: SortDropdownPosition;
  /** Measures the button and opens the dropdown just below it. Pass to the trigger's onPress. */
  open: () => void;
  /** Closes the dropdown. Pass to <SortDropdown>'s onClose. */
  close: () => void;
}

/**
 * Encapsulates the ref → measure() → setPosition → open dance duplicated
 * across every screen with a <SortDropdown>: FavoritesScreen,
 * PublicProfileScreen, CollectionDetailScreen, HomeScreen, and
 * SongPerformancesScreen.
 *
 * Instantiate one call per dropdown — screens with two dropdowns (Favorites
 * and PublicProfile both pair a shows-sort with a songs-sort) call this hook
 * twice and get two fully independent ref/position/visibility triples.
 *
 * `open`/`close` are referentially stable (useCallback with only the
 * `verticalOffset` primitive as a dependency), so wiring them into an
 * already-memoized renderItem/press-handler chain doesn't add new
 * re-renders beyond the sort-state change itself.
 */
export function useSortDropdown(verticalOffset = 8): UseSortDropdownResult {
  const buttonRef = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<SortDropdownPosition>({ top: 0, left: 0 });

  const open = useCallback(() => {
    buttonRef.current?.measure((_x, _y, _width, height, pageX, pageY) => {
      setPosition({ top: pageY + height + verticalOffset, left: pageX });
      setVisible(true);
    });
  }, [verticalOffset]);

  const close = useCallback(() => {
    setVisible(false);
  }, []);

  return { buttonRef, visible, position, open, close };
}
