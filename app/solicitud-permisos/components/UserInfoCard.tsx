"use client"

import React from "react"
import { motion } from "framer-motion"
import { User, Shield, Phone } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { UserInfoCardProps } from "../types"
import { getInitials } from "../utils"

/**
 * Tarjeta de información del usuario con diseño premium
 */
export const UserInfoCard: React.FC<UserInfoCardProps> = ({ code, name, phone, onPhoneEdit }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_2px_15px_rgba(0,0,0,0.02)] relative overflow-hidden"
        >
            <div className="flex items-center relative z-10">
                <Avatar className="h-20 w-20 border-2 border-gray-50 shadow-sm mr-6">
                    <AvatarFallback className="bg-[#4cc253] text-white text-xl font-black">
                        {getInitials(name)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                    <div className="flex items-center">
                        <User className="h-4 w-4 text-[#4cc253] mr-2" />
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">{name || "Usuario"}</h3>
                    </div>
                    <div className="flex items-center">
                        <Shield className="h-4 w-4 text-gray-400 mr-2" />
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">ID: {code || "000"}</p>
                    </div>
                    <div className="flex items-center group cursor-pointer" onClick={onPhoneEdit}>
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        <p className="text-sm font-medium text-gray-600 group-hover:text-[#4cc253] transition-colors">
                            {phone || "Sin teléfono registrado"}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
