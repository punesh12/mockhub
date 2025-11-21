/**
 * Tests for validation schemas
 */

import {
  emailSchema,
  passwordSchema,
  nameSchema,
  endpointSchema,
  createMockApiSchema,
  updateMockApiSchema,
} from "@/lib/validation"

describe("validation schemas", () => {
  describe("emailSchema", () => {
    it("should validate correct email addresses", async () => {
      await expect(emailSchema.validate("test@example.com")).resolves.toBe("test@example.com")
      await expect(emailSchema.validate("user.name+tag@example.co.uk")).resolves.toBe("user.name+tag@example.co.uk")
    })

    it("should reject invalid email addresses", async () => {
      await expect(emailSchema.validate("invalid-email")).rejects.toThrow()
      await expect(emailSchema.validate("@example.com")).rejects.toThrow()
      await expect(emailSchema.validate("test@")).rejects.toThrow()
    })

    it("should transform email to lowercase and trim", async () => {
      await expect(emailSchema.validate("  TEST@EXAMPLE.COM  ")).resolves.toBe("test@example.com")
    })

    it("should reject emails longer than 255 characters", async () => {
      const longEmail = "a".repeat(250) + "@example.com"
      await expect(emailSchema.validate(longEmail)).rejects.toThrow()
    })

    it("should require email", async () => {
      await expect(emailSchema.validate("")).rejects.toThrow()
      await expect(emailSchema.validate(undefined)).rejects.toThrow()
      await expect(emailSchema.validate(null)).rejects.toThrow()
    })
  })

  describe("passwordSchema", () => {
    it("should validate correct passwords", async () => {
      await expect(passwordSchema.validate("Password123")).resolves.toBe("Password123")
      await expect(passwordSchema.validate("SecurePass1")).resolves.toBe("SecurePass1")
    })

    it("should reject passwords without uppercase", async () => {
      await expect(passwordSchema.validate("password123")).rejects.toThrow()
    })

    it("should reject passwords without lowercase", async () => {
      await expect(passwordSchema.validate("PASSWORD123")).rejects.toThrow()
    })

    it("should reject passwords without numbers", async () => {
      await expect(passwordSchema.validate("Password")).rejects.toThrow()
    })

    it("should reject passwords shorter than 8 characters", async () => {
      await expect(passwordSchema.validate("Pass1")).rejects.toThrow()
    })

    it("should reject passwords longer than 128 characters", async () => {
      const longPassword = "A".repeat(129) + "1"
      await expect(passwordSchema.validate(longPassword)).rejects.toThrow()
    })

    it("should require password", async () => {
      await expect(passwordSchema.validate("")).rejects.toThrow()
      await expect(passwordSchema.validate(undefined)).rejects.toThrow()
    })
  })

  describe("nameSchema", () => {
    it("should validate correct names", async () => {
      await expect(nameSchema.validate("John Doe")).resolves.toBe("John Doe")
      await expect(nameSchema.validate("User-Name_123")).resolves.toBe("User-Name_123")
    })

    it("should reject names with special characters", async () => {
      await expect(nameSchema.validate("John@Doe")).rejects.toThrow()
      await expect(nameSchema.validate("John#Doe")).rejects.toThrow()
    })

    it("should trim whitespace", async () => {
      await expect(nameSchema.validate("  John Doe  ")).resolves.toBe("John Doe")
    })

    it("should reject names longer than 100 characters", async () => {
      const longName = "A".repeat(101)
      await expect(nameSchema.validate(longName)).rejects.toThrow()
    })

    it("should require name", async () => {
      await expect(nameSchema.validate("")).rejects.toThrow()
      await expect(nameSchema.validate(undefined)).rejects.toThrow()
    })
  })

  describe("endpointSchema", () => {
    it("should validate correct endpoints", async () => {
      await expect(endpointSchema.validate("/users")).resolves.toBe("/users")
      await expect(endpointSchema.validate("/api/v1/users")).resolves.toBe("/api/v1/users")
      await expect(endpointSchema.validate("/users/123")).resolves.toBe("/users/123")
    })

    it("should require endpoint to start with /", async () => {
      await expect(endpointSchema.validate("users")).rejects.toThrow()
    })

    it("should reject endpoints with consecutive slashes", async () => {
      await expect(endpointSchema.validate("/users//123")).rejects.toThrow()
    })

    it("should reject endpoints with invalid characters", async () => {
      await expect(endpointSchema.validate("/users@123")).rejects.toThrow()
      await expect(endpointSchema.validate("/users#123")).rejects.toThrow()
    })

    it("should reject endpoints longer than 500 characters", async () => {
      const longEndpoint = "/" + "a".repeat(500)
      await expect(endpointSchema.validate(longEndpoint)).rejects.toThrow()
    })

    it("should require endpoint", async () => {
      await expect(endpointSchema.validate("")).rejects.toThrow()
      await expect(endpointSchema.validate(undefined)).rejects.toThrow()
    })
  })

  describe("createMockApiSchema", () => {
    it("should validate correct mock API data", async () => {
      const validData = {
        name: "Get Users",
        endpoint: "/users",
        method: "GET",
        responseCode: 200,
        responseBody: { users: [] },
      }
      await expect(createMockApiSchema.validate(validData)).resolves.toMatchObject({
        name: "Get Users",
        endpoint: "/users",
        method: "GET",
        responseCode: 200,
      })
    })

    it("should require name", async () => {
      const invalidData = {
        endpoint: "/users",
        method: "GET",
        responseCode: 200,
      }
      await expect(createMockApiSchema.validate(invalidData)).rejects.toThrow()
    })

    it("should require endpoint", async () => {
      const invalidData = {
        name: "Get Users",
        method: "GET",
        responseCode: 200,
      }
      await expect(createMockApiSchema.validate(invalidData)).rejects.toThrow()
    })

    it("should require method", async () => {
      const invalidData = {
        name: "Get Users",
        endpoint: "/users",
        responseCode: 200,
      }
      await expect(createMockApiSchema.validate(invalidData)).rejects.toThrow()
    })

    it("should use default responseCode when not provided", async () => {
      const dataWithoutResponseCode = {
        name: "Get Users",
        endpoint: "/users",
        method: "GET",
      }
      // responseCode has a default of 200
      const result = await createMockApiSchema.validate(dataWithoutResponseCode)
      expect(result.responseCode).toBe(200)
    })

    it("should validate responseCode is between 100 and 599", async () => {
      const invalidData = {
        name: "Get Users",
        endpoint: "/users",
        method: "GET",
        responseCode: 99,
      }
      await expect(createMockApiSchema.validate(invalidData)).rejects.toThrow()

      const invalidData2 = {
        name: "Get Users",
        endpoint: "/users",
        method: "GET",
        responseCode: 600,
      }
      await expect(createMockApiSchema.validate(invalidData2)).rejects.toThrow()
    })
  })

  describe("updateMockApiSchema", () => {
    it("should validate partial update data", async () => {
      const partialData = {
        name: "Updated Name",
      }
      await expect(updateMockApiSchema.validate(partialData)).resolves.toMatchObject({
        name: "Updated Name",
      })
    })

    it("should allow all fields to be optional", async () => {
      await expect(updateMockApiSchema.validate({})).resolves.toMatchObject({})
    })

    it("should validate provided fields", async () => {
      const invalidData = {
        name: "", // Empty name should fail
      }
      await expect(updateMockApiSchema.validate(invalidData)).rejects.toThrow()
    })
  })
})

