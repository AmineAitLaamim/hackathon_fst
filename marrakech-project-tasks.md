# Marrakech Tourism App — Project Brief & Task Division

> Stack: Django REST Framework · React + React Router · Axios + JWT · Google Maps JS SDK · Claude AI

---

## Project Overview

A tourism application for Marrakech that lets users:

- **Generate personalized AI tours** based on their profile, health conditions, and interests
- **Browse and use public tours** shared by other users, with ratings and AI personalization
- **Share tours privately** with friends and explore them together in live group sessions

---

## Architecture Decisions

- Access token stored **in memory** (never localStorage) — refresh token in `httpOnly` cookie
- Global Axios interceptor: on 401 → `POST /api/auth/refresh` → retry → on fail → redirect `/login`
- AI endpoints call `claude-sonnet-4-20250514` with user profile + health + interests as context
- Stop detail data is **embedded in the tour object** — no per-stop Places calls in v1
- `shareId` is separate from `tourId` so sharing can be revoked without deleting the original tour
- `/personalize` always saves as `draft` first — nothing is finalized silently
- Group sessions use **polling** every 3–5s in v1 (WebSocket upgrade path: rooms keyed by `group-tour:{id}`)
- `generate`, `shared-with-me`, `friends/requests`, `places/categories`, `rate/me` must all be registered as DRF `@action(detail=False)` to avoid being resolved as `:id` params

---

## Dev 1 — Backend Core

**Modules: Auth · Users · Tours AI · Places**

### Auth module
| Method | Route | Notes |
|--------|-------|-------|
| POST | `/api/auth/register` | Create account, return JWT tokens `[done]` |
| POST | `/api/auth/login` | Validate credentials, issue access + refresh tokens `[done]` |
| POST | `/api/auth/logout` | Blacklist refresh token (`BLACKLIST_AFTER_ROTATION = True`) `[done]` |
| POST | `/api/auth/refresh` | Issue new access token `[done]` |
| GET | `/api/auth/me` | Current user profile `[done]` |
| PATCH | `/api/auth/me` | Partial update — name, avatar `[done]` |

### User Profile
| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/users/:id` | Public profile `[done]` |
| PATCH | `/api/users/:id/interests` | Partial update — do NOT wipe existing interests `[done]` |
| PATCH | `/api/users/:id/health` | Partial update — do NOT wipe existing conditions `[done]` |

### Tour Planner AI
| Method | Route | Notes |
|--------|-------|-------|
| POST | `/api/tours/generate` | Call Claude with `{ duration, budget, themes, notes }` + user profile/health/interests — `@action(detail=False)` |
| GET | `/api/tours` | List user's tours, sorted by date, with `draft/published/shared` badge |
| GET | `/api/tours/shared-with-me` | Tours shared privately with me — `@action(detail=False)` |
| GET | `/api/tours/:id` | Tour detail with embedded stops |
| PUT | `/api/tours/:id` | Replace tour |
| PATCH | `/api/tours/:id` | Partial update |
| DELETE | `/api/tours/:id` | Delete tour |
| POST | `/api/tours/:id/invitations` | Share privately — body: `{ "friend_ids": [...] }` |
| POST | `/api/tours/:id/share` | Publish publicly |
| PATCH | `/api/tours/:id/share` | Update share settings |
| DELETE | `/api/tours/:id/share` | Unpublish — revert to draft |

### Map & Places *(backend-only in v1 — not called directly by frontend)*
| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/places` | List POIs with filters |
| GET | `/api/places/categories` | `@action(detail=False)` |
| GET | `/api/places/:id` | Place detail |

### Setup responsibilities
- `simplejwt` with token blacklist
- `@action(detail=False)` on `generate` and `shared-with-me` — declared before `/:id` lookup
- All protected routes: `Authorization: Bearer <access_token>`
- Health conditions passed to Claude to filter inaccessible or unsuitable stops

**19 endpoints**

---

## Dev 2 — Backend Social

**Modules: Friends · Invitations · Shared Tours · Group Tours · Notifications**

### Friends
| Method | Route | Notes |
|--------|-------|-------|
| POST | `/api/friends/request` | Body: `{ "user_id": "..." }` |
| PATCH | `/api/friends/:id/respond` | Body: `{ status: 'accepted'\|'declined' }` |
| DELETE | `/api/friends/:id` | Remove friend |
| GET | `/api/friends` | List accepted friends |
| GET | `/api/friends/requests` | `?type=incoming\|outgoing` — `@action(detail=False)` |

### Invitations *(dedicated viewset — avoids DRF nested routing issues)*
| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/invitations` | Pending invitations received |
| PATCH | `/api/invitations/:inviteId` | Accept or decline |

### Shared Tours
| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/shared-tours` | Browse all public tours — `?sort=rating\|recent&page=` |
| GET | `/api/shared-tours/:shareId` | Public tour detail with stops + average rating |
| GET | `/api/shared-tours/:shareId/rate/me` | My rating — 404 if none — `@action(detail=False)` |
| POST | `/api/shared-tours/:shareId/rate` | Submit rating + optional comment |
| PUT | `/api/shared-tours/:shareId/rate` | Update rating — returns 404 if no existing rating |
| DELETE | `/api/shared-tours/:shareId/rate` | Remove rating |
| POST | `/api/shared-tours/:shareId/use` | Clone into user's tours |
| POST | `/api/shared-tours/:shareId/personalize` | AI re-personalize → auto-save as `draft` → return `{ tour_id, status: 'draft' }` |

### Group / Collab Tours
| Method | Route | Notes |
|--------|-------|-------|
| POST | `/api/group-tours` | Create session — body: `{ tour_id }` |
| GET | `/api/group-tours` | List sessions (host or member) |
| GET | `/api/group-tours/:id` | Session detail + members + live status |
| DELETE | `/api/group-tours/:id` | Disband (host only) |
| POST | `/api/group-tours/:id/invite` | Invite friends |
| POST | `/api/group-tours/:id/join` | Join via invite |
| POST | `/api/group-tours/:id/leave` | Leave — action verb, not resource deletion |
| POST | `/api/group-tours/:id/stops/:stopId/checkin` | Check in at stop |
| POST | `/api/group-tours/:id/stops/:stopId/comments` | Post comment |
| DELETE | `/api/group-tours/:id/stops/:stopId/comments/:commentId` | Delete own comment |
| GET | `/api/group-tours/:id/activity` | Live activity feed — polled by client every 3–5s |

### Notifications
| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/notifications` | Paginated — `?page=&limit=` |
| POST | `/api/notifications/:id/read` | Mark as read — action verb, not PATCH |

**21 endpoints**

---

## Dev 3 — Frontend Core

**Routes: Interceptor · /login · /register · /onboarding · /generate · /tours · /tours/:id · /profile**

### Global — Axios JWT Interceptor
```
Response interceptor:
  on 401 →
    POST /api/auth/refresh
      success → retry original request with new access_token
      failure  → clear session → redirect /login
```
Implement at app initialisation. Access token lives **in memory only** — never localStorage.

### `/login`
- Fields: Email · Password
- `POST /api/auth/login` → store access token in memory → redirect `/tours`
- Link to `/register`

### `/register`
- Fields: Name · Email · Password
- `POST /api/auth/register` → redirect `/onboarding`

### `/onboarding` — 3-step wizard
- Progress bar across steps; shown once after registration
- Step 1 — Profile: name, photo → `PATCH /api/auth/me`
- Step 2 — Interests: multi-select (souks, food, histoire…) → `PATCH /api/users/:id/interests`
- Step 3 — Health: conditions + reassuring message → `PATCH /api/users/:id/health`
- On complete → redirect `/generate`

### `/generate`
- Fields: duration, budget, themes, free-text textarea
- Full-page loader with status messages during AI generation
- `POST /api/tours/generate` → on success redirect `/tours/:id`

### `/tours`
- List sorted by date — badges: `draft / published / shared`
- Actions per card: open, delete (confirm dialog), share (`POST /api/tours/:id/share`), start group session (`POST /api/group-tours`)
- Load: `GET /api/tours`

### `/tours/:id`
- Google Maps interactive map + ordered stop list (name, schedule, walking distance)
- Load: `GET /api/tours/:id` — stops are embedded, no per-stop Places calls
- Author-only actions: edit, delete (confirm), share publicly, modify share, unpublish, share with friends, start group session
- "Start group session" here is the **primary entry point** — `tour_id` is already in context

### `/profile`
- Edit name/photo → `PATCH /api/auth/me`
- Edit interests → `PATCH /api/users/:id/interests`
- Edit health → `PATCH /api/users/:id/health`
- Logout button → `POST /api/auth/logout` → clear token → redirect `/login`
- Logout also accessible from the **persistent nav** on all authenticated routes

**8 routes · Auth + Tours + Profile + Interceptor**

---

## Dev 4 — Frontend Social

**Routes: /explore · /explore/:shareId · /tours/personalize/:shareId · /friends · /invitations · /groups · /group/:id · /notifications**

### `/explore`
- Grid of public tours — filters: sort by rating / recent
- Card fields: name, author, average rating, stop count
- Load: `GET /api/shared-tours?sort=rating|recent&page=`

### `/explore/:shareId`
- Google Maps + stops + overall rating
- Load: `GET /api/shared-tours/:shareId` + `GET /api/shared-tours/:shareId/rate/me`
- **Rating block — 3-state logic:**
  ```
  GET /rate/me on load
    → 404 : show empty POST form
    → 200 : show existing rating + PUT form + Delete button
  ```
- Actions: submit / update / delete rating · clone (`POST /use`) · navigate to personalize

### `/tours/personalize/:shareId`
- Dedicated page (not a modal) — extra input fields + AI loader
- `POST /api/shared-tours/:shareId/personalize` → **store returned `tour_id` in local state**
- Confirm: `PATCH /api/tours/:id` `{ status: 'published' }` using stored `tour_id`
- Discard: `DELETE /api/tours/:id` (confirm dialog) using stored `tour_id`

### `/friends`
- 2 tabs: accepted friends / pending requests
- Load: `GET /api/friends` + `GET /api/friends/requests?type=incoming` + `?type=outgoing`
- Actions: accept (`PATCH /respond`), decline, remove (`DELETE`), send request (`POST /request`)
- `POST /friends/request` needs a `user_id` — coordinate on user discovery approach (username input or share-link with encoded ID) before implementing

### `/invitations`
- **Two calls on load:** `GET /api/invitations` + `GET /api/tours/shared-with-me`
- Merge by `tour_id` to build preview cards (tour name, sharing friend, tour preview)
- Actions: accept / decline → `PATCH /api/invitations/:inviteId`

### `/groups`
- List of sessions (host or member) — status: `en cours / terminé`
- Quick access to active session
- Secondary CTA: create session → `POST /api/group-tours { tour_id }`

### `/group/:id` — Live session 🔴
- **Desktop:** 2 columns — Google Maps + sidebar (online members · activity feed · check-in)
- **Mobile:** 3 tabs — Map / Activity / Members
- Header: permanent `● Live` indicator
- **Polling:** `GET /api/group-tours/:id/activity` every 3–5s — use `last_activity_at` to skip unnecessary re-renders
- Host: invite friends (`POST /invite`), disband (confirm → `DELETE`)
- Members: join (`POST /join`), leave (`POST /leave`)
- All: check in (`POST /checkin`), post comment, delete own comment (long-press mobile / trash icon desktop)

### `/notifications`
- Paginated list — types: friend request · tour invitation · group check-in
- Load: `GET /api/notifications?page=`
- Action: mark as read → `POST /api/notifications/:id/read`

**8 routes · Explore + Social + Groups + Notifications**

---

## Workload Summary

| Dev | Role | Modules | Volume |
|-----|------|---------|--------|
| **Dev 1** | Backend Core | Auth · Users · Tours AI · Places | 19 endpoints |
| **Dev 2** | Backend Social | Friends · Invitations · Shared Tours · Groups · Notifs | 21 endpoints |
| **Dev 3** | Frontend Core | Auth · Onboarding · Tours · Profile · Interceptor | 8 routes |
| **Dev 4** | Frontend Social | Explore · Personalize · Friends · Groups · Notifs | 8 routes |
