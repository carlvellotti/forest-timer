# Builder skills

Eight skills from the course "Build Anything with AI". Each one is a saved prompt your coding agent follows.

| Skill | What it does | When |
|---|---|---|
| `/idea` | Interviews you and writes your `idea.md` | At the very start |
| `/explore-looks` | Sketches your main screen in three looks from your mood board, then refines one | When you pick your look |
| `/grill` | Interviews you until you and your agent agree on what you're building | Before every spec |
| `/spec` | Turns what you decided into a dated spec | Right after grilling |
| `/slice` | Cuts your spec into vertical slices, each with its checks | Before building |
| `/build` | Builds the next slice, checks it, has it reviewed and saves it | Once per slice |
| `/tour` | Shows you what got built, on one page, without reading code | After a build |
| `/wrap-up` | Proposes what the next session needs to know, then saves | At the end of a session |

## Install

Put this folder somewhere in your course folder, then paste this into your agent:

```
I just downloaded the Builder skills into this folder: builder-skills/. Install them so you can use them in this project as skills I can run by name (/idea, /grill, /spec and so on). Work out which coding tool you are and use its own way of adding project skills: in Claude Code, copy each folder into .claude/skills/. In any other tool, check your own docs for where project skills or custom commands go, and if your tool has no skills feature, add each one as a rule or instruction file I can call by name. Keep each SKILL.md's instructions exactly as they are. Then list the skills you installed and tell me how I run one.
```

If the skills don't show up when you type `/`, restart your coding tool: most tools only look for new skills when they start.
