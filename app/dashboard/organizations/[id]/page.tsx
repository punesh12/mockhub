"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Building2,
  Users,
  Settings,
  LogOut,
  Plus,
  Globe,
  Lock,
  ArrowLeft,
  Trash2,
  FileText,
  Download,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import ConfirmationModal from "@/components/shared/components/ConfirmationModal"
import MockCard from "@/components/shared/components/MockCard"
import ImportOpenApiModal from "@/components/organizations/ImportOpenApiModal"

interface Organization {
  id: string
  name: string
  slug: string
  description: string | null
  visibility: "private" | "public"
  ownerId: string
  createdAt: string
  userRole: "owner" | "admin" | "member" | null
  _count: {
    members: number
    mocks: number
  }
  owner: {
    id: string
    name: string
    email: string
  }
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

interface Mock {
  id: string
  name: string
  endpoint: string
  method: string
  responseCode: number
  createdAt: string
}

export default function OrganizationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const organizationSlug = params.id as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [mocks, setMocks] = useState<Mock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMocks, setIsLoadingMocks] = useState(true)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)

  useEffect(() => {
    // Fetch current user
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.id) {
          setCurrentUserId(data.user.id)
        }
      })
      .catch(console.error)

    if (organizationSlug) {
      fetchOrganization()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationSlug])

  // Fetch mocks when organization is loaded
  useEffect(() => {
    if (organization?.id) {
      fetchMocks()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id])

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
        throw new Error("Failed to fetch organization")
      }

      const data = await response.json()
      setOrganization(data.organization)
    } catch (error) {
      console.error("Error fetching organization:", error)
      toast.error("Failed to load organization")
      router.push("/dashboard/organizations")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMocks = async () => {
    if (!organization?.id) return // Wait for organization to load
    
    setIsLoadingMocks(true)
    try {
      const response = await fetch(
        `/api/mocks?organizationId=${organization.id}&limit=12`
      )
      if (!response.ok) {
        throw new Error("Failed to fetch mocks")
      }

      const data = await response.json()
      setMocks(data.mocks || [])
    } catch (error) {
      console.error("Error fetching mocks:", error)
      toast.error("Failed to load mocks")
    } finally {
      setIsLoadingMocks(false)
    }
  }

  const handleLeaveOrganization = async () => {
    if (!organization || !currentUserId) return

    setIsLeaving(true)
    try {
      // Find current user's member record
      const currentMember = organization.members.find(
        (m) => m.user.id === currentUserId
      )

      if (!currentMember) {
        toast.error("Member record not found")
        setIsLeaving(false)
        setLeaveDialogOpen(false)
        return
      }

      const response = await fetch(
        `/api/organizations/${organizationSlug}/members/${currentMember.id}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to leave organization")
      }

      toast.success("Left organization successfully")
      router.push("/dashboard/organizations")
    } catch (error) {
      console.error("Error leaving organization:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to leave organization"
      )
    } finally {
      setIsLeaving(false)
      setLeaveDialogOpen(false)
    }
  }

  const handleDeleteOrganization = async () => {
    if (!organization) return

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
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="flex items-start gap-4 flex-1">
          <Button variant="ghost" size="icon" asChild className="mt-1">
            <Link href="/dashboard/organizations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">
                {organization.name}
              </h1>
              <div className="flex items-center gap-2">
                {organization.visibility === "public" ? (
                  <Globe className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
                <Badge
                  variant={
                    organization.userRole === "owner"
                      ? "default"
                      : organization.userRole === "admin"
                        ? "secondary"
                        : "outline"
                  }
                  className="text-xs"
                >
                  {organization.userRole || "Viewer"}
                </Badge>
              </div>
            </div>
            {organization.description ? (
              <p className="text-muted-foreground mt-2">{organization.description}</p>
            ) : (
              <p className="text-muted-foreground mt-2 text-sm">
                Slug: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{organization.slug}</code>
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {canManage && (
            <Button asChild variant="outline" size="lg">
              <Link href={`/dashboard/organizations/${organizationSlug}/settings`}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          )}
          {isOwner && (
            <Button
              variant="destructive"
              size="lg"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
          {organization.userRole === "member" && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => setLeaveDialogOpen(true)}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Leave
            </Button>
          )}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization._count.members}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Team members in this organization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mock APIs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization._count.mocks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Mock APIs in this organization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visibility</CardTitle>
            {organization.visibility === "public" ? (
              <Globe className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {organization.visibility}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {organization.visibility === "public"
                ? "Anyone can view mocks"
                : "Only members can access"}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Organization Mocks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-4"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-semibold">Mock APIs</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage organization mock endpoints
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {organization._count.mocks > 0 && (
                <>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                  >
                    <Link
                      href={`/organizations/${organizationSlug}/docs`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View API Docs
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={async () => {
                      try {
                        const response = await fetch(
                          `/api/organizations/${organizationSlug}/openapi?format=json`
                        )
                        const blob = await response.blob()
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement("a")
                        a.href = url
                        a.download = `${organization.slug}-openapi.json`
                        document.body.appendChild(a)
                        a.click()
                        window.URL.revokeObjectURL(url)
                        document.body.removeChild(a)
                        toast.success("OpenAPI spec downloaded")
                      } catch (error) {
                        console.error("Error downloading OpenAPI spec:", error)
                        toast.error("Failed to download OpenAPI spec")
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download JSON
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={async () => {
                      try {
                        const response = await fetch(
                          `/api/organizations/${organizationSlug}/openapi?format=yaml`
                        )
                        const blob = await response.blob()
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement("a")
                        a.href = url
                        a.download = `${organization.slug}-openapi.yaml`
                        document.body.appendChild(a)
                        a.click()
                        window.URL.revokeObjectURL(url)
                        document.body.removeChild(a)
                        toast.success("OpenAPI spec downloaded")
                      } catch (error) {
                        console.error("Error downloading OpenAPI spec:", error)
                        toast.error("Failed to download OpenAPI spec")
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download YAML
                  </Button>
                </>
              )}
              {canManage && (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setImportModalOpen(true)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Import OpenAPI
                  </Button>
                  <Button asChild variant="gradient" size="lg">
                    <Link href={`/dashboard/mocks/new?organizationId=${organization?.id || ""}`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Mock
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {isLoadingMocks ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : mocks.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                >
                  <Building2 className="h-16 w-16 text-muted-foreground mb-6" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">No mocks yet</h3>
                <p className="text-muted-foreground text-center mb-8 max-w-md">
                  {canManage
                    ? "Create your first mock API for this organization"
                    : "No mock APIs have been created in this organization yet"}
                </p>
                {canManage && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button asChild variant="gradient" size="lg">
                      <Link href={`/dashboard/mocks/new?organizationId=${organization?.id || ""}`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Mock
                      </Link>
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {mocks.map((mock, index) => (
                <motion.div
                  key={mock.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <MockCard
                    mock={{
                      id: mock.id,
                      name: mock.name,
                      endpoint: mock.endpoint,
                      method: mock.method,
                      responseCode: mock.responseCode,
                      createdAt: mock.createdAt,
                    }}
                    onDelete={() => {
                      // Handle delete
                      fetchMocks()
                    }}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Members List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Members</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {organization._count.members} team member{organization._count.members !== 1 ? "s" : ""}
              </p>
            </div>
            {canManage && (
              <Button asChild variant="outline" size="lg">
                <Link href={`/dashboard/organizations/${organizationSlug}/settings`}>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Link>
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              {organization.members.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground text-center">
                    No members found
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {organization.members.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-primary">
                            {member.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{member.user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          member.role === "owner"
                            ? "default"
                            : member.role === "admin"
                              ? "secondary"
                              : "outline"
                        }
                        className="text-xs flex-shrink-0 ml-2"
                      >
                        {member.role}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Leave Organization Dialog */}
      <ConfirmationModal
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        title="Leave Organization?"
        description={
          <>
            Are you sure you want to leave <strong>{organization.name}</strong>? You will lose
            access to all organization mocks and will need to be re-invited to
            join again.
          </>
        }
        confirmText="Leave Organization"
        cancelText="Cancel"
        onConfirm={handleLeaveOrganization}
        isLoading={isLeaving}
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

      {/* Import OpenAPI Modal */}
      {organization && (
        <ImportOpenApiModal
          open={importModalOpen}
          onOpenChange={setImportModalOpen}
          organizationId={organization.id}
          organizationSlug={organizationSlug}
          onSuccess={() => {
            fetchMocks()
            fetchOrganization()
          }}
        />
      )}
    </div>
  )
}

