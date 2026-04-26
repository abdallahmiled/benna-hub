import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { getOwnerCafe, getOwnerCafeReservations, updateCafeReservationStatus } from '../services/api';

/** Visuel type plan de salle (réf. propriétaire) */
const TABLE_PLAN_IMAGE =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSjvX-1lAMpzlw2GpZ-W7QKw0bSlfcJLMH9A&s';

function localDateYYYYMMDD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const statusLabel = (s) =>
  ({
    pending: 'En attente',
    accepted: 'Acceptée',
    rejected: 'Refusée',
    completed: 'Terminée',
    cancelled: 'Annulée',
  }[s] || s);

const formatNo = (x) => String(Number(x?.orderNumber || 0) || 0).padStart(5, '0');

const CafeOwnerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cafe, setCafe] = useState(null);
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState('');
  const [gridDate, setGridDate] = useState(localDateYYYYMMDD);

  const load = async () => {
    setError('');
    try {
      const [cRes, rRes] = await Promise.all([getOwnerCafe(), getOwnerCafeReservations()]);
      setCafe(cRes.data || null);
      setRows(rRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur chargement dashboard café');
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

  const pending = useMemo(() => rows.filter((r) => r.status === 'pending'), [rows]);

  const tableCapacity = Math.max(0, Number(cafe?.tableCount) || 0);

  const ordinarySlots = useMemo(() => {
    if (tableCapacity < 1) return 0;
    const o = cafe?.ordinaryTableCount;
    if (o == null) return tableCapacity;
    return Math.max(0, Math.min(tableCapacity, Number(o) || 0));
  }, [cafe?.ordinaryTableCount, tableCapacity]);

  const familySlots = Math.max(0, tableCapacity - ordinarySlots);

  const reservationByTable = useMemo(() => {
    const map = {};
    for (const r of rows) {
      if (r.status !== 'accepted' || r.reservationDate !== gridDate) continue;
      const n = Number(r.assignedTableNumber);
      if (n >= 1 && n <= tableCapacity) map[n] = r;
    }
    return map;
  }, [rows, gridDate, tableCapacity]);

  const reservedCount = useMemo(
    () => Object.keys(reservationByTable).length,
    [reservationByTable]
  );
  const freeCount = Math.max(0, tableCapacity - reservedCount);

  const setStatus = async (id, status) => {
    setSaving(id);
    try {
      await updateCafeReservationStatus(id, { status });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur mise à jour réservation');
    } finally {
      setSaving('');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1f1e] text-white font-sans">
      <Navbar />
      <div className="pt-28 pb-16 px-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-[#c19d60] text-[10px] tracking-[0.35em] uppercase mb-2">/ Dashboard café</p>
          <h1 className="font-serif text-3xl md:text-4xl text-white">{cafe?.name || 'Mon café'}</h1>
          <p className="text-white/45 text-sm mt-2">Réservations reçues, occasions et gestion statut.</p>
        </div>
        {error ? <div className="mb-4 border border-red-500/30 bg-red-500/10 text-red-300 px-4 py-3">{error}</div> : null}
        {loading ? <p className="text-white/40">Chargement…</p> : null}

        {!loading && cafe ? (
          <section className="border border-white/10 bg-[#0e2624] p-5 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
              <div>
                <h2 className="font-serif text-2xl">Plan des tables</h2>
                <p className="text-white/45 text-sm mt-1">
                  {tableCapacity > 0
                    ? `${tableCapacity} table(s) (${ordinarySlots} ordinaires · ${familySlots} familiales) · ${reservedCount} réservée(s) · ${freeCount} libre(s) — date affichée ci-dessous`
                    : 'Définissez le nombre de tables dans Mon profil (gestion des tables).'}
                </p>
              </div>
              <label className="flex flex-col gap-1 text-[10px] tracking-widest uppercase text-white/45">
                Date
                <input
                  type="date"
                  value={gridDate}
                  onChange={(e) => setGridDate(e.target.value)}
                  className="bg-[#0b1f1e] border border-white/15 text-white px-3 py-2 text-sm tracking-normal normal-case"
                />
              </label>
            </div>
            {tableCapacity > 0 ? (
              <>
                <div className="flex flex-wrap gap-4 text-xs text-white/55 mb-4">
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500/80" /> Libre
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-sm bg-rose-600/85" /> Réservée (acceptée)
                  </span>
                  <span className="text-white/35">
                    {ordinarySlots >= tableCapacity
                      ? `N° 1–${tableCapacity} : ordinaires`
                      : `N° 1–${ordinarySlots} : ordinaires · ${ordinarySlots + 1}–${tableCapacity} : familiales`}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {Array.from({ length: tableCapacity }, (_, i) => {
                    const num = i + 1;
                    const r = reservationByTable[num];
                    const busy = Boolean(r);
                    const kind = num <= ordinarySlots ? 'Ordinaire' : 'Familiale';
                    return (
                      <div
                        key={num}
                        title={
                          busy
                            ? `${kind} · ${r.user?.name || 'Client'} · ${r.reservationDate} ${r.reservationTime || ''} · ${r.peopleCount || ''} pers.`
                            : `Table ${num} (${kind}) — libre`
                        }
                        className={`relative overflow-hidden rounded-lg border aspect-square flex flex-col items-center justify-center p-2 transition-colors ${
                          busy
                            ? 'border-rose-500/50 bg-rose-950/30'
                            : 'border-emerald-500/35 bg-emerald-950/20'
                        }`}
                      >
                        <div className="absolute inset-0 opacity-[0.22] pointer-events-none">
                          <img
                            src={TABLE_PLAN_IMAGE}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="relative z-[1] text-[#c19d60] font-serif text-lg font-semibold">
                          {num}
                        </span>
                        <span className="relative z-[1] text-[8px] tracking-widest uppercase text-white/40 mt-0.5">
                          {kind}
                        </span>
                        <span
                          className={`relative z-[1] text-[9px] tracking-widest uppercase mt-1 ${
                            busy ? 'text-rose-200/90' : 'text-emerald-200/80'
                          }`}
                        >
                          {busy ? 'Réservée' : 'Libre'}
                        </span>
                        {busy ? (
                          <>
                            <p className="relative z-[1] text-[10px] text-white/70 text-center line-clamp-2 mt-1">
                              {r.user?.name || 'Client'}
                            </p>
                            <p className="relative z-[1] text-[9px] text-[#c19d60]/90 text-center">
                              {r.reservationDate} · {r.reservationTime}
                            </p>
                          </>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <p className="text-white/35 text-[10px] mt-3">
                  Les demandes « en attente » n’occupent pas une table tant qu’elles ne sont pas acceptées.
                </p>
              </>
            ) : null}
          </section>
        ) : null}

        <section className="border border-white/10 bg-[#0e2624] p-5">
          <h2 className="font-serif text-2xl mb-4">Réservations en attente ({pending.length})</h2>
          {!rows.length ? (
            <p className="text-white/40 text-sm">Aucune réservation.</p>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r._id} className="border border-white/10 bg-[#0b1f1e]/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white/45 text-[10px] tracking-widest uppercase">
                        #{formatNo(r)} · {statusLabel(r.status)}
                      </p>
                      <p className="text-white mt-1">
                        {r.user?.name || 'Client'} · {r.peopleCount} personne(s)
                      </p>
                      <p className="text-white/55 text-sm mt-1">
                        {r.reservationDate} à {r.reservationTime} · {r.occasionType}
                      </p>
                      {r.note ? <p className="text-white/55 text-sm mt-1">Message: {r.note}</p> : null}
                      <p className="text-[#c19d60] text-sm mt-1">Prix réservation: {r.tablePrice || 0} TND</p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {r.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setStatus(r._id, 'accepted')}
                            disabled={saving === r._id}
                            className="px-3 py-2 text-[10px] tracking-widest uppercase border border-white/15 text-white/70 hover:text-white hover:border-white/35"
                          >
                            Accepter
                          </button>
                          <button
                            type="button"
                            onClick={() => setStatus(r._id, 'rejected')}
                            disabled={saving === r._id}
                            className="px-3 py-2 text-[10px] tracking-widest uppercase border border-red-500/30 text-red-300 hover:text-red-200 hover:border-red-400/50"
                          >
                            Refuser
                          </button>
                        </>
                      ) : null}
                      {r.status === 'accepted' ? (
                        <button
                          type="button"
                          onClick={() => setStatus(r._id, 'completed')}
                          disabled={saving === r._id}
                          className="px-3 py-2 text-[10px] tracking-widest uppercase bg-[#c19d60] text-[#0b1f1e] hover:bg-[#d4ac70]"
                        >
                          Terminée
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CafeOwnerDashboard;

