# Cemdash Feature Specification: Landing Page & Navigation Top Bar

**Version:** 1.0  
**Date:** January 2026  
**Status:** Draft  
**Author:** Generated for Mr. Bryson

---

## Table of Contents

1. [Overview](#overview)
2. [Goals & Principles](#goals--principles)
3. [User Authentication Flow](#user-authentication-flow)
4. [Navigation Top Bar](#navigation-top-bar)
5. [Landing Page (Home)](#landing-page-home)
6. [Mobile Responsive Behavior](#mobile-responsive-behavior)
7. [Component Architecture](#component-architecture)
8. [Theme Integration](#theme-integration)
9. [File Structure](#file-structure)
10. [Implementation Phases](#implementation-phases)
11. [Future Considerations](#future-considerations)

---

## Overview

This specification defines the landing page and persistent navigation top bar for Cemdash, a comprehensive home finance dashboard. The landing page serves as the authenticated user's home base, providing quick access to all application modules through an intuitive app selection panel. The navigation bar persists across all pages, offering consistent wayfinding and user controls.

### Scope

| In Scope | Out of Scope |
|----------|--------------|
| Persistent top navigation bar | Household member switching |
| App selection panel (landing page) | Global search functionality |
| User avatar dropdown menu | Notification system |
| Dark/light theme toggle | Quick action buttons |
| Mobile hamburger menu & drawer | Public marketing page |
| Authentication redirect logic | Logo design/generation |
| Upcoming events hero section | Full calendar integration |

---

## Goals & Principles

### Primary Goals

1. **Intuitive Navigation** — Users should immediately understand where they are and how to navigate to any section of the application
2. **Visual Hierarchy** — The landing page should surface the most relevant information (upcoming events) while providing clear pathways to all modules
3. **Consistent Experience** — Navigation behavior should be predictable across desktop and mobile viewports
4. **Theme Coherence** — All components must integrate seamlessly with the existing Cemdash neon theme system

### Design Principles

- **MVP First** — Implement essential functionality without overengineering; defer advanced features to future iterations
- **Performance Oriented** — Leverage CSS custom properties for theme switching without React re-renders
- **Accessibility** — Ensure keyboard navigation, ARIA labels, and sufficient color contrast
- **Maintainability** — Clear component boundaries and documented interfaces for solo developer maintenance

---

## User Authentication Flow

All pages within Cemdash require authentication. The navigation and landing page components assume an authenticated user context.

### Route Protection

```
┌─────────────────────────────────────────────────────────────┐
│                     User Requests Page                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   Is Authenticated?   │
              └───────────┬───────────┘
                          │
            ┌─────────────┴─────────────┐
            │                           │
            ▼                           ▼
    ┌───────────────┐          ┌───────────────┐
    │      Yes      │          │      No       │
    └───────┬───────┘          └───────┬───────┘
            │                           │
            ▼                           ▼
    ┌───────────────┐          ┌───────────────┐
    │ Render Page   │          │ Redirect to   │
    │ with NavBar   │          │ /auth/login   │
    └───────────────┘          └───────────────┘
```

### Authentication Integration

| Aspect | Implementation |
|--------|----------------|
| Provider | NextAuth.js |
| Session Storage | JWT or Database sessions (configurable) |
| Protected Routes | Next.js middleware at `middleware.ts` |
| Auth Pages | `/auth/login`, `/auth/register` (excluded from nav layout) |

### Middleware Configuration

```typescript
// middleware.ts
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (NextAuth routes)
     * - auth (login/register pages)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, public assets
     */
    '/((?!api/auth|auth|_next/static|_next/image|favicon.ico|.*\\..*).*)' 
  ]
}
```

---

## Navigation Top Bar

The navigation top bar is a persistent component rendered on all authenticated pages, providing primary navigation, user controls, and theme management.

### Visual Specification

```
┌────────────────────────────────────────────────────────────────────────────┐
│  [Logo]   Home    Finance    Calendar    Settings    [🌙]    [Avatar ▼]   │
└────────────────────────────────────────────────────────────────────────────┘
     │        │        │          │           │          │          │
     │        │        │          │           │          │          └─► User Dropdown
     │        │        │          │           │          └─► Theme Toggle
     │        │        │          │           └─► Nav Item
     │        │        │          └─► Nav Item
     │        │        └─► Nav Item
     │        └─► Nav Item (Active state when on landing)
     └─► Logo Placeholder (links to Home)
```

### Dimensions & Spacing

| Property | Value | Notes |
|----------|-------|-------|
| Height | 64px | Fixed height, consistent across viewports |
| Horizontal Padding | 24px | Desktop; reduces to 16px on mobile |
| Logo Area Width | 140px | Accommodates future logo asset |
| Nav Item Gap | 8px | Spacing between navigation items |
| Border Bottom | 1px | Uses theme border color with subtle glow |

### Navigation Items

| Label | Route | Icon | Description |
|-------|-------|------|-------------|
| Home | `/` | `Home` (Lucide) | Landing page with app selection panel |
| Finance | `/finance` | `Wallet` (Lucide) | Financial dashboard, transactions, accounts |
| Calendar | `/calendar` | `Calendar` (Lucide) | Event management and scheduling |
| Settings | `/settings` | `Settings` (Lucide) | User preferences and configuration |

### Nav Item States

| State | Visual Treatment |
|-------|------------------|
| Default | Text in `--foreground-muted`, icon at 80% opacity |
| Hover | Text brightens to `--foreground`, icon at 100%, subtle glow effect |
| Active | Text in `--primary`, icon in `--primary`, underline indicator with glow |
| Focus | Visible focus ring using `--ring` color |

### Theme Toggle Button

| Aspect | Specification |
|--------|---------------|
| Position | Right section, before user avatar |
| Icon (Light Mode) | `Moon` (Lucide) — indicates click will switch to dark |
| Icon (Dark Mode) | `Sun` (Lucide) — indicates click will switch to light |
| Animation | 200ms rotation transition on toggle |
| Tooltip | "Switch to dark/light mode" |

### User Avatar Dropdown

```
┌─────────────────────┐
│  [Avatar] Name ▼    │ ◄── Trigger Button
└─────────────────────┘
          │
          ▼
┌─────────────────────┐
│  👤  Profile        │
├─────────────────────┤
│  ⚙️  Settings       │
├─────────────────────┤
│  🚪  Sign Out       │
└─────────────────────┘
```

| Dropdown Item | Action |
|---------------|--------|
| Profile | Navigate to `/settings/profile` |
| Settings | Navigate to `/settings` |
| Sign Out | Trigger NextAuth `signOut()` |

### Avatar Display Logic

| Condition | Display |
|-----------|---------|
| User has profile image | Show image in circular avatar |
| No profile image | Show initials derived from user name |
| No name available | Show default user icon |

---

## Landing Page (Home)

The landing page serves as the authenticated user's home base, featuring a hero section with upcoming events and an app selection panel for quick navigation.

### Layout Structure

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           Navigation Top Bar                                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│    ┌────────────────────────────────────────────────────────────────┐     │
│    │                                                                │     │
│    │                     HERO: Upcoming Events                      │     │
│    │                                                                │     │
│    │    "Welcome back, [Name]"                                      │     │
│    │                                                                │     │
│    │    ┌──────────────────────────────────────────────────────┐   │     │
│    │    │  📅 Event 1          📅 Event 2          📅 Event 3  │   │     │
│    │    │  Today, 3:00 PM      Tomorrow, 10 AM     Wed, 2 PM   │   │     │
│    │    └──────────────────────────────────────────────────────┘   │     │
│    │                                                                │     │
│    └────────────────────────────────────────────────────────────────┘     │
│                                                                            │
│    ┌────────────────────────────────────────────────────────────────┐     │
│    │                                                                │     │
│    │                     APP SELECTION PANEL                        │     │
│    │                                                                │     │
│    │    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │     │
│    │    │             │    │             │    │             │      │     │
│    │    │   🏠 Home   │    │  💰 Finance │    │ 📅 Calendar │      │     │
│    │    │             │    │             │    │             │      │     │
│    │    └─────────────┘    └─────────────┘    └─────────────┘      │     │
│    │                                                                │     │
│    │                       ┌─────────────┐                          │     │
│    │                       │             │                          │     │
│    │                       │  ⚙️ Settings│                          │     │
│    │                       │             │                          │     │
│    │                       └─────────────┘                          │     │
│    │                                                                │     │
│    └────────────────────────────────────────────────────────────────┘     │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Hero Section: Upcoming Events

The hero section welcomes the user and displays the next 3 upcoming calendar events.

#### Content Specification

| Element | Specification |
|---------|---------------|
| Greeting | "Welcome back, [First Name]" |
| Subheading | "Here's what's coming up" (if events exist) or "No upcoming events" |
| Event Display | Horizontal scroll on mobile, grid on desktop |
| Max Events Shown | 3 |
| Event Timeframe | Next 7 days |
| Empty State | Friendly message with link to create event in Calendar |

#### Event Card (Mini)

```
┌────────────────────────────────┐
│  📅  Event Title               │
│      Today, 3:00 PM            │
│      📍 Location (if exists)   │
└────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Width | 200px (fixed) or flex in grid |
| Padding | 16px |
| Border Radius | 12px |
| Background | `--card` with subtle transparency |
| Border | 1px `--border` |
| Hover | Elevate shadow, subtle glow |
| Click Action | Navigate to `/calendar?event={id}` |

### App Selection Panel

The app selection panel displays navigable modules as cards with icons, providing an alternative to the top navigation.

#### Card Grid Layout

| Viewport | Columns | Gap |
|----------|---------|-----|
| Desktop (≥1024px) | 4 | 24px |
| Tablet (768px–1023px) | 2 | 20px |
| Mobile (<768px) | 2 | 16px |

#### App Card Specification

```
┌─────────────────────────────────┐
│                                 │
│            [Icon]               │
│                                 │
│           App Name              │
│                                 │
│      Brief description          │
│                                 │
└─────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Min Width | 160px |
| Min Height | 180px |
| Padding | 24px |
| Border Radius | 16px |
| Background | `--card` |
| Border | 1px `--border` |
| Box Shadow | `0 4px 20px rgba(0, 0, 0, 0.1)` — elevated overlay effect |
| Icon Size | 48px |
| Icon Color | Matches nav item, uses module-specific accent on hover |

#### App Card Content

| App | Icon | Description |
|-----|------|-------------|
| Home | `Home` | Your dashboard overview |
| Finance | `Wallet` | Track spending & accounts |
| Calendar | `Calendar` | Events & scheduling |
| Settings | `Settings` | Preferences & profile |

#### Card Interaction States

| State | Visual Treatment |
|-------|------------------|
| Default | Subtle shadow, card background |
| Hover | Increased shadow depth, icon glow in `--primary`, slight scale (1.02) |
| Active/Pressed | Scale down (0.98), shadow reduces |
| Focus | Visible focus ring |
| Current Page | Highlighted border in `--primary`, "You are here" indicator |

---

## Mobile Responsive Behavior

On viewports below 768px, the navigation transforms to accommodate touch interfaces and limited screen real estate.

### Mobile Navigation Bar

```
┌────────────────────────────────────────────────────────────────────────────┐
│  [☰]     [Logo]                                        [🌙]    [Avatar]   │
└────────────────────────────────────────────────────────────────────────────┘
    │
    └─► Opens slide-out drawer
```

| Element | Behavior |
|---------|----------|
| Hamburger Icon | Left-aligned, triggers drawer |
| Logo | Centered |
| Theme Toggle | Right section |
| Avatar | Right section, dropdown on tap |

### Slide-Out Drawer

```
┌──────────────────────────┐
│  [✕]      Cemdash        │ ◄── Header with close button
├──────────────────────────┤
│                          │
│    🏠  Home              │
│                          │
│    💰  Finance           │
│                          │
│    📅  Calendar          │
│                          │
│    ⚙️  Settings          │
│                          │
├──────────────────────────┤
│    👤  [User Name]       │ ◄── User section
│        user@email.com    │
├──────────────────────────┤
│    🚪  Sign Out          │
└──────────────────────────┘
```

#### Drawer Specifications

| Property | Value |
|----------|-------|
| Width | 280px |
| Position | Fixed, left: 0, top: 0 |
| Height | 100vh |
| Background | `--background` |
| Border Right | 1px `--border` |
| Z-Index | 50 |
| Animation | Slide from left, 200ms ease-out |
| Overlay | Semi-transparent backdrop, closes drawer on tap |

#### Drawer Navigation Item

| Property | Value |
|----------|-------|
| Height | 48px |
| Padding | 16px horizontal |
| Icon Size | 24px |
| Gap (icon to label) | 12px |
| Active State | Background highlight, primary color indicator |

### Mobile Landing Page Adjustments

| Section | Mobile Adaptation |
|---------|-------------------|
| Hero Greeting | Reduced font size, left-aligned |
| Upcoming Events | Horizontal scroll with snap points |
| App Cards | 2-column grid, reduced padding |
| Card Descriptions | Hidden on mobile, icon + name only |

---

## Component Architecture

### Component Hierarchy

```
app/
├── layout.tsx                    # Root layout
│   └── AuthProvider              # NextAuth session provider
│       └── ThemeProvider         # Theme context provider
│           └── children
│
├── (auth)/                       # Auth route group (no nav)
│   ├── login/page.tsx
│   └── register/page.tsx
│
└── (dashboard)/                  # Protected route group
    ├── layout.tsx                # Dashboard layout with NavBar
    │   └── NavBar                # Persistent navigation
    │       ├── Logo
    │       ├── NavItems
    │       ├── ThemeToggle
    │       └── UserMenu
    │           └── UserDropdown
    │
    ├── page.tsx                  # Landing page (Home)
    │   ├── HeroSection
    │   │   ├── Greeting
    │   │   └── UpcomingEvents
    │   │       └── EventCardMini[]
    │   └── AppSelectionPanel
    │       └── AppCard[]
    │
    ├── finance/
    ├── calendar/
    └── settings/
```

### Component Interfaces

#### NavBar Props

```typescript
interface NavBarProps {
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
}
```

#### NavItem Props

```typescript
interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
}
```

#### AppCard Props

```typescript
interface AppCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  isCurrentPage?: boolean;
}
```

#### EventCardMini Props

```typescript
interface EventCardMiniProps {
  event: {
    id: string;
    title: string;
    startTime: Date;
    location?: string | null;
  };
}
```

#### UpcomingEvents Props

```typescript
interface UpcomingEventsProps {
  events: Array<{
    id: string;
    title: string;
    startTime: Date;
    location?: string | null;
  }>;
  maxEvents?: number; // Default: 3
}
```

### Shared Components to Create

| Component | Location | Purpose |
|-----------|----------|---------|
| `NavBar` | `components/navigation/nav-bar.tsx` | Main navigation component |
| `NavItem` | `components/navigation/nav-item.tsx` | Individual nav link |
| `MobileDrawer` | `components/navigation/mobile-drawer.tsx` | Slide-out navigation |
| `ThemeToggle` | `components/navigation/theme-toggle.tsx` | Dark/light mode switch |
| `UserMenu` | `components/navigation/user-menu.tsx` | Avatar + dropdown |
| `Logo` | `components/navigation/logo.tsx` | Logo placeholder |
| `AppCard` | `components/home/app-card.tsx` | App selection card |
| `AppSelectionPanel` | `components/home/app-selection-panel.tsx` | Card grid container |
| `EventCardMini` | `components/home/event-card-mini.tsx` | Compact event display |
| `UpcomingEvents` | `components/home/upcoming-events.tsx` | Events container |
| `HeroSection` | `components/home/hero-section.tsx` | Welcome + events |

---

## Theme Integration

All components must integrate with the existing Cemdash theme system using CSS custom properties.

### Required CSS Variables

Ensure these variables are available in the theme configuration:

```css
:root {
  /* Navigation specific */
  --nav-height: 64px;
  --nav-background: var(--background);
  --nav-border: var(--border);
  
  /* Card elevations */
  --card-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  --card-shadow-hover: 0 8px 30px rgba(0, 0, 0, 0.15);
  
  /* Glow effects (neon theme) */
  --glow-primary: 0 0 20px var(--primary);
  --glow-subtle: 0 0 10px rgba(var(--primary-rgb), 0.3);
}

.dark {
  --card-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  --card-shadow-hover: 0 8px 30px rgba(0, 0, 0, 0.4);
}
```

### Theme Toggle Implementation

```typescript
// hooks/use-theme.ts (extend existing)
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('cemdash-theme', newTheme);
  }, [theme]);
  
  return { theme, toggleTheme };
}
```

### Neon Glow Effects

Apply the signature Cemdash neon aesthetic to interactive elements:

| Element | Glow Application |
|---------|------------------|
| Active Nav Item | Underline with `--glow-primary` |
| App Card Hover | Border glow using `--glow-subtle` |
| Theme Toggle | Icon glow on hover |
| User Avatar | Ring glow on focus/hover |

---

## File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx              # NavBar wrapper
│   │   ├── page.tsx                # Landing page
│   │   ├── finance/
│   │   │   └── page.tsx
│   │   ├── calendar/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       └── profile/
│   │           └── page.tsx
│   │
│   ├── layout.tsx                  # Root layout
│   └── globals.css
│
├── components/
│   ├── navigation/
│   │   ├── nav-bar.tsx
│   │   ├── nav-item.tsx
│   │   ├── mobile-drawer.tsx
│   │   ├── theme-toggle.tsx
│   │   ├── user-menu.tsx
│   │   └── logo.tsx
│   │
│   ├── home/
│   │   ├── hero-section.tsx
│   │   ├── upcoming-events.tsx
│   │   ├── event-card-mini.tsx
│   │   ├── app-selection-panel.tsx
│   │   └── app-card.tsx
│   │
│   └── ui/                         # shadcn/ui components
│       ├── button.tsx
│       ├── dropdown-menu.tsx
│       ├── avatar.tsx
│       ├── card.tsx
│       └── sheet.tsx               # For mobile drawer
│
├── hooks/
│   ├── use-theme.ts
│   └── use-media-query.ts          # For responsive behavior
│
├── lib/
│   ├── auth.ts                     # NextAuth configuration
│   └── utils.ts
│
└── middleware.ts                   # Route protection
```

---

## Implementation Phases

### Phase 1: Foundation (Priority: High)

| Task | Description | Estimate |
|------|-------------|----------|
| Route Protection | Configure NextAuth middleware for protected routes | 2 hours |
| Dashboard Layout | Create `(dashboard)/layout.tsx` with NavBar slot | 1 hour |
| NavBar Shell | Basic NavBar component with logo placeholder and nav items | 3 hours |
| NavItem Component | Individual nav links with active state detection | 1 hour |

**Phase 1 Deliverable:** Basic navigation working across all pages

### Phase 2: Navigation Features (Priority: High)

| Task | Description | Estimate |
|------|-------------|----------|
| Theme Toggle | Implement toggle button with icon swap and persistence | 2 hours |
| User Menu | Avatar display with dropdown menu | 2 hours |
| Sign Out Flow | Integrate NextAuth signOut with confirmation | 1 hour |

**Phase 2 Deliverable:** Fully functional desktop navigation

### Phase 3: Mobile Navigation (Priority: High)

| Task | Description | Estimate |
|------|-------------|----------|
| Responsive Breakpoint | Hide desktop nav, show hamburger below 768px | 1 hour |
| Mobile Drawer | Slide-out drawer using shadcn Sheet component | 3 hours |
| Drawer Content | Nav items, user section, sign out in drawer | 2 hours |
| Backdrop & Close | Overlay behavior and close interactions | 1 hour |

**Phase 3 Deliverable:** Complete responsive navigation

### Phase 4: Landing Page (Priority: Medium)

| Task | Description | Estimate |
|------|-------------|----------|
| Hero Section | Greeting with user name from session | 1 hour |
| Upcoming Events | Fetch next 3 events, horizontal display | 3 hours |
| Event Card Mini | Compact event card component | 2 hours |
| Empty State | Friendly message when no events | 1 hour |

**Phase 4 Deliverable:** Hero section with live event data

### Phase 5: App Selection Panel (Priority: Medium)

| Task | Description | Estimate |
|------|-------------|----------|
| App Card | Card component with icon, title, description | 2 hours |
| Card Grid | Responsive grid layout for cards | 1 hour |
| Hover Animations | Scale, shadow, glow effects | 2 hours |
| Current Page State | Highlight when on that app's page | 1 hour |

**Phase 5 Deliverable:** Complete landing page

### Phase 6: Polish & Refinement (Priority: Low)

| Task | Description | Estimate |
|------|-------------|----------|
| Keyboard Navigation | Focus management, arrow key support in drawer | 2 hours |
| Animation Tuning | Smooth transitions, reduced motion support | 2 hours |
| Accessibility Audit | ARIA labels, contrast checks, screen reader testing | 2 hours |

**Phase 6 Deliverable:** Production-ready landing and navigation

### Total Estimated Effort: ~36 hours

---

## Future Considerations

The following items are explicitly out of scope for this MVP but should be considered for future iterations:

### Household Member Features

- Household name display in navigation
- Member switcher dropdown
- Shared vs. personal view toggle
- Member avatars in user menu

### Search & Quick Actions

- Global search bar in navigation
- Command palette (⌘K) for power users
- Quick action buttons (Add Transaction, New Event)
- Recent items dropdown

### Notifications

- Notification bell icon with badge count
- Notification dropdown/panel
- Real-time updates via WebSocket

### Navigation Enhancements

- Breadcrumb trail for deep pages
- Sub-navigation for complex sections
- Favorites/pinned pages
- Recent pages history

### Landing Page Extensions

- Financial summary widgets on home
- Quick stats cards
- Customizable dashboard layout
- Drag-and-drop widget arrangement

---

## Appendix A: shadcn/ui Components Required

Install these shadcn/ui components if not already present:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add card
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add tooltip
```

---

## Appendix B: Icon Reference (Lucide React)

```typescript
import {
  Home,
  Wallet,
  Calendar,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
  User,
  LogOut,
  MapPin,
  ChevronDown
} from 'lucide-react';
```

---

## Appendix C: Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm` | 640px | Small adjustments |
| `md` | 768px | **Mobile/Desktop pivot** |
| `lg` | 1024px | App card grid expansion |
| `xl` | 1280px | Maximum content width |

---

*End of Specification*
