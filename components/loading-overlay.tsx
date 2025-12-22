"use client"

import { motion } from "framer-motion"
import Image from "next/image"

export default function LoadingOverlay() {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/90 via-white/90 to-green-100/90 backdrop-blur-md"></div>

      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative w-28 h-28 mb-6">
          {/* Outer spinning circle */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-green-200 border-t-green-500 border-r-green-500"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />

          {/* Middle pulsing circle */}
          <motion.div
            className="absolute inset-0 m-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-600"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />

          {/* Inner logo container */}
          <motion.div
            className="absolute inset-0 m-6 rounded-full bg-white flex items-center justify-center shadow-inner"
            animate={{
              boxShadow: ["0 0 10px rgba(0,0,0,0.1)", "0 0 20px rgba(0,0,0,0.2)", "0 0 10px rgba(0,0,0,0.1)"],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <Image src="/images/sao6-blanco.png" alt="SAO6 Logo" width={40} height={40} className="h-10 w-auto" />
          </motion.div>
        </div>

        <motion.h3
          className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500 mb-3"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
        >
          Cargando
        </motion.h3>

        <motion.div
          className="flex space-x-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {[0, 1, 2].map((dot) => (
            <motion.div
              key={dot}
              className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-600"
              animate={{
                scale: [0.8, 1.2, 0.8],
                opacity: [0.6, 1, 0.6],
                y: [0, -5, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                delay: dot * 0.3,
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
