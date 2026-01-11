# Auth API Contract

**Version**: 1.0.0  
**Base Path**: `/api/auth`  
**Framework**: NextAuth.js v4

---

## Overview

Authentication is handled by NextAuth.js with the Credentials provider. The API follows NextAuth conventions with custom extensions for user management.

---

## NextAuth Endpoints (Built-in)

These endpoints are automatically provided by NextAuth.js:

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/auth/signin` | Sign in page (redirects to custom `/login`) |
| POST | `/api/auth/signout` | Sign out and clear session |
| GET | `/api/auth/session` | Get current session |
| GET | `/api/auth/csrf` | Get CSRF token |
| GET/POST | `/api/auth/callback/credentials` | Credentials callback |

---

## Custom Auth Behavior

### Login Flow (FR-001, FR-005)

**POST** `/api/auth/callback/credentials`

Handled internally by NextAuth. Custom `authorize` function implements:

1. Validate email and password presence
2. Look up user by email
3. Check if account is locked (FR-005)
4. Verify password with bcrypt
5. On failure: increment `failedLoginAttempts`, lock if >= 5
6. On success: reset `failedLoginAttempts`, return user

### Account Lockout Response

When an account is locked, the authorize function throws an error that results in:

```typescript
// Login attempt on locked account
{
  error: "CredentialsSignin",
  url: "/login?error=CredentialsSignin"
}
```

The frontend detects this and can call a custom endpoint to check lockout status.

---

## GET /api/auth/me

Custom endpoint to get current user details (not a NextAuth built-in).

### Response 200 (Authenticated)

```typescript
{
  data: {
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "MEMBER";
    avatarColor: string | null;
  }
}
```

### Response 401 (Not Authenticated)

```typescript
{ error: "Unauthorized" }
```

---

## Session Object

Session data available via `getServerSession(authOptions)` or `useSession()`:

```typescript
interface Session {
  user: {
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "MEMBER";
  };
  expires: string; // ISO 8601
}
```

---

## JWT Token Claims

Custom claims added via NextAuth callbacks:

```typescript
interface JWT {
  id: string;      // User ID
  email: string;
  name: string;
  role: "ADMIN" | "MEMBER";
  iat: number;     // Issued at
  exp: number;     // Expires (7 days from issue)
}
```

---

## Environment Variables

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<32+ byte random string>
```

---

## Error Codes

| Error | Meaning | User Message |
|-------|---------|--------------|
| `CredentialsSignin` | Invalid email/password or locked | "Invalid email or password" |
| `SessionRequired` | Accessing protected route | Redirect to /login |
| `AccessDenied` | Role not authorized | "You don't have permission" |

---

## Type Definitions

Add to `types/next-auth.d.ts`:

```typescript
import { DefaultSession, DefaultUser } from "next-auth";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
```
