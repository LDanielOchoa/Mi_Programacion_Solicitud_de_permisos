"use client"

import React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import {
  X,
  ChevronRight,
  Sparkles,
  Gift,
  Bell,
  CheckCircle,
  Calendar,
  Briefcase,
  FileText,
  ChevronLeft,
  Star,
  Zap,
  Award,
  Lightbulb,
} from "lucide-react"

interface WhatsNewModalProps {
  onClose: () => void
}

export function WhatsNewModal({ onClose }: WhatsNewModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [animationDirection, setAnimationDirection] = useState<"next" | "prev">("next")

  const features = [
    {
      title: "Nuevo Dashboard",
      description: "Hemos rediseñado completamente el dashboard para una mejor experiencia visual y funcional.",
      icon: Sparkles,
      color: "from-emerald-500 to-green-600",
      image: "/news-illustration.svg",
      highlights: [
        { icon: Zap, text: "Interfaz moderna" },
        { icon: Star, text: "Animaciones fluidas" },
        { icon: Lightbulb, text: "Personalizable" },
      ],
    },
    {
      title: "Solicitudes Mejoradas",
      description: "Ahora puedes gestionar tus solicitudes de manera más eficiente con nuestra nueva interfaz.",
      icon: FileText,
      color: "from-blue-500 to-indigo-600",
      image: "/news-illustration.svg",
      highlights: [
        { icon: CheckCircle, text: "Aprobación rápida" },
        { icon: Calendar, text: "Seguimiento en tiempo real" },
        { icon: Award, text: "Estadísticas detalladas" },
      ],
    },
    {
      title: "Notificaciones en tiempo real",
      description: "Recibe actualizaciones instantáneas sobre el estado de tus solicitudes.",
      icon: Bell,
      color: "from-amber-500 to-yellow-600",
      image: "/news-illustration.svg",
      highlights: [
        { icon: Zap, text: "Alertas instantáneas" },
        { icon: CheckCircle, text: "Personalización" },
        { icon: Star, text: "Priorización inteligente" },
      ],
    },
    {
      title: "Nuevos beneficios",
      description: "Descubre los nuevos beneficios disponibles para todos los colaboradores.",
      icon: Gift,
      color: "from-purple-500 to-pink-600",
      image: "/news-illustration.svg",
      highlights: [
        { icon: Award, text: "Reconocimientos" },
        { icon: Calendar, text: "Días adicionales" },
        { icon: Lightbulb, text: "Programa de ideas" },
      ],
    },
  ]

  const nextStep = () => {
    if (currentStep < features.length - 1) {
      setAnimationDirection("next")
      setCurrentStep(currentStep + 1)
    } else {
      onClose()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setAnimationDirection("prev")
      setCurrentStep(currentStep - 1)
    }
  }

  // Animación de partículas
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; duration: number; delay: number; }[]>([])

  useEffect(() => {
    // Crear partículas aleatorias
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
    }))
    setParticles(newParticles)
  }, [currentStep])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full mx-4 shadow-2xl overflow-hidden"
      >
        {/* Progress bar */}
        <div className="relative h-1 bg-gray-100 dark:bg-gray-800">
          <motion.div
            className={`absolute top-0 left-0 h-full bg-gradient-to-r ${features[currentStep].color}`}
            initial={{ width: `${(currentStep / features.length) * 100}%` }}
            animate={{ width: `${((currentStep + 1) / features.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Close button */}
        <motion.button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 rounded-full p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <X className="h-5 w-5" />
        </motion.button>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentStep}
            initial={{
              opacity: 0,
              x: animationDirection === "next" ? 100 : -100,
            }}
            animate={{ opacity: 1, x: 0 }}
            exit={{
              opacity: 0,
              x: animationDirection === "next" ? -100 : 100,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="relative"
          >
            {/* Feature content */}
            <div className={`bg-gradient-to-r ${features[currentStep].color} p-8 pt-12 relative overflow-hidden`}>
              {/* Partículas animadas */}
              {particles.map((particle) => (
                <motion.div
                  key={particle.id}
                  className="absolute rounded-full bg-white/20"
                  style={{
                    width: particle.size,
                    height: particle.size,
                    left: `${particle.x}%`,
                    top: `${particle.y}%`,
                  }}
                  animate={{
                    x: [0, Math.random() * 40 - 20],
                    y: [0, Math.random() * 40 - 20],
                    opacity: [0, 0.7, 0],
                  }}
                  transition={{
                    duration: particle.duration,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: particle.delay,
                    ease: "easeInOut",
                  }}
                />
              ))}

              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <motion.div
                  className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/20"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, 0],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute bottom-10 left-10 w-20 h-20 rounded-full bg-white/20"
                  animate={{
                    scale: [1, 1.3, 1],
                    rotate: [0, -10, 0],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                />
              </div>

              <div className="relative z-10">
                <motion.div
                  className="flex items-center mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="bg-white/20 p-2 rounded-lg mr-3">
                    {React.createElement(features[currentStep].icon, { className: "h-6 w-6 text-white" })}
                  </div>
                  <h2 className="text-2xl font-bold text-white">{features[currentStep].title}</h2>
                </motion.div>

                <motion.p
                  className="text-white/90 text-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {features[currentStep].description}
                </motion.p>

                <motion.div
                  className="flex flex-wrap gap-3 mt-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {features[currentStep].highlights.map((highlight, index) => (
                    <motion.div
                      key={index}
                      className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-full flex items-center gap-2"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <highlight.icon className="h-4 w-4 text-white" />
                      <span className="text-sm text-white">{highlight.text}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>

            {/* Illustration */}
            <div className="flex justify-center -mt-10 relative z-10">
              <motion.div
                className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-700"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Image
                  src={features[currentStep].image || "/placeholder.svg"}
                  alt="Novedades"
                  width={50}
                  height={50}
                  className="object-contain"
                />
              </motion.div>
            </div>

            {/* Feature cards */}
            <div className="p-6">
              <div className="grid grid-cols-4 gap-3 mb-6">
                {features.map((feature, index) => (
                  <motion.button
                    key={index}
                    className={`p-3 rounded-lg flex flex-col items-center justify-center text-center ${
                      currentStep === index
                        ? `bg-gradient-to-r ${feature.color} text-white shadow-md`
                        : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => {
                      setAnimationDirection(index > currentStep ? "next" : "prev")
                      setCurrentStep(index)
                    }}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <feature.icon className="h-5 w-5 mb-1" />
                    <span className="text-xs font-medium">{index + 1}</span>
                  </motion.button>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex gap-3">
                  {currentStep > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        className="w-full border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={prevStep}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Anterior
                      </Button>
                    </motion.div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex-1"
                  >
                    <Button
                      className={`w-full bg-gradient-to-r ${features[currentStep].color} hover:opacity-90 text-white`}
                      onClick={nextStep}
                    >
                      {currentStep < features.length - 1 ? "Siguiente" : "Comenzar"}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </motion.div>
                </div>

                {currentStep === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button
                      variant="ghost"
                      className="w-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      onClick={onClose}
                    >
                      Omitir presentación
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Feature highlights */}
        <motion.div
          className="px-6 pb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-800 pt-4">
            <div className="flex space-x-4">
              {[
                { icon: FileText, label: "Permisos" },
                { icon: Briefcase, label: "Postulaciones" },
                { icon: Calendar, label: "Calendario" },
                { icon: CheckCircle, label: "Aprobaciones" },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ y: -3 }}
                >
                  <div
                    className={`bg-gradient-to-r ${features[currentStep].color} bg-opacity-10 rounded-full p-2 mb-1`}
                  >
                    <item.icon
                      className={`h-4 w-4 text-${features[currentStep].color.split("-")[1]}-600 dark:text-${features[currentStep].color.split("-")[1]}-400`}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
