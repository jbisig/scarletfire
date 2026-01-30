# Shuffle Play Feature

## Overview
"Shuffle Play" feature for the Favorites tab with redesigned search/sort bar.

**Status**: ✅ Completed

---

## UI Design

### Default State
```
[🔀 Shuffle] [🔍 Search] [↓ Sort]
```

### Expanded Search State
```
[🔍 Search input...                    ✕]
```

---

## Implementation

### Shuffle Logic by Tab

**Shows Tab:**
1. Pick random show from favorites
2. Fetch show details, load all tracks
3. When show ends → pick another random show

**Songs Tab:**
1. Shuffle all favorite songs
2. Play songs in shuffled order
3. When queue exhausted → reshuffle

### Files Modified

| File | Changes |
|------|---------|
| `src/screens/FavoritesScreen.tsx` | UI redesign, shuffle handler |
| `src/contexts/PlayerContext.tsx` | Shuffle mode, queue management |
| `src/utils/shuffle.ts` | Fisher-Yates utility |

---

## PlayerContext State

```typescript
playbackMode: 'show' | 'radio' | 'shuffle'
shuffleQueue: FavoriteSong[] | GratefulDeadShow[]
shuffleQueueIndex: number
shuffleType: 'shows' | 'songs'
```
