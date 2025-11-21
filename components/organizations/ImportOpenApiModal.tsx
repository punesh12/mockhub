"use client"

import { useState } from "react"
import { Upload, FileText, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react"
import Modal from "@/components/shared/components/Modal"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import type { ExtractedMock } from "@/lib/openapi-utils"

interface ImportOpenApiModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  organizationSlug: string
  onSuccess?: () => void
}

type ImportStep = "upload" | "preview" | "importing" | "results"

interface ImportResults {
  created: number
  skipped: number
  errors: number
  details: {
    created: Array<{ id: string; name: string; endpoint: string; method: string }>
    skipped: Array<{ name: string; endpoint: string; method: string; reason: string }>
    errors: Array<{ name: string; endpoint: string; method: string; error: string }>
  }
}

const ImportOpenApiModal = ({
  open,
  onOpenChange,
  organizationId,
  organizationSlug,
  onSuccess,
}: ImportOpenApiModalProps) => {
  const [step, setStep] = useState<ImportStep>("upload")
  const [fileContent, setFileContent] = useState<string>("")
  const [fileType, setFileType] = useState<"json" | "yaml">("json")
  const [extractedMocks, setExtractedMocks] = useState<ExtractedMock[]>([])
  const [selectedEndpoints, setSelectedEndpoints] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [importResults, setImportResults] = useState<ImportResults | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const fileName = file.name.toLowerCase()
    const isYaml = fileName.endsWith(".yaml") || fileName.endsWith(".yml")
    const isJson = fileName.endsWith(".json")

    if (!isYaml && !isJson) {
      toast.error("Please upload a JSON or YAML file")
      return
    }

    setIsLoading(true)
    try {
      const content = await file.text()
      setFileContent(content)
      setFileType(isYaml ? "yaml" : "json")

      // Parse and extract mocks
      const response = await fetch("/api/organizations/preview-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileContent: content, fileType: isYaml ? "yaml" : "json" }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || "Failed to parse OpenAPI file")
        setIsLoading(false)
        return
      }

      const data = await response.json()
      setExtractedMocks(data.mocks || [])
      
      // Select all by default
      const allEndpoints = new Set(
        data.mocks.map((m: ExtractedMock) => `${m.method} ${m.endpoint}`)
      )
      setSelectedEndpoints(allEndpoints)
      setStep("preview")
    } catch (error) {
      console.error("Error parsing file:", error)
      toast.error("Failed to parse OpenAPI file")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleEndpoint = (endpoint: string) => {
    const newSelected = new Set(selectedEndpoints)
    if (newSelected.has(endpoint)) {
      newSelected.delete(endpoint)
    } else {
      newSelected.add(endpoint)
    }
    setSelectedEndpoints(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedEndpoints.size === extractedMocks.length) {
      setSelectedEndpoints(new Set())
    } else {
      const allEndpoints = new Set(
        extractedMocks.map((m) => `${m.method} ${m.endpoint}`)
      )
      setSelectedEndpoints(allEndpoints)
    }
  }

  const handleImport = async () => {
    if (selectedEndpoints.size === 0) {
      toast.error("Please select at least one endpoint to import")
      return
    }

    setIsLoading(true)
    setStep("importing")

    try {
      const response = await fetch(
        `/api/organizations/${organizationSlug}/import-openapi`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileContent,
            fileType,
            selectedEndpoints: Array.from(selectedEndpoints),
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || "Failed to import OpenAPI spec")
        setStep("preview")
        setIsLoading(false)
        return
      }

      const data = await response.json()
      setImportResults(data)
      setStep("results")
      toast.success(`Successfully imported ${data.created} mock(s)`)
    } catch (error) {
      console.error("Error importing:", error)
      toast.error("Failed to import OpenAPI spec")
      setStep("preview")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading && step !== "importing") {
      setStep("upload")
      setFileContent("")
      setExtractedMocks([])
      setSelectedEndpoints(new Set())
      setImportResults(null)
      onOpenChange(false)
    }
  }

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess()
    }
    handleClose()
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title={
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import from OpenAPI
        </div>
      }
      description="Import mock APIs from an OpenAPI 3.0 specification file"
      maxWidth="xl"
      preventClose={isLoading || step === "importing"}
    >
      <AnimatePresence mode="wait">
        {step === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-primary hover:underline">
                  Click to upload
                </span>{" "}
                or drag and drop
              </Label>
              <p className="text-sm text-muted-foreground mt-2">
                OpenAPI 3.0 JSON or YAML file
              </p>
              <input
                id="file-upload"
                type="file"
                accept=".json,.yaml,.yml"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isLoading}
              />
            </div>
            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Parsing OpenAPI file...</span>
              </div>
            )}
          </motion.div>
        )}

        {step === "preview" && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Preview Endpoints</h3>
                <p className="text-sm text-muted-foreground">
                  Select which endpoints to import ({selectedEndpoints.size} of{" "}
                  {extractedMocks.length} selected)
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedEndpoints.size === extractedMocks.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-4">
              {extractedMocks.map((mock, index) => {
                const endpointKey = `${mock.method} ${mock.endpoint}`
                const isSelected = selectedEndpoints.has(endpointKey)

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={`endpoint-${index}`}
                      checked={isSelected}
                      onCheckedChange={() => handleToggleEndpoint(endpointKey)}
                    />
                    <Label
                      htmlFor={`endpoint-${index}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {mock.method}
                        </span>
                        <span className="font-mono text-sm">{mock.endpoint}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {mock.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Status: {mock.responseCode}
                      </p>
                    </Label>
                  </motion.div>
                )
              })}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={isLoading || selectedEndpoints.size === 0}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import {selectedEndpoints.size} Endpoint(s)
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {step === "importing" && (
          <motion.div
            key="importing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-8 space-y-4"
          >
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-semibold">Importing mocks...</p>
            <p className="text-sm text-muted-foreground">
              Please wait while we create your mock APIs
            </p>
          </motion.div>
        )}

        {step === "results" && importResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-lg font-semibold">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Import Complete
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border bg-primary/5">
                <div className="text-2xl font-bold text-primary">
                  {importResults.created}
                </div>
                <div className="text-sm text-muted-foreground">Created</div>
              </div>
              <div className="p-4 rounded-lg border bg-yellow-500/5">
                <div className="text-2xl font-bold text-yellow-600">
                  {importResults.skipped}
                </div>
                <div className="text-sm text-muted-foreground">Skipped</div>
              </div>
              <div className="p-4 rounded-lg border bg-destructive/5">
                <div className="text-2xl font-bold text-destructive">
                  {importResults.errors}
                </div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
            </div>

            {importResults.details.skipped.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Skipped Endpoints</h4>
                <div className="max-h-32 overflow-y-auto space-y-1 text-sm">
                  {importResults.details.skipped.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-muted-foreground">
                      <AlertCircle className="h-3 w-3" />
                      <span className="font-mono">{item.method} {item.endpoint}</span>
                      <span className="text-xs">({item.reason})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleSuccess}>Done</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}

export default ImportOpenApiModal

