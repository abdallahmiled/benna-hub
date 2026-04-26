import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import {
  getMyCafeReservations,
  getMyCommandes,
  getOwnerCafe,
  getOwnerFoods,
  getOwnerRestaurant,
  getProfile,
  updateOwnerCafe,
  updateProfile,
} from '../services/api';

const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const toImageUrl = (value) => {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${API_ORIGIN}${value}`;
};

const formatRating = (rating, count) => {
  const r = typeof rating === 'number' ? rating : 0;
  const c = typeof count === 'number' ? count : 0;
  return `${r.toFixed(1)} / 5 (${c})`;
};

const statusLabel = (status) => {
  const map = {
    pending: 'En attente',
    accepted: 'Acceptée',
    rejected: 'Refusée',
    preparing: 'En préparation',
    ready_for_delivery: 'Prête',
    out_for_delivery: 'En livraison',
    delivered: 'Livrée',
    cancelled: 'Annulée',
  };
  return map[status] || status;
};

const reservationStatusLabel = (status) => {
  const map = {
    pending: 'En attente',
    accepted: 'Acceptée',
    rejected: 'Refusée',
    completed: 'Terminée',
    cancelled: 'Annulée',
  };
  return map[status] || status;
};

const formatOrderNo = (order) => {
  const n = Number(order?.orderNumber || 0);
  if (n > 0) return String(n).padStart(5, '0');
  return String(order?._id || '').slice(-5).toUpperCase();
};

const formatReservationNo = (r) => {
  const n = Number(r?.orderNumber || 0);
  if (n > 0) return String(n).padStart(5, '0');
  return String(r?._id || '').slice(-5).toUpperCase();
};

const Profile = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [me, setMe] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [restaurant, setRestaurant] = useState(null);
  const [foods, setFoods] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [myReservations, setMyReservations] = useState([]);
  const [cafe, setCafe] = useState(null);
  const [cafeTableForm, setCafeTableForm] = useState({ tableCount: '', ordinaryTableCount: '' });
  const [cafeTablesSaving, setCafeTablesSaving] = useState(false);
  const [cafeTablesMsg, setCafeTablesMsg] = useState('');
  const [cafeTablesError, setCafeTablesError] = useState('');

  const isOwner = useMemo(() => (me?.role || user?.role) === 'owner', [me?.role, user?.role]);
  const isCafeOwner = useMemo(() => (me?.role || user?.role) === 'cafe_owner', [me?.role, user?.role]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      setLoading(true);
      try {
        const profileRes = await getProfile();
        if (cancelled) return;
        const u = profileRes.data?.user || null;
        setMe(u);
        setForm({
          name: u?.name || '',
          email: u?.email || '',
          phone: u?.phone || '',
          address: u?.address || '',
        });

        if (profileRes.data?.user?.role === 'owner') {
          const [rRes, fRes] = await Promise.all([getOwnerRestaurant(), getOwnerFoods()]);
          if (cancelled) return;
          setRestaurant(rRes.data);
          setFoods(fRes.data || []);
        } else if (profileRes.data?.user?.role === 'cafe_owner') {
          const [cRes, resRes] = await Promise.all([getOwnerCafe(), getMyCafeReservations()]);
          if (cancelled) return;
          const c = cRes.data;
          setCafe(c);
          setCafeTableForm({
            tableCount: c?.tableCount != null ? String(c.tableCount) : '',
            ordinaryTableCount:
              c?.ordinaryTableCount != null && !Number.isNaN(Number(c.ordinaryTableCount))
                ? String(c.ordinaryTableCount)
                : '',
          });
          setMyReservations(resRes.data || []);
        } else {
          const [oRes, cRes] = await Promise.all([getMyCommandes(), getMyCafeReservations()]);
          if (cancelled) return;
          setMyOrders(oRes.data || []);
          setMyReservations(cRes.data || []);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || 'Impossible de charger votre profil. Connectez-vous.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveProfile = async () => {
    setError('');
    setSaveMsg('');
    setSaving(true);
    try {
      const res = await updateProfile(form);
      const updated = res.data?.user || null;
      setMe(updated);
      if (updated) {
        setForm({
          name: updated.name || '',
          email: updated.email || '',
          phone: updated.phone || '',
          address: updated.address || '',
        });
        setUser?.(updated);
      }
      setSaveMsg('Profil mis à jour.');
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de mettre à jour le profil.');
    } finally {
      setSaving(false);
    }
  };

  const activeOrders = useMemo(() => {
    const active = ['pending', 'accepted', 'preparing', 'ready_for_delivery', 'out_for_delivery'];
    return (myOrders || []).filter((o) => active.includes(o.status));
  }, [myOrders]);

  const activeReservations = useMemo(() => {
    const active = ['pending', 'accepted'];
    return (myReservations || []).filter((r) => active.includes(r.status));
  }, [myReservations]);

  const cafeFamilyPreview = useMemo(() => {
    const t = parseInt(String(cafeTableForm.tableCount).trim(), 10);
    const oRaw = String(cafeTableForm.ordinaryTableCount).trim();
    if (!Number.isFinite(t) || t < 1 || oRaw === '') return null;
    const ord = Math.max(0, Math.min(t, parseInt(oRaw, 10) || 0));
    return t - ord;
  }, [cafeTableForm.tableCount, cafeTableForm.ordinaryTableCount]);

  const saveCafeTables = async () => {
    setCafeTablesError('');
    setCafeTablesMsg('');
    const total = Math.max(0, parseInt(String(cafeTableForm.tableCount).trim(), 10) || 0);
    if (total < 1) {
      setCafeTablesError('Le nombre total de tables doit être au moins 1.');
      return;
    }
    const ordRaw = String(cafeTableForm.ordinaryTableCount).trim();
    if (ordRaw === '') {
      setCafeTablesError('Indiquez le nombre de tables ordinaires (le reste sera compté en tables familiales).');
      return;
    }
    const ordinary = Math.max(0, Math.min(total, parseInt(ordRaw, 10) || 0));
    setCafeTablesSaving(true);
    try {
      const res = await updateOwnerCafe({ tableCount: total, ordinaryTableCount: ordinary });
      const updated = res.data;
      setCafe(updated);
      setCafeTableForm({
        tableCount: String(updated.tableCount ?? total),
        ordinaryTableCount:
          updated.ordinaryTableCount != null ? String(updated.ordinaryTableCount) : String(ordinary),
      });
      setCafeTablesMsg('Capacité et répartition des tables enregistrées.');
    } catch (err) {
      setCafeTablesError(err.response?.data?.message || 'Impossible d’enregistrer les tables.');
    } finally {
      setCafeTablesSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1f1e] text-white font-sans">
      <Navbar />

      <div className="pt-28 pb-16 px-6 max-w-5xl mx-auto">
        <p className="text-[#c19d60] text-[10px] tracking-[0.35em] uppercase mb-2">/ Mon profil</p>
        <h1 className="font-serif text-3xl md:text-4xl text-white mb-8">Profil</h1>

        {loading ? (
          <div className="border border-white/10 bg-[#0e2624] p-6 text-white/60">Chargement…</div>
        ) : (
          <>
            {error ? (
              <div className="mb-4 border border-red-500/30 bg-red-500/10 p-4 text-red-300 text-sm">{error}</div>
            ) : null}
            <div className="grid gap-6 lg:grid-cols-3">
            <section className="lg:col-span-1 border border-white/10 bg-[#0e2624] p-6 space-y-4">
              <h2 className="text-[10px] tracking-[0.25em] uppercase text-[#c19d60]">Compte</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-white/45 block mb-1">Nom</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-[#0b1f1e] border border-white/10 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-white/45 block mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full bg-[#0b1f1e] border border-white/10 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-white/45 block mb-1">Téléphone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full bg-[#0b1f1e] border border-white/10 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-white/45 block mb-1">Adresse</label>
                  <input
                    value={form.address}
                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                    className="w-full bg-[#0b1f1e] border border-white/10 px-3 py-2 text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={saving}
                  className="w-full mt-2 py-2.5 bg-[#c19d60] hover:bg-[#d4ac70] text-[#0b1f1e] text-[11px] font-semibold tracking-[0.22em] uppercase transition-all disabled:opacity-50"
                >
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                {saveMsg ? <p className="text-emerald-300 text-xs">{saveMsg}</p> : null}
              </div>
            </section>

            {isCafeOwner ? (
              <div className="lg:col-span-2 space-y-6">
                <section className="border border-[#c19d60]/25 bg-[#0e2624]/90 p-6 space-y-4">
                  <h2 className="text-[10px] tracking-[0.25em] uppercase text-[#c19d60]">Mon café</h2>

                  {!cafe ? (
                    <p className="text-white/60 text-sm">Café introuvable.</p>
                  ) : (
                    <div className="grid md:grid-cols-[160px_1fr] gap-5">
                      <div className="h-28 md:h-32 w-full overflow-hidden border border-white/10 bg-[#0b1f1e]">
                        {cafe.image ? (
                          <img src={toImageUrl(cafe.image)} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-white/25 text-xs">
                            Aucune image
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-serif text-2xl text-white truncate">{cafe.name}</p>
                        <p className="text-white/50 text-sm mt-1">{cafe.address || '—'}</p>
                        {cafe.description ? (
                          <p className="text-white/60 text-sm mt-3 leading-relaxed">{cafe.description}</p>
                        ) : null}
                        {cafe.googleMapsUrl ? (
                          <a
                            href={cafe.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex mt-4 text-[10px] uppercase tracking-[0.2em] border border-white/20 px-4 py-2 text-white/70 hover:text-white hover:border-white/40 transition-colors"
                          >
                            Ouvrir Google Maps
                          </a>
                        ) : null}
                      </div>
                    </div>
                  )}
                </section>

                <section className="border border-white/10 bg-[#0e2624] p-6 space-y-4">
                  <h2 className="text-[10px] tracking-[0.25em] uppercase text-[#c19d60]">Gestion des tables</h2>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Le total correspond à ce que vous avez indiqué à l’inscription (ex. 20 tables). Saisissez
                    uniquement le nombre de{' '}
                    <span className="text-white/70">tables ordinaires</span> : les{' '}
                    <span className="text-white/70">tables familiales</span> sont calculées automatiquement
                    (total − ordinaires). Chaque réservation acceptée apparaît sur le dashboard avec la date et
                    l’heure.
                  </p>
                  {cafeTablesError ? (
                    <div className="border border-red-500/30 bg-red-500/10 p-3 text-red-300 text-sm">
                      {cafeTablesError}
                    </div>
                  ) : null}
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-white/45 block mb-1">Nombre total de tables</label>
                      <input
                        type="number"
                        min={1}
                        value={cafeTableForm.tableCount}
                        onChange={(e) =>
                          setCafeTableForm((p) => ({ ...p, tableCount: e.target.value }))
                        }
                        className="w-full bg-[#0b1f1e] border border-white/10 px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-white/45 block mb-1">Tables ordinaires</label>
                      <input
                        type="number"
                        min={0}
                        value={cafeTableForm.ordinaryTableCount}
                        onChange={(e) =>
                          setCafeTableForm((p) => ({ ...p, ordinaryTableCount: e.target.value }))
                        }
                        className="w-full bg-[#0b1f1e] border border-white/10 px-3 py-2 text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-white/45 block mb-1">Tables familiales (calcul automatique)</label>
                      <div className="w-full bg-[#0b1f1e]/80 border border-white/10 px-3 py-2 text-[#c19d60] font-medium">
                        {cafeFamilyPreview != null ? cafeFamilyPreview : '—'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={saveCafeTables}
                    disabled={cafeTablesSaving || !cafe}
                    className="w-full sm:w-auto px-8 py-2.5 bg-[#c19d60] hover:bg-[#d4ac70] text-[#0b1f1e] text-[11px] font-semibold tracking-[0.22em] uppercase transition-all disabled:opacity-50"
                  >
                    {cafeTablesSaving ? 'Enregistrement…' : 'Enregistrer les tables'}
                  </button>
                  {cafeTablesMsg ? <p className="text-emerald-300 text-xs">{cafeTablesMsg}</p> : null}
                </section>

                <section className="border border-white/10 bg-[#0e2624] p-6">
                  <h2 className="text-[10px] tracking-[0.25em] uppercase text-[#c19d60]">Mes réservations café</h2>
                  <p className="text-white/40 text-xs mt-2">
                    Réservations où vous êtes client dans un autre établissement.
                  </p>
                  {activeReservations.length === 0 ? (
                    <p className="mt-3 text-white/55 text-sm">Vous n’avez aucune réservation en cours.</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {activeReservations.map((r) => (
                        <div key={r._id} className="border border-white/10 bg-[#0b1f1e]/40 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-white/80 text-sm">
                              #{formatReservationNo(r)} · {r.cafe?.name || 'Café'}
                            </p>
                            <span className="text-[10px] uppercase tracking-widest text-[#c19d60]">
                              {reservationStatusLabel(r.status)}
                            </span>
                          </div>
                          <p className="mt-2 text-white/45 text-xs">
                            {r.reservationDate} à {r.reservationTime} · {r.peopleCount} personne(s) ·{' '}
                            {r.occasionType}
                          </p>
                          <p className="mt-2 text-emerald-300/90 text-xs">
                            {r.ownerMessage || 'Votre réservation est en cours de traitement.'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            ) : isOwner ? (
              <div className="lg:col-span-2 space-y-6">
                <section className="border border-[#c19d60]/25 bg-[#0e2624]/90 p-6 space-y-4">
                  <h2 className="text-[10px] tracking-[0.25em] uppercase text-[#c19d60]">Mon restaurant</h2>

                  {!restaurant ? (
                    <p className="text-white/60 text-sm">Restaurant introuvable.</p>
                  ) : (
                    <div className="grid md:grid-cols-[160px_1fr] gap-5">
                      <div className="h-28 md:h-32 w-full overflow-hidden border border-white/10 bg-[#0b1f1e]">
                        {restaurant.image ? (
                          <img
                            src={toImageUrl(restaurant.image)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-white/25 text-xs">
                            Aucune image
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="font-serif text-2xl text-white truncate">{restaurant.name}</p>
                        <p className="text-white/50 text-sm mt-1">{restaurant.address || '—'}</p>
                        {restaurant.description ? (
                          <p className="text-white/60 text-sm mt-3 leading-relaxed">{restaurant.description}</p>
                        ) : null}
                        <p className="text-white/45 text-sm mt-3">
                          Rating: <span className="text-white">{formatRating(restaurant.rating, restaurant.ratingCount)}</span>
                        </p>
                        {restaurant.googleMapsUrl ? (
                          <a
                            href={restaurant.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex mt-4 text-[10px] uppercase tracking-[0.2em] border border-white/20 px-4 py-2 text-white/70 hover:text-white hover:border-white/40 transition-colors"
                          >
                            Ouvrir Google Maps
                          </a>
                        ) : null}
                      </div>
                    </div>
                  )}
                </section>

                <section className="border border-white/10 bg-[#0e2624] p-6">
                  <div className="flex items-end justify-between gap-4 mb-4">
                    <h2 className="text-[10px] tracking-[0.25em] uppercase text-[#c19d60]">Mes plats</h2>
                    <span className="text-[10px] text-white/35">{foods.length} plat(s)</span>
                  </div>

                  {foods.length === 0 ? (
                    <p className="text-white/50 text-sm">Aucun plat pour le moment.</p>
                  ) : (
                    <div className="overflow-hidden border border-white/10">
                      <table className="w-full text-sm">
                        <thead className="bg-[#0b1f1e]/60 text-white/55">
                          <tr>
                            <th className="text-left font-medium px-4 py-3">Plat</th>
                            <th className="text-left font-medium px-4 py-3">Prix</th>
                            <th className="text-left font-medium px-4 py-3">Rating</th>
                            <th className="text-left font-medium px-4 py-3">Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {foods.map((f) => (
                            <tr key={f._id} className="border-t border-white/10 bg-[#0e2624]">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="h-9 w-9 overflow-hidden border border-white/10 bg-[#0b1f1e] shrink-0">
                                    {f.image ? (
                                      <img src={toImageUrl(f.image)} alt="" className="h-full w-full object-cover" />
                                    ) : null}
                                  </div>
                                  <span className="truncate text-white">{f.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-[#c19d60] font-medium whitespace-nowrap">
                                {typeof f.price === 'number' ? `${f.price} TND` : f.price}
                              </td>
                              <td className="px-4 py-3 text-white/70 whitespace-nowrap">
                                {typeof f.rating === 'number'
                                  ? `${f.rating.toFixed(1)} / 5 (${f.ratingCount ?? 0})`
                                  : '—'}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`text-[10px] uppercase tracking-widest ${
                                    f.isAvailable !== false ? 'text-emerald-300/90' : 'text-white/45'
                                  }`}
                                >
                                  {f.isAvailable !== false ? 'Disponible' : 'Indisponible'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </div>
            ) : (
              <div className="lg:col-span-2 space-y-6">
                <section className="border border-white/10 bg-[#0e2624] p-6">
                  <h2 className="text-[10px] tracking-[0.25em] uppercase text-[#c19d60]">Mes commandes</h2>
                  {activeOrders.length === 0 ? (
                    <p className="mt-3 text-white/55 text-sm">Vous n’avez aucune commande en cours.</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {activeOrders.map((o) => (
                        <div key={o._id} className="border border-white/10 bg-[#0b1f1e]/40 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-white/80 text-sm">
                              #{formatOrderNo(o)} · {o.restaurant?.name || 'Restaurant'}
                            </p>
                            <span className="text-[10px] uppercase tracking-widest text-[#c19d60]">
                              {statusLabel(o.status)}
                            </span>
                          </div>
                          <p className="mt-2 text-white/45 text-xs">
                            {o.customerMessage || 'Votre commande est en cours de traitement.'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="border border-white/10 bg-[#0e2624] p-6">
                  <h2 className="text-[10px] tracking-[0.25em] uppercase text-[#c19d60]">Mes réservations café</h2>
                  {activeReservations.length === 0 ? (
                    <p className="mt-3 text-white/55 text-sm">Vous n’avez aucune réservation en cours.</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {activeReservations.map((r) => (
                        <div key={r._id} className="border border-white/10 bg-[#0b1f1e]/40 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-white/80 text-sm">
                              #{formatReservationNo(r)} · {r.cafe?.name || 'Café'}
                            </p>
                            <span className="text-[10px] uppercase tracking-widest text-[#c19d60]">
                              {reservationStatusLabel(r.status)}
                            </span>
                          </div>
                          <p className="mt-2 text-white/45 text-xs">
                            {r.reservationDate} à {r.reservationTime} · {r.peopleCount} personne(s) · {r.occasionType}
                          </p>
                          <p className="mt-2 text-emerald-300/90 text-xs">
                            {r.ownerMessage || 'Votre réservation est en cours de traitement.'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;

