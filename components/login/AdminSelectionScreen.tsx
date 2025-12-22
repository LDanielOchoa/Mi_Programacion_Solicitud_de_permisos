import React from "react"
import { useRouter } from "next/navigation"
import { Settings, ArrowRight, FileText, ChevronLeft, ShieldCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

interface AdminSelectionScreenProps {
    onClose: () => void
}

const AdminSelectionScreen = ({ onClose }: AdminSelectionScreenProps) => {
    const router = useRouter()

    const handleAdminDashboard = () => {
        router.push("/dashboard-admin-requests")
    }

    const handleRequestPermission = () => {
        router.push("/dashboard")
    }

    return (
        <div className="fixed inset-0 z-[60] h-screen w-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 lg:p-12 overflow-hidden">
            {/* Decorative background circle - recovered some visibility */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#4cc253]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-[#4cc253]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-5xl w-full z-10 relative">
                {/* Top bar - more balanced */}
                <div className="flex items-center justify-between mb-10">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 rounded-2xl transition-all shadow-sm group border border-gray-100"
                    >
                        <ChevronLeft className="h-5 w-5 text-gray-400 group-hover:text-[#4cc253]" />
                        <span className="text-gray-500 font-bold text-sm tracking-widest">VOLVER AL LOGIN</span>
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 relative">
                            <Image src="/sao6.png" alt="Logo SAO6" fill className="object-contain" />
                        </div>
                        <span className="text-gray-900 text-2xl font-black tracking-tighter">SAO6</span>
                    </div>
                </div>

                {/* Hero Header - more presence */}
                <div className="text-center space-y-4 mb-16">
                    <div className="w-20 h-20 bg-white rounded-[2rem] mx-auto flex items-center justify-center shadow-md border border-gray-50 mb-6">
                        <ShieldCheck className="h-10 w-10 text-[#4cc253]" />
                    </div>
                    <h2 className="text-4xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight">
                        Panel de <span className="text-[#4cc253]">Admin</span>
                    </h2>
                    <p className="text-gray-500 text-xl font-medium max-w-xl mx-auto leading-relaxed">
                        Bienvenido al centro de gestión operacional. Selecciona tu área de trabajo para continuar.
                    </p>
                </div>

                {/* Options Grid - Larger and more impact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    <div
                        className="cursor-pointer group"
                        onClick={handleAdminDashboard}
                    >
                        <Card className="bg-white border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all duration-300 overflow-hidden rounded-[3rem] border-b-8 border-b-gray-50 hover:border-b-[#4cc253] h-full">
                            <CardContent className="p-10 lg:p-14 flex flex-col h-full">
                                <div className="w-20 h-20 bg-gray-50 rounded-[1.5rem] flex items-center justify-center group-hover:bg-[#4cc253] transition-colors duration-300 mb-8 mx-auto md:mx-0 shadow-inner">
                                    <Settings className="h-10 w-10 text-[#4cc253] group-hover:text-white transition-colors" />
                                </div>
                                <div className="space-y-4 flex-1 text-center md:text-left">
                                    <h3 className="font-black text-gray-900 text-3xl uppercase tracking-tight">
                                        Administración
                                    </h3>
                                    <p className="text-gray-400 text-lg font-medium leading-relaxed">
                                        Control de usuarios, roles y gestión operacional del sistema.
                                    </p>
                                </div>
                                <div className="mt-10 pt-8 border-t border-gray-50 flex items-center justify-between text-[#4cc253] font-black uppercase tracking-widest text-sm">
                                    <span>ENTRAR AL PANEL</span>
                                    <div className="w-10 h-10 bg-[#4cc253]/10 rounded-full flex items-center justify-center group-hover:bg-[#4cc253] group-hover:text-white transition-all transform group-hover:translate-x-2">
                                        <ArrowRight className="h-5 w-5" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div
                        className="cursor-pointer group"
                        onClick={handleRequestPermission}
                    >
                        <Card className="bg-white border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all duration-300 overflow-hidden rounded-[3rem] border-b-8 border-b-gray-50 hover:border-b-[#4cc253] h-full">
                            <CardContent className="p-10 lg:p-14 flex flex-col h-full">
                                <div className="w-20 h-20 bg-gray-50 rounded-[1.5rem] flex items-center justify-center group-hover:bg-[#4cc253] transition-colors duration-300 mb-8 mx-auto md:mx-0 shadow-inner">
                                    <FileText className="h-10 w-10 text-[#4cc253] group-hover:text-white transition-colors" />
                                </div>
                                <div className="space-y-4 flex-1 text-center md:text-left">
                                    <h3 className="font-black text-gray-900 text-3xl uppercase tracking-tight">
                                        Solicitudes
                                    </h3>
                                    <p className="text-gray-400 text-lg font-medium leading-relaxed">
                                        Gestión y seguimiento de permisos personales y administrativos.
                                    </p>
                                </div>
                                <div className="mt-10 pt-8 border-t border-gray-50 flex items-center justify-between text-[#4cc253] font-black uppercase tracking-widest text-sm">
                                    <span>IR A GESTIONES</span>
                                    <div className="w-10 h-10 bg-[#4cc253]/10 rounded-full flex items-center justify-center group-hover:bg-[#4cc253] group-hover:text-white transition-all transform group-hover:translate-x-2">
                                        <ArrowRight className="h-5 w-5" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-16 text-center">
                    <p className="text-gray-300 text-xs font-bold tracking-widest uppercase">
                        Tecnología SAO6 © 2025
                    </p>
                </div>
            </div>
        </div>
    )
}

export default AdminSelectionScreen
