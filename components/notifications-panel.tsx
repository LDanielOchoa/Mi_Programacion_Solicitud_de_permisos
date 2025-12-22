'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, Filter, SortDesc, CheckCheck, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import NotificationItem from './NotificationItem'
import { useMediaQuery } from './use-media-query'

interface Notification {
  id: number
  uniqueId: string
  type: 'permiso' | 'equipo'
  status: 'pending' | 'approved' | 'rejected'
  date: string
  description: string
  reason?: string
  request: any
  isRead: boolean
  isHidden: boolean
  notifications: number
}

interface NotificationsPanelProps {
  onClose: () => void
  onMarkAllAsRead: () => void
}

export default function NotificationsPanel({ onClose, onMarkAllAsRead }: NotificationsPanelProps) {
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const notificationsPerPage = 5
  const isMobile = useMediaQuery('(max-width: 768px)')
  const panelRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      const code = localStorage.getItem('userCode')
      if (!code) {
        window.location.href = '/'
        return
      }
      const response = await fetch(`https://solicitud-permisos.sao6.com.co/api/requests/${code}`)
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }
      const data = await response.json()
      const transformedNotifications = data.map((req: any) => ({
        id: req.id,
        uniqueId: `${req.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: req.noveltyType ? 'permiso' : 'equipo',
        status: req.status || 'pending',
        date: req.createdAt,
        description: req.noveltyType
          ? `Solicitud de permiso: ${req.noveltyType}`
          : `Solicitud de equipo: ${req.type}`,
        reason: req.respuesta,
        request: req,
        isRead: false,
        isHidden: false,
        notifications: req.notifications
      }))
      setNotifications(transformedNotifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las notificaciones. Por favor, intente de nuevo más tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  const markAsRead = useCallback((notificationId: number) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    )
  }, [])

  const updateNotificationStatus = useCallback(async (notificationId: number, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 0 ? 1 : 2
      const response = await fetch(`https://solicitud-permisos.sao6.com.co/api/requests/${notificationId}/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_status: newStatus }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Error al actualizar el estado de la notificación')
      }
      await response.json()
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId
            ? {
              ...notif,
              notifications: newStatus,
              uniqueId: `${notif.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            }
            : notif
        )
      )
      toast({
        title: "Éxito",
        description: "El estado de la notificación se ha actualizado correctamente.",
      })
    } catch (error) {
      console.error('Error updating notification status:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error desconocido. Por favor, intente de nuevo.",
        variant: "destructive",
      })
      throw error
    }
  }, [])

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      setIsLoading(true)
      const notificationsToUpdate = notifications.filter(n => n.notifications === 0 && n.status !== 'pending')
      for (const notification of notificationsToUpdate) {
        await updateNotificationStatus(notification.id, 0)
      }
      toast({
        title: "Éxito",
        description: "Todas las notificaciones han sido marcadas como leídas.",
      })
      onMarkAllAsRead()
      await fetchNotifications()
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast({
        title: "Error",
        description: "No se pudieron marcar todas las notificaciones como leídas. Por favor, intente de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [notifications, updateNotificationStatus, onMarkAllAsRead, fetchNotifications])

  const filteredNotifications = notifications
    .filter(notification => {
      const validNotification = notification.notifications === 0 && (notification.status === 'approved' || notification.status === 'rejected')
      if (filter === 'pending') {
        return notification.status === 'pending'
      }
      if (filter === 'all') {
        return validNotification || notification.status === 'pending'
      }
      return notification.type === filter && (validNotification || notification.status === 'pending')
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime()
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

  const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage)
  const currentNotifications = filteredNotifications.slice(
    (currentPage - 1) * notificationsPerPage,
    currentPage * notificationsPerPage
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 md:inset-auto md:top-20 md:right-4 w-full md:w-[480px] bg-green-50 shadow-xl rounded-lg overflow-hidden border border-green-200 max-h-[100vh] md:max-h-[90vh] flex flex-col"
    >
      <CardHeader className="border-b border-green-200 px-6 py-4 bg-green-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-green-600" />
            <CardTitle className="text-green-800">Notificaciones</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-sm text-green-700 hover:text-green-900 hover:bg-green-200"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Marcar todo como leído
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="text-green-700 hover:text-green-900 hover:bg-green-200">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <div className="p-4 border-b border-green-200">
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-green-600" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full md:w-[150px] bg-white border-green-300 text-green-800">
                <SelectValue placeholder="Filtrar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="permiso">Permisos</SelectItem>
                <SelectItem value="equipo">Equipos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <SortDesc className="w-4 h-4 text-green-600" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[150px] bg-white border-green-300 text-green-800">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Más recientes</SelectItem>
                <SelectItem value="oldest">Más antiguas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-grow">
        <div className="p-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-green-600">
              <Loader2 className="w-12 h-12 mb-4 animate-spin" />
              <p className="text-sm">Cargando notificaciones...</p>
            </div>
          ) : currentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-green-600">
              <Bell className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">No hay notificaciones</p>
            </div>
          ) : (
            <AnimatePresence>
              {currentNotifications.map((notification) => (
                <NotificationItem
                  key={notification.uniqueId}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onUpdateStatus={updateNotificationStatus}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>

      {totalPages > 1 && (
        <div className="border-t border-green-200 p-4">
          <div className="flex justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              Anterior
            </Button>
            <div className="flex items-center space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={currentPage === page ? "bg-green-600 text-white" : "border-green-300 text-green-700 hover:bg-green-100"}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {isMobile && (
        <div className="border-t border-green-200 p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="w-full text-sm text-green-700 hover:text-green-900 hover:bg-green-200"
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Marcar todo como leído
          </Button>
        </div>
      )}
    </motion.div>
  )
}

