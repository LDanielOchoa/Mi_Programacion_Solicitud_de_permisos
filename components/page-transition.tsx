"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import Image from "next/image"

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isChanging, setIsChanging] = useState(false)
  const [prevPath, setPrevPath] = useState("")

  useEffect(() => {
    // When pathname changes, trigger the transition
    if (prevPath && prevPath !== pathname) {
      setIsChanging(true)

      // Reset after animation completes
      const timer = setTimeout(() => {
        setIsChanging(false)
      }, 1000) // Match this with the animation duration

      return () => clearTimeout(timer)
    }

    setPrevPath(pathname)
  }, [pathname, prevPath])

  return (
    <>
      {children}

      <AnimatePresence>
        {isChanging && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/70 via-white/70 to-green-100/70 backdrop-blur-sm"></div>

            <motion.div
              className="relative z-10 flex flex-col items-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative w-24 h-24 mb-4">
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 to-green-600"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full bg-white flex items-center justify-center"
                  style={{ margin: "15%" }}
                >
                  <Image src="/images/sao6-blanco.png" alt="SAO6 Logo" width={32} height={32} className="h-8 w-auto" />
                </motion.div>
              </div>

              <motion.div
                className="flex space-x-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {[0, 1, 2].map((dot) => (
                  <motion.div
                    key={dot}
                    className="w-3 h-3 rounded-full bg-emerald-500"
                    animate={{
                      scale: [0.8, 1.2, 0.8],
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: dot * 0.2,
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
