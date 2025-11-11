"use client"

import * as React from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CopyButtonProps {
  text: string
  className?: string
  size?: "sm" | "lg" | "icon"
  variant?: "ghost" | "outline" | "default"
  showText?: boolean
  iconClassName?: string
  onCopy?: () => void
}

const CopyButton = ({
  text,
  className,
  size = "sm",
  variant = "ghost",
  showText = false,
  iconClassName,
  onCopy,
}: CopyButtonProps) => {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      onCopy?.()
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const sizeClasses = {
    sm: "h-5 w-5 p-0",
    icon: "h-8 w-8 p-0",
    lg: "h-10 w-10 p-0",
  }

  const iconSizes = {
    sm: "h-3 w-3",
    icon: "h-4 w-4",
    lg: "h-5 w-5",
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn(sizeClasses[size], "cursor-pointer", className)}
      title={`Copy: ${text}`}
    >
      {copied ? (
        <Check className={cn(iconSizes[size], "text-green-600", iconClassName)} />
      ) : (
        <Copy className={cn(iconSizes[size], iconClassName)} />
      )}
      {showText && (
        <span className="ml-2">
          {copied ? "Copied!" : "Copy"}
        </span>
      )}
    </Button>
  )
}

export default CopyButton

