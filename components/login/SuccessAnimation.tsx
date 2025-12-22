import React from "react"
import { motion, AnimatePresence } from "framer-motion"

interface SuccessAnimationProps {
    isVisible: boolean
}

const SuccessAnimation = ({ isVisible }: SuccessAnimationProps) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-green-950/30 backdrop-blur-md flex items-center justify-center z-50"
                    style={{ willChange: "opacity" }}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="bg-white rounded-3xl p-12 shadow-2xl border border-green-100/50"
                        style={{ willChange: "transform" }}
                    >
                        <motion.div className="w-24 h-24 relative mx-auto">
                            <svg
                                className="w-24 h-24 text-green-600"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <motion.path
                                    d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.8, ease: "easeInOut" }}
                                />
                                <motion.polyline
                                    points="22 4 12 14.01 9 11.01"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.6, ease: "easeInOut", delay: 0.8 }}
                                />
                            </svg>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default SuccessAnimation
