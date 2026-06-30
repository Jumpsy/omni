---
name: design
description: Premium UI design skill for JumpsGPT / JumpStudy / Jump AI. Covers the full design system, anti-slop rules, layout principles, typography, color, icons, animation, copy, and pre-ship checklist. Load any time you are about to build or modify UI.
---

# Jump AI Design Skill

Load this before touching any UI. These are not suggestions — they are the rules that make the product look premium and human-made.

**Full reference:** `https://github.com/Jumpsy/omni/blob/main/omni/references/jumpsgpt-frontend-decisions.md`

---

## The One Rule

**Every element earns its place. If you can remove it and the screen still communicates the same thing, remove it.**

Slop happens when you add things to feel complete: icon wrappers, gradient overlays, decorative dividers, filler copy, emoji in headings, pill badges on everything, shadows on shadows. None of those are in this codebase.

---

## Color System

Use CSS variables. Never hardcode hex.

```css
--pink: #d61a6f          /* brand accent — accessible 4.5:1 on white */
--pink-deep: #c2185b     /* hover on pink */
--pink-soft: rgba(255,46,136,0.1)  /* tinted backgrounds */
--on-pink: #ffffff       /* text on pink surfaces */

--bg: #ffffff            /* page background */
--surface: #ffffff       /* card level */
--surface-2: #f6f6f4     /* nested inputs, code blocks */
--fg: #0b0b0d            /* primary text */
--fg-muted: #5b606b      /* labels, secondary text */
--fg-subtle: #6e737e     /* placeholders, captions */
--border: #eaeaec        /* default border */
--border-strong: #d9d9dd /* hover / focus ring */
```

Tailwind utilities: `bg-pink-100`, `text-gray-600`, `border-pink-200` (full `--pink-50` → `--pink-900` + `--gray-50` → `--gray-900` registered via `@theme inline`).

### Rules
- JumpStudy page background: `bg-pink-50 dark:bg-gray-950` — faint pink tint, not white
- Pink is used for **one thing at a time**: the active state, the CTA, or the accent — never two at once
- No gradients. Ever. If something needs depth, use a slightly darker surface or a `1px border`
- If you are about to write `bg-gradient-to-r`, stop

---

## Typography

| Class | Font | Use for |
|-------|------|---------|
| `font-display` | Space Grotesk | Headlines, pod titles, big numbers |
| `font-sans` | Geist | Body, labels, UI chrome |

**Handwriting mode:** `html[data-font="handwritten"]` swaps all font variables automatically via `globals.css`. Use `JumpStudyFontApplier` (sets from localStorage on mount) and `JumpStudyFontToggle` ("Aa" button). Never manage font state manually.

**Type scale:**
- `text-display` → `clamp(2rem, 1.4rem + 2.2vw, 3.25rem)` with `tracking-[-0.035em]`
- Use `font-display text-h1 font-semibold` for headlines — never `text-4xl font-bold`
- Use `font-medium` or `font-semibold` on body — never `font-bold`

---

## Icons

Icons are **bare SVGs with no container**. No circle, no rounded square, no `p-2 bg-gray-100 rounded-lg` wrapper.

```tsx
function Icon({ path, size = 18 }: { path: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d={path} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
```

- Color: `currentColor` — inherits from parent text color
- Hover: handle on the parent button, not the icon
- Use sparingly: nav, actions, status. Not as decoration. Not next to every label
- In buttons: `gap-2` or `gap-1.5` with the label. Never `gap-4`
- No emojis as icons or decoration anywhere

---

## Spacing & Layout

The design breathes. Sections: `py-10` to `py-28`. Cards: `p-5` to `p-8`. Nothing cramped.

**Pod page layout:** 3 columns — `lg:grid-cols-[200px,1fr,200px]` with `gap-8`. Both sidebars symmetric: same width, `border-r` / `border-l border-border`, `pr-6` / `pl-6`. No background, no shadow — they feel like columns on a page, not app panels.

```
Header (sticky)
  ├── Mobile mode strip (<lg)
  └── lg:grid-cols-[200px,1fr,200px]
        ├── Left sidebar — pod identity + nav
        ├── Main content (flex-1, min-h-[60vh])
        └── Right sidebar — stats (mastery %, due today, streak)
```

**Card radius:**
- Main cards: `rounded-2xl` (16px)
- Inner elements: `rounded-xl` (12px)
- Small things: `rounded-lg`
- Never `rounded-full` on cards

**Borders over shadows:** Cards use `border border-border`, no shadow. Shadows (`shadow-lift`, `shadow-soft`) only for modals and dropdowns.

**Mobile:** Test at 375px, 768px, 1280px. Every feature must work or be intentionally hidden with a clear reason shown to the user.

---

## Skeleton Loaders

Always use the `.skeleton` utility class. Never write custom shimmer CSS.

```tsx
// CORRECT
<div className="skeleton h-4 w-3/4 rounded" />
<div className="skeleton h-64 rounded-2xl" />

// WRONG
<div className="animate-pulse bg-gray-200 h-4 w-3/4 rounded" />
```

Match skeleton dimensions to real content. A wrong-shaped skeleton is worse than none.

---

## States — Loading / Empty / Error / Success

Every feature needs all four states before it ships.

**Loading:** `.skeleton` class. Always.

**Empty state:** Has personality. Never "No data found."
- "No cards yet — the pod is still generating."
- "Drop your notes above to create your first pod."

**Error:** Says what to do next. Never "Something went wrong."
- "Microphone access denied. Enable it in System Settings → Privacy."

**Success:** Inline, not a toast.
```tsx
{saved && (
  <div className="flex items-center gap-3 p-4 bg-pink-soft border border-pink/20 rounded-2xl animate-fade-up">
    <AnimatedCheck />
    <p className="text-sm font-semibold">Saved!</p>
  </div>
)}
```

**Animated check:** SVG with `stroke-dasharray` + `strokeDashoffset` CSS keyframe draw animation — not a static ✓.

**Confetti:** `useRef` for stable random positions — never `Math.random()` in render (hydration mismatch). Exit via `animate-celebration-out` after 1.5s.

---

## Animations & Hover

All animations are CSS keyframes in `globals.css`. Do not use `framer-motion`.

| Class | Effect |
|-------|--------|
| `animate-fade-up` | Opacity 0→1 + translateY 16px→0, 0.3s ease-out |
| `animate-spring-in` | Scale 0.92→1 + opacity, spring feel |
| `animate-check` | SVG stroke-dashoffset draw |
| `animate-pulse-dot` | Breathing pulse for live indicators |
| `animate-bounce` | Three-dot typing indicator |

### Hover must feel smooth, not choppy

Every interactive element needs a transition. If hover feels instant or jarring, it is broken.

```css
/* Button hover */
button {
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
}
button:hover { transform: translateY(-1px); }
button:active { transform: translateY(0); }

/* Nav links */
a { transition: color 0.15s ease, opacity 0.15s ease; }
```

**Never use `transition-all`** — it transitions properties you don't want (width, height, layout) and causes jank.

### Navigation dropdowns

When a nav item has sub-pages, reveal them on hover with a downward slide, not a jump:

```css
.nav-dropdown {
  transform: translateY(-6px);
  opacity: 0;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
  pointer-events: none;
}
.nav-item:hover .nav-dropdown {
  transform: translateY(0);
  opacity: 1;
  pointer-events: auto;
}
```

The cubic-bezier `(0.16, 1, 0.3, 1)` gives a spring-like deceleration — things arrive and settle, they don't just stop.

Always check `prefers-reduced-motion`:
```ts
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
```

---

## Sound Effects

Web Audio API only — no audio files.

```ts
function playSound(type: "flip" | "correct" | "incorrect" | "match" | "complete") {
  const ctx = new AudioContext()
  // oscillator chain, under 200ms each
}
```

Each sound under 200ms. These are not optional — they make the study experience feel alive. Check `prefers-reduced-motion` before playing.

---

## 3D Card Flip

```css
.card-container { perspective: 1000px; }
.card-inner { transform-style: preserve-3d; transition: transform 0.5s; }
.card-inner.flipped { transform: rotateY(180deg); }
.card-front, .card-back { backface-visibility: hidden; }
.card-back { transform: rotateY(180deg); }
```

---

## Logo Rules

The Jump AI logo system:
- **JumpsGPT:** current logo — do not change it
- **JumpStudy:** "JS" — black J + pink S (light mode), white J + pink S (dark mode). Pencil aesthetic — clean strokes, not rounded/bubbly
- **JumpCode:** "coming soon" placeholder — do not design yet

**Every logo must:**
- Be an SVG (never PNG for logo use)
- Have NO background fill — transparent
- Work in both light mode and dark mode (two separate color schemes, not just inverted)
- Be downloadable as a standalone SVG file

```svg
<!-- Logo SVG template — no background, no border-radius wrapper -->
<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- light mode default; dark mode via CSS class or media query -->
</svg>
```

Never wrap a logo SVG in a `<div className="bg-white rounded-xl p-2">` — if the logo needs a background in context (e.g. dark nav), apply it to the container, not the SVG.

---

## Dark Mode

Every page and component must support dark mode. Required:
- `dark:` Tailwind variants on every color class
- Background: `bg-bg dark:bg-gray-950`
- Cards: `bg-surface dark:bg-gray-900`
- Text: `text-fg dark:text-gray-50`
- Borders: `border-border dark:border-gray-800`
- Test dark mode before shipping — missing `dark:` classes create invisible text or invisible backgrounds

---

## Image Cards

When showing images in cards:
- The card fits the image — no whitespace padding forced around it
- Use `object-cover` + a fixed aspect ratio (`aspect-[4/3]`, `aspect-square`, etc.)
- No white bar at the bottom of an image card — if it exists, it means the image is not filling its container

```tsx
<div className="rounded-2xl overflow-hidden aspect-[4/3]">
  <img src={src} alt={alt} className="w-full h-full object-cover" />
</div>
```

Never use `object-contain` for hero/card images — it leaves empty bars. Only use `object-contain` for logos or icons that must not be cropped.

---

## "Vibe-Coded" Detection

If something looks like it was made by an AI with no taste, it is vibe-coded. Signs:

- Inconsistent spacing (one section `py-4`, next section `py-20`, no reason)
- Random shadows (`shadow-xl` on a card inside a card)
- Too many font weights on one screen
- Colored backgrounds behind sections with no clear hierarchy purpose
- Headers and subheaders with near-identical sizes
- "Feature" cards that are just a colored box with an emoji and two sentences
- Images with visible white padding or wrong aspect ratios
- Hover states that feel instant (no transition) or jerky
- Buttons that don't change at all on hover

**If the user says "this looks vibe-coded" or "this is slop"** — do not patch it. Redesign the section from scratch using the rules in this skill.

---

## Leap Mascot

**Leap is a cute pink frog.** Not a generic emoji. Not swappable.

- `<LeapBubble>` — floating speech bubble, "🐸" prefix, close button
- `<LeapMascot>` — illustration on empty states and celebrations
- AI Tutor signs replies "🐸 Leap"
- PWA install prompt

Leap's voice: curious, Socratic, warm. She asks the student a question — she does not just explain.

**Never replace Leap with a generic frog or emoji.** Component: `components/ui/leap-mascot.tsx`.

---

## Copy Rules

**Bad (slop):**
> "Welcome! Our AI-powered platform uses cutting-edge technology to help you learn faster and smarter. Get started today!"

**Good:**
> "Drop your notes. Get flashcards, a quiz, a tutor, and a whiteboard — all grounded in how memory actually works."

Rules:
- First sentence is a concrete action, not a value claim
- Banned words: "cutting-edge", "powerful", "seamless", "intuitive", "state-of-the-art", "revolutionary"
- No EM dashes (—) anywhere in UI copy
- No emojis in headings or body copy (Leap's 🐸 is the only exception)
- Science is cited specifically: "Spaced Repetition (Ebbinghaus 1885)" not "proven methods"
- Streak messages: specific — "Study today to keep your 7-day streak!" not generic
- Error codes: use `JUMP-XXXX` format so users can search them

---

## PWA + Mobile

- Add to Home Screen prompt on first mobile visit → looks and behaves like a native app
- Test at 375px. If it's broken, it ships broken — not acceptable
- Some features can be desktop-only (whiteboard, matching game), but the reason must be shown clearly to the user on mobile, not just hidden

---

## Science Badges

Features are backed by peer-reviewed research. Show the citation inline:

```tsx
<span className="text-xs text-fg-muted">
  Spaced Repetition (Ebbinghaus 1885 → Cepeda 2006)
</span>
```

The 6 JumpStudy modes:
| Mode | Science |
|------|---------|
| Flashcards | SM-2 Spaced Repetition |
| Quiz | Testing Effect (Roediger 2006) |
| Matching | Interleaving (Bjork 1994) |
| Notes | Generative Learning (Wittrock 1992) |
| AI Tutor | Socratic Method (King 1992) |
| Whiteboard | Dual Coding (Paivio 1986) |

---

## Tooltips

Every icon-only button **must** have a tooltip. If a user hovers over a button and the only information is the icon shape, that is incomplete.

```tsx
<button title="Delete pod" aria-label="Delete pod">
  <TrashIcon size={16} />
</button>
```

Or a custom tooltip component:
```tsx
<Tooltip content="Delete pod">
  <button><TrashIcon /></button>
</Tooltip>
```

The tooltip text is 1–3 words, lowercase. It says what the button DOES, not what it IS. "Delete" not "Trash icon". "Add card" not "Plus button".

---

## Error Boundaries

Every page must be wrapped in an error boundary with a friendly fallback. A component throwing an error should never show a blank white screen.

```tsx
// app/layout.tsx or per-page
<ErrorBoundary fallback={<ErrorFallback />}>
  {children}
</ErrorBoundary>

function ErrorFallback({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="text-fg font-semibold">Something went wrong.</p>
      <button onClick={reset} className="btn-primary">Try again</button>
    </div>
  )
}
```

The fallback has a "Try again" button that calls `reset()`. It does not say "error" or show stack traces.

---

## Caching & Optimistic Updates

**Caching:** Data that doesn't change per-request should be cached. If clicking around the app takes 0.5–1s per page load for content that hasn't changed, add caching.

**Optimistic rendering:** For actions that almost always succeed (liking a pod, marking a card, saving a setting), update the UI immediately before the server responds:
```tsx
// Optimistic like
function LikeButton({ podId, initialLiked }) {
  const [liked, setLiked] = useState(initialLiked)
  
  function handleLike() {
    setLiked(!liked)          // update immediately
    toggleLike({ podId })     // fire mutation (may fail, handle that separately)
  }
  return <button onClick={handleLike}>{liked ? "♥" : "♡"}</button>
}
```

---

## Token Streaming

All AI responses must stream token-by-token, exactly like ChatGPT and Claude. Never wait for the full response and then render it all at once — users will think the app is broken.

```ts
// API route
const stream = await openai.chat.completions.create({ stream: true, ... })
for await (const chunk of stream) {
  const text = chunk.choices[0]?.delta?.content ?? ""
  controller.enqueue(encoder.encode(text))
}
```

The UI shows a blinking cursor at the end of the streaming text while the response is generating. Stops when `[DONE]` is received.

---

## Custom Favicon

The favicon must be custom — never the browser/framework default. The default favicon is one of the five most obvious "vibe-coded" signals.

- Light mode: pink J + dark S on transparent background
- Dark mode: pink J + white S on transparent background  
- Format: `favicon.ico` + `apple-touch-icon.png`
- Defined in `app/manifest.ts` — do not remove or reset

---

## Five Vibe-Coded Giveaways (Avoid All of These)

These are the signals that make users and investors assume the app was AI-slop in under 3 seconds:

1. **Purple or blue as the main accent** — those are AI defaults. Jump AI is pink, black, and white. Nothing else.
2. **Marketing copy that reads like GPT** — "powerful yet intuitive", "streamline your workflow", "cutting-edge", "revolutionize". If it sounds like a press release, rewrite it in plain language.
3. **Default favicon** — change it before anyone sees the app.
4. **No skeleton loaders** — content popping in or a blank screen while loading.
5. **Errors in the browser console** — any red in devtools is confirmation bias for "vibe-coded". Zero console errors before shipping.

---

## Anti-Vibe-Coded Workflow (Per Page)

When improving a page that "looks vibe-coded":

1. List every action a user can take on that page
2. Rank them by importance: what do most users come here to do?
3. Make the most important action the most visually prominent
4. Make secondary actions secondary (smaller, muted, lower on the page)
5. Remove anything not on the list

This fixes spacing, hierarchy, and layout in one pass — without redesigning from scratch.

---

## Content Length

Copy should be scannable. If it takes more than 10 seconds to understand a section, it is too long.

- Hero section: 1 headline + 1 subline + 1 CTA. Nothing else above the fold
- Feature cards: 1 label + 1 sentence. Not a paragraph
- Tooltips: 1 phrase. Not a sentence
- Error messages: 1 actionable sentence
- Empty states: 1 sentence + 1 CTA button

If you wrote 3 sentences where 1 would do, cut it to 1.

---

## What Slop Looks Like

If you are about to do any of these, stop:

```
className="... bg-gray-100 rounded-full p-2"   ← icon wrapper
bg-gradient-to-r from-pink-500 to-purple-500   ← gradient
text-4xl font-bold                              ← wrong type scale
Math.random() in render                         ← hydration crash
console.log in committed code                   ← never
"powerful" / "seamless" / "cutting-edge"        ← banned copy
"streamline your workflow" / "powerful yet intuitive" ← banned copy
A modal where {saved && ...} would work         ← wrong pattern
toast for every action                          ← wrong pattern
hex color instead of CSS variable               ← wrong pattern
feature with no skeleton                        ← incomplete
feature with no empty state                     ← incomplete
error that says "Something went wrong"          ← unhelpful
transition: all                                 ← causes jank
object-contain on a card image                  ← shows white bars
logo with a background box                      ← remove it
missing dark: variants                          ← invisible in dark mode
hover with no transition                        ← choppy
icon-only button with no tooltip                ← incomplete
purple or blue as accent color                  ← AI default, not Jump AI
default favicon                                 ← vibe-coded giveaway
AI response not streaming                       ← feels broken
no error boundary = blank white screen on crash ← unacceptable
```

---

## Pre-Ship Checklist

Before calling any UI task done, answer all 8:

1. Does the loading state use `.skeleton`?
2. Does the empty state have personality (not "No data")?
3. Does the error tell the user what to do next?
4. Are icons bare SVGs with no container?
5. Do icon-only buttons have tooltips?
6. Are colors CSS variables, not hex?
7. Does the layout breathe — nothing too cramped?
8. Is the copy specific and concrete, not vague or promotional?
9. Does it work at 375px?
10. Is AI output streaming (not batch)?
11. Is the page wrapped in an error boundary?
12. Is the favicon custom?
13. Zero red errors in browser devtools?
14. Does hover feel smooth (transition on everything interactive)?

If any answer is no, it is not done.
