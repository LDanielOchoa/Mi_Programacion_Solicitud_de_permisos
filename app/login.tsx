"use client"

import React from "react"
import type { ReactElement } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { CheckCircle } from "lucide-react"

import dynamic from "next/dynamic"

// Components
const LoadingOverlay = dynamic(() => import("@/components/login/LoadingOverlay"), { ssr: false })
const ErrorModal = dynamic(() => import("@/components/login/ErrorModal"), { ssr: false })
const LoginTransition = dynamic(() => import("@/components/login/LoginTransition"), { ssr: false })
const LoginForm = dynamic(() => import("@/components/login/LoginForm"), { ssr: false })
const AdminSelectionScreen = dynamic(() => import("@/components/login/AdminSelectionScreen"), { ssr: false })

// Hook
import { useLogin } from "@/hooks/use-login"

// Variants
import { containerVariants, itemVariants } from "@/components/login/variants"

export default function LoginPage(): ReactElement {
  const {
    code,
    setCode,
    password,
    setPassword,
    isLoading,
    error,
    showPassword,
    setShowPassword,
    showErrorModal,
    setShowErrorModal,
    tokenProcessing,
    tokenMessage,
    tokenVerified,
    formStep,
    shake,
    showTransition,
    showAdminModal,
    handleSubmit,
    handleBackToCode,
    handleCloseAdminModal,
    validateCode,
  } = useLogin()

  return (
    <div className="h-screen w-screen bg-white flex flex-col lg:flex-row-reverse relative overflow-hidden">

      {/* Right side in Desktop / Top in Mobile (Hero Section) */}
      <div className="relative h-[45vh] lg:h-full lg:flex-1 bg-gray-900 overflow-hidden">
        <Image
          src="/20250710_111855.webp"
          alt="Solicitud de Permisos Background"
          fill
          className="object-cover opacity-60 lg:opacity-80 scale-105"
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
        />

        {/* Overlay Content on Image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-6 lg:p-16">
          {/* Logo on top for mobile/desktop */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <div className="w-12 h-12 lg:w-16 lg:h-16 relative">
              <Image src="/sao6.png" alt="Logo SAO6" fill className="object-contain" sizes="(max-width: 1024px) 48px, 64px" />
            </div>
            <span className="text-white text-2xl lg:text-3xl font-black tracking-tighter">SAO6</span>
          </motion.div>

          {/* Title on bottom of image section */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="space-y-4 mb-20 lg:mb-0"
          >
            <div className="space-y-1 lg:space-y-4">
              <h2 className="text-4xl lg:text-7xl font-black text-white leading-tight tracking-tighter">
                Solicitud de <br />
                <span className="text-[#4cc253]">Permisos</span>
              </h2>
              <div className="h-1.5 w-16 lg:w-24 bg-[#4cc253] rounded-full" />
            </div>
            <p className="hidden lg:block text-gray-200 text-xl font-light leading-relaxed max-w-lg">
              Sistema ágil para la planificación, solicitud y seguimiento de permisos operacionales y administrativos.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Left side in Desktop (Login Form Section) */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center relative z-10 -mt-16 lg:mt-0">
        <div className="bg-white lg:bg-white rounded-t-[3.5rem] lg:rounded-none p-6 lg:p-16 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] lg:shadow-none h-[55vh] lg:h-full flex flex-col justify-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-md mx-auto w-full space-y-10 lg:space-y-12"
          >
            {/* Form Header */}
            <motion.div variants={itemVariants} className="space-y-2 lg:space-y-3">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                  Bienvenido
                </h1>
                <span className="text-4xl lg:text-5xl animate-bounce">👋</span>
              </div>
              <p className="text-gray-500 text-lg font-medium">
                Ingresa tus datos para continuar.
              </p>
            </motion.div>

            {/* Content Logic */}
            <div className={shake ? "animate-shake" : ""}>
              {tokenProcessing ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gray-50 border border-gray-100 rounded-2xl p-8 flex flex-col items-center gap-4 text-center"
                >
                  {tokenVerified ? (
                    <div className="w-16 h-16 rounded-full bg-[#4cc253]/10 flex items-center justify-center mb-2">
                      <CheckCircle className="h-10 w-10 text-[#4cc253]" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 border-4 border-[#4cc253]/20 border-t-[#4cc253] animate-spin rounded-full mb-2" />
                  )}
                  <span className="text-xl font-bold text-gray-800">{tokenMessage}</span>
                </motion.div>
              ) : (
                <LoginForm
                  formStep={formStep}
                  code={code}
                  setCode={setCode}
                  password={password}
                  setPassword={setPassword}
                  isLoading={isLoading}
                  error={error}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  handleSubmit={handleSubmit}
                  handleBackToCode={handleBackToCode}
                  validateCode={validateCode}
                />
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modals & Overlays */}
      {showAdminModal && <AdminSelectionScreen onClose={handleCloseAdminModal} />}
      {isLoading && <LoadingOverlay />}
      <ErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} />
      <LoginTransition isVisible={showTransition} />

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
        
        @media (max-width: 1023px) {
          body {
            background-color: #f8fafc;
          }
        }
      `}</style>
    </div>
  )
}
