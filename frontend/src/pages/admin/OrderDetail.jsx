import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  HiChevronLeft,
  HiOutlinePhoto,
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineMapPin,
  HiOutlineCreditCard,
  HiOutlineClock,
  HiOutlineShoppingBag,
} from "react-icons/hi2";
import { getOrderAdmin, updateOrderStatus } from "../../services/orderApi.js";
import { getColorHex } from "../../utils/colorUtils.js";
import { useConfirmModal } from "../../contexts/ConfirmModalContext.jsx";
import toast from "react-hot-toast";

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { showConfirm } = useConfirmModal();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getOrderAdmin(orderId);
      setOrder(response.data.order);
    } catch (err) {
      console.error("Error fetching order:", err);
      setError(err.response?.data?.message || "Failed to load order");
      toast.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    const confirmed = await showConfirm({
      message: `Are you sure you want to change the order status to ${newStatus}?`,
      confirmText: "Update",
      cancelText: "Cancel",
      variant: "default",
    });
    if (confirmed) {
      try {
        await updateOrderStatus(orderId, newStatus);
        toast.success("Order status updated successfully");
        fetchOrder();
      } catch (error) {
        console.error("Error updating order status:", error);
        toast.error(
          error.response?.data?.message || "Failed to update order status"
        );
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getOrderId = (order) => {
    return (
      order?.razorpayOrderId || order?._id?.slice(-8)?.toUpperCase() || "N/A"
    );
  };

  const getCustomerName = (order) => {
    if (order?.customer) {
      return `${order.customer.firstName} ${order.customer.lastName}`;
    }
    if (order?.user) {
      return `${order.user.firstName} ${order.user.lastName}`;
    }
    return "N/A";
  };

  const getCustomerEmail = (order) => {
    return order?.customer?.email || order?.user?.email || "N/A";
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading order details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-900">
            {error || "Order not found"}
          </p>
          <button
            onClick={() => navigate("/admin/orders")}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/admin/orders")}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <HiChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">Order Details</h1>
            <p className="text-slate-600 mt-1">
              Order #{getOrderId(order)} • Placed on{" "}
              {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold capitalize ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
                <div className="h-8 w-px bg-slate-200"></div>
                <div className="flex items-center gap-2 text-slate-600">
                  <HiOutlineShoppingBag className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {order.items?.length || 0} item
                    {order.items?.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700">
                Update Status:
              </label>
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white font-medium"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <HiOutlineShoppingBag className="w-5 h-5" />
                Order Items
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      {item.product?.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.title || "Product"}
                          className="w-24 h-24 object-cover rounded-lg shrink-0 border border-slate-200"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 border border-slate-200">
                          <HiOutlinePhoto className="w-10 h-10 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 text-lg mb-2">
                          {item.product?.title || "Product"}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 mb-3">
                          <span className="px-2.5 py-1 bg-slate-100 rounded-md font-medium">
                            Qty: {item.quantity}
                          </span>
                          {item.size && (
                            <span className="px-2.5 py-1 bg-slate-100 rounded-md font-medium">
                              Size: {item.size}
                            </span>
                          )}
                          {item.color && (
                            <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-100 rounded-md">
                              <span className="font-medium">Color:</span>
                              <div
                                className="h-4 w-4 rounded-full border-2 border-slate-300 shadow-sm"
                                style={{
                                  backgroundColor: getColorHex(item.color),
                                }}
                                title={item.color}
                              />
                              <span className="font-medium">{item.color}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-slate-900">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                          <span className="text-sm text-slate-500">
                            @ {formatPrice(item.price)} each
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-center py-8">
                    No items found
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <HiOutlineMapPin className="w-5 h-5" />
                  Shipping Address
                </h2>
              </div>
              <div className="p-6">
                <div className="text-slate-700 space-y-2">
                  <p className="font-semibold text-lg text-slate-900">
                    {order.customer?.firstName} {order.customer?.lastName}
                  </p>
                  <p className="text-slate-600">
                    {order.shippingAddress.address}
                  </p>
                  {order.shippingAddress.apartment && (
                    <p className="text-slate-600">
                      {order.shippingAddress.apartment}
                    </p>
                  )}
                  <p className="text-slate-600">
                    {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                    {order.shippingAddress.zipCode}
                  </p>
                  <p className="text-slate-600">
                    {order.shippingAddress.country}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">
                Order Summary
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-medium">
                    {formatPrice(order.subtotal || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span className="font-medium">
                    {formatPrice(order.shippingCost || 0)}
                  </span>
                </div>
                {order.shippingMethod && (
                  <div className="text-xs text-slate-500 pb-2 border-b border-slate-200">
                    Method: {order.shippingMethod}
                  </div>
                )}
                <div className="border-t-2 border-slate-200 pt-4 flex justify-between">
                  <span className="font-bold text-lg text-slate-900">
                    Total
                  </span>
                  <span className="font-bold text-xl text-slate-900">
                    {formatPrice(order.total || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <HiOutlineUser className="w-5 h-5" />
                Customer
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <HiOutlineUser className="w-4 h-4" />
                    <p className="text-xs font-medium uppercase tracking-wide">
                      Name
                    </p>
                  </div>
                  <p className="font-semibold text-slate-900">
                    {getCustomerName(order)}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <HiOutlineEnvelope className="w-4 h-4" />
                    <p className="text-xs font-medium uppercase tracking-wide">
                      Email
                    </p>
                  </div>
                  <p className="font-medium text-slate-700 break-all">
                    {getCustomerEmail(order)}
                  </p>
                </div>
                {order.customer?.phone && (
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <HiOutlinePhone className="w-4 h-4" />
                      <p className="text-xs font-medium uppercase tracking-wide">
                        Phone
                      </p>
                    </div>
                    <p className="font-medium text-slate-700">
                      {order.customer.phone}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <HiOutlineCreditCard className="w-5 h-5" />
                Payment
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">
                    Payment Method
                  </p>
                  <p className="font-semibold text-slate-900 capitalize">
                    {order.paymentMethod || "N/A"}
                  </p>
                </div>
                {order.razorpayOrderId && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">
                      Razorpay Order ID
                    </p>
                    <p className="font-mono text-xs text-slate-700 bg-slate-50 px-2 py-1.5 rounded border border-slate-200 break-all">
                      {order.razorpayOrderId}
                    </p>
                  </div>
                )}
                {order.razorpayPaymentId && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">
                      Payment ID
                    </p>
                    <p className="font-mono text-xs text-slate-700 bg-slate-50 px-2 py-1.5 rounded border border-slate-200 break-all">
                      {order.razorpayPaymentId}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <HiOutlineClock className="w-5 h-5" />
                Timeline
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="relative pl-6 border-l-2 border-slate-200">
                  <div className="absolute -left-1.5 top-0 w-3 h-3 bg-slate-900 rounded-full"></div>
                  <p className="text-sm font-semibold text-slate-900">
                    Order Placed
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                {order.updatedAt && order.updatedAt !== order.createdAt && (
                  <div className="relative pl-6 border-l-2 border-slate-200">
                    <div className="absolute -left-1.5 top-0 w-3 h-3 bg-slate-400 rounded-full"></div>
                    <p className="text-sm font-semibold text-slate-900">
                      Last Updated
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDate(order.updatedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
