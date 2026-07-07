import { renderHook, act } from '@testing-library/react-native';
import { useSortDropdown } from '../useSortDropdown';

// react-native's View.measure is a native method; stub it on the ref object
// the hook receives so we can drive the ref→measure→setPosition→open dance
// without mounting an actual component tree.
function attachFakeMeasure(
  hook: ReturnType<typeof renderHook<ReturnType<typeof useSortDropdown>, unknown>>,
  measureImpl: (cb: (x: number, y: number, w: number, h: number, pageX: number, pageY: number) => void) => void,
) {
  // @ts-expect-error - test double: assigning a plain object to the ref's .current
  hook.result.current.buttonRef.current = { measure: measureImpl };
}

describe('useSortDropdown', () => {
  it('starts closed with a zeroed position', () => {
    const { result } = renderHook(() => useSortDropdown());
    expect(result.current.visible).toBe(false);
    expect(result.current.position).toEqual({ top: 0, left: 0 });
  });

  it('measures the button and opens with a position offset below it', () => {
    const hook = renderHook(() => useSortDropdown());
    attachFakeMeasure(hook, (cb) => cb(0, 0, 100, 40, 12, 200));

    act(() => {
      hook.result.current.open();
    });

    expect(hook.result.current.visible).toBe(true);
    // top = pageY + height + default offset (8), left = pageX
    expect(hook.result.current.position).toEqual({ top: 200 + 40 + 8, left: 12 });
  });

  it('supports a custom vertical offset', () => {
    const hook = renderHook(() => useSortDropdown(20));
    attachFakeMeasure(hook, (cb) => cb(0, 0, 100, 40, 12, 200));

    act(() => {
      hook.result.current.open();
    });

    expect(hook.result.current.position).toEqual({ top: 200 + 40 + 20, left: 12 });
  });

  it('does nothing if the ref has no node to measure (button not yet mounted)', () => {
    const { result } = renderHook(() => useSortDropdown());

    act(() => {
      result.current.open();
    });

    expect(result.current.visible).toBe(false);
  });

  it('close() hides the dropdown', () => {
    const hook = renderHook(() => useSortDropdown());
    attachFakeMeasure(hook, (cb) => cb(0, 0, 100, 40, 12, 200));

    act(() => {
      hook.result.current.open();
    });
    expect(hook.result.current.visible).toBe(true);

    act(() => {
      hook.result.current.close();
    });
    expect(hook.result.current.visible).toBe(false);
  });

  it('returns stable open/close handlers and ref across re-renders (does not destabilize memoized consumers)', () => {
    const { result, rerender } = renderHook(() => useSortDropdown());
    const firstOpen = result.current.open;
    const firstClose = result.current.close;
    const firstRef = result.current.buttonRef;

    rerender({});

    expect(result.current.open).toBe(firstOpen);
    expect(result.current.close).toBe(firstClose);
    expect(result.current.buttonRef).toBe(firstRef);
  });

  it('supports two independent instances for screens with paired dropdowns (e.g. shows + songs)', () => {
    const showsHook = renderHook(() => useSortDropdown());
    const songsHook = renderHook(() => useSortDropdown());

    attachFakeMeasure(showsHook, (cb) => cb(0, 0, 100, 40, 10, 100));
    attachFakeMeasure(songsHook, (cb) => cb(0, 0, 100, 40, 50, 300));

    act(() => {
      showsHook.result.current.open();
    });

    expect(showsHook.result.current.visible).toBe(true);
    expect(songsHook.result.current.visible).toBe(false);
    expect(showsHook.result.current.position).toEqual({ top: 148, left: 10 });
  });
});
