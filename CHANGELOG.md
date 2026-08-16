# Changelog

## 2026-08-16 - Initial Citizens First Pune platform scaffold

This release creates the first working foundation for the Citizens First Pune traffic reporting platform. The project is structured as a monorepo with a React Native app, a Next.js SEO-focused website, shared TypeScript types, and Supabase migrations for the backend.

### Project structure

- Added root npm workspace configuration.
- Added shared TypeScript configuration.
- Added root README with setup instructions and project principles.
- Established naming convention:
  - `app` means the React Native / Expo citizen app.
  - `website` means the Next.js SEO-focused public website.
- Added workspace scripts:
  - `npm run dev:mobile` starts the app.
  - `npm run dev:web` starts the website.
  - `npm run typecheck` runs typechecks across workspaces.

### App - React Native / Expo

- Created the Expo app under `apps/mobile`.
- Added a local `index.js` entrypoint that registers `apps/mobile/App.tsx`.
- Fixed the Expo workspace entrypoint issue where `expo/AppEntry.js` tried to resolve `../../App` from the hoisted root `node_modules`.
- Added Expo Web support dependencies:
  - `react-native-web`
  - `@expo/metro-runtime`
- Added app dependencies for Supabase and native capabilities:
  - `@supabase/supabase-js`
  - `@react-native-async-storage/async-storage`
  - `react-native-url-polyfill`
  - `expo-image-picker`
  - `expo-location`
  - `expo-status-bar`
- Added iOS and Android permissions for:
  - camera
  - photo library
  - location

### App navigation and user journey

- Added a bottom-tab app shell with:
  - `Report`
  - `Issues`
  - `Polls`
  - `Pledge`
  - `Profile`
- Added a clearer dependency-based journey:
  - users must create an account or sign in from `Profile`
  - after sign-in, users can submit traffic reports
  - signed-in users can support issues and take pledges
- Added session state at the app shell level using Supabase auth session listeners.
- Passed session state into screens that depend on authentication.
- Added navigation from `Profile` back to `Report` once the user is signed in.
- Added navigation from `Report` to `Profile` when a user tries to submit without being signed in.

### App authentication

- Added email/password signup.
- Added email/password signin.
- Added signout.
- Added persistent Supabase session storage with React Native AsyncStorage.
- Added profile upsert after signup/signin.
- Added inline signup/signin status messages.
- Added clear validation for:
  - full name during signup
  - email
  - password
  - minimum password length
- Added handling for Supabase email confirmation:
  - if signup succeeds but no session is returned, the UI tells the user to confirm email and then sign in.
- Replaced fragile native alert-only auth feedback with visible inline status messages for Expo Web and mobile.

### App report flow

- Added a stateful traffic report form with:
  - problem title
  - area
  - category
  - public summary
  - private address or landmark
  - camera photo
  - photo library selection
  - current location
- Added client-side validation for required report fields.
- Added visible inline report status:
  - signed-out state
  - missing required fields
  - submitting state
  - success state with generated public report ID
  - Supabase error state
- Added report submission service that writes to Supabase `traffic_issues`.
- Added generated public IDs in `PUN-XXXXXX` format.
- Added generated slugs from area, title, and public ID.
- Added optional latitude and longitude capture.
- Added optional photo upload to Supabase Storage after issue creation.
- Added image preview after selecting or capturing a photo.

### App media handling

- Added Supabase Storage upload support for issue photos.
- Added private `issue-photos` storage bucket through migration.
- Added storage paths scoped by authenticated user ID and issue ID.
- Added `issue_photos` metadata row creation after storage upload.
- Kept uploaded photos private by default.
- Added storage policies so public reads are only allowed for photos that are explicitly approved and attached to safe public issues.

### App issues screen

- Added reusable `IssueCard` component.
- Added reusable `Metric` component.
- Added sample public issues for empty/local states.
- Added live fetch for public issues from Supabase.
- Added graceful fallback to sample issues when no public Supabase issues are available.
- Added issue search by title, area, and summary.
- Added local support toggling for sample issues.
- Added real Supabase support insertion for live issues.
- Added duplicate support handling.

### App pledge screen

- Added traffic rules pledge screen.
- Added pledge name input.
- Added Supabase-backed pledge submission for signed-in users.
- Added clear error if the user tries to pledge without signing in.

### App polls screen

- Added first poll screen shell.
- Added local option selection.
- Prepared UI direction for future live Supabase poll voting and results.

### Website - Next.js SEO-focused site

- Created the Next.js website under `apps/web`.
- Added global layout, navigation, footer, styling, and metadata.
- Added homepage for Citizens First Pune / Pune Against Traffic Jams.
- Added SEO-oriented public routes:
  - `/`
  - `/report-traffic-problem`
  - `/top-traffic-problems`
  - `/volunteer`
  - `/polls`
  - `/traffic-rules-pledge`
  - `/traffic-issues/pune/[slug]`
  - `/pune-traffic/[location]`
- Added sample public issue page with JSON-LD structured data.
- Added generated `robots.txt`.
- Added generated `sitemap.xml`.
- Added 404 page.
- Added Open Graph and Twitter metadata.
- Added canonical metadata for sample issue page.
- Added noindex behavior for location pages until useful local content exists.
- Added privacy-first copy explaining that public pages must not expose sensitive citizen data.

### Shared package

- Added `@citizens-first/shared`.
- Added shared constants and types for:
  - issue categories
  - issue statuses
  - Pune location slugs
  - public issue shape
- Shared types are used by both the app and website.

### Supabase migrations

All Supabase database and storage changes are migration-only. No manual dashboard-only schema changes are represented in the codebase.

#### `0001_initial_schema.sql`

- Added initial database schema.
- Added enum `issue_category`.
- Added enum `issue_status`.
- Added `profiles`.
- Added `traffic_issues`.
- Added `issue_photos`.
- Added `issue_supports`.
- Added `issue_share_events`.
- Added `content_posts`.
- Added `polls`.
- Added `poll_options`.
- Added `poll_votes`.
- Added `pledges`.
- Enabled row-level security on all public tables.
- Added public-safe issue read policy.
- Added authenticated citizen issue submission policy.
- Added citizen read-own-issue policy.
- Added safe public photo metadata read policy.
- Added published content read policy.
- Added public poll read policies.
- Added authenticated poll vote policy.
- Added authenticated issue support policy.
- Added public share-event insertion policy.
- Added pledge read and authenticated pledge insert policies.
- Added `updated_at` trigger function.
- Added update timestamp triggers for issues and content posts.

#### `0002_profile_and_issue_write_policies.sql`

- Added authenticated citizen profile creation policy.
- Added authenticated citizen profile read policy.
- Added authenticated citizen profile update policy.
- Added authenticated issue photo metadata insert policy for the user's own issues.

#### `0003_issue_photo_storage.sql`

- Added private Supabase Storage bucket `issue-photos`.
- Added upload policy scoped to authenticated user folder.
- Added authenticated read policy for a user's own uploads.
- Added public read policy only for approved public issue photos.
- Added update policy for a user's own photo objects.
- Added delete policy for a user's own photo objects.

#### `0004_issue_support_counters.sql`

- Added trigger function to increment issue support count.
- Added trigger function to decrement issue support count.
- Added insert trigger on `issue_supports`.
- Added delete trigger on `issue_supports`.

### Environment setup

- Added website env example:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SITE_URL`
- Added app env example:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Added local app env file for development.
- Confirmed `.env` files are ignored by Git so local secrets/config do not get committed.

### Fixes made during manual testing

- Fixed missing app env variables causing:
  - `Missing Supabase public environment variables.`
- Fixed Expo app entrypoint resolution error:
  - `Unable to resolve "../../App" from "node_modules/expo/AppEntry.js"`
- Fixed Expo Web dependency resolution error by adding browser runtime dependencies.
- Improved report submission feedback so clicking `Submit report` no longer appears silent when the user is signed out.
- Improved signup feedback so missing full name, missing email, missing password, and short password errors appear directly in the UI.
- Clarified the product journey:
  - account first
  - then report
  - then support, pledge, and future poll voting

### Known current state

- The app is functional enough for manual auth/report-flow testing after migrations are applied.
- Report submission requires a signed-in user.
- If Supabase email confirmation is enabled, users must confirm email before sign-in works.
- Report photos upload to Supabase Storage only after the traffic issue row is created.
- Public issue listing fetches only issues marked `is_public = true` and `is_sensitive = false`.
- Newly submitted reports default to private/review state until an admin/publication flow is added.
- Polls UI is present but still local-only.
- The website has SEO routes and static/sample content but is not yet fully connected to live Supabase content.
- npm audit currently reports transitive dependency vulnerabilities from the Expo/React Native dependency tree. No forced audit fix was applied because that can introduce breaking upgrades.

### Next recommended implementation steps

- Add admin review/publishing workflow for reports.
- Add live poll fetch, vote submission, and results.
- Add public issue detail screens in the app.
- Add user-submitted issue history in Profile.
- Add website live data fetching for public issues.
- Add website admin/content management pages.
- Add report photo moderation and public approval controls.
- Add redirect and analytics/search-console setup for production SEO.
