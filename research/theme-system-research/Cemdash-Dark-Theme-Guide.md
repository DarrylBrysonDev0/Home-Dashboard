**CEMDASH**

Dark Theme Style Guide

Home Finance Dashboard Design System

|  |
| --- |
|  |

**Theme Philosophy**

The Cemdash Dark Theme creates an immersive, premium experience for financial data visualization. Drawing inspiration from modern fintech applications and data dashboards, the theme emphasizes visual hierarchy through luminous accents against deep backgrounds, creating a sense of depth and sophistication.

Key design principles:

• Luminous Hierarchy: Vibrant neon colors draw attention to critical data points

• Depth Through Darkness: Multiple levels of dark tones create spatial separation

• Ambient Energy: Subtle glow effects and gradients add visual interest without distraction

• Data-First Design: Every visual element serves to enhance data comprehension

**Color Palette**

**Background Colors**

|  |  |  |  |
| --- | --- | --- | --- |
|  | **Name** | **Hex** | **Usage** |
|  | **Void Black** | #050505 | Page background, deepest layer |
|  | **Abyss** | #0A0A0A | Primary background |
|  | **Charcoal** | #111111 | Card backgrounds, elevated surfaces |
|  | **Graphite** | #1A1A1A | Sidebar background, secondary surfaces |
|  | **Slate** | #222222 | Hover states, tertiary surfaces |
|  | **Pewter** | #2A2A2A | Active states, borders |

**Text Colors**

|  |  |  |  |
| --- | --- | --- | --- |
|  | **Name** | **Hex** | **Usage** |
|  | **Pure White** | #FFFFFF | Primary headings, metric values |
|  | **Snow** | #F5F5F5 | Primary body text |
|  | **Silver** | #CCCCCC | Secondary text, descriptions |
|  | **Ash** | #888888 | Tertiary text, timestamps |
|  | **Smoke** | #666666 | Placeholder text, disabled |
|  | **Charcoal Text** | #444444 | Subtle labels, axis lines |

**Primary Accent Colors**

|  |  |  |  |
| --- | --- | --- | --- |
|  | **Name** | **Hex** | **Usage** |
|  | **Coral** | #F97066 | Primary accent, negative trends, alerts |
|  | **Coral Glow** | #FF8A80 | Coral hover state, glow effects |
|  | **Mint** | #12B76A | Positive indicators, success states |
|  | **Mint Glow** | #4ADE80 | Mint hover state, glow effects |
|  | **Teal** | #14B8A6 | Secondary positive, balance indicators |
|  | **Cyan** | #22D3EE | Tertiary accent, info highlights |

**Rainbow Spectrum (Chart Palette)**

The rainbow spectrum provides vibrant, distinguishable colors for multi-series charts and category visualization. Colors are arranged in spectral order for intuitive visual grouping.

|  |  |  |  |
| --- | --- | --- | --- |
|  | **Name** | **Hex** | **Usage** |
|  | **Neon Red** | #FF4444 | Expenses, first series, alerts |
|  | **Neon Orange** | #FF8C00 | Secondary expenses, warnings |
|  | **Neon Yellow** | #FFD700 | Highlights, third series |
|  | **Neon Lime** | #ADFF2F | Transitional, fourth series |
|  | **Neon Green** | #00FF7F | Income, positive flows |
|  | **Neon Teal** | #00CED1 | Savings, sixth series |
|  | **Neon Cyan** | #00FFFF | Seventh series, info |
|  | **Neon Blue** | #1E90FF | Eighth series, neutral |
|  | **Neon Purple** | #9370DB | Ninth series, tertiary |
|  | **Neon Magenta** | #FF00FF | Tenth series, special |

**Category Colors (Spending)**

|  |  |  |  |
| --- | --- | --- | --- |
|  | **Category** | **Hex** | **Notes** |
|  | **Charity** | #60A5FA | Donations, giving |
|  | **Daily** | #34D399 | Everyday expenses |
|  | **Dining** | #FBBF24 | Restaurants, takeout |
|  | **Entertainment** | #F97066 | Movies, games, events |
|  | **Gifts** | #A78BFA | Presents, occasions |
|  | **Groceries** | #4ADE80 | Food, household supplies |
|  | **Healthcare** | #FB7185 | Medical, pharmacy |
|  | **Financing** | #38BDF8 | Loans, interest |
|  | **Shopping** | #C084FC | Retail, online purchases |
|  | **Subscriptions** | #2DD4BF | Recurring services |
|  | **Transportation** | #FB923C | Gas, transit, auto |
|  | **Travel** | #FACC15 | Flights, hotels, vacation |
|  | **Utilities** | #818CF8 | Electric, water, internet |

**Typography**

Font Family: Inter (primary), SF Pro Display (fallback), system-ui

|  |  |  |  |  |
| --- | --- | --- | --- | --- |
| **Element** | **Weight** | **Size** | **Line Height** | **Color** |
| Page Title | Bold (700) | 32px | 40px | #FFFFFF |
| Section Title | Semibold (600) | 24px | 32px | #FFFFFF |
| Card Title | Medium (500) | 16px | 24px | #FFFFFF |
| Large Metric | Bold (700) | 48px | 56px | #FFFFFF |
| Medium Metric | Bold (700) | 32px | 40px | #FFFFFF |
| Small Metric | Semibold (600) | 24px | 32px | #FFFFFF |
| Body Text | Regular (400) | 14px | 22px | #CCCCCC |
| Caption | Regular (400) | 12px | 18px | #888888 |
| Label | Medium (500) | 12px | 16px | #CCCCCC |
| Chart Axis | Regular (400) | 11px | 14px | #666666 |
| Chart Legend | Medium (500) | 12px | 16px | #CCCCCC |
| Tooltip Title | Semibold (600) | 13px | 18px | #FFFFFF |
| Tooltip Body | Regular (400) | 12px | 16px | #CCCCCC |

**Spacing & Layout**

**Spacing Scale (8px base)**

|  |  |  |
| --- | --- | --- |
| **Token** | **Value** | **Usage** |
| space-0 | 0px | No spacing |
| space-1 | 4px | Tight inline spacing, icon gaps |
| space-2 | 8px | Default inline spacing |
| space-3 | 12px | Compact component padding |
| space-4 | 16px | Standard component padding |
| space-5 | 20px | Card internal padding |
| space-6 | 24px | Section gaps, card gaps |
| space-8 | 32px | Large section spacing |
| space-10 | 40px | Page section breaks |
| space-12 | 48px | Major layout gaps |

**Border Radius**

|  |  |  |
| --- | --- | --- |
| **Token** | **Value** | **Usage** |
| radius-none | 0px | Sharp corners |
| radius-sm | 4px | Buttons, inputs, chips |
| radius-md | 8px | Small cards, dropdowns |
| radius-lg | 12px | Cards, modals |
| radius-xl | 16px | Large cards, panels |
| radius-2xl | 24px | Hero sections |
| radius-full | 9999px | Pills, avatars, circular elements |

**Shadows & Glow Effects**

The dark theme uses subtle shadows for depth and luminous glow effects for emphasis. Glow effects use the accent color with varying opacity and blur.

**Shadow System**

|  |  |
| --- | --- |
| **Token** | **CSS Value** |
| shadow-sm | 0 1px 2px rgba(0, 0, 0, 0.5) |
| shadow-md | 0 4px 6px rgba(0, 0, 0, 0.6) |
| shadow-lg | 0 10px 15px rgba(0, 0, 0, 0.7) |
| shadow-xl | 0 20px 25px rgba(0, 0, 0, 0.8) |
| shadow-inner | inset 0 2px 4px rgba(0, 0, 0, 0.5) |

**Glow Effects**

|  |  |  |
| --- | --- | --- |
| **Effect** | **CSS Value** | **Usage** |
| glow-coral | 0 0 20px rgba(249, 112, 102, 0.4) | Primary accent glow |
| glow-coral-intense | 0 0 30px rgba(249, 112, 102, 0.6) | Hover states, focus |
| glow-mint | 0 0 20px rgba(18, 183, 106, 0.4) | Positive indicators |
| glow-teal | 0 0 20px rgba(20, 184, 166, 0.4) | Balance cards |
| glow-cyan | 0 0 20px rgba(34, 211, 238, 0.4) | Info highlights |
| glow-white | 0 0 15px rgba(255, 255, 255, 0.2) | Subtle emphasis |

**Border Glow (Card Borders)**

Cards use gradient borders with glow effects. Implementation uses a pseudo-element or border-image with gradient.

|  |  |
| --- | --- |
| **Card Type** | **Border Gradient** |
| Net Cash Flow | linear-gradient(135deg, #F97066, #FF8A80) |
| Total Balance | linear-gradient(135deg, #14B8A6, #22D3EE) |
| Month-over-Month | linear-gradient(135deg, #12B76A, #4ADE80) |
| Recurring Expenses | linear-gradient(135deg, #A78BFA, #C084FC) |
| Largest Expense | linear-gradient(135deg, #FB7185, #F97066) |
| Neutral/Default | linear-gradient(135deg, #444444, #666666) |

**Components**

**KPI Cards**

|  |  |
| --- | --- |
| **Property** | **Value** |
| Background | #111111 (Charcoal) |
| Border | 2px gradient border with glow |
| Border Radius | 12px |
| Padding | 20px |
| Shadow | shadow-lg + border glow effect |
| Icon Size | 20px, positioned top-right |
| Label | 12px Medium, #888888 |
| Value | 32px Bold, #FFFFFF |
| Trend Indicator | 14px with directional icon |
| Hover Effect | Increase glow intensity by 50% |

**Sidebar**

|  |  |
| --- | --- |
| **Property** | **Value** |
| Background | #0A0A0A (Abyss) |
| Width | 200px (collapsed: 64px) |
| Border Right | 1px solid #222222 |
| Padding | 16px |
| Logo Area Height | 64px |

**Time Period Buttons**

|  |  |
| --- | --- |
| **State** | **Styling** |
| Default | Background: transparent, Border: 1px #333333, Text: #CCCCCC |
| Hover | Background: #1A1A1A, Border: 1px #444444 |
| Active/Selected | Background: #222222, Border: 1px #F97066, Text: #FFFFFF |
| Border Radius | 6px |
| Padding | 10px 16px |
| Font | 14px Medium |

**Dropdown / Select**

|  |  |
| --- | --- |
| **Property** | **Value** |
| Trigger Background | #1A1A1A |
| Trigger Border | 1px solid #333333 |
| Dropdown Background | #111111 |
| Dropdown Border | 1px solid #333333 |
| Dropdown Shadow | shadow-xl |
| Item Hover | Background: #222222 |
| Item Selected | Background: #2A2A2A, accent color indicator |
| Border Radius | 8px |
| Chevron Icon | 16px, #888888 |

**Chart Specifications**

**1. Cash Flow Bar Chart**

Grouped bar chart showing income vs expenses by month. Uses gradient fills for visual depth.

|  |  |
| --- | --- |
| **Property** | **Value** |
| Chart Type | Grouped Bar (Recharts BarChart) |
| Income Bars | Gradient: #00FF7F to #00CED1 (bottom to top) |
| Expense Bars | Gradient: #FF4444 to #FF8C00 (bottom to top) |
| Bar Border Radius | 4px top corners |
| Bar Gap | 4px between grouped bars |
| Category Gap | 20% of bar width |
| Grid Lines | Horizontal only, #222222, dashed |
| X-Axis | Month labels, #666666, 11px |
| Y-Axis | Currency values, #666666, 11px |
| Bar Glow on Hover | 0 0 10px with bar color at 40% opacity |

**2. Spending by Category (Donut Chart)**

|  |  |
| --- | --- |
| **Property** | **Value** |
| Chart Type | Donut (Recharts PieChart) |
| Inner Radius | 60% of outer radius |
| Outer Radius | Responsive, ~120px default |
| Segment Stroke | 2px #0A0A0A (background color) |
| Center Label | Total amount, 24px Bold #FFFFFF |
| Center Sublabel | "Total", 12px #888888 |
| Segment Colors | Category color palette (see above) |
| Hover Effect | Segment expands by 5px, glow effect |
| Legend Position | Below chart, horizontal wrap |

**3. Account Balance Trends (Line Chart)**

|  |  |
| --- | --- |
| **Property** | **Value** |
| Chart Type | Multi-line (Recharts LineChart) |
| Line Stroke Width | 2px |
| Line Style | Solid with subtle drop shadow |
| Dot Radius | 0px default, 4px on hover |
| Active Dot | 6px with glow effect |
| Grid Lines | Both axes, #1A1A1A, dotted |
| Area Fill | Optional gradient fill at 10% opacity |
| Account Colors | Distinct colors per account from rainbow palette |

**Account Line Colors**

|  |  |  |  |
| --- | --- | --- | --- |
|  | **Account** | **Hex** | **Line Style** |
|  | **Joint Checking** | #4ADE80 | Solid, 2px |
|  | **Joint Savings** | #22D3EE | Solid, 2px |
|  | **User1 Checking** | #FBBF24 | Solid, 2px |
|  | **User1 Savings** | #FB923C | Solid, 2px |
|  | **User2 Checking** | #A78BFA | Solid, 2px |
|  | **User2 Savings** | #F472B6 | Solid, 2px |

**4. Transfer Flow (Sankey Diagram)**

|  |  |
| --- | --- |
| **Property** | **Value** |
| Chart Type | Sankey (Custom or D3-based) |
| Node Width | 20px |
| Node Padding | 10px |
| Link Opacity | 0.5 default, 0.8 on hover |
| Link Colors | Gradient from source to target node color |
| Node Colors | Account-specific from palette |
| Animation | Flow animation on links (optional) |
| Labels | Account names, 12px #CCCCCC |

**5. Recurring Items Table**

|  |  |
| --- | --- |
| **Property** | **Value** |
| Header Background | #1A1A1A |
| Header Text | 12px Medium, #888888, uppercase |
| Row Background | #111111 |
| Row Hover | #1A1A1A |
| Row Border | 1px solid #222222 (bottom only) |
| Cell Padding | 12px 16px |
| Amount Positive | #4ADE80 with $ prefix |
| Amount Negative | #F97066 with - prefix |
| Category Badge | Rounded pill with category color at 20% opacity |

**Chart Tooltips**

|  |  |
| --- | --- |
| **Property** | **Value** |
| Background | #1A1A1A with 95% opacity |
| Border | 1px solid #333333 |
| Border Radius | 8px |
| Padding | 12px 16px |
| Shadow | shadow-xl |
| Backdrop Filter | blur(8px) |
| Title | 13px Semibold, #FFFFFF |
| Body | 12px Regular, #CCCCCC |
| Color Indicator | 8px circle matching data series |
| Max Width | 280px |

**Chart Legends**

|  |  |
| --- | --- |
| **Property** | **Value** |
| Position | Bottom or right of chart |
| Layout | Horizontal wrap or vertical list |
| Item Spacing | 16px horizontal, 8px vertical |
| Color Indicator | 12px circle or 12x4px rounded rect |
| Label | 12px Medium, #CCCCCC |
| Hover | Highlight corresponding data, dim others |
| Click | Toggle series visibility |
| Disabled State | 50% opacity, strikethrough optional |

**Interactive States**

**Button States**

|  |  |
| --- | --- |
| **State** | **Treatment** |
| Default | Background color, no glow |
| Hover | Lighten 10%, add subtle glow |
| Active/Pressed | Darken 5%, scale(0.98) |
| Focus | 2px ring in accent color, 2px offset |
| Disabled | 40% opacity, cursor: not-allowed |
| Loading | Pulse animation, spinner icon |

**Loading States**

|  |  |
| --- | --- |
| **Element** | **Skeleton Treatment** |
| Skeleton Base | #1A1A1A |
| Skeleton Highlight | #2A2A2A |
| Animation | Shimmer, 1.5s ease-in-out infinite |
| Border Radius | Match component radius |
| Chart Skeleton | Grid placeholder with pulsing bars |

**Empty States**

|  |  |
| --- | --- |
| **Property** | **Value** |
| Icon | 48px, #444444, centered |
| Title | 16px Medium, #CCCCCC |
| Description | 14px Regular, #888888 |
| Action Button | Primary style, optional |
| Container | Dashed border #333333, rounded |

**Trend Indicators**

|  |  |  |  |
| --- | --- | --- | --- |
| **Direction** | **Color** | **Icon** | **Format** |
| Positive | #4ADE80 | ↗ or ▲ | +12.5% or ↗ 12.5% |
| Negative | #F97066 | ↘ or ▼ | -8.3% or ↘ 8.3% |
| Neutral | #888888 | → or – | 0.0% or → 0.0% |

**Ambient Effects**

The dark theme includes optional ambient effects for enhanced visual appeal. These should be used sparingly and can be disabled for performance or accessibility.

**Aurora Background Effect**

|  |  |
| --- | --- |
| **Property** | **Value** |
| Effect Type | Animated gradient mesh or SVG filter |
| Colors | Rainbow spectrum at 5-10% opacity |
| Animation | Slow drift, 30-60s cycle |
| Blur | 100-200px gaussian blur |
| Position | Fixed, behind all content |
| Z-Index | -1 |
| Disable Option | prefers-reduced-motion: reduce |

**CSS Custom Properties**

Define these CSS custom properties at :root level for consistent theming across the application.

|  |  |
| --- | --- |
| **Variable** | **Value** |
| --color-bg-void | #050505 |
| --color-bg-abyss | #0A0A0A |
| --color-bg-charcoal | #111111 |
| --color-bg-graphite | #1A1A1A |
| --color-bg-slate | #222222 |
| --color-bg-pewter | #2A2A2A |
| --color-text-primary | #FFFFFF |
| --color-text-secondary | #CCCCCC |
| --color-text-tertiary | #888888 |
| --color-text-muted | #666666 |
| --color-accent-coral | #F97066 |
| --color-accent-mint | #12B76A |
| --color-accent-teal | #14B8A6 |
| --color-accent-cyan | #22D3EE |
| --color-positive | #4ADE80 |
| --color-negative | #F97066 |
| --color-border-subtle | #222222 |
| --color-border-default | #333333 |
| --color-border-emphasis | #444444 |
| --radius-sm | 4px |
| --radius-md | 8px |
| --radius-lg | 12px |
| --shadow-glow-coral | 0 0 20px rgba(249, 112, 102, 0.4) |
| --shadow-glow-mint | 0 0 20px rgba(18, 183, 106, 0.4) |

|  |
| --- |
|  |

Cemdash Dark Theme Design System

Home Finance Dashboard