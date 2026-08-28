# Citizens First Pune

Citizen-first traffic reporting platform for the `Pune Against Traffic Jams` campaign.

## Stack

- `apps/web`: Next.js public website for SEO, issue pages, location pages, polls, pledge, and admin-facing publishing screens.
- `apps/mobile`: Expo React Native citizen app for reporting, photos, support, pledges, and notifications.
- `packages/shared`: Shared TypeScript types and validation constants.
- `supabase`: Database migrations, storage policies, and backend setup.

## Supabase

The project reference from the current anon key is:

```txt
tnhedllrtdcuxvfqksxn
```

Use this URL in local env files:

```txt
https://tnhedllrtdcuxvfqksxn.supabase.co
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create app env files from the examples:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
```

3. Start the web app:

```bash
npm run dev:web
```

4. Start the mobile app:

```bash
npm run dev:mobile
```

## Product Principles

- Public SEO pages must never expose mobile numbers, private addresses, internal notes, or sensitive citizen information.
- Citizen reports should be labeled as citizen reports until verified.
- Citizen support count and social share count are separate metrics.
- Location pages should contain genuinely useful local information before they are indexed.
