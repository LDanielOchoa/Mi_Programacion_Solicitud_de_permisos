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
  ChevronDown,
  LogOut,
  Menu,
  X
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Toaster } from "react-hot-toast"
import toast from "react-hot-toast"
import dynamic from "next/dynamic"

// Lazy loaded components
const BottomNavigation = dynamic(() => import("@/components/BottomNavigation"), {
  ssr: false,
  loading: () => <div className="h-16 w-full fixed bottom-0 bg-white border-t border-gray-100 animate-pulse" />
})

const EnhancedNotifications = dynamic(() => import("./EnhancedNotifications").then(mod => mod.EnhancedNotifications), {
  ssr: false
})

const LoadingOverlay = dynamic(() => import("@/components/login/LoadingOverlay"), { ssr: false })

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
}) => {
  const springConfig = { stiffness: 400, damping: 30 }
  const scale = useSpring(1, springConfig)
  const y = useSpring(0, springConfig)
  const rotateX = useSpring(0, springConfig)
  const boxShadow = "0px 2px 10px rgba(0, 0, 0, 0.02)"

  return (
    <motion.div
      className={`${className} overflow-hidden cursor-pointer transform-gpu`}
      onClick={onClick || undefined}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ scale, y, rotateX, boxShadow }}
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

// Dashboard Skeleton Component
const DashboardSkeleton = () => (
  <div className="container mx-auto max-w-7xl px-4 py-8 animate-pulse">
    {/* Greeting Skeleton */}
    <div className="mb-10 lg:flex lg:items-end lg:justify-between border-b border-gray-100 pb-10">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-16 w-64 md:h-20 md:w-96 rounded-2xl" />
        <div className="flex gap-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
    </div>

    {/* Stats Skeleton */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="border border-gray-100 shadow-sm rounded-2xl h-40">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Quick Access Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
      {[1, 2].map((i) => (
        <Card key={i} className="border border-gray-100 shadow-sm rounded-3xl h-80">
          <CardContent className="p-8 flex flex-col justify-between h-full">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
)

// Enhanced search bar
const SearchBar: React.FC<{ onSearch: (query: string) => void }> = ({ onSearch }) => {
  const [query, setQuery] = useState("")

  const handleSearch = (value: string) => {
    setQuery(value)
    onSearch(value)
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#4cc253]" />
      <Input
        placeholder="Buscar solicitudes..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-10 border-gray-100 focus:border-[#4cc253] focus:ring-[#4cc253] bg-white rounded-xl shadow-sm"
      />
    </div>
  )
}

export default function Dashboard() {
  const { userData, isLoading: isUserLoading, error: userError } = useUserData()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [hasNewNotification, setHasNewNotification] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null)

  // Protect route
  useEffect(() => {
    if (!isUserLoading && !userData) {
      router.push("/")
    }
  }, [isUserLoading, userData, router])

  const [statsData, setStatsData] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!isUserLoading && !userData) {
      router.push('/')
    }
  }, [isUserLoading, userData, router])

  // Load user photo
  useEffect(() => {
    console.log('Debug - userData completo:', userData)
    const cedulaToUse = userData?.cedula || userData?.code
    console.log('Debug - Cédula a usar para foto:', cedulaToUse)
    if (cedulaToUse) {
      loadUserPhoto(cedulaToUse)
    }
  }, [userData])

  // Function to try loading user photo using backend proxy
  const loadUserPhoto = async (cedula: string) => {
    console.log('Debug - Intentando cargar foto para cédula:', cedula)

    try {
      // Usar el endpoint proxy del backend para evitar problemas de CORS
      const imageUrl = `/api/images/empleado/${cedula}`
      console.log(`Intentando cargar imagen via proxy: ${imageUrl}`)

      // Verificar si la imagen existe usando fetch al proxy
      const response = await fetch(imageUrl, { method: 'HEAD' })

      if (response.ok) {
        console.log(`Imagen encontrada para cédula ${cedula}`)
        setUserPhotoUrl(imageUrl)
        return
      } else {
        console.log(`No se encontró imagen para cédula ${cedula} - Status: ${response.status}`)
        setUserPhotoUrl(null)
      }
    } catch (error) {
      console.log('Error al cargar imagen via proxy:', error)
      setUserPhotoUrl(null)
    }
  }

  // Logout function
  const handleLogout = () => {
    // Clear all localStorage data
    localStorage.clear()

    // Clear component state
    setNotifications([])
    setStatsData({ total: 0, approved: 0, pending: 0, rejected: 0 })
    setUserPhotoUrl(null)
    setHasNewNotification(false)

    // Force page reload to clear all cached data and state
    window.location.href = '/'
  }

  // Actualizar tiempo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

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

      const response = await fetch('/api/admin/solicitudes', {
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
          message: `Tu solicitud para ${item.tipo_novedad} ${item.status === "approved"
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

  // If still loading user or no user data (before redirect), show full page skeleton
  if (isUserLoading || !userData) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-white border-b border-gray-100 h-20">
          <div className="container mx-auto max-w-7xl px-4 flex items-center justify-between h-full">
            <div className="flex items-center space-x-4">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-32 rounded-full hidden md:block" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        </header>
        <DashboardSkeleton />
      </div>
    )
  }

  // Enhanced quick access cards data - filter based on user type
  const allQuickAccessCards = [
    {
      title: "Solicitar Permiso",
      description: "Crea una nueva solicitud de permiso operacional rápidamente",
      icon: FileText,
      href: "/solicitud-permisos",
      iconBg: "bg-green-50",
      iconColor: "text-[#4cc253]",
      action: "Crear solicitud",
    },
    {
      title: "Mis Solicitudes",
      description: "Revisa el estado de tus gestiones en tiempo real",
      icon: List,
      href: "/solicitudes-global",
      iconBg: "bg-gray-50",
      iconColor: "text-gray-600",
      action: "Ver historial",
      badge: hasNewNotification,
      hideForMaintenance: false,
    },
  ]

  // Filter cards based on user type
  const quickAccessCards = allQuickAccessCards.filter(card => {
    if ((card as any).hideForMaintenance && userData?.userType === 'se_maintenance') {
      return false
    }
    return true
  })

  const statsCards = [
    {
      title: "Recibidas",
      value: statsData.total,
      icon: FileText,
      bgColor: "bg-white",
      iconColor: "text-[#4cc253]",
      borderColor: "border-gray-100",
    },
    {
      title: "Aprobadas",
      value: statsData.approved,
      icon: CheckCircle,
      bgColor: "bg-white",
      iconColor: "text-emerald-500",
      borderColor: "border-gray-100",
    },
    {
      title: "Pendientes",
      value: statsData.pending,
      icon: Clock,
      bgColor: "bg-white",
      iconColor: "text-amber-500",
      borderColor: "border-gray-100",
    },
    {
      title: "Rechazadas",
      value: statsData.rejected,
      icon: XCircle,
      bgColor: "bg-white",
      iconColor: "text-red-500",
      borderColor: "border-gray-100",
    },
  ]

  // Cabecera personalizada con nombre, código y cargo
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white relative overflow-hidden">
        <Toaster position="top-right" />
        {/* Cabecera simplificada y premium */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
          <div className="container mx-auto max-w-7xl px-4 h-20">
            <div className="flex items-center justify-between h-full">
              {/* Logo and title */}
              <div className="flex items-center space-x-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative w-10 h-10"
                >
                  <img src="/sao6.png" alt="SAO6" className="w-full h-full object-contain" />
                </motion.div>
                <div className="hidden sm:block">
                  <motion.h1
                    className="text-lg font-black text-gray-900 tracking-tight"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    Link de Permisos
                  </motion.h1>
                  <motion.p
                    className="text-xs text-gray-400 font-bold tracking-wider uppercase"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Control Operacional • {userData.code}
                  </motion.p>
                </div>
              </div>

              {/* Search bar on desktop */}
              <div className="hidden lg:block flex-1 max-w-md mx-8">
                <SearchBar onSearch={setSearchQuery} />
              </div>

              {/* Header actions */}
              <div className="flex items-center space-x-4">
                {/* Refresh button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={refreshData}
                  disabled={refreshing}
                  className="rounded-full hover:bg-gray-50 text-gray-400 hover:text-[#4cc253] transition-all"
                >
                  <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
                </Button>

                {/* Current time */}
                <div className="hidden md:flex items-center bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm font-bold text-gray-600">{formattedTime}</span>
                </div>

                {/* User avatar and menu */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="p-0 h-10 w-10 rounded-full ring-2 ring-gray-100 hover:ring-[#4cc253] transition-all overflow-hidden">
                      <Avatar className="h-full w-full">
                        {userPhotoUrl ? <AvatarImage src={userPhotoUrl} alt={userData.name} /> : null}
                        <AvatarFallback className="bg-[#4cc253] text-white font-bold">
                          {getUserInitials(userData.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-0 rounded-2xl shadow-2xl border-0 overflow-hidden" align="end">
                    <div className="p-6 text-center border-b border-gray-50">
                      <Avatar className="h-20 w-20 mx-auto mb-4 ring-4 ring-gray-50">
                        {userPhotoUrl ? <AvatarImage src={userPhotoUrl} alt={userData.name} /> : null}
                        <AvatarFallback className="bg-[#4cc253] text-white text-xl font-bold">
                          {getUserInitials(userData.name)}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-black text-gray-900 leading-tight">{userData.name}</h3>
                      <p className="text-sm text-gray-400 font-medium">{userData.cargo}</p>
                    </div>
                    <div className="p-4">
                      <Button onClick={handleLogout} variant="destructive" className="w-full rounded-xl font-bold py-6 gap-2 bg-red-50 text-red-600 hover:bg-red-100 border-0 shadow-none">
                        <LogOut className="h-4 w-4" />
                        Cerrar Sesión
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden rounded-full hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="container mx-auto max-w-7xl px-4 py-8">
          {/* Enhanced greeting and date */}
          <FadeInWhenVisible>
            <div className="mb-10 lg:flex lg:items-end lg:justify-between border-b border-gray-100 pb-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center lg:text-left space-y-2"
              >
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                  <span className="bg-green-50 text-[#4cc253] text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full border border-green-100">
                    Panel General
                  </span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">
                    v3.0 Secure
                  </span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-none mb-4">
                  Hola, <span className="text-[#4cc253]">{userData.name.split(" ")[0]}</span>
                </h2>
                <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-gray-400 font-bold text-sm tracking-tight">
                  <div className="flex items-center">
                    <CalendarCheck className="h-4 w-4 mr-2 text-[#4cc253]" />
                    <span className="capitalize">{formattedDate}</span>
                  </div>
                  <div className="hidden sm:block w-px h-4 bg-gray-200"></div>
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 mr-2 text-[#4cc253]" />
                    <span>{userData.cargo}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </FadeInWhenVisible>

          {/* Enhanced statistics */}
          <FadeInWhenVisible delay={0.2}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10">
              {statsCards.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1, duration: 0.6 }}
                  className="static"
                >
                  <Card
                    className={`border ${stat.borderColor} shadow-sm bg-white overflow-hidden relative rounded-2xl`}
                  >
                    <CardContent className="p-6 relative z-10 flex flex-col h-full justify-between">
                      <div className="flex items-center justify-between mb-4">
                        <motion.div
                          className={`${stat.bgColor} w-12 h-12 flex items-center justify-center rounded-xl shadow-sm border border-gray-50`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1 + index * 0.1, duration: 0.5 }}
                        >
                          <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
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
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </FadeInWhenVisible>

          {/* Enhanced quick access */}
          <FadeInWhenVisible delay={0.4}>
            <div className="mb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 lg:gap-8">
                {isDataLoading ? (
                  [1, 2].map((i) => (
                    <Card key={i} className="border border-gray-100 shadow-sm rounded-3xl h-80 animate-pulse">
                      <CardContent className="p-8 flex flex-col justify-between h-full">
                        <Skeleton className="h-14 w-14 rounded-2xl" />
                        <div className="space-y-4">
                          <Skeleton className="h-8 w-40" />
                          <Skeleton className="h-5 w-full" />
                          <Skeleton className="h-5 w-3/4" />
                        </div>
                        <div className="flex justify-between items-center">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  quickAccessCards.map((card, index) => (
                    <Link href={card.href} key={card.title}>
                      <InteractiveCard delay={index * 0.15}>
                        <Card className="border border-gray-100 shadow-sm transition-all duration-500 overflow-hidden h-80 relative bg-white rounded-3xl">

                          <CardContent className="p-6 lg:p-8 h-full flex flex-col justify-between relative z-10">
                            <div className="flex items-start justify-between">
                              <div
                                className={`${card.iconBg} w-14 h-14 flex items-center justify-center rounded-2xl shadow-sm border border-gray-100 transition-all duration-300`}
                              >
                                <card.icon className={`h-6 w-6 ${card.iconColor}`} />
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
                              <h4 className="text-2xl font-black text-gray-900 transition-colors duration-300 tracking-tight">
                                {card.title}
                              </h4>
                              <p className="text-gray-600 text-sm lg:text-base leading-relaxed">{card.description}</p>

                            </div>

                            <div className="flex items-center justify-between pt-4">
                              <span className="text-xs font-black text-[#4cc253] uppercase tracking-widest">
                                {card.action}
                              </span>
                              <div
                                className="bg-gray-50 rounded-full p-2 border border-gray-100"
                              >
                                <ArrowRight className="h-4 w-4 text-[#4cc253]" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </InteractiveCard>
                    </Link>
                  ))
                )}
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

