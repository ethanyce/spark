# API Reference

Base URL: `http://localhost:3000/api`

Protected routes require `Authorization: Bearer <access_token>` in the request header.

---

## Auth

### POST /auth/login
Public. Authenticates a user and returns a session token.

**Request body** (`application/json`)
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```
| Field | Type | Rules |
|---|---|---|
| `email` | string | Required, valid email format |
| `password` | string | Required, min 6 characters |

**Response 201**
```json
{
  "access_token": "<supabase_jwt>",
  "role": "student",
  "department": "CS",
  "first_name": "Juan",
  "last_name": "dela Cruz"
}
```

**Errors**
| Status | Reason |
|---|---|
| 401 | Invalid credentials or inactive account |
| 401 | User record not found |

---

### POST /auth/logout
Protected. Invalidates the current Supabase session.

**Response 201**
```json
{
  "message": "Logout successful"
}
```

**Errors**
| Status | Reason |
|---|---|
| 401 | Missing/invalid token or inactive account |

---

### GET /auth/me
Protected. Returns the authenticated user's profile as attached by `SupabaseGuard`.

**Response 200**
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

**Errors**
| Status | Reason |
|---|---|
| 401 | Missing/invalid token or inactive account |

---

## Superadmin

### POST /superadmin/admins
Protected — requires role `super_admin`. Creates an admin account and sends an invite email. Account is inactive until the invitee sets their password via the email link.

**Request body** (`application/json`)
```json
{
  "email": "newadmin@example.com",
  "first_name": "Maria",
  "last_name": "Santos",
  "department": "IT"
}
```
| Field | Type | Rules |
|---|---|---|
| `email` | string | Required, valid email format |
| `first_name` | string | Required |
| `last_name` | string | Required |
| `department` | string | Required, `IS` \| `IT` \| `CS` |

**Response 201**
```json
{
  "message": "Admin account created. An invitation email has been sent.",
  "admin": {
    "id": "uuid",
    "email": "newadmin@example.com",
    "first_name": "Maria",
    "last_name": "Santos",
    "role": "admin",
    "department": "IT",
    "is_active": false,
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

**Errors**
| Status | Reason |
|---|---|
| 401 | Missing/invalid token or inactive account |
| 403 | Authenticated user is not `super_admin` |
| 409 | An account with this email already exists |
| 500 | Failed to send invitation or create record |

---

## Admin

### POST /admin/students
Protected — requires role `admin` or `super_admin`. Creates a student account and sends an invite email. Account is inactive until the invitee sets their password via the email link.

**Request body** (`application/json`)
```json
{
  "email": "newstudent@example.com",
  "first_name": "Juan",
  "last_name": "dela Cruz",
  "department": "CS"
}
```
| Field | Type | Rules |
|---|---|---|
| `email` | string | Required, valid email format |
| `first_name` | string | Required |
| `last_name` | string | Required |
| `department` | string | Required, `IS` \| `IT` \| `CS` |

**Response 201**
```json
{
  "message": "Student account created. An invitation email has been sent.",
  "student": {
    "id": "uuid",
    "email": "newstudent@example.com",
    "first_name": "Juan",
    "last_name": "dela Cruz",
    "role": "student",
    "department": "CS",
    "is_active": false,
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

**Errors**
| Status | Reason |
|---|---|
| 401 | Missing/invalid token or inactive account |
| 403 | Authenticated user is not `admin` or `super_admin` |
| 409 | A student with this email already exists |
| 500 | Failed to send invitation or create record |

---

### GET /admin/submissions
Protected — requires role `admin` or `super_admin`. Lists document submissions sorted newest first. Admins see only their department; `super_admin` sees all.

**Query parameters**
| Param | Type | Notes |
|---|---|---|
| `status` | string | Optional. `pending` \| `under_review` \| `revision` \| `approved` \| `rejected` |

**Response 200** — array of document rows

**Errors**
| Status | Reason |
|---|---|
| 401 | Missing/invalid token or inactive account |
| 403 | Insufficient role |

---

### POST /admin/submissions/:id/review
Protected — requires role `admin` or `super_admin`. Records a review decision on a submission. On `approve`, publishes the document to the public repository. On `reject` or `revise`, inserts a row into `reviews` and sends a notification to the student.

**Request body** (`application/json`)
```json
{
  "decision": "revise",
  "feedback": "Please expand the methodology section."
}
```
| Field | Type | Rules |
|---|---|---|
| `decision` | string | Required, `approve` \| `reject` \| `revise` |
| `feedback` | string | Optional |

**Response 201**
```json
{
  "message": "Document revised successfully.",
  "document": { "...": "updated document row" }
}
```

**Errors**
| Status | Reason |
|---|---|
| 401 | Missing/invalid token or inactive account |
| 403 | Document belongs to a different department |
| 404 | Document not found |
| 500 | Failed to save review or update document |

---

### GET /admin/fulltext-requests
Protected — requires role `admin` or `super_admin`. Lists full-text access requests sorted newest first.

**Query parameters**
| Param | Type | Notes |
|---|---|---|
| `status` | string | Optional. `pending` \| `fulfilled` \| `denied` |

**Response 200** — array of `fulltext_requests` rows

**Errors**
| Status | Reason |
|---|---|
| 401 | Missing/invalid token or inactive account |
| 403 | Insufficient role |

---

### PUT /admin/fulltext-requests/:id
Protected — requires role `admin` or `super_admin`. Marks a full-text request as fulfilled or denied. Sets `handled_by` to the current user and stamps `fulfilled_at` if fulfilled.

**Request body** (`application/json`)
```json
{
  "status": "fulfilled"
}
```
| Field | Type | Rules |
|---|---|---|
| `status` | string | Required, `fulfilled` \| `denied` |

**Response 200**
```json
{
  "message": "Full-text request marked as fulfilled.",
  "request": { "...": "updated fulltext_requests row" }
}
```

**Errors**
| Status | Reason |
|---|---|
| 401 | Missing/invalid token or inactive account |
| 403 | Request has already been processed |
| 404 | Full-text request not found |
| 500 | Failed to update request |

---

## Documents

### POST /documents/upload
Protected — requires role `student`. Uploads a PDF and creates a document record with `status = 'pending'`. File is stored at `{userId}/{timestamp}_{filename}` in the `documents` storage bucket.

**Request body** (`multipart/form-data`)
| Field | Type | Rules |
|---|---|---|
| `file` | File (PDF) | Required, max 10 MB |
| `title` | string | Required |
| `authors` | JSON string | Required, e.g. `'["Name A", "Name B"]'` |
| `department` | string | Required, `IS` \| `IT` \| `CS` |
| `type` | string | Required, `thesis` \| `capstone` |
| `abstract` | string | Optional |
| `year` | number | Optional, 1900 – current year + 1 |
| `track_specialization` | string | Optional |
| `adviser` | string | Optional |
| `keywords` | JSON string | Optional, e.g. `'["keyword1", "keyword2"]'` |

**Response 201** — full `documents` row with `status: "pending"`

**Errors**
| Status | Reason |
|---|---|
| 400 | Validation error or invalid file type |
| 401 | Missing/invalid token or inactive account |
| 403 | Authenticated user is not `student` |
| 500 | Failed to upload file or save record |

---

### GET /documents
Public. Returns a paginated list of approved documents with optional filters.

**Query parameters**
| Param | Type | Notes |
|---|---|---|
| `department` | string | Optional. `IS` \| `IT` \| `CS` |
| `type` | string | Optional. `thesis` \| `capstone` |
| `year` | number | Optional |
| `track` | string | Optional, partial match on `track_specialization` |
| `keyword` | string | Optional, matches within keywords array |
| `page` | number | Optional, default `1` |
| `limit` | number | Optional, default `10` |

**Response 200**
```json
{
  "data": [ { "...": "document rows" } ],
  "page": 1,
  "limit": 10,
  "total": 42
}
```

**Errors**
| Status | Reason |
|---|---|
| 400 | Supabase query error |

---

### GET /documents/search
Public. Full-text search across `title`, `abstract`, `authors`, and `keywords` of approved documents.

**Query parameters**
| Param | Type | Notes |
|---|---|---|
| `q` | string | Required, non-empty search query |

**Response 200** — array of matching document rows

**Errors**
| Status | Reason |
|---|---|
| 400 | `q` is missing or blank |

---

### GET /documents/check-duplicate
Public. Compares a title against all non-rejected documents using the Dice coefficient. Returns matches with similarity ≥ 80%. Call before uploading.

**Query parameters**
| Param | Type | Notes |
|---|---|---|
| `title` | string | Required, non-empty |

**Response 200**
```json
{
  "isDuplicate": true,
  "matches": [
    {
      "id": "uuid",
      "title": "Similar Existing Title",
      "similarity": 0.92
    }
  ]
}
```

**Errors**
| Status | Reason |
|---|---|
| 400 | `title` is missing or blank |

---

### PUT /documents/:id
Protected — requires role `student`. Re-uploads a revised PDF and/or updates metadata. Only allowed when the document's `status` is `revision`. Resets status to `pending`. Only the document's owner may revise it.

**Request body** (`multipart/form-data`) — all fields optional
| Field | Type | Notes |
|---|---|---|
| `file` | File (PDF) | Optional, max 10 MB. Replaces the existing PDF. |
| `title` | string | Optional |
| `authors` | JSON string | Optional |
| `abstract` | string | Optional |
| `year` | number | Optional |
| `track_specialization` | string | Optional |
| `adviser` | string | Optional |
| `keywords` | JSON string | Optional |

**Response 200** — full updated `documents` row with `status: "pending"`

**Errors**
| Status | Reason |
|---|---|
| 401 | Missing/invalid token or inactive account |
| 403 | Document status is not `revision` |
| 403 | Authenticated user is not `student` |
| 404 | Document not found or not owned by this user |
| 500 | Failed to upload file or update record |

---

### GET /documents/:id/download-abstract
Public. Returns the abstract of an approved document as a plain-text file download.

**Response 200** — `Content-Type: text/plain`, `Content-Disposition: attachment; filename="<title>-abstract.txt"`
```
Title:      My Research Paper
Authors:    Juan dela Cruz, Maria Santos
Year:       2024
Department: CS
Type:       thesis
Adviser:    Dr. Reyes

Abstract:
Lorem ipsum...
```

**Errors**
| Status | Reason |
|---|---|
| 404 | Document not found or not approved |

---

## Student

### POST /student/documents
Protected — requires role `student`. Identical behavior to `POST /documents/upload`. Same request body and response.

---

## Full-Text Requests

### POST /fulltext-requests
Public (Guest). Submits a request for full-text access to an approved document. Prevents duplicate pending requests from the same email for the same document.

**Request body** (`application/json`)
```json
{
  "document_id": "uuid",
  "requester_name": "John Doe",
  "requester_email": "john@example.com",
  "purpose": "Academic research for thesis",
  "department": "CS"
}
```
| Field | Type | Rules |
|---|---|---|
| `document_id` | string (UUID) | Required |
| `requester_name` | string | Required |
| `requester_email` | string | Required, valid email format |
| `purpose` | string | Required |
| `department` | string | Required, `IS` \| `IT` \| `CS` \| `Other` |

**Response 201**
```json
{
  "message": "Full-text request submitted successfully. You will be contacted via email once processed.",
  "request": { "...": "fulltext_requests row" }
}
```

**Errors**
| Status | Reason |
|---|---|
| 404 | Document not found or not approved |
| 409 | A pending request already exists for this email + document |
| 500 | Failed to save request |

---

## Notifications

### GET /notifications
Protected. Returns all notifications for the authenticated user, sorted newest first.

**Response 200**
```json
[
  {
    "id": "uuid",
    "type": "document_approved",
    "message": "Your document \"My Thesis\" was approved.",
    "is_read": false,
    "reference_id": "uuid",
    "created_at": "2024-01-15T10:00:00Z"
  }
]
```

**Errors**
| Status | Reason |
|---|---|
| 401 | Missing/invalid token or inactive account |

---

### PATCH /notifications/read-all
Protected. Marks all unread notifications for the authenticated user as read.

**Response 200**
```json
{
  "message": "All notifications marked as read."
}
```

**Errors**
| Status | Reason |
|---|---|
| 401 | Missing/invalid token or inactive account |
| 500 | Failed to update notifications |

---

### PATCH /notifications/:id/read
Protected. Marks a single notification as read.

**Response 200** — updated notification row

**Errors**
| Status | Reason |
|---|---|
| 401 | Missing/invalid token or inactive account |
| 404 | Notification not found or not owned by this user |
| 500 | Failed to update notification |

---

## Repository *(Legacy)*

### GET /repository/documents
Public. Returns approved documents whose title contains the search query (case-insensitive, partial match).

**Query parameters**
| Param | Type | Notes |
|---|---|---|
| `name` | string | Required, non-empty |

**Response 200** — array of matching document rows

**Errors**
| Status | Reason |
|---|---|
| 400 | `name` query param is missing or blank |
