# TokenOS --- Design System Specification: Dark Slate & Flame (Dark Orange)

## 1. Overview & Visual Identity
The visual identity of TokenOS is **Dark Slate & Flame** (Midnight Intelligence with Vivid Ignition Orange). It delivers a developer-first, high-density AI telemetry interface with high contrast, dark slate metallic depth, and vibrant solar-orange accents.

---

## 2. Color Palette & Design Tokens

```yaml
version: 1.0.0
name: Dark Slate & Flame (TokenOS)
description: High-contrast developer control plane dark system with Dark Slate Grey depth and Vivid Solar Orange ignition accents.

colors:
  # Primary Accents (Terracotta / Warm Flame)
  primary: "#D97757"          # Terracotta Flame - primary action, active state, glow
  primary-bright: "#E2896B"   # Warm Terracotta - hover states, secondary highlights
  primary-glow: "#EBA186"     # Soft Peach Flame - telemetry focus, subtle radiant glows
  primary-dark: "#C16142"     # Deep Terracotta - subtle active states, borders

  # Secondary & Neutral Complementary Accents
  secondary: "#F59E0B"        # Warm Amber - warning, auxiliary metric
  tertiary: "#7E8B9B"         # Muted Metallic Gray - metadata, quiet labels

  # Surfaces & Canvas (Dark Slate Grey Scale)
  neutral-bg: "#0B0F17"       # Deep Obsidian Canvas
  surface-base: "#121824"     # Dark Slate Panel Base
  surface-elevated: "#1B2436" # Lifted Card / Interactive Container Fills
  surface-overlay: "#232F44"  # Popover / Modal Overlay Fill
  border-slate: "#2A364F"     # Container Dividers & Crisp Monospaced Frames
  border-active: "#D97757"    # Focused Input / Active Stage Border

  # Text Hierarchy
  on-surface: "#F0F4F8"       # Crisp White/Blue Cast - Primary Headings & Code
  on-surface-muted: "#94A3B8" # Secondary Copy & Telemetry Descriptions
  on-surface-disabled: "#475569" # Disabled Chrome

  # Status Semantics
  success: "#22C55E"          # Satisfied Requirement / Verification Passed
  warning: "#F59E0B"          # Budget Limit Nearing / Uncertain Evidence
  danger: "#EF4444"           # Requirement Failure / Security Contradiction
  info: "#3B82F6"             # System Event / Provider Ping

typography:
  font-family-ui: "Mona Sans, Inter, system-ui, sans-serif"
  font-family-mono: "JetBrains Mono, Mona Sans Mono, monospace"

rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"

spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "32px"
  xl: "48px"
```

---

## 3. Micro-Animations & Interactive Cursor Physics

### 1. Interactive Cursor Glow & Movement
- **TokenOS Particle Cursor:** A radial subtle solar-orange glow follows cursor position with lerp smooth physics (`lerp(current, target, 0.12)`).
- **Interactive Container Spotlight:** Slate surfaces receive a subtle 120px radial highlight `#D97757` (opacity `0.08`) reflecting exact mouse coordinates inside cards.

### 2. TokenOS Decision Pulse (Signature Component)
- Pipeline stages: `Intent → Policy → Context → Prompt → Model → Reasoning → Tools → Verify`.
- Animated connecting lines light up in `#D97757` with pulse waves during stage execution (`Motion for React`).
- Driven 100% by backend SSE telemetry events, labeled with real-vs-demo data indicators.

---

## 4. Design Guidelines (Do's and Don'ts)

### Do:
- Rely on high contrast dark slate backgrounds (`#121824`) and subtle border lines (`#2A364F`).
- Reserve vivid terracotta flame (`#D97757`) for primary execution actions, active stages, and pass indicators.
- Use monospaced font (`JetBrains Mono`) for tokens, latencies, model IDs, and evidence ledger items.

### Don't:
- Do not use generic bright blue or red themes that violate the Dark Slate & Flame identity.
- Do not hide telemetry metrics behind multi-click menus.
- Do not invent fake live token counts or benchmark numbers.
