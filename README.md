# Classroom Behavior Manager (MVP)

Production-ready React + TypeScript + Vite app backed by Supabase for one-classroom clip-chart behavior management.

## Architecture

- **Frontend**: React + TypeScript + Vite.
- **Backend services**: Supabase Auth + Postgres + Realtime.
- **Teacher view** (`/`): Auth-protected dashboard (teacher + aide can share one login).
- **Student display** (`/?view=display`): Read-only, no login, real-time board updates.
- **Realtime sync**: Student display subscribes to `students`; teacher view subscribes to both `students` and `history_logs`.

## Feature Coverage (MVP)

- Teacher password login.
- Roster management: add/edit/remove/search by first name.
- 7-level clip chart actions: move up/down, direct set level 1–7.
- Bounds safety: no movement above 7 or below 1.
- One-tap **Start New Day** with confirmation.
- Daily history log with date selection and optional notes.
- Responsive teacher controls for iPhone/iPad/MacBook.
- Student display with seven color-coded large cards and grouped names.

## Folder Structure

- `src/App.tsx` – app mode routing (teacher vs display), auth/session state, subscriptions.
- `src/components/TeacherDashboard.tsx` – teacher controls + history UI.
- `src/components/StudentDisplay.tsx` – read-only fullscreen-friendly clip chart.
- `src/components/LoginForm.tsx` – teacher login form.
- `src/lib/api.ts` – data operations and behavior actions.
- `src/lib/supabase.ts` – Supabase client setup.
- `src/constants.ts` – level labels/colors and action types.
- `supabase/schema.sql` – DB schema + RLS policies.
- `supabase/seed.sql` – sample roster seed.

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Supabase Setup

1. Create a Supabase project.
2. In SQL editor, run `supabase/schema.sql`.
3. Run `supabase/seed.sql` (optional sample roster).
4. In Authentication, create teacher account (email/password).
5. Use that email/password for teacher + aide shared login.

## Local Development

```bash
npm install
npm run dev
```

Teacher dashboard: `http://localhost:5173/`
Student display: `http://localhost:5173/?view=display`

## Deployment (GitHub + Vercel example)

1. Push this repo to GitHub.
2. Import into Vercel.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars.
4. Deploy.
5. Share:
   - Teacher URL: `/`
   - Student display URL: `/?view=display`

## Database Schema Summary

### `students`
- `id` UUID PK.
- `first_name` text.
- `level` int 1..7 (default 4).
- timestamps.

### `history_days`
- `day_key` date PK to organize history by day.

### `history_logs`
- each behavior event: student name, previous/new level, action type, optional note, timestamp, day.

## Realtime Sync Design

- Teacher and student pages both subscribe to `students` table changes.
- Public display mode does **not** fetch or subscribe to history tables.
- Teacher page subscribes to `history_logs` updates for the currently selected day.
- Any teacher action writes to Postgres and instantly pushes UI updates to all devices.

## Customization

- **Level names/colors**: edit `src/constants.ts`.
- **Password/auth settings**: manage users and auth rules in Supabase Auth dashboard.
- **Roster changes**: use teacher dashboard or SQL insert/update in `students` table.

## Future-ready for NFC / Apple Shortcuts

The action layer is centralized in `src/lib/api.ts`. You can later add webhook/edge-function endpoints that call equivalent database updates for NFC taps or Apple Shortcuts without redesigning UI/state architecture.
