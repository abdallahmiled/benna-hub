import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getCafes, getFoods, getRestaurants } from '../services/api';
import { buildSearchEntryText, searchEntries } from '../utils/search';
import { gsap } from '../lib/gsap';

const LANGUAGES = [
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'ar', label: 'AR', flag: '🇹🇳' },
];

const IconDashboard = () => (
  <svg className="w-4 h-4 shrink-0 text-[#c19d60]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const IconStore = () => (
  <svg className="w-4 h-4 shrink-0 text-[#c19d60]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d="M3 10h18v10a1 1 0 01-1 1H4a1 1 0 01-1-1V10z" />
    <path d="M3 10V8l2-5h14l2 5v2" />
    <path d="M9 21v-6h6v6" />
  </svg>
);

const IconCoffee = () => (
  <svg className="w-4 h-4 shrink-0 text-[#c19d60]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d="M3 8h14v6a6 6 0 01-6 6H9a6 6 0 01-6-6V8z" />
    <path d="M17 10h2a3 3 0 010 6h-2" />
    <path d="M6 2s1 1 1 2-1 2-1 3" />
    <path d="M10 2s1 1 1 2-1 2-1 3" />
    <path d="M14 2s1 1 1 2-1 2-1 3" />
  </svg>
);

const IconUser = () => (
  <svg className="w-4 h-4 shrink-0 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <circle cx="12" cy="8" r="4" />
    <path d="M5 20a7 7 0 0114 0" />
  </svg>
);

const IconLogout = () => (
  <svg className="w-4 h-4 shrink-0 text-red-400/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconCart = () => (
  <svg className="w-4 h-4 shrink-0 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d="M6 6h15l-1.5 9h-12z" />
    <path d="M6 6l-2-3H2" />
    <circle cx="9" cy="20" r="1.5" />
    <circle cx="18" cy="20" r="1.5" />
  </svg>
);

const userMenuRowClass =
  'flex items-start gap-2.5 w-full px-3 py-2.5 text-[10px] tracking-[0.12em] text-left leading-snug transition-colors [&_svg]:shrink-0 [&_svg]:mt-0.5';

const Navbar = () => {
  const { t, lang, setLang, isRTL } = useLang();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [cartCountAll, setCartCountAll] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchData, setSearchData] = useState(null); // entries[]
  const [searchLoading, setSearchLoading] = useState(false);
  const inputRef = useRef(null);
  const navRef = useRef(null);

  const computeCartCountAll = () => {
    try {
      return Object.keys(localStorage)
        .filter((k) => k.startsWith('benna_cart_'))
        .reduce((sum, k) => {
          try {
            const raw = localStorage.getItem(k);
            const items = raw ? JSON.parse(raw) || [] : [];
            return sum + items.reduce((s, x) => s + (x.qty || 0), 0);
          } catch {
            return sum;
          }
        }, 0);
    } catch {
      return 0;
    }
  };

  useEffect(() => {
    setCartCountAll(computeCartCountAll());
    const onChange = () => setCartCountAll(computeCartCountAll());
    window.addEventListener('storage', onChange);
    window.addEventListener('benna-cart-changed', onChange);
    return () => {
      window.removeEventListener('storage', onChange);
      window.removeEventListener('benna-cart-changed', onChange);
    };
  }, [location.pathname]);

  useEffect(() => {
    if (!searchOpen) return;
    const onScroll = () => {
      if (window.scrollY > 240) setSearchOpen(false);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const tmr = setTimeout(() => inputRef.current?.focus?.(), 0);
    return () => clearTimeout(tmr);
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setSearchOpen(false);
      if (e.key === 'Enter') {
        if (!searchQ.trim()) return;
        setSearchOpen(false);
        navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, searchOpen, searchQ]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!searchOpen || searchData) return;
      setSearchLoading(true);
      try {
        const [rRes, cRes, fRes] = await Promise.all([getRestaurants(), getCafes(), getFoods()]);
        if (!alive) return;
        const restaurants = Array.isArray(rRes.data) ? rRes.data : [];
        const cafes = Array.isArray(cRes.data) ? cRes.data : [];
        const foods = Array.isArray(fRes.data) ? fRes.data : [];
        const entries = [
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
        setSearchData(entries);
      } catch {
        if (!alive) return;
        setSearchData([]);
      } finally {
        if (alive) setSearchLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [searchData, searchOpen]);

  useLayoutEffect(() => {
    if (searchOpen) return;
    const root = navRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const cols = root.querySelectorAll('[data-nav-col]');
      if (!cols.length) return;
      gsap.from(cols, {
        opacity: 0,
        y: -14,
        duration: 0.55,
        stagger: 0.09,
        ease: 'power2.out',
      });
    }, navRef);
    return () => ctx.revert();
  }, [location.pathname, searchOpen]);

  const quickResults = useMemo(() => searchEntries(searchData || [], searchQ, 8), [searchData, searchQ]);

  const openSearch = () => {
    setMenuOpen(false);
    setLangOpen(false);
    setUserOpen(false);
    setSearchOpen(true);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserOpen(false);
  };

  const navLinks = [
    { key: 'nav_home', path: '/' },
    { key: 'nav_restaurants', path: '/restaurants' },
    { key: 'nav_cafes', path: '/cafes' },
    { key: 'nav_search', path: '/search' },
    { key: 'nav_contact', path: '/contact' },
  ];

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const navItemClass =
    'group relative inline-flex items-center align-middle text-white text-[10px] font-sans font-medium tracking-[0.15em] leading-none transition-colors py-2';

  return (
    <nav ref={navRef} className="absolute top-0 left-0 right-0 py-6 px-8 z-[500] flex items-center justify-between">
      
      {/* Left Links */}
      <div data-nav-col className="flex-1 flex justify-start">
        <ul className="hidden md:flex items-center gap-7">
          {navLinks.slice(0, 2).map(({ key, path }) => (
            <li key={key}>
              <Link
                to={path}
                className={navItemClass}
              >
                {t(key)}
                <span
                  className={`absolute bottom-0 left-0 h-[1.5px] bg-[#c19d60] transition-all duration-300 ${
                    isActive(path) ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Center Logo */}
      <div data-nav-col className="flex-1 flex flex-col items-center justify-center cursor-pointer">
        <div className="text-[#c19d60] mb-1">
          <svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M30 20 L30 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M30 20 L22 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M30 20 L38 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M30 20 L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M30 20 L46 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M30 20 L6 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M30 20 L54 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <Link to="/" className="flex items-center gap-2">
          <h1 className="text-white text-3xl font-serif font-normal tracking-wide">
            Benna Hub<span className="text-[#c19d60]">.</span>
          </h1>
        </Link>
      </div>

      {/* Right: Nav Links + Lang + CTA */}
      <div data-nav-col className="flex-1 flex items-center justify-end gap-4">
        
        {/* Right nav links (desktop) */}
        {!searchOpen ? (
          <ul className="hidden md:flex items-center gap-7">
            {navLinks.slice(2).map(({ key, path }) => (
              <li key={key}>
                {key === 'nav_search' ? (
                  <button
                    type="button"
                    onClick={openSearch}
                    className={navItemClass}
                  >
                    {t(key)}
                    <span className="absolute bottom-0 left-0 h-[1.5px] bg-[#c19d60] transition-all duration-300 w-0 group-hover:w-full" />
                  </button>
                ) : (
                  <Link to={path} className={navItemClass}>
                    {t(key)}
                    <span
                      className={`absolute bottom-0 left-0 h-[1.5px] bg-[#c19d60] transition-all duration-300 ${
                        isActive(path) ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                    />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="hidden md:flex items-center gap-3">
            <div className="relative w-[min(44vw,440px)]">
              <input
                ref={inputRef}
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Rechercher… (بيتزا / pizza)"
                className="w-full bg-[#0e2624]/70 border border-white/20 focus:border-[#c19d60]/60 outline-none px-3.5 py-2.5 pr-10 text-[12px] text-white placeholder-white/30"
              />
              <svg className="absolute right-3 top-3 w-4 h-4 text-white/35" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>

              {searchQ.trim() ? (
                <div className="absolute left-0 right-0 mt-2 border border-white/10 bg-[#0e2624]/95 backdrop-blur-md shadow-2xl overflow-hidden">
                  {searchLoading ? (
                    <div className="px-3 py-2.5 text-white/45 text-[11px] tracking-widest">Chargement…</div>
                  ) : quickResults.length ? (
                    <div className="divide-y divide-white/10">
                      {quickResults.map((r) => (
                        <Link
                          key={`${r.type}_${r.id}`}
                          to={r.href}
                          onClick={() => setSearchOpen(false)}
                          className="flex items-start justify-between gap-4 px-3 py-2.5 hover:bg-white/5 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-white/90 text-[13px] truncate">{r.title}</p>
                            <p className="text-white/40 text-[11px] tracking-wider truncate">{r.subtitle}</p>
                          </div>
                          <span className="shrink-0 text-[10px] tracking-[0.35em] uppercase text-[#c19d60]/80">
                            {r.type === 'food' ? 'Plat' : r.type === 'cafe' ? 'Café' : 'Restaurant'}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-2.5 text-white/45 text-[11px] tracking-widest">Aucun résultat</div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (!searchQ.trim()) return;
                      setSearchOpen(false);
                      navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`);
                    }}
                    className="w-full text-left px-3 py-2.5 text-[10px] tracking-[0.4em] uppercase text-white/55 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Voir tous les résultats
                  </button>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="text-white/70 hover:text-white border border-white/15 hover:border-white/35 px-3 py-2 text-[10px] tracking-widest transition-colors"
            >
              ×
            </button>
          </div>
        )}

        {/* Language Switcher */}
        {!searchOpen ? (
        <div className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1.5 text-white/80 hover:text-white text-[11px] font-sans tracking-widest border border-white/20 hover:border-white/50 px-2.5 py-1.5 transition-all duration-200"
          >
            <span>{LANGUAGES.find(l => l.code === lang)?.flag}</span>
            <span>{LANGUAGES.find(l => l.code === lang)?.label}</span>
            <svg className={`w-2.5 h-2.5 transition-transform ${langOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 10 6">
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          {langOpen && (
            <div className="absolute top-full mt-1 right-0 bg-[#0e2624] border border-white/10 shadow-xl z-50 min-w-[90px]">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setLangOpen(false); }}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-[11px] tracking-widest transition-colors ${
                    lang === l.code
                      ? 'text-[#c19d60] bg-white/5'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        ) : null}

        {/* CTA / Auth Buttons */}
        {!searchOpen ? user ? (
          <div className="relative hidden md:block w-max shrink-0 self-center">
            <button
              type="button"
              onClick={() => setUserOpen(!userOpen)}
              className="flex w-full items-center justify-center gap-2 text-white/70 hover:text-white border border-white/15 hover:border-white/40 px-3 py-1.5 text-[11px] tracking-widest transition-all"
            >
              <span className="text-[#c19d60]">✦</span>
              <span className="truncate max-w-[10rem]">{user.name?.split(' ')[0]}</span>
              <svg className={`w-2.5 h-2.5 shrink-0 transition-transform ${userOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 10 6">
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            {userOpen && (
              <div className="absolute top-full right-0 left-0 z-50 mt-1 bg-[#0e2624] border border-white/10 shadow-xl divide-y divide-white/10">
                {user.role === 'owner' && (
                  <Link
                    to="/dashboard"
                    onClick={() => setUserOpen(false)}
                    className={`${userMenuRowClass} text-white/75 hover:text-[#c19d60] hover:bg-white/5`}
                  >
                    <IconDashboard />
                    <span>Dashboard</span>
                  </Link>
                )}
                {user.role === 'owner' && (
                  <Link
                    to="/owner/manage"
                    onClick={() => setUserOpen(false)}
                    className={`${userMenuRowClass} text-white/75 hover:text-[#c19d60] hover:bg-white/5`}
                  >
                    <IconStore />
                    <span>Gérer mon restaurant</span>
                  </Link>
                )}
                {user.role === 'cafe_owner' && (
                  <Link
                    to="/cafe/dashboard"
                    onClick={() => setUserOpen(false)}
                    className={`${userMenuRowClass} text-white/75 hover:text-[#c19d60] hover:bg-white/5`}
                  >
                    <IconDashboard />
                    <span>Dashboard café</span>
                  </Link>
                )}
                {user.role === 'cafe_owner' && (
                  <Link
                    to="/cafe/manage"
                    onClick={() => setUserOpen(false)}
                    className={`${userMenuRowClass} text-white/75 hover:text-[#c19d60] hover:bg-white/5`}
                  >
                    <IconCoffee />
                    <span>Gérer mon café</span>
                  </Link>
                )}
                {user.role === 'livreur' && (
                  <Link
                    to="/livreur/dashboard"
                    onClick={() => setUserOpen(false)}
                    className={`${userMenuRowClass} text-white/75 hover:text-[#c19d60] hover:bg-white/5`}
                  >
                    <IconDashboard />
                    <span>Dashboard livreur</span>
                  </Link>
                )}
                <Link
                  to="/profile"
                  onClick={() => setUserOpen(false)}
                  className={`${userMenuRowClass} text-white/75 hover:text-white hover:bg-white/5`}
                >
                  <IconUser />
                  <span>Mon profil</span>
                </Link>

                {user.role === 'user' && (
                  <Link
                    to="/mes-commandes"
                    onClick={() => setUserOpen(false)}
                    className={`${userMenuRowClass} text-white/75 hover:text-white hover:bg-white/5`}
                  >
                    <IconDashboard />
                    <span>Mes commandes</span>
                  </Link>
                )}

                {user.role === 'user' && cartCountAll > 0 ? (
                  <Link
                    to="/panier"
                    onClick={() => setUserOpen(false)}
                    className={`${userMenuRowClass} text-white/75 hover:text-white hover:bg-white/5`}
                  >
                    <IconCart />
                    <span className="flex-1">Panier</span>
                    <span className="text-white/40 text-[10px] tracking-widest">{cartCountAll}</span>
                  </Link>
                ) : null}

                <button
                  type="button"
                  onClick={handleLogout}
                  className={`${userMenuRowClass} text-left text-red-400/80 hover:text-red-400 hover:bg-white/5`}
                >
                  <IconLogout />
                  <span>Déconnexion</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="hidden md:flex group relative px-5 py-2.5 text-[10px] font-sans tracking-[0.15em] text-white transition-all duration-500 overflow-hidden cursor-pointer items-center justify-center"
            style={{ minWidth: '120px', height: '40px' }}
          >
            <span className="absolute inset-0 border border-[#846446]/50 transition-all duration-500 group-hover:border-[#846446]" />
            <span className="absolute top-[3px] left-[3px] w-0 h-0 border-t border-l border-transparent group-hover:border-[#846446] transition-all duration-500 group-hover:w-[55%] group-hover:h-[55%]" />
            <span className="absolute bottom-[3px] right-[3px] w-0 h-0 border-b border-r border-transparent group-hover:border-[#846446] transition-all duration-500 group-hover:w-[55%] group-hover:h-[55%]" />
            <span className="relative z-10 transition-colors duration-300 group-hover:text-[#c19d60]">
              Login
            </span>
          </Link>
        ) : null}

        {/* Mobile hamburger */}
        {!searchOpen ? (
          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        ) : null}
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#0e2624]/95 backdrop-blur-sm border-t border-white/10 p-6 flex flex-col gap-4 md:hidden">
          {navLinks.map(({ key, path }) =>
            key === 'nav_search' ? (
              <button
                key={key}
                type="button"
                onClick={openSearch}
                className="text-left text-sm tracking-widest transition-colors text-white/70 hover:text-white"
              >
                {t(key)}
              </button>
            ) : (
              <Link
                key={key}
                to={path}
                onClick={() => setMenuOpen(false)}
                className={`text-sm tracking-widest transition-colors ${
                  isActive(path) ? 'text-[#c19d60]' : 'text-white/70 hover:text-white'
                }`}
              >
                {t(key)}
              </Link>
            )
          )}
          {!user ? (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="text-sm tracking-widest text-white/70 hover:text-white transition-colors">Connexion</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="text-sm tracking-widest text-[#c19d60]">S'inscrire</Link>
            </>
          ) : (
            <>
              {user.role === 'owner' && (
                <>
                  <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="text-sm tracking-widest text-[#c19d60]">Dashboard</Link>
                  <Link to="/owner/manage" onClick={() => setMenuOpen(false)} className="text-sm tracking-widest text-[#c19d60]">Gérer mon restaurant</Link>
                </>
              )}
              <button onClick={() => { setMenuOpen(false); handleLogout(); }} className="text-left text-sm tracking-widest text-red-400/70">Déconnexion</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
