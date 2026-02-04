# Conclave - Handwriting to Text

Convert handwritten notes to digital text using OCR technology.

## Tech Stack

- **Frontend:** Next.js 14 with TypeScript
- **Backend:** Next.js Route Handlers
- **Authentication:** Supabase Auth
- **Database:** Supabase Postgres
- **File Storage:** Supabase Storage (temporary)
- **OCR Processing:** Tesseract.js + pdf-parse
- **Styling:** Tailwind CSS
- **Hosting:** Vercel

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `src/lib/db/schema.sql`
3. Create a storage bucket named `temp-uploads`

### 3. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (keep secret!)
- `CLEANUP_SECRET_TOKEN` - (Optional) Secret token for cleanup cron job

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage Limits

| User Type | Limit |
|-----------|-------|
| Unauthenticated | 1 total use (IP-based) |
| Authenticated | 3 credits per 24 hours |

### File Limits

- Maximum 3 files per submission
- Maximum 5 MB per file
- Maximum 20 pages per PDF
- Supported formats: JPEG, PNG, GIF, WebP, PDF

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── access/check/    # Access validation endpoint
│   │   ├── analytics/track/ # Analytics event logging
│   │   ├── cleanup/         # File cleanup cron endpoint
│   │   └── process/         # OCR processing endpoint
│   ├── auth/callback/       # Supabase auth callback
│   ├── convert/             # Main conversion page
│   ├── login/               # Authentication page
│   └── page.tsx             # Landing page
├── components/
│   ├── CreditDisplay.tsx    # Credit counter with timer
│   ├── Header.tsx           # App header with auth
│   ├── ResultsDisplay.tsx   # OCR results viewer
│   └── UploadZone.tsx       # File upload component
├── lib/
│   ├── db/schema.sql        # Database schema
│   ├── supabase/            # Supabase client configs
│   ├── types.ts             # TypeScript types & constants
│   └── utils.ts             # Utility functions
└── middleware.ts            # Auth session middleware
```

## Deployment to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

The `vercel.json` configures a cron job to run file cleanup every hour.

## API Endpoints

### `GET /api/access/check`
Check if user can access the service (credits/IP validation).

### `POST /api/process`
Process uploaded files with OCR. Requires multipart form data with `files` field.

### `POST /api/analytics/track`
Log analytics events. Body: `{ eventType: string, metadata?: object }`

### `POST /api/cleanup`
Delete files older than 24 hours. Protected by `CLEANUP_SECRET_TOKEN`.

## License

Private - All rights reserved.
