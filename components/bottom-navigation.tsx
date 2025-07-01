"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Home, FileText, Briefcase, List, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface BottomNavigationProps {
  hasNewNotification?: boolean
  showProfile?: boolean
}

export default function BottomNavigation({ hasNewNotification = false, showProfile = true }: BottomNavigationProps) {
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
      <div className="fixed bottom-5 left-0 right-0 z-40 px-6 md:hidden">
        <div className="relative flex justify-center">
          {/* Background glow effect for the active button */}
          <div
            className="absolute w-12 h-12 rounded-full bg-green-100 filter blur-xl opacity-70 z-0"
            style={{
              bottom: "10px",
              left: `calc(${activeIndex * itemWidth}% + ${itemWidth / 2}% - 24px)`,
            }}
          />

          {/* Active item floating button */}
          <AnimatePresence mode="wait">
            {navItems.map((item) =>
              item.active ? (
                <motion.div
                  key={item.href}
                  initial={{ y: 20, opacity: 0, scale: 0.8 }}
                  animate={{ y: -28, opacity: 1, scale: 1 }}
                  exit={{ y: 20, opacity: 0, scale: 0.8 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    mass: 1,
                  }}
                  className="absolute"
                  style={{
                    zIndex: 10,
                    left: `calc(${activeIndex * itemWidth}% + ${itemWidth / 2}% - 24px)`,
                  }}
                >
                  <div className="relative">
                    {/* Pulse animation for the active button */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0.5 }}
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.7, 0, 0.7],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                        ease: "easeInOut",
                      }}
                      className="absolute inset-0 bg-green-400 rounded-full z-0"
                    />

                    {/* Shadow effect */}
                    <div className="absolute -inset-1 bg-white/30 rounded-full blur-sm z-0" />

                    {/* Active button */}
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className="relative bg-gradient-to-r from-green-500 to-green-600 rounded-full p-3 shadow-lg shadow-green-200/70 z-10"
                    >
                      <item.icon className="h-6 w-6 text-white" />
                      {item.badge && (
                        <Badge className="absolute -top-1 -right-1 bg-red-500 text-white h-2.5 w-2.5 p-0 rounded-full flex items-center justify-center shadow-sm" />
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              ) : null,
            )}
          </AnimatePresence>

          {/* Navigation bar */}
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-green-100/80 py-4 px-3 flex justify-around items-center w-full"
          >
            {navItems.map((item, index) => (
              <Link
                href={item.href}
                key={item.label}
                className={`flex flex-col items-center justify-center relative ${item.active ? "mt-4 pt-3" : ""}`}
                style={{ width: `${itemWidth}%` }}
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
                onTouchStart={() => setHoveredItem(item.href)}
                onTouchEnd={() => setHoveredItem(null)}
              >
                {!item.active && (
                  <motion.div
                    animate={{
                      scale: hoveredItem === item.href ? 1.1 : 1,
                      y: hoveredItem === item.href ? -2 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className={`relative mb-1.5 ${hoveredItem === item.href ? "text-green-600" : "text-gray-400"}`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.badge && (
                      <motion.div
                        initial={{ scale: 0.5 }}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          repeatType: "reverse",
                        }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white h-2.5 w-2.5 p-0 rounded-full flex items-center justify-center shadow-sm"
                      />
                    )}
                  </motion.div>
                )}
                <motion.span
                  animate={{
                    scale: hoveredItem === item.href && !item.active ? 1.05 : 1,
                    color: hoveredItem === item.href && !item.active ? "#047857" : item.active ? "#047857" : "#6B7280",
                  }}
                  className={`text-xs font-medium transition-colors ${
                    item.active ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {item.label}
                </motion.span>

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
      <div className="hidden md:block fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-md border border-green-100 rounded-full shadow-lg py-2 px-6 z-40">
        <div className="flex items-center space-x-1">
          {navItems.map((item, index) => (
            <Link href={item.href} key={item.label} className="relative px-4 py-2 group">
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
                    <motion.div
                      initial={{ scale: 0.5 }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                      }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white h-2.5 w-2.5 p-0 rounded-full flex items-center justify-center shadow-sm"
                    />
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
                  className={`text-sm ${item.active ? "text-green-700 font-medium" : "text-gray-500 group-hover:text-green-600"}`}
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

export { BottomNavigation };
