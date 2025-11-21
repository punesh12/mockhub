/**
 * Tests for Input component
 */

import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Input } from "@/components/ui/input"

describe("Input", () => {
  it("should render input element", () => {
    render(<Input />)
    const input = screen.getByRole("textbox")
    expect(input).toBeInTheDocument()
  })

  it("should accept placeholder text", () => {
    render(<Input placeholder="Enter your name" />)
    expect(screen.getByPlaceholderText("Enter your name")).toBeInTheDocument()
  })

  it("should accept value and onChange", async () => {
    const handleChange = jest.fn()
    render(<Input value="test" onChange={handleChange} />)

    const input = screen.getByRole("textbox") as HTMLInputElement
    expect(input.value).toBe("test")

    await userEvent.type(input, "a")
    expect(handleChange).toHaveBeenCalled()
  })

  it("should be disabled when disabled prop is true", () => {
    render(<Input disabled />)
    const input = screen.getByRole("textbox")
    expect(input).toBeDisabled()
  })

  it("should accept different input types", () => {
    const { container, rerender } = render(<Input type="email" />)
    let input = screen.getByRole("textbox") as HTMLInputElement
    expect(input.type).toBe("email")

    rerender(<Input type="password" />)
    input = container.querySelector("input[type='password']") as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input.type).toBe("password")
  })

  it("should accept custom className", () => {
    const { container } = render(<Input className="custom-class" />)
    const input = container.querySelector("input")
    expect(input).toHaveClass("custom-class")
  })

  it("should accept required prop", () => {
    render(<Input required />)
    const input = screen.getByRole("textbox")
    expect(input).toBeRequired()
  })

  it("should accept maxLength prop", () => {
    render(<Input maxLength={10} />)
    const input = screen.getByRole("textbox") as HTMLInputElement
    expect(input.maxLength).toBe(10)
  })
})

