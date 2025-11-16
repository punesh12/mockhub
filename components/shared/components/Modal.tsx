"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string | React.ReactNode
  description?: string | React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
  preventClose?: boolean
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
}

const maxWidthClasses = {
  sm: "sm:max-w-[425px]",
  md: "sm:max-w-[600px]",
  lg: "sm:max-w-[800px]",
  xl: "sm:max-w-[1000px]",
  "2xl": "sm:max-w-[1200px]",
  full: "sm:max-w-full",
}

const Modal = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  contentClassName,
  preventClose = false,
  maxWidth = "md",
}: ModalProps) => {
  const handleOpenChange = (newOpen: boolean) => {
    if (!preventClose) {
      onOpenChange(newOpen)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          maxWidthClasses[maxWidth],
          "max-h-[90vh] overflow-y-auto",
          "!bg-background border-border", // Override hardcoded bg-white for theme support
          contentClassName
        )}
        onInteractOutside={(e) => {
          if (preventClose) {
            e.preventDefault()
          }
        }}
        onEscapeKeyDown={(e) => {
          if (preventClose) {
            e.preventDefault()
          }
        }}
      >
        {(title || description) && (
          <DialogHeader className={className}>
            {title && (
              <DialogTitle asChild={typeof title !== "string"}>
                {typeof title === "string" ? (
                  title
                ) : (
                  <div>{title}</div>
                )}
              </DialogTitle>
            )}
            {description && (
              <DialogDescription asChild={typeof description !== "string"}>
                {typeof description === "string" ? (
                  description
                ) : (
                  <div>{description}</div>
                )}
              </DialogDescription>
            )}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  )
}

export default Modal

