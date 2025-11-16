/**
 * Combined input validation and sanitization utilities
 * This module combines Yup validation with sanitization for secure input handling
 */

import { validateAndParse, getValidationErrorMessage } from "./validation"
import {
  sanitizeString,
  sanitizeEndpoint,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeJson,
  sanitizeSlug,
} from "./sanitization"
import {
  createMockApiSchema,
  updateMockApiSchema,
  createOrganizationSchema,
  updateOrganizationSchema,
  updateProfileSchema,
  changePasswordSchema,
  inviteMemberSchema,
  apiTestRequestSchema,
} from "./validation"
import { NextResponse } from "next/server"

/**
 * Validate and sanitize mock API creation input
 */
export async function validateAndSanitizeMockApiCreate(data: unknown) {
  // First validate with Yup
  const validation = await validateAndParse(createMockApiSchema, data)
  if (!validation.success) {
    return {
      success: false as const,
      error: NextResponse.json(
        { error: getValidationErrorMessage(validation.error) },
        { status: 400 }
      ),
    }
  }

  // Then sanitize string fields
  const sanitized = {
    ...validation.data,
    name: sanitizeString(validation.data.name),
    endpoint: sanitizeEndpoint(validation.data.endpoint),
    responseBody: validation.data.responseBody
      ? sanitizeJson(validation.data.responseBody)
      : undefined,
  }

  return { success: true as const, data: sanitized }
}

/**
 * Validate and sanitize mock API update input
 */
export async function validateAndSanitizeMockApiUpdate(data: unknown) {
  // First validate with Yup
  const validation = await validateAndParse(updateMockApiSchema, data)
  if (!validation.success) {
    return {
      success: false as const,
      error: NextResponse.json(
        { error: getValidationErrorMessage(validation.error) },
        { status: 400 }
      ),
    }
  }

  // Then sanitize string fields (only if provided)
  const sanitized: typeof validation.data = {}
  if (validation.data.name !== undefined) {
    sanitized.name = sanitizeString(validation.data.name)
  }
  if (validation.data.endpoint !== undefined) {
    sanitized.endpoint = sanitizeEndpoint(validation.data.endpoint)
  }
  if (validation.data.method !== undefined) {
    sanitized.method = validation.data.method // Already validated enum
  }
  if (validation.data.responseCode !== undefined) {
    sanitized.responseCode = validation.data.responseCode // Already validated number
  }
  if (validation.data.responseBody !== undefined) {
    sanitized.responseBody = sanitizeJson(validation.data.responseBody)
  }

  return { success: true as const, data: sanitized }
}

/**
 * Validate and sanitize organization creation input
 */
export async function validateAndSanitizeOrganizationCreate(data: unknown) {
  // First validate with Yup
  const validation = await validateAndParse(createOrganizationSchema, data)
  if (!validation.success) {
    return {
      success: false as const,
      error: NextResponse.json(
        { error: getValidationErrorMessage(validation.error) },
        { status: 400 }
      ),
    }
  }

  // Then sanitize string fields
  const sanitized = {
    ...validation.data,
    name: sanitizeString(validation.data.name),
    description: validation.data.description
      ? sanitizeString(validation.data.description)
      : null,
  }

  return { success: true as const, data: sanitized }
}

/**
 * Validate and sanitize organization update input
 */
export async function validateAndSanitizeOrganizationUpdate(data: unknown) {
  // First validate with Yup
  const validation = await validateAndParse(updateOrganizationSchema, data)
  if (!validation.success) {
    return {
      success: false as const,
      error: NextResponse.json(
        { error: getValidationErrorMessage(validation.error) },
        { status: 400 }
      ),
    }
  }

  // Then sanitize string fields (only if provided)
  const sanitized: typeof validation.data = {}
  if (validation.data.name !== undefined) {
    sanitized.name = sanitizeString(validation.data.name)
  }
  if (validation.data.description !== undefined) {
    sanitized.description = validation.data.description
      ? sanitizeString(validation.data.description)
      : null
  }
  if (validation.data.visibility !== undefined) {
    sanitized.visibility = validation.data.visibility // Already validated enum
  }

  return { success: true as const, data: sanitized }
}

/**
 * Validate and sanitize profile update input
 */
export async function validateAndSanitizeProfileUpdate(data: unknown) {
  // First validate with Yup
  const validation = await validateAndParse(updateProfileSchema, data)
  if (!validation.success) {
    return {
      success: false as const,
      error: NextResponse.json(
        { error: getValidationErrorMessage(validation.error) },
        { status: 400 }
      ),
    }
  }

  // Then sanitize string fields (only if provided)
  const sanitized: typeof validation.data = {}
  if (validation.data.name !== undefined) {
    sanitized.name = sanitizeString(validation.data.name)
  }
  if (validation.data.email !== undefined) {
    sanitized.email = sanitizeEmail(validation.data.email)
  }

  return { success: true as const, data: sanitized }
}

/**
 * Validate and sanitize invite member input
 */
export async function validateAndSanitizeInviteMember(data: unknown) {
  // First validate with Yup
  const validation = await validateAndParse(inviteMemberSchema, data)
  if (!validation.success) {
    return {
      success: false as const,
      error: NextResponse.json(
        { error: getValidationErrorMessage(validation.error) },
        { status: 400 }
      ),
    }
  }

  // Then sanitize email
  const sanitized = {
    ...validation.data,
    email: sanitizeEmail(validation.data.email),
  }

  return { success: true as const, data: sanitized }
}

/**
 * Validate and sanitize API test request input
 */
export async function validateAndSanitizeApiTestRequest(data: unknown) {
  // First validate with Yup
  const validation = await validateAndParse(apiTestRequestSchema, data)
  if (!validation.success) {
    return {
      success: false as const,
      error: NextResponse.json(
        { error: getValidationErrorMessage(validation.error) },
        { status: 400 }
      ),
    }
  }

  // Then sanitize URL
  const sanitized = {
    ...validation.data,
    url: sanitizeUrl(validation.data.url),
    requestBody: validation.data.requestBody
      ? sanitizeJson(validation.data.requestBody)
      : undefined,
  }

  return { success: true as const, data: sanitized }
}

/**
 * Sanitize organization slug (used after generation)
 */
export function sanitizeOrganizationSlug(slug: string): string {
  return sanitizeSlug(slug)
}

/**
 * Validate and sanitize signup input
 */
export async function validateAndSanitizeSignup(data: unknown) {
  const { validateAndParse, getValidationErrorMessage, emailSchema, nameSchema } = await import("./validation")
  const { sanitizeEmail, sanitizeString } = await import("./sanitization")
  const yup = await import("yup")

  const signupSchema = yup.object({
    name: nameSchema,
    email: emailSchema,
    password: yup
      .string()
      .required("Password is required")
      .min(6, "Password must be at least 6 characters"), // Less strict for signup
  })

  const validation = await validateAndParse(signupSchema, data)
  if (!validation.success) {
    return {
      success: false as const,
      error: NextResponse.json(
        { error: getValidationErrorMessage(validation.error) },
        { status: 400 }
      ),
    }
  }

  const sanitized = {
    ...validation.data,
    name: sanitizeString(validation.data.name),
    email: sanitizeEmail(validation.data.email),
  }

  return { success: true as const, data: sanitized }
}

