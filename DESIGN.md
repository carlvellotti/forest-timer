---
name: Forest Timer
colors:
  background: "#EEEBE8"
  text: "#26231F"
  muted: "#6F6A63"
  line: "#CFC9C2"
  primary: "#2F5D3A"
  on-primary: "#EEEBE8"
  accent: "#E07A3F"
  tree: "#3D6B47"
  tree-edge: "#567F5D"
  trunk: "#5B4632"
typography:
  font-family: "EB Garamond, Georgia, serif"
  timer:
    font-size: 90px
    font-weight: 400
    letter-spacing: -0.02em
    line-height: 1
  heading:
    font-size: 16px
    font-weight: 500
  body:
    font-size: 16px
    font-weight: 400
    line-height: 1.5
  button:
    font-size: 18px
    font-weight: 500
  small:
    font-size: 14px
    font-weight: 400
rounded:
  none: 0px
  sm: 2px
spacing:
  screen-padding: 26px
  gap: 14px
  tree-gap: 10px
  tree: 40px
components:
  button-primary:
    background: "{colors.primary}"
    text: "{colors.on-primary}"
    border: "1px solid {colors.primary}"
    rounded: "{rounded.sm}"
    padding: 9px 34px
    shadow: none
  button-quiet:
    background: none
    text: "{colors.muted}"
    style: underlined text link
  divider:
    border: "1px solid {colors.line}"
  tree:
    fill: "{colors.tree}"
    stroke: "2px {colors.tree-edge}, round joins"
    trunk: "{colors.trunk}"
  tree-newest:
    ring: "1.5px dashed {colors.accent}, dashes 3px on, 2px off"
---

# Forest Timer design

## Overview

Calm and quiet, like a morning walk through mist. It should feel like an old field guide: lots of empty paper around one thing, and thin, careful lines. It's quiet, like a reading room where nobody is talking. Nothing shouts.

The one moment of pride is finishing a session. That's when a little orange shows up, like the stitched edge of a camp badge you earned.

Every value here traces back to the mood board in `docs/references/`, with notes in `docs/references/NOTES.md`.

## Colors

- **Background (`#EEEBE8`), "stone":** a soft grey, just a touch warm, like a river stone in the mist. It must never drift toward cream or yellow.
- **Text (`#26231F`):** a warm near-black, like ink.
- **Muted (`#6F6A63`):** for counts, dates and the "Give up" link.
- **Primary (`#2F5D3A`):** the soft, deep green of moss. It's used for anything you can press, and nothing else.
- **Accent (`#E07A3F`):** orange from the camp badge's stitched edge. It appears **only** when you finish a session, on the tree you just grew. It's never used on buttons, text or decoration.
- **Trees:** soft moss green (`#3D6B47`) with a slightly lighter edge (`#567F5D`) on a brown trunk (`#5B4632`). They look fuzzy, not shiny.

## Typography

One font family everywhere: EB Garamond, an old-book serif. The timer is the biggest thing on the screen by far, set large and light. Everything else stays small and calm, at 14–18px. Labels are plain text, never all caps or letter-spaced.

## Layout

The timer sits alone in the middle with plenty of empty space around it, like the one fern on a field-guide page. Below it, divided off by a single thin line, is the forest: trees in rows along the ground, like treelines, each row centered under the timer. The forest is the reward, so the trees are big enough to matter. When a row is full, the next tree starts a new row underneath. Use only the words the screen needs. For example, there's no "Focus session" label above the timer.

## Elevation and depth

The design is flat. There are no shadows, glows or gradients. Thin lines separate areas instead.

## Shapes

Corners are nearly square: 2px on buttons and frames, and 0 everywhere else.

## Icons

Small, flat icons from Lucide, drawn filled (solid), like a solid pine for the app's mark and a solid triangle for Start. They have no outlines and no color of their own: they take the text color, or stone (on-primary) on a moss-green button.

## Motion

None. Things appear and change without animation: no bounces, pops or pulses.

## Components

- **Start:** a solid moss-green block with stone text and a small filled play icon.
- **Give up:** a quiet underlined text link in the muted color, under the timer while a session is running. Start and Give up are never on screen together. It isn't a button.
- **Forest:** soft moss pines in centered rows, each in a 40px square with 10px between them. The pine fills most of its square, leaving just enough room for the ring. About six fit in a row on a phone and about two dozen on a laptop. The tree you just grew gets a small orange dashed ring around it, like stitching on a badge, until you press Start again or leave the page. Otherwise, trees have no ring.
- **First-visit line:** before the first tree, the forest holds one line, "Finish a session to grow your first tree." It's body text in the text color (not muted), centered where the trees will grow, so it reads as the start of the forest rather than a footnote.

## Do's and don'ts

**Do**

- Keep the screen mostly empty, with one thing in focus at a time.
- Use moss green only for things you can press.
- Save orange for the moment a tree grows.
- Separate areas with a thin line rather than a box.
- Use the soft, filled pine for trees, with no stitching on the trees themselves.

**Don't**

- Don't use cream, beige or yellowish backgrounds.
- Don't use purple anywhere.
- Don't use grids of identical cards, and don't put the forest in a card.
- Don't add gradients, glows, shadows or shiny effects.
- Don't add labels the screen doesn't need, like "Focus session."
- Don't use bright neon green or green on black.
