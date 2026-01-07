# Streamlined MVP Tech Stack for Docker Home Lab

Here's a simplified, self-hosted version that's easy to set up and maintain:

## **Core Stack (Essential)**
- **Next.js 14+** (App Router) - Framework
- **TypeScript** - Type safety
- **Prisma** - ORM for MSSQL (simplest DB management)
- **MSSQL Server** (Docker container) - Database

## **UI & Styling (Keep It Beautiful)**
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library (perfect for this dashboard style)
- **Lucide React** - Icons

## **Data Visualization**
- **Recharts** - Charts (lightweight, good enough for MVP)

## **Data Tables**
- **TanStack Table** - Tables with sorting/filtering

## **Forms & Validation**
- **React Hook Form** - Forms
- **Zod** - Validation
- **sonner** - Toast notifications

## **Data Fetching**
- **React Query** - Server state (optional but recommended)
- OR just use Next.js Server Components (simpler for MVP)

## **Authentication (Simplified)**
- **NextAuth.js** with simple credentials provider
- OR skip auth entirely for MVP if it's just for you
- OR simple API key middleware

---

## **Docker Setup**

### **docker-compose.yml**
```yaml
version: '3.8'

services:
  # MSSQL Database
  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: cemdash-db
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=YourStrong@Password123
      - MSSQL_PID=Developer
    ports:
      - "1434:1433"
    volumes:
      - mssql-data:/var/opt/mssql
    networks:
      - app-network

  # Next.js Application
  web:
    build: .
    container_name: cemdash-app
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=sqlserver://db:1434;database=cemdash;user=sa;password=YourStrong@Password123;trustServerCertificate=true
      - NODE_ENV=production
    depends_on:
      - db
    networks:
      - app-network
    volumes:
      - ./:/app
      - /app/node_modules
      - /app/.next

volumes:
  mssql-data:

networks:
  app-network:
    driver: bridge
```

---

## **Minimal Package.json**

```json
{
  "name": "cemdash-mvp",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "db:push": "prisma db push",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "next": "^14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@prisma/client": "^5.7.0",
    "@tanstack/react-query": "^5.14.2",
    "@tanstack/react-table": "^8.11.0",
    "recharts": "^2.10.3",
    "react-hook-form": "^7.49.2",
    "zod": "^3.22.4",
    "date-fns": "^3.0.0",
    "lucide-react": "^0.303.0",
    "sonner": "^1.3.1",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.6",
    "@types/react": "^18.2.46",
    "@types/react-dom": "^18.2.18",
    "prisma": "^5.7.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.0.4"
  }
}
```

---

## **Dockerfile**

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

---

## **Project Structure**

```
cemdash-mvp/
├── app/
│   ├── api/              # API routes
│   ├── dashboard/        # Dashboard pages
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/               # shadcn components
│   ├── charts/           # Chart components
│   └── tables/           # Table components
├── lib/
│   ├── db.ts             # Prisma client
│   └── utils.ts          # Utilities
├── prisma/
│   └── schema.prisma     # Database schema
├── docker-compose.yml
├── Dockerfile
├── .dockerignore
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## **Getting Started Commands**

```bash
# 1. Initialize Next.js project
npx create-next-app@latest cemdash-mvp --typescript --tailwind --app

# 2. Install additional dependencies
npm install @prisma/client @tanstack/react-query @tanstack/react-table recharts react-hook-form zod date-fns lucide-react sonner clsx tailwind-merge

# 3. Install dev dependencies
npm install -D prisma

# 4. Initialize Prisma
npx prisma init

# 5. Set up shadcn/ui
npx shadcn-ui@latest init

# 6. Add shadcn components as needed
npx shadcn-ui@latest add button card table

# 7. Start Docker containers
docker-compose up -d

# 8. Push database schema
npx prisma db push

# 9. Open Prisma Studio (optional - DB GUI)
npx prisma studio
```

---


## **Simple .env.local**

```env
DATABASE_URL="sqlserver://localhost:1434;database=cemdash;user=sa;password=YourStrong@Password123;trustServerCertificate=true"
```

---

This stack gives you:
✅ Modern, beautiful UI (shadcn/ui)  
✅ Type-safe database access (Prisma)  
✅ Easy Docker deployment  
✅ Professional charts and tables  
✅ Room to scale later  
✅ Minimal complexity  

Perfect for a home lab MVP that you can evolve over time!