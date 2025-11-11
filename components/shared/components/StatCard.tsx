"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  /**
   * Title of the statistic card
   */
  title: string
  /**
   * Main value to display
   */
  value: string | number
  /**
   * Icon to display in the header
   */
  icon: React.ReactNode
  /**
   * Optional description text below the value
   */
  description?: string
  /**
   * Optional className for the card
   */
  className?: string
  /**
   * Optional className for the icon
   */
  iconClassName?: string
}

const StatCard = ({
  title,
  value,
  icon,
  description,
  className,
  iconClassName,
}: StatCardProps) => {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("h-4 w-4 text-muted-foreground", iconClassName)}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

export default StatCard

