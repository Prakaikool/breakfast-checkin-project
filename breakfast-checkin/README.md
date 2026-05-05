# Breakfast Check-In System

A real-time breakfast check-in web system for hotels. Built with **Next.js 15**, **TypeScript**, **PostgreSQL**, and **Prisma**.

---

## Quick Start (5 minutes)

### Prerequisites

You need these installed on your computer:

| Tool | Version | How to install |
|------|---------|---------------|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org) (download LTS) |
| **VS Code** | Latest | [code.visualstudio.com](https://code.visualstudio.com) |
| **PostgreSQL** | 14+ | See database options below |
| **Git** | Latest | [git-scm.com](https://git-scm.com) |

### Step 1: Open project in VS Code

```bash
# Open your terminal and navigate to the project folder
cd breakfast-checkin

# Open in VS Code
code .
```

### Step 2: Install dependencies

```bash
npm install
```

### Step 3: Set up the database

Choose ONE of these options:

#### Option A: Docker (easiest — recommended)

Install [Docker Desktop](https://www.docker.com/products/docker-desktop/), then:

```bash
# Start PostgreSQL in Docker
docker run --name breakfast-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=breakfast_checkin \
  -p 5432:5432 \
  -d postgres:16

# Your DATABASE_URL is:
# postgresql://postgres:postgres@localhost:5432/breakfast_checkin
```

#### Option B: Local PostgreSQL

Install PostgreSQL for your OS:
- **Mac**: `brew install postgresql@16 && brew services start postgresql@16`
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **Linux**: `sudo apt install postgresql`

Then create the database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE breakfast_checkin;

# Exit
\q
```

#### Option C: Cloud database (free tier)

Sign up for one of these (all have free tiers):
- [**Supabase**](https://supabase.com) — easiest, gives you a PostgreSQL URL instantly
- [**Neon**](https://neon.tech) — serverless PostgreSQL
- [**Railway**](https://railway.app) — one-click PostgreSQL

Copy the connection string they give you.

### Step 4: Configure environment variables

```bash
# Copy the example file
cp .env.example .env
```

Open `.env` in VS Code and update:

```env
# Paste your database URL from Step 3
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/breakfast_checkin"

# Generate a secret key (run this in terminal):
#   openssl rand -base64 32
# Then paste the output here:
JWT_SECRET="paste-your-generated-secret-here"
```

### Step 5: Set up database tables and seed data

```bash
# Create all database tables from the Prisma schema
npx prisma migrate dev --name init

# Load sample data (rooms, guests, staff, menu items)
npm run db:seed
```

### Step 6: Run the app! 🚀

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Login credentials** (from seed data):
| Role | Email | Password |
|------|-------|----------|
| Admin | sandra@hotel.com | Admin@2026 |
| Staff | erik@hotel.com | Staff@2026 |

> Change these immediately after first login in production.

---

## VS Code Recommended Setup

### Extensions to install

Open VS Code → Extensions panel (Ctrl+Shift+X) → Search and install:

1. **Prisma** — syntax highlighting for `.prisma` files
2. **ESLint** — JavaScript/TypeScript linting
3. **Tailwind CSS IntelliSense** — autocomplete for Tailwind classes
4. **Pretty TypeScript Errors** — readable error messages
5. **GitLens** — enhanced Git integration

### VS Code Settings

Create `.vscode/settings.json` in your project:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

---

## Project Structure

```
breakfast-checkin/
├── prisma/
│   ├── schema.prisma          # DATABASE TABLES (your fullstack dev starts here)
│   └── seed.ts                # Sample data for development
│
├── src/
│   ├── app/                   # Pages and API routes (Next.js App Router)
│   │   ├── api/               # ← BACKEND (all API endpoints)
│   │   │   ├── auth/          #   Login, logout, current user
│   │   │   │   ├── login/
│   │   │   │   ├── logout/
│   │   │   │   └── me/
│   │   │   ├── guests/        #   Search guests by room/name
│   │   │   ├── checkins/      #   Create & list check-ins
│   │   │   ├── dashboard/     #   Stats, timeline, activity
│   │   │   │   ├── stats/
│   │   │   │   ├── timeline/
│   │   │   │   ├── activity/
│   │   │   │   └── public/    #   Guest-facing (no auth)
│   │   │   ├── kitchen/       #   Menu item status
│   │   │   └── spa/           #   Member verification
│   │   │
│   │   ├── login/             # ← FRONTEND pages
│   │   ├── checkin/           #   Main check-in interface
│   │   ├── dashboard/         #   Real-time dashboard
│   │   ├── kitchen/           #   Kitchen status
│   │   ├── members/           #   Spa/VIP members
│   │   ├── settings/          #   System settings
│   │   ├── layout.tsx         #   Root HTML layout
│   │   └── page.tsx           #   Home (redirects)
│   │
│   ├── components/            # Reusable UI components
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       ├── TopBar.tsx
│   │       └── AppShell.tsx
│   │
│   ├── hooks/                 # React hooks
│   │   ├── useAuth.ts         #   Login state management
│   │   └── usePolling.ts      #   Auto-refresh for dashboard
│   │
│   ├── lib/                   # Shared backend utilities
│   │   ├── db.ts              #   Database connection
│   │   ├── auth.ts            #   JWT & PIN verification
│   │   ├── validations.ts     #   Request validation (Zod)
│   │   ├── api-helpers.ts     #   Response formatting
│   │   └── utils.ts           #   General helpers
│   │
│   └── types/                 # TypeScript type definitions
│       └── index.ts
│
├── .env.example               # Environment variable template
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file
```

---

## Useful Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run db:studio` | Open Prisma Studio (visual database browser) |
| `npm run db:migrate` | Apply database schema changes |
| `npm run db:seed` | Load sample data |
| `npm run db:reset` | Reset database and re-seed |
| `npx prisma generate` | Regenerate Prisma client after schema changes |

---

## API Reference

### Authentication
| Method | Endpoint | Description | Auth? |
|--------|----------|-------------|-------|
| POST | `/api/auth/login` | Login with email + PIN | No |
| POST | `/api/auth/logout` | Clear session | Yes |
| GET | `/api/auth/me` | Get current staff info | Yes |

### Guest Search
| Method | Endpoint | Description | Auth? |
|--------|----------|-------------|-------|
| GET | `/api/guests?room=816` | Search by room number | Yes |
| GET | `/api/guests?name=smith` | Search by guest name | Yes |

### Check-in
| Method | Endpoint | Description | Auth? |
|--------|----------|-------------|-------|
| POST | `/api/checkins` | Register a check-in | Yes |
| GET | `/api/checkins?date=today` | List today's check-ins | Yes |

### Dashboard
| Method | Endpoint | Description | Auth? |
|--------|----------|-------------|-------|
| GET | `/api/dashboard/stats` | Total counts | Yes |
| GET | `/api/dashboard/timeline` | Check-ins per time slot | Yes |
| GET | `/api/dashboard/activity` | Current busy level | Yes |
| GET | `/api/dashboard/public` | Guest-facing status | **No** |

### Kitchen
| Method | Endpoint | Description | Auth? |
|--------|----------|-------------|-------|
| GET | `/api/kitchen` | List menu items | Yes |
| PATCH | `/api/kitchen/:id` | Update item status | Yes |

### Spa Members
| Method | Endpoint | Description | Auth? |
|--------|----------|-------------|-------|
| GET | `/api/spa/members` | List all members | Yes |
| GET | `/api/spa/verify?memberId=X` | Verify membership | Yes |

---

## For Your Fullstack Developer

### Where to start

1. **Read `prisma/schema.prisma`** — this defines every database table
2. **Read `src/lib/`** — these are the backend utilities they'll use everywhere
3. **Read `src/app/api/checkins/route.ts`** — this is the most complex endpoint and the pattern all others follow

### Backend patterns used

- **Authentication**: JWT tokens stored in HTTP-only cookies (not localStorage — more secure)
- **Validation**: Zod schemas validate every request body before it touches the database
- **Database**: Prisma ORM with PostgreSQL — type-safe queries, auto-generated types
- **Error handling**: Consistent `{ success, data/error }` response format
- **Real-time updates**: Frontend polls `/api/dashboard/*` every 15 seconds

### How to add a new API endpoint

1. Create a folder in `src/app/api/your-endpoint/`
2. Create `route.ts` inside it
3. Export `GET`, `POST`, `PATCH`, or `DELETE` functions
4. Use `requireAuth()` for protected routes
5. Use Zod schemas from `validations.ts` to validate input
6. Use helpers from `api-helpers.ts` for responses

### PMS Integration (future)

Most hotel PMS systems expose REST APIs:
- **Oracle OHIP** (Opera): REST API for guest/reservation data
- **Mews**: Open API at `api.mews.com`
- **Protel**: OTA/XML interface

The integration point is `src/app/api/sync/`. Create a service that:
1. Calls the PMS API to fetch today's guests + rooms
2. Upserts the data into your PostgreSQL
3. Runs on a schedule (cron job) or manually via the admin panel

---

## Deployment

When ready for production, deploy to:
- **Vercel** (recommended for Next.js) — connects to your GitHub repo
- **Railway** — includes PostgreSQL hosting
- **Docker** — use the Dockerfile for self-hosting

```bash
# Build for production
npm run build

# Start production server
npm start
```
