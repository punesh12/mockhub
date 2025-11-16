"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import StatusBadge from "@/components/shared/components/StatusBadge"
import SearchBar from "@/components/shared/components/SearchBar"
import StatCard from "@/components/shared/components/StatCard"
import FilterBadge from "@/components/shared/components/FilterBadge"
import { getMethodColor } from "@/lib/method-utils"
import Modal from "@/components/shared/components/Modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import ConfirmationModal from "@/components/shared/components/ConfirmationModal"
import {
  Loader2,
  RefreshCw,
  Clock,
  Globe,
  Filter,
  X,
  Eye,
  Trash2,
  TrendingUp,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Download,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  exportToJSON,
  exportToCSV,
  formatHistoryForExport,
} from "@/lib/export-utils"
import { ResponseTimeChart } from "@/components/charts/response-time-chart"
import { StatusCodeChart } from "@/components/charts/status-code-chart"
import { RequestVolumeChart } from "@/components/charts/request-volume-chart"

interface HistoryItem {
  id: string
  url: string
  method: string
  status: number
  responseTime: number
  responseBody?: unknown
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface Statistics {
  total: number
  successRate: number
  avgResponseTime: number
  successCount: number
  errorCount: number
}

interface ChartResponseTimeData {
  date: string
  avgResponseTime: number
  minResponseTime: number
  maxResponseTime: number
}

interface ChartRequestVolumeData {
  date: string
  requests: number
  successful: number
  failed: number
}

interface ChartStatusCodeData {
  status: string
  count: number
}

export default function HistoryPage() {
  const router = useRouter()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [chartData, setChartData] = useState<{
    responseTime: ChartResponseTimeData[]
    requestVolume: ChartRequestVolumeData[]
    statusCode: ChartStatusCodeData[]
  } | null>(null)
  const [isLoadingCharts, setIsLoadingCharts] = useState(true)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [methodFilter, setMethodFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [sortBy, setSortBy] = useState<string>("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Modal states
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchHistory()
  }, [// eslint-disable-line react-hooks/exhaustive-deps
    pagination.page,
    methodFilter,
    statusFilter,
    searchQuery,
    sortBy,
    sortOrder,
    startDate,
    endDate,
  ])

  useEffect(() => {
    fetchChartData()
  }, [])// eslint-disable-line react-hooks/exhaustive-deps

  const fetchHistory = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      })

      if (methodFilter !== "all") {
        params.append("method", methodFilter)
      }

      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }

      if (searchQuery) {
        params.append("search", searchQuery)
      }

      if (startDate) {
        params.append("startDate", startDate)
      }

      if (endDate) {
        params.append("endDate", endDate)
      }

      const response = await fetch(`/api/history?${params.toString()}`)
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/auth/login")
          return
        }
        throw new Error("Failed to fetch history")
      }
      const data = await response.json()
      setHistory(data.history || [])
      setPagination(data.pagination || pagination)
      if (data.statistics) {
        setStatistics(data.statistics)
      }
    } catch (error) {
      console.error("Error fetching history:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchChartData = async () => {
    setIsLoadingCharts(true)
    try {
      const response = await fetch("/api/history/charts")
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/auth/login")
          return
        }
        throw new Error("Failed to fetch chart data")
      }
      const data = await response.json()
      setChartData(data)
    } catch (error) {
      console.error("Error fetching chart data:", error)
    } finally {
      setIsLoadingCharts(false)
    }
  }

  const handleRetry = async (item: HistoryItem) => {
    router.push(
      `/dashboard/test?url=${encodeURIComponent(item.url)}&method=${item.method}`
    )
  }

  const handleViewDetails = (item: HistoryItem) => {
    setSelectedItem(item)
    setViewDetailsOpen(true)
  }

  const handleDeleteClick = (item: HistoryItem) => {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/history/${itemToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete history item")
      }

      // Remove from list
      setHistory(history.filter((h) => h.id !== itemToDelete.id))
      setDeleteDialogOpen(false)
      setItemToDelete(null)

      // Update pagination total
      setPagination((prev) => ({
        ...prev,
        total: prev.total - 1,
      }))
      toast.success("History item deleted successfully")
    } catch (error) {
      console.error("Error deleting history item:", error)
      toast.error("Failed to delete history item. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const highlightJSON = (json: string): React.ReactNode => {
    if (!json) return null

    let formattedJson = json
    try {
      const parsed = JSON.parse(json)
      formattedJson = JSON.stringify(parsed, null, 2)
    } catch {
      return <span className="text-foreground">{json}</span>
    }

    const parts: React.ReactNode[] = []
    let i = 0

    while (i < formattedJson.length) {
      if (formattedJson[i] === '"') {
        const start = i
        i++
        while (i < formattedJson.length) {
          if (formattedJson[i] === "\\" && i + 1 < formattedJson.length) {
            i += 2
          } else if (formattedJson[i] === '"') {
            i++
            break
          } else {
            i++
          }
        }
        const stringContent = formattedJson.substring(start, i)
        const isKey =
          i < formattedJson.length &&
          formattedJson.substring(i).trim().startsWith(":")
        const colorClass = isKey
          ? "text-blue-600 dark:text-blue-400"
          : "text-green-600 dark:text-green-400"
        parts.push(
          <span key={`str-${start}`} className={colorClass}>
            {stringContent}
          </span>
        )
        continue
      }

      if (/[\d-]/.test(formattedJson[i])) {
        const start = i
        if (formattedJson[i] === "-") i++
        while (i < formattedJson.length && /[\d.]/.test(formattedJson[i])) {
          i++
        }
        const numberContent = formattedJson.substring(start, i)
        parts.push(
          <span
            key={`num-${start}`}
            className="text-orange-600 dark:text-orange-400"
          >
            {numberContent}
          </span>
        )
        continue
      }

      if (formattedJson.substring(i).startsWith("true")) {
        parts.push(
          <span
            key={`bool-${i}`}
            className="text-purple-600 dark:text-purple-400"
          >
            true
          </span>
        )
        i += 4
        continue
      }
      if (formattedJson.substring(i).startsWith("false")) {
        parts.push(
          <span
            key={`bool-${i}`}
            className="text-purple-600 dark:text-purple-400"
          >
            false
          </span>
        )
        i += 5
        continue
      }
      if (formattedJson.substring(i).startsWith("null")) {
        parts.push(
          <span
            key={`null-${i}`}
            className="text-purple-600 dark:text-purple-400"
          >
            null
          </span>
        )
        i += 4
        continue
      }

      const char = formattedJson[i]
      const isPunctuation = /[{}[\],:]/.test(char)
      parts.push(
        <span
          key={`char-${i}`}
          className={
            isPunctuation ? "text-muted-foreground" : "text-foreground"
          }
        >
          {char}
        </span>
      )
      i++
    }

    return <>{parts}</>
  }

  const formatResponseBody = (data: unknown): string => {
    if (!data) return ""
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }

  const hasActiveFilters =
    methodFilter !== "all" ||
    statusFilter !== "all" ||
    searchQuery ||
    startDate ||
    endDate

  const clearFilters = () => {
    setMethodFilter("all")
    setStatusFilter("all")
    setSearchQuery("")
    setStartDate("")
    setEndDate("")
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  if (isLoading && history.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Request History</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your API request history
          </p>
        </div>
        {history.length > 0 && (
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    const formattedData = history.map(formatHistoryForExport)
                    exportToJSON(
                      formattedData,
                      `request-history-${new Date().toISOString().split("T")[0]}`
                    )
                    toast.success("History exported to JSON")
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const formattedData = history.map(formatHistoryForExport)
                    exportToCSV(
                      formattedData,
                      `request-history-${new Date().toISOString().split("T")[0]}`
                    )
                    toast.success("History exported to CSV")
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Requests"
            value={statistics.total}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <StatCard
            title="Success Rate"
            value={`${statistics.successRate}%`}
            icon={<CheckCircle2 className="h-4 w-4" />}
            description={`${statistics.successCount} successful`}
            iconClassName="text-green-600"
          />
          <StatCard
            title="Avg Response Time"
            value={`${statistics.avgResponseTime}ms`}
            icon={<Clock className="h-4 w-4" />}
          />
          <StatCard
            title="Errors"
            value={statistics.errorCount}
            icon={<XCircle className="h-4 w-4" />}
            iconClassName="text-red-600"
          />
        </div>
      )}

      {/* Charts */}
      {isLoadingCharts ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Response Time</CardTitle>
              <CardDescription>Average response time over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Status Code Distribution</CardTitle>
              <CardDescription>
                Distribution of HTTP status codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        chartData && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <ResponseTimeChart data={chartData.responseTime} />
              <StatusCodeChart data={chartData.statusCode} />
            </div>
            <RequestVolumeChart data={chartData.requestVolume} />
          </div>
        )
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search URL</Label>
              <SearchBar
                placeholder="Search by URL..."
                value={searchQuery}
                onChange={(value) => {
                  setSearchQuery(value)
                  setPagination((prev) => ({ ...prev, page: 1 }))
                }}
              />
            </div>

            {/* Method Filter */}
            <div className="space-y-2">
              <Label htmlFor="method">HTTP Method</Label>
              <Select
                value={methodFilter}
                onValueChange={(value) => {
                  setMethodFilter(value)
                  setPagination((prev) => ({ ...prev, page: 1 }))
                }}
              >
                <SelectTrigger id="method">
                  <SelectValue />
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
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status">Status Code</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value)
                  setPagination((prev) => ({ ...prev, page: 1 }))
                }}
              >
                <SelectTrigger id="status">
                  <SelectValue />
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
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setPagination((prev) => ({ ...prev, page: 1 }))
                }}
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setPagination((prev) => ({ ...prev, page: 1 }))
                }}
              />
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <Label htmlFor="sort">Sort By</Label>
              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(value) => {
                  const [field, order] = value.split("-")
                  setSortBy(field)
                  setSortOrder(order as "asc" | "desc")
                }}
              >
                <SelectTrigger id="sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  <SelectItem value="responseTime-desc">
                    Slowest First
                  </SelectItem>
                  <SelectItem value="responseTime-asc">
                    Fastest First
                  </SelectItem>
                  <SelectItem value="status-desc">
                    Status (High to Low)
                  </SelectItem>
                  <SelectItem value="status-asc">
                    Status (Low to High)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Filters Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {methodFilter !== "all" && (
            <FilterBadge
              label="Method"
              value={methodFilter}
              onRemove={() => {
                setMethodFilter("all")
                setPagination((prev) => ({ ...prev, page: 1 }))
              }}
            />
          )}
          {statusFilter !== "all" && (
            <FilterBadge
              label="Status"
              value={statusFilter}
              onRemove={() => {
                setStatusFilter("all")
                setPagination((prev) => ({ ...prev, page: 1 }))
              }}
            />
          )}
          {searchQuery && (
            <FilterBadge
              label="Search"
              value={searchQuery}
              onRemove={() => {
                setSearchQuery("")
                setPagination((prev) => ({ ...prev, page: 1 }))
              }}
            />
          )}
          {startDate && (
            <FilterBadge
              label="Start"
              value={startDate}
              isDate={true}
              onRemove={() => {
                setStartDate("")
                setPagination((prev) => ({ ...prev, page: 1 }))
              }}
            />
          )}
          {endDate && (
            <FilterBadge
              label="End"
              value={endDate}
              isDate={true}
              onRemove={() => {
                setEndDate("")
                setPagination((prev) => ({ ...prev, page: 1 }))
              }}
            />
          )}
        </div>
      )}

      {/* History Table */}
      {history.length === 0 && !isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No request history</h3>
            <p className="text-muted-foreground text-center mb-6">
              {hasActiveFilters
                ? "No requests match your filters. Try adjusting your search criteria."
                : "Start testing APIs to see your request history here"}
            </p>
            {!hasActiveFilters && (
              <Button asChild variant="gradient">
                <a href="/dashboard/test">Test API</a>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Request History</CardTitle>
                <CardDescription>
                  Showing {history.length} of {pagination.total} requests
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <TableRow
                      key={item.id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <TableCell>
                        <Badge className={getMethodColor(item.method)}>
                          {item.method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 max-w-md">
                          <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span
                            className="font-mono text-sm truncate"
                            title={item.url}
                          >
                            {item.url}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {item.responseTime.toFixed(0)}ms
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(item)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRetry(item)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Retry Request
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleDeleteClick(item)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }))
                    }
                    disabled={pagination.page === 1 || isLoading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }))
                    }
                    disabled={
                      pagination.page >= pagination.totalPages || isLoading
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* View Details Modal */}
      <Modal
        open={viewDetailsOpen}
        onOpenChange={setViewDetailsOpen}
        title="Request Details"
        description="View full request and response information"
        maxWidth="xl"
      >
        {selectedItem && (
            <Tabs defaultValue="request" className="w-full">
              <TabsList>
                <TabsTrigger value="request">Request</TabsTrigger>
                <TabsTrigger value="response">Response</TabsTrigger>
              </TabsList>
              <TabsContent value="request" className="space-y-4">
                <div className="space-y-2">
                  <Label>Method</Label>
                  <div>
                    <Badge className={getMethodColor(selectedItem.method)}>
                      {selectedItem.method}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>URL</Label>
                  <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                    {selectedItem.url}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <div className="text-sm text-muted-foreground">
                    {new Date(selectedItem.createdAt).toLocaleString()}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="response" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status Code</Label>
                    <div>
                      <StatusBadge status={selectedItem.status} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Response Time</Label>
                    <div className="text-sm">
                      {selectedItem.responseTime.toFixed(2)} ms
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Response Body</Label>
                  <div className="p-3 bg-muted rounded-md max-h-[400px] overflow-auto">
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {selectedItem.responseBody ? (
                        highlightJSON(
                          formatResponseBody(selectedItem.responseBody)
                        )
                      ) : (
                        <span className="text-muted-foreground">
                          No response body
                        </span>
                      )}
                    </pre>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Request History?"
        description="Are you sure you want to delete this request from your history? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  )
}
