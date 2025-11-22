/**
 * Tests for SearchBar component
 */

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import SearchBar from "@/components/shared/components/SearchBar"

describe("SearchBar", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it("should render search input", () => {
    render(<SearchBar value="" onChange={jest.fn()} />)
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument()
  })

  it("should use custom placeholder", () => {
    render(<SearchBar value="" onChange={jest.fn()} placeholder="Custom search" />)
    expect(screen.getByPlaceholderText("Custom search")).toBeInTheDocument()
  })

  it("should display initial value", () => {
    render(<SearchBar value="initial search" onChange={jest.fn()} />)
    const input = screen.getByPlaceholderText("Search...") as HTMLInputElement
    expect(input.value).toBe("initial search")
  })

  it("should call onChange when typing", async () => {
    const onChange = jest.fn()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<SearchBar value="" onChange={onChange} />)

    const input = screen.getByPlaceholderText("Search...")
    await user.type(input, "test")

    expect(onChange).toHaveBeenCalledWith("t")
    expect(onChange).toHaveBeenCalledWith("te")
    expect(onChange).toHaveBeenCalledWith("tes")
    expect(onChange).toHaveBeenCalledWith("test")
  })

  it("should debounce onDebounce callback", async () => {
    const onDebounce = jest.fn()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<SearchBar value="" onChange={jest.fn()} onDebounce={onDebounce} debounceMs={500} />)

    const input = screen.getByPlaceholderText("Search...")
    await user.type(input, "test")

    // onDebounce should not be called immediately
    expect(onDebounce).not.toHaveBeenCalled()

    // Fast-forward time
    jest.advanceTimersByTime(500)

    await waitFor(() => {
      expect(onDebounce).toHaveBeenCalledWith("test")
    })
  })

  it("should use custom debounce delay", async () => {
    const onDebounce = jest.fn()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<SearchBar value="" onChange={jest.fn()} onDebounce={onDebounce} debounceMs={1000} />)

    const input = screen.getByPlaceholderText("Search...")
    await user.type(input, "test")

    jest.advanceTimersByTime(500)
    expect(onDebounce).not.toHaveBeenCalled()

    jest.advanceTimersByTime(500)
    await waitFor(() => {
      expect(onDebounce).toHaveBeenCalledWith("test")
    })
  })

  it("should sync with external value changes", () => {
    const { rerender } = render(<SearchBar value="initial" onChange={jest.fn()} />)
    const input = screen.getByPlaceholderText("Search...") as HTMLInputElement
    expect(input.value).toBe("initial")

    rerender(<SearchBar value="updated" onChange={jest.fn()} />)
    expect(input.value).toBe("updated")
  })

  it("should apply custom className", () => {
    const { container } = render(<SearchBar value="" onChange={jest.fn()} className="custom-class" />)
    const wrapper = container.querySelector(".custom-class")
    expect(wrapper).toBeInTheDocument()
  })

  it("should apply custom inputClassName", () => {
    const { container } = render(<SearchBar value="" onChange={jest.fn()} inputClassName="custom-input" />)
    const input = container.querySelector(".custom-input")
    expect(input).toBeInTheDocument()
  })

  it("should clear debounce timer on unmount", async () => {
    const onDebounce = jest.fn()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const { unmount } = render(<SearchBar value="" onChange={jest.fn()} onDebounce={onDebounce} />)

    const input = screen.getByPlaceholderText("Search...")
    await user.type(input, "test")

    unmount()
    jest.advanceTimersByTime(500)

    // onDebounce should not be called after unmount
    expect(onDebounce).not.toHaveBeenCalled()
  })
})

