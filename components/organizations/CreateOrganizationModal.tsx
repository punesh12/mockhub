"use client"

import { useState } from "react"
import { Building2 } from "lucide-react"
import Modal from "@/components/shared/components/Modal"
import CreateOrganizationForm from "./CreateOrganizationForm"

interface CreateOrganizationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function CreateOrganizationModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateOrganizationModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSuccess = () => {
    onOpenChange(false)
    if (onSuccess) {
      onSuccess()
    }
  }

  const handleCancel = () => {
    if (!isLoading) {
      onOpenChange(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Create Organization
        </div>
      }
      description="Set up a new organization to collaborate with your team"
      maxWidth="md"
      preventClose={isLoading}
    >
      <CreateOrganizationForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />
    </Modal>
  )
}

