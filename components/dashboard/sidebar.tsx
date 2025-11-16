"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Zap,
  Building2,
  History,
  Code,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Mocks",
    href: "/dashboard/mocks",
    icon: Zap,
  },
  {
    name: "Organizations",
    href: "/dashboard/organizations",
    icon: Building2,
  },
  {
    name: "History",
    href: "/dashboard/history",
    icon: History,
  },
  {
    name: "Test API",
    href: "/dashboard/test",
    icon: Code,
  },
  {
    name: "Profile",
    href: "/dashboard/profile",
    icon: User,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    router.push("/auth/login")
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-background"
        >
          {isMobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isMobileOpen ? 0 : -280,
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border lg:static lg:translate-x-0 lg:!transform-none"
      >
        <div className="flex h-full flex-col">
          {/* Logo/Brand */}
          <div className="flex h-16 items-center border-b border-border px-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold">MockHub</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href))

              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                          flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                          ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          }
                        `}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </motion.div>
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-border p-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm lg:hidden -z-10"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  )
}
