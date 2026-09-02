import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { LogOut, Settings, LayoutGrid } from 'lucide-react';
import { SadLogo } from '../common/SadLogo';

export const NavbarSAC: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getRoleShortBadge = (nivel?: number) => {
    switch (nivel) {
      case 1:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-400/15 text-blue-300 border border-blue-400/30">
            N1 • Censo
          </span>
        );
      case 2:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400/15 text-emerald-300 border border-emerald-400/30">
            N2 • Entregas
          </span>
        );
      case 3:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/15 text-amber-300 border border-amber-400/30">
            N3 • Funcionario
          </span>
        );
      case 4:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-400/20 text-purple-300 border border-purple-400/40">
            N4 • Admin
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-700 text-slate-300 border border-slate-600">
            Funcionario
          </span>
        );
    }
  };

  const isAdmin = user && user.nivel >= 4;
  const isInAdminPage = location.pathname.startsWith('/admin');

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
        {/* Brand with Custom SVG Logo and Vertical Title Stack */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center space-x-3 cursor-pointer"
        >
          <SadLogo size={36} />
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="text-base font-black tracking-tight text-white leading-none">
                SAD
              </span>
              <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-extrabold border border-blue-500/30 uppercase tracking-wide">
                Gestión del Riesgo
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium tracking-normal mt-0.5 leading-tight">
              Sistema de Atención a Desastres
            </span>
          </div>
        </div>

        {/* Compact User Info & Actions */}
        <div className="flex items-center space-x-2.5">
          {/* Admin Switch Button */}
          {isAdmin && (
            <button
              onClick={() => navigate(isInAdminPage ? '/' : '/admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                isInAdminPage
                  ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 hover:bg-blue-600/30'
                  : 'bg-purple-600/20 text-purple-300 border-purple-500/40 hover:bg-purple-600/30'
              }`}
            >
              {isInAdminPage ? (
                <>
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Vista Operativa</span>
                </>
              ) : (
                <>
                  <Settings className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Panel Admin</span>
                </>
              )}
            </button>
          )}

          {user && (
            <div className="flex items-center space-x-2 bg-slate-800/70 border border-slate-700/80 px-2.5 py-1 rounded-xl">
              <div className="h-6 w-6 rounded-lg bg-blue-600/30 text-blue-300 flex items-center justify-center text-[10px] font-extrabold">
                {user.nombres?.[0] || 'U'}
              </div>
              <span className="text-xs font-semibold text-slate-200 max-w-[130px] truncate hidden md:inline">
                {user.nombres} {user.apellidos}
              </span>
              <div className="hidden sm:block">{getRoleShortBadge(user.nivel)}</div>
            </div>
          )}

          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition cursor-pointer"
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
