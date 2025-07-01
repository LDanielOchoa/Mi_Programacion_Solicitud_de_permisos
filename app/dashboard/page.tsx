"use client"

import { useState, useEffect, useRef } from "react"
import {
  motion,
  AnimatePresence,
  useAnimation,
  useInView,
  useSpring,
  useTransform,
  useMotionValue,
} from "framer-motion"
import {
  FileText,
  Briefcase,
  User,
  Settings,
  ChevronRight,
  Calendar,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Home,
  Clock,
  Sun,
  Cloud,
  CloudRain,
  BarChart3,
  Activity,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  Award,
  Layers,
  Bookmark,
  Cpu,
  Shield,
  Lightbulb,
  List,
  Bell,
  Eye,
  MessageCircle,
  ThumbsUp,
  Search,
  Filter,
  ArrowUpRight,
  HelpCircle,
  Plus,
  ArrowUp,
  ArrowDown,
  Inbox,
  Zap,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Toaster } from "react-hot-toast"
import toast from "react-hot-toast"
import LoadingOverlay from "../../components/loading-overlay"
import { EnhancedNotifications } from "./EnhancedNotifications"
import { WhatsNewModal } from "./WhatsNewModal"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import Cookies from "js-cookie"
import BottomNavigation from "@/components/BottomNavigation"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface NotificationItem {
  id: string
  status: "approved" | "rejected" | "pending"
  type: string
  message: string
  date: string
  created_at: string
  isNew: boolean
  details?: Record<string, unknown>
}

const COOKIE_NAME = "whats_new_modal_shown"
const COOKIE_EXPIRY = 30 // días

// Componente para animaciones al hacer scroll
const FadeInWhenVisible: React.FC<{
  children: React.ReactNode
  delay?: number
  className?: string
  direction?: "up" | "down" | "left" | "right"
}> = ({ children, delay = 0, className = "", direction = "up" }) => {
  const controls = useAnimation()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })

  useEffect(() => {
    if (inView) {
      controls.start("visible")
    }
  }, [controls, inView])

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === "up" ? 30 : direction === "down" ? -30 : 0,
      x: direction === "left" ? 30 : direction === "right" ? -30 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: 0.6,
        delay,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  return (
    <motion.div ref={ref} animate={controls} initial="hidden" variants={variants} className={className}>
      {children}
    </motion.div>
  )
}

// Componente para tarjetas interactivas
interface InteractiveCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void | null
  delay?: number
}

const InteractiveCard: React.FC<InteractiveCardProps> = ({ children, className = "", onClick = null, delay = 0 }) => {
  const [isHovered, setIsHovered] = useState(false)
  const springConfig = { stiffness: 300, damping: 30 }
  const scale = useSpring(1, springConfig)
  const y = useSpring(0, springConfig)
  const boxShadow = useTransform(
    scale,
    [1, 1.03],
    ["0px 4px 20px rgba(0, 0, 0, 0.05)", "0px 10px 30px rgba(0, 0, 0, 0.1)"],
  )

  useEffect(() => {
    scale.set(isHovered ? 1.03 : 1)
    y.set(isHovered ? -5 : 0)
  }, [isHovered, scale, y])

  return (
    <motion.div
      className={`${className} overflow-hidden`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick || undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      style={{ scale, y, boxShadow }}
    >
      {children}
    </motion.div>
  )
}

// Componente para contador animado
const AnimatedCounter: React.FC<{ value: number; duration?: number; className?: string }> = ({ value, duration = 1.5, className = "" }) => {
  const nodeRef = useRef<HTMLSpanElement>(null)
  const [isInView, setIsInView] = useState(false)
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, { duration: duration * 1000 })

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
        nodeRef.current.textContent = Math.round(latest).toString()
      }
    })
    return () => unsubscribe()
  }, [springValue])

  return (
    <span ref={nodeRef} className={className}>
      0
    </span>
  )
}

// Componente para estado vacío
interface EmptyStateProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, actionLabel, onAction }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-10 px-4 text-center"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-green-200 to-emerald-200 rounded-full opacity-30 animate-pulse"></div>
        <div className="relative bg-gradient-to-r from-green-100 to-emerald-100 p-6 rounded-full">
          <Icon className="h-12 w-12 text-emerald-600" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-emerald-800 mb-2">{title}</h3>
      <p className="text-emerald-600 max-w-md mb-6">{description}</p>
      {actionLabel && (
        <Button
          onClick={onAction}
          className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-full px-6"
        >
          {actionLabel}
        </Button>
      )}
    </motion.div>
  )
}

export default function Dashboard() {
  // Estados principales
  const [userData, setUserData] = useState({ name: "", code: "", role: "", avatar: "" })
  const [isLoading, setIsLoading] = useState(true)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [hasNewNotification, setHasNewNotification] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showWhatsNewModal, setShowWhatsNewModal] = useState(false)
  const [weatherData, setWeatherData] = useState({ temp: "24°C", condition: "Soleado", icon: Sun })
  const [refreshing, setRefreshing] = useState(false)
  const [statsData, setStatsData] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  })
  const [activeMetric, setActiveMetric] = useState("week")
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const activityData: any[] = [] // Define activityData as an empty array or fetch it from a valid source

  // Define trendData and maxTrendValue for the trend chart
  const trendData = [
    { label: "Lunes", value: 10 },
    { label: "Martes", value: 15 },
    { label: "Miércoles", value: 8 },
    { label: "Jueves", value: 12 },
    { label: "Viernes", value: 20 },
  ]
  const maxTrendValue = Math.max(...trendData.map((item) => item.value))

  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize modal state based on cookie
  useEffect(() => {
    const modalShown = Cookies.get(COOKIE_NAME)
    setShowWhatsNewModal(modalShown !== "true")
  }, [])

  // Actualizar tiempo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Simulación de carga de datos para demo
        setTimeout(() => {
          // Intentar obtener datos del usuario de la API real
          const token = localStorage.getItem("accessToken")

          if (token) {
            fetch("https://solicitud-permisos.sao6.com.co/api/auth/user", {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            })
              .then((response) => {
                if (response.ok) return response.json()
                throw new Error("Error fetching user data")
              })
              .then((data) => {
                setUserData({
                  name: data.name,
                  code: data.code,
                  role: data.role || "Colaborador",
                  avatar: data.avatar || "",
                })

                // Llamar a fetchRequests con el código de usuario
                fetchRequests(data.code)
              })
              .catch((error) => {
                console.error("Error fetching user data:", error)
                // Fallback a datos de demo
                setUserData({
                  name: "Carlos Rodríguez",
                  code: "CR-2023",
                  role: "Gerente de Proyectos",
                  avatar: "",
                })

                // Llamar a fetchRequests con un código de usuario de demo
                fetchRequests("CR-2023")
              })
          } else {
            // Fallback a datos de demo
            setUserData({
              name: "Carlos Rodríguez",
              code: "CR-2023",
              role: "Gerente de Proyectos",
              avatar: "",
            })

            // Llamar a fetchRequests con un código de usuario de demo
            fetchRequests("CR-2023")
          }

          // Simular datos del clima
          const weatherOptions = [
            { temp: "24°C", condition: "Soleado", icon: Sun },
            { temp: "22°C", condition: "Nublado", icon: Cloud },
            { temp: "19°C", condition: "Lluvioso", icon: CloudRain },
          ]
          setWeatherData(weatherOptions[Math.floor(Math.random() * weatherOptions.length)])

          setIsLoading(false)
        }, 1500)
      } catch (error) {
        console.error("Error fetching user data:", error)
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date")
      }

      // Formato: "22 de abril de 2025, 13:15"
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

  // Función para refrescar los datos
  const refreshData = () => {
    setRefreshing(true)
    fetchRequests(userData.code)
      .then(() => {
        toast.success("Datos actualizados correctamente", {
          icon: "🔄",
          style: {
            borderRadius: "16px",
            background: "#10b981",
            color: "#fff",
          },
        })
      })
      .catch((error) => {
        toast.error("Error al actualizar los datos", {
          icon: "❌",
          style: {
            borderRadius: "16px",
            background: "#ef4444",
            color: "#fff",
          },
        })
      })
      .finally(() => {
        setTimeout(() => {
          setRefreshing(false)
        }, 800)
      })
  }

  // Actualizar la función fetchRequests para usar datos reales de la API
  const fetchRequests = async (userCode: string) => {
    setIsDataLoading(true)
    let demoDataUsed = false // Flag to track if demo data was used

   

    try {
      const token = localStorage.getItem("accessToken")
      if (!token) {
        // Si no hay token, usar datos de demostración
        demoDataUsed = true
        return
      }

      // Obtener solicitudes reales de la API
      const response = await fetch("https://solicitud-permisos.sao6.com.co/api/solicitudes", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()

        // Si no hay datos, usar datos de demostración
        if (!data || data.length === 0) {
          demoDataUsed = true
          return
        }

        // Formatear las fechas y agregar la propiedad isNew
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
          isNew: new Date(item.createdAt).getTime() > Date.now() - 86400000, // Marcar como nuevo si es de las últimas 24 horas
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

        // Actualizar los datos de estadísticas
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
        // Si hay un error, usar datos de demostración
        demoDataUsed = true
      }
    } catch (error) {
      console.error("Error fetching requests:", error)
      // Si hay un error, usar datos de demostración
      demoDataUsed = true
    } finally {
      setIsDataLoading(false)
    }

    return demoDataUsed // Return whether demo data was used
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

  const handleCloseWhatsNewModal = () => {
    setShowWhatsNewModal(false)
    // Establecer cookie para que no se muestre de nuevo
    Cookies.set(COOKIE_NAME, "true", { expires: COOKIE_EXPIRY, path: "/" })
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

  // Calcular porcentajes para el gráfico
  const totalRequests = statsData.total || 1 // Evitar división por cero
  const approvedPercentage = Math.round((statsData.approved / totalRequests) * 100)
  const pendingPercentage = Math.round((statsData.pending / totalRequests) * 100)
  const rejectedPercentage = Math.round((statsData.rejected / totalRequests) * 100)

  // Datos para las tarjetas de acceso rápido
  const quickAccessCards = [
    {
      title: "Solicitar Permiso",
      description: "Gestiona tus permisos laborales",
      icon: FileText,
      href: "/solicitud-permisos",
      color: "from-emerald-500 to-green-600",
      gradient: "bg-gradient-to-br from-emerald-500 to-green-600",
    },
    {
      title: "Postulaciones",
      description: "Gestiona tus turnos y disponibilidad",
      icon: Briefcase,
      href: "/solicitud-equipo",
      color: "from-emerald-500 to-green-600",
      gradient: "bg-gradient-to-br from-emerald-500 to-green-600"
    },
    {
      title: "Ver Solicitudes",
      description: "Revisa el estado de tus solicitudes",
      icon: List,
      href: "/solicitudes-global",
      color: "from-emerald-500 to-green-600",
      gradient: "bg-gradient-to-br from-emerald-500 to-green-600",
      badge: hasNewNotification,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-950 overflow-x-hidden transition-colors duration-300">
      <Toaster position="top-right" />

   
      <EnhancedNotifications
        hasNewNotification={hasNewNotification}
        userName={userData.name}
        notifications={recentNotifications}
        onClose={markNotificationsAsViewed}
      />

      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-green-500 dark:from-emerald-900 dark:via-emerald-800 dark:to-green-900 text-white overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0">
            <motion.div
              className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.1, 0.15, 0.1],
              }}
              transition={{
                duration: 8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white/10"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: 5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 1,
              }}
            />
            <motion.div
              className="absolute bottom-10 right-1/3 w-32 h-32 rounded-full bg-white/10"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.1, 0.15, 0.1],
              }}
              transition={{
                duration: 7,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 2,
              }}
            />
            <motion.div
              className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full bg-white/5"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.05, 0.1, 0.05],
              }}
              transition={{
                duration: 6,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 3,
              }}
            />
          </div>

          <div className="container mx-auto max-w-7xl px-4 py-10 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <motion.div
                  className="mr-4 bg-white/20 p-2.5 rounded-2xl backdrop-blur-sm"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  <Image src="/images/sao6-blanco.png" alt="SAO6 Logo" width={32} height={32} className="h-8 w-auto" />
                </motion.div>
                <div>
                  <motion.h1
                    className="text-2xl font-bold"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    Link de permisos
                  </motion.h1>
                  <motion.div
                    className="flex items-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <p className="text-green-100 text-sm">SAO6</p>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-200 mx-2"></div>
                    <p className="text-green-100 text-sm">Código: {userData.code}</p>
                  </motion.div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <motion.div
                  className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-2xl border border-white/20 shadow-lg hidden md:flex items-center gap-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <weatherData.icon className="h-5 w-5 text-white" />
                  <div>
                    <p className="text-xl font-bold">{weatherData.temp}</p>
                    <p className="text-xs text-green-100">{weatherData.condition}</p>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-2xl border border-white/20 shadow-lg hidden md:block"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <p className="text-xl font-bold">{formattedTime}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  whileHover={{ scale: 1.1 }}
                  className="relative"
                >
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" className="p-0 h-auto rounded-full">
                        <Avatar className="h-12 w-12 border-2 border-white/30 shadow-lg cursor-pointer">
                          {userData.avatar ? (
                            <AvatarImage src={userData.avatar || "/placeholder.svg"} alt={userData.name} />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-green-600 text-white">
                              {getUserInitials(userData.name)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0 mr-4 rounded-2xl overflow-hidden">
                      <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-14 w-14 border-2 border-white/30">
                            {userData.avatar ? (
                              <AvatarImage src={userData.avatar || "/placeholder.svg"} alt={userData.name} />
                            ) : (
                              <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-green-600 text-white text-xl">
                                {getUserInitials(userData.name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <h3 className="text-lg font-bold text-white">{userData.name}</h3>
                            <p className="text-sm text-green-100">{userData.role}</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        <div className="grid grid-cols-2 gap-1">
                          <Button variant="ghost" size="sm" className="justify-start rounded-xl">
                            <Settings className="h-4 w-4 mr-2" />
                            Configuración
                          </Button>
                          <Button variant="ghost" size="sm" className="justify-start rounded-xl">
                            <Bell className="h-4 w-4 mr-2" />
                            Notificaciones
                          </Button>
                          <Button variant="ghost" size="sm" className="justify-start rounded-xl">
                            <HelpCircle className="h-4 w-4 mr-2" />
                            Ayuda
                          </Button>
                        </div>
                        <div className="mt-2 pt-2 border-t">
                          <Button variant="destructive" size="sm" className="w-full rounded-xl">
                            Cerrar Sesión
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  {hasNewNotification && (
                    <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </motion.div>
              </div>
            </div>

            <div className="mt-12 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-3xl"
              >
                <h2 className="text-4xl font-bold flex items-center">
                  Hola, <span className="text-yellow-300 ml-2">{userData.name.split(" ")[0]}</span>
                  <motion.span
                    className="inline-block ml-2"
                    animate={{
                      rotate: [0, 15, -15, 15, 0],
                      scale: [1, 1.2, 1, 1.2, 1],
                    }}
                    transition={{ duration: 1.5, delay: 1, repeat: 0 }}
                  >
                    👋
                  </motion.span>
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <p className="text-green-100 capitalize">{formattedDate}</p>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-200"></div>
                  <p className="text-green-100">{userData.role}</p>
                </div>
                <motion.p
                  className="mt-4 text-green-100 text-lg max-w-2xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Bienvenido al sistema de gestión de permisos y solicitudes. Aquí podrás gestionar tus permisos,
                  postulaciones y revisar el estado de tus solicitudes.
                </motion.p>
              </motion.div>
            </div>

            {/* Tarjetas de estadísticas en el header */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 pb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {[
                {
                  title: "Total Solicitudes",
                  value: statsData.total,
                  icon: FileText,
                  color: "bg-white/15",
                  textColor: "text-white",
                },
                {
                  title: "Aprobadas",
                  value: statsData.approved,
                  icon: CheckCircle,
                  color: "bg-white/15",
                  textColor: "text-white",
                },
                {
                  title: "Pendientes",
                  value: statsData.pending,
                  icon: AlertCircle,
                  color: "bg-white/15",
                  textColor: "text-white",
                },
                {
                  title: "Rechazadas",
                  value: statsData.rejected,
                  icon: XCircle,
                  color: "bg-white/15",
                  textColor: "text-white",
                },
              ].map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className={`${stat.color} backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-lg`}
                >
                  <div className="flex items-center">
                    <div className="bg-white/20 h-10 w-10 rounded-xl flex items-center justify-center mr-3">
                      <stat.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-white/80">{stat.title}</p>
                      {isDataLoading ? (
                        <Skeleton className="h-7 w-16 bg-white/30 mt-1" />
                      ) : (
                        <p className="text-2xl font-bold text-white">
                          <AnimatedCounter value={stat.value} />
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="container mx-auto max-w-7xl px-4 py-8 relative z-20">
        {/* Barra de herramientas */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar solicitudes..."
              className="pl-10 pr-4 py-2 rounded-full border-green-100 focus:border-green-500 w-full md:w-64"
            />
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-white dark:bg-gray-800 border-emerald-200 dark:border-gray-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-gray-700 rounded-full"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Filtrar solicitudes</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-white dark:bg-gray-800 border-emerald-200 dark:border-gray-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-gray-700 rounded-full"
              onClick={refreshData}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              <span>{refreshing ? "Actualizando..." : "Actualizar datos"}</span>
            </Button>
          </div>
        </div>

        {/* Tabs para cambiar entre vistas */}
        <div className="mb-6">
          <Tabs defaultValue="overview" onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-1 sm:w-[400px] rounded-full p-1 bg-green-100/50 dark:bg-gray-800/50">
              <TabsTrigger
                value="overview"
                className="rounded-full data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm"
              >
                <Home className="h-4 w-4 mr-2" />
                General
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Contenido basado en la pestaña activa */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Quick Access Cards */}
              <FadeInWhenVisible delay={0.1}>
                <div className="mb-10">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-emerald-800 dark:text-emerald-300 flex items-center">
                      <Sparkles className="h-5 w-5 mr-2 text-emerald-600 dark:text-emerald-400" />
                      Acceso Rápido
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quickAccessCards.map((card, index) => (
                      <Link href={card.href} key={card.title}>
                        <InteractiveCard
                          delay={index * 0.1}
                          className={`${card.gradient} rounded-3xl p-6 text-white shadow-lg relative overflow-hidden h-48 flex flex-col justify-between group`}
                        >
                          {/* Animated background elements */}
                          {/* Elemento decorativo eliminado para evitar espacio en blanco */}
                          <motion.div
                            className="absolute top-0 left-0 w-16 h-16 bg-white/10 rounded-br-full"
                            animate={{
                              rotate: [0, 10, 0],
                              scale: [1, 1.05, 1],
                            }}
                            transition={{
                              duration: 8,
                              repeat: Number.POSITIVE_INFINITY,
                              ease: "easeInOut",
                            }}
                          />
                          <motion.div
                            className="absolute bottom-0 left-0 w-20 h-20 bg-black/5 rounded-tr-full"
                            animate={{
                              rotate: [0, -10, 0],
                              scale: [1, 1.1, 1],
                            }}
                            transition={{
                              duration: 6,
                              repeat: Number.POSITIVE_INFINITY,
                              ease: "easeInOut",
                              delay: 1,
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-black/0 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <card.icon className="h-6 w-6" />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-bold text-xl">{card.title}</h3>
                              <p className="text-sm text-white/80 mt-1">{card.description}</p>
                            </div>
                            <motion.div
                              className="bg-white/20 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300"
                              initial={{ x: 10, opacity: 0 }}
                              whileHover={{ x: 0, opacity: 1 }}
                            >
                              <ArrowRight className="h-5 w-5" />
                            </motion.div>
                          </div>

                          {card.badge && (
                            <Badge className="absolute top-4 right-4 bg-red-500 text-white px-2 py-0.5 rounded-full">
                              Nuevo
                            </Badge>
                          )}
                        </InteractiveCard>
                      </Link>
                    ))}
                  </div>
                </div>
              </FadeInWhenVisible>

              {/* Resumen de Solicitudes y Actividad Reciente */}

            </motion.div>
          )}

          {activeTab === "activity" && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 gap-6">
                <Card className="bg-white dark:bg-gray-800 shadow-md border-emerald-100 dark:border-gray-700 overflow-hidden rounded-3xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">
                          Todas las Actividades
                        </CardTitle>
                        <CardDescription className="text-emerald-600 dark:text-emerald-400">
                          Historial completo de actividades y solicitudes
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-full border-emerald-200 text-emerald-700">
                        <Filter className="h-4 w-4 mr-2" />
                        Filtrar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isDataLoading ? (
                      <div className="space-y-4">
                        {Array(5)
                          .fill(0)
                          .map((_, i) => (
                            <div key={i} className="flex gap-4">
                              <Skeleton className="h-12 w-12 rounded-full" />
                              <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : [...activityData, ...notifications].length === 0 ? (
                      <EmptyState
                        icon={Activity}
                        title="No hay actividades registradas"
                        description="Cuando realices acciones o recibas notificaciones, aparecerán aquí."
                        actionLabel=""
                        onAction={undefined}
                      />
                    ) : (
                      <div className="space-y-4">
                        {[...activityData, ...notifications.slice(0, 3)].map((item, index) => {
                          // Determinar si es una actividad o una notificación
                          const isActivity = "user" in item
                          return (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="bg-gradient-to-r from-white to-green-50 dark:from-gray-800 dark:to-gray-800/80 rounded-2xl p-4 shadow-sm border border-green-100/50 dark:border-gray-700/50"
                            >
                              {isActivity ? (
                                // Renderizar actividad
                                <div className="flex items-start gap-3">
                                  <Avatar className="h-10 w-10 border-2 border-green-100">
                                    <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-green-600 text-white">
                                      {getUserInitials(item.user.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-1 mb-1">
                                      <span className="font-medium text-emerald-800 dark:text-emerald-300">
                                        {item.user.name}
                                      </span>
                                      <span className="text-gray-600 dark:text-gray-400">{item.action}</span>
                                      <span className="font-medium text-emerald-700 dark:text-emerald-400">
                                        {item.target}
                                      </span>
                                    </div>
                                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                      <span>{item.time}</span>
                                      <span className="mx-1">•</span>
                                      <span className="text-emerald-600 dark:text-emerald-400">{item.user.role}</span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2">
                                      <button
                                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-emerald-600 transition-colors"
                                        onClick={() =>
                                          setExpandedActivity(expandedActivity === item.id ? null : item.id)
                                        }
                                      >
                                        <MessageCircle className="h-3.5 w-3.5" />
                                        <span>{item.comments}</span>
                                      </button>
                                      <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-emerald-600 transition-colors">
                                        <ThumbsUp className="h-3.5 w-3.5" />
                                        <span>{item.likes}</span>
                                      </button>
                                      <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Eye className="h-3.5 w-3.5" />
                                        <span>{item.views}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                // Renderizar notificación
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                                      item.status === "approved"
                                        ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                                        : item.status === "pending"
                                          ? "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400"
                                          : "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400"
                                    }`}
                                  >
                                    {item.status === "approved" ? (
                                      <CheckCircle className="h-5 w-5" />
                                    ) : item.status === "pending" ? (
                                      <AlertCircle className="h-5 w-5" />
                                    ) : (
                                      <XCircle className="h-5 w-5" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap justify-between items-start gap-2">
                                      <h4 className="font-medium text-emerald-800 dark:text-emerald-300 text-sm">
                                        {item.type}
                                      </h4>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">{item.date}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                      {item.message}
                                    </p>
                                    <div className="mt-2 flex justify-end">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 rounded-full text-xs text-emerald-600"
                                      >
                                        Ver detalles <ArrowUpRight className="h-3 w-3 ml-1" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-center border-t border-green-100 pt-4">
                    <Button variant="outline" className="rounded-full">
                      Cargar más <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === "stats" && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de tendencia */}
                <Card className="bg-white dark:bg-gray-800 shadow-md border-emerald-100 dark:border-gray-700 overflow-hidden rounded-3xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">
                          Tendencia de Solicitudes
                        </CardTitle>
                        <CardDescription className="text-emerald-600 dark:text-emerald-400">
                          Actividad de la última semana
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`rounded-full ${
                            activeMetric === "week"
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : "border-gray-200"
                          }`}
                          onClick={() => setActiveMetric("week")}
                        >
                          Semana
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`rounded-full ${
                            activeMetric === "month"
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : "border-gray-200"
                          }`}
                          onClick={() => setActiveMetric("month")}
                        >
                          Mes
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {isDataLoading ? (
                      <div className="h-64 flex items-center justify-center">
                        <Skeleton className="h-48 w-full" />
                      </div>
                    ) : (
                      <div className="h-64 flex items-end justify-between gap-2 pt-6">
                        {trendData.map((item, index) => (
                          <div key={index} className="flex flex-col items-center flex-1">
                            <motion.div
                              className="w-full bg-emerald-100 dark:bg-emerald-900/30 rounded-t-xl relative group"
                              initial={{ height: 0 }}
                              animate={{ height: `${(item.value / maxTrendValue) * 100}%` }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                              whileHover={{ backgroundColor: "#10b981" }}
                            >
                              <motion.div
                                className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-2 py-1 rounded-lg text-xs opacity-0 group-hover:opacity-100 pointer-events-none"
                                initial={{ y: 10 }}
                                whileHover={{ y: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                {item.value}
                              </motion.div>
                            </motion.div>
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">{item.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Estadísticas detalladas */}
                <Card className="bg-white dark:bg-gray-800 shadow-md border-emerald-100 dark:border-gray-700 overflow-hidden rounded-3xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">
                          Estadísticas Detalladas
                        </CardTitle>
                        <CardDescription className="text-emerald-600 dark:text-emerald-400">
                          Análisis de tus solicitudes
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isDataLoading ? (
                      <div className="space-y-4">
                        {Array(4)
                          .fill(0)
                          .map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                          ))}
                      </div>
                    ) : statsData.total === 0 ? (
                      <EmptyState
                        icon={BarChart3}
                        title="Sin datos estadísticos"
                        description="Aún no hay suficientes datos para mostrar estadísticas detalladas."
                        actionLabel={undefined}
                        onAction={undefined}
                      />
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                                Tiempo promedio
                              </div>
                              <div className="bg-white dark:bg-gray-800 p-1 rounded-lg">
                                <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              </div>
                            </div>
                            <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">2.5 días</div>
                            <div className="flex items-center mt-1 text-xs text-emerald-600 dark:text-emerald-500">
                              <ArrowDown className="h-3 w-3 mr-1 text-green-600" />
                              <span>12% menos que el mes pasado</span>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                                Tasa de aprobación
                              </div>
                              <div className="bg-white dark:bg-gray-800 p-1 rounded-lg">
                                <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                            </div>
                            <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                              {approvedPercentage}%
                            </div>
                            <div className="flex items-center mt-1 text-xs text-blue-600 dark:text-blue-500">
                              <ArrowUp className="h-3 w-3 mr-1 text-green-600" />
                              <span>5% más que el mes pasado</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Tipos de solicitudes
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Últimos 30 días</div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
                                <span className="text-sm text-gray-600 dark:text-gray-300">Permisos</span>
                              </div>
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">65%</div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                                <span className="text-sm text-gray-600 dark:text-gray-300">Vacaciones</span>
                              </div>
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">20%</div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                                <span className="text-sm text-gray-600 dark:text-gray-300">Licencias</span>
                              </div>
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">10%</div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
                                <span className="text-sm text-gray-600 dark:text-gray-300">Otros</span>
                              </div>
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">5%</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tarjeta de acciones rápidas */}
                <Card className="bg-white dark:bg-gray-800 shadow-md border-emerald-100 dark:border-gray-700 overflow-hidden rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">
                      Acciones Rápidas
                    </CardTitle>
                  </CardHeader>
                </Card>

                {/* Tarjeta de consejos */}
                <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg overflow-hidden rounded-3xl">
                  <CardContent className="p-6">
                    <div className="flex items-start">
                      <div className="bg-white/20 p-3 rounded-xl mr-4">
                        <Zap className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">Consejos para solicitudes</h3>
                        <p className="text-emerald-100 mb-4">
                          Mejora tus posibilidades de aprobación siguiendo estas recomendaciones:
                        </p>
                        <ul className="space-y-2">
                          {[
                            "Solicita con al menos 3 días de anticipación",
                            "Incluye todos los detalles relevantes",
                            "Verifica el calendario de tu equipo",
                          ].map((tip, index) => (
                            <motion.li
                              key={index}
                              className="flex items-center"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 * index }}
                            >
                              <div className="bg-white/20 p-1 rounded-full mr-2">
                                <CheckCircle className="h-4 w-4" />
                              </div>
                              <span className="text-sm">{tip}</span>
                            </motion.li>
                          ))}
                        </ul>
                        <Button className="mt-4 bg-white text-emerald-600 hover:bg-emerald-50 rounded-full" size="sm">
                          Ver más consejos
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation hasNewNotification={hasNewNotification} />
    </div>
  )
}
