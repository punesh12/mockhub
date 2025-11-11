import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"
import axios, { AxiosError } from "axios"
import { prisma } from "@/lib/prisma"
import { ALL_HTTP_METHODS, isValidHttpMethod } from "@/lib/http-methods"

export const POST = withAuth(async (request, user) => {

    const body = await request.json()
    const {
      url,
      method = "GET",
      headers = {},
      queryParams = {},
      requestBody,
      saveToHistory = true, // Default to true for backward compatibility
    } = body

    // Validate URL
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate HTTP method
    if (!isValidHttpMethod(method) || !ALL_HTTP_METHODS.includes(method.toUpperCase())) {
      return NextResponse.json(
        { error: "Invalid HTTP method" },
        { status: 400 }
      )
    }

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
    const config: any = {
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
      } catch (error) {
        // If parsing fails, send as string
        config.data = requestBody
        config.headers["Content-Type"] = "text/plain"
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
})
