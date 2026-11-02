# Project working notes

- Read Plan.md and TODO.md before changing project scope.
- Preserve Logs/Week_1.md as the initial-function snapshot.
- Record subsequent work, decisions, verification, and outstanding limitations in Logs/Week_2.md until the user requests a new week.
- Keep TODO.md and README.md accurate when behavior changes.
- Keep product copy focused on the participant's activity. Do not add development announcements or reference-product comparisons to the site.
- Browser checks: `node --check script.js` and `node tests/run.cjs`. The latter requires Node 24 and Windows Chrome and uses an isolated temporary profile. Its smoke page clears storage only in that test profile; do not open it in a user's normal profile.
