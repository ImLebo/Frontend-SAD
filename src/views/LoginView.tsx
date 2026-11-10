import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiClient } from '../api/client';
import { ShieldCheck, Lock, Mail, Loader2, ArrowRight } from 'lucide-react';

export const LoginView: React.FC = () => {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/login', {
        correo: correo.trim(),
        contrasena,
      });
      login(res.data.access_token, res.data.usuario);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (email: string, pass: string) => {
    setCorreo(email);
    setContrasena(pass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F5F5F7] relative overflow-hidden font-sans text-[#1D1D1F]">
      <div className="w-full max-w-md bg-white border border-[#E5E5EA] p-8 rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] relative z-10">
        {/* Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#007AFF] shadow-lg shadow-[#007AFF]/25 mb-3.5 text-white">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#1D1D1F] tracking-tight">SAD — Anserma</h1>
          <p className="text-xs text-[#6E6E73] font-medium mt-1">
            Sistema de Atención a Desastres y Gestión del Riesgo
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/25 text-[#FF3B30] text-xs font-semibold flex items-center space-x-2">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#6E6E73] mb-1.5">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6E6E73]" />
              <input
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="ej: ungrd@siga.com"
                className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-[10px] pl-10 pr-4 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder-[#86868B] focus:bg-white focus:outline-none focus:border-[#007AFF] focus:ring-3 focus:ring-[#007AFF]/15 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6E6E73] mb-1.5">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6E6E73]" />
              <input
                type="password"
                required
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#F5F5F7] border border-[#D2D2D7] rounded-[10px] pl-10 pr-4 py-2.5 text-xs font-medium text-[#1D1D1F] placeholder-[#86868B] focus:bg-white focus:outline-none focus:border-[#007AFF] focus:ring-3 focus:ring-[#007AFF]/15 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#007AFF] hover:bg-[#0062CC] text-white font-semibold py-3 px-4 rounded-[10px] shadow-xs transition cursor-pointer disabled:opacity-50 mt-2 text-xs flex items-center justify-center space-x-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Ingresar al Sistema SAD</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Users Quick Access */}
        <div className="mt-7 pt-5 border-t border-[#E5E5EA]">
          <p className="text-[11px] font-bold text-[#6E6E73] mb-3 uppercase tracking-wider text-center">
            Acceso Rápido Perfiles Locales (Clave: Ayuda2026*)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Alcalde', email: 'alcalde@siga.com' },
              { label: 'Secretario', email: 'secretario@siga.com' },
              { label: 'Coord. UNGRD', email: 'ungrd@siga.com' },
              { label: 'Administrador', email: 'admin@siga.com' },
              { label: 'Funcionario', email: 'funcionario1@siga.com' },
              { label: 'Brigada Censo', email: 'ayudac1@siga.com' },
            ].map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => setDemoUser(u.email, 'Ayuda2026*')}
                className="px-3 py-2 bg-[#F5F5F7] hover:bg-[#007AFF]/10 hover:border-[#007AFF]/40 text-xs text-[#1D1D1F] rounded-[10px] font-semibold transition flex items-center justify-center border border-[#D2D2D7] cursor-pointer"
              >
                <span>{u.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginView;
