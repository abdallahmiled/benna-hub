import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useLang } from '../context/LanguageContext';
import {
  createCafeReservation,
  getCafe,
  getCafeProducts,
  getCafeReservationDaySummary,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const API_ORIGIN = 'http://localhost:5000';

const chunkInto = (arr, parts) => {
  const a = Array.isArray(arr) ? arr : [];
  if (parts <= 1) return [a];
  const out = Array.from({ length: parts }, () => []);
  a.forEach((item, idx) => out[idx % parts].push(item));
  return out;
};

const MOCK_PRODUCTS = [
  {
    id: 'm1',
    name: 'Cappuccino',
    description: 'Mousse onctueuse, cacao fin, espresso serré.',
    price: 12,
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1600&auto=format&fit=crop',
    isAvailable: true,
  },
  {
    id: 'm2',
    name: 'Caffè Latte',
    description: 'Espresso doux, lait velouté, équilibre parfait.',
    price: 13,
    image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1600&auto=format&fit=crop',
    isAvailable: true,
  },
  {
    id: 'm3',
    name: 'Mocha',
    description: 'Chocolat + espresso, gourmand et intense.',
    price: 14,
    image: 'https://images.unsplash.com/photo-1526569941533-6b49b4b7c8b3?w=1600&auto=format&fit=crop',
    isAvailable: true,
  },
  {
    id: 'm4',
    name: 'Iced Coffee',
    description: 'Frais, léger, parfait pour l’après-midi.',
    price: 11,
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=1600&auto=format&fit=crop',
    isAvailable: true,
  },
  {
    id: 'm5',
    name: 'Croissant beurre',
    description: 'Doré, feuilleté, ultra frais.',
    price: 6,
    image: 'https://images.unsplash.com/photo-1548940740-204726a19be3?w=1600&auto=format&fit=crop',
    isAvailable: true,
  },
  {
    id: 'm6',
    name: 'Cheesecake',
    description: 'Crémeux, vanille légère, base biscuit.',
    price: 16,
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=1600&auto=format&fit=crop',
    isAvailable: true,
  },
];

// Même dataset que Cafes.jsx (front-only pour l’instant)
const CAFES = [
  {
    id: 1,
    name: 'Café des Arts',
    type: 'Café · Pâtisserie',
    rating: 4.7,
    reviews: 198,
    isOpen: true,
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1600&auto=format&fit=crop',
    zone: 'Centre-ville',
    speciality: 'Café turc, gâteaux maison',
  },
  {
    id: 2,
    name: 'Palmeraie Café',
    type: 'Café · Jus naturels',
    rating: 4.5,
    reviews: 134,
    isOpen: true,
    image: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=1600&auto=format&fit=crop',
    zone: 'Jara',
    speciality: 'Jus de grenade, thé à la menthe',
  },
  {
    id: 3,
    name: 'Café El Bahr',
    type: 'Café · Vue mer',
    rating: 4.8,
    reviews: 89,
    isOpen: true,
    image: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=1600&auto=format&fit=crop',
    zone: 'Port',
    speciality: 'Narguilé, café crème',
  },
  {
    id: 4,
    name: 'Le Salon du Thé',
    type: 'Thé · Pâtisserie orientale',
    rating: 4.4,
    reviews: 77,
    isOpen: false,
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=1600&auto=format&fit=crop',
    zone: 'Médina',
    speciality: 'Baklawa, thé aux pignons',
  },
  {
    id: 5,
    name: 'Oasis Lounge',
    type: 'Café · Lounge',
    rating: 4.6,
    reviews: 112,
    isOpen: true,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&auto=format&fit=crop',
    zone: 'Centre-ville',
    speciality: 'Smoothies, cappuccino',
  },
  {
    id: 6,
    name: 'Café Médina',
    type: 'Café traditionnel',
    rating: 4.3,
    reviews: 63,
    isOpen: true,
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1600&auto=format&fit=crop',
    zone: 'Médina',
    speciality: 'Café déraouia, chakhchoukha',
  },
];

const MenuRow = ({ name, price, desc }) => (
  <div className="grid grid-cols-[1fr_auto] gap-4 py-4 border-b border-white/10">
    <div className="min-w-0">
      <p className="font-serif text-lg text-white truncate">{name}</p>
      {desc ? <p className="mt-1 text-white/45 text-sm leading-relaxed">{desc}</p> : null}
    </div>
    <div className="text-right">
      <p className="font-serif text-lg text-[#c19d60] whitespace-nowrap">{price}</p>
    </div>
  </div>
);

const localDateYMD = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const CAFE_MENU = {
  bestsellers: [
    { name: 'Caffè Latte', price: '13 TND', desc: 'Espresso doux, lait velouté, mousse légère.' },
    { name: 'Black Coffee', price: '10 TND', desc: 'Pur café, sans additifs. Simple et efficace.' },
    { name: 'Crafty Cappuccino', price: '15 TND', desc: 'Mousse onctueuse, cacao fin, équilibre parfait.' },
  ],
  flavors: [
    { name: 'Brewed Coffee', price: '11 TND', desc: 'Sélection du jour, intensité au choix.' },
    { name: 'Caramel Cortado', price: '16 TND', desc: 'Caramel riche, lait soyeux, cortado serré.' },
    { name: 'Mocha', price: '13 TND', desc: 'Chocolat chaud + espresso, gourmand.' },
  ],
};

const CafePage = () => {
  const { t } = useLang();
  const { user } = useAuth();
  const { id } = useParams();
  const location = useLocation();
  const isClientUser = user?.role === 'user';
  const cafe = useMemo(() => CAFES.find((c) => String(c.id) === String(id)), [id]);
  const [query, setQuery] = useState('');
  const [apiCafe, setApiCafe] = useState(null);
  const [apiProducts, setApiProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [reservation, setReservation] = useState({
    peopleCount: 2,
    reservationDate: '',
    reservationTime: '',
    occasionType: 'normal',
    note: '',
  });
  const [reservationMsg, setReservationMsg] = useState('');
  const [reservationSaving, setReservationSaving] = useState(false);
  const [tableDaySummary, setTableDaySummary] = useState(null);
  const [tableSummaryLoading, setTableSummaryLoading] = useState(false);

  const isObjectId = useMemo(() => /^[a-fA-F0-9]{24}$/.test(String(id || '')), [id]);
  const tableSummaryDate = useMemo(
    () => (reservation.reservationDate?.trim() ? reservation.reservationDate.trim() : localDateYMD()),
    [reservation.reservationDate]
  );
  const productsToShow = useMemo(() => {
    // Si on a des produits back, on les affiche.
    if (isObjectId && apiProducts.length) return apiProducts;
    // Sinon fallback mock (pour voir la page "vivante" direct).
    return MOCK_PRODUCTS;
  }, [apiProducts, isObjectId]);

  const menuGroups = useMemo(() => {
    const [g1, g2, g3] = chunkInto(productsToShow, 3);
    return [
      { title: 'COFFEE', items: g1 },
      { title: 'SIGNATURE', items: g2 },
      { title: 'DESSERTS', items: g3 },
    ];
  }, [productsToShow]);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      if (!isObjectId) return;
      setProductsLoading(true);
      try {
        const [cRes, pRes] = await Promise.all([getCafe(id), getCafeProducts({ cafe: id })]);
        if (!alive) return;
        setApiCafe(cRes.data || null);
        setApiProducts(pRes.data || []);
      } catch {
        if (!alive) return;
        setApiCafe(null);
        setApiProducts([]);
      } finally {
        if (alive) setProductsLoading(false);
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, [id, isObjectId]);

  useEffect(() => {
    if (!isObjectId || !id) {
      setTableDaySummary(null);
      setTableSummaryLoading(false);
      return;
    }
    let alive = true;
    setTableSummaryLoading(true);
    getCafeReservationDaySummary(id, tableSummaryDate)
      .then((res) => {
        if (alive) {
          setTableDaySummary(res.data || null);
          setTableSummaryLoading(false);
        }
      })
      .catch(() => {
        if (alive) {
          setTableDaySummary(null);
          setTableSummaryLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [id, isObjectId, tableSummaryDate]);

  const heroTitle = apiCafe?.name || cafe?.name || 'Café';
  const heroSub = apiCafe?.description || cafe?.speciality || 'Coffee moment';

  const filteredMenu = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CAFE_MENU;
    const filterRows = (rows) =>
      rows.filter((x) => x.name.toLowerCase().includes(q) || (x.desc || '').toLowerCase().includes(q));
    return {
      bestsellers: filterRows(CAFE_MENU.bestsellers),
      flavors: filterRows(CAFE_MENU.flavors),
    };
  }, [query]);

  const submitReservation = async () => {
    setReservationMsg('');
    if (!isClientUser) {
      setReservationMsg('Connectez-vous en compte client pour réserver.');
      return;
    }
    if (!isObjectId) {
      setReservationMsg('Réservation disponible uniquement pour les cafés réels.');
      return;
    }
    if (!reservation.peopleCount || !reservation.reservationDate || !reservation.reservationTime) {
      setReservationMsg('Complétez personnes, date et heure.');
      return;
    }
    setReservationSaving(true);
    try {
      await createCafeReservation({
        cafe: id,
        peopleCount: Number(reservation.peopleCount),
        reservationDate: reservation.reservationDate,
        reservationTime: reservation.reservationTime,
        occasionType: reservation.occasionType,
        note: reservation.note,
      });
      setReservation({
        peopleCount: 2,
        reservationDate: '',
        reservationTime: '',
        occasionType: 'normal',
        note: '',
      });
      setReservationMsg('Réservation envoyée.');
    } catch (err) {
      setReservationMsg(err.response?.data?.message || 'Erreur réservation.');
    } finally {
      setReservationSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1f1e] text-white font-sans">
      <header className="relative min-h-[92vh] overflow-hidden">
        <Navbar />
        <div className="absolute inset-0">
          <img
            src={
              apiCafe?.image ||
              cafe?.image ||
              'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=2200&auto=format&fit=crop'
            }
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-[#0b1f1e]/75 to-[#0b1f1e]" />
        </div>

        <div className="relative z-10 px-6 pt-28 md:pt-36 pb-20">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between gap-4 mb-10">
              <div>
                <p className="text-[#c19d60] text-[10px] tracking-[0.45em] uppercase mb-4">/ {t('nav_cafes')}</p>
                <h1 className="font-serif text-5xl md:text-6xl text-white leading-[1.05]">{heroTitle}</h1>
                <p className="mt-5 text-white/60 text-sm leading-relaxed max-w-2xl">{heroSub}</p>
                {apiCafe || cafe ? (
                  <>
                    <p className="mt-4 text-white/45 text-[11px] tracking-wider">
                      📍 {apiCafe?.address || cafe?.zone || '—'} ·{' '}
                      {apiCafe?.rating ? `⭐ ${apiCafe.rating}` : cafe?.rating ? `⭐ ${cafe.rating}` : '⭐ —'} ·{' '}
                      {apiCafe?.isOpen !== undefined
                        ? apiCafe.isOpen
                          ? t('card_open')
                          : t('card_closed')
                        : cafe?.isOpen
                          ? t('card_open')
                          : t('card_closed')}
                    </p>
                    {isObjectId && tableDaySummary && Number(tableDaySummary.tableCapacity) > 0 ? (
                      <p className="mt-3 text-white/55 text-xs leading-relaxed max-w-xl border border-white/10 bg-black/20 rounded-md px-4 py-3">
                        <span className="text-[#c19d60] text-[10px] tracking-[0.25em] uppercase block mb-1">
                          Tables ({tableSummaryDate})
                        </span>
                        Capacité : <strong className="text-white">{tableDaySummary.tableCapacity}</strong> · Réservées :{' '}
                        <strong className="text-amber-200/90">{tableDaySummary.reservedTables}</strong> · Disponibles :{' '}
                        <strong className="text-emerald-300/90">{tableDaySummary.availableTables}</strong>
                        <span className="block text-white/35 text-[10px] mt-1">
                          (réservations en attente ou acceptées pour cette date — 1 réservation = 1 table)
                        </span>
                      </p>
                    ) : isObjectId && apiCafe && Number(apiCafe.tableCount) > 0 && tableSummaryLoading ? (
                      <p className="mt-2 text-white/35 text-[11px]">
                        Tables : {apiCafe.tableCount} (chargement des créneaux…)
                      </p>
                    ) : isObjectId && apiCafe && Number(apiCafe.tableCount) > 0 ? (
                      <p className="mt-2 text-white/40 text-[11px]">Capacité : {apiCafe.tableCount} tables</p>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-4 text-red-300 text-sm">Café introuvable.</p>
                )}
              </div>
              <Link
                to="/cafes"
                className="shrink-0 text-[10px] uppercase tracking-[0.22em] border border-white/20 px-4 py-2 text-white/65 hover:text-white hover:border-white/40 transition-colors"
              >
                ← Retour
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 border border-white/10 bg-[#0e2624]/70 backdrop-blur-sm p-6">
                <p className="text-white/60 text-[10px] tracking-[0.5em] uppercase mb-4">For the best memories</p>
                <p className="text-white/55 text-sm leading-relaxed">
                  Découvrez la carte, les bestsellers et les saveurs du moment. Cette page est conçue comme un mini-site
                  (style café home) pour chaque café.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-4">
                  {isClientUser ? (
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('reservation');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="px-10 py-4 bg-[#c19d60] hover:bg-[#d4ac70] text-[#0b1f1e] text-[11px] font-semibold tracking-[0.22em] uppercase transition-all duration-300"
                    >
                      Réserver une table
                    </button>
                  ) : null}
                  <a
                    href="#menu"
                    className="px-10 py-4 border border-white/30 hover:border-[#c19d60] text-white hover:text-[#c19d60] text-[11px] tracking-[0.22em] uppercase transition-all duration-300 text-center"
                  >
                    Voir le menu
                  </a>
                </div>
                {!user ? (
                  <p className="mt-4 text-white/50 text-sm max-w-xl">
                    <Link
                      to={`/login?from=${encodeURIComponent(location.pathname + location.search)}`}
                      className="text-[#c19d60] hover:text-[#d4ac70] underline underline-offset-4"
                    >
                      Connectez-vous
                    </Link>{' '}
                    avec un compte client pour réserver une table.
                  </p>
                ) : !isClientUser ? (
                  <p className="mt-4 text-white/40 text-xs max-w-xl">
                    La réservation en ligne est réservée aux comptes <span className="text-white/60">client</span>.
                  </p>
                ) : null}
              </div>

              <div className="border border-white/10 bg-[#0e2624]/70 backdrop-blur-sm p-6">
                <p className="text-[#c19d60] text-[10px] tracking-[0.35em] uppercase mb-3">Recherche menu</p>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Chercher une boisson…"
                  className="w-full bg-[#0b1f1e] border border-white/10 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#c19d60]/50 placeholder-white/25"
                />
                <p className="mt-3 text-white/35 text-[10px] tracking-widest uppercase">
                  {filteredMenu.bestsellers.length + filteredMenu.flavors.length} item(s)
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section id="reservation" className="px-6 py-16">
        <div className="max-w-6xl mx-auto border border-white/10 bg-[#0e2624]/70 p-6 md:p-8">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-[#c19d60] text-[10px] tracking-[0.45em] uppercase mb-3">/ Réservation</p>
              <h2 className="font-serif text-3xl md:text-4xl text-white">Réserver une table</h2>
              <p className="mt-2 text-white/55 text-sm">
                Prix de réservation: {Number(apiCafe?.reservationPrice || 0)} TND
              </p>
              {isObjectId && tableDaySummary && Number(tableDaySummary.tableCapacity) > 0 ? (
                <div className="mt-4 rounded-md border border-[#c19d60]/30 bg-[#c19d60]/5 px-4 py-3 text-sm text-white/80">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#c19d60] mb-1">État des tables</p>
                  <p>
                    Date : <span className="text-white">{tableSummaryDate}</span> — Total{' '}
                    <strong className="text-white">{tableDaySummary.tableCapacity}</strong>, réservées{' '}
                    <strong className="text-amber-200">{tableDaySummary.reservedTables}</strong>, disponibles{' '}
                    <strong className="text-emerald-300">{tableDaySummary.availableTables}</strong>
                  </p>
                </div>
              ) : null}
            </div>
          </div>
          {isClientUser ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <input
                type="number"
                min={1}
                value={reservation.peopleCount}
                onChange={(e) => setReservation((p) => ({ ...p, peopleCount: e.target.value }))}
                className="bg-[#0b1f1e] border border-white/10 text-white px-4 py-3 text-sm"
                placeholder="Nombre de personnes"
              />
              <input
                type="date"
                value={reservation.reservationDate}
                onChange={(e) => setReservation((p) => ({ ...p, reservationDate: e.target.value }))}
                className="bg-[#0b1f1e] border border-white/10 text-white px-4 py-3 text-sm"
              />
              <input
                type="time"
                value={reservation.reservationTime}
                onChange={(e) => setReservation((p) => ({ ...p, reservationTime: e.target.value }))}
                className="bg-[#0b1f1e] border border-white/10 text-white px-4 py-3 text-sm"
              />
              <select
                value={reservation.occasionType}
                onChange={(e) => setReservation((p) => ({ ...p, occasionType: e.target.value }))}
                className="bg-[#0b1f1e] border border-white/10 text-white px-4 py-3 text-sm"
              >
                <option value="normal">Rencontre normale</option>
                <option value="romantic">Table romantique</option>
                <option value="birthday">Anniversaire</option>
                <option value="party">Fête</option>
                <option value="business">Business</option>
              </select>
              <textarea
                value={reservation.note}
                onChange={(e) => setReservation((p) => ({ ...p, note: e.target.value }))}
                placeholder="Petit message (optionnel)"
                className="md:col-span-2 lg:col-span-2 min-h-12 bg-[#0b1f1e] border border-white/10 text-white px-4 py-3 text-sm resize-none"
              />
              <button
                type="button"
                onClick={submitReservation}
                disabled={reservationSaving}
                className="bg-[#c19d60] hover:bg-[#d4ac70] disabled:opacity-50 text-[#0b1f1e] text-[11px] font-semibold tracking-[0.22em] uppercase px-6 py-3"
              >
                {reservationSaving ? 'Envoi…' : 'Réserver'}
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-[#0b1f1e]/60 px-5 py-8 text-center">
              <p className="text-white/65 text-sm leading-relaxed">
                {!user
                  ? 'Pour envoyer une réservation, connectez-vous avec un compte client.'
                  : 'Seuls les comptes client peuvent réserver une table en ligne.'}
              </p>
              {!user ? (
                <Link
                  to={`/login?from=${encodeURIComponent(location.pathname + location.search)}`}
                  className="mt-5 inline-flex items-center justify-center px-8 py-3 bg-[#c19d60] hover:bg-[#d4ac70] text-[#0b1f1e] text-[11px] font-semibold tracking-[0.22em] uppercase transition-colors"
                >
                  Se connecter
                </Link>
              ) : null}
            </div>
          )}
          {reservationMsg ? <p className="mt-3 text-white/65 text-sm">{reservationMsg}</p> : null}
        </div>
      </section>

      {(
        <section id="products" className="px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-[#c19d60] text-[10px] tracking-[0.45em] uppercase mb-3">/ Produits</p>
                <h2 className="font-serif text-3xl md:text-4xl text-white">Boissons & gourmandises</h2>
                <p className="mt-3 text-white/50 text-sm max-w-2xl">
                  {isObjectId ? 'Photos ajoutées par le propriétaire du café.' : 'Aperçu (produits de démonstration).'}
                </p>
              </div>
              <a
                href="#menu"
                className="shrink-0 text-[10px] uppercase tracking-[0.22em] border border-white/20 px-4 py-2 text-white/65 hover:text-white hover:border-white/40 transition-colors"
              >
                Voir aussi le menu →
              </a>
            </div>

            {isObjectId && productsLoading ? (
              <p className="text-white/40">Chargement des produits...</p>
            ) : (
              <div className="grid lg:grid-cols-[1fr_minmax(360px,460px)_1fr] gap-10 items-start">
                {/* Left imagery */}
                <div className="hidden lg:block">
                  <div
                    className="overflow-hidden rounded-t-[280px] rounded-b-[24px] border border-white/10 bg-black/20 animate-fade-up"
                    style={{ animationDelay: '70ms' }}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=1600&auto=format&fit=crop"
                      alt=""
                      className="h-[360px] w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </div>
                  <div className="mt-8 flex justify-center">
                    <div
                      className="h-[120px] w-[120px] rounded-full overflow-hidden border border-white/10 bg-black/20 animate-float-soft animate-fade-in"
                      style={{ animationDelay: '180ms' }}
                    >
                      <img
                        src="https://images.unsplash.com/photo-1511920170033-f8396924c348?w=900&auto=format&fit=crop"
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>

                {/* Center menu list */}
                <div className="border border-white/10 bg-[#0e2624]/60 backdrop-blur-sm px-7 py-8 md:px-10 md:py-10 animate-fade-up">
                  <p className="text-white/40 text-[10px] tracking-[0.4em] uppercase text-center">Entire menu</p>
                  <div className="mt-8 space-y-10">
                    {menuGroups.map((g, gi) => (
                      <div key={g.title} className="animate-fade-up" style={{ animationDelay: `${120 + gi * 90}ms` }}>
                        <p className="text-[#c19d60] text-[10px] tracking-[0.45em] uppercase text-center">{g.title}</p>
                        <div className="mt-4 space-y-5">
                          {(g.items || []).map((p) => (
                            <div key={p._id || p.id} className="text-center">
                              <p className="text-white/85 text-[12px] tracking-[0.08em] uppercase">
                                {p.name}{' '}
                                <span className="text-white/25">—</span>{' '}
                                <span className="text-white/70">{p.price} TND</span>
                              </p>
                              {p.description ? (
                                <p className="mt-1 text-white/40 text-xs leading-relaxed max-w-[30rem] mx-auto">
                                  {p.description}
                                </p>
                              ) : null}
                              {isObjectId ? (
                                <p
                                  className={`mt-2 text-[10px] tracking-[0.2em] uppercase ${
                                    p.isAvailable !== false ? 'text-emerald-400/90' : 'text-red-400/85'
                                  }`}
                                >
                                  {p.isAvailable !== false ? 'Disponible' : 'Indisponible'}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-10 flex justify-center">
                    <a
                      href="#menu"
                      className="px-6 py-2 border border-white/25 hover:border-[#c19d60] text-white/70 hover:text-[#c19d60] text-[10px] tracking-[0.3em] uppercase transition-colors"
                    >
                      Entière carte
                    </a>
                  </div>
                </div>

                {/* Right imagery */}
                <div className="hidden lg:block">
                  <div
                    className="overflow-hidden rounded-t-[280px] rounded-b-[280px] border border-white/10 bg-black/20 animate-fade-up"
                    style={{ animationDelay: '120ms' }}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1600&auto=format&fit=crop"
                      alt=""
                      className="h-[540px] w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <section id="menu" className="px-6 py-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10">
          <div className="border border-white/10 bg-[#0e2624]/70 p-6">
            <p className="text-[#c19d60] text-[10px] tracking-[0.45em] uppercase mb-4">/ Our bestsellers</p>
            <h2 className="font-serif text-3xl md:text-4xl text-white">Coffee & cake</h2>
            <div className="mt-6">
              {filteredMenu.bestsellers.map((x) => (
                <MenuRow key={x.name} name={x.name} price={x.price} desc={x.desc} />
              ))}
              {filteredMenu.bestsellers.length === 0 ? (
                <p className="text-white/40 text-sm mt-4">Aucun résultat.</p>
              ) : null}
            </div>
          </div>

          <div className="border border-white/10 bg-[#0e2624]/70 p-6">
            <p className="text-[#c19d60] text-[10px] tracking-[0.45em] uppercase mb-4">/ Favorite flavors</p>
            <h2 className="font-serif text-3xl md:text-4xl text-white">Sélections</h2>
            <div className="mt-6">
              {filteredMenu.flavors.map((x) => (
                <MenuRow key={x.name} name={x.name} price={x.price} desc={x.desc} />
              ))}
              {filteredMenu.flavors.length === 0 ? <p className="text-white/40 text-sm mt-4">Aucun résultat.</p> : null}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#071a19] border-t border-white/5 px-6 py-14">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <p className="text-[#c19d60] text-[10px] tracking-[0.45em] uppercase mb-4">Find us</p>
            <p className="text-white/50 text-sm leading-relaxed">{cafe?.zone || 'Gabès, Tunisie'}</p>
            <p className="text-white/50 text-sm leading-relaxed mt-2">+216 75 000 000</p>
          </div>
          <div>
            <p className="text-[#c19d60] text-[10px] tracking-[0.45em] uppercase mb-4">Contact</p>
            <p className="text-white/50 text-sm leading-relaxed">contact@bennahub.tn</p>
            <p className="text-white/50 text-sm leading-relaxed mt-2">support@bennahub.tn</p>
          </div>
          <div>
            <p className="text-[#c19d60] text-[10px] tracking-[0.45em] uppercase mb-4">Opening hours</p>
            <p className="text-white/50 text-sm leading-relaxed">Mon – Thu: 10:00 – 01:00</p>
            <p className="text-white/50 text-sm leading-relaxed mt-2">Fri – Sun: 10:00 – 02:00</p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-white/5 text-center text-white/20 text-[11px] tracking-widest">
          © 2025 Benna Hub. {t('footer_rights')}
        </div>
      </footer>
    </div>
  );
};

export default CafePage;


