import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import Navbar from '../components/Navbar';
import { useLang } from '../context/LanguageContext';
import { gsap } from '../lib/gsap';
import { prefersReducedMotion } from '../lib/motionPrefs';
import { getCafes } from '../services/api';
import { translateDelegation } from '../constants/gabesDelegations';

const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const toListingImage = (value) => {
  if (!value) return 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${API_ORIGIN}${value.startsWith('/') ? '' : '/'}${value}`;
};

const CAFES = [
  { id: 1, name: 'Café des Arts', type: 'Café · Pâtisserie', rating: 4.7, reviews: 198, isOpen: true, image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop', zone: 'Centre-ville', speciality: 'Café turc, gâteaux maison' },
  { id: 2, name: 'Palmeraie Café', type: 'Café · Jus naturels', rating: 4.5, reviews: 134, isOpen: true, image: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=600&auto=format&fit=crop', zone: 'Jara', speciality: 'Jus de grenade, thé à la menthe' },
  { id: 3, name: 'Café El Bahr', type: 'Café · Vue mer', rating: 4.8, reviews: 89, isOpen: true, image: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600&auto=format&fit=crop', zone: 'Port', speciality: 'Narguilé, café crème' },
  { id: 4, name: 'Le Salon du Thé', type: 'Thé · Pâtisserie orientale', rating: 4.4, reviews: 77, isOpen: false, image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&auto=format&fit=crop', zone: 'Médina', speciality: 'Baklawa, thé aux pignons' },
  { id: 5, name: 'Oasis Lounge', type: 'Café · Lounge', rating: 4.6, reviews: 112, isOpen: true, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop', zone: 'Centre-ville', speciality: 'Smoothies, cappuccino' },
  { id: 6, name: 'Café Médina', type: 'Café traditionnel', rating: 4.3, reviews: 63, isOpen: true, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop', zone: 'Médina', speciality: 'Café déraouia, chakhchoukha' },
];

const StarRating = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <svg key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? 'text-[#c19d60]' : 'text-white/15'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
    <span className="text-white/40 text-[10px] ml-1">{rating}</span>
  </div>
);

const mapApiToListing = (c) => ({
  id: c._id,
  _id: c._id,
  name: c.name,
  type: c.hospitalityType || 'Café',
  rating: typeof c.rating === 'number' ? c.rating : 0,
  reviews: typeof c.ratingCount === 'number' ? c.ratingCount : 0,
  isOpen: c.isOpen !== false,
  image: toListingImage(c.image),
  zoneLabel: String(c.delegation || '').trim(),
  address: c.address || '',
  speciality: (c.description || '').trim().slice(0, 100) || '—',
});

const Cafes = () => {
  const { t } = useLang();
  const pageRootRef = useRef(null);
  const [cafes, setCafes] = useState([]);

  useEffect(() => {
    getCafes()
      .then((res) => {
        const rows = res.data || [];
        if (rows.length) setCafes(rows.map(mapApiToListing));
        else setCafes(CAFES.map((x) => ({ ...x, zoneLabel: '', address: '', speciality: x.speciality })));
      })
      .catch(() =>
        setCafes(CAFES.map((x) => ({ ...x, zoneLabel: '', address: '', speciality: x.speciality })))
      );
  }, []);

  const filtered = useMemo(() => {
    return [...cafes].sort((a, b) => b.rating - a.rating);
  }, [cafes]);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const root = pageRootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      gsap.from('.cafes-head', { opacity: 0, y: 22, duration: 0.65, ease: 'power3.out' });
      gsap.from('.cafe-card', {
        opacity: 0,
        y: 40,
        duration: 0.55,
        stagger: 0.08,
        ease: 'power2.out',
        delay: 0.08,
      });
    }, root);
    return () => ctx.revert();
  }, [filtered.length]);

  return (
    <div ref={pageRootRef} className="min-h-screen bg-[#0b1f1e] text-white font-sans">
      <Navbar />

      {/* CAFES GRID (kept, but lower like “listing”) */}
      <section id="cafes" className="max-w-6xl mx-auto px-6 pt-28 pb-20">
        <div className="cafes-head flex items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-[#c19d60] text-[10px] tracking-[0.45em] uppercase mb-3">/ {t('nav_cafes')}</p>
            <h2 className="font-serif text-3xl md:text-4xl text-white">Adresses</h2>
          </div>
          <p className="text-white/35 text-[11px] tracking-widest uppercase">{filtered.length} cafés</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((cafe) => (
            <motion.div
              key={cafe._id || cafe.id}
              whileHover={prefersReducedMotion() ? {} : { y: -5, transition: { type: 'spring', stiffness: 400, damping: 30 } }}
              className="cafe-card group bg-[#0e2624] border border-white/5 hover:border-[#c19d60]/35 transition-colors duration-400 overflow-hidden shadow-[0_28px_90px_-55px_rgba(0,0,0,0.9)]"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={cafe.image}
                  alt={cafe.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e2624]/70 to-transparent" />
                <span
                  className={`absolute top-3 right-3 text-[9px] tracking-widest px-2 py-1 ${
                    cafe.isOpen
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {cafe.isOpen ? t('card_open') : t('card_closed')}
                </span>
                <span className="absolute bottom-3 left-3 text-[9px] tracking-widest text-white/60 bg-black/40 px-2 py-1 max-w-[85%] truncate">
                  📍{' '}
                  {cafe.zoneLabel
                    ? translateDelegation(t, cafe.zoneLabel)
                    : cafe.zone || cafe.address || 'Gabès'}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-serif text-white text-base mb-1">{cafe.name}</h3>
                <p className="text-white/40 text-[10px] tracking-wider mb-2">{cafe.type}</p>
                <p className="text-[#c19d60]/70 text-[10px] italic mb-3">✨ {cafe.speciality}</p>
                <StarRating rating={cafe.rating} />
                <p className="text-white/25 text-[10px] mt-1">{cafe.reviews} avis</p>
                <div className="mt-3 pt-3 border-t border-white/5">
                  <Link
                    to={`/cafes/${cafe._id || cafe.id}`}
                    className="w-full block text-center text-[9px] tracking-widest text-white/50 hover:text-[#c19d60] border border-white/10 hover:border-[#c19d60]/40 py-2 transition-all"
                  >
                    {t('card_view')}
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CONTACT / HOURS (footer style like cafe home) */}
      <footer className="bg-[#071a19] border-t border-white/5 px-6 py-14">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <p className="text-[#c19d60] text-[10px] tracking-[0.45em] uppercase mb-4">Find us</p>
            <p className="text-white/50 text-sm leading-relaxed">Gabès, Tunisie</p>
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

export default Cafes;
