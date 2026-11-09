# Optional community backend

The local drawing app works without accounts or an internet connection. Community is disabled until configured. The repository contains a Supabase integration for a small pilot; no project, database, account, or deployment was created by these changes.

## Connection process

1. Create a Supabase project owned by the team. Vercel remains the frontend host. Supabase supplies Auth, Postgres, and image Storage. Another coding workspace is unnecessary.
2. In a **new project**, run [001_social.sql](001_social.sql) once in the SQL editor. It creates profiles, artworks, likes, follows, row access rules, and a private `drawings` bucket with a 2 MB PNG limit. It fails rather than replacing existing tables/buckets. This migration has not yet been executed against Supabase.
3. Enable email/password authentication and email confirmation. Set Auth's Site URL to the stable HTTPS Vercel production address; configure permitted return URLs for any test deployment. After email confirmation, return to Community and log in. Sessions are intentionally held in memory, so reloading requires login again. Configure email delivery/rate limits for the pilot. Password recovery and OAuth UI are not implemented.
4. Copy the project's public URL and **publishable key** (or legacy `anon` key) into [../social-config.js](../social-config.js). These are public browser configuration; committing them is expected. Never put a secret key, database password, or `service_role` key in this file or GitHub. Plain static HTML does not automatically receive Vercel environment variables: populate this file explicitly.
5. Deploy on Vercel: Root Directory `Doodler_project`, Framework `Other`, no build command, Output Directory `.`. Pushes to the configured production branch trigger deployments. Keep a stable hostname for local drawing history; browser storage belongs to each site address.
6. Complete the two-account checks below before inviting participants. The Supabase plugin lets the coding assistant help apply the migration and inspect the project. The app itself connects directly using public configuration; a ChatGPT plugin connection is optional for running it.

## Current behavior

- Community provides email sign-up/sign-in/logout, profile creation/editing, and real nickname/handle/bio search. Profiles and follow relationships are public. Emails stay in Auth, outside public profiles.
- Local saving never uploads. Save a profile, select a local drawing, then choose `나만 보기` (default) or `전체 공개`. The PNG, title, topic ID/day, mode, and caption are copied. A unique owner/source ID prevents duplicate imports. Local originals survive upload failure; parent-comparison metadata stays local.
- `클라우드 내 그림` shows uploaded artwork across devices after login. This collection is separate from the local journal, drafts, and weekly completion calendar; there is no automatic merge/sync.
- Public gallery and profile artwork views page through 12 items, newest first. Profile search returns at most 30 results. The top Profile Search tab uses real profiles when configured, supports follows, and opens a selected user's public artwork in Community. Without configuration it remains a labeled preview. The original Gallery remains an example; likes and follows in Community persist. A following feed, topic filters, and follower counts remain future work.
- Owners can change visibility or delete cloud artwork. Private image URLs expire after 60 seconds; previously issued URLs remain usable until expiry. Downloads cannot be recalled.

## Failures and operation

The client checks PNG size; Storage also enforces size/type limits. Busy states prevent concurrent UI actions. Files upload before metadata. Confirmed metadata rejection triggers best-effort file cleanup. A network timeout is ambiguous, so the file is retained in case the insert committed. Check the cloud collection before retrying; orphan files may require operator cleanup. Storage/database changes are not transactional.

Deletion hides metadata/likes first, then removes the image; failed file cleanup is reported. Account deletion must also remove the account's Storage folder through the Storage API: Auth deletion cascades database rows but does not remove Storage files. Account deletion, reporting/moderation, retention/backup procedures, and abuse/quotas remain operational prerequisites under T17. This is not yet a completed public social service.

## Verification

Run from `Doodler_project`:

```powershell
node --check script.js
node --check social-api.js
node --check social-ui.js
node --test tests/social-api.cjs
node tests/run.cjs
```

Chrome uses an isolated profile. The mock backend validates UI wiring, not PostgreSQL or Storage permissions.

Live acceptance is still pending. Use accounts A/B and the publishable key, never a service-role key:

1. Confirm both emails; create distinct profiles. Check unique handles, search, profile edits, logout, and that public API responses contain no email/password fields.
2. A uploads privately. B and a signed-out client cannot read metadata or obtain a signed URL, even with the known ID/path. Neither may update/delete A's record or overwrite/delete its file. Test direct REST calls as well as the UI.
3. A publishes. B and signed-out clients can view it. B can like/unlike and follow/unfollow. Duplicate requests cannot create duplicate rows. B cannot act on A's behalf. Private drawings cannot receive new likes.
4. A makes it private again. It disappears from B's views; old signed URLs expire after 60 seconds. Check direct requests as well as filtered lists.
5. Sign in as A on another device and open the cloud collection. Check deletion, 2 MB/MIME rejection, revoked/expired login, upload disconnection/retry, and file cleanup. Local drawings must remain intact.

References: [API keys](https://supabase.com/docs/guides/getting-started/api-keys), [API security](https://supabase.com/docs/guides/api/securing-your-api), [Storage access](https://supabase.com/docs/guides/storage/security/access-control), [Vercel builds](https://vercel.com/docs/builds/configure-a-build), [Vercel Git deployments](https://vercel.com/docs/git).
