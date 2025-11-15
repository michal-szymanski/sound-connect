---
name: shadcn-ui
description: ShadCN UI patterns for Sound Connect - component composition, forms, dialogs, accessibility, theme integration, and never modifying ui/ components
---

# ShadCN UI Skill for Sound Connect

## Core Concepts

1. **Copy-Paste Components** - Components live in `shared/components/ui/`
2. **Composition Over Configuration** - Build complex UIs from primitives
3. **Accessibility First** - ARIA attributes and keyboard navigation
4. **Theme Integration** - CSS variables for consistent theming
5. **Radix UI Primitives** - Built on unstyled, accessible components

## Sound Connect Patterns

### 1. Form Components
```tsx
// Using form components with validation
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';

<div className="space-y-2">
    <Label htmlFor="name">
        Band Name <span className="text-destructive">*</span>
    </Label>
    <Input
        id="name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Enter band name"
        maxLength={100}
        aria-required="true"
        aria-invalid={!!errors['name']}
        aria-describedby={errors['name'] ? 'name-error' : undefined}
    />
    {errors['name'] && (
        <p id="name-error" className="text-destructive text-sm" role="alert">
            {errors['name']}
        </p>
    )}
</div>
```

### 2. Card Layouts
```tsx
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';

<Card className="border-border/40 bg-card">
    <CardHeader>
        <CardTitle>Band Profile</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
        {/* Content */}
    </CardContent>
    <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
    </CardFooter>
</Card>
```

### 3. Dialog Patterns
```tsx
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/shared/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
    <DialogTrigger asChild>
        <Button>Open Dialog</Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
                Make changes to your profile here.
            </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            {/* Form fields */}
        </div>
        <DialogFooter>
            <Button type="submit">Save changes</Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
```

### 4. Alert Dialog for Confirmations
```tsx
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/shared/components/ui/alert-dialog';

<AlertDialog open={showDelete} onOpenChange={setShowDelete}>
    <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete
                the band and remove all members.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground"
            >
                Delete
            </AlertDialogAction>
        </AlertDialogFooter>
    </AlertDialogContent>
</AlertDialog>
```

### 5. Dropdown Menus
```tsx
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/shared/components/ui/dropdown-menu';

<DropdownMenu modal={false}>
    <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Options">
            <MoreHorizontal className="h-4 w-4" />
        </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleEdit}>
            Edit
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
            <Link to="/posts/$id" params={{ id: post.id }}>
                View Details
            </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
        >
            Delete
        </DropdownMenuItem>
    </DropdownMenuContent>
</DropdownMenu>
```

### 6. Tabs Interface
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';

<Tabs defaultValue="posts" className="w-full">
    <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="posts">Posts</TabsTrigger>
        <TabsTrigger value="about">About</TabsTrigger>
        <TabsTrigger value="members" className="relative">
            Members
            {pendingCount > 0 && (
                <Badge className="ml-2" variant="destructive">
                    {pendingCount}
                </Badge>
            )}
        </TabsTrigger>
    </TabsList>
    <TabsContent value="posts" className="space-y-4">
        <PostFeed />
    </TabsContent>
    <TabsContent value="about">
        <AboutSection />
    </TabsContent>
    <TabsContent value="members">
        <MembersGrid />
    </TabsContent>
</Tabs>
```

### 7. Loading States
```tsx
import { Skeleton } from '@/shared/components/ui/skeleton';

// Skeleton for cards
<Card>
    <CardContent className="p-6">
        <div className="flex gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
            </div>
        </div>
    </CardContent>
</Card>

// Skeleton for lists
<div className="space-y-4">
    {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
    ))}
</div>
```

## Common Tasks

### Adding a New UI Component
1. Install via CLI: `pnpm dlx shadcn@latest add [component]`
2. Component added to `shared/components/ui/`
3. Import and use in feature components
4. Never modify the UI component directly

### Customizing Component Styles
1. Use className prop for one-off styles
2. Use variant props when available
3. Extend with cn() utility for conditional classes
4. Override CSS variables for theme changes

### Building Accessible Forms
1. Always use Label with htmlFor
2. Add aria-required for required fields
3. Use aria-invalid for error states
4. Include aria-describedby for error messages
5. Add role="alert" for error text

### Creating Responsive Layouts
1. Use responsive prefixes: `sm:`, `md:`, `lg:`
2. Grid system: `grid grid-cols-1 md:grid-cols-2`
3. Stack on mobile: `flex flex-col sm:flex-row`
4. Hide on mobile: `hidden sm:block`

## Anti-Patterns to Avoid

- ❌ Modifying files in `/ui/` directory directly
- ❌ Not using asChild for trigger components
- ❌ Forgetting modal={false} on nested dropdowns
- ❌ Missing accessibility attributes
- ❌ Using inline styles instead of className
- ❌ Not handling loading/error states

## Integration Guide

- **With Forms**: Combine with react-hook-form or manual validation
- **With Router**: Use asChild with Link components
- **With Themes**: Leverages CSS variables from globals.css
- **With Icons**: Use lucide-react for consistent icons
- **With Animations**: Tailwind transitions and framer-motion

## Quick Reference

```tsx
// Common imports
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';

// Button variants
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>

// Size variants
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>

// Common patterns
<Button asChild>
    <Link to="/path">Link Button</Link>
</Button>
```

## Real Examples from Codebase

- **Complex Form**: `apps/web/src/features/bands/components/band-form.tsx`
- **Dialog Usage**: `apps/web/src/features/posts/components/add-post-dialog.tsx`
- **Tabs Layout**: `apps/web/src/routes/(main)/bands/$id.tsx`
- **Cards**: `apps/web/src/features/posts/components/post.tsx`
- **Dropdowns**: `apps/web/src/shared/components/common/account-button.tsx`
