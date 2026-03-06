# Napkin

## Corrections
| Date | Source | What Went Wrong | What To Do Instead |
|------|--------|----------------|-------------------|
| 2026-03-06 | self | Started repo inspection before a napkin file existed. | Create `.claude/napkin.md` immediately when it is missing, then keep it updated during the task. |

## User Preferences
- Keep Tithely giving categories mapped as: `Building Campaign` -> `Pledges`, `SENT Missions` -> `Sent Missions Income`, everything else -> `General Offerings`.

## Patterns That Work
- For Tithely imports, detect the fund column dynamically instead of assuming every row is `General Offerings`.
- Real Tithely exports in this repo context use the header `Fund Name`; observed values include `FVC General Giving`, `Building Campaign`, and `FVC 1:30pm`.

## Patterns That Don't Work
- Hard-coding the Tithely category to `General Offerings` loses pledge and missions distinctions.

## Domain Notes
- This app converts contribution exports into ChurchTrac-friendly CSV rows.
- Tithely sample export dates look like `26. 2. 28.` and the current parser converts them to `2026-02-28`.
