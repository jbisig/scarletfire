/**
 * Escape hatch for style fragments that use web-only CSS properties (e.g.
 * `outlineStyle`) which React Native's `ViewStyle`/`TextStyle` types don't
 * model. React Native Web forwards these properties straight through to the
 * DOM at runtime — the values are valid and necessary there (e.g. removing
 * the default focus outline, disabling iOS Safari's input auto-zoom) — but
 * TypeScript rejects them when the style object is later used as a
 * `StyleProp<TextStyle | ViewStyle>` on a cross-platform component.
 *
 * This is the ONE sanctioned place in the codebase to step outside the RN
 * style type system for a genuinely web-only CSS prop. Wrap just the
 * web-only fragment (not the whole style object) so the rest of the style
 * stays fully type-checked:
 *
 * ```ts
 * const styles = StyleSheet.create({
 *   input: {
 *     fontSize: 16,
 *     ...(Platform.OS === 'web' && webStyle({ outlineStyle: 'none' })),
 *   },
 * });
 * ```
 *
 * Do not reach for `as any` elsewhere for this — route it through here so
 * every such escape stays in one grep-able place.
 */
export function webStyle<T extends object>(style: T): any { // eslint-disable-line @typescript-eslint/no-explicit-any
  return style;
}
