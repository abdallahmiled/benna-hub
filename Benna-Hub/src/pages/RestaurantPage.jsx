import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getFoods, getRestaurant } from '../services/api';
import { getMapPreviewState } from '../utils/maps';
import { useAuth } from '../context/AuthContext';

const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const toImageUrl = (value) => {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${API_ORIGIN}${value}`;
};

const DISH_FALLBACK =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1600&q=80&auto=format&fit=crop';

const Stars = ({ rating = 0 }) => {
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  const full = Math.round(r);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`h-3.5 w-3.5 ${i <= full ? 'text-[#c19d60]' : 'text-white/15'}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

const MOCK_FOODS = [
  { _id: 'm1', name: 'Burger Benna', price: 12, image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&auto=format&fit=crop' },
  { _id: 'm2', name: 'Pizza 4 Fromages', price: 18, image: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=1200&auto=format&fit=crop' },
  { _id: 'm3', name: 'Ojja Merguez', price: 14, image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=1200&auto=format&fit=crop' },
  { _id: 'm4', name: 'Couscous Poulet', price: 20, image: 'https://images.unsplash.com/photo-1604908554162-45d874b57c4b?w=1200&auto=format&fit=crop' },
  { _id: 'm5', name: 'Brik à l’œuf', price: 8, image: 'https://images.unsplash.com/photo-1608032077018-c9f9f7f3b7d4?w=1200&auto=format&fit=crop' },
  { _id: 'm6', name: 'Makloub Escalope', price: 10, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&auto=format&fit=crop' },
  { _id: 'm7', name: 'Salade Méchouia', price: 9, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&auto=format&fit=crop' },
  { _id: 'm8', name: 'Pâtes Fruits de mer', price: 26, image: 'https://images.unsplash.com/photo-1523986371872-9d3ba2e2f642?w=1200&auto=format&fit=crop' },
];

const RestaurantPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const rootRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState('');
  const [restaurant, setRestaurant] = useState(null);
  const [foods, setFoods] = useState([]);
  const [cart, setCart] = useState([]); // [{ foodId, name, price, qty }]
  const [pageIndex, setPageIndex] = useState(0);
  const [anim, setAnim] = useState(null); // { dir: 1|-1, nextIndex: number } | null
  const animTimerRef = useRef(null);
  const [wheelAccum, setWheelAccum] = useState(0);

  const title = useMemo(() => restaurant?.name || 'Restaurant', [restaurant?.name]);
  const foodsToShow = useMemo(() => (foods.length ? foods : MOCK_FOODS), [foods]);
  const targetFoodId = useMemo(() => new URLSearchParams(location.search || '').get('food'), [location.search]);

  const isMongoObjectId = useMemo(() => /^[a-fA-F0-9]{24}$/.test(String(id || '')), [id]);
  const mapPreview = useMemo(() => getMapPreviewState(restaurant?.googleMapsUrl), [restaurant?.googleMapsUrl]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        // Si l'ID n'est pas un ObjectId (ex: mocks "1", "2"...), on affiche les plats mock directement.
        if (!isMongoObjectId) {
          if (cancelled) return;
          setRestaurant({ name: 'Restaurant' });
          setFoods([]);
          return;
        }

        const [rRes, fRes] = await Promise.all([getRestaurant(id), getFoods({ restaurant: id })]);
        if (cancelled) return;
        setRestaurant(rRes.data);
        setFoods(fRes.data || []);
      } catch {
        // Même si l'API échoue, on garde l'expérience (scroll + plats mock) pour tester l'UI.
        if (cancelled) return;
        setRestaurant({ name: 'Restaurant' });
        setFoods([]);
        setError('');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isMongoObjectId]);

  // Panier: restore from localStorage (per restaurant)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`benna_cart_${id}`);
      if (raw) setCart(JSON.parse(raw) || []);
    } catch {
      // ignore
    }
  }, [id]);

  useEffect(() => {
    try {
      localStorage.setItem(`benna_cart_${id}`, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart, id]);

  const addToCart = (dish) => {
    if (!dish) return;
    if (user?.role !== 'user') return;
    if (dish.isAvailable === false) return;
    const foodId = dish._id;
    if (!foodId) return;
    setCart((prev) => {
      const existing = prev.find((x) => x.foodId === foodId);
      if (existing) return prev.map((x) => (x.foodId === foodId ? { ...x, qty: x.qty + 1 } : x));
      return [
        ...prev,
        {
          foodId,
          name: dish.name,
          image: dish.image || '',
          price: Number(dish.price) || 0,
          qty: 1,
          note: '',
        },
      ];
    });
    window.dispatchEvent(new Event('benna-cart-changed'));
  };


  // Sync owner changes → client view (refresh foods periodically)
  useEffect(() => {
    if (!isMongoObjectId) return;
    if (user?.role !== 'user') return;
    let alive = true;
    const tick = async () => {
      try {
        const fRes = await getFoods({ restaurant: id });
        if (!alive) return;
        setFoods(fRes.data || []);
      } catch {
        // ignore
      }
    };
    const t = setInterval(tick, 8000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [id, isMongoObjectId, user?.role]);

  // Page livre: pas de scroll vertical (on tourne les pages à la molette)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const wheelPixels = (e) => {
      let d = e.deltaY;
      if (e.deltaMode === 1) d *= 40;
      else if (e.deltaMode === 2) d *= window.innerHeight;
      return d;
    };

    const onWheel = (e) => {
      if (!root.contains(e.target)) return;
      if (e.ctrlKey || e.metaKey) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();

      if (anim) return;
      const dy = wheelPixels(e);
      const nextAccum = wheelAccum + dy;
      const threshold = 140; // plus bas = plus sensible ; plus haut = plus "lourd"
      if (Math.abs(nextAccum) < threshold) {
        setWheelAccum(nextAccum);
        return;
      }
      setWheelAccum(0);
      const dir = nextAccum > 0 ? 1 : -1; // bas = page suivante
      setPageIndex((curr) => {
        const next = Math.min(Math.max(0, curr + dir), pagesCountRef.current - 1);
        if (next === curr) return curr;
        setAnim({ dir, nextIndex: next });
        clearTimeout(animTimerRef.current);
        animTimerRef.current = setTimeout(() => {
          setPageIndex(next);
          setAnim(null);
        }, 900);
        return curr;
      });
    };

    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => window.removeEventListener('wheel', onWheel, true);
  }, [anim, wheelAccum]);

  useEffect(() => {
    return () => {
      clearTimeout(animTimerRef.current);
    };
  }, []);

  const pages = useMemo(() => {
    const dishPages = foodsToShow.map((f) => ({ type: 'dish', key: `dish-${f._id}`, dish: f }));
    const mapsPage = { type: 'maps', key: 'maps' };
    const contactPage = { type: 'contact', key: 'contact' };
    return [...dishPages, mapsPage, contactPage];
  }, [foodsToShow]);

  useEffect(() => {
    if (!targetFoodId) return;
    const idx = pages.findIndex((p) => p.type === 'dish' && String(p.dish?._id) === String(targetFoodId));
    if (idx >= 0) setPageIndex(idx);
  }, [pages, targetFoodId]);

  const pagesCountRef = useRef(0);
  useEffect(() => {
    pagesCountRef.current = pages.length || 1;
    setPageIndex((i) => Math.min(i, Math.max(0, pages.length - 1)));
  }, [pages.length]);

  const safeIndex = Math.min(Math.max(0, pageIndex), pages.length ? pages.length - 1 : 0);
  const current = pages[safeIndex] || { type: 'dish', key: 'fallback', dish: MOCK_FOODS[0] };
  const next = anim ? pages[anim.nextIndex] : null;

  const PageShell = ({ children }) => (
    <div className="h-full w-full rounded-[18px] border border-white/10 bg-[#0b0f10] shadow-[0_45px_140px_-70px_rgba(0,0,0,0.92)]">
      <div className="h-full w-full rounded-[18px] bg-[radial-gradient(1200px_800px_at_20%_0%,rgba(193,157,96,0.08),transparent_60%),radial-gradient(900px_700px_at_90%_20%,rgba(255,255,255,0.05),transparent_62%)]">
        <div className="h-full w-full rounded-[18px] bg-[linear-gradient(90deg,rgba(0,0,0,0.40),transparent_20%,transparent_80%,rgba(0,0,0,0.40))]">
          {children}
        </div>
      </div>
    </div>
  );

  const DishPage = ({ dish }) => {
    const src = toImageUrl(dish.image) || DISH_FALLBACK;
    const isAvailable = dish?.isAvailable !== false;
    return (
      <div className="h-full w-full overflow-hidden rounded-[18px] flex flex-col">
        {/* Header */}
        <div className="relative bg-[#0b0f10]">
          <div className="px-7 pt-4 pb-3 md:px-10 md:pt-5">
            <div className="flex items-center justify-between gap-4">
              <div className="w-[84px]" />
              <div className="text-center">
                <p className="font-serif text-[28px] leading-none tracking-[0.16em] text-white/95 md:text-[36px] animate-fade-up">
                  MENU
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.34em] text-white/45 animate-fade-up">
                  {title}
                </p>
              </div>
              <div className="w-[84px] flex justify-end">
                <span
                  className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] ${
                    isAvailable
                      ? 'border-violet-400/40 bg-violet-500/10 text-violet-200'
                      : 'border-red-400/40 bg-red-500/10 text-red-200'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isAvailable ? 'bg-violet-200' : 'bg-red-200'}`} />
                  {isAvailable ? 'Disponible' : 'Indisponible'}
                </span>
              </div>
            </div>
          </div>
          <div className="h-px w-full bg-white/15" />
        </div>

        {/* Body (infos à gauche / image à droite) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[minmax(320px,460px)_1fr]">
          {/* Left panel */}
          <div className="relative bg-[#0b0f10] px-7 py-4 md:px-10 md:py-5 border-b md:border-b-0 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-[0.16] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.18)_1px,transparent_0)] [background-size:18px_18px]" />

            <div className="relative animate-fade-up h-full flex flex-col">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.32em] text-white/45">Nom</p>
                  <div className="mt-2 h-px w-full bg-white/10" />
                  <h2 className="mt-3 font-serif text-2xl md:text-3xl text-white leading-[1.1]">{dish.name}</h2>
                  {typeof dish.rating === 'number' ? (
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Stars rating={dish.rating} />
                        <span className="text-white/35 text-[11px]">
                          ({dish.ratingCount ?? 0})
                        </span>
                      </div>
                      <span className="text-white/25 text-[10px] tracking-widest uppercase">Rating</span>
                    </div>
                  ) : null}
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[0.32em] text-white/45">Description</p>
                  <div className="mt-2 h-px w-full bg-white/10" />
                  <p className="mt-3 text-white/65 text-[14px] leading-relaxed">
                    {dish.description || 'Spécialité maison préparée avec des ingrédients frais.'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center h-8 w-12 rounded-full border border-white/15 bg-white/5 text-[10px] tracking-[0.28em] uppercase text-white/70">
                      Prix
                    </span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>
                  <p className="mt-2 font-serif text-3xl md:text-4xl text-[#c19d60]">
                    {typeof dish.price === 'number' ? `${dish.price} TND` : dish.price}
                  </p>
                </div>
              </div>

              {user?.role === 'user' ? (
                <div className="mt-auto pt-3 pb-1">
                  {isAvailable ? (
                    <button
                      type="button"
                      onClick={() => addToCart(dish)}
                      className="w-full inline-flex items-center justify-center px-7 py-2.5 bg-[#c19d60] hover:bg-[#d4ac70] text-[#0b1f1e] text-[11px] font-semibold tracking-[0.22em] uppercase transition-all"
                    >
                      Commander
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {/* Right photo */}
          <div className="relative min-h-[260px] md:min-h-0 overflow-hidden">
            <div className="absolute inset-0">
              <div className="relative h-full w-full overflow-hidden rounded-none md:rounded-r-[18px]">
                <img
                  src={src}
                  alt={dish.name}
                  className="absolute inset-0 h-full w-full object-cover animate-photo-soft hover:scale-[1.04] transition-transform duration-700"
                  onError={(e) => {
                    e.currentTarget.src = DISH_FALLBACK;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const MapsPage = () => (
    <div className="h-full w-full p-8 md:p-10 flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[#c19d60] text-[10px] tracking-[0.35em] uppercase mb-2">/ Localisation</p>
          <h2 className="font-serif text-3xl md:text-5xl text-white">Maps</h2>
        </div>
        {mapPreview?.externalUrl ? (
          <a
            href={mapPreview.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] uppercase tracking-[0.22em] border border-white/20 px-4 py-2 text-white/70 hover:text-white hover:border-white/40 transition-colors"
          >
            Ouvrir dans Google Maps
          </a>
        ) : null}
      </div>

      {mapPreview?.embedSrc ? (
        <div className="flex-1 overflow-hidden rounded-[14px] border border-white/10 bg-[#0b1f1e]">
          <iframe
            src={mapPreview.embedSrc}
            title="Google Maps"
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="flex-1 rounded-[14px] border border-white/10 bg-[#0b1f1e] p-6 text-white/65">
          <p className="leading-relaxed">
            {mapPreview?.hint ||
              "Aucune carte intégrée. Le restaurant doit enregistrer un lien d’intégration Google Maps (iframe /maps/embed) pour l’affichage ici."}
          </p>
        </div>
      )}

      {restaurant?.address ? <p className="text-white/45 text-sm">Adresse: {restaurant.address}</p> : null}
    </div>
  );

  const ContactPage = () => (
    <div className="h-full w-full p-8 md:p-10 flex flex-col justify-between">
      <div>
        <p className="text-[#c19d60] text-[10px] tracking-[0.35em] uppercase mb-2">/ Contact</p>
        <h2 className="font-serif text-3xl md:text-5xl text-white">Contact</h2>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-[14px] border border-white/10 bg-[#0b1f1e]/60 p-6">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-2">Restaurant</p>
            <p className="font-serif text-2xl text-white">{title}</p>
            {restaurant?.address ? <p className="mt-2 text-white/55 text-sm">{restaurant.address}</p> : null}
          </div>
          <div className="rounded-[14px] border border-white/10 bg-[#0b1f1e]/60 p-6">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-2">Infos</p>
            <p className="text-white/60 text-sm leading-relaxed">
              Pour commander ou contacter le restaurant, utilisez l’application Benna Hub.
            </p>
            {mapPreview?.externalUrl ? (
              <a
                className="inline-flex mt-4 text-[10px] uppercase tracking-[0.22em] border border-[#c19d60]/45 px-4 py-2 text-[#c19d60] hover:bg-[#c19d60]/10 transition-colors"
                href={mapPreview.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Itinéraire (Google Maps)
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pt-6">
        <p className="text-white/35 text-[10px] tracking-[0.28em] uppercase">
          Page {safeIndex + 1} / {pages.length}
        </p>
        <p className="text-white/35 text-[10px] tracking-[0.28em] uppercase">
          Molette = tourner la page
        </p>
      </div>
    </div>
  );

  const renderPage = (p) => {
    if (p.type === 'maps') return <MapsPage />;
    if (p.type === 'contact') return <ContactPage />;
    return <DishPage dish={p.dish} />;
  };

  return (
    <div ref={rootRef} className="h-screen overflow-hidden bg-[#0b1f1e] text-white font-sans">
      <Navbar />

      <div className="pt-24 md:pt-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <p className="text-[#c19d60] text-[10px] tracking-[0.35em] uppercase mb-2">/ Restaurant</p>
              <h1 className="font-serif text-xl md:text-3xl text-white leading-tight">{title}</h1>
              {restaurant?.address ? (
                <p className="text-white/45 text-sm mt-2">{restaurant.address}</p>
              ) : null}
            </div>
            <Link
              to="/restaurants"
              className="shrink-0 text-[10px] uppercase tracking-[0.22em] border border-white/20 px-4 py-2 text-white/65 hover:text-white hover:border-white/40 transition-colors"
            >
              ← Retour
            </Link>
          </div>

          {loading ? (
            <div className="border border-white/10 bg-[#0e2624] p-6 text-white/60">Chargement…</div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div />
                <p className="text-white/35 text-[11px] tracking-widest uppercase">
                  {safeIndex + 1}/{pages.length}
                </p>
              </div>

              <div className="relative mx-auto h-[calc(100vh-220px)] md:h-[calc(100vh-260px)] w-full max-w-4xl">
                <div className="absolute inset-0 rounded-[22px] bg-[#071a19] shadow-[0_50px_160px_-90px_rgba(0,0,0,0.95)]" />

                <div className="absolute inset-0 [perspective:1800px]">
                  {/* page actuelle */}
                  <div
                    className="absolute inset-0"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform:
                        anim?.dir === 1
                          ? 'rotateY(-7deg)'
                          : anim?.dir === -1
                            ? 'rotateY(7deg)'
                            : 'rotateY(0deg)',
                      transition: 'transform 0.25s ease',
                    }}
                  >
                    <PageShell>{renderPage(current)}</PageShell>
                  </div>

                  {/* page entrante/sortante (flip) */}
                  {anim && next ? (
                    <div
                      className="absolute inset-0"
                      style={{
                        transformStyle: 'preserve-3d',
                        transform:
                          anim.dir === 1
                            ? 'rotateY(90deg)'
                            : 'rotateY(-90deg)',
                        transformOrigin: anim.dir === 1 ? '0% 50%' : '100% 50%',
                        animation: 'pageFlip 900ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
                      }}
                    >
                      <PageShell>{renderPage(next)}</PageShell>
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default RestaurantPage;

