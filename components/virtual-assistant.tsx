"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquareText, X, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface VirtualAssistantProps {
  message: string
  onHelp: () => void
  darkMode?: boolean
}

export function VirtualAssistant({ message, onHelp, darkMode = false }: VirtualAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isTyping, setIsTyping] = useState(true)
  const [displayedMessage, setDisplayedMessage] = useState("")

  // Simulate typing effect
  useState(() => {
    setIsTyping(true)
    setDisplayedMessage("")

    let i = 0
    const interval = setInterval(() => {
      if (i < message.length) {
        setDisplayedMessage((prev) => prev + message[i])
        i++
      } else {
        clearInterval(interval)
        setIsTyping(false)
      }
    }, 20)

    return () => clearInterval(interval)
  })

  return (
    <div className="fixed bottom-4 right-4 z-20 flex flex-col items-end">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={cn(
              "mb-2 p-4 rounded-lg shadow-lg max-w-xs w-full transition-colors duration-300",
              darkMode ? "bg-gray-800 border border-gray-700" : "bg-white",
            )}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300",
                    darkMode ? "bg-blue-600" : "bg-green-500",
                  )}
                >
                  <MessageSquareText className="w-4 h-4 text-white" />
                </div>
                <h3
                  className={cn(
                    "font-medium transition-colors duration-300",
                    darkMode ? "text-white" : "text-gray-800",
                  )}
                >
                  Asistente
                </h3>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className={cn(
                  "p-1 rounded-full transition-colors duration-300",
                  darkMode
                    ? "text-gray-400 hover:text-white hover:bg-gray-700"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
                )}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={cn("mb-3 transition-colors duration-300", darkMode ? "text-gray-300" : "text-gray-700")}>
              {displayedMessage}
              {isTyping && (
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1 }}
                >
                  |
                </motion.span>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={onHelp}
                className={cn(
                  "flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors duration-300",
                  darkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-green-500 hover:bg-green-600 text-white",
                )}
              >
                <HelpCircle className="w-3 h-3" />
                <span>Ayuda</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors duration-300",
          darkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-green-500 hover:bg-green-600 text-white",
        )}
      >
        {isExpanded ? <X className="w-5 h-5" /> : <MessageSquareText className="w-5 h-5" />}
      </motion.button>
    </div>
  )
}
