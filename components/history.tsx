import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  History, 
  Loader2, 
  XCircle, 
  TrendingUp, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XIcon, 
  AlertCircle,
  BarChart3,
  PieChart,
  Activity,
  Target
} from 'lucide-react';
import { 
  PieChart as RechartsPieChart, 
  Cell, 
  ResponsiveContainer, 
  BarChart,
  Pie,
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart, 
  Line,
  Area,
  AreaChart
} from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

interface HistoryItem {
  id: string;
  type: string;
  status: 'created' | 'approved' | 'rejected' | 'pending' | 'notified';
  description?: string;
  requestedDates?: string;
  createdAt: string;
}

interface HistorySectionProps {
  isLoading: boolean;
  error: string | null;
  history: HistoryItem[];
}

const Card = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <div className={`rounded-xl border ${className}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>
    {children}
  </div>
);

const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

const formatDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy', { locale: es });
  } catch {
    return dateString;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-800 border-green-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'created': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'notified': return 'bg-purple-100 text-purple-800 border-purple-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'approved': return 'Aprobada';
    case 'rejected': return 'Rechazada';
    case 'pending': return 'Pendiente';
    case 'created': return 'Creada';
    case 'notified': return 'Notificada';
    default: return status;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved': return <CheckCircle className="w-4 h-4" />;
    case 'rejected': return <XIcon className="w-4 h-4" />;
    case 'pending': return <Clock className="w-4 h-4" />;
    case 'created': return <Calendar className="w-4 h-4" />;
    case 'notified': return <AlertCircle className="w-4 h-4" />;
    default: return <Activity className="w-4 h-4" />;
  }
};

const COLORS = {
  approved: '#10b981',
  rejected: '#ef4444',
  pending: '#f59e0b',
  created: '#3b82f6',
  notified: '#8b5cf6'
};

const HistorySection = React.memo(({ isLoading, error, history }: HistorySectionProps) => {
  // Agrupar por estado
  const grouped = useMemo(() => {
    return {
      approved: history.filter(h => h.status === 'approved'),
      rejected: history.filter(h => h.status === 'rejected'),
      pending: history.filter(h => h.status === 'pending'),
      created: history.filter(h => h.status === 'created'),
      notified: history.filter(h => h.status === 'notified'),
    };
  }, [history]);

  // Estadísticas avanzadas
  const stats = useMemo(() => {
    const total = history.length;
    const approved = grouped.approved.length;
    const rejected = grouped.rejected.length;
    const pending = grouped.pending.length;
    const created = grouped.created.length;
    
    const approvalRate = total > 0 ? (approved / total * 100) : 0;
    const rejectionRate = total > 0 ? (rejected / total * 100) : 0;
    
    return {
      total,
      approved,
      rejected,
      pending,
      created,
      approvalRate,
      rejectionRate
    };
  }, [history, grouped]);

  // Datos para gráfico de pie
  const pieData = useMemo(() => {
    return [
      { name: 'Aprobadas', value: stats.approved, color: COLORS.approved },
      { name: 'Rechazadas', value: stats.rejected, color: COLORS.rejected },
      { name: 'Pendientes', value: stats.pending, color: COLORS.pending },
      { name: 'Creadas', value: stats.created, color: COLORS.created },
    ].filter(item => item.value > 0);
  }, [stats]);

  // Tendencias mensuales
  const monthlyTrends = useMemo(() => {
    if (history.length === 0) return [];

    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });

    return last6Months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthHistory = history.filter(item => {
        const itemDate = parseISO(item.createdAt);
        return itemDate >= monthStart && itemDate <= monthEnd;
      });

      return {
        month: format(month, 'MMM yyyy', { locale: es }),
        total: monthHistory.length,
        approved: monthHistory.filter(h => h.status === 'approved').length,
        rejected: monthHistory.filter(h => h.status === 'rejected').length,
        pending: monthHistory.filter(h => h.status === 'pending').length,
      };
    });
  }, [history]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  const renderHistoryItem = (item: HistoryItem, index: number) => (
    <motion.div
      key={item.id}
      variants={itemVariants}
      initial={{ opacity: 0, x: -20 }}
      animate={{ 
        opacity: 1, 
        x: 0,
        transition: { delay: index * 0.05 }
      }}
      className="group relative"
    >
      <div className="flex items-start space-x-4 p-6 bg-gradient-to-r from-green-50/50 to-white rounded-xl border border-green-100/60 hover:shadow-lg hover:border-green-200 transition-all duration-300 relative overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Status indicator */}
        <div className="flex-shrink-0 relative">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md relative overflow-hidden ${
            item.status === 'approved' ? 'bg-gradient-to-br from-green-500 to-green-600' :
            item.status === 'rejected' ? 'bg-gradient-to-br from-red-500 to-red-600' :
            item.status === 'pending' ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
            item.status === 'created' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
            'bg-gradient-to-br from-purple-500 to-purple-600'
          }`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
            <div className="text-white">
              {getStatusIcon(item.status)}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 relative">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-bold text-green-800 group-hover:text-green-900 transition-colors">
              {item.type}
            </h4>
            <Badge className={`${getStatusColor(item.status)} shadow-sm`}>
              {getStatusText(item.status)}
            </Badge>
          </div>

          {item.description && (
            <p className="text-green-600 mb-3 leading-relaxed">
              {item.description}
            </p>
          )}

          {item.requestedDates && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-green-700 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Fechas solicitadas:
              </p>
              <div className="flex flex-wrap gap-2">
                {item.requestedDates.split(',').map((fecha, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full border border-green-200 font-medium"
                  >
                    {formatDate(fecha.trim())}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center text-green-500 text-sm">
            <Clock className="w-4 h-4 mr-2" />
            <span className="font-medium">
              {formatDate(item.createdAt)}
            </span>
          </div>
        </div>

        {/* Bottom gradient line */}
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <Card className="border border-green-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <CardTitle className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <span>Análisis de Historial</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
            <p className="text-green-600 font-medium text-lg">Cargando análisis...</p>
            <p className="text-green-400 text-sm mt-1">Procesando datos del historial</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-red-200 shadow-lg">
        <CardContent className="p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-600 font-medium text-lg mb-2">Error al cargar el historial</p>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <Card className="border border-green-200 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent" />
            <CardTitle className="flex items-center space-x-3 relative">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <History className="w-5 h-5" />
              </div>
              <div>
                <span className="text-2xl font-bold">Análisis de Historial</span>
                <p className="text-green-100 text-sm font-normal mt-1">
                  Tendencias y estadísticas detalladas
                </p>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>
      </motion.div>

      {history.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="border border-green-200 shadow-lg">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <History className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">
                  No hay historial disponible
                </h3>
                <p className="text-green-600">
                  Cuando se generen solicitudes, aparecerán aquí con análisis detallados
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
          {/* Métricas principales */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border border-green-200 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 bg-gradient-to-br from-green-50 to-white relative">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-green-200/30 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-300" />
                  <div className="flex items-center justify-between relative">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Total Solicitudes</p>
                      <p className="text-3xl font-bold text-green-800">{stats.total}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-green-200 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 bg-gradient-to-br from-green-50 to-white relative">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-green-200/30 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-300" />
                  <div className="flex items-center justify-between relative">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Tasa de Aprobación</p>
                      <p className="text-3xl font-bold text-green-800">{stats.approvalRate.toFixed(1)}%</p>
                    </div>
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-green-200 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 bg-gradient-to-br from-amber-50 to-white relative">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-amber-200/30 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-300" />
                  <div className="flex items-center justify-between relative">
                    <div>
                      <p className="text-amber-600 text-sm font-medium">Pendientes</p>
                      <p className="text-3xl font-bold text-amber-800">{stats.pending}</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-green-200 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 bg-gradient-to-br from-red-50 to-white relative">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-red-200/30 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-300" />
                  <div className="flex items-center justify-between relative">
                    <div>
                      <p className="text-red-600 text-sm font-medium">Tasa de Rechazo</p>
                      <p className="text-3xl font-bold text-red-800">{stats.rejectionRate.toFixed(1)}%</p>
                    </div>
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                      <XIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
            {/* Gráfico de distribución */}
            <motion.div variants={itemVariants}>
              <Card className="border border-green-200 shadow-lg">
                <CardHeader className="bg-green-50 border-b border-green-100">
                  <CardTitle className="flex items-center space-x-2 text-green-800">
                    <PieChart className="w-5 h-5" />
                    <span>Distribución de Estados</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [value, 'Solicitudes']}
                          labelStyle={{ color: '#065f46' }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {pieData.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-green-700 font-medium">
                          {item.name}: {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Tendencias mensuales */}
          {monthlyTrends.length > 0 && (
            <motion.div variants={itemVariants}>
              <Card className="border border-green-200 shadow-lg">
                <CardHeader className="bg-green-50 border-b border-green-100">
                  <CardTitle className="flex items-center space-x-2 text-green-800">
                    <TrendingUp className="w-5 h-5" />
                    <span>Tendencias Mensuales - Aprobadas vs Rechazadas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 12, fill: '#065f46' }}
                        />
                        <YAxis tick={{ fontSize: 12, fill: '#065f46' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#f0fdf4', 
                            border: '1px solid #bbf7d0',
                            borderRadius: '8px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="approved" 
                          stroke="#10b981" 
                          strokeWidth={3}
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                          activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 2 }}
                          name="Aprobadas"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="rejected" 
                          stroke="#ef4444" 
                          strokeWidth={3}
                          dot={{ fill: '#ef4444', strokeWidth: 2, r: 6 }}
                          activeDot={{ r: 8, stroke: '#ef4444', strokeWidth: 2 }}
                          name="Rechazadas"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="pending" 
                          stroke="#f59e0b" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                          name="Pendientes"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="total" 
                          stroke="#6b7280" 
                          fill="#6b7280"
                          fillOpacity={0.1}
                          strokeWidth={1}
                          name="Total"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Leyenda personalizada */}
                  <div className="mt-6 flex flex-wrap justify-center gap-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-1 bg-green-500 rounded"></div>
                      <span className="text-sm font-medium text-green-700">Aprobadas</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-1 bg-red-500 rounded"></div>
                      <span className="text-sm font-medium text-red-700">Rechazadas</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-1 bg-amber-500 rounded border-dashed border border-amber-500"></div>
                      <span className="text-sm font-medium text-amber-700">Pendientes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-1 bg-gray-400 rounded opacity-50"></div>
                      <span className="text-sm font-medium text-gray-600">Total (área)</span>
                    </div>
                  </div>
                  
                  {/* Resumen de tendencias */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-100">
                    <h4 className="text-sm font-semibold text-green-800 mb-2">Análisis de Tendencias:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {monthlyTrends.reduce((sum, month) => sum + month.approved, 0)}
                        </div>
                        <div className="text-green-700">Total Aprobadas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">
                          {monthlyTrends.reduce((sum, month) => sum + month.rejected, 0)}
                        </div>
                        <div className="text-red-700">Total Rechazadas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-amber-600">
                          {monthlyTrends.reduce((sum, month) => sum + month.pending, 0)}
                        </div>
                        <div className="text-amber-700">Total Pendientes</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Lista detallada del historial */}
          <motion.div variants={itemVariants}>
            <Card className="border border-green-200 shadow-lg">
              <CardHeader className="bg-green-50 border-b border-green-100">
                <CardTitle className="flex items-center space-x-2 text-green-800">
                  <Activity className="w-5 h-5" />
                  <span>Historial Detallado</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="max-h-[600px] overflow-y-auto space-y-4 pr-2">
                  {history.map((item, index) => renderHistoryItem(item, index))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  );
});

HistorySection.displayName = "HistorySection";

export default HistorySection;