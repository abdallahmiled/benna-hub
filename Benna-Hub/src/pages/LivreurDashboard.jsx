import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { getMyLivreurCommandes, updateLivreurCommandeStatus } from '../services/api';

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

const formatOrderNo = (order) => {
  const n = Number(order?.orderNumber || 0);
  if (n > 0) return String(n).padStart(5, '0');
  return String(order?._id || '').slice(-5).toUpperCase();
};

const LivreurDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [saving, setSaving] = useState('');

  const load = async () => {
    setError('');
    try {
      const res = await getMyLivreurCommandes();
      setOrders(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de chargement des commandes livreur.');
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

  const current = useMemo(
    () => (orders || []).filter((o) => ['preparing', 'ready_for_delivery', 'out_for_delivery'].includes(o.status)),
    [orders]
  );

  const done = useMemo(() => (orders || []).filter((o) => o.status === 'delivered'), [orders]);

  const updateStatus = async (id, status) => {
    setSaving(id);
    setError('');
    try {
      await updateLivreurCommandeStatus(id, { status });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur mise à jour statut livraison.');
    } finally {
      setSaving('');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1f1e] text-white font-sans">
      <Navbar />
      <div className="pt-28 pb-16 px-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-[#c19d60] text-[10px] tracking-[0.35em] uppercase mb-2">/ Dashboard livreur</p>
          <h1 className="font-serif text-3xl md:text-4xl text-white">Mes livraisons</h1>
          <p className="text-white/45 text-sm mt-2">Les nouvelles commandes te sont assignées automatiquement.</p>
        </div>

        {error ? <div className="mb-4 border border-red-500/30 bg-red-500/10 text-red-300 px-4 py-3">{error}</div> : null}
        {loading ? <p className="text-white/40">Chargement…</p> : null}

        <div className="grid lg:grid-cols-2 gap-6">
          <section className="border border-white/10 bg-[#0e2624] p-5">
            <h2 className="font-serif text-2xl text-white mb-4">En cours</h2>
            {current.length === 0 ? (
              <p className="text-white/40 text-sm">Aucune livraison en cours.</p>
            ) : (
              <div className="space-y-3">
                {current.map((o) => (
                  <div key={o._id} className="border border-white/10 bg-[#0b1f1e]/35 p-4">
                    <p className="text-white/45 text-[10px] tracking-widest uppercase">
                      #{formatOrderNo(o)} · {o.restaurant?.name || 'Restaurant'}
                    </p>
                    <p className="mt-1 text-white/80 text-sm">
                      Client: {o.user?.name || 'Client'} · {o.user?.phone || '—'}
                    </p>
                    <p className="mt-1 text-white/55 text-sm">Adresse: {o.deliveryAddress || o.user?.address || '—'}</p>
                    <p className="mt-2 text-[#c19d60] text-sm">{statusLabel(o.status)}</p>
                    <div className="mt-3 flex gap-2">
                      {o.status === 'ready_for_delivery' ? (
                        <button
                          type="button"
                          onClick={() => updateStatus(o._id, 'out_for_delivery')}
                          disabled={saving === o._id}
                          className="px-4 py-2 text-[10px] tracking-widest uppercase border border-white/15 text-white/75 hover:text-white hover:border-white/35 disabled:opacity-50"
                        >
                          En livraison
                        </button>
                      ) : null}
                      {o.status === 'out_for_delivery' ? (
                        <button
                          type="button"
                          onClick={() => updateStatus(o._id, 'delivered')}
                          disabled={saving === o._id}
                          className="px-4 py-2 text-[10px] tracking-widest uppercase bg-[#c19d60] text-[#0b1f1e] hover:bg-[#d4ac70] disabled:opacity-50"
                        >
                          Livrée
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="border border-white/10 bg-[#0e2624] p-5">
            <h2 className="font-serif text-2xl text-white mb-4">Livrées</h2>
            {done.length === 0 ? (
              <p className="text-white/40 text-sm">Aucune livraison terminée.</p>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
                {done.map((o) => (
                  <div key={o._id} className="border border-white/10 bg-[#0b1f1e]/35 p-4">
                    <p className="text-white/45 text-[10px] tracking-widest uppercase">
                      #{formatOrderNo(o)} · {o.restaurant?.name || 'Restaurant'}
                    </p>
                    <p className="mt-1 text-white/75 text-sm">
                      {o.user?.name || 'Client'} · {o.user?.phone || '—'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default LivreurDashboard;

