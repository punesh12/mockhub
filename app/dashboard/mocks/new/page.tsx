"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Loader2, ArrowLeft, Sparkles, Eye, ChevronDown, Building2 } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { generateMockData, type MockTemplate } from "@/lib/mock-generator"
import { COMMON_HTTP_METHODS } from "@/lib/http-methods"
import { HTTP_STATUS_CODES } from "@/lib/http-status-codes"

interface Organization {
  id: string
  name: string
  slug: string
  userRole: string | null
}

function CreateMockPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    name: "",
    endpoint: "",
    method: "GET",
    responseCode: 200,
    responseBody: "{}",
    organizationId: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true)

  // Fetch organizations and pre-fill organizationId from query params
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch("/api/organizations?limit=100")
        if (response.ok) {
          const data = await response.json()
          setOrganizations(data.organizations || [])
        }
      } catch (error) {
        console.error("Error fetching organizations:", error)
      } finally {
        setIsLoadingOrgs(false)
      }
    }

    fetchOrganizations()

    // Pre-fill organizationId from query params
    const orgIdParam = searchParams.get("organizationId")
    if (orgIdParam) {
      setFormData((prev) => ({ ...prev, organizationId: orgIdParam }))
    }
  }, [searchParams])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.endpoint.trim()) {
      newErrors.endpoint = "Endpoint is required"
    } else if (!formData.endpoint.startsWith("/")) {
      newErrors.endpoint = "Endpoint must start with /"
    }

    try {
      JSON.parse(formData.responseBody)
    } catch {
      newErrors.responseBody = "Response body must be valid JSON"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleGenerateMockData = (template: MockTemplate = "custom") => {
    const mockData = generateMockData(template)
    setFormData((prev) => ({
      ...prev,
      responseBody: JSON.stringify(mockData, null, 2),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/mocks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          endpoint: formData.endpoint,
          method: formData.method,
          responseCode: formData.responseCode,
          responseBody: JSON.parse(formData.responseBody),
          ...(formData.organizationId && { organizationId: formData.organizationId }),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setErrors({ submit: errorData.error || "Failed to create mock API" })
        setIsLoading(false)
        return
      }


      // Redirect based on whether mock was created for an organization
      if (formData.organizationId) {
        const org = organizations.find((o) => o.id === formData.organizationId)
        if (org?.slug) {
          router.push(`/dashboard/organizations/${org.slug}`)
        } else {
          router.push(`/dashboard/organizations/${formData.organizationId}`)
        }
      } else {
        router.push("/dashboard/mocks")
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setErrors({ submit: "Network error. Please try again." })
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  let parsedBody = null
  try {
    parsedBody = JSON.parse(formData.responseBody)
  } catch {
    // Invalid JSON
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/mocks">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Mock API</h1>
          <p className="text-muted-foreground mt-1">
            Define a new mock endpoint with custom responses
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 relative">
        {/* Form */}
        <Card className="relative z-0 overflow-visible">
          <CardHeader>
            <CardTitle>Mock API Details</CardTitle>
            <CardDescription>Configure your mock endpoint</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="My API Endpoint"
                  className={errors.name ? "border-destructive" : ""}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              {/* Endpoint */}
              <div className="space-y-2">
                <Label htmlFor="endpoint">Endpoint</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">/api</span>
                  <Input
                    id="endpoint"
                    value={formData.endpoint}
                    onChange={(e) => handleChange("endpoint", e.target.value)}
                    placeholder="/users"
                    className={errors.endpoint ? "border-destructive" : ""}
                    disabled={isLoading}
                  />
                </div>
                {errors.endpoint && (
                  <p className="text-sm text-destructive">{errors.endpoint}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Endpoint will be available at: /api
                  {formData.endpoint || "/..."}
                </p>
              </div>

              {/* Organization Selector */}
              {organizations.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization (Optional)</Label>
                  <Select
                    value={formData.organizationId || "personal"}
                    onValueChange={(value) =>
                      handleChange("organizationId", value === "personal" ? "" : value)
                    }
                    disabled={isLoading || isLoadingOrgs}
                  >
                    <SelectTrigger id="organization">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">
                        <div className="flex items-center gap-2">
                          <span>Personal</span>
                        </div>
                      </SelectItem>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span>{org.name}</span>
                            {org.userRole && (
                              <Badge variant="outline" className="ml-auto text-xs">
                                {org.userRole}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {formData.organizationId
                      ? "Mock will be created in the selected organization"
                      : "Mock will be created in your personal collection"}
                  </p>
                </div>
              )}

              {/* Method and Status Code */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="method">HTTP Method</Label>
                  <Select
                    value={formData.method}
                    onValueChange={(value) => handleChange("method", value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_HTTP_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responseCode">Response Code</Label>
                  <Select
                    value={formData.responseCode.toString()}
                    onValueChange={(value) =>
                      handleChange("responseCode", parseInt(value))
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger id="responseCode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HTTP_STATUS_CODES.map((code) => (
                        <SelectItem
                          key={code.value}
                          value={code.value.toString()}
                        >
                          {code.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Response Body */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="responseBody">Response Body (JSON)</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isLoading}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Template
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleGenerateMockData("user")}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        User Template
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleGenerateMockData("product")}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Product Template
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleGenerateMockData("custom")}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Custom Template
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="relative">
                  <textarea
                    id="responseBody"
                    value={formData.responseBody}
                    onChange={(e) => handleChange("responseBody", e.target.value)}
                    className="w-full min-h-[300px] rounded-md border-2 border-input bg-muted/30 px-4 py-3 text-sm font-mono leading-relaxed focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y shadow-inner"
                    placeholder='{\n  "message": "Hello World",\n  "status": "success"\n}'
                    disabled={isLoading}
                    spellCheck={false}
                  />
                  {formData.responseBody && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs">
                        {formData.responseBody.split('\n').length} lines
                      </Badge>
                    </div>
                  )}
                </div>
                {errors.responseBody && (
                  <p className="text-sm text-destructive">
                    {errors.responseBody}
                  </p>
                )}
              </div>

              {errors.submit && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {errors.submit}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Mock API"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                  disabled={isLoading || !parsedBody}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview */}
        {showPreview && parsedBody && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative z-0"
          >
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>How your response will look</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Request</p>
                    <div className="p-3 bg-muted rounded-md font-mono text-sm">
                      <span className="font-semibold">{formData.method}</span>{" "}
                      /api
                      {formData.endpoint || "/..."}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Response</p>
                    <div className="p-3 bg-muted rounded-md">
                      <div className="text-xs text-muted-foreground mb-2">
                        Status: {formData.responseCode}
                      </div>
                      <pre className="text-sm font-mono overflow-auto">
                        {JSON.stringify(parsedBody, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default function CreateMockPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <CreateMockPageContent />
    </Suspense>
  )
}
