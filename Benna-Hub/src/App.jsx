import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import AnimatedLayout from './layouts/AnimatedLayout';
import Home from './pages/Home';
import Restaurants from './pages/Restaurants';
import Cafes from './pages/Cafes';
import Login from './pages/Login';
import Register from './pages/Register';
import OwnerSetup from './pages/OwnerSetup';
import OwnerManage from './pages/OwnerManage';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile.jsx';
import RestaurantPage from './pages/RestaurantPage';
import CafePage from './pages/CafePage';
import CafeManage from './pages/CafeManage';
import Panier from './pages/Panier';
import MyCommandes from './pages/MyCommandes';
import LivreurDashboard from './pages/LivreurDashboard';
import CafeOwnerDashboard from './pages/CafeOwnerDashboard';
import Contact from './pages/Contact';
import Search from './pages/Search';

const App = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AnimatedLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/restaurants" element={<Restaurants />} />
              <Route path="/restaurants/:id" element={<RestaurantPage />} />
              <Route path="/cafes" element={<Cafes />} />
              <Route path="/cafes/:id" element={<CafePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/owner/setup" element={<OwnerSetup />} />
              <Route path="/owner/manage" element={<OwnerManage />} />
              <Route path="/cafe/manage" element={<CafeManage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/panier" element={<Panier />} />
              <Route path="/mes-commandes" element={<MyCommandes />} />
              <Route path="/livreur/dashboard" element={<LivreurDashboard />} />
              <Route path="/cafe/dashboard" element={<CafeOwnerDashboard />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/search" element={<Search />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
