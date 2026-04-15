import * as Dialog from '@radix-ui/react-dialog'
import clsx from 'clsx'
import { ReactNode, PropsWithChildren } from 'react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: ReactNode
  size?: 'md' | 'lg'
}

const sizeClass = {
  md: 'w-[480px]',
  lg: 'w-[720px]',
} as const

export function Modal({ isOpen, onClose, title, size = 'md', children }: PropsWithChildren<ModalProps>) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={open => { if (!open) onClose() }}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay
          data-testid="modal-overlay"
          className="fixed inset-0 z-modal bg-black/50 opacity-25"
        />

        {/* Panel — Dialog.Content IS the dialog element (role="dialog", aria-modal) */}
        <Dialog.Content
          className={clsx(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-modal',
            'flex flex-col min-h-[240px] max-h-[85vh] max-w-[90vw]',
            'bg-surface border border-border rounded-lg shadow-lg overflow-hidden',
            sizeClass[size],
          )}
        >
          {/* Header */}
          <div className="flex items-center h-14 px-4 border-b border-border flex-shrink-0">
            <Dialog.Title className="flex-1 truncate text-base font-semibold text-text-primary">
              {title}
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close"
              className="flex-shrink-0 ml-4 text-text-muted hover:text-text-primary transition-colors duration-fast"
            >
              ✕
            </Dialog.Close>
          </div>

          {/* Body — no padding; consumers own their own padding */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
