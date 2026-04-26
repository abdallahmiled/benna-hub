import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

// Auto-attach JWT token from localStorage
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── PUBLIC STATS ───
export const getHomeStats = () => API.get('/stats/home');

// ─── AUTH ───
export const registerUser  = (data) => API.post('/auth/register/user', data);
export const registerOwner = (data) => API.post('/auth/register/owner', data);
export const registerCafeOwner = (data) => API.post('/auth/register/cafe-owner', data);
export const registerLivreur = (data) => API.post('/auth/register/livreur', data);
export const loginUser     = (data) => API.post('/auth/login', data);
export const getProfile    = ()     => API.get('/auth/profile');
export const updateProfile = (data) => API.put('/auth/profile', data);

// ─── RESTAURANTS ───
export const getRestaurants = (params) => API.get('/restaurants', { params });
export const getRestaurant  = (id)     => API.get(`/restaurants/${id}`);
export const getRestaurantReviews = (id, params) => API.get(`/restaurants/${id}/reviews`, { params });
export const createRestaurant = (data) => API.post('/restaurants', data);
export const updateRestaurant = (id, data) => API.put(`/restaurants/${id}`, data);
export const getOwnerRestaurant = () => API.get('/restaurants/owner/my-restaurant');
export const getOwnerDashboard = () => API.get('/restaurants/owner/dashboard');

// ─── CAFES ───
export const getCafes = (params) => API.get('/cafes', { params });
export const getCafe = (id) => API.get(`/cafes/${id}`);
export const getOwnerCafe = () => API.get('/cafes/owner/my-cafe');
export const updateOwnerCafe = (data) => API.put('/cafes/owner/my-cafe', data);
export const getMyCafeReservations = () => API.get('/cafe-reservations/my');
/** Résumé tables pour une date (public) : capacité, réservées, disponibles */
export const getCafeReservationDaySummary = (cafeId, date) =>
  API.get(`/cafe-reservations/cafe/${cafeId}/day/${date}`);
export const createCafeReservation = (data) => API.post('/cafe-reservations', data);
export const getOwnerCafeReservations = () => API.get('/cafe-reservations/owner/my-reservations');
export const updateCafeReservationStatus = (id, data) => API.patch(`/cafe-reservations/${id}/status`, data);

// ─── CAFÉ PRODUCTS ───
export const getCafeProducts = (params) => API.get('/cafe-products', { params });
export const getOwnerCafeProducts = () => API.get('/cafe-products/owner/my-products');
export const createCafeProduct = (data) => API.post('/cafe-products', data);
export const updateCafeProduct = (id, data) => API.put(`/cafe-products/${id}`, data);
export const deleteCafeProduct = (id) => API.delete(`/cafe-products/${id}`);

// ─── FOODS ───
export const getFoods = (params) => API.get('/foods', { params });
export const createFood = (data) => API.post('/foods', data);
export const getOwnerFoods = () => API.get('/foods/owner/my-foods');
export const updateFood = (id, data) => API.put(`/foods/${id}`, data);
export const deleteFood = (id) => API.delete(`/foods/${id}`);

// ─── COMMANDES ───
export const createCommande = (data) => API.post('/commandes', data);
export const getMyCommandes = ()     => API.get('/commandes/my');
export const getRestaurantCommandes = (restaurantId) => API.get(`/commandes/restaurant/${restaurantId}`);
export const updateCommandeStatus = (id, data) => API.patch(`/commandes/${id}/status`, data);
export const rateCommande = (id, data) => API.patch(`/commandes/${id}/rating`, data);
export const getMyLivreurCommandes = () => API.get('/commandes/livreur/my');
export const updateLivreurCommandeStatus = (id, data) => API.patch(`/commandes/${id}/livreur-status`, data);

// ─── UPLOADS ───
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return API.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export default API;
