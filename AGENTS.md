# Forest Timer

A focus timer that grows a tree in your forest every time you finish a session.
What it is and why: idea.md. What we're building now: the latest spec in docs/specs/.

## How to work here
- Run: npm run dev, then open the address it prints (usually http://localhost:5173).
- Test: npm test for checks (Vitest), npm run test:e2e for click-throughs (Playwright, at phone and laptop size; it starts the app itself).
- Lint: npm run lint. One warning, in src/components/ui/button.jsx, is shadcn's own and expected.
- See: open the app in the browser at phone (390px) and laptop (1440px) width.
- On your phone or laptop: this machine is a server on Tailscale. Run `npx vite --host 100.106.120.33` and open http://100.106.120.33:5173. Never use plain `--host`, which also puts it on the public internet.
- To try a session by hand, open the dev app with `?fast` and a session lasts 25 seconds.
- Save: commit with a one-line note.

## Rules
- A slice isn't done until its checks pass.
- Commit after each slice passes its checks.
- Never change a test just to make it pass. If a test needs to change, say so and why.
- The look comes from DESIGN.md, through the theme in src/index.css. Never make up colors, fonts, sizes or corners. To change the look, change DESIGN.md first, then the theme.
- Name things with the words in CONTEXT.md.
- Since 2026-10-02, the spec is out of date on the look: the newest tree isn't "top-left," rows hold about 6 trees on a phone and about two dozen on a laptop, and the first-visit line is dark, not muted grey. For how things look and where they sit, DESIGN.md and CONTEXT.md win over the spec.
- After adding a shadcn part, change its `import { cn } from "cn"` to `import { cn } from "@/lib/utils"`, which knows the theme's text sizes.

## Where things are
- Our words: CONTEXT.md
- The look: DESIGN.md
- Decisions: docs/adr/
- Stack: docs/stack.md
- Lots of trees, without growing them: put finished session records in localStorage under `forest-timer:session-records` (the `openWithTrees` helper in e2e/forest.spec.js shows the shape).
- The invisible block under the timer in src/App.jsx keeps room for the "Give up?" question, so the line and forest never jump. Don't remove it as dead code.
