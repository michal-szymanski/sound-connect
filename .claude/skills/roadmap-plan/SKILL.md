---
name: roadmap-plan
description: Guide for prioritizing product features using impact/effort framework. Invoke manually when planning what to build next. NOT auto-invoked by agents.
---

# Roadmap Planning Guide

## Purpose

This guide helps you decide what to build next by applying a rigorous prioritization framework. Use it when you have multiple feature ideas competing for attention, or when you need to evaluate whether a specific feature is worth building right now.

## Prioritization Framework

### Impact vs Effort Matrix

Classify every feature into one of four quadrants:

| Quadrant | Impact | Effort | Action |
|----------|--------|--------|--------|
| Quick Wins | High | Low | Do first |
| Big Bets | High | High | Plan carefully |
| Fill-ins | Low | Low | Do if time permits |
| Money Pit | Low | High | Don't do |

**Impact** = How much does this move your core metric?
**Effort** = Time to build + maintain + complexity

### Priority Categories (in order)

1. **Retention** - Keep users coming back
2. **Core Features** - Essential to the core use case
3. **Monetization** - Make money (only after product-market fit)
4. **Growth** - Get more users (only after retention is solid)

Never prioritize growth over retention. Leaky bucket problem.

### Stage-Based Rules

**Pre-launch** (not live with real users yet):
- ONLY core loop features
- ONLY things users need to complete one full cycle
- Everything else is distraction

**Post-launch** (have real users, < 1000 active):
- ONLY features users explicitly request (with data)
- Watch what they actually do, not what they say
- Build for retention first
- Ignore vanity features

**Growth phase** (retention is solid, > 1000 active):
- Features that reduce churn
- Features that increase sharing/invites
- Infrastructure for scale
- Monetization experiments

## Critical Questions

Ask these about every feature idea:

1. **Does this serve the core use case?**
   - If no, reject immediately

2. **Will users actually use this or just say they want it?**
   - Ask: "How many times per week would a user use this?"
   - If < 1 time per week, probably not core

3. **Can we fake it first to validate demand?**
   - Manual process before automation
   - Fake button to measure clicks
   - Concierge test with first 10 users

4. **What's the simplest version that proves value?**
   - Cut scope by 80%
   - What's the one thing this feature must do?

5. **What metric will this move?**
   - If you can't name a specific metric, don't build it
   - Vanity metrics don't count (total users, signups)
   - Real metrics: retention, DAU/MAU ratio, engagement, connections made

## Red Flags

Reject features with these red flags:

- **Feature creep** - "It would be cool if..." or "Users might want..."
- **Premature optimization** - "We need caching" when you have 10 users
- **Imaginary users** - "Enterprise users will need..." (but you don't have enterprise users)
- **Competitor copying** - "[Competitor] has this" (you're not them)
- **Founder vanity** - "I personally want..." (you're not the user)
- **Technology for technology's sake** - "Let's use AI" (for what problem?)

## Feature Evaluation Template

Use this format when evaluating features:

```
Feature: [Name]

Core use case alignment:
- Does it help users accomplish the core task? [Yes/No + explanation]
- Is it essential to the main user journey? [Yes/No + explanation]

Impact:
- What metric will this move? [Specific metric]
- How much? [Estimate]
- Category: [Retention/Core/Monetization/Growth]

Effort:
- Build time: [Days/Weeks]
- Complexity: [Low/Medium/High]
- Maintenance: [Ongoing cost]

Stage appropriateness:
- Current stage: [Pre-launch/Post-launch/Growth]
- Should we build this now? [Yes/No]

Validation:
- Can we fake it first? [How?]
- What's the MVP? [Simplest version]

Recommendation: [Do now / Do later / Don't do / Validate first]
Reasoning: [2-3 sentences]
```

## Examples

### Example 1: User Profiles (High Impact, Medium Effort)

```
Feature: Rich user profiles with detailed information

Core use case alignment:
- Helps users accomplish core task? YES - users need to present themselves
- Essential to main journey? YES - discovery requires profile information

Impact:
- Metric: Connections made, user discovery rate
- Estimate: Could 2-3x meaningful connections
- Category: Core feature

Effort:
- Build time: 2-3 weeks
- Complexity: Medium (multiple fields, validation, privacy settings)
- Maintenance: Low

Stage appropriateness:
- Current stage: Post-launch
- Should we build now? MAYBE - need to validate which fields matter most

Validation:
- Can we fake it? YES - start with 5 fields, add more based on usage
- MVP: Name, bio, location, primary skill, availability status

Recommendation: BUILD MVP FIRST
Reasoning: Core feature but don't overbuild. Start with essential fields, measure which ones users actually fill out, then expand based on data.
```

### Example 2: Advanced Analytics Dashboard (Low Impact, High Effort)

```
Feature: Detailed analytics dashboard showing user engagement metrics

Core use case alignment:
- Helps users accomplish core task? NO - not directly
- Essential to main journey? NO - nice to have

Impact:
- Metric: ??? (doesn't clearly move user metrics)
- Estimate: Might increase engagement, but unclear
- Category: Growth/Vanity

Effort:
- Build time: 2-3 weeks
- Complexity: High (data aggregation, charts, real-time updates)
- Maintenance: High (query optimization, new metrics requests)

Stage appropriateness:
- Current stage: Post-launch
- Should we build now? NO

Validation:
- Can we fake it? YES - export data to spreadsheet, analyze manually
- MVP: Not needed yet

Recommendation: DON'T BUILD
Reasoning: Doesn't serve core use case. Users don't need analytics to accomplish their goals. Use simple built-in analytics or manual queries. Build this only when you have data team bandwidth and clear product decisions blocked by lack of data.
```

### Example 3: Real-time Notifications (Medium Impact, Medium Effort)

```
Feature: Push notifications for important events

Core use case alignment:
- Helps users accomplish core task? YES - keeps users informed of relevant activity
- Essential to main journey? PARTIAL - improves engagement but not blocking

Impact:
- Metric: DAU/MAU ratio, return visits
- Estimate: Could increase return visits by 30-40%
- Category: Retention

Effort:
- Build time: 1-2 weeks
- Complexity: Medium (notification system, user preferences)
- Maintenance: Medium (delivery issues, preference management)

Stage appropriateness:
- Current stage: Post-launch
- Should we build now? MAYBE - only if retention is a problem

Validation:
- Can we fake it? YES - email notifications first, measure open rates
- MVP: Email only, top 3 notification types

Recommendation: FAKE IT FIRST
Reasoning: Start with email notifications for the most important events. Measure engagement. If users consistently open emails, invest in push notifications. Don't build complex notification infrastructure until you prove users want to be notified.
```

## Decision Summary

When evaluating what to build next:

1. **List all feature ideas**
2. **Run each through the evaluation template**
3. **Plot on impact/effort matrix**
4. **Consider current stage appropriateness**
5. **Prioritize: Quick Wins > Big Bets (planned) > Fill-ins**
6. **Never build Money Pit features**

Remember: Shipping fast matters, but shipping the right thing matters more. Focus beats features.
