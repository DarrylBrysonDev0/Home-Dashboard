# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set dummy DATABASE_URL for build-time Prisma generation
ENV DATABASE_URL="sqlserver://localhost:1433;database=dummy;user=sa;password=dummy;trustServerCertificate=true"

# Set dummy DB environment variables for build-time (required by Prisma adapter)
ENV DB_HOST="localhost"
ENV DB_PORT="1433"
ENV DB_USER="sa"
ENV DB_PASSWORD="dummy"
ENV DB_NAME="dummy"

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js app
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
