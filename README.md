# Chatly — realtime chat app

A full-stack chat application: **React + Vite + Tailwind + GSAP** on the front end, **Express + MongoDB (MVC)** with **Socket.IO** on the back end.

## Features

- **Auth & roles** — JWT login/register, two roles: `admin` (seeded) and `user` (default). Roles can never be self-assigned at registration.
- **Profile** — name, email, address, work, studies, mobile, about and profile picture; fully editable, plus self-service password change.
- **Friends** — search the whole directory, send / accept / reject / cancel requests, and unfriend. Everything updates live.
- **Messaging** — text, emoji, files, images and recorded voice notes, to **anyone**, friend or not.
- **Groups** — create a group from your friends, add or remove members, rename, leave or delete it.
- **Inbox** — the sidebar holds the 10 most recent chats; everything older moves to the **Archive** inbox.
- **Unread badges** — a numbered circle on the chat row and on the nav icon, like a notification count.
- **Search** — by chat name and by message text, both from the sidebar (across every chat) and inside one conversation, with jump-to-message.
- **Realtime** — new messages, presence (online / last seen), typing indicators and friend events over Socket.IO.
- **Admin panel** — stats, every user's full profile, create / edit / delete users, change anyone's email, password, role or profile fields, block accounts, and open or moderate any conversation.
- **Day / night mode** — a toggle in the sidebar (and on the sign-in screen) that follows your OS by default and remembers your choice.
- **Motion** — GSAP drives the entrance staggers, message bubbles, sliding nav pill, typing dots, counting stat tiles and modals; everything collapses to a static end state under `prefers-reduced-motion`.
- **Responsive** — one-pane layout on phones, two-pane from tablet up.

## Project structure

```
Chatapp/
├── backend/
│   ├── config/        env loading, Mongo connection, Cloudinary, constants
│   ├── models/        User, Conversation, Message, FriendRequest
│   ├── controllers/   auth, user, friend, conversation, message, admin
│   ├── routes/        one router per resource, mounted in routes/index.js
│   ├── middleware/    auth (protect / restrictTo), uploads, error handling
│   ├── sockets/       Socket.IO server and the emit registry
│   ├── seed/          admin seeding (runs on boot) + demo data seeder
│   ├── utils/         ApiError, asyncHandler, pagination, tokens, helpers
│   ├── uploads/       local upload fallback, served at /uploads
│   ├── app.js         express app
│   └── server.js      http + socket bootstrap
├── frontend/
│   └── src/
│       ├── api/         axios client and endpoint modules
│       ├── components/  chat/, layout/, ui/
│       ├── context/     Auth, Theme, Socket and Chat providers
│       ├── hooks/       debounce, voice recorder, motion hooks
│       ├── pages/       Login, Register, Chat, Friends, Profile, Admin
│       ├── utils/       formatting helpers
│       └── animations/  the GSAP motion vocabulary (durations, easings, presets)
└── render.yaml        Render blueprint for the API service
```

## Setup

### Prerequisites

- **Node.js 20 or newer** (`node -v`) and npm
- **A MongoDB database** — a free [Atlas](https://www.mongodb.com/cloud/atlas) cluster is easiest; a local `mongod` works too
- **A Cloudinary account** (optional) — without it uploads are stored on local disk

### 1. Clone and install

```bash
git clone https://github.com/HammadKhatri0/Chatly.git
```

```bash
cd Chatly/backend && npm install
```

```bash
cd ../frontend && npm install
```

### 2. Configure the backend

Copy the example file and fill it in:

```bash
cd backend && cp .env.example .env
```

| Variable | Required | What it is |
| --- | --- | --- |
| `mongo_uri` | **yes** | MongoDB connection string. From Atlas: Connect → Drivers. Keep `/chatapp` before the `?` so the data lands in its own database. |
| `JWT_SECRET` | **yes** | Any long random string. It signs login tokens — anyone who knows it can forge a session, so use a real secret outside local development. |
| `PORT` | no | API port, defaults to `5000`. |
| `JWT_EXPIRES_IN` | no | Token lifetime, defaults to `7d`. |
| `CLIENT_URL` | no | Origins allowed to call the API, comma-separated. Defaults to `http://localhost:5173,http://localhost:5174`. |
| `ADMIN_EMAIL` · `ADMIN_PASSWORD` · `ADMIN_NAME` | no | The seeded admin account. Defaults to `admin@gmail.com` / `admin123`. |
| `MAX_UPLOAD_MB` | no | Per-file size cap, defaults to `20`. |
| `CLOUD_NAME` · `CLOUD_API_KEY` · `CLOUD_API_SECRET` | no | Cloudinary credentials, from its dashboard. Leave blank to store uploads on disk. |
| `CLOUD_FOLDER` | no | Cloudinary folder for uploads, defaults to `chatly`. |

If you use Atlas, add your IP under **Network Access** or the connection will hang and time out.

### 3. Run the backend

```bash
cd backend && npm run dev
```

Expect three lines:

```
MongoDB connected: <host>/chatapp
Seeded admin account: admin@gmail.com / admin123
API ready on http://localhost:5000
```

The admin account is created on every boot if missing, so there is no separate step for it. Check
the API is up at http://localhost:5000/api/health.

### 4. Run the frontend

```bash
cd frontend && cp .env.example .env
```

`frontend/.env` needs one line, pointing at the backend:

```dotenv
VITE_API_URL=http://localhost:5000
```

```bash
npm run dev
```

Open http://localhost:5173 and sign in as **admin@gmail.com / admin123**.

### 5. Optional demo data

```bash
cd backend && npm run seed
```

Adds five demo users — `jasmin@`, `alex@`, `jacob@`, `osman@` and `jessie@example.com`, all with
the password `password123` — so you have people to befriend, message and add to a group. Running it
twice is safe; existing accounts are skipped.

### Accounts

| Role | Email | Password |
| --- | --- | --- |
| admin | admin@gmail.com | admin123 |
| user | the demo users above | password123 |

### Scripts

| Where | Command | Does |
| --- | --- | --- |
| backend | `npm run dev` | Start the API with nodemon |
| backend | `npm start` | Start the API once (used in production) |
| backend | `npm run seed` | Seed the admin plus demo users |
| frontend | `npm run dev` | Vite dev server on 5173 |
| frontend | `npm run build` | Production build into `dist/` |
| frontend | `npm run preview` | Serve the built `dist/` locally |

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `EADDRINUSE: address already in use :::5000` | Something already holds the port. Find it with `netstat -ano \| findstr :5000`, then `taskkill /PID <pid> /F`. |
| `blocked by CORS policy` in the browser console | The page's origin is not in `CLIENT_URL`. Note that if port 5173 is taken, Vite silently moves to 5174 — the origin must match exactly, port included. Restart the backend after editing. |
| Mongo connection hangs, then times out | Your IP is not allowed in Atlas → Network Access, or the password in `mongo_uri` is wrong or contains unescaped characters. |
| `The 'bg-panel' class does not exist` after editing `tailwind.config.js` | The dev server does not reload that config. Restart `npm run dev`. |
| Login says `Invalid email or password` for the seeded admin | An earlier boot created it with a different `ADMIN_PASSWORD`. Seeding never overwrites an existing password — change it from the admin panel, or delete the user and restart. |
| The microphone button does nothing | The browser blocked mic access, or the page is not on `localhost`/HTTPS. `getUserMedia` needs a secure context. |
| Uploaded images disappear after a redeploy | Expected without Cloudinary — the host's disk is wiped on restart. Set the three `CLOUD_*` variables. |

## File storage

With `CLOUD_NAME`, `CLOUD_API_KEY` and `CLOUD_API_SECRET` set, avatars, attachments and voice
notes stream straight to Cloudinary and the database stores the absolute URL. Leave them blank and
everything falls back to `backend/uploads/`, so a fresh clone runs without a Cloudinary account.

Cloudinary is what makes the app deployable: hosts like Render give a web service an ephemeral
filesystem, so anything written to `uploads/` disappears on the next restart or redeploy. Uploads
use `resource_type: 'auto'`, which routes images, audio and raw documents to the right pipeline —
voice notes land under Cloudinary's `video` type, which is expected. Deleting a message or a
conversation also deletes its stored files.

## API overview

| Method | Endpoint | Purpose |
| ------ | -------- | ------- |
| POST | `/api/auth/register` · `/api/auth/login` | Sign up / sign in |
| GET · PATCH | `/api/auth/me` · `/api/auth/password` | Session user, password change |
| GET · PATCH | `/api/users/me` | Read / edit own profile (multipart for the avatar) |
| GET | `/api/users/search?q=` · `/api/users/:id` | Directory search, public profile |
| GET · POST · PATCH · DELETE | `/api/friends/**` | Friends, requests, unfriend |
| GET · POST | `/api/conversations` · `/direct` · `/group` | Inbox (`scope=recent\|archive\|all`), open or create chats |
| GET · POST | `/api/conversations/:id/messages` | History and sending (multipart for files and voice) |
| PATCH · DELETE | `/api/conversations/:id/**` | Rename, members, mark read, delete |
| GET · DELETE | `/api/messages/search?q=` · `/api/messages/:id` | Search, delete a message |
| GET · POST · PATCH · DELETE | `/api/admin/**` | Stats, users CRUD, all conversations |

## Theming and motion

Colours resolve through CSS variables (`--ink-*`, `--panel`) declared in `src/index.css`, and Tailwind maps them onto the usual `ink-*` / `panel` utilities. Adding the `dark` class to `<html>` — which `ThemeContext` does — re-points those variables, so the whole app themes itself without `dark:` variants scattered through the markup.

Animation timings live in `src/animations/motion.js` and are consumed through the hooks in `src/hooks/useMotion.js` (`useStaggerChildren`, `useEnter`, `usePopOnIncrease`, `useCountUp`, `useFloat`). Retune a duration or easing there and every screen follows.

## Deploying

The backend needs a normal long-lived Node process (Socket.IO holds open connections), so it goes
on Render while the frontend goes on Vercel.

**1. Backend on Render.** New → Blueprint → pick this repo. `render.yaml` supplies the root
directory, build and start commands, health check and Node version; Render then prompts for the
secrets (`mongo_uri`, `JWT_SECRET`, `ADMIN_PASSWORD`, the three `CLOUD_*` values and `CLIENT_URL`).
Leave `CLIENT_URL` as a placeholder for now. In Atlas, allow `0.0.0.0/0` under Network Access —
Render's free tier has no fixed outbound IP.

**2. Frontend on Vercel.** Add New → Project → import the repo, and set **Root Directory to
`frontend`**, since the repo root has no app of its own. Add `VITE_API_URL` pointing at the Render
URL. `frontend/vercel.json` handles the SPA rewrites.

**3. Close the loop.** Back in Render, set `CLIENT_URL` to the Vercel URL. Both CORS and the
Socket.IO handshake read it, so until it is set the site loads but every request fails CORS.

Both platforms redeploy on each push to `main`.

Two things to expect on free tiers: Render sleeps after ~15 minutes idle, so the first request takes
30–60s and realtime is down while it sleeps; and `JWT_SECRET` plus the Atlas password should be real
secrets in production, not the development values.

## Security notes

- Passwords are bcrypt-hashed and never selected by default.
- Every route below `/api` (except register/login) requires a bearer token; `/api/admin` additionally requires the admin role.
- Conversation reads and writes are membership-checked; admins are the deliberate exception.
- Uploads are type-filtered, randomly renamed and size-capped (`MAX_UPLOAD_MB`); Cloudinary credentials stay in the environment and never reach the client.
- Login and registration are rate-limited; Helmet and a CORS allowlist are enabled. Behind a proxy the app trusts one hop so the limiter sees real client IPs.
- The system always keeps at least one admin account.
- `.env` is git-ignored. Only `.env.example`, with placeholders, is committed.
