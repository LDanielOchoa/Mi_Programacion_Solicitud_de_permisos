"use client"

import React from "react"

import type { ReactElement } from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import jwt from "jsonwebtoken"
import { Eye, EyeOff, User, CheckCircle, ArrowRight, AlertCircle, Info, CreditCard, LogIn, Settings, FileText, Shield, Users, X, Leaf } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"

// JWT Secret - must match the one in your SAO6 application
const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || "your_jwt_secret_key_change_in_production"

// Optimized animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.12,
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { 
      duration: 0.5, 
      ease: [0.25, 0.46, 0.45, 0.94]
    },
  },
}

const formVariants = {
  hidden: { x: 40, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 30,
      duration: 0.6
    },
  },
  exit: {
    x: -40,
    opacity: 0,
    transition: { duration: 0.3 },
  },
}

const modalVariants = {
  hidden: { 
    opacity: 0,
    backdropFilter: "blur(0px)"
  },
  visible: {
    opacity: 1,
    backdropFilter: "blur(12px)",
    transition: { 
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: {
    opacity: 0,
    backdropFilter: "blur(0px)",
    transition: { duration: 0.3 }
  }
}

const modalContentVariants = {
  hidden: { 
    scale: 0.85, 
    opacity: 0,
    y: 60
  },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  },
  exit: {
    scale: 0.9,
    opacity: 0,
    y: 30,
    transition: { duration: 0.25 }
  }
}

const optionCardVariants = {
  hidden: { y: 40, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { 
      duration: 0.5, 
      ease: [0.25, 0.46, 0.45, 0.94]
    },
  },
  hover: {
    y: -12,
    scale: 1.03,
    transition: { 
      duration: 0.3, 
      ease: [0.25, 0.46, 0.45, 0.94]
    },
  },
  tap: {
    scale: 0.97,
    transition: { duration: 0.15 },
  },
}

// Optimized Loading overlay component
const LoadingOverlay = React.memo(() => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-green-950/20 backdrop-blur-md flex items-center justify-center z-50"
    style={{ willChange: "opacity" }}
  >
    <motion.div
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      className="bg-white/95 backdrop-blur-xl rounded-2xl p-10 shadow-2xl border border-green-100/50"
      style={{ willChange: "transform" }}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-16 h-16">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="w-16 h-16 border-4 border-green-100 border-t-green-600 rounded-full"
            style={{ willChange: "transform" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Leaf className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <p className="text-green-800 font-semibold text-lg tracking-wide">Procesando...</p>
      </div>
    </motion.div>
  </motion.div>
))

LoadingOverlay.displayName = "LoadingOverlay"

// Optimized Error modal component
const ErrorModal = React.memo(({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-green-950/30 backdrop-blur-md flex items-center justify-center z-50 p-4"
        style={{ willChange: "opacity" }}
      >
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full border border-green-100/50"
          style={{ willChange: "transform" }}
        >
          <div className="text-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
              className="w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg"
            >
              <AlertCircle className="h-10 w-10 text-red-600" />
            </motion.div>
            <h3 className="text-2xl font-bold text-green-800 mb-3 tracking-tight">Demasiados intentos</h3>
            <p className="text-green-600 text-base mb-8 leading-relaxed">
              Has excedido el número de intentos permitidos. Intenta nuevamente más tarde.
            </p>
            <Button 
              onClick={onClose} 
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 w-full h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Entendido
            </Button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
))

ErrorModal.displayName = "ErrorModal"

// Admin Options Modal Component
const AdminOptionsModal = React.memo(({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const router = useRouter()

  const handleAdminDashboard = () => {
    router.push("/dashboard-admin-requests")
  }

  const handleRequestPermission = () => {
    router.push("/dashboard")
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-green-950/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          style={{ willChange: "opacity, backdrop-filter" }}
        >
          <motion.div
            variants={modalContentVariants}
            className="bg-white rounded-3xl shadow-[0_25px_50px_rgba(0,0,0,0.15)] max-w-3xl w-full max-h-[90vh] overflow-y-auto relative border border-green-100/50"
            style={{ willChange: "transform" }}
          >
            {/* Close button */}
            <motion.button
              onClick={onClose}
              className="absolute top-6 right-6 w-10 h-10 bg-white hover:bg-green-50 rounded-full flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg border border-green-100 z-10 group"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="h-5 w-5 text-green-600 group-hover:text-green-700 transition-colors" />
            </motion.button>

            <div className="p-12">
              {/* Header */}
              <motion.div variants={itemVariants} className="text-center mb-12">
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 20, 
                    delay: 0.1 
                  }}
                  className="w-24 h-24 bg-gradient-to-br from-green-500 via-green-600 to-green-700 rounded-full mx-auto mb-8 flex items-center justify-center shadow-lg relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full" />
                  <Shield className="h-12 w-12 text-white drop-shadow-sm" />
                </motion.div>
                
                <motion.h2 
                  className="text-4xl font-bold text-green-800 mb-4 tracking-tight"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  ¡Bienvenido Administrador!
                </motion.h2>
                
                <motion.p 
                  className="text-green-600 text-xl font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Selecciona una opción para continuar con la gestión
                </motion.p>
              </motion.div>

              {/* Options */}
              <motion.div variants={itemVariants} className="space-y-6">
                <motion.div
                  variants={optionCardVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="cursor-pointer group"
                  onClick={handleAdminDashboard}
                >
                  <Card className="bg-gradient-to-br from-green-50 via-white to-green-50/50 border-green-200/60 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <CardContent className="p-10">
                      <div className="flex items-center space-x-8">
                        <motion.div
                          className="w-20 h-20 bg-gradient-to-br from-green-600 via-green-700 to-green-800 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden"
                          whileHover={{ rotate: 3, scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                          <Settings className="h-10 w-10 text-white drop-shadow" />
                        </motion.div>
                        
                        <div className="flex-1 space-y-4">
                          <h3 className="font-bold text-green-800 text-2xl tracking-tight">
                            Panel de Administración
                          </h3>
                          <p className="text-green-600 text-lg leading-relaxed">
                            Gestiona usuarios, permisos y configuración completa del sistema
                          </p>
                          
                          <div className="flex items-center space-x-6 pt-2">
                            <div className="flex items-center space-x-3 text-green-600">
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <Users className="h-3 w-3 text-green-600" />
                              </div>
                              <span className="text-sm font-medium">Gestión de usuarios</span>
                            </div>
                            <div className="flex items-center space-x-3 text-green-600">
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              </div>
                              <span className="text-sm font-medium">Aprobación de solicitudes</span>
                            </div>
                          </div>
                        </div>
                        
                        <motion.div
                          className="text-green-600 group-hover:text-green-700 transition-colors"
                          whileHover={{ x: 8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="w-12 h-12 bg-green-100 group-hover:bg-green-200 rounded-full flex items-center justify-center transition-colors duration-200">
                            <ArrowRight className="h-6 w-6" />
                          </div>
                        </motion.div>
                      </div>
                    </CardContent>
                    
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-300/20 rounded-full translate-y-12 -translate-x-12 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Card>
                </motion.div>

                <motion.div
                  variants={optionCardVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="cursor-pointer group"
                  onClick={handleRequestPermission}
                >
                  <Card className="bg-gradient-to-br from-green-50/50 via-white to-green-50 border-green-200/60 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <CardContent className="p-10">
                      <div className="flex items-center space-x-8">
                        <motion.div
                          className="w-20 h-20 bg-gradient-to-br from-green-500 via-green-600 to-green-700 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden"
                          whileHover={{ rotate: -3, scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent" />
                          <FileText className="h-10 w-10 text-white drop-shadow" />
                        </motion.div>
                        
                        <div className="flex-1 space-y-4">
                          <h3 className="font-bold text-green-800 text-2xl tracking-tight">
                            Solicitar Permiso
                          </h3>
                          <p className="text-green-600 text-lg leading-relaxed">
                            Crea y gestiona solicitudes de permisos y vacaciones de manera eficiente
                          </p>
                          
                          <div className="flex items-center space-x-6 pt-2">
                            <div className="flex items-center space-x-3 text-green-600">
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <FileText className="h-3 w-3 text-green-600" />
                              </div>
                              <span className="text-sm font-medium">Solicitudes rápidas</span>
                            </div>
                            <div className="flex items-center space-x-3 text-green-600">
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              </div>
                              <span className="text-sm font-medium">Seguimiento en tiempo real</span>
                            </div>
                          </div>
                        </div>
                        
                        <motion.div
                          className="text-green-600 group-hover:text-green-700 transition-colors"
                          whileHover={{ x: 8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="w-12 h-12 bg-green-100 group-hover:bg-green-200 rounded-full flex items-center justify-center transition-colors duration-200">
                            <ArrowRight className="h-6 w-6" />
                          </div>
                        </motion.div>
                      </div>
                    </CardContent>
                    
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-300/20 rounded-full translate-y-12 -translate-x-12 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Card>
                </motion.div>
              </motion.div>

              {/* Footer */}
              <motion.div 
                variants={itemVariants} 
                className="mt-12 text-center relative"
              >
                <div className="h-px bg-gradient-to-r from-transparent via-green-200 to-transparent mb-6" />
                <p className="text-green-500 text-base font-medium tracking-wide">
                  Selecciona la opción que mejor se adapte a tus necesidades
                </p>
              </motion.div>
            </div>

            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute top-20 left-10 w-2 h-2 bg-green-400 rounded-full" />
              <div className="absolute top-32 right-20 w-1 h-1 bg-green-500 rounded-full" />
              <div className="absolute bottom-40 left-16 w-1.5 h-1.5 bg-green-400 rounded-full" />
              <div className="absolute bottom-20 right-12 w-2 h-2 bg-green-500 rounded-full" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

AdminOptionsModal.displayName = "AdminOptionsModal"

export default function LoginPage(): ReactElement {
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [tokenProcessing, setTokenProcessing] = useState(false)
  const [tokenMessage, setTokenMessage] = useState("")
  const [tokenVerified, setTokenVerified] = useState(false)
  const [formStep, setFormStep] = useState(0) // 0: code, 1: password
  const [shake, setShake] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [showAdminModal, setShowAdminModal] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()

  // Memoized validation function
  const validateCode = useCallback((code: string): boolean => {
    if (code === "sao6admin") return true
    if (code.length !== 4) return false
    const numCode = Number.parseInt(code, 10)
    if (numCode < 10 && code.startsWith("000")) return true
    if (numCode < 100 && code.startsWith("00")) return true
    if (numCode < 1000 && code.startsWith("0")) return true
    if (numCode >= 1000) return true
    return false
  }, [])

  // Check for saved credentials on component mount
  useEffect(() => {
    const savedCode = localStorage.getItem("rememberedCode")
    if (savedCode) {
      setCode(savedCode)
      setRememberMe(true)
    }
    const token = searchParams.get("token")
    if (token) {
      verifyToken(token)
    }
  }, [searchParams])

  const verifyToken = useCallback(async (token: string) => {
    setTokenProcessing(true)
    setTokenMessage("Verificando credenciales...")
    setError("")

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        code: string
        password: string
        origin?: string
        exp?: number
      }

      if (decoded && decoded.code && decoded.password) {
        if (decoded.origin !== "sao6_system") {
          console.warn("Token from unexpected origin:", decoded.origin)
        }

        setTokenVerified(true)
        setTokenMessage("Credenciales verificadas. Iniciando sesión...")
        setCode(decoded.code)
        setPassword(decoded.password)

        setTimeout(() => {
          handleAutoLogin(decoded.code, decoded.password)
        }, 1000)
      } else {
        setError("El enlace de acceso no contiene credenciales válidas.")
        setTokenProcessing(false)
        setTokenMessage("")
      }
    } catch (error) {
      console.error("Error al verificar el token:", error)
      setError("El enlace de acceso ha expirado o no es válido. Inicie sesión manualmente.")
      setTokenProcessing(false)
      setTokenMessage("")
    }
  }, [])

  const handleAutoLogin = useCallback(
    async (userCode: string, userPassword: string) => {
      setIsLoading(true)
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://solicitud-permisos.sao6.com.co/api";
        const response = await fetch(`${apiUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: userCode, password: userPassword }),
        })

        const data = await response.json()

        if (response.ok) {
          localStorage.setItem("accessToken", data.access_token)
          localStorage.setItem("userRole", data.role)
          localStorage.setItem("userCode", userCode)
          localStorage.setItem("loginOrigin", "sao6_redirect")
          
          // Obtener información del usuario para guardar el nombre
          try {
            const userResponse = await fetch(`${apiUrl}/auth/user`, {
              headers: {
                Authorization: `Bearer ${data.access_token}`,
                "Content-Type": "application/json",
              },
            })
            
            if (userResponse.ok) {
              const userData = await userResponse.json()
              localStorage.setItem("userName", userData.name || "Administrador")
              // Guardar todos los datos del usuario incluyendo userType
              localStorage.setItem("userData", JSON.stringify(userData))
            }
          } catch (error) {
            console.warn("No se pudo obtener el nombre del usuario:", error)
            localStorage.setItem("userName", "Administrador")
          }

          setShowSuccessAnimation(true)

          setTimeout(() => {
            if (data.role === "admin" || data.role === "testers") {
              setShowAdminModal(true)
              setShowSuccessAnimation(false)
            } else {
              router.push("/dashboard")
            }
          }, 1500)
        } else {
          setTokenProcessing(false)
          setLoginAttempts((prev) => {
            const newAttempts = prev + 1
            if (newAttempts >= 3) setShowErrorModal(true)
            return newAttempts
          })
          setError(data.msg || "Las credenciales proporcionadas no son válidas")
          setIsLoading(false)
          setShake(true)
          setTimeout(() => setShake(false), 500)
        }
      } catch (error) {
        setTokenProcessing(false)
        setError("Error al procesar el inicio de sesión automático. Intente manualmente.")
        console.error("Error de inicio de sesión automático:", error)
        setIsLoading(false)
        setShake(true)
        setTimeout(() => setShake(false), 500)
      }
    },
    [router],
  )

  const handleNextStep = useCallback(() => {
    if (code === "sao6admin") {
      setShowAdminModal(true)
      setError("")
      return
    }

    // Permitir código vacío para validación con cédula
    if (code.trim() === "") {
      setError("")
      setFormStep(1)
      return
    }

    if (!validateCode(code)) {
      setError("El código debe tener 4 dígitos. Use ceros a la izquierda si es necesario (ej: 0025).")
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }
    setError("")
    setFormStep(1)
  }, [code, validateCode])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (formStep === 0) {
        handleNextStep()
        return
      }

      setIsLoading(true)
      setError("")

      // Solo validar código si no está vacío
      if (code.trim() !== "" && !validateCode(code)) {
        setError("El código debe tener 4 dígitos. Use ceros a la izquierda si es necesario.")
        setIsLoading(false)
        setShake(true)
        setTimeout(() => setShake(false), 500)
        return
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://solicitud-permisos.sao6.com.co/api";
        const response = await fetch(`${apiUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, password }),
        })

        const data = await response.json()

        if (response.ok) {
          if (rememberMe) {
            localStorage.setItem("rememberedCode", code)
          } else {
            localStorage.removeItem("rememberedCode")
          }

          localStorage.setItem("accessToken", data.access_token)
          localStorage.setItem("userRole", data.role)
          localStorage.setItem("userCode", code)
          
          // Obtener información del usuario para guardar el nombre
          try {
            const userResponse = await fetch(`${apiUrl}/auth/user`, {
              headers: {
                Authorization: `Bearer ${data.access_token}`,
                "Content-Type": "application/json",
              },
            })
            
            if (userResponse.ok) {
              const userData = await userResponse.json()
              localStorage.setItem("userName", userData.name || "Administrador")
              // Guardar todos los datos del usuario incluyendo userType
              localStorage.setItem("userData", JSON.stringify(userData))
            }
          } catch (error) {
            console.warn("No se pudo obtener el nombre del usuario:", error)
            localStorage.setItem("userName", "Administrador")
          }

          setShowSuccessAnimation(true)

          setTimeout(() => {
            if (data.role === "admin" || data.role === "testers") {
              setShowAdminModal(true)
              setShowSuccessAnimation(false)
            } else {
              router.push("/dashboard")
            }
          }, 1500)
        } else {
          setLoginAttempts((prev) => {
            const newAttempts = prev + 1
            if (newAttempts >= 3) setShowErrorModal(true)
            return newAttempts
          })
          setError(data.msg || "Credenciales inválidas")
          setShake(true)
          setTimeout(() => setShake(false), 500)
        }
      } catch (error) {
        setError("Ocurrió un error. Por favor, intente nuevamente.")
        console.error("Error de inicio de sesión:", error)
        setShake(true)
        setTimeout(() => setShake(false), 500)
      } finally {
        setIsLoading(false)
      }
    },
    [formStep, code, password, rememberMe, validateCode, handleNextStep, router],
  )

  const handleBackToCode = useCallback(() => {
    setFormStep(0)
    setError("")
  }, [])

  const handleCloseAdminModal = useCallback(() => {
    setShowAdminModal(false)
    setCode("")
    setPassword("")
    setFormStep(0)
    setError("")
  }, [])

  // Memoized format function
  const formatCodeDisplay = useMemo(
    () => (code: string) => {
      return code.split("").join(" ")
    },
    [],
  )

  // Memoized background elements
  const backgroundElements = useMemo(
    () => (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 30, 0],
            y: [0, -40, 0],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 20,
            ease: "easeInOut",
          }}
          className="absolute -top-20 -left-20 w-80 h-80 bg-gradient-to-br from-green-200/40 to-green-300/30 rounded-full mix-blend-multiply filter blur-3xl"
          style={{ willChange: "transform" }}
        />
        <motion.div
          animate={{
            scale: [1, 0.9, 1],
            x: [0, -40, 0],
            y: [0, 30, 0],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 25,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute -top-10 -right-20 w-96 h-96 bg-gradient-to-bl from-green-300/30 to-green-400/20 rounded-full mix-blend-multiply filter blur-3xl"
          style={{ willChange: "transform" }}
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 20, 0],
            y: [0, 20, 0],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 30,
            ease: "easeInOut",
            delay: 4,
          }}
          className="absolute -bottom-20 left-1/4 w-72 h-72 bg-gradient-to-tr from-green-200/30 to-green-300/20 rounded-full mix-blend-multiply filter blur-3xl"
          style={{ willChange: "transform" }}
        />
      </div>
    ),
    [],
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center p-4 relative overflow-hidden">
      {backgroundElements}

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          duration: 0.8
        }}
        className={`w-full max-w-6xl bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_25px_50px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col lg:flex-row relative z-10 border border-green-100/50 ${shake ? "animate-shake" : ""}`}
        style={{ willChange: "transform" }}
      >
        {/* Left side - Login Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-16">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
            <motion.div variants={itemVariants} className="flex justify-center mb-8">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="relative w-32 h-32 flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg"
              >
                <Image src="/sao6.png" alt="Logo SAO6" width={120} height={120} className="object-contain" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" />
              </motion.div>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold text-green-800 tracking-tight">
                SAO6
              </h1>
              <p className="text-green-600 text-lg font-medium">
                Sistema de Gestión Integrado
              </p>
              <div className="w-16 h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-full mx-auto" />
            </motion.div>

            {tokenProcessing ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-2xl p-6 flex items-center justify-center space-x-4 text-green-700"
              >
                {tokenVerified ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <div className="animate-spin h-6 w-6 border-2 border-green-600 border-t-transparent rounded-full" />
                )}
                <span className="text-lg font-medium">{tokenMessage}</span>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                {formStep === 0 && (
                  <motion.form
                    key="codeStep"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-6"
                    onSubmit={handleSubmit}
                  >
                    <div className="space-y-3">
                      <Label
                        htmlFor="code"
                        className="text-green-800 flex items-center gap-3 text-lg font-semibold"
                      >
                        Código de acceso
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                <Info className="h-5 w-5 text-green-600 opacity-70 hover:opacity-100 transition-opacity" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={10} className="max-w-xs">
                              <p className="text-sm leading-relaxed">
                                Ingrese su código de operador de 4 dígitos. Use ceros a la izquierda si es necesario. 
                                <strong className="block mt-1">Déjelo en blanco si es personal de mantenimiento y usará su cédula.</strong>
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
                          <User className="text-green-600 h-4 w-4" />
                        </div>
                        <Input
                          id="code"
                          type="text"
                          value={code}
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === "sao6admin") {
                              setCode(value)
                            } else {
                              setCode(value.replace(/\D/g, "").slice(0, 4))
                            }
                          }}
                          className="pl-16 border-green-200 focus:border-green-500 focus:ring-green-500 text-xl tracking-widest h-16 bg-white/80 shadow-sm rounded-xl font-mono"
                          placeholder="0000 (o déjalo en blanco)"
                          autoFocus
                        />
                        {code && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute right-4 top-1/2 -translate-y-1/2"
                          >
                            <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
                              <CheckCircle className="text-green-600 h-4 w-4" />
                            </div>
                          </motion.div>
                        )}
                      </div>
                      {code.length > 0 && code.length < 4 && code !== "sao6admin" && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-amber-600 text-sm flex items-center gap-2 bg-amber-50 p-3 rounded-lg border border-amber-200"
                        >
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          El código debe tener 4 dígitos
                        </motion.p>
                      )}
                    </div>

                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-green-600 via-green-700 to-green-800 hover:from-green-700 hover:via-green-800 hover:to-green-900 text-white font-semibold py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl h-16 text-lg"
                        disabled={isLoading || (code.trim() !== "" && !validateCode(code))}
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center gap-3">
                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                            Procesando...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-3">
                            Continuar
                            <ArrowRight className="h-5 w-5" />
                          </div>
                        )}
                      </Button>
                    </motion.div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3"
                      >
                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <p className="font-medium">{error}</p>
                      </motion.div>
                    )}
                  </motion.form>
                )}

                {formStep === 1 && (
                  <motion.form
                    key="passwordStep"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-6"
                    onSubmit={handleSubmit}
                  >
                    <motion.div
                      variants={itemVariants}
                      className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl flex items-center justify-between border border-green-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-200 flex items-center justify-center">
                          <User className="text-green-700 h-5 w-5" />
                        </div>
                        <div>
                          <span className="font-semibold text-green-800 text-lg">Código: </span>
                          <span className="font-mono text-green-900 text-lg tracking-wider">
                            {formatCodeDisplay(code)}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleBackToCode}
                        className="text-green-700 hover:text-green-800 hover:bg-green-200 font-medium"
                      >
                        Cambiar
                      </Button>
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-3">
                      <Label
                        htmlFor="password"
                        className="text-green-800 flex items-center gap-3 text-lg font-semibold"
                      >
                        Contraseña
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                <Info className="h-5 w-5 text-green-600 opacity-70 hover:opacity-100 transition-opacity" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={10}>
                              <p className="text-sm">Su contraseña es su número de cédula.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
                          <CreditCard className="text-green-600 h-4 w-4" />
                        </div>
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-16 pr-16 border-green-200 focus:border-green-500 focus:ring-green-500 text-xl h-16 bg-white/80 shadow-sm rounded-xl"
                          placeholder="••••••••"
                          required
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center text-green-600 hover:bg-green-200 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-green-600 via-green-700 to-green-800 hover:from-green-700 hover:via-green-800 hover:to-green-900 text-white font-semibold py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-3 h-16 text-lg"
                        disabled={isLoading || !password}
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                            Iniciando sesión...
                          </>
                        ) : (
                          <>
                            <LogIn className="h-5 w-5" />
                            Iniciar Sesión
                          </>
                        )}
                      </Button>
                    </motion.div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3"
                      >
                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <p className="font-medium">{error}</p>
                      </motion.div>
                    )}
                  </motion.form>
                )}
              </AnimatePresence>
            )}
          </motion.div>
        </div>

        {/* Right side - Welcome Message */}
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white p-8 lg:p-16 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0">
            <motion.div
              initial={{ opacity: 0.1 }}
              animate={{
                opacity: [0.1, 0.2, 0.1],
                y: [0, -20, 0],
                rotate: [0, 5, 0],
              }}
              transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="absolute -top-32 -right-32 w-80 h-80 bg-white opacity-10 rounded-full"
              style={{ willChange: "transform" }}
            />
            <motion.div
              initial={{ opacity: 0.1 }}
              animate={{
                opacity: [0.1, 0.25, 0.1],
                y: [0, 25, 0],
                x: [0, -15, 0],
              }}
              transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 2 }}
              className="absolute -bottom-40 -left-32 w-96 h-96 bg-white opacity-10 rounded-full"
              style={{ willChange: "transform" }}
            />
            <motion.div
              initial={{ opacity: 0.05 }}
              animate={{
                opacity: [0.05, 0.15, 0.05],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 4 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white opacity-5 rounded-full"
              style={{ willChange: "transform" }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-center relative z-10 max-w-lg space-y-8"
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="space-y-6"
            >
              <h2 className="text-5xl font-bold mb-4 tracking-tight">
                ¡Bienvenido!
              </h2>
              <div className="w-20 h-1 bg-white/40 rounded-full mx-auto" />
            </motion.div>

            <motion.div 
              initial={{ y: 30, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <Card className="bg-white/15 backdrop-blur-md border-white/20 text-white overflow-hidden">
                <CardContent className="p-8">
                  <p className="text-white/90 font-medium text-lg leading-relaxed">
                    Sistema de gestión integrado para el control y seguimiento de actividades operacionales.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.6, staggerChildren: 0.15 }}
              className="space-y-4"
            >
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-4 text-base bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10"
              >
                <CheckCircle className="h-6 w-6 text-green-200 flex-shrink-0" />
                <span className="font-medium">Gestión eficiente de solicitudes y permisos</span>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-4 text-base bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10"
              >
                <CheckCircle className="h-6 w-6 text-green-200 flex-shrink-0" />
                <span className="font-medium">Seguimiento en tiempo real de procesos</span>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-4 text-base bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10"
              >
                <CheckCircle className="h-6 w-6 text-green-200 flex-shrink-0" />
                <span className="font-medium">Interfaz intuitiva y experiencia mejorada</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Admin Options Modal */}
      <AdminOptionsModal isOpen={showAdminModal} onClose={handleCloseAdminModal} />

      {isLoading && <LoadingOverlay />}
      <ErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} />

      {/* Success Animation */}
      <AnimatePresence>
        {showSuccessAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-green-950/30 backdrop-blur-md flex items-center justify-center z-50"
            style={{ willChange: "opacity" }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white rounded-3xl p-12 shadow-2xl border border-green-100/50"
              style={{ willChange: "transform" }}
            >
              <motion.div className="w-24 h-24 relative mx-auto">
                <svg
                  className="w-24 h-24 text-green-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.path
                    d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />
                  <motion.polyline
                    points="22 4 12 14.01 9 11.01"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeInOut", delay: 0.8 }}
                  />
                </svg>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Optimized CSS for animations */}
      <style jsx global>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          50% { transform: translateX(8px); }
          75% { transform: translateX(-4px); }
          100% { transform: translateX(0); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        
        /* Optimize for mobile performance */
        @media (max-width: 768px) {
          * {
            -webkit-tap-highlight-color: transparent;
          }
        }
        
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #10b981;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #059669;
        }
      `}</style>
    </div>
  )
}