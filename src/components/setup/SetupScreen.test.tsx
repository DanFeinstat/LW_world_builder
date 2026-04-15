// src/components/setup/SetupScreen.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { AppProvider } from '@/context/AppContext'
import { SetupScreen } from './SetupScreen'

function renderSetupScreen() {
  return render(
    <AppProvider>
      <TooltipProvider>
        <SetupScreen />
      </TooltipProvider>
    </AppProvider>
  )
}

describe('SetupScreen', () => {
  it('renders a tooltip trigger next to the Personal Access Token label', () => {
    renderSetupScreen()
    expect(screen.getByRole('button', { name: 'More information' })).toBeInTheDocument()
  })

  it('renders a "Need help setting up?" button', () => {
    renderSetupScreen()
    expect(
      screen.getByRole('button', { name: /need help setting up/i })
    ).toBeInTheDocument()
  })

  it('opens the setup guide modal when "Need help setting up?" is clicked', async () => {
    renderSetupScreen()
    await userEvent.click(screen.getByRole('button', { name: /need help setting up/i }))
    expect(screen.getByText('Setting Up Campaign Manager')).toBeInTheDocument()
  })

  it('closes the setup guide modal when the modal close button is clicked', async () => {
    renderSetupScreen()
    await userEvent.click(screen.getByRole('button', { name: /need help setting up/i }))
    expect(screen.getByText('Setting Up Campaign Manager')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByText('Setting Up Campaign Manager')).not.toBeInTheDocument()
  })
})
