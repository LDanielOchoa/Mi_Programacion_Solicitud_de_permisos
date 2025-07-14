"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  FileText, 
  BarChart, 
  AlertTriangle, 
  Database, 
  Users, 
  LogOut,
  ChevronRight,
  Activity,
  Shield,
  Clock,
  Sparkles,
  Zap,
  TrendingUp,
  Star
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

// Import your existing components
import PermitsManagement from "./permits-management"
import Indicators from "./indicators"
import PermitRequestForm from "./request-form"
import HistoricalRecords from "../excel/page"
import UserManagementPage from "../user-management/page"

export default function AdminDashboard() {
  type SectionType = "permits" | "indicators" | "extemporaneous" | "history" | "users" | "exit"
  
  const [activeSection, setActiveSection] = useState<SectionType>("permits")
  const [userRole, setUserRole] = useState<string>("")
  const [userName, setUserName] = useState<string>("")
  const [currentTime, setCurrentTime] = useState<string>("")
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem("userRole")
    const name = localStorage.getItem("userName") || "Administrador"
    setUserRole(role || "")
    setUserName(name)

    // Update time every minute
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }))
    }
    
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 20,
        mass: 0.8
      }
    }
  }

  const floatingVariants = {
    animate: {
      y: [-2, 2, -2],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  const stats = [
    {
      title: "Gestión de Permisos",
      icon: FileText,
      value: "Administrar",
      description: "Gestione solicitudes de permisos y postulaciones con facilidad",
      color: "text-emerald-700",
      bgGradient: "from-emerald-400 via-green-400 to-emerald-500",
      hoverGradient: "from-emerald-500 via-green-500 to-emerald-600",
      shadowColor: "shadow-emerald-200/50",
      section: "permits" as SectionType,
      badge: "Principal",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      accentIcon: Sparkles,
      stats: "124 activos"
    },
    {
      title: "Indicadores",
      icon: BarChart,
      value: "Ver Estadísticas",
      description: "Visualice métricas avanzadas y tendencias del sistema",
      color: "text-green-700",
      bgGradient: "from-green-400 via-emerald-400 to-green-500",
      hoverGradient: "from-green-500 via-emerald-500 to-green-600",
      shadowColor: "shadow-green-200/50",
      section: "indicators" as SectionType,
      badge: "Analytics",
      badgeColor: "bg-green-100 text-green-800 border-green-200",
      accentIcon: TrendingUp,
      stats: "98% precisión"
    },
    {
      title: "Permisos Extemporáneos",
      icon: AlertTriangle,
      value: "Gestionar",
      description: "Administre solicitudes urgentes fuera de plazo",
      color: "text-lime-700",
      bgGradient: "from-lime-400 via-green-400 to-lime-500",
      hoverGradient: "from-lime-500 via-green-500 to-lime-600",
      shadowColor: "shadow-lime-200/50",
      section: "extemporaneous" as SectionType,
      badge: "Urgente",
      badgeColor: "bg-lime-100 text-lime-800 border-lime-200",
      accentIcon: Zap,
      stats: "3 pendientes"
    },
    {
      title: "Registro Histórico",
      icon: Database,
      value: "Obtener",
      description: "Acceda al archivo completo de solicitudes y respuestas",
      color: "text-teal-700",
      bgGradient: "from-teal-400 via-emerald-400 to-teal-500",
      hoverGradient: "from-teal-500 via-emerald-500 to-teal-600",
      shadowColor: "shadow-teal-200/50",
      section: "history" as SectionType,
      badge: "Archivo",
      badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
      accentIcon: Star,
      stats: "2.5k registros"
    },
    {
      title: "Gestión de Usuarios",
      icon: Users,
      value: "Administrar",
      description: "Gestione usuarios, roles y permisos del sistema",
      color: "text-green-700",
      bgGradient: "from-green-400 via-teal-400 to-green-500",
      hoverGradient: "from-green-500 via-teal-500 to-green-600",
      shadowColor: "shadow-green-200/50",
      section: "users" as SectionType,
      badge: "Admin",
      badgeColor: "bg-green-100 text-green-800 border-green-200",
      accentIcon: Shield,
      stats: "47 usuarios"
    },
    {
      title: "Salir",
      icon: LogOut,
      value: "Cerrar Sesión",
      description: "Finalizar sesión y regresar al inicio de forma segura",
      color: "text-red-700",
      bgGradient: "from-red-400 via-rose-400 to-red-500",
      hoverGradient: "from-red-500 via-rose-500 to-red-600",
      shadowColor: "shadow-red-200/50",
      section: "exit" as SectionType,
      badge: "Salir",
      badgeColor: "bg-red-100 text-red-800 border-red-200",
      accentIcon: LogOut,
      stats: "Seguro"
    },
  ]

  const handleSectionChange = (section: SectionType) => {
    if (section === "exit") {
      localStorage.clear()
      router.push("/")
    } else {
      setActiveSection(section)
    }
  }

  const filteredStats = userRole === "testers" 
    ? stats.filter((stat) => ["extemporaneous", "exit"].includes(stat.section)) 
    : stats

  const getSectionTitle = () => {
    const section = stats.find(s => s.section === activeSection)
    return section?.title || "Dashboard"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/30 to-green-200/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-teal-200/30 to-emerald-200/30 rounded-full blur-3xl"
        />
      </div>

      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-white/60 backdrop-blur-xl border-b border-emerald-200/50 sticky top-0 z-50 shadow-lg shadow-emerald-100/20"
      >
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <motion.div
                className="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 p-4 rounded-2xl shadow-xl shadow-emerald-200/50"
                whileHover={{ 
                  scale: 1.05, 
                  rotate: [0, -5, 5, 0],
                  boxShadow: "0 25px 50px -12px rgba(16, 185, 129, 0.4)"
                }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Shield className="h-10 w-10 text-white drop-shadow-lg" />
              </motion.div>
              <div>
                <motion.h1 
                  className="text-3xl font-bold bg-gradient-to-r from-emerald-700 via-green-600 to-teal-700 bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  SAO6 Dashboard
                </motion.h1>
                <motion.p 
                  className="text-emerald-600/80 font-medium"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Sistema Avanzado de Administración de Permisos
                </motion.p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <motion.div 
                className="text-right hidden md:block"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-lg font-semibold text-emerald-800">Bienvenido, {userName}</p>
                <p className="text-sm text-emerald-600/80 flex items-center justify-end">
                  <Clock className="h-4 w-4 mr-2" />
                  {currentTime}
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Badge className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-200 px-4 py-2 text-sm font-medium shadow-lg">
                  <Activity className="h-4 w-4 mr-2" />
                  En línea
                </Badge>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="relative max-w-full mx-auto px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-12 text-center"
        >
          <motion.h2 
            className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-800 via-green-700 to-teal-800 bg-clip-text text-transparent mb-4"
            variants={floatingVariants}
            animate="animate"
          >
            Panel de Control Ejecutivo
          </motion.h2>
          <motion.p 
            className="text-xl text-emerald-700/80 max-w-4xl mx-auto leading-relaxed font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {userRole === "testers"
              ? "Acceda a las funciones especializadas de prueba y gestión de permisos extemporáneos con herramientas avanzadas."
              : "Gestione de manera centralizada y eficiente todas las operaciones del sistema de permisos con análisis en tiempo real."}
          </motion.p>
        </motion.div>

        {/* Navigation Cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredStats.map((stat) => (
            <motion.div
              key={stat.section}
              variants={cardVariants}
              onHoverStart={() => setHoveredCard(stat.section)}
              onHoverEnd={() => setHoveredCard(null)}
              className="relative h-full"
            >
              <Card
                className={`
                  h-full flex flex-col justify-between p-6 rounded-2xl shadow-xl border-t-4
                  ${stat.shadowColor} ${stat.section === activeSection ? "border-emerald-500" : "border-transparent"}
                  hover:border-emerald-500 transition-all duration-300 cursor-pointer
                  bg-white/70 backdrop-blur-md
                `}
                onClick={() => handleSectionChange(stat.section)}
              >
                <CardHeader className="p-0 pb-4 flex flex-row items-start justify-between">
                  <Badge className={`px-3 py-1 text-xs rounded-full ${stat.badgeColor}`}>
                    {stat.badge}
                  </Badge>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`p-3 rounded-full bg-gradient-to-br ${stat.bgGradient} text-white shadow-md`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-800 mb-1 leading-tight">
                        {stat.title}
                      </CardTitle>
                      <p className="text-sm text-gray-500 font-medium">{stat.value}</p>
                    </div>
                  </div>
                  <CardDescription className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {stat.description}
                  </CardDescription>
                  <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                    <stat.accentIcon className="h-4 w-4 text-gray-500" />
                    <span>{stat.stats}</span>
                  </div>
                </CardContent>
              </Card>
              {hoveredCard === stat.section && ( 
                <motion.div
                  variants={floatingVariants}
                  initial="animate"
                  animate="animate"
                  className={`absolute -top-3 -right-3 p-2 rounded-full bg-gradient-to-br ${stat.bgGradient} shadow-lg`}
                >
                  <stat.icon className="h-6 w-6 text-white" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Content Section */}
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-white/70 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-emerald-200/50"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4 border-emerald-200">
            {getSectionTitle()}
          </h2>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeSection === "permits" && <PermitsManagement />}
              {activeSection === "indicators" && <Indicators />}
              {activeSection === "extemporaneous" && <PermitRequestForm />}
              {activeSection === "history" && <HistoricalRecords />}
              {activeSection === "users" && <UserManagementPage />}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}