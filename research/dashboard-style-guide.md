# Cemdash Design System & Style Guide

**Expanded Edition with Comprehensive Chart Definitions**

---

## Color Palette

### Primary Colors

| Name | Hex | Usage |
| --- | --- | --- |
| **Coral/Salmon** | #F97066 | Primary buttons, negative trends, alerts |
| **Mint Green** | #12B76A | Positive indicators, success states, progress |
| **Deep Teal** | #0D9488 | Logo accent, secondary actions |

### Neutral Colors

| Name | Hex | Usage |
| --- | --- | --- |
| **Near Black** | #101828 | Primary text, headings |
| **Dark Gray** | #344054 | Secondary text, labels |
| **Medium Gray** | #667085 | Tertiary text, placeholders |
| **Light Gray** | #D0D5DD | Borders, dividers |
| **Off-White** | #F2F4F7 | Page background |
| **White** | #FFFFFF | Card backgrounds |

### Extended Chart Colors

| Name | Hex | Usage |
| --- | --- | --- |
| **Chart Pink** | #FDA4AF | Revenue, primary data series |
| **Chart Purple** | #C4B5FD | Expenses, secondary series |
| **Chart Teal** | #5EEAD4 | Tertiary data, positive sentiment |
| **Chart Blue** | #60A5FA | Quaternary data, neutral sentiment |
| **Chart Orange** | #FDBA74 | Warnings, attention items |
| **Chart Yellow** | #FCD34D | Highlights, suggestions |
| **Chart Indigo** | #818CF8 | Comments, informational |
| **Dark Slate** | #1E293B | Navigation backgrounds |

### Sentiment Colors

| Name | Hex | Usage |
| --- | --- | --- |
| **Happy/Positive** | #12B76A | Positive sentiment, success |
| **Neutral** | #60A5FA | Neutral sentiment |
| **Unhappy/Negative** | #F97066 | Negative sentiment, complaints |

---

## Typography

**Font Family:** Inter (or SF Pro Display)

| Element | Weight | Size | Line Height |
| --- | --- | --- | --- |
| Page Title | Semibold (600) | 24px | 32px |
| Large Metric | Bold (700) | 48px | 56px |
| Card Title | Medium (500) | 14px | 20px |
| Metric Value | Bold (700) | 32px | 40px |
| Body Text | Regular (400) | 14px | 20px |
| Caption/Label | Regular (400) | 12px | 16px |
| Table Header | Medium (500) | 12px | 16px |
| Chart Axis Label | Regular (400) | 11px | 14px |
| Chart Tooltip | Medium (500) | 12px | 16px |

---

## Spacing System

Based on an 8px grid:

| Token | Value | Usage |
| --- | --- | --- |
| space-1 | 4px | Tight spacing, icon gaps |
| space-2 | 8px | Inline element spacing |
| space-3 | 12px | Small component padding |
| space-4 | 16px | Default component padding |
| space-5 | 20px | Card internal padding |
| space-6 | 24px | Card gaps, section spacing |
| space-8 | 32px | Large section margins |

---

## Border Radius

| Token | Value | Usage |
| --- | --- | --- |
| radius-sm | 4px | Small badges, chips, bar chart corners |
| radius-md | 8px | Buttons, inputs |
| radius-lg | 12px | Cards, modals |
| radius-xl | 16px | Large containers |
| radius-full | 9999px | Avatars, pills, donut charts |

---

## Shadows

| Token | Value | Usage |
| --- | --- | --- |
| shadow-sm | 0 1px 2px rgba(16,24,40,0.05) | Subtle lift |
| shadow-md | 0 4px 8px -2px rgba(16,24,40,0.1), 0 2px 4px -2px rgba(16,24,40,0.06) | Cards |
| shadow-lg | 0 12px 16px -4px rgba(16,24,40,0.08) | Dropdowns, modals |

---

## Charts — Comprehensive Definitions

### General Chart Principles

| Property | Value |
| --- | --- |
| Background | Transparent (inherits card #FFFFFF) |
| Grid lines | #EAECF0 at 0.5px, dashed for horizontal |
| Axis lines | #D0D5DD at 1px |
| Axis labels | #667085, 11px, Regular |
| Chart padding | 16px all sides |
| Animation | 300ms ease-out on load |
| Tooltip delay | 100ms |

### 1. Vertical Bar Chart

**Use case:** Comparing discrete categories (revenue, distribution, counts)

```
┌─────────────────────────────────────┐
│  $4K ┤                              │
│  $3K ┤      ██  ██      ██          │
│  $2K ┤  ██  ██  ██  ██  ██  ██      │
│  $1K ┤  ██  ██  ██  ██  ██  ██  ██  │
│    0 ┼──┴───┴───┴───┴───┴───┴───┴── │
│       Jan Feb Mar Apr May Jun Jul   │
└─────────────────────────────────────┘
```

| Property | Value |
| --- | --- |
| Bar width | 24–32px |
| Bar gap | 8px (same category), 16px (between groups) |
| Border radius | 4px top corners only |
| Min height | 200px |
| Colors | Single: #FDA4AF; Multi: use Chart Colors sequence |
| Hover state | Opacity 0.8, show tooltip |
| Y-axis | Left-aligned, abbreviated (1K, 2K) |

**Color sequence for grouped bars:**
1. #FDA4AF (Pink)
2. #C4B5FD (Purple)
3. #5EEAD4 (Teal)
4. #60A5FA (Blue)
5. #FDBA74 (Orange)

### 2. Horizontal Bar Chart

**Use case:** Ranking, comparisons with long labels, service quality levels

```
┌─────────────────────────────────────┐
│  Customer Co...  ████████████ 1,552 │
│  Customer Co...  ███████████  1,510 │
│  DEWA Website    ██████████   1,426 │
│  DEWA Smart...   █████████    1,189 │
│  Social Media    ██████         777 │
└─────────────────────────────────────┘
```

| Property | Value |
| --- | --- |
| Bar height | 20–24px |
| Bar gap | 12px |
| Border radius | 4px right side only |
| Label position | Left of bar, truncate with ... at 120px |
| Value position | Right of bar, 8px gap |
| Value color | #344054 |
| Max label width | 120px with ellipsis |
| Bar color | Single: #60A5FA; Multi: Chart Colors sequence |

### 3. Horizontal Stacked Bar Chart

**Use case:** Part-to-whole within categories, multi-variable comparison

```
┌─────────────────────────────────────┐
│  Accessibility    ██████░░░░░░░░░░░ │
│  Speed of serv... ████████████░░░░░ │
│  Professionali... █████████████████ │
│  Respect custo... ██████████░░░░░░░ │
└─────────────────────────────────────┘
```

| Property | Value |
| --- | --- |
| Bar height | 16–20px |
| Segment gap | 0px (flush) |
| Border radius | 4px on outer ends only |
| Label position | Left, numbered list format (1. Label) |
| Legend position | Below chart, horizontal layout |
| Legend dot size | 8px circle |
| Legend spacing | 16px between items |

**Stacked segment colors (in order):**

| Category | Color | Hex |
| --- | --- | --- |
| Appreciations | Teal | #5EEAD4 |
| Suggestions | Yellow | #FCD34D |
| Comments | Indigo | #818CF8 |
| Inquiries | Blue | #60A5FA |
| Complaints | Coral | #F97066 |

### 4. Multi-Line Area Chart

**Use case:** Trends over time, sentiment distribution, time series comparison

```
┌─────────────────────────────────────┐
│ 75% ┤    ·····················      │
│ 60% ┤  ·'                    '·     │
│ 45% ┤ ·    ══════════════════  ·    │
│ 30% ┤·  ═══                  ═══    │
│ 15% ┤ ─────────────────────────     │
│  0% ┼───┬───┬───┬───┬───┬───┬───    │
│     01  05  09  13  17  21  25 Dec  │
└─────────────────────────────────────┘
```

| Property | Value |
| --- | --- |
| Line thickness | 2px |
| Area fill opacity | 0.1 |
| Point markers | Hidden by default, 6px circle on hover |
| Grid lines | Horizontal dashed, #EAECF0 |
| Curve type | monotoneX (smooth) |
| Min height | 240px |

**Sentiment line colors:**

| Series | Line Color | Fill Color |
| --- | --- | --- |
| Happy | #12B76A | rgba(18,183,106,0.1) |
| Neutral | #60A5FA | rgba(96,165,250,0.1) |
| Unhappy | #F97066 | rgba(249,112,102,0.1) |

**Tooltip styling:**
```
Background: #1E293B
Border radius: 8px
Padding: 12px 16px
Text color: #FFFFFF
Shadow: shadow-lg
```

### 5. Donut Chart

**Use case:** Part-to-whole, single metric with breakdown, happiness scores

```
        ┌─────────┐
       ╱           ╲
      │   ┌─────┐   │
      │   │ 64% │   │
      │   │Happy│   │
      │   └─────┘   │
       ╲           ╱
        └─────────┘
   ● Happy  ● Neutral  ● Unhappy
```

| Property | Value |
| --- | --- |
| Outer radius | 80–100px |
| Inner radius | 60% of outer (thick ring) |
| Segment gap | 2px |
| Start angle | -90° (12 o'clock) |
| Center metric size | 32px Bold |
| Center label size | 14px Regular, #667085 |
| Legend position | Below, horizontal |

**Donut colors (clockwise from top):**
1. #12B76A (Happy/Primary)
2. #60A5FA (Neutral)
3. #F97066 (Unhappy/Negative)
4. #FCD34D
5. #C4B5FD

**Center content:**
```
Large number: #101828, 32px Bold
Sublabel: #667085, 14px Regular
Trend indicator: ▲+80 in #12B76A
```

### 6. Pie Chart with Legend

**Use case:** Distribution breakdown, category totals

```
        ┌─────────┐
       ╱     █     ╲        ● Complaints   211,110
      │    █████    │       ● Appreciations 11,729
      │   ███████   │       ● Comments       2,000
       ╲   █████   ╱        ● Suggestions    7,037
        └─────────┘         ● Inquiries      2,346
         234,222
           Total
```

| Property | Value |
| --- | --- |
| Radius | 80–100px |
| Center label | Total value, 24px Bold |
| Center sublabel | "Total", 12px Regular |
| Legend position | Right side or below |
| Legend format | ● Label [space] Value |
| Value alignment | Right-aligned in legend |

### 7. Bubble / Circle Packing Chart

**Use case:** Topic clustering, relative importance, hierarchical data

```
┌─────────────────────────────────────┐
│      ┌────────┐                     │
│  ┌──┐│ Career │ ┌─────────────┐     │
│  │  │└────────┘ │ Activation  │     │
│  └──┘           │ of supply   │     │
│    ┌───────┐    └─────────────┘     │
│    │ Smart │         ┌────┐         │
│    │Service│         │Bill│         │
│    └───────┘         └────┘         │
└─────────────────────────────────────┘
```

| Property | Value |
| --- | --- |
| Min bubble size | 40px diameter |
| Max bubble size | 120px diameter |
| Bubble padding | 4px between |
| Border | None or 1px white |
| Label position | Centered inside bubble |
| Label size | Scales with bubble (10–14px) |
| Label color | #FFFFFF or #101828 based on contrast |
| Overflow | Truncate with ... |

**Bubble colors (categorical):**
```
#5EEAD4  #C4B5FD  #FDA4AF  #FCD34D  
#60A5FA  #818CF8  #FDBA74  #12B76A
```

### 8. Map Visualization

**Use case:** Geographic distribution, location data, regional metrics

```
┌─────────────────────────────────────┐
│                                     │
│           📍 16,172                 │
│                                     │
│              📍 16,172              │
│                                     │
│         📍 16,172                   │
│                                     │
└─────────────────────────────────────┘
```

| Property | Value |
| --- | --- |
| Base map style | Light/minimal (Mapbox Light or similar) |
| Map background | #E8ECF0 for land, #FFFFFF for water |
| Marker size | 32px default |
| Marker colors | Primary: #F97066, Secondary: #60A5FA |
| Label background | #FFFFFF with shadow-sm |
| Label padding | 4px 8px |
| Label border radius | 4px |
| Label font | 12px Semibold, #101828 |
| Cluster threshold | 5+ markers in proximity |

**Marker styles:**

| Type | Color | Icon |
| --- | --- | --- |
| Primary/Selected | #F97066 | Filled pin |
| Secondary | #60A5FA | Filled pin |
| Neutral | #667085 | Outlined pin |

### 9. Sentiment Score Visualization (Icon Array)

**Use case:** Comparative sentiment by channel, source comparison

```
┌─────────────────────────────────────┐
│   Out Bound Calls    Live Calls     │
│                                     │
│    📍  📍  📍        📍  📍  📍     │
│    📍  📍            📍  📍  📍     │
│                                     │
│     Unhappy            Unhappy      │
│  ●500 ●300 ●200    ●500 ●300 ●200   │
└─────────────────────────────────────┘
```

| Property | Value |
| --- | --- |
| Icon type | Location pin / marker |
| Icon sizes | Small: 16px, Medium: 24px, Large: 32px |
| Icon colors | Match sentiment (Happy/Neutral/Unhappy) |
| Grid layout | Flexible, centered |
| Category label | Centered below icon group |
| Legend position | Below, horizontal with dot indicators |

### 10. Progress/Gauge Indicators

**Use case:** KPI achievement, target tracking, single metrics

```
Target achieved!
████████████████░░░░░░░░  $367K

KPI target achieved!
████████████████████░░░░░  64%

Customer satisfaction
██████████████████████░░░  89%
```

| Property | Value |
| --- | --- |
| Track height | 8px |
| Track background | #E5E7EB |
| Track border radius | 4px (full/pill) |
| Fill border radius | 4px |
| Label position | Above track, left-aligned |
| Value position | Right of track or above |

**Progress colors by context:**

| Context | Fill Color |
| --- | --- |
| Success/Complete | #12B76A |
| In Progress | #60A5FA |
| Warning | #FDBA74 |
| Critical/Low | #F97066 |

---

## Chart Tooltips

### Standard Tooltip
```css
background: #1E293B;
color: #FFFFFF;
border-radius: 8px;
padding: 12px 16px;
box-shadow: 0 4px 12px rgba(0,0,0,0.15);
font-size: 12px;
max-width: 200px;
```

### Tooltip Content Structure
```
┌─────────────────────┐
│  15 Dec             │  ← Date/category header (12px, #94A3B8)
│                     │
│  ● Happy    65%     │  ← Legend dot + label + value
│  ● Neutral  25%     │
│  ● Unhappy  10%     │
└─────────────────────┘
```

| Element | Style |
| --- | --- |
| Header | 12px Regular, #94A3B8 |
| Legend dot | 8px circle, category color |
| Label | 12px Regular, #FFFFFF |
| Value | 12px Semibold, #FFFFFF |
| Row spacing | 6px |

---

## Chart Legends

### Horizontal Legend (Default)
```
● Happy   ● Neutral   ● Unhappy
```

| Property | Value |
| --- | --- |
| Dot size | 8px circle |
| Dot-to-label gap | 6px |
| Item spacing | 16px |
| Font | 12px Regular, #667085 |
| Position | Below chart, 16px margin-top |
| Alignment | Left or center |

### Vertical Legend (For Pie/Donut with values)
```
● Complaints     211,110
● Suggestions      7,037
● Appreciations   11,729
● Comments         2,000
● Inquiries        2,346
```

| Property | Value |
| --- | --- |
| Row height | 24px |
| Dot size | 8px circle |
| Label | 12px Regular, #344054 |
| Value | 12px Regular, #667085, right-aligned |
| Max width | 200px |

---

## Chart Controls & Filters

### Time Period Toggles
```
┌───┬───┬───┬───┐
│ M │ D │ # │ % │
└───┴───┴───┴───┘
```

| Property | Value |
| --- | --- |
| Button size | 32px × 28px |
| Border radius | 6px |
| Border | 1px solid #D0D5DD |
| Active background | #F2F4F7 |
| Active text | #101828 |
| Inactive text | #667085 |
| Font | 12px Medium |

### Dropdown Filters
```
┌─────────────────┐
│  All        ▼   │
└─────────────────┘
```

| Property | Value |
| --- | --- |
| Height | 32px |
| Padding | 8px 12px |
| Border | 1px solid #D0D5DD |
| Border radius | 6px |
| Background | #FFFFFF |
| Chevron | 16px, #667085 |

---

## Chart Empty & Loading States

### Empty State
```
┌─────────────────────────────────────┐
│                                     │
│            📊                       │
│                                     │
│      No data available              │
│   Try adjusting your filters        │
│                                     │
└─────────────────────────────────────┘
```

| Element | Style |
| --- | --- |
| Icon | 48px, #D0D5DD |
| Title | 14px Medium, #344054 |
| Description | 12px Regular, #667085 |

### Loading State (Skeleton)
```
┌─────────────────────────────────────┐
│  ░░░░░░░░░░░░░░                     │
│  ████████████████████░░░░░░░░░░░░   │
│  ██████████░░░░░░░░░░░░░░░░░░░░░░   │
│  ████████████████░░░░░░░░░░░░░░░░   │
└─────────────────────────────────────┘
```

| Property | Value |
| --- | --- |
| Skeleton color | #E5E7EB |
| Animation | Pulse, 1.5s ease-in-out infinite |
| Border radius | Match chart element shapes |

---

## Components

### Cards

| Property | Value |
| --- | --- |
| Background | #FFFFFF |
| Border radius | 12px |
| Padding | 20px |
| Shadow | shadow-md |
| Border | None |

### Metric Cards (Top Stats)
```
┌────────────────────────┐
│  Top Channel      📋   │
│  Web Portal            │
└────────────────────────┘
```

| Property | Value |
| --- | --- |
| Label | 12px Regular, #667085 |
| Value | 16px Semibold, #101828 |
| Icon | 16px, #667085, top-right |
| Background | #FFFFFF |
| Border | 1px solid #E5E7EB |
| Border radius | 8px |
| Padding | 16px |

### Filter Pills / Chips
```
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Source ▼ │ │ Channel▼ │ │ Service▼ │
└──────────┘ └──────────┘ └──────────┘
```

| Property | Value |
| --- | --- |
| Height | 32px |
| Padding | 8px 12px |
| Background | #FFFFFF |
| Border | 1px solid #D0D5DD |
| Border radius | 6px |
| Font | 13px Medium, #344054 |
| Hover | Background #F9FAFB |
| Active | Background #1E293B, text #FFFFFF |

### Tab Navigation
```
┌────────────────────────────────────────────────┐
│  Dashboard  Voices  Customers  360 Challenges  │
└────────────────────────────────────────────────┘
```

**Dark variant (header):**

| State | Background | Text |
| --- | --- | --- |
| Default | Transparent | #94A3B8 |
| Hover | rgba(255,255,255,0.1) | #FFFFFF |
| Active | #FFFFFF | #101828 |

| Property | Value |
| --- | --- |
| Tab padding | 8px 16px |
| Border radius | 6px |
| Font | 14px Medium |

### Sub-tabs (Pills)
```
┌───────────────┐ ┌─────────────────────┐ ┌────────────────┐
│ ▣ VoC Insight │   Customer Experience     Ticket Insights
└───────────────┘ └─────────────────────┘ └────────────────┘
```

| State | Style |
| --- | --- |
| Active | Background #101828, text #FFFFFF, border-radius 8px |
| Inactive | Background transparent, text #667085 |

---

## Dark Header Bar

Used for primary navigation:

| Property | Value |
| --- | --- |
| Background | #1E293B |
| Height | 56px |
| Logo area width | 180px |
| Nav item spacing | 24px |
| Text color (inactive) | #94A3B8 |
| Text color (active) | #FFFFFF |

### Chatbot Button

| Property | Value |
| --- | --- |
| Background | #12B76A |
| Text | #FFFFFF, 13px Medium |
| Icon | Sparkle/AI icon, 16px |
| Padding | 8px 16px |
| Border radius | 6px |

---

## Trend Indicators

| Direction | Color | Icon | Format |
| --- | --- | --- | --- |
| Positive | #12B76A | ↗ or ▲ | ↗ 2.8% |
| Negative | #F97066 | ↘ or ▼ | ↘ 2.9% |
| Neutral | #667085 | → or – | → 0.0% |

---

## Interactive States

| State | Treatment |
| --- | --- |
| Hover | Slight background darken or shadow-lg |
| Active/Pressed | Scale to 98% or darken by 10% |
| Focus | 2px ring in primary color with 2px offset |
| Disabled | 50% opacity, no pointer events |
| Loading | Skeleton with #E5E7EB pulsing animation |

---

## Iconography

| Property | Value |
| --- | --- |
| Style | Outlined/Stroke icons |
| Stroke width | 1.5px–2px |
| Size (default) | 20px |
| Size (small) | 16px |
| Size (large) | 24px |
| Color | Inherits text color or #667085 |
| Library suggestions | Lucide, Heroicons, or Phosphor |

---

**Cemdash Design System — Expanded Edition**
