# Week 2 — Daily drawing experience

Date: 2026-10-12. Week labels are project milestones. This file records work from this session onward.

## Work completed

- Created Logs/Week_1.md as the original-function snapshot and this ongoing work log.
- Refined the interface into a compact purple-toned drawing studio, daily prompt card, weekly progress strip, inspiration gallery, and drawing journal. Product copy describes activities rather than development history or reference products.
- Added seven rotating daily topics selected using the Asia/Seoul date. The session keeps its starting topic and day, including across midnight. Topics repeat weekly in this initial local release.
- Added a separate skippable practice mode and optional three-shape variation mode. New variations can reference an existing drawing and show a side-by-side comparison. Missing/deleted parents produce a graceful message.
- Added plain-text captions, grouping by save date, mode/topic filters, daily completion markers, and a Monday–Sunday calendar. Repeat daily drawings count once; practice/variations do not count as daily completion; deleting the last daily drawing removes its marker.
- Added artwork PNG export, branded result-card PNG export using the original session day, and confirmed deletion.
- Centralized the three-minute duration. Sessions start on the first drawing stroke. Background time counts; expired recovered drafts save immediately. Undo/clear do not restart the timer. Erasing a blank canvas does not start a session.
- Added draft recovery with image, topic, mode, parent, caption, and deadline. Drafts save after strokes/caption changes/navigation/backgrounding. Warn on leaving an unfinished drawing and report storage failures.
- Added active-pointer tracking, closing of the clear dialog on expiry, stored-record validation/normalization, and backward-compatible legacy artwork handling. Prior artwork is kept as an earlier record rather than relabeled with today's topic.
- Updated project documentation and task status.

## Verification

- `node --check script.js`: passed.
- `node tests/run.cjs`: passed 25 checks each at 1280×900 and 390×844, plus native Chrome mouse/touch input and pointer capture checks. The runner uses a temporary browser profile and does not access the user's normal profile.
- Checks cover Korean midnight boundaries, topic changes, malformed storage, legacy records, multiple pointers, save metadata, plain-text captions, practice exclusion, daily completion/deletion, parent comparisons, mode filtering, PNG result export, timer expiry with an open dialog, undo after clearing, storage failures, draft recovery and expiry, and horizontal overflow.
- Desktop and mobile screenshots reviewed; artifacts are tests/desktop.png and tests/mobile.png. The offline smoke harness is tests/smoke.html. Synthetic multi-pointer unit events stub capture; separate native-input checks exercise actual browser capture.
- Real-device mobile testing, Edge verification, and a full accessibility audit remain pending. PNG generation was checked in the browser; the operating-system download flow still needs manual confirmation.

## Current boundaries and next work

This release covers the local Stage A participation loop. All data remains in this browser. The gallery still clearly identifies its illustrations as examples. Identity, public publishing, real social feeds/likes/follows, moderation, and server-protected asynchronous guessing remain Stage B/C work in TODO.md. No shared-service deployment or external upload was performed.

The daily cadence, weekly topic rotation, Asia/Seoul boundary, repeated submissions, and three-minute timer for every mode are initial implementation defaults, not team-approved permanent product decisions. Review them in T07 and the student pilot. Native browser unload-warning wording is controlled by the browser.

## Ongoing log

Append future work and verification here until the next project-week log is opened.

## 2026-10-13 — Layout, typography, and temporary title

User direction: make the layout, font, and narration more compact and robust; use sharp box edges; temporarily rename the project 낙서장.

- Replaced the accumulated theme overrides with one coherent stylesheet: neutral background, dark borders, square controls/cards/dialogs, smaller spacing, stronger Korean system typography, and restrained blue accents.
- Removed the decorative star, large prompt ornament, English slogan labels, shard metaphors, and poetic narration. Introduced a compact pencil wordmark and functional Korean headings/instructions.
- Renamed the visible title, navigation context, feedback, empty states, drawing counts, exported card branding, and downloaded filenames. Existing `jogak-*` storage keys stay in place to preserve saved work; historical logs remain unchanged.
- Reorganized the mobile view so topic controls precede the canvas, followed by memo/save controls. Desktop retains a practical canvas and slim control column.
- Updated README, Plan, TODO, and the smoke harness to match the current interface.
- Verification: JavaScript syntax passed; Chrome checks passed 25 cases each at 1280×900 and 390×844, plus native mouse/touch input and capture. Updated screenshots visually reviewed. These checks do not replace a physical-device or full accessibility audit.


## 2026-10-13 — Basic drawing tools and supporting pages

- Added a compact tool row for pen, bucket fill, spray, line, circle, and rectangle. Fill uses a bounded iterative connected-region search with color tolerance and same-color no-op handling. Spray continues while held, with brush width controlling radius; release/navigation/completion stops its interval.
- Shapes preview over the pre-gesture image and commit as one undo step; cancelled shapes restore that image. Circles drag from their center; rectangles support dragging in either direction. Existing drawing/timer/draft integration and active-pointer handling are retained.
- Added redo; a new action clears the redo stack. Undo and redo cover fills, spray gestures, shapes, and cleared canvases.
- Added #profiles with four explicitly fictitious profiles, live nickname/handle/interest search, reset/no-results states, and a profile detail containing sample artwork. There is no real-user search, sign-in, follow persistence, or backend.
- Added #about from the project outline: purpose for university students, drawing steps, current scope, developers 강준호/장도윤 at GIST and service-learning context, and planned social/game features.
- Extended navigation and responsive styling while keeping the square, compact 낙서장 direction. Scheduled scroll reset after route layout to keep navigation visible when opening fragment routes.
- Updated README, Plan, and TODO. T18/T29/T30 are complete; T13 and other backend tasks remain open.
- Verification: JavaScript syntax passed; 47 browser checks per desktop/mobile viewport (1280×900 and 390×844), native Chrome mouse/touch capture, and direct profile/introduction route visibility/overflow checks. Tests exercise fill containment/no-op/undo/redo; shape ghost-free preview, cancellation, commit, redo, circle outlines and reverse rectangles; stationary spray/release/undo; search/detail/empty/reset; and outline content. The first tool-test attempt exposed a harness coordinate/hidden-canvas issue; coordinates now refer to the visible canvas rather than relying on screen positions outside it.
- Screenshots reviewed for drawing, profile search, and introduction at desktop/mobile sizes. Fill can cross open outlines; near-color tolerance is 24 per channel. Physical-device and Edge checks remain open.
- Final navigation refinement: section scroll margins prevent native fragment jumps from hiding the header. Direct-route checks now also verify header visibility; desktop/mobile checks pass.

## 2026-11-10 — Optional community integration

User requested a brief explanation of external social-service requirements and preparation of what can be done locally.

- Prepared Supabase as the initial Auth/Postgres/private Storage integration alongside Vercel. Added backend/001_social.sql with profiles, artworks, likes, follows, ownership/visibility policies, unique identities/reactions, metadata constraints, and a 2 MB PNG bucket. Migration is intended for a new project and has not been executed.
- Added an optional dependency-free REST client and Community tab: email signup/login/logout, profile edits/search, deliberate private/public local-artwork import, cloud collection, public/profile artwork pagination, visibility changes, deletion, likes and follows. The blank public config disables online actions. Sessions are memory-only; local drawings/drafts are never automatically uploaded.
- Added backend/SETUP.md covering public configuration, Auth/Vercel settings, two-account direct-API access checks, signed URL expiry, orphan cleanup, and remaining operational work. Updated README/Plan/TODO without marking live-service tasks complete.
- Supabase plugin discovered and suggested, but no connection confirmed. No remote accounts, schema, uploads, GitHub pushes, or deployments were performed.
- Verification: syntax checks passed; 11 API contract/failure tests passed. Chrome passes 47 existing local checks and 14 simulated community checks at both 1280×900 and 390×844, plus native mouse/touch capture and route/overflow checks. The simulated backend covers auth/profile forms, private upload, explicit publication, plain-text rendering, likes/follows, upload failure/local preservation, and logout. These checks do not verify SQL or real Supabase behavior.
- Fixed the browser runner to enable the Page domain and to fail on DevTools disconnection/timeouts. Its prior unresolved-promise behavior could exit successfully before checks completed. Sandbox Chrome disconnected; the complete suite passed outside the sandbox using an isolated test profile.
- Remaining: connect a team-owned project, apply migration, configure public URL/key and Auth, live-test two identities including direct access attempts, and complete T17 before public operation. Cloud records remain separate from local journal/calendar; password recovery, authoritative topics, following/topic feeds, and moderation are pending.

## 2026-11-10 — Live-query and top profile-search fixes

- User completed initial deployment/setup and reported an ambiguous artworks/profiles embedding error. The gallery query now explicitly uses `profiles!artworks_owner_id_fkey` and `likes!likes_artwork_id_fkey`; no schema change or migration rerun is needed.
- Verified the corrected public artwork query against the user's configured Supabase project with an anonymous read-only request. It succeeded with zero public artworks at check time. No accounts or data were changed by the check; two-account access testing remains pending.
- Top Profile Search now uses the shared backend whenever configured, including initial search, debounce, stale-response rejection, empty/reset/error states, follow/unfollow, and owner-filtered public artwork navigation. Offline/unconfigured use retains the labeled preview. Both search surfaces use the same session and card renderer.
- Successful login is reported separately from failures to load profile/gallery data, and profile-page action errors appear on that page. Updated README, TODO and setup guidance.
- Syntax and 11 API contract checks passed. Chrome passed 47 local checks plus 22 mock-community checks at desktop/mobile sizes and native pointer checks. Regressions cover explicit joins, login success with a failed feed, top remote profile search/reset/empty/follow and selected-owner navigation. The fixture rejects ambiguous joins. The runner now forces a fresh document with a distinct test query to avoid a hash-navigation/reload race, and injects blank configuration for offline checks so it never accesses the live backend during browser tests.
