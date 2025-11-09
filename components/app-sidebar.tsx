"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Zap,
  History,
  Code,
  User,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
}

const navMain: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Mocks",
    url: "/dashboard/mocks",
    icon: Zap,
  },
  {
    title: "History",
    url: "/dashboard/history",
    icon: History,
  },
  {
    title: "Test API",
    url: "/dashboard/test",
    icon: Code,
  },

]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b px-3 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-2 h-auto hover:bg-sidebar-accent"
            >
              <Link href="/dashboard" className="flex items-center gap-2.5">
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10"
                >
                  <Zap className="h-4 w-4 text-primary" />
                </motion.div>
                <span className="text-base font-bold tracking-tight">MockHub</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-2 py-3">
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter className="border-t px-2 py-2">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
