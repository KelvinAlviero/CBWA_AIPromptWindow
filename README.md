# AI Capsule

A private prompt library: sign in with GitHub, then create, view, update and delete your own AI prompt records.

- Deployed URL: `https://cbwaaipromptwindow-production.up.railway.app/`
- Cloud platform: Railway (Web/database Service, free tier)
- Stack: React (Vite) + Node.js/Express + SQLite (`better-sqlite3`)

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


Vite proxies `/api` and `/auth` to Express, so the browser only talks to one origin, as in production.

Production-style run:

```bash
npm install && npm run build
npm start
```

## Environment variables


| Name | Purpose |
|---|---|
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `JWT_SECRET` | Secret used to sign and verify the application JWT |
| `BASE_URL` | Public URL of the app, used for the OAuth callback |
| `NODE_ENV` | `production` on Railway (enables Secure cookies) |

## Render deployment settings

- Build command: `npm install && npm run build`
- Start command: `npm start`
- GitHub OAuth App callback URL: `https://cbwaaipromptwindow-production.up.railway.app/auth/github/callback`

## API routes and how React talks to Express

React and Express are from the same URL, so the frontend calls the paths (`/api/...`) with `credentials: "include"`. All calls are inside `client/src/api.js`.

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

- Provider: GitHub OAuth.
- Flow: `/auth/github` redirects to GitHub (with a random `state` value) -> GitHub redirects to `/auth/github/callback?code=...` -> Express exchanges the code for a GitHub access token, reads the GitHub user, and signs it's own JWT .
- Storage: the JWT is set in a cookie named `token` with `HttpOnly`, `Secure` (in production), `SameSite=Lax`. It is not in localStorage and not an Authorization header.
- Verification: `requireAuth` in `server/middleware/auth.js` runs `jwt.verify` (HS256) on every request to `/api/capsules`; missing, invalid, tampered or expired tokens return `401`.

## Database and ownership

- SQLite file is created automatically on startup (`server/db.js`, `CREATE TABLE IF NOT EXISTS`).
- Each capsule has a `user_id` column holding the GitHub user ID from the verified JWT. The browser never sends it; the server ignores any `user_id` in a request body.
- Every query is scoped to the owner: `WHERE user_id = ?` for reads, and `WHERE id = ? AND user_id = ?` for update/delete (another user's id matches nothing and returns 404).
- Storage is ephemeral on Render's free tier: the local filesystem is wiped on restart or redeploy, so saved records can be lost. TODO: confirm/adjust if you use Render PostgreSQL or a persistent disk.

## Required cURL tests

```bash
# Test 1 - no authentication
curl -i https://cbwaaipromptwindow-production.up.railway.app/api/capsules
# Test 2 - fake / invalid JWT
curl -i -H "Cookie: token=fake-token-123" https://cbwaaipromptwindow-production.up.railway.app/api/capsules
```

Results: 

## AI-assisted development

- Tools used: Claude for Railway connecting, file formatting and.
- A problem found and corrected in AI-generated output: Deploying node_modules and the .env file was a major security risk and didn't start my website, I also made 2 seperate branches, main and MK2, 
-How OAuth/JWT/protection was verified: The two cURL tests, logging in through GitHub on the deployed URL, and confirming the `token` cookie is HttpOnly/Secure in browser dev tools.
- How CRUD and ownership were verified: creating records with two different GitHub accounts and confirming each only sees their own, and that editing/deleting by another user's id returns 404.


## Limitation

Railway's free tier is ephemeral, meaning it will reset data upon server restart, also, the server will only last 30 days until it is gone fully
