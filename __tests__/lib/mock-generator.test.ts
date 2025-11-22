/**
 * Tests for mock-generator utility
 */

import { generateMockData, generateMockDataArray, MockTemplate } from "@/lib/mock-generator"

describe("generateMockData", () => {
  it("should generate user template data", () => {
    const data = generateMockData("user")

    expect(data).toHaveProperty("id")
    expect(data).toHaveProperty("name")
    expect(data).toHaveProperty("email")
    expect(data).toHaveProperty("avatar")
    expect(data).toHaveProperty("bio")
    expect(data).toHaveProperty("createdAt")
    expect(data).toHaveProperty("isActive")
    expect(typeof data.id).toBe("string")
    expect(typeof data.name).toBe("string")
    expect(typeof data.email).toBe("string")
    expect(typeof data.isActive).toBe("boolean")
  })

  it("should generate product template data", () => {
    const data = generateMockData("product")

    expect(data).toHaveProperty("id")
    expect(data).toHaveProperty("name")
    expect(data).toHaveProperty("description")
    expect(data).toHaveProperty("price")
    expect(data).toHaveProperty("category")
    expect(data).toHaveProperty("image")
    expect(data).toHaveProperty("inStock")
    expect(data).toHaveProperty("rating")
    expect(data).toHaveProperty("createdAt")
    expect(typeof data.inStock).toBe("boolean")
    expect(typeof data.rating).toBe("number")
  })

  it("should generate post template data", () => {
    const data = generateMockData("post")

    expect(data).toHaveProperty("id")
    expect(data).toHaveProperty("title")
    expect(data).toHaveProperty("content")
    expect(data).toHaveProperty("author")
    expect(data).toHaveProperty("tags")
    expect(data).toHaveProperty("likes")
    expect(data).toHaveProperty("views")
    expect(data).toHaveProperty("publishedAt")
    expect(Array.isArray(data.tags)).toBe(true)
    expect(typeof data.author).toBe("object")
  })

  it("should generate comment template data", () => {
    const data = generateMockData("comment")

    expect(data).toHaveProperty("id")
    expect(data).toHaveProperty("content")
    expect(data).toHaveProperty("author")
    expect(data).toHaveProperty("likes")
    expect(data).toHaveProperty("createdAt")
    expect(typeof data.author).toBe("object")
  })

  it("should generate order template data", () => {
    const data = generateMockData("order")

    expect(data).toHaveProperty("id")
    expect(data).toHaveProperty("orderNumber")
    expect(data).toHaveProperty("customer")
    expect(data).toHaveProperty("items")
    expect(data).toHaveProperty("total")
    expect(data).toHaveProperty("status")
    expect(data).toHaveProperty("createdAt")
    expect(Array.isArray(data.items)).toBe(true)
    expect(typeof data.customer).toBe("object")
  })

  it("should generate custom template data by default", () => {
    const data = generateMockData("custom")

    expect(data).toHaveProperty("id")
    expect(data).toHaveProperty("name")
    expect(data).toHaveProperty("description")
    expect(data).toHaveProperty("value")
    expect(data).toHaveProperty("createdAt")
    expect(data).toHaveProperty("status")
  })

  it("should generate custom template data when no template specified", () => {
    const data = generateMockData()

    expect(data).toHaveProperty("id")
    expect(data).toHaveProperty("name")
    expect(data).toHaveProperty("description")
  })

  it("should generate unique data on each call", () => {
    const data1 = generateMockData("user")
    const data2 = generateMockData("user")

    // IDs should be different
    expect(data1.id).not.toBe(data2.id)
    // Names should likely be different (faker generates random data)
    expect(data1.name).not.toBe(data2.name)
  })
})

describe("generateMockDataArray", () => {
  it("should generate array of mock data", () => {
    const data = generateMockDataArray("user", 5)

    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBe(5)
    expect(data[0]).toHaveProperty("id")
    expect(data[0]).toHaveProperty("name")
  })

  it("should generate default count of 5 when count not specified", () => {
    const data = generateMockDataArray("user")

    expect(data.length).toBe(5)
  })

  it("should generate different data for each item", () => {
    const data = generateMockDataArray("user", 3)

    expect(data[0].id).not.toBe(data[1].id)
    expect(data[1].id).not.toBe(data[2].id)
  })

  it("should work with all template types", () => {
    const templates: MockTemplate[] = ["user", "product", "post", "comment", "order", "custom"]

    templates.forEach((template) => {
      const data = generateMockDataArray(template, 2)
      expect(data.length).toBe(2)
      expect(data[0]).toHaveProperty("id")
    })
  })
})

