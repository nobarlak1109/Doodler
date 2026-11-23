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

## 2026-11-10 — Online deployment and setup record

### Hosting and service roles

| Service | Role | Connection |
| --- | --- | --- |
| GitHub | Stores project source and updates | Connected to Vercel for production deployments |
| Vercel | Hosts the HTML, CSS, and JavaScript website | Serves the site at https://doodler-project.vercel.app |
| Supabase | Provides authentication, profiles, artwork metadata, image storage, likes, and follows | The browser connects using the project URL and publishable key |

Supabase does not require a GitHub connection for this implementation. No additional coding workspace is needed. A Supabase plugin connection for assistant access is separate from the website's backend configuration and has not been confirmed.

### Deployment sequence

1. Pushed the project to GitHub and connected the repository to Vercel. The user reported completing the initial deployment.
2. Used the static-site deployment settings: Root Directory `Doodler_project`, Framework Preset `Other`, empty Build Command, and Output Directory `.`.
3. Created a Supabase project. The user reported completing the first three setup steps, including the prepared database setup through `backend/001_social.sql`. The assistant did not execute the migration or independently audit the deployed schema.
4. Explained that Supabase Auth's Site URL should be the production base address, `https://doodler-project.vercel.app`. The `/#mine` fragment selects the local drawing-history screen and is omitted from the Site URL. Email/password login, email confirmation, and Auth URL settings were included in the setup instructions; a full live authentication check remains pending.
5. Located the Supabase project URL through the project's Connect dialog and the publishable key through Connect or Settings → API Keys. The user confirmed editing `social-config.js` with the public connection settings. Secret/service-role keys are not browser configuration.
6. Explained that pushing the updated configuration to Vercel's production branch triggers a new deployment. The user subsequently tested the deployed site and reported a gallery query error and the remaining example profile page.
7. Corrected the artwork query's ambiguous profile relationship and connected the top Profile Search page to real backend profiles. The user confirmed updating the site after receiving these fixes. Post-update production behavior has not yet been independently rechecked.

### Issue encountered and resolution

The deployed Community screen showed:

> Could not embed because more than one relationship was found for 'artworks' and 'profiles'

The query now explicitly selects the artwork owner's profile using `profiles!artworks_owner_id_fkey(display_name,handle)` and its likes using `likes!likes_artwork_id_fkey(count)`. This is a frontend query correction; rerunning the SQL migration is unnecessary. A gallery-loading failure also no longer obscures successful login.

When Supabase is configured, the top `프로필 찾기` page now searches saved real profiles and supports follow/unfollow and viewing a selected person's public drawings. Without configuration, it retains its labeled example preview. The original Gallery tab remains an example; the real shared gallery is in Community.

### Verification recorded

- The corrected anonymous public-artwork query succeeded against the configured Supabase project, returning zero public drawings at the time of the check.
- JavaScript syntax checks and all 11 API contract/failure checks passed.
- Chrome passed 47 drawing checks and 22 simulated community checks at both desktop and mobile sizes, plus native pointer checks.
- These automated community checks use a mock backend. They do not establish live authentication, file-storage permissions, or two-account isolation.

### Remaining live acceptance

- Create and confirm two test accounts, then verify login, profile saving/search, public artwork uploads, likes, and follows.
- Verify through both UI and direct API requests that another account and signed-out visitors cannot read private artwork or modify another user's records/files.
- Check cloud history from another device, visibility changes, signed URL expiration, deletion/file cleanup, and failed-upload retry.
- Keep local history separate from cloud history: existing drawings and drafts are browser-specific and are uploaded only through an explicit user action.
- Complete reporting/moderation and other operational work tracked under T17 before a wider public launch.

Detailed setup instructions remain in [backend/SETUP.md](../backend/SETUP.md). This entry records the recent deployment process and the user's update confirmations; it does not mark all live social acceptance checks complete.

## 2026-11-16 — Separate daily-topic list and automatic refresh

- User requested daily topic updates from a separate, extendable list containing 10 arbitrary test topics.
- Moved the seven embedded topic records into topics.js and added an underwater library, a moon picnic, and a robot chef. Each record has a permanent ID, Korean title, and description. Production and smoke-test HTML load the list before script.js using deferred classic scripts, preserving direct-file/offline use without fetching JSON.
- Kept deterministic date-based selection in dailyTopic(day). One topic is used per Asia/Seoul day; the ten entries repeat every ten days. Replaced the anonymous 30-second poll with updateDailyTopic() and scheduleDailyTopicUpdate(): a timer for the next Korean midnight plus immediate focus/visibility checks after backgrounding or sleep. The weekly calendar refreshes even when practice/variation or an active drawing retains its topic.
- Active drawings (including a started session cleared to blank), restored drafts, and saved artwork keep their original topic/day. Existing first-stroke selection and historical artwork handling remain intact.
- README documents the record format, extending the list, script load order, and deployment. List length/order changes may change today's and future selections; saved/session metadata is preserved. Updated Plan and T08/TODO evidence. Logs/Week_1.md was not edited.
- Verification: node --check topics.js and node --check script.js passed. node tests/run.cjs passed 58 local drawing/topic checks and 22 simulated community checks at each of 1280×900 and 390×844, plus native mouse/touch capture and direct-route/layout checks. Eleven new checks cover topic records, rotation/repetition, extension, midnight scheduling/rendering, focus/visibility catch-up, active/cleared-session preservation, and practice/variation isolation. Chrome initially disconnected in the sandbox; rerunning outside it passed with the runner's isolated temporary profile.
- Limitations: selection follows the device clock and the deployed static list, rather than a server-authoritative schedule. Browsers may defer midnight timers in background tabs; focus/visibility checks catch up on return. Extending the deployed list requires updating topics.js and reloading the page. Physical-device, Edge, accessibility, and live two-account service acceptance remain outstanding. No deployment or backend changes were performed.

## 2026-11-16 — Everyday-life topic expansion

- User revised the original ten titles/descriptions and requested an analysis of their direction, expansion to fifty topics, and IDs matching the new titles.
- The revised set favors familiar routines, autobiographical memories, preferences, and simple imagined choices. Short Korean titles and direct questions invite a personal scene, object, or feeling that can be drawn within the existing three-minute activity. The extension follows that direction with everyday belongings/places, childhood and school memories, food and sensory preferences, relationships, small achievements, and attainable wishes.
- Preserved all ten user-authored titles/descriptions and their order. Corrected eight mismatched IDs (for example planet-garden → dream-destination and robot-chef → toughest-exam); sound-shape and future-window already fit their titles. Appended forty new prompts with descriptive unique IDs, bringing the catalog to exactly fifty topics and the rotation to fifty days.
- Updated the existing browser checks to derive the rotation length, wraparound date, and appended-topic position from the catalog size. Further list extensions no longer require replacing hardcoded ten-topic assumptions. No drawing/session or storage behavior was changed; existing saved artwork and drafts retain their stored IDs and titles rather than being relabeled.
- Updated README, Plan, and TODO to reflect the fifty-topic catalog and curation direction. Preserved Logs/Week_1.md.
- Verification: node --check topics.js and node --check script.js passed. A direct catalog validation confirmed exactly fifty entries, unique IDs and titles, ID format, and nonempty descriptions. node tests/run.cjs passed 58 drawing/topic checks and 22 mock-community checks at both desktop/mobile sizes, plus native pointer capture and direct-route/layout checks, using an isolated temporary Chrome profile.
- Outstanding limitations remain those recorded above: list edits can change the current/future date selection, topic selection uses the device clock, and deploying the catalog requires updating the hosted file and reloading. Historical records are not migrated to the renamed catalog IDs. No deployment or backend changes were performed.

## 2026-11-23 — Shared feedback banner

- Added one shared banner before the navigation header, visible above all six app pages. Included the requested Korean title and invitation verbatim, with the survey link on its own line.
- The Google Forms link opens in a new tab with noopener/noreferrer and a visible Korean new-tab hint, keeping the drawing page available. Used a labeled aside, keyboard focus styling, and responsive spacing/link wrapping.
- Updated README and TODO; preserved Logs/Week_1.md. Browser screenshots were refreshed by the existing runner.
- Verification: node --check script.js passed. node tests/run.cjs passed 58 drawing/topic checks and 22 mock-community checks at both desktop and mobile sizes, native pointer capture, and existing direct-route/layout checks. Visually checked the mobile banner screenshot. Chrome disconnected inside the sandbox; the approved rerun outside it passed with an isolated temporary profile.
- No deployment or backend changes were performed. The external form was linked as supplied; no survey response was submitted.
