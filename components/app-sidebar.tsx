"use client"

import * as React from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  Zap,
  History,
  Code,
  type LucideIcon,
} from "lucide-react"
import MockHubLogo from "@/components/shared/components/MockHubLogo"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { ThemeToggle } from "@/components/theme-toggle"
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
              <Link href="/dashboard">
                <MockHubLogo size="default" clickable={false} />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-2 py-3">
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter className="border-t px-2 py-2 space-y-2">
        <div className="flex items-center justify-end px-2">
          <ThemeToggle />
        </div>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
