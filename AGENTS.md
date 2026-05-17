<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Trivia Guild — Agent Operations Manual

> **This file is the single source of truth for any AI agent operating on this codebase.**
> Read it fully before making any change. Assume zero prior context.

## Project Overview

**Trivia Guild** is a quiz night event brand based in Athens, Greece. This website serves as:
- A brand showcase (landing page with hero, about, media, contact)
- An event registration system (users register teams for quiz nights)
- A contact form (sends emails via EmailJS)
- An admin dashboard for event management (change event details, view registrations, archive events)

**Primary audience:** Greek-speaking mobile users.
**Primary language:** All UI text is in Greek unless otherwise noted.

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.2.6 | Framework (App Router) |
| React | 19.2.4 | UI library |
| TypeScript | ^5 | Type safety |
| Tailwind CSS | v4 | Styling (via @tailwindcss/postcss) |
| Supabase | ^2.105.4 | PostgreSQL database + auth |
| EmailJS | ^4.4.1 | Contact form email delivery |
| react-icons | ^5.6.0 | Social media icons (Footer) |
| @fontsource/inter | ^5.2.8 | Body font |
| @fontsource/space-grotesk | ^5.2.10 | Heading font |

**Dev server:** `npm run dev` → `localhost:3000`
**Build:** `npm run build`

## File Architecture

```
trivia-guild-website/
├── app/
│   ├── layout.tsx          # Root layout — Navbar, global CSS, html lang="el"
│   ├── page.tsx            # Landing page — Hero, About, Media, Contact, Footer
│   ├── globals.css         # Brand tokens, fonts, base styles
│   ├── favicon.ico         # Site favicon
│   ├── actions/            # Server Actions for secure backend operations
│   │   ├── auth.ts         # Login/logout and session cookie management
│   │   └── admin.ts        # Destructive DB operations using Service Role key
│   ├── components/
│   │   ├── Navbar.tsx      # Fixed top navbar with scroll-based active tab detection
│   │   ├── Footer.tsx      # Shared footer — logo, social icons, copyright
│   │   └── ContactForm.tsx # Contact form — sends email via EmailJS
│   ├── events/
│   │   └── page.tsx        # Event details + registration/waitlist forms (fetches from Supabase)
│   └── admin/
│       ├── page.tsx        # Admin dashboard (Protected) — event config, registrations, archive
│       └── login/page.tsx  # Admin login page
├── lib/
│   ├── supabase.ts         # Supabase client singleton (uses anon key, safe for public reads)
│   └── supabase-admin.ts   # Secure Supabase client (uses service role key, DO NOT EXPOSE to client)
├── middleware.ts           # Next.js middleware to protect /admin routes
├── public/
│   └── images/
│       └── triviaguildlogonobackground.png  # Brand logo
├── .env.local              # Secrets — NEVER commit (gitignored)
├── .env.example            # Template for env vars (safe to commit)
├── AGENTS.md               # This file
├── CLAUDE.md               # Points to AGENTS.md
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── eslint.config.mjs
```

### Fragile Files — Handle With Care

| File | Why it's fragile |
|---|---|
| `Navbar.tsx` | Scroll detection logic uses `getBoundingClientRect()` — depends on `#contact` section existing on `/` |
| `app/actions/admin.ts` | Server actions containing multi-step database transactions (like archiving) |
| `globals.css` | All brand tokens defined here — changing values affects entire site |
| `lib/supabase-admin.ts` | Highly privileged DB client. NEVER import into client components. |

## Brand System

> **NEVER deviate from these values without explicit user instruction.**

### Colors
| Name | Hex | CSS Variable | Usage |
|---|---|---|---|
| Brand Dark | `#202028` | `--color-brand-dark` | Backgrounds, buttons |
| Brand Amber | `#D09048` | `--color-brand-amber` | Primary accent, titles, highlights |
| Brand Red | `#D04830` | `--color-brand-red` | Error states, destructive actions |
| Brand Cream | `#E8D8C0` | `--color-brand-cream` | Body text, active states |
| Brand Bronze | `#B06028` | `--color-brand-bronze` | Borders, shadows, secondary accent |

### Fonts
- **Headings:** `Space Grotesk` → Tailwind class `font-heading`
- **Body:** `Inter` → Tailwind class `font-body`

### Common Patterns
- **Background gradient:** `radial-gradient(circle at center, #1a1612 0%, var(--color-brand-dark) 70%)`
- **Card:** `bg-[#2A2A33] border border-brand-bronze/30 rounded-2xl p-6 sm:p-8 shadow-xl`
- **CTA Button:** `bg-brand-dark text-brand-amber font-bold rounded-full drop-shadow-[0_0_18px_var(--color-brand-amber)]` with hover glow intensification
- **Input:** `bg-brand-dark border border-brand-bronze/30 rounded-lg h-12 px-4 text-brand-cream font-body` with focus ring in brand-amber

## Database Schema (Supabase)

### Table: `registrations`
| Column | Type | Notes |
|---|---|---|
| id | bigserial (PK) | Auto-increment |
| created_at | timestamptz | Default: `now()` |
| team_name | text | Required |
| team_size | integer | 1-8 |
| phone | text | Required |
| social | text | Optional |
| event_name | text | Set from current event title |

**Written by:** `/events` registration form (anon role)
**Read by:** `/admin` dashboard (anon role)
**Deleted by:** `app/actions/admin.ts` (service role)

### Table: `event_config`
| Column | Type | Notes |
|---|---|---|
| id | bigserial (PK) | Always use id=1 (single-row config) |
| created_at | timestamptz | Default: `now()` |
| event_title | text | Displayed on events page |
| event_date | text | Free-form, e.g. "Δευτέρα 01/06" |
| event_time | text | Free-form, e.g. "20:00" |
| event_venue | text | e.g. "The Pub" |
| event_status | text | `'open'` or `'sold_out'` |

**Written by:** `app/actions/admin.ts` (service role)
**Read by:** `/events` page, `/admin` dashboard (anon role)

### Table: `past_events`
| Column | Type | Notes |
|---|---|---|
| id | bigserial (PK) | Auto-increment |
| created_at | timestamptz | Default: `now()` |
| event_title | text | Archived event title |
| event_date | text | Archived date |
| event_time | text | Archived time |
| event_venue | text | Archived venue |
| registrations_data | jsonb | Full array of registration objects |
| total_teams | integer | Count at time of archive |

**Written by:** `app/actions/admin.ts` archive operation (service role)
**Read by:** `/admin` past events section (anon role)
**Deleted by:** `app/actions/admin.ts` (service role)

### Table: `waitlist`
| Column | Type | Notes |
|---|---|---|
| id | bigserial (PK) | Auto-increment |
| created_at | timestamptz | Default: `now()` |
| name | text | User's name |
| contact | text | Phone or email |

**Written by:** `/events` waitlist form (anon role)

## Security Architecture

We strictly separate client and server capabilities.
1. **Public/Anon Client (`lib/supabase.ts`)**: Used ONLY in React components for **reading** public data (`event_config`, `past_events`) or inserting into public queues (`registrations`, `waitlist`).
2. **Admin Server Client (`lib/supabase-admin.ts`)**: Used ONLY in Server Actions for **destructive/sensitive operations**. Bypasses RLS entirely using `SUPABASE_SERVICE_ROLE_KEY`.
3. **Authentication**: Admin auth is managed via `app/actions/auth.ts`. On correct password, a secure `admin_session` HTTP-only cookie is set.
4. **Middleware Protection**: `middleware.ts` intercepts all requests to `/admin` (except `/admin/login`) and enforces the session cookie.

## Environment Variables

| Variable | Public? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous API key |
| `NEXT_PUBLIC_EMAILJS_SERVICE_ID` | Yes | EmailJS service identifier |
| `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID` | Yes | EmailJS email template identifier |
| `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY` | Yes | EmailJS public API key |
| `ADMIN_PASSWORD` | **No** | Server-side only: Admin dashboard login password |
| `SUPABASE_SERVICE_ROLE_KEY` | **No** | Server-side only: Supabase super-user key |

## DO NOT Rules

> **Hard limits for all agents. Violating these can break the site.**

1. **DO NOT** change brand colors without explicit user instruction.
2. **DO NOT** import `lib/supabase-admin.ts` or any Server Actions from `app/actions/*` into a Client Component without using standard form/button action patterns.
3. **DO NOT** commit `.env.local` to git.
4. **DO NOT** use `localStorage` for any data that needs to persist across devices.
5. **DO NOT** add new dependencies without checking if existing ones cover the use case.
6. **DO NOT** add navigation links to `/admin` from any public-facing page.
7. **DO NOT** remove `id="contact"` from the contact section in `app/page.tsx` — Navbar depends on it.
8. **DO NOT** change the Supabase `event_config` upsert to use any id other than `1`.
9. **DO NOT** attempt to make destructive database calls directly from the browser using the anon key. Always proxy through a secure Server Action.

## Verification Checklist

> **Run after ANY change to this codebase.**

- [ ] `npm run dev` starts without errors
- [ ] `localhost:3000` loads hero, scrolls to contact form, footer visible
- [ ] `localhost:3000/events` loads event details from Supabase
- [ ] `localhost:3000/admin` redirects to `/admin/login` if not logged in
- [ ] `/admin/login` successfully sets a cookie and redirects to dashboard
- [ ] Admin dashboard data mutations (save config, delete, archive) work successfully
- [ ] Mobile view (narrow browser ~375px) has no horizontal overflow
- [ ] `npm run build` completes without TypeScript errors
