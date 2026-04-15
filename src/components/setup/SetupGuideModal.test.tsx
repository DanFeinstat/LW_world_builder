// src/components/setup/SetupGuideModal.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SetupGuideModal } from './SetupGuideModal'

describe('SetupGuideModal', () => {
  it('renders with the correct title when open', () => {
    render(<SetupGuideModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('Setting Up Campaign Manager')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<SetupGuideModal isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByText('Setting Up Campaign Manager')).not.toBeInTheDocument()
  })

  it('renders all four step headings', () => {
    render(<SetupGuideModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText(/Create the data repo/i)).toBeInTheDocument()
    expect(screen.getByText(/Invite your group/i)).toBeInTheDocument()
    expect(screen.getByText(/Create your Personal Access Token/i)).toBeInTheDocument()
    expect(screen.getByText('Connect')).toBeInTheDocument()
  })

  it('renders github.com/new link with target="_blank" and rel="noreferrer"', () => {
    render(<SetupGuideModal isOpen={true} onClose={vi.fn()} />)
    const link = screen.getByRole('link', { name: /github\.com\/new/i })
    expect(link).toHaveAttribute('href', 'https://github.com/new')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')
  })

  it('renders fine-grained tokens link with target="_blank" and rel="noreferrer"', () => {
    render(<SetupGuideModal isOpen={true} onClose={vi.fn()} />)
    const link = screen.getByRole('link', { name: /personal-access-tokens\/new/i })
    expect(link).toHaveAttribute('href', 'https://github.com/settings/personal-access-tokens/new')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')
  })

  it('renders classic PAT fallback link', () => {
    render(<SetupGuideModal isOpen={true} onClose={vi.fn()} />)
    const link = screen.getByRole('link', { name: /settings\/tokens\/new/i })
    expect(link).toHaveAttribute('href', 'https://github.com/settings/tokens/new')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')
  })

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn()
    render(<SetupGuideModal isOpen={true} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
