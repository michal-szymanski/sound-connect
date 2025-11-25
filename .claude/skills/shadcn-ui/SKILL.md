---
name: shadcn-ui
description: ShadCN/ui component usage, patterns, and best practices for Sound Connect. Use this skill when working with UI components from the ShadCN library including forms, dialogs, sheets, popovers, tooltips, toasts, and applying the z-index token system.
---

# ShadCN UI Components

## Overview

This skill covers the usage of ShadCN/ui components in Sound Connect. ShadCN provides accessible, customizable components built on Radix UI primitives. Components are installed directly into the codebase and can be customized as needed.

## Critical Rules

### DO NOT MODIFY UI Components

**NEVER modify files in `apps/web/src/shared/components/ui/`** - these are ShadCN auto-generated components.

If customization is needed:
1. Create a wrapper component in feature-specific directories
2. Use the `cn()` utility to extend styles
3. Pass custom classNames through props

### Import Pattern

Always import from the shared UI directory:

```tsx
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/shared/components/ui/form';
```

## Available Components

Sound Connect includes these ShadCN components:

| Component | Import Path | Primary Use |
|-----------|-------------|-------------|
| Alert | `@/shared/components/ui/alert` | Status messages, warnings |
| AlertDialog | `@/shared/components/ui/alert-dialog` | Confirmations, destructive actions |
| AspectRatio | `@/shared/components/ui/aspect-ratio` | Consistent media ratios |
| Avatar | `@/shared/components/ui/avatar` | User/band profile images |
| Badge | `@/shared/components/ui/badge` | Status indicators, tags |
| Button | `@/shared/components/ui/button` | Actions, form submission |
| Card | `@/shared/components/ui/card` | Content containers |
| Checkbox | `@/shared/components/ui/checkbox` | Boolean inputs |
| Collapsible | `@/shared/components/ui/collapsible` | Expandable sections |
| Command | `@/shared/components/ui/command` | Command palettes, search |
| Dialog | `@/shared/components/ui/dialog` | Modal overlays |
| DropdownMenu | `@/shared/components/ui/dropdown-menu` | Action menus |
| Form | `@/shared/components/ui/form` | Form field wrappers |
| Input | `@/shared/components/ui/input` | Text inputs |
| Label | `@/shared/components/ui/label` | Form labels |
| NavigationMenu | `@/shared/components/ui/navigation-menu` | Site navigation |
| Popover | `@/shared/components/ui/popover` | Floating content |
| Progress | `@/shared/components/ui/progress` | Progress indicators |
| ScrollArea | `@/shared/components/ui/scroll-area` | Custom scrollbars |
| Select | `@/shared/components/ui/select` | Dropdown selections |
| Separator | `@/shared/components/ui/separator` | Visual dividers |
| Sheet | `@/shared/components/ui/sheet` | Slide-out panels |
| Skeleton | `@/shared/components/ui/skeleton` | Loading placeholders |
| Tabs | `@/shared/components/ui/tabs` | Tabbed interfaces |
| Textarea | `@/shared/components/ui/textarea` | Multi-line text |
| Tooltip | `@/shared/components/ui/tooltip` | Hover hints |
| Sonner (Toaster) | `@/shared/components/ui/sonner` | Toast notifications |

## Z-Index Token System

Sound Connect uses a centralized z-index system. **ALWAYS use semantic tokens instead of numeric values.**

### Token Reference

| Token | Value | Use Case |
|-------|-------|----------|
| `z-base` | 0 | Default layer for normal content |
| `z-dropdown` | 1 | Dropdown menus (not popovers) |
| `z-sticky` | 10 | Sticky headers and navigation |
| `z-sidebar` | 60 | Sidebar navigation (main layout) |
| `z-dialog` | 100 | Dialog/modal overlays |
| `z-popover` | 110 | Popover components (emoji picker, tooltips) |
| `z-tooltip` | 120 | Tooltip overlays (highest priority) |

### Usage

```tsx
<DialogContent className="z-dialog">...</DialogContent>
<PopoverContent className="z-popover">...</PopoverContent>
<TooltipContent className="z-tooltip pointer-events-none">...</TooltipContent>
```

### Z-Index Rules

1. **ALWAYS** use semantic tokens (e.g., `z-popover`) not numeric values (e.g., `z-[110]`)
2. **NEVER** use arbitrary values like `z-[999]` or `z-50`
3. Tooltips **MUST** use `pointer-events-none` to prevent hover interference
4. If a new layer is needed, add it to the token system first

### Defined In

- CSS variables: `apps/web/src/styles/globals.css` (lines 172-178)
- Tailwind config: `apps/web/tailwind.config.ts` (theme.extend.zIndex)

## Form Components

Forms use react-hook-form with Zod validation and ShadCN form components.

### Form Pattern

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';

const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128)
});

const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        email: '',
        password: ''
    }
});

<Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    </form>
</Form>
```

### Form Component Hierarchy

- `Form` - Wraps the entire form (extends FormProvider)
- `FormField` - Connects a field to react-hook-form via Controller
- `FormItem` - Container for a single form field
- `FormLabel` - Accessible label (auto-linked to input)
- `FormControl` - Wraps the input element
- `FormMessage` - Displays validation errors
- `FormDescription` - Optional help text

## Dialog Patterns

### Basic Dialog

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';

<Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
        <Button>Open Dialog</Button>
    </DialogTrigger>
    <DialogContent className="z-dialog">
        <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
        </DialogHeader>
        {/* Content */}
    </DialogContent>
</Dialog>
```

### Alert Dialog (Confirmations)

```tsx
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from '@/shared/components/ui/alert-dialog';

<AlertDialog>
    <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
    </AlertDialogTrigger>
    <AlertDialogContent className="z-dialog">
        <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
    </AlertDialogContent>
</AlertDialog>
```

## Sheet Patterns

Sheets are slide-out panels, useful for mobile navigation or secondary content.

```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/components/ui/sheet';

<Sheet>
    <SheetTrigger asChild>
        <Button>Open Sheet</Button>
    </SheetTrigger>
    <SheetContent side="right">
        <SheetHeader>
            <SheetTitle>Sheet Title</SheetTitle>
        </SheetHeader>
        {/* Content */}
    </SheetContent>
</Sheet>
```

**Side options:** `top`, `right`, `bottom`, `left`

## Popover Patterns

```tsx
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';

<Popover>
    <PopoverTrigger asChild>
        <Button>Open Popover</Button>
    </PopoverTrigger>
    <PopoverContent className="z-popover" side="bottom" align="start">
        {/* Content */}
    </PopoverContent>
</Popover>
```

## Tooltip Patterns

```tsx
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip';

<Tooltip>
    <TooltipTrigger asChild>
        <Button>Hover me</Button>
    </TooltipTrigger>
    <TooltipContent className="z-tooltip pointer-events-none">
        Tooltip text
    </TooltipContent>
</Tooltip>
```

**Important:** Always add `pointer-events-none` to TooltipContent to prevent hover interference.

## Toast Notifications (Sonner)

### Setup

The Toaster is configured in `__root.tsx`:

```tsx
import { Toaster } from '@/shared/components/ui/sonner';

// In component JSX
<Toaster />
```

### Usage

```tsx
import { toast } from 'sonner';

toast.success('Profile updated');

toast.error('Could not save changes', {
    description: 'Please try again later'
});

toast.info('New message received');

toast.warning('Session expiring soon');

toast.loading('Saving...');
```

### Toast Options

```tsx
toast.success('Success', {
    description: 'Additional context',
    duration: 5000,
    action: {
        label: 'Undo',
        onClick: () => handleUndo()
    }
});
```

## Button Variants

```tsx
import { Button } from '@/shared/components/ui/button';

<Button>Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon Only</Button>
<Button size="icon-sm">Small Icon</Button>
<Button size="icon-lg">Large Icon</Button>
```

## cn() Utility

Use the `cn()` utility to merge Tailwind classes safely:

```tsx
import { cn } from '@/shared/lib/utils';

<div className={cn(
    'base-classes',
    isActive && 'active-classes',
    className
)}>
```

## MCP Tools

Use the `mcp__shadcn__*` tools for component information:

- `mcp__shadcn__get_project_registries` - Get configured registries
- `mcp__shadcn__list_items_in_registries` - List available components
- `mcp__shadcn__search_items_in_registries` - Search for components
- `mcp__shadcn__view_items_in_registries` - View component details
- `mcp__shadcn__get_item_examples_from_registries` - Get usage examples
- `mcp__shadcn__get_add_command_for_items` - Get CLI add command
- `mcp__shadcn__get_audit_checklist` - Post-generation verification

### Adding New Components

```bash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add dialog sheet popover
```

## Context7 Documentation

For latest ShadCN documentation, use Context7:

```
mcp__context7__get-library-docs with context7CompatibleLibraryID: "/shadcn-ui/ui"
```

Topics to query:
- `form` - Form component patterns
- `dialog` - Dialog/modal patterns
- `sheet` - Sheet patterns
- `popover` - Popover patterns
- `tooltip` - Tooltip patterns
- `toast` - Toast/sonner patterns
