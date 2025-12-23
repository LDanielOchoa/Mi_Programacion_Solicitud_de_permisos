"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

export default function AuthReceiver() {
  const router = useRouter()
  const [message, setMessage] = useState("Procesando credenciales...")
  const [error, setError] = useState("")

  useEffect(() => {
    // Función para obtener los parámetros de la URL o del formulario
    const getCredentials = () => {
      // Verificar si hay datos en la URL
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get("code")
      const password = urlParams.get("password")

      return { code, password }
    }

    const autoLogin = async () => {
      try {
        const credentials = getCredentials()

        if (credentials.code && credentials.password) {
          setMessage("Autenticando automáticamente...")

          // Realizar la solicitud de inicio de sesión
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: credentials.code,
              password: credentials.password,
            }),
          })

          const data = await response.json()

          if (response.ok) {
            // Guardar token y datos de usuario
            localStorage.setItem("accessToken", data.access_token)
            localStorage.setItem("userRole", data.role)
            localStorage.setItem("userCode", credentials.code)

            setMessage("Inicio de sesión exitoso. Redirigiendo...")

            // Redirigir según el rol
            setTimeout(() => {
              if (data.role === "admin" || data.role === "testers") {
                router.push("/dashboard-admin-requests")
              } else {
                router.push("/dashboard")
              }
            }, 1000)
          } else {
            setError(data.msg || "Credenciales inválidas")
            setMessage("Error de autenticación. Redirigiendo al inicio de sesión...")
            setTimeout(() => {
              router.push("/")
            }, 2000)
          }
        } else {
          // No hay credenciales, redirigir al login normal
          router.push("/")
        }
      } catch (error) {
        console.error("Error en el inicio de sesión automático:", error)
        setError("Error de conexión")
        setMessage("Error de conexión. Redirigiendo al inicio de sesión...")
        setTimeout(() => {
          router.push("/")
        }, 2000)
      }
    }

    autoLogin()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 via-green-500 to-emerald-600">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md"
      >
        <div className="flex justify-center mb-6">
          <Loader2 className="h-12 w-12 text-green-500 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-green-700 mb-4">{message}</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <p className="text-gray-600">Por favor espere mientras procesamos su solicitud...</p>
      </motion.div>
    </div>
  )
}


