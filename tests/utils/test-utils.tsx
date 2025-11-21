/**
 * Test utilities for React Testing Library
 */

import { ReactElement } from "react"
import { render, RenderOptions } from "@testing-library/react"

/**
 * Custom render function that includes providers
 * Use this instead of the default render from @testing-library/react
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => {
  return render(ui, {
    ...options,
  })
}

// Re-export everything from @testing-library/react
export * from "@testing-library/react"
export { customRender as render }

