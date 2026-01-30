# IMPLEMENTATION PLAN
## Based on CODE_REVIEW.md Recommendations

**Created:** January 29, 2026
**Priority:** Critical issues first, then major, then ongoing

---

## PHASE 1: CRITICAL FIXES (Immediate Priority)

These 5 issues should be addressed before any other work.

---

### 1.1 Add Error Boundary to App.tsx
**Issue:** 6.3 - No Error Boundary Covering App
**Files:** `App.tsx`

**Tasks:**
- [ ] Import existing ErrorBoundary component
- [ ] Wrap root provider tree with ErrorBoundary
- [ ] Add inner ErrorBoundary around AppNavigator for granular recovery

**Implementation:**
```typescript
// App.tsx
import { ErrorBoundary } from './src/components/ErrorBoundary';

return (
  <ErrorBoundary>
    <SafeAreaProvider>
      <AuthProvider>
        <ShowsProvider>
          <FavoritesProvider>
            <PlayCountsProvider>
              <PlayerProvider>
                <ErrorBoundary>
                  <AppNavigator />
                </ErrorBoundary>
              </PlayerProvider>
            </PlayCountsProvider>
          </FavoritesProvider>
        </ShowsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  </ErrorBoundary>
);
```

---

### 1.2 Fix AuthContext Silent Failures
**Issue:** 6.1 - Silent Failures in Critical Paths
**Files:** `src/contexts/AuthContext.tsx`

**Tasks:**
- [ ] Add error state to AuthContext
- [ ] When auth check times out, set error state instead of silently proceeding
- [ ] Display warning to user when auth check fails
- [ ] Add retry mechanism for failed auth checks

**Implementation:**
```typescript
// Add to AuthState interface
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;  // NEW
}

// In timeout handler
const timeoutId = setTimeout(() => {
  if (!hasResolved) {
    hasResolved = true;
    dispatch({
      type: 'SET_ERROR',
      error: 'Authentication check timed out. Some features may be unavailable.'
    });
    dispatch({ type: 'SET_INITIALIZED' });
  }
}, 5000);
```

---

### 1.3 Fix FullPlayer Excessive Re-renders
**Issue:** 2.1 - Excessive Re-renders in FullPlayer
**Files:** `src/components/FullPlayer.tsx`

**Tasks:**
- [ ] Remove `timeDisplay` state - use ref instead
- [ ] Create separate time display component that reads from ref
- [ ] Use `requestAnimationFrame` or throttled updates for time display
- [ ] Ensure refs are stable and don't recreate on state changes

**Implementation:**
```typescript
// Use ref instead of state for time display
const timeDisplayRef = useRef({ position: 0, duration: 0 });
const [, forceTimeUpdate] = useState(0);

useEffect(() => {
  if (!visible) return;
  const interval = setInterval(() => {
    const prev = timeDisplayRef.current;
    const next = { ...progressRef.current };
    // Only force re-render if values changed significantly (>1s)
    if (Math.abs(next.position - prev.position) >= 1) {
      timeDisplayRef.current = next;
      forceTimeUpdate(n => n + 1);
    }
  }, 1000);
  return () => clearInterval(interval);
}, [visible]);
```

---

### 1.4 Fix PlayerContext Multiple Sources of Truth
**Issue:** 3.1 - Multiple Sources of Truth for Playback State
**Files:** `src/contexts/PlayerContext.tsx`

**Tasks:**
- [ ] Create single source of truth for playback state
- [ ] Native module emits events, context updates from events only
- [ ] Remove duplicate state tracking
- [ ] Implement optimistic updates for seek operations
- [ ] Add error recovery mechanism when sync fails

**Implementation:**
```typescript
// Define clear state flow:
// 1. Native module is source of truth for playback position/state
// 2. React state tracks UI-relevant data (current track, show)
// 3. Refs track transient state (progress for animations)

// Remove conflicting state sources
// Keep: progressRef for animation
// Keep: state.currentTrack for UI
// Remove: duplicate tracking in radioQueue that mirrors native

// Add optimistic seek:
const seekTo = useCallback(async (position: number) => {
  // Optimistically update progress
  progressRef.current.position = position;
  // Then sync to native
  await AudioPlayerModule.seekTo(position);
}, []);
```

---

### 1.5 Fix AudioPlayerModule Queue Rebuild Race Condition
**Issue:** 11.1 - Race Condition in Queue Management
**Files:** `ios/Scarletfire/AudioPlayerModule.swift`

**Tasks:**
- [ ] Add synchronization lock during queue rebuild
- [ ] Store playback state before rebuild
- [ ] Restore state atomically after rebuild completes
- [ ] Add flag to prevent playback state changes during rebuild

**Implementation:**
```swift
private var isRebuildingQueue = false

private func rebuildQueueFromCurrentIndex() {
    guard !isRebuildingQueue else { return }
    isRebuildingQueue = true

    // Capture state atomically
    let wasPlaying = player?.rate ?? 0 > 0
    let currentPosition = player?.currentTime() ?? .zero

    // Pause during rebuild
    player?.pause()

    // ... rebuild queue ...

    // Restore state atomically
    DispatchQueue.main.async { [weak self] in
        guard let self = self else { return }
        if wasPlaying {
            self.player?.play()
        }
        self.isRebuildingQueue = false
    }
}
```

---

## PHASE 2: MAJOR FIXES (Next Sprint)

Organized by impact and effort.

---

### 2.1 Performance Optimizations

#### 2.1.1 Implement Fuzzy Match Caching
**Issue:** 4.2 - RadioService Levenshtein Distance Recalculation
**Files:** `src/services/radioService.ts`

**Tasks:**
- [ ] Add similarity cache Map to RadioService
- [ ] Cache Levenshtein calculations by normalized key
- [ ] Clear cache when service resets or grows too large (>10000 entries)

---

#### 2.1.2 Add FlatList Virtualization
**Issue:** 4.3 - No List Virtualization
**Files:** `src/screens/shows/ShowsScreen.tsx`, `src/screens/classics/ClassicsScreen.tsx`, `src/screens/favorites/FavoritesScreen.tsx`

**Tasks:**
- [ ] Add optimization props to all FlatList components
- [ ] Implement `getItemLayout` for fixed-height items
- [ ] Add `keyExtractor` based on stable identifiers

**Props to add:**
```typescript
removeClippedSubviews={true}
maxToRenderPerBatch={15}
updateCellsBatchingPeriod={50}
initialNumToRender={15}
windowSize={10}
```

---

#### 2.1.3 Optimize Video Component
**Issue:** 4.4 - Video Component Always Playing
**Files:** `src/components/FullPlayer.tsx`, `src/components/MiniPlayer.tsx`

**Tasks:**
- [ ] Track app state (active/background) using AppState API
- [ ] Only play video when visible AND app is active
- [ ] Pause video when FullPlayer is dismissed
- [ ] Add `isMuted={true}` explicitly

---

#### 2.1.4 Fix ShowsContext Cache Inefficiency
**Issue:** 4.1 - Inefficient Show Loading Logic
**Files:** `src/contexts/ShowsContext.tsx`

**Tasks:**
- [ ] Change showDetailsCache from useState to useRef
- [ ] Remove showDetailsCache from useCallback dependencies
- [ ] Ensure getShowDetail callback is stable (empty deps array)

---

#### 2.1.5 Optimize PlayCountsContext Calculations
**Issue:** 4.5 - Missing useMemo for Expensive Calculations
**Files:** `src/contexts/PlayCountsContext.tsx`

**Tasks:**
- [ ] Add memoization for getShowPlayCount results
- [ ] Pre-compute play counts when playCountsMap changes
- [ ] Use Map for O(1) lookups of cached results

---

### 2.2 Error Handling Improvements

#### 2.2.1 Fix Silent Error Catches
**Issue:** 6.2 - Unhandled Promise Rejections
**Files:** `src/contexts/FavoritesContext.tsx`

**Tasks:**
- [ ] Replace all `.catch(() => {})` with proper error logging
- [ ] Implement exponential backoff retry for cloud sync
- [ ] Add sync status indicator (syncing/synced/error)
- [ ] Queue failed syncs for retry when connection restored

---

#### 2.2.2 Implement API Retry Logic
**Issue:** 6.4 - Archive API Timeout Handling
**Files:** `src/services/archiveApi.ts`

**Tasks:**
- [ ] Create `fetchWithRetry` method with exponential backoff
- [ ] Add max retry count (3)
- [ ] Log retry attempts for debugging
- [ ] Return user-friendly error messages

---

#### 2.2.3 Add Radio Replenish Error Recovery
**Issue:** 11.2 - No Error Recovery in Radio Replenish
**Files:** `src/contexts/PlayerContext.tsx`

**Tasks:**
- [ ] Add retry logic with exponential backoff for fetchMoreRadioTracks
- [ ] Set max retry count (3)
- [ ] Notify user if radio queue cannot be replenished
- [ ] Add fallback behavior (stop radio, show error message)

---

### 2.3 Code Quality Improvements

#### 2.3.1 Extract Common Player Hooks
**Issue:** 2.3 - MiniPlayer and FullPlayer Code Duplication
**Files:** New file `src/hooks/usePerformanceRating.ts`, `src/hooks/usePlayCountForTrack.ts`

**Tasks:**
- [ ] Create `usePerformanceRating` hook with shared logic
- [ ] Create `usePlayCountForTrack` hook
- [ ] Create `useVideoBackground` hook for video URL fetching
- [ ] Refactor FullPlayer and MiniPlayer to use these hooks

---

#### 2.3.2 Consolidate Title Normalization
**Issue:** 5.1 - Normalization Logic Duplicated
**Files:** New file `src/utils/titleNormalization.ts`, `src/services/archiveApi.ts`, `src/services/radioService.ts`

**Tasks:**
- [ ] Create `src/utils/titleNormalization.ts`
- [ ] Export `normalizeTrackTitle`, `normalizeSongTitle`, `normalizeForComparison`
- [ ] Update archiveApi.ts to use shared utilities
- [ ] Update radioService.ts to use shared utilities

---

#### 2.3.3 Fix Context Value Recreation
**Issue:** 3.2 - Context Value Recreation Every Render
**Files:** `src/contexts/PlayerContext.tsx`

**Tasks:**
- [ ] Wrap context value in useMemo
- [ ] Include all callbacks in dependency array
- [ ] Verify all callbacks are stable (use useCallback with proper deps)

---

### 2.4 Type Safety Improvements

#### 2.4.1 Fix authService Type Cast
**Issue:** 7.1 - Unsafe Type Casts in Services
**Files:** `src/services/authService.ts`

**Tasks:**
- [ ] Change `getCurrentUser` to async function
- [ ] Return `Promise<User | null>` instead of using `as any`
- [ ] Update all callers to await the result

---

#### 2.4.2 Add Archive API Response Validation
**Issue:** 7.2 - Loose Typing in Archive API Response
**Files:** `src/services/archiveApi.ts`

**Tasks:**
- [ ] Define `ArchiveFile` interface
- [ ] Add runtime validation in `selectAudioFiles`
- [ ] Filter out invalid file objects before processing

---

### 2.5 Memory Management

#### 2.5.1 Consolidate Progress Listeners
**Issue:** 10.1 - Potential Memory Leak in PlayerContext
**Files:** `src/contexts/PlayerContext.tsx`

**Tasks:**
- [ ] Identify both progress listeners (lines ~430 and ~469)
- [ ] Consolidate into single listener
- [ ] Handle both progress update and threshold checking in one callback

---

#### 2.5.2 Fix VideoDownloadService Cleanup
**Issue:** 10.2 - VideoDownloadService Listeners Not Cleaned Up
**Files:** `src/services/videoDownloadService.ts`, new hook `src/hooks/useVideoDownload.ts`

**Tasks:**
- [ ] Create `useVideoDownload` hook that handles cleanup automatically
- [ ] Track active listeners with WeakRef or cleanup registry
- [ ] Ensure cleanup on component unmount

---

### 2.6 API/Services Layer

#### 2.6.1 Fix Cache TTL for Show Details
**Issue:** 8.2 - Cache TTL Not Enforced Properly
**Files:** `src/services/archiveApi.ts`

**Tasks:**
- [ ] Always check cache first in `getShowDetail`
- [ ] Separate version fetching from cached show detail
- [ ] Return cached data immediately, fetch versions separately if needed

---

### 2.7 Styling Consolidation

#### 2.7.1 Replace Hardcoded Colors
**Issue:** 9.1 - Hardcoded Colors Throughout
**Files:** Multiple component files

**Tasks:**
- [ ] Search for hardcoded hex colors: `#121212`, `#191919`, `#333`, `#AEAEAE`, `#E54C4F`
- [ ] Replace with COLORS constants
- [ ] Add any missing colors to theme.ts

---

#### 2.7.2 Create Shared Styles
**Issue:** 9.2 - StyleSheet Duplication
**Files:** New file `src/constants/componentStyles.ts`

**Tasks:**
- [ ] Create `CommonStyles` object with shared styles
- [ ] Include progress bar styles, text styles, button styles
- [ ] Refactor FullPlayer and MiniPlayer to use common styles

---

### 2.8 FavoritesContext Sync Improvements
**Issue:** 3.3 - FavoritesContext Sync Conflicts
**Files:** `src/contexts/FavoritesContext.tsx`

**Tasks:**
- [ ] Add `savedAt` timestamp to favorites
- [ ] Add optional `deletedAt` for soft deletes
- [ ] Implement timestamp-based merge in `mergeFavorites`
- [ ] Honor deletions that occurred after cloud save

---

### 2.9 ShowCard Prop Drilling
**Issue:** 2.2 - Prop Drilling in Show Card Chain
**Files:** `src/components/ShowCard.tsx`, parent components

**Tasks:**
- [ ] Pre-compute playCount and rating in parent
- [ ] Pass as props instead of using hooks in ShowCard
- [ ] Remove override props pattern
- [ ] Consider using React context selector pattern for performance

---

## PHASE 3: ONGOING IMPROVEMENTS

These can be addressed incrementally over time.

---

### 3.1 Extract Magic Numbers
**Issue:** 12.1 - Magic Numbers Throughout
**Files:** Multiple, new file `src/constants/thresholds.ts`

**Tasks:**
- [ ] Create `src/constants/thresholds.ts`
- [ ] Extract: DISMISS_THRESHOLD, VELOCITY_THRESHOLD, SIMILARITY_THRESHOLD, PREFETCH_COUNT
- [ ] Add JSDoc comments explaining each threshold
- [ ] Update all usages across codebase

---

### 3.2 Environment Variable Validation
**Issue:** 12.2 - Environment Variable Access Pattern
**Files:** `src/constants/config.ts`

**Tasks:**
- [ ] Add validation function that throws if required config missing
- [ ] Call validation at app startup
- [ ] Provide clear error messages for missing config

---

### 3.3 Constants Registry
**Issue:** 1.2 - Missing Type Safety in Constants
**Files:** New file `src/constants/registry.ts`

**Tasks:**
- [ ] Create centralized constants registry
- [ ] Include STORAGE_KEYS, EVENT_NAMES, CACHE_KEYS
- [ ] Use `as const` for type safety
- [ ] Deprecate scattered magic strings

---

### 3.4 Create Error Handling Utility
**Issue:** 5.2 - Error Handling Boilerplate Repeated
**Files:** New file `src/utils/apiError.ts`

**Tasks:**
- [ ] Create `ApiError` class with context
- [ ] Create `withErrorHandling` wrapper
- [ ] Refactor services to use wrapper

---

### 3.5 Request Deduplication
**Issue:** 8.1 - No Request/Response Interceptors
**Files:** `src/services/archiveApi.ts`

**Tasks:**
- [ ] Add in-flight request Map
- [ ] Return existing promise if same request in progress
- [ ] Clear from map when request completes

---

## PHASE 4: PRODUCTION READINESS

To be addressed before production deployment.

---

### 4.1 Error Tracking
- [ ] Set up Sentry or Bugsnag
- [ ] Configure source maps for readable stack traces
- [ ] Add breadcrumbs for debugging
- [ ] Set up alert thresholds

### 4.2 Analytics
- [ ] Choose analytics provider (Amplitude, Mixpanel, etc.)
- [ ] Track key user flows (play, favorite, radio)
- [ ] Add performance metrics (app startup, screen load)

### 4.3 Testing
- [ ] Add unit tests for critical paths:
  - [ ] Auth flow
  - [ ] Player state transitions
  - [ ] Favorites sync
  - [ ] Radio queue management
- [ ] Add integration tests for API layer
- [ ] Set up CI/CD with test gates

### 4.4 Documentation
- [ ] Create Architecture Decision Records (ADR)
- [ ] Document state management patterns
- [ ] Document native module interface

### 4.5 Code Quality Gates
- [ ] Configure ESLint to error on `as any`
- [ ] Add TypeScript strict mode
- [ ] Set up pre-commit hooks for linting

---

## IMPLEMENTATION ORDER CHECKLIST

### Week 1: Critical Fixes
- [x] 1.1 Add Error Boundary to App.tsx ✓
- [x] 1.2 Fix AuthContext Silent Failures ✓
- [x] 1.3 Fix FullPlayer Excessive Re-renders ✓
- [x] 1.4 Fix PlayerContext Multiple Sources of Truth (consolidated progress listeners) ✓
- [x] 1.5 Fix AudioPlayerModule Queue Rebuild Race Condition ✓

### Week 2-3: Performance
- [x] 2.1.1 Implement Fuzzy Match Caching ✓
- [x] 2.1.2 Add FlatList Virtualization ✓
- [x] 2.1.3 Optimize Video Component ✓
- [ ] 2.1.4 Fix ShowsContext Cache Inefficiency
- [ ] 2.1.5 Optimize PlayCountsContext Calculations

### Week 3-4: Error Handling & Code Quality
- [x] 2.2.1 Fix Silent Error Catches ✓
- [x] 2.2.2 Implement API Retry Logic ✓
- [ ] 2.2.3 Add Radio Replenish Error Recovery
- [x] 2.3.1 Extract Common Player Hooks ✓
- [ ] 2.3.2 Consolidate Title Normalization
- [ ] 2.3.3 Fix Context Value Recreation

### Week 4-5: Type Safety & Memory
- [ ] 2.4.1 Fix authService Type Cast
- [ ] 2.4.2 Add Archive API Response Validation
- [ ] 2.5.1 Consolidate Progress Listeners
- [ ] 2.5.2 Fix VideoDownloadService Cleanup

### Week 5-6: API & Styling
- [ ] 2.6.1 Fix Cache TTL for Show Details
- [ ] 2.7.1 Replace Hardcoded Colors
- [ ] 2.7.2 Create Shared Styles
- [ ] 2.8 FavoritesContext Sync Improvements
- [ ] 2.9 ShowCard Prop Drilling

### Ongoing
- [ ] 3.1 Extract Magic Numbers
- [ ] 3.2 Environment Variable Validation
- [ ] 3.3 Constants Registry
- [ ] 3.4 Create Error Handling Utility
- [ ] 3.5 Request Deduplication

### Pre-Production
- [ ] 4.1 Error Tracking (Sentry)
- [ ] 4.2 Analytics
- [ ] 4.3 Testing
- [ ] 4.4 Documentation
- [ ] 4.5 Code Quality Gates

---

## NOTES

- Each task should be a separate commit for easy rollback
- Critical fixes (Phase 1) should be tested thoroughly before moving to Phase 2
- Consider feature flags for major changes to enable gradual rollout
- Performance improvements in Phase 2 should be measured before/after
