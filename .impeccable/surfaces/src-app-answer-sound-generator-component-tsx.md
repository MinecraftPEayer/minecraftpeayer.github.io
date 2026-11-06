---
version: 1
slug: "src-app-answer-sound-generator-component-tsx"
primary_target: "src/app/answer-sound-generator/component.tsx"
related_targets: ["src/app/astrodx-rating-chart/chart-app.tsx"]
---

# Tool surfaces: answer-sound-generator + astrodx-rating-chart

Mode: Operate. Phone-first. Both tools share one visual world. Functionality, MUI (answer-sound), and the canvas PNG look (draw-chart.ts) stay unchanged.

Audience/job: maimai / AstroDX players on a phone doing one job per visit: make answer-sound MP3s, or make a Rating chart PNG + CSV.

## Direction contract

THESIS: A dark-first working console where each tool's steps run as a visible pipeline. Refuses the default "gradient hero + stack of floating cards" tool page.

OWN-WORLD: Graphite ground (#111317) with panels one elevation step up, divided by 1px seams, no shadows. Compact CJK sans for UI, JetBrains Mono for figures, file names and counts (tabular). Panel headers: small semibold label left, mono count right. One blue accent (#6cb6ff) for primary action and the active stage; amber only for Break; green/red only for success/error.

STORY: Visitor sees where they are in the pipeline, fills the open stage, watches stages turn green, downloads.

FIRST VIEWPORT: No nav bar or home link (user: no navigation). Title + one-line description. Pipeline strip of 4 stage boxes joined by a line, each with status icon (check / ring / spinner / alert) and mono value. Then the first panel (sources / import). Primary action pinned low within thumb reach on phones.

FORM: Dark developer console (challenger, chosen by user over assigned stamp-rally card). seed:86978849ac8017d5

Signature interaction: pipeline strip stages change state live from app state; the active connector fills in accent.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
