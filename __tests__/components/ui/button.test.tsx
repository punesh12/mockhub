/**
 * Tests for Button component
 */

import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Button } from "@/components/ui/button"

describe("Button", () => {
  it("should render button with text", () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument()
  })

  it("should handle click events", async () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    const button = screen.getByRole("button", { name: /click me/i })
    await userEvent.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it("should be disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled Button</Button>)
    const button = screen.getByRole("button", { name: /disabled button/i })
    expect(button).toBeDisabled()
  })

  it("should not call onClick when disabled", async () => {
    const handleClick = jest.fn()
    render(
      <Button disabled onClick={handleClick}>
        Disabled Button
      </Button>
    )

    const button = screen.getByRole("button", { name: /disabled button/i })
    await userEvent.click(button)

    expect(handleClick).not.toHaveBeenCalled()
  })

  it("should render with default variant", () => {
    const { container } = render(<Button>Default Button</Button>)
    const button = container.querySelector("button")
    expect(button).toHaveClass("bg-primary")
  })

  it("should render with destructive variant", () => {
    const { container } = render(<Button variant="destructive">Delete</Button>)
    const button = container.querySelector("button")
    expect(button).toHaveClass("bg-destructive")
  })

  it("should render with outline variant", () => {
    const { container } = render(<Button variant="outline">Outline Button</Button>)
    const button = container.querySelector("button")
    expect(button).toHaveClass("border")
  })

  it("should render with secondary variant", () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>)
    const button = container.querySelector("button")
    expect(button).toHaveClass("bg-secondary")
  })

  it("should render with ghost variant", () => {
    const { container } = render(<Button variant="ghost">Ghost Button</Button>)
    const button = container.querySelector("button")
    expect(button).toHaveClass("hover:bg-accent")
  })

  it("should render with link variant", () => {
    const { container } = render(<Button variant="link">Link Button</Button>)
    const button = container.querySelector("button")
    expect(button).toHaveClass("underline-offset-4")
  })

  it("should render with small size", () => {
    const { container } = render(<Button size="sm">Small Button</Button>)
    const button = container.querySelector("button")
    expect(button).toHaveClass("h-8")
  })

  it("should render with large size", () => {
    const { container } = render(<Button size="lg">Large Button</Button>)
    const button = container.querySelector("button")
    expect(button).toHaveClass("h-10")
  })

  it("should render with icon size", () => {
    const { container } = render(<Button size="icon">Icon</Button>)
    const button = container.querySelector("button")
    expect(button).toHaveClass("size-9")
  })

  it("should accept custom className", () => {
    const { container } = render(<Button className="custom-class">Custom</Button>)
    const button = container.querySelector("button")
    expect(button).toHaveClass("custom-class")
  })

  it("should render as child component when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )
    expect(screen.getByRole("link", { name: /link button/i })).toBeInTheDocument()
  })

  it("should pass through additional props", () => {
    render(<Button data-testid="custom-button" aria-label="Custom label">Button</Button>)
    const button = screen.getByTestId("custom-button")
    expect(button).toHaveAttribute("aria-label", "Custom label")
  })
})

