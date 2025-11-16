"use client"

import { useState } from "react"
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
import { Loader2, UserPlus } from "lucide-react"

interface InviteMemberFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  isLoading?: boolean
  setIsLoading?: (loading: boolean) => void
  organizationId: string // Can be UUID or slug
}

export default function InviteMemberForm({
  onSuccess,
  onCancel,
  isLoading: externalIsLoading,
  setIsLoading: externalSetIsLoading,
  organizationId,
}: InviteMemberFormProps) {
  const [internalIsLoading, setInternalIsLoading] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member")
  const [error, setError] = useState<string>("")

  const isLoading = externalIsLoading ?? internalIsLoading
  const setIsLoading = externalSetIsLoading ?? setInternalIsLoading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inviteEmail.trim()) {
      setError("Email is required")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: inviteEmail.trim(),
            role: inviteRole,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || "Failed to invite member")
        setIsLoading(false)
        return
      }

      // Reset form
      setInviteEmail("")
      setInviteRole("member")
      setError("")

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error inviting member:", error)
      setError("Network error. Please try again.")
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (!isLoading && onCancel) {
      setInviteEmail("")
      setInviteRole("member")
      setError("")
      onCancel()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="invite-email">Email Address</Label>
          <Input
            id="invite-email"
            type="email"
            value={inviteEmail}
            onChange={(e) => {
              setInviteEmail(e.target.value)
              setError("")
            }}
            placeholder="user@example.com"
            onKeyDown={(e) => {
              if (e.key === "Enter" && inviteEmail.trim()) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            disabled={isLoading}
            className={error ? "border-destructive" : ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-role">Role</Label>
          <Select
            value={inviteRole}
            onValueChange={(value: "admin" | "member") =>
              setInviteRole(value)
            }
            disabled={isLoading}
          >
            <SelectTrigger id="invite-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">
                Member - Can view and create mocks
              </SelectItem>
              <SelectItem value="admin">
                Admin - Can manage members and settings
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
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
        <Button
          type="submit"
          disabled={isLoading || !inviteEmail.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Inviting...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

