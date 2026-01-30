# Phase 1 Ratings Tracking & Reversibility

## Overview

The Phase 1 rating system includes comprehensive tracking to ensure all changes are reversible and auditable.

## What Gets Tracked

### 1. Backups
Every time you apply Phase 1 ratings, a timestamped backup is created:
- **Location**: `scripts/backups/`
- **Format**: `songs.generated.before-phase1-YYYY-MM-DDTHH-MM-SS.ts`
- **Purpose**: Full snapshot of songs.generated.ts before any changes

### 2. Applied Ratings Log
A detailed log of exactly what was changed:
- **Location**: `src/data/phase1RatingsApplied.json`
- **Contains**:
  - Timestamp of when ratings were applied
  - Path to the backup file
  - List of every rating added (song, date, identifier, rating value)
  - Summary statistics

**Example log structure**:
```json
{
  "appliedAt": "2026-01-18T20:30:00.000Z",
  "backupPath": "scripts/backups/songs.generated.before-phase1-2026-01-18T20-30-00.ts",
  "ratingsApplied": [
    {
      "songTitle": "He's Gone",
      "date": "1972-10-09",
      "identifier": "gd72-10-09.sbd.vernon.5249.sbeok.shnf",
      "rating": 1,
      "appliedAt": "2026-01-18T20:30:00.000Z"
    },
    // ... more ratings
  ],
  "summary": {
    "totalApplied": 289,
    "source": "Phase 1 Collection"
  }
}
```

## How to Use

### Apply Phase 1 Ratings
```bash
node scripts/applyPhase1Ratings.js
```

**What happens:**
1. ✅ Creates backup in `scripts/backups/`
2. ✅ Checks if ratings already exist (prevents duplicates)
3. ✅ Adds ratings to songs.generated.ts
4. ✅ Creates detailed log in `src/data/phase1RatingsApplied.json`
5. ✅ Shows summary of what was applied

### Revert Phase 1 Ratings
```bash
node scripts/revertPhase1Ratings.js
```

**What happens:**
1. ✅ Reads the applied ratings log
2. ✅ Creates backup of current state (before reverting)
3. ✅ Restores songs.generated.ts from original backup
4. ✅ Archives the applied log (keeps history)
5. ✅ Shows summary of what was removed

**Safety Features**:
- Creates backup before reverting (can undo the undo!)
- Validates backup exists before proceeding
- Keeps archived logs for audit trail

### Re-apply After Revert
If you revert and want to re-apply:
```bash
node scripts/applyPhase1Ratings.js
```

The script creates a fresh backup and log each time.

## File Structure

```
scripts/
├── applyPhase1Ratings.js        # Apply ratings + create tracking
├── revertPhase1Ratings.js       # Revert ratings from backup
├── backups/                     # Timestamped backups
│   ├── songs.generated.before-phase1-2026-01-18T20-30-00.ts
│   ├── songs.generated.before-revert-2026-01-18T21-00-00.ts
│   └── ...

src/data/
├── phase1RatingsToCollect.json  # Input: performances to rate
├── phase1RatingsApplied.json    # Log: what was applied (current)
└── phase1RatingsApplied-reverted-2026-01-18T21-00-00.json  # Archived logs
```

## Safety Guarantees

### 1. Duplicate Prevention
The apply script checks if a rating already exists before adding it:
```javascript
const alreadyHasRating = outputLines.slice(-5).some(l => l.includes('rating:'));
if (!alreadyHasRating) {
  // Only add if missing
}
```

### 2. Idempotency
You can run `applyPhase1Ratings.js` multiple times safely:
- Already-applied ratings won't be duplicated
- New ratings (if you add more to the JSON) will be applied

### 3. Full Audit Trail
Every action is logged with timestamps:
- When ratings were applied
- What ratings were applied
- Where the backup is stored
- When ratings were reverted

### 4. Multiple Backups
Backups are created:
- Before applying ratings
- Before reverting ratings
- Never overwritten (timestamped)

## Example Workflow

### Initial Application
```bash
# 1. Fill in ratings in phase1RatingsToCollect.json
# 2. Apply them
node scripts/applyPhase1Ratings.js

# Output:
# 💾 Backup created: scripts/backups/songs.generated.before-phase1-2026-01-18T20-30-00.ts
# ✅ Applied 289 new ratings
# 📋 Applied ratings log: src/data/phase1RatingsApplied.json
# ♻️  To revert these changes, run: node scripts/revertPhase1Ratings.js
```

### Need to Make Changes?
```bash
# Revert first
node scripts/revertPhase1Ratings.js

# Output:
# ✅ Restored songs.generated.ts from backup
# 📂 Archived applied ratings log
# 🎉 Phase 1 ratings have been reverted!

# Edit ratings in phase1RatingsToCollect.json
# Re-apply
node scripts/applyPhase1Ratings.js
```

### Check What Was Applied
```bash
# View the log
cat src/data/phase1RatingsApplied.json | jq '.summary'

# Output:
# {
#   "totalApplied": 289,
#   "source": "Phase 1 Collection"
# }
```

## Troubleshooting

### "Backup file not found" Error
If revert fails because backup is missing:
1. Check `scripts/backups/` directory
2. Manually restore from any backup file
3. Or re-run enrichment: `node scripts/enrichSongsWithRatings.js`

### Want to Keep Some Ratings
If you want to revert but keep certain ratings:
1. Note which ones you want to keep
2. Revert: `node scripts/revertPhase1Ratings.js`
3. Edit `phase1RatingsToCollect.json` to only include desired ratings
4. Re-apply: `node scripts/applyPhase1Ratings.js`

### Multiple Apply Attempts
Safe! The script checks for existing ratings and won't duplicate them.

## Benefits

✅ **Complete Reversibility** - One command to undo everything
✅ **Audit Trail** - Know exactly what changed and when
✅ **Safety** - Multiple backups prevent data loss
✅ **Flexibility** - Easy to iterate on ratings
✅ **Transparency** - JSON logs are human-readable
✅ **No Side Effects** - Other ratings remain untouched
