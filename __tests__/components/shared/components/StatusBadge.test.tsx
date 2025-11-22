/**
 * Tests for StatusBadge component
 */

import { render, screen } from "@testing-library/react"
import StatusBadge from "@/components/shared/components/StatusBadge"

describe("StatusBadge", () => {
  it("should render status code", () => {
    render(<StatusBadge status={200} />)
    expect(screen.getByText("200")).toBeInTheDocument()
  })

  it("should render status code with status text", () => {
    render(<StatusBadge status={200} statusText="OK" />)
    expect(screen.getByText("200 OK")).toBeInTheDocument()
  })

  it("should apply green color for 2xx status codes", () => {
    const { container } = render(<StatusBadge status={200} />)
    const badge = container.querySelector(".bg-green-100")
    expect(badge).toBeInTheDocument()
  })

  it("should apply amber color for 3xx status codes", () => {
    const { container } = render(<StatusBadge status={301} />)
    const badge = container.querySelector(".bg-amber-100")
    expect(badge).toBeInTheDocument()
  })

  it("should apply red color for 4xx status codes", () => {
    const { container } = render(<StatusBadge status={404} />)
    const badge = container.querySelector(".bg-red-100")
    expect(badge).toBeInTheDocument()
  })

  it("should apply red color for 5xx status codes", () => {
    const { container } = render(<StatusBadge status={500} />)
    const badge = container.querySelector(".bg-red-100")
    expect(badge).toBeInTheDocument()
  })

  it("should apply blue color for 1xx status codes", () => {
    const { container } = render(<StatusBadge status={100} />)
    const badge = container.querySelector(".bg-blue-100")
    expect(badge).toBeInTheDocument()
  })

  it("should apply custom className", () => {
    const { container } = render(<StatusBadge status={200} className="custom-class" />)
    const badge = container.querySelector(".custom-class")
    expect(badge).toBeInTheDocument()
  })

  it("should have proper aria-label", () => {
    render(<StatusBadge status={200} statusText="OK" />)
    const badge = screen.getByLabelText("Status 200 OK")
    expect(badge).toBeInTheDocument()
  })

  it("should have aria-label without statusText", () => {
    render(<StatusBadge status={404} />)
    const badge = screen.getByLabelText("Status 404")
    expect(badge).toBeInTheDocument()
  })
})

