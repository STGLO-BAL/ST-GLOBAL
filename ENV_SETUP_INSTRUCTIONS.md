# Environment Variables Setup for STGLOBAL

When deploying STGLOBAL to Vercel with Supabase, you'll need to configure the following environment variables:

## Required Environment Variables

### Database
- **DATABASE_URL**: Your Supabase PostgreSQL connection string
  - Format: `postgresql://user:password@host:port/database`
  - Get from: Supabase Dashboard → Settings → Database

### Authentication & JWT
- **JWT_SECRET**: Secret key for signing JWT tokens
  - Generate with: `openssl rand -base64 32`
  - Keep this secure and never share it

### OAuth Configuration
- **VITE_APP_ID**: Your OAuth application ID
- **OAUTH_SERVER_URL**: OAuth server base URL (e.g., `https://api.manus.im`)
- **VITE_OAUTH_PORTAL_URL**: OAuth login portal URL (e.g., `https://login.manus.im`)
- **OWNER_OPEN_ID**: Owner's OAuth identifier
- **OWNER_NAME**: Owner's display name

### Optional: Manus Built-in APIs
- **BUILT_IN_FORGE_API_URL**: Manus API endpoint
- **BUILT_IN_FORGE_API_KEY**: Manus API key (server-side)
- **VITE_FRONTEND_FORGE_API_URL**: Manus API endpoint for frontend
- **VITE_FRONTEND_FORGE_API_KEY**: Manus API key (frontend-safe)

### Optional: Analytics
- **VITE_ANALYTICS_ENDPOINT**: Analytics service URL
- **VITE_ANALYTICS_WEBSITE_ID**: Website ID for analytics

### Optional: App Branding
- **VITE_APP_TITLE**: Application title (default: "STGLOBAL")
- **VITE_APP_LOGO**: Logo image URL

## Setting Up in Vercel

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add each variable with its value
4. Select which environments it applies to (Production, Preview, Development)
5. Redeploy after adding variables

## Setting Up Locally

Create a `.env.local` file in the project root:

```
DATABASE_URL=your_supabase_connection_string
JWT_SECRET=your_jwt_secret
VITE_APP_ID=your_oauth_app_id
OAUTH_SERVER_URL=https://api.oauth.provider.com
VITE_OAUTH_PORTAL_URL=https://login.oauth.provider.com
OWNER_OPEN_ID=owner_id
OWNER_NAME=Your Name
```

Then run: `pnpm dev`

## Security Best Practices

1. **Never commit `.env.local`** - Add it to `.gitignore`
2. **Use strong JWT_SECRET** - Generate with cryptographic tools
3. **Rotate secrets periodically** - Especially after deployment
4. **Use Vercel's secret management** - Don't hardcode in code
5. **Keep OAuth credentials private** - Don't share with unauthorized users
