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
│   ├── components/
│   │   ├── Navbar.tsx      # Fixed top navbar with scroll-based active tab detection
│   │   ├── Footer.tsx      # Shared footer — logo, social icons, copyright
│   │   └── ContactForm.tsx # Contact form — sends email via EmailJS
│   ├── events/
│   │   └── page.tsx        # Event details + registration/waitlist forms (fetches from Supabase)
│   └── admin/
│       └── page.tsx        # Admin dashboard — password gate, event config, registrations, archive
├── lib/
│   └── supabase.ts         # Supabase client singleton (uses env vars)
├── public/
│   └── images/
│       └── triviaguildlogonobackground.png  # Brand logo (317KB PNG)
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
| `admin/page.tsx` | 700+ line monolith — complex state management, multiple Supabase operations, archive workflow is multi-step |
| `globals.css` | All brand tokens defined here — changing values affects entire site |
| `lib/supabase.ts` | Single export used by every data-fetching component — do not rename |

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
**Read by:** `/admin` dashboard (anon role — see security notes)
**Deleted by:** `/admin` (single delete + bulk delete on archive)

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

**Written by:** `/admin` save config (upsert id=1)
**Read by:** `/events` page on mount, `/admin` on auth

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

**Written by:** `/admin` archive operation
**Read by:** `/admin` past events section
**Deleted by:** `/admin` individual past event delete

### Table: `waitlist`
| Column | Type | Notes |
|---|---|---|
| id | bigserial (PK) | Auto-increment |
| created_at | timestamptz | Default: `now()` |
| name | text | User's name |
| contact | text | Phone or email |

**Written by:** `/events` waitlist form (when status is sold_out)
**Read by:** Not currently displayed anywhere — check Supabase dashboard

**Required SQL to create (if not exists):**
```sql
CREATE TABLE IF NOT EXISTS waitlist (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## External Integrations

### Supabase
- **Client:** `lib/supabase.ts` exports `supabase` singleton
- **Credentials:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env.local`
- **Role:** Uses `anon` key (public access) — RLS policies control permissions

### EmailJS
- **Component:** `app/components/ContactForm.tsx`
- **Credentials:** Three env vars: `NEXT_PUBLIC_EMAILJS_SERVICE_ID`, `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`, `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`
- **Template variables sent:** `from_name`, `reply_to`, `subject`, `message`
- **On failure:** Shows Greek error message, logs to console

## Environment Variables

| Variable | Public? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous API key |
| `NEXT_PUBLIC_EMAILJS_SERVICE_ID` | Yes | EmailJS service identifier |
| `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID` | Yes | EmailJS email template identifier |
| `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY` | Yes | EmailJS public API key |
| `ADMIN_PASSWORD` | **No** | Admin dashboard login password (server-side only) |

**Note:** `NEXT_PUBLIC_` vars are embedded in client bundles. `ADMIN_PASSWORD` has no prefix and should only be available server-side. However, the current admin auth is client-side — see security notes.

## Page-by-Page Guide

### `/` — Landing Page (`app/page.tsx`)
- **Server Component** (no "use client")
- Renders: Hero section (logo, title, tagline, CTA button), About placeholder, Media placeholder, Contact section with `<ContactForm />`, `<Footer />`
- **Data:** None fetched — static content
- **Fragile:** The `#contact` section must keep `id="contact"` — the Navbar scroll detection depends on it

### `/events` — Events & Registration (`app/events/page.tsx`)
- **Client Component** ("use client")
- On mount: fetches event config from Supabase `event_config` table
- Shows loading spinner while fetching
- If status is `"open"`: displays registration form → saves to `registrations` table
- If status is `"sold_out"`: displays SOLD OUT badge + waitlist form → saves to `waitlist` table
- **Validation:** Team name (1-50 chars), team size (1-8), phone (digits only, 10+ chars)
- **Re-use:** After successful registration, submit re-enables after 5 seconds

### `/admin` — Admin Dashboard (`app/admin/page.tsx`)
- **Client Component** ("use client")
- **Password gate:** Checks input against `ADMIN_PASSWORD` constant
- On auth: fetches event config from `event_config`, fetches `registrations`, fetches `past_events`
- **Section A:** Event config form → upserts to `event_config` (id=1)
- **Section B:** Registrations list with individual delete, CSV export, refresh
- **Section C:** Past events history with collapsible cards, CSV download, delete
- **Archive flow:** Fetch all registrations → insert into `past_events` → delete all `registrations` → reset config dates
- **Security:** Client-side password only — not secure for sensitive data

## Admin Dashboard Guide

1. **Access:** Navigate to `/admin`, enter password from `ADMIN_PASSWORD` env var
2. **Change event details:** Edit fields, click "Αποθήκευση" → upserts to Supabase `event_config`
3. **Toggle status:** Click OPEN or SOLD OUT, then save → changes what form visitors see on `/events`
4. **Archive event:** Click "Αρχειοθέτηση Event 📦" → confirms → archives registrations to `past_events`, clears current registrations, resets date/time
5. **Export data:** Click "Εξαγωγή CSV" for current registrations or "Λήψη CSV" for past events
6. **Security note:** Admin auth is client-side only — do not store truly sensitive data beyond event management

## DO NOT Rules

> **Hard limits for all agents. Violating these can break the site.**

1. **DO NOT** change brand colors without explicit user instruction
2. **DO NOT** remove the `"use client"` directive from client components
3. **DO NOT** delete `lib/supabase.ts` or change the export name `supabase`
4. **DO NOT** change Supabase table names or column names without updating ALL references
5. **DO NOT** commit `.env.local` to git
6. **DO NOT** use `localStorage` for any data that needs to persist across devices
7. **DO NOT** add new dependencies without checking if existing ones cover the use case
8. **DO NOT** modify the admin password in source code — it lives in `.env.local` only
9. **DO NOT** add navigation links to `/admin` from any public-facing page
10. **DO NOT** remove `id="contact"` from the contact section in `app/page.tsx` — Navbar depends on it
11. **DO NOT** change the Supabase `event_config` upsert to use any id other than `1`

## Verification Checklist

> **Run after ANY change to this codebase.**

- [ ] `npm run dev` starts without errors
- [ ] `localhost:3000` loads hero, scrolls to contact form, footer visible
- [ ] `localhost:3000/events` loads event details from Supabase (not defaults)
- [ ] `localhost:3000/admin` password gate works, dashboard loads registrations
- [ ] Admin status toggle saves to Supabase and reflects on `/events` after refresh
- [ ] Contact form submits and sends email (check EmailJS dashboard)
- [ ] Registration form saves to Supabase `registrations` table
- [ ] Mobile view (narrow browser ~375px) has no horizontal overflow
- [ ] `npm run build` completes without TypeScript errors
