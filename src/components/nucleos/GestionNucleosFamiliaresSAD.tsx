import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Heart,
  AlertCircle,
  Search,
  Plus,
  RefreshCw,
  MapPin,
  ShieldCheck,
  Edit3,
  CheckCircle2,
  X,
} from 'lucide-react';
import { apiClient } from '../../api/client';

export interface RolNucleoSAD {
  id_rol_nucleo: number;
  codigo_rol: string;
  nombre_rol: string;
}

export interface MiembroNucleoSAD {
  id_persona_nucleo: number;
  id_persona: number;
  documento: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  estado_vital: string;
  estado_civil: string;
  id_rol_nucleo: number;
  codigo_rol: string;
  nombre_rol: string;
  es_cabeza_hogar: boolean;
  estado_miembro: string;
  tipo_vinculo: string;
}

export interface NucleoFamiliarSAD {
  id_nucleo: number;
  codigo_nucleo: string;
  nombre_nucleo: string;
  id_sector?: number;
  nombre_sector: string;
  tipo_sector: string;
  direccion: string;
  telefono_contacto?: string;
  estado_nucleo: string;
  es_propietario: boolean;
  observaciones_familia?: string;
  miembros: MiembroNucleoSAD[];
}

export const GestionNucleosFamiliaresSAD: React.FC = () => {
  const [nucleos, setNucleos] = useState<NucleoFamiliarSAD[]>([]);
  const [roles, setRoles] = useState<RolNucleoSAD[]>([]);
  const [sectores, setSectores] = useState<{ id_sector: number; nombre_sector: string }[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const [showCrearModal, setShowCrearModal] = useState(false);
  const [nuevoNucleo, setNuevoNucleo] = useState({
    nombre_nucleo: '',
    id_sector: 0,
    direccion: '',
    telefono_contacto: '',
    observaciones_familia: '',
  });
  const [miembrosIniciales, setMiembrosIniciales] = useState([
    {
      documento: '',
      nombres: '',
      apellidos: '',
      telefono: '',
      sexo: 'F',
      tipo_vinculo_institucional: 'CIUDADANO',
      codigo_rol: 'CABEZA_HOGAR',
      es_cabeza_hogar: true,
    },
  ]);

  const [nucleoSeleccionado, setNucleoSeleccionado] = useState<NucleoFamiliarSAD | null>(null);
  const [nuevoMiembro, setNuevoMiembro] = useState({
    documento: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    sexo: 'M',
    tipo_vinculo_institucional: 'CIUDADANO',
    codigo_rol: 'HIJO',
    es_cabeza_hogar: false,
    motivo_cambio: 'Integración al núcleo familiar',
  });

  const [eventoModal, setEventoModal] = useState<{
    id_nucleo: number;
    nombre_nucleo: string;
    miembro: MiembroNucleoSAD;
  } | null>(null);
  const [eventoForm, setEventoForm] = useState({
    tipo_evento: 'MATRIMONIO',
    nuevo_codigo_rol: 'CABEZA_HOGAR',
    motivo_cambio: '',
    crear_nuevo_nucleo: true,
    nombre_nuevo_nucleo: '',
    direccion_nuevo_nucleo: '',
    incluir_conyuge: false,
    conyuge_documento: '',
    conyuge_nombres: '',
    conyuge_apellidos: '',
    conyuge_telefono: '',
  });

  const [editarNucleoModal, setEditarNucleoModal] = useState<NucleoFamiliarSAD | null>(null);

  const cargarDatos = async (termino = search) => {
    setLoading(true);
    try {
      const [resNuc, resRoles, resSec] = await Promise.all([
        apiClient.get('/nucleos-familiares', { params: { search: termino || undefined, limit: 60 } }),
        apiClient.get('/nucleos-familiares/roles'),
        apiClient.get('/catalogos/sectores'),
      ]);
      setNucleos(Array.isArray(resNuc.data) ? resNuc.data : []);
      setRoles(Array.isArray(resRoles.data) ? resRoles.data : []);
      const listaSec = Array.isArray(resSec.data) ? resSec.data : [];
      setSectores(listaSec);
      if (listaSec.length > 0 && !nuevoNucleo.id_sector) {
        setNuevoNucleo((prev) => ({ ...prev, id_sector: listaSec[0].id_sector }));
      }
    } catch (err) {
      console.error('Error cargando núcleos familiares en SAD:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos('');
  }, []);

  const handleCrearNucleo = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);
    const miembrosValidos = miembrosIniciales.filter(
      (m) => m.documento.trim() && m.nombres.trim() && m.apellidos.trim()
    );
    if (!nuevoNucleo.nombre_nucleo.trim() || !nuevoNucleo.direccion.trim() || miembrosValidos.length === 0) {
      setMensaje({
        tipo: 'error',
        texto: 'Completa el nombre del núcleo, la dirección y al menos el integrante Cabeza de Hogar.',
      });
      return;
    }

    try {
      await apiClient.post('/nucleos-familiares', {
        ...nuevoNucleo,
        miembros: miembrosValidos,
      });
      setMensaje({
        tipo: 'ok',
        texto: 'Núcleo familiar creado en SAD y sincronizado automáticamente con SIGA.',
      });
      setShowCrearModal(false);
      setNuevoNucleo({
        nombre_nucleo: '',
        id_sector: sectores[0]?.id_sector || 1,
        direccion: '',
        telefono_contacto: '',
        observaciones_familia: '',
      });
      setMiembrosIniciales([
        {
          documento: '',
          nombres: '',
          apellidos: '',
          telefono: '',
          sexo: 'F',
          tipo_vinculo_institucional: 'CIUDADANO',
          codigo_rol: 'CABEZA_HOGAR',
          es_cabeza_hogar: true,
        },
      ]);
      await cargarDatos();
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err?.response?.data?.detail || 'No se pudo crear el núcleo familiar.',
      });
    }
  };

  const handleAgregarMiembro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nucleoSeleccionado) return;
    try {
      await apiClient.post(`/nucleos-familiares/${nucleoSeleccionado.id_nucleo}/miembros`, nuevoMiembro);
      setMensaje({
        tipo: 'ok',
        texto: `Integrante ${nuevoMiembro.nombres} añadido al núcleo y sincronizado con SIGA.`,
      });
      setNucleoSeleccionado(null);
      setNuevoMiembro({
        documento: '',
        nombres: '',
        apellidos: '',
        telefono: '',
        sexo: 'M',
        tipo_vinculo_institucional: 'CIUDADANO',
        codigo_rol: 'HIJO',
        es_cabeza_hogar: false,
        motivo_cambio: 'Integración al núcleo familiar',
      });
      await cargarDatos();
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err?.response?.data?.detail || 'Error al agregar integrante.',
      });
    }
  };

  const handleAplicarEventoVital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventoModal) return;
    try {
      const payload: any = {
        tipo_evento: eventoForm.tipo_evento,
        nuevo_codigo_rol: eventoForm.nuevo_codigo_rol,
        motivo_cambio: eventoForm.motivo_cambio || undefined,
        crear_nuevo_nucleo: eventoForm.tipo_evento === 'MATRIMONIO' ? eventoForm.crear_nuevo_nucleo : false,
        nombre_nuevo_nucleo: eventoForm.nombre_nuevo_nucleo || undefined,
        direccion_nuevo_nucleo: eventoForm.direccion_nuevo_nucleo || undefined,
      };
      if (
        eventoForm.tipo_evento === 'MATRIMONIO' &&
        eventoForm.crear_nuevo_nucleo &&
        eventoForm.incluir_conyuge &&
        eventoForm.conyuge_documento.trim()
      ) {
        payload.conyuge = {
          documento: eventoForm.conyuge_documento.trim(),
          nombres: eventoForm.conyuge_nombres.trim() || 'Cónyuge',
          apellidos: eventoForm.conyuge_apellidos.trim() || 'Familiar',
          telefono: eventoForm.conyuge_telefono.trim() || undefined,
          codigo_rol: 'CONYUGE',
          es_cabeza_hogar: false,
        };
      }

      await apiClient.patch(
        `/nucleos-familiares/${eventoModal.id_nucleo}/miembros/${eventoModal.miembro.id_persona_nucleo}/evento-vital`,
        payload
      );
      setMensaje({
        tipo: 'ok',
        texto: `Novedad familiar (${eventoForm.tipo_evento}) registrada en SAD y sincronizada con SIGA exitosamente.`,
      });
      setEventoModal(null);
      await cargarDatos();
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err?.response?.data?.detail || 'No se pudo registrar el cambio en el núcleo familiar.',
      });
    }
  };

  const handleActualizarNucleo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editarNucleoModal) return;
    try {
      await apiClient.put(`/nucleos-familiares/${editarNucleoModal.id_nucleo}`, {
        nombre_nucleo: editarNucleoModal.nombre_nucleo,
        id_sector: editarNucleoModal.id_sector,
        direccion: editarNucleoModal.direccion,
        telefono_contacto: editarNucleoModal.telefono_contacto,
        observaciones_familia: editarNucleoModal.observaciones_familia,
      });
      setMensaje({
        tipo: 'ok',
        texto: 'Datos del núcleo familiar actualizados y sincronizados con SIGA.',
      });
      setEditarNucleoModal(null);
      await cargarDatos();
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err?.response?.data?.detail || 'Error al actualizar el núcleo familiar.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              <Users className="h-3.5 w-3.5" /> Sistema Compartido SAD ⇄ SIGA
            </span>
            <h2 className="mt-2 text-xl font-bold text-slate-900">
              Módulo de Gestión y Modificación de Núcleos Familiares (SAD ⇄ SIGA)
            </h2>
            <p className="text-sm text-slate-600">
              Cree o modifique núcleos familiares de ciudadanos y funcionarios, asigne roles (Cabeza de hogar, Cónyuge,
              Hijo, etc.) y registre novedades por matrimonio o fallecimiento sincronizadas con SIGA.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => cargarDatos()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <button
              type="button"
              onClick={() => setShowCrearModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Nuevo Núcleo Familiar
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && cargarDatos(search)}
              placeholder="Buscar por documento (cédula), nombre, apellido, código NUC o dirección..."
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => cargarDatos(search)}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Buscar
          </button>
        </div>

        {mensaje && (
          <div
            className={`mt-4 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium ${
              mensaje.tipo === 'ok'
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {mensaje.tipo === 'ok' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600" />
              )}
              <span>{mensaje.texto}</span>
            </div>
            <button onClick={() => setMensaje(null)} className="text-xs underline">
              Cerrar
            </button>
          </div>
        )}
      </div>

      {/* Tarjetas de Núcleos Familiares */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {nucleos.map((nuc) => {
          const activos = nuc.miembros?.filter((m) => m.estado_miembro === 'ACTIVO') || [];
          return (
            <div
              key={nuc.id_nucleo}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-800">
                        {nuc.codigo_nucleo}
                      </span>
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        {activos.length} integrantes activos
                      </span>
                    </div>
                    <h3 className="mt-1.5 text-lg font-bold text-slate-900">{nuc.nombre_nucleo}</h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-600">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        <strong>Sector {nuc.nombre_sector}</strong> — {nuc.direccion || 'Sin dirección'}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditarNucleoModal(nuc)}
                      className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setNucleoSeleccionado(nuc)}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Añadir Miembro
                    </button>
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Integrante / Documento</th>
                        <th className="px-3 py-2 font-semibold">Vínculo</th>
                        <th className="px-3 py-2 font-semibold">Rol en el Hogar</th>
                        <th className="px-3 py-2 font-semibold">Estado</th>
                        <th className="px-3 py-2 text-right font-semibold">Novedad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(nuc.miembros || []).map((m) => (
                        <tr key={m.id_persona_nucleo}>
                          <td className="px-3 py-2.5">
                            <div className="font-semibold text-slate-800">
                              {m.nombres} {m.apellidos}
                            </div>
                            <div className="text-[11px] text-slate-500">CC: {m.documento}</div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-800">
                              {m.tipo_vinculo}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                                m.es_cabeza_hogar
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {m.es_cabeza_hogar && <ShieldCheck className="h-3 w-3" />}
                              {m.nombre_rol}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            {m.estado_vital === 'FALLECIDO' || m.estado_miembro === 'FALLECIDO' ? (
                              <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                                FALLECIDO
                              </span>
                            ) : m.estado_miembro === 'MATRIMONIO' ? (
                              <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                MATRIMONIO
                              </span>
                            ) : (
                              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                {m.estado_miembro}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {m.estado_miembro === 'ACTIVO' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEventoModal({
                                    id_nucleo: nuc.id_nucleo,
                                    nombre_nucleo: nuc.nombre_nucleo,
                                    miembro: m,
                                  });
                                  setEventoForm({
                                    tipo_evento: 'MATRIMONIO',
                                    nuevo_codigo_rol: m.codigo_rol,
                                    motivo_cambio: '',
                                    crear_nuevo_nucleo: true,
                                    nombre_nuevo_nucleo: `Núcleo Familiar ${m.apellidos}`,
                                    direccion_nuevo_nucleo: nuc.direccion,
                                    incluir_conyuge: false,
                                    conyuge_documento: '',
                                    conyuge_nombres: '',
                                    conyuge_apellidos: '',
                                    conyuge_telefono: '',
                                  });
                                }}
                                className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100"
                              >
                                Novedad / Rol
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Crear Núcleo */}
      {showCrearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Crear Nuevo Núcleo Familiar (SAD ⇄ SIGA)</h3>
              <button onClick={() => setShowCrearModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCrearNucleo} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Nombre del Núcleo Familiar *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Núcleo Familiar Ramírez"
                    value={nuevoNucleo.nombre_nucleo}
                    onChange={(e) => setNuevoNucleo({ ...nuevoNucleo, nombre_nucleo: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Sector *</label>
                  <select
                    value={nuevoNucleo.id_sector}
                    onChange={(e) => setNuevoNucleo({ ...nuevoNucleo, id_sector: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    {sectores.map((s) => (
                      <option key={s.id_sector} value={s.id_sector}>
                        {s.nombre_sector}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Dirección *</label>
                  <input
                    type="text"
                    required
                    value={nuevoNucleo.direccion}
                    onChange={(e) => setNuevoNucleo({ ...nuevoNucleo, direccion: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Teléfono</label>
                  <input
                    type="text"
                    value={nuevoNucleo.telefono_contacto}
                    onChange={(e) => setNuevoNucleo({ ...nuevoNucleo, telefono_contacto: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-700">Integrantes y Roles</span>
                  <button
                    type="button"
                    onClick={() =>
                      setMiembrosIniciales([
                        ...miembrosIniciales,
                        {
                          documento: '',
                          nombres: '',
                          apellidos: '',
                          telefono: '',
                          sexo: 'M',
                          tipo_vinculo_institucional: 'CIUDADANO',
                          codigo_rol: 'HIJO',
                          es_cabeza_hogar: false,
                        },
                      ])
                    }
                    className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white"
                  >
                    + Añadir Integrante
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {miembrosIniciales.map((m, idx) => (
                    <div key={idx} className="grid grid-cols-1 gap-2 rounded-xl border bg-white p-2.5 sm:grid-cols-5">
                      <input
                        type="text"
                        required
                        placeholder="Documento *"
                        value={m.documento}
                        onChange={(e) => {
                          const c = [...miembrosIniciales];
                          c[idx].documento = e.target.value;
                          setMiembrosIniciales(c);
                        }}
                        className="rounded border px-2 py-1 text-xs"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Nombres *"
                        value={m.nombres}
                        onChange={(e) => {
                          const c = [...miembrosIniciales];
                          c[idx].nombres = e.target.value;
                          setMiembrosIniciales(c);
                        }}
                        className="rounded border px-2 py-1 text-xs"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Apellidos *"
                        value={m.apellidos}
                        onChange={(e) => {
                          const c = [...miembrosIniciales];
                          c[idx].apellidos = e.target.value;
                          setMiembrosIniciales(c);
                        }}
                        className="rounded border px-2 py-1 text-xs"
                      />
                      <select
                        value={m.codigo_rol}
                        onChange={(e) => {
                          const c = [...miembrosIniciales];
                          c[idx].codigo_rol = e.target.value;
                          c[idx].es_cabeza_hogar = e.target.value === 'CABEZA_HOGAR';
                          setMiembrosIniciales(c);
                        }}
                        className="rounded border px-2 py-1 text-xs"
                      >
                        {roles.map((r) => (
                          <option key={r.codigo_rol} value={r.codigo_rol}>
                            {r.nombre_rol}
                          </option>
                        ))}
                      </select>
                      <select
                        value={m.tipo_vinculo_institucional}
                        onChange={(e) => {
                          const c = [...miembrosIniciales];
                          c[idx].tipo_vinculo_institucional = e.target.value;
                          setMiembrosIniciales(c);
                        }}
                        className="rounded border px-2 py-1 text-xs"
                      >
                        <option value="CIUDADANO">Ciudadano</option>
                        <option value="FUNCIONARIO">Funcionario</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCrearModal(false)}
                  className="rounded-xl border px-4 py-2 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white">
                  Guardar y Sincronizar con SIGA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Agregar Miembro */}
      {nucleoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Añadir Miembro a {nucleoSeleccionado.nombre_nucleo}
            </h3>
            <form onSubmit={handleAgregarMiembro} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Documento *"
                  value={nuevoMiembro.documento}
                  onChange={(e) => setNuevoMiembro({ ...nuevoMiembro, documento: e.target.value })}
                  className="rounded-xl border px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Teléfono"
                  value={nuevoMiembro.telefono}
                  onChange={(e) => setNuevoMiembro({ ...nuevoMiembro, telefono: e.target.value })}
                  className="rounded-xl border px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  required
                  placeholder="Nombres *"
                  value={nuevoMiembro.nombres}
                  onChange={(e) => setNuevoMiembro({ ...nuevoMiembro, nombres: e.target.value })}
                  className="rounded-xl border px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  required
                  placeholder="Apellidos *"
                  value={nuevoMiembro.apellidos}
                  onChange={(e) => setNuevoMiembro({ ...nuevoMiembro, apellidos: e.target.value })}
                  className="rounded-xl border px-3 py-2 text-sm"
                />
                <select
                  value={nuevoMiembro.codigo_rol}
                  onChange={(e) =>
                    setNuevoMiembro({
                      ...nuevoMiembro,
                      codigo_rol: e.target.value,
                      es_cabeza_hogar: e.target.value === 'CABEZA_HOGAR',
                    })
                  }
                  className="rounded-xl border px-3 py-2 text-sm"
                >
                  {roles.map((r) => (
                    <option key={r.codigo_rol} value={r.codigo_rol}>
                      {r.nombre_rol}
                    </option>
                  ))}
                </select>
                <select
                  value={nuevoMiembro.tipo_vinculo_institucional}
                  onChange={(e) => setNuevoMiembro({ ...nuevoMiembro, tipo_vinculo_institucional: e.target.value })}
                  className="rounded-xl border px-3 py-2 text-sm"
                >
                  <option value="CIUDADANO">Ciudadano</option>
                  <option value="FUNCIONARIO">Funcionario</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNucleoSeleccionado(null)}
                  className="rounded-xl border px-4 py-2 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white">
                  Guardar y Sincronizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Evento Vital */}
      {eventoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Novedad Familiar: {eventoModal.miembro.nombres} {eventoModal.miembro.apellidos}
            </h3>
            <form onSubmit={handleAplicarEventoVital} className="mt-4 space-y-3">
              <select
                value={eventoForm.tipo_evento}
                onChange={(e) => setEventoForm({ ...eventoForm, tipo_evento: e.target.value })}
                className="w-full rounded-xl border px-3 py-2 text-sm font-semibold"
              >
                <option value="MATRIMONIO">Matrimonio / Conformar Nuevo Núcleo Familiar</option>
                <option value="FALLECIMIENTO">Fallecimiento</option>
                <option value="CAMBIO_ROL">Cambio de Rol en el Hogar</option>
                <option value="RETIRADO">Retiro del Núcleo</option>
              </select>

              {eventoForm.tipo_evento === 'CAMBIO_ROL' && (
                <select
                  value={eventoForm.nuevo_codigo_rol}
                  onChange={(e) => setEventoForm({ ...eventoForm, nuevo_codigo_rol: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                >
                  {roles.map((r) => (
                    <option key={r.codigo_rol} value={r.codigo_rol}>
                      {r.nombre_rol}
                    </option>
                  ))}
                </select>
              )}

              {eventoForm.tipo_evento === 'MATRIMONIO' && (
                <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <label className="flex items-center gap-2 text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={eventoForm.crear_nuevo_nucleo}
                      onChange={(e) => setEventoForm({ ...eventoForm, crear_nuevo_nucleo: e.target.checked })}
                    />
                    <Heart className="h-4 w-4 text-rose-500" />
                    Crear nuevo núcleo familiar por matrimonio
                  </label>
                  {eventoForm.crear_nuevo_nucleo && (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Nombre nuevo núcleo"
                        value={eventoForm.nombre_nuevo_nucleo}
                        onChange={(e) => setEventoForm({ ...eventoForm, nombre_nuevo_nucleo: e.target.value })}
                        className="rounded border bg-white px-2 py-1.5 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Dirección nuevo núcleo"
                        value={eventoForm.direccion_nuevo_nucleo}
                        onChange={(e) => setEventoForm({ ...eventoForm, direccion_nuevo_nucleo: e.target.value })}
                        className="rounded border bg-white px-2 py-1.5 text-xs"
                      />
                    </div>
                  )}
                </div>
              )}

              <input
                type="text"
                placeholder="Motivo u observación del cambio..."
                value={eventoForm.motivo_cambio}
                onChange={(e) => setEventoForm({ ...eventoForm, motivo_cambio: e.target.value })}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEventoModal(null)}
                  className="rounded-xl border px-4 py-2 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white">
                  Aplicar y Sincronizar con SIGA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Núcleo */}
      {editarNucleoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Editar Núcleo {editarNucleoModal.codigo_nucleo}</h3>
            <form onSubmit={handleActualizarNucleo} className="mt-4 space-y-3">
              <input
                type="text"
                required
                value={editarNucleoModal.nombre_nucleo}
                onChange={(e) => setEditarNucleoModal({ ...editarNucleoModal, nombre_nucleo: e.target.value })}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
              <input
                type="text"
                required
                value={editarNucleoModal.direccion || ''}
                onChange={(e) => setEditarNucleoModal({ ...editarNucleoModal, direccion: e.target.value })}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditarNucleoModal(null)}
                  className="rounded-xl border px-4 py-2 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionNucleosFamiliaresSAD;

