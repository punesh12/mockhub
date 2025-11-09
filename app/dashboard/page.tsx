"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Loader2,
  Zap,
  History,
  Code,
  Plus,
  Play,
  TrendingUp,
} from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

interface DashboardStats {
  totalMocks: number
  totalHistory: number
  successRate: number
  activeEndpoints: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    // Check if user is authenticated
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.push("/auth/login")
          return
        }
        return res.json()
      })
      .then((data) => {
        if (data?.user) {
          setUser(data.user)
          setIsLoading(false)
        } else {
          router.push("/auth/login")
        }
      })
      .catch(() => {
        router.push("/auth/login")
      })

    // Fetch dashboard stats
    fetch("/api/dashboard/stats")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch stats")
        }
        return res.json()
      })
      .then((data) => {
        setStats(data.stats)
        setIsLoadingStats(false)
      })
      .catch((error) => {
        console.error("Error fetching stats:", error)
        setIsLoadingStats(false)
      })
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const statsData = [
    {
      title: "Total Mocks",
      value: stats?.totalMocks ?? 0,
      description:
        stats?.totalMocks === 0
          ? "Create your first mock API"
          : `${stats?.totalMocks} mock${stats?.totalMocks !== 1 ? "s" : ""} created`,
      icon: Zap,
    },
    {
      title: "Request History",
      value: stats?.totalHistory ?? 0,
      description:
        stats?.totalHistory === 0
          ? "No requests yet"
          : `${stats?.totalHistory} request${stats?.totalHistory !== 1 ? "s" : ""} recorded`,
      icon: History,
    },
    {
      title: "Success Rate",
      value: stats?.successRate ?? 0,
      description:
        stats?.totalHistory === 0
          ? "Start testing APIs"
          : `${stats?.successRate}% successful`,
      icon: Code,
      suffix: stats?.totalHistory === 0 ? "" : "%",
    },
    {
      title: "Active Endpoints",
      value: stats?.activeEndpoints ?? 0,
      description:
        stats?.activeEndpoints === 0
          ? "No active endpoints"
          : `${stats?.activeEndpoints} endpoint${stats?.activeEndpoints !== 1 ? "s" : ""} active`,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back{user?.name ? `, ${user.name}` : ""}!
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="gradient" size="lg">
            <Link
              href="/dashboard/mocks/new"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Mock
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard/test" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Test API
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoadingStats ? (
                    <>
                      <Skeleton className="h-8 w-16 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        {stat.value}
                        {stat.suffix}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.description}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with MockHub</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Link href="/dashboard/mocks/new">
                <Card className="hover:border-primary transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Create Mock API
                    </CardTitle>
                    <CardDescription>
                      Create a new mock endpoint with custom responses
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/dashboard/test">
                <Card className="hover:border-primary transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Test API
                    </CardTitle>
                    <CardDescription>
                      Test any API endpoint and view responses
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
