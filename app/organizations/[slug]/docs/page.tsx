"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Copy, Share2, Globe, Lock } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false })
import "swagger-ui-react/swagger-ui.css"

interface Organization {
  id: string
  name: string
  slug: string
  description: string | null
  visibility: "private" | "public"
}

const OrganizationDocsPage = () => {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [openApiSpec, setOpenApiSpec] = useState<unknown>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (slug) {
      fetchOrganizationAndSpec()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const fetchOrganizationAndSpec = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch organization details
      const orgResponse = await fetch(`/api/organizations/${slug}`)
      if (!orgResponse.ok) {
        if (orgResponse.status === 404) {
          setError("Organization not found")
        } else if (orgResponse.status === 401) {
          setError("This organization is private. Please sign in to view.")
        } else {
          setError("Failed to load organization")
        }
        setIsLoading(false)
        return
      }

      const orgData = await orgResponse.json()
      setOrganization(orgData.organization)

      // Fetch OpenAPI spec
      const specResponse = await fetch(`/api/organizations/${slug}/openapi?format=json`)
      if (!specResponse.ok) {
        setError("Failed to load API documentation")
        setIsLoading(false)
        return
      }

      const spec = await specResponse.json()
      setOpenApiSpec(spec)
    } catch (err) {
      console.error("Error fetching organization docs:", err)
      setError("Failed to load API documentation")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyUrl = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      toast.success("URL copied to clipboard")
    })
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${organization?.name} API Documentation`,
        text: `Check out the API documentation for ${organization?.name}`,
        url: window.location.href,
      })
    } else {
      handleCopyUrl()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-4" />
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-96 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <h1 className="text-2xl font-bold">Documentation Not Available</h1>
            <p className="text-muted-foreground">{error || "Organization not found"}</p>
            {error?.includes("private") && (
              <Button asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b bg-card"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{organization.name} API</h1>
                  {organization.visibility === "public" ? (
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                {organization.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {organization.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Swagger UI */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="container mx-auto px-4 py-8"
      >
        <Card>
          <CardContent className="p-0">
            <div className="swagger-ui-wrapper">
              {openApiSpec && (
                <SwaggerUI
                  spec={openApiSpec}
                  deepLinking={true}
                  displayOperationId={false}
                  defaultModelsExpandDepth={1}
                  defaultModelExpandDepth={1}
                  docExpansion="list"
                  filter={true}
                  showExtensions={true}
                  showCommonExtensions={true}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <style jsx global>{`
        /* Swagger UI Dark Mode Support */
        .swagger-ui-wrapper {
          --swagger-ui-bg: hsl(var(--background));
          --swagger-ui-text: hsl(var(--foreground));
        }

        .swagger-ui {
          color: hsl(var(--foreground)) !important;
        }

        .swagger-ui .topbar {
          display: none;
        }

        .swagger-ui .info {
          margin: 20px 0;
        }

        .swagger-ui .info .title {
          color: hsl(var(--foreground)) !important;
        }

        .swagger-ui .info .description {
          color: hsl(var(--muted-foreground)) !important;
        }

        /* Server selection */
        .swagger-ui .scheme-container {
          background: hsl(var(--card)) !important;
          border: 1px solid hsl(var(--border)) !important;
          padding: 10px;
        }

        .swagger-ui .scheme-container label {
          color: hsl(var(--foreground)) !important;
        }

        .swagger-ui .scheme-container select {
          background: hsl(var(--background)) !important;
          border-color: hsl(var(--border)) !important;
          color: hsl(var(--foreground)) !important;
        }

        /* Filter input */
        .swagger-ui .filter-container input {
          background: hsl(var(--background)) !important;
          border-color: hsl(var(--border)) !important;
          color: hsl(var(--foreground)) !important;
        }

        .swagger-ui .filter-container label {
          color: hsl(var(--foreground)) !important;
        }

        /* Operation blocks */
        .swagger-ui .opblock {
          border-color: hsl(var(--border)) !important;
          background: hsl(var(--card)) !important;
        }

        .swagger-ui .opblock.opblock-post {
          background: hsl(var(--card)) !important;
          border-color: hsl(var(--primary)) !important;
        }

        .swagger-ui .opblock.opblock-get {
          background: hsl(var(--card)) !important;
          border-color: hsl(var(--primary)) !important;
        }

        .swagger-ui .opblock.opblock-put {
          background: hsl(var(--card)) !important;
          border-color: hsl(var(--primary)) !important;
        }

        .swagger-ui .opblock.opblock-delete {
          background: hsl(var(--card)) !important;
          border-color: hsl(var(--destructive)) !important;
        }

        .swagger-ui .opblock-tag {
          color: hsl(var(--foreground)) !important;
        }

        .swagger-ui .opblock-tag small {
          color: hsl(var(--muted-foreground)) !important;
        }

        .swagger-ui .opblock-summary {
          color: hsl(var(--foreground)) !important;
        }

        .swagger-ui .opblock-summary-path {
          color: hsl(var(--foreground)) !important;
        }

        .swagger-ui .opblock-summary-description {
          color: hsl(var(--muted-foreground)) !important;
        }

        /* Parameters section */
        .swagger-ui .opblock-section {
          background: hsl(var(--card)) !important;
          border-color: hsl(var(--border)) !important;
        }

        .swagger-ui .opblock-section-header {
          background: hsl(var(--muted)) !important;
          border-color: hsl(var(--border)) !important;
        }

        .swagger-ui .opblock-section-header h4 {
          color: hsl(var(--foreground)) !important;
        }

        .swagger-ui .opblock-section-header label {
          color: hsl(var(--foreground)) !important;
        }

        .swagger-ui .parameter__name {
          color: hsl(var(--foreground)) !important;
        }

        .swagger-ui .parameter__type {
          color: hsl(var(--muted-foreground)) !important;
        }

        .swagger-ui .parameter__in {
          color: hsl(var(--muted-foreground)) !important;
        }

        .swagger-ui .parameter__deprecated {
          color: hsl(var(--destructive)) !important;
        }

        /* Request body */
        .swagger-ui .body-param-content {
          background: hsl(var(--background)) !important;
        }

        .swagger-ui .body-param-options label {
          color: hsl(var(--foreground)) !important;
        }

        /* Responses section */
        .swagger-ui .response-col_status {
          color: hsl(var(--foreground)) !important;
        }

        .swagger-ui .response-col_description {
          color: hsl(var(--muted-foreground)) !important;
        }

        .swagger-ui .response-content-type {
          color: hsl(var(--muted-foreground)) !important;
        }

        .swagger-ui .response .response-col_links {
          color: hsl(var(--foreground)) !important;
        }

        /* Model/Schema section */
        .swagger-ui .model-title {
          color: hsl(var(--foreground)) !important;
        }

        .swagger-ui .model-box {
          background: hsl(var(--card)) !important;
          border-color: hsl(var(--border)) !important;
        }

        .swagger-ui .model-box-control {
          color: hsl(var(--foreground)) !important;
        }

        .swagger-ui .model-jump-to-path {
          color: hsl(var(--primary)) !important;
        }

        .swagger-ui .prop-name {
          color: hsl(var(--foreground)) !important;
        }

        .swagger-ui .prop-type {
          color: hsl(var(--muted-foreground)) !important;
        }

        /* Buttons */
        .swagger-ui .btn {
          background: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
          border-color: hsl(var(--primary)) !important;
        }

        .swagger-ui .btn:hover {
          opacity: 0.9;
        }

        .swagger-ui .btn.cancel {
          background: hsl(var(--secondary)) !important;
          color: hsl(var(--secondary-foreground)) !important;
          border-color: hsl(var(--border)) !important;
        }

        .swagger-ui .btn.execute {
          background: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
        }

        /* Inputs */
        .swagger-ui input[type="text"],
        .swagger-ui input[type="email"],
        .swagger-ui input[type="password"],
        .swagger-ui input[type="number"],
        .swagger-ui textarea {
          background: hsl(var(--background)) !important;
          border-color: hsl(var(--border)) !important;
          color: hsl(var(--foreground)) !important;
        }

        .swagger-ui input::placeholder {
          color: hsl(var(--muted-foreground)) !important;
        }

        .swagger-ui select {
          background: hsl(var(--background)) !important;
          border-color: hsl(var(--border)) !important;
          color: hsl(var(--foreground)) !important;
        }

        /* Code blocks */
        .swagger-ui .highlight-code {
          background: hsl(var(--muted)) !important;
        }

        .swagger-ui pre {
          background: hsl(var(--muted)) !important;
          color: hsl(var(--foreground)) !important;
        }

        .swagger-ui code {
          background: hsl(var(--muted)) !important;
          color: hsl(var(--foreground)) !important;
        }

        /* Tables */
        .swagger-ui table thead tr td,
        .swagger-ui table thead tr th {
          color: hsl(var(--foreground)) !important;
          border-color: hsl(var(--border)) !important;
        }

        .swagger-ui table tbody tr td {
          color: hsl(var(--foreground)) !important;
          border-color: hsl(var(--border)) !important;
        }

        /* Links */
        .swagger-ui a {
          color: hsl(var(--primary)) !important;
        }

        .swagger-ui a.nostyle {
          color: hsl(var(--foreground)) !important;
        }

        /* Markdown content */
        .swagger-ui .markdown p,
        .swagger-ui .markdown code,
        .swagger-ui .markdown pre {
          color: hsl(var(--foreground)) !important;
        }

        /* Dark mode specific overrides */
        .dark .swagger-ui {
          color: hsl(var(--foreground)) !important;
        }

        .dark .swagger-ui .scheme-container {
          background: hsl(var(--muted)) !important;
        }

        .dark .swagger-ui .opblock {
          background: hsl(var(--card)) !important;
        }

        .dark .swagger-ui .opblock-section {
          background: hsl(var(--card)) !important;
        }

        .dark .swagger-ui .opblock-section-header {
          background: hsl(var(--muted)) !important;
        }
      `}</style>
    </div>
  )
}

export default OrganizationDocsPage

