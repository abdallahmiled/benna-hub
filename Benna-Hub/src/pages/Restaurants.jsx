import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useLang } from '../context/LanguageContext';
import { getRestaurants } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MOCK_FALLBACK = [
  { _id: '1', name: 'Le Méditerranéen', speciality: 'Tunisien · Fruits de mer', averageRating: 4.8, reviewsCount: 124, images: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop'], city: 'Gabes' },
  { _id: '2', name: 'Grillades du Golfe', speciality: 'Grillades · Viandes', averageRating: 4.6, reviewsCount: 89, images: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop'], city: 'Gabes' },
  { _id: '3', name: 'Pizza Oasis', speciality: 'Pizza · Fast Food', averageRating: 4.3, reviewsCount: 201, images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop'], city: 'Gabes' },
  { _id: '4', name: 'Dar El Benna', speciality: 'Tunisien traditionnel', averageRating: 4.9, reviewsCount: 67, images: ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop'], city: 'Gabes' },
  { _id: '5', name: 'Snack El Bahr', speciality: 'Fast Food · Fruits de mer', averageRating: 4.2, reviewsCount: 88, images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&auto=format&fit=crop'], city: 'Gabes' },
  { _id: '6', name: 'Bab El Kebir', speciality: 'Tunisien · Brunch', averageRating: 4.4, reviewsCount: 56, images: ['https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&auto=format&fit=crop'], city: 'Gabes' },
];

const ZONES = ['Tous', 'Gabes', 'Jara', 'Chott', 'Port', 'Médina'];

const StarRating = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <svg key={star} className={`w-3 h-3 ${star <= Math.round(rating) ? 'text-[#c19d60]' : 'text-white/15'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
    <span className="text-white/40 text-[10px] ml-1">{rating} ({rating >= 4.5 ? '⭐ Top' : ''})</span>
  </div>
);

const Restaurants = () => {
  const { t } = useLang();
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [apiOnline, setApiOnline] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState('');
  const [zone, setZone] = useState('Tous');
  const [sortBy, setSortBy] = useState('rating');

  useEffect(() => {
    getRestaurants()
      .then((res) => {
        const data = res.data;
        if (data && data.length > 0) {
          setRestaurants(data);
          setApiOnline(true);
        } else {
          setRestaurants(MOCK_FALLBACK);
        }
      })
      .catch(() => setRestaurants(MOCK_FALLBACK))
      .finally(() => setLoadingData(false));
  }, []);

  const filtered = restaurants
    .filter(r =>
      (zone === 'Tous' || r.city === zone || r.address?.includes(zone)) &&
      (search === '' || r.name.toLowerCase().includes(search.toLowerCase()) || r.speciality?.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => sortBy === 'rating' ? (b.averageRating || 0) - (a.averageRating || 0) : (b.reviewsCount || 0) - (a.reviewsCount || 0));

  return (
    <div className="min-h-screen bg-[#0b1f1e] text-white font-sans">
      <Navbar />

      {/* Page Header */}
      <div className="pt-32 pb-16 px-6 bg-gradient-to-b from-[#0e2624] to-[#0b1f1e] border-b border-white/5">
        <div className="max-w-6xl mx-auto">
          <p className="text-[#c19d60] text-[10px] tracking-[0.35em] uppercase mb-3">/ {t('nav_restaurants')}</p>
          <h1 className="font-serif text-4xl md:text-5xl text-white mb-4">{t('featured_sub')}</h1>
          <p className="text-white/40 text-sm">📍 {t('hero_location')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-40 bg-[#0b1f1e]/95 backdrop-blur-sm border-b border-white/5 py-4 px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Rechercher un restaurant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0e2624] border border-white/10 text-white text-sm px-4 py-2.5 pr-10 focus:outline-none focus:border-[#c19d60]/50 placeholder-white/30"
            />
            <svg className="absolute right-3 top-3 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Zone filter */}
          <div className="flex flex-wrap gap-1.5">
            {ZONES.map(z => (
              <button
                key={z}
                onClick={() => setZone(z)}
                className={`text-[10px] tracking-widest px-3 py-2 border transition-all ${
                  zone === z ? 'border-[#c19d60] text-[#c19d60] bg-[#c19d60]/10' : 'border-white/10 text-white/40 hover:text-white/70'
                }`}
              >
                {z}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#0e2624] border border-white/10 text-white/60 text-[11px] px-3 py-2 focus:outline-none"
          >
            <option value="rating">Mieux notés</option>
            <option value="reviews">Plus populaires</option>
          </select>
        </div>
      </div>

      {/* Listing Grid */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {loadingData ? (
          <div className="flex items-center justify-center py-20 text-white/30">
            <div className="w-8 h-8 border-2 border-[#c19d60]/40 border-t-[#c19d60] rounded-full animate-spin mr-3" />
            Chargement...
          </div>
        ) : (
          <>
            <p className="text-white/30 text-[11px] tracking-widest mb-6 uppercase">{filtered.length} établissements trouvés</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-7">
              {filtered.map(r => (
                <div
                  key={r._id || r.id}
                  className="group bg-[#0e2624] border border-white/5 hover:border-[#c19d60]/30 transition-all duration-400 overflow-hidden"
                >
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={r.images?.[0] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop'}
                      alt={r.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e2624]/70 to-transparent" />
                    <span className="absolute bottom-3 left-3 text-[9px] tracking-widest text-white/60 bg-black/40 px-2 py-1">
                      📍 {r.city || r.zone || 'Gabes'}
                    </span>
                  </div>
                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-serif text-white text-base mb-1">{r.name}</h3>
                    <p className="text-white/40 text-[10px] tracking-wider mb-3">{r.speciality || r.type}</p>
                    <StarRating rating={r.averageRating || r.rating || 0} />
                    <p className="text-white/25 text-[10px] my-1">{r.reviewsCount || r.reviews || 0} avis</p>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                      <Link to={`/restaurants/${r._id || r.id}`} className="flex-1 text-center text-[9px] tracking-widest text-white/50 hover:text-white border border-white/10 hover:border-white/30 py-2 transition-all">
                        {t('card_view')}
                      </Link>
                      {user?.role === 'user' ? (
                        <button className="flex-1 text-[9px] tracking-widest text-[#0b1f1e] bg-[#c19d60] hover:bg-[#d4ac70] py-2 transition-all font-medium">
                          {t('card_order')}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Restaurants;
