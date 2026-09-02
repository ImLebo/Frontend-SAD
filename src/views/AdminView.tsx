import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { sacService } from '../services/sacService';
import { NavbarSAC } from '../components/layout/NavbarSAC';
import {
  ShieldAlert,
  Calendar,
  Users,
  BarChart3,
  Plus,
  Edit2,
  Lock,
  UserCheck,
  UserX,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Search,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Building,
  MapPin,
  Flame,
  Waves,
  Mountain,
  FileSpreadsheet,
  Layers
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active Admin Sub-Tab: 'eventos' | 'usuarios' | 'dashboard'
  const [activeAdminTab, setActiveAdminTab] = useState<'eventos' | 'usuarios' | 'dashboard'>('eventos');

  // Loading and Toasts
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Redirect if not admin
  useEffect(() => {
    if (user && user.nivel < 4) {
      navigate('/');
    }
  }, [user, navigate]);

  // ---------------------------------------------------------
  // 1. EVENTOS MULTI-DESASTRE STATE
  // ---------------------------------------------------------
  const [eventos, setEventos] = useState<any[]>([]);
  const [isEventoModalOpen, setIsEventoModalOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<any | null>(null);
  const [eventoForm, setEventoForm] = useState({
    nombre_evento: '',
    tipo_evento: 'Sismo / Terremoto',
    codigo_evento: '',
    descripcion: '',
    departamento: 'Caldas',
    municipio: 'Anserma',
    fecha_evento: new Date().toISOString().split('T')[0],
  });

  // Event User Assignment Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningEvento, setAssigningEvento] = useState<any | null>(null);
  const [assignedUserIds, setAssignedUserIds] = useState<number[]>([]);
  const [assignSearchQuery, setAssignSearchQuery] = useState('');

  // ---------------------------------------------------------
  // 2. GESTIÓN DE USUARIOS STATE
  // ---------------------------------------------------------
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRolFilter, setUserRolFilter] = useState<number | ''>('');
  const [userActivoFilter, setUserActivoFilter] = useState<string>('todos');

  // Single User Modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userForm, setUserForm] = useState({
    documento: '',
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    id_rol: 1, // 1: Censo, 2: Entregas, 3: Funcionario, 4: Admin
    contrasena: 'Ayuda2026*',
  });

  // Password Reset Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('Ayuda2026*');

  // Bulk Upload Modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkDefaultRol, setBulkDefaultRol] = useState(1);
  const [bulkDefaultPass, setBulkDefaultPass] = useState('Ayuda2026*');
  const [bulkAssignEventoId, setBulkAssignEventoId] = useState<number | ''>('');

  // ---------------------------------------------------------
  // 3. DASHBOARD EJECUTIVO STATE
  // ---------------------------------------------------------
  const [dashboardEventoFilter, setDashboardEventoFilter] = useState<number | ''>('');
  const [stats, setStats] = useState<any>(null);

  // Load Data
  const loadEventos = async () => {
    try {
      const data = await sacService.getEventos();
      setEventos(data);
    } catch (err: any) {
      showToast('Error al cargar eventos de desastre', 'error');
    }
  };

  const loadUsuarios = async () => {
    try {
      const data = await sacService.getUsuarios();
      setUsuarios(data);
    } catch (err: any) {
      showToast('Error al cargar usuarios', 'error');
    }
  };

  const loadDashboardStats = async (eventoId?: number) => {
    try {
      const data = await sacService.getEstadisticas(eventoId);
      setStats(data);
    } catch (err: any) {
      showToast('Error al cargar estadísticas', 'error');
    }
  };

  useEffect(() => {
    loadEventos();
    loadUsuarios();
    loadDashboardStats();
  }, []);

  // ---------------------------------------------------------
  // EVENTOS HANDLERS
  // ---------------------------------------------------------
  const handleOpenCreateEvento = () => {
    setEditingEvento(null);
    setEventoForm({
      nombre_evento: '',
      tipo_evento: 'Sismo / Terremoto',
      codigo_evento: '',
      descripcion: '',
      departamento: 'Caldas',
      municipio: 'Anserma',
      fecha_evento: new Date().toISOString().split('T')[0],
    });
    setIsEventoModalOpen(true);
  };

  const handleOpenEditEvento = (ev: any) => {
    setEditingEvento(ev);
    setEventoForm({
      nombre_evento: ev.nombre_evento,
      tipo_evento: ev.tipo_evento,
      codigo_evento: ev.codigo_evento,
      descripcion: ev.descripcion || '',
      departamento: ev.departamento || 'Caldas',
      municipio: ev.municipio || 'Anserma',
      fecha_evento: ev.fecha_evento || new Date().toISOString().split('T')[0],
    });
    setIsEventoModalOpen(true);
  };

  const handleSaveEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventoForm.nombre_evento.trim()) {
      showToast('El nombre del evento es requerido', 'warning');
      return;
    }

    setLoading(true);
    try {
      if (editingEvento) {
        await sacService.actualizarEvento(editingEvento.id_evento, eventoForm);
        showToast('Evento actualizado correctamente', 'success');
      } else {
        await sacService.crearEvento(eventoForm);
        showToast('Nuevo evento de desastre creado exitosamente', 'success');
      }
      setIsEventoModalOpen(false);
      loadEventos();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Error al guardar evento', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssignModal = async (ev: any) => {
    setAssigningEvento(ev);
    setAssignSearchQuery('');
    try {
      await loadUsuarios();
      const res = await sacService.getUsuariosEvento(ev.id_evento);
      setAssignedUserIds(res.assigned_user_ids || []);
      setIsAssignModalOpen(true);
    } catch (err: any) {
      showToast('Error al consultar usuarios del evento', 'error');
    }
  };

  const toggleAssignUser = (userId: number) => {
    setAssignedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllAssign = () => {
    const allIds = usuarios.map((u) => u.id_usuario);
    setAssignedUserIds(allIds);
  };

  const handleClearAllAssign = () => {
    setAssignedUserIds([]);
  };

  const handleAssignByRole = (rolLevel: number) => {
    const matchingIds = usuarios.filter((u) => u.nivel === rolLevel).map((u) => u.id_usuario);
    setAssignedUserIds((prev) => Array.from(new Set([...prev, ...matchingIds])));
    showToast(`Seleccionados usuarios de Nivel ${rolLevel}`, 'success');
  };

  const handleSaveAssignments = async () => {
    if (!assigningEvento) return;
    setLoading(true);
    try {
      await sacService.asignarUsuariosEvento(assigningEvento.id_evento, assignedUserIds);
      showToast(`Asignación guardada (${assignedUserIds.length} usuarios)`, 'success');
      setIsAssignModalOpen(false);
      loadEventos();
      loadUsuarios();
    } catch (err: any) {
      showToast('Error al guardar asignaciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // USUARIOS HANDLERS
  // ---------------------------------------------------------
  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setUserForm({
      documento: '',
      nombres: '',
      apellidos: '',
      correo: '',
      telefono: '',
      id_rol: 1,
      contrasena: 'Ayuda2026*',
    });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u: any) => {
    setEditingUser(u);
    setUserForm({
      documento: u.documento || '',
      nombres: u.nombres || '',
      apellidos: u.apellidos || '',
      correo: u.correo || '',
      telefono: u.telefono || '',
      id_rol: u.id_rol || 1,
      contrasena: '',
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.nombres.trim() || !userForm.correo.trim()) {
      showToast('Por favor diligencie los campos obligatorios', 'warning');
      return;
    }

    setLoading(true);
    try {
      if (editingUser) {
        await sacService.actualizarUsuario(editingUser.id_usuario, {
          nombres: userForm.nombres,
          apellidos: userForm.apellidos,
          correo: userForm.correo,
          telefono: userForm.telefono,
          id_rol: userForm.id_rol,
        });
        showToast('Usuario actualizado correctamente', 'success');
      } else {
        await sacService.crearUsuario(userForm);
        showToast('Usuario creado correctamente', 'success');
      }
      setIsUserModalOpen(false);
      loadUsuarios();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Error al guardar usuario', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivo = async (id_usuario: number) => {
    try {
      const res = await sacService.toggleActivoUsuario(id_usuario);
      showToast(res.mensaje, 'success');
      loadUsuarios();
    } catch (err: any) {
      showToast('Error al cambiar estado de usuario', 'error');
    }
  };

  const handleOpenPasswordModal = (u: any) => {
    setPasswordUser(u);
    setNewPassword('Ayuda2026*');
    setIsPasswordModalOpen(true);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordUser || !newPassword.trim()) return;
    setLoading(true);
    try {
      await sacService.cambiarPasswordUsuario(passwordUser.id_usuario, newPassword);
      showToast('Contraseña restablecida exitosamente', 'success');
      setIsPasswordModalOpen(false);
    } catch (err: any) {
      showToast('Error al restablecer contraseña', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Bulk Upload Handler
  const handleProcessBulkUpload = async () => {
    if (!bulkText.trim()) {
      showToast('Ingresa al menos un número de documento o registro', 'warning');
      return;
    }

    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsedUsers = lines.map((line) => {
      // Allows comma or tab or space separation: "1053890123, Juan, Perez" or just "1053890123"
      const parts = line.split(/[,;\t]+/).map((p) => p.trim());
      const doc = parts[0];
      const nom = parts[1] || `Brigadista ${doc}`;
      const ape = parts[2] || 'Censo';
      return {
        documento: doc,
        nombres: nom,
        apellidos: ape,
        correo: `brigadista_${doc}@siga.com`,
        id_rol: bulkDefaultRol,
      };
    });

    setLoading(true);
    try {
      const res = await sacService.cargueMasivoUsuarios({
        usuarios: parsedUsers,
        contrasena_por_defecto: bulkDefaultPass,
        asignar_a_evento_id: bulkAssignEventoId ? Number(bulkAssignEventoId) : null,
      });
      showToast(res.mensaje, 'success');
      setIsBulkModalOpen(false);
      setBulkText('');
      loadUsuarios();
      loadEventos();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Error en cargue masivo', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtered Users List
  const filteredUsuarios = usuarios.filter((u) => {
    if (userRolFilter && u.id_rol !== Number(userRolFilter)) return false;
    if (userActivoFilter === 'activos' && !u.activo) return false;
    if (userActivoFilter === 'inactivos' && u.activo) return false;
    if (userSearchQuery.trim()) {
      const q = userSearchQuery.toLowerCase();
      const match =
        u.documento?.toLowerCase().includes(q) ||
        u.nombres?.toLowerCase().includes(q) ||
        u.apellidos?.toLowerCase().includes(q) ||
        u.correo?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const getRoleBadge = (nivel: number) => {
    switch (nivel) {
      case 1:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
            N1 • Censo
          </span>
        );
      case 2:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
            N2 • Entregas
          </span>
        );
      case 3:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
            N3 • Funcionario
          </span>
        );
      case 4:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
            N4 • Administrador
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">Rol {nivel}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <NavbarSAC />

      {/* Admin Subheader with Back Button and Mode Tabs */}
      <div className="bg-white border-b border-slate-200 shadow-2xs px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer border border-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver a Operativo</span>
            </button>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-900 tracking-tight">
                  Panel de Administración SAD
                </h1>
                <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-purple-200 uppercase tracking-wide">
                  Control Total
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Gestión Multi-Desastre, creación de brigadistas y supervisión de emergencias
              </p>
            </div>
          </div>

          {/* Admin Sub-Tabs */}
          <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveAdminTab('eventos')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeAdminTab === 'eventos'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Eventos ({eventos.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAdminTab('usuarios')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeAdminTab === 'usuarios'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Usuarios ({usuarios.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAdminTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeAdminTab === 'dashboard'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Supervisión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl text-white font-bold flex items-center gap-3 border ${
              toast.type === 'success'
                ? 'bg-emerald-600 border-emerald-400'
                : toast.type === 'error'
                ? 'bg-rose-600 border-rose-400'
                : 'bg-amber-600 border-amber-400'
            }`}
          >
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="text-sm">{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Main Admin Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* ========================================================= */}
        {/* TAB 1: GESTIÓN DE EVENTOS MULTI-DESASTRE                   */}
        {/* ========================================================= */}
        {activeAdminTab === 'eventos' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">Eventos de Desastre y Emergencias</h2>
                <p className="text-xs text-slate-500">
                  Crea nuevas contingencias y define qué brigadistas tendrán acceso a registrar en cada una.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenCreateEvento}
                className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Crear Evento de Desastre</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventos.map((ev) => (
                <div
                  key={ev.id_evento}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {ev.codigo_evento}
                        </span>
                        <h3 className="text-base font-black text-slate-900 mt-1.5 leading-snug">
                          {ev.nombre_evento}
                        </h3>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          ev.estado_evento === 'Activo'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {ev.estado_evento}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 mb-4">
                      {ev.descripcion || 'Sin descripción detallada registrada.'}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-4 font-medium">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Tipo</span>
                        <span className="text-slate-700 font-bold">{ev.tipo_evento}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Fecha Inicio</span>
                        <span className="text-slate-700 font-bold">{ev.fecha_evento}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Censos</span>
                        <span className="text-blue-700 font-black text-xs">{ev.total_solicitudes || 0}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Usuarios Asignados</span>
                        <span className="text-indigo-700 font-black text-xs">{ev.total_usuarios_asignados || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleOpenAssignModal(ev)}
                      className="flex-1 py-1.5 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold rounded-lg border border-indigo-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>Asignar Brigadistas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditEvento(ev)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition cursor-pointer"
                      title="Editar Evento"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: GESTIÓN DE USUARIOS Y BRIGADISTAS                   */}
        {/* ========================================================= */}
        {activeAdminTab === 'usuarios' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">Usuarios del Sistema y Brigadistas</h2>
                <p className="text-xs text-slate-500">
                  Administra credenciales, asigna roles de campo y realiza cargues masivos de censadores.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Cargue Masivo</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenCreateUser}
                  className="flex items-center gap-2 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nuevo Usuario</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Buscar por cédula, nombre o correo..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={userRolFilter}
                  onChange={(e) => setUserRolFilter(e.target.value ? Number(e.target.value) : '')}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="">Todos los Roles</option>
                  <option value="1">Nivel 1 • Censo</option>
                  <option value="2">Nivel 2 • Entregas</option>
                  <option value="3">Nivel 3 • Funcionario</option>
                  <option value="4">Nivel 4 • Administrador</option>
                </select>

                <select
                  value={userActivoFilter}
                  onChange={(e) => setUserActivoFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="todos">Todos los Estados</option>
                  <option value="activos">Solo Activos</option>
                  <option value="inactivos">Solo Inactivos</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Documento</th>
                      <th className="px-4 py-3">Nombre Completo</th>
                      <th className="px-4 py-3">Correo / Usuario</th>
                      <th className="px-4 py-3">Rol / Nivel</th>
                      <th className="px-4 py-3 text-center">Eventos</th>
                      <th className="px-4 py-3 text-center">Estado</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsuarios.map((u) => (
                      <tr key={u.id_usuario} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          {u.documento || 'S/N'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {u.nombres} {u.apellidos}
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium">{u.correo}</td>
                        <td className="px-4 py-3">{getRoleBadge(u.nivel)}</td>
                        <td className="px-4 py-3 text-center font-bold text-blue-700">
                          {u.eventos_asignados || 0}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleActivo(u.id_usuario)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black cursor-pointer transition ${
                              u.activo
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200'
                            }`}
                          >
                            {u.activo ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenPasswordModal(u)}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-200 transition cursor-pointer"
                              title="Restablecer Contraseña"
                            >
                              <Lock className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition cursor-pointer"
                              title="Editar Usuario"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsuarios.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-medium">
                          No se encontraron usuarios con los filtros aplicados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: DASHBOARD EJECUTIVO & SUPERVISIÓN                  */}
        {/* ========================================================= */}
        {activeAdminTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">Supervisión Ejecutiva de Emergencias</h2>
                <p className="text-xs text-slate-500">
                  Consolidado de impacto, evaluación de daños en viviendas y despacho de asistencia humanitaria.
                </p>
              </div>

              {/* Event Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Filtrar Evento:</span>
                <select
                  value={dashboardEventoFilter}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : '';
                    setDashboardEventoFilter(val);
                    loadDashboardStats(val || undefined);
                  }}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:outline-none"
                >
                  <option value="">Consolidado Global (Todos)</option>
                  {eventos.map((ev) => (
                    <option key={ev.id_evento} value={ev.id_evento}>
                      {ev.codigo_evento} - {ev.nombre_evento}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* KPI Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                  <span className="text-xs font-bold text-slate-500 block">Total Censos</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">
                    {stats.total_solicitudes}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                    Solicitudes registradas
                  </span>
                </div>

                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 shadow-2xs">
                  <span className="text-xs font-bold text-amber-800 block">Pendientes de Atención</span>
                  <span className="text-2xl font-black text-amber-900 mt-1 block">
                    {stats.solicitudes_pendientes}
                  </span>
                  <span className="text-[11px] text-amber-700 font-medium mt-0.5 block">
                    Requieren entrega de ayuda
                  </span>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 shadow-2xs">
                  <span className="text-xs font-bold text-emerald-800 block">Ayudas Entregadas</span>
                  <span className="text-2xl font-black text-emerald-900 mt-1 block">
                    {stats.total_entregas}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium mt-0.5 block">
                    {stats.solicitudes_atendidas} familias atendidas
                  </span>
                </div>

                <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 shadow-2xs">
                  <span className="text-xs font-bold text-rose-800 block">Evacuados de Emergencia</span>
                  <span className="text-2xl font-black text-rose-900 mt-1 block">
                    {stats.evacuados}
                  </span>
                  <span className="text-[11px] text-rose-700 font-medium mt-0.5 block">
                    Requieren albergue / subsidio
                  </span>
                </div>
              </div>
            )}

            {/* Breakdown Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Damage Breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                  <h3 className="text-xs font-black uppercase text-slate-800 mb-3 tracking-wider">
                    Severidad en Viviendas
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-rose-600"></span>
                        <span className="text-xs font-bold text-slate-700">Colapso Total</span>
                      </div>
                      <span className="text-xs font-black text-slate-900">
                        {stats.dano_vivienda?.colapso_total || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-amber-500"></span>
                        <span className="text-xs font-bold text-slate-700">Daño Grave</span>
                      </div>
                      <span className="text-xs font-black text-slate-900">
                        {stats.dano_vivienda?.grave || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-slate-400"></span>
                        <span className="text-xs font-bold text-slate-700">Daño Leve</span>
                      </div>
                      <span className="text-xs font-black text-slate-900">
                        {stats.dano_vivienda?.leve || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Zone Breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                  <h3 className="text-xs font-black uppercase text-slate-800 mb-3 tracking-wider">
                    Distribución Geográfica
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Zona Urbana (Barrios)</span>
                      <span className="text-xs font-black text-blue-700">
                        {stats.distribucion_zona?.urbana || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Zona Rural (Veredas)</span>
                      <span className="text-xs font-black text-indigo-700">
                        {stats.distribucion_zona?.rural || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Top Supplies */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                  <h3 className="text-xs font-black uppercase text-slate-800 mb-3 tracking-wider">
                    Top Insumos Requeridos
                  </h3>
                  <div className="space-y-2">
                    {stats.top_insumos?.map((itm: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 truncate max-w-[180px]">
                          {itm.nombre}
                        </span>
                        <span className="font-black text-emerald-700">{itm.cantidad} un.</span>
                      </div>
                    ))}
                    {(!stats.top_insumos || stats.top_insumos.length === 0) && (
                      <span className="text-xs text-slate-400">Sin datos de insumos aún.</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL: CREAR / EDITAR EVENTO                             */}
      {/* ========================================================= */}
      {isEventoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-base font-black text-slate-900 mb-1">
              {editingEvento ? 'Editar Evento de Desastre' : 'Nuevo Evento de Desastre'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Configura los detalles de la contingencia para el registro y censo de damnificados.
            </p>

            <form onSubmit={handleSaveEvento} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Evento *</label>
                <input
                  type="text"
                  required
                  value={eventoForm.nombre_evento}
                  onChange={(e) => setEventoForm({ ...eventoForm, nombre_evento: e.target.value })}
                  placeholder="ej: Terremoto Sector Occidental"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Evento *</label>
                  <select
                    value={eventoForm.tipo_evento}
                    onChange={(e) => setEventoForm({ ...eventoForm, tipo_evento: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="Sismo / Terremoto">Sismo / Terremoto</option>
                    <option value="Inundación">Inundación</option>
                    <option value="Deslizamiento">Deslizamiento</option>
                    <option value="Incendio Estructural / Forestal">Incendio Estructural / Forestal</option>
                    <option value="Vendaval / Granizada">Vendaval / Granizada</option>
                    <option value="Avenida Torrencial">Avenida Torrencial</option>
                    <option value="Otro Desastre">Otro Desastre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Inicio *</label>
                  <input
                    type="date"
                    required
                    value={eventoForm.fecha_evento}
                    onChange={(e) => setEventoForm({ ...eventoForm, fecha_evento: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción / Observaciones</label>
                <textarea
                  rows={3}
                  value={eventoForm.descripcion}
                  onChange={(e) => setEventoForm({ ...eventoForm, descripcion: e.target.value })}
                  placeholder="Detalles sobre magnitud, zonas afectadas preliminares..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEventoModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{editingEvento ? 'Guardar Cambios' : 'Crear Evento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ASIGNAR USUARIOS A EVENTO                         */}
      {/* ========================================================= */}
      {isAssignModalOpen && assigningEvento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Asignar Brigadistas a {assigningEvento.nombre_evento}
                </h3>
                <p className="text-xs text-slate-500">
                  Selecciona qué usuarios podrán ver y registrar solicitudes en este evento.
                </p>
              </div>
              <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                {assignedUserIds.length} seleccionados
              </span>
            </div>

            {/* Search and Quick Actions */}
            <div className="my-3 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={assignSearchQuery}
                  onChange={(e) => setAssignSearchQuery(e.target.value)}
                  placeholder="Buscar usuario por nombre o documento..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs pt-1">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] font-extrabold text-slate-500 mr-1 uppercase">Masivo:</span>
                  <button
                    type="button"
                    onClick={() => handleAssignByRole(1)}
                    className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold hover:bg-blue-100 cursor-pointer"
                  >
                    + Todos Censo (N1)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAssignByRole(2)}
                    className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold hover:bg-emerald-100 cursor-pointer"
                  >
                    + Todos Entregas (N2)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAssignByRole(3)}
                    className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold hover:bg-amber-100 cursor-pointer"
                  >
                    + Funcionarios (N3)
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllAssign}
                    className="text-blue-700 hover:underline font-bold text-xs cursor-pointer"
                  >
                    Todos
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleClearAllAssign}
                    className="text-rose-600 hover:underline font-bold text-xs cursor-pointer"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </div>

            {/* Users Checkbox List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl p-2 bg-slate-50/50 my-2">
              {usuarios
                .filter((u) => {
                  if (!assignSearchQuery.trim()) return true;
                  const q = assignSearchQuery.toLowerCase();
                  return (
                    u.documento?.toLowerCase().includes(q) ||
                    u.nombres?.toLowerCase().includes(q) ||
                    u.apellidos?.toLowerCase().includes(q)
                  );
                })
                .map((u) => {
                  const isChecked = assignedUserIds.includes(u.id_usuario);
                  return (
                    <label
                      key={u.id_usuario}
                      onClick={() => toggleAssignUser(u.id_usuario)}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition ${
                        isChecked ? 'bg-blue-50/80' : 'hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">
                            {u.nombres} {u.apellidos}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            CC: {u.documento || 'S/N'} • {u.correo}
                          </span>
                        </div>
                      </div>
                      <div>{getRoleBadge(u.nivel)}</div>
                    </label>
                  );
                })}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveAssignments}
                disabled={loading}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Guardar Asignación</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREAR / EDITAR USUARIO                            */}
      {/* ========================================================= */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-black text-slate-900 mb-1">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario / Brigadista'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Ingresa los datos personales y asigna el nivel de acceso correspondiente.
            </p>

            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cédula / Documento *</label>
                <input
                  type="text"
                  required
                  value={userForm.documento}
                  onChange={(e) => setUserForm({ ...userForm, documento: e.target.value })}
                  placeholder="ej: 1053890123"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    value={userForm.nombres}
                    onChange={(e) => setUserForm({ ...userForm, nombres: e.target.value })}
                    placeholder="ej: Juan Carlos"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={userForm.apellidos}
                    onChange={(e) => setUserForm({ ...userForm, apellidos: e.target.value })}
                    placeholder="ej: Pérez Gómez"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={userForm.correo}
                  onChange={(e) => setUserForm({ ...userForm, correo: e.target.value })}
                  placeholder="ej: brigadista1@siga.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={userForm.telefono}
                    onChange={(e) => setUserForm({ ...userForm, telefono: e.target.value })}
                    placeholder="3001234567"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rol / Nivel *</label>
                  <select
                    value={userForm.id_rol}
                    onChange={(e) => setUserForm({ ...userForm, id_rol: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value={1}>Nivel 1 • Censo (RUFE)</option>
                    <option value={2}>Nivel 2 • Entregas</option>
                    <option value={3}>Nivel 3 • Funcionario</option>
                    <option value={4}>Nivel 4 • Administrador</option>
                  </select>
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña Inicial</label>
                  <input
                    type="text"
                    value={userForm.contrasena}
                    onChange={(e) => setUserForm({ ...userForm, contrasena: e.target.value })}
                    placeholder="Ayuda2026*"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-3">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{editingUser ? 'Guardar Cambios' : 'Crear Usuario'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CAMBIAR CONTRASEÑA                                 */}
      {/* ========================================================= */}
      {isPasswordModalOpen && passwordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-black text-slate-900 mb-1">Restablecer Contraseña</h3>
            <p className="text-xs text-slate-500 mb-4">
              Para: <strong className="text-slate-800">{passwordUser.nombres} {passwordUser.apellidos}</strong> ({passwordUser.correo})
            </p>

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nueva Contraseña</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Restablecer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CARGUE MASIVO DE BRIGADISTAS                      */}
      {/* ========================================================= */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-base font-black text-slate-900 mb-1">
              Cargue Masivo de Brigadistas / Censadores
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Pega un listado de documentos de identidad para crear y activar automáticamente a los brigadistas en el sistema.
            </p>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Listado de Cédulas (Una por línea o separada por coma)
                </label>
                <textarea
                  rows={6}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`1053890123\n1053890124, Carlos Gomez\n1053890125`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rol por Defecto</label>
                  <select
                    value={bulkDefaultRol}
                    onChange={(e) => setBulkDefaultRol(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value={1}>Nivel 1 • Censo (RUFE)</option>
                    <option value={2}>Nivel 2 • Entregas</option>
                    <option value={3}>Nivel 3 • Funcionario</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña por Defecto</label>
                  <input
                    type="text"
                    value={bulkDefaultPass}
                    onChange={(e) => setBulkDefaultPass(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Asignar Automáticamente a Evento (Opcional)
                </label>
                <select
                  value={bulkAssignEventoId}
                  onChange={(e) => setBulkAssignEventoId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="">No asignar de momento</option>
                  {eventos.map((ev) => (
                    <option key={ev.id_evento} value={ev.id_evento}>
                      {ev.codigo_evento} - {ev.nombre_evento}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleProcessBulkUpload}
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Procesar Cargue Masivo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminView;
