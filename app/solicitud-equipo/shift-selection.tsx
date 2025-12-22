"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Calendar, ChevronRight, Search, Sunrise, Sunset, User, X } from "lucide-react"

interface UserInterface {
  code: string
  name: string
  initials: string
  avatar?: string
}

interface ShiftSelectionProps {
  selectedAMUser: UserInterface | null
  selectedPMUser: UserInterface | null
  onAMUserSelect: (user: UserInterface | null) => void
  onPMUserSelect: (user: UserInterface | null) => void
  usersList: UserInterface[] // Add this prop
}

export function ShiftSelection({
  selectedAMUser,
  selectedPMUser,
  onAMUserSelect,
  onPMUserSelect,
  usersList, // Add this prop
}: ShiftSelectionProps) {
  const [isAMDialogOpen, setIsAMDialogOpen] = useState(false)
  const [isPMDialogOpen, setIsPMDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
        <Calendar className="h-5 w-5 mr-2 text-green-600" />
        Selección de Turnos
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Turno AM Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-2xl shadow-lg border border-green-100 group"
        >
          {/* Background Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -mt-10 -mr-10 opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-green-100 rounded-full -mb-10 -ml-10 opacity-30"></div>

          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-400 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white/20 p-1.5 rounded-lg mr-2">
                <Sunrise className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-medium text-white">Turno AM (Mañana)</h3>
            </div>
            <div className="bg-green-300/30 text-white text-xs font-medium px-2 py-1 rounded-full">Matutino</div>
          </div>

          {/* Content */}
          <div className="p-5 bg-gradient-to-br from-white to-green-50">
            {selectedAMUser ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar className="h-12 w-12 mr-3 border-2 border-green-200 shadow-sm">
                    {selectedAMUser.avatar ? (
                      <AvatarImage src={selectedAMUser.avatar || "/placeholder.svg"} alt={selectedAMUser.name} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                        {selectedAMUser.initials}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-800">{selectedAMUser.name}</p>
                    <p className="text-xs text-gray-500 flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      Código: {selectedAMUser.code}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onAMUserSelect(null)}
                    className="p-1.5 rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsAMDialogOpen(true)}
                    className="p-1.5 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsAMDialogOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-dashed border-green-300 bg-white hover:bg-green-50 transition-colors group"
              >
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 rounded-lg mr-3 group-hover:bg-green-200 transition-colors">
                    <User className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-gray-600">Seleccionar operador AM</span>
                </div>
                <ChevronRight className="h-5 w-5 text-green-400 group-hover:text-green-500 transition-colors" />
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Turno PM Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl shadow-lg border border-green-100 group"
        >
          {/* Background Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -mt-10 -mr-10 opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-green-100 rounded-full -mb-10 -ml-10 opacity-30"></div>

          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-500 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white/20 p-1.5 rounded-lg mr-2">
                <Sunset className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-medium text-white">Turno PM (Tarde)</h3>
            </div>
            <div className="bg-green-300/30 text-white text-xs font-medium px-2 py-1 rounded-full">Vespertino</div>
          </div>

          {/* Content */}
          <div className="p-5 bg-gradient-to-br from-white to-green-50">
            {selectedPMUser ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar className="h-12 w-12 mr-3 border-2 border-green-200 shadow-sm">
                    {selectedPMUser.avatar ? (
                      <AvatarImage src={selectedPMUser.avatar || "/placeholder.svg"} alt={selectedPMUser.name} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                        {selectedPMUser.initials}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-800">{selectedPMUser.name}</p>
                    <p className="text-xs text-gray-500 flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      Código: {selectedPMUser.code}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onPMUserSelect(null)}
                    className="p-1.5 rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsPMDialogOpen(true)}
                    className="p-1.5 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsPMDialogOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-dashed border-green-300 bg-white hover:bg-green-50 transition-colors group"
              >
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 rounded-lg mr-3 group-hover:bg-green-200 transition-colors">
                    <User className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-gray-600">Seleccionar operador PM</span>
                </div>
                <ChevronRight className="h-5 w-5 text-green-400 group-hover:text-green-500 transition-colors" />
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>

      {/* AM User Selection Dialog */}
      <UserSelectionDialog
        open={isAMDialogOpen}
        onOpenChange={setIsAMDialogOpen}
        onSelect={onAMUserSelect}
        title="Seleccionar Usuario AM"
        description="Elija un operador para el turno de mañana"
        color="green"
        icon={<Sunrise className="h-5 w-5" />}
        users={usersList} // Pass the users list
      />

      {/* PM User Selection Dialog */}
      <UserSelectionDialog
        open={isPMDialogOpen}
        onOpenChange={setIsPMDialogOpen}
        onSelect={onPMUserSelect}
        title="Seleccionar Usuario PM"
        description="Elija un operador para el turno de tarde"
        color="green"
        icon={<Sunset className="h-5 w-5" />}
        users={usersList} // Pass the users list
      />
    </div>
  )
}

interface UserSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (user: UserInterface) => void
  title: string
  description: string
  color: "green"
  icon: React.ReactNode
  users: UserInterface[] // Add this prop
}

function UserSelectionDialog({
  open,
  onOpenChange,
  onSelect,
  title,
  description,
  color,
  icon,
  users, // Add this prop
}: UserSelectionDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Use the provided users list instead of mock data
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.code.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const colorClasses = {
    green: {
      header: "from-green-500 to-green-400",
      searchBg: "bg-green-50",
      searchBorder: "border-green-200 focus:border-green-400 focus:ring-green-400",
      searchIcon: "text-green-400",
      userHover: "hover:bg-green-50",
      userSelected: "bg-green-100 border-green-300",
      userAvatar: "from-green-500 to-green-600",
      scrollThumb: "bg-green-300",
    },
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 rounded-2xl overflow-hidden border-0 shadow-2xl">
        {/* Header */}
        <div className={`bg-gradient-to-r ${colorClasses[color].header} p-6`}>
          <div className="flex items-center mb-1">
            <div className="bg-white/20 p-1.5 rounded-lg mr-2">{icon}</div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
          </div>
          <p className="text-white/80 text-sm">{description}</p>
        </div>

        {/* Search */}
        <div className="p-6 pb-3">
          <div className={`relative ${colorClasses[color].searchBg} rounded-xl overflow-hidden`}>
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${colorClasses[color].searchIcon}`}
            />
            <Input
              placeholder="Buscar por nombre o código..."
              className={`border ${colorClasses[color].searchBorder} pl-10 py-6 text-base rounded-xl focus-visible:ring-1`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* User List */}
        <div className="px-6 pb-6 max-h-[350px] overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <AnimatePresence>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <motion.div
                    key={user.code}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      // Add initials to the user object if not present
                      const userWithInitials = {
                        ...user,
                        initials: user.initials || getInitials(user.name),
                      }
                      onSelect(userWithInitials)
                      onOpenChange(false)
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border border-gray-200 ${colorClasses[color].userHover} cursor-pointer transition-all duration-200`}
                  >
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback className={`bg-gradient-to-br ${colorClasses[color].userAvatar} text-white`}>
                          {user.initials || getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-500">Código: {user.code}</p>
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded-full flex items-center justify-center bg-white/80 shadow-sm">
                      <ChevronRight className={`h-4 w-4 ${colorClasses[color].searchIcon}`} />
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-10 text-gray-500"
                >
                  <Search className="h-12 w-12 mb-3 opacity-20" />
                  <p className="font-medium">No se encontraron usuarios</p>
                  <p className="text-sm">Intente con otro término de búsqueda</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Helper function to get initials from name
function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}
