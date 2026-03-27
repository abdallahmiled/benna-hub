import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getOwnerDashboard, updateCommandeStatus } from '../services/api';

const API_ORIGIN = 'http://localhost:5000';

const toImageUrl = (value) => {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${API_ORIGIN}${value}`;
};

const formatTnd = (n) => {
  const v = Number(n) || 0;
  return `${v.toLocaleString('fr-TN', { maximumFractionDigits: 2 })} TND`;
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
    cancelled: 'Annulée'
  };
  return map[status] || status;
};

const STATUS_ORDER = [
  'delivered',
  'pending',
  'accepted',
  'preparing',
  'ready_for_delivery',
  'out_for_delivery',
  'rejected',
  'cancelled'
];

const STATUS_COLORS = {
  delivered: 'bg-emerald-500/80',
  pending: 'bg-amber-500/80',
  accepted: 'bg-sky-500/80',
  preparing: 'bg-violet-500/80',
  ready_for_delivery: 'bg-cyan-500/80',
  out_for_delivery: 'bg-orange-500/80',
  rejected: 'bg-red-500/80',
  cancelled: 'bg-white/30'
};

const formatOrderNo = (order) => {
  const n = Number(order?.orderNumber || 0);
  if (n > 0) return String(n).padStart(5, '0');
  return String(order?._id || '').slice(-5).toUpperCase();
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [updating, setUpdating] = useState('');

  useEffect(() => {
    getOwnerDashboard()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Erreur de chargement dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const statCards = useMemo(() => {
    if (!data?.stats) return [];
    const s = data.stats;
    return [
      { label: 'Chiffre d’affaires (livrées)', value: formatTnd(s.totalSalesDelivered), hint: 'Toutes les livrées' },
      { label: 'Chiffre d’affaires (après rating)', value: formatTnd(s.totalSalesRated), hint: 'Livrées + notées' },
      { label: 'Commandes totales', value: s.totalOrders, hint: 'Toutes les commandes' },
      { label: 'Commandes complètes', value: s.completedOrders, hint: 'Livrées' },
      { label: 'Commandes en cours', value: s.remainingOrders, hint: 'Pas encore livrées' },
      { label: 'Refusées', value: s.rejectedOrders ?? 0, hint: 'Par le restaurant' },
      { label: 'Annulées', value: s.cancelledOrders ?? 0, hint: 'Annulations' },
      { label: 'Plats au menu', value: s.totalFoods, hint: 'Produits affichés' },
      { label: 'Note moyenne', value: `${data.restaurant?.rating || 0} / 5`, hint: `${data.restaurant?.ratingCount || 0} avis` }
    ];
  }, [data]);

  const salesByDay = data?.charts?.salesByDay || [];
  const ordersByStatus = data?.charts?.ordersByStatus || {};
  const maxDaySales = Math.max(...salesByDay.map((d) => d.total), 1);

  const statusRows = useMemo(() => {
    return STATUS_ORDER.map((key) => ({
      key,
      label: statusLabel(key),
      count: ordersByStatus[key] || 0,
      color: STATUS_COLORS[key] || 'bg-white/40'
    }));
  }, [ordersByStatus]);

  const maxStatusCount = Math.max(...statusRows.map((r) => r.count), 1);

  const nextActions = (status) => {
    const map = {
      pending: ['accepted', 'rejected'],
      accepted: ['preparing'],
      preparing: ['ready_for_delivery'],
      ready_for_delivery: ['out_for_delivery', 'delivered'],
      out_for_delivery: ['delivered'],
    };
    return map[status] || [];
  };

  const doUpdateStatus = async (orderId, next) => {
    setError('');
    setUpdating(orderId);
    try {
      const payload = { status: next };
      if (next === 'rejected') {
        const reason = window.prompt('Raison du refus ?') || '';
        if (!reason.trim()) {
          setUpdating('');
          return;
        }
        payload.rejectionReason = reason.trim();
      }
      await updateCommandeStatus(orderId, payload);
      const refreshed = await getOwnerDashboard();
      setData(refreshed.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur mise à jour statut commande');
    } finally {
      setUpdating('');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1f1e] text-white font-sans">
      <Navbar />

      <div className="pt-28 pb-12 px-6 max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-[#c19d60] text-[10px] tracking-[0.35em] uppercase mb-3">/ Dashboard propriétaire</p>
            <h1 className="font-serif text-4xl text-white">Performance du restaurant</h1>
            <p className="text-white/40 mt-2 text-sm">Montants en dinar tunisien (TND) · analyses visuelles</p>
          </div>
          <Link
            to="/owner/manage"
            className="text-center text-[11px] tracking-widest uppercase border border-[#c19d60]/60 text-[#c19d60] px-5 py-2.5 hover:bg-[#c19d60]/10"
          >
            Gérer mon restaurant
          </Link>
        </div>

        {loading && <div className="text-white/40">Chargement...</div>}
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3">{error}</div>}

        {!loading && !error && data && (
          <div className="space-y-8">
            {/* Commandes (workflow) */}
            <div className="bg-[#0e2624] border border-white/10 p-5">
              <div className="flex items-end justify-between gap-4 mb-4">
                <div>
                  <p className="text-[#c19d60] text-[10px] tracking-[0.35em] uppercase">/ Commandes</p>
                  <h2 className="font-serif text-2xl text-white mt-2">Demandes & suivi</h2>
                  <p className="text-white/35 text-xs mt-1">Accepter → Préparer → Prête → Livraison → Livrée</p>
                </div>
              </div>

              {data.recentOrders?.length ? (
                <div className="space-y-3">
                  {data.recentOrders.map((o) => (
                    <div key={o._id} className="border border-white/10 bg-[#0b1f1e]/35 p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-white/45 text-[10px] tracking-widest uppercase">
                            #{formatOrderNo(o)} · {o.user?.name || 'Client'} · {formatTnd(o.totalAmount)}
                          </p>
                          <p className="mt-1 text-white/70 text-sm">{o.customerMessage || statusLabel(o.status)}</p>
                          {o.deliveryAddress ? (
                            <p className="mt-2 text-white/40 text-xs">Adresse: {o.deliveryAddress}</p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] tracking-widest uppercase text-white/60">
                            {statusLabel(o.status)}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[o.status] || 'bg-white/30'}`} />
                        </div>
                      </div>

                      {o.items?.length ? (
                        <div className="mt-4 grid gap-2">
                          {o.items.map((it, idx) => (
                            <div key={idx} className="border border-white/10 bg-[#0e2624]/60 p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-white/80 text-sm">
                                    {it.food?.name || 'Produit'} × {it.quantity}
                                  </p>
                                  {it.note ? <p className="mt-1 text-white/55 text-sm">Note: {it.note}</p> : null}
                                </div>
                                <p className="text-[#c19d60] text-sm whitespace-nowrap">{it.price} TND</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {nextActions(o.status).map((next) => (
                          <button
                            key={next}
                            type="button"
                            onClick={() => doUpdateStatus(o._id, next)}
                            disabled={updating === o._id}
                            className="px-4 py-2 text-[10px] tracking-widest uppercase border border-white/15 text-white/70 hover:text-white hover:border-white/35 disabled:opacity-50"
                          >
                            {next === 'accepted'
                              ? 'Accepter'
                              : next === 'rejected'
                                ? 'Refuser'
                                : next === 'preparing'
                                  ? 'Préparer'
                                  : next === 'ready_for_delivery'
                                    ? 'Prête'
                                    : next === 'out_for_delivery'
                                      ? 'En livraison'
                                      : next === 'delivered'
                                        ? 'Livrée'
                                        : next}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-sm">Aucune commande pour le moment.</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((s) => (
                <div key={s.label} className="bg-[#0e2624] border border-white/10 p-4 hover:border-[#c19d60]/25 transition-colors">
                  <p className="text-white/40 text-[10px] tracking-widest uppercase leading-relaxed">{s.label}</p>
                  <p className="text-[#c19d60] font-serif text-2xl md:text-3xl mt-2">{s.value}</p>
                  {s.hint && <p className="text-white/25 text-[10px] mt-1">{s.hint}</p>}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-[#0e2624] border border-white/10 p-5">
                <h2 className="font-serif text-xl text-white mb-1">Ventes sur 14 jours</h2>
                <p className="text-white/35 text-xs mb-6">Somme des commandes livrées par jour (TND)</p>
                <div className="flex items-end justify-between gap-1 h-52 border-b border-white/10 pb-1">
                  {salesByDay.map((d) => {
                    const barPx = maxDaySales > 0 ? (d.total / maxDaySales) * 180 : 0;
                    const short = d.date.slice(5);
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0 h-full">
                        <div
                          className="w-full max-w-[26px] mx-auto rounded-t bg-gradient-to-t from-[#c19d60] to-[#e8d5b5] transition-all"
                          style={{ height: `${Math.max(barPx, 4)}px` }}
                          title={`${d.date}: ${formatTnd(d.total)}`}
                        />
                        <span className="text-[8px] text-white/30 truncate w-full text-center">{short}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#0e2624] border border-white/10 p-5">
                <h2 className="font-serif text-xl text-white mb-1">Répartition des commandes</h2>
                <p className="text-white/35 text-xs mb-6">Nombre de commandes par statut</p>
                <div className="space-y-3">
                  {statusRows.map((row) => (
                    <div key={row.key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/70">{row.label}</span>
                        <span className="text-[#c19d60]">{row.count}</span>
                      </div>
                      <div className="h-2 bg-[#0b1f1e] rounded overflow-hidden">
                        <div
                          className={`h-full rounded ${row.color}`}
                          style={{ width: `${maxStatusCount ? (row.count / maxStatusCount) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#0e2624] border border-white/10 p-4">
                <h2 className="font-serif text-2xl mb-3">Infos restaurant</h2>
                <p className="text-white mb-1">{data.restaurant?.name}</p>
                <p className="text-white/50 text-sm mb-2">{data.restaurant?.address}</p>
                {data.restaurant?.googleMapsUrl && (
                  <a
                    href={data.restaurant.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#c19d60] text-sm underline"
                  >
                    Ouvrir Google Maps
                  </a>
                )}
                <div className="mt-4">
                  <Link
                    to="/owner/manage"
                    className="inline-block px-4 py-2 border border-[#c19d60]/60 text-[#c19d60] text-xs tracking-widest uppercase hover:bg-[#c19d60]/10"
                  >
                    Modifier le restaurant
                  </Link>
                </div>
              </div>

              <div className="bg-[#0e2624] border border-white/10 p-4">
                <h2 className="font-serif text-2xl mb-3">Commandes récentes</h2>
                <div className="space-y-2 max-h-72 overflow-auto pr-1">
                  {data.recentOrders?.length ? (
                    data.recentOrders.map((o) => (
                      <div key={o._id} className="border border-white/10 p-3 text-sm">
                        <div className="flex justify-between">
                          <span>#{formatOrderNo(o)}</span>
                          <span className="text-[#c19d60]">{statusLabel(o.status)}</span>
                        </div>
                        <div className="text-white/50 mt-1">
                          {o.user?.name || 'Client'} — {formatTnd(o.totalAmount)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-white/40 text-sm">Aucune commande pour le moment.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#0e2624] border border-white/10 p-4">
              <h2 className="font-serif text-2xl mb-3">Plats du restaurant</h2>
              {data.foods?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {data.foods.map((food) => (
                    <div key={food._id} className="border border-white/10 overflow-hidden">
                      <div className="h-32 bg-[#0b1f1e]">
                        <img
                          src={toImageUrl(food.image) || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop'}
                          alt={food.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <p className="text-white">{food.name}</p>
                        <p className="text-[#c19d60] text-sm mt-1">{formatTnd(food.price)}</p>
                        <p className="text-white/40 text-xs mt-1">{food.isAvailable !== false ? 'Disponible' : 'Indisponible'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-sm">Aucun plat ajouté.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
