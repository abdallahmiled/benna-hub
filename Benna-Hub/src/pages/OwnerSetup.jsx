import React, { useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ImagePicker from '../components/ImagePicker';
import { createFood, getOwnerRestaurant, updateRestaurant, uploadImage } from '../services/api';
import { extractMapUrlForStorage, getMapPreviewState } from '../utils/maps';

const API_ORIGIN = 'http://localhost:5000';

const toImageUrl = (value) => {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${API_ORIGIN}${value}`;
};

const OwnerSetup = () => {
  const navigate = useNavigate();
  const formIds = useId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [currentImage, setCurrentImage] = useState('');
  const [mapEditorOpen, setMapEditorOpen] = useState(false);
  const [restaurant, setRestaurant] = useState({
    name: '',
    address: '',
    mapInput: ''
  });
  const [restaurantImageFile, setRestaurantImageFile] = useState(null);
  const [foodForm, setFoodForm] = useState({ name: '', price: '' });
  const [foodImageFile, setFoodImageFile] = useState(null);
  const [foods, setFoods] = useState([]);

  const mapPreview = useMemo(() => getMapPreviewState(restaurant.mapInput), [restaurant.mapInput]);
  const hasMapLink = Boolean(mapPreview.embedSrc || mapPreview.externalUrl);

  const loadOwnerRestaurant = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await getOwnerRestaurant();
      const r = res.data;
      setRestaurantId(r._id);
      setCurrentImage(r.image || '');
      setRestaurant({
        name: r.name || '',
        address: r.address || '',
        mapInput: r.googleMapsUrl || ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger votre restaurant. Connectez-vous d’abord.');
    } finally {
      setLoading(false);
    }
  };

  const saveRestaurant = async () => {
    setError('');
    setSuccess('');
    if (!restaurantId) {
      setError('Cliquez d’abord sur "Charger mon restaurant".');
      return;
    }
    const mapSrc = extractMapUrlForStorage(restaurant.mapInput);
    if (!mapSrc) {
      setError('Entrez un lien Google Maps valide ou le code iframe complet.');
      return;
    }

    setLoading(true);
    try {
      let imagePath = currentImage;
      if (restaurantImageFile) {
        const uploadRes = await uploadImage(restaurantImageFile);
        imagePath = uploadRes.data.fileUrl;
        setCurrentImage(imagePath);
        setRestaurantImageFile(null);
      }
      if (!imagePath) {
        setError('Selectionnez la photo facade depuis votre PC (obligatoire la premiere fois).');
        setLoading(false);
        return;
      }
      const payload = {
        name: restaurant.name,
        address: restaurant.address,
        image: imagePath,
        googleMapsUrl: mapSrc
      };
      await updateRestaurant(restaurantId, payload);
      setSuccess('Infos restaurant sauvegardees.');
      setMapEditorOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde du restaurant.');
    } finally {
      setLoading(false);
    }
  };

  const addFood = async () => {
    setError('');
    setSuccess('');
    if (!foodForm.name || !foodForm.price) {
      setError('Remplissez nom et prix du plat.');
      return;
    }
    if (!foodImageFile) {
      setError('Selectionnez l’image du plat depuis votre PC.');
      return;
    }
    setLoading(true);
    try {
      const uploadRes = await uploadImage(foodImageFile);
      const res = await createFood({
        name: foodForm.name,
        price: Number(foodForm.price),
        image: uploadRes.data.fileUrl
      });
      setFoods((prev) => [res.data, ...prev]);
      setFoodForm({ name: '', price: '' });
      setFoodImageFile(null);
      setSuccess('Plat ajoute. Vous pouvez ajouter un autre plat.');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l’ajout du plat.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1f1e] text-white font-sans flex flex-col">
      <Navbar />

      <div className="flex-1 px-6 pt-24 pb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="font-serif text-4xl mb-2">Finaliser Votre Restaurant</h1>
            <p className="text-white/50">Adresse, Maps, photos PC et plats un par un.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-white/10 bg-[#0e2624] p-4 space-y-3">
              <h2 className="text-sm tracking-widest uppercase text-[#c19d60]">Profil Restaurant</h2>
              <button
                type="button"
                onClick={loadOwnerRestaurant}
                disabled={loading}
                className="w-full py-2 border border-[#c19d60]/60 text-[#c19d60] text-xs tracking-widest uppercase hover:bg-[#c19d60]/10"
              >
                Charger mon restaurant
              </button>
              <input
                type="text"
                value={restaurant.name}
                onChange={(e) => setRestaurant((p) => ({ ...p, name: e.target.value }))}
                className="w-full bg-[#0b1f1e] border border-white/10 px-3 py-2 text-sm"
                placeholder="Nom du restaurant"
              />
              <input
                type="text"
                value={restaurant.address}
                onChange={(e) => setRestaurant((p) => ({ ...p, address: e.target.value }))}
                className="w-full bg-[#0b1f1e] border border-white/10 px-3 py-2 text-sm"
                placeholder="Adresse (rue)"
              />
              <div className="border border-white/10 bg-[#0b1f1e]/50 p-3 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-sm text-white/55">
                    {hasMapLink ? (
                      <span className="text-emerald-400/90">Carte Google Maps enregistrée</span>
                    ) : (
                      <span>Ajoutez un lien ou un code iframe</span>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => setMapEditorOpen((v) => !v)}
                    className="text-[10px] tracking-widest uppercase px-3 py-2 border border-[#c19d60]/70 text-[#c19d60] hover:bg-[#c19d60]/10"
                  >
                    {mapEditorOpen ? 'Masquer' : 'Modifier le lien Google Maps'}
                  </button>
                </div>
                {mapEditorOpen && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <textarea
                      value={restaurant.mapInput}
                      onChange={(e) => setRestaurant((p) => ({ ...p, mapInput: e.target.value }))}
                      className="w-full bg-[#0b1f1e] border border-white/10 px-3 py-2 text-sm min-h-28 font-mono text-xs"
                      placeholder="Lien Partager ou code &lt;iframe&gt; Google Maps"
                    />
                    <p className="text-[10px] text-white/35">Puis cliquez sur Sauvegarder restaurant.</p>
                  </div>
                )}
              </div>
              <ImagePicker
                id={`${formIds}-facade`}
                file={restaurantImageFile}
                onChange={setRestaurantImageFile}
                hasExistingImage={Boolean(currentImage)}
              />
              <button
                type="button"
                onClick={saveRestaurant}
                disabled={loading}
                className="w-full py-3 bg-[#c19d60] text-[#0b1f1e] text-xs tracking-[0.2em] uppercase font-semibold hover:bg-[#d4ac70]"
              >
                Sauvegarder Restaurant
              </button>
            </div>

            <div className="border border-white/10 bg-[#0e2624] p-4 space-y-3">
              <h2 className="text-sm tracking-widest uppercase text-[#c19d60]">Ajouter Les Plats</h2>
              <input
                name="name"
                type="text"
                value={foodForm.name}
                onChange={(e) => setFoodForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full bg-[#0b1f1e] border border-white/10 px-3 py-2 text-sm"
                placeholder="Nom du plat"
              />
              <input
                name="price"
                type="number"
                min="1"
                value={foodForm.price}
                onChange={(e) => setFoodForm((p) => ({ ...p, price: e.target.value }))}
                className="w-full bg-[#0b1f1e] border border-white/10 px-3 py-2 text-sm"
                placeholder="Prix"
              />
              <ImagePicker
                id={`${formIds}-food`}
                file={foodImageFile}
                onChange={setFoodImageFile}
              />
              <button
                type="button"
                onClick={addFood}
                disabled={loading}
                className="w-full py-2 border border-[#c19d60]/60 text-[#c19d60] text-xs tracking-widest uppercase hover:bg-[#c19d60]/10"
              >
                + Ajouter un plat
              </button>

              {foods.length > 0 && (
                <div className="space-y-3 border-t border-white/10 pt-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#c19d60]/90">Plats ajoutés</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {foods.map((f) => (
                      <div
                        key={f._id}
                        className="flex gap-3 overflow-hidden rounded-lg border border-[#c19d60]/20 bg-[#0b1f1e]/70 p-2 shadow-md shadow-black/20 ring-1 ring-white/5"
                      >
                        <img
                          src={
                            toImageUrl(f.image) ||
                            'https://images.unsplash.com/photo-1544025162-d76694265947?w=200'
                          }
                          alt=""
                          className="h-16 w-16 shrink-0 rounded-md object-cover"
                        />
                        <div className="min-w-0 flex-1 py-0.5">
                          <p className="truncate font-serif text-sm text-white">{f.name}</p>
                          <p className="mt-1 text-sm font-medium text-[#c19d60]">{f.price} TND</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {hasMapLink && (
            <div className="border border-white/10 bg-[#0e2624] p-3">
              <p className="text-xs text-white/60 mb-3">Aperçu carte</p>
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
                      className="inline-flex border border-[#c19d60]/60 px-4 py-2 text-[11px] uppercase tracking-widest text-[#c19d60] hover:bg-[#c19d60]/10"
                    >
                      Ouvrir dans Google Maps
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3">⚠️ {error}</div>}
          {success && <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm px-4 py-3">✅ {success}</div>}

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-3 bg-[#c19d60] text-[#0b1f1e] text-xs tracking-[0.25em] uppercase font-bold hover:bg-[#d4ac70]"
          >
            Terminer
          </button>
        </div>
      </div>
    </div>
  );
};

export default OwnerSetup;
