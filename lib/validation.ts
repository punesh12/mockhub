import * as yup from "yup"

/**
 * Validation schemas for common input types using Yup
 */

// Email validation
export const emailSchema = yup
  .string()
  .required("Email is required")
  .email("Invalid email format")
  .max(255, "Email must be less than 255 characters")
  .transform((value) => (typeof value === "string" ? value.toLowerCase().trim() : value))

// Password validation
export const passwordSchema = yup
  .string()
  .required("Password is required")
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be less than 128 characters")
  .matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  )

// Name validation
export const nameSchema = yup
  .string()
  .required("Name is required")
  .min(1, "Name is required")
  .max(100, "Name must be less than 100 characters")
  .trim()
  .matches(
    /^[a-zA-Z0-9\s\-_]+$/,
    "Name can only contain letters, numbers, spaces, hyphens, and underscores"
  )

// Endpoint validation
export const endpointSchema = yup
  .string()
  .required("Endpoint is required")
  .min(1, "Endpoint is required")
  .max(500, "Endpoint must be less than 500 characters")
  .matches(
    /^\/[a-zA-Z0-9\/\-_]*$/,
    "Endpoint must start with / and contain only alphanumeric characters, slashes, hyphens, and underscores"
  )
  .test("no-double-slash", "Endpoint cannot contain consecutive slashes", (value) => {
    return value ? !value.includes("//") : true
  })

// Description validation
export const descriptionSchema = yup
  .string()
  .max(500, "Description must be less than 500 characters")
  .trim()
  .nullable()
  .optional()
  .transform((value) => (value === "" ? null : value))

// Organization slug validation
export const slugSchema = yup
  .string()
  .required("Slug is required")
  .min(1, "Slug is required")
  .max(100, "Slug must be less than 100 characters")
  .matches(/^[a-z0-9\-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
  .test("no-leading-trailing-hyphen", "Slug cannot start or end with a hyphen", (value) => {
    if (!value) return true
    return !value.startsWith("-") && !value.endsWith("-")
  })

// HTTP method validation
export const httpMethodSchema = yup
  .string()
  .required("HTTP method is required")
  .oneOf(
    ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
    "Invalid HTTP method"
  )

// HTTP status code validation
export const statusCodeSchema = yup
  .number()
  .integer("Status code must be an integer")
  .min(100, "Status code must be between 100 and 599")
  .max(599, "Status code must be between 100 and 599")
  .optional()
  .default(200)

// URL validation
export const urlSchema = yup
  .string()
  .required("URL is required")
  .url("Invalid URL format")
  .max(2048, "URL must be less than 2048 characters")
  .test("http-https-only", "URL must use http or https protocol", (value) => {
    if (!value) return false
    try {
      const parsed = new URL(value)
      return ["http:", "https:"].includes(parsed.protocol)
    } catch {
      return false
    }
  })

// UUID validation
export const uuidSchema = yup
  .string()
  .uuid("Invalid UUID format")
  .nullable()
  .optional()

// Organization visibility validation
export const visibilitySchema = yup
  .string()
  .oneOf(["private", "public"], "Visibility must be 'private' or 'public'")
  .default("private")

// Organization role validation
export const organizationRoleSchema = yup
  .string()
  .oneOf(["owner", "admin", "member"], "Invalid role")
  .required("Role is required")

/**
 * Validation schemas for API requests
 */

// Mock API creation schema
export const createMockApiSchema = yup.object({
  name: nameSchema,
  endpoint: endpointSchema,
  method: httpMethodSchema,
  responseCode: statusCodeSchema,
  responseBody: yup.mixed().optional(),
  organizationId: uuidSchema,
})

// Mock API update schema
export const updateMockApiSchema = yup.object({
  name: nameSchema.optional(),
  endpoint: endpointSchema.optional(),
  method: httpMethodSchema.optional(),
  responseCode: statusCodeSchema.optional(),
  responseBody: yup.mixed().optional(),
})

// Organization creation schema
export const createOrganizationSchema = yup.object({
  name: nameSchema,
  description: descriptionSchema,
  visibility: visibilitySchema,
})

// Organization update schema
export const updateOrganizationSchema = yup.object({
  name: nameSchema.optional(),
  description: descriptionSchema,
  visibility: visibilitySchema.optional(),
})

// User profile update schema
export const updateProfileSchema = yup.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
})

// Change password schema
export const changePasswordSchema = yup
  .object({
    currentPassword: yup.string().required("Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: yup
      .string()
      .required("Confirm password is required")
      .oneOf([yup.ref("newPassword")], "Passwords do not match"),
  })
  .required()

// Invite member schema
export const inviteMemberSchema = yup.object({
  email: emailSchema,
  role: yup
    .string()
    .oneOf(["admin", "member"], "Role must be 'admin' or 'member'")
    .required("Role is required"),
})

// Update member role schema
export const updateMemberRoleSchema = yup.object({
  role: yup
    .string()
    .oneOf(["admin", "member"], "Role must be 'admin' or 'member'")
    .required("Role is required"),
})

// API test request schema
export const apiTestRequestSchema = yup.object({
  url: urlSchema,
  method: httpMethodSchema,
  headers: yup.object().optional().default({}),
  queryParams: yup.object().optional().default({}),
  requestBody: yup.mixed().optional(),
  saveToHistory: yup.boolean().optional().default(true),
})

/**
 * Helper function to validate and parse data
 */
export async function validateAndParse<T>(
  schema: yup.Schema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; error: yup.ValidationError }> {
  try {
    const validatedData = await schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    })
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return { success: false, error }
    }
    throw error
  }
}

/**
 * Helper function to get validation error message
 */
export function getValidationErrorMessage(error: yup.ValidationError): string {
  const firstError = error.errors[0]
  if (firstError) {
    return firstError
  }
  return "Validation failed"
}

/**
 * Helper function to get all validation error messages
 */
export function getValidationErrorMessages(error: yup.ValidationError): string[] {
  return error.errors
}

/**
 * Helper function to get validation errors as an object (field -> message)
 */
export function getValidationErrorsObject(error: yup.ValidationError): Record<string, string> {
  const errors: Record<string, string> = {}

  if (error.inner && error.inner.length > 0) {
    // Handle nested errors
    error.inner.forEach((err) => {
      if (err.path) {
        errors[err.path] = err.message
      }
    })
  } else if (error.path) {
    // Handle single error
    errors[error.path] = error.message
  }

  return errors
}

/**
 * Synchronous validation helper (for simple cases)
 */
export function validateSync<T>(
  schema: yup.Schema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: yup.ValidationError } {
  try {
    const validatedData = schema.validateSync(data, {
      abortEarly: false,
      stripUnknown: true,
    })
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return { success: false, error }
    }
    throw error
  }
}

