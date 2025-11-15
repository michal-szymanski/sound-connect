---
name: tailwind-css
description: Tailwind CSS patterns for Sound Connect - semantic z-index tokens, color system, responsive design, dark mode, and never using arbitrary z-index values
---

# Tailwind CSS Skill for Sound Connect

## Core Concepts

1. **Utility-First** - Build designs with utility classes
2. **Design Tokens** - Consistent spacing, colors via CSS variables
3. **Responsive Design** - Mobile-first with breakpoint prefixes
4. **Dark Mode** - Automatic dark variant support
5. **Z-Index System** - Semantic tokens for layering

## Sound Connect Patterns

### 1. Color System
```tsx
// Using semantic color tokens
<div className="bg-background text-foreground">
    <Card className="border-border/40 bg-card">
        <Button className="bg-primary text-primary-foreground">
            Primary Action
        </Button>
        <p className="text-muted-foreground">Secondary text</p>
        <Alert className="border-destructive bg-destructive/10">
            <span className="text-destructive">Error message</span>
        </Alert>
    </Card>
</div>

// Color opacity
<div className="border-border/40">     // 40% opacity
<div className="bg-primary/10">        // 10% opacity background
<div className="text-foreground/60">   // 60% text opacity
```

### 2. Z-Index Tokens
```tsx
// ALWAYS use semantic tokens, never arbitrary values
<div className="z-dropdown">    // Dropdowns (z-index: 1)
<div className="z-sticky">      // Sticky headers (z-index: 10)
<div className="z-sidebar">     // Sidebar (z-index: 60)
<div className="z-dialog">      // Dialogs (z-index: 100)
<div className="z-popover">     // Popovers (z-index: 110)
<div className="z-tooltip">     // Tooltips (z-index: 120)

// ❌ NEVER use arbitrary z-index
<div className="z-[999]">       // Bad - use tokens instead
<div className="z-50">          // Bad - not in our system
```

### 3. Spacing and Layout
```tsx
// Consistent spacing with Tailwind units
<div className="space-y-4">         // Vertical spacing between children
    <div className="p-6">           // Padding all sides
        <div className="mx-auto max-w-4xl">  // Center with max width
            <div className="flex items-center gap-4">  // Flexbox with gap
                <div className="flex-1">Content</div>
                <div className="flex-shrink-0">Icon</div>
            </div>
        </div>
    </div>
</div>

// Grid layouts
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {items.map(item => (
        <Card key={item.id} className="p-4">
            {/* Card content */}
        </Card>
    ))}
</div>
```

### 4. Responsive Design
```tsx
// Mobile-first responsive utilities
<div className="flex flex-col sm:flex-row">  // Stack on mobile, row on sm+

<div className="hidden sm:block">            // Hide on mobile

<div className="text-sm md:text-base lg:text-lg">  // Responsive text

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

<div className="w-full sm:w-auto">          // Full width mobile, auto desktop

// Responsive padding/margin
<div className="p-4 sm:p-6 lg:p-8">
<div className="mx-4 sm:mx-6 lg:mx-auto">
```

### 5. Dark Mode Patterns
```tsx
// Automatic dark mode via CSS variables
<div className="bg-background">         // Adapts to theme
<div className="text-foreground">       // Adapts to theme

// Explicit dark mode overrides (rare)
<div className="bg-white dark:bg-black">

// Dark mode borders
<div className="border-border/40">      // Semi-transparent border

// Dark mode hover states
<Button className="hover:bg-accent hover:text-accent-foreground">
```

### 6. Animation Classes
```tsx
// Transitions
<div className="transition-all duration-200">
<div className="transition-colors hover:text-primary">
<div className="transition-transform hover:scale-105">

// Custom animations
<div className="animate-pulse">         // Loading skeleton
<div className="animate-spin">          // Spinner
<div className="animate-bounce">        // Attention

// Group hover
<div className="group">
    <Icon className="transition-transform group-hover:rotate-180" />
    <span className="group-hover:text-primary">Hover me</span>
</div>
```

### 7. Form Styling
```tsx
// Consistent form elements
<Input className="w-full" />

// Focus states
<Input className="focus:ring-2 focus:ring-primary" />

// Error states
<Input
    className={cn(
        "w-full",
        errors.field && "border-destructive focus:ring-destructive"
    )}
/>

// Disabled states
<Button disabled className="opacity-50 cursor-not-allowed">
    Disabled
</Button>
```

### 8. Typography
```tsx
// Text sizing
<h1 className="text-2xl font-bold">Heading</h1>
<p className="text-base">Body text</p>
<span className="text-sm text-muted-foreground">Caption</span>

// Text alignment
<div className="text-center sm:text-left">

// Line height and spacing
<p className="leading-relaxed">Long paragraph text</p>
<h2 className="tracking-tight">Tight heading</h2>

// Truncation
<p className="truncate">Very long text that will be truncated</p>
<p className="line-clamp-3">Multi-line text clamped to 3 lines</p>
```

## Common Tasks

### Creating Responsive Layouts
1. Start with mobile layout (no prefix)
2. Add `sm:` for tablet (640px+)
3. Add `md:` for desktop (768px+)
4. Add `lg:` for large screens (1024px+)

### Implementing Dark Mode
1. Use semantic color tokens (background, foreground, etc.)
2. Colors automatically adapt via CSS variables
3. Rarely need explicit dark: variants

### Adding Custom Animations
1. Use Tailwind's built-in animations when possible
2. Add custom animations to globals.css if needed
3. Apply with animate-[name] class

### Managing Z-Index
1. Always use semantic tokens (z-dropdown, z-dialog, etc.)
2. Never use arbitrary values like z-[999]
3. Add new tokens to globals.css if needed

## Anti-Patterns to Avoid

- ❌ Using arbitrary z-index values instead of tokens
- ❌ Inline styles when Tailwind classes exist
- ❌ Not following mobile-first responsive design
- ❌ Using fixed colors instead of semantic tokens
- ❌ Creating deeply nested selectors
- ❌ Forgetting hover/focus states

## Integration Guide

- **With ShadCN**: Components use Tailwind classes
- **With React**: className prop for all styling
- **With Dark Mode**: CSS variables in globals.css
- **With Animations**: tw-animate-css package
- **With Forms**: Consistent input/button styling

## Quick Reference

```css
/* Common utility patterns */

/* Flexbox */
flex items-center justify-between gap-4
flex flex-col sm:flex-row
flex-1 flex-shrink-0

/* Grid */
grid grid-cols-1 md:grid-cols-2 gap-4
grid-cols-[auto_1fr_auto]

/* Spacing */
p-4 sm:p-6 lg:p-8
space-y-4 space-x-2
mx-auto max-w-4xl

/* Colors */
bg-background text-foreground
bg-card border-border
text-muted-foreground
bg-primary text-primary-foreground

/* States */
hover:bg-accent active:scale-95
focus:ring-2 focus:ring-primary
disabled:opacity-50

/* Responsive */
hidden sm:block
w-full sm:w-auto
text-sm md:text-base

/* Z-Index (semantic only) */
z-dropdown z-sticky z-sidebar
z-dialog z-popover z-tooltip
```

## Real Examples from Codebase

- **Complex Layout**: `apps/web/src/routes/(main).tsx`
- **Responsive Design**: `apps/web/src/features/posts/components/post.tsx`
- **Dark Mode**: `apps/web/src/styles/globals.css`
- **Form Styling**: `apps/web/src/features/bands/components/band-form.tsx`
- **Z-Index Usage**: `apps/web/src/features/chat/components/chat-window.tsx`
