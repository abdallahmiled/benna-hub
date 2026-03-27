import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { getOwnerCafe, getOwnerCafeReservations, updateCafeReservationStatus } from '../services/api';

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

