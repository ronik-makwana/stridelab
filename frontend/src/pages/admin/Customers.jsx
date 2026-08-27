import { useState, useEffect } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import { getAllUsers } from "../../services/userApi.js";
import toast from "react-hot-toast";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    usersPerPage: 50,
    hasNextPage: false,
    hasPrevPage: false,
  });

  useEffect(() => {
    // Reset to page 1 when search term changes
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm, currentPage]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await getAllUsers(currentPage, searchTerm);
      const data = response.data;
      setCustomers(data.users || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
      toast.error("Failed to fetch customers");
    } finally {
      setLoading(false);
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

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading customers...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-600 mt-1">
            View and manage your customer base
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4 gap-4">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">
                    Orders
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">
                    Total Spent
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="text-center py-12 text-slate-500"
                    >
                      {loading
                        ? "Loading customers..."
                        : searchTerm
                          ? "No customers match your search criteria."
                          : "No customers found."}
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr
                      key={customer._id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">
                          {customer.firstName} {customer.lastName}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {customer.email}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {customer.totalOrders || 0}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">
                          {formatPrice(customer.totalSpend || 0)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {formatDate(customer.createdAt)}
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
                  {(currentPage - 1) * pagination.usersPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-slate-900">
                  {Math.min(
                    currentPage * pagination.usersPerPage,
                    pagination.totalUsers
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium text-slate-900">
                  {pagination.totalUsers}
                </span>{" "}
                customers
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

export default Customers;
