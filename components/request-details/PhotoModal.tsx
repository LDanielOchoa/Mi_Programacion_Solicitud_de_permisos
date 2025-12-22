"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PhotoModalProps {
    photoUrl: string
    employeeName: string
    onClose: () => void
}

/**
 * Modal para visualizar fotos de empleados a pantalla completa
 */
export const PhotoModal = React.memo<PhotoModalProps>(
    ({ photoUrl, employeeName, onClose }) => {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[10000] p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative max-w-4xl max-h-[90vh] mx-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={photoUrl || "/placeholder.svg"}
                            alt={`Foto de ${employeeName}`}
                            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/70 rounded-full p-2"
                        >
                            <X className="h-6 w-6" />
                        </Button>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        )
    }
)

PhotoModal.displayName = "PhotoModal"
