# Rating shows AND extracting show highlights from Taping Compendium notes

You produce TWO things per show: a quality **verdict**, and the show's
**highlights** (the songs that stood out). Both matter equally.

## Source
`The Deadhead's Taping Compendium` (Getz & Dwork). It is a **taping guide**,
not a review anthology. Consequences you MUST account for:

- A note existing at all means a tape circulates. It is NOT evidence of quality.
- Note LENGTH is not quality. Long notes often mean a historically busy date, a
  famous venue, a long personal anecdote, or a guest-heavy show.
- Much praise is about **tape/recording quality** ("crisp SBD", "beautiful
  matrix", "Betty Board"). That is NOT performance quality. Keep them separate.
- Prose is boosterish by default. "Nice version", "solid show", "worth having"
  is the Compendium's baseline, not an endorsement.
- Notes are OCR'd from scans. Occasional mangled words are expected; ignore them.

---

## PART 1 — verdict

Judge **how good the musical performance was**, using only what the note asserts.

- `essential`   — note makes an explicit superlative, all-time claim about the
                  PERFORMANCE (e.g. "the best ever", "one of the greatest shows
                  they ever played", "legendary", sustained peak across the show).
- `excellent`   — note clearly asserts a well-above-average show: multiple
                  standout segments, strong enthusiasm about the playing.
- `notable`     — note flags something genuinely worth hearing (one great jam, a
                  rare song, a strong set) but is not enthusiastic overall.
- `ordinary`    — note is neutral/descriptive, or praise is only baseline
                  boosterism, or praise is only about the TAPE.
- `poor`        — note asserts the show was weak, sloppy, off, or a bad night.
- `insufficient`— note has no assessable performance content at all (pure
                  setlist, pure anecdote, pure tape lineage, pure venue history,
                  or OCR debris).

Be strict. In a normal batch, `essential` should be RARE (often zero),
`ordinary` and `insufficient` should together be the plurality.

`confidence`: `high` | `medium` | `low`.

`tapeOnly`: `true` if the note's positive language is essentially all about
recording quality rather than playing. (Still set a verdict — usually `ordinary`.)

`caveat`: one short phrase when something qualifies the verdict — e.g.
"praise is for the tape not the show", "note is mostly a personal anecdote",
"note describes only one song", "incomplete tape", "note covers the whole run
not this date". Empty string if none.

---

## PART 2 — highlights (songs that stood out)

`highlights`: every song the note singles out as a standout of THIS show.

Include a song when the note does any of:
- praises it ("a gorgeous Morning Dew", "the Dark Star is why you want this tape")
- calls it rare, unusual, first/last/only, or a debut
- describes it at length as a musical event (a long jam, a segue, a breakdown)
- flags it as the reason to hear the show
- criticises it notably (use `negative`)

Do NOT include songs that merely appear in a setlist or are mentioned in passing
with no judgment. An accurate short list beats a padded long one. Up to 10 per
show; most shows will have 0–4. Empty array is a perfectly good answer.

Each highlight:
```json
{ "song": "Morning Dew",
  "assessment": "legendary" | "excellent" | "notable" | "rare" | "negative",
  "reason": "short display-ready phrase, max 15 words, strictly grounded in the quote",
  "quote": "<exact verbatim substring of this date's note>" }
```
- `song`: the song's normal title, cleaned up from OCR (e.g. "Morning Dew",
  "Scarlet Begonias", "Playing in the Band"). Do not invent a song that is not
  named in the note.
- `assessment`: `rare` is for rarity/debut/only-time regardless of quality.
- `reason`: your own words, but it must assert ONLY what the quote supports.
  No embellishment. Example: "extended jam, cited as the peak of the show".

Also give `showSummary`: ONE sentence, max 30 words, saying what stood out about
this show, strictly grounded in the note. If the note supports nothing, use "".

---

## Verbatim quote rule (CRITICAL — accuracy matters more than anything else)

`evidence` (1–3 strings supporting the verdict) and every highlight `quote` must
be **EXACT CHARACTER-FOR-CHARACTER SUBSTRINGS** of that same date's `note` field.
They are programmatically verified against the source.

- Do NOT paraphrase. Do NOT fix typos, OCR errors, spacing, or punctuation.
- Do NOT stitch together text from different parts of the note.
- Do NOT quote from a DIFFERENT date's note.
- Keep each quote 8–40 words.
- If you cannot produce an exact quote, drop that highlight, or use
  `verdict: insufficient` with an empty evidence array. An unsupported claim is
  worse than no claim.

---

## Output

Write ONE json file: an array with EXACTLY one object per date in your batch,
in the same order. Shape:

```json
[{"date":"1977-05-08",
  "verdict":"essential","confidence":"high","tapeOnly":false,
  "evidence":["...","..."],
  "caveat":"",
  "showSummary":"Sustained peak show; the Scarlet>Fire and Morning Dew are cited as all-time versions.",
  "highlights":[
    {"song":"Scarlet Begonias","assessment":"legendary","reason":"cited as the definitive version","quote":"..."},
    {"song":"Morning Dew","assessment":"legendary","reason":"the emotional peak of the show","quote":"..."}
  ]}]
```

No commentary in the file. No markdown fences. Just the JSON array.
