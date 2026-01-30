# Design System Review
## Senior Designer Evaluation

**Date:** January 30, 2026
**Scope:** Design consistency, typography, colors, component reuse, UX improvements

---

## Executive Summary

This review identifies significant opportunities to improve design consistency and reduce code duplication. The app has a solid foundation but lacks a formalized design system, resulting in **15 different font sizes**, **12+ repeated rgba color values**, and **6+ duplicated UI patterns** that should be consolidated into shared components.

**Priority Areas:**
1. Typography scale consolidation (HIGH)
2. Color system expansion (HIGH)
3. Shared component extraction (HIGH)
4. Spacing scale formalization (MEDIUM)
5. UX improvements (MEDIUM)

---

## 1. Typography Issues

### Current State
The app uses **15 different font sizes** with inconsistent weight specifications:

| Size | Usage | Recommendation |
|------|-------|----------------|
| 10px | Tab bar labels | Keep (caption) |
| 12px | Badges, small text | Keep (caption) |
| 13px | Time displays, secondary | Merge with 14px |
| 14px | Body text, labels | Keep (body-small) |
| 15px | Some buttons | Merge with 16px |
| 16px | Primary body text | Keep (body) |
| 18px | Emphasized body | Keep (body-large) |
| 20px | Small headings | Keep (heading-4) |
| 22px | Mid headings | Merge with 20 or 24 |
| 24px | Section headings | Keep (heading-3) |
| 26px | Large headings | Merge with 28 |
| 28px | Page titles | Keep (heading-2) |
| 32px | Player title | Keep (heading-1) |
| 36px | Hero text | Keep (display) |
| 42px | SOTD feature | Keep (display-large) |

### Problems Found

**1. Inconsistent Font Weights**
```
'bold' (equals 700) used interchangeably with '600'
- ShowCard uses 'bold' for venue
- MiniPlayer uses '600' for track title
- Both should be the same visual weight
```

**2. Hardcoded Font Family Names (6 instances)**
- `AppNavigator.tsx` - lines 57, 94, 134, 168
- `SOTDScreen.tsx` - lines 132, 159

Should use `FONTS.primary` instead of `'FamiljenGrotesk'`

**3. Shared TextStyles Not Used**
`componentStyles.ts` defines `TextStyles.trackTitle` but components define identical styles inline.

### Recommended Typography Scale

```typescript
// src/constants/theme.ts
export const TYPOGRAPHY = {
  // Display
  displayLarge: { fontSize: 42, fontWeight: '700', fontFamily: FONTS.primary },
  display: { fontSize: 36, fontWeight: '700', fontFamily: FONTS.primary },

  // Headings
  heading1: { fontSize: 32, fontWeight: '700', fontFamily: FONTS.primary },
  heading2: { fontSize: 28, fontWeight: '700', fontFamily: FONTS.primary },
  heading3: { fontSize: 24, fontWeight: '700', fontFamily: FONTS.primary },
  heading4: { fontSize: 20, fontWeight: '700', fontFamily: FONTS.primary },

  // Body
  bodyLarge: { fontSize: 18, fontWeight: '400', fontFamily: FONTS.secondary },
  body: { fontSize: 16, fontWeight: '400', fontFamily: FONTS.secondary },
  bodySmall: { fontSize: 14, fontWeight: '400', fontFamily: FONTS.secondary },

  // Caption
  caption: { fontSize: 12, fontWeight: '400', fontFamily: FONTS.secondary },
  captionSmall: { fontSize: 10, fontWeight: '500', fontFamily: FONTS.secondary },

  // Labels (semibold variants)
  labelLarge: { fontSize: 16, fontWeight: '600', fontFamily: FONTS.secondary },
  label: { fontSize: 14, fontWeight: '500', fontFamily: FONTS.secondary },
  labelSmall: { fontSize: 12, fontWeight: '500', fontFamily: FONTS.secondary },
} as const;
```

---

## 2. Color System Issues

### Current State
The theme defines 12 colors but the codebase uses **30+ additional hardcoded rgba values**.

### Missing Colors (Should Add to theme.ts)

```typescript
export const COLORS = {
  // ... existing colors ...

  // Text opacity variants
  textHint: 'rgba(255, 255, 255, 0.66)',        // 10 instances
  textPlaceholder: 'rgba(255, 255, 255, 0.75)', // 6 instances
  textDisabled: 'rgba(255, 255, 255, 0.5)',     // scattered

  // Border variants
  borderLight: 'rgba(255, 255, 255, 0.33)',     // 4 instances
  borderMedium: 'rgba(255, 255, 255, 0.5)',     // 1 instance

  // Surface/Background variants
  surfaceOverlay: 'rgba(255, 255, 255, 0.15)', // auth inputs
  surfaceFocused: 'rgba(255, 255, 255, 0.3)',  // focused inputs

  // Overlay/Backdrop
  backdrop: 'rgba(0, 0, 0, 0.5)',              // 2 instances (modals)

  // Accent variants
  accentTransparent: 'rgba(229, 76, 79, 0.15)', // badge backgrounds
} as const;
```

### Hardcoded Colors Found

| Color | Location | Should Be |
|-------|----------|-----------|
| `#121212` | FullPlayer.tsx:387 | `COLORS.background` |
| `rgba(255,255,255,0.66)` | 10 files | `COLORS.textHint` |
| `rgba(255,255,255,0.75)` | LoginScreen, SignupScreen | `COLORS.textPlaceholder` |
| `rgba(0,0,0,0.5)` | SettingsScreen, OfficialReleaseModal | `COLORS.backdrop` |
| `#2a2a2a` | Multiple files | `COLORS.cardBackground` |

---

## 3. Component Reuse Opportunities

### HIGH PRIORITY - Extract These Components

#### 3.1 SearchBar Component
**Currently duplicated in:** HomeScreen, FavoritesScreen (2x), SongListScreen, SongPerformancesScreen

```typescript
// Proposed: src/components/SearchBar.tsx
interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}
```

**Estimated savings:** ~150 lines of duplicated code

#### 3.2 DropdownMenu Component
**Currently duplicated in:** FavoritesScreen (2x), ClassicsScreen, SongPerformancesScreen, PageHeader

```typescript
// Proposed: src/components/DropdownMenu.tsx
interface DropdownMenuProps {
  visible: boolean;
  onClose: () => void;
  position: { top: number; right: number };
  options: Array<{
    label: string;
    value: string;
    selected?: boolean;
  }>;
  onSelect: (value: string) => void;
}
```

**Estimated savings:** ~200 lines of duplicated code

#### 3.3 State Components (Loading, Empty, Error)
**Currently duplicated in:** 6+ screens each

```typescript
// Proposed: src/components/StateViews.tsx
export const LoadingState: React.FC<{ message?: string }>;
export const EmptyState: React.FC<{ icon: string; message: string; action?: ReactNode }>;
export const ErrorState: React.FC<{ message: string; onRetry?: () => void }>;
```

**Estimated savings:** ~100 lines of duplicated code

### MEDIUM PRIORITY

#### 3.4 SortPillButton Component
**Currently duplicated in:** FavoritesScreen (2x), ClassicsScreen, SongPerformancesScreen

#### 3.5 PlayCountBadge Component
**Currently duplicated in:** FavoritesScreen, ShowDetailScreen, ShowCard

---

## 4. Spacing System Issues

### Current State
The app uses **inconsistent spacing values** that don't follow a clear scale.

### Values Found
- **Padding:** 3, 4, 6, 8, 10, 12, 14, 16, 20, 24, 30, 32, 40
- **Margins:** 2, 4, 6, 8, 10, 12, 16, 32
- **Gaps:** 4, 6, 8, 10, 12, 20
- **Border Radius:** 6, 8, 12, 14, 16, 17, 20, 24, 28, 40, 50

### Recommended Spacing Scale

```typescript
// src/constants/theme.ts
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
} as const;

export const RADIUS = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999, // for pills/circles
} as const;
```

### Inconsistencies Found
- `borderRadius: 17` in ShowDetailScreen (should be 16)
- Mix of 6px and 10px for icon-text gaps (standardize to 8px)
- Inconsistent badge padding (10x6 vs 10x4)

---

## 5. UX Improvement Opportunities

### 5.1 Search Experience
**Issue:** Search bars lack consistent behavior
- Some have debounce (400ms), some don't
- Clear button appears at different thresholds
- No search history or suggestions

**Recommendation:** Create unified SearchBar with:
- Consistent 300ms debounce
- Clear button appears when length > 0
- Optional recent searches

### 5.2 Empty States
**Issue:** Empty states are inconsistent
- Different icons and messaging styles
- Some have action buttons, some don't
- No illustrations

**Recommendation:** Create engaging empty states with:
- Consistent illustration style
- Clear call-to-action
- Helpful suggestions

### 5.3 Loading States
**Issue:** Simple spinner with inconsistent messages
- "Loading..." vs "Loading shows..." vs no message
- No skeleton loaders

**Recommendation:** Consider skeleton loaders for lists to reduce perceived loading time.

### 5.4 Sort/Filter UI
**Issue:** Dropdown menus appear in different positions
- Some right-aligned, some centered
- Inconsistent animation

**Recommendation:** Standardize dropdown behavior with consistent positioning and animation.

### 5.5 Tab Navigation (FavoritesScreen)
**Issue:** Custom tab implementation
- Works well but could benefit from haptic feedback
- Sliding indicator animation is good

**Recommendation:** Add haptic feedback on tab switch.

### 5.6 Pull-to-Refresh
**Issue:** Not implemented on most screens

**Recommendation:** Add pull-to-refresh where data can be refreshed.

---

## 6. Implementation Plan

### Phase 1: Foundation (Week 1)
- [ ] Expand COLORS with opacity variants
- [ ] Create TYPOGRAPHY scale in theme.ts
- [ ] Create SPACING scale in theme.ts
- [ ] Fix hardcoded 'FamiljenGrotesk' references (6 files)
- [ ] Fix hardcoded hex colors

### Phase 2: Components (Week 2)
- [ ] Create SearchBar component
- [ ] Create DropdownMenu component
- [ ] Create LoadingState, EmptyState, ErrorState components
- [ ] Create SortPillButton component
- [ ] Create PlayCountBadge component

### Phase 3: Migration (Week 3)
- [ ] Migrate HomeScreen to use shared components
- [ ] Migrate FavoritesScreen to use shared components
- [ ] Migrate remaining screens
- [ ] Update all typography to use TYPOGRAPHY scale
- [ ] Update all spacing to use SPACING scale

### Phase 4: Polish (Week 4)
- [ ] Add skeleton loaders for lists
- [ ] Add haptic feedback to interactions
- [ ] Implement pull-to-refresh where appropriate
- [ ] Audit and fix any remaining inconsistencies

---

## 7. Files Requiring Updates

### High Priority (Foundation)
- `src/constants/theme.ts` - Add TYPOGRAPHY, SPACING, new COLORS
- `src/navigation/AppNavigator.tsx` - Fix hardcoded font family
- `src/screens/SOTDScreen.tsx` - Fix hardcoded font family
- `src/components/FullPlayer.tsx` - Fix hardcoded #121212

### Medium Priority (New Components)
- `src/components/SearchBar.tsx` - NEW
- `src/components/DropdownMenu.tsx` - NEW
- `src/components/StateViews.tsx` - NEW (Loading, Empty, Error)
- `src/components/SortPillButton.tsx` - NEW
- `src/components/PlayCountBadge.tsx` - NEW

### Lower Priority (Migration)
- All screen files to use new shared components
- All component files to use TYPOGRAPHY and SPACING

---

## Summary of Findings

| Category | Issues Found | Priority |
|----------|--------------|----------|
| Typography | 15 font sizes, inconsistent weights, hardcoded fonts | HIGH |
| Colors | 30+ hardcoded rgba values, missing opacity variants | HIGH |
| Components | 6 patterns duplicated across 4+ files each | HIGH |
| Spacing | No formal scale, inconsistent values | MEDIUM |
| UX | Empty states, loading states, search experience | MEDIUM |

**Total estimated code reduction:** 400-500 lines through component consolidation
**Maintenance improvement:** Significant - single source of truth for styles and components
