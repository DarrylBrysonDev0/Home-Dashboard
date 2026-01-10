# Quickstart: Shared Event Calendar

**Feature**: 002-shared-event-calendar  
**Prerequisites**: Docker, Node.js 18+, existing Home-Dashboard setup

---

## 1. Install Dependencies

```bash
# Auth dependencies
npm install next-auth bcryptjs
npm install -D @types/bcryptjs

# Calendar UI dependencies
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction

# Email & timezone dependencies
npm install nodemailer ics luxon
npm install -D @types/nodemailer @types/luxon
```

---

## 2. Environment Variables

Add to `.env.local`:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<run: openssl rand -base64 32>

# Email (Gmail SMTP)
SMTP_USER=your-email@gmail.com
SMTP_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

# Database (already configured)
DATABASE_URL="sqlserver://localhost:1434;database=HomeFinance-db;user=sa;password=YourStrong@Password123;trustServerCertificate=true"
```

### Gmail App Password Setup

1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Select "Mail" and generate
4. Copy the 16-character password to `SMTP_APP_PASSWORD`

---

## 3. Database Migration

Add new models to `prisma/schema.prisma` (see [data-model.md](./data-model.md)), then:

```bash
# Generate migration
npx prisma migrate dev --name add_calendar_models

# Regenerate Prisma client
npx prisma generate
```

---

## 4. Seed Initial Data

Create or update `prisma/seed.ts`:

```typescript
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const passwordHash = await bcrypt.hash('Admin123!', 12);
  
  await prisma.user.upsert({
    where: { email: 'admin@home.local' },
    update: {},
    create: {
      email: 'admin@home.local',
      name: 'Admin',
      passwordHash,
      role: UserRole.ADMIN,
      avatarColor: '#F97316',
    },
  });

  // Create default categories
  const categories = [
    { name: 'Family', color: '#F97316', icon: 'home' },
    { name: 'Work', color: '#3B82F6', icon: 'briefcase' },
    { name: 'Medical', color: '#EF4444', icon: 'heart' },
    { name: 'Social', color: '#8B5CF6', icon: 'users' },
    { name: 'Finance', color: '#10B981', icon: 'dollar-sign' },
    { name: 'Other', color: '#6B7280', icon: 'calendar' },
  ];

  for (const cat of categories) {
    await prisma.eventCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  console.log('Seed completed: admin user + 6 categories');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run the seed:

```bash
npx ts-node prisma/seed.ts
```

---

## 5. NextAuth Setup

Create `lib/auth.ts`:

```typescript
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) throw new Error("Invalid email or password");

        // Check lockout
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error("Account locked. Try again later.");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          // Increment failed attempts
          const newAttempts = user.failedLoginAttempts + 1;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: newAttempts,
              lockedUntil: newAttempts >= 5
                ? new Date(Date.now() + 15 * 60 * 1000)
                : null,
            },
          });
          throw new Error("Invalid email or password");
        }

        // Reset on success
        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockedUntil: null },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      return session;
    },
  },
};
```

Create route handler `app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

---

## 6. TypeScript Types

Create `types/next-auth.d.ts`:

```typescript
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
    };
  }
  interface User {
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

---

## 7. Middleware Setup

Create `middleware.ts` at project root:

```typescript
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
    if (isAdminRoute && req.nextauth.token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/calendar", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/calendar/:path*", "/admin/:path*", "/api/events/:path*", "/api/users/:path*"],
};
```

---

## 8. Directory Structure

Create the following directories:

```bash
mkdir -p app/login
mkdir -p app/calendar
mkdir -p app/admin/users
mkdir -p app/admin/categories
mkdir -p app/api/events/\[id\]/send-invite
mkdir -p app/api/categories
mkdir -p app/api/users
mkdir -p components/calendar
mkdir -p components/auth
mkdir -p components/admin
mkdir -p lib/validations
```

---

## 9. Start Development

```bash
# Start database (if not running)
docker compose up -d

# Start dev server
npm run dev
```

---

## 10. Test Login

1. Navigate to http://localhost:3000/login
2. Login with:
   - Email: `admin@home.local`
   - Password: `Admin123!`
3. Should redirect to /calendar

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `lib/auth.ts` | NextAuth configuration |
| `lib/email.ts` | Nodemailer + ICS service |
| `middleware.ts` | Route protection |
| `types/next-auth.d.ts` | Session type extensions |
| `app/api/auth/[...nextauth]/route.ts` | Auth handler |
| `app/api/events/route.ts` | Events CRUD |
| `app/calendar/page.tsx` | Calendar page |
| `components/calendar/calendar-view.tsx` | FullCalendar component |

---

## Troubleshooting

### "Module not found" after Prisma changes

```bash
npx prisma generate
```

### FullCalendar CSS not loading

Import in `app/calendar/page.tsx`:

```typescript
import '@fullcalendar/common/main.css';
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/timegrid/main.css';
```

### Email not sending

1. Check App Password is correct (16 chars, no spaces)
2. Check SMTP_USER matches the Google account
3. Check Gmail "Less secure apps" isn't blocking (use App Password)

### Session not persisting

1. Verify `NEXTAUTH_SECRET` is set
2. Check `NEXTAUTH_URL` matches your dev URL
3. Clear browser cookies and retry
