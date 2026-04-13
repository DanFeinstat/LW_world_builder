import { createContext as reactCreateContext, useContext } from 'react'

/**
 * Factory for typed React contexts with automatic displayName (for React
 * DevTools) and a null-guard hook that throws if consumed outside the provider.
 *
 * Returns [Provider-ready Context, typed hook] as a tuple.
 *
 * Usage:
 *   const [FooContext, useFoo] = createContext<FooValue>('FooContext')
 */
export function createContext<T>(name: string) {
  const Context = reactCreateContext<T | null>(null)
  Context.displayName = name

  function useCtx(): T {
    const value = useContext(Context)
    if (value === null) {
      throw new Error(`${name} must be used within its Provider`)
    }
    return value
  }

  return [Context, useCtx] as const
}
