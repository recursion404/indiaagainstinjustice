# Changelog

## 2026-08-29 - Admin Dashboard Backend Wiring

- Wired the redesigned admin dashboard to live report data for KPI cards, sidebar counts, workflow stage bars, public record rate, and most-active-stage summaries.
- Added client-side admin search across public ID, title, category, status, location, pincode, and report summary.
- Connected the moderation queue table to the active status filter and search results, with row selection preserved for the moderation editor.
- Added CSV export for the currently visible admin report queue.
- Added recent activity loading from `issue_updates`, with a safe empty state if the activity feed is unavailable.
- Added useful in-page feedback for dashboard utility controls and improved superadmin email validation before promotion.
- Made the admin dashboard fill the browser viewport edge-to-edge while keeping its internal app layout.

## 2026-08-29 - Separate Admin and Public Layouts

- Removed the public website header and footer from admin routes so the dashboard renders as a standalone admin workspace.
- Moved public pages into a `(public)` route group with their own layout so public URLs keep the same paths while admin routes stay fully separate.
- Kept the root app layout minimal to avoid mixing public website chrome with the admin dashboard shell.

## 2026-08-29 - Admin Dashboard Workspace Redesign

- Reworked the admin area into a dashboard-style operations workspace with a left sidebar, top utility bar, metric cards, workflow overview, and queue health panel.
- Preserved the existing moderation queue, superadmin promotion flow, save confirmation dialog, and success/error feedback behavior.
- Restyled the moderation queue and selected issue workspace so admins can scan report status, location, public ID, and date more easily.

## 2026-08-29 - PWA Install Support

- Added installable PWA metadata for India Against Injustice with standalone display, app scope, theme color, and home-screen icons.
- Added generated app icons for Android/Chrome install prompts and Apple touch icons.
- Added a lightweight production service worker for the main public shell routes.
- Added a Download App navigation button with install prompt support and browser fallback guidance.

## 2026-08-29 - Public Form Validation UX

- Added clearer field-level validation to the public report form for title, category, location, pincode, detailed notes, and photo uploads.
- Added character limits and visible counters for report title, report notes, volunteer intro text, and issue comments.
- Added field-level volunteer application validation for name, email, selected interest, and introduction length.
- Improved issue comment validation so signed-in users see specific guidance for empty, too-short, and too-long comments before posting.
- Removed the browser alert from report submission in favor of in-page success feedback.

## 2026-08-29 - Public Issue Detail Pages and Comments

- Replaced UUID-prefix issue URLs with SEO-friendly slugs that include the issue title, location, and public ID.
- Kept legacy `report-[uuid-prefix]` public issue links resolving for backwards compatibility.
- Added a public issue comments UI on each issue detail page.
- Added migration `20260829054423_0013_create_issue_comments.sql` so anyone can read comments on public issues, while only signed-in users can post comments as themselves.
- Aligned the local comments migration filename with the remote Supabase migration version so `supabase db push` no longer reports missing remote migration `20260829054423`.
- Fixed issue detail location rendering to use the current report fields instead of legacy traffic-only fields.

## 2026-08-29 - Public Published Issue Visibility

- Fixed public issue visibility for reports marked `published` from the admin moderation workflow.
- Added migration `0012_sync_public_report_status_policy.sql` to include `published` in the public RLS read policy while preserving the existing public statuses.
- Updated website public issue queries so `published` reports are treated as public alongside `verified`, `action_started`, `action_taken`, and `closed`.
- Confirmed the affected report `IAI-39cb6137` was saved as `published`, but hidden by the previous public read policy.

## 2026-08-28 - Admin Sign-In Timeout Feedback

- Added a 15-second timeout guard around admin sign-in, profile role checks, and moderation queue loading so pending Supabase requests no longer leave the UI stuck on `Signing in...`.
- Added clearer admin sign-in status and error panels for missing credentials, timeout, failed profile lookup, missing session, unauthorized account, and queue loading failures.
- Made the admin loader return an explicit success/failure result so sign-in always clears loading state even when profile or queue loading fails after authentication succeeds.
- Kept the existing Supabase authentication flow unchanged; this is a UX and recovery improvement around slow or blocked network responses.
- Verified the web production build succeeds with `npm run build` from `apps/web`.

## 2026-08-28 - Admin Moderation Save Feedback

- Added a custom confirmation dialog before `Save Moderation Decision` so admins can review the status/public/indexing changes before applying them.
- Added visible in-page moderation notices for saving, success, and error states so updates no longer feel silent.
- Included the saved report public ID and new workflow status in the success acknowledgement.
- Verified the web production build succeeds with `npm run build` from `apps/web`.

## 2026-08-28 - Profile Update Grant Migration

- Added migration `0011_reassert_profile_update_grant.sql` to document and replay `GRANT UPDATE ON public.profiles TO authenticated;`.
- Confirmed the existing migration chain already had superadmin RLS support in `0006`, profile update privileges in `0008`, report/public record mutation privileges in `0009`, and expanded report statuses in `0010`.
- Documented why the grant matters: PostgreSQL requires table-level privileges before RLS policies can permit a superadmin profile update.

## 2026-08-28 - Website Auth Navigation Restoration

- Restored global website authentication controls after the redesign changed `Navigation` into static links only.
- Reintroduced the signed-out `Sign in` link, signed-in profile badge, logout control, and admin dashboard link for admin/superadmin profiles.
- Kept `Navigation` as a links-only fragment inside the existing root layout header so the previous duplicate-header regression does not return.
- Verified the web production build succeeds with `npm run build` from `apps/web`.

## 2026-08-28 - Firebase App Hosting Web Structure

- Added `apps/web/apphosting.yaml` so Firebase App Hosting can read the web backend config from the same app-root pattern used by `abod-app`.
- Added an app-local `apps/web/package-lock.json` because Firebase App Hosting expects a dependency lockfile in the configured app root directory.
- Updated the web app's local shared package dependency to `file:../../packages/shared` so an app-root install can still resolve the monorepo shared package.
- Pinned the web `next` dependency to exact version `14.2.15` for App Hosting scanner compatibility.
- Updated the web `start` script to bind Next.js to Firebase's provided `PORT` with a local `3000` fallback, fixing App Hosting/Cloud Run health checks that require listening on port `8080`.
- Fixed TypeScript blockers exposed by production build: UI badge tone aliases, `StatCard` `className`, issue `customCategory`, sitemap typing, and `updatedAt` mapping.
- Verified `npm run build` from `apps/web` succeeds when network access to Supabase is available during prerendering.
- Verified `PORT=8080 npm run start` starts Next.js on `http://localhost:8080`.

## 2026-08-28 - Supabase Project Repointing

- Updated web and mobile Supabase environment files to use the new project URL `https://tnhedllrtdcuxvfqksxn.supabase.co`.
- Updated tracked web and mobile `.env.example` files with the new public anon key for the new Supabase project.
- Updated local ignored web and mobile `.env` files so development runs point at the same new project.
- Updated README Supabase project reference and setup URL.
- Updated local Supabase CLI temp metadata from the previous project ref to `tnhedllrtdcuxvfqksxn`.

## 2026-08-28 - Website Foundation Cleanup, IAI Route Canonicalization, and Header Fix

### Website UI foundation repair
- Started replacing the earlier mixed vanilla CSS and page-by-page Tailwind patchwork with a shared website UI foundation.
- Added reusable web UI primitives in `apps/web/src/components/ui.tsx` for page shells, section headers, cards, badges, buttons, inputs, empty states, notices and stat cards.
- Simplified the global stylesheet in `apps/web/src/app/globals.css` so the site no longer depends on fragile custom utility backports such as `container`, `band`, `card`, `button`, `muted`, `lead`, `timeline`, `engagement`, `actions`, `privatePanel`, `contentBody` and `issueMeta`.
- Kept the current orange/amber/slate visual theme because it already works well for the new India Against Injustice brand direction.

### Header and navigation regression fix
- Fixed the broken homepage header where the site brand rendered twice and overlapped the navigation.
- Root cause: `apps/web/src/app/layout.tsx` already owned the sticky site header, while `apps/web/src/components/Navigation.tsx` had been changed to render a second full `<header>` with another brand block and CTA.
- Updated `Navigation.tsx` to behave as a links-only navigation fragment again, leaving the root layout as the single header owner.
- Tightened root header layout spacing in `apps/web/src/app/layout.tsx` so the brand, nav pill and report CTA fit cleanly in one row.
- Removed a temporary `.codex_write_probe` filesystem access file left from debugging.

### India Against Injustice canonical website routes
- Added canonical `/report` route for civic issue reporting instead of relying on the old `/report-traffic-problem` path.
- Added canonical `/issues` and `/issues/[slug]` routes for reviewed public issue pages.
- Added canonical `/records` route for public civic records.
- Added canonical `/pledge` route for the citizen responsibility pledge.
- Converted old Pune Traffic URLs into redirects so existing links continue to work while the real website moves to the IAI information architecture:
  - `/live-traffic` redirects to `/issues`.
  - `/top-traffic-problems` redirects to `/records`.
  - `/report-traffic-problem` redirects to `/report`.
  - `/traffic-rules-pledge` redirects to `/pledge`.
  - `/traffic-issues/pune/[slug]` redirects to `/issues/[slug]`.
  - `/pune-traffic/[location]` redirects to `/issues`.

### SEO and public page structure
- Rebuilt the homepage around the broader India Against Injustice positioning instead of Pune-only traffic messaging.
- Added reviewed public issue detail pages with canonical metadata, Open Graph metadata and JSON-LD article structure.
- Updated the sitemap to include the new canonical website routes and public issue URLs.
- Updated the not-found experience so missing or unpublished issue records use the shared IAI page shell and clear public-record messaging.

## 2026-08-28 - Authentication Systems, Superadmin Core, Database Security, and Lifecycle Constraints

### Citizen Authentication & Sign Up Engine
- Built a premium, dual-state **Sign In / Sign Up Gate (`/login`)** with custom visual indicators and validation notices.
- Handled dynamic routing and role-based redirection to securely steer administrators and superadmins directly to the admin dashboard and standard citizens to the homepage.
- Developed a stateful, global client-side **Navigation Component (`apps/web/src/components/Navigation.tsx`)** that monitors user sessions and updates the UI dynamically:
  - Displays **"🔑 Sign In"** when unauthenticated on both desktop and mobile bottom navigation bars.
  - Displays a custom **"👤 [Full Name]"** badge and a **"🚪 Log Out"** button when authenticated.
  - Dynamically appends a secure **"🛡️ Shield"** link for admins/superadmins to access the moderation queue.

### Superadmin Promotions & SEO Desk Rebuild
- Integrated a premium **Superadmin System Settings Card** directly inside the moderation workspace to search and elevate any registered citizen profile to `'admin'` instantly using their email.
- Fully modernized the **SEO Publishing Desk (`/admin/content`)** using high-contrast Tailwind CSS cards, grid forms, markdown editors, and interactive Lucide icons.

### Volunteer Registry Database Foundation
- Added migration `0007_add_volunteer_requests_table.sql` registering the missing `volunteer_requests` table to support onboarding registration forms seamlessly.
- Enforced open `INSERT` policies to let anyone apply anonymously or authenticated, and limited `SELECT` views strictly to platform administrators.

### Database security, table-level grants, and check constraints
- Added migration `0008_grant_update_on_profiles.sql` granting `UPDATE` privileges on the `profiles` table to authenticated users to allow superadmins to execute role elevations securely under RLS.
- Added migration `0009_grant_all_on_tables_to_authenticated.sql` granting mutation privileges (`INSERT`, `UPDATE`, `DELETE`) on `reports` and `public_records` to authenticated users so that RLS can securely process administrator moderators.
- Added migration `0010_update_reports_status_check.sql` to expand the legacy `reports_status_check` constraint with all frontend issue statuses (`under_review`, `published`, `assigned`, `action_recorded`, `citizen_verified`, `resolved`), resolving constraint violations during status transitions.

## 2026-08-27 - Root CSS and Sub-Page Rebuilds, TypeScript & Geolocation Refactoring

### Web Sub-Page Rebuilds (Tailwind CSS v4 & Lucide Icons)
- Rebuilt **Top Traffic Problems (`/top-traffic-problems`)** from scratch with modern, premium interactive cards, unified shadows, and standard Lucide icons (`MapPin`, `ThumbsUp`, `Share2`).
- Rebuilt **Priority Polls (`/polls`)** with progress indicator bars using gorgeous Tailwind gradients, a clean creation form, and responsive layouts.
- Rebuilt **Rules Pledge (`/traffic-rules-pledge`)** with a split card interface showcasing civic safety checklists, verified citizen counters, and simplified form states.
- Rebuilt **Volunteer Onboarding (`/volunteer`)** with structured responsive forms, informative motivation sections, and custom validation notices.

### TypeScript, Imports & Dynamic Geography Refactoring
- Fixed all compilation issues across `/admin`, `/live-traffic`, `/top-traffic-problems`, `/page.tsx`, and `/traffic-issues/pune/[slug]/page.tsx` by replacing obsolete `.area` and `.city` references with the new dynamic geography attributes (`state`, `district`, `townVillage`, `pincode`).
- Declared the local `puneLocations` routing list inline in `/pune-traffic/[location]/page.tsx` to resolve a broken export in `@citizens-first/shared`.
- Safely exported the `IssueCategory` type within `@citizens-first/shared` and updated `categoryLabel` in the web library to handle safe lookups.
- Refactored `saveContentPost` database functions to use modern destructuring in place of deleting runtime object properties.

## 2026-08-21 - Report Streamlining, Anonymous Reporting, and Engagement Features

### Report Form Updates (Web & Mobile)
- Enabled anonymous issue reporting by removing the login requirement.
- Removed "Citizen landmark wording" and "Private address or landmark" fields to simplify the form.
- Removed the "Severity" input field.
- Made "Public summary", "Suggested solution", and "Prabhag number" (formerly "Ward number") optional fields.
- Made "Pincode" a mandatory field.
- Updated the order and list of issue categories.
- Added a custom text field that appears when the "Other" category is selected.
- Added a confirmation alert box that appears after a successful report submission.

### UI and Wording Changes
- Renamed the first navigation tab to "Report Traffic".
- Renamed the issues navigation tab to "issue list".
- Updated the pledge text to: "I will respect signals, avoid wrong-side driving, keep lanes clear, not block public transport stops and support safer Pune roads."
- Renamed the "Support" action on issues to "Upvote".

### Engagement Features
- Implemented a comment section for individual issues, allowing both anonymous and authenticated users to participate.
- Enabled poll creation from both the web and mobile app interfaces.
- Added social media sharing buttons (Facebook, X, LinkedIn) for issues, complete with a template message and issue link.

### Backend and Database
- Added migration `0014_new_categories_and_anon_reporting.sql` to update categories and schema for anonymous reporting.
- Added migration `0015_add_issue_comments.sql` to create the `issue_comments` table.
- Added migrations `0016_grant_table_privileges.sql`, `0017_fix_anon_rls_policy.sql`, and `0018_submit_issue_rpc.sql` to fix PostgreSQL table privileges and RLS policies for anonymous users, switching issue creation to a reliable `SECURITY DEFINER` RPC function.

## 2026-08-20 - Deployment and environment configuration

- Updated public Supabase environment examples for the current Supabase project.
- Updated project documentation to reference the current Supabase project URL.
- Added Expo/EAS Android production build configuration for Play Store internal testing.
- Added Android API level 35 build configuration through Expo build properties.
- Added Firebase Hosting configuration files for the Expo web export workflow.
- Added generated native Android/iOS build folders and local web build output paths to Git ignore rules.

## 2026-08-20 - Brand color implementation

- Updated the app theme to use the approved Pune Against Traffic Jams brand colors:
  - Navy Blue `#0B1F4B` for authority, navigation and primary actions.
  - Traffic Orange/Red `#F4511E` for errors and urgent states.
  - White `#FFFFFF` for clarity and content surfaces.
  - Green `#138A36` for solution, movement and positive states.
  - Indian Saffron `#FF671F` as a selective accent.
- Updated the website CSS variables to the same brand palette.
- Replaced the earlier earth-tone/cream visual system with a navy-dominant civic identity.
- Updated app inline success/error states to use the shared green and orange/red palette tokens.
- Updated website hero panel, buttons, badges, notices, stats and private review panels to use the approved brand colors consistently.

## 2026-08-20 - Traffic intelligence foundation

- Added migration `0013_traffic_intelligence_foundation.sql` as the first implementation slice for the expanded Pune Against Traffic Jams specification.
- Expanded the Supabase issue model with:
  - full traffic issue category coverage from the new specification
  - full workflow status coverage including verified, action started, action taken, duplicate, insufficient information and reopened
  - severity values: low, moderate, high and critical
  - traffic condition values: normal, moderate, heavy, severe and cleared
  - controlled location type values: chowk, road, area and landmark
  - citizen landmark wording, suggested solution, pincode and ward number
  - confirmation and not-observed counters
- Added foundational traffic intelligence tables:
  - `traffic_locations` for the road/chowk master database
  - `authorities` for assignable government/transport authorities
  - `issue_confirmations` for one citizen confirmation or not-observed response per issue
  - `traffic_observations` for historical traffic condition records
  - `issue_assignments` for authority assignment tracking
- Seeded initial authorities:
  - Pune Traffic Police
  - Pune Municipal Corporation
  - PMRDA
  - PMPML
  - Other Government Department
  - Joint Responsibility
- Seeded starter traffic locations:
  - Baner Radha Chowk
  - Yashada Chowk
  - Balewadi High Street
  - Wakad Bridge
- Added RLS policies for public active locations/authorities, admin management, issue confirmations and verified traffic observations.
- Added confirmation counter triggers so issue-level confirmed/not-observed totals stay database-backed.
- Updated shared TypeScript constants and types for expanded categories, workflow statuses, severity, traffic conditions, location kinds and confirmation counters.
- Updated the app report flow to capture and submit severity, traffic condition, location type, location name, citizen landmark wording, suggested solution, pincode and ward number.
- Updated the website report flow with the same expanded report fields.
- Updated public issue data mapping to include condition, severity, location metadata, suggested solution and confirmation counters.
- Added Confirm / Not observed actions on app issue cards and website public issue pages.
- Updated admin moderation to show the expanded workflow status list and richer report details while keeping private reporter data separate from public pages.
- Updated public issue and top-problems pages to display traffic condition, severity and reviewed location information.
- Added the website `/live-traffic` page with reviewed public traffic reports, live/verified/severe counts, condition/severity display and confirmation/not-observed counters.
- Added Live Traffic to website navigation, sitemap and homepage calls-to-action.

## 2026-08-16 - Admin role reconciliation

- Added migration `0012_reconcile_initial_admin.sql` for the case where the initial admin migration ran before the requested account/profile existed.
- The migration updates the existing profile for `ganeshpawar.me@gmail.com` to `admin` and restores the role-protection trigger immediately afterward.

## 2026-08-16 - Initial admin account

- Added migration `0011_promote_initial_admin.sql` to promote the existing `ganeshpawar.me@gmail.com` profile to the `admin` role.
- The migration matches the account through `auth.users` and updates only the corresponding `public.profiles` row.
- Existing role-escalation protection remains active for all non-admin users.

## 2026-08-16 - Website implementation pass

### Public website

- Replaced placeholder homepage issue cards with live, privacy-filtered Supabase issues.
- Replaced placeholder Top Traffic Problems cards with real public issue ranking by support count.
- Replaced the sample public issue page with dynamic `/traffic-issues/pune/[slug]` pages.
- Added dynamic issue metadata, canonical URLs, JSON-LD report data, public action history and noindex behavior for non-indexable issues.
- Updated the sitemap to include only public indexable issues; unpublished location placeholders are not added to the sitemap.
- Added live public polls with one vote per authenticated user and vote result bars.
- Added live pledge count and website pledge submission.
- Added a volunteer request form backed by Supabase.
- Added public content post pages for published SEO content.

### Website report journey

- Added website account creation and sign-in before report submission.
- Added report title, category, area, public summary, private address, browser location and photo upload.
- Website reports default to private `submitted` state and remain hidden from public pages until reviewed.
- Website media uploads use the existing private `issue-photos` Supabase Storage bucket.

### Admin website

- Added protected `/admin` moderation dashboard.
- Added moderation queue filters for every issue workflow status.
- Added controls for status, public visibility, sensitive flag, search indexing, authority name/reference, internal notes and rejection reason.
- Added public action updates for authority responses, recorded actions, citizen verification and resolutions.
- Added `/admin/content` SEO publishing desk for the FRD content types and SEO/social metadata fields.

### Database migrations

- Added `0008_admin_moderation_and_public_updates.sql` with issue update history, admin-only policies, publication fields and admin content/poll management policies.
- Added `0009_engagement_and_volunteer_workflows.sql` with one pledge per user, support read policy and volunteer requests.

### Verification note

- Source-level checks only were performed. No development server, browser session or automated test was started, following the manual-testing workflow.

## 2026-08-16 - Auth request minimization

This update removes repeated full-user auth requests while changing tabs or loading app data.

### Security and privacy

- Removed all feature-level calls to `supabase.auth.getUser()` from the app. Those calls requested the full authenticated user payload from `/auth/v1/user` whenever issue, poll, pledge, or profile data loaded.
- The app now passes the already-loaded `session.user.id` from the app shell into data helpers. Tab navigation no longer causes full user-profile fetches.
- Authentication bootstrap remains centralized in `App.tsx` through one persisted `getSession()` read and the auth state listener.
- Sign-in and sign-up profile upserts now use the user data returned directly by the authentication operation instead of issuing a second full-user request.
- No full auth response is logged by the app.

### Functional areas updated

- Report submission uses the current session user ID for `reporter_id` and private photo storage paths.
- Issues uses the current session user ID for loading owned reports, checking support/share state, adding support, removing support, and recording a share.
- Polls uses the current session user ID for loading the signed-in user's selected vote and recording votes.
- Pledge submission uses the current session user ID.
- Profile report loading uses the current session user ID.

### Verification note

- Source-level call-site verification was completed without starting the app or running automated/manual tests. Please verify the Network panel manually and confirm that tab changes no longer request `/auth/v1/user`.

## 2026-08-16 - App live functionality pass

This update continues replacing placeholder app behavior with Supabase-backed user journeys. The implementation follows the dependency chain of the app: users authenticate first, then they can report issues, view their own report history, vote in polls, take pledges, support issues, and share issues.

### Issues screen live data correction

- Removed sample issue fallback from the live Issues screen.
- Issues screen now starts empty and only renders real public Supabase rows.
- Added empty state explaining that reports appear after review/publication.
- Added loading/status copy for live Supabase issue fetches.
- Added current user's supported issue lookup.
- Added current user's shared issue lookup.
- Added selected UI state for issues already supported by the current user.
- Added selected UI state for issues already shared by the current user.

### Support behavior

- Changed issue support from demo increment behavior to a real toggle.
- First tap inserts `issue_supports`.
- Second tap removes that user's `issue_supports` row.
- Counter updates optimistically in the UI after the database operation succeeds.
- Added migration policy so citizens can remove their own support rows.
- Support count remains database-backed by the existing support counter triggers.

### Share behavior

- Changed issue sharing so one signed-in user can record at most one share per issue.
- Added `user_id` to `issue_share_events`.
- Added unique constraint on `(issue_id, user_id)`.
- Replaced anonymous share insert policy with authenticated user share insert policy.
- Added policy so citizens can read their own share events.
- Share count remains database-backed by share event trigger.
- UI now shows `Shared` after the current user has shared an issue.

### Polls

- Replaced the local-only polls screen with live Supabase polls.
- Added `apps/mobile/src/lib/polls.ts`.
- Added `fetchPublicPolls()` to load public polls and their options.
- Added `voteInPoll()` to record or update a signed-in user's vote.
- Added inline poll status messages for loading, voting, success, and errors.
- Added Profile shortcut when a signed-out user tries to vote.
- Added vote result bars for each option.
- Added total vote count display per poll.
- Added selected-option state for users who already voted.
- Added migration `0005_live_polls.sql`.
- Added `vote_count` to `poll_options`.
- Added policies so signed-in citizens can read and update their own poll vote.
- Added poll vote insert, update, and delete triggers to keep option counts accurate.
- Added a starter public poll:
  - `What should Pune fix first to reduce traffic jams?`

### Profile and user report history

- Added `fetchMyIssues()` to load reports submitted by the current signed-in citizen.
- Updated Profile so it is no longer only an account screen.
- Profile now shows:
  - signed-in email
  - report action shortcut
  - user's submitted reports
  - report public ID
  - report area
  - report status
- Added empty state when the user has not submitted reports yet.
- Added error handling when report history fails to load.

### Pledge

- Added `fetchPledgeCount()` to show the live number of pledge records.
- Updated pledge screen to require sign-in with an inline Profile shortcut.
- Replaced alert-only pledge errors with visible inline status.
- Added live pledge count display.
- Added success state after a pledge is recorded.

### Issue sharing

- Added `recordIssueShare()` for issue share events.
- Added a Share button to issue cards.
- Added native share sheet support through React Native `Share`.
- Kept shares separate from supports, matching the FRD requirement.
- Added migration `0006_issue_share_counters.sql`.
- Added trigger to increment `traffic_issues.share_count` whenever an `issue_share_events` row is inserted.

### Current testing note

- Runtime testing was intentionally not run by the assistant in this pass because manual testing is being handled by the project owner.
- Changes were made in small slices so the app can be manually tested journey by journey.

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
