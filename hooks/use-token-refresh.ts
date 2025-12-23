"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

export const useTokenRefresh = () => {
  const router = useRouter()
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const refreshToken = async () => {
    try {
      const token = localStorage.getItem("accessToken")
      if (!token) {
        throw new Error("No hay token disponible")
      }

      // Intentar renovar el token haciendo una petición al endpoint de refresh
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.accessToken) {
          localStorage.setItem("accessToken", data.accessToken)
          console.log("Token renovado exitosamente")
          return true
        }
      }

      return false
    } catch (error) {
      console.error("Error al renovar token:", error)
      return false
    }
  }

  const scheduleTokenRefresh = () => {
    // Limpiar timeout anterior si existe
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    // Programar renovación 10 minutos antes de que expire (1 hora y 50 minutos después de la creación)
    const refreshTime = 110 * 60 * 1000 // 1 hora y 50 minutos en milisegundos

    refreshTimeoutRef.current = setTimeout(async () => {
      const success = await refreshToken()
      if (!success) {
        // Si falla la renovación, mostrar mensaje y redirigir
        toast({
          title: "Sesión expirada",
          description: "Su sesión ha expirado. Será redirigido a la página de inicio de sesión.",
          variant: "destructive",
          duration: 3000,
        })

        setTimeout(() => {
          localStorage.clear()
          router.push("/")
        }, 3000)
      } else {
        // Programar la siguiente renovación
        scheduleTokenRefresh()
      }
    }, refreshTime)
  }

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (token) {
      scheduleTokenRefresh()
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  return { refreshToken }
} 
