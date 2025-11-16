"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DialogFooter } from "@/components/ui/dialog"
import { Loader2, Building2, Globe, Lock } from "lucide-react"

interface CreateOrganizationFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  isLoading?: boolean
  setIsLoading?: (loading: boolean) => void
}

export default function CreateOrganizationForm({
  onSuccess,
  onCancel,
  isLoading: externalIsLoading,
  setIsLoading: externalSetIsLoading,
}: CreateOrganizationFormProps) {
  const router = useRouter()
  const [internalIsLoading, setInternalIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    visibility: "private" as "private" | "public",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isLoading = externalIsLoading ?? internalIsLoading
  const setIsLoading = externalSetIsLoading ?? setInternalIsLoading

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Organization name is required"
    } else if (formData.name.length > 100) {
      newErrors.name = "Name must be less than 100 characters"
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          visibility: formData.visibility,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setErrors({ submit: errorData.error || "Failed to create organization" })
        setIsLoading(false)
        return
      }

      const data = await response.json()
      toast.success("Organization created successfully!")

      // Reset form
      setFormData({
        name: "",
        description: "",
        visibility: "private",
      })
      setErrors({})

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }

      // Navigate to the new organization
      router.push(`/dashboard/organizations/${data.organization.slug}`)
    } catch (error) {
      console.error("Error creating organization:", error)
      setErrors({ submit: "Network error. Please try again." })
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleCancel = () => {
    if (!isLoading && onCancel) {
      setFormData({
        name: "",
        description: "",
        visibility: "private",
      })
      setErrors({})
      onCancel()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Organization Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="My Organization"
          className={errors.name ? "border-destructive" : ""}
          disabled={isLoading}
          maxLength={100}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {formData.name.length}/100 characters
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="A brief description of your organization..."
          className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
            errors.description ? "border-destructive" : ""
          }`}
          disabled={isLoading}
          rows={4}
          maxLength={500}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {formData.description.length}/500 characters
        </p>
      </div>

      {/* Visibility */}
      <div className="space-y-2">
        <Label htmlFor="visibility">Visibility</Label>
        <Select
          value={formData.visibility}
          onValueChange={(value: "private" | "public") =>
            handleChange("visibility", value)
          }
          disabled={isLoading}
        >
          <SelectTrigger id="visibility">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>Private</span>
              </div>
            </SelectItem>
            <SelectItem value="public">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>Public</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {formData.visibility === "private"
            ? "Only members can view and access organization mocks"
            : "Anyone can view public organization mocks"}
        </p>
      </div>

      {errors.submit && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {errors.submit}
        </div>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" variant="gradient" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Building2 className="mr-2 h-4 w-4" />
              Create Organization
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

