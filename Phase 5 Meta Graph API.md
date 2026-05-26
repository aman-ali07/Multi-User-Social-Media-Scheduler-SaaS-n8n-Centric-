# Phase 5: Meta Graph API Documentation

**Target Version:** v21.0 (released Oct 2024; current latest is v25.0 as of May 2026)
**Base URL:** `https://graph.facebook.com/v21.0/`

---

## 1. OAuth 2.0 Flow

### 1.1 Authorization URL

```
GET https://www.facebook.com/v21.0/dialog/oauth
  ?client_id={META_APP_ID}
  &redirect_uri={META_CALLBACK_URL}
  &state={random_state_string}
  &scope=pages_manage_posts,pages_read_engagement,pages_show_list,instagram_basic,instagram_content_publish
  &response_type=code
```

**Permissions required:**
| Permission | Purpose |
|---|---|
| `pages_manage_posts` | Create, edit, delete posts on Facebook Pages |
| `pages_read_engagement` | Read Page insights and engagement |
| `pages_show_list` | List Pages the user manages |
| `instagram_basic` | Read Instagram account data |
| `instagram_content_publish` | Publish content to Instagram |

### 1.2 Token Exchange (Code → Short-lived Token)

```
GET https://graph.facebook.com/v21.0/oauth/access_token
  ?client_id={META_APP_ID}
  &redirect_uri={META_CALLBACK_URL}
  &client_secret={META_APP_SECRET}
  &code={authorization_code}
```

**Response:**
```json
{
  "access_token": "EAA...",
  "token_type": "bearer",
  "expires_in": 7200
}
```

Short-lived token expires in **2 hours**.

### 1.3 Short-lived → Long-lived Token (60 days)

```
GET https://graph.facebook.com/v21.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={META_APP_ID}
  &client_secret={META_APP_SECRET}
  &fb_exchange_token={short_lived_token}
```

**Response:**
```json
{
  "access_token": "EAA...",
  "token_type": "bearer",
  "expires_in": 5184000
}
```

### 1.4 Refresh Long-lived Token

Same endpoint as 1.3 — calling it again with the same long-lived token returns a **new** long-lived token with a fresh 60-day expiry. Only works if the token hasn't expired yet.

---

## 2. Facebook Pages

### 2.1 Get User's Pages

```
GET /me/accounts?access_token={user_token}
```

**Response:**
```json
{
  "data": [
    {
      "id": "123456789",
      "name": "My Page",
      "access_token": "EAA...",
      "category": "Software",
      "tasks": ["ADMINISTER", "MODERATE", "CREATE_CONTENT"]
    }
  ]
}
```

**Page access tokens never expire** — store once and use indefinitely.

### 2.2 Get Page's Instagram Business Account

```
GET /{page-id}?fields=instagram_business_account&access_token={page_token}
```

**Response:**
```json
{
  "id": "123456789",
  "instagram_business_account": {
    "id": "178414..."
  }
}
```

### 2.3 Create Text Post

```
POST /{page-id}/feed
  ?message=Hello+world
  &access_token={page_token}
```

### 2.4 Create Photo Post

```
POST /{page-id}/photos
  ?url=https://example.com/photo.jpg
  &message=Check+this+out
  &published=true
  &access_token={page_token}
```

**Supported formats:** JPEG, PNG, GIF, BMP, TIFF
**Max size:** No documented limit but practical max ~25MB

### 2.5 Create Video Post

```
POST /{page-id}/videos
  ?file_url=https://example.com/video.mp4
  &description=Great+video
  &access_token={page_token}
```

**Supported formats:** MP4, MOV, AVI, FLV
**Max size:** 10GB (via resumable upload), 1GB (via file_url)
**Max length:** 240 minutes

### 2.6 Publish Existing Draft

```
POST /{page-id}/feed
  ?message=Hello
  &published=false
  &access_token={page_token}
  &scheduled_publish_time=1747724400
```

Use `published=false` + `scheduled_publish_time` (unix timestamp, min 10min in future, max 6 months).

---

## 3. Instagram Content Publishing

### 3.1 Authentication

Two paths:
- **Instagram Login (graph.instagram.com)** — simpler, fewer endpoints
- **Facebook Login (graph.facebook.com)** — required for our use case (Pages + Instagram)

We use **Facebook Login path** → `graph.facebook.com/v21.0/` host.

### 3.2 Publishing Flow

Instagram uses a **2-step container model**:

```
Step 1: POST /{ig-user-id}/media          → returns container_id
Step 2: Wait for container to be FINISHED → GET /{container-id}?fields=status_code
Step 3: POST /{ig-user-id}/media_publish   → returns media_id
```

### 3.3 Create Media Container

```
POST /{ig-user-id}/media
```

| Parameter | Required | Description |
|---|---|---|
| `image_url` | For IMAGE | Public URL of the image |
| `video_url` | For VIDEO/REELS | Public URL of the video |
| `media_type` | For video | `IMAGE` (default), `REELS`, `STORIES` |
| `caption` | No | Caption text (max 2,200 chars) |
| `location_id` | No | Page location ID |
| `user_tags` | No | Array of `{username, x, y}` objects |
| `collaborators` | No | Array of collaborator IDs (max 3) |
| `share_to_feed` | No | For REELS: `true` to share to feed |
| `access_token` | Yes | Page access token |

**Example — Image:**
```
POST /{ig-user-id}/media
  ?image_url=https://example.com/photo.jpg
  &caption=Amazing+sunset
  &access_token={page_token}
```

**Response:**
```json
{ "id": "17912345678901234" }
```

### 3.4 Check Container Status

```
GET /{container-id}
  ?fields=status_code
  &access_token={page_token}
```

**Status values:**
| Status | Meaning |
|---|---|
| `IN_PROGRESS` | Still processing — wait and retry |
| `FINISHED` | Ready to publish |
| `ERROR` | Processing failed — check `error` field |
| `EXPIRED` | Container timed out (>24h) |

### 3.5 Publish Container

```
POST /{ig-user-id}/media_publish
  ?creation_id={container-id}
  &access_token={page_token}
```

**Response:**
```json
{ "id": "18012345678901234" }
```

### 3.6 Media Requirements

| | Image | Video/Reels |
|---|---|---|
| Formats | JPEG only | MP4, MOV (H.264, AAC) |
| Max size | 8MB | 1GB |
| Aspect ratio | 4:5 to 1.91:1 | 1:1, 4:5, 9:16 |
| Min resolution | 320px | 320px |
| Duration | N/A | 3s – 60s (feed), 3s – 15min (Reels) |

⚠️ `media_type=VIDEO` is deprecated. Use `media_type=REELS` for all video publishing.

### 3.7 Rate Limits

- **100 API-published posts per 24 hours** per Instagram account
- Check remaining limit: `GET /{ig-user-id}/content_publishing_limit?access_token={token}`

---

## 4. Token Types & Lifetimes

| Token Type | Source | Lifetime | Refreshable |
|---|---|---|---|
| Short-lived user token | OAuth login | 2 hours | Exchange for long-lived |
| Long-lived user token | `fb_exchange_token` | 60 days | Via `fb_exchange_token` again |
| Page access token | `GET /me/accounts` | **Never expires** | Not needed |
| Instagram Business token | Same as Page token | **Never expires** | Not needed |

**Implementation note:** Page access tokens do not expire, but can be invalidated if:
- The user removes the app
- The user changes their password
- Permissions are revoked

The Token Refresh Workflow (WF-8) handles the case where a page token fails with code 190 — it re-fetches from `/me/accounts` using the stored long-lived user token.

---

## 5. Error Codes

| Code | Type | Meaning | Action |
|---|---|---|---|
| 190 | OAuthException | Invalid/expired token | Trigger token refresh |
| 100 | GraphMethodException | Invalid parameter | Check request format |
| 200 | Permissions error | Missing permission | Re-request OAuth |
| 368 | Action limit | Rate limited | Backoff and retry |
| 400 | Invalid request | Bad payload | Check media format |
| 341 | Missing URL | Media URL not accessible | Verify public URL |
| 2000 | Instagram error | Container processing error | Create new container |
| 2200 | Facebook error | Posting error | Check page permissions |

**Token error (code 190) subcodes:**
| Subcode | Meaning |
|---|---|
| 460 | Token expired |
| 463 | Token has no session |
| 464 | Token revoked |
| 467 | Token requires re-authentication |

---

## 6. Request Flow Diagram

```
User                  Next.js               n8n                  Meta Graph API
 |                      |                    |                       |
 |── Connect Account ──→|                    |                       |
 |                      |── POST /oauth-connect ──→|                 |
 |                      |                    |── build OAuth URL    |
 |                      |                    |──| store state      |
 |                      |← respond URL ──────|                       |
 |← redirect to FB ─────|                    |                       |
 |── authorize ────────────────────────────────────────────────────→|
 |← callback code ────────────────────────────────────────────────  |
 |                      |── GET /oauth-callback ─→|                 |
 |                      |                    |── validate state     |
 |                      |                    |── exchange code ────→|
 |                      |                    |── get long-lived ───→|
 |                      |                    |── get pages ───────→|
 |                      |                    |── store account      |
 |                      |← respond ──────────|                       |
 |← success ────────────|                    |                       |
 |                      |                    |                       |
 |── Schedule Post ────→|                    |                       |
 |                      |── POST /post ─────→|                       |
 |                      |                    |── insert schedule    |
 |                      |← respond ──────────|                       |
 |                      |                    |                       |
 |                      |                    | [every 1 minute]     |
 |                      |                    |── fetch due posts    |
 |                      |                    |── POST /facebook-publish ─→|
 |                      |                    |── POST /media ──────→|
 |                      |                    |── POST /media_publish→|
 |                      |                    |── update DB           |
 |                      |                    |                       |
 |                      |                    | [on error]           |
 |                      |                    |── POST /retry ─→     |
 |                      |                    |── POST /token-refresh→|
 |                      |                    |── retry publish      |
```

---

## 7. Endpoint Summary

| # | Endpoint | Method | Used By |
|---|---|---|---|
| 1 | `/dialog/oauth` | GET | WF-1 (redirect user) |
| 2 | `/oauth/access_token` (code) | GET | WF-2 (exchange code) |
| 3 | `/oauth/access_token` (exchange) | GET | WF-2, WF-8 (get long-lived) |
| 4 | `/me/accounts` | GET | WF-2 (list pages) |
| 5 | `/{page-id}?fields=instagram_business_account` | GET | WF-2 (get IG id) |
| 6 | `/{page-id}/feed` | POST | WF-6 (post text) |
| 7 | `/{page-id}/photos` | POST | WF-6 (post image) |
| 8 | `/{ig-user-id}/media` | POST | WF-7 (create container) |
| 9 | `/{container-id}` | GET | WF-7 (check status) |
| 10 | `/{ig-user-id}/media_publish` | POST | WF-7 (publish) |
