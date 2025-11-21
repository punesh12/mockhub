/**
 * Type definitions for Jest with jest-dom matchers
 */

import "@testing-library/jest-dom"

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
    }
  }
}

