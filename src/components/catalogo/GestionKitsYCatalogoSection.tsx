import React, { useState, useEffect } from 'react';
import { sacService } from '../../services/sacService';
import { ItemAyuda, CategoriaAyuda, KitComponente } from '../../types/sac.types';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles,
  Layers,
  Utensils,
  Baby,
  HeartPulse,
  Home,
  Hammer,
  Truck,
  Check,
  X,
  AlertCircle,
  Coins,
  ShieldCheck,
  Loader2
} from 'lucide-react';

interface Props {
  showToast: (msg: string, type?: 'success' | 'error' | 'warning') => void;
}

export const GestionKitsYCatalogoSection: React.FC<Props> = ({ showToast }) => {
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<CategoriaAyuda[]>([]);
  const [kits, setKits] = useState<ItemAyuda[]>([]);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedKitIds, setExpandedKitIds] = useState<number[]>([]);

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    id_categoria: null as number | null,
    nombre_categoria: '',
    descripcion: '',
    icono: 'Package'
  });

  const [isKitModalOpen, setIsKitModalOpen] = useState(false);
  const [kitForm, setKitForm] = useState({
    id_item: null as number | null,
    id_categoria: 1,
    codigo_item: '',
    nombre_item: '',
    unidad_medida: 'Kit',
    stock_disponible: 100,
    costo_referencia: 0,
    descripcion: '',
    es_kit: true,
    permite_personalizacion: true,
    componentes: [] as Array<{
      nombre_componente: string;
      descripcion?: string;
      cantidad_estandar: number;
      unidad_medida: string;
      es_obligatorio: boolean;
    }>
  });

  // Modal for adding a component directly to an existing kit
  const [isComponentModalOpen, setIsComponentModalOpen] = useState(false);
  const [activeKitId, setActiveKitId] = useState<number | null>(null);
  const [componentForm, setComponentForm] = useState({
    id_componente: null as number | null,
    nombre_componente: '',
    descripcion: '',
    cantidad_estandar: 1,
    unidad_medida: 'UNIDAD',
    es_obligatorio: true,
    orden: 0
  });

  const fetchCategorias = async () => {
    try {
      const data = await sacService.getCategorias(true);
      setCategorias(data);
      if (data.length > 0 && selectedCategoriaId === null) {
        // keep null as "All"
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchKits = async () => {
    setLoading(true);
    try {
      const data = await sacService.getItems(selectedCategoriaId || undefined);
      setKits(data);
    } catch (err: any) {
      showToast('Error al cargar catálogo de kits', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  useEffect(() => {
    fetchKits();
  }, [selectedCategoriaId]);

  const toggleExpand = async (id_item: number) => {
    if (expandedKitIds.includes(id_item)) {
      setExpandedKitIds(expandedKitIds.filter(id => id !== id_item));
    } else {
      setExpandedKitIds([...expandedKitIds, id_item]);
      // Load detailed components if not loaded
      try {
        const detail = await sacService.getItemDetalle(id_item);
        setKits(prev => prev.map(k => (k.id_item === id_item ? { ...k, componentes: detail.componentes } : k)));
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Helper icon selector
  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Utensils': return <Utensils className="h-4 w-4" />;
      case 'Baby': return <Baby className="h-4 w-4" />;
      case 'HeartPulse': return <HeartPulse className="h-4 w-4" />;
      case 'Home': return <Home className="h-4 w-4" />;
      case 'Hammer': return <Hammer className="h-4 w-4" />;
      case 'Truck': return <Truck className="h-4 w-4" />;
      case 'Sparkles': return <Sparkles className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  // Format currency
  const formatCOP = (val?: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Handlers for Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.nombre_categoria.trim()) {
      showToast('El nombre de la categoría es obligatorio', 'warning');
      return;
    }
    try {
      if (categoryForm.id_categoria) {
        await sacService.actualizarCategoria(categoryForm.id_categoria, categoryForm);
        showToast('Categoría actualizada exitosamente');
      } else {
        await sacService.crearCategoria(categoryForm);
        showToast('Categoría creada exitosamente');
      }
      setIsCategoryModalOpen(false);
      setCategoryForm({ id_categoria: null, nombre_categoria: '', descripcion: '', icono: 'Package' });
      fetchCategorias();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Error al guardar categoría', 'error');
    }
  };

  // Handlers for Kit
  const handleOpenCreateKit = () => {
    setKitForm({
      id_item: null,
      id_categoria: categorias[0]?.id_categoria || 1,
      codigo_item: `KIT-${new Date().getFullYear()}-${Math.floor(Math.random() * 899 + 100)}`,
      nombre_item: '',
      unidad_medida: 'Kit',
      stock_disponible: 50,
      costo_referencia: 0,
      descripcion: '',
      es_kit: true,
      permite_personalizacion: true,
      componentes: []
    });
    setIsKitModalOpen(true);
  };

  const handleOpenEditKit = async (kit: ItemAyuda) => {
    try {
      const detail = await sacService.getItemDetalle(kit.id_item);
      setKitForm({
        id_item: detail.id_item,
        id_categoria: detail.id_categoria,
        codigo_item: detail.codigo_item,
        nombre_item: detail.nombre_item,
        unidad_medida: detail.unidad_medida,
        stock_disponible: detail.stock_disponible,
        costo_referencia: detail.costo_referencia || 0,
        descripcion: detail.descripcion || '',
        es_kit: detail.es_kit ?? true,
        permite_personalizacion: detail.permite_personalizacion ?? true,
        componentes: (detail.componentes || []).map(c => ({
          nombre_componente: c.nombre_componente,
          descripcion: c.descripcion || '',
          cantidad_estandar: c.cantidad_estandar,
          unidad_medida: c.unidad_medida,
          es_obligatorio: c.es_obligatorio
        }))
      });
      setIsKitModalOpen(true);
    } catch (err) {
      showToast('Error al cargar datos del kit', 'error');
    }
  };

  const handleSaveKit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kitForm.nombre_item.trim() || !kitForm.codigo_item.trim()) {
      showToast('Código y Nombre del kit son obligatorios', 'warning');
      return;
    }
    try {
      if (kitForm.id_item) {
        await sacService.actualizarItem(kitForm.id_item, kitForm);
        showToast('Kit actualizado con éxito');
      } else {
        await sacService.crearItem(kitForm);
        showToast('Kit creado con éxito');
      }
      setIsKitModalOpen(false);
      fetchKits();
      fetchCategorias();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Error al guardar el kit', 'error');
    }
  };

  const handleDeleteKit = async (id_item: number, nombre: string) => {
    if (!window.confirm(`¿Estás seguro de desactivar el kit "${nombre}"?`)) return;
    try {
      await sacService.eliminarItem(id_item);
      showToast('Kit desactivado');
      fetchKits();
      fetchCategorias();
    } catch (err: any) {
      showToast('Error al desactivar el kit', 'error');
    }
  };

  // Handlers for Sub-Components
  const handleOpenAddComponent = (id_item: number) => {
    setActiveKitId(id_item);
    setComponentForm({
      id_componente: null,
      nombre_componente: '',
      descripcion: '',
      cantidad_estandar: 1,
      unidad_medida: 'UNIDAD',
      es_obligatorio: true,
      orden: 0
    });
    setIsComponentModalOpen(true);
  };

  const handleOpenEditComponent = (id_item: number, comp: KitComponente) => {
    setActiveKitId(id_item);
    setComponentForm({
      id_componente: comp.id_componente || null,
      nombre_componente: comp.nombre_componente,
      descripcion: comp.descripcion || '',
      cantidad_estandar: comp.cantidad_estandar,
      unidad_medida: comp.unidad_medida,
      es_obligatorio: comp.es_obligatorio,
      orden: comp.orden || 0
    });
    setIsComponentModalOpen(true);
  };

  const handleSaveComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!componentForm.nombre_componente.trim()) {
      showToast('El nombre del componente es obligatorio', 'warning');
      return;
    }
    if (!activeKitId) return;

    try {
      if (componentForm.id_componente) {
        await sacService.actualizarComponenteKit(componentForm.id_componente, componentForm);
        showToast('Componente actualizado');
      } else {
        await sacService.agregarComponenteKit(activeKitId, componentForm);
        showToast('Componente agregado al kit');
      }
      setIsComponentModalOpen(false);
      // Reload this kit detail
      const detail = await sacService.getItemDetalle(activeKitId);
      setKits(prev => prev.map(k => (k.id_item === activeKitId ? { ...k, componentes: detail.componentes, cantidad_componentes: detail.componentes?.length } : k)));
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Error al guardar el componente', 'error');
    }
  };

  const handleDeleteComponent = async (id_kit: number, id_componente: number, nombre: string) => {
    if (!window.confirm(`¿Eliminar el componente "${nombre}" de este kit?`)) return;
    try {
      await sacService.eliminarComponenteKit(id_componente);
      showToast('Componente eliminado');
      const detail = await sacService.getItemDetalle(id_kit);
      setKits(prev => prev.map(k => (k.id_item === id_kit ? { ...k, componentes: detail.componentes, cantidad_componentes: detail.componentes?.length } : k)));
    } catch (err: any) {
      showToast('Error al eliminar componente', 'error');
    }
  };

  // Filtered kits
  const filteredKits = kits.filter(k => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      k.nombre_item.toLowerCase().includes(q) ||
      k.codigo_item.toLowerCase().includes(q) ||
      k.nombre_categoria.toLowerCase().includes(q) ||
      (k.descripcion || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header institucional */}
      <div className="bg-white rounded-2xl p-6 border border-[#E5E5EA] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-[#007AFF]/10 text-[#007AFF]">
              <Package className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-bold text-[#1D1D1F]">
              Catálogo de Kits y Ayudas Humanitarias
            </h2>
          </div>
          <p className="text-sm text-[#6E6E73]">
            Módulo oficial de gestión para el Administrador, Coordinador UNGRD y Alcalde. Define categorías, costos de referencia y desglose detallado de kits (ej. pañales por tallas, vajilla, etc.).
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setCategoryForm({ id_categoria: null, nombre_categoria: '', descripcion: '', icono: 'Package' });
              setIsCategoryModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] text-xs font-semibold transition cursor-pointer shadow-2xs"
          >
            <Plus className="h-4 w-4 text-[#007AFF]" />
            <span>Nueva Categoría</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateKit}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-bold transition cursor-pointer shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Crear Nuevo Kit</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros: Categorías y Buscador */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Pills de categorías con conteo */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategoriaId(null)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategoriaId === null
                  ? 'bg-[#1D1D1F] text-white shadow-xs'
                  : 'bg-white border border-[#E5E5EA] text-[#6E6E73] hover:bg-[#F5F5F7]'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Todas las Categorías</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-current">
                {kits.length}
              </span>
            </button>

            {categorias.map(cat => (
              <button
                key={cat.id_categoria}
                type="button"
                onClick={() => setSelectedCategoriaId(cat.id_categoria)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategoriaId === cat.id_categoria
                    ? 'bg-[#007AFF] text-white shadow-xs'
                    : 'bg-white border border-[#E5E5EA] text-[#1D1D1F] hover:bg-[#F5F5F7]'
                }`}
              >
                {getCategoryIcon(cat.icono)}
                <span>{cat.nombre_categoria}</span>
                {cat.cantidad_items !== undefined && (
                  <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                    selectedCategoriaId === cat.id_categoria ? 'bg-white/25 text-white' : 'bg-[#F5F5F7] text-[#6E6E73]'
                  }`}>
                    {cat.cantidad_items}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Buscador */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868B]" />
            <input
              type="text"
              placeholder="Buscar kit o código..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#D2D2D7] rounded-xl pl-9 pr-3 py-2 text-xs text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/15 transition"
            />
          </div>
        </div>
      </div>

      {/* Lista de Kits */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-[#E5E5EA] flex flex-col items-center justify-center text-center">
          <Loader2 className="h-8 w-8 text-[#007AFF] animate-spin mb-3" />
          <p className="text-sm font-semibold text-[#1D1D1F]">Cargando catálogo oficial...</p>
        </div>
      ) : filteredKits.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-[#E5E5EA] text-center">
          <Package className="h-10 w-10 text-[#86868B] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#1D1D1F]">No se encontraron kits</h3>
          <p className="text-xs text-[#6E6E73] mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No hay resultados que coincidan con la búsqueda actual.'
              : 'Esta categoría aún no tiene kits creados. Haz clic en "Crear Nuevo Kit" para empezar.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredKits.map(kit => {
            const isExpanded = expandedKitIds.includes(kit.id_item);
            return (
              <div
                key={kit.id_item}
                className="bg-white rounded-2xl border border-[#E5E5EA] hover:border-[#D2D2D7] transition shadow-2xs overflow-hidden"
              >
                {/* Encabezado del Kit Card */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-[#F5F5F7] to-[#E8E8ED] border border-[#D2D2D7] text-[#007AFF] shrink-0">
                      {getCategoryIcon(kit.icono_categoria)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20">
                          {kit.codigo_item}
                        </span>
                        <span className="text-[11px] font-medium text-[#86868B]">
                          • {kit.nombre_categoria}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#34C759]/10 text-[#34C759]">
                          Stock: {kit.stock_disponible} {kit.unidad_medida}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-[#1D1D1F] mt-1 truncate">
                        {kit.nombre_item}
                      </h3>

                      {kit.descripcion && (
                        <p className="text-xs text-[#6E6E73] mt-0.5 line-clamp-1">
                          {kit.descripcion}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Acciones y Costo */}
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-[#86868B] tracking-wider">
                        Costo de Referencia
                      </div>
                      <div className="text-sm font-extrabold text-[#1D1D1F]">
                        {formatCOP(kit.costo_referencia)}
                      </div>
                    </div>

                    <div className="h-8 w-[1px] bg-[#E5E5EA] hidden sm:block" />

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenAddComponent(kit.id_item)}
                        title="Agregar componente al kit"
                        className="p-2 rounded-xl text-[#007AFF] hover:bg-[#007AFF]/10 border border-[#007AFF]/20 transition cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditKit(kit)}
                        title="Editar kit"
                        className="p-2 rounded-xl text-[#1D1D1F] hover:bg-[#F5F5F7] border border-[#D2D2D7] transition cursor-pointer"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteKit(kit.id_item, kit.nombre_item)}
                        title="Desactivar kit"
                        className="p-2 rounded-xl text-[#FF3B30] hover:bg-[#FF3B30]/10 border border-[#FF3B30]/20 transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleExpand(kit.id_item)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                          isExpanded
                            ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]'
                            : 'bg-[#F5F5F7] text-[#1D1D1F] border-[#D2D2D7] hover:bg-[#E8E8ED]'
                        }`}
                      >
                        <span>{kit.cantidad_componentes ?? kit.componentes?.length ?? 0} componentes</span>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Desglose de componentes (Accordion) */}
                {isExpanded && (
                  <div className="border-t border-[#E5E5EA] bg-[#FBFBFD] p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">
                          Componentes y Desglose del Kit
                        </h4>
                        <p className="text-[11px] text-[#6E6E73]">
                          Lista de ítems específicos que conforman este kit al momento de la entrega en campo.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenAddComponent(kit.id_item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#007AFF] text-[#007AFF] hover:bg-[#007AFF]/5 text-[11px] font-bold transition cursor-pointer shadow-2xs"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Añadir Componente</span>
                      </button>
                    </div>

                    {!kit.componentes || kit.componentes.length === 0 ? (
                      <div className="bg-white rounded-xl p-6 border border-[#E5E5EA] text-center">
                        <AlertCircle className="h-6 w-6 text-[#86868B] mx-auto mb-1.5" />
                        <p className="text-xs font-semibold text-[#1D1D1F]">
                          Este kit aún no tiene componentes desglosados
                        </p>
                        <p className="text-[11px] text-[#6E6E73] mt-0.5">
                          Haz clic en "+ Añadir Componente" para detallar los sub-ítems (ej. tallas de pañales, ollas, platos, etc.).
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl border border-[#E5E5EA] overflow-hidden shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-[#F5F5F7] border-b border-[#E5E5EA] text-[#6E6E73] font-bold text-[10px] uppercase tracking-wider">
                              <th className="py-2.5 px-4">Componente</th>
                              <th className="py-2.5 px-4">Descripción / Especificación</th>
                              <th className="py-2.5 px-4 text-center">Cantidad Estándar</th>
                              <th className="py-2.5 px-4 text-center">Unidad</th>
                              <th className="py-2.5 px-4 text-center">Condición</th>
                              <th className="py-2.5 px-4 text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E5E5EA]">
                            {kit.componentes.map((comp, idx) => (
                              <tr key={comp.id_componente || idx} className="hover:bg-[#FBFBFD] transition">
                                <td className="py-2.5 px-4 font-bold text-[#1D1D1F]">
                                  {comp.nombre_componente}
                                </td>
                                <td className="py-2.5 px-4 text-[#6E6E73] text-[11px]">
                                  {comp.descripcion || '—'}
                                </td>
                                <td className="py-2.5 px-4 text-center font-bold text-[#1D1D1F]">
                                  {comp.cantidad_estandar}
                                </td>
                                <td className="py-2.5 px-4 text-center">
                                  <span className="px-2 py-0.5 rounded-md bg-[#F5F5F7] text-[#1D1D1F] text-[10px] font-mono">
                                    {comp.unidad_medida}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 text-center">
                                  {comp.es_obligatorio ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#34C759]/10 text-[#34C759]">
                                      <Check className="h-3 w-3" /> Obligatorio
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF9500]/10 text-[#FF9500]">
                                      Opcional / Por Etapa
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditComponent(kit.id_item, comp)}
                                      className="p-1.5 text-[#6E6E73] hover:text-[#007AFF] hover:bg-[#F5F5F7] rounded-lg transition"
                                      title="Editar componente"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteComponent(kit.id_item, comp.id_componente!, comp.nombre_componente)}
                                      className="p-1.5 text-[#6E6E73] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg transition"
                                      title="Eliminar componente"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------------------------------------------------
          MODAL: CREAR / EDITAR CATEGORÍA
      --------------------------------------------------------- */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E5E5EA] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
              <h3 className="text-base font-bold text-[#1D1D1F]">
                {categoryForm.id_categoria ? 'Editar Categoría de Ayuda' : 'Nueva Categoría de Ayuda'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] rounded-full transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-[#1D1D1F] mb-1">
                  Nombre de la Categoría *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Nutricional y Alimentos, Infantil, Hábitat..."
                  value={categoryForm.nombre_categoria}
                  onChange={e => setCategoryForm({ ...categoryForm, nombre_categoria: e.target.value })}
                  className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#007AFF] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1D1D1F] mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  placeholder="Breve propósito de esta categoría de ayudas..."
                  value={categoryForm.descripcion}
                  onChange={e => setCategoryForm({ ...categoryForm, descripcion: e.target.value })}
                  className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3.5 py-2 text-xs text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#007AFF] transition resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1D1D1F] mb-1">
                  Ícono Representativo
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'Utensils', label: 'Cocina' },
                    { id: 'Baby', label: 'Bebé' },
                    { id: 'Sparkles', label: 'Aseo' },
                    { id: 'Home', label: 'Hábitat' },
                    { id: 'HeartPulse', label: 'Salud' },
                    { id: 'Hammer', label: 'Materiales' },
                    { id: 'Truck', label: 'Vías' },
                    { id: 'Package', label: 'General' }
                  ].map(ico => (
                    <button
                      key={ico.id}
                      type="button"
                      onClick={() => setCategoryForm({ ...categoryForm, icono: ico.id })}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        categoryForm.icono === ico.id
                          ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]'
                          : 'border-[#E5E5EA] bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#E8E8ED]'
                      }`}
                    >
                      {getCategoryIcon(ico.id)}
                      <span className="text-[10px]">{ico.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E6E73] hover:bg-[#F5F5F7] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-bold transition shadow-xs"
                >
                  Guardar Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------
          MODAL: CREAR / EDITAR KIT DE AYUDA
      --------------------------------------------------------- */}
      {isKitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#E5E5EA] shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
              <h3 className="text-base font-bold text-[#1D1D1F]">
                {kitForm.id_item ? 'Editar Kit de Ayuda' : 'Crear Nuevo Kit de Ayuda'}
              </h3>
              <button
                type="button"
                onClick={() => setIsKitModalOpen(false)}
                className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] rounded-full transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveKit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1D1D1F] mb-1">
                    Código del Kit *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. KIT-COC-01"
                    value={kitForm.codigo_item}
                    onChange={e => setKitForm({ ...kitForm, codigo_item: e.target.value.toUpperCase() })}
                    className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3.5 py-2 text-xs font-mono text-[#1D1D1F] uppercase focus:bg-white focus:outline-none focus:border-[#007AFF] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1D1D1F] mb-1">
                    Categoría *
                  </label>
                  <select
                    value={kitForm.id_categoria}
                    onChange={e => setKitForm({ ...kitForm, id_categoria: Number(e.target.value) })}
                    className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3.5 py-2 text-xs text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#007AFF] transition"
                  >
                    {categorias.map(c => (
                      <option key={c.id_categoria} value={c.id_categoria}>
                        {c.nombre_categoria}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1D1D1F] mb-1">
                  Nombre del Kit / Ayuda *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Kit de Bebé y Primera Infancia"
                  value={kitForm.nombre_item}
                  onChange={e => setKitForm({ ...kitForm, nombre_item: e.target.value })}
                  className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3.5 py-2 text-xs text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#007AFF] transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1D1D1F] mb-1">
                    Unidad de Medida
                  </label>
                  <select
                    value={kitForm.unidad_medida}
                    onChange={e => setKitForm({ ...kitForm, unidad_medida: e.target.value })}
                    className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#007AFF] transition"
                  >
                    <option value="Kit">Kit Completo</option>
                    <option value="Unidad">Unidad</option>
                    <option value="Paquete">Paquete</option>
                    <option value="Bulto">Bulto</option>
                    <option value="Subsidio_Mes">Subsidio / Mes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1D1D1F] mb-1">
                    Stock Disponible
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={kitForm.stock_disponible}
                    onChange={e => setKitForm({ ...kitForm, stock_disponible: Number(e.target.value) })}
                    className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#007AFF] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1D1D1F] mb-1">
                    Costo Referencia ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="120000"
                    value={kitForm.costo_referencia}
                    onChange={e => setKitForm({ ...kitForm, costo_referencia: Number(e.target.value) })}
                    className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#007AFF] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1D1D1F] mb-1">
                  Descripción Operativa
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles de contenido o criterios de focalización..."
                  value={kitForm.descripcion}
                  onChange={e => setKitForm({ ...kitForm, descripcion: e.target.value })}
                  className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3.5 py-2 text-xs text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#007AFF] transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setIsKitModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E6E73] hover:bg-[#F5F5F7] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-bold transition shadow-xs"
                >
                  Guardar Kit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------
          MODAL: AÑADIR / EDITAR SUB-COMPONENTE AL KIT
      --------------------------------------------------------- */}
      {isComponentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E5E5EA] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
              <h3 className="text-base font-bold text-[#1D1D1F]">
                {componentForm.id_componente ? 'Editar Componente' : 'Añadir Componente al Kit'}
              </h3>
              <button
                type="button"
                onClick={() => setIsComponentModalOpen(false)}
                className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] rounded-full transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveComponent} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-[#1D1D1F] mb-1">
                  Nombre del Componente / Sub-ítem *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Pañales Desechables Etapa 2, Olla de 4L, etc."
                  value={componentForm.nombre_componente}
                  onChange={e => setComponentForm({ ...componentForm, nombre_componente: e.target.value })}
                  className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3.5 py-2 text-xs text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#007AFF] transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1D1D1F] mb-1">
                    Cantidad Estándar
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={componentForm.cantidad_estandar}
                    onChange={e => setComponentForm({ ...componentForm, cantidad_estandar: Number(e.target.value) })}
                    className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#007AFF] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1D1D1F] mb-1">
                    Unidad de Medida
                  </label>
                  <input
                    type="text"
                    placeholder="UNIDAD, PAQUETE..."
                    value={componentForm.unidad_medida}
                    onChange={e => setComponentForm({ ...componentForm, unidad_medida: e.target.value.toUpperCase() })}
                    className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3 py-2 text-xs font-mono uppercase text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#007AFF] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1D1D1F] mb-1">
                  Descripción o Especificación
                </label>
                <input
                  type="text"
                  placeholder="ej. Paquete x 30 unidades para recién nacido"
                  value={componentForm.descripcion}
                  onChange={e => setComponentForm({ ...componentForm, descripcion: e.target.value })}
                  className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3.5 py-2 text-xs text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#007AFF] transition"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="comp_obligatorio"
                  checked={componentForm.es_obligatorio}
                  onChange={e => setComponentForm({ ...componentForm, es_obligatorio: e.target.checked })}
                  className="h-4 w-4 rounded text-[#007AFF] focus:ring-[#007AFF] border-[#D2D2D7]"
                />
                <label htmlFor="comp_obligatorio" className="text-xs font-medium text-[#1D1D1F] cursor-pointer">
                  Componente obligatorio en el paquete estándar
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setIsComponentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E6E73] hover:bg-[#F5F5F7] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-bold transition shadow-xs"
                >
                  Guardar Componente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

