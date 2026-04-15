// src/components/shared/Tooltip/Tooltip.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { Tooltip } from './Tooltip'

function renderWithProvider(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>)
}

describe('Tooltip', () => {
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
    // Radix root not mounted — no aria-describedby on the trigger
    const btn = screen.getByRole('button', { name: 'More information' })
    expect(btn).not.toHaveAttribute('aria-describedby')
  })

  it('shows tooltip content when clicked (locks open)', async () => {
    renderWithProvider(<Tooltip content="Tooltip text" />)
    await userEvent.click(screen.getByRole('button', { name: 'More information' }))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('keeps tooltip open after click even when mouse leaves', async () => {
    renderWithProvider(<Tooltip content="Locked content" />)
    const trigger = screen.getByRole('button', { name: 'More information' })
    await userEvent.click(trigger)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    await userEvent.unhover(trigger)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('closes tooltip when Escape is pressed while locked', async () => {
    renderWithProvider(<Tooltip content="Locked content" />)
    await userEvent.click(screen.getByRole('button', { name: 'More information' }))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('closes tooltip when clicking outside while locked', async () => {
    renderWithProvider(
      <div>
        <Tooltip content="Locked content" />
        <button type="button">Outside</button>
      </div>
    )
    await userEvent.click(screen.getByRole('button', { name: 'More information' }))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Outside' }))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
