"use client"

import { motion } from "framer-motion"
import { Tag, Phone, Edit } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface UserInfoCardProps {
  code: string
  name?: string
  phone?: string
  onPhoneEdit?: () => void
}

export default function UserInfoCard({ code, name, phone, onPhoneEdit }: UserInfoCardProps) {
  // Get user initials for avatar
  const getUserInitials = (name: string | undefined) => {
    if (!name || name.trim() === '') {
      return 'N/A'
    }
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <motion.div
      className="bg-white/80 backdrop-blur-sm rounded-xl border border-green-100 shadow-md overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="h-2 bg-gradient-to-r from-green-400 to-green-600"></div>

      <div className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-green-100">
            <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-green-600 text-white text-xl">
              {getUserInitials(name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-emerald-800">{name || 'Usuario'}</h3>

            <div className="mt-1 flex flex-col gap-1">
              <div className="flex items-center text-sm text-emerald-700">
                <Tag className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                <span className="font-medium">Código:</span>
                <span className="ml-1.5">{code}</span>
              </div>

              {phone !== undefined && (
                <div
                  className={`flex items-center text-sm text-emerald-700 ${onPhoneEdit ? "group cursor-pointer" : ""}`}
                  onClick={onPhoneEdit}
                >
                  <Phone className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                  <span className="font-medium">Teléfono:</span>
                  <span className="ml-1.5">{phone || "No registrado"}</span>
                  {onPhoneEdit && (
                    <Edit className="h-3.5 w-3.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
