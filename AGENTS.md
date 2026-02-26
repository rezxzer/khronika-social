# Khronika (ქრონიკა) — Agent Instructions

## Cursor Cloud specific instructions

### Overview

Khronika is a circle-based social network (Next.js 16 + Supabase). Single monolith app — no monorepo, no Docker needed for local dev.

### Running the app

- `npm run dev` starts the Next.js dev server on port 3000
- The app requires Supabase env vars in `.env.local` — see `.env.example` for the template
- Without real Supabase credentials, pages render but auth/data features are non-functional

### Lint caveat

- `npm run lint` calls `next lint`, which was **removed in Next.js 16**. The script will fail with "Invalid project directory provided, no such directory: /workspace/lint".
- There is no `eslint.config.js` in the repo. To run ESLint, a flat config file must first be created (see ESLint v9 flat config docs + `eslint-config-next`).

### TypeScript and build

- `npx tsc --noEmit` — type checking (passes clean)
- `npm run build` — production build (passes clean)

### Key environment variables

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server) | Service role key for admin/deletion routes |
| `NEXT_PUBLIC_SITE_URL` | Yes | `http://localhost:3000` for local dev |
| `ADMIN_USER_IDS` | Optional | Comma-separated UUIDs for admin access |

See `.env.example` for full list including optional video pipeline and VAPID push notification vars.

### Project documentation

- `docs/CONTEXT.md` — comprehensive project context, file structure, phase history, and development guidelines
- `docs/00_MASTER_PLAN.md` — full project plan
- `docs/01_DESIGN_SYSTEM.md` — design system v4 details

### Non-obvious notes

- The `middleware.ts` file triggers a deprecation warning during build: "The 'middleware' file convention is deprecated. Please use 'proxy' instead." This is cosmetic and does not affect functionality.
- All UI text is in Georgian (ქართული); code and filenames are in English.
- The app uses `@supabase/ssr` for cookie-based auth. The middleware refreshes Supabase session cookies on every request.
- Database migrations are raw SQL in `database/` dir — must be applied manually in Supabase Dashboard SQL Editor (see `docs/CONTEXT.md` § Manual Supabase Steps).
