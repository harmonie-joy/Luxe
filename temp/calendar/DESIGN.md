## Brand & Style

This design system is built for high-stakes professional environments where clarity and prestige are paramount. The personality is **Sophisticated, Precise, and Trustworthy**, avoiding the "playful" tropes of consumer tech in favor of a "boutique enterprise" aesthetic.

The design style is a hybrid of **High-End Minimalism and Linear-inspired Precision**. It utilizes extreme attention to detail in stroke weights, subtle tonal shifts for hierarchy, and a restrained use of "Luxe Gold" to signal premium value. The emotional response should be one of calm control—the UI feels like a high-performance instrument rather than a generic utility.

**Key Principles:**
- **Reductionist Clarity:** If an element doesn't serve a functional or structural purpose, it is removed.
- **Architectural Hierarchy:** Using typography and subtle borders rather than heavy shadows to define space.
- **Intentional Friction:** High-contrast CTAs and deliberate spacing ensure that important actions are never accidental.

## Colors

The palette is anchored in a "Gallery White" environment to promote focus. The primary accent, **Luxe Gold (#C5A059)**, is reserved for high-value interactions and brand moments. 

**Functional Roles:**
- **Primary (Luxe Gold):** Signature actions, premium features, and active states.
- **Secondary (Deep Navy):** Sidebar backgrounds, primary text, and structural headers.
- **Tertiary (Emerald Green):** Positive status indicators, "Safe" compliance states, and success messaging.
- **Neutrals:** A scale of warm greys and charcoals that avoid "dead" blacks to maintain a sophisticated, organic feel.

In dark mode (if implemented), the background shifts to a deep charcoal (#121212) with borders using a 10% opacity white to maintain the "Linear" precision.

## Typography

This system uses a **Boutique Serif/Functional Sans** pairing. **Libre Caslon Text** provides an authoritative, editorial feel for headings, while **Inter** handles the heavy lifting of the UI with its exceptional legibility and neutral tone.

**Usage Notes:**
- **Serif Headings:** Use only for page titles and high-level section headers to maintain the "Luxe" feel.
- **The 15px Body:** We use 15px for standard body text to strike a balance between the information density of SaaS and the readability of editorial content.
- **Labels:** Small labels use increased letter spacing and uppercase styling to denote metadata or "cockpit" status indicators.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. The sidebar remains at a fixed width to provide a "cockpit" feel, while the main content area utilizes a 12-column grid within a maximum container width of 1440px.

**Spacing Philosophy:**
- **Generous Margins:** External page margins are intentionally wide (40px) to evoke a sense of luxury and focus.
- **Micro-Spacing:** Elements within cards and list items use a strict 8px (1rem) grid to maintain the precision feel of professional tools.
- **The Sidebar:** The primary navigation is docked to the left, using a "Deep Navy" background in dark mode or a subtle "Off-White" in light mode to clearly separate navigation from work-space.

## Elevation & Depth

To maintain a minimal and professional aesthetic, this design system avoids heavy drop shadows. Depth is communicated through **Tonal Layering and Low-Contrast Outlines**.

**Elevation Tiers:**
- **Level 0 (Background):** The base canvas.
- **Level 1 (Cards/Surface):** Defined by a 1px solid border (#E5E5E1). No shadow.
- **Level 2 (Dropdowns/Modals):** A very soft, 15% opacity neutral shadow with a 20px blur, combined with a 1px border.
- **Interaction:** On hover, cards do not lift; instead, the border color shifts slightly darker or the background gains a subtle 2% tint change.

## Shapes

The shape language is **Soft yet Structured**. We use a `0.25rem` (4px) base radius for almost all components—buttons, input fields, and small cards. 

This specific "Soft" setting is chosen to feel more modern than a sharp industrial edge, but more professional and "buttoned-up" than the pill-shaped rounds common in casual consumer apps. Larger containers (like the main workspace area) may use `0.5rem` to create a nested, "frame-within-a-frame" aesthetic.

## Components

### Buttons
- **Primary:** Luxe Gold background, white or deep navy text. High contrast, sharp 4px corners.
- **Secondary:** Transparent background with a 1px Deep Navy border.
- **Tertiary:** Ghost style, text-only with a subtle background highlight on hover.

### Cards
- White background with a 1px #E5E5E1 border.
- No shadows. Padding should be generous (min 24px).
- Titles in `title-md` (Inter Semi-bold).

### Sidebar Navigation
- Vertical orientation. 
- Active state indicated by a 2px "Luxe Gold" vertical bar on the left and a subtle 4% background tint.
- Icons should be fine-line (1px or 1.5px stroke weight) to match the precision of the typography.

### Traffic Light Indicators (Compliance)
- **Critical:** Soft Red (Hex #D32F2F).
- **Warning:** Amber (Hex #F57C00).
- **Compliant:** Emerald Green (Hex #2D5A27).
- These appear as small, solid 8px circles next to data points or status labels.

### Input Fields
- Understated design: 1px border on all sides.
- Focus state: Border color changes to Luxe Gold with a 1px inner glow.
- Labels use `label-sm` and sit clearly above the input.