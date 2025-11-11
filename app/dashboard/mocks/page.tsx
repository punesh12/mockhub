"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Loader2,
  Zap,
  Plus,
  Download,
  Search,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { exportToJSON, formatMockForExport } from "@/lib/export-utils"
import SearchBar from "@/components/shared/components/SearchBar"
import FilterBadge from "@/components/shared/components/FilterBadge"
import MockCard, { type MockCardData } from "@/components/shared/components/MockCard"
import Pagination from "@/components/shared/components/Pagination"
import { Filter, ArrowUpDown, X } from "lucide-react"

interface Mock {
  id: string
  name: string
  endpoint: string
  method: string
  responseCode: number
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function MocksPage() {
  const router = useRouter()
  const [mocks, setMocks] = useState<Mock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchInput, setSearchInput] = useState("") // For debounced search
  const [methodFilter, setMethodFilter] = useState<string>("")
  const [statusCodeFilter, setStatusCodeFilter] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("createdAt")
  const [sortOrder, setSortOrder] = useState<string>("desc")
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [mockToDelete, setMockToDelete] = useState<Mock | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const mocksRef = useRef<Mock[]>([])

  // Debounce search input - handled by SearchBar component
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [searchQuery])

  useEffect(() => {
    fetchMocks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pagination.page,
    searchQuery,
    methodFilter,
    statusCodeFilter,
    sortBy,
    sortOrder,
  ])

  const fetchMocks = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("page", pagination.page.toString())
      params.append("limit", pagination.limit.toString())
      if (searchQuery) params.append("search", searchQuery)
      if (methodFilter) params.append("method", methodFilter)
      if (statusCodeFilter) params.append("statusCode", statusCodeFilter)
      params.append("sortBy", sortBy)
      params.append("sortOrder", sortOrder)

      const response = await fetch(`/api/mocks?${params.toString()}`)
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/auth/login")
          return
        }
        throw new Error("Failed to fetch mocks")
      }
      const data = await response.json()
      const mocksData = data.mocks || []
      setMocks(mocksData)
      mocksRef.current = mocksData
      if (data.pagination) {
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error("Error fetching mocks:", error)
      toast.error("Failed to fetch mocks")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchInputChange = useCallback((value: string) => {
    setSearchInput(value) // Update input immediately for responsive UI
  }, [])

  const handleSearchQueryChange = useCallback((value: string) => {
    setSearchQuery(value)
  }, [])

  const handleMethodFilterChange = useCallback((value: string) => {
    setMethodFilter(value)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [])

  const handleStatusCodeFilterChange = useCallback((value: string) => {
    setStatusCodeFilter(value)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [])

  const handleSortChange = useCallback((by: string, order: string) => {
    setSortBy(by)
    setSortOrder(order)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [])

  const clearFilters = useCallback(() => {
    setMethodFilter("")
    setStatusCodeFilter("")
    setSearchInput("")
    setSearchQuery("")
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [])

  const hasActiveFilters = useMemo(
    () => !!(methodFilter || statusCodeFilter || searchQuery || searchInput),
    [methodFilter, statusCodeFilter, searchQuery, searchInput]
  )

  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }, [])

  const handleExport = useCallback(() => {
    const formattedData = mocksRef.current.map(formatMockForExport)
    exportToJSON(
      formattedData,
      `mocks-${new Date().toISOString().split("T")[0]}`
    )
    toast.success("Mocks exported to JSON")
  }, [])

  const handleDeleteClick = useCallback((mock: MockCardData) => {
    setMockToDelete(mock as Mock)
    setDeleteDialogOpen(true)
  }, [])

  const handleDeleteConfirm = async () => {
    if (!mockToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/mocks/${mockToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete mock")
      }

      // Refresh the list
      await fetchMocks()
      setDeleteDialogOpen(false)
      setMockToDelete(null)
      toast.success("Mock API deleted successfully")
    } catch (error) {
      console.error("Error deleting mock:", error)
      toast.error("Failed to delete mock. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCardEdit = useCallback((mockId: string) => {
    router.push(`/dashboard/mocks/${mockId}/edit`)
  }, [router])

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        
        {/* Cards Skeleton */}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="border">
              <CardContent className="p-3 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-5 w-10 rounded" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-4 w-10 rounded" />
                  <Skeleton className="h-3 flex-1" />
                  <Skeleton className="h-5 w-5 rounded" />
                </div>
                <div className="flex justify-between pt-0.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-5 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mock APIs</h1>
          <p className="text-muted-foreground mt-1">
            Manage your mock endpoints
          </p>
        </div>
        <div className="flex gap-2">
          {mocks.length > 0 && (
            <Button
              variant="outline"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          )}
          <Button asChild variant="gradient">
            <Link
              href="/dashboard/mocks/new"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Mock API
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      {(pagination.total > 0 || hasActiveFilters) && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center">
            {/* Search */}
            <SearchBar
              placeholder="Search mocks by name or endpoint..."
              value={searchInput}
              onChange={handleSearchInputChange}
              onDebounce={handleSearchQueryChange}
              debounceMs={500}
            />

            {/* Filters */}
            <div className="flex gap-2">
              <Select
                value={methodFilter || "all"}
                onValueChange={(value) =>
                  handleMethodFilterChange(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusCodeFilter || "all"}
                onValueChange={(value) =>
                  handleStatusCodeFilterChange(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="200">200 - OK</SelectItem>
                  <SelectItem value="201">201 - Created</SelectItem>
                  <SelectItem value="400">400 - Bad Request</SelectItem>
                  <SelectItem value="401">401 - Unauthorized</SelectItem>
                  <SelectItem value="404">404 - Not Found</SelectItem>
                  <SelectItem value="500">500 - Server Error</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(value) => {
                  const [by, order] = value.split("-")
                  handleSortChange(by, order)
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="method-asc">Method (A-Z)</SelectItem>
                  <SelectItem value="method-desc">Method (Z-A)</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters Badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">
                Active filters:
              </span>
              {methodFilter && (
                <FilterBadge
                  label="Method"
                  value={methodFilter}
                  onRemove={() => handleMethodFilterChange("")}
                />
              )}
              {statusCodeFilter && (
                <FilterBadge
                  label="Status"
                  value={statusCodeFilter}
                  onRemove={() => handleStatusCodeFilterChange("")}
                />
              )}
              {searchQuery && (
                <FilterBadge
                  label="Search"
                  value={searchQuery}
                  onRemove={() => {
                    setSearchInput("")
                    setSearchQuery("")
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && pagination.total === 0 && !hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              >
                <Zap className="h-16 w-16 text-primary/50 mb-6" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">No mock APIs yet</h3>
              <p className="text-muted-foreground text-center mb-8 max-w-md">
                Create your first mock API to get started. Mock APIs allow you to simulate backend responses for testing and development.
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button asChild variant="gradient" size="lg">
                  <Link
                    href="/dashboard/mocks/new"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-5 w-5" />
                    Create Your First Mock API
                  </Link>
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Mocks List */}
      {mocks.length > 0 && (
        <>
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mocks.map((mock, index) => (
              <MockCard
                key={mock.id}
                mock={mock as MockCardData}
                index={index}
                onDelete={handleDeleteClick}
                onEdit={handleCardEdit}
              />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            isLoading={isLoading}
            onPageChange={handlePageChange}
            itemLabel="mocks"
          />
        </>
      )}

      {/* No Results */}
      {!isLoading && mocks.length === 0 && hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
              >
                <Search className="h-16 w-16 text-muted-foreground mb-6" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground text-center mb-8 max-w-md">
                We couldn&apos;t find any mocks matching your search criteria. Try adjusting your filters or search query.
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" size="lg" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear all filters
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mock API?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{mockToDelete?.name}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
