---
name: branding
description: Sound Connect visual identity and brand guidelines. Use this skill when making UI decisions, writing copy, or ensuring consistency across the platform. Covers color palette, typography, terminology, and tone of voice for a musician-focused social platform.
---

# Sound Connect Branding

Sound Connect is a social platform connecting musicians - bands finding members, musicians finding bands. This skill defines the visual identity, terminology, and voice that make the platform feel authentic to its musician audience.

## Mission

Help musicians find their next musical connection. Whether a guitarist seeking a band, a band searching for a drummer, or musicians wanting to collaborate - Sound Connect makes it easy to discover, connect, and create music together.

## Visual Identity

### Color Palette

Sound Connect uses OKLCH color space for perceptually uniform colors. The primary cyan/teal color remains consistent across light and dark themes.

**Primary (Cyan/Teal)**
```
oklch(0.72 0.14 200)
```
Used for: Primary buttons, links, focus rings, active states, brand accents.

**Destructive (Orange-Red)**
```
Light: oklch(0.58 0.22 25)
Dark:  oklch(0.65 0.22 25)
```
Used for: Delete actions, error states, critical warnings.

**Dark Theme (Preferred)**
```
Background:     oklch(0.145 0.015 240)  // Deep blue-gray
Card:           oklch(0.185 0.012 240)
Popover:        oklch(0.225 0.01 240)
Border:         oklch(0.285 0.015 240)
Muted text:     oklch(0.68 0.01 240)
Foreground:     oklch(0.965 0.005 240)
```

**Light Theme**
```
Background:     oklch(0.985 0.006 200)
Card:           oklch(0.995 0.005 200)
Popover:        oklch(0.998 0.003 200)
Border:         oklch(0.88 0.012 200)
Muted text:     oklch(0.48 0.012 200)
Foreground:     oklch(0.165 0.015 200)
```

**Usage Rules**
- Dark theme is the platform identity - design dark-first
- Primary color (hue 200) is constant across themes
- Use semantic tokens (`bg-background`, `text-primary`) not raw values
- Destructive color is warmer in dark mode for better visibility

### Typography

System font stack (subject to change):
```
ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif
```

No custom logo yet - the name "Sound Connect" is rendered in the primary font.

### Design System Tokens

**Border Radius**
```
--radius: 0.625rem (10px)
sm: 6px, md: 8px, lg: 10px, xl: 14px
```

**Z-Index Layers**
```
base:     0     // Default content
dropdown: 1     // Dropdown menus
sticky:   10    // Sticky headers
sidebar:  60    // Main navigation sidebar
dialog:   100   // Modal overlays
popover:  110   // Emoji picker, tooltips
tooltip:  120   // Highest priority overlays
```

**Shadows**
Subtle shadows in both themes. Dark theme uses same shadow definitions (black with 5-25% opacity) which creates depth without harsh contrast.

## Terminology

### Preferred Terms

| Use | Instead of |
|-----|------------|
| Band | Group, ensemble, team |
| Musician | Player, performer, artist |
| Member | Bandmate |
| Apply | Request to join |
| Connect | Network |

### User Types

- **Musician**: Primary user term. All users are musicians regardless of skill level.
- **Band**: Any musical group (duo to orchestra). Never "group" in UI.
- **Admin**: Band administrator with management permissions.
- **Follower**: Someone following a user or band.

### Feature-Specific Terms

- **Looking for**: Band recruitment section (not "seeking" or "hiring")
- **Availability status**: User's openness to opportunities
  - Actively Looking (green)
  - Open to Offers (blue)
  - Not Looking (gray)
  - Just Browsing (yellow)
- **Primary instrument**: Main instrument (not "main" or "first")
- **Additional instruments**: Secondary instruments (not "other" or "secondary")

### Genre Handling

The platform supports 44+ genres. Use exact genre names as defined in the system - do not abbreviate or modify. When displaying multiple genres, primary genre appears first.

## Voice and Tone

### Personality

- **Professional but approachable**: Like talking to a fellow musician who takes their craft seriously
- **Encouraging**: Celebrate connections and progress
- **Genre-aware**: Respect all musical styles equally
- **Instrument-specific**: Use accurate terminology for each instrument family

### Writing Guidelines

**Do:**
- Use active voice: "Find your next band" not "Your next band can be found"
- Be direct: "Add your instruments" not "Would you like to add your instruments?"
- Celebrate success: "Nice! You're now following [band]"
- Keep it musical: Reference the creative journey

**Avoid:**
- Corporate jargon: No "leverage", "synergy", "optimize your network"
- Excessive enthusiasm: No multiple exclamation points!!!
- Generic social media speak: No "content", "engagement", "reach"
- Condescension: Assume users know their craft

### Example Copy

**Empty States**
- "No messages yet. Start a conversation with a musician or band."
- "You're not following any bands yet. Discover bands looking for members like you."

**Success Messages**
- "You're now a member of [band name]"
- "Application sent. The band will be notified."

**Error Messages**
- "Couldn't send message. Check your connection and try again."
- "This band isn't accepting applications right now."

**CTAs**
- "Find Musicians" (not "Search Users")
- "Create a Band" (not "Start a Group")
- "Send Message" (not "Start Chat")

## Implementation Notes

This skill defines WHAT the brand is. For HOW to implement:
- Component styling: Use **shadcn** skill
- React implementation: Use **react** skill
- Complex UI features: Use **frontend-design** skill

Color values are defined in `apps/web/src/styles/globals.css`. Always use CSS variables through Tailwind classes rather than hardcoding OKLCH values.
