import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerCafeOwner, registerLivreur, registerOwner, registerUser } from '../services/api';
import Navbar from '../components/Navbar';

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromParam = new URLSearchParams(location.search).get('from');
  const safeReturnPath =
    fromParam && fromParam.startsWith('/') && !fromParam.startsWith('//') ? fromParam : null;

  const [tab, setTab] = useState('user'); // 'user' | 'owner' | 'cafe_owner' | 'livreur'
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    restaurantName: '',
    restaurantAddress: '',
    cafeName: '',
    cafeAddress: '',
    cafeDescription: '',
    cafeMapsUrl: '',
    cafeImage: '',
    tableReservationPrice: '',
    cafeTableCount: '',
    livreurName: '',
    livreurAddress: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleUserRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await registerUser({
        name: form.name,
        email: form.email,
        password: form.password
      });
      localStorage.setItem('token', res.data.token);
      await login(form.email, form.password);
      navigate(safeReturnPath || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleOwnerRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        name: form.restaurantName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        address: form.restaurantAddress,
        restaurantName: form.restaurantName,
        restaurantAddress: form.restaurantAddress
      };
      const res = await registerOwner(payload);
      localStorage.setItem('token', res.data.token);
      navigate('/owner/setup');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription proprietaire');
    } finally {
      setLoading(false);
    }
  };

  const handleCafeOwnerRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await registerCafeOwner({
        email: form.email,
        password: form.password,
        phone: form.phone,
        cafeName: form.cafeName,
        cafeAddress: form.cafeAddress,
        cafeDescription: form.cafeDescription,
        cafeMapsUrl: form.cafeMapsUrl,
        cafeImage: form.cafeImage,
        cafeTableCount: Number(form.cafeTableCount || 0),
        tableReservationPrice: Number(form.tableReservationPrice || 0),
      });
      localStorage.setItem('token', res.data.token);
      navigate('/cafes');
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription proprietaire café");
    } finally {
      setLoading(false);
    }
  };

  const handleLivreurRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await registerLivreur({
        name: form.livreurName || form.name || 'Livreur',
        email: form.email,
        password: form.password,
        phone: form.phone,
        address: form.livreurAddress || form.address || '',
      });
      localStorage.setItem('token', res.data.token);
      navigate('/livreur/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription livreur");
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
            <h2 className="font-serif text-4xl text-white mb-2">Créer un compte</h2>
            <p className="text-white/40 text-sm">Rejoignez Benna Hub<span className="text-[#c19d60]">.</span></p>
          </div>

          {/* Tab Switch */}
          <div className="flex mb-8 border border-white/10">
            <button
              onClick={() => setTab('user')}
              className={`flex-1 py-3 text-[11px] tracking-widest uppercase transition-all ${
                tab === 'user' ? 'bg-[#c19d60] text-[#0b1f1e] font-semibold' : 'text-white/50 hover:text-white'
              }`}
            >
              👤 Client
            </button>
            <button
              onClick={() => setTab('owner')}
              className={`flex-1 py-3 text-[11px] tracking-widest uppercase transition-all ${
                tab === 'owner' ? 'bg-[#c19d60] text-[#0b1f1e] font-semibold' : 'text-white/50 hover:text-white'
              }`}
            >
              🍽️ Propriétaire
            </button>
            <button
              onClick={() => setTab('cafe_owner')}
              className={`flex-1 py-3 text-[11px] tracking-widest uppercase transition-all ${
                tab === 'cafe_owner' ? 'bg-[#c19d60] text-[#0b1f1e] font-semibold' : 'text-white/50 hover:text-white'
              }`}
            >
              ☕ Café
            </button>
            <button
              onClick={() => setTab('livreur')}
              className={`flex-1 py-3 text-[11px] tracking-widest uppercase transition-all ${
                tab === 'livreur' ? 'bg-[#c19d60] text-[#0b1f1e] font-semibold' : 'text-white/50 hover:text-white'
              }`}
            >
              🛵 Livreur
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={
              tab === 'owner'
                ? handleOwnerRegister
                : tab === 'cafe_owner'
                  ? handleCafeOwnerRegister
                  : tab === 'livreur'
                    ? handleLivreurRegister
                  : handleUserRegister
            }
            className="space-y-4"
          >
            {tab === 'user' && (
              <div>
                <label className="text-[10px] tracking-widest text-white/40 uppercase block mb-1.5">Nom complet</label>
                <input
                  name="name" type="text" required
                  value={form.name} onChange={handleChange}
                  className="w-full bg-[#0e2624] border border-white/10 focus:border-[#c19d60]/50 text-white px-4 py-3 text-sm focus:outline-none placeholder-white/20"
                  placeholder="Votre nom..."
                />
              </div>
            )}

            <div>
              <label className="text-[10px] tracking-widest text-white/40 uppercase block mb-1.5">Email</label>
              <input
                name="email" type="email" required
                value={form.email} onChange={handleChange}
                className="w-full bg-[#0e2624] border border-white/10 focus:border-[#c19d60]/50 text-white px-4 py-3 text-sm focus:outline-none placeholder-white/20"
                placeholder="exemple@email.com"
              />
            </div>

            <div>
              <label className="text-[10px] tracking-widest text-white/40 uppercase block mb-1.5">Mot de passe</label>
              <input
                name="password" type="password" required minLength={6}
                value={form.password} onChange={handleChange}
                className="w-full bg-[#0e2624] border border-white/10 focus:border-[#c19d60]/50 text-white px-4 py-3 text-sm focus:outline-none placeholder-white/20"
                placeholder="Minimum 6 caractères"
              />
            </div>

            {(tab === 'owner' || tab === 'cafe_owner' || tab === 'livreur') && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] tracking-widest text-white/40 uppercase block mb-1.5">Téléphone</label>
                  <input
                    name="phone" type="tel" required
                    value={form.phone} onChange={handleChange}
                    className="w-full bg-[#0e2624] border border-white/10 focus:border-[#c19d60]/50 text-white px-4 py-3 text-sm focus:outline-none placeholder-white/20"
                    placeholder="+216 XX XXX XXX"
                  />
                </div>
                {tab === 'owner' ? (
                  <>
                    <div>
                      <label className="text-[10px] tracking-widest text-white/40 uppercase block mb-1.5">Nom du restaurant</label>
                      <input
                        name="restaurantName" type="text" required
                        value={form.restaurantName} onChange={handleChange}
                        className="w-full bg-[#0e2624] border border-white/10 focus:border-[#c19d60]/50 text-white px-4 py-3 text-sm focus:outline-none placeholder-white/20"
                        placeholder="Nom de votre établissement..."
                      />
                    </div>
                    <div>
                      <label className="text-[10px] tracking-widest text-white/40 uppercase block mb-1.5">Adresse du restaurant</label>
                      <input
                        name="restaurantAddress" type="text" required
                        value={form.restaurantAddress} onChange={handleChange}
                        className="w-full bg-[#0e2624] border border-white/10 focus:border-[#c19d60]/50 text-white px-4 py-3 text-sm focus:outline-none placeholder-white/20"
                        placeholder="Adresse complète..."
                      />
                    </div>
                    <p className="text-xs text-[#c19d60]/90 border border-[#c19d60]/30 bg-[#c19d60]/10 px-3 py-2">
                      Etape suivante apres inscription: photo du restaurant, lien Google Maps et ajout des plats un par un.
                    </p>
                  </>
                ) : tab === 'cafe_owner' ? (
                  <>
                    <div>
                      <label className="text-[10px] tracking-widest text-white/40 uppercase block mb-1.5">Nom du café</label>
                      <input
                        name="cafeName" type="text" required
                        value={form.cafeName} onChange={handleChange}
                        className="w-full bg-[#0e2624] border border-white/10 focus:border-[#c19d60]/50 text-white px-4 py-3 text-sm focus:outline-none placeholder-white/20"
                        placeholder="Nom de votre café..."
                      />
                    </div>
                    <div>
                      <label className="text-[10px] tracking-widest text-white/40 uppercase block mb-1.5">Adresse du café</label>
                      <input
                        name="cafeAddress" type="text" required
                        value={form.cafeAddress} onChange={handleChange}
                        className="w-full bg-[#0e2624] border border-white/10 focus:border-[#c19d60]/50 text-white px-4 py-3 text-sm focus:outline-none placeholder-white/20"
                        placeholder="Adresse complète..."
                      />
                    </div>
                    <div>
                      <label className="text-[10px] tracking-widest text-white/40 uppercase block mb-1.5">Lien Google Maps</label>
                      <input
                        name="cafeMapsUrl" type="text"
                        value={form.cafeMapsUrl} onChange={handleChange}
                        className="w-full bg-[#0e2624] border border-white/10 focus:border-[#c19d60]/50 text-white px-4 py-3 text-sm focus:outline-none placeholder-white/20"
                        placeholder="https://maps.google.com/..."
                      />
                    </div>
                    <div>
                      <label className="text-[10px] tracking-widest text-white/40 uppercase block mb-1.5">Image extérieure (URL)</label>
                      <input
                        name="cafeImage" type="text"
                        value={form.cafeImage} onChange={handleChange}
                        className="w-full bg-[#0e2624] border border-white/10 focus:border-[#c19d60]/50 text-white px-4 py-3 text-sm focus:outline-none placeholder-white/20"
                        placeholder="https://...jpg"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] tracking-widest text-white/40 uppercase block mb-1.5">Type d’accueil / hospitalité</label>
                      <input
                        name="cafeDescription" type="text"
                        value={form.cafeDescription} onChange={handleChange}
                        className="w-full bg-[#0e2624] border border-white/10 focus:border-[#c19d60]/50 text-white px-4 py-3 text-sm focus:outline-none placeholder-white/20"
                        placeholder="Cosy, romantique, business, lounge..."
                      />
                    </div>
                    <div>
                      <label className="text-[10px] tracking-widest text-white/40 uppercase block mb-1.5">Prix réservation table (TND)</label>
                      <input
                        name="tableReservationPrice" type="number" min="0"
                        value={form.tableReservationPrice} onChange={handleChange}
                        className="w-full bg-[#0e2624] border border-white/10 focus:border-[#c19d60]/50 text-white px-4 py-3 text-sm focus:outline-none placeholder-white/20"
                        placeholder="Ex: 20"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] tracking-widest text-white/40 uppercase block mb-1.5">Nombre de tables</label>
                      <input
                        name="cafeTableCount" type="number" min="0"
                        value={form.cafeTableCount} onChange={handleChange}
                        className="w-full bg-[#0e2624] border border-white/10 focus:border-[#c19d60]/50 text-white px-4 py-3 text-sm focus:outline-none placeholder-white/20"
                        placeholder="Ex: 15"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-[10px] tracking-widest text-white/40 uppercase block mb-1.5">Nom du livreur</label>
                      <input
                        name="livreurName" type="text" required
                        value={form.livreurName} onChange={handleChange}
                        className="w-full bg-[#0e2624] border border-white/10 focus:border-[#c19d60]/50 text-white px-4 py-3 text-sm focus:outline-none placeholder-white/20"
                        placeholder="Nom complet..."
                      />
                    </div>
                    <div>
                      <label className="text-[10px] tracking-widest text-white/40 uppercase block mb-1.5">Adresse</label>
                      <input
                        name="livreurAddress" type="text" required
                        value={form.livreurAddress} onChange={handleChange}
                        className="w-full bg-[#0e2624] border border-white/10 focus:border-[#c19d60]/50 text-white px-4 py-3 text-sm focus:outline-none placeholder-white/20"
                        placeholder="Adresse..."
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-4 bg-[#c19d60] hover:bg-[#d4ac70] disabled:opacity-50 text-[#0b1f1e] text-[11px] font-bold tracking-[0.25em] uppercase transition-all duration-300"
            >
              {loading
                ? 'Chargement...'
                : tab === 'owner'
                  ? "S'inscrire et continuer"
                  : tab === 'cafe_owner'
                    ? "S'inscrire (café)"
                    : tab === 'livreur'
                      ? "S'inscrire (livreur)"
                    : "S'inscrire"}
            </button>
          </form>

          <p className="text-center text-white/30 text-sm mt-6">
            Déjà un compte ?{' '}
            <Link
              to={safeReturnPath ? `/login?from=${encodeURIComponent(safeReturnPath)}` : '/login'}
              className="text-[#c19d60] hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
