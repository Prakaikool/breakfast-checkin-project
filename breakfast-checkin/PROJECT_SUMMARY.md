# Breakfast Check-In System — Project Summary

> Last updated: May 5, 2026 (rev 2)

---

## What This Project Is

A **real-time hotel breakfast check-in web application** used by hotel staff to track which guests have visited the breakfast buffet during each daily session. It prevents duplicate check-ins, enforces guest quotas, manages kitchen item availability, and gives managers a live operational dashboard.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 15.1.0 |
| Language | TypeScript | 5.7 |
| Styling | Tailwind CSS | 4.0.0 |
| Database | PostgreSQL | 14+ |
| ORM | Prisma | 6.19.3 |
| Auth | JWT + bcrypt (HTTP-only cookies) | jsonwebtoken 9.0.2 |
| Validation | Zod | 3.24.0 |
| Charts | Recharts | 2.15.0 |
| Icons | Lucide React | 0.469.0 |
| PDF Export | jspdf | 4.2.1 |
| Date Utilities | date-fns | 4.1.0 |

---

## Project Structure

```
breakfast-checkin/
├── prisma/
│   ├── schema.prisma          # All 11 database tables
│   └── seed.ts                # Sample data for development
│
├── src/
│   ├── middleware.ts          # Edge middleware — route protection + security headers
│   │
│   ├── app/                   # Next.js App Router (pages + API routes)
│   │   ├── api/               # 26 API endpoints
│   │   │   ├── auth/          #   login / logout / me
│   │   │   ├── guests/        #   search by room or name
│   │   │   ├── checkins/      #   create, list, update check-ins
│   │   │   ├── dashboard/     #   stats / timeline / activity / public
│   │   │   ├── kitchen/       #   menu item status
│   │   │   ├── spa/           #   member lookup and verification
│   │   │   ├── daily-log/     #   shift notes, incidents, VIP entries
│   │   │   ├── reminders/     #   staff reminders
│   │   │   ├── instructions/  #   editable staff training content
│   │   │   ├── reports/       #   daily summary and PDF export
│   │   │   ├── display/       #   large-screen announcement + crowd
│   │   │   ├── settings/      #   system config (times, max guests)
│   │   │   └── upload/        #   image upload (ADMIN only)
│   │   │
│   │   ├── login/             # Staff login page
│   │   ├── checkin/           # Main check-in interface
│   │   ├── dashboard/         # Real-time manager dashboard
│   │   ├── public-dash/       # Guest-facing status (no auth)
│   │   ├── daily-log/         # Shift notes and incident log
│   │   ├── kitchen/           # Kitchen menu item status board
│   │   ├── reminders/         # Staff reminders
│   │   ├── reports/           # Analytics and exports
│   │   ├── members/           # Spa / VIP member verification
│   │   ├── guests/            # Guest directory
│   │   ├── settings/          # System configuration
│   │   ├── instruction/       # Staff training materials
│   │   └── display/           # Large-screen reception display
│   │
│   ├── backend/               # Shared server utilities
│   │   ├── auth.ts            #   JWT helpers, revocation, requireAuth()
│   │   ├── db.ts              #   Prisma client singleton
│   │   ├── validations.ts     #   Zod schemas for all endpoints
│   │   ├── api-helpers.ts     #   Consistent response helpers
│   │   └── rate-limit.ts      #   Sliding-window rate limiter
│   │
│   ├── frontend/              # React components and views
│   └── types/                 # Shared TypeScript definitions
│
├── next.config.ts             # Security headers + Next.js config
├── .env.example               # Environment variable template
└── PROJECT_SUMMARY.md         # This file
```

---

## Pages Built (14 routes)

| Route | Who Can Access | Purpose |
|---|---|---|
| `/login` | Everyone | Staff login with email + password |
| `/` | Authenticated | Home dashboard with quick-access cards |
| `/checkin` | Authenticated | Main check-in interface — search by room or name |
| `/dashboard` | Authenticated | Real-time stats, timeline chart, activity level |
| `/public-dash` | Everyone (no auth) | Guest-facing status display |
| `/daily-log` | Authenticated | Shift notes, incidents, VIP comments |
| `/kitchen` | KITCHEN / SUPERVISOR / ADMIN | Menu item status board |
| `/reminders` | Authenticated | Staff reminders (daily, weekdays, one-time) |
| `/reports` | Authenticated | Analytics and PDF export |
| `/members` | Authenticated | Spa / VIP member verification and visit tracking |
| `/guests` | Authenticated | Guest directory with room search |
| `/settings` | ADMIN | System config (breakfast times, max guests) |
| `/instruction` | Authenticated (edit: ADMIN) | Staff training materials |
| `/display` | Everyone (no auth) | Large-screen display for reception / dining area |

---

## Database (11 Tables)

### Staff
Holds all hotel staff accounts.

| Column | Type | Notes |
|---|---|---|
| id | Int | Primary key |
| name | String | Display name |
| email | String | Unique login identifier |
| pinHash | String | bcrypt-hashed password (column kept as `pinHash` for historical reasons) |
| role | StaffRole | ADMIN / SUPERVISOR / ENTRANCE / KITCHEN |
| isActive | Boolean | Soft-disable without deleting |

### Room
Hotel rooms referenced during check-in.

| Column | Type | Notes |
|---|---|---|
| roomNumber | String | Unique (e.g., "816") |
| floor | Int | |
| maxGuests | Int | Cap enforced at check-in |
| status | RoomStatus | OCCUPIED / VACANT / MAINTENANCE |

### Guest
Registered hotel guests imported from PMS or entered manually.

| Column | Type | Notes |
|---|---|---|
| name | String | |
| roomId | Int | FK → Room |
| guestType | GuestType | HOTEL / SPA / VIP / EXTERNAL |
| isChild | Boolean | |
| checkInDate / checkOutDate | DateTime | |
| hasBreakfast | Boolean | Whether breakfast is included |
| pmsId | String? | ID from hotel PMS for sync |

### BreakfastSession
One record per day representing the active breakfast service window.

| Column | Type | Notes |
|---|---|---|
| sessionDate | Date | Unique per day |
| startTime / endTime | String | "07:00", "10:30" |
| totalGuests / totalAdults / totalChildren | Int | Running totals |
| status | SessionStatus | OPEN / CLOSED / CANCELLED |

### CheckIn
The core transaction — one record per check-in event.

| Column | Type | Notes |
|---|---|---|
| roomId | Int? | FK → Room |
| guestId | Int? | FK → Guest (null for walk-ins) |
| staffId | Int | FK → Staff who processed it |
| sessionId | Int | FK → BreakfastSession |
| adultCount / childCount | Int | |
| isDuplicate | Boolean | Detected duplicate for same room/session |
| isOverride | Boolean | Supervisor overrode the duplicate block |
| isWalkIn | Boolean | Guest not in system |
| note | String? | Optional staff note |

### SpaMember
Spa and VIP members eligible for complimentary breakfast.

| Column | Type | Notes |
|---|---|---|
| memberId | String | Unique member card number |
| memberType | MemberType | SPA / VIP |
| isActive | Boolean | |
| validUntil | DateTime? | |
| totalVisits | Int | Lifetime visit counter |

### KitchenItem
Menu items shown on the kitchen status board.

| Column | Type | Notes |
|---|---|---|
| name | String | Display name |
| status | KitchenItemStatus | AVAILABLE / LOW / SOLD_OUT |
| sortOrder | Int | Display ordering |

### Reminder
Staff reminders managed per shift.

| Column | Type | Notes |
|---|---|---|
| title | String | |
| time | String | "09:00" |
| recurrence | ReminderRecurrence | TODAY / EVERY_DAY / WEEKDAYS |
| status | ReminderStatus | ACTIVE / COMPLETED / OVERDUE |
| createdBy | Int | FK → Staff (owner) |

### DailyLogEntry
Shift-level notes, incident reports, and VIP remarks.

| Column | Type | Notes |
|---|---|---|
| category | LogCategory | SHIFT_NOTE / INCIDENT / VIP / KITCHEN / HOUSEKEEPING |
| content | String | Free text |
| staffId | Int | Author |
| staffName | String | Denormalised for display speed |
| isPinned | Boolean | Pinned entries shown at top |

### InstructionSection
Staff training content, editable by ADMIN only.

| Column | Type | Notes |
|---|---|---|
| title | String | |
| content | String (Text) | Markdown/HTML content |
| imageUrl | String? | Path to uploaded image |
| sortOrder | Int | |

### AuditLog
Immutable record of all significant staff actions.

| Column | Type | Notes |
|---|---|---|
| staffId | Int | Who did it |
| action | String | "LOGIN", "CHECK_IN", "DUPLICATE_OVERRIDE", etc. |
| details | Json? | Flexible extra data (IP, guest ID, etc.) |

---

## API Endpoints (26)

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | No | Login with email + PIN, returns JWT cookie |
| POST | `/api/auth/logout` | Yes | Revokes JWT and clears cookie |
| GET | `/api/auth/me` | Yes | Returns current staff profile |

### Guests
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/guests?room=816` | Yes | Search by room number |
| GET | `/api/guests?name=smith` | Yes | Search by guest name |
| GET | `/api/guests?all=true` | Yes | List all active guests |
| GET | `/api/guests/[id]` | Yes | Get single guest |

### Check-ins
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/checkins` | Yes | Register a check-in (validates cap, detects duplicates) |
| GET | `/api/checkins?date=today` | Yes | List check-ins for a date |
| PATCH | `/api/checkins/[id]` | Yes | Update a check-in (e.g., checkout time) |

### Dashboard
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard/stats` | Yes | Total counts for today |
| GET | `/api/dashboard/timeline` | Yes | Check-ins per hour (chart data) |
| GET | `/api/dashboard/activity` | Yes | Current busy level (IDLE / MODERATE / BUSY) |
| GET | `/api/dashboard/public` | **No** | Guest-facing status (no auth required) |

### Kitchen
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/kitchen` | Yes | List all menu items with status |
| PATCH | `/api/kitchen/[id]` | KITCHEN / SUPERVISOR / ADMIN | Update item status |

### Spa / Members
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/spa/members` | Yes | List all spa/VIP members |
| GET | `/api/spa/verify?memberId=X` | Yes | Verify membership validity |
| PATCH | `/api/spa/members/[id]` | Yes | Update member record |

### Daily Log
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/daily-log` | Yes | Create log entry |
| GET | `/api/daily-log` | Yes | List entries (filterable, searchable) |
| PATCH | `/api/daily-log/[id]` | ADMIN / SUPERVISOR | Toggle pin |
| DELETE | `/api/daily-log/[id]` | Owner or ADMIN / SUPERVISOR | Delete entry |

### Reminders
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/reminders` | Yes | Create reminder |
| GET | `/api/reminders` | Yes | List reminders |
| PATCH | `/api/reminders/[id]` | Owner or ADMIN | Update / complete |
| DELETE | `/api/reminders/[id]` | Owner or ADMIN | Delete |

### Instructions
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/instructions` | Yes | List all training sections |
| POST | `/api/instructions` | ADMIN | Create section |
| PATCH | `/api/instructions/[id]` | ADMIN | Update section |
| DELETE | `/api/instructions/[id]` | ADMIN | Delete section |

### Reports
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/reports` | Yes | Generate daily report / export PDF |

### Display
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/display/announcement` | **No** | Get current announcement |
| POST | `/api/display/announcement` | Yes | Set announcement |
| GET | `/api/display/crowd` | **No** | Real-time crowd count |
| POST | `/api/display/crowd` | Yes | Update crowd count |

### File Upload
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/upload` | ADMIN | Upload image for instruction sections |

---

## Role-Based Access Control

| Feature | ENTRANCE | KITCHEN | SUPERVISOR | ADMIN |
|---|---|---|---|---|
| Login | ✅ | ✅ | ✅ | ✅ |
| Check-in guests | ✅ | ✅ | ✅ | ✅ |
| View dashboard | ✅ | ✅ | ✅ | ✅ |
| View daily log | ✅ | ✅ | ✅ | ✅ |
| Create daily log entry | ✅ | ✅ | ✅ | ✅ |
| Delete own daily log entry | ✅ | ✅ | ✅ | ✅ |
| Delete any daily log entry | ❌ | ❌ | ✅ | ✅ |
| Pin daily log entries | ❌ | ❌ | ✅ | ✅ |
| Update kitchen item status | ❌ | ✅ | ✅ | ✅ |
| Create / complete own reminders | ✅ | ✅ | ✅ | ✅ |
| Modify / delete any reminder | ❌ | ❌ | ❌ | ✅ |
| View staff training materials | ✅ | ✅ | ✅ | ✅ |
| Edit staff training materials | ❌ | ❌ | ❌ | ✅ |
| Upload images | ❌ | ❌ | ❌ | ✅ |
| View reports | ✅ | ✅ | ✅ | ✅ |
| System settings | ❌ | ❌ | ❌ | ✅ |

---

## Security Measures

### Authentication
- Staff log in with **email + password**
- Password requirements: **minimum 8 characters, at least one uppercase letter, one lowercase letter, and one number**; maximum 72 characters (bcrypt truncation limit)
- Passwords are stored as **bcrypt hashes** (cost factor 10) — the raw password is never stored
- On login, a **JWT** is issued and stored in an **HTTP-only, SameSite=Strict** cookie — JavaScript cannot read it
- Tokens expire after **8 hours**

### Brute-Force Protection
- The login endpoint is **rate-limited to 10 attempts per IP per 15 minutes**
- Exceeding the limit returns HTTP `429` with a `Retry-After` header
- The counter resets automatically on successful login

### Token Revocation
- Every token carries a unique `jti` (JWT ID, a UUID)
- On logout, the `jti` is added to an **in-memory revocation set**
- `verifyToken()` rejects revoked `jti`s immediately — stolen cookies cannot be replayed after logout
- Revoked entries are automatically pruned after 8 hours (matching token expiry)

### Startup Hardening
- The server **refuses to start** if `JWT_SECRET` is not set in the environment — there is no insecure fallback default

### Authorization
- Every API route that mutates data verifies both **authentication** (is the user logged in?) and **authorization** (does their role allow this action?)
- Unauthenticated requests to protected API routes receive `401`
- Requests by an authenticated user with insufficient role receive `403`

### Route Protection (Middleware)
- `src/middleware.ts` runs at the **edge** before every request
- Unauthenticated page requests are **redirected to `/login`**
- Public routes (login page, public dashboard, display screens) are explicitly whitelisted

### Security Headers
Applied on every response via both `middleware.ts` and `next.config.ts`:

| Header | Value | Purpose |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing |
| `X-Frame-Options` | `DENY` | Blocks clickjacking via iframes |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS filter (browsers) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables sensitive browser APIs |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | HTTPS-only (production) |

### File Upload Safety
- Only ADMIN role can upload files
- File type is validated by **inspecting magic bytes** in the raw buffer — the client-supplied `Content-Type` header is ignored and cannot be spoofed
- Accepted types: JPEG, PNG, WebP, GIF
- Maximum file size: 8 MB
- Uploaded filenames are randomised (`timestamp-randomhex.ext`) — no path traversal possible

### Database — Row Level Security (RLS)
- **RLS is enabled on all 12 tables** in the `public` schema (including `_prisma_migrations`)
- Supabase exposes the `public` schema through its auto-generated PostgREST API — without RLS, anyone holding the public `anon` key could read or write every table directly
- With RLS enabled and no permissive policies defined, **all direct PostgREST access is denied by default**
- Prisma connects as the `postgres` superuser which bypasses RLS entirely — the application is unaffected
- Applied via migration: `prisma/migrations/20260504131550_enable_rls_all_tables/migration.sql`

### Input Validation
Every API endpoint validates request data through **Zod schemas** before touching the database. Key constraints:

| Schema | Key limits |
|---|---|
| `loginSchema` | Email ≤ 254 chars; password 8–72 chars, must contain uppercase, lowercase, and digit |
| `checkInSchema` | Adults and children each capped at 20; walk-in/roomId cross-field check; note ≤ 500 chars |
| `dailyLogSchema` | Content 1–1 000 chars; category must be a known enum value |
| `reminderSchema` | Title ≤ 200 chars; time must match `HH:MM` |
| `spaMemberSchema` | Name ≤ 100 chars; phone ≤ 30 chars, digits/symbols only; validUntil coerced to Date |
| `instructionSchema` | Title ≤ 200 chars; content ≤ 50 000 chars; `imageUrl` must match `/uploads/…` — no external URLs |
| `guestSearchSchema` | Room ≤ 20 chars; name ≤ 100 chars |

Routes that previously did ad-hoc string checks now use these schemas consistently, so limits are enforced uniformly.

### Unbounded Query Protection
- `GET /api/guests?all=true` is capped at **500 rows** — prevents accidental full-table dumps
- `GET /api/spa/members` is capped at **1 000 rows**
- `GET /api/checkins` requires a `YYYY-MM-DD` date format and validates it before querying

### Audit Logging
Every significant action is recorded in the `AuditLog` table with: staff ID, action type, timestamp, and contextual details (e.g., IP address for logins, guest IDs for check-ins).

---

## Key Architectural Patterns

**Authentication flow**
1. Staff POST email + password → server looks up staff, verifies bcrypt hash
2. Server creates JWT with `jti`, sets it as HTTP-only cookie
3. Subsequent requests send cookie automatically; server calls `requireAuth()` to verify

**Duplicate check-in prevention**
- On each `POST /api/checkins`, the server counts how many registered guests for that room have already been checked in today
- A duplicate/conflict (`409`) is **only triggered when all registered guests for the room have been checked in** — partial check-ins (e.g., 2 of 4 guests) proceed normally without any override prompt
- When the room is fully checked in and staff attempts another check-in, the system returns `409 Conflict` and the UI shows an orange "Override & Check-In" button
- Confirming the override sends `overrideDuplicate: true`; the new check-in is recorded with `isDuplicate: true, isOverride: true`
- Both the original and the override are logged in `AuditLog`

**Check-in counter UX**
- When staff selects a room, the adults and children counters **pre-fill with the remaining registered guests** for each type (e.g., if 2 adults and 1 child are registered and 1 adult has already checked in, the counters default to Adults=1, Children=1)
- The `GET /api/guests` response now includes `checkedInAdults` and `checkedInChildren` per room (tracked separately from today's check-in records), enabling accurate per-type remaining counts
- Adults and children are **capped independently** at their respective registered remaining values — staff can reduce either counter but cannot enter numbers that exceed the registered guest list for that type
- In override mode (room fully checked in), both counters become free-entry with a max of 20

**Real-time dashboard**
- The frontend polls `/api/dashboard/stats`, `/api/dashboard/timeline`, and `/api/dashboard/activity` every 15 seconds
- No WebSocket complexity — polling interval is configurable

**Validation**
- All API inputs are validated with **Zod schemas** before any database access
- Schema files live in `src/backend/validations.ts`
- Invalid payloads receive `400` with the first validation error message

**Consistent API responses**
```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "Human-readable message" }
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (pooled) |
| `DIRECT_URL` | Yes | PostgreSQL direct connection string (for migrations) |
| `JWT_SECRET` | Yes | Secret key for signing JWTs — must be set or server refuses to start |
| `JWT_EXPIRY` | No | Token lifetime (default: `8h`) |
| `NEXT_PUBLIC_APP_URL` | No | Public base URL of the app |
| `BREAKFAST_START_TIME` | No | Default session start (e.g., `07:00`) |
| `BREAKFAST_END_TIME` | No | Default session end (e.g., `10:30`) |
| `MAX_GUESTS_PER_ROOM` | No | Default guest cap per room |

---

## Development Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run db:migrate` | Apply schema changes to database |
| `npm run db:seed` | Load sample data |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |
| `npm run db:reset` | Drop and re-seed the database |

---

## Seed Data Login Credentials

| Role | Email | Password |
|---|---|---|
| ADMIN | sandra@hotel.com | Admin@2026 |
| ENTRANCE | erik@hotel.com | Staff@2026 |

> Change these immediately after first login in any non-development environment.

---

## Future Work / Not Yet Built

- PMS sync (`/api/sync/`) — automated guest import from Opera / Mews / Protel
- Push notifications for kitchen alerts
- Multi-property support (one instance per hotel property)
- Refresh token rotation (current tokens are single long-lived tokens)
- Redis-backed token revocation (current revocation is in-memory, resets on restart)
- Structured server-side logging (currently uses `console.error`)

Hello
