# STGLOBAL Project Structure

## Overview

STGLOBAL is a full-stack crypto trading platform with a mobile-first UI, separate customer and admin applications, real-time market data, and transparent trading logic.

## Directory Structure

```
stglobal/
├── client/                          # React frontend application
│   ├── public/                      # Static assets (favicon, robots.txt)
│   ├── src/
│   │   ├── pages/                   # Page components
│   │   │   ├── Home.tsx             # Landing page with hero, markets, login
│   │   │   ├── Spot.tsx             # Spot trading with TradingView chart
│   │   │   ├── Contracts.tsx        # Short-term contracts (30s/60s)
│   │   │   ├── Assets.tsx           # Wallet balances and transfers
│   │   │   ├── Profile.tsx          # User profile and settings
│   │   │   ├── About.tsx            # Company information
│   │   │   ├── Admin.tsx            # Admin dashboard (role-gated)
│   │   │   └── NotFound.tsx         # 404 page
│   │   ├── components/              # Reusable UI components
│   │   ├── contexts/                # React contexts (theme, auth)
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── lib/                     # Utility functions
│   │   │   └── trpc.ts              # tRPC client configuration
│   │   ├── App.tsx                  # Main app shell with routing
│   │   ├── main.tsx                 # React entry point
│   │   └── index.css                # Global styles and theme tokens
│   └── index.html                   # HTML template
│
├── server/                          # Express backend
│   ├── _core/                       # Framework internals (don't edit)
│   │   ├── index.ts                 # Server entry point
│   │   ├── context.ts               # tRPC request context
│   │   ├── trpc.ts                  # tRPC setup
│   │   ├── env.ts                   # Environment variables
│   │   └── ...
│   ├── db.ts                        # Database query helpers
│   ├── routers.ts                   # tRPC procedures (API endpoints)
│   ├── tradingEngine.ts             # Trading logic and settlement
│   ├── operationRules.ts            # Wallet and transaction validation
│   ├── auth.logout.test.ts          # Auth tests
│   ├── tradingEngine.test.ts        # Trading engine tests
│   └── operationRules.test.ts       # Operation validation tests
│
├── drizzle/                         # Database schema and migrations
│   ├── schema.ts                    # Table definitions
│   ├── 0001_*.sql                   # Migration files
│   └── 0002_*.sql
│
├── storage/                         # S3 file storage helpers
│   └── index.ts
│
├── shared/                          # Shared constants and types
│   └── const.ts
│
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
├── vite.config.ts                   # Vite build configuration
├── drizzle.config.ts                # Drizzle ORM configuration
├── vitest.config.ts                 # Vitest test configuration
│
├── DEPLOYMENT_GUIDE.md              # How to deploy to Vercel/Supabase
├── ENV_SETUP_INSTRUCTIONS.md        # Environment variables guide
├── PROJECT_STRUCTURE.md             # This file
├── route-verification.md            # Route testing evidence
└── todo.md                          # Implementation checklist

```

## Key Features

### Customer Platform

1. **Home Page** (`/`)
   - Hero banner with slider
   - Live market data (Hot, Crypto, Forex, Metals)
   - Quick links to trading pages
   - Login/Register form

2. **Spot Trading** (`/spot`)
   - TradingView embedded chart widget
   - Buy/Sell order interface
   - Real-time price quotes
   - Order history

3. **Contracts** (`/contracts`)
   - UP/FALL binary options
   - 30-second and 60-second durations
   - USDT amount input
   - Profit rate display
   - Trade history with results

4. **Assets** (`/assets`)
   - USDT, BTC, ETH wallet balances
   - Deposit, Withdraw, Transfer actions
   - Transaction history

5. **Profile** (`/profile`)
   - User email and ID
   - VIP level
   - Account settings

6. **About** (`/about`)
   - Company description
   - Mission statement

### Admin Platform

1. **Dashboard** (`/admin`)
   - Total users count
   - Total balance statistics
   - Trade volume metrics

2. **User Management**
   - View all users
   - Freeze/unfreeze accounts
   - Reset user passwords

3. **Wallet Control**
   - Add balance to user accounts
   - Deduct balance (audited)
   - View transaction history

4. **Deposit/Withdraw Approval**
   - Review pending transactions
   - Approve or reject requests
   - View transaction logs

5. **Trade Monitoring**
   - View all trades
   - Filter by user, symbol, status
   - Monitor win/loss rates

6. **System Settings**
   - Configure profit percentages
   - Set trade durations (30s/60s)
   - Toggle features on/off
   - Demo/simulation mode controls

## Technology Stack

### Frontend
- **React 19** - UI framework
- **Tailwind CSS 4** - Styling
- **Vite** - Build tool
- **tRPC** - Type-safe API client
- **shadcn/ui** - Component library
- **Wouter** - Lightweight router
- **TradingView Lightweight Charts** - Chart widget

### Backend
- **Node.js** - Runtime
- **Express 4** - Web framework
- **tRPC 11** - RPC framework
- **Drizzle ORM** - Database ORM
- **PostgreSQL** - Database (via Supabase)

### Testing
- **Vitest** - Unit testing framework

### Deployment
- **Vercel** - Hosting
- **Supabase** - PostgreSQL database
- **GitHub** - Version control

## Database Schema

### Core Tables
- **users** - User accounts with auth info
- **wallets** - User wallet balances (USDT, BTC, ETH)
- **trades** - Contract trades (UP/FALL positions)
- **transactions** - Deposits, withdrawals, transfers
- **auditLogs** - Admin actions and changes
- **systemSettings** - Platform configuration

## API Endpoints (tRPC)

All API calls go through `/api/trpc/*` and are type-safe.

### Authentication
- `auth.me` - Get current user
- `auth.logout` - Clear session
- `auth.register` - Create account
- `auth.login` - Email/password login

### Market Data
- `market.getSnapshot` - Get current prices
- `market.getSettings` - Get platform settings

### Trading
- `trade.placeContract` - Place UP/FALL trade
- `trade.settleContract` - Settle completed trade
- `trade.getHistory` - Get user's trade history

### Wallet
- `wallet.getBalances` - Get USDT/BTC/ETH balances
- `wallet.transfer` - Transfer between users
- `wallet.getTransactions` - Get transaction history

### Admin (role-gated)
- `admin.getDashboard` - Dashboard stats
- `admin.getUsers` - List all users
- `admin.freezeUser` - Freeze account
- `admin.resetPassword` - Reset user password
- `admin.adjustBalance` - Add/deduct balance
- `admin.reviewTransaction` - Approve/reject
- `admin.getTrades` - View all trades
- `admin.overrideTradeOutcome` - Demo outcome control
- `admin.getSettings` - Get system settings
- `admin.updateSettings` - Update settings

## Development Workflow

1. **Install dependencies**: `pnpm install`
2. **Set up environment**: Create `.env.local` with database URL and secrets
3. **Run migrations**: `pnpm drizzle-kit migrate`
4. **Start dev server**: `pnpm dev`
5. **Run tests**: `pnpm test`
6. **Build for production**: `pnpm build`

## Security Features

- JWT authentication for email/password users
- Password hashing with bcrypt
- Role-based access control (user/admin)
- Audited admin actions with timestamps
- Trade ownership validation
- Settlement timing enforcement (no pre-expiry settlement)
- Transparent trading logic (no hidden manipulation)

## Performance Considerations

- Mobile-first responsive design
- Lazy loading for pages and components
- WebSocket support for live price updates
- Optimized TradingView chart widget
- Efficient database queries with Drizzle ORM

## Customization Guide

### Change Theme Colors
Edit `client/src/index.css` - Look for CSS variables in `:root` and `.dark` sections.

### Add New Pages
1. Create `client/src/pages/NewPage.tsx`
2. Add route to `client/src/App.tsx`
3. Add navigation link in header

### Add New API Procedures
1. Add database helper in `server/db.ts`
2. Add tRPC procedure in `server/routers.ts`
3. Call from frontend with `trpc.feature.useQuery/useMutation()`

### Modify Database Schema
1. Edit `drizzle/schema.ts`
2. Run `pnpm drizzle-kit generate`
3. Review generated SQL in `drizzle/0xxx_*.sql`
4. Run `pnpm drizzle-kit migrate`

## Deployment

See `DEPLOYMENT_GUIDE.md` for step-by-step Vercel + Supabase setup.

## Support & Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [tRPC Documentation](https://trpc.io)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Tailwind CSS Documentation](https://tailwindcss.com)
