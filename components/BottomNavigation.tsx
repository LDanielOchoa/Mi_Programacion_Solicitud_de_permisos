"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Home, FileText, Briefcase, List, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface BottomNavigationProps {
  hasNewNotification?: boolean
}

export default function BottomNavigation({ hasNewNotification = false }: BottomNavigationProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const navItems = [
    {
      icon: Home,
      label: "Inicio",
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      icon: FileText,
      label: "Permisos",
      href: "/solicitud-permisos",
      active: pathname === "/solicitud-permisos",
    },
    {
      icon: Briefcase,
      label: "Postulaciones",
      href: "/solicitud-equipo",
      active: pathname === "/solicitud-equipo",
    },
    {
      icon: List,
      label: "Solicitudes",
      href: "/solicitudes-global",
      active: pathname === "/solicitudes-global",
      badge: hasNewNotification,
    },
  ]

  // Find active item
  const activeIndex = navItems.findIndex((item) => item.active)
  const itemWidth = 100 / navItems.length

  return (
    <>
      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-sm py-2">
        <div className="relative flex justify-around items-center max-w-md mx-auto">
          {/* Active item indicator */}
          <div
            className="absolute h-0.5 bg-green-500 transition-all duration-300 bottom-0"
            style={{
              width: `${100 / navItems.length * 0.6}%`,
              left: `calc(${activeIndex * (100 / navItems.length)}% + ${(100 / navItems.length) * 0.2}%)`,
            }}
          />

          {/* Navigation bar */}
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="flex justify-around items-center w-full py-2"
          >
            {navItems.map((item, index) => (
              <Link
                href={item.href}
                key={item.label}
                className="flex flex-col items-center justify-center relative px-2"
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
                onTouchStart={() => setHoveredItem(item.href)}
                onTouchEnd={() => setHoveredItem(null)}
              >
                <motion.div
                  animate={{
                    scale: item.active ? 1.1 : hoveredItem === item.href ? 1.05 : 1,
                    color: item.active ? "#047857" : hoveredItem === item.href ? "#047857" : "#6B7280"
                  }}
                  className="relative mb-1"
                >
                  <item.icon className="h-5 w-5" />
                  {item.badge && (
                    <div className="absolute -top-1 -right-1 bg-red-500 h-2 w-2 rounded-full" />
                  )}
                </motion.div>
                <span
                  className={`text-xs font-medium transition-colors ${
                    item.active ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {item.label}
                </span>

                {/* Dot indicator for active item */}
                {!item.active && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{
                      scale: hoveredItem === item.href ? 1 : 0,
                      opacity: hoveredItem === item.href ? 1 : 0,
                    }}
                    className="absolute -bottom-2 h-1 w-1 bg-green-500 rounded-full"
                  />
                )}
              </Link>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-sm py-2 z-40">
        <div className="flex items-center justify-center max-w-2xl mx-auto space-x-4">
          {navItems.map((item, index) => (
            <Link href={item.href} key={item.label} className="relative px-3 py-2 group">
              <div className="flex items-center space-x-2">
                <div className={`relative p-1 rounded-md ${item.active ? "bg-green-50" : ""}`}>
                  <item.icon className={`h-5 w-5 ${item.active ? "text-green-600" : "text-gray-500 group-hover:text-green-600"}`} />
                  {item.badge && (
                    <div className="absolute -top-1 -right-1 bg-red-500 h-2 w-2 rounded-full" />
                  )}
                </div>
                <span className={`text-sm ${item.active ? "text-green-700 font-medium" : "text-gray-500 group-hover:text-green-600"}`}>
                  {item.label}
                </span>
              </div>
              {item.active && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />
              )}
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
