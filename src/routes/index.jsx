import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from '../components/common';
import {
  AuthProvider,
  useAuth,
} from '../context/AuthContext';
import {
  CartProvider,
} from '../context/CartContext';
import StoreLayout from '../components/layout/StoreLayout';
import AdminLayout from '../components/layout/AdminLayout';
import AuthLayout from '../components/layout/AuthLayout';
import { ProtectedRoute, AdminRoute } from '../components/common/ProtectedRoute';

// Storefront
import Home from '../pages/store/Home';
import ProductList from '../pages/store/ProductList';
import ProductDetail from '../pages/store/ProductDetail';
import CategoriesList from '../pages/store/CategoriesList';
import CategoryPage from '../pages/store/CategoryPage';
import BrandsList from '../pages/store/BrandsList';
import BrandPage from '../pages/store/BrandPage';
import Search from '../pages/store/Search';
import Cart from '../pages/store/Cart';
import Checkout from '../pages/store/Checkout';

// Auth
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import OtpVerify from '../pages/auth/OtpVerify';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

// Account
import Profile from '../pages/account/Profile';
import MyOrders from '../pages/account/MyOrders';
import AccountOrderDetail from '../pages/account/OrderDetail';
import Addresses from '../pages/account/Addresses';
import AccountSettings from '../pages/account/AccountSettings';

// Admin
import Dashboard from '../pages/admin/Dashboard';
import AdminProducts from '../pages/admin/Products';
import ProductCreate from '../pages/admin/ProductCreate';
import ProductEdit from '../pages/admin/ProductEdit';
import AdminCategories from '../pages/admin/Categories';
import AdminBrands from '../pages/admin/Brands';
import Inventory from '../pages/admin/Inventory';
import AdminWarehouses from '../pages/admin/Warehouses';
import AdminOrders from '../pages/admin/Orders';
import AdminOrderDetail from '../pages/admin/OrderDetail';
import Customers from '../pages/admin/Customers';
import Reports from '../pages/admin/Reports';
import Settings from '../pages/admin/Settings';

function RedirectIfAuthenticated({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              {/* Public storefront */}
              <Route path="/" element={<StoreLayout />}>
                <Route index element={<Home />} />
                <Route path="products" element={<ProductList />} />
                <Route path="products/:id" element={<ProductDetail />} />
                <Route path="categories" element={<CategoriesList />} />
                <Route path="categories/:slug" element={<CategoryPage />} />
                <Route path="brands" element={<BrandsList />} />
                <Route path="brands/:slug" element={<BrandPage />} />
                <Route path="search" element={<Search />} />
                <Route path="cart" element={<Cart />} />
                <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="home" element={<Navigate to="/" replace />} />

                {/* Account (protected) */}
                <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
                <Route path="my-orders/:id" element={<ProtectedRoute><AccountOrderDetail /></ProtectedRoute>} />
                <Route path="addresses" element={<ProtectedRoute><Addresses /></ProtectedRoute>} />
                <Route path="account/settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
              </Route>

              {/* Auth (redirect if authenticated) */}
              <Route path="login" element={<RedirectIfAuthenticated><AuthLayout><Login /></AuthLayout></RedirectIfAuthenticated>} />
              <Route path="register" element={<RedirectIfAuthenticated><AuthLayout><Register /></AuthLayout></RedirectIfAuthenticated>} />
              <Route path="otp/verify" element={<RedirectIfAuthenticated><AuthLayout><OtpVerify /></AuthLayout></RedirectIfAuthenticated>} />
              <Route path="forgot-password" element={<RedirectIfAuthenticated><AuthLayout><ForgotPassword /></AuthLayout></RedirectIfAuthenticated>} />
              <Route path="reset-password" element={<RedirectIfAuthenticated><AuthLayout><ResetPassword /></AuthLayout></RedirectIfAuthenticated>} />

              {/* Admin */}
              <Route path="admin/*" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/create" element={<ProductCreate />} />
                <Route path="products/:id/edit" element={<ProductEdit />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="brands" element={<AdminBrands />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="warehouses" element={<AdminWarehouses />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="orders/:id" element={<AdminOrderDetail />} />
                <Route path="customers" element={<Customers />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

