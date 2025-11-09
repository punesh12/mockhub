/**
 * Export utility functions for JSON and CSV
 */

/**
 * Export data to JSON file
 */
export function exportToJSON<T>(data: T[], filename: string) {
  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Convert array of objects to CSV string
 */
export function convertToCSV<T extends Record<string, any>>(data: T[]): string {
  if (data.length === 0) return ""

  // Get headers from first object
  const headers = Object.keys(data[0])

  // Create CSV header row
  const headerRow = headers.map((header) => `"${header}"`).join(",")

  // Create CSV data rows
  const rows = data.map((item) => {
    return headers
      .map((header) => {
        const value = item[header]
        // Handle null/undefined
        if (value === null || value === undefined) return ""
        // Handle objects/arrays - stringify them
        if (typeof value === "object") {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`
        }
        // Handle strings with quotes and newlines
        const stringValue = String(value).replace(/"/g, '""')
        return `"${stringValue}"`
      })
      .join(",")
  })

  return [headerRow, ...rows].join("\n")
}

/**
 * Export data to CSV file
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string
) {
  const csvString = convertToCSV(data)
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Format history item for export (flatten nested objects)
 */
export function formatHistoryForExport(item: any) {
  return {
    id: item.id,
    url: item.url,
    method: item.method,
    status: item.status,
    responseTime: item.responseTime,
    responseBody:
      typeof item.responseBody === "object"
        ? JSON.stringify(item.responseBody)
        : item.responseBody,
    createdAt: item.createdAt,
  }
}

/**
 * Format mock for export
 */
export function formatMockForExport(item: any) {
  return {
    id: item.id,
    name: item.name,
    endpoint: item.endpoint,
    method: item.method,
    responseCode: item.responseCode,
    responseBody:
      typeof item.responseBody === "object"
        ? JSON.stringify(item.responseBody)
        : item.responseBody,
    createdAt: item.createdAt,
  }
}
