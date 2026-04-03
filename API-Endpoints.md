# API Endpoints

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

---

## Auth

### `POST /api/auth/login`
Public. Authenticates a user and returns a session token.

**Body**
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Response**
```json
{
  "access_token": "...",
  "role": "student",
  "department": "CS",
  "first_name": "Juan",
  "last_name": "dela Cruz"
}
```

---

### `POST /api/auth/logout`
Protected. Invalidates the current session.

**Headers** `Authorization: Bearer <token>`

**Response**
```json
{ "message": "Logout successful" }
```

---

### `GET /api/auth/me`
Protected. Returns the authenticated user's profile.

**Headers** `Authorization: Bearer <token>`

**Response**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "student",
  "department": "CS",
  "first_name": "Juan",
  "last_name": "dela Cruz",
  "is_active": true
}
```

---

## Documents

### `POST /api/documents/upload`
Protected — `student` only. Multipart/form-data. Auto-sets status to `pending`.

**Headers** `Authorization: Bearer <token>`

**Body** `multipart/form-data`
| Field | Type | Required | Notes |
|---|---|---|---|
| `file` | File (PDF) | Yes | Max 10 MB |
| `title` | string | Yes | |
| `authors` | JSON string | Yes | e.g. `'["Name A","Name B"]'` |
| `department` | string | Yes | `IS` \| `IT` \| `CS` |
| `type` | string | Yes | `thesis` \| `capstone` |
| `abstract` | string | No | |
| `year` | number | No | 1900 – current year + 1 |
| `track_specialization` | string | No | |
| `adviser` | string | No | |
| `keywords` | JSON string | No | e.g. `'["keyword1","keyword2"]'` |

---

### `GET /api/documents`
Public. Paginated list of approved documents with optional filters.

**Query Parameters**
| Param | Type | Notes |
|---|---|---|
| `department` | string | `IS` \| `IT` \| `CS` |
| `type` | string | `thesis` \| `capstone` |
| `year` | number | |
| `track` | string | Partial match |
| `keyword` | string | Matches against keywords array |
| `page` | number | Default: `1` |
| `limit` | number | Default: `10` |

---

### `GET /api/documents/search`
Public. Full-text search across title, authors, abstract, and keywords. Results are relevance-ranked.

**Query Parameters**
| Param | Type | Notes |
|---|---|---|
| `q` | string | Search query |

---

### `GET /api/documents/check-duplicate`
Public. Returns existing documents with a title similarity ≥ 80%. Call before uploading.

**Query Parameters**
| Param | Type | Notes |
|---|---|---|
| `title` | string | Title to check |

---

### `PUT /api/documents/:id`
Protected — `student` only. Re-uploads a revised PDF and/or updates metadata. Only allowed when document status is `revision`. Resets status to `pending`.

**Headers** `Authorization: Bearer <token>`

**Body** `multipart/form-data`
| Field | Type | Required | Notes |
|---|---|---|---|
| `file` | File (PDF) | No | Max 10 MB |
| `title` | string | No | |
| `authors` | JSON string | No | |
| `abstract` | string | No | |
| `year` | number | No | |
| `track_specialization` | string | No | |
| `adviser` | string | No | |
| `keywords` | JSON string | No | |

---

### `GET /api/documents/:id/download-abstract`
Public. Returns the document abstract as a plain-text file download.

---

## Student

### `POST /api/student/documents`
Protected — `student` only. Legacy upload endpoint. Same payload as `POST /api/documents/upload`.

**Headers** `Authorization: Bearer <token>`

**Body** `multipart/form-data` — same fields as `POST /api/documents/upload`.

---

## Admin

### `POST /api/admin/students`
Protected — `admin` or `super_admin`. Creates a student account and sends an invite email.

**Headers** `Authorization: Bearer <token>`

**Body**
```json
{
  "email": "student@example.com",
  "first_name": "Juan",
  "last_name": "dela Cruz",
  "department": "CS"
}
```

---

### `GET /api/admin/submissions`
Protected — `admin` or `super_admin`. Lists document submissions. Admins see only their department; super_admin sees all. Sorted newest first.

**Headers** `Authorization: Bearer <token>`

**Query Parameters**
| Param | Type | Notes |
|---|---|---|
| `status` | string | e.g. `pending`, `under_review`, `revision` |

---

### `POST /api/admin/submissions/:id/review`
Protected — `admin` or `super_admin`. Approves, rejects, or requests revision on a submission. On `reject` or `revise`, creates a review record and triggers a student notification.

**Headers** `Authorization: Bearer <token>`

**Body**
```json
{
  "decision": "approve",
  "feedback": "Optional feedback text"
}
```

| Field | Values |
|---|---|
| `decision` | `approve` \| `reject` \| `revise` |
| `feedback` | Optional string |

---

### `GET /api/admin/fulltext-requests`
Protected — `admin` or `super_admin`. Lists full-text requests. Admins see only their department; super_admin sees all.

**Headers** `Authorization: Bearer <token>`

**Query Parameters**
| Param | Type | Notes |
|---|---|---|
| `status` | string | e.g. `pending`, `fulfilled`, `denied` |

---

### `PUT /api/admin/fulltext-requests/:id`
Protected — `admin` or `super_admin`. Marks a full-text request as fulfilled or denied.

**Headers** `Authorization: Bearer <token>`

**Body**
```json
{
  "status": "fulfilled"
}
```

| Field | Values |
|---|---|
| `status` | `fulfilled` \| `denied` |

---

## Superadmin

### `POST /api/superadmin/admins`
Protected — `super_admin` only. Creates an admin account and sends an invite email.

**Headers** `Authorization: Bearer <token>`

**Body**
```json
{
  "email": "admin@example.com",
  "first_name": "Maria",
  "last_name": "Santos",
  "department": "IT"
}
```

---

## Full-Text Requests

### `POST /api/fulltext-requests`
Public (Guest). Submits a request for full-text access to an approved document.

**Body**
```json
{
  "document_id": "uuid",
  "requester_name": "John Doe",
  "requester_email": "john@example.com",
  "purpose": "Academic research",
  "department": "CS"
}
```

| Field | Values |
|---|---|
| `department` | `IS` \| `IT` \| `CS` \| `Other` |

---

## Notifications

### `GET /api/notifications`
Protected. Returns all notifications for the authenticated user, newest first.

**Headers** `Authorization: Bearer <token>`

---

### `PATCH /api/notifications/read-all`
Protected. Marks all unread notifications as read.

**Headers** `Authorization: Bearer <token>`

---

### `PATCH /api/notifications/:id/read`
Protected. Marks a single notification as read.

**Headers** `Authorization: Bearer <token>`

---

## Repository *(Legacy)*

### `GET /api/repository/documents`
Public. Returns approved documents whose title contains the search query.

**Query Parameters**
| Param | Type | Notes |
|---|---|---|
| `name` | string | Title search string |
