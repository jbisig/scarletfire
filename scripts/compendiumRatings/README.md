# Compendium ratings pipeline

Turns the prose in `src/data/showNotes.ts` into `src/data/compendiumRatings.ts`:
a quality verdict and a set of song highlights for every one of the 1,554 shows
the Taping Compendium covers.

## What it produces

| | |
|---|---|
| Shows judged | 1,554 (every date in `SHOW_NOTES`) |
| Shows carrying a tier | 269 — 35 × 3-star, 79 × 2-star, 155 × 1-star |
| Shows carrying highlights | 1,496 |
| Song highlights | 4,018 (97.6% resolved to a catalog title) |
| Verbatim quotes | 7,666, every one verified against its note |

## How ratings resolve at read time

`ratingResolver.resolveSystemShowStars` reads
`getClassicTier(date) ?? getCompendiumTier(date)`.

`classicShowsTiers.ts` is multi-source community consensus — tapers' polls,
official releases, the Deadcast — and **always wins**. The Compendium is one
book, so it only fills in shows consensus has no opinion on. Where the two
genuinely disagree the date lands in `CURATED_TIER_DISPUTES` for a human to
look at; nothing is auto-demoted.

## Scoring

Each show gets an evidence score built from what its note actually asserts:

- base: `essential` 4, `excellent` 3, `notable` 2, `ordinary` 1, `poor` 0
- minus for low/medium confidence
- minus 1.0 when the praise is about the **tape** rather than the playing
- minus for caveats (run-not-date ambiguity, incomplete tape, one-song notes…)
- plus up to 1.0 for corroborating standout songs, minus for panned ones
- minus 0.8 when the judge produced no supporting quote at all

Tier cutoffs are then applied to that score: **4.8 / 4.0 / 3.3**.

The score is **absolute, not normalised per era or per batch.** Batch-relative
normalisation was tried and rejected: batches are date-contiguous, so removing
"batch inflation" also removes the real quality gap between eras. It demoted
Cornell '77 to 2 stars while promoting 35 mid-80s shows to 3 stars. Era
differences in the output are a feature — 1977 *should* out-rate 1985.

## Files

| file | role |
|---|---|
| `RUBRIC.md` | the contract given to each judging agent |
| `lib.js` | scoring, tier assignment, and the `compendiumRatings.ts` renderer |
| `recalibrateTiers.js` | retune cutoffs **without re-running any agents** |
| `verifyQuotes.js` | assert every quote is a real substring of its note |

## Retuning the cutoffs

`compendiumRatings.ts` stores each show's verdict, confidence, tape-only flag,
caveat, evidence and highlights, so the score and tier are recomputable from the
file itself. No agents needed.

```sh
node scripts/compendiumRatings/recalibrateTiers.js              # report at current cutoffs
node scripts/compendiumRatings/recalibrateTiers.js 4.6 3.8 3.1  # preview looser cutoffs
node scripts/compendiumRatings/recalibrateTiers.js 4.6 3.8 3.1 --write
npx jest src/data/__tests__/compendiumRatings.test.ts
```

Because evidence is stored for *every* judged show — not just tiered ones —
lowering a cutoff genuinely promotes shows. (An earlier version stored evidence
only on tiered shows, which silently re-applied the no-evidence penalty on
recompute and made 228 shows unpromotable. Don't reintroduce that.)

## Regenerating from scratch

Only needed if `showNotes.ts` itself is regenerated, or the rubric changes.

1. Split `SHOW_NOTES` into ~30 batches of ~165k characters.
2. Run one judging agent per batch against `RUBRIC.md`, each writing a JSON
   array of `{date, verdict, confidence, tapeOnly, evidence, caveat,
   showSummary, highlights}`.
3. Verify every quote is an exact substring of its date's note. **Do not skip
   this** — the whole dataset's credibility rests on it, and unverified model
   output has produced fabricated quotes on this corpus before.
4. Score, assign tiers, and render via `lib.js`.

Judges must stay **blind to the existing tiers** so their verdicts can be used
to check the curated list rather than just echo it.

## Verifying

```sh
node scripts/compendiumRatings/verifyQuotes.js   # exits non-zero on any bad quote
npx jest src/data/__tests__/compendiumRatings.test.ts
```

`compendiumRatings.test.ts` guards the same invariants in CI: every quote
verbatim, no tier without evidence, three stars stay rare, tiers monotonic, and
the Compendium never overriding a curated tier.
