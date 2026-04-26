import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ImagePicker from '../components/ImagePicker';
import {
  createCafeProduct,
  deleteCafeProduct,
  getOwnerCafe,
  getOwnerCafeProducts,
  updateCafeProduct,
  uploadImage,
} from '../services/api';

const API_ORIGIN = 'http://localhost:5000';

const toImageUrl = (value) => {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${API_ORIGIN}${value}`;
};

const CafeManage = () => {
  const ids = useId();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cafe, setCafe] = useState(null);
  const [products, setProducts] = useState([]);

  const [productForm, setProductForm] = useState({ name: '', price: '' });
  const [productImageFile, setProductImageFile] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editProduct, setEditProduct] = useState({ name: '', price: '', isAvailable: true });
  const [editImageFile, setEditImageFile] = useState(null);

  const loadAll = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([getOwnerCafe(), getOwnerCafeProducts()]);
      setCafe(cRes.data || null);
      setProducts(pRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Connexion requise ou café introuvable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const addProduct = async () => {
    setError('');
    setSuccess('');
    if (!productForm.name || !productForm.price) {
      setError('Nom et prix requis.');
      return;
    }
    setSaving(true);
    try {
      let imagePath = '';
      if (productImageFile) {
        const up = await uploadImage(productImageFile);
        imagePath = up.data.fileUrl;
        setProductImageFile(null);
      }
      const created = await createCafeProduct({
        name: productForm.name,
        price: Number(productForm.price),
        image: imagePath,
        isAvailable: true,
      });
      setProducts((p) => [created.data, ...p]);
      setProductForm({ name: '', price: '' });
      setSuccess('Produit ajouté.');
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'ajout.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (p) => {
    setEditingId(p._id);
    setEditProduct({
      name: p.name || '',
      price: p.price ?? '',
      isAvailable: p.isAvailable !== false,
    });
    setEditImageFile(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditProduct({ name: '', price: '', isAvailable: true });
    setEditImageFile(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setError('');
    setSuccess('');
    if (!editProduct.name || editProduct.price === '' || editProduct.price === null) {
      setError('Nom et prix requis.');
      return;
    }
    setSaving(true);
    try {
      let imagePath = products.find((x) => x._id === editingId)?.image || '';
      if (editImageFile) {
        const up = await uploadImage(editImageFile);
        imagePath = up.data.fileUrl;
        setEditImageFile(null);
      }
      const updated = await updateCafeProduct(editingId, {
        name: editProduct.name,
        price: Number(editProduct.price),
        image: imagePath,
        isAvailable: Boolean(editProduct.isAvailable),
      });
      setProducts((prev) => prev.map((x) => (x._id === editingId ? updated.data : x)));
      setSuccess('Produit mis à jour.');
      cancelEdit();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  const removeProduct = async (id) => {
    if (!id) return;
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await deleteCafeProduct(id);
      setProducts((p) => p.filter((x) => x._id !== id));
      if (editingId === id) cancelEdit();
      setSuccess('Produit supprimé.');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur suppression.');
    } finally {
      setSaving(false);
    }
  };

  const cafeName = useMemo(() => cafe?.name || 'Mon café', [cafe?.name]);

  return (
    <div className="min-h-screen bg-[#0b1f1e] text-white font-sans">
      <Navbar />

      <div className="pt-28 pb-16 px-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-[#c19d60] text-[10px] tracking-[0.35em] uppercase mb-2">/ Espace café</p>
            <h1 className="font-serif text-3xl md:text-4xl text-white">Gérer mon café</h1>
            <p className="text-white/45 text-sm mt-2">
              Produits (photos), disponibilité et mise en avant sur la page du café.
            </p>
            <p className="text-white/35 text-xs mt-2">Café: {cafeName}</p>
          </div>
          <Link
            to="/cafes"
            className="text-center text-[11px] tracking-widest uppercase border border-[#c19d60]/50 text-[#c19d60] px-4 py-2 hover:bg-[#c19d60]/10"
          >
            Voir les cafés
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
              <h2 className="text-sm tracking-[0.2em] uppercase text-[#c19d60]">Ajouter un produit</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-[#0b1f1e] border border-white/10 px-3 py-2.5 text-sm"
                  placeholder="Nom (ex: Cappuccino)"
                />
                <input
                  type="number"
                  inputMode="decimal"
                  value={productForm.price}
                  onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))}
                  className="w-full bg-[#0b1f1e] border border-white/10 px-3 py-2.5 text-sm"
                  placeholder="Prix (ex: 12)"
                />
              </div>
              <ImagePicker
                compact
                file={productImageFile}
                setFile={setProductImageFile}
                hasExistingImage={false}
                label={`Image produit (${ids}-new)`}
              />
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={addProduct}
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#c19d60] hover:bg-[#d4ac70] text-[#0b1f1e] text-[11px] font-semibold tracking-[0.22em] uppercase transition-all disabled:opacity-50"
                >
                  Ajouter
                </button>
              </div>
            </section>

            <section className="border border-white/10 bg-[#0e2624] p-5 md:p-6 space-y-4">
              <h2 className="text-sm tracking-[0.2em] uppercase text-[#c19d60]">Mes produits</h2>

              {products.length === 0 ? (
                <p className="text-white/40 text-sm">Aucun produit pour le moment.</p>
              ) : (
                <div className="grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((p) => {
                    const isEditing = editingId === p._id;
                    const img = toImageUrl(p.image);
                    return (
                      <article
                        key={p._id}
                        className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent"
                      >
                        <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-black/30">
                          {img ? (
                            <img
                              src={img}
                              alt={p.name}
                              className="h-full w-full min-h-0 object-cover object-center transition-transform duration-500 hover:scale-[1.03]"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-white/30 text-sm">
                              Sans image
                            </div>
                          )}
                          {!isEditing ? (
                            <span
                              className={`absolute right-2 top-2 rounded-sm px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest backdrop-blur-sm ${
                                p.isAvailable !== false
                                  ? 'bg-emerald-500/85 text-white ring-1 ring-emerald-400/50'
                                  : 'bg-red-950/80 text-red-200 ring-1 ring-red-500/40'
                              }`}
                            >
                              {p.isAvailable !== false ? 'Disponible' : 'Indisponible'}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex flex-1 flex-col p-4">
                          {isEditing ? (
                            <div className="space-y-3">
                              <input
                                value={editProduct.name}
                                onChange={(e) => setEditProduct((x) => ({ ...x, name: e.target.value }))}
                                className="w-full bg-[#0b1f1e] border border-white/10 px-3 py-2 text-sm"
                                placeholder="Nom"
                              />
                              <input
                                type="number"
                                inputMode="decimal"
                                value={editProduct.price}
                                onChange={(e) => setEditProduct((x) => ({ ...x, price: e.target.value }))}
                                className="w-full bg-[#0b1f1e] border border-white/10 px-3 py-2 text-sm"
                                placeholder="Prix"
                              />
                              <label className="flex items-center gap-2 text-sm text-white/70">
                                <input
                                  type="checkbox"
                                  checked={Boolean(editProduct.isAvailable)}
                                  onChange={(e) => setEditProduct((x) => ({ ...x, isAvailable: e.target.checked }))}
                                  className="accent-[#c19d60]"
                                />
                                Disponible
                              </label>
                              <ImagePicker
                                compact
                                file={editImageFile}
                                setFile={setEditImageFile}
                                hasExistingImage={Boolean(p.image)}
                                label={`Image produit (${ids}-${p._id})`}
                              />
                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="px-3 py-2 text-[10px] tracking-widest uppercase border border-white/15 text-white/70 hover:text-white hover:border-white/40"
                                >
                                  Annuler
                                </button>
                                <button
                                  type="button"
                                  onClick={saveEdit}
                                  disabled={saving}
                                  className="px-3 py-2 text-[10px] tracking-widest uppercase bg-[#c19d60] text-[#0b1f1e] hover:bg-[#d4ac70] disabled:opacity-50"
                                >
                                  Enregistrer
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-1 flex-col">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-serif text-lg text-white truncate">{p.name}</p>
                                </div>
                                <p className="font-serif text-lg text-[#c19d60] whitespace-nowrap">{p.price} TND</p>
                              </div>
                              <div className="mt-auto flex items-center justify-end gap-2 pt-4">
                                <button
                                  type="button"
                                  onClick={() => startEdit(p)}
                                  className="px-3 py-2 text-[10px] tracking-widest uppercase border border-white/15 text-white/70 hover:text-white hover:border-white/40"
                                >
                                  Modifier
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeProduct(p._id)}
                                  disabled={saving}
                                  className="px-3 py-2 text-[10px] tracking-widest uppercase border border-red-500/30 text-red-300 hover:text-red-200 hover:border-red-400/60 disabled:opacity-50"
                                >
                                  Supprimer
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default CafeManage;

