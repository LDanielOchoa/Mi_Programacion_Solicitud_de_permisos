// "use client"

// import type React from "react"

// import { useState, useEffect, useRef, useCallback } from "react"
// import { useRouter } from "next/navigation"
// import { motion, AnimatePresence } from "framer-motion"
// import { Button } from "@/components/ui/button"
// import { Label } from "@/components/ui/label"
// import { Textarea } from "@/components/ui/textarea"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Avatar, AvatarFallback } from "@/components/ui/avatar"
// import { Dialog, DialogContent } from "@/components/ui/dialog"
// import {
//   Loader2,
//   AlertCircle,
//   Briefcase,
//   Calendar,
//   FileText,
//   CheckCircle,
//   Info,
//   Clock,
//   User,
//   Phone,
//   Shield,
//   Plus,
//   ChevronRight,
// } from "lucide-react"
// import LoadingOverlay from "../../components/loading-overlay"
// import { ShiftSelection } from "./shift-selection"
// import { ZoneSelector } from "./zone-selector"
// import BottomNavigation from "../../components/BottomNavigation"
// import useConnectionAwareSubmit from "@/hooks/useConnectionAwareSubmit"
// import ConnectionStatus from "@/components/ConnectionStatus"
// import { toast } from "@/components/ui/use-toast"

// interface UserInterface {
//   code: string
//   name: string
//   initials: string
//   avatar?: string
// }

// export default function EquipmentRequestForm() {
//   const [isLoading, setIsLoading] = useState(true)
//   const [isSuccess, setIsSuccess] = useState(false)
//   const [userData, setUserData] = useState<UserInterface>({ code: "", name: "", initials: "" })
//   const [usersList, setUsersList] = useState<UserInterface[]>([])
//   const [error, setError] = useState("")
//   const [selectedType, setSelectedType] = useState("")
//   const [selectedAMUser, setSelectedAMUser] = useState<UserInterface | null>(null)
//   const [selectedPMUser, setSelectedPMUser] = useState<UserInterface | null>(null)
//   const [zone, setZone] = useState("")
//   const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false)
//   const [hasNewNotification, setHasNewNotification] = useState(false)
//   const [errorMessage, setErrorMessage] = useState("")
//   const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)
  
//   // Estados para conexión y envío
//   const [connectionStatus, setConnectionStatus] = useState<string>('')
//   const [progressMessage, setProgressMessage] = useState<string>('')
  
//   const router = useRouter()

//   // Funciones memoizadas para evitar bucles infinitos de re-renderizado
//   const handleProgress = useCallback((stage: string) => {
//     setProgressMessage(stage);
//     console.log('📊 Progreso del envío:', stage);
//   }, []);

//   const handleConnectionIssue = useCallback((issue: string) => {
//     setConnectionStatus(issue);
//     toast({
//       title: "Problema de conexión",
//       description: issue,
//       variant: "destructive",
//     });
//   }, []);

//   // Función de envío memoizada
//   const submitFunction = useCallback(async (data: any, signal: AbortSignal) => {
//     const response = await fetch("https://solicitud-permisos.sao6.com.co/api/equipment-request", {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${data.token}`,
//       },
//       body: data.formData,
//       signal
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(`Error al enviar la solicitud: ${errorData.detail || response.statusText}`);
//     }

//     return response.json();
//   }, []);

//   // Hook para envío inteligente con protección contra duplicados
//   const connectionAwareSubmit = useConnectionAwareSubmit(
//     submitFunction,
//     {
//       timeout: 45000, // 45 segundos para solicitudes de equipos
//       maxRetries: 3,
//       retryDelay: 3000,
//       deduplicationWindow: 8000, // 8 segundos para deduplicación
//       onProgress: handleProgress,
//       onConnectionIssue: handleConnectionIssue
//     }
//   );

//   const zones = [
//     "Acevedo",
//     "Tricentenario",
//     "Universidad-gardel",
//     "Hospital",
//     "Prado",
//     "Cruz",
//     "San Antonio",
//     "Exposiciones",
//     "Alejandro",
//   ]

//   const equipmentTypes = [
//     {
//       id: "turno-pareja",
//       title: "Turno pareja",
//       description: "Dos operadores trabajando en turnos complementarios (AM y PM)",
//       icon: <Calendar className="h-8 w-8 text-green-600" />,
//       color: "from-green-50 to-green-100",
//       borderColor: "border-green-200",
//       value: "Turno pareja",
//     },
//     {
//       id: "tabla-partida",
//       title: "Tabla partida",
//       description: "Distribución de horas de trabajo en diferentes momentos del día",
//       icon: <Clock className="h-8 w-8 text-amber-600" />,
//       color: "from-amber-50 to-amber-100",
//       borderColor: "border-amber-200",
//       value: "Tabla partida",
//     },
//     {
//       id: "disponible-fijo",
//       title: "Disponible fijo",
//       description: "Horario específico (AM o PM) de manera permanente",
//       icon: <Calendar className="h-8 w-8 text-blue-600" />,
//       color: "from-blue-50 to-blue-100",
//       borderColor: "border-blue-200",
//       value: "Disponible fijo",
//     },
//   ]

//   useEffect(() => {
//     const fetchUserData = async () => {
//       try {
//         const token = localStorage.getItem("accessToken")

//         if (!token) {
//           router.push("/")
//           return
//         }

//         const response = await fetch("https://solicitud-permisos.sao6.com.co/api/auth/user", {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         })

//         if (response.status === 401) {
//           localStorage.removeItem("accessToken")
//           router.push("/")
//           return
//         }

//         if (!response.ok) {
//           throw new Error("Error al obtener datos del usuario")
//         }

//         const data = await response.json()
//         const initials = getInitials(data.name)
//         setUserData({ code: data.code, name: data.name, initials })

//         // Check for notifications
//         const storedNotifications = localStorage.getItem("dashboardNotifications")
//         if (storedNotifications) {
//           const parsedNotifications = JSON.parse(storedNotifications)
//           setHasNewNotification(parsedNotifications.some((n: any) => n.isNew))
//         }
//       } catch (error) {
//         console.error("Error fetching user data:", error)
//         setError("No se pudieron cargar los datos del usuario. Por favor, inicie sesión nuevamente.")
//       } finally {
//         // Simulamos una carga más corta para desarrollo
//         setTimeout(() => {
//           setIsLoading(false)
//         }, 500)
//       }
//     }

//     const fetchUsersList = async () => {
//       try {
//         const response = await fetch("https://solicitud-permisos.sao6.com.co/api/users/list")
//         if (!response.ok) {
//           throw new Error("Error al obtener la lista de usuarios")
//         }
//         const data = await response.json()
//         // Asegurarse de que cada usuario tenga iniciales
//         const usersWithInitials = data.map((user: any) => ({
//           ...user,
//           initials: getInitials(user.name),
//         }))
//         setUsersList(usersWithInitials)
//         console.log("Users loaded:", usersWithInitials.length)
//       } catch (error) {
//         console.error("Error fetching users list:", error)
//         // Datos de prueba en caso de error
//         setUsersList([
//           { code: "001", name: "Juan Pérez", initials: "JP" },
//           { code: "002", name: "María López", initials: "ML" },
//           { code: "003", name: "Carlos Rodríguez", initials: "CR" },
//         ])
//       }
//     }

//     fetchUserData()
//     fetchUsersList()
//   }, [router])

//   const getInitials = (name: string) => {
//     return name
//       .split(" ")
//       .map((part) => part[0])
//       .join("")
//       .toUpperCase()
//       .substring(0, 2)
//   }

//   const validateForm = () => {
//     if (selectedType === "Turno pareja") {
//       if (!selectedAMUser || !selectedPMUser) {
//         setErrorMessage("Para turno pareja, debes seleccionar tanto el turno AM como el PM.")
//         setIsErrorModalOpen(true)
//         return false
//       }
//       if (selectedAMUser.code === selectedPMUser.code) {
//         setErrorMessage("Para turno pareja, los códigos de AM y PM deben ser diferentes.")
//         setIsErrorModalOpen(true)
//         return false
//       }
//       if (!zone) {
//         setErrorMessage("Para turno pareja, debes seleccionar una zona.")
//         setIsErrorModalOpen(true)
//         return false
//       }
//     }
//     return true
//   }



//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     e.stopPropagation()

//     // VALIDACIONES CRÍTICAS - Prevenir envíos vacíos
//     console.log("🔍 Validando datos de equipo antes del envío...")
//     console.log("📊 Estado actual:", { 
//       selectedType, 
//       userDataCode: userData.code,
//       userDataName: userData.name,
//       selectedAMUser: selectedAMUser?.code,
//       selectedPMUser: selectedPMUser?.code,
//       zone 
//     })

//     // 1. Validar que el usuario esté identificado
//     if (!userData.code || !userData.name || userData.code.trim() === '' || userData.name.trim() === '') {
//       setErrorMessage('Datos de usuario no válidos. Por favor, vuelve a iniciar sesión.')
//       setIsErrorModalOpen(true)
//       console.error("❌ Datos de usuario vacíos o inválidos")
//       return
//     }

//     // 2. Validar que se haya seleccionado un tipo de equipo
//     if (!selectedType || selectedType.trim() === '') {
//       setErrorMessage('Debe seleccionar el tipo de equipo.')
//       setIsErrorModalOpen(true)
//       console.error("❌ Tipo de equipo no seleccionado")
//       return
//     }

//     // 3. Validar formulario específico por tipo
//     if (!validateForm()) {
//       console.error("❌ Validación específica del formulario falló")
//       return
//     }

//     // 4. Validar descripción (SIEMPRE requerida)
//     const formElement = e.target as HTMLFormElement
//     const description = formElement.description.value?.trim()
    
//     if (!description || description.length < 10) {
//       setErrorMessage('La descripción es requerida y debe tener al menos 10 caracteres.')
//       setIsErrorModalOpen(true)
//       console.error("❌ Descripción inválida:", description?.length || 0, "caracteres")
//       return
//     }

//     // 5. Validaciones específicas por tipo de equipo
//     if (selectedType === "Turno pareja") {
//       if (!selectedAMUser || !selectedPMUser) {
//         setErrorMessage('Para turno pareja, debe seleccionar tanto el turno AM como el PM.')
//         setIsErrorModalOpen(true)
//         console.error("❌ Usuarios AM/PM no seleccionados para turno pareja")
//         return
//       }
//       if (!zone || zone.trim() === '') {
//         setErrorMessage('Para turno pareja, debe seleccionar una zona.')
//         setIsErrorModalOpen(true)
//         console.error("❌ Zona no seleccionada para turno pareja")
//         return
//       }
//     }

//     if (selectedType === "Tabla partida" && (!zone || zone.trim() === '')) {
//       setErrorMessage('Para tabla partida, debe seleccionar una zona.')
//       setIsErrorModalOpen(true)
//       console.error("❌ Zona no seleccionada para tabla partida")
//       return
//     }

//     if (selectedType === "Disponible fijo") {
//       const fixedShift = formElement.fixedShift?.value?.trim()
//       if (!fixedShift) {
//         setErrorMessage('Para disponible fijo, debe seleccionar el turno (AM o PM).')
//         setIsErrorModalOpen(true)
//         console.error("❌ Turno fijo no seleccionado")
//         return
//       }
//     }

//     console.log("✅ Todas las validaciones de equipo pasaron correctamente")

//     try {
//       // VALIDACIÓN FINAL y construcción de datos
//       const finalShift = selectedType === "Disponible fijo" ? formElement.fixedShift?.value?.trim() : undefined
      
//       const requestData = {
//       type: selectedType,
//         description: description,
//       zona: selectedType === "Turno pareja" || selectedType === "Tabla partida" ? zone : undefined,
//         codeAM: selectedAMUser?.code || null,
//         codePM: selectedPMUser?.code || null,
//         shift: finalShift,
//         userCode: userData.code,
//         userName: userData.name
//       }

//       console.log("📦 Datos finales de equipo a enviar:", requestData)

//       // VERIFICACIÓN FINAL - No enviar si datos críticos están vacíos
//       if (!requestData.type || !requestData.description || !requestData.userCode || !requestData.userName) {
//         console.error("❌ DATOS CRÍTICOS DE EQUIPO VACÍOS DETECTADOS")
//         setErrorMessage('Error crítico: Datos esenciales faltantes. No se puede enviar la solicitud.')
//         setIsErrorModalOpen(true)
//         return
//       }

//       // Validaciones específicas finales por tipo
//       if (requestData.type === "Turno pareja" && (!requestData.codeAM || !requestData.codePM || !requestData.zona)) {
//         console.error("❌ DATOS DE TURNO PAREJA INCOMPLETOS")
//         setErrorMessage('Datos de turno pareja incompletos.')
//         setIsErrorModalOpen(true)
//         return
//       }

//       if (requestData.type === "Disponible fijo" && !requestData.shift) {
//         console.error("❌ TURNO FIJO NO ESPECIFICADO")
//         setErrorMessage('Debe especificar el turno para disponible fijo.')
//         setIsErrorModalOpen(true)
//         return
//       }

//       const token = localStorage.getItem("accessToken")
//       if (!token) {
//         throw new Error("No se encontró el token de acceso")
//       }

//       // Crear FormData para el envío
//       const formData = new FormData()
//       Object.entries(requestData).forEach(([key, value]) => {
//         if (value !== null && value !== undefined) {
//           formData.append(key, value.toString())
//         }
//       })

//       // USAR EL HOOK DE CONEXIÓN INTELIGENTE
//       console.log("📤 Enviando con protección contra duplicados...")
//       const result = await connectionAwareSubmit.submit({ formData, token })

//       console.log("✅ Solicitud de equipo enviada exitosamente:", result)
//       setIsSuccess(true)
      
//       // Reset the form de manera segura
//       try {
//       formElement.reset()
//       } catch (resetError) {
//         console.warn("Advertencia al resetear formulario:", resetError)
//       }

//       setSelectedType("")
//       setSelectedAMUser(null)
//       setSelectedPMUser(null)
//       setZone("")

//       // Auto-ocultar mensaje de éxito
//       setTimeout(() => {
//         setIsSuccess(false)
//       }, 5000)

//     } catch (error) {
//       console.error("❌ Error enviando solicitud:", error)
//       const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      
//       if (!errorMessage.includes('duplicado') && !errorMessage.includes('esperar')) {
//         setError(`Ocurrió un error al enviar la solicitud: ${errorMessage}`)
//     }
//   }
//   }



//   const handleTypeSelect = (type: string) => {
//     setSelectedType(type)
//     setIsTypeDialogOpen(false)
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center p-4">
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//           className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl p-8 max-w-md w-full"
//         >
//           <div className="flex items-center justify-center mb-6">
//             <div className="bg-red-100 p-3 rounded-full">
//               <AlertCircle className="h-8 w-8 text-red-600" />
//             </div>
//           </div>
//           <h2 className="text-xl font-bold text-center text-red-700 mb-4">Error de conexión</h2>
//           <p className="text-center text-gray-700 mb-6">{error}</p>
//           <div className="flex justify-center">
//             <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
//               <Button
//                 onClick={() => router.push("/")}
//                 className="bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 px-6 py-2.5 rounded-full shadow-lg"
//               >
//                 Volver al inicio de sesión
//               </Button>
//             </motion.div>
//           </div>
//         </motion.div>
//       </div>
//     )
//   }

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center">
//         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
//           <div className="relative">
//             <motion.div
//               animate={{
//                 scale: [1, 1.1, 1],
//               }}
//               transition={{
//                 duration: 2,
//                 repeat: Number.POSITIVE_INFINITY,
//                 ease: "easeInOut",
//               }}
//               className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg"
//             >
//               <Briefcase className="h-12 w-12 text-white" />
//             </motion.div>
//             <motion.div
//               className="absolute inset-0 rounded-full border-4 border-green-200 border-t-green-500"
//               animate={{ rotate: 360 }}
//               transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
//             ></motion.div>
//           </div>
//           <motion.h2
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.3 }}
//             className="mt-6 text-xl font-medium text-green-700"
//           >
//             Cargando Solicitud de Postulaciones...
//           </motion.h2>
//         </motion.div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
//       <AnimatePresence>{connectionAwareSubmit.state.isSubmitting && <LoadingOverlay />}</AnimatePresence>

//       {/* Header */}
//       <div className="bg-green-500 text-white rounded-b-[40px] shadow-lg">
//         <div className="container mx-auto px-4 py-8 relative z-10">
//           {/* Elemento decorativo eliminado para evitar espacio en blanco */}
//           <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -mb-16 -ml-16"></div>

//           <div className="flex items-center justify-between">
//             <div className="flex items-center">
//               <motion.div
//                 initial={{ scale: 0.8, opacity: 0 }}
//                 animate={{ scale: 1, opacity: 1 }}
//                 transition={{ duration: 0.5 }}
//                 className="mr-4 bg-white/20 p-3 rounded-2xl backdrop-blur-sm shadow-lg"
//               >
//                 <Briefcase className="h-7 w-7" />
//               </motion.div>
//               <motion.div
//                 initial={{ x: -20, opacity: 0 }}
//                 animate={{ x: 0, opacity: 1 }}
//                 transition={{ duration: 0.5, delay: 0.1 }}
//               >
//                 <h1 className="text-3xl font-bold">Solicitud de Postulaciones</h1>
//                 <p className="text-green-100 text-sm mt-1">Gestión de turnos y disponibilidad</p>
//               </motion.div>
//             </div>

//             <div className="flex items-center space-x-3">
//               <motion.div
//                 initial={{ scale: 0.8, opacity: 0 }}
//                 animate={{ scale: 1, opacity: 1 }}
//                 transition={{ duration: 0.5, delay: 0.2 }}
//                 whileHover={{ scale: 1.05 }}
//               >
//                 <Avatar className="h-12 w-12 border-2 border-white/30 shadow-lg">
//                   <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white text-lg">
//                     {userData.initials || "U"}
//                   </AvatarFallback>
//                 </Avatar>
//               </motion.div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Espacio adicional entre el header y el contenido */}
//       <div className="h-10"></div>

//       <div className="container mx-auto px-4 py-6">
//         <motion.div
//           initial={{ opacity: 0, y: 30 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6, ease: "easeOut" }}
//           className="mb-8"
//         >
//           <Card className="bg-white/90 backdrop-blur-md border-green-100 shadow-lg overflow-hidden rounded-3xl">
//             <CardHeader className="pb-2 pt-5 px-6">
//               <CardTitle className="text-xl font-semibold text-green-800 flex items-center">
//                 <FileText className="h-6 w-6 mr-3 text-green-600" />
//                 Formulario de Solicitud
//               </CardTitle>
//             </CardHeader>

//             <CardContent className="p-6">
//               <Tabs defaultValue="form" className="w-full">
//                 <TabsList className="bg-green-100/50 p-1.5 mb-6 rounded-2xl">
//                   <TabsTrigger
//                     value="form"
//                     className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white"
//                   >
//                     <FileText className="h-4 w-4 mr-2" />
//                     Formulario
//                   </TabsTrigger>
//                   <TabsTrigger
//                     value="info"
//                     className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white"
//                   >
//                     <Info className="h-4 w-4 mr-2" />
//                     Información
//                   </TabsTrigger>
//                 </TabsList>

//                 <TabsContent value="form" className="focus-visible:outline-none focus-visible:ring-0">
//                   <form onSubmit={handleSubmit} className="space-y-6">
//                     {/* User Info Card */}
//                     <motion.div
//                       initial={{ opacity: 0, y: 20 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       transition={{ delay: 0.3 }}
//                       className="bg-gradient-to-r from-green-50 to-green-100 rounded-3xl p-5 border border-green-200 shadow-sm relative overflow-hidden"
//                     >
//                       <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-green-200/30"></div>
//                       <div className="flex items-center relative z-10">
//                         <Avatar className="h-16 w-16 border-2 border-green-200 shadow-md mr-4">
//                           <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-lg">
//                             {userData.initials || "U"}
//                           </AvatarFallback>
//                         </Avatar>
//                         <div className="flex-1">
//                           <div className="flex items-center mb-1">
//                             <User className="h-4 w-4 text-green-600 mr-2" />
//                             <h3 className="font-medium text-green-800">{userData.name || "Usuario"}</h3>
//                           </div>
//                           <div className="flex items-center mb-1">
//                             <Shield className="h-4 w-4 text-green-600 mr-2" />
//                             <p className="text-sm text-green-700">Código: {userData.code || "000"}</p>
//                           </div>
//                         </div>
//                       </div>
//                     </motion.div>

//                     <div className="space-y-6">
//                       {/* Tipo de equipo con diálogo modal */}
//                       <motion.div
//                         initial={{ opacity: 0, y: 20 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         transition={{ delay: 0.4 }}
//                         className="space-y-2"
//                       >
//                         <Label htmlFor="type" className="text-green-700 font-medium flex items-center">
//                           <Briefcase className="h-4 w-4 mr-2 text-green-600" />
//                           Tipo de equipo
//                         </Label>

//                         <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
//                           <motion.button
//                             whileHover={{ scale: 1.01 }}
//                             whileTap={{ scale: 0.99 }}
//                             onClick={() => setIsTypeDialogOpen(true)}
//                             className="w-full flex items-center justify-between p-4 rounded-xl border border-green-200 bg-white hover:bg-green-50 transition-colors group"
//                           >
//                             <div className="flex items-center">
//                               {selectedType ? (
//                                 <>
//                                   <div className="bg-green-100 p-2 rounded-lg mr-3">
//                                     {selectedType === "Turno pareja" && <Calendar className="h-5 w-5 text-green-600" />}
//                                     {selectedType === "Tabla partida" && <Clock className="h-5 w-5 text-amber-600" />}
//                                     {selectedType === "Disponible fijo" && (
//                                       <Calendar className="h-5 w-5 text-blue-600" />
//                                     )}
//                                   </div>
//                                   <span className="font-medium">{selectedType}</span>
//                                 </>
//                               ) : (
//                                 <>
//                                   <div className="bg-gray-100 p-2 rounded-lg mr-3 group-hover:bg-green-100 transition-colors">
//                                     <Briefcase className="h-5 w-5 text-gray-500 group-hover:text-green-600 transition-colors" />
//                                   </div>
//                                   <span className="text-gray-500 group-hover:text-gray-700 transition-colors">
//                                     Seleccione el tipo de equipo
//                                   </span>
//                                 </>
//                               )}
//                             </div>
//                             <ChevronRight className="h-5 w-5 text-green-500" />
//                           </motion.button>

//                           <DialogContent className="sm:max-w-md p-0 rounded-2xl overflow-hidden border-0 shadow-2xl">
//                             {/* Header */}
//                             <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
//                               <div className="flex items-center mb-1">
//                                 <div className="bg-white/20 p-1.5 rounded-lg mr-2">
//                                   <Briefcase className="h-5 w-5" />
//                                 </div>
//                                 <h2 className="text-xl font-bold text-white">Seleccionar Tipo de Equipo</h2>
//                               </div>
//                               <p className="text-white/80 text-sm">Elija el tipo de equipo para su solicitud</p>
//                             </div>

//                             {/* Equipment Types */}
//                             <div className="p-6 space-y-4">
//                               {equipmentTypes.map((type) => (
//                                 <motion.div
//                                   key={type.id}
//                                   whileHover={{ scale: 1.02 }}
//                                   whileTap={{ scale: 0.98 }}
//                                   onClick={() => handleTypeSelect(type.value)}
//                                   className={`bg-gradient-to-br ${type.color} p-4 rounded-2xl border ${type.borderColor} shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md`}
//                                 >
//                                   <div className="flex items-start">
//                                     <div className="bg-white p-2 rounded-xl shadow-sm mr-3">{type.icon}</div>
//                                     <div className="flex-1">
//                                       <h3 className="font-medium text-lg mb-1">{type.title}</h3>
//                                       <p className="text-sm text-gray-600">{type.description}</p>
//                                     </div>
//                                     {selectedType === type.value && (
//                                       <div className="bg-green-500 rounded-full p-1">
//                                         <CheckCircle className="h-5 w-5 text-white" />
//                                       </div>
//                                     )}
//                                   </div>
//                                 </motion.div>
//                               ))}
//                             </div>
//                           </DialogContent>
//                         </Dialog>
//                       </motion.div>

//                       {/* Asegurarse de que la visualización condicional para "Turno pareja" funcione correctamente */}
//                       <AnimatePresence>
//                         {selectedType === "Turno pareja" && (
//                           <motion.div
//                             initial={{ opacity: 0, y: 20 }} // Cambiar de height a y para evitar problemas de layout
//                             animate={{ opacity: 1, y: 0 }}
//                             exit={{ opacity: 0, y: -20 }}
//                             className="space-y-6"
//                           >
//                             {/* Componente de selección de turnos */}
//                             <ShiftSelection
//                               selectedAMUser={selectedAMUser}
//                               selectedPMUser={selectedPMUser}
//                               onAMUserSelect={setSelectedAMUser}
//                               onPMUserSelect={setSelectedPMUser}
//                               usersList={usersList}
//                             />
//                           </motion.div>
//                         )}
//                       </AnimatePresence>

//                       <AnimatePresence>
//                         {(selectedType === "Turno pareja" || selectedType === "Tabla partida") && (
//                           <motion.div
//                             initial={{ opacity: 0, y: 20 }} // Cambiar de height a y para evitar problemas de layout
//                             animate={{ opacity: 1, y: 0 }}
//                             exit={{ opacity: 0, y: -20 }}
//                             className="space-y-2"
//                           >
//                             {/* Componente de selección de zona */}
//                             <ZoneSelector selectedZone={zone} onZoneSelect={setZone} zones={zones} />
//                           </motion.div>
//                         )}
//                       </AnimatePresence>

//                       <AnimatePresence>
//                         {selectedType === "Disponible fijo" && (
//                           <motion.div
//                             initial={{ opacity: 0, y: 20 }} // Cambiar de height a y para evitar problemas de layout
//                             animate={{ opacity: 1, y: 0 }}
//                             exit={{ opacity: 0, y: -20 }}
//                             className="space-y-4"
//                           >
//                             <Label className="text-green-700 font-medium flex items-center">
//                               <Calendar className="h-4 w-4 mr-2 text-green-600" />
//                               Tipo de disponibilidad
//                             </Label>

//                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                               {[
//                                 {
//                                   id: "am",
//                                   title: "Disponible Fijo AM",
//                                   icon: <Calendar className="h-5 w-5" />,
//                                   color: "from-green-500 to-green-600",
//                                 },
//                                 {
//                                   id: "pm",
//                                   title: "Disponible Fijo PM",
//                                   icon: <Calendar className="h-5 w-5" />,
//                                   color: "from-green-600 to-green-700",
//                                 },
//                                 {
//                                   id: "ruta-am",
//                                   title: "Turno a cualquiera ruta AM",
//                                   icon: <Calendar className="h-5 w-5" />,
//                                   color: "from-green-500 to-green-600",
//                                 },
//                                 {
//                                   id: "ruta-pm",
//                                   title: "Turno a cualquiera ruta PM",
//                                   icon: <Calendar className="h-5 w-5" />,
//                                   color: "from-green-600 to-green-700",
//                                 },
//                               ].map((option) => (
//                                 <motion.label
//                                   key={option.id}
//                                   whileHover={{ scale: 1.02 }}
//                                   whileTap={{ scale: 0.98 }}
//                                   className="cursor-pointer"
//                                 >
//                                   <input type="radio" name="fixedShift" value={option.title} className="sr-only peer" />
                                  
//                                     <div className="flex items-center">
//                                       <div className="bg-gray-100 peer-checked:bg-white/20 p-2 rounded-lg mr-3 transition-colors">
//                                         {option.icon}
//                                       </div>
//                                       <span className="font-medium">{option.title}</span>
//                                     </div>
                                  
//                                 </motion.label>
//                               ))}
//                             </div>
//                           </motion.div>
//                         )}
//                       </AnimatePresence>

//                       <motion.div
//                         initial={{ opacity: 0, y: 20 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         transition={{ delay: 0.5 }}
//                         className="space-y-2"
//                       >
//                         <Label htmlFor="description" className="text-green-700 font-medium flex items-center">
//                           <FileText className="h-4 w-4 mr-2 text-green-600" />
//                           Descripción de la solicitud
//                         </Label>
//                         <Textarea
//                           id="description"
//                           placeholder="Ingrese el detalle de tu solicitud de equipo"
//                           className="min-h-[120px] border-green-200 focus:ring-green-500 bg-white shadow-sm hover:border-green-400 transition-colors rounded-xl"
//                           required
//                         />
//                       </motion.div>
//                     </div>

//                     <div className="pt-6 flex justify-center">
//                       <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
//                         <Button
//                           type="submit"
//                           className="bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300 shadow-lg flex items-center gap-2"
//                           disabled={connectionAwareSubmit.state.isSubmitting}
//                         >
//                           {connectionAwareSubmit.state.isSubmitting ? (
//                             <Loader2 className="h-5 w-5 animate-spin" />
//                           ) : (
//                             <CheckCircle className="h-5 w-5" />
//                           )}
//                           {connectionAwareSubmit.state.isSubmitting ? "Enviando..." : "Enviar Solicitud"}
//                         </Button>
//                       </motion.div>
//                     </div>
//                   </form>
//                 </TabsContent>

//                 <TabsContent value="info" className="focus-visible:outline-none focus-visible:ring-0">
//                   <motion.div
//                     initial={{ opacity: 0, y: 20 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ duration: 0.5 }}
//                   >
//                     <div className="flex items-center mb-6">
//                       <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl shadow-md mr-4">
//                         <Info className="h-6 w-6 text-white" />
//                       </div>
//                       <div>
//                         <h2 className="text-xl font-bold text-green-800">Información sobre Postulaciones</h2>
//                         <p className="text-sm text-green-600">Conoce los detalles de cada tipo de solicitud</p>
//                       </div>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//                       <motion.div
//                         initial={{ scale: 0.9, opacity: 0 }}
//                         animate={{ scale: 1, opacity: 1 }}
//                         transition={{ duration: 0.4, delay: 0.1 }}
//                         whileHover={{ scale: 1.03, y: -5 }}
//                         className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-3xl border border-green-200 shadow-md relative overflow-hidden group"
//                       >
//                         <div className="absolute top-0 right-0 w-20 h-20 bg-green-200 rounded-full opacity-20 -mt-10 -mr-10 group-hover:scale-150 transition-transform duration-500"></div>
//                         <div className="flex items-center justify-between mb-3 relative z-10">
//                           <div className="bg-white p-2 rounded-xl shadow-md">
//                             <Calendar className="h-6 w-6 text-green-600" />
//                           </div>
//                           <div className="bg-green-100 text-green-800 border border-green-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
//                             Recomendado
//                           </div>
//                         </div>
//                         <h3 className="text-lg font-semibold text-green-800 mb-2 relative z-10">Turno Pareja</h3>
//                         <p className="text-sm text-green-700 relative z-10">
//                           El turno pareja permite que dos operadores trabajen en la misma zona en turnos complementarios
//                           (AM y PM). Esto facilita la coordinación y mejora la eficiencia operativa.
//                         </p>
//                       </motion.div>

//                       <motion.div
//                         initial={{ scale: 0.9, opacity: 0 }}
//                         animate={{ scale: 1, opacity: 1 }}
//                         transition={{ duration: 0.4, delay: 0.2 }}
//                         whileHover={{ scale: 1.03, y: -5 }}
//                         className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-3xl border border-green-200 shadow-md relative overflow-hidden group"
//                       >
//                         <div className="absolute top-0 right-0 w-20 h-20 bg-green-200 rounded-full opacity-20 -mt-10 -mr-10 group-hover:scale-150 transition-transform duration-500"></div>
//                         <div className="flex items-center justify-between mb-3 relative z-10">
//                           <div className="bg-white p-2 rounded-xl shadow-md">
//                             <Clock className="h-6 w-6 text-green-600" />
//                           </div>
//                           <div className="bg-green-100 text-green-800 border border-green-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
//                             Flexible
//                           </div>
//                         </div>
//                         <h3 className="text-lg font-semibold text-green-800 mb-2 relative z-10">Tabla Partida</h3>
//                         <p className="text-sm text-green-700 relative z-10">
//                           La tabla partida permite distribuir las horas de trabajo en diferentes momentos del día,
//                           adaptándose a las necesidades operativas de cada zona.
//                         </p>
//                       </motion.div>

//                       <motion.div
//                         initial={{ scale: 0.9, opacity: 0 }}
//                         animate={{ scale: 1, opacity: 1 }}
//                         transition={{ duration: 0.4, delay: 0.3 }}
//                         whileHover={{ scale: 1.03, y: -5 }}
//                         className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-3xl border border-green-200 shadow-md relative overflow-hidden group"
//                       >
//                         <div className="absolute top-0 right-0 w-20 h-20 bg-green-200 rounded-full opacity-20 -mt-10 -mr-10 group-hover:scale-150 transition-transform duration-500"></div>
//                         <div className="flex items-center justify-between mb-3 relative z-10">
//                           <div className="bg-white p-2 rounded-xl shadow-md">
//                             <Calendar className="h-6 w-6 text-green-600" />
//                           </div>
//                           <div className="bg-green-100 text-green-800 border border-green-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
//                             Estable
//                           </div>
//                         </div>
//                         <h3 className="text-lg font-semibold text-green-800 mb-2 relative z-10">Disponible Fijo</h3>
//                         <p className="text-sm text-green-700 relative z-10">
//                           El disponible fijo asigna un horario específico (AM o PM) de manera permanente, lo que
//                           proporciona estabilidad en la programación y facilita la planificación personal.
//                         </p>
//                       </motion.div>
//                     </div>

//                     <motion.div
//                       initial={{ opacity: 0, y: 20 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       transition={{ duration: 0.5, delay: 0.4 }}
//                       className="bg-gradient-to-r from-green-600 to-green-500 p-5 rounded-3xl shadow-lg text-white mt-6"
//                     >
//                       <div className="flex items-center mb-3">
//                         <div className="bg-white/20 p-2 rounded-xl mr-3">
//                           <Info className="h-5 w-5" />
//                         </div>
//                         <h3 className="font-medium text-lg">¿Necesitas ayuda?</h3>
//                       </div>
//                       <p className="text-green-50 text-sm mb-4">
//                         Si tienes dudas sobre qué tipo de solicitud es mejor para ti, consulta con tu supervisor o envía
//                         un mensaje al departamento de recursos humanos.
//                       </p>
//                       <div className="flex flex-wrap gap-2">
//                         <Button
//                           variant="outline"
//                           className="bg-white/20 text-white border-white/40 hover:bg-white/30 rounded-full"
//                         >
//                           Contactar soporte
//                         </Button>
//                         <Button
//                           variant="outline"
//                           className="bg-white/20 text-white border-white/40 hover:bg-white/30 rounded-full"
//                         >
//                           Ver guía de solicitudes
//                         </Button>
//                       </div>
//                     </motion.div>
//                   </motion.div>
//                 </TabsContent>
//               </Tabs>
//             </CardContent>
//           </Card>
//         </motion.div>
//       </div>

//       <AnimatePresence>
//         {isSuccess && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70 backdrop-blur-sm"
//           >
//             <motion.div
//               className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full mx-4 border border-green-100 relative overflow-hidden"
//               initial={{ y: 100, opacity: 0 }}
//               animate={{ y: 0, opacity: 1 }}
//               exit={{ y: 100, opacity: 0 }}
//               transition={{ type: "spring", damping: 15 }}
//             >
//               <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 to-green-600"></div>
//               <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-100 rounded-full opacity-20"></div>
//               <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-green-100 rounded-full opacity-20"></div>

//               <div className="flex flex-col items-center text-center relative z-10">
//                 <motion.div
//                   initial={{ scale: 0 }}
//                   animate={{ scale: 1 }}
//                   transition={{ delay: 0.2, type: "spring", damping: 10 }}
//                   className="relative mb-6"
//                 >
//                   <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
//                     <motion.svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       width="40"
//                       height="40"
//                       viewBox="0 0 24 24"
//                       fill="none"
//                       stroke="currentColor"
//                       strokeWidth="3"
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       className="text-white"
//                       initial={{ pathLength: 0 }}
//                       animate={{ pathLength: 1 }}
//                       transition={{ duration: 0.8, delay: 0.5 }}
//                     >
//                       <polyline points="20 6 9 17 4 12"></polyline>
//                     </motion.svg>
//                   </div>
//                   <motion.div
//                     className="absolute inset-0 rounded-full border-4 border-green-200 border-t-transparent"
//                     initial={{ rotate: 0 }}
//                     animate={{ rotate: 360 }}
//                     transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
//                   ></motion.div>
//                 </motion.div>
//                 <motion.div
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ delay: 0.4 }}
//                   className="w-full"
//                 >
//                   <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-green-500 mb-3">
//                     ¡Solicitud Enviada!
//                   </h2>

//                   <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 mb-6 border border-green-200 shadow-inner">
//                     <div className="flex items-start mb-3">
//                       <div className="bg-white rounded-full p-1 mr-2 shadow-sm">
//                         <Info className="h-4 w-4 text-green-600" />
//                       </div>
//                       <p className="text-green-800 text-sm">
//                         Su solicitud de postulación ha sido enviada correctamente.
//                       </p>
//                     </div>

//                     <div className="flex items-start">
//                       <div className="bg-white rounded-full p-1 mr-2 shadow-sm">
//                         <Clock className="h-4 w-4 text-green-600" />
//                       </div>
//                       <p className="text-green-800 text-sm">
//                         Recibirá una notificación cuando su solicitud sea procesada.
//                       </p>
//                     </div>
//                   </div>

//                   <div className="flex justify-center">
//                     <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
//                       <Button
//                         onClick={() => setIsSuccess(false)}
//                         className="bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 px-6 sm:px-8 py-2 sm:py-3 rounded-full text-base sm:text-lg font-semibold transition-all duration-300 shadow-lg flex items-center gap-2"
//                       >
//                         <CheckCircle className="h-5 w-5" />
//                         Entendido
//                       </Button>
//                     </motion.div>
//                   </div>
//                 </motion.div>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {isErrorModalOpen && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70 backdrop-blur-sm"
//           >
//             <motion.div
//               className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full mx-4 border border-red-100 relative overflow-hidden"
//               initial={{ y: 100, opacity: 0 }}
//               animate={{ y: 0, opacity: 1 }}
//               exit={{ y: 100, opacity: 0 }}
//               transition={{ type: "spring", damping: 15 }}
//             >
//               <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-400 to-red-600"></div>

//               <div className="flex flex-col items-center text-center relative z-10">
//                 <motion.div
//                   initial={{ scale: 0 }}
//                   animate={{ scale: 1 }}
//                   transition={{ delay: 0.2, type: "spring", damping: 10 }}
//                   className="relative mb-6"
//                 >
//                   <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg">
//                     <AlertCircle className="h-10 w-10 text-white" />
//                   </div>
//                 </motion.div>

//                 <h2 className="text-2xl font-bold text-red-700 mb-3">Error de Validación</h2>

//                 <div className="bg-red-50 rounded-xl p-4 mb-6 border border-red-200">
//                   <p className="text-red-800">{errorMessage}</p>
//                 </div>

//                 <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
//                   <Button
//                     onClick={() => setIsErrorModalOpen(false)}
//                     className="bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 px-6 py-2 rounded-full shadow-md"
//                   >
//                     Entendido
//                   </Button>
//                 </motion.div>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Componente de estado de conexión */}
//       <ConnectionStatus
//         connectionQuality={connectionAwareSubmit.state.connectionQuality}
//         isSubmitting={connectionAwareSubmit.state.isSubmitting}
//         isRetrying={connectionAwareSubmit.state.isRetrying}
//         retryCount={connectionAwareSubmit.state.retryCount}
//         stage={connectionAwareSubmit.state.stage}
//         progressMessage={progressMessage}
//         connectionStatus={connectionStatus}
//         pendingRequestsCount={connectionAwareSubmit.pendingRequestsCount}
//         onCancel={connectionAwareSubmit.cancelAllRequests}
//       />

//       <BottomNavigation hasNewNotification={hasNewNotification} />
//     </div>
//   )
// }

