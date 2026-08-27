import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiXMark, HiMinus, HiPlus, HiShoppingCart } from "react-icons/hi2";
import toast from "react-hot-toast";
import useCartStore from "../store/cartStore.js";
import useAuthStore from "../store/authStore.js";
import { formatPrice } from "../utils/productUtils.js";
import { getColorHex } from "../utils/colorUtils.js";
import { getProducts } from "../services/productApi.js";
import { useConfirmModal } from "../contexts/ConfirmModalContext.jsx";

const Cart = () => {
  const navigate = useNavigate();
  const {
    cart,
    tempCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getAllCartItems,
    getCartTotal,
    initializeCart,
  } = useCartStore();
  const { user } = useAuthStore();
  const { showConfirm } = useConfirmModal();
  const [loading, setLoading] = useState(true);
  const [enrichedCartItems, setEnrichedCartItems] = useState([]);

  // Initialize cart when user changes
  useEffect(() => {
    if (user) {
      initializeCart(user);
    } else {
      initializeCart(null);
    }
    setLoading(false);
  }, [user, initializeCart]);

  // Enrich temp cart items with product data
  useEffect(() => {
    const enrichCartItems = async () => {
      const allItems = getAllCartItems();
      const itemsNeedingEnrichment = allItems.filter(
        (item) => !item.product || !item.product.title
      );

      if (itemsNeedingEnrichment.length === 0) {
        setEnrichedCartItems(allItems);
        return;
      }

      try {
        const response = await getProducts();
        // Handle both array format and object format with products property
        const allProducts = Array.isArray(response.data)
          ? response.data
          : response.data?.products || [];
        const enriched = allItems.map((item) => {
          if (!item.product || !item.product.title) {
            const productId =
              item.productId || item.product?._id || item.product;
            const product = allProducts.find(
              (p) => (p._id || p.slug) === productId
            );
            if (product) {
              return { ...item, product };
            }
          }
          return item;
        });
        setEnrichedCartItems(enriched);
      } catch (err) {
        console.error("Error enriching cart items:", err);
        setEnrichedCartItems(allItems);
      }
    };

    enrichCartItems();
  }, [cart, tempCart, getAllCartItems]);

  const cartItems =
    enrichedCartItems.length > 0 ? enrichedCartItems : getAllCartItems();
  const cartTotal = getCartTotal();
  const cartCount = cartItems.reduce(
    (total, item) => total + (item.quantity || 1),
    0
  );

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      await removeFromCart(itemId, user);
    } else {
      await updateCartItem(itemId, newQuantity, user);
    }
  };

  const handleRemoveItem = async (itemId) => {
    await removeFromCart(itemId, user);
  };

  const handleClearCart = async () => {
    const confirmed = await showConfirm({
      message: "Are you sure you want to clear your cart?",
      confirmText: "Clear Cart",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (confirmed) {
      await clearCart(user);
    }
  };

  const handleProceedToCheckout = () => {
    if (!user) {
      toast.error("Please login first to proceed to checkout");
      navigate("/login", { state: { from: "/cart" } });
      return;
    }
    navigate("/checkout", { state: { fromCart: true } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading cart...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-12 sm:px-10 xl:px-16">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Shopping Cart</h1>
            <p className="mt-2 text-sm text-slate-600">
              {cartItems.length === 0
                ? "Your cart is empty"
                : `${cartCount} ${cartCount === 1 ? "item" : "items"} in your cart`}
            </p>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Cart Content */}
        {cartItems.length > 0 ? (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const product = item.product;
                if (!product) return null;

                const productId = product._id || product.slug;
                const productSlug = product.slug || product._id;
                const productImage =
                  product.images && product.images.length > 0
                    ? product.images[0]
                    : "https://via.placeholder.com/400x400?text=No+Image";
                const price = product.discountedPrice || product.price || 0;
                const itemTotal = price * (item.quantity || 1);
                const itemId = item._id || item.tempId || productId;

                return (
                  <div
                    key={itemId}
                    className="flex gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    {/* Product Image */}
                    <Link
                      to={`/products/${productSlug}`}
                      className="h-32 w-32 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 sm:h-40 sm:w-40"
                    >
                      <img
                        src={productImage}
                        alt={product.title}
                        className="h-full w-full object-cover"
                      />
                    </Link>

                    {/* Product Details */}
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <Link
                            to={`/products/${productSlug}`}
                            className="text-lg font-semibold text-slate-900 hover:text-blue-600"
                          >
                            {product.title}
                          </Link>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                            {item.size && (
                              <span>
                                Size:{" "}
                                <span className="font-medium">{item.size}</span>
                              </span>
                            )}
                            {item.color && (
                              <div className="flex items-center gap-2">
                                <span>Color:</span>
                                <div
                                  className="h-5 w-5 rounded-full border border-slate-300"
                                  style={{
                                    backgroundColor: getColorHex(item.color),
                                  }}
                                  title={item.color}
                                />
                                <span className="font-medium capitalize">
                                  {item.color}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(itemId)}
                          className="shrink-0 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-600"
                          aria-label="Remove item"
                        >
                          <HiXMark className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Price and Quantity */}
                      <div className="mt-auto flex items-center justify-between">
                        <div className="text-lg font-bold text-slate-900">
                          {formatPrice(itemTotal)}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 rounded-lg border border-slate-200">
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  itemId,
                                  (item.quantity || 1) - 1
                                )
                              }
                              className="p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                              aria-label="Decrease quantity"
                            >
                              <HiMinus className="h-4 w-4" />
                            </button>
                            <span className="min-w-[3rem] text-center text-sm font-semibold text-slate-900">
                              {item.quantity || 1}
                            </span>
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  itemId,
                                  (item.quantity || 1) + 1
                                )
                              }
                              className="p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                              aria-label="Increase quantity"
                            >
                              <HiPlus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold text-slate-900">
                  Order Summary
                </h2>
                <div className="space-y-3 border-b border-slate-200 pb-4">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal ({cartCount} items)</span>
                    <span className="font-medium text-slate-900">
                      {formatPrice(cartTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Shipping</span>
                    <span className="font-medium text-slate-900">Free</span>
                  </div>
                </div>
                <div className="mt-4 flex justify-between text-lg font-bold text-slate-900">
                  <span>Total</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <button
                  onClick={handleProceedToCheckout}
                  className="mt-6 w-full rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                  disabled={cartItems.length === 0}
                >
                  Proceed to Checkout
                </button>
                <Link
                  to="/"
                  className="mt-4 block w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 py-16 text-center">
            <HiShoppingCart className="mx-auto h-16 w-16 text-slate-300" />
            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              Your cart is empty
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Start adding products to your cart!
            </p>
            <Link
              to="/"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold !text-white transition-colors hover:bg-blue-700"
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
