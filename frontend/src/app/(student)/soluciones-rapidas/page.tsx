'use client';

import { useState } from 'react';
import { useQuickSolutions } from '@/hooks/useQuickSolutions';
import {
  Search,
  BookOpen,
  Eye,
  ThumbsUp,
  X,
  CheckCircle,
  Lightbulb,
  Filter,
  FileText,
  Calendar,
  FileCheck,
  CreditCard,
  Award,
  ClipboardList,
  Library,
  Monitor,
  RefreshCw,
} from 'lucide-react';
import { QuickSolution } from '@/types/quickSolutions';
import { cn } from '@/lib/Utils';

// Estilos para scrollbar personalizado
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f5f5f5;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #dee1e6;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #c0c4cc;
  }
`;

// Mapeo de iconos por categoría
const categoryIcons: Record<string, React.ReactNode> = {
  matricula: <FileText className="w-5 h-5" />,
  horarios: <Calendar className="w-5 h-5" />,
  examenes: <FileCheck className="w-5 h-5" />,
  pagos: <CreditCard className="w-5 h-5" />,
  certificados: <Award className="w-5 h-5" />,
  tramites: <ClipboardList className="w-5 h-5" />,
  biblioteca: <Library className="w-5 h-5" />,
  plataforma: <Monitor className="w-5 h-5" />,
};

// Colores por categoría - Usando la paleta del proyecto
const categoryColors: Record<string, string> = {
  matricula: 'bg-primary/10 text-primary border-primary/20',
  horarios: 'bg-primary/10 text-primary border-primary/20',
  examenes: 'bg-primary/10 text-primary border-primary/20',
  pagos: 'bg-primary/10 text-primary border-primary/20',
  certificados: 'bg-primary/10 text-primary border-primary/20',
  tramites: 'bg-primary/10 text-primary border-primary/20',
  biblioteca: 'bg-primary/10 text-primary border-primary/20',
  plataforma: 'bg-primary/10 text-primary border-primary/20',
};

export default function QuickSolutionsPage() {
  const {
    solutions,
    categories,
    loading,
    error,
    totalCount,
    selectedCategory,
    searchTerm,
    loadSolutions,
    getSolutionDetails,
    registerView,
    markAsHelpful,
    filterByCategory,
    search,
    clearFilters,
  } = useQuickSolutions();

  const [selectedSolution, setSelectedSolution] =
    useState<QuickSolution | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [markedHelpful, setMarkedHelpful] = useState<Set<string>>(new Set());

  /**
   * Recargar soluciones
   */
  const handleRefresh = () => {
    loadSolutions();
  };

  /**
   * Abrir modal con detalles de solución
   */
  const handleOpenSolution = async (solutionId: string) => {
    setLoadingDetails(true);
    setShowModal(true);

    try {
      const details = await getSolutionDetails(solutionId);
      if (details) {
        setSelectedSolution(details);
        await registerView(solutionId);
      }
    } catch (err) {
      console.error('Error loading solution details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  /**
   * Cerrar modal
   */
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSolution(null);
  };

  /**
   * Marcar como útil
   */
  const handleMarkHelpful = async () => {
    if (!selectedSolution || markedHelpful.has(selectedSolution.id)) return;

    try {
      await markAsHelpful(selectedSolution.id);
      setMarkedHelpful((prev) => new Set(prev).add(selectedSolution.id));

      // Actualizar el contador localmente
      setSelectedSolution({
        ...selectedSolution,
        helpful_count: selectedSolution.helpful_count + 1,
      });
    } catch (err) {
      console.error('Error marking as helpful:', err);
    }
  };

  return (
    <>
      <style jsx>{scrollbarStyles}</style>
      <div className="h-full overflow-y-auto bg-white">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-dark mb-2">
                  Soluciones Rápidas
                </h1>
                <p className="text-dark">
                  Encuentra soluciones a problemas comunes basadas en casos
                  anteriores
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className={cn(
                  'flex items-center gap-2 px-4 py-2',
                  'bg-white border border-gray-300 text-dark rounded-lg',
                  'hover:bg-gray-50 transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                title="Actualizar soluciones"
              >
                <RefreshCw
                  className={cn('w-5 h-5', loading && 'animate-spin')}
                />
                Actualizar
              </button>
            </div>

            {/* Barra de búsqueda */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark/40 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por palabra clave..."
                value={searchTerm}
                onChange={(e) => search(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white text-dark placeholder:text-dark/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - Filtros */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 bg-white rounded-xl shadow-sm border border-gray/20 overflow-hidden max-h-[calc(100vh-8rem)]">
                <div className="p-6 border-b border-gray/20 bg-light flex-shrink-0">
                  <h2 className="text-lg font-semibold text-dark flex items-center gap-2">
                    <Filter className="w-5 h-5 text-primary" />
                    Categorías
                  </h2>
                  {selectedCategory && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-primary hover:text-secondary transition-colors font-medium mt-2"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>

                <div className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-16rem)] custom-scrollbar">
                  {/* Todas las categorías */}
                  <button
                    onClick={() => filterByCategory(null)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between font-medium ${
                      !selectedCategory
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-light hover:bg-gray/20 text-dark border border-gray/20'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Todas
                    </span>
                    <span className="text-sm font-semibold">{totalCount}</span>
                  </button>

                  {/* Categorías individuales */}
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => filterByCategory(category.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between font-medium ${
                        selectedCategory === category.id
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-light hover:bg-gray/20 text-dark border border-gray/20'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {categoryIcons[category.id] || (
                          <BookOpen className="w-4 h-4" />
                        )}
                        {category.name}
                      </span>
                      <span className="text-sm font-semibold">
                        {category.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content - Lista de soluciones */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="bg-error/10 border border-error/30 rounded-lg p-4 text-error">
                  <p className="font-semibold">Error al cargar soluciones</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              ) : solutions.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray/20">
                  <BookOpen className="w-16 h-16 text-gray/40 mx-auto mb-4" />
                  <p className="text-dark text-lg font-semibold">
                    No se encontraron soluciones
                  </p>
                  <p className="text-dark/60 text-sm mt-2">
                    Intenta ajustar los filtros o la búsqueda
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {solutions.map((solution) => (
                    <div
                      key={solution.id}
                      onClick={() => handleOpenSolution(solution.id)}
                      className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all cursor-pointer border border-gray/20 hover:border-primary/40 group flex flex-col h-[280px]"
                    >
                      {/* Categoría badge */}
                      <div className="mb-3 flex-shrink-0">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                            categoryColors[solution.category] ||
                            'bg-gray/20 text-dark border-gray/30'
                          }`}
                        >
                          {categoryIcons[solution.category]}
                          {categories.find((c) => c.id === solution.category)
                            ?.name || solution.category}
                        </span>
                      </div>

                      {/* Título */}
                      <h3 className="text-lg font-bold text-dark mb-2 line-clamp-2 group-hover:text-primary transition-colors flex-shrink-0">
                        {solution.title}
                      </h3>

                      {/* Descripción del problema */}
                      <p className="text-dark/70 text-sm mb-4 line-clamp-2 flex-shrink-0">
                        {solution.problem_description}
                      </p>

                      {/* Tags */}
                      <div className="flex-1 min-h-0 mb-4">
                        {solution.tags && solution.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {solution.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-light text-dark/70 text-xs rounded border border-gray/20 font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                            {solution.tags.length > 3 && (
                              <span className="px-2 py-1 bg-light text-dark/70 text-xs rounded border border-gray/20 font-medium">
                                +{solution.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Estadísticas */}
                      <div className="flex items-center gap-4 text-sm text-dark/60 pt-4 border-t border-gray/20 flex-shrink-0 mt-auto">
                        <span className="flex items-center gap-1.5">
                          <Eye className="w-4 h-4 text-primary" />
                          <span className="font-semibold">
                            {solution.views_count}
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <ThumbsUp className="w-4 h-4 text-success" />
                          <span className="font-semibold">
                            {solution.helpful_count}
                          </span>
                        </span>
                        <span className="ml-auto text-primary font-bold group-hover:text-secondary transition-colors">
                          Ver solución →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal de detalles */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
              {/* Header del modal */}
              <div className="bg-primary text-white p-6 flex items-start justify-between">
                <div className="flex-1">
                  {selectedSolution && (
                    <>
                      <div className="mb-2">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white border border-white/30`}
                        >
                          {categoryIcons[selectedSolution.category]}
                          {categories.find(
                            (c) => c.id === selectedSolution.category
                          )?.name || selectedSolution.category}
                        </span>
                      </div>
                      <h2 className="text-2xl font-bold text-white">
                        {selectedSolution.title}
                      </h2>
                      <p className="text-white/90 mt-2">
                        {selectedSolution.problem_description}
                      </p>
                    </>
                  )}
                </div>
                <button
                  onClick={handleCloseModal}
                  className="ml-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Contenido del modal */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {loadingDetails ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : selectedSolution ? (
                  <>
                    {/* Pasos de la solución */}
                    <div className="space-y-4 mb-6">
                      <h3 className="text-lg font-semibold text-dark flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-success" />
                        Pasos para resolver:
                      </h3>

                      {selectedSolution.solution_steps.map((step, idx) => (
                        <div
                          key={idx}
                          className="flex gap-4 p-4 bg-light rounded-lg border border-gray/30"
                        >
                          <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold text-sm">
                            {step.step}
                          </div>
                          <div className="flex-1">
                            <p className="text-dark font-medium mb-1">
                              {step.description}
                            </p>
                            {step.tip && (
                              <div className="flex items-start gap-2 mt-2 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                                <Lightbulb className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-dark">
                                  <span className="font-semibold">
                                    Consejo:
                                  </span>{' '}
                                  {step.tip}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tags */}
                    {selectedSolution.tags &&
                      selectedSolution.tags.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-sm font-semibold text-dark mb-2">
                            Etiquetas relacionadas:
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedSolution.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-gray/20 text-dark text-sm rounded-full border border-gray/30"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Estadísticas y feedback */}
                    <div className="border-t border-gray/30 pt-6">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-6 text-sm text-dark/70">
                          <span className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-primary" />
                            <span className="font-medium">
                              {selectedSolution.views_count}
                            </span>{' '}
                            visualizaciones
                          </span>
                          <span className="flex items-center gap-2">
                            <ThumbsUp className="w-4 h-4 text-success" />
                            <span className="font-medium">
                              {selectedSolution.helpful_count}
                            </span>{' '}
                            útiles
                          </span>
                        </div>

                        <button
                          onClick={handleMarkHelpful}
                          disabled={markedHelpful.has(selectedSolution.id)}
                          className={`px-5 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 shadow-sm ${
                            markedHelpful.has(selectedSolution.id)
                              ? 'bg-success/10 text-success border border-success/30 cursor-not-allowed'
                              : 'bg-secondary hover:bg-secondary-dark text-white hover:shadow-md'
                          }`}
                        >
                          <ThumbsUp className="w-4 h-4" />
                          {markedHelpful.has(selectedSolution.id)
                            ? '¡Gracias!'
                            : 'Me fue útil'}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-dark/60">
                    <p className="font-semibold">
                      No se pudieron cargar los detalles
                    </p>
                    <p className="text-sm mt-2">Intenta nuevamente más tarde</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
