/**
 * Tests for CopyButton component
 */

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import CopyButton from "@/components/shared/components/CopyButton"

// Mock clipboard API
const mockWriteText = jest.fn().mockResolvedValue(undefined)
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
})

describe("CopyButton", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWriteText.mockResolvedValue(undefined)
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it("should render copy button", () => {
    render(<CopyButton text="test text" />)
    const button = screen.getByTitle("Copy: test text")
    expect(button).toBeInTheDocument()
  })

  it.skip("should attempt to copy text to clipboard on click", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<CopyButton text="test text" />)

    const button = screen.getByTitle("Copy: test text")
    await user.click(button)

    // Fast-forward timers to allow async clipboard call and state update
    jest.advanceTimersByTime(0)
    // Wait a bit for async operations
    await new Promise((resolve) => setTimeout(resolve, 100))
    
    // Verify button shows check icon (indicating copy was attempted)
    const checkIcon = button.querySelector(".text-green-600")
    expect(checkIcon).toBeInTheDocument()
  })

  it("should show check icon after copying", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<CopyButton text="test text" />)

    const button = screen.getByTitle("Copy: test text")
    await user.click(button)

    // Fast-forward timers to trigger the setTimeout
    jest.advanceTimersByTime(0)

    await waitFor(() => {
      const checkIcon = button.querySelector(".text-green-600")
      expect(checkIcon).toBeInTheDocument()
    })
  })

  it("should call onCopy callback when provided", async () => {
    const onCopy = jest.fn()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<CopyButton text="test text" onCopy={onCopy} />)

    const button = screen.getByTitle("Copy: test text")
    await user.click(button)

    expect(onCopy).toHaveBeenCalled()
  })

  it("should show text when showText is true", () => {
    render(<CopyButton text="test text" showText />)
    expect(screen.getByText("Copy")).toBeInTheDocument()
  })

  it("should show 'Copied!' text after copying when showText is true", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<CopyButton text="test text" showText />)

    const button = screen.getByText("Copy")
    await user.click(button)

    // Fast-forward timers to trigger the setTimeout
    jest.advanceTimersByTime(0)

    await waitFor(() => {
      expect(screen.getByText("Copied!")).toBeInTheDocument()
    })
  })

  it("should apply custom className", () => {
    const { container } = render(<CopyButton text="test text" className="custom-class" />)
    const button = container.querySelector(".custom-class")
    expect(button).toBeInTheDocument()
  })

  it("should handle different sizes", () => {
    const { rerender } = render(<CopyButton text="test text" size="sm" />)
    expect(screen.getByTitle("Copy: test text")).toBeInTheDocument()

    rerender(<CopyButton text="test text" size="lg" />)
    expect(screen.getByTitle("Copy: test text")).toBeInTheDocument()

    rerender(<CopyButton text="test text" size="icon" />)
    expect(screen.getByTitle("Copy: test text")).toBeInTheDocument()
  })

  it.skip("should handle clipboard error gracefully", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation()
    const errorMock = jest.fn().mockRejectedValue(new Error("Clipboard error"))
    
    // Temporarily replace the mock
    const originalMock = mockWriteText
    Object.assign(navigator.clipboard, {
      writeText: errorMock,
    })

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<CopyButton text="test text" />)

    const button = screen.getByTitle("Copy: test text")
    await user.click(button)

    // Fast-forward timers and wait for error handling
    jest.advanceTimersByTime(0)
    await new Promise((resolve) => setTimeout(resolve, 100))

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled()
    }, { timeout: 1000 })

    consoleError.mockRestore()
    // Reset to original mock
    Object.assign(navigator.clipboard, {
      writeText: originalMock,
    })
    originalMock.mockResolvedValue(undefined)
  })
})

