import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, User, FileText, Users, Clock } from 'lucide-react'
import Link from 'next/link'

interface MobileMenuProps {
  pathname: string
  unreadCount: number
  setShowNotifications: (show: boolean) => void
  userData: { code: string; name: string; phone: string; userType?: 'registered' | 'se_maintenance' } | null
  onClose: () => void
}

export default function MobileMenu({ pathname, unreadCount, setShowNotifications, userData, onClose }: MobileMenuProps) {
  const [activeCard, setActiveCard] = useState<string | null>(null)

  const allMenuItems = [
    { href: '/solicitud-permisos', label: 'Solicitud de Permisos', icon: FileText },
    { href: '/solicitudes-global', label: 'Historial', icon: Clock },
  ]

  // Filter menu items based on user type
  const menuItems = allMenuItems.filter(item => {
    if ((item as any).hideForMaintenance && userData?.userType === 'se_maintenance') {
      return false
    }
    return true
  })

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => (
    <Link href={href} passHref>
      <motion.div
        className={`w-full p-4 rounded-lg shadow-md transition-colors ${
          pathname === href ? 'bg-green-100 border-2 border-green-500' : 'bg-white hover:bg-green-50'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setActiveCard(href)
          setTimeout(onClose, 300)
        }}
      >
        <div className="flex items-center space-x-4">
          <Icon size={24} className="text-green-600" />
          <span className="text-lg font-medium text-green-800">{label}</span>
        </div>
      </motion.div>
    </Link>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col space-y-4 p-6 bg-gray-100 rounded-lg shadow-lg"
    >
      <h2 className="text-2xl font-bold text-green-800 mb-4">Menu</h2>
      <AnimatePresence>
        {menuItems.map((item) => (
          <motion.div
            key={item.href}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <NavLink {...item} />
          </motion.div>
        ))}
      </AnimatePresence>
      <motion.div
        className="w-full p-4 bg-white rounded-lg shadow-md hover:bg-green-50 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setShowNotifications(true)
          onClose()
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Bell size={24} className="text-green-600" />
            <span className="text-lg font-medium text-green-800">Notificaciones</span>
          </div>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
      </motion.div>
      {userData && (
        <motion.div
          className="w-full p-4 bg-white rounded-lg shadow-md hover:bg-green-50 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
        >
          <div className="flex items-center space-x-4">
            <User size={24} className="text-green-600" />
            <span className="text-lg font-medium text-green-800">Perfil</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

