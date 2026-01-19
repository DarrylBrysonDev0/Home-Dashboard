# Research: Landing Page & Navigation Top Bar

**Feature**: 004-landing-navigation  
**Date**: 2026-01-12  
**Status**: Complete

## Research Tasks

Based on Technical Context review, the following items required investigation:

### 1. Mobile Navigation Pattern (shadcn/ui Sheet Component)

**Task**: Determine best approach for mobile slide-out drawer using shadcn/ui

**Finding**: shadcn/ui provides a `Sheet` component built on Radix UI Dialog that is ideal for mobile navigation drawers.

**Decision**: Use shadcn/ui Sheet component for mobile drawer
- **Rationale**: Built-in accessibility (focus trap, Escape key close), animation support, and consistent with existing UI library usage
- **Alternatives considered**: 
  - Custom CSS/JS drawer: Rejected - would require reimplementing accessibility features
  - Headless UI: Rejected - not already in stack, shadcn already provides equivalent

**Implementation**:
```bash
npx shadcn@latest add sheet
```

Sheet provides `side="left"` prop for left-sliding drawer matching spec requirements.

---

### 2. Active Navigation Detection Pattern

**Task**: Determine how to detect current route for nav item active state

**Finding**: Next.js App Router provides `usePathname()` hook from `next/navigation` for client-side route detection.

**Decision**: Use `usePathname()` for active state detection
- **Rationale**: Native Next.js solution, SSR-compatible, updates on navigation
- **Alternatives considered**:
  - Router.pathname: Rejected - Pages Router only, not App Router
  - window.location: Rejected - not SSR-compatible, would require useEffect

**Implementation Pattern**:
```tsx
import { usePathname } from "next/navigation";

function NavItem({ href }: { href: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  // Apply active styles based on isActive
}
```

---

### 3. Responsive Breakpoint Detection

**Task**: Determine approach for showing/hiding mobile vs desktop navigation

**Finding**: Two viable approaches:
1. CSS-only with Tailwind responsive classes (`md:hidden`, `md:flex`)
2. JavaScript hook with `window.matchMedia`

**Decision**: Use CSS-only approach with Tailwind for show/hide, optional JS hook for complex logic
- **Rationale**: CSS-only is simpler, more performant, no hydration issues
- **Alternatives considered**:
  - useMediaQuery hook only: Rejected - causes hydration mismatch if not careful
  - CSS only: Selected for basic show/hide, hook available for future complex logic

**Implementation**:
```tsx
// Desktop nav: hidden on mobile
<nav className="hidden md:flex">...</nav>

// Mobile hamburger: visible only on mobile
<button className="md:hidden">...</button>
```

Optional hook for complex responsive logic (drawer state sync):
```tsx
// lib/hooks/use-media-query.ts
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [query]);
  
  return matches;
}
```

---

### 4. Upcoming Events API Endpoint

**Task**: Determine whether to add new endpoint or extend existing `/api/events`

**Finding**: Existing `/api/events` already supports `start` and `end` query parameters for date filtering. For upcoming events on landing page, we need:
- Next 7 days from current date
- Limit to 3 events
- Sorted by startTime ascending

**Decision**: Add new `/api/events/upcoming` endpoint
- **Rationale**: Specialized endpoint with built-in defaults is cleaner for landing page use case. Avoids client needing to calculate dates.
- **Alternatives considered**:
  - Extend existing endpoint with `limit` param: Viable, but adds complexity to general-purpose endpoint
  - Client-side filtering: Rejected - wastes bandwidth, exposes all events

**Implementation**:
```
GET /api/events/upcoming?limit=3&days=7
Response: { data: Event[] }
```

---

### 5. Theme Toggle Integration

**Task**: Verify existing ThemeToggle component meets navigation requirements

**Finding**: Existing `components/theme/ThemeToggle.tsx` already:
- ✅ Uses `next-themes` for theme switching
- ✅ Shows Sun/Moon icons with animation
- ✅ Hydration-safe with mounted state check
- ✅ Uses shadcn Button with ghost variant
- ⚠️ Missing tooltip (spec requires "Switch to dark/light mode" tooltip)

**Decision**: Reuse existing ThemeToggle, add tooltip wrapper
- **Rationale**: Component already implemented and tested, minor enhancement needed
- **Implementation**: Wrap existing button in Tooltip component from shadcn/ui

---

### 6. User Menu Enhancement

**Task**: Verify existing UserMenu meets spec requirements

**Finding**: Existing `components/auth/user-menu.tsx`:
- ✅ Shows avatar with initials
- ✅ Dropdown with user info, admin link
- ⚠️ Profile link is disabled (spec wants it to navigate to `/settings/profile`)
- ⚠️ Missing dedicated Settings link (only has Admin Panel for admins)
- ✅ Sign out functionality works

**Decision**: Enhance existing UserMenu with Profile and Settings links
- **Rationale**: Minor modifications to existing component
- **Implementation**: Enable Profile link → `/settings/profile`, add Settings link → `/settings`

---

### 7. Avatar Display Logic

**Task**: Confirm initials derivation matches spec (first letter of first + last name)

**Finding**: Current implementation:
```tsx
const initials = user.name
  ?.split(" ")
  .map((n) => n[0])
  .join("")
  .toUpperCase()
  .slice(0, 2) || "?";
```

This takes first letter of each word, limited to 2 chars. For "John Doe" → "JD" ✅

**Decision**: Current implementation matches spec requirements
- **Rationale**: Already handles edge cases (single name, no name)
- **No changes needed**

---

### 8. Route Protection for Landing Page

**Task**: Determine if middleware changes needed for landing page

**Finding**: Current middleware.ts matcher:
```ts
matcher: [
  "/dashboard/:path*",
  "/calendar/:path*",
  "/admin/:path*",
  // ... API routes
]
```

Home page `/` is NOT protected (redirects to /dashboard which IS protected).

**Decision**: Update middleware to protect root `/` route when it becomes landing page
- **Rationale**: Spec requires landing page only for authenticated users
- **Implementation**: Add `/` to middleware matcher

---

### 9. Loading State During Navigation

**Task**: Determine approach for showing loading indicator on clicked nav item (FR-020)

**Finding**: Next.js App Router provides:
- `useTransition` for pending state
- `loading.tsx` files for route-level loading
- Manual state management with router events

**Decision**: Use navigation state with visual feedback on clicked item
- **Rationale**: Provides immediate feedback without full-page loading state
- **Implementation**:
  ```tsx
  // Track which item was clicked, show spinner until navigation completes
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const router = useRouter();
  
  const handleClick = (href: string) => {
    setPendingHref(href);
    router.push(href);
  };
  
  // Reset pending state when pathname changes
  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);
  ```

---

## Summary

All research tasks completed. No NEEDS CLARIFICATION items remain.

| Topic | Decision | Ready |
|-------|----------|-------|
| Mobile drawer | shadcn Sheet component | ✅ |
| Active nav detection | usePathname() hook | ✅ |
| Responsive breakpoint | CSS Tailwind classes | ✅ |
| Upcoming events API | New /api/events/upcoming | ✅ |
| Theme toggle | Reuse existing + tooltip | ✅ |
| User menu | Enhance existing | ✅ |
| Avatar logic | Current impl correct | ✅ |
| Route protection | Add / to middleware | ✅ |
| Nav loading state | pendingHref state pattern | ✅ |

## Dependencies to Install

```bash
npx shadcn@latest add sheet tooltip
```

(Sheet for mobile drawer, Tooltip for theme toggle hint)
