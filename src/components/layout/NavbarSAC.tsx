import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { LogOut, Settings, LayoutGrid, ExternalLink, Bell, AlertTriangle, Shield } from 'lucide-react';
import { SadLogo } from '../common/SadLogo';

export const puedeGestionarEventosUsuario = (user?: any): boolean => {
  if (!user) return false;
  const nivel = Number(user.nivel || 0);
  const idRol = Number(user.id_rol || 0);
  const nombreRol = (user.nombre_rol || '').toLowerCase();
  if ([3, 4, 5].includes(nivel) || [3, 4, 5, 8, 9].includes(idRol)) return true;
  if (
    ['admin', 'alcalde', 'secretario', 'ungrd', 'coordinador', 'riesgo', 'funcionario'].some((k) =>
      nombreRol.includes(k)
    ) &&
    !nombreRol.includes('colaborador') &&
    !nombreRol.includes('auxiliar')
  ) {
    return true;
  }
  return false;
};

export const NavbarSAC: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const canManage = puedeGestionarEventosUsuario(user);
  const isInAdminPage = location.pathname.startsWith('/admin');

  const getInitials = () => {
    const f = user?.nombres?.[0] || 'U';
    const l = user?.apellidos?.[0] || 'S';
    return `${f}${l}`.toUpperCase();
  };

  return (
    <header className="bg-white border-b border-[#E5E5EA] text-[#1D1D1F] sticky top-0 z-40 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="w-full px-4 sm:px-6 h-[60px] flex items-center justify-between gap-3">
        {/* Left Institutional Brand: Alcaldía de Anserma + SAD */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F5F5F7] to-[#E8E8ED] border border-[#D2D2D7] flex items-center justify-center shadow-2xs">
              <Shield className="h-5 w-5 text-[#007AFF]" />
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-[10px] font-semibold text-[#6E6E73] uppercase tracking-wider">
                Alcaldía de
              </span>
              <span className="text-xs font-extrabold text-[#1D1D1F] tracking-tight">
                ANSERMA
              </span>
              <span className="text-[9px] font-medium text-[#6E6E73]">
                Caldas
              </span>
            </div>
          </div>

          <div className="hidden sm:block h-7 w-[1px] bg-[#E5E5EA]" />

          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 cursor-pointer min-w-0"
          >
            <SadLogo size={34} />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-[#1D1D1F] leading-none">
                  SAD
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#007AFF]/10 text-[#007AFF]">
                  Sistema de Atención a Desastres
                </span>
              </div>
              <span className="text-[11px] text-[#6E6E73] font-medium truncate mt-0.5">
                Gestión de Emergencias y Desastres
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions: Portal SIGA, Emergencias Badge, Notifications, User */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Portal SIGA Link */}
          <a
            href={
              import.meta.env.VITE_SIGA_URL ||
              (typeof window !== 'undefined' && window.location.hostname === 'localhost'
                ? 'http://localhost:5173'
                : 'https://siga.gobiernodeanserma.com')
            }
            target="_blank"
            rel="noopener noreferrer"
            title="Ir al Portal SIGA (Sistema Integrado de Gestión de Ayudas)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] border border-[#D2D2D7] transition cursor-pointer"
          >
            <span>Portal SIGA</span>
            <ExternalLink className="h-3.5 w-3.5 text-[#6E6E73]" />
          </a>

          {/* Emergencias Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Emergencias</span>
          </div>

          {/* Admin / Vista Operativa Button */}
          {canManage && (
            <button
              type="button"
              onClick={() => navigate(isInAdminPage ? '/' : '/admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer border ${
                isInAdminPage
                  ? 'bg-[#007AFF] text-white border-[#007AFF] hover:bg-[#0062CC]'
                  : 'bg-white text-[#1D1D1F] border-[#D2D2D7] hover:bg-[#F5F5F7]'
              }`}
            >
              {isInAdminPage ? (
                <>
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Vista Operativa</span>
                </>
              ) : (
                <>
                  <Settings className="h-3.5 w-3.5 text-[#007AFF]" />
                  <span className="hidden sm:inline">Administración</span>
                </>
              )}
            </button>
          )}

          {/* Notification Bell */}
          <div className="relative p-2 rounded-full text-[#6E6E73] hover:bg-[#F5F5F7] transition cursor-pointer" title="Notificaciones activas">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#FF3B30] ring-2 ring-white" />
          </div>

          {/* User Profile Pill */}
          {user && (
            <div className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-[#F5F5F7] border border-[#E5E5EA]">
              <div className="h-7 w-7 rounded-full bg-[#007AFF] text-white flex items-center justify-center text-[11px] font-bold shadow-2xs">
                {getInitials()}
              </div>
              <div className="hidden lg:flex flex-col leading-tight">
                <span className="text-xs font-bold text-[#1D1D1F] max-w-[140px] truncate">
                  {user.nombres} {user.apellidos}
                </span>
                <span className="text-[10px] font-medium text-[#6E6E73]">
                  {user.nombre_rol || 'Funcionario'}
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
            className="p-2 text-[#6E6E73] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-full transition cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
export { NavbarSAC as NavbarSAD };
