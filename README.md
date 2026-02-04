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
2. **Run the Database Schema:**
   - Go to SQL Editor in your Supabase dashboard
   - Run the schema from `src/lib/db/schema.sql`
   - This creates the necessary tables for user credits, IP usage, uploaded files, and analytics

3. **Create Storage Bucket:**
   - Navigate to Storage in your Supabase dashboard
   - Click "Create a new bucket"
   - Name it `temp-uploads` (exact name required)
   - Choose "Public bucket" or configure appropriate access policies
   - Files will be automatically cleaned up after 24 hours via cron job

4. **Configure Authentication:**
   - Go to Authentication > URL Configuration
   - Add your Site URL:
     - Development: `http://localhost:3000`
     - Production: Your deployed URL (e.g., `https://yourdomain.com`)
   - Add Redirect URLs:
     - Development: `http://localhost:3000/auth/callback`
     - Production: `https://yourdomain.com/auth/callback`

5. **Configure Email Provider:**
   - Go to Authentication > Providers
   - Ensure "Email" provider is enabled
   - **For Development (easier testing):**
     - Uncheck "Confirm email" to disable email verification
     - Users can sign up and log in immediately without verifying their email
   - **For Production (recommended):**
     - Keep "Confirm email" enabled
     - Configure SMTP settings (Authentication > Settings > SMTP Settings)
     - Or use Supabase's built-in email service
     - Customize email templates if desired

6. **Get API Credentials:**
   - Go to Settings > API
   - Copy your Project URL, anon/public key, and service_role key
   - You'll need these for the environment variables

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

---

## Troubleshooting

### Email Sign Up/Login Not Working

**Problem:** Users can't sign up or log in with email.

**Solutions:**
1. **Verify environment variables are set correctly:**
   ```bash
   # Check your .env.local file has:
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

2. **Check Supabase Authentication settings:**
   - Go to Authentication > Providers in Supabase dashboard
   - Ensure "Email" provider is enabled
   - For development: Disable "Confirm email" in provider settings
   - For production: Configure SMTP or use Supabase email service

3. **Verify redirect URLs:**
   - Go to Authentication > URL Configuration
   - Ensure your site URL and redirect callback URLs are correctly set
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`

4. **Check browser console for errors:**
   - Open browser DevTools (F12)
   - Look for any authentication-related errors
   - Common issues: CORS errors (check Site URL), invalid API keys

### File Upload Stuck on "Processing"

**Problem:** File upload gets stuck and never completes.

**Solutions:**
1. **Check file size and format:**
   - Maximum file size: 5 MB per file
   - Maximum files: 3 per submission
   - Supported formats: JPEG, PNG, GIF, WebP, PDF
   - PDF maximum pages: 20

2. **Verify storage bucket exists:**
   - Go to Storage in Supabase dashboard
   - Ensure `temp-uploads` bucket exists (exact name)
   - Check bucket permissions allow uploads

3. **Check browser console and network tab:**
   - Look for error messages from `/api/process` endpoint
   - Check if request is completing or timing out
   - Network errors may indicate connectivity issues

4. **Try with a smaller/simpler file:**
   - Start with a small, clear image (< 1 MB)
   - If successful, gradually test larger files
   - Complex or low-quality images may take longer to process

5. **OCR processing issues:**
   - Tesseract.js requires internet access to download worker files
   - Check browser console for CDN loading errors
   - If behind a firewall, CDN URLs may be blocked

### Database Connection Issues

**Problem:** Error messages about database operations failing.

**Solutions:**
1. **Verify database schema is installed:**
   - Run `src/lib/db/schema.sql` in Supabase SQL Editor
   - Check that tables exist: `user_credits`, `ip_usage`, `uploaded_files`, `analytics_events`

2. **Check service role key:**
   - Ensure `SUPABASE_SERVICE_ROLE_KEY` is correct
   - This key is needed for server-side operations
   - Never expose this key in client-side code

3. **Row Level Security (RLS):**
   - The service role key bypasses RLS
   - If using anon key for operations, RLS policies must allow access

### Credits Not Resetting

**Problem:** User credits don't reset after 24 hours.

**Solutions:**
1. **Credits reset on next use:**
   - The system checks and resets credits when users attempt to process files
   - Credits are not automatically reset in the background

2. **Check `user_credits` table:**
   - Look at `reset_at` timestamp in the database
   - Verify it's being set when credits reach zero

### General Debugging Tips

1. **Enable development mode error details:**
   - Error responses include stack traces when `NODE_ENV=development`
   - Check API responses in browser Network tab for detailed errors

2. **Check server logs:**
   - When running locally: Check terminal where `npm run dev` is running
   - When deployed: Check Vercel logs or your hosting platform's logs

3. **Test with curl:**
   ```bash
   # Test the access check endpoint
   curl http://localhost:3000/api/access/check
   
   # Test file processing (replace with actual file)
   curl -X POST http://localhost:3000/api/process \
     -F "files=@/path/to/test-image.jpg"
   ```

4. **Verify all environment variables are loaded:**
   ```javascript
   // Add temporarily to your API route to debug:
   console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
   console.log('Has service key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
   ```

### Still Having Issues?

If you're still experiencing problems:
1. Check the browser console for client-side errors
2. Check the server logs for backend errors
3. Verify all setup steps were completed correctly
4. Try with a fresh Supabase project to rule out configuration issues
5. Ensure you're using compatible versions of dependencies (see `package.json`)
