---
name: Bug Report - SMTP Environment Variables Not Displayed in Admin Settings
about: Admin settings page shows placeholder values instead of actual SMTP environment variables
title: '[BUG] Admin Settings Page - SMTP env vars not rendered dynamically in production'
labels: bug, priority-high, docker, nextjs
assignees: ''
---

## Bug Description

The Admin Settings page (`/admin/settings`) displays hardcoded placeholder values for SMTP environment variables instead of reading the actual values from the container environment at runtime. This occurs only in production Docker builds using Next.js standalone output mode.

## Environment

- **Next.js Version**: 16.1.1 (Turbopack)
- **Node Version**: 20-alpine (Docker)
- **Deployment**: Docker Compose with standalone output
- **Docker Image**: `home-dashboard-web`
- **Build Mode**: Production (`npm run build`)
- **Output Mode**: `standalone` (configured in `next.config.ts`)

## Expected Behavior

The admin settings page should display the actual SMTP configuration values from environment variables:
- **SMTP_USER**: `dbrys2115@gmail.com` (from `process.env.SMTP_USER`)
- **SMTP_FROM**: `dbrys2115@gmail.com` (from `process.env.SMTP_FROM`)

## Actual Behavior

The page displays placeholder/default values that appear to be baked in at build time:
- **SMTP_USER**: `your-email@gmail.com` (incorrect)
- **SMTP_FROM**: `Home Calendar <calendar@home.local>` (incorrect)

Note: `SMTP_HOST` and `SMTP_PORT` display correctly as `smtp.gmail.com` and `587`.

## Steps to Reproduce

1. Set SMTP environment variables in `.env` file:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=dbrys2115@gmail.com
   SMTP_PASSWORD=bitm cvzp acfx lhsh
   SMTP_FROM=dbrys2115@gmail.com
   ```

2. Configure `docker-compose.yml` to pass env vars to container:
   ```yaml
   web:
     environment:
       - SMTP_HOST=${SMTP_HOST}
       - SMTP_PORT=${SMTP_PORT}
       - SMTP_USER=${SMTP_USER}
       - SMTP_PASSWORD=${SMTP_PASSWORD}
       - SMTP_FROM=${SMTP_FROM}
   ```

3. Build and start Docker containers:
   ```bash
   docker compose up -d --build
   ```

4. Login as admin and navigate to http://localhost:3000/admin/settings

5. Observe that SMTP_USER and SMTP_FROM show placeholder values instead of actual values

## Code Analysis

### Affected Files

**`app/admin/settings/page.tsx`** (Server Component):
```typescript
export const dynamic = 'force-dynamic'; // Directive not being respected

export default function SMTPSettingsPage() {
  const smtpConfig = {
    host: process.env.SMTP_HOST || "",
    port: process.env.SMTP_PORT || "",
    user: process.env.SMTP_USER || "",
    from: process.env.SMTP_FROM || "",
    hasPassword: !!process.env.SMTP_PASSWORD,
  };

  console.log('[SMTP Settings] Config Object:', smtpConfig);  // Never executes at runtime
  
  return <SMTPSettingsClient config={smtpConfig} />;
}
```

**`app/admin/settings/settings-client.tsx`** (Client Component):
```typescript
export default function SMTPSettingsClient({ config }: SMTPSettingsClientProps) {
  // Receives config prop from server component
  return (
    <ConfigItem
      label="SMTP_USER"
      configured={!!config.user}
      value={config.user}  // Shows placeholder value
    />
  );
}
```

### Root Cause

Next.js 16.1.1 with `output: 'standalone'` in production mode is **statically rendering** the admin settings page at Docker build time, despite the `export const dynamic = 'force-dynamic'` directive. This causes:

1. Environment variables to be read during `docker build` (when they may not be set or have placeholder values)
2. The rendered HTML/RSC payload to be cached with these build-time values
3. Runtime environment variables to be ignored when serving requests

## Evidence

### 1. Environment Variables Present in Container
```bash
$ docker exec cemdash-web printenv | grep SMTP
SMTP_HOST=smtp.gmail.com
SMTP_USER=dbrys2115@gmail.com
SMTP_FROM=dbrys2115@gmail.com
SMTP_PASSWORD=bitm cvzp acfx lhsh
SMTP_PORT=587
```
✅ Variables are correctly set in the container environment

### 2. Console Logs Never Execute
```bash
$ docker logs cemdash-web 2>&1 | grep "\[SMTP Settings\]"
(no output)
```
❌ Server component console.log never executes, confirming static rendering

### 3. Browser HTML Contains Placeholder Values
Using browser DevTools to inspect the rendered DOM:
```javascript
// SMTP_USER row
{
  "label": "SMTP_USER",
  "allText": "SMTP_USERSMTP authentication usernameyour-email@gmail.com",
  "valueSpanText": "your-email@gmail.com"
}

// SMTP_FROM row
{
  "label": "SMTP_FROM",
  "allText": "SMTP_FROMDefault sender email addressHome Calendar <calendar@home.local>",
  "valueSpanText": "Home Calendar <calendar@home.local>"
}
```
❌ Placeholder values are embedded in the HTML served to the browser

### 4. Other Variables Work Correctly
```javascript
{
  "label": "SMTP_HOST",
  "valueSpanText": "smtp.gmail.com"  // ✅ Correct
},
{
  "label": "SMTP_PORT",
  "valueSpanText": "587"  // ✅ Correct
}
```

## Investigation Notes

### Attempted Fixes (Unsuccessful)

1. ✅ **Added `export const dynamic = 'force-dynamic'`** to server component
   - Should prevent static optimization
   - Not respected in standalone build

2. ✅ **Added console.log statements** to verify runtime execution
   - Logs never appear, confirming page is pre-rendered

3. ✅ **Rebuilt with `--no-cache`** to clear any build cache
   - Issue persists across clean builds

4. ✅ **Verified environment variables** exist in container
   - Variables confirmed present via `docker exec`

### Why Some Variables Work

SMTP_HOST and SMTP_PORT likely display correctly because:
- They may have the same values at build time and runtime
- OR they might be getting special treatment due to string literal optimizations
- OR there's a caching inconsistency in Next.js RSC payload generation

## Potential Solutions

### Option 1: Use API Route for Config Fetching (Recommended)
Create `/api/admin/smtp-config` endpoint that reads env vars at request time:

```typescript
// app/api/admin/smtp-config/route.ts
export async function GET() {
  return NextResponse.json({
    host: process.env.SMTP_HOST || "",
    port: process.env.SMTP_PORT || "",
    user: process.env.SMTP_USER || "",
    from: process.env.SMTP_FROM || "",
    hasPassword: !!process.env.SMTP_PASSWORD,
  });
}
```

Then fetch from client component via SWR or useEffect.

### Option 2: Use Route Segment Config
Try different dynamic rendering configurations:
```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
```

### Option 3: Use Middleware to Inject Values
Use Next.js middleware to read env vars and pass via headers/cookies.

### Option 4: Use NEXT_PUBLIC_ Prefix (Not Recommended for Secrets)
Expose vars with `NEXT_PUBLIC_` prefix (but this exposes them client-side).

### Option 5: Switch from Standalone Output
Remove `output: 'standalone'` from `next.config.ts` and use standard Node server.

## Impact

- **Severity**: High
- **User Impact**: Admin cannot verify SMTP configuration is correct
- **Security Impact**: Low (credentials not exposed, but misleading UI)
- **Functionality Impact**: Test email functionality works (uses runtime env vars), but UI shows wrong values

## Additional Context

- Related Next.js issue: [next.js#48022](https://github.com/vercel/next.js/issues/48022)
- Standalone output documentation: https://nextjs.org/docs/app/api-reference/next-config-js/output
- Dynamic rendering: https://nextjs.org/docs/app/building-your-application/rendering/server-components#dynamic-rendering

## Reproduction Repository

Branch: `main`
Commit: Latest
Path: `app/admin/settings/`

## Logs

<details>
<summary>Docker Compose Environment Pass-through</summary>

```yaml
# docker-compose.yml
web:
  environment:
    - SMTP_HOST=${SMTP_HOST}
    - SMTP_PORT=${SMTP_PORT}
    - SMTP_USER=${SMTP_USER}
    - SMTP_PASSWORD=${SMTP_PASSWORD}
    - SMTP_FROM=${SMTP_FROM}
```
</details>

<details>
<summary>Next.js Config</summary>

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',  // May be causing the issue
};
```
</details>

<details>
<summary>Dockerfile Build Stage</summary>

```dockerfile
# Dockerfile (excerpt)
RUN npm run build
# Environment variables are read here at build time
# Not available later at runtime for static pages
```
</details>

---

**Priority**: High - Affects admin functionality and configuration visibility
**Estimated Effort**: 2-4 hours (implement API route solution)
**Requires Testing**: Yes - verify dynamic rendering in Docker production build
