# Marrakech Tourism App - Project Brief & Task Division

> Stack: Django REST Framework, React + React Router, Axios + JWT, Google Maps JS SDK, Claude AI

---

## Project Overview

A tourism application for Marrakech that lets users:

- Generate personalized AI tours based on their profile, health conditions, and interests
- Browse and use public tours shared by other users, with ratings and AI personalization
- Share tours privately with friends and explore them together in live group sessions

---

## Architecture Decisions

- Access token stored in memory, refresh token in an `httpOnly` cookie.
- Global Axios interceptor: on `401`, call `POST /api/auth/refresh`, retry the original request, and redirect to `/login` if refresh fails.
- AI endpoints call `claude-sonnet-4-20250514` with user profile, health, and interests as context via `ANTHROPIC_API_KEY`.
- Stop detail data is embedded in the tour object, with no per-stop Places calls in v1.
- `shareId` is separate from `tourId` so sharing can be revoked without deleting the original tour.
- `/personalize` always saves as `draft` first, so nothing is finalized silently.
- Group sessions use polling every 3-5s in v1.
- `generate`, `shared-with-me`, `friends/requests`, `places/categories`, and `rate/me` must all be registered as DRF `@action(detail=False)`.

---

## Dev 1 - Backend Core

**Modules: Auth, Users, Tours AI, Places**

### Auth Module

| Method | Route | Notes |
|--------|-------|-------|
| POST | `/api/auth/register` | Create account, return JWT tokens `[done]` |
| POST | `/api/auth/login` | Validate credentials, issue access + refresh tokens `[done]` |
| POST | `/api/auth/logout` | Blacklist refresh token (`BLACKLIST_AFTER_ROTATION = True`) `[done]` |
| POST | `/api/auth/refresh` | Issue new access token `[done]` |
| GET | `/api/auth/me` | Current user profile `[done]` |
| PATCH | `/api/auth/me` | Partial update - name, avatar `[done]` |

### User Profile

| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/users/:id` | Public profile `[done]` |
| PATCH | `/api/users/:id/interests` | Partial update, do not wipe existing interests `[done]` |
| PATCH | `/api/users/:id/health` | Partial update, do not wipe existing conditions `[done]` |

### Tour Planner AI

| Method | Route | Notes |
|--------|-------|-------|
| POST | `/api/tours/generate` | Call Claude with `{ duration, budget, themes, notes }` + user context `[done]` |
| GET | `/api/tours` | List user's tours, sorted by date, with `draft/published/shared` badge `[done]` |
| GET | `/api/tours/shared-with-me` | Tours shared privately with me `[done]` |
| GET | `/api/tours/:id` | Tour detail with embedded stops `[done]` |
| PUT | `/api/tours/:id` | Replace tour `[done]` |
| PATCH | `/api/tours/:id` | Partial update `[done]` |
| DELETE | `/api/tours/:id` | Delete tour `[done]` |
| POST | `/api/tours/:id/invitations` | Share privately with friends `[done]` |
| POST | `/api/tours/:id/share` | Publish publicly `[done]` |
| PATCH | `/api/tours/:id/share` | Update share settings `[done]` |
| DELETE | `/api/tours/:id/share` | Unpublish and revert to draft `[done]` |

### Map & Places

| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/places` | List POIs with filters `[done]` |
| GET | `/api/places/categories` | `@action(detail=False)` `[done]` |
| GET | `/api/places/:id` | Place detail `[done]` |

**19 endpoints**

---

## Dev 2 - Backend Social

**Modules: Friends, Invitations, Shared Tours, Group Tours, Notifications**

### Friends

| Method | Route | Notes |
|--------|-------|-------|
| POST | `/api/friends/request` | Body: `{ "user_id": "..." }` |
| PATCH | `/api/friends/:id/respond` | Body: `{ status: "accepted" | "declined" }` |
| DELETE | `/api/friends/:id` | Remove friend |
| GET | `/api/friends` | List accepted friends |
| GET | `/api/friends/requests` | `?type=incoming|outgoing`, `@action(detail=False)` |

### Invitations

| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/invitations` | Pending invitations received |
| PATCH | `/api/invitations/:inviteId` | Accept or decline |

### Shared Tours

| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/shared-tours` | Browse public tours, `?sort=rating|recent&page=` |
| GET | `/api/shared-tours/:shareId` | Public tour detail with stops + average rating |
| GET | `/api/shared-tours/:shareId/rate/me` | My rating, 404 if none |
| POST | `/api/shared-tours/:shareId/rate` | Submit rating + optional comment |
| PUT | `/api/shared-tours/:shareId/rate` | Update rating |
| DELETE | `/api/shared-tours/:shareId/rate` | Remove rating |
| POST | `/api/shared-tours/:shareId/use` | Clone into user's tours |
| POST | `/api/shared-tours/:shareId/personalize` | AI re-personalize, auto-save as `draft` |

### Group / Collab Tours

| Method | Route | Notes |
|--------|-------|-------|
| POST | `/api/group-tours` | Create session |
| GET | `/api/group-tours` | List sessions |
| GET | `/api/group-tours/:id` | Session detail + members + live status |
| DELETE | `/api/group-tours/:id` | Disband |
| POST | `/api/group-tours/:id/invite` | Invite friends |
| POST | `/api/group-tours/:id/join` | Join via invite |
| POST | `/api/group-tours/:id/leave` | Leave |
| POST | `/api/group-tours/:id/stops/:stopId/checkin` | Check in at stop |
| POST | `/api/group-tours/:id/stops/:stopId/comments` | Post comment |
| DELETE | `/api/group-tours/:id/stops/:stopId/comments/:commentId` | Delete own comment |
| GET | `/api/group-tours/:id/activity` | Live activity feed |

### Notifications

| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/notifications` | Paginated list |
| POST | `/api/notifications/:id/read` | Mark as read |

**21 endpoints**

---

## Dev 3 - Frontend Core

**Routes: /login, /register, /onboarding, /generate, /tours, /tours/:id, /profile**

- Axios JWT interceptor `[done]`
- Login page `[done]`
- Register page `[done]`
- Onboarding wizard `[done]`
- Generate tour page `[done]`
- Tours list `[done]`
- Tour detail `[done]`
- Profile page `[done]`

**8 routes, Auth + Tours + Profile + Interceptor**

---

## Dev 4 - Frontend Social

**Routes: /explore, /explore/:shareId, /tours/personalize/:shareId, /friends, /invitations, /groups, /group/:id, /notifications**

- Explore public tours `[done]`
- Explore detail with rating block `[done]`
- Personalize shared tour flow `[done]`
- Friends page `[done]`
- Invitations page `[done]`
- Groups page `[done]`
- Live group session page `[done]`
- Notifications page `[done]`

**8 routes, Explore + Social + Groups + Notifications**

---

## Workload Summary

| Dev | Role | Modules | Volume |
|-----|------|---------|--------|
| Dev 1 | Backend Core | Auth, Users, Tours AI, Places | 19 endpoints |
| Dev 2 | Backend Social | Friends, Invitations, Shared Tours, Groups, Notifications | 21 endpoints |
| Dev 3 | Frontend Core | Auth, Onboarding, Tours, Profile, Interceptor | 8 routes |
| Dev 4 | Frontend Social | Explore, Personalize, Friends, Groups, Notifications | 8 routes |
