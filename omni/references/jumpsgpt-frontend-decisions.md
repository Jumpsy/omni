# JumpsGPT Frontend — How It Was Built & Why It Works

Read this before touching any UI in the JumpsGPT / JumpStudy codebase.
This is not aspirational — it is a record of decisions that were made and must be preserved.

---

## The One Rule That Prevents Slop

**Every element earns its place. If you can remove it and the screen still communicates the same thing, remove it.**

Slop happens when an AI adds things to feel complete: icon backgrounds, gradient overlays, decorative dividers, filler copy, emoji in headings, pill badges on everything, shadows on shadows. None of those are in this codebase. If you are about to add one, stop.

---

## Color — How It Actually Works

The palette is a real design system in `app/globals.css`. Use CSS variables, never hex.

```css
/* Brand */
--pink: #d61a6f          /* accessible 4.5:1 on white */
--pink-deep: #c2185b     /* hover states */
--pink-soft: rgba(255,46,136,0.1)  /* tinted backgrounds */
--on-pink: #ffffff       /* text on pink backgrounds */

/* Surface hierarchy (light) */
--bg: #ffffff            /* page background */
--surface: #ffffff       /* card / panel level */
--surface-2: #f6f6f4     /* nested inputs, code blocks */
--surface-3: #e7e7e3     /* pressed states */

/* Text hierarchy */
--fg: #0b0b0d            /* primary text */
--fg-muted: #5b606b      /* secondary text, labels */
--fg-subtle: #6e737e     /* placeholder, captions */

/* Borders */
--border: #eaeaec        /* default */
--border-strong: #d9d9dd /* hover / focus ring */
```

**Full shade palettes** (`--pink-50` through `--pink-900`, `--gray-50` through `--gray-900`) are registered in Tailwind via `@theme inline`. Use them as `bg-pink-100`, `text-gray-600`, `border-pink-200`.

### What makes it feel cohesive
- The page background in JumpStudy is `bg-pink-50 dark:bg-gray-950` — a very faint pink tint, not white
- Cards sit on `bg-surface` (white in light mode) so they lift off the page without a shadow
- Pink is used for **one thing at a time**: the active state, the CTA, or the accent — never two at once
- No gradients. Ever. If something needs depth, use a slightly darker surface or a `1px border`

---

## Typography

Two fonts, used consistently:

| Variable | Font | Used for |
|----------|------|---------|
| `--font-display` / `font-display` | Space Grotesk | Headlines, pod titles, big numbers |
| `--font-sans` / `font-sans` | Geist | Body, labels, UI chrome |

**Handwriting mode:** When `html[data-font="handwritten"]` is set, ALL font variables swap to the handwritten font automatically via globals.css. `JumpStudyFontApplier` sets this from localStorage. `JumpStudyFontToggle` shows the "Aa" button. Never manage font state manually — use these components.

Type scale uses fluid clamp values:
- `text-display` → `clamp(2rem, 1.4rem + 2.2vw, 3.25rem)` with `tracking-[-0.035em]`
- `text-h1`, `text-h2`, `text-lead` follow the same pattern

**Slop to avoid:** Don't use `text-4xl font-bold` for headlines — use `font-display text-h1 font-semibold`. Don't use `font-bold` on body copy — it's too heavy. Use `font-medium` or `font-semibold`.

---

## Icons — The Most Common Source of Slop

Icons are **bare SVGs with no container**. No circle background. No rounded square. No `p-2 bg-gray-100 rounded-lg` wrapper. Nothing.

```tsx
// CORRECT — bare path, no container
function Icon({ path, size = 18 }: { path: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d={path} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
```

Icon color comes from `currentColor` — it inherits from the text color of the parent. Hover states are handled on the parent button, not the icon.

**When to use icons:** Sparingly. Navigation, action buttons, status indicators. Not as decoration. Not next to every label. If text alone communicates the action, skip the icon.

**Spacing:** Icons in buttons use `gap-2` or `gap-1.5` with the label. Never `gap-4` — that's too spread out.

---

## Spacing & Layout

The design breathes. Sections have `py-10` to `py-28`. Cards have `p-5` to `p-8`. Nothing is cramped.

**JumpStudy pod layout:** 3 columns — `lg:grid-cols-[200px,1fr,200px]` with `gap-8`. Left nav and right stats panel are symmetric — same width, same border treatment (`border-r` / `border-l`), same `pl-6` / `pr-6` padding. This is what makes the layout feel "open."

**Card radius:** `rounded-2xl` (16px) for main cards. `rounded-xl` (12px) for inner elements. `rounded-lg` for small things. Never `rounded-full` on cards.

**Borders over shadows:** Most cards use `border border-border` with no shadow. Shadows (`shadow-lift`, `shadow-soft`) are reserved for modals, dropdowns, and elements that float above the page.

---

## Skeleton Loaders

Always use the `.skeleton` utility class. Never write custom shimmer CSS.

```tsx
// CORRECT
<div className="skeleton h-4 w-3/4 rounded" />
<div className="skeleton h-64 rounded-2xl" />

// WRONG — do not do this
<div className="animate-pulse bg-gray-200 h-4 w-3/4 rounded" />
```

The `.skeleton` class in `globals.css` handles the shimmer animation, dark mode, and respects `prefers-reduced-motion`. Match the skeleton dimensions to the real content — a skeleton that's the wrong shape is worse than none.

---

## Success States & Feedback

Feedback uses **inline states**, not toasts when possible.

**Pattern for success:**
```tsx
// Inside a form/action — show inline
{saved && (
  <div className="flex items-center gap-3 p-4 bg-pink-soft border border-pink/20 rounded-2xl animate-fade-up">
    <svg width="20" height="20" ...>  {/* animated checkmark */}
    <p className="text-sm font-semibold">Saved!</p>
  </div>
)}
```

**The animated check:** Use an SVG with `stroke-dasharray` + `strokeDashoffset` animated via CSS keyframes, not a static ✓. It communicates "this just happened."

**Session banner** (after completing flashcard set):
```tsx
function SessionBanner({ reviewed, correct }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-pink-soft border border-pink/20 rounded-2xl animate-fade-up">
      <div className="flex-1">
        <p className="font-semibold text-sm">Nice session!</p>
        <p className="text-xs text-fg-muted mt-0.5">{reviewed} cards · {correct} correct</p>
      </div>
      {/* animated check SVG */}
    </div>
  )
}
```

**Confetti (FirstPodCelebration):** Uses `useRef` to generate stable random positions — never `Math.random()` inside render. Confetti colors use the full pink palette (`--pink`, `--pink-deep`, `#FFB3D4`, `#FFD700`, etc.). Exits via `animate-celebration-out` after 1.5s.

---

## Animations

All animations are CSS keyframes defined in `globals.css`. Do not use `framer-motion`.

| Class | What it does |
|-------|-------------|
| `animate-fade-up` | Opacity 0→1 + translateY 16px→0, 0.3s ease-out |
| `animate-spring-in` | Scale 0.92→1 + opacity, spring feel |
| `animate-check` | SVG stroke-dashoffset draw animation |
| `animate-pulse-dot` | Breathing pulse for live indicators |
| `animate-bounce` | Three-dot typing indicator |

Always respect `prefers-reduced-motion`. The sound effect system already checks this:
```ts
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
```

---

## Sound Effects

The pod page uses **Web Audio API** to synthesize sounds — no audio files.

```ts
function playSound(type: "flip" | "correct" | "incorrect" | "match" | "complete") {
  const ctx = new AudioContext()
  const gain = ctx.createGain()
  // ... oscillator chain
}
```

Each sound is under 200ms. Flip is a soft sine. Correct is a two-note rise. Complete is a four-note flourish. These are not optional decoration — they make the study experience feel alive. Do not remove them.

---

## The Leap Mascot

**Leap is a cute pink frog.** She is not a generic emoji. She is not swappable. She appears in:
- `<LeapBubble>` — floating speech bubble with pink gradient, "🐸" prefix, close button
- `<LeapMascot>` — illustration on empty states and celebrations
- AI Tutor replies sign with "🐸 Leap"
- PWA install prompt

When writing AI tutor responses, end with Leap's voice — curious, Socratic, warm. She does not just explain; she asks the student a question.

---

## Copy — How to Not Write Slop

**Bad (slop):**
> "Welcome to JumpStudy! Our AI-powered platform uses cutting-edge technology to help you learn faster and smarter. Get started today!"

**Good (how the codebase is written):**
> "Drop your notes. Get flashcards, a quiz, a tutor, and a whiteboard — all grounded in how memory actually works."

Rules:
- First sentence is a concrete action, not a value claim
- No "cutting-edge", "powerful", "seamless", "intuitive"
- Science is cited specifically: "Spaced Repetition (Ebbinghaus 1885 → Cepeda 2006)" not "proven methods"
- Empty states have personality: "No cards yet — the pod is still generating." not "No data found."
- Error messages say what to do: "Microphone access denied." not "An error occurred."
- Streak messages: "Study today to keep your {n}-day streak!" — specific, not generic

---

## What JumpStudy's Pod Page Does Structurally

```
Header (sticky) — pod title, mastery bar, share, font toggle, public/private, delete
  ├── Mobile mode strip (horizontal scroll, shown <lg)
  └── 3-column grid (lg+)
        ├── Left sidebar (sticky, 200px) — pod identity + nav + generate-more-cards
        ├── Main content (flex-1) — active study mode
        └── Right sidebar (sticky, 200px) — mastery %, due count, streak, session stats
```

Both sidebars use `border-r` / `border-l border-border` with `pr-6` / `pl-6`. No background. No shadow. They feel like columns on a page, not panels in an app. That is the "open" design.

The main content area has `min-h-[60vh]` so it never collapses when switching modes.

---

## Convex Data Patterns

- All Convex queries that could be undefined during load get `?? []` or `?? 0` — never pass `undefined` to a component expecting data
- Loading state = skeleton (via the `.skeleton` class)
- Error state = inline `<p className="text-sm text-danger">` — not a toast, not a modal
- `ConvexSafe` wrapper (`components/ui/convex-safe.tsx`) isolates Convex errors so they don't crash the whole page — use it on any page that has optional Convex queries

---

## The Remotion Video

The `RemotionVideoPlayer` (`components/landing/remotion-player.tsx`) is a **22-second browser-rendered product tour** at 1280×720 @ 30fps (660 frames):

1. **Logo spring-in** (frames 0–20) — `spring()` from Remotion, damping 14
2. **JumpsGPT chat** (frames 20–215) — Auto Router badge, streaming answer with cursor
3. **Transition slide** (frames 215–235) — fade to "JumpStudy" wordmark
4. **JumpStudy scene** (frames 235–640):
   - Notes typing → "Pod created!" success banner
   - 6 mode buttons appear with science labels
   - 3D flashcard flip (`rotateY`, `backface-visibility: hidden`)
   - Again/Hard/Good/Easy rating row
   - AI Tutor Socratic exchange with Leap
5. **Sign-off** (frames 640–660) — "Study smarter. Not harder."

Brand colors are mirrored as JS constants (`DARK`, `LIGHT`) matching `globals.css` exactly. Theme follows the page's `dark` class via `MutationObserver`.

---

## What "Slop" Looks Like in This Codebase

Slop is any of:
- `className="... bg-gray-100 rounded-full p-2"` wrapping an icon
- `<div className="from-pink-500 to-purple-500 bg-gradient-to-r">`
- Copy that says "powerful", "seamless", "intuitive", "state-of-the-art"
- A modal where inline feedback would work
- A toast for every action
- `Math.random()` in render (causes hydration mismatch — use `useRef`)
- Hardcoded hex colors instead of CSS variables
- `text-4xl font-bold` instead of `font-display text-h1 font-semibold`
- A feature that has no loading skeleton
- A feature that has no empty state
- An error that says "Something went wrong" with no actionable next step
- `console.log` left in committed code

---

## Before You Ship Anything

1. Does the loading state use `.skeleton`?
2. Does the empty state have personality (not "No data")?
3. Does the error tell the user what to do?
4. Are icons bare SVGs with no container?
5. Are colors CSS variables, not hex?
6. Does the layout breathe — is there a mode that's too cramped?
7. Is the copy specific and concrete, not vague and promotional?
8. Does it work at 375px (mobile)?
