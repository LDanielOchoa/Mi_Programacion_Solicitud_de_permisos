import { useState, useCallback, useRef, useEffect } from "react"
import { ConnectionAwareSubmitState, ConnectionAwareSubmitOptions } from "./types"

/**
 * Hook para manejar envíos con reintentos y monitoreo de conexión
 */
export function useConnectionAwareSubmit<T, U>(
    submitFn: (data: T, signal: AbortSignal) => Promise<U>,
    options: ConnectionAwareSubmitOptions
) {
    const { timeout, maxRetries, retryDelay, deduplicationWindow, onProgress, onConnectionIssue } = options

    const [state, setState] = useState<ConnectionAwareSubmitState>({
        isSubmitting: false,
        isRetrying: false,
        retryCount: 0,
        stage: "",
        connectionQuality: "excellent",
    })

    const pendingRequests = useRef(new Map<string, AbortController>())
    const lastSubmitTime = useRef(0)

    const getRequestKey = useCallback((data: T) => {
        return JSON.stringify(data)
    }, [])

    const updateConnectionQuality = useCallback(() => {
        const random = Math.random()
        let quality: "excellent" | "good" | "poor" = "excellent"
        if (random < 0.1) quality = "poor"
        else if (random < 0.3) quality = "good"

        setState((prev) => ({ ...prev, connectionQuality: quality }))
    }, [])

    useEffect(() => {
        const interval = setInterval(updateConnectionQuality, 5000)
        return () => clearInterval(interval)
    }, [updateConnectionQuality])

    const submit = useCallback(
        async (data: T) => {
            const requestKey = getRequestKey(data)
            const now = Date.now()

            if (now - lastSubmitTime.current < deduplicationWindow && pendingRequests.current.has(requestKey)) {
                onConnectionIssue?.("Solicitud duplicada detectada. Por favor, espere un momento.")
                return Promise.reject(new Error("Deduplicated request"))
            }

            const controller = new AbortController()
            pendingRequests.current.set(requestKey, controller)
            lastSubmitTime.current = now

            setState((prev) => ({ ...prev, isSubmitting: true, stage: "Iniciando envío" }))
            onProgress?.("Iniciando envío")

            let currentRetry = 0
            let timeoutId: NodeJS.Timeout

            while (currentRetry <= maxRetries) {
                try {
                    timeoutId = setTimeout(() => controller.abort(), timeout)

                    const result = await submitFn(data, controller.signal)
                    clearTimeout(timeoutId)

                    setState((prev) => ({
                        ...prev,
                        isSubmitting: false,
                        isRetrying: false,
                        retryCount: 0,
                        stage: "Completado",
                    }))
                    onProgress?.("Completado")
                    pendingRequests.current.delete(requestKey)
                    return result
                } catch (error: any) {
                    clearTimeout(timeoutId)

                    if (controller.signal.aborted) {
                        onConnectionIssue?.("La solicitud ha excedido el tiempo límite.")
                        setState((prev) => ({ ...prev, stage: "Tiempo de espera agotado" }))
                    } else if (error.name === "AbortError") {
                        onConnectionIssue?.("Envío cancelado por el usuario.")
                        setState((prev) => ({ ...prev, stage: "Cancelado" }))
                        pendingRequests.current.delete(requestKey)
                        return Promise.reject(error)
                    } else {
                        onConnectionIssue?.(`Error de red o servidor: ${error.message}`)
                        setState((prev) => ({ ...prev, stage: `Error: ${error.message}` }))
                    }

                    if (currentRetry < maxRetries) {
                        currentRetry++
                        setState((prev) => ({
                            ...prev,
                            isRetrying: true,
                            retryCount: currentRetry,
                            stage: `Reintentando (${currentRetry}/${maxRetries})`,
                        }))
                        onProgress?.(`Reintentando (${currentRetry}/${maxRetries})`)
                        await new Promise((resolve) => setTimeout(resolve, retryDelay))
                    } else {
                        setState((prev) => ({
                            ...prev,
                            isSubmitting: false,
                            isRetrying: false,
                            stage: "Fallo",
                        }))
                        onProgress?.("Fallo")
                        pendingRequests.current.delete(requestKey)
                        return Promise.reject(error)
                    }
                }
            }

            return Promise.reject(new Error("Submission failed after retries"))
        },
        [submitFn, timeout, maxRetries, retryDelay, deduplicationWindow, onProgress, onConnectionIssue, getRequestKey]
    )

    const cancelAllRequests = useCallback(() => {
        pendingRequests.current.forEach((controller) => controller.abort())
        pendingRequests.current.clear()
        setState((prev) => ({
            ...prev,
            isSubmitting: false,
            isRetrying: false,
            retryCount: 0,
            stage: "Cancelado por el usuario",
        }))
        onProgress?.("Cancelado por el usuario")
    }, [onProgress])

    return {
        submit,
        cancelAllRequests,
        state,
        pendingRequestsCount: pendingRequests.current.size,
    }
}
