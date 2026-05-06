# STGLOBAL Deployment Guide

This guide covers deploying STGLOBAL to Vercel with Supabase as the database backend.

## Prerequisites

- GitHub account (for repository and Vercel integration)
- Vercel account (free tier works)
- Supabase account (free tier works)
- Node.js 18+ and pnpm installed locally

## Step 1: Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to initialize
3. In the Supabase dashboard, go to **Settings → Database** and copy your connection string
4. The connection string format: `postgresql://user:password@host:port/database`

## Step 2: Migrate Database Schema

1. Clone your GitHub repository locally
2. Install dependencies: `pnpm install`
3. Create a `.env.local` file with:
   ```
   DATABASE_URL=your_supabase_connection_string
   JWT_SECRET=generate_a_random_secret_key
   ```
4. Run migrations: `pnpm drizzle-kit migrate`
5. Verify tables were created in Supabase dashboard

## Step 3: Create GitHub Repository

1. Create a new repository on GitHub
2. Clone it locally
3. Copy all STGLOBAL project files into the repository
4. Commit and push:
   ```bash
   git add .
   git commit -m "Initial STGLOBAL commit"
   git push origin main
   ```

## Step 4: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New" → "Project"**
3. Select your GitHub repository
4. In **Environment Variables**, add:
   - `DATABASE_URL`: Your Supabase connection string
   - `JWT_SECRET`: Your JWT secret
   - `VITE_APP_ID`: Your OAuth app ID (if using Manus OAuth)
   - `OAUTH_SERVER_URL`: OAuth server URL
   - Other required environment variables from `.env.example`
5. Click **"Deploy"**
6. Wait for deployment to complete

## Step 5: Configure Custom Domain (Optional)

1. In Vercel project settings, go to **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions

## Environment Variables Required

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string | `postgresql://...` |
| `JWT_SECRET` | Secret key for JWT signing | Generate with `openssl rand -base64 32` |
| `VITE_APP_ID` | OAuth application ID | From your OAuth provider |
| `OAUTH_SERVER_URL` | OAuth server base URL | `https://api.example.com` |
| `VITE_OAUTH_PORTAL_URL` | OAuth login portal URL | `https://login.example.com` |
| `OWNER_OPEN_ID` | Owner's OAuth ID | From your OAuth provider |
| `OWNER_NAME` | Owner's display name | Your name |

## Troubleshooting

**Database connection fails:**
- Verify Supabase connection string is correct
- Check that Supabase IP whitelist allows Vercel IPs
- In Supabase, go to Settings → Database → Connection Pooling and enable it

**Build fails on Vercel:**
- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Run `pnpm build` locally to test

**OAuth not working:**
- Verify OAuth credentials are correct
- Check redirect URLs match your Vercel domain
- Ensure environment variables are set correctly

## Local Development

1. Install dependencies: `pnpm install`
2. Create `.env.local` with database and OAuth credentials
3. Run dev server: `pnpm dev`
4. Open `http://localhost:3000`

## Production Build

```bash
pnpm build
pnpm start
```

## Support

For issues or questions, refer to:
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
