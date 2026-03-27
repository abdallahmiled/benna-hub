import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { getOwnerCafe, getOwnerDashboard, getOwnerCafeReservations, getMyLivreurCommandes } from '../services/api';
import { getMapPreviewState } from '../utils/maps';

const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const toImageUrl = (value) => {
  if (!value) return '';
  if (String(value).startsWith('http://') || String(value).startsWith('https://')) return value;
  return `${API_ORIGIN}${String(value).startsWith('/') ? '' : '/'}${value}`;
};

const RingStat = ({ label, value, tone = 'gold' }) => {
  const toneClasses =
    tone === 'emerald'
      ? 'from-emerald-400/40 to-emerald-400/5 text-emerald-200'
      : tone === 'sky'
        ? 'from-sky-400/40 to-sky-400/5 text-sky-200'
        : tone === 'violet'
          ? 'from-violet-400/40 to-violet-400/5 text-violet-200'
          : 'from-[#c19d60]/50 to-[#c19d60]/5 text-[#e8d5b5]';
  return (
    <div className="flex items-center gap-4">
      <div className={`h-14 w-14 rounded-full bg-gradient-to-b ${toneClasses} border border-white/10 grid place-items-center`}>
        <span className="font-serif text-lg">{value}</span>
      </div>
      <div className="min-w-0">
        <p className="text-white/45 text-[10px] tracking-[0.28em] uppercase">{label}</p>
      </div>
    </div>
  );
};

const Contact = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ownerDash, setOwnerDash] = useState(null);
  const [cafe, setCafe] = useState(null);
  const [cafeRes, setCafeRes] = useState([]);
  const [livreurOrders, setLivreurOrders] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setError('');
      setLoading(true);
      try {
        if (user?.role === 'owner') {
          const res = await getOwnerDashboard();
          if (!alive) return;
          setOwnerDash(res.data || null);
        } else if (user?.role === 'cafe_owner') {
          const [cRes, rRes] = await Promise.all([getOwnerCafe(), getOwnerCafeReservations()]);
          if (!alive) return;
          setCafe(cRes.data || null);
          setCafeRes(rRes.data || []);
        } else if (user?.role === 'livreur') {
          const res = await getMyLivreurCommandes();
          if (!alive) return;
          setLivreurOrders(res.data || []);
        }
      } catch (err) {
        if (!alive) return;
        setError(err.response?.data?.message || 'Impossible de charger les informations.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user?.role]);

  const mapPreview = useMemo(() => {
    if (user?.role === 'owner') return getMapPreviewState(ownerDash?.restaurant?.googleMapsUrl);
    if (user?.role === 'cafe_owner') return getMapPreviewState(cafe?.googleMapsUrl);
    return { embedSrc: null, externalUrl: null, hint: null };
  }, [cafe?.googleMapsUrl, ownerDash?.restaurant?.googleMapsUrl, user?.role]);

  const ownerSummary = useMemo(() => {
    const s = ownerDash?.stats || {};
    return [
      { label: 'Clients', value: String(s.totalOrders || 0), tone: 'sky' },
      { label: 'En cours', value: String(s.remainingOrders || 0), tone: 'violet' },
      { label: 'CA (notées)', value: String(s.totalSalesRated || 0), tone: 'gold' },
    ];
  }, [ownerDash?.stats]);

  const cafeSummary = useMemo(() => {
    const pending = cafeRes.filter((r) => r.status === 'pending').length;
    const accepted = cafeRes.filter((r) => r.status === 'accepted').length;
    return [
      { label: 'Tables', value: String(cafe?.tableCount || 0), tone: 'sky' },
      { label: 'Réservations', value: String(cafeRes.length || 0), tone: 'gold' },
      { label: 'En attente', value: String(pending), tone: 'violet' },
      { label: 'Acceptées', value: String(accepted), tone: 'emerald' },
    ];
  }, [cafe?.tableCount, cafeRes]);

  const livreurSummary = useMemo(() => {
    const active = livreurOrders.filter((o) => ['ready_for_delivery', 'out_for_delivery'].includes(o.status)).length;
    const delivered = livreurOrders.filter((o) => o.status === 'delivered').length;
    return [
      { label: 'En cours', value: String(active), tone: 'violet' },
      { label: 'Livrées', value: String(delivered), tone: 'emerald' },
      { label: 'Total', value: String(livreurOrders.length || 0), tone: 'gold' },
    ];
  }, [livreurOrders]);

  const cardTitle =
    user?.role === 'owner'
      ? ownerDash?.restaurant?.name || 'Mon restaurant'
      : user?.role === 'cafe_owner'
        ? cafe?.name || 'Mon café'
        : user?.role === 'livreur'
          ? 'Espace livreur'
          : 'Contact';

  const cardKicker =
    user?.role === 'owner'
      ? 'Contact restaurant'
      : user?.role === 'cafe_owner'
        ? 'Contact café'
        : user?.role === 'livreur'
          ? 'Contact livreur'
          : 'Contact';

  const heroImage =
    user?.role === 'owner'
      ? toImageUrl(ownerDash?.restaurant?.image) || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&auto=format&fit=crop'
      : user?.role === 'cafe_owner'
        ? toImageUrl(cafe?.image) || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1600&auto=format&fit=crop'
        : 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=1600&auto=format&fit=crop';

  const contactPhone =
    user?.role === 'cafe_owner'
      ? cafe?.phone || user?.phone || '—'
      : user?.phone || '—';

  const contactEmail = user?.email || '—';
  const contactAddress =
    user?.role === 'owner'
      ? ownerDash?.restaurant?.address || user?.address || '—'
      : user?.role === 'cafe_owner'
        ? cafe?.address || user?.address || '—'
        : user?.address || '—';

  const stats = user?.role === 'owner' ? ownerSummary : user?.role === 'cafe_owner' ? cafeSummary : user?.role === 'livreur' ? livreurSummary : [];

  return (
    <div className="min-h-screen bg-[#0b1f1e] text-white font-sans">
      <Navbar />

      <div className="pt-28 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-[#c19d60] text-[10px] tracking-[0.45em] uppercase mb-3">/ Contact</p>
          <h1 className="font-serif text-3xl md:text-4xl text-white">Contact & espace</h1>

          {loading ? <p className="mt-8 text-white/40">Chargement…</p> : null}
          {error ? <div className="mt-8 border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-3">{error}</div> : null}

          {!loading && !error ? (
            <div className="mt-10 group relative overflow-hidden border-2 border-white/25 bg-[#0e2624]/45 backdrop-blur-sm shadow-[0_70px_220px_-120px_rgba(0,0,0,0.98)] animate-fade-up transition-transform duration-500 hover:-translate-y-1">
              {/* Glow / light */}
              <div className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-700 group-hover:opacity-100 animate-neon-border">
                <div className="absolute -inset-24 bg-[radial-gradient(680px_420px_at_22%_18%,rgba(193,157,96,0.34),transparent_62%)]" />
                <div className="absolute -inset-24 bg-[radial-gradient(620px_420px_at_85%_70%,rgba(45,212,191,0.22),transparent_62%)]" />
                <div className="absolute -inset-24 bg-[radial-gradient(520px_380px_at_58%_40%,rgba(99,102,241,0.18),transparent_60%)]" />
              </div>

              <div className="relative min-h-[560px]">
                  <img
                    src={heroImage}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover animate-photo-soft transition-transform duration-700 group-hover:scale-[1.055]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-black/10" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),transparent_18%,transparent_78%,rgba(0,0,0,0.42))]" />
                  <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_18%_22%,rgba(193,157,96,0.16),transparent_55%)]" />

                  <div className="relative h-full p-10 md:p-12">
                    <div className="max-w-[52rem]">
                      <p className="text-white/60 text-[10px] tracking-[0.48em] uppercase">{cardKicker}</p>
                      <h2 className="mt-3 font-serif text-4xl md:text-6xl text-white drop-shadow-[0_8px_40px_rgba(0,0,0,0.75)]">
                        {cardTitle}
                      </h2>
                      <div className="mt-6 h-px w-full bg-white/25" />
                    </div>

                    <div className="mt-10">
                      {/* Contact infos (full width) */}
                      <div className="border border-white/25 bg-black/25 backdrop-blur-md p-8 md:p-10 shadow-[0_40px_120px_-80px_rgba(0,0,0,0.95)] transition-colors duration-500 group-hover:border-[#c19d60]/60">
                        <p className="text-[#c19d60] text-[10px] tracking-[0.55em] uppercase mb-6">/ Contact</p>
                        <div className="grid gap-5">
                          <div className="flex items-center justify-between gap-6 border-b border-white/20 pb-3">
                            <span className="text-white/60 text-[10px] tracking-[0.34em] uppercase">Téléphone</span>
                            <span className="font-serif text-2xl md:text-3xl text-white/95">{contactPhone}</span>
                          </div>
                          <div className="flex items-center justify-between gap-6 border-b border-white/20 pb-3">
                            <span className="text-white/60 text-[10px] tracking-[0.34em] uppercase">Email</span>
                            <span className="text-white/95 text-lg md:text-xl">{contactEmail}</span>
                          </div>
                          <div className="flex items-start justify-between gap-6">
                            <span className="text-white/60 text-[10px] tracking-[0.34em] uppercase">Adresse</span>
                            <span className="text-white/95 text-right text-lg md:text-xl leading-relaxed max-w-[34rem]">
                              {contactAddress}
                            </span>
                          </div>
                        </div>

                        {mapPreview?.embedSrc ? (
                          <div className="mt-8">
                            <p className="text-[#c19d60] text-[10px] tracking-[0.55em] uppercase mb-3">/ Maps</p>
                            <div className="h-72 overflow-hidden border border-white/25 bg-[#0b1f1e] shadow-[0_35px_110px_-90px_rgba(0,0,0,0.95)]">
                              <iframe
                                src={mapPreview.embedSrc}
                                title="Google Maps"
                                className="h-full w-full border-0"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                allowFullScreen
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Contact;

