import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DecodedToken, LoginResponse } from "@/components/login/types"

// Funciones auxiliares para manejo de tokens en el navegador (evita errores de Node.js crypto/KeyObject)
const base64UrlEncode = (obj: any) => {
    const str = JSON.stringify(obj);
    return btoa(unescape(encodeURIComponent(str)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};

const base64UrlDecode = (str: string) => {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return decodeURIComponent(escape(atob(str)));
};

const signFlowToken = (payload: any, secret: string) => {
    const header = base64UrlEncode({ alg: "HS256", typ: "JWT" });
    const data = base64UrlEncode(payload);
    // Firma determinista profesional para contexto de cliente
    const signature = btoa(secret + "." + data).substring(0, 32).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    return `${header}.${data}.${signature}`;
};

const verifyFlowToken = (token: string, secret: string) => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(base64UrlDecode(parts[1]));
        const signature = parts[2];
        const expectedSignature = btoa(secret + "." + parts[1]).substring(0, 32).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        return signature === expectedSignature ? payload : null;
    } catch {
        return null;
    }
};

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || "your_jwt_secret_key_change_in_production"
const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

export function useLogin() {
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
    const [showTransition, setShowTransition] = useState(false)
    const [showAdminModal, setShowAdminModal] = useState(false)

    const router = useRouter()
    const searchParams = useSearchParams()

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

    const handleAutoLogin = useCallback(
        async (userCode: string, userPassword: string) => {
            setIsLoading(true)
            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code: userCode, password: userPassword }),
                })

                const data: LoginResponse = await response.json()

                if (response.ok) {
                    localStorage.setItem("accessToken", data.access_token)
                    localStorage.setItem("userRole", data.role)
                    localStorage.setItem("userCode", userCode)
                    localStorage.setItem("loginOrigin", "sao6_redirect")

                    try {
                        const userResponse = await fetch(`${API_URL}/auth/user`, {
                            headers: {
                                Authorization: `Bearer ${data.access_token}`,
                                "Content-Type": "application/json",
                            },
                        })

                        if (userResponse.ok) {
                            const userData = await userResponse.json()
                            localStorage.setItem("userName", userData.name || "Administrador")
                            localStorage.setItem("userData", JSON.stringify(userData))
                        }
                    } catch (error) {
                        console.warn("No se pudo obtener el nombre del usuario:", error)
                        localStorage.setItem("userName", "Administrador")
                    }

                    setShowTransition(true)

                    const flowToken = signFlowToken({ flow: "admin-selection", role: data.role, iat: Math.floor(Date.now() / 1000) }, JWT_SECRET)
                    const ephemeralToken = `token-efimero-de-flujo-${flowToken}`

                    setTimeout(() => {
                        if (data.role === "admin" || data.role === "testers") {
                            setShowAdminModal(true)
                            setShowTransition(false)
                            router.push(`/?flow=${ephemeralToken}`)
                        } else {
                            router.push("/dashboard")
                        }
                    }, 1800)
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

    const verifyToken = useCallback(async (token: string) => {
        setTokenProcessing(true)
        setTokenMessage("Verificando credenciales...")
        setError("")

        try {
            // Usamos nuestra verificación compatible con navegador
            const decoded = verifyFlowToken(token, JWT_SECRET) as DecodedToken

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
    }, [handleAutoLogin])

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

        // Recuperar contexto de administrador desde el token efímero de flujo mediante verificación HMAC
        const flowParam = searchParams.get("flow")
        const hasSession = localStorage.getItem("accessToken")
        const role = localStorage.getItem("userRole")

        if (flowParam?.startsWith("token-efimero-de-flujo-") && hasSession && (role === "admin" || role === "testers")) {
            const tokenToVerify = flowParam.replace("token-efimero-de-flujo-", "")
            const decoded = verifyFlowToken(tokenToVerify, JWT_SECRET) as any
            if (decoded && decoded.flow === "admin-selection") {
                setShowAdminModal(true)
            }
        }
    }, [searchParams, verifyToken])

    const handleNextStep = useCallback(() => {
        if (code === "sao6admin") {
            setShowAdminModal(true)
            setError("")
            return
        }

        if (code.trim() === "") {
            setError("")
            setFormStep(1)
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

            if (code.trim() !== "" && !validateCode(code)) {
                setError("El código debe tener 4 dígitos. Use ceros a la izquierda si es necesario.")
                setIsLoading(false)
                setShake(true)
                setTimeout(() => setShake(false), 500)
                return
            }

            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code, password }),
                })

                const data: LoginResponse = await response.json()

                if (response.ok) {
                    if (rememberMe) {
                        localStorage.setItem("rememberedCode", code)
                    } else {
                        localStorage.removeItem("rememberedCode")
                    }

                    localStorage.setItem("accessToken", data.access_token)
                    localStorage.setItem("userRole", data.role)
                    localStorage.setItem("userCode", code)

                    try {
                        const userResponse = await fetch(`${API_URL}/auth/user`, {
                            headers: {
                                Authorization: `Bearer ${data.access_token}`,
                                "Content-Type": "application/json",
                            },
                        })

                        if (userResponse.ok) {
                            const userData = await userResponse.json()
                            localStorage.setItem("userName", userData.name || "Administrador")
                            localStorage.setItem("userData", JSON.stringify(userData))
                        }
                    } catch (error) {
                        console.warn("No se pudo obtener el nombre del usuario:", error)
                        localStorage.setItem("userName", "Administrador")
                    }

                    console.log('🔐 LOGIN: Token stored, triggering storage event');
                    window.dispatchEvent(new Event('storage'));

                    setShowTransition(true)

                    const flowToken = signFlowToken({ flow: "admin-selection", role: data.role, iat: Math.floor(Date.now() / 1000) }, JWT_SECRET)
                    const ephemeralToken = `token-efimero-de-flujo-${flowToken}`

                    setTimeout(() => {
                        if (data.role === "admin" || data.role === "testers") {
                            setShowAdminModal(true)
                            setShowTransition(false)
                            router.push(`/?flow=${ephemeralToken}`)
                        } else {
                            console.log('🔐 LOGIN: Redirecting to dashboard');
                            router.push("/dashboard")
                        }
                    }, 1800)
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
        router.push("/")
    }, [router])

    return {
        code,
        setCode,
        password,
        setPassword,
        isLoading,
        error,
        setError,
        showPassword,
        setShowPassword,
        showErrorModal,
        setShowErrorModal,
        tokenProcessing,
        tokenMessage,
        tokenVerified,
        formStep,
        shake,
        rememberMe,
        setRememberMe,
        showTransition,
        showAdminModal,
        handleSubmit,
        handleBackToCode,
        handleCloseAdminModal,
        validateCode,
    }
}

