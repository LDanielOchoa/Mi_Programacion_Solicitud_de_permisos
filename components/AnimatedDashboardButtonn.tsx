import { motion } from 'framer-motion'
import Link from 'next/link'
import { type LucideIcon } from 'lucide-react'

interface AnimatedDashboardButtonProps {
  href: string
  icon: LucideIcon
  title: string
  description: string
  color: string
  children?: React.ReactNode
}

export default function AnimatedDashboardButton({
  href,
  icon: Icon,
  title,
  description,
  color,
  children
}: AnimatedDashboardButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative"
    >
      <Link
        href={href}
        className={`block p-6 ${color} rounded-lg shadow-lg text-white`}
      >
        <Icon className="w-12 h-12 mb-4" />
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p>{description}</p>
      </Link>
      {children}
    </motion.div>
  )
}

