import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  HiCheckCircle,
  HiTruck,
  HiMapPin,
  HiShoppingBag,
} from "react-icons/hi2";
import { formatPrice } from "../utils/productUtils.js";
import { getColorHex } from "../utils/colorUtils.js";
import toast from "react-hot-toast";

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [order] = useState(location.state?.order);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Check for valid access token in sessionStorage
    const successToken = sessionStorage.getItem("orderSuccessToken");
    const storedOrderId = sessionStorage.getItem("orderSuccessOrderId");

    // If no token, this is direct access - redirect immediately
    if (!successToken || !storedOrderId) {
      toast.error("Invalid access. Please complete an order first.");
      navigate("/", { replace: true });
      return;
    }

    // If we have order from location.state, validate it matches stored orderId
    if (order) {
      const orderId = order._id || order.orderNumber;
      if (orderId === storedOrderId) {
        setIsValid(true);
        return;
      } else {
        // Order ID doesn't match - invalid access
        toast.error("Invalid order access.");
        sessionStorage.removeItem("orderSuccessToken");
        sessionStorage.removeItem("orderSuccessOrderId");
        navigate("/", { replace: true });
        return;
      }
    }

    // If no order in state but token exists - could be page refresh
    // Redirect to order history since we can't display order without data
    if (successToken && storedOrderId && !order) {
      toast.error(
        "Order information not found. Please check your order history."
      );
      sessionStorage.removeItem("orderSuccessToken");
      sessionStorage.removeItem("orderSuccessOrderId");
      navigate("/profile", { replace: true });
      return;
    }
  }, [order, navigate]);

  // Show loading state while validating
  if (!isValid) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
          <p className="mt-4 text-sm font-medium text-slate-500">
            Validating order...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const orderNumber = order._id || order.orderNumber;
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <div className="w-full bg-slate-50 min-h-screen">
      <div className="mx-auto w-full max-w-4xl px-6 py-12 sm:px-10 xl:px-16">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <HiCheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Thank you for your order!
          </h1>
          <p className="text-lg text-slate-600 mb-2">
            Your order has been successfully placed and is being processed.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-blue-900">
              Order #{orderNumber?.slice(-8).toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-2">
            Confirmation email sent to {order.customer?.email}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Order Summary */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <HiShoppingBag className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">
                Order Summary
              </h2>
            </div>

            <div className="space-y-4 mb-6">
              {order.items?.map((item, index) => {
                const product = item.product;
                if (!product) return null;

                const productImage =
                  product.images && product.images.length > 0
                    ? product.images[0]
                    : "https://via.placeholder.com/400x400?text=No+Image";
                const itemTotal = (item.price || 0) * (item.quantity || 1);

                return (
                  <div
                    key={item._id || index}
                    className="flex gap-4 pb-4 border-b border-slate-200 last:border-0 last:pb-0"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
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
                        {item.size && (
                          <span className="px-2 py-1 bg-slate-100 rounded">
                            Size: {item.size}
                          </span>
                        )}
                        {item.color && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded">
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
                        <span className="px-2 py-1 bg-slate-100 rounded">
                          Qty: {item.quantity || 1}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {formatPrice(itemTotal)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-200">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span className="font-medium text-slate-900">
                  {formatPrice(order.subtotal || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>
                  Shipping {order.shippingMethod === "express" && "(Express)"}
                </span>
                <span className="font-medium text-slate-900">
                  {order.shippingCost === 0
                    ? "Free"
                    : formatPrice(order.shippingCost || 0)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total</span>
                <span>{formatPrice(order.total || 0)}</span>
              </div>
            </div>
          </div>

          {/* Shipping & Order Info */}
          <div className="space-y-6">
            {/* Shipping Address */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <HiMapPin className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Shipping Address
                </h2>
              </div>
              {order.shippingAddress && (
                <div className="text-sm text-slate-600 space-y-1">
                  <p className="font-medium text-slate-900">
                    {order.customer?.firstName} {order.customer?.lastName}
                  </p>
                  <p>{order.shippingAddress.address}</p>
                  {order.shippingAddress.apartment && (
                    <p>{order.shippingAddress.apartment}</p>
                  )}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                    {order.shippingAddress.zipCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                  {order.customer?.phone && (
                    <p className="mt-2 pt-2 border-t border-slate-200">
                      Phone: {order.customer.phone}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Order Details */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <HiTruck className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Order Details
                </h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Order Date</span>
                  <span className="font-medium text-slate-900">
                    {orderDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Payment Method</span>
                  <span className="font-medium text-slate-900 capitalize">
                    {order.paymentMethod || "Razorpay"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                    {order.status || "Processing"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Shipping Method</span>
                  <span className="font-medium text-slate-900 capitalize">
                    {order.shippingMethod === "express"
                      ? "Express (1-2 days)"
                      : "Standard (5-7 days)"}
                  </span>
                </div>
              </div>
            </div>

            {/* What's Next */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                What's Next?
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>
                    You'll receive an email confirmation with your order details
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>
                    We'll notify you when your order ships with tracking
                    information
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>
                    You can track your order status in your account dashboard
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/profile"
            className="inline-flex items-center justify-center px-6 py-3 border border-slate-300 rounded-lg text-base font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            View Order History
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
