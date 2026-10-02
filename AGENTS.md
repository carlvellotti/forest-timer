# Forest Timer

A focus timer that grows a tree in your forest every time you finish a session.
What it is and why: idea.md. What we're building now: the latest spec in docs/specs/.

## How to work here
- Run: npm run dev, then open the address it prints (usually http://localhost:5173).
- Test: npm test for checks (Vitest), npm run test:e2e for click-throughs (Playwright, at phone and laptop size; it starts the app itself).
- Lint: npm run lint.
- See: open the app in the browser at phone (390px) and laptop (1440px) width.
- Save: commit with a one-line note.

## Rules
- A slice isn't done until its checks pass.
- Commit after each slice passes its checks.
- Never change a test just to make it pass. If a test needs to change, say so and why.
- The look comes from DESIGN.md, through the theme in src/index.css. Never make up colors, fonts, sizes or corners. To change the look, change DESIGN.md first, then the theme.
- Name things with the words in CONTEXT.md.
- After adding a shadcn part, change its `import { cn } from "cn"` to `import { cn } from "@/lib/utils"`, which knows the theme's text sizes.

## Where things are
- Our words: CONTEXT.md
- The look: DESIGN.md
- Decisions: docs/adr/
- Stack: docs/stack.md
