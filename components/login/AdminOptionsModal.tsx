import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Shield, X, Settings, Users, CheckCircle, ArrowRight, FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { modalVariants, modalContentVariants, itemVariants, optionCardVariants } from "./variants"

interface AdminOptionsModalProps {
    isOpen: boolean
    onClose: () => void
}

const AdminOptionsModal = React.memo(({ isOpen, onClose }: AdminOptionsModalProps) => {
    const router = useRouter()

    const handleAdminDashboard = () => {
        router.push("/dashboard-admin-requests")
    }

    const handleRequestPermission = () => {
        router.push("/dashboard")
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4"
                >
                    <motion.div
                        variants={modalContentVariants}
                        className="bg-white rounded-[2rem] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative border border-gray-100"
                    >
                        {/* Close button */}
                        <motion.button
                            onClick={onClose}
                            className="absolute top-6 right-6 w-10 h-10 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center transition-all duration-200 z-10 group"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <X className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                        </motion.button>

                        <div className="p-12">
                            {/* Header */}
                            <motion.div variants={itemVariants} className="text-center mb-12">
                                <motion.div
                                    initial={{ scale: 0, rotate: -10 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 20,
                                        delay: 0.1
                                    }}
                                    className="w-24 h-24 bg-gradient-to-br from-[#4cc253] via-[#3da342] to-[#2d7a31] rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-xl relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full" />
                                    <Shield className="h-12 w-12 text-white drop-shadow-sm" />
                                </motion.div>

                                <motion.h2
                                    className="text-4xl font-black text-gray-900 mb-4 tracking-tight"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    Panel de <span className="text-[#4cc253]">Admin</span>
                                </motion.h2>

                                <motion.p
                                    className="text-gray-500 text-xl font-medium"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    Bienvenido al centro de gestión operacional.
                                </motion.p>
                            </motion.div>

                            {/* Options */}
                            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <motion.div
                                    variants={optionCardVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                    className="cursor-pointer group"
                                    onClick={handleAdminDashboard}
                                >
                                    <Card className="h-full bg-white border-gray-100 shadow-md hover:shadow-xl transition-all duration-500 overflow-hidden relative rounded-3xl">
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#4cc253]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                        <CardContent className="p-8">
                                            <div className="flex flex-col gap-6">
                                                <motion.div
                                                    className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-[#4cc253] transition-colors duration-300"
                                                >
                                                    <Settings className="h-8 w-8 text-[#4cc253] group-hover:text-white transition-colors" />
                                                </motion.div>

                                                <div className="space-y-2">
                                                    <h3 className="font-black text-gray-900 text-xl tracking-tight uppercase">
                                                        Administración
                                                    </h3>
                                                    <p className="text-gray-400 text-sm leading-relaxed font-medium">
                                                        Gestión integral de usuarios, ról y configuración del sistema.
                                                    </p>
                                                </div>

                                                <div className="flex items-center text-[#4cc253] font-bold text-sm">
                                                    <span>ENTRAR</span>
                                                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                <motion.div
                                    variants={optionCardVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                    className="cursor-pointer group"
                                    onClick={handleRequestPermission}
                                >
                                    <Card className="h-full bg-white border-gray-100 shadow-md hover:shadow-xl transition-all duration-500 overflow-hidden relative rounded-3xl">
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#4cc253]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                        <CardContent className="p-8">
                                            <div className="flex flex-col gap-6">
                                                <motion.div
                                                    className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-[#4cc253] transition-colors duration-300"
                                                >
                                                    <FileText className="h-8 w-8 text-[#4cc253] group-hover:text-white transition-colors" />
                                                </motion.div>

                                                <div className="space-y-2">
                                                    <h3 className="font-black text-gray-900 text-xl tracking-tight uppercase">
                                                        Solicitudes
                                                    </h3>
                                                    <p className="text-gray-400 text-sm leading-relaxed font-medium">
                                                        Gestión y seguimiento de permisos y solicitudes operativas.
                                                    </p>
                                                </div>

                                                <div className="flex items-center text-[#4cc253] font-bold text-sm">
                                                    <span>ENTRAR</span>
                                                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </motion.div>

                            {/* Footer */}
                            <motion.div
                                variants={itemVariants}
                                className="mt-12 text-center"
                            >
                                <div className="h-px bg-gray-100 mb-6" />
                                <p className="text-gray-400 text-sm font-bold tracking-widest uppercase">
                                    SAO6 © 2025
                                </p>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
})

AdminOptionsModal.displayName = "AdminOptionsModal"

export default AdminOptionsModal
