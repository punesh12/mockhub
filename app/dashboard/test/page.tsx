"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Loader2, Send, Globe, Clock, History } from "lucide-react"
import { motion } from "framer-motion"
import StatusBadge from "@/components/shared/components/StatusBadge"
import CopyButton from "@/components/shared/components/CopyButton"
import { ALL_HTTP_METHODS } from "@/lib/http-methods"

interface Header {
  key: string
  value: string
}

interface QueryParam {
  key: string
  value: string
}

interface ApiResponse {
  success: boolean
  status?: number
  statusText?: string
  headers?: Record<string, string>
  data?: unknown
  responseTime?: number
  error?: {
    message: string
    code?: string
    details?: unknown
  }
}

interface HistoryItem {
  id: string
  url: string
  method: string
  status: number
  responseTime: number
  createdAt: string
}

function TestApiPageContent() {
  const searchParams = useSearchParams()
  const [method, setMethod] = useState("GET")
  const [url, setUrl] = useState("")
  const [headers, setHeaders] = useState<Header[]>([{ key: "", value: "" }])
  const [queryParams, setQueryParams] = useState<QueryParam[]>([
    { key: "", value: "" },
  ])
  const [requestBody, setRequestBody] = useState("")
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [saveToHistory, setSaveToHistory] = useState(true)
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Pre-fill from query params (for retry functionality)
  useEffect(() => {
    const urlParam = searchParams.get("url")
    const methodParam = searchParams.get("method")

    if (urlParam) {
      setUrl(decodeURIComponent(urlParam))
    }
    if (methodParam) {
      setMethod(methodParam.toUpperCase())
    }
  }, [searchParams])

  // Fetch recent history for "Load from History"
  useEffect(() => {
    fetchRecentHistory()
  }, [])

  const fetchRecentHistory = async () => {
    setIsLoadingHistory(true)
    try {
      const response = await fetch("/api/history?limit=10&sortBy=createdAt&sortOrder=desc")
      if (response.ok) {
        const data = await response.json()
        setHistoryItems(data.history || [])
      }
    } catch (error) {
      console.error("Error fetching history:", error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const handleLoadFromHistory = (item: HistoryItem) => {
    setUrl(item.url)
    setMethod(item.method)
    // Note: We don't have headers/query params/body stored in history
    // So we can only load URL and method
    toast.success("Request loaded from history")
  }

  const handleAddHeader = () => {
    setHeaders([...headers, { key: "", value: "" }])
  }

  const handleRemoveHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index))
  }

  const handleHeaderChange = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const newHeaders = [...headers]
    newHeaders[index][field] = value
    setHeaders(newHeaders)
  }

  const handleAddQueryParam = () => {
    setQueryParams([...queryParams, { key: "", value: "" }])
  }

  const handleRemoveQueryParam = (index: number) => {
    setQueryParams(queryParams.filter((_, i) => i !== index))
  }

  const handleQueryParamChange = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const newQueryParams = [...queryParams]
    newQueryParams[index][field] = value
    setQueryParams(newQueryParams)
  }

  const handleSendRequest = async () => {
    if (!url.trim()) {
      toast.error("Please enter a URL")
      return
    }

    setIsLoading(true)
    setResponse(null)

    try {
      // Filter out empty headers and query params
      const filteredHeaders = headers
        .filter((h) => h.key.trim() !== "")
        .reduce(
          (acc, h) => {
            acc[h.key] = h.value
            return acc
          },
          {} as Record<string, string>
        )

      const filteredQueryParams = queryParams
        .filter((q) => q.key.trim() !== "")
        .reduce(
          (acc, q) => {
            acc[q.key] = q.value
            return acc
          },
          {} as Record<string, string>
        )

      const response = await fetch("/api/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          method,
          headers: filteredHeaders,
          queryParams: filteredQueryParams,
          requestBody: requestBody.trim() || undefined,
          saveToHistory,
        }),
      })

      const data = await response.json()
      setResponse(data)
      
      // Refresh history list if request was saved
      if (saveToHistory && data.success) {
        fetchRecentHistory()
      }
    } catch (error) {
      setResponse({
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Network error",
        },
      })
    } finally {
      setIsLoading(false)
    }
  }


  const formatResponseBody = (data: unknown): string => {
    if (!data) return ""
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }

  const highlightJSON = (json: string): React.ReactNode => {
    if (!json) return null

    // Try to parse and format JSON first
    let formattedJson = json
    try {
      const parsed = JSON.parse(json)
      formattedJson = JSON.stringify(parsed, null, 2)
    } catch {
      // If not valid JSON, return as plain text
      return <span className="text-foreground">{json}</span>
    }

    // Tokenize JSON with a single pass
    const parts: React.ReactNode[] = []
    let i = 0

    while (i < formattedJson.length) {
      // Match string (keys or values)
      if (formattedJson[i] === '"') {
        const start = i
        i++ // Skip opening quote
        while (i < formattedJson.length) {
          if (formattedJson[i] === "\\" && i + 1 < formattedJson.length) {
            i += 2 // Skip escaped character
          } else if (formattedJson[i] === '"') {
            i++ // Skip closing quote
            break
          } else {
            i++
          }
        }
        const stringContent = formattedJson.substring(start, i)

        // Check if it's a key (followed by colon) or value
        const isKey =
          i < formattedJson.length &&
          formattedJson.substring(i).trim().startsWith(":")
        const colorClass = isKey
          ? "text-blue-600 dark:text-blue-400"
          : "text-green-600 dark:text-green-400"

        parts.push(
          <span key={`str-${start}`} className={colorClass}>
            {stringContent}
          </span>
        )
        continue
      }

      // Match numbers
      if (/[\d-]/.test(formattedJson[i])) {
        const start = i
        if (formattedJson[i] === "-") i++
        while (i < formattedJson.length && /[\d.]/.test(formattedJson[i])) {
          i++
        }
        const numberContent = formattedJson.substring(start, i)
        parts.push(
          <span
            key={`num-${start}`}
            className="text-orange-600 dark:text-orange-400"
          >
            {numberContent}
          </span>
        )
        continue
      }

      // Match booleans and null
      if (formattedJson.substring(i).startsWith("true")) {
        parts.push(
          <span
            key={`bool-${i}`}
            className="text-purple-600 dark:text-purple-400"
          >
            true
          </span>
        )
        i += 4
        continue
      }
      if (formattedJson.substring(i).startsWith("false")) {
        parts.push(
          <span
            key={`bool-${i}`}
            className="text-purple-600 dark:text-purple-400"
          >
            false
          </span>
        )
        i += 5
        continue
      }
      if (formattedJson.substring(i).startsWith("null")) {
        parts.push(
          <span
            key={`null-${i}`}
            className="text-purple-600 dark:text-purple-400"
          >
            null
          </span>
        )
        i += 4
        continue
      }

      // Default: regular character
      const char = formattedJson[i]
      const isPunctuation = /[{}[\],:]/.test(char)
      parts.push(
        <span
          key={`char-${i}`}
          className={
            isPunctuation ? "text-muted-foreground" : "text-foreground"
          }
        >
          {char}
        </span>
      )
      i++
    }

    return <>{parts}</>
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">
          API Testing Playground
        </h1>
        <p className="text-muted-foreground mt-1">
          Test your APIs and view responses in real-time
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Request Builder */}
        <Card>
          <CardHeader>
            <CardTitle>Request Builder</CardTitle>
            <CardDescription>Configure your API request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Method and URL */}
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                <div className="grid gap-4 sm:grid-cols-[120px_1fr] flex-1">
                  <div className="space-y-2">
                    <Label htmlFor="method">Method</Label>
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger id="method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_HTTP_METHODS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url">URL</Label>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://api.example.com/users"
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-10">
                      <History className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[300px]">
                    <div className="px-2 py-1.5 text-sm font-semibold">
                      Load from History
                    </div>
                    {isLoadingHistory ? (
                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                        Loading...
                      </div>
                    ) : historyItems.length === 0 ? (
                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                        No history available
                      </div>
                    ) : (
                      <div className="max-h-[300px] overflow-y-auto">
                        {historyItems.map((item) => (
                          <DropdownMenuItem
                            key={item.id}
                            onClick={() => handleLoadFromHistory(item)}
                            className="flex flex-col items-start gap-1 py-3 cursor-pointer"
                          >
                            <div className="flex items-center gap-2 w-full">
                              <span className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded bg-muted">
                                {item.method}
                              </span>
                              <span className="text-xs text-muted-foreground truncate flex-1">
                                {new Date(item.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground truncate w-full">
                              {item.url}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Tabs for Headers, Query Params, Body */}
            <Tabs defaultValue="headers" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="headers">Headers</TabsTrigger>
                <TabsTrigger value="query">Query Params</TabsTrigger>
                <TabsTrigger value="body">Body</TabsTrigger>
              </TabsList>

              {/* Headers Tab */}
              <TabsContent value="headers" className="space-y-2">
                {headers.map((header, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Header name"
                      value={header.key}
                      onChange={(e) =>
                        handleHeaderChange(index, "key", e.target.value)
                      }
                      className="font-mono text-sm"
                    />
                    <Input
                      placeholder="Header value"
                      value={header.value}
                      onChange={(e) =>
                        handleHeaderChange(index, "value", e.target.value)
                      }
                      className="font-mono text-sm"
                    />
                    {headers.length > 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveHeader(index)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="secondary" size="sm" onClick={handleAddHeader}>
                  + Add Header
                </Button>
              </TabsContent>

              {/* Query Params Tab */}
              <TabsContent value="query" className="space-y-2">
                {queryParams.map((param, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Parameter name"
                      value={param.key}
                      onChange={(e) =>
                        handleQueryParamChange(index, "key", e.target.value)
                      }
                      className="font-mono text-sm"
                    />
                    <Input
                      placeholder="Parameter value"
                      value={param.value}
                      onChange={(e) =>
                        handleQueryParamChange(index, "value", e.target.value)
                      }
                      className="font-mono text-sm"
                    />
                    {queryParams.length > 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveQueryParam(index)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAddQueryParam}
                >
                  + Add Query Param
                </Button>
              </TabsContent>

              {/* Body Tab */}
              <TabsContent value="body" className="space-y-2">
                <Label htmlFor="body">Request Body (JSON)</Label>
                <textarea
                  id="body"
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                  placeholder='{"key": "value"}'
                  disabled={!["POST", "PUT", "PATCH"].includes(method)}
                />
                {!["POST", "PUT", "PATCH"].includes(method) && (
                  <p className="text-xs text-muted-foreground">
                    Request body is only available for POST, PUT, and PATCH
                    methods
                  </p>
                )}
              </TabsContent>
            </Tabs>

            {/* Save to History Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="saveToHistory"
                checked={saveToHistory}
                onCheckedChange={(checked) =>
                  setSaveToHistory(checked === true)
                }
              />
              <Label
                htmlFor="saveToHistory"
                className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Save to History
              </Label>
            </div>

            {/* Send Button */}
            <Button
              variant="info"
              onClick={handleSendRequest}
              disabled={isLoading || !url.trim()}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Request
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Response Display */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Response</CardTitle>
                <CardDescription>API response will appear here</CardDescription>
              </div>
              {response && (
                <CopyButton
                  text={JSON.stringify(response, null, 2)}
                  size="sm"
                  variant="outline"
                  showText
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : response ? (
              <div className="space-y-4">
                {/* Status and Response Time */}
                <div className="flex items-center gap-4 flex-wrap">
                  {response.status && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <span className="text-sm font-medium">Status:</span>
                      <StatusBadge
                        status={response.status}
                        statusText={response.statusText}
                      />
                    </motion.div>
                  )}
                  {response.responseTime !== undefined && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-center gap-2 text-sm text-muted-foreground px-2.5 py-1 rounded-md bg-muted/50"
                    >
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">{response.responseTime}ms</span>
                    </motion.div>
                  )}
                </div>

                {/* Error Display */}
                {!response.success && response.error && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
                    <p className="text-sm font-medium text-destructive mb-2">
                      {response.error.message}
                    </p>
                    {response.error.details !== undefined && (
                      <pre className="text-xs text-muted-foreground overflow-auto">
                        {JSON.stringify(response.error.details, null, 2)}
                      </pre>
                    )}
                  </div>
                )}

                {/* Headers */}
                {response.headers &&
                  Object.keys(response.headers).length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          Response Headers
                        </Label>
                        <CopyButton
                          text={Object.entries(response.headers!)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join("\n")}
                          size="sm"
                          variant="ghost"
                          showText
                          className="h-7 text-xs"
                          onCopy={() => toast.success("Headers copied to clipboard")}
                        />
                      </div>
                      <div className="rounded-md border-2 bg-muted/30 p-3 max-h-[200px] overflow-auto shadow-inner">
                        <pre className="text-xs font-mono">
                          {Object.entries(response.headers)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join("\n")}
                        </pre>
                      </div>
                    </div>
                  )}

                {/* Response Body */}
                {response.data !== undefined && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Response Body</Label>
                      <CopyButton
                        text={formatResponseBody(response.data)}
                        size="sm"
                        variant="ghost"
                        showText
                        className="h-7 text-xs"
                        onCopy={() => toast.success("Response body copied to clipboard")}
                      />
                    </div>
                    <div className="rounded-md border-2 bg-muted/30 p-4 max-h-[500px] overflow-auto shadow-inner">
                      <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed">
                        {highlightJSON(formatResponseBody(response.data)) || (
                          <span className="text-foreground">
                            {formatResponseBody(response.data)}
                          </span>
                        )}
                      </pre>
                    </div>
                  </div>
                )}

                {/* No response data */}
                {response.success && response.data === undefined && (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No response body
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-12">
                Send a request to see the response here
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function TestApiPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <TestApiPageContent />
    </Suspense>
  )
}
