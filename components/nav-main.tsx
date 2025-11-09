"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { type LucideIcon } from "lucide-react"
import { motion } from "framer-motion"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu className="space-y-1">
          {items.map((item, index) => {
            const Icon = item.icon
            const isActive =
              pathname === item.url ||
              (item.url !== "/dashboard" && pathname.startsWith(item.url))

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive}
                    className="group relative h-11 px-3 rounded-md transition-all duration-200 data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-500 data-[active=true]:via-blue-600 data-[active=true]:to-blue-700 data-[active=true]:text-white data-[active=true]:font-semibold data-[active=true]:shadow-lg hover:bg-sidebar-accent"
                  >
                    <Link href={item.url} className="flex items-center gap-3 w-full">
                      {Icon && (
                        <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                      )}
                      <span className="text-sm font-medium">{item.title}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 top-0 bottom-0 w-1 bg-white/80 rounded-r-full"
                          initial={false}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </motion.div>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
