"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface StatusCodeData {
  status: string
  count: number
}

interface StatusCodeChartProps {
  data: StatusCodeData[]
}

const getStatusColor = (status: string) => {
  const code = parseInt(status)
  if (code >= 200 && code < 300) return "hsl(142, 76%, 36%)" // green
  if (code >= 300 && code < 400) return "hsl(221, 83%, 53%)" // blue
  if (code >= 400 && code < 500) return "hsl(38, 92%, 50%)" // orange
  if (code >= 500) return "hsl(0, 84%, 60%)" // red
  return "hsl(var(--muted-foreground))"
}

export function StatusCodeChart({ data }: StatusCodeChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status Code Distribution</CardTitle>
          <CardDescription>Distribution of HTTP status codes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Code Distribution</CardTitle>
        <CardDescription>Number of requests by status code</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="status"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Bar dataKey="count" name="Requests" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getStatusColor(entry.status)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
