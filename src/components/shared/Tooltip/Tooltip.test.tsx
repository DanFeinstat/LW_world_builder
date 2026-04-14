// src/components/shared/Tooltip/Tooltip.test.tsx
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { Tooltip } from './Tooltip'

function renderWithProvider(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>)
}

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the default info icon trigger with accessible label', () => {
    renderWithProvider(<Tooltip content="Hello" />)
    expect(screen.getByRole('button', { name: 'More information' })).toBeInTheDocument()
  })

  it('renders custom children as the trigger instead of the info icon', () => {
    renderWithProvider(
      <Tooltip content="Hello">
        <button type="button">Custom trigger</button>
      </Tooltip>
    )
    expect(screen.getByRole('button', { name: 'Custom trigger' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'More information' })).not.toBeInTheDocument()
  })

  it('renders the trigger but no tooltip when content is empty', () => {
    renderWithProvider(<Tooltip content={undefined} />)
    // Trigger still renders (no layout shift)
    expect(screen.getByRole('button', { name: 'More information' })).toBeInTheDocument()
    // Tooltip content is not in the DOM at all — inert
    // (We verify this by ensuring the Radix tooltip root is not rendered;
    // the trigger button has no aria-describedby)
    const btn = screen.getByRole('button', { name: 'More information' })
    expect(btn).not.toHaveAttribute('aria-describedby')
  })

  it('shows tooltip content on hover', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderWithProvider(<Tooltip content="Tooltip text" />)
    const trigger = screen.getByRole('button', { name: 'More information' })
    await user.hover(trigger)
    await act(async () => { vi.advanceTimersByTime(400) })
    expect(screen.getByText('Tooltip text')).toBeInTheDocument()
  })

  it('keeps tooltip open after click even when mouse leaves', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderWithProvider(<Tooltip content="Locked content" />)
    const trigger = screen.getByRole('button', { name: 'More information' })
    // Click to lock
    await user.click(trigger)
    await act(async () => { vi.advanceTimersByTime(50) })
    expect(screen.getByText('Locked content')).toBeInTheDocument()
    // Unhover — should stay open because locked
    await user.unhover(trigger)
    await act(async () => { vi.advanceTimersByTime(50) })
    expect(screen.getByText('Locked content')).toBeInTheDocument()
  })

  it('closes tooltip when Escape is pressed while locked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderWithProvider(<Tooltip content="Locked content" />)
    const trigger = screen.getByRole('button', { name: 'More information' })
    await user.click(trigger)
    await act(async () => { vi.advanceTimersByTime(50) })
    expect(screen.getByText('Locked content')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await act(async () => { vi.advanceTimersByTime(50) })
    expect(screen.queryByText('Locked content')).not.toBeInTheDocument()
  })

  it('closes tooltip when clicking outside while locked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderWithProvider(
      <div>
        <Tooltip content="Locked content" />
        <button type="button">Outside</button>
      </div>
    )
    const trigger = screen.getByRole('button', { name: 'More information' })
    await user.click(trigger)
    await act(async () => { vi.advanceTimersByTime(50) })
    expect(screen.getByText('Locked content')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Outside' }))
    await act(async () => { vi.advanceTimersByTime(50) })
    expect(screen.queryByText('Locked content')).not.toBeInTheDocument()
  })
})
