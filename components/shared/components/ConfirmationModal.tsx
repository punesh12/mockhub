"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConfirmationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string | React.ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  isLoading?: boolean
  variant?: "default" | "destructive"
  disabled?: boolean
}

const ConfirmationModal = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  isLoading = false,
  variant = "default",
  disabled = false,
}: ConfirmationModalProps) => {
  const handleConfirm = async () => {
    await onConfirm()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-[425px]",
          "!bg-background border-border" // Override hardcoded bg-white for theme support
        )}
        onInteractOutside={(e) => {
          if (isLoading || disabled) {
            e.preventDefault()
          }
        }}
        onEscapeKeyDown={(e) => {
          if (isLoading || disabled) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription asChild>
            {typeof description === "string" ? (
              <p>{description}</p>
            ) : (
              <div>{description}</div>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading || disabled}
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || disabled}
            variant={variant === "destructive" ? "destructive" : "default"}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ConfirmationModal

