# Marrakech Tourism App â€” Project Brief & Task Division

> Stack: Django REST Framework Â· React + React Router Â· Axios + JWT Â· Google Maps JS SDK Â· Claude AI

---

## Project Overview

A tourism application for Marrakech that lets users:

- **Generate personalized AI tours** based on their profile, health conditions, and interests
- **Browse and use public tours** shared by other users, with ratings and AI personalization
- **Share tours privately** with friends and explore them together in live group sessions

---

## Architecture Decisions

- Access token stored **in memory** (never localStorage) â€” refresh token in `httpOnly` cookie
- Global Axios interceptor: on 401 â†’ `POST /api/auth/refresh` â†’ retry â†’ on fail â†’ redirect `/login`
- AI endpoints call `claude-sonnet-4-20250514` with user profile + health + interests as context
- Stop detail data is **embedded in the tour object** â€” no per-stop Places calls in v1
- `shareId` is separate from `tourId` so sharing can be revoked without deleting the original tour
- `/personalize` always saves as `draft` first â€” nothing is finalized silently
- Group sessions use **polling** every 3â€“5s in v1 (WebSocket upgrade path: rooms keyed by `group-tour:{id}`)
- `generate`, `shared-with-me`, `friends/requests`, `places/categories`, `rate/me` must all be registered as DRF `@action(detail=False)` to avoid being resolved as `:id` params

---

## Dev 1 â€” Backend Core

**Modules: Auth Â· Users Â· Tours AI Â· Places**

### Auth module
| Method | Route | Notes |
|--------|-------|-------|
| POST | `/api/auth/register` | Create account, return JWT tokens |
| POST | `/api/auth/login` | Validate credentials, issue access + refresh tokens |
| POST | `/api/auth/logout` | Blacklist refresh token (`BLACKLIST_AFTER_ROTATION = True`) |
| POST | `/api/auth/refresh` | Issue new access token |
| GET | `/api/auth/me` | Current user profile |
| PATCH | `/api/auth/me` | Partial update â€” name, avatar |

### User Profile
| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/users/:id` | Public profile |
| PATCH | `/api/users/:id/interests` | Partial update â€” do NOT wipe existing interests |
| PATCH | `/api/users/:id/health` | Partial update â€” do NOT wipe existing conditions |

### Tour Planner AI
| Method | Route | Notes |
|--------|-------|-------|
| POST | `/api/tours/generate` | Call Claude with `{ duration, budget, themes, notes }` + user profile/health/interests â€” `@action(detail=False)` |
| GET | `/api/tours` | List user's tours, sorted by date, with `draft/published/shared` badge |
| GET | `/api/tours/shared-with-me` | Tours shared privately with me â€” `@action(detail=False)` |
| GET | `/api/tours/:id` | Tour detail with embedded stops |
| PUT | `/api/tours/:id` | Replace tour |
| PATCH | `/api/tours/:id` | Partial update |
| DELETE | `/api/tours/:id` | Delete tour |
| POST | `/api/tours/:id/invitations` | Share privately â€” body: `{ "friend_ids": [...] }` |
| POST | `/api/tours/:id/share` | Publish publicly |
| PATCH | `/api/tours/:id/share` | Update share settings |
| DELETE | `/api/tours/:id/share` | Unpublish â€” revert to draft |

### Map & Places *(backend-only in v1 â€” not called directly by frontend)*
| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/places` | List POIs with filters |
| GET | `/api/places/categories` | `@action(detail=False)` |
| GET | `/api/places/:id` | Place detail |

### Setup responsibilities
- `simplejwt` with token blacklist
- `@action(detail=False)` on `generate` and `shared-with-me` â€” declared before `/:id` lookup
- All protected routes: `Authorization: Bearer <access_token>`
- Health conditions passed to Claude to filter inaccessible or unsuitable stops

**19 endpoints**

---

## Dev 2 â€” Backend Social

**Modules: Friends Â· Invitations Â· Shared Tours Â· Group Tours Â· Notifications**

### Friends
| Method | Route | Notes |
|--------|-------|-------|
| POST | `/api/friends/request` | Body: `{ "user_id": "..." }` |
| PATCH | `/api/friends/:id/respond` | Body: `{ status: 'accepted'\|'declined' }` |
| DELETE | `/api/friends/:id` | Remove friend |
| GET | `/api/friends` | List accepted friends |
| GET | `/api/friends/requests` | `?type=incoming\|outgoing` â€” `@action(detail=False)` |

### Invitations *(dedicated viewset â€” avoids DRF nested routing issues)*
| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/invitations` | Pending invitations received |
| PATCH | `/api/invitations/:inviteId` | Accept or decline |

### Shared Tours
| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/shared-tours` | Browse all public tours â€” `?sort=rating\|recent&page=` |
| GET | `/api/shared-tours/:shareId` | Public tour detail with stops + average rating |
| GET | `/api/shared-tours/:shareId/rate/me` | My rating â€” 404 if none â€” `@action(detail=False)` |
| POST | `/api/shared-tours/:shareId/rate` | Submit rating + optional comment |
| PUT | `/api/shared-tours/:shareId/rate` | Update rating â€” returns 404 if no existing rating |
| DELETE | `/api/shared-tours/:shareId/rate` | Remove rating |
| POST | `/api/shared-tours/:shareId/use` | Clone into user's tours |
| POST | `/api/shared-tours/:shareId/personalize` | AI re-personalize â†’ auto-save as `draft` â†’ return `{ tour_id, status: 'draft' }` |

### Group / Collab Tours
| Method | Route | Notes |
|--------|-------|-------|
| POST | `/api/group-tours` | Create session â€” body: `{ tour_id }` |
| GET | `/api/group-tours` | List sessions (host or member) |
| GET | `/api/group-tours/:id` | Session detail + members + live status |
| DELETE | `/api/group-tours/:id` | Disband (host only) |
| POST | `/api/group-tours/:id/invite` | Invite friends |
| POST | `/api/group-tours/:id/join` | Join via invite |
| POST | `/api/group-tours/:id/leave` | Leave â€” action verb, not resource deletion |
| POST | `/api/group-tours/:id/stops/:stopId/checkin` | Check in at stop |
| POST | `/api/group-tours/:id/stops/:stopId/comments` | Post comment |
| DELETE | `/api/group-tours/:id/stops/:stopId/comments/:commentId` | Delete own comment |
| GET | `/api/group-tours/:id/activity` | Live activity feed â€” polled by client every 3â€“5s |

### Notifications
| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/notifications` | Paginated â€” `?page=&limit=` |
| POST | `/api/notifications/:id/read` | Mark as read â€” action verb, not PATCH |

**21 endpoints**

---

## Dev 3 â€” Frontend Core

**Routes: Interceptor Â· /login Â· /register Â· /onboarding Â· /generate Â· /tours Â· /tours/:id Â· /profile**

### Global â€” Axios JWT Interceptor
```
Response interceptor:
  on 401 â†’
    POST /api/auth/refresh
      success â†’ retry original request with new access_token
      failure  â†’ clear session â†’ redirect /login
```
Implement at app initialisation. Access token lives **in memory only** â€” never localStorage.

### `/login`
- Fields: Email Â· Password
- `POST /api/auth/login` â†’ store access token in memory â†’ redirect `/tours`
- Link to `/register`

### `/register`
- Fields: Name Â· Email Â· Password
- `POST /api/auth/register` â†’ redirect `/onboarding`

### `/onboarding` â€” 3-step wizard
- Progress bar across steps; shown once after registration
- Step 1 â€” Profile: name, photo â†’ `PATCH /api/auth/me`
- Step 2 â€” Interests: multi-select (souks, food, histoireâ€¦) â†’ `PATCH /api/users/:id/interests`
- Step 3 â€” Health: conditions + reassuring message â†’ `PATCH /api/users/:id/health`
- On complete â†’ redirect `/generate`

### `/generate`
- Fields: duration, budget, themes, free-text textarea
- Full-page loader with status messages during AI generation
- `POST /api/tours/generate` â†’ on success redirect `/tours/:id`

### `/tours`
- List sorted by date â€” badges: `draft / published / shared`
- Actions per card: open, delete (confirm dialog), share (`POST /api/tours/:id/share`), start group session (`POST /api/group-tours`)
- Load: `GET /api/tours`

### `/tours/:id`
- Google Maps interactive map + ordered stop list (name, schedule, walking distance)
- Load: `GET /api/tours/:id` â€” stops are embedded, no per-stop Places calls
- Author-only actions: edit, delete (confirm), share publicly, modify share, unpublish, share with friends, start group session
- "Start group session" here is the **primary entry point** â€” `tour_id` is already in context

### `/profile`
- Edit name/photo â†’ `PATCH /api/auth/me`
- Edit interests â†’ `PATCH /api/users/:id/interests`
- Edit health â†’ `PATCH /api/users/:id/health`
- Logout button â†’ `POST /api/auth/logout` â†’ clear token â†’ redirect `/login`
- Logout also accessible from the **persistent nav** on all authenticated routes

**8 routes Â· Auth + Tours + Profile + Interceptor**

---

## Dev 4 â€” Frontend Social

**Routes: /explore Â· /explore/:shareId Â· /tours/personalize/:shareId Â· /friends Â· /invitations Â· /groups Â· /group/:id Â· /notifications**

### `/explore` â€” Done
- [x] Grid of public tours â€” filters: sort by rating / recent
- [x] Card fields: name, author, average rating, stop count
- [x] Load: `GET /api/shared-tours?sort=rating|recent&page=`

### `/explore/:shareId` â€” Done
- [x] Google Maps + stops + overall rating
- [x] Load: `GET /api/shared-tours/:shareId` + `GET /api/shared-tours/:shareId/rate/me`
- [x] **Rating block â€” 3-state logic:**
  ```
  GET /rate/me on load
    â†’ 404 : show empty POST form
    â†’ 200 : show existing rating + PUT form + Delete button
  ```
- [x] Actions: submit / update / delete rating Â· clone (`POST /use`) Â· navigate to personalize

### `/tours/personalize/:shareId` â€” Done
- [x] Dedicated page (not a modal) â€” extra input fields + AI loader
- [x] `POST /api/shared-tours/:shareId/personalize` â†’ **store returned `tour_id` in local state**
- [x] Confirm: `PATCH /api/tours/:id` `{ status: 'published' }` using stored `tour_id`
- [x] Discard: `DELETE /api/tours/:id` (confirm dialog) using stored `tour_id`

### `/friends` â€” Done
- [x] 2 tabs: accepted friends / pending requests
- [x] Load: `GET /api/friends` + `GET /api/friends/requests?type=incoming` + `?type=outgoing`
- [x] Actions: accept (`PATCH /respond`), decline, remove (`DELETE`), send request (`POST /request`)
- [x] `POST /friends/request` needs a `user_id` â€” coordinate on user discovery approach (username input or share-link with encoded ID) before implementing

### `/invitations` â€” Done
- [x] **Two calls on load:** `GET /api/invitations` + `GET /api/tours/shared-with-me`
- [x] Merge by `tour_id` to build preview cards (tour name, sharing friend, tour preview)
- [x] Actions: accept / decline â†’ `PATCH /api/invitations/:inviteId`

### `/groups` â€” Done
- [x] List of sessions (host or member) â€” status: `en cours / terminÃ©`
- [x] Quick access to active session
- [x] Secondary CTA: create session â†’ `POST /api/group-tours { tour_id }`

### `/group/:id` â€” Live session ðŸ”´ â€” Done
- [x] **Desktop:** 2 columns â€” Google Maps + sidebar (online members Â· activity feed Â· check-in)
- [x] **Mobile:** 3 tabs â€” Map / Activity / Members
- [x] Header: permanent `â— Live` indicator
- [x] **Polling:** `GET /api/group-tours/:id/activity` every 3â€“5s â€” use `last_activity_at` to skip unnecessary re-renders
- [x] Host: invite friends (`POST /invite`), disband (confirm â†’ `DELETE`)
- [x] Members: join (`POST /join`), leave (`POST /leave`)
- [x] All: check in (`POST /checkin`), post comment, delete own comment (long-press mobile / trash icon desktop)

### `/notifications` â€” Done
- [x] Paginated list â€” types: friend request Â· tour invitation Â· group check-in
- [x] Load: `GET /api/notifications?page=`
- [x] Action: mark as read â†’ `POST /api/notifications/:id/read`

**8 routes Â· Explore + Social + Groups + Notifications**

---

## Workload Summary

| Dev | Role | Modules | Volume |
|-----|------|---------|--------|
| **Dev 1** | Backend Core | Auth Â· Users Â· Tours AI Â· Places | 19 endpoints |
| **Dev 2** | Backend Social | Friends Â· Invitations Â· Shared Tours Â· Groups Â· Notifs | 21 endpoints |
| **Dev 3** | Frontend Core | Auth Â· Onboarding Â· Tours Â· Profile Â· Interceptor | 8 routes |
| **Dev 4** | Frontend Social | Explore Â· Personalize Â· Friends Â· Groups Â· Notifs | 8 routes |

---

## File Tree

```
marrakech-tourism-app/
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ config/
â”‚   â”‚   â”œâ”€â”€ settings.py
â”‚   â”‚   â”œâ”€â”€ urls.py
â”‚   â”‚   â”œâ”€â”€ wsgi.py
â”‚   â”‚   â””â”€â”€ asgi.py
â”‚   â”œâ”€â”€ apps/
â”‚   â”‚   â”œâ”€â”€ auth/               â† Dev 1
â”‚   â”‚   â”‚   â”œâ”€â”€ models.py
â”‚   â”‚   â”‚   â”œâ”€â”€ serializers.py
â”‚   â”‚   â”‚   â”œâ”€â”€ views.py
â”‚   â”‚   â”‚   â””â”€â”€ urls.py
â”‚   â”‚   â”œâ”€â”€ users/              â† Dev 1
â”‚   â”‚   â”‚   â”œâ”€â”€ models.py
â”‚   â”‚   â”‚   â”œâ”€â”€ serializers.py
â”‚   â”‚   â”‚   â”œâ”€â”€ views.py
â”‚   â”‚   â”‚   â””â”€â”€ urls.py
â”‚   â”‚   â”œâ”€â”€ tours/              â† Dev 1
â”‚   â”‚   â”‚   â”œâ”€â”€ models.py
â”‚   â”‚   â”‚   â”œâ”€â”€ serializers.py
â”‚   â”‚   â”‚   â”œâ”€â”€ views.py
â”‚   â”‚   â”‚   â”œâ”€â”€ ai.py
â”‚   â”‚   â”‚   â””â”€â”€ urls.py
â”‚   â”‚   â”œâ”€â”€ places/             â† Dev 1
â”‚   â”‚   â”‚   â”œâ”€â”€ models.py
â”‚   â”‚   â”‚   â”œâ”€â”€ serializers.py
â”‚   â”‚   â”‚   â”œâ”€â”€ views.py
â”‚   â”‚   â”‚   â””â”€â”€ urls.py
â”‚   â”‚   â”œâ”€â”€ friends/            â† Dev 2
â”‚   â”‚   â”‚   â”œâ”€â”€ models.py
â”‚   â”‚   â”‚   â”œâ”€â”€ serializers.py
â”‚   â”‚   â”‚   â”œâ”€â”€ views.py
â”‚   â”‚   â”‚   â””â”€â”€ urls.py
â”‚   â”‚   â”œâ”€â”€ invitations/        â† Dev 2
â”‚   â”‚   â”‚   â”œâ”€â”€ models.py
â”‚   â”‚   â”‚   â”œâ”€â”€ serializers.py
â”‚   â”‚   â”‚   â”œâ”€â”€ views.py
â”‚   â”‚   â”‚   â””â”€â”€ urls.py
â”‚   â”‚   â”œâ”€â”€ shared_tours/       â† Dev 2
â”‚   â”‚   â”‚   â”œâ”€â”€ models.py
â”‚   â”‚   â”‚   â”œâ”€â”€ serializers.py
â”‚   â”‚   â”‚   â”œâ”€â”€ views.py
â”‚   â”‚   â”‚   â”œâ”€â”€ ai.py
â”‚   â”‚   â”‚   â””â”€â”€ urls.py
â”‚   â”‚   â”œâ”€â”€ group_tours/        â† Dev 2
â”‚   â”‚   â”‚   â”œâ”€â”€ models.py
â”‚   â”‚   â”‚   â”œâ”€â”€ serializers.py
â”‚   â”‚   â”‚   â”œâ”€â”€ views.py
â”‚   â”‚   â”‚   â””â”€â”€ urls.py
â”‚   â”‚   â””â”€â”€ notifications/      â† Dev 2
â”‚   â”‚       â”œâ”€â”€ models.py
â”‚   â”‚       â”œâ”€â”€ serializers.py
â”‚   â”‚       â”œâ”€â”€ views.py
â”‚   â”‚       â””â”€â”€ urls.py
â”‚   â”œâ”€â”€ manage.py
â”‚   â”œâ”€â”€ requirements.txt
â”‚   â””â”€â”€ .env
â”‚
â”œâ”€â”€ frontend/
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ api/
â”‚   â”‚   â”‚   â”œâ”€â”€ axios.js        â† Dev 3 (interceptor)
â”‚   â”‚   â”‚   â”œâ”€â”€ auth.js
â”‚   â”‚   â”‚   â”œâ”€â”€ tours.js
â”‚   â”‚   â”‚   â”œâ”€â”€ sharedTours.js
â”‚   â”‚   â”‚   â”œâ”€â”€ friends.js
â”‚   â”‚   â”‚   â”œâ”€â”€ invitations.js
â”‚   â”‚   â”‚   â”œâ”€â”€ groupTours.js
â”‚   â”‚   â”‚   â””â”€â”€ notifications.js
â”‚   â”‚   â”œâ”€â”€ pages/
â”‚   â”‚   â”‚   â”œâ”€â”€ auth/           â† Dev 3
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Login.jsx
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ Register.jsx
â”‚   â”‚   â”‚   â”œâ”€â”€ onboarding/     â† Dev 3
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Onboarding.jsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ StepProfile.jsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ StepInterests.jsx
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ StepHealth.jsx
â”‚   â”‚   â”‚   â”œâ”€â”€ tours/          â† Dev 3
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Generate.jsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ TourList.jsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ TourDetail.jsx
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ TourMap.jsx
â”‚   â”‚   â”‚   â”œâ”€â”€ Profile.jsx     â† Dev 3
â”‚   â”‚   â”‚   â”œâ”€â”€ explore/        â† Dev 4
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Explore.jsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ ExploreDetail.jsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ RatingBlock.jsx
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ Personalize.jsx
â”‚   â”‚   â”‚   â”œâ”€â”€ social/         â† Dev 4
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Friends.jsx
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ Invitations.jsx
â”‚   â”‚   â”‚   â”œâ”€â”€ groups/         â† Dev 4
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ GroupList.jsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ GroupSession.jsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ ActivityFeed.jsx
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ MembersList.jsx
â”‚   â”‚   â”‚   â””â”€â”€ Notifications.jsx  â† Dev 4
â”‚   â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”‚   â”œâ”€â”€ Navbar.jsx
â”‚   â”‚   â”‚   â”œâ”€â”€ ProtectedRoute.jsx
â”‚   â”‚   â”‚   â”œâ”€â”€ MapView.jsx
â”‚   â”‚   â”‚   â”œâ”€â”€ TourCard.jsx
â”‚   â”‚   â”‚   â”œâ”€â”€ StopList.jsx
â”‚   â”‚   â”‚   â””â”€â”€ AILoader.jsx
â”‚   â”‚   â”œâ”€â”€ context/
â”‚   â”‚   â”‚   â””â”€â”€ AuthContext.jsx
â”‚   â”‚   â”œâ”€â”€ App.jsx
â”‚   â”‚   â””â”€â”€ main.jsx
â”‚   â”œâ”€â”€ vite.config.js
â”‚   â”œâ”€â”€ package.json
â”‚   â””â”€â”€ .env
â”‚
â””â”€â”€ README.md
```
