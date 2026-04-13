# Modal Component Design

**Date:** 2026-04-13
**Step:** Phase 1, Step 10 — Shared Components (Modal)

---

## Goal

Build a generic `Modal` component on top of Radix UI Dialog primitives that abstracts away accessibility concerns (focus trap, scroll lock, portal rendering, ARIA wiring) and provides a consistent visual shell for all modal dialogs in the app. The first and only Phase 1 consumer is `ArticleEditor`, which moves from an inline right-panel render into a modal.

---

## Non-goals

- `Badge` — redundant with existing `ArticleTypeBadge`; not built
- `RoleTag` — no Phase 1 consumer; not built
- Framer Motion animations — deferred to Phase 4
- Compound component API (Modal.Header, Modal.Body, etc.) — not needed; Approach A (children) is sufficient

---

## Dependencies

**New package:** `@radix-ui/react-dialog`

Install: `npm install @radix-ui/react-dialog`

Radix is per-primitive (MIT license, zero cost). Dialog adds ~15-20kb gzipped. Shared Radix utilities amortize across future primitives. Not a concern for this project's use case.

---

## Architecture

### Files

| File | Role |
|---|---|
| `src/components/shared/Modal/Modal.tsx` | Generic modal shell wrapping Radix Dialog |
| `src/components/shared/Modal/Modal.test.tsx` | Contract tests |
| `src/App.tsx` | Updated to open `ArticleEditor` in a `Modal` |

No new files in `src/components/articles/` — `ArticleEditor` is unchanged internally.

---

## Component API

```tsx
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string           // required — wired to aria-labelledby via Radix Dialog.Title
  size?: 'md' | 'lg'     // default: 'md'
  children: React.ReactNode
}
```

`title` is required (not optional). Radix automatically wires `Dialog.Title` to `aria-labelledby` on the dialog — a missing title breaks screen reader accessibility.

Usage:

```tsx
<Modal isOpen={isEditorOpen} onClose={handleCancel} title="New Article" size="lg">
  <ArticleEditor article={editingArticle} allArticles={articles} onSaved={handleSaved} onCancel={handleCancel} />
</Modal>
```

---

## What Radix Handles (no code required)

- Portal rendering to `document.body` — modal DOM node is outside the React tree, immune to ancestor stacking contexts
- Focus trap — Tab cycles only within the dialog while open; nothing outside is reachable
- Body scroll lock — page scroll is disabled while the modal is open
- Escape key close — fires `onClose` automatically
- Backdrop click close — fires `onClose` via `onPointerDownOutside`
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` — wired automatically by Radix

---

## Sizing Model

### Width — prop-driven, not content-driven

The `size` prop sets a fixed width. Short content does not collapse the modal.

| Size | Class |
|---|---|
| `md` | `w-[480px] max-w-[90vw]` |
| `lg` | `w-[720px] max-w-[90vw]` |

`max-w-[90vw]` is only for small-viewport safety. On normal screens the modal is always exactly 480px or 720px wide.

### Height — bounded, not fixed

```
min-h-[240px]   — short content never produces a tiny sliver
max-h-[85vh]    — tall content never runs off screen
```

Between those bounds, height is driven by content.

### Internal layout

```
panel: flex flex-col, min-h-[240px], max-h-[85vh], overflow-hidden
  ├── header: flex-shrink-0, h-14       — never compressed regardless of body height
  └── body: flex-1, overflow-y-auto     — scrolls when content exceeds remaining space
```

`overflow-hidden` on the panel clips children to the rounded corners.

### Title overflow

The header is a fixed-height zone (`h-14`). Long titles truncate with ellipsis:

```
header: flex items-center h-14 px-6 border-b border-border
  title: flex-1 truncate text-base font-semibold text-text-primary
  close button: flex-shrink-0 ml-4
```

The close button is `flex-shrink-0` — it is never squeezed by a long title.

---

## Visual Shell

### Overlay (backdrop)

```
fixed inset-0 z-modal bg-black/50
```

### Dialog panel

```
bg-surface border border-border rounded-lg shadow-lg
```

### Animations

No enter/exit animations in Phase 1. Framer Motion animations are deferred to Phase 4. The modal appears and disappears without transition — this is intentional and correct for Phase 1.

The tailwind config defines a `slideIn` keyframe for Toast. A similar pattern can be used for modal animations when Phase 4 arrives, at which point Framer Motion will replace all manual keyframes.

### Full structure

```
// Overlay (Radix Dialog.Overlay)
fixed inset-0 z-modal bg-black/50
  [transition classes]

// Centering wrapper (inside Radix Dialog.Content)
fixed inset-0 z-modal flex items-center justify-center p-4

  // Panel
  w-[480|720]px max-w-[90vw]
  flex flex-col min-h-[240px] max-h-[85vh]
  bg-surface border border-border rounded-lg shadow-lg overflow-hidden

    // Header
    flex items-center h-14 px-6 border-b border-border flex-shrink-0
      // Title
      flex-1 truncate text-base font-semibold text-text-primary
      // Close button (✕)
      flex-shrink-0 ml-4 — uses existing button token styles

    // Body
    flex-1 overflow-y-auto  (no padding — consumers own their own padding)
      {children}
```

---

## App.tsx Changes

`ArticlesPanel` currently renders `ArticleEditor` inline in the right panel when `mode === 'editor'`. Changes:

1. Replace `mode: PanelMode` with two independent state values:
   - `selectedId: string | null` (unchanged)
   - `isEditorOpen: boolean`
2. The right panel only ever shows `ArticleDetail` or the empty state — editor is removed from the panel
3. `handleNew` and `handleEdit` set `isEditorOpen(true)` instead of `setMode('editor')`
4. `handleSaved` and `handleCancel` set `isEditorOpen(false)`
5. Modal title: `editingArticle ? \`Edit ${editingArticle.title}\` : 'New Article'`

```tsx
<Modal
  isOpen={isEditorOpen}
  onClose={handleCancel}
  title={editingArticle ? `Edit ${editingArticle.title}` : 'New Article'}
  size="lg"
>
  <ArticleEditor
    article={editingArticle}
    allArticles={articles}
    onSaved={handleSaved}
    onCancel={handleCancel}
  />
</Modal>
```

---

## Contract Tests

Six tests in `Modal.test.tsx`:

| # | Test |
|---|---|
| 1 | Renders children when `isOpen={true}` |
| 2 | Does not render children when `isOpen={false}` |
| 3 | Renders the `title` prop |
| 4 | Close button (✕) calls `onClose` |
| 5 | Escape key calls `onClose` |
| 6 | Clicking the overlay calls `onClose` |

Radix Dialog uses `createPortal` internally. Tests require `@testing-library/react` with jsdom (already configured). Radix renders the portal into `document.body` — `screen.getByRole('dialog')` still works because RTL queries the full document.

---

## Design Token Usage

| Token | Usage |
|---|---|
| `bg-surface` | Panel background |
| `border-border` | Panel border + header divider |
| `shadow-lg` | Panel drop shadow |
| `text-text-primary` | Title text |
| `z-modal` | Overlay and panel z-index (200, between z-dropdown:100 and z-toast:300) |
| `bg-black/50` | Overlay backdrop |
| `rounded-lg` | Panel corner radius |
