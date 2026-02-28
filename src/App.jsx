import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import { CartProvider } from './context/CartContext';
import { WhiteLabelProvider } from './context/WhiteLabelContext';
import MenuScreen from './components/MenuScreen';
import IFoodCartScreen from './components/IFoodCartScreen';
import IFoodDeliveryScreen from './components/IFoodDeliveryScreen';
import IFoodPaymentScreen from './components/IFoodPaymentScreen';
import CartSheet from './components/CartSheet';
import Header from './components/Header';
import AdminLogin from './components/AdminLogin';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './components/AdminDashboard';
import AdminMenu from './components/AdminMenu';
import AdminColheita from './components/AdminColheita';
import AdminSettings from './components/AdminSettings';
import './App.css';

// A wrapper to show the header only on the Menu screen and slide transitions
function AppContent() {
  const location = useLocation();
  const isMenu = location.pathname === '/';

  return (
    <div className="app-container relative overflow-x-hidden bg-gray-50">
      {isMenu && <Header onViewChange={() => { }} currentView="menu" />}

      <main className="main-content flex-1 max-w-md mx-auto w-full bg-white min-h-screen relative">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<MenuScreen />} />
            <Route path="/cart" element={<IFoodCartScreen />} />
            <Route path="/delivery" element={<IFoodDeliveryScreen />} />
            <Route path="/payment" element={<IFoodPaymentScreen />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Floating cart logic in Menu view only */}
      {isMenu && <CartSheetWrapper />}
    </div>
  );
}

function CartSheetWrapper() {
  const navigate = useNavigate();
  return <CartSheet onCheckout={() => navigate('/cart')} />;
}

function App() {
  return (
    <BrowserRouter>
      <WhiteLabelProvider>
        <CartProvider>
          <Toaster position="bottom-center" toastOptions={{ style: { background: '#333', color: '#fff', border: 'none' } }} />
          <Routes>
            {/* Admin Routes (Full Width, No Header/Cart wrappers) */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="menu" element={<AdminMenu />} />
              <Route path="colheita" element={<AdminColheita />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Customer Application (Wrapped with AppContent logic) */}
            <Route path="*" element={<AppContent />} />
          </Routes>
        </CartProvider>
      </WhiteLabelProvider>
    </BrowserRouter>
  );
}

export default App;
