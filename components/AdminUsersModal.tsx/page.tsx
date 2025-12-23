import React, { useState, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  Users,
  Search,
  User,
  CreditCard,
  Briefcase,
  Building2,
  Check,
  Sparkles,
  Filter,
  X,
  ChevronDown,
  UserCheck,
  Database,
  Plus,
  Edit3,
  Save,
  UserPlus,
  Eye,
  Mail,
  Phone,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Lock
} from 'lucide-react';
import UserAvatar from '../../components/UserAvatar/page';
import { useOptimizedUserList } from '../../hooks/useOptimizedUserList';
import { useRBACContext } from '../RBACProvider';

interface Person {
  code: string;
  name: string;
  telefone: string;
  password?: string;
  cargo?: string;
  role: 'admin' | 'employee';
  created_at?: string;
  updated_at?: string;
  avatar?: string;
  estado: 'activo' | 'inactivo';
  fechaIngreso?: string;
  direccion?: string;
  area?: string;
  email?: string;
}

interface OperatorInfo {
  cedula: string;
  nombre: string;
  cargo: string;
  fechaIngreso: string;
  id: string;
  foto: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const areas = ['Todas', 'Tecnología', 'Diseño', 'Gestión', 'Marketing', 'Finanzas', 'RRHH', 'Ventas', 'Calidad'];

// Componente PersonModal separado para evitar re-renderizados
const PersonModalComponent = memo(({
  showModal,
  editingPerson,
  modalMode,
  handleCloseModal,
  handleEditPerson,
  loading,
  handleSavePerson,
  handleDeletePerson,
  apiError,
  cedulaSearch,
  setCedulaSearch,
  isSearchingCedula,
  cedulaError,
  handleSearchByCedula,
  operatorInfo,
  handleSaveUser,
  isSaving,
  setEditingPerson
}: {
  showModal: boolean;
  editingPerson: Person | null;
  modalMode: 'view' | 'edit' | 'create';
  handleCloseModal: () => void;
  handleEditPerson: () => void;
  loading: boolean;
  handleSavePerson: () => void;
  handleDeletePerson: (code: string) => void;
  apiError: string;
  cedulaSearch: string;
  setCedulaSearch: (value: string) => void;
  isSearchingCedula: boolean;
  cedulaError: string;
  handleSearchByCedula: () => void;
  operatorInfo: OperatorInfo | null;
  handleSaveUser: () => void;
  isSaving: boolean;
  setEditingPerson: (person: Person | null) => void;
}) => {
  if (!showModal || !editingPerson) return null;

  const isEditing = modalMode === 'edit' || modalMode === 'create';
  const isCreating = modalMode === 'create';

  const modalContent = (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-green-600 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg ring-4 ring-white/20">
                    <UserAvatar
                      cedula={editingPerson.code || ''}
                      alt={editingPerson.name || 'Nueva persona'}
                      className="w-full h-full object-cover"
                      defaultAvatar=""
                    />
                  </div>
                  <div className="text-white">
                    <h2 className="text-2xl font-bold">
                      {isCreating ? 'Nueva Persona' : editingPerson.name}
                    </h2>
                    <p className="text-emerald-100">
                      {isCreating ? 'Agregar información' : editingPerson.cargo}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!isCreating && modalMode === 'view' && (
                    <button
                      onClick={handleEditPerson}
                      className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                    >
                      <Edit3 className="h-5 w-5 text-white" />
                    </button>
                  )}
                  {isEditing && (
                    <button
                      onClick={handleSavePerson}
                      disabled={loading}
                      className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Save className="h-5 w-5 text-white" />}
                    </button>
                  )}
                  {!isCreating && modalMode === 'view' && (
                    <button
                      onClick={() => handleDeletePerson(editingPerson.code)}
                      disabled={loading}
                      className="p-3 bg-red-500/20 hover:bg-red-500/30 rounded-xl transition-colors disabled:opacity-50"
                    >
                      <X className="h-5 w-5 text-white" />
                    </button>
                  )}
                  <button
                    onClick={handleCloseModal}
                    className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Error display */}
              {apiError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
                >
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{apiError}</span>
                </motion.div>
              )}

              {/* Búsqueda por cédula solo en modo crear */}
              {isCreating && !editingPerson.name && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-8"
                >
                  <div className="text-center mb-6">
                    <motion.div
                      animate={{
                        scale: [1, 1.05, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                    >
                      <Search className="h-10 w-10 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-emerald-800 mb-2">Buscar Persona</h3>
                    <p className="text-emerald-600">Ingrese la cédula para buscar en la base de datos</p>
                  </div>

                  <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-emerald-700 mb-2">
                        Número de Cédula
                      </label>
                      <input
                        type="text"
                        value={cedulaSearch}
                        onChange={(e) => setCedulaSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (cedulaSearch.trim() && !isSearchingCedula) {
                              handleSearchByCedula();
                            }
                          }
                        }}
                        placeholder="Ej: 98765432"
                        className="w-full p-4 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors text-lg"
                        disabled={isSearchingCedula}
                        autoComplete="off"
                      />
                    </div>

                    {cedulaError && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
                      >
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium">{cedulaError}</span>
                      </motion.div>
                    )}

                    <button
                      type="button"
                      onClick={handleSearchByCedula}
                      disabled={isSearchingCedula || !cedulaSearch.trim()}
                      className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                    >
                      {isSearchingCedula ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Buscando en base de datos...</span>
                        </>
                      ) : (
                        <>
                          <Search className="h-5 w-5" />
                          <span>Buscar Persona</span>
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* Formulario de información del empleado */}
              {(editingPerson.name || !isCreating) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Información del empleado encontrado */}
                  {operatorInfo && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-6"
                    >
                      <div className="flex items-start space-x-6">
                        {/* Foto del empleado */}
                        <div className="flex-shrink-0">
                          <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg ring-4 ring-emerald-200">
                            <UserAvatar
                              cedula={operatorInfo.cedula || ''}
                              alt={operatorInfo.nombre || 'Empleado'}
                              className="w-full h-full object-cover"
                              defaultAvatar=""
                            />
                          </div>
                        </div>

                        {/* Información del empleado */}
                        <div className="flex-1 space-y-4">
                          <div>
                            <h3 className="text-xl font-bold text-emerald-800 mb-2">Información del Empleado</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-emerald-700">Nombre:</span>
                                <p className="text-emerald-600 font-semibold">{operatorInfo.nombre || 'No disponible'}</p>
                              </div>
                              <div>
                                <span className="font-medium text-emerald-700">Cédula:</span>
                                <p className="text-emerald-600 font-semibold">{operatorInfo.cedula || 'No disponible'}</p>
                              </div>
                              <div>
                                <span className="font-medium text-emerald-700">Cargo:</span>
                                <p className="text-emerald-600">{operatorInfo.cargo || 'No disponible'}</p>
                              </div>
                              <div>
                                <span className="font-medium text-emerald-700">Fecha de Ingreso:</span>
                                <p className="text-emerald-600">{operatorInfo.fechaIngreso ? new Date(operatorInfo.fechaIngreso).toLocaleDateString('es-CO') : 'No disponible'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Formulario de datos del usuario */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Datos del Usuario en el Sistema</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Nombre Completo
                        </label>
                        <input
                          type="text"
                          value={editingPerson.name || ''}
                          onChange={(e) => {
                            if (editingPerson) {
                              setEditingPerson({ ...editingPerson, name: e.target.value });
                            }
                          }}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
                          placeholder="Nombre del empleado"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Clave
                        </label>
                        <input
                          type="text"
                          value={editingPerson.code || ''}
                          onChange={(e) => {
                            if (editingPerson) {
                              setEditingPerson({ ...editingPerson, code: e.target.value });
                            }
                          }}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
                          placeholder="Clave del empleado"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Código de Usuario (4 dígitos)
                        </label>
                        <input
                          type="text"
                          value={editingPerson.password || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                            if (editingPerson) {
                              setEditingPerson({ ...editingPerson, password: value });
                            }
                          }}
                          onPaste={(e) => {
                            e.preventDefault();
                            const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
                            if (editingPerson) {
                              setEditingPerson({ ...editingPerson, password: paste });
                            }
                          }}
                          className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${editingPerson.password && editingPerson.password.length !== 4
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300'
                            }`}
                          placeholder="Ingrese código de 4 dígitos"
                          maxLength={4}
                        />
                        {editingPerson.password && editingPerson.password.length !== 4 && (
                          <p className="text-red-500 text-xs">El código debe tener exactamente 4 dígitos</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          value={editingPerson.telefone || ''}
                          onChange={(e) => {
                            if (editingPerson) {
                              setEditingPerson({ ...editingPerson, telefone: e.target.value });
                            }
                          }}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
                          placeholder="Número de teléfono"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Cargo
                        </label>
                        <input
                          type="text"
                          value={editingPerson.cargo || ''}
                          onChange={(e) => {
                            if (editingPerson) {
                              setEditingPerson({ ...editingPerson, cargo: e.target.value });
                            }
                          }}
                          disabled={!isEditing}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
                          placeholder="Cargo o posición"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      onClick={handleCloseModal}
                      className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200"
                    >
                      Cancelar
                    </button>
                    {operatorInfo && (
                      <button
                        onClick={handleSaveUser}
                        disabled={isSaving || !editingPerson.password || editingPerson.password.length !== 4}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Guardando...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            <span>Guardar Usuario</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
});

PersonModalComponent.displayName = 'PersonModalComponent';




// Componente PersonCard optimizado con memo
const PersonCard = memo(({ person, index, onSelect }: {
  person: Person;
  index: number;
  onSelect: (person: Person) => void;
}) => {
  const handleClick = useCallback(() => {
    onSelect(person);
  }, [person, onSelect]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -50 }}
      transition={{
        duration: 0.5,
        delay: index * 0.05,
        type: "spring",
        stiffness: 120,
        damping: 20
      }}
      whileHover={{
        scale: 1.02,
        y: -8,
        boxShadow: "0 20px 40px rgba(16, 185, 129, 0.15)"
      }}
      onClick={handleClick}
      className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg border-2 border-green-100 hover:border-emerald-300 hover:shadow-lg overflow-hidden group cursor-pointer transition-all duration-300"
    >
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg ring-2 ring-white">
              <UserAvatar
                cedula={person.code}
                alt={person.name}
                className="w-full h-full object-cover"
                defaultAvatar=""
              />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg"
            >
              <Sparkles className="h-3 w-3 text-white" />
            </motion.div>
          </motion.div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-800 truncate mb-1">
              {person.name}
            </h3>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${person.role === 'admin'
                ? 'bg-red-100 text-red-800'
                : 'bg-emerald-100 text-emerald-800'
                }`}>
                {person.role === 'admin' ? 'Administrador' : 'Empleado'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CreditCard className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Código</p>
              <p className="text-sm font-semibold text-gray-800">{person.code}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Briefcase className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Cargo</p>
              <p className="text-sm font-semibold text-gray-800 truncate">{person.cargo || 'No especificado'}</p>
            </div>
          </div>
        </div>

        <motion.div
          className="mt-6 p-3 rounded-xl text-center font-semibold transition-all duration-300 bg-gray-50 text-gray-600 group-hover:bg-emerald-50 group-hover:text-emerald-700"
        >
          <div className="flex items-center justify-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Ver Detalles</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});

PersonCard.displayName = 'PersonCard';

// Componente de paginación optimizado y mejorado
const Pagination = memo(({ pagination, onPageChange, isTransitioning = false }: {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  isTransitioning?: boolean;
}) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  const getPageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    const currentPage = pagination.page;
    const totalPages = pagination.totalPages;

    // Lógica mejorada para diferentes rangos de páginas
    if (totalPages <= 7) {
      // Mostrar todas las páginas si son 7 o menos
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Para más de 7 páginas, usar lógica inteligente
      const startPages = [1, 2];
      const endPages = [totalPages - 1, totalPages];

      let middleStart = Math.max(3, currentPage - 1);
      let middleEnd = Math.min(totalPages - 2, currentPage + 1);

      // Ajustar el rango del medio para evitar solapamientos
      if (middleStart <= 4) {
        middleEnd = 5;
        middleStart = 3;
      }
      if (middleEnd >= totalPages - 3) {
        middleStart = totalPages - 4;
        middleEnd = totalPages - 2;
      }

      // Construir el array de páginas
      pages.push(...startPages);

      if (middleStart > 3) {
        pages.push('...');
      }

      for (let i = middleStart; i <= middleEnd; i++) {
        if (i > 2 && i < totalPages - 1) {
          pages.push(i);
        }
      }

      if (middleEnd < totalPages - 2) {
        pages.push('...');
      }

      pages.push(...endPages);
    }

    // Eliminar duplicados y ordenar
    return [...new Set(pages)].sort((a, b) => {
      if (typeof a === 'string') return 1;
      if (typeof b === 'string') return -1;
      return a - b;
    });
  }, [pagination.page, pagination.totalPages]);

  const handlePrevious = useCallback(() => {
    if (pagination.page > 1 && !isTransitioning) {
      onPageChange(pagination.page - 1);
    }
  }, [pagination.page, onPageChange, isTransitioning]);

  const handleNext = useCallback(() => {
    if (pagination.page < pagination.totalPages && !isTransitioning) {
      onPageChange(pagination.page + 1);
    }
  }, [pagination.page, pagination.totalPages, onPageChange, isTransitioning]);

  const handlePageClick = useCallback((page: number) => {
    if (page !== pagination.page && page >= 1 && page <= pagination.totalPages && !isTransitioning) {
      onPageChange(page);
    }
  }, [pagination.page, pagination.totalPages, onPageChange, isTransitioning]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 space-y-6"
    >
      {/* Información de paginación mejorada */}
      <div className="text-center">
        <div className="text-sm text-gray-600 mb-2">
          <span className="font-semibold text-emerald-600">
            Página {pagination.page} de {pagination.totalPages}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          Mostrando <span className="font-medium">{Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}</span> - <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> de <span className="font-medium text-emerald-600">{pagination.total}</span> usuarios
        </div>
      </div>

      {/* Controles de paginación mejorados */}
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-1 bg-white rounded-2xl shadow-lg border border-gray-200 p-2">
          {/* Botón anterior */}
          <button
            onClick={handlePrevious}
            disabled={pagination.page === 1 || isTransitioning}
            className="p-2 rounded-xl text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-600 transition-all duration-200"
            title="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Números de página */}
          <div className="flex items-center space-x-1">
            {getPageNumbers.map((page, index) => (
              <React.Fragment key={`page-${index}-${page}`}>
                {page === '...' ? (
                  <span className="px-3 py-2 text-gray-400 text-sm font-medium">...</span>
                ) : (
                  <motion.button
                    whileHover={!isTransitioning ? { scale: 1.05 } : {}}
                    whileTap={!isTransitioning ? { scale: 0.95 } : {}}
                    onClick={() => handlePageClick(page as number)}
                    disabled={isTransitioning}
                    className={`min-w-[40px] h-10 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${pagination.page === page
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md transform scale-105'
                      : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-sm'
                      } ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={`Ir a página ${page}`}
                  >
                    {page}
                  </motion.button>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Botón siguiente */}
          <button
            onClick={handleNext}
            disabled={pagination.page === pagination.totalPages || isTransitioning}
            className="p-2 rounded-xl text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-600 transition-all duration-200"
            title="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Navegación rápida para móviles */}
      <div className="flex sm:hidden items-center justify-between px-4">
        <button
          onClick={handlePrevious}
          disabled={pagination.page === 1 || isTransitioning}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Anterior</span>
        </button>

        <span className="text-sm font-medium text-gray-600">
          {pagination.page} / {pagination.totalPages}
        </span>

        <button
          onClick={handleNext}
          disabled={pagination.page === pagination.totalPages || isTransitioning}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <span>Siguiente</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
});

Pagination.displayName = 'Pagination';

// Componente de animación de fondo optimizado
const BackgroundAnimation = memo(() => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 30,
        repeat: Infinity,
        ease: "linear"
      }}
      className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-emerald-100/20 to-green-100/20 rounded-full blur-3xl"
    />
    <motion.div
      animate={{
        scale: [1.2, 1, 1.2],
        rotate: [360, 180, 0],
      }}
      transition={{
        duration: 35,
        repeat: Infinity,
        ease: "linear"
      }}
      className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-green-100/20 to-emerald-100/20 rounded-full blur-3xl"
    />
    <motion.div
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.2, 0.4, 0.2],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-emerald-50/10 to-green-50/10 rounded-full blur-2xl"
    />
  </div>
));

BackgroundAnimation.displayName = 'BackgroundAnimation';

const AdminUsersModal = ({ isOpen, onClose }: AdminUsersModalProps) => {
  // Use RBAC context for token and userType
  const { userContext } = useRBACContext();

  console.log('🔍 AdminUsersModal userContext:', userContext);
  console.log('🔍 AdminUsersModal userType:', userContext?.userType);

  // Hook de lista optimizada de usuarios - usando el hook personalizado para manejo eficiente
  const {
    people,
    loading,
    searchTerm,
    debouncedSearchTerm,
    selectedArea,
    pagination,
    apiError,
    isPageTransition,
    setSearchTerm,
    setSelectedArea,
    handlePageChange,
    clearSearch,
    clearApiError,
    refreshUsers,
    updatePerson,
  } = useOptimizedUserList({ userType: userContext?.userType });

  // Estados locales para el modal y operaciones específicas
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [cedulaSearch, setCedulaSearch] = useState('');
  const [isSearchingCedula, setIsSearchingCedula] = useState(false);
  const [cedulaError, setCedulaError] = useState('');
  const [operatorInfo, setOperatorInfo] = useState<OperatorInfo | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Helper function to get token consistently
  const getAuthToken = useCallback(() => {
    return localStorage.getItem("accessToken");
  }, []);

  // Función de búsqueda por cédula optimizada
  const searchByCedula = useCallback(async (cedula: string): Promise<OperatorInfo | null> => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("No se encontró el token de acceso");
      }

      const response = await fetch(`/api/admin/search-employee-operations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cedula: cedula.trim() })
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Error al buscar empleado en la base de datos');
      }

      const result = await response.json();

      if (result.success && result.data) {
        const employee = result.data;

        return {
          cedula: employee.f_nit_empl || cedula,
          nombre: employee.f_nombre_empl || '',
          cargo: employee.f_desc_cargo || '',
          fechaIngreso: employee.f_fecha_ingreso || '',
          id: employee.f_nit_empl || cedula,
          foto: `https://admon.sao6.com.co/web/uploads/empleados/${cedula}.jpg`
        };
      }

      return null;
    } catch (error) {
      console.error('Error searching employee by cedula:', error);
      throw error;
    }
  }, []);

  const handleSelectPerson = useCallback(async (person: Person) => {
    setSelectedPerson(person);
    setEditingPerson({ ...person });
    setModalMode('view');
    setShowModal(true);

    // Cargar información adicional del operador de forma asíncrona
    if (person.password) {
      try {
        const info = await searchByCedula(person.password);
        setOperatorInfo(info);
      } catch (error) {
        console.error('Error loading operator info:', error);
      }
    }
  }, [searchByCedula, cedulaSearch]);

  // Función para guardar usuario en MySQL
  const handleSaveUser = useCallback(async () => {
    if (!editingPerson || !operatorInfo) return;

    // Validaciones
    if (!editingPerson.name || !editingPerson.password || editingPerson.password.length !== 4) {
      setCedulaError('Por favor complete todos los campos requeridos y asegúrese de que el código tenga 4 dígitos');
      return;
    }

    setIsSaving(true);
    setCedulaError('');

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("No se encontró el token de acceso");
      }

      const response = await fetch(`/api/admin/create-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editingPerson.name,
          code: editingPerson.password, // código de 4 dígitos
          cedula: operatorInfo.cedula, // cédula será el password
          telefone: editingPerson.telefone || null,
          cargo: editingPerson.cargo || operatorInfo.cargo
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear usuario');
      }

      // Éxito - cerrar modal y mostrar mensaje
      handleCloseModal();
      // Aquí podrías agregar una notificación de éxito
      console.log('Usuario creado exitosamente:', data);

    } catch (error) {
      console.error('Error al guardar usuario:', error);
      setCedulaError(error instanceof Error ? error.message : 'Error al guardar usuario');
    } finally {
      setIsSaving(false);
    }
  }, [editingPerson, operatorInfo]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingPerson(null);
    setSelectedPerson(null);
    setModalMode('view');
    setCedulaSearch('');
    setCedulaError('');
    setIsSearchingCedula(false);
    setOperatorInfo(null);
    setIsSaving(false);
  }, []);

  const handleSearchByCedula = useCallback(async () => {
    if (!cedulaSearch.trim()) {
      setCedulaError('Por favor ingrese una cédula');
      return;
    }

    setIsSearchingCedula(true);
    setCedulaError('');

    try {
      const operatorInfo = await searchByCedula(cedulaSearch.trim());

      if (operatorInfo) {
        // Crear persona basada en la información del operador
        const newPerson: Person = {
          code: operatorInfo.cedula,
          name: operatorInfo.nombre,
          telefone: '',
          password: '', // Campo vacío para que el usuario ingrese el código manualmente
          role: 'employee',
          cargo: operatorInfo.cargo,
          estado: 'activo',
          fechaIngreso: operatorInfo.fechaIngreso,
          avatar: operatorInfo.foto
        };

        setEditingPerson(newPerson);
        setOperatorInfo(operatorInfo);
        setCedulaError('');
      } else {
        setCedulaError('No se encontró ninguna persona con esta cédula');
      }
    } catch (error) {
      setCedulaError('Error al buscar la persona. Intente nuevamente.');
    }

    setIsSearchingCedula(false);
  }, [cedulaSearch, searchByCedula]);

  const handleEditPerson = useCallback(() => {
    setModalMode('edit');
  }, []);

  const handleSavePerson = useCallback(async () => {
    if (!editingPerson) return;

    try {
      if (modalMode === 'create') {
        // Simular creación
        const newPersonWithId = { ...editingPerson, created_at: new Date().toISOString() };
        await refreshUsers();
      } else if (modalMode === 'edit') {
        // Simular actualización
        updatePerson(editingPerson);
        setSelectedPerson(editingPerson);
      }

      setModalMode('view');
    } catch (error) {
      console.error('Error saving person:', error);
      // Aquí podrías mostrar un mensaje de error al usuario
    }
  }, [editingPerson, modalMode, refreshUsers, updatePerson]);

  const handleDeletePerson = useCallback(async (code: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este usuario?')) {
      return;
    }

    try {
      // Simular eliminación
      await refreshUsers();
      setShowModal(false);
    } catch (error) {
      console.error('Error deleting person:', error);
    }
  }, [refreshUsers]);


  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const handleAreaSelect = useCallback((area: string) => {
    setSelectedArea(area);
  }, [setSelectedArea]);

  const PersonModal = useCallback(() => {
    if (!showModal) return null;

    const person = editingPerson;
    if (!person) return null;

    const isEditing = modalMode === 'edit' || modalMode === 'create';
    const isCreating = modalMode === 'create';

    const modalContent = (
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-green-600 p-6 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg ring-4 ring-white/20">
                      <UserAvatar
                        cedula={person.code || ''}
                        alt={person.name || 'Nueva persona'}
                        className="w-full h-full object-cover"
                        defaultAvatar=""
                      />
                    </div>
                    <div className="text-white">
                      <h2 className="text-2xl font-bold">
                        {isCreating ? 'Nueva Persona' : person.name}
                      </h2>
                      <p className="text-emerald-100">
                        {isCreating ? 'Agregar información' : person.cargo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!isCreating && modalMode === 'view' && (
                      <button
                        onClick={handleEditPerson}
                        className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                      >
                        <Edit3 className="h-5 w-5 text-white" />
                      </button>
                    )}
                    {isEditing && (
                      <button
                        onClick={handleSavePerson}
                        disabled={loading}
                        className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Save className="h-5 w-5 text-white" />}
                      </button>
                    )}
                    {!isCreating && modalMode === 'view' && (
                      <button
                        onClick={() => handleDeletePerson(person.code)}
                        disabled={loading}
                        className="p-3 bg-red-500/20 hover:bg-red-500/30 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <X className="h-5 w-5 text-white" />
                      </button>
                    )}
                    <button
                      onClick={handleCloseModal}
                      className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                    >
                      <X className="h-5 w-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Error display */}
                {apiError && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
                  >
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{apiError}</span>
                  </motion.div>
                )}

                {/* Búsqueda por cédula solo en modo crear */}
                {isCreating && !person.name && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-8"
                  >
                    <div className="text-center mb-6">
                      <motion.div
                        animate={{
                          scale: [1, 1.05, 1],
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                      >
                        <Search className="h-10 w-10 text-white" />
                      </motion.div>
                      <h3 className="text-2xl font-bold text-emerald-800 mb-2">Buscar Persona</h3>
                      <p className="text-emerald-600">Ingrese la cédula para buscar en la base de datos</p>
                    </div>

                    <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-emerald-700 mb-2">
                          Número de Cédula
                        </label>
                        <input
                          type="text"
                          value={cedulaSearch}
                          onChange={(e) => setCedulaSearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (cedulaSearch.trim() && !isSearchingCedula) {
                                handleSearchByCedula();
                              }
                            }
                          }}
                          placeholder="Ej: 98765432"
                          className="w-full p-4 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors text-lg"
                          disabled={isSearchingCedula}
                          autoComplete="off"
                        />
                      </div>

                      {cedulaError && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
                        >
                          <AlertCircle className="h-5 w-5 flex-shrink-0" />
                          <span className="font-medium">{cedulaError}</span>
                        </motion.div>
                      )}

                      <button
                        type="button"
                        onClick={handleSearchByCedula}
                        disabled={isSearchingCedula || !cedulaSearch.trim()}
                        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                      >
                        {isSearchingCedula ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Buscando en base de datos...</span>
                          </>
                        ) : (
                          <>
                            <Search className="h-5 w-5" />
                            <span>Buscar Persona</span>
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* Formulario de información */}
                {(person.name || !isCreating) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                          <User className="h-4 w-4 text-emerald-600" />
                          <span>Nombre Completo</span>
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={person.name}
                            onChange={(e) => setEditingPerson(prev => prev ? { ...prev, name: e.target.value } : null)}
                            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors"
                            placeholder="Ingrese el nombre completo"
                          />
                        ) : (
                          <p className="p-3 bg-gray-50 rounded-xl font-semibold text-gray-800">{person.name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                          <CreditCard className="h-4 w-4 text-emerald-600" />
                          <span>Código</span>
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={person.code}
                            onChange={(e) => setEditingPerson(prev => prev ? { ...prev, code: e.target.value } : null)}
                            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors"
                            placeholder="Ej: 12345678"
                            disabled={!isCreating} // Solo editable al crear
                          />
                        ) : (
                          <p className="p-3 bg-gray-50 rounded-xl font-semibold text-gray-800">{person.code}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                          <Briefcase className="h-4 w-4 text-emerald-600" />
                          <span>Cargo</span>
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={person.cargo || ''}
                            onChange={(e) => setEditingPerson(prev => prev ? { ...prev, cargo: e.target.value } : null)}
                            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors"
                            placeholder="Ej: Desarrollador Frontend"
                          />
                        ) : (
                          <p className="p-3 bg-gray-50 rounded-xl font-semibold text-gray-800">{person.cargo || 'No especificado'}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-emerald-600" />
                          <span>Rol</span>
                        </label>
                        {isEditing ? (
                          <select
                            value={person.role}
                            onChange={(e) => setEditingPerson(prev => prev ? { ...prev, role: e.target.value as 'admin' | 'employee' } : null)}
                            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors"
                          >
                            <option value="employee">Empleado</option>
                            <option value="admin">Administrador</option>
                          </select>
                        ) : (
                          <p className="p-3 bg-gray-50 rounded-xl font-semibold text-gray-800">
                            {person.role === 'admin' ? 'Administrador' : 'Empleado'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Información Adicional</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-emerald-600" />
                            <span>Teléfono</span>
                          </label>
                          {isEditing ? (
                            <input
                              type="tel"
                              value={person.telefone || ''}
                              onChange={(e) => setEditingPerson(prev => prev ? { ...prev, telefone: e.target.value } : null)}
                              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors"
                              placeholder="3001234567"
                            />
                          ) : (
                            <p className="p-3 bg-gray-50 rounded-xl text-gray-800">{person.telefone || 'No especificado'}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                            <Lock className="h-4 w-4 text-emerald-600" />
                            <span>Contraseña</span>
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={person.password || ''}
                              onChange={(e) => setEditingPerson(prev => prev ? { ...prev, password: e.target.value } : null)}
                              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors"
                              placeholder="Ingrese la contraseña"
                            />
                          ) : (
                            <p className="p-3 bg-gray-50 rounded-xl text-gray-800">{person.password || 'No especificada'}</p>
                          )}
                        </div>

                        {/* Información del operador si está disponible */}
                        {operatorInfo && (
                          <>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-emerald-600" />
                                <span>Fecha de Ingreso</span>
                              </label>
                              <p className="p-3 bg-gray-50 rounded-xl text-gray-800">{operatorInfo.fechaIngreso}</p>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-emerald-600" />
                                <span>ID Operador</span>
                              </label>
                              <p className="p-3 bg-gray-50 rounded-xl text-gray-800">{operatorInfo.id}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {isEditing && (
                      <div className="flex justify-end space-x-4 pt-6 border-t">
                        <button
                          onClick={() => setModalMode('view')}
                          disabled={loading}
                          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSavePerson}
                          disabled={loading}
                          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all font-semibold shadow-lg disabled:opacity-50 flex items-center space-x-2"
                        >
                          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                          <span>{isCreating ? 'Crear Persona' : 'Guardar Cambios'}</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );

    return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
  }, [showModal, editingPerson, modalMode, handleCloseModal, handleEditPerson, loading, handleSavePerson, handleDeletePerson, apiError, cedulaSearch, isSearchingCedula, cedulaError, handleSearchByCedula, operatorInfo]);

  if (loading && people.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
          <div className="relative">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-lg"
            >
              <Database className="h-12 w-12 text-white" />
            </motion.div>
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-emerald-200 border-t-emerald-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            ></motion.div>
          </div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-xl font-medium text-emerald-700"
          >
            Cargando usuarios...
          </motion.h2>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 relative">
      <BackgroundAnimation />

      {/* Header - Fixed with higher z-index */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg"
              >
                <Database className="h-8 w-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
                <p className="text-gray-600">Administra los usuarios del sistema</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setCedulaSearch('');
                  setCedulaError('');
                  setIsSearchingCedula(false);
                  setOperatorInfo(null);
                  const newPerson: Person = {
                    code: '',
                    name: '',
                    telefone: '',
                    password: '',
                    role: 'employee',
                    cargo: '',
                    estado: 'activo',
                    avatar: ''
                  };
                  setEditingPerson(newPerson);
                  setSelectedPerson(null);
                  setModalMode('create');
                  setShowModal(true);
                }}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all font-semibold shadow-lg"
              >
                <UserPlus className="h-5 w-5" />
                <span>Agregar Usuario</span>
              </button>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total de usuarios</p>
                <p className="text-2xl font-bold text-emerald-600">{pagination.total}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content - Add top padding to account for fixed header */}
      <div className="pt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Error display */}
        {apiError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="font-medium">{apiError}</span>
            <button
              onClick={clearApiError}
              className="ml-auto p-1 hover:bg-red-100 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* Search and Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-emerald-100 p-6">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-6 w-6 text-emerald-500" />
              <input
                type="text"
                placeholder="Buscar por nombre, código o cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-12 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all duration-300 text-lg"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleFilters}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filtros</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>

                {(searchTerm || selectedArea !== 'Todas') && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={clearSearch}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    <span>Limpiar</span>
                  </motion.button>
                )}
              </div>

              <div className="text-sm text-gray-600">
                <span className="font-semibold text-emerald-600">{pagination.total}</span>
                {pagination.total === 1 ? ' usuario encontrado' : ' usuarios encontrados'}
              </div>
            </div>

            {/* Filter Options */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 pt-6 border-t border-gray-200"
                >
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-medium text-gray-700 mr-4 py-2">Área:</span>
                    {areas.map((area) => (
                      <button
                        key={area}
                        onClick={() => handleAreaSelect(area)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedArea === area
                          ? 'bg-emerald-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-600 hover:bg-emerald-100 hover:text-emerald-700'
                          }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* People Grid */}
        <motion.div
          className="relative"
        >
          {/* Overlay de transición de página */}
          <AnimatePresence>
            {isPageTransition && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl"
              >
                <div className="flex flex-col items-center space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full"
                  />
                  <p className="text-emerald-600 font-medium">Cargando página...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-opacity duration-300 ${isPageTransition ? 'opacity-50' : 'opacity-100'
              }`}
          >
            <AnimatePresence>
              {people.map((person, index) => (
                <PersonCard
                  key={person.code}
                  person={person}
                  index={index}
                  onSelect={handleSelectPerson}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Pagination */}
        <Pagination pagination={pagination} onPageChange={handlePageChange} isTransitioning={isPageTransition} />

        {/* No Results */}
        {people.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-32 h-32 bg-gradient-to-br from-emerald-200 to-green-300 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl"
            >
              <Search className="h-16 w-16 text-emerald-700" />
            </motion.div>
            <h3 className="text-3xl font-bold text-gray-700 mb-4">No se encontraron usuarios</h3>
            <p className="text-gray-500 text-xl mb-6">Intenta con otros términos de búsqueda</p>
            <button
              onClick={clearSearch}
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-semibold"
            >
              Limpiar filtros
            </button>
          </motion.div>
        )}
      </div>

      {/* Modal */}
      <PersonModalComponent
        showModal={showModal}
        editingPerson={editingPerson}
        modalMode={modalMode}
        handleCloseModal={handleCloseModal}
        handleEditPerson={handleEditPerson}
        loading={loading}
        handleSavePerson={handleSavePerson}
        handleDeletePerson={handleDeletePerson}
        apiError={apiError}
        cedulaSearch={cedulaSearch}
        setCedulaSearch={setCedulaSearch}
        isSearchingCedula={isSearchingCedula}
        cedulaError={cedulaError}
        handleSearchByCedula={handleSearchByCedula}
        operatorInfo={operatorInfo}
        handleSaveUser={handleSaveUser}
        isSaving={isSaving}
        setEditingPerson={setEditingPerson}
      />
    </div>
  );
}

export default AdminUsersModal;
