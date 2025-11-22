/**
 * Tests for Pagination component
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Pagination from "@/components/shared/components/Pagination"

describe("Pagination", () => {
  it("should not render when totalPages is 1 or less", () => {
    const { container } = render(
      <Pagination
        page={1}
        totalPages={1}
        total={10}
        limit={10}
        onPageChange={jest.fn()}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it("should render pagination controls", () => {
    render(
      <Pagination
        page={1}
        totalPages={5}
        total={50}
        limit={10}
        onPageChange={jest.fn()}
      />
    )

    expect(screen.getByText("Previous")).toBeInTheDocument()
    expect(screen.getByText("Next")).toBeInTheDocument()
    expect(screen.getByText("Showing 1 to 10 of 50 items")).toBeInTheDocument()
  })

  it("should display correct item range", () => {
    render(
      <Pagination
        page={2}
        totalPages={5}
        total={50}
        limit={10}
        onPageChange={jest.fn()}
      />
    )

    expect(screen.getByText("Showing 11 to 20 of 50 items")).toBeInTheDocument()
  })

  it("should use custom item label", () => {
    render(
      <Pagination
        page={1}
        totalPages={5}
        total={50}
        limit={10}
        onPageChange={jest.fn()}
        itemLabel="mocks"
      />
    )

    expect(screen.getByText("Showing 1 to 10 of 50 mocks")).toBeInTheDocument()
  })

  it("should call onPageChange when clicking next", async () => {
    const onPageChange = jest.fn()
    const user = userEvent.setup()
    render(
      <Pagination
        page={1}
        totalPages={5}
        total={50}
        limit={10}
        onPageChange={onPageChange}
      />
    )

    const nextButton = screen.getByText("Next")
    await user.click(nextButton)

    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it("should call onPageChange when clicking previous", async () => {
    const onPageChange = jest.fn()
    const user = userEvent.setup()
    render(
      <Pagination
        page={2}
        totalPages={5}
        total={50}
        limit={10}
        onPageChange={onPageChange}
      />
    )

    const prevButton = screen.getByText("Previous")
    await user.click(prevButton)

    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it("should disable previous button on first page", () => {
    render(
      <Pagination
        page={1}
        totalPages={5}
        total={50}
        limit={10}
        onPageChange={jest.fn()}
      />
    )

    const prevButton = screen.getByText("Previous")
    expect(prevButton).toBeDisabled()
  })

  it("should disable next button on last page", () => {
    render(
      <Pagination
        page={5}
        totalPages={5}
        total={50}
        limit={10}
        onPageChange={jest.fn()}
      />
    )

    const nextButton = screen.getByText("Next")
    expect(nextButton).toBeDisabled()
  })

  it("should call onPageChange when clicking page number", async () => {
    const onPageChange = jest.fn()
    const user = userEvent.setup()
    render(
      <Pagination
        page={1}
        totalPages={5}
        total={50}
        limit={10}
        onPageChange={onPageChange}
      />
    )

    const page3Button = screen.getByText("3")
    await user.click(page3Button)

    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it("should highlight current page", () => {
    render(
      <Pagination
        page={3}
        totalPages={5}
        total={50}
        limit={10}
        onPageChange={jest.fn()}
      />
    )

    const page3Button = screen.getByText("3")
    expect(page3Button).toHaveClass("bg-primary")
  })

  it("should disable buttons when loading", () => {
    render(
      <Pagination
        page={2}
        totalPages={5}
        total={50}
        limit={10}
        onPageChange={jest.fn()}
        isLoading
      />
    )

    const prevButton = screen.getByText("Previous")
    const nextButton = screen.getByText("Next")
    const pageButtons = screen.getAllByRole("button").filter((btn) => btn.textContent?.match(/^\d+$/))

    expect(prevButton).toBeDisabled()
    expect(nextButton).toBeDisabled()
    pageButtons.forEach((btn) => {
      expect(btn).toBeDisabled()
    })
  })

  it("should show correct page numbers when near start", () => {
    render(
      <Pagination
        page={2}
        totalPages={10}
        total={100}
        limit={10}
        onPageChange={jest.fn()}
        maxPageButtons={5}
      />
    )

    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
  })

  it("should show correct page numbers when near end", () => {
    render(
      <Pagination
        page={9}
        totalPages={10}
        total={100}
        limit={10}
        onPageChange={jest.fn()}
        maxPageButtons={5}
      />
    )

    expect(screen.getByText("6")).toBeInTheDocument()
    expect(screen.getByText("7")).toBeInTheDocument()
    expect(screen.getByText("8")).toBeInTheDocument()
    expect(screen.getByText("9")).toBeInTheDocument()
    expect(screen.getByText("10")).toBeInTheDocument()
  })

  it("should show correct page numbers when in middle", () => {
    render(
      <Pagination
        page={5}
        totalPages={10}
        total={100}
        limit={10}
        onPageChange={jest.fn()}
        maxPageButtons={5}
      />
    )

    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
    expect(screen.getByText("6")).toBeInTheDocument()
    expect(screen.getByText("7")).toBeInTheDocument()
  })
})

