"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { useRBACContext } from "@/components/RBACProvider"
import {
  FileText,
  AlertTriangle,
  Database,
  Users,
  LogOut,
  ChevronRight,
  Menu,
  Bell,
  Search,
  LayoutDashboard,
  Shield,
  Activity
} from "lucide-react"
import PermitsManagement from "./permits-management"
import AdminUsersModal from "@/components/AdminUsersModal.tsx/page"
import RequestDashboard from "@/components/history-dashboard/requests-dashbord"
import PermitRequestForm from "@/app/dashboard-admin-requests/solicitud-permisos/page"
import { cn } from "@/lib/utils"

export default function AdminDashboard() {
  type SectionType = "permits" | "extemporaneous" | "history" | "users" | "exit"

  const router = useRouter()
  const [activeSection, setActiveSection] = useState<SectionType>("permits")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState("")
  const [notifications] = useState(3)
  const {
    userContext,
    isLoading,
    isAuthenticated,
    hasCapability,
    displayName,
    logout
  } = useRBACContext()

  useEffect(() => {
    // Check authentication through RBAC context
    if (!isAuthenticated && !isLoading) {
      router.push("/")
      return
    }

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

  const navigationItems = [
    {
      id: "permits",
      title: "Gestión de Permisos",
      icon: FileText,
      description: "Administrar solicitudes",
    },
    {
      id: "extemporaneous",
      title: "Permisos Extemporáneos",
      icon: AlertTriangle,
      description: "Solicitudes urgentes",
    },
    {
      id: "history",
      title: "Registro Histórico",
      icon: Database,
      description: "Archivo completo",
    },
    {
      id: "users",
      title: "Gestión de Usuarios",
      icon: Users,
      description: "Administrar usuarios",
    }
  ]

  const handleSectionChange = (section: SectionType) => {
    if (section === "exit") {
      handleLogout()
    } else {
      setActiveSection(section)
      setSidebarOpen(false)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    logout()
    window.location.href = '/'
  }

  const getSectionTitle = () => {
    const section = navigationItems.find(s => s.id === activeSection)
    return section?.title || "Dashboard"
  }

  // Filter navigation based on RBAC permissions
  const filteredNavigation = navigationItems.filter(item => {
    switch (item.id) {
      case "permits":
        return hasCapability("canViewAllRequests") || hasCapability("canViewOwnRequests")
      case "extemporaneous":
        return hasCapability("canViewAllRequests") || hasCapability("canViewOwnRequests")
      case "history":
        return hasCapability("canViewAllRequests")
      case "users":
        return hasCapability("canViewAllUsers")
      default:
        return false
    }
  })

  return (
    <div className="flex h-screen bg-[#f8fafc] relative overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ x: sidebarOpen ? 0 : 0 }}
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-100 shadow-[2px_0_24px_rgba(0,0,0,0.02)] lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} transition-transform duration-300 ease-in-out`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-8 pb-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 bg-[#4cc253] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#4cc253]/20">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">SAO6</h1>
                <p className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] mt-1">Admin Panel</p>
              </div>
            </div>
          </div>

          {/* User Info Card */}
          <div className="px-6 py-4">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[#4cc253] font-black shadow-sm">
                  {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{displayName || 'Usuario'}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4cc253]" />
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">En línea</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
            <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Menu Principal</p>

            {filteredNavigation.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id as SectionType)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                    isActive
                      ? "bg-[#4cc253] text-white shadow-xl shadow-[#4cc253]/20"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-400 group-hover:text-[#4cc253]")} />
                  <div className="text-left">
                    <p className={cn("text-xs font-bold uppercase tracking-wide", isActive ? "text-white" : "")}>
                      {item.title}
                    </p>
                  </div>
                  {isActive && <ChevronRight className="absolute right-4 h-4 w-4 text-white/50" />}
                </button>
              )
            })}
          </nav>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 transition-all duration-300 group"
            >
              <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black uppercase tracking-wide">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative z-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-50 text-gray-500"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{getSectionTitle()}</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Admin Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:block text-right">
              <p className="text-xs font-bold text-gray-900">{currentTime}</p>
              <p className="text-[10px] font-medium text-[#4cc253] uppercase tracking-wider text-right">Sistema Activo</p>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2.5 h-2 w-2 bg-[#4cc253] rounded-full border border-white" />
              </button>
              <div className="h-8 w-[1px] bg-gray-100 mx-1" />
              <button className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors">
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f8fafc]">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {activeSection === "permits" && <PermitsManagement />}
            {activeSection === "extemporaneous" && <PermitRequestForm isExtemporaneous={true} />}
            {activeSection === "history" && <RequestDashboard />}
            {activeSection === "users" && <AdminUsersModal />}
          </motion.div>
        </main>
      </div>

      {/* Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}