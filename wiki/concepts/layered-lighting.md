---
id: layered-lighting
title: "Layered Lighting Design"
type: concept
status: published
weight: 7
tags:
  - layered-lighting
  - lighting-design
  - ambient
  - task
  - accent
  - specification
  - fixture
  - luminaire
  - lighting-plan
  - designer
  - trade
  - lumen
  - kelvin
  - CRI
related:
  - indoor-decorative
  - outdoor-architectural
  - commercial-hospitality
created: 2026-05-06
updated: 2026-05-06
---

# Layered Lighting Design

Layered lighting is the industry-standard approach to specifying luminaires for a space. It combines three functional tiers into a unified design that balances visibility, mood, and emphasis.

## The three layers

### 1. Ambient (general) lighting
Provides overall illumination. Goal: uniform base light level so occupants can navigate and perform tasks.
- Fixtures: recessed downlights, flush mounts, pendants (diffused), linear LED panels, cove lighting
- Target: 20–50 fc for residential, 30–75 fc for commercial

### 2. Task lighting
Directed, higher-intensity light for specific work surfaces.
- Fixtures: under-cabinet strips, desk lamps, vanity bars, track heads aimed at counters
- Target: 50–100 fc at work surface

### 3. Accent (decorative / focal) lighting
Directs attention to architecture, artwork, or display merchandise.
- Fixtures: adjustable recessed, track spots, wall washers, picture lights, cove uplight
- Ratio: accent beam ~3× ambient level to read as distinct

## Key specification parameters

| Parameter | Description | Typical range |
|---|---|---|
| Lumens | Total light output | 400–1600 lm (residential) |
| Kelvin (CCT) | Color temperature — warm to cool | 2700 K (warm) – 5000 K (daylight) |
| CRI | Color Rendering Index — how accurately colors appear | ≥80 standard, ≥90 premium |
| Beam angle | Spread of directional fixtures | 15° spot – 60° flood |
| Efficacy | Lumens per watt (efficiency) | ≥80 lm/W DLC standard |

## AccentOS relevance

Trade Partners (designers, architects, contractors) use the Trade Portal to browse resources and request quotes. When a trade customer specifies a layered plan, AccentOS:
- Pulls recommended SKUs per layer from Decision Engine
- Generates a quote with line items grouped by layer (ambient / task / accent)
- Flags any SKU without a DLC listing if project is commercial (DLC required for rebate eligibility)

## Common trade questions

- **"What CCT do you recommend for a hospitality project?"** — 2700–3000 K for warm, inviting atmosphere; 3500 K for bars / lobbies wanting modern feel
- **"Do you carry wet-rated fixtures for covered outdoor areas?"** — Yes; filter by `wet_rated: true` in outdoor-architectural cluster
- **"Can I get a spec sheet?"** — Available via Resources section of Trade Portal or via rep
