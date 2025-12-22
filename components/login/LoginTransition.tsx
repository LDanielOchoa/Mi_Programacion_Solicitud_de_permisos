import React from "react"
import { motion } from "framer-motion"
import Image from "next/image"

interface LoginTransitionProps {
    isVisible: boolean
}

const LoginTransition = ({ isVisible }: LoginTransitionProps) => {
    if (!isVisible) return null

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-white flex flex-col items-center justify-center overflow-hidden"
        >
            <div className="flex flex-col items-center gap-8 max-w-xs w-full">

                {/* Simple Pulsing Logo */}
                <motion.div
                    animate={{
                        scale: [1, 1.05, 1],
                        opacity: [0.9, 1, 0.9]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="relative w-20 h-20"
                >
                    <Image
                        src="/sao6.png"
                        alt="SAO6 Logo"
                        fill
                        className="object-contain"
                        priority
                    />
                </motion.div>

                {/* Simple Loading Text */}
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">
                        Validando solicitud
                    </h2>
                    <div className="flex items-center justify-center gap-1">
                        <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                            className="w-1.5 h-1.5 bg-[#4cc253] rounded-full"
                        />
                        <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                            className="w-1.5 h-1.5 bg-[#4cc253] rounded-full"
                        />
                        <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                            className="w-1.5 h-1.5 bg-[#4cc253] rounded-full"
                        />
                    </div>
                </div>

                {/* Very Minimal Progress Bar */}
                <div className="w-48 h-1 bg-gray-50 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="h-full w-full bg-[#4cc253]"
                    />
                </div>
            </div>
        </motion.div>
    )
}

export default LoginTransition
