import { useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import MainLayout from "./layouts/MainLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Collection from "./pages/Collection.jsx";
import Product from "./pages/Product.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import Search from "./pages/Search.jsx";
import Profile from "./pages/Profile.jsx";
import MyOrders from "./pages/MyOrders.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";
import Products from "./pages/admin/Products.jsx";
import CreateProduct from "./pages/admin/products/CreateProduct.jsx";
import EditProduct from "./pages/admin/products/EditProduct.jsx";
import Collections from "./pages/admin/Collections.jsx";
import CreateCollection from "./pages/admin/collections/CreateCollection.jsx";
import EditCollection from "./pages/admin/collections/EditCollection.jsx";
import Orders from "./pages/admin/Orders.jsx";
import OrderDetail from "./pages/admin/OrderDetail.jsx";
import Customers from "./pages/admin/Customers.jsx";
import Analytics from "./pages/admin/Analytics.jsx";
import useAuth from "./hooks/useAuth.js";
import useAuthStore from "./store/authStore.js";
import useWishlistStore from "./store/wishlistStore.js";
import useCartStore from "./store/cartStore.js";
import { ConfirmModalProvider } from "./contexts/ConfirmModalContext.jsx";

const App = () => {
  const { initializeAuth } = useAuth();
  const { user } = useAuthStore();
  const { initializeWishlist } = useWishlistStore();
  const { initializeCart } = useCartStore();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    initializeAuth();
  }, [initializeAuth]);

  // Initialize wishlist when user changes
  useEffect(() => {
    if (user) {
      initializeWishlist(user);
    } else {
      initializeWishlist(null);
    }
  }, [user, initializeWishlist]);

  // Initialize cart when user changes
  useEffect(() => {
    if (user) {
      initializeCart(user);
    } else {
      initializeCart(null);
    }
  }, [user, initializeCart]);

  return (
    <ConfirmModalProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <MainLayout>
                <Home />
              </MainLayout>
            }
          />
          <Route
            path="/login"
            element={
              <MainLayout>
                <Login />
              </MainLayout>
            }
          />
          <Route
            path="/register"
            element={
              <MainLayout>
                <Register />
              </MainLayout>
            }
          />
          <Route
            path="/collections/:slug"
            element={
              <MainLayout>
                <Collection />
              </MainLayout>
            }
          />
          <Route
            path="/products/:slug"
            element={
              <MainLayout>
                <Product />
              </MainLayout>
            }
          />
          <Route
            path="/wishlist"
            element={
              <MainLayout>
                <Wishlist />
              </MainLayout>
            }
          />
          <Route
            path="/cart"
            element={
              <MainLayout>
                <Cart />
              </MainLayout>
            }
          />
          <Route
            path="/checkout"
            element={
              <MainLayout>
                <Checkout />
              </MainLayout>
            }
          />
          <Route
            path="/order-success"
            element={
              <MainLayout>
                <OrderSuccess />
              </MainLayout>
            }
          />
          <Route
            path="/search"
            element={
              <MainLayout>
                <Search />
              </MainLayout>
            }
          />
          <Route
            path="/profile"
            element={
              <MainLayout>
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              </MainLayout>
            }
          />
          <Route
            path="/orders"
            element={
              <MainLayout>
                <ProtectedRoute>
                  <MyOrders />
                </ProtectedRoute>
              </MainLayout>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Navigate to="/admin/dashboard" replace />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminLayout>
                  <Routes>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="products" element={<Products />} />
                    <Route path="products/create" element={<CreateProduct />} />
                    <Route path="products/edit/:id" element={<EditProduct />} />
                    <Route path="collections" element={<Collections />} />
                    <Route
                      path="collections/create"
                      element={<CreateCollection />}
                    />
                    <Route
                      path="collections/edit/:id"
                      element={<EditCollection />}
                    />
                    <Route path="orders" element={<Orders />} />
                    <Route path="orders/:orderId" element={<OrderDetail />} />
                    <Route path="customers" element={<Customers />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route
                      path="*"
                      element={
                        <div className="text-center py-12">
                          <h1 className="text-2xl font-semibold text-slate-900">
                            Page not found
                          </h1>
                          <p className="mt-3 text-sm text-slate-500">
                            The page you are looking for doesn&apos;t exist.
                          </p>
                        </div>
                      }
                    />
                  </Routes>
                </AdminLayout>
              </AdminRoute>
            }
          />

          {/* 404 Route */}
          <Route
            path="*"
            element={
              <MainLayout>
                <div className="text-center">
                  <h1 className="text-3xl font-semibold text-slate-900">
                    Page not found
                  </h1>
                  <p className="mt-3 text-sm text-slate-500">
                    The page you are looking for doesn&apos;t exist yet. Please
                    navigate using the menu.
                  </p>
                </div>
              </MainLayout>
            }
          />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </ConfirmModalProvider>
  );
};

export default App;
