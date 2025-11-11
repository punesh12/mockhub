"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import StatusBadge from "@/components/shared/components/StatusBadge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Zap, Code, ArrowRight, Send, Loader2, Copy, Check } from "lucide-react"

// Mock API data
const mockApis = [
  {
    method: "GET",
    endpoint: "/api/users",
    status: 200,
    name: "Users API",
    response: {
      users: [
        { id: 1, name: "John Doe", email: "john@example.com" },
        { id: 2, name: "Jane Smith", email: "jane@example.com" },
      ],
    },
  },
  {
    method: "POST",
    endpoint: "/api/products",
    status: 201,
    name: "Create Product",
    response: {
      id: 123,
      name: "New Product",
      price: 99.99,
      createdAt: new Date().toISOString(),
    },
  },
  {
    method: "GET",
    endpoint: "/api/orders",
    status: 200,
    name: "Orders List",
    response: {
      orders: [
        { id: 1, total: 199.99, status: "completed" },
        { id: 2, total: 49.99, status: "pending" },
      ],
    },
  },
]

export function DemoSection() {
  const [selectedMethod, setSelectedMethod] = useState("GET")
  const [apiUrl, setApiUrl] = useState("/api/users")
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<{
    status: number
    statusText: string
    data: Record<string, unknown>
    responseTime: number
  } | null>({
    status: 200,
    statusText: "OK",
    data: {
      users: [
        {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
        },
      ],
    },
    responseTime: 45,
  })
  const [copiedResponse, setCopiedResponse] = useState(false)

  const handleMockClick = (mock: typeof mockApis[0]) => {
    setSelectedMethod(mock.method)
    setApiUrl(mock.endpoint)
    setResponse(null)
  }

  const handleSendRequest = async () => {
    setIsLoading(true)
    setResponse(null)

    // Simulate API call with delay
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 400))

    const selectedMock = mockApis.find(
      (m) => m.endpoint === apiUrl && m.method === selectedMethod
    )

    if (selectedMock) {
      setResponse({
        status: selectedMock.status,
        statusText: selectedMock.status === 200 ? "OK" : "Created",
        data: selectedMock.response,
        responseTime: Math.floor(30 + Math.random() * 50),
      })
    } else {
      // Default response for unknown endpoints
      setResponse({
        status: 200,
        statusText: "OK",
        data: { message: "Mock API response", endpoint: apiUrl },
        responseTime: Math.floor(30 + Math.random() * 50),
      })
    }

    setIsLoading(false)
  }

  const handleCopyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response.data, null, 2))
      setCopiedResponse(true)
      setTimeout(() => setCopiedResponse(false), 2000)
    }
  }

  return (
    <section
      id="demo"
      className="border-t bg-muted/20 py-20 relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="container mx-auto max-w-7xl px-4 relative z-10">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
            See It In Action
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the power of MockHub with a live preview of key features
          </p>
        </motion.div>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-2 mb-12">
          {/* Mock API Cards Preview */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="border-2 bg-background shadow-xl overflow-hidden h-full">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b items-center py-4">
                <div className="flex items-center justify-between gap-3 w-full">
                  <CardTitle className="text-lg flex items-center gap-2 m-0">
                    <Zap className="h-5 w-5 text-primary shrink-0" />
                    <span>Your Mock APIs</span>
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    3 Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3">
                {mockApis.map((mock, index) => {
                  const isSelected =
                    mock.endpoint === apiUrl && mock.method === selectedMethod
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleMockClick(mock)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all group ${
                        isSelected
                          ? "bg-primary/10 border-primary shadow-md"
                          : "bg-muted/30 hover:bg-muted/50 hover:border-primary/50"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm">{mock.name}</h4>
                        <StatusBadge
                          status={mock.status}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          {mock.method}
                        </span>
                        <code className="text-xs font-mono text-muted-foreground">
                          {mock.endpoint}
                        </code>
                      </div>
                    </motion.div>
                  )
                })}
              </CardContent>
            </Card>
          </motion.div>

          {/* API Testing Preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="border-2 bg-background shadow-xl overflow-hidden h-full">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b items-center py-4">
                <CardTitle className="text-lg flex items-center gap-2 m-0">
                  <Code className="h-5 w-5 text-primary shrink-0" />
                  <span>API Testing Playground</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  {/* Request */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-2 block">
                      Request
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-2">
                      <select
                        value={selectedMethod}
                        onChange={(e) => setSelectedMethod(e.target.value)}
                        className="px-3 py-1.5 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary sm:w-auto w-full"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                      <input
                        type="text"
                        value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-sm rounded-md border bg-background font-mono focus:outline-none focus:ring-2 focus:ring-primary min-w-0"
                        placeholder="/api/endpoint"
                      />
                      <Button
                        size="sm"
                        variant="gradient"
                        className="px-4 sm:w-auto w-full"
                        onClick={handleSendRequest}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-4 w-4 sm:mr-1" />
                            <span className="sm:inline hidden">Send</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Response */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-muted-foreground block">
                        Response
                      </label>
                      {response && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyResponse}
                          className="h-6 px-2 text-xs"
                        >
                          {copiedResponse ? (
                            <>
                              <Check className="h-3 w-3 mr-1 text-green-600" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    <div className="p-4 rounded-lg border bg-muted/30 font-mono text-xs overflow-x-auto min-h-[120px]">
                      {isLoading ? (
                        <div className="flex items-center justify-center h-full py-8">
                          <div className="text-center space-y-2">
                            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                            <p className="text-muted-foreground text-xs">
                              Sending request...
                            </p>
                          </div>
                        </div>
                      ) : response ? (
                        <>
                          <div className="flex items-center gap-2 mb-3">
                            <StatusBadge
                              status={response.status}
                              statusText={response.statusText}
                            />
                            <span className="text-muted-foreground text-xs">
                              {response.responseTime}ms
                            </span>
                          </div>
                          <pre className="text-xs whitespace-pre-wrap break-words">
                            {JSON.stringify(response.data, null, 2)}
                          </pre>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full py-8 text-muted-foreground text-xs">
                          Click a mock API or send a request to see the response
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center"
        >
          <p className="text-muted-foreground mb-6">
            Ready to create your own mock APIs?
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <Button
              asChild
              variant="gradient"
              size="lg"
              className="rounded-full px-8 shadow-lg"
            >
              <Link href="/auth/signup" className="flex items-center gap-2">
                Get Started Free
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="h-5 w-5" />
                </motion.div>
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

