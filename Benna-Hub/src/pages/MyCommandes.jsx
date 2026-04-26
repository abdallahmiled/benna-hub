import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { getMyCommandes, rateCommande } from '../services/api';

const statusLabel = (status) => {
  const map = {
    pending: 'En attente (envoyée)',
    accepted: 'Acceptée',
    rejected: 'Refusée',
    preparing: 'En cours de préparation',
    ready_for_delivery: 'Prête',
    out_for_delivery: 'En livraison',
    delivered: 'Livrée',
    cancelled: 'Annulée',
  };
  return map[status] || status;
};

const STATUS_COLOR = {
  pending: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
  accepted: 'bg-sky-500/10 border-sky-500/30 text-sky-200',
  preparing: 'bg-violet-500/10 border-violet-500/30 text-violet-200',
  ready_for_delivery: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200',
  out_for_delivery: 'bg-orange-500/10 border-orange-500/30 text-orange-200',
  delivered: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
  rejected: 'bg-red-500/10 border-red-500/30 text-red-200',
  cancelled: 'bg-white/5 border-white/10 text-white/60',
};

const formatOrderNo = (order) => {
  const n = Number(order?.orderNumber || 0);
  if (n > 0) return String(n).padStart(5, '0');
  return String(order?._id || '').slice(-5).toUpperCase();
};

const Stars = ({ value = 0, onPick, readOnly }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) =>
        readOnly || !onPick ? (
          <span
            key={i}
            className={`h-7 w-7 grid place-items-center text-lg select-none ${
              i <= value ? 'text-[#c19d60]' : 'text-white/20'
            }`}
            aria-hidden
          >
            ★
          </span>
        ) : (
          <button
            key={i}
            type="button"
            onClick={() => onPick(i)}
            className={`h-7 w-7 grid place-items-center border border-white/10 hover:border-[#c19d60]/50 ${
              i <= value ? 'text-[#c19d60]' : 'text-white/25'
            }`}
            aria-label={`${i} étoiles`}
          >
            ★
          </button>
        )
      )}
    </div>
  );
};

const MyCommandes = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [ratingDraft, setRatingDraft] = useState({}); // id -> {score, comment}

  const load = async () => {
    setError('');
    try {
      const res = await getMyCommandes();
      setOrders(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de chargement des commandes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canRate = (o) => o.status === 'delivered' && !o.rating?.score;

  const submitRating = async (id) => {
    const d = ratingDraft[id] || {};
    if (!d.score) return;
    try {
      await rateCommande(id, { score: d.score, comment: d.comment || '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur envoi rating.');
    }
  };

  const empty = useMemo(() => !orders.length && !loading, [orders.length, loading]);

  return (
    <div className="min-h-screen bg-[#0b1f1e] text-white font-sans">
      <Navbar />
      <div className="pt-28 pb-16 px-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-[#c19d60] text-[10px] tracking-[0.35em] uppercase mb-2">/ Mes commandes</p>
          <h1 className="font-serif text-3xl md:text-4xl text-white">Suivi de commande</h1>
          <p className="text-white/45 text-sm mt-2">Tu peux suivre ta commande depuis l’acceptation jusqu’à la livraison.</p>
        </div>

        {error ? <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3">{error}</div> : null}
        {loading ? <p className="text-white/40">Chargement…</p> : null}
        {empty ? <p className="text-white/40">Aucune commande pour le moment.</p> : null}

        <div className="space-y-4">
          {orders.map((o) => (
            <article key={o._id} className="border border-white/10 bg-[#0e2624]">
              <div className="px-5 py-4 border-b border-white/10 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-white/45 text-[10px] tracking-widest uppercase">Commande</p>
                  <p className="font-serif text-xl text-white truncate">
                    #{formatOrderNo(o)} — {o.restaurant?.name || 'Restaurant'}
                  </p>
                  <p className="mt-2 text-white/55 text-sm">{o.customerMessage || statusLabel(o.status)}</p>
                </div>
                <span className={`shrink-0 rounded-md border px-3 py-1.5 text-[10px] tracking-widest uppercase ${STATUS_COLOR[o.status] || 'bg-white/5 border-white/10 text-white/60'}`}>
                  {statusLabel(o.status)}
                </span>
              </div>

              <div className="px-5 py-4 space-y-3">
                {(o.items || []).map((it, idx) => (
                  <div key={idx} className="border border-white/10 bg-[#0b1f1e]/35 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-white/85">
                        {it.food?.name || 'Produit'} <span className="text-white/35">×</span> {it.quantity}
                      </p>
                      <p className="text-[#c19d60]">{it.price} TND</p>
                    </div>
                    {it.note ? <p className="mt-2 text-white/55 text-sm">Note: {it.note}</p> : null}
                  </div>
                ))}
              </div>

              {canRate(o) ? (
                <div className="px-5 pb-5">
                  <div className="border border-white/10 bg-[#0b1f1e]/35 p-4">
                    <p className="text-[#c19d60] text-[10px] tracking-[0.35em] uppercase mb-3">Donner une note</p>
                    <p className="text-white/40 text-xs mb-3">
                      Ta note met à jour la moyenne du restaurant ; elle est visible par tout le monde sur la fiche du
                      restaurant.
                    </p>
                    <Stars
                      value={ratingDraft[o._id]?.score || 0}
                      onPick={(score) => setRatingDraft((p) => ({ ...p, [o._id]: { ...(p[o._id] || {}), score } }))}
                    />
                    <textarea
                      value={ratingDraft[o._id]?.comment || ''}
                      onChange={(e) => setRatingDraft((p) => ({ ...p, [o._id]: { ...(p[o._id] || {}), comment: e.target.value } }))}
                      placeholder="Commentaire (optionnel)"
                      className="mt-3 w-full min-h-20 bg-[#0b1f1e] border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-[#c19d60]/50 placeholder-white/25 resize-none"
                    />
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => submitRating(o._id)}
                        className="px-6 py-2.5 bg-[#c19d60] hover:bg-[#d4ac70] text-[#0b1f1e] text-[11px] font-semibold tracking-[0.22em] uppercase transition-all"
                      >
                        Envoyer
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
              {o.status === 'delivered' && o.rating?.score ? (
                <div className="px-5 pb-5">
                  <div className="border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <p className="text-emerald-300/90 text-[10px] tracking-[0.35em] uppercase mb-2">Note enregistrée</p>
                    <Stars value={o.rating.score} readOnly />
                    {o.rating.comment ? (
                      <p className="mt-2 text-white/60 text-sm leading-relaxed">&ldquo;{o.rating.comment}&rdquo;</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyCommandes;

