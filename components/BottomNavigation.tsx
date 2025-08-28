"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Home, FileText, Briefcase, List, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface BottomNavigationProps {
  hasNewNotification?: boolean
  showProfile?: boolean // Added showProfile prop
}

export default function BottomNavigation({ hasNewNotification = false, showProfile = false }: BottomNavigationProps) {
  const pathname = usePathname()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  // Define base navigation items
  const baseNavItems = [
    {
      icon: Home,
      label: "Inicio",
      href: "/dashboard",
    },
    {
      icon: FileText,
      label: "Permisos",
      href: "/solicitud-permisos",
    },
    {
      icon: List,
      label: "Solicitudes",
      href: "/solicitudes-global",
      badge: hasNewNotification,
    },
  ]

  // Conditionally add profile item
  if (showProfile) {
    baseNavItems.push({
      icon: User,
      label: "Perfil",
      href: "/profile", // Assuming a profile page exists
    })
  }

  // Map to include active state
  const navItems = baseNavItems.map((item) => ({
    ...item,
    active: pathname === item.href,
  }))

  // Find active item index for mobile indicator
  const activeIndex = navItems.findIndex((item) => item.active)

  return (
    <>
      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-sm py-2">
        <div className="relative flex justify-around items-center max-w-md mx-auto">
          {/* Active item indicator (moving line) */}
          <motion.div
            className="absolute h-0.5 bg-green-500 transition-all duration-300 bottom-0"
            initial={false}
            animate={{
              width: `${(100 / navItems.length) * 0.6}%`,
              left: `calc(${activeIndex * (100 / navItems.length)}% + ${(100 / navItems.length) * 0.2}%)`,
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
          {/* Navigation items */}
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="flex justify-around items-center w-full py-2"
          >
            {navItems.map((item) => (
              <Link
                href={item.href}
                key={item.label}
                className="flex flex-col items-center justify-center relative px-2 flex-1"
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
                onTouchStart={() => setHoveredItem(item.href)}
                onTouchEnd={() => setHoveredItem(null)}
              >
                <motion.div
                  animate={{
                    scale: item.active ? 1.1 : hoveredItem === item.href ? 1.05 : 1,
                    color: item.active ? "#047857" : hoveredItem === item.href ? "#047857" : "#6B7280",
                  }}
                  className={`relative mb-1 p-2 rounded-md transition-colors duration-200 ${
                    item.active ? "bg-green-100" : "bg-transparent"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.badge && (
                    <Badge className="absolute -top-1 -right-1 bg-red-500 text-white h-2.5 w-2.5 p-0 rounded-full flex items-center justify-center shadow-sm" />
                  )}
                </motion.div>
                <motion.span
                  className={`text-xs font-medium transition-colors ${
                    item.active ? "text-green-700" : "text-gray-500"
                  }`}
                  animate={{
                    scale: hoveredItem === item.href && !item.active ? 1.05 : 1,
                    color: hoveredItem === item.href && !item.active ? "#047857" : item.active ? "#047857" : "#6B7280",
                  }}
                >
                  {item.label}
                </motion.span>
              </Link>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:block fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-md border border-green-100 rounded-full shadow-lg py-2 px-6 z-40">
        <div className="flex items-center justify-center max-w-2xl mx-auto space-x-4">
          {navItems.map((item) => (
            <Link href={item.href} key={item.label} className="relative px-3 py-2 group">
              <div className="flex items-center space-x-2">
                <motion.div
                  initial={false}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  animate={item.active ? { scale: 1.1 } : { scale: 1 }}
                  className={`p-2 rounded-full relative ${
                    item.active
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                      : "bg-transparent group-hover:bg-green-50"
                  } transition-all duration-300`}
                >
                  <item.icon className={`h-5 w-5 ${!item.active && "text-gray-500 group-hover:text-green-600"}`} />
                  {item.badge && (
                    <Badge className="absolute -top-1 -right-1 bg-red-500 text-white h-2.5 w-2.5 p-0 rounded-full flex items-center justify-center shadow-sm" />
                  )}
                  {/* Active ring effect */}
                  {item.active && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1.2 }}
                      className="absolute inset-0 rounded-full border-2 border-green-400/30 -z-10"
                      style={{ padding: "6px" }}
                    />
                  )}
                </motion.div>
                <motion.span
                  animate={item.active ? { fontWeight: 500 } : { fontWeight: 400 }}
                  className={`text-sm ${
                    item.active ? "text-green-700 font-medium" : "text-gray-500 group-hover:text-green-600"
                  }`}
                >
                  {item.label}
                </motion.span>
              </div>
              {item.active && (
                <motion.div
                  layoutId="desktopNavIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-green-600"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
