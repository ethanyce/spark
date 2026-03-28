# API Reference

Base URL: `http://localhost:3000`

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
  "role": "student"
}
```

**Errors**
| Status | Reason |
|---|---|
| 401 | Invalid credentials, unconfirmed email, or inactive account |
| 401 | Profile not found |

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
| 401 | Missing/invalid token, inactive account |

---

### GET /auth/profile
Protected. Returns the authenticated user's profile as attached by `SupabaseGuard`.

**Response 200**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "student",
  "account_status": "active"
}
```

**Errors**
| Status | Reason |
|---|---|
| 401 | Missing/invalid token, inactive account |

---

## Superadmin

### POST /superadmin/admins
Protected — requires role `superadmin`. Creates an admin account and sends an invite email. The account is `inactive` until the invitee sets their password.

**Request body** (`application/json`)
```json
{
  "email": "newadmin@example.com"
}
```
| Field | Type | Rules |
|---|---|---|
| `email` | string | Required, valid email format |

**Response 201**
```json
{
  "message": "Admin account created. An invitation email has been sent.",
  "admin": {
    "id": "uuid",
    "email": "newadmin@example.com",
    "role": "admin",
    "account_status": "inactive"
  }
}
```

**Errors**
| Status | Reason |
|---|---|
| 401 | Missing/invalid token, inactive account |
| 403 | Authenticated user is not a `superadmin` |
| 409 | An account with this email already exists |
| 500 | Failed to send invitation or create profile |

---

## Admin

### POST /admin/students
Protected — requires role `admin`. Creates a student account and sends an invite email. The account is `inactive` until the invitee sets their password.

**Request body** (`application/json`)
```json
{
  "email": "newstudent@example.com"
}
```
| Field | Type | Rules |
|---|---|---|
| `email` | string | Required, valid email format |

**Response 201**
```json
{
  "message": "Student account created. An invitation email has been sent.",
  "student": {
    "id": "uuid",
    "email": "newstudent@example.com",
    "role": "student",
    "account_status": "inactive"
  }
}
```

**Errors**
| Status | Reason |
|---|---|
| 401 | Missing/invalid token, inactive account |
| 403 | Authenticated user is not an `admin` |
| 409 | A student with this email already exists |
| 500 | Failed to send invitation or create profile |

---

## Student

### POST /student/materials
Protected — requires role `student`. Uploads a material file and creates a record in the `materials` table with `status = 'pending'`. The `author` field is automatically set to the student's name from their profile.

**Request body** (`multipart/form-data`)
| Field | Type | Rules |
|---|---|---|
| `file` | file | Required, max 10 MB |
| `publish_date` | string | Optional, ISO 8601 date (e.g. `2024-01-15`) |
| `version` | string | Optional |

**Response 201** — full `materials` row
```json
{
  "id": "uuid",
  "author": "Jane Doe",
  "publish_date": "2024-01-15",
  "version": "1.0",
  "file_path": "<userId>/<timestamp>_filename.pdf",
  "file_name": "filename.pdf",
  "submitted_by": "uuid",
  "status": "pending",
  "created_at": "2024-01-15T10:00:00Z"
}
```

**Errors**
| Status | Reason |
|---|---|
| 401 | Missing/invalid token, inactive account |
| 403 | Authenticated user is not a `student` |
| 400 | File exceeds 10 MB |
| 500 | Failed to fetch student profile, upload file, or save record |

---

## Repository

### GET /repository/materials?name=
Public. Returns all **approved** materials whose `file_name` contains the search query (case-insensitive, partial match).

**Query parameters**
| Param | Type | Rules |
|---|---|---|
| `name` | string | Required, non-empty |

**Response 200**
```json
[
  {
    "id": "uuid",
    "file_name": "lecture-notes.pdf",
    "author": "Jane Doe",
    "publish_date": "2024-01-15",
    "version": "1.0",
    "file_path": "<userId>/<timestamp>_lecture-notes.pdf",
    "submitted_by": "uuid",
    "created_at": "2024-01-15T10:00:00Z"
  }
]
```

**Errors**
| Status | Reason |
|---|---|
| 400 | `name` query param is missing or blank |
| 400 | Supabase query error |
