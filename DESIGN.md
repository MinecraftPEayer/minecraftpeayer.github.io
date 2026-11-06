---
name: MinecraftPEayer Tools
description: Dark working console for the site's in-browser rhythm-game tools.
colors:
  graphite-ground: "#111317"
  panel: "#181b20"
  raised: "#1f2329"
  seam: "#2a2e36"
  seam-strong: "#3a3f4a"
  text: "#e6e8eb"
  text-muted: "#a3a9b3"
  text-faint: "#868d98"
  signal-blue: "#6cb6ff"
  signal-blue-hover: "#95caff"
  accent-ink: "#08131f"
  accent-soft: "rgba(108,182,255,.12)"
  break-amber: "#f0b45a"
  success-green: "#5fd38d"
  green-soft: "rgba(95,211,141,.12)"
  error-red: "#ff8080"
  red-soft: "rgba(255,128,128,.1)"
typography:
  display:
    fontFamily: "ToolPunct, Noto Sans TC, PingFang TC, Microsoft JhengHei, system-ui, sans-serif"
    fontSize: "clamp(26px, 6.4vw, 40px)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  body:
    fontFamily: "ToolPunct, Noto Sans TC, PingFang TC, Microsoft JhengHei, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.7
  title:
    fontFamily: "ToolPunct, Noto Sans TC, PingFang TC, Microsoft JhengHei, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
  label:
    fontFamily: "ToolPunct, Noto Sans TC, PingFang TC, Microsoft JhengHei, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
  figure-lg:
    fontFamily: "JetBrains Mono, JetBrains Mono Nerd Font, ui-monospace, monospace"
    fontSize: "22px"
    fontWeight: 600
    fontFeature: "tnum"
  mono:
    fontFamily: "JetBrains Mono, JetBrains Mono Nerd Font, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
    fontFeature: "tnum"
rounded:
  base: "6px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.base}"
    padding: "0 18px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.signal-blue-hover}"
  button-outlined:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.base}"
    padding: "0 18px"
    height: "40px"
  panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.base}"
  panel-header:
    typography: "{typography.title}"
    padding: "10px 16px"
  input:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.base}"
    padding: "10px 12px"
    height: "44px"
  pipeline-stage:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text-faint}"
    rounded: "{rounded.base}"
    padding: "10px 10px 9px"
  pipeline-stage-active:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.signal-blue}"
---

# Design System: MinecraftPEayer Tools

**Scope.** This system covers the tool pages only: `/answer-sound-generator`, `/astrodx-rating-chart`, and future tools. The home page (`src/app/page.tsx`) is not part of it. The Rating chart PNG drawn on canvas by `draw-chart.ts` (and its MaiChart face) is a separate, fixed artifact and follows none of these rules. Tokens live in `src/app/_tool-ui/tokens.ts`, mirrored as CSS variables on the `.surface` class in `tool-ui.module.css`; the answer-sound generator consumes them through an MUI dark theme (`ui.tsx`).

## Overview

**Creative North Star: "The Pipeline Console"**

A dark working console where each tool's job runs as a visible pipeline. The visitor sees which stage they are in, fills the open stage, watches stages turn green, and downloads. Everything sits on a graphite ground, with panels one tonal step up, divided by 1px seams. There are no shadows, no gradients, and no floating cards.

The density is compact, like developer tools: small semibold labels, mono figures, seamed rows instead of separate boxes. Color does work and nothing else. One signal blue marks the primary action and the active stage. Green and red appear only for success and error. Amber appears only for Break. Everything else is graphite and grey text.

The tool pages have no navigation bar and no home link. That is the user's decision. Each page starts with its title.

**Key Characteristics:**
- Graphite ground, tonal panel steps, 1px seams, zero shadows.
- A pipeline strip of stage boxes as the signature, driven live by app state.
- Panel headers: semibold label left, mono count right.
- One filled signal-blue button per viewport, pinned in a sticky bottom action bar.
- Noto Sans TC for UI; JetBrains Mono (tabular) for figures, file names, and counts.
- A single 6px radius everywhere.

## Colors

Near-black graphite neutrals with one cool signal blue and three reserved semantic hues.

### Primary
- **Signal Blue** (`signal-blue`): the filled primary button, the active pipeline stage (border, tint, icon, incoming connector), focus outlines, input focus borders, slider fill, links, the accent-figure total in metrics and the action bar. Hover lifts to `signal-blue-hover`. Text on a filled blue button is `accent-ink`.
- **Accent Soft** (`accent-soft`): the tint behind the active stage, a hovered drop zone, and the highlighted "quick import" row.

### Semantic (reserved)
- **Success Green** (`success-green`): done stages (icon, 45%-alpha border, connector out of a done stage), picked-file badges, success alerts. Nothing decorative.
- **Error Red** (`error-red`): error stages, invalid fields, error alerts (`red-soft` fill, light-red `#ffc4c4` text).
- **Break Amber** (`break-amber`): Break counts, the Break volume readout and slider (MUI `secondary`). Only Break.

### Neutral
- **Graphite Ground** (`graphite-ground`): page and `html` background; also the 94%-alpha sticky action bar.
- **Panel** (`panel`): panels, pipeline stages, alerts.
- **Raised** (`raised`): inputs, drop zones, menus, tooltips, audio players, hovered disclosure rows.
- **Seam** (`seam`) / **Seam Strong** (`seam-strong`): 1px dividers and panel borders / outlined buttons, input strokes, connectors, slider rails, scrollbar thumb.
- **Text / Muted / Faint**: primary copy / ledes, hints, secondary values / panel meta counts, metric captions, footer note.

### Named Rules
**The Reserved Hue Rule.** Green means success, red means error, amber means Break. None of them is ever used for decoration, emphasis, or variety.

**The Muted Done Rule.** A done stage turns its border and icon green, but its value stays `text-muted`. Completion is signalled by the icon, not by bright text.

## Typography

**Display / Body Font:** Noto Sans TC via `next/font` (400/600/700), with PingFang TC, Microsoft JhengHei, system-ui fallback.
**Mono Font:** JetBrains Mono via `next/font` (400/600), falling back to the site-wide JetBrains Mono Nerd Font, then ui-monospace.
**Punctuation face:** `ToolPunct`, a local Latin sans limited to U+00B7, sits first in the sans stack so the middle dot stays narrow between Latin words. The CJK face draws it full-width.

**Character:** A plain CJK UI sans paired with a tabular mono. The sans carries labels and prose. The mono carries anything you would count, compare, or copy.

### Hierarchy
- **Display** (700, clamp(26px, 6.4vw, 40px), 1.15, -0.02em, balanced): the page title only.
- **Body** (400, 14px, 1.7): the lede (max 62ch) and help copy (13px, 1.65).
- **Title** (600, 14px): panel headers, row and file labels, disclosure summaries. Field labels are 600 at 13px.
- **Label** (400, 12px): hints, metric captions, footer note. Small action-bar captions go down to 11px.
- **Mono** (12px, tabular): panel meta counts, file names, stage values (11px; 10px on narrow phones), slider readouts (14px). Metric figures are 600 at 22px (19px on phones), action-bar totals 20px.

### Named Rules
**The Mono Means Data Rule.** File names, counts, durations, ratings, and stage values are set in JetBrains Mono with tabular numerals. Prose and labels never are.

## Layout

There is one centred column: MUI `Container md` (900px) with 16/24px gutters on the answer-sound page, and a 960px shell with 24px gutters (16px under 640px) on the rating chart. The order is fixed: title and lede (32px top, 20px bottom), the pipeline strip, then stacked panels 16px apart. A sticky bottom action bar spans the full width, with a seam top border, 94% graphite with a 10px backdrop blur, and safe-area padding. It holds the one primary action within thumb reach and stretches it to fill the row on phones.

The pipeline is a grid of N equal columns with 14px gaps (8px under 480px), joined by 2px connector lines. Metrics are 3-column seamed grids. Under 640px, list rows stack vertically and their inputs go full-width.

Rhythm: 8 / 12 / 16 / 24px. Panel bodies are padded 16px (14px on phones). Rows are padded 10-12px × 16px.

## Elevation & Depth

The system is flat. Depth comes only from tonal steps (ground → panel → raised) and 1px seams. MUI elevation is disabled, slider thumbs carry no shadow, and Paper has no background image. The only `box-shadow` is the 1px accent focus ring on inputs, which is a stroke, not elevation. The only translucency is the sticky action bar's blur.

### Named Rules
**The Seam Not Shadow Rule.** Panels are separated by a 1px border or a tonal step, never by a shadow.

## Shapes

One radius: gently squared corners (6px) on panels, stages, buttons, inputs, chips, drop zones, alerts, the canvas frame, and icon badges. Progress bars use 2px. Rows inside a panel have no radius of their own; they are divided by seams. Drop zones use a dashed `seam-strong` border until filled, then solid.

## Components

### Buttons
- **Shape:** 6px radius, semibold, no text transform, MUI elevation off.
- **Primary (filled):** signal blue with accent-ink text, min-height 44-48px, 15px. Hover lifts to `signal-blue-hover`. Allowed only once per viewport, and it lives in the sticky action bar.
- **Outlined:** transparent with a `seam-strong` border. Hover moves the border to signal blue. Text is blue when the button starts a step ("選擇檔案") and muted once that step is satisfied ("更換").
- **Disabled:** 45% opacity, not-allowed cursor.

### Panels
- **Style:** `panel` fill, 1px `seam` border, 6px, overflow hidden.
- **Header:** 14px/600 label left, 12px mono `text-faint` meta right, padded 10px × 16px, seam below.
- **Content:** seamed rows (FilePicker, result players, disclosure rows, metric grids), never cards nested in a card.

### Inputs / Fields
- **Style:** `raised` fill, 1px `seam-strong` stroke, 6px, min-height 40-44px. Pattern/text inputs use mono. Placeholders use `text-faint`.
- **Focus:** border and 1px ring in signal blue. Global focus-visible: a 2px blue outline offset by 2px.
- **Error:** border turns `error-red`. The message sits in a `red-soft` block.

### Pipeline Strip (signature)
A row of stage boxes, one per job step. Each box has a 15px status icon and a 13px/600 label over an 11px mono value.
- **Pending:** ring icon, faint text, `seam` border.
- **Active / Busy:** active-dot or spinning icon, signal blue border, `accent-soft` fill, and the incoming connector turns blue.
- **Done:** check icon and green 45% border. The value stays muted. The outgoing connector turns green.
- **Error:** alert icon, red 55% border.
State changes ease over 0.3s (`cubic-bezier(0.16, 1, 0.3, 1)`). Under reduced motion, transitions stop and the spinner slows to 2.4s.

### File Row
A 64px seamed row: a 32px icon badge (green check once filled), a label over a hint or mono file name, then the outlined pick/replace button. Optional rows say "選填 ·" and get a remove button once filled.

### Icons
A custom inline SVG set (`_tool-ui/icons.tsx`): 24px grid, 1.75 stroke, round caps, `currentColor`, 15-18px in use. Glyph or emoji icons are not used.

## Do's and Don'ts

### Do:
- **Do** start every tool page with title and lede, then the pipeline strip, then panels.
- **Do** keep exactly one filled signal-blue button per viewport, in the sticky action bar.
- **Do** separate surfaces with 1px seams and tonal steps.
- **Do** set counts, file names, and figures in JetBrains Mono with tabular numerals.
- **Do** use the 6px radius for every bordered element.
- **Do** load fonts through `next/font` and keep `ToolPunct` first in the sans stack.

### Don't:
- **Don't** add a navigation bar or home link to tool pages.
- **Don't** use amber for anything but Break, or green/red for anything but success/error.
- **Don't** brighten done-stage values. They stay muted.
- **Don't** add shadows, gradients, or floating cards.
- **Don't** apply these rules to the home page or to the canvas-drawn Rating chart PNG.
