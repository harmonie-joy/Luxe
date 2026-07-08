---
name: Luxe Ether
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#48464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#79767e'
  outline-variant: '#c9c5ce'
  surface-tint: '#605a7c'
  primary: '#605a7c'
  on-primary: '#ffffff'
  primary-container: '#e0d7ff'
  on-primary-container: '#625c7e'
  inverse-primary: '#cac1e8'
  secondary: '#755849'
  on-secondary: '#ffffff'
  secondary-container: '#ffd8c4'
  on-secondary-container: '#795c4d'
  tertiary: '#506351'
  on-tertiary: '#ffffff'
  tertiary-container: '#cce2cb'
  on-tertiary-container: '#526553'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e6deff'
  primary-fixed-dim: '#cac1e8'
  on-primary-fixed: '#1c1735'
  on-primary-fixed-variant: '#484263'
  secondary-fixed: '#ffdbc9'
  secondary-fixed-dim: '#e4bfac'
  on-secondary-fixed: '#2b170b'
  on-secondary-fixed-variant: '#5b4132'
  tertiary-fixed: '#d2e8d1'
  tertiary-fixed-dim: '#b7ccb6'
  on-tertiary-fixed: '#0e1f11'
  on-tertiary-fixed-variant: '#384b3a'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  muted-blue: '#D1E3FF'
  luxe-text: '#1A1A1A'
  subtle-grey: '#6B7280'
  glass-surface: rgba(255, 255, 255, 0.4)
typography:
  display-lg:
    fontFamily: Libre Caslon Text
    fontSize: 64px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Libre Caslon Text
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Libre Caslon Text
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  stats-display:
    fontFamily: Inter
    fontSize: 56px
    fontWeight: '200'
    lineHeight: '1'
    letterSpacing: -0.04em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 8px
  container-padding-desktop: 64px
  container-padding-mobile: 24px
  gutter: 32px
  section-gap: 120px
---

## Brand & Style

The design system is centered around the concept of "Atmospheric Zen"—a digital environment that prioritizes mental clarity, sophistication, and a sense of effortless flow. It is tailored for creative professionals and high-end lifestyle products where the experience of the interface is as important as the utility itself.

The aesthetic blends **Minimalism** with **Glassmorphism**. It rejects the traditional "SaaS box" layout in favor of organic shapes, expansive negative space, and ethereal background gradients. The interface should feel like a serene, sun-drenched studio: light, airy, and premium. Key visual drivers include translucency, high-quality typography, and a deliberate absence of rigid dividers.

## Colors

The palette is anchored by soft, desaturated pastels that evoke the transitions of light throughout a day. 

- **Primary Background:** Utilize ethereal gradients blending Soft Lavender, Sunset Peach, and Muted Blue. These gradients should be subtle and slow-moving if animated.
- **Surface Strategy:** The primary surface is an off-white (#F8FAFC). Functional containers use a translucent "Glass Surface" (White at 40-70% opacity) with a heavy backdrop blur.
- **Functional Accents:** Lavender is the primary interaction color. Peach is used for focus and warmth. Sage Green is reserved for success states, and Muted Blue for informational cues.
- **Typography:** Use Luxe Text (#1A1A1A) for maximum legibility on glass and light backgrounds. Subtle Grey is used for metadata and low-priority labels.

## Typography

This system employs a high-contrast typographic pairing to balance heritage with modernity. 

**Libre Caslon Text** is used for all headlines and display moments to provide a "Luxe" editorial feel. **Inter** provides a clean, functional counterpoint for body text and UI labels. 

For data visualization or large numbers, use the "stats-display" style: a very light weight of Inter that allows data to feel integrated into the background rather than boxed in. Ensure generous line-heights across all body text to maintain the "airy" quality of the design system.

## Layout & Spacing

The layout philosophy is "Zen-like," prioritizing whitespace over information density. It uses a **Fluid Grid** model with significantly oversized margins and gutters to prevent content from feeling crowded.

- **Breakpoints:** Desktop (1440px+), Tablet (768px-1439px), Mobile (0-767px).
- **Desktop:** Use a 12-column grid with 64px outer margins and 32px gutters.
- **Mobile:** Transition to a single-column flow with 24px margins.
- **Rhythm:** Vertical spacing between major sections should be generous (120px+) to create "breathable" content blocks. Elements should "float" within their containers rather than being pinned to edges.

## Elevation & Depth

Depth is conveyed through **Glassmorphism** and light physics rather than traditional shadows.

1.  **Surfaces:** Use `backdrop-filter: blur(20px)` on all functional glass panels. Surfaces should have a very thin (1px), semi-transparent white border to define edges against the gradient backgrounds.
2.  **Shadows:** Avoid heavy black shadows. Use "Ambient Glows"—extremely soft, low-opacity shadows that take on a slight tint of the background color to suggest a soft lift.
3.  **Layers:** Hierarchy is created by stacking glass panels. A modal should have a higher blur value and a slightly higher opacity than the base page panels.

## Shapes

The shape language is defined by extreme softness and fluid curves. 

- **Containers:** All cards and panels must use a corner radius of 24px or larger. 
- **Interactive Elements:** Buttons, chips, and tags must be fully pill-shaped (rounded-full).
- **Imagery:** High-quality atmospheric photography should also follow the container's roundedness, often bleeding into the glass container to create an integrated, organic look.

## Components

- **Buttons:** Primary buttons are pill-shaped with a Soft Lavender fill. Hover states should involve a slight increase in saturation or a subtle "inner glow." Secondary buttons use a glass background with a thin white border.
- **Cards:** Glassmorphic with 24px+ rounded corners. Cards often incorporate atmospheric imagery as a background layer or a hero element within the card.
- **Input Fields:** Minimalist pill shapes. The border is invisible or ultra-thin until focused, at which point a Sunset Peach glow appears.
- **Navigation:** Sidebars and top bars are borderless. Icons are simple line-art. Navigation active states are indicated by a pill-shaped glass highlight behind the icon/text.
- **Chips & Tags:** Small, fully rounded pill shapes using the pastel accent palette (Sage Green for success, Muted Blue for info).
- **Progress Bars:** Thin, organic "Flow" elements that use a gradient fill rather than a solid color to indicate completion.