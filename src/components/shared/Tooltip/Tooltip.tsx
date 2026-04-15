// src/components/shared/Tooltip/Tooltip.tsx
import { useState, useEffect, useRef } from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import clsx from 'clsx'

export interface TooltipProps {
  content?: React.ReactNode
  children?: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
}

function InfoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}

export function Tooltip({ content, children, side = 'top', align = 'center' }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Click-outside dismissal when locked
  useEffect(() => {
    if (!isLocked) return

    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node
      if (wrapperRef.current?.contains(target)) return
      if (contentRef.current?.contains(target)) return
      setIsLocked(false)
      setIsOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isLocked])

  // Escape dismissal — capture phase so we run before Radix's handler.
  // Radix's onOpenChange would otherwise be blocked by our isLocked guard.
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsLocked(false)
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [isOpen])

  const trigger = children ?? (
    <button
      type="button"
      aria-label="More information"
      className="inline-flex items-center text-text-muted hover:text-text-secondary transition-colors duration-fast"
    >
      <InfoIcon />
    </button>
  )

  if (!content) {
    return <span>{trigger}</span>
  }

  function handleOpenChange(open: boolean) {
    if (isLocked && !open) return
    setIsOpen(open)
    if (!open) setIsLocked(false)
  }

  function handleClick() {
    if (isLocked) {
      setIsLocked(false)
      setIsOpen(false)
    } else {
      setIsLocked(true)
      setIsOpen(true)
    }
  }

  return (
    <TooltipPrimitive.Root
      open={isOpen}
      onOpenChange={handleOpenChange}
      delayDuration={300}
    >
      <span ref={wrapperRef}>
        <TooltipPrimitive.Trigger asChild onClick={handleClick}>
          {trigger}
        </TooltipPrimitive.Trigger>
      </span>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          ref={contentRef}
          side={side}
          align={align}
          sideOffset={10}
          className={clsx(
            'z-modal max-w-sm rounded-lg border border-border-strong',
            'bg-surface-raised px-4 py-3 shadow-lg',
            'text-sm text-text-primary leading-base',
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-surface-raised" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
