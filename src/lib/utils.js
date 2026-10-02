import { createCn } from "cn/config"

// Teach cn the theme's text sizes (src/index.css), so text-button isn't
// mistaken for a text color and dropped when classes are merged.
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: ["timer", "heading", "body", "button", "small"] }],
    },
  },
})
