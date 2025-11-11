"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  /**
   * Current page number (1-indexed)
   */
  page: number
  /**
   * Total number of pages
   */
  totalPages: number
  /**
   * Total number of items
   */
  total: number
  /**
   * Number of items per page
   */
  limit: number
  /**
   * Whether data is currently loading
   */
  isLoading?: boolean
  /**
   * Callback when page changes
   */
  onPageChange: (page: number) => void
  /**
   * Label for the items (e.g., "mocks", "requests", "items")
   * @default "items"
   */
  itemLabel?: string
  /**
   * Maximum number of page buttons to show
   * @default 5
   */
  maxPageButtons?: number
}

const Pagination = React.memo(({
  page,
  totalPages,
  total,
  limit,
  isLoading = false,
  onPageChange,
  itemLabel = "items",
  maxPageButtons = 5,
}: PaginationProps) => {
  if (totalPages <= 1) return null

  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {total} {itemLabel}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1 || isLoading}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <div className="flex items-center gap-1">
          {Array.from(
            { length: Math.min(maxPageButtons, totalPages) },
            (_, i) => {
              let pageNum: number
              if (totalPages <= maxPageButtons) {
                pageNum = i + 1
              } else if (page <= Math.ceil(maxPageButtons / 2)) {
                pageNum = i + 1
              } else if (page >= totalPages - Math.floor(maxPageButtons / 2)) {
                pageNum = totalPages - maxPageButtons + 1 + i
              } else {
                pageNum = page - Math.floor(maxPageButtons / 2) + i
              }
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
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
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isLoading}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
})

Pagination.displayName = "Pagination"

export default Pagination

