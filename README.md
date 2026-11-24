# AI Capsule

A private prompt library: sign in with GitHub, then create, view, update and delete your own AI prompt records.

- **Deployed URL:** `TODO: https://YOUR-APP.onrender.com`
- **Cloud platform:** Render (Web Service, free tier)
- **Stack:** React (Vite) + Node.js/Express + SQLite (`better-sqlite3`)

## Project structure

```
server/
  index.js              Express app; serves the API and the built React app
  db.js                 Opens SQLite and creates the capsules table on start
  middleware/auth.js    requireAuth: verifies the JWT from the "token" cookie
  routes/auth.js        GitHub OAuth, logout, /api/me
  routes/capsules.js    CRUD for /api/capsules (all routes behind requireAuth)
  routes/health.js      GET /api/health
client/                 React app (Vite): pages, components, api.js
```

## Install and run locally

Requires Node 20+.

```bash
npm install
npm --prefix client install
cp .env.example .env        # then fill in the values
npm run dev:server          # Express on http://localhost:3000
npm run dev:client          # Vite on http://localhost:5173  (open this one)
```

Vite proxies `/api` and `/auth` to Express, so the browser only talks to one origin, as in production.

Production-style run (what Render does):

```bash
npm install && npm run build
npm start
```

## Environment variables

Names only; values are set locally in `.env` (git-ignored) and on Render's Environment tab.

| Name | Purpose |
|---|---|
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `JWT_SECRET` | Secret used to sign and verify the application JWT |
| `BASE_URL` | Public URL of the app, used for the OAuth callback |
| `NODE_ENV` | `production` on Render (enables Secure cookies) |
| `PORT` | Set automatically by Render |
| `DB_PATH` | Optional SQLite file location |

## Render deployment settings

- Build command: `npm install && npm run build`
- Start command: `npm start`
- GitHub OAuth App callback URL: `https://YOUR-APP.onrender.com/auth/github/callback`

## API routes and how React talks to Express

React and Express are served from the same URL, so the frontend calls relative paths (`/api/...`) with `credentials: "include"`. All calls are in `client/src/api.js`.

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Landing page |
| `/login` | Public | Starts GitHub login |
| `/dashboard` | Protected | The user's records |
| `GET /api/health` | Public | Returns `{ "status": "ok" }` |
| `GET /api/capsules` | Protected | Read own records |
| `POST /api/capsules` | Protected | Create own record |
| `PUT /api/capsules/:id` | Protected | Update own record |
| `DELETE /api/capsules/:id` | Protected | Delete own record |
| `GET /auth/github`, `GET /auth/github/callback`, `POST /auth/logout`, `GET /api/me` | Auth helpers | OAuth flow, logout, current user |

## OAuth and JWT

- **Provider:** GitHub OAuth.
- **Flow:** `/auth/github` redirects to GitHub (with a random `state` value) -> GitHub redirects to `/auth/github/callback?code=...` -> Express exchanges the code for a GitHub access token (used once, never stored or sent to the browser), reads the GitHub user, and signs **its own** JWT (`sub` = GitHub user ID).
- **Storage:** the JWT is set in a cookie named `token` with `HttpOnly`, `Secure` (in production), `SameSite=Lax`. It is not in localStorage and not an Authorization header.
- **Verification:** `requireAuth` in `server/middleware/auth.js` runs `jwt.verify` (HS256) on every request to `/api/capsules`; missing, invalid, tampered or expired tokens return `401`.

## Database and ownership

- SQLite file is created automatically on startup (`server/db.js`, `CREATE TABLE IF NOT EXISTS`).
- Each capsule has a `user_id` column holding the GitHub user ID from the verified JWT. The browser never sends it; the server ignores any `user_id` in a request body.
- Every query is scoped to the owner: `WHERE user_id = ?` for reads, and `WHERE id = ? AND user_id = ?` for update/delete (another user's id matches nothing and returns 404).
- **Storage is ephemeral on Render's free tier:** the local filesystem is wiped on restart or redeploy, so saved records can be lost. TODO: confirm/adjust if you use Render PostgreSQL or a persistent disk.

## Required cURL tests

```bash
# Test 1 - no authentication
curl -i https://YOUR-APP.onrender.com/api/capsules
# Test 2 - fake / invalid JWT
curl -i -H "Cookie: token=fake-token-123" https://YOUR-APP.onrender.com/api/capsules
```

Results: TODO - paste the actual output from your deployed URL (both should be `HTTP/1.1 401 Unauthorized`).

## AI-assisted development

- **Tools used:** TODO (e.g. Claude).
- **A problem found and corrected in AI-generated output:** TODO - write a real one you encountered. (Candidates only if they genuinely happened to you.)
- **How OAuth/JWT/protection was verified:** TODO - e.g. the two cURL tests, logging in through GitHub on the deployed URL, and confirming the `token` cookie is HttpOnly/Secure in browser dev tools.
- **How CRUD and ownership were verified:** TODO - e.g. creating records with two different GitHub accounts and confirming each only sees their own, and that editing/deleting by another user's id returns 404.
- **A decision I made and can explain:** TODO - e.g. serving React from Express so there is one origin and no CORS or cross-site cookie setup.

## Limitation

TODO: state one honest limitation, e.g. SQLite data on Render's free tier is ephemeral, and the first request after idle can be slow while the free service wakes up.
