# BoerIT

Farm forecasting application.

- **`BoerIT.Server/`** — .NET 10 Web API (ASP.NET Core, Dapper, PostgreSQL, JWT auth).
- **`BoerIT.UI/`** — Next.js 15 / React 19 frontend.

## Prerequisites

| Tool | Version used |
|------|--------------|
| .NET SDK | 10.x |
| Node.js | 20.x (18.18+ works) |
| PostgreSQL | 12+ running on `localhost:5432` |

## First-time setup

1. **Database** — nothing to create by hand. On startup the backend (via DbUp)
   creates the `boerit` database and runs the migrations in
   `BoerIT.Server/BoerIT.DbUp/Scripts/`. It just needs a Postgres login that can
   create databases.

2. **Backend config** — copy the example file and fill in your own values:

   ```powershell
   copy BoerIT.Server\BoerIT.Server\appsettings.Development.json.example BoerIT.Server\BoerIT.Server\appsettings.Development.json
   ```

   It holds the connection string, JWT secret, and allowed CORS origins. Update
   the connection string to match your local Postgres credentials:

   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Host=localhost;Port=5432;Database=boerit;Username=postgres;Password=your-password"
   }
   ```

   > This file is gitignored — it never leaves your machine. Use a real random
   > JWT secret before deploying anywhere.

3. **Frontend config** — copy `BoerIT.UI/.env.local.example` to
   `BoerIT.UI/.env.local` (also gitignored). It points the UI at the API:

   ```
   NEXT_PUBLIC_API_URL=http://localhost:5271
   ```

4. **Frontend deps** — `cd BoerIT.UI && npm install` (only needed once).

## Running

From this folder:

```powershell
./dev.ps1
```

This opens the backend and frontend in separate windows. Or run them manually:

```powershell
# Backend  -> http://localhost:5271
cd BoerIT.Server/BoerIT.Server
dotnet run --launch-profile http

# Frontend -> http://localhost:3001
cd BoerIT.UI
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:5271 |
| Swagger UI | http://localhost:5271/swagger |

Test login: **`test@boerit.local` / `Test1234!`** (or register a new account).

## Notes on the local setup

- **HTTP, not HTTPS.** The backend `launchSettings.json` also defines an HTTPS
  profile (`:7149`), but the dev wiring uses plain HTTP to avoid the browser
  rejecting the self-signed dev certificate on `fetch` calls. If you switch to
  HTTPS, update `NEXT_PUBLIC_API_URL` and run `dotnet dev-certs https --trust`.
- **Frontend port is pinned to 3001** (`next dev -p 3001` in `package.json`)
  because port 3000 is often occupied on this machine. The backend's
  `Cors:AllowedOrigins` allows both `:3000` and `:3001`. If you change the
  frontend port, add it there too or the browser will block API calls.
