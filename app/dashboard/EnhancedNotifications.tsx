"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, CheckCircle, XCircle, Clock, X, CheckCheck, Calendar, AlertCircle, ChevronDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Notification {
  id: string
  status: "approved" | "rejected" | "pending"
  message: string
  type: string
  date: string
  isNew: boolean
  time?: string
}

export function EnhancedNotifications({
  hasNewNotification = true,
  userName = "Usuario",
  notifications = [],
  onClose = () => {},
}: {
  hasNewNotification?: boolean
  userName?: string
  notifications: Notification[]
  onClose?: () => void
}) {
  const [showNotification, setShowNotification] = useState(false)
  const [notificationsList, setNotificationsList] = useState<Notification[]>(notifications)
  const [activeFilter, setActiveFilter] = useState<"all" | "approved" | "rejected" | "pending">("all")
  const [expanded, setExpanded] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [isHovering, setIsHovering] = useState(false)

  // Add time to notifications if not present
  useEffect(() => {
    if (notifications.length > 0) {
      const updatedNotifications = notifications.map((notification) => ({
        ...notification,
        time: notification.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }))
      setNotificationsList(updatedNotifications)
    }
  }, [notifications])

  // Show notification and set auto-dismiss timer
  useEffect(() => {
    if (hasNewNotification) {
      setShowNotification(true)

      // Set timer to auto-dismiss after 10 seconds if not expanded or hovered
      if (!expanded && !isHovering) {
        timerRef.current = setTimeout(() => {
          setShowNotification(false)
          onClose()
        }, 10000)
      }

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
        }
      }
    }
  }, [hasNewNotification, expanded, isHovering, onClose])

  // Reset timer when expanded or hovering state changes
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    if (showNotification && !expanded && !isHovering) {
      timerRef.current = setTimeout(() => {
        setShowNotification(false)
        onClose()
      }, 10000)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [expanded, isHovering, showNotification, onClose])

  // Close notification when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node) && expanded) {
        setExpanded(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [expanded])

  const handleClose = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setShowNotification(false)
    onClose()
  }

  const handleNotificationClick = () => {
    // Clear the auto-dismiss timer when user interacts
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setExpanded(true)
  }

  const markAsRead = (id: string) => {
    setNotificationsList((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, isNew: false } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotificationsList((prev) => prev.map((notification) => ({ ...notification, isNew: false })))
  }

  const filteredNotifications = notificationsList.filter((notification) => {
    if (activeFilter === "all") return true
    return notification.status === activeFilter
  })

  const newNotificationsCount = notificationsList.filter((n) => n.isNew).length
  const latestNotification = notificationsList[0]

  if (!showNotification || !hasNewNotification || notificationsList.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        ref={notificationRef}
        initial={{ opacity: 0, y: -50, x: expanded ? "-50%" : "50%" }}
        animate={{
          opacity: 1,
          y: expanded ? 20 : 20,
          x: expanded ? "-50%" : "50%",
          transition: {
            type: "spring",
            stiffness: 300,
            damping: 30,
          },
        }}
        exit={{
          opacity: 0,
          y: -50,
          x: expanded ? "-50%" : "50%",
          transition: { duration: 0.2 },
        }}
        className={`fixed z-50 transform ${
          expanded ? "top-0 left-1/2 w-full max-w-md" : "top-0 right-0 w-auto max-w-xs"
        }`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <style jsx global>{`
          @keyframes progress {
            0% { width: 100%; }
            100% { width: 0%; }
          }
          .auto-dismiss-progress {
            animation: progress 10s linear forwards;
          }
          
          .notification-card {
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
          }
          
          .notification-card:hover {
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          }
          
          .scrollbar-thin::-webkit-scrollbar {
            width: 6px;
          }
          
          .scrollbar-thin::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background: #22c55e;
            border-radius: 10px;
          }
          
          .scrollbar-thin::-webkit-scrollbar-thumb:hover {
            background: #15803d;
          }
          
          @keyframes pulse-dot {
            0% { transform: scale(0.8); opacity: 0.6; }
            50% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(0.8); opacity: 0.6; }
          }
          
          .pulse-animation {
            animation: pulse-dot 2s infinite;
          }
        `}</style>

        <Card
          className={`mx-auto overflow-hidden border-green-200 notification-card ${expanded ? "w-full" : "w-auto"}`}
        >
          {!expanded ? (
            // Compact notification view
            <motion.div
              className="cursor-pointer"
              onClick={handleNotificationClick}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 relative overflow-hidden">
                  {/* Decorative circles */}
                  <motion.div
                    className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-white/10"
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 3,
                      ease: "easeInOut",
                    }}
                  />

                  <div className="flex items-center gap-3 relative z-10">
                    <motion.div
                      className="relative"
                      animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                      transition={{
                        duration: 1,
                        delay: 1,
                        repeat: 1,
                        repeatType: "reverse",
                      }}
                    >
                      <Bell className="h-5 w-5 text-white" />
                      {newNotificationsCount > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 15,
                          }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center pulse-animation"
                        >
                          {newNotificationsCount}
                        </motion.div>
                      )}
                    </motion.div>

                    <div className="flex-1">
                      <motion.p
                        className="text-sm font-medium text-white truncate"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        {latestNotification.message}
                      </motion.p>
                      <motion.p
                        className="text-xs text-white/80"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        {userName} • {latestNotification.time}
                      </motion.p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleClose()
                      }}
                      className="text-white hover:bg-white/20 h-6 w-6"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Auto-dismiss progress bar */}
                  {!isHovering && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div className="h-full bg-white/60 auto-dismiss-progress"></div>
                    </div>
                  )}
                </div>
              </CardContent>
            </motion.div>
          ) : (
            // Expanded notification view
            <CardContent className="p-0">
              {/* Header with gradient and notification icon */}
              <motion.div
                className="bg-gradient-to-r from-green-500 to-green-600 p-4 relative overflow-hidden"
                whileHover={{ scale: 1.01 }}
              >
                {/* Decorative elements */}
                <motion.div
                  className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.7, 0.5],
                  }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 3,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute top-10 -left-6 w-16 h-16 rounded-full bg-white/10"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 4,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                />

                <div className="flex items-center justify-between mb-4 relative z-10">
                  <motion.div
                    className="flex items-center space-x-2 text-white"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <motion.div
                      className="relative"
                      whileHover={{ rotate: [0, -10, 10, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <Bell className="h-6 w-6" />
                      {newNotificationsCount > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 15,
                          }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center pulse-animation"
                        >
                          {newNotificationsCount}
                        </motion.div>
                      )}
                    </motion.div>
                    <h3 className="text-lg font-semibold">¡Nuevas Actualizaciones!</h3>
                  </motion.div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-white hover:bg-white/20 text-xs"
                    >
                      <CheckCheck className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Marcar todo como leído</span>
                      <span className="sm:hidden">Leído</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleClose} className="text-white hover:bg-white/20">
                      <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
                        <X className="h-5 w-5" />
                      </motion.div>
                    </Button>
                  </div>
                </div>

                <motion.div
                  className="flex items-center gap-2 text-white/90 text-sm mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white font-medium">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <p>
                    Hola <span className="font-semibold">{userName}</span>, tienes actualizaciones en tus solicitudes:
                  </p>
                </motion.div>

                {/* Collapse button */}
                <motion.button
                  onClick={() => setExpanded(false)}
                  className="flex items-center justify-center w-full mt-2 text-white/80 text-xs hover:text-white"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <span>Mostrar menos</span>
                  <motion.div animate={{ rotate: 270 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </motion.div>
                </motion.button>
              </motion.div>

              {/* Notification content */}
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-green-900 overflow-hidden"
              >
                {/* Filters */}
                <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setActiveFilter(value as any)}>
                  <div className="px-4 pt-3">
                    <TabsList className="w-full bg-green-50 dark:bg-green-800/30">
                      <TabsTrigger
                        value="all"
                        className="flex-1 data-[state=active]:bg-green-100 data-[state=active]:text-green-800 transition-all duration-200"
                      >
                        Todas
                      </TabsTrigger>
                      <TabsTrigger
                        value="approved"
                        className="flex-1 data-[state=active]:bg-green-100 data-[state=active]:text-green-800 transition-all duration-200"
                      >
                        Aprobadas
                      </TabsTrigger>
                      <TabsTrigger
                        value="rejected"
                        className="flex-1 data-[state=active]:bg-green-100 data-[state=active]:text-green-800 transition-all duration-200"
                      >
                        Rechazadas
                      </TabsTrigger>
                      <TabsTrigger
                        value="pending"
                        className="flex-1 data-[state=active]:bg-green-100 data-[state=active]:text-green-800 transition-all duration-200"
                      >
                        Pendientes
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value={activeFilter} className="mt-0">
                    <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto scrollbar-thin">
                      {filteredNotifications.length > 0 ? (
                        filteredNotifications.map((notification, index) => (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: index * 0.05,
                              type: "spring",
                              stiffness: 300,
                              damping: 20,
                            }}
                            whileHover={{
                              scale: 1.01,
                              transition: { duration: 0.2 },
                            }}
                            className={`relative flex items-start gap-3 p-3 rounded-lg border-l-4 ${
                              notification.isNew ? "bg-green-50/80 dark:bg-green-800/30" : "bg-white dark:bg-green-900"
                            } ${
                              notification.status === "approved"
                                ? "border-l-green-500"
                                : notification.status === "rejected"
                                  ? "border-l-red-500"
                                  : "border-l-yellow-500"
                            } hover:bg-green-50 dark:hover:bg-green-800/50 transition-colors duration-200`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            {notification.isNew && (
                              <motion.div
                                className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500"
                                animate={{
                                  scale: [1, 1.5, 1],
                                  opacity: [0.7, 1, 0.7],
                                }}
                                transition={{
                                  repeat: Number.POSITIVE_INFINITY,
                                  duration: 2,
                                }}
                              />
                            )}

                            <div
                              className={`flex-shrink-0 rounded-full p-2 ${
                                notification.status === "approved"
                                  ? "bg-green-100 text-green-600 dark:bg-green-800/50 dark:text-green-400"
                                  : notification.status === "rejected"
                                    ? "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"
                                    : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400"
                              }`}
                            >
                              {notification.status === "approved" ? (
                                <CheckCircle className="h-5 w-5" />
                              ) : notification.status === "rejected" ? (
                                <XCircle className="h-5 w-5" />
                              ) : (
                                <Clock className="h-5 w-5" />
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p
                                  className={`text-sm font-medium ${
                                    notification.status === "approved"
                                      ? "text-green-800 dark:text-green-200"
                                      : notification.status === "rejected"
                                        ? "text-red-800 dark:text-red-200"
                                        : "text-yellow-800 dark:text-yellow-200"
                                  }`}
                                >
                                  {notification.message}
                                </p>
                                <Badge
                                  variant="outline"
                                  className="ml-auto text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                                >
                                  {notification.type}
                                </Badge>
                              </div>

                              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1 gap-3">
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {notification.date}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {notification.time}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400"
                        >
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                              delay: 0.3,
                              type: "spring",
                              stiffness: 300,
                              damping: 20,
                            }}
                          >
                            <AlertCircle className="h-12 w-12 text-green-300 mb-2" />
                          </motion.div>
                          <p className="text-center">
                            No hay notificaciones {activeFilter !== "all" ? `${activeFilter}s` : ""}
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                <motion.div
                  className="p-4 bg-green-50 dark:bg-green-800/20 border-t border-green-100 dark:border-green-800"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Button
                      onClick={() => {
                        handleClose()
                        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
                      }}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      Ver Historial Completo
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
