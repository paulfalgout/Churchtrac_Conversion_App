# Napkin

## Corrections
| Date | Source | What Went Wrong | What To Do Instead |
|------|--------|----------------|-------------------|
| 2026-03-06 | self | Started repo inspection before a napkin file existed. | Create `.claude/napkin.md` immediately when it is missing, then keep it updated during the task. |
| 2026-03-06 | self | Used backticks inside a shell `rg` search string and accidentally triggered shell command substitution. | Quote shell search patterns without backticks or escape them before running commands from bash. |

## User Preferences
- Keep Tithely giving categories mapped as: `Building Campaign` -> `Pledges`, `SENT Missions` -> `Sent Missions Income`, everything else -> `General Offerings`.
- Conversion screens should give obvious completion feedback in-app, not just write the file silently. A little playful celebration is acceptable.
- More motion is acceptable for the top-level completion toast as long as it does not scroll the page.

## Patterns That Work
- For Tithely imports, detect the fund column dynamically instead of assuming every row is `General Offerings`.
- Real Tithely exports in this repo context use the header `Fund Name`; observed values include `FVC General Giving`, `Building Campaign`, and `FVC 1:30pm`.
- Current Hana giving imports can support both the new 11-column `.txt` export layout and ChurchTrac-shaped `.csv` inputs in the same merge flow.
- For Hana monthly giving merges, infer category from the filename: `build` -> `Pledges`, `sent` -> `Sent Missions Income`, `giving` -> `General Offerings`.

## Patterns That Don't Work
- Hard-coding the Tithely category to `General Offerings` loses pledge and missions distinctions.
- Relying on the lower output panel alone is easy to miss; surface success near the top of the workspace too.
- Auto-scrolling the workspace on success feels jarring in this app; prefer toasts/highlights without moving the page.

## Domain Notes
- This app converts contribution exports into ChurchTrac-friendly CSV rows.
- Tithely sample export dates look like `26. 2. 28.` and the current parser converts them to `2026-02-28`.
