'use client'

import { motion } from 'framer-motion';
import Link from 'next/link';
import { TypeIcon as type, LucideIcon } from 'lucide-react';

interface AnimatedDashboardButtonProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}

const AnimatedDashboardButton: React.FC<AnimatedDashboardButtonProps> = ({
  href,
  icon: Icon,
  title,
  description,
  color,
}) => {
  return (
    <Link href={href} className="block w-full h-full">
      <motion.div
        className={`${color} rounded-2xl shadow-lg overflow-hidden cursor-pointer`}
        whileHover={{ scale: 1.03, boxShadow: "0 10px 20px rgba(0,0,0,0.2)" }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
      >
        <div className="p-8 flex flex-col items-center text-white h-full">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <Icon size={64} />
          </motion.div>
          <motion.h2
            className="text-2xl font-bold mt-6 mb-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {title}
          </motion.h2>
          <motion.p
            className="text-center opacity-90 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {description}
          </motion.p>
        </div>
      </motion.div>
    </Link>
  );
};

export default AnimatedDashboardButton;

