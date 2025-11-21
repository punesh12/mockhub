/**
 * OpenAPI utilities for generating and parsing OpenAPI specifications
 */

import type { OpenAPIV3 } from "openapi-types"

export interface MockApi {
  id: string
  name: string
  endpoint: string
  method: string
  responseBody: unknown
  responseCode: number
  createdAt: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  description: string | null
  visibility: "private" | "public"
}

/**
 * Generate OpenAPI 3.0 specification from organization mocks
 */
export const generateOpenApiSpec = (
  organization: Organization,
  mocks: MockApi[],
  baseUrl?: string,
  useOrganizationScopedPaths = true
): OpenAPIV3.Document => {
  const baseUrlValue =
    baseUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    "http://localhost:3000"

  // Initialize OpenAPI document
  const spec: OpenAPIV3.Document = {
    openapi: "3.0.0",
    info: {
      title: `${organization.name} API`,
      description:
        organization.description ||
        `API documentation for ${organization.name} organization mocks`,
      version: "1.0.0",
      contact: {
        name: organization.name,
      },
    },
    servers: [
      {
        url: baseUrlValue,
        description: "API Server",
      },
    ],
    paths: {},
    components: {
      schemas: {},
    },
  }

  // Group mocks by endpoint path
  const pathsMap = new Map<string, Map<string, MockApi>>()

  for (const mock of mocks) {
    // Build the correct path based on whether we're using organization-scoped paths
    let path = mock.endpoint.startsWith("/") ? mock.endpoint : `/${mock.endpoint}`
    
    if (useOrganizationScopedPaths) {
      // Use organization-scoped path: /api/org/[slug]/[endpoint]
      path = `/api/org/${organization.slug}${path}`
    } else {
      // Use regular path: /api/[endpoint]
      if (!path.startsWith("/api/")) {
        path = `/api${path}`
      }
    }
    
    const method = mock.method.toLowerCase()

    if (!pathsMap.has(path)) {
      pathsMap.set(path, new Map())
    }

    const methodsMap = pathsMap.get(path)!
    methodsMap.set(method, mock)
  }

  // Generate paths and operations
  for (const [path, methodsMap] of pathsMap.entries()) {
    const pathItem: OpenAPIV3.PathItemObject = {}

    for (const [method, mock] of methodsMap.entries()) {
      if (!isValidHttpMethod(method)) continue

      const operation: OpenAPIV3.OperationObject = {
        operationId: `${method}_${path.replace(/\//g, "_").replace(/^_/, "")}`,
        summary: mock.name,
        description: `Mock API endpoint: ${mock.name}`,
        tags: [organization.name],
        responses: {
          [mock.responseCode.toString()]: generateResponse(
            mock.responseCode,
            mock.responseBody,
            spec
          ),
        },
      }

      // Add request body for POST, PUT, PATCH methods
      if (["post", "put", "patch"].includes(method)) {
        operation.requestBody = {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                description: "Request body (optional)",
              },
            },
          },
        }
      }

      // Type-safe method assignment
      if (method === "get") pathItem.get = operation
      else if (method === "post") pathItem.post = operation
      else if (method === "put") pathItem.put = operation
      else if (method === "patch") pathItem.patch = operation
      else if (method === "delete") pathItem.delete = operation
      else if (method === "head") pathItem.head = operation
      else if (method === "options") pathItem.options = operation
      else if (method === "trace") pathItem.trace = operation
    }

    spec.paths[path] = pathItem
  }

  return spec
}

/**
 * Generate response object from mock data
 */
const generateResponse = (
  statusCode: number,
  responseBody: unknown,
  spec: OpenAPIV3.Document
): OpenAPIV3.ResponseObject => {
  const response: OpenAPIV3.ResponseObject = {
    description: getStatusDescription(statusCode),
    content: {},
  }

  // Infer schema from response body
  const schema = inferSchemaFromValue(responseBody, spec)

  if (schema) {
    response.content = {
      "application/json": {
        schema,
      },
    }
  }

  return response
}

/**
 * Infer JSON schema from a value
 */
const inferSchemaFromValue = (
  value: unknown,
  spec: OpenAPIV3.Document
): OpenAPIV3.SchemaObject | undefined => {
  if (value === null) {
    return { type: "object", nullable: true }
  }

  if (typeof value === "string") {
    return { type: "string" }
  }

  if (typeof value === "number") {
    return { type: Number.isInteger(value) ? "integer" : "number" }
  }

  if (typeof value === "boolean") {
    return { type: "boolean" }
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return {
        type: "array",
        items: { type: "object" },
      }
    }

    const itemSchema = inferSchemaFromValue(value[0], spec)
    return {
      type: "array",
      items: itemSchema || { type: "object" },
    }
  }

  if (typeof value === "object" && value !== null) {
    const schema: OpenAPIV3.SchemaObject = {
      type: "object",
      properties: {},
    }

    for (const [key, val] of Object.entries(value)) {
      const propSchema = inferSchemaFromValue(val, spec)
      if (propSchema) {
        schema.properties![key] = propSchema
      }
    }

    return schema
  }

  return { type: "object" }
}

/**
 * Get HTTP status code description
 */
const getStatusDescription = (statusCode: number): string => {
  const descriptions: Record<number, string> = {
    200: "Success",
    201: "Created",
    204: "No Content",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    500: "Internal Server Error",
  }

  return descriptions[statusCode] || `Status ${statusCode}`
}

/**
 * Check if method is a valid HTTP method
 */
const isValidHttpMethod = (method: string): method is OpenAPIV3.HttpMethods => {
  const validMethods: string[] = [
    "get",
    "post",
    "put",
    "patch",
    "delete",
    "head",
    "options",
    "trace",
  ]
  return validMethods.includes(method.toLowerCase())
}

/**
 * Convert OpenAPI spec to YAML string
 */
export const specToYaml = async (spec: OpenAPIV3.Document): Promise<string> => {
  const yaml = await import("yaml")
  return yaml.stringify(spec)
}

/**
 * Convert OpenAPI spec to JSON string
 */
export const specToJson = (spec: OpenAPIV3.Document): string => {
  return JSON.stringify(spec, null, 2)
}

/**
 * Parse OpenAPI/Swagger file (JSON or YAML)
 */
export const parseOpenApiSpec = async (
  fileContent: string,
  fileType: "json" | "yaml" = "json"
): Promise<OpenAPIV3.Document> => {
  try {
    let spec: OpenAPIV3.Document

    if (fileType === "yaml") {
      const yaml = await import("yaml")
      spec = yaml.parse(fileContent) as OpenAPIV3.Document
    } else {
      spec = JSON.parse(fileContent) as OpenAPIV3.Document
    }

    // Validate OpenAPI version
    if (!spec.openapi && !(spec as { swagger?: string }).swagger) {
      throw new Error("Invalid OpenAPI/Swagger specification")
    }

    // Convert Swagger 2.0 to OpenAPI 3.0 if needed
    if ((spec as { swagger?: string }).swagger) {
      // For now, we'll support basic Swagger 2.0 structure
      // In production, you might want to use a converter library
      throw new Error("Swagger 2.0 support coming soon. Please use OpenAPI 3.0.")
    }

    return spec
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse OpenAPI spec: ${error.message}`)
    }
    throw new Error("Failed to parse OpenAPI spec")
  }
}

/**
 * Extract mock APIs from OpenAPI specification
 */
export interface ExtractedMock {
  name: string
  endpoint: string
  method: string
  responseCode: number
  responseBody: unknown
}

export const extractMocksFromOpenApi = (
  spec: OpenAPIV3.Document
): ExtractedMock[] => {
  const mocks: ExtractedMock[] = []

  if (!spec.paths) {
    return mocks
  }

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    if (!pathItem || typeof pathItem !== "object" || "$ref" in pathItem) {
      continue
    }

    const pathItemObj = pathItem as OpenAPIV3.PathItemObject

    // Check each HTTP method
    if (pathItemObj.get) {
      const mock = extractOperation(pathItemObj.get, "GET", path)
      if (mock) mocks.push(mock)
    }
    if (pathItemObj.post) {
      const mock = extractOperation(pathItemObj.post, "POST", path)
      if (mock) mocks.push(mock)
    }
    if (pathItemObj.put) {
      const mock = extractOperation(pathItemObj.put, "PUT", path)
      if (mock) mocks.push(mock)
    }
    if (pathItemObj.patch) {
      const mock = extractOperation(pathItemObj.patch, "PATCH", path)
      if (mock) mocks.push(mock)
    }
    if (pathItemObj.delete) {
      const mock = extractOperation(pathItemObj.delete, "DELETE", path)
      if (mock) mocks.push(mock)
    }
    if (pathItemObj.head) {
      const mock = extractOperation(pathItemObj.head, "HEAD", path)
      if (mock) mocks.push(mock)
    }
    if (pathItemObj.options) {
      const mock = extractOperation(pathItemObj.options, "OPTIONS", path)
      if (mock) mocks.push(mock)
    }
  }

  return mocks
}

/**
 * Extract mock from operation
 */
const extractOperation = (
  operation: OpenAPIV3.OperationObject | OpenAPIV3.ReferenceObject,
  method: string,
  path: string
): ExtractedMock | null => {
  if ("$ref" in operation) {
    return null
  }

  const responses = operation.responses || {}
  const statusCode = getFirstSuccessStatusCode(Object.keys(responses))
  const response = responses[statusCode]

  let responseBody: unknown = {}

  if (response && typeof response === "object" && !("$ref" in response)) {
    const content = response.content
    if (content && content["application/json"]) {
      const schema = content["application/json"].schema
      if (schema) {
        // Generate example from schema
        responseBody = generateExampleFromSchema(schema)
      }
    }
  }

  return {
    name: operation.summary || operation.operationId || `${method} ${path}`,
    endpoint: path,
    method: method,
    responseCode: parseInt(statusCode),
    responseBody,
  }
}

/**
 * Get first success status code (2xx) from response codes
 */
const getFirstSuccessStatusCode = (statusCodes: string[]): string => {
  // Prefer 200, then 201, then any other 2xx
  const sorted = statusCodes.sort((a, b) => {
    const aNum = parseInt(a)
    const bNum = parseInt(b)
    if (aNum >= 200 && aNum < 300 && bNum >= 200 && bNum < 300) {
      return aNum - bNum
    }
    if (aNum >= 200 && aNum < 300) return -1
    if (bNum >= 200 && bNum < 300) return 1
    return 0
  })

  const successCode = sorted.find((code) => {
    const num = parseInt(code)
    return num >= 200 && num < 300
  })

  return successCode || "200"
}

/**
 * Generate example value from JSON schema
 */
const generateExampleFromSchema = (
  schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject
): unknown => {
  if ("$ref" in schema) {
    // Reference - return empty object for now
    return {}
  }

  if (schema.type === "object") {
    const example: Record<string, unknown> = {}
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if ("$ref" in propSchema) {
          example[key] = {}
        } else {
          example[key] = generateExampleFromSchema(propSchema)
        }
      }
    }
    return example
  }

  if (schema.type === "array") {
    const items = schema.items
    if (items && !("$ref" in items)) {
      return [generateExampleFromSchema(items)]
    }
    return []
  }

  if (schema.type === "string") {
    return schema.example || schema.default || ""
  }

  if (schema.type === "number" || schema.type === "integer") {
    return schema.example || schema.default || 0
  }

  if (schema.type === "boolean") {
    return schema.example || schema.default || false
  }

  return {}
}

/**
 * Validate OpenAPI spec format
 */
export const validateOpenApiSpec = (spec: unknown): {
  valid: boolean
  error?: string
} => {
  if (!spec || typeof spec !== "object") {
    return { valid: false, error: "Invalid specification format" }
  }

  const specObj = spec as Record<string, unknown>

  if (!specObj.openapi && !specObj.swagger) {
    return { valid: false, error: "Missing 'openapi' or 'swagger' field" }
  }

  if (specObj.openapi && typeof specObj.openapi === "string") {
    const version = specObj.openapi
    if (!version.startsWith("3.")) {
      return {
        valid: false,
        error: `Unsupported OpenAPI version: ${version}. Only OpenAPI 3.0+ is supported.`,
      }
    }
  }

  if (specObj.swagger) {
    return {
      valid: false,
      error: "Swagger 2.0 is not yet supported. Please use OpenAPI 3.0.",
    }
  }

  if (!specObj.paths || typeof specObj.paths !== "object") {
    return { valid: false, error: "Missing or invalid 'paths' field" }
  }

  return { valid: true }
}

