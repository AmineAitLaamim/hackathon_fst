# Marrakech Tourism App - Project Brief & Task Division

> Stack: Django REST Framework, React + React Router, Axios + JWT, Google Maps JS SDK, Claude AI

---

## Project Overview

A tourism application for Marrakech that lets users:

- Generate personalized AI tours based on their profile, health conditions, and interests.
- Browse and use public tours shared by other users, with ratings and AI personalization.
- Share tours privately with friends and explore them together in live group sessions.

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

- Auth endpoints `[done]`
- User profile endpoints `[done]`
- Tour planner AI endpoints `[done]`
- Places endpoints `[done]`
- JWT, token blacklist, protected routes, and Claude context wiring `[done]`

**19 endpoints**

---

## Dev 2 - Backend Social

**Modules: Friends, Invitations, Shared Tours, Group Tours, Notifications**

- Friends endpoints `[done]`
- Invitations endpoints `[done]`
- Shared tours and ratings endpoints `[done]`
- Group tour session endpoints `[done]`
- Notifications endpoints `[done]`

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
