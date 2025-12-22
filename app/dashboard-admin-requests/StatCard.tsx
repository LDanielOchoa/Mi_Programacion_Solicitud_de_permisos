import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Activity, Award } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  color?: 'emerald' | 'blue' | 'purple' | 'orange' | 'red';
  icon?: 'users' | 'trending' | 'activity' | 'award';
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  index?: number;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  color = 'emerald',
  icon = 'users',
  subtitle,
  trend,
  index = 0
}) => {
  const colorClasses = {
    emerald: {
      gradient: 'from-emerald-500 to-green-600',
      bg: 'bg-emerald-50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      trendPositive: 'text-emerald-600',
      trendNegative: 'text-red-500',
      shadow: 'shadow-emerald-100'
    },
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      trendPositive: 'text-blue-600',
      trendNegative: 'text-red-500',
      shadow: 'shadow-blue-100'
    },
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      trendPositive: 'text-purple-600',
      trendNegative: 'text-red-500',
      shadow: 'shadow-purple-100'
    },
    orange: {
      gradient: 'from-orange-500 to-orange-600',
      bg: 'bg-orange-50',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      trendPositive: 'text-orange-600',
      trendNegative: 'text-red-500',
      shadow: 'shadow-orange-100'
    },
    red: {
      gradient: 'from-red-500 to-red-600',
      bg: 'bg-red-50',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      trendPositive: 'text-red-600',
      trendNegative: 'text-red-500',
      shadow: 'shadow-red-100'
    }
  };

  const icons = {
    users: Users,
    trending: TrendingUp,
    activity: Activity,
    award: Award
  };

  const IconComponent = icons[icon];
  const colors = colorClasses[color];

  const formatValue = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        type: "spring",
        stiffness: 120,
        damping: 20
      }}
      whileHover={{ 
        scale: 1.03, 
        y: -8,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      className="group cursor-pointer"
    >
      <div className={`relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg border-2 border-gray-100 hover:border-${color}-200 ${colors.shadow} hover:shadow-xl overflow-hidden transition-all duration-300`}>
        {/* Background gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
          <div className={`w-full h-full bg-gradient-to-br ${colors.gradient} rounded-full blur-2xl transform translate-x-16 -translate-y-16`} />
        </div>
        
        <div className="relative p-6">
          {/* Header with icon */}
          <div className="flex items-center justify-between mb-6">
            <motion.div 
              className={`p-3 ${colors.iconBg} rounded-2xl shadow-sm`}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.2 }}
            >
              <IconComponent className={`h-6 w-6 ${colors.iconColor}`} />
            </motion.div>
            
            {trend && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${
                  trend.isPositive 
                    ? `${colors.trendPositive} bg-${color}-50` 
                    : `${colors.trendNegative} bg-red-50`
                }`}
              >
                <TrendingUp className={`h-3 w-3 ${trend.isPositive ? '' : 'rotate-180'}`} />
                <span>{Math.abs(trend.value)}%</span>
              </motion.div>
            )}
          </div>

          {/* Title */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>

          {/* Value */}
          <motion.div 
            className="mb-2"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {formatValue(value)}
            </div>
          </motion.div>

          {/* Bottom accent line */}
          <motion.div 
            className={`h-1 bg-gradient-to-r ${colors.gradient} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: 0.4, duration: 0.6 }}
          />
        </div>

        {/* Hover effect overlay */}
        <motion.div 
          className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none`}
          initial={false}
        />
      </div>
    </motion.div>
  );
};

export default StatCard;