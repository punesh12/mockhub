"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Loader2,
  Plus,
  Zap,
  Search,
  Edit,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  MoreVertical,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { exportToJSON, formatMockForExport } from "@/lib/export-utils"

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
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
      setPagination((prev) => ({ ...prev, page: 1 }))
    }, 500) // 500ms debounce

    return () => clearTimeout(timer)
  }, [searchInput])

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
      setMocks(data.mocks || [])
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

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value) // Update input immediately for responsive UI
  }

  const handleFilterChange = (
    filterType: "method" | "statusCode",
    value: string
  ) => {
    if (filterType === "method") {
      setMethodFilter(value)
    } else {
      setStatusCodeFilter(value)
    }
    setPagination((prev) => ({ ...prev, page: 1 })) // Reset to page 1 on filter change
  }

  const clearFilters = () => {
    setMethodFilter("")
    setStatusCodeFilter("")
    setSearchInput("")
    setSearchQuery("")
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const hasActiveFilters =
    methodFilter || statusCodeFilter || searchQuery || searchInput

  const handleDeleteClick = (mock: Mock, e: React.MouseEvent) => {
    e.stopPropagation()
    setMockToDelete(mock)
    setDeleteDialogOpen(true)
  }

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
      fetchMocks()
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

  const handleCopyUrl = async (mock: Mock, e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `${window.location.origin}/api${mock.endpoint}`
    await navigator.clipboard.writeText(url)
    setCopiedUrl(mock.id)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const handleOpenUrl = (mock: Mock, e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `${window.location.origin}/api${mock.endpoint}`
    window.open(url, "_blank")
  }

  const handleCardClick = (mockId: string) => {
    router.push(`/dashboard/mocks/${mockId}/edit`)
  }

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
              onClick={() => {
                const formattedData = mocks.map(formatMockForExport)
                exportToJSON(
                  formattedData,
                  `mocks-${new Date().toISOString().split("T")[0]}`
                )
                toast.success("Mocks exported to JSON")
              }}
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
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search mocks by name or endpoint..."
                value={searchInput}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select
                value={methodFilter || "all"}
                onValueChange={(value) =>
                  handleFilterChange("method", value === "all" ? "" : value)
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
                  handleFilterChange("statusCode", value === "all" ? "" : value)
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
                  setSortBy(by)
                  setSortOrder(order)
                  setPagination((prev) => ({ ...prev, page: 1 }))
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
                <Badge variant="secondary" className="gap-1">
                  Method: {methodFilter}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleFilterChange("method", "")}
                  />
                </Badge>
              )}
              {statusCodeFilter && (
                <Badge variant="secondary" className="gap-1">
                  Status: {statusCodeFilter}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleFilterChange("statusCode", "")}
                  />
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => {
                      setSearchInput("")
                      setSearchQuery("")
                    }}
                  />
                </Badge>
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
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mocks.map((mock, index) => (
              <motion.div
                key={mock.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -2 }}
                className="h-full"
              >
                <Card 
                  className="hover:border-primary transition-all duration-200 cursor-pointer group relative overflow-hidden border h-full flex flex-col hover:shadow-sm"
                  onClick={() => handleCardClick(mock.id)}
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  
                  <CardContent className="relative z-10 p-3 flex flex-col gap-2">
                    {/* Top Row: Name + Status */}
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm font-semibold group-hover:text-primary transition-colors truncate flex-1 leading-tight">
                        {mock.name}
                      </CardTitle>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 leading-none ${
                          mock.responseCode === 200
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : mock.responseCode >= 400
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        }`}
                      >
                        {mock.responseCode}
                      </span>
                    </div>

                    {/* Middle Row: Method + Endpoint + Copy */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-semibold text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase shrink-0">
                        {mock.method}
                      </span>
                      <code className="text-[11px] font-mono text-muted-foreground truncate flex-1 min-w-0">
                        /api{mock.endpoint}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopyUrl(mock, e)
                        }}
                        className="h-5 w-5 p-0 hover:bg-primary/10 shrink-0"
                        title={`Copy: ${typeof window !== "undefined" ? `${window.location.origin}/api${mock.endpoint}` : ""}`}
                      >
                        {copiedUrl === mock.id ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>

                    {/* Bottom Row: Date + Actions */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <p className="text-[10px] text-muted-foreground leading-none">
                        {new Date(mock.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/dashboard/mocks/${mock.id}/edit`)
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCopyUrl(mock, e)
                              }}
                            >
                              {copiedUrl === mock.id ? (
                                <>
                                  <Check className="h-4 w-4 mr-2 text-green-600" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy URL
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenUrl(mock, e)
                              }}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open in new tab
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteClick(mock, e)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} mocks
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={pagination.page === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      let pageNum: number
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i
                      } else {
                        pageNum = pagination.page - 2 + i
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pagination.page === pageNum ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            setPagination((prev) => ({
                              ...prev,
                              page: pageNum,
                            }))
                          }
                          disabled={isLoading}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      )
                    }
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={
                    pagination.page === pagination.totalPages || isLoading
                  }
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
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
