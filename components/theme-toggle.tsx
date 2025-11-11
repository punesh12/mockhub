"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

export const ThemeToggle = () => {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const cycleTheme = () => {
    if (theme === "system") {
      setTheme("light")
    } else if (theme === "light") {
      setTheme("dark")
    } else {
      setTheme("system")
    }
  }

  // Get the icon based on current theme setting
  const getIcon = () => {
    if (!mounted) return <Sun className="h-4 w-4" />
    
    // Show Monitor icon when system theme is selected
    if (theme === "system") {
      return <Monitor className="h-4 w-4" />
    } else if (theme === "dark") {
      return <Sun className="h-4 w-4" />
    } else {
      return <Moon className="h-4 w-4" />
    }
  }

  const getAriaLabel = () => {
    if (!mounted) return "Toggle theme"
    if (theme === "system") {
      const activeTheme = resolvedTheme === "dark" ? "dark" : "light"
      return `Theme: System (${activeTheme} mode active, click to switch to light)`
    }
    if (theme === "light") return "Theme: Light (click to switch to dark)"
    return "Theme: Dark (click to switch to system)"
  }

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        aria-label="Toggle theme"
      >
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 relative"
        onClick={cycleTheme}
        aria-label={getAriaLabel()}
        title={getAriaLabel()}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={theme}
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 180, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {getIcon()}
          </motion.div>
        </AnimatePresence>
      </Button>
    </motion.div>
  )
}

