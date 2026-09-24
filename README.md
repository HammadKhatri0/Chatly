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
│   ├── config/        env loading, Mongo connection, shared constants
│   ├── models/        User, Conversation, Message, FriendRequest
│   ├── controllers/   auth, user, friend, conversation, message, admin
│   ├── routes/        one router per resource, mounted in routes/index.js
│   ├── middleware/    auth (protect / restrictTo), uploads, error handling
│   ├── sockets/       Socket.IO server and the emit registry
│   ├── seed/          admin seeding (runs on boot) + demo data seeder
│   ├── utils/         ApiError, asyncHandler, pagination, tokens, helpers
│   ├── uploads/       user uploads served at /uploads
│   ├── app.js         express app
│   └── server.js      http + socket bootstrap
└── frontend/
    └── src/
        ├── api/         axios client and endpoint modules
        ├── components/  chat/, layout/, ui/
        ├── context/     Auth, Theme, Socket and Chat providers
        ├── hooks/       debounce, voice recorder
        ├── pages/       Login, Register, Chat, Friends, Profile, Admin
        ├── utils/       formatting helpers
        └── animations/  the GSAP motion vocabulary (durations, easings, presets)
```

## Getting started

### 1. Backend

```bash
cd backend && npm install && npm run dev
```

`backend/.env` (already present, see `.env.example`):

```dotenv
mongo_uri=mongodb+srv://<user>:<pass>@cluster0.edckkfu.mongodb.net/chatapp?appName=Cluster0
PORT=5000
JWT_SECRET = mysecretkey123456789
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173,http://localhost:5174
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Administrator
MAX_UPLOAD_MB=20
```

The admin account is seeded automatically on every boot (idempotent).

### 2. Frontend

```bash
cd frontend && npm install && npm run dev
```

`frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:5000
```

Open http://localhost:5173.

### 3. Optional demo data

```bash
cd backend && npm run seed
```

Adds five demo users (`jasmin@`, `alex@`, `jacob@`, `osman@`, `jessie@` `example.com`), all with the password `password123`.

## Accounts

| Role  | Email             | Password   |
| ----- | ----------------- | ---------- |
| admin | admin@gmail.com   | admin123   |
| user  | *demo users above* | password123 |

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

## Security notes

- Passwords are bcrypt-hashed and never selected by default.
- Every route below `/api` (except register/login) requires a bearer token; `/api/admin` additionally requires the admin role.
- Conversation reads and writes are membership-checked; admins are the deliberate exception.
- Uploads are type-filtered, randomly renamed and size-capped (`MAX_UPLOAD_MB`).
- Login and registration are rate-limited; Helmet and a CORS allowlist are enabled.
- The system always keeps at least one admin account.
