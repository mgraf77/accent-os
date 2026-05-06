---
type: concept
slug: dimming-protocols
title: Dimming Protocols
sources: [source-master]
related: [lighting-reference, color-temperature-selection, emergency-lighting-compliance]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Dimming Protocols

## Protocol comparison

| Protocol | Signal | Range | Applications | Cost |
|----------|--------|-------|-------------|------|
| Triac (leading edge) | AC phase cut | 0–100% | Residential, small commercial | Low |
| ELV (trailing edge) | AC phase cut | 0–100% | LED drivers, electronic LV | Low |
| 0-10V | Analog DC voltage | 10%–100% | Commercial LED, HID retrofit | Medium |
| DALI (IEC 62386) | Digital addressable | 0.1%–100% | Commercial, hospitality, offices | High |
| Casambi / Zigbee / Bluetooth | Wireless mesh | 0–100% | Retrofit, residential smart | Medium |
| DMX-512 | Digital multiplex | 0–100% | Entertainment, theatrical | High |
| Phase selectable | Auto-detect | 0–100% | Universal drivers | Medium |

## 0-10V (most common commercial)

- Two-wire analog (0V = off, 10V = full); LED driver interprets voltage
- Simple, inexpensive, widely compatible
- **Limitation**: dims to ~10% minimum before "step-off" (fixture cuts off); no true 0% without switching relay
- Common with occupancy sensors, daylight sensors in IECC-compliant offices

## DALI (Digital Addressable Lighting Interface)

- Each fixture gets unique address; individual control from 2-wire bus
- True 0.1% dimming (smooth fade to black)
- Bidirectional: driver reports back lamp failure, burn hours
- DALI-2: standardized, multi-manufacturer interoperability
- **Use case**: lobbies, conference centers, hospitality, any scene-based control
- Higher wiring and commissioning cost than 0-10V

## Triac / ELV (residential)

- Triac (forward phase cut): older, suited for resistive/incandescent loads; causes flicker with LED if mismatched
- ELV (reverse phase cut): better for capacitive/electronic loads; preferred for LED retrofit
- Must match dimmer type to LED driver — mismatch = flicker, buzz, incompatibility
- Always provide dimmer compatibility list from vendor

## Flicker and TLA

- **TLA (Temporal Light Artefact)**: includes flicker, stroboscopic effect, phantom array
- IEEE 1789-2015: thresholds for flicker that causes health/visual discomfort
- Percent flicker: `(max - min) / (max + min) × 100`. Target: <15% at dimmed levels
- Critical for task lighting, video production, healthcare

## Practical guidance for quotes

- Office/retail: default to 0-10V (simple, cost-effective, code-compliant)
- Hospitality/high-end commercial: spec DALI for scene control flexibility
- Residential/small commercial retrofit: ELV dimmer + compatible LED driver
- Always ask: "Is there existing dimming infrastructure? What protocol?"
- Dimmer compatibility list required with every LED quote involving dimming

## Related

[[lighting-reference]] · [[color-temperature-selection]] · [[emergency-lighting-compliance]]
