# Quickstart: Landing Page & Navigation Top Bar

**Feature**: 004-landing-navigation  
**Branch**: `004-landing-navigation`

## Prerequisites

1. **Development environment running**:
   ```bash
   docker compose up -d   # Database
   npm run dev            # Next.js dev server
   ```

2. **Authenticated user exists** (seed data or manual creation)

3. **Calendar events exist** for testing upcoming events display

## Setup Steps

### 1. Install New Dependencies

```bash
# Add shadcn components for mobile drawer and tooltips
npx shadcn@latest add sheet tooltip
```

### 2. Update Middleware

Add root path to protected routes in `middleware.ts`:

```typescript
export const config = {
  matcher: [
    "/",  // Add this line - protect landing page
    "/dashboard/:path*",
    // ... rest of existing routes
  ],
};
```

### 3. Create Navigation Components

Create new directory and files:

```bash
mkdir -p components/navigation
mkdir -p components/home
```

Files to create (in order):
1. `components/navigation/logo.tsx`
2. `components/navigation/nav-item.tsx`
3. `components/navigation/nav-items.tsx`
4. `components/navigation/mobile-drawer.tsx`
5. `components/navigation/nav-bar.tsx`

### 4. Create Landing Page Components

Files to create:
1. `components/home/event-card-mini.tsx`
2. `components/home/upcoming-events.tsx`
3. `components/home/app-card.tsx`
4. `components/home/app-selection-panel.tsx`
5. `components/home/hero-section.tsx`

### 5. Create Utility Hook

Create `lib/hooks/use-media-query.ts` for responsive behavior.

### 6. Add API Endpoint

Create `app/api/events/upcoming/route.ts` for upcoming events fetch.

Add query function to `lib/queries/events.ts`.

### 7. Update Root Layout

Modify `app/layout.tsx` to use new NavBar component instead of current header.

### 8. Update Landing Page

Replace redirect in `app/page.tsx` with actual landing page content.

## Development Workflow (TDD)

### Running Tests

```bash
# Unit tests (watch mode)
npm run test:unit -- --watch

# E2E tests
npm run test:e2e

# Specific test file
npm run test:unit -- __tests__/unit/components/navigation/nav-bar.test.tsx
```

### Test File Locations

| Component | Test File |
|-----------|-----------|
| NavBar | `__tests__/unit/components/navigation/nav-bar.test.tsx` |
| NavItem | `__tests__/unit/components/navigation/nav-item.test.tsx` |
| MobileDrawer | `__tests__/unit/components/navigation/mobile-drawer.test.tsx` |
| EventCardMini | `__tests__/unit/components/home/event-card-mini.test.tsx` |
| UpcomingEvents | `__tests__/unit/components/home/upcoming-events.test.tsx` |
| AppCard | `__tests__/unit/components/home/app-card.test.tsx` |
| Navigation E2E | `__tests__/e2e/navigation.spec.ts` |
| Landing E2E | `__tests__/e2e/landing.spec.ts` |

### Red-Green-Refactor Cycle

1. **RED**: Write failing test
   ```bash
   npm run test:unit -- nav-bar --watch
   ```

2. **GREEN**: Implement minimum code to pass

3. **REFACTOR**: Improve code quality, keep tests green

4. **Commit**: Both test and implementation together

## Key Implementation Notes

### Active Nav Detection

```tsx
import { usePathname } from "next/navigation";

const pathname = usePathname();
const isActive = pathname === href || pathname.startsWith(`${href}/`);
```

### Mobile Breakpoint

Use Tailwind responsive classes:
```tsx
<nav className="hidden md:flex">  {/* Desktop only */}
<button className="md:hidden">    {/* Mobile only */}
```

### Theme Toggle Tooltip

Wrap existing ThemeToggle with Tooltip:
```tsx
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

<Tooltip>
  <TooltipTrigger asChild>
    <ThemeToggle />
  </TooltipTrigger>
  <TooltipContent>
    Switch to {isDark ? "light" : "dark"} mode
  </TooltipContent>
</Tooltip>
```

### User Avatar Initials

Already implemented in UserMenu - first letter of first + last name:
```tsx
const initials = user.name
  ?.split(" ")
  .map((n) => n[0])
  .join("")
  .toUpperCase()
  .slice(0, 2) || "?";
```

## Verification Checklist

- [ ] All routes protected (landing page requires auth)
- [ ] NavBar visible on all authenticated pages
- [ ] Active nav item highlighted correctly
- [ ] Theme toggle works with tooltip
- [ ] User menu dropdown functional
- [ ] Mobile drawer opens/closes properly
- [ ] Landing page shows personalized greeting
- [ ] Upcoming events display (or empty state)
- [ ] App cards navigate to correct routes
- [ ] 80%+ test coverage for new code

## Common Issues

### "Sheet component not found"

Run: `npx shadcn@latest add sheet`

### "Hydration mismatch on theme toggle"

Ensure `mounted` state check before rendering icons (already in existing ThemeToggle).

### "Upcoming events not loading"

1. Check `/api/events/upcoming` endpoint exists
2. Verify middleware allows the route
3. Ensure events exist with future `startTime`

### "Avatar not showing"

Check session user has `name` field. Falls back to "?" if no name.

## Related Documentation

- [Feature Spec](./spec.md)
- [Research Notes](./research.md)
- [Data Model](./data-model.md)
- [API Contract](./contracts/upcoming-events-api.md)
