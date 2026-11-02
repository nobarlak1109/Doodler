# Project plan

Implementation status and prioritized future work are tracked in [TODO.md](TODO.md). This plan describes the intended product; some basic functions are not yet implemented in the local prototype.

## Project outline
- Project name: 낙서장 (temporary working title) - Online doodle program
- Objective: Imagination boost of university stdent by simple creative activity
- Developed by: 강준호, 장도윤(GIST students taking service learning course)
## Basic functions
### Doodle functions
- Online drawing(Mouse in pc, touch in mobile)
- Time limit(For simple activity)
- Regular update of topic(for steady participation)
### Social functions
- Gallery storing past works
- Profile showing others and their gallery
- Follow, Like functions like Social Media
## Optional functions
- More drawing tools like drawing programs
- More social functions(Group, repost, awarding)
- Games that can generate interest(Drawing quiz, Doodle contest)

## Reference-informed development direction

The References folder collects related or potentially trendy experiences for discussion. The images show selected screens, not complete product specifications or evidence of current popularity. The ideas below are proposed adaptations for this project, based on those screens and our objective.

The current format is **one fixed topic → three-minute drawing → local collection**, with a separate sample gallery. The proposed format is **a changing shared prompt → a short creative challenge → a saved daily record → optional sharing and playful interaction**. Keep free drawing as the main activity so that participation does not require guessing correctly or drawing skillfully.

### Comparison and adaptations

| Reference | Useful idea from the reference | Current basic format | Proposed adaptation | Scope |
| --- | --- | --- | --- | --- |
| 퀵드로우 image | A clear drawing prompt with a quick start, completion, and skip action | One fixed garden topic with a timer | Add a short prompt card and an optional warm-up prompt that can be skipped; keep the daily shared prompt consistent | Local prototype first |
| 워들 image | A compact challenge with visible progress and an easily recognized result | Drawings are saved without a daily participation record | Introduce a daily topic, calendar of completed days, and a shareable result card containing topic/date/artwork; avoid scoring drawing quality | Local prototype first |
| 시맨틀 image | Repeated attempts with feedback that helps the next attempt | Each drawing is a standalone activity | Offer optional creative variations such as “draw the same idea using three shapes”; allow another attempt and compare versions side by side | Local experiment; no AI required |
| 셋로그 image | A personal/social record organized around moments, with lightweight reactions | Local artwork grid and disconnected sample gallery | Turn the collection into a dated drawing journal with an optional one-line caption; later add a feed of friends' drawings for the same topic | Local journal first, shared feed later |
| 캐치마인드 image | Drawing becomes a shared guessing activity | No interaction around the meaning of a drawing | Add an optional asynchronous “guess my doodle” mode with a chosen word, hidden answer, and answer reveal; consider live rooms only after validating interest | Shared-service experiment |

The filename 퀵드로우 is treated as the prompt-based drawing reference supplied by the team. The supplied screen does not establish an AI recognition requirement. Likewise, the 시맨틀 adaptation uses creative constraints rather than assuming a model can objectively score imagination.

### Proposed participant experience

1. Open the drawing page and see today's prompt, a brief invitation, and the three-minute rule. Example topic: “A garden on another planet.”
2. Start directly, or try a separate optional warm-up. Skipping a warm-up does not replace the shared daily topic.
3. Draw with the existing simple tools. An optional creative constraint is shown before starting a variation, never imposed halfway through a session.
4. Finish and review the artwork. Add a short caption if desired. Saving locally remains available without an account; publishing is an explicit action when the shared service exists.
5. See the artwork in the personal journal and the day's completion marker. Multiple drawings are allowed; the first completed drawing marks the day complete.
6. Optionally make a variation, export a result card, or browse the same-topic gallery. In the shared service, react to other drawings or follow their creators.
7. Enter guessing mode separately when desired. Keep the daily drawing flow short even after games are added.

### Implementation stages

#### Stage A — Evolve the existing offline prototype

Build on index.html, script.js, and style.css; no framework migration is required for this stage.

- Complete the reliability work in TODO.md before extending the drawing-session behavior.
- Introduce topic records with stable IDs, titles, scheduled dates, and optional creative constraints. Use a shared Asia/Seoul day boundary as the proposed default, pending T07 agreement.
- Capture the session's topic at its start. A midnight topic change must not relabel an unfinished or saved drawing.
- Extend artwork records with topic ID, optional caption, activity mode, and optional parent artwork ID for variations. Keep existing artwork readable; its original garden title must not be assigned today's topic.
- Add the prompt card, optional warm-up, dated journal/calendar, variation comparison, and downloadable result card. Keep progress local and explain that it is specific to this browser.
- Show a warm-up as practice and exclude it from daily completion. Derive completion from saved daily-mode artwork so deletion does not leave misleading progress markers.

Acceptance: two different scheduled days show their respective prompts; old artwork keeps its topic; warm-ups do not mark a day complete; repeated daily drawings produce one completion marker; variation links and captions survive reload; exported cards contain the chosen artwork and its original topic/date.

#### Stage B — Connect the activity to a shared community

Implement the backend and operational prerequisites already tracked in T12–T17.

- Serve authoritative topics and day boundaries so devices share the same challenge.
- Publish artwork with its topic and caption; offer a same-topic feed and a following feed with pagination.
- Provide profiles, likes, follows, and deletion/reporting controls. Default gallery ordering should allow new participants to be seen rather than relying only on popularity.
- Keep personal saving distinct from public publishing. Explain visibility before publication and offer deliberate import of old local artwork.

Acceptance: two users can see and react to published artwork for the same topic, private artwork stays private, and failed publication leaves the local drawing available to retry.

#### Stage C — Validate playful interaction

- Start with asynchronous guessing: a creator chooses a word from a curated list, draws, and publishes in guessing mode. Store the secret answer separately from public artwork responses; validate guesses on the server.
- Let viewers submit a limited number of guesses and reveal the answer after solving or giving up. Define answer normalization and accepted alternatives before implementation.
- Measure whether guessing encourages drawing and friendly interaction during the pilot. Keep a basic prototype small: no chat, prizes, or live rooms are needed initially.
- Consider live rooms, contests, group prompts, or automatic recognition only if the pilot establishes a need and the team can support their implementation and operation.

Acceptance: the answer is absent from public metadata before reveal, alternative accepted spellings behave consistently, and guessing mode does not change the ordinary daily drawing flow.

### Priorities and decisions

Recommended first feature release: **daily prompt + drawing journal + daily completion + artwork/result export**. Then test creative variations and warm-ups with students. Add shared social features after the local participation loop is useful; asynchronous guessing follows the shared-service foundation.

Open decisions: final project name, topic cadence and curation, time-limit policy for each mode, account model, public visibility defaults, and pilot success criteria. These proposals do not set team commitments or deadlines. Use TODO.md for task status and agreed decisions.

## Current implementation checkpoint — Week 2

The local Stage A flow is available and has passed automated Chrome desktop/mobile checks. Details and verification are recorded in [Logs/Week_2.md](Logs/Week_2.md); the original functions are captured in [Logs/Week_1.md](Logs/Week_1.md). Seven topics rotate weekly at Asia/Seoul midnight; practice and variation remain optional. These are adjustable starting defaults pending team/pilot review. Stage B/C shared-service and guessing work remains planned in TODO.md.

## Visual direction — current user preference

Use the temporary name **낙서장**. Favor a compact drawing workspace with square corners, stronger system typography, clear borders, restrained color, and short functional Korean copy. Avoid shard metaphors, decorative slogans, and oversized introduction cards. Keep the historical weekly logs as records of their respective milestones.

## Basic tools and supporting pages — 2026-10-13

The local workspace now includes bucket fill, spray, line/circle/rectangle outlines, and redo. Profile search is a clearly labeled fixture-data preview with searchable nicknames, handles, interests, and sample artwork. The introduction page presents the original project objective and team, use instructions, current local scope, and planned social/game features. Real identity, public profiles, and follows remain Stage B work.
