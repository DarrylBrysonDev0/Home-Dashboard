# Categories API Contract

**Version**: 1.0.0  
**Base Path**: `/api/categories`  
**Authentication**: Required (GET public for logged-in users, mutations admin-only)

---

## Endpoints Overview

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/categories` | List all categories | Required |
| POST | `/api/categories` | Create category | Admin only |
| PUT | `/api/categories/[id]` | Update category | Admin only |
| DELETE | `/api/categories/[id]` | Delete category | Admin only |

---

## GET /api/categories

List all event categories (FR-024, FR-026).

### Response 200

```typescript
{
  data: Array<{
    id: string;
    name: string;
    color: string;    // Hex color like #F97316
    icon: string | null;  // Lucide icon name
    createdAt: string;
  }>
}
```

### Example Response

```json
{
  "data": [
    { "id": "clx...", "name": "Family", "color": "#F97316", "icon": "home", "createdAt": "2026-01-10T..." },
    { "id": "clx...", "name": "Work", "color": "#3B82F6", "icon": "briefcase", "createdAt": "2026-01-10T..." },
    { "id": "clx...", "name": "Medical", "color": "#EF4444", "icon": "heart", "createdAt": "2026-01-10T..." },
    { "id": "clx...", "name": "Social", "color": "#8B5CF6", "icon": "users", "createdAt": "2026-01-10T..." },
    { "id": "clx...", "name": "Finance", "color": "#10B981", "icon": "dollar-sign", "createdAt": "2026-01-10T..." },
    { "id": "clx...", "name": "Other", "color": "#6B7280", "icon": "calendar", "createdAt": "2026-01-10T..." }
  ]
}
```

### Response 401

```typescript
{ error: "Unauthorized" }
```

---

## POST /api/categories

Create a new event category (FR-034). Admin only.

### Request Body

```typescript
{
  name: string;     // Required, 1-50 chars, unique
  color: string;    // Required, hex color (#RRGGBB)
  icon?: string;    // Optional, Lucide icon name
}
```

### Zod Schema

```typescript
const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  icon: z.string().max(50).optional(),
});
```

### Response 201

```typescript
{
  data: {
    id: string;
    name: string;
    color: string;
    icon: string | null;
    createdAt: string;
  }
}
```

### Response 400

```typescript
{
  error: "Validation failed",
  details: {
    fieldErrors: {
      name?: ["Name already exists"];
      color?: ["Invalid hex color"];
    }
  }
}
```

### Response 401

```typescript
{ error: "Unauthorized" }
```

### Response 403

```typescript
{ error: "Admin access required" }
```

---

## PUT /api/categories/[id]

Update an existing category (FR-034). Admin only.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (cuid) | Category ID |

### Request Body

```typescript
{
  name?: string;    // 1-50 chars, unique
  color?: string;   // Hex color (#RRGGBB)
  icon?: string | null;
}
```

### Response 200

```typescript
{
  data: {
    id: string;
    name: string;
    color: string;
    icon: string | null;
    createdAt: string;
  }
}
```

### Response 404

```typescript
{ error: "Category not found" }
```

---

## DELETE /api/categories/[id]

Delete a category (FR-034). Events in this category become uncategorized. Admin only.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (cuid) | Category ID |

### Behavior

When a category is deleted:
1. All events with this category have their `categoryId` set to `null`
2. The category is permanently removed

### Response 200

```typescript
{
  data: {
    success: true,
    eventsUncategorized: number  // Count of affected events
  }
}
```

### Response 404

```typescript
{ error: "Category not found" }
```

---

## Default Categories

Seeded on initial setup (FR-026):

| Name | Color | Icon |
|------|-------|------|
| Family | #F97316 | home |
| Work | #3B82F6 | briefcase |
| Medical | #EF4444 | heart |
| Social | #8B5CF6 | users |
| Finance | #10B981 | dollar-sign |
| Other | #6B7280 | calendar |

---

## Color Palette Guidelines

Recommended colors that work with the Cemdash design system:

| Color | Hex | Usage |
|-------|-----|-------|
| Orange | #F97316 | Primary accent (Family) |
| Blue | #3B82F6 | Work/Professional |
| Red | #EF4444 | Important/Medical |
| Purple | #8B5CF6 | Social/Fun |
| Green | #10B981 | Financial/Success |
| Gray | #6B7280 | Neutral/Other |
| Teal | #14B8A6 | Alternative |
| Pink | #EC4899 | Alternative |
| Yellow | #F59E0B | Caution/Reminder |
