"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { useTokenRefresh } from "@/hooks/use-token-refresh"
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
  Star,
  Wrench,
  Construction,
  Menu,
  X,
  Home,
  Settings,
  Bell,
  Search,
  Filter,
  MoreVertical,
  Layers,
  Globe,
  Wifi,
  Battery,
  Signal
} from "lucide-react"
import PermitsManagement from "./permits-management"
import AdminUsersModal from "@/components/AdminUsersModal.tsx/page"
import RequestDashboard from "@/components/history-dashboard/requests-dashbord"
import PermitRequestForm from "@/app/dashboard-admin-requests/solicitud-permisos/page"

// Componente de Mantenimiento mejorado
const MaintenanceMessage = ({ sectionName }: { sectionName: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-20 px-8 text-center relative"
    >
      {/* Elementos de fondo animados */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-green-200/20 to-emerald-200/20 rounded-full blur-2xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-10 left-10 w-40 h-40 bg-gradient-to-br from-emerald-200/20 to-green-200/20 rounded-full blur-2xl"
        />
      </div>

      <motion.div
        animate={{
          rotate: [0, 10, -10, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative w-32 h-32 bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-amber-200/50"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl"></div>
        <Construction className="h-16 w-16 text-white drop-shadow-lg relative z-10" />

        {/* Partículas flotantes */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/40 rounded-full"
            animate={{
              x: [0, Math.random() * 40 - 20],
              y: [0, Math.random() * 40 - 20],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 60}%`,
            }}
          />
        ))}
      </motion.div>

      <motion.h3
        className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-clip-text text-transparent mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        En Mantenimiento
      </motion.h3>

      <motion.p
        className="text-xl text-gray-600 mb-8 max-w-lg leading-relaxed"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        La sección <span className="font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">{sectionName}</span> está siendo mejorada para brindarte una experiencia excepcional.
      </motion.p>

      <motion.div
        className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 p-8 rounded-2xl border border-amber-200/50 max-w-lg shadow-xl backdrop-blur-sm"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg">
            <Wrench className="h-6 w-6 text-white" />
          </div>
          <h4 className="text-xl font-bold text-amber-800">¿Qué estamos haciendo?</h4>
        </div>
        <ul className="text-amber-700 space-y-4 text-left">
          {[
            "Optimizando la interfaz de usuario",
            "Mejorando el rendimiento del sistema",
            "Agregando nuevas funcionalidades"
          ].map((item, index) => (
            <motion.li
              key={index}
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <div className="w-3 h-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-sm"></div>
              <span className="font-medium">{item}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        className="mt-10 flex items-center space-x-3 text-gray-500 bg-white/50 px-6 py-3 rounded-full backdrop-blur-sm border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Clock className="h-5 w-5" />
        <span className="font-medium">Disponible próximamente</span>
      </motion.div>
    </motion.div>
  )
}

export default function AdminDashboard() {
  type SectionType = "permits" | "indicators" | "extemporaneous" | "history" | "users" | "exit"

  const router = useRouter()
  const { refreshToken } = useTokenRefresh()
  const [activeSection, setActiveSection] = useState<SectionType>("permits")
  const [userRole, setUserRole] = useState<string>("")
  const [userName, setUserName] = useState<string>("")
  const [currentTime, setCurrentTime] = useState<string>("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications] = useState(3)

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "admin"
    let name = localStorage.getItem("userName") || "Administrador"

    // Si no hay nombre guardado, intentar obtenerlo del backend
    if (name === "Administrador") {
      const token = localStorage.getItem("accessToken")
      if (token) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://solicitud-permisos.sao6.com.co/api"}/auth/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
          .then(response => {
            if (response.ok) {
              return response.json()
            }
            throw new Error("No se pudo obtener información del usuario")
          })
          .then(userData => {
            const userName = userData.name || "Administrador"
            localStorage.setItem("userName", userName)
            // Guardar todos los datos del usuario para que otros componentes puedan acceder
            localStorage.setItem('userData', JSON.stringify(userData))
            console.log('DEBUG dashboard: userData guardado en localStorage:', userData)
            setUserName(userName)
          })
          .catch(error => {
            console.warn("Error al obtener nombre del usuario:", error)
            setUserName("Administrador")
          })
      }
    } else {
      setUserName(name)
    }

    setUserRole(role)

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

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 40,
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    },
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 40,
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  }

  const menuItemVariants = {
    open: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 40
      }
    },
    closed: {
      opacity: 0,
      x: -20,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 40
      }
    }
  }

  const navigationItems = [
    {
      id: "permits",
      title: "Gestión de Permisos",
      icon: FileText,
      description: "Administrar solicitudes",
      color: "text-green-600",
      activeColor: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      id: "extemporaneous",
      title: "Permisos Extemporáneos",
      icon: AlertTriangle,
      description: "Solicitudes urgentes",
      color: "text-green-600",
      activeColor: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      id: "history",
      title: "Registro Histórico",
      icon: Database,
      description: "Archivo completo",
      color: "text-green-600",
      activeColor: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      id: "users",
      title: "Gestión de Usuarios",
      icon: Users,
      description: "Administrar usuarios",
      color: "text-green-600",
      activeColor: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300",
      gradient: "from-purple-500 to-pink-500"
    }
  ]

  const handleSectionChange = (section: SectionType) => {
    if (section === "exit") {
      localStorage.clear()
      router.push("/")
    } else {
      setActiveSection(section)
      setSidebarOpen(false)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push("/")
  }

  const getSectionTitle = () => {
    const section = navigationItems.find(s => s.id === activeSection)
    return section?.title || "Dashboard"
  }

  const filteredNavigation = userRole === "testers"
    ? navigationItems.filter((item) => ["extemporaneous"].includes(item.id))
    : navigationItems

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/30 relative">
      {/* Elementos de fondo animados */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-green-200/10 to-emerald-200/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-200/10 to-green-200/10 rounded-full blur-3xl"
        />
      </div>

      {/* Sidebar */}
      <motion.div
        initial="closed"
        animate="open"
        variants={sidebarVariants}
        className="fixed inset-y-0 left-0 z-50 w-80 bg-white/95 backdrop-blur-xl shadow-2xl border-r border-green-200/50 lg:relative lg:translate-x-0"
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 p-6 text-white relative overflow-hidden">
            {/* Elementos decorativos */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-4 relative z-10"
            >
              <motion.div
                className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/20"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <img
                  src="/logo-sao6-blanco.webp"
                  alt="SAO6 Logo"
                  className="h-8 w-8 object-contain drop-shadow-lg"
                />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold drop-shadow-sm">SAO6</h1>
                <p className="text-green-100 text-sm font-medium">Sistema Administrativo</p>
              </div>
            </motion.div>
          </div>

          {/* User Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-green-200/50"
          >
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg drop-shadow-sm">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-green-800 text-lg">{userName}</h3>
                <p className="text-green-600 text-sm flex items-center">
                  <Activity className="h-3 w-3 mr-1" />
                  En línea
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`w-1 h-1 rounded-full ${i < 4 ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                    ))}
                  </div>
                  <span className="text-xs text-green-600">Admin</span>
                </div>
              </div>
              <div className="relative">
                <button className="p-2 bg-white/50 rounded-xl hover:bg-white transition-colors">
                  <Bell className="h-5 w-5 text-green-600" />
                </button>
                {notifications > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">{notifications}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xs font-bold text-green-700 uppercase tracking-wider mb-6 px-3 flex items-center space-x-2"
            >
              <Layers className="h-4 w-4" />
              <span>Navegación Principal</span>
            </motion.div>

            {filteredNavigation.map((item, index) => (
              <motion.button
                key={item.id}
                variants={menuItemVariants}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSectionChange(item.id as SectionType)}
                className={`
                  w-full flex items-center space-x-4 px-4 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden
                  ${activeSection === item.id
                    ? "bg-gradient-to-r from-green-100 via-emerald-100 to-green-100 text-green-800 shadow-lg border-2 border-green-300"
                    : "text-green-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-800"
                  }
                `}
              >
                {/* Efecto de brillo */}
                {activeSection === item.id && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: [-100, 300] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  />
                )}

                <div className={`
                  p-3 rounded-xl transition-all duration-300 shadow-md relative z-10
                  ${activeSection === item.id
                    ? `bg-gradient-to-r ${item.gradient} shadow-lg`
                    : "bg-white group-hover:shadow-lg"
                  }
                `}>
                  <item.icon className={`h-5 w-5 ${activeSection === item.id ? 'text-white' : 'text-green-600'}`} />
                </div>
                <div className="flex-1 text-left relative z-10">
                  <div className="font-semibold">{item.title}</div>
                  <div className="text-xs text-green-600/80">{item.description}</div>
                </div>
                {activeSection === item.id && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className="relative z-10"
                  >
                    <ChevronRight className="h-5 w-5 text-green-600" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </nav>

          {/* Footer con información del sistema */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-4 border-t border-green-200/50 bg-gradient-to-r from-green-50/50 to-emerald-50/50"
          >

            {/* Logout Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 group"
            >
              <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                <LogOut className="h-5 w-5" />
              </div>
              <span className="font-semibold">Cerrar Sesión</span>
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/90 backdrop-blur-xl border-b border-green-200/50 p-6 shadow-sm relative"
        >
          {/* Elementos decorativos del header */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-50/30 to-emerald-50/30"></div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-3 hover:bg-green-50 rounded-xl transition-colors"
              >
                <Menu className="h-6 w-6 text-green-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-800 via-emerald-700 to-green-800 bg-clip-text text-transparent">
                  {getSectionTitle()}
                </h1>
                <p className="text-green-600 font-medium">Panel de administración avanzado</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-right hidden md:block">
                <p className="text-sm text-green-700 font-semibold">{currentTime}</p>
                <p className="text-xs text-green-600">Última actualización</p>
              </div>

              {/* Indicadores de estado */}
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 rounded-full border border-green-200">
                  <span className="text-green-800 text-sm font-semibold flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Sistema Activo
                  </span>
                </div>

                <button className="p-3 bg-white/50 rounded-xl hover:bg-white transition-colors shadow-sm">
                  <Settings className="h-5 w-5 text-green-600" />
                </button>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 relative pb-20">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-green-200/50 p-8 min-h-full relative"
          >
            {/* Elementos decorativos del contenido */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-100/20 to-emerald-100/20 rounded-full -translate-y-32 translate-x-32 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-emerald-100/20 to-green-100/20 rounded-full translate-y-24 -translate-x-24 blur-2xl"></div>

            <div className="relative z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  {activeSection === "permits" && <PermitsManagement />}
                  {activeSection === "extemporaneous" && <PermitRequestForm isExtemporaneous={true} />}
                  {activeSection === "history" && <RequestDashboard />}
                  {activeSection === "users" && <AdminUsersModal />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}