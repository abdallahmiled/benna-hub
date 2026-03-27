import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      // Redirect based on role
      if (data.user.role === 'owner') navigate('/dashboard');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1f1e] text-white font-sans flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-6 pt-24 pb-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="text-[#c19d60] text-4xl mb-3">✦</div>
            <h2 className="font-serif text-4xl text-white mb-2">Connexion</h2>
            <p className="text-white/40 text-sm">Bienvenue sur Benna Hub<span className="text-[#c19d60]">.</span></p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] tracking-widest text-white/40 uppercase block mb-1.5">Email</label>
              <input
                name="email" type="email" required
                value={form.email} onChange={handleChange}
                className="w-full bg-[#0e2624] border border-white/10 focus:border-[#c19d60]/50 text-white px-4 py-3 text-sm focus:outline-none placeholder-white/20 transition-colors"
                placeholder="exemple@email.com"
              />
            </div>

            <div>
              <label className="text-[10px] tracking-widest text-white/40 uppercase block mb-1.5">Mot de passe</label>
              <input
                name="password" type="password" required
                value={form.password} onChange={handleChange}
                className="w-full bg-[#0e2624] border border-white/10 focus:border-[#c19d60]/50 text-white px-4 py-3 text-sm focus:outline-none placeholder-white/20 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-4 bg-[#c19d60] hover:bg-[#d4ac70] disabled:opacity-50 text-[#0b1f1e] text-[11px] font-bold tracking-[0.25em] uppercase transition-all duration-300"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-white/30 text-sm mt-6">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-[#c19d60] hover:underline">S'inscrire</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
