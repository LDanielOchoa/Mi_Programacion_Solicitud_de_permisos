"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import jwt from "jsonwebtoken"
import {
  Eye,
  EyeOff,
  User,
  Lock,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Mail,
  ArrowLeft,
  KeyRound,
  LogIn,
  Info,
  CreditCard,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"

// JWT Secret - must match the one in your SAO6 application
const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || "your_jwt_secret_key_change_in_production"

// Variants for animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
      duration: 0.5,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3 },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4 },
  },
}

const formVariants = {
  hidden: { x: 50, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
  exit: {
    x: -50,
    opacity: 0,
    transition: { duration: 0.2 },
  },
}

// Loading overlay component with improved animation
const LoadingOverlay = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
  >
    <motion.div
      initial={{ scale: 0.8 }}
      animate={{
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 10,
        },
      }}
      className="bg-white/20 backdrop-blur-md rounded-xl p-12 shadow-2xl"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <motion.div
            animate={{
              rotate: 360,
              transition: { duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
            }}
            className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full"
          />
        </div>
        <p className="text-white font-medium">Procesando...</p>
      </div>
    </motion.div>
  </motion.div>
)

// Error modal component
const ErrorModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="bg-white rounded-lg p-6 shadow-2xl max-w-md w-full mx-4"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Demasiados intentos fallidos</h3>
            <p className="text-gray-600 mb-6">
              Has excedido el número de intentos permitidos. Por favor, intenta nuevamente más tarde o contacta a
              soporte.
            </p>
            <Button onClick={onClose} className="bg-emerald-500 hover:bg-emerald-600">
              Entendido
            </Button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
)

export default function LoginPage() {
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
  const [formStep, setFormStep] = useState(0)
  const [shake, setShake] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [recoveryEmail, setRecoveryEmail] = useState("")
  const [recoveryCode, setRecoveryCode] = useState("")
  const [recoverySuccess, setRecoverySuccess] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()

  // Password strength calculation
  useEffect(() => {
    let strength = 0

    if (newPassword.length > 0) strength += 1
    if (newPassword.length >= 8) strength += 1
    if (/[A-Z]/.test(newPassword)) strength += 1
    if (/[0-9]/.test(newPassword)) strength += 1
    if (/[^A-Za-z0-9]/.test(newPassword)) strength += 1

    setPasswordStrength(Math.min(strength, 5))
  }, [newPassword])

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

  const verifyToken = async (token: string) => {
    setTokenProcessing(true)
    setTokenMessage("Verificando credenciales...")
    setError("")

    try {
      // Verify the token
      const decoded = jwt.verify(token, JWT_SECRET) as {
        code: string
        password: string
        origin?: string
        exp?: number
      }

      // Check if token has required data
      if (decoded && decoded.code && decoded.password) {
        // Check if token is from the expected origin
        if (decoded.origin !== "sao6_system") {
          console.warn("Token from unexpected origin:", decoded.origin)
          // Continue anyway, but log the warning
        }

        setTokenVerified(true)
        setTokenMessage("Credenciales verificadas. Iniciando sesión automáticamente...")

        // Set the credentials from the token
        setCode(decoded.code)
        setPassword(decoded.password)

        // Submit the form automatically after a short delay
        setTimeout(() => {
          handleAutoLogin(decoded.code, decoded.password)
        }, 1500)
      } else {
        setError("El enlace de acceso no contiene credenciales válidas.")
        setTokenProcessing(false)
        setTokenMessage("")
      }
    } catch (error) {
      console.error("Error al verificar el token:", error)
      setError("El enlace de acceso ha expirado o no es válido. Por favor, inicie sesión manualmente.")
      setTokenProcessing(false)
      setTokenMessage("")
    }
  }

  const validateCode = (code: string): boolean => {
    if (code.length !== 4) return false
    const numCode = Number.parseInt(code, 10)
    if (numCode < 10 && code.startsWith("000")) return true
    if (numCode < 100 && code.startsWith("00")) return true
    if (numCode < 1000 && code.startsWith("0")) return true
    if (numCode >= 1000) return true
    return false
  }

  const handleAutoLogin = async (userCode: string, userPassword: string) => {
    setIsLoading(true)

    try {
      const response = await fetch("https://solicitud-permisos.sao6.com.co/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: userCode, password: userPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store authentication data
        localStorage.setItem("accessToken", data.access_token)
        localStorage.setItem("userRole", data.role)
        localStorage.setItem("userCode", userCode)

        // Also store the origin of the login
        localStorage.setItem("loginOrigin", "sao6_redirect")

        // Show success animation
        setShowSuccessAnimation(true)

        // Redirect after animation completes
        setTimeout(() => {
          if (data.role === "admin" || data.role === "testers") {
            router.push("/dashboard-admin-requests")
          } else {
            router.push("/dashboard")
          }
        }, 2000)
      } else {
        setTokenProcessing(false)
        setLoginAttempts((prevAttempts) => {
          const newAttempts = prevAttempts + 1
          if (newAttempts >= 3) {
            setShowErrorModal(true)
          }
          return newAttempts
        })
        setError(data.msg || "Las credenciales proporcionadas no son válidas")
        setIsLoading(false)
        setShake(true)
        setTimeout(() => setShake(false), 500)
      }
    } catch (error) {
      setTokenProcessing(false)
      setError("Ocurrió un error al procesar el inicio de sesión automático. Por favor, intente manualmente.")
      console.error("Error de inicio de sesión automático:", error)
      setIsLoading(false)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  const handleNextStep = () => {
    if (!validateCode(code)) {
      setError("El código debe tener 4 dígitos. Use ceros a la izquierda si es necesario (ej: 0025, 0125, 1111).")
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }
    setError("")
    setFormStep(1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formStep === 0 && code !== "sao6admin") {
      handleNextStep()
      return
    }

    setIsLoading(true)
    setError("")

    if (!validateCode(code)) {
      setError("El código debe tener 4 dígitos. Use ceros a la izquierda si es necesario (ej: 0025, 0125, 1111).")
      setIsLoading(false)
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    try {
      const response = await fetch("https://solicitud-permisos.sao6.com.co/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // If remember me is checked, save the code
        if (rememberMe) {
          localStorage.setItem("rememberedCode", code)
        } else {
          localStorage.removeItem("rememberedCode")
        }

        // Store authentication data
        localStorage.setItem("accessToken", data.access_token)
        localStorage.setItem("userRole", data.role)
        localStorage.setItem("userCode", code)

        // Show success animation
        setShowSuccessAnimation(true)

        // Redirect after animation completes
        setTimeout(() => {
          if (data.role === "admin" || data.role === "testers") {
            router.push("/dashboard-admin-requests")
          } else {
            router.push("/dashboard")
          }
        }, 2000)
      } else {
        setLoginAttempts((prevAttempts) => {
          const newAttempts = prevAttempts + 1
          if (newAttempts >= 3) {
            setShowErrorModal(true)
          }
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
  }

  const handleBackToCode = () => {
    setFormStep(0)
    setError("")
  }

  const handleForgotPassword = () => {
    setFormStep(2)
    setError("")
  }

  const handleBackToLogin = () => {
    setFormStep(1)
    setError("")
    setRecoverySuccess(false)
  }

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Simulate API call for password recovery
    try {
      // This is a mock implementation - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate success
      setRecoverySuccess(true)
      setIsLoading(false)
    } catch (error) {
      setError("Ocurrió un error al procesar la solicitud. Por favor, intente nuevamente.")
      setIsLoading(false)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call for code verification
    try {
      // This is a mock implementation - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate success and move to reset password step
      setFormStep(4)
      setIsLoading(false)
    } catch (error) {
      setError("El código ingresado no es válido. Por favor, verifique e intente nuevamente.")
      setIsLoading(false)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate password match
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden. Por favor, inténtelo de nuevo.")
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    setIsLoading(true)

    // Simulate API call for password reset
    try {
      // This is a mock implementation - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate success and return to login
      setFormStep(1)
      setIsLoading(false)
      setError("")

      // Show toast notification
      const successToast = document.createElement("div")
      successToast.className =
        "fixed top-4 right-4 z-50 transform transition-all duration-500 translate-x-0 opacity-100"
      successToast.innerHTML = `
        <div class="bg-white border-l-4 border-green-500 rounded-md shadow-lg p-4 flex items-start max-w-md">
          <div class="flex-shrink-0 mr-3">
            <svg class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p class="font-medium text-gray-900">¡Éxito!</p>
            <p class="text-sm text-gray-600 mt-1">Su contraseña ha sido actualizada correctamente.</p>
          </div>
        </div>
      `
      document.body.appendChild(successToast)

      // Animate out and remove after delay
      setTimeout(() => {
        successToast.style.opacity = "0"
        successToast.style.transform = "translateX(100%)"
        setTimeout(() => {
          document.body.removeChild(successToast)
        }, 500)
      }, 3000)
    } catch (error) {
      setError("Ocurrió un error al actualizar la contraseña. Por favor, intente nuevamente.")
      setIsLoading(false)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  // Function to format code with spaces for better readability
  const formatCodeDisplay = (code: string) => {
    return code.split("").join(" ")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 30, 0],
            y: [0, -50, 0],
            opacity: [0.7, 0.8, 0.7],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 15,
            ease: "easeInOut",
          }}
          className="absolute top-10 left-10 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70"
        />
        <motion.div
          animate={{
            scale: [1, 0.9, 1],
            x: [0, -30, 0],
            y: [0, 30, 0],
            opacity: [0.7, 0.6, 0.7],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 18,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute top-0 right-10 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 20, 0],
            y: [0, 20, 0],
            opacity: [0.7, 0.9, 0.7],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 20,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute -bottom-8 left-20 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`w-full max-w-4xl bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10 ${shake ? "animate-shake" : ""}`}
      >
        {/* Left side - Login Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={itemVariants} className="flex justify-center mb-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="relative w-32 h-32 flex items-center justify-center"
              >
                <Image src="/sao6.png" alt="Logo SAO6" width={120} height={120} className="object-contain" />
              </motion.div>
            </motion.div>

            <motion.h2 variants={itemVariants} className="text-3xl font-bold text-green-700 text-center">
              Sistema SAO6
            </motion.h2>

            <motion.p variants={itemVariants} className="text-green-600 text-center">
              {formStep === 2 || formStep === 3 || formStep === 4
                ? "Recuperación de contraseña"
                : "Inicia sesión en tu cuenta"}
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
                <span>{tokenMessage}</span>
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
                    <div className="relative">
                      <Label htmlFor="code" className="text-green-700 flex items-center gap-2 text-base">
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
                        <div className="absolute left-3 top-3 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                          <User className="text-green-600 h-3.5 w-3.5" />
                        </div>
                        <Input
                          id="code"
                          type="text"
                          value={code}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "").slice(0, 4)
                            setCode(value)
                          }}
                          className="pl-10 border-green-200 focus:border-green-600 focus:ring-green-600 text-lg tracking-wide h-12 bg-white/70 shadow-sm"
                          placeholder="0000"
                          required
                          maxLength={4}
                          autoFocus
                        />
                        {code && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-3 top-3">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                              <CheckCircle className="text-green-600 h-3.5 w-3.5" />
                            </div>
                          </motion.div>
                        )}
                      </div>
                      {code.length > 0 && code.length < 4 && (
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
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-green-700"
                      >
                        Recordar mi código
                      </label>
                    </div>

                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Button
                        type={code === "sao6admin" ? "submit" : "button"}
                        onClick={code === "sao6admin" ? undefined : handleNextStep}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-2.5 rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-md hover:shadow-lg h-12"
                        disabled={isLoading || code.length !== 4}
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
                        className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
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
                    className="space-y-6"
                    onSubmit={handleSubmit}
                  >
                    <motion.div
                      variants={itemVariants}
                      className="bg-green-50 p-3 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                          <User className="text-green-600 h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-medium text-green-700">Código: </span>
                          <span className="font-mono text-green-800">{formatCodeDisplay(code)}</span>
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
                      <Label htmlFor="password" className="text-green-700 flex items-center gap-2 text-base">
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
                        <div className="absolute left-3 top-3 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                          <CreditCard className="text-green-600 h-3.5 w-3.5" />
                        </div>
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 border-green-200 focus:border-green-600 focus:ring-green-600 text-lg h-12 bg-white/70 shadow-sm"
                          placeholder="••••••••"
                          required
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 hover:bg-green-200"
                        >
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
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
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-green-700"
                      >
                        Recordar mi código
                      </label>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-2.5 rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-md hover:shadow-lg flex items-center justify-center gap-2 h-12"
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

                    <motion.div variants={itemVariants} className="text-center">
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-green-600 hover:text-green-800 text-sm underline underline-offset-2"
                      >
                        ¿Olvidaste tu cédula?
                      </button>
                    </motion.div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <p>{error}</p>
                      </motion.div>
                    )}
                  </motion.form>
                )}

                {formStep === 2 && (
                  <motion.form
                    key="recoveryStep"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-6"
                    onSubmit={handleRecoverySubmit}
                  >
                    {!recoverySuccess ? (
                      <>
                        <motion.div
                          variants={itemVariants}
                          className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg text-blue-700 text-sm"
                        >
                          <h4 className="font-medium mb-1">Recuperación de acceso</h4>
                          <p>Ingresa tu correo electrónico y te enviaremos un código para recuperar tu cédula.</p>
                        </motion.div>

                        <motion.div variants={itemVariants} className="relative">
                          <Label htmlFor="email" className="text-emerald-700 text-base">
                            Correo electrónico
                          </Label>
                          <div className="relative mt-2">
                            <div className="absolute left-3 top-3 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                              <Mail className="text-emerald-600 h-3.5 w-3.5" />
                            </div>
                            <Input
                              id="email"
                              type="email"
                              value={recoveryEmail}
                              onChange={(e) => setRecoveryEmail(e.target.value)}
                              className="pl-10 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 h-12 bg-white/70 shadow-sm"
                              placeholder="tu@correo.com"
                              required
                              autoFocus
                            />
                          </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            onClick={handleBackToLogin}
                          >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver
                          </Button>

                          <Button
                            type="submit"
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                            disabled={isLoading || !recoveryEmail.includes("@")}
                          >
                            {isLoading ? (
                              <>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                                Enviando...
                              </>
                            ) : (
                              "Enviar código"
                            )}
                          </Button>
                        </motion.div>
                      </>
                    ) : (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <div className="bg-emerald-50 p-4 rounded-lg text-emerald-700 mb-6 flex items-start gap-3">
                          <div className="mt-1 bg-emerald-100 rounded-full p-1">
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                          </div>
                          <div>
                            <p className="font-medium">Código enviado correctamente</p>
                            <p className="text-sm mt-1">Hemos enviado un código de verificación a {recoveryEmail}</p>
                          </div>
                        </div>

                        <Button
                          type="button"
                          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                          onClick={() => setFormStep(3)}
                        >
                          Continuar
                        </Button>
                      </motion.div>
                    )}

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <p>{error}</p>
                      </motion.div>
                    )}
                  </motion.form>
                )}

                {formStep === 3 && (
                  <motion.form
                    key="verifyCodeStep"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-6"
                    onSubmit={handleVerifyCode}
                  >
                    <motion.div
                      variants={itemVariants}
                      className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg text-blue-700 text-sm"
                    >
                      <h4 className="font-medium mb-1">Verificación</h4>
                      <p>Ingresa el código de 6 dígitos que enviamos a tu correo electrónico.</p>
                    </motion.div>

                    <motion.div variants={itemVariants} className="relative">
                      <Label htmlFor="verificationCode" className="text-emerald-700 text-base">
                        Código de verificación
                      </Label>
                      <div className="relative mt-2">
                        <div className="absolute left-3 top-3 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                          <KeyRound className="text-emerald-600 h-3.5 w-3.5" />
                        </div>
                        <Input
                          id="verificationCode"
                          type="text"
                          value={recoveryCode}
                          onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="pl-10 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 text-lg tracking-widest h-12 text-center bg-white/70 shadow-sm"
                          placeholder="000000"
                          required
                          autoFocus
                          maxLength={6}
                        />
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="grid grid-cols-6 gap-2 mt-1">
                      {Array(6)
                        .fill(0)
                        .map((_, index) => (
                          <div
                            key={index}
                            className={`h-1 rounded-full ${index < recoveryCode.length ? "bg-emerald-500" : "bg-gray-200"}`}
                          ></div>
                        ))}
                    </motion.div>

                    <motion.div variants={itemVariants} className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        onClick={() => setFormStep(2)}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver
                      </Button>

                      <Button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                        disabled={isLoading || recoveryCode.length !== 6}
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                            Verificando...
                          </>
                        ) : (
                          "Verificar código"
                        )}
                      </Button>
                    </motion.div>

                    <motion.div variants={itemVariants} className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setRecoveryCode("")
                          setFormStep(2)
                        }}
                        className="text-emerald-600 hover:text-emerald-800 text-sm underline underline-offset-2"
                      >
                        ¿No recibiste el código? Reenviar
                      </button>
                    </motion.div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <p>{error}</p>
                      </motion.div>
                    )}
                  </motion.form>
                )}

                {formStep === 4 && (
                  <motion.form
                    key="resetPasswordStep"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-6"
                    onSubmit={handleResetPassword}
                  >
                    <motion.div
                      variants={itemVariants}
                      className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg text-blue-700 text-sm"
                    >
                      <h4 className="font-medium mb-1">Nueva contraseña</h4>
                      <p>Crea una nueva contraseña segura para tu cuenta.</p>
                    </motion.div>

                    <motion.div variants={itemVariants} className="relative">
                      <Label htmlFor="newPassword" className="text-emerald-700 text-base flex justify-between">
                        <span>Nueva contraseña</span>
                        {passwordFocused && (
                          <span className={`text-xs ${passwordStrength >= 3 ? "text-emerald-600" : "text-amber-500"}`}>
                            {passwordStrength < 3
                              ? "Contraseña débil"
                              : passwordStrength === 5
                                ? "Excelente"
                                : "Contraseña fuerte"}
                          </span>
                        )}
                      </Label>
                      <div className="relative mt-2">
                        <div className="absolute left-3 top-3 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Lock className="text-emerald-600 h-3.5 w-3.5" />
                        </div>
                        <Input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          onFocus={() => setPasswordFocused(true)}
                          onBlur={() => setPasswordFocused(false)}
                          className="pl-10 pr-10 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 h-12 bg-white/70 shadow-sm"
                          placeholder="••••••••"
                          required
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 hover:bg-emerald-200"
                        >
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      {passwordFocused && (
                        <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(5, passwordStrength * 20)}%` }}
                            className={`h-full rounded-full ${passwordStrength < 3 ? "bg-amber-500" : passwordStrength < 4 ? "bg-emerald-400" : "bg-emerald-500"}`}
                          />
                        </div>
                      )}
                    </motion.div>

                    <motion.div variants={itemVariants} className="relative">
                      <Label htmlFor="confirmPassword" className="text-emerald-700 text-base">
                        Confirmar contraseña
                      </Label>
                      <div className="relative mt-2">
                        <div className="absolute left-3 top-3 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Lock className="text-emerald-600 h-3.5 w-3.5" />
                        </div>
                        <Input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10 pr-10 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 h-12 bg-white/70 shadow-sm"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-red-500 text-xs mt-1">Las contraseñas no coinciden</p>
                      )}
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md h-12"
                        disabled={
                          isLoading ||
                          !newPassword ||
                          !confirmPassword ||
                          newPassword !== confirmPassword ||
                          passwordStrength < 3
                        }
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                            Actualizando...
                          </>
                        ) : (
                          "Actualizar contraseña"
                        )}
                      </Button>
                    </motion.div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
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
        <div className="w-full md:w-1/2 bg-gradient-to-br from-green-600 to-green-700 text-white p-8 md:p-12 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0">
            <motion.div
              initial={{ opacity: 0.1 }}
              animate={{
                opacity: [0.1, 0.15, 0.1],
                y: [0, -10, 0],
                rotate: [0, 5, 0],
              }}
              transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="absolute -top-20 -right-20 w-64 h-64 bg-white opacity-10 rounded-full"
            />
            <motion.div
              initial={{ opacity: 0.1 }}
              animate={{
                opacity: [0.1, 0.2, 0.1],
                y: [0, 20, 0],
                x: [0, -10, 0],
              }}
              transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-32 -left-20 w-80 h-80 bg-white opacity-10 rounded-full"
            />
            <motion.svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 opacity-10"
            >
              <motion.path
                d="M0,0 Q50,50 100,0 V100 Q50,50 0,100 Z"
                fill="white"
                initial={{ opacity: 0.05 }}
                animate={{
                  opacity: [0.05, 0.1, 0.05],
                  d: [
                    "M0,0 Q50,50 100,0 V100 Q50,50 0,100 Z",
                    "M0,0 Q50,40 100,0 V100 Q50,60 0,100 Z",
                    "M0,0 Q50,50 100,0 V100 Q50,50 0,100 Z",
                  ],
                }}
                transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />
            </motion.svg>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center relative z-10 max-w-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mb-6"
            >
            </motion.div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-4xl font-bold mb-6"
            >
              ¡Bienvenido!
            </motion.h2>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white mb-8 overflow-hidden">
                <CardContent className="p-6">
                  <p className="text-white font-medium">
                    Sistema de gestión integrado para el control y seguimiento de actividades.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, staggerChildren: 0.1 }}
              className="flex flex-col gap-4"
            >
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-3 text-sm bg-white/10 rounded-lg p-3 backdrop-blur-sm"
              >
                <CheckCircle className="h-5 w-5 text-green-200 flex-shrink-0" />
                <span>Gestión eficiente de solicitudes y permisos</span>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-3 text-sm bg-white/10 rounded-lg p-3 backdrop-blur-sm"
              >
                <CheckCircle className="h-5 w-5 text-green-200 flex-shrink-0" />
                <span>Seguimiento en tiempo real de procesos</span>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-3 text-sm bg-white/10 rounded-lg p-3 backdrop-blur-sm"
              >
                <CheckCircle className="h-5 w-5 text-green-200 flex-shrink-0" />
                <span>Interfaz intuitiva y experiencia mejorada</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {isLoading && <LoadingOverlay />}
      <ErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} />

      {/* Success Animation */}
      <AnimatePresence>
        {showSuccessAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-green-900/30 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="bg-white rounded-full p-8 shadow-2xl"
            >
              <motion.div className="w-24 h-24 relative">
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
                    transition={{ duration: 0.5, ease: "easeInOut", delay: 0.8 }}
                  />
                </svg>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add CSS for animations */}
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
      `}</style>
    </div>
  )
}