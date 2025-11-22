/**
 * Tests for method-utils
 */

import { getMethodColor } from "@/lib/method-utils"

describe("getMethodColor", () => {
  it("should return blue color for GET method", () => {
    const color = getMethodColor("GET")
    expect(color).toContain("blue")
  })

  it("should return green color for POST method", () => {
    const color = getMethodColor("POST")
    expect(color).toContain("green")
  })

  it("should return yellow color for PUT method", () => {
    const color = getMethodColor("PUT")
    expect(color).toContain("yellow")
  })

  it("should return purple color for PATCH method", () => {
    const color = getMethodColor("PATCH")
    expect(color).toContain("purple")
  })

  it("should return red color for DELETE method", () => {
    const color = getMethodColor("DELETE")
    expect(color).toContain("red")
  })

  it("should return gray color for HEAD method", () => {
    const color = getMethodColor("HEAD")
    expect(color).toContain("gray")
  })

  it("should return cyan color for OPTIONS method", () => {
    const color = getMethodColor("OPTIONS")
    expect(color).toContain("cyan")
  })

  it("should handle lowercase method names", () => {
    const color = getMethodColor("get")
    expect(color).toContain("blue")
  })

  it("should handle mixed case method names", () => {
    const color = getMethodColor("Get")
    expect(color).toContain("blue")
  })

  it("should return muted color for unknown methods", () => {
    const color = getMethodColor("UNKNOWN")
    expect(color).toContain("muted")
  })

  it("should include dark mode classes", () => {
    const color = getMethodColor("GET")
    expect(color).toContain("dark:")
  })
})

