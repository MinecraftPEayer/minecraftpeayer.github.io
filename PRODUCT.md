# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Rhythm-game players (maimai / AstroDX community), mostly on a phone. They open a tool for one quick job: turn a chart into an answer-sound MP3, or turn an AstroDX score export into a shareable Rating image.

## Product Purpose

MinecraftPEayer's personal site hosts small browser tools for the community. Two of them:

- **Simai 正解音生成器** (`/answer-sound-generator`): reads a Simai chart (local maidata.txt, song folder, pasted text, or mai-notes search), mixes answer sounds (plus optional Break sound) at judgment times, and outputs MP3s with and without BGM.
- **AstroDX Rating Chart** (`/astrodx-rating-chart`): imports an AstroDX JSON export, matches titles to the arcade-songs database, lets the user fix unmatched titles and DX/SD choices, draws a top-50 Rating chart PNG, and exports all scores as CSV.

Success: the job finishes on a phone without confusion, and the output is ready to download or share.

## Positioning

Everything runs in the browser; files are never uploaded. Free, community-made tools.

## Operating Context

Phone browsers and installed PWAs, where file pickers can fail on cloud/network paths (hence the paste fallback). Users already know game terms: Simai, maidata.txt, Break, DX/SD, Rating, B50, difficulty names (BASIC … Re:MASTER).

## Capabilities and Constraints

- Next.js static export, client components.
- Answer-sound generator UI uses MUI; it stays on MUI.
- The canvas-drawn Rating chart PNG (draw-chart.ts) keeps its current look; only the page around it changes.
- UI copy is Traditional Chinese.
- Functionality must not change.

## Brand Commitments

Site name: MinecraftPEayer. JetBrains Mono Nerd Font is loaded site-wide. The two tools share one visual style.

## Evidence on Hand

Rank/FC/AP icons and the SEGA Maru Gothic font in `public/astrodx-rating-chart` and `public/fonts`. No testimonials or usage numbers; do not invent any.

## Product Principles

- One job per visit: the path from input to download stays short and obvious.
- Phone first: thumb-sized targets, no horizontal scroll except the chart preview.
- Local and honest: say clearly that processing stays in the browser.
- Speak the players' vocabulary; don't explain what they already know.
