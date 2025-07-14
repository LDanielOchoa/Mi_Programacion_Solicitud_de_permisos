import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  FileText,
  ImageIcon,
  FileIcon,
  Calendar,
  Clock,
  Phone,
  User,
  Code,
  Type,
  CheckCircle,
  XCircle,
  Paperclip,
  CalendarIcon,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  Eye,
  Star,
  Shield,
  Activity,
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

// Types
type FileInfo = {
  fileName: string;
  fileUrl: string;
};

type Request = {
  id: string;
  code: string;
  name: string;
  type: string;
  time: string;
  status: string;
  createdAt: string;
  description?: string;
  zona?: string;
  codeAM?: string;
  codePM?: string;
  shift?: string;
  dates?: string[] | string;
  files?: string[] | FileInfo[];
  file_name?: string[];
  file_url?: string[];
  noveltyType?: string;
  reason?: string;
  phone?: string;
  [key: string]: any;
};

type HistoryItem = {
  id: string;
  type: string;
  createdAt: string;
  status: string;
};

type RequestDetailsProps = {
  requests: Request[];
  onClose: () => void;
  onAction: (id: string, action: 'approve' | 'reject', reason: string) => void;
};

// UI Components
const Button = ({ 
  children, 
  onClick, 
  variant = 'default', 
  size = 'md', 
  disabled = false,
  className = '',
  ...props 
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2';
  
  const variantClasses = {
    default: 'bg-emerald-600 text-white hover:bg-emerald-700',
    outline: 'border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50',
    ghost: 'text-emerald-600 hover:bg-emerald-50',
    destructive: 'bg-red-600 text-white hover:bg-red-700'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1 text-sm rounded-md',
    md: 'px-4 py-2 text-base rounded-lg',
    lg: 'px-6 py-3 text-lg rounded-xl'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Badge = ({ 
  children, 
  className = '',
  variant = 'default' 
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline';
}) => {
  const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium';
  const variantClasses = {
    default: 'bg-emerald-100 text-emerald-800',
    outline: 'border border-emerald-300 text-emerald-800'
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Card = ({ 
  children, 
  className = '' 
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`bg-white rounded-lg shadow-lg ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ 
  children, 
  className = '' 
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ 
  children, 
  className = '' 
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h3 className={`text-lg font-semibold ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ 
  children, 
  className = '' 
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <p className={`text-sm text-gray-600 ${className}`}>
    {children}
  </p>
);

const CardContent = ({ 
  children, 
  className = '' 
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

const Textarea = ({ 
  placeholder, 
  value, 
  onChange, 
  className = '',
  ...props 
}: {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
}) => (
  <textarea
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${className}`}
    {...props}
  />
);

// Utility Functions
function processFiles(request: Request): FileInfo[] {
  if (!request.files && !request.file_name && !request.file_url) return [];
  
  try {
    if (Array.isArray(request.files) && request.files.length > 0 && typeof request.files[0] === 'object') {
      return request.files as FileInfo[];
    }
    
    if (Array.isArray(request.file_name) && Array.isArray(request.file_url)) {
      return request.file_name.map((name, index) => ({
        fileName: name,
        fileUrl: request.file_url![index],
      }));
    }
    
    if (Array.isArray(request.files)) {
      return request.files.map((file) => ({
        fileName: Array.isArray(file) ? file[0] : file,
        fileUrl: Array.isArray(file) ? file[0] : file,
      }));
    }
  } catch (error) {
    console.error('Error processing files:', error);
  }
  
  return [];
}

function formatDate(dateString: string) {
  if (!dateString) return 'Fecha no disponible';
  
  try {
    if (dateString.includes(',')) {
      const fechas = dateString.split(',').map((fecha) => {
        const fechaTrim = fecha.trim();
        try {
          const date = parseISO(fechaTrim);
          return isValid(date) ? format(date, 'PPP', { locale: es }) : fechaTrim;
        } catch {
          return fechaTrim;
        }
      });
      return fechas.join(', ');
    }
    
    const date = parseISO(dateString);
    if (!isValid(date)) {
      console.warn('Fecha inválida:', dateString);
      const matches = dateString.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
      if (matches) {
        const [_, day, month, year] = matches;
        const newDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        if (isValid(newDate)) {
          return format(newDate, 'PPP', { locale: es });
        }
      }
      return dateString;
    }
    
    return format(date, 'PPP', { locale: es });
  } catch (error) {
    console.error('Error al formatear fecha:', error, dateString);
    return dateString;
  }
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'approved':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

const isImage = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension || '');
};

const isPDF = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension === 'pdf';
};

// File Preview Components
function FilePreviewThumbnail({
  fileName,
  fileUrl,
  onClick,
}: {
  fileName: string;
  fileUrl: string;
  onClick: () => void;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [fileUrl]);

  return (
    <motion.div
      className="relative group aspect-[4/3] overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-100 flex items-center justify-center cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300"
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -8 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 via-green-400/20 to-teal-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {isImage(fileName) && !imageError ? (
        <>
          <img
            src={fileUrl}
            alt={fileName}
            className={`w-full h-full object-cover transition-all duration-500 ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          )}
        </>
      ) : isPDF(fileName) ? (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <motion.div
            whileHover={{ rotate: 12, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <FileText className="w-16 h-16 text-emerald-500 mb-3 drop-shadow-lg" />
          </motion.div>
          <span className="text-sm font-medium text-emerald-700">Documento PDF</span>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <motion.div
            whileHover={{ rotate: 12, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <FileIcon className="w-16 h-16 text-emerald-500 mb-3 drop-shadow-lg" />
          </motion.div>
          <span className="text-sm font-medium text-emerald-700">
            {fileName.split('.').pop()?.toUpperCase() || 'Archivo'}
          </span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
        <motion.div
          className="bg-white/95 backdrop-blur-sm rounded-full p-3 mb-4 shadow-xl border border-emerald-200"
          initial={{ y: 20, opacity: 0 }}
          whileHover={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Eye className="w-6 h-6 text-emerald-600" />
        </motion.div>
      </div>
    </motion.div>
  );
}

function FilePreviewModal({ file, onClose }: { file: FileInfo; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
  }, [file.fileUrl]);

  const handleDownload = () => {
    window.open(file.fileUrl, '_blank');
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-6"
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl border border-emerald-200/50 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-8 border-b border-emerald-100/50 bg-gradient-to-r from-emerald-50/80 via-green-50/80 to-teal-50/80 backdrop-blur-sm">
            <div className="flex items-center space-x-4">
              <motion.div
                className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg"
                whileHover={{ rotate: 12, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                {isImage(file.fileName) ? (
                  <ImageIcon className="w-6 h-6 text-white" />
                ) : isPDF(file.fileName) ? (
                  <FileText className="w-6 h-6 text-white" />
                ) : (
                  <FileIcon className="w-6 h-6 text-white" />
                )}
              </motion.div>
              <div>
                <h3 className="font-bold text-2xl text-emerald-800 truncate max-w-[400px]">
                  {file.fileName}
                </h3>
                <p className="text-emerald-600/80 font-medium">Vista previa del archivo</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="lg"
                onClick={handleDownload}
                className="border-emerald-200 hover:bg-emerald-50 text-emerald-600"
              >
                <Download className="h-5 w-5 mr-2" />
                Descargar
              </Button>
              <Button variant="ghost" size="lg" onClick={onClose}>
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="relative flex-1 overflow-auto p-8 flex items-center justify-center bg-gradient-to-br from-gray-50 to-emerald-50/30">
            {loading && (
              <motion.div
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <motion.div
                  className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <p className="mt-4 text-emerald-600 font-medium text-lg">Cargando archivo...</p>
              </motion.div>
            )}

            {error ? (
              <motion.div
                className="flex flex-col items-center justify-center p-12 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <FileIcon className="w-20 h-20 text-red-500 mb-6" />
                <p className="text-red-600 mb-3 text-xl font-semibold">{error}</p>
                <p className="text-gray-500 max-w-md text-lg leading-relaxed">
                  No se pudo cargar el archivo. Intente descargar el archivo para verlo.
                </p>
                <Button onClick={handleDownload} className="mt-6">
                  <Download className="mr-3 h-5 w-5" />
                  Descargar Archivo
                </Button>
              </motion.div>
            ) : isImage(file.fileName) ? (
              <motion.img
                src={file.fileUrl}
                alt={file.fileName}
                className="max-w-full max-h-[calc(90vh-200px)] object-contain rounded-2xl shadow-2xl border border-emerald-200/50"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError('No se pudo cargar la imagen');
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: loading ? 0 : 1, scale: loading ? 0.9 : 1 }}
                transition={{ duration: 0.5, type: 'spring', stiffness: 300 }}
              />
            ) : isPDF(file.fileName) ? (
              <div className="w-full h-[calc(90vh-200px)] rounded-2xl overflow-hidden shadow-2xl border border-emerald-200/50">
                <iframe
                  src={file.fileUrl}
                  width="100%"
                  height="100%"
                  className="rounded-2xl"
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setError('No se pudo cargar el PDF');
                  }}
                />
              </div>
            ) : (
              <motion.div
                className="flex flex-col items-center justify-center p-12 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <FileIcon className="w-20 h-20 text-emerald-500 mb-6" />
                <p className="text-gray-700 mb-3 text-xl font-semibold">Vista previa no disponible</p>
                <p className="text-gray-500 max-w-md text-lg leading-relaxed">
                  No se puede mostrar una vista previa para este tipo de archivo. Puedes descargar el archivo
                  para verlo.
                </p>
                <Button onClick={handleDownload} className="mt-6">
                  <Download className="mr-3 h-5 w-5" />
                  Descargar Archivo
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Tab System
const Tabs = ({ 
  defaultValue, 
  children, 
  className = '' 
}: {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <div className={`tabs ${className}`} data-active-tab={activeTab}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          // Solo pasa activeTab y setActiveTab a los componentes de pestaña esperados
          if (
            child.type === TabsList ||
            child.type === TabsContent
          ) {
            return React.cloneElement(child, { activeTab, setActiveTab } as any);
          }
          // Para otros elementos válidos, devuélvelos tal cual
          return child;
        }
        // Para elementos no-React (ej. strings, números, null), devuélvelos tal cual
        return child;
      })}
    </div>
  );
};

const TabsList = ({ 
  children, 
  className = '',
  activeTab,
  setActiveTab 
}: {
  children: React.ReactNode;
  className?: string;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}) => (
  <div className={`flex space-x-2 ${className}`}>
    {React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        // Solo pasa activeTab y setActiveTab a los componentes TabsTrigger
        if (child.type === TabsTrigger) {
          return React.cloneElement(child, { activeTab, setActiveTab } as any);
        }
        // Para otros elementos válidos, devuélvelos tal cual
        return child;
      }
      // Para elementos no-React, devuélvelos tal cual
      return child;
    })}
  </div>
);

const TabsTrigger = ({ 
  value, 
  children, 
  className = '',
  activeTab,
  setActiveTab 
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}) => (
  <button
    onClick={() => setActiveTab?.(value)}
    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
      activeTab === value
        ? 'bg-emerald-600 text-white shadow-lg'
        : 'bg-white text-gray-700 hover:bg-gray-50'
    } ${className}`}
  >
    {children}
  </button>
);

const TabsContent = ({ 
  value, 
  children, 
  className = '',
  activeTab 
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
  activeTab?: string;
}) => {
  if (activeTab !== value) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Section Components
function InfoSection({ request }: { request: Request }) {
  const InfoItem = ({ 
    icon, 
    label, 
    value 
  }: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 500 }}
      className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 transition-all duration-300 group"
      whileHover={{ x: 8 }}
    >
      <motion.div
        className="text-emerald-500 p-2 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 transition-colors duration-300"
        whileHover={{ rotate: 12, scale: 1.1 }}
        transition={{ type: 'spring', stiffness: 400 }}
      >
        {icon}
      </motion.div>
      <div className="flex-1">
        <span className="font-semibold text-gray-700 text-lg">{label}:</span>
        <div className="text-gray-800 font-medium">{value}</div>
      </div>
    </motion.div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white p-8">
            <CardTitle className="flex items-center space-x-3 text-2xl">
              <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                <User className="w-7 h-7" />
              </motion.div>
              <span>Información del Solicitante</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-8 pb-8">
            <InfoItem
              icon={<Code className="w-6 h-6" />}
              label="Código"
              value={
                <Badge className="bg-emerald-100 text-emerald-800 px-3 py-1 text-sm font-semibold">
                  {request.code}
                </Badge>
              }
            />
            <InfoItem icon={<User className="w-6 h-6" />} label="Nombre" value={request.name} />
            {request.phone && (
              <InfoItem icon={<Phone className="w-6 h-6" />} label="Teléfono" value={request.phone} />
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.1 }}
      >
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white p-8">
            <CardTitle className="flex items-center space-x-3 text-2xl">
              <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                <Calendar className="w-7 h-7" />
              </motion.div>
              <span>Detalles de la Solicitud</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-8 pb-8">
            <InfoItem
              icon={<Type className="w-6 h-6" />}
              label="Tipo"
              value={
                <Badge className="bg-blue-100 text-blue-800 px-3 py-1 text-sm font-semibold">
                  {request.type}
                </Badge>
              }
            />
            <InfoItem
              icon={<Calendar className="w-6 h-6" />}
              label="Fecha"
              value={formatDate(request.createdAt)}
            />
            <InfoItem icon={<Clock className="w-6 h-6" />} label="Hora" value={request.time} />
            <InfoItem
              icon={<Activity className="w-6 h-6" />}
              label="Estado"
              value={
                <Badge className={`${getStatusColor(request.status)} px-3 py-1 text-sm font-semibold border`}>
                  {request.status}
                </Badge>
              }
            />
            {request.zona && (
              <InfoItem icon={<MapPin className="w-6 h-6" />} label="Zona" value={request.zona} />
            )}
            {(request.codeAM || request.codePM) && (
              <InfoItem
                icon={<Users className="w-6 h-6" />}
                label="Códigos"
                value={
                  <div className="flex space-x-2">
                    {request.codeAM && (
                      <Badge className="bg-purple-100 text-purple-800 px-2 py-1 text-xs">
                        AM: {request.codeAM}
                      </Badge>
                    )}
                    {request.codePM && (
                      <Badge className="bg-orange-100 text-orange-800 px-2 py-1 text-xs">
                        PM: {request.codePM}
                      </Badge>
                    )}
                  </div>
                }
              />
            )}
            {request.shift && (
              <InfoItem
                icon={<Clock className="w-6 h-6" />}
                label="Turno"
                value={
                  <Badge className="bg-indigo-100 text-indigo-800 px-3 py-1 text-sm font-semibold">
                    {request.shift}
                  </Badge>
                }
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {request.description && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white p-8">
              <CardTitle className="flex items-center space-x-3 text-2xl">
                <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                  <FileText className="w-7 h-7" />
                </motion.div>
                <span>Descripción</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 pb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 500 }}
                className="whitespace-pre-wrap text-gray-800 bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-2xl border-2 border-emerald-100 shadow-inner text-lg leading-relaxed"
              >
                {request.description}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function DatesSection({ dates }: { dates?: string[] | string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
    >
      <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white p-8">
          <CardTitle className="flex items-center space-x-3 text-2xl">
            <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
              <CalendarIcon className="w-7 h-7" />
            </motion.div>
            <span>Fechas Solicitadas</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-wrap gap-4">
            {Array.isArray(dates) ? (
              dates.map((date: string, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 500, delay: index * 0.1 }}
                  whileHover={{ scale: 1.1, rotate: 3, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Badge className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white px-6 py-3 text-base rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {formatDate(date)}
                  </Badge>
                </motion.div>
              ))
            ) : typeof dates === 'string' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 500 }}
                whileHover={{ scale: 1.1, rotate: 3, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Badge className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white px-6 py-3 text-base rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {formatDate(dates)}
                </Badge>
              </motion.div>
            ) : (
              <motion.p
                className="text-gray-500 italic text-center py-12 text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                No hay fechas disponibles
              </motion.p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function FilesSection({ 
  files, 
  onFileSelect 
}: {
  files: FileInfo[];
  onFileSelect: (file: FileInfo) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
    >
      <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white p-8">
          <CardTitle className="flex items-center space-x-3 text-2xl">
            <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
              <Paperclip className="w-7 h-7" />
            </motion.div>
            <span>Archivos Adjuntos</span>
          </CardTitle>
          <CardDescription className="text-emerald-100 text-lg mt-2">
            {files.length} archivo{files.length !== 1 ? 's' : ''} disponible{files.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8 pb-8">
          {files.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {files.map((file, index) => (
                <motion.div
                  key={`${file.fileUrl}-${index}`}
                  initial={{ opacity: 0, scale: 0.8, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 500, delay: index * 0.1 }}
                  className="group"
                >
                  <div
                    className="overflow-hidden border-0 hover:shadow-xl transition-all duration-500 cursor-pointer bg-gradient-to-br from-white to-emerald-50/50 backdrop-blur-sm rounded-lg"
                    onClick={() => onFileSelect(file)}
                  >
                    <Card
                      className="overflow-hidden border-0 hover:shadow-xl transition-all duration-500 cursor-pointer bg-gradient-to-br from-white to-emerald-50/50 backdrop-blur-sm"
                    >
                      <CardContent className="p-4">
                      <FilePreviewThumbnail
                        fileName={file.fileName}
                        fileUrl={file.fileUrl}
                        onClick={() => onFileSelect(file)}
                      />
                      <motion.div
                        className="mt-4 p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl"
                        whileHover={{ scale: 1.02 }}
                      >
                        <p className="text-sm text-emerald-700 font-semibold truncate group-hover:text-emerald-800 transition-colors duration-200">
                          {file.fileName}
                        </p>
                        <div className="flex items-center mt-2 space-x-2">
                          <Eye className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs text-emerald-600">Click para ver</span>
                        </div>
                      </motion.div>
                    </CardContent>
                  </Card>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Paperclip className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 italic text-lg">No hay archivos adjuntos</p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ActionSection({
  reason,
  onReasonChange,
  onApprove,
  onReject,
}: {
  reason: string;
  onReasonChange: (reason: string) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
    >
      <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white p-8">
          <CardTitle className="flex items-center space-x-3 text-2xl">
            <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
              <Shield className="w-7 h-7" />
            </motion.div>
            <span>Acción Requerida</span>
          </CardTitle>
          <CardDescription className="text-emerald-100 text-lg mt-2">
            Proporcione una razón detallada para aprobar o rechazar esta solicitud
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-8 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 500 }}
          >
            <Textarea
              placeholder="Escriba aquí la razón detallada para su decisión..."
              onChange={(e) => onReasonChange(e.target.value)}
              value={reason}
              className="min-h-[120px] border-2 border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500 rounded-2xl text-lg p-6 bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur-sm resize-none"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 500, delay: 0.1 }}
            className="flex justify-end space-x-6"
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Button
                variant="destructive"
                onClick={onReject}
                size="lg"
                className="shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-4 text-lg rounded-2xl"
              >
                <XCircle className="mr-3 h-6 w-6" />
                Rechazar Solicitud
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Button
                onClick={onApprove}
                size="lg"
                className="shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-4 text-lg rounded-2xl"
              >
                <CheckCircle className="mr-3 h-6 w-6" />
                Aprobar Solicitud
              </Button>
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function HistorySection({
  isLoading,
  error,
  history,
}: {
  isLoading: boolean;
  error: string | null;
  history: HistoryItem[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
    >
      <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white p-8">
          <CardTitle className="flex items-center space-x-3 text-2xl">
            <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
              <Clock className="w-7 h-7" />
            </motion.div>
            <span>Historial de Solicitudes</span>
          </CardTitle>
          <CardDescription className="text-emerald-100 text-lg mt-2">
            Registro completo de actividades relacionadas
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8 pb-8">
          {isLoading ? (
            <motion.div
              className="flex justify-center items-center h-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="relative flex flex-col items-center">
                <motion.div
                  className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <p className="text-emerald-600 text-lg font-medium mt-6">Cargando historial...</p>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 bg-gradient-to-r from-red-50 to-rose-50 text-red-600 rounded-2xl border-2 border-red-200 text-center shadow-lg"
            >
              <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <p className="text-lg font-semibold">{error}</p>
            </motion.div>
          ) : history.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border-2 border-emerald-100 shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-emerald-50 to-green-50">
                    <tr>
                      <th className="text-emerald-700 font-bold text-lg p-6 text-left">ID</th>
                      <th className="text-emerald-700 font-bold text-lg p-6 text-left">Tipo</th>
                      <th className="text-emerald-700 font-bold text-lg p-6 text-left">Fecha</th>
                      <th className="text-emerald-700 font-bold text-lg p-6 text-left">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item, index) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: index * 0.05,
                          type: 'spring',
                          damping: 25,
                          stiffness: 500,
                        }}
                        className="hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 transition-all duration-300 border-b border-emerald-100"
                        whileHover={{ scale: 1.01 }}
                      >
                        <td className="font-semibold text-lg p-6">{item.id}</td>
                        <td className="text-lg p-6">{item.type}</td>
                        <td className="text-lg p-6">{formatDate(item.createdAt)}</td>
                        <td className="p-6">
                          <Badge className={`${getStatusColor(item.status)} px-4 py-2 text-sm font-semibold border`}>
                            {item.status}
                          </Badge>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 italic text-lg">No hay historial disponible para esta solicitud.</p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Main Component
const RequestDetails = ({ requests, onClose, onAction }: RequestDetailsProps) => {
  const [reason, setReason] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [currentRequestIndex, setCurrentRequestIndex] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const currentRequest = requests[currentRequestIndex];
  const isEquipmentRequest = !('noveltyType' in currentRequest);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handlePrevRequest = () => {
    if (currentRequestIndex > 0) {
      setCurrentRequestIndex(currentRequestIndex - 1);
    }
  };

  const handleNextRequest = () => {
    if (currentRequestIndex < requests.length - 1) {
      setCurrentRequestIndex(currentRequestIndex + 1);
    }
  };

  const handleAction = (action: 'approve' | 'reject') => {
    onAction(currentRequest.id, action, reason);
  };

  const getSections = () => {
    const sections = ['info', 'history'];
    if (!isEquipmentRequest) {
      sections.push('dates', 'files');
    }
    if (currentRequest.status === 'pending') {
      sections.push('action');
    }
    return sections;
  };

  const sections = getSections();
  const processedFiles = processFiles(currentRequest);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl w-full max-w-7xl max-h-[90vh] shadow-2xl border border-emerald-200/50 relative flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white p-8 shadow-lg rounded-t-3xl">
            <div className="flex justify-between items-center">
              <div>
                <Badge
                  variant="outline"
                  className={`mb-4 px-4 py-2 text-base font-semibold border-2 ${
                    isEquipmentRequest
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-white/20 text-white border-white/30 backdrop-blur-sm'
                  }`}
                >
                  <Star className="w-4 h-4 mr-2" />
                  {isEquipmentRequest ? 'Solicitud de Equipo' : 'Solicitud de Permiso'}
                </Badge>
                <h2 className="text-4xl font-bold text-white mb-2">{currentRequest.type}</h2>
                <p className="text-emerald-100 text-lg">ID: {currentRequest.id}</p>
              </div>
              <Button variant="ghost" size="lg" onClick={onClose}>
                <X className="h-8 w-8" />
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handlePrevRequest}
                  disabled={currentRequestIndex === 0}
                  className="border-white/30 hover:bg-white/20 disabled:opacity-50 text-white"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3">
                  <span className="text-white font-bold text-lg">
                    {currentRequestIndex + 1} / {requests.length}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleNextRequest}
                  disabled={currentRequestIndex === requests.length - 1}
                  className="border-white/30 hover:bg-white/20 disabled:opacity-50 text-white"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
              <div className="flex items-center space-x-3">
                <Badge className={`${getStatusColor(currentRequest.status)} px-4 py-2 text-base font-semibold border`}>
                  <Activity className="w-4 h-4 mr-2" />
                  {currentRequest.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-8 overflow-y-auto flex-1 bg-gradient-to-br from-emerald-50/30 to-green-50/30">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="bg-white/80 backdrop-blur-sm border-2 border-emerald-200 p-2 rounded-2xl shadow-lg w-full">
                {sections.map((section) => (
                  <TabsTrigger key={section} value={section} className="flex-1">
                    {section === 'info'
                      ? 'Información'
                      : section === 'dates'
                      ? 'Fechas'
                      : section === 'files'
                      ? 'Archivos'
                      : section === 'history'
                      ? 'Historial'
                      : 'Acción'}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="info" className="mt-6">
                <InfoSection request={currentRequest} />
              </TabsContent>

              {!isEquipmentRequest && (
                <TabsContent value="dates" className="mt-6">
                  <DatesSection dates={currentRequest.dates} />
                </TabsContent>
              )}

              {!isEquipmentRequest && (
                <TabsContent value="files" className="mt-6">
                  <FilesSection files={processedFiles} onFileSelect={setSelectedFile} />
                </TabsContent>
              )}

              <TabsContent value="history" className="mt-6">
                <HistorySection
                  isLoading={isLoadingHistory}
                  error={historyError}
                  history={history}
                />
              </TabsContent>

              {currentRequest.status === 'pending' && (
                <TabsContent value="action" className="mt-6">
                  <ActionSection
                    reason={reason}
                    onReasonChange={setReason}
                    onApprove={() => handleAction('approve')}
                    onReject={() => handleAction('reject')}
                  />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </motion.div>

        {selectedFile && <FilePreviewModal file={selectedFile} onClose={() => setSelectedFile(null)} />}
      </motion.div>
    </AnimatePresence>
  );
};

export default RequestDetails;