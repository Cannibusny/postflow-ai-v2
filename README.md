# PostFlow AI — Sovereign Instagram Command Center

Production-grade Instagram posting automation with manual override capabilities. Built for **@cannibus_ny**.

## Tech Stack

- **Backend:** Node.js + Express
- **Database:** Supabase (PostgreSQL)
- **Frontend:** React + Tailwind CSS + Recharts
- **Deployment:** Railway
- **Instagram:** Meta Graph API (Business API)

## Features

- **Instagram Business API Integration** — Post images, carousels, schedule with precision
- **Scheduling Engine** — Cron checks every 5 minutes, auto-publishes, retries with exponential backoff
- **Admin Dashboard** — Calendar view, post queue, Instagram preview, analytics charts
- **Caption Variants** — 3 caption options per post (Direct, Storytelling, Challenge)
- **Analytics** — Fetch engagement data from Instagram, compare predicted vs actual
- **Manual Controls** — Publish now, pause, reschedule, delete from dashboard

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check (no auth) |
| GET | `/api/posts` | List all posts with variants |
| GET | `/api/posts/:id` | Get single post |
| POST | `/api/posts` | Create new post |
| PUT | `/api/posts/:id` | Update post |
| DELETE | `/api/posts/:id` | Delete post |
| POST | `/api/posts/:id/publish` | Immediately publish |
| POST | `/api/posts/:id/pause` | Pause scheduled post |
| GET | `/api/analytics` | Get all analytics |
| GET | `/api/analytics/:id` | Get post analytics |
| POST | `/api/analytics/:id/refresh` | Refresh analytics |

## Setup

### 1. Clone and install

```bash
git clone https://github.com/Cannibusny/postflow-ai-v2.git
cd postflow-ai-v2
npm install
cd client && npm install && cd ..
```

### 2. Create Supabase tables

Run `sql/schema.sql` in the Supabase SQL Editor for project `peggccsshifakrfuyowi`.

### 3. Environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required:
- `SUPABASE_URL` — Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
- `INSTAGRAM_ACCESS_TOKEN` — Meta Graph API access token
- `INSTAGRAM_BUSINESS_ACCOUNT_ID` — Instagram Business account ID
- `FACEBOOK_PAGE_ID` — Facebook Page ID
- `API_BEARER_TOKEN` — Token for API authentication

### 4. Seed initial data

```bash
npm run seed
```

### 5. Run

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### 6. Deploy to Railway

Railway auto-deploys from the `main` branch. The `railway.json` configures build and deploy commands.

## Authentication

All `/api/*` endpoints require a Bearer token:

```
Authorization: Bearer YOUR_API_BEARER_TOKEN
```

Set `API_BEARER_TOKEN` in your environment. If not set, authentication is disabled (dev mode).

## Scheduler

The scheduler runs every 5 minutes and:
1. Finds posts with `status = 'scheduled'` and `scheduled_date <= now`
2. Publishes via Instagram Business API
3. Retries failed posts (up to 3 attempts with exponential backoff)
4. Fetches analytics for recently posted content

## License

Private — CNY LLC / ADgorhythms
