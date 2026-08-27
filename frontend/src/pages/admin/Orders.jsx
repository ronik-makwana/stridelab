import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HiChevronLeft, HiChevronRight, HiOutlineEye } from "react-icons/hi2";
import { getAllOrders, updateOrderStatus } from "../../services/orderApi.js";
import { useConfirmModal } from "../../contexts/ConfirmModalContext.jsx";
import toast from "react-hot-toast";

const Orders = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showConfirm } = useConfirmModal();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    ordersPerPage: 50,
    hasNextPage: false,
    hasPrevPage: false,
  });

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [searchTerm, selectedStatus]);

  useEffect(() => {
    fetchOrders();
  }, [searchTerm, selectedStatus, currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getAllOrders(
        currentPage,
        searchTerm,
        selectedStatus
      );
      const data = response.data;
      setOrders(data.orders || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
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
        fetchOrders();
      } catch (error) {
        console.error("Error updating order status:", error);
        toast.error(
          error.response?.data?.message || "Failed to update order status"
        );
      }
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
    return order.razorpayOrderId || order._id.slice(-8).toUpperCase();
  };

  const getCustomerName = (order) => {
    if (order.customer) {
      return `${order.customer.firstName} ${order.customer.lastName}`;
    }
    if (order.user) {
      return `${order.user.firstName} ${order.user.lastName}`;
    }
    return "N/A";
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading orders...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-slate-600 mt-1">View and manage customer orders</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4 gap-4">
            <input
              type="text"
              placeholder="Search by order ID, customer name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">
                    Order ID
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">
                    Customer
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">
                    Items
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">
                    Total
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center py-12 text-slate-500"
                    >
                      {loading
                        ? "Loading orders..."
                        : searchTerm || selectedStatus !== "all"
                          ? "No orders match your search criteria."
                          : "No orders found."}
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order._id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">
                          #{getOrderId(order)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-slate-900">
                            {getCustomerName(order)}
                          </div>
                          <div className="text-sm text-slate-500">
                            {order.customer?.email ||
                              order.user?.email ||
                              "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {order.items?.length || 0} item
                        {order.items?.length !== 1 ? "s" : ""}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">
                          {formatPrice(order.total)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order._id, e.target.value)
                          }
                          className={`px-3 py-1.5 text-xs font-medium rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer ${getStatusColor(
                            order.status
                          )}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              navigate(`/admin/orders/${order._id}`)
                            }
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <HiOutlineEye className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-6">
              <div className="text-sm text-slate-600">
                Showing{" "}
                <span className="font-medium text-slate-900">
                  {(currentPage - 1) * pagination.ordersPerPage + 1}
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
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <HiChevronLeft className="w-4 h-4" />
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
                        <div key={page} className="flex items-center gap-1">
                          {showEllipsisBefore && (
                            <span className="px-2 text-slate-500">...</span>
                          )}
                          <button
                            onClick={() => handlePageChange(page)}
                            disabled={loading}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              currentPage === page
                                ? "bg-slate-900 text-white"
                                : "text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
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
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <HiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;
