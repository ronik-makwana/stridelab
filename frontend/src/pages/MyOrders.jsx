import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  HiShoppingBag,
  HiChevronLeft,
  HiChevronRight,
  HiMagnifyingGlass,
} from "react-icons/hi2";
import useAuthStore from "../store/authStore.js";
import { getOrders } from "../services/orderApi.js";
import { formatPrice } from "../utils/productUtils.js";
import { getColorHex } from "../utils/colorUtils.js";

const MyOrders = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    ordersPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [searchTerm, selectedStatuses]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, searchTerm, selectedStatuses, currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // If multiple statuses selected, join with comma; if none, pass null
      const statusFilter =
        selectedStatuses.length > 0 ? selectedStatuses.join(",") : null;
      const response = await getOrders(
        currentPage,
        searchTerm,
        statusFilter,
        10
      );
      const data = response.data;
      setOrders(data.orders || []);
      setPagination(data.pagination || pagination);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
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

  const hasActiveFilters = selectedStatuses.length > 0;

  const clearFilters = () => {
    setSelectedStatuses([]);
  };

  const toggleStatus = (status) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const statusOptions = [
    { value: "shipped", label: "On the way" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="w-full bg-white min-h-[calc(100vh-200px)]">
      <div className="mx-auto w-full max-w-7xl px-6 pt-12 pb-16 sm:px-10 xl:px-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
          <p className="mt-2 text-sm text-slate-600">
            View and track all your past orders
          </p>
        </div>

        {/* Main Content: Filters + Orders */}
        <div className="flex flex-col gap-8 lg:flex-row lg:min-h-[calc(100vh-300px)]">
          {/* Left Sidebar - Filters */}
          <aside className="w-full lg:w-80 lg:shrink-0">
            <div className="sticky top-24 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Filters
                </h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Status Filter with Checkboxes */}
              <div className="border-b border-slate-200 pb-4">
                <label className="mb-3 block text-sm font-semibold text-slate-900">
                  ORDER STATUS
                </label>
                <div className="mt-2 space-y-2">
                  {statusOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(option.value)}
                        onChange={() => toggleStatus(option.value)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Right Content - Orders List */}
          <div className="flex-1 min-w-0">
            {/* Search Bar */}
            <div className="mb-6 flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search your orders here"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      fetchOrders();
                    }
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <button
                onClick={fetchOrders}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <HiMagnifyingGlass className="h-5 w-5" />
                Search
              </button>
            </div>

            {loading && orders.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
                  <p className="mt-4 text-sm font-medium text-slate-500">
                    Loading orders...
                  </p>
                </div>
              </div>
            ) : orders.length > 0 ? (
              <>
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div
                      key={order._id}
                      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
                    >
                      <div className="mb-6 flex items-start justify-between border-b border-slate-200 pb-4">
                        <div>
                          <p className="text-lg font-semibold text-slate-900">
                            Order #{order._id?.slice(-8) || "N/A"}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )
                              : "Date not available"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status || "Unknown"}
                          </span>
                          <p className="mt-2 text-lg font-bold text-slate-900">
                            {formatPrice(order.total || 0)}
                          </p>
                        </div>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                            Order Items ({order.items.length})
                          </h3>
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4"
                            >
                              {item.product?.images?.[0] && (
                                <img
                                  src={item.product.images[0]}
                                  alt={item.product.title || "Product"}
                                  className="h-20 w-20 rounded-lg object-cover"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900">
                                  {item.product?.title || "Product"}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                                  <span>Quantity: {item.quantity || 1}</span>
                                  {item.size && (
                                    <span className="rounded bg-slate-200 px-2 py-1">
                                      Size: {item.size}
                                    </span>
                                  )}
                                  {item.color && (
                                    <div className="flex items-center gap-2">
                                      <span>Color:</span>
                                      <div
                                        className="h-4 w-4 rounded-full border border-slate-300"
                                        style={{
                                          backgroundColor: getColorHex(
                                            item.color
                                          ),
                                        }}
                                        title={item.color}
                                      />
                                      <span className="capitalize">
                                        {item.color}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {item.product?.slug && (
                                  <Link
                                    to={`/products/${item.product.slug}`}
                                    className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-700 hover:underline"
                                  >
                                    View Product
                                  </Link>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-slate-500">
                                  Item Total
                                </p>
                                <p className="mt-1 text-lg font-semibold text-slate-900">
                                  {formatPrice(
                                    (item.product?.discountedPrice ||
                                      item.product?.price ||
                                      0) * (item.quantity || 1)
                                  )}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {order.shippingAddress && (
                        <div className="mt-6 border-t border-slate-200 pt-6">
                          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
                            Shipping Address
                          </h3>
                          <div className="rounded-lg bg-slate-50 p-4">
                            <p className="text-sm text-slate-700">
                              {[
                                order.shippingAddress.address,
                                order.shippingAddress.apartment,
                                order.shippingAddress.city,
                                order.shippingAddress.state,
                                order.shippingAddress.zipCode,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </div>
                        </div>
                      )}

                      {order.paymentMethod && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                          <span className="font-medium">Payment Method:</span>
                          <span className="capitalize">
                            {order.paymentMethod}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row">
                    <div className="text-sm text-slate-600">
                      Showing{" "}
                      <span className="font-medium text-slate-900">
                        {orders.length > 0
                          ? (currentPage - 1) * pagination.ordersPerPage + 1
                          : 0}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium text-slate-900">
                        {Math.min(
                          currentPage * pagination.ordersPerPage,
                          pagination.totalOrders
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium text-slate-900">
                        {pagination.totalOrders}
                      </span>{" "}
                      orders
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!pagination.hasPrevPage || loading}
                        className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <HiChevronLeft className="h-4 w-4" />
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: pagination.totalPages },
                          (_, i) => i + 1
                        )
                          .filter((page) => {
                            // Show first page, last page, current page, and pages around current
                            if (page === 1) return true;
                            if (page === pagination.totalPages) return true;
                            if (Math.abs(page - currentPage) <= 1) return true;
                            return false;
                          })
                          .map((page, index, array) => {
                            // Add ellipsis if there's a gap
                            const showEllipsisBefore =
                              index > 0 && page - array[index - 1] > 1;
                            return (
                              <div
                                key={page}
                                className="flex items-center gap-1"
                              >
                                {showEllipsisBefore && (
                                  <span className="px-2 text-slate-500">
                                    ...
                                  </span>
                                )}
                                <button
                                  onClick={() => handlePageChange(page)}
                                  disabled={loading}
                                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                    currentPage === page
                                      ? "bg-slate-900 text-white"
                                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  {page}
                                </button>
                              </div>
                            );
                          })}
                      </div>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!pagination.hasNextPage || loading}
                        className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Next
                        <HiChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 py-16 text-center">
                <HiShoppingBag className="mx-auto h-16 w-16 text-slate-300" />
                <h3 className="mt-4 text-xl font-semibold text-slate-900">
                  {searchTerm || selectedStatuses.length > 0
                    ? "No orders match your search"
                    : "No orders yet"}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  {searchTerm || selectedStatuses.length > 0
                    ? "Try adjusting your search or filter criteria."
                    : "Start shopping to see your orders here!"}
                </p>
                {!searchTerm && selectedStatuses.length === 0 && (
                  <Link
                    to="/"
                    className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    Start Shopping
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyOrders;
