# Project TODO

Last reviewed: 2026-11-10. See [Logs/Week_2.md](Logs/Week_2.md) for local/community checks and remaining live-service verification.

## Goal and current state

Help university students practice imagination through short, approachable drawing activities. The current temporary working title is **낙서장**, as requested by the user. The final name remains open.

The static Korean-language app works offline without dependencies. Supabase public configuration is now present and the corrected public artwork query has passed a live read-only check. Top profile search uses remote profiles when configured; the original Gallery remains a sample. Local drawings/drafts remain browser-specific; explicit Community uploads form a separate cloud collection. Full two-account live acceptance remains pending.

## Completed in source

- [x] Mouse/touch drawing using Canvas and pointer events.
- [x] Six colors, brush width, eraser, undo (up to 12 snapshots), and confirmed clear.
- [x] Three-minute timer beginning with the first stroke, continuing across app screens, and automatic completion.
- [x] Manual completion and local saved-artwork collection with dates.
- [x] Sample gallery with locally persisted like selections.
- [x] Responsive drawing/gallery/collection screens, empty state, navigation, and basic accessibility attributes.
- [x] README explaining offline use and local storage limitations.

Baseline features were reviewed in source; the current app subsequently passed the Chrome checks recorded in Logs/Week_2.md. Physical-device and accessibility acceptance remain open.

## P0 — Make the prototype dependable

- [ ] **T01: Run and record browser acceptance checks.** Test Chrome/Edge desktop and a mobile touch browser: drawing, tools, undo after clear, manual completion, timer expiry, navigation during countdown, reload persistence, empty collection, and narrow screens. Include expiry while drawing and while the clear dialog is open. Record browser/device and results.
- [x] **T02: Track the active pointer.** The code captures a pointer but does not restrict move/up/cancel events to that pointer. Verify multi-touch behavior and prevent another finger from changing or ending the active stroke. Acceptance: a second touch cannot affect the active stroke.
- [x] **T03: Validate stored records.** Loaded drawings are only checked for array shape, and likes accept any object, including arrays. Filter invalid artwork records before counting/rendering and validate expected field types. Acceptance: malformed storage does not break rendering or inflate the collection count.
- [x] **T04: Protect unfinished work.** Add draft recovery and a warning when leaving with unsaved work; explain storage failure clearly. Acceptance: a reload can recover the drawing, topic, and appropriate timer state under the agreed timer policy.
- [x] **T05: Allow artwork export and deletion.** Provide PNG download and confirmed removal from the local collection. Acceptance: exported art matches the canvas, deleting one item preserves other items, and persistence failures are communicated.
- [ ] **T06: Check accessibility and mobile usability.** Check keyboard controls, focus after navigation/dialog actions, contrast, touch target sizes, and instructions for the drawing surface. Document the limitations of a pointer-based canvas.

## P1 — Complete the recurring drawing activity

- [ ] **T07: Agree on participation rules.** Decide daily vs. another topic cadence, timezone, repeat submissions, and what happens to an in-progress drawing when the topic changes. Suggested starting point: daily topics using Asia/Seoul, with each drawing retaining the topic it started with. This is a proposal, not an agreed requirement.
- [x] **T08: Implement scheduled topics.** Depends on T07. Replace the hardcoded garden prompt with a topic list and a consistent date-selection function. Save topic ID/title with each drawing and update related screen copy. Acceptance: topics change on the agreed boundary and old artwork retains its original topic.
- [x] **T09: Add topic history and collection filtering.** Depends on T08. Let users find previous work by topic/date, with clear empty states.
- [x] **T10: Centralize drawing-session configuration.** Use one duration setting instead of the two hardcoded 180-second values. Define timer behavior after sleep, backgrounding, reload, undo to blank, and erasing on a blank canvas; verify the chosen rules.
- [ ] **T11: Validate the service-learning objective.** Conduct a small university-student pilot with consent. Evaluate ease of starting/completing, willingness to return, and perceived creative engagement. Agree on success criteria before collecting results; do not treat participation counts alone as proof of improved imagination.

## P2 — Build the planned shared service

Supabase Auth/Postgres/private Storage has been prepared alongside Vercel static hosting. Email/password identity and private-by-default explicit uploads exist in source. Team ownership/operation, connection, and live acceptance remain outstanding; see [backend/SETUP.md](backend/SETUP.md).

2026-11-10 partial progress (T12–T17 remain unchecked): migration includes profiles/artwork/likes/follows, constraints and RLS. Community has email auth, profile edits/search, explicit PNG import, private/public visibility, cloud collection, paginated public/profile artwork, deletion, likes and follows. Client and mock-browser tests pass. No live migration, two-account checks, authoritative topics, automatic journal sync, password recovery, reporting/moderation, or operational deployment has been completed. T15 topic filters and T26 following feed remain pending.

- [ ] **T12: Design the shared data model and access rules.** Define users/profiles, topics, artwork metadata/files, likes, and follows. Specify ownership, public/private visibility, deletion behavior, upload limits, and server-side validation.
- [ ] **T13: Implement identity and profiles.** Depends on T12. Provide the selected sign-in/identity flow, profile editing, and another user's artwork collection.
- [ ] **T14: Implement artwork storage and publishing.** Depends on T12–T13. Add upload progress, retry/failure behavior, ownership checks, and user-controlled publication. Consider an explicit local-artwork import path; do not silently upload existing drawings.
- [ ] **T15: Replace the sample gallery with shared artwork.** Depends on T14. Add topic filtering, pagination, and loading/empty/error states. Acceptance: art submitted by one user is visible to another according to its visibility setting.
- [ ] **T16: Implement persistent social likes and follows.** Depends on T13–T15. Enforce one like per identity/artwork, allow unlike/unfollow, and show accurate server-backed counts.
- [ ] **T17: Prepare public operation.** Add reporting/moderation, abuse controls, privacy/deletion information, storage retention rules, backups, and deployment documentation. Complete before a public shared-service launch.

## P3 — Optional experiments after the core loop is validated

- [x] **T18: Additional basic drawing tools.** Implement bucket fill, spray, line, circle, rectangle, and redo alongside the existing pen/eraser. Check fill boundaries/no-ops, shape previews/cancellation, stationary spray and release, and undo/redo. Custom colors remain a possible later extension.
- [ ] **T19: Groups, reposting, and awards.** Define attribution, audience, and consent rules before implementation.
- [ ] **T20: Drawing quiz or doodle contest.** Prototype one format after the shared service works; evaluate whether it supports approachable creative participation.

## Reference notes

The references inform the proposed product evolution, not a requirement to reproduce existing products. See [Plan.md](Plan.md#reference-informed-development-direction) for the comparison, participant flow, implementation stages, and acceptance criteria. The following tasks track those proposals; their product rules remain subject to team agreement.

## Reference-informed feature backlog

- [x] **T21: Daily completion and calendar (워들 adaptation).** Depends on T07–T09. Derive one completion marker per day from saved daily-mode drawings; allow repeated submissions and exclude practice. Check day-boundary and deletion behavior.
- [x] **T22: Prompt card and optional warm-up (퀵드로우 adaptation).** Depends on T08 and T10. Add a skippable practice prompt separate from the shared daily topic. Acceptance: practice cannot replace or complete the daily challenge.
- [x] **T23: Creative variations and comparison (시맨틀 adaptation).** Depends on T08–T10. Offer an optional constraint before drawing, link the new drawing to its parent, and compare both versions without quality scoring. Acceptance: topic and parent links survive reload and missing/deleted parents are handled gracefully.
- [x] **T24: Drawing journal and captions (셋로그 adaptation).** Depends on T03 and T09. Group local drawings by date/topic and support an optional plain-text caption. Acceptance: older caption-free records still render and captions persist safely.
- [x] **T25: Shareable result-card export.** Depends on T05 and T08. Export artwork with original topic/date and an optional caption; omit private identity information by default. Acceptance: download works without a backend and does not falsely claim publication.
- [ ] **T26: Same-topic and following feeds.** Depends on T13–T17 and T24. Add dated artwork/captions and paginated feed views, with agreed ordering and visibility. Acceptance: private artwork never appears and newly published work can be discovered.
- [ ] **T27: Asynchronous guessing (캐치마인드 adaptation).** Refines T20; depends on T12–T17. Use curated words, server-held answers, agreed guess limits/normalization, and a reveal flow. Acceptance: public metadata does not leak the answer and daily free drawing remains available independently.

Suggested feature sequence after P0: T07–T10, T21, T24–T25; pilot T22–T23; then the shared-service tasks and T26–T27. Live rooms and automatic drawing recognition are deferred experiments, not prerequisites.

## Maintenance

- Use these IDs when discussing or implementing work. Add an owner and target date when the team commits; neither is assigned yet.
- Work in priority order; the next batch is the remaining T01/T06 manual checks, T07 review of the implemented defaults, and T11 student pilot. Then decide the shared-service foundation in T12.
- Mark an item complete only after its acceptance criteria are checked, and record a short result/link beside it. If partially complete, leave it unchecked and describe the remaining work.
- Update this file whenever scope or implementation changes. Keep Plan.md as the product direction and README.md accurate for the current runnable app.

## Week 2 status evidence

Completed local tasks were checked using the Chrome harness and native pointer checks in `tests/run.cjs`; see [Logs/Week_2.md](Logs/Week_2.md). T01 remains open for Edge and real-device coverage; T05's browser export/deletion behavior passes, with manual OS download confirmation outstanding. T06 remains open for a full accessibility audit. T07's initial participation defaults await team/pilot review. T12–T17 are partially implemented and await live setup/acceptance; T26–T27 remain incomplete.

- [x] **T28: Refine layout and working title.** Use 낙서장, square corners, compact spacing, stronger typography, and concise functional copy across the frontend and exports. Verification is recorded in Logs/Week_2.md.

- [x] **T29: Temporary profile search.** Search clearly labeled fixture profiles by nickname, handle, or interest; show profile artwork previews and empty/reset states. This does not complete T13 or provide actual identity, remote search, or follows.
- [x] **T30: Project introduction.** Add a compact page based on Plan.md covering the university-student objective, usage, developers/GIST service learning, current local scope, and planned social/game direction.

Latest evidence: 47 local checks and 22 mock-community checks per desktop/mobile viewport, native pointer checks, and direct route checks. The 11 social API checks include explicit foreign-key joins. A live anonymous artwork query succeeds; two-account permissions remain unverified. See the 2026-11-10 follow-up in Logs/Week_2.md.
