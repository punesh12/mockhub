"use client"

import Link from "next/link"
import { Zap } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface MockHubLogoProps {
  /**
   * Whether to show the text "MockHub" next to the icon
   * @default true
   */
  showText?: boolean
  /**
   * Size variant of the logo
   * @default "default"
   */
  size?: "sm" | "default" | "lg"
  /**
   * Whether the logo is clickable (wraps in Link)
   * @default true
   */
  clickable?: boolean
  /**
   * URL to navigate to when clicked
   * @default "/" for clickable, undefined for non-clickable
   */
  href?: string
  /**
   * Additional className for the container
   */
  className?: string
  /**
   * Additional className for the text
   */
  textClassName?: string
  /**
   * Whether to show hover animations
   * @default true
   */
  animated?: boolean
}

const MockHubLogo = ({
  showText = true,
  size = "default",
  clickable = true,
  href = "/",
  className,
  textClassName,
  animated = true,
}: MockHubLogoProps) => {
  const sizeClasses = {
    sm: {
      icon: "h-6 w-6",
      iconContainer: "h-6 w-6",
      iconInner: "h-3 w-3",
      text: "text-sm",
      gap: "gap-1.5",
    },
    default: {
      icon: "h-8 w-8",
      iconContainer: "h-8 w-8",
      iconInner: "h-4 w-4",
      text: "text-lg",
      gap: "gap-2",
    },
    lg: {
      icon: "h-10 w-10",
      iconContainer: "h-10 w-10",
      iconInner: "h-5 w-5",
      text: "text-xl",
      gap: "gap-2.5",
    },
  }

  const currentSize = sizeClasses[size]

  const logoContent = (
    <div className={cn("flex items-center", currentSize.gap, className)}>
      {animated ? (
        <motion.div
          whileHover={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5 }}
          className={cn(
            "flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700",
            currentSize.iconContainer
          )}
        >
          <Zap className={cn("text-white", currentSize.iconInner)} />
        </motion.div>
      ) : (
        <div
          className={cn(
            "flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700",
            currentSize.iconContainer
          )}
        >
          <Zap className={cn("text-white", currentSize.iconInner)} />
        </div>
      )}
      {showText && (
        <span
          className={cn(
            "font-bold tracking-tight",
            currentSize.text,
            textClassName
          )}
        >
          MockHub
        </span>
      )}
    </div>
  )

  if (!clickable) {
    return logoContent
  }

  return (
    <motion.div
      whileHover={animated ? { scale: 1.05 } : undefined}
      whileTap={animated ? { scale: 0.95 } : undefined}
    >
      <Link href={href} className="inline-block">
        {logoContent}
      </Link>
    </motion.div>
  )
}

export default MockHubLogo

