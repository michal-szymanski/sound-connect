---
name: magic-ui
description: Magic UI enhanced animation and effect components for React. Use this skill when adding polished animations, text effects, special effects, or interactive components to Sound Connect interfaces while maintaining brand consistency.
---

# Magic UI Components

## Overview

Magic UI provides enhanced animation and effect components for React applications. These components add polish and delight to Sound Connect interfaces through smooth animations, interactive effects, and visual feedback. All components should be used thoughtfully to enhance—not overwhelm—the user experience.

## MCP Tool Overview

Access Magic UI documentation through these MCP tools:

| Tool | Returns |
|------|---------|
| `mcp___magicuidesign_mcp__getAnimations` | blur-fade |
| `mcp___magicuidesign_mcp__getTextAnimations` | text-animate, line-shadow-text, aurora-text, number-ticker, animated-shiny-text, animated-gradient-text, text-reveal, hyper-text, word-rotate, typing-animation, scroll-based-velocity, flip-text, box-reveal, sparkles-text, morphing-text, spinning-text |
| `mcp___magicuidesign_mcp__getButtons` | rainbow-button, shimmer-button, shiny-button, interactive-hover-button, animated-subscribe-button, pulsating-button, ripple-button |
| `mcp___magicuidesign_mcp__getBackgrounds` | warp-background, flickering-grid, animated-grid-pattern, retro-grid, ripple, dot-pattern, grid-pattern, interactive-grid-pattern |
| `mcp___magicuidesign_mcp__getSpecialEffects` | animated-beam, border-beam, shine-border, magic-card, meteors, neon-gradient-card, confetti, particles, cool-mode, scratch-to-reveal |
| `mcp___magicuidesign_mcp__getComponents` | marquee, terminal, hero-video-dialog, bento-grid, animated-list, dock, globe, tweet-card, orbiting-circles, avatar-circles, icon-cloud, animated-circular-progress-bar, file-tree, code-comparison, scroll-progress, lens, pointer |
| `mcp___magicuidesign_mcp__getDeviceMocks` | safari, iphone-15-pro, android |

## Animations

### Blur Fade

Smooth fade-in with blur effect. Excellent for page entrances and content reveals.

**When to use:**
- Page load animations
- Staggered content reveals
- Section transitions

**Sound Connect use cases:**
- Profile page sections loading
- Discovery results appearing
- Modal content entrance

**Example:**
```tsx
import { BlurFade } from '@/components/magicui/blur-fade';

<BlurFade delay={0.1}>
    <Card>...</Card>
</BlurFade>

{items.map((item, index) => (
    <BlurFade key={item.id} delay={0.1 + index * 0.05}>
        <ItemCard item={item} />
    </BlurFade>
))}
```

## Text Animations

### Number Ticker

Animate counting numbers. Great for statistics.

**When to use:**
- Follower counts
- Match percentages
- Profile completion scores
- Statistics on landing pages

**Example:**
```tsx
import { NumberTicker } from '@/components/magicui/number-ticker';

<NumberTicker value={followersCount} />
<NumberTicker value={matchScore} />% match
```

### Text Animate

General text animation with multiple effects.

**Sound Connect use cases:**
- "Discover Bands" page title
- Welcome messages
- Feature announcements

### Animated Gradient Text

Gradient that animates through colors.

**When to use sparingly:**
- Special promotions
- Featured content headers
- Call-to-action text

**Caution:** Use Sound Connect brand colors (primary cyan) in the gradient.

### Typing Animation

Characters appearing as if typed.

**When to use:**
- Onboarding flows
- Chatbot-style interactions
- Tutorial text

### Word Rotate

Rotating through word options.

**Sound Connect use cases:**
- Hero section: "Find your next [drummer, guitarist, vocalist]"
- Feature highlights

```tsx
<span>Find your next </span>
<WordRotate words={['drummer', 'guitarist', 'vocalist', 'bandmate']} />
```

### Hyper Text

Scrambled letter reveal effect.

**When to use sparingly:**
- Band names on hover
- Achievement reveals
- Special announcements

## Buttons

### Shimmer Button

Button with traveling light effect.

**When to use:**
- Primary CTAs on landing pages
- Special actions (Apply to Band, Join Now)
- Limited to 1-2 per page

**Sound Connect use cases:**
- "Get Started" on landing page
- "Apply Now" for band applications

### Shiny Button

Subtle shine effect.

**When to use:**
- Secondary prominent actions
- Upgrade prompts

### Pulsating Button

Attention-grabbing pulse animation.

**When to use very sparingly:**
- Critical actions requiring attention
- Time-sensitive prompts
- New feature highlights

### Ripple Button

Material-style ripple on click.

**When to use:**
- Interactive feedback on actions
- Mobile-friendly touch feedback

## Backgrounds

### Grid Pattern

SVG-based grid background.

**When to use:**
- Landing page hero sections
- Empty state backgrounds
- Card backgrounds (subtle)

**Example:**
```tsx
<div className="relative">
    <GridPattern className="opacity-20" />
    <div className="relative z-10">
        {/* Content */}
    </div>
</div>
```

### Dot Pattern

Dotted background pattern.

**When to use:**
- Subtle texture on sections
- Card decorations
- Empty state backgrounds

### Animated Grid Pattern

Grid with animation effect.

**When to use sparingly:**
- Hero sections
- Feature showcases
- Landing page backgrounds

### Retro Grid

Perspective grid effect.

**When to use very sparingly:**
- Landing page hero (if fits aesthetic)
- Special promotional sections

**Caution:** May not fit Sound Connect's professional aesthetic. Use carefully.

### Flickering Grid

Grid with flickering cells.

**When to use very sparingly:**
- Creative landing sections
- Achievement celebrations

## Special Effects

### Confetti

Celebration particles.

**When to use:**
- Successful band application accepted
- Profile completion milestone
- First follower/connection
- Achievement unlocks

```tsx
import { Confetti } from '@/components/magicui/confetti';

<Confetti trigger={showSuccess} />
```

### Animated Beam

Light beam traveling along path.

**Sound Connect use cases:**
- Showing connection between musicians
- Feature showcase on landing page

### Border Beam

Light traveling around border.

**When to use:**
- Highlight premium features
- Featured content cards
- Special announcements

### Magic Card

Spotlight effect following cursor.

**Sound Connect use cases:**
- Featured musician spotlight
- Premium band listings

### Shine Border

Animated gradient border.

**When to use:**
- Highlight important cards
- Featured content
- Premium features

### Particles

Background particle effects.

**When to use sparingly:**
- Landing page atmosphere
- Celebration moments
- Special pages

## Components

### Animated List

Sequential item animations.

**Sound Connect use cases:**
- Notification dropdown
- Recent activity feed
- Band member additions

```tsx
<AnimatedList>
    {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
    ))}
</AnimatedList>
```

### Avatar Circles

Overlapping avatar display.

**Sound Connect use cases:**
- Band member avatars in cards
- "X and Y others follow this band"

```tsx
<AvatarCircles avatars={members.slice(0, 4)} />
```

### Bento Grid

Feature showcase layout.

**When to use:**
- Landing page features
- Dashboard widgets
- Feature highlights

### Marquee

Infinite scrolling content.

**Sound Connect use cases:**
- Landing page social proof
- Featured bands carousel

### Scroll Progress

Progress indicator for page scroll.

**When to use:**
- Long-form content
- Profile pages
- Documentation

## Usage Guidelines

### DO

1. **Use blur-fade for page transitions** - Most versatile, always appropriate
2. **Use number-ticker for statistics** - Adds life to numbers
3. **Use confetti sparingly for celebrations** - Reserve for meaningful moments
4. **Use animated-list for real-time feeds** - Notifications, activity
5. **Use avatar-circles for compact user displays** - Band members, followers
6. **Respect reduced motion preferences** - All Magic UI components should respect `prefers-reduced-motion`

### DON'T

1. **Don't overuse text animations** - One per page maximum
2. **Don't use rainbow/gradient effects excessively** - Conflicts with brand
3. **Don't use multiple button effects on same page** - Choose one style
4. **Don't use background effects everywhere** - Reserve for hero sections
5. **Don't use effects that distract from content** - Enhance, don't overwhelm
6. **Don't use retro-grid or heavy patterns** - May not fit professional aesthetic

## Brand Color Integration

When using gradient or color-based effects, prefer:

```tsx
className="from-primary to-primary/60"

className="from-muted to-background"
```

**Avoid:**
- Rainbow gradients
- Non-brand accent colors
- High-contrast clashing colors

## Performance Considerations

1. **Limit simultaneous animations** - Max 3-4 animating elements visible at once
2. **Use blur-fade over complex animations** - Better performance
3. **Lazy load heavy components** - globe, particles, etc.
4. **Test on mobile devices** - Some effects are CPU-intensive
5. **Provide fallbacks** - When animations disabled

## Installation

Magic UI components are installed via shadcn CLI:

```bash
pnpm dlx shadcn@latest add "https://magicui.design/r/blur-fade"
pnpm dlx shadcn@latest add "https://magicui.design/r/number-ticker"
pnpm dlx shadcn@latest add "https://magicui.design/r/confetti"
```

Components install to `src/components/magicui/`.

## Component Lookup

When you need implementation details, call the appropriate MCP tool:

```
mcp___magicuidesign_mcp__getAnimations -> blur-fade details
mcp___magicuidesign_mcp__getTextAnimations -> all text animation details
mcp___magicuidesign_mcp__getSpecialEffects -> confetti, beam, etc. details
```

Each tool returns full implementation code, dependencies, and usage examples.
