// src/components/shared/NotFound/NotFound.test.tsx
import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { NotFound } from './NotFound'
import { renderWithRouter } from '@/test/utils'

describe('NotFound', () => {
  it('renders a 404 heading', () => {
    renderWithRouter(<NotFound />)
    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('renders the default message', () => {
    renderWithRouter(<NotFound />)
    expect(screen.getByText('This page could not be found.')).toBeInTheDocument()
  })

  it('renders a link back to /articles by default', () => {
    renderWithRouter(<NotFound />)
    const link = screen.getByRole('link', { name: 'Go to Articles' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/articles')
  })

  it('renders a custom message', () => {
    renderWithRouter(<NotFound message="Article not found." />)
    expect(screen.getByText('Article not found.')).toBeInTheDocument()
  })

  it('renders a custom returnTo path and label', () => {
    renderWithRouter(<NotFound returnTo="/sessions" returnLabel="Go to Sessions" />)
    const link = screen.getByRole('link', { name: 'Go to Sessions' })
    expect(link).toHaveAttribute('href', '/sessions')
  })
})
