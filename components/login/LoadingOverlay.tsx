import React from "react"
import { motion } from "framer-motion"
import { Leaf } from "lucide-react"

const LoadingOverlay = React.memo(() => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-green-950/20 backdrop-blur-md flex items-center justify-center z-50"
        style={{ willChange: "opacity" }}
    >
        <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white/95 backdrop-blur-xl rounded-2xl p-10 shadow-2xl border border-green-100/50"
            style={{ willChange: "transform" }}
        >
            <div className="flex flex-col items-center gap-6">
                <div className="relative w-16 h-16">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="w-16 h-16 border-4 border-green-100 border-t-green-600 rounded-full"
                        style={{ willChange: "transform" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Leaf className="h-6 w-6 text-green-600" />
                    </div>
                </div>
                <p className="text-green-800 font-semibold text-lg tracking-wide">Procesando...</p>
            </div>
        </motion.div>
    </motion.div>
))

LoadingOverlay.displayName = "LoadingOverlay"

export default LoadingOverlay
