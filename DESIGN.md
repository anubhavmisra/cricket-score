---
name: Cricket Score
description: Mobile-first live T20 scoring with a pitch-green accent and calm field-ready UI.
colors:
  background: "#f7faf7"
  foreground: "#1a2e1c"
  surface: "#ffffff"
  surface-muted: "#eef3ee"
  border: "#d4dfd5"
  muted: "#4a5f4d"
  primary: "#2d6b3a"
  primary-foreground: "#f7faf7"
  danger: "#b83232"
  success-bg: "#e8f3ea"
  success-border: "#b8d4bc"
  success-text: "#1e4a28"
  warning-bg: "#f5f0e0"
  warning-border: "#ddd0a8"
  warning-text: "#5c4a1a"
  info-bg: "#e8eef5"
  info-border: "#b8c8dc"
  info-text: "#1a3a5c"
typography:
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
  score:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.1
    fontFeature: "tnum"
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  lg: "0.75rem"
  xl: "1rem"
spacing:
  touch: "48px"
  section: "1rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.xl}"
    padding: "16px 24px"
  button-primary-hover:
    backgroundColor: "#245a2f"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "10px 12px"
---

# Design System: Cricket Score

## Overview

**Creative North Star: "The Groundsman's Phone"**

A scorer standing at mid-wicket in harsh daylight needs numbers first, buttons second, decoration never. The interface behaves like a well-kept scorebook brought onto a phone: flat surfaces, pitch-green accents, Geist for legibility, and enough contrast to read at arm's length in sun.

This system rejects broadcast graphics, SaaS landing clichés, and decorative cricket theming. Structure is quiet; the live total is loud.

**Key Characteristics:**
- Pitch-green primary on restrained neutral surfaces
- 48px minimum touch targets on scoring controls
- Flat elevation with borders and tonal layers, not shadows
- Sentence-case section labels, never uppercase kickers
- Visible focus rings on every interactive control

## Colors

A restrained product palette: tinted neutrals with one pitch-green accent for primary actions and focus rings.

### Primary
- **Pitch Green** (#2d6b3a / oklch(0.48 0.14 145)): Start scoring, create match, copy link, focus rings. Used on ≤15% of any screen.

### Neutral
- **Field Mist** (#f7faf7): Page background, slight green tint without cream warmth
- **Scorecard White** (#ffffff): Cards and inputs
- **Line Green** (#d4dfd5): Borders and dividers
- **Shade Text** (#4a5f4d): Labels, secondary copy (≥4.5:1 on background)

### Semantic
- **Dismissal Red** (#b83232): Wicket button and destructive confirms
- **Over Alert** (warning tokens): Offline banner, innings break, free hit
- **Extra Blue** (info tokens): Wide and no-ball pad buttons
- **Result Green** (success tokens): Match won banner

**The Score First Rule.** Primary green appears only on actions that move the match forward. Never on passive labels or decorative chrome.

## Typography

**Body Font:** Geist (system-ui fallback)

**Character:** Neutral, numeric-friendly sans. Tabular figures on scores. No display pairing needed.

### Hierarchy
- **Score** (700, 2.25rem, tabular-nums): Live runs/wickets in sticky header
- **Title** (600, 1.125rem): Form section headings
- **Body** (400, 1rem, 1.5): Copy and scorecard lines
- **Label** (500, 0.875rem): Field labels and section subheads (sentence case)

**The Fixed Scale Rule.** Product UI uses fixed rem sizes, not fluid clamp headings.

## Elevation

Flat by default. Depth comes from border + surface contrast (`surface` vs `surface-muted`), not shadows. Modals use a single `shadow-xl` to lift above the scrim; nothing else floats.

## Components

### Buttons
- **Shape:** 12px radius (`rounded-xl`), min 48px height on scoring pad
- **Primary:** Pitch green fill, white text, hover darkens 1 step
- **Secondary:** Surface fill, border, hover to surface-muted
- **Danger:** Red fill for wicket confirm
- **Focus:** 2px ring in primary color with background offset

### Cards / Containers
- **Corner Style:** 12px radius
- **Background:** White surface on field-mist page
- **Border:** 1px line-green; internal dividers instead of nested cards
- **Internal Padding:** 12–16px

### Inputs / Fields
- **Style:** Surface fill, border, 12px radius
- **Focus:** Shared focus ring utility
- **Placeholder:** Muted token color

### Dialogs
- **Style:** Bottom sheet on mobile, centered on sm+
- **Focus:** Trap + Escape to close via DialogShell
- **Scrim:** black/50

## Do's and Don'ts

### Do:
- **Do** keep the live score largest element on the match screen
- **Do** use semantic tokens (`primary`, `muted`, `border`) not raw Tailwind grays
- **Do** pause polling when the tab is hidden
- **Do** respect `prefers-reduced-motion` on button press feedback

### Don't:
- **Don't** use uppercase tracked section eyebrows (AI scaffold tell)
- **Don't** stack identical bordered cards when dividers suffice
- **Don't** use glassmorphism, gradient text, or hero metrics
- **Don't** ship modals without focus trap and Escape handling
- **Don't** use generic SaaS gray-and-green without a defined token system
