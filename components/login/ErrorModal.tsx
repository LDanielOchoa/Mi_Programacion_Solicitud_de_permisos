import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorModalProps {
    isOpen: boolean
    onClose: () => void
}

const ErrorModal = React.memo(({ isOpen, onClose }: ErrorModalProps) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-green-950/30 backdrop-blur-md flex items-center justify-center z-50 p-4"
                style={{ willChange: "opacity" }}
            >
                <motion.div
                    initial={{ y: 40, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 40, opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full border border-green-100/50"
                    style={{ willChange: "transform" }}
                >
                    <div className="text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                            className="w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg"
                        >
                            <AlertCircle className="h-10 w-10 text-red-600" />
                        </motion.div>
                        <h3 className="text-2xl font-bold text-green-800 mb-3 tracking-tight">Demasiados intentos</h3>
                        <p className="text-green-600 text-base mb-8 leading-relaxed">
                            Has excedido el número de intentos permitidos. Intenta nuevamente más tarde.
                        </p>
                        <Button
                            onClick={onClose}
                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 w-full h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            Entendido
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
))

ErrorModal.displayName = "ErrorModal"

export default ErrorModal
