// src/components/shared/NotFound/NotFound.tsx
import { Link } from 'react-router'

interface NotFoundProps {
  message?: string
  returnTo?: string
  returnLabel?: string
}

export function NotFound({
  message = 'This page could not be found.',
  returnTo = '/articles',
  returnLabel = 'Go to Articles',
}: NotFoundProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
      <p className="font-display text-2xl font-semibold text-text-muted">404</p>
      <p className="text-sm text-text-secondary">{message}</p>
      <Link
        to={returnTo}
        className="text-sm font-medium text-dm hover:underline transition-colors duration-fast"
      >
        {returnLabel}
      </Link>
    </div>
  )
}
