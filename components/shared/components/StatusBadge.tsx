"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: number
  statusText?: string
  className?: string
}

const getStatusColorClasses = (code: number): string => {
  // Success: 2xx
  if (code >= 200 && code < 300) {
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
  }
  // Warning: 3xx
  if (code >= 300 && code < 400) {
    return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
  }
  // Error: 4xx/5xx (treat both as error)
  if (code >= 400) {
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
  }
  // Fallback/Informational: 1xx and others
  return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
}

const StatusBadge = ({
  status,
  statusText,
  className,
}: StatusBadgeProps) => {
  // Square with rounded rectangle style
  const baseClasses =
    "rounded-md h-6 px-2 text-xs font-semibold leading-none inline-flex items-center justify-center min-w-[2.25rem]"
  const colorClasses = getStatusColorClasses(status)

  return (
    <Badge
      variant="outline"
      className={cn(baseClasses, colorClasses, className)}
      aria-label={`Status ${status}${statusText ? ` ${statusText}` : ""}`}
    >
      {status} {statusText}
    </Badge>
  )
}

export default StatusBadge

