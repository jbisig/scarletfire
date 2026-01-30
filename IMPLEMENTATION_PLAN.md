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

#### 2.1.1 Implement Fuzzy Match Caching ✅ COMPLETED
**Issue:** 4.2 - RadioService Levenshtein Distance Recalculation
**Files:** `src/services/radioService.ts`

**Tasks:**
- [x] Add similarity cache Map to RadioService
- [x] Cache Levenshtein calculations by normalized key
- [x] Clear cache when service resets or grows too large (>10000 entries)

---

#### 2.1.2 Add FlatList Virtualization ⏳ IN PROGRESS
**Issue:** 4.3 - No List Virtualization
**Files:** `src/screens/shows/ShowsScreen.tsx`, `src/screens/classics/ClassicsScreen.tsx`, `src/screens/favorites/FavoritesScreen.tsx`

**Tasks:**
- [x] Add optimization props to GratefulDead101Screen and SongListScreen
- [ ] Add optimization props to remaining FlatList components
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

#### 2.1.3 Optimize Video Component ✅ COMPLETED
**Issue:** 4.4 - Video Component Always Playing
**Files:** `src/components/FullPlayer.tsx`, `src/components/MiniPlayer.tsx`

**Tasks:**
- [x] Track app state (active/background) using AppState API
- [x] Only play video when visible AND app is active
- [x] Pause video when FullPlayer is dismissed
- [x] Add `isMuted={true}` explicitly

---

#### 2.1.4 Fix ShowsContext Cache Inefficiency ✅ COMPLETED
**Issue:** 4.1 - Inefficient Show Loading Logic
**Files:** `src/contexts/ShowsContext.tsx`

**Tasks:**
- [x] Change showDetailsCache from useState to useRef
- [x] Remove showDetailsCache from useCallback dependencies
- [x] Ensure getShowDetail callback is stable (empty deps array)

---

#### 2.1.5 Optimize PlayCountsContext Calculations ✅ COMPLETED
**Issue:** 4.5 - Missing useMemo for Expensive Calculations
**Files:** `src/contexts/PlayCountsContext.tsx`

**Tasks:**
- [x] Add memoization for getShowPlayCount results
- [x] Pre-compute play counts when playCountsMap changes (showPlayCountsIndex)
- [x] Use Map for O(1) lookups of cached results

---

### 2.2 Error Handling Improvements

#### 2.2.1 Fix Silent Error Catches ✅ COMPLETED
**Issue:** 6.2 - Unhandled Promise Rejections
**Files:** `src/contexts/FavoritesContext.tsx`

**Tasks:**
- [x] Replace all `.catch(() => {})` with proper error logging
- [ ] Implement exponential backoff retry for cloud sync (deferred)
- [ ] Add sync status indicator (syncing/synced/error) (deferred)
- [ ] Queue failed syncs for retry when connection restored (deferred)

---

#### 2.2.2 Implement API Retry Logic ✅ COMPLETED
**Issue:** 6.4 - Archive API Timeout Handling
**Files:** `src/services/archiveApi.ts`

**Tasks:**
- [x] Create `fetchWithRetry` method with exponential backoff
- [x] Add max retry count (3)
- [x] Log retry attempts for debugging
- [x] Return user-friendly error messages

---

#### 2.2.3 Add Radio Replenish Error Recovery ✅ COMPLETED
**Issue:** 11.2 - No Error Recovery in Radio Replenish
**Files:** `src/contexts/PlayerContext.tsx`

**Tasks:**
- [x] Add retry logic with exponential backoff for fetchMoreRadioTracks
- [x] Set max retry count (3)
- [ ] Notify user if radio queue cannot be replenished (deferred - graceful degradation instead)
- [x] Add fallback behavior (continues with remaining tracks)

---

### 2.3 Code Quality Improvements

#### 2.3.1 Extract Common Player Hooks ✅ COMPLETED
**Issue:** 2.3 - MiniPlayer and FullPlayer Code Duplication
**Files:** New file `src/hooks/usePerformanceRating.ts`, `src/hooks/usePlayCountForTrack.ts`

**Tasks:**
- [x] Create `usePerformanceRating` hook with shared logic
- [ ] Create `usePlayCountForTrack` hook (deferred - inline is sufficient)
- [ ] Create `useVideoBackground` hook for video URL fetching (deferred - already exists in VideoBackgroundContext)
- [x] Refactor FullPlayer and MiniPlayer to use these hooks

---

#### 2.3.2 Consolidate Title Normalization ✅ COMPLETED
**Issue:** 5.1 - Normalization Logic Duplicated
**Files:** New file `src/utils/titleNormalization.ts`, `src/services/archiveApi.ts`, `src/services/radioService.ts`

**Tasks:**
- [x] Create `src/utils/titleNormalization.ts`
- [x] Export `normalizeTrackTitle`, `normalizeSongTitle`, `normalizeForComparison`, `normalizeHeadyVersionTitle`
- [x] Update archiveApi.ts to use shared utilities
- [x] Update radioService.ts to use shared utilities

---

#### 2.3.3 Fix Context Value Recreation ✅ COMPLETED
**Issue:** 3.2 - Context Value Recreation Every Render
**Files:** `src/contexts/PlayerContext.tsx`

**Tasks:**
- [x] Wrap context value in useMemo
- [x] Include all callbacks in dependency array
- [x] Verify all callbacks are stable (use useCallback with proper deps)

---

### 2.4 Type Safety Improvements

#### 2.4.1 Fix authService Type Cast ✅ COMPLETED
**Issue:** 7.1 - Unsafe Type Casts in Services
**Files:** `src/services/authService.ts`

**Tasks:**
- [x] Change `getCurrentUser` to async function
- [x] Return `Promise<User | null>` instead of using `as any`
- [x] Update all callers to await the result (no callers found)

---

#### 2.4.2 Add Archive API Response Validation ✅ COMPLETED
**Issue:** 7.2 - Loose Typing in Archive API Response
**Files:** `src/services/archiveApi.ts`

**Tasks:**
- [x] Define `ArchiveFile` interface (already existed in types)
- [x] Add runtime validation in `selectAudioFiles` (isValidAudioFile helper)
- [x] Filter out invalid file objects before processing

---

### 2.5 Memory Management

#### 2.5.1 Consolidate Progress Listeners ✅ COMPLETED
**Issue:** 10.1 - Potential Memory Leak in PlayerContext
**Files:** `src/contexts/PlayerContext.tsx`

**Tasks:**
- [x] Identify both progress listeners (lines ~430 and ~469)
- [x] Consolidate into single listener
- [x] Handle both progress update and threshold checking in one callback

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

#### 2.7.1 Replace Hardcoded Colors ✅ COMPLETED
**Issue:** 9.1 - Hardcoded Colors Throughout
**Files:** Multiple component files

**Tasks:**
- [x] Search for hardcoded hex colors: `#121212`, `#191919`, `#333`, `#AEAEAE`, `#E54C4F`
- [x] Replace with COLORS constants in key files
- [x] Add missing colors to theme.ts (textTertiary, backgroundSecondary)
- [x] Complete replacement in most files (remaining are branded colors like Spotify/Apple)

---

#### 2.7.2 Create Shared Styles ✅ COMPLETED
**Issue:** 9.2 - StyleSheet Duplication
**Files:** New file `src/constants/componentStyles.ts`

**Tasks:**
- [x] Create shared styles with ProgressBarStyles, TextStyles, BadgeStyles, ButtonStyles, ContainerStyles
- [x] Include progress bar styles (background, fill, thumb)
- [x] Include text styles (trackTitle, showInfo, timeText)
- [x] Components can be refactored incrementally to use these shared styles

---

### 2.8 FavoritesContext Sync Improvements ⏳ PARTIAL
**Issue:** 3.3 - FavoritesContext Sync Conflicts
**Files:** `src/contexts/FavoritesContext.tsx`

**Tasks:**
- [x] Add `savedAt` timestamp to favorites (already implemented)
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

### 3.1 Extract Magic Numbers ✅ COMPLETED
**Issue:** 12.1 - Magic Numbers Throughout
**Files:** Multiple, new file `src/constants/thresholds.ts`

**Tasks:**
- [x] Create `src/constants/thresholds.ts`
- [x] Extract: DISMISS_THRESHOLD, VELOCITY_THRESHOLD, SIMILARITY_THRESHOLD, PREFETCH_COUNT
- [x] Add JSDoc comments explaining each threshold
- [x] Update FullPlayer and OfficialReleaseModal to use shared constants
- [x] Update remaining usages (radioService, SongPerformancesScreen)

---

### 3.2 Environment Variable Validation ✅ COMPLETED
**Issue:** 12.2 - Environment Variable Access Pattern
**Files:** `src/constants/config.ts`, `App.tsx`

**Tasks:**
- [x] Add validation function that throws if required config missing (in dev mode)
- [x] Call validation at app startup
- [x] Provide clear error messages for missing config

---

### 3.3 Constants Registry ✅ COMPLETED
**Issue:** 1.2 - Missing Type Safety in Constants
**Files:** New file `src/constants/registry.ts`, contexts

**Tasks:**
- [x] Create centralized constants registry
- [x] Include STORAGE_KEYS, CACHE_KEYS, SUPABASE_TABLES
- [x] Use `as const` for type safety
- [x] Update AuthContext, FavoritesContext, PlayCountsContext to use centralized keys

---

### 3.4 Create Error Handling Utility ✅ COMPLETED
**Issue:** 5.2 - Error Handling Boilerplate Repeated
**Files:** New file `src/utils/apiError.ts`

**Tasks:**
- [x] Create `ApiError` class with context, timestamp, and original error
- [x] Create `withErrorHandling` wrapper for async functions
- [x] Create `createErrorHandler` factory for per-service handlers
- [x] Add `isApiError` type guard and `getErrorMessage` helper

---

### 3.5 Request Deduplication ✅ COMPLETED
**Issue:** 8.1 - No Request/Response Interceptors
**Files:** `src/services/archiveApi.ts`

**Tasks:**
- [x] Add in-flight request Map (inFlightRequests)
- [x] Return existing promise if same request in progress (fetchWithDedup)
- [x] Clear from map when request completes

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
- [x] 3.1 Extract Magic Numbers ✓
- [x] 3.2 Environment Variable Validation ✓
- [x] 3.3 Constants Registry ✓
- [x] 3.4 Create Error Handling Utility ✓
- [x] 3.5 Request Deduplication ✓

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
