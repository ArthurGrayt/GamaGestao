import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Lock, Mail, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Falha no login. Verifique suas credenciais.');
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl opacity-50"></div>

      <div className="max-w-md w-full bg-white/40 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
        <div className="p-8 pb-4 flex flex-col items-center">
            <div className="w-24 h-24 mb-6 rounded-3xl bg-white/30 backdrop-blur-md shadow-lg flex items-center justify-center p-3 border border-white/40">
                <img 
                src="https://wofipjazcxwxzzxjsflh.supabase.co/storage/v1/object/public/Media/Image/image-removebg-preview%20(2).png" 
                alt="Gama Logo" 
                className="w-full h-auto object-contain drop-shadow-md"
                />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Bem-vindo</h2>
            <p className="text-slate-500 text-sm mt-2">Acesse sua conta para continuar</p>
        </div>

        <div className="p-8 pt-4">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-100/80 backdrop-blur-sm text-red-600 p-4 rounded-2xl text-sm border border-red-200/50">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white/50 border border-white/60 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-800 placeholder-slate-400 backdrop-blur-sm"
                  placeholder="admin@exemplo.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Senha</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white/50 border border-white/60 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-800 placeholder-slate-400 backdrop-blur-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-lg shadow-blue-500/30 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02]"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                'Entrar no Sistema'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};