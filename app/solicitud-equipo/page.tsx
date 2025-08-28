"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  Loader2,
  AlertCircle,
  Briefcase,
  Calendar,
  FileText,
  CheckCircle,
  Info,
  Clock,
  User,
  Phone,
  Shield,
  Plus,
  ChevronRight,
  Wrench,
  Construction,
  AlertTriangle,
} from "lucide-react"
import LoadingOverlay from "../../components/loading-overlay"
import { ShiftSelection } from "./shift-selection"
import { ZoneSelector } from "./zone-selector"
import BottomNavigation from "../../components/BottomNavigation"
import useConnectionAwareSubmit from "@/hooks/useConnectionAwareSubmit"
import ConnectionStatus from "@/components/ConnectionStatus"
import { toast } from "@/components/ui/use-toast"

interface UserInterface {
  code: string
  name: string
  initials: string
  avatar?: string
}

export default function EquipmentRequestForm() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const [userData, setUserData] = useState<UserInterface>({ code: "", name: "", initials: "" })
  const [usersList, setUsersList] = useState<UserInterface[]>([])
  const [error, setError] = useState("")
  const [selectedType, setSelectedType] = useState("")
  const [selectedAMUser, setSelectedAMUser] = useState<UserInterface | null>(null)
  const [selectedPMUser, setSelectedPMUser] = useState<UserInterface | null>(null)
  const [zone, setZone] = useState("")
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false)
  const [hasNewNotification, setHasNewNotification] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)
  
  // Estados para conexión y envío
  const [connectionStatus, setConnectionStatus] = useState<string>('')
  const [progressMessage, setProgressMessage] = useState<string>('')
  
  const router = useRouter()

  // Funciones memoizadas para evitar bucles infinitos de re-renderizado
  const handleProgress = useCallback((stage: string) => {
    setProgressMessage(stage);
    console.log('📊 Progreso del envío:', stage);
  }, []);

  const handleConnectionIssue = useCallback((issue: string) => {
    setConnectionStatus(issue);
    toast({
      title: "Problema de conexión",
      description: issue,
      variant: "destructive",
    });
  }, []);

  // Función de envío memoizada
  const submitFunction = useCallback(async (data: any, signal: AbortSignal) => {
    const response = await fetch("https://solicitud-permisos.sao6.com.co/api/equipment-request", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${data.token}`,
      },
      body: data.formData,
      signal
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al enviar la solicitud: ${errorData.detail || response.statusText}`);
    }

    return response.json();
  }, []);

  // Hook para envío inteligente con protección contra duplicados
  const connectionAwareSubmit = useConnectionAwareSubmit(
    submitFunction,
    {
      timeout: 45000, // 45 segundos para solicitudes de equipos
      maxRetries: 3,
      retryDelay: 3000,
      deduplicationWindow: 8000, // 8 segundos para deduplicación
      onProgress: handleProgress,
      onConnectionIssue: handleConnectionIssue
    }
  );

  const zones = [
    "Acevedo",
    "Tricentenario",
    "Universidad-gardel",
    "Hospital",
    "Prado",
    "Cruz",
    "San Antonio",
    "Exposiciones",
    "Alejandro",
  ]

  const equipmentTypes = [
    {
      id: "turno-pareja",
      title: "Turno pareja",
      description: "Dos operadores trabajando en turnos complementarios (AM y PM)",
      icon: <Calendar className="h-8 w-8 text-green-600" />,
      color: "from-green-50 to-green-100",
      borderColor: "border-green-200",
      value: "Turno pareja",
    },
    {
      id: "tabla-partida",
      title: "Tabla partida",
      description: "Distribución de horas de trabajo en diferentes momentos del día",
      icon: <Clock className="h-8 w-8 text-amber-600" />,
      color: "from-amber-50 to-amber-100",
      borderColor: "border-amber-200",
      value: "Tabla partida",
    },
    {
      id: "disponible-fijo",
      title: "Disponible fijo",
      description: "Horario específico (AM o PM) de manera permanente",
      icon: <Calendar className="h-8 w-8 text-blue-600" />,
      color: "from-blue-50 to-blue-100",
      borderColor: "border-blue-200",
      value: "Disponible fijo",
    },
  ]

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("accessToken")

        if (!token) {
          router.push("/")
          return
        }

        const response = await fetch("https://solicitud-permisos.sao6.com.co/api/auth/user", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (response.status === 401) {
          localStorage.removeItem("accessToken")
          router.push("/")
          return
        }

        if (!response.ok) {
          throw new Error("Error al obtener datos del usuario")
        }

        const data = await response.json()
        const initials = getInitials(data.name)
        setUserData({ code: data.code, name: data.name, initials })

        // Check for notifications
        const storedNotifications = localStorage.getItem("dashboardNotifications")
        if (storedNotifications) {
          const parsedNotifications = JSON.parse(storedNotifications)
          setHasNewNotification(parsedNotifications.some((n: any) => n.isNew))
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        setError("No se pudieron cargar los datos del usuario. Por favor, inicie sesión nuevamente.")
      } finally {
        // Simulamos una carga más corta para desarrollo
        setTimeout(() => {
          setIsLoading(false)
        }, 500)
      }
    }

    const fetchUsersList = async () => {
      try {
        const response = await fetch("https://solicitud-permisos.sao6.com.co/api/users/list")
        if (!response.ok) {
          throw new Error("Error al obtener la lista de usuarios")
        }
        const data = await response.json()
        // Asegurarse de que cada usuario tenga iniciales
        const usersWithInitials = data.map((user: any) => ({
          ...user,
          initials: getInitials(user.name),
        }))
        setUsersList(usersWithInitials)
        console.log("Users loaded:", usersWithInitials.length)
      } catch (error) {
        console.error("Error fetching users list:", error)
        // Datos de prueba en caso de error
        setUsersList([
          { code: "001", name: "Juan Pérez", initials: "JP" },
          { code: "002", name: "María López", initials: "ML" },
          { code: "003", name: "Carlos Rodríguez", initials: "CR" },
        ])
      }
    }

    fetchUserData()
    fetchUsersList()
  }, [router])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const validateForm = () => {
    if (selectedType === "Turno pareja") {
      if (!selectedAMUser || !selectedPMUser) {
        setErrorMessage("Para turno pareja, debes seleccionar tanto el turno AM como el PM.")
        setIsErrorModalOpen(true)
        return false
      }
      if (selectedAMUser.code === selectedPMUser.code) {
        setErrorMessage("Para turno pareja, los códigos de AM y PM deben ser diferentes.")
        setIsErrorModalOpen(true)
        return false
      }
      if (!zone) {
        setErrorMessage("Para turno pareja, debes seleccionar una zona.")
        setIsErrorModalOpen(true)
        return false
      }
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // VALIDACIONES CRÍTICAS - Prevenir envíos vacíos
    console.log("🔍 Validando datos de equipo antes del envío...")
    console.log("📊 Estado actual:", { 
      selectedType, 
      userDataCode: userData.code,
      userDataName: userData.name,
      selectedAMUser: selectedAMUser?.code,
      selectedPMUser: selectedPMUser?.code,
      zone 
    })

    // 1. Validar que el usuario esté identificado
    if (!userData.code || !userData.name || userData.code.trim() === '' || userData.name.trim() === '') {
      setErrorMessage('Datos de usuario no válidos. Por favor, vuelve a iniciar sesión.')
      setIsErrorModalOpen(true)
      console.error("❌ Datos de usuario vacíos o inválidos")
      return
    }

    // 2. Validar que se haya seleccionado un tipo de equipo
    if (!selectedType || selectedType.trim() === '') {
      setErrorMessage('Debe seleccionar el tipo de equipo.')
      setIsErrorModalOpen(true)
      console.error("❌ Tipo de equipo no seleccionado")
      return
    }

    // 3. Validar formulario específico por tipo
    if (!validateForm()) {
      console.error("❌ Validación específica del formulario falló")
      return
    }

    // 4. Validar descripción (SIEMPRE requerida)
    const formElement = e.target as HTMLFormElement
    const description = formElement.description.value?.trim()
    
    if (!description || description.length < 10) {
      setErrorMessage('La descripción es requerida y debe tener al menos 10 caracteres.')
      setIsErrorModalOpen(true)
      console.error("❌ Descripción inválida:", description?.length || 0, "caracteres")
      return
    }

    // 5. Validaciones específicas por tipo de equipo
    if (selectedType === "Turno pareja") {
      if (!selectedAMUser || !selectedPMUser) {
        setErrorMessage('Para turno pareja, debe seleccionar tanto el turno AM como el PM.')
        setIsErrorModalOpen(true)
        console.error("❌ Usuarios AM/PM no seleccionados para turno pareja")
        return
      }
      if (!zone || zone.trim() === '') {
        setErrorMessage('Para turno pareja, debe seleccionar una zona.')
        setIsErrorModalOpen(true)
        console.error("❌ Zona no seleccionada para turno pareja")
        return
      }
    }

    if (selectedType === "Tabla partida" && (!zone || zone.trim() === '')) {
      setErrorMessage('Para tabla partida, debe seleccionar una zona.')
      setIsErrorModalOpen(true)
      console.error("❌ Zona no seleccionada para tabla partida")
      return
    }

    if (selectedType === "Disponible fijo") {
      const fixedShift = formElement.fixedShift?.value?.trim()
      if (!fixedShift) {
        setErrorMessage('Para disponible fijo, debe seleccionar el turno (AM o PM).')
        setIsErrorModalOpen(true)
        console.error("❌ Turno fijo no seleccionado")
        return
      }
    }

    console.log("✅ Todas las validaciones de equipo pasaron correctamente")

    try {
      // VALIDACIÓN FINAL y construcción de datos
      const finalShift = selectedType === "Disponible fijo" ? formElement.fixedShift?.value?.trim() : undefined
      
      const requestData = {
      type: selectedType,
        description: description,
      zona: selectedType === "Turno pareja" || selectedType === "Tabla partida" ? zone : undefined,
        codeAM: selectedAMUser?.code || null,
        codePM: selectedPMUser?.code || null,
        shift: finalShift,
        userCode: userData.code,
        userName: userData.name
      }

      console.log("📦 Datos finales de equipo a enviar:", requestData)

      // VERIFICACIÓN FINAL - No enviar si datos críticos están vacíos
      if (!requestData.type || !requestData.description || !requestData.userCode || !requestData.userName) {
        console.error("❌ DATOS CRÍTICOS DE EQUIPO VACÍOS DETECTADOS")
        setErrorMessage('Error crítico: Datos esenciales faltantes. No se puede enviar la solicitud.')
        setIsErrorModalOpen(true)
        return
      }

      // Validaciones específicas finales por tipo
      if (requestData.type === "Turno pareja" && (!requestData.codeAM || !requestData.codePM || !requestData.zona)) {
        console.error("❌ DATOS DE TURNO PAREJA INCOMPLETOS")
        setErrorMessage('Datos de turno pareja incompletos.')
        setIsErrorModalOpen(true)
        return
      }

      if (requestData.type === "Disponible fijo" && !requestData.shift) {
        console.error("❌ TURNO FIJO NO ESPECIFICADO")
        setErrorMessage('Debe especificar el turno para disponible fijo.')
        setIsErrorModalOpen(true)
        return
      }

      const token = localStorage.getItem("accessToken")
      if (!token) {
        throw new Error("No se encontró el token de acceso")
      }

      // Crear FormData para el envío
      const formData = new FormData()
      Object.entries(requestData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value.toString())
        }
      })

      // USAR EL HOOK DE CONEXIÓN INTELIGENTE
      console.log("📤 Enviando con protección contra duplicados...")
      const result = await connectionAwareSubmit.submit({ formData, token })

      console.log("✅ Solicitud de equipo enviada exitosamente:", result)
      setIsSuccess(true)
      
      // Reset the form de manera segura
      try {
      formElement.reset()
      } catch (resetError) {
        console.warn("Advertencia al resetear formulario:", resetError)
      }

      setSelectedType("")
      setSelectedAMUser(null)
      setSelectedPMUser(null)
      setZone("")

      // Auto-ocultar mensaje de éxito
      setTimeout(() => {
        setIsSuccess(false)
      }, 5000)

    } catch (error) {
      console.error("❌ Error enviando solicitud:", error)
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      
      if (!errorMessage.includes('duplicado') && !errorMessage.includes('esperar')) {
        setError(`Ocurrió un error al enviar la solicitud: ${errorMessage}`)
    }
  }
  }

  const handleTypeSelect = (type: string) => {
    setSelectedType(type)
    setIsTypeDialogOpen(false)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl p-8 max-w-md w-full"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-center text-red-700 mb-4">Error de conexión</h2>
          <p className="text-center text-gray-700 mb-6">{error}</p>
          <div className="flex justify-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => router.push("/")}
                className="bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 px-6 py-2.5 rounded-full shadow-lg"
              >
                Volver al inicio de sesión
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
          <div className="relative">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg"
            >
              <Briefcase className="h-12 w-12 text-white" />
            </motion.div>
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-green-200 border-t-green-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            ></motion.div>
          </div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-xl font-medium text-green-700"
          >
            Cargando Solicitud de Postulaciones...
          </motion.h2>
        </motion.div>
      </div>
    )
  }
}
