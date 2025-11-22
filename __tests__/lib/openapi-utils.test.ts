/**
 * Tests for openapi-utils
 */

import {
  generateOpenApiSpec,
  specToJson,
  parseOpenApiSpec,
  extractMocksFromOpenApi,
  type MockApi,
  type Organization,
} from "@/lib/openapi-utils"
import type { OpenAPIV3 } from "openapi-types"

// Mock yaml module
const mockYamlParse = jest.fn((str) => {
  // Simple YAML parser mock - convert YAML-like string to object
  if (str.includes("openapi: 3.0.0")) {
    return {
      openapi: "3.0.0",
      info: {
        title: "Test API",
        version: "1.0.0",
      },
      paths: {},
    }
  }
  return JSON.parse(str)
})

jest.mock("yaml", () => ({
  stringify: jest.fn((obj) => JSON.stringify(obj)),
  parse: mockYamlParse,
}))

describe("generateOpenApiSpec", () => {
  const mockOrganization: Organization = {
    id: "org-123",
    name: "Test Organization",
    slug: "test-org",
    description: "Test description",
    visibility: "public",
  }

  const mockMocks: MockApi[] = [
    {
      id: "mock-1",
      name: "Get Users",
      endpoint: "/users",
      method: "GET",
      responseCode: 200,
      responseBody: { users: [] },
      createdAt: "2024-01-01",
    },
    {
      id: "mock-2",
      name: "Create User",
      endpoint: "/users",
      method: "POST",
      responseCode: 201,
      responseBody: { id: "1", name: "John" },
      createdAt: "2024-01-01",
    },
  ]

  it("should generate OpenAPI spec with organization info", () => {
    const spec = generateOpenApiSpec(mockOrganization, mockMocks)

    expect(spec.openapi).toBe("3.0.0")
    expect(spec.info.title).toBe("Test Organization API")
    expect(spec.info.description).toBe("Test description")
    expect(spec.info.version).toBe("1.0.0")
  })

  it("should use default description when organization description is null", () => {
    const orgWithoutDesc = { ...mockOrganization, description: null }
    const spec = generateOpenApiSpec(orgWithoutDesc, mockMocks)

    expect(spec.info.description).toBe("API documentation for Test Organization organization mocks")
  })

  it("should include paths for all mocks", () => {
    const spec = generateOpenApiSpec(mockOrganization, mockMocks)

    expect(spec.paths).toBeDefined()
    expect(Object.keys(spec.paths).length).toBeGreaterThan(0)
  })

  it("should use organization-scoped paths by default", () => {
    const spec = generateOpenApiSpec(mockOrganization, mockMocks)

    const paths = Object.keys(spec.paths)
    expect(paths.some((p) => p.includes("/api/org/test-org"))).toBe(true)
  })

  it("should use regular paths when useOrganizationScopedPaths is false", () => {
    const spec = generateOpenApiSpec(mockOrganization, mockMocks, undefined, false)

    const paths = Object.keys(spec.paths)
    expect(paths.some((p) => p.startsWith("/api/"))).toBe(true)
    expect(paths.some((p) => p.includes("/api/org/"))).toBe(false)
  })

  it("should handle endpoint with leading slash", () => {
    const mocks: MockApi[] = [
      {
        id: "mock-1",
        name: "Test",
        endpoint: "/test",
        method: "GET",
        responseCode: 200,
        responseBody: {},
        createdAt: "2024-01-01",
      },
    ]

    const spec = generateOpenApiSpec(mockOrganization, mocks)

    expect(spec.paths).toBeDefined()
  })

  it("should handle endpoint without leading slash", () => {
    const mocks: MockApi[] = [
      {
        id: "mock-1",
        name: "Test",
        endpoint: "test",
        method: "GET",
        responseCode: 200,
        responseBody: {},
        createdAt: "2024-01-01",
      },
    ]

    const spec = generateOpenApiSpec(mockOrganization, mocks)

    expect(spec.paths).toBeDefined()
  })

  it("should include request body for POST, PUT, PATCH methods", () => {
    const mocks: MockApi[] = [
      {
        id: "mock-1",
        name: "Create",
        endpoint: "/test",
        method: "POST",
        responseCode: 201,
        responseBody: {},
        createdAt: "2024-01-01",
      },
    ]

    const spec = generateOpenApiSpec(mockOrganization, mocks)
    const pathItem = spec.paths["/api/org/test-org/test"]

    expect(pathItem?.post?.requestBody).toBeDefined()
  })

  it("should not include request body for GET method", () => {
    const mocks: MockApi[] = [
      {
        id: "mock-1",
        name: "Get",
        endpoint: "/test",
        method: "GET",
        responseCode: 200,
        responseBody: {},
        createdAt: "2024-01-01",
      },
    ]

    const spec = generateOpenApiSpec(mockOrganization, mocks)
    const pathItem = spec.paths["/api/org/test-org/test"]

    expect(pathItem?.get?.requestBody).toBeUndefined()
  })

  it("should use custom baseUrl when provided", () => {
    const customUrl = "https://api.example.com"
    const spec = generateOpenApiSpec(mockOrganization, mockMocks, customUrl)

    expect(spec.servers?.[0]?.url).toBe(customUrl)
  })

  it("should use environment variable for baseUrl when not provided", () => {
    const originalEnv = process.env.NEXT_PUBLIC_APP_URL
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com"

    const spec = generateOpenApiSpec(mockOrganization, mockMocks)

    expect(spec.servers?.[0]?.url).toBe("https://app.example.com")

    if (originalEnv) {
      process.env.NEXT_PUBLIC_APP_URL = originalEnv
    } else {
      delete process.env.NEXT_PUBLIC_APP_URL
    }
  })
})

describe("specToJson", () => {
  it("should convert spec to JSON string", () => {
    const spec: OpenAPIV3.Document = {
      openapi: "3.0.0",
      info: {
        title: "Test API",
        version: "1.0.0",
      },
      paths: {},
    }

    const json = specToJson(spec)

    expect(typeof json).toBe("string")
    const parsed = JSON.parse(json)
    expect(parsed.openapi).toBe("3.0.0")
  })

  it("should format JSON with indentation", () => {
    const spec: OpenAPIV3.Document = {
      openapi: "3.0.0",
      info: {
        title: "Test API",
        version: "1.0.0",
      },
      paths: {},
    }

    const json = specToJson(spec)

    expect(json).toContain("\n") // Should be formatted
  })
})

describe("parseOpenApiSpec", () => {
  it("should parse JSON OpenAPI spec", async () => {
    const specJson = JSON.stringify({
      openapi: "3.0.0",
      info: {
        title: "Test API",
        version: "1.0.0",
      },
      paths: {},
    })

    const spec = await parseOpenApiSpec(specJson, "json")

    expect(spec.openapi).toBe("3.0.0")
    expect(spec.info.title).toBe("Test API")
  })

  it("should parse YAML OpenAPI spec", async () => {
    const specYaml = "openapi: 3.0.0\ninfo:\n  title: Test API\n  version: 1.0.0\npaths: {}"

    const spec = await parseOpenApiSpec(specYaml, "yaml")

    expect(spec.openapi).toBe("3.0.0")
  })

  it("should throw error for invalid JSON", async () => {
    await expect(parseOpenApiSpec("invalid json", "json")).rejects.toThrow()
  })

  it("should throw error for spec without openapi or swagger", async () => {
    const invalidSpec = JSON.stringify({
      info: {
        title: "Test",
      },
    })

    await expect(parseOpenApiSpec(invalidSpec, "json")).rejects.toThrow("Invalid OpenAPI/Swagger specification")
  })

  it("should throw error for Swagger 2.0", async () => {
    const swagger2Spec = JSON.stringify({
      swagger: "2.0",
      info: {
        title: "Test",
        version: "1.0.0",
      },
    })

    await expect(parseOpenApiSpec(swagger2Spec, "json")).rejects.toThrow("Swagger 2.0 support coming soon")
  })
})

describe("extractMocksFromOpenApi", () => {
  it("should extract mocks from OpenAPI spec", () => {
    const spec: OpenAPIV3.Document = {
      openapi: "3.0.0",
      info: {
        title: "Test API",
        version: "1.0.0",
      },
      paths: {
        "/users": {
          get: {
            operationId: "getUsers",
            summary: "Get users",
            responses: {
              "200": {
                description: "Success",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        users: {
                          type: "array",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const mocks = extractMocksFromOpenApi(spec)

    expect(mocks.length).toBeGreaterThan(0)
    expect(mocks[0].method).toBe("GET")
    expect(mocks[0].endpoint).toBe("/users")
  })

  it("should return empty array for spec without paths", () => {
    const spec: OpenAPIV3.Document = {
      openapi: "3.0.0",
      info: {
        title: "Test API",
        version: "1.0.0",
      },
      paths: {},
    }

    const mocks = extractMocksFromOpenApi(spec)

    expect(mocks).toEqual([])
  })

  it("should handle multiple methods on same path", () => {
    const spec: OpenAPIV3.Document = {
      openapi: "3.0.0",
      info: {
        title: "Test API",
        version: "1.0.0",
      },
      paths: {
        "/users": {
          get: {
            operationId: "getUsers",
            responses: {
              "200": {
                description: "Success",
              },
            },
          },
          post: {
            operationId: "createUser",
            responses: {
              "201": {
                description: "Created",
              },
            },
          },
        },
      },
    }

    const mocks = extractMocksFromOpenApi(spec)

    expect(mocks.length).toBe(2)
    expect(mocks.some((m) => m.method === "GET")).toBe(true)
    expect(mocks.some((m) => m.method === "POST")).toBe(true)
  })

  it("should extract response code from first response", () => {
    const spec: OpenAPIV3.Document = {
      openapi: "3.0.0",
      info: {
        title: "Test API",
        version: "1.0.0",
      },
      paths: {
        "/users": {
          get: {
            operationId: "getUsers",
            responses: {
              "200": {
                description: "Success",
              },
              "404": {
                description: "Not Found",
              },
            },
          },
        },
      },
    }

    const mocks = extractMocksFromOpenApi(spec)

    expect(mocks[0].responseCode).toBe(200)
  })
})

