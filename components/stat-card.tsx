"use client"

import React from "react"
import { motion } from "framer-motion"
import { TrendingUp } from "lucide-react"

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  trend?: number
  color?: "emerald" | "green" | "teal" | "lime" | "amber" | "red"
  description?: string
  onClick?: () => void
}

const StatCard = React.memo(({ title, value, icon, trend, color = "emerald", description, onClick }: StatCardProps) => {
  const colorClasses = {
    emerald: "from-emerald-500/90 to-emerald-600/90 shadow-emerald-500/20 border-emerald-200/50",
    green: "from-green-500/90 to-green-600/90 shadow-green-500/20 border-green-200/50",
    teal: "from-teal-500/90 to-teal-600/90 shadow-teal-500/20 border-teal-200/50",
    lime: "from-lime-500/90 to-lime-600/90 shadow-lime-500/20 border-lime-200/50",
    amber: "from-amber-500/90 to-amber-600/90 shadow-amber-500/20 border-amber-200/50",
    red: "from-red-500/90 to-red-600/90 shadow-red-500/20 border-red-200/50",
  }

  return (
    <motion.div
      className={`
        relative overflow-hidden rounded-3xl bg-gradient-to-br ${colorClasses[color]}
        backdrop-blur-xl border p-6 text-white shadow-2xl transition-all duration-500 
        hover:scale-105 hover:shadow-3xl group cursor-pointer
      `}
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -5 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10"></div>
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
      <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-white/5 rounded-full blur-xl"></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-white/80 uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-black tracking-tight">{value.toLocaleString()}</p>
            {description && <p className="text-xs text-white/70 font-medium">{description}</p>}
          </div>
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300">
            {icon}
          </div>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </motion.div>
  )
})

StatCard.displayName = "StatCard"

export default StatCard

// Enhanced Detailed Stat Card
interface DetailedStatCardProps {
  title: string
  stats: { [key: string]: number }
  icon: React.ReactNode
  color?: string
}

export const DetailedStatCard = React.memo(({ title, stats, icon, color = "emerald" }: DetailedStatCardProps) => (
  <motion.div
    className="rounded-3xl bg-white/90 backdrop-blur-xl p-6 shadow-2xl border border-gray-200/50 hover:shadow-3xl transition-all duration-500"
    whileHover={{ scale: 1.02, y: -5 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
  >
    <div className="flex items-center space-x-3 mb-6">
      <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-lg">{icon}</div>
      <div>
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600">Análisis detallado</p>
      </div>
    </div>

    <div className="space-y-4">
      {Object.entries(stats).map(([key, value], index) => (
        <motion.div
          key={key}
          className="flex justify-between items-center group p-2 rounded-xl hover:bg-emerald-50/50 transition-colors"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-800 transition-colors">
            {key}
          </span>
          <div className="flex items-center space-x-2">
            <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((value / Math.max(...Object.values(stats))) * 100, 100)}%` }}
              ></div>
            </div>
            <span className="font-bold text-gray-800 min-w-[1.5rem] text-right text-sm">{value}</span>
            <div
              className={`w-2 h-2 rounded-full ${
                value > 0 ? "bg-emerald-400 shadow-lg shadow-emerald-200" : "bg-gray-300"
              } transition-colors`}
            ></div>
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
))

DetailedStatCard.displayName = "DetailedStatCard"
