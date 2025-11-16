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
  Clock,
  ExternalLink,
  ArrowRight,
  Building2,
} from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import StatusBadge from "@/components/shared/components/StatusBadge"
import { getMethodColor } from "@/lib/method-utils"
import { cn } from "@/lib/utils"

interface DashboardStats {
  totalMocks: number
  totalHistory: number
  successRate: number
  activeEndpoints: number
}

interface RecentActivity {
  id: string
  url: string
  method: string
  status: number
  responseTime: number
  createdAt: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isLoadingActivity, setIsLoadingActivity] = useState(true)
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

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

    // Fetch recent activity
    fetch("/api/history?limit=5&sortBy=createdAt&sortOrder=desc")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch recent activity")
        }
        return res.json()
      })
      .then((data) => {
        setRecentActivity(data.history || [])
        setIsLoadingActivity(false)
      })
      .catch((error) => {
        console.error("Error fetching recent activity:", error)
        setIsLoadingActivity(false)
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
          <Button asChild variant="outline" size="lg">
            <Link
              href="/dashboard/organizations"
              className="flex items-center gap-2"
            >
              <Building2 className="h-4 w-4" />
              Organizations
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
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="h-5 w-5 text-primary group-hover:text-primary/80 transition-colors" />
                  </motion.div>
                </CardHeader>
                <CardContent className="relative z-10">
                  {isLoadingStats ? (
                    <>
                      <Skeleton className="h-8 w-16 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
                        className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent"
                      >
                        {stat.value}
                        {stat.suffix}
                      </motion.div>
                      <p className="text-xs text-muted-foreground mt-2 group-hover:text-foreground/80 transition-colors">
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

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-xl">Recent Activity</CardTitle>
              <CardDescription>
                Your latest API requests and responses
              </CardDescription>
            </div>
            {recentActivity.length > 0 && (
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/history" className="flex items-center gap-2">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isLoadingActivity ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                    <Skeleton className="h-6 w-16 rounded" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-6 w-12 rounded" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-4 rounded" />
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <History className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No recent activity</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  Start testing APIs to see your request history here
                </p>
                <Button asChild variant="outline">
                  <Link href="/dashboard/test" className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Test API
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((activity, index) => {
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        href={`/dashboard/test?url=${encodeURIComponent(activity.url)}&method=${activity.method}`}
                      >
                        <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 hover:border-primary/50 transition-all group cursor-pointer">
                          {/* Method Badge */}
                          <Badge
                            className={cn(
                              "font-mono text-xs px-2 py-1 shrink-0 w-16 text-center",
                              getMethodColor(activity.method)
                            )}
                          >
                            {activity.method}
                          </Badge>

                          {/* URL */}
                          <code className="text-xs font-mono text-muted-foreground truncate flex-1 min-w-0 group-hover:text-foreground transition-colors">
                            {activity.url.length > 60
                              ? `${activity.url.substring(0, 60)}...`
                              : activity.url}
                          </code>

                          {/* Status Badge */}
                          <StatusBadge
                            status={activity.status}
                            className="shrink-0"
                          />

                          {/* Response Time */}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 w-20">
                            <Clock className="h-3 w-3" />
                            <span>{activity.responseTime}ms</span>
                          </div>

                          {/* Timestamp */}
                          <div className="text-xs text-muted-foreground shrink-0 w-24 text-right">
                            {new Date(activity.createdAt).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </div>

                          {/* External Link Icon */}
                          <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
