import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const MOCK_RESTAURANTS = [
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
    hasDelivery: true,
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
    hasDelivery: true,
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
    hasDelivery: true,
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
    hasDelivery: false,
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
    hasDelivery: true,
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
    hasDelivery: true,
  },
];

const FILTERS = ['filter_all', 'filter_tunisian', 'filter_seafood', 'filter_grills', 'filter_pizza', 'filter_fastfood', 'filter_dessert', 'filter_coffee'];

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

const RestaurantCard = ({ restaurant }) => {
  const { t } = useLang();
  const { user } = useAuth();
  return (
    <div className="group bg-[#0e2624] border border-white/5 hover:border-[#c19d60]/30 transition-all duration-500 overflow-hidden">
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
        {restaurant.hasDelivery && (
          <span className="absolute top-3 left-3 text-[10px] tracking-widest px-2 py-1 bg-[#c19d60]/20 text-[#c19d60] border border-[#c19d60]/30">
            {t('card_free_delivery')}
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-serif text-white text-lg leading-tight">{restaurant.name}</h3>
        </div>
        <p className="text-white/50 text-[11px] tracking-wider mb-3">{restaurant.type}</p>

        <StarRating rating={restaurant.rating} />
        <p className="text-white/30 text-[10px] mt-0.5">{restaurant.reviews} avis</p>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
          <span className="text-white/40 text-[10px]">🕐 {restaurant.deliveryTime}</span>
          <div className="flex gap-2">
            <Link
              to={`/restaurants/${restaurant.id}`}
              className="text-[10px] tracking-widest text-white/60 hover:text-white border border-white/15 hover:border-white/40 px-3 py-1.5 transition-all duration-200"
            >
              {t('card_view')}
            </Link>
            {restaurant.isOpen && (
              user?.role === 'user' ? (
                <button className="text-[10px] tracking-widest text-[#0e2624] bg-[#c19d60] hover:bg-[#d4ac70] px-3 py-1.5 transition-all duration-200 font-medium">
                  {t('card_order')}
                </button>
              ) : null
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const { t } = useLang();
  const [activeFilter, setActiveFilter] = useState('filter_all');

  useEffect(() => {
    const key = 'benna_reveal_home_v1';
    let already = false;
    try {
      already = localStorage.getItem(key) === '1';
    } catch {
      already = false;
    }

    const nodes = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!nodes.length) return;

    if (already) {
      nodes.forEach((n) => n.classList.add('is-revealed'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        let any = false;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('is-revealed');
          io.unobserve(e.target);
          any = true;
        }
        if (any) {
          try {
            localStorage.setItem(key, '1');
          } catch {
            // ignore
          }
        }
      },
      { threshold: 0.18, rootMargin: '0px 0px -10% 0px' }
    );

    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  const filteredRestaurants = activeFilter === 'filter_all'
    ? MOCK_RESTAURANTS
    : MOCK_RESTAURANTS.filter(r =>
        r.tags.some(tag =>
          t(activeFilter).toLowerCase().includes(tag.toLowerCase()) ||
          tag.toLowerCase().includes(t(activeFilter).toLowerCase())
        )
      );

  return (
    <div className="min-h-screen bg-[#0b1f1e] font-sans text-white">
      <header className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        <Navbar />
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-gabes.png"
            alt="Gabes Tunisia"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b1f1e]/50 via-[#0b1f1e]/30 to-[#0b1f1e]" />
        </div>

        <div className="relative z-20 flex flex-col items-center text-center px-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6 border border-[#c19d60]/30 bg-[#c19d60]/10 px-4 py-2 text-[#c19d60] text-[10px] tracking-[0.3em] uppercase animate-fade-up">
            <span>📍</span> {t('hero_location')}
          </div>

          <h2
            className="font-serif font-light text-5xl md:text-6xl lg:text-7xl leading-tight text-white mb-6 animate-fade-up"
            style={{
              animationDelay: '0.15s',
              textShadow: '0px 4px 30px rgba(0,0,0,0.7)',
            }}
          >
            {t('hero_tagline')}
          </h2>

          <p
            className="text-white/70 text-sm md:text-base tracking-wide max-w-xl leading-relaxed mb-10 animate-fade-up"
            style={{ animationDelay: '0.3s' }}
          >
            {t('hero_sub')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-fade-up" style={{ animationDelay: '0.45s' }}>
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

      <section data-reveal className="reveal-once reveal-left bg-[#0e2624] border-y border-white/5 py-10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '80+', key: 'stat_restaurants', icon: '🍽️' },
            { value: '40+', key: 'stat_cafes', icon: '☕' },
            { value: '2k+', key: 'stat_reviews', icon: '⭐' },
            { value: '3', key: 'stat_cities', icon: '🏙️' },
          ].map((stat) => (
            <div key={stat.key} className="flex flex-col items-center gap-1">
              <span className="text-2xl mb-1">{stat.icon}</span>
              <span className="font-serif text-3xl text-[#c19d60]">{stat.value}</span>
              <span className="text-white/40 text-[11px] tracking-[0.2em] uppercase">{t(stat.key)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div data-reveal className="reveal-once reveal-right flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4">
          <div>
            <p className="text-[#c19d60] text-[10px] tracking-[0.35em] uppercase mb-3">/ {t('featured_title')}</p>
            <h2 className="font-serif text-3xl md:text-4xl text-white">{t('featured_sub')}</h2>
          </div>
          <Link
            to="/restaurants"
            className="text-[10px] tracking-[0.2em] text-white/50 hover:text-[#c19d60] border-b border-white/15 hover:border-[#c19d60] pb-0.5 transition-all duration-300 uppercase"
          >
            Voir tout →
          </Link>
        </div>

        <div data-reveal className="reveal-once reveal-left flex flex-wrap gap-2 mb-10">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`text-[10px] tracking-[0.15em] uppercase px-4 py-2 border transition-all duration-200 ${
                activeFilter === f
                  ? 'border-[#c19d60] text-[#c19d60] bg-[#c19d60]/10'
                  : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white/70'
              }`}
            >
              {t(f)}
            </button>
          ))}
        </div>

        <div data-reveal className="reveal-once reveal-right grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
