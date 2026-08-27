import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlinePhoto,
  HiOutlinePlus,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi2";
import {
  getCollections,
  deleteCollection,
} from "../../services/collectionApi.js";
import { useConfirmModal } from "../../contexts/ConfirmModalContext.jsx";
import toast from "react-hot-toast";

const Collections = () => {
  const navigate = useNavigate();
  const { showConfirm } = useConfirmModal();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCollections: 0,
    collectionsPerPage: 50,
    hasNextPage: false,
    hasPrevPage: false,
  });

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [searchTerm, selectedType]);

  useEffect(() => {
    fetchCollections();
  }, [searchTerm, selectedType, currentPage]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const typeParam = selectedType === "all" ? null : selectedType;
      const response = await getCollections(currentPage, searchTerm, typeParam);
      const data = response.data;
      setCollections(data.collections || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error("Error fetching collections:", error);
      setCollections([]);
      toast.error("Failed to fetch collections");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      message: "Are you sure you want to delete this collection?",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (confirmed) {
      try {
        await deleteCollection(id);
        toast.success("Collection deleted successfully");
        fetchCollections();
      } catch (error) {
        console.error("Error deleting collection:", error);
        toast.error(
          error.response?.data?.message || "Failed to delete collection"
        );
      }
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Get product count for a collection (handles both manual and automatic)
  const getProductCount = (collection) => {
    // Backend now provides productCount for all collections
    if (collection.productCount !== undefined) {
      return collection.productCount;
    }
    // Fallback for backward compatibility
    return collection.products?.length ?? 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading collections...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Collections</h1>
          <p className="text-slate-600 mt-1">
            Organize products into collections
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/collections/create")}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          Add Collection
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4 gap-4">
            <input
              type="text"
              placeholder="Search collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white"
            >
              <option value="all">All Types</option>
              <option value="manual">Manual</option>
              <option value="automatic">Automatic</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">
                    Collection
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">
                    Products
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">
                    Description
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {collections.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="text-center py-12 text-slate-500"
                    >
                      {loading ? (
                        "Loading collections..."
                      ) : searchTerm || selectedType !== "all" ? (
                        "No collections match your search criteria."
                      ) : (
                        <div className="flex flex-col items-center">
                          <HiOutlinePlus className="w-12 h-12 text-slate-400 mb-4" />
                          <p className="text-slate-500 text-sm mb-2">
                            No collections yet
                          </p>
                          <button
                            onClick={() =>
                              navigate("/admin/collections/create")
                            }
                            className="text-sm text-slate-900 font-medium hover:text-slate-700"
                          >
                            Create your first collection
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  collections.map((collection) => (
                    <tr
                      key={collection._id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {collection.image ? (
                            <img
                              src={collection.image}
                              alt={collection.title}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                              <HiOutlinePhoto className="w-6 h-6 text-slate-400" />
                            </div>
                          )}
                          <div className="font-medium text-slate-900">
                            {collection.title}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            collection.type === "automatic"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {collection.type || "manual"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-600">
                          {getProductCount(collection)} product
                          {getProductCount(collection) !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-slate-600 line-clamp-2 max-w-md">
                          {collection.description || "No description"}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/admin/collections/edit/${collection._id}`
                              )
                            }
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <HiOutlinePencil className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(collection._id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <HiOutlineTrash className="w-5 h-5" />
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
                  {(currentPage - 1) * pagination.collectionsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-slate-900">
                  {Math.min(
                    currentPage * pagination.collectionsPerPage,
                    pagination.totalCollections
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium text-slate-900">
                  {pagination.totalCollections}
                </span>{" "}
                collections
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

export default Collections;
