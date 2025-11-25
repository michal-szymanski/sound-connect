---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces for Sound Connect with high design quality. Use this skill when building web components, pages, or application interfaces. Generates polished code following Sound Connect's dark-first, musician-focused aesthetic while maintaining brand consistency.
---

This skill guides creation of distinctive, production-grade frontend interfaces for Sound Connect - a social networking platform for musicians. All designs must align with the established brand identity while expressing creativity through layout, motion, and spatial composition.

The user provides frontend requirements: a component, page, or interface to build. They may include context about the purpose, audience, or specific features.

## Sound Connect Design Philosophy

Sound Connect is professional yet approachable - think LinkedIn for musicians, not a music streaming service. The aesthetic is:

- **Dark-first**: Dark theme is the identity; light theme exists but dark is primary
- **Professional musicianship**: Serious about connecting musicians, not flashy entertainment
- **Approachable warmth**: Welcoming to hobbyists and professionals alike
- **Subtle sophistication**: Refinement over intensity, precision over noise

## Design Thinking

Before coding, understand the context:

- **Purpose**: What problem does this interface solve? Who uses it?
- **Musician context**: How does this relate to the musician's journey (discovery, connection, collaboration)?
- **Brand fit**: Does this feel like Sound Connect or a generic social app?
- **Differentiation**: What makes this interface memorable while staying on-brand?

Creativity lives within constraints. Execute bold ideas through:

- Thoughtful spatial composition and layout
- Purposeful motion and micro-interactions
- Strategic use of the primary cyan accent
- Typography hierarchy and rhythm

## Brand Constraints

### Color System

**Primary Color** (constant across themes): `oklch(0.72 0.14 200)` - Cyan/teal

**Dark Theme** (primary):
- Background: `oklch(0.145 0.015 240)`
- Card: `oklch(0.185 0.012 240)`
- Foreground: `oklch(0.965 0.005 240)`
- Border: `oklch(0.285 0.015 240)`
- Muted: `oklch(0.265 0.02 220)`

**Light Theme**:
- Background: `oklch(0.985 0.006 200)`
- Card: `oklch(0.995 0.005 200)`
- Foreground: `oklch(0.165 0.015 200)`

**Status Colors** (availability system):
- Actively Looking: `bg-green-500` (green dot)
- Open to Offers: `bg-blue-500` (blue dot)
- Not Looking: `bg-gray-500` (gray dot)
- Just Browsing: `bg-yellow-500` (yellow dot)

**Semantic Colors**:
- Destructive: `oklch(0.65 0.22 25)` (dark) / `oklch(0.58 0.22 25)` (light)
- Ring/focus: Uses primary color

### Typography

System fonts are used (subject to change). No custom fonts yet:
```css
--font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto...
```

Create hierarchy through:
- Weight variation (font-semibold, font-bold)
- Size scale (text-xs through text-3xl)
- Color contrast (foreground vs muted-foreground)
- Spacing and rhythm

### Design Tokens

All styling uses TailwindCSS with CSS variables from `globals.css`:

```tsx
className="bg-background text-foreground"
className="bg-card border-border"
className="bg-primary text-primary-foreground"
className="text-muted-foreground"
className="border-input"
className="ring-ring"
```

**Radius**: `--radius: 0.625rem` (applied via `rounded-lg`, `rounded-md`, etc.)

**Z-Index System**:
- `z-base` (0) - Default content
- `z-dropdown` (1) - Dropdown menus
- `z-sticky` (10) - Sticky headers
- `z-sidebar` (60) - Sidebar navigation
- `z-dialog` (100) - Modal overlays
- `z-popover` (110) - Popovers, emoji picker
- `z-tooltip` (120) - Tooltips

## Creative Expression

### Motion

Use animations for delight and feedback:

- **Page transitions**: Subtle fade-in, slide-up reveals
- **Staggered animations**: Use `animation-delay` for sequential reveals
- **Hover states**: Card lifts, border highlights, color transitions
- **Loading states**: Skeleton screens with subtle shimmer
- **Celebrations**: Confetti for achievements (sparingly)

Existing keyframes in globals.css:
```css
@keyframes heartbeat { /* for reactions */ }
@keyframes fadeInZoom { /* page entrance */ }
@keyframes fadeInSlideUp { /* content reveal */ }
```

For complex motion, use Magic UI components (see **magic-ui** skill).

### Spatial Composition

- **Generous whitespace**: Let content breathe
- **Card-based layouts**: Primary content organization pattern
- **Consistent gaps**: Use Tailwind spacing scale (`gap-2`, `gap-4`, `gap-6`)
- **Responsive grids**: Mobile-first, expand on larger screens
- **Visual hierarchy**: Primary actions prominent, secondary subdued

### Visual Details

- **Subtle borders**: `border-border/40` for softer edges
- **Shadow depth**: Light shadows (`shadow-sm`, `shadow-md`) for elevation
- **Avatar rings**: `ring-2 ring-background` for profile images
- **Status dots**: Small colored circles with ring backgrounds
- **Badge styling**: Subdued secondary badges, outline for status

## Technology Stack

### ShadCN Components

Location: `apps/web/src/shared/components/ui/`

Never modify these files directly. Use the components as-is:

```tsx
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/shared/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
```

### Magic UI Integration

Use Magic UI MCP tools for enhanced components:

- `mcp___magicuidesign_mcp__getAnimations` - Blur-fade effects
- `mcp___magicuidesign_mcp__getTextAnimations` - Text effects
- `mcp___magicuidesign_mcp__getButtons` - Creative buttons
- `mcp___magicuidesign_mcp__getBackgrounds` - Grid patterns, effects
- `mcp___magicuidesign_mcp__getSpecialEffects` - Beams, confetti, cards
- `mcp___magicuidesign_mcp__getComponents` - Marquee, bento-grid, etc.

See **magic-ui** skill for usage guidance.

### Context7 for Documentation

Use Context7 MCP for current TailwindCSS and Motion documentation:

```
mcp__context7__resolve-library-id (libraryName: "tailwindcss")
mcp__context7__get-library-docs (context7CompatibleLibraryID: "/tailwindlabs/tailwindcss")

mcp__context7__resolve-library-id (libraryName: "framer motion")
mcp__context7__get-library-docs (context7CompatibleLibraryID: "/motiondivision/motion")
```

## Implementation Guidelines

### Component Structure

```tsx
type Props = {
    // Always use "Props" as the type name
};

export function ComponentName({ prop1, prop2 }: Props) {
    // Component logic

    return (
        <Card className="border-border/40">
            <CardContent className="p-4">
                {/* Content */}
            </CardContent>
        </Card>
    );
}
```

### Responsive Design

```tsx
// Mobile-first approach
<div className="flex flex-col gap-2 sm:flex-row">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
<div className="w-full sm:w-auto sm:flex-1">
```

### Accessibility

- Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- Include `aria-label` on icon-only buttons
- Support keyboard navigation (`tabIndex`, focus states)
- Use `sr-only` for screen reader text
- Mark decorative elements with `aria-hidden="true"`
- Support `prefers-reduced-motion`

### Dark/Light Theme

Always consider both themes:

```tsx
// Good - works in both themes
className="bg-card text-card-foreground"
className="bg-muted text-muted-foreground"

// Bad - hardcoded colors
className="bg-gray-900 text-white"
```

## Reference Files

- **Musician UI patterns**: See `references/patterns.md` for Sound Connect-specific patterns
- **Magic UI components**: See **magic-ui** skill for animation and effect components

## Quality Checklist

Before completing any frontend work:

1. Does it look good in dark theme (primary)?
2. Does it work in light theme?
3. Is the primary cyan accent used purposefully?
4. Are status colors consistent with the system?
5. Does motion enhance without distracting?
6. Is it accessible (keyboard, screen reader)?
7. Is it responsive (mobile-first)?
8. Does it feel like Sound Connect?
