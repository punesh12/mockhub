"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Loader2,
  ArrowLeft,
  Save,
  Globe,
  Lock,
  UserPlus,
  Trash2,
  Settings as SettingsIcon,
  Building2,
  Users,
  FileCode,
  Search,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import ConfirmationModal from "@/components/shared/components/ConfirmationModal"
import CopyButton from "@/components/shared/components/CopyButton"
import Modal from "@/components/shared/components/Modal"
import InviteMemberForm from "@/components/organizations/InviteMemberForm"

interface Organization {
  id: string
  name: string
  slug: string
  description: string | null
  visibility: "private" | "public"
  ownerId: string
  userRole: "owner" | "admin" | "member" | null
  members: Array<{
    id: string
    role: string
    user: {
      id: string
      name: string
      email: string
    }
  }>
}

export default function OrganizationSettingsPage() {
  const router = useRouter()
  const params = useParams()
  const organizationSlug = params.id as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRemovingMember, setIsRemovingMember] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<{
    id: string
    name: string
    email: string
    role: string
  } | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState<"private" | "public">("private")
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Invite member state
  const [isInviting, setIsInviting] = useState(false)

  // Member search
  const [memberSearchQuery, setMemberSearchQuery] = useState("")

  // Track if form has unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    if (organizationSlug) {
      fetchOrganization()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationSlug])

  const fetchOrganization = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/organizations/${organizationSlug}`)
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Organization not found")
          router.push("/dashboard/organizations")
          return
        }
        if (response.status === 403) {
          toast.error("You don't have permission to access this organization")
          router.push("/dashboard/organizations")
          return
        }
        throw new Error("Failed to fetch organization")
      }

      const data = await response.json()
      const org = data.organization
      setOrganization(org)
      setName(org.name)
      setDescription(org.description || "")
      setVisibility(org.visibility)
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error("Error fetching organization:", error)
      toast.error("Failed to load organization")
      router.push("/dashboard/organizations")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validation
    if (!name.trim()) {
      setErrors({ name: "Organization name is required" })
      return
    }

    if (name.length > 100) {
      setErrors({ name: "Name must be less than 100 characters" })
      return
    }

    if (description.length > 500) {
      setErrors({ description: "Description must be less than 500 characters" })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/organizations/${organizationSlug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          visibility,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setErrors({ submit: errorData.error || "Failed to update organization" })
        setIsSaving(false)
        return
      }

      const data = await response.json()
      setOrganization(data.organization)
      setName(data.organization.name)
      setDescription(data.organization.description || "")
      setVisibility(data.organization.visibility)
      setHasUnsavedChanges(false)
      setErrors({})
      toast.success("Organization updated successfully!")
    } catch {
      setErrors({ submit: "Network error. Please try again." })
    } finally {
      setIsSaving(false)
    }
  }


  const handleUpdateMemberRole = async (memberId: string, newRole: "admin" | "member") => {
    try {
      const response = await fetch(
        `/api/organizations/${organizationSlug}/members/${memberId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: newRole }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to update member role")
        return
      }

      toast.success("Member role updated successfully")
      fetchOrganization() // Refresh organization data
    } catch (error) {
      console.error("Error updating member role:", error)
      toast.error("Failed to update member role")
    }
  }

  const handleRemoveMemberClick = (member: { id: string; user: { name: string; email: string }; role: string }) => {
    setMemberToRemove({
      id: member.id,
      name: member.user.name,
      email: member.user.email,
      role: member.role,
    })
    setRemoveMemberDialogOpen(true)
  }

  const handleRemoveMember = async () => {
    if (!memberToRemove) return

    setIsRemovingMember(true)
    try {
      const response = await fetch(
        `/api/organizations/${organizationSlug}/members/${memberToRemove.id}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to remove member")
        setIsRemovingMember(false)
        return
      }

      toast.success("Member removed successfully")
      setRemoveMemberDialogOpen(false)
      setMemberToRemove(null)
      fetchOrganization() // Refresh organization data
    } catch (error) {
      console.error("Error removing member:", error)
      toast.error("Failed to remove member")
    } finally {
      setIsRemovingMember(false)
    }
  }

  const handleDeleteOrganization = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/organizations/${organizationSlug}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete organization")
      }

      toast.success("Organization deleted successfully")
      router.push("/dashboard/organizations")
    } catch (error) {
      console.error("Error deleting organization:", error)
      toast.error("Failed to delete organization")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-20 w-full mb-4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!organization) {
    return null
  }

  const canManage = organization.userRole === "owner" || organization.userRole === "admin"
  const isOwner = organization.userRole === "owner"

  if (!canManage) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/organizations/${organizationSlug}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-1">Organization settings</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <SettingsIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground text-center mb-6">
              Only owners and admins can manage organization settings
            </p>
            <Button asChild variant="outline">
              <Link href={`/dashboard/organizations/${organizationSlug}`}>
                Back to Organization
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Filter members based on search
  const filteredMembers = organization.members.filter((member) => {
    if (!memberSearchQuery.trim()) return true
    const query = memberSearchQuery.toLowerCase()
    return (
      member.user.name.toLowerCase().includes(query) ||
      member.user.email.toLowerCase().includes(query)
    )
  })

  // Get initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U"
  }

  // Get organization URL
  const orgUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/dashboard/organizations/${organization.slug}`
    : ""

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/organizations/${organizationSlug}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage {organization.name} settings
          </p>
        </div>
      </motion.div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Members</p>
                <p className="text-2xl font-bold">{organization.members.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mocks</p>
                <p className="text-2xl font-bold">{(organization as Organization & { _count?: { mocks: number } })._count?.mocks || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileCode className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Visibility</p>
                <div className="flex items-center gap-2 mt-1">
                  {organization.visibility === "public" ? (
                    <>
                      <Globe className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold">Public</p>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-semibold">Private</p>
                    </>
                  )}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="members">
            Members ({organization.members.length})
          </TabsTrigger>
          {isOwner && <TabsTrigger value="danger">Danger Zone</TabsTrigger>}
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Update your organization information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateOrganization} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      setHasUnsavedChanges(true)
                    }}
                    className={errors.name ? "border-destructive" : ""}
                    disabled={isSaving}
                    maxLength={100}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {name.length}/100 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Organization Slug</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="slug"
                      value={organization.slug}
                      disabled
                      className="bg-muted"
                    />
                    <CopyButton text={organization.slug} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Used in organization URL: /dashboard/organizations/{organization.slug}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-url">Organization URL</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="org-url"
                      value={orgUrl}
                      disabled
                      className="bg-muted font-mono text-sm"
                    />
                    {orgUrl && <CopyButton text={orgUrl} />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this URL to allow others to view your organization
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value)
                      setHasUnsavedChanges(true)
                    }}
                    className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                      errors.description ? "border-destructive" : ""
                    }`}
                    disabled={isSaving}
                    rows={4}
                    maxLength={500}
                    placeholder="Describe your organization..."
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">
                      {errors.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {description.length}/500 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select
                    value={visibility}
                    onValueChange={(value: "private" | "public") => {
                      setVisibility(value)
                      setHasUnsavedChanges(true)
                    }}
                    disabled={isSaving}
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
                  <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50 border">
                    {visibility === "private" ? (
                      <>
                        <Lock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="text-xs text-muted-foreground">
                          <p className="font-medium mb-1">Private Organization</p>
                          <p>Only members can view and access organization mocks. Members must be invited to join.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div className="text-xs text-muted-foreground">
                          <p className="font-medium mb-1">Public Organization</p>
                          <p>Anyone can view public organization mocks. Members can still be invited for editing access.</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {errors.submit && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <p>{errors.submit}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  {hasUnsavedChanges && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      You have unsaved changes
                    </p>
                  )}
                  <Button type="submit" variant="gradient" disabled={isSaving || !hasUnsavedChanges}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Manage who has access to this organization
                  </CardDescription>
                </div>
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => setInviteDialogOpen(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {organization.members.length > 0 && (
                <div className="p-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search members by name or email..."
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              )}
              <div className="divide-y">
                {filteredMembers.length === 0 ? (
                  <div className="p-12 text-center">
                    {memberSearchQuery ? (
                      <>
                        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm font-medium mb-1">No members found</p>
                        <p className="text-xs text-muted-foreground">
                          Try adjusting your search query
                        </p>
                      </>
                    ) : (
                      <>
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm font-medium mb-1">No members yet</p>
                        <p className="text-xs text-muted-foreground mb-4">
                          Invite team members to collaborate on this organization
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInviteDialogOpen(true)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Invite First Member
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  filteredMembers.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getInitials(member.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{member.user.name}</p>
                            {member.role === "owner" && (
                              <Badge variant="default" className="text-xs">Owner</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.role === "owner" ? (
                          <Badge variant="default" className="text-xs">
                            Owner
                          </Badge>
                        ) : (
                          <>
                            <Select
                              value={member.role}
                              onValueChange={(value: "admin" | "member") =>
                                handleUpdateMemberRole(member.id, value)
                              }
                            >
                              <SelectTrigger className="w-[110px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveMemberClick(member)}
                              title="Remove member"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger Zone Tab */}
        {isOwner && (
          <TabsContent value="danger" className="space-y-6">
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium mb-1">Delete Organization</p>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete this organization and all its data. This action cannot be undone.
                      </p>
                      <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                        <li>All organization mocks will be deleted</li>
                        <li>All member associations will be removed</li>
                        <li>This action is permanent and cannot be reversed</li>
                      </ul>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                      className="ml-4 shrink-0"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Organization
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Remove Member Dialog */}
      <ConfirmationModal
        open={removeMemberDialogOpen}
        onOpenChange={(open) => {
          setRemoveMemberDialogOpen(open)
          if (!open) {
            setMemberToRemove(null)
          }
        }}
        title="Remove Member?"
        description={
          <>
            Are you sure you want to remove <strong>{memberToRemove?.name}</strong> ({memberToRemove?.email}) from this organization? 
            They will lose access to all organization mocks and will need to be re-invited to join again.
          </>
        }
        confirmText="Remove Member"
        cancelText="Cancel"
        onConfirm={handleRemoveMember}
        isLoading={isRemovingMember}
        variant="destructive"
      />

      {/* Delete Organization Dialog */}
      <ConfirmationModal
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Organization?"
        description={
          <>
            This action cannot be undone. This will permanently delete{" "}
            <strong>{organization.name}</strong> and all its mocks and member associations.
          </>
        }
        confirmText="Delete Organization"
        cancelText="Cancel"
        onConfirm={handleDeleteOrganization}
        isLoading={isDeleting}
        variant="destructive"
      />

      {/* Invite Member Modal */}
      {organization && (
        <Modal
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          title="Invite Member"
          description="Add a new member to this organization by email"
          maxWidth="sm"
          preventClose={isInviting}
        >
          <InviteMemberForm
            organizationId={organizationSlug}
            onSuccess={() => {
              setInviteDialogOpen(false)
              fetchOrganization() // Refresh organization data
            }}
            onCancel={() => {
              setInviteDialogOpen(false)
            }}
            isLoading={isInviting}
            setIsLoading={setIsInviting}
          />
        </Modal>
      )}
    </div>
  )
}

