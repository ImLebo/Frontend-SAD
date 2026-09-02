import { apiClient } from '../api/client';
import {
  SectorItem,
  ItemAyuda,
  SolicitudMapItem,
  SolicitudDetailResponse,
  DashboardStats,
} from '../types/sac.types';

export const sacService = {
  // Catalogos
  getSectores: async (tipo_sector_id?: number): Promise<SectorItem[]> => {
    const res = await apiClient.get('/catalogos/sectores', {
      params: { tipo_sector_id },
    });
    return res.data;
  },

  getItems: async (categoria_id?: number): Promise<ItemAyuda[]> => {
    const res = await apiClient.get('/catalogos/items', {
      params: { categoria_id },
    });
    return res.data;
  },

  // Eventos Multi-Desastre
  getEventos: async (): Promise<any[]> => {
    const res = await apiClient.get('/eventos');
    return res.data;
  },

  crearEvento: async (payload: {
    nombre_evento: string;
    tipo_evento: string;
    codigo_evento?: string;
    descripcion?: string;
    departamento?: string;
    municipio?: string;
    fecha_evento?: string;
  }): Promise<any> => {
    const res = await apiClient.post('/eventos', payload);
    return res.data;
  },

  actualizarEvento: async (id_evento: number, payload: any): Promise<any> => {
    const res = await apiClient.put(`/eventos/${id_evento}`, payload);
    return res.data;
  },

  getUsuariosEvento: async (id_evento: number): Promise<{ id_evento: number; assigned_user_ids: number[] }> => {
    const res = await apiClient.get(`/eventos/${id_evento}/usuarios`);
    return res.data;
  },

  asignarUsuariosEvento: async (id_evento: number, user_ids: number[]): Promise<any> => {
    const res = await apiClient.post(`/eventos/${id_evento}/asignar-usuarios`, { user_ids });
    return res.data;
  },

  // Administración de Usuarios
  getUsuarios: async (params?: { busqueda?: string; id_rol?: number; activo?: boolean }): Promise<any[]> => {
    const res = await apiClient.get('/admin/usuarios', { params });
    return res.data;
  },

  crearUsuario: async (payload: {
    documento: string;
    nombres: string;
    apellidos: string;
    correo: string;
    telefono?: string;
    id_rol: number;
    contrasena?: string;
  }): Promise<any> => {
    const res = await apiClient.post('/admin/usuarios', payload);
    return res.data;
  },

  actualizarUsuario: async (id_usuario: number, payload: any): Promise<any> => {
    const res = await apiClient.put(`/admin/usuarios/${id_usuario}`, payload);
    return res.data;
  },

  toggleActivoUsuario: async (id_usuario: number): Promise<any> => {
    const res = await apiClient.patch(`/admin/usuarios/${id_usuario}/toggle-activo`);
    return res.data;
  },

  cambiarPasswordUsuario: async (id_usuario: number, nueva_contrasena: string): Promise<any> => {
    const res = await apiClient.patch(`/admin/usuarios/${id_usuario}/password`, { nueva_contrasena });
    return res.data;
  },

  cargueMasivoUsuarios: async (payload: {
    usuarios: Array<{
      documento: string;
      nombres: string;
      apellidos: string;
      correo?: string;
      telefono?: string;
      id_rol?: number;
    }>;
    contrasena_por_defecto?: string;
    asignar_a_evento_id?: number | null;
  }): Promise<any> => {
    const res = await apiClient.post('/admin/usuarios/cargue-masivo', payload);
    return res.data;
  },

  // Solicitudes
  getTodasSolicitudes: async (estado?: string, evento_id?: number): Promise<any[]> => {
    const res = await apiClient.get('/solicitudes/todas', {
      params: { estado, evento_id },
    });
    return res.data;
  },

  getSolicitudDetail: async (id_solicitud: number): Promise<SolicitudDetailResponse> => {
    const res = await apiClient.get(`/solicitudes/${id_solicitud}`);
    return res.data;
  },

  eliminarSolicitud: async (id_solicitud: number): Promise<any> => {
    const res = await apiClient.delete(`/solicitudes/${id_solicitud}`);
    return res.data;
  },

  // Modo 1: Censo
  crearCenso: async (payload: any) => {
    const res = await apiClient.post('/solicitudes/censo', payload);
    return res.data;
  },

  actualizarSolicitud: async (id_solicitud: number, payload: any) => {
    const res = await apiClient.put(`/solicitudes/${id_solicitud}`, payload);
    return res.data;
  },

  // Modo 2 y 3: Entregas
  getSolicitudesPendientes: async (evento_id?: number): Promise<any[]> => {
    const res = await apiClient.get('/entregas/pendientes', {
      params: { evento_id },
    });
    return res.data;
  },

  getEntregasPorSolicitud: async (id_solicitud: number): Promise<any[]> => {
    const res = await apiClient.get(`/entregas/por-solicitud/${id_solicitud}`);
    return res.data;
  },

  registrarEntregaInmediata: async (payload: any) => {
    const res = await apiClient.post('/entregas/inmediata', payload);
    return res.data;
  },

  registrarEntregaExistente: async (payload: any) => {
    const res = await apiClient.post('/entregas/existente', payload);
    return res.data;
  },

  actualizarEntrega: async (id_entrega: number, payload: any) => {
    const res = await apiClient.put(`/entregas/${id_entrega}`, payload);
    return res.data;
  },

  // Mapa y Filtros Avanzados
  filtrarMapa: async (filtros: {
    id_sector?: number | null;
    id_tipo_sector?: number | null;
    niveles_dano_vivienda?: string[];
    niveles_dano_techo?: string[];
    id_estado?: number | null;
    busqueda?: string;
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
  }): Promise<SolicitudMapItem[]> => {
    const res = await apiClient.post('/mapa/filtrar', filtros);
    return res.data;
  },

  // Dashboard
  getEstadisticas: async (evento_id?: number): Promise<DashboardStats> => {
    const res = await apiClient.get('/dashboard/estadisticas', {
      params: { evento_id },
    });
    return res.data;
  },
};
export default sacService;
