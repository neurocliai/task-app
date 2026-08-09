# Lumen

A mobile-first task app with a premium animated landing page, auth, task list, and profile.

## Run

```bash
npm install
npm run dev
```

Starts both:

- **API** — Express + SQLite on `http://localhost:3001`
- **Web** — Vite on `http://localhost:5173` (proxies `/api` to the API)

Open the local web URL. On desktop it renders inside a phone shell; on mobile it fills the viewport.

## Database

SQLite file lives at `data/lumen.db` (created automatically, gitignored).

Tables: `users`, `sessions`, `tasks`

Passwords are hashed with bcrypt. Auth uses bearer session tokens.

## Features

- **Landing** — animated brand hero and CTAs
- **Auth** — sign up / sign in against SQLite
- **Tasks** — add, complete, filter, delete with priority (persisted in DB)
- **Profile** — avatar, stats, edit name, sign out
