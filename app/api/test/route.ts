import { withAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { RATE_LIMITS } from "@/lib/rate-limit"
import axios, { AxiosError, AxiosRequestConfig } from "axios"
import { NextResponse } from "next/server"

export const POST = withAuth(
  async (request, user) => {
    const body = await request.json()

    // Validate and sanitize input using Yup validation + sanitization
    const { validateAndSanitizeApiTestRequest } = await import("@/lib/input-security")
    const validationResult = await validateAndSanitizeApiTestRequest(body)

    if (!validationResult.success) {
      return validationResult.error
    }

    const {
      url,
      method,
      headers = {},
      queryParams = {},
      requestBody,
      saveToHistory = true,
    } = validationResult.data

    // Build URL with query parameters
    let requestUrl = url
    if (Object.keys(queryParams).length > 0) {
      const urlObj = new URL(url)
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          urlObj.searchParams.append(key, String(value))
        }
      })
      requestUrl = urlObj.toString()
    }

    // Prepare request config
    const startTime = Date.now()
    const config: AxiosRequestConfig = {
      method: method.toUpperCase(),
      url: requestUrl,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      timeout: 30000, // 30 seconds timeout
      validateStatus: () => true, // Don't throw on any status code
    }

    // Add request body for methods that support it
    if (
      ["POST", "PUT", "PATCH"].includes(method.toUpperCase()) &&
      requestBody
    ) {
      try {
        // Try to parse as JSON if it's a string
        config.data =
          typeof requestBody === "string"
            ? JSON.parse(requestBody)
            : requestBody
      } catch {
        // If parsing fails, send as string
        config.data = requestBody
        if (config.headers) {
          config.headers["Content-Type"] = "text/plain"
        }
      }
    }

    // Make the request
    let response
    let error: AxiosError | null = null

    try {
      response = await axios(config)
    } catch (err) {
      error = err as AxiosError
    }

    const responseTime = Date.now() - startTime

    // Handle errors
    if (error) {
      return NextResponse.json({
        success: false,
        error: {
          message: error.message || "Request failed",
          code: error.code,
          details: error.response?.data || null,
        },
        responseTime,
      })
    }

    // Prepare response data
    const responseData = {
      success: true,
      status: response?.status || 0,
      statusText: response?.statusText || "",
      headers: response?.headers || {},
      data: response?.data || null,
      responseTime,
    }

    // Save to request history (async, don't wait for it) - only if saveToHistory is true
    if (saveToHistory) {
      prisma.requestHistory
        .create({
          data: {
            userId: user.id,
            url: requestUrl,
            method: method.toUpperCase(),
            status: response?.status || 0,
            responseTime: responseTime / 1000, // Convert to seconds
            responseBody: response?.data
              ? JSON.parse(JSON.stringify(response.data))
              : null,
          },
        })
        .catch((err) => {
          console.error("Error saving to request history:", err)
          // Don't fail the request if history save fails
        })
    }

  return NextResponse.json(responseData)
  },
  RATE_LIMITS.API_TEST // Stricter rate limit for API testing
)
