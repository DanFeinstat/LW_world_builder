import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Modal } from './Modal'

describe('Modal', () => {
  it('renders children when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
  })

  it('renders the title prop', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="My Custom Title">
        <div>content</div>
      </Modal>
    )
    expect(screen.getByText('My Custom Title')).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        <div>content</div>
      </Modal>
    )
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        <div>content</div>
      </Modal>
    )
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when the overlay is clicked', async () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        <div>content</div>
      </Modal>
    )
    // Radix dismisses on pointerdown outside Dialog.Content.
    // Click the overlay element directly.
    fireEvent.pointerDown(screen.getByTestId('modal-overlay'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
