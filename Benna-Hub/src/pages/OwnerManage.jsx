import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ImagePicker from '../components/ImagePicker';
import { extractMapUrlForStorage, getMapPreviewState } from '../utils/maps';
import {
  createFood,
  deleteFood,
  getOwnerFoods,
  getOwnerRestaurant,
  updateFood,
  updateRestaurant,
  uploadImage
} from '../services/api';

const API_ORIGIN = 'http://localhost:5000';

const toImageUrl = (value) => {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${API_ORIGIN}${value}`;
};

const OwnerManage = () => {
  const formIds = useId();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [currentImage, setCurrentImage] = useState('');
  const [mapEditorOpen, setMapEditorOpen] = useState(false);
  const [restaurant, setRestaurant] = useState({
    name: '',
    address: '',
    description: '',
    mapInput: '',
    isOpen: true
  });
  const [restaurantImageFile, setRestaurantImageFile] = useState(null);
  const [foods, setFoods] = useState([]);
  const [foodForm, setFoodForm] = useState({ name: '', price: '' });
  const [foodImageFile, setFoodImageFile] = useState(null);
  const [editingFoodId, setEditingFoodId] = useState(null);
  const [editFood, setEditFood] = useState({ name: '', price: '', isAvailable: true });
  const [editFoodImageFile, setEditFoodImageFile] = useState(null);

  const mapPreview = useMemo(() => getMapPreviewState(restaurant.mapInput), [restaurant.mapInput]);
  const hasMapLink = Boolean(mapPreview.embedSrc || mapPreview.externalUrl);

  const loadAll = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const [rRes, fRes] = await Promise.all([getOwnerRestaurant(), getOwnerFoods()]);
      const r = rRes.data;
      setRestaurantId(r._id);
      setCurrentImage(r.image || '');
      setRestaurant({
        name: r.name || '',
        address: r.address || '',
        description: r.description || '',
        mapInput: r.googleMapsUrl || '',
        isOpen: r.isOpen !== false
      });
      setFoods(fRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Connexion requise ou restaurant introuvable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const saveRestaurant = async () => {
    setError('');
    setSuccess('');
    if (!restaurantId) return;
    const mapSrc = extractMapUrlForStorage(restaurant.mapInput);
    if (!mapSrc) {
      setError('Collez un lien Google Maps valide ou le code iframe.');
      return;
    }
    setSaving(true);
    try {
      let imagePath = currentImage;
      if (restaurantImageFile) {
        const up = await uploadImage(restaurantImageFile);
        imagePath = up.data.fileUrl;
        setCurrentImage(imagePath);
        setRestaurantImageFile(null);
      }
      const payload = {
        name: restaurant.name,
        address: restaurant.address,
        description: restaurant.description,
        googleMapsUrl: mapSrc,
        image: imagePath,
        isOpen: restaurant.isOpen
      };
      await updateRestaurant(restaurantId, payload);
      setSuccess('Restaurant mis à jour.');
      setMapEditorOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  const addFood = async () => {
    setError('');
    setSuccess('');
    if (!foodForm.name || !foodForm.price) {
      setError('Nom et prix du plat requis.');
      return;
    }
    if (!foodImageFile) {
      setError('Choisissez une image pour le nouveau plat.');
      return;
    }
    setSaving(true);
    try {
      const up = await uploadImage(foodImageFile);
      const res = await createFood({
        name: foodForm.name,
        price: Number(foodForm.price),
        image: up.data.fileUrl
      });
      setFoods((prev) => [res.data, ...prev]);
      setFoodForm({ name: '', price: '' });
      setFoodImageFile(null);
      setSuccess('Plat ajouté.');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur ajout plat.');
    } finally {
      setSaving(false);
    }
  };

  const startEditFood = (f) => {
    setEditingFoodId(f._id);
    setEditFood({ name: f.name, price: String(f.price), isAvailable: f.isAvailable !== false });
    setEditFoodImageFile(null);
  };

  const saveEditFood = async () => {
    if (!editingFoodId) return;
    setSaving(true);
    setError('');
    try {
      let image = undefined;
      if (editFoodImageFile) {
        const up = await uploadImage(editFoodImageFile);
        image = up.data.fileUrl;
      }
      const body = {
        name: editFood.name,
        price: Number(editFood.price),
        isAvailable: editFood.isAvailable
      };
      if (image) body.image = image;
      const res = await updateFood(editingFoodId, body);
      setFoods((prev) => prev.map((x) => (x._id === editingFoodId ? res.data : x)));
      setEditingFoodId(null);
      setSuccess('Plat modifié.');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur modification plat.');
    } finally {
      setSaving(false);
    }
  };

  const removeFood = async (id) => {
    if (!window.confirm('Supprimer ce plat ?')) return;
    setSaving(true);
    try {
      await deleteFood(id);
      setFoods((prev) => prev.filter((x) => x._id !== id));
      if (editingFoodId === id) setEditingFoodId(null);
      setSuccess('Plat supprimé.');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur suppression.');
    } finally {
      setSaving(false);
    }
  };

  const toggleFoodAvailability = async (food) => {
    if (!food?._id) return;
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const res = await updateFood(food._id, { isAvailable: food.isAvailable === false });
      setFoods((prev) => prev.map((x) => (x._id === food._id ? res.data : x)));
      setSuccess(res.data?.isAvailable === false ? 'Plat marqué indisponible.' : 'Plat marqué disponible.');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur changement disponibilité.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1f1e] text-white font-sans">
      <Navbar />

      <div className="pt-28 pb-16 px-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-[#c19d60] text-[10px] tracking-[0.35em] uppercase mb-2">/ Espace propriétaire</p>
            <h1 className="font-serif text-3xl md:text-4xl text-white">Gérer mon restaurant</h1>
            <p className="text-white/45 text-sm mt-2">Informations, carte, photo et tous vos plats.</p>
          </div>
          <Link
            to="/dashboard"
            className="text-center text-[11px] tracking-widest uppercase border border-[#c19d60]/50 text-[#c19d60] px-4 py-2 hover:bg-[#c19d60]/10"
          >
            Voir le dashboard
          </Link>
        </div>

        {loading && <p className="text-white/40">Chargement...</p>}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3">⚠️ {error}</div>
        )}
        {success && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm px-4 py-3">✅ {success}</div>
        )}

        {!loading && (
          <div className="space-y-10">
            <section className="border border-white/10 bg-[#0e2624] p-5 md:p-6 space-y-4">
              <h2 className="text-sm tracking-[0.2em] uppercase text-[#c19d60]">Informations du restaurant</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={restaurant.name}
                  onChange={(e) => setRestaurant((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-[#0b1f1e] border border-white/10 px-3 py-2.5 text-sm"
                  placeholder="Nom du restaurant"
                />
                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={restaurant.isOpen}
                    onChange={(e) => setRestaurant((p) => ({ ...p, isOpen: e.target.checked }))}
                    className="accent-[#c19d60]"
                  />
                  Restaurant ouvert aux commandes
                </label>
              </div>
              <input
                type="text"
                value={restaurant.address}
                onChange={(e) => setRestaurant((p) => ({ ...p, address: e.target.value }))}
                className="w-full bg-[#0b1f1e] border border-white/10 px-3 py-2.5 text-sm"
                placeholder="Adresse (rue, ville)"
              />
              <textarea
                value={restaurant.description}
                onChange={(e) => setRestaurant((p) => ({ ...p, description: e.target.value }))}
                className="w-full bg-[#0b1f1e] border border-white/10 px-3 py-2.5 text-sm min-h-20"
                placeholder="Description (optionnel)"
              />
              <div className="border border-white/10 bg-[#0b1f1e]/50 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-sm text-white/55">
                    {hasMapLink ? (
                      <span className="text-emerald-400/90">Carte Google Maps enregistrée</span>
                    ) : (
                      <span>Aucune carte — ajoutez un lien ou un code d’intégration</span>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => setMapEditorOpen((v) => !v)}
                    className="shrink-0 text-[11px] tracking-widest uppercase px-4 py-2 border border-[#c19d60]/70 text-[#c19d60] hover:bg-[#c19d60]/10 transition-colors"
                  >
                    {mapEditorOpen ? 'Masquer' : 'Modifier le lien Google Maps'}
                  </button>
                </div>
                {mapEditorOpen && (
                  <div className="space-y-2 pt-1 border-t border-white/10">
                    <label className="text-[10px] text-white/40 uppercase tracking-widest">Lien ou code iframe</label>
                    <textarea
                      value={restaurant.mapInput}
                      onChange={(e) => setRestaurant((p) => ({ ...p, mapInput: e.target.value }))}
                      className="w-full bg-[#0b1f1e] border border-white/10 px-3 py-2.5 text-sm min-h-28 font-mono text-xs"
                      placeholder="Collez le lien « Partager » Google Maps ou le code &lt;iframe&gt;…"
                    />
                    <p className="text-[10px] text-white/35">
                      Enregistrez le restaurant ci-dessous pour sauvegarder la carte.
                    </p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Photo façade</p>
                <ImagePicker
                  id={`${formIds}-facade`}
                  file={restaurantImageFile}
                  onChange={setRestaurantImageFile}
                  hasExistingImage={Boolean(currentImage)}
                />
                {currentImage && !restaurantImageFile && (
                  <img
                    src={toImageUrl(currentImage)}
                    alt="Facade"
                    className="mt-3 h-32 w-full object-cover border border-white/10"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={saveRestaurant}
                disabled={saving}
                className="w-full py-3 bg-[#c19d60] text-[#0b1f1e] text-xs font-bold tracking-[0.2em] uppercase hover:bg-[#d4ac70] disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer le restaurant'}
              </button>
            </section>

            {hasMapLink && (
              <section className="border border-white/10 bg-[#0e2624] p-4">
                <p className="text-xs text-white/50 mb-3">Aperçu carte</p>
                {mapPreview.embedSrc ? (
                  <iframe
                    src={mapPreview.embedSrc}
                    title="Google Maps"
                    className="h-72 w-full rounded-sm border-0 bg-[#0b1f1e]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                ) : (
                  <div className="space-y-4 rounded-sm border border-white/10 bg-[#0b1f1e] p-5 text-sm text-white/60">
                    <p className="leading-relaxed">{mapPreview.hint}</p>
                    {mapPreview.externalUrl && (
                      <a
                        href={mapPreview.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 border border-[#c19d60]/60 px-4 py-2 text-[11px] uppercase tracking-widest text-[#c19d60] hover:bg-[#c19d60]/10"
                      >
                        Ouvrir dans Google Maps
                      </a>
                    )}
                  </div>
                )}
              </section>
            )}

            <section className="border border-[#c19d60]/30 bg-[#0e2624]/80 p-5 md:p-6 space-y-4">
              <h2 className="text-sm tracking-[0.2em] uppercase text-[#c19d60]">Mes plats</h2>
              <div className="grid sm:grid-cols-3 gap-2 border border-white/10 p-2 bg-[#0b1f1e]/50 items-stretch">
                <input
                  type="text"
                  value={foodForm.name}
                  onChange={(e) => setFoodForm((p) => ({ ...p, name: e.target.value }))}
                  className="h-9 min-h-0 bg-[#0b1f1e] border border-white/10 px-2.5 text-sm"
                  placeholder="Nom du plat"
                />
                <input
                  type="number"
                  min="1"
                  value={foodForm.price}
                  onChange={(e) => setFoodForm((p) => ({ ...p, price: e.target.value }))}
                  className="h-9 min-h-0 bg-[#0b1f1e] border border-white/10 px-2.5 text-sm"
                  placeholder="Prix (TND)"
                />
                <ImagePicker
                  id={`${formIds}-food-new`}
                  file={foodImageFile}
                  onChange={setFoodImageFile}
                  compact
                  hasExistingImage={false}
                />
                <button
                  type="button"
                  onClick={addFood}
                  disabled={saving}
                  className="sm:col-span-3 py-2 border border-[#c19d60] text-[#c19d60] text-xs tracking-widest uppercase hover:bg-[#c19d60]/10"
                >
                  + Ajouter un plat
                </button>
              </div>

              {foods.length > 0 ? (
                <>
                  <p className="mt-8 border-t border-white/10 pt-8 text-[10px] uppercase tracking-[0.28em] text-[#c19d60]/90">
                    Votre carte — plats ajoutés
                  </p>
                  <div className="mt-4 grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {foods.map((f) => (
                      <article
                        key={f._id}
                        className="group flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#c19d60]/25 bg-gradient-to-b from-[#102a28] to-[#0b1f1e] shadow-lg shadow-black/40 ring-1 ring-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-[#c19d60]/50"
                      >
                        <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-[#0b1f1e]">
                          <img
                            src={
                              toImageUrl(f.image) ||
                              'https://images.unsplash.com/photo-1544025162-d76694265947?w=600'
                            }
                            alt={f.name}
                            className="h-full w-full min-h-0 object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                          {editingFoodId !== f._id && (
                            <button
                              type="button"
                              onClick={() => toggleFoodAvailability(f)}
                              disabled={saving}
                              className={`absolute right-2 top-2 rounded-sm px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest backdrop-blur-sm ${
                                f.isAvailable !== false
                                  ? 'bg-emerald-500/85 text-white ring-1 ring-emerald-400/50'
                                  : 'bg-red-950/80 text-red-200 ring-1 ring-red-500/40'
                              }`}
                            >
                              {f.isAvailable !== false ? 'Disponible' : 'Indisponible'}
                            </button>
                          )}
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col gap-3 border-t border-white/10 p-4">
                          {editingFoodId === f._id ? (
                            <>
                              <input
                                value={editFood.name}
                                onChange={(e) => setEditFood((p) => ({ ...p, name: e.target.value }))}
                                className="w-full border border-white/10 bg-[#0b1f1e] px-2 py-1.5 text-sm"
                              />
                              <input
                                type="number"
                                value={editFood.price}
                                onChange={(e) => setEditFood((p) => ({ ...p, price: e.target.value }))}
                                className="w-full border border-white/10 bg-[#0b1f1e] px-2 py-1.5 text-sm"
                              />
                              <label className="flex items-center gap-2 text-xs text-white/60">
                                <input
                                  type="checkbox"
                                  checked={editFood.isAvailable}
                                  onChange={(e) =>
                                    setEditFood((p) => ({ ...p, isAvailable: e.target.checked }))
                                  }
                                  className="accent-[#c19d60]"
                                />
                                Disponible
                              </label>
                              <ImagePicker
                                id={`${formIds}-food-edit-${editingFoodId}`}
                                file={editFoodImageFile}
                                onChange={setEditFoodImageFile}
                                compact
                                hasExistingImage={Boolean(f.image)}
                              />
                              <div className="mt-1 flex gap-2">
                                <button
                                  type="button"
                                  onClick={saveEditFood}
                                  className="flex-1 bg-[#c19d60] py-2 text-[10px] font-semibold uppercase text-[#0b1f1e]"
                                >
                                  Sauver
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingFoodId(null)}
                                  className="flex-1 border border-white/20 py-2 text-[10px] uppercase"
                                >
                                  Annuler
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="space-y-1">
                                <h3 className="font-serif text-lg leading-snug text-white">{f.name}</h3>
                                <p className="text-sm font-medium text-[#c19d60]">{f.price} TND</p>
                              </div>
                              <div className="mt-auto flex gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => startEditFood(f)}
                                  className="flex-1 border border-[#c19d60]/40 py-2 text-[10px] uppercase tracking-wide text-[#c19d60] transition-colors hover:bg-[#c19d60]/10"
                                >
                                  Modifier
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeFood(f._id)}
                                  className="flex-1 border border-red-500/35 py-2 text-[10px] uppercase tracking-wide text-red-400 transition-colors hover:bg-red-500/10"
                                >
                                  Supprimer
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm text-white/40">Aucun plat pour le moment. Remplissez la ligne ci-dessus puis cliquez sur « Ajouter un plat ».</p>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerManage;
