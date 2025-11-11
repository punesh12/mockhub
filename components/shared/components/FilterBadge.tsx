"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilterBadgeProps {
  /**
   * Label for the filter (e.g., "Method", "Status", "Search")
   */
  label: string
  /**
   * Value to display (e.g., "GET", "201", search query)
   */
  value: string
  /**
   * Callback function when the badge is removed
   */
  onRemove: () => void
  /**
   * Optional className for the badge
   */
  className?: string
  /**
   * Maximum length for value before truncation
   * @default 20
   */
  maxLength?: number
  /**
   * Whether to format the value as a date
   * @default false
   */
  isDate?: boolean
}

const FilterBadge = ({
  label,
  value,
  onRemove,
  className,
  maxLength = 20,
  isDate = false,
}: FilterBadgeProps) => {
  const displayValue = React.useMemo(() => {
    if (isDate && value) {
      return new Date(value).toLocaleDateString()
    }
    if (value.length > maxLength) {
      return `${value.substring(0, maxLength)}...`
    }
    return value
  }, [value, maxLength, isDate])

  return (
    <Badge variant="secondary" className={cn("gap-1", className)}>
      {label}: {displayValue}
      <X
        className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors"
        onClick={onRemove}
      />
    </Badge>
  )
}

export default FilterBadge

