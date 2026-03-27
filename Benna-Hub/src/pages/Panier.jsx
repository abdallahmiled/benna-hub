import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { createCommande, getFoods, getRestaurant } from '../services/api';

const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const isObjectId = (v) => /^[a-fA-F0-9]{24}$/.test(String(v || ''));

const readCartKeys = () => {
  try {
    return Object.keys(localStorage).filter((k) => k.startsWith('benna_cart_'));
  } catch {
    return [];
  }
};

const readCart = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) || [] : [];
  } catch {
    return [];
  }
};

const writeCart = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
};

const removeCart = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
};

const Panier = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cartKeys, setCartKeys] = useState([]);
  const [carts, setCarts] = useState({}); // key -> items
  const [restaurantNames, setRestaurantNames] = useState({}); // id -> name
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderingKey, setOrderingKey] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'user') navigate('/');
  }, [navigate, user]);

  const refresh = () => {
    const keys = readCartKeys();
    setCartKeys(keys);
    const next = {};
    keys.forEach((k) => {
      const items = readCart(k);
      if (items && items.length) next[k] = items;
    });
    setCarts(next);
  };

  useEffect(() => {
    refresh();
    const onAny = () => refresh();
    window.addEventListener('storage', onAny);
    window.addEventListener('benna-cart-changed', onAny);
    return () => {
      window.removeEventListener('storage', onAny);
      window.removeEventListener('benna-cart-changed', onAny);
    };
  }, []);

  const restaurantIds = useMemo(() => {
    return Object.keys(carts)
      .map((k) => k.replace('benna_cart_', ''))
      .filter(Boolean);
  }, [carts]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const ids = restaurantIds.filter((id) => isObjectId(id) && !restaurantNames[id]);
      if (!ids.length) return;
      try {
        const pairs = await Promise.all(
          ids.map(async (id) => {
            try {
              const r = await getRestaurant(id);
              return [id, r.data?.name || 'Restaurant'];
            } catch {
              return [id, 'Restaurant'];
            }
          })
        );
        if (!alive) return;
        setRestaurantNames((prev) => {
          const next = { ...prev };
          pairs.forEach(([id, name]) => {
            next[id] = name;
          });
          return next;
        });
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, [restaurantIds, restaurantNames]);

  // Enrich carts with missing images (old items in localStorage)
  useEffect(() => {
    let alive = true;
    (async () => {
      const keys = Object.keys(carts);
      if (!keys.length) return;
      const targets = keys
        .map((k) => k.replace('benna_cart_', ''))
        .filter((rid) => isObjectId(rid));
      if (!targets.length) return;

      try {
        const results = await Promise.all(
          targets.map(async (rid) => {
            try {
              const res = await getFoods({ restaurant: rid });
              const foods = res.data || [];
              const map = {};
              foods.forEach((f) => {
                map[String(f._id)] = f.image || '';
              });
              return [rid, map];
            } catch {
              return [rid, {}];
            }
          })
        );
        if (!alive) return;

        const perRestaurantImageMap = Object.fromEntries(results);
        setCarts((prev) => {
          let changed = false;
          const next = { ...prev };
          Object.entries(next).forEach(([key, items]) => {
            const rid = key.replace('benna_cart_', '');
            const imgMap = perRestaurantImageMap[rid] || {};
            const updated = (items || []).map((x) => {
              if (x.image) return x;
              const img = imgMap[String(x.foodId)] || '';
              if (!img) return x;
              changed = true;
              return { ...x, image: img };
            });
            next[key] = updated;
            writeCart(key, updated);
          });
          return changed ? next : prev;
        });
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, [carts]);

  const totalCount = useMemo(() => {
    return Object.values(carts).flat().reduce((s, x) => s + (x.qty || 0), 0);
  }, [carts]);

  const totalAmountAll = useMemo(() => {
    return Object.values(carts)
      .flat()
      .reduce((sum, x) => sum + (Number(x.price) || 0) * (Number(x.qty) || 0), 0);
  }, [carts]);

  const totalAmountAllWithDelivery = useMemo(() => {
    const cartsCount = Object.keys(carts).length;
    return totalAmountAll + cartsCount * 5;
  }, [carts, totalAmountAll]);

  const updateQty = (key, foodId, qty) => {
    const q = Math.max(1, Math.min(99, Number(qty) || 1));
    const next = (carts[key] || []).map((x) => (x.foodId === foodId ? { ...x, qty: q } : x));
    setCarts((prev) => ({ ...prev, [key]: next }));
    writeCart(key, next);
  };

  const updateNote = (key, foodId, note) => {
    const v = String(note || '').slice(0, 300);
    const next = (carts[key] || []).map((x) => (x.foodId === foodId ? { ...x, note: v } : x));
    setCarts((prev) => ({ ...prev, [key]: next }));
    writeCart(key, next);
  };

  const removeItem = (key, foodId) => {
    const next = (carts[key] || []).filter((x) => x.foodId !== foodId);
    setCarts((prev) => ({ ...prev, [key]: next }));
    writeCart(key, next);
    window.dispatchEvent(new Event('benna-cart-changed'));
  };

  const clearCart = (key) => {
    removeCart(key);
    setCarts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    window.dispatchEvent(new Event('benna-cart-changed'));
  };

  const finish = async (key) => {
    const restaurantId = key.replace('benna_cart_', '');
    if (!isObjectId(restaurantId)) {
      setMsg("Commande désactivée sur les restaurants mock.");
      return;
    }
    const items = carts[key] || [];
    if (!items.length) return;
    const addr = deliveryAddress.trim();
    if (!addr) {
      setMsg('Ajoutez une adresse de livraison.');
      return;
    }
    setOrderingKey(key);
    setMsg('');
    try {
      const total = items.reduce((sum, x) => sum + (Number(x.price) || 0) * (Number(x.qty) || 0), 0);
      await createCommande({
        restaurant: restaurantId,
        items: items.map((x) => ({ food: x.foodId, quantity: x.qty, price: x.price, note: x.note || '' })),
        totalAmount: total,
        deliveryAddress: addr,
      });
      clearCart(key);
      setMsg('Commande envoyée. Merci !');
      setDeliveryAddress('');
    } catch (err) {
      setMsg(err.response?.data?.message || "Erreur lors de l'envoi de la commande.");
    } finally {
      setOrderingKey('');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1f1e] text-white font-sans">
      <Navbar />
      <div className="pt-28 pb-16 px-6 max-w-6xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-[#c19d60] text-[10px] tracking-[0.35em] uppercase mb-2">/ Panier</p>
            <h1 className="font-serif text-3xl md:text-4xl text-white">Finaliser ma commande</h1>
            <p className="text-white/45 text-sm mt-2">
              {totalCount} article(s) · Produits: {totalAmountAll} TND · Livraison: {Object.keys(carts).length * 5} TND ·
              Total: {totalAmountAllWithDelivery} TND
            </p>
            {msg ? (
              <div className="mt-4 border border-white/10 bg-[#0e2624] text-white/70 text-sm px-4 py-3">
                {msg}
              </div>
            ) : null}
          </div>
          <Link
            to="/restaurants"
            className="shrink-0 text-[10px] uppercase tracking-[0.22em] border border-white/20 px-4 py-2 text-white/65 hover:text-white hover:border-white/40 transition-colors"
          >
            ← Continuer
          </Link>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-4">
            {Object.keys(carts).length === 0 ? (
              <div className="border border-white/10 bg-[#0e2624] p-6 text-white/50">
                Panier vide.
              </div>
            ) : (
              Object.entries(carts).map(([key, items]) => {
                const restaurantId = key.replace('benna_cart_', '');
                const name = restaurantNames[restaurantId] || `Restaurant ${restaurantId}`;
                const total = (items || []).reduce(
                  (sum, x) => sum + (Number(x.price) || 0) * (Number(x.qty) || 0),
                  0
                );
                const totalWithDelivery = total + 5;
                return (
                  <section key={key} className="border border-white/10 bg-[#0e2624]">
                    <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-serif text-xl text-white truncate">{name}</p>
                        <p className="text-white/35 text-[11px] tracking-widest uppercase">
                          {items.length} item(s) · Produits {total} TND · Livraison 5 TND
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/restaurants/${restaurantId}`}
                          className="text-[10px] uppercase tracking-[0.22em] border border-white/15 px-3 py-2 text-white/65 hover:text-white hover:border-white/35 transition-colors"
                        >
                          Voir
                        </Link>
                        <button
                          type="button"
                          onClick={() => clearCart(key)}
                          className="text-[10px] uppercase tracking-[0.22em] border border-white/15 px-3 py-2 text-white/65 hover:text-white hover:border-white/35 transition-colors"
                        >
                          Vider
                        </button>
                      </div>
                    </div>

                    <div className="px-5 py-4 space-y-3">
                      {items.map((x) => (
                        <div key={x.foodId} className="grid grid-cols-1 md:grid-cols-[104px_1fr_auto] gap-4 items-start border border-white/10 bg-[#0b1f1e]/35 p-3">
                          <div className="h-24 w-24 overflow-hidden border border-white/10 bg-black/20">
                            {x.image ? (
                              <img
                                src={
                                  String(x.image).startsWith('http')
                                    ? x.image
                                    : `${API_ORIGIN}${String(x.image).startsWith('/') ? '' : '/'}${x.image}`
                                }
                                alt=""
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-white/25 text-[10px]">—</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-white/90 font-serif text-lg">{x.name}</p>
                            <p className="text-white/35 text-[11px]">{x.price} TND</p>
                            <div className="mt-3">
                              <p className="text-[10px] uppercase tracking-[0.22em] text-white/40 mb-2">
                                Instructions (optionnel)
                              </p>
                              <textarea
                                value={x.note || ''}
                                onChange={(e) => updateNote(key, x.foodId, e.target.value)}
                                placeholder="Ex: sans salade, bien cuite, extra fromage…"
                                className="w-full min-h-16 bg-[#0b1f1e] border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:border-[#c19d60]/50 placeholder-white/25 resize-none"
                              />
                            </div>
                          </div>
                          <div className="flex md:flex-col items-center md:items-end gap-2">
                            <input
                              type="number"
                              min={1}
                              max={99}
                              value={x.qty}
                              onChange={(e) => updateQty(key, x.foodId, e.target.value)}
                              className="w-20 bg-[#0b1f1e] border border-white/10 text-white text-sm px-3 py-2"
                            />
                            <button
                              type="button"
                              onClick={() => removeItem(key, x.foodId)}
                              className="px-3 py-2 border border-red-500/30 text-red-300 hover:text-red-200 hover:border-red-400/50 text-[10px] tracking-widest uppercase"
                            >
                              Suppr
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="pt-3 border-t border-white/10 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-white/45">Produits</span>
                          <span className="text-white/70">{total} TND</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/45">Livraison</span>
                          <span className="text-white/70">5 TND</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/45">Total</span>
                          <span className="text-[#c19d60] font-serif text-2xl">{totalWithDelivery} TND</span>
                        </div>
                      </div>
                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => finish(key)}
                          disabled={orderingKey === key}
                          className="px-6 py-2.5 bg-[#c19d60] hover:bg-[#d4ac70] text-[#0b1f1e] text-[11px] font-semibold tracking-[0.22em] uppercase transition-all disabled:opacity-50"
                        >
                          {orderingKey === key ? 'Envoi…' : 'Finir'}
                        </button>
                      </div>
                    </div>
                  </section>
                );
              })
            )}
          </div>

          {Object.keys(carts).length ? (
            <aside className="border border-white/10 bg-[#0e2624] p-5 h-max sticky top-24">
              <p className="text-[#c19d60] text-[10px] tracking-[0.35em] uppercase mb-3">Adresse</p>
              <input
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Adresse de livraison"
                className="w-full bg-[#0b1f1e] border border-white/10 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#c19d60]/50 placeholder-white/25"
              />
              <p className="mt-4 text-white/35 text-[11px] leading-relaxed">
                Astuce: tu peux finaliser une commande par restaurant (si tu as des articles dans plusieurs restaurants).
              </p>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Panier;

