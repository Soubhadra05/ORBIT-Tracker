# ORBIT Tracker

A responsive React/Vite productivity workspace with a calm, Vercel-inspired black UI and Geist typography. It is intentionally neutral: use it for work, learning, personal goals, projects, or anything else.

## Included

- Vercel-inspired black theme with Geist Sans typography and circular ORBIT logo
- Responsive dashboard with clickable progress, time, due-today and momentum cards
- Task creation, search, status/priority filtering, completion state, inline editing and deletion
- Tasks can be created with only a task name; subject, dates, times, minutes and description are optional
- Completed tasks automatically move below active tasks and receive a strike-through
- Subjects/projects with descriptions, progress tracking and per-subject task views
- Per-subject PDF notes/resources stored locally in IndexedDB
- Calendar with Today, 3 Days, Month and Year views; dates are selectable and can create tasks
- Focus timer with 1/2/3 Pomodoro presets, custom duration, completion sound and manual session logging
- Settings for theme, density, notifications, focus preferences, account and privacy/sync
- Local demo mode works immediately without a backend
- Google login + Supabase cloud sync + Google Calendar event sync
- Custom subject categories with local persistence; cloud schema accepts any category
- Task scheduling with optional start date, end date, start time and end time
- Automatic Minutes calculation when a complete start/end time range is provided
- Smooth, compact time-selection dropdown with 15-minute intervals
- Tasks can span midnight, such as 11:00 PM to 1:00 AM the next day
- Deleting a task removes its linked Google Calendar event

## Run locally

1. Install Node.js 18+.
2. Run `npm install`.
3. Run `npm run dev`.
4. Optional cloud sync: copy `.env.example` to `.env`, create a Supabase project, run `supabase.sql`, enable Google authentication, and add your Supabase URL and publishable key.

## Production build

Run `npm run build` and deploy the generated `dist` folder to Vercel or another Vite-compatible static host. On Vercel, the framework is Vite and the build command is `npm run build`; the output directory is `dist`.

If Supabase is configured in production, add `VITE_PUBLIC_SUPABASE_URL` and `VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as Vercel environment variables.

## Google Calendar sync

ORBIT signs users in with Google and stores their workspace rows in Supabase under the signed-in user's `auth.users` identity.

Tasks with only a deadline are mirrored to the user's primary Google Calendar as all-day events.

Tasks with a complete start date/time and end date/time are mirrored as timed Google Calendar events.

Enable the Google Calendar API in Google Cloud, add the `https://www.googleapis.com/auth/calendar.events` scope to the OAuth consent screen, add required test users while the OAuth app is in Testing, and sign out/sign in again for users who previously authenticated before Calendar sync was added.

## Google Calendar troubleshooting

- Sign out and sign in with Google again after enabling Calendar scopes.
- In Settings → Privacy & sync, Google Calendar should say Connected.
- Create a task with a deadline. It should appear on the primary Google Calendar.
- Create a task with a complete start/end date and time range to create a timed Calendar event.
- If the task was created before Calendar permission was connected, signing in again automatically attempts to sync existing tasks with deadlines.
- If Calendar access expires, sign out and sign in with Google again to reconnect it.

## Task time scheduling

Tasks may optionally include:

- Start date
- End date
- Start time
- End time
- Minutes

When both start and end date/time values are supplied, ORBIT automatically calculates Minutes from the difference between them.

For example:

`15 Sep, 11:00 PM → 16 Sep, 1:00 AM`

automatically becomes:

`120 minutes`

Tasks can therefore span midnight correctly.

The time picker uses a compact 15-minute interval dropdown rather than a large clock interface.

If a task has a deadline but no complete time range, the Google Calendar event remains an all-day event.

Deleting a task removes its linked Google Calendar event before the task is deleted.

## Existing Supabase projects

Re-run `supabase.sql` or apply the required `ALTER TABLE` statements so existing `tasks` tables gain the scheduling columns:

```sql
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS start_date date;

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS end_date date;

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS start_time text;

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS end_time text;

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS google_event_id text;

NOTIFY pgrst, 'reload schema';