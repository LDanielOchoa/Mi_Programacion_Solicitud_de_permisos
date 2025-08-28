"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Home,
  Bell,
  LogOut,
  ChevronRight,
  Search,
  Menu,
  X,
  MessageSquare,
  ChevronLeft,
  FileText,
  Briefcase,
  List,
  Settings,
  User,
  HelpCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useIsMobile } from "@/hooks/use-mobile"

interface UserData {
  code: string
  name: string
  phone: string
  role?: string
  department?: string
  avatar?: string
  userType?: 'registered' | 'se_maintenance'
}

interface SidebarProps {
  userData: UserData | null
}

export default function ModernSidebar({ userData }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = useState(false)

  // Update unread notifications count
  useEffect(() => {
    const updateUnreadCount = () => {
      const userCode = localStorage.getItem("userCode")
      const permitRequests = JSON.parse(localStorage.getItem("permitRequests") || "[]")
      const equipmentRequests = JSON.parse(localStorage.getItem("equipmentRequests") || "[]")
      const readNotifications = JSON.parse(localStorage.getItem("readNotifications") || "[]")

      const userNotifications = [
        ...permitRequests
          .filter((req: any) => req.code === userCode && req.status !== "pending")
          .map((req: any) => req.id),
        ...equipmentRequests
          .filter((req: any) => req.code === userCode && req.status !== "pending")
          .map((req: any) => req.id),
      ]

      const unreadCount = userNotifications.filter((id) => !readNotifications.includes(id)).length
      setUnreadCount(unreadCount)
    }

    updateUnreadCount()
    window.addEventListener("storage", updateUnreadCount)
    return () => window.removeEventListener("storage", updateUnreadCount)
  }, [])

  // Handle scroll for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && isMobileOpen) {
        setIsMobileOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isMobileOpen])

  // Navigation items - filter based on user type
  const allNavItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: Home,
      badge: null,
    },
    {
      href: "/solicitud-permisos",
      label: "Permisos",
      icon: FileText,
      badge: null,
    },
    {
      href: "/solicitudes-global",
      label: "Mis Solicitudes",
      icon: List,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      href: "/notificaciones",
      label: "Notificaciones",
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      href: "/mensajes",
      label: "Mensajes",
      icon: MessageSquare,
      badge: null,
    },
  ]

  // Filter navigation items based on user type
  const mainNavItems = allNavItems.filter(item => {
    if ((item as any).hideForMaintenance && userData?.userType === 'se_maintenance') {
      return false
    }
    return true
  })

  // Secondary navigation items
  const secondaryNavItems = [
    {
      href: "/configuracion",
      label: "Configuración",
      icon: Settings,
    },
    {
      href: "/ayuda",
      label: "Ayuda",
      icon: HelpCircle,
    },
  ]

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Animation variants
  const sidebarVariants = {
    expanded: {
      width: "280px",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    collapsed: {
      width: "80px",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  }

  const mobileSidebarVariants = {
    open: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    closed: {
      x: "-100%",
      opacity: 0.5,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  }

  const itemVariants = {
    expanded: {
      opacity: 1,
      transition: {
        delay: 0.1,
      },
    },
    collapsed: {
      opacity: 0,
      transition: {
        duration: 0.1,
      },
    },
  }

  const iconVariants = {
    expanded: { rotate: 0 },
    collapsed: { rotate: 180 },
  }

  // Mobile toggle button
  const MobileToggle = () => (
    <div
      className={`fixed top-4 left-4 z-50 lg:hidden transition-all duration-300 ${isScrolled ? "bg-white/80 backdrop-blur-md shadow-md rounded-full" : ""}`}
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="bg-white text-green-700 p-2 rounded-full shadow-lg border border-green-100 flex items-center justify-center"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </motion.button>
    </div>
  )

  // Header component that shows on scroll
  const FloatingHeader = () => {
    if (!isScrolled || isMobile) return null

    return (
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 right-0 left-0 z-40 bg-white/80 backdrop-blur-md shadow-sm border-b border-green-100 py-2 px-4 ml-[280px] transition-all duration-300"
      >
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center">
            <h2 className="text-lg font-medium text-green-800">
              {pathname === "/dashboard" && "Dashboard"}
              {pathname === "/solicitud-permisos" && "Solicitud de Permisos"}
              {pathname === "/solicitudes-global" && "Mis Solicitudes"}
              {pathname === "/notificaciones" && "Notificaciones"}
              {pathname === "/mensajes" && "Mensajes"}
            </h2>
          </div>

          {userData && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-green-700 hidden md:inline-block">{userData.name}</span>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-xs">
                  {userData ? getUserInitials(userData.name) : "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  // Sidebar content (shared between mobile and desktop)
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* User profile section */}
      <div className="p-4 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="flex items-center">
          <Avatar className="h-10 w-10 border-2 border-white/30">
            {userData?.avatar ? (
              <AvatarImage src={userData.avatar || "/placeholder.svg"} alt={userData.name} />
            ) : (
              <AvatarFallback className="bg-white/20 text-white">
                {userData ? getUserInitials(userData.name) : "U"}
              </AvatarFallback>
            )}
          </Avatar>

          {isExpanded && (
            <motion.div variants={itemVariants} className="ml-3 overflow-hidden">
              <p className="font-medium text-sm truncate">{userData?.name || "Usuario"}</p>
              <p className="text-xs text-green-100 truncate">{userData?.role || "Colaborador"}</p>
            </motion.div>
          )}

          {!isMobile && (
            <motion.button
              variants={iconVariants}
              initial={isExpanded ? "expanded" : "collapsed"}
              animate={isExpanded ? "expanded" : "collapsed"}
              onClick={() => setIsExpanded(!isExpanded)}
              className={`${isExpanded ? "ml-auto" : "mx-auto mt-2"} bg-white/20 p-1 rounded-full hover:bg-white/30 transition-colors`}
            >
              {isExpanded ? (
                <ChevronLeft className="h-4 w-4 text-white" />
              ) : (
                <ChevronRight className="h-4 w-4 text-white" />
              )}
            </motion.button>
          )}
        </div>
      </div>

      {/* Search bar */}
      <div className="px-3 py-4 border-b border-green-100">
        <div className="relative">
          <Input
            type="text"
            placeholder={isExpanded ? "Buscar..." : ""}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={cn(
              "pl-9 py-2 h-10 bg-green-50/50 border-green-100 focus-visible:ring-green-500 focus-visible:border-green-500 rounded-xl transition-all",
              !isExpanded && !isMobile && "w-full p-2 pl-8",
            )}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
        </div>
      </div>

      {/* Main navigation */}
      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar px-3">
        <ul className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href
            const ItemIcon = item.icon

            return (
              <li key={item.href}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={item.href} passHref>
                        <motion.div
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "flex items-center px-3 py-2.5 rounded-xl relative group",
                            isActive
                              ? "bg-gradient-to-r from-green-500 to-green-600 text-white font-medium"
                              : "text-green-800 hover:bg-green-50",
                          )}
                        >
                          <div
                            className={cn(
                              "flex items-center justify-center h-9 w-9 rounded-xl",
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-green-100/80 text-green-600 group-hover:bg-green-100",
                            )}
                          >
                            <ItemIcon className="h-[18px] w-[18px]" />
                          </div>

                          {isExpanded && (
                            <motion.span variants={itemVariants} className="ml-3 truncate">
                              {item.label}
                            </motion.span>
                          )}

                          {item.badge && isExpanded && (
                            <motion.div variants={itemVariants} className="ml-auto">
                              <Badge
                                className={cn(
                                  "h-5 px-1.5",
                                  isActive ? "bg-white/20 text-white" : "bg-green-100 text-green-700",
                                )}
                              >
                                {item.badge}
                              </Badge>
                            </motion.div>
                          )}

                          {item.badge && !isExpanded && (
                            <div className="absolute -top-1 -right-1">
                              <Badge className="h-4 w-4 p-0 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px]">
                                {item.badge}
                              </Badge>
                            </div>
                          )}
                        </motion.div>
                      </Link>
                    </TooltipTrigger>
                    {!isExpanded && !isMobile && (
                      <TooltipContent side="right" className="bg-green-700 text-white border-none">
                        <p>{item.label}</p>
                        {item.badge && <Badge className="ml-2 bg-white/20">{item.badge}</Badge>}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </li>
            )
          })}
        </ul>

        {/* Secondary navigation */}
        <div className="mt-6">
          <div className="px-3 mb-2">
            <h3
              className={cn(
                "text-xs uppercase font-semibold text-green-800/70",
                !isExpanded && !isMobile && "text-center",
              )}
            >
              {isExpanded ? "Configuración" : ""}
            </h3>
          </div>

          <ul className="space-y-1">
            {secondaryNavItems.map((item) => {
              const isActive = pathname === item.href
              const ItemIcon = item.icon

              return (
                <li key={item.href}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={item.href} passHref>
                          <motion.div
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                              "flex items-center px-3 py-2 rounded-xl relative group",
                              isActive
                                ? "bg-gradient-to-r from-green-500 to-green-600 text-white font-medium"
                                : "text-green-800 hover:bg-green-50",
                            )}
                          >
                            <div
                              className={cn(
                                "flex items-center justify-center h-8 w-8 rounded-lg",
                                isActive
                                  ? "bg-white/20 text-white"
                                  : "bg-green-100/80 text-green-600 group-hover:bg-green-100",
                              )}
                            >
                              <ItemIcon className="h-4 w-4" />
                            </div>

                            {isExpanded && (
                              <motion.span variants={itemVariants} className="ml-3 truncate text-sm">
                                {item.label}
                              </motion.span>
                            )}
                          </motion.div>
                        </Link>
                      </TooltipTrigger>
                      {!isExpanded && !isMobile && (
                        <TooltipContent side="right" className="bg-green-700 text-white border-none">
                          <p>{item.label}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-green-100">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50/50 rounded-xl",
            !isExpanded && !isMobile && "justify-center px-0",
          )}
          onClick={() => {
            localStorage.removeItem("accessToken")
            localStorage.removeItem("userCode")
            window.location.href = "/"
          }}
        >
          <LogOut className="h-5 w-5" />
          {isExpanded && (
            <motion.span variants={itemVariants} className="ml-2">
              Cerrar sesión
            </motion.span>
          )}
        </Button>
      </div>
    </div>
  )

  // Mobile sidebar
  const MobileSidebar = () => (
    <AnimatePresence>
      {isMobileOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={() => setIsMobileOpen(false)}
          />
          <motion.div
            ref={sidebarRef}
            initial="closed"
            animate="open"
            exit="closed"
            variants={mobileSidebarVariants}
            className="fixed top-0 left-0 bottom-0 w-[280px] z-50 bg-white shadow-xl border-r border-green-100"
          >
            <SidebarContent />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  // Desktop sidebar
  const DesktopSidebar = () => (
    <motion.div
      variants={sidebarVariants}
      initial={isExpanded ? "expanded" : "collapsed"}
      animate={isExpanded ? "expanded" : "collapsed"}
      className={cn(
        "hidden lg:flex flex-col h-screen bg-white border-r border-green-100 shadow-sm fixed top-0 left-0 z-30",
        isExpanded ? "w-[280px]" : "w-[80px]",
      )}
    >
      <SidebarContent />
    </motion.div>
  )

  return (
    <>
      <MobileToggle />
      <MobileSidebar />
      <DesktopSidebar />
      <AnimatePresence>{isScrolled && <FloatingHeader />}</AnimatePresence>
      <div
        className={cn(
          "min-h-screen transition-all duration-300",
          isMobile ? "pl-0" : isExpanded ? "lg:pl-[280px]" : "lg:pl-[80px]",
        )}
      >
        {/* Main content would go here */}
      </div>
    </>
  )
}
