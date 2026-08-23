#!/usr/bin/env python3
"""
Build src/data/showNotes.ts from the three Taper's Compendium PDFs.

    python3 scripts/parse_compendium_pdf.py
    python3 scripts/parse_compendium_pdf.py --dump-page 1:189    # inspect one page
    python3 scripts/parse_compendium_pdf.py --volumes 1 --limit 60

The PDFs are Acrobat Paper Capture scans, so they carry a text layer *with its
typography intact*. That makes the book's structure recoverable directly rather
than by guessing at it:

    date header   Times-Bold, half again the body size
    venue         ~11pt
    setlist       ~12.5pt
    metadata      Helvetica-Bold keys (Source:, Highlights:, Comments:)
    review body   Times-Roman ~10.5pt
    block quote   body size, indented ~24pt from the column
    new paragraph body size, indented ~14pt from the column
    footnote      ~8pt, foot of the page
    running head  above the body's top margin
    byline        caps, set flush to the column's right edge

Line wraps end in a soft hyphen (U+00AD), so words rejoin exactly — the earlier
markdown-based parser had to guess, and produced "decentsounding" for
"decent-sounding".

Requires pdfplumber (pip install pdfplumber).
"""

from __future__ import annotations

import argparse
import collections
import json
import re
import sys
import unicodedata
from dataclasses import dataclass, field, replace
from pathlib import Path

try:
    import pdfplumber
except ImportError:  # pragma: no cover
    sys.exit("pdfplumber is required: pip install pdfplumber")

ROOT = Path(__file__).resolve().parent.parent
PDF_DIR = ROOT / "reference_files"
OUT_PATH = ROOT / "src" / "data" / "showNotes.ts"

VOLUMES = {
    1: PDF_DIR / "Tapers Compendium Vol 1.pdf",
    2: PDF_DIR / "Tapers Compendium Vol 2.pdf",
    3: PDF_DIR / "Tapers Compendium Vol 3.pdf",
}

CITATION = (
    "Source: The Deadhead's Taping Compendium — Michael M. Getz & John R. Dwork "
    "(Henry Holt and Company, 1998–2000)"
)

SOFT_HYPHEN = "\u00ad"
# Marks where page furniture was lifted out of the middle of a paragraph.
# Unlike a soft hyphen its default is to put the space back: a caption can
# interrupt between words as easily as inside one.
FURNITURE_GAP = "\u0001"

# The band's performing life. Anything outside it is a misread date.
MIN_YEAR, MAX_YEAR = 1959, 1995

# The scan mangles "Highlights" freely — "Hiehlights", "Hlihllghts", "Hi~hll~hts" —
# and numbers the sources with whatever it made of the numeral: "1.", ":1.",
# ":I..", ".1.". Both are tolerated here rather than enumerated.
METADATA_KEY = re.compile(
    r"^\s*[^A-Za-z\n]{0,4}\s*(?:[\dIiLl]{1,3}\s*\.+\s*)?"
    r"(Source|H[\w~]{2,12}ts?|More\s+Comments|Comments|Personnel|Taper|Genealogy|"
    r"Quality|Length|Equipment|Lineage|Notes)\s*:",
    re.I,
)
# "Set 1:", "Set List:", and the scan's "Set 1.:" — volume 3 sets its setlists at
# body size, so this label is what marks them there.
SETLIST_KEY = re.compile(
    r"^\s*((First|Second|Third|Acoustic|Electric)\s+)?Sets?\s*[.,]?\s*(List|\d+)?\s*[.,]?\s*[:;]"
    r"|^\s*(Encore|Studio\s+Rehearsal|Rehearsal|Soundcheck)\s*[.,]?\s*[:;]",
    re.I,
)
# Footnotes hung off a setlist: "* with Duane Allman...", "† also with Berry
# Oakley". The scan reads the dagger as a lowercase t.
SETLIST_NOTE = re.compile(r"^\s*(?:[*\u2020\u2021\u00a7#+]|t\s+(?:also\s+)?with\b)")
# A plate caption naming the date and place: "7/13/84, Greek Theatre".
DATE_CAPTION = re.compile(r"^\s*\d{1,2}/\d{1,2}/\d{2}\s*,\s*[A-Z]")
# Plate captions, which the book sets in italic a size below the body.
CAPTION_TEXT = re.compile(r"photo credit|^(Back|Front) row, left to right|^Left to right", re.I)
DATE_TOKEN = re.compile(r"(\d{1,2})\s*/\s*(\d{1,2})\s*/\s*(\d{2})")
# "MC>PCM>RR>PCM" — a tape's genealogy, printed under the Source line.
# A tape's genealogy: "MR>C? >BetaHF >PCM". Spelled out against the vocabulary
# the tapers actually use, rather than "any short token", so that prose naming a
# segue — "Scarlet Begonias" > "Fire on the Mountain" — cannot match.
_TAPE_TOKEN = (
    r"(?:MR|MC|SBD|AUD|AVD|FM|DAT|PCM|CDR?|MTX|ADD|Beta\s?HF|Beta|HF|RR|DR|"
    r"[A-Z]{1,3}\d?)\??"
)
GENEALOGY_CHAIN = re.compile(
    rf"^\s*{_TAPE_TOKEN}(?:\s*>\s*{_TAPE_TOKEN})+\s*"
)

GENEALOGY = re.compile(
    r"^[A-Z0-9 ]{1,8}(\s*>\s*[A-Z0-9 ]{1,8}){1,}$"
    # "Genealogy:" itself breaks across the column, stranding its tail: "ogy: MR > C > DAT"
    r"|^\s*(ogy|logy|alogy)\s*:"
)


def is_date_line(text: str) -> bool:
    """A line that is nothing but a date, whatever decoration surrounds it.

    Entry headers are set in a different face in each volume — Times-Bold,
    Times-Roman, Times-BoldItalic, and a decorative face the scan reports as
    HiddenHorzOCR — and framed with rules the OCR read as "~", "*", "•" or "_".
    What holds across all of them is that the line carries a date and nothing
    else, so that is what we test.
    """
    if len(re.sub(r"[^A-Za-z]", "", text)) > 1:
        return False
    if not DATE_TOKEN.search(text):
        return False
    return not re.sub(r"[^0-9A-Za-z]", "", DATE_TOKEN.sub("", text))


# ---------------------------------------------------------------------------
# Page model
# ---------------------------------------------------------------------------


@dataclass
class Line:
    top: float
    x0: float
    x1: float
    size: float
    font: str
    text: str
    role: str = "body"


@dataclass
class Column:
    x0: float
    x1: float
    lines: list = field(default_factory=list)


def _modal_size(words) -> float:
    counts = collections.Counter(round(w["size"] * 2) / 2 for w in words)
    return counts.most_common(1)[0][0] if counts else 10.5


def _gutter(baselines, width):
    """Find the channel between the two text columns, if the page has two.

    Counting *empty* pixel columns is not enough: a single element straddling
    the gap — a centred year heading, a wide caption, a photo — bridges it for
    the whole page height, and the page then reads as one column. Every line of
    the left column is then welded to the line beside it, producing text like
    "hun" + "Hornsby, or Branford Marsalis..." + "dred minutes".

    So look for the x that the fewest *words* straddle. On a two-column page
    every baseline has a wide word gap at the same place; on a single-column
    page a word covers the middle on nearly every line.
    """
    if not baselines:
        return None

    lo, hi = int(width * 0.38), int(width * 0.62)
    crossings = [0] * (hi - lo)
    for words in baselines:
        for w in words:
            a = max(lo, int(w["x0"]))
            b = min(hi, int(w["x1"]) + 1)
            for x in range(a, b):
                crossings[x - lo] += 1

    best = min(range(len(crossings)), key=lambda i: crossings[i])
    # A few straddling headings are normal; a column of prose is not.
    if crossings[best] <= max(2, len(baselines) * 0.12):
        return lo + best
    return None


def _baseline_groups(words, tol=2.6):
    words = sorted(words, key=lambda w: (w["top"], w["x0"]))
    groups, cur = [], []
    for w in words:
        if cur and w["top"] - cur[0]["top"] > tol:
            groups.append(cur)
            cur = []
        cur.append(w)
    if cur:
        groups.append(cur)
    return groups


def _group_lines(words, tol=2.6):
    groups = _baseline_groups(words, tol)

    out = []
    for g in groups:
        for part in _split_by_size(g):
            part.sort(key=lambda w: w["x0"])
            sizes = collections.Counter(round(w["size"] * 2) / 2 for w in part)
            fonts = collections.Counter(w["fontname"].split("+")[-1] for w in part)
            out.append(
                Line(
                    top=part[0]["top"],
                    x0=min(w["x0"] for w in part),
                    x1=max(w["x1"] for w in part),
                    size=sizes.most_common(1)[0][0],
                    font=fonts.most_common(1)[0][0],
                    text=" ".join(w["text"] for w in part),
                )
            )
    out.sort(key=lambda l: (l.top, l.x0))
    return out


def _split_by_size(words, tol=3.0):
    """Separate words of a very different size that happen to share a baseline.

    A display-size entry header sits at the same height as the body text beside
    it, and grouping by baseline alone welds the two together — which is how
    "• 7/30/70 •" ended up inside a sentence. Type this far apart in size is
    never part of the same line.
    """
    sizes = collections.Counter(round(w["size"] * 2) / 2 for w in words)
    modal = sizes.most_common(1)[0][0]
    near = [w for w in words if abs(w["size"] - modal) <= tol]
    far = [w for w in words if abs(w["size"] - modal) > tol]
    if not far:
        return [words]
    return [near] + _split_by_size(far) if near else _split_by_size(far)


def _percentile(values, q):
    if not values:
        return 0.0
    ordered = sorted(values)
    return ordered[min(len(ordered) - 1, int(len(ordered) * q))]


def _classify(column: Column, body_size: float):
    """Label each line in a column by the role its typography gives it."""
    body_lines = [l for l in column.lines if abs(l.size - body_size) <= 0.6]
    left = _percentile([l.x0 for l in body_lines], 0.15) if body_lines else column.x0
    right = _percentile([l.x1 for l in body_lines], 0.85) if body_lines else column.x1

    for line in column.lines:
        text = line.text.strip()
        letters = [c for c in text if c.isalpha()]
        caps = (
            len(letters) >= 4
            and sum(1 for c in letters if c.isupper()) / len(letters) >= 0.8
            and re.search(r"[A-Z]{2}", text) is not None
        )

        if is_date_line(text) and line.size >= body_size + 2.5:
            line.role = "header"
        elif is_date_line(text) or DATE_CAPTION.match(text):
            # A date on its own below display size is the page-corner marker
            # repeating the show date, or a plate caption. Either way it is
            # furniture, and at 9.5pt against a 10pt body it used to fall
            # through to prose and land mid-sentence: "Jerry 7/24/94 puts
            # heart and soul into it".
            line.role = "caption"
        elif caps and line.x1 >= right - 12 and line.x0 > left + 25 and len(text) <= 70:
            # Set flush right at the foot of a review: the reviewer's name.
            line.role = "byline"
        elif caps:
            # Nothing in a review is set in full capitals. What is, is lifted off
            # a poster or a plate: "BILL GRAHAM PRESENTS IN NEW YORK".
            line.role = "caption"
        elif CAPTION_TEXT.search(text) or (
            line.size < body_size - 0.4 and "Italic" in line.font
        ):
            line.role = "caption"
        elif line.size <= body_size - 1.4:
            line.role = "footnote"
        elif SETLIST_NOTE.match(text) or SETLIST_KEY.match(text):
            # Volumes 1 and 2 set the setlist larger than the body; volume 3 sets
            # it at body size and merely indents it, so the "Set 1:" label is
            # what identifies it there.
            line.role = "setlist"
        elif METADATA_KEY.match(text) or GENEALOGY.match(text) or "Helvetica" in line.font:
            line.role = "metadata"
        elif line.size >= body_size + 1.4 and len(text.split()) >= 3:
            # Size alone is not enough: the scan renders the odd word oversized,
            # and a one-word "setlist" then swallows the prose that follows it
            # through _carry_wrapped_values.
            line.role = "setlist"
        elif line.x0 >= left + 17 and len(text.split()) >= 3:
            # A block quotation runs to several words a line; one or two words
            # sitting off the margin is a scan artefact, not a quotation.
            line.role = "quote"
        elif line.x0 >= left + 5:
            line.role = "indent"
        else:
            line.role = "body"

    _carry_wrapped_values(column.lines)
    return left, right


def _carry_wrapped_values(lines):
    """Let a wrapped metadata or setlist value keep its parent's role.

    "Highlights: All, especially The Eleven > Turn On" continues onto a line that
    no longer carries the key, and in the smaller sizes it is set in the body
    face too. What separates it from the review is that the review begins after a
    visible break: the book leaves about double the leading between an entry's
    heading and its first paragraph, so a larger-than-normal gap ends the block.
    """
    deltas = [b.top - a.top for a, b in zip(lines, lines[1:]) if 0 < b.top - a.top < 60]
    if not deltas:
        return
    leading = sorted(deltas)[len(deltas) // 2]

    for prev, line in zip(lines, lines[1:]):
        if prev.role not in ("metadata", "setlist"):
            continue
        if line.role not in ("body", "indent", "quote"):
            continue
        if line.top - prev.top > leading * 1.55:
            continue
        # A setlist value is a fragment, so a line that closes on a full stop and
        # runs to a sentence's length is the review resuming — that is how prose
        # under a mis-sized word gets rescued. Metadata gets no such escape:
        # "Comments:" runs to whole sentences, and letting them through put the
        # tail of a tape note at the head of the review.
        if prev.role == "setlist":
            finished = re.search(r"[.!?][\"'\u201d)]?$", line.text.strip())
            if finished and len(line.text.split()) >= 6:
                continue
        line.role = prev.role


def page_columns(page, head_margin=48.0):
    """Split one page into columns of classified lines, in reading order.

    Also returns the running head, which names the section the page belongs to
    ("Reviews: March 1969", "Interview: Jerry Garcia"). That is how the review
    section is told apart from the front matter and the appendices.
    """
    words = page.extract_words(extra_attrs=["size", "fontname"])
    head_words = sorted((w for w in words if w["top"] < head_margin), key=lambda w: w["x0"])
    running_head = " ".join(w["text"] for w in head_words)
    words = [w for w in words if w["top"] >= head_margin]
    if not words:
        return [], 10.5, running_head

    body_size = _modal_size([w for w in words if w["size"] >= 9])
    # Measure the gutter against whole lines: individual words never span it, so
    # word boxes cannot tell a two-column page from a one-column one.
    split = _gutter(_baseline_groups(words), page.width)

    if split is None:
        cols = [Column(x0=min(w["x0"] for w in words), x1=max(w["x1"] for w in words))]
        cols[0].lines = _group_lines(words)
    else:
        left_words = [w for w in words if (w["x0"] + w["x1"]) / 2 < split]
        right_words = [w for w in words if (w["x0"] + w["x1"]) / 2 >= split]
        cols = []
        for ws in (left_words, right_words):
            if not ws:
                continue
            col = Column(x0=min(w["x0"] for w in ws), x1=max(w["x1"] for w in ws))
            col.lines = _group_lines(ws)
            cols.append(col)

    for col in cols:
        _classify(col, body_size)
    return cols, body_size, running_head


# ---------------------------------------------------------------------------
# Text assembly
# ---------------------------------------------------------------------------


def join_lines(lines):
    """Join wrapped lines into one string, marking each wrap with a soft hyphen.

    A line that wraps mid-word ends in U+00AD. The marker is kept for now
    because it is ambiguous: the scan uses it both where the book merely broke a
    word ("main-stream" for *mainstream*) and where the word carries a real
    hyphen ("twenty-two"). resolve_hyphens() settles each one against the rest of
    the corpus.
    """
    out = []
    for line in lines:
        text = line.text.strip()
        if not text:
            continue
        if out and out[-1].endswith((SOFT_HYPHEN, FURNITURE_GAP)):
            out[-1] = out[-1] + text
        else:
            out.append(text)
    return " ".join(out)


WRAP = re.compile(r"(\w+)" + SOFT_HYPHEN + r"(\w+)")
GAP = re.compile(r"(\w+)" + FURNITURE_GAP + r"(\w+)")


def resolve_hyphens(texts):
    """Decide, for every wrapped word, whether it keeps a hyphen.

    Each half-and-half candidate is looked up in the vocabulary the corpus builds
    from its own un-wrapped words. If "twenty-two" appears elsewhere in the book
    and "twentytwo" never does, the wrap restores the hyphen; if "mainstream"
    appears and "main-stream" does not, the halves close up. Where the corpus is
    silent — or says both — the halves close up, which is the commoner case.
    """
    plain, hyphenated = collections.Counter(), collections.Counter()
    for text in texts:
        for token in re.findall(r"[A-Za-z]+(?:-[A-Za-z]+)+", text):
            if SOFT_HYPHEN not in token:
                hyphenated[token.lower()] += 1
        for token in re.findall(r"[A-Za-z]{2,}", text.replace("-", " ")):
            if SOFT_HYPHEN not in token:
                plain[token.lower()] += 1

    stats = collections.Counter()

    def choose(match):
        a, b = match.group(1), match.group(2)
        closed, hyphen = f"{a}{b}", f"{a}-{b}"
        has_closed = plain[closed.lower()] > 0
        has_hyphen = hyphenated[hyphen.lower()] > 0
        if has_hyphen and not has_closed:
            stats["hyphen"] += 1
            return hyphen
        stats["closed" if has_closed else "closed-by-default"] += 1
        return closed

    def close_gap(match):
        """A caption cut this word in half, or fell between two whole words."""
        a, b = match.group(1), match.group(2)
        if plain[f"{a}{b}".lower()] > 0:
            stats["gap-closed"] += 1
            return f"{a}{b}"
        stats["gap-spaced"] += 1
        return f"{a} {b}"

    def finish(text: str) -> str:
        text = GAP.sub(close_gap, WRAP.sub(choose, text))
        # A marker with nothing after it — furniture at the end of a paragraph.
        text = text.replace(SOFT_HYPHEN, "").replace(FURNITURE_GAP, " ")
        return re.sub(r"\s{2,}", " ", text).strip()

    return [finish(t) for t in texts], stats


SUPERSCRIPT_AFTER_QUOTE = re.compile(r'(["”’])\s?\d{1,3}(?=[\s.,;:)]|$)')
SUPERSCRIPT_AFTER_STOP = re.compile(r'([.!?])\s?\d{1,3}(?=\s+["“(]?[A-Z])')


def clean(text: str) -> str:
    text = unicodedata.normalize("NFC", text)
    # A genealogy chain run together with the opening sentence:
    # "MR > C? > Beta HF > PCM After three amazing shows in downtown L.A. ..."
    lead = GENEALOGY_CHAIN.match(text)
    if lead and lead.end() < len(text) and text[lead.end():lead.end() + 1].isupper():
        text = text[lead.end():]
    # The scan reads a closing double quote plus a superscript note number as ,,N
    text = re.sub(r"[.,]?,,(\d{1,3})\b", '."', text)
    text = re.sub(r',,(?=[\s"])', '"', text)
    text = SUPERSCRIPT_AFTER_QUOTE.sub(r"\1", text)
    text = SUPERSCRIPT_AFTER_STOP.sub(r"\1", text)
    # Scan debris: a speck the OCR reads as a middle dot, and guillemets where
    # the printed double quotes were misread.
    text = text.replace("\u00b7", " ")
    text = re.sub(r"[\u00ab\u00bb]", '"', text)
    # The page-corner date marker can be printed straight through a word, the
    # way a running head is: "subtle but very effec7/5/95 tive". No English word
    # abuts a date, so rejoining the halves is unambiguous.
    text = re.sub(r"([A-Za-z])\d{1,2}/\d{1,2}/\d{2}\s+([a-z])", r"\1\2", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)
    text = re.sub(r"\(\s+", "(", text)
    text = re.sub(r"\s+\)", ")", text)
    return text.strip()


def to_iso(month: str, day: str, year: str):
    y = int(year)
    full = 1900 + y if y >= 59 else 2000 + y
    if not (MIN_YEAR <= full <= MAX_YEAR):
        return None
    m, d = int(month), int(day)
    if not (1 <= m <= 12 and 1 <= d <= 31):
        return None
    return f"{full:04d}-{m:02d}-{d:02d}"


def header_dates(text: str):
    return [iso for iso in (to_iso(*m.groups()) for m in DATE_TOKEN.finditer(text)) if iso]


# ---------------------------------------------------------------------------
# Entries
# ---------------------------------------------------------------------------


@dataclass
class Entry:
    dates: list
    volume: int
    page: int
    paragraphs: list = field(default_factory=list)
    byline: str = ""
    closed: bool = False


def entries_from_stream(lines, volume):
    """Walk the volume's classified lines and cut them into entries."""
    entries = []
    current = None
    buf = []          # lines of the paragraph being built
    mode = None       # 'body' | 'quote'

    def flush():
        nonlocal buf, mode
        if current is not None and buf:
            text = clean(join_lines(buf))
            if text:
                current.paragraphs.append(text)
        buf, mode = [], None

    for line, page in lines:
        role = line.role

        if role == "header":
            dates = header_dates(line.text)
            if dates:
                flush()
                current = Entry(dates=dates, volume=volume, page=page)
                entries.append(current)
                continue
            # A bold display line with no date is a section title; ignore it.
            continue

        if current is None:
            continue

        if role in ("setlist", "metadata"):
            # These mark a real structural break in the entry.
            flush()
            continue

        if role in ("footnote", "caption"):
            # Furniture: a footnote at the foot of the page, a plate caption, the
            # page-corner date marker. The prose runs straight through it, so the
            # paragraph continues — and it can interrupt mid-word, as in
            # "subtle but very effec" / 7/5/95 / "tive".
            if buf and re.search(r"[A-Za-z]$", buf[-1].text):
                buf[-1] = replace(buf[-1], text=buf[-1].text + FURNITURE_GAP)
            continue

        if role == "byline":
            flush()
            name = re.sub(r"[.,]+$", "", line.text.strip())
            if not current.byline:
                current.byline = name
            elif current.byline.endswith(","):
                # A team credit wrapped onto a second line.
                current.byline = f"{current.byline} {name}"
            # The byline closes the review. Whatever follows before the next date
            # header — a plate caption, an appendix, the rest of the book — is
            # not part of this entry.
            current.closed = True
            continue

        if current.closed:
            continue

        if role == "indent":
            flush()
            mode = "body"
            buf.append(line)
            continue

        if role == "quote":
            if mode != "quote":
                flush()
                mode = "quote"
            buf.append(line)
            continue

        # plain body line
        if mode == "quote":
            flush()
        mode = "body"
        buf.append(line)

    flush()
    return entries


REVIEW_HEAD = re.compile(r"^\s*Re[uv]iews?\s*:", re.I)


def read_volume(volume, path, limit=None, progress=True):
    """Read one volume and return its entries.

    Only the review section is parsed. The front matter, the interviews and the
    appendices all carry dates that would otherwise be read as entry headers —
    the earlier markdown parser attributed a 55,000-character run of front matter
    to 6/26/74 that way. Each review page names itself in its running head, so
    the section is the span between the first and last page that does.
    """
    per_page = []
    with pdfplumber.open(str(path)) as pdf:
        pages = pdf.pages[:limit] if limit else pdf.pages
        total = len(pages)
        for i, page in enumerate(pages, 1):
            try:
                cols, _, head = page_columns(page)
            except Exception as exc:  # a handful of plate pages fail to parse
                print(f"  vol {volume} page {i}: skipped ({exc})", file=sys.stderr)
                per_page.append((i, [], ""))
                continue
            per_page.append((i, [l for col in cols for l in col.lines], head))
            if progress and i % 100 == 0:
                print(f"  vol {volume}: {i}/{total} pages", flush=True)

    review_pages = [i for i, _, head in per_page if REVIEW_HEAD.match(head)]
    if review_pages:
        first, last = review_pages[0], review_pages[-1]
        print(f"  review section: pages {first}-{last} of {total}")
    else:
        first, last = 1, total
        print(f"  no review running heads found; using all {total} pages")

    lines = [(line, i) for i, page_lines, _ in per_page
             if first <= i <= last for line in page_lines]
    return entries_from_stream(lines, volume)


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------


def escape_ts(value: str) -> str:
    return value.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n")


def write_ts(notes, path):
    lines = [
        "// Auto-generated from The Deadhead's Taping Compendium, Vols. 1-3",
        "// Do not edit manually — regenerate with:",
        "//   python3 scripts/parse_compendium_pdf.py",
        "// Validate with: node scripts/verifyShowNotes.js",
        "",
        f"export const SHOW_NOTES_CITATION = '{escape_ts(CITATION)}';",
        "",
        "/**",
        " * Show notes keyed by date (YYYY-MM-DD).",
        " * Paragraphs are separated by a blank line; each review ends with its byline.",
        " */",
        "export const SHOW_NOTES: Record<string, string> = {",
    ]
    for date in sorted(notes):
        lines.append(f"  '{date}': '{escape_ts(notes[date])}',")
    lines.append("};")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


SENTENCE = re.compile(r"[a-z][.!?](\s|$)")

# The same keys, wherever they appear in a short paragraph.
METADATA_ANYWHERE = re.compile(
    r"\b(Source|Genealogy|Taper|Personnel|Highlights?|Quality|Lineage)\s*:", re.I
)

# "Genealogy:" and its siblings break across the column, leaving the first half
# hanging off the end of the value that preceded them.
TRUNCATED_KEY = re.compile(
    r"\b(Geneal|Genealog|Highligh|Highlight|Personne|Lineag|Equipmen|Sourc|Commen|Tape)\s*$",
    re.I,
)


def _is_heading_debris(paragraph: str) -> bool:
    """Is this paragraph a leftover scrap of the entry's heading, not review prose?

    Three shapes survive classification and land at the top of a note, where the
    reader meets them first: a stranded metadata value, a tail of the setlist,
    and a short orphan phrase lifted off a setlist footnote ("on harmonica",
    "with Duane Allman on guitar").

    A *long* paragraph that opens mid-sentence is left alone — those are real
    reviews whose first words the scan's reading order lost, and dropping one
    would throw away a page of writing to tidy a single word.
    """
    text = paragraph.strip()
    if not text:
        return True
    if METADATA_KEY.match(text) or GENEALOGY.match(text) or SETLIST_KEY.match(text):
        return True
    if text[0].islower() and len(text) < 120:
        return True

    words = [w for w in text.split() if any(c.isalpha() for c in w)]
    if len(words) >= 5 and len(SENTENCE.findall(text)) <= 1:
        # Strip the punctuation a song title carries — a leading quote hid the
        # capital on '"Scarlet' and '"Fire', halving the ratio for a line that
        # is nothing but song titles.
        stripped = [w.lstrip("\"'\u201c\u2018([") for w in words]
        capitalised = sum(1 for w in stripped if w[:1].isupper()) / len(words)
        if capitalised >= 0.6 and (">" in text or text.count(",") >= 4):
            return True
    return False


# A short paragraph of pure tape data can survive anywhere in a note, not only at
# its head: multi-source entries interleave their Source lines with the review.
# Length is the guard — a long paragraph carries prose even if metadata is glued
# into it, and dropping it would lose the review.
MAX_STRAY_METADATA = 300


def _is_stray_metadata(paragraph: str) -> bool:
    text = paragraph.strip()
    if len(text) > MAX_STRAY_METADATA:
        return False
    if METADATA_KEY.match(text) or GENEALOGY.match(text):
        return True
    # The key can sit at the end of the value that preceded it, mid-string.
    if METADATA_ANYWHERE.search(text):
        return True
    if GENEALOGY_CHAIN.fullmatch(text):
        return True
    # A metadata key chopped in half by the column edge, left dangling at the end
    # of its own value: '..."Fire on the Mountain"), Geneal'.
    if TRUNCATED_KEY.search(text):
        return True
    # A bare metadata value the key never made it onto: a running time, or a
    # parenthetical listing what the tape is missing.
    if re.match(r"^\d{1,2}:\d{2}\b", text):
        return True
    if re.match(r'^[("\u201c].*["\u201d)]\s*$', text) and ">" in text and len(text) < 200:
        return True
    return False


def trim_leading_debris(paragraphs):
    """Drop heading scraps so a note opens on its commentary."""
    i = 0
    while i < len(paragraphs) and _is_heading_debris(paragraphs[i]):
        i += 1
    # _is_stray_metadata runs over everything that survives, so a scrap the trim
    # failed to recognise cannot shield the ones behind it.
    return [p for p in paragraphs[i:] if not _is_stray_metadata(p)]


def _looks_unreflowed(body: str) -> bool:
    """Did this note come out as column fragments rather than paragraphs?

    A caption or a second text column running alongside the review is spliced
    into it line by line, and the result reads as gibberish:

        Kresge Plaza, Massachusetts Institute of  chilling subject a timely
        Technology, Cambridge, Massachusetts      everyone was gathered there

    Reflowed prose is far longer per paragraph than the printed column ever was,
    so a note whose paragraphs are all column-width was never really reflowed.
    Better to drop it than to ship it.
    """
    paragraphs = [p for p in body.split("\n\n") if p.strip() and not p.startswith("—")]
    if len(paragraphs) <= 3:
        return False
    mean = sum(len(p) for p in paragraphs) / len(paragraphs)
    return mean < 90


def build_notes(entries, min_chars=120):
    notes = {}
    stats = collections.Counter()
    for entry in entries:
        body = "\n\n".join(p for p in trim_leading_debris(entry.paragraphs) if p)
        if len(body) < min_chars:
            stats["too_short"] += 1
            continue
        if _looks_unreflowed(body):
            stats["unreflowed"] += 1
            continue
        if entry.byline:
            body += f"\n\n— {entry.byline}"
        for iso in entry.dates:
            notes[iso] = f"{notes[iso]}\n\n{body}" if iso in notes else body
        stats["kept"] += 1
    return notes, stats


def dump_page(spec):
    volume, pageno = (int(x) for x in spec.split(":"))
    with pdfplumber.open(str(VOLUMES[volume])) as pdf:
        page = pdf.pages[pageno - 1]
        cols, body_size, head = page_columns(page)
        print(f"vol {volume} page {pageno}: {page.width:.0f}x{page.height:.0f}, "
              f"body {body_size}pt, {len(cols)} column(s), head={head!r}")
        for n, col in enumerate(cols, 1):
            print(f"\n--- column {n}  x {col.x0:.0f}..{col.x1:.0f}")
            for line in col.lines:
                print(f"  {line.top:6.1f} {line.x0:6.1f} {line.size:5} "
                      f"{line.role:9} {line.font:14.14} | {line.text[:74]}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--volumes", nargs="*", type=int, default=[1, 2, 3])
    ap.add_argument("--limit", type=int, default=None, help="only the first N pages")
    ap.add_argument("--dump-page", help="VOLUME:PAGE, print the classified page and exit")
    ap.add_argument("--out", default=str(OUT_PATH))
    ap.add_argument("--report", help="write a JSON report of entries")
    args = ap.parse_args()

    if args.dump_page:
        dump_page(args.dump_page)
        return

    all_entries = []
    for volume in args.volumes:
        path = VOLUMES[volume]
        if not path.exists():
            sys.exit(f"missing {path}")
        print(f"Reading volume {volume}: {path.name}")
        entries = read_volume(volume, path, limit=args.limit)
        print(f"  {len(entries)} entries with a date header")
        all_entries.extend(entries)

    # Settle wrapped words against the whole corpus before splitting into notes.
    flat, index = [], []
    for e_i, entry in enumerate(all_entries):
        for p_i, para in enumerate(entry.paragraphs):
            flat.append(para)
            index.append((e_i, p_i))
    resolved, hyphen_stats = resolve_hyphens(flat)
    for (e_i, p_i), para in zip(index, resolved):
        all_entries[e_i].paragraphs[p_i] = para
    print(f"\nWrapped words: {sum(hyphen_stats.values())} "
          f"({hyphen_stats['hyphen']} kept a hyphen, "
          f"{hyphen_stats['closed']} closed on the corpus's word, "
          f"{hyphen_stats['closed-by-default']} closed with no evidence either way)")

    notes, stats = build_notes(all_entries)
    write_ts(notes, Path(args.out))

    lengths = sorted(len(v) for v in notes.values())
    print(f"\nEntries kept: {stats['kept']}, dropped as too short: {stats['too_short']}, "
          f"dropped as unreflowed columns: {stats['unreflowed']}")
    print(f"Unique dates: {len(notes)}")
    if lengths:
        print(f"Length min/median/max: {lengths[0]} / "
              f"{lengths[len(lengths) // 2]} / {lengths[-1]}")
        print(f"Range: {min(notes)} .. {max(notes)}")
    print(f"Written to {args.out}")

    if args.report:
        Path(args.report).write_text(json.dumps(
            [{"dates": e.dates, "volume": e.volume, "page": e.page,
              "paragraphs": len(e.paragraphs), "byline": e.byline,
              "chars": sum(len(p) for p in e.paragraphs)} for e in all_entries],
            indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
