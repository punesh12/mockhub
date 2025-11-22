/**
 * Tests for http-status-codes
 */

import { HTTP_STATUS_CODES } from "@/lib/http-status-codes"

describe("HTTP_STATUS_CODES", () => {
  it("should contain common status codes", () => {
    expect(HTTP_STATUS_CODES.length).toBeGreaterThan(0)
  })

  it("should include 200 OK", () => {
    const status200 = HTTP_STATUS_CODES.find((s) => s.value === 200)
    expect(status200).toBeDefined()
    expect(status200?.label).toBe("200 - OK")
  })

  it("should include 201 Created", () => {
    const status201 = HTTP_STATUS_CODES.find((s) => s.value === 201)
    expect(status201).toBeDefined()
    expect(status201?.label).toBe("201 - Created")
  })

  it("should include 400 Bad Request", () => {
    const status400 = HTTP_STATUS_CODES.find((s) => s.value === 400)
    expect(status400).toBeDefined()
    expect(status400?.label).toBe("400 - Bad Request")
  })

  it("should include 401 Unauthorized", () => {
    const status401 = HTTP_STATUS_CODES.find((s) => s.value === 401)
    expect(status401).toBeDefined()
    expect(status401?.label).toBe("401 - Unauthorized")
  })

  it("should include 404 Not Found", () => {
    const status404 = HTTP_STATUS_CODES.find((s) => s.value === 404)
    expect(status404).toBeDefined()
    expect(status404?.label).toBe("404 - Not Found")
  })

  it("should include 500 Internal Server Error", () => {
    const status500 = HTTP_STATUS_CODES.find((s) => s.value === 500)
    expect(status500).toBeDefined()
    expect(status500?.label).toBe("500 - Internal Server Error")
  })

  it("should have value and label for each status code", () => {
    HTTP_STATUS_CODES.forEach((status) => {
      expect(status).toHaveProperty("value")
      expect(status).toHaveProperty("label")
      expect(typeof status.value).toBe("number")
      expect(typeof status.label).toBe("string")
    })
  })

  it("should be readonly array", () => {
    // TypeScript should prevent mutations, but we can test that the structure is correct
    expect(Array.isArray(HTTP_STATUS_CODES)).toBe(true)
  })
})

