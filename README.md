# ORBIT Tracker

A responsive React/Vite productivity workspace with a calm, Vercel-inspired black UI and Geist typography. It is intentionally neutral: use it for work, learning, personal goals, projects, or anything else.

## Included
- Vercel-inspired black theme with Geist Sans typography and circular ORBIT logo
- Responsive dashboard with clickable progress, time, due-today and momentum cards
- Task creation, search, status/priority filtering, completion state, inline editing and deletion
- Completed tasks automatically move below active tasks and receive a strike-through
- Subjects/projects with descriptions, progress tracking and per-subject task views
- Per-subject PDF notes/resources stored locally in IndexedDB
- Calendar with Today, 3 Days, Month and Year views; dates are selectable and can create tasks
- Focus timer with 1/2/3 Pomodoro presets, custom duration, completion sound and manual session logging
- Settings for theme, density, notifications, focus preferences, account and privacy/sync
- Local demo mode works immediately without a backend
- Optional Google login + phone OTP + Supabase cloud sync
- Custom subject categories with local persistence; cloud schema accepts any category

## Run locally
1. Install Node.js 18+.
2. Run `npm install`.
3. Run `npm run dev`.
4. Optional cloud sync: copy `.env.example` to `.env`, create a Supabase project, run `supabase.sql`, enable Google authentication and Phone authentication (with an SMS provider), and add your Supabase URL and anon key.

## Production build
Run `npm run build` and deploy the generated `dist` folder to Vercel or another Vite-compatible static host. On Vercel, the framework is Vite and the build command is `npm run build`; the output directory is `dist`.

If Supabase is configured in production, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Vercel environment variables.
