"use client"

import React from "react"

import type { ReactElement } from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import jwt from "jsonwebtoken"
import { Eye, EyeOff, User, CheckCircle, ArrowRight, AlertCircle, Info, CreditCard, LogIn, Settings, FileText, Shield, Users, X } from "lucide-react"
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
      staggerChildren: 0.08,
      duration: 0.4,
    },
  },
}

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
}

const formVariants = {
  hidden: { x: 30, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 400, damping: 25 },
  },
  exit: {
    x: -30,
    opacity: 0,
    transition: { duration: 0.2 },
  },
}

const modalVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 }
  }
}

const modalContentVariants = {
  hidden: { 
    scale: 0.8, 
    opacity: 0,
    y: 50
  },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
      staggerChildren: 0.1
    }
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    y: 50,
    transition: { duration: 0.2 }
  }
}

const optionCardVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
}

// Optimized Loading overlay component
const LoadingOverlay = React.memo(() => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
    style={{ willChange: "opacity" }}
  >
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      className="bg-white/90 backdrop-blur-md rounded-xl p-8 shadow-xl"
      style={{ willChange: "transform" }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-10 h-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="w-10 h-10 border-3 border-green-200 border-t-green-600 rounded-full"
            style={{ willChange: "transform" }}
          />
        </div>
        <p className="text-gray-700 font-medium text-sm">Procesando...</p>
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
        className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        style={{ willChange: "opacity" }}
      >
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 20 }}
          className="bg-white rounded-xl p-6 shadow-2xl max-w-sm w-full"
          style={{ willChange: "transform" }}
        >
          <div className="text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <AlertCircle className="h-7 w-7 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Demasiados intentos</h3>
            <p className="text-gray-600 text-sm mb-6">
              Has excedido el número de intentos permitidos. Intenta nuevamente más tarde.
            </p>
            <Button onClick={onClose} className="bg-emerald-500 hover:bg-emerald-600 w-full">
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
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          style={{ willChange: "opacity" }}
        >
          <motion.div
            variants={modalContentVariants}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
            style={{ willChange: "transform" }}
          >
            {/* Close button */}
            <motion.button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors z-10"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="h-4 w-4 text-gray-600" />
            </motion.button>

            <div className="p-8">
              {/* Header */}
              <motion.div variants={itemVariants} className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
                  className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full mx-auto mb-6 flex items-center justify-center"
                >
                  <Shield className="h-10 w-10 text-green-600" />
                </motion.div>
                <h2 className="text-3xl font-bold text-green-700 mb-3">
                  ¡Bienvenido Administrador!
                </h2>
                <p className="text-green-600 text-lg">
                  Selecciona una opción para continuar
                </p>
              </motion.div>

              {/* Options */}
              <motion.div variants={itemVariants} className="grid gap-6">
                <motion.div
                  variants={optionCardVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="cursor-pointer"
                  onClick={handleAdminDashboard}
                >
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative">
                    <CardContent className="p-8">
                      <div className="flex items-center space-x-6">
                        <motion.div
                          className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center"
                          whileHover={{ rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Settings className="h-8 w-8 text-white" />
                        </motion.div>
                        <div className="flex-1">
                          <h3 className="font-bold text-green-800 text-xl mb-2">
                            Panel de Administración
                          </h3>
                          <p className="text-green-600 text-base mb-4">
                            Gestiona usuarios, permisos y configuración del sistema
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-green-600">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4" />
                              <span>Gestión de usuarios</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4" />
                              <span>Aprobación de solicitudes</span>
                            </div>
                          </div>
                        </div>
                        <motion.div
                          className="text-green-600"
                          whileHover={{ x: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ArrowRight className="h-6 w-6" />
                        </motion.div>
                      </div>
                    </CardContent>
                    
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-200 rounded-full opacity-20 -translate-y-12 translate-x-12" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-green-300 rounded-full opacity-20 translate-y-10 -translate-x-10" />
                  </Card>
                </motion.div>

                <motion.div
                  variants={optionCardVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="cursor-pointer"
                  onClick={handleRequestPermission}
                >
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative">
                    <CardContent className="p-8">
                      <div className="flex items-center space-x-6">
                        <motion.div
                          className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center"
                          whileHover={{ rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <FileText className="h-8 w-8 text-white" />
                        </motion.div>
                        <div className="flex-1">
                          <h3 className="font-bold text-blue-800 text-xl mb-2">
                            Solicitar Permiso
                          </h3>
                          <p className="text-blue-600 text-base mb-4">
                            Crea y gestiona solicitudes de permisos y vacaciones
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-blue-600">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4" />
                              <span>Solicitudes rápidas</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4" />
                              <span>Seguimiento en tiempo real</span>
                            </div>
                          </div>
                        </div>
                        <motion.div
                          className="text-blue-600"
                          whileHover={{ x: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ArrowRight className="h-6 w-6" />
                        </motion.div>
                      </div>
                    </CardContent>
                    
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200 rounded-full opacity-20 -translate-y-12 translate-x-12" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-blue-300 rounded-full opacity-20 translate-y-10 -translate-x-10" />
                  </Card>
                </motion.div>
              </motion.div>

              {/* Footer */}
              <motion.div variants={itemVariants} className="mt-8 text-center">
                <p className="text-gray-500 text-sm">
                  Selecciona la opción que mejor se adapte a tus necesidades
                </p>
              </motion.div>
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

      if (!validateCode(code)) {
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
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            x: [0, 20, 0],
            y: [0, -30, 0],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 12,
            ease: "easeInOut",
          }}
          className="absolute top-10 left-10 w-48 h-48 md:w-64 md:h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-60"
          style={{ willChange: "transform" }}
        />
        <motion.div
          animate={{
            scale: [1, 0.95, 1],
            x: [0, -20, 0],
            y: [0, 20, 0],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 15,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute top-0 right-10 w-56 h-56 md:w-72 md:h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-60"
          style={{ willChange: "transform" }}
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 15, 0],
            y: [0, 15, 0],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 18,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute -bottom-8 left-20 w-56 h-56 md:w-72 md:h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-60"
          style={{ willChange: "transform" }}
        />
      </div>
    ),
    [],
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-3 md:p-4 relative overflow-hidden">
      {backgroundElements}

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`w-full max-w-5xl bg-white/85 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row relative z-10 ${shake ? "animate-shake" : ""}`}
        style={{ willChange: "transform" }}
      >
        {/* Left side - Login Form */}
        <div className="w-full lg:w-1/2 p-6 md:p-8 lg:p-12">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={itemVariants} className="flex justify-center mb-4 md:mb-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center"
              >
                <Image src="/sao6.png" alt="Logo SAO6" width={120} height={120} className="object-contain" />
              </motion.div>
            </motion.div>

            <motion.h2 variants={itemVariants} className="text-2xl md:text-3xl font-bold text-green-700 text-center">
              Sistema SAO6
            </motion.h2>

            <motion.p variants={itemVariants} className="text-green-600 text-center text-sm md:text-base">
              Inicia sesión en tu cuenta
            </motion.p>

            {tokenProcessing ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-center space-x-2 text-green-700"
              >
                {tokenVerified ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <div className="animate-spin h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full" />
                )}
                <span className="text-sm md:text-base">{tokenMessage}</span>
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
                    className="space-y-5"
                    onSubmit={handleSubmit}
                  >
                    <div className="relative">
                      <Label
                        htmlFor="code"
                        className="text-green-700 flex items-center gap-2 text-sm md:text-base font-medium"
                      >
                        Código de acceso
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                <Info className="h-4 w-4 text-green-600 opacity-70" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={10}>
                              <p className="w-[200px] text-xs">
                                Ingrese su código de operador de 4 dígitos. Use ceros a la izquierda si es necesario.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <div className="relative mt-2">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 rounded-full bg-green-100 flex items-center justify-center">
                          <User className="text-green-600 h-3 w-3 md:h-3.5 md:w-3.5" />
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
                          className="pl-10 md:pl-12 border-green-200 focus:border-green-600 focus:ring-green-600 text-base md:text-lg tracking-wide h-11 md:h-12 bg-white/70 shadow-sm"
                          placeholder="0000"
                          required
                          autoFocus
                        />
                        {code && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-green-100 flex items-center justify-center">
                              <CheckCircle className="text-green-600 h-3 w-3 md:h-3.5 md:w-3.5" />
                            </div>
                          </motion.div>
                        )}
                      </div>
                      {code.length > 0 && code.length < 4 && code !== "sao6admin" && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-amber-500 text-xs mt-1.5 flex items-center"
                        >
                          <AlertCircle className="h-3 w-3 mr-1" />
                          El código debe tener 4 dígitos
                        </motion.p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="rememberMe"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                        className="text-green-600 border-green-300 focus:ring-green-600"
                      />
                      <label
                        htmlFor="rememberMe"
                        className="text-xs md:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-green-700"
                      >
                        Recordar mi código
                      </label>
                    </div>

                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-2.5 rounded-lg transition-all duration-300 transform hover:scale-[1.01] shadow-md hover:shadow-lg h-11 md:h-12 text-sm md:text-base"
                        disabled={isLoading || !validateCode(code)}
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            Procesando...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            Continuar
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        )}
                      </Button>
                    </motion.div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs md:text-sm flex items-start gap-2"
                      >
                        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <p>{error}</p>
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
                    className="space-y-5"
                    onSubmit={handleSubmit}
                  >
                    <motion.div
                      variants={itemVariants}
                      className="bg-green-50 p-3 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-green-100 flex items-center justify-center">
                          <User className="text-green-600 h-3.5 w-3.5 md:h-4 md:w-4" />
                        </div>
                        <div>
                          <span className="font-medium text-green-700 text-sm md:text-base">Código: </span>
                          <span className="font-mono text-green-800 text-sm md:text-base">
                            {formatCodeDisplay(code)}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleBackToCode}
                        className="text-green-600 hover:text-green-800 hover:bg-green-100 text-xs"
                      >
                        Cambiar
                      </Button>
                    </motion.div>

                    <motion.div variants={itemVariants} className="relative">
                      <Label
                        htmlFor="password"
                        className="text-green-700 flex items-center gap-2 text-sm md:text-base font-medium"
                      >
                        Contraseña
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                <Info className="h-4 w-4 text-green-600 opacity-70" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={10}>
                              <p className="w-[200px] text-xs">Su contraseña es su número de cédula.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <div className="relative mt-2">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 rounded-full bg-green-100 flex items-center justify-center">
                          <CreditCard className="text-green-600 h-3 w-3 md:h-3.5 md:w-3.5" />
                        </div>
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 md:pl-12 pr-10 md:pr-12 border-green-200 focus:border-green-600 focus:ring-green-600 text-base md:text-lg h-11 md:h-12 bg-white/70 shadow-sm"
                          placeholder="••••••••"
                          required
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 hover:bg-green-200 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-3 w-3 md:h-3.5 md:w-3.5" />
                          ) : (
                            <Eye className="h-3 w-3 md:h-3.5 md:w-3.5" />
                          )}
                        </button>
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="flex items-center space-x-2">
                      <Checkbox
                        id="rememberMe"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                        className="text-green-600 border-green-300 focus:ring-green-600"
                      />
                      <label
                        htmlFor="rememberMe"
                        className="text-xs md:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-green-700"
                      >
                        Recordar mi código
                      </label>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-2.5 rounded-lg transition-all duration-300 transform hover:scale-[1.01] shadow-md hover:shadow-lg flex items-center justify-center gap-2 h-11 md:h-12 text-sm md:text-base"
                        disabled={isLoading || !password}
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            Iniciando sesión...
                          </>
                        ) : (
                          <>
                            <LogIn className="h-4 w-4" />
                            Iniciar Sesión
                          </>
                        )}
                      </Button>
                    </motion.div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs md:text-sm flex items-start gap-2"
                      >
                        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <p>{error}</p>
                      </motion.div>
                    )}
                  </motion.form>
                )}
              </AnimatePresence>
            )}
          </motion.div>
        </div>

        {/* Right side - Welcome Message */}
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-green-600 to-green-700 text-white p-6 md:p-8 lg:p-12 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0">
            <motion.div
              initial={{ opacity: 0.1 }}
              animate={{
                opacity: [0.1, 0.15, 0.1],
                y: [0, -10, 0],
                rotate: [0, 3, 0],
              }}
              transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="absolute -top-20 -right-20 w-48 h-48 md:w-64 md:h-64 bg-white opacity-10 rounded-full"
              style={{ willChange: "transform" }}
            />
            <motion.div
              initial={{ opacity: 0.1 }}
              animate={{
                opacity: [0.1, 0.2, 0.1],
                y: [0, 15, 0],
                x: [0, -8, 0],
              }}
              transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-32 -left-20 w-60 h-60 md:w-80 md:h-80 bg-white opacity-10 rounded-full"
              style={{ willChange: "transform" }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center relative z-10 max-w-md"
          >
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-3xl md:text-4xl font-bold mb-6"
            >
              ¡Bienvenido!
            </motion.h2>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white mb-6 md:mb-8 overflow-hidden">
                <CardContent className="p-4 md:p-6">
                  <p className="text-white font-medium text-sm md:text-base">
                    Sistema de gestión integrado para el control y seguimiento de actividades.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, staggerChildren: 0.1 }}
              className="flex flex-col gap-3 md:gap-4"
            >
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-3 text-xs md:text-sm bg-white/10 rounded-lg p-3 backdrop-blur-sm"
              >
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-200 flex-shrink-0" />
                <span>Gestión eficiente de solicitudes y permisos</span>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-3 text-xs md:text-sm bg-white/10 rounded-lg p-3 backdrop-blur-sm"
              >
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-200 flex-shrink-0" />
                <span>Seguimiento en tiempo real de procesos</span>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-3 text-xs md:text-sm bg-white/10 rounded-lg p-3 backdrop-blur-sm"
              >
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-200 flex-shrink-0" />
                <span>Interfaz intuitiva y experiencia mejorada</span>
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
            className="fixed inset-0 bg-green-900/20 backdrop-blur-sm flex items-center justify-center z-50"
            style={{ willChange: "opacity" }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="bg-white rounded-full p-6 md:p-8 shadow-2xl"
              style={{ willChange: "transform" }}
            >
              <motion.div className="w-16 h-16 md:w-24 md:h-24 relative">
                <svg
                  className="w-16 h-16 md:w-24 md:h-24 text-green-600"
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
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  />
                  <motion.polyline
                    points="22 4 12 14.01 9 11.01"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.4, ease: "easeInOut", delay: 0.6 }}
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
          25% { transform: translateX(-6px); }
          50% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
          100% { transform: translateX(0); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        
        /* Optimize for mobile performance */
        @media (max-width: 768px) {
          * {
            -webkit-tap-highlight-color: transparent;
          }
        }
      `}</style>
    </div>
  )
}