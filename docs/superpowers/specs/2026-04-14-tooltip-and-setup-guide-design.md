# Design: Tooltip Component + PAT Setup Guide Modal

**Date:** 2026-04-14
**Status:** Approved

---

## Overview

Two related deliverables:

1. A reusable `Tooltip` shared component built on `@radix-ui/react-tooltip`
2. A "Need help setting up?" modal on the SetupScreen with full step-by-step onboarding instructions
3. A PAT field tooltip on the SetupScreen using the new Tooltip component

These are motivated by the need to guide users — particularly players being onboarded by a DM — through GitHub repo creation, collaborator invitations, and fine-grained PAT setup without leaving the app.

---

## Architecture context

The app reads and writes campaign data via the GitHub Contents API (REST). There is no backend. All users point to **one shared data repo** owned by the DM. Each user authenticates with their own Personal Access Token scoped to that shared repo. The polling hook (`usePolling`) detects remote changes every 30 seconds and re-fetches data automatically — this is how all group members see each other's edits.

---

## 1. Tooltip Component

### File

```
src/components/shared/Tooltip/Tooltip.tsx
```

No barrel file. Consumers import directly:
```tsx
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'
```

### Dependency

Add `@radix-ui/react-tooltip` to `package.json`. Mount `<TooltipProvider>` once in `App.tsx` alongside the existing `<ToastStack>`.

### Props

```ts
interface TooltipProps {
  content?: React.ReactNode        // if absent/empty, tooltip is inert
  children?: React.ReactNode       // custom trigger; defaults to info icon
  side?: 'top' | 'right' | 'bottom' | 'left'  // default: 'top'
  align?: 'start' | 'center' | 'end'           // default: 'center'
}
```

### Behavior

**Radix handles automatically:**
- Portal rendering into `document.body`
- Fixed positioning and coordinate calculation
- Collision detection and auto-flip (`avoidCollisions` on by default)
- Escape key closes the tooltip
- ARIA roles and keyboard accessibility
- Resize/scroll repositioning

**We layer on top of Radix:**
- **Click/touch lock:** track `isLocked: boolean` in local state. On click, toggle lock. When locked, use Radix's controlled `open={true}` and suppress `onOpenChange` dismissal until click-outside or Escape fires, which clears both open and locked state.
- **Hover:** Radix's default `delayDuration` handles hover open/close. When not locked, hover behaves normally.
- **Inert state:** when `content` is falsy, render `children` (or the info icon) with no Radix wrapper and no event handlers. The trigger still renders so layout doesn't shift.
- **Default trigger:** when `children` is omitted, render a styled `<button type="button">` containing an info icon (`ⓘ` or an SVG equivalent). The button is focusable and screen-reader labelled (`aria-label="More information"`).

### Styling

Tooltip bubble styled with Tailwind:
- Background: `bg-surface-raised`
- Border: `border border-border`
- Shadow: `shadow-md`
- Text: `text-sm text-text-primary`
- Padding: `px-3 py-2`
- Border radius: `rounded-md`
- Max width: `max-w-xs` (prevent runaway wide tooltips)

Arrow rendered via `Tooltip.Arrow` (Radix built-in), filled to match bubble background.

---

## 2. SetupScreen — PAT Field Tooltip

### Field component change

The existing `Field` component in `SetupScreen.tsx` gains an optional `tooltip` prop:

```tsx
function Field({
  label,
  htmlFor,
  hint,
  tooltip,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  tooltip?: React.ReactNode
  children: React.ReactNode
})
```

When `tooltip` is provided, the label row renders as a flex row with the label text and a `<Tooltip>` info icon inline:

```tsx
<div className="flex items-center gap-1">
  <label htmlFor={htmlFor} ...>{label}</label>
  <Tooltip content={tooltip} />
</div>
```

### PAT tooltip content

Compact, focused only on creating the token — not on repo creation or collaborator setup (those belong in the setup guide modal).

```
1. Go to GitHub → Settings → Developer Settings →
   Personal access tokens → Fine-grained tokens
2. Click "Generate new token"
3. Under Repository access — select only the shared campaign repo
4. Under Permissions — set Contents to Read and Write
5. Generate and copy, then paste it here
```

Rendered as a numbered list in JSX. No external links in the tooltip (keep it scannable). Side: `top`, align: `center`.

---

## 3. Setup Guide Modal

### Trigger

A "Need help setting up?" text link centered below the "Connect Repository" button on the SetupScreen. Opens the existing `Modal` component.

### Modal content — four numbered sections

**1. Create the data repo**
- Link: https://github.com/new
- Create a new empty GitHub repository. This is where all campaign data lives.
- Share the repository owner name and repo name with your whole group.

**2. Invite your group** *(skip this step if you are the repo owner)*
- Go to your repo → Settings → Collaborators → Add people
- Invite each DM and player by GitHub username
- Each person must accept the invitation email before they can create a scoped token

**3. Create your Personal Access Token**
- Link: https://github.com/settings/personal-access-tokens/new
- Token type: Fine-grained token
- Repository access: select only the shared campaign repo
- Permissions → Contents: Read and Write
- Generate and copy the token
- *If your GitHub organization does not support fine-grained tokens, create a classic token (https://github.com/settings/tokens/new) with the `repo` scope instead.*

**4. Connect**
- Enter the repo owner's GitHub username, the repo name, and your token into the form
- Click "Connect Repository"

### Modal UI

- Uses existing `Modal` component (overlay, Escape-to-close, close button in header)
- Each step is a visually distinct numbered block
- External links open in a new tab (`target="_blank" rel="noreferrer"`)
- Modal title: "Setting Up Campaign Manager"

---

## 4. Architectural decisions recorded

- **No barrel files** — import directly from component files. No `index.ts` re-exports anywhere in the project.
- **One shared data repo** — all group members (DM and players) point to the same GitHub repo. Each creates their own PAT. Roles are fluid (players can be promoted to DM), so everyone needs Contents: Read and Write.
- **Fine-grained PAT recommended** — scoped to a single repo, narrowest possible access. Classic PAT (`repo` scope) noted as fallback for orgs that don't support fine-grained tokens.

---

## 5. Files changed

| File | Change |
|---|---|
| `package.json` | add `@radix-ui/react-tooltip` |
| `src/App.tsx` | mount `<TooltipProvider>` |
| `src/components/shared/Tooltip/Tooltip.tsx` | new component |
| `src/components/setup/SetupScreen.tsx` | add PAT tooltip, setup guide trigger, `Field` tooltip prop |

No new routes, no new stores, no new contexts.
