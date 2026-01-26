# Phase 1 Implementation Complete ✅

## What Was Done

### 1. Title Case Conversion ✓
All song titles and venues are now in proper Title Case:
- **Before**: "china cat sunflower > i know you rider"
- **After**: "China Cat Sunflower > I Know You Rider"

### 2. Phase 1 Rating Collection System ✓
Created a smart system to collect ratings for songs with zero ratings.

**Target**: 20 critical songs with NO current ratings
**Performances Selected**: 289 total (avg 14.4 per song)

#### Songs Included (Top 20 by performance count):
1. He's Gone (318 total performances, 15 selected)
2. Uncle Johns Band (307 total, 15 selected)
3. Don't Ease Me In (289 total, 15 selected)
4. Goin' Down the Road Feeling Bad (256 total, 15 selected)
5. Franklin's Tower (219 total, 15 selected)
6. The Promised Land (218 total, 15 selected)
7. Jam (217 total, 15 selected)
8. Dancin' in the Streets (103 total, 15 selected)
9. Lazy Lightning (90 total, 15 selected)
10. Slipknot! (90 total, 15 selected)
11. Dupree's Diamond Blues (71 total, 15 selected)
12. The Last Time (68 total, 15 selected)
13. Knockin' on Heaven's Door (66 total, 15 selected)
14. Women Are Smarter (60 total, 15 selected)
15. Smokestack Lightning (56 total, 14 selected)
16. Just Like Tom Thumb's Blues (48 total, 14 selected)
17. Sunshine Daydream (47 total, 14 selected)
18. Death Don't Have No Mercy (42 total, 13 selected)
19. Playing in the Band Reprise (41 total, 13 selected)
20. Doin' That Rag (39 total, 13 selected)

## Selection Criteria

Performances were intelligently selected based on:

- **Golden Era (1972-1977)**: +10 points
- **Classic Era (1968-1974)**: +5 points
- **Legendary Venues**: +5 points
  - Winterland, Fillmore, Barton Hall, Red Rocks, Boston Music Hall, etc.
- **Peak Season (May-August)**: +2 points
- **Year Diversity**: Ensures coverage across their entire career

## How to Use

### Step 1: Review the List
Open the markdown summary to see all performances with direct Archive.org links:
```bash
open src/data/phase1RatingsSummary.md
```

### Step 2: Rate Performances
1. Listen to performances (click "Listen" links in the summary)
2. Rate each one as:
   - **1** = Legendary (best of the best)
   - **2** = Excellent (very good)
   - **3** = Solid (good)

3. Edit the JSON file to add your ratings:
```bash
open src/data/phase1RatingsToCollect.json
```

Example entry:
```json
{
  "date": "1972-10-09",
  "venue": "Winterland Arena",
  "identifier": "gd72-10-09.sbd.vernon.5249.sbeok.shnf",
  "score": 20,
  "rating": 1,  // <-- Add rating here (1, 2, or 3)
  "notes": "Incredible version!"  // <-- Optional notes
}
```

### Step 3: Apply Ratings
Once you've filled in ratings, run:
```bash
node scripts/applyPhase1Ratings.js
```

This will automatically add the ratings to `songs.generated.ts`.

### Step 4: Verify
Run the enrichment script to ensure everything is applied:
```bash
node scripts/enrichSongsWithRatings.js
```

## Files Created

1. **`scripts/generatePhase1Ratings.js`** - Generates the rating collection list
2. **`scripts/applyPhase1Ratings.js`** - Applies filled ratings to songs
3. **`src/data/phase1RatingsToCollect.json`** - Editable JSON with performances to rate
4. **`src/data/phase1RatingsSummary.md`** - Human-readable list with Archive.org links

## Impact

Once Phase 1 is complete:
- **Before**: 136 songs (37.3%) with zero ratings
- **After**: 116 songs (31.8%) with zero ratings
- **New ratings**: ~289 performances rated across critical songs
- **Coverage improvement**: Major classics like "He's Gone", "Uncle Johns Band", "Franklin's Tower" will have 15 rated performances each

## Current Statistics

- **Total songs**: 365
- **Total performances**: 33,370
- **Currently rated**: 1,866 (5.6%)
- **After Phase 1** (est): ~2,155 rated (6.5%)

## Next Phases

**Phase 2**: Improve partially-rated songs (songs with <10% coverage)
**Phase 3**: Deep dive on jam classics (Dark Star, Playing, etc.)
