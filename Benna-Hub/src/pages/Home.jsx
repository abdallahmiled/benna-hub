import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { animate, stagger } from 'animejs';
import Navbar from '../components/Navbar';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getCafes, getHomeStats, getRestaurants } from '../services/api';
import { GABES_DELEGATIONS, translateDelegation } from '../constants/gabesDelegations';
import { gsap } from '../lib/gsap';
import { prefersReducedMotion, usePrefersReducedMotion } from '../lib/motionPrefs';

const MOCK_RESTAURANTS_RAW = [
  {
    id: 1,
    name: 'Le Méditerranéen',
    type: 'Tunisien · Fruits de mer',
    rating: 4.8,
    reviews: 124,
    isOpen: true,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop',
    tags: ['Tunisien', 'Fruits de mer'],
    deliveryTime: '25-35 min',
  },
  {
    id: 2,
    name: 'Grillades du Golfe',
    type: 'Grillades · Viandes',
    rating: 4.6,
    reviews: 89,
    isOpen: true,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop',
    tags: ['Grillades'],
    deliveryTime: '30-45 min',
  },
  {
    id: 3,
    name: 'Pizza Oasis',
    type: 'Pizza · Fast Food',
    rating: 4.3,
    reviews: 201,
    isOpen: false,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop',
    tags: ['Pizza', 'Fast Food'],
    deliveryTime: '20-30 min',
  },
  {
    id: 4,
    name: 'Dar El Benna',
    type: 'Tunisien traditionnel',
    rating: 4.9,
    reviews: 67,
    isOpen: true,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop',
    tags: ['Tunisien'],
    deliveryTime: '35-45 min',
  },
  {
    id: 5,
    name: 'Café Palmeraie',
    type: 'Café · Desserts',
    rating: 4.5,
    reviews: 143,
    isOpen: true,
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop',
    tags: ['Café', 'Desserts'],
    deliveryTime: '15-25 min',
  },
  {
    id: 6,
    name: 'Snack El Bahr',
    type: 'Fast Food · Fruits de mer',
    rating: 4.2,
    reviews: 88,
    isOpen: true,
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&auto=format&fit=crop',
    tags: ['Fast Food', 'Fruits de mer'],
    deliveryTime: '20-30 min',
  },
];

const MOCK_RESTAURANTS = MOCK_RESTAURANTS_RAW.map((r, i) => ({
  ...r,
  delegation: GABES_DELEGATIONS[i % GABES_DELEGATIONS.length].value,
}));

const MOCK_ESTABLISHMENTS = MOCK_RESTAURANTS.map((r) => ({ ...r, kind: 'restaurant' }));

const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const toCardImage = (value) => {
  if (!value) return MOCK_RESTAURANTS[0].image;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${API_ORIGIN}${value.startsWith('/') ? '' : '/'}${value}`;
};

const formatStatValue = (n) => (Number(n) || 0).toLocaleString('fr-FR');

const mapApiRestaurantToCard = (r) => {
  const type = r.cuisineType || 'Restaurant';
  const tagParts = type.split(/[·,|]/).map((s) => s.trim()).filter(Boolean);
  return {
    _id: r._id,
    id: r._id,
    kind: 'restaurant',
    name: r.name,
    type,
    delegation: String(r.delegation || '').trim(),
    rating: typeof r.rating === 'number' ? r.rating : 0,
    reviews: typeof r.ratingCount === 'number' ? r.ratingCount : 0,
    isOpen: r.isOpen !== false,
    image: toCardImage(r.image),
    tags: tagParts.length ? tagParts : [type],
    deliveryTime: '25-40 min',
  };
};

const mapApiCafeToCard = (c) => {
  const type = c.hospitalityType || 'Café';
  const tagParts = type.split(/[·,|]/).map((s) => s.trim()).filter(Boolean);
  return {
    _id: c._id,
    id: c._id,
    kind: 'cafe',
    name: c.name,
    type,
    delegation: String(c.delegation || '').trim(),
    rating: typeof c.rating === 'number' ? c.rating : 0,
    reviews: typeof c.ratingCount === 'number' ? c.ratingCount : 0,
    isOpen: c.isOpen !== false,
    image: toCardImage(c.image),
    tags: tagParts.length ? tagParts : [type],
    deliveryTime: 'Sur place',
  };
};

const StarRating = ({ rating }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <svg key={star} className={`w-3 h-3 ${star <= Math.round(rating) ? 'text-[#c19d60]' : 'text-white/20'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
    <span className="text-white/50 text-[11px] ml-1">({rating})</span>
  </div>
);

const cardSpring = { type: 'spring', stiffness: 420, damping: 32 };

const RestaurantCard = ({ restaurant }) => {
  const { t } = useLang();
  const { user } = useAuth();
  const reduceMotion = usePrefersReducedMotion();
  const detailId = restaurant._id || restaurant.id;
  const detailBase = restaurant.kind === 'cafe' ? '/cafes' : '/restaurants';
  return (
    <motion.div
      initial={false}
      whileHover={reduceMotion ? {} : { y: -6, transition: cardSpring }}
      whileTap={reduceMotion ? {} : { scale: 0.985 }}
      className="group bg-[#0e2624] border border-white/5 hover:border-[#c19d60]/40 transition-colors duration-500 overflow-hidden shadow-[0_24px_80px_-50px_rgba(0,0,0,0.85)]"
    >
      <div className="relative overflow-hidden h-48">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e2624]/80 to-transparent" />
        <span className={`absolute top-3 right-3 text-[10px] tracking-widest px-2 py-1 font-medium ${
          restaurant.isOpen
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {restaurant.isOpen ? t('card_open') : t('card_closed')}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-serif text-white text-lg leading-tight">{restaurant.name}</h3>
        </div>
        <p className="text-white/50 text-[11px] tracking-wider mb-1">{restaurant.type}</p>
        {restaurant.delegation ? (
          <p className="text-[#c19d60]/70 text-[9px] tracking-[0.2em] uppercase mb-2">
            {translateDelegation(t, restaurant.delegation)}
          </p>
        ) : null}

        <StarRating rating={restaurant.rating} />
        <p className="text-white/30 text-[10px] mt-0.5">{restaurant.reviews} avis</p>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
          <span className="text-white/40 text-[10px]">🕐 {restaurant.deliveryTime}</span>
          <div className="flex gap-2">
            <Link
              to={`${detailBase}/${detailId}`}
              className="text-[10px] tracking-widest text-white/60 hover:text-white border border-white/15 hover:border-white/40 px-3 py-1.5 transition-all duration-200"
            >
              {t('card_view')}
            </Link>
            {restaurant.isOpen && user?.role === 'user' ? (
              <Link
                to={`${detailBase}/${detailId}`}
                className="text-[10px] tracking-widest text-[#0e2624] bg-[#c19d60] hover:bg-[#d4ac70] px-3 py-1.5 transition-all duration-200 font-medium"
              >
                {restaurant.kind === 'cafe' ? t('card_reserve') : t('card_order')}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Home = () => {
  const { t } = useLang();
  /** 'all' ou slug délégation (ex. gabes_ville) — aligné sur Restaurant.delegation */
  const [activeDelegation, setActiveDelegation] = useState('all');
  const [apiEstablishments, setApiEstablishments] = useState([]);
  const [homeStats, setHomeStats] = useState(null);
  const statsRef = useRef(null);
  const homeRootRef = useRef(null);
  const heroHeaderRef = useRef(null);
  const heroImgRef = useRef(null);

  useEffect(() => {
    Promise.allSettled([getRestaurants(), getCafes()]).then((results) => {
      const rRows =
        results[0].status === 'fulfilled'
          ? (results[0].value.data || []).map(mapApiRestaurantToCard)
          : [];
      const cRows =
        results[1].status === 'fulfilled'
          ? (results[1].value.data || []).map(mapApiCafeToCard)
          : [];
      setApiEstablishments([...rRows, ...cRows]);
    });
  }, []);

  useEffect(() => {
    getHomeStats()
      .then((res) => {
        const d = res.data || {};
        setHomeStats({
          restaurantCount: Number(d.restaurantCount) || 0,
          cafeCount: Number(d.cafeCount) || 0,
          reviewCount: Number(d.reviewCount) || 0,
          delegationCount: Number(d.delegationCount) || 0,
        });
      })
      .catch(() =>
        setHomeStats({
          restaurantCount: 0,
          cafeCount: 0,
          reviewCount: 0,
          delegationCount: 0,
        })
      );
  }, []);

  const featuredList = apiEstablishments.length > 0 ? apiEstablishments : MOCK_ESTABLISHMENTS;

  const filteredRestaurants = useMemo(() => {
    if (activeDelegation === 'all') return featuredList;
    return featuredList.filter((r) => String(r.delegation || '').trim() === activeDelegation);
  }, [activeDelegation, featuredList]);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const img = heroImgRef.current;
      const header = heroHeaderRef.current;
      if (!img || !header) return;
      gsap.to(img, {
        scale: 1.08,
        yPercent: 6,
        ease: 'none',
        scrollTrigger: {
          trigger: header,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.1,
        },
      });
    }, homeRootRef);
    return () => ctx.revert();
  }, []);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      tl.from('.hero-badge', { opacity: 0, y: 22, duration: 0.55 })
        .from('.hero-title', { opacity: 0, y: 32, duration: 0.78 }, '-=0.32')
        .from('.hero-sub', { opacity: 0, y: 20, duration: 0.62 }, '-=0.42')
        .from('.hero-cta', { opacity: 0, y: 18, duration: 0.55 }, '-=0.36');
    }, homeRootRef);
    return () => ctx.revert();
  }, []);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.home-scroll-reveal').forEach((el, i) => {
        gsap.from(el, {
          x: i % 2 === 0 ? -46 : 46,
          opacity: 0,
          duration: 0.88,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        });
      });
    }, homeRootRef);
    return () => ctx.revert();
  }, [activeDelegation, filteredRestaurants.length]);

  useEffect(() => {
    if (!homeStats) return;
    if (prefersReducedMotion()) {
      const root = statsRef.current;
      if (root) root.querySelectorAll('.stat-anime').forEach((el) => el.classList.remove('opacity-0'));
      return;
    }
    const root = statsRef.current;
    if (!root) return;
    const els = root.querySelectorAll('.stat-anime');
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        io.disconnect();
        animate(els, {
          opacity: [0, 1],
          y: [22, 0],
          delay: stagger(72, { from: 'first' }),
          duration: 720,
          ease: 'out(3)',
        });
      },
      { threshold: 0.22 }
    );
    io.observe(root);
    return () => io.disconnect();
  }, [homeStats]);

  return (
    <div ref={homeRootRef} className="min-h-screen bg-[#0b1f1e] font-sans text-white">
      <header ref={heroHeaderRef} className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        <Navbar />
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            ref={heroImgRef}
            src="/hero-gabes.png"
            alt="Gabes Tunisia"
            className="h-[115%] w-full min-h-full object-cover -translate-y-[5%]"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b1f1e]/50 via-[#0b1f1e]/30 to-[#0b1f1e]" />
        </div>

        <div className="relative z-20 flex flex-col items-center text-center px-6 max-w-4xl mx-auto">
          <div className="hero-badge flex items-center gap-2 mb-6 border border-[#c19d60]/30 bg-[#c19d60]/10 px-4 py-2 text-[#c19d60] text-[10px] tracking-[0.3em] uppercase">
            <span>📍</span> {t('hero_location')}
          </div>

          <h2
            className="hero-title font-serif font-light text-5xl md:text-6xl lg:text-7xl leading-tight text-white mb-6"
            style={{
              textShadow: '0px 4px 30px rgba(0,0,0,0.7)',
            }}
          >
            {t('hero_tagline')}
          </h2>

          <p className="hero-sub text-white/70 text-sm md:text-base tracking-wide max-w-xl leading-relaxed mb-10">
            {t('hero_sub')}
          </p>

          <div className="hero-cta flex flex-col sm:flex-row gap-4">
            <Link
              to="/restaurants"
              className="group relative px-8 py-4 bg-[#c19d60] hover:bg-[#d4ac70] text-[#0b1f1e] text-[11px] font-sans font-semibold tracking-[0.2em] uppercase transition-all duration-300"
            >
              {t('hero_cta_primary')}
            </Link>
            <Link
              to="/cafes"
              className="group relative px-8 py-4 border border-white/30 hover:border-[#c19d60] text-white hover:text-[#c19d60] text-[11px] font-sans tracking-[0.2em] uppercase transition-all duration-300"
            >
              {t('hero_cta_secondary')}
            </Link>
          </div>
        </div>
      </header>

      <section ref={statsRef} className="bg-[#0e2624] border-y border-white/5 py-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-6">
          {/* Toujours 4 colonnes pour afficher restaurants, cafés, avis et معتمديات / délégations */}
          <div className="grid grid-cols-4 gap-2 sm:gap-6 md:gap-8 text-center">
            {(
              [
                {
                  key: 'stat_restaurants',
                  icon: '🍽️',
                  value: homeStats ? formatStatValue(homeStats.restaurantCount) : '…',
                },
                {
                  key: 'stat_cafes',
                  icon: '☕',
                  value: homeStats ? formatStatValue(homeStats.cafeCount) : '…',
                },
                {
                  key: 'stat_reviews',
                  icon: '⭐',
                  value: homeStats ? formatStatValue(homeStats.reviewCount) : '…',
                },
                {
                  key: 'stat_delegations',
                  icon: '📍',
                  value: homeStats ? formatStatValue(homeStats.delegationCount) : '…',
                },
              ]
            ).map((stat) => (
              <div
                key={stat.key}
                className="stat-anime flex flex-col items-center justify-start gap-0.5 sm:gap-1 min-w-0 opacity-0"
              >
                <span className="text-lg sm:text-2xl mb-0.5 sm:mb-1 leading-none">{stat.icon}</span>
                <span className="font-serif text-xl sm:text-2xl md:text-3xl text-[#c19d60] leading-tight tabular-nums">
                  {stat.value}
                </span>
                <span className="text-white/40 text-[8px] sm:text-[10px] md:text-[11px] tracking-[0.12em] sm:tracking-[0.2em] uppercase leading-tight px-0.5">
                  {t(stat.key)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="home-scroll-reveal flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4">
          <div>
            <p className="text-[#c19d60] text-[10px] tracking-[0.35em] uppercase mb-3">/ {t('featured_title')}</p>
            <h2 className="font-serif text-3xl md:text-4xl text-white">{t('home_establishments_sub')}</h2>
            <p className="text-white/35 text-xs mt-2 tracking-wide">{t('categories_title')}</p>
          </div>
          <Link
            to="/restaurants"
            className="text-[10px] tracking-[0.2em] text-white/50 hover:text-[#c19d60] border-b border-white/15 hover:border-[#c19d60] pb-0.5 transition-all duration-300 uppercase"
          >
            Voir tout →
          </Link>
        </div>

        <div className="home-scroll-reveal flex flex-wrap gap-2 mb-10">
          <button
            type="button"
            onClick={() => setActiveDelegation('all')}
            className={`text-[10px] tracking-[0.15em] uppercase px-4 py-2 border transition-all duration-200 ${
              activeDelegation === 'all'
                ? 'border-[#c19d60] text-[#c19d60] bg-[#c19d60]/10'
                : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white/70'
            }`}
          >
            {t('filter_all')}
          </button>
          {GABES_DELEGATIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setActiveDelegation(d.value)}
              className={`text-[10px] tracking-[0.12em] sm:tracking-[0.15em] uppercase px-3 sm:px-4 py-2 border transition-all duration-200 max-w-full ${
                activeDelegation === d.value
                  ? 'border-[#c19d60] text-[#c19d60] bg-[#c19d60]/10'
                  : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white/70'
              }`}
            >
              {translateDelegation(t, d.value)}
            </button>
          ))}
        </div>

        <div className="home-scroll-reveal grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.length === 0 ? (
            <p className="text-white/45 text-sm col-span-full">{t('home_no_delegation_results')}</p>
          ) : (
            filteredRestaurants.map((r) => (
              <RestaurantCard key={`${r.kind || 'restaurant'}-${r._id || r.id}`} restaurant={r} />
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
