"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, User, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface User {
  code: string
  name: string
}

interface UserSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (user: User) => void
  users: User[]
  currentUser: User
  title: string
}

export function UserSelectDialog({ open, onOpenChange, onSelect, users, currentUser, title }: UserSelectDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Búsqueda optimizada con useMemo para máxima velocidad
  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) return users

    return users.filter(
      (user) =>
        user.code.toLowerCase().includes(term) ||
        user.name.toLowerCase().includes(term)
    )
  }, [searchTerm, users])

  const handleSelect = (user: User) => {
    onSelect(user)
    onOpenChange(false)
    // Limpiar búsqueda al seleccionar para la próxima vez
    setTimeout(() => setSearchTerm(""), 300)
  }

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-[24px] bg-white">
        <div className="p-6 pb-4">
          <DialogHeader className="mb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-black text-gray-900 uppercase tracking-tight">
                {title}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 text-gray-400 hover:bg-gray-100"
                onClick={() => onOpenChange(false)}
              >
                <X size={18} />
              </Button>
            </div>
          </DialogHeader>

          {/* Buscador Minimalista y Rápido */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 transition-colors group-focus-within:text-[#4cc253]" />
            <Input
              placeholder="Buscar colaborador..."
              className="pl-10 h-12 bg-gray-50 border-none focus-visible:ring-2 focus-visible:ring-[#4cc253]/20 rounded-xl font-bold text-gray-800 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 text-gray-400"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Lista de Resultados */}
        <div className="max-h-[400px] overflow-y-auto px-2 pb-6 space-y-1 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <motion.div
                  key={user.code}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <button
                    className={cn(
                      "w-full flex items-center gap-4 p-3 rounded-xl transition-all text-left group",
                      user.code === currentUser.code
                        ? "bg-green-50 border border-green-200 hover:bg-green-100"
                        : "hover:bg-[#4cc253]/5 active:scale-[0.98]"
                    )}
                    onClick={() => handleSelect(user)}
                  >
                    <Avatar className="h-10 w-10 border border-gray-100 shadow-sm flex-shrink-0">
                      <AvatarFallback className="bg-white text-[#4cc253] font-black text-xs border border-[#4cc253]/10">
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-bold text-gray-900 truncate uppercase leading-tight">
                        {user.name}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                        ID: <span className="text-gray-600">{user.code}</span>
                      </p>
                    </div>

                    {user.code === currentUser.code ? (
                      <span className="text-[10px] font-black text-green-600 uppercase tracking-widest px-2 bg-green-100 rounded-full py-0.5">Yo</span>
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Check size={16} className="text-[#4cc253]" />
                      </div>
                    )}
                  </button>
                </motion.div>
              ))
            ) : (
              <div className="py-10 text-center opacity-40">
                <User size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-xs font-bold uppercase tracking-widest">Sin resultados</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}
