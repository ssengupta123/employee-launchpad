# Launchpad - Employee App Hub

## Overview
A personalised employee application launchpad/dashboard. Users can access all their business applications, tools, and resources from a single dashboard. Includes admin panel for managing app tiles and categories. Apps open embedded inside the dashboard (no new tabs).

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui + wouter routing
- **Backend**: Express.js
- **Database (Development)**: PostgreSQL with Drizzle ORM (Replit built-in)
- **Database (Production)**: Azure SQL Database via `mssql` package
- **Auth (Development)**: Replit Auth (OpenID Connect via `openid-client`)
- **Auth (Production)**: Microsoft Entra ID SSO via `passport-azure-ad`
- **GitHub**: Connected via Replit GitHub integration (`server/github.ts`)

## Database Configuration
The app automatically selects the database based on environment variables:
- **PostgreSQL (default)**: Used when no Azure SQL variables are set. Uses Drizzle ORM.
- **Azure SQL**: Used when `AZURE_SQL_CONNECTION_STRING` or `AZURE_SQL_SERVER` is set.
  - `AZURE_SQL_CONNECTION_STRING` - Full connection string (preferred)
  - Or individual variables: `AZURE_SQL_SERVER`, `AZURE_SQL_DATABASE`, `AZURE_SQL_USER`, `AZURE_SQL_PASSWORD`, `AZURE_SQL_PORT`
  - Schema is auto-created on first run via `initializeSchema()`
- Storage interface (`IStorage`) abstracts both implementations in `server/storage.ts`
- Azure SQL implementation: `server/azureSqlStorage.ts`

## Key Features
- Landing page for unauthenticated users
- Personalised dashboard with app tiles
- Embedded app viewer (apps open inside the dashboard via iframe)
- Pin/unpin favourite apps
- Category-based filtering and search
- Admin panel for managing tiles and categories
- Admin image upload for tile logos and cover images (via multer, stored in `client/public/uploads/`)
- First logged-in user automatically becomes admin
- Dark/light mode toggle

## Authentication Configuration
The app auto-selects auth based on environment:
- **Replit (default)**: Uses Replit Auth (OpenID Connect) when no Azure SQL variables are set
- **Azure (production)**: Uses Microsoft Entra ID SSO when `AZURE_SQL_CONNECTION_STRING` or `AZURE_SQL_SERVER` is set
  - Required env vars: `AZURE_AD_TENANT_ID`, `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_REDIRECT_URI`
  - Auth module: `server/auth/azureAuth.ts`
  - Uses `passport-azure-ad` with OIDC strategy

## Project Structure
- `shared/schema.ts` - Database models (users, sessions, categories, tiles, userTiles, adminUsers)
- `shared/models/auth.ts` - Auth-specific models (users, sessions)
- `server/routes.ts` - API endpoints (auto-selects auth provider)
- `server/storage.ts` - Database storage layer (IStorage interface + PostgreSQL implementation)
- `server/azureSqlStorage.ts` - Azure SQL Database implementation
- `server/db.ts` - PostgreSQL database connection (conditional, skipped on Azure)
- `server/auth/azureAuth.ts` - Microsoft Entra ID SSO integration
- `server/github.ts` - GitHub integration via Replit connector
- `server/replit_integrations/auth/` - Replit Auth integration (Replit environment only)
- `client/src/pages/` - React pages (landing, dashboard, admin)
- `client/src/components/` - Reusable components (tile-card, theme-toggle, dynamic-icon)
- `client/src/hooks/use-auth.ts` - Auth hook

## API Routes
- `GET /api/tiles` - Get global tiles (authenticated)
- `GET /api/categories` - Get categories (authenticated)
- `GET /api/user-tiles` - Get user's pinned tiles (authenticated)
- `POST /api/user-tiles` - Pin a tile (authenticated)
- `DELETE /api/user-tiles/:tileId` - Unpin a tile (authenticated)
- `GET /api/admin/check` - Check admin status (authenticated)
- `GET /api/admin/tiles` - Get all tiles (admin)
- `POST /api/admin/upload` - Upload image file (admin, returns URL)
- `POST /api/admin/tiles` - Create tile (admin)
- `PATCH /api/admin/tiles/:id` - Update tile (admin)
- `DELETE /api/admin/tiles/:id` - Delete tile (admin)
- `POST /api/admin/categories` - Create category (admin)
- `PATCH /api/admin/categories/:id` - Update category (admin)
- `DELETE /api/admin/categories/:id` - Delete category (admin)
- `POST /api/sso-token` - Get SSO handoff token for embedded app (Azure only, authenticated)

## Running
- `npm run dev` - Start development server
- `npm run db:push` - Push database schema changes (PostgreSQL only)

## Azure Deployment Notes
- Set `AZURE_SQL_CONNECTION_STRING` environment variable to switch to Azure SQL
- The Azure SQL storage auto-creates tables on first run
- Set `AZURE_AD_TENANT_ID`, `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_REDIRECT_URI` for Entra ID SSO
- The `AZURE_AD_REDIRECT_URI` should be `https://<your-app>.azurewebsites.net/api/callback`
- `COOKIE_DOMAIN` - Set to parent domain (e.g., `.reasongroup.com.au`) to enable SSO session sharing across embedded apps in iframes. Both Launchpad and embedded apps must be subdomains of this domain. When set, cookies use `sameSite: none` for cross-subdomain sharing.
- GitHub repo: https://github.com/ssengupta123/employee-launchpad
