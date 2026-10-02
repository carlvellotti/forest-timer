# The three things every app is made of

## The idea in one sentence

Every app, from a tiny tool to a huge website, is built from the same three things: **presentation** (what you see), **logic** (what it does when you use it) and **data** (what it remembers). A good way to build something is to add them one at a time, in that order.

## The three things, in plain language

| Thing | The question it answers | In the review page | What it's written in |
|---|---|---|---|
| **Presentation** | What does it look like? | A long markdown file turned into a tidy page with sections, a table or a diagram | HTML and CSS |
| **Logic** | What happens when I do something? | An answer box under each question, plus a button that copies all your answers as one message | JavaScript |
| **Data** | What does it remember? | Your answers are still there after you refresh the page | The browser's own storage |

### Presentation: make it readable

The first step only changes how things *look*. Nothing on the page reacts to you yet. You get the same words, but they're laid out so you can actually read them, so you're not scrolling a wall of chat text.

### Logic: make it do something

Now the page responds when you use it. You type into the boxes, press a button, and it gathers your answers into one message you can paste back to your AI. That's the full round trip: the AI writes to you, you answer on the page, and the AI gets your answers.

### Data: make it remember

Refresh the page and your answers vanish, because nothing saved them. Saving usually means you need a server somewhere (a "back end"). But every browser has a little storage space of its own, right on your device. Put your answers there and they survive a refresh.

There's a catch: that storage belongs to *that one browser on that one device*. Open the same page in a different browser and the boxes are empty. The data didn't travel with the page.

## Why build it in this order?

- **Each step works on its own.** After presentation you already have something useful to read. After logic you can answer things. Data is the finishing touch.
- **You can tell which part did what.** If something breaks, you know which of the three you just added.
- **It's the same pattern everywhere.** Once you see presentation, logic and data in a one-file tool, you'll start to spot them in every app you use.

## The short version

Looks, then actions, then memory. Every app has all three, and you can build them one at a time.

---

## Three questions for you

1. Think of an app you use every day. Name one example of its presentation, one of its logic and one of its data.
2. Your answers on the review page disappear when you refresh. Which of the three things is missing, and why doesn't adding more presentation or logic fix it?
3. You save your answers in the browser, then open the same page on your phone. What will you see, and why?
