/**
 * Tests for export-utils
 */

import {
  convertToCSV,
  exportToCSV,
  exportToJSON,
  formatHistoryForExport,
  formatMockForExport,
} from "@/lib/export-utils"

// Mock DOM APIs for browser environment
global.URL.createObjectURL = jest.fn(() => "blob:mock-url")
global.URL.revokeObjectURL = jest.fn()
global.Blob = jest.fn((content, options) => ({
  content,
  options,
  type: options?.type || "",
}))

describe("convertToCSV", () => {
  it("should convert array of objects to CSV string", () => {
    const data = [
      { name: "John", age: 30, city: "New York" },
      { name: "Jane", age: 25, city: "London" },
    ]

    const csv = convertToCSV(data)

    expect(csv).toContain('"name","age","city"')
    expect(csv).toContain('"John","30","New York"')
    expect(csv).toContain('"Jane","25","London"')
  })

  it("should return empty string for empty array", () => {
    const csv = convertToCSV([])

    expect(csv).toBe("")
  })

  it("should handle null and undefined values", () => {
    const data = [
      { name: "John", age: null, city: undefined },
    ]

    const csv = convertToCSV(data)

    expect(csv).toContain('"name","age","city"')
    expect(csv).toContain('"John"')
    // CSV should have empty values for null/undefined
    const lines = csv.split("\n")
    expect(lines[1]).toContain("John")
  })

  it("should escape quotes in string values", () => {
    const data = [
      { name: 'John "Johnny" Doe', age: 30 },
    ]

    const csv = convertToCSV(data)

    expect(csv).toContain('"John ""Johnny"" Doe"')
  })

  it("should handle objects and arrays by stringifying them", () => {
    const data = [
      { name: "John", metadata: { role: "admin" }, tags: ["tag1", "tag2"] },
    ]

    const csv = convertToCSV(data)

    expect(csv).toContain('"name","metadata","tags"')
    expect(csv).toContain('"John"')
  })

  it("should handle numbers correctly", () => {
    const data = [
      { id: 1, price: 99.99, quantity: 5 },
    ]

    const csv = convertToCSV(data)

    expect(csv).toContain('"1","99.99","5"')
  })
})

describe("exportToCSV", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock document.createElement
    global.document.createElement = jest.fn((tagName) => {
      if (tagName === "a") {
        return {
          href: "",
          download: "",
          click: jest.fn(),
        } as any
      }
      return {} as any
    })
    global.document.body.appendChild = jest.fn()
    global.document.body.removeChild = jest.fn()
  })

  it("should create CSV blob and trigger download", () => {
    const data = [
      { name: "John", age: 30 },
    ]

    exportToCSV(data, "test-data")

    expect(global.Blob).toHaveBeenCalled()
    expect(global.URL.createObjectURL).toHaveBeenCalled()
    expect(global.document.createElement).toHaveBeenCalledWith("a")
  })
})

describe("exportToJSON", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.document.createElement = jest.fn((tagName) => {
      if (tagName === "a") {
        return {
          href: "",
          download: "",
          click: jest.fn(),
        } as any
      }
      return {} as any
    })
    global.document.body.appendChild = jest.fn()
    global.document.body.removeChild = jest.fn()
  })

  it("should create JSON blob and trigger download", () => {
    const data = [
      { name: "John", age: 30 },
    ]

    exportToJSON(data, "test-data")

    expect(global.Blob).toHaveBeenCalled()
    expect(global.URL.createObjectURL).toHaveBeenCalled()
    expect(global.document.createElement).toHaveBeenCalledWith("a")
  })

  it("should format JSON with indentation", () => {
    const data = [{ name: "John" }]

    exportToJSON(data, "test")

    const blobCall = (global.Blob as jest.Mock).mock.calls[0]
    const jsonString = blobCall[0][0]
    const parsed = JSON.parse(jsonString)

    expect(parsed).toEqual(data)
    expect(jsonString).toContain("\n") // Should be formatted
  })
})

describe("formatHistoryForExport", () => {
  it("should format history item correctly", () => {
    const item = {
      id: "history-1",
      url: "https://api.example.com/test",
      method: "GET",
      status: 200,
      responseTime: 150,
      responseBody: { message: "Success" },
      createdAt: new Date("2024-01-01"),
    }

    const formatted = formatHistoryForExport(item)

    expect(formatted).toEqual({
      id: "history-1",
      url: "https://api.example.com/test",
      method: "GET",
      status: 200,
      responseTime: 150,
      responseBody: '{"message":"Success"}',
      createdAt: new Date("2024-01-01"),
    })
  })

  it("should handle string responseBody", () => {
    const item = {
      id: "history-1",
      url: "https://api.example.com/test",
      method: "GET",
      status: 200,
      responseTime: 150,
      responseBody: "Success",
      createdAt: new Date("2024-01-01"),
    }

    const formatted = formatHistoryForExport(item)

    expect(formatted.responseBody).toBe("Success")
  })

  it("should include all required fields", () => {
    const item = {
      id: "history-1",
      url: "https://api.example.com/test",
      method: "GET",
      status: 200,
      responseTime: 150,
      responseBody: {},
      createdAt: new Date(),
    }

    const formatted = formatHistoryForExport(item)

    expect(formatted).toHaveProperty("id")
    expect(formatted).toHaveProperty("url")
    expect(formatted).toHaveProperty("method")
    expect(formatted).toHaveProperty("status")
    expect(formatted).toHaveProperty("responseTime")
    expect(formatted).toHaveProperty("responseBody")
    expect(formatted).toHaveProperty("createdAt")
  })
})

describe("formatMockForExport", () => {
  it("should format mock item correctly", () => {
    const item = {
      id: "mock-1",
      name: "Test Mock",
      endpoint: "/test",
      method: "GET",
      responseCode: 200,
      responseBody: { message: "Success" },
      createdAt: new Date("2024-01-01"),
    }

    const formatted = formatMockForExport(item)

    expect(formatted).toEqual({
      id: "mock-1",
      name: "Test Mock",
      endpoint: "/test",
      method: "GET",
      responseCode: 200,
      responseBody: '{"message":"Success"}',
      createdAt: new Date("2024-01-01"),
    })
  })

  it("should handle string responseBody", () => {
    const item = {
      id: "mock-1",
      name: "Test Mock",
      endpoint: "/test",
      method: "GET",
      responseCode: 200,
      responseBody: "Success",
      createdAt: new Date("2024-01-01"),
    }

    const formatted = formatMockForExport(item)

    expect(formatted.responseBody).toBe("Success")
  })

  it("should include all required fields", () => {
    const item = {
      id: "mock-1",
      name: "Test Mock",
      endpoint: "/test",
      method: "GET",
      responseCode: 200,
      responseBody: {},
      createdAt: new Date(),
    }

    const formatted = formatMockForExport(item)

    expect(formatted).toHaveProperty("id")
    expect(formatted).toHaveProperty("name")
    expect(formatted).toHaveProperty("endpoint")
    expect(formatted).toHaveProperty("method")
    expect(formatted).toHaveProperty("responseCode")
    expect(formatted).toHaveProperty("responseBody")
    expect(formatted).toHaveProperty("createdAt")
  })
})

