---
name: launch-plan
description: Guide for scoping MVPs and shipping fast. Invoke manually when starting a new project or feature. NOT auto-invoked by agents.
---

# Launch Planning Guide

## Purpose

This guide helps you scope MVPs and ship fast. Use it when starting a new project, planning a new feature, or when you need to cut scope to meet a deadline. The goal: get something in front of real users as quickly as possible to validate your idea.

## Core Principles

- Ship fast, validate with real users, iterate based on feedback
- No feature creep - cut ruthlessly until only the core remains
- Real users > perfect code
- Validate the idea before polishing the implementation
- One week max from idea to deployed MVP

## The Three Questions

Ask these EVERY time before building anything:

1. **Who is this for?**
   - Be specific - "developers" is too broad
   - "Indie developers building SaaS" is better

2. **What's the ONE problem it solves?**
   - If you can't explain it in one sentence, scope is too big

3. **How will I know if it works?**
   - Define success criteria upfront
   - Examples: signups, usage, payments, return visits

## MVP Scoping Rules

### 1. Core User Loop ONLY
- What's the ONE thing users must do? Build only that.
- Example: For a habit tracker, the loop is "add habit -> mark complete -> see streak." Everything else is noise.

### 2. One Week Rule
- If a feature takes more than 1 week to build, it's not MVP
- Break it down or cut it entirely
- "We'll add it later" is almost always the right answer

### 3. Auth Last, Not First
- Don't build auth until you validate the core idea
- Start with a single hardcoded user for testing
- Add auth only when you have real users wanting to sign up

### 4. No Admin Panels
- Manual admin work via database console or SQL queries is fine for MVP
- Build admin features only when manual work becomes painful

### 5. Mobile-Responsive, Not Native
- Web-first, make it responsive
- Don't build iOS/Android apps until web version is validated

### 6. Fake It Before You Build It
- Hardcode data instead of building complex logic
- Manual processes > automation (at first)
- Wizard of Oz testing is your friend

## Common Mistakes

Watch for these and push back hard:

| Mistake | Response |
|---------|----------|
| "Just one more feature before launch" | No. Ship now, add later. |
| "We need auth first" | No. Validate with fake users first. |
| "Let's add a settings page" | What settings? MVP shouldn't have settings. |
| "Let me refactor this first" | No. Refactor after users validate the idea. |
| "We need analytics/monitoring/logging" | Basic console logs are enough for MVP. |
| "What about edge cases?" | Handle them manually at first. Automate later. |
| "We should support X, Y, and Z use cases" | Pick ONE use case. Nail it. Expand later. |

## PRD Template

Use this structure for defining your MVP:

```markdown
# [Product Name] - MVP PRD

## The Three Questions
- **Who is this for?** [Specific target user]
- **What's the ONE problem it solves?** [One sentence]
- **How will we know if it works?** [Success metric]

## Core User Loop
[3-5 steps describing the essential user flow]

Example:
1. User lands on homepage
2. User creates a new [thing]
3. User sees their [thing] in a list
4. User shares [thing] publicly

## Must-Have Features (Week 1)
- [ ] Feature 1: [Why it's essential to the core loop]
- [ ] Feature 2: [Why it's essential to the core loop]
- [ ] Feature 3: [Why it's essential to the core loop]

[Keep this to 3-5 features MAX]

## Explicitly NOT Building (v1)
- Feature X - can do manually
- Feature Y - wait for user demand
- Feature Z - not core to the loop

## Success Criteria (First Week)
- [Metric 1]: [Target]
- [Metric 2]: [Target]

Example:
- 10 signups
- 5 users complete the core loop
- 2 users return day 2

## Timeline
- Day 1-2: Core functionality
- Day 3-4: Basic UI polish
- Day 5: Deploy + test with 2-3 people
- Day 6-7: Fix critical bugs, iterate based on feedback
```

## Starter Prompt Template

Use this structure when you're ready to start building:

```markdown
Build a [product name] MVP with the following specs:

**Core Functionality:**
[3-5 bullet points describing must-have features]

**Database Schema:**
[Simple schema with 2-4 tables max]

**Key Routes:**
1. / - [description]
2. /[route] - [description]
3. /api/[endpoint] - [description]

**User Flow:**
[Step-by-step description of the core loop]

**Implementation Notes:**
- Start without auth (hardcode user ID)
- Keep UI minimal but functional
- Focus on the core loop, ignore edge cases for now

**What NOT to build:**
- [Feature to skip]
- [Feature to skip]
- [Feature to skip]

Ship this in 1 week max.
```

## Decision Framework

When making decisions during development, use this framework:

### Is this feature essential to the core loop?
- **Yes** -> Build it
- **No** -> Defer it

### Can we fake/manual this for now?
- **Yes** -> Don't build it, do it manually
- **No** -> Build the simplest version possible

### Will this take more than 1 day?
- **Yes** -> Find a simpler approach or cut it
- **No** -> Proceed

### Is this optimization/polish?
- **Yes** -> Ship first, polish later
- **No** -> Proceed

## Examples

### Good Scoping Decisions

**Habit Tracker MVP:**
- Build: Add habit, mark complete, view streak
- Skip: Categories, reminders, statistics, social sharing, themes
- Fake: Hardcode streak calculation, no timezone handling

**Link Sharing Tool MVP:**
- Build: Add link, view links, copy link
- Skip: Tags, search, analytics, team sharing, browser extension
- Fake: No URL validation, manual duplicate handling

**Feedback Collection MVP:**
- Build: Create form, submit response, view responses
- Skip: Templates, branching logic, export, analytics dashboard
- Fake: Email notification instead of real-time updates

### Cutting Features Ruthlessly

**Before:** "Users can create projects, add tasks, set due dates, assign team members, add comments, attach files, set priorities, create subtasks, and view in kanban or list view."

**After:** "Users can create a task and mark it complete."

That's it. Ship that. See if anyone uses it. Then add features based on what users actually ask for.

## Summary

1. Answer the Three Questions before writing any code
2. Define the core user loop (3-5 steps max)
3. List must-have features (3-5 max)
4. Explicitly list what you're NOT building
5. Set a 1-week deadline
6. Ship something imperfect that real users can try

Most features can wait. Most polish can wait. What can't wait is getting something in front of real users to validate if this is worth building at all.
