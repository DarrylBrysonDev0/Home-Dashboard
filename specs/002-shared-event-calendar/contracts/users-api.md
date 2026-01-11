# Users API Contract

**Version**: 1.0.0  
**Base Path**: `/api/users`  
**Authentication**: Admin only

---

## Endpoints Overview

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/users` | List all users | Admin |
| POST | `/api/users` | Create user | Admin |
| GET | `/api/users/[id]` | Get single user | Admin |
| PUT | `/api/users/[id]` | Update user | Admin |
| DELETE | `/api/users/[id]` | Delete user | Admin |

---

## GET /api/users

List all household member accounts (FR-031).

### Response 200

```typescript
{
  data: Array<{
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "MEMBER";
    avatarColor: string | null;
    failedLoginAttempts: number;
    lockedUntil: string | null;  // ISO 8601 or null
    createdAt: string;
    updatedAt: string;
  }>
}
```

### Response 401

```typescript
{ error: "Unauthorized" }
```

### Response 403

```typescript
{ error: "Admin access required" }
```

---

## POST /api/users

Create a new household member account (FR-032).

### Request Body

```typescript
{
  email: string;        // Required, valid email, unique
  name: string;         // Required, 1-100 chars
  password: string;     // Required, min 8 chars, at least one number (FR-004)
  role?: "ADMIN" | "MEMBER";  // Default: MEMBER
  avatarColor?: string; // Optional, hex color
}
```

### Zod Schema

```typescript
const createUserSchema = z.object({
  email: z.string().email().max(320),
  name: z.string().min(1).max(100),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters")
    .regex(/\d/, "Password must contain at least one number"),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
  avatarColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});
```

### Response 201

```typescript
{
  data: {
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "MEMBER";
    avatarColor: string | null;
    createdAt: string;
  }
}
```

### Response 400

```typescript
{
  error: "Validation failed",
  details: {
    fieldErrors: {
      email?: ["Email already exists"];
      password?: ["Password must be at least 8 characters"];
    }
  }
}
```

---

## GET /api/users/[id]

Get a single user's details.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (cuid) | User ID |

### Response 200

```typescript
{
  data: {
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "MEMBER";
    avatarColor: string | null;
    failedLoginAttempts: number;
    lockedUntil: string | null;
    createdAt: string;
    updatedAt: string;
    eventsCreated: number;  // Count of events created
  }
}
```

### Response 404

```typescript
{ error: "User not found" }
```

---

## PUT /api/users/[id]

Update a user's details (FR-033).

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (cuid) | User ID |

### Request Body

```typescript
{
  email?: string;
  name?: string;
  password?: string;  // If provided, will be hashed
  role?: "ADMIN" | "MEMBER";
  avatarColor?: string | null;
  unlockAccount?: boolean;  // If true, resets lockout
}
```

### Behavior

- If `password` is provided, it's hashed before storage
- If `unlockAccount: true`, sets `failedLoginAttempts = 0` and `lockedUntil = null`
- Role changes take effect immediately on next token refresh

### Response 200

```typescript
{
  data: {
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "MEMBER";
    avatarColor: string | null;
    updatedAt: string;
  }
}
```

### Response 400

```typescript
{
  error: "Validation failed",
  details: { /* field errors */ }
}
```

### Response 404

```typescript
{ error: "User not found" }
```

---

## DELETE /api/users/[id]

Delete a user account.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (cuid) | User ID |

### Behavior

1. Cannot delete your own account
2. Cannot delete the last admin
3. User's created events remain (createdById becomes orphaned reference)
4. User's event attendee records are deleted (cascade)

### Response 200

```typescript
{ data: { success: true } }
```

### Response 400

```typescript
{ error: "Cannot delete your own account" }
// or
{ error: "Cannot delete the last admin user" }
```

### Response 404

```typescript
{ error: "User not found" }
```

---

## Password Requirements (FR-004)

| Rule | Requirement |
|------|-------------|
| Minimum length | 8 characters |
| Maximum length | 72 characters (bcrypt limit) |
| Complexity | At least one number |

### Validation Regex

```typescript
const passwordRegex = /^(?=.*\d).{8,72}$/;
```

---

## Account Lockout (FR-005)

| Field | Description |
|-------|-------------|
| `failedLoginAttempts` | Incremented on each failed login |
| `lockedUntil` | Set to now + 15 minutes when attempts >= 5 |

### Unlock Behavior

Account automatically unlocks when:
1. `lockedUntil` time passes (automatic)
2. Admin sets `unlockAccount: true` via PUT (manual)

---

## Role Permissions

| Action | ADMIN | MEMBER |
|--------|-------|--------|
| View users | ✅ | ❌ |
| Create users | ✅ | ❌ |
| Edit users | ✅ | ❌ |
| Delete users | ✅ | ❌ |
| Change roles | ✅ | ❌ |
| Unlock accounts | ✅ | ❌ |
