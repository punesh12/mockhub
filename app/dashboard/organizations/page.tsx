"use client"

import FilterBadge from "@/components/shared/components/FilterBadge"
import Pagination from "@/components/shared/components/Pagination"
import SearchBar from "@/components/shared/components/SearchBar"
import CreateOrganizationModal from "@/components/organizations/CreateOrganizationModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { Building2, Globe, Lock, Plus, Users } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"

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
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  })

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setPagination((prev) => ({ ...prev, page: 1 }))
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    fetchOrganizations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, debouncedSearchQuery, visibilityFilter, roleFilter])

  const fetchOrganizations = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
        ...(visibilityFilter !== "all" && { visibility: visibilityFilter }),
      })

      const response = await fetch(`/api/organizations?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch organizations")
      }

      const data = await response.json()
      const fetchedOrganizations = data.organizations || []
      setOrganizations(fetchedOrganizations)
      
      // Calculate pagination based on filtered results if role filter is active
      // Note: This is approximate since role filter is client-side
      const baseTotal = data.pagination?.total || 0
      setPagination((prev) => ({
        ...prev,
        total: baseTotal,
        totalPages: data.pagination?.totalPages || 0,
      }))
    } catch (error) {
      console.error("Error fetching organizations:", error)
      toast.error("Failed to load organizations")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    // Don't reset page here - let the debounce effect handle it
  }

  const handleVisibilityFilterChange = (value: string) => {
    setVisibilityFilter(value)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const clearFilters = () => {
    setSearchQuery("")
    setVisibilityFilter("all")
    setRoleFilter("all")
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const hasActiveFilters =
    debouncedSearchQuery !== "" || visibilityFilter !== "all" || roleFilter !== "all"

  // Filter organizations by role (client-side since API doesn't support it yet)
  const filteredOrganizations = organizations.filter((org) => {
    if (roleFilter === "all") return true
    if (roleFilter === "owner") return org.userRole === "owner"
    if (roleFilter === "admin") return org.userRole === "admin"
    if (roleFilter === "member") return org.userRole === "member"
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground mt-1">
            Manage your teams and shared mock APIs
          </p>
        </div>
        <Button
          variant="gradient"
          size="lg"
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Organization
        </Button>
      </div>

      {/* Filters */}
      {(pagination.total > 0 || hasActiveFilters) && (
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchBar
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={handleSearchChange}
            />

            <div className="flex gap-2">
              <Select
                value={visibilityFilter}
                onValueChange={handleVisibilityFilterChange}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Visibility</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="My Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {debouncedSearchQuery && (
                <FilterBadge
                  label="Search"
                  value={debouncedSearchQuery}
                  onRemove={() => handleSearchChange("")}
                />
              )}
              {visibilityFilter !== "all" && (
                <FilterBadge
                  label="Visibility"
                  value={visibilityFilter}
                  onRemove={() => handleVisibilityFilterChange("all")}
                />
              )}
              {roleFilter !== "all" && (
                <FilterBadge
                  label="Role"
                  value={roleFilter}
                  onRemove={() => handleRoleFilterChange("all")}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex gap-2 mb-4">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredOrganizations.length === 0 ? (
        /* Empty State */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {hasActiveFilters
                ? "No organizations found"
                : "No organizations yet"}
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {hasActiveFilters
                ? "Try adjusting your filters to see more results"
                : "Create your first organization to start collaborating with your team"}
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : (
              <Button
                variant="gradient"
                onClick={() => setCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Organization
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Organizations Grid */
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrganizations.map((org, index) => (
              <motion.div
                key={org.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/dashboard/organizations/${org.slug}`}>
                  <Card className="h-full hover:border-primary transition-all duration-200 cursor-pointer group">
                    <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                          {org.name}
                        </h3>
                        {org.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {org.description}
                          </p>
                        )}
                      </div>
                      {org.visibility === "public" ? (
                        <Globe className="h-5 w-5 text-muted-foreground shrink-0 ml-2" />
                      ) : (
                        <Lock className="h-5 w-5 text-muted-foreground shrink-0 ml-2" />
                      )}
                    </div>

                    <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{org._count.members} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        <span>{org._count.mocks} mocks</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          org.userRole === "owner"
                            ? "default"
                            : org.userRole === "admin"
                              ? "secondary"
                              : "outline"
                        }
                        className="text-xs"
                      >
                        {org.userRole || "Viewer"}
                      </Badge>
                      {org.visibility === "public" && (
                        <Badge variant="outline" className="text-xs">
                          Public
                        </Badge>
                      )}
                    </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.total > 1 && (
            <Pagination
              page={pagination.page}
              limit={pagination.limit}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
            />
          )}
        </>
      )}

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={() => {
          // Refresh organizations list
          fetchOrganizations()
        }}
      />
    </div>
  )
}

