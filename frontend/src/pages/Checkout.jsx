import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  HiLockClosed,
  HiCreditCard,
  HiTruck,
  HiMapPin,
  HiArrowLeft,
} from "react-icons/hi2";
import useCartStore from "../store/cartStore.js";
import useAuthStore from "../store/authStore.js";
import { formatPrice } from "../utils/productUtils.js";
import { getColorHex } from "../utils/colorUtils.js";
import { getProducts } from "../services/productApi.js";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../services/orderApi.js";
import toast from "react-hot-toast";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    cart,
    tempCart,
    getAllCartItems,
    getCartTotal,
    clearCart,
    initializeCart,
  } = useCartStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [enrichedCartItems, setEnrichedCartItems] = useState([]);
  const [isOrderComplete, setIsOrderComplete] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: user?.email || "",
    phone: "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    shippingMethod: "standard",
    paymentMethod: "razorpay",
  });

  // Check if user came from cart page, redirect if not
  useEffect(() => {
    if (!loading && location.state?.fromCart !== true) {
      toast.error("Please proceed to checkout from your cart");
      navigate("/cart", { replace: true });
    }
  }, [loading, location.state, navigate]);

  // Initialize cart when user changes
  useEffect(() => {
    if (user) {
      initializeCart(user);
    } else {
      initializeCart(null);
    }
    setLoading(false);
  }, [user, initializeCart]);

  // Enrich cart items with product data
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
        const allProducts = response.data;
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

  // Calculate shipping cost
  const shippingCost = formData.shippingMethod === "express" ? 15 : 0;
  const orderTotal = cartTotal + shippingCost;

  // Redirect if cart is empty (but not if we just completed an order)
  useEffect(() => {
    if (!loading && cartItems.length === 0 && !isOrderComplete) {
      navigate("/cart");
    }
  }, [cartItems.length, loading, navigate, isOrderComplete]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Format card number with spaces
    if (name === "cardNumber") {
      processedValue = value
        .replace(/\s/g, "")
        .replace(/(.{4})/g, "$1 ")
        .trim();
    }
    // Format expiry date
    else if (name === "cardExpiry") {
      processedValue = value
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d)/, "$1/$2")
        .substring(0, 5);
    }
    // Format CVC (numbers only)
    else if (name === "cardCVC") {
      processedValue = value.replace(/\D/g, "").substring(0, 4);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.email.includes("@")) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!formData.phone || formData.phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return false;
    }
    if (!formData.firstName || !formData.lastName) {
      toast.error("Please enter your full name");
      return false;
    }
    if (
      !formData.address ||
      !formData.city ||
      !formData.state ||
      !formData.zipCode
    ) {
      toast.error("Please complete your shipping address");
      return false;
    }
    // Razorpay and COD don't require additional validation
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    // Prepare order data
    const orderData = {
      customer: {
        email: formData.email,
        phone: formData.phone,
        firstName: formData.firstName,
        lastName: formData.lastName,
      },
      shippingAddress: {
        address: formData.address,
        apartment: formData.apartment,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
      },
      items: cartItems.map((item) => {
        const product = item.product;
        const price = product?.discountedPrice || product?.price || 0;
        return {
          product: item.productId || item.product?._id || item.product,
          quantity: item.quantity || 1,
          size: item.size || null,
          color: item.color || null,
          price: price,
        };
      }),
      total: orderTotal,
      subtotal: cartTotal,
      shippingMethod: formData.shippingMethod,
      shippingCost: shippingCost,
      paymentMethod: formData.paymentMethod,
    };

    try {
      // Create Razorpay order
      const razorpayResponse = await createRazorpayOrder(orderTotal);
      const { orderId } = razorpayResponse.data;

      // Initialize Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayResponse.data.amount,
        currency: razorpayResponse.data.currency || "INR",
        name: "StrideLab",
        description: "Order Payment",
        order_id: orderId,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyResponse = await verifyRazorpayPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderData: orderData,
            });

            // Set flag to prevent cart redirect
            setIsOrderComplete(true);

            // Store order success token in sessionStorage for access protection
            const successToken = `order_success_${Date.now()}_${verifyResponse.data.order._id}`;
            sessionStorage.setItem("orderSuccessToken", successToken);
            sessionStorage.setItem(
              "orderSuccessOrderId",
              verifyResponse.data.order._id
            );

            // Clear cart before navigation (won't trigger redirect due to isOrderComplete flag)
            await clearCart(user, true); // Pass true to suppress toast

            // Navigate to success page with order data
            navigate("/order-success", {
              state: { order: verifyResponse.data.order },
              replace: true,
            });
          } catch (err) {
            console.error("Payment verification error:", err);
            toast.error(
              err.response?.data?.message ||
                "Payment verification failed. Please contact support."
            );
            setSubmitting(false);
          }
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
            toast.error("Payment cancelled");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Error processing order:", err);
      toast.error(
        err.response?.data?.message ||
          "Failed to process order. Please try again."
      );
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading checkout...
          </p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-12 sm:px-10 xl:px-16">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/cart"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            <HiArrowLeft className="h-4 w-4" />
            Return to Cart
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>
          <p className="mt-2 text-sm text-slate-600">
            Complete your order in just a few steps
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Contact Information */}
              <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <HiMapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Contact Information
                    </h2>
                    <p className="text-sm text-slate-600">
                      We'll use this to send you order updates
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Email address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Phone number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </section>

              {/* Shipping Address */}
              <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <HiTruck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Shipping Address
                    </h2>
                    <p className="text-sm text-slate-600">
                      Where should we deliver your order?
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      First name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Last name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Doe"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="address"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="apartment"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Apartment, suite, etc. (optional)
                    </label>
                    <input
                      type="text"
                      id="apartment"
                      name="apartment"
                      value={formData.apartment}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Apt 4B"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="city"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="state"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="NY"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="zipCode"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      ZIP code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="10001"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="country"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Shipping Method */}
              <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <HiTruck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Shipping Method
                    </h2>
                    <p className="text-sm text-slate-600">
                      Choose how you want your order delivered
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:border-blue-500 transition-colors">
                    <input
                      type="radio"
                      id="standard"
                      name="shippingMethod"
                      value="standard"
                      checked={formData.shippingMethod === "standard"}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="standard" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-slate-900">
                            Standard Shipping
                          </span>
                          <p className="text-sm text-slate-600">
                            5-7 business days
                          </p>
                        </div>
                        <span className="font-semibold text-slate-900">
                          Free
                        </span>
                      </div>
                    </label>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:border-blue-500 transition-colors">
                    <input
                      type="radio"
                      id="express"
                      name="shippingMethod"
                      value="express"
                      checked={formData.shippingMethod === "express"}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="express" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-slate-900">
                            Express Shipping
                          </span>
                          <p className="text-sm text-slate-600">
                            1-2 business days
                          </p>
                        </div>
                        <span className="font-semibold text-slate-900">
                          {formatPrice(15)}
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </section>

              {/* Payment Method */}
              <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <HiCreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Payment Method
                    </h2>
                    <p className="text-sm text-slate-600">
                      Secure payment via Razorpay
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-center gap-3">
                    <HiCreditCard className="h-6 w-6 text-blue-600" />
                    <div className="flex-1">
                      <span className="font-medium text-slate-900">
                        Razorpay Payment
                      </span>
                      <p className="text-sm text-slate-600 mt-1">
                        Pay securely using Card, UPI, Netbanking, or Wallet
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
                  <HiLockClosed className="h-4 w-4" />
                  <span>Your payment information is secure and encrypted</span>
                </div>
              </section>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold text-slate-900">
                  Order Summary
                </h2>
                <div className="mb-4 max-h-64 space-y-3 overflow-y-auto border-b border-slate-200 pb-4">
                  {cartItems.map((item) => {
                    const product = item.product;
                    if (!product) return null;

                    const productImage =
                      product.images && product.images.length > 0
                        ? product.images[0]
                        : "https://via.placeholder.com/400x400?text=No+Image";
                    const price = product.discountedPrice || product.price || 0;
                    const itemTotal = price * (item.quantity || 1);

                    return (
                      <div key={item._id || item.tempId} className="flex gap-3">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                          <img
                            src={productImage}
                            alt={product.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 line-clamp-2">
                            {product.title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                            {item.size && <span>Size: {item.size}</span>}
                            {item.color && (
                              <div className="flex items-center gap-1">
                                <span>Color:</span>
                                <div
                                  className="h-3 w-3 rounded-full border border-slate-300"
                                  style={{
                                    backgroundColor: getColorHex(item.color),
                                  }}
                                  title={item.color}
                                />
                              </div>
                            )}
                            <span>Qty: {item.quantity || 1}</span>
                          </div>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {formatPrice(itemTotal)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-3 border-b border-slate-200 pb-4">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal ({cartCount} items)</span>
                    <span className="font-medium text-slate-900">
                      {formatPrice(cartTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>
                      Shipping{" "}
                      {formData.shippingMethod === "express" && "(Express)"}
                    </span>
                    <span className="font-medium text-slate-900">
                      {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex justify-between text-lg font-bold text-slate-900">
                  <span>Total</span>
                  <span>{formatPrice(orderTotal)}</span>
                </div>
                <button
                  type="submit"
                  disabled={submitting || cartItems.length === 0}
                  className="mt-6 w-full rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Processing...
                    </span>
                  ) : (
                    <>
                      <HiLockClosed className="mr-2 inline h-5 w-5" />
                      Complete Order
                    </>
                  )}
                </button>
                <p className="mt-3 text-center text-xs text-slate-500">
                  By completing your purchase, you agree to our Terms of Service
                  and Privacy Policy
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
