"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, useAnimation, useInView, useSpring, useTransform, useMotionValue } from "framer-motion"
import { 
  Bell, 
  CalendarCheck, 
  CalendarX, 
  Clock, 
  FileText, 
  MoreHorizontal, 
  RefreshCw, 
  Search,
  Briefcase,
  List,
  CheckCircle,
  AlertCircle,
  XCircle,
  Award,
  TrendingUp,
  Star,
  ArrowRight,
  Zap,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X
} from "lucide-react"
import Link from "next/link"
import { 
  Card as UICard, 
  CardContent as UICardContent, 
  CardHeader as UICardHeader, 
  CardTitle as UICardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Toaster } from "react-hot-toast"
import toast from "react-hot-toast"
import LoadingOverlay from "../../components/loading-overlay"
import { EnhancedNotifications } from "./EnhancedNotifications"
import { Card, CardContent } from "@/components/ui/card"
import BottomNavigation from "@/components/BottomNavigation"
import { Skeleton } from "@/components/ui/skeleton"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import useUserData from '../hooks/useUserData'

interface NotificationItem {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  type: string;
  message: string;
  date: string;
  created_at: string;
  isNew: boolean;
  details?: Record<string, unknown>;
}

// Enhanced animation component
const FadeInWhenVisible: React.FC<{
  children: React.ReactNode
  delay?: number
  className?: string
  direction?: "up" | "down" | "left" | "right"
}> = ({ children, delay = 0, className = "", direction = "up" }) => {
  const controls = useAnimation()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })

  useEffect(() => {
    if (inView) {
      controls.start("visible")
    }
  }, [controls, inView])

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === "up" ? 40 : direction === "down" ? -40 : 0,
      x: direction === "left" ? 40 : direction === "right" ? -40 : 0,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.7,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  }

  return (
    <motion.div ref={ref} animate={controls} initial="hidden" variants={variants} className={className}>
      {children}
    </motion.div>
  )
}

// Enhanced interactive card component
interface InteractiveCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void | null
  delay?: number
  hoverScale?: number
}

const InteractiveCard: React.FC<InteractiveCardProps> = ({
  children,
  className = "",
  onClick = null,
  delay = 0,
  hoverScale = 1.03,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const springConfig = { stiffness: 400, damping: 30 }
  const scale = useSpring(1, springConfig)
  const y = useSpring(0, springConfig)
  const rotateX = useSpring(0, springConfig)
  const boxShadow = useTransform(
    scale,
    [1, hoverScale],
    ["0px 4px 20px rgba(16, 185, 129, 0.1)", "0px 20px 60px rgba(16, 185, 129, 0.25)"],
  )

  useEffect(() => {
    scale.set(isHovered ? hoverScale : 1)
    y.set(isHovered ? -8 : 0)
    rotateX.set(isHovered ? 2 : 0)
  }, [isHovered, scale, y, rotateX, hoverScale])

  return (
    <motion.div
      className={`${className} overflow-hidden cursor-pointer transform-gpu`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick || undefined}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ scale, y, rotateX, boxShadow }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  )
}

// Enhanced animated counter
const AnimatedCounter: React.FC<{
  value: number
  duration?: number
  className?: string
  prefix?: string
  suffix?: string
}> = ({ value, duration = 2, className = "", prefix = "", suffix = "" }) => {
  const nodeRef = useRef<HTMLSpanElement>(null)
  const [isInView, setIsInView] = useState(false)
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0.25,
  })

  useEffect(() => {
    if (isInView) {
      motionValue.set(value)
    }
  }, [motionValue, value, isInView])

  useEffect(() => {
    const node = nodeRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
      },
      { threshold: 0.1 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (nodeRef.current) {
        nodeRef.current.textContent = `${prefix}${Math.round(latest)}${suffix}`
      }
    })
    return () => unsubscribe()
  }, [springValue, prefix, suffix])

  return (
    <span ref={nodeRef} className={className}>
      {prefix}0{suffix}
    </span>
  )
}

// Enhanced search bar
const SearchBar: React.FC<{ onSearch: (query: string) => void }> = ({ onSearch }) => {
  const [query, setQuery] = useState("")

  const handleSearch = (value: string) => {
    setQuery(value)
    onSearch(value)
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
      <Input
        placeholder="Buscar solicitudes..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-10 border-green-200 focus:border-green-500 focus:ring-green-500 bg-white rounded-xl"
      />
    </div>
  )
}

export default function Dashboard() {
  const { userData, isLoading: isUserLoading } = useUserData()
  const [isLoading, setIsLoading] = useState(true)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [hasNewNotification, setHasNewNotification] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [statsData, setStatsData] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  })

  // Actualizar tiempo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Cargar solicitudes cuando los datos de usuario estén disponibles
  useEffect(() => {
    if (userData && userData.code) {
      fetchRequests(userData.code)
    }
  }, [userData])

  // Actualizar estado de carga
  useEffect(() => {
    setIsLoading(isUserLoading)
  }, [isUserLoading])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date")
      }
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Fecha no disponible"
    }
  }

  // Enhanced refresh function
  const refreshData = () => {
    setRefreshing(true)
    if (userData && userData.code) {
      fetchRequests(userData.code)
        .then(() => {
          toast.success("¡Datos actualizados correctamente!", {
            icon: "✅",
            style: {
              borderRadius: "12px",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#fff",
              fontWeight: "500",
            },
          })
        })
        .catch((error) => {
          toast.error("Error al actualizar los datos", {
            icon: "❌",
            style: {
              borderRadius: "12px",
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              color: "#fff",
              fontWeight: "500",
            },
          })
        })
        .finally(() => {
          setTimeout(() => {
            setRefreshing(false)
          }, 1000)
        })
    }
  }

  const fetchRequests = async (userCode: string) => {
    setIsDataLoading(true)
    let demoDataUsed = false
    try {
      const token = localStorage.getItem("accessToken")
      if (!token) {
        demoDataUsed = true
        return
      }

      const response = await fetch('https://solicitud-permisos.sao6.com.co/api/admin/solicitudes', {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (!data || data.length === 0) {
          demoDataUsed = true
          return
        }

        const formattedData = data.map((item: any) => ({
          id: item.id || String(Math.random()),
          status: item.status || "pending",
          type: item.tipo_novedad || "Solicitud",
          message: `Tu solicitud para ${item.tipo_novedad} ${
            item.status === "approved"
              ? "ha sido aprobada"
              : item.status === "rejected"
                ? "ha sido rechazada"
                : "está pendiente de revisión"
          }.`,
          date: formatDate(item.createdAt || new Date().toISOString()),
          created_at: item.createdAt || new Date().toISOString(),
          isNew: new Date(item.createdAt).getTime() > Date.now() - 86400000,
          details: {
            requestDate: formatDate(item.createdAt || new Date().toISOString()),
            approvedBy: item.status === "approved" ? "Supervisor" : undefined,
            rejectedBy: item.status === "rejected" ? "Supervisor" : undefined,
            pendingWith: item.status === "pending" ? "Departamento de RRHH" : undefined,
            comments:
              item.respuesta ||
              (item.status === "approved"
                ? "Aprobado según política."
                : item.status === "rejected"
                  ? "No cumple con los requisitos establecidos."
                  : "Pendiente de revisión."),
            startDate: item.fecha || undefined,
            requestedShift: item.turno || undefined,
          },
        }))

        setNotifications(formattedData)
        setHasNewNotification(formattedData.some((n: any) => n.isNew))
        localStorage.setItem("dashboardNotifications", JSON.stringify(formattedData))

        const totalRequests = formattedData.length
        const approvedRequests = formattedData.filter((item: NotificationItem) => item.status === "approved").length
        const pendingRequests = formattedData.filter((item: NotificationItem) => item.status === "pending").length
        const rejectedRequests = formattedData.filter((item: NotificationItem) => item.status === "rejected").length

        setStatsData({
          total: totalRequests,
          approved: approvedRequests,
          pending: pendingRequests,
          rejected: rejectedRequests,
        })
      } else {
        demoDataUsed = true
      }
    } catch (error) {
      console.error("Error fetching requests:", error)
      demoDataUsed = true
    } finally {
      setIsDataLoading(false)
    }

    return demoDataUsed
  }

  const markNotificationsAsViewed = () => {
    const currentDate = new Date().toISOString()
    const updatedNotifications = notifications.map((notification) => ({
      ...notification,
      isNew: false,
    }))

    notifications.forEach((notification) => {
      localStorage.setItem(`notification_${notification.id}_viewed`, currentDate)
    })

    setNotifications(updatedNotifications)
    localStorage.setItem("dashboardNotifications", JSON.stringify(updatedNotifications))
    setHasNewNotification(false)
  }

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Get only the last 2 unviewed notifications for the popup
  const recentNotifications = notifications.filter((n) => n.isNew).slice(0, 2)

  // Format current time
  const formattedTime = currentTime.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const formattedDate = currentTime.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  // If still loading, show loading overlay
  if (isLoading) {
    return <LoadingOverlay />
  }

  // Enhanced quick access cards data
  const quickAccessCards = [
    {
      title: "Solicitar Permiso",
      description: "Crea una nueva solicitud de permiso laboral de forma rápida y sencilla",
      icon: FileText,
      href: "/solicitud-permisos",
      gradient: "from-green-400 via-green-500 to-green-600",
      bgPattern: "bg-green-50",
      iconBg: "bg-green-100",
      textColor: "text-green-700",
      action: "Crear solicitud",
      features: ["Proceso simplificado", "Aprobación rápida", "Seguimiento en tiempo real"],
    },
    {
      title: "Postulaciones",
      description: "Gestiona turnos, disponibilidad y oportunidades laborales",
      icon: FileText, // Changed from Briefcase to FileText
      href: "/solicitud-equipo",
      gradient: "from-emerald-400 via-emerald-500 to-emerald-600",
      bgPattern: "bg-emerald-50",
      iconBg: "bg-emerald-100",
      textColor: "text-emerald-700",
      action: "Ver postulaciones",
      features: ["Turnos disponibles", "Gestión flexible", "Notificaciones automáticas"],
    },
    {
      title: "Mis Solicitudes",
      description: "Revisa el estado y historial completo de todas tus solicitudes",
      icon: FileText, // Changed from List to FileText
      href: "/solicitudes-global",
      gradient: "from-teal-400 via-teal-500 to-teal-600",
      bgPattern: "bg-teal-50",
      iconBg: "bg-teal-100",
      textColor: "text-teal-700",
      action: "Ver solicitudes",
      badge: hasNewNotification,
      features: ["Historial completo", "Estados actualizados", "Documentos adjuntos"],
    },
  ]

  const statsCards = [
    {
      title: "Total Solicitudes",
      value: statsData.total,
      icon: FileText,
      gradient: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      borderColor: "border-green-200",
      percentage: 100,
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Aprobadas",
      value: statsData.approved,
      icon: FileText, // Changed from CheckCircle to FileText
      gradient: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
      borderColor: "border-emerald-200",
      percentage: statsData.total > 0 ? Math.round((statsData.approved / statsData.total) * 100) : 0,
      trend: "+8%",
      trendUp: true,
    },
    {
      title: "Pendientes",
      value: statsData.pending,
      icon: FileText, // Changed from AlertCircle to FileText
      gradient: "from-yellow-500 to-yellow-600",
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
      borderColor: "border-yellow-200",
      percentage: statsData.total > 0 ? Math.round((statsData.pending / statsData.total) * 100) : 0,
      trend: "-3%",
      trendUp: false,
    },
    {
      title: "Rechazadas",
      value: statsData.rejected,
      icon: FileText, // Changed from XCircle to FileText
      gradient: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
      borderColor: "border-red-200",
      percentage: statsData.total > 0 ? Math.round((statsData.rejected / statsData.total) * 100) : 0,
      trend: "-5%",
      trendUp: false,
    },
  ]

  // Cabecera personalizada con nombre, código y cargo
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <Toaster position="top-right" />
        {/* Cabecera personalizada */}
        <header className="bg-white/95 backdrop-blur-md shadow-lg border-b-2 border-green-100 sticky top-0 z-50">
          <div className="container mx-auto max-w-7xl px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Logo and title */}
              <div className="flex items-center space-x-4">
                <motion.div
                  className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-2xl shadow-lg"
                  initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ duration: 0.6, ease: "backOut" }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <img src="/logo-sao6-blanco.webp" alt="SAO6" width={28} height={28} className="h-7 w-auto" />
                </motion.div>
                <div className="hidden sm:block">
                  <motion.h1
                    className="text-xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    Link de Permisos
                  </motion.h1>
                  <motion.p
                    className="text-sm text-green-600 font-medium"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    SAO6 • {userData.code}
                  </motion.p>
                </div>
              </div>

              {/* Search bar on desktop */}
              <div className="hidden lg:block flex-1 max-w-md mx-8">
                <SearchBar onSearch={setSearchQuery} />
              </div>

              {/* Header actions */}
              <div className="flex items-center space-x-3">
                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>

                {/* Refresh button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={refreshData}
                      disabled={refreshing}
                      className="rounded-xl hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${refreshing ? "animate-spin text-green-600" : "text-green-600"}`}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Actualizar datos</TooltipContent>
                </Tooltip>

                {/* Current time */}
                <motion.div
                  className="hidden md:flex items-center bg-green-50 border border-green-200 px-4 py-2 rounded-xl"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Clock className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm font-semibold text-green-700">{formattedTime}</span>
                </motion.div>

                {/* User avatar and menu */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="p-0 h-auto rounded-full relative">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Avatar className="h-11 w-11 border-3 border-green-200 shadow-lg ring-2 ring-green-100">
                          <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold text-lg">
                            {getUserInitials(userData.name)}
                          </AvatarFallback>
                        </Avatar>
                        {hasNewNotification && (
                          <motion.span
                            className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-white shadow-lg"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                          />
                        )}
                      </motion.div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 mr-4 rounded-2xl shadow-2xl border-0 overflow-hidden" align="end">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-14 w-14 border-3 border-white/30 shadow-lg">
                          <AvatarFallback className="bg-white/20 text-white font-bold text-xl">
                            {getUserInitials(userData.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-bold text-white text-lg">{userData.name}</h3>
                          <p className="text-green-100 text-sm font-medium">{userData.cargo}</p>
                          <Badge className="bg-white/20 text-white text-xs mt-1 border-0">{userData.code}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-2 bg-white">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start rounded-xl hover:bg-green-50 hover:text-green-700"
                      >
                        <Settings className="h-4 w-4 mr-3 text-green-600" />
                        Configuración
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start rounded-xl hover:bg-green-50 hover:text-green-700"
                      >
                        <Bell className="h-4 w-4 mr-3 text-green-600" />
                        Notificaciones
                        {hasNewNotification && <Badge className="ml-auto bg-red-500 text-white text-xs">Nuevo</Badge>}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start rounded-xl hover:bg-green-50 hover:text-green-700"
                      >
                        <HelpCircle className="h-4 w-4 mr-3 text-green-600" />
                        Ayuda y soporte
                      </Button>
                      <div className="pt-2 border-t border-green-100">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full rounded-xl bg-red-500 hover:bg-red-600"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Cerrar Sesión
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden mt-4 pt-4 border-t border-green-100"
              >
                <SearchBar onSearch={setSearchQuery} />
              </motion.div>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="container mx-auto max-w-7xl px-4 py-8">
          {/* Enhanced greeting and date */}
          <FadeInWhenVisible>
            <div className="mb-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-center lg:text-left"
              >
                <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-700 via-emerald-600 to-green-600 bg-clip-text text-transparent mb-3">
                  ¡Hola, {userData.name.split(" ")[0]}!
                  <motion.span
                    className="inline-block ml-3"
                    animate={{
                      rotate: [0, 20, -20, 20, 0],
                      scale: [1, 1.3, 1, 1.3, 1],
                    }}
                    transition={{ duration: 2, delay: 1.5, repeat: 0 }}
                  >
                    👋
                  </motion.span>
                </h2>
                <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-2 lg:space-y-0">
                  <p className="text-green-600 text-lg font-medium capitalize flex items-center justify-center lg:justify-start">
                    <CalendarCheck className="h-5 w-5 mr-2" />
                    {formattedDate}
                  </p>
                  <div className="hidden lg:block w-2 h-2 bg-green-400 rounded-full"></div>
                  <p className="text-emerald-600 text-lg font-medium flex items-center justify-center lg:justify-start">
                    <Award className="h-5 w-5 mr-2" />
                    {userData.cargo}
                  </p>
                </div>
                <motion.p
                  className="text-gray-600 text-lg mt-4 max-w-3xl mx-auto lg:mx-0 leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  Bienvenido al sistema de gestión de permisos y solicitudes SAO6. Gestiona tus permisos, postulaciones
                  y revisa el estado de tus solicitudes de manera fácil, rápida y eficiente.
                </motion.p>
              </motion.div>
            </div>
          </FadeInWhenVisible>

          {/* Enhanced statistics */}
          <FadeInWhenVisible delay={0.2}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10">
              {statsCards.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.1, duration: 0.6 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group"
                >
                  <Card
                    className={`border-2 ${stat.borderColor} shadow-lg hover:shadow-xl transition-all duration-300 bg-white overflow-hidden relative rounded-2xl`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                    />
                    <CardContent className="p-6 relative z-10 flex flex-col h-full justify-between">
                      <div className="flex items-center justify-between mb-4">
                        <motion.div
                          className={`${stat.bgColor} p-4 rounded-full shadow-md`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1 + index * 0.1, duration: 0.5 }}
                        >
                          <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                        </motion.div>
                        <motion.div
                          className={`flex items-center text-sm font-semibold ${stat.trendUp ? "text-green-600" : "text-red-600"}`}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                        >
                          <TrendingUp className={`h-4 w-4 mr-1 ${stat.trendUp ? "" : "rotate-180"}`} />
                          {stat.trend}
                        </motion.div>
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-lg font-semibold text-gray-700 mb-2">{stat.title}</h4>
                        {isDataLoading ? (
                          <Skeleton className="h-10 w-24 bg-green-100" />
                        ) : (
                          <p className="text-4xl font-bold text-gray-900">
                            <AnimatedCounter value={stat.value} duration={1.5} />
                          </p>
                        )}
                      </div>
                      <div className="mt-4">
                        <Progress
                          value={stat.percentage}
                          className="h-2 bg-gray-100 rounded-full"
                        />
                        <p className="text-xs text-gray-500 mt-1 text-right">{stat.percentage}% del total</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </FadeInWhenVisible>

          {/* Enhanced quick access */}
          <FadeInWhenVisible delay={0.4}>
            <div className="mb-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Accesos Rápidos</h3>
                  <p className="text-gray-600">Gestiona tus solicitudes y permisos de forma eficiente</p>
                </div>
                <Button
                  variant="outline"
                  className="hidden lg:flex border-green-200 text-green-700 hover:bg-green-50 bg-transparent rounded-xl"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Acceso rápido
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {quickAccessCards.map((card, index) => (
                  <Link href={card.href} key={card.title}>
                    <InteractiveCard delay={index * 0.15} hoverScale={1.05}>
                      <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group h-80 relative bg-white">
                        {/* Background pattern */}
                        <div className={`absolute inset-0 ${card.bgPattern} opacity-30`} />
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-all duration-500`}
                        />

                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12 group-hover:scale-110 transition-transform duration-500" />

                        <CardContent className="p-6 lg:p-8 h-full flex flex-col justify-between relative z-10">
                          <div className="flex items-start justify-between">
                            <div
                              className={`${card.iconBg} p-4 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300`}
                            >
                              <card.icon className="h-7 w-7 text-green-600" />
                            </div>
                            {card.badge && (
                              <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                              >
                                <Badge className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                                  Nuevo
                                </Badge>
                              </motion.div>
                            )}
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-xl lg:text-2xl font-bold text-gray-900 group-hover:text-green-700 transition-colors duration-300">
                              {card.title}
                            </h4>
                            <p className="text-gray-600 text-sm lg:text-base leading-relaxed">{card.description}</p>

                            {/* Features list */}
                            <div className="space-y-2">
                              {card.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center text-xs text-gray-500">
                                  <Star className="h-3 w-3 text-green-500 mr-2 fill-current" />
                                  {feature}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4">
                            <span className="text-sm font-semibold text-green-600 group-hover:text-green-700 transition-colors">
                              {card.action}
                            </span>
                            <motion.div
                              className="bg-green-100 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300"
                              initial={{ x: -10, opacity: 0 }}
                              whileHover={{ x: 0, opacity: 1 }}
                            >
                              <ArrowRight className="h-5 w-5 text-green-600" />
                            </motion.div>
                          </div>
                        </CardContent>
                      </Card>
                    </InteractiveCard>
                  </Link>
                ))}
              </div>
            </div>
          </FadeInWhenVisible>
        </main>

        {/* Bottom navigation */}
        <BottomNavigation hasNewNotification={hasNewNotification} />
      </div>
    </TooltipProvider>
  )
}
