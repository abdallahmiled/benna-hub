import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getCafes, getFoods, getRestaurants } from '../services/api';
import { buildSearchEntryText, searchEntries } from '../utils/search';

const useQuery = () => {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

const Search = () => {
  const qs = useQuery();
  const initialQ = qs.get('q') || '';
  const [q, setQ] = useState(initialQ);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    setQ(initialQ);
  }, [initialQ]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [rRes, cRes, fRes] = await Promise.all([getRestaurants(), getCafes(), getFoods()]);
        if (!alive) return;

        const restaurants = Array.isArray(rRes.data) ? rRes.data : [];
        const cafes = Array.isArray(cRes.data) ? cRes.data : [];
        const foods = Array.isArray(fRes.data) ? fRes.data : [];

        const next = [
          ...restaurants.map((r) => ({
            type: 'restaurant',
            id: r._id,
            title: r.name || 'Restaurant',
            subtitle: r.speciality || r.city || r.address || '',
            href: `/restaurants/${r._id}`,
            _searchText: buildSearchEntryText([r.name, r.speciality, r.city, r.address, 'restaurant']),
          })),
          ...cafes.map((c) => ({
            type: 'cafe',
            id: c._id || c.id,
            title: c.name || 'Café',
            subtitle: c.hospitalityType || c.services || c.address || '',
            href: `/cafes/${c._id || c.id}`,
            _searchText: buildSearchEntryText([c.name, c.hospitalityType, c.services, c.address, 'cafe']),
          })),
          ...foods.map((f) => ({
            type: 'food',
            id: f._id,
            title: f.name || 'Plat',
            subtitle: f.restaurant?.name || '',
            href: f.restaurant?._id ? `/restaurants/${f.restaurant._id}?food=${f._id}` : `/restaurants/${f.restaurant || ''}?food=${f._id}`,
            _searchText: buildSearchEntryText([f.name, f.description, f.category, f.restaurant?.name, 'food', 'plat']),
          })),
        ];

        setEntries(next);
      } catch {
        if (!alive) return;
        setEntries([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const results = useMemo(() => searchEntries(entries, q, 60), [entries, q]);

  return (
    <div className="min-h-screen bg-[#0b1f1e] text-white font-sans">
      <Navbar />

      <div className="pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-[#c19d60] text-[10px] tracking-[0.45em] uppercase mb-3">/ Recherche</p>
          <h1 className="font-serif text-3xl md:text-4xl text-white">Trouver un café, un restaurant ou un plat</h1>

          <div className="mt-7 border border-white/10 bg-[#0e2624]/60 backdrop-blur-sm p-4">
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ex: Pizza, بيتزا, Café, مطعم..."
                className="w-full bg-[#0b1f1e]/40 border border-white/15 focus:border-[#c19d60]/60 outline-none px-4 py-3 pr-10 text-white placeholder-white/30"
              />
              <svg className="absolute right-3 top-3.5 w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="mt-2 text-white/35 text-[11px] tracking-widest">
              La recherche accepte l’arabe, le français et l’anglais (avec normalisation + synonymes).
            </p>
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="flex items-center gap-3 text-white/35 py-10">
                <div className="w-7 h-7 border-2 border-[#c19d60]/40 border-t-[#c19d60] rounded-full animate-spin" />
                Chargement…
              </div>
            ) : (
              <>
                <p className="text-white/30 text-[11px] tracking-widest mb-5 uppercase">{results.length} résultats</p>
                {results.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.map((r) => (
                      <Link
                        key={`${r.type}_${r.id}`}
                        to={r.href}
                        className="group border border-white/10 bg-[#0e2624]/55 hover:border-[#c19d60]/40 transition-colors p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-serif text-lg text-white truncate">{r.title}</p>
                            <p className="text-white/45 text-[11px] tracking-wider mt-1 line-clamp-2">{r.subtitle}</p>
                          </div>
                          <span className="shrink-0 text-[10px] tracking-[0.35em] uppercase text-[#c19d60]/80">
                            {r.type === 'food' ? 'Plat' : r.type === 'cafe' ? 'Café' : 'Restaurant'}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="border border-white/10 bg-[#0e2624]/40 p-6 text-white/45">
                    Aucun résultat. Essaie avec un autre mot (ex: “بيتزا”, “pizza”, “مطعم”, “café”).
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;

