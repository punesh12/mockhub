/**
 * Form validation utilities using Yup with React Hook Form
 */

import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import {
  emailSchema,
  nameSchema,
  endpointSchema,
  descriptionSchema,
  httpMethodSchema,
  statusCodeSchema,
  visibilitySchema,
  createOrganizationSchema,
  updateProfileSchema,
  changePasswordSchema,
  inviteMemberSchema,
  apiTestRequestSchema,
} from "./validation"

/**
 * Get Yup resolver for React Hook Form
 */
export function getYupResolver<T extends yup.AnyObjectSchema>(schema: T) {
  return yupResolver(schema)
}

/**
 * Form validation schemas for React Hook Form
 */

// Signup form schema
export const signupFormSchema = yup.object({
  name: nameSchema,
  email: emailSchema,
  password: yup
    .string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"), // Less strict for signup
})

// Login form schema
export const loginFormSchema = yup.object({
  email: emailSchema,
  password: yup.string().required("Password is required"),
})

// Create Mock API form schema
export const createMockApiFormSchema = yup.object({
  name: nameSchema,
  endpoint: endpointSchema,
  method: httpMethodSchema,
  responseCode: statusCodeSchema,
  responseBody: yup
    .string()
    .required("Response body is required")
    .test("valid-json", "Response body must be valid JSON", (value) => {
      if (!value) return false
      try {
        JSON.parse(value)
        return true
      } catch {
        return false
      }
    }),
  organizationId: yup.string().uuid("Invalid organization ID").nullable().optional(),
})

// Update Mock API form schema
export const updateMockApiFormSchema = yup.object({
  name: nameSchema.optional(),
  endpoint: endpointSchema.optional(),
  method: httpMethodSchema.optional(),
  responseCode: statusCodeSchema.optional(),
  responseBody: yup
    .string()
    .optional()
    .test("valid-json", "Response body must be valid JSON", (value) => {
      if (!value) return true // Optional field
      try {
        JSON.parse(value)
        return true
      } catch {
        return false
      }
    }),
})

// Create Organization form schema
export const createOrganizationFormSchema = createOrganizationSchema

// Update Organization form schema
export const updateOrganizationFormSchema = yup.object({
  name: nameSchema.optional(),
  description: descriptionSchema,
  visibility: visibilitySchema.optional(),
})

// Update Profile form schema
export const updateProfileFormSchema = updateProfileSchema

// Change Password form schema
export const changePasswordFormSchema = changePasswordSchema

// Invite Member form schema
export const inviteMemberFormSchema = inviteMemberSchema

// API Test form schema
export const apiTestFormSchema = apiTestRequestSchema

/**
 * Type inference helpers for form data
 */
export type SignupFormData = yup.InferType<typeof signupFormSchema>
export type LoginFormData = yup.InferType<typeof loginFormSchema>
export type CreateMockApiFormData = yup.InferType<typeof createMockApiFormSchema>
export type UpdateMockApiFormData = yup.InferType<typeof updateMockApiFormSchema>
export type CreateOrganizationFormData = yup.InferType<typeof createOrganizationFormSchema>
export type UpdateOrganizationFormData = yup.InferType<typeof updateOrganizationFormSchema>
export type UpdateProfileFormData = yup.InferType<typeof updateProfileFormSchema>
export type ChangePasswordFormData = yup.InferType<typeof changePasswordFormSchema>
export type InviteMemberFormData = yup.InferType<typeof inviteMemberFormSchema>
export type ApiTestFormData = yup.InferType<typeof apiTestFormSchema>

