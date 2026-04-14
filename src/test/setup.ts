import '@testing-library/jest-dom'
import { vi } from 'vitest'

// vi.runAllTimersAsync() loops infinitely when setInterval is present (it fires
// timers until clock.timers is empty, which never happens with setInterval).
// Override it to flush pending Promise microtasks without advancing fake timers.
// This lets async hooks like usePolling settle their in-flight promises while
// keeping fake timer state stable for explicit vi.advanceTimersByTime() calls.
vi.runAllTimersAsync = async function flushPromises() {
  // Five microtask-queue drains cover all chained-Promise depths in this project.
  // queueMicrotask is excluded from vi.useFakeTimers() faking by default, so it
  // always runs in the real microtask queue regardless of fake-timer state.
  for (let i = 0; i < 5; i++) {
    await new Promise<void>(resolve => queueMicrotask(resolve))
  }
  return vi
}
