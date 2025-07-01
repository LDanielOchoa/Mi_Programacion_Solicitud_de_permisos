"use client"

import type React from "react"
import { useState, useEffect } from "react"

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)

  // Simple loading state management
  useEffect(() => {
    const handleStart = () => setIsLoading(true)
    const handleComplete = () => setIsLoading(false)

    // Listen for route changes if needed
    // For now, just render children directly
    handleComplete()

    return () => {
      handleComplete()
    }
  }, [])

  return (
    <>
      {children}
      
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-green-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-green-600 border-t-transparent animate-spin"></div>
            </div>
            
            <div className="flex space-x-2">
              {[0, 1, 2].map((dot) => (
                <div
                  key={dot}
                  className="w-2 h-2 rounded-full bg-green-600 animate-pulse"
                  style={{
                    animationDelay: `${dot * 0.2}s`,
                  }}
                />
              ))}
            </div>
            
            <p className="mt-4 text-sm text-gray-600">Cargando...</p>
          </div>
        </div>
      )}
    </>
  )
}
