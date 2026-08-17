# Explorer serial-number search — examples

Reference examples for the `serialColumns` search predicate used by
`CreditTransactionsManagementService.queryExplorer` (see
`buildSerialSearchPredicate` / `extractSerialSearchPredicate` /
`buildSerialPrefixPredicate` / `serialRangeConditionSQL` in
`credit-transactions-management.service.ts`). Intended for business sign-off
on the search behavior.

A block serial is 7 `-`-separated parts:
`creditId-country-firstTransferParty-projectId-rangeStart-rangeEnd-vintage`,
e.g. `CA0NNN-NG-XX-32-3001-4000-2023`.

`buildSerialSearchPredicate` picks one of two interpretations depending on
the shape of the typed value:

- **Prefix shape** — one or more leading text parts immediately followed by
  one or more numeric parts (no text part after a number), e.g.
  `CA0NNN-NG-XX-32-3001` or a full 7-part serial. The parts are mapped
  **left-to-right onto the serial's fixed sections**: text →
  creditId/country/firstTransferParty (per-position ILIKE), numbers →
  projectId (exact) / rangeStart / rangeEnd (range overlap) / vintage
  (exact). This is the pattern documented in this file's "Prefix search"
  section below.
- **Fragment shape** — anything else (numbers only, text only, or a text
  part following a number). The original right-anchored rules apply: text
  is ILIKE'd against the whole serial string, and numbers are interpreted
  positionally **from the right** (last = vintage, the two before it =
  range, etc). This is the pattern documented in "Search results" below.

## Sample dataset (6 blocks)

| Block | Serial | Project | Range | Vintage |
|---|---|---|---|---|
| **A** | `CA0NNN-NG-XX-32-3001-4000-2023` | 32 | 3001–4000 | 2023 |
| **B** | `CA0NNN-NG-XX-30-3400-4200-2023` | 30 | 3400–4200 | 2023 |
| **C** | `CA0NNN-NG-XX-45-1-1000-2022` | 45 | 1–1000 | 2022 |
| **D** | `CA0NNN-NG-XX-32-1-3000-2021` | 32 | 1–3000 | 2021 |
| **E** | `CA0NNN-NG-XX-99-3500-3500-2023` | 99 | 3500–3500 (unit) | 2023 |
| **G** | `CA1NNN-NG-XX-32-3001-4000-2023` | 32 | 3001–4000 | 2023 — same as A, but prefix `CA1NNN` instead of `CA0NNN` |

## Search results

These all use terms with **no leading text before the first number**
(numbers-only or text-only), so they take the **fragment shape** — numbers
interpreted positionally from the right. Rows 1, 2 and 9 are full serials
that *do* have a leading text prefix, so they actually take the **prefix
shape** now (see below); they're kept in this table because their results
are unchanged from the original right-anchored behavior — included here to
show that continuity, with the "Why" column updated to describe the
mechanism actually used.

| # | Search term | Rule | Matches | Why |
|---|---|---|---|---|
| 1 | `CA0NNN-NG-XX-32-3001-4000-2023` | Full block serial (prefix shape) | **A** only | Per-position text `CA0NNN`/`NG`/`XX` + project `= 32` (exact) + range overlap `[3001,4000]` + vintage `= 2023` (exact) — G fails only on the creditId position (`CA1NNN` doesn't contain "CA0NNN"). |
| 2 | `CA0NNN-NG-XX-32-3500-3500-2023` | Full unit serial (prefix shape) | **A** only | Range overlap collapses to `[3500,3500]`; A's range 3001–4000 contains it. G is excluded by the creditId position match, same as above. |
| 3 | `3500` | Partial unit | **A, B, E, G** | Bare unit → any block whose range contains 3500, no other constraint. |
| 4 | `9000` | Partial unit, negative | *(none)* | No block's range reaches 9000. |
| 5 | `32-3500` | Two-number, ascending | **A, B, C, D, E, G** — all 6 | `lo=32 ≤ hi=3500` → valid range window; broadly overlaps every sample block. |
| 6a | `2023-3500` | Two-number, ascending | **A, B, D, E, G** | `lo=2023 ≤ hi=3500` → valid; C's range (1–1000) doesn't reach 2023 so it's excluded. |
| 6b | `3500-2023` | Two-number, **inverted** | **(none)** | `lo=3500 > hi=2023` → invalid range → predicate is unsatisfiable, matches nothing. |
| 7 | `3500-3500-202` | Three-number | **A, B, E, G** | Range `[3500,3500]` (contains-3500 blocks) **AND** vintage `LIKE %202%` — all matching vintages (`2023`) contain "202". |
| 8 | `3500-3500-9999` | Three-number, vintage mismatch | *(none)* | Same range as #7, but no vintage contains "9999". |
| 9 | `CA0NNN-NG-XX-32-1-1000-2022` | Full serial, deliberately mismatched project (prefix shape) | *(none)* | Project `= 32` (exact) rules out **C** outright (C's real project is `45`). **D** has project `32` and its range `[1,3000]` overlaps `[1,1000]`, but D's vintage is `2021`, not `2022` (exact match) — excluded. |
| 10 | `NG` | Text-only | **A, B, C, D, E, G** — all 6 | Plain substring match against the whole serial string. |
| 11 | `1-32-3001-4000-2023` (5 numbers) | Leftover-number, fragment shape | **G only** | Rightmost 4 numbers parse as usual → project `%32%`, range `[3001,4000]`, vintage `%2023%` — both A and G satisfy that. The leftover `1` is ILIKE'd **only against the `creditId-country-firstTransferParty` head** (`CA0NNN-NG-XX` for A, `CA1NNN-NG-XX` for G). A's head has no "1" → excluded. G's head (`CA1NNN`) contains "1" → matches. |

## Prefix search — typing a serial from the start

New pattern: one or more leading text parts followed by one or more
consecutive numeric parts (e.g. `CA0NNN-NG-XX-32-3001`) is read
**left-anchored**, mapping parts onto the serial's fixed sections in order
(creditId, country, firstTransferParty, projectId, rangeStart, rangeEnd,
vintage) instead of positionally from the right. ProjectId and vintage use
**exact** match on their position; a range is expressed with **overlap**
semantics (a lone rangeStart number means "block range contains this
unit").

| # | Search term | Numbers map to | Matches | Why |
|---|---|---|---|---|
| P1 | `CA0NNN-NG-XX-32` | project only | **A, D** | Text `CA0NNN`/`NG`/`XX` (per-position) + project `= 32` (exact), no range/vintage constraint. Both A and D are project 32 with creditId `CA0NNN`. **B/C/E** excluded by project; **G** excluded by creditId (`CA1NNN`). |
| P2 | `CA0NNN-NG-XX-32-3001` | project, rangeStart | **A** only | Project `= 32` + block range must **contain** unit `3001`. A's range 3001–4000 contains it; D's range 1–3000 stops just short (excluded). G excluded by creditId. |
| P3 | `CA0NNN-NG-XX-32-3001-4000` | project, rangeStart, rangeEnd | **A** only | Project `= 32` + range **overlap** `[3001,4000]`, no vintage constraint yet. G excluded by creditId. |
| P4 | `CA0NNN-NG-XX-32-1-3000-2021` | project, range, vintage | **D** only | Project `= 32` + range overlap `[1,3000]` + vintage `= 2021` (exact) — only D matches all four. |

## Key rules worth explicit business sign-off

- **Row 5 (`32-3500`) is intentionally broad.** Any two-number input with no leading text is *only* a range match — the numbers are taken purely as `[lo, hi]` boundaries in the order typed, with no positional meaning (not "project 32, unit 3500"). A wide window like this can match blocks from unrelated projects whose ranges happen to fall inside it.
- **Row 6b confirms inverted ranges match nothing.** If the first number is greater than the second (`lo > hi`), the search is treated as invalid rather than being silently reordered.
- **Row 11 confirms the 5th+ numeric token only matches the serial's leading `creditId-country-firstTransferParty` segment**, not the whole serial string — so it can't accidentally match by hiding inside the range/vintage/project digits already accounted for.
- **A leading text part switches the numbers to left-anchored/section-positional matching** (project → range → vintage, in that order) instead of the right-anchored fragment rules, and switches project/vintage from substring to **exact** match. Text also becomes per-position (creditId/country/firstTransferParty) rather than a whole-serial substring match — this changes the *mechanism* for full-serial inputs like rows 1/2/9 above, though their results are unchanged on this sample dataset.
- **Row P2 shows the "contains" rule for a lone rangeStart number** — `…-32-3001` does not require an exact rangeStart of 3001, it requires the block's range to contain unit 3001 (satisfies the "range overlap if necessary" requirement).
