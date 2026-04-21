# Release Note Instructions

This document explains how to add a new release note entry to `playstore.md` and `web.json`.

---

## Files

| File | Purpose |
|---|---|
| `playstore.md` | Compact, plain-text release notes for the Google Play Store listing |
| `web.json` | Full, structured release notes for the web changelog/website |
| `instruction.md` | This file |

---

## Rules

- **New versions always go on top** — prepend to both files, never append.
- **Play Store has a hard 500-character limit** for the "What's new" field. The entire body of a `playstore.md` entry (everything between the version header and the `---` divider, excluding markdown syntax) must stay under 500 characters.
- `web.json` should be detailed and complete. It is the source of truth for what shipped.
- Version format: `MAJOR.MINOR.PATCH-tag` (e.g. `0.1.0-alpha`, `1.0.0`, `1.2.0-beta`).
- `releaseDate` format: `YYYY-MM-DD`.

---

## How to add a new release

### 1. `playstore.md`

Prepend a new section **above** the previous version block using this template:

```markdown
## vX.X.X — Month DD, YYYY

**[Release Title]**

[One sentence describing the theme of the release.]

- Feature name or short phrase
- Feature name or short phrase
- Bug fixes and stability improvements

---
```

**Character budget: 500 characters max** (count everything between the version header and the `---` divider, excluding markdown symbols like `#`, `*`, `-`).

Priority rules for staying within the limit:
1. **Write points only — no inline descriptions.** Each bullet is a name or short phrase, nothing after a dash.
2. **If still over budget**, shorten point names further (e.g. "Attendance Check-in/out & Break Logs" → "Attendance Tracking").
3. **If still over budget**, group related points into one (e.g. "GPS Tracking, Route History & Territories" → "Field Tracking Suite").
4. **Never exceed 500 characters.** Cut points before you exceed the limit — the full detail lives in `web.json`.

Additional guidelines:
- Lead with the most impactful changes.
- Use plain language — this is user-facing copy.
- Group minor fixes into a single "Bug fixes and stability improvements" line.
- Do not include technical implementation details.

---

### 2. `web.json`

Prepend a new JSON object **at the top of the array** (before the previous version object) using this structure:

```json
{
  "version": "X.X.X-tag",
  "releaseDate": "YYYY-MM-DD",
  "title": "Release Title",
  "summary": "One or two sentences summarising the overall theme and scope of this release.",
  "highlights": [
    "Top-level headline change #1",
    "Top-level headline change #2",
    "Top-level headline change #3"
  ],
  "sections": [
    {
      "category": "Category Name",
      "items": [
        {
          "title": "Feature or Change Title",
          "description": "Full explanation of what was built, how it works, and why it matters. Include technical detail where relevant."
        }
      ]
    }
  ],
  "knownLimitations": [
    "Anything that is missing, broken, or intentionally deferred in this release."
  ],
  "technicalNotes": {
    "platform": "e.g. React Native (Expo)",
    "router": "e.g. Expo Router",
    "backend": "e.g. Supabase",
    "buildSystem": "e.g. EAS",
    "architecture": "Any relevant architectural notes"
  }
}
```

Guidelines:
- `highlights` — 3 to 5 bullets, the most important changes a reader should know immediately.
- `sections` — group items by functional area (e.g. Authentication, Field Management, Analytics). Only include categories that have changes in this release; do not carry forward unchanged categories.
- `knownLimitations` — be honest. List anything deferred, broken, or intentionally out of scope.
- `technicalNotes` — update only the fields that changed. Omit fields that are unchanged from the previous release if preferred, or carry them forward for completeness.
- Remove the `technicalNotes` key entirely if there are no relevant technical changes to call out.

---

## Minimal prompt to give Claude

> "Add a release note for vX.X.X. Changes: [list what shipped]. Follow `docs/release_note/instruction.md`."

Claude will read this file, read the existing entries for formatting reference, and prepend the new version to both files correctly.

---

## Example of correct file state after two releases

**`playstore.md`:**
```
## v0.1.0-alpha — May 1, 2026   ← newest on top
...
---
## v0.0.1-alpha — April 8, 2026
...
---
```

**`web.json`:**
```json
[
  { "version": "0.1.0-alpha", ... },   // newest on top
  { "version": "0.0.1-alpha", ... }
]
```
