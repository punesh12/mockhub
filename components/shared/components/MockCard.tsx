"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  MoreVertical,
} from "lucide-react"
import { motion } from "framer-motion"
import StatusBadge from "./StatusBadge"
import CopyButton from "./CopyButton"
import { cn } from "@/lib/utils"

export interface MockCardData {
  id: string
  name: string
  endpoint: string
  method: string
  responseCode: number
  createdAt: string
}

interface MockCardProps {
  mock: MockCardData
  index?: number
  onDelete?: (mock: MockCardData) => void
  onEdit?: (mockId: string) => void
  className?: string
}

const MockCard = ({
  mock,
  index = 0,
  onDelete,
  onEdit,
  className,
}: MockCardProps) => {
  const router = useRouter()
  const [copiedUrl, setCopiedUrl] = React.useState(false)
  const [url, setUrl] = React.useState("")

  // Set URL only on client side to avoid hydration mismatch
  React.useEffect(() => {
    setUrl(`${window.location.origin}/api${mock.endpoint}`)
  }, [mock.endpoint])

  const handleCardClick = () => {
    if (onEdit) {
      onEdit(mock.id)
    } else {
      router.push(`/dashboard/mocks/${mock.id}/edit`)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(mock)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit(mock.id)
    } else {
      router.push(`/dashboard/mocks/${mock.id}/edit`)
    }
  }

  const handleOpenUrl = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(url, "_blank")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      className={cn("h-full", className)}
    >
      <Card
        className="hover:border-primary transition-all duration-200 cursor-pointer group relative overflow-hidden border h-full flex flex-col hover:shadow-sm"
        onClick={handleCardClick}
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        <CardContent className="relative z-10 p-3 flex flex-col gap-2">
          {/* Top Row: Name + Status */}
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-semibold group-hover:text-primary transition-colors truncate flex-1 leading-tight">
              {mock.name}
            </CardTitle>
            <StatusBadge
              status={mock.responseCode}
              className="shrink-0 text-[10px] leading-none"
            />
          </div>

          {/* Middle Row: Method + Endpoint + Copy */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase shrink-0">
              {mock.method}
            </span>
            <code className="text-[11px] font-mono text-muted-foreground truncate flex-1 min-w-0">
              /api{mock.endpoint}
            </code>
            <CopyButton
              text={url}
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 hover:bg-primary/10 shrink-0"
            />
          </div>

          {/* Bottom Row: Date + Actions */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <p className="text-[10px] text-muted-foreground leading-none">
              {new Date(mock.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    navigator.clipboard.writeText(url)
                    setCopiedUrl(true)
                    setTimeout(() => setCopiedUrl(false), 2000)
                  }}
                >
                  {copiedUrl ? (
                    <>
                      <Copy className="h-4 w-4 mr-2 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy URL
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenUrl}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in new tab
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default MockCard

